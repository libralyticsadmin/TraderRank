import { instrumentedFetch } from '../utils/externalCall.js';
/**
 * Operator alerting (email).
 *
 * Provider-agnostic interface with a Resend HTTPS transport. Config comes only from env:
 *   ALERT_EMAIL_TO, ALERT_EMAIL_FROM, RESEND_API_KEY
 * When config is missing the service logs one warning and no-ops — it never throws.
 * Alerts are deduplicated per dedupeKey (60 min). resolveOperatorAlert() sends a single
 * "recovered" email for an incident that previously alerted.
 */

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface OperatorAlert {
  severity: AlertSeverity;
  title: string;
  body: string;
  /** Incidents with the same key are sent at most once per dedupe window. */
  dedupeKey: string;
}

export interface AlertTransport {
  send(subject: string, text: string): Promise<boolean>;
}

class ResendTransport implements AlertTransport {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly to: string[]
  ) {}

  async send(subject: string, text: string): Promise<boolean> {
    try {
      const res = await instrumentedFetch('resend', 'https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: this.from, to: this.to, subject, text }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        console.warn(`[AlertService] Email provider returned HTTP ${res.status}`);
      }
      return res.ok;
    } catch (err) {
      console.warn('[AlertService] Email send failed:', err instanceof Error ? err.message : String(err));
      return false;
    }
  }
}

export class AlertService {
  private static instance: AlertService;
  private static readonly DEDUPE_WINDOW_MS = 60 * 60 * 1000;

  private transport: AlertTransport | null | undefined; // undefined = not resolved yet
  private warnedMissingConfig = false;
  private readonly lastSentAt = new Map<string, number>();
  private readonly openIncidents = new Set<string>();

  public static getInstance(): AlertService {
    if (!AlertService.instance) AlertService.instance = new AlertService();
    return AlertService.instance;
  }

  /** Test hook: inject a transport (null disables sending). */
  public setTransport(transport: AlertTransport | null): void {
    this.transport = transport;
  }

  public reset(): void {
    this.lastSentAt.clear();
    this.openIncidents.clear();
    this.transport = undefined;
    this.warnedMissingConfig = false;
  }

  private resolveTransport(): AlertTransport | null {
    if (this.transport !== undefined) return this.transport;
    const apiKey = process.env.RESEND_API_KEY || '';
    const from = process.env.ALERT_EMAIL_FROM || '';
    const to = (process.env.ALERT_EMAIL_TO || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!apiKey || !from || to.length === 0) {
      if (!this.warnedMissingConfig) {
        console.warn('[AlertService] Email alerts disabled: set RESEND_API_KEY, ALERT_EMAIL_FROM, ALERT_EMAIL_TO.');
        this.warnedMissingConfig = true;
      }
      return null;
    }
    this.transport = new ResendTransport(apiKey, from, to);
    return this.transport;
  }

  /** Sends an alert unless the same dedupeKey was sent within the window. Never throws. */
  public async sendOperatorAlert(alert: OperatorAlert): Promise<boolean> {
    const now = Date.now();
    const last = this.lastSentAt.get(alert.dedupeKey);
    this.openIncidents.add(alert.dedupeKey);
    if (last && now - last < AlertService.DEDUPE_WINDOW_MS) return false;

    console.warn(`[ALERT:${alert.severity}] ${alert.title} — ${alert.body.split('\n')[0]}`);
    const transport = this.resolveTransport();
    if (!transport) return false;

    this.lastSentAt.set(alert.dedupeKey, now);
    const env = process.env.NODE_ENV || 'development';
    return transport.send(`[TraderRank ${env}] [${alert.severity.toUpperCase()}] ${alert.title}`, alert.body);
  }

  /** Marks an incident as recovered; emails once if an alert for it was open. Never throws. */
  public async resolveOperatorAlert(dedupeKey: string, title: string, body = ''): Promise<boolean> {
    if (!this.openIncidents.has(dedupeKey)) return false;
    this.openIncidents.delete(dedupeKey);
    const wasSent = this.lastSentAt.has(dedupeKey);
    this.lastSentAt.delete(dedupeKey);
    if (!wasSent) return false;
    const transport = this.resolveTransport();
    if (!transport) return false;
    const env = process.env.NODE_ENV || 'development';
    return transport.send(`[TraderRank ${env}] [RECOVERED] ${title}`, body || title);
  }
}

export const alertService = AlertService.getInstance();
