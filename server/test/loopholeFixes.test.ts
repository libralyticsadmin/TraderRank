import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AuthService } from '../src/services/authService.js';
import { createServer } from '../src/api/server.js';
import { TournamentService } from '../src/services/tournamentService.js';
import { getStreakStatus } from '../../shared/src/gamification.js';

describe('Security & Loophole Remediation Tests', () => {
  const auth = AuthService.getInstance();
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    await auth.loadCredentials();
    const appBundle = createServer();
    server = appBundle.server;
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('rejects invalid punctuation-only or too-short usernames on /api/auth/register', async () => {
    for (const badName of ['!!!', 'ab', 'a'.repeat(41), 'bad user']) {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: badName,
          email: `bad_${Date.now()}@example.com`,
          password: 'Password123!',
        }),
      });
      expect(res.status).toBe(400);
    }
  });

  it('prevents accountNumber hijacking via PUT /api/auth/profile and strips PII on unauthenticated GET /api/auth/profile', async () => {
    const uname = `secuser_${Date.now().toString(36)}`;
    const email = `${uname}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: uname,
        email,
        password: 'Password123!',
      }),
    });
    expect(regRes.status).toBe(201);
    const regData = (await regRes.json()) as any;
    const token = regData.token as string;
    const userId = regData.user.id as string;

    // Attempt to bind an arbitrary victim accountNumber via PUT /api/auth/profile
    const putRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: userId,
        accountNumber: '999888777',
        bio: 'Updated bio',
      }),
    });
    expect(putRes.status).toBe(200);
    const putData = (await putRes.json()) as any;
    expect(putData.user.accountNumber).toBeUndefined();
    expect(putData.user.bio).toBe('Updated bio');

    // Unauthenticated GET /api/auth/profile must strip email & accountNumber
    const pubRes = await fetch(`${baseUrl}/api/auth/profile?username=${encodeURIComponent(uname)}`);
    expect(pubRes.status).toBe(200);
    const pubData = (await pubRes.json()) as any;
    expect(pubData.user.username).toBe(uname);
    expect(pubData.user.email).toBeUndefined();
    expect(pubData.user.accountNumber).toBeUndefined();

    // Authenticated owner GET /api/auth/profile receives full profile including email
    const ownerRes = await fetch(`${baseUrl}/api/auth/profile?userId=${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(ownerRes.status).toBe(200);
    const ownerData = (await ownerRes.json()) as any;
    expect(ownerData.user.email).toBe(email);

    // Passwordless login must be rejected
    const noPwRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUser: uname }),
    });
    expect(noPwRes.status).toBe(400);
    const emptyPwRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUser: uname, password: '' }),
    });
    expect(emptyPwRes.status).toBe(400);
  });

  it('requires authentication in production on GET /api/accounts/:id/summary and POST /api/brokers/metaapi/sync/:id', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const summaryRes = await fetch(`${baseUrl}/api/accounts/acc_nonexistent/summary`);
      expect(summaryRes.status).toBe(401);

      const syncRes = await fetch(`${baseUrl}/api/brokers/metaapi/sync/acc_nonexistent`, {
        method: 'POST',
      });
      expect(syncRes.status).toBe(401);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('rejects connecting a broker account that already belongs to another user (409) but allows owner reconnect', async () => {
    const register = async (prefix: string) => {
      const name = `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
      const r = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, email: `${name}@example.com`, password: 'Password123!' }),
      });
      expect(r.status).toBe(201);
      const d = (await r.json()) as any;
      return { token: d.token as string, userId: d.user.id as string, username: name };
    };
    const connect = (u: { token: string; username: string }, login: string) =>
      fetch(`${baseUrl}/api/connector/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${u.token}` },
        body: JSON.stringify({
          username: u.username,
          broker: 'XM',
          credentials: {
            type: 'mt_gateway',
            broker: 'XM',
            platform: 'MT5',
            serverName: 'XMGlobal-Real 55',
            login,
            investorPassword: 'ReadOnlyPass123',
          },
        }),
      });

    const owner = await register('own');
    const attacker = await register('atk');
    const login = String(8000000 + Math.floor(Math.random() * 999999));

    expect((await connect(owner, login)).status).toBe(201);

    const hijack = await connect(attacker, login);
    expect(hijack.status).toBe(409);

    expect((await connect(owner, login)).status).toBe(201);
  });

  it('sanitizes custom-daily-analysis input and keeps ETHUSD 1W levels positive', async () => {
    const res = await fetch(`${baseUrl}/api/market/custom-daily-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: 'ETHUSD',
        timeframe: '1W',
        accountSize: -100,
      }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.symbol).toBe('ETHUSD');
    expect(data.tacticalLevels.stopLoss).toBeGreaterThan(0);
    expect(data.tacticalLevels.suggestedLotSize).toBeGreaterThanOrEqual(0.01);
  });

  it('rejects joining COMPLETED or expired tournaments without altering status or prize pool', () => {
    const svc = TournamentService.getInstance();
    const t = svc.getTournamentById('tourn_weekly_fx_blitz_01')!;
    const origStatus = t.status;
    const origEnd = t.endDate;
    const origPrize = t.prizePoolPips;

    try {
      t.status = 'COMPLETED';
      const completedRes = svc.joinTournament({
        tournamentId: t.id,
        userId: 'u_late_joiner_1',
        username: 'LateJoiner1',
        avatarSymbol: 'LJ',
        broker: 'XM',
      });
      expect(completedRes.success).toBe(false);
      expect(t.status).toBe('COMPLETED');
      expect(t.prizePoolPips).toBe(origPrize);

      t.status = 'ACTIVE';
      t.endDate = new Date(Date.now() - 3600_000).toISOString();
      const expiredRes = svc.joinTournament({
        tournamentId: t.id,
        userId: 'u_late_joiner_2',
        username: 'LateJoiner2',
        avatarSymbol: 'LJ',
        broker: 'XM',
      });
      expect(expiredRes.success).toBe(false);
    } finally {
      t.status = origStatus;
      t.endDate = origEnd;
      t.prizePoolPips = origPrize;
    }
  });

  it('sanitizes invalid broker and oversized avatarSymbol on POST /api/tournaments/:id/join', async () => {
    const name = `tournsec_${Date.now().toString(36)}`;
    const reg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, email: `${name}@example.com`, password: 'Password123!' }),
    });
    expect(reg.status).toBe(201);
    const { token, user } = (await reg.json()) as any;

    const joinRes = await fetch(`${baseUrl}/api/tournaments/tourn_weekly_fx_blitz_01/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        userId: user.id,
        username: name,
        broker: 'FAKE_SCAM_BROKER',
        avatarSymbol: '<script>alert(1)</script>'.repeat(5),
      }),
    });
    expect(joinRes.status).toBe(200);
    const joinData = (await joinRes.json()) as any;
    expect(joinData.standing.brokers).toEqual(['XM']);
    expect(joinData.standing.avatarSymbol).toMatch(/^[a-zA-Z0-9_-]{1,24}$/);
  });

  it('starts a new 7-day streak cycle on the day after Day 7 is claimed', () => {
    const allSeven = [1, 2, 3, 4, 5, 6, 7];
    // Same day: no day claimable
    const sameDay = getStreakStatus(allSeven, '2026-11-18', '2026-11-18');
    expect(sameDay.some(d => d.current)).toBe(false);
    expect(sameDay.every(d => d.claimed)).toBe(true);

    // Next calendar day: fresh cycle unlocks Day 1
    const nextDay = getStreakStatus(allSeven, '2026-11-18', '2026-11-19');
    expect(nextDay[0].dayNum).toBe(1);
    expect(nextDay[0].current).toBe(true);
    expect(nextDay[0].claimed).toBe(false);
    expect(nextDay.slice(1).every(d => d.locked)).toBe(true);
  });
});
