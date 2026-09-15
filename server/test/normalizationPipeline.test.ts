import { describe, it, expect } from 'vitest';
import { TradeNormalizerService } from '../src/normalizer/tradeNormalizer.js';
import { RawPositionPayload, RawDealPayload } from '../src/workers/baseWorker.js';

describe('TradeNormalizerService - Canonical Schema Parity Standard', () => {
  const normalizer = TradeNormalizerService.getInstance();

  it('should normalize MT Gateway payload with broker suffixes into canonical position', () => {
    const rawMT: RawPositionPayload[] = [
      {
        accountId: 'acc_xm_123',
        ticket: '991203',
        symbol: 'EURUSD.m', // XM micro suffix
        type: 'BUY',
        volume: 1.5,
        openPrice: 1.08500,
        currentPrice: 1.08560,
        sl: 1.08000,
        tp: 1.09500,
        profit: 90.0,
        swap: -1.5,
        commission: -4.0,
        openTime: '2026-09-12T10:00:00Z',
        updateTime: '2026-09-12T10:05:00Z',
      },
    ];

    const normalized = normalizer.normalizePositions(rawMT);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].symbol).toBe('EURUSD');
    expect(normalized[0].profitPips).toBe(6.0); // (1.08560 - 1.08500) / 0.0001
    expect(normalized[0].accountId).toBe('acc_xm_123');
  });

  it('should normalize Exness Native payload into identical canonical format', () => {
    const rawExness: RawPositionPayload[] = [
      {
        accountId: 'acc_exness_456',
        ticket: '772183',
        symbol: 'XAUUSD',
        type: 'SELL',
        volume: 0.5,
        openPrice: 2350.00,
        currentPrice: 2348.00,
        profit: 100.0,
        swap: 0.0,
        commission: -2.5,
        openTime: '2026-09-12T11:00:00Z',
        updateTime: '2026-09-12T11:02:00Z',
      },
    ];

    const normalized = normalizer.normalizePositions(rawExness);
    expect(normalized[0].symbol).toBe('XAUUSD');
    expect(normalized[0].profitPips).toBe(20.0); // Gold: (2350 - 2348) / 0.10 = 20 pips
    expect(normalized[0].accountId).toBe('acc_exness_456');
  });

  it('should normalize closed deals correctly for XP & leaderboard scoring', () => {
    const rawDeal: RawDealPayload = {
      accountId: 'acc_xm_123',
      ticket: 'deal_5510',
      symbol: 'USDJPY_i', // Axiory institutional suffix
      type: 'BUY',
      volume: 1.0,
      openPrice: 154.200,
      closePrice: 154.550,
      profit: 350.0,
      commission: -5.0,
      swap: -1.0,
      openTime: '2026-09-12T08:00:00Z',
      closeTime: '2026-09-12T09:30:00Z',
    };

    const closed = normalizer.normalizeDeal(rawDeal);
    expect(closed.symbol).toBe('USDJPY');
    expect(closed.pnlPips).toBe(35.0); // (154.550 - 154.200) / 0.01 = 35.0 pips
  });
});
