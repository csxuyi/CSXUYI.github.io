(function(){
/* ============================================================
   CONSTANTS & DATA
============================================================ */
const P5=90,P4=10,SP=73,SI=0.06,R5=0.006,R4=0.051;
const ST={6:{c:'#FFB8C6',l:'6★',cl:'s6'},5:{c:'#D4B87A',l:'5★',cl:'s5'},4:{c:'#B08FFF',l:'4★',cl:'s4'},3:{c:'#5B7A9A',l:'3★',cl:'s3'}};

/* Cards — preserved from original */
const C6=[
  {id:70,name:"创世神",img:"image/god.jpg",desc:"请输入文本"},
];
const C5=[
  {id:58,name:"小苗o",img:"image/xiaomiao.jpg",desc:"小苗想去哪就去哪"},
  {id:60,name:"郑灵杰",img:"image/zlj.jpg",desc:"郑灵杰，伟大的同义词"},
  {id:62,name:"食精玫瑰",img:"image/zzh3.jpg",desc:"食精玫瑰，我要出嫁了"},
  {id:69,name:"柔情猫娘",img:"image/猫娘.jpg",desc:"神秘的造物"},
];
const C4=[
  {id:53,name:"西装老巩",img:"image/gzj2.jpg",desc:"西装老巩，豪到你了吗"},
  {id:59,name:"阴成冰",img:"image/ycb.jpg",desc:"阴成冰，拥有强大的力量"},
  {id:64,name:"后室阳志",img:"image/lyz3.jpg",desc:"游荡在金工的魂灵，令人不安的存在"},
  {id:65,name:"阳志飞踢",img:"image/lyz踢.jpg",desc:"踢！踢！踢！"},
  {id:66,name:"朱子衡飞踢",img:"image/zzh踢.jpg",desc:"踢！踢！踢！"},
  {id:67,name:"乃珑",img:"image/奶龙.jpg",desc:"绿色眼睛、黄色头发的知性大姐姐，散发出一股忧郁的气息，笑起来应该会很好看"},
];
const C3=[
  {id:50,name:"猫娘学长",img:"image/zzh.jpg",desc:"可爱的柔情猫娘，使用起来便捷的杯子"},
  {id:51,name:"阳志是给",img:"image/lyz.jpg",desc:"神秘爆炸头，随机刷新在金工，绿色外星人的使者"},
  {id:52,name:"老巩",img:"image/gzj.jpg",desc:"浙大詹姆斯"},
  {id:54,name:"空翻也",img:"image/kfy.jpg",desc:"蔡徐坤拥护者，普京同位体"},
  {id:55,name:"带毛魔丸",img:"image/lyz2.jpg",desc:"带毛魔丸，拥有强大的力量"},
  {id:56,name:"奶察",img:"image/nc.jpg",desc:"可爱的奶察，带来温暖和关怀"},
  {id:57,name:"二奶",img:"image/nz.jpg",desc:"真男人不露二奶"},
  {id:61,name:"窄型魔丸",img:"image/zzh2.jpg",desc:"窄型魔丸，使人绷不住"},
  {id:63,name:"SHIT",img:"image/SHIT.jpg",desc:"没什么意义，降低你的抽卡概率"},
  {id:68,name:"zonk",img:"image/zzh4.jpg",desc:"低客的黑调"},
];
const BN=[
  {name:"角色活动祈愿·壹",fate:"纠缠之缘",
    up5:C5[3],pool5:[C5[3]],
    up4:[C4[0],C4[2]],pool4:[C4[0],C4[1],C4[2],C4[5]],
    cover:"image/猫娘.jpg"},
  {name:"角色活动祈愿·贰",fate:"纠缠之缘",
    up5:C5[1],pool5:[C5[1]],
    up4:[C4[1],C4[3]],pool4:[C4[1],C4[3],C4[4]],
    cover:"image/zlj.jpg"},
  {name:"常驻祈愿",fate:"相遇之缘",
    up5:null,pool5:[C5[0],C5[2]],up4:[C4[4],C4[5]],pool4:C4,
    covers:["image/xiaomiao.jpg","image/zzh3.jpg"]},
];

/* State */
let S={bn:0,total:0,p5:[0,0,0],p4:[0,0,0],p6:[0,0,0],guar:[false,false,false],hist:[],muted:false,stardust:0};
/* Session-only counter (本次会话抽数) */
S.sess=0;

/* DOM shortcuts */
const Q=s=>document.querySelector(s);
const sf=Q('#starfield'),sfx=sf.getContext('2d');
const pc=Q('#pfx-canvas'),px=pc.getContext('2d');
const dp=Q('#details-panel'),dbo=Q('#details-overlay');
const wishStage=Q('#wish-stage'),cardDeck=Q('#card-deck');
const stargate=Q('#stargate'),meteor=Q('#meteor'),trail=Q('#meteor-trail');
const flash=Q('#impact-flash'),fsf=Q('#fullscreen-flash');
const pillar=Q('#light-pillar'),flare=Q('#lens-flare');
const sw1=Q('#shockwave-1'),sw2=Q('#shockwave-2');
const resCtl=Q('#result-controls'),btnSkip=Q('#btn-skip');

/* ============================================================
   STARFIELD with nebulae & shooting stars
============================================================ */
let stars=[],shootingStars=[];
function initSF(){
  sf.width=window.innerWidth;sf.height=window.innerHeight;
  stars=[];
  for(let i=0;i<160;i++)stars.push({
    x:Math.random()*sf.width,y:Math.random()*sf.height,
    r:Math.random()*1.3+0.3,s:Math.random()*0.008+0.002,
    o:Math.random()*Math.PI*2,h:28+Math.random()*40,layer:Math.floor(Math.random()*3)
  });
  shootingStars=[];
}
function spawnShootingStar(){
  if(Math.random()<0.018&&shootingStars.length<2){
    shootingStars.push({
      x:Math.random()*sf.width,y:Math.random()*sf.height*0.5,
      vx:3+Math.random()*5,vy:1+Math.random()*3,
      life:1,max:1,len:40+Math.random()*80
    });
  }
}
function drawSF(t){
  sfx.clearRect(0,0,sf.width,sf.height);
  // Nebula layers
  const nebs=[
    {x:sf.width*0.2,y:sf.height*0.3,r:280,c:'rgba(60,30,100,0.05)',dx:0.1,dy:0.05},
    {x:sf.width*0.78,y:sf.height*0.65,r:220,c:'rgba(100,60,30,0.04)',dx:-0.08,dy:-0.04},
    {x:sf.width*0.5,y:sf.height*0.5,r:340,c:'rgba(40,20,80,0.05)',dx:0.05,dy:-0.03},
  ];
  for(const n of nebs){
    const g=sfx.createRadialGradient(n.x+n.dx*t*0.01,n.y+n.dy*t*0.01,0,n.x,n.y,n.r);
    g.addColorStop(0,n.c);g.addColorStop(1,'transparent');
    sfx.fillStyle=g;sfx.beginPath();sfx.arc(n.x,n.y,n.r,0,Math.PI*2);sfx.fill();
  }
  // Stars
  for(const s of stars){
    const a=0.1+0.32*(Math.sin(t*s.s+s.o)*0.5+0.5)*(s.layer===0?1:s.layer===1?0.6:0.3);
    sfx.beginPath();sfx.arc(s.x,s.y,s.r,0,Math.PI*2);
    sfx.fillStyle=`hsla(${s.h},30%,${72+s.layer*8}%,${a})`;sfx.fill();
  }
  // Shooting stars
  for(let i=shootingStars.length-1;i>=0;i--){
    const ss=shootingStars[i];ss.x+=ss.vx;ss.y+=ss.vy;ss.life-=0.015;
    if(ss.life<=0){shootingStars.splice(i,1);continue}
    const grad=sfx.createLinearGradient(ss.x,ss.y,ss.x-ss.len*0.7,ss.y-ss.len*0.3);
    grad.addColorStop(0,`rgba(255,255,255,${ss.life})`);grad.addColorStop(1,'rgba(255,255,255,0)');
    sfx.strokeStyle=grad;sfx.lineWidth=1.5;sfx.beginPath();
    sfx.moveTo(ss.x,ss.y);sfx.lineTo(ss.x-ss.len*0.7,ss.y-ss.len*0.3);sfx.stroke();
  }
  spawnShootingStar();
}

/* ============================================================
   PARTICLE SYSTEM
============================================================ */
let pts=[];
function rPC(){pc.width=window.innerWidth;pc.height=window.innerHeight}
function spP(x,y,n,color,spd,life){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,s=Math.random()*spd;
    pts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:life+Math.random()*life*0.5,max:life*1.5,color,size:Math.random()*2.2+1});
  }
}
function upP(dt){
  for(let i=pts.length-1;i>=0;i--){
    const p=pts[i];p.life-=dt;
    if(p.life<=0){pts.splice(i,1);continue}
    p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;p.vx*=0.97;p.vy*=0.97;
  }
}
function drP(){
  px.clearRect(0,0,pc.width,pc.height);
  for(const p of pts){
    const a=p.life/p.max;
    px.beginPath();px.arc(p.x,p.y,p.size,0,Math.PI*2);
    px.fillStyle=p.color.replace('1)',`${a})`).replace('rgb','rgba');px.fill();
  }
}

