import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetaApiConnectionManager, ConnectionState } from '../src/connector/metaApiConnectionManager.js';

describe('Piece 1: MetaApiConnectionManager Lifecycle & State Machine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in DISCONNECTED state and transitions to SYNCHRONIZED upon successful connect and sync', async () => {
    const manager = new MetaApiConnectionManager({ initialBackoffMs: 50 });
    const states: ConnectionState[] = [];
    manager.onStateChange(st => states.push(st));

    expect(manager.getState()).toBe('DISCONNECTED');

    const connectPromise = manager.connect(
      async () => {},
      async () => {}
    );
    await connectPromise;

    expect(manager.getState()).toBe('SYNCHRONIZED');
    expect(states).toEqual(['CONNECTING', 'SYNCHRONIZING', 'SYNCHRONIZED']);

    const metrics = manager.getMetrics();
    expect(metrics.state).toBe('SYNCHRONIZED');
    expect(metrics.reconnectAttempts).toBe(0);
    expect(metrics.lastConnectedAt).not.toBeNull();
  });

  it('handles unexpected disconnect by entering RECONNECTING and backoff loop', async () => {
    const manager = new MetaApiConnectionManager({
      autoReconnect: true,
      maxReconnectAttempts: 3,
      initialBackoffMs: 100,
      backoffMultiplier: 2,
    });

    let connectCount = 0;
    const connectFn = vi.fn().mockImplementation(async () => {
      connectCount++;
    });

    await manager.connect(connectFn);
    expect(manager.getState()).toBe('SYNCHRONIZED');

    // Simulate unexpected socket drop
    manager.handleUnexpectedDisconnect('Network socket dropped', connectFn);
    expect(manager.getState()).toBe('RECONNECTING');

    // Fast forward timer to trigger backoff
    await vi.advanceTimersByTimeAsync(200);

    expect(connectFn).toHaveBeenCalledTimes(2);
    expect(manager.getState()).toBe('SYNCHRONIZED');
  });

  it('marks state as FAILED if max reconnect attempts are exceeded', async () => {
    const manager = new MetaApiConnectionManager({
      autoReconnect: true,
      maxReconnectAttempts: 2,
      initialBackoffMs: 50,
      backoffMultiplier: 1.5,
    });

    const failingConnect = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const connectPromise = manager.connect(failingConnect);
    // Should catch in retry
    await vi.advanceTimersByTimeAsync(1000);
    try {
      await connectPromise;
    } catch {}

    expect(manager.getState()).toBe('FAILED');
    expect(manager.getMetrics().lastError).toContain('Max reconnect attempts');
  });

  it('records heartbeat ping telemetry', async () => {
    const manager = new MetaApiConnectionManager({ heartbeatIntervalMs: 1000 });
    await manager.connect(async () => {});

    vi.advanceTimersByTime(1500);
    const metrics = manager.getMetrics();
    expect(metrics.lastPingLatencyMs).toBeGreaterThan(0);

    await manager.disconnect();
    expect(manager.getState()).toBe('DISCONNECTED');
  });
});
