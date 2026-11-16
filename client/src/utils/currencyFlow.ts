/**
 * TraderRank Canonical Currency Flow Utility
 * Ensures single source of truth for currency resolution, symbol formatting,
 * and display rules across the entire platform.
 */

export type SupportedCurrency = 'JPY' | 'USD' | 'EUR' | 'GBP';

/**
 * Resolves currency strictly according to broker and server conventions:
 * - XMTrading / Japan servers -> strictly JPY (¥)
 * - XMGlobal / XM -> strictly USD ($)
 * - Other brokers -> explicit currency or USD ($)
 */
export const resolveBrokerCurrency = (
  broker?: string | null,
  serverName?: string | null,
  explicitCurrency?: string | null
): string => {
  const b = (broker || '').toUpperCase();
  const s = (serverName || '').toUpperCase();
  const c = (explicitCurrency || '').toUpperCase();

  // 1. XMTrading (Japan JPY) is strictly JPY
  if (b === 'XMTRADING' || s.includes('XMTRADING') || s.includes('JAPAN') || s.includes('JPY')) {
    return 'JPY';
  }

  // 2. XMGlobal is strictly USD ($)
  if (b === 'XM' || b.includes('XMGLOBAL') || s.includes('XMGLOBAL')) {
    return 'USD';
  }

  // 3. Explicit currency if provided
  if (c === 'JPY' || c === 'USD' || c === 'EUR' || c === 'GBP') {
    return c;
  }

  return 'USD';
};

/**
 * Resolves the clean uppercase currency code from account, profile, or fallback.
 */
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

/**
 * Returns whether the given currency is Japanese Yen (JPY).
 */
export const isJpyCurrency = (currency?: string | null): boolean => {
  if (!currency) return false;
  const clean = currency.trim().toUpperCase();
  return clean === 'JPY' || clean === '¥';
};

/**
 * Returns the standard currency symbol.
 */
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

/**
 * Formats a financial amount according to its currency's conventions:
 * - JPY: Whole integer only with comma grouping (e.g. ¥1,500)
 * - USD/EUR/GBP: Two decimal places with comma grouping (e.g. $15.50)
 */
export const formatCurrency = (
  amount: number,
  currency?: string | null,
  options?: {
    showSign?: boolean;
    showCode?: boolean;
    spaceBeforeCode?: boolean;
  }
): string => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const code = resolveCurrency(currency, 'JPY');
  const isJpy = isJpyCurrency(code);
  const symbol = getCurrencySymbol(code);

  const sign = options?.showSign
    ? safeAmount > 0
      ? '+'
      : safeAmount < 0
      ? '-'
      : ''
    : safeAmount < 0
    ? '-'
    : '';

  const absVal = Math.abs(safeAmount);

  let formattedNum: string;
  if (isJpy) {
    formattedNum = Math.round(absVal).toLocaleString('ja-JP');
  } else {
    formattedNum = absVal.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const baseStr = `${sign}${symbol}${formattedNum}`;
  if (options?.showCode) {
    return `${baseStr} ${code}`;
  }
  return baseStr;
};

/**
 * Formats signed profit with currency symbol (e.g. +¥1,500 or -¥800).
 */
export const formatSignedProfit = (
  amount: number,
  currency?: string | null,
  showCode = false
): string => {
  return formatCurrency(amount, currency, { showSign: true, showCode });
};

