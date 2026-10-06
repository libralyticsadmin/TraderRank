/**
 * AllTick Real-Time Market Feed & Candlestick Adapter
 * Supports AllTick Forex, Crypto & Commodities REST & WebSocket API
 * Reference: https://github.com/AllTick-Official/alltick-realtime-forex-crypto-stock-tick-finance-websocket-api.git
 */

import WebSocket from 'ws';
import { CandlestickBar, CandlestickTimeframe, MarketCandlestickResponse } from '../../../shared/src/types.js';

export interface AllTickTickData {
  code: string;
  seq?: number | string;
  tick_time?: number | string;
  price: string | number;
  volume?: string | number;
  turnover?: string | number;
  trade_direction?: number;
}

export interface AllTickPushMessage {
  cmd_id: number;
  data?: AllTickTickData;
}

export interface AllTickKlineItem {
  timestamp: string | number;
  open_price: string | number;
  close_price: string | number;
  high_price: string | number;
  low_price: string | number;
  volume: string | number;
  turnover?: string | number;
}

export interface AllTickSubscriptionResponse {
  ret: number;
  msg: string;
  cmd_id: number;
  seq_id: number;
  trace: string;
}

const TIMEFRAME_KLINE_TYPE_MAP: Record<CandlestickTimeframe, number> = {
  '1m': 1,
  '5m': 2,
  '15m': 3,
  '30m': 4,
  '1h': 5,
  '4h': 7,
  '1D': 8,
  '1W': 9,
  '1M': 10,
};

const TIMEFRAME_SECONDS_MAP: Record<CandlestickTimeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '4h': 14400,
  '1D': 86400,
  '1W': 604800,
  '1M': 2592000,
};

export class AllTickAdapter {
  private wsUrl = 'wss://quote.alltick.co/quote-b-ws-api';
  private restQuoteUrl = 'https://quote.alltick.co/quote-b-api/trade-tick';
  private restKlineUrl = 'https://quote.alltick.co/quote-b-api/kline';
  private token: string;
  private ws: WebSocket | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private onTickCallback?: (symbol: string, price: number, timestamp: number) => void;
  private onCandleCallback?: (symbol: string, timeframe: CandlestickTimeframe, bar: CandlestickBar) => void;

  // In-memory candlestick cache per symbol and timeframe
  private candleCache: Map<string, CandlestickBar[]> = new Map();

  constructor(token?: string) {
    if (token !== undefined) {
      this.token = token;
    } else {
      this.token = process.env.ALLTICK_API_TOKEN || '4554c41c6fc5298fb839ca4530639663-c-app';
    }
  }

  public static toAllTickCode(symbol: string): string {
    const clean = symbol.toUpperCase().trim();
    if (clean === 'XAUUSD' || clean === 'GOLD') return 'GOLD';
    if (clean === 'MCL1!' || clean === 'MCL1' || clean === 'MCL' || clean === 'USOIL' || clean === 'OIL' || clean === 'WTI' || clean === 'CL' || clean === 'WTICOUSD' || clean === 'WTICO_USD') return 'USOIL';
    return clean;
  }

