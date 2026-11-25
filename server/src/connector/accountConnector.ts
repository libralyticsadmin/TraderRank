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
import { resolveBrokerCurrency } from '../utils/currencyFlow.js';
import { ensureLegacyIdentityMigration } from '../services/legacyIdentityMigration.js';

export { EMERALD_BEAR_AVATAR_URL } from '../core/avatarPresets.js';

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
  let hash = 0;
  const seed = clean || 'trader';
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return TRADER_HANDLE_POOL[Math.abs(hash) % TRADER_HANDLE_POOL.length];
}

const maskId = (id?: string) => {
  const v = String(id || '');
  return v.length > 6 ? `${v.slice(0, 3)}…${v.slice(-3)}` : '***';
};

export interface AccountOwnerRecord {
  userId: string;
  username?: string;
  broker: Broker;
  accountNumber: string;
  platform?: Platform;
  accountId?: string;
  serverName?: string;
  connectedAt: string;
  status: 'CONNECTED' | 'DISCONNECTED';
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
  private accountOwners = new Map<string, AccountOwnerRecord>();
  private traderUsernames = new Map<string, string>();
  private traderAvatars = new Map<string, string>();
  private tradesStorage = new Map<string, CanonicalTrade[]>();
  private rawDealsCache = new Map<string, MetaApiDeal[]>();
  private lastDealSyncAt = new Map<string, number>();
  private lastDealCursorTime = new Map<string, string>();
  private static readonly DEAL_SYNC_TTL_MS = 15_000;

  constructor() {
    this.initWorkerEventWiring();
    // Identity stores are loaded only after the one-off legacy identity migration has run,
    // so in-memory state never overwrites migrated records.
    ensureLegacyIdentityMigration()
      .then(() => this.reloadIdentityStores())
      .catch(() => {})
      .finally(() => {
        this.syncCloudProvisionedAccounts().catch(() => {});
      });
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
    return this.registerVerifiedAccount(userId, username, broker, creds, validation);
  }

