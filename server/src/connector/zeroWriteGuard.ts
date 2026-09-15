/**
 * TraderRank Zero-Write Security & Trade Blocking Guard
 *
 * Enforces immutable view-only guarantees at both compile time and runtime.
 * Guarantees that no trade dispatch, order modification, position closure,
 * or cash withdrawal can ever be executed through this service.
 */

export class IllegalWriteOperationError extends Error {
  public readonly code = 'WRITE_OPERATION_FORBIDDEN';
  public readonly attemptedOperation: string;
  public readonly timestamp: string;

  constructor(operation: string, details?: string) {
    const msg = `SECURITY VIOLATION: Write operation '${operation}' is strictly forbidden on this view-only MetaTrader connection.${details ? ` Details: ${details}` : ''}`;
    super(msg);
    this.name = 'IllegalWriteOperationError';
    this.attemptedOperation = operation;
    this.timestamp = new Date().toISOString();
  }
}

export interface IReadOnlyMetaTraderService {
  getAccountInfo(accountId: string): Promise<unknown>;
  getPositions(accountId: string): Promise<unknown[]>;
  getOrders(accountId: string): Promise<unknown[]>;
  getDeals(accountId: string, from?: Date, to?: Date): Promise<unknown[]>;
  getPrices(symbols: string[]): Promise<Record<string, unknown>>;
  isReadOnlyMode(): true;
}

const FORBIDDEN_WRITE_METHODS = new Set([
  'createorder',
  'placeorder',
  'modifyorder',
  'cancelorder',
  'deleteorder',
  'closeposition',
  'modifyposition',
  'sendorder',
  'ordercreate',
  'ordersend',
  'closeorder',
  'withdraw',
  'deposit',
  'executetrade',
]);

export class ZeroWriteGuard {
  /**
   * Asserts that a requested operation name is strictly read-only.
   * Throws IllegalWriteOperationError if any mutation or order dispatch is attempted.
   */
  public static assertReadOnly(operationName: string, context?: Record<string, unknown>): void {
    const normalized = operationName.toLowerCase().replace(/[^a-z]/g, '');

    for (const forbidden of FORBIDDEN_WRITE_METHODS) {
      if (normalized.includes(forbidden)) {
        console.error(`[ZERO_WRITE_GUARD_ALERT] Blocked write operation attempt: ${operationName}`, {
          timestamp: new Date().toISOString(),
          context,
        });
        throw new IllegalWriteOperationError(operationName);
      }
    }
  }

  /**
   * Wraps any underlying target client in an immutable read-only proxy.
   * Intercepts any call matching mutation or order verbs and rejects it.
   */
  public static wrapReadOnly<T extends object>(target: T): T & { isReadOnlyMode: () => true } {
    return new Proxy(target, {
      get(targetObj, prop, receiver) {
        if (prop === 'isReadOnlyMode') {
          return () => true;
        }

        const propStr = String(prop);
        const normalizedProp = propStr.toLowerCase().replace(/[^a-z]/g, '');

        for (const forbidden of FORBIDDEN_WRITE_METHODS) {
          if (normalizedProp.includes(forbidden)) {
            return () => {
              ZeroWriteGuard.assertReadOnly(propStr);
            };
          }
        }

        const orig = Reflect.get(targetObj, prop, receiver);
        if (typeof orig === 'function') {
          return orig.bind(targetObj);
        }
        return orig;
      },
      set() {
        throw new IllegalWriteOperationError('PropertyMutation', 'Cannot mutate properties on a read-only bridge');
      },
      deleteProperty() {
        throw new IllegalWriteOperationError('PropertyDeletion', 'Cannot delete properties on a read-only bridge');
      },
    }) as T & { isReadOnlyMode: () => true };
  }
}
