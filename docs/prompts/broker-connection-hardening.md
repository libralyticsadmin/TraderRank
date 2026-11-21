# Broker Connection Hardening — Task Prompts

Incident: 2026-11-21. The broker preflight spinner hung forever for XM account 342186831. When it did finish, it showed invented balances.
Goal: make broker onboarding correct, bounded and observable before user growth.

Each task below is a self-contained prompt. Paste one into a fresh Claude Code session at the repo root. Run them in the order given in **Execution order**.

---

## Product decisions (2026-11-21, apply to every task)

| Topic | Decision |
|---|---|
| Expected scale (3–6 months) | **Under 100 connected accounts.** Correctness, onboarding and alerting come first. Scaling work (Tasks 9, 10) is deferred until about 80 accounts. |
| Slow broker connection | **Background job.** The wizard shows live progress, the user can close it, the account appears as "Connecting", and the user sees the outcome in the app. |
| Account disconnects later | **Pause, then remove.** After 15 min disconnected, freeze the rank and mark it "stale" (no new scoring). After 7 days, remove it from active rankings and undeploy the MetaApi account. It can be reconnected at any time. |
| Rule enforcement | **CLAUDE.md + blocking CI.** Guard tests fail the build, and `master` is protected so CI must pass before merge. |
| Market data source | **Dedicated platform MetaApi account first, AllTick/TradingView fallback.** Never a user's account. |
| Operator alerts | **Email.** Use a provider-agnostic alert service; the recipient address and provider key come from env, never from code. |
| Trader notifications | **In-app only.** A banner and status in AccountsList with a "Re-enter investor password" action. No email to traders. |
| Legacy hard-coded accounts | **Migrate as normal users.** zzZEMZzz (342186831), HomiesPlant (411407722) and 72423906 get data records through a one-time script, and all special-case code is removed. |

## Execution order

1. Task 1: CLAUDE.md guardrails
2. Task 2: blocking CI guards and branch protection
3. Task 3: background onboarding
4. Task 7: health monitoring (pause/stale/remove), in-app banner
5. Task 8: observability and **email alerts**
6. Task 5: dedicated market-data account with fallback
7. Task 6: migrate legacy accounts, remove hard-coding
8. Task 4: remove O(N) scans (light version is fine at under 100 accounts)
9. Deferred until about 80 accounts: Task 9 (capacity/quota), Task 10 (state scaling)

---

## Incident summary (shared context for every task)

**What happened**
- The MetaApi cloud account for 342186831 (`XMGlobal-MT5 10`, id `c3fb9213-…`) is `DEPLOYED` but `DISCONNECTED`, with `connections: []`. MetaApi's account-information endpoint returns `504 TimeoutError: not connected to broker`. MetaApi cannot log in to the broker. Typical causes are a wrong or changed investor password, the wrong server number, or an account archived or expired by the broker.
- For a disconnected account, `POST /api/connector/validate` ran these steps one after another inside a single HTTP request: list **all** MetaApi accounts (no timeout) → PUT credentials (35s) → redeploy (10s) → poll (~30s) → account-information (6s). That is 75s+ in the best case, and unbounded when a call stalled. The browser fetch had no timeout either.
- When the cloud check failed, the code returned `success: true` with placeholder balances (10,000 USD / 1,500,000 JPY). `BrokerDirectory` could also turn any failure into a pass. Users would have seen fake account data.

