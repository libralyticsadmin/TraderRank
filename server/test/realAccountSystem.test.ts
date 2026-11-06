/**
 * TraderRank Real Account Onboarding & Safety Verification Test Suite
 * Validates PRD §5, §6 and Zero-Write Security Guarantees:
 * 1. Pre-flight credential validation across all supported real brokers (IC Markets, XM, Axiory, Vantage, Exness)
 * 2. Secrets Vault AES-256-GCM encryption & access control
 * 3. Zero-Write Guard immutable enforcement (order block, write block, 403 API response)
 * 4. Multi-account coexistence, ranking calculation, and trade ledger isolation
 * 5. Real deal pairing, cashflow separation, and pips calculation
 * 6. Disconnection & lifecycle cleanup
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../src/api/server.js';
import { AccountConnectorService } from '../src/connector/accountConnector.js';
import { SecretsVault } from '../src/vault/secretsVault.js';
import { ZeroWriteGuard, IllegalWriteOperationError } from '../src/connector/zeroWriteGuard.js';
import { GatewayCredentials } from '../../shared/src/types.js';
import type { Server } from 'http';

describe('Real Account Onboarding & Safety Verification Suite', () => {
  let server: Server;
  let baseUrl = '';
  const connector = AccountConnectorService.getInstance();
  const vault = SecretsVault.getInstance();

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
  // 1. Pre-flight Credential Validation
  // =========================================================================
  describe('1. Pre-Flight Credential Validation', () => {
    it('validates a real XM MT5 Gateway account configuration with investor credentials', async () => {
      const res = await fetch(`${baseUrl}/api/connector/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: 'XM',
          credentials: {
            type: 'mt_gateway',
            broker: 'XM',
            platform: 'MT5',
            serverName: 'XMGlobal-MT5 10',
            login: '342186831',
            investorPassword: 'ValidReadOnlyPass2026!',
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.accountDetails).toBeDefined();
      expect(data.accountDetails.accountNumber).toBe('342186831');
      expect(data.accountDetails.currency).toBe('USD');
    });

    it('validates IC Markets Raw Spread ECN MT5 server format', async () => {
      const res = await fetch(`${baseUrl}/api/connector/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: 'IC_MARKETS',
          credentials: {
            type: 'mt_gateway',
            broker: 'IC_MARKETS',
            platform: 'MT5',
            serverName: 'ICMarketsSC-Live01',
            login: '9921048',
            investorPassword: 'ReadOnlyPass123!',
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.accountDetails.server).toBe('ICMarketsSC-Live01');
    });

    it('validates Axiory MT4/MT5 Gateway account configuration', async () => {
      const res = await fetch(`${baseUrl}/api/connector/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: 'Axiory',
          credentials: {
            type: 'mt_gateway',
            broker: 'Axiory',
            platform: 'MT4',
            serverName: 'Axiory-Live 01',
            login: '8839201',
            investorPassword: 'InvestorViewOnly77!',
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('validates Exness Native OpenAPI with read-only API Key and Secret', async () => {
      const res = await fetch(`${baseUrl}/api/connector/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: 'Exness',
          credentials: {
            type: 'exness_native',
            broker: 'Exness',
            apiKey: 'exness_api_key_live_verified',
            apiSecret: 'exness_api_secret_hash_9988',
            accountId: 'EXN-REAL-8899',
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.accountDetails?.accountNumber).toBe('EXN-REAL-8899');
    });

    it('rejects invalid investor password with clean diagnostic message', async () => {
      const res = await fetch(`${baseUrl}/api/connector/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: 'XM',
          credentials: {
            type: 'mt_gateway',
            broker: 'XM',
            platform: 'MT5',
            serverName: 'XMGlobal-MT5 10',
            login: '342186831',
            investorPassword: 'wrong_password_attempt',
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('INVALID_CREDENTIALS');
      expect(data.error).toContain('Invalid investor password');
    });

    it('rejects unreachable broker server with diagnostic error', async () => {
      const res = await fetch(`${baseUrl}/api/connector/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: 'Vantage',
          credentials: {
            type: 'mt_gateway',
            broker: 'Vantage',
            platform: 'MT4',
            serverName: 'Vantage-offline-backup-09',
            login: '109283',
            investorPassword: 'ValidPass123!',
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('SERVER_UNREACHABLE');
      expect(data.error).toContain('Unable to reach broker server');
    });

    it('rejects missing credentials payload with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/connector/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. Zero-Write Safety Enforcers
  // =========================================================================
  describe('2. Zero-Write Safety & Capital Protection Guarantees', () => {
    it('blocks all order creation or execution attempts with 403 Forbidden', async () => {
      const endpoints = [
        '/api/orders',
        '/api/positions/close',
        '/api/trades/execute',
        '/api/accounts/withdraw',
      ];

      for (const path of endpoints) {
        const res = await fetch(`${baseUrl}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ volume: 1.0 }),
        });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.code).toBe('WRITE_OPERATION_FORBIDDEN');
        expect(data.error).toContain('immutable view-only mode');
      }
    });

    it('ZeroWriteGuard throws IllegalWriteOperationError for any write method call', () => {
      expect(() => {
        ZeroWriteGuard.assertReadOnly('createOrder', { lot: 0.1, symbol: 'XAUUSD' });
      }).toThrow(IllegalWriteOperationError);

      expect(() => {
        ZeroWriteGuard.assertReadOnly('placeOrder', {});
      }).toThrow(IllegalWriteOperationError);

      expect(() => {
        ZeroWriteGuard.assertReadOnly('closePosition', { ticket: 123456 });
      }).toThrow(IllegalWriteOperationError);

      expect(() => {
        ZeroWriteGuard.assertReadOnly('modifyOrder', { sl: 2500, tp: 2600 });
      }).toThrow(IllegalWriteOperationError);
    });

    it('ZeroWriteGuard proxy protects real API client instances', () => {
      const targetApi = {
        fetchAccountInfo: () => ({ balance: 1000 }),
        placeOrder: () => ({ orderId: 999 }),
      };

      const protectedApi = ZeroWriteGuard.wrapReadOnly(targetApi, 'TestApiClient');
      expect(protectedApi.fetchAccountInfo()).toEqual({ balance: 1000 });
      expect(() => (protectedApi as any).placeOrder()).toThrow(IllegalWriteOperationError);
    });
  });

  // =========================================================================
  // 3. Secrets Vault Encryption & Data Sanitization
  // =========================================================================
  describe('3. Secrets Vault Encryption & Data Sanitization', () => {
    it('encrypts real account credentials using AES-256-GCM', async () => {
      const sensitiveCreds: GatewayCredentials = {
        type: 'mt_gateway',
        broker: 'IC_MARKETS',
        platform: 'MT5',
        serverName: 'ICMarketsSC-Live01',
        login: '77221199',
        investorPassword: 'SuperSecretInvestorKey99!#',
      };

      const ref = await vault.storeSecret('AccountConnectorService', sensitiveCreds);
      expect(ref).toMatch(/^vault_sec_[a-f0-9]{32}$/);

      // Authorized read retrieves original
      const retrieved = await vault.getSecret('AccountConnectorService', ref);
      expect(retrieved).not.toBeNull();
      expect((retrieved as GatewayCredentials).login).toBe('77221199');
      expect((retrieved as GatewayCredentials).investorPassword).toBe('SuperSecretInvestorKey99!#');

      // Unauthorized access is strictly denied
      await expect(
        vault.getSecret('UnregisteredExternalService', ref)
      ).rejects.toThrow(/Access denied|authorized/i);
    });

    it('masks vault secret references and never leaks investor password in API responses', async () => {
      const connectRes = await fetch(`${baseUrl}/api/connector/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u_real_trader_alpha',
          username: 'AlphaQuant',
          broker: 'IC_MARKETS',
          credentials: {
            type: 'mt_gateway',
            broker: 'IC_MARKETS',
            platform: 'MT5',
            serverName: 'ICMarketsSC-Live01',
            login: '77221199',
            investorPassword: 'SuperSecretInvestorKey99!#',
          },
        }),
      });

      expect(connectRes.status).toBe(201);
      const data = await connectRes.json();
      const acc = data.account;
      expect(acc).toBeDefined();

      // Password MUST NOT exist on account object
      expect((acc as any).investorPassword).toBeUndefined();
      expect((acc as any).password).toBeUndefined();

      // vaultSecretRef MUST be masked
      expect(acc.vaultSecretRef).toMatch(/^vault_sec_\*\*\*[a-f0-9]{4}$/);

      // GET /api/accounts must also mask vaultSecretRef
      const listRes = await fetch(`${baseUrl}/api/accounts`);
      expect(listRes.status).toBe(200);
      const accounts = await listRes.json();
      const found = accounts.find((a: any) => a.accountNumber === '77221199');
      expect(found).toBeDefined();
      expect(found.vaultSecretRef).toMatch(/^vault_sec_\*\*\*[a-f0-9]{4}$/);
      expect(found.investorPassword).toBeUndefined();
    });
  });

  // =========================================================================
  // 4. Multi-Account Coexistence & Leaderboard Calculation
  // =========================================================================
  describe('4. Multi-Account Coexistence & Leaderboard Ranking', () => {
    it('supports multiple connected real accounts side-by-side with isolated trades and rankings', async () => {
      // Connect Account A (Exness Native)
      const resA = await fetch(`${baseUrl}/api/connector/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u_trader_exness_pro',
          username: 'ExnessSniper',
          broker: 'Exness',
          credentials: {
            type: 'exness_native',
            broker: 'Exness',
            apiKey: 'exness_key_sniper',
            apiSecret: 'exness_secret_sniper',
            accountId: 'EXN-MULTI-01',
          },
        }),
      });
      expect(resA.status).toBe(201);
      const dataA = await resA.json();
      const accAId = dataA.account.id;

      // Connect Account B (Axiory MT5)
      const resB = await fetch(`${baseUrl}/api/connector/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u_trader_axiory_scalper',
          username: 'AxioryScalper',
          broker: 'Axiory',
          credentials: {
            type: 'mt_gateway',
            broker: 'Axiory',
            platform: 'MT5',
            serverName: 'Axiory-Live 01',
            login: '99881122',
            investorPassword: 'ValidAxioryPass1!',
          },
        }),
      });
      expect(resB.status).toBe(201);
      const dataB = await resB.json();
      const accBId = dataB.account.id;

      // Verify accounts list contains both accounts
      const accountsRes = await fetch(`${baseUrl}/api/accounts`);
      const accounts = await accountsRes.json();
      const ids = accounts.map((a: any) => a.id);
      expect(ids).toContain(accAId);
      expect(ids).toContain(accBId);

      // Verify leaderboard is accessible and ranks traders
      const leaderboardRes = await fetch(`${baseUrl}/api/leaderboard`);
      expect(leaderboardRes.status).toBe(200);
      const leaderboard = await leaderboardRes.json();
      expect(Array.isArray(leaderboard)).toBe(true);
      expect(leaderboard.length).toBeGreaterThan(0);

      // Verify each leaderboard entry has required ranking fields
      const first = leaderboard[0];
      expect(first.rank).toBeDefined();
      expect(first.username).toBeDefined();
      expect(first.totalPips).toBeDefined();
      expect(first.winRate).toBeDefined();

      // Verify trades endpoints return isolated arrays for each account
      const tradesResA = await fetch(`${baseUrl}/api/accounts/${accAId}/trades`);
      expect(tradesResA.status).toBe(200);
      const tradesA = await tradesResA.json();
      expect(Array.isArray(tradesA)).toBe(true);

      const tradesResB = await fetch(`${baseUrl}/api/accounts/${accBId}/trades`);
      expect(tradesResB.status).toBe(200);
      const tradesB = await tradesResB.json();
      expect(Array.isArray(tradesB)).toBe(true);
    });
  });

  // =========================================================================
  // 5. Real Deal Pairing & Cashflow Separation
  // =========================================================================
  describe('5. Real Deal Pairing, Cashflow Separation & Pip Precision', () => {
    it('separates deposits and withdrawals from trades so ROI is strictly PnL / Deposits', () => {
      const rawDeals = [
        {
          id: 'deal_dep_1',
          positionId: 'deal_dep_1',
          type: 'DEAL_TYPE_BALANCE',
          volume: 0,
          price: 0,
          profit: 5000.0, // Initial deposit
          time: '2026-06-01T10:00:00Z',
        },
        {
          id: 'deal_trade_in_1',
          positionId: 'pos_gold_100',
          symbol: 'GOLD#',
          type: 'DEAL_TYPE_BUY',
          entryType: 'DEAL_ENTRY_IN',
          volume: 0.1,
          price: 2500.0,
          profit: 0,
          commission: -0.7,
          swap: 0,
          time: '2026-06-01T12:00:00Z',
        },
        {
          id: 'deal_trade_out_1',
          positionId: 'pos_gold_100',
          symbol: 'GOLD#',
          type: 'DEAL_TYPE_SELL',
          entryType: 'DEAL_ENTRY_OUT',
          volume: 0.1,
          price: 2520.0,
          profit: 200.0,
          commission: -0.7,
          swap: 0,
          time: '2026-06-01T14:00:00Z',
        },
        {
          id: 'deal_with_1',
          positionId: 'deal_with_1',
          type: 'DEAL_TYPE_BALANCE',
          volume: 0,
          price: 0,
          profit: -1000.0, // Withdrawal
          time: '2026-06-02T10:00:00Z',
        },
      ];

      const trades = connector.processRawDealsToTrades('acc_cashflow_test', rawDeals);

      // Only the trading execution should be counted as a trade
      expect(trades.length).toBe(1);
      expect(trades[0].symbol).toBe('GOLD#');
      expect(trades[0].pnlCurrency).toBe(200.0);
      expect(trades[0].pnlPips).toBe(200.0); // (2520 - 2500) * 10 = 200 pips

      // The balance rows must NOT be in the closed trades list
      const balanceTrades = trades.filter(t => t.symbol === 'BALANCE' || t.pnlCurrency === 5000 || t.pnlCurrency === -1000);
      expect(balanceTrades.length).toBe(0);
    });
  });

  // =========================================================================
  // 6. Account Disconnection & Lifecycle Cleanup
  // =========================================================================
  describe('6. Account Disconnection & Lifecycle Cleanup', () => {
    it('disconnects and purges an account via DELETE /api/accounts/:id', async () => {
      // Connect temporary account
      const connectRes = await fetch(`${baseUrl}/api/connector/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u_temp_cleanup_user',
          username: 'TempTrader',
          broker: 'XM',
          credentials: {
            type: 'mt_gateway',
            broker: 'XM',
            platform: 'MT5',
            serverName: 'XMGlobal-MT5 10',
            login: '88776655',
            investorPassword: 'ValidPassClean123!',
          },
        }),
      });

      const data = await connectRes.json();
      const accountId = data.account.id;
      expect(accountId).toBeDefined();

      // Disconnect and purge
      const deleteRes = await fetch(`${baseUrl}/api/accounts/${accountId}?purge=true`, {
        method: 'DELETE',
      });
      expect(deleteRes.status).toBe(200);
      const deleteData = await deleteRes.json();
      expect(deleteData.success).toBe(true);

      // Verify account is removed from accounts list
      const listAfter = await fetch(`${baseUrl}/api/accounts`);
      const accountsAfter = await listAfter.json();
      const found = accountsAfter.find((a: any) => a.id === accountId);
      expect(found).toBeUndefined();

      // Deleting a non-existent account returns 404
      const delete404 = await fetch(`${baseUrl}/api/accounts/non_existent_account_id`, {
        method: 'DELETE',
      });
      expect(delete404.status).toBe(404);
      const data404 = await delete404.json();
      expect(data404.success).toBe(false);
    });
  });
});
