import { describe, it, expect } from 'vitest';
import { BROKER_PARTNERS } from '../../shared/src/config/brokerPartners.ts';
import {
  GAMIFICATION_REFERRAL_TIERS,
  getReferralTier,
  generateReferralUrl,
} from '../../shared/src/config/affiliateProgram.ts';

describe('TradeRank Gamification Affiliate & Broker Partner System', () => {
  it('provides official affiliate links and partner codes for all 5 partner brokers', () => {
    expect(BROKER_PARTNERS.IC_MARKETS.affiliateUrl).toContain('camp=57406');
    expect(BROKER_PARTNERS.IC_MARKETS.partnerCode).toBe('57406');
    expect(BROKER_PARTNERS.IC_MARKETS.subAccountGuide.steps.length).toBeGreaterThanOrEqual(3);

    expect(BROKER_PARTNERS.Exness.affiliateUrl).toContain('exness-track.com');
    expect(BROKER_PARTNERS.Exness.partnerCode).toBe('TRADERANK');

    expect(BROKER_PARTNERS.XM.affiliateUrl).toContain('pipaffiliates.com');
    expect(BROKER_PARTNERS.XM.partnerCode).toBe('TRADERANK');

    expect(BROKER_PARTNERS.Axiory.affiliateUrl).toContain('partner=traderrank');
    expect(BROKER_PARTNERS.Axiory.partnerCode).toBe('TRADERANK');

    expect(BROKER_PARTNERS.Vantage.affiliateUrl).toContain('affid=traderrank');
    expect(BROKER_PARTNERS.Vantage.partnerCode).toBe('TRADERANK');
  });

  it('correctly maps 0 referrals to initial Scout milestone', () => {
    const tier = getReferralTier(0);
    expect(tier.current.tierId).toBe('SCOUT');
    expect(tier.next?.tierId).toBe('SQUAD_LEADER');
    expect(tier.needed).toBe(3);
  });

  it('unlocks Squad Leader (3 referrals) with sound alerts and strategy presets', () => {
    const tier = getReferralTier(3);
    expect(tier.current.tierId).toBe('SQUAD_LEADER');
    expect(tier.current.xpReward).toBe(1500);
    expect(tier.next?.tierId).toBe('APEX_RECRUITER');
    expect(tier.needed).toBe(2);
  });

  it('unlocks Apex Recruiter (5 referrals) with CSV export and Gold Leaderboard Crest', () => {
    const tier = getReferralTier(5);
    expect(tier.current.tierId).toBe('APEX_RECRUITER');
    expect(tier.current.xpReward).toBe(3000);
    expect(tier.next?.tierId).toBe('MASTER_AMBASSADOR');
    expect(tier.needed).toBe(5);
  });

  it('unlocks Hall of Fame Ambassador (10+ referrals) with +10,000 XP and Titan Crest', () => {
    const tier = getReferralTier(10);
    expect(tier.current.tierId).toBe('MASTER_AMBASSADOR');
    expect(tier.current.xpReward).toBe(10000);
    expect(tier.next).toBeNull();
    expect(tier.needed).toBe(0);
  });

  it('generates standard referral deep-links with encoded parameters', () => {
    const url = generateReferralUrl('alex_trader');
    expect(url).toBe('https://traderank.live/?ref=alex_trader');
  });
});
