export interface GamificationReferralTier {
  tierId: 'SCOUT' | 'SQUAD_LEADER' | 'APEX_RECRUITER' | 'MASTER_AMBASSADOR';
  name: string;
  minReferrals: number;
  xpReward: number;
  badgeName: string;
  badgeIcon: string;
  color: string;
  unlockedFeatures: string[];
}

export const GAMIFICATION_REFERRAL_TIERS: GamificationReferralTier[] = [
  {
    tierId: 'SCOUT',
    name: 'Network Scout',
    minReferrals: 1,
    xpReward: 500,
    badgeName: 'Badge of the Scout',
    badgeIcon: 'Zap',
    color: '#00DAC6',
    unlockedFeatures: [
      '+500 XP Instant Boost to your Trader Level',
      'AI Multi-Timeframe Confluence Engine (Deep 1m - 1W Matrix)',
      'Scout Badge displayed on your Verified Profile',
      'Weekly FX Blitz Tournament Priority Queue',
    ],
  },
  {
    tierId: 'SQUAD_LEADER',
    name: 'Squad Leader',
    minReferrals: 3,
    xpReward: 1500,
    badgeName: 'Squad Commander Badge',
    badgeIcon: 'Target',
    color: '#00F0FF',
    unlockedFeatures: [
      'Custom Strategic Timeframe Generator (1m - 1W) UNLOCKED',
      '+1,500 Additional XP Boost',
      'Real-Time Live Trade Sound & Visual Alerts',
      'Custom Strategy Presets Saver (Store up to 10 tactical setups)',
      'Priority Leaderboard Refresh Rate',
    ],
  },
  {
    tierId: 'APEX_RECRUITER',
    name: 'Apex Recruiter',
    minReferrals: 5,
    xpReward: 3000,
    badgeName: 'Apex Recruiter Star',
    badgeIcon: 'Flame',
    color: '#F0B90B',
    unlockedFeatures: [
      '+3,000 XP Major Boost (Accelerates to Level 4 Apex Predator)',
      'Glowing Golden Name Crest on Global Leaderboard',
      'Raw Tick Data & Trade History CSV Export Tool',
      'VIP Prop Gauntlet Tournament Free Entry Pass',
    ],
  },
  {
    tierId: 'MASTER_AMBASSADOR',
    name: 'Hall of Fame Ambassador',
    minReferrals: 10,
    xpReward: 10000,
    badgeName: 'Titan Ambassador Crest',
    badgeIcon: 'Crown',
    color: '#F6465D',
    unlockedFeatures: [
      '+10,000 XP Supreme Boost (Guaranteed Level 5 Hall of Fame Titan)',
      'Permanent Mythic Verified Ring on Avatar',
      'All Future Experimental AI Indicators & Features Unlocked Forever',
      'VIP Discord Alpha Channel & Private Strategy Hub Role',
    ],
  },
];

export interface UserReferralGamificationStats {
  userId: string;
  referralCode: string;
  referralUrl: string;
  currentTier: GamificationReferralTier;
  nextTier: GamificationReferralTier | null;
  totalClicks: number;
  totalReferrals: number;
  verifiedReferrals: number;
  totalXpEarned: number;
  referralsToNextTier: number;
  recentReferrals: Array<{
    traderUsername: string;
    broker: string;
    joinedDate: string;
    status: 'VERIFIED' | 'CONNECTED';
    xpGranted: number;
  }>;
}

export function getReferralTier(verifiedCount: number): {
  current: GamificationReferralTier;
  next: GamificationReferralTier | null;
  needed: number;
} {
  let current = GAMIFICATION_REFERRAL_TIERS[0];
  let next: GamificationReferralTier | null = GAMIFICATION_REFERRAL_TIERS[1];

  for (let i = GAMIFICATION_REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (verifiedCount >= GAMIFICATION_REFERRAL_TIERS[i].minReferrals) {
      current = GAMIFICATION_REFERRAL_TIERS[i];
      next = i < GAMIFICATION_REFERRAL_TIERS.length - 1 ? GAMIFICATION_REFERRAL_TIERS[i + 1] : null;
      break;
    }
  }

  const needed = next ? Math.max(0, next.minReferrals - verifiedCount) : 0;
  return { current, next, needed };
}

export function generateReferralUrl(referralCode: string, origin?: string): string {
  const base = origin || 'https://traderank.live';
  return `${base}/?ref=${encodeURIComponent(referralCode)}`;
}

export const CUSTOM_GENERATOR_MIN_REFERRALS = 3;

