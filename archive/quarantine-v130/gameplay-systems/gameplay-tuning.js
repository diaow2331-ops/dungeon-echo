/* Dungeon Echo production gameplay tuning v10.
 * Public route policy + human-play class balance only. Equipment/town/commerce/forge/progression/content own modules.
 *
 * v9 removed permanent balance/mechanics polling. v10 moves class blurbs, guardian/checkpoint
 * guidance and mechanics-integrity labels onto the fixed Chinese/English route, while progression
 * growth remains solely owned by progression-guard-system.js.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_GAMEPLAY_TUNING) return;

  const api = window.DE_TEST;
  if (!api || !api.CLASSES) return;
  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const ui = (zh, en) => english ? en : zh;
  window.__DE_GAMEPLAY_TUNING = 'prod-v10';

  if (api.profileId !== 'classic-100') {
    throw new Error(ui('生产入口必须使用 classic-100 Profile。','Production entry must use the classic-100 Profile.'));
  }

  // Public expedition must discover 1→100 in order. The old paid unseen-floor skip is
  // removed; town-system replaces it with checkpoints unlocked only after guardians.
  document.querySelectorAll('[data-act="quickdive"],#quickdive-fab').forEach(el => el.remove());
  document.addEventListener('keydown', e => {
    if (String(e.key || '').toLowerCase() !== 'j') return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  if (window.__DE_BALANCE_PATCH) return;
  const C = api.CLASSES;

  if (C.warrior) {
    C.warrior.hpBase = 40;
    C.warrior.blurb = ui(
      '厚血近战。坚甲提供稳定容错；横扫冷却较短，正面推进和控场最可靠。',
      'Durable melee fighter. Heavy armor leaves room for mistakes; a short-cooldown sweep makes frontal pressure and control reliable.'
    );
    if (C.warrior.skill) C.warrior.skill.cd = 5;
  }
  if (C.ranger) {
    C.ranger.rangedRange = 4;
    C.ranger.blurb = ui(
      '机动弓手。直线 4 格远射；灵巧闪避近战，疾步用于风筝、穿阵与脱离。',
      'Mobile archer. Fires four tiles in a straight line, dodges melee pressure, and uses Fleet Step to kite, pass threats and disengage.'
    );
  }
  if (C.mage) {
    C.mage.rangedRange = 3;
    C.mage.blurb = ui(
      '脆弱炮台。直线 3 格奥术射击维持距离；奥术弹跨角度点杀高防目标并击退。',
      'Fragile artillery. Three-tile arcane shots maintain distance; Arcane Bolt finishes armored targets from odd angles and knocks them back.'
    );
  }
  if (C.assassin) {
    C.assassin.hpBase = 26;
    C.assassin.blurb = ui(
      '高爆发游猎者。天生暴击 +10%；影袭瞬移斩首，但技能真空期较长，失位代价高。',
      'High-burst hunter. Starts with +10% Crit; Shadow Strike teleports in for executions, but its long downtime makes bad positioning costly.'
    );
    if (C.assassin.skill) C.assassin.skill.cd = 7;
  }

  // Safe migration for untouched old greedy bases. Exact base values only: a player who
  // already gained permanent HP from shrines/talents is not altered retroactively.
  const META_KEY = 'de-greedy-meta-v1';
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  let migrationQueued = false;
  function migrateLegacyBase() {
    const m = api.meta;
    if (!m) return false;
    let changed = false;
    if (m.classId === 'warrior' && m.hpBase === 38) { m.hpBase = 40; changed = true; }
    if (m.classId === 'assassin' && m.hpBase === 24) { m.hpBase = 26; changed = true; }
    if (changed && typeof localStorage !== 'undefined') {
      try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (_e) { /* storage unavailable */ }
    }
    return changed;
  }
  function scheduleMigration() {
    if (migrationQueued) return;
    migrationQueued = true;
    defer(() => { migrationQueued = false; migrateLegacyBase(); });
  }

  migrateLegacyBase();
  document.addEventListener('keydown', scheduleMigration, true);
  document.addEventListener('click', scheduleMigration, true);
  window.addEventListener('focus', scheduleMigration);
  window.addEventListener('pageshow', scheduleMigration);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleMigration(); });

  window.__DE_BALANCE_PATCH = 'human-v2';
  window.DE_BALANCE_MIGRATION = { version:'v3', owner:'gameplay-tuning', locale:english?'en':'zh-CN', migrate:migrateLegacyBase, schedule:scheduleMigration };
})();


