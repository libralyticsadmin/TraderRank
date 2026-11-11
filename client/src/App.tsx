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
import { AffiliateModal } from './components/AffiliateModal.tsx';
import { LanguageSelector } from './components/LanguageSelector.tsx';
import { useTranslation } from './context/LanguageContext.tsx';
import { useAuth } from './context/AuthContext.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ProfileEditModal } from './components/ProfileEditModal.tsx';
import { UserNavMenu } from './components/UserNavMenu.tsx';
import { FeatureSymbol, FeatureSymbolType } from './components/FeatureSymbol.tsx';
import {
  Plus,
  RefreshCw,
  Globe2,
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
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'daily-analysis' | 'charts' | 'ranking' | 'tournaments' | 'rewards' | 'community' | 'positions' | 'security'
  >('overview');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);

  // Detect referral invite code from URL (?ref=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        localStorage.setItem('traderrank_referrer', refCode.trim());
      }
    } catch {
      // ignore
    }
  }, []);

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
      isActive: true,
      tier: 'PRO_ANNUAL',
      planName: 'Pro All-Access',
      priceMonthly: 0,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      features: ['Full Leaderboard Access', 'Daily Intelligence', 'SMC Analysis', 'Tournament Eligibility'],
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

  // Isolated account fetch (Privacy & Security: only load current user's accounts)
  const fetchAccounts = async (targetUser?: typeof user | null) => {
    try {
      const activeUser = targetUser !== undefined ? targetUser : user;
      if (!activeUser || !activeUser.id) {
        setAccounts([]);
        return;
      }
      const res = await fetch(`/api/accounts?userId=${encodeURIComponent(activeUser.id)}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(Array.isArray(data) ? data : []);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
      setAccounts([]);
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
    const wsHost =
      window.location.host.includes('localhost') || window.location.host.includes('127.0.0.1')
        ? window.location.host
        : 'traderrank.onrender.com';
    const wsUrl = `${protocol}//${wsHost}/ws`;
    const socket = new WebSocket(wsUrl);

    // 1-minute (60s) reload cadence for competitive leaderboard & Top 3 rankings
    const LEADERBOARD_INTERVAL_MS = 60000;
    let lastLbUpdateTime = 0;
    let pendingLeaderboard: any = null;
    let lbThrottleTimer: any = null;

    const applyThrottledLeaderboard = (data: any) => {
      const now = Date.now();
      if (lastLbUpdateTime === 0 || now - lastLbUpdateTime >= LEADERBOARD_INTERVAL_MS) {
        lastLbUpdateTime = now;
        setLeaderboard(data);
      } else {
        pendingLeaderboard = data;
        if (!lbThrottleTimer) {
          lbThrottleTimer = setTimeout(() => {
            if (pendingLeaderboard) {
              setLeaderboard(pendingLeaderboard);
              pendingLeaderboard = null;
            }
            lastLbUpdateTime = Date.now();
            lbThrottleTimer = null;
          }, LEADERBOARD_INTERVAL_MS - (now - lastLbUpdateTime));
        }
      }
    };

    let lastDailyUpdateTime = 0;
    let pendingDaily: any = null;
    let dailyThrottleTimer: any = null;

    const applyThrottledDaily = (data: any) => {
      const now = Date.now();
      if (lastDailyUpdateTime === 0 || now - lastDailyUpdateTime >= LEADERBOARD_INTERVAL_MS) {
        lastDailyUpdateTime = now;
        setDailyResult(data);
      } else {
        pendingDaily = data;
        if (!dailyThrottleTimer) {
          dailyThrottleTimer = setTimeout(() => {
            if (pendingDaily) {
              setDailyResult(pendingDaily);
              pendingDaily = null;
            }
            lastDailyUpdateTime = Date.now();
            dailyThrottleTimer = null;
          }, LEADERBOARD_INTERVAL_MS - (now - lastDailyUpdateTime));
        }
      }
    };

    socket.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'LEADERBOARD_UPDATE') {
          applyThrottledLeaderboard(msg.data);
        } else if (msg.type === 'DAILY_LEADERBOARD_UPDATE') {
          applyThrottledDaily(msg.data);
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

    const leaderboardTimer = setInterval(() => {
      fetchLeaderboard();
    }, LEADERBOARD_INTERVAL_MS);

    const marketTimer = setInterval(() => {
      fetchMarketQuotes();
    }, 10000);

    return () => {
      socket.close();
      clearInterval(leaderboardTimer);
      clearInterval(marketTimer);
      if (lbThrottleTimer) clearTimeout(lbThrottleTimer);
      if (dailyThrottleTimer) clearTimeout(dailyThrottleTimer);
    };
  }, []);

  // Multi-tenant isolated accounts sync on user profile change
  useEffect(() => {
    fetchAccounts(user);
  }, [user?.id]);

  const handleDisconnect = async (accountId: string) => {
    try {
      const uidQuery = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
      const res = await fetch(`/api/accounts/${accountId}${uidQuery}`, { method: 'DELETE' });
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

  const handleSelectTrader = (t: { userId?: string; username: string; broker?: Broker; rank?: number; score?: number; winRate?: number; tradesCount?: number }) => {
    const safeBroker: Broker = t.broker || 'Exness';
    const matchedLb = leaderboard.find(
      e => (t.userId && e.userId === t.userId) || e.username.toLowerCase() === t.username.toLowerCase()
    );
    const matchedAcc = accounts.find(
      a =>
        (t.userId && (a.id === t.userId || a.userId === t.userId)) ||
        (a.accountNumber && t.username.includes(a.accountNumber))
    );
    const resolvedId = t.userId || matchedAcc?.id || matchedLb?.userId || `u_${t.username.toLowerCase()}`;

    setSelectedTrader({
      userId: resolvedId,
      username: t.username,
      broker: safeBroker,
      avatarSymbol: matchedLb?.avatarSymbol || 'GOLD#',
      tier: 'Market Veteran',
      level: matchedLb?.level || 14,
      xp: matchedLb?.xp || 13275,
      rank: t.rank || matchedLb?.rank || 1,
      netPips: t.score ?? matchedLb?.totalPips ?? -2500.4,
      winRate: t.winRate ?? matchedLb?.winRate ?? 55,
      profitFactor: 0.9,
      maxDrawdown: 0,
      totalTrades: t.tradesCount ?? matchedLb?.tradesCount ?? 531,
      bestTradePips: 1933.0,
      avgHoldingTime: '1h 12m',
      verifiedSince: 'May 2026',
      isFollowing: false,
    });
  };

  const handleOpenMyDashboard = () => {
    if (user) {
      const primaryAcc = accounts[0];
      handleSelectTrader({
        userId: primaryAcc?.id || primaryAcc?.userId || user.id,
        username: user.username,
        broker: primaryAcc?.broker || user.primaryBroker || 'Exness',
        rank: 1,
      });
    } else if (accounts.length > 0) {
      const primaryAcc = accounts[0];
      handleSelectTrader({
        userId: primaryAcc.userId || primaryAcc.id,
        username: `TraderRank-${primaryAcc.accountNumber || 'Pro'}`,
        broker: primaryAcc.broker || 'Exness',
        rank: 1,
      });
    } else {
      openAuthModal('signin');
    }
  };

  // URL Deep-Linking: Synchronize ?trader= parameter with selected trader modal
  useEffect(() => {
    if (selectedTrader) {
      const targetQuery = `?trader=${encodeURIComponent(selectedTrader.username)}`;
      if (window.location.search !== targetQuery) {
        window.history.replaceState({}, '', `${window.location.pathname}${targetQuery}`);
      }
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('trader')) {
        urlParams.delete('trader');
        const remaining = urlParams.toString();
        window.history.replaceState({}, '', remaining ? `${window.location.pathname}?${remaining}` : window.location.pathname);
      }
    }
  }, [selectedTrader]);

  // URL Deep-Linking: Check on mount and when leaderboard changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const traderQuery = urlParams.get('trader');
    if (traderQuery && !selectedTrader && leaderboard.length > 0) {
      const match = leaderboard.find(
        entry =>
          entry.username.toLowerCase() === traderQuery.toLowerCase() ||
          entry.userId.toLowerCase() === traderQuery.toLowerCase()
      );
      if (match) {
        handleSelectTrader(match);
      }
    }
  }, [leaderboard]);

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          leaderboard={leaderboard}
          onSelectTrader={handleSelectTrader}
          onOpenMyDashboard={handleOpenMyDashboard}
          onEnterApp={(tab?: string) => {
            if (tab === 'leaderboard') tab = 'ranking';
            if (tab) {
              setActiveTab(tab as any);
            }
            setCurrentView('app');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenConnectWizard={() => {
            if (!isAuthenticated) {
              openAuthModal('register');
              return;
            }
            setCurrentView('app');
            setIsWizardOpen(true);
          }}
          onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
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
        <AuthModal />
        <ProfileEditModal />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header Banner */}
      <header className="header-banner">
        <div
          className="brand-wrapper"
          onClick={() => {
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{ cursor: 'pointer' }}
          title="Return to Home"
        >
          <BrandLogo
            size={38}
            showWordmark={false}
            onClick={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 className="brand-wordmark" style={{ fontSize: '20px', cursor: 'pointer', letterSpacing: '-0.3px' }}>
                Trade<span className="brand-wordmark-accent">Rank</span>
                <span className="brand-live-domain">.live</span>
              </h1>
              <span className="brand-badge" style={{ fontSize: '10px', padding: '2px 7px' }}>
                {t.landing.badge}
              </span>
              {metaApiHealth && (
                <span
                  className="status-pill hide-on-mobile"
                  style={{
                    background: metaApiHealth.ok ? 'rgba(10, 186, 181, 0.15)' : 'rgba(246, 70, 93, 0.15)',
                    color: metaApiHealth.ok ? '#0abab5' : 'var(--accent-red)',
                    border: `1px solid ${metaApiHealth.ok ? 'rgba(10, 186, 181, 0.35)' : 'rgba(246, 70, 93, 0.35)'}`,
                    fontSize: '10px',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    cursor: 'default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700,
                  }}
                  title={metaApiHealth.hasTokenConfigured ? 'MetaApi Enterprise Cloud Token Active' : 'MetaApi Sandbox Mode'}
                >
                  <Zap size={11} color="#0abab5" />
                  {metaApiHealth.ok ? `${metaApiHealth.latencyMs}ms` : 'Offline'}
                </span>
              )}
              {r2Status && (
                <span
                  className="status-pill hide-on-tablet"
                  style={{
                    background: 'rgba(244, 129, 32, 0.15)',
                    color: '#f48120',
                    border: '1px solid rgba(244, 129, 32, 0.35)',
                    fontSize: '10px',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    cursor: 'default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700,
                  }}
                  title={`Cloudflare R2 Bucket: ${r2Status.bucket} (${r2Status.storage})`}
                >
                  <Cloud size={11} color="#f48120" />
                  R2 Cloud
                </span>
              )}
            </div>
            <p className="hide-on-tablet" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '380px' }}>
              {t.app.heroSubheading}
            </p>
          </div>
        </div>

        <div className="header-actions">
          {/* Language Selector Dropdown */}
          <LanguageSelector />

          {/* User Profile & Navigation Menu */}
          <UserNavMenu
            onOpenConnectWizard={() => setIsWizardOpen(true)}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
            onOpenAffiliateModal={() => setIsAffiliateModalOpen(true)}
            onOpenMyDashboard={handleOpenMyDashboard}
          />

          {/* Primary CTA: Connect Broker Account */}
          <button
            className="btn-primary"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('register');
                return;
              }
              setIsWizardOpen(true);
            }}
            title="Connect MetaTrader 4/5 or Exness broker account"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={13} />
            <span>Connect Broker</span>
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
            style={{ minWidth: '142px', justifyContent: 'center' }}
          >
            <RefreshCw size={13} className={isRefreshingMarket ? 'animate-spin' : ''} style={{ animation: isRefreshingMarket ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshingMarket ? t.app.syncing : t.nav.refreshRates}
          </button>
        </div>
      </div>

      {/* Streamlined Feature Menu Links with Custom Emblems */}
      <nav
        aria-label="Arena Features Menu"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
          gap: '10px',
          marginBottom: '24px',
        }}
      >
        {(
          [
            {
              id: 'overview',
              symbol: 'overview' as FeatureSymbolType,
              label: t.nav.overview,
              sub: 'Live Hub & Feed',
              accent: '#00F0FF',
              onClick: () => setActiveTab('overview'),
              isActive: activeTab === 'overview',
            },
            {
              id: 'ranking',
              symbol: 'ranking' as FeatureSymbolType,
              label: t.nav.rankings,
              sub: 'Verified Rankings',
              accent: '#F0B90B',
              onClick: () => setActiveTab('ranking'),
              isActive: activeTab === 'ranking',
            },
            {
              id: 'tournaments',
              symbol: 'tournaments' as FeatureSymbolType,
              label: t.nav.tournaments,
              sub: 'Prize Battles',
              accent: '#00DAC6',
              onClick: () => setActiveTab('tournaments'),
              isActive: activeTab === 'tournaments',
            },
            {
              id: 'daily-analysis',
              symbol: 'daily-analysis' as FeatureSymbolType,
              label: t.nav.dailyIntel,
              sub: subscription.isActive ? 'VIP PRO Active' : 'SMC & Signals',
              accent: '#A78BFA',
              onClick: () => setActiveTab('daily-analysis'),
              isActive: activeTab === 'daily-analysis',
            },
            {
              id: 'rewards',
              symbol: 'rewards' as FeatureSymbolType,
              label: t.nav.rewards,
              sub: 'XP & Badges',
              accent: '#F6465D',
              onClick: () => setActiveTab('rewards'),
              isActive: activeTab === 'rewards',
            },
            {
              id: 'dashboard',
              symbol: 'dashboard' as FeatureSymbolType,
              label: t.nav.myDashboard,
              sub: 'My Live Orders',
              accent: '#00F0FF',
              onClick: handleOpenMyDashboard,
              isActive: false,
            },
          ] as const
        ).map(item => (
          <button
            key={item.id}
            onClick={item.onClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '14px',
              background: item.isActive
                ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.14) 0%, rgba(14, 20, 31, 0.95) 100%)'
                : 'rgba(14, 20, 31, 0.78)',
              border: item.isActive
                ? `1px solid ${item.accent}`
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: item.isActive
                ? `0 8px 24px -6px ${item.accent}40`
                : '0 4px 14px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              if (!item.isActive) {
                e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.35)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              if (!item.isActive) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }
            }}
          >
            <FeatureSymbol type={item.symbol} active={item.isActive} size={38} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: item.isActive ? '#FFFFFF' : '#F1F5F9',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: item.isActive ? item.accent : 'var(--text-muted)',
                  marginTop: '3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.sub}
              </div>
            </div>
            {item.isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '14px',
                  right: '14px',
                  height: '2px',
                  borderRadius: '2px',
                  background: item.accent,
                  boxShadow: `0 0 8px ${item.accent}`,
                }}
              />
            )}
          </button>
        ))}
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
          onOpenAffiliateModal={() => setIsAffiliateModalOpen(true)}
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
          <RewardsBadges onOpenAffiliateModal={() => setIsAffiliateModalOpen(true)} />
        </div>
      )}

      {/* Tab 5: Community Live Feed & Cheers */}
      {activeTab === 'community' && (
        <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
          <CommunityFeed
            onOpenConnectWizard={() => setIsWizardOpen(true)}
            onSelectTrader={handleSelectTrader}
          />
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

      {/* Pro Membership & Capabilities Modal */}
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

      {/* Community Gamification Affiliate Program Modal */}
      <AffiliateModal
        isOpen={isAffiliateModalOpen}
        onClose={() => setIsAffiliateModalOpen(false)}
      />

      {/* User Authentication & Profile Edit Modals */}
      <AuthModal />
      <ProfileEditModal />

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
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => {
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Return to Home"
        >
          <BrandMark size={20} variant="glyph" />
          <span>
            <strong style={{ color: '#fff' }}>TradeRank.live</strong> • {t.landing.badge}
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
