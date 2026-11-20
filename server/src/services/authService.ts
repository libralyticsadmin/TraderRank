import crypto from 'node:crypto';
import { r2Storage } from './r2StorageService.js';

export interface StoredCredential {
  userId: string;
  email: string;
  username: string;
  salt: string;
  hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionPayload {
  userId: string;
  username: string;
  exp: number; // Unix timestamp in seconds
}

export class AuthService {
  private static instance: AuthService;
  private credentials = new Map<string, StoredCredential>(); // keyed by userId, email.toLowerCase(), username.toLowerCase()
  private readonly CREDENTIALS_KEY = 'auth/credentials.json';
  private readonly SESSION_SECRET = (() => {
    if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
    const stableSeed =
      process.env.VAULT_MASTER_KEY ||
      process.env.ADMIN_API_KEY ||
      process.env.R2_SECRET_ACCESS_KEY;
    if (stableSeed) {
      return crypto
        .createHmac('sha256', stableSeed)
        .update('traderrank-session-secret-v1')
        .digest('hex');
    }
    if (process.env.NODE_ENV === 'production') {
      console.warn('[AuthService] WARNING: SESSION_SECRET env var not set; using ephemeral CSPRNG secret.');
    }
    return crypto.randomBytes(32).toString('hex');
  })();
  private readonly TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
  private loadPromise: Promise<void> | null = null;

  private constructor() {
    this.loadPromise = this.loadCredentials().catch(() => {});
  }

  public async ensureLoaded(): Promise<void> {
    if (this.loadPromise) {
      await this.loadPromise;
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  public generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  public verifyPassword(password: string, salt: string, storedHash: string): boolean {
    try {
      const computed = this.hashPassword(password, salt);
      const computedBuf = Buffer.from(computed, 'hex');
      const storedBuf = Buffer.from(storedHash, 'hex');
      if (computedBuf.length !== storedBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(computedBuf, storedBuf);
    } catch {
      return false;
    }
  }

  public createSessionToken(userId: string, username: string): string {
    const exp = Math.floor(Date.now() / 1000) + this.TOKEN_EXPIRY_SECONDS;
    const payload: SessionPayload = { userId, username, exp };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');
    return `${payloadB64}.${signature}`;
  }

  public verifySessionToken(token: string): SessionPayload | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.trim().split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', this.SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');

    try {
      const sigBuf = Buffer.from(signature);
      const expectedBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
      }

      const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
      const payload: SessionPayload = JSON.parse(payloadStr);

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }
      return payload;
    } catch {
      return null;
    }
  }

  public async loadCredentials(): Promise<void> {
    try {
      const saved = await r2Storage.getJson<Record<string, StoredCredential>>(this.CREDENTIALS_KEY);
      if (saved && typeof saved === 'object') {
        for (const [k, v] of Object.entries(saved)) {
          if (v && v.userId && v.hash && v.salt) {
            this.credentials.set(k, v);
            this.credentials.set(v.userId, v);
            this.credentials.set(v.email.toLowerCase(), v);
            this.credentials.set(v.username.toLowerCase(), v);
          }
        }
      }

      // Seed default test credentials ONLY in test or explicit dev seed mode (never in production)
      const shouldSeedDefault =
        Boolean(process.env.VITEST || process.env.NODE_ENV === 'test') ||
        process.env.SEED_DEFAULT_USERS === 'true';
      if (shouldSeedDefault && !this.credentials.has('u_zzzemzzz')) {
        const salt = this.generateSalt();
        const hash = this.hashPassword('TraderRank2026!', salt);
        const defaultCred: StoredCredential = {
          userId: 'u_zzzemzzz',
          email: 'libralytics.data@gmail.com',
          username: 'zzZEMZzz',
          salt,
          hash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.saveCredential(defaultCred);
        await this.persistCredentials();
      }
    } catch (err) {
      console.warn('[AuthService] Could not load credentials:', err);
    }
  }

  public saveCredential(cred: StoredCredential): void {
    this.credentials.set(cred.userId, cred);
    this.credentials.set(cred.email.toLowerCase(), cred);
    this.credentials.set(cred.username.toLowerCase(), cred);
  }

  public async persistCredentials(): Promise<void> {
    try {
      const records: Record<string, StoredCredential> = {};
      const seen = new Set<string>();
      for (const cred of this.credentials.values()) {
        if (!seen.has(cred.userId)) {
          seen.add(cred.userId);
          records[cred.userId] = cred;
        }
      }
      await r2Storage.uploadJson(this.CREDENTIALS_KEY, records, { 'x-traderrank-type': 'auth_credentials' });
    } catch (err) {
      console.warn('[AuthService] Could not persist credentials:', err);
    }
  }

  public getCredential(emailOrUserOrId: string): StoredCredential | null {
    const clean = String(emailOrUserOrId || '').trim().toLowerCase();
    return this.credentials.get(clean) || null;
  }

  public async resetAll(): Promise<void> {
    this.credentials.clear();
    await this.persistCredentials();
  }

  public async register(
    userId: string,
    username: string,
    email: string,
    passwordPlain: string
  ): Promise<{ success: boolean; error?: string }> {
    await this.ensureLoaded();
    if (!passwordPlain || passwordPlain.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    const cleanUser = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (this.credentials.has(cleanUser.toLowerCase())) {
      return { success: false, error: 'Username is already taken' };
    }
    if (this.credentials.has(cleanEmail)) {
      return { success: false, error: 'Email is already registered' };
    }

    const salt = this.generateSalt();
    const hash = this.hashPassword(passwordPlain, salt);

    const cred: StoredCredential = {
      userId,
      username: cleanUser,
      email: cleanEmail,
      salt,
      hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveCredential(cred);
    await this.persistCredentials();
    return { success: true };
  }

  public async setPasswordForUser(userId: string, passwordPlain: string): Promise<boolean> {
    const cred = this.credentials.get(userId);
    if (!cred) return false;

    cred.salt = this.generateSalt();
    cred.hash = this.hashPassword(passwordPlain, cred.salt);
    cred.updatedAt = new Date().toISOString();
    this.saveCredential(cred);
    await this.persistCredentials();
    return true;
  }
}

export const authService = AuthService.getInstance();