/* ============================================================
   AMBIENT PARTICLES (around splash)
============================================================ */
function buildAmbient(){
  const c=Q('#ambient-particles');c.innerHTML='';
  for(let i=0;i<14;i++){
    const d=document.createElement('div');d.className='amb-particle '+(i%3===0?'gold':'purple');
    d.style.left=(15+Math.random()*70)+'%';d.style.top=(10+Math.random()*80)+'%';
    d.style.width=(2+Math.random()*3)+'px';d.style.height=d.style.width;
    d.style.animationDelay=Math.random()*4+'s';d.style.animationDuration=(3+Math.random()*3)+'s';
    c.appendChild(d);
  }
}

/* ============================================================
   GOLD DROP (5★)
============================================================ */
function spawnGoldDrops(){
  for(let i=0;i<40;i++){
    const e=document.createElement('div');e.className='gold-drop';
    e.style.left=Math.random()*100+'%';
    e.style.animationDuration=(2.4+Math.random()*3.2)+'s';
    e.style.animationDelay=Math.random()*0.7+'s';
    const s=3+Math.random()*9;e.style.width=s+'px';e.style.height=s+'px';
    document.body.appendChild(e);setTimeout(()=>e.remove(),4200);
  }
}

/* ============================================================
   DRAW LOGIC
============================================================ */
function gR5(){const p=S.p5[S.bn];if(p>=P5-1)return 1;if(p>=SP)return Math.min(R5+(p-SP+1)*SI,1);return R5}
function gR4(){return S.p4[S.bn]>=P4-1?1:R4}
function draw1(){
  const i=S.bn,b=BN[i];let r,card;
  const p5=b.pool5||C5;
  const p4=b.pool4||C4;
  if(Math.random()<gR5()){
    r=5;
    if(b.up5&&(S.guar[i]||Math.random()<0.5)){card=b.up5;S.guar[i]=false}
    else{const o=p5.filter(c=>!b.up5||c.id!==b.up5.id);card=o[Math.floor(Math.random()*o.length)];if(b.up5)S.guar[i]=true}
  }
  else if(Math.random()<gR4()){
    r=4;
    if(b.up4&&b.up4.length&&Math.random()<0.5)card=b.up4[Math.floor(Math.random()*b.up4.length)];
    else card=p4[Math.floor(Math.random()*p4.length)];
  }
  else{r=3;card=C3[Math.floor(Math.random()*C3.length)]}
  if(r===5)S.p5[i]=0;else S.p5[i]++;
  if(r===4)S.p4[i]=0;else S.p4[i]++;
  S.p6[i]++;S.total++;return{card,rarity:r};
}

/* ============================================================
   SOUND (Web Audio API)
============================================================ */
let audioCtx=null;
function ensureAudio(){if(!audioCtx)try{audioCtx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}return audioCtx}
function playTone(freq,dur,type='sine',vol=0.08){
  if(S.muted)return;
  const c=ensureAudio();if(!c)return;
  try{
    const o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);
    o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);
    g.gain.setValueAtTime(vol,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
    o.start();o.stop(c.currentTime+dur);
  }catch(e){}
}
function playSweep(f1,f2,dur,type='sine',vol=0.08){
  if(S.muted)return;
  const c=ensureAudio();if(!c)return;
  try{
    const o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);
    o.type=type;
    o.frequency.setValueAtTime(f1,c.currentTime);
    o.frequency.exponentialRampToValueAtTime(f2,c.currentTime+dur);
    g.gain.setValueAtTime(vol,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
    o.start();o.stop(c.currentTime+dur);
  }catch(e){}
}
function sndButton(){playTone(880,0.08,'sine',0.05);playTone(1320,0.06,'sine',0.04)}
function sndGate(){playSweep(80,240,0.5,'sine',0.10);playSweep(200,140,0.5,'triangle',0.06)}
function sndImpact(){playSweep(800,80,0.25,'sawtooth',0.12)}
function sndFlip(){playTone(1200,0.05,'square',0.03);playTone(700,0.04,'square',0.02)}
function snd3(){playTone(620,0.12,'sine',0.04)}
function snd4(){playTone(660,0.10,'triangle',0.07);setTimeout(()=>playTone(880,0.12,'triangle',0.07),60)}
function snd5(){
  playTone(523,0.2,'sine',0.10);
  setTimeout(()=>playTone(659,0.2,'sine',0.10),120);
  setTimeout(()=>playTone(784,0.25,'sine',0.10),240);
  setTimeout(()=>playTone(1047,0.35,'sine',0.10),380);
}
function snd6(){
  playTone(784,0.25,'sine',0.12);
  setTimeout(()=>playTone(1047,0.25,'sine',0.12),150);
  setTimeout(()=>playTone(1319,0.3,'sine',0.12),300);
  setTimeout(()=>playTone(1568,0.4,'sine',0.12),450);
  setTimeout(()=>playTone(1047,0.3,'sine',0.10),700);
  setTimeout(()=>playTone(1319,0.3,'sine',0.10),850);
  setTimeout(()=>playTone(1568,0.5,'sine',0.12),1000);
}

/* ============================================================
   ▼▼▼ FULLSCREEN WISH ANIMATION PIPELINE ▼▼▼
============================================================ */
let drawing=false,skipReq=false;
let timers=[];
function clearTimers(){timers.forEach(t=>clearTimeout(t));timers=[]}
function ad(fn,ms){const t=setTimeout(fn,ms);timers.push(t);return t}

