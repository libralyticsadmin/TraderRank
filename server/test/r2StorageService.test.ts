import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { R2StorageService } from '../src/services/r2StorageService.js';

describe('Cloudflare R2 Storage Service', () => {
  it('initializes with default credentials and marks configured', () => {
    process.env.R2_ACCESS_KEY_ID = 'test_key';
    process.env.R2_SECRET_ACCESS_KEY = 'test_secret';
    process.env.R2_ACCOUNT_ID = 'test_account';
    process.env.R2_ENDPOINT = 'https://test_account.r2.cloudflarestorage.com';
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

  it('isolates test storage away from production server/data/storage even when DATA_DIR is set', () => {
    const prevDataDir = process.env.DATA_DIR;
    process.env.DATA_DIR = '/var/data/traderrank';
    try {
      const service = new R2StorageService();
      const dbPath = path.resolve(service.getLocalDatabasePath());
      const prodPath = path.resolve(process.cwd(), 'data/storage');
      expect(dbPath.startsWith(path.resolve(os.tmpdir()))).toBe(true);
      expect(dbPath).not.toBe(prodPath);
    } finally {
      if (prevDataDir === undefined) {
        delete process.env.DATA_DIR;
      } else {
        process.env.DATA_DIR = prevDataDir;
      }
    }
  });

  it('keeps committed production storage free of test/mock pollution', () => {
    const prodStorageDir = path.resolve(process.cwd(), 'data/storage');
    if (!fs.existsSync(prodStorageDir)) return;

    const forbiddenMarkers = [
      '@test.com',
      'mock_9921048',
      'u_securetrader_',
      'TestChallenger',
      'PersistenceTester',
    ];

    const collectFiles = (dir: string): string[] => {
      const results: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...collectFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          results.push(fullPath);
        }
      }
      return results;
    };

    for (const filePath of collectFiles(prodStorageDir)) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const marker of forbiddenMarkers) {
        expect(content, `Unexpected test marker "${marker}" in ${filePath}`).not.toContain(marker);
      }
    }
  });
});