  public static fromAllTickCode(code: string): string {
    const clean = code.toUpperCase().trim();
    if (clean === 'GOLD') return 'XAUUSD';
    if (clean === 'USOIL') return 'MCL1!';
    return clean;
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public getToken(): string {
    return this.token;
  }

  public onTick(callback: (symbol: string, price: number, timestamp: number) => void): void {
    this.onTickCallback = callback;
  }

  public onCandleUpdate(callback: (symbol: string, timeframe: CandlestickTimeframe, bar: CandlestickBar) => void): void {
    this.onCandleCallback = callback;
  }

  /**
   * Fetch historical and recent Candlestick (K-Line) data from AllTick REST API
   */
  public async fetchCandlesticks(
    symbol: string = 'USDJPY',
    timeframe: CandlestickTimeframe = '1m',
    count: number = 50
  ): Promise<MarketCandlestickResponse> {
    const klineType = TIMEFRAME_KLINE_TYPE_MAP[timeframe] || 1;
    const cacheKey = `${symbol}_${timeframe}`;
    const allTickCode = AllTickAdapter.toAllTickCode(symbol);

    if (!this.token) {
      return {
        symbol,
        timeframe,
        bars: this.generateSyntheticCandles(symbol, timeframe, count),
        source: 'SYNTHETIC_FALLBACK',
        lastUpdated: new Date().toISOString(),
      };
    }

    try {
      const queryObj = {
        trace: `kline_${allTickCode}_${Date.now()}`,
        data: {
          code: allTickCode,
          kline_type: klineType,
          kline_timestamp_end: 0,
          query_kline_num: Math.min(count, 300),
          adjust_type: 0,
        },
      };

      const requestUrl = `${this.restKlineUrl}?token=${encodeURIComponent(this.token)}&query=${encodeURIComponent(JSON.stringify(queryObj))}`;

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'TraderRank-Server/1.0',
          'X-API-Key': this.token,
        },
      });

      if (response.ok) {
        const body = (await response.json()) as {
          ret?: number;
          msg?: string;
          data?: {
            code?: string;
            kline_list?: AllTickKlineItem[];
          };
        };

        if (body.ret === 200 && body.data?.kline_list && body.data.kline_list.length > 0) {
          const bars: CandlestickBar[] = body.data.kline_list.map(k => {
            const ts = typeof k.timestamp === 'string' ? parseInt(k.timestamp, 10) : Number(k.timestamp);
            return {
              timestamp: ts,
              timeString: new Date(ts * 1000).toISOString(),
              open: typeof k.open_price === 'string' ? parseFloat(k.open_price) : Number(k.open_price),
              high: typeof k.high_price === 'string' ? parseFloat(k.high_price) : Number(k.high_price),
              low: typeof k.low_price === 'string' ? parseFloat(k.low_price) : Number(k.low_price),
              close: typeof k.close_price === 'string' ? parseFloat(k.close_price) : Number(k.close_price),
              volume: typeof k.volume === 'string' ? parseFloat(k.volume) : Number(k.volume || 0),
              turnover: k.turnover ? (typeof k.turnover === 'string' ? parseFloat(k.turnover) : Number(k.turnover)) : undefined,
            };
          });

          this.candleCache.set(cacheKey, bars);

          return {
            symbol,
            timeframe,
            bars,
            source: 'ALLTICK_LIVE',
            lastUpdated: new Date().toISOString(),
          };
        }
      }

      // Check if cache has existing bars
      const cached = this.candleCache.get(cacheKey);
      if (cached && cached.length > 0) {
        return {
          symbol,
          timeframe,
          bars: cached,
          source: 'ALLTICK_CACHED',
          lastUpdated: new Date().toISOString(),
        };
      }

