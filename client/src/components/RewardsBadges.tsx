import React, { useState, useEffect } from 'react';
import {
  Shield,
  Target,
  Trophy,
  Zap,
  Star,
  Flame,
  CheckCircle,
  Lock,
  Gift,
  X,
  Award,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext.tsx';

export interface HonorBadge {
  id: string;
  name: string;
  description: string;
  criteria: string;
  icon: typeof Shield;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  xpReward: number;
}

export const RewardsBadges: React.FC = () => {
  const { t, language } = useTranslation();

  const [currentXp, setCurrentXp] = useState<number>(2750);
  const [streakClaimed, setStreakClaimed] = useState<boolean>(false);
  const [tradeCount, setTradeCount] = useState<number>(0);
  const nextLevelXp = 5000;
  const prevLevelXp = 2001;
  const progressPct = Math.min(100, Math.round(((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<HonorBadge | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/accounts')
      .then(r => (r.ok ? r.json() : []))
      .then(async accounts => {
        if (!isMounted || !accounts || accounts.length === 0) return;
        const primary = accounts[0];
        try {
          const tradesRes = await fetch(`/api/accounts/${primary.id}/trades`);
          if (tradesRes.ok) {
            const trades = await tradesRes.json();
            if (Array.isArray(trades) && trades.length > 0 && isMounted) {
              setTradeCount(trades.length);
              const winningTrades = trades.filter((t: any) => Number(t.pnlCurrency || t.profit || 0) > 0);
              const computedXp = 2500 + trades.length * 20 + winningTrades.length * 35;
              setCurrentXp(computedXp);
            }
          }
        } catch (e) {
          console.warn('Could not compute dynamic XP from trades', e);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const getRarityLabel = (rarity: HonorBadge['rarity']) => {
    switch (rarity) {
      case 'COMMON': return t.rewards.rarityCommon;
      case 'RARE': return t.rewards.rarityRare;
      case 'EPIC': return t.rewards.rarityEpic;
      case 'LEGENDARY': return t.rewards.rarityLegendary;
      default: return rarity;
    }
  };

  const getDayText = (dayNum: number) => {
    if (language === 'ja') return `${dayNum}日目`;
    if (language === 'zh') return `第 ${dayNum} 天`;
    return `Day ${dayNum}`;
  };

  const streakDays = [
    { dayNum: 1, xp: 50, claimed: true },
    { dayNum: 2, xp: 75, claimed: true },
    { dayNum: 3, xp: 100, claimed: true },
    { dayNum: 4, xp: 150, claimed: true },
    { dayNum: 5, xp: 200, claimed: streakClaimed, current: !streakClaimed },
    { dayNum: 6, xp: 300, claimed: false },
    { dayNum: 7, xp: 500, claimed: false, bonus: t.rewards.mysteryBadge },
  ];

  const badges: HonorBadge[] = [
    {
      id: 'badge_risk_guardian',
      name: t.rewards.badgeRiskGuardianName,
      description: t.rewards.badgeRiskGuardianDesc,
      criteria: t.rewards.badgeRiskGuardianCriteria,
      icon: Shield,
      color: '#00DAC6',
      unlocked: true,
      unlockedAt: t.rewards.yesterday,
      rarity: 'EPIC',
      xpReward: 500,
    },
    {
      id: 'badge_sniper',
      name: t.rewards.badgePrecisionSniperName,
      description: t.rewards.badgePrecisionSniperDesc,
      criteria: t.rewards.badgePrecisionSniperCriteria,
      icon: Target,
      color: '#00F0FF',
      unlocked: true,
      unlockedAt: t.rewards.daysAgo,
      rarity: 'RARE',
      xpReward: 350,
    },
    {
      id: 'badge_century_club',
      name: t.rewards.badgeCenturyClubName,
      description: t.rewards.badgeCenturyClubDesc,
      criteria: t.rewards.badgeCenturyClubCriteria,
      icon: Zap,
      color: '#F0B90B',
      unlocked: true,
      unlockedAt: language === 'ja' ? '2026年9月12日' : language === 'zh' ? '2026年9月12日' : 'Sep 12, 2026',
      rarity: 'RARE',
      xpReward: 400,
    },
    {
      id: 'badge_podium_master',
      name: t.rewards.badgePodiumMasterName,
      description: t.rewards.badgePodiumMasterDesc,
      criteria: t.rewards.badgePodiumMasterCriteria,
      icon: Trophy,
      color: '#F59E0B',
      unlocked: false,
      rarity: 'EPIC',
      xpReward: 750,
    },
    {
      id: 'badge_hall_of_fame',
      name: t.rewards.badgeHallOfFameName,
      description: t.rewards.badgeHallOfFameDesc,
      criteria: t.rewards.badgeHallOfFameCriteria,
      icon: Flame,
      color: '#F6465D',
      unlocked: false,
      rarity: 'LEGENDARY',
      xpReward: 2000,
    },
    {
      id: 'badge_iron_discipline',
      name: t.rewards.badgeIronDisciplineName,
      description: t.rewards.badgeIronDisciplineDesc,
      criteria: t.rewards.badgeIronDisciplineCriteria,
      icon: Star,
      color: '#8B5CF6',
      unlocked: true,
      unlockedAt: t.rewards.lastWeek,
      rarity: 'COMMON',
      xpReward: 250,
    },
  ];

  const handleClaimStreak = () => {
    setStreakClaimed(true);
    setCurrentXp(prev => prev + 200);
    setToastMessage(t.rewards.toastClaimed);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const tiers = [
    { level: 1, name: t.rewards.tierNovice, minXp: 0, color: '#848E9C' },
    { level: 2, name: t.rewards.tierProSwing, minXp: 1000, color: '#00DAC6' },
    { level: 3, name: t.rewards.tierMarketVeteran, minXp: 2500, color: '#00F0FF', active: true },
    { level: 4, name: t.rewards.tierApexPredator, minXp: 5000, color: '#F0B90B' },
    { level: 5, name: t.rewards.tierHallOfFame, minXp: 10000, color: '#F6465D' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Banner */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.2) 0%, rgba(0, 218, 198, 0.2) 100%)',
            border: '1px solid #00F0FF',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(0, 240, 255, 0.3)',
            animation: 'fadeInScale 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="#00F0FF" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#848E9C', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tier & XP Status Hero Card */}
      <div
        className="card-panel"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(13, 19, 29, 0.95) 100%)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          padding: '28px',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: 'rgba(0, 240, 255, 0.2)',
                  color: '#00F0FF',
                  border: '1px solid rgba(0, 240, 255, 0.4)',
                  letterSpacing: '0.5px',
                }}
              >
                {t.rewards.levelTrader}
              </span>
              <span style={{ fontSize: '13px', color: '#848E9C' }}>
                TraderRank Global Rank {tradeCount > 0 && `• ${tradeCount} Verified Trades`}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              {t.rewards.currentTier}
            </h2>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#848E9C' }}>{t.rewards.currentXp}</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#00F0FF' }}>
              {currentXp.toLocaleString()}{' '}
              <span style={{ fontSize: '14px', color: '#848E9C' }}>/ {nextLevelXp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '8px',
              color: '#848E9C',
            }}
          >
            <span>
              {t.rewards.progressTo}
            </span>
            <span>
              <strong style={{ color: '#00F0FF' }}>{progressPct}%</strong> ({nextLevelXp - currentXp} XP remaining)
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '10px',
              borderRadius: '5px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00DAC6 0%, #00F0FF 100%)',
                borderRadius: '5px',
                transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.5)',
              }}
            />
          </div>
        </div>

        {/* Trader Tier Breadcrumb */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {tiers.map(tItem => (
            <div
              key={tItem.level}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: tItem.active ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: tItem.active ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Award size={14} color={tItem.color} />
              <div>
                <div style={{ fontSize: '10px', color: '#848E9C' }}>LV. {tItem.level}</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: tItem.active ? '#00F0FF' : '#FFFFFF' }}>
                  {tItem.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Login & Trading Streak Rewards */}
      <div
        className="card-panel"
        style={{
          padding: '24px',
          background: 'rgba(14, 20, 31, 0.85)',
          border: '1px solid rgba(0, 240, 255, 0.12)',
          borderRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gift size={20} color="#F0B90B" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
              {t.rewards.dailyStreakTitle}
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: '#00DAC6', fontWeight: 700 }}>
            {t.rewards.streakActive}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
          {streakDays.map((s, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px 10px',
                borderRadius: '12px',
                textAlign: 'center',
                background: s.claimed
                  ? 'rgba(0, 218, 198, 0.1)'
                  : s.current
                  ? 'linear-gradient(135deg, rgba(240, 185, 11, 0.25), rgba(15, 23, 42, 0.85))'
                  : 'rgba(255, 255, 255, 0.02)',
                border: s.claimed
                  ? '1px solid rgba(0, 218, 198, 0.35)'
                  : s.current
                  ? '1px solid rgba(240, 185, 11, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'transform 0.2s, border-color 0.2s',
              }}
            >
              <div style={{ fontSize: '11px', color: '#848E9C', marginBottom: '4px' }}>{getDayText(s.dayNum)}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: s.claimed ? '#00DAC6' : s.current ? '#F0B90B' : '#848E9C',
                }}
              >
                +{s.xp} XP
              </div>
              <div style={{ fontSize: '10px', marginTop: '8px' }}>
                {s.claimed ? (
                  <span
                    style={{
                      color: '#00DAC6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle size={11} /> {t.rewards.claimed}
                  </span>
                ) : s.current ? (
                  <button
                    onClick={handleClaimStreak}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
                      color: '#080b11',
                      fontWeight: 800,
                      fontSize: '11px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(0, 240, 255, 0.25)',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {t.rewards.claimBtn}
                  </button>
                ) : (
                  <span
                    style={{
                      color: '#848E9C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                    }}
                  >
                    <Lock size={10} /> {t.rewards.locked}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Honor Badges Grid */}
      <div
        className="card-panel"
        style={{
          padding: '24px',
          background: 'rgba(14, 20, 31, 0.85)',
          border: '1px solid rgba(0, 240, 255, 0.12)',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
              {t.rewards.honorBadgesTitle}
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#848E9C' }}>
              {t.rewards.honorBadgesSubtitle}
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#00F0FF' }}>
            {t.rewards.unlockedCount}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {badges.map(badge => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                style={{
                  padding: '16px 18px',
                  borderRadius: '14px',
                  background: badge.unlocked ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.3)',
                  border: badge.unlocked ? `1px solid ${badge.color}50` : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  opacity: badge.unlocked ? 1 : 0.65,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = badge.color;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = badge.unlocked ? `${badge.color}50` : 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: badge.unlocked ? `${badge.color}20` : 'rgba(255, 255, 255, 0.05)',
                    border: badge.unlocked ? `1px solid ${badge.color}60` : '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: badge.unlocked ? `0 0 16px ${badge.color}30` : 'none',
                  }}
                >
                  <Icon size={20} color={badge.unlocked ? badge.color : '#848E9C'} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>{badge.name}</h4>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `${badge.color}20`,
                        color: badge.color,
                        border: `1px solid ${badge.color}40`,
                      }}
                    >
                      {getRarityLabel(badge.rarity)}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#848E9C', lineHeight: '1.4' }}>
                    {badge.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ color: '#00F0FF', fontWeight: 700 }}>+{badge.xpReward} XP</span>
                    <span style={{ color: '#848E9C', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {badge.unlocked ? (
                        <>
                          <CheckCircle size={11} color="#00F0FF" />
                          <span>{t.rewards.verified} ({badge.unlockedAt})</span>
                        </>
                      ) : (
                        <>
                          <Lock size={11} color="#64748b" />
                          <span>{t.rewards.clickToInspect}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Badge Details Modal */}
      {selectedBadge && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedBadge(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#0d131d',
              border: `1px solid ${selectedBadge.color}`,
              borderRadius: '20px',
              padding: '28px',
              boxShadow: `0 0 40px ${selectedBadge.color}30`,
              animation: 'fadeInScale 0.2s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: `${selectedBadge.color}20`,
                  color: selectedBadge.color,
                  border: `1px solid ${selectedBadge.color}40`,
                }}
              >
                {getRarityLabel(selectedBadge.rarity)} {t.rewards.prestigeBadge.toUpperCase()}
              </span>
              <button
                onClick={() => setSelectedBadge(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#848E9C',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: `${selectedBadge.color}20`,
                  border: `2px solid ${selectedBadge.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  boxShadow: `0 0 24px ${selectedBadge.color}50`,
                }}
              >
                <selectedBadge.icon size={32} color={selectedBadge.color} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px' }}>
                {selectedBadge.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#848E9C', margin: 0, lineHeight: 1.5 }}>
                {selectedBadge.description}
              </p>
            </div>

            <div
              style={{
                background: 'rgba(8, 11, 17, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#848E9C', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                {t.rewards.howToUnlock}
              </div>
              <p style={{ fontSize: '12px', color: '#FFFFFF', margin: '0 0 12px', lineHeight: 1.5 }}>
                {selectedBadge.criteria}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', color: '#848E9C' }}>{t.rewards.rewardBonus}</span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#00F0FF' }}>
                  +{selectedBadge.xpReward} XP
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
                color: '#080b11',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {t.rewards.closeBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
