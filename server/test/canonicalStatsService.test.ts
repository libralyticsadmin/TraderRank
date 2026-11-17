import { describe, it, expect } from 'vitest';
import { computeCanonicalStats } from '../src/services/canonicalStatsService.js';

describe('CanonicalStatsService (Single Source of Truth)', () => {
  it('computes unified stats, normalizes JPY to USD for sorting, and enforces canonical identities', async () => {
    const todayUtc = new Date().toISOString().slice(0, 10);

    const mockConnector: any = {
      getAccounts: () => [
        {
          id: 'acc_meta_72423906',
          userId: 'u_homiesplant_th',
          accountNumber: '72423906',
          broker: 'XMTrading',
          serverName: 'XMTrading-MT5',
          currency: 'JPY',
          profileUsername: 'HomiesPlant',
          balance: 1500000,
          equity: 1207757,
        },
        {
          id: 'acc_meta_342186831',
          userId: 'u_zzzemzzz',
          accountNumber: '342186831',
          broker: 'XM',
          serverName: 'XMGlobal-MT5 10',
          currency: 'USD',
          profileUsername: 'zzZEMZzz',
          balance: 5000,
          equity: 5097.7,
        },
      ],
      getAccountTrades: (accId: string) => {
        if (accId === 'acc_meta_72423906') {
          return [
            {
              id: 't1',
              symbol: 'XAUUSD',
              type: 'BUY',
              lotSize: 0.01,
              openPrice: 2600,
              closePrice: 2590,
              pnlPips: -100,
              pnlCurrency: -292243,
              closeTime: `${todayUtc}T10:00:00.000Z`,
            },
          ];
        }
        return [
          {
            id: 't2',
            symbol: 'EURUSD',
            type: 'BUY',
            lotSize: 0.1,
            openPrice: 1.08,
            closePrice: 1.08977,
            pnlPips: 97.7,
            pnlCurrency: 97.7,
            swap: -5.0,
            commission: -2.0,
            closeTime: `${todayUtc}T12:00:00.000Z`,
          },
        ];
      },
      getActivePositions: async (accId: string) => {
        if (accId === 'acc_meta_72423906') {
          return [
            {
              id: 'p1',
              ticket: '123456',
              symbol: 'XAUUSD',
              type: 'BUY',
              lotSize: 0.01,
              openPrice: 2600,
              currentPrice: 2602,
              profitPips: 20,
              profitCurrency: 3000,
            },
          ];
        }
        return [];
      },
    };

    const mockLeaderboard: any = {
      getLeaderboard: () => [],
    };

    const mockMarketFeed: any = {
      getStatus: () => ({
        quotes: {
          USDJPY: { bid: 154.5, ask: 154.52 },
        },
      }),
    };

    const result = await computeCanonicalStats(mockConnector, mockLeaderboard, mockMarketFeed);

    expect(result.usdJpyRate).toBe(154.5);
    expect(result.traders.length).toBe(2);

    const zem = result.traders.find(t => t.accountNumber === '342186831');
    const homies = result.traders.find(t => t.accountNumber === '72423906');

    expect(zem).toBeDefined();
    expect(zem?.profileName).toBe('zzZEMZzz');
    expect(zem?.currency).toBe('USD');
    expect(zem?.totalPips).toBe(97.7);
    expect(zem?.netProfitNative).toBe(90.7);
    expect(zem?.netProfitUsd).toBe(90.7);
    expect(zem?.rank).toBe(1);

    expect(homies).toBeDefined();
    expect(homies?.profileName).toBe('HomiesPlant');
    expect(homies?.currency).toBe('JPY');
    // closed (-100) + floating (+20) = -80
    expect(homies?.closedPips).toBe(-100);
    expect(homies?.floatingPips).toBe(20);
    expect(homies?.totalPips).toBe(-80);
    // Native stays in JPY (-292243 closed + 3000 floating = -289243), USD normalized via 154.5
    expect(homies?.netProfitNative).toBe(-289243);
    expect(homies?.netProfitUsd).toBeCloseTo(-289243 / 154.5, 1);
    expect(homies?.dailyTradesCount).toBe(1);
    expect(homies?.liveOrders.length).toBe(1);
    expect(homies?.liveOrders[0].isLivePosition).toBe(true);
  });
});
