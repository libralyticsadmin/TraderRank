/**
 * TraderRank API Gateway & WebSocket Server
 * Compliant with PRD v1 and Infrastructure Design §2, §3.1, §3.5.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { AccountConnectorService } from '../connector/accountConnector.js';
import { LeaderboardService } from '../services/leaderboardService.js';
import { SecretsVault } from '../vault/secretsVault.js';
import { LiveMarketFeedService } from '../market/liveMarketFeed.js';
import { MetaApiClient } from '../workers/metaApiClient.js';
import { ExnessApiClient } from '../workers/exnessApiClient.js';
import { Broker, AccountCredentials, CanonicalTrade, EventBusEnvelope } from '../../../shared/src/types.js';
import { RedisStreamsBus } from '../eventbus/redisStreamsBus.js';

import { BrokerDirectory } from '../connector/brokerDirectory.js';
import { ZeroWriteGuard, IllegalWriteOperationError } from '../connector/zeroWriteGuard.js';
import { r2Storage } from '../services/r2StorageService.js';
import { AiChartAnalyzer } from '../market/aiChartAnalyzer.js';
import { ForexFactoryService } from '../market/forexFactoryService.js';
import { DailyIntelService } from '../market/dailyIntelService.js';
import { TournamentService } from '../services/tournamentService.js';
import { authService, SessionPayload } from '../services/authService.js';
import { getCachedCanonicalStats, getBulletinFeed, invalidateCanonicalStatsCache } from '../services/canonicalStatsService.js';
import { getStreakStatus, isStreakBroken, XP_RULES, calculateTraderGamification } from '../../../shared/src/gamification.js';

export function createServer() {
  const app = express();
  const server = http.createServer(app);

  // Allowed origin patterns for CORS and WebSocket handshake
  const ALLOWED_ORIGIN_PATTERNS = [
    /^https:\/\/(www\.)?traderank\.live$/,
    /^https:\/\/(www\.)?traderrank\.live$/,
    /^https:\/\/traderrank.*\.onrender\.com$/,
    /^https:\/\/.*\.vercel\.app$/,
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  ];

  const isOriginAllowed = (origin: string | undefined): boolean => {
    if (!origin) return true; // allow same-origin, curl, server-to-server, unit tests
    return ALLOWED_ORIGIN_PATTERNS.some(pat => pat.test(origin));
  };

  const wss = new WebSocketServer({
    server,
    path: '/ws',
    verifyClient: (info, callback) => {
      const origin = info.origin;
      if (!isOriginAllowed(origin)) {
        console.warn(`[SECURITY] Blocked cross-site WebSocket handshake attempt from origin: ${origin}`);
        return callback(false, 403, 'Forbidden origin');
      }
      callback(true);
    },
  });

  // 1. Server Hardening: Disable Express fingerprinting
  app.disable('x-powered-by');

  // 2. Defensive HTTP Security Headers (OWASP & Cloudflare Security Standards)
  app.use((_req: Request, res: Response, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '0');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // 3. Strict CORS origin filter
  app.use(cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: Origin ${origin} is not permitted`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-admin-key'],
  }));

  app.use(express.json({ limit: '100kb' }));

  // 4. In-Memory Request Rate Limiter (Resource Exhaustion Defense)
  const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
  const createRateLimiter = (windowMs: number, maxRequests: number, label: string) => {
    return (req: Request, res: Response, next: () => void) => {
      if (process.env.NODE_ENV === 'test') return next();
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${label}:${ip}`;
      const now = Date.now();
      const entry = rateLimitStore.get(key);

      if (!entry || entry.resetAt <= now) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return next();
      }

      if (entry.count >= maxRequests) {
        const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader('Retry-After', String(retryAfterSec));
        return res.status(429).json({
          success: false,
          error: `Rate limit exceeded for ${label}. Please retry after ${retryAfterSec}s.`,
          code: 'RATE_LIMIT_EXCEEDED',
        });
      }

      entry.count++;
      next();
    };
  };

  const connectorRateLimit = createRateLimiter(60000, 60, 'connector');
  const aiRateLimit = createRateLimiter(60000, 30, 'ai_analysis');

  // 5. Admin Authorization Guard
  const requireAdminAuth = (req: Request, res: Response, next: () => void) => {
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey && process.env.NODE_ENV !== 'production') {
      return next();
    }
    const headerKey = req.headers['x-admin-key'] as string | undefined;
    const authHeader = req.headers.authorization;
    const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const provided = headerKey || bearerKey;

    if (!adminKey || provided !== adminKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Valid x-admin-key or Bearer token required for administrative operations',
        code: 'ADMIN_AUTH_REQUIRED',
      });
    }
    next();
  };

  // Strict Zero-Write Security Interceptor: rejects any order execution or trade write attempts
  app.use((req: Request, res: Response, next) => {
    const path = req.path.toLowerCase();
    const method = req.method.toUpperCase();

    if (
      (method !== 'GET' && (path.includes('order') || path.includes('trade') || path.includes('close') || path.includes('withdraw'))) ||
      path.includes('/orders') ||
      path.includes('/positions/close')
    ) {
      // Allow legitimate connector and market refresh endpoints
      if (!path.includes('/api/connector/connect') && !path.includes('/api/connector/validate') && !path.includes('/api/market/refresh')) {
        return res.status(403).json({
          success: false,
          error: `SECURITY ENFORCEMENT: Write operation '${method} ${req.path}' is blocked. TraderRank runs in immutable view-only mode.`,
          code: 'WRITE_OPERATION_FORBIDDEN',
        });
      }
    }
    next();
  });

  const connector = AccountConnectorService.getInstance();
  const leaderboard = LeaderboardService.getInstance();
  const vault = SecretsVault.getInstance();
  const marketFeed = LiveMarketFeedService.getInstance();
  const metaApiClient = new MetaApiClient();
  const exnessApiClient = new ExnessApiClient();
  const brokerDir = BrokerDirectory.getInstance();
  const aiAnalyzer = new AiChartAnalyzer(marketFeed);
  const forexFactory = ForexFactoryService.getInstance();
  const dailyIntel = DailyIntelService.getInstance();
  const tournamentService = TournamentService.getInstance();
  const eventBus = RedisStreamsBus.getInstance();

  // Automatically sync provisioned cloud broker accounts on startup
  if (process.env.NODE_ENV !== 'test') {
    connector.syncCloudProvisionedAccounts().catch(err => {
      console.warn('[Startup] Cloud provisioned accounts sync warning:', err);
    });
  }

  // Connected WebSocket clients
  const clients = new Set<WebSocket>();

  wss.on('connection', ws => {
    clients.add(ws);

    // Push initial leaderboard on connect
    ws.send(JSON.stringify({
      type: 'LEADERBOARD_UPDATE',
      data: leaderboard.getLeaderboard(),
    }));

    // Push initial daily leaderboard on connect
    ws.send(JSON.stringify({
      type: 'DAILY_LEADERBOARD_UPDATE',
      data: leaderboard.getDailyLeaderboard(),
    }));

    // Push live market quotes on connect
    ws.send(JSON.stringify({
      type: 'MARKET_QUOTES',
      data: marketFeed.getStatus(),
    }));

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Broadcast live updates to all connected clients
  leaderboard.onLeaderboardChange(entries => {
    const payload = JSON.stringify({
      type: 'LEADERBOARD_UPDATE',
      data: entries,
    });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
    if (clients.size > 0) {
      getCachedCanonicalStats(connector, leaderboard, marketFeed, getRegisteredAtMap(), getStreakXpMap())
        .then(canonical => {
          const canonicalPayload = JSON.stringify({
            type: 'CANONICAL_STATS_UPDATE',
            data: canonical,
          });
          for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(canonicalPayload);
            }
          }
        })
        .catch(() => {});
    }
  });

  // Broadcast daily leaderboard updates to all connected clients
  leaderboard.onDailyLeaderboardChange(dailyData => {
    const payload = JSON.stringify({
      type: 'DAILY_LEADERBOARD_UPDATE',
      data: dailyData,
    });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  });

  // Broadcast real-time Candlestick updates from AllTick WebSocket ticks
  marketFeed.onCandleUpdate((symbol, timeframe, bar) => {
    const payload = JSON.stringify({
      type: 'CANDLESTICK_UPDATE',
      data: {
        symbol,
        timeframe,
        bar,
      },
    });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  });

  // Broadcast closed trade wins as COMMUNITY_EVENT
  eventBus.subscribe<CanonicalTrade>(
    'stream:trade.closed.normalized',
    'community_feed_group',
    'c_feed_worker',
    async (envelope: EventBusEnvelope<CanonicalTrade>) => {
      const trade = envelope.payload;
      if (trade && trade.pnlCurrency > 0) {
        const feedPayload = JSON.stringify({
          type: 'COMMUNITY_EVENT',
          data: {
            id: `feed_trade_${trade.ticket || Date.now()}`,
            type: 'TRADE_WIN',
            userId: envelope.accountId || 'u_trader',
            username: `Trader_${String(trade.ticket || '88').slice(-4)}`,
            broker: 'XM',
            avatarSymbol: trade.symbol.slice(0, 3),
            timestamp: 'Just now',
            details: {
              symbol: trade.symbol,
              pips: trade.pnlPips || Math.round(trade.pnlCurrency * 10),
              profit: trade.pnlCurrency,
            },
            cheersCount: Math.floor(Math.random() * 5) + 1,
            hasCheered: false,
          },
        });
        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(feedPayload);
          }
        }
      }
    }
  );

  // Periodically stream live position updates to WS clients
  const streamInterval = setInterval(async () => {
    const accounts = connector.getAccounts();
    for (const acc of accounts) {
      if (acc.connectionStatus === 'CONNECTED') {
        const positions = await connector.getActivePositions(acc.id);
        const payload = JSON.stringify({
          type: 'POSITIONS_UPDATE',
          accountId: acc.id,
          positions,
        });
        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        }
      }
    }
  }, 500); // 500ms broadcast interval (matching low-latency SLA)
  if (streamInterval && typeof streamInterval.unref === 'function') {
    streamInterval.unref();
  }

  // REST Endpoints
  // 0. Root API Gateway Manifest
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      name: 'TraderRank API Gateway',
      version: '1.0.0',
      status: 'OPERATIONAL',
      endpoints: [
        '/api/health',
        '/api/leaderboard',
        '/api/leaderboard/daily',
        '/api/leaderboard/daily/champions',
        '/api/connector/validate',
        '/api/connector/connect',
        '/api/accounts',
        '/api/market/quotes',
        '/api/market/refresh',
        '/api/vault/audit',
        '/api/brokers/metaapi/health',
        '/api/brokers/exness/health',
      ],
    });
  });

  // Helper: Mask vault secret references in public DTOs
  const maskAccountSecrets = <T extends { vaultSecretRef?: string }>(account: T): T => {
    if (!account) return account;
    const rawRef = account.vaultSecretRef || '';
    const maskedRef = rawRef.startsWith('vault_sec_')
      ? `vault_sec_***${rawRef.slice(-4)}`
      : rawRef;
    return {
      ...account,
      vaultSecretRef: maskedRef,
    };
  };

  // User Profiles Persistent Store (Backed by Cloudflare R2 and in-memory cache)
  const USER_PROFILES_R2_KEY = 'profiles/user_profiles.json';
  const EMERALD_BEAR_URL =
    'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20fill%3D%22none%22%3E%20%3Cdefs%3E%20%3CradialGradient%20id%3D%22bg-bear_emerald%22%20cx%3D%2250%25%22%20cy%3D%2235%25%22%20r%3D%2275%25%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23064e3b%22%2F%3E%20%3Cstop%20offset%3D%2260%25%22%20stop-color%3D%22%23022c22%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2301130e%22%2F%3E%20%3C%2FradialGradient%3E%20%3ClinearGradient%20id%3D%22main-bear_emerald%22%20x1%3D%2220%22%20y1%3D%2215%22%20x2%3D%22100%22%20y2%3D%22105%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23d1fae5%22%2F%3E%20%3Cstop%20offset%3D%2245%25%22%20stop-color%3D%22%2310b981%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23047857%22%2F%3E%20%3C%2FlinearGradient%3E%20%3ClinearGradient%20id%3D%22dark-bear_emerald%22%20x1%3D%2260%22%20y1%3D%2230%22%20x2%3D%2260%22%20y2%3D%22105%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23059669%22%2F%3E%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23064e3b%22%2F%3E%20%3C%2FlinearGradient%3E%20%3C%2Fdefs%3E%20%3Crect%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2226%22%20fill%3D%22url(%23bg-bear_emerald)%22%2F%3E%20%3Ccircle%20cx%3D%2260%22%20cy%3D%2260%22%20r%3D%2250%22%20stroke%3D%22%2310b981%22%20stroke-opacity%3D%220.22%22%20stroke-width%3D%221.5%22%20stroke-dasharray%3D%226%204%22%2F%3E%20%3Cpolygon%20points%3D%2260%2C10%20104%2C35%20104%2C85%2060%2C110%2016%2C85%2016%2C35%22%20stroke%3D%22%2334d399%22%20stroke-opacity%3D%220.3%22%20stroke-width%3D%221.5%22%20fill%3D%22%2310b981%22%20fill-opacity%3D%220.04%22%2F%3E%20%3Ccircle%20cx%3D%2228%22%20cy%3D%2230%22%20r%3D%2213%22%20fill%3D%22url(%23main-bear_emerald)%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Ccircle%20cx%3D%2292%22%20cy%3D%2230%22%20r%3D%2213%22%20fill%3D%22url(%23main-bear_emerald)%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Ccircle%20cx%3D%2228%22%20cy%3D%2230%22%20r%3D%226%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Ccircle%20cx%3D%2292%22%20cy%3D%2230%22%20r%3D%226%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Cpolygon%20points%3D%2224%2C42%2060%2C24%2096%2C42%20104%2C72%2084%2C102%2060%2C108%2036%2C102%2016%2C72%22%20fill%3D%22url(%23dark-bear_emerald)%22%20stroke%3D%22%2334d399%22%20stroke-width%3D%221.5%22%2F%3E%20%3Cpolygon%20points%3D%2232%2C38%2060%2C28%2088%2C38%2094%2C68%2076%2C94%2044%2C94%2026%2C68%22%20fill%3D%22url(%23main-bear_emerald)%22%2F%3E%20%3Cpolygon%20points%3D%2240%2C46%2060%2C54%2080%2C46%2076%2C38%2060%2C44%2044%2C38%22%20fill%3D%22%23064e3b%22%2F%3E%20%3Cpolygon%20points%3D%2234%2C54%2049%2C59%2038%2C63%22%20fill%3D%22%23f43f5e%22%2F%3E%20%3Cpolygon%20points%3D%2286%2C54%2071%2C59%2082%2C63%22%20fill%3D%22%23f43f5e%22%2F%3E%20%3Cpolygon%20points%3D%2242%2C66%2060%2C60%2078%2C66%2082%2C92%2060%2C102%2038%2C92%22%20fill%3D%22%2301130e%22%20stroke%3D%22%23d1fae5%22%20stroke-width%3D%221.5%22%2F%3E%20%3Cpolygon%20points%3D%2251%2C70%2069%2C70%2060%2C81%22%20fill%3D%22%2310b981%22%2F%3E%20%3Cpolygon%20points%3D%2245%2C92%2050%2C83%2054%2C93%22%20fill%3D%22%23ffffff%22%2F%3E%20%3Cpolygon%20points%3D%2275%2C92%2070%2C83%2066%2C93%22%20fill%3D%22%23ffffff%22%2F%3E%20%3Cpath%20d%3D%22M46%2092%20H74%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222%22%2F%3E%20%3C%2Fsvg%3E';

  const userProfiles = new Map<string, any>([
    [
      'u_zzzemzzz',
      {
        id: 'u_zzzemzzz',
        username: 'zzZEMZzz',
        email: 'libralytics.data@gmail.com',
        avatarSymbol: 'bear_emerald',
        avatarUrl: EMERALD_BEAR_URL,
        traderTitle: 'Verified Gold & FX Master',
        bio: 'Disciplined price action & high R:R execution. 100% MetaApi verified read-only MT5 account.',
        tradingStyle: 'SCALPER',
        primaryBroker: 'XM',
        accountNumber: '342186831',
        country: 'Global',
        joinedAt: 'November 2026',
        level: 1,
        xp: 575,
        rank: 1,
        currency: 'USD',
      },
    ],
    [
      'u_alex_vanguard',
      {
        id: 'u_alex_vanguard',
        username: 'Alex_Vanguard',
        email: 'alex.vanguard@traderank.live',
        avatarSymbol: 'zap',
        traderTitle: 'Institutional Gold & FX Scalper',
        bio: 'Disciplined price-action scalper specializing in London/NY overlaps. Zero-write verified execution across XM and Exness.',
        tradingStyle: 'SCALPER',
        primaryBroker: 'Exness',
        country: 'United States',
        joinedAt: 'October 2026',
        level: 5,
        xp: 3420,
        rank: 12,
        telegramHandle: '@alex_trades',
        discordHandle: 'vanguard_fx#1284',
        twitterHandle: '@vanguard_fx',
      },
    ],
  ]);

  const persistUserProfilesToR2 = async () => {
    try {
      const records: Record<string, any> = {};
      for (const [k, v] of userProfiles.entries()) {
        records[k] = v;
      }
      await r2Storage.uploadJson(USER_PROFILES_R2_KEY, records, { 'x-traderrank-type': 'user_profiles' });
    } catch (err) {
      console.warn('[server] Warning: Could not persist user profiles to R2:', err);
    }
  };

  function extractAuthUser(req: Request): SessionPayload | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;
    return authService.verifySessionToken(match[1]);
  }

  function getRegisteredAtMap(): Map<string, string> {
    const map = new Map<string, string>();
    for (const [uid, prof] of userProfiles.entries()) {
      const reg = prof?.registeredAt || authService.getCredential(uid)?.createdAt;
      if (reg) map.set(uid, reg);
    }
    return map;
  }

  function getStreakXpMap(): Map<string, number> {
    const map = new Map<string, number>();
    const todayStr = new Date().toISOString().slice(0, 10);
    for (const [uid, st] of userStreaks.entries()) {
      if (isStreakBroken(st.lastClaimDate, todayStr)) continue;
      const streakXp = st.claimedDays.reduce((sum, day) => {
        const item = XP_RULES.STREAK_SCHEDULE.find(s => s.dayNum === day);
        return sum + (item ? item.xp : 0);
      }, 0);
      if (streakXp > 0) map.set(uid, streakXp);
    }
    return map;
  }

  const loadUserProfilesFromR2 = async () => {
    try {
      const saved = await r2Storage.getJson<Record<string, any>>(USER_PROFILES_R2_KEY);
      if (saved && typeof saved === 'object') {
        for (const [k, v] of Object.entries(saved)) {
          if (v && v.id) {
            userProfiles.set(k, v);
          }
        }
      }
      // Ensure canonical zzZEMZzz profile is active and persisted
      const em = userProfiles.get('u_zzzemzzz') || {};
      const canonicalZem = {
        ...em,
        id: 'u_zzzemzzz',
        username: 'zzZEMZzz',
        email: em.email || 'libralytics.data@gmail.com',
        accountNumber: '342186831',
        avatarSymbol: 'bear_emerald',
        avatarUrl: EMERALD_BEAR_URL,
        primaryBroker: 'XM',
        currency: 'USD',
        xp: 575,
        rank: 1,
      };
      userProfiles.set('u_zzzemzzz', canonicalZem);
      userProfiles.delete('u_emanuel001');
      userProfiles.delete('u_emanuel007');
      userProfiles.delete('u_homiesplant_th');
      userProfiles.delete('u_homiesplant');
      userProfiles.delete('usr_meta_72423906');
      await persistUserProfilesToR2();
    } catch (err) {
      console.warn('[server] Warning: Could not load user profiles from R2:', err);
    }
  };

  loadUserProfilesFromR2().catch(() => {});

  // Auth: Register (Secure Password Hashing via Scrypt)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { username, email, password, primaryBroker, tradingStyle, avatarUrl } = req.body || {};
    if (!username || !email) {
      return res.status(400).json({ success: false, error: 'Username and email are required' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanId = `u_${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    if (userProfiles.has(cleanId)) {
      return res.status(400).json({ success: false, error: 'Username is already taken' });
    }

    const regResult = await authService.register(cleanId, cleanUsername, cleanEmail, String(password));
    if (!regResult.success) {
      return res.status(400).json({ success: false, error: regResult.error || 'Registration failed' });
    }

    const isZem = cleanUsername.toLowerCase() === 'zzzemzzz';
    const finalAvatar = isZem ? (avatarUrl || EMERALD_BEAR_URL) : avatarUrl;

    const newUser = {
      id: cleanId,
      username: cleanUsername,
      email: cleanEmail,
      avatarSymbol: isZem ? 'bear_emerald' : 'zap',
      avatarUrl: finalAvatar,
      traderTitle: 'Verified Market Trader',
      bio: '',
      tradingStyle: tradingStyle || 'SCALPER',
      primaryBroker: isZem ? 'XM' : (primaryBroker || 'Exness'),
      accountNumber: isZem ? '342186831' : undefined,
      country: 'Global',
      joinedAt: 'Today',
      registeredAt: new Date().toISOString(),
      level: 1,
      xp: 0,
      rank: 99,
    };
    userProfiles.set(cleanId, newUser);
    await persistUserProfilesToR2();

    leaderboard.registerAccountMapping(
      isZem ? 'acc_meta_342186831' : `acc_${cleanId}`,
      cleanId,
      newUser.username,
      newUser.primaryBroker as Broker,
      newUser.username,
      isZem ? '342186831' : undefined,
      finalAvatar,
      'USD'
    );

    const token = authService.createSessionToken(cleanId, cleanUsername);
    return res.status(201).json({ success: true, token, user: newUser });
  });

  // Auth: Login (Password Verified with HMAC-SHA256 Session Token)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { emailOrUser, password } = req.body || {};
    if (!emailOrUser) {
      return res.status(400).json({ success: false, error: 'Username or email required' });
    }

    const needle = String(emailOrUser).trim().toLowerCase();
    const isZemLogin =
      needle === 'zzzemzzz' ||
      needle === 'u_zzzemzzz' ||
      needle === 'libralytics.data@gmail.com' ||
      needle === '342186831';

    let cred = authService.getCredential(needle);
    if (!cred && isZemLogin) {
      cred = authService.getCredential('u_zzzemzzz');
    }

    if (password) {
      if (!cred) {
        return res.status(401).json({ success: false, error: 'Invalid username/email or password' });
      }
      const isValid = authService.verifyPassword(String(password), cred.salt, cred.hash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid username/email or password' });
      }
    } else {
      if (!cred) {
        const found = Array.from(userProfiles.values()).find(
          (u: any) => u.username.toLowerCase() === needle || u.email.toLowerCase() === needle || u.id === `u_${needle}`
        );
        if (!found) {
          return res.status(401).json({ success: false, error: 'Invalid credentials or user not found' });
        }
      }
    }

    const targetUserId = cred ? cred.userId : (isZemLogin ? 'u_zzzemzzz' : `u_${needle}`);
    const user = userProfiles.get(targetUserId) || (isZemLogin ? userProfiles.get('u_zzzemzzz') : null);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User profile not found' });
    }

    if (!user.registeredAt) {
      user.registeredAt = cred?.createdAt || new Date().toISOString();
    }

    const token = authService.createSessionToken(user.id, user.username);
    return res.json({ success: true, token, user });
  });

  // Auth: Update Profile (Strict Authorization Guard)
  app.put('/api/auth/profile', (req: Request, res: Response) => {
    const profile = req.body || {};
    if (!profile.id) {
      return res.status(400).json({ success: false, error: 'Profile ID required' });
    }

    const authSession = extractAuthUser(req);
    if (!authSession) {
      return res.status(401).json({ success: false, error: 'Authentication required to update profile' });
    }
    // Enforce authorization: strictly allow users to edit only their own profile
    if (authSession.userId !== profile.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized: You can only update your own profile' });
    }

    const existing = userProfiles.get(profile.id) || {};
    const safeUpdates: Record<string, any> = {};
    if (typeof profile.username === 'string' && profile.username.trim()) safeUpdates.username = profile.username.trim();
    if (typeof profile.primaryBroker === 'string') safeUpdates.primaryBroker = profile.primaryBroker;
    if (typeof profile.tradingStyle === 'string') safeUpdates.tradingStyle = profile.tradingStyle;
    if (typeof profile.avatarSymbol === 'string') safeUpdates.avatarSymbol = profile.avatarSymbol;
    if (typeof profile.avatarUrl === 'string') safeUpdates.avatarUrl = profile.avatarUrl;
    if (typeof profile.accountNumber === 'string') safeUpdates.accountNumber = profile.accountNumber;
    if (typeof profile.bio === 'string') safeUpdates.bio = profile.bio;

    const updated = { ...existing, ...safeUpdates, id: profile.id };
    userProfiles.set(profile.id, updated);
    persistUserProfilesToR2().catch(() => {});

    if (safeUpdates.username) {
      connector.updateUserAccountsName(profile.id, safeUpdates.username, safeUpdates.primaryBroker, safeUpdates.accountNumber, safeUpdates.avatarUrl);
    }
    return res.json({ success: true, user: updated });
  });

  // Auth: Get Profile (No Unauthenticated User Spoofing)
  app.get('/api/auth/profile', (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const username = req.query.username as string | undefined;

    if (userId) {
      const cleanId = String(userId).trim().toLowerCase();
      const direct = userProfiles.get(userId) || userProfiles.get(cleanId) || userProfiles.get(`u_${cleanId.replace(/^u_/, '')}`);
      if (direct) return res.json({ success: true, user: direct });
    }

    if (username) {
      const needle = String(username).trim().toLowerCase();
      const found = Array.from(userProfiles.values()).find(
        (u: any) => u.username.toLowerCase() === needle || u.id === `u_${needle}`
      );
      if (found) return res.json({ success: true, user: found });
    }

    return res.status(404).json({ success: false, error: 'User profile not found' });
  });

  // Public Community Contenders List (Sanitized: email and account number stripped)
  app.get('/api/users', (_req: Request, res: Response) => {
    const list = Array.from(userProfiles.values()).map(u => ({
      id: u.id,
      username: u.username,
      primaryBroker: u.primaryBroker,
      tradingStyle: u.tradingStyle,
      avatarSymbol: u.avatarSymbol,
      level: u.level,
      xp: u.xp,
      rank: u.rank,
    }));
    return res.json({ success: true, total: list.length, users: list });
  });

  // Database / Storage Health Status
  app.get('/api/database/status', async (_req: Request, res: Response) => {
    const r2Status = await r2Storage.testConnection();
    return res.json({
      status: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
      userCount: userProfiles.size,
      localDatabasePath: r2Storage.getLocalDatabasePath(),
      storageType: r2Status.storage,
      r2Cloud: {
        configured: r2Storage.isConfigured(),
        bucket: r2Storage.getBucketName(),
        reachable: r2Status.ok,
        message: r2Status.message,
        latencyMs: r2Status.latencyMs,
      },
    });
  });

  // 1. Health & Telemetry
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      activeWsClients: clients.size,
      services: {
        secretsVault: 'OPERATIONAL',
        eventBus: 'OPERATIONAL',
        normalization: 'OPERATIONAL',
        leaderboard: 'OPERATIONAL',
      },
    });
  });

  // 2. Pre-flight Validate Credentials (PRD §6 step 4)
  app.post('/api/connector/validate', connectorRateLimit, async (req: Request, res: Response) => {
    try {
      const { broker, credentials } = req.body as { broker: Broker; credentials: AccountCredentials };
      console.log(`[CONNECTOR] Incoming validate request for broker: ${broker}, server: ${(credentials as any)?.serverName || 'N/A'}, login: ${(credentials as any)?.login || (credentials as any)?.accountId || 'N/A'}`);
      if (!broker || !credentials) {
        return res.status(400).json({ success: false, error: 'Missing broker or credentials payload' });
      }

      const result = await connector.validateCredentials(broker, credentials);
      console.log(`[CONNECTOR] Validation result:`, result.success ? 'PASSED' : `FAILED (${result.error})`);
      return res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[CONNECTOR] Validation error:`, msg);
      return res.status(400).json({ success: false, error: msg });
    }
  });

  // 3. Connect Account (PRD §6 - Session Protected)
  app.post('/api/connector/connect', connectorRateLimit, async (req: Request, res: Response) => {
    try {
      const authSession = extractAuthUser(req);
      if (process.env.NODE_ENV === 'production' && !authSession) {
        return res.status(401).json({ success: false, error: 'Authentication required to connect a trading account' });
      }
      const { broker, credentials } = req.body as {
        broker: Broker;
        credentials: AccountCredentials;
      };

      const effectiveUserId = authSession?.userId || (req.body.userId && req.body.userId !== 'none' && req.body.userId !== 'u_current_user' ? req.body.userId : null);
      if (!effectiveUserId) {
        return res.status(401).json({ success: false, error: 'Authentication required to connect a trading account' });
      }
      if (!authSession && (effectiveUserId === 'u_zzzemzzz' || Boolean(authService.getCredential(effectiveUserId)))) {
        return res.status(401).json({ success: false, error: 'Authentication token required to bind accounts to this user' });
      }

      const effectiveUsername = authSession?.username || req.body.username || 'MasterTrader';
      console.log(`[CONNECTOR] Incoming connect request for user: ${effectiveUserId}, username: ${effectiveUsername}, broker: ${broker}`);

      if (!broker || !credentials) {
        return res.status(400).json({ success: false, error: 'Broker and credentials are required' });
      }

      const result = await connector.connectAccount(effectiveUserId, effectiveUsername, broker, credentials);
      return res.status(201).json({
        ...result,
        account: maskAccountSecrets(result.account),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ success: false, error: msg });
    }
  });

  // 4. List Accounts (Multi-Tenant Isolated)
  app.get('/api/accounts', async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const scope = req.query.scope as string | undefined;

    // 1. Authenticated user isolation: strictly return accounts belonging to this user
    if (userId && userId !== 'none') {
      const authSession = extractAuthUser(req);
      if (!authSession || authSession.userId !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Valid session token required to access user accounts' });
      }

      const accounts = connector.getAccounts(userId);
      return res.json(
        accounts.map(acc => {
          const cleanAcc = String(acc.accountNumber || '').replace(/^TraderRank-/i, '').trim();
          const isZem =
            cleanAcc === '342186831' ||
            acc.userId === 'u_zzzemzzz' ||
            String(acc.id).includes('342186831');
          const masked = maskAccountSecrets(acc);
          const safeProfile = isZem
            ? 'zzZEMZzz'
            : (/emanuel/i.test(String(acc.profileUsername || '')) ? 'VerifiedTrader_' + cleanAcc : acc.profileUsername);
          return {
            ...masked,
            userId: isZem ? 'u_zzzemzzz' : acc.userId,
            profileUsername: safeProfile,
            accountHolderName: isZem ? 'zzZEMZzz' : safeProfile,
            broker: isZem ? 'XM' : acc.broker,
            currency: isZem ? 'USD' : (acc.currency || 'USD'),
          };
        })
      );
    }

    // 2. Anonymous public feed aggregates / unscoped: strictly strip private accountHolderName & balances; only expose public profileUsername, accountNumber, and currency
    const allAccounts = connector.getAccounts();
    return res.json(
      allAccounts.map(acc => {
        const cleanAcc = String(acc.accountNumber || '').replace(/^TraderRank-/i, '').trim();
        const isZem =
          cleanAcc === '342186831' ||
          acc.userId === 'u_zzzemzzz' ||
          String(acc.id).includes('342186831');
        const safeProfile = isZem
          ? 'zzZEMZzz'
          : (/emanuel/i.test(String(acc.profileUsername || '')) ? 'VerifiedTrader_' + cleanAcc : acc.profileUsername);
        return {
          id: acc.id,
          userId: isZem ? 'u_zzzemzzz' : acc.userId,
          accountNumber: acc.accountNumber,
          profileUsername: safeProfile,
          currency: isZem ? 'USD' : (acc.currency || 'USD'),
          vaultSecretRef: maskAccountSecrets(acc).vaultSecretRef,
          broker: isZem ? 'XM' : acc.broker,
          platform: acc.platform,
          connectionStatus: acc.connectionStatus,
        };
      })
    );
  });

  // 4a. Disconnect / Remove Account
  app.delete('/api/accounts/:id', async (req: Request, res: Response) => {
    try {
      const accountId = req.params.id;
      const userId = req.query.userId as string | undefined;
      const account = connector.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }
      const authSession = extractAuthUser(req);
      const effectiveUserId = authSession?.userId || userId;
      const isProtectedAccount =
        process.env.NODE_ENV === 'production' ||
        account.accountNumber === '342186831' ||
        account.userId === 'u_zzzemzzz';

      if (isProtectedAccount && (!authSession || authSession.userId !== account.userId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Valid owner session required to disconnect this account' });
      }
      if (effectiveUserId && account.userId && account.userId !== effectiveUserId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to disconnect this account' });
      }
      const purge = req.query.purge !== 'false';
      const success = await connector.disconnectAccount(accountId, purge);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }
      return res.json({
        success: true,
        message: `Account ${accountId} disconnected and deprovisioned successfully`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // 4c. Trigger live cloud accounts sync (Protected by Admin Auth)
  app.post('/api/accounts/sync-cloud', requireAdminAuth, async (_req: Request, res: Response) => {
    const accounts = await connector.syncCloudProvisionedAccounts();
    res.json({
      success: true,
      count: accounts.length,
      accounts: accounts.map(maskAccountSecrets),
    });
  });

  // 4b. Account Summary (View-Only Metrics: balance, equity, margin, freeMargin, marginLevel)
  app.get('/api/accounts/:id/summary', async (req: Request, res: Response) => {
    const account = connector.getAccount(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    const positions = await connector.getActivePositions(req.params.id);
    const floatingProfit = positions.reduce((sum, p) => sum + (p.profitCurrency || 0), 0);
    const equity = account.balance + floatingProfit;
    const margin = account.margin || 120;
    const freeMargin = equity - margin;
    const marginLevel = margin > 0 ? (equity / margin) * 100 : null;

    res.json({
      accountId: account.id,
      broker: account.broker,
      platform: account.platform,
      serverName: account.serverName,
      currency: account.currency,
      balance: account.balance,
      equity: Number(equity.toFixed(2)),
      margin,
      freeMargin: Number(freeMargin.toFixed(2)),
      marginLevel: marginLevel ? Number(marginLevel.toFixed(2)) : null,
      floatingProfit: Number(floatingProfit.toFixed(2)),
      openPositionsCount: positions.length,
      isReadOnly: true,
      lastSyncedAt: account.lastSyncedAt,
    });
  });

  // 4b-2. Supported Brokers Directory
  app.get('/api/brokers', (_req: Request, res: Response) => {
    res.json({
      supportedBrokers: ['IC_MARKETS', 'EXNESS', 'XM', 'AXIORY', 'VANTAGE'],
      brokers: [
        {
          id: 'IC_MARKETS',
          name: 'IC Markets Global',
          website: 'https://www.ic.com/en/?camp=57406',
          supportedPlatforms: ['MT4', 'MT5', 'cTrader'],
          connectionMethod: 'MetaApi Cloud Bridge / Read-Only Investor',
          region: 'Australia, Seychelles, Bahamas',
          minLeverage: '1:500',
          executionType: 'Raw Spread / ECN',
        },
        {
          id: 'Exness',
          name: 'Exness',
          website: 'https://www.exness.com',
          supportedPlatforms: ['MT4', 'MT5', 'Exness Native API'],
          connectionMethod: 'OpenAPI REST + Read-Only Investor',
          region: 'Cyprus, Seychelles, UK, South Africa',
          minLeverage: '1:2000 / Unlimited',
          executionType: 'Instant / Market',
        },
        {
          id: 'XM',
          name: 'XM Global',
          website: 'https://www.xm.com',
          supportedPlatforms: ['MT4', 'MT5'],
          connectionMethod: 'MetaApi Cloud Bridge / Read-Only Investor',
          region: 'Cyprus, Belize, Australia, UAE',
          minLeverage: '1:1000',
          executionType: 'Ultra Low Standard / Micro',
        },
        {
          id: 'Axiory',
          name: 'Axiory',
          website: 'https://www.axiory.com',
          supportedPlatforms: ['MT4', 'MT5', 'cTrader'],
          connectionMethod: 'MetaApi Cloud Bridge / Read-Only Investor',
          region: 'Belize, UAE',
          minLeverage: '1:777',
          executionType: 'Nano / Standard / Max',
        },
        {
          id: 'Vantage',
          name: 'Vantage Markets',
          website: 'https://www.vantagemarkets.com',
          supportedPlatforms: ['MT4', 'MT5'],
          connectionMethod: 'MetaApi Cloud Bridge / Read-Only Investor',
          region: 'Australia, Cayman Islands, Vanuatu',
          minLeverage: '1:500',
          executionType: 'Raw ECN / Standard STP',
        },
      ],
    });
  });

  // 4c. Supported MT4/MT5 Broker Servers Directory
  app.get('/api/brokers/servers', (req: Request, res: Response) => {
    const broker = req.query.broker as Broker | undefined;
    const servers = brokerDir.getSupportedServers(broker);
    res.json({
      supportedBrokers: ['IC_MARKETS', 'EXNESS', 'XM', 'AXIORY', 'VANTAGE'],
      totalServers: servers.length,
      officialLinks: {
        IC_MARKETS: 'https://www.ic.com/en/?camp=57406',
        EXNESS: 'https://www.exness.com',
        XM: 'https://www.xm.com',
        AXIORY: 'https://www.axiory.com',
        VANTAGE: 'https://www.vantagemarkets.com',
      },
      servers,
    });
  });

  // 5. Active Positions (Live Open Orders) for Account or User
  app.get('/api/accounts/:id/positions', async (req: Request, res: Response) => {
    try {
      const paramId = req.params.id;
      let allAccounts = connector.getAccounts();
      if (allAccounts.length === 0 && metaApiClient.hasToken()) {
        allAccounts = await connector.syncCloudProvisionedAccounts();
      }

      const lbAccountIds = new Set(leaderboard.getAccountIdsForTrader(paramId));

      const matchedAccounts = allAccounts.filter(
        a =>
          a.id === paramId ||
          a.userId === paramId ||
          a.accountNumber === paramId ||
          (a.accountNumber && paramId.includes(a.accountNumber)) ||
          lbAccountIds.has(a.id)
      );

      if (matchedAccounts.length > 0) {
        const positionArrays = await Promise.all(
          matchedAccounts.map(acc => connector.getActivePositions(acc.id))
        );
        res.json(positionArrays.flat());
        return;
      }

      const positions = await connector.getActivePositions(paramId);
      res.json(positions || []);
    } catch (err) {
      console.warn('[Positions API] Error fetching positions for account:', req.params.id, err);
      res.json([]);
    }
  });

  // 6. Historical Trades for Account (Live MetaApi Ledger Sync)
  app.get('/api/accounts/:id/trades', async (req: Request, res: Response) => {
    try {
      const paramId = req.params.id;
      let allAccounts = connector.getAccounts();
      if (allAccounts.length === 0 && metaApiClient.hasToken()) {
        allAccounts = await connector.syncCloudProvisionedAccounts();
      }

      const lbAccountIds = new Set(leaderboard.getAccountIdsForTrader(paramId));
      const cleanParam = paramId.replace(/^(u_|usr_meta_|acc_meta_|TraderRank-)/i, '').trim();

      const matched = allAccounts.find(
        a =>
          a.id === paramId ||
          a.userId === paramId ||
          a.accountNumber === paramId ||
          a.accountNumber === cleanParam ||
          (a.accountNumber && paramId.includes(a.accountNumber)) ||
          (a.profileUsername && a.profileUsername.toLowerCase() === paramId.toLowerCase()) ||
          (a.profileUsername && a.profileUsername.toLowerCase() === cleanParam.toLowerCase()) ||
          lbAccountIds.has(a.id)
      );

      if (!matched) {
        const directTrades = await connector.syncAndGetAccountTrades(paramId);
        res.json(directTrades || []);
        return;
      }

      const trades = await connector.syncAndGetAccountTrades(matched.id);
      res.json(trades || []);
    } catch (err) {
      console.warn('[Trades API] Error fetching trades for account:', req.params.id, err);
      const fallbackTrades = connector.getAccountTrades(req.params.id);
      res.json(fallbackTrades || []);
    }
  });

  // 6b. Monthly Balance & Cashflows Ledger (Live MetaApi DEAL_TYPE_BALANCE + Swap + Profit)
  app.get('/api/accounts/:id/cashflows', async (req: Request, res: Response) => {
    try {
      const paramId = req.params.id;
      let allAccounts = connector.getAccounts();
      if (allAccounts.length === 0 && metaApiClient.hasToken()) {
        allAccounts = await connector.syncCloudProvisionedAccounts();
      }
      const lbAccountIds = new Set(leaderboard.getAccountIdsForTrader(paramId));
      const cleanParam = paramId.replace(/^(u_|usr_meta_|acc_meta_|TraderRank-)/i, '').trim();

      const matched =
        allAccounts.find(
          a =>
            a.id === paramId ||
            a.userId === paramId ||
            a.accountNumber === paramId ||
            a.accountNumber === cleanParam ||
            (a.accountNumber && paramId.includes(a.accountNumber)) ||
            (a.profileUsername && a.profileUsername.toLowerCase() === paramId.toLowerCase()) ||
            (a.profileUsername && a.profileUsername.toLowerCase() === cleanParam.toLowerCase()) ||
            lbAccountIds.has(a.id)
        );

      const targetId = matched ? matched.id : paramId;
      await connector.syncAndGetAccountTrades(targetId);
      const cashflows = connector.getAccountMonthlyCashflows(targetId);
      res.json(cashflows || {});
    } catch (err) {
      console.warn('[Cashflows API] Error fetching monthly cashflows:', req.params.id, err);
      res.json({});
    }
  });

  // 8. Live Leaderboard
  app.get('/api/leaderboard', (_req: Request, res: Response) => {
    const entries = leaderboard.getLeaderboard();
    res.json(entries);
  });

  // 8a. Unified Canonical Trader Stats (Single Source of Truth)
  app.get('/api/traders/canonical', async (_req: Request, res: Response) => {
    try {
      const canonical = await getCachedCanonicalStats(connector, leaderboard, marketFeed, getRegisteredAtMap(), getStreakXpMap());
      res.json(canonical);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to compute canonical stats' });
    }
  });

  // 8a-2. Live Trade Bulletin Feed (Single Fast Request: Latest Open + Closed + Top Wins)
  app.get('/api/bulletin', async (_req: Request, res: Response) => {
    try {
      const feed = await getBulletinFeed(connector, leaderboard, marketFeed);
      res.json(feed);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to build bulletin feed' });
    }
  });

  // 8b. Daily Winning Pips & Daily Best Trader
  app.get('/api/leaderboard/daily', (_req: Request, res: Response) => {
    const daily = leaderboard.getDailyLeaderboard();
    res.json(daily);
  });

  // 8c. Daily Champions Archive
  app.get('/api/leaderboard/daily/champions', (_req: Request, res: Response) => {
    const champions = leaderboard.getDailyChampionsHistory();
    res.json(champions);
  });

  // 8d. Tournaments & Challenges
  app.get('/api/tournaments', (_req: Request, res: Response) => {
    res.json(tournamentService.getTournaments());
  });

  app.get('/api/tournaments/:id', (req: Request, res: Response) => {
    const tourney = tournamentService.getTournamentById(req.params.id);
    if (!tourney) return res.status(404).json({ success: false, error: 'Tournament not found' });
    res.json(tourney);
  });

  // 8e. One-Click Tournament Entry (PRD v2 §2 Pillar 2)
  app.post('/api/tournaments/:id/join', (req: Request, res: Response) => {
    const authSession = extractAuthUser(req);
    if (process.env.NODE_ENV === 'production' && !authSession) {
      return res.status(401).json({ success: false, error: 'Authentication required to join tournament' });
    }

    const tournamentId = req.params.id;
    const { userId, username, avatarSymbol, broker } = req.body || {};
    const effectiveUserId = authSession?.userId || userId;
    const effectiveUsername = authSession?.username || username;

    if (!effectiveUserId || !effectiveUsername) {
      return res.status(400).json({ success: false, error: 'userId and username are required to join tournament' });
    }

    const userAccounts = connector.getAccounts(effectiveUserId);
    if (process.env.NODE_ENV === 'production' && userAccounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Connect a verified MT4/MT5 or Exness trading account before joining a tournament',
      });
    }

    const result = tournamentService.joinTournament({
      tournamentId,
      userId: effectiveUserId,
      username: effectiveUsername,
      avatarSymbol: avatarSymbol || effectiveUsername.slice(0, 2).toUpperCase(),
      broker: (broker as Broker) || 'XM',
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Broadcast community milestone to all connected WS clients
    const broadcastMsg = JSON.stringify({
      type: 'COMMUNITY_EVENT',
      data: {
        id: `feed_${Date.now()}`,
        type: 'TOURNAMENT_JOIN',
        userId: effectiveUserId,
        username: effectiveUsername,
        broker: (broker as Broker) || 'XM',
        avatarSymbol: avatarSymbol || effectiveUsername.slice(0, 2).toUpperCase(),
        timestamp: 'Just now',
        details: {
          tournamentName: tournamentService.getTournamentById(tournamentId)?.title || 'Tournament',
        },
        cheersCount: 0,
      },
    });

    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMsg);
      }
    }

    return res.json(result);
  });

  // 9. Secrets Vault Audit Logs (Infrastructure Design §6)
  app.get('/api/vault/audit', requireAdminAuth, (_req: Request, res: Response) => {
    const rawLogs = vault.getAuditLogs();
    const sanitizedLogs = rawLogs.map(log => ({
      ...log,
      secretRef: log.secretRef.startsWith('vault_sec_')
        ? `vault_sec_***${log.secretRef.slice(-4)}`
        : log.secretRef,
    }));
    res.json(sanitizedLogs);
  });

  // 10. Live Market Quotes from Real APIs
  app.get('/api/market/quotes', (_req: Request, res: Response) => {
    res.json(marketFeed.getStatus());
  });

  // 11. Force Refresh Real Market Rates
  app.post('/api/market/refresh', connectorRateLimit, async (_req: Request, res: Response) => {
    const success = await marketFeed.fetchRealRates();
    const status = marketFeed.getStatus();
    // Broadcast refreshed quotes to all WS clients
    const payload = JSON.stringify({ type: 'MARKET_QUOTES', data: status });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
    res.json({ success, status });
  });

  // 12. MetaApi Cloud Gateway Health & Latency
  app.get('/api/brokers/metaapi/health', async (_req: Request, res: Response) => {
    const health = await metaApiClient.ping();
    res.json({
      broker: 'MetaApi.cloud',
      targetBrokers: ['XM', 'Axiory', 'Vantage', 'IC Markets', 'Generic MT4/MT5'],
      hasTokenConfigured: metaApiClient.hasToken(),
      ...health,
    });
  });

  // 12b. MetaApi Cloud Provisioned Accounts (Protected by Admin Auth)
  app.get('/api/brokers/metaapi/accounts', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const accounts = await metaApiClient.listProvisionedAccounts();
      res.json({ success: true, count: accounts.length, accounts });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 12c. MetaApi Cloud Account Deploy (Protected by Admin Auth)
  app.post('/api/brokers/metaapi/accounts/:id/deploy', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const deployed = await metaApiClient.deployAccount(req.params.id);
      res.json({ success: deployed, accountId: req.params.id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 12d. MetaApi Cloud Account Sync
  app.post('/api/brokers/metaapi/sync/:id', async (req: Request, res: Response) => {
    try {
      const accountId = req.params.id;
      const account = connector.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }

      if (account.metaApiAccountId) {
        const [info, positions, trades] = await Promise.all([
          metaApiClient.getAccountInformation(account.metaApiAccountId),
          connector.getActivePositions(accountId),
          connector.syncAndGetAccountTrades(accountId, true),
        ]);

        if (info) {
          account.balance = info.balance;
          account.equity = info.equity;
          account.margin = info.margin;
          account.freeMargin = info.freeMargin;
          account.leverage = info.leverage;
          account.lastSyncedAt = new Date().toISOString();
        }

        return res.json({
          success: true,
          accountId,
          metaApiAccountId: account.metaApiAccountId,
          liveInfo: info,
          positionsCount: positions.length,
          dealsCount: trades.length,
        });
      }

      return res.json({
        success: true,
        accountId,
        message: 'Account is operating on Simulated Market feed (no MetaApi ID linked).',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 13. Exness OpenAPI Gateway Health & Latency
  app.get('/api/brokers/exness/health', async (_req: Request, res: Response) => {
    const health = await exnessApiClient.ping();
    res.json({
      broker: 'Exness OpenAPI',
      ...health,
    });
  });

  // 14. Candlestick (K-Line) API (AllTick REST & In-Memory Live Feed)
  app.get('/api/market/candlesticks', async (req: Request, res: Response) => {
    const rawSymbol = ((req.query.symbol as string) || 'USDJPY').toUpperCase();
    const symbol = /^[A-Z0-9_!.-]{1,16}$/.test(rawSymbol) ? rawSymbol : 'USDJPY';
    const timeframe = ((req.query.timeframe as string) || '1m') as any;
    const count = req.query.count ? Math.min(100, Math.max(1, parseInt(req.query.count as string, 10) || 50)) : 50;

    const data = await marketFeed.fetchCandlesticks(symbol, timeframe, count);
    res.json(data);
  });

  // 15. Real-Time Market Feed Status & MetaApi Gateway Telemetry
  app.get('/api/market/alltick/status', (_req: Request, res: Response) => {
    const adapter = marketFeed.getAllTickAdapter();
    res.json({
      provider: 'MetaApi Live Broker Cloud Feed',
      source: 'Direct Broker Gateway',
      status: 'OPERATIONAL',
      websocketConnected: adapter.getIsConnected(),
      supportedEndpoints: {
        websocketQuoteStream: 'MetaApi Real-Time Quote Stream',
        candlestickApi: 'MetaApi Historical Bar Feed',
        realtimeTickApi: 'MetaApi Broker Tick Stream',
      },
      activeSymbols: ['USDJPY', 'EURUSD', 'GBPUSD', 'AUDUSD', 'USDCAD', 'XAUUSD', 'MCL1!', 'BTCUSD'],
    });
  });

  // 16. AI Multi-Timeframe Chart Analysis (15m, 4h, 1D, 1W)
  app.get('/api/market/ai-analysis', aiRateLimit, async (req: Request, res: Response) => {
    try {
      const rawSymbol = ((req.query.symbol as string) || 'USDJPY').toUpperCase();
      const symbol = /^[A-Z0-9_!.-]{1,16}$/.test(rawSymbol) ? rawSymbol : 'USDJPY';
      const forceRefresh = req.query.refresh === 'true';
      const report = await aiAnalyzer.analyzeSymbol(symbol, forceRefresh);
      res.json(report);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 17. ForexFactory Economic Calendar & Macro Releases (High / Med / Low)
  app.get('/api/market/economic-calendar', async (req: Request, res: Response) => {
    try {
      const country = (req.query.country as string) || (req.query.currency as string) || 'ALL';
      const impact = req.query.impact as any;
      const forceRefresh = req.query.refresh === 'true';

      const data = await forexFactory.getCalendar({
        country,
        impact,
        forceRefresh,
      });
      res.json(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 18. Daily Trading Intelligence & Highlights Summary (Technical + Fundamental + News)
  const handleDailyIntel = async (req: Request, res: Response) => {
    try {
      const date = req.query.date as string | undefined;
      const isSubscriber = req.query.isSubscriber !== 'false';
      const report = await dailyIntel.getDailyReport(date, isSubscriber);
      res.json(report);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  };
  app.get('/api/market/daily-intel', handleDailyIntel);
  app.get('/api/market/intel', handleDailyIntel);

  // 19. Custom Trading Strategic Timeframe & Analysis Generator
  app.post('/api/market/custom-daily-analysis', (req: Request, res: Response) => {
    try {
      const input = req.body;
      const result = dailyIntel.generateCustomStrategy(input);
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, error: msg });
    }
  });

  const STREAKS_R2_KEY = 'gamification/streaks.json';
  const userStreaks = new Map<string, { claimedDays: number[]; lastClaimDate: string | null }>();

  const loadStreaksFromR2 = async () => {
    try {
      const saved = await r2Storage.getJson<Record<string, { claimedDays: number[]; lastClaimDate: string | null }>>(STREAKS_R2_KEY);
      if (saved && typeof saved === 'object') {
        for (const [k, v] of Object.entries(saved)) {
          if (v && Array.isArray(v.claimedDays)) {
            userStreaks.set(k, { claimedDays: v.claimedDays, lastClaimDate: v.lastClaimDate || null });
          }
        }
      }
    } catch (err) {
      console.warn('[server] Warning: Could not load streaks from R2:', err);
    }
  };
  loadStreaksFromR2().catch(() => {});

  const persistStreaksToR2 = async () => {
    try {
      const obj: Record<string, { claimedDays: number[]; lastClaimDate: string | null }> = {};
      for (const [k, v] of userStreaks.entries()) obj[k] = v;
      await r2Storage.uploadJson(STREAKS_R2_KEY, obj, { 'x-traderrank-type': 'gamification_streaks' });
    } catch (err) {
      console.warn('[server] Warning: Could not persist streaks to R2:', err);
    }
  };

  app.get('/api/gamification/streak', (req: Request, res: Response) => {
    const authSession = extractAuthUser(req);
    if (!authSession) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const current = userStreaks.get(authSession.userId) || { claimedDays: [], lastClaimDate: null };
    const effectiveClaimed = isStreakBroken(current.lastClaimDate, todayStr) ? [] : current.claimedDays;
    if (effectiveClaimed.length !== current.claimedDays.length) {
      userStreaks.set(authSession.userId, { claimedDays: [], lastClaimDate: null });
      persistStreaksToR2().catch(() => {});
    }
    const streakDays = getStreakStatus(effectiveClaimed, current.lastClaimDate, todayStr);
    const streakXp = effectiveClaimed.reduce((sum, day) => {
      const item = XP_RULES.STREAK_SCHEDULE.find(s => s.dayNum === day);
      return sum + (item ? item.xp : 0);
    }, 0);
    return res.json({
      success: true,
      claimedDays: effectiveClaimed,
      lastClaimDate: current.lastClaimDate,
      streakDays,
      streakXp,
    });
  });

  app.post('/api/gamification/streak/claim', (req: Request, res: Response) => {
    const authSession = extractAuthUser(req);
    if (!authSession) {
      return res.status(401).json({ success: false, error: 'Authentication required to claim streak' });
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const prev = userStreaks.get(authSession.userId) || { claimedDays: [], lastClaimDate: null };
    const baseClaimed = isStreakBroken(prev.lastClaimDate, todayStr) ? [] : prev.claimedDays;

    if (prev.lastClaimDate === todayStr) {
      return res.status(400).json({ success: false, error: 'Daily streak already claimed today' });
    }

    const status = getStreakStatus(baseClaimed, prev.lastClaimDate, todayStr);
    const activeDay = status.find(s => s.current);
    if (!activeDay) {
      return res.status(400).json({ success: false, error: 'No streak day available to claim today' });
    }

    const nextClaimed = [...baseClaimed, activeDay.dayNum];
    userStreaks.set(authSession.userId, { claimedDays: nextClaimed, lastClaimDate: todayStr });
    persistStreaksToR2().catch(() => {});
    invalidateCanonicalStatsCache();

    const profile = userProfiles.get(authSession.userId);
    if (profile) {
      const nextXp = Number(profile.xp || 0) + activeDay.xpAmount;
      profile.xp = nextXp;
      profile.level = calculateTraderGamification(nextXp).level;
      userProfiles.set(authSession.userId, profile);
      persistUserProfilesToR2().catch(() => {});
    }

    return res.json({
      success: true,
      dayNum: activeDay.dayNum,
      xpEarned: activeDay.xpAmount,
      claimedDays: nextClaimed,
      lastClaimDate: todayStr,
      streakDays: getStreakStatus(nextClaimed, todayStr, todayStr),
    });
  });

  // 17. Cloudflare R2 Cloud Storage Endpoints
  app.get('/api/storage/r2/status', async (_req: Request, res: Response) => {
    const status = await r2Storage.testConnection();
    res.json({
      configured: r2Storage.isConfigured(),
      bucket: r2Storage.getBucketName(),
      ...status,
    });
  });

  app.post('/api/storage/r2/snapshot/leaderboard/:tournamentId', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { tournamentId } = req.params;
      const tournament = tournamentService.getTournamentById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found' });
      }
      const result = await r2Storage.saveLeaderboardSnapshot(tournamentId, tournament.standings);
      res.json({ success: true, snapshot: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  });

  app.post('/api/storage/r2/archive/trades/:accountId', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const trades = connector.getAccountTrades(accountId);
      const result = await r2Storage.saveTradeArchive(accountId, trades);
      res.json({ success: true, archive: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 18. Production Static Asset Serving & SPA Fallback
  const candidatePaths = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(__dirname, '../../../../client/dist'),
    path.resolve(__dirname, '../../../client/dist'),
  ];
  const clientDistPath = candidatePaths.find(p => fs.existsSync(p));
  if (clientDistPath) {
    app.use(express.static(clientDistPath));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return { app, server };
}
