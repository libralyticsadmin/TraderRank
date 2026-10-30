/**
 * TraderRank Multi-Asset Pip P&L Calculation Engine
 * Benchmarked against Myfxbook, MetaQuotes, and FTMO precision standards.
 */

import { OrderType } from '../../../shared/src/types.js';

export interface InstrumentPipConfig {
  pipSize: number; // The price change that constitutes 1 pip
  digits: number; // Standard decimal precision
  category: 'forex_standard' | 'forex_jpy' | 'metals' | 'indices' | 'crypto' | 'commodities';
}

/**
 * Standard registry for asset classes and pip specifications.
 */
export class PipCalculator {
  private static readonly PIP_CONFIGS: Record<string, InstrumentPipConfig> = {
    // Standard 5-digit Forex
    EURUSD: { pipSize: 0.0001, digits: 5, category: 'forex_standard' },
    GBPUSD: { pipSize: 0.0001, digits: 5, category: 'forex_standard' },
    AUDUSD: { pipSize: 0.0001, digits: 5, category: 'forex_standard' },
    NZDUSD: { pipSize: 0.0001, digits: 5, category: 'forex_standard' },
    USDCAD: { pipSize: 0.0001, digits: 5, category: 'forex_standard' },
    USDCHF: { pipSize: 0.0001, digits: 5, category: 'forex_standard' },
    EURGBP: { pipSize: 0.0001, digits: 5, category: 'forex_standard' },
    EURAUD: { pipSize: 0.0001, digits: 5, category: 'forex_standard' },
    GBPAUD: { pipSize: 0.0001, digits: 5, category: 'forex_standard' },

    // JPY Pairs (3-digit)
    USDJPY: { pipSize: 0.01, digits: 3, category: 'forex_jpy' },
    EURJPY: { pipSize: 0.01, digits: 3, category: 'forex_jpy' },
    GBPJPY: { pipSize: 0.01, digits: 3, category: 'forex_jpy' },
    AUDJPY: { pipSize: 0.01, digits: 3, category: 'forex_jpy' },
    CADJPY: { pipSize: 0.01, digits: 3, category: 'forex_jpy' },
    CHFJPY: { pipSize: 0.01, digits: 3, category: 'forex_jpy' },

    // Metals
    XAUUSD: { pipSize: 0.10, digits: 2, category: 'metals' }, // Gold: $0.10 = 1 pip
    GOLD: { pipSize: 0.10, digits: 2, category: 'metals' },
    XAGUSD: { pipSize: 0.01, digits: 3, category: 'metals' }, // Silver: $0.01 = 1 pip
    SILVER: { pipSize: 0.01, digits: 3, category: 'metals' },

    // Indices (1 index point = 1 pip)
    US30: { pipSize: 1.0, digits: 1, category: 'indices' },
    DJ30: { pipSize: 1.0, digits: 1, category: 'indices' },
    NAS100: { pipSize: 1.0, digits: 1, category: 'indices' },
    USTEC: { pipSize: 1.0, digits: 1, category: 'indices' },
    SPX500: { pipSize: 1.0, digits: 2, category: 'indices' },
    US500: { pipSize: 1.0, digits: 2, category: 'indices' },
    GER40: { pipSize: 1.0, digits: 1, category: 'indices' },
    UK100: { pipSize: 1.0, digits: 1, category: 'indices' },

    // Crypto ($1.00 price move = 1 pip)
    BTCUSD: { pipSize: 1.0, digits: 2, category: 'crypto' },
    ETHUSD: { pipSize: 1.0, digits: 2, category: 'crypto' },

    // Energies / Commodities
    USOIL: { pipSize: 0.01, digits: 2, category: 'commodities' },
    UKOIL: { pipSize: 0.01, digits: 2, category: 'commodities' },
    XTIUSD: { pipSize: 0.01, digits: 2, category: 'commodities' },
    MCL1: { pipSize: 0.01, digits: 2, category: 'commodities' },
    'MCL1!': { pipSize: 0.01, digits: 2, category: 'commodities' },
    OIL: { pipSize: 0.01, digits: 2, category: 'commodities' },
    WTI: { pipSize: 0.01, digits: 2, category: 'commodities' },
  };

