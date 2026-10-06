import React, { useState, useEffect } from 'react';
import { Swords, Clock, CheckCircle2, Zap, ChevronRight, Users, Flame } from 'lucide-react';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { TraderAvatar } from './TraderAvatar.tsx';
import { Broker } from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';

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
  const { t } = useTranslation();
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
      id: 'tourney_gold_rush',
      title: 'Global Gold Rush Masters',
      subtitle: 'Precision XAUUSD & Precious Metals Gauntlet',
      type: 'WEEKLY_SPRINT',
      prizePoolUsd: 10000,
      prizePoolXp: 30000,
      entrantsCount: 420,
      startsAt: '2026-09-15T00:00:00Z',
      endsAt: '2026-09-20T23:59:59Z',
      status: 'ACTIVE',
      rules: {
        maxDailyLossPct: 4.5,
        maxTrailingDrawdownPct: 9.0,
        minTradesCount: 8,
        scoringFormula: 'TraderScore = Gold Pips * (WinRate / 100)',
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

  const participantRosters: Record<string, TournamentParticipant[]> = {
    tourney_weekly_blitz: [
      { rank: 1, userId: 'u_fx_sniper', username: 'FX_Sniper', broker: 'Exness', avatarSymbol: 'EURUSD', netPips: 88.4, tradesCount: 14, drawdownPct: 1.8, winRate: 78.5, status: 'ACTIVE', estimatedPrize: '$2,000 + 5,000 XP' },
      { rank: 2, userId: 'u_gold_bug', username: 'GoldBug_JP', broker: 'XM', avatarSymbol: 'XAUUSD', netPips: 74.2, tradesCount: 11, drawdownPct: 2.4, winRate: 72.7, status: 'ACTIVE', estimatedPrize: '$1,200 + 3,500 XP' },
      { rank: 3, userId: 'u_alpha_wave', username: 'AlphaWave', broker: 'Axiory', avatarSymbol: 'USDJPY', netPips: 61.9, tradesCount: 9, drawdownPct: 2.1, winRate: 66.7, status: 'ACTIVE', estimatedPrize: '$800 + 2,000 XP' },
      { rank: 4, userId: 'u_zen_scalp', username: 'ZenScalper', broker: 'Vantage', avatarSymbol: 'GBPUSD', netPips: 49.3, tradesCount: 16, drawdownPct: 3.2, winRate: 62.5, status: 'ACTIVE', estimatedPrize: '$400 + 1,000 XP' },
      { rank: 5, userId: 'u_reckless_bull', username: 'RiskMaximus', broker: 'Exness', avatarSymbol: 'BTCUSD', netPips: 112.5, tradesCount: 4, drawdownPct: 7.2, winRate: 50.0, status: 'DISQUALIFIED', estimatedPrize: 'DQ (Max DD Exceeded)' },
    ],
    tourney_monthly_prop: [
      { rank: 1, userId: 'u_marcus_v', username: 'Marcus_V', broker: 'Axiory', avatarSymbol: 'EURUSD', netPips: 248.6, tradesCount: 42, drawdownPct: 3.1, winRate: 81.0, status: 'ACTIVE', estimatedPrize: '$10,000 + 30,000 XP' },
      { rank: 2, userId: 'u_sarah_fx', username: 'Sarah_FX', broker: 'Exness', avatarSymbol: 'GBPUSD', netPips: 198.4, tradesCount: 38, drawdownPct: 2.8, winRate: 76.3, status: 'ACTIVE', estimatedPrize: '$6,000 + 20,000 XP' },
      { rank: 3, userId: 'u_hiroshi_k', username: 'Hiroshi_K', broker: 'XM', avatarSymbol: 'USDJPY', netPips: 182.1, tradesCount: 29, drawdownPct: 3.4, winRate: 72.4, status: 'ACTIVE', estimatedPrize: '$4,000 + 12,000 XP' },
      { rank: 4, userId: 'u_elena_scalps', username: 'Elena_Scalps', broker: 'Vantage', avatarSymbol: 'XAUUSD', netPips: 165.7, tradesCount: 35, drawdownPct: 3.9, winRate: 68.6, status: 'ACTIVE', estimatedPrize: '$2,500 + 8,000 XP' },
      { rank: 5, userId: 'u_david_gold', username: 'David_Gold', broker: 'XM', avatarSymbol: 'XAUUSD', netPips: 142.0, tradesCount: 31, drawdownPct: 4.1, winRate: 64.5, status: 'ACTIVE', estimatedPrize: '$1,500 + 5,000 XP' },
    ],
    tourney_gold_rush: [
      { rank: 1, userId: 'u_gold_bug', username: 'GoldBug_JP', broker: 'XM', avatarSymbol: 'XAUUSD', netPips: 134.5, tradesCount: 19, drawdownPct: 2.1, winRate: 84.2, status: 'ACTIVE', estimatedPrize: '$4,500 + 12,000 XP' },
      { rank: 2, userId: 'u_viktor_m', username: 'Viktor_Metals', broker: 'Exness', avatarSymbol: 'XAUUSD', netPips: 118.2, tradesCount: 15, drawdownPct: 2.6, winRate: 73.3, status: 'ACTIVE', estimatedPrize: '$2,500 + 8,000 XP' },
      { rank: 3, userId: 'u_david_gold', username: 'David_Gold', broker: 'Axiory', avatarSymbol: 'XAUUSD', netPips: 96.4, tradesCount: 12, drawdownPct: 3.0, winRate: 66.7, status: 'ACTIVE', estimatedPrize: '$1,500 + 5,000 XP' },
      { rank: 4, userId: 'u_swiss_vault', username: 'SwissVault', broker: 'Vantage', avatarSymbol: 'XAUUSD', netPips: 82.1, tradesCount: 14, drawdownPct: 3.5, winRate: 64.3, status: 'ACTIVE', estimatedPrize: '$1,000 + 3,000 XP' },
    ],
    tourney_daily_rush: [
      { rank: 1, userId: 'u_kenshi_t', username: 'Kenshi_Tokyo', broker: 'XM', avatarSymbol: 'USDJPY', netPips: 44.8, tradesCount: 7, drawdownPct: 1.1, winRate: 85.7, status: 'ACTIVE', estimatedPrize: '$700 + 2,500 XP' },
      { rank: 2, userId: 'u_london_j', username: 'LondonFX_James', broker: 'Vantage', avatarSymbol: 'GBPUSD', netPips: 38.2, tradesCount: 6, drawdownPct: 1.4, winRate: 83.3, status: 'ACTIVE', estimatedPrize: '$450 + 1,500 XP' },
      { rank: 3, userId: 'u_sofia_q', username: 'Sofia_Quant', broker: 'Axiory', avatarSymbol: 'EURUSD', netPips: 31.0, tradesCount: 8, drawdownPct: 1.9, winRate: 75.0, status: 'ACTIVE', estimatedPrize: '$250 + 750 XP' },
      { rank: 4, userId: 'u_alex_s', username: 'Alex_Scalps', broker: 'Exness', avatarSymbol: 'EURGBP', netPips: 27.5, tradesCount: 5, drawdownPct: 2.2, winRate: 60.0, status: 'ACTIVE', estimatedPrize: '$100 + 250 XP' },
    ],
  };

  const participants: TournamentParticipant[] = participantRosters[selectedTournamentId] || participantRosters.tourney_weekly_blitz;

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
        {tournaments.map(tourney => {
          const isSelected = tourney.id === selectedTournamentId;
          return (
            <div
              key={tourney.id}
              onClick={() => setSelectedTournamentId(tourney.id)}
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(10, 186, 181, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)'
                  : 'rgba(15, 23, 42, 0.6)',
                border: isSelected ? '1px solid rgba(10, 186, 181, 0.5)' : '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 10px 25px -5px rgba(10, 186, 181, 0.2)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: tourney.type === 'WEEKLY_SPRINT' ? 'rgba(129, 216, 208, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: tourney.type === 'WEEKLY_SPRINT' ? 'var(--accent-cyan)' : '#fbbf24',
                    border: `1px solid ${tourney.type === 'WEEKLY_SPRINT' ? 'rgba(129, 216, 208, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  }}
                >
                  {tourney.type === 'WEEKLY_SPRINT' ? t.arena.weeklySprint : t.arena.monthlyChampionship}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={13} /> {tourney.entrantsCount} {t.arena.participants}
                </span>
              </div>

              <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800 }}>{tourney.title}</h4>
              <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{tourney.subtitle}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.prizePool}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>
                    ${tourney.prizePoolUsd.toLocaleString()} <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>+{tourney.prizePoolXp} XP</span>
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
                <Flame size={12} /> {t.arena.liveBattleBadge}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {currentTourney.subtitle} • {t.arena.antiGamblingRules} {t.arena.maxTrailingDD} {currentTourney.rules.maxTrailingDrawdownPct}%
            </p>
          </div>

          {/* Countdown & Entry CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <Clock size={12} /> {t.arena.battleEndsIn}:
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
                  ? 'rgba(10, 186, 181, 0.2)'
                  : 'linear-gradient(135deg, var(--accent-green), #078c88)',
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
                  <CheckCircle2 size={16} /> {t.arena.enteredTracking}
                </>
              ) : (
                <>
                  <Zap size={16} /> {t.arena.enterTournament}
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
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.maxDailyLoss}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>
              ≤ {currentTourney.rules.maxDailyLossPct}% Equity Loss
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.maxTrailingDD}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
              ≤ {currentTourney.rules.maxTrailingDrawdownPct}% Peak DD
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.minTradesReq}</div>
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
        <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 700 }}>{t.arena.standingsTitle}</h4>
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
                    ? 'rgba(10, 186, 181, 0.04)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isDq
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : isTop3
                    ? '1px solid rgba(10, 186, 181, 0.3)'
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
                          {t.arena.disqualifiedBadge}
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
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.netPips}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: isDq ? 'var(--text-muted)' : 'var(--accent-green)' }}>
                      +{p.netPips.toFixed(1)}
                    </div>
                  </div>

                  <div style={{ minWidth: '140px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.estimatedPrize}</div>
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
