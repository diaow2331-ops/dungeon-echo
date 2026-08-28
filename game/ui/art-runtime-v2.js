/* Dungeon Echo art runtime v2.
 * Presentation-only art bridge for the 2026-08-29 atlas batch.
 *
 * Owns:
 * - unified 4x8 loot presentation (31 live ids + spare cell)
 * - 4 classes x 4 action-state hero art
 * - additive deep-monster art for previously unmapped archetypes
 * - interactive environment props (chest / shrine / rest / shop / traps)
 *
 * Does NOT own combat, RNG, collision, item identity, save keys or progression.
 * The core canvas remains authoritative and therefore acts as a fail-safe fallback.
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
  });

  const HERO_ROWS = Object.freeze({ warrior:0, ranger:1, mage:2, assassin:3 });
  const HERO_STATE = Object.freeze({ idle:0, attack:1, hurt:2, skill:3 });
  const DEEP_MONSTER = Object.freeze({ abomination:0, seraph:1, voidspawn:2, voidlord:3 });
  const PROP = Object.freeze({
    wallTorch:0, bonePile:1, runeObelisk:2, woodCrate:3, woodBarrel:4, lanternPost:5,
    webNest:6, iceCrystal:7, redMushroom:8, lavaVent:9, voidRift:10, bloodAltar:11,
    ironGate:12, dungeonEntry:13, townPortal:14, campfire:15, bountyBoard:16,
    treasureChest:17, mimicChest:18, forgeAnvil:19, alchemyTable:20, marketStall:21,
    angelShrine:22, arcaneCrystal:23,
  });
  const FOV_R = 7;
  const WALL = 0;
  const FLOOR = 1;

  const imageFrom = src => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    return img;
  };
  const images = {
    loot:imageFrom(ASSET_DATA.loot),
    monster:imageFrom(ASSET_DATA.monster),
    hero:imageFrom(ASSET_DATA.hero),
    props:imageFrom(ASSET_DATA.props),
  };
  const imageReady = img => !!img && img.complete && Number(img.naturalWidth) > 4;

  function boot(attempt = 0) {
    const api = window.DE_TEST;
    const game = document.getElementById('game');
    const stage = document.getElementById('stage');
    if ((!api || api.profileId !== 'classic-100' || !game || !stage) && attempt < 160) {
      setTimeout(() => boot(attempt + 1), 50);
      return;
    }
    if (!api || api.profileId !== 'classic-100' || !game || !stage || typeof game.getContext !== 'function') return;

    const lootStyle = document.createElement('style');
    lootStyle.id = 'de-art-runtime-v2-style';
    lootStyle.textContent = `
      .loot-icon{
        background-image:url("${ASSET_DATA.loot}")!important;
        background-size:400% 800%!important;
        background-position:calc(var(--ix) * 33.333333%) calc(var(--iy) * 14.285714%)!important;
        background-repeat:no-repeat!important;
      }
      #de-art-runtime-v2{
        position:absolute;inset:0;width:100%;height:auto;pointer-events:none;z-index:3;
        image-rendering:auto;
      }
      @media (prefers-reduced-motion:reduce){#de-art-runtime-v2{image-rendering:auto}}
    `;
    document.head.appendChild(lootStyle);

    const overlay = document.createElement('canvas');
    overlay.id = 'de-art-runtime-v2';
    overlay.setAttribute('aria-hidden', 'true');
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

    function pos(entity, d, yBias = .52) {
      if (!entity) return null;
      const x = Number.isFinite(Number(entity.fx)) ? Number(entity.fx) : Number(entity.x);
      const y = Number.isFinite(Number(entity.fy)) ? Number(entity.fy) : Number(entity.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      const sx = (x - d.vx + .5) * d.tw;
      const sy = (y - d.vy + yBias) * d.th;
      if (sx < -d.tw || sy < -d.th || sx > d.width + d.tw || sy > d.height + d.th) return null;
      return { x:sx, y:sy };
    }

    function lineVisible(x0, y0, x1, y1, grid) {
      if (!Array.isArray(grid) || !grid.length) return true;
      let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx - dy, x = x0, y = y0;
      while (!(x === x1 && y === y1)) {
        if (!(x === x0 && y === y0) && grid[y] && grid[y][x] === WALL) return false;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }
      return true;
    }

    function visibleAt(x, y, d) {
      const p = api.player;
      if (!p || !Number.isInteger(x) || !Number.isInteger(y)) return false;
      if (x < 0 || y < 0 || x >= d.mapCols || y >= d.mapRows) return false;
      if (Math.hypot(x - p.x, y - p.y) > FOV_R + .5) return false;
      return lineVisible(p.x, p.y, x, y, d.grid);
    }

    function cell(image, index, cols, rows, x, y, w, h, opt = {}) {
      if (!imageReady(image) || !Number.isInteger(index) || index < 0) return false;
      const sw = image.naturalWidth / cols;
      const sh = image.naturalHeight / rows;
      const sx = (index % cols) * sw;
      const sy = Math.floor(index / cols) * sh;
      ctx.save();
      ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
      ctx.imageSmoothingEnabled = true;
      if (opt.shadow !== false) {
        ctx.shadowColor = opt.shadowColor || 'rgba(0,0,0,.72)';
        ctx.shadowBlur = opt.shadowBlur == null ? 5 : opt.shadowBlur;
        ctx.shadowOffsetY = 2;
      }
      ctx.translate(x, y);
      if (opt.rotation) ctx.rotate(opt.rotation);
      ctx.drawImage(image, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
      ctx.restore();
      return true;
    }

    function mask(x, y, rx, ry, alpha = .88) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, Math.max(rx, ry));
      g.addColorStop(0, `rgba(7,5,5,${alpha})`);
      g.addColorStop(.62, `rgba(7,5,5,${alpha * .72})`);
      g.addColorStop(1, 'rgba(7,5,5,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    }

    function hash(x, y, depth) {
      let n = ((x + 11) * 73856093) ^ ((y + 17) * 19349663) ^ ((depth + 23) * 83492791);
      n ^= n >>> 13; n = Math.imul(n, 1274126177); n ^= n >>> 16;
      return n >>> 0;
    }

    function drawWallTorches(d) {
      if (!imageReady(images.props) || !Array.isArray(d.grid)) return;
      const y0 = Math.max(0, d.vy - 1), y1 = Math.min(d.mapRows - 1, d.vy + d.rows);
      const x0 = Math.max(0, d.vx - 1), x1 = Math.min(d.mapCols - 1, d.vx + d.cols);
      const depth = Number(api.depth) || 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!d.grid[y] || d.grid[y][x] !== WALL || !visibleAt(x, y, d)) continue;
        if (hash(x, y, depth) % 41 !== 0) continue;
        const nearFloor =
          (d.grid[y - 1] && d.grid[y - 1][x] === FLOOR) ||
          (d.grid[y + 1] && d.grid[y + 1][x] === FLOOR) ||
          (d.grid[y] && d.grid[y][x - 1] === FLOOR) ||
          (d.grid[y] && d.grid[y][x + 1] === FLOOR);
        if (!nearFloor) continue;
        const p = pos({ x, y, fx:x, fy:y }, d, .48);
        if (!p) continue;
        cell(images.props, PROP.wallTorch, 6, 4, p.x, p.y, 21, 28, { alpha:.82, shadowBlur:7 });
      }
    }

    function trapCell(depth) {
      if (depth >= 75) return PROP.voidRift;
      if (depth >= 50) return PROP.lavaVent;
      if (depth >= 25) return PROP.iceCrystal;
      return PROP.webNest;
    }

    function drawTraps(d) {
      if (!imageReady(images.props)) return;
      const index = trapCell(Number(api.depth) || 1);
      for (const t of api.traps || []) {
        if (!t || !t.armed || !visibleAt(t.x, t.y, d)) continue;
        const p = pos(t, d, .62);
        if (!p) continue;
        mask(p.x, p.y, 19, 15, .48);
        cell(images.props, index, 6, 4, p.x, p.y, 31, 29, { alpha:.86 });
      }
    }

    function lootIndex(icon) {
      const ids = api.lootIconIds;
      return Array.isArray(ids) ? ids.indexOf(icon) : -1;
    }

    function drawItems(d) {
      for (const it of api.items || []) {
        if (!it || !visibleAt(it.x, it.y, d)) continue;
        const p = pos(it, d, .54);
        if (!p) continue;
        if (it.type === 'chest' && imageReady(images.props)) {
          mask(p.x, p.y, 22, 18, .72);
          cell(images.props, PROP.treasureChest, 6, 4, p.x, p.y, 38, 33, { alpha:.98 });
          continue;
        }
        const icon = it.item && it.item.icon || it.icon;
        const index = lootIndex(icon);
        if (index >= 0 && imageReady(images.loot)) {
          mask(p.x, p.y, 16, 14, .50);
          cell(images.loot, index, 4, 8, p.x, p.y, 28, 28, { alpha:.98, shadowBlur:3 });
        }
      }
    }

    function propForNpc(type) {
      if (type === 'shrine') return PROP.angelShrine;
      if (type === 'rest') return PROP.campfire;
      if (type === 'shop') return PROP.marketStall;
      return -1;
    }

    function drawNpcs(d) {
      if (!imageReady(images.props)) return;
      for (const n of api.npcs || []) {
        if (!n || !visibleAt(n.x, n.y, d)) continue;
        const index = propForNpc(n.type);
        if (index < 0) continue;
        const p = pos(n, d, .50);
        if (!p) continue;
        mask(p.x, p.y, 27, 27, .86);
        const size = n.type === 'shop' ? [52,50] : n.type === 'shrine' ? [46,55] : [43,42];
        cell(images.props, index, 6, 4, p.x, p.y, size[0], size[1], { alpha:.99, shadowBlur:5 });
      }
    }

    function drawDeepMonsters(d) {
      if (!imageReady(images.monster)) return;
      for (const m of api.monsters || []) {
        if (!m || m.boss || m.midBoss || !visibleAt(m.x, m.y, d)) continue;
        const index = DEEP_MONSTER[m.sprite];
        if (index === undefined) continue;
        const p = pos(m, d, .50);
        if (!p) continue;
        const elite = !!m.elite;
        const w = elite ? 49 : 43, h = elite ? 54 : 48;
        mask(p.x, p.y, w * .62, h * .56, .90);
        cell(images.monster, index, 4, 4, p.x, p.y, w, h, { alpha:.995, shadowBlur:6 });
        if (elite) {
          ctx.save();
          ctx.strokeStyle = 'rgba(224,167,63,.72)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + h * .34, w * .36, 4.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    function heroState(p, now) {
      const cd = Number(p.skillCd) || 0;
      if (cd > lastSkillCd + .2) skillUntil = now + (reduceMotion ? 180 : 360);
      lastSkillCd = cd;
      if ((Number(p.hurtT) || 0) > .03) return HERO_STATE.hurt;
      if (now < skillUntil) return HERO_STATE.skill;
      if ((Number(p.lungeT) || 0) > .03) return HERO_STATE.attack;
      return HERO_STATE.idle;
    }

    function drawHero(d, now) {
      const p = api.player;
      const row = HERO_ROWS[api.classId];
      if (!p || row === undefined || !imageReady(images.hero) || !visibleAt(p.x, p.y, d)) return;
      const state = heroState(p, now);
      const index = row * 4 + state;
      const q = pos(p, d, .49);
      if (!q) return;
      const lunge = Math.max(0, Number(p.lungeT) || 0);
      const pulse = reduceMotion ? 0 : Math.sin(now * .006) * 1.2;
      const w = 49 + pulse + lunge * 2.5;
      const h = 61 + pulse + lunge * 3;
      mask(q.x, q.y, 29, 34, .92);
      cell(images.hero, index, 4, 4, q.x, q.y - 2, w, h, { alpha:1, shadowBlur:7 });
    }

    function render(now) {
      syncCanvas();
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      if (api.state !== 'playing' || !api.player) return;
      const d = dims();
      drawWallTorches(d);
      drawTraps(d);
      drawItems(d);
      drawNpcs(d);
      drawDeepMonsters(d);
      drawHero(d, now);
    }

    function loop(now) {
      const interval = reduceMotion ? 66 : 33;
      if (now - lastDraw >= interval) {
        lastDraw = now;
        render(now);
      }
      if (api.state === 'playing') {
        idleTimer = 0;
        requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => requestAnimationFrame(loop), 220);
      }
    }

    window.__DE_ART_RUNTIME_V2 = {
      version:'v2',
      owner:'presentation',
      embedded:false,
      lootCells:31,
      heroStates:4,
      deepMonsterDirect:4,
      propCells:24,
      overlay,
      assetReady:() => Object.fromEntries(Object.entries(images).map(([k,v]) => [k,imageReady(v)])),
    };
    requestAnimationFrame(loop);
  }

  boot();
})();
