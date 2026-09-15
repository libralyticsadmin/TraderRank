import React, { useState, useEffect } from 'react';
import {
  TradingAccount,
  CanonicalPosition,
  LeaderboardEntry,
  DailyLeaderboardResult,
  Broker,
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
import {
  TrendingUp,
  Plus,
  Shield,
  Layers,
  BarChart3,
  Radio,
  RefreshCw,
  Globe2,
  Trophy,
  Swords,
  Award,
  Users,
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
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ranking' | 'tournaments' | 'rewards' | 'community' | 'positions' | 'security'
  >('overview');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [positions, setPositions] = useState<CanonicalPosition[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyResult, setDailyResult] = useState<DailyLeaderboardResult | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [isRefreshingMarket, setIsRefreshingMarket] = useState(false);

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

    // Setup live WebSocket stream
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setWsConnected(true);
    };

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

    socket.onclose = () => {
      setWsConnected(false);
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
          onEnterApp={() => setCurrentView('app')}
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
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header Banner */}
      <header className="header-banner">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <TrendingUp size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="brand-title">TraderRank</h1>
              <span className="brand-badge">Trade Island Arena</span>
              <span
                className="status-pill"
                style={{
                  background: wsConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: wsConnected ? 'var(--accent-green)' : 'var(--accent-red)',
                  border: `1px solid ${wsConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                  fontSize: '11px',
                }}
              >
                <Radio size={12} className={wsConnected ? 'animate-pulse' : ''} />
                {wsConnected ? 'Live WS Connected' : 'Connecting WS...'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Multi-broker verified competitive esports arena for Forex, Commodities &amp; Crypto
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setCurrentView('landing')}
            title="Return to Marketing Landing Page"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Globe2 size={16} /> Landing Portal
          </button>
          <button className="btn-secondary" onClick={() => setIsWizardOpen(true)}>
            <Layers size={16} /> Fast Connect
          </button>
          <button className="btn-primary" onClick={() => setIsWizardOpen(true)}>
            <Plus size={16} /> Connect Trading Account
          </button>
        </div>
      </header>

      {/* Live Market API Ticker Strip */}
      <div className="market-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe2 size={16} color="var(--accent-cyan)" />
          <span
            className="status-pill"
            style={{
              background: marketStatus?.feedStatus === 'LIVE_NETWORK' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
              color: marketStatus?.feedStatus === 'LIVE_NETWORK' ? 'var(--accent-green)' : 'var(--accent-cyan)',
              border: `1px solid ${marketStatus?.feedStatus === 'LIVE_NETWORK' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
              fontSize: '11px',
              padding: '3px 8px',
            }}
          >
            {marketStatus?.feedStatus === 'LIVE_NETWORK' ? '● Real API Rates Live' : '● Live Market Engine'}
          </span>
        </div>

        <div className="market-pills-container">
          {marketStatus?.quotes && Object.entries(marketStatus.quotes).map(([sym, q]) => (
            <div key={sym} className="market-pill">
              <strong>{sym}</strong>
              <span className="bid-ask">
                {q.bid.toLocaleString(undefined, { minimumFractionDigits: sym === 'USDJPY' ? 3 : sym === 'BTCUSD' ? 2 : 5 })} / {q.ask.toLocaleString(undefined, { minimumFractionDigits: sym === 'USDJPY' ? 3 : sym === 'BTCUSD' ? 2 : 5 })}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                {q.source === 'LIVE_API' ? '🌐 Live' : '⚡ Sim'}
              </span>
            </div>
          ))}
        </div>

        <button
          className="market-refresh-btn"
          onClick={handleRefreshMarketRates}
          disabled={isRefreshingMarket}
          title="Force refresh live rates from public APIs"
        >
          <RefreshCw size={13} className={isRefreshingMarket ? 'animate-spin' : ''} style={{ animation: isRefreshingMarket ? 'spin 1s linear infinite' : 'none' }} />
          {isRefreshingMarket ? 'Syncing...' : 'Sync Rates'}
        </button>
      </div>

      {/* Modern Multi-Tab Navigation (Trade Island Feature Suite) */}
      <nav className="tabs-nav">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} /> Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'ranking' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranking')}
        >
          <Trophy size={16} /> Rankings
        </button>
        <button
          className={`tab-button ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          <Swords size={16} /> Tournaments &amp; Battles
        </button>
        <button
          className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          <Award size={16} /> Rewards &amp; Badges
        </button>
        <button
          className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          <Users size={16} /> Community Feed
        </button>
        <button
          className={`tab-button ${activeTab === 'positions' ? 'active' : ''}`}
          onClick={() => setActiveTab('positions')}
        >
          <Radio size={16} /> Positions ({positions.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={16} /> Security Vault
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
          <div className="grid-main">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <AccountsList
                accounts={accounts}
                onDisconnect={handleDisconnect}
                onOpenWizard={() => setIsWizardOpen(true)}
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

      {/* Tab 2: Trade Island Ranking */}
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
          <TournamentArena />
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
          <CommunityFeed />
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
    </div>
  );
};

export default App;
