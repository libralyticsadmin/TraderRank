/**
 * TraderRank Multi-Broker Symbol & Schema Normalizer
 * Sanitizes broker ticker variations (suffixes like .ecn, .r, _i, m, micro)
 * and normalizes asset classes, pip sizes, digits, and timestamps.
 */

export type AssetClass = 'FOREX' | 'COMMODITY' | 'CRYPTO' | 'INDEX';

export interface NormalizedSymbolMetadata {
  rawSymbol: string;
  canonicalSymbol: string;
  assetClass: AssetClass;
  pipSize: number;
  digits: number;
  contractSize: number;
}

export class SymbolNormalizer {
  private static instance: SymbolNormalizer;

  public static getInstance(): SymbolNormalizer {
    if (!SymbolNormalizer.instance) {
      SymbolNormalizer.instance = new SymbolNormalizer();
    }
    return SymbolNormalizer.instance;
  }

  /**
   * Sanitizes broker-specific suffixes and prefixes.
   * Examples:
   *  - 'EURUSDm' (Exness) -> 'EURUSD'
   *  - 'EURUSD.ecn' (Axiory) -> 'EURUSD'
   *  - 'EURUSD.r' (Vantage) -> 'EURUSD'
   *  - 'EURUSD_i' (XM) -> 'EURUSD'
   *  - 'XAUUSDm' (Exness) -> 'XAUUSD'
   *  - 'BTCUSD.ecn' -> 'BTCUSD'
   */
  public sanitizeSymbol(raw: string): string {
    if (!raw) return 'UNKNOWN';
    let clean = raw.trim().toUpperCase();

    // Strip common suffixes: .ecn, .r, .pro, .std, _i, #, +, micro, m
    clean = clean.replace(/(\.ECN|\.R|\.PRO|\.STD|\.RAW|_I|MICRO|\#|\+)$/i, '');

    // Exness standard mini/micro symbol suffix: e.g. EURUSDm or XAUUSDm (length 7 ending with M)
    if (clean.length >= 7 && clean.endsWith('M') && !clean.startsWith('MCL')) {
      clean = clean.slice(0, -1);
    }

    return clean;
  }

  /**
   * Identifies asset class from canonical symbol.
   */
  public detectAssetClass(canonical: string): AssetClass {
    const s = canonical.toUpperCase();

    // Metals
    if (s.startsWith('XAU') || s.startsWith('XAG') || s.startsWith('XPT') || s.startsWith('XPD') || s.includes('GOLD') || s.includes('SILVER')) {
      return 'COMMODITY'; // Gold / Silver
    }

    // Commodities / Oil
    if (s.includes('OIL') || s.includes('BRENT') || s.includes('WTI') || s.includes('NGAS') || s.includes('MCL') || s.includes('CL')) {
      return 'COMMODITY';
    }

    // Crypto
    if (s.startsWith('BTC') || s.startsWith('ETH') || s.startsWith('SOL') || s.startsWith('XRP') || s.startsWith('LTC')) {
      return 'CRYPTO';
    }

    // Indices
    if (s.includes('US30') || s.includes('US500') || s.includes('NAS100') || s.includes('GER40') || s.includes('UK100') || s.includes('JP225')) {
      return 'INDEX';
    }

    // Default to FX for 6-character currencies
    return 'FOREX';
  }

  /**
   * Resolves pip size, contract size and decimal digits.
   */
  public getSymbolMetadata(rawSymbol: string): NormalizedSymbolMetadata {
    const canonical = this.sanitizeSymbol(rawSymbol);
    const assetClass = this.detectAssetClass(canonical);

    if (assetClass === 'CRYPTO') {
      return {
        rawSymbol,
        canonicalSymbol: canonical,
        assetClass,
        pipSize: 1.0,
        digits: 2,
        contractSize: 1,
      };
    }

    if (assetClass === 'COMMODITY') {
      const isGold = canonical.includes('XAU') || canonical.includes('GOLD');
      return {
        rawSymbol,
        canonicalSymbol: canonical,
        assetClass,
        pipSize: isGold ? 0.1 : 0.01,
        digits: isGold ? 2 : 3,
        contractSize: isGold ? 100 : 5000,
      };
    }

    if (assetClass === 'INDEX') {
      return {
        rawSymbol,
        canonicalSymbol: canonical,
        assetClass,
        pipSize: 1.0,
        digits: 2,
        contractSize: 10,
      };
    }

    // Forex: JPY pairs vs standard pairs
    const isJpy = canonical.endsWith('JPY');
    return {
      rawSymbol,
      canonicalSymbol: canonical,
      assetClass: 'FOREX',
      pipSize: isJpy ? 0.01 : 0.0001,
      digits: isJpy ? 3 : 5,
      contractSize: 100000,
    };
  }

  /**
   * Calculates profit in pips.
   */
  public calculatePips(canonicalSymbol: string, openPrice: number, closePrice: number, type: 'BUY' | 'SELL'): number {
    const meta = this.getSymbolMetadata(canonicalSymbol);
    const diff = type === 'BUY' ? closePrice - openPrice : openPrice - closePrice;
    return Number((diff / meta.pipSize).toFixed(1));
  }

  /**
   * Normalizes timestamps into ISO8601 UTC.
   */
  public normalizeTimestamp(ts: string | number | Date): string {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
}
