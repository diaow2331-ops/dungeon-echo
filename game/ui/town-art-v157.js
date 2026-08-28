/* Dungeon Echo town art v1.5.7.
 * Presentation-only scene layer for the Greedy Expedition town.
 *
 * Converts the compact town strip into a functional camp street using the admitted
 * prop atlas, tier-aware service landmarks and lightweight NPC silhouettes. It does
 * not own town economy, inventory, checkpoints, RNG, saves or any button behavior.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_TOWN_ART_V157) return;

  const scriptSrc = document.currentScript && document.currentScript.src || '';
  const runtimeAsset = name => {
    try { return new URL(`../../art/runtime/${name}`, scriptSrc || location.href).href; }
    catch (e) { return `art/runtime/${name}`; }
  };
  const PROP = Object.freeze({
    wallTorch:0, bonePile:1, runeObelisk:2, woodCrate:3, woodBarrel:4, lanternPost:5,
    webNest:6, iceCrystal:7, redMushroom:8, lavaVent:9, voidRift:10, bloodAltar:11,
    ironGate:12, dungeonEntry:13, townPortal:14, campfire:15, bountyBoard:16,
    treasureChest:17, mimicChest:18, forgeAnvil:19, alchemyTable:20, marketStall:21,
    angelShrine:22, arcaneCrystal:23,
  });
  const props = new Image();
  props.decoding = 'async';
  props.src = runtimeAsset('dungeon-props-atlas-v1.svg');
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
    wrap.id = 'de-town-scene-art-v157';
    scene.parentNode.insertBefore(wrap, scene);
    wrap.appendChild(scene);

    const overlay = document.createElement('canvas');
    overlay.id = 'de-town-art-v157';
    overlay.setAttribute('aria-hidden', 'true');
    wrap.appendChild(overlay);

    const style = document.createElement('style');
    style.id = 'de-town-art-style-v157';
    style.textContent = `
      #de-town-scene-art-v157{position:relative;display:block;flex:0 0 auto;width:100%;height:clamp(92px,17vh,158px);overflow:hidden;border-radius:8px;margin:0!important;background:#0c0806}
      #de-town-scene-art-v157>#town-scene,#de-town-scene-art-v157>#de-town-art-v157{position:absolute;inset:0;display:block;width:100%!important;height:100%!important;margin:0!important;border-radius:inherit}
      #de-town-scene-art-v157>#de-town-art-v157{pointer-events:none;z-index:2;image-rendering:auto}
      @media(max-width:780px){#de-town-scene-art-v157{height:88px}}
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

    function cell(index, x, y, w, h, alpha = 1, shadow = 7) {
      if (!imageReady(props)) return false;
      const sw = props.naturalWidth / 6;
      const sh = props.naturalHeight / 4;
      const sx = (index % 6) * sw;
      const sy = Math.floor(index / 6) * sh;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = true;
      ctx.shadowColor = 'rgba(0,0,0,.78)';
      ctx.shadowBlur = shadow;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(props, sx, sy, sw, sh, x - w / 2, y - h / 2, w, h);
      ctx.restore();
      return true;
    }

    function glow(x, y, radius, hue, alpha = .22) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, radius);
      g.addColorStop(0, `hsla(${hue},90%,65%,${alpha})`);
      g.addColorStop(.45, `hsla(${hue},86%,55%,${alpha * .48})`);
      g.addColorStop(1, `hsla(${hue},80%,45%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function npc(x, baseY, role, cloak, accent, now, facing = 1) {
      const bob = reduceMotion ? 0 : Math.sin(now * .0028 + x * .017) * 1.4;
      const y = baseY + bob;
      ctx.save();
      glow(x, y - 23, 32, accent.hue, .12);
      ctx.translate(x, y);
      ctx.scale(facing, 1);

      ctx.fillStyle = 'rgba(0,0,0,.42)';
      ctx.beginPath();
      ctx.ellipse(0, 3, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createLinearGradient(0, -36, 0, 0);
      body.addColorStop(0, cloak.light);
      body.addColorStop(.55, cloak.mid);
      body.addColorStop(1, cloak.dark);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(-9, -29);
      ctx.quadraticCurveTo(-14, -15, -16, 0);
      ctx.lineTo(13, 0);
      ctx.quadraticCurveTo(11, -16, 8, -29);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#b99d80';
      ctx.beginPath();
      ctx.arc(0, -34, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cloak.dark;
      ctx.beginPath();
      ctx.arc(-1.5, -36, 7.8, Math.PI, Math.PI * 2);
      ctx.lineTo(6, -30);
      ctx.lineTo(-8, -30);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = accent.line;
      ctx.lineWidth = 2;
      if (role === 'smith') {
        ctx.beginPath(); ctx.moveTo(8, -21); ctx.lineTo(17, -7); ctx.stroke();
        ctx.fillStyle = accent.line; ctx.fillRect(14, -10, 7, 4);
      } else if (role === 'oracle') {
        ctx.beginPath(); ctx.moveTo(9, -24); ctx.lineTo(13, -2); ctx.stroke();
        ctx.fillStyle = accent.line; ctx.beginPath(); ctx.arc(9, -25, 3, 0, Math.PI * 2); ctx.fill();
      } else if (role === 'merchant') {
        ctx.beginPath(); ctx.moveTo(8, -19); ctx.lineTo(15, -13); ctx.stroke();
      } else if (role === 'alchemist') {
        ctx.fillStyle = accent.line; ctx.beginPath(); ctx.arc(10, -15, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    function label(text, x, y, color = '#dbc38c') {
      ctx.save();
      ctx.font = '600 10px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(6,4,3,.86)';
      ctx.strokeText(text, x, y);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    function service(index, x, y, w, h, hue, alpha = 1) {
      glow(x, y + h * .06, Math.max(w, h) * .62, hue, .13 * alpha);
      cell(index, x, y, w, h, alpha, 8);
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

      const lower = ctx.createLinearGradient(0, 55, 0, 210);
      lower.addColorStop(0, 'rgba(8,5,4,.03)');
      lower.addColorStop(.42, 'rgba(8,5,4,.18)');
      lower.addColorStop(1, 'rgba(5,3,2,.62)');
      ctx.fillStyle = lower;
      ctx.fillRect(0, 42, 900, 168);

      // Warm foreground light makes the compact strip read as one coherent camp street.
      glow(450, 178, 240, 31, .09);
      const pulse = reduceMotion ? 0 : (Math.sin(now * .004) + 1) * .5;
      service(PROP.campfire, 410, 162, 48, 46, 27, .72);
      glow(410, 154, 42 + pulse * 5, 27, .14);

      service(PROP.treasureChest, 68, 149, 73, 62, 43);
      npc(118, 175, 'keeper', { light:'#82634c', mid:'#574132', dark:'#2b211b' }, { hue:43, line:'#d3a64c' }, now, -1);
      label(t('仓库管事','Quartermaster'), 104, 198);

      service(PROP.marketStall, 520, 139, 115, 91, 35);
      npc(468, 176, 'merchant', { light:'#8d5d42', mid:'#633b2b', dark:'#351e18' }, { hue:35, line:'#e0a73a' }, now, 1);
      label(t('补给商人','Provisioner'), 503, 198);

      if (townTier >= 2) {
        service(PROP.forgeAnvil, 226, 151, 73, 67, 18);
        npc(275, 176, 'smith', { light:'#6d7480', mid:'#424952', dark:'#20262d' }, { hue:18, line:'#ed8b42' }, now, -1);
        label(t('铁匠','Smith'), 254, 198, '#e7b37b');
      }

      if (townTier >= 3) {
        service(PROP.alchemyTable, 349, 141, 88, 82, 176);
        npc(389, 176, 'alchemist', { light:'#4e7b69', mid:'#345747', dark:'#1b3028' }, { hue:176, line:'#62d3b2' }, now, -1);
        label(t('药剂师','Alchemist'), 372, 198, '#91d9c6');
      }

      if (townTier >= 4) {
        service(PROP.angelShrine, 652, 132, 82, 103, 48);
        npc(608, 176, 'oracle', { light:'#6b5b86', mid:'#493d63', dark:'#272038' }, { hue:274, line:'#b996f0' }, now, 1);
        label(t('祈祷者','Oracle'), 631, 198, '#c8b2ef');
      }

      if (townTier >= 5) {
        service(PROP.bountyBoard, 744, 151, 72, 64, 39, .92);
        label(t('远征告示','Expedition Board'), 744, 198, '#c7ae7d');
      }

      if (townTier >= 6) {
        service(PROP.townPortal, 840, 132, 83, 104, 213);
        glow(840, 125, 54 + pulse * 7, 213, .18);
        label(t('深层传送门','Deep Portal'), 838, 198, '#92c7f4');
      } else {
        service(PROP.lanternPost, 835, 151, 45, 72, 31, .80);
      }

      if (townTier >= 8) {
        service(PROP.arcaneCrystal, 780, 154, 43, 57, 274, .90);
      }
      if (townTier >= 10) {
        service(PROP.runeObelisk, 164, 151, 48, 64, 205, .88);
      }

      ctx.save();
      ctx.fillStyle = 'rgba(9,6,4,.70)';
      ctx.strokeStyle = 'rgba(224,167,58,.34)';
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

    window.__DE_TOWN_ART_V157 = {
      version:'1.5.7',
      owner:'presentation',
      gameplayMutation:false,
      tierAware:true,
      landmarkCells:[PROP.treasureChest, PROP.forgeAnvil, PROP.alchemyTable, PROP.marketStall, PROP.angelShrine, PROP.townPortal],
      overlay,
      assetReady:() => imageReady(props),
    };
    requestAnimationFrame(loop);
  }

  boot();
})();
