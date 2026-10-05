import React, { useState } from 'react';
import {
  Shield,
  Trophy,
  Swords,
  Award,
  Zap,
  Lock,
  ArrowRight,
  Radio,
  ChevronRight,
  Play,
} from 'lucide-react';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { TraderAvatar } from './TraderAvatar.tsx';
import { BrandLogo, BrandMark } from './BrandLogo.tsx';
import { LiveTradeBulletin } from './LiveTradeBulletin.tsx';
import { MarketLivePricesTicker } from './MarketLivePricesTicker.tsx';
import { LiveCandleChart } from './LiveCandleChart.tsx';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenConnectWizard: () => void;
  onSelectTrader?: (trader: { username: string; broker?: any; rank?: number; score?: number }) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenConnectWizard, onSelectTrader }) => {
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
      tier: 'Apex Predator',
      badge: 'Gold Champion',
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
      tier: 'Market Veteran',
      badge: 'Silver Contender',
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
      tier: 'Pro Swing',
      badge: 'Bronze Master',
      glow: '#d97706',
    },
  ];

  return (
    <div style={{ backgroundColor: '#060d11', color: '#f8fafc', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Top Floating Glass Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(6, 13, 17, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BrandLogo size={38} textSize={20} onClick={onEnterApp} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.4)',
              }}
            >
              PRO LEAGUE
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <a href="#rankings" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Rankings
            </a>
            <a href="#tournaments" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Tournaments
            </a>
            <a href="#security" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Zero-Write Safety
            </a>
            <a href="#rewards" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Rewards &amp; Badges
            </a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onOpenConnectWizard}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Fast Connect
            </button>
            <button
              onClick={onEnterApp}
              style={{
                background: 'linear-gradient(135deg, #0abab5 0%, #078c88 100%)',
                border: 'none',
                color: '#000000',
                padding: '9px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(10, 186, 181, 0.3)',
              }}
            >
              <Play size={14} fill="#000" /> Launch Terminal
            </button>
          </div>
        </div>
      </header>

      {/* Live Moving Trade Bulletin (Motion Graphic Spot Ticker) */}
      <div style={{ maxWidth: '1240px', margin: '14px auto 0', padding: '0 20px' }}>
        <LiveTradeBulletin onSelectTrader={onSelectTrader} />
      </div>

      {/* Hero Section */}
      <section style={{ position: 'relative', padding: '60px 24px 60px', overflow: 'hidden' }}>
        {/* Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(10, 186, 181, 0.15) 0%, rgba(129, 216, 208, 0.08) 40%, transparent 70%)',
            filter: 'blur(60px)',
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
              background: 'rgba(10, 186, 181, 0.12)',
              border: '1px solid rgba(10, 186, 181, 0.3)',
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--accent-green)',
              marginBottom: '24px',
            }}
          >
            <Radio size={14} className="animate-pulse" />
            GLOBAL MULTI-BROKER ESPORTS & VERIFIED PRO ARENA
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 900,
              lineHeight: '1.1',
              letterSpacing: '-0.03em',
              margin: '0 0 20px',
              background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Where Real Traders Battle.<br />
            <span style={{ background: 'linear-gradient(90deg, #0abab5, #81d8d0, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Zero Execution Risk. Pure Skill.
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              color: 'var(--text-muted)',
              maxWidth: '780px',
              margin: '0 auto 36px',
              lineHeight: '1.6',
            }}
          >
            Connect your <strong>MT4 / MT5</strong> account with safe <strong>read-only investor credentials</strong> across IC Markets, Exness, XM, Axiory, and Vantage. Compete in weekly prop-style battle leagues, verify your win rate, and climb the global Hall of Fame.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
            <button
              onClick={onOpenConnectWizard}
              style={{
                background: 'linear-gradient(135deg, var(--accent-green) 0%, #078c88 100%)',
                border: 'none',
                color: '#000000',
                padding: '16px 32px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 10px 30px -5px rgba(10, 186, 181, 0.4)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Zap size={18} fill="#000" /> Connect in 60 Seconds
            </button>

            <button
              onClick={onEnterApp}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '16px 30px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Explore Live Arena <ArrowRight size={18} />
            </button>
          </div>

          {/* Social Proof Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              padding: '24px 32px',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Verified Trades Synced</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--accent-green)' }}>54,200+</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Monthly Prize Pools</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#fbbf24' }}>$31,500</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Supported Brokers</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--accent-cyan)' }}>5 Major (IC Markets, Exness...)</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Security Guarantee</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#0abab5' }}>100% Read-Only</div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Live Prices Ticker (Top Performance Trading Pairs) */}
      <MarketLivePricesTicker />

      {/* Live Candlestick & Market Execution Feed (AllTick Real-Time API) */}
      <section style={{ maxWidth: '1200px', margin: '40px auto 0', padding: '0 24px' }}>
        <LiveCandleChart initialSymbol="USDJPY" initialTimeframe="1m" height={360} />
      </section>

      {/* Section 2: Global Verified Ranking & Podium Preview */}
      <section id="rankings" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '8px' }}>
              <Trophy size={16} /> TRANSPARENT REPUTATION
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 12px' }}>
              The Verified Global Ranking Standard
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto' }}>
              Rankings verified directly from MT4/MT5 server ledgers. No manual screenshots, no inspect element manipulation.
            </p>

            {/* Metric Switcher */}
            <div style={{ display: 'inline-flex', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '10px', marginTop: '24px', border: '1px solid var(--border-subtle)' }}>
              {[
                { id: 'pips', label: 'Winning Pips' },
                { id: 'profit', label: 'Profit Amount ($)' },
                { id: 'rate', label: 'Profit Rate (%)' },
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
                    background: activeTabRanking === m.id ? 'var(--accent-cyan)' : 'transparent',
                    color: activeTabRanking === m.id ? '#000000' : 'var(--text-muted)',
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
                  background: `linear-gradient(180deg, ${trader.glow}15 0%, rgba(15, 23, 42, 0.9) 100%)`,
                  border: `1px solid ${trader.glow}50`,
                  borderRadius: '20px',
                  padding: '28px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: trader.rank === 1 ? `0 15px 35px -5px ${trader.glow}25` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: `${trader.glow}25`,
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
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{trader.username}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {trader.tier} • {trader.trades} Trades Synced
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.4)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Pips</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-green)' }}>
                      +{trader.pips.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Win Rate</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24' }}>
                      {trader.winRate}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={onEnterApp}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                padding: '12px 28px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              View Complete All-Time &amp; Daily Standings <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Prop Battles & Tournament Arena */}
      <section id="tournaments" style={{ padding: '80px 24px', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '8px' }}>
              <Swords size={16} /> COMPETITIVE TOURNAMENTS
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 12px' }}>
              Prop-Style Battle Leagues with Institutional Risk Rules
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto' }}>
              We reward risk-controlled mastery, not lot-size gamblers. Strict trailing drawdown limits ensure only elite disciplined traders take the podium.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '48px' }}>
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(129, 216, 208, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(129, 216, 208, 0.3)',
                borderRadius: '20px',
                padding: '30px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(129, 216, 208, 0.2)', color: 'var(--accent-cyan)' }}>
                  WEEKLY SPRINT
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monday – Friday</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>Weekly FX Blitz League</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: '1.5' }}>
                Fast 5-day sprint for EUR, GBP, and Gold traders. Top 3 finishers claim USD prizes and tier boosts.
              </p>

              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.3)', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Prize Pool</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#fbbf24' }}>$5,000 USD <span style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>+ 15,000 XP</span></div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>✓ Max Daily Loss: 5.0% Equity</div>
                <div>✓ Max Trailing DD: 10.0%</div>
                <div>✓ Min. 5 Trades to Qualify</div>
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '20px',
                padding: '30px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                  MONTHLY CHAMPIONSHIP
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>30-Day Gauntlet</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>Apex Prop Championship</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: '1.5' }}>
                The flagship endurance competition. Multi-factor scoring combines net pips with Sharpe ratio stability.
              </p>

              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.3)', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Prize Pool</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#fbbf24' }}>$25,000 USD <span style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>+ 75,000 XP</span></div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>✓ Max Daily Loss: 4.0% Equity</div>
                <div>✓ Max Trailing DD: 8.0%</div>
                <div>✓ Min. 20 Trades to Qualify</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Zero-Write Security & Trust Architecture */}
      <section id="security" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '8px' }}>
              <Shield size={16} /> 100% READ-ONLY VERIFICATION
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 12px' }}>
              Built Around Institutional Zero-Write Security
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto' }}>
              We never ask for your master trading password. Your funds and trades remain 100% untouchable.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ padding: '28px', borderRadius: '18px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(10, 186, 181, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Lock size={20} color="var(--accent-green)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>Investor Passwords Only</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                TraderRank accepts only investor (read-only) passwords. Master trading passwords are mathematically rejected at pre-flight validation.
              </p>
            </div>

            <div style={{ padding: '28px', borderRadius: '18px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(129, 216, 208, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Shield size={20} color="var(--accent-cyan)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>Isolated Secrets Vault</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Credentials are encrypted using AES-256 in an isolated hardware vault. Application database records only store sanitized references, never keys.
              </p>
            </div>

            <div style={{ padding: '28px', borderRadius: '18px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Zap size={20} color="#fbbf24" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>Zero-Write API Middleware</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Every API endpoint is guarded against order creation, cancellation, or modification. Any write attempt immediately triggers an HTTP 403 Forbidden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: 3-Step Onboarding CTA */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, rgba(6, 13, 17, 1) 0%, rgba(13, 27, 42, 0.9) 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 16px' }}>
            Ready to Prove Your Rank?
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: '0 0 40px' }}>
            Join thousands of verified traders across Exness, XM, Axiory, and Vantage in 3 simple steps.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '48px', textAlign: 'left' }}>
            <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '6px' }}>STEP 01</div>
              <strong style={{ fontSize: '15px' }}>Choose Your Broker</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                Select Exness, XM, Axiory, or Vantage on MT4 or MT5.
              </p>
            </div>

            <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '6px' }}>STEP 02</div>
              <strong style={{ fontSize: '15px' }}>Enter Read-Only Pass</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                Provide your server name and read-only investor password.
              </p>
            </div>

            <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>STEP 03</div>
              <strong style={{ fontSize: '15px' }}>Enter the Arena</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                Watch your trades sync live and start climbing the leaderboards.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenConnectWizard}
            style={{
              background: 'linear-gradient(135deg, var(--accent-green) 0%, #078c88 100%)',
              border: 'none',
              color: '#000000',
              padding: '16px 36px',
              borderRadius: '14px',
              fontSize: '17px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 10px 30px -5px rgba(10, 186, 181, 0.4)',
            }}
          >
            Start Free Verification Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', backgroundColor: '#040a0d', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrandMark size={22} variant="glyph" />
            <strong style={{ fontSize: '15px' }}>TraderRank FX</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>© 2026 TraderRank Inc. All rights reserved.</span>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Read-Only Ingestion</span>
            <span>MetaApi Cloud Gateway</span>
            <span>Exness OpenAPI</span>
            <span>Terms of Competition</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