  /**
   * Cleans broker-specific suffixes, e.g.:
   * "EURUSD.m" -> "EURUSD"
   * "XAUUSD_i" -> "XAUUSD"
   * "US30.cash" -> "US30"
   */
  public static normalizeSymbol(rawSymbol: string): string {
    if (!rawSymbol) return 'UNKNOWN';
    let clean = rawSymbol.toUpperCase().trim();

    // Strip common broker suffixes
    clean = clean.replace(/(\.M|\.I|\.RAW|\.PRO|\.ECN|\.CASH|_I|_M|_SB|\+|#)$/i, '');

    // Common aliases
    if (clean === 'XAUUSD' || clean === 'GOLD') return 'XAUUSD';
    if (clean === 'XAGUSD' || clean === 'SILVER') return 'XAGUSD';
    if (clean === 'MCL1!' || clean === 'MCL1' || clean === 'MCL' || clean === 'USOIL' || clean === 'WTI' || clean === 'OIL' || clean === 'CL') return 'MCL1!';
    if (clean === 'DJ30' || clean === 'WALLSTREET30' || clean === 'US30') return 'US30';
    if (clean === 'USTEC' || clean === 'NAS100' || clean === 'US100') return 'NAS100';
    if (clean === 'US500' || clean === 'SPX500') return 'SPX500';

    return clean;
  }

  /**
   * Resolves the pip size for any instrument, including unknown instruments by fallback heuristics.
   */
  public static getPipConfig(rawSymbol: string): InstrumentPipConfig {
    const symbol = this.normalizeSymbol(rawSymbol);

    if (this.PIP_CONFIGS[symbol]) {
      return this.PIP_CONFIGS[symbol];
    }

    // Heuristics for non-standard or cross currency symbols
    if (symbol.endsWith('JPY')) {
      return { pipSize: 0.01, digits: 3, category: 'forex_jpy' };
    }

    if (symbol.startsWith('XAU') || symbol.includes('GOLD')) {
      return { pipSize: 0.10, digits: 2, category: 'metals' };
    }

    if (symbol.startsWith('BTC') || symbol.startsWith('ETH')) {
      return { pipSize: 1.0, digits: 2, category: 'crypto' };
    }

    // Default 6-char currency pair
    if (symbol.length === 6) {
      return { pipSize: 0.0001, digits: 5, category: 'forex_standard' };
    }

    // Generic fallback
    return { pipSize: 0.0001, digits: 5, category: 'forex_standard' };
  }

  /**
   * Returns standard pip value in USD per 1.00 lot for P&L calculations.
   */
  public static getPipValuePerLot(rawSymbol: string): number {
    const symbol = this.normalizeSymbol(rawSymbol);
    const config = this.getPipConfig(symbol);

    switch (config.category) {
      case 'metals':
        if (symbol === 'XAUUSD' || symbol.includes('GOLD')) {
          // 1 standard lot = 100 oz. 1 pip = $0.10. 100 * 0.10 = $10.00 USD/pip/lot
          return 10.0;
        }
        if (symbol === 'XAGUSD' || symbol.includes('SILVER')) {
          // 1 standard lot = 5000 oz. 1 pip = $0.01. 5000 * 0.01 = $50.00 USD/pip/lot
          return 50.0;
        }
        return 10.0;

      case 'forex_standard':
        // Standard forex 100k units. Quote USD (EURUSD, GBPUSD) = $10.00 USD/pip/lot
        return 10.0;

      case 'forex_jpy':
        // JPY pairs: 100k * 0.01 = 1,000 JPY ≈ $6.50 - $7.00 USD
        return 6.5;

      case 'indices':
        return 1.0;

      case 'crypto':
        return 1.0;

      case 'commodities':
        return 10.0;

      default:
        return 10.0;
    }
  }

  /**
   * Calculates profit/loss in standard pips directly from monetary P&L and lot size.
   */
  public static calculatePipsFromPnl(rawSymbol: string, lotSize: number, pnlCurrency: number): number {
    if (!lotSize || lotSize <= 0) return 0;
    const pipValPerLot = this.getPipValuePerLot(rawSymbol);
    const totalPipVal = lotSize * pipValPerLot;
    if (totalPipVal <= 0) return 0;
    return Math.round((pnlCurrency / totalPipVal) * 10) / 10;
  }

  /**
   * Reconstructs execution open price from close price, direction, volume, and realized P&L.
   */
  public static reconstructOpenPrice(
    rawSymbol: string,
    type: OrderType,
    closePrice: number,
    lotSize: number,
    pnlCurrency: number
  ): number {
    if (closePrice <= 0 || lotSize <= 0) return closePrice;
    const pips = this.calculatePipsFromPnl(rawSymbol, lotSize, pnlCurrency);
    const { pipSize } = this.getPipConfig(rawSymbol);
    const priceMove = pips * pipSize;

    // BUY: profit = (close - open) -> open = close - priceMove
    // SELL: profit = (open - close) -> open = close + priceMove
    if (type === 'BUY') {
      return Number((closePrice - priceMove).toFixed(2));
    } else {
      return Number((closePrice + priceMove).toFixed(2));
    }
  }

  /**
   * Calculates profit/loss in standard pips.
   * 
   * Directional formula:
   * BUY: (currentPrice - openPrice) / pipSize
   * SELL: (openPrice - currentPrice) / pipSize
   * 
   * Returns value rounded to 1 decimal place.
   */
  public static calculatePips(
    symbol: string,
    type: OrderType,
    openPrice: number,
    currentOrClosePrice: number
  ): number {
    if (openPrice <= 0 || currentOrClosePrice <= 0) {
      return 0;
    }

    const { pipSize } = this.getPipConfig(symbol);

    let priceDiff: number;
    if (type === 'BUY') {
      priceDiff = currentOrClosePrice - openPrice;
    } else {
      priceDiff = openPrice - currentOrClosePrice;
    }

    const pips = priceDiff / pipSize;
    // Round to 1 decimal place (e.g., 23.4)
    return Math.round(pips * 10) / 10;
  }
}
