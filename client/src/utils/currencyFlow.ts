/**
 * TraderRank Canonical Currency Flow Utility
 * Ensures single source of truth for currency resolution, symbol formatting,
 * and display rules across the entire platform.
 */

export type SupportedCurrency = 'JPY' | 'USD' | 'EUR' | 'GBP';
export type DisplayCurrencyPreference = 'AUTO' | 'USD' | 'JPY';

/**
 * Resolves currency with real broker/MetaApi explicit currency first,
 * falling back to broker/server conventions when explicit currency is absent:
 * - Explicit broker currency (JPY/USD/EUR/GBP) -> trusted first
 * - XMTrading / Japan servers -> JPY (¥)
 * - XMGlobal / XM / others -> USD ($)
 */
export const resolveBrokerCurrency = (
  broker?: string | null,
  serverName?: string | null,
  explicitCurrency?: string | null,
  accountNumber?: string | null
): string => {
  const b = (broker || '').toUpperCase();
  const s = (serverName || '').toUpperCase();
  const c = (explicitCurrency || '').trim().toUpperCase();
  const acc = String(accountNumber || '').replace(/^TraderRank-/i, '').trim();

  // 1. Explicit currency from broker / MetaApi always takes priority
  if (c === 'JPY' || c === '¥') {
    return 'JPY';
  }
  if (c === 'USD' || c === 'EUR' || c === 'GBP') {
    return c;
  }

  // 2. Fallback to broker/server convention
  if (
    b === 'XMTRADING' ||
    s.includes('XMTRADING') ||
    s.includes('JAPAN') ||
    s.includes('JPY') ||
    acc === '72423906'
  ) {
    return 'JPY';
  }

  if (b === 'XM' || b.includes('XMGLOBAL') || s.includes('XMGLOBAL') || acc === '342186831') {
    return 'USD';
  }

  return 'USD';
};

/**
 * Converts and formats an amount from its native broker currency into the user's
 * chosen display preference ('AUTO' keeps native broker currency; 'USD'/'JPY' converts via live usdJpyRate).
 */
export const formatDisplayCurrency = (
  amountNative: number,
  nativeCurrency: string | null | undefined,
  preference: DisplayCurrencyPreference = 'AUTO',
  usdJpyRate: number = 155,
  options?: {
    showSign?: boolean;
    showCode?: boolean;
    spaceBeforeCode?: boolean;
  }
): string => {
  const safeAmount = Number.isFinite(amountNative) ? amountNative : 0;
  const safeRate = Number.isFinite(usdJpyRate) && usdJpyRate > 0 ? usdJpyRate : 155;
  const nativeCode = resolveCurrency(nativeCurrency, 'USD');

  if (!preference || preference === 'AUTO' || preference === nativeCode) {
    return formatCurrency(safeAmount, nativeCode, options);
  }

  if (preference === 'USD' && nativeCode === 'JPY') {
    return formatCurrency(safeAmount / safeRate, 'USD', options);
  }

  if (preference === 'JPY' && nativeCode === 'USD') {
    return formatCurrency(safeAmount * safeRate, 'JPY', options);
  }

  return formatCurrency(safeAmount, nativeCode, options);
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
  const code = resolveCurrency(currency, 'USD');
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

