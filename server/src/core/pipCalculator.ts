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
    clean = clean.replace(/(\.M|\.I|\.RAW|\.PRO|\.ECN|\.CASH|_I|_M|_SB|\+)$/i, '');

    // Common aliases
    if (clean === 'XAUUSD' || clean === 'GOLD') return 'XAUUSD';
    if (clean === 'XAGUSD' || clean === 'SILVER') return 'XAGUSD';
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
