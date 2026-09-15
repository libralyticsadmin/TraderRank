import { describe, it, expect } from 'vitest';
import { StreamingSynchronizer } from '../src/connector/streamingSynchronizer.js';

describe('Piece 3: Realtime Streaming Synchronization Model', () => {
  it('initializes account with correct equity, free margin and margin level', () => {
    const sync = new StreamingSynchronizer({
      accountId: 'acc_sync_1',
      broker: 'EXNESS',
      server: 'Exness-MT5Real',
      currency: 'USD',
      balance: 10000.00,
      margin: 200.00,
      leverage: 100,
    });

    const info = sync.getAccountInfo();
    expect(info.balance).toBe(10000.00);
    expect(info.equity).toBe(10000.00);
    expect(info.margin).toBe(200.00);
    expect(info.freeMargin).toBe(9800.00);
    expect(info.marginLevel).toBe(5000.00); // (10000 / 200) * 100
  });

  it('updates position and dynamically recalibrates equity and floating profit', () => {
    const sync = new StreamingSynchronizer({
      accountId: 'acc_sync_2',
      broker: 'XM',
      server: 'XMGlobal-Real 55',
      currency: 'USD',
      balance: 5000.00,
      margin: 100.00,
      leverage: 200,
    });

    sync.updatePosition({
      id: 'pos_101',
      accountId: 'acc_sync_2',
      symbol: 'EURUSD',
      type: 'BUY',
      volume: 1.0,
      openPrice: 1.0800,
      currentPrice: 1.0850,
      profit: 500.00,
      swap: -5.00,
      commission: -10.00,
      openTime: new Date().toISOString(),
    });

    const info = sync.getAccountInfo();
    expect(info.floatingProfit).toBe(485.00); // 500 - 5 - 10
    expect(info.equity).toBe(5485.00); // 5000 + 485
    expect(info.freeMargin).toBe(5385.00); // 5485 - 100

    const positions = sync.getPositions();
    expect(positions.length).toBe(1);
    expect(positions[0].netProfit).toBe(485.00);
  });

  it('re-evaluates positions and equity when live price ticks arrive', () => {
    const sync = new StreamingSynchronizer({
      accountId: 'acc_sync_3',
      broker: 'AXIORY',
      server: 'Axiory-Live',
      currency: 'USD',
      balance: 10000.00,
      margin: 100.00,
      leverage: 100,
    });

    sync.updatePosition({
      id: 'pos_202',
      accountId: 'acc_sync_3',
      symbol: 'EURUSD.ecn',
      type: 'BUY',
      volume: 0.10,
      openPrice: 1.1000,
      currentPrice: 1.1000,
      profit: 0,
      swap: 0,
      commission: 0,
      openTime: new Date().toISOString(),
    });

    // Tick arrives: EURUSD price moves up 20 pips (0.0020)
    sync.applyPriceTick('EURUSD', 1.1020, 1.1022);

    const positions = sync.getPositions();
    expect(positions[0].currentPrice).toBe(1.1020);
    // 0.0020 * 0.10 lots * 100,000 = 20.00 USD
    expect(positions[0].profit).toBe(20.00);
    expect(sync.getAccountInfo().equity).toBe(10020.00);
  });

  it('closes positions and archives them into historical deals while crediting balance', () => {
    const sync = new StreamingSynchronizer({
      accountId: 'acc_sync_4',
      broker: 'VANTAGE',
      server: 'VantageFX-Live',
      currency: 'USD',
      balance: 10000.00,
      margin: 0,
      leverage: 100,
    });

    sync.updatePosition({
      id: 'pos_303',
      accountId: 'acc_sync_4',
      symbol: 'GBPUSD',
      type: 'SELL',
      volume: 0.5,
      openPrice: 1.3000,
      currentPrice: 1.2950,
      profit: 250.00,
      swap: 2.50,
      commission: -7.00,
      openTime: new Date().toISOString(),
    });

    expect(sync.getPositions().length).toBe(1);

    const deal = sync.closePosition('pos_303', 1.2950);
    expect(deal).not.toBeNull();
    expect(deal?.profit).toBe(250.00);

    // Positions empty, deal created
    expect(sync.getPositions().length).toBe(0);
    expect(sync.getDeals().length).toBe(1);
    expect(sync.getAccountInfo().balance).toBe(10245.50); // 10000 + 250 + 2.5 - 7
    expect(sync.getAccountInfo().floatingProfit).toBe(0);
  });
});
