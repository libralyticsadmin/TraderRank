import { createServer } from '../server/dist/server/src/api/server.js';

let appInstance = null;

function getApp() {
  if (!appInstance) {
    const { app } = createServer();
    appInstance = app;
  }
  return appInstance;
}

export default function handler(req, res) {
  const app = getApp();
  return app(req, res);
}

export { getApp };
