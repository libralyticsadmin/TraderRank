import React, { useState, useMemo, useEffect } from 'react';
import { LeaderboardEntry, DailyLeaderboardResult, Broker } from '../../../shared/src/types.ts';
import { calculateTraderGamification } from '../../../shared/src/gamification.ts';
import { TraderAvatar } from './TraderAvatar.tsx';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { resolveTraderIdentity } from './avatarCatalog.ts';
import { useTranslation } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Trophy,
  Award,
  Calendar,
  Flame,
  TrendingUp,
  Percent,
  Search,
  ExternalLink,
  Zap,
  Clock,
  Activity,
} from 'lucide-react';

interface LiveLeaderboardProps {
  entries: LeaderboardEntry[];
  dailyResult?: DailyLeaderboardResult | null;
  onSelectTrader?: (trader: { userId?: string; username: string; broker: Broker; rank: number; score: number; winRate?: number; tradesCount?: number }) => void;
}

export type RankingMetric = 'pips' | 'profit' | 'rate';
export type RankingPeriod = 'daily' | 'weekly' | 'all_time';

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  entries,
  dailyResult,
  onSelectTrader,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [metric, setMetric] = useState<RankingMetric>('pips');
  const [period, setPeriod] = useState<RankingPeriod>('all_time');
  const [brokerFilter, setBrokerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [ledgerStatsByUser, setLedgerStatsByUser] = useState<
    Record<
      string,
      {
        netPips: number;
        winningPips: number;
        netProfitUsd: number;
        grossProfitUsd: number;
        tradesCount: number;
        winRate: number;
        xp: number;
        roiPct: number;
        dailyNetPips: number;
        dailyProfitUsd: number;
        dailyTradesCount: number;
        dailyWinRate: number;
        currency?: string;
        accountNumber?: string;
        accountHolderName?: string;
        liveOrders: Array<{
          id: string;
          ticket: string;
          symbol: string;
          type: 'BUY' | 'SELL';
          lotSize: number;
          openPrice: number;
          currentPrice: number;
          profitPips: number;
          profitCurrency: number;
          isLivePosition: boolean;
          timeLabel: string;
        }>;
      }
    >
  >({});

  // Fetch 100% real closed trade ledger & real-time open orders from MetaApi accounts
  useEffect(() => {
    let isMounted = true;
    const loadLedger = async () => {
      try {
        const accRes = await fetch('/api/accounts?scope=public');
        if (!accRes.ok) return;
        const accounts = await accRes.json();
        if (!Array.isArray(accounts) || accounts.length === 0) return;

        const todayStr = new Date().toISOString().slice(0, 10);
        const map: typeof ledgerStatsByUser = {};

        for (const acc of accounts) {
          const [trRes, posRes] = await Promise.all([
            fetch(`/api/accounts/${acc.id}/trades`).catch(() => null),
            fetch(`/api/accounts/${acc.id}/positions`).catch(() => null),
          ]);
          const rawTrades = trRes && trRes.ok ? await trRes.json() : [];
          const rawPositions = posRes && posRes.ok ? await posRes.json() : [];

          const valid = Array.isArray(rawTrades)
            ? rawTrades.filter((d: any) => {
                const sym = String(d.symbol || '').toUpperCase();
                return sym && sym !== 'UNKNOWN' && sym !== 'BALANCE' && Number(d.lotSize ?? d.volume ?? 0) > 0;
              })
            : [];

          let netPips = 0;
          let winningPips = 0;
          let netProfitUsd = 0;
          let grossProfitUsd = 0;
          let wins = 0;
          let dailyNetPips = 0;
          let dailyProfitUsd = 0;
          let dailyTradesCount = 0;
          let dailyWins = 0;

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

            if (String(tr.closeTime || '').startsWith(todayStr)) {
              dailyTradesCount++;
              dailyNetPips += pips;
              dailyProfitUsd += usd;
              if (isWin) dailyWins++;
            }
          }

          // Build live open positions or latest real orders for the Top 3 card
          const openOrders = Array.isArray(rawPositions)
            ? rawPositions.slice(0, 2).map((pos: any) => ({
                id: String(pos.id || pos.ticket || Math.random()),
                ticket: String(pos.ticket || pos.id || '').slice(-6),
                symbol: String(pos.symbol || 'XAUUSD'),
                type: (String(pos.type || 'BUY').toUpperCase().includes('SELL') ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
                lotSize: Number(pos.lotSize ?? pos.volume ?? 0.01),
                openPrice: Number(pos.openPrice || 0),
                currentPrice: Number(pos.currentPrice || pos.openPrice || 0),
                profitPips: Number((pos.profitPips ?? 0).toFixed(1)),
                profitCurrency: Number((pos.profitCurrency ?? pos.profit ?? 0).toFixed(2)),
                isLivePosition: true,
                timeLabel: 'LIVE OPEN',
              }))
            : [];

          const recentClosedOrders =
            openOrders.length === 0 && valid.length > 0
              ? [...valid]
                  .sort((a: any, b: any) => new Date(b.closeTime || 0).getTime() - new Date(a.closeTime || 0).getTime())
                  .slice(0, 2)
                  .map((tr: any) => ({
                    id: String(tr.id || tr.ticket || Math.random()),
                    ticket: String(tr.ticket || tr.id || '').slice(-6),
                    symbol: String(tr.symbol || 'XAUUSD'),
                    type: (String(tr.type || 'BUY').toUpperCase().includes('SELL') ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
                    lotSize: Number(tr.lotSize ?? tr.volume ?? 0.01),
                    openPrice: Number(tr.openPrice || 0),
                    currentPrice: Number(tr.closePrice || tr.openPrice || 0),
                    profitPips: Number((tr.pnlPips ?? tr.profitPips ?? 0).toFixed(1)),
                    profitCurrency: Number((tr.pnlCurrency ?? tr.profitCurrency ?? tr.profit ?? 0).toFixed(2)),
                    isLivePosition: false,
                    timeLabel: tr.closeTime
                      ? new Date(tr.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'FILLED',
                  }))
              : [];

          const currentBal = Number(acc.equity ?? acc.balance ?? 2.8);
          const impliedStartCap = Math.max(100, currentBal - netProfitUsd);
          const roiPct = Number(((netProfitUsd / impliedStartCap) * 100).toFixed(1));
          const statsObj = {
            netPips: Number(netPips.toFixed(1)),
            winningPips: Number(winningPips.toFixed(1)),
            netProfitUsd: Number(netProfitUsd.toFixed(2)),
            grossProfitUsd: Number(grossProfitUsd.toFixed(2)),
            tradesCount: valid.length,
            winRate: valid.length > 0 ? Math.round((wins / valid.length) * 100) : 0,
            xp: valid.length * 25,
            roiPct,
            dailyNetPips: Number(dailyNetPips.toFixed(1)),
            dailyProfitUsd: Number(dailyProfitUsd.toFixed(2)),
            dailyTradesCount,
            dailyWinRate: dailyTradesCount > 0 ? Math.round((dailyWins / dailyTradesCount) * 100) : 0,
            currency: acc.currency,
            accountNumber: acc.accountNumber,
            accountHolderName: acc.profileUsername,
            liveOrders: openOrders.length > 0 ? openOrders : recentClosedOrders,
          };

          if (acc.accountNumber) {
            const cleanNum = String(acc.accountNumber).replace(/^TraderRank-/i, '').trim();
            map[cleanNum] = statsObj;
            map[`TraderRank-${cleanNum}`] = statsObj;
          }
          if (acc.id) map[acc.id] = statsObj;
          if (acc.userId && acc.userId !== 'usr_live_meta') map[acc.userId] = statsObj;
          if (acc.profileUsername) map[acc.profileUsername] = statsObj;
        }

        if (isMounted) {
          setLedgerStatsByUser(prev => ({ ...prev, ...map }));
        }
      } catch {
        // ignore
      }
    };

    // Fast non-jank live positions poller (every 6 seconds) so Top 3 real-time orders update smoothly in place
    const pollTop3LivePositions = async () => {
      try {
        const accRes = await fetch('/api/accounts?scope=public');
        if (!accRes.ok) return;
        const accounts = await accRes.json();
        if (!Array.isArray(accounts) || accounts.length === 0) return;

        const updates: Record<string, any[]> = {};
        await Promise.all(
          accounts.map(async (acc: any) => {
            try {
              const posRes = await fetch(`/api/accounts/${acc.id}/positions`);
              if (!posRes.ok) return;
              const rawPositions = await posRes.json();
              if (!Array.isArray(rawPositions) || rawPositions.length === 0) return;
              const openOrders = rawPositions.slice(0, 2).map((pos: any) => ({
                id: String(pos.id || pos.ticket || Math.random()),
                ticket: String(pos.ticket || pos.id || '').slice(-6),
                symbol: String(pos.symbol || 'XAUUSD'),
                type: (String(pos.type || 'BUY').toUpperCase().includes('SELL') ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
                lotSize: Number(pos.lotSize ?? pos.volume ?? 0.01),
                openPrice: Number(pos.openPrice || 0),
                currentPrice: Number(pos.currentPrice || pos.openPrice || 0),
                profitPips: Number((pos.profitPips ?? 0).toFixed(1)),
                profitCurrency: Number((pos.profitCurrency ?? pos.profit ?? 0).toFixed(2)),
                isLivePosition: true,
                timeLabel: 'LIVE OPEN',
              }));
              if (acc.userId) updates[acc.userId] = openOrders;
              if (acc.id) updates[acc.id] = openOrders;
              if (acc.accountNumber) updates[`TraderRank-${acc.accountNumber}`] = openOrders;
            } catch {
              // ignore
            }
          })
        );

        if (isMounted && Object.keys(updates).length > 0) {
          setLedgerStatsByUser(prev => {
            const next = { ...prev };
            for (const [k, orders] of Object.entries(updates)) {
              if (next[k]) {
                next[k] = { ...next[k], liveOrders: orders };
              }
            }
            return next;
          });
        }
      } catch {
        // ignore
      }
    };

    loadLedger();
    const ledgerInterval = setInterval(loadLedger, 60000); // 1-minute full ledger sync
    const posInterval = setInterval(pollTop3LivePositions, 6000); // 6-second smooth position update
    return () => {
      isMounted = false;
      clearInterval(ledgerInterval);
      clearInterval(posInterval);
    };
  }, [entries.length]);

  // Daily standings from server
  const dailyStandings = dailyResult?.standings || [];

  // Build leaderboard items strictly from real MetaApi data
  const processedEntries = useMemo(() => {
    const baseList =
      period === 'daily' && dailyStandings.length > 0
        ? dailyStandings.map(d => {
            const primaryBroker: Broker = d.brokers && d.brokers.length > 0 ? d.brokers[0] : 'XM';
            const cleanAcc = d.accountNumber
              ? String(d.accountNumber).replace(/^TraderRank-/i, '').trim()
              : (d.username.match(/(\d{6,})/)?.[1] || '');
            const real =
              (cleanAcc && (ledgerStatsByUser[cleanAcc] || ledgerStatsByUser[`TraderRank-${cleanAcc}`])) ||
              (d.userId && d.userId !== 'usr_live_meta' ? ledgerStatsByUser[d.userId] : undefined) ||
              ledgerStatsByUser[d.username];
            const pips = real ? real.dailyNetPips : d.dailyTotalPips || 0;
            const trades = real ? real.dailyTradesCount : d.dailyTradesCount || 0;
            const profitUsd = real ? real.dailyProfitUsd : 0;
            const winRate = real
              ? trades > 0
                ? real.dailyWinRate
                : real.winRate
              : d.dailyWinRate || 0;
            const identity = resolveTraderIdentity({
              username: d.username,
              profileName: d.profileName,
              accountHolderName: real?.accountHolderName,
              accountNumber: d.accountNumber || real?.accountNumber || cleanAcc,
              userId: d.userId,
              avatarUrl: d.avatarUrl,
            });

            return {
              userId: d.userId,
              username: d.username,
              profileName: identity.profileName,
              accountTag: identity.accountTag,
              avatarSeed: identity.avatarSeed,
              avatarUrl: identity.avatarUrl || d.avatarUrl,
              broker: primaryBroker,
              currency: real?.currency,
              avatarSymbol: d.avatarSymbol,
              winningPips: pips,
              profitAmount: profitUsd,
              profitRate: winRate,
              rank: d.rank,
              tradesCount: trades > 0 ? trades : real?.tradesCount ?? 0,
              winRate,
              xp: real?.xp ?? (trades * 25),
              tier: d.rank === 1 ? t.rewards.tierApexPredator : d.rank <= 3 ? t.rewards.tierMarketVeteran : t.rewards.tierProSwing,
              liveOrders: real?.liveOrders || [],
            };
          })
        : entries.map((e, idx) => {
            const primaryBroker: Broker = e.brokers && e.brokers.length > 0 ? e.brokers[0] : 'XM';
            const cleanAcc = e.accountNumber
              ? String(e.accountNumber).replace(/^TraderRank-/i, '').trim()
              : (e.username.match(/(\d{6,})/)?.[1] || '');
            const real =
              (cleanAcc && (ledgerStatsByUser[cleanAcc] || ledgerStatsByUser[`TraderRank-${cleanAcc}`])) ||
              (e.userId && e.userId !== 'usr_live_meta' ? ledgerStatsByUser[e.userId] : undefined) ||
              ledgerStatsByUser[e.username];
            const netPips = real ? real.netPips : e.totalPips || 0;
            const netProfitUsd = real
              ? real.netProfitUsd
              : typeof e.closedProfitUsd === 'number'
              ? e.closedProfitUsd
              : 0;
            const tradesCount = real ? real.tradesCount : e.tradesCount || 0;
            const winRate = real ? real.winRate : e.winRate || 0;
            const xp = real ? real.xp : tradesCount > 0 ? tradesCount * 25 : e.xp || 0;
            const profitRate = real ? real.roiPct : winRate;
            const gamification = calculateTraderGamification(xp);
            const identity = resolveTraderIdentity({
              username: e.username,
              profileName: e.profileName,
              accountHolderName: real?.accountHolderName,
              accountNumber: e.accountNumber || real?.accountNumber || cleanAcc,
              userId: e.userId,
              avatarUrl: e.avatarUrl,
            });

            return {
              userId: e.userId,
              username: e.username,
              profileName: identity.profileName,
              accountTag: identity.accountTag,
              avatarSeed: identity.avatarSeed,
              avatarUrl: identity.avatarUrl || e.avatarUrl,
              broker: primaryBroker,
              currency: real?.currency,
              avatarSymbol: e.avatarSymbol,
              winningPips: netPips,
              profitAmount: netProfitUsd,
              profitRate,
              rank: idx + 1,
              tradesCount,
              winRate,
              xp,
              tier: t.rewards[gamification.tierKey] || gamification.tierName,
              liveOrders: real?.liveOrders || [],
            };
          });

    // Filter by Broker
    let filtered = baseList;
    if (brokerFilter !== 'ALL') {
      filtered = filtered.filter(item => item.broker.toUpperCase() === brokerFilter.toUpperCase());
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.username.toLowerCase().includes(q) ||
          item.profileName.toLowerCase().includes(q) ||
          (item.accountTag && item.accountTag.toLowerCase().includes(q))
      );
    }

    // Sort by selected metric (active traders with trades > 0 always rank above 0-trade accounts)
    const sorted = [...filtered].sort((a, b) => {
      const aActive = a.tradesCount > 0 ? 1 : 0;
      const bActive = b.tradesCount > 0 ? 1 : 0;
      if (aActive !== bActive) {
        return bActive - aActive;
      }
      if (metric === 'profit') {
        return b.profitAmount - a.profitAmount;
      }
      if (metric === 'rate') {
        return b.profitRate - a.profitRate;
      }
      return b.winningPips - a.winningPips;
    });

    // Re-assign display ranks
    return sorted.map((item, index) => ({
      ...item,
      displayRank: index + 1,
    }));
  }, [entries, dailyStandings, period, metric, brokerFilter, searchQuery, ledgerStatsByUser, t, user?.username]);

  const top3 = processedEntries.slice(0, 3);

  const formatTraderProfit = (amount: number, broker?: Broker, currency?: string) => {
    const isJpy = broker === 'XMTrading' || (currency || '').toUpperCase() === 'JPY';
    const sym = isJpy ? '¥' : '$';
    const formattedVal = isJpy
      ? Math.round(Math.abs(amount)).toLocaleString('ja-JP')
      : Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return amount >= 0 ? `+${sym}${formattedVal}` : `-${sym}${formattedVal}`;
  };

  return (
    <div className="card-panel" style={{ padding: '24px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                  {t.leaderboard.title}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(10, 186, 181, 0.15)',
                    color: 'var(--accent-green)',
                    border: '1px solid rgba(10, 186, 181, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <Zap size={12} /> {t.leaderboard.liveVerified}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  title="Rankings and Top 3 podium reload every 1 minute"
                >
                  <Clock size={12} /> {t.leaderboard.reload1m}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)', wordBreak: 'keep-all', lineBreak: 'strict' }}>
                {t.leaderboard.subtitle}
              </p>
            </div>
          </div>

          {/* Period Selector Tabs (Daily / Weekly / All-Time) */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '10px',
              padding: '4px',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'nowrap',
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'daily', label: t.leaderboard.dailySprint, icon: Calendar },
              { id: 'weekly', label: t.leaderboard.weeklyLeague, icon: Trophy },
              { id: 'all_time', label: t.leaderboard.allTimeLegends, icon: Flame },
            ].map(tab => {
              const Icon = tab.icon;
              const active = period === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id as RankingPeriod)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg, #0abab5, #078c88)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter Bar: Metric Mode & Broker Selector */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Metric Sort Buttons (Winning Pips / Profit / Rate) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {t.leaderboard.rankingMetric}
            </span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { id: 'pips', label: t.leaderboard.winningPips, icon: TrendingUp },
                { id: 'profit', label: t.leaderboard.profitAmount, icon: Trophy },
                { id: 'rate', label: t.leaderboard.profitRate, icon: Percent },
              ].map(m => {
                const Icon = m.icon;
                const active = metric === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMetric(m.id as RankingMetric)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: active ? '1px solid rgba(129, 216, 208, 0.5)' : '1px solid transparent',
                      background: active ? 'rgba(129, 216, 208, 0.15)' : 'transparent',
                      color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={13} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Broker Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t.leaderboard.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px 6px 30px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#fff',
                  fontSize: '12px',
                  width: '160px',
                  outline: 'none',
                }}
              />
            </div>

            <select
              value={brokerFilter}
              onChange={e => setBrokerFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.4)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">{t.leaderboard.allBrokers}</option>
              <option value="Exness">Exness</option>
              <option value="XM">XM Global</option>
              <option value="XMTrading">XMTrading (Japan JPY)</option>
              <option value="Axiory">Axiory</option>
              <option value="Vantage">Vantage</option>
              <option value="Vanguard">Vanguard</option>
              <option value="IC_MARKETS">IC Markets</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Showcase */}
      {top3.length > 0 && !searchQuery && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={15} /> {t.leaderboard.top3Podium}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} /> {t.leaderboard.reload1m}
            </span>
          </div>
          <div className="leaderboard-podium-grid">
            {top3.map(trader => {
            const is1 = trader.displayRank === 1;
            const is2 = trader.displayRank === 2;
            const glowColor = is1 ? '#fbbf24' : is2 ? '#94a3b8' : '#d97706';
            const badgeTitle = is1 ? t.leaderboard.goldChampion : is2 ? t.leaderboard.silverContender : t.leaderboard.bronzeMaster;

            return (
              <div
                key={trader.userId}
                onClick={() => onSelectTrader?.({ userId: trader.userId, username: trader.username, broker: trader.broker, rank: trader.displayRank, score: trader.winningPips, winRate: trader.winRate, tradesCount: trader.tradesCount })}
                style={{
                  background: `linear-gradient(180deg, ${glowColor}15 0%, rgba(15, 23, 42, 0.9) 100%)`,
                  border: `1px solid ${glowColor}40`,
                  borderRadius: '16px',
                  padding: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: is1 ? `0 10px 25px -5px ${glowColor}25` : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: `${glowColor}25`,
                      color: glowColor,
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    <Award size={16} />
                    #{trader.displayRank} {badgeTitle}
                  </div>
                  <BrokerSymbol broker={trader.broker} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <TraderAvatar
                    username={trader.profileName || trader.username}
                    symbol={trader.avatarSymbol}
                    avatarUrl={trader.avatarUrl}
                    size={50}
                  />
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {trader.profileName}
                    </h4>
                    {trader.accountTag && (
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          color: 'var(--accent-cyan)',
                          fontFamily: 'var(--font-mono)',
                          marginTop: '2px',
                          letterSpacing: '0.2px',
                        }}
                      >
                        {trader.accountTag}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {trader.tier} • {trader.tradesCount} {t.leaderboard.trades}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.leaderboard.netPips}</div>
                    <div className="tabular" style={{ fontSize: '16px', fontWeight: 800, color: trader.winningPips >= 0 ? 'var(--accent-green)' : '#ef4444' }}>
                      {trader.winningPips >= 0 ? `+${trader.winningPips.toFixed(1)}` : trader.winningPips.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.leaderboard.estProfit}</div>
                    <div className="tabular" style={{ fontSize: '16px', fontWeight: 800, color: trader.profitAmount >= 0 ? '#fbbf24' : '#ef4444' }}>
                      {formatTraderProfit(trader.profitAmount, trader.broker, trader.currency)}
                    </div>
                  </div>
                </div>

                {/* Real-Time Trading Orders Strip (Fixed-Height to Prevent Screen Shaking on Refresh) */}
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(6, 11, 18, 0.72)',
                    border: '1px solid rgba(0, 240, 255, 0.14)',
                    minHeight: '86px',
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
                    <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
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

                  {trader.liveOrders && trader.liveOrders.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {trader.liveOrders.slice(0, 2).map((ord: any) => {
                        const isPos = ord.profitPips >= 0;
                        return (
                          <div
                            key={ord.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '11px',
                              padding: '4px 7px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 900,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: ord.type === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                  color: ord.type === 'BUY' ? '#34d399' : '#f87171',
                                }}
                              >
                                {ord.type}
                              </span>
                              <strong className="tabular" style={{ color: '#fff', fontSize: '11px' }}>{ord.symbol}</strong>
                              <span className="tabular" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{ord.lotSize.toFixed(2)}L</span>
                            </div>
                            <div className="tabular" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <span style={{ fontWeight: 800, color: isPos ? '#10b981' : '#ef4444' }}>
                                {isPos ? `+${ord.profitPips}` : ord.profitPips}p
                              </span>
                              <span style={{ fontSize: '9.5px', color: 'var(--text-faint)' }}>
                                {ord.timeLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px' }}>
                      No active market orders open right now
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Main Ranking Table or Institutional Empty State */}
      {processedEntries.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(10, 186, 181, 0.1)',
              border: '1px solid rgba(10, 186, 181, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={28} color="#0abab5" />
          </div>
          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Waiting for Verified Traders</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.5 }}>
            No mockup accounts are displayed. Only real traders connected via live MT4/MT5 broker feeds appear on the global leaderboard.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {processedEntries.map(trader => {
            const isTop3 = trader.displayRank <= 3;
            return (
              <div
                key={trader.userId}
                className="leaderboard-row"
                onClick={() => onSelectTrader?.({ userId: trader.userId, username: trader.username, broker: trader.broker, rank: trader.displayRank, score: trader.winningPips, winRate: trader.winRate, tradesCount: trader.tradesCount })}
                style={{
                  background: isTop3 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = isTop3 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)')}
              >
                {/* Left / Top User Identifier */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '28px',
                        fontWeight: 800,
                        fontSize: '13px',
                        textAlign: 'center',
                        color: trader.displayRank === 1 ? '#fbbf24' : trader.displayRank === 2 ? '#94a3b8' : trader.displayRank === 3 ? '#d97706' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      #{trader.displayRank}
                    </div>

                    <TraderAvatar
                      username={trader.profileName || trader.username}
                      symbol={trader.avatarSymbol}
                      avatarUrl={trader.avatarUrl}
                      size={36}
                    />

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '15px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {trader.profileName}
                        </strong>
                        {trader.accountTag && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                              color: '#94a3b8',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.09)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                              letterSpacing: '0.2px',
                            }}
                          >
                            {trader.accountTag}
                          </span>
                        )}
                        <BrokerSymbol broker={trader.broker} />
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>• {trader.tier}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        <span>{t.leaderboard.winRate} <strong style={{ color: 'var(--text-main)' }}>{trader.winRate}%</strong></span>
                        <span>{t.leaderboard.xp} <strong style={{ color: 'var(--accent-cyan)' }}>{trader.xp}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="show-on-mobile" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                    <ExternalLink size={15} />
                  </div>
                </div>

                {/* Desktop Multi-Column Metrics */}
                <div className="leaderboard-row-desktop-stats">
                  <div style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.leaderboard.netPips}</div>
                    <div className="tabular" style={{ fontSize: '16px', fontWeight: 800, color: trader.winningPips >= 0 ? 'var(--accent-green)' : '#ef4444', whiteSpace: 'nowrap' }}>
                      {trader.winningPips >= 0 ? `+${trader.winningPips.toFixed(1)}` : trader.winningPips.toFixed(1)}
                    </div>
                  </div>

                  <div style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.leaderboard.profit}</div>
                    <div className="tabular" style={{ fontSize: '16px', fontWeight: 800, color: trader.profitAmount >= 0 ? '#fbbf24' : '#ef4444', whiteSpace: 'nowrap' }}>
                      {formatTraderProfit(trader.profitAmount, trader.broker, trader.currency)}
                    </div>
                  </div>

                  <div style={{ minWidth: '70px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.leaderboard.rate}</div>
                    <div className="tabular" style={{ fontSize: '14px', fontWeight: 700, color: trader.profitRate >= 0 ? 'var(--accent-cyan)' : '#ef4444', whiteSpace: 'nowrap' }}>
                      {trader.profitRate >= 0 ? `+${trader.profitRate}%` : `${trader.profitRate}%`}
                    </div>
                  </div>

                  <ExternalLink size={16} color="var(--text-muted)" />
                </div>

                {/* Mobile Responsive 3-Col Chip Grid */}
                <div className="leaderboard-row-mobile-stats">
                  <div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{t.leaderboard.netPips}</div>
                    <div className="tabular" style={{ fontSize: '14px', fontWeight: 800, color: trader.winningPips >= 0 ? 'var(--accent-green)' : '#ef4444', marginTop: '1px', whiteSpace: 'nowrap' }}>
                      {trader.winningPips >= 0 ? `+${trader.winningPips.toFixed(1)}` : trader.winningPips.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{t.leaderboard.profit}</div>
                    <div className="tabular" style={{ fontSize: '14px', fontWeight: 800, color: trader.profitAmount >= 0 ? '#fbbf24' : '#ef4444', marginTop: '1px', whiteSpace: 'nowrap' }}>
                      {formatTraderProfit(trader.profitAmount, trader.broker, trader.currency)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{t.leaderboard.rate}</div>
                    <div className="tabular" style={{ fontSize: '14px', fontWeight: 800, color: trader.profitRate >= 0 ? 'var(--accent-cyan)' : '#ef4444', marginTop: '1px', whiteSpace: 'nowrap' }}>
                      {trader.profitRate >= 0 ? `+${trader.profitRate}%` : `${trader.profitRate}%`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