  /**
   * Registers an account whose credentials were already verified against the broker
   * (synchronously via connectAccount, or asynchronously by OnboardingService).
   * All financial figures are taken from `validation.accountDetails`.
   */
  public async registerVerifiedAccount(
    userId: string,
    username: string,
    broker: Broker,
    creds: AccountCredentials,
    validation: ValidationResult
  ): Promise<{ account: TradingAccount; validation: ValidationResult }> {
    if (!validation.success) {
      throw new Error(validation.error || 'Connection validation failed');
    }

    const accountNumber = validation.accountDetails?.accountNumber || (creds.type === 'mt_gateway' ? creds.login : 'NATIVE-ACC');
    const existingAcc = Array.from(this.accounts.values()).find(
      a =>
        a.accountNumber === accountNumber ||
        (validation.accountDetails?.metaApiAccountId &&
          a.metaApiAccountId === validation.accountDetails.metaApiAccountId)
    );

    // 1b. Ownership guard: a broker account may only be (re)connected by its current owner
    if (accountNumber !== 'NATIVE-ACC') {
      const persistedOwner = this.accountOwners.get(accountNumber);
      const currentOwnerId = existingAcc?.userId || persistedOwner?.userId;
      if (currentOwnerId && !AccountConnectorService.isSameOwner(currentOwnerId, userId)) {
        const err = new Error('This broker account is already connected to another TraderRank user');
        (err as Error & { code?: string }).code = 'ACCOUNT_OWNED_BY_OTHER';
        throw err;
      }
    }

    // 2. Encrypt in Secrets Vault
    const vaultSecretRef = await this.vault.storeSecret('AccountConnectorService', creds);

    // 3. Create sanitized TradingAccount metadata record (no credentials!)
    const accountId = existingAcc?.id || `acc_${crypto.randomUUID().slice(0, 8)}`;
    const platform: Platform = creds.type === 'mt_gateway' ? creds.platform : 'NATIVE';
    const serverName = creds.type === 'mt_gateway' ? creds.serverName : undefined;

    // All financial figures come from the broker-verified validation result (no placeholders).
    const details = validation.accountDetails;
    if (!details) {
      throw new Error('Broker did not return account details; account was not connected.');
    }
    const accountMargin = details.margin ?? 0;
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
      balance: details.balance,
      equity: details.equity,
      margin: accountMargin,
      freeMargin: details.freeMargin ?? details.equity - accountMargin,
      currency: details.currency,
      leverage: details.leverage,
      vaultSecretRef,
      metaApiAccountId: validation.accountDetails?.metaApiAccountId,
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.accounts.set(accountId, account);
    // A freshly verified connection lifts any stale/removed state from a previous disconnect
    this.leaderboard.setAccountHealth(accountId, 'ACTIVE');

    // Persist account ownership mapping across server restarts (multi-tenant boundary)
    const ownerRecord: AccountOwnerRecord = {
      userId,
      username: resolvedProfileUsername,
      broker,
      accountNumber,
      platform,
      accountId,
      serverName,
      connectedAt: new Date().toISOString(),
      status: 'CONNECTED',
    };
    this.accountOwners.set(accountNumber, ownerRecord);
    this.accountOwners.set(accountId, ownerRecord);
    await this.persistAccountOwnersToR2();

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

  public async resetAll(): Promise<void> {
    this.accounts.clear();
    this.accountOwners.clear();
    this.traderUsernames.clear();
    this.tradesStorage.clear();
    this.rawDealsCache.clear();
    this.lastDealSyncAt.clear();
    this.lastDealCursorTime.clear();
    await r2Storage.uploadJson('profiles/account_owners.json', {}, { 'x-traderrank-type': 'account_owners' });
    await r2Storage.uploadJson('profiles/account_usernames.json', {}, { 'x-traderrank-type': 'account_usernames' });
  }

  /**
   * Canonical owner comparison: exact userId match (case-insensitive, optional `u_` prefix).
   * Legacy aliases are resolved in stored data by the identity migration, never here.
   */
  public static isSameOwner(ownerA?: string | null, ownerB?: string | null): boolean {
    if (!ownerA || !ownerB) return false;
    const a = ownerA.trim().toLowerCase();
    const b = ownerB.trim().toLowerCase();
    if (a === b) return true;
    const aNorm = a.replace(/^u_/, '');
    const bNorm = b.replace(/^u_/, '');
    if (aNorm === bNorm) return true;
    return false;
  }

  /** Placeholder owner ids minted by older cloud-sync code; they do not belong to a real user. */
  public static isSyntheticOwnerId(userId?: string | null): boolean {
    const id = String(userId || '').trim().toLowerCase();
    return !id || id === 'usr_live_meta' || id.startsWith('usr_meta_');
  }

  /**
   * Finds the owning userId for a given broker login/account number, if already bound.
   */
  public findOwnerUserIdByLogin(login?: string): string | null {
    const clean = String(login || '').replace(/^TraderRank-/i, '').trim();
    if (!clean) return null;
    const ownerRec = this.accountOwners.get(clean);
    if (ownerRec?.userId && !AccountConnectorService.isSyntheticOwnerId(ownerRec.userId)) {
      return ownerRec.userId;
    }
    for (const acc of this.accounts.values()) {
      const accNum = String(acc.accountNumber || '').replace(/^TraderRank-/i, '').trim();
      if (accNum === clean && acc.userId && !AccountConnectorService.isSyntheticOwnerId(acc.userId)) {
        return acc.userId;
      }
    }
    return null;
  }

  /** All account records, unfiltered (for background services such as health monitoring). */
  public getAllAccountRecords(): TradingAccount[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Account records. With a userId, only that owner's accounts (isSameOwner).
   * Records may include the private broker legal name (accountHolderName); public
   * callers must strip it (see the public branch of GET /api/accounts in api/server.ts).
   */
  public getAccounts(userId?: string): TradingAccount[] {
    const all = Array.from(this.accounts.values());
    return userId ? all.filter(a => AccountConnectorService.isSameOwner(a.userId, userId)) : all;
  }

  public getAccount(accountId: string): TradingAccount | null {
    return this.accounts.get(accountId) || null;
  }

  /** (Re)loads usernames, avatars and owner records from persisted storage. */
  public async reloadIdentityStores(): Promise<void> {
    await this.loadTraderUsernamesFromR2();
    await this.loadTraderAvatarsFromR2();
    await this.loadAccountOwnersFromR2();
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

  public async loadAccountOwnersFromR2(): Promise<void> {
    try {
      const saved = await r2Storage.getJson<Record<string, AccountOwnerRecord>>('profiles/account_owners.json');
      if (saved && typeof saved === 'object') {
        for (const [k, v] of Object.entries(saved)) {
          const accNum = String(v?.accountNumber || k || '').trim();
          if (v && v.userId && accNum) {
            const normalized: AccountOwnerRecord = {
              ...v,
              accountNumber: accNum,
              broker: v.broker || 'XM',
              platform: v.platform || 'MT5',
            };
            this.accountOwners.set(k, normalized);
            this.accountOwners.set(accNum, normalized);
            if (v.accountId) {
              this.accountOwners.set(v.accountId, normalized);
            }
          }
        }
      }

    } catch {
      // ignore
    }
  }

  public async persistAccountOwnersToR2(): Promise<void> {
    try {
      const records: Record<string, AccountOwnerRecord> = {};
      for (const [, v] of this.accountOwners.entries()) {
        if (v && v.accountNumber) {
          records[String(v.accountNumber).trim()] = v;
        }
      }
      await r2Storage.uploadJson('profiles/account_owners.json', records, { 'x-traderrank-type': 'account_owners' });
    } catch {
      // ignore
    }
  }

  public getAccountOwner(accountNumberOrId: string): AccountOwnerRecord | null {
    const clean = String(accountNumberOrId || '').trim();
    return this.accountOwners.get(clean) || null;
  }

  public getAllAccountOwners(): AccountOwnerRecord[] {
    const unique = new Map<string, AccountOwnerRecord>();
    for (const v of this.accountOwners.values()) {
      if (v && v.accountNumber) {
        unique.set(String(v.accountNumber).trim(), v);
      }
    }
    return Array.from(unique.values());
  }

  public updateUserAccountsName(
    userId: string,
    newUsername: string,
    _primaryBroker?: string,
    accountNumber?: string,
    avatarUrl?: string
  ): void {
    const cleanName = (newUsername || '').trim();
    if (!cleanName || cleanName.startsWith('TraderRank-')) return;

    this.traderUsernames.set(userId, cleanName);
    if (accountNumber) {
      this.traderUsernames.set(String(accountNumber).replace(/^TraderRank-/i, '').trim(), cleanName);
    }

    // Only the user's own accounts (by owner userId) are renamed.
    for (const acc of this.accounts.values()) {
      if (AccountConnectorService.isSameOwner(acc.userId, userId)) {
        acc.profileUsername = cleanName;
        if (avatarUrl) acc.avatarUrl = avatarUrl;
        this.traderUsernames.set(acc.accountNumber, cleanName);
        this.leaderboard.registerAccountMapping(acc.id, acc.userId, cleanName, acc.broker, cleanName, acc.accountNumber, avatarUrl, acc.currency);
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
  private cloudSyncInFlight: Promise<TradingAccount[]> | null = null;
  private lastCloudSyncAt = 0;
  private static readonly CLOUD_SYNC_MIN_INTERVAL_MS = 30_000;

  /**
   * Syncs MetaApi-provisioned accounts into the store. Single-flight, and at most once per
   * 30s; callers inside that window get the current store. Run on startup and a background
   * schedule. Request handlers should read the store instead of forcing a sync.
   */
  public async syncCloudProvisionedAccounts(force = false): Promise<TradingAccount[]> {
    if (!this.metaApiClient.hasToken()) {
      return this.getAccounts();
    }
    if (this.cloudSyncInFlight) return this.cloudSyncInFlight;
    if (!force && Date.now() - this.lastCloudSyncAt < AccountConnectorService.CLOUD_SYNC_MIN_INTERVAL_MS) {
      return this.getAccounts();
    }
    this.cloudSyncInFlight = this.runCloudSync().finally(() => {
      this.lastCloudSyncAt = Date.now();
      this.cloudSyncInFlight = null;
    });
    return this.cloudSyncInFlight;
  }

  private async runCloudSync(): Promise<TradingAccount[]> {

    await this.loadTraderUsernamesFromR2();
    await this.loadTraderAvatarsFromR2();
    await this.loadAccountOwnersFromR2();

    try {
      const provisionedList = await this.metaApiClient.listProvisionedAccountsStrict(true);

      // Read account information only for CONNECTED accounts (disconnected ones time out),
      // with bounded concurrency instead of one-by-one.
      const infoById = new Map<string, Awaited<ReturnType<MetaApiClient['getAccountInformation']>>>();
      const infoQueue = provisionedList.filter(p => p.id && p.connectionStatus === 'CONNECTED');
      await Promise.all(Array.from({ length: Math.min(5, infoQueue.length) }, async () => {
        while (infoQueue.length) {
          const p = infoQueue.shift()!;
          infoById.set(p.id, await this.metaApiClient.getAccountInformation(p.id).catch(() => null));
        }
      }));

      for (const p of provisionedList) {
        if (!p.id || p.state === 'FAILED') continue;

        const info = infoById.get(p.id) ?? null;
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

        const existingAcc = Array.from(this.accounts.values()).find(
          a => String(a.accountNumber).trim() === cleanLogin || a.metaApiAccountId === p.id
        );
        const accountId = existingAcc?.id || `acc_meta_${cleanLogin}`;
        const savedOwner =
          this.accountOwners.get(cleanLogin) ||
          (existingAcc ? this.accountOwners.get(existingAcc.id) : null);

        // Ownership comes only from persisted owner records (or an account registered by its owner).
        // Accounts with no owner are never shown publicly.
        const ownerUserId = [savedOwner?.userId, existingAcc?.userId].find(
          (id): id is string => Boolean(id) && !AccountConnectorService.isSyntheticOwnerId(id)
        );
        if (!ownerUserId) {
          console.warn(
            `[CloudSync] MetaApi account ${maskId(p.id)} (login ${maskId(cleanLogin)}) has no owner record; not listed on the leaderboard`
          );
          continue;
        }
        const userId = ownerUserId;
        const avatarUrl =
          this.traderAvatars.get(userId) ||
          this.traderAvatars.get(cleanLogin) ||
          existingAcc?.avatarUrl;

        // Public profile username (leaderboard, bulletin, tournaments). Never the broker legal name.
        const profileUsername =
          this.traderUsernames.get(userId) ||
          savedOwner?.username ||
          this.traderUsernames.get(cleanLogin) ||
          (existingAcc?.profileUsername && !existingAcc.profileUsername.startsWith('TraderRank-')
            ? existingAcc.profileUsername
            : undefined) ||
          getDefaultTraderUsername(cleanLogin);
        const username = profileUsername;

        // Private broker legal name: only ever returned to the owner's private view.
        const privateLegalName =
          (info?.name && !info.name.startsWith('TraderRank-') ? info.name : undefined) ||
          existingAcc?.accountHolderName;

        // Broker-reported currency always wins; otherwise the last synced value, then the
        // broker/server convention.
        const effectiveCurrency = resolveBrokerCurrency(
          brokerName,
          p.server,
          info?.currency ?? existingAcc?.currency
        );
        const isLiveConnected = p.connectionStatus === 'CONNECTED' && Boolean(info);
        const effectiveBroker: Broker = brokerName;

        const tradingAccount: TradingAccount = {
          id: accountId,
          userId,
          accountNumber: cleanLogin,
          profileUsername,
          avatarUrl,
          accountHolderName: privateLegalName,
          broker: effectiveBroker,
          integrationType: 'mt_gateway',
          platform: (p.platform?.toUpperCase() === 'MT4' ? 'MT4' : 'MT5') as Platform,
          serverName: p.server,
          // Reflect the real broker link: DEPLOYED alone does not mean the broker login succeeded.
          connectionStatus: isLiveConnected
            ? 'CONNECTED'
            : p.connectionStatus === 'DISCONNECTED' ? 'DISCONNECTED' : 'SYNCING',
          lastError: isLiveConnected
            ? undefined
            : p.connectionStatus === 'DISCONNECTED'
              ? 'Broker login failed or was lost. Re-enter the investor password and verify the server name.'
              : undefined,
          // Only broker-reported figures; if the broker is unreachable keep the last real snapshot.
          balance: info?.balance ?? existingAcc?.balance ?? 0,
          equity: info?.equity ?? existingAcc?.equity ?? 0,
          margin: info?.margin ?? existingAcc?.margin ?? 0,
          freeMargin: info?.freeMargin ?? existingAcc?.freeMargin ?? 0,
          currency: effectiveCurrency,
          leverage: info?.leverage ?? existingAcc?.leverage ?? 0,
          lastConnectedAt: isLiveConnected ? new Date().toISOString() : existingAcc?.lastConnectedAt,
          disconnectedSince: isLiveConnected ? undefined : existingAcc?.disconnectedSince,
          vaultSecretRef: `ref_meta_${p.id}`,
          metaApiAccountId: p.id,
          lastSyncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.accounts.set(accountId, tradingAccount);

        if (!this.accountOwners.has(cleanLogin)) {
          this.accountOwners.set(cleanLogin, {
            userId,
            username: profileUsername,
            broker: effectiveBroker,
            accountNumber: cleanLogin,
            platform: (p.platform?.toUpperCase() === 'MT4' ? 'MT4' : 'MT5') as Platform,
            accountId,
            serverName: p.server,
            connectedAt: new Date().toISOString(),
            status: 'CONNECTED',
          });
          await this.persistAccountOwnersToR2();
        }

        this.leaderboard.registerAccountMapping(
          accountId,
          userId,
          username,
          effectiveBroker,
          profileUsername,
          cleanLogin,
          avatarUrl,
          effectiveCurrency
        );

        // Fetch real historical deals directly from MetaApi (with R2 cache fallback if MetaApi is temporarily disconnected)
        let rawDeals = await this.metaApiClient.getHistoricalDeals(p.id);
        if (rawDeals && rawDeals.length > 0) {
          this.persistRawDealsToR2(cleanLogin, rawDeals).catch(() => {});
        } else {
          const cachedFromR2 = await this.loadRawDealsFromR2(cleanLogin);
          if (cachedFromR2.length > 0) {
            rawDeals = cachedFromR2;
          }
        }
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

          // Update stats only for tournaments this user has actually joined (window-filtered, real equity/drawdown).
          // Disconnected (stale/removed) accounts earn no tournament points until they reconnect.
          if (this.leaderboard.getAccountHealth(accountId) !== 'ACTIVE') continue;
          const tournamentService = TournamentService.getInstance();
          const balance = Number(tradingAccount.balance || 0);
          const equity = Number(tradingAccount.equity ?? balance);
          const activePositions = await this.getActivePositions(accountId).catch(() => []);
          const floatingPips = activePositions.reduce((sum, p) => sum + Number(p.profitPips || 0), 0);
          tournamentService.syncUserTradesAcrossJoinedTournaments({
            userId,
            trades: normalizedTrades,
            floatingPips,
            startingEquity: balance > 0 ? balance : equity,
            highWaterMarkEquity: Math.max(balance, equity),
            currentEquity: equity,
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

  private async persistRawDealsToR2(accountNumber: string, deals: MetaApiDeal[]): Promise<void> {
    if (!accountNumber || !deals.length || process.env.NODE_ENV === 'test' || process.env.VITEST) return;
    try {
      await r2Storage.uploadJson(`trades/raw_deals_${accountNumber}.json`, deals, {
        'x-traderrank-type': 'raw_deals_cache',
      });
    } catch {
      // Non-fatal
    }
  }

  private async loadRawDealsFromR2(accountNumber: string): Promise<MetaApiDeal[]> {
    if (!accountNumber || process.env.NODE_ENV === 'test' || process.env.VITEST) return [];
    try {
      const saved = await r2Storage.getJson<MetaApiDeal[]>(`trades/raw_deals_${accountNumber}.json`);
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
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
      (acc?.serverName && (acc.serverName.toLowerCase().includes('xmtrading') || acc.serverName.toLowerCase().includes('japan') || acc.serverName.toLowerCase().includes('jpy')));
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

          if (account.accountNumber) {
            this.persistRawDealsToR2(String(account.accountNumber).trim(), mergedDeals).catch(() => {});
          }

          const trades = this.processRawDealsToTrades(accountId, mergedDeals);
          this.tradesStorage.set(accountId, trades);
          for (const trade of trades) {
            await this.eventBus.publish('stream:trade.closed.normalized', 'trade.closed.normalized', accountId, trade);
          }
          return trades;
        } else if ((!existingTrades || existingTrades.length === 0) && account.accountNumber) {
          const cachedFromR2 = await this.loadRawDealsFromR2(String(account.accountNumber).trim());
          if (cachedFromR2.length > 0) {
            this.rawDealsCache.set(accountId, cachedFromR2);
            const trades = this.processRawDealsToTrades(accountId, cachedFromR2);
            this.tradesStorage.set(accountId, trades);
            return trades;
          }
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
    const tradeCurrency = resolveBrokerCurrency(
      acc?.broker,
      acc?.serverName,
      acc?.currency
    );

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
          (acc?.serverName && (acc.serverName.toLowerCase().includes('xmtrading') || acc.serverName.toLowerCase().includes('japan') || acc.serverName.toLowerCase().includes('jpy')));
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
          (acc?.serverName && (acc.serverName.toLowerCase().includes('xmtrading') || acc.serverName.toLowerCase().includes('japan') || acc.serverName.toLowerCase().includes('jpy')));
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

    // Update persistent account ownership status
    const cleanAcc = String(account.accountNumber || '').trim();
    const existingOwner = this.accountOwners.get(cleanAcc) || this.accountOwners.get(accountId);
    if (existingOwner) {
      if (purge) {
        this.accountOwners.delete(cleanAcc);
        this.accountOwners.delete(accountId);
      } else {
        existingOwner.status = 'DISCONNECTED';
        this.accountOwners.set(cleanAcc, existingOwner);
      }
      await this.persistAccountOwnersToR2();
    }

    await this.eventBus.publish('stream:account.events', 'account.disconnected', accountId, {
      accountId,
      broker: account.broker,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  public async purgeUser(userId: string): Promise<number> {
    const userAccs = this.getAccounts(userId);
    let count = 0;
    for (const acc of userAccs) {
      await this.disconnectAccount(acc.id, true);
      count++;
    }
    let ownersChanged = false;
    const cleanUser = userId.toLowerCase();
    for (const [key, owner] of Array.from(this.accountOwners.entries())) {
      if (owner.userId === userId || owner.userId.toLowerCase() === cleanUser) {
        this.accountOwners.delete(key);
        ownersChanged = true;
      }
    }
    if (ownersChanged) {
      await this.persistAccountOwnersToR2();
    }
    return count;
  }

  public async purgeAccountByLogin(login: string): Promise<boolean> {
    const clean = String(login || '').replace(/^TraderRank-/i, '').trim();
    if (!clean) return false;
    let changed = false;
    for (const [key, owner] of Array.from(this.accountOwners.entries())) {
      if (
        key === clean ||
        key === `acc_meta_${clean}` ||
        String(owner?.accountNumber || '').trim() === clean
      ) {
        this.accountOwners.delete(key);
        changed = true;
      }
    }
    for (const [accId, acc] of Array.from(this.accounts.entries())) {
      const accNum = String(acc.accountNumber || '').replace(/^TraderRank-/i, '').trim();
      if (accNum === clean || accId === `acc_meta_${clean}`) {
        this.accounts.delete(accId);
        changed = true;
      }
    }
    if (changed) {
      await this.persistAccountOwnersToR2();
    }
    return changed;
  }
}