function runWishAnimation(rs,n){
  drawing=true;setBtns(true);skipReq=false;
  cardDeck.innerHTML='';cardDeck.className='card-deck '+(n===1?'single':'multi');
  resCtl.classList.remove('show');

  // Determine streak color from highest rarity
  const maxR=Math.max(...rs.map(r=>r.rarity));
  const streakClass='streak-'+maxR;
  meteor.className='meteor '+streakClass;
  trail.className='meteor-trail '+streakClass;

  // Show skip button after small delay
  ad(()=>btnSkip.classList.add('show'),200);

  // PHASE 1: Open stage + stargate (0 - 600ms)
  wishStage.classList.add('active');
  stargate.classList.remove('activate');void stargate.offsetWidth;
  stargate.classList.add('activate');
  sndGate();
  // [GEEK] wormhole cone fades in during the gate phase for 5★/6★
  if(maxR>=5){
    const wh=Q('#wormhole');
    if(wh){wh.classList.add('on');setTimeout(()=>wh.classList.remove('on'),3200);}
    if(window.GeekSFX) GeekSFX.whoosh();
  }

  // PHASE 2: Meteor flies in (700 - 2100ms)
  ad(()=>{
    if(skipReq)return;
    meteor.classList.remove('fly');trail.classList.remove('fly');
    void meteor.offsetWidth;void trail.offsetWidth;
    meteor.classList.add('fly');trail.classList.add('fly');
    // Particles trailing along
    const cx=window.innerWidth/2,cy=window.innerHeight/2;
    let pTimer=0;const trailInt=setInterval(()=>{
      if(skipReq){clearInterval(trailInt);return}
      pTimer++;
      const prog=pTimer/14;
      const sx=cx-(0.4-prog*0.4)*window.innerWidth;
      const sy=cy-(0.3-prog*0.3)*window.innerHeight;
      const col=maxR===5?'rgb(255,220,140)':maxR===4?'rgb(200,160,255)':'rgb(140,170,210)';
      spP(sx,sy,3,col,2.5,0.7);
      if(pTimer>=14)clearInterval(trailInt);
    },90);
  },650);

  // PHASE 2.5: Pre-reveal gold effects (900ms) — pillar + flare rise BEFORE card flip
  if(maxR>=5){
    ad(()=>{
      if(skipReq)return;
      // Light pillar rises early for 5★/6★
      pillar.classList.remove('rise');void pillar.offsetWidth;
      pillar.classList.add('rise');
      // Lens flare
      flare.classList.remove('show');void flare.offsetWidth;
      flare.classList.add('show');
      // Spawn gold drops during meteor phase
      spawnGoldDrops();
      // Warm gold fullscreen flash
      fsf.classList.remove('flash');void fsf.offsetWidth;fsf.classList.add('flash');
    },900);
  }

  // PHASE 3: Impact (2100ms)
  ad(()=>{
    if(skipReq)return;
    flash.classList.remove('burst','burst-5','burst-6');void flash.offsetWidth;
    flash.classList.add(maxR===6?'burst-6':maxR===5?'burst-5':'burst');
    sw1.classList.remove('burst');sw2.classList.remove('burst');
    void sw1.offsetWidth;void sw2.offsetWidth;
    sw1.classList.add('burst');sw2.classList.add('burst');
    sndImpact();
    // [GEEK] chromatic aberration ring on impact
    const ch=Q('#chroma');
    if(ch){ch.classList.remove('on');void ch.offsetWidth;ch.classList.add('on');}
    // [GEEK] 6★ creator-god full-screen演出
    if(maxR===6){
      const gm=Q('#god-mode');
      const app=Q('#app');
      if(gm){gm.classList.remove('on');void gm.offsetWidth;gm.classList.add('on');setTimeout(()=>gm.classList.remove('on'),3200);}
      if(app){app.classList.remove('slow-mo');void app.offsetWidth;app.classList.add('slow-mo');setTimeout(()=>app.classList.remove('slow-mo'),2400);}
      if(window.GeekSFX) GeekSFX.reveal6();
      if(window.GeekSFX) setTimeout(()=>GeekSFX.glitch(),200);
    }else if(maxR===5){
      if(window.GeekSFX) GeekSFX.reveal5();
    }else if(maxR===4){
      if(window.GeekSFX) GeekSFX.reveal4();
    }else{
      if(window.GeekSFX) GeekSFX.reveal3();
    }
    // Particle burst
    const cx=window.innerWidth/2,cy=window.innerHeight/2;
    const col=maxR===6?'rgb(255,184,198)':maxR===5?'rgb(255,220,140)':maxR===4?'rgb(200,160,255)':'rgb(180,200,230)';
    spP(cx,cy,maxR===6?120:maxR===5?80:maxR===4?50:30,col,9,1.6);
    // Screen shake on 4/5
    if(maxR>=4){
      Q('#app').classList.add('shake');
      ad(()=>Q('#app').classList.remove('shake'),450);
    }
    // Vibration
    if(navigator.vibrate){
      if(maxR===5)navigator.vibrate([60,30,80,30,120]);
      else if(maxR===4)navigator.vibrate([30,20,40]);
    }
  },2100);

  // PHASE 4: Cards materialize (2400ms)
  ad(()=>{
    if(skipReq)return;
    buildCards(rs,n);
  },2400);
}

function buildCards(rs,n){
  cardDeck.innerHTML='';
  var dupes=window._lastDupes||[];
  rs.forEach((r,i)=>{
    var s=ST[r.rarity];
    var isDupe=dupes[i]||false;
    var sdAmt=r.rarity===6?1500:r.rarity===5?720:r.rarity===4?120:15;
    var el=document.createElement('div');
    el.className='card-3d '+s.cl+'-card'+(isDupe?' dupe-card':'');
    var imgHTML=r.card.img?
      `<img src="${r.card.img}" alt="${r.card.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="card-img-fallback" style="display:none">${'★'.repeat(r.rarity)}</span>`:
      `<span class="card-img-fallback">${'★'.repeat(r.rarity)}</span>`;
    // Random glints positions for back
    const glints=Array.from({length:5},()=>{
      const x=10+Math.random()*80,y=10+Math.random()*80,d=Math.random()*2;
      return `<span class="card-back-glint" style="left:${x}%;top:${y}%;animation-delay:${d}s"></span>`;
    }).join('');
    el.innerHTML=`
      <div class="card-3d-inner">
        <div class="card-face card-back">
          ${glints}
          <div class="card-back-emblem"><span class="card-back-star">✦</span></div>
          <div class="dupe-overlay">
            <div class="dupe-stardust-icon">✨</div>
            <div class="dupe-stardust-amount">+${sdAmt}</div>
            <div class="dupe-stardust-label">星 辉</div>
          </div>
        </div>
        <div class="card-face card-front ${s.cl}">
          <span class="card-rarity-badge">${s.l}</span>
          <div class="card-img-area">${imgHTML}</div>
          <div class="card-info">
            <div class="card-name">${r.card.name}</div>
            <div class="card-stars">${'★'.repeat(r.rarity)}</div>
            <div class="card-desc">${r.card.desc||''}</div>
          </div>
        </div>
      </div>
    `;
    cardDeck.appendChild(el);
    // [GEEK] holographic foil for 5★/6★
    if(r.rarity>=5 && window.GeekLayer){
      const inner=el.querySelector('.card-3d-inner');
      const front=el.querySelector('.card-front');
      if(front) GeekLayer.attachHolo(front);
    }
    // Stagger materialization
    ad(()=>{el.classList.add('materialize')},i*70);
  });

  // After all materialize, start flipping
  const flipBase=n===1?900:900+rs.length*70;
  ad(()=>flipAll(rs),flipBase);
}

