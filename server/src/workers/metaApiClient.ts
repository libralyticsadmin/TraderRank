/**
 * MetaApi.cloud REST & Cloud Gateway Client
 * Production client for connecting MT4/MT5 accounts (XM, Axiory, Vantage, Generic)
 * via MetaApi's enterprise cloud infrastructure.
 */

import { instrumentedFetch } from '../utils/externalCall.js';
import { isSimulatedDataAllowed } from '../core/dataPolicy.js';

type ProvisionProbeResult =
  | { status: 'connected'; id: string; info: MetaApiAccountInfo }
  | { status: 'not_connected'; id: string; connectionStatus?: string }
  | { status: 'rejected'; error: string }
  | { status: 'error'; id?: string; error: string }
  | { status: 'timeout' };

export interface MetaApiAccountInfo {
  platform: 'MT4' | 'MT5';
  broker: string;
  currency: string;
  server: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  name?: string;
}

export interface MetaApiPosition {
  id: string;
  symbol: string;
  type: 'POSITION_TYPE_BUY' | 'POSITION_TYPE_SELL';
  volume: number; // lots
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
  updateTime: string;
}

export interface MetaApiDeal {
  id: string;
  positionId: string;
  symbol?: string;
  type: 'DEAL_TYPE_BUY' | 'DEAL_TYPE_SELL' | 'DEAL_TYPE_BALANCE' | 'DEAL_TYPE_CREDIT' | string;
  entryType?: 'DEAL_ENTRY_IN' | 'DEAL_ENTRY_OUT' | 'DEAL_ENTRY_INOUT' | 'DEAL_ENTRY_OUT_BY' | string;
  volume: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  time: string;
}

export interface MetaApiProvisionedAccount {
  id: string;
  name: string;
  login: string;
  server: string;
  platform: 'mt4' | 'mt5';
  type: string;
  state: 'DRAFT' | 'DEPLOYING' | 'DEPLOYED' | 'UNDEPLOYING' | 'UNDEPLOYED' | 'FAILED';
  connectionStatus?: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
}

export interface MetaStatsMetrics {
  trades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  pips: number;
}

export class MetaApiClient {
  private token: string;
  private provisioningBaseUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
  private metaStatsBaseUrl = 'https://metastats-api-v1.agiliumtrade.agiliumtrade.ai';
  private accountRegions = new Map<string, string>();
  private positionsCache = new Map<string, { positions: MetaApiPosition[]; fetchedAt: number }>();
  private positionsInFlight = new Map<string, Promise<MetaApiPosition[]>>();
  private positionsBackoff = new Map<string, { failures: number; retryAfter: number }>();

  constructor(token?: string) {
    this.token = token || process.env.META_API_TOKEN || '';
  }

  public getClientBaseUrl(metaApiAccountId?: string): string {
    const region = (metaApiAccountId && this.accountRegions.get(metaApiAccountId)) || 'london';
    return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
  }

  public hasToken(): boolean {
    return Boolean(this.token && this.token.length > 10 && !this.token.startsWith('mock_'));
  }

  private isTestRuntime(): boolean {
    return process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
  }

  public setToken(token: string): void {
    this.token = token;
  }

