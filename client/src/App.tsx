import React, { useState, useEffect } from 'react';
import {
  TradingAccount,
  CanonicalPosition,
  LeaderboardEntry,
  DailyLeaderboardResult,
  Broker,
  SubscriptionStatus,
} from '../../shared/src/types.ts';
import { ConnectionWizard } from './components/ConnectionWizard.tsx';
import { AccountsList } from './components/AccountsList.tsx';
import { LivePositionsTicker } from './components/LivePositionsTicker.tsx';
import { LiveLeaderboard } from './components/LiveLeaderboard.tsx';
import { SecurityVaultDrawer } from './components/SecurityVaultDrawer.tsx';
import { DailyBestTraderCard } from './components/DailyBestTraderCard.tsx';
import { TournamentArena } from './components/TournamentArena.tsx';
import { RewardsBadges } from './components/RewardsBadges.tsx';
import { CommunityFeed } from './components/CommunityFeed.tsx';
import { TraderProfileModal, TraderProfileData } from './components/TraderProfileModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { BrandLogo, BrandMark } from './components/BrandLogo.tsx';
import { LiveTradeBulletin } from './components/LiveTradeBulletin.tsx';
import { LiveCandleChart } from './components/LiveCandleChart.tsx';
import { DailyAnalysisHub } from './components/DailyAnalysisHub.tsx';
import { SubscriptionModal } from './components/SubscriptionModal.tsx';
import { LanguageSelector } from './components/LanguageSelector.tsx';
import { useTranslation } from './context/LanguageContext.tsx';
import {
  Plus,
  Shield,
  Layers,
  BarChart3,
  BarChart2,
  Radio,
  RefreshCw,
  Globe2,
  Trophy,
  Swords,
  Award,
  Users,
  Crown,
  Zap,
  Cloud,
} from 'lucide-react';

interface MarketQuote {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  source: 'LIVE_API' | 'SYNTHETIC';
  timestamp: string;
}

interface MarketStatus {
  feedStatus: 'LIVE_NETWORK' | 'FALLBACK_SYNTHETIC';
  lastSyncAt: string | null;
  successfulSyncCount: number;
  quotes: Record<string, MarketQuote>;
}

