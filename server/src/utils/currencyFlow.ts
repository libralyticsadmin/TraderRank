/**
 * TraderRank Server Canonical Currency Flow Utility
 */

export type SupportedCurrency = 'JPY' | 'USD' | 'EUR' | 'GBP';

export const resolveCurrency = (
  currency?: string | null,
  fallback: SupportedCurrency = 'JPY'
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
