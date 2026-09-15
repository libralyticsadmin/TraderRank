import { describe, it, expect } from 'vitest';
import { ZeroWriteGuard, IllegalWriteOperationError } from '../src/connector/zeroWriteGuard.js';

describe('Piece 5: Zero-Write Security & Trade Blocking Guard', () => {
  it('throws IllegalWriteOperationError when assertReadOnly detects an order dispatch verb', () => {
    expect(() => ZeroWriteGuard.assertReadOnly('createOrder')).toThrow(IllegalWriteOperationError);
    expect(() => ZeroWriteGuard.assertReadOnly('placeOrder')).toThrow(IllegalWriteOperationError);
    expect(() => ZeroWriteGuard.assertReadOnly('modifyOrder')).toThrow(IllegalWriteOperationError);
    expect(() => ZeroWriteGuard.assertReadOnly('cancelOrder')).toThrow(IllegalWriteOperationError);
    expect(() => ZeroWriteGuard.assertReadOnly('closePosition')).toThrow(IllegalWriteOperationError);
    expect(() => ZeroWriteGuard.assertReadOnly('withdraw')).toThrow(IllegalWriteOperationError);
  });

  it('allows safe read-only operations without error', () => {
    expect(() => ZeroWriteGuard.assertReadOnly('getAccountInfo')).not.toThrow();
    expect(() => ZeroWriteGuard.assertReadOnly('getPositions')).not.toThrow();
    expect(() => ZeroWriteGuard.assertReadOnly('getOrders')).not.toThrow();
    expect(() => ZeroWriteGuard.assertReadOnly('getDeals')).not.toThrow();
    expect(() => ZeroWriteGuard.assertReadOnly('getPrices')).not.toThrow();
  });

  it('intercepts dynamic write method calls on wrapped proxy and blocks execution', () => {
    const rawClient = {
      getAccountInfo: () => ({ balance: 10000 }),
      getPositions: () => [{ id: 'pos_1', symbol: 'EURUSD' }],
      createOrder: (symbol: string, lots: number) => `Order placed: ${lots} lots on ${symbol}`,
      closePosition: (posId: string) => `Position closed: ${posId}`,
    };

    const secureClient = ZeroWriteGuard.wrapReadOnly(rawClient);

    // Read methods work seamlessly
    expect(secureClient.getAccountInfo()).toEqual({ balance: 10000 });
    expect(secureClient.getPositions()).toHaveLength(1);
    expect(secureClient.isReadOnlyMode()).toBe(true);

    // Trade dispatch methods are intercepted and immediately throw
    expect(() => secureClient.createOrder('EURUSD', 1.0)).toThrow(IllegalWriteOperationError);
    expect(() => secureClient.closePosition('pos_1')).toThrow(IllegalWriteOperationError);
  });

  it('prohibits property tampering and mutations on the wrapped client', () => {
    const rawClient = { getPositions: () => [] };
    const secureClient = ZeroWriteGuard.wrapReadOnly(rawClient);

    expect(() => {
      // @ts-expect-error mutating property on read-only proxy
      secureClient.injectedProperty = 'malicious';
    }).toThrow(IllegalWriteOperationError);
  });
});
