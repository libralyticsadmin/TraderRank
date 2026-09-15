import { describe, it, expect, afterAll } from 'vitest';
import { LiveMarketFeedService } from '../src/market/liveMarketFeed.js';

describe('LiveMarketFeedService - Real Market Feed Integration', () => {
  const service = LiveMarketFeedService.getInstance();

  afterAll(() => {
    service.stopBackgroundSync();
  });

  it('should initialize and provide market quotes', () => {
    const status = service.getStatus();
    expect(status).toBeDefined();
    expect(status.quotes).toBeDefined();
    expect(status.quotes['EURUSD']).toBeDefined();
    expect(status.quotes['USDJPY']).toBeDefined();
    expect(status.quotes['XAUUSD']).toBeDefined();
    expect(status.quotes['BTCUSD']).toBeDefined();
  });

  it('should successfully fetch live rates or cleanly fallback', async () => {
    const result = await service.fetchRealRates();
    // Result is boolean (true if live API succeeded, false if rate limited / offline fallback)
    expect(typeof result).toBe('boolean');

    const status = service.getStatus();
    expect(['LIVE_NETWORK', 'FALLBACK_SYNTHETIC']).toContain(status.feedStatus);

    const eurQuote = status.quotes['EURUSD'];
    expect(eurQuote.bid).toBeGreaterThan(0.5);
    expect(eurQuote.ask).toBeGreaterThan(eurQuote.bid);
    expect(eurQuote.spread).toBeGreaterThan(0);
  });

  it('should format quotes with proper precision and timestamps', () => {
    const status = service.getStatus();
    const jpyQuote = status.quotes['USDJPY'];
    expect(jpyQuote.bid).toBeGreaterThan(50);
    expect(new Date(jpyQuote.timestamp).getTime()).not.toBeNaN();
  });
});
