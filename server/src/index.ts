/**
 * TraderRank Server Entrypoint
 */

import { createServer } from './api/server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const { server } = createServer();

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 TraderRank Core Infrastructure Running on Port ${PORT}`);
  console.log(`📡 WebSocket Gateway: ws://localhost:${PORT}/ws`);
  console.log(`🛡️ Secrets Vault: Initialized (AES-256-GCM)`);
  console.log(`⚡ Ingestion Workers: MT Gateway & Exness Native Ready`);
  console.log(`📊 Redis Streams Normalization: Active`);
  console.log(`====================================================`);
});
