import { describe, it, expect } from 'vitest';
import { SymbolNormalizer } from '../src/connector/symbolNormalizer.js';

describe('Piece 4: Multi-Broker Schema Normalization', () => {
  const normalizer = SymbolNormalizer.getInstance();

  it('sanitizes broker-specific symbol suffixes across Exness, XM, Axiory, and Vantage', () => {
    // Exness standard suffix 'm'
    expect(normalizer.sanitizeSymbol('EURUSDm')).toBe('EURUSD');
    expect(normalizer.sanitizeSymbol('XAUUSDm')).toBe('XAUUSD');

    // Axiory ECN suffix '.ecn'
    expect(normalizer.sanitizeSymbol('EURUSD.ecn')).toBe('EURUSD');
    expect(normalizer.sanitizeSymbol('USDJPY.ecn')).toBe('USDJPY');

    // Vantage Raw suffix '.r'
    expect(normalizer.sanitizeSymbol('EURUSD.r')).toBe('EURUSD');
    expect(normalizer.sanitizeSymbol('GBPUSD+')).toBe('GBPUSD');

    // XM suffixes '_i', '#'
    expect(normalizer.sanitizeSymbol('EURUSD_i')).toBe('EURUSD');
    expect(normalizer.sanitizeSymbol('US30#')).toBe('US30');
  });

  it('accurately classifies asset classes', () => {
    expect(normalizer.detectAssetClass('EURUSD')).toBe('FOREX');
    expect(normalizer.detectAssetClass('USDJPY')).toBe('FOREX');
    expect(normalizer.detectAssetClass('XAUUSD')).toBe('COMMODITY');
    expect(normalizer.detectAssetClass('BTCUSD')).toBe('CRYPTO');
    expect(normalizer.detectAssetClass('US500')).toBe('INDEX');
  });

  it('resolves proper pip size for standard FX, JPY pairs, and commodities', () => {
    const eurusd = normalizer.getSymbolMetadata('EURUSD.ecn');
    expect(eurusd.pipSize).toBe(0.0001);
    expect(eurusd.digits).toBe(5);

    const usdjpy = normalizer.getSymbolMetadata('USDJPYm');
    expect(usdjpy.pipSize).toBe(0.01);
    expect(usdjpy.digits).toBe(3);

    const gold = normalizer.getSymbolMetadata('XAUUSDm');
    expect(gold.pipSize).toBe(0.1);
  });

  it('calculates pips correctly for both BUY and SELL trades', () => {
    // BUY EURUSD: 1.0800 -> 1.0850 = +50.0 pips
    expect(normalizer.calculatePips('EURUSD', 1.0800, 1.0850, 'BUY')).toBe(50.0);

    // SELL USDJPY: 150.50 -> 150.00 = +50.0 pips
    expect(normalizer.calculatePips('USDJPY', 150.50, 150.00, 'SELL')).toBe(50.0);

    // BUY losing trade: 1.1000 -> 1.0980 = -20.0 pips
    expect(normalizer.calculatePips('EURUSD', 1.1000, 1.0980, 'BUY')).toBe(-20.0);
  });

  it('normalizes arbitrary timestamps to ISO8601 UTC strings', () => {
    const iso = normalizer.normalizeTimestamp('2026-09-15 12:30:00');
    expect(iso).toContain('2026-09-15');
    expect(iso).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
