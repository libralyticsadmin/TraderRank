import React, { useState } from 'react';
import {
  Shield,
  Trophy,
  Swords,
  Award,
  Zap,
  Lock,
  ArrowRight,
  ChevronRight,
  Check,
  Activity,
} from 'lucide-react';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { TraderAvatar } from './TraderAvatar.tsx';
import { resolveTraderIdentity } from './avatarCatalog.ts';
import { resolveBrokerCurrency, formatDisplayCurrency } from '../utils/currencyFlow.ts';
import { BrandLogo, BrandMark } from './BrandLogo.tsx';
import { LiveTradeBulletin } from './LiveTradeBulletin.tsx';
import { MarketLivePricesTicker } from './MarketLivePricesTicker.tsx';
import { LiveCandleChart } from './LiveCandleChart.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import { UserNavMenu } from './UserNavMenu.tsx';
import { calculateTraderGamification } from '../../../shared/src/gamification.ts';
import { useTraderStats } from '../hooks/useTraderStats.ts';

interface LandingPageProps {
  onEnterApp: (tab?: string) => void;
  onOpenConnectWizard: () => void;
  onOpenMyDashboard?: () => void;
  onSelectTrader?: (trader: { userId?: string; username: string; broker?: any; rank?: number; score?: number; winRate?: number; tradesCount?: number }) => void;
  leaderboard?: any[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenConnectWizard,
  onOpenMyDashboard,
  onSelectTrader,
  leaderboard = [],
}) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const [activeTabRanking, setActiveTabRanking] = useState<'pips' | 'profit' | 'rate'>('pips');
  const { traders: canonicalTraders, platformTotals, getTraderStats, usdJpyRate } = useTraderStats();

  // Derive top 3 exclusively from the unified Canonical Stats source of truth
  const baseSource = canonicalTraders.length > 0 ? canonicalTraders : leaderboard;
  const topPodiumTraders = baseSource
    .map(trader => {
      const rawAcc = trader.accountNumber
        ? String(trader.accountNumber).replace(/^TraderRank-/i, '').trim()
        : (String(trader.username || '').match(/(\d{6,})/)?.[1] || '');
      const cleanAcc = rawAcc;

      const real = getTraderStats({
        accountNumber: cleanAcc,
        userId: trader.userId,
        username: trader.username,
      });

      const tradesCount = real ? real.tradesCount : trader.tradesCount ?? 0;
      const pips = real ? real.totalPips : trader.totalPips ?? 0;
      const profitNative = real
        ? real.netProfitNative
        : typeof trader.netProfitNative === 'number'
        ? trader.netProfitNative
        : typeof trader.closedProfitUsd === 'number'
        ? trader.closedProfitUsd
        : 0;
      const profitUsd = real
        ? real.netProfitUsd
        : typeof trader.netProfitUsd === 'number'
        ? trader.netProfitUsd
        : profitNative;
      const winRate = real ? real.winRate : trader.winRate ?? 0;
      const xp = real ? real.xp : tradesCount > 0 ? tradesCount * 25 : trader.xp || 0;
      const gamification = calculateTraderGamification(xp);
      const broker = ((real?.broker || trader.broker || trader.brokers?.[0] || 'XM') as any);
      const identity = resolveTraderIdentity({
        username: trader.username,
        profileName: trader.profileName,
        accountHolderName: real?.profileName,
        accountNumber: cleanAcc,
        userId: trader.userId,
        avatarUrl: trader.avatarUrl,
      });
      const currency = resolveBrokerCurrency(
        broker,
        undefined,
        real?.currency || (trader as any).currency
      );

      return {
        userId: trader.userId,
        username: identity.profileName || trader.username,
        profileName: identity.profileName,
        accountTag: identity.accountTag,
        avatarSeed: identity.avatarSeed,
        avatarUrl:
          (user &&
          (user.id === trader.userId ||
            (user.username && trader.username && user.username.toLowerCase() === String(trader.username).toLowerCase()))
            ? user.avatarUrl
            : undefined) ||
          identity.avatarUrl ||
          trader.avatarUrl,
        broker,
        currency,
        avatarSymbol: (trader.avatarSymbol || 'zap'),
        pips,
        profit: profitNative,
        profitUsd,
        rate: winRate,
        trades: tradesCount,
        winRate,
        tier: t.rewards[gamification.tierKey] || gamification.tierName,
        liveOrders: real?.liveOrders || trader.liveOrders || [],
      };
    })
    .sort((a, b) => {
      const aActive = a.trades > 0 ? 1 : 0;
      const bActive = b.trades > 0 ? 1 : 0;
      if (aActive !== bActive) {
        return bActive - aActive;
      }
      if (activeTabRanking === 'profit') {
        return b.profitUsd - a.profitUsd;
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
    const effCur = currency || (broker === 'XMTrading' ? 'JPY' : 'USD');
    return formatDisplayCurrency(amount, effCur, user?.currencyPreference || 'AUTO', usdJpyRate, { showSign: true });
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
            <button
              onClick={() => onEnterApp()}
              style={{
                background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
                border: 'none',
                color: '#080b11',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0, 240, 255, 0.3)',
              }}
            >
              <Trophy size={13} />
              <span>{t.landing.enterArenaBtn}</span>
            </button>
            <UserNavMenu
              onOpenConnectWizard={onOpenConnectWizard}
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
              whiteSpace: 'pre-line',
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
            <button
              onClick={() => onEnterApp()}
              style={{
                background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
                border: 'none',
                color: '#080b11',
                padding: '16px 42px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                whiteSpace: 'nowrap',
                boxShadow: '0 8px 30px rgba(0, 240, 255, 0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Trophy size={18} /> {t.landing.enterArenaBtn} <ArrowRight size={18} />
            </button>
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
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#F0B90B' }}>$500 – $2,500 USD</div>
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
                    <TraderAvatar
                      username={trader.profileName || trader.username}
                      symbol={trader.avatarSymbol}
                      avatarUrl={trader.avatarUrl}
                      size={56}
                    />
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trader.profileName}
                      </h3>
                      {trader.accountTag && (
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#00F0FF',
                            fontFamily: 'var(--font-mono)',
                            marginTop: '2px',
                            letterSpacing: '0.2px',
                          }}
                        >
                          {trader.accountTag}
                        </div>
                      )}
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
                        className="tabular"
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
                      <div className="tabular" style={{ fontSize: '20px', fontWeight: 900, color: '#F0B90B' }}>
                        {trader.winRate}%
                      </div>
                    </div>
                  </div>

                  {/* Real-Time Trading Orders Strip (Fixed-Height to Prevent Screen Shaking on Refresh) */}
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(8, 11, 17, 0.78)',
                      border: '1px solid rgba(0, 240, 255, 0.14)',
                      minHeight: '88px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#00F0FF', display: 'inline-flex', alignItems: 'center', gap: '5px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                        <Activity size={11} color="#00F0FF" />
                        {trader.liveOrders && trader.liveOrders.some((o: any) => o.isLivePosition)
                          ? 'Real-Time Open Orders'
                          : 'Real-Time Order Feed'}
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#848E9C', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: trader.liveOrders && trader.liveOrders.some((o: any) => o.isLivePosition) ? '#10b981' : '#0abab5',
                            display: 'inline-block',
                          }}
                        />
                        LIVE
                      </span>
                    </div>

                    {trader.liveOrders && trader.liveOrders.filter((o: any) => o.isLivePosition !== false).length > 0 ? (
                      <div
                        style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '140px', overflowY: 'auto', paddingRight: '4px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {trader.liveOrders.filter((o: any) => o.isLivePosition !== false).map((ord: any) => {
                          const isPos = ord.profitPips >= 0;
                          return (
                            <div
                              key={ord.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '11px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, overflow: 'hidden' }}>
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 900,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    flexShrink: 0,
                                    background: ord.type === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: ord.type === 'BUY' ? '#34d399' : '#f87171',
                                  }}
                                >
                                  {ord.type}
                                </span>
                                <strong className="tabular" style={{ color: '#fff', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ord.symbol}</strong>
                                <span className="tabular" style={{ color: '#848E9C', fontSize: '10px', flexShrink: 0 }}>{ord.lotSize.toFixed(2)}L</span>
                              </div>
                              <div className="tabular" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                <span style={{ fontWeight: 800, color: isPos ? '#10b981' : '#ef4444' }}>
                                  {isPos ? `+${ord.profitPips}` : ord.profitPips}p
                                </span>
                                <span style={{ fontSize: '9.5px', color: '#4E586E' }}>
                                  {ord.timeLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#848E9C', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px' }}>
                        No active market orders open right now
                      </div>
                    )}
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
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#F0B90B' }}>$500 – $1,000 USD <span style={{ fontSize: '14px', color: '#00F0FF' }}>+ 50+ Players</span></div>
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
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#F0B90B' }}>$500 – $2,500 USD <span style={{ fontSize: '14px', color: '#00F0FF' }}>+ 50+ Players</span></div>
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
            onClick={() => onEnterApp()}
            style={{
              background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
              border: 'none',
              color: '#080b11',
              padding: '16px 42px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 32px rgba(0, 240, 255, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            <Trophy size={18} /> {t.landing.enterArenaBtn} <ArrowRight size={18} />
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

