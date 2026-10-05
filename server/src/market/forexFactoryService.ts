/**
 * ForexFactory Real-Time Economic Calendar & High-Impact News Service
 * Ingests, parses and filters macroeconomic market moving releases from ForexFactory.
 * Reference: https://github.com/EPSOFT/Scrape-ForexFactory.git & https://www.forexfactory.com
 */

import {
  EconomicCalendarResponse,
  ForexFactoryEvent,
  NewsImpact,
} from '../../../shared/src/types.js';

interface RawForexFactoryItem {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast?: string;
  previous?: string;
  actual?: string;
}

export class ForexFactoryService {
  private static instance: ForexFactoryService;
  private primaryFeedUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
  private cachedEvents: ForexFactoryEvent[] = [];
  private lastFetchedAt: number = 0;
  private cacheTtlMs = 5 * 60 * 1000; // 5 minutes cache

  public static getInstance(): ForexFactoryService {
    if (!ForexFactoryService.instance) {
      ForexFactoryService.instance = new ForexFactoryService();
    }
    return ForexFactoryService.instance;
  }

  /**
   * Fetch and parse economic calendar events
   */
  public async getCalendar(options?: {
    country?: string;
    impact?: NewsImpact;
    forceRefresh?: boolean;
  }): Promise<EconomicCalendarResponse> {
    const now = Date.now();
    const shouldRefresh = options?.forceRefresh || this.cachedEvents.length === 0 || now - this.lastFetchedAt > this.cacheTtlMs;

    let source: 'FOREX_FACTORY_LIVE' | 'FOREX_FACTORY_CACHED' | 'FALLBACK' = 'FOREX_FACTORY_CACHED';

    if (shouldRefresh) {
      try {
        const fetched = await this.fetchLiveFeed();
        if (fetched && fetched.length > 0) {
          this.cachedEvents = fetched;
          this.lastFetchedAt = now;
          source = 'FOREX_FACTORY_LIVE';
        } else if (this.cachedEvents.length === 0) {
          this.cachedEvents = this.generateFallbackEvents();
          source = 'FALLBACK';
        }
      } catch (err) {
        console.warn('ForexFactory live fetch warning, using fallback/cached data', err);
        if (this.cachedEvents.length === 0) {
          this.cachedEvents = this.generateFallbackEvents();
          source = 'FALLBACK';
        }
      }
    }

    // Refresh dynamic time-until and status flags on the cached items
    const enriched = this.recalculateUrgency(this.cachedEvents);

    // Apply Filters
    let filtered = enriched;
    if (options?.country && options.country !== 'ALL') {
      const c = options.country.toUpperCase();
      filtered = filtered.filter(e => e.country.toUpperCase() === c);
    }

    if (options?.impact) {
      filtered = filtered.filter(e => e.impact === options.impact);
    }

    // Compute Metrics
    const highImpact = enriched.filter(e => e.isHighImpact);
    const medImpact = enriched.filter(e => e.impact === 'MEDIUM');
    const upcomingHighImpact = highImpact.filter(e => !e.hasPassed);
    const nextHighImpactEvent = upcomingHighImpact.length > 0 ? upcomingHighImpact[0] : null;

    return {
      events: filtered,
      totalCount: filtered.length,
      highImpactCount: highImpact.length,
      mediumImpactCount: medImpact.length,
      nextHighImpactEvent,
      source,
      lastUpdated: new Date(this.lastFetchedAt || now).toISOString(),
    };
  }

