/**
 * TraderRank Core Canonical Data Contracts
 * Compliant with PRD v1 and Infrastructure Design v1
 */

export type Broker = 'XM' | 'Axiory' | 'Exness' | 'Vantage' | 'OTHER';

export type IntegrationType = 'mt_gateway' | 'exness_native';

export type Platform = 'MT4' | 'MT5' | 'NATIVE';

export type ConnectionStatus = 'CONNECTED' | 'SYNCING' | 'ERROR' | 'DISCONNECTED';

export type OrderType = 'BUY' | 'SELL';

/**
 * Public/application metadata for a connected trading account.
 * Note: Raw credentials (investor passwords, API keys) are strictly isolated
 * in the Secrets Vault and NEVER stored on this entity.
 */
export interface TradingAccount {
  id: string;
  userId: string;
  accountNumber: string;
  broker: Broker;
  integrationType: IntegrationType;
  platform: Platform;
  serverName?: string; // MT4/MT5 server (e.g. XMGlobal-Real 55, VantageFX-Live 2)
  connectionStatus: ConnectionStatus;
  lastError?: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  leverage: number;
  vaultSecretRef: string; // Reference pointer into isolated Secrets Vault
  lastSyncedAt: string; // ISO 8601 UTC
  createdAt: string;
  updatedAt: string;
}

/**
 * Credentials used during connection onboarding and stored encrypted in Secrets Vault.
 */
export interface GatewayCredentials {
  type: 'mt_gateway';
  broker: Broker;
  platform: 'MT4' | 'MT5';
  serverName: string;
  login: string;
  investorPassword: string; // Read-only password per PRD §5.1
}

export interface ExnessNativeCredentials {
  type: 'exness_native';
  broker: 'Exness';
  apiKey: string;
  apiSecret: string;
  accountId?: string;
}

export type AccountCredentials = GatewayCredentials | ExnessNativeCredentials;

/**
 * Pre-flight connection validation result.
 */
export interface ValidationResult {
  success: boolean;
  error?: string;
  errorCode?: 'INVALID_CREDENTIALS' | 'INVESTOR_PASSWORD_DISABLED' | 'SERVER_UNREACHABLE' | 'UNVERIFIED_KYC' | 'UNKNOWN';
  accountDetails?: {
    accountNumber: string;
    server?: string;
    balance: number;
    equity: number;
    currency: string;
    leverage: number;
  };
}

/**
 * Canonical normalized open position.
 * Absorbs all MT Gateway and Exness Native payload nuances.
 */
export interface CanonicalPosition {
  id: string;
  accountId: string;
  ticket: string;
  symbol: string; // e.g. "EURUSD", "XAUUSD", "USDJPY"
  type: OrderType;
  lotSize: number;
  openPrice: number;
  currentPrice: number;
  sl?: number;
  tp?: number;
  profitCurrency: number; // Raw broker currency profit
  profitPips: number; // Calculated standardized pip gain/loss
  swap: number;
  commission: number;
  openTime: string; // ISO 8601 UTC
  updateTime: string; // ISO 8601 UTC
}

/**
 * Canonical normalized closed trade (deal/order).
 * Source of truth for XP, badges, tournament scoring, and historical performance.
 */
export interface CanonicalTrade {
  id: string;
  accountId: string;
  ticket: string;
  symbol: string;
  type: OrderType;
  lotSize: number;
  openPrice: number;
  closePrice: number;
  openTime: string; // ISO 8601 UTC
  closeTime: string; // ISO 8601 UTC
  pnlCurrency: number; // Final monetary profit/loss
  pnlPips: number; // Final pip gain/loss
  commission: number;
  swap: number;
  reason?: string; // 'tp' | 'sl' | 'manual' | 'so'
}

/**
 * Live Leaderboard Entry.
 * Cached in Redis Sorted Sets and streamed to clients.
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  avatarSymbol?: string; // Symbolic identifier instead of emoji
  accountCount: number;
  brokers: Broker[];
  closedPips: number; // Pips from settled trades
  floatingPips: number; // Live pips from active positions
  totalPips: number; // Combined ranking metric
  dailyPips: number; // Net winning pips gained today
  dailyRank: number;
  winRate: number; // 0 - 100%
  tradesCount: number;
  xp: number;
  level: number;
  badges: string[];
  lastUpdated: string;
}

/**
 * Daily Best Trader / Daily Winning Pips Stats.
 * Aggregates performance within the current 24-hour UTC window across any connected broker.
 */
export interface DailyTraderStats {
  rank: number;
  userId: string;
  username: string;
  avatarSymbol: string;
  brokers: Broker[];
  accountCount: number;
  dailyClosedPips: number;
  dailyFloatingPips: number;
  dailyTotalPips: number;
  dailyTradesCount: number;
  dailyWinningTrades: number;
  dailyWinRate: number;
  isDailyChampion: boolean;
  date: string; // YYYY-MM-DD
}

export interface DailyLeaderboardResult {
  date: string; // YYYY-MM-DD
  dailyBestTrader: DailyTraderStats | null;
  standings: DailyTraderStats[];
  totalDailyPips: number;
  activeTradersToday: number;
}

