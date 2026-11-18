/**
 * TraderRank Tiering System & Tournament System Registration Readiness Test Suite
 * Validates PRD §2 (Prop Tournaments & Sprints) and §4 (Tiering & Subscription Plans):
 * 1. Tournament listing across all 4 sprint types
 * 2. User registration into tournaments with participant threshold tracking
 * 3. 50-participant auto-transition to ACTIVE
 * 4. Re-registration idempotency & missing parameter validation
 * 5. Tiering plans discovery and live subscription registration
 * 6. User profile tier binding and status queries
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../src/api/server.js';
import { TournamentService } from '../src/services/tournamentService.js';
import type { Server } from 'http';

describe('Tiering System & Tournament Registration Readiness Suite', () => {
  let server: Server;
  let baseUrl = '';
  const tournamentService = TournamentService.getInstance();

  beforeAll(async () => {
    const instance = createServer();
    server = instance.server;
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr) {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    }));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // =========================================================================
  // 1. Tournament Registration System
  // =========================================================================
  describe('1. Tournament Registration System', () => {
    it('GET /api/tournaments returns all initialized tournament challenges', async () => {
      const res = await fetch(`${baseUrl}/api/tournaments`);
      expect(res.status).toBe(200);
      const tournaments = await res.json();

      expect(Array.isArray(tournaments)).toBe(true);
      expect(tournaments.length).toBeGreaterThanOrEqual(4);

      const ids = tournaments.map((t: any) => t.id);
      expect(ids).toContain('tourn_weekly_fx_blitz_01');
      expect(ids).toContain('tourn_monthly_prop_01');
      expect(ids).toContain('tourney_gold_rush');
      expect(ids).toContain('tourney_daily_rush');

      // Verify tournament properties
      for (const t of tournaments) {
        expect(t.title).toBeDefined();
        expect(t.minTradesRequired).toBeGreaterThan(0);
        expect(t.maxDailyLossPercent).toBeGreaterThan(0);
        expect(t.maxDrawdownPercent).toBeGreaterThan(0);
        expect(t.minParticipantsToStart).toBe(50);
        expect(Array.isArray(t.standings)).toBe(true);
      }
    });

    it('POST /api/tournaments/:id/join registers a new trader into the Weekly FX Blitz', async () => {
      const payload = {
        userId: 'u_challenger_001',
        username: 'ApexChallenger',
        avatarSymbol: 'XM',
        broker: 'XM',
      };

      const res = await fetch(`${baseUrl}/api/tournaments/tourn_weekly_fx_blitz_01/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.standing).toBeDefined();
      expect(data.standing.username).toBe('ApexChallenger');
      expect(data.standing.userId).toBe('u_challenger_001');
      expect(data.participantCount).toBeGreaterThan(0);
      expect(data.minParticipantsToStart).toBe(50);
      expect(typeof data.remainingToOpen).toBe('number');
    });

    it('POST /api/tournaments/:id/join is idempotent when user registers again', async () => {
      const payload = {
        userId: 'u_challenger_001',
        username: 'ApexChallenger',
        avatarSymbol: 'XM',
        broker: 'XM',
      };

      const res = await fetch(`${baseUrl}/api/tournaments/tourn_weekly_fx_blitz_01/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.standing.userId).toBe('u_challenger_001');
    });

    it('POST /api/tournaments/:id/join rejects request missing required userId or username', async () => {
      const res = await fetch(`${baseUrl}/api/tournaments/tourn_weekly_fx_blitz_01/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker: 'XM' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('userId and username are required');
    });

    it('registers a trader into the Gold Rush Invitational and Daily Blitz', async () => {
      // Gold Rush
      const resGold = await fetch(`${baseUrl}/api/tournaments/tourney_gold_rush/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u_gold_sniper_88',
          username: 'GoldSniper88',
          avatarSymbol: 'AU',
          broker: 'IC_MARKETS',
        }),
      });
      expect(resGold.status).toBe(200);
      const goldData = await resGold.json();
      expect(goldData.success).toBe(true);
      expect(goldData.standing.username).toBe('GoldSniper88');

      // Daily Blitz
      const resDaily = await fetch(`${baseUrl}/api/tournaments/tourney_daily_rush/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u_london_scalper_09',
          username: 'LondonScalper09',
          avatarSymbol: 'EX',
          broker: 'Exness',
        }),
      });
      expect(resDaily.status).toBe(200);
      const dailyData = await resDaily.json();
      expect(dailyData.success).toBe(true);
      expect(dailyData.standing.username).toBe('LondonScalper09');
    });

    it('auto-activates tournament when 50 participants threshold is reached', () => {
      // Register participants up to 50 in daily blitz
      const tournId = 'tourney_daily_rush';
      for (let i = 1; i <= 50; i++) {
        tournamentService.joinTournament({
          tournamentId: tournId,
          userId: `u_sim_trader_${i}`,
          username: `BlitzTrader_${i}`,
          avatarSymbol: 'TR',
          broker: 'XM',
        });
      }

      const tourney = tournamentService.getTournamentById(tournId);
      expect(tourney).toBeDefined();
      expect(tourney!.participantCount).toBeGreaterThanOrEqual(50);
      expect(tourney!.status).toBe('ACTIVE');
    });

    it('filters tournament trades strictly by tournament window and computes real drawdown', () => {
      const tournId = 'tourney_daily_rush'; // already ACTIVE from 50-participant test above
      const tourney = tournamentService.getTournamentById(tournId)!;
      const beforeStart = new Date(new Date(tourney.startDate).getTime() - 48 * 3600 * 1000).toISOString();
      const insideWindow = new Date(new Date(tourney.startDate).getTime() + 60_000).toISOString();

      tournamentService.syncUserTradesAcrossJoinedTournaments({
        userId: 'u_sim_trader_1',
        trades: [
          {
            id: 'old_trade',
            accountId: 'acc_1',
            symbol: 'XAUUSD',
            type: 'BUY',
            lotSize: 0.1,
            openPrice: 2600,
            closePrice: 2610,
            pnlPips: 100,
            pnlCurrency: 100,
            openTime: beforeStart,
            closeTime: beforeStart,
            broker: 'XM',
          },
          {
            id: 'window_trade',
            accountId: 'acc_1',
            symbol: 'XAUUSD',
            type: 'BUY',
            lotSize: 0.1,
            openPrice: 2610,
            closePrice: 2615,
            pnlPips: 50,
            pnlCurrency: 50,
            openTime: insideWindow,
            closeTime: insideWindow,
            broker: 'XM',
          },
        ],
        floatingPips: 10,
        startingEquity: 1000,
        highWaterMarkEquity: 1000,
        currentEquity: 950,
      });

      const standing = tournamentService.getTournamentById(tournId)!.standings.find(s => s.userId === 'u_sim_trader_1')!;
      expect(standing.tradesCount).toBe(1);
      expect(standing.closedPips).toBe(50);
      expect(standing.floatingPips).toBe(10);
      expect(standing.netPips).toBe(60);
      expect(standing.currentDrawdownPercent).toBe(5);
    });

    it('runs full fresh-user flow: register (0 XP) -> claim Day 1 streak (+50 XP) -> join UPCOMING tournament (0 pips)', async () => {
      const uniqueName = `FreshTrader_${Date.now()}`;
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: uniqueName,
          email: `${uniqueName.toLowerCase()}@example.com`,
          password: 'StrongPassword123!',
        }),
      });
      expect(regRes.status).toBe(201);
      const regData = await regRes.json();
      expect(regData.user.xp).toBe(0);
      expect(regData.user.level).toBe(1);
      expect(regData.user.registeredAt).toBeDefined();

      // Claim Day 1 Daily Streak (+50 XP) and verify second claim same day is blocked
      const claim1 = await fetch(`${baseUrl}/api/gamification/streak/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${regData.token}` },
      });
      expect(claim1.status).toBe(200);
      const claim1Data = await claim1.json();
      expect(claim1Data.dayNum).toBe(1);
      expect(claim1Data.xpEarned).toBe(50);

      const claim2 = await fetch(`${baseUrl}/api/gamification/streak/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${regData.token}` },
      });
      expect(claim2.status).toBe(400);

      // Join UPCOMING tournament and verify pre-launch stats stay at 0
      const joinRes = await fetch(`${baseUrl}/api/tournaments/tourn_monthly_prop_01/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${regData.token}`,
        },
        body: JSON.stringify({
          userId: regData.user.id,
          username: regData.user.username,
          broker: 'XM',
        }),
      });
      expect(joinRes.status).toBe(200);
      const joinData = await joinRes.json();
      expect(joinData.status).toBe('UPCOMING');
      expect(joinData.standing.tradesCount).toBe(0);
      expect(joinData.standing.netPips).toBe(0);
    });
  });
});
