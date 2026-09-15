/**
 * TraderRank Base Worker Contract
 * Unified interface for all ingestion workers per Infrastructure Design §3.3.
 */

import { Broker, IntegrationType, ValidationResult, OrderType } from '../../../shared/src/types.js';

export interface RawPositionPayload {
  accountId: string;
  ticket: string;
  symbol: string;
  type: OrderType;
  volume: number; // lots
  openPrice: number;
  currentPrice: number;
  sl?: number;
  tp?: number;
  profit: number; // currency profit
  swap: number;
  commission: number;
  openTime: string; // ISO or timestamp
  updateTime: string;
}

export interface RawDealPayload {
  accountId: string;
  ticket: string;
  symbol: string;
  type: OrderType;
  volume: number;
  openPrice: number;
  closePrice: number;
  profit: number;
  commission: number;
  swap: number;
  openTime: string;
  closeTime: string;
}

export type PositionUpdateListener = (positions: RawPositionPayload[]) => void;
export type DealListener = (deal: RawDealPayload) => void;
export type HealthListener = (status: 'HEALTHY' | 'DEGRADED' | 'DISCONNECTED', error?: string) => void;

export interface IBrokerWorker {
  readonly broker: Broker;
  readonly integrationType: IntegrationType;

  /**
   * Synchronous validation call before saving account (PRD §6 step 4).
   */
  validateConnection(creds: unknown): Promise<ValidationResult>;

  /**
   * Provision and start streaming for an account.
   */
  connectAccount(accountId: string, creds: unknown): Promise<void>;

  /**
   * Stop tracking an account.
   */
  disconnectAccount(accountId: string): Promise<void>;

  /**
   * Snapshot query for active positions.
   */
  getPositions(accountId: string): Promise<RawPositionPayload[]>;

  /**
   * Historical trades backfill query.
   */
  getTradeHistory(accountId: string, from: Date, to: Date): Promise<RawDealPayload[]>;

  /**
   * Event listeners for stream consumption.
   */
  onPositionUpdates(listener: PositionUpdateListener): void;
  onTradeClosed(listener: DealListener): void;
  onHealthStatus(listener: HealthListener): void;
}
