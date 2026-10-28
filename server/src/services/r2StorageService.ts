import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadBucketCommand } from '@aws-sdk/client-s3';

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

  constructor(customConfig?: Partial<R2Config>) {
    const endpoint = customConfig?.endpoint || process.env.R2_ENDPOINT || 'https://dc95c232d76cc4df23a5ca452a4046ab.r2.cloudflarestorage.com';
    const accessKeyId = customConfig?.accessKeyId || process.env.R2_ACCESS_KEY_ID || 'e957291c5a3877dc9b2daddf3013049f';
    const secretAccessKey = customConfig?.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY || '96d8bf9be76ab044564ac10d11e87986457b6980120fd5dc441a528e2f3ba1e7';
    const bucketName = customConfig?.bucketName || process.env.R2_BUCKET_NAME || 'traderrank-data';

    this.config = {
      endpoint,
      accessKeyId,
      secretAccessKey,
      bucketName,
    };

    if (this.config.accessKeyId && this.config.secretAccessKey && this.config.endpoint) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.client && this.config.accessKeyId && this.config.secretAccessKey);
  }

  public getBucketName(): string {
    return this.config.bucketName;
  }

  public async testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number; storage: string }> {
    const start = Date.now();
    if (!this.client) {
      return {
        ok: false,
        message: 'R2 credentials not configured',
        latencyMs: 0,
        storage: 'LOCAL_FALLBACK',
      };
    }

    try {
      // Test connectivity by querying bucket or list objects
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
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `R2 Ping Result: ${msg}`,
        latencyMs: Date.now() - start,
        storage: 'LOCAL_FALLBACK',
      };
    }
  }

  public async uploadJson(
    key: string,
    data: unknown,
    metadata?: Record<string, string>
  ): Promise<R2UploadResult> {
    const bodyStr = JSON.stringify(data, null, 2);
    const sizeBytes = Buffer.byteLength(bodyStr, 'utf-8');
    const uploadedAt = new Date().toISOString();

    if (this.client) {
      try {
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
      } catch (err) {
        // Fallback to in-memory store if R2 bucket is not yet provisioned in dashboard
        this.inMemoryFallback.set(key, bodyStr);
        return {
          key,
          sizeBytes,
          uploadedAt,
          storage: 'LOCAL_FALLBACK',
        };
      }
    }

    this.inMemoryFallback.set(key, bodyStr);
    return {
      key,
      sizeBytes,
      uploadedAt,
      storage: 'LOCAL_FALLBACK',
    };
  }

  public async getJson<T>(key: string): Promise<T | null> {
    if (this.client) {
      try {
        const cmd = new GetObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
        });
        const res = await this.client.send(cmd);
        if (res.Body) {
          const bodyStr = await res.Body.transformToString();
          return JSON.parse(bodyStr) as T;
        }
      } catch {
        // Fallback to local memory
      }
    }

    const fallbackStr = this.inMemoryFallback.get(key);
    if (fallbackStr) {
      return JSON.parse(fallbackStr) as T;
    }
    return null;
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
