import { CandlestickBar } from '../../../shared/src/types.ts';

/**
 * 1. Simple Moving Average (SMA)
 */
export function calculateSMA(bars: CandlestickBar[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += bars[i - j].close;
    }
    result.push(sum / period);
  }
  return result;
}

/**
 * 2. Exponential Moving Average (EMA)
 */
export function calculateEMA(bars: CandlestickBar[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);

  if (bars.length < period) {
    return bars.map(() => null);
  }

  // First EMA is SMA of initial `period` bars
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += bars[i].close;
    result.push(null);
  }

  let prevEMA = sum / period;
  result[period - 1] = prevEMA;

  for (let i = period; i < bars.length; i++) {
    const currentEMA = bars[i].close * k + prevEMA * (1 - k);
    result.push(currentEMA);
    prevEMA = currentEMA;
  }

  return result;
}

/**
 * 3. Bollinger Bands (BB)
 */
export interface BollingerBandsResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export function calculateBollingerBands(
  bars: CandlestickBar[],
  period: number = 20,
  stdDevMultiplier: number = 2.0
): BollingerBandsResult {
  const middle = calculateSMA(bars, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < bars.length; i++) {
    const sma = middle[i];
    if (sma === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }

    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      const diff = bars[i - j].close - sma;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper.push(sma + stdDevMultiplier * stdDev);
    lower.push(sma - stdDevMultiplier * stdDev);
  }

  return { upper, middle, lower };
}

/**
 * 4. Relative Strength Index (RSI)
 */
export function calculateRSI(bars: CandlestickBar[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (bars.length < period + 1) {
    return bars.map(() => null);
  }

  const changes: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    changes.push(bars[i].close - bars[i - 1].close);
  }

  result.push(null); // bar 0

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
    result.push(null);
  }

  avgGain /= period;
  avgLoss /= period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  result[period] = rsi;

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
    result.push(rsi);
  }

  return result;
}

/**
 * 5. Moving Average Convergence Divergence (MACD)
 */
export interface MACDResult {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
}

export function calculateMACD(
  bars: CandlestickBar[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const fastEMA = calculateEMA(bars, fastPeriod);
  const slowEMA = calculateEMA(bars, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push((fastEMA[i] as number) - (slowEMA[i] as number));
    }
  }

  // Calculate signal line as EMA of macdLine
  const validMacdValues = macdLine.filter((v): v is number => v !== null);
  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];

  const k = 2 / (signalPeriod + 1);
  let initialCount = 0;
  let prevSignal: number | null = null;

  for (let i = 0; i < macdLine.length; i++) {
    const mVal = macdLine[i];
    if (mVal === null) {
      signalLine.push(null);
      histogram.push(null);
      continue;
    }

    initialCount++;
    if (initialCount < signalPeriod) {
      signalLine.push(null);
      histogram.push(null);
    } else if (initialCount === signalPeriod) {
      // SMA of first `signalPeriod` macd values
      let sum = 0;
      for (let j = 0; j < signalPeriod; j++) {
        sum += validMacdValues[j];
      }
      prevSignal = sum / signalPeriod;
      signalLine.push(prevSignal);
      histogram.push(mVal - prevSignal);
    } else {
      const currentSignal: number = mVal * k + (prevSignal as number) * (1 - k);
      signalLine.push(currentSignal);
      histogram.push(mVal - currentSignal);
      prevSignal = currentSignal;
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * 6. Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(bars: CandlestickBar[]): (number | null)[] {
  const result: (number | null)[] = [];
  let cumulativeTypicalVol = 0;
  let cumulativeVol = 0;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    const vol = bar.volume > 0 ? bar.volume : 1;

    cumulativeTypicalVol += typicalPrice * vol;
    cumulativeVol += vol;

    result.push(cumulativeVol > 0 ? cumulativeTypicalVol / cumulativeVol : bar.close);
  }

  return result;
}

/**
 * 7. Average True Range (ATR)
 */
export function calculateATR(bars: CandlestickBar[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (bars.length === 0) return result;

  const trueRanges: number[] = [bars[0].high - bars[0].low];
  for (let i = 1; i < bars.length; i++) {
    const h = bars[i].high;
    const l = bars[i].low;
    const prevC = bars[i - 1].close;
    const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    trueRanges.push(tr);
  }

  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      sum += trueRanges[i];
      result.push(null);
    } else if (i === period - 1) {
      sum += trueRanges[i];
      result.push(sum / period);
    } else {
      const prevATR = result[i - 1] as number;
      const currentATR = (prevATR * (period - 1) + trueRanges[i]) / period;
      result.push(currentATR);
    }
  }

  return result;
}

/**
 * 8. SuperTrend
 */
