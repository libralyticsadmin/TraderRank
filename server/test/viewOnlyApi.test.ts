import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../src/api/server.js';
import type { Server } from 'http';

describe('View-Only MetaTrader API & Zero-Write Security Integration', () => {
  let serverInstance: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const { server } = createServer();
    serverInstance = server.listen(0);
    const address = serverInstance.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(() => {
    serverInstance?.close();
  });

  it('GET /api/brokers/servers returns supported servers for Exness, XM, Axiory, Vantage', async () => {
    const res = await fetch(`${baseUrl}/api/brokers/servers`);
    expect(res.status).toBe(200);
    const data = await res.json() as { supportedBrokers: string[]; servers: Array<{ broker: string; serverName: string }> };

    expect(data.supportedBrokers).toContain('EXNESS');
    expect(data.supportedBrokers).toContain('XM');
    expect(data.supportedBrokers).toContain('AXIORY');
    expect(data.supportedBrokers).toContain('VANTAGE');
    expect(data.servers.length).toBeGreaterThanOrEqual(10);
  });

  it('GET /api/brokers/servers?broker=EXNESS filters servers for Exness', async () => {
    const res = await fetch(`${baseUrl}/api/brokers/servers?broker=EXNESS`);
    expect(res.status).toBe(200);
    const data = await res.json() as { servers: Array<{ broker: string }> };
    expect(data.servers.every(s => s.broker === 'EXNESS')).toBe(true);
  });

  it('POST /api/connector/connect connects an MT5 account and GET /api/accounts/:id/summary returns view-only metrics', async () => {
    const connectRes = await fetch(`${baseUrl}/api/connector/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'u_tester_99',
        username: 'ProViewTrader',
        broker: 'XM',
        credentials: {
          type: 'mt_gateway',
          broker: 'XM',
          platform: 'MT5',
          serverName: 'XMGlobal-Real 55',
          login: '9928172',
          investorPassword: 'ReadOnlyPass123',
        },
      }),
    });

    expect(connectRes.status).toBe(201);
    const connectData = await connectRes.json() as { account: { id: string } };
    const accountId = connectData.account.id;

    // View-Only Summary
    const summaryRes = await fetch(`${baseUrl}/api/accounts/${accountId}/summary`);
    expect(summaryRes.status).toBe(200);
    const summary = await summaryRes.json() as {
      isReadOnly: boolean;
      balance: number;
      equity: number;
      margin: number;
      freeMargin: number;
    };

    expect(summary.isReadOnly).toBe(true);
    expect(summary.balance).toBeGreaterThan(0);
    expect(summary.equity).toBeGreaterThan(0);
  });

  it('Strict Security Guard: rejects any order placement, modification, or trade closures with HTTP 403', async () => {
    // Attempting POST /orders
    const postOrderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'EURUSD', lots: 1.0 }),
    });
    expect(postOrderRes.status).toBe(403);
    const postOrderData = await postOrderRes.json() as { code: string; error: string };
    expect(postOrderData.code).toBe('WRITE_OPERATION_FORBIDDEN');

    // Attempting POST /positions/close
    const closePosRes = await fetch(`${baseUrl}/api/positions/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positionId: 'pos_1' }),
    });
    expect(closePosRes.status).toBe(403);

    // Attempting PUT /orders/123
    const putOrderRes = await fetch(`${baseUrl}/api/orders/123`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ takeProfit: 1.1000 }),
    });
    expect(putOrderRes.status).toBe(403);

    // Attempting DELETE /orders/123
    const delOrderRes = await fetch(`${baseUrl}/api/orders/123`, {
      method: 'DELETE',
    });
    expect(delOrderRes.status).toBe(403);
  });
});
