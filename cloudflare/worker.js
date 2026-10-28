/**
 * TraderRank Edge Gateway Worker
 * Proxies traffic to the live Render deployment with WebSocket support and edge security.
 */

const ORIGIN = 'https://traderrank.onrender.com';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = new URL(url.pathname + url.search, ORIGIN);

    // Forward headers
    const newHeaders = new Headers(request.headers);
    newHeaders.set('X-Forwarded-Host', url.host);
    newHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
    newHeaders.set('X-Edge-Gateway', 'Cloudflare-Worker');

    // Handle WebSocket Upgrades
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      return fetch(targetUrl.toString(), {
        headers: newHeaders,
        method: request.method,
      });
    }

    // Standard HTTP Proxying
    try {
      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: newHeaders,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'follow',
      });

      // Enhance response with security & edge headers
      const resHeaders = new Headers(response.headers);
      resHeaders.set('X-Powered-By', 'TraderRank Edge');
      resHeaders.set('X-Content-Type-Options', 'nosniff');
      resHeaders.set('Access-Control-Allow-Origin', '*');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: resHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({
        error: 'Edge Gateway Failed to reach origin',
        details: err instanceof Error ? err.message : String(err),
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
