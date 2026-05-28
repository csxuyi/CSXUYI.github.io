/* ==========================================================================
   星穹祈愿 · Geek Layer
   通用极客层：Konami 终端 / ⌘K 命令面板 / ASCII 启动 / Matrix 雨 /
   全息箔片 / Web Audio 程序化音效
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------- 0. 工具函数 ---------- */
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
  const css = (str) => {
    const s = document.createElement('style');
    s.textContent = str;
    document.head.appendChild(s);
    return s;
  };

  /* ---------- 1. 全局样式 ---------- */
  css(`
    .geek-fixed{position:fixed;inset:0;pointer-events:none;z-index:9999}
    .geek-mono{font-family:"JetBrains Mono","SF Mono","Menlo","Cascadia Code",ui-monospace,monospace}

    /* ===== ASCII boot ===== */
    .geek-boot{
      position:fixed;inset:0;z-index:99999;background:#000;color:#D4B87A;
      display:flex;align-items:center;justify-content:center;
      font-family:"JetBrains Mono","SF Mono","Menlo",ui-monospace,monospace;
      font-size:11px;line-height:1.05;letter-spacing:0;
      transition:opacity .55s ease;
      white-space:pre;
      text-shadow:0 0 8px rgba(212,184,122,.45);
    }
    .geek-boot pre{margin:0}
    .geek-boot.gone{opacity:0;pointer-events:none}

    /* ===== Command palette (⌘K) ===== */
    .geek-cmdk-mask{
      position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.55);
      backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
      opacity:0;pointer-events:none;transition:opacity .2s ease;
      display:flex;align-items:flex-start;justify-content:center;padding-top:16vh;
    }
    .geek-cmdk-mask.open{opacity:1;pointer-events:auto}
    .geek-cmdk{
      width:min(560px,92vw);
      background:rgba(14,18,32,.78);
      backdrop-filter:blur(22px) saturate(140%);
      -webkit-backdrop-filter:blur(22px) saturate(140%);
      border:1px solid rgba(212,184,122,.22);
      border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.04) inset;
      overflow:hidden;
    }
    .geek-cmdk input{
      width:100%;box-sizing:border-box;
      padding:18px 22px;background:transparent;border:0;outline:0;
      color:#E8E0D0;font-size:1rem;letter-spacing:.05em;
      font-family:"JetBrains Mono","SF Mono",ui-monospace,monospace;
      border-bottom:1px solid rgba(255,255,255,.06);
    }
    .geek-cmdk input::placeholder{color:#6a6e80}
    .geek-cmdk-list{max-height:50vh;overflow-y:auto}
    .geek-cmdk-list::-webkit-scrollbar{width:4px}
    .geek-cmdk-list::-webkit-scrollbar-thumb{background:rgba(212,184,122,.2);border-radius:2px}
    .geek-cmdk-item{
      padding:11px 22px;display:flex;align-items:center;gap:12px;cursor:pointer;
      color:#c8c4b0;font-size:.92rem;border-left:2px solid transparent;
      transition:background .15s ease,border-color .15s ease;
    }
    .geek-cmdk-item .geek-kbd{
      margin-left:auto;font-size:.7rem;color:#7a7e90;font-family:"JetBrains Mono",monospace;
    }
    .geek-cmdk-item .geek-ico{width:18px;text-align:center;color:#D4B87A}
    .geek-cmdk-item.active{background:rgba(212,184,122,.08);border-left-color:#D4B87A;color:#fff}
    .geek-cmdk-empty{padding:22px;text-align:center;color:#6a6e80;font-size:.85rem}

    /* ===== Konami terminal ===== */
    .geek-term-mask{
      position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,.78);
      opacity:0;pointer-events:none;transition:opacity .25s ease;
    }
    .geek-term-mask.open{opacity:1;pointer-events:auto}
    .geek-term{
      position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
      width:min(720px,94vw);height:min(460px,80vh);
      background:rgba(6,10,18,.96);
      border:1px solid rgba(80,255,160,.28);
      border-radius:10px;box-shadow:0 0 40px rgba(80,255,160,.18),inset 0 0 60px rgba(0,40,20,.3);
      display:flex;flex-direction:column;overflow:hidden;
      font-family:"JetBrains Mono","SF Mono",ui-monospace,monospace;
    }
    .geek-term-bar{
      padding:8px 14px;background:rgba(80,255,160,.05);border-bottom:1px solid rgba(80,255,160,.14);
      display:flex;align-items:center;gap:8px;font-size:.75rem;color:#7fffa3;letter-spacing:.1em;
    }
    .geek-term-bar .dot{width:10px;height:10px;border-radius:50%;background:#ff5f56;box-shadow:14px 0 0 #ffbd2e,28px 0 0 #27c93f}
    .geek-term-bar .ttl{margin-left:46px}
    .geek-term-out{
      flex:1;overflow-y:auto;padding:14px 16px;
      color:#bff5d0;font-size:.85rem;line-height:1.55;white-space:pre-wrap;word-break:break-word;
    }
    .geek-term-out .ok{color:#7fffa3}
    .geek-term-out .err{color:#ff7878}
    .geek-term-out .gold{color:#D4B87A}
    .geek-term-out .dim{color:#5a8a72}
    .geek-term-out::-webkit-scrollbar{width:4px}
    .geek-term-out::-webkit-scrollbar-thumb{background:rgba(80,255,160,.25);border-radius:2px}
    .geek-term-in{
      display:flex;align-items:center;gap:8px;padding:10px 14px;
      border-top:1px solid rgba(80,255,160,.14);background:rgba(80,255,160,.03);
    }
    .geek-term-in .ps{color:#7fffa3;font-weight:700}
    .geek-term-in input{
      flex:1;background:transparent;border:0;outline:0;color:#cfffd9;font-size:.9rem;
      font-family:inherit;caret-color:#7fffa3;
    }

    /* ===== Konami hint ===== */
    .geek-konami-toast{
      position:fixed;bottom:24px;left:24px;z-index:9996;
      padding:10px 14px;background:rgba(6,10,18,.78);
      border:1px solid rgba(80,255,160,.32);border-radius:8px;
      color:#7fffa3;font-size:.78rem;letter-spacing:.08em;
      font-family:"JetBrains Mono",ui-monospace,monospace;
      opacity:0;transform:translateY(8px);transition:all .35s ease;
      pointer-events:none;
    }
    .geek-konami-toast.show{opacity:1;transform:translateY(0)}

    /* ===== Holographic foil (cards) ===== */
    .holo-foil{
      position:absolute;inset:0;border-radius:inherit;pointer-events:none;
      mix-blend-mode:color-dodge;opacity:0;transition:opacity .25s ease;
      background:
        conic-gradient(from var(--hf-a,0deg) at var(--hf-x,50%) var(--hf-y,50%),
          hsla(0,90%,70%,.55),hsla(40,95%,70%,.55),hsla(120,90%,70%,.55),
          hsla(190,95%,75%,.55),hsla(280,90%,75%,.55),hsla(330,95%,75%,.55),
          hsla(0,90%,70%,.55));
      filter:blur(2px) saturate(1.4);
    }
    .holo-glare{
      position:absolute;inset:0;border-radius:inherit;pointer-events:none;
      mix-blend-mode:overlay;opacity:0;transition:opacity .25s ease;
      background:radial-gradient(circle at var(--hf-x,50%) var(--hf-y,50%),
        rgba(255,255,255,.55) 0%,rgba(255,255,255,.18) 18%,transparent 45%);
    }
    .holo-active .holo-foil{opacity:.85}
    .holo-active .holo-glare{opacity:.9}
  `);

  /* ---------- 2. ASCII 启动 ---------- */
  function asciiBoot() {
    if (sessionStorage.getItem('geek-booted') === '1') return;
    if (document.body.dataset.skipBoot === '1') return;
    sessionStorage.setItem('geek-booted', '1');

    const lines = [
      '   ███████╗████████╗███████╗██╗     ██╗      █████╗ ██████╗ ',
      '   ██╔════╝╚══██╔══╝██╔════╝██║     ██║     ██╔══██╗██╔══██╗',
      '   ███████╗   ██║   █████╗  ██║     ██║     ███████║██████╔╝',
      '   ╚════██║   ██║   ██╔══╝  ██║     ██║     ██╔══██║██╔══██╗',
      '   ███████║   ██║   ███████╗███████╗███████╗██║  ██║██║  ██║',
      '   ╚══════╝   ╚═╝   ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝',
      '            W   I   S   H      ·      v 2 . 0',
    ];
    const boot = document.createElement('div');
    boot.className = 'geek-boot';
    const pre = document.createElement('pre');
    boot.appendChild(pre);
    document.body.appendChild(boot);

    let idx = 0, charIdx = 0, current = '';
    function tick() {
      if (idx >= lines.length) {
        setTimeout(() => {
          boot.classList.add('gone');
          setTimeout(() => boot.remove(), 600);
        }, 280);
        return;
      }
      const line = lines[idx];
      if (charIdx <= line.length) {
        current = lines.slice(0, idx).join('\n') + (idx ? '\n' : '') + line.slice(0, charIdx);
        pre.textContent = current;
        charIdx += 6;
        setTimeout(tick, 8);
      } else {
        idx++; charIdx = 0;
        setTimeout(tick, 30);
      }
    }
    tick();
  }

  /* ---------- 3. Matrix 数字雨过场 ---------- */
  function matrixRain(durationMs = 900, onDone) {
    const c = document.createElement('canvas');
    c.className = 'geek-fixed';
    c.style.zIndex = 99998;
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      c.width = innerWidth * dpr; c.height = innerHeight * dpr;
      c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    }
    size();
    const fontSize = 16 * dpr;
    const cols = Math.ceil(c.width / fontSize);
    const drops = new Array(cols).fill(0).map(() => Math.random() * -50);
    const chars = 'アイウエオカキクケコサシスセソタチツテト0123456789★☆✦✧⚛∞ΣΩΦΨΞ';
    const start = performance.now();
    function frame(t) {
      const elapsed = t - start;
      const p = Math.min(elapsed / durationMs, 1);
      ctx.fillStyle = 'rgba(0,0,0,' + (0.18 + p * 0.12) + ')';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.font = fontSize + 'px "JetBrains Mono",monospace';
      for (let i = 0; i < cols; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[i] * fontSize;
        ctx.fillStyle = 'rgba(180,255,210,.35)';
        ctx.fillText(ch, i * fontSize, y);
        ctx.fillStyle = '#aaffd0';
        ctx.fillText(ch, i * fontSize, y);
        if (y > c.height && Math.random() > 0.965) drops[i] = 0;
        drops[i] += 1 + p * 2.2;
      }
      if (p < 1) requestAnimationFrame(frame);
      else {
        // fade out
        let f = 1;
        (function fade() {
          f -= 0.08;
          ctx.fillStyle = 'rgba(0,0,0,' + Math.max(0, 0.04) + ')';
          ctx.fillRect(0, 0, c.width, c.height);
          c.style.opacity = Math.max(0, f);
          if (f > 0) requestAnimationFrame(fade);
          else { c.remove(); onDone && onDone(); }
        })();
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 4. 命令面板 ⌘K ---------- */
  const PALETTE_ITEMS = [
    { id: 'wish',   ico: '🌠', label: '祈愿 · 抽卡',     hint: 'wish.html',  run: () => location.href = 'wish.html' },
    { id: 'cards',  ico: '🂠',  label: '卡牌图鉴',        hint: 'cards.html', run: () => location.href = 'cards.html' },
    { id: 'daily',  ico: '🌅', label: '每日签到',        hint: 'daily.html', run: () => location.href = 'daily.html' },
    { id: 'stats',  ico: '📊', label: '数据统计',        hint: 'stats.html', run: () => location.href = 'stats.html' },
    { id: 'home',   ico: '✦',  label: '回到主页',        hint: 'index.html', run: () => location.href = 'index.html' },
    { id: 'term',   ico: '⌨',  label: '打开终端',        hint: '↑↑↓↓←→←→BA',  run: () => openTerminal() },
    { id: 'matrix', ico: '◍',  label: '数字雨彩蛋',      hint: 'easter egg',  run: () => matrixRain(2200) },
    { id: 'mute',   ico: '🔈', label: '静音/取消静音',   hint: 'sfx',         run: () => { GeekSFX.toggle(); flash('SFX ' + (GeekSFX.muted ? 'muted' : 'on')); } },
  ];

  let cmdkMask, cmdkInput, cmdkList, cmdkActive = 0, cmdkFiltered = PALETTE_ITEMS;
  function buildCmdK() {
    cmdkMask = document.createElement('div');
    cmdkMask.className = 'geek-cmdk-mask';
    cmdkMask.innerHTML = `
      <div class="geek-cmdk" role="dialog" aria-label="command palette">
        <input type="text" placeholder="键入命令或页面…   (⌘K / Ctrl+K 关闭)" />
        <div class="geek-cmdk-list"></div>
      </div>`;
    document.body.appendChild(cmdkMask);
    cmdkInput = cmdkMask.querySelector('input');
    cmdkList = cmdkMask.querySelector('.geek-cmdk-list');

    cmdkMask.addEventListener('click', (e) => { if (e.target === cmdkMask) closeCmdK(); });
    cmdkInput.addEventListener('input', () => filterCmdK(cmdkInput.value));
    cmdkInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCmdK();
      else if (e.key === 'ArrowDown') { e.preventDefault(); cmdkActive = (cmdkActive + 1) % cmdkFiltered.length; renderCmdK(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cmdkActive = (cmdkActive - 1 + cmdkFiltered.length) % cmdkFiltered.length; renderCmdK(); }
      else if (e.key === 'Enter') { const it = cmdkFiltered[cmdkActive]; if (it) { closeCmdK(); it.run(); } }
    });
    filterCmdK('');
  }
  function filterCmdK(q) {
    q = q.trim().toLowerCase();
    cmdkFiltered = PALETTE_ITEMS.filter(i => !q || (i.label + ' ' + i.id + ' ' + i.hint).toLowerCase().includes(q));
    cmdkActive = 0; renderCmdK();
  }
  function renderCmdK() {
    if (!cmdkFiltered.length) {
      cmdkList.innerHTML = '<div class="geek-cmdk-empty">无匹配项</div>';
      return;
    }
    cmdkList.innerHTML = cmdkFiltered.map((it, i) =>
      `<div class="geek-cmdk-item ${i === cmdkActive ? 'active' : ''}" data-i="${i}">
        <span class="geek-ico">${it.ico}</span>
        <span>${it.label}</span>
        <span class="geek-kbd">${it.hint}</span>
      </div>`).join('');
    $$('.geek-cmdk-item', cmdkList).forEach(el => {
      el.addEventListener('mouseenter', () => { cmdkActive = +el.dataset.i; renderCmdK(); });
      el.addEventListener('click', () => { const it = cmdkFiltered[+el.dataset.i]; closeCmdK(); it.run(); });
    });
  }
  function openCmdK() { if (!cmdkMask) buildCmdK(); cmdkMask.classList.add('open'); cmdkInput.value = ''; filterCmdK(''); setTimeout(() => cmdkInput.focus(), 30); }
  function closeCmdK() { cmdkMask && cmdkMask.classList.remove('open'); }

  /* ---------- 5. Konami 终端 ---------- */
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let kbuf = [];
  function watchKonami() {
    addEventListener('keydown', (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      kbuf.push(k); if (kbuf.length > KONAMI.length) kbuf.shift();
      if (kbuf.length === KONAMI.length && kbuf.every((v, i) => v === KONAMI[i])) {
        kbuf = []; openTerminal();
      }
    });
  }

  let term, termOut, termIn, termOpen = false;
  const TERM_HISTORY_KEY = 'geek-term-history';
  let termHistory = JSON.parse(localStorage.getItem(TERM_HISTORY_KEY) || '[]');
  let termHistIdx = -1;

  function buildTerm() {
    term = document.createElement('div');
    term.className = 'geek-term-mask';
    term.innerHTML = `
      <div class="geek-term">
        <div class="geek-term-bar"><span class="dot"></span><span class="ttl">stellar@wish:~ — sh</span></div>
        <div class="geek-term-out"></div>
        <form class="geek-term-in" autocomplete="off"><span class="ps">stellar $</span><input type="text" /></form>
      </div>`;
    document.body.appendChild(term);
    termOut = term.querySelector('.geek-term-out');
    termIn = term.querySelector('input');
    term.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = termIn.value.trim();
      if (!v) return;
      termHistory.push(v); if (termHistory.length > 80) termHistory.shift();
      localStorage.setItem(TERM_HISTORY_KEY, JSON.stringify(termHistory));
      termHistIdx = -1;
      runTerm(v);
      termIn.value = '';
    });
    termIn.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeTerminal();
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (termHistory.length === 0) return;
        if (termHistIdx === -1) termHistIdx = termHistory.length - 1;
        else termHistIdx = Math.max(0, termHistIdx - 1);
        termIn.value = termHistory[termHistIdx];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (termHistIdx === -1) return;
        termHistIdx++;
        if (termHistIdx >= termHistory.length) { termHistIdx = -1; termIn.value = ''; }
        else termIn.value = termHistory[termHistIdx];
      } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); termOut.innerHTML = '';
      }
    });
    term.addEventListener('click', (e) => { if (e.target === term) closeTerminal(); });

    print(`<span class="ok">stellar@wish v2.0</span>  ·  type <span class="gold">help</span> for commands\n`);
  }

  function openTerminal() {
    if (!term) buildTerm();
    term.classList.add('open'); termOpen = true;
    setTimeout(() => termIn.focus(), 30);
  }
  function closeTerminal() { term && term.classList.remove('open'); termOpen = false; }

  function print(html) {
    const span = document.createElement('span');
    span.innerHTML = html + '\n';
    termOut.appendChild(span);
    termOut.scrollTop = termOut.scrollHeight;
  }

  const TERM_CMDS = {
    help() {
      print(`<span class="gold">可用命令:</span>
  <span class="ok">help</span>                    显示帮助
  <span class="ok">whoami</span>                  当前身份
  <span class="ok">ls</span>                      列出页面
  <span class="ok">cd</span> <span class="dim">&lt;page&gt;</span>             跳转页面 (wish/cards/daily/stats/home)
  <span class="ok">wish</span> <span class="dim">[--pulls=N]</span>        模拟抽卡 (默认 1)
  <span class="ok">stats</span> <span class="dim">[--json]</span>          查看统计
  <span class="ok">fortune</span>                 今日欧气指数
  <span class="ok">matrix</span>                  数字雨彩蛋
  <span class="ok">cowsay</span> <span class="dim">&lt;text&gt;</span>          牛说点啥
  <span class="ok">sudo</span> <span class="dim">&lt;cmd&gt;</span>             嗯？
  <span class="ok">clear</span>                   清屏 (Ctrl+L)
  <span class="ok">exit</span>                    关闭终端 (Esc)`);
    },
    whoami() { print('<span class="ok">stellar-traveler</span>  uid=233 gid=233 groups=233(wishers)'); },
    ls() {
      print(`<span class="gold">drwxr-xr-x</span>  index.html   <span class="dim">主入口</span>
<span class="gold">drwxr-xr-x</span>  wish.html    <span class="dim">祈愿 · 抽卡</span>
<span class="gold">drwxr-xr-x</span>  cards.html   <span class="dim">卡牌图鉴</span>
<span class="gold">drwxr-xr-x</span>  daily.html   <span class="dim">每日签到</span>
<span class="gold">drwxr-xr-x</span>  stats.html   <span class="dim">数据统计</span>`);
    },
    cd(args) {
      const map = { wish: 'wish.html', cards: 'cards.html', daily: 'daily.html', stats: 'stats.html', home: 'index.html', '~': 'index.html', '..': 'index.html' };
      const t = map[args[0]];
      if (!t) return print('<span class="err">cd: no such directory: ' + (args[0] || '') + '</span>');
      print('<span class="ok">jumping to ' + t + '...</span>');
      setTimeout(() => location.href = t, 350);
    },
    wish(args) {
      const n = Math.max(1, Math.min(99, +(args.find(a => a.startsWith('--pulls='))?.slice(8)) || 1));
      print(`<span class="dim">simulating ${n} pull(s)...</span>`);
      const pool = [];
      for (let i = 0; i < n; i++) {
        const r = Math.random();
        const rarity = r < 0.008 ? 6 : r < 0.024 ? 5 : r < 0.154 ? 4 : 3;
        pool.push(rarity);
      }
      const counts = pool.reduce((a, r) => (a[r] = (a[r] || 0) + 1, a), {});
      const stars = (r) => '★'.repeat(r);
      let out = '';
      [6,5,4,3].forEach(r => { if (counts[r]) out += `  <span class="gold">${stars(r).padEnd(7)}</span> × ${counts[r]}\n`; });
      print(out + (counts[6] ? '<span class="gold">  ✦ 创世神降临！</span>' : counts[5] ? '<span class="ok">  ✦ 5★ get!</span>' : ''));
    },
    stats(args) {
      let s = null;
      try { s = JSON.parse(localStorage.getItem('SW_STATE_v3') || localStorage.getItem('STATE') || 'null'); } catch (e) {}
      if (!s) return print('<span class="err">no local stats found. (尚未抽卡)</span>');
      if (args.includes('--json')) return print('<span class="dim">' + JSON.stringify(s, null, 2).replace(/</g,'&lt;') + '</span>');
      print(`  <span class="gold">总抽数:</span>   ${s.total ?? '?'}
  <span class="gold">5★ 数:</span>    ${(s.hist || []).filter(h => h.rarity === 5).length}
  <span class="gold">6★ 数:</span>    ${(s.hist || []).filter(h => h.rarity === 6).length}`);
    },
    fortune() {
      const r = global.GeekFortune ? global.GeekFortune.compute() : { score: Math.floor(Math.random() * 100), level: '随机', tip: '今天也要好好抽卡' };
      print(`  <span class="gold">欧气指数:</span> <span class="ok">${r.score}</span> / 100   [${r.level}]
  <span class="dim">${r.tip}</span>`);
    },
    matrix() { closeTerminal(); setTimeout(() => matrixRain(2400), 200); },
    cowsay(args) {
      const text = args.join(' ') || 'moo';
      const top = ' ' + '_'.repeat(text.length + 2);
      const bot = ' ' + '-'.repeat(text.length + 2);
      print(`${top}\n&lt; ${text} &gt;\n${bot}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`);
    },
    sudo(args) { print('<span class="err">[sudo] 这个用户没有 sudo 权限。但你可以试试 cowsay。</span>'); },
    clear() { termOut.innerHTML = ''; },
    exit() { closeTerminal(); },
  };

  function runTerm(line) {
    print('<span class="dim">$</span> ' + line.replace(/</g, '&lt;'));
    const [cmd, ...args] = line.split(/\s+/);
    const fn = TERM_CMDS[cmd];
    if (!fn) return print('<span class="err">command not found: ' + cmd + '</span>  ·  try <span class="ok">help</span>');
    try { fn(args); } catch (e) { print('<span class="err">err: ' + e.message + '</span>'); }
  }

  /* ---------- 6. Konami 提示（仅首次访问） ---------- */
  function konamiHint() {
    if (localStorage.getItem('geek-konami-seen') === '1') return;
    setTimeout(() => {
      const t = document.createElement('div');
      t.className = 'geek-konami-toast';
      t.textContent = '> 试试 Konami: ↑↑↓↓←→←→BA  ·  ⌘K 命令面板';
      document.body.appendChild(t);
      requestAnimationFrame(() => t.classList.add('show'));
      setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 600); localStorage.setItem('geek-konami-seen', '1'); }, 5000);
    }, 2400);
  }

  /* ---------- 7. flash 小提示 ---------- */
  function flash(text) {
    const t = document.createElement('div');
    t.className = 'geek-konami-toast show';
    t.style.cssText += ';left:50%;bottom:auto;top:20px;transform:translateX(-50%) translateY(0)';
    t.textContent = '> ' + text;
    document.body.appendChild(t);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 600); }, 1400);
  }

  /* ---------- 8. 全息箔片 ---------- */
  function attachHolo(el) {
    if (!el || el.dataset.holo === '1') return;
    el.dataset.holo = '1';
    const foil = document.createElement('div'); foil.className = 'holo-foil';
    const glare = document.createElement('div'); glare.className = 'holo-glare';
    const cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';
    el.appendChild(foil); el.appendChild(glare);

    let raf = 0;
    function onMove(e) {
      const r = el.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 100;
      const py = ((e.clientY - r.top) / r.height) * 100;
      const ang = (px + py) * 1.8;
      el.style.setProperty('--hf-x', px + '%');
      el.style.setProperty('--hf-y', py + '%');
      el.style.setProperty('--hf-a', ang + 'deg');
      el.classList.add('holo-active');
    }
    function onLeave() { el.classList.remove('holo-active'); }
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
  }

  /* ---------- 9. Web Audio 程序化音效 ---------- */
  const GeekSFX = (function () {
    let ctx = null, master = null;
    let muted = localStorage.getItem('geek-sfx-muted') === '1';
    function ensure() {
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          master = ctx.createGain(); master.gain.value = 0.18;
          // Analyser 分支：用于 GL 音画同步
          try {
            const ana = ctx.createAnalyser();
            ana.fftSize = 256;
            const data = new Uint8Array(ana.frequencyBinCount);
            master.connect(ana);
            window.__wishAudioRMS = function () {
              ana.getByteTimeDomainData(data);
              let sum = 0;
              for (let i = 0; i < data.length; i++) {
                const v = (data[i] - 128) / 128;
                sum += v * v;
              }
              return Math.min(1, Math.sqrt(sum / data.length) * 4);
            };
          } catch (e) {}
          master.connect(ctx.destination);
        } catch (e) { ctx = null; }
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone({ freq = 440, dur = 0.25, type = 'sine', vol = 0.5, slide = 0, attack = 0.01, release = 0.15 }) {
      if (muted) return; if (!ensure()) return;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), ctx.currentTime + dur);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur + release);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + dur + release + 0.05);
    }
    function noise({ dur = 0.4, vol = 0.3, hp = 600, lp = 4000 }) {
      if (muted) return; if (!ensure()) return;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f1 = ctx.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = hp;
      const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp;
      const g = ctx.createGain(); g.gain.value = vol;
      src.connect(f1); f1.connect(f2); f2.connect(g); g.connect(master);
      src.start();
    }
    return {
      get muted() { return muted; },
      toggle() { muted = !muted; localStorage.setItem('geek-sfx-muted', muted ? '1' : '0'); },
      click() { tone({ freq: 720, dur: 0.04, type: 'square', vol: 0.18, release: 0.05 }); },
      whoosh() { noise({ dur: 0.55, vol: 0.22, hp: 200, lp: 3000 }); tone({ freq: 220, slide: -160, dur: 0.45, type: 'sawtooth', vol: 0.12, release: 0.25 }); },
      reveal3() { tone({ freq: 380, dur: 0.18, type: 'triangle', vol: 0.22 }); },
      reveal4() { [523, 659].forEach((f, i) => setTimeout(() => tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.26, release: 0.25 }), i * 60)); },
      reveal5() { [523, 659, 784].forEach((f, i) => setTimeout(() => tone({ freq: f, dur: 0.32, type: 'sine', vol: 0.3, release: 0.35 }), i * 70)); noise({ dur: 0.5, vol: 0.12, hp: 1500, lp: 6000 }); },
      reveal6() {
        [261, 392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone({ freq: f, dur: 0.55, type: 'sine', vol: 0.32, release: 0.6 }), i * 80));
        noise({ dur: 1.2, vol: 0.18, hp: 800, lp: 8000 });
        setTimeout(() => tone({ freq: 80, slide: -40, dur: 0.9, type: 'sawtooth', vol: 0.4, release: 0.6 }), 50);
      },
      glitch() { for (let i = 0; i < 6; i++) setTimeout(() => tone({ freq: 200 + Math.random() * 1500, dur: 0.04, type: 'square', vol: 0.16, release: 0.04 }), i * 35); },
      success() { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => tone({ freq: f, dur: 0.14, type: 'triangle', vol: 0.22 }), i * 70)); },
    };
  })();

  /* ---------- 10. 全局快捷键 ---------- */
  function bindKeys() {
    addEventListener('keydown', (e) => {
      // ⌘K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (cmdkMask && cmdkMask.classList.contains('open')) closeCmdK();
        else openCmdK();
      }
      // / 唤起
      else if (e.key === '/' && !/input|textarea/i.test(e.target.tagName) && !termOpen) {
        e.preventDefault(); openCmdK();
      }
      // Esc 关闭
      else if (e.key === 'Escape') {
        if (cmdkMask && cmdkMask.classList.contains('open')) closeCmdK();
      }
    });
  }

  /* ---------- 11. 公共 API ---------- */
  global.GeekLayer = {
    matrixRain, openTerminal, closeTerminal, openCmdK, closeCmdK,
    flash, attachHolo, asciiBoot, sfx: GeekSFX,
  };
  global.GeekSFX = GeekSFX;

  /* ---------- 12. 启动 ---------- */
  function init() {
    pageEnterReveal();
    asciiBoot();
    watchKonami();
    bindKeys();
    konamiHint();
    // 首次任意点击解锁 audio context
    addEventListener('pointerdown', () => GeekSFX.click(), { once: true, passive: true });
  }

  /* ---------- 13. 圆形入场遮罩 (reverse wipe) ---------- */
  function pageEnterReveal() {
    // 解析 URL ?from=x,y
    let x = innerWidth / 2, y = innerHeight / 2;
    const m = location.search.match(/[?&]from=(\d+),(\d+)/);
    if (m) { x = +m[1]; y = +m[2]; }

    const maxR = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
    const veil = document.createElement('div');
    veil.style.cssText =
      'position:fixed;inset:0;z-index:9500;pointer-events:none;background:#05060e;' +
      'will-change:clip-path;transition:clip-path 720ms cubic-bezier(.22,1,.36,1),opacity 280ms ease 480ms;' +
      'clip-path:circle(0px at ' + x + 'px ' + y + 'px);';
    // start: full cover; will reveal outward
    veil.style.clipPath = 'circle(' + maxR + 'px at ' + x + 'px ' + y + 'px)';
    document.body.appendChild(veil);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        veil.style.clipPath = 'circle(0px at ' + x + 'px ' + y + 'px)';
        veil.style.opacity = '0';
      });
    });
    setTimeout(() => veil.remove(), 1200);

    // 清掉 URL 上的 from 参数（不刷新历史）
    if (m && history.replaceState) {
      const u = location.pathname + location.search.replace(/[?&]from=\d+,\d+/, '').replace(/^\?$/, '') + location.hash;
      history.replaceState(null, '', u);
    }
  }
  global.GeekLayer.pageEnterReveal = pageEnterReveal;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