/* P0 mechanics integrity v2: guardian gates, checkpoint proof, input parity and safe recovery. */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_MECHANICS_INTEGRITY) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const CLEAR_KEY = 'de-guardian-clears-v1';
  const RUN_KEY = 'de-run-v6';
  const GATES = [10,20,30,40,50,60,70,80,90];
  const CPS = [1,11,21,31,41,51,61,71,81,91];
  const DIR = { ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],W:[0,-1],s:[0,1],S:[0,1],a:[-1,0],A:[-1,0],d:[1,0],D:[1,0] };
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const ui = (zh, en) => english ? en : zh;
  let lastDepth = Number(api.depth) || 0;
  let sawGuardian = false;
  let syncQueued = false;
  const sessionClears = new Set();
  let pendingAttack = null;
  let keyCtx = null;

  const cid = () => api.classId || (api.meta && api.meta.classId) || 'warrior';
  const isGate = d => GATES.includes(Number(d) || 0);
  const guardian = () => (api.monsters || []).find(m => m && m.midBoss && m.hp > 0) || null;
  const equipAtk = () => Object.values((api.player && api.player.equip) || {}).reduce((n,it) => n + (it && it.stats ? Number(it.stats.atk) || 0 : 0), 0);
  const atk = () => Math.max(1, (Number(api.player && api.player.atkBase) || 0) + equipAtk());
  const mobHp = () => (api.monsters || []).reduce((n,m) => n + Math.max(0, Number(m && m.hp) || 0), 0);

  function loadClears() {
    try {
      const x = JSON.parse(localStorage.getItem(CLEAR_KEY));
      if (x && x.v === 1 && x.classes && typeof x.classes === 'object') return x;
    } catch (e) {}
    return { v:1, classes:{} };
  }
  function saveClears(x) { try { localStorage.setItem(CLEAR_KEY, JSON.stringify(x)); } catch (e) {} }
  function row(create) {
    const state = loadClears(), key = cid();
    let r = state.classes[key];
    if (!r && create && api.meta) {
      const best = Math.max(0, Number(api.meta.bestDepth) || 0);
      r = { migrated:true, clears:GATES.filter(d => best >= d + 1) };
      state.classes[key] = r; saveClears(state);
    }
    return { state, key, row:r || { migrated:true, clears:[] } };
  }
  function guardianCleared(depth) {
    depth = Number(depth) || 0;
    if (sessionClears.has(depth)) return true;
    const r = row(!!api.meta).row;
    return Array.isArray(r.clears) && r.clears.includes(depth);
  }
  function markGuardianClear(depth) {
    depth = Number(depth) || 0;
    if (!isGate(depth)) return false;
    const fresh = !sessionClears.has(depth); sessionClears.add(depth);
    if (!api.meta) return fresh;
    const x = row(true); x.row.clears = Array.isArray(x.row.clears) ? x.row.clears : [];
    if (!x.row.clears.includes(depth)) { x.row.clears.push(depth); x.row.clears.sort((a,b)=>a-b); x.state.classes[x.key]=x.row; saveClears(x.state); return true; }
    return fresh;
  }
  const allowedCheckpoints = () => CPS.filter(d => d === 1 || guardianCleared(d - 1));
  function canLeaveDepth() {
    const d = Number(api.depth) || 0;
    if (!isGate(d)) return true;
    if (guardian()) return false;
    if (sawGuardian) markGuardianClear(d);
    return guardianCleared(d);
  }
  function blockDescent(e) {
    if (api.state !== 'playing' || canLeaveDepth()) return false;
    if (e) { e.preventDefault(); e.stopImmediatePropagation(); }
    const h = document.getElementById('hint');
    if (h) h.textContent = ui(
      `› 第 ${api.depth} 层守卫仍在。击败守卫后出口才会稳定。`,
      `› Floor ${api.depth} guardian still blocks the exit. Defeat it before descending.`
    );
    return true;
  }

  const coreDescend = api.descend;
  if (typeof coreDescend === 'function') api.descend = function(...args) {
    if (blockDescent(null)) return false;
    const out = coreDescend.apply(this,args);
    scheduleSync();
    return out;
  };

  function sanitizeGuardianSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(RUN_KEY));
      if (!raw || raw.profileId !== 'classic-100' || !Array.isArray(raw.monsters)) return false;
      let changed = false;
      for (const m of raw.monsters) {
        if (!m || (!m.midBoss && !m.boss)) continue;
        if (m.slow) { m.slow=false; changed=true; }
        if (Number(m.skip)) { m.skip=0; changed=true; }
        // Floor-10 armorBreakCharge/mode are core telegraph state and must survive reload.
        // Only content-system's transient slow/skip reservation fields are sanitized here.
      }
      if (changed) localStorage.setItem(RUN_KEY, JSON.stringify(raw));
      return changed;
    } catch (e) { return false; }
  }

  function syncCheckpointUi() {
    if (api.state !== 'town') return;
    const allowed = new Set(allowedCheckpoints());
    const buttons = Array.from(document.querySelectorAll('#town-checkpoints [data-checkpoint]'));
    for (const b of buttons) {
      const d = Number(b.dataset && b.dataset.checkpoint) || 1, ok = allowed.has(d);
      b.disabled = !ok; b.hidden = !ok;
      if (!ok) b.title = ui(`先击败第 ${d-1} 层守卫才能解锁`, `Defeat the Floor ${d-1} guardian to unlock this checkpoint`);
    }
    const selected = window.DE_TOWN_CHECKPOINTS && Number(window.DE_TOWN_CHECKPOINTS.selected) || 1;
    if (!allowed.has(selected) && buttons.length) {
      const d = Math.max(...allowed), b = buttons.find(x => Number(x.dataset && x.dataset.checkpoint) === d);
      if (b && typeof b.click === 'function') b.click();
    }
  }

  function ensureTalentFallback() {
    if (api.state !== 'talent') return;
    const grid = document.getElementById('talent-grid');
    if (!grid || grid.querySelector('button[data-talent]') || (api.TALENTS || []).length) return;
    const t = {
      id:'overflow_supply',
      name:ui('余烬整备','Ember Resupply'),
      desc:ui('可成长天赋已达上限：获得药水 +1、卷轴 +1。','All scalable talents are capped: gain +1 Potion and +1 Teleport Scroll.'),
      apply(p){ p.potions=(p.potions||0)+1; p.scrolls=(p.scrolls||0)+1; }
    };
    api.TALENTS.push(t);
    grid.innerHTML = `<button type="button" class="class-card" data-talent="${t.id}"><h3>${t.name}</h3><p>${t.desc}</p></button>`;
  }

  function directionalTarget(dx,dy) {
    const p = api.player, grid = api.mapGrid;
    if (!p || !Array.isArray(grid)) return false;
    const at = (x,y) => (api.monsters || []).find(m => m && m.hp > 0 && m.x===x && m.y===y);
    if (at(p.x+dx,p.y+dy)) return true;
    if (cid() !== 'ranger') return false;
    const range = Math.max(0, Number(api.CLASSES.ranger && api.CLASSES.ranger.rangedRange) || 0);
    let x=p.x,y=p.y;
    for (let i=0;i<range;i++) { x+=dx;y+=dy; if (y<0||y>=grid.length||!grid[y]||x<0||x>=grid[y].length||grid[y][x]===0) return false; if (at(x,y)) return true; }
    return false;
  }

  function attackPlan(kind,talents,killed) {
    const has = id => talents.has(id); let scale=0,label='';
    if (kind==='ranger') {
      if (has('se_r60_marksman')) { scale=.35; label=ui('拉弦余势','Draw Momentum'); }
      if (has('se_r80_phantom') && scale<.20) { scale=.20; label=ui('幻步余势','Phantom Momentum'); }
      if (has('se_r80_chain') && killed && scale<.25) { scale=.25; label=ui('无尽追猎','Endless Hunt'); }
    } else if (kind==='assassin') {
      if (has('se_a60_mark')) { scale=.40; label=ui('死亡标记','Death Mark'); }
      if (has('se_a80_predator') && !killed && scale<.25) { scale=.25; label=ui('猎物未死','Prey Survives'); }
    }
    return scale ? { scale,label } : null;
  }

  const coreSkill = api.useSkill;
  if (typeof coreSkill === 'function') api.useSkill = function(...args) {
    const turn=Number(api.turns)||0, count=(api.monsters||[]).length;
    const out=coreSkill.apply(this,args), p=api.player;
    if (p && (Number(api.turns)||0)>turn) pendingAttack=attackPlan(cid(),new Set(p.talents||[]),(api.monsters||[]).length<count);
    scheduleSync();
    return out;
  };

  function pointerAttackBoost(e) {
    if (!pendingAttack || api.state!=='playing' || !api.player) return;
    const t=e&&e.target, game=document.getElementById('game');
    const btn=t&&typeof t.closest==='function' ? t.closest('[data-act="up"],[data-act="down"],[data-act="left"],[data-act="right"]') : null;
    let arm=t===game;
    if (btn) { const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[btn.dataset.act]; arm=!!d&&directionalTarget(d[0],d[1]); }
    if (!arm) return;
    const p=api.player, base=Number(p.atkBase)||0, hp=mobHp(), count=(api.monsters||[]).length;
    p.atkBase=base+Math.max(1,Math.round(atk()*pendingAttack.scale));
    defer(()=>{ if(api.player===p)p.atkBase=base; if((api.monsters||[]).length<count||mobHp()<hp)pendingAttack=null; });
  }

  function suppressIdleRegen(force,key) {
    const p=api.player;
    if (!p || api.state!=='playing' || (p.grievous||0)>0) return;
    if (!force && DIR[key] && directionalTarget(DIR[key][0],DIR[key][1])) return;
    p.grievous=1;
    defer(()=>{ if(api.player===p && p.grievous===1)p.grievous=0; });
  }

  window.addEventListener('keydown',e=>{
    scheduleSync();
    const key=String(e.key||''); if(api.state!=='playing')return;
    if(['Enter','n','N','PageDown','>'].includes(key)&&blockDescent(e))return;
    if(key===' '||key==='.')suppressIdleRegen(true,key); else if(DIR[key]&&!directionalTarget(DIR[key][0],DIR[key][1]))suppressIdleRegen(false,key);
    if(pendingAttack&&DIR[key]&&directionalTarget(DIR[key][0],DIR[key][1])&&api.player) keyCtx={ base:Number(api.player.atkBase)||0, attack:atk(), plan:pendingAttack };
  },true);

  document.addEventListener('keydown',e=>{
    if(!keyCtx||!DIR[String(e.key||'')]||!api.player)return;
    const c=keyCtx; keyCtx=null; const p=api.player;
    const legacy=(Number(p.atkBase)||0)-c.base, desired=Math.max(1,Math.round(c.attack*c.plan.scale));
    p.atkBase+=desired-legacy; pendingAttack=null;
    defer(()=>{ if(api.player===p)p.atkBase=c.base; });
  },true);

  window.addEventListener('click',e=>{
    scheduleSync();
    const t=e&&e.target; if(!t)return;
    const closest=s=>typeof t.closest==='function'?t.closest(s):null;
    if(closest('#btn-continue'))sanitizeGuardianSave();
    if(closest('[data-act="descend"],#descend-fab')&&blockDescent(e))return;
    const cp=closest('[data-checkpoint]');
    if(cp&&!allowedCheckpoints().includes(Number(cp.dataset&&cp.dataset.checkpoint)||1)){e.preventDefault();e.stopImmediatePropagation();return;}
    const depart=closest('#btn-depart');
    if(depart&&api.state==='town'&&window.DE_TOWN_CHECKPOINTS){const s=Number(window.DE_TOWN_CHECKPOINTS.selected)||1;if(!allowedCheckpoints().includes(s)){e.preventDefault();e.stopImmediatePropagation();const d=Math.max(...allowedCheckpoints());if(typeof window.DE_TOWN_CHECKPOINTS.travel==='function')window.DE_TOWN_CHECKPOINTS.travel(d);return;}}
    if(closest('[data-act="wait"]'))suppressIdleRegen(true,'');
    const move=closest('[data-act="up"],[data-act="down"],[data-act="left"],[data-act="right"]');
    if(move){const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[move.dataset.act];if(d&&!directionalTarget(d[0],d[1]))suppressIdleRegen(true,'');}
    else if(t===document.getElementById('game')&&api.player){const p=api.player,turn=Number(api.turns)||0,hp=Number(p.hp)||0,mh=mobHp(),mc=(api.monsters||[]).length;defer(()=>{if(api.player!==p||(Number(api.turns)||0)<=turn)return;const hit=(api.monsters||[]).length<mc||mobHp()<mh;if(!hit&&p.hp>hp&&(p.grievous||0)===0)p.hp=Math.max(hp,p.hp-1);});}
    pointerAttackBoost(e);
  },true);

  // content-system calls these API references for telegraphed specials; ordinary AI uses lexical core functions.
  const specialRanged=api.monsterRangedAttack;
  function fixedDr(){const p=api.player;if(!p)return 0;const w=cid()==='warrior'?1+Math.floor(((Number(p.lvl)||1)-1)/5):0;return Math.max(0,Number(p.flatDr)||0)+w;}
  function specialHit(m,meleeScale){const p=api.player;if(!p||typeof specialRanged!=='function')return;const fd=Number(p.flatDr)||0,ma=m&&Number(m.atk),extra=fixedDr();p.flatDr=fd+extra;if(meleeScale&&m&&Number.isFinite(ma))m.atk=Math.max(1,Math.round(ma*1.25));try{return specialRanged(m,false);}finally{p.flatDr=fd;if(meleeScale&&m&&Number.isFinite(ma))m.atk=ma;}}
  if(typeof specialRanged==='function'){api.monsterRangedAttack=m=>specialHit(m,false);api.monsterAttack=m=>specialHit(m,true);}

  function sync(){
    const d=Number(api.depth)||0;
    if(d!==lastDepth){lastDepth=d;sawGuardian=false;}
    if(api.state==='playing'&&isGate(d)){if(guardian())sawGuardian=true;else if(sawGuardian)markGuardianClear(d);}
    if(api.state==='town')syncCheckpointUi();
    ensureTalentFallback();
    const h=document.getElementById('hint');
    if(h&&/J\s*快速下潜|快速下潜|Quick Dive/.test(String(h.textContent||'')))h.textContent=isGate(d)&&guardian()
      ? ui(`› 第 ${d} 层守卫封锁出口 · 击败后才能下潜`,`› Floor ${d} guardian blocks the exit · defeat it before descending`)
      : ui('› 站在楼梯上按 Enter 下潜 · 未征服区域不能跳层','› Stand on stairs and press Enter to descend · unconquered floors cannot be skipped');
  }
  function scheduleSync(){
    if(syncQueued)return;
    syncQueued=true;
    defer(()=>{syncQueued=false;sync();});
  }

  sanitizeGuardianSave();
  sync();
  window.addEventListener('focus',scheduleSync);
  window.addEventListener('pageshow',scheduleSync);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSync();});
  window.DE_MECHANICS_INTEGRITY={
    version:'p0-v2',guardianCleared,markGuardianClear,allowedCheckpoints,canLeaveDepth,
    sanitizeGuardianSave,attackPlan,sync,schedule: scheduleSync,owner:'gameplay-tuning',locale:english?'en':'zh-CN'
  };
})();
