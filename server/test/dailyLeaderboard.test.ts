import { describe, it, expect } from 'vitest';
import { LeaderboardService } from '../src/services/leaderboardService.js';
import { RedisStreamsBus } from '../src/eventbus/redisStreamsBus.js';

describe('Daily Winning Pips & Best Trader Engine', () => {
  const leaderboard = LeaderboardService.getInstance();
  const eventBus = RedisStreamsBus.getInstance();

  it('should calculate daily leaderboard and identify Daily Best Trader', () => {
    const daily = leaderboard.getDailyLeaderboard();

    expect(daily).toBeDefined();
    expect(daily.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(daily.standings.length).toBeGreaterThan(0);

    // Standings must be sorted descending by dailyTotalPips
    for (let i = 0; i < daily.standings.length - 1; i++) {
      expect(daily.standings[i].dailyTotalPips).toBeGreaterThanOrEqual(daily.standings[i + 1].dailyTotalPips);
      expect(daily.standings[i].rank).toBe(i + 1);
    }

    // Best trader must have rank 1 and be marked as champion
    expect(daily.dailyBestTrader).toBeDefined();
    expect(daily.dailyBestTrader?.rank).toBe(1);
    expect(daily.dailyBestTrader?.isDailyChampion).toBe(true);
    expect(daily.dailyBestTrader?.dailyTotalPips).toBeGreaterThan(0);
  });

  it('should support traders with accounts across multiple brokers', () => {
    const daily = leaderboard.getDailyLeaderboard();
    const multiBrokerTrader = daily.standings.find(s => s.brokers.length > 1);

    expect(multiBrokerTrader).toBeDefined();
    expect(multiBrokerTrader?.brokers).toContain('Exness');
    expect(multiBrokerTrader?.brokers).toContain('XM');
  });

  it('should dynamically update daily floating pips from live normalized positions', async () => {
    const testAccountId = 'acc_u_apex';

    // Emit live position update with floating pips
    await eventBus.publish('stream:position.normalized', 'position.normalized', testAccountId, [
      {
        id: 'pos_test_1',
        accountId: testAccountId,
        ticket: '1001',
        symbol: 'EURUSD',
        type: 'BUY',
        lotSize: 1.0,
        openPrice: 1.0850,
        currentPrice: 1.0875,
        profitCurrency: 250.0,
        profitPips: 25.0,
        swap: 0,
        commission: 0,
        openTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
      },
    ]);

    // Allow event loop processing
    await new Promise(r => setTimeout(r, 50));

    const updatedDaily = leaderboard.getDailyLeaderboard();
    const updatedTrader = updatedDaily.standings.find(s => s.userId === 'u_apex')!;

    expect(updatedTrader.dailyFloatingPips).toBe(25.0);
    expect(updatedTrader.dailyTotalPips).toBe(Number((updatedTrader.dailyClosedPips + 25.0).toFixed(1)));
  });

  it('should provide verified historical daily champions archive', () => {
    const history = leaderboard.getDailyChampionsHistory();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);

    const latest = history[0];
    expect(latest.date).toBeDefined();
    expect(latest.winnerUsername).toBeDefined();
    expect(latest.pipsWon).toBeGreaterThan(0);
    expect(latest.winnerBrokers.length).toBeGreaterThan(0);
  });
});
