import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Zap,
  RefreshCw,
  Sliders,
  Check,
  ChevronDown,
  Code,
  Sparkles,
  Edit2,
  Brain,
  Target,
  Calendar,
  Flame,
  Layers,
} from 'lucide-react';
import {
  CandlestickBar,
  CandlestickTimeframe,
  MarketCandlestickResponse,
  AiChartAnalysisReport,
  EconomicCalendarResponse,
} from '../../../shared/src/types.ts';
import {
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateVWAP,
  calculateSuperTrend,
  calculateStochastic,
  calculateATR,
  calculateParabolicSAR,
  calculateBOSAndCHoCH,
  calculateDemandSupplyZones,
} from '../utils/indicators.ts';
import {
  CustomIndicatorDefinition,
  CustomIndicatorEngine,
} from '../utils/customIndicatorEngine.ts';
import { CustomIndicatorModal } from './CustomIndicatorModal.tsx';
import { AiChartAnalysisModal } from './AiChartAnalysisModal.tsx';
import { ForexFactoryCalendarModal } from './ForexFactoryCalendarModal.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';
import {
  generateRealisticCandles,
  applyLiveTick,
} from '../utils/candlestickGenerator.ts';

interface LiveCandleChartProps {
  initialSymbol?: string;
  initialTimeframe?: CandlestickTimeframe;
  height?: number;
}

const SUPPORTED_SYMBOLS = [
  { symbol: 'USDJPY', name: 'USD/JPY (AllTick Live)', isLive: true },
  { symbol: 'EURUSD', name: 'EUR/USD (OANDA Feed)', isLive: true },
  { symbol: 'GBPUSD', name: 'GBP/USD (OANDA Feed)', isLive: true },
  { symbol: 'AUDUSD', name: 'AUD/USD (Aussie)', isLive: true },
  { symbol: 'USDCAD', name: 'USD/CAD (Loonie)', isLive: true },
  { symbol: 'XAUUSD', name: 'Gold / USD (Spot Gold)', isLive: true },
  { symbol: 'MCL1!', name: 'Oil (MCL1! • OANDA / NYMEX)', isLive: true },
  { symbol: 'BTCUSD', name: 'Bitcoin / USD', isLive: true },
];

const TIMEFRAMES: { id: CandlestickTimeframe; label: string }[] = [
  { id: '1m', label: '1m' },
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '30m', label: '30m' },
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1D', label: '1D' },
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
];

export type SubIndicatorType = 'NONE' | 'RSI' | 'MACD' | 'STOCH' | 'ATR' | 'CUSTOM';

export interface IndicatorConfig {
  ema9: boolean;
  ema21: boolean;
  ema50: boolean;
  sma20: boolean;
  bollinger: boolean;
  vwap: boolean;
  supertrend: boolean;
  sar: boolean;
  bos: boolean;
  demandSupply: boolean;
  subIndicator: SubIndicatorType;
}