export interface SuperTrendResult {
  trendLine: (number | null)[];
  direction: (1 | -1 | null)[]; // 1 = Bullish (Green), -1 = Bearish (Red)
}

export function calculateSuperTrend(
  bars: CandlestickBar[],
  period: number = 10,
  multiplier: number = 3.0
): SuperTrendResult {
  const atr = calculateATR(bars, period);
  const trendLine: (number | null)[] = [];
  const direction: (1 | -1 | null)[] = [];

  let prevUpper = 0;
  let prevLower = 0;
  let currentDir: 1 | -1 = 1;

  for (let i = 0; i < bars.length; i++) {
    const currentAtr = atr[i];
    if (currentAtr === null) {
      trendLine.push(null);
      direction.push(null);
      continue;
    }

    const hl2 = (bars[i].high + bars[i].low) / 2;
    let basicUpper = hl2 + multiplier * currentAtr;
    let basicLower = hl2 - multiplier * currentAtr;

    const prevClose = i > 0 ? bars[i - 1].close : bars[i].close;

    let finalUpper = basicUpper < prevUpper || prevClose > prevUpper ? basicUpper : prevUpper;
    let finalLower = basicLower > prevLower || prevClose < prevLower ? basicLower : prevLower;

    if (currentDir === 1 && bars[i].close < finalLower) {
      currentDir = -1;
    } else if (currentDir === -1 && bars[i].close > finalUpper) {
      currentDir = 1;
    }

    direction.push(currentDir);
    trendLine.push(currentDir === 1 ? finalLower : finalUpper);

    prevUpper = finalUpper;
    prevLower = finalLower;
  }

  return { trendLine, direction };
}

/**
 * 9. Stochastic Oscillator (%K, %D)
 */
export interface StochasticResult {
  k: (number | null)[];
  d: (number | null)[];
}

export function calculateStochastic(
  bars: CandlestickBar[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticResult {
  const rawK: (number | null)[] = [];

  for (let i = 0; i < bars.length; i++) {
    if (i < kPeriod - 1) {
      rawK.push(null);
      continue;
    }

    let minLow = Infinity;
    let maxHigh = -Infinity;

    for (let j = 0; j < kPeriod; j++) {
      const b = bars[i - j];
      if (b.low < minLow) minLow = b.low;
      if (b.high > maxHigh) maxHigh = b.high;
    }

    const range = maxHigh - minLow || 0.0001;
    const kVal = ((bars[i].close - minLow) / range) * 100;
    rawK.push(Math.max(0, Math.min(100, kVal)));
  }

  // Calculate %D as SMA of %K
  const d: (number | null)[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < kPeriod - 1 + dPeriod - 1) {
      d.push(null);
      continue;
    }

    let sum = 0;
    let validCount = 0;
    for (let j = 0; j < dPeriod; j++) {
      const val = rawK[i - j];
      if (val !== null) {
        sum += val;
        validCount++;
      }
    }
    d.push(validCount === dPeriod ? sum / dPeriod : null);
  }

  return { k: rawK, d };
}

/**
 * 10. Parabolic SAR (Stop and Reverse)
 */
export function calculateParabolicSAR(
  bars: CandlestickBar[],
  step: number = 0.02,
  maxStep: number = 0.20
): (number | null)[] {
  const sar: (number | null)[] = [];
  if (bars.length < 2) return bars.map(() => null);

  let isBull = bars[1].close >= bars[0].close;
  let af = step;
  let ep = isBull ? Math.max(bars[0].high, bars[1].high) : Math.min(bars[0].low, bars[1].low);
  let currentSar = isBull ? Math.min(bars[0].low, bars[1].low) : Math.max(bars[0].high, bars[1].high);

  sar.push(null);
  sar.push(currentSar);

  for (let i = 2; i < bars.length; i++) {
    let nextSar = currentSar + af * (ep - currentSar);

    if (isBull) {
      nextSar = Math.min(nextSar, bars[i - 1].low, bars[i - 2].low);
      if (bars[i].low < nextSar) {
        // Trend Reversal to Bear
        isBull = false;
        nextSar = ep;
        ep = bars[i].low;
        af = step;
      } else {
        if (bars[i].high > ep) {
          ep = bars[i].high;
          af = Math.min(maxStep, af + step);
        }
      }
    } else {
      nextSar = Math.max(nextSar, bars[i - 1].high, bars[i - 2].high);
      if (bars[i].high > nextSar) {
        // Trend Reversal to Bull
        isBull = true;
        nextSar = ep;
        ep = bars[i].high;
        af = step;
      } else {
        if (bars[i].low < ep) {
          ep = bars[i].low;
          af = Math.min(maxStep, af + step);
        }
      }
    }

    sar.push(nextSar);
    currentSar = nextSar;
  }

  return sar;
}

/**
 * 11. Smart Money Concepts (SMC): Break of Structure (BOS) & Change of Character (CHoCH)
 */
export type SwingType = 'HH' | 'LH' | 'LL' | 'HL';

export interface SwingPoint {
  index: number;
  price: number;
  type: 'HIGH' | 'LOW';
  structureType: SwingType;
  timestamp: number;
}

export type StructureBreakType = 'BULLISH_BOS' | 'BEARISH_BOS' | 'BULLISH_CHOCH' | 'BEARISH_CHOCH';

export interface StructureBreakEvent {
  type: StructureBreakType;
  label: string;
  brokenIndex: number;
  brokenPrice: number;
  breakoutIndex: number;
  breakoutPrice: number;
  isBullish: boolean;
}

export interface BOSResult {
  swings: SwingPoint[];
  breaks: StructureBreakEvent[];
  trend: 'BULLISH' | 'BEARISH' | 'RANGING';
}

export function calculateSwingPoints(
  bars: CandlestickBar[],
  left: number = 3,
  right: number = 3
): SwingPoint[] {
  const swings: SwingPoint[] = [];
  if (bars.length < left + right + 1) return swings;

  let lastHigh: number | null = null;
  let lastLow: number | null = null;

  for (let i = left; i < bars.length - right; i++) {
    const currentHigh = bars[i].high;
    const currentLow = bars[i].low;

    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= left; j++) {
      if (bars[i - j].high >= currentHigh) isHigh = false;
      if (bars[i - j].low <= currentLow) isLow = false;
    }
    for (let j = 1; j <= right; j++) {
      if (bars[i + j].high > currentHigh) isHigh = false;
      if (bars[i + j].low < currentLow) isLow = false;
    }

    if (isHigh) {
      let structureType: SwingType = 'HH';
      if (lastHigh !== null) {
        structureType = currentHigh > lastHigh ? 'HH' : 'LH';
      }
      lastHigh = currentHigh;
      swings.push({
        index: i,
        price: currentHigh,
        type: 'HIGH',
        structureType,
        timestamp: bars[i].timestamp,
      });
    }

    if (isLow) {
      let structureType: SwingType = 'LL';
      if (lastLow !== null) {
        structureType = currentLow > lastLow ? 'HL' : 'LL';
      }
      lastLow = currentLow;
      swings.push({
        index: i,
        price: currentLow,
        type: 'LOW',
        structureType,
        timestamp: bars[i].timestamp,
      });
    }
  }

  return swings;
}

