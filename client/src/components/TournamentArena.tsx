import React, { useState, useEffect } from 'react';
import { Swords, Clock, CheckCircle2, Zap, ChevronRight, Users, Flame } from 'lucide-react';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { TraderAvatar } from './TraderAvatar.tsx';
import { Broker } from '../../../shared/src/types.ts';

export interface Tournament {
  id: string;
  title: string;
  subtitle: string;
  type: 'WEEKLY_SPRINT' | 'MONTHLY_PROP' | 'DAILY_BLITZ';
  prizePoolUsd: number;
  prizePoolXp: number;
  entrantsCount: number;
  startsAt: string;
  endsAt: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  rules: {
    maxDailyLossPct: number;
    maxTrailingDrawdownPct: number;
    minTradesCount: number;
    scoringFormula: string;
  };
}

export interface TournamentParticipant {
  rank: number;
  userId: string;
  username: string;
  broker: Broker;
  avatarSymbol: string;
  netPips: number;
  tradesCount: number;
  drawdownPct: number;
  winRate: number;
  status: 'ACTIVE' | 'DISQUALIFIED';
  estimatedPrize: string;
}

export const TournamentArena: React.FC = () => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('tourney_weekly_blitz');
  const [isUserEntered, setIsUserEntered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 3,
    hours: 14,
    minutes: 22,
    seconds: 45,
  });

  const tournaments: Tournament[] = [
    {
      id: 'tourney_weekly_blitz',
      title: 'Weekly FX Blitz League',
      subtitle: '5-Day Institutional Sprint across Forex & Metals',
      type: 'WEEKLY_SPRINT',
      prizePoolUsd: 5000,
      prizePoolXp: 15000,
      entrantsCount: 248,
      startsAt: '2026-09-14T00:00:00Z',
      endsAt: '2026-09-19T21:00:00Z',
      status: 'ACTIVE',
      rules: {
        maxDailyLossPct: 5.0,
        maxTrailingDrawdownPct: 10.0,
        minTradesCount: 5,
        scoringFormula: 'TraderScore = Net Pips * (1 + WinRate/100)',
      },
    },
    {
      id: 'tourney_monthly_prop',
      title: 'Apex Prop Championship',
      subtitle: '30-Day Endurance Gauntlet for Certified Traders',
      type: 'MONTHLY_PROP',
      prizePoolUsd: 25000,
      prizePoolXp: 75000,
      entrantsCount: 684,
      startsAt: '2026-09-01T00:00:00Z',
      endsAt: '2026-09-30T23:59:59Z',
      status: 'ACTIVE',
      rules: {
        maxDailyLossPct: 4.0,
        maxTrailingDrawdownPct: 8.0,
        minTradesCount: 20,
        scoringFormula: 'TraderScore = Net Pips * SharpeRatio Multiplier',
      },
    },
    {
      id: 'tourney_daily_rush',
      title: 'Tokyo-London Overlap Rush',
      subtitle: 'Fast-paced 8-hour session battle on GBP & EUR pairs',
      type: 'DAILY_BLITZ',
      prizePoolUsd: 1500,
      prizePoolXp: 5000,
      entrantsCount: 112,
      startsAt: '2026-09-15T07:00:00Z',
      endsAt: '2026-09-15T16:00:00Z',
      status: 'ACTIVE',
      rules: {
        maxDailyLossPct: 3.0,
        maxTrailingDrawdownPct: 6.0,
        minTradesCount: 3,
        scoringFormula: 'TraderScore = Net Pips / Avg Holding Time',
      },
    },
  ];

  const currentTourney = tournaments.find(t => t.id === selectedTournamentId) || tournaments[0];

  const participants: TournamentParticipant[] = [
    {
      rank: 1,
      userId: 'u_fx_sniper',
      username: 'FX_Sniper',
      broker: 'Exness',
      avatarSymbol: 'EURUSD',
      netPips: 88.4,
      tradesCount: 14,
      drawdownPct: 1.8,
      winRate: 78.5,
      status: 'ACTIVE',
      estimatedPrize: '$2,000 + 5,000 XP',
    },
    {
      rank: 2,
      userId: 'u_gold_bug',
      username: 'GoldBug_JP',
      broker: 'XM',
      avatarSymbol: 'XAUUSD',
      netPips: 74.2,
      tradesCount: 11,
      drawdownPct: 2.4,
      winRate: 72.7,
      status: 'ACTIVE',
      estimatedPrize: '$1,200 + 3,500 XP',
    },
    {
      rank: 3,
      userId: 'u_alpha_wave',
      username: 'AlphaWave',
      broker: 'Axiory',
      avatarSymbol: 'USDJPY',
      netPips: 61.9,
      tradesCount: 9,
      drawdownPct: 2.1,
      winRate: 66.7,
      status: 'ACTIVE',
      estimatedPrize: '$800 + 2,000 XP',
    },
    {
      rank: 4,
      userId: 'u_zen_scalp',
      username: 'ZenScalper',
      broker: 'Vantage',
      avatarSymbol: 'GBPUSD',
      netPips: 49.3,
      tradesCount: 16,
      drawdownPct: 3.2,
      winRate: 62.5,
      status: 'ACTIVE',
      estimatedPrize: '$400 + 1,000 XP',
    },
    {
      rank: 5,
      userId: 'u_reckless_bull',
      username: 'RiskMaximus',
      broker: 'Exness',
      avatarSymbol: 'BTCUSD',
      netPips: 112.5,
      tradesCount: 4,
      drawdownPct: 7.2,
      winRate: 50.0,
      status: 'DISQUALIFIED',
      estimatedPrize: 'DQ (Max DD Exceeded)',
    },
  ];

  // Countdown timer tick simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tournament Selector Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {tournaments.map(t => {
          const isSelected = t.id === selectedTournamentId;
          return (
            <div
              key={t.id}
              onClick={() => setSelectedTournamentId(t.id)}
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)'
                  : 'rgba(15, 23, 42, 0.6)',
                border: isSelected ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 10px 25px -5px rgba(16, 185, 129, 0.2)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: t.type === 'WEEKLY_SPRINT' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: t.type === 'WEEKLY_SPRINT' ? 'var(--accent-cyan)' : '#fbbf24',
                    border: `1px solid ${t.type === 'WEEKLY_SPRINT' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  }}
                >
                  {t.type.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={13} /> {t.entrantsCount} Traders
                </span>
              </div>

              <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800 }}>{t.title}</h4>
              <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{t.subtitle}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prize Pool</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>
                    ${t.prizePoolUsd.toLocaleString()} <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>+{t.prizePoolXp} XP</span>
                  </div>
                </div>
                <ChevronRight size={18} color={isSelected ? 'var(--accent-green)' : 'var(--text-muted)'} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Tournament Detail & Live Bracket */}
      <div className="card-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Swords size={24} color="var(--accent-green)" />
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>{currentTourney.title}</h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Flame size={12} /> LIVE BATTLE
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {currentTourney.subtitle} • Anti-Gambling Max Drawdown {currentTourney.rules.maxTrailingDrawdownPct}%
            </p>
          </div>

          {/* Countdown & Entry CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <Clock size={12} /> Battle Ends In:
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                {String(timeLeft.days).padStart(2, '0')}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
              </div>
            </div>

            <button
              onClick={() => setIsUserEntered(!isUserEntered)}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 800,
                borderRadius: '10px',
                cursor: 'pointer',
                background: isUserEntered
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'linear-gradient(135deg, var(--accent-green), #059669)',
                color: isUserEntered ? 'var(--accent-green)' : '#000000',
                border: isUserEntered ? '1px solid var(--accent-green)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {isUserEntered ? (
                <>
                  <CheckCircle2 size={16} /> ENTERED (TRACKING)
                </>
              ) : (
                <>
                  <Zap size={16} /> ENTER TOURNAMENT
                </>
              )}
            </button>
          </div>
        </div>

        {/* Anti-Gambling Institutional Rules Banner (PRD Pillar 3) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Daily Loss</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>
              ≤ {currentTourney.rules.maxDailyLossPct}% Equity Loss
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Trailing Drawdown</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
              ≤ {currentTourney.rules.maxTrailingDrawdownPct}% Peak DD
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min. Closed Trades</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {currentTourney.rules.minTradesCount} Trades to Qualify
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scoring System</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Normalized Pips × WinRate
            </div>
          </div>
        </div>

        {/* Standings Leaderboard */}
        <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 700 }}>Battle Standings &amp; Prize Positions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {participants.map(p => {
            const isTop3 = p.rank <= 3;
            const isDq = p.status === 'DISQUALIFIED';

            return (
              <div
                key={p.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: isDq
                    ? 'rgba(239, 68, 68, 0.05)'
                    : isTop3
                    ? 'rgba(16, 185, 129, 0.04)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isDq
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : isTop3
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid var(--border-subtle)',
                  opacity: isDq ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '32px',
                      fontWeight: 800,
                      fontSize: '14px',
                      textAlign: 'center',
                      color: isDq
                        ? '#ef4444'
                        : p.rank === 1
                        ? '#fbbf24'
                        : p.rank === 2
                        ? '#94a3b8'
                        : p.rank === 3
                        ? '#d97706'
                        : 'var(--text-muted)',
                    }}
                  >
                    {isDq ? 'DQ' : `#${p.rank}`}
                  </div>

                  <TraderAvatar username={p.username} symbol={p.avatarSymbol} size={36} />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '15px' }}>{p.username}</strong>
                      <BrokerSymbol broker={p.broker} />
                      {isDq && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                          }}
                        >
                          DISQUALIFIED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.tradesCount} Trades • Max Drawdown: <span style={{ color: isDq ? '#ef4444' : 'var(--text-main)' }}>{p.drawdownPct}%</span> • Win Rate: {p.winRate}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Pips</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: isDq ? 'var(--text-muted)' : 'var(--accent-green)' }}>
                      +{p.netPips.toFixed(1)}
                    </div>
                  </div>

                  <div style={{ minWidth: '140px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. Prize</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isDq ? '#ef4444' : '#fbbf24' }}>
                      {p.estimatedPrize}
                    </div>
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
