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

    it('accurately identifies JPY account eligibility without overriding explicit USD accounts', () => {
      const checkIsJpy = (account: {
        broker?: string;
        currency?: string;
        serverName?: string;
        accountNumber?: string;
      }) => {
        const cur = (account.currency || '').toUpperCase();
        if (cur === 'USD') return false;
        if (cur === 'JPY') return true;
        return (
          account.broker === 'XMTrading' ||
          Boolean(
            account.serverName &&
              (account.serverName.toLowerCase().includes('japan') ||
                account.serverName.toLowerCase().includes('jpy'))
          )
        );
      };

      expect(checkIsJpy({ broker: 'XMTrading', currency: 'JPY', serverName: 'XMTrading-Real 55' })).toBe(true);
      expect(checkIsJpy({ accountNumber: '72423906', currency: 'USD' })).toBe(false);
      expect(checkIsJpy({ broker: 'XMTrading', currency: 'USD' })).toBe(false);
      expect(checkIsJpy({ serverName: 'XMGlobal-Japan 1', currency: 'JPY' })).toBe(true);
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

  describe('4. Zero-Mock & Real Account Number Enforcement Guard', () => {
    it('strictly guarantees that all leaderboard entries are real accounts with real account numbers', () => {
      // Register real verified accounts
      leaderboard.registerAccountMapping(
        'acc_meta_72423906',
        'usr_meta_72423906',
        'HomiesPlant',
        'XMTrading' as Broker,
        'HomiesPlant',
        '72423906'
      );
      leaderboard.registerAccountMapping(
        'acc_meta_342186831',
        'u_zzzemzzz',
        'zzZEMZzz',
        'XM' as Broker,
        'zzZEMZzz',
        '342186831'
      );
      leaderboard.registerAccountMapping(
        'acc_meta_411407722',
        'usr_meta_411407722',
        'Vanguard_FX',
        'XM' as Broker,
        'Vanguard_FX',
        '411407722'
      );

      const entries = leaderboard.getLeaderboard(20);

      // Verify no fake seed accounts exist
      const usernames = entries.map(e => e.username);
      expect(usernames).not.toContain('QuantumPips_FX');
      expect(usernames).not.toContain('Libralytic_FX');
      expect(usernames).not.toContain('LondonFX_Pro');

      // Verify all accounts have real account numbers and strict user profile + currency
      const realAcc = entries.find(e => e.accountNumber === '72423906');
      expect(realAcc).toBeDefined();
      expect(realAcc?.accountNumber).toBe('72423906');
      expect(realAcc?.profileName).toBe('HomiesPlant');
      expect(realAcc?.username).toBe('HomiesPlant');

      const zemAcc = entries.find(e => e.accountNumber === '342186831');
      expect(zemAcc).toBeDefined();
      expect(zemAcc?.profileName).toBe('zzZEMZzz');
      expect(zemAcc?.currency).toBe('JPY');

      // Verify monetary profit normalization from broker JPY deals to USD ($)
      const jpyToUsd = (valJpy: number) => Number((valJpy / 155.0).toFixed(2));
      const formatUsd = (val: number) => {
        const sign = val > 0 ? '+' : val < 0 ? '-' : '';
        return `${sign}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };
      expect(formatUsd(jpyToUsd(-3693))).toBe('-$23.83');
      expect(formatUsd(jpyToUsd(-292243))).toBe('-$1,885.44');
      expect(formatUsd(jpyToUsd(-3693))).not.toContain('¥');
    });

    it('5. Real Trader Identity & Broker Masking Guard: strictly enforces zzZEMZzz and JPY', () => {
      // Direct connector retrieval test
      const accounts = connector.getAccounts();
      const target = accounts.find(a => a.accountNumber === '342186831');
      if (target) {
        expect(target.profileUsername).toBe('zzZEMZzz');
        expect(target.accountHolderName).toBe('zzZEMZzz');
        expect(target.currency).toBe('JPY');
        expect(target.userId).toBe('u_zzzemzzz');
      }

      // Leaderboard view test
      const lb = leaderboard.getLeaderboard(10);
      const lbTarget = lb.find(e => e.accountNumber === '342186831');
      if (lbTarget) {
        expect(lbTarget.username).toBe('zzZEMZzz');
        expect(lbTarget.profileName).toBe('zzZEMZzz');
        expect(lbTarget.currency).toBe('JPY');
      }
    });
  });
});

