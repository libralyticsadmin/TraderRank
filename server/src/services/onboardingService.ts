/**
 * Background broker onboarding (live mode).
 *
 * MetaApi provisioning is asynchronous: deploy + broker login takes 30s to several minutes.
 * Instead of blocking an HTTP request, POST /api/connector/connect creates a persisted job
 * and returns 202 immediately. A single shared loop advances jobs with bounded concurrency:
 *
 *   PROVISIONING -> CONNECTING -> CONNECTED | FAILED(reason)
 *
 * The TradingAccount is created only once MetaApi is CONNECTED and real account information
 * has been read — never with placeholder figures.
 */

import crypto from 'crypto';
import { Broker, GatewayCredentials, TradingAccount } from '../../../shared/src/types.js';
import { MetaApiClient } from '../workers/metaApiClient.js';
import { SecretsVault } from '../vault/secretsVault.js';
import { AccountConnectorService } from '../connector/accountConnector.js';
import { r2Storage } from './r2StorageService.js';
import { alertService } from './alertService.js';

export type OnboardingStatus = 'PROVISIONING' | 'CONNECTING' | 'CONNECTED' | 'FAILED';
export type OnboardingFailureReason =
  | 'INVALID_CREDENTIALS'
  | 'SERVER_NOT_FOUND'
  | 'BROKER_UNREACHABLE'
  | 'TIMEOUT'
  | 'QUOTA_EXCEEDED'
  | 'INTEGRATION_ERROR'
  | 'RATE_LIMITED';

export interface OnboardingJob {
  id: string;
  userId: string;
  username: string;
  broker: Broker;
  platform: 'MT4' | 'MT5';
  login: string;
  serverName: string;
  status: OnboardingStatus;
  reason?: OnboardingFailureReason;
  error?: string;
  metaApiAccountId?: string;
  /** True when this job created the MetaApi account (so it may undeploy it on failure). */
  createdMetaApiAccount?: boolean;
  accountId?: string;
  vaultSecretRef?: string;
  attempts: number;
  nextCheckAt: number;
  deadlineAt: number;
  createdAt: string;
  updatedAt: string;
  dismissed?: boolean;
}

/** Public, credential-free view returned to the client. */
export type OnboardingJobView = Omit<OnboardingJob, 'vaultSecretRef' | 'metaApiAccountId' | 'createdMetaApiAccount' | 'nextCheckAt'> & {
  account?: TradingAccount;
};

const VAULT_CALLER = 'OnboardingService';
const STORAGE_KEY = 'onboarding/jobs.json';

export const ONBOARDING_FAILURE_MESSAGES: Record<OnboardingFailureReason, string> = {
  INVALID_CREDENTIALS: 'The broker rejected the login. Check the account number and the investor (read-only) password.',
  SERVER_NOT_FOUND: 'The broker server name was not recognised. Copy the exact server name from your broker welcome email or MT4/MT5 terminal.',
  BROKER_UNREACHABLE: 'The broker server could not be reached. It may be under maintenance — please try again later.',
  TIMEOUT: 'We could not log in to the broker in time. This usually means the investor password or server name is wrong. Please re-enter them.',
  QUOTA_EXCEEDED: 'Our broker connection capacity is temporarily full. Our team has been notified — please try again later.',
  INTEGRATION_ERROR: 'A temporary problem on our side prevented the connection. Our team has been notified — please try again shortly.',
  RATE_LIMITED: 'Login attempts for this account were rejected too many times recently. The broker has placed the account on a temporary cooldown (~15 minutes). Please wait before retrying with your verified MT5 password.',
};

export class OnboardingService {
  private static instance: OnboardingService;

  private readonly jobs = new Map<string, OnboardingJob>();
  private readonly inFlight = new Set<string>();
  private readonly running = new Set<Promise<void>>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private loadPromise: Promise<void> | null = null;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  private metaApi = new MetaApiClient();
  private vault = SecretsVault.getInstance();