function flipAll(rs){
  if(skipReq)return;
  const cards=cardDeck.querySelectorAll('.card-3d');
  let any5=false,any4=false;
  cards.forEach((el,i)=>{
    const r=rs[i].rarity;
    ad(()=>{
      if(skipReq){el.classList.add('flipped');return}
      el.classList.add('flipped');
      sndFlip();
      // Per-card effects
      if(r===6){
        const rect=el.getBoundingClientRect();
        triggerFivePillar(rect.left+rect.width/2);
        spawnGoldDrops();
        fsf.classList.remove('flash');void fsf.offsetWidth;fsf.classList.add('flash');
        Q('#app').classList.add('shake');ad(()=>Q('#app').classList.remove('shake'),600);
        snd6();
        spP(rect.left+rect.width/2,rect.top+rect.height/2,200,'rgb(255,184,198)',15,2.5);
        // Extra pink-gold drops
        for(let k=0;k<30;k++){
          const drop=document.createElement('div');
          drop.style.cssText=`position:fixed;pointer-events:none;z-index:99;border-radius:50%;background:radial-gradient(circle,#fff,#ffb8c6);box-shadow:0 0 10px #ffb8c6,0 0 20px rgba(255,184,198,0.6);animation:drop-fall ${2+Math.random()*2.5}s linear forwards;animation-delay:${Math.random()*0.3}s;left:${rect.left+Math.random()*rect.width}px;top:${rect.top}px;width:${4+Math.random()*8}px;height:${4+Math.random()*8}px`;
          document.body.appendChild(drop);
          setTimeout(()=>drop.remove(),4000);
        }
        if(navigator.vibrate)navigator.vibrate([80,40,100,40,200,60,300]);
      }else if(r===5){
        any5=true;
        // Light pillar from THIS card position
        const rect=el.getBoundingClientRect();
        triggerFivePillar(rect.left+rect.width/2);
        spawnGoldDrops();
        fsf.classList.remove('flash');void fsf.offsetWidth;fsf.classList.add('flash');
        Q('#app').classList.add('shake');ad(()=>Q('#app').classList.remove('shake'),450);
        snd5();
        spP(rect.left+rect.width/2,rect.top+rect.height/2,100,'rgb(255,220,140)',12,2);
        if(navigator.vibrate)navigator.vibrate([60,30,80,30,150,30,200]);
      }else if(r===4){
        any4=true;
        snd4();
        const rect=el.getBoundingClientRect();
        // Purple lightning sparks
        for(let k=0;k<6;k++){
          const sp=document.createElement('span');
          sp.className='lightning-spark';
          const ang=Math.random()*360;
          sp.style.left='50%';sp.style.top='50%';
          sp.style.transform=`translate(-50%,-50%) rotate(${ang}deg) translateY(-40px)`;
          sp.style.animationDelay=(k*0.05)+'s';
          el.appendChild(sp);
          setTimeout(()=>sp.remove(),700);
        }
        spP(rect.left+rect.width/2,rect.top+rect.height/2,35,'rgb(200,160,255)',6,1.2);
      }else{
        snd3();
      }
    },i*350);
  });
  // After all flipped, flip dupe cards back to show stardust on back face
  const dupeCards=cardDeck.querySelectorAll('.dupe-card');
  if(dupeCards.length>0){
    const dupeDelay=cards.length*350+500;
    ad(()=>{
      dupeCards.forEach((el,i)=>{
        setTimeout(()=>{
          el.classList.remove('flipped'); // flip back
          var ov=el.querySelector('.dupe-overlay');
          if(ov)ov.classList.add('show'); // reveal stardust
        },i*180);
      });
    },dupeDelay);
  }
  // Show controls after all
  const totalDur=cards.length*350+(dupeCards.length>0?1400:800);
  ad(()=>{
    if(!skipReq)resCtl.classList.add('show');
    drawing=false;setBtns(false);save();
  },totalDur);
}

function triggerFivePillar(xPos){
  // Position the pillar at card's x
  pillar.style.left=xPos+'px';
  pillar.classList.remove('rise');void pillar.offsetWidth;pillar.classList.add('rise');
  flare.classList.remove('show');void flare.offsetWidth;flare.classList.add('show');
}

/* SKIP behavior */
function skipAnimation(){
  if(!drawing&&!wishStage.classList.contains('active'))return;
  skipReq=true;clearTimers();
  // Hide pre-result FX immediately
  stargate.classList.remove('activate');
  meteor.classList.remove('fly');trail.classList.remove('fly');
  flash.classList.remove('burst','burst-5','burst-6');
  sw1.classList.remove('burst');sw2.classList.remove('burst');
  // Build cards if not yet built
  if(!cardDeck.children.length&&window._lastRs){
    buildCards(window._lastRs,window._lastN);
  }
  // Flip everything instantly
  setTimeout(()=>{
    const cards=cardDeck.querySelectorAll('.card-3d');
    cards.forEach(el=>{el.classList.add('materialize');el.classList.add('flipped')});
    resCtl.classList.add('show');
    drawing=false;setBtns(false);save();
  },50);
}

function endWish(){
  wishStage.classList.remove('active');
  cardDeck.innerHTML='';
  cardDeck.className='card-deck';
  resCtl.classList.remove('show');
  btnSkip.classList.remove('show');
  pillar.classList.remove('rise');
  flare.classList.remove('show');
  fsf.classList.remove('flash');
  stargate.classList.remove('activate');
  flash.classList.remove('burst','burst-5','burst-6');
  sw1.classList.remove('burst');sw2.classList.remove('burst');
  meteor.classList.remove('fly');trail.classList.remove('fly');
  window._lastRs=null;window._lastN=null;
  drawing=false;setBtns(false);
}

/* ============================================================
   PERFORM DRAW
============================================================ */
function doDraw(n){
  try{
  if(drawing)return;
  // Check resources
  const fc=Q('#fate-num');let v=parseInt(fc.textContent)||0;
  if(v<n){showToast('「'+BN[S.bn].fate+'」不足，试试右上角 🔨 赚取吧！');return}
  sndButton();
  S.sess=(S.sess||0)+n;
  // Generate results
  const bi=S.bn,p6Start=S.p6[bi];
  const rs=[];for(let i=0;i<n;i++)rs.push(draw1());
  // 6★ bonus: 20% chance per 5★, 300-pull hard pity
  for(let i=0;i<rs.length;i++){
    const r=rs[i];
    const pullP6=p6Start+i+1;
    if(r.rarity===5&&(pullP6>=300||Math.random()<0.20)){
      const six=C6[Math.floor(Math.random()*C6.length)];
      rs.push({card:six,rarity:6});
      S.p6[bi]=0;
    }
  }
  // Duplicate detection within current batch only
  const nameCount=new Map();
  for(const r of rs){const n=r.card.name;nameCount.set(n,(nameCount.get(n)||0)+1)}
  const dupes=[];let addedStardust=0;
  const seen=new Map();
  for(const r of rs){
    const name=r.card.name;
    const seenCount=seen.get(name)||0;
    const isDupe=seenCount>0; // first occurrence is NOT dupe, subsequent ones ARE
    seen.set(name,seenCount+1);
    dupes.push(isDupe);
    if(isDupe){
      const sdAmt=r.rarity===6?1500:r.rarity===5?720:r.rarity===4?120:15;
      addedStardust+=sdAmt;
    }
  }
  S.stardust=(S.stardust||0)+addedStardust;
  for(const r of rs)S.hist.unshift({card:r.card,rarity:r.rarity,t:Date.now(),bn:S.bn});
  if(S.hist.length>500)S.hist.length=500;
  // Deduct
  fc.textContent=v-n;
  fc.classList.remove('bump');void fc.offsetWidth;fc.classList.add('bump');
  updateStardust();
  updatePity();
  window._lastRs=rs;window._lastN=n;
  window._lastDupes=dupes;window._lastAddedStardust=addedStardust;
  runWishAnimation(rs,rs.length);
  }catch(e){console.error('doDraw error:',e);showToast('祈愿出错，请刷新页面重试');drawing=false;setBtns(false)}
}

function setBtns(d){Q('#btn-single').disabled=d;Q('#btn-ten').disabled=d;Q('#btn-minigame').disabled=d}

