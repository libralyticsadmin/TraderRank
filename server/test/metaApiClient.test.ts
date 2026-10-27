import { describe, it, expect } from 'vitest';
import { MetaApiClient } from '../src/workers/metaApiClient.js';

describe('MetaApiClient - MetaApi.cloud REST & Gateway Standard', () => {
  it('should initialize and report token presence status', () => {
    const clientNoToken = new MetaApiClient('');
    expect(clientNoToken.hasToken()).toBe(false);

    const clientWithToken = new MetaApiClient('test_token_1234567890abcdef');
    expect(clientWithToken.hasToken()).toBe(true);
  });

  it('should perform health check ping and measure latency', async () => {
    const client = new MetaApiClient();
    const ping = await client.ping();
    expect(ping.ok).toBe(true);
    expect(ping.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should validate MT5 investor connection and return account snapshot', async () => {
    const client = new MetaApiClient();
    const result = await client.validateAccount('XMGlobal-Real 55', '10928374', 'InvestorPass123', 'MT5');

    expect(result.success).toBe(true);
    expect(result.accountInfo).toBeDefined();
    expect(result.accountInfo?.platform).toBe('MT5');
    expect(result.accountInfo?.balance).toBe(10000.00);
    expect(result.accountInfo?.leverage).toBe(100);
  });

  it('should reject invalid credentials with specific error codes', async () => {
    const client = new MetaApiClient();
    const resultMissing = await client.validateAccount('', '', '');
    expect(resultMissing.success).toBe(false);
    expect(resultMissing.errorCode).toBe('INVALID_CREDENTIALS');

    const resultWrongPass = await client.validateAccount('XMGlobal-Real 55', '10928374', 'wrong_pass', 'MT5');
    expect(resultWrongPass.success).toBe(false);
    expect(resultWrongPass.errorCode).toBe('INVALID_CREDENTIALS');

    const resultOffline = await client.validateAccount('XMGlobal-offline-server', '10928374', 'pass123', 'MT5');
    expect(resultOffline.success).toBe(false);
    expect(resultOffline.errorCode).toBe('SERVER_UNREACHABLE');
  });

  it('should retrieve positions array format', async () => {
    const client = new MetaApiClient();
    const positions = await client.getPositions('acc_test_123');
    expect(Array.isArray(positions)).toBe(true);
  });

  it('should list provisioned accounts, state, information, and historical deals in offline mode', async () => {
    const client = new MetaApiClient('');
    const accounts = await client.listProvisionedAccounts();
    expect(Array.isArray(accounts)).toBe(true);

    const state = await client.getAccountState('mock_acc_1');
    expect(state).toEqual({ state: 'DEPLOYED', connectionStatus: 'CONNECTED' });

    const info = await client.getAccountInformation('mock_acc_1');
    expect(info).toBeDefined();
    expect(info?.balance).toBe(10000);
    expect(info?.currency).toBe('USD');

    const deals = await client.getHistoricalDeals('mock_acc_1');
    expect(Array.isArray(deals)).toBe(true);
  });
});