  public static readonly CONCURRENCY = 5;
  public static readonly TICK_MS = 1000;
  public static readonly TERMINAL_RETENTION_MS = 24 * 60 * 60 * 1000;

  public static getInstance(): OnboardingService {
    if (!OnboardingService.instance) OnboardingService.instance = new OnboardingService();
    return OnboardingService.instance;
  }

  private get timeoutMs(): number {
    const v = Number(process.env.ONBOARDING_TIMEOUT_MS);
    return Number.isFinite(v) && v > 0 ? v : 5 * 60 * 1000;
  }

  /** Test hook. */
  public setMetaApiClient(client: MetaApiClient): void {
    this.metaApi = client;
  }

  /** Test hook. */
  public reset(): void {
    this.stop();
    this.jobs.clear();
    this.inFlight.clear();
    this.loadPromise = null;
  }

  public start(): void {
    if (this.timer) return;
    this.ensureLoaded().catch(() => {});
    this.timer = setInterval(() => {
      this.processDueJobs().catch(err => console.warn('[Onboarding] tick error:', err));
    }, OnboardingService.TICK_MS);
    this.timer.unref?.();
  }

  public stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  public ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        if (process.env.VITEST) return;
        try {
          const saved = await r2Storage.getJson<OnboardingJob[]>(STORAGE_KEY);
          if (Array.isArray(saved)) {
            for (const job of saved) {
              if (job?.id && !this.jobs.has(job.id)) {
                // Resume immediately after a restart
                if (job.status === 'PROVISIONING' || job.status === 'CONNECTING') job.nextCheckAt = Date.now();
                this.jobs.set(job.id, job);
              }
            }
          }
        } catch (err) {
          console.warn('[Onboarding] could not load persisted jobs:', err instanceof Error ? err.message : String(err));
        }
      })();
    }
    return this.loadPromise;
  }

  /**
   * Creates (or returns the existing active) onboarding job. Throws an Error with
   * code ACCOUNT_OWNED_BY_OTHER when the login belongs to another user.
   */
  public async startJob(userId: string, username: string, broker: Broker, creds: GatewayCredentials): Promise<OnboardingJob> {
    await this.ensureLoaded();
    const login = String(creds.login || '').trim();
    const serverName = String(creds.serverName || '').trim();
    if (!login || !serverName || !creds.investorPassword) {
      throw new Error('Server name, account login, and investor password are required.');
    }

    const connector = AccountConnectorService.getInstance();
    const ownerId = connector.findOwnerUserIdByLogin(login);
    if (ownerId && !AccountConnectorService.isSameOwner(ownerId, userId)) {
      const err = new Error('This broker account is already connected to another TraderRank user');
      (err as Error & { code?: string }).code = 'ACCOUNT_OWNED_BY_OTHER';
      throw err;
    }

    const existing = Array.from(this.jobs.values()).find(
      j => j.userId === userId && j.login === login && j.serverName.toLowerCase() === serverName.toLowerCase() &&
        (j.status === 'PROVISIONING' || j.status === 'CONNECTING')
    );
    if (existing) return existing;

    const vaultSecretRef = await this.vault.storeSecret(VAULT_CALLER, { ...creds, login, serverName });
    const now = Date.now();
    const job: OnboardingJob = {
      id: `onb_${crypto.randomUUID()}`,
      userId,
      username,
      broker,
      platform: creds.platform || 'MT5',
      login,
      serverName,
      status: 'PROVISIONING',
      vaultSecretRef,
      attempts: 0,
      nextCheckAt: now,
      deadlineAt: now + this.timeoutMs,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };
    this.jobs.set(job.id, job);
    this.schedulePersist();
    // Kick off right away instead of waiting for the next tick
    this.runJob(job.id).catch(() => {});
    return job;
  }

  public getJob(id: string, userId: string): OnboardingJob | null {
    const job = this.jobs.get(id);
    if (!job || !AccountConnectorService.isSameOwner(job.userId, userId)) return null;
    return job;
  }

  public listJobsForUser(userId: string): OnboardingJob[] {
    return Array.from(this.jobs.values())
      .filter(j => !j.dismissed && AccountConnectorService.isSameOwner(j.userId, userId))
      .filter(j => j.status !== 'CONNECTED' || Date.now() - Date.parse(j.updatedAt) < 10 * 60 * 1000)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public dismissJob(id: string, userId: string): boolean {
    const job = this.getJob(id, userId);
    if (!job || job.status === 'PROVISIONING' || job.status === 'CONNECTING') return false;
    job.dismissed = true;
    this.schedulePersist();
    return true;
  }

  public toView(job: OnboardingJob): OnboardingJobView {
    const { vaultSecretRef: _v, metaApiAccountId: _m, createdMetaApiAccount: _c, nextCheckAt: _n, ...rest } = job;
    const account = job.accountId ? AccountConnectorService.getInstance().getAccount(job.accountId) || undefined : undefined;
    const safeAccount = account ? ({ ...account, vaultSecretRef: '***', metaApiAccountId: account.metaApiAccountId ? '***' : undefined } as TradingAccount) : undefined;
    return { ...rest, account: safeAccount };
  }

  /** Resolves when no job step is running. Test hook. */
  public async waitForIdle(): Promise<void> {
    while (this.running.size) await Promise.allSettled(Array.from(this.running));
  }

  /** Advances every due job (bounded concurrency). Exposed for tests. */
  public async processDueJobs(): Promise<void> {
    await this.ensureLoaded();
    this.pruneTerminalJobs();
    const now = Date.now();
    const due = Array.from(this.jobs.values())
      .filter(j => (j.status === 'PROVISIONING' || j.status === 'CONNECTING') && j.nextCheckAt <= now && !this.inFlight.has(j.id))
      .slice(0, Math.max(0, OnboardingService.CONCURRENCY - this.inFlight.size));
    await Promise.all(due.map(j => this.runJob(j.id)));
  }

  private runJob(id: string): Promise<void> {
    const p = this.runJobInner(id);
    this.running.add(p);
    return p.finally(() => this.running.delete(p));
  }

  private async runJobInner(id: string): Promise<void> {
    const job = this.jobs.get(id);
    if (!job || this.inFlight.has(id)) return;
    if (job.status !== 'PROVISIONING' && job.status !== 'CONNECTING') return;
    this.inFlight.add(id);
    try {
      if (Date.now() > job.deadlineAt) {
        await this.fail(job, 'TIMEOUT');
        return;
      }
      job.attempts += 1;
      if (job.status === 'PROVISIONING') {
        await this.provision(job);
      } else {
        await this.checkConnection(job);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const reason = OnboardingService.classifyError(message);
      if (reason) {
        await this.fail(job, reason, message);
      } else {
        // Transient (network / 5xx / 429): retry with backoff until the deadline
        job.error = message.slice(0, 300);
        this.reschedule(job);
      }
    } finally {
      this.inFlight.delete(id);
      job.updatedAt = new Date().toISOString();
      this.schedulePersist();
    }
  }

  private async provision(job: OnboardingJob): Promise<void> {
    const creds = await this.readCreds(job);
    if (!creds) {
      await this.fail(job, 'INTEGRATION_ERROR', 'Stored credentials unavailable (server restarted before provisioning).');
      return;
    }
    const { id, isNew, state } = await this.metaApi.createOrGetAccount(job.serverName, job.login, creds.investorPassword, job.platform);
    if (!id) throw new Error('MetaApi did not return an account id');
    job.metaApiAccountId = id;
    job.createdMetaApiAccount = isNew;
    if (state === 'DRAFT' || state === 'UNDEPLOYED') {
      await this.metaApi.deployAccount(id);
    }
    job.status = 'CONNECTING';
    job.error = undefined;
    job.attempts = 0; // Reset attempts so broker connection check has a clean counter
    job.nextCheckAt = Date.now() + 2000;
  }

  private async checkConnection(job: OnboardingJob): Promise<void> {
    const id = job.metaApiAccountId;
    if (!id) {
      job.status = 'PROVISIONING';
      job.nextCheckAt = Date.now();
      return;
    }
    const state = await this.metaApi.getAccountState(id);
    console.log(`[Onboarding] ${job.id} (${job.login}@${job.serverName}) state: ${state?.state}, connection: ${state?.connectionStatus}, reason: ${state?.disconnectedReason || 'none'}, attempt: ${job.attempts}`);

    if (!state) {
      this.reschedule(job);
      return;
    }

    if (state.connectionStatus === 'DISCONNECTED') {
      if (state.disconnectedReason) {
        const reason = OnboardingService.classifyDisconnectedReason(state.disconnectedReason);
        if (reason) {
          await this.fail(job, reason, `Broker rejected connection: ${state.disconnectedReason}`);
          return;
        }
      }
      // Note: Do NOT assume invalid credentials purely based on attempt count or DISCONNECTED status,
      // as MetaTrader 4/5 cloud containers take 30-60+ seconds to complete broker handshakes.
      // MetaApi populates disconnectedReason when credentials or server are actually rejected by the broker.
      // If no reason is reported, connection check retries until deadlineAt.
    }

    if (state.state === 'FAILED') {
      await this.fail(job, 'BROKER_UNREACHABLE', 'MetaApi account deployment failed');
      return;
    }

    if (state.connectionStatus !== 'CONNECTED') {
      this.reschedule(job);
      return;
    }
    const info = await this.metaApi.getAccountInformation(id);
    if (!info) {
      this.reschedule(job);
      return;
    }
    const creds = await this.readCreds(job);
    if (!creds) {
      await this.fail(job, 'INTEGRATION_ERROR', 'Stored credentials unavailable (server restarted).');
      return;
    }

    const { account } = await AccountConnectorService.getInstance().registerVerifiedAccount(
      job.userId,
      job.username,
      job.broker,
      creds,
      {
        success: true,
        accountDetails: {
          accountNumber: job.login,
          server: job.serverName,
          balance: info.balance,
          equity: info.equity,
          margin: info.margin,
          freeMargin: info.freeMargin,
          currency: info.currency,
          leverage: info.leverage,
          metaApiAccountId: id,
        },
      }
    );
    job.accountId = account.id;
    job.status = 'CONNECTED';
    job.error = undefined;
    await this.revokeCreds(job);
    console.log(`[Onboarding] ${job.id} CONNECTED after ${job.attempts} checks`);
  }

  private reschedule(job: OnboardingJob): void {
    // 2s, 4s, 8s, 16s, then every 30s
    const delay = Math.min(30_000, 2000 * Math.pow(2, Math.max(0, job.attempts - 1)));
    job.nextCheckAt = Math.min(Date.now() + delay, job.deadlineAt + 1);
  }

  private async fail(job: OnboardingJob, reason: OnboardingFailureReason, detail?: string): Promise<void> {
    job.status = 'FAILED';
    job.reason = reason;
    job.error = ONBOARDING_FAILURE_MESSAGES[reason];
    console.warn(`[Onboarding] ${job.id} FAILED (${reason})${detail ? `: ${detail.slice(0, 200)}` : ''}`);
    await this.revokeCreds(job);

    // Free the paid MetaApi slot if this job created an account that never connected
    if (job.metaApiAccountId && job.createdMetaApiAccount) {
      await this.metaApi.undeployAccount(job.metaApiAccountId).catch(() => false);
    }

    // Clean up rejected or rate-limited accounts so no contaminated cooldown state persists in MetaApi
    if (job.metaApiAccountId && (reason === 'INVALID_CREDENTIALS' || reason === 'RATE_LIMITED')) {
      await this.metaApi.deleteAccount(job.metaApiAccountId).catch(() => false);
    }

    if (reason === 'INTEGRATION_ERROR' || reason === 'QUOTA_EXCEEDED') {
      await alertService.sendOperatorAlert({
        severity: 'critical',
        title: `Broker onboarding failing: ${reason}`,
        body: `Onboarding job ${job.id} for broker ${job.broker} (${job.serverName}) failed with ${reason}.\n${detail || ''}`,
        dedupeKey: `onboarding:${reason}`,
      });
    }
  }

  private async readCreds(job: OnboardingJob): Promise<GatewayCredentials | null> {
    if (!job.vaultSecretRef) return null;
    try {
      const creds = await this.vault.getSecret(VAULT_CALLER, job.vaultSecretRef);
      return creds && creds.type === 'mt_gateway' ? creds : null;
    } catch {
      return null;
    }
  }

  private async revokeCreds(job: OnboardingJob): Promise<void> {
    if (!job.vaultSecretRef) return;
    await this.vault.revokeSecret(VAULT_CALLER, job.vaultSecretRef).catch(() => false);
    job.vaultSecretRef = undefined;
  }

  private pruneTerminalJobs(): void {
    const cutoff = Date.now() - OnboardingService.TERMINAL_RETENTION_MS;
    for (const [id, job] of this.jobs) {
      if ((job.status === 'CONNECTED' || job.status === 'FAILED') && Date.parse(job.updatedAt) < cutoff) {
        this.jobs.delete(id);
      }
    }
  }

  private schedulePersist(): void {
    if (process.env.VITEST || this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      r2Storage.uploadJson(STORAGE_KEY, Array.from(this.jobs.values()), { 'x-traderrank-type': 'onboarding_jobs' })
        .catch(err => console.warn('[Onboarding] persist failed:', err instanceof Error ? err.message : String(err)));
    }, 500);
    this.persistTimer.unref?.();
  }

  /**
   * Maps MetaApi disconnectedReason to an onboarding failure reason.
   */
  public static classifyDisconnectedReason(reasonStr: string): OnboardingFailureReason | null {
    const r = String(reasonStr || '').toLowerCase();
    if (/cred|auth|password|login|disabled|not_found|account_not_found|err_invalid_credentials/i.test(r)) {
      return 'INVALID_CREDENTIALS';
    }
    if (/srv|server|host|unknown_server|e_srv_not_found/i.test(r)) {
      return 'SERVER_NOT_FOUND';
    }
    if (/unreach|cannot_connect|network|e_connect/i.test(r)) {
      return 'BROKER_UNREACHABLE';
    }
    return null;
  }

  /**
   * Maps a MetaApi error message to a terminal failure reason, or null when transient.
   * createOrGetAccount/update throw messages containing "(<status>)".
   */
  public static classifyError(message: string): OnboardingFailureReason | null {
    if (/rejected too many times|TooManyRequestsError|cooldown/i.test(message)) {
      return 'RATE_LIMITED';
    }
    const status = Number(message.match(/\((\d{3})\)/)?.[1] || 0);
    if (/slot|quota|subscription|limit exceeded|too many accounts/i.test(message) && status >= 400 && status < 500 && status !== 429) {
      return 'QUOTA_EXCEEDED';
    }
    if (status === 401 || status === 403) return 'INTEGRATION_ERROR';
    if (status === 429 || status === 0 || status >= 500) return null;
    if (status === 404 || /server.*(not found|unknown|invalid)|E_SRV_NOT_FOUND|failed to find server/i.test(message)) {
      return 'SERVER_NOT_FOUND';
    }
    if (status >= 400 && status < 500) return 'INVALID_CREDENTIALS';
    return null;
  }
}

export const onboardingService = OnboardingService.getInstance();
