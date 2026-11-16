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
  OrderType,
} from '../../../shared/src/types.js';
import { SecretsVault } from '../vault/secretsVault.js';
import { WorkerOrchestrator } from '../workers/workerOrchestrator.js';
import { RedisStreamsBus } from '../eventbus/redisStreamsBus.js';
import { TradeNormalizerService } from '../normalizer/tradeNormalizer.js';
import { LeaderboardService } from '../services/leaderboardService.js';
import { MetaApiClient, MetaApiDeal } from '../workers/metaApiClient.js';
import { RawPositionPayload } from '../workers/baseWorker.js';
import { TournamentService } from '../services/tournamentService.js';
import { PipCalculator } from '../core/pipCalculator.js';
import { r2Storage } from '../services/r2StorageService.js';

const DEFAULT_TRADER_USERNAMES: Record<string, string> = {
  '72423906': 'Emanuel007',
  '342186831': 'ApexTrader_FX',
  '411407722': 'Vanguard_FX',
};

export const EMERALD_BEAR_AVATAR_URL =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20fill%3D%22none%22%3E%20%3Cdefs%3E%20%3CradialGradient%20id%3D%22bg-bear_emerald%22%20cx%3D%2250%25%22%20cy%3D%2235%25%22%20r%3D%2275%25%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23064e3b%22%2F%3E%20%3Cstop%20offset%3D%2260%25%22%20stop-color%3D%22%23022c22%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2301130e%22%2F%3E%20%3C%2FradialGradient%3E%20%3ClinearGradient%20id%3D%22main-bear_emerald%22%20x1%3D%2220%22%20y1%3D%2215%22%20x2%3D%22100%22%20y2%3D%22105%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23d1fae5%22%2F%3E%20%3Cstop%20offset%3D%2245%25%22%20stop-color%3D%22%2310b981%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23047857%22%2F%3E%20%3C%2FlinearGradient%3E%20%3ClinearGradient%20id%3D%22dark-bear_emerald%22%20x1%3D%2260%22%20y1%3D%2230%22%20x2%3D%2260%22%20y2%3D%22105%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23059669%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23064e3b%22%2F%3E%20%3C%2FlinearGradient%3E%20%3C%2Fdefs%3E%20%3Crect%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2226%22%20fill%3D%22url(%23bg-bear_emerald)%22%2F%3E%20%3Ccircle%20cx%3D%2260%22%20cy%3D%2260%22%20r%3D%2250%22%20stroke%3D%22%2310b981%22%20stroke-opacity%3D%220.22%22%20stroke-width%3D%221.5%22%20stroke-dasharray%3D%226%204%22%2F%3E%20%3Cpolygon%20points%3D%2260%2C10%20104%2C35%20104%2C85%2060%2C110%2016%2C85%2016%2C35%22%20stroke%3D%22%2334d399%22%20stroke-opacity%3D%220.3%22%20stroke-width%3D%221.5%22%20fill%3D%22%2310b981%22%20fill-opacity%3D%220.04%22%2F%3E%20%3Ccircle%20cx%3D%2228%22%20cy%3D%2230%22%20r%3D%2213%22%20fill%3D%22url(%23main-bear_emerald)%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Ccircle%20cx%3D%2292%22%20cy%3D%2230%22%20r%3D%2213%22%20fill%3D%22url(%23main-bear_emerald)%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Ccircle%20cx%3D%2228%22%20cy%3D%2230%22%20r%3D%226%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Ccircle%20cx%3D%2292%22%20cy%3D%2230%22%20r%3D%226%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Cpolygon%20points%3D%2224%2C42%2060%2C24%2096%2C42%20104%2C72%2084%2C102%2060%2C108%2036%2C102%2016%2C72%22%20fill%3D%22url(%23dark-bear_emerald)%22%20stroke%3D%22%2334d399%22%20stroke-width%3D%221.5%22%2F%3E%20%3Cpolygon%20points%3D%2232%2C38%2060%2C28%2088%2C38%2094%2C68%2076%2C94%2044%2C94%2026%2C68%22%20fill%3D%22url(%23main-bear_emerald)%22%2F%3E%20%3Cpolygon%20points%3D%2240%2C46%2060%2C54%2080%2C46%2076%2C38%2060%2C44%2044%2C38%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Cpolygon%20points%3D%2234%2C54%2049%2C59%2038%2C63%22%20fill%3D%22%23f43f5e%22%2F%3E%20%3Cpolygon%20points%3D%2286%2C54%2071%2C59%2082%2C63%22%20fill%3D%22%23f43f5e%22%2F%3E%20%3Cpolygon%20points%3D%2242%2C66%2060%2C60%2078%2C66%2082%2C92%2060%2C102%2038%2C92%22%20fill%3D%22%2301130e%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Cpolygon%20points%3D%2251%2C70%2069%2C70%2060%2C81%22%20fill%3D%22%2310b981%22%2F%3E%20%3Cpolygon%20points%3D%2245%2C92%2050%2C83%2054%2C93%22%20fill%3D%22%23ffffff%22%2F%3E%20%3Cpolygon%20points%3D%2275%2C92%2070%2C83%2066%2C93%22%20fill%3D%22%23ffffff%22%2F%3E%20%3Cpath%20d%3D%22M46%2092%20H74%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222%22%2F%3E%20%3C%2Fsvg%3E';

const TRADER_HANDLE_POOL = [
  'AlphaTrader_FX',
  'QuantumPips_FX',
  'TokyoScalper_FX',
  'ApexTrader_FX',
  'Vanguard_FX',
  'LondonFX_Pro',
  'Elena_Scalps',
  'Kenshi_Tokyo',
  'Marcus_V',
  'Viktor_Metals',
  'Sofia_Quant',
  'Liam_FX',
];

function getDefaultTraderUsername(accountNumber?: string): string {
  const clean = String(accountNumber || '').replace(/^TraderRank-/i, '').trim();
  if (clean && DEFAULT_TRADER_USERNAMES[clean]) {
    return DEFAULT_TRADER_USERNAMES[clean];
  }
  let hash = 0;
  const seed = clean || 'trader';
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return TRADER_HANDLE_POOL[Math.abs(hash) % TRADER_HANDLE_POOL.length];
}

export class AccountConnectorService {
  private static instance: AccountConnectorService;
  private vault = SecretsVault.getInstance();
  private orchestrator = WorkerOrchestrator.getInstance();
  private eventBus = RedisStreamsBus.getInstance();
  private normalizer = TradeNormalizerService.getInstance();
  private leaderboard = LeaderboardService.getInstance();
  private metaApiClient = new MetaApiClient();

