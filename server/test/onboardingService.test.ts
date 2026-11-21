import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnboardingService, OnboardingJob } from '../src/services/onboardingService.js';
import { MetaApiClient } from '../src/workers/metaApiClient.js';
import { AccountConnectorService } from '../src/connector/accountConnector.js';
import { alertService } from '../src/services/alertService.js';
import { GatewayCredentials } from '../../shared/src/types.js';

const TOKEN = 'live_token_1234567890abcdef';
// Test storage persists across runs (os.tmpdir); use run-unique logins
const RUN = String(Date.now()).slice(-5);

function enterLiveMode() {
  vi.stubEnv('VITEST', '');
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('META_API_TOKEN', TOKEN);
}

type Handler = (url: string, init?: RequestInit) => { status: number; body: unknown } | undefined;

function stubFetch(handler: Handler) {
  const calls: Array<{ url: string; method: string }> = [];
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, method: init?.method || 'GET' });
    const hit = handler(url, init) ||
      (url.includes('/positions') || url.includes('/history-deals') ? { status: 200, body: [] } : { status: 404, body: {} });
    return new Response(JSON.stringify(hit.body), { status: hit.status, headers: { 'Content-Type': 'application/json' } });
  }));
  return calls;
}

const creds = (login: string): GatewayCredentials => ({
  type: 'mt_gateway', broker: 'XM', platform: 'MT5', serverName: 'XMGlobal-MT5 10', login: `${login}${RUN}`, investorPassword: 'investorPass',
});

const liveInfo = { platform: 'mt5', broker: 'XM', currency: 'USD', server: 'XMGlobal-MT5 10', balance: 812.34, equity: 799.1, margin: 12.5, freeMargin: 786.6, leverage: 1000 };

async function drive(service: OnboardingService, job: OnboardingJob, maxSteps = 20) {
  for (let i = 0; i < maxSteps && (job.status === 'PROVISIONING' || job.status === 'CONNECTING'); i++) {
    job.nextCheckAt = 0;
    await service.processDueJobs();
    await service.waitForIdle();
  }
  await service.waitForIdle();
}

