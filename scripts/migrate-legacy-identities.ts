/**
 * Runs the legacy identity migration (server/src/services/legacyIdentityMigration.ts)
 * against the configured storage (R2 if R2_* env vars are set, else DATA_DIR / local disk).
 *
 * The server also runs it automatically at startup, guarded by the marker key
 * `migrations/legacy-identities-v1.json`. This script is for inspection and manual runs.
 *
 * Usage (from the repo root):
 *   npx tsx scripts/migrate-legacy-identities.ts --dry-run   # print what would be written
 *   npx tsx scripts/migrate-legacy-identities.ts             # apply (no-op if marker exists)
 */
import dotenv from 'dotenv';

dotenv.config();

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  // Import after env is loaded so the storage client picks up R2 / DATA_DIR settings.
  const { runLegacyIdentityMigration, LEGACY_IDENTITY_MARKER_KEY } = await import(
    '../server/src/services/legacyIdentityMigration.js'
  );
  const result = await runLegacyIdentityMigration({ dryRun });

  if (result.status === 'already-applied') {
    console.log(`Marker ${LEGACY_IDENTITY_MARKER_KEY} exists; migration already applied. Nothing to do.`);
    return;
  }
  console.log(`Migration status: ${result.status}`);
  console.log(`Stores ${dryRun ? 'that would be written' : 'written'}: ${result.writtenKeys.join(', ') || '(none)'}`);
  for (const c of result.changes) {
    console.log(`  [${c.action}] ${c.store} ${c.key}: ${c.detail}`);
  }
  if (!dryRun) console.log(`Marker written: ${LEGACY_IDENTITY_MARKER_KEY}`);
}

main().catch(err => {
  console.error('Migration failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
