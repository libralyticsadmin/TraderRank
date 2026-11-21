/**
 * Market data source resolver.
 *
 * Platform prices/candles come from a dedicated, platform-owned MetaApi account
 * (META_API_MARKET_DATA_ACCOUNT_ID) — never from a user's broker account. When it is unset
 * or not CONNECTED, callers fall back to TradingView / AllTick / public feeds.
 * The account state is checked at most once per minute (not per price tick).
 */

import { MetaApiClient } from '../workers/metaApiClient.js';
import { alertService } from '../services/alertService.js';

export type MarketDataSourceName = 'METAAPI_DEDICATED' | 'FALLBACK';

export interface MarketDataSourceStatus {
  source: MarketDataSourceName;
  reason?: 'not_configured' | 'disconnected' | 'unreachable';
  configured: boolean;
  checkedAt: string | null;
  disconnectedSince?: string;
}

const CHECK_INTERVAL_MS = 60_000;
const ALERT_AFTER_MS = 15 * 60 * 1000;

export class MarketDataSource {
  private static instance: MarketDataSource;
  private lastCheckAt = 0;
  private connected = false;
  private reason: MarketDataSourceStatus['reason'] = 'not_configured';
  private disconnectedSince: number | null = null;
  private checking: Promise<void> | null = null;
  private metaApi = new MetaApiClient();

  public static getInstance(): MarketDataSource {
    if (!MarketDataSource.instance) MarketDataSource.instance = new MarketDataSource();
    return MarketDataSource.instance;
  }

  /** Test hook. */
  public setMetaApiClient(client: MetaApiClient): void {
    this.metaApi = client;
    this.reset();
  }

  public reset(): void {
    this.lastCheckAt = 0;
    this.connected = false;
    this.reason = 'not_configured';
    this.disconnectedSince = null;
    this.checking = null;
  }

  private get accountId(): string {
    return (process.env.META_API_MARKET_DATA_ACCOUNT_ID || '').trim();
  }

  /** Returns the dedicated account id if it is configured and CONNECTED, else null. */
  public async getConnectedAccountId(now = Date.now()): Promise<string | null> {
    const id = this.accountId;
    if (!id || !this.metaApi.hasToken()) {
      this.connected = false;
      this.reason = 'not_configured';
      return null;
    }
    if (now - this.lastCheckAt >= CHECK_INTERVAL_MS) {
      if (!this.checking) {
        this.checking = this.refresh(id, now).finally(() => { this.checking = null; });
      }
      await this.checking;
    }
    return this.connected ? id : null;
  }

  private async refresh(id: string, now: number): Promise<void> {
    this.lastCheckAt = now;
    const state = await this.metaApi.getAccountState(id);
    const wasConnected = this.connected;
    this.connected = state?.connectionStatus === 'CONNECTED';
    this.reason = this.connected ? undefined : state ? 'disconnected' : 'unreachable';

    const key = 'market-data:dedicated-account-down';
    if (this.connected) {
      if (!wasConnected && this.disconnectedSince !== null) console.log('[MarketData] dedicated MetaApi account reconnected');
      this.disconnectedSince = null;
      await alertService.resolveOperatorAlert(key, 'Market data account reconnected', 'Platform prices are served from the dedicated MetaApi account again.');
      return;
    }
    if (this.disconnectedSince === null) {
      this.disconnectedSince = now;
      console.warn(`[MarketData] dedicated MetaApi account not connected (${this.reason}); using TradingView/AllTick fallback`);
    }
    if (now - this.disconnectedSince >= ALERT_AFTER_MS) {
      await alertService.sendOperatorAlert({
        severity: 'warning',
        title: 'Market data account disconnected',
        body: `The dedicated MetaApi market-data account has been ${this.reason} for over 15 minutes. Prices are served from the TradingView/AllTick fallback.`,
        dedupeKey: key,
      });
    }
  }

  public getStatus(): MarketDataSourceStatus {
    const configured = Boolean(this.accountId);
    return {
      source: this.connected && configured ? 'METAAPI_DEDICATED' : 'FALLBACK',
      reason: this.connected && configured ? undefined : configured ? this.reason : 'not_configured',
      configured,
      checkedAt: this.lastCheckAt ? new Date(this.lastCheckAt).toISOString() : null,
      disconnectedSince: this.disconnectedSince ? new Date(this.disconnectedSince).toISOString() : undefined,
    };
  }
}

export const marketDataSource = MarketDataSource.getInstance();