export function calculateBOSAndCHoCH(
  bars: CandlestickBar[],
  swingLeft: number = 3,
  swingRight: number = 3
): BOSResult {
  const swings = calculateSwingPoints(bars, swingLeft, swingRight);
  const breaks: StructureBreakEvent[] = [];

  if (swings.length === 0) {
    return { swings: [], breaks: [], trend: 'RANGING' };
  }

  let currentTrend: 'BULLISH' | 'BEARISH' = swings[0].type === 'HIGH' ? 'BEARISH' : 'BULLISH';

  const swingHighs = swings.filter(s => s.type === 'HIGH');
  const swingLows = swings.filter(s => s.type === 'LOW');

  for (const sh of swingHighs) {
    for (let i = sh.index + swingRight + 1; i < bars.length; i++) {
      if (bars[i].close > sh.price) {
        const isChoch = currentTrend === 'BEARISH';
        breaks.push({
          type: isChoch ? 'BULLISH_CHOCH' : 'BULLISH_BOS',
          label: isChoch ? '+CHoCH' : '+BOS',
          brokenIndex: sh.index,
          brokenPrice: sh.price,
          breakoutIndex: i,
          breakoutPrice: bars[i].close,
          isBullish: true,
        });
        currentTrend = 'BULLISH';
        break;
      }
    }
  }

  for (const sl of swingLows) {
    for (let i = sl.index + swingRight + 1; i < bars.length; i++) {
      if (bars[i].close < sl.price) {
        const isChoch = currentTrend === 'BULLISH';
        breaks.push({
          type: isChoch ? 'BEARISH_CHOCH' : 'BEARISH_BOS',
          label: isChoch ? '-CHoCH' : '-BOS',
          brokenIndex: sl.index,
          brokenPrice: sl.price,
          breakoutIndex: i,
          breakoutPrice: bars[i].close,
          isBullish: false,
        });
        currentTrend = 'BEARISH';
        break;
      }
    }
  }

  breaks.sort((a, b) => a.breakoutIndex - b.breakoutIndex);

  return {
    swings,
    breaks,
    trend: currentTrend,
  };
}

/**
 * 12. Smart Money Concepts (SMC): Supply & Demand Zones (Institutional Order Blocks)
 */