      return {
        symbol,
        timeframe,
        bars: this.generateSyntheticCandles(symbol, timeframe, count),
        source: 'SYNTHETIC_FALLBACK',
        lastUpdated: new Date().toISOString(),
      };
    } catch {
      const cached = this.candleCache.get(cacheKey);
      if (cached && cached.length > 0) {
        return {
          symbol,
          timeframe,
          bars: cached,
          source: 'ALLTICK_CACHED',
          lastUpdated: new Date().toISOString(),
        };
      }

      return {
        symbol,
        timeframe,
        bars: this.generateSyntheticCandles(symbol, timeframe, count),
        source: 'SYNTHETIC_FALLBACK',
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Update active forming candle in real-time as WebSocket ticks arrive
   */
  public updateCandleWithTick(symbol: string, price: number, timestampMs: number): void {
    const timeframes: CandlestickTimeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M'];
    const timestampSec = Math.floor(timestampMs / 1000);

    for (const tf of timeframes) {
      const intervalSec = TIMEFRAME_SECONDS_MAP[tf] || 60;
      const candleBucket = Math.floor(timestampSec / intervalSec) * intervalSec;
      const cacheKey = `${symbol}_${tf}`;

      let bars = this.candleCache.get(cacheKey) || [];
      if (bars.length === 0) {
        bars = this.generateSyntheticCandles(symbol, tf, 30);
      }

      const lastBar = bars[bars.length - 1];

      if (lastBar && lastBar.timestamp === candleBucket) {
        // Update current candle
        lastBar.high = Math.max(lastBar.high, price);
        lastBar.low = Math.min(lastBar.low, price);
        lastBar.close = price;
        lastBar.volume += 1;
        if (this.onCandleCallback) {
          this.onCandleCallback(symbol, tf, lastBar);
        }
      } else if (!lastBar || candleBucket > lastBar.timestamp) {
        // Start a new candle bar
        const newBar: CandlestickBar = {
          timestamp: candleBucket,
          timeString: new Date(candleBucket * 1000).toISOString(),
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 1,
        };
        bars.push(newBar);
        if (bars.length > 300) bars.shift();
        this.candleCache.set(cacheKey, bars);
        if (this.onCandleCallback) {
          this.onCandleCallback(symbol, tf, newBar);
        }
      }
    }
  }

  /**
   * Generates realistic continuous OHLC candles when initializing or as seamless fallback
   */
  public generateSyntheticCandles(
    symbol: string,
    timeframe: CandlestickTimeframe = '1m',
    count: number = 50
  ): CandlestickBar[] {
    const basePrices: Record<string, number> = {
      EURUSD: 1.0865,
      GBPUSD: 1.2755,
      USDJPY: 158.03,
      AUDUSD: 0.6585,
      USDCAD: 1.3650,
      XAUUSD: 4174.50,
      GOLD: 4174.50,
      'MCL1!': 90.15,
      MCL1: 90.15,
      USOIL: 90.15,
      WTICOUSD: 90.15,
      OIL: 90.15,
      BTCUSD: 95400.0,
    };

    const base = basePrices[symbol] || 1.0000;
    const intervalSec = TIMEFRAME_SECONDS_MAP[timeframe] || 60;
    const nowSec = Math.floor(Date.now() / 1000);
    const bars: CandlestickBar[] = [];

    let currentPrice = base;
    const volatility = symbol === 'BTCUSD' ? 45.0 : symbol === 'XAUUSD' || symbol === 'GOLD' ? 2.5 : symbol === 'MCL1!' || symbol === 'USOIL' || symbol === 'OIL' ? 0.35 : symbol === 'USDJPY' ? 0.08 : 0.0006;

    for (let i = count - 1; i >= 0; i--) {
      const bucketTime = (Math.floor(nowSec / intervalSec) - i) * intervalSec;
      const open = currentPrice;
      const delta1 = (Math.random() - 0.49) * volatility;
      const delta2 = (Math.random() - 0.49) * volatility;
      const isForex = (symbol === 'EURUSD' || symbol === 'GBPUSD' || symbol === 'AUDUSD' || symbol === 'USDCAD');
      const close = parseFloat((open + delta1).toFixed(symbol === 'USDJPY' ? 3 : isForex ? 5 : 2));
      const high = parseFloat((Math.max(open, close) + Math.abs(delta2) * 0.8).toFixed(symbol === 'USDJPY' ? 3 : isForex ? 5 : 2));
      const low = parseFloat((Math.min(open, close) - Math.abs(delta2) * 0.8).toFixed(symbol === 'USDJPY' ? 3 : isForex ? 5 : 2));
      const volume = Math.floor(50 + Math.random() * 250);

      bars.push({
        timestamp: bucketTime,
        timeString: new Date(bucketTime * 1000).toISOString(),
        open,
        high,
        low,
        close,
        volume,
      });

      currentPrice = close;
    }

    return bars;
  }

  /**
   * Query the latest trade ticks via AllTick REST API
   */
  public async fetchLatestQuotes(symbols: string[] = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD', 'MCL1!', 'BTCUSD']): Promise<{
    success: boolean;
    data?: AllTickTickData[];
    error?: string;
  }> {
    if (!this.token) {
      return { success: false, error: 'AllTick API token is required' };
    }

    try {
      const queryCodes = symbols.map(s => AllTickAdapter.toAllTickCode(s));
      const payload = {
        trace: `traderrank_${Date.now()}`,
        data: {
          symbol_list: queryCodes.map(code => ({ code })),
        },
      };

      const requestUrl = `${this.restQuoteUrl}?token=${encodeURIComponent(this.token)}&query=${encodeURIComponent(JSON.stringify(payload))}`;

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.token,
        },
      });

      const body = (await response.json()) as { ret?: number; msg?: string; data?: { tick_list?: AllTickTickData[] } };

      if (response.ok && body.ret === 200 && body.data?.tick_list) {
        const normalizedTicks = body.data.tick_list.map(tick => ({
          ...tick,
          code: AllTickAdapter.fromAllTickCode(tick.code),
        }));
        return {
          success: true,
          data: normalizedTicks,
        };
      }

      return {
        success: false,
        error: body.msg || `AllTick API returned status ${response.status}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  /**
   * Connect to AllTick real-time WebSocket feed
   */
  public connect(symbols: string[] = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD']): Promise<boolean> {
    return new Promise(resolve => {
      if (!this.token) {
        console.warn('[AllTick] No API token configured; WebSocket connection skipped.');
        return resolve(false);
      }

      const connectionUrl = `${this.wsUrl}?token=${encodeURIComponent(this.token)}`;

      try {
        this.ws = new WebSocket(connectionUrl, {
          headers: {
            'X-API-Key': this.token,
          },
        });

        this.ws.on('open', () => {
          this.isConnected = true;
          console.log('⚡ [AllTick WebSocket] Connected successfully with 7-day token');

          // Send real-time transaction quote subscription (Protocol 22004)
          this.subscribe(symbols);

          // Start heartbeat every 10 seconds (Protocol 22000)
          this.startHeartbeat();
          resolve(true);
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('error', err => {
          console.warn('[AllTick WS Error]:', err.message);
          this.isConnected = false;
          resolve(false);
        });

        this.ws.on('close', () => {
          this.isConnected = false;
          this.stopHeartbeat();
        });
      } catch (err: unknown) {
        console.warn('[AllTick WS Init Error]:', err);
        resolve(false);
      }
    });
  }

  public subscribe(symbols: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const queryCodes = symbols.map(s => AllTickAdapter.toAllTickCode(s));
    const subMsg = {
      cmd_id: 22004,
      seq_id: Math.floor(Math.random() * 1000000),
      trace: `sub_${Date.now()}`,
      data: {
        symbol_list: queryCodes.map(code => ({ code })),
      },
    };

    this.ws.send(JSON.stringify(subMsg));
  }

  public handleMessage(rawMessage: string): void {
    try {
      const parsed = JSON.parse(rawMessage) as AllTickPushMessage;

      // Protocol 22998 = Real-time transaction tick push
      if (parsed.cmd_id === 22998 && parsed.data) {
        const tick = parsed.data;
        const price = typeof tick.price === 'string' ? parseFloat(tick.price) : Number(tick.price);
        const timestamp = typeof tick.tick_time === 'number' ? tick.tick_time : Date.now();

        if (tick.code && !isNaN(price)) {
          const stdSymbol = AllTickAdapter.fromAllTickCode(tick.code);
          // Update candlestick bars in memory
          this.updateCandleWithTick(stdSymbol, price, timestamp);

          if (this.onTickCallback) {
            this.onTickCallback(stdSymbol, price, timestamp);
          }
        }
      }
    } catch {
      // Ignore non-json frames
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const heartbeat = {
          cmd_id: 22000,
          seq_id: Math.floor(Math.random() * 1000000),
          trace: `hb_${Date.now()}`,
          data: {},
        };
        this.ws.send(JSON.stringify(heartbeat));
      }
    }, 10000);
  }

  public stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

