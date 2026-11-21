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
  explicitCurrency?: string | null
): string => {
  const b = (broker || '').toUpperCase();
  const s = (serverName || '').toUpperCase();
  const c = (explicitCurrency || '').trim().toUpperCase();

  // 1. Explicit real currency from broker / MetaApi always takes priority
  if (c === 'JPY' || c === '¥') {
    return 'JPY';
  }
  if (c === 'USD' || c === 'EUR' || c === 'GBP') {
    return c;
  }

  // 2. Fallback to broker/server convention when explicit currency is unavailable
  if (
    b === 'XMTRADING' ||
    s.includes('XMTRADING') ||
    s.includes('JAPAN') ||
    s.includes('JPY')
  ) {
    return 'JPY';
  }

  if (b === 'XM' || b.includes('XMGLOBAL') || s.includes('XMGLOBAL')) {
    return 'USD';
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
