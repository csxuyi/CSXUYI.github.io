/* ==========================================================================
   xLab · Wish Cinema
   全新四段式电影感抽卡演出 —— 不改原 JS 时序/逻辑，通过 MutationObserver
   监听 #stargate.activate 自动触发；同时屏蔽原本的星门/流星/光柱/闪光视觉。

   时序对齐 runWishAnimation：
     0    ms  stargate.activate   → 阶段 0：虚空吸入 (Void In)
     ~700 ms  meteor.fly          → 阶段 1：神圣几何 (Sacred Geometry)
     ~900 ms  pillar/flare (5★+)  → 阶段 1.5：仪式之光 (5★/6★ 才出现)
     ~2100ms  impact burst        → 阶段 2：奇点坍缩 + 阶段 3：超新星
     ~2400ms  cards 出现          → 自然交还控制权
   ========================================================================== */
(function(){
  'use strict';
  if(window.__cinemaInited) return;
  window.__cinemaInited = true;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------- 注入样式 ---------- */
  const style = document.createElement('style');
  style.textContent = `
    /* 屏蔽原始演出视觉（保留 DOM，让 JS 该改 className 还能改） */
    .stargate, .stargate-core, .stargate-ring,
    .meteor, .meteor-trail,
    .impact-flash, .shockwave,
    .light-pillar, .lens-flare, #fullscreen-flash{
      visibility:hidden !important;
    }
    .gold-drop{display:none !important}

    #cinema-stage{
      position:fixed;inset:0;z-index:50;pointer-events:none;
      contain:strict;overflow:hidden;
    }
    #cinema-stage.show{pointer-events:none}

    /* 阶段 0 · 虚空吸入：屏幕被向中心拉扯 + 真空黑场 */
    .cin-void{
      position:absolute;inset:0;opacity:0;
      background:radial-gradient(circle at 50% 50%,
        rgba(0,0,0,0.0) 0%,
        rgba(0,0,0,0.0) 30%,
        rgba(0,0,0,0.55) 65%,
        rgba(0,0,0,0.92) 100%);
      transition:opacity 720ms cubic-bezier(.55,0,.4,1);
    }
    .cin-void.on{opacity:1}

    .cin-suction{
      position:absolute;left:50%;top:50%;width:240vmax;height:240vmax;
      transform:translate(-50%,-50%) rotate(0deg) scale(1);
      opacity:0;
      background:
        repeating-conic-gradient(from 0deg at 50% 50%,
          rgba(255,232,180,0.0) 0deg,
          rgba(255,232,180,0.0) 4.5deg,
          rgba(255,232,180,0.18) 5deg,
          rgba(255,232,180,0.0) 5.5deg,
          rgba(255,232,180,0.0) 11deg);
      mix-blend-mode:screen;
      filter:blur(2px);
      will-change:transform,opacity;
    }
    .cin-suction.on{
      animation:cin-suct 1100ms cubic-bezier(.55,0,.35,1) forwards;
    }
    @keyframes cin-suct{
      0%   {transform:translate(-50%,-50%) rotate(0deg)   scale(1);   opacity:0}
      35%  {opacity:.85}
      100% {transform:translate(-50%,-50%) rotate(140deg) scale(.18); opacity:0}
    }

    /* 中心黑洞 — 在虚空尽头吞噬一切 */
    .cin-singularity{
      position:absolute;left:50%;top:50%;width:6px;height:6px;
      margin-left:-3px;margin-top:-3px;border-radius:50%;
      background:#000;
      box-shadow:
        0 0 0 0 rgba(255,232,180,0),
        0 0 0 0 rgba(212,184,122,0);
      opacity:0;transform:scale(0);
      transition:transform 600ms cubic-bezier(.5,0,.3,1),opacity 280ms ease,box-shadow 600ms ease;
    }
    .cin-singularity.on{
      opacity:1;transform:scale(1);
      box-shadow:
        0 0 60px 12px rgba(255,232,180,.8),
        0 0 160px 30px rgba(212,184,122,.5),
        0 0 320px 80px rgba(176,143,255,.25);
    }
    .cin-singularity.collapse{
      animation:cin-collapse 600ms cubic-bezier(.55,0,.25,1) forwards;
    }
    @keyframes cin-collapse{
      0%   {transform:scale(1)}
      40%  {transform:scale(.4);box-shadow:0 0 80px 18px rgba(255,232,180,1),0 0 220px 50px rgba(212,184,122,.65)}
      100% {transform:scale(.05);box-shadow:0 0 4px 2px rgba(255,232,180,.4)}
    }

    /* 阶段 1 · 神圣几何：SVG 仪式圆，多层旋转、缩放、glow */
    .cin-glyph{
      position:absolute;left:50%;top:50%;
      width:min(90vmin,820px);height:min(90vmin,820px);
      transform:translate(-50%,-50%) scale(0.2) rotate(0deg);
      opacity:0;
      filter:drop-shadow(0 0 30px rgba(212,184,122,.55))
             drop-shadow(0 0 80px rgba(212,184,122,.35));
      mix-blend-mode:screen;
      transition:opacity 380ms ease;
    }
    .cin-glyph.on{
      opacity:1;
      animation:cin-glyph-in 1200ms cubic-bezier(.18,.9,.2,1) forwards;
    }
    @keyframes cin-glyph-in{
      0%   {transform:translate(-50%,-50%) scale(0.15) rotate(-90deg)}
      100% {transform:translate(-50%,-50%) scale(1)    rotate(0deg)}
    }
    .cin-glyph .ring{
      transform-origin:50% 50%;
      animation:cin-ring-rot 18s linear infinite;
    }
    .cin-glyph .ring.r2{animation-duration:24s;animation-direction:reverse}
    .cin-glyph .ring.r3{animation-duration:14s}
    .cin-glyph .ring.r4{animation-duration:36s;animation-direction:reverse}
    @keyframes cin-ring-rot{to{transform:rotate(360deg)}}

    /* 仪式圆的稀有度调色 */
    .cin-glyph[data-tier="3"]{filter:drop-shadow(0 0 22px rgba(120,170,210,.55)) drop-shadow(0 0 60px rgba(120,170,210,.3))}
    .cin-glyph[data-tier="4"]{filter:drop-shadow(0 0 26px rgba(176,143,255,.6))  drop-shadow(0 0 70px rgba(176,143,255,.35))}
    .cin-glyph[data-tier="5"]{filter:drop-shadow(0 0 34px rgba(255,212,120,.7))  drop-shadow(0 0 90px rgba(255,200,90,.45))}
    .cin-glyph[data-tier="6"]{filter:drop-shadow(0 0 40px rgba(255,184,198,.8))  drop-shadow(0 0 110px rgba(255,180,200,.5))}

    /* 阶段 1.5 · 仪式之光（5★/6★） */
    .cin-altar{
      position:absolute;left:50%;top:50%;
      width:60vmin;height:60vmin;
      transform:translate(-50%,-50%) scale(0.6);
      opacity:0;
      background:
        radial-gradient(circle at 50% 50%,
          rgba(255,240,200,.65) 0%,
          rgba(255,212,120,.35) 22%,
          rgba(255,180,80,.18) 42%,
          rgba(176,143,255,.10) 60%,
          transparent 78%);
      mix-blend-mode:screen;filter:blur(.5px);
      transition:opacity 400ms ease,transform 800ms cubic-bezier(.18,.9,.2,1);
    }
    .cin-altar.on{opacity:1;transform:translate(-50%,-50%) scale(1.4)}
    .cin-altar[data-tier="6"]{
      background:
        radial-gradient(circle at 50% 50%,
          rgba(255,255,255,.75) 0%,
          rgba(255,200,210,.55) 18%,
          rgba(255,160,200,.30) 38%,
          rgba(180,90,180,.18) 58%,
          transparent 78%);
    }

    /* 上升火星粒子（CSS-only，多个 ::before 假装） */
    .cin-embers{
      position:absolute;left:50%;top:50%;
      width:600px;height:600px;margin:-300px 0 0 -300px;
      pointer-events:none;opacity:0;
      transition:opacity 280ms ease;
    }
    .cin-embers.on{opacity:1}
    .cin-ember{
      position:absolute;width:3px;height:3px;border-radius:50%;
      background:#ffe7a8;
      box-shadow:0 0 6px 1px rgba(255,232,168,.85),0 0 16px 4px rgba(255,180,80,.45);
      animation:cin-ember-rise 2.4s linear infinite;
      will-change:transform,opacity;
    }
    @keyframes cin-ember-rise{
      0%   {transform:translate(0,200px) scale(.6);opacity:0}
      10%  {opacity:1}
      100% {transform:translate(0,-300px) scale(1.1);opacity:0}
    }

    /* 阶段 2 · 奇点坍缩 — 全屏径向收缩条带 */
    .cin-collapse-bands{
      position:absolute;inset:0;opacity:0;mix-blend-mode:screen;
      background:
        repeating-radial-gradient(circle at 50% 50%,
          rgba(255,255,255,0.0) 0px,
          rgba(255,255,255,0.0) 14px,
          rgba(255,232,180,0.42) 15px,
          rgba(255,255,255,0.0) 16px);
      transform:scale(2.4);
      filter:blur(1.5px);
    }
    .cin-collapse-bands.on{
      animation:cin-bands 380ms cubic-bezier(.55,0,.2,1) forwards;
    }
    @keyframes cin-bands{
      0%   {opacity:0;transform:scale(2.4)}
      40%  {opacity:1}
      100% {opacity:0;transform:scale(0.05)}
    }

    /* 阶段 3 · 超新星爆发 — 多层冲击波 */
    .cin-nova{
      position:absolute;left:50%;top:50%;border-radius:50%;
      transform:translate(-50%,-50%) scale(0);opacity:0;
      pointer-events:none;mix-blend-mode:screen;
    }
    .cin-nova.flash{
      width:30vmin;height:30vmin;
      background:radial-gradient(circle,
        rgba(255,255,255,1) 0%,
        rgba(255,240,200,.85) 18%,
        rgba(255,200,120,.5) 35%,
        rgba(176,143,255,.18) 60%,
        transparent 80%);
      animation:cin-nova-flash 900ms cubic-bezier(.16,.8,.22,1) forwards;
      filter:blur(.5px);
    }
    .cin-nova.ring1{
      width:40vmin;height:40vmin;border:2px solid rgba(255,232,180,.9);
      box-shadow:0 0 40px rgba(255,232,180,.7),inset 0 0 30px rgba(255,232,180,.4);
      animation:cin-nova-ring 1100ms cubic-bezier(.16,.8,.22,1) forwards;
    }
    .cin-nova.ring2{
      width:40vmin;height:40vmin;border:1.5px solid rgba(176,143,255,.8);
      box-shadow:0 0 30px rgba(176,143,255,.6);
      animation:cin-nova-ring 1300ms cubic-bezier(.16,.8,.22,1) 80ms forwards;
    }
    .cin-nova.ring3{
      width:40vmin;height:40vmin;border:1px solid rgba(255,184,198,.7);
      box-shadow:0 0 28px rgba(255,184,198,.55);
      animation:cin-nova-ring 1500ms cubic-bezier(.16,.8,.22,1) 160ms forwards;
    }
    @keyframes cin-nova-flash{
      0%   {opacity:0;transform:translate(-50%,-50%) scale(0.05)}
      18%  {opacity:1;transform:translate(-50%,-50%) scale(1.4)}
      100% {opacity:0;transform:translate(-50%,-50%) scale(2.4);filter:blur(8px)}
    }
    @keyframes cin-nova-ring{
      0%   {opacity:0;transform:translate(-50%,-50%) scale(0)}
      14%  {opacity:1}
      100% {opacity:0;transform:translate(-50%,-50%) scale(7)}
    }

    /* 全屏 god-rays（5★/6★） */
    .cin-rays{
      position:absolute;inset:-10%;opacity:0;mix-blend-mode:screen;
      background:
        repeating-conic-gradient(from 0deg at 50% 50%,
          rgba(255,232,180,0.0)  0deg,
          rgba(255,232,180,0.0)  6deg,
          rgba(255,232,180,0.18) 7deg,
          rgba(255,232,180,0.0)  8deg,
          rgba(255,232,180,0.0)  16deg);
      filter:blur(1px);
      transform-origin:50% 50%;
    }
    .cin-rays.on{
      animation:cin-rays 1500ms cubic-bezier(.18,.9,.2,1) forwards;
    }
    @keyframes cin-rays{
      0%   {opacity:0;transform:rotate(-30deg) scale(.6)}
      30%  {opacity:.9}
      100% {opacity:0;transform:rotate(40deg)  scale(1.4)}
    }

    /* 抖动 / 焦散 — 给 #app 用 */
    @keyframes cin-shake-soft{
      0%,100%{transform:translate(0,0)}
      25%{transform:translate(-3px,2px)}
      50%{transform:translate(2px,-3px)}
      75%{transform:translate(-1px,1px)}
    }
    @keyframes cin-shake-hard{
      0%,100%{transform:translate(0,0)}
      10%{transform:translate(-10px,5px)}
      25%{transform:translate(8px,-7px)}
      40%{transform:translate(-6px,9px)}
      55%{transform:translate(11px,3px)}
      70%{transform:translate(-7px,-5px)}
      85%{transform:translate(5px,4px)}
    }
    #app.cin-shake-soft{animation:cin-shake-soft .35s ease}
    #app.cin-shake-hard{animation:cin-shake-hard .55s cubic-bezier(.36,.07,.19,.97)}

    /* 局部色散（chromatic aberration）overlay —— 在最后撞击瞬间 */
    .cin-chroma{
      position:absolute;inset:0;mix-blend-mode:screen;opacity:0;
      background:
        radial-gradient(circle at 49% 50%, rgba(255,80,80,.0) 0%, rgba(255,80,80,.16) 60%, transparent 75%),
        radial-gradient(circle at 51% 50%, rgba(80,180,255,.0) 0%, rgba(80,180,255,.14) 60%, transparent 75%);
    }
    .cin-chroma.on{animation:cin-chroma .7s cubic-bezier(.22,1,.36,1) forwards}
    @keyframes cin-chroma{
      0%{opacity:0}
      30%{opacity:1}
      100%{opacity:0}
    }

    /* 6★ 专属：屏幕 RGB 切片错位 */
    .cin-glitch-slice{
      position:absolute;inset:0;pointer-events:none;opacity:0;mix-blend-mode:screen;
      background:
        repeating-linear-gradient(0deg,
          rgba(255,80,80,.0) 0px,
          rgba(255,80,80,.0) 8px,
          rgba(255,80,80,.18) 9px,
          rgba(60,180,255,.18) 10px,
          rgba(255,80,80,.0) 11px);
    }
    .cin-glitch-slice.on{animation:cin-glitch-slice 700ms steps(14) forwards}
    @keyframes cin-glitch-slice{
      0%,100%{opacity:0;transform:translateX(0)}
      20%{opacity:.9;transform:translateX(-12px)}
      45%{opacity:.6;transform:translateX(14px)}
      70%{opacity:.8;transform:translateX(-6px)}
    }
  `;
  document.head.appendChild(style);

  /* ---------- 构建固定演出舞台 ---------- */
  function buildStage(){
    const stage = document.createElement('div');
    stage.id = 'cinema-stage';
    stage.innerHTML = `
      <div class="cin-void"></div>
      <div class="cin-suction"></div>
      <div class="cin-rays"></div>
      ${buildGlyphSVG()}
      <div class="cin-altar"></div>
      <div class="cin-embers">${Array.from({length:24},(_,i)=>{
        const x = (Math.random()*600-300)|0;
        const dur = (1.6 + Math.random()*1.6).toFixed(2);
        const delay = (Math.random()*2.4).toFixed(2);
        const sz = 2 + Math.random()*3;
        return `<span class="cin-ember" style="left:${300+x}px;width:${sz}px;height:${sz}px;animation-duration:${dur}s;animation-delay:${delay}s"></span>`;
      }).join('')}</div>
      <div class="cin-collapse-bands"></div>
      <div class="cin-singularity"></div>
      <div class="cin-nova flash"></div>
      <div class="cin-nova ring1"></div>
      <div class="cin-nova ring2"></div>
      <div class="cin-nova ring3"></div>
      <div class="cin-chroma"></div>
      <div class="cin-glitch-slice"></div>
    `;
    document.body.appendChild(stage);
    return stage;
  }

  /* SVG 神圣几何 — 多层符文环 */
  function buildGlyphSVG(){
    // 12 边形顶点（构造星形 / 多边形 / 符文圈）
    const N = 12;
    const pts = [];
    for(let i=0;i<N;i++){
      const a = -Math.PI/2 + i*Math.PI*2/N;
      pts.push([200 + Math.cos(a)*180, 200 + Math.sin(a)*180]);
    }
    // 星形连线（每隔 5 个）
    let starPath = 'M ';
    let idx = 0;
    for(let i=0;i<=N;i++){
      const p = pts[idx % N];
      starPath += p[0].toFixed(1)+','+p[1].toFixed(1) + (i===N?'':' L ');
      idx += 5;
    }
    // 等距小圆
    const dotsR1 = pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor"/>`).join('');
    // 内圈 6 边形顶点
    const innerPts = [];
    for(let i=0;i<6;i++){
      const a = -Math.PI/2 + i*Math.PI*2/6;
      innerPts.push([200+Math.cos(a)*100,200+Math.sin(a)*100]);
    }
    const innerHex = 'M ' + innerPts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L ') + ' Z';
    // 内三角（同 6 边形隔点连线 = 六芒星）
    const triA = [innerPts[0],innerPts[2],innerPts[4],innerPts[0]];
    const triB = [innerPts[1],innerPts[3],innerPts[5],innerPts[1]];
    const triPathA = 'M '+triA.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L ');
    const triPathB = 'M '+triB.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L ');
    // 外圈大圆 + 内圈
    return `
      <svg class="cin-glyph" viewBox="0 0 400 400" id="cin-glyph" data-tier="3" xmlns="${SVG_NS}" color="#F5E6CC" aria-hidden="true">
        <g class="ring r1">
          <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" stroke-width="1" opacity=".75"/>
          <circle cx="200" cy="200" r="170" fill="none" stroke="currentColor" stroke-width=".6" opacity=".5"/>
          ${dotsR1}
        </g>
        <g class="ring r2" opacity=".95">
          <path d="${starPath}" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".8"/>
          <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" stroke-width=".5" opacity=".4" stroke-dasharray="2 6"/>
        </g>
        <g class="ring r3">
          <path d="${innerHex} Z" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".95"/>
          <path d="${triPathA} Z" fill="none" stroke="currentColor" stroke-width=".9" opacity=".7"/>
          <path d="${triPathB} Z" fill="none" stroke="currentColor" stroke-width=".9" opacity=".7"/>
          <circle cx="200" cy="200" r="70" fill="none" stroke="currentColor" stroke-width=".6" opacity=".55"/>
          <circle cx="200" cy="200" r="50" fill="none" stroke="currentColor" stroke-width=".45" opacity=".4" stroke-dasharray="1 3"/>
        </g>
        <g class="ring r4" opacity=".85">
          <circle cx="200" cy="200" r="30" fill="none" stroke="currentColor" stroke-width=".7" opacity=".6"/>
          <circle cx="200" cy="200" r="14" fill="currentColor" opacity=".18"/>
          <circle cx="200" cy="200" r="4"  fill="currentColor" opacity=".95"/>
        </g>
      </svg>`;
  }

  let stage = null;
  let app = null;

  function ensure(){
    if(!stage) stage = buildStage();
    if(!app)   app   = document.getElementById('app');
    return stage;
  }

  /* ---------- 6★ 伪 stack-trace 字幕 ---------- */
  const TRACE_LINES = [
    "[fatal] reality::stability dropped below threshold",
    "  at Universe.maintain(consts/laws.rs:42:11)",
    "  at Cosmos.handle(events/wish.rs:1280:7)",
    "[warn]  god-class hot-loaded, ABI mismatch",
    "[info]  injecting CREATOR_GOD into pool[6]",
    "  at gacha::roll(rates.rs:NaN:NaN)",
    "[ok]    metaphysics.lock released",
    "[err]   probability == 0, see issue #233",
    "  -> spawned anyway. user is too lucky.",
    "[trace] dumping divinity_buffer ...",
    "        0xFFF... 0xDEA... 0xDBE... 0xEEF",
    "[!]     6★ acquired. world will not be the same.",
  ];
  let traceEl = null;
  function showGodTrace(){
    if(!traceEl){
      traceEl = document.createElement('pre');
      traceEl.id = 'cin-god-trace';
      traceEl.style.cssText =
        'position:fixed;left:6vw;bottom:14vh;z-index:9300;pointer-events:none;'+
        'font-family:"JetBrains Mono","SF Mono",ui-monospace,monospace;'+
        'font-size:.78rem;line-height:1.5;letter-spacing:.04em;'+
        'color:#ffd66b;text-shadow:0 0 12px rgba(255,200,80,.65),0 0 28px rgba(255,180,80,.4);'+
        'opacity:0;transition:opacity 280ms ease;'+
        'mix-blend-mode:screen;white-space:pre;max-width:88vw';
      document.body.appendChild(traceEl);
    }
    traceEl.textContent = '';
    traceEl.style.opacity = '0';
    requestAnimationFrame(()=> traceEl.style.opacity = '1');
    let i = 0;
    function step(){
      if(!traceEl) return;
      if(i < TRACE_LINES.length){
        const ln = TRACE_LINES[i];
        traceEl.textContent += (i ? '\n' : '') + ln;
        i++;
        setTimeout(step, 180 + Math.random()*120);
      } else {
        setTimeout(()=>{
          if(traceEl) traceEl.style.opacity = '0';
        }, 1400);
      }
    }
    step();
  }
  function hideGodTrace(){
    if(traceEl){ traceEl.style.opacity = '0'; }
  }

  /* ---------- 十连流星轰炸 ---------- */
  function spawnMeteorSwarm(count, tier){
    // 用 CSS keyframe 扫过多道流星
    const swarm = document.createElement('div');
    swarm.className = 'cin-meteor-swarm';
    swarm.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:52';
    const tierColors = {3:'rgba(120,170,210,.8)',4:'rgba(176,143,255,.85)',5:'rgba(255,212,120,.9)',6:'rgba(255,184,198,.95)'};
    const col = tierColors[tier] || tierColors[5];
    let html = '';
    for(let i=0;i<count;i++){
      const sx = -20 + Math.random()*40;
      const sy = Math.random()*60;
      const dur = 1.2 + Math.random()*1.4;
      const delay = Math.random()*0.9;
      html += `<span class="cin-swarm-meteor" style="
        left:${sx}%;top:${sy}%;animation-duration:${dur}s;animation-delay:${delay}s;
        background:linear-gradient(90deg,transparent,${col},rgba(255,255,255,.9));
        box-shadow:0 0 12px 2px ${col}"></span>`;
    }
    swarm.innerHTML = html;
    // Inject style once
    if(!document.getElementById('cin-swarm-style')){
      const st = document.createElement('style');
      st.id = 'cin-swarm-style';
      st.textContent = `
        .cin-swarm-meteor{
          position:absolute;width:140px;height:2px;border-radius:2px;
          pointer-events:none;mix-blend-mode:screen;
          animation:cin-swarm-fly linear forwards;
          transform-origin:0 50%;
        }
        @keyframes cin-swarm-fly{
          0%   {transform:scaleX(0.3) translate(0,0)    rotate(-35deg);opacity:0}
          12%  {opacity:1}
          100% {transform:scaleX(1.6) translate(110vw,30vh) rotate(-35deg);opacity:0}
        }
      `;
      document.head.appendChild(st);
    }
    stage.appendChild(swarm);
    setTimeout(()=>swarm.remove(), 2800);
  }

  /* ---------- 演出主流程 ---------- */
  function play(maxR){
    ensure();
    const tier = String(maxR);
    const isHigh = maxR >= 5;
    const isGod  = maxR === 6;

    const $ = (s) => stage.querySelector(s);
    const reset = (sel) => { const el = $(sel); if(!el) return; el.classList.remove('on','collapse','flash'); void el.offsetWidth; return el; };

    // 重置所有图层
    ['.cin-void','.cin-suction','.cin-glyph','.cin-altar','.cin-embers',
     '.cin-collapse-bands','.cin-singularity','.cin-rays','.cin-chroma','.cin-glitch-slice',
     '.cin-nova.flash','.cin-nova.ring1','.cin-nova.ring2','.cin-nova.ring3'
    ].forEach(reset);

    const glyph = $('#cin-glyph'); if(glyph) glyph.dataset.tier = tier;
    const altar = $('.cin-altar'); if(altar) altar.dataset.tier = tier;

    // 阶段 0 · 虚空吸入 (0 ~ 700 ms) -----------------------------
    setTimeout(()=>{ $('.cin-void').classList.add('on'); }, 20);
    setTimeout(()=>{ $('.cin-suction').classList.add('on'); }, 60);

    // [C3] 十连流星轰炸检测
    const deck = document.getElementById('cardDeck');
    const isMulti = deck && deck.classList.contains('multi');
    if(isMulti){
      setTimeout(()=>spawnMeteorSwarm(8+Math.floor(Math.random()*6), maxR), 200);
    }

    // 奇点点亮（700ms）—— 流星即将抵达
    setTimeout(()=>{
      const sg = $('.cin-singularity');
      sg.classList.add('on');
    }, 700);

    // 阶段 1 · 神圣几何 (700 ~ 1900 ms) --------------------------
    setTimeout(()=>{
      $('.cin-glyph').classList.add('on');
    }, 750);
    // 5★/6★ 出火星与圣坛光
    if(isHigh){
      setTimeout(()=>{
        $('.cin-altar').classList.add('on');
        $('.cin-embers').classList.add('on');
        $('.cin-rays').classList.add('on');
      }, 950);
    }
    // 缓速抖动作为持续张力
    setTimeout(()=>{
      if(app){ app.classList.remove('cin-shake-soft'); void app.offsetWidth; app.classList.add('cin-shake-soft'); }
    }, 1500);

    // 阶段 2 · 奇点坍缩 (~1900 ~ 2100 ms) ------------------------
    setTimeout(()=>{
      $('.cin-collapse-bands').classList.add('on');
      $('.cin-singularity').classList.add('collapse');
    }, 1900);

    // 阶段 3 · 超新星爆发 (2100 ms) ------------------------------
    setTimeout(()=>{
      $('.cin-nova.flash').classList.add('on');
      if(isHigh){
        $('.cin-nova.ring1').classList.add('on');
        $('.cin-nova.ring2').classList.add('on');
      }
      if(isGod){
        $('.cin-nova.ring3').classList.add('on');
        $('.cin-glitch-slice').classList.add('on');
        showGodTrace();
      }
      $('.cin-chroma').classList.add('on');
      // 抖屏：6★ 大震；5★ 中震；其余原生 .shake 已被 JS 触发
      if(app){
        app.classList.remove('cin-shake-soft','cin-shake-hard'); void app.offsetWidth;
        app.classList.add(isGod ? 'cin-shake-hard' : isHigh ? 'cin-shake-hard' : 'cin-shake-soft');
      }
      // 黑场逐步散开
      $('.cin-void').classList.remove('on');
    }, 2100);

    // 在 2400 ms 时 cardDeck 接管，演出层主动让位
    setTimeout(()=>{
      // 不强制隐藏奇点附近的 nova（让它继续衰减），但移除可能阻挡的图层
      const v = $('.cin-void'); if(v) v.style.opacity = '0';
    }, 2350);

    // [BUGFIX] 演出彻底结束：清掉所有图层的 on / collapse / flash —— 防止"星星阵"残留
    setTimeout(()=>{
      stage.querySelectorAll('.on,.collapse,.flash').forEach(el=>{
        el.classList.remove('on','collapse','flash');
      });
      const v = $('.cin-void'); if(v) v.style.opacity = '';
      if(app){ app.classList.remove('cin-shake-soft','cin-shake-hard'); }
      hideGodTrace();
    }, 3200);

    // [GL 接线] 把演出脉冲推送到 WebGL 特效层
    if(window.WishGL && window.WishGL.pulse){
      // 阶段 0 吸入
      window.WishGL.pulse({ phase:'suck',     intensity:0.35, until:1900 });
      // 阶段 2 坍缩
      setTimeout(()=>window.WishGL.pulse({ phase:'collapse', intensity:0.85, until:300 }), 1900);
      // 阶段 3 超新星
      setTimeout(()=>window.WishGL.pulse({ phase:'nova',
        intensity: isGod?1.2 : isHigh?0.95 : 0.6, until:1100, tier:maxR }), 2100);
    }
  }

  /* ---------- 通过 MutationObserver 钩入 ---------- */
  function hook(){
    const sg = document.getElementById('stargate');
    if(!sg){ return setTimeout(hook, 200); }
    const obs = new MutationObserver(()=>{
      if(!sg.classList.contains('activate')) return;
      // 当前抽卡的最高稀有度从 meteor className 解析
      const m = document.getElementById('meteor');
      let maxR = 3;
      if(m){
        const cls = m.className || '';
        const mm = cls.match(/streak-(\d)/);
        if(mm) maxR = parseInt(mm[1],10) || 3;
      }
      play(maxR);
    });
    obs.observe(sg, { attributes:true, attributeFilter:['class'] });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook);
  else hook();
})();
