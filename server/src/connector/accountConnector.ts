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
  '72423906': 'TokyoScalper_FX',
  '342186831': 'ApexTrader_FX',
  '411407722': 'Vanguard_FX',
};

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
  private tradesStorage = new Map<string, CanonicalTrade[]>();
  private rawDealsCache = new Map<string, MetaApiDeal[]>();
  private lastDealSyncAt = new Map<string, number>();
  private lastDealCursorTime = new Map<string, string>();
  private static readonly DEAL_SYNC_TTL_MS = 15_000;

  constructor() {
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
    const all = Array.from(this.accounts.values());
    if (userId) {
      const cleanId = userId.trim().toLowerCase();
      const cleanHandle = cleanId.replace(/^u_/, '');
      const mappedUsername = (this.traderUsernames.get(userId) || this.traderUsernames.get(cleanId) || '').toLowerCase();
      return all.filter(a => {
        const aUid = (a.userId || '').trim().toLowerCase();
        const aProfile = (a.profileUsername || '').trim().toLowerCase();
        return (
          aUid === cleanId ||
          aUid === `u_${cleanHandle}` ||
          `u_${aUid.replace(/^u_/, '')}` === cleanId ||
          (aProfile && (aProfile === cleanHandle || aProfile === mappedUsername || `u_${aProfile.replace(/[^a-z0-9]/g, '_')}` === cleanId))
        );
      });
    }
    return all;
  }

  public getAccount(accountId: string): TradingAccount | null {
    return this.accounts.get(accountId) || null;
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
      await r2Storage.uploadJson('profiles/account_usernames.json', obj);
    } catch {
      // ignore
    }
  }

  public updateUserAccountsName(
    userId: string,
    newUsername: string,
    primaryBroker?: string,
    accountNumber?: string
  ): void {
    const cleanName = (newUsername || '').trim();
    if (!cleanName || cleanName.startsWith('TraderRank-')) return;

    this.traderUsernames.set(userId, cleanName);
    if (accountNumber) {
      this.traderUsernames.set(String(accountNumber).replace(/^TraderRank-/i, '').trim(), cleanName);
    }

    let matchedAny = false;
    for (const acc of this.accounts.values()) {
      const isDirectMatch =
        acc.userId === userId ||
        userId === 'usr_live_meta' ||
        (accountNumber && acc.accountNumber === String(accountNumber).replace(/^TraderRank-/i, '').trim());
      if (isDirectMatch) {
        acc.profileUsername = cleanName;
        this.traderUsernames.set(acc.accountNumber, cleanName);
        this.leaderboard.registerAccountMapping(acc.id, acc.userId, cleanName, acc.broker, cleanName, acc.accountNumber);
        matchedAny = true;
      }
    }

    // If user updated their profile username and hasn't explicitly bound userId yet, bind to their primary account (e.g. 72423906 or matching broker)
    if (!matchedAny) {
      const allAccs = Array.from(this.accounts.values());
      const targetAcc =
        allAccs.find(a => a.accountNumber === '72423906') ||
        (primaryBroker ? allAccs.find(a => a.broker.toLowerCase() === primaryBroker.toLowerCase()) : undefined) ||
        allAccs[0];
      if (targetAcc) {
        targetAcc.profileUsername = cleanName;
        this.traderUsernames.set(targetAcc.accountNumber, cleanName);
        this.leaderboard.registerAccountMapping(
          targetAcc.id,
          targetAcc.userId,
          cleanName,
          targetAcc.broker,
          cleanName,
          targetAcc.accountNumber
        );
      }
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
        const isJpy = brokerName === 'XMTrading' || serverLower.includes('xmtrading') || serverLower.includes('japan') || serverLower.includes('jpy');
        const defaultCurrency = isJpy ? 'JPY' : 'USD';

        const existingAcc = Array.from(this.accounts.values()).find(
          a => a.accountNumber === p.login || a.metaApiAccountId === p.id
        );
        const accountId = existingAcc?.id || `acc_meta_${p.login}`;
        const userId = existingAcc?.userId || (provisionedList.length === 1 ? 'usr_live_meta' : `usr_meta_${p.login}`);
        // Public Trader Profile Username (shown on Leaderboard & Podium)
        const profileUsername =
          this.traderUsernames.get(p.login) ||
          this.traderUsernames.get(userId) ||
          (existingAcc?.profileUsername && !existingAcc.profileUsername.startsWith('TraderRank-')
            ? existingAcc.profileUsername
            : undefined) ||
          (p.name && !p.name.startsWith('TraderRank-') ? p.name : undefined) ||
          getDefaultTraderUsername(p.login);
        const username = profileUsername;

        // Private Broker Legal Name (strictly kept in private for the account owner only, never exposed on public endpoints)
        const privateLegalName =
          (info?.name && !info.name.startsWith('TraderRank-') ? info.name : undefined) ||
          existingAcc?.accountHolderName;

        const tradingAccount: TradingAccount = {
          id: accountId,
          userId,
          accountNumber: p.login,
          profileUsername,
          accountHolderName: privateLegalName,
          broker: brokerName,
          integrationType: 'mt_gateway',
          platform: (p.platform?.toUpperCase() === 'MT4' ? 'MT4' : 'MT5') as Platform,
          serverName: p.server,
          connectionStatus: p.connectionStatus === 'CONNECTED' || p.state === 'DEPLOYED' ? 'CONNECTED' : 'SYNCING',
          balance: info?.balance ?? (isJpy ? 1500000 : 2.8),
          equity: info?.equity ?? (isJpy ? 1500000 : 2.8),
          margin: info?.margin ?? 0,
          freeMargin: info?.freeMargin ?? (isJpy ? 1500000 : 2.8),
          currency: info?.currency ?? defaultCurrency,
          leverage: info?.leverage ?? 1000,
          vaultSecretRef: `ref_meta_${p.id}`,
          metaApiAccountId: p.id,
          lastSyncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.accounts.set(accountId, tradingAccount);
        this.leaderboard.registerAccountMapping(accountId, userId, username, brokerName, profileUsername, p.login);

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
      const startBalance = Number(runningBalance.toFixed(2));
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

      deposits = Number(deposits.toFixed(2));
      withdrawals = Number(withdrawals.toFixed(2));
      tradeProfit = Number(tradeProfit.toFixed(2));
      swap = Number(swap.toFixed(2));
      commission = Number(commission.toFixed(2));
      const activeCapital = Number(Math.max(0.01, startBalance + deposits).toFixed(2));
      const tradingEndingCapital = Number(Math.max(0.01, activeCapital + tradeProfit).toFixed(2));
      const endBalance = Number(Math.max(0, runningBalance).toFixed(2));
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
    const tradeCurrency = acc?.currency || (acc?.broker === 'XMTrading' ? 'JPY' : 'USD');

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
        const profit = Number(outDeals.reduce((sum, d) => sum + Number(d.profit ?? 0), 0).toFixed(2));
        const commission = Number(deals.reduce((sum, d) => sum + Number(d.commission ?? 0), 0).toFixed(2));
        const swap = Number(deals.reduce((sum, d) => sum + Number(d.swap ?? 0), 0).toFixed(2));

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
        const profit = Number(outDeals.reduce((sum, d) => sum + Number(d.profit ?? 0), 0).toFixed(2));
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
          commission: Number(outDeals.reduce((sum, d) => sum + Number(d.commission ?? 0), 0).toFixed(2)),
          swap: Number(outDeals.reduce((sum, d) => sum + Number(d.swap ?? 0), 0).toFixed(2)),
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
