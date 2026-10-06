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
  private timer: NodeJS.Timeout | null = null;
  private tickSubscribers: ((symbol: string, price: MarketPrice) => void)[] = [];

  constructor() {
    // Initial benchmark prices
    this.prices.set('EURUSD', { bid: 1.12245, ask: 1.12255, spread: 0.00010 });
    this.prices.set('GBPUSD', { bid: 1.32195, ask: 1.32210, spread: 0.00015 });
    this.prices.set('USDJPY', { bid: 158.140, ask: 158.155, spread: 0.015 });
    this.prices.set('AUDUSD', { bid: 0.69695, ask: 0.69707, spread: 0.00012 });
    this.prices.set('USDCAD', { bid: 1.42555, ask: 1.42570, spread: 0.00015 });
    this.prices.set('XAUUSD', { bid: 4174.20, ask: 4174.50, spread: 0.30 });
    this.prices.set('MCL1!', { bid: 87.62, ask: 87.65, spread: 0.03 });
    this.prices.set('BTCUSD', { bid: 85845.00, ask: 85855.00, spread: 10.00 });

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
        // Geometric Brownian walk
        let volatility = 0.00008;
        if (symbol === 'USDJPY') volatility = 0.015;
        if (symbol === 'XAUUSD') volatility = 0.25;
        if (symbol === 'MCL1!' || symbol === 'USOIL') volatility = 0.04;
        if (symbol === 'BTCUSD') volatility = 8.5;

        const delta = (Math.random() - 0.49) * volatility;
        const newBid = Math.max(0.0001, current.bid + delta);
        const newAsk = newBid + current.spread;

        const updated = { bid: newBid, ask: newAsk, spread: current.spread };
        this.prices.set(symbol, updated);

        this.tickSubscribers.forEach(cb => cb(symbol, updated));
      }
    }, 400); // 400ms tick cadence (matching Exness 100-500ms bounds)
  }

  public getPrice(symbol: string): MarketPrice {
    return this.prices.get(symbol) || { bid: 1.08500, ask: 1.08510, spread: 0.00010 };
  }

  public getAllPrices(): Map<string, MarketPrice> {
    return new Map(this.prices);
  }

  public updatePrice(symbol: string, bid: number, ask?: number): void {
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
      const basePrice = sym === 'XAUUSD' ? 4174 : sym === 'USDJPY' ? 158.15 : sym === 'BTCUSD' ? 85850 : 1.122;

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
