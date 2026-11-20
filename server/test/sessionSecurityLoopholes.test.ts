import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import { createServer } from '../src/api/server.js';
import { AuthService } from '../src/services/authService.js';
import { AccountConnectorService } from '../src/connector/accountConnector.js';
import { RedisStreamsBus } from '../src/eventbus/redisStreamsBus.js';

describe('Session Security & Loophole Regression Suite', () => {
  let server: Server;
  let baseUrl = '';
  const authService = AuthService.getInstance();
  const connector = AccountConnectorService.getInstance();

  beforeAll(async () => {
    const instance = createServer();
    server = instance.server;
    await new Promise<void>(resolve =>
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      })
    );
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it('1. Blocks cross-user POST /api/connector/validate on another player’s bound login (409 ACCOUNT_OWNED_BY_OTHER)', async () => {
    const ownerToken = authService.createSessionToken('u_sec_owner_1', 'OwnerOne');
    const attackerToken = authService.createSessionToken('u_sec_attacker_2', 'AttackerTwo');

    // Bind account mock_77112233 to OwnerOne
    const connectRes = await fetch(`${baseUrl}/api/connector/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        broker: 'XM',
        credentials: {
          type: 'mt_gateway',
          broker: 'XM',
          platform: 'MT5',
          serverName: 'XMGlobal-Mock-10',
          login: 'mock_77112233',
          investorPassword: 'OwnerSecretPassword1!',
        },
      }),
    });
    expect(connectRes.status).toBe(201);
    const connected = await connectRes.json();

    // Attacker tries to validate OwnerOne's login with a bogus password
    const hijackRes = await fetch(`${baseUrl}/api/connector/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attackerToken}`,
      },
      body: JSON.stringify({
        broker: 'XM',
        credentials: {
          type: 'mt_gateway',
          broker: 'XM',
          platform: 'MT5',
          serverName: 'XMGlobal-Mock-10',
          login: 'mock_77112233',
          investorPassword: 'AttackerBogusPassword!',
        },
      }),
    });
    expect(hijackRes.status).toBe(409);
    const hijackBody = await hijackRes.json();
    expect(hijackBody.errorCode).toBe('ACCOUNT_OWNED_BY_OTHER');

    // Cleanup
    await fetch(`${baseUrl}/api/accounts/${connected.account.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
  });

  it('2. Unscoped GET /api/accounts masks both vault_sec_* and ref_meta_* (never exposes raw MetaApi UUIDs)', async () => {
    const res = await fetch(`${baseUrl}/api/accounts`);
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(Array.isArray(list)).toBe(true);
    for (const acc of list) {
      if (acc.vaultSecretRef) {
        expect(acc.vaultSecretRef).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        expect(acc.vaultSecretRef).toMatch(/^(vault_sec|ref_meta|ref)_\*\*\*.{4}$/);
      }
    }
  });

  it('3. Strict immutable userId isolation prevents display-name collision from exposing another user’s account', async () => {
    const ownerToken = authService.createSessionToken('u_iso_owner_a', 'SharedDisplayName');
    const otherToken = authService.createSessionToken('u_iso_other_b', 'SharedDisplayName');

    const connectRes = await fetch(`${baseUrl}/api/connector/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        broker: 'XM',
        credentials: {
          type: 'mt_gateway',
          broker: 'XM',
          platform: 'MT5',
          serverName: 'XMGlobal-Mock-11',
          login: 'mock_88223344',
          investorPassword: 'OwnerPass2026!',
        },
      }),
    });
    expect(connectRes.status).toBe(201);
    const connected = await connectRes.json();

    // Owner sees their own account
    const ownerListRes = await fetch(`${baseUrl}/api/accounts?userId=u_iso_owner_a`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(ownerListRes.status).toBe(200);
    const ownerList = await ownerListRes.json();
    expect(ownerList.some((a: any) => a.accountNumber === 'mock_88223344')).toBe(true);

    // Other user with identical display username MUST NOT see owner's account
    const otherListRes = await fetch(`${baseUrl}/api/accounts?userId=u_iso_other_b`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(otherListRes.status).toBe(200);
    const otherList = await otherListRes.json();
    expect(otherList.some((a: any) => a.accountNumber === 'mock_88223344')).toBe(false);

    // Cleanup
    await fetch(`${baseUrl}/api/accounts/${connected.account.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
  });

  it('4. AccountConnectorService.isSameOwner handles legacy alias consistently without cross-user bleed', () => {
    expect(AccountConnectorService.isSameOwner('u_homiesplant', 'u_homiesplant_th')).toBe(true);
    expect(AccountConnectorService.isSameOwner('u_homiesplant_th', 'u_homiesplant')).toBe(true);
    expect(AccountConnectorService.isSameOwner('u_alice', 'alice')).toBe(true);
    expect(AccountConnectorService.isSameOwner('u_alice', 'u_bob')).toBe(false);
    expect(AccountConnectorService.isSameOwner('u_homiesplant', 'u_zzzemzzz')).toBe(false);
  });

  it('5. RedisStreamsBus caps per-stream history at 500 events to prevent 512MB OOM', async () => {
    const bus = RedisStreamsBus.getInstance();
    const streamName = 'stream:test.oom.guard';
    for (let i = 0; i < 650; i++) {
      await bus.publish(streamName, 'position.updated.raw', 'acc_test', { seq: i });
    }
    const history = bus.getStreamHistory(streamName, 1000);
    expect(history.length).toBeLessThanOrEqual(500);
    expect((history[history.length - 1].payload as any).seq).toBe(649);
  });
});