/* ============================================================
   UI UPDATES
============================================================ */
function updatePity(){
  const i=S.bn;
  const rem5=P5-S.p5[i];
  const rem6=300-S.p6[i];
  Q('#pity-rem').textContent=rem5;
  Q('#pity-6-rem').textContent=Math.max(rem6,0);
  // [LAYOUT] mirror to top bar
  const tp5=Q('#tp-rem'),tp6=Q('#tp-6-rem'),tp=Q('#top-pity');
  if(tp5) tp5.textContent=rem5;
  if(tp6) tp6.textContent=Math.max(rem6,0);
  const danger=rem5<=10||rem6<=20;
  Q('#pity-pill').classList.toggle('warning',danger);
  if(tp) tp.classList.toggle('danger',danger);
  // ring fill
  const ring=Q('#pity-ring');
  if(ring){
    const fg=ring.querySelector('.pr-fg');
    const C=2*Math.PI*15;
    const prog=Math.min(1,S.p5[i]/P5);
    if(fg){fg.setAttribute('stroke-dasharray',C);fg.setAttribute('stroke-dashoffset',C*(1-prog));}
    ring.classList.toggle('danger',danger);
  }
  const edge=Q('#pity-edge');
  if(edge) edge.classList.toggle('on',rem5<=5||rem6<=10);
  // [LAYOUT] bottom-bar status
  const bbT=Q('#bb-total'),bbS=Q('#bb-session'),bb5=Q('#bb-5star');
  if(bbT) bbT.textContent=S.total||0;
  if(bbS) bbS.textContent=S.sess||0;
  if(bb5){
    const c5=(S.hist||[]).filter(h=>h.rarity>=5).length;
    bb5.textContent=c5;
  }
}
function updateAll(){
  updatePity();
  const b=BN[S.bn];
  const singleImg=Q('#splash-img');
  const dualDiv=Q('#splash-dual');
  const dualL=Q('#splash-dual-l');
  const dualR=Q('#splash-dual-r');
  const bgImg=Q('#splash-bg-img');

  // Transition both main and bg images together
  if(b.covers){
    // Dual-cover mode (常驻)
    singleImg.style.display='none';
    dualDiv.style.display='flex';
    dualDiv.classList.add('switching');
    bgImg.classList.add('switching');
    setTimeout(()=>{
      dualL.src=b.covers[0];dualR.src=b.covers[1];
      dualDiv.classList.remove('switching');
      bgImg.src=b.covers[0];
      bgImg.classList.remove('switching');
    },200);
  }else{
    // Single-cover mode
    dualDiv.style.display='none';
    singleImg.style.display='block';
    singleImg.classList.add('switching');
    bgImg.classList.add('switching');
    setTimeout(()=>{
      singleImg.src=b.cover||'';
      bgImg.src=b.cover||'';
      singleImg.classList.remove('switching');
      bgImg.classList.remove('switching');
    },200);
  }
  Q('#banner-name').textContent=b.name;
  Q('#fate-label').textContent=b.fate;
  Q('#banner-title-glow').textContent=b.name;
  // [LAYOUT] banner ribbon
  const brTag=Q('#br-tag'),brBanner=Q('#br-banner'),brName=Q('#br-name');
  if(brTag) brTag.textContent=b.up5?'EVENT':'STANDARD';
  if(brBanner) brBanner.textContent=b.name;
  if(brName){
    const idxRoman=['壹','贰','叁','肆','伍'][S.bn]||(S.bn+1);
    brName.innerHTML='期次 <b>'+idxRoman+'</b> · <b>'+b.name+'</b>';
  }

  // UP character info
  const upName=Q('#up-char-name'),upStars=Q('#up-char-stars'),upDesc=Q('#up-char-desc');
  if(b.up5){
    upName.textContent=b.up5.name;
    upStars.textContent='★★★★★';
    upStars.style.color='#D4B87A';
    upDesc.textContent=b.up5.desc||'';
    upName.style.display='';upStars.style.display='';upDesc.style.display='';
  }else if(b.covers){
    upName.textContent=b.pool5.map(c=>c.name).join('  ·  ');
    upStars.textContent='★★★★★  ·  ★★★★★';
    upStars.style.color='#D4B87A';
    upDesc.textContent='常驻池五星角色';
    upName.style.display='';upStars.style.display='';upDesc.style.display='';
  }else{
    upName.style.display='none';upStars.style.display='none';upDesc.style.display='none';
  }

  // Build 4★ UP character cards
  const up4c=Q('#up4-corner');
  up4c.innerHTML='';
  if(b.up4&&b.up4.length){
    const cardsHTML=b.up4.map((c,i)=>{
      const tilt=10+i*3;
      return `
      <div class="up4-card" style="transform:rotate(${i===0?-tilt:tilt}deg) translateY(${i*8}px)">
        <div class="up4-card-img"><img src="${c.img}" alt="${c.name}" onerror="this.style.display='none'"></div>
        <div class="up4-card-info">
          <div class="up4-card-name">${c.name}</div>
          <div class="up4-card-stars">★★★★</div>
        </div>
      </div>`;
    }).join('');
    const labelText=b.covers?'★★★★':'UP<br>★★★★';
    up4c.innerHTML=`<div class="up4-label">${labelText}</div>`+cardsHTML;
  }

  buildAmbient();
}

/* ============================================================
   TABS
============================================================ */
function renderTabs(){
  const sb=Q('#sidebar'),mb=Q('#mobile-tabs');
  sb.innerHTML=BN.map((b,i)=>`<button class="sidebar-tab${i===S.bn?' active':''}" data-i="${i}"><img class="tab-thumb" src="${b.cover||(b.covers&&b.covers[0])}" alt="" onerror="this.style.display='none'"><span class="tab-label">${b.name}</span></button>`).join('');
  mb.innerHTML=BN.map((b,i)=>`<button class="mobile-tab${i===S.bn?' active':''}" data-i="${i}">${b.name}</button>`).join('');
}
function switchBn(i){
  if(drawing)return;
  S.bn=i;renderTabs();updateAll();
  if(dp.classList.contains('open')){renderDUp()}
  save();
}
Q('#sidebar').addEventListener('click',e=>{const t=e.target.closest('.sidebar-tab');if(t)switchBn(parseInt(t.dataset.i))});
Q('#mobile-tabs').addEventListener('click',e=>{const t=e.target.closest('.mobile-tab');if(t)switchBn(parseInt(t.dataset.i))});

/* ============================================================
   DETAILS PANEL
============================================================ */
function openD(){renderDUp();renderDHist();dp.classList.add('open');dbo.classList.add('open')}
function closeD(){dp.classList.remove('open');dbo.classList.remove('open')}
function renderDUp(){
  const b=BN[S.bn],c=Q('#d-up-list');let h='';
  if(b.up5)h+=`<div class="up-mini"><img class="up-mini-img s5" src="${b.up5.img}" alt="${b.up5.name}" onerror="this.style.display='none'"><span class="up-mini-name s5">${b.up5.name} (5★ UP)</span></div>`;
  for(const x of b.up4)h+=`<div class="up-mini"><img class="up-mini-img s4" src="${x.img}" alt="${x.name}" onerror="this.style.display='none'"><span class="up-mini-name s4">${x.name} (4★ UP)</span></div>`;
  c.innerHTML=h||'<div style="font-size:0.74rem;color:var(--t3)">本期无 UP 物品</div>';
}
function renderDHist(){
  const c=Q('#d-hist');
  if(!S.hist.length){c.innerHTML='<div class="hist-empty">尚未祈愿</div>';return}
  c.innerHTML=S.hist.slice(0,20).map(h=>{
    const s=ST[h.rarity];
    const img=h.card.img?
      `<img class="hist-thumb" src="${h.card.img}" alt="${h.card.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="hist-ph" style="display:none">${'★'.repeat(h.rarity)}</span>`:
      `<span class="hist-ph">${'★'.repeat(h.rarity)}</span>`;
    const t=new Date(h.t);
    const ts=t.toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'})+' '+t.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    return`<div class="hist-row ${s.cl}">${img}<div class="hist-mid"><div class="hist-mid-name">${h.card.name}</div><div class="hist-mid-time">${ts} · ${BN[h.bn]?BN[h.bn].name.slice(0,4):'未知'}</div></div><div class="hist-star" style="color:${s.c}">${'★'.repeat(h.rarity)}</div></div>`;
  }).join('');
}
Q('#btn-details').addEventListener('click',openD);
Q('#details-close').addEventListener('click',closeD);
dbo.addEventListener('click',closeD);
Q('#btn-history').addEventListener('click',()=>{openD();setTimeout(()=>Q('#d-hist')?.scrollIntoView({behavior:'smooth'}),350)});

