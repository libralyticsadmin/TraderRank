/**
 * Instrumented outbound HTTP for third-party services (MetaApi, AllTick, TradingView, ...).
 *
 * - Enforces a timeout when the caller did not pass an AbortSignal.
 * - Records per-operation counters and latency (p50/p95) plus a rolling 5-minute
 *   error rate per service, exposed via GET /api/admin/metrics and /api/health.
 * - Logs one structured JSON line for failed or slow calls (successful fast calls are
 *   counted, not logged, to avoid flooding logs from 4s polling loops).
 * - Never logs tokens or full ids: URLs are reduced to an operation name with ids masked.
 */

export type ExternalService = 'metaapi' | 'metastats' | 'alltick' | 'tradingview' | 'forexfactory' | 'exness' | 'fxrates' | 'crypto' | 'resend';

interface OpStats {
  count: number;
  errors: number;
  latencies: number[]; // ring buffer of recent latencies (ms)
  lastStatus?: number | string;
  lastErrorAt?: string;
}

interface Sample { at: number; ok: boolean }

const MAX_LATENCY_SAMPLES = 200;
const WINDOW_MS = 5 * 60 * 1000;
const SLOW_MS = 3000;

const opStats = new Map<string, OpStats>();
const serviceSamples = new Map<ExternalService, Sample[]>();

/** Reduces a URL to a stable, id-free operation name, e.g. "GET /users/current/accounts/:id/positions". */
export function deriveOperation(method: string, url: string): string {
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch {
    // relative or malformed URL: use as-is
  }
  const masked = pathname
    .split('/')
    .map(seg => (/^[0-9a-f-]{16,}$/i.test(seg) || /\d{4,}/.test(seg) || /%/.test(seg) ? ':id' : seg))
    .join('/');
  return `${method.toUpperCase()} ${masked}`;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function record(svc: ExternalService, op: string, ms: number, ok: boolean, status: number | string): void {
  const key = `${svc} ${op}`;
  const stats = opStats.get(key) || { count: 0, errors: 0, latencies: [] };
  stats.count += 1;
  if (!ok) {
    stats.errors += 1;
    stats.lastErrorAt = new Date().toISOString();
  }
  stats.lastStatus = status;
  stats.latencies.push(ms);
  if (stats.latencies.length > MAX_LATENCY_SAMPLES) stats.latencies.shift();
  opStats.set(key, stats);

  const now = Date.now();
  const samples = serviceSamples.get(svc) || [];
  samples.push({ at: now, ok });
  while (samples.length && samples[0].at < now - WINDOW_MS) samples.shift();
  serviceSamples.set(svc, samples);

  if (!ok || ms > SLOW_MS) {
    console.warn(JSON.stringify({ evt: 'external_call', svc, op, status, ms, ok }));
  }
}

/**
 * fetch() with instrumentation and a default timeout.
 * Counts as an error: network failure, timeout, HTTP 5xx and 429. Other 4xx are caller-level
 * outcomes (e.g. unknown symbol) and are not counted against service health.
 */
export async function instrumentedFetch(
  svc: ExternalService,
  url: string,
  init: RequestInit = {},
  defaultTimeoutMs = 10_000
): Promise<Response> {
  const method = init.method || 'GET';
  const op = deriveOperation(method, url);
  const started = Date.now();
  const finalInit: RequestInit = init.signal ? init : { ...init, signal: AbortSignal.timeout(defaultTimeoutMs) };
  try {
    // guard:allow-no-timeout finalInit always carries a signal (caller's or the default timeout)
    const res = await fetch(url, finalInit);
    const ok = res.status < 500 && res.status !== 429;
    record(svc, op, Date.now() - started, ok, res.status);
    return res;
  } catch (err) {
    const name = err instanceof Error ? err.name : 'Error';
    record(svc, op, Date.now() - started, false, name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network');
    throw err;
  }
}

export interface ServiceHealth {
  svc: ExternalService;
  calls5m: number;
  errors5m: number;
  errorRate5m: number;
}

export function getServiceHealth(svc: ExternalService): ServiceHealth {
  const now = Date.now();
  const samples = (serviceSamples.get(svc) || []).filter(s => s.at >= now - WINDOW_MS);
  const errors = samples.filter(s => !s.ok).length;
  return {
    svc,
    calls5m: samples.length,
    errors5m: errors,
    errorRate5m: samples.length ? Number((errors / samples.length).toFixed(3)) : 0,
  };
}

/** p95 latency across all operations of a service (recent samples). */
export function getServiceP95(svc: ExternalService): number {
  const all: number[] = [];
  for (const [key, stats] of opStats) {
    if (key.startsWith(`${svc} `)) all.push(...stats.latencies);
  }
  return percentile(all, 95);
}

export function getMetricsSnapshot() {
  const operations = Array.from(opStats.entries()).map(([key, s]) => ({
    key,
    count: s.count,
    errors: s.errors,
    p50Ms: percentile(s.latencies, 50),
    p95Ms: percentile(s.latencies, 95),
    lastStatus: s.lastStatus,
    lastErrorAt: s.lastErrorAt,
  }));
  const services = Array.from(serviceSamples.keys()).map(svc => ({ ...getServiceHealth(svc), p95Ms: getServiceP95(svc) }));
  return { generatedAt: new Date().toISOString(), services, operations };
}

/** Test hook. */
export function resetExternalCallMetrics(): void {
  opStats.clear();
  serviceSamples.clear();
}
