/* Dungeon Echo unified art runtime v3.
 * Presentation-only atlas bridge for the 2026-08-29 art pass.
 *
 * Owns visual replacement only:
 * - 31 loot/equipment cells;
 * - 4 classes x 4 action states;
 * - deep/elite monster atlas coverage;
 * - dungeon interaction + ambient props;
 * - nine bespoke guardian looks and a new floor-100 final boss.
 *
 * Combat, RNG, collision, item identity, saves and progression stay in core game code.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_ART_RUNTIME_V2) return;

  const scriptSrc = document.currentScript && document.currentScript.src || '';
  const assetUrl = name => {
    try { return new URL(`../../art/runtime/${name}`, scriptSrc || location.href).href; }
    catch (e) { return `art/runtime/${name}`; }
  };
  const ASSET_DATA = Object.freeze({
    loot: assetUrl('loot-atlas-v2.svg'),
    monster: assetUrl('monster-deep-atlas-v2.svg'),
    hero: assetUrl('hero-action-atlas-v2.svg'),
    props: assetUrl('dungeon-props-atlas-v1.svg'),
    guardian: assetUrl('boss-guardian-atlas-v3.png'),
    finalBoss: assetUrl('final-boss-v3.png'),
  });

  const HERO_ROWS = Object.freeze({ warrior:0, ranger:1, mage:2, assassin:3 });
  const HERO_STATE = Object.freeze({ idle:0, attack:1, hurt:2, skill:3 });
  const MONSTER_ART = Object.freeze({
    abomination:{ cell:0, min:20 },
    seraph:{ cell:1, min:24 },
    voidspawn:{ cell:2, min:26 },
    voidlord:{ cell:3, min:35 },
    frostmage:{ cell:4, min:13 },
    golem:{ cell:5, min:16 },
    spider:{ cell:7, min:12 },
    cultist:{ cell:8, min:8 },
    skeleton:{ cell:9, min:15 },
    ghost:{ cell:11, min:7 },
    vampire:{ cell:12, min:17 },
    demon:{ cell:13, min:12 },
    dragonkin:{ cell:14, min:22 },
    wraith:{ cell:15, min:13 },
  });
  const GUARDIAN_CELL = Object.freeze({
    10:3,
    20:4,
    30:5,
    40:8,
    50:1,
    60:13,
    70:9,
    80:6,
    90:14,
  });
  const PROP = Object.freeze({
    wallTorch:0, bonePile:1, runeObelisk:2, woodCrate:3, woodBarrel:4, lanternPost:5,
    webNest:6, iceCrystal:7, redMushroom:8, lavaVent:9, voidRift:10, bloodAltar:11,
    ironGate:12, dungeonEntry:13, townPortal:14, campfire:15, bountyBoard:16,
    treasureChest:17, mimicChest:18, forgeAnvil:19, alchemyTable:20, marketStall:21,
    angelShrine:22, arcaneCrystal:23,
  });
  const AMBIENT_BANDS = Object.freeze([
    [PROP.bonePile, PROP.woodCrate, PROP.woodBarrel],
    [PROP.bonePile, PROP.iceCrystal, PROP.runeObelisk],
    [PROP.runeObelisk, PROP.redMushroom, PROP.lavaVent],
    [PROP.webNest, PROP.voidRift, PROP.bloodAltar],
    [PROP.voidRift, PROP.arcaneCrystal, PROP.bloodAltar],
  ]);

  const FOV_R = 7;
  const WALL = 0;
  const FLOOR = 1;

  const imageFrom = src => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    return img;
  };
  const images = Object.fromEntries(
    Object.entries(ASSET_DATA).map(([key,src]) => [key,imageFrom(src)])
  );
  const imageReady = img => !!img && img.complete && Number(img.naturalWidth) > 4;

  function boot(attempt = 0) {
    const api = window.DE_TEST;
    const game = document.getElementById('game');
    const stage = document.getElementById('stage');
    if ((!api || api.profileId !== 'classic-100' || !game || !stage) && attempt < 180) {
      setTimeout(() => boot(attempt + 1), 50);
      return;
    }
    if (!api || api.profileId !== 'classic-100' || !game || !stage || typeof game.getContext !== 'function') return;

    const style = document.createElement('style');
    style.id = 'de-art-runtime-v3-style';
    style.textContent = `
      .loot-icon{
        background-image:url("${ASSET_DATA.loot}")!important;
        background-size:400% 800%!important;
        background-position:calc(var(--ix) * 33.333333%) calc(var(--iy) * 14.285714%)!important;
        background-repeat:no-repeat!important;
      }
      #de-art-runtime-v3{
        position:absolute;inset:0;width:100%;height:auto;pointer-events:none;z-index:3;
        image-rendering:auto;
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('canvas');
    overlay.id = 'de-art-runtime-v3';
    overlay.setAttribute('aria-hidden','true');
    stage.appendChild(overlay);
    const ctx = overlay.getContext('2d', { alpha:true });
    if (!ctx) return;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const reduceMotion = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastDraw = 0;
    let lastSkillCd = 0;
    let skillUntil = 0;
    let idleTimer = 0;

    function syncCanvas() {
      const w = Number(game.width) || 1280;
      const h = Number(game.height) || 896;
      if (overlay.width !== w) overlay.width = w;
      if (overlay.height !== h) overlay.height = h;
    }

    function dims() {
      const grid = api.mapGrid;
      const mapCols = Array.isArray(grid) && grid[0] ? grid[0].length : 40;
      const mapRows = Array.isArray(grid) ? grid.length : 28;
      const width = Number(game.width) || 1280;
      const height = Number(game.height) || 896;
      const cols = clamp(Math.round(width / 32), 1, mapCols);
      const rows = clamp(Math.round(height / 32), 1, mapRows);
      const p = api.player;
      const px = p && Number.isFinite(Number(p.x)) ? Number(p.x) : 0;
      const py = p && Number.isFinite(Number(p.y)) ? Number(p.y) : 0;
      const vx = clamp(px - Math.floor(cols / 2), 0, Math.max(0, mapCols - cols));
      const vy = clamp(py - Math.floor(rows / 2), 0, Math.max(0, mapRows - rows));
      return {
        grid, mapCols, mapRows, cols, rows, vx, vy, width, height,
        tw:width / Math.max(1, cols), th:height / Math.max(1, rows),
      };
    }

    function pos(entity, d, yBias=.52) {
      if (!entity) return null;
      const x = Number.isFinite(Number(entity.fx)) ? Number(entity.fx) : Number(entity.x);
      const y = Number.isFinite(Number(entity.fy)) ? Number(entity.fy) : Number(entity.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      const sx = (x - d.vx + .5) * d.tw;
      const sy = (y - d.vy + yBias) * d.th;
      if (sx < -d.tw || sy < -d.th || sx > d.width + d.tw || sy > d.height + d.th) return null;
      return {x:sx,y:sy};
    }

    function lineVisible(x0,y0,x1,y1,grid) {
      if (!Array.isArray(grid) || !grid.length) return true;
      let dx=Math.abs(x1-x0), dy=Math.abs(y1-y0);
      const sx=x0<x1?1:-1, sy=y0<y1?1:-1;
      let err=dx-dy, x=x0, y=y0;
      while (!(x===x1 && y===y1)) {
        if (!(x===x0 && y===y0) && grid[y] && grid[y][x]===WALL) return false;
        const e2=2*err;
        if (e2>-dy) { err-=dy; x+=sx; }
        if (e2<dx) { err+=dx; y+=sy; }
      }
      return true;
    }

    function visibleAt(x,y,d) {
      const p=api.player;
      if (!p || !Number.isInteger(x) || !Number.isInteger(y)) return false;
      if (x<0 || y<0 || x>=d.mapCols || y>=d.mapRows) return false;
      if (Math.hypot(x-p.x,y-p.y)>FOV_R+.5) return false;
      return lineVisible(p.x,p.y,x,y,d.grid);
    }

    function cell(image,index,cols,rows,x,y,w,h,opt={}) {
      if (!imageReady(image) || !Number.isInteger(index) || index<0) return false;
      const sw=image.naturalWidth/cols, sh=image.naturalHeight/rows;
      const sx=(index%cols)*sw, sy=Math.floor(index/cols)*sh;
      ctx.save();
      ctx.globalAlpha=opt.alpha==null?1:opt.alpha;
      ctx.imageSmoothingEnabled=true;
      if (opt.shadow!==false) {
        ctx.shadowColor=opt.shadowColor||'rgba(0,0,0,.78)';
        ctx.shadowBlur=opt.shadowBlur==null?6:opt.shadowBlur;
        ctx.shadowOffsetY=2;
      }
      ctx.translate(x,y);
      if (opt.rotation) ctx.rotate(opt.rotation);
      ctx.drawImage(image,sx,sy,sw,sh,-w/2,-h/2,w,h);
      ctx.restore();
      return true;
    }

    function mask(x,y,rx,ry,alpha=.90) {
      const g=ctx.createRadialGradient(x,y,2,x,y,Math.max(rx,ry));
      g.addColorStop(0,`rgba(6,5,7,${alpha})`);
      g.addColorStop(.64,`rgba(6,5,7,${alpha*.72})`);
      g.addColorStop(1,'rgba(6,5,7,0)');
      ctx.fillStyle=g;
      ctx.fillRect(x-rx,y-ry,rx*2,ry*2);
    }

    function hash(x,y,depth) {
      let n=((x+37)*73856093)^((y+71)*19349663)^((depth+17)*83492791);
      n^=n>>>13; n=Math.imul(n,1274126177); n^=n>>>16;
      return n>>>0;
    }

    function drawWallTorches(d) {
      if (!imageReady(images.props) || !Array.isArray(d.grid)) return;
      const depth=Number(api.depth)||1;
      const y0=Math.max(0,d.vy-1), y1=Math.min(d.mapRows-1,d.vy+d.rows);
      const x0=Math.max(0,d.vx-1), x1=Math.min(d.mapCols-1,d.vx+d.cols);
      for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++) {
        if (!d.grid[y] || d.grid[y][x]!==WALL || !visibleAt(x,y,d)) continue;
        if (hash(x,y,depth)%41!==0) continue;
        const nearFloor=
          (d.grid[y-1]&&d.grid[y-1][x]===FLOOR) ||
          (d.grid[y+1]&&d.grid[y+1][x]===FLOOR) ||
          (d.grid[y]&&d.grid[y][x-1]===FLOOR) ||
          (d.grid[y]&&d.grid[y][x+1]===FLOOR);
        if (!nearFloor) continue;
        const q=pos({x,y},d,.48);
        if (q) cell(images.props,PROP.wallTorch,6,4,q.x,q.y,21,28,{alpha:.82,shadowBlur:7});
      }
    }

    function trapCell(depth) {
      if (depth>=75) return PROP.voidRift;
      if (depth>=50) return PROP.lavaVent;
      if (depth>=25) return PROP.iceCrystal;
      return PROP.webNest;
    }

    function drawTraps(d) {
      if (!imageReady(images.props)) return;
      const index=trapCell(Number(api.depth)||1);
      for (const t of api.traps||[]) {
        if (!t || !t.armed || !visibleAt(t.x,t.y,d)) continue;
        const q=pos(t,d,.62);
        if (!q) continue;
        mask(q.x,q.y,19,15,.48);
        cell(images.props,index,6,4,q.x,q.y,31,29,{alpha:.86});
      }
    }

    function lootIndex(icon) {
      const ids=api.lootIconIds;
      return Array.isArray(ids)?ids.indexOf(icon):-1;
    }

    function drawItems(d) {
      for (const it of api.items||[]) {
        if (!it || !visibleAt(it.x,it.y,d)) continue;
        const q=pos(it,d,.54);
        if (!q) continue;
        if (it.type==='chest' && imageReady(images.props)) {
          mask(q.x,q.y,22,18,.72);
          cell(images.props,PROP.treasureChest,6,4,q.x,q.y,38,33,{alpha:.98});
          continue;
        }
        const icon=it.item&&it.item.icon||it.icon;
        const index=lootIndex(icon);
        if (index>=0 && imageReady(images.loot)) {
          mask(q.x,q.y,16,14,.50);
          cell(images.loot,index,4,8,q.x,q.y,28,28,{alpha:.98,shadowBlur:3});
        }
      }
    }

    function propForNpc(type) {
      if (type==='shrine') return PROP.angelShrine;
      if (type==='rest') return PROP.campfire;
      if (type==='shop') return PROP.marketStall;
      return -1;
    }

    function drawNpcs(d) {
      if (!imageReady(images.props)) return;
      for (const n of api.npcs||[]) {
        if (!n || !visibleAt(n.x,n.y,d)) continue;
        const index=propForNpc(n.type);
        if (index<0) continue;
        const q=pos(n,d,.50);
        if (!q) continue;
        mask(q.x,q.y,27,27,.86);
        const size=n.type==='shop'?[52,50]:n.type==='shrine'?[46,55]:[43,42];
        cell(images.props,index,6,4,q.x,q.y,size[0],size[1],{alpha:.99,shadowBlur:5});
      }
    }

    function occupiedCells() {
      const set=new Set();
      const mark=e=>{ if (e && Number.isInteger(e.x) && Number.isInteger(e.y)) set.add(`${e.x},${e.y}`); };
      mark(api.player);
      for (const list of [api.monsters,api.items,api.npcs,api.traps])
        for (const e of list||[]) mark(e);
      return set;
    }

    function ambientBand(depth) {
      if (depth>=80) return AMBIENT_BANDS[4];
      if (depth>=60) return AMBIENT_BANDS[3];
      if (depth>=40) return AMBIENT_BANDS[2];
      if (depth>=20) return AMBIENT_BANDS[1];
      return AMBIENT_BANDS[0];
    }

    function drawAmbientProps(d) {
      if (!imageReady(images.props) || !Array.isArray(d.grid)) return;
      const depth=Number(api.depth)||1;
      const band=ambientBand(depth);
      const occupied=occupiedCells();
      const y0=Math.max(0,d.vy), y1=Math.min(d.mapRows-1,d.vy+d.rows-1);
      const x0=Math.max(0,d.vx), x1=Math.min(d.mapCols-1,d.vx+d.cols-1);
      for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++) {
        if (!d.grid[y] || d.grid[y][x]!==FLOOR || !visibleAt(x,y,d)) continue;
        if (occupied.has(`${x},${y}`)) continue;
        const h=hash(x,y,depth);
        if (h%89!==0) continue;
        const q=pos({x,y},d,.58);
        if (!q) continue;
        const index=band[(h>>>8)%band.length];
        const scale=.72+((h>>>16)%17)/100;
        cell(images.props,index,6,4,q.x,q.y+3,29*scale,28*scale,
          {alpha:.54,shadowBlur:3,rotation:((h>>>24)%7-3)*.018});
      }
    }

    function drawMonsters(d) {
      if (!imageReady(images.monster)) return;
      const depth=Number(api.depth)||1;
      for (const m of api.monsters||[]) {
        if (!m || m.boss || m.midBoss || !visibleAt(m.x,m.y,d)) continue;
        const art=MONSTER_ART[m.sprite];
        if (!art || depth<art.min) continue;
        const q=pos(m,d,.50);
        if (!q) continue;
        const elite=!!m.elite;
        const w=elite?50:44, h=elite?56:49;
        mask(q.x,q.y,w*.64,h*.58,.90);
        cell(images.monster,art.cell,4,4,q.x,q.y,w,h,{alpha:.997,shadowBlur:7});
        if (elite) {
          ctx.save();
          ctx.globalCompositeOperation='lighter';
          ctx.strokeStyle='rgba(235,182,76,.76)';
          ctx.lineWidth=1.7;
          ctx.beginPath();
          ctx.ellipse(q.x,q.y+h*.34,w*.39,5,0,0,Math.PI*2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    function bossAura(q,depth,finalBoss,now,radius) {
      const phase=reduceMotion?0:(Math.sin(now*.0032)+1)*.5;
      const hue=finalBoss?282:(18+(Math.floor(depth/10)*31))%360;
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      const glow=ctx.createRadialGradient(q.x,q.y,3,q.x,q.y,radius*(1.02+phase*.05));
      glow.addColorStop(0,`hsla(${hue},92%,62%,.25)`);
      glow.addColorStop(.54,`hsla(${hue},88%,54%,.11)`);
      glow.addColorStop(1,`hsla(${hue},82%,46%,0)`);
      ctx.fillStyle=glow;
      ctx.beginPath(); ctx.arc(q.x,q.y,radius*1.18,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=`hsla(${hue},92%,66%,${.40+phase*.20})`;
      ctx.lineWidth=finalBoss?2.4:1.7;
      ctx.beginPath(); ctx.ellipse(q.x,q.y+radius*.46,radius*.57,radius*.14,0,0,Math.PI*2); ctx.stroke();
      if (!reduceMotion) {
        ctx.globalAlpha=.42;
        ctx.beginPath(); ctx.ellipse(q.x,q.y+radius*.46,radius*(.68+phase*.04),radius*.18,0,0,Math.PI*2); ctx.stroke();
      }
      ctx.restore();
    }

    function drawBosses(d,now) {
      const depth=Number(api.depth)||1;
      for (const m of api.monsters||[]) {
        if (!m || (!m.boss && !m.midBoss) || !visibleAt(m.x,m.y,d)) continue;
        const q=pos(m,d,.48);
        if (!q) continue;
        if (m.boss && imageReady(images.finalBoss)) {
          const w=104,h=112;
          mask(q.x,q.y,63,62,.975);
          bossAura(q,depth,true,now,54);
          cell(images.finalBoss,0,1,1,q.x,q.y-7,w,h,
            {alpha:1,shadowBlur:14,shadowColor:'rgba(84,24,126,.96)'});
          continue;
        }
        const index=GUARDIAN_CELL[depth];
        if (m.midBoss && index!==undefined && imageReady(images.guardian)) {
          const w=78,h=86;
          mask(q.x,q.y,49,48,.96);
          bossAura(q,depth,false,now,42);
          cell(images.guardian,index,4,4,q.x,q.y-4,w,h,
            {alpha:1,shadowBlur:10,shadowColor:'rgba(0,0,0,.92)'});
        }
      }
    }

    function heroState(p,now) {
      const cd=Number(p.skillCd)||0;
      if (cd>lastSkillCd+.2) skillUntil=now+(reduceMotion?180:360);
      lastSkillCd=cd;
      if ((Number(p.hurtT)||0)>.03) return HERO_STATE.hurt;
      if (now<skillUntil) return HERO_STATE.skill;
      if ((Number(p.lungeT)||0)>.03) return HERO_STATE.attack;
      return HERO_STATE.idle;
    }

    function drawHero(d,now) {
      const p=api.player;
      const row=HERO_ROWS[api.classId];
      if (!p || row===undefined || !imageReady(images.hero) || !visibleAt(p.x,p.y,d)) return;
      const state=heroState(p,now);
      const index=row*4+state;
      const q=pos(p,d,.49);
      if (!q) return;
      const lunge=Math.max(0,Number(p.lungeT)||0);
      const pulse=reduceMotion?0:Math.sin(now*.006)*1.2;
      const w=49+pulse+lunge*2.5, h=61+pulse+lunge*3;
      mask(q.x,q.y,29,34,.92);
      cell(images.hero,index,4,4,q.x,q.y-2,w,h,{alpha:1,shadowBlur:7});
    }

    function render(now) {
      syncCanvas();
      ctx.clearRect(0,0,overlay.width,overlay.height);
      if (api.state!=='playing' || !api.player) return;
      const d=dims();
      drawAmbientProps(d);
      drawWallTorches(d);
      drawTraps(d);
      drawItems(d);
      drawNpcs(d);
      drawMonsters(d);
      drawBosses(d,now);
      drawHero(d,now);
    }

    function loop(now) {
      const interval=reduceMotion?72:33;
      if (now-lastDraw>=interval) {
        lastDraw=now;
        render(now);
      }
      if (api.state==='playing') {
        clearTimeout(idleTimer);
        idleTimer=0;
        requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0,0,overlay.width,overlay.height);
        clearTimeout(idleTimer);
        idleTimer=setTimeout(()=>requestAnimationFrame(loop),220);
      }
    }

    window.__DE_ART_RUNTIME_V2 = {
      version:'v3-unified',
      owner:'presentation',
      gameplayMutation:false,
      lootCells:31,
      heroStates:4,
      monsterDirect:Object.keys(MONSTER_ART).length,
      guardianDirect:Object.keys(GUARDIAN_CELL).length,
      finalBossDirect:1,
      propCells:24,
      ambientDressing:true,
      overlay,
      assetReady:()=>Object.fromEntries(Object.entries(images).map(([k,v])=>[k,imageReady(v)])),
    };
    requestAnimationFrame(loop);
  }

  boot();
})();
