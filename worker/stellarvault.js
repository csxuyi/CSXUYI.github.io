/**
 * X[STELLAR_WISH] · Cloudflare Worker — OAuth Proxy + Leaderboard
 *
 * 部署步骤:
 *   1. wrangler secret put CLIENT_ID
 *   2. wrangler secret put CLIENT_SECRET
 *   3. wrangler secret put GIST_TOKEN       # GitHub PAT with gist scope
 *   4. wrangler secret put LEADERBOARD_GIST_ID  # Shared leaderboard Gist ID
 *   5. wrangler deploy
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // GET /api/leaderboard — return top 20
    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
      try {
        const gistRes = await fetch(
          `https://api.github.com/gists/${env.LEADERBOARD_GIST_ID}`,
          { headers: { Authorization: `Bearer ${env.GIST_TOKEN}`, 'User-Agent': 'XLab', Accept: 'application/vnd.github.v3+json' } }
        );
        if (!gistRes.ok) return corsJson({ error: 'failed to read leaderboard' }, 500);
        const gist = await gistRes.json();
        const raw = gist.files?.['leaderboard.json']?.content;
        if (!raw) return corsJson({ entries: [] });
        const data = JSON.parse(raw);
        const entries = (data.entries || [])
          .sort((a, b) => (b.totalQ || 0) - (a.totalQ || 0))
          .slice(0, 20);
        return corsJson({ entries });
      } catch (e) { return corsJson({ error: e.message }, 500); }
    }

    // POST /api/leaderboard — submit quiz stats (GitHub user only)
    if (url.pathname === '/api/leaderboard' && request.method === 'POST') {
      try {
        const body = await request.json();
        if (!body.login || !body.quizStats) return corsJson({ error: 'missing fields' }, 400);
        // Read current leaderboard
        const gistRes = await fetch(
          `https://api.github.com/gists/${env.LEADERBOARD_GIST_ID}`,
          { headers: { Authorization: `Bearer ${env.GIST_TOKEN}`, 'User-Agent': 'XLab', Accept: 'application/vnd.github.v3+json' } }
        );
        if (!gistRes.ok) return corsJson({ error: 'failed to read leaderboard' }, 500);
        const gist = await gistRes.json();
        const raw = gist.files?.['leaderboard.json']?.content;
        const data = raw ? JSON.parse(raw) : { entries: [] };
        // Upsert: update existing or add new
        const idx = data.entries.findIndex(e => e.login === body.login);
        const entry = {
          login: body.login,
          avatar: body.avatar || '',
          totalQ: body.quizStats.totalQ || 0,
          totalC: body.quizStats.totalC || 0,
          accuracy: body.quizStats.totalQ > 0 ? Math.round((body.quizStats.totalC / body.quizStats.totalQ) * 100) : 0,
          highScore: body.quizStats.highScore || 0,
          games: body.quizStats.games || 0,
          updatedAt: Date.now(),
        };
        if (idx >= 0) data.entries[idx] = entry;
        else data.entries.push(entry);
        // Write back
        const updateRes = await fetch(
          `https://api.github.com/gists/${env.LEADERBOARD_GIST_ID}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${env.GIST_TOKEN}`, 'User-Agent': 'XLab', 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
            body: JSON.stringify({ files: { 'leaderboard.json': { content: JSON.stringify(data, null, 2) } } }),
          }
        );
        if (!updateRes.ok) return corsJson({ error: 'failed to update leaderboard' }, 500);
        return corsJson({ ok: true });
      } catch (e) { return corsJson({ error: e.message }, 500); }
    }

    // GET /api/cards — read approved card submissions from GitHub Issues
    if (url.pathname === '/api/cards' && request.method === 'GET') {
      try {
        const issuesRes = await fetch(
          'https://api.github.com/repos/csxuyi/CSXUYI.github.io/issues?labels=approved&state=open&per_page=50',
          { headers: { Authorization: `Bearer ${env.GIST_TOKEN}`, 'User-Agent': 'XLab', Accept: 'application/vnd.github.v3+json' } }
        );
        if (!issuesRes.ok) return corsJson({ error: 'failed to fetch issues' }, 500);
        const issues = await issuesRes.json();
        const cards = issues.map(issue => parseCardIssue(issue)).filter(c => c);
        return corsJson({ cards });
      } catch (e) { return corsJson({ error: e.message }, 500); }
    }

    // Health check
    if (url.pathname === '/api/health') {
      return corsJson({ status: 'ok', service: 'xlab-stellarvault' });
    }

    return corsJson({ error: 'not found' }, 404);
  },
};

function parseCardIssue(issue) {
  try {
    const body = issue.body || '';
    // Extract fields from Issue template body
    const name = (body.match(/### 角色名称[\s\S]*?\n\s*(.+?)\s*\n/) || [])[1]?.trim()
      || (body.match(/角色名称[：:]\s*(.+)/) || [])[1]?.trim() || '';
    const rarityRaw = (body.match(/### 稀有度[\s\S]*?\n\s*(.+?)\s*\n/) || [])[1]?.trim()
      || (body.match(/稀有度[：:]\s*(.+)/) || [])[1]?.trim() || '3★';
    const rarity = parseInt(rarityRaw) || 3;
    const img = (body.match(/### 图片[ ]?URL[\s\S]*?\n\s*(.+?)\s*\n/) || [])[1]?.trim()
      || (body.match(/图片[ ]?URL[：:]\s*(.+)/) || [])[1]?.trim()
      || (body.match(/https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)/i) || [])[0] || '';
    const desc = (body.match(/### 卡牌描述[\s\S]*?\n\s*(.+?)(?:\n\n|\n###|\n_投稿|$)/) || [])[1]?.trim()
      || (body.match(/卡牌描述[：:]\s*(.+)/) || [])[1]?.trim() || '';
    const author = (body.match(/投稿人[（(]选填[）)][：:]?\s*(.+)/) || [])[1]?.trim() || '';
    if (!name || !img) return null;
    return {
      id: 'gh-' + issue.number,
      name,
      rarity,
      img,
      desc: desc || '来自投稿 ' + (author || '匿名'),
      issueUrl: issue.html_url,
      author,
    };
  } catch (e) { return null; }
}

function corsJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
