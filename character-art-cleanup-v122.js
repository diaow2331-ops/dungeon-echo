/* Dungeon Echo v1.2.2 character-art cleanup.
 * Presentation-only quarantine for obsolete equipment-on-hero visuals.
 * The hero sprite remains the sole character-art owner; equipment art belongs to UI/town/ground loot.
 * Visual overlay hookup is one-shot because visual-polish.js loads before this follower in production.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_CHARACTER_ART_CLEANUP_V122) return;
  const api = window.DE_TEST;
  if (!api) return;

  const RARITY = new Set(['#b9c6d2','#62b77b','#62a7e8','#b07de8','#eda23a']);
  const TILE = 32;

  function patchMainCanvas() {
    const canvas = document.getElementById('game');
    if (!canvas || canvas.__deCharacterArtCleanupV122 || typeof canvas.getContext !== 'function') return false;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof ctx.drawImage !== 'function') return false;

    const prevDrawImage = ctx.drawImage.bind(ctx);
    const prevSave = ctx.save.bind(ctx);
    const prevRestore = ctx.restore.bind(ctx);
    const prevStroke = ctx.stroke.bind(ctx);
    const prevFill = ctx.fill.bind(ctx);
    const prevFillRect = ctx.fillRect.bind(ctx);
    const prevEllipse = ctx.ellipse.bind(ctx);

    let heroJustDrawn = false;
    let legacyGearDepth = 0;

    ctx.drawImage = function(...args) {
      const src = String(args[0] && args[0].src || '');
      if (/hero-atlas-v11\.png(?:[?#].*)?$/i.test(src)) heroJustDrawn = true;
      if (legacyGearDepth > 0) return;
      return prevDrawImage(...args);
    };

    ctx.save = function(...args) {
      const out = prevSave(...args);
      if (heroJustDrawn && legacyGearDepth === 0) {
        heroJustDrawn = false;
        legacyGearDepth = 1;
      } else if (legacyGearDepth > 0) {
        legacyGearDepth++;
      }
      return out;
    };

    ctx.restore = function(...args) {
      const out = prevRestore(...args);
      if (legacyGearDepth > 0) legacyGearDepth = Math.max(0, legacyGearDepth - 1);
      return out;
    };

    ctx.stroke = function(...args) {
      if (legacyGearDepth > 0) return;
      return prevStroke(...args);
    };
    ctx.fill = function(...args) {
      if (legacyGearDepth > 0) return;
      return prevFill(...args);
    };
    ctx.fillRect = function(...args) {
      if (legacyGearDepth > 0) return;
      return prevFillRect(...args);
    };

    // game.js draws an equipment-rarity ellipse before the hero atlas itself, so the
    // post-hero gear-block guard cannot see it. Match only that exact hero-relative shape.
    ctx.ellipse = function(cx, cy, rx, ry, rotation, start, end, ...rest) {
      const p = api.player;
      if (p) {
        const px = (Number.isFinite(Number(p.fx)) ? Number(p.fx) : Number(p.x)) * TILE + TILE / 2;
        const py = (Number.isFinite(Number(p.fy)) ? Number(p.fy) : Number(p.y)) * TILE + TILE / 2 + TILE * .34;
        const isLegacyRarityRing = Math.abs(Number(cx) - px) < .75 && Math.abs(Number(cy) - py) < .75 &&
          Number(rx) >= 15 && Number(rx) <= 20 && Number(ry) >= 5 && Number(ry) <= 7;
        if (isLegacyRarityRing) return;
      }
      return prevEllipse(cx, cy, rx, ry, rotation, start, end, ...rest);
    };

    canvas.__deCharacterArtCleanupV122 = true;
    return true;
  }

  function patchVisualOverlay() {
    const canvas = document.getElementById('de-visual-polish');
    if (!canvas || canvas.__deCharacterArtCleanupV122 || typeof canvas.getContext !== 'function') return false;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof ctx.drawImage !== 'function') return false;

    const prevDrawImage = ctx.drawImage.bind(ctx);
    const prevStroke = ctx.stroke.bind(ctx);
    const prevFillRect = ctx.fillRect.bind(ctx);

    ctx.drawImage = function(...args) {
      const src = String(args[0] && args[0].src || '');
      if (src.includes('equipment-weapons-v13.png') || src.includes('equipment-wearables-v13.png')) return;
      return prevDrawImage(...args);
    };

    // visual-polish.js used rarity colours exclusively for its ring-on-hero stroke.
    ctx.stroke = function(...args) {
      if (RARITY.has(String(ctx.strokeStyle || '').toLowerCase())) return;
      return prevStroke(...args);
    };

    // The obsolete amulet chest gem is a tiny rarity-coloured square drawn around origin
    // after translate/rotate. Suppress that exact size/signature without touching ambience.
    ctx.fillRect = function(x, y, w, h, ...rest) {
      const sw = Math.abs(Number(w)), sh = Math.abs(Number(h));
      const tinyRarityGem = RARITY.has(String(ctx.fillStyle || '').toLowerCase()) &&
        sw >= 2.5 && sw <= 8 && sh >= 2.5 && sh <= 8 && Number(x) <= 0 && Number(y) <= 0;
      if (tinyRarityGem) return;
      return prevFillRect(x, y, w, h, ...rest);
    };

    canvas.__deCharacterArtCleanupV122 = true;
    return true;
  }

  function patchAll() {
    const main = patchMainCanvas();
    const overlay = patchVisualOverlay();
    return main || overlay;
  }

  patchAll();
  // Runtime order guarantees visual-polish.js is already synchronous, but one task-boundary
  // retry keeps dev/harness loading resilient without a permanent observer.
  requestAnimationFrame(() => {
    if (!patchVisualOverlay()) window.addEventListener('load', patchVisualOverlay, { once:true });
  });

  window.__DE_CHARACTER_ART_CLEANUP_V122 = { version:'v2', owner:'character-art-cleanup-v122', patchMainCanvas, patchVisualOverlay, patchAll };
})();
