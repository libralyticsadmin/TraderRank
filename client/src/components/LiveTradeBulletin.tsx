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
  Activity,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency } from '../utils/currencyFlow.ts';
import { useTraderStats } from '../hooks/useTraderStats.ts';

export interface BulletinTradeItem {
  id: string;
  accountId?: string;
  userId?: string;
  trader: string;
  avatarUrl?: string;
  broker: Broker;
  symbol: string;
  type: 'BUY' | 'SELL' | 'TP_HIT' | 'SL_HIT' | 'RECORD';
  pips: number;
  lotSize: number;
  openPrice?: number;
  closePrice?: number;
  profitUsd: number;
  currency?: string;
  timeAgo: string;
  rawTime?: number;
  tag?: string;
  tagKey?: string;
  isHot?: boolean;
  rank?: number;
  traderTradesCount?: number;
  traderWinRate?: number;
  traderWinningTrades?: number;
}

interface LiveTradeBulletinProps {
  onSelectTrader?: (trader: { userId?: string; username: string; broker?: Broker; rank?: number; score?: number }) => void;
  speed?: 'normal' | 'fast' | 'slow';
}

const DEFAULT_SPOTLIGHT_TRADES: BulletinTradeItem[] = [];

export const LiveTradeBulletin: React.FC<LiveTradeBulletinProps> = ({
  onSelectTrader,
}) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { getTraderStats } = useTraderStats();
  const [allRealTrades, setAllRealTrades] = useState<BulletinTradeItem[]>([]);
  const [winningRealTrades, setWinningRealTrades] = useState<BulletinTradeItem[]>([]);
  const [deckMode, setDeckMode] = useState<'WINS' | 'LATEST'>('LATEST');
  const [summaryStats, setSummaryStats] = useState<{
    totalFills: number;
    winsCount: number;
    winRate: number;
  }>({ totalFills: 0, winsCount: 0, winRate: 0 });
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const SPOTLIGHT_INTERVAL_MS = 4500;

  const activeDeck: BulletinTradeItem[] =
    allRealTrades.length > 0
      ? deckMode === 'WINS' && winningRealTrades.length > 0
        ? winningRealTrades
        : allRealTrades.slice(0, 12)
      : DEFAULT_SPOTLIGHT_TRADES;

  const getTagLabel = (item: BulletinTradeItem) => {
    if (item.tagKey && (t.bulletin as any)[item.tagKey]) {
      return (t.bulletin as any)[item.tagKey];
    }
    if (item.tag === 'Verified Fill') {
      return language === 'ja' ? '監査済約定' : language === 'zh' ? '实盘成交' : 'Verified Fill';
    }
    return item.tag || t.bulletin.verifiedBridge;
  };

  // Fetch unified bulletin feed (Latest Open + Closed + Top Wins) in a single fast request
  useEffect(() => {
    let isMounted = true;

    const mapItem = (item: any): BulletinTradeItem => {
      const canonical = getTraderStats({
        accountNumber: item.accountNumber,
        userId: item.userId,
        username: item.trader,
      });
      const isWin = item.profitNative > 0 || (item.profitNative === 0 && item.pips > 0);
      return {
        id: item.id,
        accountId: item.accountId,
        userId: item.userId,
        trader: canonical?.profileName || item.trader,
        avatarUrl: canonical?.avatarUrl || item.avatarUrl,
        broker: item.broker,
        symbol: item.symbol,
        type: item.type,
        pips: item.pips,
        lotSize: item.lotSize,
        openPrice: item.openPrice,
        closePrice: item.closePrice,
        profitUsd: item.profitNative,
        currency: canonical?.currency || item.currency,
        rawTime: item.rawTime,
        timeAgo: item.isLiveOpen
          ? 'LIVE OPEN'
          : item.timestamp
          ? new Date(item.timestamp).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Live',
        tag: item.isLiveOpen ? 'LIVE OPEN' : !isWin ? 'Verified Fill' : undefined,
        tagKey: item.isLiveOpen ? undefined : isWin ? (item.pips >= 30 ? 'goldRush' : 'takeProfit') : undefined,
        isHot: item.isLiveOpen || (isWin && item.pips >= 25),
        rank: canonical?.rank ?? item.rank ?? 1,
        traderTradesCount: canonical?.tradesCount ?? item.traderTradesCount ?? 0,
        traderWinRate: canonical?.winRate ?? item.traderWinRate ?? 0,
        traderWinningTrades: canonical?.winningTradesCount ?? item.traderWinningTrades,
      };
    };

    const loadBulletin = async () => {
      try {
        const res = await fetch('/api/bulletin');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data) return;

        const latestItems: BulletinTradeItem[] = Array.isArray(data.latest) ? data.latest.map(mapItem) : [];
        const topWinItems: BulletinTradeItem[] = Array.isArray(data.topWins) ? data.topWins.map(mapItem) : [];

        setAllRealTrades(latestItems);
        setWinningRealTrades(topWinItems);

        const first = latestItems[0] || topWinItems[0];
        if (first) {
          const total = first.traderTradesCount || latestItems.length;
          const wr = first.traderWinRate || 0;
          setSummaryStats({
            totalFills: total,
            winsCount: Math.round((total * wr) / 100),
            winRate: wr,
          });
        }
      } catch {
        // ignore transient network errors
      }
    };

    loadBulletin();
    const interval = setInterval(loadBulletin, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [getTraderStats, user?.avatarUrl, user?.username]);

  // Ensure currentIndex stays within bounds
  const safeLen = activeDeck.length || 1;
  const activeIdx = currentIndex % safeLen;
  const currentTrade = activeDeck[activeIdx] || activeDeck[0];

  // Auto advance timer with visual progress bar
  useEffect(() => {
    if (!isPlaying || isHovered || activeDeck.length <= 1) return;

    const tickInterval = 50;
    const increment = (tickInterval / SPOTLIGHT_INTERVAL_MS) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentIndex(curr => (curr + 1) % activeDeck.length);
          return 0;
        }
        return prev + increment;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, activeDeck.length]);

  const handleNext = () => {
    setProgress(0);
    setCurrentIndex(prev => (prev + 1) % safeLen);
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentIndex(prev => (prev - 1 + safeLen) % safeLen);
  };

  const handleSelectMiniChip = (idx: number) => {
    setProgress(0);
    setCurrentIndex(idx);
  };

  // Compute 4 visible window items for the right-hand execution matrix
  const windowStart = Math.floor(activeIdx / 4) * 4;
  const visibleMatrixItems = activeDeck.slice(windowStart, windowStart + 4);

  const isPositive = currentTrade
    ? currentTrade.profitUsd > 0 || (currentTrade.profitUsd === 0 && currentTrade.pips >= 0)
    : true;

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

      {/* 2. Center + Right Stage */}
      <div className="bulletin-spotlight-stage">
        {currentTrade ? (
          <div
            className="bulletin-spotlight-card"
            onClick={() =>
              onSelectTrader &&
              onSelectTrader({
                userId: currentTrade.accountId || currentTrade.userId,
                username: currentTrade.trader,
                broker: currentTrade.broker,
                score: currentTrade.pips,
              })
            }
            title={`Click to inspect ${currentTrade.trader} profile and verified audit`}
          >
            {/* Trader Avatar & Online Badge */}
            <div className="spotlight-trader-info">
              <TraderAvatar
                username={currentTrade.trader}
                avatarUrl={currentTrade.avatarUrl}
                broker={currentTrade.broker}
                size={42}
                showOnlineRing={true}
                showBrokerBadge={false}
              />
              <div className="spotlight-trader-text">
                <div className="spotlight-trader-name" style={{ whiteSpace: 'nowrap' }}>
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

            {/* Instrument & Order Action + Entry -> Exit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div className="spotlight-order-pill">
                <span className="spotlight-symbol">{currentTrade.symbol}</span>
                <span className={`spotlight-type-badge ${currentTrade.type === 'BUY' ? 'type-buy' : 'type-sell'}`}>
                  {currentTrade.type} {currentTrade.lotSize.toFixed(2)}L
                </span>
              </div>
              {currentTrade.openPrice && currentTrade.closePrice ? (
                <div
                  style={{
                    fontSize: '10px',
                    color: '#94a3b8',
                    fontFamily: 'var(--font-mono, monospace)',
                    textAlign: 'center',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {currentTrade.openPrice.toFixed(2)} →{' '}
                  <strong style={{ color: '#e2e8f0' }}>{currentTrade.closePrice.toFixed(2)}</strong>
                </div>
              ) : null}
            </div>

            {/* Pips & Profit Glowing Readout */}
            <div className="spotlight-pips-container">
              <div className={`spotlight-pips-val ${isPositive ? 'profit' : 'loss'}`}>
                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>
                  {currentTrade.pips >= 0 ? '+' : ''}
                  {currentTrade.pips.toFixed(1)}{' '}
                  <small style={{ fontSize: '11px', opacity: 0.85 }}>{t.bulletin.pips}</small>
                </span>
              </div>
              <div
                className="spotlight-usd-val"
                style={{
                  color: currentTrade.profitUsd >= 0 ? '#34d399' : '#f87171',
                  fontWeight: 800,
                }}
              >
                {formatCurrency(currentTrade.profitUsd, currentTrade.currency, { showSign: true, showCode: true })}
              </div>
            </div>

            {/* Feature Tag & Verification */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
              <span
                className="spotlight-tag-badge"
                style={
                  !isPositive
                    ? {
                        background: 'rgba(148, 163, 184, 0.12)',
                        borderColor: 'rgba(148, 163, 184, 0.3)',
                        color: '#cbd5e1',
                      }
                    : undefined
                }
              >
                <Sparkles size={11} /> {getTagLabel(currentTrade)}
              </span>
              <div className="spotlight-time-tag">
                <ShieldCheck size={11} color="#0abab5" />
                <span>{currentTrade.timeAgo} • MetaApi</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <Zap size={14} color="#0abab5" />
            <span>
              {language === 'ja'
                ? '検証済み約定フィードを受信中...'
                : language === 'zh'
                ? '正在等待实盘交割推送...'
                : 'Waiting for verified executions...'}
            </span>
          </div>
        )}

        {/* 3. Right Execution Deck (Full-Height Multi-Tier Panel inside the Green Square Area) */}
        <div className="bulletin-controls-wrap">
          {/* Top Tier: Verified Account Pulse + Mode Switcher + Navigation Controls */}
          <div className="bulletin-deck-header">
            <div className="bulletin-deck-stats">
              {(() => {
                const activeFills = currentTrade?.traderTradesCount ?? summaryStats.totalFills ?? activeDeck.length;
                const activeWinRate = currentTrade?.traderWinRate ?? summaryStats.winRate ?? 0;
                const activeWins = currentTrade?.traderWinningTrades ?? Math.round((activeFills * activeWinRate) / 100);
                return (
                  <>
                    <span className="bulletin-stat-pill">
                      <Activity size={11} color="#0abab5" />
                      <strong>{activeFills}</strong>{' '}
                      {language === 'ja' ? '約定' : language === 'zh' ? '笔成交' : 'Fills'}
                    </span>
                    {activeFills > 0 && (
                      <span className="bulletin-stat-pill win-pill">
                        {language === 'ja' ? (
                          <>
                            勝率 <strong>{activeWinRate}%</strong> ({activeWins}勝)
                          </>
                        ) : language === 'zh' ? (
                          <>
                            胜率 <strong>{activeWinRate}%</strong> ({activeWins}胜)
                          </>
                        ) : (
                          <>
                            <strong>{activeWinRate}%</strong> Win ({activeWins}W)
                          </>
                        )}
                      </span>
                    )}
                  </>
                );
              })()}
                            <div className="bulletin-mode-toggle">
                <button
                  type="button"
                  className={`bulletin-mode-btn ${deckMode === 'WINS' ? 'active' : ''}`}
                  onClick={() => {
                    setDeckMode('WINS');
                    setCurrentIndex(0);
                    setProgress(0);
                  }}
                >
                  {language === 'ja' ? '高獲得Pips' : language === 'zh' ? '高盈亏单' : 'Top Wins'}
                </button>
                <button
                  type="button"
                  className={`bulletin-mode-btn ${deckMode === 'LATEST' ? 'active' : ''}`}
                  onClick={() => {
                    setDeckMode('LATEST');
                    setCurrentIndex(0);
                    setProgress(0);
                  }}
                >
                  {language === 'ja' ? '最新約定' : language === 'zh' ? '最新交割' : 'Latest'}
                </button>
              </div>
            </div>

            {/* Slide Counter & Previous / Play-Pause / Next Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: '#64748b',
                  marginRight: '3px',
                }}
              >
                {activeIdx + 1}/{safeLen}
              </span>
              <button
                className="bulletin-arrow-btn"
                onClick={handlePrev}
                title="Previous Execution"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                className="bulletin-arrow-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause Auto-Advance' : 'Play Auto-Advance'}
              >
                {isPlaying ? <Pause size={11} /> : <Play size={11} />}
              </button>
              <button
                className="bulletin-arrow-btn"
                onClick={handleNext}
                title="Next Execution"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Bottom Tier: 4-Column Compact Execution Matrix filling the Green Box */}
          <div className="bulletin-mini-chips">
            {visibleMatrixItems.map((item, idx) => {
              const realIdx = windowStart + idx;
              const active = realIdx === activeIdx;
              const itemPos = item.profitUsd > 0 || (item.profitUsd === 0 && item.pips >= 0);
              return (
                <button
                  key={`${item.id}-chip`}
                  className={`bulletin-mini-chip ${active ? 'active' : ''}`}
                  onClick={() => handleSelectMiniChip(realIdx)}
                  title={`${item.type} ${item.symbol} (${item.lotSize}L) • ${item.pips >= 0 ? '+' : ''}${item.pips} pips (${formatCurrency(item.profitUsd, item.currency, { showSign: true })})`}
                >
                  <div className="mini-chip-top">
                    <span className={`mini-chip-side ${item.type === 'BUY' ? 'buy' : 'sell'}`}>
                      {item.type === 'BUY' ? 'B' : 'S'}
                    </span>
                    <span className="mini-chip-sym">{item.symbol.replace('#', '')}</span>
                    <span className="mini-chip-lot">{item.lotSize}L</span>
                  </div>
                  <div className="mini-chip-bottom" style={{ gap: '4px', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        color: itemPos ? '#10b981' : '#f87171',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono, monospace)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.pips >= 0 ? `+${item.pips}p` : `${item.pips}p`}
                    </span>
                    <span
                      style={{
                        color: item.profitUsd >= 0 ? '#34d399' : '#fb7185',
                        fontSize: '9.5px',
                        fontFamily: 'var(--font-mono, monospace)',
                        opacity: 0.9,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatCurrency(item.profitUsd, item.currency, { showSign: true })}
                    </span>
                  </div>
                </button>
              );
            })}
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
