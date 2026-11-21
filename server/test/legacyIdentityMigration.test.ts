import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import type { Server } from 'http';
import {
  runLegacyIdentityMigration,
  IDENTITY_STORE_KEYS,
  LEGACY_IDENTITY_MARKER_KEY,
  type IdentityStorage,
} from '../src/services/legacyIdentityMigration.js';
import { EMERALD_BEAR_AVATAR_URL } from '../src/core/avatarPresets.js';
import { AccountConnectorService } from '../src/connector/accountConnector.js';
import { LeaderboardService } from '../src/services/leaderboardService.js';
import { AuthService } from '../src/services/authService.js';
import { MetaApiClient } from '../src/workers/metaApiClient.js';
import { invalidateCanonicalStatsCache } from '../src/services/canonicalStatsService.js';
import { createServer } from '../src/api/server.js';

/** In-memory storage double that records writes. */
function memoryStorage(initial: Record<string, unknown> = {}) {
  const data = new Map<string, string>(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  const writes: string[] = [];
  const storage: IdentityStorage = {
    async getJson<T>(key: string) {
      const raw = data.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    },
    async uploadJson(key: string, value: unknown) {
      writes.push(key);
      data.set(key, JSON.stringify(value));
      return {};
    },
  };
  const read = (key: string) => {
    const raw = data.get(key);
    return raw ? JSON.parse(raw) : null;
  };
  return { storage, writes, read };
}

describe('Legacy identity migration (data, not code)', () => {
  it('writes owners, usernames, avatars and profiles for the legacy accounts', async () => {
    const mem = memoryStorage();
    const res = await runLegacyIdentityMigration({ storage: mem.storage });
    expect(res.status).toBe('applied');

    const owners = mem.read(IDENTITY_STORE_KEYS.owners);
    expect(owners['342186831']).toMatchObject({ userId: 'u_zzzemzzz', username: 'zzZEMZzz', broker: 'XM', serverName: 'XMGlobal-MT5 10' });
    expect(owners['411407722']).toMatchObject({ userId: 'u_homiesplant_th', username: 'HomiesPlant', broker: 'XM', serverName: 'XMGlobal-MT5 16' });
    expect(owners['72423906']).toMatchObject({ userId: 'u_homiesplant_th', username: 'HomiesPlant', broker: 'XMTrading', serverName: 'XMTrading-MT5 3' });

    const usernames = mem.read(IDENTITY_STORE_KEYS.usernames);
    expect(usernames['u_zzzemzzz']).toBe('zzZEMZzz');
    expect(usernames['72423906']).toBe('HomiesPlant');
    const avatars = mem.read(IDENTITY_STORE_KEYS.avatars);
    expect(avatars['u_homiesplant_th']).toBe(EMERALD_BEAR_AVATAR_URL);

    const profiles = mem.read(IDENTITY_STORE_KEYS.profiles);
    expect(profiles['u_zzzemzzz']).toMatchObject({ id: 'u_zzzemzzz', username: 'zzZEMZzz', avatarUrl: EMERALD_BEAR_AVATAR_URL });
    expect(profiles['u_homiesplant_th']).toMatchObject({ id: 'u_homiesplant_th', username: 'HomiesPlant' });
    expect(mem.read(LEGACY_IDENTITY_MARKER_KEY)).toMatchObject({ migration: 'legacy-identities-v1' });
  });

  it('is idempotent and never overwrites later user edits (marker)', async () => {
    const mem = memoryStorage();
    await runLegacyIdentityMigration({ storage: mem.storage });

    // The user later edits their public username and avatar.
    const profiles = mem.read(IDENTITY_STORE_KEYS.profiles);
    profiles['u_zzzemzzz'].username = 'RenamedByUser';
    profiles['u_zzzemzzz'].avatarUrl = 'preset:lion';
    await mem.storage.uploadJson(IDENTITY_STORE_KEYS.profiles, profiles);
    const usernames = mem.read(IDENTITY_STORE_KEYS.usernames);
    usernames['u_zzzemzzz'] = 'RenamedByUser';
    await mem.storage.uploadJson(IDENTITY_STORE_KEYS.usernames, usernames);
    mem.writes.length = 0;

    const again = await runLegacyIdentityMigration({ storage: mem.storage });
    expect(again.status).toBe('already-applied');
    expect(mem.writes).toEqual([]);
    expect(mem.read(IDENTITY_STORE_KEYS.profiles)['u_zzzemzzz']).toMatchObject({ username: 'RenamedByUser', avatarUrl: 'preset:lion' });
    expect(mem.read(IDENTITY_STORE_KEYS.usernames)['u_zzzemzzz']).toBe('RenamedByUser');
  });

  it('dry-run reports changes without writing anything', async () => {
    const mem = memoryStorage();
    const res = await runLegacyIdentityMigration({ storage: mem.storage, dryRun: true });
    expect(res.status).toBe('dry-run');
    expect(res.writtenKeys).toContain(IDENTITY_STORE_KEYS.owners);
    expect(res.changes.length).toBeGreaterThan(0);
    expect(mem.writes).toEqual([]);
  });

  it('rewrites legacy userId aliases in stored data and keeps unrelated records', async () => {
    const mem = memoryStorage({
      [IDENTITY_STORE_KEYS.owners]: {
        '72423906': { userId: 'usr_meta_72423906', accountNumber: '72423906', broker: 'XMTrading', connectedAt: '2026-05-01T00:00:00.000Z', status: 'CONNECTED' },
        '55500011': { userId: 'u_someone_else', accountNumber: '55500011', broker: 'Exness', connectedAt: '2026-05-01T00:00:00.000Z', status: 'CONNECTED' },
      },
      [IDENTITY_STORE_KEYS.usernames]: { u_emanuel001: 'Emanuel001', '55500011': 'SomeoneElse' },
      [IDENTITY_STORE_KEYS.profiles]: { u_homiesplant: { id: 'u_homiesplant', username: 'HomiesPlant', bio: 'kept' } },
      [IDENTITY_STORE_KEYS.credentials]: { u_homiesplant: { userId: 'u_homiesplant', email: 'h@example.com', username: 'HomiesPlant', salt: 's', hash: 'h' } },
      [IDENTITY_STORE_KEYS.tournaments]: { t1: { standings: [{ userId: 'usr_meta_72423906', rank: 1 }, { userId: 'u_x', rank: 2 }] } },
    });
    await runLegacyIdentityMigration({ storage: mem.storage });

    const owners = mem.read(IDENTITY_STORE_KEYS.owners);
    expect(owners['72423906'].userId).toBe('u_homiesplant_th');
    expect(owners['72423906'].connectedAt).toBe('2026-05-01T00:00:00.000Z');
    expect(owners['55500011'].userId).toBe('u_someone_else');

    const usernames = mem.read(IDENTITY_STORE_KEYS.usernames);
    expect(usernames['u_emanuel001']).toBeUndefined();
    expect(usernames['55500011']).toBe('SomeoneElse');

    const profiles = mem.read(IDENTITY_STORE_KEYS.profiles);
    expect(profiles['u_homiesplant']).toBeUndefined();
    expect(profiles['u_homiesplant_th']).toMatchObject({ id: 'u_homiesplant_th', bio: 'kept' });
    const creds = mem.read(IDENTITY_STORE_KEYS.credentials);
    expect(creds['u_homiesplant']).toBeUndefined();
    expect(creds['u_homiesplant_th']).toMatchObject({ userId: 'u_homiesplant_th', email: 'h@example.com' });

    const standings = mem.read(IDENTITY_STORE_KEYS.tournaments).t1.standings;
    expect(standings.map((s: { userId: string }) => s.userId)).toEqual(['u_homiesplant_th', 'u_x']);
  });

  it('leaves both users untouched (and reports a conflict) when alias and canonical users both exist', async () => {
    const mem = memoryStorage({
      [IDENTITY_STORE_KEYS.profiles]: {
        u_homiesplant: { id: 'u_homiesplant', username: 'A' },
        u_homiesplant_th: { id: 'u_homiesplant_th', username: 'B' },
      },
    });
    const res = await runLegacyIdentityMigration({ storage: mem.storage });
    expect(res.changes.some(c => c.action === 'conflict' && c.key === 'u_homiesplant')).toBe(true);
    expect(mem.read(IDENTITY_STORE_KEYS.profiles)['u_homiesplant']).toMatchObject({ username: 'A' });
  });
});

describe('Migrated identities through live cloud sync (stubbed MetaApi)', () => {
  const TOKEN = 'live_token_1234567890abcdef';
  const LEGAL_NAME = 'Jane Quincy Legalname';
  const UNOWNED_LOGIN = `9${String(Date.now()).slice(-7)}`;
  const UNOWNED_ID = `unowned-${Date.now()}-metaapi-account-id`;
  const connector = AccountConnectorService.getInstance();
  const leaderboard = LeaderboardService.getInstance();
  const authService = AuthService.getInstance();
  let server: Server;
  let baseUrl = '';
  const warnSpy = vi.spyOn(console, 'warn');

  const provisioned = [
    { _id: 'legacy-zem-id', login: '342186831', server: 'XMGlobal-MT5 10', name: LEGAL_NAME, platform: 'mt5', state: 'DEPLOYED', connectionStatus: 'CONNECTED' },
    { _id: 'legacy-hp-usd-id', login: '411407722', server: 'XMGlobal-MT5 16', name: 'TraderRank-411407722', platform: 'mt5', state: 'DEPLOYED', connectionStatus: 'CONNECTED' },
    { _id: 'legacy-hp-jpy-id', login: '72423906', server: 'XMTrading-MT5 3', name: 'TraderRank-72423906', platform: 'mt5', state: 'DEPLOYED', connectionStatus: 'CONNECTED' },
    { _id: UNOWNED_ID, login: UNOWNED_LOGIN, server: 'Exness-Real15', name: 'Unowned Person', platform: 'mt5', state: 'DEPLOYED', connectionStatus: 'CONNECTED' },
  ];
  const infoFor = (id: string) => ({
    platform: 'mt5', broker: 'XM', server: 'x', leverage: 500, name: LEGAL_NAME,
    currency: id === 'legacy-hp-jpy-id' ? 'JPY' : 'USD',
    balance: id === 'legacy-hp-jpy-id' ? 1234567 : 2345.67,
    equity: id === 'legacy-hp-jpy-id' ? 1234567 : 2345.67,
    margin: 0, freeMargin: 2345.67,
  });
  const now = Date.now();
  const closedTrade = [
    { id: 'd1', type: 'DEAL_TYPE_BUY', entryType: 'DEAL_ENTRY_IN', symbol: 'EURUSD', volume: 0.1, price: 1.1, time: new Date(now - 7200_000).toISOString(), positionId: 'p1', profit: 0 },
    { id: 'd2', type: 'DEAL_TYPE_SELL', entryType: 'DEAL_ENTRY_OUT', symbol: 'EURUSD', volume: 0.1, price: 1.101, time: new Date(now - 3600_000).toISOString(), positionId: 'p1', profit: 10 },
  ];

  beforeAll(async () => {
    // Apply the migration to the (test) storage with a run-unique marker, then reload the stores.
    await runLegacyIdentityMigration({ markerKey: `migrations/test-legacy-${now}-${Math.random()}.json` });
    await connector.reloadIdentityStores();

    vi.stubEnv('VITEST', '');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('META_API_TOKEN', TOKEN);
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
      if (url.endsWith('/users/current/accounts')) return json(provisioned);
      const info = url.match(/accounts\/([^/]+)\/account-information/);
      if (info) return json(infoFor(info[1]));
      if (url.includes('/legacy-zem-id/history-deals/')) return json(closedTrade);
      if (url.includes('/history-deals/')) return json([]);
      if (url.includes('/positions')) return json([]);
      return json({ message: 'not found' }, 404);
    }));
    (connector as unknown as { metaApiClient: MetaApiClient }).metaApiClient = new MetaApiClient(TOKEN);
    await connector.syncCloudProvisionedAccounts(true);

    // Back to test mode for the HTTP checks.
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    (connector as unknown as { metaApiClient: MetaApiClient }).metaApiClient = new MetaApiClient('');
    invalidateCanonicalStatsCache();

    server = createServer().server;
    await new Promise<void>(resolve =>
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      })
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    warnSpy.mockRestore();
    if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it('shows migrated users on the leaderboard with their profile usernames and avatars', () => {
    const lb = leaderboard.getLeaderboard(500);
    const zem = lb.find(e => e.userId === 'u_zzzemzzz');
    const hp = lb.find(e => e.userId === 'u_homiesplant_th');
    expect(zem).toMatchObject({ username: 'zzZEMZzz', profileName: 'zzZEMZzz', avatarUrl: EMERALD_BEAR_AVATAR_URL });
    expect(hp).toMatchObject({ username: 'HomiesPlant', profileName: 'HomiesPlant', avatarUrl: EMERALD_BEAR_AVATAR_URL });
  });

  it('lists all of an owner\'s accounts, including 72423906 with its broker currency', () => {
    const hpAccounts = connector.getAccounts('u_homiesplant_th');
    const byLogin = Object.fromEntries(hpAccounts.map(a => [a.accountNumber, a]));
    expect(Object.keys(byLogin).sort()).toEqual(['411407722', '72423906']);
    expect(byLogin['72423906']).toMatchObject({ profileUsername: 'HomiesPlant', currency: 'JPY', broker: 'XMTrading', balance: 1234567 });
    expect(byLogin['411407722']).toMatchObject({ currency: 'USD', broker: 'XM' });

    const zem = connector.getAccounts('u_zzzemzzz');
    expect(zem.map(a => a.accountNumber)).toEqual(['342186831']);
    expect(zem[0]).toMatchObject({ profileUsername: 'zzZEMZzz', avatarUrl: EMERALD_BEAR_AVATAR_URL, currency: 'USD' });
  });

  it('hides an unowned MetaApi account and logs only a masked id', () => {
    expect(connector.getAccounts().some(a => a.accountNumber === UNOWNED_LOGIN)).toBe(false);
    expect(leaderboard.getLeaderboard(500).some(e => e.accountNumber === UNOWNED_LOGIN)).toBe(false);
    const warnings = warnSpy.mock.calls.map(c => c.map(String).join(' ')).filter(m => m.includes('[CloudSync]'));
    expect(warnings.some(m => m.includes('no owner record'))).toBe(true);
    expect(warnings.some(m => m.includes(UNOWNED_ID) || m.includes(UNOWNED_LOGIN))).toBe(false);
  });

  it('never exposes the broker legal name publicly; only the owner sees it', async () => {
    const publicRoutes = ['/api/leaderboard', '/api/leaderboard/daily', '/api/traders/canonical', '/api/bulletin', '/api/accounts'];
    for (const route of publicRoutes) {
      const res = await fetch(`${baseUrl}${route}`);
      const body = await res.text();
      expect(res.status, route).toBe(200);
      expect(body, route).not.toContain(LEGAL_NAME);
    }
    const bulletin = await (await fetch(`${baseUrl}/api/bulletin`)).text();
    expect(bulletin).toContain('zzZEMZzz');

    const token = authService.createSessionToken('u_zzzemzzz', 'zzZEMZzz');
    const own = await fetch(`${baseUrl}/api/accounts?userId=u_zzzemzzz`, { headers: { Authorization: `Bearer ${token}` } });
    const ownAccounts = await own.json();
    expect(ownAccounts.find((a: { accountNumber: string }) => a.accountNumber === '342186831')?.accountHolderName).toBe(LEGAL_NAME);
  });
});

describe('legacy identity migration — storage failure safety', () => {
  it('aborts without writing anything when a store cannot be read', async () => {
    const uploads: string[] = [];
    const storage = {
      getJson: async () => null,
      getJsonStrict: async (key: string) => {
        if (key === 'profiles/account_owners.json') throw new Error('Storage read failed: ECONNRESET');
        return null;
      },
      uploadJson: async (key: string) => { uploads.push(key); return {}; },
    };
    await expect(
      runLegacyIdentityMigration({ storage, markerKey: `migrations/test-failure-${Date.now()}.json` })
    ).rejects.toThrow(/ECONNRESET/);
    expect(uploads).toEqual([]); // no store overwritten, no marker written (retries next startup)
  });
});
