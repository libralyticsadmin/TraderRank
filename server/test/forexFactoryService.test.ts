import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForexFactoryService } from '../src/market/forexFactoryService.js';

describe('ForexFactoryService - Economic Calendar & Scraper Ingestion', () => {
  let service: ForexFactoryService;

  beforeEach(() => {
    service = ForexFactoryService.getInstance();
  });

  it('should initialize as a singleton instance', () => {
    const s2 = ForexFactoryService.getInstance();
    expect(service).toBe(s2);
  });

  it('should fetch calendar events and return structured economic calendar response', async () => {
    const calendar = await service.getCalendar({ forceRefresh: true });

    expect(calendar).toBeDefined();
    expect(calendar.events).toBeInstanceOf(Array);
    expect(calendar.events.length).toBeGreaterThan(0);
    expect(calendar.totalCount).toBe(calendar.events.length);
    expect(['FOREX_FACTORY_LIVE', 'FOREX_FACTORY_CACHED', 'FALLBACK']).toContain(calendar.source);
    expect(calendar.lastUpdated).toBeDefined();

    // Inspect first event structure
    const ev = calendar.events[0];
    expect(ev.id).toBeDefined();
    expect(ev.title).toBeDefined();
    expect(ev.country).toBeDefined();
    expect(ev.impact).toBeDefined();
    expect(typeof ev.timestamp).toBe('number');
    expect(typeof ev.isHighImpact).toBe('boolean');
    expect(typeof ev.hasPassed).toBe('boolean');
    expect(typeof ev.isUpcomingSoon).toBe('boolean');
    expect(typeof ev.timeUntilFormatted).toBe('string');
  });

  it('should filter events by country/currency correctly', async () => {
    const usdCalendar = await service.getCalendar({ country: 'USD' });
    expect(usdCalendar.events.every(e => e.country === 'USD')).toBe(true);
  });

  it('should filter events by impact correctly', async () => {
    const highImpactCalendar = await service.getCalendar({ impact: 'HIGH' });
    expect(highImpactCalendar.events.every(e => e.impact === 'HIGH')).toBe(true);
    expect(highImpactCalendar.events.every(e => e.isHighImpact === true)).toBe(true);
  });

  it('should identify next high impact upcoming event accurately', async () => {
    const calendar = await service.getCalendar();
    if (calendar.nextHighImpactEvent) {
      expect(calendar.nextHighImpactEvent.isHighImpact).toBe(true);
      expect(calendar.nextHighImpactEvent.hasPassed).toBe(false);
    }
  });
});
