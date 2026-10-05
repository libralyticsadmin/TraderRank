import React, { useState } from 'react';
import {
  Broker,
  IntegrationType,
  Platform,
  GatewayCredentials,
  ExnessNativeCredentials,
  ValidationResult,
  TradingAccount,
} from '../../../shared/src/types.ts';
import {
  ShieldCheck,
  Server,
  Key,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Lock,
  Zap,
  Loader2,
} from 'lucide-react';

import { BrokerSymbol } from './BrokerSymbol.tsx';

interface ConnectionWizardProps {
  onClose: () => void;
  onSuccess: (account: TradingAccount) => void;
}

const BROKERS: { id: Broker; name: string; tag: string; desc: string; url?: string }[] = [
  { id: 'IC_MARKETS', name: 'IC Markets / IC Trading', tag: 'Raw Spread ECN', desc: 'World leader in True ECN raw spread trading & MT4/MT5 accounts', url: 'https://www.ic.com/en/?camp=57406' },
  { id: 'XM', name: 'XM Global', tag: 'MT4 / MT5', desc: 'Connect via MT4/MT5 Gateway with Investor Password' },
  { id: 'Axiory', name: 'Axiory', tag: 'MT4 / MT5', desc: 'Direct bridge via broker-agnostic Gateway' },
  { id: 'Exness', name: 'Exness', tag: 'Dual Path', desc: 'Official Native REST/WS API or MT4/MT5 Gateway' },
  { id: 'Vantage', name: 'Vantage FX', tag: 'MT4 / MT5', desc: 'Secure read-only investor feed' },
  { id: 'OTHER', name: 'Other MT4/MT5 Broker', tag: 'Universal', desc: 'Any MetaTrader server globally' },
];

