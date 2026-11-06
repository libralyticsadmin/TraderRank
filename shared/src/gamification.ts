export type GamificationTierKey =
  | 'tierNovice'
  | 'tierProSwing'
  | 'tierMarketVeteran'
  | 'tierApexPredator'
  | 'tierHallOfFame';

export interface GamificationTier {
  level: number;
  key: GamificationTierKey;
  defaultName: string;
  minXp: number;
  maxXp: number | null; // null for maximum tier
  color: string;
  badgeSymbol: string;
}

export const GAMIFICATION_TIERS: GamificationTier[] = [
  {
    level: 1,
    key: 'tierNovice',
    defaultName: 'Novice Trader',
    minXp: 0,
    maxXp: 1000,
    color: '#848E9C',
    badgeSymbol: 'Shield',
  },
  {
    level: 2,
    key: 'tierProSwing',
    defaultName: 'Pro Swing Trader',
    minXp: 1000,
    maxXp: 2500,
    color: '#00DAC6',
    badgeSymbol: 'Target',
  },
  {
    level: 3,
    key: 'tierMarketVeteran',
    defaultName: 'Market Veteran',
    minXp: 2500,
    maxXp: 5000,
    color: '#00F0FF',
    badgeSymbol: 'Zap',
  },
  {
    level: 4,
    key: 'tierApexPredator',
    defaultName: 'Apex Predator',
    minXp: 5000,
    maxXp: 10000,
    color: '#F0B90B',
    badgeSymbol: 'Flame',
  },
  {
    level: 5,
    key: 'tierHallOfFame',
    defaultName: 'Hall of Fame Titan',
    minXp: 10000,
    maxXp: null,
    color: '#F6465D',
    badgeSymbol: 'Trophy',
  },
];

export const XP_RULES = {
  XP_PER_TRADE: 25,
  STREAK_SCHEDULE: [
    { dayNum: 1, xp: 50, mystery: false },
    { dayNum: 2, xp: 75, mystery: false },
    { dayNum: 3, xp: 100, mystery: false },
    { dayNum: 4, xp: 150, mystery: false },
    { dayNum: 5, xp: 200, mystery: false },
    { dayNum: 6, xp: 300, mystery: false },
    { dayNum: 7, xp: 500, mystery: true },
  ],
};

export interface TraderGamificationState {
  level: number;
  tierKey: GamificationTierKey;
  tierName: string;
  color: string;
  currentXp: number;
  tierFloorXp: number;
  nextTierXp: number;
  xpRemaining: number;
  progressPct: number;
  isMaxTier: boolean;
  nextTierName: string;
  nextTierKey: GamificationTierKey;
}

/**
 * Single source of truth for calculating Trader XP, Level, Tier, and Next-Level Milestones.
 *
 * Rules:
 *  - 0 XP -> Level 1 Novice Trader (0 / 1,000 XP, 0% progress)
 *  - 1,000 to 2,499 XP -> Level 2 Pro Swing Trader (target 2,500 XP)
 *  - 2,500 to 4,999 XP -> Level 3 Market Veteran (target 5,000 XP)
 *  - 5,000 to 9,999 XP -> Level 4 Apex Predator (target 10,000 XP)
 *  - 10,000+ XP (e.g. 13,275 XP) -> Level 5 Hall of Fame Titan (Prestige Master)
 */
export function calculateTraderGamification(xp: number = 0): TraderGamificationState {
  const safeXp = Math.max(0, Math.floor(typeof xp === 'number' && !isNaN(xp) ? xp : 0));

  let currentTier = GAMIFICATION_TIERS[0];
  for (let i = GAMIFICATION_TIERS.length - 1; i >= 0; i--) {
    if (safeXp >= GAMIFICATION_TIERS[i].minXp) {
      currentTier = GAMIFICATION_TIERS[i];
      break;
    }
  }

  const isMaxTier = currentTier.maxXp === null;
  const tierFloorXp = currentTier.minXp;
  // For Level 5, the next milestone target is 15,000 XP or max progress
  const nextTierXp = isMaxTier ? Math.max(15000, safeXp) : currentTier.maxXp!;

  const progressSpan = Math.max(1, nextTierXp - tierFloorXp);
  const progressPct = isMaxTier
    ? Math.min(100, Math.round(((safeXp - tierFloorXp) / progressSpan) * 100))
    : Math.min(100, Math.max(0, Math.round(((safeXp - tierFloorXp) / progressSpan) * 100)));

  const xpRemaining = isMaxTier ? 0 : Math.max(0, nextTierXp - safeXp);

  const nextTier = !isMaxTier
    ? GAMIFICATION_TIERS.find(t => t.level === currentTier.level + 1) || null
    : null;

  return {
    level: currentTier.level,
    tierKey: currentTier.key,
    tierName: currentTier.defaultName,
    color: currentTier.color,
    currentXp: safeXp,
    tierFloorXp,
    nextTierXp,
    xpRemaining,
    progressPct,
    isMaxTier,
    nextTierName: nextTier ? nextTier.defaultName : 'Hall of Fame Grandmaster',
    nextTierKey: nextTier ? nextTier.key : 'tierHallOfFame',
  };
}

export interface StreakDayStatus {
  dayNum: number;
  xpText: string;
  xpAmount: number;
  claimed: boolean;
  current: boolean;
  locked: boolean;
  mystery?: boolean;
}

/**
 * Returns streak day status based on array of claimed day numbers (e.g. [1, 2] or [] for new user).
 */
export function getStreakStatus(claimedDays: number[] = []): StreakDayStatus[] {
  const claimedSet = new Set(claimedDays);
  // Next active day is the lowest day not claimed (starting at 1)
  let activeDayNum = 1;
  for (let d = 1; d <= 7; d++) {
    if (!claimedSet.has(d)) {
      activeDayNum = d;
      break;
    }
  }

  return XP_RULES.STREAK_SCHEDULE.map(item => {
    const isClaimed = claimedSet.has(item.dayNum);
    const isCurrent = !isClaimed && item.dayNum === activeDayNum;
    const isLocked = !isClaimed && item.dayNum > activeDayNum;

    return {
      dayNum: item.dayNum,
      xpText: `+${item.xp} XP`,
      xpAmount: item.xp,
      claimed: isClaimed,
      current: isCurrent,
      locked: isLocked,
      mystery: item.mystery,
    };
  });
}
