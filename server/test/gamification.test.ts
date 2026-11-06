import { describe, it, expect } from 'vitest';
import {
  calculateTraderGamification,
  getStreakStatus,
  GAMIFICATION_TIERS,
  XP_RULES,
} from '../../shared/src/gamification.ts';

describe('Gamification System & Number Alignment', () => {
  it('starts fresh user at 0 XP -> Level 1 Novice Trader', () => {
    const res = calculateTraderGamification(0);
    expect(res.level).toBe(1);
    expect(res.tierKey).toBe('tierNovice');
    expect(res.tierName).toBe('Novice Trader');
    expect(res.currentXp).toBe(0);
    expect(res.tierFloorXp).toBe(0);
    expect(res.nextTierXp).toBe(1000);
    expect(res.xpRemaining).toBe(1000);
    expect(res.progressPct).toBe(0);
    expect(res.isMaxTier).toBe(false);
    expect(res.nextTierKey).toBe('tierProSwing');
  });

  it('handles Level 2: Pro Swing Trader (1,000 to 2,499 XP)', () => {
    const res = calculateTraderGamification(1500);
    expect(res.level).toBe(2);
    expect(res.tierKey).toBe('tierProSwing');
    expect(res.tierName).toBe('Pro Swing Trader');
    expect(res.tierFloorXp).toBe(1000);
    expect(res.nextTierXp).toBe(2500);
    expect(res.xpRemaining).toBe(1000);
    // 500 / 1500 = 33%
    expect(res.progressPct).toBe(33);
  });

  it('handles Level 3: Market Veteran (2,500 to 4,999 XP)', () => {
    const res = calculateTraderGamification(3750);
    expect(res.level).toBe(3);
    expect(res.tierKey).toBe('tierMarketVeteran');
    expect(res.tierName).toBe('Market Veteran');
    expect(res.tierFloorXp).toBe(2500);
    expect(res.nextTierXp).toBe(5000);
    expect(res.xpRemaining).toBe(1250);
    expect(res.progressPct).toBe(50);
  });

  it('handles Level 4: Apex Predator (5,000 to 9,999 XP)', () => {
    const res = calculateTraderGamification(7500);
    expect(res.level).toBe(4);
    expect(res.tierKey).toBe('tierApexPredator');
    expect(res.tierName).toBe('Apex Predator');
    expect(res.tierFloorXp).toBe(5000);
    expect(res.nextTierXp).toBe(10000);
    expect(res.xpRemaining).toBe(2500);
    expect(res.progressPct).toBe(50);
  });

  it('correctly maps 13,275 XP (531 trades * 25) to Level 5 Hall of Fame Titan (NOT Level 3)', () => {
    const xp = 531 * XP_RULES.XP_PER_TRADE; // 13,275 XP
    const res = calculateTraderGamification(xp);
    expect(res.level).toBe(5);
    expect(res.tierKey).toBe('tierHallOfFame');
    expect(res.tierName).toBe('Hall of Fame Titan');
    expect(res.tierFloorXp).toBe(10000);
    expect(res.isMaxTier).toBe(true);
    expect(res.currentXp).toBe(13275);
  });

  it('computes daily login streak starting at Day 1 Active for new users', () => {
    const streak = getStreakStatus([]);
    expect(streak).toHaveLength(7);
    expect(streak[0].dayNum).toBe(1);
    expect(streak[0].claimed).toBe(false);
    expect(streak[0].current).toBe(true);
    expect(streak[0].locked).toBe(false);
    expect(streak[0].xpAmount).toBe(50);

    // Days 2 to 7 should be locked
    for (let i = 1; i < 7; i++) {
      expect(streak[i].claimed).toBe(false);
      expect(streak[i].current).toBe(false);
      expect(streak[i].locked).toBe(true);
    }
  });

  it('advances streak correctly when days are claimed', () => {
    const streak = getStreakStatus([1, 2]);
    expect(streak[0].claimed).toBe(true);
    expect(streak[1].claimed).toBe(true);
    expect(streak[2].dayNum).toBe(3);
    expect(streak[2].current).toBe(true);
    expect(streak[2].locked).toBe(false);
    expect(streak[3].locked).toBe(true);
  });
});

