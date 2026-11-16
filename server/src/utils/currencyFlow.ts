/**
 * TraderRank Server Canonical Currency Flow Utility
 * Strictly enforces:
 * - XMTrading / Japan servers -> JPY (¥)
 * - XMGlobal / XM -> USD ($)
 */

export type SupportedCurrency = 'JPY' | 'USD' | 'EUR' | 'GBP';

export const resolveBrokerCurrency = (
  broker?: string | null,
  serverName?: string | null,
  explicitCurrency?: string | null,
  accountNumber?: string | null
): string => {
  const b = (broker || '').toUpperCase();
  const s = (serverName || '').toUpperCase();
  const c = (explicitCurrency || '').toUpperCase();
  const acc = String(accountNumber || '').replace(/^TraderRank-/i, '').trim();

  // 1. XMTrading (Japan JPY) or account 72423906 is strictly JPY
  if (
    b === 'XMTRADING' ||
    s.includes('XMTRADING') ||
    s.includes('JAPAN') ||
    s.includes('JPY') ||
    acc === '72423906' ||
    c === 'JPY' ||
    c === '¥'
  ) {
    return 'JPY';
  }

  // 2. XMGlobal is strictly USD ($)
  if (b === 'XM' || b.includes('XMGLOBAL') || s.includes('XMGLOBAL') || acc === '342186831') {
    return 'USD';
  }

  // 3. Explicit currency if provided
  if (c === 'USD' || c === 'EUR' || c === 'GBP') {
    return c;
  }

  return 'USD';
};

export const resolveCurrency = (
  currency?: string | null,
  fallback: SupportedCurrency = 'USD'
): string => {
  if (!currency || typeof currency !== 'string') return fallback;
  const clean = currency.trim().toUpperCase();
  if (clean === 'JPY' || clean === 'USD' || clean === 'EUR' || clean === 'GBP') {
    return clean;
  }
  return clean || fallback;
};

export const isJpyCurrency = (currency?: string | null): boolean => {
  if (!currency) return false;
  const clean = currency.trim().toUpperCase();
  return clean === 'JPY' || clean === '¥';
};

export const getCurrencySymbol = (currency?: string | null): string => {
  const code = (currency || '').trim().toUpperCase();
  switch (code) {
    case 'JPY':
      return '¥';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'USD':
    default:
      return code === 'JPY' ? '¥' : '$';
  }
};
