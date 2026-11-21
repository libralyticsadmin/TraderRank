# TraderRank — rules for coding agents

Monorepo: `server/` (Express + ws, TypeScript), `client/` (React 19 + Vite), `shared/` (types, gamification).
Frontend deploys to Vercel and proxies `/api/*` to the Render backend (`render.yaml`).

## Commands
- Tests: `npm --prefix server test` (vitest; includes code guard tests that block CI)
- Type checks: `npx tsc --noEmit -p server` and `npx tsc --noEmit -p client`
- Dev: `npm --prefix server run dev` (port 4000), `npm --prefix client run dev` (port 3000)

## Data integrity (non-negotiable)
- Every account figure shown to users (balance, equity, margin, positions, trades, currency)
  must come from the broker (MetaApi). Never invent values.
- Simulated data is allowed only when `isSimulatedDataAllowed()` (`server/src/core/dataPolicy.ts`)
  returns true, i.e. in tests or local dev without `META_API_TOKEN`.
- Never add a "fallback" that returns `success: true` with default numbers when a broker call
  fails. Return a typed failure (`errorCode`) and let the UI explain it.
- Disconnected accounts: their ranks freeze as stale and they earn no new points (see
  `accountHealthService`). Don't bypass that.

## Outbound calls
- Every `fetch` to a third party passes `signal: AbortSignal.timeout(ms)`. A guard test
  enforces this. A rare justified exception needs `// guard:allow-no-timeout <reason>`.
- Request handlers that call third parties must have an overall deadline, well under the
  Vercel proxy limit (keep it under 25s).
- Never block an HTTP request waiting for a MetaApi deploy/connect (it takes 30s to minutes).
  Use the background onboarding job (`onboardingService`) and let the client poll.
- Never fetch the full MetaApi account list in a request path or a frequent timer. Use the
  login index / cached list in `metaApiClient`.

## Identity and accounts
- No hard-coded logins, userIds, MetaApi account ids, usernames or personal names in
  generic code. Ownership and display identity come from the persisted stores
  (`accountOwners`, user profiles). A guard test enforces this.
- Market data must not use a user's broker account. Use `META_API_MARKET_DATA_ACCOUNT_ID`
  with the AllTick/TradingView fallback.

## Security and privacy
- Accept only investor (read-only) passwords. Store them only through the secrets vault.
- Never log tokens, passwords, or full MetaApi account ids (mask them).
- Notifications: traders are notified in-app only. Operators get email via `alertService`.

## Testing
- Any change to a live broker path needs a live-mode test. Follow the pattern in
  `server/test/brokerDataIntegrity.test.ts` (`vi.stubEnv` to leave simulation mode, plus
  a stubbed `fetch`).
- Don't weaken or delete guard tests to make CI pass. Fix the code.
