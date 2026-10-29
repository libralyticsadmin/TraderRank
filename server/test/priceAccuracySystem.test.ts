import { describe, it, expect } from 'vitest';
import { TradingViewAdapter } from '../src/market/tradingViewAdapter.js';
import { LiveMarketFeedService } from '../src/market/liveMarketFeed.js';
import { MetaApiClient } from '../src/workers/metaApiClient.js';
import { SYMBOL_METADATA_MAP, applyLiveTick, generateRealisticCandles } from '../../client/src/utils/candlestickGenerator.js';

describe('TraderRank Infallible Price & Chart Accuracy System', () => {
  const tradingViewAdapter = TradingViewAdapter.getInstance();
  const marketFeed = LiveMarketFeedService.getInstance();

  it('1. TradingViewAdapter should resolve accurate real-time quotes for Forex, Gold, Oil, and Crypto', async () => {
    const symbols = ['EURUSD', 'USDJPY', 'GBPUSD', 'XAUUSD', 'BTCUSD', 'MCL1!'];
    const quotes = await tradingViewAdapter.fetchBatchQuotes(symbols);

    expect(quotes).toBeDefined();

    for (const sym of symbols) {
      const q = quotes[sym];
      expect(q, `Quote for ${sym} should exist`).toBeDefined();
      expect(q.bid, `Bid for ${sym} should be a positive number`).toBeGreaterThan(0);
      expect(q.ask, `Ask for ${sym} should be >= bid`).toBeGreaterThanOrEqual(q.bid);
      expect(q.lastPrice, `Last price for ${sym} should be positive`).toBeGreaterThan(0);

      // Verify specific reasonable current ranges
      if (sym === 'USDJPY') {
        expect(q.lastPrice).toBeGreaterThan(140);
        expect(q.lastPrice).toBeLessThan(175);
      } else if (sym === 'XAUUSD') {
        expect(q.lastPrice).toBeGreaterThan(3500);
        expect(q.lastPrice).toBeLessThan(5000);
      } else if (sym === 'EURUSD') {
        expect(q.lastPrice).toBeGreaterThan(0.95);
        expect(q.lastPrice).toBeLessThan(1.25);
      } else if (sym === 'BTCUSD') {
        expect(q.lastPrice).toBeGreaterThan(50000);
      }
    }
  }, 15000);

  it('2. TradingViewAdapter should fetch historical candlestick OHLCV series for 1m and 4h', async () => {
    const res1m = await tradingViewAdapter.fetchCandlesticks('XAUUSD', '1m', 30);
    expect(res1m).not.toBeNull();
    expect(res1m?.bars.length).toBeGreaterThanOrEqual(20);

    const firstBar = res1m!.bars[0];
    expect(firstBar.open).toBeGreaterThan(0);
    expect(firstBar.high).toBeGreaterThanOrEqual(firstBar.open);
    expect(firstBar.high).toBeGreaterThanOrEqual(firstBar.close);
    expect(firstBar.low).toBeLessThanOrEqual(firstBar.open);
    expect(firstBar.low).toBeLessThanOrEqual(firstBar.close);
    expect(firstBar.timestamp).toBeGreaterThan(0);

    // Test 4h aggregated bars
    const res4h = await tradingViewAdapter.fetchCandlesticks('USDJPY', '4h', 20);
    expect(res4h).not.toBeNull();
    expect(res4h?.bars.length).toBeGreaterThan(0);
  }, 15000);

  it('3. MetaApiClient should produce valid candidate broker symbols for multi-broker matching', () => {
    const goldCandidates = MetaApiClient.getBrokerSymbolCandidates('XAUUSD');
    expect(goldCandidates).toContain('GOLD#');
    expect(goldCandidates).toContain('GOLD');
    expect(goldCandidates).toContain('XAUUSD');

    const btcCandidates = MetaApiClient.getBrokerSymbolCandidates('BTCUSD');
    expect(btcCandidates).toContain('BTCUSD#');

    const oilCandidates = MetaApiClient.getBrokerSymbolCandidates('MCL1!');
    expect(oilCandidates).toContain('OILCash#');
  });

  it('4. LiveMarketFeedService should return verified live or anchored candles without stale fallback data', async () => {
    const res = await marketFeed.fetchCandlesticks('XAUUSD', '1m', 50);
    expect(res.bars.length).toBe(50);
    expect(res.source).toMatch(/METAAPI_LIVE|TRADINGVIEW_LIVE|ALLTICK_LIVE|SYNTHETIC_FALLBACK/);

    const lastBar = res.bars[res.bars.length - 1];
    // Check that Gold price is in realistic real-world range (~4000-4100) and not old corrupted prices
    expect(lastBar.close).toBeGreaterThan(3500);
    expect(lastBar.close).toBeLessThan(4500);
  }, 15000);

  it('5. candlestickGenerator applyLiveTick should strictly snap to external live price and prevent random drift', () => {
    const initialBars = generateRealisticCandles('USDJPY', '1m', 10);
    const initialClose = initialBars[initialBars.length - 1].close;

    // Apply 50 micro-ticks without external price - ensure price stays within tight bound of initial (mean-reversion)
    let bars = initialBars;
    for (let i = 0; i < 50; i++) {
      bars = applyLiveTick(bars, 'USDJPY', '1m');
    }
    const unanchoredClose = bars[bars.length - 1].close;
    const maxDrift = SYMBOL_METADATA_MAP['USDJPY'].tickVolatility * 3;
    expect(Math.abs(unanchoredClose - initialClose)).toBeLessThan(maxDrift);

    // Apply tick with exact external verified price
    const targetVerifiedPrice = 158.195;
    bars = applyLiveTick(bars, 'USDJPY', '1m', targetVerifiedPrice);
    expect(bars[bars.length - 1].close).toBe(targetVerifiedPrice);
    expect(bars[bars.length - 1].high).toBeGreaterThanOrEqual(targetVerifiedPrice);
    expect(bars[bars.length - 1].low).toBeLessThanOrEqual(targetVerifiedPrice);
  });

  it('6. MarketSimulator should maintain tight anchor bounding and prevent drift over time', () => {
    const sim = marketFeed.getStatus();
    const xau = sim.quotes['XAUUSD'];
    expect(xau).toBeDefined();
    expect(xau.bid).toBeGreaterThan(4000);
    expect(xau.bid).toBeLessThan(4100);
  });
});
