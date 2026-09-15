/**
 * TraderRank Tournament Service
 * Compliant with PRD v2 §2 Pillar 2 (Prop-Style Tournaments & Weekly Sprints)
 */

import {
  Tournament,
  TournamentStanding,
  Broker,
} from '../../../shared/src/types.js';
import { RiskGovernor } from './riskGovernor.js';

export class TournamentService {
  private static instance: TournamentService;
  private riskGovernor: RiskGovernor;
  private tournaments: Map<string, Tournament> = new Map();

  public static getInstance(): TournamentService {
    if (!TournamentService.instance) {
      TournamentService.instance = new TournamentService();
    }
    return TournamentService.instance;
  }

  private constructor() {
    this.riskGovernor = RiskGovernor.getInstance();
    this.initializeDefaultTournaments();
  }

  private initializeDefaultTournaments() {
    const now = new Date();
    
    // Weekly FX Blitz (5-day sprint)
    const weeklyEndDate = new Date(now);
    weeklyEndDate.setDate(weeklyEndDate.getDate() + 4);
    weeklyEndDate.setUTCHours(21, 0, 0, 0);

    const weeklyBlitz: Tournament = {
      id: 'tourn_weekly_fx_blitz_01',
      title: 'Weekly FX Blitz Sprint',
      description: '5-day institutional endurance sprint across XM, Axiory, Exness, and Vantage. Max 5% daily loss limit applies.',
      type: 'WEEKLY_SPRINT',
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      endDate: weeklyEndDate.toISOString(),
      prizePoolPips: 2500,
      prizeDetails: '$100,000 Funded Account Challenge + Pro Verified Crest',
      minTradesRequired: 5,
      maxDailyLossPercent: 5.0,
      maxDrawdownPercent: 10.0,
      participantCount: 4,
      standings: [
        {
          rank: 1,
          userId: 'usr_apex_01',
          username: 'ApexTrader_FX',
          avatarSymbol: 'AE',
          brokers: ['Exness', 'XM'],
          netPips: 97.5,
          closedPips: 85.4,
          floatingPips: 12.1,
          tradesCount: 8,
          winRate: 88,
          currentDrawdownPercent: 1.4,
          maxDrawdownReached: 1.8,
          traderScore: 219.8, // 97.5 * 1.88 * 1.2
          isDisqualified: false,
          isEligibleForPrize: true,
        },
        {
          rank: 2,
          userId: 'usr_tokyo_02',
          username: 'TokyoScalper',
          avatarSymbol: 'TC',
          brokers: ['XM'],
          netPips: 72.7,
          closedPips: 64.2,
          floatingPips: 8.5,
          tradesCount: 6,
          winRate: 83,
          currentDrawdownPercent: 2.6,
          maxDrawdownReached: 3.1,
          traderScore: 139.7, // 72.7 * 1.83 * 1.05
          isDisqualified: false,
          isEligibleForPrize: true,
        },
        {
          rank: 3,
          userId: 'usr_libra_03',
          username: 'Libralytic',
          avatarSymbol: 'L',
          brokers: ['Axiory', 'Exness'],
          netPips: 37.5,
          closedPips: 42.0,
          floatingPips: -4.5,
          tradesCount: 4,
          winRate: 75,
          currentDrawdownPercent: 3.8,
          maxDrawdownReached: 4.2,
          traderScore: 68.9, // 37.5 * 1.75 * 1.05
          isDisqualified: false,
          isEligibleForPrize: false, // Under 5 trades minimum
        },
        {
          rank: 4,
          userId: 'usr_quantum_04',
          username: 'QuantumPips',
          avatarSymbol: 'QP',
          brokers: ['Vantage'],
          netPips: 24.2,
          closedPips: 24.2,
          floatingPips: 0.0,
          tradesCount: 3,
          winRate: 67,
          currentDrawdownPercent: 4.9,
          maxDrawdownReached: 6.2,
          traderScore: 36.4,
          isDisqualified: false,
          isEligibleForPrize: false, // Under 5 trades
        }
      ],
    };

    // Monthly Prop Challenge
    const monthlyEndDate = new Date(now);
    monthlyEndDate.setDate(monthlyEndDate.getDate() + 24);

    const monthlyChallenge: Tournament = {
      id: 'tourn_monthly_prop_01',
      title: 'Monthly Prop Endurance Gauntlet',
      description: '30-day institutional consistency trial. Strict trailing 10% drawdown enforcement and minimum 15 trades requirement.',
      type: 'MONTHLY_PROP',
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 6 * 24 * 3600 * 1000).toISOString(),
      endDate: monthlyEndDate.toISOString(),
      prizePoolPips: 10000,
      prizeDetails: '$250,000 Master Tier Allocation + TraderRank Hall of Fame induction',
      minTradesRequired: 15,
      maxDailyLossPercent: 5.0,
      maxDrawdownPercent: 10.0,
      participantCount: 3,
      standings: [
        {
          rank: 1,
          userId: 'usr_tokyo_02',
          username: 'TokyoScalper',
          avatarSymbol: 'TC',
          brokers: ['XM'],
          netPips: 342.1,
          closedPips: 320.5,
          floatingPips: 21.6,
          tradesCount: 32,
          winRate: 79,
          currentDrawdownPercent: 3.2,
          maxDrawdownReached: 4.8,
          traderScore: 642.5,
          isDisqualified: false,
          isEligibleForPrize: true,
        },
        {
          rank: 2,
          userId: 'usr_apex_01',
          username: 'ApexTrader_FX',
          avatarSymbol: 'AE',
          brokers: ['Exness', 'XM'],
          netPips: 318.4,
          closedPips: 302.0,
          floatingPips: 16.4,
          tradesCount: 28,
          winRate: 82,
          currentDrawdownPercent: 2.1,
          maxDrawdownReached: 2.9,
          traderScore: 607.7,
          isDisqualified: false,
          isEligibleForPrize: true,
        },
        {
          rank: 3,
          userId: 'usr_libra_03',
          username: 'Libralytic',
          avatarSymbol: 'L',
          brokers: ['Axiory', 'Exness'],
          netPips: 184.6,
          closedPips: 172.0,
          floatingPips: 12.6,
          tradesCount: 19,
          winRate: 74,
          currentDrawdownPercent: 4.1,
          maxDrawdownReached: 5.4,
          traderScore: 288.7,
          isDisqualified: false,
          isEligibleForPrize: true,
        }
      ],
    };

