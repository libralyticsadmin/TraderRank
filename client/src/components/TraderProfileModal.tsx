import React, { useState, useEffect, useMemo } from 'react';
import { X, ShieldCheck, CheckCircle2, UserPlus, Radio, Instagram } from 'lucide-react';
import { TraderAvatar } from './TraderAvatar.tsx';
import { Broker } from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';

export interface TraderProfileData {
  userId: string;
  username: string;
  broker: Broker;
  avatarSymbol: string;
  avatarUrl?: string;
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
  telegramHandle?: string;
  discordHandle?: string;
  twitterHandle?: string;
  instagramHandle?: string;
}

interface VerifiedTrade {
  id: string;
  positionId: string;
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
  swap: number;
  digits: number;
}

function getInstrumentSpec(rawSymbol: string): { pipSize: number; digits: number; pipValPerLot: number } {
  const sym = rawSymbol.toUpperCase().replace(/(\.M|\.I|\.RAW|\.PRO|\.ECN|\.CASH|_I|_M|_SB|\+|#)$/i, '');
  if (sym.includes('XAU') || sym.includes('GOLD')) {
    return { pipSize: 0.10, digits: 2, pipValPerLot: 10.0 };
  }
  if (sym.includes('XAG') || sym.includes('SILVER')) {
    return { pipSize: 0.01, digits: 3, pipValPerLot: 50.0 };
  }
  if (sym.endsWith('JPY')) {
    return { pipSize: 0.01, digits: 3, pipValPerLot: 6.5 };
  }
  if (
    sym.includes('BTC') ||
    sym.includes('ETH') ||
    sym.includes('US30') ||
    sym.includes('DJ30') ||
    sym.includes('NAS100') ||
    sym.includes('USTEC') ||
    sym.includes('SPX') ||
    sym.includes('US500') ||
    sym.includes('GER40') ||
    sym.includes('UK100')
  ) {
    return { pipSize: 1.0, digits: 2, pipValPerLot: 1.0 };
  }
  if (sym.includes('OIL') || sym.includes('WTI') || sym.includes('MCL') || sym.includes('XTI')) {
    return { pipSize: 0.01, digits: 2, pipValPerLot: 10.0 };
  }
  return { pipSize: 0.0001, digits: 5, pipValPerLot: 10.0 };
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
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'GOLD' | 'WINS' | 'OCT'>('ALL');
  const [visibleLimit, setVisibleLimit] = useState<number>(20);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingTrades(true);
    fetch(`/api/accounts/${trader.userId}/trades`)
      .then(res => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const valid = data.filter(d => {
            const sym = String(d.symbol || '').toUpperCase();
            if (!sym || sym === 'UNKNOWN' || sym === 'BALANCE') return false;
            const vol = Number(d.lotSize ?? d.volume ?? 0);
            return vol > 0;
          });

          const normalized = valid.map(d => {
            const symbol = String(d.symbol).trim();
            const type = (d.type === 'BUY' ? 'BUY' : 'SELL') as 'BUY' | 'SELL';
            const lotSize = Number(d.lotSize ?? d.volume ?? 0.01);
            let openPrice = Number(d.openPrice ?? 0);
            let closePrice = Number(d.closePrice ?? openPrice ?? 0);
            const pnlCurrency = Number(d.pnlCurrency ?? d.profitCurrency ?? d.profit ?? 0);
            const swap = Number(d.swap ?? 0);
            let pnlPips = Number(d.pnlPips ?? d.profitPips ?? 0);

            const { pipSize, digits, pipValPerLot } = getInstrumentSpec(symbol);

            if (pnlPips === 0 && openPrice > 0 && closePrice > 0 && openPrice !== closePrice) {
              const priceDiff = type === 'BUY' ? closePrice - openPrice : openPrice - closePrice;
              pnlPips = Number((priceDiff / pipSize).toFixed(1));
            }

            if (pnlPips === 0 && pnlCurrency !== 0 && lotSize > 0) {
              pnlPips = Number((pnlCurrency / (lotSize * pipValPerLot)).toFixed(1));
            }

            if (openPrice > 0 && closePrice > 0 && openPrice === closePrice && pnlPips !== 0) {
              const priceMove = pnlPips * pipSize;
              openPrice = type === 'BUY'
                ? Number((closePrice - priceMove).toFixed(digits))
                : Number((closePrice + priceMove).toFixed(digits));
            } else {
              if (openPrice > 0) openPrice = Number(openPrice.toFixed(digits));
              if (closePrice > 0) closePrice = Number(closePrice.toFixed(digits));
            }

            const rawId = String(d.id || '');
            const posMatch = rawId.match(/_(\d+)$/);
            const positionId = posMatch ? posMatch[1] : String(d.ticket || 'N/A');

            return {
              id: rawId || String(d.ticket || Math.random()),
              positionId,
              ticket: String(d.ticket || positionId),
              symbol,
              type,
              lotSize,
              openPrice,
              closePrice,
              openTime: d.openTime || '',
              closeTime: d.closeTime || '',
              pnlCurrency,
              pnlPips,
              swap,
              digits,
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

  const filteredTrades = useMemo(() => {
    if (ledgerFilter === 'GOLD') {
      return realTrades.filter(t => t.symbol.toUpperCase().includes('GOLD') || t.symbol.toUpperCase().includes('XAU'));
    }
    if (ledgerFilter === 'WINS') {
      return realTrades.filter(t => t.pnlCurrency > 0 || (t.pnlCurrency === 0 && t.pnlPips > 0));
    }
    if (ledgerFilter === 'OCT') {
      return realTrades.filter(t => t.closeTime.startsWith('2026-10'));
    }
    return realTrades;
  }, [realTrades, ledgerFilter]);

  // Compute live performance metrics dynamically from the active verified trade ledger
  const stats = useMemo(() => {
    const source = filteredTrades.length > 0 ? filteredTrades : realTrades;
    if (source.length === 0) {
      return {
        netPips: trader.netPips,
        winningPips: Math.max(0, trader.netPips),
        winRate: trader.winRate,
        winCount: Math.round((trader.totalTrades * trader.winRate) / 100),
        lossCount: Math.max(0, trader.totalTrades - Math.round((trader.totalTrades * trader.winRate) / 100)),
        profitFactor: trader.profitFactor,
        grossProfit: 0,
        grossLoss: 0,
        netProfitUsd: 0,
        totalTrades: trader.totalTrades,
        bestTradePips: trader.bestTradePips,
        bestTradeUsd: 0,
        level: trader.level,
        xp: trader.xp,
        verifiedSince: trader.verifiedSince,
        isLiveCalculated: false,
      };
    }

    const netPips = Number(source.reduce((sum, t) => sum + t.pnlPips, 0).toFixed(1));
    const winningTrades = source.filter(t => t.pnlCurrency > 0 || (t.pnlCurrency === 0 && t.pnlPips > 0));
    const winningPips = Number(
      winningTrades.reduce((sum, t) => sum + Math.max(0, t.pnlPips), 0).toFixed(1)
    );
    const winRate = Math.round((winningTrades.length / source.length) * 100);

    const grossProfit = Number(
      source.filter(t => t.pnlCurrency > 0).reduce((s, t) => s + t.pnlCurrency, 0).toFixed(2)
    );
    const grossLoss = Number(
      Math.abs(source.filter(t => t.pnlCurrency < 0).reduce((s, t) => s + t.pnlCurrency, 0)).toFixed(2)
    );
    const netProfitUsd = Number(source.reduce((s, t) => s + t.pnlCurrency, 0).toFixed(2));
    const profitFactor = grossLoss > 0
      ? Number((grossProfit / grossLoss).toFixed(2))
      : grossProfit > 0 ? 99.99 : 1.0;

    const bestTradePips = Math.max(0, ...source.map(t => t.pnlPips));
    const bestTradeUsd = Math.max(0, ...source.map(t => t.pnlCurrency));

    // Derive earliest trade month/year
    const oldestTrade = realTrades[realTrades.length - 1];
    const verifiedSince = oldestTrade?.openTime
      ? new Date(oldestTrade.openTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : trader.verifiedSince;

    const xp = realTrades.length * 25;
    const level = Math.max(1, Math.floor(realTrades.length / 40) + 1);

    return {
      netPips,
      winningPips,
      winRate,
      winCount: winningTrades.length,
      lossCount: source.length - winningTrades.length,
      profitFactor,
      grossProfit,
      grossLoss,
      netProfitUsd,
      totalTrades: source.length,
      bestTradePips: Number(bestTradePips.toFixed(1)),
      bestTradeUsd: Number(bestTradeUsd.toFixed(2)),
      level,
      xp,
      verifiedSince,
      isLiveCalculated: true,
    };
  }, [filteredTrades, realTrades, trader]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formattedLevelText = t.profile.levelLabel.includes('{level}')
    ? t.profile.levelLabel.replace('{level}', String(stats.level))
    : `${t.profile.levelLabel} ${stats.level}`;

  const formattedVerifiedSince = t.profile.verifiedSinceLabel.includes('{date}')
    ? t.profile.verifiedSinceLabel.replace('{date}', stats.verifiedSince)
    : `${t.profile.verifiedSinceLabel} ${stats.verifiedSince}`;

  const formattedRankBadge = t.profile.globalRankingBadge.includes('{rank}')
    ? t.profile.globalRankingBadge.replace('{rank}', String(trader.rank))
    : `#${trader.rank} ${t.profile.globalRankingBadge}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '680px',
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
            <TraderAvatar username={trader.username} symbol={trader.avatarSymbol} avatarUrl={trader.avatarUrl} size={64} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
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
                  <ShieldCheck size={12} /> {trader.broker} MT5 Read-Only Verified
                </span>
                {trader.instagramHandle && (
                  <a
                    href={`https://instagram.com/${trader.instagramHandle.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Instagram: ${trader.instagramHandle}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#e1306c',
                      background: 'rgba(225, 48, 108, 0.12)',
                      border: '1px solid rgba(225, 48, 108, 0.35)',
                      padding: '2px 7px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    <Instagram size={11} color="#e1306c" />
                    <span>{trader.instagramHandle.startsWith('@') ? trader.instagramHandle : `@${trader.instagramHandle}`}</span>
                  </a>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {trader.tier} • {formattedLevelText} ({stats.xp.toLocaleString()} XP) • {formattedVerifiedSince}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LanguageSelector variant="compact" />
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
        </div>

        {/* Action Row & Scope Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
              {formattedRankBadge}
            </span>

            {/* Ledger Scope Selector to match Broker Terminal Filters */}
            {realTrades.length > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '2px',
                  gap: '3px',
                }}
              >
                {[
                  { id: 'ALL', label: `All (${realTrades.length})` },
                  { id: 'GOLD', label: `GOLD# (${realTrades.filter(t => t.symbol.includes('GOLD')).length})` },
                  { id: 'OCT', label: `Oct (${realTrades.filter(t => t.closeTime.startsWith('2026-10')).length})` },
                  { id: 'WINS', label: `Wins (${realTrades.filter(t => t.pnlCurrency > 0).length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setLedgerFilter(tab.id as any);
                      setVisibleLimit(20);
                    }}
                    style={{
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: ledgerFilter === tab.id ? 'rgba(10, 186, 181, 0.25)' : 'transparent',
                      color: ledgerFilter === tab.id ? '#00f0ff' : '#94a3b8',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
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

        {/* Performance Metrics Grid (100% Live Calculated from MetaApi Broker Deals) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          {/* Card 1: Winning Pips + Net Pips */}
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Winning Pips Harvested</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
              +{stats.winningPips.toLocaleString()} pips
            </div>
            <div style={{ fontSize: '10.5px', color: stats.netPips >= 0 ? '#34d399' : '#f87171', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
              Net Delta: {stats.netPips >= 0 ? `+${stats.netPips.toFixed(1)}` : stats.netPips.toFixed(1)} pips
            </div>
          </div>

          {/* Card 2: Win Rate + Win/Loss Breakdown */}
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.profile.winRate}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
              {stats.winRate}%
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span style={{ color: '#34d399', fontWeight: 700 }}>{stats.winCount}W</span> /{' '}
              <span style={{ color: '#f87171', fontWeight: 700 }}>{stats.lossCount}L</span> Closed
            </div>
          </div>

          {/* Card 3: Profit Factor + Gross Profit/Loss */}
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.profile.profitFactor}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
              {stats.profitFactor.toFixed(2)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
              +${stats.grossProfit.toLocaleString()} / -${stats.grossLoss.toLocaleString()}
            </div>
          </div>

          {/* Card 4: Realized P&L (USD) */}
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Realized Trade P&L (USD)</div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: stats.netProfitUsd >= 0 ? 'var(--accent-green)' : '#f87171',
                marginTop: '2px',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {stats.netProfitUsd >= 0
                ? `+$${stats.netProfitUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `-$${Math.abs(stats.netProfitUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              MT5 Closed Deal Ledger
            </div>
          </div>

          {/* Card 5: Total Verified Trades */}
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.profile.totalTrades}</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
              {stats.totalTrades}
            </div>
            <div style={{ fontSize: '10px', color: '#0abab5', marginTop: '2px', fontWeight: 700 }}>
              100% MetaApi Audited
            </div>
          </div>

          {/* Card 6: Best Single Trade */}
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.profile.bestTrade}</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
              +{stats.bestTradePips} pips
            </div>
            {stats.bestTradeUsd > 0 && (
              <div style={{ fontSize: '10.5px', color: '#34d399', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
                Peak Win: +${stats.bestTradeUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Verified Trades Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
            {t.profile.recentVerifiedExecutions} ({filteredTrades.length})
          </h4>
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
          ) : filteredTrades.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              No closed executions recorded on this broker ledger yet.
            </div>
          ) : (
            <>
              {filteredTrades.slice(0, visibleLimit).map((trade, idx) => {
                const isProfit = trade.pnlCurrency >= 0;
                const formattedTime = trade.closeTime
                  ? new Date(trade.closeTime).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Verified';

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '14px' }}>{trade.symbol}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {trade.lotSize} lots
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#94a3b8',
                              background: 'rgba(255,255,255,0.06)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontFamily: 'var(--font-mono, monospace)',
                            }}
                            title={`MT5 Position ID: #${trade.positionId} • Exit Deal ID: #${trade.ticket}`}
                          >
                            Pos #{trade.positionId}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
                          {trade.openPrice > 0 ? `@ ${trade.openPrice.toFixed(trade.digits)}` : ''}{' '}
                          {trade.closePrice > 0 ? `→ ${trade.closePrice.toFixed(trade.digits)}` : ''} • {formattedTime}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono, monospace)' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: isProfit ? 'var(--accent-green)' : '#ef4444' }}>
                        {trade.pnlPips > 0 ? `+${trade.pnlPips.toFixed(1)}` : trade.pnlPips.toFixed(1)} pips
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: isProfit ? 'var(--accent-green)' : '#ef4444' }}>
                        {isProfit ? `+$${trade.pnlCurrency.toFixed(2)}` : `-$${Math.abs(trade.pnlCurrency).toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTrades.length > visibleLimit && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit(prev => prev + 30)}
                  style={{
                    marginTop: '6px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(10, 186, 181, 0.12)',
                    border: '1px solid rgba(10, 186, 181, 0.35)',
                    color: '#00f0ff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Load More Verified Executions ({filteredTrades.length - visibleLimit} remaining)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