  /**
   * Fetch live JSON feed from FairEconomy / ForexFactory
   */
  private async fetchLiveFeed(): Promise<ForexFactoryEvent[]> {
    const res = await fetch(this.primaryFeedUrl, {
      headers: {
        'User-Agent': 'TraderRank-ForexFactory-Sync/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`ForexFactory HTTP ${res.status}: ${res.statusText}`);
    }

    const rawData = (await res.json()) as RawForexFactoryItem[];
    if (!Array.isArray(rawData)) {
      throw new Error('Malformed ForexFactory response');
    }

    const nowSec = Math.floor(Date.now() / 1000);

    return rawData.map((item, idx) => {
      const d = new Date(item.date);
      const ts = !isNaN(d.getTime()) ? Math.floor(d.getTime() / 1000) : nowSec + idx * 3600;
      const impact = this.normalizeImpact(item.impact);
      const isHigh = impact === 'HIGH';

      const timeDiff = ts - nowSec;
      const hasPassed = timeDiff < -180; // considered passed if > 3 mins in past
      const isUpcomingSoon = timeDiff >= 0 && timeDiff <= 3600; // within 1 hr

      let timeString = '';
      try {
        timeString = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } catch {
        timeString = 'All Day';
      }

      return {
        id: `ff_${ts}_${item.country}_${idx}`,
        title: item.title,
        country: item.country || 'ALL',
        date: item.date,
        timeString,
        timestamp: ts,
        impact,
        forecast: item.forecast || '',
        previous: item.previous || '',
        actual: item.actual || '',
        isHighImpact: isHigh,
        hasPassed,
        isUpcomingSoon,
        timeUntilFormatted: this.formatTimeUntil(ts, nowSec),
      };
    });
  }

  private normalizeImpact(impactStr?: string): NewsImpact {
    if (!impactStr) return 'LOW';
    const s = impactStr.toLowerCase();
    if (s.includes('high')) return 'HIGH';
    if (s.includes('med')) return 'MEDIUM';
    if (s.includes('hol')) return 'HOLIDAY';
    return 'LOW';
  }

  private recalculateUrgency(events: ForexFactoryEvent[]): ForexFactoryEvent[] {
    const nowSec = Math.floor(Date.now() / 1000);

    return events.map(e => {
      const timeDiff = e.timestamp - nowSec;
      const hasPassed = timeDiff < -180;
      const isUpcomingSoon = timeDiff >= 0 && timeDiff <= 3600;

      return {
        ...e,
        hasPassed,
        isUpcomingSoon,
        timeUntilFormatted: this.formatTimeUntil(e.timestamp, nowSec),
      };
    });
  }

  private formatTimeUntil(eventSec: number, nowSec: number): string {
    const diff = eventSec - nowSec;
    if (diff < -86400) {
      const days = Math.floor(Math.abs(diff) / 86400);
      return `${days}d ago`;
    }
    if (diff < -3600) {
      const hrs = Math.floor(Math.abs(diff) / 3600);
      return `${hrs}h ago`;
    }
    if (diff < -60) {
      const mins = Math.floor(Math.abs(diff) / 60);
      return `${mins}m ago`;
    }
    if (diff < 60 && diff >= -60) {
      return 'Released Just Now';
    }
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return `in ${mins}m`;
    }
    if (diff < 86400) {
      const hrs = Math.floor(diff / 3600);
      const remMins = Math.floor((diff % 3600) / 60);
      return `in ${hrs}h ${remMins}m`;
    }
    const days = Math.floor(diff / 86400);
    return `in ${days}d`;
  }

  private generateFallbackEvents(): ForexFactoryEvent[] {
    const nowSec = Math.floor(Date.now() / 1000);

    const sampleList = [
      { country: 'USD', title: 'Non-Farm Employment Change (NFP)', impact: 'HIGH' as NewsImpact, forecast: '145K', previous: '142K', offset: 2400 },
      { country: 'USD', title: 'Unemployment Rate', impact: 'HIGH' as NewsImpact, forecast: '4.2%', previous: '4.2%', offset: 2400 },
      { country: 'USD', title: 'Average Hourly Earnings m/m', impact: 'HIGH' as NewsImpact, forecast: '0.3%', previous: '0.4%', offset: 2400 },
      { country: 'JPY', title: 'BOJ Gov Ueda Speaks', impact: 'HIGH' as NewsImpact, forecast: '', previous: '', offset: -3600 },
      { country: 'USD', title: 'FOMC Meeting Minutes', impact: 'HIGH' as NewsImpact, forecast: '', previous: '', offset: 86400 * 2 },
      { country: 'EUR', title: 'ECB Monetary Policy Statement', impact: 'HIGH' as NewsImpact, forecast: '3.65%', previous: '3.65%', offset: 86400 * 3 },
      { country: 'GBP', title: 'BOE Gov Bailey Speaks', impact: 'HIGH' as NewsImpact, forecast: '', previous: '', offset: 86400 * 3 + 3600 },
      { country: 'USD', title: 'CPI m/m (Consumer Price Index)', impact: 'HIGH' as NewsImpact, forecast: '0.2%', previous: '0.2%', offset: 86400 * 4 },
      { country: 'USD', title: 'Core CPI m/m', impact: 'HIGH' as NewsImpact, forecast: '0.3%', previous: '0.3%', offset: 86400 * 4 },
      { country: 'CAD', title: 'Employment Change', impact: 'HIGH' as NewsImpact, forecast: '9.0K', previous: '-41.7K', offset: 86400 * 4 + 7200 },
    ];

    return sampleList.map((item, idx) => {
      const ts = nowSec + item.offset;
      const d = new Date(ts * 1000);
      return {
        id: `ff_fallback_${idx}`,
        title: item.title,
        country: item.country,
        date: d.toISOString(),
        timeString: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        timestamp: ts,
        impact: item.impact,
        forecast: item.forecast,
        previous: item.previous,
        actual: '',
        isHighImpact: item.impact === 'HIGH',
        hasPassed: item.offset < 0,
        isUpcomingSoon: item.offset >= 0 && item.offset <= 3600,
        timeUntilFormatted: this.formatTimeUntil(ts, nowSec),
      };
    });
  }
}
