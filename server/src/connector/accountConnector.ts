/**
 * TraderRank Account Connector Service
 * Owns the "connect trading account" workflow per PRD §5, §6 & Infrastructure Design §3.1.
 * Writes credentials directly to Secrets Vault and references them in application database.
 */

import crypto from 'crypto';
import {
  Broker,
  IntegrationType,
  Platform,
  TradingAccount,
  AccountCredentials,
  ValidationResult,
  CanonicalPosition,
  CanonicalTrade,
} from '../../../shared/src/types.js';
import { SecretsVault } from '../vault/secretsVault.js';
import { WorkerOrchestrator } from '../workers/workerOrchestrator.js';
import { RedisStreamsBus } from '../eventbus/redisStreamsBus.js';
import { TradeNormalizerService } from '../normalizer/tradeNormalizer.js';
import { LeaderboardService } from '../services/leaderboardService.js';

export class AccountConnectorService {
  private static instance: AccountConnectorService;
  private vault = SecretsVault.getInstance();
  private orchestrator = WorkerOrchestrator.getInstance();
  private eventBus = RedisStreamsBus.getInstance();
  private normalizer = TradeNormalizerService.getInstance();
  private leaderboard = LeaderboardService.getInstance();

  // Relational storage simulation for connected trading accounts (Postgres model)
  private accounts = new Map<string, TradingAccount>();
  private tradesStorage = new Map<string, CanonicalTrade[]>();

  constructor() {
    this.initWorkerEventWiring();
  }

  public static getInstance(): AccountConnectorService {
    if (!AccountConnectorService.instance) {
      AccountConnectorService.instance = new AccountConnectorService();
    }
    return AccountConnectorService.instance;
  }

  private initWorkerEventWiring(): void {
    // Wire all workers into the Event Bus
    this.orchestrator.getAllWorkers().forEach(worker => {
      worker.onPositionUpdates(rawPositions => {
        if (rawPositions.length > 0) {
          const accountId = rawPositions[0].accountId;
          this.eventBus.publish('stream:position.raw', 'position.updated.raw', accountId, rawPositions);
        }
      });

      worker.onTradeClosed(rawDeal => {
        this.eventBus.publish('stream:trade.closed.raw', 'trade.closed.raw', rawDeal.accountId, rawDeal);
      });
    });
  }

  /**
   * Pre-flight credential validation (PRD §6 step 4).
   */
  public async validateCredentials(broker: Broker, creds: AccountCredentials): Promise<ValidationResult> {
    return this.orchestrator.validateCredentials(broker, creds);
  }

  /**
   * Connects a new trading account:
   * 1. Validates credentials synchronously.
   * 2. Encrypts credentials in isolated Secrets Vault.
   * 3. Stores clean metadata record in accounts store.
   * 4. Provisions worker and begins backfill & stream.
   */
  public async connectAccount(
    userId: string,
    username: string,
    broker: Broker,
    creds: AccountCredentials
  ): Promise<{ account: TradingAccount; validation: ValidationResult }> {
    // 1. Synchronous validation
    const validation = await this.validateCredentials(broker, creds);
    if (!validation.success) {
      throw new Error(validation.error || 'Connection validation failed');
    }

    // 2. Encrypt in Secrets Vault
    const vaultSecretRef = await this.vault.storeSecret('AccountConnectorService', creds);

    // 3. Create sanitized TradingAccount metadata record (no credentials!)
    const accountId = `acc_${crypto.randomUUID().slice(0, 8)}`;
    const platform: Platform = creds.type === 'mt_gateway' ? creds.platform : 'NATIVE';
    const serverName = creds.type === 'mt_gateway' ? creds.serverName : undefined;
    const accountNumber = validation.accountDetails?.accountNumber || (creds.type === 'mt_gateway' ? creds.login : 'NATIVE-ACC');

    const account: TradingAccount = {
      id: accountId,
      userId,
      accountNumber,
      broker,
      integrationType: creds.type,
      platform,
      serverName,
      connectionStatus: 'CONNECTED',
      balance: validation.accountDetails?.balance || 10000,
      equity: validation.accountDetails?.equity || 10000,
      margin: 120,
      freeMargin: 9880,
      currency: validation.accountDetails?.currency || 'USD',
      leverage: validation.accountDetails?.leverage || 100,
      vaultSecretRef,
      metaApiAccountId: validation.accountDetails?.metaApiAccountId,
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.accounts.set(accountId, account);
    this.leaderboard.registerAccountMapping(accountId, userId, username, broker);

    // 4. Provision worker
    await this.orchestrator.provisionAccount(accountId, broker, creds);

    // 5. Initial historical trade sync backfill (PRD §6 step 5)
    const worker = this.orchestrator.getWorkerForAccount(accountId);
    if (worker) {
      const rawDeals = await worker.getTradeHistory(accountId, new Date(Date.now() - 30 * 86400000), new Date());
      const normalizedTrades = rawDeals.map(d => this.normalizer.normalizeDeal(d));
      this.tradesStorage.set(accountId, normalizedTrades);

      // Publish settled trades to event bus for XP & tournament scoring
      for (const trade of normalizedTrades) {
        await this.eventBus.publish('stream:trade.closed.normalized', 'trade.closed.normalized', accountId, trade);
      }
    }

    return { account, validation };
  }

  public getAccounts(userId?: string): TradingAccount[] {
    const all = Array.from(this.accounts.values());
    if (userId) {
      return all.filter(a => a.userId === userId);
    }
    return all;
  }

  public getAccount(accountId: string): TradingAccount | null {
    return this.accounts.get(accountId) || null;
  }

  public async getActivePositions(accountId: string): Promise<CanonicalPosition[]> {
    const worker = this.orchestrator.getWorkerForAccount(accountId);
    if (!worker) return [];
    const raw = await worker.getPositions(accountId);
    return this.normalizer.normalizePositions(raw);
  }

  public getAccountTrades(accountId: string): CanonicalTrade[] {
    return this.tradesStorage.get(accountId) || [];
  }

  public async disconnectAccount(accountId: string): Promise<boolean> {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    // Revoke secret
    await this.vault.revokeSecret('AccountConnectorService', account.vaultSecretRef);

    // Deprovision worker
    await this.orchestrator.deprovisionAccount(accountId);

    account.connectionStatus = 'DISCONNECTED';
    account.updatedAt = new Date().toISOString();

    await this.eventBus.publish('stream:account.events', 'account.disconnected', accountId, {
      accountId,
      broker: account.broker,
      timestamp: new Date().toISOString(),
    });

    return true;
  }
}
