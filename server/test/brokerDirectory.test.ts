import { describe, it, expect } from 'vitest';
import { BrokerDirectory } from '../src/connector/brokerDirectory.js';

describe('Piece 2: Multi-Broker Directory & Investor Authentication', () => {
  const directory = BrokerDirectory.getInstance();

  it('correctly resolves broker identity from server name for Exness, XM, Axiory, Vantage', () => {
    expect(directory.resolveBroker('Exness-MT5Real')).toBe('EXNESS');
    expect(directory.resolveBroker('XMGlobal-Real 55')).toBe('XM');
    expect(directory.resolveBroker('Axiory-Live')).toBe('AXIORY');
    expect(directory.resolveBroker('VantageFX-Live')).toBe('VANTAGE');
    expect(directory.resolveBroker('UnknownFx-Server')).toBe('OTHER');
  });

  it('filters supported servers by broker and distinguishes demo from real', () => {
    const exnessServers = directory.getSupportedServers('EXNESS');
    expect(exnessServers.length).toBeGreaterThanOrEqual(3);
    const hasDemo = exnessServers.some(s => s.isDemo);
    const hasReal = exnessServers.some(s => !s.isDemo);
    expect(hasDemo).toBe(true);
    expect(hasReal).toBe(true);
  });

  it('validates legitimate investor credentials and returns account details with isReadOnly=true', async () => {
    const res = await directory.validateInvestorCredentials({
      login: '8829104',
      investorPassword: 'ValidReadOnlyPass123',
      serverName: 'Exness-MT5Real',
      platform: 'MT5',
    });

    expect(res.valid).toBe(true);
    expect(res.broker).toBe('EXNESS');
    expect(res.accountDetails?.accountNumber).toBe('8829104');
    expect(res.accountDetails?.isReadOnly).toBe(true);
  });

  it('strictly rejects master passwords to protect user security', async () => {
    const res = await directory.validateInvestorCredentials({
      login: '8829104',
      investorPassword: 'MasterTradePassword',
      serverName: 'XMGlobal-Real 55',
      platform: 'MT5',
      isMasterPasswordProvided: true,
    });

    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe('INVESTOR_PASSWORD_REQUIRED');
    expect(res.error).toContain('investor (read-only) passwords');
  });

  it('handles offline or unreachable broker servers with SERVER_UNREACHABLE code', async () => {
    const res = await directory.validateInvestorCredentials({
      login: '8829104',
      investorPassword: 'ReadOnlyPass123',
      serverName: 'Axiory-offline-gateway',
      platform: 'MT5',
    });

    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe('SERVER_UNREACHABLE');
  });

  it('rejects invalid investor passwords with INVALID_CREDENTIALS', async () => {
    const res = await directory.validateInvestorCredentials({
      login: '8829104',
      investorPassword: 'wrong_investor_pass',
      serverName: 'VantageFX-Live',
      platform: 'MT5',
    });

    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe('INVALID_CREDENTIALS');
  });
});