    this.tournaments.set(weeklyBlitz.id, weeklyBlitz);
    this.tournaments.set(monthlyChallenge.id, monthlyChallenge);
  }

  public getTournaments(): Tournament[] {
    return Array.from(this.tournaments.values());
  }

  public getTournamentById(id: string): Tournament | null {
    return this.tournaments.get(id) || null;
  }

  public joinTournament(params: {
    tournamentId: string;
    userId: string;
    username: string;
    avatarSymbol: string;
    broker: Broker;
  }): { success: boolean; error?: string; standing?: TournamentStanding } {
    const tournament = this.tournaments.get(params.tournamentId);
    if (!tournament) {
      return { success: false, error: 'Tournament not found' };
    }

    const existing = tournament.standings.find(s => s.userId === params.userId);
    if (existing) {
      return { success: true, standing: existing };
    }

    const newStanding: TournamentStanding = {
      rank: tournament.standings.length + 1,
      userId: params.userId,
      username: params.username,
      avatarSymbol: params.avatarSymbol,
      brokers: [params.broker],
      netPips: 0.0,
      closedPips: 0.0,
      floatingPips: 0.0,
      tradesCount: 0,
      winRate: 0,
      currentDrawdownPercent: 0.0,
      maxDrawdownReached: 0.0,
      traderScore: 0.0,
      isDisqualified: false,
      isEligibleForPrize: false,
    };

    tournament.standings.push(newStanding);
    tournament.participantCount = tournament.standings.length;
    return { success: true, standing: newStanding };
  }

  public updateTraderTournamentStats(params: {
    tournamentId: string;
    userId: string;
    closedPips: number;
    floatingPips: number;
    tradesCount: number;
    winRate: number;
    startingEquity: number;
    highWaterMarkEquity: number;
    currentEquity: number;
  }): TournamentStanding | null {
    const tournament = this.tournaments.get(params.tournamentId);
    if (!tournament) return null;

    const standing = tournament.standings.find(s => s.userId === params.userId);
    if (!standing) return null;

    // Evaluate risk controls
    const risk = this.riskGovernor.evaluateRisk({
      userId: params.userId,
      accountId: 'tournament_account',
      startingDayEquity: params.startingEquity,
      highWaterMarkEquity: params.highWaterMarkEquity,
      currentEquity: params.currentEquity,
    });

    const netPips = Number((params.closedPips + params.floatingPips).toFixed(1));
    const traderScore = this.riskGovernor.calculateTraderScore(
      netPips,
      params.winRate,
      risk.disciplineMultiplier,
      risk.isDisqualified
    );

    standing.closedPips = params.closedPips;
    standing.floatingPips = params.floatingPips;
    standing.netPips = netPips;
    standing.tradesCount = params.tradesCount;
    standing.winRate = params.winRate;
    standing.currentDrawdownPercent = risk.trailingDrawdownPercent;
    standing.maxDrawdownReached = Math.max(standing.maxDrawdownReached, risk.trailingDrawdownPercent);
    standing.isDisqualified = risk.isDisqualified;
    standing.disqualificationReason = risk.disqualificationReason;
    standing.traderScore = traderScore;
    standing.isEligibleForPrize = !risk.isDisqualified && params.tradesCount >= tournament.minTradesRequired;

    // Recalculate ranks based on TraderScore descending
    tournament.standings.sort((a, b) => {
      if (a.isDisqualified && !b.isDisqualified) return 1;
      if (!a.isDisqualified && b.isDisqualified) return -1;
      return b.traderScore - a.traderScore;
    });

    tournament.standings.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    return standing;
  }
}
