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
});
