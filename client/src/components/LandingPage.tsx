import React, { useState, useEffect } from 'react';
import {
  Shield,
  Trophy,
  Swords,
  Award,
  Zap,
  Lock,
  ArrowRight,
  ChevronRight,
  Target,
  Flame,
  Check,
  User,
  LayoutDashboard,
} from 'lucide-react';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { TraderAvatar } from './TraderAvatar.tsx';
import { BrandLogo, BrandMark } from './BrandLogo.tsx';
import { LiveTradeBulletin } from './LiveTradeBulletin.tsx';
import { MarketLivePricesTicker } from './MarketLivePricesTicker.tsx';
import { LiveCandleChart } from './LiveCandleChart.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import { UserNavMenu } from './UserNavMenu.tsx';
import { calculateTraderGamification, getStreakStatus } from '../../../shared/src/gamification.ts';

interface LandingPageProps {
  onEnterApp: (tab?: string) => void;
  onOpenConnectWizard: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenMyDashboard?: () => void;
  onSelectTrader?: (trader: { userId?: string; username: string; broker?: any; rank?: number; score?: number; winRate?: number; tradesCount?: number }) => void;
  leaderboard?: any[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenConnectWizard,
  onOpenSubscriptionModal,
  onOpenMyDashboard,
  onSelectTrader,
  leaderboard = [],
}) => {
  const { t, language } = useTranslation();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [activeTabRanking, setActiveTabRanking] = useState<'pips' | 'profit' | 'rate'>('pips');
  const [ledgerStatsByUser, setLedgerStatsByUser] = useState<
    Record<
      string,
      {
        tradesCount: number;
        winningPips: number;
        netPips: number;
        netProfitUsd: number;
        grossProfitUsd: number;
        winRate: number;
        xp: number;
        level: number;
        currency?: string;
        broker?: string;
      }
    >
  >({});
  const [platformTotals, setPlatformTotals] = useState<{
    totalTrades: number;
    totalWinningPips: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/accounts?scope=public')
      .then(res => (res.ok ? res.json() : []))
      .then(async (accounts: any[]) => {
        if (!isMounted || !Array.isArray(accounts) || accounts.length === 0) return;

        const map: typeof ledgerStatsByUser = {};
        let totalPlatformTrades = 0;
        let totalPlatformWinningPips = 0;

        for (const acc of accounts) {
          try {
            const trRes = await fetch(`/api/accounts/${acc.id}/trades`);
            if (!trRes.ok) continue;
            const trades = await trRes.json();
            if (!Array.isArray(trades)) continue;

            const valid = trades.filter((d: any) => {
              const sym = String(d.symbol || '').toUpperCase();
              return sym && sym !== 'UNKNOWN' && sym !== 'BALANCE' && Number(d.lotSize ?? d.volume ?? 0) > 0;
            });

            let winningPips = 0;
            let netPips = 0;
            let netProfitUsd = 0;
            let grossProfitUsd = 0;
            let wins = 0;

            for (const tr of valid) {
              const usd = Number(tr.pnlCurrency ?? tr.profitCurrency ?? tr.profit ?? 0);
              const pips = Number(tr.pnlPips ?? tr.profitPips ?? 0);
              const isWin = usd > 0 || (usd === 0 && pips > 0);
              netPips += pips;
              netProfitUsd += usd;
              if (isWin) {
                wins++;
                winningPips += Math.max(0, pips);
                grossProfitUsd += Math.max(0, usd);
              }
            }

            totalPlatformTrades += valid.length;
            totalPlatformWinningPips += winningPips;

            const statsObj = {
              tradesCount: valid.length,
              winningPips: Number(winningPips.toFixed(1)),
              netPips: Number(netPips.toFixed(1)),
              netProfitUsd: Number(netProfitUsd.toFixed(2)),
              grossProfitUsd: Number(grossProfitUsd.toFixed(2)),
              winRate: valid.length > 0 ? Math.round((wins / valid.length) * 100) : 0,
              xp: valid.length * 25,
              level: Math.max(1, Math.floor(valid.length / 40) + 1),
              currency: acc.currency,
              broker: acc.broker,
            };

            if (acc.userId) map[acc.userId] = statsObj;
            if (acc.id) map[acc.id] = statsObj;
            if (acc.accountNumber) map[`TraderRank-${acc.accountNumber}`] = statsObj;
          } catch {
            // ignore single account fetch error
          }
        }

        if (isMounted) {
          setLedgerStatsByUser(map);
          if (totalPlatformTrades > 0) {
            setPlatformTotals({
              totalTrades: totalPlatformTrades,
              totalWinningPips: Number(totalPlatformWinningPips.toFixed(1)),
            });
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Derive top 3 exclusively from each trader's own verified real leaderboard entry + per-account ledger
  const topPodiumTraders = leaderboard
    .map(trader => {
      const real = ledgerStatsByUser[trader.userId] || ledgerStatsByUser[trader.username];
      const tradesCount = real ? real.tradesCount : trader.tradesCount ?? 0;
      const pips = real ? real.netPips : trader.totalPips ?? 0;
      const netProfitUsd = real
        ? real.netProfitUsd
        : typeof trader.closedProfitUsd === 'number'
        ? trader.closedProfitUsd
        : 0;
      const winRate = real ? real.winRate : trader.winRate ?? 0;
      const xp = real ? real.xp : tradesCount > 0 ? tradesCount * 25 : trader.xp || 0;
      const gamification = calculateTraderGamification(xp);
      const broker = (real?.broker || trader.brokers?.[0] || 'XM') as any;
      const currency = real?.currency || (broker === 'XMTrading' ? 'JPY' : 'USD');

      return {
        userId: trader.userId,
        username: trader.username,
        broker,
        currency,
        avatarSymbol: trader.avatarSymbol || 'zap',
        pips,
        profit: netProfitUsd,
        rate: winRate,
        trades: tradesCount,
        winRate,
        tier: t.rewards[gamification.tierKey] || gamification.tierName,
      };
    })
    .sort((a, b) => {
      // Active verified traders with real closed trades always rank above 0-trade accounts
      const aActive = a.trades > 0 ? 1 : 0;
      const bActive = b.trades > 0 ? 1 : 0;
      if (aActive !== bActive) {
        return bActive - aActive;
      }
      if (activeTabRanking === 'profit') {
        return b.profit - a.profit;
      }
      if (activeTabRanking === 'rate') {
        return b.winRate - a.winRate;
      }
      return b.pips - a.pips;
    })
    .slice(0, 3)
    .map((trader, idx) => ({
      ...trader,
      rank: idx + 1,
      badge: idx === 0 ? t.leaderboard.goldChampion : idx === 1 ? t.leaderboard.silverContender : t.leaderboard.bronzeMaster,
      glow: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#d97706',
    }));

  const formatPodiumProfit = (amount: number, broker?: string, currency?: string) => {
    const isJpy = broker === 'XMTrading' || (currency || '').toUpperCase() === 'JPY';
    const sym = isJpy ? '¥' : '$';
    const formattedVal = isJpy
      ? Math.round(Math.abs(amount)).toLocaleString('ja-JP')
      : Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return amount >= 0 ? `+${sym}${formattedVal}` : `-${sym}${formattedVal}`;
  };

  return (
    <div style={{ backgroundColor: '#080b11', color: '#ffffff', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Top Floating Glass Navigation */}
      <header className="landing-header">
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BrandLogo
              size={36}
              textSize={19}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            <span
              className="hide-on-mobile"
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(0, 240, 255, 0.12)',
                color: '#00F0FF',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                letterSpacing: '0.5px',
              }}
            >
              {t.nav.proLeague}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LanguageSelector />
            <UserNavMenu
              onOpenConnectWizard={onOpenConnectWizard}
              onOpenSubscriptionModal={onOpenSubscriptionModal}
              onOpenMyDashboard={onOpenMyDashboard}
            />
          </div>
        </div>
      </header>

      {/* Live Moving Trade Bulletin (Motion Graphic Spot Ticker) */}
      <div style={{ maxWidth: '1280px', margin: '10px auto 0', padding: '0 12px' }}>
        <LiveTradeBulletin onSelectTrader={onSelectTrader} />
      </div>

      {/* Hero Section */}
      <section className="landing-hero-section">
        {/* Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            maxWidth: '100vw',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.18) 0%, rgba(0, 218, 198, 0.08) 40%, transparent 70%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '24px',
              background: 'rgba(0, 240, 255, 0.10)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              fontSize: '12px',
              fontWeight: 800,
              color: '#00F0FF',
              marginBottom: '20px',
              letterSpacing: '0.4px',
            }}
          >
            <Zap size={14} style={{ color: '#00F0FF' }} />
            {t.landing.badge}
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6.5vw, 64px)',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-1.2px',
              margin: '0 0 16px',
              color: '#FFFFFF',
            }}
          >
            {t.landing.heroTitlePrefix}
            <span
              style={{
                background: 'linear-gradient(135deg, #6df4ff 0%, #00DAC6 50%, #00F0FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(0, 240, 255, 0.4)',
              }}
            >
              {t.landing.heroTitleAccent}
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(14px, 3.2vw, 16px)',
              lineHeight: 1.6,
              color: '#848E9C',
              maxWidth: '820px',
              margin: '0 auto 28px',
              fontWeight: 500,
              padding: '0 8px',
            }}
          >
            {t.landing.heroSubtitle}
          </p>

          <div className="landing-hero-buttons">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => onEnterApp()}
                  style={{
                    background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
                    border: 'none',
                    color: '#080b11',
                    padding: '16px 36px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 30px rgba(0, 240, 255, 0.4)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Trophy size={18} /> {t.landing.enterArenaBtn} <ArrowRight size={18} />
                </button>

                <button
                  onClick={() => onOpenMyDashboard?.()}
                  style={{
                    background: 'rgba(0, 240, 255, 0.12)',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    color: '#00F0FF',
                    padding: '16px 28px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 20px rgba(0, 240, 255, 0.15)',
                    transition: 'all 0.2s',
                  }}
                >
                  <LayoutDashboard size={18} color="#00F0FF" />
                  <span>{t.nav.myDashboard}</span>
                </button>

                <button
                  onClick={onOpenConnectWizard}
                  style={{
                    background: 'rgba(14, 20, 31, 0.9)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    color: '#FFFFFF',
                    padding: '16px 30px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Shield size={18} style={{ color: '#00F0FF' }} /> {t.landing.connectBrokerBtn}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => openAuthModal('register')}
                  style={{
                    background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
                    border: 'none',
                    color: '#080b11',
                    padding: '16px 36px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 30px rgba(0, 240, 255, 0.4)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Zap size={18} fill="#080b11" /> {t.auth.registerToEnterHero} <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => openAuthModal('signin')}
                  style={{
                    background: 'rgba(14, 20, 31, 0.9)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    color: '#FFFFFF',
                    padding: '16px 30px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s',
                  }}
                >
                  <User size={18} style={{ color: '#00F0FF' }} /> {t.auth.signInHero}
                </button>
              </div>
            )}
          </div>

          {/* Social Proof Stats Bar */}
          <div className="landing-stats-bar">
            <div>
              <div style={{ fontSize: '11px', color: '#848E9C', marginBottom: '4px', fontWeight: 600 }}>{t.landing.verifiedPnlBadge}</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#00F0FF' }}>
                {platformTotals
                  ? `+${platformTotals.totalWinningPips.toLocaleString()}p (${platformTotals.totalTrades})`
                  : '576 Fills'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#848E9C', marginBottom: '4px', fontWeight: 600 }}>{t.arena.prizePool}</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#F0B90B' }}>$31,500 USD</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#848E9C', marginBottom: '4px', fontWeight: 600 }}>{t.landing.liveBrokersCount}</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#00DAC6' }}>5 Tier-1 Brokers</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#848E9C', marginBottom: '4px', fontWeight: 600 }}>{t.nav.viewOnlyBadge}</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF' }}>100% Zero-Write</div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Live Prices Ticker (Top Performance Trading Pairs) */}
      <MarketLivePricesTicker />

      {/* Live Candlestick & Market Execution Feed (AllTick Real-Time API) */}
      <section style={{ maxWidth: '1280px', margin: '40px auto 0', padding: '0 24px' }}>
        <LiveCandleChart initialSymbol="USDJPY" initialTimeframe="1m" height={360} />
      </section>

      {/* Section 2: Global Verified Ranking & Podium Preview */}
      <section id="rankings" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#F0B90B', marginBottom: '8px', letterSpacing: '0.5px' }}>
              <Trophy size={16} /> {t.landing.badge}
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 12px', color: '#FFFFFF' }}>
              {t.landing.topPerformersTitle}
            </h2>
            <p style={{ fontSize: '15px', color: '#848E9C', maxWidth: '640px', margin: '0 auto' }}>
              {t.landing.topPerformersSubtitle}
            </p>

            {/* Metric Switcher */}
            <div style={{ display: 'inline-flex', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '10px', marginTop: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {[
                { id: 'pips', label: t.landing.tabPips },
                { id: 'profit', label: t.landing.tabProfit },
                { id: 'rate', label: t.landing.tabWinRate },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setActiveTabRanking(m.id as typeof activeTabRanking)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTabRanking === m.id ? 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)' : 'transparent',
                    color: activeTabRanking === m.id ? '#080b11' : '#848E9C',
                    transition: 'all 0.2s',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Top 3 Podium Cards or Institutional Empty State */}
          {topPodiumTraders.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(0, 240, 255, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trophy size={28} color="#00F0FF" />
              </div>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                {language === 'ja'
                  ? '検証済みトレーダーの参加を待機中'
                  : language === 'zh'
                  ? '等待实盘认证交易者入驻'
                  : 'Waiting for Verified Traders'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#848E9C', maxWidth: '440px', lineHeight: 1.5 }}>
                {language === 'ja'
                  ? 'モックアップアカウントは一切表示されません。実盤 MT4 / MT5 ブローカーフィードを連携した本物のトレーダーのみがグローバルリーダーボードに表示されます。'
                  : language === 'zh'
                  ? '绝无任何虚拟模拟账户。仅展示通过实盘 MT4 / MT5 经纪商行情与观摩账户绑定的真实交易者。'
                  : 'No mockup accounts are displayed. Only real traders connected via live MT4/MT5 broker feeds appear on the global leaderboard.'}
              </p>
              <button
                onClick={onOpenConnectWizard}
                style={{
                  marginTop: '8px',
                  background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
                  border: 'none',
                  color: '#080b11',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 240, 255, 0.35)',
                }}
              >
                {t.landing.connectBrokerBtn}
              </button>
            </div>
          ) : (
            <div className="landing-podium-grid">
              {topPodiumTraders.map(trader => (
                <div
                  key={trader.rank}
                  onClick={() => onSelectTrader?.({ userId: trader.userId, username: trader.username, broker: trader.broker, rank: trader.rank, score: trader.pips, winRate: trader.winRate, tradesCount: trader.trades })}
                  style={{
                    background: 'rgba(14, 20, 31, 0.85)',
                    border: trader.rank === 1 ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '28px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: trader.rank === 1 ? '0 12px 36px rgba(0, 240, 255, 0.15)' : 'none',
                    backdropFilter: 'blur(16px)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: `${trader.glow}20`,
                        color: trader.glow,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Award size={16} /> #{trader.rank} {trader.badge}
                    </span>
                    <BrokerSymbol broker={trader.broker} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <TraderAvatar username={trader.username} symbol={trader.avatarSymbol} size={56} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>{trader.username}</h3>
                      <div style={{ fontSize: '12px', color: '#848E9C', marginTop: '2px' }}>
                        {trader.tier} • {trader.trades} {t.dailyBest.trades}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', borderRadius: '10px', background: 'rgba(8, 11, 17, 0.7)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#848E9C' }}>
                        {activeTabRanking === 'profit' ? t.landing.tabProfit : t.landing.gainCol}
                      </div>
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: 900,
                          color:
                            activeTabRanking === 'profit'
                              ? trader.profit >= 0
                                ? '#00F0FF'
                                : '#ef4444'
                              : trader.pips >= 0
                              ? '#00F0FF'
                              : '#ef4444',
                        }}
                      >
                        {activeTabRanking === 'profit'
                          ? formatPodiumProfit(trader.profit, trader.broker, trader.currency)
                          : trader.pips >= 0
                          ? `+${trader.pips.toFixed(1)}`
                          : trader.pips.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#848E9C' }}>{t.landing.winRateCol}</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#F0B90B' }}>
                        {trader.winRate}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => onEnterApp('ranking')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                color: '#FFFFFF',
                padding: '12px 28px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              {t.nav.rankings} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Tournaments Preview */}
      <section id="tournaments" style={{ padding: '80px 24px', backgroundColor: '#0b0f17', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#00F0FF', marginBottom: '8px' }}>
              <Swords size={16} /> {t.arena.tournamentsTitle}
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 12px', color: '#FFFFFF' }}>
              {t.arena.liveContests}
            </h2>
            <p style={{ fontSize: '15px', color: '#848E9C', maxWidth: '640px', margin: '0 auto' }}>
              {t.arena.tournamentsSubtitle}
            </p>
          </div>

          <div className="landing-tournaments-grid">
            <div
              style={{
                background: 'rgba(14, 20, 31, 0.85)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                borderRadius: '16px',
                padding: '30px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF' }}>
                  {t.arena.weeklySprintTag}
                </span>
                <span style={{ fontSize: '12px', color: '#848E9C' }}>{t.arena.sprintDays}</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>{t.arena.weeklySprint}</h3>
              <p style={{ fontSize: '13px', color: '#848E9C', margin: '0 0 20px', lineHeight: '1.5' }}>
                {t.arena.weeklySprintDesc}
              </p>

              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(8, 11, 17, 0.7)', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '12px', color: '#848E9C' }}>{t.arena.prizePool}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#F0B90B' }}>$5,000 USD <span style={{ fontSize: '14px', color: '#00F0FF' }}>+ 15,000 XP</span></div>
              </div>

              <div style={{ fontSize: '12px', color: '#848E9C', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} color="#00F0FF" /> {t.arena.maxDailyLoss}: 5.0% {t.arena.equityLoss}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} color="#00F0FF" /> {t.arena.maxTrailingDD}: 10.0%</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} color="#00F0FF" /> 5 {t.arena.minTradesDesc}</div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(14, 20, 31, 0.85)',
                border: '1px solid rgba(240, 185, 11, 0.3)',
                borderRadius: '16px',
                padding: '30px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(240, 185, 11, 0.15)', color: '#F0B90B' }}>
                  {t.arena.monthlyChampionshipTag}
                </span>
                <span style={{ fontSize: '12px', color: '#848E9C' }}>{t.arena.monthlyDuration}</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>{t.arena.monthlyChampionship}</h3>
              <p style={{ fontSize: '13px', color: '#848E9C', margin: '0 0 20px', lineHeight: '1.5' }}>
                {t.arena.monthlyChampionshipDesc}
              </p>

              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(8, 11, 17, 0.7)', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '12px', color: '#848E9C' }}>{t.arena.prizePool}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#F0B90B' }}>$25,000 USD <span style={{ fontSize: '14px', color: '#00F0FF' }}>+ 75,000 XP</span></div>
              </div>

              <div style={{ fontSize: '12px', color: '#848E9C', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} color="#00F0FF" /> {t.arena.maxDailyLoss}: 4.0% {t.arena.equityLoss}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} color="#00F0FF" /> {t.arena.maxTrailingDD}: 8.0%</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={12} color="#00F0FF" /> 20 {t.arena.minTradesDesc}</div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button
              onClick={() => onEnterApp('tournaments')}
              style={{
                background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
                border: 'none',
                color: '#080b11',
                padding: '14px 32px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(0, 240, 255, 0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {t.arena.tournamentsTitle} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Section 3b: Trader Rewards, Honor Badges & Daily Streaks */}
      <section id="rewards" style={{ padding: '80px 24px', backgroundColor: '#080b11', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#00F0FF', marginBottom: '8px' }}>
              <Award size={16} /> {t.nav.rewards}
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 12px', color: '#FFFFFF' }}>
              {t.rewards.honorBadgesTitle}
            </h2>
            <p style={{ fontSize: '15px', color: '#848E9C', maxWidth: '640px', margin: '0 auto' }}>
              {t.rewards.honorBadgesSubtitle}
            </p>
          </div>

          {/* Daily Streak & XP Progression Card */}
          {(() => {
            const userXp = isAuthenticated && typeof user?.xp === 'number' ? user.xp : 0;
            const gamification = calculateTraderGamification(userXp);

            // Read claimed streak days from localStorage (cleanly starting at Day 1 for new users)
            const streakStorageKey = user?.id ? `traderrank_streak_v2_${user.id}` : 'traderrank_streak_v2_guest';
            let claimedStreakDays: number[] = [];
            try {
              const saved = localStorage.getItem(streakStorageKey);
              if (saved) claimedStreakDays = JSON.parse(saved);
            } catch {
              // ignore
            }
            const streakDays = getStreakStatus(claimedStreakDays);

            return (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(14, 20, 31, 0.95) 100%)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  borderRadius: '20px',
                  padding: '32px',
                  marginBottom: '32px',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: 'rgba(0, 240, 255, 0.15)',
                        color: gamification.color,
                        border: `1px solid ${gamification.color}66`,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {language === 'ja'
                        ? `LEVEL ${gamification.level} トレーダー`
                        : language === 'zh'
                        ? `LEVEL ${gamification.level} 交易员`
                        : `LEVEL ${gamification.level} TRADER`}
                    </span>
                    <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>
                      {t.rewards[gamification.tierKey]}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#848E9C' }}>{t.rewards.currentXp}</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: gamification.color }}>
                      {gamification.currentXp.toLocaleString()}{' '}
                      <span style={{ fontSize: '14px', color: '#848E9C' }}>
                        / {gamification.nextTierXp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Daily Streak Days Bar */}
                <div className="landing-streak-grid">
                  {streakDays.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (!isAuthenticated) {
                          openAuthModal('register');
                        } else {
                          onEnterApp('rewards');
                        }
                      }}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: s.claimed
                          ? 'rgba(0, 218, 198, 0.1)'
                          : s.current
                          ? 'linear-gradient(135deg, rgba(240, 185, 11, 0.25), rgba(15, 23, 42, 0.8))'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: s.claimed
                          ? '1px solid rgba(0, 218, 198, 0.3)'
                          : s.current
                          ? '1px solid #F0B90B'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '10px', color: '#848E9C' }}>
                        {language === 'ja' ? `${s.dayNum}日目` : language === 'zh' ? `第 ${s.dayNum} 天` : `Day ${s.dayNum}`}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: s.claimed ? '#00DAC6' : s.current ? '#F0B90B' : '#848E9C', margin: '4px 0' }}>
                        {s.xpText}
                      </div>
                      <div style={{ fontSize: '10px' }}>
                        {s.claimed ? (
                          <span style={{ color: '#00DAC6', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Check size={10} color="#00DAC6" /> {t.rewards.claimed}</span>
                        ) : s.current ? (
                          <span style={{ color: '#F0B90B', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F0B90B', display: 'inline-block' }} /> {t.rewards.active}</span>
                        ) : (
                          <span style={{ color: '#848E9C', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Lock size={10} color="#848E9C" /> {t.rewards.locked}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Honor Badges 4-Column Showcase */}
          <div className="landing-badges-grid">
            <div
              style={{
                background: 'rgba(14, 20, 31, 0.85)',
                border: '1px solid rgba(0, 218, 198, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                gap: '14px',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(0, 218, 198, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={22} color="#00DAC6" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{t.rewards.badgeRiskGuardianName}</h4>
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 218, 198, 0.2)', color: '#00DAC6' }}>{t.rewards.rarityEpic}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#848E9C', margin: '0 0 10px', lineHeight: 1.4 }}>
                  {t.rewards.badgeRiskGuardianDesc}
                </p>
                <span style={{ fontSize: '11px', color: '#00F0FF', fontWeight: 700 }}>+500 XP • {t.rewards.verified}</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(14, 20, 31, 0.85)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                gap: '14px',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Target size={22} color="#00F0FF" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{t.rewards.badgePrecisionSniperName}</h4>
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.2)', color: '#00F0FF' }}>{t.rewards.rarityRare}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#848E9C', margin: '0 0 10px', lineHeight: 1.4 }}>
                  {t.rewards.badgePrecisionSniperDesc}
                </p>
                <span style={{ fontSize: '11px', color: '#00F0FF', fontWeight: 700 }}>+350 XP • {t.rewards.verified}</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(14, 20, 31, 0.85)',
                border: '1px solid rgba(240, 185, 11, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                gap: '14px',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(240, 185, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={22} color="#F0B90B" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{t.rewards.badgeCenturyClubName}</h4>
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(240, 185, 11, 0.2)', color: '#F0B90B' }}>{t.rewards.rarityRare}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#848E9C', margin: '0 0 10px', lineHeight: 1.4 }}>
                  {t.rewards.badgeCenturyClubDesc}
                </p>
                <span style={{ fontSize: '11px', color: '#00F0FF', fontWeight: 700 }}>+400 XP • {t.rewards.verified}</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(14, 20, 31, 0.85)',
                border: '1px solid rgba(246, 70, 93, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                gap: '14px',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(246, 70, 93, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Flame size={22} color="#F6465D" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{t.rewards.badgeHallOfFameName}</h4>
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(246, 70, 93, 0.2)', color: '#F6465D' }}>{t.rewards.rarityLegendary}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#848E9C', margin: '0 0 10px', lineHeight: 1.4 }}>
                  {t.rewards.badgeHallOfFameDesc}
                </p>
                <span style={{ fontSize: '11px', color: '#00F0FF', fontWeight: 700 }}>+2,000 XP • {t.rewards.seasonal}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => onEnterApp('rewards')}
              style={{
                background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
                border: 'none',
                color: '#080b11',
                padding: '14px 32px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(0, 240, 255, 0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {t.rewards.exploreRewardsBtn}
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: Zero-Write Security & Trust Architecture */}
      <section id="security" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#00F0FF', marginBottom: '8px' }}>
              <Shield size={16} /> {t.nav.viewOnlyBadge}
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 12px', color: '#FFFFFF' }}>
              {t.landing.feature1Title}
            </h2>
            <p style={{ fontSize: '15px', color: '#848E9C', maxWidth: '640px', margin: '0 auto' }}>
              {t.connector.zeroWriteDesc}
            </p>
          </div>

          <div className="landing-security-grid">
            <div style={{ padding: '28px', borderRadius: '16px', background: 'rgba(14, 20, 31, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Lock size={20} color="#00F0FF" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>{t.landing.feature1Title}</h3>
              <p style={{ fontSize: '13px', color: '#848E9C', lineHeight: '1.6', margin: 0 }}>
                {t.landing.feature1Desc}
              </p>
            </div>

            <div style={{ padding: '28px', borderRadius: '16px', background: 'rgba(14, 20, 31, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 218, 198, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Shield size={20} color="#00DAC6" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>{t.landing.feature2Title}</h3>
              <p style={{ fontSize: '13px', color: '#848E9C', lineHeight: '1.6', margin: 0 }}>
                {t.landing.feature2Desc}
              </p>
            </div>

            <div style={{ padding: '28px', borderRadius: '16px', background: 'rgba(14, 20, 31, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(240, 185, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Zap size={20} color="#F0B90B" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>{t.landing.feature3Title}</h3>
              <p style={{ fontSize: '13px', color: '#848E9C', lineHeight: '1.6', margin: 0 }}>
                {t.landing.feature3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: CTA */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, #080b11 0%, #0d131d 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 16px', color: '#FFFFFF' }}>
            {t.landing.ctaHeading}
          </h2>
          <p style={{ fontSize: '15px', color: '#848E9C', margin: '0 0 40px' }}>
            {t.landing.ctaSubtitle}
          </p>

          <button
            onClick={() => {
              if (isAuthenticated) {
                onEnterApp();
              } else {
                openAuthModal('register');
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
              border: 'none',
              color: '#080b11',
              padding: '16px 40px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 900,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 32px rgba(0, 240, 255, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            {isAuthenticated ? t.landing.ctaButton : t.auth.registerToEnterCta}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#05070a', textAlign: 'center' }}>
        <div className="landing-footer-container">
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Return to Home"
          >
            <BrandMark size={22} variant="glyph" />
            <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>TradeRank.live</strong>
            <span style={{ fontSize: '12px', color: '#848E9C' }}>© {new Date().getFullYear()} TradeRank.live. {t.footer.allRightsReserved}.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#848E9C' }}>{t.footer.poweredBy}</span>
            <span
              style={{
                color: '#00F0FF',
                fontWeight: 800,
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '6px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
              }}
            >
              {t.footer.companyName}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LanguageSelector variant="footer" />
            <span style={{ fontSize: '12px', color: '#848E9C' }}>{t.footer.systemStatus}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

