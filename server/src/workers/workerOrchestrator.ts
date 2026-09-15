/**
 * TraderRank Ingestion Worker Orchestrator
 * Manages worker pools, account sharding, and routing per PRD §5.3 & Infrastructure Design §3.3.
 */

import { Broker, IntegrationType, ValidationResult, AccountCredentials } from '../../../shared/src/types.js';
import { IBrokerWorker } from './baseWorker.js';
import { MTGatewayWorker } from './mtGatewayWorker.js';
import { ExnessWorker } from './exnessWorker.js';

export class WorkerOrchestrator {
  private static instance: WorkerOrchestrator;
  private workers = new Map<string, IBrokerWorker>();
  private accountWorkerMap = new Map<string, string>(); // accountId -> workerKey

  constructor() {
    this.registerWorker('mt_xm', new MTGatewayWorker('XM'));
    this.registerWorker('mt_axiory', new MTGatewayWorker('Axiory'));
    this.registerWorker('mt_vantage', new MTGatewayWorker('Vantage'));
    this.registerWorker('mt_other', new MTGatewayWorker('OTHER'));
    this.registerWorker('exness_native', new ExnessWorker());
  }

  public static getInstance(): WorkerOrchestrator {
    if (!WorkerOrchestrator.instance) {
      WorkerOrchestrator.instance = new WorkerOrchestrator();
    }
    return WorkerOrchestrator.instance;
  }

  private registerWorker(key: string, worker: IBrokerWorker): void {
    this.workers.set(key, worker);
  }

  /**
   * Resolves the appropriate worker key according to PRD §5.3 routing logic.
   */
  public resolveWorkerKey(broker: Broker, integrationType: IntegrationType): string {
    if (broker === 'Exness' && integrationType === 'exness_native') {
      return 'exness_native';
    }

    switch (broker) {
      case 'XM':
        return 'mt_xm';
      case 'Axiory':
        return 'mt_axiory';
      case 'Vantage':
        return 'mt_vantage';
      case 'Exness': // Exness falling back to MT Gateway
      case 'OTHER':
      default:
        return 'mt_other';
    }
  }

  public getWorker(broker: Broker, integrationType: IntegrationType): IBrokerWorker {
    const key = this.resolveWorkerKey(broker, integrationType);
    const worker = this.workers.get(key);
    if (!worker) {
      throw new Error(`No worker registered for broker: ${broker}, type: ${integrationType}`);
    }
    return worker;
  }

  public getAllWorkers(): IBrokerWorker[] {
    return Array.from(this.workers.values());
  }

  public async validateCredentials(broker: Broker, creds: AccountCredentials): Promise<ValidationResult> {
    const worker = this.getWorker(broker, creds.type);
    return worker.validateConnection(creds);
  }

  public async provisionAccount(accountId: string, broker: Broker, creds: AccountCredentials): Promise<void> {
    const workerKey = this.resolveWorkerKey(broker, creds.type);
    const worker = this.workers.get(workerKey)!;

    this.accountWorkerMap.set(accountId, workerKey);
    await worker.connectAccount(accountId, creds);
  }

  public async deprovisionAccount(accountId: string): Promise<void> {
    const workerKey = this.accountWorkerMap.get(accountId);
    if (workerKey) {
      const worker = this.workers.get(workerKey);
      if (worker) {
        await worker.disconnectAccount(accountId);
      }
      this.accountWorkerMap.delete(accountId);
    }
  }

  public getWorkerForAccount(accountId: string): IBrokerWorker | null {
    const workerKey = this.accountWorkerMap.get(accountId);
    if (!workerKey) return null;
    return this.workers.get(workerKey) || null;
  }
}
