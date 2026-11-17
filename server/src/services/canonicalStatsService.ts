/**
 * TraderRank Canonical Stats Service (Single Source of Truth)
 * Computes unified trader statistics across all connected accounts,
 * combining closed trades, live floating positions, strict UTC daily windows,
 * and live USD/JPY currency normalization via AllTick / LiveMarketFeed.
 */

import {
  Broker,
  CanonicalLiveOrder,
  CanonicalTraderStats,
} from '../../../shared/src/types.js';
import { AccountConnectorService } from '../connector/accountConnector.js';
import { LeaderboardService } from './leaderboardService.js';
import { LiveMarketFeedService } from '../market/liveMarketFeed.js';
import { resolveBrokerCurrency } from '../utils/currencyFlow.js';

export interface CanonicalStatsResponse {
  traders: CanonicalTraderStats[];
  platformTotals: {
    totalTrades: number;
    totalWinningPips: number;
    activeTraders: number;
  };
  usdJpyRate: number;
  generatedAt: string;
}

const DEFAULT_USDJPY_RATE = 154.5;

export function getLiveUsdJpyRate(marketFeed?: LiveMarketFeedService): number {
  try {
    if (marketFeed) {
      const status = marketFeed.getStatus();
      const quote = status?.quotes?.['USDJPY'];
      if (quote && typeof quote.bid === 'number' && quote.bid > 50) {
        return quote.bid;
      }
    }
    const benchmark = LiveMarketFeedService.getRealBenchmarkPrice('USDJPY');
    if (benchmark && benchmark > 50) {
      return benchmark;
    }
  } catch {
    // Fallback to default benchmark
  }
  return DEFAULT_USDJPY_RATE;
}

function resolveCanonicalIdentity(params: {
  accountNumber?: string;
  userId?: string;
  username?: string;
  profileName?: string;
  broker?: Broker;
}) {
  const cleanAcc = String(params.accountNumber || '').replace(/^TraderRank-/i, '').trim();
  const rawUid = String(params.userId || '').trim();
  const rawUser = String(params.username || '').trim();
  const rawProfile = String(params.profileName || '').trim();

  const isHomies =
    cleanAcc === '72423906' ||
    rawUid === 'u_homiesplant_th' ||
    rawUid === 'u_homiesplant' ||
    rawUid === 'usr_meta_72423906' ||
    rawUser.toLowerCase().includes('homies') ||
    rawProfile.toLowerCase().includes('homies') ||
    (cleanAcc === '72423906' && (/emanuel/i.test(rawUser) || /emanuel/i.test(rawProfile)));

  const isZem =
    !isHomies &&
    (cleanAcc === '342186831' ||
      rawUid === 'u_zzzemzzz' ||
      rawUser.toLowerCase() === 'zzzemzzz' ||
      rawProfile.toLowerCase() === 'zzzemzzz' ||
      (cleanAcc === '342186831' && (/emanuel/i.test(rawUser) || /emanuel/i.test(rawProfile))));

  if (isHomies) {
    return {
      userId: 'u_homiesplant_th',
      username: 'HomiesPlant',
      profileName: 'HomiesPlant',
      accountNumber: '72423906',
      broker: 'XMTrading' as Broker,
      avatarSymbol: 'bear_emerald',
    };
  }

  if (isZem) {
    return {
      userId: 'u_zzzemzzz',
      username: 'zzZEMZzz',
      profileName: 'zzZEMZzz',
      accountNumber: '342186831',
      broker: 'XM' as Broker,
      avatarSymbol: 'bear_emerald',
    };
  }

  const fallbackName =
    rawProfile && !/emanuel/i.test(rawProfile)
      ? rawProfile
      : rawUser && !/emanuel/i.test(rawUser)
      ? rawUser
      : cleanAcc
      ? `TraderRank-${cleanAcc}`
      : 'VerifiedTrader';

  return {
    userId: rawUid || `usr_${cleanAcc || 'unknown'}`,
    username: fallbackName,
    profileName: fallbackName,
    accountNumber: cleanAcc || undefined,
    broker: params.broker || ('XM' as Broker),
    avatarSymbol: 'zap',
  };
}

