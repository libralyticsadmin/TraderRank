import React, { useState, useEffect } from 'react';
import { DailyTraderStats, DailyChampionRecord } from '../../../shared/src/types.ts';
import { TraderAvatar } from './TraderAvatar.tsx';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { Trophy, Award, Clock, History } from 'lucide-react';

interface DailyBestTraderCardProps {
  champion: DailyTraderStats | null;
  totalDailyPips: number;
  activeTradersToday: number;
}

export const DailyBestTraderCard: React.FC<DailyBestTraderCardProps> = ({
  champion,
  totalDailyPips,
  activeTradersToday,
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [championsHistory, setChampionsHistory] = useState<DailyChampionRecord[]>([]);

  // Calculate countdown to midnight UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrowUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      ));
      const diffMs = tomorrowUTC.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/leaderboard/daily/champions');
      if (res.ok) {
        const data = await res.json();
        setChampionsHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch champions history', err);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory && championsHistory.length === 0) {
      fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Trophy size={18} color="#f59e0b" />
            <strong style={{ fontSize: '13px', color: '#f59e0b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Daily Winning Pips Spotlight
            </strong>
            <span
              className="status-pill"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '11px',
                padding: '2px 8px',
              }}
            >
              24h Cross-Platform Window
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>
            Trader of the Day
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Highest net pip performance across XM, Axiory, Exness, and Vantage today
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <Clock size={13} color="#81d8d0" />
            <span>Rollover: <strong className="tabular" style={{ color: '#fff' }}>{timeLeft} UTC</strong></span>
          </div>

          <button
            onClick={handleToggleHistory}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <History size={13} />
            {showHistory ? 'Hide Hall of Fame' : 'Daily Champions'}
          </button>
        </div>
      </div>

      {champion ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: '20px',
            marginTop: '18px',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <TraderAvatar username={champion.username} symbol={champion.avatarSymbol} size={54} />
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#f59e0b',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)',
              }}
              title="Daily Best Trader (Rank 1)"
            >
              <Award size={12} color="#000" />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <strong style={{ fontSize: '17px', color: '#fff' }}>{champion.username}</strong>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                DAILY CROWN
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Platforms Traded:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {champion.brokers.map(b => (
                  <span
                    key={b}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#e2e8f0',
                    }}
                  >
                    <BrokerSymbol broker={b} size={12} /> {b}
                  </span>
                ))}
              </div>
              <span>•</span>
              <span>Win Rate: <strong style={{ color: '#0abab5' }}>{champion.dailyWinRate}%</strong> ({champion.dailyWinningTrades}/{champion.dailyTradesCount} trades)</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Today's Net Gain
            </span>
            <div className="tabular pip-positive" style={{ fontSize: '24px', fontWeight: 900 }}>
              +{champion.dailyTotalPips.toLocaleString()} <span style={{ fontSize: '14px' }}>pips</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Closed: +{champion.dailyClosedPips} | Float: {champion.dailyFloatingPips >= 0 ? `+${champion.dailyFloatingPips}` : champion.dailyFloatingPips}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '14px' }}>No winning pips recorded yet for today's session.</p>
        </div>
      )}

      {/* Global Day Stats Footnote */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '12px', color: 'var(--text-faint)' }}>
        <span>Total Pips Generated Today: <strong className="tabular" style={{ color: '#fff' }}>+{totalDailyPips.toLocaleString()} pips</strong></span>
        <span>Active Competing Traders: <strong className="tabular" style={{ color: '#fff' }}>{activeTradersToday}</strong></span>
      </div>

      {/* Historical Daily Champions Drawer */}
      {showHistory && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Award size={15} color="#fbbf24" />
            <strong style={{ fontSize: '13px', color: '#e2e8f0' }}>Hall of Fame — Previous Daily Best Traders</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {championsHistory.map(rec => (
              <div
                key={rec.date}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{rec.date}</div>
                  <strong style={{ fontSize: '13px', color: '#fff' }}>{rec.winnerUsername}</strong>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    {rec.winnerBrokers.map(b => (
                      <span key={b} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{b}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="tabular pip-positive" style={{ fontSize: '14px', fontWeight: 800 }}>
                    +{rec.pipsWon} pips
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                    {rec.winRate}% win rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
