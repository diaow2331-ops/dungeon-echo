/* Dungeon Echo desktop visual polish v3.
 * Presentation-only overlay for the public classic-100 route.
 * Owns atmosphere, v13 equipment icon routing and character gear presentation.
 * It never changes combat, map state, RNG, save data or equipment identities.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_VISUAL_POLISH) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const stage = document.getElementById('stage');
  const game = document.getElementById('game');
  if (!stage || !game || typeof game.getContext !== 'function') return;

  const style = document.createElement('style');
  style.id = 'de-visual-polish-v3';
  style.textContent = `
    #stage{position:relative;isolation:isolate;background:#080706}
    #game{position:relative;z-index:1;filter:saturate(1.07) contrast(1.045) brightness(.985)}
    #de-visual-polish{position:absolute;inset:0;width:100%;height:auto;pointer-events:none;z-index:4}
    #guardian-telegraph{z-index:5!important}
    #lowhp-vignette{z-index:7!important}
    #minimap,#descend-fab{z-index:8!important}
    #town-scene{filter:saturate(1.12) contrast(1.065) brightness(.985);border:1px solid rgba(224,167,58,.22);border-radius:10px;box-shadow:inset 0 0 44px rgba(0,0,0,.32),0 14px 34px rgba(0,0,0,.26)}
    #town-screen .town-service{background:linear-gradient(180deg,rgba(37,27,19,.88),rgba(16,13,11,.92));border-color:rgba(224,167,58,.18);box-shadow:inset 0 1px rgba(255,236,190,.035),0 8px 22px rgba(0,0,0,.18);transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
    #town-screen .town-service:hover{transform:translateY(-1px);border-color:rgba(224,167,58,.34);box-shadow:inset 0 1px rgba(255,236,190,.05),0 12px 28px rgba(0,0,0,.24)}
    #town-screen .town-growth{background:linear-gradient(90deg,rgba(12,10,9,.78),rgba(42,29,18,.48),rgba(12,10,9,.78));border-color:rgba(224,167,58,.18)}
    @media (prefers-reduced-motion:reduce){#town-screen .town-service{transition:none}}
  `;
  if (document.head && document.head.appendChild) document.head.appendChild(style);

  // v13 keeps the legacy 4x8 loot-coordinate contract. Equipment is redirected to the
  // new sheets while consumables and quest items remain on the stable v12 atlas.
  const EQUIPMENT_SHEETS = Object.freeze({
    weapon: { url: 'art/equipment-weapons-v13.png', cols: 6, rows: 4 },
    wearable: { url: 'art/equipment-wearables-v13.png', cols: 6, rows: 5 },
  });
  const EQUIPMENT_ICON_MAP = Object.freeze([
    [0,0,'weapon',0,0], [1,0,'weapon',1,0], [2,0,'weapon',3,1], [3,0,'weapon',3,0],
    [0,1,'wearable',0,0], [1,1,'wearable',2,0], [2,1,'wearable',4,0], [3,1,'wearable',3,0],
    [0,2,'wearable',0,3], [1,2,'wearable',2,3], [2,2,'wearable',4,3],
    [0,4,'weapon',2,3], [1,4,'weapon',5,1], [2,4,'weapon',4,2],
    [3,4,'wearable',0,1], [0,5,'wearable',2,1], [1,5,'wearable',3,1], [2,5,'wearable',5,1],
    [3,5,'wearable',0,2], [0,6,'wearable',1,2], [1,6,'wearable',2,2], [2,6,'wearable',4,2],
    [3,6,'wearable',0,4], [0,7,'wearable',1,4], [1,7,'wearable',3,4], [2,7,'wearable',5,4],
  ]);
  const EQUIPMENT_SOURCE_BY_ICON = Object.freeze({
    'iron-sword':['weapon',0,0], 'broad-sword':['weapon',1,0],
    'battle-axe':['weapon',3,1], 'rune-blade':['weapon',3,0],
    'dagger':['weapon',2,3], 'hunting-bow':['weapon',5,1], 'arcane-staff':['weapon',4,2],
    'leather-armor':['wearable',0,0], 'chain-mail':['wearable',2,0],
    'plate-armor':['wearable',4,0], 'mithril-armor':['wearable',3,0],
    'copper-ring':['wearable',0,3], 'ruby-ring':['wearable',2,3], 'guardian-ring':['wearable',4,3],
    'helm-cloth':['wearable',0,1], 'helm-iron':['wearable',2,1],
    'helm-knight':['wearable',3,1], 'helm-dragon':['wearable',5,1],
    'boots-cloth':['wearable',0,2], 'boots-leather':['wearable',1,2],
    'boots-steel':['wearable',2,2], 'boots-wind':['wearable',4,2],
    'amulet-copper':['wearable',0,4], 'amulet-moonstone':['wearable',1,4],
    'amulet-guardian':['wearable',3,4], 'amulet-abyss':['wearable',5,4],
  });

  function installEquipmentArt() {
    if (!document.head || window.__DE_EQUIPMENT_ART_V13) return;
    const equipmentStyle = document.createElement('style');
    equipmentStyle.id = 'de-equipment-art-v13';
    equipmentStyle.textContent = EQUIPMENT_ICON_MAP.map(([oldX, oldY, sheetId, sx, sy]) => {
      const sheet = EQUIPMENT_SHEETS[sheetId];
      const px = sheet.cols > 1 ? sx / (sheet.cols - 1) * 100 : 0;
      const py = sheet.rows > 1 ? sy / (sheet.rows - 1) * 100 : 0;
      return `.loot-icon[style*="--ix:${oldX};--iy:${oldY}"]{background-image:url("${sheet.url}")!important;background-size:${sheet.cols * 100}% ${sheet.rows * 100}%!important;background-position:${px}% ${py}%!important}`;
    }).join('\n');
    document.head.appendChild(equipmentStyle);
    window.__DE_EQUIPMENT_ART_V13 = {
      version: 'v13', mappedIcons: EQUIPMENT_ICON_MAP.length, sheets: { ...EQUIPMENT_SHEETS },
    };
  }
  installEquipmentArt();

  const overlay = document.createElement('canvas');
  overlay.id = 'de-visual-polish';
  overlay.width = Number(game.width) || 1280;
  overlay.height = Number(game.height) || 896;
  overlay.setAttribute('aria-hidden', 'true');
  if (stage.appendChild) stage.appendChild(overlay);
  const ctx = overlay.getContext && overlay.getContext('2d');
  if (!ctx) return;

  const CLASS_GLOW = {
    warrior: [226,164,72], ranger: [110,198,126], mage: [135,150,255], assassin: [214,92,122],
  };
  const DEPTH_TINTS = [
    [172,116,58],[110,128,156],[86,124,136],[120,92,146],[130,80,90],
    [92,84,126],[108,70,86],[74,82,116],[92,62,112],[120,48,74],
  ];
  const RARITY_GLOW = ['#b9c6d2','#62b77b','#62a7e8','#b07de8','#eda23a'];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
  const classId = () => api.classId || (api.meta && api.meta.classId) || 'warrior';
  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sheetImages = {};
  for (const [id, sheet] of Object.entries(EQUIPMENT_SHEETS)) {
    const img = new Image();
    img.src = sheet.url;
    sheetImages[id] = img;
  }
  const imageReady = img => !!img && img.complete && Number(img.naturalWidth) > 4;

  function dims() {
    const grid = api.mapGrid;
    const cols = Array.isArray(grid) && grid[0] ? grid[0].length : 40;
    const rows = Array.isArray(grid) && grid.length ? grid.length : 28;
    const width = Number(game.width) || 1280;
    const height = Number(game.height) || 896;
    return { cols, rows, width, height, tw: width / Math.max(1, cols), th: height / Math.max(1, rows) };
  }
  function position(entity, d) {
    if (!entity) return null;
    const x = Number.isFinite(Number(entity.fx)) ? Number(entity.fx) : Number(entity.x);
    const y = Number.isFinite(Number(entity.fy)) ? Number(entity.fy) : Number(entity.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x: (x + .5) * d.tw, y: (y + .52) * d.th };
  }
  function radial(x, y, inner, outer, rgb, alpha) {
    const g = ctx.createRadialGradient(x, y, inner, x, y, outer);
    g.addColorStop(0, rgba(rgb, alpha));
    g.addColorStop(.46, rgba(rgb, alpha * .42));
    g.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - outer, y - outer, outer * 2, outer * 2);
  }
  function drawSheetIcon(iconId, x, y, w, h, alpha = 1, rotation = 0) {
    const src = EQUIPMENT_SOURCE_BY_ICON[iconId];
    if (!src) return false;
    const [sheetId, sx, sy] = src;
    const sheet = EQUIPMENT_SHEETS[sheetId];
    const img = sheetImages[sheetId];
    if (!sheet || !imageReady(img)) return false;
    const sw = img.naturalWidth / sheet.cols;
    const sh = img.naturalHeight / sheet.rows;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.shadowColor = 'rgba(0,0,0,.72)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(img, sx * sw, sy * sh, sw, sh, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }
  function rarityOf(item) { return clamp(Number(item && item.rarity) || 0, 0, RARITY_GLOW.length - 1); }

  function drawCharacterGear(now, d) {
    const p = api.player;
    const pos = position(p, d);
    if (!p || !pos || !p.equip) return;
    const eq = p.equip;
    const scale = clamp(Math.min(d.tw, d.th) / 32, .78, 1.35);

    // Boots first so they tuck under the body silhouette.
    if (eq.boots && eq.boots.icon)
      drawSheetIcon(eq.boots.icon, pos.x, pos.y + 17 * scale, 24 * scale, 15 * scale, .88);

    // Chest armor is semi-opaque: enough to read the material without erasing the class sprite.
    if (eq.armor && eq.armor.icon)
      drawSheetIcon(eq.armor.icon, pos.x, pos.y + 1 * scale, 31 * scale, 29 * scale, .64);

    if (eq.helmet && eq.helmet.icon)
      drawSheetIcon(eq.helmet.icon, pos.x, pos.y - 19 * scale, 24 * scale, 22 * scale, .92);

    if (eq.weapon && eq.weapon.icon) {
      const cls = classId();
      const layout = cls === 'ranger' ? [-17,-2,31,31,-.08] :
        cls === 'mage' ? [17,-1,32,32,.08] :
        cls === 'assassin' ? [16,4,25,25,-.15] : [17,0,30,30,.05];
      drawSheetIcon(eq.weapon.icon, pos.x + layout[0] * scale, pos.y + layout[1] * scale,
        layout[2] * scale, layout[3] * scale, .96, layout[4]);
    }

    const t = reduceMotion ? .5 : .5 + .5 * Math.sin(now * .0045);
    if (eq.ring) {
      const r = rarityOf(eq.ring);
      ctx.save();
      ctx.strokeStyle = RARITY_GLOW[r];
      ctx.globalAlpha = .24 + r * .055 + t * .05;
      ctx.lineWidth = 1 + r * .25;
      ctx.beginPath();
      ctx.arc(pos.x - 12 * scale, pos.y + 4 * scale, (3.5 + r * .45) * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (eq.amulet) {
      const r = rarityOf(eq.amulet);
      ctx.save();
      ctx.fillStyle = RARITY_GLOW[r];
      ctx.globalAlpha = .34 + r * .06 + t * .08;
      ctx.translate(pos.x, pos.y - 2 * scale);
      ctx.rotate(Math.PI / 4);
      const s = (3.2 + r * .5) * scale;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    }
  }

  function drawDust(now, d, depth) {
    const count = depth >= 70 ? 18 : depth >= 30 ? 14 : 10;
    const t = reduceMotion ? 0 : now / 1000;
    const pulseSpeed = depth >= 80 ? 1.0 : .65;
    ctx.save();
    for (let i = 0; i < count; i++) {
      const px = ((i * 97.3 + t * (6 + (i % 4) * 1.7)) % (d.width + 80)) - 40;
      const py = ((i * 61.7 + t * (2.2 + (i % 3) * 1.2)) % (d.height + 60)) - 30;
      const pulse = reduceMotion ? .5 : .5 + .5 * Math.sin(t * pulseSpeed + i * 1.93);
      ctx.globalAlpha = .045 + pulse * .055;
      ctx.fillStyle = depth >= 80 ? '#c9b7ff' : depth >= 50 ? '#d8b9aa' : '#ead8b2';
      ctx.beginPath(); ctx.arc(px, py, .8 + (i % 3) * .55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function drawPlayerPresence(now, d) {
    const p = api.player;
    const pos = position(p, d);
    if (!p || !pos) return;
    const rgb = CLASS_GLOW[classId()] || CLASS_GLOW.warrior;
    const pulse = reduceMotion ? .5 : .5 + .5 * Math.sin(now * .0042);
    radial(pos.x, pos.y + d.th * .18, d.tw * .12, d.tw * (1.05 + pulse * .10), rgb, .12 + pulse * .035);
    if ((Number(p.skillCd) || 0) <= 0) {
      ctx.save(); ctx.globalAlpha = .16 + pulse * .08; ctx.strokeStyle = rgba(rgb, 1); ctx.lineWidth = 1.25;
      ctx.beginPath(); ctx.ellipse(pos.x, pos.y + d.th * .26, d.tw * (.48 + pulse * .025), d.th * .17, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  }
  function drawEnemyPresence(now, d) {
    const list = Array.isArray(api.monsters) ? api.monsters : [];
    let boss = null, guardian = null;
    for (const m of list) {
      if (!m || Number(m.hp) <= 0) continue;
      const pos = position(m, d);
      if (!pos) continue;
      if (m.boss) boss = m;
      else if (m.midBoss) guardian = m;
      else if (m.elite) {
        const pulse = reduceMotion ? .5 : .5 + .5 * Math.sin(now * .0048 + (Number(m.x) || 0));
        radial(pos.x, pos.y + d.th * .20, d.tw * .08, d.tw * .78, [214,153,65], .075 + pulse * .025);
      }
    }
    const focal = boss || guardian;
    if (!focal) return;
    const pos = position(focal, d);
    if (!pos) return;
    const pulse = reduceMotion ? .5 : .5 + .5 * Math.sin(now * (boss ? .0054 : .0046));
    const rgb = boss ? [178,72,116] : [220,157,73];
    radial(pos.x, pos.y + d.th * .10, d.tw * .16, d.tw * (boss ? 2.4 : 1.75), rgb, (boss ? .17 : .12) + pulse * .04);
    const vignette = ctx.createRadialGradient(d.width*.5,d.height*.48,Math.min(d.width,d.height)*.20,d.width*.5,d.height*.48,Math.max(d.width,d.height)*.72);
    vignette.addColorStop(0,'rgba(0,0,0,0)');
    vignette.addColorStop(1,boss ? `rgba(30,4,19,${.20+pulse*.04})` : `rgba(18,10,4,${.11+pulse*.025})`);
    ctx.fillStyle = vignette; ctx.fillRect(0,0,d.width,d.height);
  }
  function drawDepthAtmosphere(now, d) {
    const depth = clamp(Number(api.depth) || 1, 1, 100);
    const band = clamp(Math.floor((depth - 1) / 10), 0, DEPTH_TINTS.length - 1);
    const tint = DEPTH_TINTS[band];
    ctx.save(); ctx.globalAlpha = .018 + depth / 100 * .035; ctx.fillStyle = rgba(tint, 1); ctx.fillRect(0,0,d.width,d.height); ctx.restore();
    drawDust(now, d, depth);
    const vignette = ctx.createRadialGradient(d.width*.5,d.height*.48,Math.min(d.width,d.height)*.28,d.width*.5,d.height*.48,Math.max(d.width,d.height)*.72);
    vignette.addColorStop(0,'rgba(0,0,0,0)'); vignette.addColorStop(1,`rgba(3,2,5,${.18+depth/100*.10})`);
    ctx.fillStyle = vignette; ctx.fillRect(0,0,d.width,d.height);
  }

  function draw(now = 0) {
    const d = dims();
    if (overlay.width !== d.width) overlay.width = d.width;
    if (overlay.height !== d.height) overlay.height = d.height;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (api.state !== 'playing') return;
    drawDepthAtmosphere(now, d);
    drawPlayerPresence(now, d);
    drawCharacterGear(now, d);
    drawEnemyPresence(now, d);
  }

  let lastPaint = -Infinity;
  function frame(now) {
    const t = Number(now) || 0;
    const interval = reduceMotion ? 120 : 33;
    if (t - lastPaint >= interval) { draw(t); lastPaint = t; }
    requestAnimationFrame(frame);
  }

  window.__DE_CHARACTER_GEAR_OVERLAY = {
    version: 'v1', mappedIcons: Object.keys(EQUIPMENT_SOURCE_BY_ICON).length,
    sourceByIcon: { ...EQUIPMENT_SOURCE_BY_ICON }, drawCharacterGear,
  };
  window.__DE_VISUAL_POLISH = { version:'v3', draw, dims, classGlow:{...CLASS_GLOW} };
  requestAnimationFrame(frame);
})();
