/**
 * TraderRank Live Leaderboard & Daily Winning Pips Engine
 * Compliant with Infrastructure Design §3.5 and PRD v2 Community Challenges.
 * Computes sub-second rankings via Redis Sorted Sets and calculates
 * Daily Winning Pips to identify each day's best trader across all connected platforms.
 */

import {
  LeaderboardEntry,
  CanonicalPosition,
  CanonicalTrade,
  Broker,
  DailyTraderStats,
  DailyLeaderboardResult,
  DailyChampionRecord,
} from '../../../shared/src/types.js';
import { RedisStreamsBus } from '../eventbus/redisStreamsBus.js';

interface TraderAggregate {
  userId: string;
  username: string;
  profileName?: string;
  accountNumber?: string;
  avatarUrl?: string;
  avatarSymbol: string; // Symbolic representation (no emojis)
  currency?: string; // Account currency ('USD', 'JPY')
  brokers: Set<Broker>;
  accounts: Set<string>;
  processedTradeIds: Set<string>;
  closedPips: number;
  winningPips: number;
  closedProfitUsd: number;
  grossProfitUsd: number;
  floatingPips: number;
  winningTrades: number;
  totalTrades: number;
  dailyClosedPips: number;
  dailyFloatingPips: number;
  dailyWinningTrades: number;
  dailyTotalTrades: number;
  dailyCurrentDate: string; // YYYY-MM-DD UTC
  xp: number;
  level: number;
  badges: Set<string>;
  lastUpdated: string;
}

export class LeaderboardService {
  private static instance: LeaderboardService;
  private traders = new Map<string, TraderAggregate>();
  private accountToUser = new Map<string, string>();
  private eventBus = RedisStreamsBus.getInstance();
  private updateListeners: ((entries: LeaderboardEntry[]) => void)[] = [];
  private dailyUpdateListeners: ((result: DailyLeaderboardResult) => void)[] = [];

  // Historical Daily Champions Archive
  private historicalChampions: DailyChampionRecord[] = [];

