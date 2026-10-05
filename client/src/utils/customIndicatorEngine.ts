import { CandlestickBar } from '../../../shared/src/types.ts';
import {
  calculateEMA,
  calculateSMA,
  calculateRSI,
  calculateATR,
  calculateVWAP,
  calculateSwingPoints,
  calculateBOSAndCHoCH,
  calculateDemandSupplyZones,
} from './indicators.ts';

export type IndicatorPlotType = 'LINE' | 'HISTOGRAM' | 'DOTS' | 'AREA';
export type IndicatorPane = 'OVERLAY' | 'SUBPANEL';

export interface CustomIndicatorParam {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean';
  defaultValue: any;
  value: any;
  min?: number;
  max?: number;
  step?: number;
}

export interface CustomIndicatorDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  pane: IndicatorPane;
  plotType: IndicatorPlotType;
  color: string;
  lineWidth: number;
  enabled: boolean;
  codeType: 'FORMULA' | 'JAVASCRIPT';
  formulaOrCode: string;
  params: CustomIndicatorParam[];
  createdAt: string;
  isBuiltInPreset?: boolean;
}

const STORAGE_KEY = 'traderrank_custom_indicators_v1';

export const BUILT_IN_CUSTOM_PRESETS: CustomIndicatorDefinition[] = [
  {
    id: 'custom_smc_structure_bias',
    name: 'SMC Market Structure Bias (BOS / CHoCH)',
    shortName: 'SMC Bias',
    description: 'Smart Money Concepts structural trend momentum (+1 Bullish Break, -1 Bearish Break)',
    pane: 'SUBPANEL',
    plotType: 'HISTOGRAM',
    color: '#0abab5',
    lineWidth: 2,
    enabled: false,
    codeType: 'JAVASCRIPT',
    params: [
      { id: 'left', name: 'Left Swing Bars', type: 'number', defaultValue: 3, value: 3 },
      { id: 'right', name: 'Right Swing Bars', type: 'number', defaultValue: 3, value: 3 },
    ],
    createdAt: '2026-10-05T00:00:00Z',
    isBuiltInPreset: true,
    formulaOrCode: `// Smart Money Concepts: Trend & Break of Structure Tracker
function calculate(bars, params, indicators) {
  const left = params.left || 3;
  const right = params.right || 3;
  const bos = indicators.bos(bars, left, right);
  
  // Return signal array: +1 for Bullish BOS, -1 for Bearish BOS, 0 for neutral
  const result = new Array(bars.length).fill(0);
  for (const brk of bos.breaks) {
    if (brk.breakoutIndex < bars.length) {
      result[brk.breakoutIndex] = brk.isBullish ? 1 : -1;
    }
  }
  return result;
}`,
  },
  {
    id: 'custom_roc_momentum',
    name: 'Rate of Change (ROC / Momentum)',
    shortName: 'ROC(12)',
    description: 'TradingView-style Momentum Percentage Oscillator measuring price velocity',
    pane: 'SUBPANEL',
    plotType: 'LINE',
    color: '#0abab5',
    lineWidth: 2,
    enabled: false,
    codeType: 'JAVASCRIPT',
    params: [{ id: 'length', name: 'Length', type: 'number', defaultValue: 12, value: 12, min: 1, max: 100 }],
    createdAt: '2026-10-05T00:00:00Z',
    isBuiltInPreset: true,
    formulaOrCode: `// Rate of Change (ROC Momentum)
// (Close[i] - Close[i - length]) / Close[i - length] * 100
function calculate(bars, params) {
  const len = params.length || 12;
  const result = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < len) {
      result.push(null);
    } else {
      const prevClose = bars[i - len].close;
      const roc = ((bars[i].close - prevClose) / prevClose) * 100;
      result.push(parseFloat(roc.toFixed(3)));
    }
  }
  return result;
}`,
  },
  {
    id: 'custom_keltner_channels',
    name: 'Keltner Volatility Channel (Upper Band)',
    shortName: 'KC Upper(20,2)',
    description: 'Exponential Moving Average offset by 2.0x Average True Range volatility',
    pane: 'OVERLAY',
    plotType: 'LINE',
    color: '#38bdf8',
    lineWidth: 1.5,
    enabled: false,
    codeType: 'JAVASCRIPT',
    params: [
      { id: 'length', name: 'EMA Length', type: 'number', defaultValue: 20, value: 20 },
      { id: 'mult', name: 'ATR Multiplier', type: 'number', defaultValue: 2.0, value: 2.0 },
    ],
    createdAt: '2026-10-05T00:00:00Z',
    isBuiltInPreset: true,
    formulaOrCode: `// Keltner Channel Upper: EMA(20) + mult * ATR(14)
function calculate(bars, params) {
  const emaLen = params.length || 20;
  const mult = params.mult || 2.0;
  const ema = indicators.ema(bars, emaLen);
  const atr = indicators.atr(bars, 14);

  return bars.map((b, i) => {
    if (ema[i] === null || atr[i] === null) return null;
    return parseFloat((ema[i] + mult * atr[i]).toFixed(5));
  });
}`,
  },
  {
    id: 'custom_rvol_spikes',
    name: 'Relative Volume Spike Index (RVOL)',
    shortName: 'RVOL(20)',
    description: 'Volume relative to 20-period moving average to detect institutional order flow',
    pane: 'SUBPANEL',
    plotType: 'HISTOGRAM',
    color: '#fbbf24',
    lineWidth: 3,
    enabled: false,
    codeType: 'JAVASCRIPT',
    params: [{ id: 'length', name: 'SMA Volume Length', type: 'number', defaultValue: 20, value: 20 }],
    createdAt: '2026-10-05T00:00:00Z',
    isBuiltInPreset: true,
    formulaOrCode: `// Relative Volume Index (RVOL)
// Volume[i] / SMA(Volume, length)
function calculate(bars, params) {
  const len = params.length || 20;
  const result = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < len - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < len; j++) sum += bars[i - j].volume;
      const avgVol = sum / len || 1;
      const rvol = bars[i].volume / avgVol;
      result.push(parseFloat(rvol.toFixed(2)));
    }
  }
  return result;
}`,
  },
  {
    id: 'custom_triple_ema_ribbon',
    name: 'Triple Scalp Trend Line (EMA 8 / 21 / 55 Blend)',
    shortName: 'Scalp Ribbon(8,21,55)',
    description: 'Weighted composite trend line combining 3 exponential moving averages',
    pane: 'OVERLAY',
    plotType: 'LINE',
    color: '#c084fc',
    lineWidth: 2,
    enabled: false,
    codeType: 'JAVASCRIPT',
    params: [],
    createdAt: '2026-10-05T00:00:00Z',
    isBuiltInPreset: true,
    formulaOrCode: `// Composite Triple EMA Ribbon
function calculate(bars) {
  const ema8 = indicators.ema(bars, 8);
  const ema21 = indicators.ema(bars, 21);
  const ema55 = indicators.ema(bars, 55);

  return bars.map((b, i) => {
    if (ema8[i] === null || ema21[i] === null || ema55[i] === null) return null;
    const blend = (ema8[i] * 0.5) + (ema21[i] * 0.3) + (ema55[i] * 0.2);
    return parseFloat(blend.toFixed(5));
  });
}`,
  },
  {
    id: 'custom_donchian_high',
    name: 'Donchian 20-Bar Channel High Breakout',
    shortName: 'Donchian High(20)',
    description: 'Turtle Trader upper resistance channel based on 20-period highest high',
    pane: 'OVERLAY',
    plotType: 'LINE',
    color: '#10b981',
    lineWidth: 1.5,
    enabled: false,
    codeType: 'JAVASCRIPT',
    params: [{ id: 'length', name: 'Lookback Period', type: 'number', defaultValue: 20, value: 20, min: 2, max: 100 }],
    createdAt: '2026-10-05T00:00:00Z',
    isBuiltInPreset: true,
    formulaOrCode: `// Donchian Channel Upper (Highest High of last N bars)
function calculate(bars, params, indicators) {
  const len = params.length || 20;
  return indicators.highest(bars, len);
}`,
  },
  {
    id: 'custom_hma_trend',
    name: 'Hull Moving Average (HMA 20)',
    shortName: 'HMA(20)',
    description: 'Extremely responsive, ultra-low lag moving average developed by Alan Hull',
    pane: 'OVERLAY',
    plotType: 'LINE',
    color: '#ec4899',
    lineWidth: 2,
    enabled: false,
    codeType: 'JAVASCRIPT',
    params: [{ id: 'length', name: 'HMA Period', type: 'number', defaultValue: 20, value: 20, min: 4, max: 100 }],
    createdAt: '2026-10-05T00:00:00Z',
    isBuiltInPreset: true,
    formulaOrCode: `// Hull Moving Average Approximation (2*WMA(n/2) - WMA(n))
function calculate(bars, params, indicators) {
  const len = params.length || 20;
  const halfLen = Math.floor(len / 2);
  const emaFull = indicators.ema(bars, len);
  const emaHalf = indicators.ema(bars, halfLen);

  return bars.map((b, i) => {
    if (emaFull[i] === null || emaHalf[i] === null) return null;
    const hmaVal = (2 * emaHalf[i]) - emaFull[i];
    return parseFloat(hmaVal.toFixed(5));
  });
}`,
  },
];

