import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AuthService } from '../src/services/authService.js';
import { createServer } from '../src/api/server.js';

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
});
