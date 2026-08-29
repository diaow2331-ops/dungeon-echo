/* Dungeon Echo hero directional art v1.6.5.
 * Presentation-only four-direction hero layer.
 *
 * Four rows: warrior / ranger / mage / assassin.
 * Four columns: down / up / left / right.
 * Reads player.facing only; combat, movement, RNG, equipment, saves and progression
 * remain fully owned by core game code.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_HERO_DIRECTIONAL_ART_V165) return;

  const scriptSrc = document.currentScript && document.currentScript.src || '';
  const assetUrl = name => {
    try { return new URL(`../../art/runtime/${name}`, scriptSrc || location.href).href; }
    catch (_err) { return `art/runtime/${name}`; }
  };
  const ATLAS = assetUrl('hero-directional-atlas-v1.png');
  const ROW = Object.freeze({ warrior:0, ranger:1, mage:2, assassin:3 });
  const DIR = Object.freeze({ down:0, up:1, left:2, right:3 });
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));

  const image = new Image();
  image.decoding = 'async';
  image.src = ATLAS;
  const imageReady = () => image.complete && Number(image.naturalWidth) > 4;

  function boot(attempt=0) {
    const api = window.DE_TEST;
    const game = document.getElementById('game');
    const stage = document.getElementById('stage');
    if ((!api || api.profileId !== 'classic-100' || !game || !stage) && attempt < 180) {
      setTimeout(() => boot(attempt + 1), 50);
      return;
    }
    if (!api || api.profileId !== 'classic-100' || !game || !stage || typeof game.getContext !== 'function') return;
    if (document.getElementById('de-hero-directional-art-v165')) return;

    const overlay = document.createElement('canvas');
    overlay.id = 'de-hero-directional-art-v165';
    overlay.setAttribute('aria-hidden','true');
    overlay.style.cssText = 'position:absolute;inset:0;width:100%;height:auto;pointer-events:none;z-index:4;image-rendering:pixelated';
    stage.appendChild(overlay);
    const ctx = overlay.getContext('2d',{alpha:true});
    if (!ctx) return;

    let lastDraw = 0;
    let idleTimer = 0;

    function syncCanvas() {
      const width = Number(game.width) || 1280;
      const height = Number(game.height) || 896;
      if (overlay.width !== width) overlay.width = width;
      if (overlay.height !== height) overlay.height = height;
      return {width,height};
    }

    function heroPosition() {
      const p = api.player;
      if (!p) return null;
      const grid = api.mapGrid;
      const mapCols = Array.isArray(grid) && grid[0] ? grid[0].length : 40;
      const mapRows = Array.isArray(grid) ? grid.length : 28;
      const {width,height} = syncCanvas();
      const cols = clamp(Math.round(width / 32),1,mapCols);
      const rows = clamp(Math.round(height / 32),1,mapRows);
      const px = Number.isFinite(Number(p.x)) ? Number(p.x) : 0;
      const py = Number.isFinite(Number(p.y)) ? Number(p.y) : 0;
      const vx = clamp(px - Math.floor(cols / 2),0,Math.max(0,mapCols-cols));
      const vy = clamp(py - Math.floor(rows / 2),0,Math.max(0,mapRows-rows));
      const tw = width / Math.max(1,cols), th = height / Math.max(1,rows);
      const fx = Number.isFinite(Number(p.fx)) ? Number(p.fx) : px;
      const fy = Number.isFinite(Number(p.fy)) ? Number(p.fy) : py;
      return {x:(fx-vx+.5)*tw,y:(fy-vy+.49)*th,tw,th,p};
    }

    function directionOf(p) {
      const f = Array.isArray(p && p.facing) ? p.facing : [1,0];
      const dx = Number(f[0]) || 0;
      const dy = Number(f[1]) || 0;
      if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? DIR.left : DIR.right;
      if (Math.abs(dy) > 0) return dy < 0 ? DIR.up : DIR.down;
      return DIR.right;
    }

    function coverOldHero(q) {
      ctx.save();
      const g = ctx.createRadialGradient(q.x,q.y+2,4,q.x,q.y+2,34);
      g.addColorStop(0,'rgba(6,5,7,.97)');
      g.addColorStop(.66,'rgba(6,5,7,.82)');
      g.addColorStop(1,'rgba(6,5,7,0)');
      ctx.fillStyle = g;
      ctx.fillRect(q.x-38,q.y-40,76,82);
      ctx.restore();
    }

    function drawHero(q) {
      if (!imageReady()) return;
      const row = ROW[api.classId];
      if (row === undefined) return;
      const col = directionOf(q.p);
      const sw = image.naturalWidth / 4;
      const sh = image.naturalHeight / 4;
      const lunge = Math.max(0,Number(q.p.lungeT)||0);
      const f = Array.isArray(q.p.facing) ? q.p.facing : [1,0];
      const dx = Number(f[0]) || 0, dy = Number(f[1]) || 0;
      const len = Math.hypot(dx,dy) || 1;
      const ox = dx / len * Math.min(2.2,lunge*2.2);
      const oy = dy / len * Math.min(2.2,lunge*2.2);
      const w = 52, h = 66;

      coverOldHero(q);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.shadowColor = 'rgba(0,0,0,.82)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.drawImage(image,col*sw,row*sh,sw,sh,q.x-w/2+ox,q.y-h/2-1+oy,w,h);
      ctx.restore();
    }

    function render(now) {
      ctx.clearRect(0,0,overlay.width,overlay.height);
      if (api.state !== 'playing' || !api.player) return;
      const q = heroPosition();
      if (q) drawHero(q);
    }

    function loop(now) {
      const interval = 33;
      if (now-lastDraw >= interval) {
        lastDraw = now;
        syncCanvas();
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

    window.__DE_HERO_DIRECTIONAL_ART_V165 = {
      version:'1.6.5',
      owner:'presentation',
      gameplayMutation:false,
      classes:4,
      directions:4,
      columns:['down','up','left','right'],
      equipmentOverlay:false,
      overlay,
      assetReady:imageReady,
    };
    requestAnimationFrame(loop);
  }

  boot();
})();
