import { Broker } from '../types.ts';

export interface BrokerPartnerInfo {
  broker: Broker;
  displayName: string;
  affiliateUrl: string;
  partnerCode: string;
  badgeText: string;
  keyPerks: string[];
  subAccountGuide: {
    steps: string[];
    note: string;
  };
}

export const BROKER_PARTNERS: Record<Broker, BrokerPartnerInfo> = {
  IC_MARKETS: {
    broker: 'IC_MARKETS',
    displayName: 'IC Markets / IC Trading',
    affiliateUrl: 'https://www.ic.com/en/?camp=57406',
    partnerCode: '57406',
    badgeText: 'Official Raw Spread Partner',
    keyPerks: [
      '0.0 Pip Raw ECN Spreads with Ultra-Low Latency',
      'Instant Auto-Verification on TradeRank.live',
      'Free Entry to $10,000 Global Gold Rush Tournament',
      '100% Zero-Write Investor Password Protection',
    ],
    subAccountGuide: {
      steps: [
        'Log into your IC Markets Secure Client Area',
        'Navigate to "Accounts" → Click "Open an Additional Live Account"',
        'Choose MT4 or MT5 (Raw Spread recommended)',
        'In Live Chat or Help Ticket, request: "Please link this sub-account to IB: 57406"',
      ],
      note: 'Account linking usually completes within 15 minutes during trading days.',
    },
  },
  Exness: {
    broker: 'Exness',
    displayName: 'Exness Pro',
    affiliateUrl: 'https://one.exness-track.com/a/traderrank',
    partnerCode: 'TRADERANK',
    badgeText: 'Instant Withdrawals & Pro Leverage',
    keyPerks: [
      'Zero Overnight Swap on Major Pairs & Gold',
      'Instant Automated Verification via REST or MT5 Gateway',
      'Eligible for Weekly FX Blitz Cash Prize Pools',
      'Negative Balance Protection & Raw Spread Feeds',
    ],
    subAccountGuide: {
      steps: [
        'Log in to your Exness Personal Area',
        'On the main dashboard, click "Open New Account"',
        'Select "Real Account" and your preferred currency/leverage',
        'Enter Partner Code "TRADERANK" in the partner field if prompted',
      ],
      note: 'New MT5 sub-accounts are active instantly with zero waiting period.',
    },
  },
  XM: {
    broker: 'XM',
    displayName: 'XM Global',
    affiliateUrl: 'https://clicks.pipaffiliates.com/c?c=traderrank',
    partnerCode: 'TRADERANK',
    badgeText: 'Tier-1 Regulated Multi-Asset Broker',
    keyPerks: [
      'No Requotes, Instant Execution & Ultra Low Spreads',
      'Automatic Inclusion in All Monthly Prop Gauntlets',
      'Full Normalization on TradeRank Leaderboard',
      'Investor Password Safe (No Deposit/Withdrawal Access)',
    ],
    subAccountGuide: {
      steps: [
        'Log in to the XM Member Area',
        'Click "Open Additional Account" from the Quick Menu',
        'Select MT4/MT5 and Ultra Low or Standard type',
        'The account will automatically inherit partner affiliation benefits',
      ],
      note: 'Existing XM users do not need to re-verify KYC documents for sub-accounts.',
    },
  },
  Axiory: {
    broker: 'Axiory',
    displayName: 'Axiory Global',
    affiliateUrl: 'https://www.axiory.com/?partner=traderrank',
    partnerCode: 'TRADERANK',
    badgeText: 'Segregated Client Funds & Low Spreads',
    keyPerks: [
      'High-Speed Equinix London & Tokyo Servers',
      'Direct Normalization with TradeRank Pip Calculator',
      'Podium Cash Match Eligibility on Community Sprints',
      'Comprehensive Islamic / Swap-Free Option Available',
    ],
    subAccountGuide: {
      steps: [
        'Log in to MyAxiory Portal',
        'Click "+ Add Account" under Live Accounts tab',
        'Select MT5 or MT4 Platform and Nano / Standard account',
        'Enter Referral / Partner Code: "TRADERANK"',
      ],
      note: 'Sub-account credentials arrive immediately via secure email.',
    },
  },
  Vantage: {
    broker: 'Vantage',
    displayName: 'Vantage Markets',
    affiliateUrl: 'https://www.vantagemarkets.com/forex-trading/open-live-account/?affid=traderrank',
    partnerCode: 'TRADERANK',
    badgeText: 'Multi-Asset Institutional Liquidity',
    keyPerks: [
      'RAW ECN Spreads starting from 0.0 pips',
      'Eligible for $500 Weekly Blitz Cash Pool',
      'Institutional SMC Order Flow Feeds Integration',
      '100% Read-Only Safety Protocol',
    ],
    subAccountGuide: {
      steps: [
        'Log in to the Vantage Client Portal',
        'Click "Accounts" → "Live Accounts" → "Open Additional Account"',
        'Choose MetaTrader 5 or MetaTrader 4',
        'Specify Partner/Affiliate code "TRADERANK" to enable contest perks',
      ],
      note: 'Connect in seconds with your investor password once created.',
    },
  },
  OTHER: {
    broker: 'OTHER',
    displayName: 'Any MetaTrader Broker',
    affiliateUrl: 'https://www.ic.com/en/?camp=57406',
    partnerCode: '57406',
    badgeText: 'Universal Read-Only Gateway',
    keyPerks: [
      'Supports any regulated MT4 or MT5 broker worldwide',
      'Zero-Write physical trade execution blocking',
      'Standard Leaderboard participation',
      'Instant real-time performance tracking',
    ],
    subAccountGuide: {
      steps: [
        'We recommend opening an account with our official partner IC Markets or Exness for zero spread trading',
        'Alternatively, use your existing broker MT4/MT5 investor password',
        'Enter server name, login ID, and investor password in the connection form',
      ],
      note: 'TradeRank never asks for or accepts trading passwords or funds.',
    },
  },
};
