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
      description: '5-day institutional endurance sprint across XM, Axiory, Exness, and Vantage. Max 5% daily loss limit applies. Unlocks when 50 traders register.',
      type: 'WEEKLY_SPRINT',
      status: 'UPCOMING',
      startDate: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      endDate: weeklyEndDate.toISOString(),
      prizePoolPips: 2500,
      prizeDetails: '$100,000 Funded Account Challenge + Pro Verified Crest',
      minTradesRequired: 5,
      maxDailyLossPercent: 5.0,
      maxDrawdownPercent: 10.0,
      participantCount: 0,
      minParticipantsToStart: 50,
      standings: [],
    };

    // Monthly Prop Challenge
    const monthlyEndDate = new Date(now);
    monthlyEndDate.setDate(monthlyEndDate.getDate() + 24);

    const monthlyChallenge: Tournament = {
      id: 'tourn_monthly_prop_01',
      title: 'Monthly Prop Endurance Gauntlet',
      description: '30-day institutional consistency trial. Strict trailing 10% drawdown enforcement and minimum 15 trades requirement. Unlocks when 50 traders register.',
      type: 'MONTHLY_PROP',
      status: 'UPCOMING',
      startDate: new Date(now.getTime() - 6 * 24 * 3600 * 1000).toISOString(),
      endDate: monthlyEndDate.toISOString(),
      prizePoolPips: 10000,
      prizeDetails: '$250,000 Master Tier Allocation + TraderRank Hall of Fame induction',
      minTradesRequired: 15,
      maxDailyLossPercent: 5.0,
      maxDrawdownPercent: 10.0,
      participantCount: 0,
      minParticipantsToStart: 50,
      standings: [],
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

  public isTournamentOpen(id: string): boolean {
    const t = this.tournaments.get(id);
    return t ? t.status === 'ACTIVE' : false;
  }

  public joinTournament(params: {
    tournamentId: string;
    userId: string;
    username: string;
    avatarSymbol: string;
    broker: Broker;
  }): {
    success: boolean;
    error?: string;
    standing?: TournamentStanding;
    status?: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
    participantCount?: number;
    minParticipantsToStart?: number;
    remainingToOpen?: number;
  } {
    const tournament = this.tournaments.get(params.tournamentId);
    if (!tournament) {
      return { success: false, error: 'Tournament not found' };
    }

    const minRequired = tournament.minParticipantsToStart ?? 50;

    const existing = tournament.standings.find(s => s.userId === params.userId);
    if (existing) {
      return {
        success: true,
        standing: existing,
        status: tournament.status,
        participantCount: tournament.participantCount,
        minParticipantsToStart: minRequired,
        remainingToOpen: Math.max(0, minRequired - tournament.participantCount),
      };
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

    // Automatically transition to ACTIVE when 50 participants threshold is reached
    if (tournament.participantCount >= minRequired) {
      tournament.status = 'ACTIVE';
    } else {
      tournament.status = 'UPCOMING';
    }

    return {
      success: true,
      standing: newStanding,
      status: tournament.status,
      participantCount: tournament.participantCount,
      minParticipantsToStart: minRequired,
      remainingToOpen: Math.max(0, minRequired - tournament.participantCount),
    };
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
