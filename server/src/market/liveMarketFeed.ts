/**
 * TraderRank Live Market Feed Service
 * Connects to live public forex and crypto market APIs to feed real-time prices
 * into the TraderRank calculation and streaming engine.
 */

import { MarketSimulator } from '../workers/marketSimulator.js';
import { AllTickAdapter } from './alltickAdapter.js';

export interface MarketQuote {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  source: 'LIVE_API' | 'SYNTHETIC';
  timestamp: string;
}

export interface LiveMarketStatus {
  feedStatus: 'LIVE_NETWORK' | 'FALLBACK_SYNTHETIC';
  lastSyncAt: string | null;
  successfulSyncCount: number;
  lastError?: string;
  quotes: Record<string, MarketQuote>;
}

export class LiveMarketFeedService {
  private static instance: LiveMarketFeedService;
  private simulator = MarketSimulator.getInstance();
  private alltickAdapter = new AllTickAdapter();
  private timer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private feedStatus: 'LIVE_NETWORK' | 'FALLBACK_SYNTHETIC' = 'FALLBACK_SYNTHETIC';
  private lastSyncAt: string | null = null;
  private successfulSyncCount = 0;
  private lastError?: string;
  private cachedQuotes = new Map<string, MarketQuote>();

  private constructor() {
    // Listen for live push ticks from AllTick if connected
    this.alltickAdapter.onTick((symbol, price) => {
      const spread = symbol === 'USDJPY' ? 0.018 : symbol === 'BTCUSD' ? 12.0 : 0.00012;
      this.applyLiveRate(symbol, price, spread);
      this.feedStatus = 'LIVE_NETWORK';
      this.lastSyncAt = new Date().toISOString();
      this.successfulSyncCount++;
    });

    // Try AllTick WebSocket if token is configured
    if (this.alltickAdapter.getToken()) {
      this.alltickAdapter.connect().catch(() => {});
    }

    // Initial fetch and start background sync
    this.fetchRealRates().catch(() => {});
    this.startBackgroundSync();
  }

  public static getInstance(): LiveMarketFeedService {
    if (!LiveMarketFeedService.instance) {
      LiveMarketFeedService.instance = new LiveMarketFeedService();
    }
    return LiveMarketFeedService.instance;
  }