/* ============================================================
   BUTTON BINDINGS
============================================================ */
Q('#btn-single').addEventListener('click',()=>doDraw(1));
Q('#btn-ten').addEventListener('click',()=>doDraw(10));
btnSkip.addEventListener('click',skipAnimation);
Q('#btn-again').addEventListener('click',()=>{
  const n=window._lastN||1;endWish();
  setTimeout(()=>doDraw(n),300);
});
Q('#btn-confirm').addEventListener('click',endWish);
/* [GEEK] 键盘快捷键 — 仅在结果面板显示时响应 R / Enter；Esc 跳过动画 */
document.addEventListener('keydown',e=>{
  // 不打断输入框
  const t=e.target;
  if(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  if(t && t.isContentEditable) return;
  // 动画进行中：Esc / Space 跳过
  if(drawing){
    if(e.key==='Escape'||e.key===' '){e.preventDefault();skipAnimation();}
    return;
  }
  // 结果面板可见时
  if(resCtl.classList.contains('show')){
    const k=e.key.toLowerCase();
    if(k==='r'){
      e.preventDefault();
      Q('#btn-again').click();
    }else if(e.key==='Enter'||k==='enter'){
      e.preventDefault();
      Q('#btn-confirm').click();
    }
  }
});
// Click empty area on wish-stage to skip / close
wishStage.addEventListener('click',e=>{
  if(drawing){skipAnimation()}
  else if(e.target===wishStage||e.target===cardDeck){endWish()}
});
// ESC key
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(wishStage.classList.contains('active')){
      if(drawing)skipAnimation();else endWish();
    }else if(dp.classList.contains('open'))closeD();
  }
});
// Mute toggle
Q('#btn-mute').addEventListener('click',function(){
  S.muted=!S.muted;this.textContent=S.muted?'🔇':'🔊';save();
});

/* ============================================================
   MINIGAME — HAMMER WHACK
============================================================ */
const ALL_CARDS=[...C6,...C5,...C4,...C3];
let mgState={active:false,earned:0,timeLeft:15,timer:null,charTimer:null,_moveTimeout:null};
let quizState={active:false,qIndex:0,score:0,earned:0,questions:[],answered:false};

function openMinigame(){
  if(drawing||mgState.active)return;
  const card=ALL_CARDS[Math.floor(Math.random()*ALL_CARDS.length)];
  Q('#mg-char-img').src=card.img||'';
  Q('#mg-char-img').style.display='';
  mgState={active:true,earned:0,timeLeft:15,timer:null,charTimer:null,_moveTimeout:null};
  Q('#mg-earned').textContent='0';
  Q('#mg-timer').textContent='⏱ 15s';
  Q('#mg-timer').classList.remove('urgent');
  Q('#mg-gameover').classList.remove('show');
  Q('#mg-character').classList.remove('show','hit');
  Q('#minigame-overlay').classList.add('open');
  Q('#mg-hammer').style.display='block';
  moveCharacter();
  mgState.timer=setInterval(()=>{
    mgState.timeLeft--;
    Q('#mg-timer').textContent='⏱ '+mgState.timeLeft+'s';
    if(mgState.timeLeft<=5)Q('#mg-timer').classList.add('urgent');
    if(mgState.timeLeft<=0)endMinigame();
  },1000);
  mgState.charTimer=setInterval(()=>{if(mgState.active)moveCharacter()},900);
  sndButton();
}

function closeMinigame(keepCursor){
  mgState.active=false;
  clearInterval(mgState.timer);clearInterval(mgState.charTimer);
  clearTimeout(mgState._moveTimeout);
  Q('#minigame-overlay').classList.remove('open');
  Q('#mg-hammer').style.display='none';
  if(keepCursor!==false){document.body.style.cursor='';var area=Q('#mg-play-area');if(area)area.style.cursor='';}
  creditFate();
}

function endMinigame(){
  mgState.active=false;
  clearInterval(mgState.timer);clearInterval(mgState.charTimer);
  clearTimeout(mgState._moveTimeout);
  Q('#mg-character').classList.remove('show');
  Q('#mg-total').textContent=mgState.earned;
  Q('#mg-gameover').classList.add('show');
  Q('#mg-timer').classList.remove('urgent');
  Q('#mg-hammer').style.display='none'; // [BUGFIX] hide hammer when gameover shows
  document.body.style.cursor='';
  // Restore cursor on play area (CSS cursor:none would override body cursor)
  var area=Q('#mg-play-area'); if(area) area.style.cursor='default';
  creditFate();
  playTone(523,0.15,'sine',0.08);
  setTimeout(()=>playTone(659,0.15,'sine',0.08),150);
  setTimeout(()=>playTone(784,0.2,'sine',0.08),300);
}

function creditFate(){
  if(mgState.earned<=0)return;
  const fc=Q('#fate-num');
  let v=parseInt(fc.textContent)||0;
  fc.textContent=v+mgState.earned;
  fc.classList.remove('bump');void fc.offsetWidth;fc.classList.add('bump');
  save();
}

/* ============================================================
   QUIZ CHALLENGE
============================================================ */
function openQuiz(){
  if(drawing||quizState.active)return;
  // Build quiz: Q1 fixed + 9 random from bank
  var pool=QUIZ_BANK.slice();
  for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=pool[i];pool[i]=pool[j];pool[j]=t}
  var selected=pool.slice(0,9);
  selected.unshift(QUIZ_Q1); // Q1 always first
  quizState={active:true,qIndex:0,score:0,earned:0,questions:selected,answered:false};
  Q('#quiz-overlay').classList.add('open');
  Q('#quiz-score').textContent='得分: 0';
  renderQuizQuestion();
}

function closeQuiz(){
  quizState.active=false;
  Q('#quiz-overlay').classList.remove('open');
  if(quizState.earned>0){creditQuizFate();save();}
}

function creditQuizFate(){
  if(quizState.earned<=0)return;
  var fc=Q('#fate-num');
  var v=parseInt(fc.textContent)||0;
  fc.textContent=v+quizState.earned;
  fc.classList.remove('bump');void fc.offsetWidth;fc.classList.add('bump');
}

function renderQuizQuestion(){
  var q=quizState.questions[quizState.qIndex];
  var total=quizState.questions.length;
  Q('#quiz-progress').textContent='第 '+(quizState.qIndex+1)+'/'+total+' 题';
  var labels=['A','B','C','D'];
  var html='<div class="quiz-question-card">';
  html+='<div class="quiz-q-num">▸ QUESTION '+(quizState.qIndex+1)+' / '+total+'</div>';
  html+='<div class="quiz-q-text">'+q[0]+'</div>';
  html+='<div class="quiz-options">';
  for(var i=0;i<4;i++){
    html+='<button class="quiz-opt" data-idx="'+i+'" onclick="selectAnswer('+i+')">';
    html+='<span class="opt-label">'+labels[i]+'</span>';
    html+='<span>'+q[i+1]+'</span></button>';
  }
  html+='</div>';
  html+='<div class="quiz-feedback" id="quiz-feedback"></div>';
  html+='<button class="quiz-next-btn" id="quiz-next-btn" onclick="nextQuestion()">下一题 ▸</button>';
  html+='</div>';
  Q('#quiz-body').innerHTML=html;
  quizState.answered=false;
  Q('#quiz-next-btn').classList.remove('show');
}

