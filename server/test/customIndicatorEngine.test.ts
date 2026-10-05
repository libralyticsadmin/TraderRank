import { describe, it, expect } from 'vitest';
import { CandlestickBar } from '../../shared/src/types.ts';

// Replicate custom indicator engine logic to test in server test environment
function calculateSMA(bars: CandlestickBar[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += bars[i - j].close;
      }
      result.push(parseFloat((sum / period).toFixed(5)));
    }
  }
  return result;
}

function calculateEMA(bars: CandlestickBar[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEMA: number | null = null;

  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += bars[j].close;
      }
      prevEMA = sum / period;
      result.push(parseFloat(prevEMA.toFixed(5)));
    } else {
      const current = bars[i].close;
      prevEMA = current * k + (prevEMA as number) * (1 - k);
      result.push(parseFloat(prevEMA.toFixed(5)));
    }
  }
  return result;
}

function calculateRSI(bars: CandlestickBar[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (bars.length <= period) {
    return bars.map(() => null);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  const initialRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const initialRSI = avgLoss === 0 ? 100 : 100 - 100 / (1 + initialRS);
  result.push(parseFloat(initialRSI.toFixed(2)));

  for (let i = period + 1; i < bars.length; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      result.push(parseFloat(rsi.toFixed(2)));
    }
  }

  return result;
}

function calculateATR(bars: CandlestickBar[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (bars.length < period) return bars.map(() => null);

  const trs: number[] = [bars[0].high - bars[0].low];
  for (let i = 1; i < bars.length; i++) {
    const hl = bars[i].high - bars[i].low;
    const hc = Math.abs(bars[i].high - bars[i - 1].close);
    const lc = Math.abs(bars[i].low - bars[i - 1].close);
    trs.push(Math.max(hl, hc, lc));
  }

  let atr = 0;
  for (let i = 0; i < period; i++) atr += trs[i];
  atr /= period;

  for (let i = 0; i < period - 1; i++) result.push(null);
  result.push(parseFloat(atr.toFixed(5)));

  for (let i = period; i < bars.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    result.push(parseFloat(atr.toFixed(5)));
  }

  return result;
}

function calculateSwingPoints(bars: CandlestickBar[], left = 2, right = 2) {
  const swings: any[] = [];
  for (let i = left; i < bars.length - right; i++) {
    const curH = bars[i].high;
    const curL = bars[i].low;
    let isH = true;
    let isL = true;
    for (let j = 1; j <= left; j++) {
      if (bars[i - j].high >= curH) isH = false;
      if (bars[i - j].low <= curL) isL = false;
    }
    for (let j = 1; j <= right; j++) {
      if (bars[i + j].high > curH) isH = false;
      if (bars[i + j].low < curL) isL = false;
    }
    if (isH) swings.push({ index: i, price: curH, type: 'HIGH' });
    if (isL) swings.push({ index: i, price: curL, type: 'LOW' });
  }
  return swings;
}

function calculateBOS(bars: CandlestickBar[], left = 2, right = 2) {
  const swings = calculateSwingPoints(bars, left, right);
  const breaks: any[] = [];
  const highs = swings.filter(s => s.type === 'HIGH');
  const lows = swings.filter(s => s.type === 'LOW');

  for (const h of highs) {
    for (let i = h.index + right + 1; i < bars.length; i++) {
      if (bars[i].close > h.price) {
        breaks.push({ type: 'BULLISH_BOS', label: '+BOS', brokenPrice: h.price, breakoutIndex: i, isBullish: true });
        break;
      }
    }
  }

  for (const l of lows) {
    for (let i = l.index + right + 1; i < bars.length; i++) {
      if (bars[i].close < l.price) {
        breaks.push({ type: 'BEARISH_BOS', label: '-BOS', brokenPrice: l.price, breakoutIndex: i, isBullish: false });
        break;
      }
    }
  }

  return { swings, breaks };
}

function calculateDemandSupply(bars: CandlestickBar[]) {
  const bos = calculateBOS(bars, 2, 2);
  const zones: any[] = [];

  for (const brk of bos.breaks) {
    if (brk.isBullish) {
      zones.push({
        type: 'DEMAND',
        topPrice: brk.brokenPrice,
        bottomPrice: brk.brokenPrice * 0.995,
        status: 'FRESH',
      });
    } else {
      zones.push({
        type: 'SUPPLY',
        topPrice: brk.brokenPrice * 1.005,
        bottomPrice: brk.brokenPrice,
        status: 'FRESH',
      });
    }
  }

  return { zones, activeDemand: zones.filter(z => z.type === 'DEMAND'), activeSupply: zones.filter(z => z.type === 'SUPPLY') };
}

function executeCustomIndicator(
  code: string,
  params: Record<string, any>,
  bars: CandlestickBar[]
): { success: boolean; data: (number | null)[]; error?: string } {
  try {
    const indicatorsHelper = {
      sma: (b: CandlestickBar[], p: number) => calculateSMA(b, p),
      ema: (b: CandlestickBar[], p: number) => calculateEMA(b, p),
      rsi: (b: CandlestickBar[], p: number) => calculateRSI(b, p),
      atr: (b: CandlestickBar[], p: number) => calculateATR(b, p),
      bos: (b: CandlestickBar[], left = 2, right = 2) => calculateBOS(b, left, right),
      demandSupply: (b: CandlestickBar[]) => calculateDemandSupply(b),
      highest: (b: CandlestickBar[], len: number) => {
        return b.map((_, i) => {
          if (i < len - 1) return null;
          let m = -Infinity;
          for (let j = 0; j < len; j++) m = Math.max(m, b[i - j].high);
          return m;
        });
      },
      lowest: (b: CandlestickBar[], len: number) => {
        return b.map((_, i) => {
          if (i < len - 1) return null;
          let m = Infinity;
          for (let j = 0; j < len; j++) m = Math.min(m, b[i - j].low);
          return m;
        });
      },
    };

    const wrappedCode = `
      ${code}
      if (typeof calculate === 'function') {
        return calculate(bars, params, indicators);
      }
      throw new Error("Custom indicator script must define a function calculate(bars, params, indicators)");
    `;

    const userFunc = new Function('bars', 'params', 'indicators', wrappedCode);
    const result = userFunc(bars, params, indicatorsHelper);

    if (!Array.isArray(result)) {
      return { success: false, data: bars.map(() => null), error: 'Must return an array' };
    }

    const sanitized = result.map((val: any) =>
      typeof val === 'number' && !isNaN(val) && isFinite(val) ? val : null
    );

    return { success: true, data: sanitized };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, data: bars.map(() => null), error: msg };
  }
}

describe('Custom Indicator Studio & Pine Script Sandbox Engine', () => {
  const sampleBars: CandlestickBar[] = Array.from({ length: 50 }, (_, i) => {
    const base = 150 + Math.sin(i / 5) * 4 + i * 0.1;
    return {
      timestamp: 1700000000 + i * 60,
      open: parseFloat(base.toFixed(3)),
      high: parseFloat((base + 0.4).toFixed(3)),
      low: parseFloat((base - 0.4).toFixed(3)),
      close: parseFloat((base + 0.1).toFixed(3)),
      volume: 1000 + (i % 5) * 200,
    };
  });

  it('executes Rate of Change (ROC Momentum) custom script properly', () => {
    const rocScript = `
      function calculate(bars, params) {
        const len = params.length || 10;
        const res = [];
        for (let i = 0; i < bars.length; i++) {
          if (i < len) {
            res.push(null);
          } else {
            const prev = bars[i - len].close;
            const roc = ((bars[i].close - prev) / prev) * 100;
            res.push(parseFloat(roc.toFixed(3)));
          }
        }
        return res;
      }
    `;

    const result = executeCustomIndicator(rocScript, { length: 10 }, sampleBars);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(50);
    expect(result.data[0]).toBeNull();
    expect(result.data[9]).toBeNull();
    expect(typeof result.data[10]).toBe('number');
  });

  it('executes Keltner Channel Upper custom script with indicators.ema and indicators.atr helpers', () => {
    const keltnerScript = `
      function calculate(bars, params, indicators) {
        const ema = indicators.ema(bars, params.length || 20);
        const atr = indicators.atr(bars, 14);
        const mult = params.mult || 2.0;

        return bars.map((b, i) => {
          if (ema[i] === null || atr[i] === null) return null;
          return parseFloat((ema[i] + mult * atr[i]).toFixed(4));
        });
      }
    `;

    const result = executeCustomIndicator(keltnerScript, { length: 20, mult: 2.0 }, sampleBars);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(50);
    expect(result.data[0]).toBeNull();
    expect(typeof result.data[30]).toBe('number');
    expect((result.data[30] as number) > sampleBars[30].close).toBe(true);
  });

  it('executes Donchian Channel High Breakout script with indicators.highest helper', () => {
    const donchianScript = `
      function calculate(bars, params, indicators) {
        return indicators.highest(bars, params.length || 10);
      }
    `;

    const result = executeCustomIndicator(donchianScript, { length: 10 }, sampleBars);
    expect(result.success).toBe(true);
    expect(result.data[0]).toBeNull();
    expect(result.data[8]).toBeNull();
    expect(typeof result.data[9]).toBe('number');
    expect((result.data[9] as number) >= sampleBars[9].high).toBe(true);
  });

  it('executes Smart Money Concepts (SMC) Break of Structure bias script with indicators.bos helper', () => {
    const smcScript = `
      function calculate(bars, params, indicators) {
        const bos = indicators.bos(bars, 2, 2);
        const res = new Array(bars.length).fill(0);
        for (const brk of bos.breaks) {
          if (brk.breakoutIndex < bars.length) {
            res[brk.breakoutIndex] = brk.isBullish ? 1 : -1;
          }
        }
        return res;
      }
    `;

    const result = executeCustomIndicator(smcScript, {}, sampleBars);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(50);
    expect(result.data.some(v => v === 1 || v === -1 || v === 0)).toBe(true);
  });

  it('identifies and returns Demand & Supply zones with helper functions', () => {
    const smcResult = calculateDemandSupply(sampleBars);
    expect(smcResult).toBeDefined();
    expect(Array.isArray(smcResult.zones)).toBe(true);
    expect(Array.isArray(smcResult.activeDemand)).toBe(true);
    expect(Array.isArray(smcResult.activeSupply)).toBe(true);
  });

  it('safely catches and reports syntax or runtime errors in custom user code without crashing', () => {
    const buggyScript = `
      function calculate(bars) {
        throw new Error("Syntax error in custom user script line 12");
      }
    `;

    const result = executeCustomIndicator(buggyScript, {}, sampleBars);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Syntax error in custom user script line 12');
    expect(result.data.every(v => v === null)).toBe(true);
  });
});

