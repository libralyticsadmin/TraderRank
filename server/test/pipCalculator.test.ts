import { describe, it, expect } from 'vitest';
import { PipCalculator } from '../src/core/pipCalculator.js';

describe('PipCalculator - Gauntlet Quality Verification', () => {
  it('should calculate 5-digit standard forex pips correctly (EURUSD, GBPUSD)', () => {
    // 1 pip = 0.0001
    // BUY EURUSD from 1.08500 to 1.08550 = +5.0 pips
    expect(PipCalculator.calculatePips('EURUSD', 'BUY', 1.08500, 1.08550)).toBe(5.0);

    // SELL EURUSD from 1.08500 to 1.08550 = -5.0 pips
    expect(PipCalculator.calculatePips('EURUSD', 'SELL', 1.08500, 1.08550)).toBe(-5.0);

    // BUY GBPUSD from 1.27123 to 1.27273 = +15.0 pips
    expect(PipCalculator.calculatePips('GBPUSD', 'BUY', 1.27123, 1.27273)).toBe(15.0);

    // BUY AUDUSD from 0.65820 to 0.65920 = +10.0 pips
    expect(PipCalculator.calculatePips('AUDUSD', 'BUY', 0.65820, 0.65920)).toBe(10.0);

    // SELL USDCAD from 1.36500 to 1.36250 = +25.0 pips
    expect(PipCalculator.calculatePips('USDCAD', 'SELL', 1.36500, 1.36250)).toBe(25.0);
  });

  it('should calculate 3-digit JPY pairs pips correctly (USDJPY, EURJPY)', () => {
    // 1 pip = 0.01
    // BUY USDJPY from 155.200 to 155.450 = +25.0 pips
    expect(PipCalculator.calculatePips('USDJPY', 'BUY', 155.200, 155.450)).toBe(25.0);

    // SELL USDJPY from 155.500 to 155.000 = +50.0 pips
    expect(PipCalculator.calculatePips('USDJPY', 'SELL', 155.500, 155.000)).toBe(50.0);
  });

  it('should calculate Spot Gold (XAUUSD) pips correctly with $0.10 standard', () => {
    // 1 pip = 0.10 (MetaQuotes / Myfxbook standard)
    // BUY XAUUSD from 2350.00 to 2352.50 = +25.0 pips
    expect(PipCalculator.calculatePips('XAUUSD', 'BUY', 2350.00, 2352.50)).toBe(25.0);

    // SELL XAUUSD from 2350.00 to 2345.00 = +50.0 pips
    expect(PipCalculator.calculatePips('XAUUSD', 'SELL', 2350.00, 2345.00)).toBe(50.0);
  });

  it('should strip broker suffixes correctly (e.g. XM, Axiory, Exness tags)', () => {
    expect(PipCalculator.normalizeSymbol('EURUSD.m')).toBe('EURUSD');
    expect(PipCalculator.normalizeSymbol('XAUUSD_i')).toBe('XAUUSD');
    expect(PipCalculator.normalizeSymbol('US30.cash')).toBe('US30');
    expect(PipCalculator.normalizeSymbol('USDJPY+')).toBe('USDJPY');

    // Verification with suffixed symbol
    expect(PipCalculator.calculatePips('EURUSD.m', 'BUY', 1.09000, 1.09100)).toBe(10.0);
  });

  it('should calculate crypto (BTCUSD) price moves', () => {
    // 1 pip = $1.00
    expect(PipCalculator.calculatePips('BTCUSD', 'BUY', 65000.00, 65250.00)).toBe(250.0);
    expect(PipCalculator.calculatePips('BTCUSD', 'SELL', 65000.00, 64500.00)).toBe(500.0);
  });

  it('should reconstruct openPrice respecting instrument digits precision', () => {
    // 5-digit Forex: BUY EURUSD 0.10 lot, closePrice 1.11500, profit $20.00 (+20 pips = +0.00200) -> openPrice 1.11300
    expect(PipCalculator.reconstructOpenPrice('EURUSD', 'BUY', 1.11500, 0.10, 20.00)).toBe(1.113);
    // 5-digit Forex fractional pip: BUY EURUSD 0.10 lot, closePrice 1.11425, profit $12.50 (+12.5 pips = +0.00125) -> openPrice 1.11300
    expect(PipCalculator.reconstructOpenPrice('EURUSD', 'BUY', 1.11425, 0.10, 12.50)).toBe(1.113);
    // 2-digit Gold: SELL XAUUSD 0.05 lot, closePrice 4513.68, profit $26.20 (+52.4 pips = +5.24) -> openPrice 4518.92
    expect(PipCalculator.reconstructOpenPrice('XAUUSD', 'SELL', 4513.68, 0.05, 26.20)).toBe(4518.92);
  });
});