export async function computeCanonicalStats(
  connector: AccountConnectorService,
  leaderboard: LeaderboardService,
  marketFeed?: LiveMarketFeedService
): Promise<CanonicalStatsResponse> {
  const usdJpyRate = getLiveUsdJpyRate(marketFeed);
  const todayUtc = new Date().toISOString().slice(0, 10);
  const accounts = connector.getAccounts();
  const lbEntries = leaderboard.getLeaderboard(50);

  const byKey = new Map<string, CanonicalTraderStats>();
  let totalPlatformTrades = 0;
  let totalPlatformWinningPips = 0;

  // 1. Aggregate from real connected accounts (Primary Source of Truth)
  for (const acc of accounts) {
    const rawTrades = connector.getAccountTrades(acc.id);
    const rawPositions = await connector.getActivePositions(acc.id).catch(() => []);

    const validTrades = Array.isArray(rawTrades)
      ? rawTrades.filter(d => {
          const sym = String(d.symbol || '').toUpperCase();
          return sym && sym !== 'UNKNOWN' && sym !== 'BALANCE' && Number(d.lotSize ?? 0) > 0;
        })
      : [];

    let closedPips = 0;
    let winningPips = 0;
    let netProfitNative = 0;
    let grossProfitNative = 0;
    let wins = 0;

    let dailyNetPips = 0;
    let dailyProfitNative = 0;
    let dailyTradesCount = 0;
    let dailyWins = 0;

    for (const tr of validTrades) {
      const profitNative = Number(tr.pnlCurrency ?? 0);
      const pips = Number(tr.pnlPips ?? 0);
      const isWin = profitNative > 0 || (profitNative === 0 && pips > 0);

      closedPips += pips;
      netProfitNative += profitNative;
      if (isWin) {
        wins++;
        winningPips += Math.max(0, pips);
        grossProfitNative += Math.max(0, profitNative);
      }

      if (String(tr.closeTime || '').startsWith(todayUtc)) {
        dailyTradesCount++;
        dailyNetPips += pips;
        dailyProfitNative += profitNative;
        if (isWin) dailyWins++;
      }
    }

    const floatingPips = Array.isArray(rawPositions)
      ? rawPositions.reduce((sum, p) => sum + Number(p.profitPips ?? 0), 0)
      : 0;

    totalPlatformTrades += validTrades.length;
    totalPlatformWinningPips += winningPips;

    const openOrders: CanonicalLiveOrder[] = Array.isArray(rawPositions)
      ? rawPositions.slice(0, 2).map(pos => ({
          id: String(pos.id || pos.ticket || Math.random()),
          ticket: String(pos.ticket || pos.id || '').slice(-6),
          symbol: String(pos.symbol || 'XAUUSD'),
          type: (String(pos.type || 'BUY').toUpperCase().includes('SELL') ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
          lotSize: Number(pos.lotSize ?? 0.01),
          openPrice: Number(pos.openPrice || 0),
          currentPrice: Number(pos.currentPrice || pos.openPrice || 0),
          profitPips: Number((pos.profitPips ?? 0).toFixed(1)),
          profitCurrency: Number((pos.profitCurrency ?? 0).toFixed(2)),
          isLivePosition: true,
          timeLabel: 'LIVE OPEN',
        }))
      : [];

    const recentClosedOrders: CanonicalLiveOrder[] =
      openOrders.length === 0 && validTrades.length > 0
        ? [...validTrades]
            .sort((a, b) => new Date(b.closeTime || 0).getTime() - new Date(a.closeTime || 0).getTime())
            .slice(0, 2)
            .map(tr => ({
              id: String(tr.id || tr.ticket || Math.random()),
              ticket: String(tr.ticket || tr.id || '').slice(-6),
              symbol: String(tr.symbol || 'XAUUSD'),
              type: (String(tr.type || 'BUY').toUpperCase().includes('SELL') ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
              lotSize: Number(tr.lotSize ?? 0.01),
              openPrice: Number(tr.openPrice || 0),
              currentPrice: Number(tr.closePrice || tr.openPrice || 0),
              profitPips: Number((tr.pnlPips ?? 0).toFixed(1)),
              profitCurrency: Number((tr.pnlCurrency ?? 0).toFixed(2)),
              isLivePosition: false,
              timeLabel: tr.closeTime
                ? new Date(tr.closeTime).toISOString().slice(11, 16) + ' UTC'
                : 'FILLED',
            }))
        : [];

    const identity = resolveCanonicalIdentity({
      accountNumber: acc.accountNumber,
      userId: acc.userId,
      username: acc.profileUsername,
      profileName: acc.profileUsername,
      broker: acc.broker,
    });

    const currency = resolveBrokerCurrency(
      identity.broker,
      acc.serverName,
      acc.currency,
      identity.accountNumber
    );

    const isJpy = currency === 'JPY';
    const netProfitUsd = isJpy
      ? Number((netProfitNative / usdJpyRate).toFixed(2))
      : Number(netProfitNative.toFixed(2));
    const grossProfitUsd = isJpy
      ? Number((grossProfitNative / usdJpyRate).toFixed(2))
      : Number(grossProfitNative.toFixed(2));
    const dailyProfitUsd = isJpy
      ? Number((dailyProfitNative / usdJpyRate).toFixed(2))
      : Number(dailyProfitNative.toFixed(2));

    const currentBal = Number(acc.equity ?? acc.balance ?? 1000);
    const impliedStartCap = Math.max(100, currentBal - netProfitNative);
    const roiPct = Number(((netProfitNative / impliedStartCap) * 100).toFixed(1));
    const totalPips = Number((closedPips + floatingPips).toFixed(1));
    const xp = validTrades.length * 25;
    const level = Math.max(1, Math.floor(xp / 500) + 1);

    const matchedLb = lbEntries.find(
      e =>
        (identity.accountNumber && e.accountNumber === identity.accountNumber) ||
        e.userId === identity.userId
    );

    const stats: CanonicalTraderStats = {
      rank: 0,
      userId: identity.userId,
      username: identity.username,
      profileName: identity.profileName,
      accountNumber: identity.accountNumber,
      accountId: acc.id,
      broker: identity.broker,
      brokers: [identity.broker],
      currency,
      avatarUrl: acc.avatarUrl || matchedLb?.avatarUrl,
      avatarSymbol: matchedLb?.avatarSymbol || identity.avatarSymbol,
      accountCount: 1,
      closedPips: Number(closedPips.toFixed(1)),
      floatingPips: Number(floatingPips.toFixed(1)),
      totalPips,
      winningPips: Number(winningPips.toFixed(1)),
      netProfitNative: Number(netProfitNative.toFixed(2)),
      netProfitUsd,
      grossProfitNative: Number(grossProfitNative.toFixed(2)),
      grossProfitUsd,
      winRate: validTrades.length > 0 ? Math.round((wins / validTrades.length) * 100) : 0,
      tradesCount: validTrades.length,
      roiPct,
      dailyNetPips: Number(dailyNetPips.toFixed(1)),
      dailyProfitNative: Number(dailyProfitNative.toFixed(2)),
      dailyProfitUsd,
      dailyTradesCount,
      dailyWinRate: dailyTradesCount > 0 ? Math.round((dailyWins / dailyTradesCount) * 100) : 0,
      dailyRank: matchedLb?.dailyRank ?? 99,
      xp,
      level,
      badges: matchedLb?.badges ?? ['First Connect'],
      liveOrders: openOrders.length > 0 ? openOrders : recentClosedOrders,
      usdJpyRate,
      lastUpdated: new Date().toISOString(),
    };

    const key = identity.accountNumber || identity.userId;
    byKey.set(key, stats);
  }

  // 2. Include any leaderboard-only entries not yet represented by an active account object
  for (const lb of lbEntries) {
    const identity = resolveCanonicalIdentity({
      accountNumber: lb.accountNumber,
      userId: lb.userId,
      username: lb.username,
      profileName: lb.profileName,
      broker: lb.brokers?.[0],
    });
    const key = identity.accountNumber || identity.userId;
    if (byKey.has(key)) continue;

    const currency = resolveBrokerCurrency(
      identity.broker,
      undefined,
      lb.currency,
      identity.accountNumber
    );
    const isJpy = currency === 'JPY';
    const netNative = Number(lb.closedProfitUsd ?? 0);
    const netUsd = isJpy ? Number((netNative / usdJpyRate).toFixed(2)) : Number(netNative.toFixed(2));
    const grossNative = Number(lb.grossProfitUsd ?? 0);
    const grossUsd = isJpy ? Number((grossNative / usdJpyRate).toFixed(2)) : Number(grossNative.toFixed(2));

    byKey.set(key, {
      rank: 0,
      userId: identity.userId,
      username: identity.username,
      profileName: identity.profileName,
      accountNumber: identity.accountNumber,
      broker: identity.broker,
      brokers: lb.brokers?.length ? lb.brokers : [identity.broker],
      currency,
      avatarUrl: lb.avatarUrl,
      avatarSymbol: lb.avatarSymbol || identity.avatarSymbol,
      accountCount: lb.accountCount || 1,
      closedPips: Number((lb.closedPips ?? 0).toFixed(1)),
      floatingPips: Number((lb.floatingPips ?? 0).toFixed(1)),
      totalPips: Number((lb.totalPips ?? 0).toFixed(1)),
      winningPips: Number((lb.winningPips ?? 0).toFixed(1)),
      netProfitNative: Number(netNative.toFixed(2)),
      netProfitUsd: netUsd,
      grossProfitNative: Number(grossNative.toFixed(2)),
      grossProfitUsd: grossUsd,
      winRate: lb.winRate ?? 0,
      tradesCount: lb.tradesCount ?? 0,
      roiPct: lb.winRate ?? 0,
      dailyNetPips: Number((lb.dailyPips ?? 0).toFixed(1)),
      dailyProfitNative: 0,
      dailyProfitUsd: 0,
      dailyTradesCount: 0,
      dailyWinRate: lb.winRate ?? 0,
      dailyRank: lb.dailyRank ?? 99,
      xp: lb.xp ?? 0,
      level: lb.level ?? 1,
      badges: lb.badges ?? [],
      liveOrders: [],
      usdJpyRate,
      lastUpdated: lb.lastUpdated || new Date().toISOString(),
    });
  }

  // 3. Sort consistently: active traders with trades first, then totalPips descending
  const sorted = Array.from(byKey.values()).sort((a, b) => {
    const aActive = a.tradesCount > 0 ? 1 : 0;
    const bActive = b.tradesCount > 0 ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return b.totalPips - a.totalPips;
  });

  // Assign global rank
  sorted.forEach((t, idx) => {
    t.rank = idx + 1;
  });

  // Assign daily rank
  const byDaily = [...sorted].sort((a, b) => b.dailyNetPips - a.dailyNetPips);
  byDaily.forEach((t, idx) => {
    t.dailyRank = idx + 1;
  });

  return {
    traders: sorted,
    platformTotals: {
      totalTrades: totalPlatformTrades,
      totalWinningPips: Number(totalPlatformWinningPips.toFixed(1)),
      activeTraders: sorted.filter(t => t.tradesCount > 0).length,
    },
    usdJpyRate,
    generatedAt: new Date().toISOString(),
  };
}
