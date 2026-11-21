import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { instrumentedFetch, getServiceHealth, getMetricsSnapshot, deriveOperation, resetExternalCallMetrics } from '../src/utils/externalCall.js';
import { evaluateServiceHealth, resetServiceHealthMonitor } from '../src/services/serviceHealthMonitor.js';
import { alertService, AlertService } from '../src/services/alertService.js';

describe('Observability — instrumented outbound calls and operator alerts', () => {
  beforeEach(() => {
    resetExternalCallMetrics();
    resetServiceHealthMonitor();
    alertService.reset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('masks ids and tokens out of operation names', () => {
    expect(deriveOperation('get', 'https://x.agiliumtrade.ai/users/current/accounts/c3fb9213-c550-4038-b1cd-9f400705f759/positions'))
      .toBe('GET /users/current/accounts/:id/positions');
    expect(deriveOperation('GET', 'https://api.example.com/kline?token=secret123')).toBe('GET /kline');
  });

  it('adds a default timeout and records errors (5xx/429/network) but not caller-level 4xx', async () => {
    const seen: RequestInit[] = [];
    let status = 200;
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      seen.push(init);
      if (status === 0) throw new TypeError('fetch failed');
      return new Response('{}', { status });
    }));
    await instrumentedFetch('metaapi', 'https://m/a');
    expect(seen[0].signal).toBeInstanceOf(AbortSignal);
    status = 404; await instrumentedFetch('metaapi', 'https://m/a');
    status = 503; await instrumentedFetch('metaapi', 'https://m/a');
    status = 429; await instrumentedFetch('metaapi', 'https://m/a');
    status = 0; await expect(instrumentedFetch('metaapi', 'https://m/a')).rejects.toThrow();
    const h = getServiceHealth('metaapi');
    expect(h.calls5m).toBe(5);
    expect(h.errors5m).toBe(3);
    const op = getMetricsSnapshot().operations.find(o => o.key === 'metaapi GET /a');
    expect(op?.count).toBe(5);
  });

  it('emails once when MetaApi is degraded for over 5 minutes, then once on recovery', async () => {
    const sent: string[] = [];
    alertService.setTransport({ send: async s => { sent.push(s); return true; } });
    let fail = true;
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: fail ? 503 : 200 })));
    for (let i = 0; i < 12; i++) await instrumentedFetch('metaapi', 'https://m/a');

    const t0 = Date.now();
    expect((await evaluateServiceHealth('metaapi', t0)).status).toBe('degraded');
    expect(sent.length).toBe(0); // not yet 5 minutes
    await evaluateServiceHealth('metaapi', t0 + 5 * 60 * 1000 + 1);
    await evaluateServiceHealth('metaapi', t0 + 6 * 60 * 1000);
    expect(sent.filter(s => s.includes('[CRITICAL]')).length).toBe(1);

    resetExternalCallMetrics();
    fail = false;
    for (let i = 0; i < 12; i++) await instrumentedFetch('metaapi', 'https://m/a');
    await evaluateServiceHealth('metaapi', t0 + 7 * 60 * 1000);
    expect(sent.filter(s => s.includes('[RECOVERED]')).length).toBe(1);
  });

  it('alert service no-ops without config and never throws', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const svc = new (AlertService as unknown as { new (): AlertService })();
    await expect(svc.sendOperatorAlert({ severity: 'warning', title: 't', body: 'b', dedupeKey: 'k' })).resolves.toBe(false);
  });

  it('sends through Resend when configured, without hard-coded recipients', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.stubEnv('ALERT_EMAIL_FROM', 'alerts@example.com');
    vi.stubEnv('ALERT_EMAIL_TO', 'ops@example.com');
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => { bodies.push(String(init.body)); return new Response('{}', { status: 200 }); }));
    const ok = await alertService.sendOperatorAlert({ severity: 'critical', title: 'X down', body: 'details', dedupeKey: 'x' });
    expect(ok).toBe(true);
    expect(JSON.parse(bodies[0]).to).toEqual(['ops@example.com']);
  });
});
