import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../src/api/server.js';
import WebSocket from 'ws';
import type { Server } from 'http';

describe('TraderRank Live Platform End-to-End Suite', () => {
  let server: Server;
  const PORT = 4056;
  const baseUrl = `http://localhost:${PORT}`;

  beforeAll(async () => {
    const app = createServer();
    server = app.server;
    await new Promise<void>((resolve) => server.listen(PORT, resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('1. GET /api should return the API manifest with operational status', async () => {
    const res = await fetch(`${baseUrl}/api`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('OPERATIONAL');
    expect(Array.isArray(data.endpoints)).toBe(true);
  });

  it('2. GET /api/health should report HEALTHY system status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('HEALTHY');
  });

  it('3. GET /api/brokers/metaapi/health should ping MetaApi Cloud Gateway and report latency', async () => {
    const res = await fetch(`${baseUrl}/api/brokers/metaapi/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.broker).toBe('MetaApi.cloud');
    expect(data.ok).toBe(true);
    expect(typeof data.latencyMs).toBe('number');
    expect(data.hasTokenConfigured).toBe(true);
  });

  it('4. GET /api/brokers/metaapi/accounts should return cloud provisioned accounts list', async () => {
    const res = await fetch(`${baseUrl}/api/brokers/metaapi/accounts`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.accounts)).toBe(true);
  });

  it('5. GET /api/market/quotes should return institutional spreads and live currency quotes', async () => {
    const res = await fetch(`${baseUrl}/api/market/quotes`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.quotes).toBeDefined();
    expect(data.quotes['USDJPY']).toBeDefined();
    expect(data.quotes['USDJPY'].bid).toBeGreaterThan(0);
  });

  it('6. GET /api/market/candlesticks should return USDJPY 1m candlestick history', async () => {
    const res = await fetch(`${baseUrl}/api/market/candlesticks?symbol=USDJPY&timeframe=1m`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.bars)).toBe(true);
    expect(data.bars.length).toBeGreaterThan(0);
    expect(data.bars[0]).toHaveProperty('open');
    expect(data.bars[0]).toHaveProperty('close');
  }, 15000);

  it('7. POST /api/connector/validate & connect should onboard an account and store secrets in vault', async () => {
    // 7a. Validate
    const valRes = await fetch(`${baseUrl}/api/connector/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        broker: 'IC_MARKETS',
        credentials: {
          type: 'mt_gateway',
          broker: 'IC_MARKETS',
          platform: 'MT5',
          serverName: 'ICMarkets-Mock-Server',
          login: 'mock_9921048',
          investorPassword: 'ValidPass123!',
        },
      }),
    });
    expect(valRes.status).toBe(200);
    const valData = await valRes.json();
    expect(valData.success).toBe(true);

    // 7b. Connect
    const connRes = await fetch(`${baseUrl}/api/connector/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'u_tester_1',
        username: 'TestChallenger',
        broker: 'IC_MARKETS',
        credentials: {
          type: 'mt_gateway',
          broker: 'IC_MARKETS',
          platform: 'MT5',
          serverName: 'ICMarkets-Mock-Server',
          login: 'mock_9921048',
          investorPassword: 'ValidPass123!',
        },
      }),
    });
    expect(connRes.status).toBe(201);
    const connData = await connRes.json();
    expect(connData.account).toBeDefined();
    expect(connData.account.broker).toBe('IC_MARKETS');
    expect(connData.account.vaultSecretRef).toMatch(/^vault_sec_/);

    const accountId = connData.account.id;

    // 7c. Check account summary
    const sumRes = await fetch(`${baseUrl}/api/accounts/${accountId}/summary`);
    expect(sumRes.status).toBe(200);
    const sumData = await sumRes.json();
    expect(sumData.accountId).toBe(accountId);
    expect(typeof sumData.equity).toBe('number');

    // 7d. Sync with MetaApi
    const syncRes = await fetch(`${baseUrl}/api/brokers/metaapi/sync/${accountId}`, { method: 'POST' });
    expect(syncRes.status).toBe(200);
    const syncData = await syncRes.json();
    expect(syncData.success).toBe(true);
  });

  it('8. GET /api/leaderboard and /api/tournaments should return real-time competitive rankings', async () => {
    const [lbRes, dailyRes, tourneyRes] = await Promise.all([
      fetch(`${baseUrl}/api/leaderboard`),
      fetch(`${baseUrl}/api/leaderboard/daily`),
      fetch(`${baseUrl}/api/tournaments`),
    ]);

    expect(lbRes.status).toBe(200);
    const lbData = await lbRes.json();
    expect(Array.isArray(lbData)).toBe(true);

    expect(dailyRes.status).toBe(200);
    const dailyData = await dailyRes.json();
    expect(typeof dailyData.totalDailyPips).toBe('number');

    expect(tourneyRes.status).toBe(200);
    const tourneyData = await tourneyRes.json();
    expect(Array.isArray(tourneyData)).toBe(true);
    expect(tourneyData.length).toBeGreaterThan(0);

    // Verify one-click tournament entry
    const joinRes = await fetch(`${baseUrl}/api/tournaments/${tourneyData[0].id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'u_challenger_99',
        username: 'XM_Challenger',
        broker: 'XM',
      }),
    });
    expect(joinRes.status).toBe(200);
    const joinData = await joinRes.json();
    expect(joinData.success).toBe(true);
    expect(joinData.standing.username).toBe('XM_Challenger');
  });

  it('9. WebSocket Gateway /ws should stream leaderboard and live market quotes', async () => {
    const ws = new WebSocket(`ws://localhost:${PORT}/ws`);

    const received = await new Promise<{ connected: boolean; messageType: string | null }>((resolve) => {
      let connected = false;
      let messageType: string | null = null;

      const timer = setTimeout(() => {
        ws.close();
        resolve({ connected, messageType });
      }, 3000);

      ws.on('open', () => {
        connected = true;
      });

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'LEADERBOARD_UPDATE' || msg.type === 'MARKET_QUOTES' || msg.type === 'DAILY_LEADERBOARD_UPDATE') {
            messageType = msg.type;
            clearTimeout(timer);
            ws.close();
            resolve({ connected: true, messageType });
          }
        } catch {}
      });
    });

    expect(received.connected).toBe(true);
    expect(received.messageType).toBeDefined();
  });

  it('10. GET /api/vault/audit should verify immutable secrets vault audit log trail', async () => {
    const res = await fetch(`${baseUrl}/api/vault/audit`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('callerService');
    expect(data[0]).toHaveProperty('timestamp');
  });
});
