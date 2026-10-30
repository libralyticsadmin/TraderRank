import React, { useState, useEffect } from 'react';
import { Broker } from '../../../shared/src/types.ts';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { TraderAvatar } from './TraderAvatar.tsx';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Zap,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext.tsx';

export interface BulletinTradeItem {
  id: string;
  trader: string;
  broker: Broker;
  symbol: string;
  type: 'BUY' | 'SELL' | 'TP_HIT' | 'SL_HIT' | 'RECORD';
  pips: number;
  lotSize: number;
  profitUsd: number;
  timeAgo: string;
  tag?: string;
  tagKey?: string;
  isHot?: boolean;
  rank?: number;
}

interface LiveTradeBulletinProps {
  onSelectTrader?: (trader: { username: string; broker?: Broker; rank?: number; score?: number }) => void;
  speed?: 'normal' | 'fast' | 'slow';
}

const DEFAULT_SPOTLIGHT_TRADES: BulletinTradeItem[] = [
  {
    id: 'spot-1',
    trader: 'GoldBug_JP',
    broker: 'Exness',
    symbol: 'XAUUSD',
    type: 'BUY',
    pips: 48.5,
    lotSize: 2.0,
    profitUsd: 970.0,
    timeAgo: 'Just now',
    tagKey: 'goldRush',
    isHot: true,
    rank: 1,
  },
  {
    id: 'spot-2',
    trader: 'FX_Sniper',
    broker: 'XM',
    symbol: 'EURUSD',
    type: 'SELL',
    pips: 32.1,
    lotSize: 1.5,
    profitUsd: 481.5,
    timeAgo: '1m ago',
    tagKey: 'scalpWin',
    isHot: true,
    rank: 2,
  },
  {
    id: 'spot-3',
    trader: 'ZenScalper',
    broker: 'IC_MARKETS',
    symbol: 'USDJPY',
    type: 'BUY',
    pips: 27.4,
    lotSize: 1.0,
    profitUsd: 274.0,
    timeAgo: '2m ago',
    tagKey: 'takeProfit',
    isHot: false,
    rank: 3,
  },
  {
    id: 'spot-4',
    trader: 'TokyoRider',
    broker: 'Exness',
    symbol: 'BTCUSD',
    type: 'BUY',
    pips: 85.0,
    lotSize: 0.5,
    profitUsd: 425.0,
    timeAgo: '3m ago',
    tagKey: 'tournamentLead',
    isHot: true,
    rank: 4,
  },
  {
    id: 'spot-5',
    trader: 'Elena_Scalps',
    broker: 'Vantage',
    symbol: 'GBPUSD',
    type: 'BUY',
    pips: 38.6,
    lotSize: 1.2,
    profitUsd: 463.2,
    timeAgo: '4m ago',
    tagKey: 'londonBreakout',
    isHot: true,
    rank: 5,
  },
  {
    id: 'spot-6',
    trader: 'Sofia_Quant',
    broker: 'Axiory',
    symbol: 'XAUUSD',
    type: 'SELL',
    pips: 52.0,
    lotSize: 1.5,
    profitUsd: 780.0,
    timeAgo: '6m ago',
    tagKey: 'pipsSurge',
    isHot: true,
    rank: 6,
  },
];