  public startBackgroundSync(intervalMs = 15000): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.fetchRealRates().catch(() => {});
    }, intervalMs);
  }

  public stopBackgroundSync(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Fetches real rates from live public APIs.
   */
  public async fetchRealRates(): Promise<boolean> {
    if (this.isPolling) return false;
    this.isPolling = true;

    try {
      // 1. Try AllTick Real-Time API as primary tier if token is configured
      if (this.alltickAdapter.getToken()) {
        try {
          const alltickRes = await this.alltickAdapter.fetchLatestQuotes(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD', 'MCL1!', 'BTCUSD']);
          if (alltickRes.success && alltickRes.data && alltickRes.data.length > 0) {
            for (const tick of alltickRes.data) {
              const price = typeof tick.price === 'string' ? parseFloat(tick.price) : Number(tick.price);
              if (!isNaN(price) && price > 0) {
                const spread = tick.code === 'USDJPY' ? 0.018 : tick.code === 'BTCUSD' ? 12.0 : tick.code === 'XAUUSD' || tick.code === 'GOLD' ? 0.25 : tick.code === 'MCL1!' || tick.code === 'USOIL' ? 0.03 : 0.00012;
                const standardSymbol = AllTickAdapter.fromAllTickCode(tick.code);
                this.applyLiveRate(standardSymbol, price, spread);
              }
            }
            this.feedStatus = 'LIVE_NETWORK';
            this.lastSyncAt = new Date().toISOString();
            this.successfulSyncCount++;
            this.lastError = undefined;
            return true;
          }
        } catch {
          // Fall through to public exchange rate fallback
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      // Fetch live Forex rates (USD base)
      const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeout);

      if (!fxRes.ok) {
        throw new Error(`FX rate API returned status ${fxRes.status}`);
      }

      const fxData = await fxRes.json() as { rates?: Record<string, number>; result?: string };

      if (fxData.rates) {
        const rates = fxData.rates;

        // EURUSD = 1 / EUR rate (since base is USD)
        if (rates.EUR && rates.EUR > 0) {
          const eurusd = Number((1 / rates.EUR).toFixed(5));
          this.applyLiveRate('EURUSD', eurusd, 0.00012);
        }

        // GBPUSD = 1 / GBP rate
        if (rates.GBP && rates.GBP > 0) {
          const gbpusd = Number((1 / rates.GBP).toFixed(5));
          this.applyLiveRate('GBPUSD', gbpusd, 0.00016);
        }

        // USDJPY = JPY rate
        if (rates.JPY && rates.JPY > 0) {
          const usdjpy = Number((rates.JPY).toFixed(3));
          this.applyLiveRate('USDJPY', usdjpy, 0.018);
        }

        // AUDUSD = 1 / AUD rate
        if (rates.AUD && rates.AUD > 0) {
          const audusd = Number((1 / rates.AUD).toFixed(5));
          this.applyLiveRate('AUDUSD', audusd, 0.00014);
        }

        // USDCAD = CAD rate
        if (rates.CAD && rates.CAD > 0) {
          const usdcad = Number((rates.CAD).toFixed(5));
          this.applyLiveRate('USDCAD', usdcad, 0.00015);
        }
      }

      // Fetch live Crypto rates
      await this.fetchCryptoRates();

      this.feedStatus = 'LIVE_NETWORK';
      this.lastSyncAt = new Date().toISOString();
      this.successfulSyncCount++;
      this.lastError = undefined;
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.lastError = msg;
      // Do not break streaming; smoothly fallback to simulated engine
      this.feedStatus = 'FALLBACK_SYNTHETIC';
      return false;
    } finally {
      this.isPolling = false;
    }
  }

  private async fetchCryptoRates(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('https://api.coincap.io/v2/assets/bitcoin', {
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeout);

      if (res && res.ok) {
        const data = await res.json() as { data?: { priceUsd?: string } };
        if (data.data?.priceUsd) {
          const btc = Number(parseFloat(data.data.priceUsd).toFixed(2));
          this.applyLiveRate('BTCUSD', btc, 12.00);
          return;
        }
      }

      // Secondary fallback for BTC
      const secondaryRes = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot').catch(() => null);
      if (secondaryRes && secondaryRes.ok) {
        const data = await secondaryRes.json() as { data?: { amount?: string } };
        if (data.data?.amount) {
          const btc = Number(parseFloat(data.data.amount).toFixed(2));
          this.applyLiveRate('BTCUSD', btc, 12.00);
        }
      }
    } catch {
      // Non-critical, continue
    }
  }

  private applyLiveRate(symbol: string, rate: number, spread: number): void {
    const halfSpread = spread / 2;
    const isTwoDecimals = symbol === 'BTCUSD' || symbol === 'XAUUSD' || symbol === 'GOLD' || symbol === 'MCL1!' || symbol === 'USOIL';
    const bid = Number((rate - halfSpread).toFixed(symbol === 'USDJPY' ? 3 : isTwoDecimals ? 2 : 5));
    const ask = Number((rate + halfSpread).toFixed(symbol === 'USDJPY' ? 3 : isTwoDecimals ? 2 : 5));

    this.simulator.updatePrice(symbol, bid, ask);

    this.cachedQuotes.set(symbol, {
      symbol,
      bid,
      ask,
      spread,
      source: 'LIVE_API',
      timestamp: new Date().toISOString(),
    });
  }

  public async fetchCandlesticks(symbol = 'USDJPY', timeframe: any = '1m', count = 50) {
    return this.alltickAdapter.fetchCandlesticks(symbol, timeframe, count);
  }

  public onCandleUpdate(callback: (symbol: string, timeframe: any, bar: any) => void): void {
    this.alltickAdapter.onCandleUpdate(callback);
  }

  public getAllTickAdapter(): AllTickAdapter {
    return this.alltickAdapter;
  }

  public getStatus(): LiveMarketStatus {
    const quotesObj: Record<string, MarketQuote> = {};
    const allSimPrices = this.simulator.getAllPrices();

    for (const [sym, price] of allSimPrices.entries()) {
      const cached = this.cachedQuotes.get(sym);
      quotesObj[sym] = cached || {
        symbol: sym,
        bid: price.bid,
        ask: price.ask,
        spread: price.spread,
        source: 'SYNTHETIC',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      feedStatus: this.feedStatus,
      lastSyncAt: this.lastSyncAt,
      successfulSyncCount: this.successfulSyncCount,
      lastError: this.lastError,
      quotes: quotesObj,
    };
  }
}