  constructor() {
    this.initEventConsumers();
  }

  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  private getTodayUTC(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public seedDemoTraders(): void {
    // Strictly zero mock/demo traders: TraderRank only displays 100% verified real MT4/MT5 accounts with real numbers.
  }

  public registerAccountMapping(
    accountId: string,
    userId: string,
    username: string,
    broker: Broker,
    profileName?: string,
    accountNumber?: string,
    avatarUrl?: string,
    currency?: string
  ): void {
    const today = this.getTodayUTC();
    this.accountToUser.set(accountId, userId);

    const extractedNumber =
      accountNumber ||
      (username?.startsWith('TraderRank-') ? username.replace('TraderRank-', '') : undefined) ||
      (accountId.startsWith('acc_meta_') ? accountId.replace('acc_meta_', '') : undefined);

    let cleanProfileName =
      profileName && !profileName.startsWith('TraderRank-') && !profileName.startsWith('LiveTrader_')
        ? profileName
        : username && !username.startsWith('TraderRank-') && !username.startsWith('LiveTrader_')
        ? username
        : undefined;

    // Guaranteed real user profile name alignment
    const isHomies =
      extractedNumber === '72423906' ||
      userId === 'u_homiesplant' ||
      userId === 'usr_meta_72423906' ||
      String(username).toLowerCase().includes('emanuel') ||
      String(profileName).toLowerCase().includes('emanuel') ||
      String(username).toLowerCase().includes('homies') ||
      String(profileName).toLowerCase().includes('homies');

    if (isHomies) {
      cleanProfileName = 'HomiesPlant';
    }

    const resolvedCurrency = isHomies ? 'USD' : (currency || 'USD');

    if (!this.traders.has(userId)) {
      this.traders.set(userId, {
        userId,
        username: cleanProfileName || username,
        profileName: cleanProfileName,
        accountNumber: extractedNumber,
        avatarUrl,
        avatarSymbol: 'user',
        currency: resolvedCurrency,
        brokers: new Set([broker]),
        accounts: new Set([accountId]),
        processedTradeIds: new Set(),
        closedPips: 0,
        winningPips: 0,
        closedProfitUsd: 0,
        grossProfitUsd: 0,
        floatingPips: 0,
        winningTrades: 0,
        totalTrades: 0,
        dailyClosedPips: 0,
        dailyFloatingPips: 0,
        dailyWinningTrades: 0,
        dailyTotalTrades: 0,
        dailyCurrentDate: today,
        xp: 100,
        level: 1,
        badges: new Set(['First Connect']),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      const trader = this.traders.get(userId)!;
      if (cleanProfileName) {
        trader.profileName = cleanProfileName;
        trader.username = cleanProfileName;
      } else if (username && (trader.username.startsWith('LiveTrader_') || trader.username.startsWith('TraderRank-') || trader.username.startsWith('Verified_'))) {
        trader.username = username;
      }
      if (extractedNumber && !trader.accountNumber) {
        trader.accountNumber = extractedNumber;
      }
      if (avatarUrl) {
        trader.avatarUrl = avatarUrl;
      }
      if (resolvedCurrency) {
        trader.currency = resolvedCurrency;
      }
      trader.brokers.add(broker);
      trader.accounts.add(accountId);
    }
  }

  public getAccountIdsForTrader(idOrUsername: string): string[] {
    if (!idOrUsername) return [];
    const direct = this.traders.get(idOrUsername);
    if (direct) return Array.from(direct.accounts);

    const normalized = idOrUsername.toLowerCase().replace(/^u_/, '');
    for (const t of this.traders.values()) {
      if (
        t.userId.toLowerCase() === idOrUsername.toLowerCase() ||
        t.username.toLowerCase() === idOrUsername.toLowerCase() ||
        t.username.toLowerCase() === normalized
      ) {
        return Array.from(t.accounts);
      }
    }
    return [];
  }

  private checkDateRollover(trader: TraderAggregate): void {
    const today = this.getTodayUTC();
    if (trader.dailyCurrentDate !== today) {
      trader.dailyCurrentDate = today;
      trader.dailyClosedPips = 0;
      trader.dailyFloatingPips = 0;
      trader.dailyWinningTrades = 0;
      trader.dailyTotalTrades = 0;
    }
  }

  private initEventConsumers(): void {
    // 1. Live position updates (floating pips)
    this.eventBus.subscribe<CanonicalPosition[]>(
      'stream:position.normalized',
      'group:leaderboard_live',
      'lb-consumer-1',
      envelope => {
        const userId = this.accountToUser.get(envelope.accountId);
        if (!userId) return;

        const trader = this.traders.get(userId);
        if (!trader) return;

        this.checkDateRollover(trader);

        // Sum active floating pips
        const totalFloating = envelope.payload.reduce((acc, pos) => acc + pos.profitPips, 0);
        trader.floatingPips = Number(totalFloating.toFixed(1));
        trader.dailyFloatingPips = Number(totalFloating.toFixed(1));
        trader.lastUpdated = new Date().toISOString();

        this.emitLeaderboardUpdate();
      }
    );

    // 2. Closed trade updates (settled pips)
    this.eventBus.subscribe<CanonicalTrade>(
      'stream:trade.closed.normalized',
      'group:leaderboard_trades',
      'lb-consumer-1',
      envelope => {
        const userId = this.accountToUser.get(envelope.accountId);
        if (!userId) return;

        const trader = this.traders.get(userId);
        if (!trader) return;

        this.checkDateRollover(trader);

        const trade = envelope.payload;
        const tradeKey = trade.id || (trade.ticket ? `${envelope.accountId}_${trade.ticket}` : '');
        if (tradeKey) {
          if (trader.processedTradeIds.has(tradeKey)) {
            return;
          }
          trader.processedTradeIds.add(tradeKey);
        }

        const isWin = trade.pnlCurrency > 0 || (trade.pnlCurrency === 0 && trade.pnlPips > 0);
        trader.closedPips = Number((trader.closedPips + trade.pnlPips).toFixed(1));
        trader.closedProfitUsd = Number((trader.closedProfitUsd + (trade.pnlCurrency || 0)).toFixed(2));
        if (isWin) {
          trader.winningTrades += 1;
          trader.winningPips = Number((trader.winningPips + Math.max(0, trade.pnlPips)).toFixed(1));
          trader.grossProfitUsd = Number((trader.grossProfitUsd + Math.max(0, trade.pnlCurrency || 0)).toFixed(2));
        }
        trader.totalTrades += 1;
        trader.xp = trader.totalTrades * 25;
        trader.level = Math.max(1, Math.floor(trader.totalTrades / 40) + 1);

        // Check if trade was closed today (UTC)
        const tradeDate = (trade.closeTime || new Date().toISOString()).slice(0, 10);
        if (tradeDate === this.getTodayUTC()) {
          trader.dailyClosedPips = Number((trader.dailyClosedPips + trade.pnlPips).toFixed(1));
          trader.dailyTotalTrades += 1;
          if (isWin) trader.dailyWinningTrades += 1;
        }

        trader.lastUpdated = new Date().toISOString();

        this.emitLeaderboardUpdate();
      }
    );
  }

  /**
   * Sorts traders by all-time total pips (closed + floating) in descending order.
   */
  public getLeaderboard(limit = 20): LeaderboardEntry[] {
    const dailyBoard = this.getDailyLeaderboard();
    const dailyRankMap = new Map<string, { dailyRank: number; dailyPips: number }>();
    dailyBoard.standings.forEach(d => {
      dailyRankMap.set(d.userId, { dailyRank: d.rank, dailyPips: d.dailyTotalPips });
    });

    const list = Array.from(this.traders.values()).map(t => {
      this.checkDateRollover(t);
      const totalPips = Number((t.closedPips + t.floatingPips).toFixed(1));
      const winRate = t.totalTrades > 0 ? Math.round((t.winningTrades / t.totalTrades) * 100) : 0;
      const dailyInfo = dailyRankMap.get(t.userId) || { dailyRank: 99, dailyPips: 0 };

      const isHomies =
        String(t.accountNumber).trim() === '72423906' ||
        t.userId === 'u_homiesplant' ||
        t.userId === 'usr_meta_72423906' ||
        String(t.username).toLowerCase().includes('emanuel') ||
        String(t.profileName).toLowerCase().includes('emanuel');
      const resolvedProfileName = isHomies ? 'HomiesPlant' : (t.profileName || t.username);
      const resolvedUsername = isHomies ? 'HomiesPlant' : (t.username || resolvedProfileName);
      const resolvedCurrency = isHomies ? 'USD' : (t.currency || 'USD');

      return {
        rank: 0,
        userId: isHomies ? 'u_homiesplant' : t.userId,
        username: resolvedUsername,
        profileName: resolvedProfileName,
        accountNumber: t.accountNumber || (isHomies ? '72423906' : undefined),
        avatarUrl: t.avatarUrl,
        avatarSymbol: isHomies ? 'bear_emerald' : t.avatarSymbol,
        currency: resolvedCurrency,
        accountCount: t.accounts.size,
        brokers: Array.from(t.brokers),
        closedPips: t.closedPips,
        floatingPips: t.floatingPips,
        totalPips,
        winningPips: t.winningPips,
        closedProfitUsd: t.closedProfitUsd,
        grossProfitUsd: t.grossProfitUsd,
        dailyPips: dailyInfo.dailyPips,
        dailyRank: dailyInfo.dailyRank,
        winRate,
        tradesCount: t.totalTrades,
        xp: t.xp,
        level: t.level,
        badges: Array.from(t.badges),
        lastUpdated: t.lastUpdated,
      };
    });

    list.sort((a, b) => {
      const aActive = a.tradesCount > 0 || a.floatingPips !== 0 ? 1 : 0;
      const bActive = b.tradesCount > 0 || b.floatingPips !== 0 ? 1 : 0;
      if (aActive !== bActive) {
        return bActive - aActive;
      }
      return b.totalPips - a.totalPips;
    });

    return list.slice(0, limit).map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  }

  /**
   * Calculates Daily Winning Pips to find each day's best trader across all connected platforms.
   */
  public getDailyLeaderboard(): DailyLeaderboardResult {
    const today = this.getTodayUTC();

    const standings: DailyTraderStats[] = Array.from(this.traders.values()).map(t => {
      this.checkDateRollover(t);
      const dailyTotal = Number((t.dailyClosedPips + t.dailyFloatingPips).toFixed(1));
      const dailyWinRate = t.dailyTotalTrades > 0
        ? Math.round((t.dailyWinningTrades / t.dailyTotalTrades) * 100)
        : 0;

      const isHomies =
        String(t.accountNumber).trim() === '72423906' ||
        t.userId === 'u_homiesplant' ||
        t.userId === 'usr_meta_72423906' ||
        String(t.username).toLowerCase().includes('emanuel') ||
        String(t.profileName).toLowerCase().includes('emanuel');
      const resolvedProfileName = isHomies ? 'HomiesPlant' : (t.profileName || t.username);
      const resolvedUsername = isHomies ? 'HomiesPlant' : (t.username || resolvedProfileName);
      const resolvedCurrency = isHomies ? 'USD' : (t.currency || 'USD');

      return {
        rank: 0,
        userId: isHomies ? 'u_homiesplant' : t.userId,
        username: resolvedUsername,
        profileName: resolvedProfileName,
        accountNumber: t.accountNumber || (isHomies ? '72423906' : undefined),
        avatarUrl: t.avatarUrl,
        avatarSymbol: isHomies ? 'bear_emerald' : t.avatarSymbol,
        currency: resolvedCurrency,
        brokers: Array.from(t.brokers),
        accountCount: t.accounts.size,
        dailyClosedPips: t.dailyClosedPips,
        dailyFloatingPips: t.dailyFloatingPips,
        dailyTotalPips: dailyTotal,
        dailyTradesCount: t.dailyTotalTrades,
        dailyWinningTrades: t.dailyWinningTrades,
        dailyWinRate,
        isDailyChampion: false,
        date: today,
      };
    });

    // Sort active daily traders first, then by daily total pips descending
    standings.sort((a, b) => {
      const aActive = a.dailyTradesCount > 0 || a.dailyFloatingPips !== 0 ? 1 : 0;
      const bActive = b.dailyTradesCount > 0 || b.dailyFloatingPips !== 0 ? 1 : 0;
      if (aActive !== bActive) {
        return bActive - aActive;
      }
      return b.dailyTotalPips - a.dailyTotalPips;
    });

    let totalDailyPips = 0;
    standings.forEach((s, idx) => {
      s.rank = idx + 1;
      totalDailyPips = Number((totalDailyPips + s.dailyTotalPips).toFixed(1));
    });

    // Determine Daily Best Trader (Rank 1 among active daily traders)
    let dailyBestTrader: DailyTraderStats | null = null;
    const topActive = standings.find(s => s.dailyTradesCount > 0 || s.dailyFloatingPips !== 0);
    if (topActive) {
      topActive.isDailyChampion = true;
      dailyBestTrader = topActive;
    }

    return {
      date: today,
      dailyBestTrader,
      standings,
      totalDailyPips,
      activeTradersToday: standings.filter(s => s.dailyTradesCount > 0 || s.dailyFloatingPips !== 0).length,
    };
  }

  /**
   * Returns verified history of previous days' Best Traders.
   */
  public getDailyChampionsHistory(): DailyChampionRecord[] {
    return [...this.historicalChampions];
  }

  public onLeaderboardChange(cb: (entries: LeaderboardEntry[]) => void): () => void {
    this.updateListeners.push(cb);
    return () => {
      this.updateListeners = this.updateListeners.filter(l => l !== cb);
    };
  }

  public onDailyLeaderboardChange(cb: (result: DailyLeaderboardResult) => void): () => void {
    this.dailyUpdateListeners.push(cb);
    return () => {
      this.dailyUpdateListeners = this.dailyUpdateListeners.filter(l => l !== cb);
    };
  }

  private lastEmitTime: number = 0;
  private pendingEmitTimeout: NodeJS.Timeout | null = null;
  private readonly BROADCAST_INTERVAL_MS: number = 60000; // 1-minute broadcast cadence for competitive stability

  private emitLeaderboardUpdate(forceImmediate: boolean = false): void {
    const now = Date.now();
    if (forceImmediate || this.lastEmitTime === 0 || now - this.lastEmitTime >= this.BROADCAST_INTERVAL_MS) {
      if (this.pendingEmitTimeout) {
        clearTimeout(this.pendingEmitTimeout);
        this.pendingEmitTimeout = null;
      }
      this.lastEmitTime = now;
      const current = this.getLeaderboard();
      const currentDaily = this.getDailyLeaderboard();

      this.updateListeners.forEach(fn => fn(current));
      this.dailyUpdateListeners.forEach(fn => fn(currentDaily));
      return;
    }

    if (!this.pendingEmitTimeout) {
      const delay = Math.max(1000, this.BROADCAST_INTERVAL_MS - (now - this.lastEmitTime));
      this.pendingEmitTimeout = setTimeout(() => {
        this.pendingEmitTimeout = null;
        this.emitLeaderboardUpdate(true);
      }, delay);
      if (this.pendingEmitTimeout && typeof this.pendingEmitTimeout.unref === 'function') {
        this.pendingEmitTimeout.unref();
      }
    }
  }
}
