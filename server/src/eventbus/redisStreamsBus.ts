/**
 * TraderRank Event Bus (Redis Streams Pattern)
 * Compliant with Infrastructure Design §4.
 * Decouples Ingestion Workers -> Normalization -> Leaderboard / XP / Notifications.
 */

import crypto from 'crypto';
import { EventBusEnvelope } from '../../../shared/src/types.js';

export type EventHandler<T> = (envelope: EventBusEnvelope<T>) => Promise<void> | void;

export interface IEventBus {
  publish<T>(stream: string, eventType: EventBusEnvelope<T>['eventType'], accountId: string, payload: T): Promise<string>;
  subscribe<T>(stream: string, consumerGroup: string, consumerId: string, handler: EventHandler<T>): void;
  getStreamHistory(stream: string, limit?: number): EventBusEnvelope<unknown>[];
}

/**
 * In-memory high-throughput Redis Streams simulation engine.
 * Supports consumer groups, stream offsets, and fault isolation.
 */
export class RedisStreamsBus implements IEventBus {
  private static instance: RedisStreamsBus;
  private streams = new Map<string, EventBusEnvelope<unknown>[]>();
  private consumerGroups = new Map<string, Map<string, EventHandler<unknown>>>();

  public static getInstance(): RedisStreamsBus {
    if (!RedisStreamsBus.instance) {
      RedisStreamsBus.instance = new RedisStreamsBus();
    }
    return RedisStreamsBus.instance;
  }

  public async publish<T>(
    stream: string,
    eventType: EventBusEnvelope<T>['eventType'],
    accountId: string,
    payload: T
  ): Promise<string> {
    const eventId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const envelope: EventBusEnvelope<T> = {
      eventId,
      timestamp: new Date().toISOString(),
      eventType,
      accountId,
      payload,
    };

    if (!this.streams.has(stream)) {
      this.streams.set(stream, []);
    }
    this.streams.get(stream)!.push(envelope as EventBusEnvelope<unknown>);

    // Fan-out to consumer groups on this stream
    const groups = this.consumerGroups.get(stream);
    if (groups) {
      for (const [_, handler] of groups.entries()) {
        try {
          await handler(envelope as EventBusEnvelope<unknown>);
        } catch (err) {
          console.error(`[EVENT_BUS_ERROR] Stream: ${stream}, Event: ${eventType}`, err);
        }
      }
    }

    return eventId;
  }

  public subscribe<T>(
    stream: string,
    consumerGroup: string,
    _consumerId: string,
    handler: EventHandler<T>
  ): void {
    if (!this.consumerGroups.has(stream)) {
      this.consumerGroups.set(stream, new Map());
    }
    this.consumerGroups.get(stream)!.set(consumerGroup, handler as EventHandler<unknown>);
  }

  public getStreamHistory(stream: string, limit = 50): EventBusEnvelope<unknown>[] {
    const list = this.streams.get(stream) || [];
    return list.slice(-limit);
  }
}
