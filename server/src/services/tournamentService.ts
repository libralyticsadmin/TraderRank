/**
 * TraderRank Tournament Service
 * Compliant with PRD v2 §2 Pillar 2 (Prop-Style Tournaments & Weekly Sprints)
 */

import {
  Tournament,
  TournamentStanding,
  Broker,
  CanonicalTrade,
} from '../../../shared/src/types.js';
import { RiskGovernor } from './riskGovernor.js';
import { r2Storage } from './r2StorageService.js';

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

  private static readonly STATE_R2_KEY = 'tournaments/state.json';

  private constructor() {
    this.riskGovernor = RiskGovernor.getInstance();
    this.initializeDefaultTournaments();
    this.loadStateFromR2().catch(() => {});
  }

  private async loadStateFromR2(): Promise<void> {
    try {
      const saved = await r2Storage.getJson<Record<string, { standings: TournamentStanding[]; status?: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' }>>(
        TournamentService.STATE_R2_KEY
      );
      if (!saved || typeof saved !== 'object') return;
      for (const [tournId, state] of Object.entries(saved)) {
        const t = this.tournaments.get(tournId);
        if (!t || !state || !Array.isArray(state.standings)) continue;
        const cleanStandings = state.standings.filter(
          s => s && s.userId && s.userId !== 'u_homiesplant_th' && s.userId !== 'usr_meta_72423906'
        );
        t.standings = cleanStandings.map((s, idx) => ({ ...s, rank: idx + 1 }));
        t.participantCount = t.standings.length;
        const minReq = t.minParticipantsToStart ?? 50;
        t.status = t.participantCount >= minReq ? 'ACTIVE' : (state.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING');
      }
    } catch (err) {
      console.warn('[TournamentService] Could not load persisted tournament state:', err);
    }
  }

  private persistStateToR2(): void {
    const payload: Record<string, { standings: TournamentStanding[]; status: string }> = {};
    for (const [id, t] of this.tournaments.entries()) {
      payload[id] = { standings: t.standings, status: t.status };
    }
    r2Storage
      .uploadJson(TournamentService.STATE_R2_KEY, payload, { 'x-traderrank-type': 'tournament_state' })
      .catch(() => {});
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
      prizePoolPips: 1000,
      prizeDetails: '$1,000 Cash Prize Pool + Pro Verified Crest',
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
      prizePoolPips: 2500,
      prizeDetails: '$2,500 Cash Prize Pool + TraderRank Hall of Fame Induction',
      minTradesRequired: 15,
      maxDailyLossPercent: 5.0,
      maxDrawdownPercent: 10.0,
      participantCount: 0,
      minParticipantsToStart: 50,
      standings: [],
    };

    // Global Gold Rush Sprint (XAUUSD Special)
    const goldRushEndDate = new Date(now);
    goldRushEndDate.setDate(goldRushEndDate.getDate() + 5);

    const goldRush: Tournament = {
      id: 'tourney_gold_rush',
      title: 'Global Gold Rush Invitational',
      description: 'Dedicated high-volatility sprint for Gold (XAUUSD) traders across verified broker feeds. Strict 4.5% daily loss limit applies.',
      type: 'WEEKLY_SPRINT',
      status: 'UPCOMING',
      startDate: now.toISOString(),
      endDate: goldRushEndDate.toISOString(),
      prizePoolPips: 1500,
      prizeDetails: '$1,500 Cash Prize Pool + Gold Rush Trophy Crest',
      minTradesRequired: 8,
      maxDailyLossPercent: 4.5,
      maxDrawdownPercent: 9.0,
      participantCount: 0,
      minParticipantsToStart: 50,
      standings: [],
    };

    // Tokyo / London Overlap Daily Blitz
    const dailyBlitzEndDate = new Date(now);
    dailyBlitzEndDate.setHours(dailyBlitzEndDate.getHours() + 18);

    const dailyBlitz: Tournament = {
      id: 'tourney_daily_rush',
      title: 'Tokyo / London Overlap Daily Blitz',
      description: 'Ultra-fast intraday liquidity sprint during the Tokyo/London market open. Maximum 3% daily loss limit applies.',
      type: 'DAILY_BLITZ',
      status: 'UPCOMING',
      startDate: now.toISOString(),
      endDate: dailyBlitzEndDate.toISOString(),
      prizePoolPips: 500,
      prizeDetails: '$500 Cash Prize Pool + 500 XP Boost',
      minTradesRequired: 3,
      maxDailyLossPercent: 3.0,
      maxDrawdownPercent: 6.0,
      participantCount: 0,
      minParticipantsToStart: 50,
      standings: [],
    };

    this.tournaments.set(weeklyBlitz.id, weeklyBlitz);
    this.tournaments.set(monthlyChallenge.id, monthlyChallenge);
    this.tournaments.set(goldRush.id, goldRush);
    this.tournaments.set(dailyBlitz.id, dailyBlitz);
  }

  public resetAll(): void {
    this.tournaments.clear();
    this.initializeDefaultTournaments();
    this.persistStateToR2();
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
    if (tournament.status === 'COMPLETED') {
      return { success: false, error: 'Tournament has already completed and is closed to new entries' };
    }
    const endMs = tournament.endDate ? Date.parse(tournament.endDate) : NaN;
    if (Number.isFinite(endMs) && Date.now() > endMs) {
      return { success: false, error: 'Tournament has ended and is closed to new entries' };
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
    // Scale prize pool dynamically from $500 (at 50 players) up to $2,500 max
    tournament.prizePoolPips = Math.min(2500, 500 + Math.max(0, tournament.participantCount - minRequired) * 10);

    this.persistStateToR2();

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
    standing.isEligibleForPrize =
      tournament.status === 'ACTIVE' &&
      !risk.isDisqualified &&
      params.tradesCount >= tournament.minTradesRequired;

    // Recalculate ranks based on TraderScore descending
    tournament.standings.sort((a, b) => {
      if (a.isDisqualified && !b.isDisqualified) return 1;
      if (!a.isDisqualified && b.isDisqualified) return -1;
      return b.traderScore - a.traderScore;
    });

    tournament.standings.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    this.persistStateToR2();

    return standing;
  }

  /**
   * Syncs verified trades & floating/equity metrics ONLY for tournaments the user has joined.
   * Keeps UPCOMING tournaments at 0 until ACTIVE, and filters trades strictly to [startDate, endDate].
   */
  public syncUserTradesAcrossJoinedTournaments(params: {
    userId: string;
    trades: CanonicalTrade[];
    floatingPips: number;
    startingEquity: number;
    highWaterMarkEquity: number;
    currentEquity: number;
  }): void {
    for (const tournament of this.tournaments.values()) {
      const isJoined = tournament.standings.some(s => s.userId === params.userId);
      if (!isJoined) continue;

      if (tournament.status !== 'ACTIVE') {
        this.updateTraderTournamentStats({
          tournamentId: tournament.id,
          userId: params.userId,
          closedPips: 0,
          floatingPips: 0,
          tradesCount: 0,
          winRate: 0,
          startingEquity: params.startingEquity,
          highWaterMarkEquity: params.highWaterMarkEquity,
          currentEquity: params.currentEquity,
        });
        continue;
      }

      const startMs = new Date(tournament.startDate).getTime();
      const endMs = new Date(tournament.endDate).getTime();
      const windowTrades = params.trades.filter(tr => {
        const ts = new Date(tr.closeTime || tr.openTime || 0).getTime();
        return Number.isFinite(ts) && ts >= startMs && ts <= endMs;
      });

      const wins = windowTrades.filter(t => t.pnlCurrency > 0 || (t.pnlCurrency === 0 && (t.pnlPips ?? 0) > 0)).length;
      const closedPips = windowTrades.reduce((sum, t) => sum + (t.pnlPips ?? 0), 0);
      const winRate = windowTrades.length > 0 ? Math.round((wins / windowTrades.length) * 100) : 0;

      this.updateTraderTournamentStats({
        tournamentId: tournament.id,
        userId: params.userId,
        closedPips: Number(closedPips.toFixed(1)),
        floatingPips: Number(params.floatingPips.toFixed(1)),
        tradesCount: windowTrades.length,
        winRate,
        startingEquity: params.startingEquity,
        highWaterMarkEquity: params.highWaterMarkEquity,
        currentEquity: params.currentEquity,
      });
    }
  }
}