describe('OnboardingService — background broker onboarding (live mode)', () => {
  let service: OnboardingService;

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    enterLiveMode();
    service = OnboardingService.getInstance();
    service.reset();
    service.setMetaApiClient(new MetaApiClient(TOKEN));
    alertService.reset();
  });
  afterEach(() => {
    service.reset();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('creates the account only after MetaApi is CONNECTED, with real broker figures', async () => {
    let stateChecks = 0;
    stubFetch((url, init) => {
      if (url.endsWith('/users/current/accounts') && init?.method === 'POST') return { status: 201, body: { id: 'meta_new_1', state: 'DRAFT', region: 'london' } };
      if (url.endsWith('/users/current/accounts')) return { status: 200, body: [] };
      if (url.endsWith('/meta_new_1/deploy')) return { status: 204, body: {} };
      if (url.endsWith('/accounts/meta_new_1')) {
        stateChecks++;
        return { status: 200, body: { state: 'DEPLOYED', connectionStatus: stateChecks >= 2 ? 'CONNECTED' : 'DISCONNECTED' } };
      }
      if (url.endsWith('/meta_new_1/account-information')) return { status: 200, body: liveInfo };
      return undefined;
    });

    const job = await service.startJob('u_onb_1', 'OnbTrader', 'XM', creds('55501001'));
    await drive(service, job);

    expect(job.status).toBe('CONNECTED');
    const account = AccountConnectorService.getInstance().getAccount(job.accountId!);
    expect(account?.balance).toBe(812.34);
    expect(account?.equity).toBe(799.1);
    expect(account?.leverage).toBe(1000);
    expect(account?.connectionStatus).toBe('CONNECTED');
    expect(job.vaultSecretRef).toBeUndefined(); // credentials revoked from job after completion
    const view = service.toView(job);
    expect(JSON.stringify(view)).not.toContain('meta_new_1');
  });

  it('fails with INVALID_CREDENTIALS when MetaApi rejects the account (4xx) and creates nothing', async () => {
    stubFetch((url, init) => {
      if (url.endsWith('/users/current/accounts') && init?.method === 'POST') return { status: 400, body: { message: 'Failed to authenticate' } };
      if (url.endsWith('/users/current/accounts')) return { status: 200, body: [] };
      return undefined;
    });
    const job = await service.startJob('u_onb_2', 'OnbTrader2', 'XM', creds('55501002'));
    await drive(service, job);
    expect(job.status).toBe('FAILED');
    expect(job.reason).toBe('INVALID_CREDENTIALS');
    expect(job.accountId).toBeUndefined();
  });

  it('times out, frees the MetaApi slot it created, and never fabricates an account', async () => {
    vi.stubEnv('ONBOARDING_TIMEOUT_MS', '50');
    const calls = stubFetch((url, init) => {
      if (url.endsWith('/users/current/accounts') && init?.method === 'POST') return { status: 201, body: { id: 'meta_new_3', state: 'DEPLOYED' } };
      if (url.endsWith('/users/current/accounts')) return { status: 200, body: [] };
      if (url.endsWith('/accounts/meta_new_3')) return { status: 200, body: { state: 'DEPLOYED', connectionStatus: 'DISCONNECTED' } };
      if (url.endsWith('/meta_new_3/undeploy')) return { status: 204, body: {} };
      return undefined;
    });
    const job = await service.startJob('u_onb_3', 'OnbTrader3', 'XM', creds('55501003'));
    await new Promise(r => setTimeout(r, 80));
    await drive(service, job);
    expect(job.status).toBe('FAILED');
    expect(job.reason).toBe('TIMEOUT');
    expect(job.accountId).toBeUndefined();
    expect(calls.some(c => c.url.endsWith('/meta_new_3/undeploy') && c.method === 'POST')).toBe(true);
  });

  it('emails operators (deduplicated) on QUOTA_EXCEEDED', async () => {
    const sent: string[] = [];
    alertService.setTransport({ send: async subject => { sent.push(subject); return true; } });
    stubFetch((url, init) => {
      if (url.endsWith('/users/current/accounts') && init?.method === 'POST') return { status: 403, body: { message: 'Resource slots limit exceeded' } };
      if (url.endsWith('/users/current/accounts')) return { status: 200, body: [] };
      return undefined;
    });
    const a = await service.startJob('u_onb_4', 'A', 'XM', creds('55501004'));
    const b = await service.startJob('u_onb_5', 'B', 'XM', creds('55501005'));
    await drive(service, a);
    await drive(service, b);
    expect(a.reason).toBe('QUOTA_EXCEEDED');
    expect(b.reason).toBe('QUOTA_EXCEEDED');
    expect(sent.length).toBe(1);
    expect(sent[0]).toMatch(/QUOTA_EXCEEDED/);
  });

  it('only the owner can read a job; duplicate submissions reuse the active job', async () => {
    stubFetch((url, init) => {
      if (url.endsWith('/users/current/accounts') && init?.method === 'POST') return { status: 201, body: { id: 'meta_new_6', state: 'DEPLOYED' } };
      if (url.endsWith('/users/current/accounts')) return { status: 200, body: [] };
      if (url.endsWith('/accounts/meta_new_6')) return { status: 200, body: { state: 'DEPLOYED', connectionStatus: 'DISCONNECTED' } };
      return undefined;
    });
    const job = await service.startJob('u_onb_6', 'Owner', 'XM', creds('55501006'));
    const again = await service.startJob('u_onb_6', 'Owner', 'XM', creds('55501006'));
    expect(again.id).toBe(job.id);
    expect(service.getJob(job.id, 'u_onb_6')).not.toBeNull();
    expect(service.getJob(job.id, 'u_someone_else')).toBeNull();
  });

  it('classifies MetaApi errors into terminal reasons vs transient retries', () => {
    expect(OnboardingService.classifyError('MetaApi provisioning failed (400): bad password')).toBe('INVALID_CREDENTIALS');
    expect(OnboardingService.classifyError('MetaApi provisioning failed (404): not found')).toBe('SERVER_NOT_FOUND');
    expect(OnboardingService.classifyError('MetaApi provisioning failed (401): invalid token')).toBe('INTEGRATION_ERROR');
    expect(OnboardingService.classifyError('MetaApi provisioning failed (403): Resource slots limit exceeded')).toBe('QUOTA_EXCEEDED');
    expect(OnboardingService.classifyError('MetaApi provisioning failed (429): slow down')).toBeNull();
    expect(OnboardingService.classifyError('MetaApi provisioning failed (503): unavailable')).toBeNull();
    expect(OnboardingService.classifyError('fetch failed')).toBeNull();
  });
});
