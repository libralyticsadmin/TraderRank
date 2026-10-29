/**
 * TraderRank Realistic Market & Account Simulator
 * Provides live price ticks and position lifecycle simulation for local development,
 * testing, and zero-cost demonstration without requiring paid MetaApi subscriptions.
 */

import { RawPositionPayload, RawDealPayload } from './baseWorker.js';
import { OrderType } from '../../../shared/src/types.js';

interface MarketPrice {
  bid: number;
  ask: number;
  spread: number;
}

export class MarketSimulator {
  private static instance: MarketSimulator;
  private prices: Map<string, MarketPrice> = new Map();
  private anchors: Map<string, number> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private tickSubscribers: ((symbol: string, price: MarketPrice) => void)[] = [];

  constructor() {
    // Initial benchmark prices matching TradingView & broker spot quotes
    this.prices.set('EURUSD', { bid: 1.11400, ask: 1.11405, spread: 0.00005 });
    this.prices.set('GBPUSD', { bid: 1.33070, ask: 1.33085, spread: 0.00015 });
    this.prices.set('USDJPY', { bid: 158.240, ask: 158.245, spread: 0.005 });
    this.prices.set('AUDUSD', { bid: 0.70370, ask: 0.70380, spread: 0.00010 });
    this.prices.set('USDCAD', { bid: 1.40390, ask: 1.40405, spread: 0.00015 });
    this.prices.set('XAUUSD', { bid: 4038.50, ask: 4038.80, spread: 0.30 });
    this.prices.set('GOLD', { bid: 4038.50, ask: 4038.80, spread: 0.30 });
    this.prices.set('MCL1!', { bid: 102.84, ask: 102.88, spread: 0.04 });
    this.prices.set('USOIL', { bid: 102.84, ask: 102.88, spread: 0.04 });
    this.prices.set('BTCUSD', { bid: 80720.00, ask: 80730.00, spread: 10.00 });
    this.prices.set('US30', { bid: 52524.00, ask: 52527.00, spread: 3.00 });

    for (const [sym, p] of this.prices.entries()) {
      this.anchors.set(sym, p.bid);
    }

    this.startPriceEngine();
  }

  public static getInstance(): MarketSimulator {
    if (!MarketSimulator.instance) {
      MarketSimulator.instance = new MarketSimulator();
    }
    return MarketSimulator.instance;
  }

