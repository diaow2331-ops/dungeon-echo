/* Dungeon Echo town art v1.6.0.
 * Presentation-only Greedy Expedition town scene.
 *
 * Replaces the old vector NPC placeholders with detailed atlas characters while
 * preserving the tier-aware camp street, localization, town economy and all button
 * ownership. Existing admitted hero art is reused as the NPC source so this pass adds
 * no new binary dependency.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_TOWN_ART_V160) return;

  const scriptSrc = document.currentScript && document.currentScript.src || '';
  const runtimeAsset = name => {
    try { return new URL(`../../art/runtime/${name}`, scriptSrc || location.href).href; }
    catch (_err) { return `art/runtime/${name}`; }
  };
  const PROP = Object.freeze({
    wallTorch:0, bonePile:1, runeObelisk:2, woodCrate:3, woodBarrel:4, lanternPost:5,
    webNest:6, iceCrystal:7, redMushroom:8, lavaVent:9, voidRift:10, bloodAltar:11,
    ironGate:12, dungeonEntry:13, townPortal:14, campfire:15, bountyBoard:16,
    treasureChest:17, mimicChest:18, forgeAnvil:19, alchemyTable:20, marketStall:21,
    angelShrine:22, arcaneCrystal:23,
  });
  const NPC = Object.freeze({
    quartermaster:0,   // warrior idle
    smith:1,           // warrior action
    provisioner:4,     // ranger idle
    alchemist:9,       // mage action
    oracle:10,         // mage wounded/ritual silhouette
    portalWarden:12,   // assassin idle
  });

  const imageFrom = src => {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    return image;
  };
  const props = imageFrom(runtimeAsset('dungeon-props-atlas-v1.svg'));
  const npcs = imageFrom(runtimeAsset('hero-action-atlas-v2.svg'));
  const imageReady = image => !!image && image.complete && Number(image.naturalWidth) > 4;

  function boot(attempt = 0) {
    const api = window.DE_TEST;
    const town = document.getElementById('town-screen');
    const scene = document.getElementById('town-scene');
    if ((!api || api.profileId !== 'classic-100' || !town || !scene) && attempt < 180) {
      setTimeout(() => boot(attempt + 1), 50);
      return;
    }
    if (!api || api.profileId !== 'classic-100' || !town || !scene || !scene.parentNode) return;

    const english = String(document.documentElement && document.documentElement.dataset &&
      document.documentElement.dataset.deLocale || '').toLowerCase() === 'en';
    const t = (zh, en) => english ? en : zh;

    const wrap = document.createElement('div');
    wrap.id = 'de-town-scene-art-v160';
    scene.parentNode.insertBefore(wrap, scene);
    wrap.appendChild(scene);

    const overlay = document.createElement('canvas');
    overlay.id = 'de-town-art-v160';
    overlay.setAttribute('aria-hidden', 'true');
    wrap.appendChild(overlay);

    const style = document.createElement('style');
    style.id = 'de-town-art-style-v160';
    style.textContent = `
      #de-town-scene-art-v160{position:relative;display:block;flex:0 0 auto;width:100%;height:clamp(98px,18vh,166px);overflow:hidden;border-radius:8px;margin:0!important;background:#0c0806}
      #de-town-scene-art-v160>#town-scene,#de-town-scene-art-v160>#de-town-art-v160{position:absolute;inset:0;display:block;width:100%!important;height:100%!important;margin:0!important;border-radius:inherit}
      #de-town-scene-art-v160>#de-town-art-v160{pointer-events:none;z-index:2;image-rendering:auto}
      @media(max-width:780px){#de-town-scene-art-v160{height:92px}}
    `;
    document.head.appendChild(style);

    const ctx = overlay.getContext('2d', { alpha:true });
    if (!ctx) return;
    const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastDraw = 0;
    let sleepTimer = 0;

    function syncCanvas() {
      const w = Number(scene.width) || 900;
      const h = Number(scene.height) || 210;
      if (overlay.width !== w) overlay.width = w;
      if (overlay.height !== h) overlay.height = h;
      return { w, h };
    }

    function tier() {
      const econ = window.DE_TOWN_ECONOMY;
      if (econ && typeof econ.tier === 'function') return Math.max(1, Math.min(10, Number(econ.tier()) || 1));
      return Math.max(1, Math.min(10, Math.ceil((Number(api.meta && api.meta.bestDepth) || 1) / 10)));
    }

    function atlasCell(image, index, cols, rows, x, y, w, h, alpha = 1, shadow = 7, facing = 1) {
      if (!imageReady(image) || !Number.isInteger(index) || index < 0) return false;
      const sw = image.naturalWidth / cols;
      const sh = image.naturalHeight / rows;
      const sx = (index % cols) * sw;
      const sy = Math.floor(index / cols) * sh;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = true;
      ctx.shadowColor = 'rgba(0,0,0,.82)';
      ctx.shadowBlur = shadow;
      ctx.shadowOffsetY = 3;
      ctx.translate(x, y);
      ctx.scale(facing, 1);
      ctx.drawImage(image, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
      ctx.restore();
      return true;
    }

    function glow(x, y, radius, hue, alpha = .22) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, radius);
      g.addColorStop(0, `hsla(${hue},90%,65%,${alpha})`);
      g.addColorStop(.45, `hsla(${hue},86%,55%,${alpha * .48})`);
      g.addColorStop(1, `hsla(${hue},80%,45%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    }

    function service(index, x, y, w, h, hue, alpha = 1) {
      glow(x, y + h * .06, Math.max(w, h) * .62, hue, .13 * alpha);
      atlasCell(props, index, 6, 4, x, y, w, h, alpha, 8);
    }

    function fallbackNpc(x, y, hue) {
      ctx.save();
      ctx.fillStyle = `hsla(${hue},30%,36%,.95)`;
      ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 11, y - 23); ctx.lineTo(x + 10, y - 23); ctx.lineTo(x + 15, y); ctx.lineTo(x - 15, y); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function npc(index, x, baseY, hue, now, facing = 1, scale = 1) {
      const bob = reduceMotion ? 0 : Math.sin(now * .0026 + x * .013) * 1.25;
      const y = baseY + bob;
      glow(x, y - 27, 33 * scale, hue, .13);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.beginPath(); ctx.ellipse(x, y + 2, 15 * scale, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const ok = atlasCell(npcs, index, 4, 4, x, y - 27 * scale, 46 * scale, 63 * scale, 1, 9, facing);
      if (!ok) fallbackNpc(x, y, hue);
      ctx.save();
      ctx.strokeStyle = `hsla(${hue},86%,68%,.45)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, y + 1, 13 * scale, 3.3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    function label(text, x, y, color = '#dbc38c') {
      ctx.save();
      ctx.font = '600 10px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(6,4,3,.88)';
      ctx.strokeText(text, x, y);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    function streetLight(x, y, hue, alpha = .08) {
      const g = ctx.createRadialGradient(x, y, 4, x, y, 170);
      g.addColorStop(0, `hsla(${hue},86%,58%,${alpha})`);
      g.addColorStop(1, `hsla(${hue},76%,42%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - 180, y - 130, 360, 260);
    }

    function drawTown(now) {
      const { w:W, h:H } = syncCanvas();
      ctx.clearRect(0, 0, W, H);
      if (town.classList.contains('hidden')) return;
      const townTier = tier();
      const sx = W / 900;
      const sy = H / 210;
      ctx.save();
      ctx.scale(sx, sy);

      const lower = ctx.createLinearGradient(0, 48, 0, 210);
      lower.addColorStop(0, 'rgba(8,5,4,.02)');
      lower.addColorStop(.42, 'rgba(8,5,4,.16)');
      lower.addColorStop(1, 'rgba(5,3,2,.66)');
      ctx.fillStyle = lower;
      ctx.fillRect(0, 40, 900, 170);

      const pulse = reduceMotion ? 0 : (Math.sin(now * .004) + 1) * .5;
      streetLight(410, 150, 28, .07);
      service(PROP.campfire, 410, 163, 48, 46, 27, .76);
      glow(410, 154, 42 + pulse * 5, 27, .15);

      // Warehouse street head: armored quartermaster now reads as a real character,
      // not a UI glyph beside a chest.
      service(PROP.treasureChest, 67, 150, 73, 62, 43);
      npc(NPC.quartermaster, 119, 176, 43, now, -1, .92);
      label(t('仓库管事','Quartermaster'), 105, 198);

      // Market anchors the right half from tier 1 onward.
      service(PROP.marketStall, 520, 140, 115, 91, 35);
      npc(NPC.provisioner, 467, 177, 104, now, 1, .92);
      label(t('补给商人','Provisioner'), 503, 198, '#d8c58c');

      if (townTier >= 2) {
        service(PROP.forgeAnvil, 225, 151, 73, 67, 18);
        npc(NPC.smith, 274, 177, 18, now, -1, .96);
        label(t('铁匠','Smith'), 253, 198, '#e7b37b');
      }

      if (townTier >= 3) {
        service(PROP.alchemyTable, 348, 141, 88, 82, 176);
        npc(NPC.alchemist, 389, 177, 205, now, -1, .92);
        label(t('药剂师','Alchemist'), 372, 198, '#91d9c6');
      }

      if (townTier >= 4) {
        service(PROP.angelShrine, 653, 132, 82, 103, 48);
        npc(NPC.oracle, 609, 177, 274, now, 1, .94);
        label(t('祈祷者','Oracle'), 632, 198, '#c8b2ef');
      }

      if (townTier >= 5) {
        service(PROP.bountyBoard, 744, 151, 72, 64, 39, .94);
        label(t('远征告示','Expedition Board'), 744, 198, '#c7ae7d');
      }

      if (townTier >= 6) {
        service(PROP.townPortal, 840, 132, 83, 104, 213);
        glow(840, 125, 54 + pulse * 7, 213, .18);
        label(t('深层传送门','Deep Portal'), 837, 198, '#92c7f4');
      } else {
        service(PROP.lanternPost, 835, 151, 45, 72, 31, .82);
      }

      // Late town tiers gain a visible sentinel rather than only another glowing prop.
      if (townTier >= 7) npc(NPC.portalWarden, 793, 177, 215, now, 1, .88);
      if (townTier >= 8) service(PROP.arcaneCrystal, 780, 154, 43, 57, 274, .90);
      if (townTier >= 10) service(PROP.runeObelisk, 164, 151, 48, 64, 205, .88);

      ctx.save();
      ctx.fillStyle = 'rgba(9,6,4,.72)';
      ctx.strokeStyle = 'rgba(224,167,58,.36)';
      ctx.lineWidth = 1;
      const badge = english ? `Town Tier ${townTier}` : `城镇阶段 ${townTier}`;
      ctx.font = '600 10px "Segoe UI", "Microsoft YaHei", sans-serif';
      const bw = Math.ceil(ctx.measureText(badge).width) + 16;
      ctx.beginPath();
      ctx.roundRect(900 - bw - 10, 9, bw, 22, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e0c17c';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(badge, 900 - bw / 2 - 10, 20);
      ctx.restore();

      ctx.restore();
    }

    function loop(now) {
      const interval = reduceMotion ? 90 : 40;
      if (now - lastDraw >= interval) {
        lastDraw = now;
        drawTown(now);
      }
      if (!town.classList.contains('hidden')) {
        clearTimeout(sleepTimer);
        sleepTimer = 0;
        requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        clearTimeout(sleepTimer);
        sleepTimer = setTimeout(() => requestAnimationFrame(loop), 240);
      }
    }

    window.__DE_TOWN_ART_V160 = {
      version:'1.6.0',
      owner:'presentation',
      gameplayMutation:false,
      tierAware:true,
      npcAtlas:'hero-action-atlas-v2.svg',
      npcCells:{...NPC},
      landmarkCells:[PROP.treasureChest, PROP.forgeAnvil, PROP.alchemyTable, PROP.marketStall, PROP.angelShrine, PROP.townPortal],
      overlay,
      assetReady:() => ({ props:imageReady(props), npcs:imageReady(npcs) }),
    };
    requestAnimationFrame(loop);
  }

  boot();
})();
