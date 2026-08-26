/* Dungeon Echo combat controls + mana resource v1.
 * Presentation/input/resource layer for the classic-100 public route.
 * - WASD/arrow keys move/turn only; adjacent enemies block movement.
 * - J attacks in the current facing direction (ranged classes use their line range).
 * - K uses the class skill and consumes mana.
 * - Touch controls mirror the same attack/skill contract.
 * - Ground equipment uses the real v13 tier art even when production rewrites the old atlas path.
 * - All legacy character equipment geometry/image overlays are suppressed so the hero atlas stays authoritative.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_COMBAT_CONTROLS_V1) return;

  const api = window.DE_TEST;
  const tierArt = window.__DE_EQUIPMENT_TIER_ART;
  if (!api || api.profileId !== 'classic-100' || typeof api.tryMove !== 'function' || typeof api.useSkill !== 'function') return;

  const DIR = Object.freeze({
    ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
    w:[0,-1], W:[0,-1], s:[0,1], S:[0,1], a:[-1,0], A:[-1,0], d:[1,0], D:[1,0],
  });

  const RESOURCE = Object.freeze({
    warrior:  { max:60, cost:30, regen:2, attackGain:2, focusGain:3 },
    ranger:   { max:70, cost:32, regen:2, attackGain:3, focusGain:4 },
    mage:     { max:100,cost:42, regen:3, attackGain:1, focusGain:10 },
    assassin: { max:65, cost:34, regen:2, attackGain:3, focusGain:4 },
  });

  const classId = () => api.classId || (api.meta && api.meta.classId) || 'warrior';
  const cfg = () => RESOURCE[classId()] || RESOURCE.warrior;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  let lastTurn = Number(api.turns) || 0;
  let lastPlayer = null;
  let waitPrimed = false;

  function ensureMana(p = api.player) {
    if (!p) return null;
    const c = cfg();
    if (!Number.isFinite(Number(p.manaMax)) || Number(p.manaMax) <= 0) p.manaMax = c.max;
    else p.manaMax = c.max;
    if (!Number.isFinite(Number(p.mana))) p.mana = p.manaMax;
    p.mana = clamp(Math.round(Number(p.mana) || 0), 0, p.manaMax);
    return p;
  }

  function gainMana(amount, reason) {
    const p = ensureMana();
    if (!p || amount <= 0) return 0;
    const before = p.mana;
    p.mana = clamp(before + amount, 0, p.manaMax);
    const gain = p.mana - before;
    if (gain > 0 && reason === 'focus') feedback(`凝神 +${gain} 蓝量`, 'good', 800);
    return gain;
  }

  function manaCost() { return cfg().cost; }

  function feedback(text, kind='info', ttl=1150) {
    let el = document.getElementById('de-combat-feedback');
    if (!el) {
      el = document.createElement('div');
      el.id = 'de-combat-feedback';
      el.setAttribute('aria-live','polite');
      const stage = document.getElementById('stage');
      if (stage) stage.appendChild(el); else document.body.appendChild(el);
    }
    el.className = kind;
    el.textContent = text;
    el.hidden = false;
    clearTimeout(feedback.timer);
    feedback.timer = setTimeout(() => { el.hidden = true; }, ttl);
  }

  function enemyAt(x,y) {
    return (api.monsters || []).find(m => m && Number(m.hp) > 0 && Number(m.x) === x && Number(m.y) === y) || null;
  }

  function wallAt(x,y) {
    const grid = api.mapGrid;
    return !Array.isArray(grid) || y < 0 || y >= grid.length || !grid[y] || x < 0 || x >= grid[y].length || grid[y][x] === 0;
  }

  function targetInDirection(dx,dy) {
    const p = api.player;
    if (!p || (!dx && !dy)) return null;
    const adjacent = enemyAt(p.x + dx, p.y + dy);
    if (adjacent) return { monster:adjacent, distance:1 };
    const c = api.CLASSES && api.CLASSES[classId()];
    const range = Math.max(0, Number(c && c.rangedRange) || 0);
    let x = p.x, y = p.y;
    for (let i=1;i<=range;i++) {
      x += dx; y += dy;
      if (wallAt(x,y)) break;
      const m = enemyAt(x,y);
      if (m) return { monster:m, distance:i };
    }
    return null;
  }

  function setFacing(dx,dy) {
    const p = api.player;
    if (p && (dx || dy)) p.facing = [dx,dy];
  }

  function attackFacing() {
    if (api.state !== 'playing') return false;
    const p = ensureMana();
    if (!p) return false;
    const facing = Array.isArray(p.facing) && p.facing.length >= 2 ? p.facing : [1,0];
    const dx = Number(facing[0]) || 0, dy = Number(facing[1]) || 0;
    const target = targetInDirection(dx,dy);
    if (!target) {
      feedback('面向敌人后按 J 攻击', 'info');
      return false;
    }
    const before = Number(api.turns) || 0;
    api.tryMove(dx,dy);
    const after = Number(api.turns) || 0;
    if (after > before) {
      const c = cfg();
      gainMana(c.regen + c.attackGain);
      lastTurn = after;
      waitPrimed = false;
      return true;
    }
    return false;
  }

  const coreSkill = api.useSkill;
  api.useSkill = function(...args) {
    if (api.state !== 'playing') return coreSkill.apply(this,args);
    const p = ensureMana();
    if (!p) return coreSkill.apply(this,args);
    if ((Number(p.skillCd) || 0) > 0) return coreSkill.apply(this,args);
    const cost = manaCost();
    if (p.mana < cost) {
      feedback(`蓝量不足：${p.mana}/${cost} · 原地等待可更快恢复`, 'bad', 1500);
      return false;
    }
    const before = Number(api.turns) || 0;
    const beforeCd = Number(p.skillCd) || 0;
    const out = coreSkill.apply(this,args);
    const after = Number(api.turns) || 0;
    if (after > before || (Number(p.skillCd)||0) > beforeCd) {
      p.mana = clamp(p.mana - cost, 0, p.manaMax);
      lastTurn = after;
      waitPrimed = false;
      feedback(`${api.CLASSES[classId()].skill.name} −${cost} 蓝量`, 'skill', 900);
    }
    return out;
  };

  function suppressBumpAttack(e, dx, dy) {
    if (api.state !== 'playing') return false;
    const p = api.player;
    if (!p) return false;
    setFacing(dx,dy);
    const adjacent = enemyAt(p.x + dx, p.y + dy);
    if (adjacent) {
      e.preventDefault();
      e.stopImmediatePropagation();
      feedback('J 攻击 · K 技能', 'info', 700);
      return true;
    }
    const target = targetInDirection(dx,dy);
    if (target && target.distance > 1) {
      const c = api.CLASSES && api.CLASSES[classId()];
      if (c && Number(c.rangedRange) > 0) {
        const saved = c.rangedRange;
        c.rangedRange = 0;
        queueMicrotask(() => { if (c.rangedRange === 0) c.rangedRange = saved; });
      }
    }
    return false;
  }

  function onKeyDown(e) {
    const key = String(e.key || '');
    if (api.state !== 'playing') return;
    if (DIR[key]) {
      suppressBumpAttack(e, DIR[key][0], DIR[key][1]);
      return;
    }
    const lower = key.toLowerCase();
    if (lower === 'j') {
      e.preventDefault(); e.stopImmediatePropagation();
      attackFacing();
      return;
    }
    if (lower === 'k') {
      e.preventDefault(); e.stopImmediatePropagation();
      api.useSkill();
      return;
    }
    if (lower === 'c') {
      e.preventDefault(); e.stopImmediatePropagation();
      feedback('技能热键已改为 K', 'info');
      return;
    }
    if (key === ' ' || key === '.') waitPrimed = true;
  }
  window.addEventListener('keydown', onKeyDown, true);

  function onClickCapture(e) {
    const t = e && e.target;
    if (!t || typeof t.closest !== 'function') return;
    const attack = t.closest('[data-act="attack"]');
    if (attack) {
      e.preventDefault(); e.stopImmediatePropagation();
      attackFacing();
      return;
    }
    const skill = t.closest('[data-act="skill"]');
    if (skill) {
      e.preventDefault(); e.stopImmediatePropagation();
      api.useSkill();
      return;
    }
    const move = t.closest('[data-act="up"],[data-act="down"],[data-act="left"],[data-act="right"]');
    if (!move || api.state !== 'playing') return;
    const d = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[move.dataset.act];
    if (d) suppressBumpAttack(e,d[0],d[1]);
  }
  window.addEventListener('click', onClickCapture, true);

  function installUi() {
    if (document.getElementById('de-mana-stat')) return;
    const hp = document.querySelector('#stats .stat.hp');
    if (hp) {
      const stat = document.createElement('span');
      stat.id = 'de-mana-stat';
      stat.className = 'stat mana';
      stat.innerHTML = '<span id="de-manabar"><i id="de-manafill"></i></span><b id="de-manatext">0/0</b>';
      hp.insertAdjacentElement('afterend', stat);
    }
    const skillBtn = document.querySelector('#actions [data-act="skill"]');
    if (skillBtn) {
      skillBtn.innerHTML = '技能 <span>K</span>';
      if (!document.querySelector('#actions [data-act="attack"]')) {
        const attack = document.createElement('button');
        attack.type = 'button';
        attack.dataset.act = 'attack';
        attack.innerHTML = '攻击 <span>J</span>';
        skillBtn.parentNode.insertBefore(attack, skillBtn);
      }
    }
    const footer = document.getElementById('help');
    if (footer) footer.innerHTML = footer.innerHTML.replace('C 职业技能','J 攻击 · K 职业技能');

    const style = document.createElement('style');
    style.id = 'de-combat-controls-style';
    style.textContent = `
      #de-mana-stat{min-width:126px}
      #de-manabar{display:inline-block;width:66px;height:8px;margin-right:6px;vertical-align:1px;border:1px solid rgba(120,170,255,.45);background:rgba(3,11,27,.8);border-radius:5px;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.65)}
      #de-manafill{display:block;height:100%;width:100%;background:linear-gradient(90deg,#2768d8,#55b6ff);box-shadow:0 0 8px rgba(70,157,255,.5);transition:width .14s ease}
      #de-combat-feedback{position:absolute;left:50%;top:16%;transform:translateX(-50%);z-index:10;pointer-events:none;padding:6px 11px;border-radius:8px;border:1px solid rgba(117,161,226,.4);background:rgba(5,9,18,.86);color:#dbeaff;font:600 13px/1.2 "Segoe UI",sans-serif;box-shadow:0 5px 18px rgba(0,0,0,.35)}
      #de-combat-feedback.bad{border-color:rgba(220,95,95,.55);color:#ffd1d1}
      #de-combat-feedback.good{border-color:rgba(88,185,126,.5);color:#d4ffe0}
      #de-combat-feedback.skill{border-color:rgba(96,154,255,.6);color:#cfe3ff}
      @media(max-width:700px){#de-mana-stat{min-width:108px}#de-manabar{width:52px}}
    `;
    if (document.head) document.head.appendChild(style);
  }

  function syncUi() {
    installUi();
    const p = ensureMana();
    const text = document.getElementById('de-manatext');
    const fill = document.getElementById('de-manafill');
    if (p && text) text.textContent = `${p.mana}/${p.manaMax}`;
    if (p && fill) fill.style.width = `${p.manaMax ? p.mana/p.manaMax*100 : 0}%`;

    const sk = document.getElementById('st-skill');
    if (sk && p) {
      const cost = manaCost();
      if ((Number(p.skillCd)||0) <= 0 && p.mana < cost) {
        sk.textContent = `${api.CLASSES[classId()].skill.name} · ${p.mana}/${cost}`;
        sk.className = 'cd';
      }
    }

    const hint = document.getElementById('hint');
    if (hint && hint.textContent) {
      hint.textContent = hint.textContent
        .replace(/ · J 快速下潜（[^）]*）/g,' · J 攻击 · K 技能')
        .replace(/C 技能/g,'J 攻击 · K 技能');
    }
  }

  function syncTurnResource() {
    const p = api.player;
    if (p !== lastPlayer) {
      lastPlayer = p;
      ensureMana(p);
      lastTurn = Number(api.turns) || 0;
      waitPrimed = false;
    }
    if (!p || api.state !== 'playing') return;
    const turn = Number(api.turns) || 0;
    if (turn > lastTurn) {
      const delta = turn - lastTurn;
      const c = cfg();
      gainMana(c.regen * delta + (waitPrimed ? c.focusGain : 0), waitPrimed ? 'focus' : 'turn');
      lastTurn = turn;
      waitPrimed = false;
    } else if (turn < lastTurn) {
      lastTurn = turn;
    }
  }

  const OLD_EQUIP_MAP = new Map([
    ['0,0',['weapon',0,0]],['1,0',['weapon',1,0]],['2,0',['weapon',3,1]],['3,0',['weapon',3,0]],
    ['0,1',['wearable',0,0]],['1,1',['wearable',2,0]],['2,1',['wearable',4,0]],['3,1',['wearable',3,0]],
    ['0,2',['wearable',0,3]],['1,2',['wearable',2,3]],['2,2',['wearable',4,3]],
    ['0,4',['weapon',2,3]],['1,4',['weapon',5,1]],['2,4',['weapon',4,2]],
    ['3,4',['wearable',0,1]],['0,5',['wearable',2,1]],['1,5',['wearable',3,1]],['2,5',['wearable',5,1]],
    ['3,5',['wearable',0,2]],['0,6',['wearable',1,2]],['1,6',['wearable',2,2]],['2,6',['wearable',4,2]],
    ['3,6',['wearable',0,4]],['0,7',['wearable',1,4]],['1,7',['wearable',3,4]],['2,7',['wearable',5,4]],
  ]);
  const SHEETS = Object.freeze({ weapon:{url:'art/equipment-weapons-v13.png',cols:6,rows:4}, wearable:{url:'art/equipment-wearables-v13.png',cols:6,rows:5} });
  const artImages = {};
  for (const [id,s] of Object.entries(SHEETS)) { const img=new Image(); img.src=s.url; artImages[id]=img; }

  function groundItemAtDraw(args, canvas) {
    if (args.length !== 9 || !canvas) return null;
    const grid = api.mapGrid;
    const cols = Array.isArray(grid) && grid[0] ? grid[0].length : 40;
    const rows = Array.isArray(grid) && grid.length ? grid.length : 28;
    const tw = (Number(canvas.width) || 1280) / Math.max(1, cols);
    const th = (Number(canvas.height) || 896) / Math.max(1, rows);
    const cx = Number(args[5]) + Number(args[7]) / 2;
    const cy = Number(args[6]) + Number(args[8]) / 2;
    const x = Math.floor(cx / tw), y = Math.floor(cy / th);
    return (api.items || []).find(it => it && it.type === 'equip' && it.item && Number(it.x) === x && Number(it.y) === y) || null;
  }

  function patchGroundEquipmentArt() {
    const canvas = document.getElementById('game');
    if (!canvas || canvas.__deGroundEquipPatch) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof ctx.drawImage !== 'function') return;
    const nativeDrawImage = ctx.drawImage.bind(ctx);
    const nativeSave = ctx.save.bind(ctx);
    const nativeRestore = ctx.restore.bind(ctx);
    const nativeStroke = ctx.stroke.bind(ctx);
    const nativeFillRect = ctx.fillRect.bind(ctx);
    const nativeFill = ctx.fill.bind(ctx);
    let heroJustDrawn = false;
    let suppressLegacyGear = false;
    let gearSaveDepth = 0;

    ctx.drawImage = function(...args) {
      const img = args[0];
      const src = String(img && img.src || '');
      if (/hero-atlas-v11\.png(?:[?#].*)?$/i.test(src)) heroJustDrawn = true;

      const oldLoot = /loot-atlas(?:-v12)?\.(?:png|svg)(?:[?#].*)?$/i.test(src);
      if (oldLoot && args.length === 9) {
        const sw = Number(args[3]), sh = Number(args[4]);
        if (sw > 0 && sh > 0) {
          const ix = Math.round(Number(args[1]) / sw), iy = Math.round(Number(args[2]) / sh);
          const ground = groundItemAtDraw(args, canvas);
          const exact = ground && tierArt && typeof tierArt.sourceForItem === 'function'
            ? tierArt.sourceForItem(ground.item) : null;
          const mapped = exact || OLD_EQUIP_MAP.get(`${ix},${iy}`);
          if (mapped) {
            const [sheetId,sx,sy] = mapped, sheet = SHEETS[sheetId], art = artImages[sheetId];
            if (sheet && art && art.complete && art.naturalWidth > 4) {
              const cw = art.naturalWidth / sheet.cols, ch = art.naturalHeight / sheet.rows;
              return nativeDrawImage(art, sx*cw, sy*ch, cw, ch, args[5], args[6], args[7], args[8]);
            }
          }
        }
      }
      return nativeDrawImage(...args);
    };

    // game.js still contains its oldest rarity-coloured weapon/armor/helmet geometry.
    // The first canvas save immediately after the hero-atlas draw exclusively owns that block;
    // suppress its paint calls while preserving canvas state and all later world rendering.
    ctx.save = function(...args) {
      const out = nativeSave(...args);
      if (heroJustDrawn && !suppressLegacyGear) {
        heroJustDrawn = false;
        suppressLegacyGear = true;
        gearSaveDepth = 1;
      } else if (suppressLegacyGear) {
        gearSaveDepth++;
      }
      return out;
    };
    ctx.restore = function(...args) {
      const out = nativeRestore(...args);
      if (suppressLegacyGear) {
        gearSaveDepth--;
        if (gearSaveDepth <= 0) {
          gearSaveDepth = 0;
          suppressLegacyGear = false;
        }
      }
      return out;
    };
    ctx.stroke = function(...args) { if (suppressLegacyGear) return; return nativeStroke(...args); };
    ctx.fillRect = function(...args) { if (suppressLegacyGear) return; return nativeFillRect(...args); };
    ctx.fill = function(...args) { if (suppressLegacyGear) return; return nativeFill(...args); };

    canvas.__deGroundEquipPatch = true;
  }

  function suppressCharacterEquipmentImages() {
    const canvas = document.getElementById('de-visual-polish');
    if (!canvas || canvas.__deCharacterGearSuppressed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof ctx.drawImage !== 'function') return;
    const native = ctx.drawImage.bind(ctx);
    ctx.drawImage = function(...args) {
      const src = String(args[0] && args[0].src || '');
      if (src.includes('equipment-weapons-v13.png') || src.includes('equipment-wearables-v13.png')) return;
      return native(...args);
    };
    canvas.__deCharacterGearSuppressed = true;
  }

  function patchLogCopy() {
    const log = document.getElementById('log');
    if (!log) return;
    for (const node of Array.from(log.children || [])) {
      const text = node.textContent || '';
      if (text.includes('按 C 释放') || text.includes('撞向敌人即攻击')) {
        node.textContent = text.replace(/按 C 释放/g,'按 K 释放').replace(/撞向敌人即攻击。?/g,'面向敌人按 J 攻击。');
      }
    }
  }

  function loop() {
    syncTurnResource();
    syncUi();
    patchGroundEquipmentArt();
    suppressCharacterEquipmentImages();
    patchLogCopy();
    requestAnimationFrame(loop);
  }

  window.__DE_COMBAT_CONTROLS_V1 = {
    version:'v1', resource:RESOURCE, attackFacing, targetInDirection, ensureMana, manaCost,
  };
  requestAnimationFrame(loop);
})();