function selectAnswer(idx){
  if(quizState.answered)return;
  quizState.answered=true;
  var q=quizState.questions[quizState.qIndex];
  var correct=q[5]-1;
  var opts=document.querySelectorAll('.quiz-opt');
  var fb=Q('#quiz-feedback');
  // Highlight correct answer
  opts[correct].classList.add('correct');
  if(idx===correct){
    quizState.score++;
    quizState.earned+=10;
    Q('#quiz-score').textContent='得分: '+quizState.score;
    fb.textContent='✓ 正确！+10 抽';
    fb.className='quiz-feedback correct-fb';
    try{playTone(880,0.1,'sine',0.06);setTimeout(function(){playTone(1100,0.1,'sine',0.06)},100);setTimeout(function(){playTone(1320,0.15,'sine',0.06)},200)}catch(e){}
  }else{
    opts[idx].classList.add('wrong');
    fb.textContent='✗ 错误。正确答案是 '+['A','B','C','D'][correct];
    fb.className='quiz-feedback wrong-fb';
    try{playTone(200,0.3,'triangle',0.06)}catch(e){}
  }
  // Disable all options
  opts.forEach(function(o){o.disabled=true});
  Q('#quiz-next-btn').classList.add('show');
}

function nextQuestion(){
  quizState.qIndex++;
  if(quizState.qIndex>=quizState.questions.length){
    showQuizResult();
  }else{
    renderQuizQuestion();
  }
}

function showQuizResult(){
  var total=quizState.questions.length;
  // Update cumulative stats
  try{
    var stats=JSON.parse(localStorage.getItem('quiz-stats')||'{"totalQ":0,"totalC":0,"games":0,"highScore":0}');
    stats.totalQ=(stats.totalQ||0)+total;
    stats.totalC=(stats.totalC||0)+quizState.score;
    stats.games=(stats.games||0)+1;
    if(quizState.score>(stats.highScore||0))stats.highScore=quizState.score;
    localStorage.setItem('quiz-stats',JSON.stringify(stats));
    // Push to cloud leaderboard (GitHub users only)
    try{
      var gh=JSON.parse(sessionStorage.getItem('gh_user')||'null');
      if(gh&&gh.login){
        var WORKER_URL=('https://xlab-auth.xlab-stellarvault.workers.dev');
        fetch(WORKER_URL+'/api/leaderboard',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({login:gh.login,avatar:gh.avatar_url,quizStats:stats})
        }).catch(function(){});
      }
    }catch(e){}
  }catch(e){}
  var html='<div class="quiz-result-card">';
  html+='<h3>答题结束 ✦</h3>';
  html+='<div class="quiz-result-score">'+quizState.score+'<span> / '+total+'</span></div>';
  html+='<div class="quiz-result-fate">获得 <b>'+quizState.earned+'</b> 纠缠之缘</div>';
  // Cumulative stats
  try{
    var s=JSON.parse(localStorage.getItem('quiz-stats')||'{}');
    html+='<div style="margin:8px 0 16px;padding:10px;border-radius:10px;background:rgba(255,255,255,0.03);font-size:0.7rem;color:var(--t2);line-height:1.8">';
    html+='累计答题 <b style=\"color:var(--g3)\">'+(s.totalQ||0)+'</b> 题 · ';
    html+='正确 <b style=\"color:#66ff99\">'+(s.totalC||0)+'</b> 题 · ';
    html+='最高分 <b style=\"color:var(--gold)\">'+(s.highScore||0)+'</b>/10 · ';
    html+='游戏 <b style=\"color:#99ddff\">'+(s.games||0)+'</b> 次';
    html+='</div>';
  }catch(e){}
  html+='<div class="quiz-result-actions">';
  html+='<button class="quiz-btn-retry" onclick="openQuiz()">再来一次</button>';
  html+='<button class="quiz-btn-exit" onclick="closeQuiz()">退出</button>';
  html+='</div></div>';
  Q('#quiz-body').innerHTML=html;
  Q('#quiz-progress').textContent='答题完成';
}

// Quiz close button
Q('#quiz-close').addEventListener('click',closeQuiz);
// Export to global scope for onclick handlers in dynamic HTML
window.openQuiz=openQuiz;window.closeQuiz=closeQuiz;
window.selectAnswer=selectAnswer;window.nextQuestion=nextQuestion;

/* ============================================================
   STARDUST DISPLAY & SHOP
============================================================ */
function updateStardust(){
  var el=Q('#stardust-num');if(el)el.textContent=S.stardust||0;
  var bal=Q('#shop-balance-num');if(bal)bal.textContent=S.stardust||0;
}

// Shop items
var SHOP_ITEMS=[
  {id:'fate1',name:'纠缠之缘 ×1',desc:'单次祈愿',icon:'🌠',price:15,action:function(){addFates(1)}},
  {id:'fate5',name:'纠缠之缘 ×5',desc:'五次祈愿（优惠）',icon:'🌟',price:65,action:function(){addFates(5)}},
  {id:'fate10',name:'纠缠之缘 ×10',desc:'十连祈愿（优惠）',icon:'✨',price:120,action:function(){addFates(10)}},
];
function addFates(n){
  var fc=Q('#fate-num');var v=parseInt(fc.textContent)||0;
  fc.textContent=v+n;
  fc.classList.remove('bump');void fc.offsetWidth;fc.classList.add('bump');
}

function openShop(){
  if(drawing||mgState.active||quizState.active)return;
  updateStardust();
  Q('#shop-overlay').classList.add('open');
  renderShopItems();
}
function closeShop(){Q('#shop-overlay').classList.remove('open')}

function renderShopItems(){
  var html='';
  SHOP_ITEMS.forEach(function(item){
    var canBuy=(S.stardust||0)>=item.price;
    html+='<div class="shop-item">';
    html+='<div class="shop-item-icon">'+item.icon+'</div>';
    html+='<div class="shop-item-info"><div class="shop-item-name">'+item.name+'</div><div class="shop-item-desc">'+item.desc+'</div></div>';
    html+='<div class="shop-item-price">'+item.price+' ✦</div>';
    html+='<button class="shop-item-btn" onclick="buyShopItem(\''+item.id+'\')" '+(canBuy?'':'disabled')+'>兑换</button>';
    html+='</div>';
  });
  Q('#shop-items').innerHTML=html;
}
window.buyShopItem=function(id){
  var item=SHOP_ITEMS.find(function(i){return i.id===id});
  if(!item)return;
  if((S.stardust||0)<item.price)return;
  S.stardust-=item.price;
  item.action();
  updateStardust();
  renderShopItems();
  save();
  try{playTone(660,0.1,'sine',0.06);setTimeout(function(){playTone(880,0.15,'sine',0.06)},100)}catch(e){}
  showToast('兑换成功！获得 '+item.name);
};

// Wire up shop open/close (guarded)
try{
  var be=Q('#btn-exchange');if(be)be.addEventListener('click',openShop);
  var sc=Q('#shop-close');if(sc)sc.addEventListener('click',closeShop);
  var so2=Q('#shop-overlay');if(so2)so2.addEventListener('click',function(e){if(e.target===so2)closeShop()});
}catch(e){console.warn('shop bindings:',e)}
// Init stardust display on load
try{updateStardust()}catch(e){console.warn('updateStardust:',e)}

function moveCharacter(){
  const area=Q('#mg-play-area');
  const rect=area.getBoundingClientRect();
  const margin=100;
  const x=margin+Math.random()*(rect.width-margin*2);
  const y=margin+Math.random()*(rect.height-margin*2);
  const el=Q('#mg-character');
  el.classList.remove('show','hit');
  void el.offsetWidth;
  el.style.left=x+'px';el.style.top=y+'px';
  el.classList.add('show');
}

