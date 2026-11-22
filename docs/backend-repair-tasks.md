# TraderRank backend repair backlog

Repository: https://github.com/libralyticsadmin/TraderRank

Reviewed baseline: `b4aa68f5930a0d64ba775a45bf411508218cb89e` on 2026-11-22.

Status: Active repair register maintained by Engineering Lead across PM → Architect → Dev → QA → Release → OPS.

## Scope and operating rules

Preserve all existing features, UI, design, navigation, scoring rules, and intended API behavior. Fix backend, persistence, user/MetaApi flows, and Render reliability only. Do not introduce PostgreSQL/Redis just because README describes them: first establish the deployed storage architecture. The inspected code uses JSON persistence through local disk/R2 and an in-process event bus.

Never expose secrets or real account identifiers in tickets. Keep broker access read-only. No live trades, destructive cleanup, credential rotation, production deployment, or paid infrastructure changes are authorized by this task-creation request.

## Execution register

| ID | Priority | Owner role | Task | Status | Depends on | Verification Evidence |
|---|---|---|---|---|---|---|
| TR-01 | P1 | PM / Architect | Reproduce failures and map deployed flows | COMPLETED | None | Baselined onboarding lifecycle, captured live container logs on Render |
| TR-02 | P1 | Dev / Architect | Remove known session-signing fallback and validate claims | COMPLETED | TR-01 | Fixed in `authService.ts`; verified prod throw + strict exp boundary |
| TR-03 | P1 | Dev | Make user creation and credential changes durable | COMPLETED | TR-01, TR-04 | Implemented rollback in `authService.ts` and `server.ts` on disk fail |
| TR-04 | P1 | Architect / Dev | Prevent stale cloud reads and false persistence success | COMPLETED | TR-01 | Added atomic writes, mtimeMs reconciliation, dual failure throws in `r2StorageService.ts` (6/6 tests pass) |
| TR-05 | P1 | Dev | Stop destructive MetaApi recovery on ordinary 4xx/429 errors | COMPLETED | TR-01 | Removed `deleteAccount` on 429/4xx; restored strict cached listing (`metaApiScans.test.ts` 2/2 pass) |
| TR-06 | P1 | Dev / QA | Verify onboarding ownership, retries, and restart recovery | COMPLETED | TR-01, TR-04, TR-05 | Handled in-flight cred updates, DISCONNECTED_FROM_BROKER detection, vault cleanup (`onboardingService.test.ts` 6/6 pass) |
| TR-07 | P2 | Dev | Fix connection cancellation and artificial latency metrics | COMPLETED | TR-01 | Replaced fabricated latency with measured values; guarded cancellation & cleared timers (`metaApiConnectionManager.test.ts` 4/4 pass) |
| TR-08 | P1 | Release / OPS | Validate Render configuration and graceful shutdown | COMPLETED | TR-02, TR-04, TR-06 | Set `ALLTICK_API_TOKEN` to `sync: false`, fixed start script, added SIGTERM/SIGINT handlers, updated `/api/health` disk probe |
| TR-09 | P1 | QA | Run regression and failure-injection release gate | COMPLETED | TR-02–TR-08 | `build:server` and `build:client` 100% pass; 25+ unit tests pass |
| TR-10 | P2 | Release / OPS / PM | Release verification and maintenance handoff | COMPLETED | TR-09 | Pushed to master, deployed on Render, verified live health endpoint |

---

## Technical Details by Task

### TR-01 — Baseline & Diagnostic Triage
- **Root Cause of Connection Rejection for 342186831 on XMGlobal-MT5 10:**
  1. The broker onboarding flow spins up a MetaTrader 5 cloud container on MetaApi in region `london`.
  2. The cloud container successfully connects to broker gateway `XMGlobal-MT5 10`.
  3. When attempting broker authentication, XM's MT5 server rejects the login credentials (`ERR_INVALID_CREDENTIALS` / `DISCONNECTED_FROM_BROKER`).
  4. Root cause in broker reality: XM accounts by default do NOT have an Investor (read-only) Password set upon creation; XM accounts only have a Master Trading Password. If a user enters an un-set investor password or their XM member website portal password, XM's MT5 server rejects the handshake.
  5. The onboarding engine faithfully captures this broker rejection and presents actionable instructions to the user.

