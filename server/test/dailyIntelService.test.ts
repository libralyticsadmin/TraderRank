import { describe, it, expect } from 'vitest';
import { DailyIntelService } from '../src/market/dailyIntelService.js';

describe('DailyIntelService - Daily Trading Intelligence & Custom Strategy Plans', () => {
  const service = DailyIntelService.getInstance();

  it('should return subscription plan options with the $9/mo Pro tier', () => {
    const plans = service.getSubscriptionPlans();
    expect(plans).toBeInstanceOf(Array);
    expect(plans.length).toBeGreaterThanOrEqual(2);

    const monthlyPlan = plans.find(p => p.id === 'PRO_MONTHLY');
    expect(monthlyPlan).toBeDefined();
    expect(monthlyPlan?.price).toBe(9);
    expect(monthlyPlan?.period).toBe('month');
    expect(monthlyPlan?.features.length).toBeGreaterThan(3);
  });

  it('should generate a comprehensive daily market intelligence report', async () => {
    const report = await service.getDailyReport('2026-10-06', true);
    expect(report).toBeDefined();
    expect(report.date).toBe('2026-10-06');
    expect(report.headline).toBeTruthy();
    expect(report.marketRegime).toBeTruthy();
    expect(report.macroSentimentScore).toBeGreaterThanOrEqual(0);
    expect(report.macroSentimentScore).toBeLessThanOrEqual(100);

    // Executive summary checks
    expect(report.executiveSummary.technicalHighlights.length).toBeGreaterThan(0);
    expect(report.executiveSummary.fundamentalThemes.length).toBeGreaterThan(0);
    expect(report.executiveSummary.riskWarnings.length).toBeGreaterThan(0);

    // ForexFactory digest checks
    expect(report.forexFactoryDigest).toBeDefined();
    expect(report.forexFactoryDigest.todayEvents).toBeInstanceOf(Array);

    // Major asset breakdown checks
    expect(report.assetAnalyses.length).toBeGreaterThanOrEqual(4);
    const goldAnalysis = report.assetAnalyses.find(a => a.symbol === 'XAUUSD');
    expect(goldAnalysis).toBeDefined();
    expect(goldAnalysis?.bias).toBe('STRONG_BULLISH');
    expect(goldAnalysis?.currentPrice).toBeGreaterThan(3000);
    expect(goldAnalysis?.orderBlocks.demandZone.length).toBe(2);
    expect(goldAnalysis?.supportResistance.pivot).toBeGreaterThan(0);
  });

  it('should generate custom 1m scalping strategy on XAUUSD', () => {
    const output = service.generateCustomStrategy({
      symbol: 'XAUUSD',
      timeframe: '1m',
      tradingStyle: 'SCALPER',
      strategyModel: 'SMC_ORDER_BLOCK',
      riskTolerance: 'AGGRESSIVE',
      sessionFocus: 'NEW_YORK',
      accountSize: 25000,
    });

    expect(output).toBeDefined();
    expect(output.symbol).toBe('XAUUSD');
    expect(output.timeframe).toBe('1m');
    expect(output.tradingStyle).toBe('SCALPER');
    expect(output.strategyModel).toBe('SMC_ORDER_BLOCK');
    expect(output.bias).toBeTruthy();
    expect(output.tacticalLevels.entryZone[0]).toBeLessThanOrEqual(output.tacticalLevels.entryZone[1]);
    expect(output.tacticalLevels.stopLoss).toBeGreaterThan(0);
    expect(output.tacticalLevels.takeProfit1).toBeGreaterThan(0);
    expect(output.tacticalLevels.suggestedLotSize).toBeGreaterThan(0);
    expect(output.checklist.length).toBeGreaterThanOrEqual(4);
  });

  it('should generate custom 15m intraday trend-following strategy on EURUSD with 1:3 RR', () => {
    const output = service.generateCustomStrategy({
      symbol: 'EURUSD',
      timeframe: '15m',
      tradingStyle: 'INTRADAY',
      strategyModel: 'TREND_FOLLOWING',
      riskTolerance: 'RR_1_3',
      sessionFocus: 'LONDON',
      accountSize: 10000,
    });

    expect(output.symbol).toBe('EURUSD');
    expect(output.timeframe).toBe('15m');
    expect(output.tacticalLevels.riskRewardRatio).toContain('1:3');
    expect(output.tradeQualification).toBeDefined();
    expect(output.tradeQualification.canEnter).toBe(true);
    expect(output.tradeQualification.targetRR).toBe('1:3');
    expect(output.tacticalLevels.takeProfit1).toBeGreaterThan(output.tacticalLevels.stopLoss);
    expect(output.tacticalLevels.takeProfit2).toBeGreaterThan(output.tacticalLevels.takeProfit1);
    expect(output.tacticalLevels.takeProfit3).toBeGreaterThan(output.tacticalLevels.takeProfit2);
    expect(output.strategyNarrative.marketStructureContext).toContain('EMA');
  });

  it('should generate custom 4H swing strategy on BTCUSD with 1:7 RR', () => {
    const output = service.generateCustomStrategy({
      symbol: 'BTCUSD',
      timeframe: '4H',
      tradingStyle: 'SWING',
      strategyModel: 'BREAKOUT_MOMENTUM',
      riskTolerance: 'RR_1_7',
      sessionFocus: 'ALL_SESSIONS',
      accountSize: 50000,
    });

    expect(output.symbol).toBe('BTCUSD');
    expect(output.timeframe).toBe('4H');
    expect(output.tacticalLevels.currentPrice).toBeGreaterThan(50000);
    expect(output.confluenceScore).toBeGreaterThanOrEqual(80);
    expect(output.tradeQualification.targetRR).toBe('1:7');
    expect(output.tacticalLevels.riskRewardRatio).toContain('1:7');
  });

  it('should generate custom 1H strategy on MCL1! (Micro WTI Crude Oil) with 1:5 RR', () => {
    const output = service.generateCustomStrategy({
      symbol: 'MCL1!',
      timeframe: '1H',
      tradingStyle: 'INTRADAY',
      strategyModel: 'SMC_ORDER_BLOCK',
      riskTolerance: 'RR_1_5',
      sessionFocus: 'NEW_YORK',
      accountSize: 20000,
    });

    expect(output.symbol).toBe('MCL1!');
    expect(output.timeframe).toBe('1H');
    expect(output.tacticalLevels.currentPrice).toBeGreaterThan(50);
    expect(output.tacticalLevels.currentPrice).toBeLessThan(120);
    expect(output.tacticalLevels.entryZone[0]).toBeLessThanOrEqual(output.tacticalLevels.entryZone[1]);
    expect(output.tacticalLevels.suggestedLotSize).toBeGreaterThan(0);
    expect(output.tradeQualification.targetRR).toBe('1:5');
    expect(output.tradeQualification.directive).toContain('TRADE SETUP QUALIFIED');
  });
});
