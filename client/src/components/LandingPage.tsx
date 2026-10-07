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
  Play,
  Target,
  Flame,
} from 'lucide-react';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { TraderAvatar } from './TraderAvatar.tsx';
import { BrandLogo, BrandMark } from './BrandLogo.tsx';
import { LiveTradeBulletin } from './LiveTradeBulletin.tsx';
import { MarketLivePricesTicker } from './MarketLivePricesTicker.tsx';
import { LiveCandleChart } from './LiveCandleChart.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';

interface LandingPageProps {
  onEnterApp: (tab?: string) => void;
  onOpenConnectWizard: () => void;
  onSelectTrader?: (trader: { username: string; broker?: any; rank?: number; score?: number }) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenConnectWizard, onSelectTrader }) => {
  const { t, language } = useTranslation();
  const [activeTabRanking, setActiveTabRanking] = useState<'pips' | 'profit' | 'rate'>('pips');

  const topPodiumTraders = [
    {
      rank: 1,
      username: 'FX_Sniper',
      broker: 'Exness' as const,
      avatarSymbol: 'EURUSD',
      pips: 88.4,
      profit: 8840.0,
      rate: 142.5,
      trades: 14,
      winRate: 78.5,
      tier: t.rewards.tierApexPredator,
      badge: t.leaderboard.goldChampion,
      glow: '#fbbf24',
    },
    {
      rank: 2,
      username: 'GoldBug_JP',
      broker: 'XM' as const,
      avatarSymbol: 'XAUUSD',
      pips: 74.2,
      profit: 7420.0,
      rate: 118.0,
      trades: 11,
      winRate: 72.7,
      tier: t.rewards.tierMarketVeteran,
      badge: t.leaderboard.silverContender,
      glow: '#94a3b8',
    },
    {
      rank: 3,
      username: 'AlphaWave',
      broker: 'Axiory' as const,
      avatarSymbol: 'USDJPY',
      pips: 61.9,
      profit: 6190.0,
      rate: 94.2,
      trades: 9,
      winRate: 66.7,
      tier: t.rewards.tierProSwing,
      badge: t.leaderboard.bronzeMaster,
      glow: '#d97706',
    },
  ];

  return (
    <div style={{ backgroundColor: '#080b11', color: '#ffffff', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Top Floating Glass Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(8, 11, 17, 0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 24px',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BrandLogo size={38} textSize={20} onClick={() => onEnterApp()} />
            <span
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

          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="#rankings" style={{ color: '#848E9C', textDecoration: 'none', fontSize: '13px', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={(e) => (e.currentTarget.style.color = '#848E9C')}>
              {t.nav.rankings}
            </a>
            <a href="#tournaments" style={{ color: '#848E9C', textDecoration: 'none', fontSize: '13px', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={(e) => (e.currentTarget.style.color = '#848E9C')}>
              {t.nav.tournaments}
            </a>
            <a href="#security" style={{ color: '#848E9C', textDecoration: 'none', fontSize: '13px', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={(e) => (e.currentTarget.style.color = '#848E9C')}>
              {t.nav.securityVault}
            </a>
            <a href="#rewards" style={{ color: '#848E9C', textDecoration: 'none', fontSize: '13px', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={(e) => (e.currentTarget.style.color = '#848E9C')}>
              {t.nav.rewards}
            </a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LanguageSelector />
            <button
              onClick={onOpenConnectWizard}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              {t.landing.connectBrokerBtn}
            </button>
            <button
              onClick={() => onEnterApp()}
              style={{
                background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 50%, #0891b2 100%)',
                border: 'none',
                color: '#080b11',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 18px rgba(0, 240, 255, 0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 240, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 240, 255, 0.35)';
              }}
            >
              <Play size={14} fill="#080b11" /> {t.landing.enterArenaBtn}
            </button>
          </div>
        </div>
      </header>

      {/* Live Moving Trade Bulletin (Motion Graphic Spot Ticker) */}
      <div style={{ maxWidth: '1280px', margin: '14px auto 0', padding: '0 20px' }}>
        <LiveTradeBulletin onSelectTrader={onSelectTrader} />
      </div>

      {/* Hero Section */}
      <section style={{ position: 'relative', padding: '64px 24px 60px', overflow: 'hidden' }}>
        {/* Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
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
              marginBottom: '24px',
              letterSpacing: '0.4px',
            }}
          >
            <Zap size={14} style={{ color: '#00F0FF' }} />
            {t.landing.badge}
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: '-1.5px',
              margin: '0 0 20px',
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
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#848E9C',
              maxWidth: '820px',
              margin: '0 auto 36px',
              fontWeight: 500,
            }}
          >
            {t.landing.heroSubtitle}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
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
          </div>

          {/* Social Proof Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '24px 32px',
              borderRadius: '16px',
              background: 'rgba(14, 20, 31, 0.85)',
              border: '1px solid rgba(0, 240, 255, 0.15)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#848E9C', marginBottom: '4px', fontWeight: 600 }}>{t.landing.verifiedPnlBadge}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#00F0FF' }}>54,200+</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#848E9C', marginBottom: '4px', fontWeight: 600 }}>{t.arena.prizePool}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#F0B90B' }}>$31,500 USD</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#848E9C', marginBottom: '4px', fontWeight: 600 }}>{t.landing.liveBrokersCount}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#00DAC6' }}>5 Tier-1 Brokers</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#848E9C', marginBottom: '4px', fontWeight: 600 }}>{t.nav.viewOnlyBadge}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>100% Zero-Write</div>
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

          {/* Top 3 Podium Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {topPodiumTraders.map(trader => (
              <div
                key={trader.rank}
                style={{
                  background: 'rgba(14, 20, 31, 0.85)',
                  border: trader.rank === 1 ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '28px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: trader.rank === 1 ? '0 12px 36px rgba(0, 240, 255, 0.15)' : 'none',
                  backdropFilter: 'blur(16px)',
                }}
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
                    <div style={{ fontSize: '11px', color: '#848E9C' }}>{t.landing.gainCol}</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#00F0FF' }}>
                      +{trader.pips.toFixed(1)}
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

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => onEnterApp()}
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
              {t.arena.tournamentsTitle} <ChevronRight size={16} />
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
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
                <div>✓ {t.arena.maxDailyLoss}: 5.0% {t.arena.equityLoss}</div>
                <div>✓ {t.arena.maxTrailingDD}: 10.0%</div>
                <div>✓ 5 {t.arena.minTradesDesc}</div>
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
                <div>✓ {t.arena.maxDailyLoss}: 4.0% {t.arena.equityLoss}</div>
                <div>✓ {t.arena.maxTrailingDD}: 8.0%</div>
                <div>✓ 20 {t.arena.minTradesDesc}</div>
              </div>
            </div>
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
                    color: '#00F0FF',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    letterSpacing: '0.5px',
                  }}
                >
                  {t.rewards.levelTrader}
                </span>
                <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>
                  {t.rewards.currentTier}
                </h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#848E9C' }}>{t.rewards.currentXp}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#00F0FF' }}>
                  2,750 <span style={{ fontSize: '14px', color: '#848E9C' }}>/ 5,000 XP</span>
                </div>
              </div>
            </div>

            {/* Daily Streak Days Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginTop: '16px' }}>
              {[
                { dayNum: 1, xp: '+50 XP', claimed: true },
                { dayNum: 2, xp: '+75 XP', claimed: true },
                { dayNum: 3, xp: '+100 XP', claimed: true },
                { dayNum: 4, xp: '+150 XP', claimed: true },
                { dayNum: 5, xp: '+200 XP', current: true },
                { dayNum: 6, xp: '+300 XP', locked: true },
                { dayNum: 7, xp: '+500 XP', mystery: true },
              ].map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    textAlign: 'center',
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
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#848E9C' }}>
                    {language === 'ja' ? `${s.dayNum}日目` : language === 'zh' ? `第 ${s.dayNum} 天` : `Day ${s.dayNum}`}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: s.claimed ? '#00DAC6' : s.current ? '#F0B90B' : '#848E9C', margin: '4px 0' }}>
                    {s.xp}
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    {s.claimed ? (
                      <span style={{ color: '#00DAC6', fontWeight: 700 }}>✓ {t.rewards.claimed}</span>
                    ) : s.current ? (
                      <span style={{ color: '#F0B90B', fontWeight: 800 }}>⚡ {t.rewards.active}</span>
                    ) : (
                      <span style={{ color: '#848E9C' }}>🔒 {t.rewards.locked}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Honor Badges 4-Column Showcase */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '36px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
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
              padding: '16px 40px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0, 240, 255, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            {t.landing.ctaButton}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#05070a', textAlign: 'center' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BrandMark size={22} variant="glyph" />
            <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>TraderRank FX</strong>
            <span style={{ fontSize: '12px', color: '#848E9C' }}>© {new Date().getFullYear()} TraderRank. {t.footer.allRightsReserved}.</span>
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

