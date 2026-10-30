import { CandlestickBar, CandlestickTimeframe } from '../../../shared/src/types.ts';

export interface SymbolMarketMetadata {
  basePrice: number;
  decimals: number;
  tickVolatility: number;
  spread: number;
}

export const SYMBOL_METADATA_MAP: Record<string, SymbolMarketMetadata> = {
  USDJPY: { basePrice: 157.480, decimals: 3, tickVolatility: 0.015, spread: 0.003 },
  EURUSD: { basePrice: 1.11870, decimals: 5, tickVolatility: 0.00010, spread: 0.00003 },
  GBPUSD: { basePrice: 1.33890, decimals: 5, tickVolatility: 0.00012, spread: 0.00005 },
  AUDUSD: { basePrice: 0.70320, decimals: 5, tickVolatility: 0.00010, spread: 0.00004 },
  USDCAD: { basePrice: 1.39720, decimals: 5, tickVolatility: 0.00012, spread: 0.00005 },
  XAUUSD: { basePrice: 3982.60, decimals: 2, tickVolatility: 0.55, spread: 0.25 },
  GOLD: { basePrice: 3982.60, decimals: 2, tickVolatility: 0.55, spread: 0.25 },
  'MCL1!': { basePrice: 103.25, decimals: 2, tickVolatility: 0.05, spread: 0.03 },
  USOIL: { basePrice: 103.25, decimals: 2, tickVolatility: 0.05, spread: 0.03 },
  BTCUSD: { basePrice: 78500.00, decimals: 2, tickVolatility: 10.0, spread: 5.0 },
  US30: { basePrice: 52300.00, decimals: 2, tickVolatility: 4.0, spread: 2.0 },
};

export const getTimeframeDurationSeconds = (timeframe: CandlestickTimeframe): number => {
  switch (timeframe) {
    case '1m': return 60;
    case '5m': return 300;
    case '15m': return 900;
    case '30m': return 1800;
    case '1h': return 3600;
    case '4h': return 14400;
    case '1D': return 86400;
    case '1W': return 604800;
    case '1M': return 2592000;
    default: return 60;
  }
};

export const getSymbolMetadata = (symbol: string): SymbolMarketMetadata => {
  return SYMBOL_METADATA_MAP[symbol] || {
    basePrice: 1.11444,
    decimals: 5,
    tickVolatility: 0.0001,
    spread: 0.00012,
  };
};

/**
 * Generates high-fidelity, realistic institutional candlestick historical series
 * with support/resistance waves, liquidity sweeps, and realistic volume profiles.
 */
export const generateRealisticCandles = (
  symbol: string,
  timeframe: CandlestickTimeframe,
  count = 80,
  anchorPrice?: number
): CandlestickBar[] => {
  const meta = getSymbolMetadata(symbol);
  const targetAnchor = typeof anchorPrice === 'number' && anchorPrice > 0 ? anchorPrice : meta.basePrice;
  const tfSec = getTimeframeDurationSeconds(timeframe);
  const nowSec = Math.floor(Date.now() / 1000);
  const currentBoundary = Math.floor(nowSec / tfSec) * tfSec;

  // Cap timeframe volatility multiplier so multi-day/month frames don't blow out
  const tfVolMultiplier = Math.min(5.5, Math.sqrt(tfSec / 60));
  const barVolatility = meta.tickVolatility * tfVolMultiplier * 1.8;

  // Multi-harmonic cycle seed for natural technical market structure
  let currentPrice = targetAnchor;
  const cycle1 = 28 + Math.floor(Math.random() * 8);
  const cycle2 = 12 + Math.floor(Math.random() * 4);
  const drift = (Math.random() - 0.48) * 0.0008 * targetAnchor;

  const rawPrices: { open: number; close: number; high: number; low: number; volume: number; timestamp: number }[] = [];

  // Generate backwards from past to present
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = currentBoundary - i * tfSec;
    const wave =
      Math.sin((i / cycle1) * Math.PI * 2) * barVolatility * 1.2 +
      Math.cos((i / cycle2) * Math.PI * 2) * barVolatility * 0.6;
    const noise = (Math.random() - 0.49) * barVolatility;

    const open = currentPrice;
    let close = open + wave * 0.4 + noise + drift * 0.05;
    close = Math.max(0.0001, Number(close.toFixed(meta.decimals)));

    const bodyHigh = Math.max(open, close);
    const bodyLow = Math.min(open, close);
    const wickHigh = Math.random() * barVolatility * 0.45;
    const wickLow = Math.random() * barVolatility * 0.45;

    const high = Number((bodyHigh + wickHigh).toFixed(meta.decimals));
    const low = Math.max(0.0001, Number((bodyLow - wickLow).toFixed(meta.decimals)));
    const volume = Math.floor(350 + Math.random() * 1800 + (Math.abs(close - open) / barVolatility) * 1200);

    rawPrices.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  // Anchor the current active candle strictly to the benchmark price with realistic tight wicks
  if (rawPrices.length > 0) {
    const last = rawPrices[rawPrices.length - 1];
    last.close = targetAnchor;
    const maxWick = barVolatility * 0.4;
    last.high = Number((Math.max(last.open, targetAnchor) + Math.random() * maxWick * 0.5).toFixed(meta.decimals));
    last.low = Number((Math.min(last.open, targetAnchor) - Math.random() * maxWick * 0.5).toFixed(meta.decimals));
  }

  return rawPrices;
};

