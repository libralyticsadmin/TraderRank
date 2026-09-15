/**
 * TraderRank Trade Normalization Service
 * Compliant with Infrastructure Design §3.4.
 * Absorbs all broker/gateway quirks into the internal canonical schema.
 * Nothing downstream ever branches on integration_type.
 */

import {
  CanonicalPosition,
  CanonicalTrade,
} from '../../../shared/src/types.js';
import { RawPositionPayload, RawDealPayload } from '../workers/baseWorker.js';
import { PipCalculator } from '../core/pipCalculator.js';
import { RedisStreamsBus } from '../eventbus/redisStreamsBus.js';

export class TradeNormalizerService {
  private static instance: TradeNormalizerService;
  private eventBus = RedisStreamsBus.getInstance();

  constructor() {
    this.initConsumerSubscriptions();
  }

  public static getInstance(): TradeNormalizerService {
    if (!TradeNormalizerService.instance) {
      TradeNormalizerService.instance = new TradeNormalizerService();
    }
    return TradeNormalizerService.instance;
  }

  private initConsumerSubscriptions(): void {
    // 1. Consume raw position snapshots
    this.eventBus.subscribe<RawPositionPayload[]>(
      'stream:position.raw',
      'group:normalization_positions',
      'worker-norm-1',
      async envelope => {
        const normalized = this.normalizePositions(envelope.payload);
        await this.eventBus.publish(
          'stream:position.normalized',
          'position.normalized',
          envelope.accountId,
          normalized
        );
      }
    );

    // 2. Consume raw closed deals
    this.eventBus.subscribe<RawDealPayload>(
      'stream:trade.closed.raw',
      'group:normalization_deals',
      'worker-norm-1',
      async envelope => {
        const normalized = this.normalizeDeal(envelope.payload);
        await this.eventBus.publish(
          'stream:trade.closed.normalized',
          'trade.closed.normalized',
          envelope.accountId,
          normalized
        );
      }
    );
  }

  /**
   * Transforms raw position payload into canonical positions.
   */
  public normalizePositions(rawPositions: RawPositionPayload[]): CanonicalPosition[] {
    return rawPositions.map(raw => {
      const cleanSymbol = PipCalculator.normalizeSymbol(raw.symbol);
      const profitPips = PipCalculator.calculatePips(
        cleanSymbol,
        raw.type,
        raw.openPrice,
        raw.currentPrice
      );

      return {
        id: `pos_${raw.accountId}_${raw.ticket}`,
        accountId: raw.accountId,
        ticket: raw.ticket,
        symbol: cleanSymbol,
        type: raw.type,
        lotSize: raw.volume,
        openPrice: raw.openPrice,
        currentPrice: raw.currentPrice,
        sl: raw.sl,
        tp: raw.tp,
        profitCurrency: raw.profit,
        profitPips,
        swap: raw.swap,
        commission: raw.commission,
        openTime: new Date(raw.openTime).toISOString(),
        updateTime: new Date(raw.updateTime || Date.now()).toISOString(),
      };
    });
  }

  /**
   * Transforms raw deal payload into canonical closed trade.
   */
  public normalizeDeal(raw: RawDealPayload): CanonicalTrade {
    const cleanSymbol = PipCalculator.normalizeSymbol(raw.symbol);
    const pnlPips = PipCalculator.calculatePips(
      cleanSymbol,
      raw.type,
      raw.openPrice,
      raw.closePrice
    );

    return {
      id: `trade_${raw.accountId}_${raw.ticket}`,
      accountId: raw.accountId,
      ticket: raw.ticket,
      symbol: cleanSymbol,
      type: raw.type,
      lotSize: raw.volume,
      openPrice: raw.openPrice,
      closePrice: raw.closePrice,
      openTime: new Date(raw.openTime).toISOString(),
      closeTime: new Date(raw.closeTime).toISOString(),
      pnlCurrency: raw.profit,
      pnlPips,
      commission: raw.commission,
      swap: raw.swap,
    };
  }
}
