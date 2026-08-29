/* Dungeon Echo class combat FX v1.6.3.
 * Presentation-only directional combat language for all four classes.
 *
 * Reads facing, lunge and skill cooldown transitions from DE_TEST. It does not invoke
 * attacks, spend cooldowns, move the player, consume RNG, write saves or touch combat.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_CLASS_COMBAT_FX_V163) return;

  const CLASS_STYLE = Object.freeze({
    warrior:{ rgb:'236,165,72', soft:'255,213,133' },
    ranger:{ rgb:'104,210,132', soft:'181,242,182' },
    mage:{ rgb:'111,164,255', soft:'190,203,255' },
    assassin:{ rgb:'187,112,235', soft:'244,155,219' },
  });
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));

  function boot(attempt=0) {
    const api=window.DE_TEST;
    const game=document.getElementById('game');
    const stage=document.getElementById('stage');
    if ((!api || api.profileId!=='classic-100' || !game || !stage) && attempt<180) {
      setTimeout(()=>boot(attempt+1),50);
      return;
    }
    if (!api || api.profileId!=='classic-100' || !game || !stage || typeof game.getContext!=='function') return;
    if (document.getElementById('de-class-combat-fx-v163')) return;

    const overlay=document.createElement('canvas');
    overlay.id='de-class-combat-fx-v163';
    overlay.setAttribute('aria-hidden','true');
    overlay.style.cssText='position:absolute;inset:0;width:100%;height:auto;pointer-events:none;z-index:5;image-rendering:auto';
    stage.appendChild(overlay);
    const ctx=overlay.getContext('2d',{alpha:true});
    if (!ctx) return;

    const reduceMotion=typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastDraw=0;
    let idleTimer=0;
    let lastSkillCd=0;
    let skillStartedAt=-Infinity;

    function syncCanvas() {
      const width=Number(game.width)||1280;
      const height=Number(game.height)||896;
      if (overlay.width!==width) overlay.width=width;
      if (overlay.height!==height) overlay.height=height;
      return {width,height};
    }

    function heroPosition() {
      const p=api.player;
      if (!p) return null;
      const grid=api.mapGrid;
      const mapCols=Array.isArray(grid)&&grid[0]?grid[0].length:40;
      const mapRows=Array.isArray(grid)?grid.length:28;
      const {width,height}=syncCanvas();
      const cols=clamp(Math.round(width/32),1,mapCols);
      const rows=clamp(Math.round(height/32),1,mapRows);
      const px=Number.isFinite(Number(p.x))?Number(p.x):0;
      const py=Number.isFinite(Number(p.y))?Number(p.y):0;
      const vx=clamp(px-Math.floor(cols/2),0,Math.max(0,mapCols-cols));
      const vy=clamp(py-Math.floor(rows/2),0,Math.max(0,mapRows-rows));
      const tw=width/Math.max(1,cols), th=height/Math.max(1,rows);
      const fx=Number.isFinite(Number(p.fx))?Number(p.fx):px;
      const fy=Number.isFinite(Number(p.fy))?Number(p.fy):py;
      return {x:(fx-vx+.5)*tw,y:(fy-vy+.49)*th,tw,th,p};
    }

    function facing(p) {
      const f=Array.isArray(p&&p.facing)?p.facing:[1,0];
      let dx=Number(f[0])||0, dy=Number(f[1])||0;
      if (!dx&&!dy) dx=1;
      const len=Math.hypot(dx,dy)||1;
      return {dx:dx/len,dy:dy/len,angle:Math.atan2(dy,dx)};
    }

    function strokeArc(q,f,radius,start,end,rgb,alpha,width=2) {
      ctx.save();
      ctx.translate(q.x,q.y-3);
      ctx.rotate(f.angle);
      ctx.strokeStyle=`rgba(${rgb},${alpha})`;
      ctx.lineWidth=width;
      ctx.lineCap='round';
      ctx.shadowColor=`rgba(${rgb},${Math.min(.8,alpha+.18)})`;
      ctx.shadowBlur=7;
      ctx.beginPath();
      ctx.arc(0,0,radius,start,end);
      ctx.stroke();
      ctx.restore();
    }

    function warriorFx(q,f,attack,skill,phase,style) {
      if (attack>.02) {
        const reach=23+attack*8;
        strokeArc(q,f,reach,-.78,.78,style.rgb,.35+attack*.42,2.1+attack*1.2);
      }
      if (skill>0) {
        strokeArc(q,f,31+phase*3,-1.05,1.05,style.soft,.58*(1-skill*.35),3.1);
        strokeArc(q,f,24+phase*2,-.88,.88,style.rgb,.72*(1-skill*.4),1.6);
      }
    }

    function rangerFx(q,f,attack,skill,phase,style) {
      ctx.save();
      ctx.translate(q.x,q.y-4);
      ctx.rotate(f.angle);
      ctx.lineCap='round';
      if (attack>.02) {
        ctx.strokeStyle=`rgba(${style.rgb},${.34+attack*.34})`;
        ctx.lineWidth=1.3;
        ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(27+attack*7,0); ctx.stroke();
      }
      if (skill>0) {
        const fade=1-skill*.52;
        for (let i=-1;i<=1;i++) {
          const off=i*6;
          ctx.strokeStyle=`rgba(${style.soft},${(.38-Math.abs(i)*.07)*fade})`;
          ctx.lineWidth=i===0?2.2:1.2;
          ctx.beginPath();
          ctx.moveTo(-19-phase*5,off);
          ctx.lineTo(19+phase*13,off*.48);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    function mageFx(q,f,attack,skill,phase,style,now) {
      if (attack>.02) {
        ctx.save();
        ctx.globalCompositeOperation='lighter';
        const x=q.x+f.dx*(19+attack*5), y=q.y-5+f.dy*(12+attack*4);
        const g=ctx.createRadialGradient(x,y,1,x,y,8+attack*3);
        g.addColorStop(0,`rgba(${style.soft},${.62+attack*.2})`);
        g.addColorStop(.45,`rgba(${style.rgb},${.34+attack*.2})`);
        g.addColorStop(1,`rgba(${style.rgb},0)`);
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,10+attack*3,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      if (skill>0) {
        const fade=1-skill*.46;
        ctx.save();
        ctx.translate(q.x,q.y-4);
        ctx.rotate(reduceMotion?0:now*.0018);
        ctx.strokeStyle=`rgba(${style.rgb},${.55*fade})`;
        ctx.lineWidth=1.35;
        ctx.beginPath(); ctx.arc(0,0,21+phase*5,0,Math.PI*2); ctx.stroke();
        ctx.rotate(Math.PI/4);
        ctx.strokeStyle=`rgba(${style.soft},${.38*fade})`;
        ctx.strokeRect(-11-phase*2,-11-phase*2,22+phase*4,22+phase*4);
        ctx.restore();
      }
    }

    function assassinFx(q,f,attack,skill,phase,style) {
      ctx.save();
      ctx.translate(q.x,q.y-3);
      ctx.rotate(f.angle);
      if (attack>.02) {
        ctx.strokeStyle=`rgba(${style.soft},${.28+attack*.5})`;
        ctx.lineWidth=1.7;
        ctx.shadowColor=`rgba(${style.rgb},.65)`;
        ctx.shadowBlur=6;
        ctx.beginPath();
        ctx.moveTo(-8,-13); ctx.lineTo(20+attack*8,9);
        ctx.moveTo(-5,12); ctx.lineTo(18+attack*6,-8);
        ctx.stroke();
      }
      if (skill>0) {
        const fade=1-skill*.52;
        for (let i=0;i<3;i++) {
          const back=14+i*10+phase*7;
          ctx.fillStyle=`rgba(${style.rgb},${(.19-i*.035)*fade})`;
          ctx.beginPath();
          ctx.moveTo(-back,-15+i*3);
          ctx.lineTo(-back+16,0);
          ctx.lineTo(-back,-0+i*4);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function drawFacingTick(q,f,style,activity) {
      if (activity<=.01) return;
      ctx.save();
      ctx.strokeStyle=`rgba(${style.rgb},${.18+activity*.18})`;
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(q.x+f.dx*14,q.y+17+f.dy*4);
      ctx.lineTo(q.x+f.dx*21,q.y+17+f.dy*6);
      ctx.stroke();
      ctx.restore();
    }

    function render(now) {
      const {width,height}=syncCanvas();
      ctx.clearRect(0,0,width,height);
      if (api.state!=='playing' || !api.player) return;
      const q=heroPosition();
      if (!q) return;

      const p=q.p;
      const classId=String(api.classId||'warrior');
      const style=CLASS_STYLE[classId]||CLASS_STYLE.warrior;
      const f=facing(p);
      const currentCd=Math.max(0,Number(p.skillCd)||0);
      if (currentCd>lastSkillCd+.2) skillStartedAt=now;
      lastSkillCd=currentCd;

      const attack=clamp(Number(p.lungeT)||0,0,1);
      const skillDuration=reduceMotion?260:470;
      const elapsed=now-skillStartedAt;
      const skill=elapsed>=0&&elapsed<skillDuration?elapsed/skillDuration:0;
      const skillActive=elapsed>=0&&elapsed<skillDuration;
      const phase=reduceMotion?.35:(Math.sin(now*.007)+1)*.5;

      drawFacingTick(q,f,style,Math.max(attack,skillActive?.8:0));
      if (classId==='warrior') warriorFx(q,f,attack,skillActive?skill:0,phase,style);
      else if (classId==='ranger') rangerFx(q,f,attack,skillActive?skill:0,phase,style);
      else if (classId==='mage') mageFx(q,f,attack,skillActive?skill:0,phase,style,now);
      else assassinFx(q,f,attack,skillActive?skill:0,phase,style);
    }

    function loop(now) {
      const interval=reduceMotion?72:33;
      if (now-lastDraw>=interval) { lastDraw=now; render(now); }
      if (api.state==='playing') {
        clearTimeout(idleTimer); idleTimer=0; requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0,0,overlay.width,overlay.height);
        clearTimeout(idleTimer);
        idleTimer=setTimeout(()=>requestAnimationFrame(loop),220);
      }
    }

    window.__DE_CLASS_COMBAT_FX_V163={
      version:'1.6.3',
      owner:'presentation',
      gameplayMutation:false,
      classes:Object.keys(CLASS_STYLE),
      directional:true,
      skillCooldownReadOnly:true,
      overlay,
    };
    requestAnimationFrame(loop);
  }

  boot();
})();
