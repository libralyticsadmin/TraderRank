/**
 * One-off migration: legacy hard-coded identities -> persisted data.
 *
 * Before 2026-11, three broker accounts had their owner, public username and avatar
 * hard-coded in generic code paths. This module writes that identity into the normal
 * stores (account owners, account usernames/avatars, user profiles) once, so the
 * runtime code can treat these accounts like any other.
 *
 * It also rewrites legacy userId aliases found in stored data to the canonical userIds.
 *
 * Idempotent and guarded by a marker key: once the marker exists the migration never
 * runs again, so later edits by the users are never overwritten.
 *
 * This file (and scripts/migrate-legacy-identities.ts) is the ONLY place allowed to
 * contain these logins/userIds/usernames; see the identity guard in server/test/codeGuards.test.ts.
 */
import { r2Storage } from './r2StorageService.js';
import { EMERALD_BEAR_AVATAR_URL } from '../core/avatarPresets.js';

export const LEGACY_IDENTITY_MARKER_KEY = 'migrations/legacy-identities-v1.json';

export const IDENTITY_STORE_KEYS = {
  owners: 'profiles/account_owners.json',
  usernames: 'profiles/account_usernames.json',
  avatars: 'profiles/account_avatars.json',
  profiles: 'profiles/user_profiles.json',
  credentials: 'auth/credentials.json',
  tournaments: 'tournaments/state.json',
} as const;

export interface IdentityStorage {
  getJson<T>(key: string): Promise<T | null>;
  uploadJson(key: string, data: unknown, metadata?: Record<string, string>): Promise<unknown>;
}

export interface LegacyIdentity {
  login: string;
  userId: string;
  username: string;
  broker: 'XM' | 'XMTrading';
  serverName: string;
  platform: 'MT5';
  currency: 'USD' | 'JPY';
  avatarUrl: string;
}

export const LEGACY_IDENTITIES: readonly LegacyIdentity[] = [
  { login: '342186831', userId: 'u_zzzemzzz', username: 'zzZEMZzz', broker: 'XM', serverName: 'XMGlobal-MT5 10', platform: 'MT5', currency: 'USD', avatarUrl: EMERALD_BEAR_AVATAR_URL },
  { login: '411407722', userId: 'u_homiesplant_th', username: 'HomiesPlant', broker: 'XM', serverName: 'XMGlobal-MT5 16', platform: 'MT5', currency: 'USD', avatarUrl: EMERALD_BEAR_AVATAR_URL },
  { login: '72423906', userId: 'u_homiesplant_th', username: 'HomiesPlant', broker: 'XMTrading', serverName: 'XMTrading-MT5 3', platform: 'MT5', currency: 'JPY', avatarUrl: EMERALD_BEAR_AVATAR_URL },
];

/** Legacy userId aliases (lower-case) -> canonical userId. */
export const LEGACY_USER_ALIASES: Readonly<Record<string, string>> = {
  zzzemzzz: 'u_zzzemzzz',
  emanuel001: 'u_zzzemzzz',
  u_emanuel001: 'u_zzzemzzz',
  emanuel007: 'u_homiesplant_th',
  u_emanuel007: 'u_homiesplant_th',
  u_homiesplant: 'u_homiesplant_th',
  homiesplant: 'u_homiesplant_th',
  'homiesplant.th': 'u_homiesplant_th',
  homiesplant_th: 'u_homiesplant_th',
  u_homeisplant: 'u_homiesplant_th',
  homeisplant: 'u_homiesplant_th',
  usr_meta_72423906: 'u_homiesplant_th',
};

export interface MigrationChange {
  store: keyof typeof IDENTITY_STORE_KEYS;
  key: string;
  action: 'set' | 'remap' | 'delete' | 'conflict';
  detail: string;
}

export interface LegacyMigrationResult {
  status: 'applied' | 'already-applied' | 'dry-run';
  changes: MigrationChange[];
  writtenKeys: string[];
}

type Json = Record<string, any>;

const canonicalOf = (id: unknown): string | null => {
  if (typeof id !== 'string') return null;
  return LEGACY_USER_ALIASES[id.trim().toLowerCase()] ?? null;
};

const asObject = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? { ...(v as Json) } : {});

