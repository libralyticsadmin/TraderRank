import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Gift,
} from 'lucide-react';

import { BrokerSymbol } from './BrokerSymbol.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { BROKER_PARTNERS } from '../../../shared/src/config/brokerPartners.ts';

interface OnboardingJobView {
  id: string;
  status: 'PROVISIONING' | 'CONNECTING' | 'CONNECTED' | 'FAILED';
  reason?: string;
  error?: string;
  login: string;
  serverName: string;
  account?: TradingAccount;
}

interface ConnectionWizardProps {
  onClose: () => void;
  onSuccess: (account: TradingAccount) => void;
}

const BROKERS: { id: Broker; name: string; tag: string; desc: string; url?: string }[] = [
  { id: 'IC_MARKETS', name: 'IC Markets / IC Trading', tag: 'Raw Spread ECN', desc: 'World leader in True ECN raw spread trading & MT4/MT5 accounts', url: 'https://www.ic.com/en/?camp=57406' },
  { id: 'XM', name: 'XM Global', tag: 'MT4 / MT5', desc: 'Connect via MT4/MT5 Gateway with Investor Password' },
  { id: 'XMTrading', name: 'XMTrading (Japan JPY)', tag: 'Tokyo JPY Server', desc: 'Japan regulated JPY base accounts (XMTrading-MT5 / Real)', url: 'https://clicks.pipaffiliates.com/c?c=traderrank_jp' },
  { id: 'Exness', name: 'Exness', tag: 'Dual Path', desc: 'Official Native REST/WS API or MT4/MT5 Gateway' },
  { id: 'Axiory', name: 'Axiory', tag: 'MT4 / MT5', desc: 'Direct bridge via broker-agnostic Gateway' },
  { id: 'Vantage', name: 'Vantage FX', tag: 'MT4 / MT5', desc: 'Secure read-only investor feed' },
  { id: 'Vanguard', name: 'Vanguard Markets', tag: 'Index & CFDs', desc: 'Institutional index and Forex execution bridge' },
  { id: 'OTHER', name: 'Other MT4/MT5 Broker', tag: 'Universal', desc: 'Any MetaTrader server globally' },
];

