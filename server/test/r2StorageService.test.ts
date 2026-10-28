import { describe, it, expect } from 'vitest';
import { R2StorageService } from '../src/services/r2StorageService.js';

describe('Cloudflare R2 Storage Service', () => {
  it('initializes with default credentials and marks configured', () => {
    const service = new R2StorageService();
    expect(service.isConfigured()).toBe(true);
    expect(service.getBucketName()).toBe('traderrank-data');
  });

  it('uploads JSON and falls back safely to in-memory store if remote bucket is pending', async () => {
    const service = new R2StorageService();
    const testPayload = {
      tournament: 'weekly_sprint_01',
      leaders: [{ rank: 1, trader: 'ApexTrader_FX', pips: 142.5 }],
    };

    const uploadRes = await service.uploadJson('test/test_snapshot.json', testPayload);
    expect(uploadRes.key).toBe('test/test_snapshot.json');
    expect(uploadRes.sizeBytes).toBeGreaterThan(0);
    expect(['R2_CLOUD', 'LOCAL_FALLBACK']).toContain(uploadRes.storage);

    const retrieved = await service.getJson<typeof testPayload>('test/test_snapshot.json');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.tournament).toBe('weekly_sprint_01');
    expect(retrieved?.leaders[0].trader).toBe('ApexTrader_FX');
  });

  it('generates structured leaderboard snapshot metadata', async () => {
    const service = new R2StorageService();
    const standings = [
      { rank: 1, userId: 'usr_01', netPips: 88.4 },
      { rank: 2, userId: 'usr_02', netPips: 62.1 },
    ];

    const result = await service.saveLeaderboardSnapshot('tourn_weekly_fx_blitz_01', standings);
    expect(result.key).toContain('leaderboards/tourn_weekly_fx_blitz_01/snapshot_');
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it('generates structured trade archive snapshot metadata', async () => {
    const service = new R2StorageService();
    const mockDeals = [
      { dealId: 'deal_01', symbol: 'EURUSD', profitPips: 15.2, type: 'BUY' },
      { dealId: 'deal_02', symbol: 'XAUUSD', profitPips: -4.5, type: 'SELL' },
    ];

    const result = await service.saveTradeArchive('acc_demo_01', mockDeals);
    expect(result.key).toContain('trades/acc_demo_01/deals_');
    expect(result.sizeBytes).toBeGreaterThan(0);
  });
});
