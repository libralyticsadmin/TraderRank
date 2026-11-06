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
  });

  // =========================================================================
  // 2. Tiering & Subscription Registration System
  // =========================================================================
  describe('2. Tiering & Subscription Registration System', () => {
    it('GET /api/subscription/plans returns official Pro and Annual tier specifications', async () => {
      const res = await fetch(`${baseUrl}/api/subscription/plans`);
      expect(res.status).toBe(200);
      const plans = await res.json();

      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThanOrEqual(2);

      const proMonthly = plans.find((p: any) => p.id === 'PRO_MONTHLY');
      expect(proMonthly).toBeDefined();
      expect(proMonthly.price).toBe(9);
      expect(proMonthly.features.length).toBeGreaterThan(4);

      const proAnnual = plans.find((p: any) => p.id === 'PRO_ANNUAL');
      expect(proAnnual).toBeDefined();
      expect(proAnnual.price).toBe(79);
    });

    it('GET /api/subscription/status returns default FREE tier for new users', async () => {
      const res = await fetch(`${baseUrl}/api/subscription/status?userId=u_brand_new_trader`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.subscription.tier).toBe('FREE');
      expect(data.subscription.isActive).toBe(false);
    });

    it('POST /api/subscription/subscribe registers a user for PRO_MONTHLY tier with Card', async () => {
      const res = await fetch(`${baseUrl}/api/subscription/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u_alex_vanguard',
          tier: 'PRO_MONTHLY',
          paymentMethod: 'Card •••• 4242',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.subscription.isActive).toBe(true);
      expect(data.subscription.tier).toBe('PRO_MONTHLY');
      expect(data.subscription.priceMonthly).toBe(9.00);
      expect(data.subscription.paymentMethod).toContain('4242');

      // Verify status query reflects updated tier
      const statusRes = await fetch(`${baseUrl}/api/subscription/status?userId=u_alex_vanguard`);
      const statusData = await statusRes.json();
      expect(statusData.subscription.tier).toBe('PRO_MONTHLY');
      expect(statusData.subscription.isActive).toBe(true);
    });

    it('POST /api/subscription/subscribe registers a user for PRO_ANNUAL tier with Crypto', async () => {
      const res = await fetch(`${baseUrl}/api/subscription/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u_institutional_whale',
          tier: 'PRO_ANNUAL',
          paymentMethod: 'Crypto (USDT_TRC20)',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.subscription.tier).toBe('PRO_ANNUAL');
      expect(data.subscription.priceMonthly).toBe(6.58);
      expect(data.subscription.planName).toBe('Pro Annual All-Access');
    });

    it('POST /api/subscription/subscribe registers INSTITUTIONAL VIP tier', async () => {
      const res = await fetch(`${baseUrl}/api/subscription/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u_fund_manager_hedge',
          tier: 'INSTITUTIONAL',
          paymentMethod: 'Wire Transfer / USDT',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.subscription.tier).toBe('INSTITUTIONAL');
      expect(data.subscription.priceMonthly).toBe(49.00);
    });
  });
});