export const LiveCandleChart: React.FC<LiveCandleChartProps> = ({
  initialSymbol = 'USDJPY',
  initialTimeframe = '1m',
  height = 430,
}) => {
  const { t } = useTranslation();
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [timeframe, setTimeframe] = useState<CandlestickTimeframe>(initialTimeframe);
  const [bars, setBars] = useState<CandlestickBar[]>(() =>
    generateRealisticCandles(initialSymbol, initialTimeframe, 80)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isIndicatorMenuOpen, setIsIndicatorMenuOpen] = useState<boolean>(false);

  // Active Technical Indicators State
  const [indicators, setIndicators] = useState<IndicatorConfig>({
    ema9: false,
    ema21: true,
    ema50: false,
    sma20: false,
    bollinger: true,
    vwap: false,
    supertrend: false,
    sar: false,
    bos: true,
    demandSupply: true,
    subIndicator: 'RSI',
  });

  // Custom Indicators State (TradingView Studio)
  const [customIndicators, setCustomIndicators] = useState<CustomIndicatorDefinition[]>(() =>
    CustomIndicatorEngine.loadSavedIndicators()
  );
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [activeCustomSubId, setActiveCustomSubId] = useState<string | null>(null);

  // AI Multi-Timeframe Analysis State (15m, 4h, 1D, 1W)
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isAiPlottedOnChart, setIsAiPlottedOnChart] = useState<boolean>(false);
  const [activeAiReport, setActiveAiReport] = useState<AiChartAnalysisReport | null>(null);

  // ForexFactory Economic Calendar State
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarData, setCalendarData] = useState<EconomicCalendarResponse | null>(null);

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const subCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto fetch AI analysis report for symbol
  useEffect(() => {
    const loadAiReport = async () => {
      try {
        const res = await fetch(`/api/market/ai-analysis?symbol=${symbol}`);
        if (res.ok) {
          const text = await res.text();
          try {
            const data = JSON.parse(text) as AiChartAnalysisReport;
            setActiveAiReport(data);
          } catch {
            // Non-JSON on static Vercel
          }
        }
      } catch {
        // Fallback gracefully
      }
    };
    loadAiReport();
  }, [symbol]);

  // Auto fetch ForexFactory Economic Calendar summary
  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const res = await fetch('/api/market/economic-calendar');
        if (res.ok) {
          const text = await res.text();
          try {
            const json = JSON.parse(text) as EconomicCalendarResponse;
            setCalendarData(json);
          } catch {
            // Non-JSON on static Vercel
          }
        }
      } catch {
        // Ignore network fallback
      }
    };
    loadCalendar();
  }, []);

  // Toggle standard built-in indicators
  const toggleIndicator = (key: keyof Omit<IndicatorConfig, 'subIndicator'>) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setSubIndicator = (sub: SubIndicatorType) => {
    if (sub !== 'CUSTOM') {
      setActiveCustomSubId(null);
    }
    setIndicators(prev => ({ ...prev, subIndicator: sub }));
  };

  // Toggle Custom Indicator
  const toggleCustomIndicator = (id: string) => {
    setCustomIndicators(prev => {
      const updated = prev.map(ind => {
        if (ind.id === id) {
          const nextState = !ind.enabled;
          if (ind.pane === 'SUBPANEL') {
            if (nextState) {
              setActiveCustomSubId(id);
              setIndicators(i => ({ ...i, subIndicator: 'CUSTOM' }));
            } else if (activeCustomSubId === id) {
              setActiveCustomSubId(null);
              setIndicators(i => ({ ...i, subIndicator: 'NONE' }));
            }
          }
          return { ...ind, enabled: nextState };
        }
        return ind;
      });
      CustomIndicatorEngine.saveIndicators(updated);
      return updated;
    });
  };

  // Apply or update custom indicator from modal
  const handleApplyCustomIndicator = (def: CustomIndicatorDefinition) => {
    setCustomIndicators(prev => {
      const idx = prev.findIndex(item => item.id === def.id);
      let updated: CustomIndicatorDefinition[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...def, enabled: true };
      } else {
        updated = [...prev, { ...def, enabled: true }];
      }
      if (def.pane === 'SUBPANEL') {
        setActiveCustomSubId(def.id);
        setIndicators(i => ({ ...i, subIndicator: 'CUSTOM' }));
      }
      CustomIndicatorEngine.saveIndicators(updated);
      return updated;
    });
  };

  const handleOpenEditor = (id?: string) => {
    setEditingCustomId(id || null);
    setIsCustomModalOpen(true);
    setIsIndicatorMenuOpen(false);
  };

  // Fetch initial candlestick data with automatic seed fallback
  const fetchCandles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/market/candlesticks?symbol=${symbol}&timeframe=${timeframe}&count=80`);
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text) as MarketCandlestickResponse;
          if (data.bars && data.bars.length > 0) {
            setBars(data.bars);
            return;
          }
        } catch {
          // Not valid JSON on static hosting
        }
      }
      // Fallback to high-fidelity seed candles
      setBars(generateRealisticCandles(symbol, timeframe, 80));
    } catch {
      setBars(prev => (prev.length > 0 ? prev : generateRealisticCandles(symbol, timeframe, 80)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandles();
  }, [symbol, timeframe]);

  // High-Frequency Real-Time Live Ticking Engine (Runs 600ms continuously on all platforms)
  useEffect(() => {
    const tickTimer = setInterval(() => {
      setBars(prev => applyLiveTick(prev, symbol, timeframe));
    }, 600);

    return () => clearInterval(tickTimer);
  }, [symbol, timeframe]);

  // WebSocket real-time tick and candle listener (for full server environments)
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = event => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'CANDLESTICK_UPDATE' && msg.data) {
            const update = msg.data;
            if (update.symbol === symbol && update.timeframe === timeframe && update.bar) {
              setBars(prev => {
                const next = [...prev];
                const lastIdx = next.findIndex(b => b.timestamp === update.bar.timestamp);
                if (lastIdx >= 0) {
                  next[lastIdx] = update.bar;
                } else {
                  next.push(update.bar);
                  if (next.length > 150) next.shift();
                }
                return next;
              });
            }
          }
        } catch {
          // Ignore invalid messages
        }
      };
    } catch {
      // WS unavailable
    }

    return () => {
      if (ws) ws.close();
    };
  }, [symbol, timeframe]);

  // Compute standard indicators memoized
  const indicatorData = useMemo(() => {
    if (bars.length === 0) return null;

    return {
      ema9: indicators.ema9 ? calculateEMA(bars, 9) : null,
      ema21: indicators.ema21 ? calculateEMA(bars, 21) : null,
      ema50: indicators.ema50 ? calculateEMA(bars, 50) : null,
      sma20: indicators.sma20 ? calculateSMA(bars, 20) : null,
      bollinger: indicators.bollinger ? calculateBollingerBands(bars, 20, 2.0) : null,
      vwap: indicators.vwap ? calculateVWAP(bars) : null,
      supertrend: indicators.supertrend ? calculateSuperTrend(bars, 10, 3.0) : null,
      sar: indicators.sar ? calculateParabolicSAR(bars) : null,
      bos: indicators.bos ? calculateBOSAndCHoCH(bars, 3, 3) : null,
      demandSupply: indicators.demandSupply ? calculateDemandSupplyZones(bars, 3, 3, 8) : null,
      rsi: indicators.subIndicator === 'RSI' ? calculateRSI(bars, 14) : null,
      macd: indicators.subIndicator === 'MACD' ? calculateMACD(bars, 12, 26, 9) : null,
      stoch: indicators.subIndicator === 'STOCH' ? calculateStochastic(bars, 14, 3) : null,
      atr: indicators.subIndicator === 'ATR' ? calculateATR(bars, 14) : null,
    };
  }, [bars, indicators]);

  // Compute active custom indicators memoized
  const customIndicatorResults = useMemo(() => {
    if (bars.length === 0) return {};
    const results: Record<string, { def: CustomIndicatorDefinition; data: (number | null)[] }> = {};

    for (const def of customIndicators) {
      if (def.enabled) {
        const res = CustomIndicatorEngine.executeIndicator(def, bars);
        if (res.success && res.data) {
          results[def.id] = { def, data: res.data };
        }
      }
    }
    return results;
  }, [bars, customIndicators]);

  // Active custom subpanel indicator definition
  const activeCustomSubDef = useMemo(() => {
    if (indicators.subIndicator === 'CUSTOM' && activeCustomSubId) {
      return customIndicators.find(c => c.id === activeCustomSubId && c.enabled) || null;
    }
    return null;
  }, [indicators.subIndicator, activeCustomSubId, customIndicators]);

  // Main Canvas Rendering (Candles + Standard Overlays + Custom Overlays + AI Key Levels + Volume)
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas || bars.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;
    const paddingBottom = 26;
    const paddingRight = 85;
    const paddingTop = 16;
    const plotWidth = width - paddingRight;
    const plotHeight = chartHeight - paddingBottom - paddingTop;

    ctx.clearRect(0, 0, width, chartHeight);

    // Calculate Min / Max Price Bounds across Candles & Overlays
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    bars.forEach((b, i) => {
      if (b.low < minPrice) minPrice = b.low;
      if (b.high > maxPrice) maxPrice = b.high;
      if (b.volume > maxVolume) maxVolume = b.volume;

      // Include Bollinger Bands in scale if active
      if (indicatorData?.bollinger) {
        const u = indicatorData.bollinger.upper[i];
        const l = indicatorData.bollinger.lower[i];
        if (u !== null && u > maxPrice) maxPrice = u;
        if (l !== null && l < minPrice) minPrice = l;
      }
    });

    // Also include active Demand & Supply zones in price scaling
    if (indicatorData?.demandSupply && indicators.demandSupply) {
      indicatorData.demandSupply.zones.forEach(z => {
        if (z.topPrice > maxPrice) maxPrice = z.topPrice;
        if (z.bottomPrice < minPrice) minPrice = z.bottomPrice;
      });
    }

    // Also include custom overlays in scaling if active
    Object.values(customIndicatorResults).forEach(({ def, data }) => {
      if (def.pane === 'OVERLAY') {
        data.forEach(v => {
          if (v !== null && typeof v === 'number') {
            if (v < minPrice) minPrice = v;
            if (v > maxPrice) maxPrice = v;
          }
        });
      }
    });

    const priceRange = maxPrice - minPrice || 1;
    const pricePadding = priceRange * 0.08;
    const adjustedMin = minPrice - pricePadding;
    const adjustedMax = maxPrice + pricePadding;
    const adjustedRange = adjustedMax - adjustedMin;

    const getY = (price: number) => {
      return paddingTop + plotHeight - ((price - adjustedMin) / adjustedRange) * plotHeight;
    };

    // Draw Grid Lines & Price Labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const price = adjustedMin + (adjustedRange * i) / gridLines;
      const y = getY(price);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();

      const isForex = symbol === 'EURUSD' || symbol === 'GBPUSD' || symbol === 'AUDUSD' || symbol === 'USDCAD';
      const priceStr = price.toFixed(
        symbol === 'USDJPY' ? 3 : isForex ? 5 : 2
      );
      ctx.fillText(priceStr, plotWidth + 8, y + 3);
    }

    const totalBars = bars.length;
    const candleSpacing = plotWidth / totalBars;
    const candleWidth = Math.max(3, candleSpacing * 0.65);

    // 1. Draw Smart Money Concepts (SMC): Supply & Demand Zones
    if (indicatorData?.demandSupply && indicators.demandSupply) {
      const { zones } = indicatorData.demandSupply;

      zones.forEach(zone => {
        const startX = Math.max(0, zone.startIndex * candleSpacing);
        const endX = plotWidth;
        const topY = getY(zone.topPrice);
        const bottomY = getY(zone.bottomPrice);
        const zoneHeight = Math.max(5, Math.abs(bottomY - topY));
        const rectY = Math.min(topY, bottomY);

        const isDemand = zone.type === 'DEMAND';
        const isFresh = zone.status === 'FRESH';

        // Gradient Box Fill
        const bgGrad = ctx.createLinearGradient(startX, rectY, endX, rectY);
        if (isDemand) {
          bgGrad.addColorStop(0, isFresh ? 'rgba(10, 186, 181, 0.24)' : 'rgba(10, 186, 181, 0.11)');
          bgGrad.addColorStop(1, isFresh ? 'rgba(10, 186, 181, 0.07)' : 'rgba(10, 186, 181, 0.03)');
        } else {
          bgGrad.addColorStop(0, isFresh ? 'rgba(239, 68, 68, 0.24)' : 'rgba(239, 68, 68, 0.11)');
          bgGrad.addColorStop(1, isFresh ? 'rgba(239, 68, 68, 0.07)' : 'rgba(239, 68, 68, 0.03)');
        }

        ctx.fillStyle = bgGrad;
        ctx.fillRect(startX, rectY, endX - startX, zoneHeight);

        // Border Line
        ctx.strokeStyle = isDemand
          ? (isFresh ? 'rgba(10, 186, 181, 0.75)' : 'rgba(10, 186, 181, 0.35)')
          : (isFresh ? 'rgba(239, 68, 68, 0.75)' : 'rgba(239, 68, 68, 0.35)');
        ctx.lineWidth = 1;
        if (!isFresh) ctx.setLineDash([4, 3]);
        ctx.strokeRect(startX, rectY, endX - startX, zoneHeight);
        ctx.setLineDash([]);

        // Label Badge
        const isForex = symbol === 'EURUSD' || symbol === 'GBPUSD' || symbol === 'AUDUSD' || symbol === 'USDCAD';
        const decimals = symbol === 'USDJPY' ? 3 : isForex ? 5 : 2;
        const labelText = isDemand
          ? (isFresh ? '⚡ DEMAND ZONE' : 'DEMAND [TESTED]')
          : (isFresh ? '🛡️ SUPPLY ZONE' : 'SUPPLY [TESTED]');
        const priceSubText = `${zone.bottomPrice.toFixed(decimals)} - ${zone.topPrice.toFixed(decimals)}`;

        ctx.fillStyle = isDemand ? '#81d8d0' : '#fca5a5';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${labelText} (${priceSubText})`, startX + 6, rectY + Math.min(13, zoneHeight / 2 + 3));
      });
    }

    // 2. Draw Bollinger Bands Cloud & Lines
    if (indicatorData?.bollinger) {
      const { upper, middle, lower } = indicatorData.bollinger;

      // Draw Shaded Cloud
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < totalBars; i++) {
        const u = upper[i];
        if (u !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY(u);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      for (let i = totalBars - 1; i >= 0; i--) {
        const l = lower[i];
        if (l !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY(l);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(10, 186, 181, 0.06)';
      ctx.fill();

      // Upper line
      ctx.strokeStyle = 'rgba(10, 186, 181, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      first = true;
      for (let i = 0; i < totalBars; i++) {
        if (upper[i] !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY(upper[i] as number);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();

      // Lower line
      ctx.strokeStyle = 'rgba(10, 186, 181, 0.6)';
      ctx.beginPath();
      first = true;
      for (let i = 0; i < totalBars; i++) {
        if (lower[i] !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY(lower[i] as number);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();

      // Middle line (SMA 20)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      first = true;
      for (let i = 0; i < totalBars; i++) {
        if (middle[i] !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY(middle[i] as number);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw Volume Bars
    const volumeHeight = plotHeight * 0.18;
    bars.forEach((bar, idx) => {
      const x = idx * candleSpacing + candleSpacing / 2;
      const isBull = bar.close >= bar.open;
      const vHeight = maxVolume > 0 ? (bar.volume / maxVolume) * volumeHeight : 0;
      const vy = paddingTop + plotHeight - vHeight;

      ctx.fillStyle = isBull ? 'rgba(10, 186, 181, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(x - candleWidth / 2, vy, candleWidth, vHeight);
    });

    // 4. Draw Candlestick Bars & Wicks
    bars.forEach((bar, idx) => {
      const x = idx * candleSpacing + candleSpacing / 2;
      const isBull = bar.close >= bar.open;
      const openY = getY(bar.open);
      const closeY = getY(bar.close);
      const highY = getY(bar.high);
      const lowY = getY(bar.low);

      const color = isBull ? '#0abab5' : '#ef4444';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // Wick shadow line
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Candle Real Body
      const topY = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyHeight);
    });

    // 5. Draw Break of Structure (BOS) & Change of Character (CHoCH) Lines and Badges
    if (indicatorData?.bos && indicators.bos) {
      const { swings, breaks } = indicatorData.bos;

      // 5a. Subtle Swing Fractals (HH, HL, LH, LL)
      swings.forEach(sw => {
        const x = sw.index * candleSpacing + candleSpacing / 2;
        const y = getY(sw.price);
        const isHigh = sw.type === 'HIGH';

        ctx.fillStyle = isHigh ? '#f43f5e' : '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isHigh ? '#fca5a5' : '#86efac';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(sw.structureType, x, isHigh ? y - 6 : y + 12);
      });

      // 5b. Breakout Lines & Marker Badges
      breaks.forEach(brk => {
        const startX = brk.brokenIndex * candleSpacing + candleSpacing / 2;
        const endX = brk.breakoutIndex * candleSpacing + candleSpacing / 2;
        const y = getY(brk.brokenPrice);

        const isBull = brk.isBullish;
        const color = isBull ? '#0abab5' : '#f43f5e';

        // Horizontal ray from swing to breakout candle
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.3;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Small stylish badge at breakout
        const pillW = 46;
        const pillH = 14;
        const pillX = endX - pillW / 2;
        const pillY = isBull ? y - 18 : y + 6;

        ctx.fillStyle = isBull ? '#0abab5' : '#f43f5e';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 3);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(brk.label, endX, pillY + 10);
      });
    }

    // 6. Draw Overlay Moving Averages (EMA 9, EMA 21, EMA 50, SMA 20, VWAP)
    const drawLineSeries = (data: (number | null)[] | null, strokeColor: string, lineWidth = 1.5, dashed = false) => {
      if (!data) return;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      if (dashed) ctx.setLineDash([4, 3]);
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < totalBars; i++) {
        const val = data[i];
        if (val !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY(val);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      if (dashed) ctx.setLineDash([]);
    };

    drawLineSeries(indicatorData?.ema9 ?? null, '#fbbf24', 1.5); // EMA 9 Yellow
    drawLineSeries(indicatorData?.ema21 ?? null, '#38bdf8', 1.8); // EMA 21 Cyan
    drawLineSeries(indicatorData?.ema50 ?? null, '#c084fc', 1.8); // EMA 50 Purple
    drawLineSeries(indicatorData?.sma20 ?? null, '#f97316', 1.5, true); // SMA 20 Orange
    drawLineSeries(indicatorData?.vwap ?? null, '#a855f7', 1.8); // VWAP Magenta

    // 7. Draw SuperTrend
    if (indicatorData?.supertrend) {
      const { trendLine, direction } = indicatorData.supertrend;
      for (let i = 1; i < totalBars; i++) {
        const p1 = trendLine[i - 1];
        const p2 = trendLine[i];
        const dir = direction[i];
        if (p1 !== null && p2 !== null && dir !== null) {
          ctx.strokeStyle = dir === 1 ? '#10b981' : '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo((i - 1) * candleSpacing + candleSpacing / 2, getY(p1));
          ctx.lineTo(i * candleSpacing + candleSpacing / 2, getY(p2));
          ctx.stroke();
        }
      }
    }

    // 8. Draw Parabolic SAR Dots
    if (indicatorData?.sar) {
      const sar = indicatorData.sar;
      ctx.fillStyle = '#f59e0b';
      for (let i = 0; i < totalBars; i++) {
        const val = sar[i];
        if (val !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY(val);
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 9. Draw Custom Indicator Overlays (TradingView Studio)
    Object.values(customIndicatorResults).forEach(({ def, data }) => {
      if (def.pane !== 'OVERLAY') return;

      if (def.plotType === 'LINE') {
        drawLineSeries(data, def.color, def.lineWidth || 2);
      } else if (def.plotType === 'DOTS') {
        ctx.fillStyle = def.color;
        for (let i = 0; i < totalBars; i++) {
          const val = data[i];
          if (val !== null) {
            const x = i * candleSpacing + candleSpacing / 2;
            const y = getY(val);
            ctx.beginPath();
            ctx.arc(x, y, (def.lineWidth || 2) * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (def.plotType === 'HISTOGRAM') {
        const barW = Math.max(2, candleSpacing * 0.6);
        ctx.fillStyle = def.color;
        for (let i = 0; i < totalBars; i++) {
          const val = data[i];
          if (val !== null) {
            const x = i * candleSpacing + candleSpacing / 2;
            const y = getY(val);
            const base = getY(adjustedMin);
            ctx.fillRect(x - barW / 2, Math.min(y, base), barW, Math.abs(y - base));
          }
        }
      } else if (def.plotType === 'AREA') {
        ctx.beginPath();
        let first = true;
        for (let i = 0; i < totalBars; i++) {
          const val = data[i];
          if (val !== null) {
            const x = i * candleSpacing + candleSpacing / 2;
            const y = getY(val);
            if (first) {
              ctx.moveTo(x, y);
              first = false;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.lineTo(plotWidth, paddingTop + plotHeight);
        ctx.lineTo(0, paddingTop + plotHeight);
        ctx.closePath();
        ctx.fillStyle = `${def.color}22`;
        ctx.fill();
        drawLineSeries(data, def.color, def.lineWidth || 1.5);
      }
    });

    // 8. Draw AI Multi-Timeframe Key Levels (If Plotted)
    if (isAiPlottedOnChart && activeAiReport?.keyLevels) {
      const levels = activeAiReport.keyLevels;

      const drawAiLevel = (price: number, label: string, color: string, isDashed = true) => {
        const y = getY(price);
        if (y < paddingTop - 20 || y > paddingTop + plotHeight + 20) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        if (isDashed) ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Small glowing label tag on right
        ctx.fillStyle = `${color}20`;
        ctx.fillRect(plotWidth + 2, y - 8, 80, 16);
        ctx.strokeStyle = color;
        ctx.strokeRect(plotWidth + 2, y - 8, 80, 16);
        ctx.fillStyle = color;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(label, plotWidth + 6, y + 4);
      };

      drawAiLevel(levels.r2, `R2: ${levels.r2}`, '#ef4444');
      drawAiLevel(levels.r1, `R1: ${levels.r1}`, '#fb7185');
      drawAiLevel(levels.pivot, `PIVOT: ${levels.pivot}`, '#fbbf24', false);
      drawAiLevel(levels.s1, `S1: ${levels.s1}`, '#34d399');
      drawAiLevel(levels.s2, `S2: ${levels.s2}`, '#10b981');
      drawAiLevel(levels.tp2, `AI TP2: ${levels.tp2}`, '#0abab5');
      drawAiLevel(levels.stopLoss, `AI SL: ${levels.stopLoss}`, '#f43f5e');
    }

    // 9. Draw Current Live Price Line with Glow Tag & Pulsing Beacon
    if (bars.length > 0) {
      const currentBar = bars[bars.length - 1];
      const currentY = getY(currentBar.close);
      const isUp = currentBar.close >= currentBar.open;
      const currentPriceColor = isUp ? '#0abab5' : '#ef4444';

      // Horizontal dashed line
      ctx.strokeStyle = currentPriceColor;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(plotWidth, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Live Beacon Pulsing Halo on the tip of the current candle
      const lastCandleX = (bars.length - 1) * candleSpacing + candleSpacing / 2;
      ctx.beginPath();
      ctx.arc(lastCandleX, currentY, 7, 0, Math.PI * 2);
      ctx.fillStyle = isUp ? 'rgba(10, 186, 181, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(lastCandleX, currentY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = currentPriceColor;
      ctx.fill();

      // Price Tag on Right Axis (Rounded Badge)
      ctx.fillStyle = currentPriceColor;
      ctx.beginPath();
      ctx.roundRect(plotWidth + 2, currentY - 10, 78, 20, 4);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const isForex = symbol === 'EURUSD' || symbol === 'GBPUSD' || symbol === 'AUDUSD' || symbol === 'USDCAD';
      const curPriceStr = currentBar.close.toFixed(
        symbol === 'USDJPY' ? 3 : isForex ? 5 : 2
      );
      ctx.fillText(curPriceStr, plotWidth + 41, currentY + 4);
    }

    // 10. Crosshair on hover
    if (mousePos && mousePos.x <= plotWidth) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, paddingTop);
      ctx.lineTo(mousePos.x, paddingTop + plotHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(plotWidth, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [bars, mousePos, symbol, indicatorData, customIndicatorResults, isAiPlottedOnChart, activeAiReport]);

  // Sub-Indicator Canvas Rendering (RSI / MACD / Stochastic / ATR / Custom Subpanel)
  useEffect(() => {
    const canvas = subCanvasRef.current;
    if (!canvas || bars.length === 0 || indicators.subIndicator === 'NONE') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;
    const paddingRight = 85;
    const paddingTop = 12;
    const paddingBottom = 16;
    const plotWidth = width - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    ctx.clearRect(0, 0, width, chartHeight);

    const totalBars = bars.length;
    const candleSpacing = plotWidth / totalBars;

    // A. Render RSI Sub-Chart (0 - 100 with 70 & 30 Zones)
    if (indicators.subIndicator === 'RSI' && indicatorData?.rsi) {
      const rsi = indicatorData.rsi;
      const getY_RSI = (val: number) => paddingTop + plotHeight - (val / 100) * plotHeight;

      // Overbought / Oversold Background Band
      const y70 = getY_RSI(70);
      const y30 = getY_RSI(30);
      ctx.fillStyle = 'rgba(129, 216, 208, 0.05)';
      ctx.fillRect(0, y70, plotWidth, y30 - y70);

      // Level 70 & 30 Dashed Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y70);
      ctx.lineTo(plotWidth, y70);
      ctx.moveTo(0, y30);
      ctx.lineTo(plotWidth, y30);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('70 OB', plotWidth + 8, y70 + 3);
      ctx.fillText('30 OS', plotWidth + 8, y30 + 3);

      // Draw RSI Curve
      ctx.strokeStyle = '#81d8d0';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < totalBars; i++) {
        const val = rsi[i];
        if (val !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY_RSI(val);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();
    }

    // B. Render MACD Sub-Chart (Histogram + MACD Line + Signal Line)
    if (indicators.subIndicator === 'MACD' && indicatorData?.macd) {
      const { macdLine, signalLine, histogram } = indicatorData.macd;

      let maxVal = 0.0001;
      for (let i = 0; i < totalBars; i++) {
        const m = Math.abs(macdLine[i] || 0);
        const s = Math.abs(signalLine[i] || 0);
        const h = Math.abs(histogram[i] || 0);
        maxVal = Math.max(maxVal, m, s, h);
      }

      const getY_MACD = (val: number) => paddingTop + plotHeight / 2 - (val / (maxVal * 1.2)) * (plotHeight / 2);
      const zeroY = getY_MACD(0);

      // Zero Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(plotWidth, zeroY);
      ctx.stroke();

      // Histogram Bars
      const barW = Math.max(2, candleSpacing * 0.55);
      for (let i = 0; i < totalBars; i++) {
        const h = histogram[i];
        if (h !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY_MACD(h);
          ctx.fillStyle = h >= 0 ? 'rgba(10, 186, 181, 0.7)' : 'rgba(239, 68, 68, 0.7)';
          ctx.fillRect(x - barW / 2, Math.min(y, zeroY), barW, Math.abs(y - zeroY));
        }
      }

      // MACD Line (Blue)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < totalBars; i++) {
        const m = macdLine[i];
        if (m !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY_MACD(m);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();

      // Signal Line (Orange)
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      first = true;
      for (let i = 0; i < totalBars; i++) {
        const s = signalLine[i];
        if (s !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY_MACD(s);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();
    }

    // C. Render Stochastic Oscillator (%K, %D with 80 & 20 levels)
    if (indicators.subIndicator === 'STOCH' && indicatorData?.stoch) {
      const { k, d } = indicatorData.stoch;
      const getY_Stoch = (val: number) => paddingTop + plotHeight - (val / 100) * plotHeight;

      const y80 = getY_Stoch(80);
      const y20 = getY_Stoch(20);

      ctx.fillStyle = 'rgba(129, 216, 208, 0.05)';
      ctx.fillRect(0, y80, plotWidth, y20 - y80);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y80);
      ctx.lineTo(plotWidth, y80);
      ctx.moveTo(0, y20);
      ctx.lineTo(plotWidth, y20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('80', plotWidth + 8, y80 + 3);
      ctx.fillText('20', plotWidth + 8, y20 + 3);

      // %K Line (Cyan)
      ctx.strokeStyle = '#0abab5';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < totalBars; i++) {
        if (k[i] !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY_Stoch(k[i] as number);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();

      // %D Line (Orange)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      first = true;
      for (let i = 0; i < totalBars; i++) {
        if (d[i] !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY_Stoch(d[i] as number);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();
    }

    // D. Render ATR Volatility Sub-Chart
    if (indicators.subIndicator === 'ATR' && indicatorData?.atr) {
      const atr = indicatorData.atr;
      let minAtr = Infinity;
      let maxAtr = -Infinity;
      atr.forEach(v => {
        if (v !== null) {
          if (v < minAtr) minAtr = v;
          if (v > maxAtr) maxAtr = v;
        }
      });
      const range = maxAtr - minAtr || 0.0001;
      const getY_ATR = (val: number) => paddingTop + plotHeight - ((val - minAtr) / range) * plotHeight;

      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < totalBars; i++) {
        if (atr[i] !== null) {
          const x = i * candleSpacing + candleSpacing / 2;
          const y = getY_ATR(atr[i] as number);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();
    }

    // E. Render Custom Oscillator Sub-Chart (TradingView Studio)
    if (indicators.subIndicator === 'CUSTOM' && activeCustomSubDef) {
      const res = customIndicatorResults[activeCustomSubDef.id];
      if (res && res.data) {
        const data = res.data;
        let minVal = Infinity;
        let maxVal = -Infinity;
        data.forEach(v => {
          if (v !== null && typeof v === 'number') {
            if (v < minVal) minVal = v;
            if (v > maxVal) maxVal = v;
          }
        });

        if (minVal === Infinity) {
          minVal = 0;
          maxVal = 100;
        }

        const range = maxVal - minVal || 1;
        const getY_Custom = (val: number) => paddingTop + plotHeight - ((val - minVal) / range) * plotHeight;

        // Zero line if range spans negative to positive
        if (minVal < 0 && maxVal > 0) {
          const zY = getY_Custom(0);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.moveTo(0, zY);
          ctx.lineTo(plotWidth, zY);
          ctx.stroke();
          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px monospace';
          ctx.fillText('0', plotWidth + 8, zY + 3);
        }

        // Top & Bottom Bounds Text
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(maxVal.toFixed(2), plotWidth + 8, paddingTop + 8);
        ctx.fillText(minVal.toFixed(2), plotWidth + 8, paddingTop + plotHeight);

        if (activeCustomSubDef.plotType === 'HISTOGRAM') {
          const barW = Math.max(2, candleSpacing * 0.6);
          const zeroY = minVal < 0 && maxVal > 0 ? getY_Custom(0) : paddingTop + plotHeight;
          ctx.fillStyle = activeCustomSubDef.color;
          for (let i = 0; i < totalBars; i++) {
            const v = data[i];
            if (v !== null) {
              const x = i * candleSpacing + candleSpacing / 2;
              const y = getY_Custom(v);
              ctx.fillRect(x - barW / 2, Math.min(y, zeroY), barW, Math.max(2, Math.abs(y - zeroY)));
            }
          }
        } else {
          // Line or Dots
          ctx.strokeStyle = activeCustomSubDef.color;
          ctx.lineWidth = activeCustomSubDef.lineWidth || 2;
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < totalBars; i++) {
            const val = data[i];
            if (val !== null) {
              const x = i * candleSpacing + candleSpacing / 2;
              const y = getY_Custom(val);
              if (first) {
                ctx.moveTo(x, y);
                first = false;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
          ctx.stroke();
        }
      }
    }
  }, [bars, indicators.subIndicator, indicatorData, activeCustomSubDef, customIndicatorResults]);

  // Mouse hover coordination
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = mainCanvasRef.current;
    if (!canvas || bars.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const paddingRight = 85;
    const plotWidth = rect.width - paddingRight;

    if (x <= plotWidth) {
      setMousePos({ x, y });
      const barIndex = Math.min(bars.length - 1, Math.max(0, Math.floor((x / plotWidth) * bars.length)));
      setHoveredIndex(barIndex);
    } else {
      setMousePos(null);
      setHoveredIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredIndex(null);
  };

  const activeIdx = hoveredIndex !== null ? hoveredIndex : bars.length - 1;
  const activeBar = bars[activeIdx] || null;
  const isUp = activeBar ? activeBar.close >= activeBar.open : true;
  const changePct =
    activeBar && activeBar.open > 0
      ? (((activeBar.close - activeBar.open) / activeBar.open) * 100).toFixed(2)
      : '0.00';

  // Count total active indicators
  const activeOverlayCount = [
    indicators.ema9,
    indicators.ema21,
    indicators.ema50,
    indicators.sma20,
    indicators.bollinger,
    indicators.vwap,
    indicators.supertrend,
    indicators.sar,
    indicators.bos,
    indicators.demandSupply,
    ...customIndicators.filter(c => c.enabled && c.pane === 'OVERLAY').map(() => true),
  ].filter(Boolean).length;

  return (
    <div
      ref={containerRef}
      className="card-panel"
      style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(6, 13, 17, 0.98) 0%, rgba(12, 28, 33, 0.95) 100%)',
        border: '1px solid rgba(10, 186, 181, 0.25)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        position: 'relative',
      }}
    >
      {/* Top Header & Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Symbol Select Buttons */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {SUPPORTED_SYMBOLS.map(s => {
              const active = symbol === s.symbol;
              return (
                <button
                  key={s.symbol}
                  onClick={() => setSymbol(s.symbol)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 800,
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg, #0abab5, #078c88)' : 'transparent',
                    color: active ? '#000000' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {s.symbol}
                </button>
              );
            })}
          </div>

          {/* Timeframe Selectors */}
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {TIMEFRAMES.map(tf => {
              const active = timeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'rgba(129, 216, 208, 0.25)' : 'transparent',
                    color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  }}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          {/* Indicator Menu Dropdown Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsIndicatorMenuOpen(!isIndicatorMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background:
                  activeOverlayCount > 0 || indicators.subIndicator !== 'NONE'
                    ? 'rgba(10, 186, 181, 0.15)'
                    : 'rgba(255, 255, 255, 0.04)',
                border:
                  activeOverlayCount > 0 || indicators.subIndicator !== 'NONE'
                    ? '1px solid rgba(10, 186, 181, 0.4)'
                    : '1px solid var(--border-subtle)',
                color:
                  activeOverlayCount > 0 || indicators.subIndicator !== 'NONE'
                    ? 'var(--accent-cyan)'
                    : 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Sliders size={13} />
              {t.chart.indicators} ({activeOverlayCount + (indicators.subIndicator !== 'NONE' ? 1 : 0)})
              <ChevronDown size={13} />
            </button>

            {/* Indicator Dropdown Modal */}
            {isIndicatorMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  width: '330px',
                  maxHeight: '460px',
                  overflowY: 'auto',
                  background: '#08171c',
                  border: '1px solid rgba(10, 186, 181, 0.4)',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
                  zIndex: 100,
                }}
              >
                {/* Custom Indicator Studio Banner Button */}
                <div
                  onClick={() => handleOpenEditor()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(10, 186, 181, 0.25) 0%, rgba(7, 140, 136, 0.25) 100%)',
                    border: '1px solid #0abab5',
                    cursor: 'pointer',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Code size={16} color="#0abab5" />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{t.chart.createCustomIndicator}</div>
                      <div style={{ fontSize: '10px', color: '#81d8d0' }}>{t.chart.pineScriptStudio}</div>
                    </div>
                  </div>
                  <Sparkles size={14} color="#0abab5" />
                </div>

                {/* Smart Money Concepts (SMC) Section */}
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#0abab5', marginBottom: '6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Layers size={12} color="#0abab5" />
                  {t.chart.smcSectionTitle}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                  {[
                    { key: 'demandSupply', label: t.chart.demandSupplyLabel, desc: t.chart.demandSupplyDesc, color: '#0abab5' },
                    { key: 'bos', label: t.chart.bosLabel, desc: t.chart.bosDesc, color: '#38bdf8' },
                  ].map(item => {
                    const isChecked = indicators[item.key as keyof Omit<IndicatorConfig, 'subIndicator'>];
                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleIndicator(item.key as keyof Omit<IndicatorConfig, 'subIndicator'>)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: isChecked ? 'rgba(10, 186, 181, 0.12)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isChecked ? 'rgba(10, 186, 181, 0.35)' : 'transparent'}`,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '11px', color: isChecked ? '#fff' : 'var(--text-muted)', fontWeight: 700 }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '9px', color: '#64748b' }}>{item.desc}</div>
                        </div>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: `1px solid ${isChecked ? item.color : 'rgba(255,255,255,0.2)'}`,
                            background: isChecked ? item.color : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isChecked && <Check size={12} color="#000" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom User Indicators Section */}
                {customIndicators.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#ec4899', marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t.chart.myCustomIndicators} ({customIndicators.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {customIndicators.map(c => {
                        const isChecked = c.enabled;
                        return (
                          <div
                            key={c.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: isChecked ? 'rgba(10, 186, 181, 0.12)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${isChecked ? 'rgba(10, 186, 181, 0.3)' : 'transparent'}`,
                            }}
                          >
                            <div
                              onClick={() => toggleCustomIndicator(c.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
                            >
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.color }} />
                              <span style={{ fontSize: '11px', color: isChecked ? '#fff' : 'var(--text-muted)', fontWeight: 600 }}>
                                {c.name}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenEditor(c.id)}
                                style={{ background: 'transparent', border: 'none', color: '#81d8d0', cursor: 'pointer', padding: '2px' }}
                                title="Edit Indicator"
                              >
                                <Edit2 size={12} />
                              </button>
                              <div
                                onClick={() => toggleCustomIndicator(c.id)}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '4px',
                                  border: `1px solid ${isChecked ? c.color : 'rgba(255,255,255,0.2)'}`,
                                  background: isChecked ? c.color : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                {isChecked && <Check size={12} color="#000" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Built-in Overlays Section */}
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {t.chart.overlayIndicators}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                  {[
                    { key: 'bollinger', label: 'Bollinger Bands (20, 2.0)', color: '#0abab5' },
                    { key: 'ema21', label: 'EMA 21 (Short Trend)', color: '#38bdf8' },
                    { key: 'ema9', label: 'EMA 9 (Fast Ribbon)', color: '#fbbf24' },
                    { key: 'ema50', label: 'EMA 50 (Major Baseline)', color: '#c084fc' },
                    { key: 'sma20', label: 'SMA 20 (Standard MA)', color: '#f97316' },
                    { key: 'vwap', label: 'VWAP (Volume Weighted)', color: '#a855f7' },
                    { key: 'supertrend', label: 'SuperTrend (10, 3.0)', color: '#10b981' },
                    { key: 'sar', label: 'Parabolic SAR (0.02, 0.2)', color: '#f59e0b' },
                  ].map(item => {
                    const isChecked = indicators[item.key as keyof Omit<IndicatorConfig, 'subIndicator'>];
                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleIndicator(item.key as keyof Omit<IndicatorConfig, 'subIndicator'>)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: isChecked ? 'rgba(10, 186, 181, 0.1)' : 'transparent',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: isChecked ? '#fff' : 'var(--text-muted)' }}>
                          {item.label}
                        </span>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: `1px solid ${isChecked ? item.color : 'rgba(255,255,255,0.2)'}`,
                            background: isChecked ? item.color : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isChecked && <Check size={12} color="#000" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Built-in Oscillator Sub-Panels */}
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {t.chart.oscillatorSubPanel}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {[
                    { id: 'RSI', label: 'RSI (14)' },
                    { id: 'MACD', label: 'MACD (12,26,9)' },
                    { id: 'STOCH', label: 'Stoch (14,3,3)' },
                    { id: 'ATR', label: 'ATR (14)' },
                    { id: 'NONE', label: t.chart.hideSub },
                  ].map(item => {
                    const isSelected = indicators.subIndicator === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSubIndicator(item.id as SubIndicatorType)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid #fbbf24' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                          color: isSelected ? '#fbbf24' : 'var(--text-muted)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Smart Money Concepts (SMC) Toggle Button */}
          <button
            onClick={() => {
              const nextVal = !(indicators.bos && indicators.demandSupply);
              setIndicators(prev => ({
                ...prev,
                bos: nextVal,
                demandSupply: nextVal,
              }));
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background:
                indicators.bos || indicators.demandSupply
                  ? 'linear-gradient(135deg, rgba(10, 186, 181, 0.25) 0%, rgba(14, 165, 233, 0.25) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
              border:
                indicators.bos || indicators.demandSupply
                  ? '1px solid #0abab5'
                  : '1px solid var(--border-subtle)',
              color:
                indicators.bos || indicators.demandSupply
                  ? '#81d8d0'
                  : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={13} color={indicators.bos || indicators.demandSupply ? '#0abab5' : 'currentColor'} />
            <span>{t.chart.smcQuickBtn}</span>
            {(indicators.bos || indicators.demandSupply) && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#0abab5',
                  boxShadow: '0 0 6px #0abab5',
                }}
              />
            )}
          </button>

          {/* Quick Pine Script Custom Indicator Launcher */}
          <button
            onClick={() => handleOpenEditor()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(10, 186, 181, 0.2) 0%, rgba(7, 140, 136, 0.3) 100%)',
              border: '1px solid #0abab5',
              color: '#81d8d0',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <Code size={13} /> {t.chart.pineScriptQuickBtn}
          </button>

          {/* AI Multi-Timeframe Analysis Launcher Button (15m, 4h, 1D, 1W) */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(10, 186, 181, 0.35) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.6)',
              color: '#f3e8ff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.3)',
            }}
          >
            <Brain size={14} color="#c084fc" />
            <span>{t.chart.aiMultiTfQuickBtn}</span>
            <Sparkles size={12} color="#0abab5" />
          </button>

          {/* ForexFactory Economic Calendar Launcher Button */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.25) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <Calendar size={13} color="#ef4444" />
            <span>{t.chart.forexFactoryQuickBtn} ({calendarData?.highImpactCount || 0} {t.forexCalendar.redFolders})</span>
            <Flame size={12} fill="#ef4444" />
          </button>
        </div>

        {/* AllTick 7-Day Live Feed Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'rgba(10, 186, 181, 0.15)',
              color: '#0abab5',
              border: '1px solid rgba(10, 186, 181, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={12} fill="#0abab5" /> {t.chart.allTickLiveBadge}
          </span>

          <button
            onClick={fetchCandles}
            disabled={isLoading}
            style={{
              padding: '6px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
            }}
            title={t.chart.refreshCandles}
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Quick Indicator Toggle Pills Strip */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '10px',
          fontSize: '11px',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t.chart.quickIndicators}</span>
        <button
          onClick={() => toggleIndicator('bollinger')}
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            border: indicators.bollinger ? '1px solid #0abab5' : '1px solid var(--border-subtle)',
            background: indicators.bollinger ? 'rgba(10, 186, 181, 0.2)' : 'transparent',
            color: indicators.bollinger ? '#0abab5' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          BB (20,2)
        </button>
        <button
          onClick={() => toggleIndicator('ema21')}
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            border: indicators.ema21 ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
            background: indicators.ema21 ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: indicators.ema21 ? '#38bdf8' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          EMA 21
        </button>
        <button
          onClick={() => toggleIndicator('ema50')}
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            border: indicators.ema50 ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
            background: indicators.ema50 ? 'rgba(192, 132, 252, 0.2)' : 'transparent',
            color: indicators.ema50 ? '#c084fc' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          EMA 50
        </button>
        <button
          onClick={() => toggleIndicator('supertrend')}
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            border: indicators.supertrend ? '1px solid #10b981' : '1px solid var(--border-subtle)',
            background: indicators.supertrend ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: indicators.supertrend ? '#10b981' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          SuperTrend
        </button>
        <button
          onClick={() => toggleIndicator('vwap')}
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            border: indicators.vwap ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
            background: indicators.vwap ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
            color: indicators.vwap ? '#a855f7' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          VWAP
        </button>
        <button
          onClick={() => setSubIndicator(indicators.subIndicator === 'RSI' ? 'NONE' : 'RSI')}
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            border: indicators.subIndicator === 'RSI' ? '1px solid #81d8d0' : '1px solid var(--border-subtle)',
            background: indicators.subIndicator === 'RSI' ? 'rgba(129, 216, 208, 0.2)' : 'transparent',
            color: indicators.subIndicator === 'RSI' ? '#81d8d0' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          RSI (14)
        </button>
        <button
          onClick={() => setSubIndicator(indicators.subIndicator === 'MACD' ? 'NONE' : 'MACD')}
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            border: indicators.subIndicator === 'MACD' ? '1px solid #fbbf24' : '1px solid var(--border-subtle)',
            background: indicators.subIndicator === 'MACD' ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
            color: indicators.subIndicator === 'MACD' ? '#fbbf24' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          MACD (12,26,9)
        </button>
        <button
          onClick={() => setSubIndicator(indicators.subIndicator === 'STOCH' ? 'NONE' : 'STOCH')}
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            border: indicators.subIndicator === 'STOCH' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
            background: indicators.subIndicator === 'STOCH' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            color: indicators.subIndicator === 'STOCH' ? '#f59e0b' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          Stochastic
        </button>

        {/* AI Key Levels Plot Quick Button */}
        <button
          onClick={() => setIsAiPlottedOnChart(!isAiPlottedOnChart)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '6px',
            border: isAiPlottedOnChart ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
            background: isAiPlottedOnChart ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
            color: isAiPlottedOnChart ? '#d8b4fe' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          <Target size={12} />
          {isAiPlottedOnChart ? t.chart.aiLevelsActive : t.chart.aiKeyLevels}
        </button>

        {/* ForexFactory Red Folder Quick Pill */}
        <button
          onClick={() => setIsCalendarOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 800,
          }}
        >
          <Flame size={12} fill="#ef4444" />
          <span>{t.chart.newsCalendar}</span>
        </button>

        {/* Custom Indicators Quick Buttons */}
        {customIndicators.map(c => {
          const isChecked = c.enabled;
          return (
            <button
              key={c.id}
              onClick={() => toggleCustomIndicator(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: isChecked ? `1px solid ${c.color}` : '1px solid var(--border-subtle)',
                background: isChecked ? `${c.color}25` : 'transparent',
                color: isChecked ? c.color : 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.color }} />
              {c.shortName}
            </button>
          );
        })}
      </div>

      {/* Real-Time OHLC, AI Confluence, Next High Impact Event & Active Indicator Legend Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '8px 14px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '10px',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <strong style={{ color: '#fff', fontSize: '13px' }}>
            {symbol === 'MCL1!' ? 'MCL1! (WTI Crude Oil • OANDA / NYMEX)' : symbol} • {timeframe.toUpperCase()}
          </strong>
          {activeBar && (
            <>
              <span>O: <strong style={{ color: '#cbd5e1' }}>{activeBar.open}</strong></span>
              <span>H: <strong style={{ color: '#10b981' }}>{activeBar.high}</strong></span>
              <span>L: <strong style={{ color: '#ef4444' }}>{activeBar.low}</strong></span>
              <span>C: <strong style={{ color: isUp ? '#0abab5' : '#ef4444' }}>{activeBar.close}</strong></span>
              <span>Vol: <strong style={{ color: '#94a3b8' }}>{activeBar.volume}</strong></span>
            </>
          )}

          {/* AI Multi-Timeframe Bias Tag */}
          {activeAiReport && (
            <span
              onClick={() => setIsAiModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                color: activeAiReport.bias.includes('BUY') ? '#10b981' : activeAiReport.bias.includes('SELL') ? '#ef4444' : '#fbbf24',
                background: 'rgba(255,255,255,0.04)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
              title="Click to open Deep AI Multi-Timeframe Analysis (15m, 4h, 1D, 1W)"
            >
              <Brain size={12} />
              AI: {activeAiReport.bias.replace('_', ' ')} ({activeAiReport.confluenceScore}%)
            </span>
          )}

          {/* Next ForexFactory High-Impact Event Ticker */}
          {calendarData?.nextHighImpactEvent && (
            <span
              onClick={() => setIsCalendarOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
              title="Click to view full ForexFactory Economic Calendar"
            >
              <Flame size={11} fill="#ef4444" />
              <span>[{calendarData.nextHighImpactEvent.country}] {calendarData.nextHighImpactEvent.title} ({calendarData.nextHighImpactEvent.timeUntilFormatted})</span>
            </span>
          )}

          {/* Indicator Value Legends at Cursor */}
          {indicatorData?.ema21?.[activeIdx] !== null && indicators.ema21 && (
            <span style={{ color: '#38bdf8' }}>EMA21: {indicatorData?.ema21?.[activeIdx]?.toFixed(3)}</span>
          )}
          {indicatorData?.bollinger?.upper?.[activeIdx] !== null && indicators.bollinger && (
            <span style={{ color: '#0abab5' }}>
              BB: {indicatorData?.bollinger?.upper?.[activeIdx]?.toFixed(3)} / {indicatorData?.bollinger?.lower?.[activeIdx]?.toFixed(3)}
            </span>
          )}
          {indicatorData?.supertrend?.trendLine?.[activeIdx] !== null && indicators.supertrend && (
            <span style={{ color: indicatorData?.supertrend?.direction?.[activeIdx] === 1 ? '#10b981' : '#ef4444' }}>
              ST: {indicatorData?.supertrend?.trendLine?.[activeIdx]?.toFixed(3)}
            </span>
          )}

          {/* Custom Indicator Legends */}
          {Object.values(customIndicatorResults).map(({ def, data }) => {
            const val = data[activeIdx];
            if (val === null || val === undefined) return null;
            return (
              <span key={def.id} style={{ color: def.color }}>
                {def.shortName}: {val.toFixed(3)}
              </span>
            );
          })}
        </div>

        {activeBar && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: isUp ? '#0abab5' : '#ef4444', fontWeight: 800 }}>
              {isUp ? '+' : ''}{changePct}%
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {new Date(activeBar.timestamp * 1000).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Main Candlestick Canvas (Top Pane) */}
      <div style={{ position: 'relative', width: '100%', height: `${indicators.subIndicator !== 'NONE' ? height - 110 : height}px` }}>
        <canvas
          ref={mainCanvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'crosshair',
          }}
        />

        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(6, 13, 17, 0.7)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 700 }}>
              <RefreshCw size={16} className="animate-spin" /> {t.chart.loadingKLine}
            </div>
          </div>
        )}
      </div>

      {/* Sub-Indicator Canvas (Bottom Pane) */}
      {indicators.subIndicator !== 'NONE' && (
        <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8', marginBottom: '2px', fontFamily: 'monospace' }}>
            <span>
              {indicators.subIndicator === 'RSI' && `RSI (14): ${indicatorData?.rsi?.[activeIdx]?.toFixed(1) || '--'}`}
              {indicators.subIndicator === 'MACD' && `MACD (12,26,9): ${indicatorData?.macd?.macdLine?.[activeIdx]?.toFixed(4) || '--'} Signal: ${indicatorData?.macd?.signalLine?.[activeIdx]?.toFixed(4) || '--'}`}
              {indicators.subIndicator === 'STOCH' && `Stoch %K: ${indicatorData?.stoch?.k?.[activeIdx]?.toFixed(1) || '--'} %D: ${indicatorData?.stoch?.d?.[activeIdx]?.toFixed(1) || '--'}`}
              {indicators.subIndicator === 'ATR' && `ATR (14): ${indicatorData?.atr?.[activeIdx]?.toFixed(4) || '--'}`}
              {indicators.subIndicator === 'CUSTOM' && activeCustomSubDef && `${activeCustomSubDef.name} [${activeCustomSubDef.shortName}]: ${customIndicatorResults[activeCustomSubDef.id]?.data[activeIdx]?.toFixed(3) || '--'}`}
            </span>
            <button
              onClick={() => setSubIndicator('NONE')}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '10px' }}
            >
              {t.chart.closeSubPanel}
            </button>
          </div>
          <div style={{ position: 'relative', width: '100%', height: '90px' }}>
            <canvas
              ref={subCanvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}

      {/* Footer Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0abab5', boxShadow: '0 0 6px #0abab5' }} />
          <span>{t.chart.liveStreamActive}</span>
        </div>
        <div>
          {t.chart.tokenTrial}
        </div>
      </div>

      {/* TradingView-Style Custom Indicator Studio Modal */}
      <CustomIndicatorModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          setEditingCustomId(null);
        }}
        bars={bars}
        onApplyIndicator={handleApplyCustomIndicator}
        activeIndicators={customIndicators}
        onToggleIndicator={toggleCustomIndicator}
        onUpdateIndicatorsList={list => setCustomIndicators(list)}
        editingIndicatorId={editingCustomId}
      />

      {/* Deep AI Multi-Timeframe Analysis Modal (15m, 4h, 1D, 1W) */}
      <AiChartAnalysisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        symbol={symbol}
        onTogglePlotLevels={(enabled, rep) => {
          setIsAiPlottedOnChart(enabled);
          if (rep) setActiveAiReport(rep);
        }}
        isPlottedOnChart={isAiPlottedOnChart}
      />

      {/* ForexFactory Economic Calendar Modal */}
      <ForexFactoryCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        defaultCurrency={symbol.includes('USD') ? 'USD' : symbol.slice(0, 3)}
      />
    </div>
  );
};