export interface DailyChampionRecord {
  date: string;
  winnerUsername: string;
  winnerUserId: string;
  winnerAvatarSymbol: string;
  winnerBrokers: Broker[];
  pipsWon: number;
  winRate: number;
  tradesCompleted: number;
}

/**
 * Gamification Profile (XP, Level, Badges).
 */
export interface TraderXPProfile {
  userId: string;
  xp: number;
  level: number;
  currentTier: 'Novice' | 'Apprentice' | 'Trader' | 'Pro' | 'Elite' | 'Master' | 'Legend';
  badges: Badge[];
  streakDays: number;
  totalPips: number;
  winRate: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

/**
 * Telemetry and Health Metrics for each integration.
 */
export interface IntegrationHealth {
  broker: Broker;
  integrationType: IntegrationType;
  activeConnections: number;
  uptimePercentage: number;
  averageLagMs: number;
  disconnectRate: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'DOWN';
  lastCheckedAt: string;
}

/**
 * Event Bus stream envelope.
 */
export interface EventBusEnvelope<T> {
  eventId: string;
  timestamp: string;
  eventType: 
    | 'position.updated.raw'
    | 'trade.closed.raw'
    | 'account.health.raw'
    | 'position.normalized'
    | 'trade.closed.normalized'
    | 'leaderboard.delta'
    | 'account.connected'
    | 'account.disconnected'
    | 'tournament.overtake'
    | 'badge.unlocked';
  accountId: string;
  payload: T;
}

/**
 * Competitive Tournaments & Sprints (PRD v2 §2 Pillar 2)
 */
export type TournamentType = 'WEEKLY_SPRINT' | 'MONTHLY_PROP' | 'FLASH_GAUNTLET';

export interface Tournament {
  id: string;
  title: string;
  description: string;
  type: TournamentType;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  prizePoolPips: number;
  prizeDetails: string;
  minTradesRequired: number; // e.g. 5 trades
  maxDailyLossPercent: number; // e.g. 5.0%
  maxDrawdownPercent: number; // e.g. 10.0%
  participantCount: number;
  standings: TournamentStanding[];
}

export interface TournamentStanding {
  rank: number;
  userId: string;
  username: string;
  avatarSymbol: string;
  brokers: Broker[];
  netPips: number;
  closedPips: number;
  floatingPips: number;
  tradesCount: number;
  winRate: number;
  currentDrawdownPercent: number;
  maxDrawdownReached: number;
  traderScore: number; // PRD v2 Multi-Factor Score
  isDisqualified: boolean;
  disqualificationReason?: string;
  isEligibleForPrize: boolean;
}

/**
 * Institutional Risk Evaluation (PRD v2 §2 Pillar 3)
 */
export interface RiskEvaluation {
  userId: string;
  accountId: string;
  startingDayEquity: number;
  highWaterMarkEquity: number;
  currentEquity: number;
  dailyLossPercent: number;
  trailingDrawdownPercent: number;
  isDailyLossBreached: boolean; // > 5%
  isTrailingDrawdownBreached: boolean; // > 10%
  isDisqualified: boolean;
  disqualificationReason?: string;
  disciplineMultiplier: number; // 0.8 - 1.25 multiplier based on strict risk adherence
}

/**
 * Trader Honor Badges & Achievements (PRD v2 §2 Pillar 5)
 */
export interface HonorBadge {
  id: string;
  name: string;
  description: string;
  category: 'RISK' | 'ACCURACY' | 'ENDURANCE' | 'MASTERY';
  iconSymbol: 'ShieldCheck' | 'Target' | 'Trophy' | 'Zap' | 'Award' | 'Flame';
  unlocked: boolean;
  unlockedAt?: string;
  progressPercent: number; // 0 - 100%
  requirementText: string;
}

/**
 * Detailed Verified Trader Profile (PRD v2 §2 Pillar 4)
 */
export interface TraderProfileDetail {
  userId: string;
  username: string;
  avatarSymbol: string;
  verifiedBrokers: Broker[];
  rankTier: 'Novice Scalper' | 'Pro Swing' | 'Market Veteran' | 'Apex Predator';
  level: number;
  xp: number;
  nextLevelXp: number;
  progressToNextLevel: number; // 0 - 100%
  joinedDate: string;
  allTimeStats: {
    totalTrades: number;
    winningTrades: number;
    winRate: number;
    profitFactor: number;
    cumulativePips: number;
    maxHistoricalDrawdown: number;
    averagePipsPerTrade: number;
    tournamentsEntered: number;
    podiumFinishes: number;
  };
  badges: HonorBadge[];
  recentActivity: string[];
}

/**
 * Real-Time Community Broadcast Event
 */
export interface CommunityBroadcast {
  id: string;
  timestamp: string;
  type: 'TOURNAMENT_OVERTAKE' | 'BADGE_UNLOCKED' | 'CHALLENGER_JOINED' | 'DAILY_LEADER_CROWNED';
  title: string;
  description: string;
  traderName: string;
  traderSymbol: string;
  meta?: Record<string, any>;
}