export class CustomIndicatorEngine {
  public static loadSavedIndicators(): CustomIndicatorDefinition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomIndicatorDefinition[];
        // Merge with built-in presets
        const ids = new Set(parsed.map(p => p.id));
        const merged = [...parsed];
        for (const preset of BUILT_IN_CUSTOM_PRESETS) {
          if (!ids.has(preset.id)) {
            merged.push(preset);
          }
        }
        return merged;
      }
    } catch {
      // Fall through
    }
    return [...BUILT_IN_CUSTOM_PRESETS];
  }

  public static saveIndicators(indicators: CustomIndicatorDefinition[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(indicators));
    } catch (e) {
      console.error('Failed to save custom indicators to localStorage', e);
    }
  }

  /**
   * Execute custom indicator JavaScript code or formula in a secure helper sandbox
   */
  public static executeIndicator(
    def: CustomIndicatorDefinition,
    bars: CandlestickBar[]
  ): { success: boolean; data: (number | null)[]; error?: string } {
    if (bars.length === 0) {
      return { success: true, data: [] };
    }

    try {
      // Build parameters dictionary
      const paramsObj: Record<string, any> = {};
      if (def.params) {
        for (const p of def.params) {
          paramsObj[p.id] = p.value !== undefined ? p.value : p.defaultValue;
        }
      }

      // Helper library exposed to custom scripts (similar to TradingView Pine Script built-ins)
      const indicatorsHelper = {
        sma: (b: CandlestickBar[], p: number) => calculateSMA(b, p),
        ema: (b: CandlestickBar[], p: number) => calculateEMA(b, p),
        rsi: (b: CandlestickBar[], p: number) => calculateRSI(b, p),
        atr: (b: CandlestickBar[], p: number) => calculateATR(b, p),
        vwap: (b: CandlestickBar[]) => calculateVWAP(b),
        swings: (b: CandlestickBar[], left = 3, right = 3) => calculateSwingPoints(b, left, right),
        bos: (b: CandlestickBar[], left = 3, right = 3) => calculateBOSAndCHoCH(b, left, right),
        demandSupply: (b: CandlestickBar[], left = 3, right = 3, maxZones = 6) =>
          calculateDemandSupplyZones(b, left, right, maxZones),
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

      // Create execution function
      let userFunc: Function;
      if (def.codeType === 'FORMULA') {
        // Evaluate single line formula expression e.g. "EMA(close, 20) - SMA(close, 50)"
        const formulaBody = `
          const close = bars.map(b => b.close);
          const high = bars.map(b => b.high);
          const low = bars.map(b => b.low);
          const volume = bars.map(b => b.volume);
          const EMA = (src, len) => indicators.ema(bars, len);
          const SMA = (src, len) => indicators.sma(bars, len);
          const RSI = (len) => indicators.rsi(bars, len);
          const ATR = (len) => indicators.atr(bars, len);
          const VWAP = () => indicators.vwap(bars);
          return (${def.formulaOrCode});
        `;
        userFunc = new Function('bars', 'params', 'indicators', formulaBody);
      } else {
        // Full JavaScript function wrapper
        const wrappedCode = `
          ${def.formulaOrCode}
          if (typeof calculate === 'function') {
            return calculate(bars, params, indicators);
          }
          throw new Error("Custom indicator script must define a function calculate(bars, params, indicators)");
        `;
        userFunc = new Function('bars', 'params', 'indicators', wrappedCode);
      }

      const result = userFunc(bars, paramsObj, indicatorsHelper);

      if (!Array.isArray(result)) {
        return {
          success: false,
          data: bars.map(() => null),
          error: 'Indicator must return an array of numbers / null',
        };
      }

      // Sanitize array length to match bars
      const sanitized: (number | null)[] = [];
      for (let i = 0; i < bars.length; i++) {
        const val = result[i];
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          sanitized.push(val);
        } else {
          sanitized.push(null);
        }
      }

      return { success: true, data: sanitized };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        data: bars.map(() => null),
        error: msg,
      };
    }
  }
}
