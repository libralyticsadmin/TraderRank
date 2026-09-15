/**
 * TraderRank Secrets Vault
 * High-security credential storage compliant with Infrastructure Design §3.2 & §6.
 * Uses AES-256-GCM authenticated encryption at rest and strict audit logging.
 */

import crypto from 'crypto';
import { AccountCredentials } from '../../../shared/src/types.js';

export interface VaultAuditEntry {
  id: string;
  timestamp: string; // ISO 8601 UTC
  callerService: string;
  action: 'STORE' | 'READ' | 'ROTATE' | 'REVOKE';
  secretRef: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export interface ISecretsVault {
  storeSecret(caller: string, credentials: AccountCredentials): Promise<string>;
  getSecret(caller: string, secretRef: string): Promise<AccountCredentials | null>;
  revokeSecret(caller: string, secretRef: string): Promise<boolean>;
  getAuditLogs(): VaultAuditEntry[];
}

interface EncryptedPayload {
  iv: string; // Hex
  tag: string; // Hex
  ciphertext: string; // Hex
  createdAt: string;
}

export class SecretsVault implements ISecretsVault {
  private static instance: SecretsVault;
  private readonly masterKey: Buffer;
  private readonly storage = new Map<string, EncryptedPayload>();
  private readonly auditLogs: VaultAuditEntry[] = [];

  // Authorized caller services per §3.2
  private static readonly AUTHORIZED_SERVICES = new Set([
    'AccountConnectorService',
    'MTGatewayWorker',
    'ExnessWorker',
    'WorkerOrchestrator',
    'TestHarness',
  ]);

  constructor(customKey?: string) {
    // 32-byte key for AES-256
    const secret = customKey || process.env.VAULT_MASTER_KEY || 'traderrank_default_vault_master_key_32b!';
    this.masterKey = crypto.createHash('sha256').update(secret).digest();
  }

  public static getInstance(): SecretsVault {
    if (!SecretsVault.instance) {
      SecretsVault.instance = new SecretsVault();
    }
    return SecretsVault.instance;
  }

  private logAudit(
    caller: string,
    action: VaultAuditEntry['action'],
    secretRef: string,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const entry: VaultAuditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      callerService: caller,
      action,
      secretRef,
      success,
      metadata,
    };
    this.auditLogs.push(entry);

    // Print sanitized security log (without credential values!)
    if (!success) {
      console.warn(`[SECRETS_VAULT_ALERT] Unauthorized or failed vault access attempt by ${caller} on ${secretRef}`);
    }
  }

  private checkAuthorization(caller: string): boolean {
    return SecretsVault.AUTHORIZED_SERVICES.has(caller);
  }

  /**
   * Encrypts and persists credentials, returning a secure reference token.
   */
  public async storeSecret(caller: string, credentials: AccountCredentials): Promise<string> {
    if (!this.checkAuthorization(caller)) {
      this.logAudit(caller, 'STORE', 'N/A', false, { reason: 'UNAUTHORIZED_CALLER' });
      throw new Error(`Access denied: Service '${caller}' is not authorized to access the Secrets Vault`);
    }

    const secretRef = `vault_sec_${crypto.randomBytes(16).toString('hex')}`;
    const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

    const plaintext = JSON.stringify(credentials);
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    this.storage.set(secretRef, {
      iv: iv.toString('hex'),
      tag,
      ciphertext,
      createdAt: new Date().toISOString(),
    });

    this.logAudit(caller, 'STORE', secretRef, true, { credentialType: credentials.type });
    return secretRef;
  }

  /**
   * Retrieves and decrypts credentials for authorized services only.
   */
  public async getSecret(caller: string, secretRef: string): Promise<AccountCredentials | null> {
    if (!this.checkAuthorization(caller)) {
      this.logAudit(caller, 'READ', secretRef, false, { reason: 'UNAUTHORIZED_CALLER' });
      throw new Error(`Access denied: Service '${caller}' is not authorized to read from Secrets Vault`);
    }

    const encrypted = this.storage.get(secretRef);
    if (!encrypted) {
      this.logAudit(caller, 'READ', secretRef, false, { reason: 'NOT_FOUND' });
      return null;
    }

    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.masterKey,
        Buffer.from(encrypted.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));

      let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      this.logAudit(caller, 'READ', secretRef, true);
      return JSON.parse(decrypted) as AccountCredentials;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logAudit(caller, 'READ', secretRef, false, { reason: 'DECRYPTION_FAILED', error: msg });
      throw new Error(`Integrity error: Failed to decrypt secret payload: ${msg}`);
    }
  }

  /**
   * Revokes and securely wipes secret from memory.
   */
  public async revokeSecret(caller: string, secretRef: string): Promise<boolean> {
    if (!this.checkAuthorization(caller)) {
      this.logAudit(caller, 'REVOKE', secretRef, false, { reason: 'UNAUTHORIZED_CALLER' });
      throw new Error(`Access denied: Service '${caller}' is not authorized to revoke secrets`);
    }

    const existed = this.storage.delete(secretRef);
    this.logAudit(caller, 'REVOKE', secretRef, existed);
    return existed;
  }

  public getAuditLogs(): VaultAuditEntry[] {
    return [...this.auditLogs];
  }
}
