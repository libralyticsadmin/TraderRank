/**
 * Watches third-party service health from instrumentedFetch metrics and emails operators
 * when MetaApi has been degraded (error rate > 20% over 5 min, min 10 calls) for > 5 minutes.
 */

import { getServiceHealth, getServiceP95, ExternalService } from '../utils/externalCall.js';
import { alertService } from './alertService.js';

const ERROR_RATE_THRESHOLD = 0.2;
const MIN_CALLS = 10;
const ALERT_AFTER_MS = 5 * 60 * 1000;

export interface ServiceStatus {
  status: 'ok' | 'degraded' | 'idle';
  errorRate5m: number;
  calls5m: number;
  p95Ms: number;
  degradedSince?: string;
}

const degradedSince = new Map<ExternalService, number>();

export function getServiceStatus(svc: ExternalService): ServiceStatus {
  const h = getServiceHealth(svc);
  const degraded = h.calls5m >= MIN_CALLS && h.errorRate5m > ERROR_RATE_THRESHOLD;
  const since = degradedSince.get(svc);
  return {
    status: h.calls5m === 0 ? 'idle' : degraded ? 'degraded' : 'ok',
    errorRate5m: h.errorRate5m,
    calls5m: h.calls5m,
    p95Ms: getServiceP95(svc),
    degradedSince: degraded && since ? new Date(since).toISOString() : undefined,
  };
}

/** One evaluation pass (exposed for tests; `now` injectable). */
export async function evaluateServiceHealth(svc: ExternalService = 'metaapi', now = Date.now()): Promise<ServiceStatus> {
  const status = getServiceStatus(svc);
  const key = `service:${svc}:degraded`;
  if (status.status === 'degraded') {
    if (!degradedSince.has(svc)) degradedSince.set(svc, now);
    if (now - degradedSince.get(svc)! >= ALERT_AFTER_MS) {
      await alertService.sendOperatorAlert({
        severity: 'critical',
        title: `${svc} degraded: ${(status.errorRate5m * 100).toFixed(0)}% errors`,
        body: `${svc} error rate ${(status.errorRate5m * 100).toFixed(1)}% over ${status.calls5m} calls in 5 min (p95 ${status.p95Ms}ms).\nBroker onboarding and account sync may be failing. See GET /api/admin/metrics`,
        dedupeKey: key,
      });
    }
  } else {
    degradedSince.delete(svc);
    await alertService.resolveOperatorAlert(key, `${svc} recovered`, `${svc} error rate back to ${(status.errorRate5m * 100).toFixed(1)}%.`);
  }
  return getServiceStatus(svc);
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startServiceHealthMonitor(): void {
  if (timer) return;
  timer = setInterval(() => {
    evaluateServiceHealth('metaapi').catch(() => {});
  }, 60_000);
  timer.unref?.();
}

/** Test hook. */
export function resetServiceHealthMonitor(): void {
  degradedSince.clear();
}
