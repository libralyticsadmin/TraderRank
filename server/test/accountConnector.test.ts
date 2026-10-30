import { describe, it, expect } from 'vitest';
import { AccountConnectorService } from '../src/connector/accountConnector.js';
import { GatewayCredentials, ExnessNativeCredentials } from '../../shared/src/types.js';

describe('AccountConnectorService - Connection & Routing Standard', () => {
  const connector = AccountConnectorService.getInstance();

  it('should validate and connect an XM MT5 Gateway account with investor password', async () => {
    const creds: GatewayCredentials = {
      type: 'mt_gateway',
      broker: 'XM',
      platform: 'MT5',
      serverName: 'XMGlobal-Real 20',
      login: '20938471',
      investorPassword: 'ReadOnlyInvestor99!',
    };

    const result = await connector.connectAccount('u_demo_1', 'TraderAlex', 'XM', creds);
    expect(result.account).toBeDefined();
    expect(result.account.broker).toBe('XM');
    expect(result.account.integrationType).toBe('mt_gateway');
    expect(result.account.connectionStatus).toBe('CONNECTED');
    expect(result.account.vaultSecretRef).toMatch(/^vault_sec_/);

    // Verify active positions exist
    const positions = await connector.getActivePositions(result.account.id);
    expect(positions.length).toBeGreaterThan(0);
    expect(positions[0].symbol).toBe('EURUSD');
  });

  it('should validate and connect an Exness Native account with API keys', async () => {
    const creds: ExnessNativeCredentials = {
      type: 'exness_native',
      broker: 'Exness',
      apiKey: 'exness_live_api_key_8899',
      apiSecret: 'exness_secret_token_112233',
      accountId: 'EXN-554433',
    };

    const result = await connector.connectAccount('u_demo_2', 'ExnessSniper', 'Exness', creds);
    expect(result.account.broker).toBe('Exness');
    expect(result.account.integrationType).toBe('exness_native');
    expect(result.account.accountNumber).toBe('EXN-554433');
  });

  it('should reject invalid credentials with clear diagnostic error per PRD §6', async () => {
    const badCreds: GatewayCredentials = {
      type: 'mt_gateway',
      broker: 'Vantage',
      platform: 'MT4',
      serverName: 'Vantage-Live',
      login: '12345',
      investorPassword: 'wrong_password',
    };

    await expect(
      connector.connectAccount('u_demo_3', 'FailedUser', 'Vantage', badCreds)
    ).rejects.toThrow(/Invalid investor password/);
  });

  it('should accurately pair MT5 deals, eliminate balance rows, and calculate exact pips', () => {
    const rawDeals = [
      {
        id: '274268080',
        positionId: '274268080',
        symbol: undefined,
        type: 'DEAL_TYPE_BALANCE',
        entryType: undefined,
        volume: 0,
        price: 0,
        profit: 200.0,
        commission: 0,
        swap: 0,
        time: '2026-05-26T16:51:00Z',
      },
      {
        id: '274268865',
        positionId: 'pos_gold_05',
        symbol: 'GOLD#',
        type: 'DEAL_TYPE_SELL',
        entryType: 'DEAL_ENTRY_IN',
        volume: 0.05,
        price: 4518.92,
        profit: 0.0,
        commission: -0.35,
        swap: 0,
        time: '2026-05-26T16:52:00Z',
      },
      {
        id: '274278895',
        positionId: 'pos_gold_03',
        symbol: 'GOLD#',
        type: 'DEAL_TYPE_SELL',
        entryType: 'DEAL_ENTRY_IN',
        volume: 0.03,
        price: 4524.84,
        profit: 0.0,
        commission: -0.21,
        swap: 0,
        time: '2026-05-26T17:09:00Z',
      },
      {
        id: '274350049',
        positionId: 'pos_gold_03',
        symbol: 'GOLD#',
        type: 'DEAL_TYPE_BUY',
        entryType: 'DEAL_ENTRY_OUT',
        volume: 0.03,
        price: 4508.0,
        profit: 50.52,
        commission: -0.21,
        swap: 0,
        time: '2026-05-26T18:35:00Z',
      },
      {
        id: '274367856',
        positionId: 'pos_gold_05',
        symbol: 'GOLD#',
        type: 'DEAL_TYPE_BUY',
        entryType: 'DEAL_ENTRY_OUT',
        volume: 0.05,
        price: 4513.68,
        profit: 26.2,
        commission: -0.35,
        swap: 0,
        time: '2026-05-26T18:47:00Z',
      },
      {
        id: '274407591',
        positionId: 'pos_gold_open_1',
        symbol: 'GOLD#',
        type: 'DEAL_TYPE_BUY',
        entryType: 'DEAL_ENTRY_IN',
        volume: 0.05,
        price: 4505.35,
        profit: 0.0,
        commission: -0.35,
        swap: 0,
        time: '2026-05-26T19:33:00Z',
      },
      {
        id: '274408757',
        positionId: '274408757',
        symbol: undefined,
        type: 'DEAL_TYPE_BALANCE',
        entryType: undefined,
        volume: 0,
        price: 0,
        profit: 331.0,
        commission: 0,
        swap: 0,
        time: '2026-05-26T19:34:00Z',
      },
      {
        id: '274412572',
        positionId: 'pos_gold_open_2',
        symbol: 'GOLD#',
        type: 'DEAL_TYPE_BUY',
        entryType: 'DEAL_ENTRY_IN',
        volume: 0.09,
        price: 4502.96,
        profit: 0.0,
        commission: -0.63,
        swap: 0,
        time: '2026-05-26T19:39:00Z',
      },
    ];

    const trades = connector.processRawDealsToTrades('acc_test_user', rawDeals);

    // Only the 2 closed trades must be in the executions ledger
    expect(trades.length).toBe(2);

    // Trade 1 (most recent close: 18:47)
    const trade1 = trades[0];
    expect(trade1.symbol).toBe('GOLD#');
    expect(trade1.type).toBe('SELL');
    expect(trade1.lotSize).toBe(0.05);
    expect(trade1.openPrice).toBe(4518.92);
    expect(trade1.closePrice).toBe(4513.68);
    expect(trade1.pnlCurrency).toBe(26.2);
    expect(trade1.pnlPips).toBe(52.4);

    // Trade 2 (earlier close: 18:35)
    const trade2 = trades[1];
    expect(trade2.symbol).toBe('GOLD#');
    expect(trade2.type).toBe('SELL');
    expect(trade2.lotSize).toBe(0.03);
    expect(trade2.openPrice).toBe(4524.84);
    expect(trade2.closePrice).toBe(4508.0);
    expect(trade2.pnlCurrency).toBe(50.52);
    expect(trade2.pnlPips).toBe(168.4);
  });
});

