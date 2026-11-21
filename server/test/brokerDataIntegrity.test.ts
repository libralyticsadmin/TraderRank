import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { MetaApiClient } from '../src/workers/metaApiClient.js';
import { MTGatewayWorker } from '../src/workers/mtGatewayWorker.js';
import { isSimulatedDataAllowed } from '../src/core/dataPolicy.js';

const TOKEN = 'live_token_1234567890abcdef';

/** Switch the process into live (non-simulated) mode for the duration of a test. */
function enterLiveMode() {
  vi.stubEnv('VITEST', '');
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('META_API_TOKEN', TOKEN);
  vi.stubEnv('METAAPI_VALIDATION_BUDGET_MS', '2500');
}

type Route = (url: string, init?: RequestInit) => { status: number; body: unknown } | undefined;

function stubFetch(route: Route) {
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const hit = route(url, init) || { status: 404, body: { message: 'not found' } };
    return new Response(JSON.stringify(hit.body), {
      status: hit.status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const liveInfo = {
  platform: 'mt5', broker: 'XM Global', currency: 'USD', server: 'XMGlobal-MT5 10',
  balance: 2345.67, equity: 2401.12, margin: 55.5, freeMargin: 2345.62, leverage: 500, name: 'Trader',
};

describe('Broker data integrity — no fabricated account data in live mode', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('allows simulated data only in tests or offline local dev', () => {
    expect(isSimulatedDataAllowed()).toBe(true); // vitest runtime

    enterLiveMode();
    expect(isSimulatedDataAllowed()).toBe(false);

    vi.stubEnv('NODE_ENV', 'development');
    expect(isSimulatedDataAllowed()).toBe(false); // live token configured

    vi.stubEnv('META_API_TOKEN', '');
    expect(isSimulatedDataAllowed()).toBe(true); // offline local dev
  });

  it('fails instead of fabricating when the broker integration is not configured in production', async () => {
    enterLiveMode();
    vi.stubEnv('META_API_TOKEN', '');
    const res = await new MetaApiClient('').validateAccount('XMGlobal-MT5 10', '342186831', 'investorPass', 'MT5');
    expect(res.success).toBe(false);
    expect(res.accountInfo).toBeUndefined();
  });

  it('returns real broker figures when MetaApi is CONNECTED', async () => {
    enterLiveMode();
    stubFetch(url => {
      if (url.endsWith('/users/current/accounts')) {
        return { status: 200, body: [{ _id: 'acc1', login: '342186831', server: 'XMGlobal-MT5 10', state: 'DEPLOYED', connectionStatus: 'CONNECTED', region: 'london' }] };
      }
      if (url.endsWith('/accounts/acc1')) return { status: 200, body: { state: 'DEPLOYED', connectionStatus: 'CONNECTED', region: 'london' } };
      if (url.endsWith('/accounts/acc1/account-information')) return { status: 200, body: liveInfo };
      return undefined;
    });

    const res = await new MetaApiClient(TOKEN).validateAccount('XMGlobal-MT5 10', '342186831', 'investorPass', 'MT5');
    expect(res.success).toBe(true);
    expect(res.metaApiAccountId).toBe('acc1');
    expect(res.accountInfo?.balance).toBe(2345.67);
    expect(res.accountInfo?.equity).toBe(2401.12);
    expect(res.accountInfo?.leverage).toBe(500);
  });

  it('fails within the budget (no hang, no placeholder balance) when the broker stays DISCONNECTED', async () => {
    enterLiveMode();
    stubFetch((url, init) => {
      if (url.endsWith('/users/current/accounts') && (!init?.method || init.method === 'GET')) {
        return { status: 200, body: [{ _id: 'acc2', login: '342186831', server: 'XMGlobal-MT5 10', state: 'DEPLOYED', connectionStatus: 'DISCONNECTED', region: 'london' }] };
      }
      if (url.endsWith('/accounts/acc2') && init?.method === 'PUT') return { status: 204, body: {} };
      if (url.endsWith('/accounts/acc2/redeploy')) return { status: 204, body: {} };
      if (url.endsWith('/accounts/acc2')) return { status: 200, body: { state: 'DEPLOYED', connectionStatus: 'DISCONNECTED' } };
      return undefined;
    });

    const started = Date.now();
    const res = await new MetaApiClient(TOKEN).validateAccount('XMGlobal-MT5 10', '342186831', 'investorPass', 'MT5');
    expect(Date.now() - started).toBeLessThan(6000);
    expect(res.success).toBe(false);
    expect(res.accountInfo).toBeUndefined();
    expect(res.error).toMatch(/Could not log in to broker server/);
  });

  it('reports INVALID_CREDENTIALS when MetaApi rejects the account payload (4xx)', async () => {
    enterLiveMode();
    stubFetch((url, init) => {
      if (url.endsWith('/users/current/accounts') && init?.method === 'POST') {
        return { status: 400, body: { message: 'Failed to authenticate with the broker' } };
      }
      if (url.endsWith('/users/current/accounts')) return { status: 200, body: [] };
      return undefined;
    });

    const res = await new MetaApiClient(TOKEN).validateAccount('XMGlobal-MT5 10', '99999999', 'badPass', 'MT5');
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('INVALID_CREDENTIALS');
  });

  it('MT gateway worker does not override a live broker failure with a synthetic pass', async () => {
    enterLiveMode();
    stubFetch((url, init) => {
      if (url.endsWith('/users/current/accounts') && init?.method === 'POST') {
        return { status: 400, body: { message: 'Server not found' } };
      }
      if (url.endsWith('/users/current/accounts')) return { status: 200, body: [] };
      return undefined;
    });

    const worker = new MTGatewayWorker('XM');
    worker.getMetaApiClient().setToken(TOKEN);
    const res = await worker.validateConnection({
      type: 'mt_gateway', broker: 'XM', platform: 'MT5',
      serverName: 'XMGlobal-MT5 99', login: '12345678', investorPassword: 'pass',
    });
    expect(res.success).toBe(false);
    expect(res.accountDetails).toBeUndefined();
  });
});
