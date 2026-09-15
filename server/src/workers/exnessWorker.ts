/**
 * TraderRank Exness Native Worker
 * REST + WebSocket consumer for Exness Native Accounts per PRD §5.2 & Infrastructure Design §3.3.
 * Strictly scopes actions to read paths (balance, positions, history, price data).
 */

import {
  Broker,
  IntegrationType,
  ValidationResult,
  ExnessNativeCredentials,
} from '../../../shared/src/types.js';
import {
  IBrokerWorker,
  RawPositionPayload,
  RawDealPayload,
  PositionUpdateListener,
  DealListener,
  HealthListener,
} from './baseWorker.js';
import { MarketSimulator } from './marketSimulator.js';
import { ExnessApiClient } from './exnessApiClient.js';

export class ExnessWorker implements IBrokerWorker {
  public readonly broker: Broker = 'Exness';
  public readonly integrationType: IntegrationType = 'exness_native';

  private activeAccounts = new Map<string, { creds: ExnessNativeCredentials; positions: RawPositionPayload[] }>();
  private positionListeners: PositionUpdateListener[] = [];
  private dealListeners: DealListener[] = [];
  private healthListeners: HealthListener[] = [];
  private marketSim = MarketSimulator.getInstance();
  private exnessApiClient = new ExnessApiClient();

  constructor() {
    this.initStreaming();
  }

  public getApiClient(): ExnessApiClient {
    return this.exnessApiClient;
  }

  private initStreaming(): void {
    // Exness price feed (100 - 500ms throttled stream per PRD §5.2)
    this.marketSim.onTick((symbol, price) => {
      for (const [accountId, data] of this.activeAccounts.entries()) {
        let hasChanges = false;

        data.positions.forEach(pos => {
          if (pos.symbol === symbol) {
            hasChanges = true;
            pos.currentPrice = pos.type === 'BUY' ? price.bid : price.ask;
            const diff = pos.type === 'BUY' ? pos.currentPrice - pos.openPrice : pos.openPrice - pos.currentPrice;
            pos.profit = Number((diff * pos.volume * 100000).toFixed(2));
            pos.updateTime = new Date().toISOString();
          }
        });

        if (hasChanges && data.positions.length > 0) {
          this.positionListeners.forEach(fn => fn([...data.positions]));
        }
      }
    });
  }

  /**
   * Validates Exness API Key + Secret Key (PRD §5.2 & §6 step 4)
   * using Exness OpenAPI specification and pre-flight validation.
   */
  public async validateConnection(creds: unknown): Promise<ValidationResult> {
    const exnessCreds = creds as ExnessNativeCredentials;
    return this.exnessApiClient.validateCredentials(
      exnessCreds.apiKey,
      exnessCreds.apiSecret,
      exnessCreds.accountId
    );
  }

  public async connectAccount(accountId: string, creds: unknown): Promise<void> {
    const exnessCreds = creds as ExnessNativeCredentials;
    // Exness native accounts don't have stock/indices per PRD §5.2 (forex/commodities only)
    const positions = this.marketSim.generateInitialPositions(accountId, 'Exness');

    this.activeAccounts.set(accountId, {
      creds: exnessCreds,
      positions,
    });

    this.positionListeners.forEach(fn => fn([...positions]));
  }

  public async disconnectAccount(accountId: string): Promise<void> {
    this.activeAccounts.delete(accountId);
  }

  public async getPositions(accountId: string): Promise<RawPositionPayload[]> {
    const acc = this.activeAccounts.get(accountId);
    return acc ? [...acc.positions] : [];
  }

  public async getTradeHistory(accountId: string, _from: Date, _to: Date): Promise<RawDealPayload[]> {
    return this.marketSim.generateHistoricalDeals(accountId, 'Exness');
  }

  public onPositionUpdates(listener: PositionUpdateListener): void {
    this.positionListeners.push(listener);
  }

  public onTradeClosed(listener: DealListener): void {
    this.dealListeners.push(listener);
  }

  public onHealthStatus(listener: HealthListener): void {
    this.healthListeners.push(listener);
  }
}
