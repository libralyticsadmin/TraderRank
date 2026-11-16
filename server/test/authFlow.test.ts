import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthService } from '../src/services/authService.js';
import { createServer } from '../src/api/server.js';
import http from 'http';

describe('Real Authentication, Session Tokens & Data Protection', () => {
  const auth = AuthService.getInstance();
  let server: http.Server;
  let port: number;
  let baseUrl: string;

  beforeAll(async () => {
    await auth.loadCredentials();
    const appBundle = createServer();
    server = appBundle.server;
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          port = addr.port;
          baseUrl = `http://127.0.0.1:${port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('should hash passwords using scrypt and verify correctly', () => {
    const password = 'SuperSecretPassword123!';
    const salt = auth.generateSalt();
    const hash = auth.hashPassword(password, salt);

    expect(hash).toBeDefined();
    expect(hash.length).toBe(128); // 64 bytes hex = 128 chars
    expect(auth.verifyPassword(password, salt, hash)).toBe(true);
    expect(auth.verifyPassword('WrongPassword!', salt, hash)).toBe(false);
  });

  it('should issue and verify valid signed HMAC session tokens', () => {
    const token = auth.createSessionToken('u_tester_99', 'Tester99');
    expect(token).toBeDefined();
    expect(token).toContain('.');

    const verified = auth.verifySessionToken(token);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe('u_tester_99');
    expect(verified?.username).toBe('Tester99');

    // Tampered token must fail
    const tampered = token.slice(0, -4) + 'abcd';
    expect(auth.verifySessionToken(tampered)).toBeNull();
  });

  const uniqueUser = `SecureTrader_${Date.now()}`;
  const uniqueEmail = `${uniqueUser.toLowerCase()}@test.com`;

  it('should register a new user with password hash and return session token', async () => {
    const regPayload = {
      username: uniqueUser,
      email: uniqueEmail,
      password: 'SafePassword123!',
      primaryBroker: 'XMTrading',
      tradingStyle: 'SWING',
    };

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(body.user.username).toBe(uniqueUser);
    expect(body.user.email).toBe(uniqueEmail);

    // Credential must be stored with salt and hash
    const cred = auth.getCredential(uniqueUser);
    expect(cred).toBeDefined();
    expect(cred?.hash).toBeDefined();
    expect(auth.verifyPassword('SafePassword123!', cred!.salt, cred!.hash)).toBe(true);
  });

  it('should reject login with wrong password and accept login with correct password', async () => {
    // 1. Wrong password must fail with 401
    const failRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUser: uniqueUser,
        password: 'IncorrectPassword',
      }),
    });
    expect(failRes.status).toBe(401);
    const failBody = await failRes.json();
    expect(failBody.success).toBe(false);

    // 2. Correct password must succeed and return session token
    const successRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUser: uniqueUser,
        password: 'SafePassword123!',
      }),
    });
    expect(successRes.status).toBe(200);
    const successBody = await successRes.json();
    expect(successBody.success).toBe(true);
    expect(successBody.token).toBeDefined();
    expect(successBody.user.username).toBe(uniqueUser);
  });

  it('should protect PUT /api/auth/profile from unauthorized modification', async () => {
    // Generate token for User A
    const tokenA = auth.createSessionToken('u_user_a', 'UserA');

    // User A attempts to overwrite User B's profile
    const res = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        id: 'u_user_b',
        username: 'HackedUserB',
      }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unauthorized');
  });

  it('should strictly sanitize GET /api/users to hide emails and account numbers', async () => {
    const res = await fetch(`${baseUrl}/api/users`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.users)).toBe(true);

    for (const u of body.users) {
      expect(u.email).toBeUndefined();
      expect(u.accountNumber).toBeUndefined();
      expect(u.username).toBeDefined();
      expect(u.avatarSymbol).toBeDefined();
    }
  });
});
