/**
 * X[STELLAR_WISH] · Cloudflare Worker — GitHub OAuth Token Proxy
 *
 * 部署步骤:
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler secret put CLIENT_ID     # 填入 GitHub OAuth App Client ID
 *   4. wrangler secret put CLIENT_SECRET # 填入 GitHub OAuth App Client Secret
 *   5. wrangler deploy
 *
 * 部署后你会得到一个 URL: https://xlab-auth.YOUR_USERNAME.workers.dev
 * 将其填入 assets/sync.js 的 WORKER_URL 中
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // GET /api/token?code=xxx — exchange OAuth code for access token
    if (url.pathname === '/api/token') {
      const code = url.searchParams.get('code');
      if (!code) {
        return corsJson({ error: 'missing "code" parameter' }, 400);
      }

      // Exchange code for access_token
      const ghRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.CLIENT_ID,
          client_secret: env.CLIENT_SECRET,
          code: code,
        }),
      });

      const tokenData = await ghRes.json();
      if (tokenData.error) {
        return corsJson({
          error: tokenData.error_description || tokenData.error,
        }, 400);
      }

      if (!tokenData.access_token) {
        return corsJson({ error: 'no access_token in response' }, 500);
      }

      // Fetch user info
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'XLab-StellarVault',
        },
      });

      if (!userRes.ok) {
        return corsJson({ error: 'failed to fetch user info' }, 500);
      }

      const user = await userRes.json();

      return corsJson({
        access_token: tokenData.access_token,
        user: {
          login: user.login,
          avatar_url: user.avatar_url,
        },
      });
    }

    // Health check
    if (url.pathname === '/api/health') {
      return corsJson({ status: 'ok', service: 'xlab-stellarvault' });
    }

    return corsJson({ error: 'not found' }, 404);
  },
};

function corsJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
