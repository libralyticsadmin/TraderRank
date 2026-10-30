import React, { useState } from 'react';
import { X, Check, Save, User, ShieldCheck } from 'lucide-react';
import { useAuth, UserProfile } from '../context/AuthContext.tsx';
import { Broker } from '../../../shared/src/types.ts';
import { TraderAvatar } from './TraderAvatar.tsx';
import { BrokerSymbol } from './BrokerSymbol.tsx';

const AVATAR_SYMBOLS = [
  { id: 'zap', label: '⚡ Flash Lightning' },
  { id: 'crown', label: '👑 King Crown' },
  { id: 'target', label: '🎯 Sniper Target' },
  { id: 'shield', label: '🛡️ Vault Shield' },
  { id: 'gem', label: '💎 Diamond' },
  { id: 'flame', label: '🔥 Gold Flame' },
  { id: 'EURUSD', label: '💱 EUR/USD' },
  { id: 'XAUUSD', label: '🪙 Gold (XAU)' },
  { id: 'BTCUSD', label: '₿ Bitcoin' },
];

export const ProfileEditModal: React.FC = () => {
  const { user, isProfileModalOpen, closeProfileModal, updateProfile } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [traderTitle, setTraderTitle] = useState(user?.traderTitle || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [tradingStyle, setTradingStyle] = useState<UserProfile['tradingStyle']>(user?.tradingStyle || 'SCALPER');
  const [primaryBroker, setPrimaryBroker] = useState<Broker>(user?.primaryBroker || 'Exness');
  const [avatarSymbol, setAvatarSymbol] = useState(user?.avatarSymbol || 'zap');
  const [country, setCountry] = useState(user?.country || 'United States');
  const [telegramHandle, setTelegramHandle] = useState(user?.telegramHandle || '');
  const [discordHandle, setDiscordHandle] = useState(user?.discordHandle || '');
  const [twitterHandle, setTwitterHandle] = useState(user?.twitterHandle || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state whenever modal opens or user updates
  React.useEffect(() => {
    if (user) {
      setUsername(user.username);
      setTraderTitle(user.traderTitle || '');
      setBio(user.bio || '');
      setTradingStyle(user.tradingStyle || 'SCALPER');
      setPrimaryBroker(user.primaryBroker || 'Exness');
      setAvatarSymbol(user.avatarSymbol || 'zap');
      setCountry(user.country || 'United States');
      setTelegramHandle(user.telegramHandle || '');
      setDiscordHandle(user.discordHandle || '');
      setTwitterHandle(user.twitterHandle || '');
    }
  }, [user, isProfileModalOpen]);

  if (!isProfileModalOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await updateProfile({
      username: username.trim() || user.username,
      traderTitle: traderTitle.trim(),
      bio: bio.trim(),
      tradingStyle,
      primaryBroker,
      avatarSymbol,
      country: country.trim(),
      telegramHandle: telegramHandle.trim(),
      discordHandle: discordHandle.trim(),
      twitterHandle: twitterHandle.trim(),
    });

    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      closeProfileModal();
    }, 700);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 1150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={closeProfileModal}
    >
      <div
        className="card-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #101927 0%, #090e18 100%)',
          border: '1px solid rgba(10, 186, 181, 0.4)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(10, 186, 181, 0.15)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeProfileModal}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(10, 186, 181, 0.25), rgba(0, 240, 255, 0.15))',
              border: '1px solid rgba(10, 186, 181, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={22} color="#0abab5" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>
              Edit Trader Profile
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#848E9C' }}>
              Customize how your verified account appears across leaderboards, tournaments, and bulletins
            </p>
          </div>
        </div>

        {/* Real-Time Live Preview Card */}
        <div
          style={{
            background: 'rgba(5, 12, 18, 0.85)',
            border: '1px solid rgba(10, 186, 181, 0.25)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <TraderAvatar username={username || user.username} symbol={avatarSymbol} size={52} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '16px', color: '#ffffff' }}>{username || user.username}</strong>
                <BrokerSymbol broker={primaryBroker} size={16} />
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    background: 'rgba(10, 186, 181, 0.15)',
                    color: '#0abab5',
                    border: '1px solid rgba(10, 186, 181, 0.3)',
                  }}
                >
                  Lv. {user.level} Pro
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {traderTitle || 'Verified Institutional Trader'} • {tradingStyle}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '11px',
                color: '#34d399',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={13} /> MetaApi Read-Only Verified
            </span>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Rank #{user.rank || 12} Global • {user.xp} XP
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Display Name */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Display Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
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

            {/* Trader Title */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Trader Title / Headline
              </label>
              <input
                type="text"
                placeholder="e.g. Gold Scalper & Session Breakouts"
                value={traderTitle}
                onChange={(e) => setTraderTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
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

          {/* Avatar Icon Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              Avatar Symbol & Mark
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
              {AVATAR_SYMBOLS.map((sym) => {
                const isSelected = avatarSymbol === sym.id;
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => setAvatarSymbol(sym.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--tiffany, #0abab5)' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(10, 186, 181, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{sym.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Primary Broker */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Primary Broker
              </label>
              <select
                value={primaryBroker}
                onChange={(e) => setPrimaryBroker(e.target.value as Broker)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#131e2d',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
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

            {/* Trading Style */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Trading Style
              </label>
              <select
                value={tradingStyle}
                onChange={(e) => setTradingStyle(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#131e2d',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="SCALPER">Scalper (Minutes / M1-M5)</option>
                <option value="DAY_TRADER">Day Trader (Intraday M15-H1)</option>
                <option value="SWING_TRADER">Swing Trader (Multi-Day H4-D1)</option>
                <option value="ALGORITHMIC">Algorithmic / Automated EA</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              Trader Bio & Philosophy
            </label>
            <textarea
              rows={3}
              placeholder="Describe your edge, favorite setups (e.g. London breakout on Gold), risk management rules..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Social Handles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Telegram
              </label>
              <input
                type="text"
                placeholder="@username"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Discord
              </label>
              <input
                type="text"
                placeholder="handle#0000"
                value={discordHandle}
                onChange={(e) => setDiscordHandle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                X / Twitter
              </label>
              <input
                type="text"
                placeholder="@handle"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={closeProfileModal}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: savedSuccess
                  ? '#10b981'
                  : 'linear-gradient(135deg, #0abab5, #00f0ff)',
                color: savedSuccess ? '#ffffff' : '#041c1b',
                border: 'none',
                fontWeight: 900,
                fontSize: '13px',
                cursor: saving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(10, 186, 181, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              {savedSuccess ? (
                <>
                  <Check size={16} /> Saved!
                </>
              ) : (
                <>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Profile Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
