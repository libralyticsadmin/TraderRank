import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';
import { Broker } from '../../../shared/src/types.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, register } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(authModalTab);
  const [emailOrUser, setEmailOrUser] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [primaryBroker, setPrimaryBroker] = useState<Broker>('Exness');
  const [tradingStyle, setTradingStyle] = useState<'SCALPER' | 'DAY_TRADER' | 'SWING_TRADER' | 'ALGORITHMIC'>('SCALPER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync tab if opened with specific tab
  React.useEffect(() => {
    setActiveTab(authModalTab);
    setError(null);
    setSuccessMsg(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(emailOrUser, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || t.auth.signInFailed);
    } else {
      setSuccessMsg(t.auth.signInSuccess);
      setTimeout(() => {
        closeAuthModal();
      }, 500);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await register({
      username,
      email,
      password,
      primaryBroker,
      tradingStyle,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || t.auth.registerFailed);
    } else {
      setSuccessMsg(t.auth.registerSuccess);
      setTimeout(() => {
        closeAuthModal();
      }, 600);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={closeAuthModal}
    >
      <div
        className="card-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(180deg, #0e1724 0%, #090e18 100%)',
          border: '1px solid rgba(10, 186, 181, 0.35)',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(10, 186, 181, 0.2)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar: Language Selector & Close Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <LanguageSelector variant="compact" />
          <button
            type="button"
            onClick={closeAuthModal}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <BrandLogo
              size={36}
              textSize={20}
              onClick={() => {
                closeAuthModal();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
            {activeTab === 'signin' ? t.auth.signInSubtitle : t.auth.registerSubtitle}
          </p>
        </div>

        {/* Tab Switcher - Unstacked Single Row Side-by-Side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '18px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(null); }}
            style={{
              padding: '10px 8px',
              border: 'none',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              background: activeTab === 'signin' ? 'linear-gradient(135deg, #0abab5, #00f0ff)' : 'transparent',
              color: activeTab === 'signin' ? '#041c1b' : '#94a3b8',
              boxShadow: activeTab === 'signin' ? '0 2px 10px rgba(10, 186, 181, 0.35)' : 'none',
            }}
          >
            {t.auth.signInTab}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); }}
            style={{
              padding: '10px 8px',
              border: 'none',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              background: activeTab === 'register' ? 'linear-gradient(135deg, #0abab5, #00f0ff)' : 'transparent',
              color: activeTab === 'register' ? '#041c1b' : '#94a3b8',
              boxShadow: activeTab === 'register' ? '0 2px 10px rgba(10, 186, 181, 0.35)' : 'none',
            }}
          >
            {t.auth.createAccountTab}
          </button>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={14} /> {successMsg}
          </div>
        )}

        {/* Forms */}
        {activeTab === 'signin' ? (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                {t.auth.emailOrUsername}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder={t.auth.emailOrUsernamePlaceholder}
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                {t.auth.password}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0abab5, #00f0ff)',
                color: '#041c1b',
                border: 'none',
                fontWeight: 900,
                fontSize: '14px',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 15px rgba(10, 186, 181, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {loading ? t.auth.signingIn : t.auth.signInBtn}
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                {t.auth.username}
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  placeholder={t.auth.usernamePlaceholder}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                {t.auth.emailAddress}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  {t.auth.primaryBroker}
                </label>
                <select
                  value={primaryBroker}
                  onChange={(e) => setPrimaryBroker(e.target.value as Broker)}
                  style={{
                    width: '100%',
                    padding: '9px 8px',
                    borderRadius: '8px',
                    background: '#131e2d',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="Exness">Exness</option>
                  <option value="XM">XM Global</option>
                  <option value="Axiory">Axiory</option>
                  <option value="Vantage">Vantage</option>
                  <option value="IC_MARKETS">IC Markets</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  {t.auth.tradingStyle}
                </label>
                <select
                  value={tradingStyle}
                  onChange={(e) => setTradingStyle(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '9px 8px',
                    borderRadius: '8px',
                    background: '#131e2d',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="SCALPER">{t.auth.styleScalper}</option>
                  <option value="DAY_TRADER">{t.auth.styleDayTrader}</option>
                  <option value="SWING_TRADER">{t.auth.styleSwingTrader}</option>
                  <option value="ALGORITHMIC">{t.auth.styleAlgorithmic}</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                {t.auth.password}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="password"
                  placeholder={t.auth.passwordCreatePlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0abab5, #00f0ff)',
                color: '#041c1b',
                border: 'none',
                fontWeight: 900,
                fontSize: '14px',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 15px rgba(10, 186, 181, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? t.auth.registering : t.auth.registerBtn}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
          <ShieldCheck size={13} color="#0abab5" />
          <span>{t.auth.securityBadge}</span>
        </div>
      </div>
    </div>
  );
};