export const ConnectionWizard: React.FC<ConnectionWizardProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedBroker, setSelectedBroker] = useState<Broker>('IC_MARKETS');
  const [selectedPath, setSelectedPath] = useState<IntegrationType>('mt_gateway');
  const [platform, setPlatform] = useState<Platform>('MT5');

  // Form states - Gateway
  const [serverName, setServerName] = useState('ICMarketsSC-Live01');
  const [login, setLogin] = useState('10982341');
  const [investorPassword, setInvestorPassword] = useState('ReadOnlyInvestorPass99!');

  // Form states - Exness Native
  const [apiKey, setApiKey] = useState('exn_live_key_99382104');
  const [apiSecret, setApiSecret] = useState('exn_secret_hash_882019482');
  const [accountId, setAccountId] = useState('EXN-8812903');

  // Validation states
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBrokerSelect = (broker: Broker) => {
    setSelectedBroker(broker);
    if (broker === 'Exness') {
      setSelectedPath('exness_native');
    } else {
      setSelectedPath('mt_gateway');
      if (broker === 'IC_MARKETS') setServerName('ICMarketsSC-Live01');
      if (broker === 'XM') setServerName('XMGlobal-Real 55');
      if (broker === 'Axiory') setServerName('Axiory-Live 01');
      if (broker === 'Vantage') setServerName('VantageFX-Live 2');
      if (broker === 'OTHER') setServerName('MetaQuotes-Demo');
    }
    setStep(2);
  };

  const handleRunPreflightCheck = async () => {
    setIsValidating(true);
    setErrorMessage(null);
    setValidationResult(null);

    const payloadCreds = selectedPath === 'mt_gateway'
      ? ({
          type: 'mt_gateway',
          broker: selectedBroker,
          platform: platform as 'MT4' | 'MT5',
          serverName,
          login,
          investorPassword,
        } as GatewayCredentials)
      : ({
          type: 'exness_native',
          broker: 'Exness',
          apiKey,
          apiSecret,
          accountId,
        } as ExnessNativeCredentials);

    try {
      const res = await fetch('/api/connector/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: selectedBroker,
          credentials: payloadCreds,
        }),
      });
      const data: ValidationResult = await res.json();
      setValidationResult(data);

      if (!data.success) {
        setErrorMessage(data.error || 'Connection validation failed');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error during validation');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFinalConnect = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payloadCreds = selectedPath === 'mt_gateway'
      ? ({
          type: 'mt_gateway',
          broker: selectedBroker,
          platform: platform as 'MT4' | 'MT5',
          serverName,
          login,
          investorPassword,
        } as GatewayCredentials)
      : ({
          type: 'exness_native',
          broker: 'Exness',
          apiKey,
          apiSecret,
          accountId,
        } as ExnessNativeCredentials);

    try {
      const res = await fetch('/api/connector/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u_active_trader',
          username: 'AlphaTrader',
          broker: selectedBroker,
          credentials: payloadCreds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.account) {
        throw new Error(data.error || 'Failed to connect account');
      }

      onSuccess(data.account);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Stepper */}
        <div className="stepper-header">
          <div className="stepper-step">
            <div className={`step-bubble ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>1</div>
            <span className="step-label">Broker</span>
          </div>
          <div className="stepper-step">
            <div className={`step-bubble ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>2</div>
            <span className="step-label">Route</span>
          </div>
          <div className="stepper-step">
            <div className={`step-bubble ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>3</div>
            <span className="step-label">Credentials</span>
          </div>
          <div className="stepper-step">
            <div className={`step-bubble ${step === 4 ? 'active' : ''}`}>4</div>
            <span className="step-label">Verify</span>
          </div>
        </div>

        {/* Step 1: Broker Selection */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Select Trading Broker</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Choose the broker hosting your trading account to route to the optimal connector.
            </p>

            <div className="broker-cards-grid">
              {BROKERS.map(b => (
                <div
                  key={b.id}
                  className={`broker-card ${selectedBroker === b.id ? 'selected' : ''}`}
                  onClick={() => handleBrokerSelect(b.id)}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BrokerSymbol broker={b.id} size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '14px' }}>{b.name}</strong>
                      <span className="brand-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>{b.tag}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.3 }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Route Selection */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Integration Path for {selectedBroker}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '18px' }}>
              Per TraderRank PRD §5.3 routing logic, select the connector architecture.
            </p>

            {selectedBroker === 'Exness' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  className={`broker-card ${selectedPath === 'exness_native' ? 'selected' : ''}`}
                  onClick={() => setSelectedPath('exness_native')}
                >
                  <Zap size={28} color="#81d8d0" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>Exness Native API (Recommended)</strong>
                      <span className="brand-badge">Optimized</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Direct official REST & WebSocket feed. Zero gateway latency, zero third-party subscription fees.
                    </p>
                  </div>
                </div>

                <div
                  className={`broker-card ${selectedPath === 'mt_gateway' ? 'selected' : ''}`}
                  onClick={() => setSelectedPath('mt_gateway')}
                >
                  <Server size={28} color="#0abab5" />
                  <div>
                    <strong>MT4/MT5 Gateway (Fallback)</strong>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Standard connector for Exness MT4/MT5 accounts without an issued API key.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="broker-card selected" style={{ cursor: 'default' }}>
                <Server size={28} color="#0abab5" />
                <div>
                  <strong>Broker-Agnostic MT4/MT5 Gateway</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Standard connector covering {selectedBroker} through cloud investor-password bridge.
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn-primary" onClick={() => setStep(3)}>
                Next: Credentials <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Credential Entry */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Enter Read-Only Credentials</h2>
            
            {/* Security Guarantee Notice */}
            <div className="security-callout">
              <Lock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Zero Trade-Placement Risk:</strong> TraderRank only requires read-only access. Investor passwords cannot open or close trades. Credentials are encrypted via AES-256-GCM in the isolated Secrets Vault.
              </div>
            </div>

            {selectedPath === 'mt_gateway' ? (
              <div>
                <div className="form-group" style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Platform</label>
                    <select
                      className="form-input"
                      value={platform}
                      onChange={e => setPlatform(e.target.value as Platform)}
                    >
                      <option value="MT5">MetaTrader 5 (MT5)</option>
                      <option value="MT4">MetaTrader 4 (MT4)</option>
                    </select>
                  </div>
                  <div style={{ flex: 2 }}>
                    <label className="form-label">Broker Server Name</label>
                    <input
                      className="form-input"
                      value={serverName}
                      onChange={e => setServerName(e.target.value)}
                      placeholder={selectedBroker === 'IC_MARKETS' ? 'e.g. ICMarketsSC-Live01' : 'e.g. XMGlobal-Real 55'}
                    />
                  </div>
                </div>

                {selectedBroker === 'IC_MARKETS' && (
                  <div style={{ marginBottom: '14px', marginTop: '-4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Popular IC Markets / IC Trading Servers:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['ICMarketsSC-Live01', 'ICMarketsSC-Live02', 'ICMarkets-Live 01', 'ICMarketsGlobal-Live01', 'ICTrading-Live01'].map(srv => (
                        <button
                          key={srv}
                          type="button"
                          onClick={() => setServerName(srv)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: serverName === srv ? 'rgba(10, 186, 181, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                            border: `1px solid ${serverName === srv ? '#0abab5' : 'var(--border-subtle)'}`,
                            color: serverName === srv ? '#81d8d0' : 'var(--text-muted)',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                          }}
                        >
                          {srv}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '6px' }}>
                      <a
                        href="https://www.ic.com/en/?camp=57406"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#0abab5', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Find your IC Markets server / Create Raw Spread Account (ic.com) →
                      </a>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Account Login / Number</label>
                  <input
                    className="form-input tabular"
                    value={login}
                    onChange={e => setLogin(e.target.value)}
                    placeholder="e.g. 10982341"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Investor (Read-Only) Password</label>
                  <input
                    type="password"
                    className="form-input tabular"
                    value={investorPassword}
                    onChange={e => setInvestorPassword(e.target.value)}
                    placeholder="Investor password only"
                  />
                  <span className="form-tip">
                    <ShieldCheck size={14} color="#0abab5" /> Never enter your master trading password. Read-only investor password only.
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Exness Account ID (Optional)</label>
                  <input
                    className="form-input tabular"
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    placeholder="e.g. EXN-8812903"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Exness API Key</label>
                  <input
                    className="form-input tabular"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Generated from Exness Personal Area"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Exness Secret Key</label>
                  <input
                    type="password"
                    className="form-input tabular"
                    value={apiSecret}
                    onChange={e => setApiSecret(e.target.value)}
                    placeholder="Secret Key"
                  />
                  <span className="form-tip">
                    <Key size={14} color="#81d8d0" /> Generated from Exness Settings &gt; API Access after KYC Tier-2.
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setStep(4);
                  handleRunPreflightCheck();
                }}
              >
                Verify &amp; Connect <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Verification Diagnostic & Final Save */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Connection Diagnostics</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Running synchronous test read call per PRD §6 step 4 before persisting to database.
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px',
            }}>
              {isValidating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '12px' }}>
                  <Loader2 size={36} color="#0abab5" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Pinging broker server &amp; testing read permissions...</p>
                </div>
              ) : validationResult?.success ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-green)', marginBottom: '14px' }}>
                    <CheckCircle2 size={24} />
                    <strong style={{ fontSize: '16px' }}>Pre-Flight Connection Passed</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Broker:</span> <strong>{selectedBroker}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Integration:</span> <strong>{selectedPath === 'mt_gateway' ? 'MT Gateway' : 'Exness Native'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Account:</span> <span className="tabular">{validationResult.accountDetails?.accountNumber}</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Balance:</span> <span className="tabular">${validationResult.accountDetails?.balance.toLocaleString()} {validationResult.accountDetails?.currency}</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Equity:</span> <span className="tabular">${validationResult.accountDetails?.equity.toLocaleString()}</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Leverage:</span> <span className="tabular">1:{validationResult.accountDetails?.leverage}</span></div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-red)', marginBottom: '10px' }}>
                    <AlertCircle size={24} />
                    <strong style={{ fontSize: '16px' }}>Connection Failed</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.4 }}>
                    {errorMessage || 'Broker server rejected connection credentials.'}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-secondary" onClick={() => setStep(3)}>
                <ArrowLeft size={16} /> Edit Credentials
              </button>
              {validationResult?.success && (
                <button
                  className="btn-primary"
                  onClick={handleFinalConnect}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Persisting to Vault...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Confirm &amp; Ingest Trades
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
