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
