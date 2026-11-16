import { describe, it, expect, beforeAll } from 'vitest';
import { AccountConnectorService } from '../src/connector/accountConnector.js';
import { LeaderboardService } from '../src/services/leaderboardService.js';
import { r2Storage } from '../src/services/r2StorageService.js';

describe('Dual-Layer Persistence Flow (Account Ownership, Subscriptions, Daily Champions)', () => {
  const connector = AccountConnectorService.getInstance();
  const leaderboard = LeaderboardService.getInstance();

  beforeAll(async () => {
    await connector.loadAccountOwnersFromR2();
    await leaderboard.loadHistoricalChampionsFromR2();
  });

  it('should persist account ownership to storage and restore on reload', async () => {
    // 1. Simulate account connection for a verified trader
    const testLogin = '88229911';
    const testUserId = 'u_persistence_tester';
    const testUsername = 'PersistenceTester';

    await connector.connectAccount(
      testUserId,
      testUsername,
      'Exness',
      {
        type: 'mt_gateway',
        broker: 'Exness',
        login: testLogin,
        investorPassword: 'readOnlyInvestorPass123',
        serverName: 'Exness-Real15',
        platform: 'MT5',
      }
    );

    // 2. Verify account owner mapping in memory
    const ownerBefore = connector.getAccountOwner(testLogin);
    expect(ownerBefore).toBeDefined();
    expect(ownerBefore?.userId).toBe(testUserId);
    expect(ownerBefore?.username).toBe(testUsername);
    expect(ownerBefore?.broker).toBe('Exness');
    expect(ownerBefore?.status).toBe('CONNECTED');

    // 3. Verify file was saved to storage
    const rawStorage = await r2Storage.getJson<Record<string, any>>('profiles/account_owners.json');
    expect(rawStorage).toBeDefined();
    expect(rawStorage?.[testLogin]).toBeDefined();
    expect(rawStorage?.[testLogin].userId).toBe(testUserId);

    // 4. Simulate server restart: clear memory and reload from storage
    await connector.loadAccountOwnersFromR2();
    const ownerAfter = connector.getAccountOwner(testLogin);
    expect(ownerAfter).toBeDefined();
    expect(ownerAfter?.userId).toBe(testUserId);
    expect(ownerAfter?.username).toBe(testUsername);

    // 5. Test disconnect persistence
    const matchingAcc = connector.getAccounts(testUserId).find(a => a.accountNumber === testLogin);
    if (matchingAcc) {
      await connector.disconnectAccount(matchingAcc.id, false);
      const ownerDisconnected = connector.getAccountOwner(testLogin);
      expect(ownerDisconnected?.status).toBe('DISCONNECTED');
    }
  });

  it('should guarantee Emanuel007 canonical account 72423906 ownership is always persisted', async () => {
    await connector.loadAccountOwnersFromR2();
    const emanuelOwner = connector.getAccountOwner('72423906');
    expect(emanuelOwner).toBeDefined();
    expect(emanuelOwner?.userId).toBe('u_emanuel007');
    expect(emanuelOwner?.username).toBe('Emanuel007');
    expect(emanuelOwner?.broker).toBe('XMTrading');
    expect(emanuelOwner?.status).toBe('CONNECTED');
  });

  it('should persist user subscriptions to storage and restore on reload', async () => {
    const testUserId = 'u_sub_persistence_test';
    const subRecord = {
      isActive: true,
      tier: 'PRO_MONTHLY',
      planName: 'Pro Daily Intelligence',
      priceMonthly: 9.0,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      paymentMethod: 'TEST_STRIPE',
      features: ['Full Daily Technical & Fundamental Summaries'],
    };

    // Save to billing/subscriptions.json via R2 storage
    const existingSubs = (await r2Storage.getJson<Record<string, any>>('billing/subscriptions.json')) || {};
    existingSubs[testUserId] = subRecord;
    await r2Storage.uploadJson('billing/subscriptions.json', existingSubs);

    // Reload and verify
    const reloadedSubs = await r2Storage.getJson<Record<string, any>>('billing/subscriptions.json');
    expect(reloadedSubs).toBeDefined();
    expect(reloadedSubs?.[testUserId]).toBeDefined();
    expect(reloadedSubs?.[testUserId].isActive).toBe(true);
    expect(reloadedSubs?.[testUserId].tier).toBe('PRO_MONTHLY');
  });

  it('should persist daily champions archive to storage and reload intact', async () => {
    const testDate = '2026-11-14';
    leaderboard.recordHistoricalDailyChampion({
      date: testDate,
      winnerUserId: 'u_emanuel007',
      winnerUsername: 'Emanuel007',
      winnerAvatarSymbol: 'bear_emerald',
      winnerBrokers: ['XMTrading'],
      pipsWon: 62.8,
      winRate: 85,
      tradesCompleted: 7,
    });

    // Check memory history
    const historyBefore = leaderboard.getDailyChampionsHistory();
    const matchBefore = historyBefore.find(c => c.date === testDate);
    expect(matchBefore).toBeDefined();
    expect(matchBefore?.pipsWon).toBe(62.8);

    // Reload from storage and verify
    await leaderboard.loadHistoricalChampionsFromR2();
    const historyAfter = leaderboard.getDailyChampionsHistory();
    const matchAfter = historyAfter.find(c => c.date === testDate);
    expect(matchAfter).toBeDefined();
    expect(matchAfter?.winnerUsername).toBe('Emanuel007');
    expect(matchAfter?.pipsWon).toBe(62.8);
  });
});