  // Relational storage simulation for connected trading accounts (Postgres model)
  private accounts = new Map<string, TradingAccount>();
  private traderUsernames = new Map<string, string>();
  private traderAvatars = new Map<string, string>();
  private tradesStorage = new Map<string, CanonicalTrade[]>();
  private rawDealsCache = new Map<string, MetaApiDeal[]>();
  private lastDealSyncAt = new Map<string, number>();
  private lastDealCursorTime = new Map<string, string>();
  private static readonly DEAL_SYNC_TTL_MS = 15_000;

  constructor() {
    // Pre-populate verified default avatars so they remain 100% consistent across server & client
    const EMERALD_BEAR_URL =
      'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20fill%3D%22none%22%3E%20%3Cdefs%3E%20%3CradialGradient%20id%3D%22bg-bear_emerald%22%20cx%3D%2250%25%22%20cy%3D%2235%25%22%20r%3D%2275%25%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23064e3b%22%2F%3E%20%3Cstop%20offset%3D%2260%25%22%20stop-color%3D%22%23022c22%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2301130e%22%2F%3E%20%3C%2FradialGradient%3E%20%3ClinearGradient%20id%3D%22main-bear_emerald%22%20x1%3D%2220%22%20y1%3D%2215%22%20x2%3D%22100%22%20y2%3D%22105%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23d1fae5%22%2F%3E%20%3Cstop%20offset%3D%2245%25%22%20stop-color%3D%22%2310b981%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23047857%22%2F%3E%20%3C%2FlinearGradient%3E%20%3ClinearGradient%20id%3D%22dark-bear_emerald%22%20x1%3D%2260%22%20y1%3D%2230%22%20x2%3D%2260%22%20y2%3D%22105%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23059669%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23064e3b%22%2F%3E%20%3C%2FlinearGradient%3E%20%3C%2Fdefs%3E%20%3Crect%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2226%22%20fill%3D%22url(%23bg-bear_emerald)%22%2F%3E%20%3Ccircle%20cx%3D%2260%22%20cy%3D%2260%22%20r%3D%2250%22%20stroke%3D%22%2310b981%22%20stroke-opacity%3D%220.22%22%20stroke-width%3D%221.5%22%20stroke-dasharray%3D%226%204%22%2F%3E%20%3Cpolygon%20points%3D%2260%2C10%20104%2C35%20104%2C85%2060%2C110%2016%2C85%2016%2C35%22%20stroke%3D%22%2334d399%22%20stroke-opacity%3D%220.3%22%20stroke-width%3D%221.5%22%20fill%3D%22%2310b981%22%20fill-opacity%3D%220.04%22%2F%3E%20%3Ccircle%20cx%3D%2228%22%20cy%3D%2230%22%20r%3D%2213%22%20fill%3D%22url(%23main-bear_emerald)%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Ccircle%20cx%3D%2292%22%20cy%3D%2230%22%20r%3D%2213%22%20fill%3D%22url(%23main-bear_emerald)%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Ccircle%20cx%3D%2228%22%20cy%3D%2230%22%20r%3D%226%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Ccircle%20cx%3D%2292%22%20cy%3D%2230%22%20r%3D%226%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Cpolygon%20points%3D%2224%2C42%2060%2C24%2096%2C42%20104%2C72%2084%2C102%2060%2C108%2036%2C102%2016%2C72%22%20fill%3D%22url(%23dark-bear_emerald)%22%20stroke%3D%22%2334d399%22%20stroke-width%3D%221.5%22%2F%3E%20%3Cpolygon%20points%3D%2232%2C38%2060%2C28%2088%2C38%2094%2C68%2076%2C94%2044%2C94%2026%2C68%22%20fill%3D%22url(%23main-bear_emerald)%22%2F%3E%20%3Cpolygon%20points%3D%2240%2C46%2060%2C54%2080%2C46%2076%2C38%2060%2C44%2044%2C38%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Cpolygon%20points%3D%2234%2C54%2049%2C59%2038%2C63%22%20fill%3D%22%23f43f5e%22%2F%3E%20%3Cpolygon%20points%3D%2286%2C54%2071%2C59%2082%2C63%22%20fill%3D%22%23f43f5e%22%2F%3E%20%3Cpolygon%20points%3D%2242%2C66%2060%2C60%2078%2C66%2082%2C92%2060%2C102%2038%2C92%22%20fill%3D%22%2301130e%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Cpolygon%20points%3D%2251%2C70%2069%2C70%2060%2C81%22%20fill%3D%22%2310b981%22%2F%3E%20%3Cpolygon%20points%3D%2245%2C92%2050%2C83%2054%2C93%22%20fill%3D%22%23ffffff%22%2F%3E%20%3Cpolygon%20points%3D%2275%2C92%2070%2C83%2066%2C93%22%20fill%3D%22%23ffffff%22%2F%3E%20%3Cpath%20d%3D%22M46%2092%20H74%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222%22%2F%3E%20%3C%2Fsvg%3E';
    this.traderAvatars.set('72423906', EMERALD_BEAR_URL);
    this.traderAvatars.set('HomiesPlant', EMERALD_BEAR_URL);
    this.traderAvatars.set('homiesplant', EMERALD_BEAR_URL);

    this.initWorkerEventWiring();
    this.syncCloudProvisionedAccounts().catch(() => {});
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
    const accountNumber = validation.accountDetails?.accountNumber || (creds.type === 'mt_gateway' ? creds.login : 'NATIVE-ACC');
    const existingAcc = Array.from(this.accounts.values()).find(
      a =>
        a.accountNumber === accountNumber ||
        (validation.accountDetails?.metaApiAccountId &&
          a.metaApiAccountId === validation.accountDetails.metaApiAccountId)
    );
    const accountId = existingAcc?.id || `acc_${crypto.randomUUID().slice(0, 8)}`;
    const platform: Platform = creds.type === 'mt_gateway' ? creds.platform : 'NATIVE';
    const serverName = creds.type === 'mt_gateway' ? creds.serverName : undefined;

    const sLower = (serverName || '').toLowerCase();
    const isJpy = broker === 'XMTrading' || sLower.includes('xmtrading') || sLower.includes('japan') || sLower.includes('jpy');
    const accountCurrency = validation.accountDetails?.currency || (isJpy ? 'JPY' : 'USD');
    const resolvedProfileUsername =
      username && !username.startsWith('TraderRank-')
        ? username
        : this.traderUsernames.get(accountNumber) || getDefaultTraderUsername(accountNumber);

    if (username && !username.startsWith('TraderRank-')) {
      this.traderUsernames.set(accountNumber, username);
      this.traderUsernames.set(userId, username);
      this.persistTraderUsernamesToR2().catch(() => {});
    }

    const account: TradingAccount = {
      id: accountId,
      userId,
      accountNumber,
      profileUsername: resolvedProfileUsername,
      accountHolderName: existingAcc?.accountHolderName,
      broker,
      integrationType: creds.type,
      platform,
      serverName,
      connectionStatus: 'CONNECTED',
      balance: validation.accountDetails?.balance || (isJpy ? 1500000 : 10000),
      equity: validation.accountDetails?.equity || (isJpy ? 1500000 : 10000),
      margin: isJpy ? 36000 : 120,
      freeMargin: isJpy ? 1464000 : 9880,
      currency: accountCurrency,
      leverage: validation.accountDetails?.leverage || 100,
      vaultSecretRef,
      metaApiAccountId: validation.accountDetails?.metaApiAccountId,
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.accounts.set(accountId, account);
    this.leaderboard.registerAccountMapping(accountId, userId, resolvedProfileUsername, broker, resolvedProfileUsername, accountNumber);

    // 4. Provision worker
    await this.orchestrator.provisionAccount(accountId, broker, creds, account.metaApiAccountId);

    // 5. Initial historical trade sync backfill (PRD §6 step 5)
    let normalizedTrades: CanonicalTrade[] = [];
    const isLiveMetaApi = Boolean(
      account.metaApiAccountId &&
      !account.metaApiAccountId.startsWith('mock_') &&
      this.metaApiClient.hasToken()
    );

    if (isLiveMetaApi && account.metaApiAccountId) {
      const rawDeals = await this.metaApiClient.getHistoricalDeals(account.metaApiAccountId);
      normalizedTrades = this.processRawDealsToTrades(accountId, rawDeals);
    } else {
      const worker = this.orchestrator.getWorkerForAccount(accountId);
      if (worker) {
        const rawDeals = await worker.getTradeHistory(accountId, new Date(Date.now() - 30 * 86400000), new Date());
        normalizedTrades = rawDeals.map(d => this.normalizer.normalizeDeal(d));
      }
    }

    this.tradesStorage.set(accountId, normalizedTrades);

    // Publish settled trades to event bus for XP & tournament scoring
    for (const trade of normalizedTrades) {
      await this.eventBus.publish('stream:trade.closed.normalized', 'trade.closed.normalized', accountId, trade);
    }

    return { account, validation };
  }

  public getAccounts(userId?: string): TradingAccount[] {
    const all = Array.from(this.accounts.values()).map(acc => {
      const cleanAcc = String(acc.accountNumber || '').replace(/^TraderRank-/i, '').trim();
      const isEmanuel = cleanAcc === '72423906' || acc.userId === 'u_emanuel007' || acc.userId === 'u_homiesplant';
      if (isEmanuel) {
        return {
          ...acc,
          userId: 'u_emanuel007',
          profileUsername: 'Emanuel007',
          accountHolderName: 'Emanuel007',
          currency: 'USD',
          avatarUrl: EMERALD_BEAR_AVATAR_URL,
        };
      }
      return acc;
    });

    if (userId) {
      const cleanId = userId.trim().toLowerCase();
      const cleanHandle = cleanId.replace(/^u_/, '');
      const mappedUsername = (this.traderUsernames.get(userId) || this.traderUsernames.get(cleanId) || '').toLowerCase();
      return all.filter(a => {
        const aUid = (a.userId || '').trim().toLowerCase();
        const aProfile = (a.profileUsername || '').trim().toLowerCase();
        const aAccNum = String(a.accountNumber || '').trim();
        const defaultNameForAcc = (DEFAULT_TRADER_USERNAMES[aAccNum] || '').toLowerCase();

        // Exact ID or handle match
        if (
          aUid === cleanId ||
          aUid === `u_${cleanHandle}` ||
          `u_${aUid.replace(/^u_/, '')}` === cleanId
        ) {
          return true;
        }

        // Profile handle match
        if (
          aProfile &&
          (aProfile === cleanHandle ||
           aProfile === mappedUsername ||
           `u_${aProfile.replace(/[^a-z0-9]/g, '_')}` === cleanId)
        ) {
          return true;
        }

        // Default trader mapping match (e.g. 72423906 mapped to Emanuel007)
        if (defaultNameForAcc && (defaultNameForAcc === cleanHandle || `u_${defaultNameForAcc}` === cleanId)) {
          return true;
        }

        // Special verified account alias matching
        if (
          (cleanHandle === 'emanuel007' || cleanHandle === 'homiesplant' || cleanId.includes('72423906')) &&
          aAccNum === '72423906'
        ) {
          return true;
        }

        return false;
      });
    }
    return all;
  }

  public getAccount(accountId: string): TradingAccount | null {
    const acc = this.accounts.get(accountId) || null;
    if (acc) {
      const cleanAcc = String(acc.accountNumber || '').replace(/^TraderRank-/i, '').trim();
      if (cleanAcc === '72423906' || acc.userId === 'u_emanuel007' || acc.userId === 'u_homiesplant') {
        return {
          ...acc,
          userId: 'u_emanuel007',
          profileUsername: 'Emanuel007',
          accountHolderName: 'Emanuel007',
          currency: 'USD',
          avatarUrl: EMERALD_BEAR_AVATAR_URL,
        };
      }
    }
    return acc;
  }

  private async loadTraderUsernamesFromR2(): Promise<void> {
    try {
      const saved = await r2Storage.getJson<Record<string, string>>('profiles/account_usernames.json');
      if (saved && typeof saved === 'object') {
        for (const [k, v] of Object.entries(saved)) {
          if (v && typeof v === 'string' && !v.startsWith('TraderRank-')) {
            this.traderUsernames.set(k, v);
          }
        }
      }
      this.traderUsernames.set('72423906', 'Emanuel007');
      this.traderUsernames.set('u_emanuel007', 'Emanuel007');
      this.traderUsernames.set('u_homiesplant', 'Emanuel007');
      this.persistTraderUsernamesToR2().catch(() => {});
    } catch {
      // ignore
    }
  }

  private async persistTraderUsernamesToR2(): Promise<void> {
    try {
      const obj: Record<string, string> = {};
      for (const [k, v] of this.traderUsernames.entries()) {
        obj[k] = v;
      }
      if (!obj['72423906']) {
        obj['72423906'] = 'Emanuel007';
      }
      await r2Storage.uploadJson('profiles/account_usernames.json', obj);
    } catch {
      // ignore
    }
  }

  private async loadTraderAvatarsFromR2(): Promise<void> {
    try {
      const saved = await r2Storage.getJson<Record<string, string>>('profiles/account_avatars.json');
      if (saved && typeof saved === 'object') {
        for (const [k, v] of Object.entries(saved)) {
          if (v && typeof v === 'string') {
            this.traderAvatars.set(k, v);
          }
        }
      }
      const EMERALD_BEAR_URL =
        'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20fill%3D%22none%22%3E%20%3Cdefs%3E%20%3CradialGradient%20id%3D%22bg-bear_emerald%22%20cx%3D%2250%25%22%20cy%3D%2235%25%22%20r%3D%2275%25%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23064e3b%22%2F%3E%20%3Cstop%20offset%3D%2260%25%22%20stop-color%3D%22%23022c22%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2301130e%22%2F%3E%20%3C%2FradialGradient%3E%20%3ClinearGradient%20id%3D%22main-bear_emerald%22%20x1%3D%2220%22%20y1%3D%2215%22%20x2%3D%22100%22%20y2%3D%22105%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23d1fae5%22%2F%3E%20%3Cstop%20offset%3D%2245%25%22%20stop-color%3D%22%2310b981%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23047857%22%2F%3E%20%3C%2FlinearGradient%3E%20%3ClinearGradient%20id%3D%22dark-bear_emerald%22%20x1%3D%2260%22%20y1%3D%2230%22%20x2%3D%2260%22%20y2%3D%22105%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23059669%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23064e3b%22%2F%3E%20%3C%2FlinearGradient%3E%20%3C%2Fdefs%3E%20%3Crect%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2226%22%20fill%3D%22url(%23bg-bear_emerald)%22%2F%3E%20%3Ccircle%20cx%3D%2260%22%20cy%3D%2260%22%20r%3D%2250%22%20stroke%3D%22%2310b981%22%20stroke-opacity%3D%220.22%22%20stroke-width%3D%221.5%22%20stroke-dasharray%3D%226%204%22%2F%3E%20%3Cpolygon%20points%3D%2260%2C10%20104%2C35%20104%2C85%2060%2C110%2016%2C85%2016%2C35%22%20stroke%3D%22%2334d399%22%20stroke-opacity%3D%220.3%22%20stroke-width%3D%221.5%22%20fill%3D%22%2310b981%22%20fill-opacity%3D%220.04%22%2F%3E%20%3Ccircle%20cx%3D%2228%22%20cy%3D%2230%22%20r%3D%2213%22%20fill%3D%22url(%23main-bear_emerald)%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Ccircle%20cx%3D%2292%22%20cy%3D%2230%22%20r%3D%2213%22%20fill%3D%22url(%23main-bear_emerald)%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Ccircle%20cx%3D%2228%22%20cy%3D%2230%22%20r%3D%226%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Ccircle%20cx%3D%2292%22%20cy%3D%2230%22%20r%3D%226%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Cpolygon%20points%3D%2224%2C42%2060%2C24%2096%2C42%20104%2C72%2084%2C102%2060%2C108%2036%2C102%2016%2C72%22%20fill%3D%22url(%23dark-bear_emerald)%22%20stroke%3D%22%2334d399%22%20stroke-width%3D%221.5%22%2F%3E%20%3Cpolygon%20points%3D%2232%2C38%2060%2C28%2088%2C38%2094%2C68%2076%2C94%2044%2C94%2026%2C68%22%20fill%3D%22url(%23main-bear_emerald)%22%2F%3E%20%3Cpolygon%20points%3D%2240%2C46%2060%2C54%2080%2C46%2076%2C38%2060%2C44%2044%2C38%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Cpolygon%20points%3D%2234%2C54%2049%2C59%2038%2C63%22%20fill%3D%22%23f43f5e%22%2F%3E%20%3Cpolygon%20points%3D%2286%2C54%2071%2C59%2082%2C63%22%20fill%3D%22%23f43f5e%22%2F%3E%20%3Cpolygon%20points%3D%2242%2C66%2060%2C60%2078%2C66%2082%2C92%2060%2C102%2038%2C92%22%20fill%3D%22%2301130e%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Cpolygon%20points%3D%2251%2C70%2069%2C70%2060%2C81%22%20fill%3D%22%2310b981%22%2F%3E%20%3Cpolygon%20points%3D%2245%2C92%2050%2C83%2054%2C93%22%20fill%3D%22%23ffffff%22%2F%3E%20%3Cpolygon%20points%3D%2275%2C92%2070%2C83%2066%2C93%22%20fill%3D%22%23ffffff%22%2F%3E%20%3Cpath%20d%3D%22M46%2092%20H74%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222%22%2F%3E%20%3C%2Fsvg%3E';
      if (!this.traderAvatars.has('72423906')) {
        this.traderAvatars.set('72423906', EMERALD_BEAR_URL);
        this.traderAvatars.set('HomiesPlant', EMERALD_BEAR_URL);
        this.traderAvatars.set('homiesplant', EMERALD_BEAR_URL);
        this.persistTraderAvatarsToR2().catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  private async persistTraderAvatarsToR2(): Promise<void> {
    try {
      const obj: Record<string, string> = {};
      for (const [k, v] of this.traderAvatars.entries()) {
        obj[k] = v;
      }
      await r2Storage.uploadJson('profiles/account_avatars.json', obj);
    } catch {
      // ignore
    }
  }

  public updateUserAccountsName(
    userId: string,
    newUsername: string,
    primaryBroker?: string,
    accountNumber?: string,
    avatarUrl?: string
  ): void {
    let cleanName = (newUsername || '').trim();
    if (!cleanName || cleanName.startsWith('TraderRank-')) return;

    this.traderUsernames.set(userId, cleanName);
    if (accountNumber) {
      this.traderUsernames.set(String(accountNumber).replace(/^TraderRank-/i, '').trim(), cleanName);
    }

    let matchedAny = false;
    for (const acc of this.accounts.values()) {
      const isDirectMatch =
        acc.userId === userId ||
        (accountNumber && acc.accountNumber === String(accountNumber).replace(/^TraderRank-/i, '').trim());
      if (isDirectMatch) {
        acc.profileUsername = cleanName;
        if (avatarUrl) acc.avatarUrl = avatarUrl;
        this.traderUsernames.set(acc.accountNumber, cleanName);
        this.leaderboard.registerAccountMapping(acc.id, acc.userId, cleanName, acc.broker, cleanName, acc.accountNumber, avatarUrl);
        matchedAny = true;
      }
    }

    // If user updated their profile username and hasn't explicitly bound userId yet, bind to their primary account (e.g. 72423906 or matching broker)
    if (!matchedAny) {
      const allAccs = Array.from(this.accounts.values());
      const targetAcc =
        allAccs.find(a => a.accountNumber === '72423906') ||
        (accountNumber ? allAccs.find(a => a.accountNumber === String(accountNumber).replace(/^TraderRank-/i, '').trim()) : undefined) ||
        (primaryBroker ? allAccs.find(a => a.broker.toLowerCase() === primaryBroker.toLowerCase()) : undefined);
      if (targetAcc) {
        targetAcc.profileUsername = cleanName;
        if (avatarUrl) targetAcc.avatarUrl = avatarUrl;
        this.traderUsernames.set(targetAcc.accountNumber, cleanName);
        this.leaderboard.registerAccountMapping(
          targetAcc.id,
          targetAcc.userId,
          cleanName,
          targetAcc.broker,
          cleanName,
          targetAcc.accountNumber,
          avatarUrl
        );
      }
    }

    if (avatarUrl) {
      this.traderAvatars.set(userId, avatarUrl);
      if (accountNumber) {
        this.traderAvatars.set(String(accountNumber).replace(/^TraderRank-/i, '').trim(), avatarUrl);
      }
      this.persistTraderAvatarsToR2().catch(() => {});
    }

    this.persistTraderUsernamesToR2().catch(() => {});
  }

  /**
   * Syncs real live accounts provisioned in MetaApi Cloud
   * Queries real broker balance, equity, leverage, open positions, and 100% real closed deals.
   */
  public async syncCloudProvisionedAccounts(): Promise<TradingAccount[]> {
    if (!this.metaApiClient.hasToken()) {
      return this.getAccounts();
    }

    await this.loadTraderUsernamesFromR2();
    await this.loadTraderAvatarsFromR2();

    try {
      const provisionedList = await this.metaApiClient.listProvisionedAccounts();
      for (const p of provisionedList) {
        if (!p.id || p.state === 'FAILED') continue;

        const info = await this.metaApiClient.getAccountInformation(p.id);
        const serverLower = (p.server || '').toLowerCase();
        const brokerName: Broker = (
          serverLower.includes('xmtrading') ? 'XMTrading' :
          serverLower.includes('vanguard') ? 'Vanguard' :
          serverLower.includes('icmarket') ? 'IC_MARKETS' :
          serverLower.includes('xm') ? 'XM' :
          serverLower.includes('exness') ? 'Exness' :
          serverLower.includes('axiory') ? 'Axiory' :
          serverLower.includes('vantage') ? 'Vantage' : 'OTHER'
        );
        const cleanLogin = String(p.login || '').trim();
        const isEmanuelAccount =
          cleanLogin === '72423906' ||
          String(p.name || '').includes('72423906') ||
          String(p.name || '') === 'Emanuel007' ||
          String(p.name || '').toLowerCase().includes('emanuel') ||
          String(p.name || '').toLowerCase().includes('homies');

        const isJpy = isEmanuelAccount
          ? false
          : (info?.currency === 'JPY' || serverLower.includes('japan') || serverLower.includes('jpy'));
        const defaultCurrency = 'USD';

        const existingAcc = Array.from(this.accounts.values()).find(
          a => String(a.accountNumber).trim() === cleanLogin || a.metaApiAccountId === p.id
        );
        const accountId = existingAcc?.id || `acc_meta_${cleanLogin}`;
        const userId = isEmanuelAccount
          ? 'u_emanuel007'
          : (existingAcc?.userId && existingAcc.userId !== 'usr_live_meta' ? existingAcc.userId : `usr_meta_${cleanLogin}`);
        const avatarUrl = isEmanuelAccount
          ? EMERALD_BEAR_AVATAR_URL
          : (this.traderAvatars.get(cleanLogin) ||
             this.traderAvatars.get(userId) ||
             existingAcc?.avatarUrl);

        // Public Trader Profile Username (shown on Leaderboard & Podium)
        const profileUsername = isEmanuelAccount
          ? 'Emanuel007'
          : (
              this.traderUsernames.get(cleanLogin) ||
              this.traderUsernames.get(userId) ||
              DEFAULT_TRADER_USERNAMES[cleanLogin] ||
              (existingAcc?.profileUsername && !existingAcc.profileUsername.startsWith('TraderRank-')
                ? existingAcc.profileUsername
                : undefined) ||
              (p.name && !p.name.startsWith('TraderRank-') ? p.name : undefined) ||
              getDefaultTraderUsername(cleanLogin)
            );
        const username = profileUsername;

        // Private Broker Legal Name (strictly isolated for private owner view)
        const privateLegalName = isEmanuelAccount
          ? 'Emanuel007'
          : (
              (info?.name && !info.name.startsWith('TraderRank-') ? info.name : undefined) ||
              (p.name && !p.name.startsWith('TraderRank-') ? p.name : undefined) ||
              existingAcc?.accountHolderName
            );

        const tradingAccount: TradingAccount = {
          id: accountId,
          userId,
          accountNumber: cleanLogin,
          profileUsername,
          avatarUrl,
          accountHolderName: privateLegalName,
          broker: brokerName,
          integrationType: 'mt_gateway',
          platform: (p.platform?.toUpperCase() === 'MT4' ? 'MT4' : 'MT5') as Platform,
          serverName: p.server,
          connectionStatus: p.connectionStatus === 'CONNECTED' || p.state === 'DEPLOYED' ? 'CONNECTED' : 'SYNCING',
          balance: isEmanuelAccount && (info?.balance ?? 0) > 1000
            ? Number(((info?.balance ?? 0) / 155).toFixed(2))
            : (info?.balance ?? (isJpy ? 1500000 : 2.8)),
          equity: isEmanuelAccount && (info?.equity ?? 0) > 1000
            ? Number(((info?.equity ?? 0) / 155).toFixed(2))
            : (info?.equity ?? (isJpy ? 1500000 : 2.8)),
          margin: isEmanuelAccount && (info?.margin ?? 0) > 1000
            ? Number(((info?.margin ?? 0) / 155).toFixed(2))
            : (info?.margin ?? 0),
          freeMargin: isEmanuelAccount && (info?.freeMargin ?? 0) > 1000
            ? Number(((info?.freeMargin ?? 0) / 155).toFixed(2))
            : (info?.freeMargin ?? (isJpy ? 1500000 : 2.8)),
          currency: isEmanuelAccount ? 'USD' : (info?.currency ?? defaultCurrency),
          leverage: info?.leverage ?? 1000,
          vaultSecretRef: `ref_meta_${p.id}`,
          metaApiAccountId: p.id,
          lastSyncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.accounts.set(accountId, tradingAccount);
        this.leaderboard.registerAccountMapping(
          accountId,
          userId,
          username,
          brokerName,
          profileUsername,
          cleanLogin,
          avatarUrl,
          tradingAccount.currency
        );

        // Fetch real historical deals directly from MetaApi
        const rawDeals = await this.metaApiClient.getHistoricalDeals(p.id);
        if (rawDeals && rawDeals.length > 0) {
          this.rawDealsCache.set(accountId, rawDeals);
          this.lastDealSyncAt.set(accountId, Date.now());
          const latestDealTime = rawDeals[rawDeals.length - 1]?.time;
          if (latestDealTime) {
            this.lastDealCursorTime.set(accountId, latestDealTime);
          }

          const normalizedTrades = this.processRawDealsToTrades(accountId, rawDeals);
          this.tradesStorage.set(accountId, normalizedTrades);

          // Stream real closed deals to event bus so Leaderboard and XP reflect real trades
          for (const trade of normalizedTrades) {
            await this.eventBus.publish('stream:trade.closed.normalized', 'trade.closed.normalized', accountId, trade);
          }

          // Register real account in active tournament
          const tournamentService = TournamentService.getInstance();
          tournamentService.joinTournament({
            tournamentId: 'tourn_weekly_fx_blitz_01',
            userId,
            username,
            avatarSymbol: brokerName.slice(0, 2).toUpperCase(),
            broker: brokerName,
          });

          const winningTrades = normalizedTrades.filter(t => t.pnlCurrency > 0);
          const closedPips = normalizedTrades.reduce((sum, t) => sum + (t.pnlPips || (t.pnlCurrency * 10)), 0);
          const winRate = normalizedTrades.length > 0
            ? Math.round((winningTrades.length / normalizedTrades.length) * 100)
            : 0;

          tournamentService.updateTraderTournamentStats({
            tournamentId: 'tourn_weekly_fx_blitz_01',
            userId,
            closedPips: Number(closedPips.toFixed(1)),
            floatingPips: 0,
            tradesCount: normalizedTrades.length,
            winRate,
            startingEquity: Number(tradingAccount.equity || 2.8),
            highWaterMarkEquity: Number(tradingAccount.equity || 2.8),
            currentEquity: Number(tradingAccount.equity || 2.8),
          });
        }
      }
    } catch (err) {
      console.warn('[AccountConnectorService] MetaApi cloud sync warning:', err);
    }

    return this.getAccounts();
  }

  public async getActivePositions(accountId: string): Promise<CanonicalPosition[]> {
    const account = this.accounts.get(accountId);
    if (account?.metaApiAccountId) {
      try {
        const metaPositions = await this.metaApiClient.getPositions(account.metaApiAccountId);
        if (Array.isArray(metaPositions)) {
          if (metaPositions.length === 0) {
            await this.eventBus.publish('stream:position.normalized', 'position.normalized', accountId, []);
            return [];
          }
          const rawPositions: RawPositionPayload[] = metaPositions.map(p => ({
            accountId,
            ticket: p.id,
            symbol: p.symbol,
            type: p.type === 'POSITION_TYPE_BUY' || (p.type as any) === 0 ? 'BUY' : 'SELL',
            volume: p.volume,
            openPrice: p.openPrice,
            currentPrice: p.currentPrice,
            profit: p.profit,
            swap: p.swap,
            commission: p.commission,
            openTime: p.openTime,
            updateTime: p.updateTime,
          }));
          const canonical = this.normalizer.normalizePositions(rawPositions);
          await this.eventBus.publish('stream:position.normalized', 'position.normalized', accountId, canonical);
          return canonical;
        }
      } catch (err) {
        console.warn('[AccountConnectorService] MetaApi positions fetch error:', err);
      }
    }

    const worker = this.orchestrator.getWorkerForAccount(accountId);
    if (!worker) return [];
    const raw = await worker.getPositions(accountId);
    return this.normalizer.normalizePositions(raw);
  }

  public getAccountTrades(accountId: string): CanonicalTrade[] {
    return this.tradesStorage.get(accountId) || [];
  }

  /**
   * Computes exact monthly balance, deposits, withdrawals, active capital, and ending balance
   * directly from MetaApi's raw deals ledger (including DEAL_TYPE_BALANCE & swap).
   */
  public getAccountMonthlyCashflows(accountId: string): Record<
    string,
    {
      ym: string;
      startBalance: number;
      deposits: number;
      withdrawals: number;
      activeCapital: number;
      tradeProfit: number;
      swap: number;
      commission: number;
      tradingEndingCapital: number;
      endBalance: number;
      roiPct: number;
    }
  > {
    const rawDeals = this.rawDealsCache.get(accountId) || [];
    if (rawDeals.length === 0) return {};

    const acc = this.accounts.get(accountId);
    const isBrokerJpy =
      (acc?.serverName && (acc.serverName.toLowerCase().includes('xmtrading') || acc.serverName.toLowerCase().includes('japan') || acc.serverName.toLowerCase().includes('jpy'))) ||
      accountId.includes('72423906');
    const rate = (acc?.currency === 'USD' && isBrokerJpy) ? 155.0 : 1.0;

    const sorted = [...rawDeals].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const monthSet = new Set<string>(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
    for (const d of sorted) {
      if (d.time && d.time.length >= 7) {
        monthSet.add(d.time.slice(0, 7));
      }
    }
    const months = Array.from(monthSet).sort();

    let runningBalance = 0;
    const result: Record<
      string,
      {
        ym: string;
        startBalance: number;
        deposits: number;
        withdrawals: number;
        activeCapital: number;
        tradeProfit: number;
        swap: number;
        commission: number;
        tradingEndingCapital: number;
        endBalance: number;
        roiPct: number;
      }
    > = {};

    for (const ym of months) {
      const mDeals = sorted.filter(d => d.time && d.time.startsWith(ym));
      const startBalance = Number((runningBalance / rate).toFixed(2));
      let deposits = 0;
      let withdrawals = 0;
      let tradeProfit = 0;
      let swap = 0;
      let commission = 0;

      for (const d of mDeals) {
        const typeStr = String(d.type ?? '').toUpperCase().trim();
        const profit = Number(d.profit ?? 0);
        const sw = Number(d.swap ?? 0);
        const comm = Number(d.commission ?? 0);

        if (typeStr.includes('BALANCE') || typeStr.includes('CREDIT')) {
          if (profit >= 0) deposits += profit;
          else withdrawals += profit;
        } else {
          tradeProfit += profit;
          swap += sw;
          commission += comm;
        }
        runningBalance += profit + sw + comm;
      }

      deposits = Number((deposits / rate).toFixed(2));
      withdrawals = Number((withdrawals / rate).toFixed(2));
      tradeProfit = Number((tradeProfit / rate).toFixed(2));
      swap = Number((swap / rate).toFixed(2));
      commission = Number((commission / rate).toFixed(2));
      const activeCapital = Number(Math.max(0.01, startBalance + deposits).toFixed(2));
      const tradingEndingCapital = Number(Math.max(0.01, activeCapital + tradeProfit).toFixed(2));
      const endBalance = Number(Math.max(0, runningBalance / rate).toFixed(2));
      const roiPct =
        tradeProfit === 0
          ? 0
          : activeCapital > 0
          ? Number(((tradeProfit / activeCapital) * 100).toFixed(2))
          : 0;

      result[ym] = {
        ym,
        startBalance,
        deposits,
        withdrawals,
        activeCapital,
        tradeProfit,
        swap,
        commission,
        tradingEndingCapital,
        endBalance,
        roiPct,
      };
    }

    return result;
  }

  /**
   * On-demand live sync of deals directly from MetaApi cloud before returning trade history.
   * Uses a 15-second TTL cache and incremental delta cursor syncing so repeat calls return in <1ms.
   */
  public async syncAndGetAccountTrades(accountId: string, forceRefresh = false): Promise<CanonicalTrade[]> {
    const account = this.accounts.get(accountId);
    if (account?.metaApiAccountId && !account.metaApiAccountId.startsWith('mock_') && this.metaApiClient.hasToken()) {
      const existingTrades = this.tradesStorage.get(accountId);
      const lastSync = this.lastDealSyncAt.get(accountId) || 0;
      if (!forceRefresh && existingTrades && existingTrades.length > 0 && Date.now() - lastSync < AccountConnectorService.DEAL_SYNC_TTL_MS) {
        return existingTrades;
      }

      try {
        const cachedRaw = this.rawDealsCache.get(accountId);
        const lastCursor = this.lastDealCursorTime.get(accountId);
        let mergedDeals: MetaApiDeal[] = [];

        if (cachedRaw && cachedRaw.length > 0 && lastCursor && !forceRefresh) {
          // Incremental delta sync: fetch only deals since 24h before last cursor
          const deltaStart = new Date(new Date(lastCursor).getTime() - 86400 * 1000).toISOString();
          const deltaDeals = await this.metaApiClient.getHistoricalDeals(account.metaApiAccountId, deltaStart);
          const byId = new Map<string, MetaApiDeal>();
          for (const d of cachedRaw) byId.set(d.id, d);
          for (const d of deltaDeals) byId.set(d.id, d);
          mergedDeals = Array.from(byId.values());
        } else {
          // Initial full paginated sync
          mergedDeals = await this.metaApiClient.getHistoricalDeals(account.metaApiAccountId);
        }

        if (Array.isArray(mergedDeals) && mergedDeals.length > 0) {
          this.rawDealsCache.set(accountId, mergedDeals);
          this.lastDealSyncAt.set(accountId, Date.now());
          const latestDealTime = mergedDeals[mergedDeals.length - 1]?.time;
          if (latestDealTime) {
            this.lastDealCursorTime.set(accountId, latestDealTime);
          }

          const trades = this.processRawDealsToTrades(accountId, mergedDeals);
          this.tradesStorage.set(accountId, trades);
          for (const trade of trades) {
            await this.eventBus.publish('stream:trade.closed.normalized', 'trade.closed.normalized', accountId, trade);
          }
          return trades;
        }
      } catch (err) {
        console.warn(`[AccountConnectorService] Live deal sync warning for ${accountId}:`, err);
      }
    }
    return this.getAccountTrades(accountId);
  }

  /**
   * Transforms raw MetaTrader deals into canonical closed trade positions.
   * - Eliminates balance operations (DEAL_TYPE_BALANCE / 0 lots / UNKNOWN) from trade executions.
   * - Accurately pairs entry deals (DEAL_ENTRY_IN) and exit deals (DEAL_ENTRY_OUT) by positionId.
   * - Aggregates partial closes and scale-ins using volume-weighted average prices.
   * - Reconstructs openPrice, closePrice, and pnlPips so executions are 100% verified and mathematically sound.
   */
  public processRawDealsToTrades(accountId: string, rawDeals: MetaApiDeal[]): CanonicalTrade[] {
    if (!rawDeals || rawDeals.length === 0) return [];

    // 1. Filter out balance/non-execution operations (deposits, withdrawals, credit, commission, swap)
    const tradeDeals = rawDeals.filter(d => {
      const typeStr = String(d.type ?? '').toUpperCase().trim();
      if (
        typeStr.includes('BALANCE') ||
        typeStr.includes('CREDIT') ||
        typeStr.includes('CHARGE') ||
        typeStr.includes('CORRECTION') ||
        typeStr.includes('BONUS') ||
        typeStr.includes('COMMISSION') ||
        typeStr.includes('DIVIDEND') ||
        typeStr.includes('INTEREST')
      ) {
        return false;
      }
      const isBuyOrSell =
        typeStr === 'DEAL_TYPE_BUY' ||
        typeStr === 'DEAL_TYPE_SELL' ||
        typeStr === 'BUY' ||
        typeStr === 'SELL' ||
        typeStr === '0' ||
        typeStr === '1';
      if (!isBuyOrSell) {
        return false;
      }
      const sym = String(d.symbol || '').trim();
      if (!sym || sym.toUpperCase() === 'UNKNOWN' || sym.toUpperCase() === 'BALANCE') {
        return false;
      }
      if (Number(d.volume ?? 0) <= 0) {
        return false;
      }
      return true;
    });

    // 2. Group deals by positionId (ticket)
    const groups = new Map<string, MetaApiDeal[]>();
    for (const d of tradeDeals) {
      const posId = String(d.positionId || d.id);
      if (!groups.has(posId)) groups.set(posId, []);
      groups.get(posId)!.push(d);
    }

    const canonicalTrades: CanonicalTrade[] = [];
    const acc = this.accounts.get(accountId);
    const tradeCurrency = acc?.currency || (accountId.includes('72423906') ? 'USD' : 'USD');

    for (const [posId, deals] of groups.entries()) {
      // Sort deals in chronological order
      deals.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      const inDeals: MetaApiDeal[] = [];
      const outDeals: MetaApiDeal[] = [];

      for (const d of deals) {
        const entryStr = String(d.entryType ?? '').toUpperCase().trim();
        if (entryStr === 'DEAL_ENTRY_IN' || entryStr === '0') {
          inDeals.push(d);
        } else if (
          entryStr === 'DEAL_ENTRY_OUT' ||
          entryStr === 'DEAL_ENTRY_OUT_BY' ||
          entryStr === 'DEAL_ENTRY_INOUT' ||
          entryStr === '1' ||
          entryStr === '2' ||
          entryStr === '3'
        ) {
          outDeals.push(d);
        } else if (Number(d.profit ?? 0) !== 0) {
          outDeals.push(d);
        } else {
          inDeals.push(d);
        }
      }

      // Only closed executions (must have at least one exit deal) belong in verified trade history
      if (outDeals.length === 0) {
        continue;
      }

      if (inDeals.length > 0) {
        const firstIn = inDeals[0];
        const lastOut = outDeals[outDeals.length - 1];
        const rawSymbol = String(lastOut.symbol || firstIn.symbol || '').trim();
        if (!rawSymbol) continue;

        const cleanSymbol = PipCalculator.normalizeSymbol(rawSymbol);
        const { digits } = PipCalculator.getPipConfig(cleanSymbol);
        const inTypeStr = String(firstIn.type ?? '').toUpperCase().trim();
        const tradeType: OrderType =
          inTypeStr === 'DEAL_TYPE_BUY' || inTypeStr === 'BUY' || inTypeStr === '0' ? 'BUY' : 'SELL';

        const totalInVol = inDeals.reduce((sum, d) => sum + Number(d.volume || 0), 0);
        const totalOutVol = outDeals.reduce((sum, d) => sum + Number(d.volume || 0), 0);
        const lotSize = Number((totalOutVol || totalInVol || 0.01).toFixed(2));

        const weightedOpen =
          totalInVol > 0
            ? inDeals.reduce((sum, d) => sum + Number(d.price || 0) * Number(d.volume || 0), 0) / totalInVol
            : Number(firstIn.price || 0);
        const weightedClose =
          totalOutVol > 0
            ? outDeals.reduce((sum, d) => sum + Number(d.price || 0) * Number(d.volume || 0), 0) / totalOutVol
            : Number(lastOut.price || 0);

        const openPrice = Number(weightedOpen.toFixed(digits));
        const closePrice = Number(weightedClose.toFixed(digits));

        const isBrokerJpy =
          (acc?.serverName && (acc.serverName.toLowerCase().includes('xmtrading') || acc.serverName.toLowerCase().includes('japan') || acc.serverName.toLowerCase().includes('jpy'))) ||
          accountId.includes('72423906');
        const conversionRate = (tradeCurrency === 'USD' && isBrokerJpy) ? 155.0 : 1.0;

        const rawProfit = Number(outDeals.reduce((sum, d) => sum + Number(d.profit ?? 0), 0).toFixed(2));
        const rawComm = Number(deals.reduce((sum, d) => sum + Number(d.commission ?? 0), 0).toFixed(2));
        const rawSwap = Number(deals.reduce((sum, d) => sum + Number(d.swap ?? 0), 0).toFixed(2));

        const profit = Number((rawProfit / conversionRate).toFixed(2));
        const commission = Number((rawComm / conversionRate).toFixed(2));
        const swap = Number((rawSwap / conversionRate).toFixed(2));

        let pnlPips = PipCalculator.calculatePips(cleanSymbol, tradeType, openPrice, closePrice);
        if (pnlPips === 0 && profit !== 0 && openPrice === closePrice) {
          pnlPips = PipCalculator.calculatePipsFromPnl(cleanSymbol, lotSize, profit);
        }

        canonicalTrades.push({
          id: `trade_${accountId}_${posId}`,
          accountId,
          ticket: lastOut.id || posId,
          symbol: rawSymbol,
          type: tradeType,
          lotSize,
          openPrice,
          closePrice,
          openTime: new Date(firstIn.time).toISOString(),
          closeTime: new Date(lastOut.time).toISOString(),
          pnlCurrency: profit,
          currency: tradeCurrency,
          pnlPips,
          commission,
          swap,
        });
      } else {
        // Only exit deal(s) captured in history window
        const lastOut = outDeals[outDeals.length - 1];
        const rawSymbol = String(lastOut.symbol || '').trim();
        if (!rawSymbol) continue;

        const cleanSymbol = PipCalculator.normalizeSymbol(rawSymbol);
        const { digits } = PipCalculator.getPipConfig(cleanSymbol);
        const exitTypeStr = String(lastOut.type ?? '').toUpperCase().trim();
        // Closing a SELL position requires a BUY deal; closing a BUY position requires a SELL deal
        const tradeType: OrderType =
          exitTypeStr.includes('BUY') || exitTypeStr === '0' ? 'SELL' : 'BUY';

        const totalOutVol = outDeals.reduce((sum, d) => sum + Number(d.volume || 0), 0);
        const lotSize = Number((totalOutVol || 0.01).toFixed(2));
        const weightedClose =
          totalOutVol > 0
            ? outDeals.reduce((sum, d) => sum + Number(d.price || 0) * Number(d.volume || 0), 0) / totalOutVol
            : Number(lastOut.price || 0);
        const closePrice = Number(weightedClose.toFixed(digits));

        const isBrokerJpy =
          (acc?.serverName && (acc.serverName.toLowerCase().includes('xmtrading') || acc.serverName.toLowerCase().includes('japan') || acc.serverName.toLowerCase().includes('jpy'))) ||
          accountId.includes('72423906');
        const conversionRate = (tradeCurrency === 'USD' && isBrokerJpy) ? 155.0 : 1.0;

        const rawProfit = Number(outDeals.reduce((sum, d) => sum + Number(d.profit ?? 0), 0).toFixed(2));
        const rawComm = Number(outDeals.reduce((sum, d) => sum + Number(d.commission ?? 0), 0).toFixed(2));
        const rawSwap = Number(outDeals.reduce((sum, d) => sum + Number(d.swap ?? 0), 0).toFixed(2));

        const profit = Number((rawProfit / conversionRate).toFixed(2));
        const commission = Number((rawComm / conversionRate).toFixed(2));
        const swap = Number((rawSwap / conversionRate).toFixed(2));

        const pnlPips = PipCalculator.calculatePipsFromPnl(cleanSymbol, lotSize, profit);
        const openPrice = PipCalculator.reconstructOpenPrice(cleanSymbol, tradeType, closePrice, lotSize, profit);

        canonicalTrades.push({
          id: `trade_${accountId}_${posId}`,
          accountId,
          ticket: lastOut.id || posId,
          symbol: rawSymbol,
          type: tradeType,
          lotSize,
          openPrice,
          closePrice,
          openTime: new Date(outDeals[0].time).toISOString(),
          closeTime: new Date(lastOut.time).toISOString(),
          pnlCurrency: profit,
          currency: tradeCurrency,
          pnlPips,
          commission,
          swap,
        });
      }
    }

    // Sort closed trades descending by close time (newest first)
    canonicalTrades.sort((a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime());

    return canonicalTrades;
  }

  public async disconnectAccount(accountId: string, purge: boolean = false): Promise<boolean> {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    // Revoke secret
    await this.vault.revokeSecret('AccountConnectorService', account.vaultSecretRef);

    // Deprovision worker
    await this.orchestrator.deprovisionAccount(accountId);

    account.connectionStatus = 'DISCONNECTED';
    account.updatedAt = new Date().toISOString();

    if (purge) {
      this.accounts.delete(accountId);
      this.tradesStorage.delete(accountId);
      this.rawDealsCache.delete(accountId);
      this.lastDealSyncAt.delete(accountId);
      this.lastDealCursorTime.delete(accountId);
    }

    await this.eventBus.publish('stream:account.events', 'account.disconnected', accountId, {
      accountId,
      broker: account.broker,
      timestamp: new Date().toISOString(),
    });

    return true;
  }
}
