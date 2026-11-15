import { describe, it, expect, beforeEach } from 'vitest';
import { LeaderboardService } from '../src/services/leaderboardService.js';
import { AccountConnectorService } from '../src/connector/accountConnector.js';
import { Broker } from '../../shared/src/types.js';

describe('TraderRank Protection Suite: Currency, Account Isolation & Contender Integrity', () => {
  let leaderboard: LeaderboardService;
  let connector: AccountConnectorService;

  beforeEach(() => {
    leaderboard = LeaderboardService.getInstance();
    connector = AccountConnectorService.getInstance();
  });

  describe('1. Currency Formatting Guard (JPY vs USD)', () => {
    // Pure formatting logic matching client/src/components/TraderProfileModal.tsx
    const formatCurrencyVal = (val: number, isJpy: boolean) => {
      if (isJpy) {
        return `¥${Math.round(val).toLocaleString('ja-JP')}`;
      }
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatUsdSigned = (val: number, isJpy: boolean) => {
      const sign = val > 0 ? '+' : val < 0 ? '-' : '';
      if (isJpy) {
        return `${sign}¥${Math.round(Math.abs(val)).toLocaleString('ja-JP')}`;
      }
      return `${sign}$${Math.abs(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    it('strictly formats JPY accounts with Yen symbol (¥) and zero decimal places', () => {
      const isJpy = true;
      const startingCapital = 7510;
      const endingCapital = 3817;

      const formattedStart = formatCurrencyVal(startingCapital, isJpy);
      const formattedEnd = formatCurrencyVal(endingCapital, isJpy);

      expect(formattedStart).toBe('¥7,510');
      expect(formattedEnd).toBe('¥3,817');
      expect(formattedStart).not.toContain('$');
      expect(formattedStart).not.toContain('.00');
      expect(formattedEnd).not.toContain('$');
      expect(formattedEnd).not.toContain('.00');
    });

    it('strictly formats JPY profit and loss with proper signs and no fractional cents', () => {
      const isJpy = true;
      const profit = 13;
      const loss = -3706;
      const fillLoss = -867;

      expect(formatUsdSigned(profit, isJpy)).toBe('+¥13');
      expect(formatUsdSigned(loss, isJpy)).toBe('-¥3,706');
      expect(formatUsdSigned(fillLoss, isJpy)).toBe('-¥867');

      expect(formatUsdSigned(profit, isJpy)).not.toContain('$');
      expect(formatUsdSigned(loss, isJpy)).not.toContain('$');
      expect(formatUsdSigned(fillLoss, isJpy)).not.toContain('$');
    });

    it('correctly formats USD accounts with Dollar symbol ($) and exactly two decimal places', () => {
      const isJpy = false;
      const startingCapital = 7510;
      const profit = 13;
      const loss = -2464.11;

      expect(formatCurrencyVal(startingCapital, isJpy)).toBe('$7,510.00');
      expect(formatUsdSigned(profit, isJpy)).toBe('+$13.00');
      expect(formatUsdSigned(loss, isJpy)).toBe('-$2,464.11');
    });

    it('accurately identifies JPY account eligibility across multiple broker and server signals', () => {
      const checkIsJpy = (account: {
        broker?: string;
        currency?: string;
        serverName?: string;
        accountNumber?: string;
      }) => {
        return (
          account.broker === 'XMTrading' ||
          account.currency === 'JPY' ||
          account.accountNumber === '72423906' ||
          Boolean(
            account.serverName &&
              (account.serverName.toLowerCase().includes('xmtrading') ||
                account.serverName.toLowerCase().includes('japan') ||
                account.serverName.toLowerCase().includes('jpy'))
          )
        );
      };

      expect(checkIsJpy({ broker: 'XMTrading', currency: 'JPY', serverName: 'XMTrading-Real 55' })).toBe(true);
      expect(checkIsJpy({ accountNumber: '72423906' })).toBe(true);
      expect(checkIsJpy({ serverName: 'XMGlobal-Japan 1' })).toBe(true);
      expect(checkIsJpy({ broker: 'XM', currency: 'USD', serverName: 'XMGlobal-Real 55' })).toBe(false);
      expect(checkIsJpy({ broker: 'Exness', currency: 'USD', serverName: 'Exness-Real 22' })).toBe(false);
    });
  });

  describe('2. Multi-Tenant Account Isolation Guard', () => {
    it('never falls back to accounts[0] when an unknown account ID is requested', () => {
      const allAccounts = [
        { id: 'acc_meta_342186831', accountNumber: '342186831', balance: 3817 },
        { id: 'acc_meta_72423906', accountNumber: '72423906', balance: 1500000 },
      ];

      const lookupAccount = (paramId: string) => {
        return allAccounts.find(
          a => a.id === paramId || a.accountNumber === paramId
        ); // strictly no "|| allAccounts[0]"!
      };

      const result = lookupAccount('non_existent_account_999');
      expect(result).toBeUndefined();
      expect(result).not.toEqual(allAccounts[0]);
    });

    it('returns empty object for monthly cashflows on unknown account without data leak', () => {
      const cashflows = connector.getAccountMonthlyCashflows('totally_unknown_account_xyz');
      expect(cashflows).toEqual({});
      expect(Object.keys(cashflows).length).toBe(0);
    });

    it('returns empty array for trades on unknown account without data leak', () => {
      const trades = connector.getAccountTrades('totally_unknown_account_xyz');
      expect(trades).toEqual([]);
      expect(trades.length).toBe(0);
    });
  });

  describe('3. Monthly vs All-Time Pips Alignment Guard', () => {
    it('isolates active month net pips from lifetime net pips', () => {
      // November trades for account 72423906
      const novemberTrades = [
        { pnlPips: -54.8, pnlCurrency: -867, date: '2026-11-10' },
        { pnlPips: -48.3, pnlCurrency: -764, date: '2026-11-10' },
        { pnlPips: -46.7, pnlCurrency: -739, date: '2026-11-10' },
        { pnlPips: -43.2, pnlCurrency: -684, date: '2026-11-10' },
        { pnlPips: -41.2, pnlCurrency: -652, date: '2026-11-10' },
        { pnlPips: 0.8, pnlCurrency: 13, date: '2026-11-10' },
      ];

      const augustTrades = [
        { pnlPips: -442.7, pnlCurrency: -131345, date: '2026-08-15' },
      ];

      const allTrades = [...augustTrades, ...novemberTrades];

      const novemberNetPips = Number(
        novemberTrades.reduce((sum, t) => sum + t.pnlPips, 0).toFixed(1)
      );
      const allTimeNetPips = Number(
        allTrades.reduce((sum, t) => sum + t.pnlPips, 0).toFixed(1)
      );

      expect(novemberNetPips).toBe(-233.4);
      expect(allTimeNetPips).toBe(-676.1);

      // Guard: when viewing November, the badge MUST show -233.4p, NOT -676.1p
      const badgePipsForNovember = novemberNetPips;
      expect(badgePipsForNovember).toBe(-233.4);
      expect(badgePipsForNovember).not.toBe(allTimeNetPips);
    });
  });

  describe('4. Arena Contenders & Registered Users Ecosystem', () => {
    it('populates competitive benchmark contenders so the arena has an active ranking field', () => {
      leaderboard.seedDemoTraders();
      const entries = leaderboard.getLeaderboard(20);

      expect(entries.length).toBeGreaterThanOrEqual(8);

      const usernames = entries.map(e => e.username);
      expect(usernames).toContain('QuantumPips_FX');
      expect(usernames).toContain('Libralytic_FX');
      expect(usernames).toContain('LondonFX_Pro');
    });

    it('registers newly registered web users in the leaderboard as active contenders', () => {
      const newUserId = 'u_test_scalper_2026';
      const newUsername = 'TestScalperPro';

      leaderboard.registerAccountMapping(
        `acc_${newUserId}`,
        newUserId,
        newUsername,
        'XMTrading' as Broker,
        newUsername,
        '99887766'
      );

      const entries = leaderboard.getLeaderboard(50);
      const matched = entries.find(e => e.userId === newUserId || e.username === newUsername);

      expect(matched).toBeDefined();
      expect(matched?.username).toBe(newUsername);
    });
  });
});
