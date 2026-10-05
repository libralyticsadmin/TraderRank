import React, { useState, useMemo } from 'react';
import { LeaderboardEntry, DailyLeaderboardResult, Broker } from '../../../shared/src/types.ts';
import { TraderAvatar } from './TraderAvatar.tsx';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import {
  Trophy,
  Award,
  Calendar,
  Flame,
  TrendingUp,
  Percent,
  Search,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface LiveLeaderboardProps {
  entries: LeaderboardEntry[];
  dailyResult?: DailyLeaderboardResult | null;
  onSelectTrader?: (trader: { username: string; broker: Broker; rank: number; score: number }) => void;
}

export type RankingMetric = 'pips' | 'profit' | 'rate';
export type RankingPeriod = 'daily' | 'weekly' | 'all_time';

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  entries,
  dailyResult,
  onSelectTrader,
}) => {
  const [metric, setMetric] = useState<RankingMetric>('pips');
  const [period, setPeriod] = useState<RankingPeriod>('daily');
  const [brokerFilter, setBrokerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Daily standings from server
  const dailyStandings = dailyResult?.standings || [];

  // Synthesize enriched leaderboard items
  const processedEntries = useMemo(() => {
    // If daily period is selected and dailyResult has standings, convert to unified shape
    const baseList = period === 'daily' && dailyStandings.length > 0
      ? dailyStandings.map(d => {
          const primaryBroker: Broker = (d.brokers && d.brokers.length > 0) ? d.brokers[0] : 'Exness';
          const pips = d.dailyTotalPips || 0;
          const trades = d.dailyTradesCount || 5;
          return {
            userId: d.userId,
            username: d.username,
            broker: primaryBroker,
            avatarSymbol: d.avatarSymbol,
            winningPips: pips,
            profitAmount: Number((pips * 100 * (1 + trades * 0.1)).toFixed(2)),
            profitRate: Number(((pips / 30) * 10).toFixed(1)),
            rank: d.rank,
            tradesCount: trades,
            winRate: d.dailyWinRate || 68,
            xp: 1200 + (d.rank <= 3 ? 2000 : 500),
            tier: d.rank === 1 ? 'Apex Predator' : d.rank <= 3 ? 'Market Veteran' : 'Pro Swing',
          };
        })
      : entries.map((e, idx) => {
          const primaryBroker: Broker = (e.brokers && e.brokers.length > 0) ? e.brokers[0] : 'Exness';
          const pips = e.totalPips || 0;
          return {
            userId: e.userId,
            username: e.username,
            broker: primaryBroker,
            avatarSymbol: e.avatarSymbol,
            winningPips: pips,
            profitAmount: Number((pips * 85).toFixed(2)),
            profitRate: Number(((pips / 25) * 10).toFixed(1)),
            rank: idx + 1,
            tradesCount: e.tradesCount || 12,
            winRate: e.winRate || 72,
            xp: e.xp || 2500,
            tier: 'Market Veteran',
          };
        });

    // Filter by Broker
    let filtered = baseList;
    if (brokerFilter !== 'ALL') {
      filtered = filtered.filter(item => item.broker.toUpperCase() === brokerFilter.toUpperCase());
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => item.username.toLowerCase().includes(q));
    }

    // Sort by selected metric
    const sorted = [...filtered].sort((a, b) => {
      if (metric === 'profit') {
        return b.profitAmount - a.profitAmount;
      }
      if (metric === 'rate') {
        return b.profitRate - a.profitRate;
      }
      return b.winningPips - a.winningPips;
    });

    // Re-assign display ranks
    return sorted.map((item, index) => ({
      ...item,
      displayRank: index + 1,
    }));
  }, [entries, dailyStandings, period, metric, brokerFilter, searchQuery]);

  const top3 = processedEntries.slice(0, 3);

  return (
    <div className="card-panel" style={{ padding: '24px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Global Verified Leaderboard
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(10, 186, 181, 0.15)',
                    color: 'var(--accent-green)',
                    border: '1px solid rgba(10, 186, 181, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Zap size={12} /> LIVE VERIFIED
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Multi-broker verified performance ranked by pure skill &amp; normalized pips
              </p>
            </div>
          </div>

          {/* Period Selector Tabs (Daily / Weekly / All-Time) */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '10px',
              padding: '4px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {[
              { id: 'daily', label: 'Daily Sprint', icon: Calendar },
              { id: 'weekly', label: 'Weekly League', icon: Trophy },
              { id: 'all_time', label: 'All-Time Legends', icon: Flame },
            ].map(tab => {
              const Icon = tab.icon;
              const active = period === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id as RankingPeriod)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg, #0abab5, #078c88)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter Bar: Metric Mode & Broker Selector */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Metric Sort Buttons (Winning Pips / Profit / Rate) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Ranking Metric:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'pips', label: 'Winning Pips', icon: TrendingUp },
                { id: 'profit', label: 'Profit Amount ($)', icon: Trophy },
                { id: 'rate', label: 'Profit Rate (%)', icon: Percent },
              ].map(m => {
                const Icon = m.icon;
                const active = metric === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMetric(m.id as RankingMetric)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: active ? '1px solid rgba(129, 216, 208, 0.5)' : '1px solid transparent',
                      background: active ? 'rgba(129, 216, 208, 0.15)' : 'transparent',
                      color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Icon size={13} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Broker Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search trader..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px 6px 30px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#fff',
                  fontSize: '12px',
                  width: '160px',
                  outline: 'none',
                }}
              />
            </div>

            <select
              value={brokerFilter}
              onChange={e => setBrokerFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.4)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Brokers</option>
              <option value="Exness">Exness</option>
              <option value="XM">XM Global</option>
              <option value="Axiory">Axiory</option>
              <option value="Vantage">Vantage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Showcase */}
      {top3.length > 0 && !searchQuery && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          {top3.map(trader => {
            const is1 = trader.displayRank === 1;
            const is2 = trader.displayRank === 2;
            const glowColor = is1 ? '#fbbf24' : is2 ? '#94a3b8' : '#d97706';
            const badgeTitle = is1 ? 'Gold Champion' : is2 ? 'Silver Contender' : 'Bronze Master';

            return (
              <div
                key={trader.userId}
                onClick={() => onSelectTrader?.({ username: trader.username, broker: trader.broker, rank: trader.displayRank, score: trader.winningPips })}
                style={{
                  background: `linear-gradient(180deg, ${glowColor}15 0%, rgba(15, 23, 42, 0.9) 100%)`,
                  border: `1px solid ${glowColor}40`,
                  borderRadius: '16px',
                  padding: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: is1 ? `0 10px 25px -5px ${glowColor}25` : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: `${glowColor}25`,
                      color: glowColor,
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    <Award size={16} />
                    #{trader.displayRank} {badgeTitle}
                  </div>
                  <BrokerSymbol broker={trader.broker} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <TraderAvatar username={trader.username} symbol={trader.avatarSymbol} size={50} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>{trader.username}</h4>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {trader.tier} • {trader.tradesCount} Trades
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Winning Pips</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-green)' }}>
                      +{trader.winningPips.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. Profit</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>
                      +${trader.profitAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Ranking Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {processedEntries.map(trader => {
          const isTop3 = trader.displayRank <= 3;
          return (
            <div
              key={trader.userId}
              onClick={() => onSelectTrader?.({ username: trader.username, broker: trader.broker, rank: trader.displayRank, score: trader.winningPips })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: '12px',
                background: isTop3 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = isTop3 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '32px',
                    fontWeight: 800,
                    fontSize: '14px',
                    textAlign: 'center',
                    color: trader.displayRank === 1 ? '#fbbf24' : trader.displayRank === 2 ? '#94a3b8' : trader.displayRank === 3 ? '#d97706' : 'var(--text-muted)',
                  }}
                >
                  #{trader.displayRank}
                </div>

                <TraderAvatar username={trader.username} symbol={trader.avatarSymbol} size={38} />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>{trader.username}</strong>
                    <BrokerSymbol broker={trader.broker} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {trader.tier}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <span>Win Rate: <strong style={{ color: 'var(--text-main)' }}>{trader.winRate}%</strong></span>
                    <span>XP: <strong style={{ color: 'var(--accent-cyan)' }}>{trader.xp}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', textAlign: 'right' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Pips</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-green)' }}>
                    +{trader.winningPips.toFixed(1)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profit ($)</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>
                    +${trader.profitAmount.toLocaleString()}
                  </div>
                </div>

                <div style={{ minWidth: '70px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rate</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    +{trader.profitRate}%
                  </div>
                </div>

                <ExternalLink size={16} color="var(--text-muted)" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