/**
 * Applies a micro-tick to the candlestick bar series.
 * If the current timeframe interval has completed, automatically seals the candle
 * and opens a new live candle; otherwise updates the active candle in real time.
 */
export const applyLiveTick = (
  currentBars: CandlestickBar[],
  symbol: string,
  timeframe: CandlestickTimeframe,
  externalPrice?: number
): CandlestickBar[] => {
  if (!currentBars || currentBars.length === 0) {
    return generateRealisticCandles(symbol, timeframe, 80);
  }

  const meta = getSymbolMetadata(symbol);
  const tfSec = getTimeframeDurationSeconds(timeframe);
  const nowSec = Math.floor(Date.now() / 1000);
  const currentBoundary = Math.floor(nowSec / tfSec) * tfSec;

  const next = [...currentBars];
  const lastBar = next[next.length - 1];

  // If time has crossed into the next timeframe candle boundary, open a new candle
  if (currentBoundary > lastBar.timestamp) {
    const newOpen = lastBar.close;
    const newBar: CandlestickBar = {
      timestamp: currentBoundary,
      open: newOpen,
      high: newOpen,
      low: newOpen,
      close: newOpen,
      volume: Math.floor(15 + Math.random() * 25),
    };
    next.push(newBar);
    if (next.length > 120) {
      next.shift();
    }
    return next;
  }

  // Otherwise, fluctuate the current active bar
  let newClose: number;
  if (typeof externalPrice === 'number' && !isNaN(externalPrice) && externalPrice > 0) {
    // Oscillate with realistic micro-spread tick around active live quote so bar stays alive
    const microJitter = (Math.random() - 0.5) * (meta.tickVolatility * 0.2);
    const target = externalPrice + microJitter;
    newClose = Number(target.toFixed(meta.decimals));
  } else {
    // Mean-reverting micro-jitter bounded tightly around lastBar.close (anti-drift, no jumps)
    const anchor = lastBar.close;
    const microJitter = (Math.random() - 0.5) * (meta.tickVolatility * 0.15);
    const target = anchor + microJitter;
    newClose = Math.max(0.0001, Number(target.toFixed(meta.decimals)));
  }

  const newHigh = Number(Math.max(lastBar.high, newClose).toFixed(meta.decimals));
  const newLow = Number(Math.min(lastBar.low, newClose).toFixed(meta.decimals));
  const newVol = lastBar.volume + Math.floor(1 + Math.random() * 4);

  next[next.length - 1] = {
    ...lastBar,
    close: newClose,
    high: newHigh,
    low: newLow,
    volume: newVol,
  };

  return next;
};
