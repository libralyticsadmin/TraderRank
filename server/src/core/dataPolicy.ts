/**
 * Data integrity policy.
 *
 * TraderRank shows broker-verified data only. Simulated balances, positions and deals are
 * permitted solely in the automated test runtime, or in local development when no MetaApi
 * token is configured (offline demo mode). Whenever a real broker integration is available,
 * or the process runs in production, every account figure must come from the broker — on
 * failure we surface an error instead of fabricating values.
 */
export function isSimulatedDataAllowed(): boolean {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return true;
  if (process.env.NODE_ENV === 'production') return false;
  const token = process.env.META_API_TOKEN || '';
  const hasLiveToken = token.length > 10 && !token.startsWith('mock_');
  return !hasLiveToken;
}