export interface SupplyDemandZone {
  id: string;
  type: 'DEMAND' | 'SUPPLY';
  topPrice: number;
  bottomPrice: number;
  startIndex: number;
  endIndex: number;
  originPrice: number;
  status: 'FRESH' | 'TESTED' | 'MITIGATED';
  testCount: number;
  strength: number;
  color: string;
}

export interface SupplyDemandResult {
  zones: SupplyDemandZone[];
  activeDemandZones: SupplyDemandZone[];
  activeSupplyZones: SupplyDemandZone[];
}

export function calculateDemandSupplyZones(
  bars: CandlestickBar[],
  swingLeft: number = 3,
  swingRight: number = 3,
  maxZones: number = 8
): SupplyDemandResult {
  const bos = calculateBOSAndCHoCH(bars, swingLeft, swingRight);
  const rawZones: SupplyDemandZone[] = [];

  for (const brk of bos.breaks) {
    if (brk.isBullish) {
      let lowestIdx = brk.brokenIndex;
      let minLow = Infinity;
      for (let k = Math.max(0, brk.brokenIndex - 3); k < brk.breakoutIndex; k++) {
        if (bars[k].low < minLow) {
          minLow = bars[k].low;
          lowestIdx = k;
        }
      }

      const baseCandle = bars[lowestIdx];
      const range = baseCandle.high - baseCandle.low || 0.001;
      const topPrice = Math.max(baseCandle.open, baseCandle.close, baseCandle.low + range * 0.6);
      const bottomPrice = baseCandle.low;

      let status: 'FRESH' | 'TESTED' | 'MITIGATED' = 'FRESH';
      let testCount = 0;
      for (let m = brk.breakoutIndex + 1; m < bars.length; m++) {
        const testBar = bars[m];
        if (testBar.low <= topPrice && testBar.high >= bottomPrice) {
          testCount++;
          if (testBar.close < bottomPrice) {
            status = 'MITIGATED';
          } else {
            status = 'TESTED';
          }
        }
      }

      rawZones.push({
        id: `demand_${lowestIdx}_${Math.floor(bottomPrice * 100)}`,
        type: 'DEMAND',
        topPrice,
        bottomPrice,
        startIndex: lowestIdx,
        endIndex: bars.length - 1,
        originPrice: baseCandle.close,
        status,
        testCount,
        strength: status === 'FRESH' ? 9 : status === 'TESTED' ? 6 : 2,
        color: '#0abab5',
      });
    } else {
      let highestIdx = brk.brokenIndex;
      let maxHigh = -Infinity;
      for (let k = Math.max(0, brk.brokenIndex - 3); k < brk.breakoutIndex; k++) {
        if (bars[k].high > maxHigh) {
          maxHigh = bars[k].high;
          highestIdx = k;
        }
      }

      const baseCandle = bars[highestIdx];
      const range = baseCandle.high - baseCandle.low || 0.001;
      const topPrice = baseCandle.high;
      const bottomPrice = Math.min(baseCandle.open, baseCandle.close, baseCandle.high - range * 0.6);

      let status: 'FRESH' | 'TESTED' | 'MITIGATED' = 'FRESH';
      let testCount = 0;
      for (let m = brk.breakoutIndex + 1; m < bars.length; m++) {
        const testBar = bars[m];
        if (testBar.high >= bottomPrice && testBar.low <= topPrice) {
          testCount++;
          if (testBar.close > topPrice) {
            status = 'MITIGATED';
          } else {
            status = 'TESTED';
          }
        }
      }

      rawZones.push({
        id: `supply_${highestIdx}_${Math.floor(topPrice * 100)}`,
        type: 'SUPPLY',
        topPrice,
        bottomPrice,
        startIndex: highestIdx,
        endIndex: bars.length - 1,
        originPrice: baseCandle.close,
        status,
        testCount,
        strength: status === 'FRESH' ? 9 : status === 'TESTED' ? 6 : 2,
        color: '#ef4444',
      });
    }
  }

  // Deduplicate and filter overlapping zones
  const uniqueZones: SupplyDemandZone[] = [];
  for (const z of rawZones) {
    const isDup = uniqueZones.some(
      existing =>
        existing.type === z.type &&
        Math.abs(existing.topPrice - z.topPrice) / (z.topPrice || 1) < 0.0015
    );
    if (!isDup) {
      uniqueZones.push(z);
    }
  }

  const activeDemandZones = uniqueZones.filter(z => z.type === 'DEMAND' && z.status !== 'MITIGATED');
  const activeSupplyZones = uniqueZones.filter(z => z.type === 'SUPPLY' && z.status !== 'MITIGATED');

  return {
    zones: uniqueZones.slice(-maxZones),
    activeDemandZones,
    activeSupplyZones,
  };
}
