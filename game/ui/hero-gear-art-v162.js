/* Dungeon Echo hero gear art v1.6.2.
 * Presentation-only equipment feedback layered over the unified hero atlas.
 *
 * Reads the equipped item model but never mutates equipment, combat, RNG, saves,
 * progression or collision. Visual language stays deliberately compact so gear
 * upgrades are readable without covering the tactical grid.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_HERO_GEAR_ART_V162) return;

  const scriptSrc = document.currentScript && document.currentScript.src || '';
  const runtimeAsset = name => {
    try { return new URL(`../../art/runtime/${name}`, scriptSrc || location.href).href; }
    catch (_err) { return `art/runtime/${name}`; }
  };

  const LOOT_ATLAS = runtimeAsset('loot-atlas-v2.svg');
  const RARITY = Object.freeze([
    { color:'#c9d4e3', glow:'201,212,227' },
    { color:'#7dd87d', glow:'125,216,125' },
    { color:'#5aa7e8', glow:'90,167,232' },
    { color:'#b07de8', glow:'176,125,232' },
    { color:'#eda23a', glow:'237,162,58' },
  ]);
  const SLOTS = Object.freeze(['weapon','armor','helmet','boots','ring','amulet']);
  const DEFENSE_SLOTS = Object.freeze(['armor','helmet','boots']);
  const ACCESSORY_SLOTS = Object.freeze(['ring','amulet']);

  const loot = new Image();
  loot.decoding = 'async';
  loot.src = LOOT_ATLAS;
  const imageReady = image => !!image && image.complete && Number(image.naturalWidth) > 4;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rarityOf = item => clamp(Math.floor(Number(item && item.rarity) || 0), 0, 4);
  const forgeOf = item => clamp(Math.floor(Number(item && item.forge) || 0), 0, 5);

  function boot(attempt = 0) {
    const api = window.DE_TEST;
    const game = document.getElementById('game');
    const stage = document.getElementById('stage');
    if ((!api || api.profileId !== 'classic-100' || !game || !stage) && attempt < 180) {
      setTimeout(() => boot(attempt + 1), 50);
      return;
    }
    if (!api || api.profileId !== 'classic-100' || !game || !stage || typeof game.getContext !== 'function') return;

    const existing = document.getElementById('de-hero-gear-art-v162');
    if (existing) return;

    const overlay = document.createElement('canvas');
    overlay.id = 'de-hero-gear-art-v162';
    overlay.setAttribute('aria-hidden','true');
    overlay.style.cssText = 'position:absolute;inset:0;width:100%;height:auto;pointer-events:none;z-index:4;image-rendering:auto';
    stage.appendChild(overlay);
    const ctx = overlay.getContext('2d', { alpha:true });
    if (!ctx) return;

    const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastDraw = 0;
    let idleTimer = 0;

    function syncCanvas() {
      const width = Number(game.width) || 1280;
      const height = Number(game.height) || 896;
      if (overlay.width !== width) overlay.width = width;
      if (overlay.height !== height) overlay.height = height;
      return { width, height };
    }

    function heroPosition() {
      const p = api.player;
      if (!p) return null;
      const grid = api.mapGrid;
      const mapCols = Array.isArray(grid) && grid[0] ? grid[0].length : 40;
      const mapRows = Array.isArray(grid) ? grid.length : 28;
      const { width, height } = syncCanvas();
      const cols = clamp(Math.round(width / 32), 1, mapCols);
      const rows = clamp(Math.round(height / 32), 1, mapRows);
      const px = Number.isFinite(Number(p.x)) ? Number(p.x) : 0;
      const py = Number.isFinite(Number(p.y)) ? Number(p.y) : 0;
      const vx = clamp(px - Math.floor(cols / 2), 0, Math.max(0, mapCols - cols));
      const vy = clamp(py - Math.floor(rows / 2), 0, Math.max(0, mapRows - rows));
      const tw = width / Math.max(1, cols);
      const th = height / Math.max(1, rows);
      const fx = Number.isFinite(Number(p.fx)) ? Number(p.fx) : px;
      const fy = Number.isFinite(Number(p.fy)) ? Number(p.fy) : py;
      return {
        x:(fx - vx + .5) * tw,
        y:(fy - vy + .49) * th,
        tw, th, p,
      };
    }

    function gearSummary(p) {
      const equip = p && p.equip && typeof p.equip === 'object' ? p.equip : {};
      const equipped = SLOTS.map(slot => equip[slot]).filter(Boolean);
      const defensive = DEFENSE_SLOTS.map(slot => equip[slot]).filter(Boolean);
      const accessories = ACCESSORY_SLOTS.map(slot => equip[slot]).filter(Boolean);
      const maxRarity = equipped.reduce((m,it) => Math.max(m,rarityOf(it)), 0);
      const defenseRarity = defensive.reduce((m,it) => Math.max(m,rarityOf(it)), -1);
      const accessoryRarity = accessories.reduce((m,it) => Math.max(m,rarityOf(it)), -1);
      const maxForge = equipped.reduce((m,it) => Math.max(m,forgeOf(it)), 0);
      const totalForge = equipped.reduce((sum,it) => sum + forgeOf(it), 0);
      const mechanicCount = equipped.reduce((n,it) => n + (it && it.mechanic ? 1 : 0), 0);
      return {
        equip, equipped, defensive, accessories,
        weapon:equip.weapon || null,
        maxRarity, defenseRarity, accessoryRarity,
        maxForge, totalForge, mechanicCount,
      };
    }

    function rarityStyle(index) {
      return RARITY[clamp(index,0,RARITY.length-1)];
    }

    function drawGroundAura(q, gear, now) {
      if (gear.maxRarity < 2) return;
      const rs = rarityStyle(gear.maxRarity);
      const pulse = reduceMotion ? 0 : (Math.sin(now * .0042) + 1) * .5;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${rs.glow},${.22 + gear.maxRarity * .045 + pulse * .08})`;
      ctx.lineWidth = gear.maxRarity >= 4 ? 1.9 : 1.25;
      ctx.beginPath();
      ctx.ellipse(q.x, q.y + 19, 20 + gear.maxRarity * 2.4 + pulse * 1.5, 5.1 + gear.maxRarity * .55, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (gear.maxRarity >= 4) {
        ctx.globalAlpha = .34 + pulse * .12;
        ctx.beginPath();
        ctx.ellipse(q.x, q.y + 19, 29 + pulse * 2, 8.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawDefense(q, gear) {
      if (gear.defenseRarity < 0) return;
      const rs = rarityStyle(Math.max(1, gear.defenseRarity));
      const alpha = .18 + Math.max(0, gear.defenseRarity) * .045;
      ctx.save();
      ctx.strokeStyle = `rgba(${rs.glow},${alpha})`;
      ctx.lineWidth = gear.defenseRarity >= 3 ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(q.x, q.y - 4, 20.5, Math.PI * .66, Math.PI * 1.34);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(q.x, q.y - 4, 20.5, -Math.PI * .34, Math.PI * .34);
      ctx.stroke();
      if (gear.defensive.length >= 2) {
        ctx.globalAlpha = .55;
        ctx.beginPath();
        ctx.moveTo(q.x - 14, q.y + 10);
        ctx.lineTo(q.x, q.y + 15);
        ctx.lineTo(q.x + 14, q.y + 10);
        ctx.stroke();
      }
      ctx.restore();
    }

    function lootIndex(icon) {
      const ids = api.lootIconIds;
      return Array.isArray(ids) ? ids.indexOf(icon) : -1;
    }

    function drawLootCell(index, x, y, size, rotation, alpha = 1, glowColor = 'rgba(0,0,0,.65)') {
      if (!imageReady(loot) || index < 0) return;
      const cols = 4, rows = 8;
      const sw = loot.naturalWidth / cols;
      const sh = loot.naturalHeight / rows;
      const sx = (index % cols) * sw;
      const sy = Math.floor(index / cols) * sh;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x,y);
      ctx.rotate(rotation || 0);
      ctx.imageSmoothingEnabled = true;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 5;
      ctx.drawImage(loot,sx,sy,sw,sh,-size/2,-size/2,size,size);
      ctx.restore();
    }

    function facingVector(p) {
      const f = Array.isArray(p && p.facing) ? p.facing : [1,0];
      let dx = Number(f[0]) || 0;
      let dy = Number(f[1]) || 0;
      if (!dx && !dy) dx = 1;
      const length = Math.hypot(dx,dy) || 1;
      return { dx:dx/length, dy:dy/length };
    }

    function drawWeapon(q, gear, now) {
      const weapon = gear.weapon;
      if (!weapon) return;
      const index = lootIndex(weapon.icon);
      if (index < 0) return;
      const rarity = rarityOf(weapon);
      const rs = rarityStyle(rarity);
      const f = facingVector(q.p);
      const attack = clamp(Number(q.p.lungeT) || 0, 0, 1);
      const skillPulse = (Number(q.p.skillCd) || 0) > 0 ? 0 : (reduceMotion ? .5 : (Math.sin(now*.006)+1)*.5);
      const sideX = -f.dy, sideY = f.dx;
      const x = q.x + f.dx * (15 + attack * 4) + sideX * 7;
      const y = q.y - 3 + f.dy * 11 + sideY * 2;
      const baseAngle = Math.atan2(f.dy,f.dx) + Math.PI * .25;
      const swing = attack * (f.dy >= 0 ? .55 : -.55);
      const size = 20 + rarity * 1.7 + forgeOf(weapon) * .45;
      drawLootCell(index,x,y,size,baseAngle+swing,.88 + rarity*.025,`rgba(${rs.glow},${.42+rarity*.09+skillPulse*.08})`);
    }

    function drawAccessories(q, gear, now) {
      if (!gear.accessories.length || gear.accessoryRarity < 1) return;
      const rarity = gear.accessoryRarity;
      const rs = rarityStyle(rarity);
      const phase = reduceMotion ? .65 : now * .0022;
      const radiusX = 20 + rarity * 1.5;
      const radiusY = 7 + rarity * .55;
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      for (let i=0;i<gear.accessories.length;i++) {
        const a = phase + i * Math.PI;
        const x = q.x + Math.cos(a) * radiusX;
        const y = q.y - 5 + Math.sin(a) * radiusY;
        ctx.fillStyle = `rgba(${rs.glow},${.48+rarity*.08})`;
        ctx.shadowColor = `rgba(${rs.glow},.75)`;
        ctx.shadowBlur = 6 + rarity * 1.5;
        ctx.beginPath(); ctx.arc(x,y,1.25+rarity*.22,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }

    function drawForge(q, gear, now) {
      if (gear.maxForge < 2 && gear.totalForge < 4) return;
      const count = clamp(Math.max(gear.maxForge - 1, Math.floor(gear.totalForge / 4)), 1, 4);
      const phase = reduceMotion ? .4 : now * .0048;
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      for (let i=0;i<count;i++) {
        const a = phase + i * (Math.PI * 2 / count);
        const x = q.x + Math.cos(a) * (15 + i * 1.3);
        const y = q.y - 5 + Math.sin(a) * (11 + i * .8);
        const alpha = .34 + gear.maxForge * .07;
        ctx.strokeStyle = `rgba(255,184,82,${alpha})`;
        ctx.lineWidth = .8;
        ctx.beginPath(); ctx.moveTo(x-2.2,y); ctx.lineTo(x+2.2,y); ctx.moveTo(x,y-2.2); ctx.lineTo(x,y+2.2); ctx.stroke();
      }
      ctx.restore();
    }

    function drawMechanicRune(q, gear, now) {
      if (!gear.mechanicCount) return;
      const rarity = Math.max(2, gear.maxRarity);
      const rs = rarityStyle(rarity);
      const bob = reduceMotion ? 0 : Math.sin(now*.0034) * 1.2;
      ctx.save();
      ctx.strokeStyle=`rgba(${rs.glow},${.25+Math.min(3,gear.mechanicCount)*.08})`;
      ctx.lineWidth=.9;
      ctx.translate(q.x,q.y-35+bob);
      ctx.rotate(Math.PI/4);
      ctx.strokeRect(-3.4,-3.4,6.8,6.8);
      ctx.restore();
    }

    function render(now) {
      const { width, height } = syncCanvas();
      ctx.clearRect(0,0,width,height);
      if (api.state !== 'playing' || !api.player) return;
      const q = heroPosition();
      if (!q) return;
      const gear = gearSummary(q.p);
      if (!gear.equipped.length) return;
      drawGroundAura(q,gear,now);
      drawDefense(q,gear);
      drawWeapon(q,gear,now);
      drawAccessories(q,gear,now);
      drawForge(q,gear,now);
      drawMechanicRune(q,gear,now);
    }

    function loop(now) {
      const interval = reduceMotion ? 72 : 33;
      if (now-lastDraw >= interval) {
        lastDraw = now;
        render(now);
      }
      if (api.state === 'playing') {
        clearTimeout(idleTimer);
        idleTimer = 0;
        requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0,0,overlay.width,overlay.height);
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => requestAnimationFrame(loop),220);
      }
    }

    window.__DE_HERO_GEAR_ART_V162 = {
      version:'1.6.2',
      owner:'presentation',
      gameplayMutation:false,
      slots:[...SLOTS],
      rarityDriven:true,
      forgeDriven:true,
      mechanicDriven:true,
      weaponAtlas:LOOT_ATLAS,
      overlay,
      assetReady:()=>imageReady(loot),
    };
    requestAnimationFrame(loop);
  }

  boot();
})();
