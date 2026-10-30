import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Broker } from '../../../shared/src/types.ts';
import { BrandLogo } from './BrandLogo.tsx';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, register } = useAuth();

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
      setError(res.error || 'Failed to sign in');
    } else {
      setSuccessMsg('Signed in successfully!');
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
      setError(res.error || 'Failed to create account');
    } else {
      setSuccessMsg('Account created successfully! Welcome to TradeRank.live.');
      setTimeout(() => {
        closeAuthModal();
      }, 600);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setLoading(true);
    await login('Alex_Vanguard');
    setLoading(false);
    closeAuthModal();
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
          maxWidth: '460px',
          background: 'linear-gradient(180deg, #0e1724 0%, #090e18 100%)',
          border: '1px solid rgba(10, 186, 181, 0.35)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(10, 186, 181, 0.2)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <BrandLogo size={36} textSize={20} />
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            {activeTab === 'signin'
              ? 'Access your institutional verified performance & tournaments'
              : 'Join the premier global arena for verified forex & gold traders'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(null); }}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeTab === 'signin' ? 'linear-gradient(135deg, #0abab5, #00f0ff)' : 'transparent',
              color: activeTab === 'signin' ? '#041c1b' : '#94a3b8',
              boxShadow: activeTab === 'signin' ? '0 2px 10px rgba(10, 186, 181, 0.35)' : 'none',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); }}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeTab === 'register' ? 'linear-gradient(135deg, #0abab5, #00f0ff)' : 'transparent',
              color: activeTab === 'register' ? '#041c1b' : '#94a3b8',
              boxShadow: activeTab === 'register' ? '0 2px 10px rgba(10, 186, 181, 0.35)' : 'none',
            }}
          >
            Create Account
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
                Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="e.g. Alex_Vanguard or alex@example.com"
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
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  placeholder="••••••••"
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
              {loading ? 'Authenticating...' : 'Sign In to TradeRank'}
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Trader Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  placeholder="e.g. GoldSniper_99"
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
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="email"
                  placeholder="trader@domain.com"
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
                  Primary Broker
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
                  Trading Style
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
                  <option value="SCALPER">Scalper</option>
                  <option value="DAY_TRADER">Day Trader</option>
                  <option value="SWING_TRADER">Swing Trader</option>
                  <option value="ALGORITHMIC">Algorithmic / EA</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="password"
                  placeholder="Create secure password"
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
              {loading ? 'Creating...' : 'Register Profile & Join Arena'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Quick Instant Demo Sign-In Shortcut */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleQuickDemo}
            style={{
              background: 'rgba(10, 186, 181, 0.1)',
              border: '1px solid rgba(10, 186, 181, 0.3)',
              color: 'var(--tiffany-light, #81d8d0)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(10, 186, 181, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(10, 186, 181, 0.1)';
            }}
          >
            <Sparkles size={14} color="#0abab5" />
            Instant One-Click Demo Pro (Alex_Vanguard)
          </button>
        </div>

        {/* Security Footer */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
          <ShieldCheck size={13} color="#0abab5" />
          <span>AES-256-GCM Vault • 100% Zero-Write Observer Protection</span>
        </div>
      </div>
    </div>
  );
};
