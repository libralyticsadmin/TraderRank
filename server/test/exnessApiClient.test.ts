import { describe, it, expect } from 'vitest';
import { ExnessApiClient } from '../src/workers/exnessApiClient.js';
import { createHmac } from 'crypto';

describe('ExnessApiClient - Exness OpenAPI & HMAC Auth Standard', () => {
  const client = new ExnessApiClient();

  it('should generate valid HMAC-SHA256 signature matching crypto standards', () => {
    const secret = 'super_secret_key_exness';
    const timestamp = 1718000000000;
    const method = 'GET';
    const path = '/v1/accounts/me';
    const body = '';

    const signature = client.generateSignature(secret, timestamp, method, path, body);
    const expected = createHmac('sha256', secret)
      .update(`${timestamp}${method}${path}${body}`)
      .digest('hex');

    expect(signature).toBe(expected);
    expect(signature).toHaveLength(64); // SHA256 hex string is 64 chars
  });

  it('should construct required Exness OpenAPI headers', () => {
    const apiKey = 'exn_key_live_998877665544';
    const apiSecret = 'exn_sec_112233445566';

    const headers = client.buildHeaders(apiKey, apiSecret, 'POST', '/v1/trades', '{"symbol":"EURUSD"}');

    expect(headers['X-Api-Key']).toBe(apiKey);
    expect(headers['X-Timestamp']).toBeDefined();
    expect(headers['X-Signature']).toBeDefined();
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should perform health check ping and measure latency', async () => {
    const ping = await client.ping();
    expect(ping.ok).toBe(true);
    expect(ping.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should validate valid Exness credentials', async () => {
    const result = await client.validateCredentials('exn_live_key_99887766', 'exn_sec_00112233', 'EXN-554433');
    expect(result.success).toBe(true);
    expect(result.accountDetails).toBeDefined();
    expect(result.accountDetails?.accountNumber).toBe('EXN-554433');
    expect(result.accountDetails?.balance).toBe(15450.00);
    expect(result.accountDetails?.leverage).toBe(500);
  });

  it('should reject missing or unverified KYC credentials with specific error codes', async () => {
    const missing = await client.validateCredentials('', '');
    expect(missing.success).toBe(false);
    expect(missing.errorCode).toBe('INVALID_CREDENTIALS');

    const shortKey = await client.validateCredentials('short', 'secret');
    expect(shortKey.success).toBe(false);
    expect(shortKey.errorCode).toBe('INVALID_CREDENTIALS');

    const unverified = await client.validateCredentials('exn_unverified_account', 'nokyc_secret');
    expect(unverified.success).toBe(false);
    expect(unverified.errorCode).toBe('UNVERIFIED_KYC');
  });
});
