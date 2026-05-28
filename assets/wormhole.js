/* ==========================================================================
   xLab · Wormhole Transition (A1)
   黑洞坍缩 → 虫洞穿越 → 白洞重生
   ========================================================================== */
(function () {
  'use strict';
  if (window.__wormholeInited) return;
  window.__wormholeInited = true;

  function compile(gl, t, s) {
    const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(sh));
    return sh;
  }

  const FRAG = `
    precision highp float;
    uniform vec2  uRes;
    uniform float uT;
    uniform float uProg;
    uniform vec2  uOrigin;

    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}

    void main(){
      vec2 uv = (gl_FragCoord.xy - uOrigin)/min(uRes.x,uRes.y);
      float r = length(uv) + 0.0001;
      float a = atan(uv.y, uv.x);

      float twist = uT*1.6 - log(r+0.04)*4.0;
      float bands = sin(a*6.0 + twist*3.0);
      bands += sin(a*12.0 - twist*4.5)*0.6;
      bands = 0.5 + 0.5*bands;

      float strands = 0.0;
      for(int i=0;i<5;i++){
        float fi = float(i);
        float ti = uT*1.2 + fi*0.7;
        float ph = sin(a*(8.0+fi*3.0) + ti - log(r+0.05)*5.0);
        strands += smoothstep(0.6, 1.0, ph) * exp(-r*1.0);
      }

      float flow = fract(log(r+0.04)*2.5 - uT*1.4);
      float flowMask = smoothstep(0.45, 0.6, flow) - smoothstep(0.6, 0.75, flow);

      float core = exp(-r*r*16.0);

      vec3 cGold   = vec3(1.0, 0.78, 0.32);
      vec3 cMagent = vec3(0.78, 0.32, 0.92);
      vec3 cBlue   = vec3(0.30, 0.55, 1.00);
      vec3 colInner = mix(cGold, cMagent, smoothstep(0.05, 0.4, r));
      vec3 colOuter = mix(cMagent, cBlue, smoothstep(0.4, 1.2, r));
      vec3 base = mix(colInner, colOuter, smoothstep(0.0, 0.6, r));

      vec3 col = vec3(0.0);
      col += base * bands   * 0.22;
      col += base * strands * 0.40;
      col += base * flowMask * 0.28;

      // [亮度降低] core 亮度 -60%
      col += vec3(1.0) * core * (0.12 + uProg*0.22);

      col += (hash(gl_FragCoord.xy + uT) - 0.4) * 0.03;

      // [亮度降低] 暗场范围 0.20..0.60
      float darken = 1.0 - smoothstep(0.0, 0.65, uProg);
      col *= mix(0.14, 0.45, darken);

      // [亮度降低] 终末暖暗
      if (uProg > 0.7){
        float white = smoothstep(0.7, 1.0, uProg);
        col = mix(col, vec3(0.70, 0.66, 0.56), white * smoothstep(0.0, 1.5, 1.0 - r*(1.0 - white)));
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function start(href, x, y, sourceEl) {
    if (sourceEl && window.GeekSFX) GeekSFX.whoosh();

    const hero = document.querySelector('.hero');
    const ftr  = document.querySelector('.footer');
    const vig  = document.querySelector('.vignette');
    if (sourceEl) {
      const r = sourceEl.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top  + r.height / 2);
      sourceEl.style.transition = 'transform 520ms cubic-bezier(.5,0,.25,1), opacity 520ms ease, filter 520ms ease';
      sourceEl.style.transformOrigin = (x - r.left) + 'px ' + (y - r.top) + 'px';
      sourceEl.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0.05)';
      sourceEl.style.opacity = '0';
      // [亮度降低] brightness 2.5 → 1.0
      sourceEl.style.filter = 'blur(6px) brightness(1.0)';
    }
    if (hero) {
      hero.style.transition = 'opacity 520ms ease, filter 520ms ease, transform 520ms cubic-bezier(.5,0,.25,1)';
      hero.style.transformOrigin = x + 'px ' + y + 'px';
      hero.style.opacity = '0.0';
      hero.style.filter = 'blur(8px)';
      hero.style.transform = 'scale(0.92)';
    }
    if (ftr) { ftr.style.transition = 'opacity 320ms ease'; ftr.style.opacity = '0'; }
    if (vig) { vig.style.transition = 'opacity 320ms ease'; vig.style.opacity = '0'; }

    const c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:0;transition:opacity 280ms ease';
    document.body.appendChild(c);
    const gl = c.getContext('webgl', { antialias:false }) || c.getContext('experimental-webgl');
    if (!gl) {
      setTimeout(() => fallback(href, x, y), 400);
      return;
    }
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    function size() {
      c.width = innerWidth * dpr; c.height = innerHeight * dpr;
      c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
      gl.viewport(0, 0, c.width, c.height);
    }
    size();

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aP = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uT   = gl.getUniformLocation(prog, 'uT');
    const uPr  = gl.getUniformLocation(prog, 'uProg');
    const uOg  = gl.getUniformLocation(prog, 'uOrigin');

    requestAnimationFrame(() => { c.style.opacity = '1'; });

    const startTime = performance.now();
    const DUR = 1100;
    const NAVIGATE_AT = 0.92;
    let navigated = false;

    function loop(t) {
      const dt = (t - startTime) / 1000;
      const p = Math.min((t - startTime) / DUR, 1);
      gl.uniform2f(uRes, c.width, c.height);
      gl.uniform1f(uT, dt);
      gl.uniform1f(uPr, p);
      gl.uniform2f(uOg, x * dpr, c.height - y * dpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!navigated && p >= NAVIGATE_AT) {
        navigated = true;
        const sep = href.indexOf('?') >= 0 ? '&' : '?';
        location.href = href + sep + 'from=' + Math.round(x) + ',' + Math.round(y);
        return;
      }
      if (p < 1) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    if (window.__warpBoost) {
      let pulse = 0;
      const id = setInterval(() => {
        pulse = Math.min(1.6, pulse + 0.12);
        if (window.__warpBoost) window.__warpBoost(pulse);
      }, 50);
      setTimeout(() => clearInterval(id), DUR);
    }
  }

  function fallback(href, x, y) {
    const sep = href.indexOf('?') >= 0 ? '&' : '?';
    location.href = href + sep + 'from=' + Math.round(x) + ',' + Math.round(y);
  }

  function intercept() {
    document.querySelectorAll('.portal').forEach(function (link) {
      const fresh = link.cloneNode(true);
      link.parentNode.replaceChild(fresh, link);
      fresh.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const href = fresh.getAttribute('href');
        if (!href) {
          if (typeof openGuestbook === 'function') openGuestbook();
          return;
        }
        const r = fresh.getBoundingClientRect();
        const cx = e.clientX || (r.left + r.width / 2);
        const cy = e.clientY || (r.top  + r.height / 2);
        start(href, cx, cy, fresh);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', intercept);
  } else {
    intercept();
  }

  window.XLabWormhole = { start };
})();