export const ConnectionWizard: React.FC<ConnectionWizardProps> = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedBroker, setSelectedBroker] = useState<Broker>('IC_MARKETS');
  const [selectedPath, setSelectedPath] = useState<IntegrationType>('mt_gateway');
  const [platform, setPlatform] = useState<Platform>('MT5');

  // Form states - Gateway
  const [serverName, setServerName] = useState('ICMarketsSC-Live01');
  const [login, setLogin] = useState('');
  const [investorPassword, setInvestorPassword] = useState('');

  // Form states - Exness Native
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accountId, setAccountId] = useState('');

  // Validation states
  const [isValidating, setIsValidating] = useState(false);
  const [validationStage, setValidationStage] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live mode: broker verification runs as a background onboarding job on the server
  const [onboarding, setOnboarding] = useState<OnboardingJobView | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<TradingAccount | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };
  useEffect(() => stopPolling, []);

  // Partner Affiliate helper state
  const [showSubAccountGuide, setShowSubAccountGuide] = useState(false);
  const [showAllServers, setShowAllServers] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [onboardingSeconds, setOnboardingSeconds] = useState(0);

  // Keyboard escape route
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBrokerSelect = (broker: Broker) => {
    setSelectedBroker(broker);
    if (broker === 'Exness') {
      setSelectedPath('exness_native');
    } else {
      setSelectedPath('mt_gateway');
      if (broker === 'IC_MARKETS') setServerName('ICMarketsSC-Live01');
      if (broker === 'XM') setServerName('XMGlobal-MT5 10');
      if (broker === 'Axiory') setServerName('Axiory-Live 01');
      if (broker === 'Vantage') setServerName('VantageFX-Live 2');
      if (broker === 'OTHER') setServerName('MetaQuotes-Demo');
    }
    setStep(2);
  };

  const handleRunPreflightCheck = async () => {
    setIsValidating(true);
    setValidationStage(1);
    setErrorMessage(null);
    setValidationResult(null);

    const timer1 = setTimeout(() => setValidationStage(2), 2000);
    const timer2 = setTimeout(() => setValidationStage(3), 5000);

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

    // Hard client-side ceiling so the preflight spinner can never hang indefinitely
    const abortController = new AbortController();
    const abortTimer = setTimeout(() => abortController.abort(), 45000);

    try {
      const token = localStorage.getItem('traderank_auth_token_v1');
      const res = await fetch('/api/connector/validate', {
        signal: abortController.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          broker: selectedBroker,
          credentials: payloadCreds,
        }),
      });
      let data: ValidationResult;
      try {
        data = await res.json();
      } catch {
        // Upstream proxy/gateway timeouts return HTML, not JSON
        throw new Error(`Broker validation service unavailable (HTTP ${res.status}). Please try again.`);
      }
      if (data.success && data.pendingBrokerVerification) {
        // Live mode: start the background onboarding job and track it here
        await startOnboarding(payloadCreds);
        return;
      }
      setValidationResult(data);

      if (!data.success) {
        setErrorMessage(data.error || 'Connection validation failed');
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorMessage('Broker server did not respond in time. MetaApi may still be connecting your account — please retry in a minute.');
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Network error during validation');
      }
    } finally {
      clearTimeout(abortTimer);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsValidating(false);
      setValidationStage(0);
    }
  };

  const applyOnboardingUpdate = (job: OnboardingJobView) => {
    setOnboarding(job);
    if (job.status === 'CONNECTED' && job.account) {
      stopPolling();
      const acc = job.account;
      setConnectedAccount(acc);
      setValidationResult({
        success: true,
        accountDetails: {
          accountNumber: acc.accountNumber,
          server: acc.serverName,
          balance: acc.balance,
          equity: acc.equity,
          currency: acc.currency,
          leverage: acc.leverage,
        },
      });
      onSuccess(acc);
    } else if (job.status === 'FAILED') {
      stopPolling();
      setValidationResult({ success: false, error: job.error });
      setErrorMessage(job.error || 'Broker connection failed');
    }
  };

  const startOnboarding = async (payloadCreds: GatewayCredentials | ExnessNativeCredentials) => {
    if (!user) {
      setValidationResult({ success: false });
      setErrorMessage('Authentication required: Please sign in or create an account to connect your trading account.');
      return;
    }
    const token = localStorage.getItem('traderank_auth_token_v1');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch('/api/connector/connect', {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        userId: user.id,
        username: user.username,
        broker: selectedBroker,
        credentials: payloadCreds,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.onboardingId) {
      setValidationResult({ success: false });
      setErrorMessage(data.error || `Could not start broker connection (HTTP ${res.status}).`);
      return;
    }
    if (data.token) {
      try {
        localStorage.setItem('traderank_auth_token_v1', data.token);
      } catch {
        // ignore
      }
    }
    applyOnboardingUpdate(data.onboarding);

    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const curToken = localStorage.getItem('traderank_auth_token_v1');
        const pollHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(curToken ? { Authorization: `Bearer ${curToken}` } : {}),
        };
        const r = await fetch(`/api/connector/onboarding/${data.onboardingId}?userId=${encodeURIComponent(user.id)}`, {
          headers: pollHeaders,
          signal: AbortSignal.timeout(15000),
        });
        if (!r.ok) return;
        const body = await r.json();
        if (body.onboarding) applyOnboardingUpdate(body.onboarding);
      } catch {
        // transient network error; keep polling
      }
    }, 3000);
  };

  const isOnboardingActive = onboarding?.status === 'PROVISIONING' || onboarding?.status === 'CONNECTING';

  useEffect(() => {
    if (!isOnboardingActive) {
      setOnboardingSeconds(0);
      return;
    }
    const t = setInterval(() => setOnboardingSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [isOnboardingActive]);

  const handleFinalConnect = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Authentication required: Please sign in or create an account to connect your trading account.');
      setIsSubmitting(false);
      return;
    }

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
      const token = localStorage.getItem('traderank_auth_token_v1');
      const res = await fetch('/api/connector/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user?.id,
          username: user?.username || (login ? `TraderRank-${login}` : (accountId ? `TraderRank-${accountId}` : 'TraderRank-User')),
          broker: selectedBroker,
          credentials: payloadCreds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect account');
      }

      if (data.onboardingId) {
        if (data.onboarding) applyOnboardingUpdate(data.onboarding);
        setIsSubmitting(false);
        return;
      }

      if (!data.account) {
        throw new Error(data.error || 'Failed to connect account');
      }

      try {
        if (user?.username && data.account.accountNumber) {
          const rawMap = localStorage.getItem('traderank_account_usernames_v1');
          const parsedMap = rawMap ? JSON.parse(rawMap) : {};
          parsedMap[String(data.account.accountNumber)] = user.username;
          if (data.account.id) parsedMap[String(data.account.id)] = user.username;
          localStorage.setItem('traderank_account_usernames_v1', JSON.stringify(parsedMap));
        }
      } catch {
        // ignore
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
    <div
      className="modal-overlay"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <LanguageSelector variant="compact" />
          <button className="modal-close" onClick={onClose} aria-label="Close" style={{ position: 'static' }}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="stepper-header" style={{ marginBottom: '16px' }}>
          <div className="stepper-step">
            <div className={`step-bubble ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>1</div>
            <span className="step-label">{t.connector.stepBroker}</span>
          </div>
          <div className="stepper-step">
            <div className={`step-bubble ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>2</div>
            <span className="step-label">{t.connector.routeTitle.replace('{broker}', selectedBroker || 'Broker')}</span>
          </div>
          <div className="stepper-step">
            <div className={`step-bubble ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>3</div>
            <span className="step-label">{t.connector.stepCredentials}</span>
          </div>
          <div className="stepper-step">
            <div className={`step-bubble ${step === 4 ? 'active' : ''}`}>4</div>
            <span className="step-label">{t.connector.stepVerification}</span>
          </div>
        </div>

        {/* Step 1: Broker Selection */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>{t.connector.selectBroker}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              {t.connector.selectBrokerDesc}
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>{t.connector.routeTitle} ({selectedBroker})</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '18px' }}>
              {t.connector.routeDesc}
            </p>

            {selectedBroker === 'Exness' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  className={`broker-card ${selectedPath === 'mt_gateway' ? 'selected' : ''}`}
                  onClick={() => setSelectedPath('mt_gateway')}
                >
                  <Server size={28} color="#0abab5" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{t.connector.mtGatewayTitle}</strong>
                      <span className="brand-badge">Recommended for Exness App & MT4/MT5</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Connect using your Exness Account Number, Server, and Read-Only (Investor) Password.
                    </p>
                  </div>
                </div>

                <div
                  className={`broker-card ${selectedPath === 'exness_native' ? 'selected' : ''}`}
                  onClick={() => setSelectedPath('exness_native')}
                >
                  <Zap size={28} color="#81d8d0" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{t.connector.exnessNativeTitle}</strong>
                      <span className="brand-badge">B2B / OpenAPI</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {t.connector.exnessNativeDesc}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="broker-card selected" style={{ cursor: 'default' }}>
                <Server size={28} color="#0abab5" />
                <div>
                  <strong>{t.connector.brokerAgnosticTitle}</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {t.connector.brokerAgnosticDesc}
                  </p>
                </div>
              </div>
            )}

            <div className="modal-sticky-footer">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> {t.connector.backStep}
              </button>
              <button className="btn-primary" onClick={() => setStep(3)}>
                {t.connector.nextStep} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Credential Entry */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>{t.connector.credentialsTitle}</h2>
            
            {/* Security Guarantee Notice */}
            <div className="security-callout" style={{ padding: '8px 12px', marginBottom: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={15} color="#00f0ff" style={{ flexShrink: 0 }} />
              <div>
                <strong>{t.connector.securityCalloutTitle}:</strong> Read-only access. Investor passwords cannot trade. AES-256-GCM encrypted.
              </div>
            </div>

            {/* Official Partner Affiliate Registration & Sub-Account Banner */}
            {(() => {
              const partner = BROKER_PARTNERS[selectedBroker] || BROKER_PARTNERS.IC_MARKETS;
              return (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(14, 20, 31, 0.95) 100%)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Gift size={14} color="#00F0FF" />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>
                        Need a {partner.displayName} Account?
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '8px',
                          background: 'rgba(0, 218, 198, 0.15)',
                          border: '1px solid #00DAC6',
                          color: '#00DAC6',
                        }}
                      >
                        +500 XP
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <a
                        href={partner.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'linear-gradient(90deg, #00F0FF 0%, #00DAC6 100%)',
                          color: '#080E14',
                          fontWeight: 800,
                          fontSize: '11px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Open Account</span>
                        <ExternalLink size={10} />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(partner.partnerCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: copiedCode ? '#00DAC6' : '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {copiedCode ? <Check size={10} /> : <Copy size={10} />}
                        <span>Code: {partner.partnerCode}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-Account Accordion Toggle for Existing Users */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setShowSubAccountGuide(!showSubAccountGuide)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#848E9C',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Already have an account? Create a 30s sub-account with code</span>
                      {showSubAccountGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {showSubAccountGuide && (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '11px',
                          color: '#CBD5E1',
                        }}
                      >
                        <ol style={{ margin: '0 0 6px 14px', padding: 0, lineHeight: 1.5 }}>
                          {partner.subAccountGuide.steps.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ol>
                        <div style={{ fontSize: '10px', color: '#848E9C', fontStyle: 'italic' }}>
                          💡 {partner.subAccountGuide.note}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {selectedPath === 'mt_gateway' ? (
              <div>
                <div className="form-group" style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">{t.connector.platform}</label>
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
                    <label className="form-label">{t.connector.brokerServerName}</label>
                    <input
                      className="form-input"
                      value={serverName}
                      onChange={e => setServerName(e.target.value)}
                      placeholder={selectedBroker === 'IC_MARKETS' ? 'e.g. ICMarketsSC-Live01' : 'e.g. XMGlobal-Real 55'}
                    />
                  </div>
                </div>

                {(() => {
                  const serverPresets: Record<string, string[]> = {
                    IC_MARKETS: ['ICMarketsSC-Live01', 'ICMarketsSC-Live02', 'ICMarkets-Live 01', 'ICMarketsGlobal-Live01', 'ICTrading-Live01'],
                    XM: [
                      'XMGlobal-MT5', 'XMGlobal-MT5 2', 'XMGlobal-MT5 3', 'XMGlobal-MT5 4', 'XMGlobal-MT5 5',
                      'XMGlobal-MT5 6', 'XMGlobal-MT5 7', 'XMGlobal-MT5 8', 'XMGlobal-MT5 9', 'XMGlobal-MT5 10',
                      'XMGlobal-MT5 16', 'XMGlobal-Real 1', 'XMGlobal-Real 21', 'XMGlobal-Real 55', 'XMTrading-MT5 (JPY)'
                    ],
                    XMTrading: ['XMTrading-MT5', 'XMTrading-MT5 2', 'XMTrading-Real 1', 'XMTrading-Real 21', 'XMTrading-Real 50', 'XMTrading-Demo'],
                    Exness: ['Exness-MT5Real', 'Exness-MT5Real2', 'Exness-MT5Real3', 'Exness-MT5Real9', 'Exness-Real1', 'Exness-Real2', 'Exness-Real9', 'Exness-Real10'],
                    Axiory: ['Axiory-Live 01', 'Axiory-Live 02', 'AxioryAsia-Live'],
                    Vantage: ['VantageFX-Live 2', 'VantageFX-Live 1', 'VantageInternational-Live 1'],
                    Vanguard: ['Vanguard-Live', 'Vanguard-MT5', 'Vanguard-Demo'],
                  };
                  const currentPresets = serverPresets[selectedBroker];
                  if (!currentPresets) return null;

                  const visiblePresets = showAllServers ? currentPresets : currentPresets.slice(0, 6);

                  return (
                    <div style={{ marginBottom: '10px', marginTop: '-4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {t.connector.popularServers} ({selectedBroker}):
                        </span>
                        {currentPresets.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setShowAllServers(!showAllServers)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#0abab5',
                              fontSize: '11px',
                              cursor: 'pointer',
                              padding: '0 2px',
                            }}
                          >
                            {showAllServers ? 'Show less' : `+${currentPresets.length - 6} more`}
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {visiblePresets.map(srv => (
                          <button
                            key={srv}
                            type="button"
                            onClick={() => {
                              setServerName(srv);
                              if (srv.toLowerCase().includes('mt5')) setPlatform('MT5');
                              else if (srv.toLowerCase().includes('real') && !srv.toLowerCase().includes('mt5')) setPlatform('MT4');
                            }}
                            style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: serverName === srv ? 'rgba(10, 186, 181, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${serverName === srv ? '#0abab5' : 'var(--border-subtle)'}`,
                              color: serverName === srv ? '#81d8d0' : 'var(--text-muted)',
                              fontSize: '10.5px',
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                            }}
                          >
                            {srv}
                          </button>
                        ))}
                      </div>
                      {selectedBroker === 'IC_MARKETS' && (
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>
                          <a
                            href="https://www.ic.com/en/?camp=57406"
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#0abab5', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {t.connector.findIcServer} →
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">{t.connector.accountLoginNumber}</label>
                  <input
                    className="form-input tabular"
                    value={login}
                    onChange={e => setLogin(e.target.value)}
                    placeholder="e.g. 10982341"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">{t.connector.investorPassword}</label>
                  <input
                    type="password"
                    className="form-input tabular"
                    value={investorPassword}
                    onChange={e => setInvestorPassword(e.target.value)}
                    placeholder="Investor password only"
                    autoComplete="new-password"
                  />
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#0abab5" style={{ flexShrink: 0 }} />
                    <span><strong>Investor Password only:</strong> In MT4/MT5, right-click account → <em>Change Password</em> → select <em>Investor Password</em>. Never enter master password.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">{t.connector.exnessAccountId}</label>
                  <input
                    className="form-input tabular"
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    placeholder="e.g. EXN-8812903"
                    autoComplete="off"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">{t.connector.exnessApiKey}</label>
                  <input
                    className="form-input tabular"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Generated from Exness Personal Area"
                    autoComplete="off"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">{t.connector.exnessApiSecret}</label>
                  <input
                    type="password"
                    className="form-input tabular"
                    value={apiSecret}
                    onChange={e => setApiSecret(e.target.value)}
                    placeholder="Secret Key"
                    autoComplete="new-password"
                  />
                  <span className="form-tip">
                    <Key size={14} color="#81d8d0" /> {t.connector.exnessApiHint}
                  </span>
                </div>
              </div>
            )}

            <div className="modal-sticky-footer">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> {t.connector.backStep}
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setStep(4);
                  handleRunPreflightCheck();
                }}
              >
                {t.connector.runPreflight} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Verification Diagnostic & Final Save */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>{t.connector.diagnosticsTitle}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              {t.connector.diagnosticsDesc}
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px',
            }}>
              {isOnboardingActive ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '12px', textAlign: 'center' }}>
                  <Loader2 size={36} color="#0abab5" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '14px', color: '#81d8d0', fontWeight: 600 }}>
                    {onboarding?.status === 'PROVISIONING'
                      ? `1/2 Registering account with broker bridge (${onboardingSeconds}s)...`
                      : `2/2 Authenticating with ${onboarding?.serverName || serverName} (${onboardingSeconds}s)...`}
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'left', width: '100%', maxWidth: '360px' }}>
                    <div>Account: <strong style={{ color: '#fff' }}>{login || onboarding?.login}</strong></div>
                    <div>Broker: <strong style={{ color: '#fff' }}>{selectedBroker}</strong></div>
                    <div style={{ gridColumn: 'span 2' }}>Server: <strong style={{ color: '#00f0ff' }}>{serverName || onboarding?.serverName}</strong></div>
                  </div>
                  {onboardingSeconds > 40 && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#fbbf24', maxWidth: '420px', textAlign: 'left' }}>
                      ⏳ <strong>Taking longer than expected:</strong> Broker servers usually respond in 15–30 seconds. If this persists, verify that your <strong>Investor (read-only) Password</strong> is set in MT5 (Tools &gt; Options &gt; Server &gt; Change Password &gt; Change Investor Password).
                    </div>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.4 }}>
                    Connecting securely via read-only bridge. You can close this window and monitor status under "Connected Accounts".
                  </span>
                </div>
              ) : isValidating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '12px' }}>
                  <Loader2 size={36} color="#0abab5" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '14px', color: '#81d8d0', fontWeight: 600 }}>
                    {validationStage === 1 && '1/3 Connecting to broker gateway...'}
                    {validationStage === 2 && '2/3 Pinging broker server & verifying Investor Password...'}
                    {validationStage >= 3 && '3/3 Testing read-only zero-write permissions & balance...'}
                    {validationStage === 0 && (t.connector.pingingBroker || 'Pinging broker server & testing read permissions...')}
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Enterprise SSL • Read-Only Zero-Write Bridge
                  </span>
                </div>
              ) : (validationResult?.success && validationResult.accountDetails && typeof validationResult.accountDetails.balance === 'number' && !validationResult.pendingBrokerVerification) ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-green)', marginBottom: '14px' }}>
                    <CheckCircle2 size={24} />
                    <strong style={{ fontSize: '16px' }}>{t.connector.preflightPassedTitle}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>{t.connector.brokerLabel}</span> <strong>{selectedBroker}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>{t.connector.integrationLabel}</span> <strong>{selectedPath === 'mt_gateway' ? 'MT Gateway' : 'Exness Native'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>{t.connector.accountLabel}</span> <span className="tabular">{validationResult.accountDetails.accountNumber}</span></div>
                    {(() => {
                      const cur = (validationResult.accountDetails.currency || 'USD').toUpperCase();
                      const isJpy = cur === 'JPY';
                      const curSym = isJpy ? '¥' : cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : '$';
                      const balStr = isJpy
                        ? `${curSym}${Math.round(validationResult.accountDetails.balance || 0).toLocaleString()} JPY`
                        : `${curSym}${(validationResult.accountDetails.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
                      const eqStr = isJpy
                        ? `${curSym}${Math.round(validationResult.accountDetails.equity || 0).toLocaleString()}`
                        : `${curSym}${(validationResult.accountDetails.equity || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                      return (
                        <>
                          <div><span style={{ color: 'var(--text-muted)' }}>{t.connector.balanceLabel}</span> <span className="tabular">{balStr}</span></div>
                          <div><span style={{ color: 'var(--text-muted)' }}>{t.connector.equityLabel}</span> <span className="tabular">{eqStr}</span></div>
                        </>
                      );
                    })()}
                    <div><span style={{ color: 'var(--text-muted)' }}>{t.connector.leverageLabel}</span> <span className="tabular">1:{validationResult.accountDetails.leverage}</span></div>
                    {validationResult.accountDetails.metaApiAccountId && (
                      <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                        <span style={{
                          background: 'rgba(10,186,181,0.15)',
                          color: '#0abab5',
                          border: '1px solid rgba(10,186,181,0.35)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <Zap size={13} color="#0abab5" /> MetaApi Cloud Bridge Active (Encrypted)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-red)', marginBottom: '10px' }}>
                    <AlertCircle size={24} />
                    <strong style={{ fontSize: '16px' }}>{t.connector.connectionFailedTitle}</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.5, marginBottom: '12px' }}>
                    {errorMessage || 'Broker server rejected connection credentials. Please verify your exact server name and investor password.'}
                  </p>
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#fca5a5' }}>
                    <strong>Common fixes:</strong>
                    <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                      <li>Verify your <strong>Server Name</strong> in your broker welcome email (e.g. XMGlobal-MT5, XMGlobal-MT5 2, XMGlobal-Real 55, etc.).</li>
                      <li>Ensure you are using the <strong>Investor (read-only) Password</strong>, not your broker website portal password.</li>
                      <li>Confirm whether your account is <strong>MT4</strong> or <strong>MT5</strong>.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-sticky-footer">
              <button className="btn-secondary" onClick={() => { stopPolling(); setOnboarding(null); setConnectedAccount(null); setStep(3); }}>
                <ArrowLeft size={16} /> {t.connector.editCredentials}
              </button>
              {connectedAccount ? (
                <button className="btn-primary" onClick={onClose}>
                  <CheckCircle2 size={16} /> Done
                </button>
              ) : isOnboardingActive ? (
                <button className="btn-secondary" onClick={onClose}>
                  Continue in background
                </button>
              ) : (validationResult?.success && validationResult.accountDetails && typeof validationResult.accountDetails.balance === 'number' && !validationResult.pendingBrokerVerification) && (
                <button
                  className="btn-primary"
                  onClick={handleFinalConnect}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> {t.connector.persistingToVault}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> {t.connector.confirmIngestTrades}
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
