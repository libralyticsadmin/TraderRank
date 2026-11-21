import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccountHealthService, STALE_AFTER_MS, REMOVE_AFTER_MS } from '../src/services/accountHealthService.js';
import { AccountConnectorService } from '../src/connector/accountConnector.js';
import { LeaderboardService } from '../src/services/leaderboardService.js';
import { MetaApiClient } from '../src/workers/metaApiClient.js';
import { alertService } from '../src/services/alertService.js';

const TOKEN = 'live_token_1234567890abcdef';
const connectionStatus = new Map<string, string>();
const calls: string[] = [];
// Test storage persists across runs (os.tmpdir); use run-unique logins to avoid restored records
const RUN = String(Date.now()).slice(-6);

function stubMetaApi() {
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method || 'GET'} ${url}`);
    const m = url.match(/\/accounts\/(meta_h_\d+)(\/undeploy)?$/);
    if (m && m[2]) return new Response('{}', { status: 204 });
    if (m) {
      return new Response(JSON.stringify({ state: 'DEPLOYED', connectionStatus: connectionStatus.get(m[1]) || 'CONNECTED' }), { status: 200 });
    }
    return new Response('[]', { status: 200 });
  }));
}

async function connect(n: number) {
  const login = `7${RUN}${n}`;
  const { account } = await AccountConnectorService.getInstance().registerVerifiedAccount(
    `u_health_${n}`, `HealthTrader${n}`, 'XM',
    { type: 'mt_gateway', broker: 'XM', platform: 'MT5', serverName: 'XMGlobal-MT5 10', login, investorPassword: 'pw' },
    { success: true, accountDetails: { accountNumber: login, balance: 500, equity: 500, currency: 'USD', leverage: 500, metaApiAccountId: `meta_h_${n}` } }
  );
  return account;
}

describe('AccountHealthService — pause then remove policy', () => {
  const health = AccountHealthService.getInstance();
  const leaderboard = LeaderboardService.getInstance();

  beforeEach(() => {
    vi.unstubAllGlobals();
    connectionStatus.clear();
    calls.length = 0;
    alertService.reset();
    stubMetaApi();
    health.setMetaApiClient(new MetaApiClient(TOKEN));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('tolerates blips, freezes after 15 min, removes and undeploys after 7 days, recovers on reconnect', async () => {
    const acc = await connect(1);
    const t0 = Date.now();
    connectionStatus.set('meta_h_1', 'DISCONNECTED');

    await health.runOnce(t0);
    expect(acc.connectionStatus).toBe('SYNCING');
    expect(leaderboard.getAccountHealth(acc.id)).toBe('ACTIVE');

    await health.runOnce(t0 + STALE_AFTER_MS + 1000);
    expect(acc.connectionStatus).toBe('DISCONNECTED');
    expect(leaderboard.getAccountHealth(acc.id)).toBe('STALE');
    const entry = leaderboard.getLeaderboard(100).find(e => e.userId === 'u_health_1');
    expect(entry?.stale).toBe(true);

    await health.runOnce(t0 + REMOVE_AFTER_MS + 1000);
    expect(leaderboard.getAccountHealth(acc.id)).toBe('REMOVED');
    expect(leaderboard.getLeaderboard(100).some(e => e.userId === 'u_health_1')).toBe(false);
    expect(calls.some(c => c === `POST ${'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai'}/users/current/accounts/meta_h_1/undeploy`)).toBe(true);

    // User re-enters credentials -> verified reconnect lifts the removal
    await connect(1);
    expect(leaderboard.getAccountHealth(acc.id)).toBe('ACTIVE');
  });

  it('stale accounts earn no new leaderboard points', async () => {
    const acc = await connect(2);
    leaderboard.setAccountHealth(acc.id, 'STALE');
    const before = leaderboard.getLeaderboard(100).find(e => e.userId === 'u_health_2')?.closedPips ?? 0;
    const { RedisStreamsBus } = await import('../src/eventbus/redisStreamsBus.js');
    await RedisStreamsBus.getInstance().publish('stream:trade.closed.normalized', 'trade.closed.normalized', acc.id, {
      id: 'tr_stale_1', accountId: acc.id, ticket: 'x1', symbol: 'EURUSD', side: 'BUY', volume: 1,
      openPrice: 1.1, closePrice: 1.11, pnlPips: 100, pnlCurrency: 100, openTime: new Date().toISOString(), closeTime: new Date().toISOString(),
    } as never);
    const after = leaderboard.getLeaderboard(100).find(e => e.userId === 'u_health_2')?.closedPips ?? 0;
    expect(after).toBe(before);

    // Control: the same event on an ACTIVE account does score
    leaderboard.setAccountHealth(acc.id, 'ACTIVE');
    await RedisStreamsBus.getInstance().publish('stream:trade.closed.normalized', 'trade.closed.normalized', acc.id, {
      id: 'tr_active_1', accountId: acc.id, ticket: 'x2', symbol: 'EURUSD', side: 'BUY', volume: 1,
      openPrice: 1.1, closePrice: 1.11, pnlPips: 100, pnlCurrency: 100, openTime: new Date().toISOString(), closeTime: new Date().toISOString(),
    } as never);
    await new Promise(r => setTimeout(r, 10));
    const scored = leaderboard.getLeaderboard(100).find(e => e.userId === 'u_health_2')?.closedPips ?? 0;
    expect(scored).toBeGreaterThan(before);
  });

  it('emails operators once on mass disconnect and once on recovery', async () => {
    const sent: string[] = [];
    alertService.setTransport({ send: async subject => { sent.push(subject); return true; } });
    for (const n of [3, 4, 5]) await connect(n);
    // Every account known to the connector is monitored; disconnect all of them
    for (const a of AccountConnectorService.getInstance().getAllAccountRecords()) {
      if (a.metaApiAccountId) connectionStatus.set(a.metaApiAccountId, 'DISCONNECTED');
    }
    const t0 = Date.now();
    await health.runOnce(t0);
    await health.runOnce(t0 + 60_000);
    expect(sent.filter(s => s.includes('[CRITICAL]')).length).toBe(1);

    connectionStatus.clear();
    await health.runOnce(t0 + 120_000);
    expect(sent.filter(s => s.includes('[RECOVERED]')).length).toBe(1);
  });
});
