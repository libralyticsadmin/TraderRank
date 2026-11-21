import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetaApiClient } from '../src/workers/metaApiClient.js';

const TOKEN = 'live_token_1234567890abcdef';

describe('MetaApi account list — cached, single-flight, strict on failure', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('serves repeated lookups from one list call within the TTL', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (u: string, init?: RequestInit) => {
      calls.push(`${init?.method || 'GET'} ${u}`);
      return new Response(JSON.stringify([{ _id: 'a1', login: '111111', server: 'S-1', state: 'DEPLOYED', connectionStatus: 'CONNECTED' }]), { status: 200 });
    }));
    const client = new MetaApiClient(TOKEN);
    await Promise.all([client.createOrGetAccount('S-1', '111111', 'pw'), client.createOrGetAccount('S-1', '111111', 'pw')]);
    await client.createOrGetAccount('S-1', '111111', 'pw');
    expect(calls.filter(c => c.startsWith('GET') && c.endsWith('/users/current/accounts'))).toHaveLength(1);
  });

  it('never creates a (paid) account when the list call fails', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (u: string, init?: RequestInit) => {
      calls.push(`${init?.method || 'GET'} ${u}`);
      return new Response('{}', { status: 503 });
    }));
    const client = new MetaApiClient(TOKEN);
    await expect(client.createOrGetAccount('S-1', '222222', 'pw')).rejects.toThrow(/account list failed \(503\)/);
    expect(calls.some(c => c.startsWith('POST'))).toBe(false);
  });
});
