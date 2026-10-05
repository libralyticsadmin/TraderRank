import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, UserPlus } from 'lucide-react';
import { TraderAvatar } from './TraderAvatar.tsx';
import { Broker } from '../../../shared/src/types.ts';

export interface TraderProfileData {
  userId: string;
  username: string;
  broker: Broker;
  avatarSymbol: string;
  tier: string;
  level: number;
  xp: number;
  rank: number;
  netPips: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  totalTrades: number;
  bestTradePips: number;
  avgHoldingTime: string;
  verifiedSince: string;
  isFollowing?: boolean;
}

interface TraderProfileModalProps {
  trader: TraderProfileData | null;
  onClose: () => void;
}

export const TraderProfileModal: React.FC<TraderProfileModalProps> = ({ trader, onClose }) => {
  if (!trader) return null;

  const [isFollowing, setIsFollowing] = useState(trader.isFollowing ?? false);

  const mockRecentTrades = [
    { id: 't_1', symbol: 'EURUSD', type: 'BUY', pips: 24.5, profit: 245.0, closedAt: 'Today 14:22' },
    { id: 't_2', symbol: 'XAUUSD', type: 'BUY', pips: 42.0, profit: 420.0, closedAt: 'Today 11:05' },
    { id: 't_3', symbol: 'GBPUSD', type: 'SELL', pips: -12.0, profit: -120.0, closedAt: 'Yesterday 18:30' },
    { id: 't_4', symbol: 'USDJPY', type: 'BUY', pips: 33.9, profit: 339.0, closedAt: 'Sep 13 09:15' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="card-panel"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #131b2e 0%, #0d1322 100%)',
          border: '1px solid rgba(129, 216, 208, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <TraderAvatar username={trader.username} symbol={trader.avatarSymbol} size={64} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>{trader.username}</h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(10, 186, 181, 0.2)',
                    color: 'var(--accent-green)',
                    border: '1px solid rgba(10, 186, 181, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ShieldCheck size={12} /> {trader.broker} VERIFIED
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {trader.tier} • Level {trader.level} ({trader.xp.toLocaleString()} XP) • Verified Since {trader.verifiedSince}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '8px',
                background: trader.rank <= 3 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: trader.rank <= 3 ? '#fbbf24' : 'var(--text-main)',
                border: trader.rank <= 3 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
              }}
            >
              #{trader.rank} Global Ranking
            </span>
          </div>

          <button
            onClick={() => setIsFollowing(!isFollowing)}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              border: isFollowing ? '1px solid var(--accent-cyan)' : 'none',
              background: isFollowing ? 'rgba(129, 216, 208, 0.15)' : 'linear-gradient(135deg, var(--accent-cyan), #0284c7)',
              color: isFollowing ? 'var(--accent-cyan)' : '#000000',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {isFollowing ? (
              <>
                <CheckCircle2 size={14} /> FOLLOWING
              </>
            ) : (
              <>
                <UserPlus size={14} /> FOLLOW TRADER
              </>
            )}
          </button>
        </div>

        {/* Performance Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Winning Pips</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '2px' }}>
              +{trader.netPips.toFixed(1)}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Win Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
              {trader.winRate}%
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profit Factor</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
              {trader.profitFactor.toFixed(2)}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Drawdown</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: trader.maxDrawdown > 5 ? '#ef4444' : 'var(--text-main)', marginTop: '2px' }}>
              {trader.maxDrawdown}%
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Trades</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {trader.totalTrades}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Best Trade</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '2px' }}>
              +{trader.bestTradePips} pips
            </div>
          </div>
        </div>

        {/* Recent Verified Trades */}
        <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 800 }}>Recent Verified Executions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mockRecentTrades.map(trade => (
            <div
              key={trade.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: trade.type === 'BUY' ? 'rgba(10, 186, 181, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: trade.type === 'BUY' ? 'var(--accent-green)' : '#ef4444',
                  }}
                >
                  {trade.type}
                </span>
                <strong style={{ fontSize: '14px' }}>{trade.symbol}</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{trade.closedAt}</span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: trade.pips > 0 ? 'var(--accent-green)' : '#ef4444' }}>
                  {trade.pips > 0 ? `+${trade.pips}` : trade.pips} pips
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {trade.profit > 0 ? `+$${trade.profit}` : `-$${Math.abs(trade.profit)}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
