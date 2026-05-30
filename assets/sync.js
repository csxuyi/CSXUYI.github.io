/* ==========================================================================
   X[STELLAR_WISH] · GitHub OAuth + Cloud Vault Sync
   ==========================================================================
   提供 GitHub OAuth 登录/登出 + GitHub Gist 云端数据同步

   使用前需要配置:
     1. GitHub OAuth App → 获得 CLIENT_ID
     2. 部署 Cloudflare Worker → 获得 WORKER_URL
   ========================================================================== */
(function(){
'use strict';

// ============================================================
// CONFIG — 部署前修改此处
// ============================================================
const CLIENT_ID = 'Ov23liZl7oE5WFh998Y0';  // GitHub OAuth App Client ID
const WORKER_URL = 'https://xlab-auth.xlab-stellarvault.workers.dev/api/token';
const REDIRECT_URI = location.origin + '/auth/callback.html';
const VAULT_FILENAME = 'stellarvault.json';
const VAULT_DESC = 'X[STELLAR_WISH] · 星穹祈愿数据';

// localStorage keys to sync to cloud
const SYNC_KEYS = [
  'wish_genshin_v5',
  'wish_daily_v2',
  'gacha_tarot_v3',
  'xlab-first-visit',
];

// ============================================================
// GitHubAuth — OAuth flow + session management
// ============================================================
const GitHubAuth = {
  /** 跳转到 GitHub 授权页 */
  login(){
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      scope: 'gist read:user',
      redirect_uri: REDIRECT_URI,
    });
    location.href = 'https://github.com/login/oauth/authorize?' + params.toString();
  },

  /** OAuth 回调处理 — 用 code 换 token */
  async handleCallback(){
    const code = new URLSearchParams(location.search).get('code');
    if(!code) return { error: 'no code in URL' };

    // 调用 Worker 换 token
    try {
      const res = await fetch(WORKER_URL + '?code=' + encodeURIComponent(code));
      const data = await res.json();
      if(data.error) return { error: data.error };

      // 存到 sessionStorage (关闭浏览器即登出)
      sessionStorage.setItem('gh_token', data.access_token);
      sessionStorage.setItem('gh_user', JSON.stringify(data.user));
      return { ok: true, user: data.user, token: data.access_token };
    } catch(e){
      return { error: 'worker unreachable: ' + e.message };
    }
  },

  /** 检查是否已通过 GitHub 登录 */
  isLoggedIn(){
    return !!sessionStorage.getItem('gh_token');
  },

  /** 获取当前 GitHub 用户信息 */
  getUser(){
    try {
      return JSON.parse(sessionStorage.getItem('gh_user'));
    } catch(e){ return null; }
  },

  /** 获取 access token */
  getToken(){
    return sessionStorage.getItem('gh_token');
  },

  /** 登出 — 清除 session */
  logout(){
    sessionStorage.removeItem('gh_token');
    sessionStorage.removeItem('gh_user');
  },
};

// ============================================================
// SyncVault — GitHub Gist 云端数据同步
// ============================================================
const SyncVault = {
  /** Gist API 请求封装 */
  async _api(method, path, body){
    const token = GitHubAuth.getToken();
    if(!token) throw new Error('not logged in');
    const opts = {
      method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github.v3+json',
      },
    };
    if(body){
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch('https://api.github.com' + path, opts);
    if(!res.ok) throw new Error('GitHub API error: ' + res.status + ' ' + (await res.text()));
    if(res.status === 204) return null; // no content
    return res.json();
  },

  /** 查找用户的 StellarVault Gist */
  async _findVault(){
    const gists = await this._api('GET', '/gists?per_page=100');
    for(const g of gists){
      if(g.files && g.files[VAULT_FILENAME]){
        return g; // 找到了
      }
    }
    return null;
  },

  /** 打包当前 localStorage 数据 */
  _packData(){
    const data = {};
    for(const key of SYNC_KEYS){
      const raw = localStorage.getItem(key);
      if(raw !== null){
        try { data[key] = JSON.parse(raw); }
        catch(e){ data[key] = raw; }
      }
    }
    return { v: 1, updatedAt: Date.now(), data: data };
  },

  /** 解包数据写入 localStorage */
  _unpackData(vault){
    if(!vault || !vault.data) return;
    for(const key of SYNC_KEYS){
      if(vault.data[key] !== undefined){
        const val = vault.data[key];
        localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
      }
    }
  },

  /** 从 Gist 拉取数据，合并到 localStorage */
  async pull(){
    try {
      const gist = await this._findVault();
      if(!gist){
        // 首次登录 — 创建 Vault Gist 并上传当前数据
        console.log('[SyncVault] 首次登录，创建云端存档...');
        await this.push();
        return { ok: true, created: true };
      }

      // 读取 Gist 内容
      const rawUrl = gist.files[VAULT_FILENAME].raw_url;
      const res = await fetch(rawUrl);
      const vault = await res.json();

      // 比较时间戳：云端更新则拉取
      const localUpdated = parseInt(localStorage.getItem('xlab-first-visit') || '0', 10);
      if(vault.updatedAt > Date.now() - 1000){
        // 云端数据比本地新（或登录时），合并
        this._unpackData(vault);
        console.log('[SyncVault] 云端数据已同步到本地');
        return { ok: true, merged: true };
      }
      return { ok: true, skipped: true };
    } catch(e){
      console.warn('[SyncVault] pull 失败:', e.message);
      return { error: e.message };
    }
  },

  /** 推送 localStorage 数据到 Gist */
  async push(){
    try {
      const vault = this._packData();
      const body = {
        description: VAULT_DESC,
        public: false,
        files: { [VAULT_FILENAME]: { content: JSON.stringify(vault, null, 2) } },
      };

      const existing = await this._findVault();
      if(existing){
        await this._api('PATCH', '/gists/' + existing.id, body);
      } else {
        await this._api('POST', '/gists', body);
      }
      console.log('[SyncVault] 数据已同步到云端');
      return { ok: true };
    } catch(e){
      console.warn('[SyncVault] push 失败:', e.message);
      return { error: e.message };
    }
  },

  /** 启用自动同步 — 在数据变更后自动推送（debounce 3s） */
  _timer: null,
  autoSync(){
    if(!GitHubAuth.isLoggedIn()) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.push(), 3000);
  },
};

// ============================================================
// 导出到 window
// ============================================================
window.GitHubAuth = GitHubAuth;
window.SyncVault = SyncVault;

})();
