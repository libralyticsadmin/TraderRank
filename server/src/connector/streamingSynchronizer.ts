/**
 * TraderRank Streaming Synchronization Model
 * In-memory synchronized mirror of MetaTrader account state, positions,
 * orders, deals, equity, margin, and live pricing.
 *
 * Modeled against MetaApi Python SDK SynchronizationModel & TerminalState.
 */

export interface SynchronizedAccountInfo {
  accountId: string;
  broker: string;
  server: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number | null;
  floatingProfit: number;
  leverage: number;
  updatedAt: string;
}

export interface SynchronizedPosition {
  id: string;
  accountId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number; // lots
  openPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  profit: number;
  swap: number;
  commission: number;
  netProfit: number;
  openTime: string;
  updateTime: string;
}

export interface SynchronizedOrder {
  id: string;
  accountId: string;
  symbol: string;
  type: 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  state: 'PLACED' | 'CANCELLED' | 'FILLED';
  openTime: string;
}

export interface SynchronizedDeal {
  id: string;
  positionId: string;
  accountId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  time: string;
}

export type AccountInfoListener = (account: SynchronizedAccountInfo) => void;
export type PositionUpdateListener = (positions: SynchronizedPosition[]) => void;
export type DealListener = (deal: SynchronizedDeal) => void;

export class StreamingSynchronizer {
  private accountId: string;
  private accountInfo: SynchronizedAccountInfo;
  private positions = new Map<string, SynchronizedPosition>();
  private orders = new Map<string, SynchronizedOrder>();
  private deals: SynchronizedDeal[] = [];

  private accountListeners: Set<AccountInfoListener> = new Set();
  private positionListeners: Set<PositionUpdateListener> = new Set();
  private dealListeners: Set<DealListener> = new Set();

  private isSynchronized = false;

  constructor(initialInfo: Omit<SynchronizedAccountInfo, 'equity' | 'freeMargin' | 'marginLevel' | 'floatingProfit' | 'updatedAt'>) {
    this.accountId = initialInfo.accountId;
    this.accountInfo = {
      ...initialInfo,
      equity: initialInfo.balance,
      freeMargin: initialInfo.balance - initialInfo.margin,
      marginLevel: initialInfo.margin > 0 ? (initialInfo.balance / initialInfo.margin) * 100 : null,
      floatingProfit: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  public getAccountId(): string {
    return this.accountId;
  }

  public markSynchronized(): void {
    this.isSynchronized = true;
    this.recalculateAccountState();
  }

  public getIsSynchronized(): boolean {
    return this.isSynchronized;
  }

  public onAccountInfo(listener: AccountInfoListener): () => void {
    this.accountListeners.add(listener);
    return () => this.accountListeners.delete(listener);
  }

  public onPositions(listener: PositionUpdateListener): () => void {
    this.positionListeners.add(listener);
    return () => this.positionListeners.delete(listener);
  }

  public onDeal(listener: DealListener): () => void {
    this.dealListeners.add(listener);
    return () => this.dealListeners.delete(listener);
  }

  /**
   * Updates balance from broker statement or cash transaction.
   */
  public updateBalance(balance: number): void {
    this.accountInfo.balance = balance;
    this.recalculateAccountState();
  }

  /**
   * Ingests or updates a position from live streaming quote or MT snapshot.
   */
  public updatePosition(pos: Omit<SynchronizedPosition, 'netProfit' | 'updateTime'>): void {
    const netProfit = Number((pos.profit + pos.swap + pos.commission).toFixed(2));
    const fullPos: SynchronizedPosition = {
      ...pos,
      netProfit,
      updateTime: new Date().toISOString(),
    };

    this.positions.set(pos.id, fullPos);
    this.recalculateAccountState();
    this.emitPositions();
  }

  /**
   * Closes a position and creates an archival deal.
   */
  public closePosition(positionId: string, closePrice: number, closeTime = new Date().toISOString()): SynchronizedDeal | null {
    const pos = this.positions.get(positionId);
    if (!pos) return null;

    this.positions.delete(positionId);

    const deal: SynchronizedDeal = {
      id: `deal_${pos.id}_${Date.now()}`,
      positionId: pos.id,
      accountId: this.accountId,
      symbol: pos.symbol,
      type: pos.type,
      volume: pos.volume,
      price: closePrice,
      profit: pos.profit,
      commission: pos.commission,
      swap: pos.swap,
      time: closeTime,
    };

    this.deals.unshift(deal);
    this.accountInfo.balance = Number((this.accountInfo.balance + pos.profit + pos.swap + pos.commission).toFixed(2));

    this.recalculateAccountState();
    this.emitPositions();

    for (const listener of this.dealListeners) {
      listener(deal);
    }

    return deal;
  }

  /**
   * Applies market tick updates across matching open positions and recalibrates equity in real time.
   */
  public applyPriceTick(symbol: string, bid: number, ask: number): void {
    let changed = false;

    for (const pos of this.positions.values()) {
      const cleanPosSymbol = pos.symbol.replace(/(_i|\.ecn|\.r|m)$/i, '').toUpperCase();
      const cleanTickSymbol = symbol.replace(/(_i|\.ecn|\.r|m)$/i, '').toUpperCase();

      if (cleanPosSymbol === cleanTickSymbol) {
        const currentPrice = pos.type === 'BUY' ? bid : ask;
        const diff = pos.type === 'BUY' ? currentPrice - pos.openPrice : pos.openPrice - currentPrice;
        // Standard forex lot multiplier: 100,000 units
        const profit = Number((diff * pos.volume * 100000).toFixed(2));
        pos.currentPrice = currentPrice;
        pos.profit = profit;
        pos.netProfit = Number((profit + pos.swap + pos.commission).toFixed(2));
        pos.updateTime = new Date().toISOString();
        changed = true;
      }
    }

    if (changed) {
      this.recalculateAccountState();
      this.emitPositions();
    }
  }

  private recalculateAccountState(): void {
    let totalFloating = 0;
    for (const pos of this.positions.values()) {
      totalFloating += pos.netProfit;
    }

    this.accountInfo.floatingProfit = Number(totalFloating.toFixed(2));
    this.accountInfo.equity = Number((this.accountInfo.balance + this.accountInfo.floatingProfit).toFixed(2));
    this.accountInfo.freeMargin = Number((this.accountInfo.equity - this.accountInfo.margin).toFixed(2));
    this.accountInfo.marginLevel =
      this.accountInfo.margin > 0
        ? Number(((this.accountInfo.equity / this.accountInfo.margin) * 100).toFixed(2))
        : null;
    this.accountInfo.updatedAt = new Date().toISOString();

    for (const listener of this.accountListeners) {
      listener({ ...this.accountInfo });
    }
  }

  private emitPositions(): void {
    const list = Array.from(this.positions.values());
    for (const listener of this.positionListeners) {
      listener(list);
    }
  }

  public getAccountInfo(): SynchronizedAccountInfo {
    return { ...this.accountInfo };
  }

  public getPositions(): SynchronizedPosition[] {
    return Array.from(this.positions.values());
  }

  public getDeals(): SynchronizedDeal[] {
    return [...this.deals];
  }

  public getOrders(): SynchronizedOrder[] {
    return Array.from(this.orders.values());
  }
}