function handleWhack(cx,cy){
  if(!mgState.active)return;
  const hammer=Q('#mg-hammer');
  hammer.classList.add('swing');
  setTimeout(()=>hammer.classList.remove('swing'),100);
  const charEl=Q('#mg-character');
  if(!charEl.classList.contains('show'))return;
  const cr=charEl.getBoundingClientRect();
  const ccx=cr.left+cr.width/2,ccy=cr.top+cr.height/2;
  const dist=Math.hypot(cx-ccx,cy-ccy);
  const hitR=cr.width*0.52;
  if(dist<hitR){
    mgState.earned+=10;
    Q('#mg-earned').textContent=mgState.earned;
    charEl.classList.add('hit');
    setTimeout(()=>charEl.classList.remove('hit'),150);
    const pop=document.createElement('div');pop.className='mg-score-pop';
    pop.textContent='+10';pop.style.left=cx+'px';pop.style.top=cy+'px';
    Q('#mg-play-area').appendChild(pop);setTimeout(()=>pop.remove(),1000);
    spP(cx,cy,15,'rgb(255,220,140)',6,0.8);
    playTone(1200,0.06,'square',0.06);
    setTimeout(()=>playTone(1600,0.05,'square',0.04),50);
    clearTimeout(mgState._moveTimeout);
    mgState._moveTimeout=setTimeout(()=>{if(mgState.active)moveCharacter()},400);
    if(navigator.vibrate)navigator.vibrate(20);
  }else{
    const miss=document.createElement('div');miss.className='mg-miss';
    miss.textContent='✗';miss.style.left=cx+'px';miss.style.top=cy+'px';
    Q('#mg-play-area').appendChild(miss);setTimeout(()=>miss.remove(),600);
    playTone(200,0.08,'triangle',0.04);
  }
}

// Hammer tracking + click
document.addEventListener('mousemove',e=>{if(mgState.active){Q('#mg-hammer').style.left=e.clientX+'px';Q('#mg-hammer').style.top=e.clientY+'px'}});
document.addEventListener('click',e=>{if(mgState.active)handleWhack(e.clientX,e.clientY)});
document.addEventListener('touchmove',e=>{if(mgState.active){Q('#mg-hammer').style.left=e.touches[0].clientX+'px';Q('#mg-hammer').style.top=e.touches[0].clientY+'px'}},{passive:true});
document.addEventListener('touchstart',e=>{if(mgState.active)handleWhack(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});

// Game choice: hammer or quiz
function openGameChoice(){
  if(drawing||mgState.active||quizState.active)return;
  Q('#game-choice-overlay').classList.add('open');
}
function closeGameChoice(){Q('#game-choice-overlay').classList.remove('open')}
Q('#btn-minigame').addEventListener('click',openGameChoice);
Q('#btn-choice-hammer').addEventListener('click',()=>{closeGameChoice();openMinigame();});
Q('#btn-choice-quiz').addEventListener('click',()=>{closeGameChoice();openQuiz();});
Q('#btn-choice-close').addEventListener('click',closeGameChoice);
Q('#game-choice-overlay').addEventListener('click',e=>{if(e.target===Q('#game-choice-overlay'))closeGameChoice()});

Q('#mg-close').addEventListener('click',()=>closeMinigame(true));
Q('#mg-replay').addEventListener('click',()=>{closeMinigame(false);setTimeout(openMinigame,350)});
// ESC: close minigame/quiz > skip wish animation
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(quizState.active){closeQuiz();return;}
  if(mgState.active){closeMinigame(true);return;}
  if(drawing||wishStage.classList.contains('active')){skipAnimation();return;}
  var so=Q('#shop-overlay');if(so&&so.classList.contains('open')){closeShop();return;}
});

/* ============================================================
   PERSISTENCE
============================================================ */
function load(){
  try{
    const d=JSON.parse(localStorage.getItem('wish_genshin_v5'));
    if(d){S.total=d.td||0;S.hist=d.hi||[];S.bn=d.bn||0;S.muted=d.mu||false;S.stardust=d.sd||0;
      const a=v=>Array.isArray(v)?v:[v||0,v||0,v||0];
      const ag=v=>Array.isArray(v)?v:[!!v,false,false];
      S.p5=a(d.p5);S.p4=a(d.p4);S.p6=a(d.p6);S.guar=ag(d.gu);
    }
  }catch(e){}
}
function save(){
  try{localStorage.setItem('wish_genshin_v5',JSON.stringify({td:S.total,p5:S.p5,p4:S.p4,p6:S.p6,gu:S.guar,hi:S.hist.slice(-500),bn:S.bn,mu:S.muted,sd:S.stardust||0}))}catch(e){}
  if(window.SyncVault) SyncVault.autoSync();
}

/* ============================================================
   TOAST
============================================================ */
function showToast(m){
  const e=document.querySelector('.toast');if(e)e.remove();
  const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);
  setTimeout(()=>t.remove(),2600);
}

/* ============================================================
   LOOP & INIT
============================================================ */
window.addEventListener('resize',()=>{initSF();rPC()});
let lt=0;
function loop(t){
  const dt=Math.min((t-lt)/1000,0.1);lt=t;
  upP(dt);drP();drawSF(t);
  requestAnimationFrame(loop);
}
function loadCommunityCards(cb){
  var WORKER_URL='https://xlab-auth.xlab-stellarvault.workers.dev';
  fetch(WORKER_URL+'/api/cards').then(function(r){return r.json()}).then(function(data){
    var cards=data.cards||[];
    cards.forEach(function(c){
      var arr;
      if(c.rarity===6)arr=C6;
      else if(c.rarity===5)arr=C5;
      else if(c.rarity===4)arr=C4;
      else arr=C3;
      // Avoid duplicates
      var exists=arr.some(function(x){return x.id===c.id});
      if(!exists)arr.push(c);
    });
    console.log('[Community] Loaded '+cards.length+' approved cards');
  }).catch(function(e){console.warn('[Community] Failed to load cards:',e)})
  .finally(function(){if(cb)cb()});
}

function init(){
  // Populate traveler badge from xlab-profile or GitHub
  (function(){
    var a=document.getElementById('tb-avatar');
    var n=document.getElementById('tb-name');
    if(!a||!n)return;
    var gh=sessionStorage.getItem('gh_user');
    if(gh){try{gh=JSON.parse(gh);}catch(e){gh=null}}
    if(gh){
      var img=document.createElement('img');
      img.src=gh.avatar_url;img.style.width='20px';img.style.height='20px';img.style.borderRadius='50%';img.style.display='block';img.style.flexShrink='0';
      a.textContent='';a.appendChild(img);a.style.display='inline-flex';a.style.alignItems='center';a.style.justifyContent='center';a.style.padding='0';a.style.flexShrink='0';
      n.textContent=gh.login;
      return;
    }
    var p;try{p=JSON.parse(localStorage.getItem('xlab-profile'));}catch(e){}
    if(!p)return;
    var av={stellar:'✦',moon:'☾',comet:'☄',nova:'✧',galaxy:'◈',astronaut:'◆'};
    a.textContent=av[p.avatar]||'✦';n.textContent=p.name;
  })();
  loadCommunityCards(function(){
    initSF();rPC();load();
  // [DAILY] consume reward queue from daily.html
  try{
    const q=JSON.parse(localStorage.getItem('wish_daily_queue')||'[]');
    if(q.length){
      const fc=Q('#fate-num');let v=parseInt(fc.textContent)||0;
      q.forEach(r=>{v+=r.amount||0});
      fc.textContent=v;localStorage.setItem('wish_daily_queue','[]');
    }
  }catch(e){}
  Q('#btn-mute').textContent=S.muted?'🔇':'🔊';
  renderTabs();updateAll();
  requestAnimationFrame(loop);
  });
}
init();
// Auto-open quiz if arrived from quiz portal
if(/[?&]mode=quiz/.test(location.search)){setTimeout(openQuiz,600);}
})();