export async function runLegacyIdentityMigration(
  opts: { storage?: IdentityStorage; dryRun?: boolean; markerKey?: string; now?: () => Date } = {}
): Promise<LegacyMigrationResult> {
  const storage = opts.storage ?? r2Storage;
  const markerKey = opts.markerKey ?? LEGACY_IDENTITY_MARKER_KEY;
  const nowIso = (opts.now ?? (() => new Date()))().toISOString();

  const marker = await storage.getJson<Json>(markerKey);
  if (marker && typeof marker === 'object') {
    return { status: 'already-applied', changes: [], writtenKeys: [] };
  }

  const loaded = {
    owners: await storage.getJson<Json>(IDENTITY_STORE_KEYS.owners),
    usernames: await storage.getJson<Json>(IDENTITY_STORE_KEYS.usernames),
    avatars: await storage.getJson<Json>(IDENTITY_STORE_KEYS.avatars),
    profiles: await storage.getJson<Json>(IDENTITY_STORE_KEYS.profiles),
    credentials: await storage.getJson<Json>(IDENTITY_STORE_KEYS.credentials),
    tournaments: await storage.getJson<Json>(IDENTITY_STORE_KEYS.tournaments),
  };
  const owners = asObject(loaded.owners);
  const usernames = asObject(loaded.usernames);
  const avatars = asObject(loaded.avatars);
  const profiles = asObject(loaded.profiles);
  const credentials = asObject(loaded.credentials);
  const tournaments = asObject(loaded.tournaments);
  const changes: MigrationChange[] = [];

  // 1. Rewrite legacy userId aliases in stored data.
  for (const [key, rec] of Object.entries(owners)) {
    const canonical = canonicalOf(rec?.userId);
    if (canonical) {
      owners[key] = { ...rec, userId: canonical };
      changes.push({ store: 'owners', key, action: 'remap', detail: `${rec.userId} -> ${canonical}` });
    }
  }
  for (const [storeName, store] of [['usernames', usernames], ['avatars', avatars]] as const) {
    for (const key of Object.keys(store)) {
      const canonical = canonicalOf(key);
      if (!canonical) continue;
      if (!(canonical in store)) {
        store[canonical] = store[key];
        changes.push({ store: storeName, key: canonical, action: 'remap', detail: `moved from ${key}` });
      }
      delete store[key];
      changes.push({ store: storeName, key, action: 'delete', detail: `legacy alias of ${canonical}` });
    }
  }
  // Profiles and login credentials move together, and only when the canonical user does not exist yet.
  const aliasIds = new Set<string>();
  for (const k of Object.keys(profiles)) if (canonicalOf(k)) aliasIds.add(k);
  for (const [k, c] of Object.entries(credentials)) if (canonicalOf(c?.userId ?? k)) aliasIds.add(String(c?.userId ?? k));
  for (const aliasId of aliasIds) {
    const canonical = canonicalOf(aliasId)!;
    const credKey = Object.keys(credentials).find(k => credentials[k]?.userId === aliasId || k === aliasId);
    const canonicalExists =
      canonical in profiles || Object.values(credentials).some(c => c?.userId === canonical);
    if (canonicalExists) {
      changes.push({
        store: 'profiles',
        key: aliasId,
        action: 'conflict',
        detail: `both ${aliasId} and ${canonical} exist; left unchanged (needs a manual merge decision)`,
      });
      continue;
    }
    if (aliasId in profiles) {
      profiles[canonical] = { ...profiles[aliasId], id: canonical };
      delete profiles[aliasId];
      changes.push({ store: 'profiles', key: canonical, action: 'remap', detail: `moved from ${aliasId}` });
    }
    if (credKey) {
      const cred = credentials[credKey];
      delete credentials[credKey];
      credentials[canonical] = { ...cred, userId: canonical, updatedAt: nowIso };
      changes.push({ store: 'credentials', key: canonical, action: 'remap', detail: `moved from ${aliasId}` });
    }
  }
  for (const [tournId, state] of Object.entries(tournaments)) {
    if (!state || !Array.isArray(state.standings)) continue;
    let touched = false;
    const seen = new Set<string>();
    const standings = state.standings
      .map((s: Json) => {
        const canonical = canonicalOf(s?.userId);
        if (!canonical) return s;
        touched = true;
        return { ...s, userId: canonical };
      })
      .filter((s: Json) => {
        if (!s?.userId || seen.has(s.userId)) return false;
        seen.add(s.userId);
        return true;
      });
    if (touched) {
      tournaments[tournId] = { ...state, standings };
      changes.push({ store: 'tournaments', key: tournId, action: 'remap', detail: 'legacy userIds in standings' });
    }
  }

  // 2. Owner, username, avatar and profile identity for each legacy account.
  for (const id of LEGACY_IDENTITIES) {
    const prev = asObject(owners[id.login]);
    if (prev.userId && prev.userId !== id.userId) {
      changes.push({ store: 'owners', key: id.login, action: 'conflict', detail: `owner was ${prev.userId}; reassigned to ${id.userId}` });
    }
    owners[id.login] = {
      ...prev,
      userId: id.userId,
      username: id.username,
      broker: id.broker,
      accountNumber: id.login,
      platform: id.platform,
      serverName: id.serverName,
      accountId: prev.accountId || `acc_meta_${id.login}`,
      connectedAt: prev.connectedAt || nowIso,
      status: prev.status || 'CONNECTED',
    };
    changes.push({ store: 'owners', key: id.login, action: 'set', detail: `owner ${id.userId}` });

    for (const key of [id.login, id.userId]) {
      usernames[key] = id.username;
      avatars[key] = id.avatarUrl;
    }
    changes.push({ store: 'usernames', key: `${id.login},${id.userId}`, action: 'set', detail: id.username });
    changes.push({ store: 'avatars', key: `${id.login},${id.userId}`, action: 'set', detail: 'preset avatar' });

    const profile = asObject(profiles[id.userId]);
    profiles[id.userId] = {
      ...profile,
      id: id.userId,
      username: id.username,
      avatarUrl: id.avatarUrl,
      avatarSymbol: 'bear_emerald',
      primaryBroker: profile.primaryBroker || id.broker,
      accountNumber: profile.accountNumber || id.login,
      currency: profile.currency || id.currency,
      registeredAt: profile.registeredAt || nowIso,
    };
    changes.push({ store: 'profiles', key: id.userId, action: 'set', detail: `username ${id.username}` });
  }

  // 3. Write only the stores that changed, then the marker.
  const next = { owners, usernames, avatars, profiles, credentials, tournaments };
  const toWrite = (Object.keys(next) as (keyof typeof next)[]).filter(
    name => JSON.stringify(next[name]) !== JSON.stringify(loaded[name] ?? {})
  );
  const writtenKeys = toWrite.map(name => IDENTITY_STORE_KEYS[name]);

  if (opts.dryRun) {
    return { status: 'dry-run', changes, writtenKeys };
  }
  for (const name of toWrite) {
    await storage.uploadJson(IDENTITY_STORE_KEYS[name], next[name], { 'x-traderrank-type': `migration_${name}` });
  }
  await storage.uploadJson(
    markerKey,
    { migration: 'legacy-identities-v1', appliedAt: nowIso, writtenKeys, changeCount: changes.length },
    { 'x-traderrank-type': 'migration_marker' }
  );
  return { status: 'applied', changes, writtenKeys };
}

let startupMigration: Promise<LegacyMigrationResult | null> | null = null;

/**
 * Runs the migration once per process at startup (memoized). Every loader of the
 * affected stores awaits this first so in-memory state never overwrites migrated data.
 * Skipped under tests (they call runLegacyIdentityMigration explicitly).
 */
export function ensureLegacyIdentityMigration(): Promise<LegacyMigrationResult | null> {
  if (!startupMigration) {
    const isTest = Boolean(process.env.VITEST || process.env.NODE_ENV === 'test');
    startupMigration = isTest
      ? Promise.resolve(null)
      : runLegacyIdentityMigration()
          .then(res => {
            if (res.status === 'applied') {
              console.log(`[Migration] legacy identities applied (${res.writtenKeys.join(', ') || 'no store changes'})`);
            }
            for (const c of res.changes.filter(ch => ch.action === 'conflict')) {
              console.warn(`[Migration] ${c.store}/${c.key}: ${c.detail}`);
            }
            return res;
          })
          .catch(err => {
            console.warn('[Migration] legacy identity migration failed:', err instanceof Error ? err.message : String(err));
            return null;
          });
  }
  return startupMigration;
}
