import React from 'react';
import { Shield, Target, Trophy, Zap, Star, Flame, CheckCircle, Lock, Gift } from 'lucide-react';

export interface HonorBadge {
  id: string;
  name: string;
  description: string;
  icon: typeof Shield;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  xpReward: number;
}

export const RewardsBadges: React.FC = () => {
  const currentXp = 2750;
  const currentLevel = 3;
  const currentTier = 'Market Veteran';
  const nextLevelXp = 5000;
  const prevLevelXp = 2001;
  const progressPct = Math.round(((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);

  const badges: HonorBadge[] = [
    {
      id: 'badge_risk_guardian',
      name: 'Risk Guardian',
      description: 'Completed a 5-day tournament with under 2.0% maximum drawdown.',
      icon: Shield,
      color: '#0abab5',
      unlocked: true,
      unlockedAt: 'Yesterday',
      rarity: 'EPIC',
      xpReward: 500,
    },
    {
      id: 'badge_sniper',
      name: 'Precision Sniper',
      description: 'Achieved > 70% win rate across a minimum of 10 closed trades.',
      icon: Target,
      color: '#81d8d0',
      unlocked: true,
      unlockedAt: '3 days ago',
      rarity: 'RARE',
      xpReward: 350,
    },
    {
      id: 'badge_century_club',
      name: 'Century Club',
      description: 'Harvested 100+ net normalized pips within a single trading week.',
      icon: Zap,
      color: '#fbbf24',
      unlocked: true,
      unlockedAt: 'Sep 12, 2026',
      rarity: 'RARE',
      xpReward: 400,
    },
    {
      id: 'badge_podium_master',
      name: 'Podium Master',
      description: 'Finished Top 3 in an official verified community tournament.',
      icon: Trophy,
      color: '#f59e0b',
      unlocked: false,
      rarity: 'EPIC',
      xpReward: 750,
    },
    {
      id: 'badge_hall_of_fame',
      name: 'Hall of Fame Titan',
      description: 'Crowned seasonal champion on the All-Time Legends leaderboard.',
      icon: Flame,
      color: '#ec4899',
      unlocked: false,
      rarity: 'LEGENDARY',
      xpReward: 2000,
    },
    {
      id: 'badge_iron_discipline',
      name: 'Iron Discipline',
      description: 'Zero anti-gambling rule infractions across 30 consecutive trades.',
      icon: Star,
      color: '#8b5cf6',
      unlocked: true,
      unlockedAt: 'Last week',
      rarity: 'COMMON',
      xpReward: 250,
    },
  ];

  const streakDays = [
    { day: 'Day 1', xp: 50, claimed: true },
    { day: 'Day 2', xp: 75, claimed: true },
    { day: 'Day 3', xp: 100, claimed: true },
    { day: 'Day 4', xp: 150, claimed: true },
    { day: 'Day 5', xp: 200, claimed: false, current: true },
    { day: 'Day 6', xp: 300, claimed: false },
    { day: 'Day 7', xp: 500, claimed: false, bonus: 'Mystery Badge' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tier & XP Status Hero Card */}
      <div
        className="card-panel"
        style={{
          background: 'linear-gradient(135deg, rgba(129, 216, 208, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(129, 216, 208, 0.3)',
          padding: '28px',
          borderRadius: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: 'rgba(129, 216, 208, 0.2)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(129, 216, 208, 0.4)',
                }}
              >
                LEVEL {currentLevel} TRADER
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>TraderRank Global Rank</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>
              {currentTier}
            </h2>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Experience</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-cyan)' }}>
              {currentXp.toLocaleString()} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {nextLevelXp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', color: 'var(--text-muted)' }}>
            <span>Progress to <strong>Level 4: Apex Predator</strong></span>
            <span><strong>{progressPct}%</strong> ({nextLevelXp - currentXp} XP remaining)</span>
          </div>
          <div style={{ width: '100%', height: '10px', borderRadius: '5px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-green))',
                borderRadius: '5px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Daily Login & Trading Streak Rewards */}
      <div className="card-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gift size={20} color="#fbbf24" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Daily Trading Streak Rewards</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 700 }}>
            🔥 4-Day Active Streak!
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
                  ? 'rgba(10, 186, 181, 0.1)'
                  : s.current
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.8))'
                  : 'rgba(255, 255, 255, 0.02)',
                border: s.claimed
                  ? '1px solid rgba(10, 186, 181, 0.3)'
                  : s.current
                  ? '1px solid rgba(245, 158, 11, 0.5)'
                  : '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.day}</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: s.claimed ? 'var(--accent-green)' : s.current ? '#fbbf24' : 'var(--text-muted)' }}>
                +{s.xp} XP
              </div>
              <div style={{ fontSize: '10px', marginTop: '6px' }}>
                {s.claimed ? (
                  <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <CheckCircle size={11} /> Claimed
                  </span>
                ) : s.current ? (
                  <button
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#fbbf24',
                      color: '#000',
                      fontWeight: 800,
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    Claim
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <Lock size={10} /> Locked
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Honor Badges Grid */}
      <div className="card-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800 }}>Honor Badges &amp; Achievements</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Earn badges through verified discipline, low drawdown, and podium finishes
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            4 / 6 Unlocked
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {badges.map(badge => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: '14px',
                  background: badge.unlocked ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.3)',
                  border: badge.unlocked ? `1px solid ${badge.color}40` : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  opacity: badge.unlocked ? 1 : 0.6,
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
                  }}
                >
                  <Icon size={20} color={badge.unlocked ? badge.color : 'var(--text-muted)'} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{badge.name}</h4>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `${badge.color}20`,
                        color: badge.color,
                      }}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {badge.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>+{badge.xpReward} XP</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {badge.unlocked ? `Unlocked ${badge.unlockedAt}` : 'Locked'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
