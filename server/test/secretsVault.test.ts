import { describe, it, expect } from 'vitest';
import { SecretsVault } from '../src/vault/secretsVault.js';
import { GatewayCredentials, ExnessNativeCredentials } from '../../shared/src/types.js';

describe('SecretsVault - Security & Isolation Standard', () => {
  const vault = new SecretsVault('test_vault_key_for_unit_tests_32char!');

  it('should encrypt and store credentials without plaintext exposure', async () => {
    const creds: GatewayCredentials = {
      type: 'mt_gateway',
      broker: 'XM',
      platform: 'MT5',
      serverName: 'XMGlobal-Real 55',
      login: '10982341',
      investorPassword: 'SecretInvestorPassword99!',
    };

    const secretRef = await vault.storeSecret('AccountConnectorService', creds);
    expect(secretRef).toMatch(/^vault_sec_[0-9a-f]{32}$/);

    // Retrieve and verify integrity
    const decrypted = await vault.getSecret('MTGatewayWorker', secretRef);
    expect(decrypted).toEqual(creds);
  });

  it('should block unauthorized callers from reading or writing secrets', async () => {
    const creds: ExnessNativeCredentials = {
      type: 'exness_native',
      broker: 'Exness',
      apiKey: 'exness_api_key_abc123',
      apiSecret: 'exness_secret_xyz789',
    };

    // Unauthorized writer
    await expect(
      vault.storeSecret('AnalyticsService', creds)
    ).rejects.toThrow(/not authorized/);

    // Store legitimately
    const ref = await vault.storeSecret('AccountConnectorService', creds);

    // Unauthorized reader (e.g. LeaderboardService should never touch raw credentials per §1)
    await expect(
      vault.getSecret('LeaderboardService', ref)
    ).rejects.toThrow(/not authorized/);
  });

  it('should maintain an audit log of all access attempts', async () => {
    const logs = vault.getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some(l => l.callerService === 'AccountConnectorService' && l.action === 'STORE')).toBe(true);
    expect(logs.some(l => l.callerService === 'LeaderboardService' && !l.success)).toBe(true);
  });
});
