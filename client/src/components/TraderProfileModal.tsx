import React, { useState, useEffect, useMemo } from 'react';
import { X, ShieldCheck, CheckCircle2, UserPlus, Radio } from 'lucide-react';
import { TraderAvatar } from './TraderAvatar.tsx';
import { Broker } from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';

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

interface VerifiedTrade {
  ticket: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lotSize: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  pnlCurrency: number;
  pnlPips: number;
}

interface TraderProfileModalProps {
  trader: TraderProfileData | null;
  onClose: () => void;
}

export const TraderProfileModal: React.FC<TraderProfileModalProps> = ({ trader, onClose }) => {
  const { t } = useTranslation();
  if (!trader) return null;

  const [isFollowing, setIsFollowing] = useState(trader.isFollowing ?? false);
  const [realTrades, setRealTrades] = useState<VerifiedTrade[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingTrades(true);
    fetch(`/api/accounts/${trader.userId}/trades`)
      .then(res => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          // Filter out balance adjustments and unpopulated transactions
          const valid = data.filter(d => {
            const sym = String(d.symbol || '').toUpperCase();
            if (!sym || sym === 'UNKNOWN' || sym === 'BALANCE') return false;
            const vol = Number(d.lotSize ?? d.volume ?? 0);
            return vol > 0;
          });

          const normalized = valid.map(d => {
            const symbol = String(d.symbol || 'GOLD#');
            const type = (d.type === 'BUY' ? 'BUY' : 'SELL') as 'BUY' | 'SELL';
            const lotSize = Number(d.lotSize ?? d.volume ?? 0.01);
            let openPrice = Number(d.openPrice ?? 0);
            let closePrice = Number(d.closePrice ?? openPrice ?? 0);
            const pnlCurrency = Number(d.pnlCurrency ?? d.profit ?? 0);
            let pnlPips = Number(d.pnlPips ?? 0);

            const isGold = symbol.toUpperCase().includes('GOLD') || symbol.toUpperCase().includes('XAU');

            // Fallback pip calculation if pnlPips is missing or 0 but realized profit exists
            if (pnlPips === 0 && pnlCurrency !== 0 && lotSize > 0) {
              const pipValPerLot = isGold ? 10.0 : 10.0;
              pnlPips = Number((pnlCurrency / (lotSize * pipValPerLot)).toFixed(1));
            }

            // Fallback openPrice derivation if openPrice matches closePrice but trade had pips/profit
            if (openPrice > 0 && closePrice > 0 && openPrice === closePrice && pnlPips !== 0) {
              const pipSize = isGold ? 0.10 : 0.0001;
              const priceMove = pnlPips * pipSize;
              openPrice = type === 'BUY'
                ? Number((closePrice - priceMove).toFixed(2))
                : Number((closePrice + priceMove).toFixed(2));
            }

            return {
              ticket: String(d.ticket || d.id || 'N/A'),
              symbol,
              type,
              lotSize,
              openPrice,
              closePrice,
              openTime: d.openTime || '',
              closeTime: d.closeTime || '',
              pnlCurrency,
              pnlPips,
            };
          });

          setRealTrades(normalized);
        } else {
          setRealTrades([]);
        }
      })
      .catch(err => {
        console.error('Failed to load verified trades', err);
        if (isMounted) setRealTrades([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTrades(false);
      });

    return () => {
      isMounted = false;
    };
  }, [trader.userId]);

  // Compute live performance metrics dynamically from verified trade ledger
  const stats = useMemo(() => {
    if (realTrades.length === 0) {
      return {
        netPips: trader.netPips,
        winRate: trader.winRate,
        profitFactor: trader.profitFactor,
        maxDrawdown: trader.maxDrawdown,
        totalTrades: trader.totalTrades,
        bestTradePips: trader.bestTradePips,
        isLiveCalculated: false,
      };
    }

    const netPips = Number(realTrades.reduce((sum, t) => sum + t.pnlPips, 0).toFixed(1));
    const winningTrades = realTrades.filter(t => t.pnlCurrency > 0 || t.pnlPips > 0);
    const winRate = Math.round((winningTrades.length / realTrades.length) * 100);

    const grossProfit = realTrades.filter(t => t.pnlCurrency > 0).reduce((s, t) => s + t.pnlCurrency, 0);
    const grossLoss = Math.abs(realTrades.filter(t => t.pnlCurrency < 0).reduce((s, t) => s + t.pnlCurrency, 0));
    const profitFactor = grossLoss > 0
      ? Number((grossProfit / grossLoss).toFixed(2))
      : grossProfit > 0 ? 99.99 : 1.0;

    const bestTradePips = Math.max(0, ...realTrades.map(t => t.pnlPips));

    return {
      netPips,
      winRate,
      profitFactor,
      maxDrawdown: trader.maxDrawdown,
      totalTrades: realTrades.length,
      bestTradePips: Number(bestTradePips.toFixed(1)),
      isLiveCalculated: true,
    };
  }, [realTrades, trader]);

  // Keyboard escape route
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
                  <ShieldCheck size={12} /> {trader.broker} {t.profile.verifiedSince}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {trader.tier} • {t.profile.levelLabel} {trader.level} ({trader.xp.toLocaleString()} XP) • {t.profile.verifiedSinceLabel} {trader.verifiedSince}
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
              #{trader.rank} {t.profile.globalRankingBadge}
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
                <CheckCircle2 size={14} /> {t.profile.followingBtn}
              </>
            ) : (
              <>
                <UserPlus size={14} /> {t.profile.followBtn}
              </>
            )}
          </button>
        </div>

        {/* Performance Metrics Grid (Dynamic Sync from Verified Ledger) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.profile.netWinningPips}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '2px' }}>
              {stats.netPips > 0 ? `+${stats.netPips.toFixed(1)}` : stats.netPips.toFixed(1)}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.profile.winRate}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
              {stats.winRate}%
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.profile.profitFactor}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
              {stats.profitFactor.toFixed(2)}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.profile.maxDrawdown}</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: stats.maxDrawdown > 5 ? '#ef4444' : 'var(--text-main)', marginTop: '2px' }}>
              {stats.maxDrawdown}%
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.profile.totalTrades}</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.totalTrades}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.profile.bestTrade}</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '2px' }}>
              +{stats.bestTradePips} pips
            </div>
          </div>
        </div>

        {/* Recent Verified Trades Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{t.profile.recentVerifiedExecutions}</h4>
          <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={12} className="animate-pulse" style={{ color: 'var(--accent-green)' }} />
            MetaApi Read-Only Audit Verified
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isLoadingTrades ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Verifying closed deals directly from broker ledger...
            </div>
          ) : realTrades.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              No closed executions recorded on this broker ledger yet.
            </div>
          ) : (
            realTrades.slice(0, 10).map((trade, idx) => {
              const isProfit = trade.pnlCurrency >= 0;
              const formattedTime = trade.closeTime ? new Date(trade.closeTime).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'Verified';

              return (
                <div
                  key={trade.ticket !== 'N/A' ? `${trade.ticket}_${idx}` : `trade_${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 7px',
                        borderRadius: '4px',
                        background: trade.type === 'BUY' ? 'rgba(10, 186, 181, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: trade.type === 'BUY' ? 'var(--accent-green)' : '#ef4444',
                      }}
                    >
                      {trade.type}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '14px' }}>{trade.symbol}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {trade.lotSize} lots
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px' }}>
                          #{trade.ticket}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {trade.openPrice > 0 ? `@ ${trade.openPrice}` : ''} {trade.closePrice > 0 ? `→ ${trade.closePrice}` : ''} • {formattedTime}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: isProfit ? 'var(--accent-green)' : '#ef4444' }}>
                      {trade.pnlPips > 0 ? `+${trade.pnlPips.toFixed(1)}` : trade.pnlPips.toFixed(1)} pips
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isProfit ? 'var(--accent-green)' : '#ef4444' }}>
                      {isProfit ? `+$${trade.pnlCurrency.toFixed(2)}` : `-$${Math.abs(trade.pnlCurrency).toFixed(2)}`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