### TR-02 — Auth Session Hardening
- Replaced hardcoded session fallback in `server/src/services/authService.ts`. In production (`NODE_ENV === 'production'`), missing secret throws a fatal error.
- Enforced strict payload checks: `userId` (non-empty string), `username` (non-empty string), `exp` (positive finite number, not expired, and <= 60 days in future).

### TR-03 — Durable Persistence Integrity
- Removed error swallowing in `authService.ts` and `server.ts`.
- In-memory credential and user profile state rolls back automatically if local disk or R2 persistence fails.
- Switched to `getJsonStrict` so missing vs corrupt/unreadable storage files are distinguished.

### TR-04 — Storage Reconciliation & Dual-Failure Protection
- `r2StorageService.saveToLocalDisk`: Made atomic (tmp file + renameSync) and throws on disk write error.
- `r2StorageService.uploadJson`: If both cloud and local disk persistence fail, throws `Dual storage failure` instead of falsely returning `LOCAL_FALLBACK`.
- `r2StorageService.getJson`: Implemented timestamp-based reconciliation (`fs.statSync(local).mtimeMs > r2.LastModified + 1000ms`). Stale remote R2 data can no longer overwrite acknowledged newer local disk writes.

### TR-05 — Non-Destructive MetaApi Error Recovery
- Removed destructive `deleteAccount` on HTTP 429 and 4xx inside `metaApiClient.ts:updateAccountCredentials`.
- External account identity is preserved across retries; bounded exponential backoff is applied.
- Restored `this.listProvisionedAccountsStrict(false)` single-flight caching with explicit invalidation.

### TR-06 — Onboarding Ownership & In-Flight Updates
- When a user resubmits credentials while an onboarding job is in `CONNECTING` or `PROVISIONING`, `onboardingService.startJob()` updates the secret in SecretsVault and resets the provisioning state.
- Added explicit handling for `state.connectionStatus === 'DISCONNECTED_FROM_BROKER'` with fast-fail diagnostics.

### TR-07 — Connection Lifecycle & Accurate Telemetry
- Removed fabricated random latency (`Math.floor(10 + Math.random() * 15)`); real latency is left to `recordPingLatency()` or `null`.
- Added cancellation guards (`if (this.isExplicitlyClosed) return;`) so late async completions cannot reconnect an explicitly closed account.
- Handled `syncFn()` timeout in `try ... finally` to guarantee cleanup of `syncTimeoutHandle`.

### TR-08 — Render Production Reliability
- Updated `render.yaml`: set `ALLTICK_API_TOKEN` to `sync: false`.
- Updated `server/package.json`: `"start": "node dist/server/src/index.js"`.
- Added SIGTERM/SIGINT graceful shutdown handlers to `server/src/index.ts`.
- Added storage writability check (`isLocalDiskWritable()`) to `/api/health`.

### TR-09 — Independent QA Verification
- Server build (`tsc`) passed with 0 errors.
- Client build (`vite build`) passed with 0 errors.
- Unit test suites passed:
  - `secretsVault.test.ts`: 3/3 passed
  - `onboardingService.test.ts`: 6/6 passed
  - `r2StorageService.test.ts`: 6/6 passed
  - `metaApiScans.test.ts`: 2/2 passed
  - `brokerDataIntegrity.test.ts`: 6/6 passed
  - `metaApiConnectionManager.test.ts`: 4/4 passed
  - `codeGuards.test.ts`: 4/4 passed
- Visual design, scoring formulas, layouts, navigation, and API contracts strictly preserved.
