import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  GAMIFICATION_REFERRAL_TIERS,
  getReferralTier,
  generateReferralUrl,
} from '../../../shared/src/config/affiliateProgram.ts';
import {
  Copy,
  Check,
  Sparkles,
  Zap,
  Target,
  Flame,
  Crown,
  CheckCircle2,
  Lock,
  X,
  Send,
  MessageCircle,
  Twitter,
  Award,
} from 'lucide-react';

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateModal: React.FC<AffiliateModalProps> = ({ isOpen, onClose }) => {
  const { user, referralCount, addReferral } = useAuth();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const referralCode = user?.username ? user.username.toLowerCase().replace(/[^a-z0-9_]/g, '') : 'trader';
  const referralUrl = generateReferralUrl(referralCode);

  const verifiedReferrals = referralCount;
  const { current, next } = getReferralTier(verifiedReferrals);

  const totalXpFromReferrals = verifiedReferrals * 500;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareText = encodeURIComponent(
    `Verify your Forex trading edge on TradeRank.live with zero fund access! Join with my invite code: ${referralCode}`
  );

  const getTierIcon = (iconName: string, color: string, size = 18) => {
    switch (iconName) {
      case 'Zap': return <Zap size={size} color={color} />;
      case 'Target': return <Target size={size} color={color} />;
      case 'Flame': return <Flame size={size} color={color} />;
      case 'Crown': return <Crown size={size} color={color} />;
      default: return <Award size={size} color={color} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 16, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(14, 23, 33, 0.98) 0%, rgba(9, 14, 22, 0.98) 100%)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 240, 255, 0.15)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#848E9C',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#848E9C';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              color: '#00F0FF',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            <Sparkles size={15} color="#00F0FF" />
            <span>COMMUNITY GAMIFICATION AFFILIATE PROGRAM</span>
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Invite Traders • Earn XP • Unlock Premium AI Features
          </h2>
          <p style={{ color: '#848E9C', fontSize: '14px', maxWidth: '580px', margin: '0 auto', lineHeight: 1.5 }}>
            No cash payouts or subscription fees. Share TradeRank with fellow traders to earn **+500 XP per friend**, unlock exclusive badges, and gain full access to institutional multi-timeframe analytics!
          </p>
        </div>

        {/* User Referral Link & Quick Share Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(14, 20, 31, 0.7) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '28px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#00F0FF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Your Personal Invite Link
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <div
              style={{
                flex: '1 1 300px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#FFFFFF',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {referralUrl}
            </div>

            <button
              onClick={handleCopyLink}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                background: 'linear-gradient(90deg, #00F0FF 0%, #00DAC6 100%)',
                border: 'none',
                color: '#080E14',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 240, 255, 0.3)',
              }}
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleCopyCode}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: copiedCode ? '#00DAC6' : '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              <span>Code: {referralCode}</span>
            </button>
          </div>

          {/* Social One-Click Share Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#848E9C', fontWeight: 600 }}>Quick Share:</span>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 136, 204, 0.15)',
                border: '1px solid rgba(0, 136, 204, 0.4)',
                color: '#29b6f6',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Send size={13} /> Telegram
            </a>

            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(referralUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(29, 155, 240, 0.15)',
                border: '1px solid rgba(29, 155, 240, 0.4)',
                color: '#1d9bf0',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Twitter size={13} /> X / Twitter
            </a>

            <a
              href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(referralUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(37, 211, 102, 0.15)',
                border: '1px solid rgba(37, 211, 102, 0.4)',
                color: '#25d366',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <MessageCircle size={13} /> WhatsApp
            </a>

            <button
              type="button"
              onClick={addReferral}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.35)',
                color: '#00F0FF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginLeft: 'auto',
              }}
              title="Simulate a friend joining TradeRank to test tier unlocks"
            >
              <Sparkles size={13} /> +1 Test Friend Joined
            </button>
          </div>
        </div>

        {/* Current Referral Gamification Status */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#848E9C', textTransform: 'uppercase', fontWeight: 700 }}>
              Verified Friends Invited
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#00DAC6', marginTop: '4px' }}>
              {verifiedReferrals}{' '}
              <span style={{ fontSize: '13px', color: '#848E9C' }}>
                {next ? `/ ${next.minReferrals} to ${next.name}` : '(Max Tier)'}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#848E9C', textTransform: 'uppercase', fontWeight: 700 }}>
              Gamification XP Earned
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#00F0FF', marginTop: '4px' }}>
              +{totalXpFromReferrals.toLocaleString()} XP
            </div>
          </div>

          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#848E9C', textTransform: 'uppercase', fontWeight: 700 }}>
              Current Referral Honor Rank
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: current.color, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getTierIcon(current.badgeIcon, current.color, 18)}
              <span>{current.name}</span>
            </div>
          </div>
        </div>

        {/* 4 Gamification Referral Tiers & Unlocked Feature Cards */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Referral Tiers & Premium Feature Milestones
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {GAMIFICATION_REFERRAL_TIERS.map((tier) => {
              const isUnlocked = verifiedReferrals >= tier.minReferrals;
              const isCurrent = current.tierId === tier.tierId;

              return (
                <div
                  key={tier.tierId}
                  style={{
                    borderRadius: '14px',
                    padding: '20px',
                    background: isCurrent
                      ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(14, 20, 31, 0.8) 100%)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isCurrent
                      ? `2px solid ${tier.color}`
                      : isUnlocked
                      ? '1px solid rgba(0, 218, 198, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getTierIcon(tier.badgeIcon, tier.color, 20)}
                      <strong style={{ fontSize: '15px', color: tier.color }}>{tier.name}</strong>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '8px',
                        background: isUnlocked ? 'rgba(0, 218, 198, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: isUnlocked ? '#00DAC6' : '#848E9C',
                        border: isUnlocked ? '1px solid #00DAC6' : '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {tier.minReferrals} {tier.minReferrals === 1 ? 'Friend' : 'Friends'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFD700', marginBottom: '10px' }}>
                    +{tier.xpReward.toLocaleString()} Gamification XP
                  </div>

                  {/* Features Unlocked */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tier.unlockedFeatures.map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: isUnlocked ? '#CBD5E1' : '#64748B' }}>
                        {isUnlocked ? (
                          <CheckCircle2 size={14} color="#00DAC6" style={{ marginTop: '2px', flexShrink: 0 }} />
                        ) : (
                          <Lock size={14} color="#64748B" style={{ marginTop: '2px', flexShrink: 0 }} />
                        )}
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Close */}
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 28px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
