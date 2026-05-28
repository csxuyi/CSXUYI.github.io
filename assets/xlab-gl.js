/* ==========================================================================
   xLab · Universal GL Engine
   通用 WebGL 背景：紫金/玫瑰金/暖橙/冷蓝 等多种 tier 配色
   API:
     XLabGL.boot({ tier:[r,g,b], intensity:0..1, target:'before-body' })
       → { pulse(v), setTier(rgb), destroy() }
   ========================================================================== */
(function (global) {
  'use strict';
  if (global.XLabGL) return;

  const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }';

  // tier: 主色 RGB（用于星云 mid 段 + 演出脉冲染色）
  // accent: 副色（fbm 高密度区）
  // base: 底色（最深处）
  const PRESETS = {
    'aurum-violet': { tier:[1.00,0.82,0.40], accent:[0.50,0.20,0.62], base:[0.018,0.025,0.060], hue:'cool' }, // wish 紫金
    'rose-gold':    { tier:[1.00,0.55,0.55], accent:[0.65,0.18,0.30], base:[0.040,0.012,0.020], hue:'warm' }, // cards 玫瑰金（备用）
    'ember-orange': { tier:[1.00,0.62,0.30], accent:[0.85,0.30,0.10], base:[0.060,0.030,0.010], hue:'warm' }, // daily 暖橙
    'cobalt-cyan':  { tier:[0.40,0.78,1.00], accent:[0.18,0.40,0.85], base:[0.010,0.022,0.045], hue:'cool' },
    'mint-gold':    { tier:[0.40,0.92,0.78], accent:[0.08,0.60,0.50], base:[0.005,0.028,0.024], hue:'fresh' }  // stats 冷蓝
  };

  const FRAG = `
    precision highp float;
    uniform vec2  uRes;
    uniform float uT;
    uniform vec2  uMouse;
    uniform float uMouseAmp;
    uniform float uPulse;
    uniform vec3  uTier;
    uniform vec3  uAccent;
    uniform vec3  uBase;

    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
      vec2 u=f*f*(3.-2.*f);
      return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
    }
    float fbm(vec2 p){
      float v=0., a=0.5;
      for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.05; a*=0.5; }
      return v;
    }
    vec2 vor(vec2 p){
      vec2 ip=floor(p), fp=fract(p);
      float md=8.; vec2 mn=vec2(0.);
      for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
        vec2 g=vec2(float(i),float(j));
        vec2 o=vec2(hash(ip+g),hash(ip+g+17.));
        vec2 r=g+o-fp;
        float d=dot(r,r);
        if(d<md){ md=d; mn=g+o; }
      }
      return vec2(md, hash(ip+mn));
    }

    void main(){
      vec2 uv=(gl_FragCoord.xy - 0.5*uRes)/min(uRes.x,uRes.y);
      vec2 m =(uMouse*uRes - 0.5*uRes)/min(uRes.x,uRes.y);
      vec2 toM=uv-m; float dM=length(toM)+0.001;

      float r=length(uv)+0.001;
      vec2  dir=uv/r;
      float pull=0.10/(r*r+0.5);
      vec2  lens=-dir*pull;
      float pullM=(0.16*uMouseAmp)/(dM*dM+0.16);
      vec2  lensM=-(toM/dM)*pullM;
      float swirl=0.55/(r*r+0.7);
      vec2  tang=vec2(-dir.y,dir.x)*swirl*0.30;

      float t=uT*0.05;
      vec2  wuv=uv + lens + lensM + tang*0.45;

      vec2 q=vec2(fbm(wuv*1.6+vec2(0.,t)), fbm(wuv*1.6+vec2(5.2,-t)));
      vec2 s=vec2(fbm(wuv*2.4 + 4.0*q + vec2(1.7,9.2)+t),
                  fbm(wuv*2.4 + 4.0*q + vec2(8.3,2.8)-t));
      float n=fbm(wuv*2.0 + 2.6*s + uPulse*0.6);

      vec3 cVoid   = uBase;
      vec3 cMid    = mix(uBase*2.5, uAccent, 0.35);
      vec3 cAccent = uAccent;
      vec3 cTier   = uTier;
      vec3 cBright = mix(uTier, vec3(1.0), 0.5);

      vec3 col = mix(cVoid,    cMid,    smoothstep(0.10,0.45,n));
      col      = mix(col,      cAccent, smoothstep(0.45,0.70,n));
      col      = mix(col,      cTier,   smoothstep(0.70,0.86,n));
      col      = mix(col,      cBright, smoothstep(0.88,0.96,n));

      vec2 v = vor(wuv*8.0);
      float starMask = smoothstep(0.0, 0.0008, 0.0008-v.x);
      float twink = 0.5 + 0.5*sin(uT*2.0 + v.y*40.0);
      col += vec3(1.0,0.92,0.78) * starMask * twink * 0.9;

      vec2 v2 = vor(wuv*16.0 + 5.0);
      float sm2 = smoothstep(0.0,0.0004,0.0004-v2.x);
      col += vec3(0.85,0.85,1.0) * sm2 * (0.4 + 0.6*sin(uT*3.0+v2.y*60.0));

      float horizon = smoothstep(0.45, 0.05, r);
      col += uTier * horizon * 0.18;
      float core = smoothstep(0.10, 0.04, r);
      col = mix(col, vec3(0.0), core*0.85);

      float vig = smoothstep(1.5, 0.4, length(uv));
      col *= 0.6 + 0.4*vig;

      col *= (1.0 + uPulse*0.35);
      col += uTier * uPulse * 0.12;

      col += (hash(gl_FragCoord.xy + uT) - 0.5) * 0.018;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('GL shader err', gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  function resize(canvas, gl) {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width  = innerWidth  * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width  = innerWidth  + 'px';
    canvas.style.height = innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function boot(opts) {
    opts = opts || {};
    let preset = PRESETS[opts.preset] || PRESETS['aurum-violet'];
    if (opts.tier) preset = Object.assign({}, preset, { tier: opts.tier });
    if (opts.accent) preset = Object.assign({}, preset, { accent: opts.accent });

    // 隐藏旧的 2D starfield（保留 DOM）
    const old = document.getElementById('starfield');
    if (old) old.style.display = 'none';

    const canvas = document.createElement('canvas');
    canvas.id = 'xlab-gl-bg';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;display:block';
    document.body.insertBefore(canvas, document.body.firstChild);

    const gl = canvas.getContext('webgl', { antialias:false, premultipliedAlpha:false }) ||
               canvas.getContext('experimental-webgl');
    if (!gl) {
      canvas.style.background = 'radial-gradient(ellipse at center, ' +
        'rgba(' + (preset.tier.map(c=>(c*120)|0).join(',')) + ',0.2), #050810)';
      return { pulse(){}, setTier(){}, destroy(){ canvas.remove(); } };
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aP = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

    const u = {};
    ['uRes','uT','uMouse','uMouseAmp','uPulse','uTier','uAccent','uBase']
      .forEach(n => u[n] = gl.getUniformLocation(prog, n));

    resize(canvas, gl);
    const onResize = () => resize(canvas, gl);
    addEventListener('resize', onResize);

    let mx = 0.5, my = 0.5, ma = 0;
    let smX = 0.5, smY = 0.5, smA = 0;
    let pulse = 0;
    let tier = preset.tier.slice();

    const onMove  = (e) => { mx = e.clientX / innerWidth; my = 1 - e.clientY / innerHeight; ma = 1; };
    const onLeave = ()   => { ma = 0; };
    addEventListener('pointermove', onMove);
    addEventListener('pointerleave', onLeave);

    let raf = 0;
    const start = performance.now();
    function frame(t) {
      const dt = (t - start) / 1000;
      smX += (mx - smX) * 0.08;
      smY += (my - smY) * 0.08;
      smA += (ma - smA) * 0.04;
      pulse *= 0.92;

      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uT, dt);
      gl.uniform2f(u.uMouse, smX, smY);
      gl.uniform1f(u.uMouseAmp, smA);
      gl.uniform1f(u.uPulse, pulse);
      gl.uniform3f(u.uTier,   tier[0], tier[1], tier[2]);
      gl.uniform3f(u.uAccent, preset.accent[0], preset.accent[1], preset.accent[2]);
      gl.uniform3f(u.uBase,   preset.base[0],   preset.base[1],   preset.base[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      pulse(v) { pulse = Math.max(pulse, v); },
      setTier(rgb) { tier = rgb.slice(); },
      destroy() {
        cancelAnimationFrame(raf);
        removeEventListener('resize', onResize);
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerleave', onLeave);
        canvas.remove();
      }
    };
  }

  global.XLabGL = { boot, PRESETS };
})(window);