  private startPriceEngine(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      for (const [symbol, current] of this.prices.entries()) {
        const anchor = this.anchors.get(symbol) ?? current.bid;
        const drift = current.bid - anchor;
        const meanReversion = -drift * 0.35; // Strongly pull back to anchor

        let volatility = 0.00003;
        let decimals = 5;
        let maxDeviation = 0.0005;

        if (symbol === 'USDJPY') {
          volatility = 0.004;
          decimals = 3;
          maxDeviation = 0.05;
        } else if (symbol === 'XAUUSD' || symbol === 'GOLD') {
          volatility = 0.08;
          decimals = 2;
          maxDeviation = 0.60;
        } else if (symbol === 'MCL1!' || symbol === 'USOIL') {
          volatility = 0.015;
          decimals = 2;
          maxDeviation = 0.15;
        } else if (symbol === 'BTCUSD') {
          volatility = 3.0;
          decimals = 2;
          maxDeviation = 25.0;
        } else if (symbol === 'US30') {
          volatility = 1.0;
          decimals = 2;
          maxDeviation = 15.0;
        }

        const microJitter = (Math.random() - 0.5) * volatility;
        let rawBid = current.bid + meanReversion + microJitter;
        // Strict bounding: cannot drift beyond maxDeviation from anchor
        rawBid = Math.max(anchor - maxDeviation, Math.min(anchor + maxDeviation, rawBid));
        const newBid = Number(rawBid.toFixed(decimals));
        const newAsk = Number((newBid + current.spread).toFixed(decimals));

        const updated = { bid: newBid, ask: newAsk, spread: current.spread };
        this.prices.set(symbol, updated);

        this.tickSubscribers.forEach(cb => cb(symbol, updated));
      }
    }, 400); // 400ms tick cadence
  }

  public getPrice(symbol: string): MarketPrice {
    return this.prices.get(symbol) || { bid: 1.11400, ask: 1.11405, spread: 0.00005 };
  }

  public getAllPrices(): Map<string, MarketPrice> {
    return new Map(this.prices);
  }

  public updatePrice(symbol: string, bid: number, ask?: number): void {
    this.anchors.set(symbol, bid);
    const current = this.prices.get(symbol) || { bid, ask: ask ?? (bid + 0.0001), spread: 0.0001 };
    const finalAsk = ask ?? (bid + current.spread);
    const updated = { bid, ask: finalAsk, spread: Number((finalAsk - bid).toFixed(5)) };
    this.prices.set(symbol, updated);
    this.tickSubscribers.forEach(cb => cb(symbol, updated));
  }

  public onTick(cb: (symbol: string, price: MarketPrice) => void): () => void {
    this.tickSubscribers.push(cb);
    return () => {
      this.tickSubscribers = this.tickSubscribers.filter(sub => sub !== cb);
    };
  }

  /**
   * Generates realistic initial open positions for an account.
   */
  public generateInitialPositions(accountId: string, broker: string): RawPositionPayload[] {
    const symbols = ['EURUSD', 'XAUUSD', 'USDJPY', 'GBPUSD'];
    const count = 2 + Math.floor(Math.random() * 2);
    const positions: RawPositionPayload[] = [];

    for (let i = 0; i < count; i++) {
      const sym = symbols[i % symbols.length];
      const market = this.getPrice(sym);
      const isBuy = Math.random() > 0.45;
      const type: OrderType = isBuy ? 'BUY' : 'SELL';
      const volume = Number((0.1 + Math.random() * 0.9).toFixed(2));

      // Open price slightly offset from current
      const offset = (Math.random() * 0.003) * (isBuy ? -1 : 1);
      const openPrice = Math.max(0.01, market.bid + offset);
      const currentPrice = isBuy ? market.bid : market.ask;

      // Asset-specific contract sizes: Forex = 100k, Gold = 100 oz, Crypto = 1, Index = 1
      const contractSize = sym === 'XAUUSD' ? 100 : sym === 'BTCUSD' || sym === 'US30' ? 1 : 100000;
      const priceDiff = isBuy ? (currentPrice - openPrice) : (openPrice - currentPrice);
      let profit = priceDiff * volume * contractSize;
      if (sym === 'USDJPY' && currentPrice > 0) {
        profit = profit / currentPrice;
      }

      positions.push({
        accountId,
        ticket: `pos_${Math.floor(10000000 + Math.random() * 90000000)}`,
        symbol: broker === 'XM' ? `${sym}.m` : broker === 'Axiory' ? `${sym}_i` : sym,
        type,
        volume,
        openPrice: Number(openPrice.toFixed(sym === 'USDJPY' ? 3 : sym === 'XAUUSD' ? 2 : 5)),
        currentPrice: Number(currentPrice.toFixed(sym === 'USDJPY' ? 3 : sym === 'XAUUSD' ? 2 : 5)),
        sl: Number((openPrice * (isBuy ? 0.99 : 1.01)).toFixed(2)),
        tp: Number((openPrice * (isBuy ? 1.015 : 0.985)).toFixed(2)),
        profit: Number(profit.toFixed(2)),
        swap: -1.25,
        commission: -3.50,
        openTime: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
        updateTime: new Date().toISOString(),
      });
    }

    return positions;
  }

  /**
   * Generates realistic historical trade deals for scoring/XP.
   */
  public generateHistoricalDeals(accountId: string, broker: string): RawDealPayload[] {
    const symbols = ['EURUSD', 'XAUUSD', 'USDJPY', 'GBPUSD', 'US30'];
    const deals: RawDealPayload[] = [];
    const count = 12;

    const now = Date.now();
    for (let i = count; i >= 1; i--) {
      const sym = symbols[i % symbols.length];
      const isBuy = Math.random() > 0.35; // 65% win bias for demo fun
      const isWin = Math.random() > 0.32;
      const volume = Number((0.2 + Math.random() * 0.8).toFixed(2));
      const basePrice = sym === 'XAUUSD' ? 4038.50 : sym === 'USDJPY' ? 158.24 : sym === 'BTCUSD' ? 80720 : sym === 'MCL1!' || sym === 'USOIL' ? 102.85 : 1.114;

      const openPrice = basePrice;
      const delta = (isWin ? 1 : -1) * (Math.random() * 0.006 + 0.001);
      const closePrice = Math.max(0.01, isBuy ? openPrice + delta : openPrice - delta);

      const profit = (isBuy ? (closePrice - openPrice) : (openPrice - closePrice)) * volume * 10000;

      deals.push({
        accountId,
        ticket: `deal_${90000000 + i}`,
        symbol: broker === 'XM' ? `${sym}.m` : sym,
        type: isBuy ? 'BUY' : 'SELL',
        volume,
        openPrice: Number(openPrice.toFixed(3)),
        closePrice: Number(closePrice.toFixed(3)),
        profit: Number(profit.toFixed(2)),
        commission: -4.00,
        swap: -0.50,
        openTime: new Date(now - i * 14400000).toISOString(),
        closeTime: new Date(now - i * 14400000 + 3600000).toISOString(),
      });
    }

    return deals;
  }
}
