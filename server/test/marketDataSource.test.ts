import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarketDataSource } from '../src/market/marketDataSource.js';
import { MetaApiClient } from '../src/workers/metaApiClient.js';
import { alertService } from '../src/services/alertService.js';

const TOKEN = 'live_token_1234567890abcdef';

describe('MarketDataSource — dedicated platform account, never a user account', () => {
  const source = MarketDataSource.getInstance();
  let status = 'CONNECTED';
  let calls: string[] = [];

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    calls = [];
    status = 'CONNECTED';
    alertService.reset();
    vi.stubGlobal('fetch', vi.fn(async (u: string) => {
      calls.push(String(u));
      return new Response(JSON.stringify({ state: 'DEPLOYED', connectionStatus: status }), { status: 200 });
    }));
    source.setMetaApiClient(new MetaApiClient(TOKEN));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('makes zero MetaApi calls and reports FALLBACK when no account is configured', async () => {
    vi.stubEnv('META_API_MARKET_DATA_ACCOUNT_ID', '');
    expect(await source.getConnectedAccountId()).toBeNull();
    expect(calls).toHaveLength(0);
    expect(source.getStatus()).toMatchObject({ source: 'FALLBACK', reason: 'not_configured' });
  });

  it('uses the configured account when CONNECTED and checks state at most once per minute', async () => {
    vi.stubEnv('META_API_MARKET_DATA_ACCOUNT_ID', 'platform-md-1');
    const t0 = Date.now();
    expect(await source.getConnectedAccountId(t0)).toBe('platform-md-1');
    expect(await source.getConnectedAccountId(t0 + 1000)).toBe('platform-md-1');
    expect(await source.getConnectedAccountId(t0 + 30_000)).toBe('platform-md-1');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('/accounts/platform-md-1');
    expect(source.getStatus().source).toBe('METAAPI_DEDICATED');
  });

  it('falls back when disconnected and emails once after 15 minutes', async () => {
    vi.stubEnv('META_API_MARKET_DATA_ACCOUNT_ID', 'platform-md-2');
    const sent: string[] = [];
    alertService.setTransport({ send: async s => { sent.push(s); return true; } });
    status = 'DISCONNECTED';
    const t0 = Date.now();
    expect(await source.getConnectedAccountId(t0)).toBeNull();
    expect(source.getStatus()).toMatchObject({ source: 'FALLBACK', reason: 'disconnected' });
    await source.getConnectedAccountId(t0 + 16 * 60 * 1000);
    await source.getConnectedAccountId(t0 + 18 * 60 * 1000);
    expect(sent.filter(s => s.includes('Market data account disconnected')).length).toBe(1);

    status = 'CONNECTED';
    expect(await source.getConnectedAccountId(t0 + 20 * 60 * 1000)).toBe('platform-md-2');
    expect(sent.filter(s => s.includes('[RECOVERED]')).length).toBe(1);
  });
});