**Root causes (systemic)**
1. **Simulation code in production paths.** Offline demo fallbacks were added in the first MetaApi commit (`f646668`) and widened by later "resilience" fixes (`9e6e4dc`). There was no rule separating demo data from live data.
2. **Slow, asynchronous provisioning treated as a quick synchronous check.** MetaApi deploy/connect takes 30s to several minutes. The preflight blocked the HTTP request waiting for it. Three fixes in two days (`2b3370a`, `c5f158e`, `9e6e4dc`) each added more waiting rather than changing the model.
3. **No time budgets.** Several outbound `fetch` calls had no `signal`, and the request as a whole had no deadline.
4. **Costs grow with the number of users.** `listProvisionedAccounts()` fetches every MetaApi account on every preflight, on every 4-second market-feed tick (`liveMarketFeed.ts`), and in several account endpoints. `syncCloudProvisionedAccounts()` calls account-information for every account one after another. This becomes slower and rate-limited as users grow.
5. **Platform features depend on one user's broker link.** Market quotes and candlesticks borrow "the first CONNECTED user account", with a hard-coded fallback to `c3fb9213-…` (the disconnected account).
6. **Per-account special cases.** Code is hard-coded for specific accounts (`isZemAccount`, `isHomiesAccount`, skip `72423906`) inside generic sync logic.
7. **Live paths untested.** Tests run in simulation mode (`isTestRuntime()` bypasses the cloud path), so none of the above was caught. 69 of 157 commits are `fix:`.

**Already fixed (uncommitted working tree, 2026-11-21)**
- `server/src/core/dataPolicy.ts`: `isSimulatedDataAllowed()` returns true only in tests, or in local dev with no MetaApi token.
- `metaApiClient.validateAccount`: live mode succeeds only with real `CONNECTED` broker info. It has a 20s budget (`METAAPI_VALIDATION_BUDGET_MS`) and typed failures (`rejected` / `not_connected` / `timeout` / `error`).
- Timeouts added on the list, create and deploy calls. The client aborts after 45s.
- In live mode: no simulated positions or deals, no placeholder balances, a real `connectionStatus` in cloud sync, and the Exness native path disabled.
- `server/test/brokerDataIntegrity.test.ts` covers live mode with stubbed `fetch`.

---

## Task 1: Project guardrails file (CLAUDE.md)

```
Create CLAUDE.md at the repo root. Most of this codebase is written by AI agents, so
encode the rules that would have prevented the 2026-11-21 broker incident (see
docs/prompts/broker-connection-hardening.md, "Incident summary").

Include, concisely:
- Data integrity: account balances, equity, positions, trades and currencies shown to
  users must come from the broker. Simulated data is allowed only when
  isSimulatedDataAllowed() (server/src/core/dataPolicy.ts) returns true. Never add a
  "fallback" that returns success with default numbers; return a typed failure instead.
- Outbound calls: every fetch to a third party must pass `signal: AbortSignal.timeout(ms)`.
  Every request handler that calls third parties must have an overall deadline.
- Never block an HTTP request waiting for a MetaApi deploy/connect. Use the async
  onboarding flow (see Task 3 once it exists).
- No per-account / per-user hard-coding (logins, userIds, names) in generic code paths.
- Tests: any change to a live broker path needs a test that runs in live mode
  (pattern: server/test/brokerDataIntegrity.test.ts — vi.stubEnv + stubbed fetch).
- Commands: npm --prefix server test, npx tsc --noEmit -p server, npx tsc --noEmit -p client.
Keep it under 80 lines. Do not restate what the README says about architecture.
```

## Task 2: Static guards in CI

```
Add a vitest file server/test/codeGuards.test.ts that scans server/src source text and fails on:
1. Any `fetch(` call to an external URL whose options object has no `signal`.
   (Parse simply: for each `fetch(` occurrence, check the next ~25 lines up to the
   matching `});` for `signal`.) Allow-list nothing silently; if an exception is needed,
   require an inline `// guard:allow-no-timeout <reason>` comment.
2. Placeholder money literals used as defaults in live code: patterns like
   `?? 10000`, `|| 10000`, `?? 10420`, `1500000`, `3817` in server/src outside files that
   only run in simulation (workers/marketSimulator.ts, and branches after an
   `isSimulatedDataAllowed()` check — simplest: allow-list by file + require the
   literal to be within 40 lines after `isSimulatedDataAllowed`).
