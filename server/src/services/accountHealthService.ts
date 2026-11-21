/**
 * Broker connection health monitoring.
 *
 * Every 5 minutes (bounded concurrency) reads each owned account's MetaApi connection
 * status and applies the product policy (docs/prompts/broker-connection-hardening.md):
 *   - disconnected > 15 min  -> DISCONNECTED + leaderboard STALE (rank frozen, no new points)
 *   - disconnected > 7 days  -> REMOVED from active rankings + MetaApi account undeployed
 *   - reconnected            -> ACTIVE again (verified data resumes)
 * Operators get one email when > 20% of monitored accounts (and at least 3) are
 * disconnected at once — usually a broker or MetaApi outage.
 */

import { TradingAccount } from '../../../shared/src/types.js';
import { MetaApiClient } from '../workers/metaApiClient.js';
import { AccountConnectorService } from '../connector/accountConnector.js';
import { LeaderboardService } from './leaderboardService.js';
import { alertService } from './alertService.js';

export const STALE_AFTER_MS = 15 * 60 * 1000;
export const REMOVE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const MASS_DISCONNECT_RATIO = 0.2;
const MASS_DISCONNECT_MIN = 3;

export interface BrokerHealthSummary {
  checkedAt: string | null;
  monitored: number;
  connected: number;
  connecting: number;
  disconnected: number;
  stale: number;
  removed: number;
  oldestDisconnects: Array<{ accountRef: string; broker: string; server?: string; disconnectedSince: string }>;
  deployedMetaApiAccounts: number;
}

const maskRef = (id?: string) => (id ? `${id.slice(0, 4)}…${id.slice(-3)}` : '');

export class AccountHealthService {
  private static instance: AccountHealthService;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private lastSummary: BrokerHealthSummary = {
    checkedAt: null, monitored: 0, connected: 0, connecting: 0, disconnected: 0, stale: 0, removed: 0,
    oldestDisconnects: [], deployedMetaApiAccounts: 0,
  };
  private metaApi = new MetaApiClient();

  public static readonly INTERVAL_MS = 5 * 60 * 1000;
  public static readonly CONCURRENCY = 5;

  public static getInstance(): AccountHealthService {
    if (!AccountHealthService.instance) AccountHealthService.instance = new AccountHealthService();
    return AccountHealthService.instance;
  }

  /** Test hook. */
  public setMetaApiClient(client: MetaApiClient): void {
    this.metaApi = client;
  }

  public start(): void {
    if (this.timer || !this.metaApi.hasToken()) return;
    // First pass shortly after startup (cloud sync loads accounts first)
    const first = setTimeout(() => this.runOnce().catch(() => {}), 60_000);
    first.unref?.();
    this.timer = setInterval(() => this.runOnce().catch(err => console.warn('[Health] run failed:', err)), AccountHealthService.INTERVAL_MS);
    this.timer.unref?.();
  }

  public stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  public getSummary(): BrokerHealthSummary {
    return this.lastSummary;
  }

  /** One monitoring pass. `now` is injectable for tests. */
  public async runOnce(now = Date.now()): Promise<BrokerHealthSummary> {
    if (this.running) return this.lastSummary;
    this.running = true;
    try {
      const connector = AccountConnectorService.getInstance();
      const leaderboard = LeaderboardService.getInstance();
      const accounts = connector
        .getAllAccountRecords()
        .filter(a => a.metaApiAccountId && !a.metaApiAccountId.startsWith('mock_') && a.userId);

      const queue = [...accounts];
      const workers = Array.from({ length: Math.min(AccountHealthService.CONCURRENCY, queue.length) }, async () => {
        while (queue.length) {
          const acc = queue.shift()!;
          await this.checkAccount(acc, now, leaderboard).catch(err =>
            console.warn(`[Health] check failed for ${maskRef(acc.metaApiAccountId)}:`, err instanceof Error ? err.message : String(err))
          );
        }
      });
      await Promise.all(workers);

      this.lastSummary = this.summarize(accounts, now, leaderboard);
      await this.evaluateMassDisconnect(this.lastSummary);
      return this.lastSummary;
    } finally {
      this.running = false;
    }
  }