export const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'daily-analysis' | 'charts' | 'ranking' | 'tournaments' | 'rewards' | 'community' | 'positions' | 'security'
  >('overview');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Pro Subscription State persisted in localStorage
  const [subscription, setSubscription] = useState<SubscriptionStatus>(() => {
    try {
      const saved = localStorage.getItem('traderrank_sub_status_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse subscription from localStorage', e);
    }
    return {
      isActive: false,
      tier: 'FREE',
      planName: 'Free Account',
      priceMonthly: 0,
      startedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      features: ['Standard Leaderboard Viewing', 'Basic Charts'],
    };
  });

  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [positions, setPositions] = useState<CanonicalPosition[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyResult, setDailyResult] = useState<DailyLeaderboardResult | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [isRefreshingMarket, setIsRefreshingMarket] = useState(false);
  const [metaApiHealth, setMetaApiHealth] = useState<{ ok: boolean; latencyMs: number; hasTokenConfigured?: boolean } | null>(null);
  const [r2Status, setR2Status] = useState<{ configured: boolean; bucket: string; ok: boolean; storage: string } | null>(null);

  // Active modal trader profile
  const [selectedTrader, setSelectedTrader] = useState<TraderProfileData | null>(null);

  // Initial data fetch
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  };

  const fetchMetaApiHealth = async () => {
    try {
      const res = await fetch('/api/brokers/metaapi/health');
      if (res.ok) {
        const data = await res.json();
        setMetaApiHealth(data);
      }
    } catch (err) {
      console.error('Failed to fetch MetaApi health', err);
    }
  };

  const fetchR2Status = async () => {
    try {
      const res = await fetch('/api/storage/r2/status');
      if (res.ok) {
        const data = await res.json();
        setR2Status(data);
      }
    } catch {
      // Ignore
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const [resAll, resDaily] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch('/api/leaderboard/daily'),
      ]);
      if (resAll.ok) {
        const data = await resAll.json();
        setLeaderboard(data);
      }
      if (resDaily.ok) {
        const daily = await resDaily.json();
        setDailyResult(daily);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
    }
  };

  const fetchMarketQuotes = async () => {
    try {
      const res = await fetch('/api/market/quotes');
      if (res.ok) {
        const data = await res.json();
        setMarketStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch market quotes', err);
    }
  };

  const handleRefreshMarketRates = async () => {
    setIsRefreshingMarket(true);
    try {
      const res = await fetch('/api/market/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMarketStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to refresh market rates', err);
    } finally {
      setIsRefreshingMarket(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchLeaderboard();
    fetchMarketQuotes();
    fetchMetaApiHealth();
    fetchR2Status();

    // Setup live WebSocket stream
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'LEADERBOARD_UPDATE') {
          setLeaderboard(msg.data);
        } else if (msg.type === 'DAILY_LEADERBOARD_UPDATE') {
          setDailyResult(msg.data);
        } else if (msg.type === 'MARKET_QUOTES') {
          setMarketStatus(msg.data);
        } else if (msg.type === 'POSITIONS_UPDATE') {
          setPositions(prev => {
            const others = prev.filter(p => p.accountId !== msg.accountId);
            return [...others, ...msg.positions];
          });
        }
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };

    const fallbackTimer = setInterval(() => {
      fetchLeaderboard();
      fetchMarketQuotes();
    }, 5000);

    return () => {
      socket.close();
      clearInterval(fallbackTimer);
    };
  }, []);

  const handleDisconnect = async (accountId: string) => {
    try {
      const res = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
      if (res.ok) {
        setAccounts(prev => prev.filter(a => a.id !== accountId));
        setPositions(prev => prev.filter(p => p.accountId !== accountId));
      }
    } catch (err) {
      console.error('Failed to disconnect account', err);
    }
  };

  const handleAccountConnected = (newAcc: TradingAccount) => {
    setAccounts(prev => [...prev, newAcc]);
    fetchAccounts();
    fetchMetaApiHealth();
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      const res = await fetch(`/api/brokers/metaapi/sync/${accountId}`, { method: 'POST' });
      if (res.ok) {
        await fetchAccounts();
        await fetchLeaderboard();
      }
    } catch (err) {
      console.error('Failed to sync account with MetaApi', err);
    }
  };

  const handleSelectTrader = (t: { username: string; broker?: Broker; rank?: number; score?: number }) => {
    const safeBroker: Broker = t.broker || 'Exness';
    setSelectedTrader({
      userId: `u_${t.username.toLowerCase()}`,
      username: t.username,
      broker: safeBroker,
      avatarSymbol: 'EURUSD',
      tier: 'Market Veteran',
      level: 3,
      xp: 2850,
      rank: t.rank || 1,
      netPips: t.score || 88.4,
      winRate: 74.5,
      profitFactor: 2.15,
      maxDrawdown: 2.4,
      totalTrades: 38,
      bestTradePips: 42.0,
      avgHoldingTime: '2h 15m',
      verifiedSince: 'August 2026',
      isFollowing: false,
    });
  };

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          leaderboard={leaderboard}
          onSelectTrader={handleSelectTrader}
          onEnterApp={(tab?: string) => {
            if (tab === 'leaderboard') tab = 'ranking';
            if (tab) {
              setActiveTab(tab as any);
            }
            setCurrentView('app');
          }}
          onOpenConnectWizard={() => {
            setCurrentView('app');
            setIsWizardOpen(true);
          }}
        />
        {/* Connection Wizard Modal if triggered from landing page */}
        {isWizardOpen && (
          <ConnectionWizard
            onClose={() => setIsWizardOpen(false)}
            onSuccess={handleAccountConnected}
          />
        )}
        {/* Trader Profile Modal if triggered from landing page */}
        {selectedTrader && (
          <TraderProfileModal
            trader={selectedTrader}
            onClose={() => setSelectedTrader(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header Banner */}
      <header className="header-banner">
        <div className="brand-wrapper">
          <BrandLogo size={44} showWordmark={false} onClick={() => setCurrentView('landing')} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="brand-wordmark" style={{ fontSize: '24px' }}>
                Trader<span className="brand-wordmark-accent">Rank</span>
                <span className="brand-fx-pill">FX</span>
              </h1>
              <span className="brand-badge">{t.landing.badge}</span>
              {metaApiHealth && (
                <span
                  className="status-pill"
                  style={{
                    background: metaApiHealth.ok ? 'rgba(10, 186, 181, 0.15)' : 'rgba(246, 70, 93, 0.15)',
                    color: metaApiHealth.ok ? '#0abab5' : 'var(--accent-red)',
                    border: `1px solid ${metaApiHealth.ok ? 'rgba(10, 186, 181, 0.35)' : 'rgba(246, 70, 93, 0.35)'}`,
                    fontSize: '11px',
                    cursor: 'default',
                  }}
                  title={metaApiHealth.hasTokenConfigured ? 'MetaApi Enterprise Cloud Token Active' : 'MetaApi Sandbox Mode'}
                >
                  <Zap size={12} color="#0abab5" />
                  {metaApiHealth.ok ? `MetaApi: ${metaApiHealth.latencyMs}ms` : 'MetaApi: Offline'}
                </span>
              )}
              {r2Status && (
                <span
                  className="status-pill"
                  style={{
                    background: 'rgba(244, 129, 32, 0.15)',
                    color: '#f48120',
                    border: '1px solid rgba(244, 129, 32, 0.35)',
                    fontSize: '11px',
                    cursor: 'default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title={`Cloudflare R2 Bucket: ${r2Status.bucket} (${r2Status.storage})`}
                >
                  <Cloud size={12} color="#f48120" />
                  R2 Cloud
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.app.heroSubheading}
            </p>
          </div>
        </div>

        <div className="header-actions">
          {/* Language Selector Dropdown (Bitget Inspired) */}
          <LanguageSelector />

          <button
            className="btn-secondary"
            onClick={() => setIsSubscriptionModalOpen(true)}
            title="TraderRank Pro Daily Intelligence ($9/mo)"
            style={{
              border: `1px solid ${subscription.isActive ? 'rgba(0, 218, 198, 0.4)' : 'rgba(240, 185, 11, 0.4)'}`,
              background: subscription.isActive ? 'rgba(0, 218, 198, 0.12)' : 'rgba(240, 185, 11, 0.08)',
              color: subscription.isActive ? 'var(--accent-cyan)' : 'var(--accent-gold)',
              fontWeight: 700,
            }}
          >
            <Crown size={14} color={subscription.isActive ? '#0abab5' : '#94a3b8'} />
            <span>{subscription.isActive ? t.nav.proPlanActive : t.nav.unlockPro}</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => setCurrentView('landing')}
            title={t.nav.landing}
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Globe2 size={16} /> {t.nav.landing}
          </button>
          <button className="btn-secondary" onClick={() => setIsWizardOpen(true)}>
            <Layers size={16} /> {t.connector.selectBroker}
          </button>
          <button className="btn-primary" onClick={() => setIsWizardOpen(true)}>
            <Plus size={16} /> {t.nav.connectAccount}
          </button>
        </div>
      </header>

      {/* Live Moving Trade Bulletin (Motion Graphic Spot Ticker) */}
      <LiveTradeBulletin onSelectTrader={handleSelectTrader} />

      {/* Live Market API Ticker Strip (Smooth Slow Leftward Moving Tape) */}
      <div className="market-strip">
        <div className="market-strip-pinned-left">
          <Globe2 size={15} color="var(--accent-cyan)" />
          <span
            className="status-pill"
            style={{
              background: marketStatus?.feedStatus === 'LIVE_NETWORK' ? 'rgba(10, 186, 181, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: marketStatus?.feedStatus === 'LIVE_NETWORK' ? 'var(--accent-green)' : 'var(--text-muted)',
              border: `1px solid ${marketStatus?.feedStatus === 'LIVE_NETWORK' ? 'rgba(10, 186, 181, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              fontSize: '11px',
              padding: '3px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: marketStatus?.feedStatus === 'LIVE_NETWORK' ? '#10b981' : '#0abab5', display: 'inline-block' }} />
            {marketStatus?.feedStatus === 'LIVE_NETWORK' ? t.marketTicker.realApiLive : t.marketTicker.liveEngine}
          </span>
        </div>

        <div className="market-strip-track-window">
          <div className="market-strip-marquee">
            {marketStatus?.quotes &&
              [...Object.entries(marketStatus.quotes), ...Object.entries(marketStatus.quotes)].map(([sym, q], idx) => (
                <div key={`${sym}-${idx}`} className="market-pill">
                  <strong>{sym}</strong>
                  <span className="bid-ask tabular">
                    {q.bid.toLocaleString(undefined, { minimumFractionDigits: sym === 'USDJPY' ? 3 : sym === 'BTCUSD' ? 2 : 5 })} / {q.ask.toLocaleString(undefined, { minimumFractionDigits: sym === 'USDJPY' ? 3 : sym === 'BTCUSD' ? 2 : 5 })}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)', letterSpacing: '0.5px', fontWeight: 700 }}>
                    {q.source === 'LIVE_API' ? 'LIVE' : 'SIM'}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="market-strip-pinned-right">
          <button
            className="market-refresh-btn"
            onClick={handleRefreshMarketRates}
            disabled={isRefreshingMarket}
            title={t.nav.refreshRates}
          >
            <RefreshCw size={13} className={isRefreshingMarket ? 'animate-spin' : ''} style={{ animation: isRefreshingMarket ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshingMarket ? t.app.syncing : t.nav.refreshRates}
          </button>
        </div>
      </div>

      {/* Modern Multi-Tab Navigation */}
      <nav className="tabs-nav">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} /> {t.nav.overview}
        </button>
        <button
          className={`tab-button ${activeTab === 'daily-analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily-analysis')}
          style={{ position: 'relative' }}
        >
          <Crown size={16} color={activeTab === 'daily-analysis' ? 'var(--accent-cyan)' : 'var(--accent-gold)'} /> {t.nav.dailyIntel}
          <span
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '8px',
              background: subscription.isActive ? 'rgba(0, 218, 198, 0.2)' : 'rgba(240, 185, 11, 0.2)',
              color: subscription.isActive ? 'var(--accent-cyan)' : 'var(--accent-gold)',
              fontWeight: 800,
              border: `1px solid ${subscription.isActive ? 'rgba(0, 218, 198, 0.4)' : 'rgba(240, 185, 11, 0.4)'}`,
            }}
          >
            {subscription.isActive ? 'PRO' : '$9/mo'}
          </span>
        </button>
        <button
          className={`tab-button ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          <BarChart2 size={16} /> {t.nav.liveCharts}
        </button>
        <button
          className={`tab-button ${activeTab === 'ranking' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranking')}
        >
          <Trophy size={16} /> {t.nav.rankings}
        </button>
        <button
          className={`tab-button ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          <Swords size={16} /> {t.nav.tournaments}
        </button>
        <button
          className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          <Award size={16} /> {t.nav.rewards}
        </button>
        <button
          className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          <Users size={16} /> {t.nav.community}
        </button>
        <button
          className={`tab-button ${activeTab === 'positions' ? 'active' : ''}`}
          onClick={() => setActiveTab('positions')}
        >
          <Radio size={16} /> {t.nav.positions} ({positions.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={16} /> {t.nav.securityVault}
        </button>
      </nav>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <DailyBestTraderCard
            champion={dailyResult?.dailyBestTrader || null}
            totalDailyPips={dailyResult?.totalDailyPips || 0}
            activeTradersToday={dailyResult?.activeTradersToday || 0}
          />
          <LiveCandleChart initialSymbol="USDJPY" initialTimeframe="1m" height={320} />
          <div className="grid-main">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <AccountsList
                accounts={accounts}
                onDisconnect={handleDisconnect}
                onOpenWizard={() => setIsWizardOpen(true)}
                onSyncAccount={handleSyncAccount}
                onOpenSecurityVault={() => setActiveTab('security')}
              />
              <LivePositionsTicker positions={positions} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <LiveLeaderboard
                entries={leaderboard}
                dailyResult={dailyResult}
                onSelectTrader={handleSelectTrader}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 1a: Dedicated Daily Trading Intelligence & Custom Strategic Hub */}
      {activeTab === 'daily-analysis' && (
        <DailyAnalysisHub
          subscription={subscription}
          onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        />
      )}

      {/* Tab 1b: Live Candlestick Charts & AllTick Market Feed */}
      {activeTab === 'charts' && (
        <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <LiveCandleChart initialSymbol="USDJPY" initialTimeframe="1m" height={440} />
          <LivePositionsTicker positions={positions} />
        </div>
      )}

      {/* Tab 2: Global Verified Ranking */}
      {activeTab === 'ranking' && (
        <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
          <DailyBestTraderCard
            champion={dailyResult?.dailyBestTrader || null}
            totalDailyPips={dailyResult?.totalDailyPips || 0}
            activeTradersToday={dailyResult?.activeTradersToday || 0}
          />
          <LiveLeaderboard
            entries={leaderboard}
            dailyResult={dailyResult}
            onSelectTrader={handleSelectTrader}
          />
        </div>
      )}

      {/* Tab 3: Tournament Battle Arena */}
      {activeTab === 'tournaments' && (
        <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
          <TournamentArena onOpenConnectWizard={() => setIsWizardOpen(true)} />
        </div>
      )}

      {/* Tab 4: Rewards & XP Progression */}
      {activeTab === 'rewards' && (
        <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
          <RewardsBadges />
        </div>
      )}

      {/* Tab 5: Community Live Feed & Cheers */}
      {activeTab === 'community' && (
        <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
          <CommunityFeed onOpenConnectWizard={() => setIsWizardOpen(true)} />
        </div>
      )}

      {/* Tab 6: Streaming Positions */}
      {activeTab === 'positions' && (
        <div>
          <LivePositionsTicker positions={positions} />
        </div>
      )}

      {/* Tab 7: Security Vault Audit */}
      {activeTab === 'security' && (
        <div>
          <SecurityVaultDrawer />
        </div>
      )}

      {/* Connection Wizard Modal */}
      {isWizardOpen && (
        <ConnectionWizard
          onClose={() => setIsWizardOpen(false)}
          onSuccess={handleAccountConnected}
        />
      )}

      {/* Trader Profile Modal */}
      {selectedTrader && (
        <TraderProfileModal
          trader={selectedTrader}
          onClose={() => setSelectedTrader(null)}
        />
      )}

      {/* Pro Subscription Unlock Modal ($9/mo) */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        subscription={subscription}
        onSubscriptionChange={setSubscription}
        onNavigateToDailyIntel={() => {
          setActiveTab('daily-analysis');
          setIsSubscriptionModalOpen(false);
        }}
      />

      {/* Global Application Footer */}
      <footer
        style={{
          marginTop: '60px',
          padding: '24px 20px',
          borderTop: '1px solid rgba(0, 240, 255, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BrandMark size={20} variant="glyph" />
          <span>
            <strong style={{ color: '#fff' }}>TraderRank FX</strong> • {t.landing.badge}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{t.footer.poweredBy}</span>
            <span
              style={{
                color: 'var(--accent-cyan)',
                fontWeight: 800,
                letterSpacing: '0.3px',
                padding: '4px 12px',
                borderRadius: '6px',
                background: 'rgba(0, 218, 198, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
              }}
            >
              {t.footer.companyName}
            </span>
          </div>

          <LanguageSelector />
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <span>© {new Date().getFullYear()} {t.footer.allRightsReserved}</span>
          <span>•</span>
          <span>{t.app.sslVault}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
