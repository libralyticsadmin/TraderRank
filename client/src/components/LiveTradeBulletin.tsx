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

function formatTradePrice(symbol: string, price: number): string {
  const sym = String(symbol || '').toUpperCase();
  if (sym.includes('JPY')) return price.toFixed(3);
  if (sym.includes('XAU') || sym.includes('GOLD') || sym.includes('BTC') || price >= 20) {
    return price.toFixed(2);
  }
  return price.toFixed(5);
}

export const LiveTradeBulletin: React.FC<LiveTradeBulletinProps> = ({
  onSelectTrader,
}) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { traders: canonicalTraders, platformTotals, getTraderStats } = useTraderStats();
  const [allRealTrades, setAllRealTrades] = useState<BulletinTradeItem[]>([]);
  const [winningRealTrades, setWinningRealTrades] = useState<BulletinTradeItem[]>([]);
  const [openRealTrades, setOpenRealTrades] = useState<BulletinTradeItem[]>([]);
  const [liveOpenCount, setLiveOpenCount] = useState<number>(0);
  const [deckMode, setDeckMode] = useState<'WINS' | 'LATEST' | 'OPEN'>('LATEST');
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
    deckMode === 'OPEN'
      ? openRealTrades
      : allRealTrades.length > 0
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
      const isCurrentUser = Boolean(
        user &&
          (user.id === item.userId ||
            (user.username && item.trader && user.username.toLowerCase() === String(item.trader).toLowerCase()))
      );
      return {
        id: item.id,
        accountId: item.accountId,
        userId: item.userId,
        trader: canonical?.profileName || item.trader,
        avatarUrl: (isCurrentUser ? user?.avatarUrl : undefined) || canonical?.avatarUrl || item.avatarUrl,
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
        const openItems: BulletinTradeItem[] = Array.isArray(data.openOrders)
          ? data.openOrders.map(mapItem)
          : latestItems.filter(i => i.timeAgo === 'LIVE OPEN');

        setAllRealTrades(latestItems);
        setWinningRealTrades(topWinItems);
        setOpenRealTrades(openItems);
        setLiveOpenCount(typeof data.liveOpenCount === 'number' ? data.liveOpenCount : openItems.length);

        const first = latestItems[0] || topWinItems[0];
        if (first) {
          const total = first.traderTradesCount ?? latestItems.length;
          const wr = first.traderWinRate ?? 0;
          const wins = first.traderWinningTrades ?? Math.round((total * wr) / 100);
          setSummaryStats({
            totalFills: total,
            winsCount: wins,
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
                  {formatTradePrice(currentTrade.symbol, currentTrade.openPrice)} →{' '}
                  <strong style={{ color: '#e2e8f0' }}>{formatTradePrice(currentTrade.symbol, currentTrade.closePrice)}</strong>
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
                <span>{currentTrade.timeAgo === 'LIVE OPEN' ? 'LIVE FLOATING • MetaApi' : `${currentTrade.timeAgo} • MetaApi`}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <Zap size={14} color="#0abab5" />
            <span>
              {deckMode === 'OPEN'
                ? language === 'ja'
                  ? '現在保有中のライブポジションはありません'
                  : language === 'zh'
                  ? '当前暂无实时持仓订单'
                  : 'No active market orders open right now'
                : language === 'ja'
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
                  className={`bulletin-mode-btn ${deckMode === 'OPEN' ? 'active' : ''}`}
                  onClick={() => {
                    setDeckMode('OPEN');
                    setCurrentIndex(0);
                    setProgress(0);
                  }}
                >
                  {language === 'ja' ? `ライブ(${liveOpenCount})` : language === 'zh' ? `持仓(${liveOpenCount})` : `Live (${liveOpenCount})`}
                </button>
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

          {/* Bottom Tier: Live Arena Pulse (Utilizing full panel width with accurate canonical metrics) */}
          {(() => {
            const activeTradersCount = canonicalTraders.filter(tr => tr.tradesCount > 0 || tr.liveOrders.length > 0).length;
            const dailyLeader = [...canonicalTraders].sort((a, b) => b.dailyNetPips - a.dailyNetPips)[0];
            const totalFills = platformTotals?.totalTrades ?? 0;
            const todayTotalTrades = canonicalTraders.reduce((sum, tr) => sum + (tr.dailyTradesCount || 0), 0);
            const todayNetPips = Number(canonicalTraders.reduce((sum, tr) => sum + (tr.dailyNetPips || 0), 0).toFixed(1));

            return (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '8px',
                  width: '100%',
                }}
              >
                {/* Card 1: Active Live Orders */}
                <button
                  type="button"
                  onClick={() => {
                    setDeckMode(liveOpenCount > 0 ? 'OPEN' : 'LATEST');
                    setCurrentIndex(0);
                    setProgress(0);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: liveOpenCount > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: liveOpenCount > 0 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.07)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', fontWeight: 800, color: liveOpenCount > 0 ? '#34d399' : '#94a3b8', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: liveOpenCount > 0 ? '#10b981' : '#64748b',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {language === 'ja' ? '保有中ポジション' : language === 'zh' ? '实时持仓' : 'Live Open Orders'}
                    </span>
                  </div>
                  <div className="tabular" style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', whiteSpace: 'nowrap' }}>
                    {liveOpenCount} {language === 'ja' ? '件' : language === 'zh' ? '笔持仓' : 'Active'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeTradersCount} {language === 'ja' ? '名の認証トレーダー' : language === 'zh' ? '位认证交易员' : 'Verified Traders'}
                  </div>
                </button>

                {/* Card 2: Today's Leader (UTC) */}
                <button
                  type="button"
                  onClick={() => {
                    if (dailyLeader && onSelectTrader) {
                      onSelectTrader({
                        userId: dailyLeader.userId,
                        username: dailyLeader.profileName,
                        broker: dailyLeader.broker,
                        rank: dailyLeader.rank,
                        score: dailyLeader.totalPips,
                      });
                    }
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.07)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    cursor: dailyLeader ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontSize: '9px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {language === 'ja' ? '本日トップ (UTC)' : language === 'zh' ? '今日榜首 (UTC)' : "Today's Leader (UTC)"}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dailyLeader ? dailyLeader.profileName : '—'}
                  </div>
                  <div className="tabular" style={{ fontSize: '10px', fontWeight: 700, color: dailyLeader && dailyLeader.dailyNetPips >= 0 ? '#34d399' : '#f87171', whiteSpace: 'nowrap' }}>
                    {dailyLeader
                      ? `${dailyLeader.dailyNetPips >= 0 ? '+' : ''}${dailyLeader.dailyNetPips.toFixed(1)}p • ${dailyLeader.dailyTradesCount}T`
                      : '0.0p'}
                  </div>
                </button>

                {/* Card 3: Today's Arena Pulse (UTC) */}
                <div
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(0, 240, 255, 0.05)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontSize: '9px', fontWeight: 800, color: '#00F0FF', letterSpacing: '0.3px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {language === 'ja' ? '本日の取引実績 (UTC)' : language === 'zh' ? '今日全场战绩 (UTC)' : "Today's Arena (UTC)"}
                  </div>
                  <div
                    className="tabular"
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 900,
                      color: '#ffffff',
                      lineHeight: 1.2,
                      display: 'flex',
                      alignItems: 'baseline',
                      flexWrap: 'wrap',
                      gap: '3px',
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <span>{todayTotalTrades} {language === 'ja' ? '約定' : language === 'zh' ? '笔' : 'Today'}</span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ color: todayNetPips >= 0 ? '#34d399' : '#f87171', whiteSpace: 'nowrap' }}>
                      {todayNetPips >= 0 ? '+' : ''}{todayNetPips.toFixed(1)}p
                    </span>
                  </div>
                  <div className="tabular" style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {totalFills.toLocaleString()} {language === 'ja' ? '累計認証約定' : language === 'zh' ? '累计成交' : 'Verified Fills'}
                  </div>
                </div>
              </div>
            );
          })()}
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
