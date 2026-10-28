import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Zap, Radio, Target, Flame } from 'lucide-react';
import { TraderAvatar } from './TraderAvatar.tsx';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { Broker } from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';

export interface FeedEvent {
  id: string;
  type: 'TRADE_WIN' | 'BADGE_UNLOCKED' | 'TOURNAMENT_JOIN' | 'RANK_PROMOTION';
  userId: string;
  username: string;
  broker: Broker;
  avatarSymbol: string;
  timestamp: string;
  details: {
    symbol?: string;
    pips?: number;
    profit?: number;
    badgeName?: string;
    badgeIcon?: string;
    tournamentName?: string;
    newRank?: number;
  };
  cheersCount: number;
  hasCheered?: boolean;
}

export const CommunityFeed: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'ALL' | 'WINS' | 'BADGES' | 'TOURNAMENTS'>('ALL');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [events, setEvents] = useState<FeedEvent[]>([
    {
      id: 'feed_1',
      type: 'TRADE_WIN',
      userId: 'u_fx_sniper',
      username: 'FX_Sniper',
      broker: 'Exness',
      avatarSymbol: 'EURUSD',
      timestamp: 'Just now',
      details: {
        symbol: 'EURUSD',
        pips: 38.4,
        profit: 384.0,
      },
      cheersCount: 24,
      hasCheered: false,
    },
    {
      id: 'feed_2',
      type: 'BADGE_UNLOCKED',
      userId: 'u_gold_bug',
      username: 'GoldBug_JP',
      broker: 'XM',
      avatarSymbol: 'XAUUSD',
      timestamp: '3m ago',
      details: {
        badgeName: 'Risk Guardian',
      },
      cheersCount: 42,
      hasCheered: true,
    },
    {
      id: 'feed_3',
      type: 'RANK_PROMOTION',
      userId: 'u_alpha_wave',
      username: 'AlphaWave',
      broker: 'Axiory',
      avatarSymbol: 'USDJPY',
      timestamp: '12m ago',
      details: {
        newRank: 2,
      },
      cheersCount: 19,
      hasCheered: false,
    },
    {
      id: 'feed_4',
      type: 'TRADE_WIN',
      userId: 'u_zen_scalp',
      username: 'ZenScalper',
      broker: 'Vantage',
      avatarSymbol: 'GBPUSD',
      timestamp: '25m ago',
      details: {
        symbol: 'GBPUSD',
        pips: 24.1,
        profit: 241.0,
      },
      cheersCount: 15,
      hasCheered: false,
    },
    {
      id: 'feed_5',
      type: 'TOURNAMENT_JOIN',
      userId: 'u_tokyo_rider',
      username: 'TokyoRider',
      broker: 'XM',
      avatarSymbol: 'USDJPY',
      timestamp: '40m ago',
      details: {
        tournamentName: 'Weekly FX Blitz League',
      },
      cheersCount: 8,
      hasCheered: false,
    },
  ]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'COMMUNITY_EVENT' && msg.data) {
              setEvents(prev => [msg.data, ...prev.filter(e => e.id !== msg.data.id)].slice(0, 30));
            }
          } catch {
            // ignore non-json
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        setWsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  const handleCheer = (eventId: string) => {
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id === eventId) {
          const nextCheered = !ev.hasCheered;
          return {
            ...ev,
            hasCheered: nextCheered,
            cheersCount: nextCheered ? ev.cheersCount + 1 : ev.cheersCount - 1,
          };
        }
        return ev;
      })
    );
  };

  const filteredEvents = events.filter(ev => {
    if (filter === 'WINS') return ev.type === 'TRADE_WIN';
    if (filter === 'BADGES') return ev.type === 'BADGE_UNLOCKED' || ev.type === 'RANK_PROMOTION';
    if (filter === 'TOURNAMENTS') return ev.type === 'TOURNAMENT_JOIN';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Community Challenge Progress Banner */}
      <div
        className="card-panel"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '24px',
          borderRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Target size={18} color="#fbbf24" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.05em' }}>
                {t.community.coopChallengeTitle}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{t.community.challengeTitle}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {t.community.challengeDesc}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.community.collectiveHarvest}</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#fbbf24' }}>
              3,640 <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 5,000 Pips</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span>72.8% {t.community.completed}</span>
            <span>{t.community.endsInDays}</span>
          </div>
          <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <div
              style={{
                width: '72.8%',
                height: '100%',
                background: 'linear-gradient(90deg, #fbbf24, #0abab5)',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Live Activity Timeline */}
      <div className="card-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(10, 186, 181, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Radio size={18} color="var(--accent-green)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{t.community.liveBulletinTitle}</h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: wsConnected ? '#10b981' : '#f59e0b',
                    background: wsConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    border: `1px solid ${wsConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: wsConnected ? '#10b981' : '#f59e0b' }} />
                  {wsConnected ? 'Live MetaApi Ledger' : 'Connecting...'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                {t.community.liveBulletinDesc}
              </p>
            </div>
          </div>

          {/* Activity Filters */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0, 0, 0, 0.4)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'ALL', label: t.community.filterAll },
              { id: 'WINS', label: t.community.filterWins },
              { id: 'BADGES', label: t.community.filterBadges },
              { id: 'TOURNAMENTS', label: t.community.filterTournaments },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: filter === f.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: filter === f.id ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Events List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredEvents.map(ev => (
            <div
              key={ev.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <TraderAvatar username={ev.username} symbol={ev.avatarSymbol} size={40} />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <strong style={{ fontSize: '15px' }}>{ev.username}</strong>
                    <BrokerSymbol broker={ev.broker} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {ev.timestamp}</span>
                  </div>

                  {ev.type === 'TRADE_WIN' && (
                    <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{t.community.closedTradeText}</span>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{ev.details.symbol}</strong>
                      <span>{t.community.withPips}</span>
                      <strong style={{ color: 'var(--accent-green)' }}>+{ev.details.pips} pips</strong>
                      <span style={{ color: 'var(--text-muted)' }}>(+${ev.details.profit})</span>
                    </div>
                  )}

                  {ev.type === 'BADGE_UNLOCKED' && (
                    <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={14} color="#fbbf24" />
                      <span>{t.community.unlockedBadgeText}</span>
                      <strong style={{ color: '#fbbf24' }}>{ev.details.badgeName}</strong>
                    </div>
                  )}

                  {ev.type === 'RANK_PROMOTION' && (
                    <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={14} color="var(--accent-green)" />
                      <span>{t.community.climbedRankText}</span>
                      <strong style={{ color: 'var(--accent-green)' }}>#{ev.details.newRank}</strong>
                    </div>
                  )}

                  {ev.type === 'TOURNAMENT_JOIN' && (
                    <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} color="var(--accent-cyan)" />
                      <span>{t.community.enlistedTournamentText}</span>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{ev.details.tournamentName}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Cheer / Applause Button */}
              <button
                onClick={() => handleCheer(ev.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: ev.hasCheered ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: ev.hasCheered ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: ev.hasCheered ? '#fbbf24' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  transition: 'all 0.2s',
                }}
              >
                <Flame size={14} color={ev.hasCheered ? '#fbbf24' : 'var(--text-muted)'} />
                <span>{t.community.cheerBtn}</span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>({ev.cheersCount})</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