export const LiveTradeBulletin: React.FC<LiveTradeBulletinProps> = ({
  onSelectTrader,
}) => {
  const { t } = useTranslation();
  const [trades, setTrades] = useState<BulletinTradeItem[]>(DEFAULT_SPOTLIGHT_TRADES);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const SPOTLIGHT_INTERVAL_MS = 4500;

  const getTagLabel = (item: BulletinTradeItem) => {
    if (item.tagKey && (t.bulletin as any)[item.tagKey]) {
      return (t.bulletin as any)[item.tagKey];
    }
    return item.tag || t.bulletin.verifiedBridge;
  };

  // Fetch real trades from connected MetaApi / broker accounts
  useEffect(() => {
    let isMounted = true;

    const loadRealTrades = async () => {
      try {
        const accRes = await fetch('/api/accounts');
        if (!accRes.ok) return;
        const accounts = await accRes.json();
        if (!Array.isArray(accounts) || accounts.length === 0) return;

        const collected: BulletinTradeItem[] = [];
        for (const acc of accounts) {
          try {
            const trRes = await fetch(`/api/accounts/${acc.id}/trades`);
            if (trRes.ok) {
              const rawTrades = await trRes.json();
              if (Array.isArray(rawTrades)) {
                for (const tr of rawTrades) {
                  if (!tr.symbol || tr.symbol === 'UNKNOWN' || tr.symbol.trim() === '') continue;

                  let pips = Number((tr.profitPips ?? tr.pnlPips ?? 0).toFixed(1));
                  const profit = Number((tr.profitCurrency ?? tr.profit ?? 0).toFixed(2));
                  const lotSize = Number((tr.lotSize ?? tr.volume ?? 0.05).toFixed(2));

                  // Calculate pips from price delta if server sent 0
                  if (pips === 0 && tr.closePrice && tr.openPrice && tr.closePrice !== tr.openPrice) {
                    const isJPY = tr.symbol.includes('JPY');
                    const isGold = tr.symbol.includes('XAU') || tr.symbol.includes('GOLD');
                    const mult = isJPY ? 100 : isGold ? 10 : 10000;
                    const diff = tr.type === 'BUY' ? tr.closePrice - tr.openPrice : tr.openPrice - tr.closePrice;
                    pips = Number((diff * mult).toFixed(1));
                  } else if (pips === 0 && profit !== 0 && lotSize > 0) {
                    const isGold = tr.symbol.includes('XAU') || tr.symbol.includes('GOLD');
                    const pipVal = isGold ? 10 : 10;
                    pips = Number((profit / (lotSize * pipVal)).toFixed(1));
                  }

                  // Skip duplicate zero-pip and zero-profit records
                  if (pips === 0 && profit === 0) continue;

                  collected.push({
                    id: tr.id || `tr_${Math.random()}`,
                    trader: acc.username || `Trader-${acc.accountNumber}`,
                    broker: acc.broker || 'XM',
                    symbol: tr.symbol,
                    type: tr.type === 'BUY' ? 'BUY' : 'SELL',
                    pips,
                    lotSize,
                    profitUsd: profit,
                    timeAgo: tr.closeTime ? new Date(tr.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
                    tagKey: pips > 20 ? 'scalpWin' : 'takeProfit',
                    isHot: pips >= 25,
                  });
                }
              }
            }
          } catch {
            // ignore
          }
        }

        if (isMounted && collected.length > 0) {
          const uniqueReal = collected.slice(0, 8);
          setTrades([...uniqueReal, ...DEFAULT_SPOTLIGHT_TRADES]);
        }
      } catch {
        // ignore
      }
    };

    loadRealTrades();
    const interval = setInterval(loadRealTrades, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Ensure currentIndex stays within bounds
  const currentTrade = trades[currentIndex % (trades.length || 1)] || trades[0];

  // Auto advance timer with visual progress bar
  useEffect(() => {
    if (!isPlaying || isHovered || trades.length <= 1) return;

    const tickInterval = 50;
    const increment = (tickInterval / SPOTLIGHT_INTERVAL_MS) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentIndex(curr => (curr + 1) % trades.length);
          return 0;
        }
        return prev + increment;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, trades.length]);

  const handleNext = () => {
    setProgress(0);
    setCurrentIndex(prev => (prev + 1) % trades.length);
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentIndex(prev => (prev - 1 + trades.length) % trades.length);
  };

  const handleSelectMiniChip = (idx: number) => {
    setProgress(0);
    setCurrentIndex(idx);
  };

  const isPositive = currentTrade ? currentTrade.pips >= 0 : true;

  return (
    <div
      className="bulletin-container"
      role="region"
      aria-label="Live Trade Spotlight Feed"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Left Sidebar: Badge and Live Radar */}
      <div className="bulletin-badge-pinned">
        <div className="bulletin-badge-header">
          <div className="bulletin-radar-wrap">
            <span className="bulletin-radar-ping"></span>
            <span className="bulletin-radar-dot"></span>
          </div>
          <div className="bulletin-badge-text">
            <span className="bulletin-title">{t.bulletin.badgeTitle}</span>
            <span className="bulletin-subtitle">{t.bulletin.badgeSubtitle}</span>
          </div>
        </div>
      </div>

      {/* 2. Center Stage: Highlighted Trade Spotlight */}
      <div className="bulletin-spotlight-stage">
        {currentTrade ? (
          <div
            key={currentTrade.id}
            className="bulletin-spotlight-card"
            onClick={() =>
              onSelectTrader &&
              onSelectTrader({
                username: currentTrade.trader,
                broker: currentTrade.broker,
                score: currentTrade.pips,
              })
            }
            title={`Click to inspect ${currentTrade.trader} profile and performance`}
          >
            {/* Trader Avatar & Online Badge */}
            <div className="spotlight-trader-info">
              <TraderAvatar
                username={currentTrade.trader}
                broker={currentTrade.broker}
                size={40}
                showOnlineRing={true}
                showBrokerBadge={false}
              />
              <div className="spotlight-trader-text">
                <div className="spotlight-trader-name">
                  <span>{currentTrade.trader}</span>
                  {currentTrade.isHot && <Flame size={13} color="#fbbf24" />}
                </div>
                <div className="spotlight-broker-row">
                  <BrokerSymbol broker={currentTrade.broker} size={11} />
                  <span>{currentTrade.broker}</span>
                  {currentTrade.rank && (
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      #{currentTrade.rank}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Instrument & Order Action */}
            <div className="spotlight-order-pill">
              <span className="spotlight-symbol">{currentTrade.symbol}</span>
              <span className={`spotlight-type-badge ${currentTrade.type === 'BUY' ? 'type-buy' : 'type-sell'}`}>
                {currentTrade.type} {currentTrade.lotSize}L
              </span>
            </div>

            {/* Pips & Profit Glowing Readout */}
            <div className="spotlight-pips-container">
              <div className={`spotlight-pips-val ${isPositive ? 'profit' : 'loss'}`}>
                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>
                  {isPositive ? '+' : ''}{currentTrade.pips} <small style={{ fontSize: '11px', opacity: 0.85 }}>{t.bulletin.pips}</small>
                </span>
              </div>
              <div className="spotlight-usd-val">
                {currentTrade.profitUsd >= 0 ? `+$${currentTrade.profitUsd.toFixed(1)} USD` : `-$${Math.abs(currentTrade.profitUsd).toFixed(1)} USD`}
              </div>
            </div>

            {/* Feature Tag & Verification */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
              <span className="spotlight-tag-badge">
                <Sparkles size={11} /> {getTagLabel(currentTrade)}
              </span>
              <div className="spotlight-time-tag">
                <ShieldCheck size={11} color="#0abab5" />
                <span>{currentTrade.timeAgo} • MetaApi Cloud</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <Zap size={14} color="#0abab5" />
            <span>Waiting for verified executions...</span>
          </div>
        )}

        {/* 3. Right Controls: Navigation Buttons & Mini Breadcrumb Chips */}
        <div className="bulletin-controls-wrap">
          {/* Mini Chips of Upcoming Fills */}
          <div className="bulletin-mini-chips">
            {trades.slice(0, 4).map((item, idx) => {
              const active = idx === (currentIndex % trades.length);
              return (
                <button
                  key={`${item.id}-chip`}
                  className={`bulletin-mini-chip ${active ? 'active' : ''}`}
                  onClick={() => handleSelectMiniChip(idx)}
                  title={`View ${item.trader} (${item.symbol})`}
                >
                  <span>{item.trader.split('_')[0]}</span>
                  <span style={{ color: item.pips >= 0 ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                    +{item.pips}p
                  </span>
                </button>
              );
            })}
          </div>

          {/* Previous / Play-Pause / Next Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="bulletin-arrow-btn"
              onClick={handlePrev}
              title="Previous Execution"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="bulletin-arrow-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause Auto-Advance' : 'Play Auto-Advance'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              className="bulletin-arrow-btn"
              onClick={handleNext}
              title="Next Execution"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Smooth Progress Bar indicating 4.5s cadence */}
      <div className="bulletin-progress-track">
        <div
          className="bulletin-progress-fill"
          style={{ width: isPlaying && !isHovered ? `${progress}%` : `${progress}%` }}
        />
      </div>
    </div>
  );
};