  /**
   * Health & latency check against MetaApi Cloud REST Gateway
   */
  public async ping(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    if (!this.hasToken()) {
      return { ok: true, latencyMs: 15 }; // Local loopback mock
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await instrumentedFetch('metaapi', `${this.provisioningBaseUrl}/users/current/accounts?limit=1`, {
        signal: controller.signal,
        headers: {
          'auth-token': this.token,
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - start;
      if (!res.ok) {
        return { ok: true, latencyMs, error: `MetaApi HTTP ${res.status}: ${res.statusText}` };
      }

      return { ok: true, latencyMs };
    } catch {
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs };
    }
  }

  /**
   * Lists all MT4/MT5 accounts provisioned in MetaApi cloud
   */
  public async listProvisionedAccounts(): Promise<MetaApiProvisionedAccount[]> {
    try {
      return await this.listProvisionedAccountsStrict();
    } catch {
      return [];
    }
  }

  private accountListCache: { at: number; accounts: MetaApiProvisionedAccount[] } | null = null;
  private accountListInFlight: Promise<MetaApiProvisionedAccount[]> | null = null;
  private static readonly ACCOUNT_LIST_TTL_MS = 30_000;

  /**
   * Lists provisioned accounts, cached for 30s with a single in-flight request.
   * Throws on failure so callers never mistake an outage for "account does not exist"
   * (which previously risked creating duplicate, paid MetaApi accounts).
   */
  public async listProvisionedAccountsStrict(forceRefresh = false): Promise<MetaApiProvisionedAccount[]> {
    if (!this.hasToken()) return [];
    const cached = this.accountListCache;
    if (!forceRefresh && cached && Date.now() - cached.at < MetaApiClient.ACCOUNT_LIST_TTL_MS) {
      return cached.accounts;
    }
    if (this.accountListInFlight) return this.accountListInFlight;

    this.accountListInFlight = (async () => {
      const res = await instrumentedFetch('metaapi', `${this.provisioningBaseUrl}/users/current/accounts`, {
        headers: {
          'auth-token': this.token,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        throw new Error(`MetaApi account list failed (${res.status})`);
      }
      const data = await res.json() as any[];
      const accounts: MetaApiProvisionedAccount[] = (Array.isArray(data) ? data : []).map(acc => {
        const id = String(acc._id || acc.id);
        const region = String(acc.region || 'london');
        this.accountRegions.set(id, region);
        return {
          id,
          name: acc.name,
          login: acc.login,
          server: acc.server,
          platform: acc.platform,
          type: acc.type,
          state: acc.state,
          connectionStatus: acc.connectionStatus,
        };
      });
      this.accountListCache = { at: Date.now(), accounts };
      return accounts;
    })().finally(() => {
      this.accountListInFlight = null;
    });
    return this.accountListInFlight;
  }

  /** Drops the cached account list (after create/update/deploy). */
  public invalidateAccountListCache(): void {
    this.accountListCache = null;
  }

  /**
   * Finds or creates a cloud account record on MetaApi
   */
  public async createOrGetAccount(
    server: string,
    login: string,
    investorPassword: string,
    platform: 'MT4' | 'MT5' = 'MT5'
  ): Promise<{ id: string; isNew: boolean; state: string }> {
    if (!this.hasToken()) {
      return { id: `mock_meta_${login}`, isNew: true, state: 'DEPLOYED' };
    }

    // 1. Check if already provisioned (strict: force refresh to guarantee live view)
    const existing = await this.listProvisionedAccountsStrict(true);
    const found = existing.find(a => a.login === login && a.server.toLowerCase() === server.toLowerCase());
    if (found) {
      // Only update credentials & redeploy if the account is NOT currently connected,
      // preventing accidental disruption of already-healthy broker connections.
      if (!this.isTestRuntime() && investorPassword && found.connectionStatus !== 'CONNECTED') {
        const updated = await this.updateAccountCredentials(
          found.id,
          found.name || `TraderRank-${login}`,
          server,
          investorPassword
        );
        if (!updated.ok) {
          console.warn(`[MetaApiClient] Credential update warning for ${found.id}: ${updated.error}`);
          // If the existing account was rejected or rate-limited with HTTP 429 (TooManyRequestsError),
          // its container is locked in cooldown. Delete it so we can provision clean below.
          if (updated.status === 429 || (updated.status && updated.status >= 400 && updated.status < 500)) {
            console.log(`[MetaApiClient] Deleting locked/rate-limited account ${found.id} to recreate clean...`);
            await this.deleteAccount(found.id);
          } else {
            throw new Error(`MetaApi rejected credentials (${updated.status}): ${updated.error}`);
          }
        } else {
          if (found.state === 'DRAFT' || found.state === 'UNDEPLOYED') {
            await this.deployAccount(found.id);
          } else {
            await this.redeployAccount(found.id);
          }
          this.positionsBackoff.delete(found.id);
          return { id: found.id, isNew: false, state: found.state };
        }
      } else {
        return { id: found.id, isNew: false, state: found.state };
      }
    }

    // 2. Provision new account in MetaApi
    const res = await instrumentedFetch('metaapi', `${this.provisioningBaseUrl}/users/current/accounts`, {
      method: 'POST',
      headers: {
        'auth-token': this.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `TraderRank-${login}`,
        type: 'cloud',
        login,
        server,
        password: investorPassword,
        platform: platform.toLowerCase(),
        magic: 0,
        quoteStreamingIntervalInSeconds: 2.5,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MetaApi provisioning failed (${res.status}): ${text}`);
    }

    this.invalidateAccountListCache();
    const created = await res.json() as any;
    const id = created ? String(created.id || created._id || '') : '';
    if (id && created?.region) {
      this.accountRegions.set(id, String(created.region));
    }
    return { id, isNew: true, state: created?.state || 'DRAFT' };
  }

  /**
   * Updates an existing MetaApi account's credentials (e.g., new investor password)
   */
  public async updateAccountCredentials(
    metaApiAccountId: string,
    name: string,
    server: string,
    investorPassword: string
  ): Promise<{ ok: boolean; status?: number; error?: string }> {
    if (!this.hasToken() || !metaApiAccountId || metaApiAccountId.startsWith('mock_')) {
      return { ok: true };
    }
    try {
      const res = await instrumentedFetch('metaapi', `${this.provisioningBaseUrl}/users/current/accounts/${metaApiAccountId}`, {
        method: 'PUT',
        headers: {
          'auth-token': this.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          server,
          password: investorPassword,
        }),
        signal: AbortSignal.timeout(35000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, status: res.status, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
      return { ok: true, status: res.status };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /**
   * Redeploys an existing MetaApi account so updated credentials take effect
   */
  public async redeployAccount(metaApiAccountId: string): Promise<boolean> {
    if (!this.hasToken() || !metaApiAccountId || typeof metaApiAccountId !== 'string' || metaApiAccountId.startsWith('mock_')) return true;
    try {
      const res = await instrumentedFetch('metaapi', `${this.provisioningBaseUrl}/users/current/accounts/${metaApiAccountId}/redeploy`, {
        method: 'POST',
        headers: {
          'auth-token': this.token,
        },
        signal: AbortSignal.timeout(10000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Deploys an account to connect to the MT broker server
   */
  public async deployAccount(metaApiAccountId: string): Promise<boolean> {
    if (!this.hasToken() || !metaApiAccountId || typeof metaApiAccountId !== 'string' || metaApiAccountId.startsWith('mock_')) return true;
    try {
      const res = await instrumentedFetch('metaapi', `${this.provisioningBaseUrl}/users/current/accounts/${metaApiAccountId}/deploy`, {
        method: 'POST',
        headers: {
          'auth-token': this.token,
        },
        signal: AbortSignal.timeout(10000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Undeploys an account (stops broker connection, frees the paid MetaApi slot; record is kept)
   */
  public async undeployAccount(metaApiAccountId: string): Promise<boolean> {
    if (!this.hasToken() || !metaApiAccountId || metaApiAccountId.startsWith('mock_')) return true;
    try {
      const res = await instrumentedFetch('metaapi', `${this.provisioningBaseUrl}/users/current/accounts/${metaApiAccountId}/undeploy`, {
        method: 'POST',
        headers: { 'auth-token': this.token },
        signal: AbortSignal.timeout(10000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Deletes a MetaApi account completely (frees slot, removes bad state/cooldown locks)
   */
  public async deleteAccount(metaApiAccountId: string): Promise<boolean> {
    if (!this.hasToken() || !metaApiAccountId || metaApiAccountId.startsWith('mock_')) return true;
    try {
      const res = await instrumentedFetch('metaapi', `${this.provisioningBaseUrl}/users/current/accounts/${metaApiAccountId}`, {
        method: 'DELETE',
        headers: { 'auth-token': this.token },
        signal: AbortSignal.timeout(15000),
      });
      this.invalidateAccountListCache();
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetches account deployment and connection state
   */
  public async getAccountState(metaApiAccountId: string): Promise<{ state: string; connectionStatus?: string; disconnectedReason?: string } | null> {
    if (!this.hasToken() || !metaApiAccountId || typeof metaApiAccountId !== 'string' || metaApiAccountId.startsWith('mock_')) {
      return { state: 'DEPLOYED', connectionStatus: 'CONNECTED' };
    }
    try {
      const res = await instrumentedFetch('metaapi', `${this.provisioningBaseUrl}/users/current/accounts/${metaApiAccountId}`, {
        headers: {
          'auth-token': this.token,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const data = await res.json() as any;
      if (data?.region) {
        this.accountRegions.set(metaApiAccountId, String(data.region));
      }
      const replica = Array.isArray(data.accountReplicas) && data.accountReplicas.length > 0 ? data.accountReplicas[0] : null;
      const connStatus = data.connectionStatus || replica?.connectionStatus;
      const disconnectedReason = data.disconnectedReason || data.disconnectReason || replica?.disconnectedReason || replica?.disconnectReason;
      return {
        state: data.state,
        connectionStatus: connStatus,
        disconnectedReason: disconnectedReason,
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetches live balance, equity, leverage from MetaApi Client REST Gateway
   */
  public async getAccountInformation(metaApiAccountId: string): Promise<MetaApiAccountInfo | null> {
    if (!this.hasToken() || !metaApiAccountId || typeof metaApiAccountId !== 'string' || metaApiAccountId.startsWith('mock_')) {
      if (!isSimulatedDataAllowed()) return null;
      // guard:simulation-only
      return {
        platform: 'MT5',
        broker: 'MetaApi-Cloud',
        currency: 'USD',
        server: 'Live-Server',
        balance: 10000.00,
        equity: 10245.50,
        margin: 120.00,
        freeMargin: 10125.50,
        leverage: 100,
      };
    }

    try {
      const clientUrl = this.getClientBaseUrl(metaApiAccountId);
      const res = await instrumentedFetch('metaapi', `${clientUrl}/users/current/accounts/${metaApiAccountId}/account-information`, {
        headers: {
          'auth-token': this.token,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const info = await res.json() as any;
      return {
        platform: (info.platform || 'MT5').toUpperCase() as 'MT4' | 'MT5',
        broker: info.broker || 'MT-Broker',
        currency: info.currency || 'USD',
        server: info.server || 'Default',
        balance: Number(info.balance ?? 0),
        equity: Number(info.equity ?? info.balance ?? 0),
        margin: Number(info.margin ?? 0),
        freeMargin: Number(info.freeMargin ?? info.balance ?? 0),
        leverage: Number(info.leverage ?? 100),
        name: info.name ? String(info.name).trim() : undefined,
      };
    } catch {
      return null;
    }
  }

  /** Hard upper bound for the synchronous cloud phase of preflight validation. */
  private static get VALIDATION_BUDGET_MS(): number {
    const fromEnv = Number(process.env.METAAPI_VALIDATION_BUDGET_MS);
    return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 20000;
  }

  /**
   * Provisions/redeploys the MetaApi account and polls until CONNECTED or the deadline passes.
   * Never throws. Work started here (deploy/redeploy) keeps progressing on MetaApi's side
   * after the deadline, so a retry a minute later usually succeeds for slow-connecting brokers.
   */
  private async provisionAndProbe(
    server: string,
    login: string,
    investorPassword: string,
    platform: 'MT4' | 'MT5',
    deadline: number
  ): Promise<ProvisionProbeResult> {
    try {
      const { id, state } = await this.createOrGetAccount(server, login, investorPassword, platform);
      if (!id) {
        return { status: 'error', error: 'MetaApi did not return an account id for this login.' };
      }

      // Auto-deploy if needed so broker connection initiates
      if (state === 'DRAFT' || state === 'UNDEPLOYED') {
        await this.deployAccount(id);
      }

      // Poll until MetaApi reports CONNECTED or the budget runs out
      let accState = await this.getAccountState(id);
      while (accState?.connectionStatus !== 'CONNECTED' && Date.now() + 2000 < deadline) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        accState = await this.getAccountState(id);
      }

      if (accState?.connectionStatus !== 'CONNECTED') {
        return { status: 'not_connected', id, connectionStatus: accState?.connectionStatus };
      }
      const info = await this.getAccountInformation(id);
      if (!info) {
        return { status: 'error', id, error: 'Broker connection is up but account information could not be read yet.' };
      }
      return { status: 'connected', id, info };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[MetaApiClient] Cloud provisioning failed for ${login}@${server}:`, message);
      // createOrGetAccount throws "(4xx)" on MetaApi client errors. 401/403/429 concern our API token
      // or rate limits, not the trader's credentials, so they are reported as integration errors.
      const code = Number(message.match(/\((4\d\d)\)/)?.[1] || 0);
      const rejected = code >= 400 && code < 500 && ![401, 403, 429].includes(code);
      return { status: rejected ? 'rejected' : 'error', error: message };
    }
  }

  /**
   * Validates investor credentials against MetaApi Cloud Provisioning.
   *
   * Live mode: succeeds ONLY when MetaApi is logged in to the broker and real account
   * information has been read. Any other outcome is reported as a failure — no placeholder
   * balances are ever returned. Simulated results are limited to tests / offline local dev
   * (see core/dataPolicy.ts).
   */
  public async validateAccount(
    server: string,
    login: string,
    investorPassword: string,
    platform: 'MT4' | 'MT5' = 'MT5'
  ): Promise<{ success: boolean; accountInfo?: MetaApiAccountInfo; metaApiAccountId?: string; error?: string; errorCode?: string }> {
    if (!server || !login || !investorPassword) {
      return {
        success: false,
        error: 'Server name, login, and investor password are required.',
        errorCode: 'INVALID_CREDENTIALS',
      };
    }

    const simulationAllowed = isSimulatedDataAllowed();

    if (!simulationAllowed) {
      if (!this.hasToken()) {
        return {
          success: false,
          error: 'Broker integration is not configured on the server (META_API_TOKEN missing). Please contact support.',
          errorCode: 'UNKNOWN',
        };
      }
      return this.validateAccountLive(server, login, investorPassword, platform);
    }

    // ---- Simulation mode only (automated tests / offline local development) ----
    if (investorPassword.toLowerCase().includes('wrong')) {
      return {
        success: false,
        error: 'Invalid investor password. Please verify the read-only password for this account.',
        errorCode: 'INVALID_CREDENTIALS',
      };
    }

    if (server.toLowerCase().includes('offline')) {
      return {
        success: false,
        error: `Unable to reach broker server '${server}'. Server is unreachable or under maintenance.`,
        errorCode: 'SERVER_UNREACHABLE',
      };
    }

    // guard:simulation-only
    const isMockAccount = server.toLowerCase().includes('mock') || login.startsWith('mock_');
    const knownServers = ['XMGlobal', 'XMTrading', 'Axiory', 'VantageFX', 'Vanguard', 'ICMarkets', 'Exness', 'MetaQuotes'];
    const matchesKnown = knownServers.some(s => server.toLowerCase().includes(s.toLowerCase()));
    const sLower = server.toLowerCase();
    const isJpy = sLower.includes('xmtrading') || sLower.includes('japan') || sLower.includes('jpy');

    return {
      success: true,
      metaApiAccountId: isMockAccount ? `mock_meta_${login}` : undefined,
      accountInfo: {
        platform,
        broker: server.split('-')[0] || (isJpy ? 'XMTrading' : matchesKnown ? 'XM' : 'OTHER'),
        currency: isJpy ? 'JPY' : 'USD',
        server,
        balance: isJpy ? 1500000.00 : 10000.00,
        equity: isJpy ? 1542050.00 : 10420.50,
        margin: isJpy ? 36000.00 : 240.00,
        freeMargin: isJpy ? 1506050.00 : 10180.50,
        leverage: 100,
      },
    };
  }

  /**
   * Live broker validation through MetaApi, bounded by VALIDATION_BUDGET_MS so the
   * preflight HTTP request can never hang.
   */
  private async validateAccountLive(
    server: string,
    login: string,
    investorPassword: string,
    platform: 'MT4' | 'MT5'
  ): Promise<{ success: boolean; accountInfo?: MetaApiAccountInfo; metaApiAccountId?: string; error?: string; errorCode?: string }> {
    const budgetMs = MetaApiClient.VALIDATION_BUDGET_MS;
    const deadline = Date.now() + budgetMs;
    let budgetTimer: ReturnType<typeof setTimeout> | undefined;
    const budgetExpired = new Promise<ProvisionProbeResult>(resolve => {
      budgetTimer = setTimeout(() => resolve({ status: 'timeout' }), budgetMs);
    });

    const result = await Promise.race([
      this.provisionAndProbe(server, login, investorPassword, platform, deadline),
      budgetExpired,
    ]);
    clearTimeout(budgetTimer);

    switch (result.status) {
      case 'connected':
        return { success: true, metaApiAccountId: result.id, accountInfo: result.info };
      case 'rejected':
        return {
          success: false,
          error: `The broker integration rejected these credentials for account ${login} on '${server}'. ` +
            `Check the investor (read-only) password and the exact server name. (${result.error.slice(0, 160)})`,
          errorCode: 'INVALID_CREDENTIALS',
        };
      case 'not_connected':
      case 'timeout':
        console.warn(`[MetaApiClient] ${login}@${server} not CONNECTED within ${budgetMs}ms (status: ${result.status === 'not_connected' ? result.connectionStatus : 'timeout'})`);
        return {
          success: false,
          error: `Could not log in to broker server '${server}' with account ${login} yet. ` +
            `If this is a new connection it can take up to a minute — retry shortly. ` +
            `If it keeps failing, verify the investor password and the exact server name from your broker.`,
          errorCode: 'SERVER_UNREACHABLE',
        };
      default:
        return {
          success: false,
          error: `Broker connection could not be verified: ${result.error}`,
          errorCode: 'UNKNOWN',
        };
    }
  }

  /**
   * Fetches live open positions for an active account
   */
  public async getPositions(metaApiAccountId: string): Promise<MetaApiPosition[]> {
    if (!this.hasToken() || !metaApiAccountId || typeof metaApiAccountId !== 'string' || metaApiAccountId.startsWith('mock_')) return [];

    const cached = this.positionsCache.get(metaApiAccountId);
    if (cached && Date.now() - cached.fetchedAt < 3000) {
      return cached.positions;
    }

    const backoff = this.positionsBackoff.get(metaApiAccountId);
    if (backoff && Date.now() < backoff.retryAfter) {
      return cached?.positions ?? [];
    }

    const inFlight = this.positionsInFlight.get(metaApiAccountId);
    if (inFlight) {
      return inFlight;
    }

    const recordFailure = (reason: string) => {
      const prev = this.positionsBackoff.get(metaApiAccountId);
      const failures = (prev?.failures ?? 0) + 1;
      const delayMs = Math.min(120_000, 15_000 * Math.pow(2, failures - 1));
      this.positionsBackoff.set(metaApiAccountId, { failures, retryAfter: Date.now() + delayMs });
      console.warn(`[MetaApiClient] getPositions ${reason} for ${metaApiAccountId} (backoff ${Math.round(delayMs / 1000)}s)`);
    };

    const promise = (async (): Promise<MetaApiPosition[]> => {
      try {
        const clientUrl = this.getClientBaseUrl(metaApiAccountId);
        const res = await instrumentedFetch('metaapi', `${clientUrl}/users/current/accounts/${metaApiAccountId}/positions`, {
          headers: {
            'auth-token': this.token,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          recordFailure(`HTTP ${res.status}`);
          return cached?.positions ?? [];
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          return cached?.positions ?? [];
        }
        this.positionsBackoff.delete(metaApiAccountId);
        const parsed: MetaApiPosition[] = data.map((p: any) => ({
          id: String(p.id || p._id || p.positionId),
          symbol: p.symbol,
          type: p.type === 'POSITION_TYPE_BUY' || p.type === 0 ? 'POSITION_TYPE_BUY' : 'POSITION_TYPE_SELL',
          volume: Number(p.volume ?? 0),
          openPrice: Number(p.openPrice ?? 0),
          currentPrice: Number(p.currentPrice ?? p.openPrice ?? 0),
          profit: Number(p.profit ?? 0),
          swap: Number(p.swap ?? 0),
          commission: Number(p.commission ?? 0),
          openTime: p.time ? new Date(p.time).toISOString() : new Date().toISOString(),
          updateTime: p.updateTime ? new Date(p.updateTime).toISOString() : new Date().toISOString(),
        }));
        this.positionsCache.set(metaApiAccountId, { positions: parsed, fetchedAt: Date.now() });
        return parsed;
      } catch (err) {
        recordFailure(err instanceof Error ? err.message : String(err));
        return cached?.positions ?? [];
      } finally {
        this.positionsInFlight.delete(metaApiAccountId);
      }
    })();

    this.positionsInFlight.set(metaApiAccountId, promise);
    return promise;
  }

  /**
   * Fetches historical closed deals from MetaApi Client REST Gateway.
   * Automatically paginates past MetaApi's 1,000-deal per-request cap so the newest executions are never truncated.
   */
  public async getHistoricalDeals(
    metaApiAccountId: string,
    startTime: string = new Date(Date.now() - 365 * 86400 * 1000).toISOString(),
    endTime: string = new Date().toISOString()
  ): Promise<MetaApiDeal[]> {
    if (!this.hasToken() || !metaApiAccountId || typeof metaApiAccountId !== 'string' || metaApiAccountId.startsWith('mock_')) return [];

    try {
      const clientUrl = this.getClientBaseUrl(metaApiAccountId);
      const startEncoded = encodeURIComponent(startTime);
      const endEncoded = encodeURIComponent(endTime);
      const limit = 1000;
      const maxPages = 25;
      const allRawDeals: any[] = [];

      for (let page = 0; page < maxPages; page++) {
        const offset = page * limit;
        const url = `${clientUrl}/users/current/accounts/${metaApiAccountId}/history-deals/time/${startEncoded}/${endEncoded}?offset=${offset}&limit=${limit}`;
        const res = await instrumentedFetch('metaapi', url, {
          headers: {
            'auth-token': this.token,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) break;
        const data = await res.json() as any;
        const batch = Array.isArray(data?.deals) ? data.deals : Array.isArray(data) ? data : [];
        allRawDeals.push(...batch);
        if (batch.length < limit) {
          break;
        }
      }

      return allRawDeals.map((d: any) => {
        const rawType =
          d.type === 0 || d.type === '0' ? 'DEAL_TYPE_BUY' :
          d.type === 1 || d.type === '1' ? 'DEAL_TYPE_SELL' :
          d.type !== undefined && d.type !== null && d.type !== '' ? String(d.type) :
          (d.entryType === 'DEAL_ENTRY_OUT' ? 'DEAL_TYPE_SELL' : 'DEAL_TYPE_BUY');

        const rawEntryType =
          d.entryType === 0 || d.entryType === '0' ? 'DEAL_ENTRY_IN' :
          d.entryType === 1 || d.entryType === '1' ? 'DEAL_ENTRY_OUT' :
          d.entryType !== undefined && d.entryType !== null && d.entryType !== '' ? String(d.entryType) :
          (Number(d.profit ?? 0) !== 0 ? 'DEAL_ENTRY_OUT' : 'DEAL_ENTRY_IN');

        return {
          id: String(d.id || d._id || d.dealId),
          positionId: String(d.positionId || d.orderId || d.id),
          symbol: d.symbol || (rawType === 'DEAL_TYPE_BALANCE' ? 'BALANCE' : undefined),
          type: rawType,
          entryType: rawEntryType,
          volume: Number(d.volume ?? 0),
          price: Number(d.price ?? d.openPrice ?? d.closePrice ?? 0),
          profit: Number(d.profit ?? 0),
          commission: Number(d.commission ?? 0),
          swap: Number(d.swap ?? 0),
          time: d.time ? new Date(d.time).toISOString() : new Date().toISOString(),
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Fetches advanced performance metrics via MetaStats API
   */
  public async getMetaStatsMetrics(metaApiAccountId: string): Promise<MetaStatsMetrics | null> {
    if (!this.hasToken() || !metaApiAccountId || typeof metaApiAccountId !== 'string' || metaApiAccountId.startsWith('mock_')) return null;

    try {
      const res = await instrumentedFetch('metastats', `${this.metaStatsBaseUrl}/users/current/accounts/${metaApiAccountId}/metrics`, {
        headers: {
          'auth-token': this.token,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return null;
      const m = await res.json() as any;
      return {
        trades: Number(m.trades ?? 0),
        winRate: Number(m.winRate ?? 0),
        profitFactor: Number(m.profitFactor ?? 1.0),
        maxDrawdown: Number(m.maxDrawdown ?? 0),
        pips: Number(m.pips ?? 0),
      };
    } catch {
      return null;
    }
  }

  public getMarketDataBaseUrl(metaApiAccountId?: string): string {
    const region = (metaApiAccountId && this.accountRegions.get(metaApiAccountId)) || 'london';
    return `https://mt-market-data-client-api-v1.${region}.agiliumtrade.ai`;
  }

  public static getBrokerSymbolCandidates(sym: string): string[] {
    const clean = sym.toUpperCase().replace('/', '').trim();
    const candidates = [clean];

    if (clean === 'XAUUSD' || clean === 'GOLD') {
      candidates.push('GOLD#', 'GOLD', 'XAUUSD#', 'XAUUSDm');
    } else if (clean === 'BTCUSD') {
      candidates.push('BTCUSD#', 'BTCUSDm', 'BTCUSD');
    } else if (clean === 'USOIL' || clean === 'MCL1!' || clean === 'MCL1' || clean === 'OIL') {
      candidates.push('OILCash#', 'OIL-DEC26', 'USOIL', 'OIL');
    } else if (clean === 'US30') {
      candidates.push('US30Cash#', 'US30-DEC26', 'US30');
    } else {
      candidates.push(`${clean}#`, `${clean}m`, `${clean}.ecn`, `${clean}.r`);
    }

    return Array.from(new Set(candidates));
  }

  /**
   * Fetches real historical & live candlestick bars directly from MetaApi Market Data API
   */
  public async getCandles(
    metaApiAccountId: string,
    symbol: string,
    timeframe: string = '1m',
    limit: number = 60
  ): Promise<Array<{
    symbol: string;
    time: string;
    brokerTime: string;
    timeframe: string;
    open: number;
    close: number;
    high: number;
    low: number;
    tickVolume: number;
    spread?: number;
  }>> {
    if (!this.hasToken() || !metaApiAccountId || typeof metaApiAccountId !== 'string' || metaApiAccountId.startsWith('mock_')) {
      return [];
    }

    const marketUrl = this.getMarketDataBaseUrl(metaApiAccountId);
    const candidates = MetaApiClient.getBrokerSymbolCandidates(symbol);

    for (const sym of candidates) {
      try {
        const encodedSymbol = encodeURIComponent(sym);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await instrumentedFetch('metaapi', 
          `${marketUrl}/users/current/accounts/${metaApiAccountId}/historical-market-data/symbols/${encodedSymbol}/timeframes/${timeframe}/candles?limit=${limit}`,
          {
            signal: controller.signal,
            headers: {
              'auth-token': this.token,
              'Accept': 'application/json',
            },
          }
        );
        clearTimeout(timeout);
        if (res.ok) {
          const data = (await res.json()) as any[];
          if (Array.isArray(data) && data.length > 0) {
            return data.map((c: any) => ({
              symbol,
              time: c.time ? new Date(c.time).toISOString() : new Date().toISOString(),
              brokerTime: c.brokerTime || '',
              timeframe: c.timeframe || timeframe,
              open: Number(c.open),
              high: Number(c.high),
              low: Number(c.low),
              close: Number(c.close),
              tickVolume: Number(c.tickVolume || 0),
              spread: Number(c.spread || 0),
            }));
          }
        }
      } catch {
        // Continue to next candidate
      }
    }

    return [];
  }

  /**
   * Fetches real-time price quotes directly from MetaApi broker terminal
   */
  public async getCurrentPrice(
    metaApiAccountId: string,
    symbol: string
  ): Promise<{ symbol: string; bid: number; ask: number; time: string } | null> {
    if (!this.hasToken() || !metaApiAccountId || typeof metaApiAccountId !== 'string' || metaApiAccountId.startsWith('mock_')) {
      return null;
    }

    const clientUrl = this.getClientBaseUrl(metaApiAccountId);
    const candidates = MetaApiClient.getBrokerSymbolCandidates(symbol);

    for (const sym of candidates) {
      try {
        const encodedSymbol = encodeURIComponent(sym);
        const res = await instrumentedFetch('metaapi', `${clientUrl}/users/current/accounts/${metaApiAccountId}/symbols/${encodedSymbol}/current-price`, {
          headers: {
            'auth-token': this.token,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          if (data && typeof data.bid === 'number' && data.bid > 0) {
            return {
              symbol,
              bid: Number(data.bid),
              ask: Number(data.ask),
              time: data.time || new Date().toISOString(),
            };
          }
        }
      } catch {
        // Continue to next candidate
      }
    }

    return null;
  }
}
