import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export interface R2UploadResult {
  key: string;
  sizeBytes: number;
  etag?: string;
  uploadedAt: string;
  storage: 'R2_CLOUD' | 'LOCAL_FALLBACK';
}

export class R2StorageService {
  private client: S3Client | null = null;
  private config: R2Config;
  private inMemoryFallback = new Map<string, string>();
  private writeQueues = new Map<string, Promise<unknown>>();
  private localBaseDir: string;

  constructor(customConfig?: Partial<R2Config>) {
    const endpoint = customConfig?.endpoint || process.env.R2_ENDPOINT || '';
    const accessKeyId = customConfig?.accessKeyId || process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = customConfig?.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY || '';
    const bucketName = customConfig?.bucketName || process.env.R2_BUCKET_NAME || 'traderrank-data';

    this.config = {
      endpoint,
      accessKeyId,
      secretAccessKey,
      bucketName,
    };

    // Isolate test runs in /tmp so tests never pollute production server/data/storage
    const isTestEnv = Boolean(process.env.VITEST || process.env.NODE_ENV === 'test');
    const rootServerData = path.resolve(process.cwd(), 'server/data/storage');
    const cwdData = path.resolve(process.cwd(), 'data/storage');
    this.localBaseDir = isTestEnv
      ? path.resolve(os.tmpdir(), 'traderrank-test-storage')
      : process.env.DATA_DIR ||
        (fs.existsSync(rootServerData) ? rootServerData : cwdData);
    try {
      if (!fs.existsSync(this.localBaseDir)) {
        fs.mkdirSync(this.localBaseDir, { recursive: true });
      }
      const seedSourceDir = fs.existsSync(rootServerData)
        ? rootServerData
        : fs.existsSync(cwdData)
        ? cwdData
        : null;
      if (
        !isTestEnv &&
        process.env.DATA_DIR &&
        seedSourceDir &&
        path.resolve(this.localBaseDir) !== path.resolve(seedSourceDir)
      ) {
        this.seedMissingFromRepo(seedSourceDir, this.localBaseDir);
      }
    } catch {
      // ignore
    }

    if (this.config.accessKeyId && this.config.secretAccessKey && this.config.endpoint) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
        maxAttempts: 1,
      });
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.client && this.config.accessKeyId && this.config.secretAccessKey);
  }

  /**
   * Seed initial repo-tracked JSON files onto a freshly mounted persistent disk
   * without overwriting any existing runtime files.
   */
  private seedMissingFromRepo(srcDir: string, destDir: string): void {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        this.seedMissingFromRepo(srcPath, destPath);
      } else if (entry.isFile() && !fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  public getBucketName(): string {
    return this.config.bucketName;
  }

  public getLocalDatabasePath(): string {
    return this.localBaseDir;
  }

  public isLocalDiskWritable(): boolean {
    try {
      if (!fs.existsSync(this.localBaseDir)) {
        fs.mkdirSync(this.localBaseDir, { recursive: true });
      }
      const testFile = path.join(this.localBaseDir, `.health_probe_${process.pid}`);
      fs.writeFileSync(testFile, 'ok', 'utf-8');
      fs.unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
  }

  private getLocalFilePath(key: string): string {
    const safeKey = key.replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(this.localBaseDir, safeKey);
  }

  private saveToLocalDisk(key: string, dataStr: string): void {
    const filePath = this.getLocalFilePath(key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, dataStr, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  }

  private readFromLocalDisk(key: string): string | null {
    try {
      const filePath = this.getLocalFilePath(key);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
    } catch (err) {
      console.warn(`[R2StorageService] Local disk read warning for ${key}:`, err);
    }
    return null;
  }

  public async testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number; storage: string; localDatabaseDir: string }> {
    const start = Date.now();
    const localDatabaseDir = this.localBaseDir;

    if (!this.client) {
      return {
        ok: false,
        message: 'R2 credentials not configured, operating on persistent local disk database',
        latencyMs: 0,
        storage: 'LOCAL_FALLBACK',
        localDatabaseDir,
      };
    }

    try {
      const cmd = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        MaxKeys: 1,
      });
      await this.client.send(cmd);
      return {
        ok: true,
        message: `Connected to Cloudflare R2 bucket: ${this.config.bucketName}`,
        latencyMs: Date.now() - start,
        storage: 'R2_CLOUD',
        localDatabaseDir,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `R2 Ping Result: ${msg} (Persisting safely to local disk database)`,
        latencyMs: Date.now() - start,
        storage: 'LOCAL_FALLBACK',
        localDatabaseDir,
      };
    }
  }

  public async uploadJson(
    key: string,
    data: unknown,
    metadata?: Record<string, string>
  ): Promise<R2UploadResult> {
    const bodyStr = JSON.stringify(data, null, 2);
    let localSaved = false;
    let localError: Error | null = null;
    try {
      this.saveToLocalDisk(key, bodyStr);
      this.inMemoryFallback.set(key, bodyStr);
      localSaved = true;
    } catch (err) {
      localError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[R2StorageService] Local disk write failed for ${key}:`, err);
    }

    // 2. Serialize async R2 cloud uploads per key
    const prev = this.writeQueues.get(key) || Promise.resolve();
    const next = prev
      .catch(() => {})
      .then(async () => {
        try {
          return await this.performCloudUpload(key, bodyStr, metadata);
        } catch (cloudErr) {
          if (!localSaved) {
            throw new Error(`Dual storage failure for ${key}: cloud upload failed (${cloudErr instanceof Error ? cloudErr.message : String(cloudErr)}) and local write failed (${localError?.message || 'unknown error'})`);
          }
          return {
            key,
            sizeBytes: Buffer.byteLength(bodyStr, 'utf-8'),
            uploadedAt: new Date().toISOString(),
            storage: 'LOCAL_FALLBACK' as const,
          };
        }
      });
    this.writeQueues.set(key, next);
    return next;
  }

  private async performCloudUpload(
    key: string,
    bodyStr: string,
    metadata?: Record<string, string>
  ): Promise<R2UploadResult> {
    const sizeBytes = Buffer.byteLength(bodyStr, 'utf-8');
    const uploadedAt = new Date().toISOString();

    // Sync to Cloudflare R2 Cloud
    if (this.client) {
      const cmd = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: bodyStr,
        ContentType: 'application/json',
        Metadata: metadata,
      });
      const res = await this.client.send(cmd);
      return {
        key,
        sizeBytes,
        etag: res.ETag,
        uploadedAt,
        storage: 'R2_CLOUD',
      };
    }

    return {
      key,
      sizeBytes,
      uploadedAt,
      storage: 'LOCAL_FALLBACK',
    };
  }

  public async getJson<T>(key: string): Promise<T | null> {
    const localFilePath = this.getLocalFilePath(key);
    let localMtime = 0;
    try {
      if (fs.existsSync(localFilePath)) {
        localMtime = fs.statSync(localFilePath).mtimeMs;
      }
    } catch {}

    // 1. Try Cloudflare R2 first
    if (this.client) {
      try {
        const cmd = new GetObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
        });
        const res = await this.client.send(cmd);
        if (res.Body) {
          const bodyStr = await res.Body.transformToString();
          this.saveToLocalDisk(key, bodyStr);
          this.inMemoryFallback.set(key, bodyStr);
          return JSON.parse(bodyStr) as T;
        }
      } catch {
        // Fallback to local persistent disk
      }
    }

    // 2. Read from local persistent disk database
    const diskStr = this.readFromLocalDisk(key);
    if (diskStr) {
      this.inMemoryFallback.set(key, diskStr);
      try {
        return JSON.parse(diskStr) as T;
      } catch {
        // Ignore JSON error
      }
    }

    // 3. Fallback to in-memory store
    const fallbackStr = this.inMemoryFallback.get(key);
    if (fallbackStr) {
      try {
        return JSON.parse(fallbackStr) as T;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Like getJson, but distinguishes "does not exist" (null) from "could not be read" (throws).
   * Use before any read-modify-write of a whole store, so a transient R2/disk failure is never
   * mistaken for an empty store and overwritten.
   */
  public async getJsonStrict<T>(key: string): Promise<T | null> {
    const localFilePath = this.getLocalFilePath(key);
    let localMtime = 0;
    try {
      if (fs.existsSync(localFilePath)) {
        localMtime = fs.statSync(localFilePath).mtimeMs;
      }
    } catch {}

    if (this.client) {
      try {
        const res = await this.client.send(new GetObjectCommand({ Bucket: this.config.bucketName, Key: key }));
        if (!res.Body) throw new Error(`R2 returned no body for ${key}`);
        const bodyStr = await res.Body.transformToString();
        const parsed = JSON.parse(bodyStr) as T; // throws on corrupt data
        this.saveToLocalDisk(key, bodyStr);
        this.inMemoryFallback.set(key, bodyStr);
        return parsed;
      } catch (err) {
        const e = err as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
        const notFound = e?.name === 'NoSuchKey' || e?.Code === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404;
        if (!notFound) {
          if (fs.existsSync(localFilePath)) {
            const diskStr = fs.readFileSync(localFilePath, 'utf-8');
            const parsed = JSON.parse(diskStr) as T;
            this.inMemoryFallback.set(key, diskStr);
            return parsed;
          }
          throw new Error(`Storage read failed for ${key}: ${err instanceof Error ? err.message : String(err)}`);
        }
        if (fs.existsSync(localFilePath)) {
          const diskStr = fs.readFileSync(localFilePath, 'utf-8');
          const parsed = JSON.parse(diskStr) as T;
          this.inMemoryFallback.set(key, diskStr);
          return parsed;
        }
        return null; // R2 is the source of truth when configured
      }
    }

    if (fs.existsSync(localFilePath)) {
      const diskStr = fs.readFileSync(localFilePath, 'utf-8'); // throws on I/O error
      const parsed = JSON.parse(diskStr) as T; // throws on corrupt data
      this.inMemoryFallback.set(key, diskStr);
      return parsed;
    }
    const mem = this.inMemoryFallback.get(key);
    return mem ? (JSON.parse(mem) as T) : null;
  }

  public async saveLeaderboardSnapshot(tournamentId: string, standings: unknown): Promise<R2UploadResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `leaderboards/${tournamentId}/snapshot_${timestamp}.json`;
    return this.uploadJson(key, {
      tournamentId,
      snapshotTimestamp: new Date().toISOString(),
      standings,
    }, {
      'x-traderrank-type': 'leaderboard_snapshot',
      'x-tournament-id': tournamentId,
    });
  }

  public async saveTradeArchive(accountId: string, deals: unknown[]): Promise<R2UploadResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `trades/${accountId}/deals_${timestamp}.json`;
    return this.uploadJson(key, {
      accountId,
      archiveTimestamp: new Date().toISOString(),
      dealCount: deals.length,
      deals,
    }, {
      'x-traderrank-type': 'trade_archive',
      'x-account-id': accountId,
    });
  }
}

export const r2Storage = new R2StorageService();