3. Hard-coded MetaApi account ids (UUID v4 pattern) or the logins 342186831,
   411407722, 72423906 in server/src.
Fix whatever the guards find (check 3 will find several; Task 6 handles the
identity mapping, so for now move those values to config loaded from env/R2 and
reference them from there). Run the full suite and both type checks.

Make it blocking: CI (.github/workflows) already runs `npm --prefix server test`, so the
guards fail the build automatically. Also add `npx tsc --noEmit -p shared` if shared has
a tsconfig. Then prepare (but DO NOT run without the owner's confirmation) the gh command
that protects `master`: required status check = the CI job "build-and-test", require
branches up to date, no force pushes. Print the command and ask before executing.
```

## Task 3: Asynchronous onboarding state machine

```
Context: MetaApi provisioning is slow and asynchronous (deploy/connect takes 30s to minutes).
Today POST /api/connector/validate and /api/connector/connect block on it
(server/src/workers/metaApiClient.ts validateAccountLive, budget 20s). A slow
broker shows "retry later". At scale this ties up requests and frustrates users.

Redesign onboarding as a persisted job:
- POST /api/connector/connect (authenticated) creates an onboarding record
  {id, userId, broker, login, server, platform, status, error, metaApiAccountId,
  createdAt, updatedAt}. It stores credentials in the vault, kicks off
  createOrGetAccount + deploy, and returns 202 {onboardingId} immediately.
- Statuses: PROVISIONING -> CONNECTING -> CONNECTED | FAILED(reason code). Reason codes:
  INVALID_CREDENTIALS, SERVER_NOT_FOUND, BROKER_UNREACHABLE, TIMEOUT (10 min), QUOTA_EXCEEDED,
  INTEGRATION_ERROR.
- A background worker advances jobs. Use one shared loop with a concurrency limit
  (for example 5), not a timer per job. It polls MetaApi state with backoff
  (2s, 4s, 8s ... max 30s) and, on CONNECTED, reads account-information and creates
  the TradingAccount with real figures only.
- GET /api/connector/onboarding/:id returns status (owner only). Persist records
  via r2Storage so restarts resume jobs.
- If a job FAILED and MetaApi never connected, undeploy the MetaApi account so it
  doesn't consume a paid slot.
- Client ConnectionWizard step 4: poll the status endpoint every 3s, show the real
  stage, offer "Edit credentials" on FAILED with the reason, and let the user close
  the modal while it continues. The account then appears as "Connecting" in
  AccountsList. When the job finishes, show the outcome in-app only: a success toast,
  or a failure banner with the reason and "Re-enter investor password". Do not
  email traders.
- On FAILED with reason INTEGRATION_ERROR or QUOTA_EXCEEDED (our fault, not the
  trader's), send an operator email alert through alertService (Task 8). If Task 8 is
  not done yet, call a no-op stub with the same interface.
- Keep validate as a quick, cheap input check only (required fields, server exists in
  brokerDirectory, ownership 409). It must never call MetaApi provisioning.
Tests: live-mode tests with stubbed fetch for each terminal state, restart-resume,
and an ownership test. Keep simulation mode working for local demo.
```

## Task 4: Remove O(N) MetaApi scans (light version OK at under 100 accounts)

```
listProvisionedAccounts() fetches every MetaApi account. It is called from:
metaApiClient.createOrGetAccount, accountConnector.syncCloudProvisionedAccounts,
liveMarketFeed.ts (every 4s tick AND candlesticks), and the /api/accounts/* handlers
in server/src/api/server.ts (when the in-memory store is empty).

1. Keep a persisted index login+server -> metaApiAccountId (update it on create and
   connect). createOrGetAccount looks there first, then falls back to a filtered
   MetaApi query. Check the MetaApi provisioning API for a server-side filter
   (`query`, `limit`, `offset`) and use pagination. Never fetch the whole list in a
   request path.
2. syncCloudProvisionedAccounts: run only at startup and on a background schedule
   (for example every 5 min), with a single in-flight guard. Fetch account-information
   with a concurrency limit (5) and per-call timeouts. Request handlers must read
   the in-memory or persisted store and must not trigger a full sync.
3. Add an in-memory cache with a TTL (30s) around any remaining list call, plus a
   single-flight guard.
Add tests that count fetch calls: a preflight for a known login must make 0 list
calls, and 100 GET /api/accounts requests must make 0 list calls.
```

## Task 5: Decouple market data from user accounts

```
liveMarketFeed.ts gets quotes and candlesticks through "the first CONNECTED
user MetaApi account", falling back to accounts[0] and to a hard-coded id
'c3fb9213-c550-4038-b1cd-9f400705f759' (a currently DISCONNECTED user account).
Platform prices must not depend on any user's broker login.

- Add env META_API_MARKET_DATA_ACCOUNT_ID: a dedicated, platform-owned MetaApi
  account used only for market data. Remove the hard-coded id and the "first
  user account" selection.
- Decision: dedicated account first, AllTick/TradingView fallback. If the account is
  unset or not CONNECTED, switch automatically to the AllTick / TradingView adapters.
  Switch back when it reconnects (check every 60s, not per tick). Expose the active
  source in a new GET /api/market/source endpoint. Never use a user's account.
- When the dedicated account has been disconnected for over 15 min, send one operator
  email alert (Task 8 alertService). Deduplicate: at most one alert per
  incident, plus one "recovered" email.
- Owner setup step (document it in the PR, don't automate it): create a demo MT5
  account at a supported broker, provision it in MetaApi, and set
  META_API_MARKET_DATA_ACCOUNT_ID on Render.
- Stop calling listProvisionedAccounts from the 4s tick (covered by Task 4; verify).
Tests: with no market-data account configured, there are zero MetaApi calls
from the feed.
```

## Task 6: Remove per-account hard-coding

```
accountConnector.syncCloudProvisionedAccounts contains special cases for specific
users: isZemAccount (342186831 / 'zzZEMZzz'), isHomiesAccount (411407722),
`continue` for 72423906, forced userIds 'u_zzzemzzz' / 'u_homiesplant_th', forced
avatar, and /emanuel/i name scrubbing. There are related constants such as
DEFAULT_TRADER_USERNAMES. These don't scale and have caused regressions
(see commits a18c9a1, 8cc637e, d854bef).

Replace them with data:
- Ownership and display identity come only from the persisted accountOwners and
  userProfiles stores, written when a user connects an account.
- Decision: migrate all three as normal users. Write a one-off idempotent migration
  script (scripts/migrate-legacy-identities.ts) that writes owner, username and avatar
  records for 342186831 (zzZEMZzz), 411407722 (HomiesPlant) and 72423906 into those
  stores. 72423906 is no longer skipped: it is shown like any other owned account,
  under whatever owner the script assigns. Ask the owner which userId and username
  72423906 belongs to before writing it. Support --dry-run. Then delete every
  special case from code.
- Accounts present in MetaApi but with no owner record are not shown on the
  leaderboard (log a warning with masked ids).
- Keep the privacy rule (legal name is never shown publicly) as a generic rule,
  not a regex on one person's name.
Tests: the leaderboard and account listing still show the migrated users with their
usernames and avatars, and an unowned MetaApi account is hidden.
```

## Task 7: Broker connection health monitoring and user notification

```
Accounts can drop to DISCONNECTED at any time (password changed, account archived,
broker maintenance). Today nobody notices until a user complains.

- Add a background health check (every 5 min, concurrency-limited) that reads each
  owned account's MetaApi connectionStatus. Update TradingAccount.connectionStatus
  and lastError, and record lastConnectedAt.
- Disconnected for over 15 min: mark DISCONNECTED and freeze its leaderboard rank
  with a visible "stale, last synced <time>" marker. No new scoring, XP, streak or
  tournament points while stale. Show an in-app banner in AccountsList (and the
  user nav) with a "Re-enter investor password" action that reuses the background
  onboarding flow (Task 3). No email to traders.
- Disconnected for over 7 days: remove it from active leaderboards and tournaments,
  undeploy the MetaApi account to free the paid slot, and keep the account record
  and trade history so the user can reconnect. On reconnect it rejoins with
  verified data.
- Operator email alert (Task 8 alertService) when over 20% of owned accounts are
  disconnected at once (likely a broker or MetaApi outage, not users). Deduplicate
  per incident.
- Add GET /api/admin/broker-health (requireAdminAuth): counts by status, the
  oldest disconnects, and the MetaApi slot usage versus the plan limit.
Tests with stubbed fetch for the state transitions and the scoring pause.
```

## Task 8: Observability for third-party calls

```
Part A — alerting. Add server/src/services/alertService.ts with
  sendOperatorAlert({severity, title, body, dedupeKey}). Decision: email. Implement a
  provider-agnostic interface with one concrete transport (recommend Resend over its
  HTTPS API, so there is no new heavy dependency). Config comes from env:
  ALERT_EMAIL_TO, ALERT_EMAIL_FROM, RESEND_API_KEY. Do not hard-code addresses. Dedupe
  per dedupeKey for 60 min, and send a "recovered" email when an incident clears. If
  env is missing, log a warning once and no-op (never crash). Add the env keys to
  render.yaml with `sync: false`. Tests stub fetch and assert dedupe.

Part B — metrics. Add a small wrapper server/src/utils/externalCall.ts:
  externalCall(name, fn, {timeoutMs, retries, retryOn}) -> logs one structured JSON
  line per call {svc:'metaapi', op, status, ms, attempt, accountRef(masked)}, enforces
  the timeout, and keeps in-memory counters (count, errors, p50/p95 latency) per op.
Use it for all MetaApi, Exness, AllTick and TradingView calls. Add
GET /api/admin/metrics (requireAdminAuth) returning the counters, and include
MetaApi error rate and p95 in /api/health as "degraded" when error rate > 20% over 5 min.
Send an operator email (Part A) when MetaApi is degraded for over 5 min.
Never log tokens, passwords or full MetaApi account ids (reuse the existing
masking helper from commit d582d78).
```

## Task 9: Capacity and quota plan (research and doc, no code). DEFERRED until about 80 accounts

```
We plan to grow users. Each connected trader uses a MetaApi cloud-g2 account
(resourceSlots: 1, reliability: high). Using MetaApi's public docs and pricing,
write docs/capacity-metaapi.md covering:
- Cost per connected account per month for the current type/reliability, and options
  (reliability 'regular', undeploying idle accounts, rate of deploy hours).
- Provisioning and client API rate limits relevant to us. Map each of our call
  sites (grep metaApiClient usage) to calls per hour at 100 / 1,000 / 10,000 users
  after Tasks 4 and 7.
- The account-count limit for our plan and what happens when it is exceeded
  (map to the QUOTA_EXCEEDED onboarding reason).
- Recommendation and concrete thresholds for alerting.
Cite sources with URLs. Mark anything you could not verify.
```

## Task 10: Single-instance state risk (design doc). DEFERRED until about 80 accounts

```
All accounts, trades, the leaderboard and the event bus live in process memory
(RedisStreamsBus is an in-memory simulation) and are persisted as JSON in R2.
render.yaml runs one starter instance with a 384MB heap cap. Write
docs/scaling-state.md assessing: memory per connected account (measure with a
script that loads N synthetic accounts and trades in simulation mode), the user
count at which we hit the heap cap, restart recovery time, and what breaks with 2+
instances (in-memory rate limiter, WebSocket fan-out, background jobs running
twice). Recommend the smallest step (for example managed Postgres + Redis, or a
single-writer leader lock) with a migration order. No code changes.
```