  private async checkAccount(acc: TradingAccount, now: number, leaderboard: LeaderboardService): Promise<void> {
    const state = await this.metaApi.getAccountState(acc.metaApiAccountId!);
    if (!state) return; // MetaApi unreachable: no evidence either way, keep current status

    const nowIso = new Date(now).toISOString();
    if (state.connectionStatus === 'CONNECTED') {
      if (acc.connectionStatus !== 'CONNECTED' || acc.disconnectedSince) {
        console.log(`[Health] ${maskRef(acc.metaApiAccountId)} reconnected`);
      }
      acc.connectionStatus = 'CONNECTED';
      acc.lastError = undefined;
      acc.disconnectedSince = undefined;
      acc.lastConnectedAt = nowIso;
      if (state.state === 'UNDEPLOYED') return;
      leaderboard.setAccountHealth(acc.id, 'ACTIVE');
      return;
    }

    // Undeployed by us after the removal window: stays removed until the user reconnects
    if (state.state === 'UNDEPLOYED' && leaderboard.getAccountHealth(acc.id) === 'REMOVED') return;

    const since = acc.disconnectedSince ? Date.parse(acc.disconnectedSince) : now;
    if (!acc.disconnectedSince) acc.disconnectedSince = nowIso;
    const downFor = now - since;

    if (downFor >= REMOVE_AFTER_MS) {
      if (leaderboard.getAccountHealth(acc.id) !== 'REMOVED') {
        leaderboard.setAccountHealth(acc.id, 'REMOVED');
        acc.connectionStatus = 'DISCONNECTED';
        acc.lastError = 'Broker connection lost for over 7 days. Re-enter your investor password to rejoin the rankings.';
        await this.metaApi.undeployAccount(acc.metaApiAccountId!).catch(() => false);
        console.warn(`[Health] ${maskRef(acc.metaApiAccountId)} removed from rankings and undeployed after 7 days`);
      }
    } else if (downFor >= STALE_AFTER_MS) {
      leaderboard.setAccountHealth(acc.id, 'STALE');
      acc.connectionStatus = 'DISCONNECTED';
      acc.lastError = 'Broker login failed or was lost. Re-enter the investor password and verify the server name.';
    } else {
      // Short blips (broker restarts, MetaApi redeploys) are tolerated
      acc.connectionStatus = 'SYNCING';
    }
  }

  private summarize(accounts: TradingAccount[], now: number, leaderboard: LeaderboardService): BrokerHealthSummary {
    const health = accounts.map(a => leaderboard.getAccountHealth(a.id));
    const disconnected = accounts.filter(a => a.connectionStatus === 'DISCONNECTED');
    return {
      checkedAt: new Date(now).toISOString(),
      monitored: accounts.length,
      connected: accounts.filter(a => a.connectionStatus === 'CONNECTED').length,
      connecting: accounts.filter(a => a.connectionStatus === 'SYNCING').length,
      disconnected: disconnected.length,
      stale: health.filter(h => h === 'STALE').length,
      removed: health.filter(h => h === 'REMOVED').length,
      oldestDisconnects: disconnected
        .filter(a => a.disconnectedSince)
        .sort((a, b) => a.disconnectedSince!.localeCompare(b.disconnectedSince!))
        .slice(0, 10)
        .map(a => ({ accountRef: maskRef(a.metaApiAccountId), broker: a.broker, server: a.serverName, disconnectedSince: a.disconnectedSince! })),
      deployedMetaApiAccounts: accounts.length - health.filter(h => h === 'REMOVED').length,
    };
  }

  private async evaluateMassDisconnect(summary: BrokerHealthSummary): Promise<void> {
    const key = 'health:mass-disconnect';
    const notConnected = summary.disconnected + summary.connecting;
    const isMass = summary.monitored > 0 &&
      notConnected >= MASS_DISCONNECT_MIN &&
      notConnected / summary.monitored > MASS_DISCONNECT_RATIO;
    if (isMass) {
      await alertService.sendOperatorAlert({
        severity: 'critical',
        title: `${notConnected}/${summary.monitored} broker accounts not connected`,
        body: `Possible broker or MetaApi outage.\nConnected: ${summary.connected}\nReconnecting: ${summary.connecting}\nDisconnected: ${summary.disconnected}\nStale: ${summary.stale}\nSee GET /api/admin/broker-health`,
        dedupeKey: key,
      });
    } else {
      await alertService.resolveOperatorAlert(key, 'Broker account connectivity recovered',
        `Connected: ${summary.connected}/${summary.monitored}`);
    }
  }
}

export const accountHealthService = AccountHealthService.getInstance();
