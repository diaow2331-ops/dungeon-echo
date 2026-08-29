/* Dungeon Echo art runtime v4.
 * Presentation-only terrain coordinator for the 2026-08-29 art pass.
 *
 * Responsibilities:
 * - force one fresh load of the unified entity-art runtime after the legacy direct
 *   script tag has been intentionally suppressed by production-bootstrap;
 * - add a deterministic terrain material layer for all 21 classic-100 themes;
 * - keep rendering below entity art and above the authoritative core canvas.
 *
 * Does not mutate map tiles, FOV, collision, RNG, combat, items, saves or progression.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_ART_RUNTIME_V4) return;

  const currentSrc = document.currentScript && document.currentScript.src || '';
  const ENTITY_VERSION = '160';
  const ENTITY_ID = 'de-art-runtime-v4-entity-loader';
  const WALL = 0;
  const FLOOR = 1;
  const FOV_R = 7;
  const THEME_BAND_SIZE = 4;

  // Ordered exactly like profiles/classic-100.profile.js. Floors 81+ clamp to the
  // final theme in core game.js, so the terrain layer mirrors the same rule.
  const THEME_VISUALS = Object.freeze([
    { key:'stone',     hue:218, sat:18, light:62, motif:'masonry' },
    { key:'moss',      hue:118, sat:26, light:49, motif:'moss' },
    { key:'blood',     hue:350, sat:46, light:50, motif:'vein' },
    { key:'hell',      hue:18,  sat:62, light:52, motif:'ember' },
    { key:'frostbone', hue:204, sat:48, light:67, motif:'frost' },
    { key:'drowned',   hue:164, sat:32, light:52, motif:'ripple' },
    { key:'void',      hue:270, sat:44, light:60, motif:'rune' },
    { key:'forge',     hue:24,  sat:68, light:52, motif:'forge' },
    { key:'web',       hue:278, sat:22, light:70, motif:'web' },
    { key:'star',      hue:214, sat:58, light:70, motif:'star' },
    { key:'shatter',   hue:264, sat:28, light:60, motif:'crack' },
    { key:'crimson',   hue:342, sat:58, light:53, motif:'vein' },
    { key:'deepfrost', hue:205, sat:52, light:72, motif:'frost' },
    { key:'molten',    hue:19,  sat:74, light:55, motif:'ember' },
    { key:'voidecho',  hue:276, sat:54, light:61, motif:'rune' },
    { key:'death',     hue:102, sat:22, light:52, motif:'bone' },
    { key:'stardust',  hue:226, sat:62, light:73, motif:'star' },
    { key:'lightless', hue:232, sat:12, light:55, motif:'dark' },
    { key:'ending',    hue:334, sat:62, light:56, motif:'crack' },
    { key:'voidcore',  hue:282, sat:66, light:62, motif:'rune' },
    { key:'nightcity', hue:222, sat:58, light:67, motif:'star' },
  ]);

  // Reserve v2 before the parser reaches the old direct tag. production-bootstrap
  // sets the sentinel first; v4 removes it and reloads the same file with a fresh
  // cache generation so the merged guardian/final-boss pass is guaranteed visible.
  const entityRuntimeReady = () => {
    const runtime = window.__DE_ART_RUNTIME_V2;
    return !!(runtime && runtime.version === 'v3-unified' && runtime.overlay);
  };

  function loadFreshEntityRuntime() {
    if (entityRuntimeReady()) return Promise.resolve(true);
    try { delete window.__DE_ART_RUNTIME_V2; } catch (_err) { window.__DE_ART_RUNTIME_V2 = null; }
    return new Promise(resolve => {
      const old = document.getElementById(ENTITY_ID);
      if (old) {
        old.addEventListener('load', () => resolve(entityRuntimeReady()), { once:true });
        setTimeout(() => resolve(entityRuntimeReady()), 1800);
        return;
      }
      const script = document.createElement('script');
      script.id = ENTITY_ID;
      script.async = false;
      try {
        script.src = new URL(`./art-runtime-v2.js?v=${ENTITY_VERSION}`, currentSrc || location.href).href;
      } catch (_err) {
        script.src = `game/ui/art-runtime-v2.js?v=${ENTITY_VERSION}`;
      }
      script.addEventListener('load', () => resolve(entityRuntimeReady()), { once:true });
      script.addEventListener('error', () => resolve(false), { once:true });
      (document.body || document.head || document.documentElement).appendChild(script);
      setTimeout(() => resolve(entityRuntimeReady()), 2600);
    });
  }

  function bootTerrain(attempt = 0) {
    const api = window.DE_TEST;
    const game = document.getElementById('game');
    const stage = document.getElementById('stage');
    if ((!api || api.profileId !== 'classic-100' || !game || !stage) && attempt < 180) {
      setTimeout(() => bootTerrain(attempt + 1), 50);
      return;
    }
    if (!api || api.profileId !== 'classic-100' || !game || !stage || typeof game.getContext !== 'function') return;

    const existing = document.getElementById('de-terrain-art-v4');
    if (existing) return;

    const overlay = document.createElement('canvas');
    overlay.id = 'de-terrain-art-v4';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = 'position:absolute;inset:0;width:100%;height:auto;pointer-events:none;z-index:2;image-rendering:auto';
    stage.appendChild(overlay);
    const ctx = overlay.getContext('2d', { alpha:true });
    if (!ctx) return;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    let lastSignature = '';
    let idleTimer = 0;

    function syncCanvas() {
      const w = Number(game.width) || 1280;
      const h = Number(game.height) || 896;
      if (overlay.width !== w) overlay.width = w;
      if (overlay.height !== h) overlay.height = h;
      return { w, h };
    }

    function dims() {
      const grid = api.mapGrid;
      const mapCols = Array.isArray(grid) && grid[0] ? grid[0].length : 40;
      const mapRows = Array.isArray(grid) ? grid.length : 28;
      const { w:width, h:height } = syncCanvas();
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

    function lineVisible(x0, y0, x1, y1, grid) {
      if (!Array.isArray(grid) || !grid.length) return true;
      let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
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

    function hash(x, y, depth, salt = 0) {
      let n = ((x + 31 + salt) * 73856093) ^ ((y + 59 + salt) * 19349663) ^ ((depth + 97 + salt) * 83492791);
      n ^= n >>> 13;
      n = Math.imul(n, 1274126177);
      n ^= n >>> 16;
      return n >>> 0;
    }

    function styleForDepth(depth) {
      const index = Math.min(THEME_VISUALS.length - 1, Math.floor((Math.max(1, depth) - 1) / THEME_BAND_SIZE));
      return { ...THEME_VISUALS[index], index };
    }

    function rectFor(x, y, d) {
      return {
        x:(x - d.vx) * d.tw,
        y:(y - d.vy) * d.th,
        w:d.tw,
        h:d.th,
        cx:(x - d.vx + .5) * d.tw,
        cy:(y - d.vy + .5) * d.th,
      };
    }

    function strokeCrack(r, h, hue, alpha = .18) {
      const ox = ((h >>> 5) % 9 - 4) * .035 * r.w;
      const oy = ((h >>> 10) % 7 - 3) * .035 * r.h;
      ctx.strokeStyle = `hsla(${hue},78%,68%,${alpha})`;
      ctx.lineWidth = Math.max(.55, r.w * .022);
      ctx.beginPath();
      ctx.moveTo(r.cx - r.w * .28 + ox, r.cy - r.h * .12 + oy);
      ctx.lineTo(r.cx - r.w * .05, r.cy + r.h * .02);
      ctx.lineTo(r.cx + r.w * .13, r.cy - r.h * .10);
      ctx.lineTo(r.cx + r.w * .31, r.cy + r.h * .16);
      ctx.stroke();
    }

    function drawMotif(r, style, h) {
      const hue = style.hue;
      ctx.save();
      switch (style.motif) {
        case 'masonry': {
          ctx.strokeStyle = `hsla(${hue},24%,78%,.10)`;
          ctx.lineWidth = .65;
          ctx.beginPath();
          ctx.moveTo(r.x + 2, r.cy); ctx.lineTo(r.x + r.w - 2, r.cy);
          ctx.moveTo(r.cx + (((h >>> 7) & 1) ? r.w * .16 : -r.w * .16), r.y + 2);
          ctx.lineTo(r.cx + (((h >>> 7) & 1) ? r.w * .16 : -r.w * .16), r.y + r.h - 2);
          ctx.stroke();
          break;
        }
        case 'moss': {
          ctx.strokeStyle = `hsla(${hue},56%,58%,.19)`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(r.x + r.w * .20, r.y + r.h * .78, r.w * .18, Math.PI * 1.05, Math.PI * 1.72);
          ctx.stroke();
          ctx.fillStyle = `hsla(${hue},62%,60%,.18)`;
          ctx.beginPath(); ctx.arc(r.x + r.w * .72, r.y + r.h * .29, 1.4, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'vein': {
          ctx.strokeStyle = `hsla(${hue},76%,62%,.17)`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(r.x + r.w * .08, r.y + r.h * .68);
          ctx.bezierCurveTo(r.cx - 5, r.cy - 7, r.cx + 4, r.cy + 7, r.x + r.w * .92, r.y + r.h * .31);
          ctx.stroke();
          break;
        }
        case 'ember':
          strokeCrack(r, h, hue, .27);
          ctx.fillStyle = `hsla(${hue},92%,63%,.22)`;
          ctx.fillRect(r.x + r.w * (.18 + ((h >>> 12) % 54) / 100), r.y + r.h * (.22 + ((h >>> 18) % 48) / 100), 1.3, 1.3);
          break;
        case 'frost': {
          ctx.strokeStyle = `hsla(${hue},88%,82%,.20)`;
          ctx.lineWidth = .8;
          ctx.beginPath();
          ctx.moveTo(r.cx, r.y + r.h * .18); ctx.lineTo(r.cx, r.y + r.h * .82);
          ctx.moveTo(r.x + r.w * .20, r.cy); ctx.lineTo(r.x + r.w * .80, r.cy);
          ctx.moveTo(r.x + r.w * .29, r.y + r.h * .29); ctx.lineTo(r.x + r.w * .71, r.y + r.h * .71);
          ctx.stroke();
          break;
        }
        case 'ripple': {
          ctx.strokeStyle = `hsla(${hue},66%,72%,.15)`;
          ctx.lineWidth = .8;
          ctx.beginPath();
          ctx.ellipse(r.cx, r.cy + r.h * .10, r.w * .28, r.h * .09, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'rune': {
          ctx.strokeStyle = `hsla(${hue},86%,72%,.18)`;
          ctx.lineWidth = .8;
          ctx.beginPath();
          ctx.moveTo(r.cx, r.cy - r.h * .20);
          ctx.lineTo(r.cx + r.w * .16, r.cy);
          ctx.lineTo(r.cx, r.cy + r.h * .20);
          ctx.lineTo(r.cx - r.w * .16, r.cy);
          ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'forge': {
          ctx.strokeStyle = `hsla(${hue},65%,64%,.15)`;
          ctx.lineWidth = .75;
          ctx.strokeRect(r.x + r.w * .18, r.y + r.h * .18, r.w * .64, r.h * .64);
          ctx.fillStyle = `hsla(${hue},94%,63%,.24)`;
          ctx.beginPath(); ctx.arc(r.cx, r.cy, 1.3, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'web': {
          ctx.strokeStyle = `hsla(${hue},20%,88%,.15)`;
          ctx.lineWidth = .65;
          ctx.beginPath();
          ctx.moveTo(r.x + 2, r.y + 2); ctx.lineTo(r.cx, r.cy);
          ctx.moveTo(r.x + r.w * .45, r.y + 2); ctx.lineTo(r.cx, r.cy);
          ctx.arc(r.x + 2, r.y + 2, r.w * .30, 0, Math.PI * .50);
          ctx.stroke();
          break;
        }
        case 'star': {
          ctx.fillStyle = `hsla(${hue},88%,84%,.23)`;
          const px = r.x + r.w * (.18 + ((h >>> 8) % 64) / 100);
          const py = r.y + r.h * (.18 + ((h >>> 16) % 64) / 100);
          ctx.fillRect(px, py, 1.2, 1.2);
          ctx.fillRect(r.cx - .7, r.cy - .7, 1.4, 1.4);
          break;
        }
        case 'bone': {
          ctx.strokeStyle = `hsla(${hue},28%,78%,.13)`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(r.x + r.w * .30, r.y + r.h * .64); ctx.lineTo(r.x + r.w * .68, r.y + r.h * .36);
          ctx.moveTo(r.x + r.w * .34, r.y + r.h * .34); ctx.lineTo(r.x + r.w * .64, r.y + r.h * .66);
          ctx.stroke();
          break;
        }
        case 'crack':
          strokeCrack(r, h, hue, .20);
          break;
        case 'dark': {
          ctx.fillStyle = 'rgba(0,0,0,.06)';
          ctx.beginPath(); ctx.arc(r.cx, r.cy, r.w * .28, 0, Math.PI * 2); ctx.fill();
          break;
        }
      }
      ctx.restore();
    }

    function drawFloorMaterials(d, depth, style) {
      if (!Array.isArray(d.grid)) return;
      const y0 = Math.max(0, d.vy), y1 = Math.min(d.mapRows - 1, d.vy + d.rows - 1);
      const x0 = Math.max(0, d.vx), x1 = Math.min(d.mapCols - 1, d.vx + d.cols - 1);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!d.grid[y] || d.grid[y][x] !== FLOOR || !visibleAt(x, y, d)) continue;
        const r = rectFor(x, y, d);
        const h = hash(x, y, depth);
        const variation = ((h >>> 6) % 9) - 4;
        ctx.fillStyle = `hsla(${style.hue + variation},${style.sat}%,${style.light}%,.035)`;
        ctx.fillRect(r.x + .5, r.y + .5, Math.max(0, r.w - 1), Math.max(0, r.h - 1));

        // Tile bevel: tiny top/left lift + bottom/right depth gives the flat core
        // floor enough material definition without hiding its original theme color.
        ctx.strokeStyle = `hsla(${style.hue},${Math.min(90, style.sat + 12)}%,82%,.055)`;
        ctx.lineWidth = .7;
        ctx.beginPath();
        ctx.moveTo(r.x + 1, r.y + r.h - 1); ctx.lineTo(r.x + 1, r.y + 1); ctx.lineTo(r.x + r.w - 1, r.y + 1);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.075)';
        ctx.beginPath();
        ctx.moveTo(r.x + r.w - 1, r.y + 2); ctx.lineTo(r.x + r.w - 1, r.y + r.h - 1); ctx.lineTo(r.x + 2, r.y + r.h - 1);
        ctx.stroke();

        if (h % 5 === 0 || style.motif === 'frost' || style.motif === 'web' || style.motif === 'rune') {
          drawMotif(r, style, h);
        }
      }
    }

    function drawWallRelief(d, style) {
      if (!Array.isArray(d.grid)) return;
      const y0 = Math.max(0, d.vy - 1), y1 = Math.min(d.mapRows - 1, d.vy + d.rows);
      const x0 = Math.max(0, d.vx - 1), x1 = Math.min(d.mapCols - 1, d.vx + d.cols);
      ctx.save();
      ctx.lineCap = 'round';
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!d.grid[y] || d.grid[y][x] !== WALL || !visibleAt(x, y, d)) continue;
        const r = rectFor(x, y, d);
        const topFloor = d.grid[y - 1] && d.grid[y - 1][x] === FLOOR;
        const bottomFloor = d.grid[y + 1] && d.grid[y + 1][x] === FLOOR;
        const leftFloor = d.grid[y] && d.grid[y][x - 1] === FLOOR;
        const rightFloor = d.grid[y] && d.grid[y][x + 1] === FLOOR;
        if (!(topFloor || bottomFloor || leftFloor || rightFloor)) continue;
        ctx.strokeStyle = `hsla(${style.hue},${Math.min(88, style.sat + 18)}%,72%,.16)`;
        ctx.lineWidth = Math.max(1, Math.min(2.2, d.tw * .055));
        ctx.beginPath();
        if (topFloor) { ctx.moveTo(r.x + 2, r.y); ctx.lineTo(r.x + r.w - 2, r.y); }
        if (bottomFloor) { ctx.moveTo(r.x + 2, r.y + r.h); ctx.lineTo(r.x + r.w - 2, r.y + r.h); }
        if (leftFloor) { ctx.moveTo(r.x, r.y + 2); ctx.lineTo(r.x, r.y + r.h - 2); }
        if (rightFloor) { ctx.moveTo(r.x + r.w, r.y + 2); ctx.lineTo(r.x + r.w, r.y + r.h - 2); }
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawDepthAtmosphere(d, depth, style) {
      const deep = Math.min(1, depth / 100);
      ctx.save();
      const g = ctx.createRadialGradient(d.width * .5, d.height * .48, d.width * .12,
        d.width * .5, d.height * .48, Math.max(d.width, d.height) * .72);
      g.addColorStop(0, `hsla(${style.hue},${style.sat}%,${style.light}%,0)`);
      g.addColorStop(.72, `hsla(${style.hue},${Math.min(80, style.sat + 10)}%,22%,${.018 + deep * .022})`);
      g.addColorStop(1, `rgba(0,0,0,${.055 + deep * .065})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, d.width, d.height);
      ctx.restore();
    }

    function signature(d, depth, style) {
      const p = api.player || {};
      return [api.state, depth, style.index, p.x, p.y, d.width, d.height, d.vx, d.vy, d.mapCols, d.mapRows].join(':');
    }

    function render(force = false) {
      syncCanvas();
      if (api.state !== 'playing' || !api.player) {
        if (lastSignature) {
          ctx.clearRect(0, 0, overlay.width, overlay.height);
          lastSignature = '';
        }
        return;
      }
      const d = dims();
      const depth = Number(api.depth) || 1;
      const style = styleForDepth(depth);
      const sig = signature(d, depth, style);
      if (!force && sig === lastSignature) return;
      lastSignature = sig;
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      drawFloorMaterials(d, depth, style);
      drawWallRelief(d, style);
      drawDepthAtmosphere(d, depth, style);
    }

    function loop() {
      render(false);
      if (api.state === 'playing') {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => requestAnimationFrame(loop), 70);
      } else {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => requestAnimationFrame(loop), 220);
      }
    }

    const runtime = {
      version:'v4-terrain',
      owner:'presentation',
      gameplayMutation:false,
      themeCount:THEME_VISUALS.length,
      terrainBandSize:THEME_BAND_SIZE,
      overlay,
      render:() => render(true),
      entityRuntime:() => window.__DE_ART_RUNTIME_V2 || null,
    };
    window.__DE_ART_RUNTIME_V4 = runtime;
    requestAnimationFrame(loop);
  }

  loadFreshEntityRuntime().finally(() => bootTerrain());
})();
