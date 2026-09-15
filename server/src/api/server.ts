/**
 * TraderRank API Gateway & WebSocket Server
 * Compliant with PRD v1 and Infrastructure Design §2, §3.1, §3.5.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { AccountConnectorService } from '../connector/accountConnector.js';
import { LeaderboardService } from '../services/leaderboardService.js';
import { SecretsVault } from '../vault/secretsVault.js';
import { LiveMarketFeedService } from '../market/liveMarketFeed.js';
import { MetaApiClient } from '../workers/metaApiClient.js';
import { ExnessApiClient } from '../workers/exnessApiClient.js';
import { Broker, AccountCredentials } from '../../../shared/src/types.js';

import { BrokerDirectory } from '../connector/brokerDirectory.js';
import { ZeroWriteGuard, IllegalWriteOperationError } from '../connector/zeroWriteGuard.js';

export function createServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.use(cors());
  app.use(express.json());

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
  app.post('/api/connector/validate', async (req: Request, res: Response) => {
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
  app.post('/api/connector/connect', async (req: Request, res: Response) => {
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
      return res.status(201).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ success: false, error: msg });
    }
  });

  // 4. List Accounts
  app.get('/api/accounts', (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const accounts = connector.getAccounts(userId);
    res.json(accounts);
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

  // 4c. Supported MT4/MT5 Broker Servers Directory
  app.get('/api/brokers/servers', (req: Request, res: Response) => {
    const broker = req.query.broker as Broker | undefined;
    const servers = brokerDir.getSupportedServers(broker);
    res.json({
      supportedBrokers: ['EXNESS', 'XM', 'AXIORY', 'VANTAGE'],
      totalServers: servers.length,
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
    const trades = connector.getAccountTrades(req.params.id);
    res.json(trades);
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

  // 9. Secrets Vault Audit Logs (Infrastructure Design §6)
  app.get('/api/vault/audit', (_req: Request, res: Response) => {
    res.json(vault.getAuditLogs());
  });

  // 10. Live Market Quotes from Real APIs
  app.get('/api/market/quotes', (_req: Request, res: Response) => {
    res.json(marketFeed.getStatus());
  });

  // 11. Force Refresh Real Market Rates
  app.post('/api/market/refresh', async (_req: Request, res: Response) => {
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
      targetBrokers: ['XM', 'Axiory', 'Vantage', 'Generic MT4/MT5'],
      hasTokenConfigured: metaApiClient.hasToken(),
      ...health,
    });
  });

  // 13. Exness OpenAPI Gateway Health & Latency
  app.get('/api/brokers/exness/health', async (_req: Request, res: Response) => {
    const health = await exnessApiClient.ping();
    res.json({
      broker: 'Exness OpenAPI',
      ...health,
    });
  });

  return { app, server };
}
