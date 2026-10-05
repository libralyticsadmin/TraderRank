import { describe, it, expect } from 'vitest';
import { AiChartAnalyzer } from '../src/market/aiChartAnalyzer.js';
import { AllTickAdapter } from '../src/market/alltickAdapter.js';

describe('AiChartAnalyzer - Multi-Timeframe Chart Analysis (15m, 4h, 1D, 1W)', () => {
  const adapter = new AllTickAdapter('4554c41c6fc5298fb839ca4530639663-c-app');
  const analyzer = new AiChartAnalyzer(adapter);

  it('performs full AI multi-timeframe analysis on USDJPY', async () => {
    const report = await analyzer.analyzeSymbol('USDJPY', true);

    expect(report).toBeDefined();
    expect(report.symbol).toBe('USDJPY');
    expect(typeof report.confluenceScore).toBe('number');
    expect(report.confluenceScore).toBeGreaterThanOrEqual(0);
    expect(report.confluenceScore).toBeLessThanOrEqual(100);
    expect(['STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL']).toContain(report.bias);

    // Verify all 4 timeframes are analyzed
    expect(report.timeframes.m15).toBeDefined();
    expect(report.timeframes.m15.timeframe).toBe('15m');
    expect(['BULLISH', 'BEARISH', 'RANGING', 'BREAKOUT']).toContain(report.timeframes.m15.sentiment);
    expect(typeof report.timeframes.m15.rsi).toBe('number');

    expect(report.timeframes.h4).toBeDefined();
    expect(report.timeframes.h4.timeframe).toBe('4h');
    expect(['BULLISH', 'BEARISH', 'RANGING', 'BREAKOUT']).toContain(report.timeframes.h4.sentiment);

    expect(report.timeframes.d1).toBeDefined();
    expect(report.timeframes.d1.timeframe).toBe('1D');
    expect(['BULLISH', 'BEARISH', 'RANGING', 'BREAKOUT']).toContain(report.timeframes.d1.sentiment);

    expect(report.timeframes.w1).toBeDefined();
    expect(report.timeframes.w1.timeframe).toBe('1W');
    expect(['BULLISH', 'BEARISH', 'RANGING', 'BREAKOUT']).toContain(report.timeframes.w1.sentiment);

    // Verify Key Support / Resistance & Tactical Blueprint
    expect(report.keyLevels).toBeDefined();
    expect(report.keyLevels.pivot).toBeGreaterThan(0);
    expect(report.keyLevels.r1).toBeGreaterThanOrEqual(report.keyLevels.pivot);
    expect(report.keyLevels.r2).toBeGreaterThanOrEqual(report.keyLevels.r1);
    expect(report.keyLevels.s1).toBeLessThanOrEqual(report.keyLevels.pivot);
    expect(report.keyLevels.s2).toBeLessThanOrEqual(report.keyLevels.s1);

    expect(report.keyLevels.entryZone.length).toBe(2);
    expect(report.keyLevels.stopLoss).toBeGreaterThan(0);
    expect(report.keyLevels.tp2).toBeGreaterThan(0);

    // Verify narrative and catalysts
    expect(report.summary.length).toBeGreaterThan(20);
    expect(report.tacticalPlan.length).toBeGreaterThan(20);
    expect(report.riskToRewardRatio).toMatch(/1 : \d/);
    expect(report.catalystsAndRisks.length).toBeGreaterThan(0);
  });

  it('caches analysis report on subsequent calls unless forceRefresh is set', async () => {
    const rep1 = await analyzer.analyzeSymbol('EURUSD', false);
    const rep2 = await analyzer.analyzeSymbol('EURUSD', false);

    expect(rep1.timestamp).toBe(rep2.timestamp);
  });
});
