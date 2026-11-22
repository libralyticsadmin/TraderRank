import dotenv from 'dotenv';
dotenv.config();

import { createServer } from './api/server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const { server } = createServer();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`[CORE] TraderRank Core Infrastructure Running on Port ${PORT}`);
  console.log(`[GATEWAY] WebSocket Gateway: ws://0.0.0.0:${PORT}/ws`);
  console.log(`[VAULT] Secrets Vault: Initialized (AES-256-GCM)`);
  console.log(`[INGEST] Ingestion Workers: MT Gateway & Exness Native Ready`);
  console.log(`[STREAM] Redis Streams Normalization: Active`);
  console.log(`====================================================`);
});

const shutdown = async (signal: string) => {
  console.log(`[CORE] Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('[CORE] HTTP & WebSocket server closed.');
  });
  try {
    const { onboardingService } = await import('./services/onboardingService.js');
    onboardingService.stop();
  } catch {}
  setTimeout(() => {
    console.log('[CORE] Graceful shutdown complete.');
    process.exit(0);
  }, 1000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
