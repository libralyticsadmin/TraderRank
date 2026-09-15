/**
 * TraderRank Risk Governor
 * Compliant with PRD v2 §2 Pillar 3 (Institutional Risk Controls & Anti-Gambling Rules)
 */

import { RiskEvaluation } from '../../../shared/src/types.js';

export class RiskGovernor {
  private static instance: RiskGovernor;

  public static readonly MAX_DAILY_LOSS_PERCENT = 5.0; // 5% max daily loss limit
  public static readonly MAX_TRAILING_DRAWDOWN_PERCENT = 10.0; // 10% max trailing drawdown

  public static getInstance(): RiskGovernor {
    if (!RiskGovernor.instance) {
      RiskGovernor.instance = new RiskGovernor();
    }
    return RiskGovernor.instance;
  }

  /**
   * Evaluate trader risk metrics against institutional prop-firm thresholds.
   */
  public evaluateRisk(params: {
    userId: string;
    accountId: string;
    startingDayEquity: number;
    highWaterMarkEquity: number;
    currentEquity: number;
  }): RiskEvaluation {
    const { userId, accountId, startingDayEquity, highWaterMarkEquity, currentEquity } = params;

    // Daily loss % = ((starting - current) / starting) * 100 if current < starting
    const dailyLossDiff = startingDayEquity - currentEquity;
    const dailyLossPercent = dailyLossDiff > 0 && startingDayEquity > 0
      ? Number(((dailyLossDiff / startingDayEquity) * 100).toFixed(2))
      : 0;

    // Trailing drawdown % = ((highWaterMark - current) / highWaterMark) * 100
    const trailingDiff = highWaterMarkEquity - currentEquity;
    const trailingDrawdownPercent = trailingDiff > 0 && highWaterMarkEquity > 0
      ? Number(((trailingDiff / highWaterMarkEquity) * 100).toFixed(2))
      : 0;

    const isDailyLossBreached = dailyLossPercent >= RiskGovernor.MAX_DAILY_LOSS_PERCENT;
    const isTrailingDrawdownBreached = trailingDrawdownPercent >= RiskGovernor.MAX_TRAILING_DRAWDOWN_PERCENT;

    let isDisqualified = false;
    let disqualificationReason: string | undefined = undefined;

    if (isDailyLossBreached) {
      isDisqualified = true;
      disqualificationReason = `Max Daily Loss limit breached (${dailyLossPercent}% >= ${RiskGovernor.MAX_DAILY_LOSS_PERCENT}%)`;
    } else if (isTrailingDrawdownBreached) {
      isDisqualified = true;
      disqualificationReason = `Max Trailing Drawdown breached (${trailingDrawdownPercent}% >= ${RiskGovernor.MAX_TRAILING_DRAWDOWN_PERCENT}%)`;
    }

    // Discipline Multiplier:
    // < 2% drawdown: 1.20x bonus for exceptional risk control
    // < 5% drawdown: 1.05x bonus
    // 5% - 10%: 0.90x penalty
    // Disqualified: 0.0x
    let disciplineMultiplier = 1.0;
    if (isDisqualified) {
      disciplineMultiplier = 0.0;
    } else if (trailingDrawdownPercent <= 2.0) {
      disciplineMultiplier = 1.2;
    } else if (trailingDrawdownPercent <= 5.0) {
      disciplineMultiplier = 1.05;
    } else {
      disciplineMultiplier = 0.9;
    }

    return {
      userId,
      accountId,
      startingDayEquity,
      highWaterMarkEquity,
      currentEquity,
      dailyLossPercent,
      trailingDrawdownPercent,
      isDailyLossBreached,
      isTrailingDrawdownBreached,
      isDisqualified,
      disqualificationReason,
      disciplineMultiplier,
    };
  }

  /**
   * Calculate Multi-Factor TraderScore per PRD v2:
   * TraderScore = Net Normalized Pips * (1 + WinRate/100) * Discipline Multiplier
   */
  public calculateTraderScore(
    netPips: number,
    winRate: number,
    disciplineMultiplier: number,
    isDisqualified: boolean
  ): number {
    if (isDisqualified || netPips <= 0) {
      return 0;
    }
    const score = netPips * (1 + winRate / 100) * disciplineMultiplier;
    return Number(score.toFixed(1));
  }
}
