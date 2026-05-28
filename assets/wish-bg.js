/* ==========================================================================
   xLab · Wish FX Engine  (后处理叠加层)
   背景已迁移至 assets/xlab-gl.js；本文件只负责演出期的引力波/坍缩/超新星
   ========================================================================== */
(function(){
  'use strict';
  if(window.__wishGLInited) return;
  window.__wishGLInited = true;

  function compile(gl,t,s){
    const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(sh));
    return sh;
  }
  function resize(c,gl){
    const dpr=Math.min(devicePixelRatio||1,1.5);
    c.width=innerWidth*dpr;c.height=innerHeight*dpr;
    c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';
    gl.viewport(0,0,c.width,c.height);
  }

  const FX_FRAG = `
    precision highp float;
    uniform vec2  uRes;
    uniform float uT;
    uniform float uSuck;
    uniform float uColl;
    uniform float uNova;
    uniform vec3  uTier;
    uniform float uAudio;

    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}

    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x,uRes.y);
      float r = length(uv);
      vec3 col = vec3(0.0);
      float a = 0.0;

      if(uSuck > 0.001){
        float w = 0.0;
        for(int i=0;i<3;i++){
          float ti = uT*1.4 - float(i)*0.25;
          float ring = sin(r*22.0 - ti*4.0);
          float gate = smoothstep(0.0,0.04,ring) - smoothstep(0.04,0.10,ring);
          w += gate * exp(-r*1.4) * (1.0 - float(i)*0.25);
        }
        col += uTier * w * uSuck * 0.7;
        a   += w * uSuck * 0.55;
      }

      if(uColl > 0.001){
        float bands = sin(r*60.0 - uT*22.0);
        float bg = smoothstep(0.0, 0.6, bands) * exp(-r*0.6);
        float spark = step(0.9985, hash(gl_FragCoord.xy + uT*100.0));
        col += vec3(1.0,0.95,0.80) * bg * uColl * 1.2;
        col += vec3(1.0) * spark * uColl;
        a   += bg*uColl + spark*uColl*0.6;
      }

      if(uNova > 0.001){
        float core = exp(-r*r*16.0);
        col += vec3(1.0) * core * uNova;
        a   += core * uNova;

        // 音画同步：ring 厚度/半径 受 uAudio 调制
        float thick = 0.012 + uAudio*0.020;
        float rad   = 0.30 + uAudio*0.10;
        float t1 = smoothstep(thick,0.0,abs(r - rad - uNova*0.10));
        float t2 = smoothstep(thick,0.0,abs(r - (rad+0.02) - uNova*0.10));
        float t3 = smoothstep(thick,0.0,abs(r - (rad+0.04) - uNova*0.10));
        col += vec3(1.0,0.20,0.32) * t1 * uNova * 0.9;
        col += vec3(0.30,1.0,0.55) * t2 * uNova * 0.6;
        col += vec3(0.30,0.55,1.0) * t3 * uNova * 0.9;
        a   += (t1+t2+t3)*uNova*0.5;

        float ang = atan(uv.y,uv.x);
        float rays = 0.5+0.5*sin(ang*36.0 + uT*0.4);
        rays = pow(rays, 8.0) * exp(-r*1.2);
        col += uTier * rays * uNova * (0.85 + uAudio*0.4);
        a   += rays * uNova * 0.4;
      }

      gl_FragColor = vec4(col, clamp(a,0.0,1.0));
    }
  `;

  function bootFX(){
    const c=document.createElement('canvas');
    c.id='wish-fx';
    c.style.cssText='position:fixed;inset:0;z-index:49;pointer-events:none';
    document.body.appendChild(c);
    const gl=c.getContext('webgl',{antialias:false,premultipliedAlpha:false})||c.getContext('experimental-webgl');
    if(!gl){c.remove();return null;}
    const prog=gl.createProgram();
    gl.attachShader(prog,compile(gl,gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(prog,compile(gl,gl.FRAGMENT_SHADER,FX_FRAG));
    gl.linkProgram(prog);gl.useProgram(prog);
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const aP=gl.getAttribLocation(prog,'p');
    gl.enableVertexAttribArray(aP);gl.vertexAttribPointer(aP,2,gl.FLOAT,false,0,0);
    const u={};['uRes','uT','uSuck','uColl','uNova','uTier','uAudio'].forEach(n=>u[n]=gl.getUniformLocation(prog,n));
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    resize(c,gl);addEventListener('resize',()=>resize(c,gl));

    let suck=0,coll=0,nova=0,tier=[1,0.85,0.55],audio=0;
    const start=performance.now();
    function frame(t){
      const dt=(t-start)/1000;
      suck*=0.965;coll*=0.86;nova*=0.94;audio*=0.85;
      if(window.__wishAudioRMS) audio=Math.max(audio,window.__wishAudioRMS());
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      const sum=suck+coll+nova;
      if(sum>0.005){
        c.style.opacity='1';
        gl.uniform2f(u.uRes,c.width,c.height);
        gl.uniform1f(u.uT,dt);
        gl.uniform1f(u.uSuck,suck);
        gl.uniform1f(u.uColl,coll);
        gl.uniform1f(u.uNova,nova);
        gl.uniform3f(u.uTier,tier[0],tier[1],tier[2]);
        gl.uniform1f(u.uAudio,Math.min(1,audio));
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      } else if(c.style.opacity!=='0') c.style.opacity='0';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return {
      suck:v=>{suck=Math.max(suck,v)},
      coll:v=>{coll=Math.max(coll,v)},
      nova:(v,t)=>{nova=Math.max(nova,v);if(t)tier=t;},
      tier:t=>{tier=t}
    };
  }

  function init(){
    if(window.XLabGL){
      window.__wishBG = XLabGL.boot({ preset:'aurum-violet' });
    }
    const fx=bootFX();
    const TIER={3:[0.55,0.70,0.95],4:[0.78,0.62,1.00],5:[1.00,0.82,0.40],6:[1.00,0.55,0.72]};
    window.WishGL={
      pulse(opt){
        const { phase, intensity=0.8, tier }=opt||{};
        const tcol=TIER[tier]||TIER[5];
        if(phase==='suck')     fx&&fx.suck(intensity);
        if(phase==='collapse') fx&&fx.coll(intensity);
        if(phase==='nova')     fx&&fx.nova(intensity,tcol);
        if(window.__wishBG){
          window.__wishBG.pulse(intensity*0.6);
          if(tier) window.__wishBG.setTier(tcol);
        }
      }
    };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
