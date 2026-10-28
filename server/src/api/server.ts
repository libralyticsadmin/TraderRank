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
      // Allow legitimate read endpoints and connect/disconnect/refresh
      if (!path.includes('/api/connector/connect') && !path.includes('/api/connector/validate') && !path.includes('/api/market/refresh') && !path.includes('/trades')) {
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
  const aiAnalyzer = new AiChartAnalyzer(marketFeed.getAllTickAdapter());
  const forexFactory = ForexFactoryService.getInstance();
  const dailyIntel = DailyIntelService.getInstance();
  const tournamentService = TournamentService.getInstance();
  const eventBus = RedisStreamsBus.getInstance();

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
      if (!broker || !credentials) {
        return res.status(400).json({ success: false, error: 'Missing broker or credentials payload' });
      }

      const result = await connector.validateCredentials(broker, credentials);
      return res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ success: false, error: msg });
    }
  });

  // 3. Connect Account (PRD §6)
  app.post('/api/connector/connect', connectorRateLimit, async (req: Request, res: Response) => {
    try {
      const { userId = 'u_current_user', username = 'MasterTrader', broker, credentials } = req.body as {
        userId?: string;
        username?: string;
        broker: Broker;
        credentials: AccountCredentials;
      };

      if (!broker || !credentials) {
        return res.status(400).json({ success: false, error: 'Broker and credentials are required' });
      }

      const result = await connector.connectAccount(userId, username, broker, credentials);
      return res.status(201).json({
        ...result,
        account: maskAccountSecrets(result.account),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ success: false, error: msg });
    }
  });

  // 4. List Accounts
  app.get('/api/accounts', async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    let accounts = connector.getAccounts(userId);
    if (accounts.length === 0) {
      accounts = await connector.syncCloudProvisionedAccounts();
    }
    res.json(accounts.map(maskAccountSecrets));
  });

  // 4c. Trigger live cloud accounts sync
  app.post('/api/accounts/sync-cloud', async (_req: Request, res: Response) => {
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

  // 5. Active Positions for Account
  app.get('/api/accounts/:id/positions', async (req: Request, res: Response) => {
    const positions = await connector.getActivePositions(req.params.id);
    res.json(positions);
  });

  // 6. Historical Trades for Account
  app.get('/api/accounts/:id/trades', (req: Request, res: Response) => {
    let trades = connector.getAccountTrades(req.params.id);
    if (!trades || trades.length === 0) {
      const allAccounts = connector.getAccounts();
      const matched = allAccounts.find(
        a => a.id === req.params.id ||
             a.userId === req.params.id ||
             a.accountNumber === req.params.id ||
             (a.accountNumber && req.params.id.includes(a.accountNumber))
      );
      if (matched) {
        trades = connector.getAccountTrades(matched.id);
      }
    }
    if (!trades || trades.length === 0) {
      const allAccounts = connector.getAccounts();
      if (allAccounts.length > 0) {
        trades = connector.getAccountTrades(allAccounts[0].id);
      }
    }
    res.json(trades || []);
  });

  // 7. Disconnect Account
  app.delete('/api/accounts/:id', async (req: Request, res: Response) => {
    const success = await connector.disconnectAccount(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    return res.json({ success: true, message: 'Account disconnected and credentials purged' });
  });

  // 8. Live Leaderboard
  app.get('/api/leaderboard', (_req: Request, res: Response) => {
    const entries = leaderboard.getLeaderboard();
    res.json(entries);
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
    const tournamentId = req.params.id;
    const { userId, username, avatarSymbol, broker } = req.body || {};

    if (!userId || !username) {
      return res.status(400).json({ success: false, error: 'userId and username are required to join tournament' });
    }

    const result = tournamentService.joinTournament({
      tournamentId,
      userId,
      username,
      avatarSymbol: avatarSymbol || username.slice(0, 2).toUpperCase(),
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
        userId,
        username,
        broker: (broker as Broker) || 'XM',
        avatarSymbol: avatarSymbol || username.slice(0, 2).toUpperCase(),
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
  app.get('/api/vault/audit', (_req: Request, res: Response) => {
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

  // 12b. MetaApi Cloud Provisioned Accounts
  app.get('/api/brokers/metaapi/accounts', async (_req: Request, res: Response) => {
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
        const [info, positions, deals] = await Promise.all([
          metaApiClient.getAccountInformation(account.metaApiAccountId),
          metaApiClient.getPositions(account.metaApiAccountId),
          metaApiClient.getHistoricalDeals(account.metaApiAccountId),
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
          dealsCount: deals.length,
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

  // 20. Pro Subscription Plans ($9/mo)
  app.get('/api/subscription/plans', (_req: Request, res: Response) => {
    const plans = dailyIntel.getSubscriptionPlans();
    res.json(plans);
  });

  // 21. Pro Subscription Activation Simulation
  app.post('/api/subscription/subscribe', (req: Request, res: Response) => {
    try {
      const { tier = 'PRO_MONTHLY', paymentMethod = 'SIMULATED_CARD' } = req.body;
      const now = new Date();
      const isAnnual = tier === 'PRO_ANNUAL';
      const expiresAt = new Date(now.getTime() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();

      res.json({
        success: true,
        subscription: {
          isActive: true,
          tier,
          planName: isAnnual ? 'Pro Annual All-Access' : 'Pro Daily Intelligence',
          priceMonthly: isAnnual ? 6.58 : 9.00,
          startedAt: now.toISOString(),
          expiresAt,
          paymentMethod,
          features: [
            'Full Daily Technical & Fundamental Summaries',
            'ForexFactory High-Impact News Breakdown & Impact Notes',
            'Custom Strategic Timeframe Generator (1m - 1W)',
            'SMC Institutional Order Block & Demand/Supply Key Levels',
            'Tactical Stop Loss, Entry Zones & Multi-Take Profit Targets',
            'Optimal Trading Session Windows (London, NY, Asian)',
          ],
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, error: msg });
    }
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
