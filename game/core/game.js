/* 地牢回响 Dungeon Echo v6.2 —— PC 网页优先的回合制地牢肉鸽
 * v6：修第二层起空关；三十层 + 无尽回响；天赋 / 神龛 / 陷阱 / 密道；点击移动。
 * v6.1：新增刺客职业（瞬移偷袭技能「影袭」）；四职业各自专属武器（剑斧/弓/法杖/匕首）；低生命屏幕警示。
 * v6.2：游侠真可远程射箭；标题下潜深度选择（10/20/30/40/50/60 层）；40 层起新扩展（新怪/新主题/中层 Boss）。
 * 纯原生 JS + Canvas，零依赖。可 file:// 离线打开。
 */
(() => {
'use strict';
if (typeof window !== 'undefined' && window.__DE_BOOTED) return;
if (typeof window !== 'undefined') window.__DE_BOOTED = true;

// ================= 工具 =================
const rnd = n => Math.floor(rng() * n);
const ri = (a, b) => a + rnd(b - a + 1);
const pick = arr => arr[rnd(arr.length)];
const inB = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const raf = typeof requestAnimationFrame !== 'undefined'
  ? requestAnimationFrame : (f => setTimeout(f, 16));
const caf = typeof cancelAnimationFrame !== 'undefined'
  ? cancelAnimationFrame : clearTimeout;
const esc = value => String(value).replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));
const LOCALE_DATA = typeof window !== 'undefined' && window.DE_LOCALE_DATA || null;
const ENGLISH_ROUTE = !!(LOCALE_DATA ? LOCALE_DATA.isEnglish :
  (typeof document !== 'undefined' && String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase() === 'en'));
const ui = (zh, en) => ENGLISH_ROUTE ? en : zh;
const visibleWorldName = value => LOCALE_DATA && typeof LOCALE_DATA.worldName === 'function'
  ? LOCALE_DATA.worldName(value) : String(value || '');
const visibleItemName = item => LOCALE_DATA && typeof LOCALE_DATA.itemName === 'function'
  ? LOCALE_DATA.itemName(item) : String(item && item.name || '');
const visibleSlotName = slot => LOCALE_DATA && typeof LOCALE_DATA.slotName === 'function'
  ? LOCALE_DATA.slotName(slot) : String(slot || '');

const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const mini = $('minimap');
const mctx = mini ? mini.getContext('2d') : null;

// ================= 常量 =================
const MAP_W = 40, MAP_H = 28, TILE = 32;
const SAVE_KEY = 'de-run-v6';
const SAVE_VERSION = 2;
const META_KEY = 'de-greedy-meta-v1';
const GREEDY_KEY = 'de-greedy-on-v1';
const RUN_MODE_CLASSIC = 'classic';
const RUN_MODE_GREEDY = 'greedy';

// ================= 贪婪远征（元进度） =================
let greedyMode = false;
try {
  greedyMode = typeof localStorage !== 'undefined' &&
    localStorage.getItem(GREEDY_KEY) === '1';
} catch (e) { /* 无 localStorage 环境 */ }

let meta = null;
function defaultMeta(classId) {
  const c = CLASSES[classId] || CLASSES.warrior;
  return {
    v: 1, classId: c.id,
    gold: 0,
    lvl: 1, xp: 0,
    hpBase: c.hpBase, atkBase: c.atkBase,
    critBase: 0, leechBase: 0, skillHaste: 0, goldFind: 0, flatDr: 0, grievous: 0,
    thornsBase: 0, regenBase: 0, potionBoost: 0, critPower: 0, grivResist: 0,
    plunder: 0, fastRegen: 0,
    talents: [],
    potions: Math.max(2, c.potions), scrolls: c.scrolls, keys: 0, escapes: 2,
    insurance: 0,
    totalKills: 0, wins: 0, wheelTotal: 0, gotLegend: 0, achv: {},
    wheelSpins: 0, wheelResets: 0, wheelSlots: null,
    equip: { weapon: null, armor: null, ring: null },
    bag: [], stash: [],
    bestDepth: 0, runs: 0, deaths: 0,
  };
}
function loadMeta() {
  try {
    const raw = JSON.parse(localStorage.getItem(META_KEY));
    if (!raw || raw.v !== 1 || !CLASSES[raw.classId]) return null;
    return raw;
  } catch (e) { return null; }
}
// 逐字段修复损坏/篡改的元档——绝不因脏数据吞掉玩家进度
function sanitizeMeta(raw) {
  const base = defaultMeta(raw && raw.classId && CLASSES[raw.classId] ? raw.classId : 'warrior');
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const num = (v, d, lo) =>
    (typeof v === 'number' && Number.isFinite(v) && v >= (lo === undefined ? 0 : lo)) ? Math.floor(v) : d;
  base.gold = num(raw.gold, 0);
  base.lvl = Math.max(1, num(raw.lvl, 1, 1));
  base.xp = num(raw.xp, 0);
  base.hpBase = Math.max(1, num(raw.hpBase, base.hpBase, 1));
  base.atkBase = num(raw.atkBase, base.atkBase);
  base.critBase = num(raw.critBase, 0);
  base.leechBase = num(raw.leechBase, 0);
  base.skillHaste = num(raw.skillHaste, 0);
  base.goldFind = num(raw.goldFind, 0);
  base.flatDr = num(raw.flatDr, 0);
  base.potions = num(raw.potions, base.potions);
  base.scrolls = num(raw.scrolls, base.scrolls);
  base.keys = num(raw.keys, 0);
  base.escapes = num(raw.escapes, base.escapes);
  base.insurance = num(raw.insurance, 0);
  base.wheelSpins = num(raw.wheelSpins, 0);
  base.wheelResets = num(raw.wheelResets, 0);
  base.wheelSlots = (Array.isArray(raw.wheelSlots) && raw.wheelSlots.length === WHEEL_SLOTS &&
    raw.wheelSlots.every(s => s && typeof s === 'object' && !Array.isArray(s) && typeof s.kind === 'string'))
    ? raw.wheelSlots : null;
  base.totalKills = num(raw.totalKills, 0);
  base.wins = num(raw.wins, 0);
  base.wheelTotal = num(raw.wheelTotal, 0);
  base.gotLegend = raw.gotLegend ? 1 : 0;
  base.achv = {};
  if (raw.achv && typeof raw.achv === 'object' && !Array.isArray(raw.achv)) {
    for (const k of Object.keys(raw.achv))
      if (raw.achv[k]) base.achv[k] = 1;
  }
  base.bestDepth = num(raw.bestDepth, 0);
  base.runs = num(raw.runs, 0);
  base.deaths = num(raw.deaths, 0);
  base.talents = Array.isArray(raw.talents)
    ? raw.talents.filter(t => typeof t === 'string').slice(0, 64) : [];
  const okItem = it => it && typeof it === 'object' && !Array.isArray(it) &&
    typeof it.name === 'string' && typeof it.slot === 'string';
  const okEquipSlot = e => okItem(e) ? e : null;
  ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'].forEach(s => {
    base.equip[s] = (raw.equip && typeof raw.equip === 'object') ? okEquipSlot(raw.equip[s]) : null;
  });
  base.bag = (Array.isArray(raw.bag) ? raw.bag : []).filter(okItem).slice(0, BAG_CAP);
  base.stash = (Array.isArray(raw.stash) ? raw.stash : []).filter(okItem).slice(0, 200);
  return base;
}
function saveMeta() {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* 忽略 */ }
}
function setGreedy(on) {
  greedyMode = !!on;
  try { localStorage.setItem(GREEDY_KEY, greedyMode ? '1' : '0'); } catch (e) { /* 忽略 */ }
}

const CLASSES = {
  warrior: {
    id: 'warrior', name: '战士',
    blurb: '厚血近战。被动「坚甲」：防御随等级成长。横扫清场，硬碰硬推进。',
    hpBase: 38, atkBase: 4, potions: 2, scrolls: 0,
    skill: { id: 'cleave', name: '横扫', cd: 6, desc: '对相邻敌人造成 150% 攻击伤害。' },
  },
  ranger: {
    id: 'ranger', name: '游侠',
    blurb: '弓箭手，直线内可远程射击。被动「灵巧」：一成几率闪避近战。',
    hpBase: 28, atkBase: 3, potions: 1, scrolls: 1,
    rangedRange: 5,
    skill: { id: 'dash', name: '疾步', cd: 6, desc: '沿上次移动方向冲刺 2 格，途经敌人受伤。' },
  },
  mage: {
    id: 'mage', name: '秘术师',
    blurb: '脆弱的炮台。奥术弹远程点杀高防并击退，卷轴更多。',
    hpBase: 24, atkBase: 2, potions: 1, scrolls: 2,
    skill: { id: 'bolt', name: '奥术弹', cd: 5, desc: '打击视野内最近敌人，无视部分防御并击退。' },
  },
  assassin: {
    id: 'assassin', name: '刺客',
    blurb: '瞬影突袭。血肉薄弱但刀刀见血（天生暴击 +10%），一击可致命。',
    hpBase: 24, atkBase: 3, potions: 1, scrolls: 1,
    critBase: 10,
    skill: { id: 'backstab', name: '影袭', cd: 6, desc: '瞬移至视野内最近敌人身侧，打出必定暴击的偷袭。' },
  },
};

const TALENTS = [
  { id: 'iron',  name: '铁骨', desc: '生命上限 +12，并立即回复 12 点生命。', apply: p => { p.hpBase += 12; p.hp = Math.min(pMaxHp(), p.hp + 12); } },
  { id: 'edge',  name: '锋刃', desc: '基础攻击 +2。', apply: p => { p.atkBase += 2; } },
  { id: 'luck',  name: '幸运', desc: '暴击率 +8%。', apply: p => { p.critBase = (p.critBase || 0) + 8; } },
  { id: 'blood', name: '血契', desc: '吸血 +5%。', apply: p => { p.leechBase = (p.leechBase || 0) + 5; } },
  { id: 'haste', name: '迅捷', desc: '技能冷却永久 -1（最少 2 回合）。', apply: p => { p.skillHaste = (p.skillHaste || 0) + 1; } },
  { id: 'pack',  name: '行囊', desc: '立刻获得药水 +1、卷轴 +1。', apply: p => { p.potions++; p.scrolls++; } },
  { id: 'gold',  name: '点金', desc: '金币获取 +20%。', apply: p => { p.goldFind = (p.goldFind || 0) + 20; } },
  { id: 'ward',  name: '护咒', desc: '受到的伤害 -1。', apply: p => { p.flatDr = (p.flatDr || 0) + 1; } },
  // —— 机制型天赋（v6.4 扩充）：让 build 有分化而不只是数值堆叠 ——
  { id: 'bramble', name: '荆棘之心', desc: '反伤 +4（配高防护甲越挨打越赚）。', apply: p => { p.thornsBase = (p.thornsBase || 0) + 4; } },
  { id: 'scavenge', name: '食腐', desc: '击杀回复 +3。', apply: p => { p.regenBase = (p.regenBase || 0) + 3; } },
  { id: 'elixir', name: '强效药剂', desc: '药水治疗效果 +40%。', apply: p => { p.potionBoost = (p.potionBoost || 0) + 40; } },
  { id: 'frenzy', name: '致命节奏', desc: '暴击伤害 +25%（1.8 倍 → 约 2.05 倍）。', apply: p => { p.critPower = (p.critPower || 0) + 25; } },
  { id: 'tenacity', name: '坚韧', desc: '重伤持续 -1 回合（最少 1）。', apply: p => { p.grivResist = (p.grivResist || 0) + 1; } },
  { id: 'plunder', name: '掠夺者', desc: '击杀掉落金币 +25%。', apply: p => { p.plunder = (p.plunder || 0) + 25; } },
  { id: 'stone', name: '石肤', desc: '受到的伤害 -2。', apply: p => { p.flatDr = (p.flatDr || 0) + 2; } },
  { id: 'echoborn', name: '回响体', desc: '自然回复加快：每 4 回合 +1 生命。', apply: p => { p.fastRegen = true; } },
];


function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function makeRng(seed) {
  let a = seed | 0;
  const next = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.getState = () => a >>> 0;
  next.setState = s => { a = s | 0; };
  return next;
}
let rngFn = makeRng(1);
const rng = () => rngFn();
let vfxFn = makeRng(0x5EED5EED);
const vfx = () => vfxFn();
let RUN_SEED = '';
function setSeed(s) {
  RUN_SEED = String(s);
  rngFn = makeRng(hashSeed(RUN_SEED));
}
const WALL = 0, FLOOR = 1, STAIRS = 2;
const BAG_CAP = 12;

const LOOT_ICON_IDS = Object.freeze([
  'iron-sword', 'broad-sword', 'battle-axe', 'rune-blade',
  'leather-armor', 'chain-mail', 'plate-armor', 'mithril-armor',
  'copper-ring', 'ruby-ring', 'guardian-ring', 'healing-potion',
  'teleport-scroll', 'gold-pile', 'dungeon-heart', 'dungeon-key',
  'dagger', 'hunting-bow', 'arcane-staff',
  // 六栏位扩展（21-32 号格）：美术批次待补图集格子，此前渲染回退 0 号格
  'helm-cloth', 'helm-iron', 'helm-knight', 'helm-dragon',
  'boots-cloth', 'boots-leather', 'boots-steel', 'boots-wind',
  'amulet-copper', 'amulet-moonstone', 'amulet-guardian', 'amulet-abyss',
]);
const LOOT_ICON_INDEX = Object.fromEntries(LOOT_ICON_IDS.map((id, i) => [id, i]));
const lootAtlas = new Image();
lootAtlas.src = 'art/loot-atlas.png';
const heroAtlasV11 = new Image();
heroAtlasV11.src = 'art/hero-atlas-v11.png';
const monsterAtlasV11 = new Image();
monsterAtlasV11.src = 'art/monster-atlas-v11.png';
const guardianAtlasV11 = new Image();
guardianAtlasV11.src = 'art/guardian-atlas-v11.png';
const finalBossV11 = new Image();
finalBossV11.src = 'art/final-boss-v11.png';
const townBackdropV11 = new Image();
townBackdropV11.src = 'art/town-backdrop-v11.webp';
const imageReady = image => !!image && image.complete && image.naturalWidth > 4;
const MONSTER_ART_INDEX = Object.fromEntries([
  'rat', 'bat', 'goblin', 'spider',
  'skeleton', 'orc', 'ghost', 'cultist',
  'troll', 'demon', 'wraith', 'frostmage',
  'golem', 'vampire', 'lich', 'dragonkin',
].map((id, i) => [id, i]));
const lootCoord = id => {
  const i = LOOT_ICON_INDEX[id] ?? 0;
  return { x: i % 4, y: Math.floor(i / 4) };
};
const lootMarkup = id => {
  const p = lootCoord(id);
  return `<span class="loot-icon" style="--ix:${p.x};--iy:${p.y}" aria-hidden="true"></span>`;
};

// ================= 内容 Profile 加载与校验（fail-closed） =================
function validateProfile(p) {
  const errs = [];
  const need = (cond, m) => { if (!cond) errs.push(m); };
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const isNum = (v, lo = -Infinity) =>
    typeof v === 'number' && Number.isFinite(v) && v >= lo;
  const isInt = (v, lo = -Infinity) => Number.isInteger(v) && v >= lo;
  const isStr = v => typeof v === 'string' && v.length > 0;

  if (!isObj(p)) throw new Error('Profile 必须是对象');
  need(p.schemaVersion === 1 || p.schemaVersion === 2, 'schemaVersion 必须为 1 或 2');
  need(isStr(p.profileId), 'profileId 缺失');
  need(isStr(p.title), 'title 缺失');

  const fr = p.floorRules;
  need(isObj(fr), 'floorRules 缺失');
  if (isObj(fr)) {
    need(isInt(fr.maxDepth, 1), 'floorRules.maxDepth 非法');
    need(isInt(fr.themeBandSize, 1), 'floorRules.themeBandSize 非法');
    need(isInt(fr.baseMonsterCount, 0), 'floorRules.baseMonsterCount 非法');
    need(isInt(fr.monsterPerDepth, 0), 'floorRules.monsterPerDepth 非法');
    need(isInt(fr.maxMonsters, 1), 'floorRules.maxMonsters 非法');
    need(isNum(fr.eliteChance, 0) && fr.eliteChance <= 1, 'eliteChance 非法');
    need(isNum(fr.eliteHpMult, 1) && isNum(fr.eliteAtkMult, 1), 'elite 倍率非法');
    need(isNum(fr.depthScaleMax, 0) && fr.depthScaleMax <= 4, 'depthScaleMax 非法');

    const lc = fr.lootChances;
    need(isObj(lc) && ['scroll', 'equip1', 'equip2']
      .every(k => isNum(lc[k], 0) && lc[k] <= 1), 'lootChances 非法');
    const kl = fr.killLoot;
    need(isObj(kl) && isNum(kl.gold, 0) && kl.gold < kl.potion &&
      kl.potion < kl.equip && kl.equip <= 1, 'killLoot 阈值须递增且 ≤1');
    const ln = fr.lootCounts;
    need(isObj(ln) && ['potionLo', 'potionHi', 'goldLo', 'goldHi',
      'floorGoldLo', 'floorGoldHi', 'floorGoldPerDepth',
      'killGoldLo', 'killGoldHi', 'killGoldPerDepth']
      .every(k => isInt(ln[k], 0)), 'lootCounts 非法');
    need(isInt(ln.potionLo, 0) && ln.potionLo <= ln.potionHi &&
      isInt(ln.goldLo, 0) && ln.goldLo <= ln.goldHi, 'lootCounts 区间非法');
  }

  need(Array.isArray(p.themes) && p.themes.length > 0, 'themes 缺失');
  if (Array.isArray(p.themes)) p.themes.forEach((t, i) => {
    ['name', 'fl', 'fl2', 'sp1', 'sp2', 'wa', 'wl', 'wh'].forEach(k =>
      need(isStr(t[k]), `themes[${i}].${k} 非法`));
  });

  need(Array.isArray(p.monsters) && p.monsters.length > 0, 'monsters 缺失');
  if (Array.isArray(p.monsters)) p.monsters.forEach((m, i) => {
    ['sprite', 'name', 'color'].forEach(k => need(isStr(m[k]), `monsters[${i}].${k} 非法`));
    ['hp', 'atk', 'def', 'xp'].forEach(k => need(isNum(m[k], 0), `monsters[${i}].${k} 非法`));
    need(isInt(m.min, 1) && isInt(m.max, 1) && m.min <= m.max,
      `monsters[${i}].min/max 非法`);
  });
  if (Array.isArray(p.monsters) && isObj(fr) && isInt(fr.maxDepth, 1)) {
    for (let d = 1; d <= fr.maxDepth; d++) {
      need(p.monsters.some(m => m.min <= d && d <= m.max),
        `第 ${d} 层没有可出现的怪物`);
    }
  }

  const checkBoss = (b, label) => {
    need(isObj(b), `${label} 缺失`);
    if (isObj(b)) {
      ['sprite', 'name', 'color'].forEach(k => need(isStr(b[k]), `${label}.${k} 非法`));
      ['hp', 'atk', 'def', 'xp'].forEach(k => need(isNum(b[k], 0), `${label}.${k} 非法`));
    }
  };
  checkBoss(p.boss, 'boss');
  if (p.midBoss) {
    checkBoss(p.midBoss, 'midBoss');
    need(isInt(p.midBoss.depth, 1) && p.midBoss.depth < (fr && fr.maxDepth || 99),
      'midBoss.depth 必须浅于 maxDepth');
  }
  if (p.midBosses) {
    need(Array.isArray(p.midBosses) && p.midBosses.length > 0, 'midBosses 非法');
    if (Array.isArray(p.midBosses)) p.midBosses.forEach((b, i) => {
      checkBoss(b, `midBosses[${i}]`);
      if (isObj(b)) need(isInt(b.depth, 1) && b.depth < (fr && fr.maxDepth || 99),
        `midBosses[${i}].depth 必须浅于 maxDepth`);
    });
  }
  if (p.shopFloors) {
    need(Array.isArray(p.shopFloors) && p.shopFloors.every(n => isInt(n, 1)), 'shopFloors 非法');
  }

  const checkBases = (arr, label, statKey) => {
    need(Array.isArray(arr) && arr.length > 0, `${label} 缺失`);
    if (Array.isArray(arr)) arr.forEach((it, i) => {
      need(isStr(it.name), `${label}[${i}].name 非法`);
      need(LOOT_ICON_IDS.includes(it.icon), `${label}[${i}].icon 不在图集身份表内`);
      need(isNum(it[statKey], 1), `${label}[${i}].${statKey} 非法`);
      need(isInt(it.min, 1), `${label}[${i}].min 非法`);
    });
  };
  checkBases(p.weaponBases, 'weaponBases', 'atk');
  checkBases(p.armorBases, 'armorBases', 'def');
  checkBases(p.ringBases, 'ringBases', 'hp');

  need(Array.isArray(p.rarities) && p.rarities.length > 0, 'rarities 缺失');
  if (Array.isArray(p.rarities)) {
    p.rarities.forEach((r, i) => {
      need(isStr(r.name) && isStr(r.color), `rarities[${i}].name/color 非法`);
      need(isInt(r.affixes, 0), `rarities[${i}].affixes 非法`);
      need(isNum(r.w, 0), `rarities[${i}].w 非法`);
    });
    const totalW = p.rarities.reduce((s, r) => s + (Number(r.w) || 0), 0);
    need(totalW > 0, 'rarities 总权重必须 > 0');
  }

  const ar = p.affixRanges;
  need(isObj(ar), 'affixRanges 缺失');
  if (isObj(ar)) {
    ['atk', 'def', 'hp', 'crit', 'leech', 'gold', 'thorns', 'regen'].forEach(k => {
      const r = ar[k];
      if (!isObj(r) || !isNum(r.lo, 0)) { need(false, `affixRanges.${k} 非法`); return; }
      const hi = r.hiGrow !== undefined ? r.hiGrow : r.hi;
      need(isNum(hi, 0) && hi >= r.lo, `affixRanges.${k} 区间上下界非法`);
      if (r.growDiv !== undefined) need(isNum(r.growDiv, 1), `affixRanges.${k}.growDiv 必须 > 0`);
    });
  }

  const tr = p.terminalReward;
  need(isObj(tr) && isStr(tr.kind) && isStr(tr.name) &&
    LOOT_ICON_IDS.includes(tr.icon), 'terminalReward 非法（icon 必须在图集身份表内）');
  if (isObj(tr)) {
    need(isNum(tr.bossGoldBase, 0) && isNum(tr.bossGoldPerDepth, 0),
      'terminalReward 金币参数非法');
  }

  const cs = p.consumables;
  need(isObj(cs) && ['potion', 'scroll', 'gold'].every(k =>
    isObj(cs[k]) && isStr(cs[k].name) && LOOT_ICON_IDS.includes(cs[k].icon)),
    'consumables 非法（icon 必须在图集身份表内）');
  if (cs && cs.key) {
    need(isStr(cs.key.name) && LOOT_ICON_IDS.includes(cs.key.icon), 'consumables.key 非法');
  }

  need(isObj(p.texts) && ['intro', 'bossGate', 'bossFloorArrive',
    'maxDepthArrive', 'bossDeath', 'winBody'].every(k => isStr(p.texts[k])),
    'texts 缺失或非法');

  if (errs.length) throw new Error('内容 Profile 校验失败：' + errs.join('；'));
  return p;
}
function requireProfile(id) {
  const reg = (typeof window !== 'undefined' && window.DE_PROFILES) || {};
  if (!Object.prototype.hasOwnProperty.call(reg, id)) {
    throw new Error(`未知内容 Profile「${id}」（可用：${Object.keys(reg).join('、') || '无'}）`);
  }
  if (!reg[id] || reg[id].profileId !== id) {
    throw new Error(`注册键「${id}」与 profileId 不一致`);
  }
  return validateProfile(reg[id]);
}

let PROFILE_ID = 'classic-30';
let bootSeedQuery = null;
try {
  if (typeof location !== 'undefined' && location.search) {
    const q = new URLSearchParams(location.search);
    if (q.get('profile')) PROFILE_ID = q.get('profile');
    bootSeedQuery = q.get('seed');
  }
} catch (e) { /* 无 location 环境（无头测试） */ }

let RUN_PROFILE;
try {
  RUN_PROFILE = Object.freeze(requireProfile(PROFILE_ID));
} catch (err) {
  try {
    document.body.innerHTML =
      '<div style="color:#e0a73f;background:#17100b;min-height:100vh;' +
      'display:flex;align-items:center;justify-content:center;' +
      'font:16px/1.9 sans-serif;padding:24px;text-align:center">地牢回响无法启动：' +
      String(err.message).replace(/[<>&"]/g,
        c => ({ '<': '<', '>': '>', '&': '&', '"': '"' }[c])) +
      '</div>';
  } catch (e2) { /* 无 DOM 环境 */ }
  throw err;
}
setSeed(bootSeedQuery || Date.now());

const FOV_R = 7, AI_SIGHT = 8, AI_MEM = 6, MAX_DEPTH = RUN_PROFILE.floorRules.maxDepth;
const THEMES = RUN_PROFILE.themes;
const MONSTERS = RUN_PROFILE.monsters;
const BOSS_BASE = RUN_PROFILE.boss;
const MID_BOSSES = Array.isArray(RUN_PROFILE.midBosses) && RUN_PROFILE.midBosses.length
  ? RUN_PROFILE.midBosses
  : (RUN_PROFILE.midBoss ? [RUN_PROFILE.midBoss] : []);
const MID_BOSS = MID_BOSSES[0] || null;
const RARITIES = RUN_PROFILE.rarities;
const WEAPON_BASES = RUN_PROFILE.weaponBases;
const ARMOR_BASES = RUN_PROFILE.armorBases;
const RING_BASES = RUN_PROFILE.ringBases;
// 六栏位扩展新增基础表（系统级常量；后续美术/内容批次可迁移进 profile）
const HELMET_BASES = [
  { name: '布帽',     icon: 'helm-cloth',   def: 1, min: 1 },
  { name: '铁盔',     icon: 'helm-iron',    def: 2, min: 3 },
  { name: '骑士头盔', icon: 'helm-knight',  def: 3, hp: 6,  min: 5 },
  { name: '龙冠',     icon: 'helm-dragon',  def: 5, hp: 10, min: 7 },
];
const BOOT_BASES = [
  { name: '草鞋',     icon: 'boots-cloth',   def: 1, hp: 3,  min: 1 },
  { name: '皮靴',     icon: 'boots-leather', def: 1, hp: 6,  min: 3 },
  { name: '钢胫甲',   icon: 'boots-steel',   def: 2, hp: 10, min: 5 },
  { name: '疾风之靴', icon: 'boots-wind',    def: 3, hp: 14, min: 7 },
];
const AMULET_BASES = [
  { name: '铜坠链',   icon: 'amulet-copper',    hp: 6,  min: 1 },
  { name: '月石坠',   icon: 'amulet-moonstone', hp: 10, crit: 3, min: 3 },
  { name: '守护圣符', icon: 'amulet-guardian',  hp: 16, crit: 5, min: 5 },
  { name: '深渊之眼', icon: 'amulet-abyss',     hp: 24, crit: 8, min: 7 },
];
const SHOP_FLOORS = RUN_PROFILE.shopFloors || [];
const REST_FLOORS = RUN_PROFILE.restFloors || [];
const SHOP = RUN_PROFILE.shop || { potionPrice: 16, scrollPrice: 28, keyPrice: 22, healPrice: 24, equipMult: 3 };
const ENDLESS_AFTER = !!(RUN_PROFILE.floorRules && RUN_PROFILE.floorRules.endlessAfter);
const CONTENT_RULES = typeof window !== 'undefined' ? window.DE_CONTENT_RULES_V130 : null;
if (!CONTENT_RULES || CONTENT_RULES.authority !== 'content-classification')
  throw new Error('Dungeon Echo content-classification authority missing');
const themeIdx = d => CONTENT_RULES.themeIndex(d, THEMES.length, RUN_PROFILE.floorRules.themeBandSize);
const PROFILE_TEXT_EN = Object.freeze({
  intro:'A hundred-floor abyss opens below. Choose an echo, cut through {maxDepth} floors, reclaim the {heart} from {boss} — or descend forever.',
  bossGate:'{boss} seals the final stairs. Defeat it and reclaim the {heart}!',
  bossFloorArrive:'The stars die overhead… {boss} is on this floor!',
  maxDepthArrive:'You enter Floor {maxDepth} — the hollowed-out end of the abyss.',
  bossDeath:'{boss} falls! The {heart} it guarded drops to the floor!',
  winBody:'You claimed the <b>{heart}</b>. The hundred-floor dungeon collapses behind you!<br>',
  midBossArrive:'A deep guardian seals this floor.',
  midBossDeath:'{midBoss} dissolves. The stairs into the depths light again.',
  shopArrive:'A masked merchant opens a stall beneath the torchlight. Gold can buy survival.',
  restArrive:'An ember camp. You can dress your wounds here.',
  shrineArrive:'A nameless shrine glows in the dark. Touch it and accept the echo\'s wager.',
  endlessArrive:'You refuse the road home. Echoes stack floor upon floor — no end, only deeper.',
  floorClear:'The floor is clear. Gold floods the stairs as the clear bonus enters your pouch.',
});
const runText = (key, fallback='') => ui(
  RUN_PROFILE.texts && RUN_PROFILE.texts[key] || fallback,
  PROFILE_TEXT_EN[key] || fallback
);
const fmtText = s => String(s)
  .replace('{boss}', visibleWorldName(BOSS_BASE.name))
  .replace('{midBoss}', visibleWorldName(MID_BOSS ? MID_BOSS.name : BOSS_BASE.name))
  .replace('{heart}', visibleWorldName(RUN_PROFILE.terminalReward.name))
  .replace('{maxDepth}', String(MAX_DEPTH))
  .replace('{depth}', String(depth))
  .replace('{theme}', THEMES[themeIdx(depth)] ? visibleWorldName(THEMES[themeIdx(depth)].name) : '');


const AFFIX_LABEL = {
  atk:   v => LOCALE_DATA ? LOCALE_DATA.affixText('atk', v) : `攻击 +${v}`,
  def:   v => LOCALE_DATA ? LOCALE_DATA.affixText('def', v) : `防御 +${v}`,
  hp:    v => LOCALE_DATA ? LOCALE_DATA.affixText('hp', v) : `生命 +${v}`,
  crit:  v => LOCALE_DATA ? LOCALE_DATA.affixText('crit', v) : `暴击 +${v}%`,
  leech: v => LOCALE_DATA ? LOCALE_DATA.affixText('leech', v) : `吸血 +${v}%`,
  gold:  v => LOCALE_DATA ? LOCALE_DATA.affixText('gold', v) : `金币获取 +${v}%`,
  thorns: v => LOCALE_DATA ? LOCALE_DATA.affixText('thorns', v) : `反伤 +${v}`,
  regen:  v => LOCALE_DATA ? LOCALE_DATA.affixText('regen', v) : `击杀回复 +${v}`,
};

// Epic / Legendary 机制词缀：不增加新按键，只改变现有动作的决策价值。
// 每个槽位拥有独立池，同一角色无法同时装备两个相同槽位，因此天然避免同机制叠层。
const MECHANIC_TRAITS = {
  echo_edge: { name: '锋鸣', slots: ['weapon'], text: ['施放职业技能后，下一回合的下一次普攻伤害 +25%。', '施放职业技能后，下一回合的下一次普攻伤害 +40%。'] },
  reaper: { name: '收割', slots: ['weapon'], text: ['普攻击杀敌人时额外返还 1 回合技能冷却。', '普攻击杀敌人时额外返还 2 回合技能冷却。'] },
  brace: { name: '镇守', slots: ['armor'], text: ['等待后，本轮下一次敌人直击伤害降低 35%。', '等待后，本轮下一次敌人直击伤害降低 50%。'] },
  reprisal: { name: '反击甲', slots: ['armor'], text: ['被敌人直击后，下一回合近战普攻伤害 +30%。', '被敌人直击后，下一回合近战普攻伤害 +50%。'] },
  clarity: { name: '清创', slots: ['helmet'], text: ['喝药后额外缩短 1 回合重伤。', '喝药后直接清除重伤。'] },
  skirmish: { name: '游猎', slots: ['boots'], text: ['正常移动后，下一回合远程普攻伤害 +25%。', '正常移动后，下一回合远程普攻伤害 +40%。'] },
  afterimage: { name: '残影', slots: ['boots'], text: ['施放职业技能后，本轮下一次敌人直击伤害降低 25%。', '施放职业技能后，本轮下一次敌人直击伤害降低 40%。'] },
  duelist: { name: '决斗', slots: ['ring'], text: ['只与 1 名相邻敌人缠斗时，近战普攻伤害 +20%。', '只与 1 名相邻敌人缠斗时，近战普攻伤害 +35%。'] },
  crisis: { name: '危机脉搏', slots: ['ring'], text: ['生命不高于 40% 时暴击率 +12%。', '生命不高于 40% 时暴击率 +20%。'] },
  overclock: { name: '回路超频', slots: ['amulet'], text: ['职业技能造成击杀时额外返还 1 回合冷却。', '职业技能造成击杀时额外返还 2 回合冷却。'] },
  meditate: { name: '凝息', slots: ['amulet'], text: ['等待时额外恢复 1 回合技能冷却。', '等待时额外恢复 2 回合技能冷却。'] },
};
const MECHANIC_POOLS = {
  weapon: ['echo_edge', 'reaper'],
  armor: ['brace', 'reprisal'],
  helmet: ['clarity'],
  boots: ['skirmish', 'afterimage'],
  ring: ['duelist', 'crisis'],
  amulet: ['overclock', 'meditate'],
};
function mechanicForFreshItem(slot, rarity, d, base, affixes) {
  if (rarity < 3) return null;
  const pool = MECHANIC_POOLS[slot] || [];
  if (!pool.length) return null;
  // 使用已有生成结果派生，不额外消耗战斗 RNG，避免高稀有掉落改变后续房间随机序列。
  const sig = [RUN_SEED, slot, rarity, d, base && base.name,
    (affixes || []).map(a => `${a.k}:${a.v}`).join(',')].join('|');
  const id = pool[hashSeed(sig) % pool.length];
  return { id, power: rarity >= 4 ? 2 : 1 };
}
function mechanicDescription(it) {
  if (LOCALE_DATA && typeof LOCALE_DATA.mechanicText === 'function') return LOCALE_DATA.mechanicText(it);
  const def = it && MECHANIC_TRAITS[it.mechanic];
  if (!def) return '';
  const p = Math.max(1, Math.min(2, Number(it.mechanicPower) || 1));
  return `◆ ${def.name}：${def.text[p - 1]}`;
}

// ================= 音效（WebAudio 合成） =================
let audioCtx = null, muted = false;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { /* 无音频环境 */ }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    try { audioCtx.resume(); } catch (e) { /* 忽略 */ }
  }
}
function beep(freq, dur, type = 'square', vol = 0.07, slide = 0) {
  if (muted || !audioCtx) return;
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq * (0.96 + vfx() * 0.08);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), audioCtx.currentTime + dur);
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* 忽略 */ }
}
const sfx = {
  hit()    { beep(180, .07, 'square', .05, -60); },
  crit()   { beep(340, .12, 'sawtooth', .07, -160); },
  hurt()   { beep(110, .14, 'sawtooth', .08, -40); },
  pickup() { beep(660, .06, 'sine', .05); setTimeout(() => beep(880, .08, 'sine', .05), 55); },
  potion() { beep(500, .14, 'sine', .06, 140); },
  levelup(){ [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .12, 'triangle', .06), i * 90)); },
  stairs() { beep(320, .22, 'triangle', .06, -140); },
  die()    { beep(220, .5, 'sawtooth', .09, -170); },
  win()    { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => beep(f, .18, 'triangle', .07), i * 120)); },
  equip()  { beep(440, .08, 'triangle', .06, 80); },
  skill()  { beep(520, .1, 'sawtooth', .06, 180); beep(280, .16, 'triangle', .05, -40); },
  shop()   { beep(390, .1, 'sine', .05); setTimeout(() => beep(520, .12, 'sine', .05), 70); },
  chest()  { beep(240, .12, 'square', .06, 80); setTimeout(() => beep(480, .1, 'triangle', .05), 90); },
};

// ================= 状态 =================
let map, explored, visible;
let player, monsters = [], items = [], npcs = [], traps = [], secrets = [];
let depth, turns, state;
let classId = 'warrior';
let logLines = [];
const floaters = [], particles = [], arrows = [];
let trauma = 0, hitstop = 0;
let selectedBagIndex = -1;
let view = { x: 0, y: 0, cols: MAP_W, rows: MAP_H };
let shopStock = [];
let floorCleared = false;
let pendingTalent = false;
let shrineTarget = null;
let reducedMotion = false;

try {
  reducedMotion = typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch (e) { /* ignore */ }

function addTrauma(n) { if (!reducedMotion) trauma = Math.min(1, trauma + n); }
function addHitstop(sec) { if (!reducedMotion) hitstop = Math.max(hitstop, sec); }

// ================= 消息 =================
function msg(text, cls) {
  logLines.unshift({ text, cls });
  if (logLines.length > 30) logLines.pop();
  const logEl = $('log');
  if (logEl) logEl.innerHTML = logLines
    .map(l => `<div${l.cls ? ` class="${esc(l.cls)}"` : ''}>${esc(l.text)}</div>`).join('');
}
const rarityLogCls = r => r >= 4 ? 'gold' : r === 3 ? 'epic' : 'good';

// ================= 特效 =================
function floater(ent, text, color) {
  floaters.push({ x: ent.fx * TILE + TILE / 2, y: ent.fy * TILE, text, color, life: 1 });
}
function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = vfx() * Math.PI * 2, sp = 30 + vfx() * 70;
    particles.push({
      x: x * TILE + TILE / 2, y: y * TILE + TILE / 2,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
      life: .5 + vfx() * .3, color, size: 2 + Math.floor(vfx() * 3),
    });
  }
}
function fireArrow(x0, y0, x1, y1) {
  arrows.push({
    x0: x0 * TILE + TILE / 2, y0: y0 * TILE + TILE / 2,
    x1: x1 * TILE + TILE / 2, y1: y1 * TILE + TILE / 2,
    t: 0, dur: 0.16,
  });
}

// ================= 矢量精灵 =================
function mk(size, fn) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  fn(g, size);
  const w = document.createElement('canvas'); w.width = w.height = size;
  const wg = w.getContext('2d');
  wg.drawImage(c, 0, 0);
  wg.globalCompositeOperation = 'source-in';
  wg.fillStyle = '#ffffff'; wg.fillRect(0, 0, size, size);
  return { img: c, white: w, url: typeof c.toDataURL === 'function' ? c.toDataURL() : '' };
}
function ell(g, x, y, rx, ry, fill, line, lw) {
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (line) { g.strokeStyle = line; g.lineWidth = lw || 2; g.stroke(); }
}
function poly(g, pts, fill, line, lw) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (line) { g.strokeStyle = line; g.lineWidth = lw || 2; g.stroke(); }
}
function eye(g, x, y, r, iris) {
  ell(g, x, y, r, r, '#fff');
  ell(g, x + r * .25, y + r * .15, r * .5, r * .5, iris || '#14161c');
}
function seg(g, x1, y1, x2, y2, color, w) {
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2);
  g.strokeStyle = color; g.lineWidth = w || 2; g.stroke();
}

const SPRITE_FNS = {
  hero(g) {
    ell(g, 16, 21, 8, 8, '#8a3030', '#3a1414', 2);
    poly(g, [[27.5, 3], [29.2, 5.5], [29.2, 16.5], [25.8, 16.5], [25.8, 5.5]], '#dfe6f0', '#5a6478', 1.5);
    seg(g, 27.5, 6, 27.5, 15, '#9aa4b8', 1);
    g.fillStyle = '#e0b34d'; g.fillRect(24.2, 16.5, 7.2, 2.4);
    g.strokeStyle = '#8a6a20'; g.lineWidth = 1; g.strokeRect(24.2, 16.5, 7.2, 2.4);
    g.fillStyle = '#6b4a2f'; g.fillRect(26.6, 18.9, 2.4, 4);
    ell(g, 27.8, 24.6, 1.9, 1.9, '#e0b34d', '#8a6a20', 1);
    ell(g, 5.5, 20.5, 3.4, 4.6, '#8a94a8', '#3c4454', 2);
    seg(g, 5.5, 16.8, 5.5, 24.2, '#e0b34d', 1.5);
    seg(g, 2.6, 20.5, 8.4, 20.5, '#e0b34d', 1.5);
    ell(g, 16, 21, 6.6, 6.6, '#aeb8c9', '#3c4454', 2);
    seg(g, 10.5, 22.5, 21.5, 22.5, '#e0b34d', 1.5);
    ell(g, 16, 10.5, 6, 5.6, '#aeb8c9', '#3c4454', 2);
    g.fillStyle = '#1c202a'; g.fillRect(10.8, 9.3, 10.4, 3);
    ell(g, 13.8, 10.8, 1.1, 1.1, '#9fd8ff');
    ell(g, 18.2, 10.8, 1.1, 1.1, '#9fd8ff');
    ell(g, 16, 4.4, 2.3, 2.5, '#c8452c', '#6a1f14', 1.5);
  },
  heroRanger(g) {
    poly(g, [[7, 28], [10, 14], [16, 9], [22, 14], [25, 28]], '#315f45', '#163523', 2);
    poly(g, [[10, 15], [16, 5], [22, 15], [20, 13], [12, 13]], '#274d38', '#163523', 2);
    ell(g, 16, 13, 4.6, 4.2, '#c89568', '#40281c', 1.5);
    ell(g, 14.2, 12.7, .9, .9, '#b9f2c7'); ell(g, 17.8, 12.7, .9, .9, '#b9f2c7');
    seg(g, 7, 8, 4, 26, '#b8884f', 1.8);
    g.beginPath(); g.arc(3.8, 17, 7.5, -1.25, 1.25); g.strokeStyle = '#d9bd7a'; g.lineWidth = 1.4; g.stroke();
    seg(g, 4, 17, 12, 17, '#dfe7d4', 1.2);
    poly(g, [[12, 17], [9, 15.5], [9, 18.5]], '#dfe7d4');
    g.fillStyle = '#7c5030'; g.fillRect(23, 9, 3, 14);
    seg(g, 24.5, 8, 24.5, 3, '#dfe7d4', 1); seg(g, 25.5, 9, 27, 4, '#dfe7d4', 1);
  },
  heroMage(g) {
    poly(g, [[7, 28], [10, 15], [16, 10], [22, 15], [25, 28]], '#324577', '#171d42', 2);
    poly(g, [[5, 10], [16, 2], [27, 10], [20, 11], [12, 11]], '#465aa2', '#20295a', 2);
    poly(g, [[12, 11], [16, 5], [21, 17], [11, 17]], '#394c8d', '#20295a', 1.5);
    ell(g, 16, 15, 4.2, 3.8, '#d0a071', '#4b2d20', 1.3);
    ell(g, 14.2, 14.7, 1, 1, '#b7ecff'); ell(g, 17.8, 14.7, 1, 1, '#b7ecff');
    seg(g, 25.5, 28, 26.5, 9, '#8d6040', 2.3);
    ell(g, 26.8, 7, 3.2, 3.2, '#72d8ff', '#d9f6ff', 1.2);
    ell(g, 25.8, 6.2, 1, 1, 'rgba(255,255,255,.9)');
    poly(g, [[10, 25], [16, 21], [22, 25], [19, 28], [13, 28]], '#5f52a4', '#2c255b', 1);
  },
  heroAssassin(g) {
    poly(g, [[7, 28], [9, 14], [16, 8], [23, 14], [25, 28]], '#502335', '#25111b', 2);
    poly(g, [[8, 13], [12, 5], [20, 5], [24, 13], [20, 18], [12, 18]], '#6d2b41', '#2b111c', 2);
    g.fillStyle = '#24151d'; g.fillRect(11, 11, 10, 5);
    ell(g, 13.7, 12.8, 1, .8, '#ff5b5b'); ell(g, 18.3, 12.8, 1, .8, '#ff5b5b');
    g.fillStyle = '#2d1720'; g.fillRect(10, 19, 12, 4);
    seg(g, 8, 19, 3.5, 27, '#d6dde8', 2); seg(g, 24, 19, 28.5, 27, '#d6dde8', 2);
    poly(g, [[3.5, 27], [2, 22.5], [6.5, 25]], '#d6dde8', '#646d7c', 1);
    poly(g, [[28.5, 27], [30, 22.5], [25.5, 25]], '#d6dde8', '#646d7c', 1);
    g.fillStyle = '#a77838'; g.fillRect(5, 19, 4, 2); g.fillRect(23, 19, 4, 2);
  },
  rat(g) {
    g.strokeStyle = '#d898a0'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(6, 24); g.quadraticCurveTo(2, 19, 8, 15); g.stroke();
    ell(g, 10, 9, 3.5, 3.5, '#9a7b52', '#4a3620', 2);
    ell(g, 22, 9, 3.5, 3.5, '#9a7b52', '#4a3620', 2);
    ell(g, 10, 9, 1.7, 1.7, '#e2a8b8');
    ell(g, 22, 9, 1.7, 1.7, '#e2a8b8');
    ell(g, 16, 19, 9, 7.5, '#9a7b52', '#4a3620', 2);
    ell(g, 16, 21.8, 5, 3.6, '#c9a97e');
    eye(g, 12.5, 16.5, 1.7);
    eye(g, 19.5, 16.5, 1.7);
    ell(g, 16, 20.6, 1.7, 1.3, '#e2a8b8', '#8a4a58', 1);
    seg(g, 7, 20.2, 12, 21, '#4a3620', 1);
    seg(g, 25, 20.2, 20, 21, '#4a3620', 1);
    ell(g, 11, 26.5, 2.2, 1.3, '#7a5f3e', '#4a3620', 1);
    ell(g, 21, 26.5, 2.2, 1.3, '#7a5f3e', '#4a3620', 1);
  },
  bat(g) {
    poly(g, [[3, 15], [12, 8], [13, 18]], '#4a3a66', '#1e1430', 2);
    poly(g, [[29, 15], [20, 8], [19, 18]], '#4a3a66', '#1e1430', 2);
    seg(g, 8, 12.5, 11, 15.5, '#1e1430', 1);
    seg(g, 24, 12.5, 21, 15.5, '#1e1430', 1);
    poly(g, [[13, 9], [14.5, 4.5], [16.5, 8.5]], '#5d4a78', '#241a33', 1.5);
    poly(g, [[19, 9], [17.5, 4.5], [15.5, 8.5]], '#5d4a78', '#241a33', 1.5);
    ell(g, 16, 15.5, 4.8, 6, '#5d4a78', '#241a33', 2);
    ell(g, 14, 13.5, 1.4, 1.4, '#ff5555');
    ell(g, 18, 13.5, 1.4, 1.4, '#ff5555');
    poly(g, [[14.6, 18.6], [15.3, 20.6], [16, 18.8]], '#fff');
    poly(g, [[17.4, 18.6], [16.7, 20.6], [16, 18.8]], '#fff');
  },
  goblin(g) {
    poly(g, [[3, 11], [11.5, 8.5], [10.5, 15.5]], '#6da34d', '#2c4520', 2);
    poly(g, [[29, 11], [20.5, 8.5], [21.5, 15.5]], '#6da34d', '#2c4520', 2);
    ell(g, 16, 24.5, 5.6, 4.6, '#6da34d', '#2c4520', 2);
    g.fillStyle = '#7a5230'; g.fillRect(12, 23.5, 8, 4.2);
    g.strokeStyle = '#4a3018'; g.lineWidth = 1; g.strokeRect(12, 23.5, 8, 4.2);
    ell(g, 16, 13, 7.6, 6.6, '#6da34d', '#2c4520', 2);
    eye(g, 13, 12, 1.9, '#3a5a1a');
    eye(g, 19, 12, 1.9, '#3a5a1a');
    seg(g, 10.5, 9, 14.5, 10.2, '#2c4520', 1.5);
    seg(g, 21.5, 9, 17.5, 10.2, '#2c4520', 1.5);
    seg(g, 12.5, 16.8, 19.5, 16.8, '#2c4520', 1.6);
    g.fillStyle = '#e8e4d8';
    g.fillRect(14, 16.2, 1.4, 1.6); g.fillRect(17, 16.2, 1.4, 1.6);
  },
  skeleton(g) {
    seg(g, 16, 16, 16, 18.6, '#e8e4d8', 3);
    seg(g, 11, 19.5, 7.5, 24.5, '#e8e4d8', 2.5);
    seg(g, 21, 19.5, 24.5, 24.5, '#e8e4d8', 2.5);
    ell(g, 7, 25.5, 1.5, 1.5, '#e8e4d8', '#8a857a', 1);
    ell(g, 25, 25.5, 1.5, 1.5, '#e8e4d8', '#8a857a', 1);
    g.fillStyle = '#e8e4d8'; g.strokeStyle = '#8a857a'; g.lineWidth = 1.5;
    g.fillRect(12.5, 25.5, 7, 3); g.strokeRect(12.5, 25.5, 7, 3);
    seg(g, 11.5, 19.8, 20.5, 19.8, '#e8e4d8', 2);
    seg(g, 12.3, 22, 19.7, 22, '#e8e4d8', 2);
    seg(g, 13.2, 24.2, 18.8, 24.2, '#e8e4d8', 2);
    ell(g, 16, 10.5, 6.4, 6, '#e8e4d8', '#8a857a', 2);
    ell(g, 13.4, 10, 1.9, 2.2, '#1c1f26');
    ell(g, 18.6, 10, 1.9, 2.2, '#1c1f26');
    ell(g, 13.4, 10, .7, .8, '#7ec8e3');
    ell(g, 18.6, 10, .7, .8, '#7ec8e3');
    poly(g, [[16, 12.2], [15, 14], [17, 14]], '#1c1f26');
    seg(g, 12.8, 15.2, 19.2, 15.2, '#8a857a', 1.5);
    for (let i = 0; i < 4; i++) seg(g, 13.8 + i * 1.6, 14.6, 13.8 + i * 1.6, 16.2, '#c9c4b4', 1);
  },
  orc(g) {
    ell(g, 6, 22, 3.2, 4.4, '#5e7d3a', '#2c3d18', 2);
    ell(g, 26, 22, 3.2, 4.4, '#5e7d3a', '#2c3d18', 2);
    ell(g, 16, 21.5, 9.6, 8, '#5e7d3a', '#2c3d18', 2);
    ell(g, 16, 23, 6.6, 5, '#4a4f5c', '#2a2e38', 2);
    ell(g, 13, 21.5, .8, .8, '#e0b34d');
    ell(g, 19, 21.5, .8, .8, '#e0b34d');
    ell(g, 16, 10, 6.6, 5.6, '#5e7d3a', '#2c3d18', 2);
    seg(g, 10.8, 8, 14.8, 9.4, '#2c3d18', 2);
    seg(g, 21.2, 8, 17.2, 9.4, '#2c3d18', 2);
    ell(g, 13.5, 10.8, 1.5, 1.2, '#e04535');
    ell(g, 18.5, 10.8, 1.5, 1.2, '#e04535');
    seg(g, 12.5, 13.6, 19.5, 13.6, '#2c3d18', 2);
    poly(g, [[13.2, 13.4], [14.2, 10.6], [15.2, 13.4]], '#e8e4d8', '#8a857a', 1);
    poly(g, [[18.8, 13.4], [17.8, 10.6], [16.8, 13.4]], '#e8e4d8', '#8a857a', 1);
  },
  ghost(g) {
    g.globalAlpha = .92;
    g.beginPath();
    g.arc(16, 14, 7.5, Math.PI, 0);
    g.lineTo(23.5, 25);
    g.lineTo(20, 28); g.lineTo(16, 25); g.lineTo(12, 28); g.lineTo(8.5, 25);
    g.closePath();
    g.fillStyle = 'rgba(214,228,242,.94)'; g.fill();
    g.strokeStyle = 'rgba(110,135,160,.9)'; g.lineWidth = 2; g.stroke();
    g.globalAlpha = 1;
    ell(g, 13.4, 13, 1.7, 2.3, '#2a3442');
    ell(g, 18.6, 13, 1.7, 2.3, '#2a3442');
    ell(g, 16, 17.8, 1.5, 1.9, '#2a3442');
  },
  troll(g) {
    ell(g, 5.5, 20, 3.4, 6.2, '#3f7d6d', '#1c3a32', 2);
    ell(g, 26.5, 20, 3.4, 6.2, '#3f7d6d', '#1c3a32', 2);
    ell(g, 16, 21, 10, 8.6, '#3f7d6d', '#1c3a32', 2);
    ell(g, 16, 23.5, 6, 4.4, '#5a9a86');
    ell(g, 16, 10.5, 7, 6, '#3f7d6d', '#1c3a32', 2);
    ell(g, 13.5, 9.5, 1.3, 1, '#e8c14f');
    ell(g, 18.5, 9.5, 1.3, 1, '#e8c14f');
    poly(g, [[12.8, 14.8], [13.8, 11.8], [14.8, 14.8]], '#e8e4d8', '#8a857a', 1);
    poly(g, [[17.2, 14.8], [18.2, 11.8], [19.2, 14.8]], '#e8e4d8', '#8a857a', 1);
    seg(g, 11.5, 15.6, 20.5, 15.6, '#1c3a32', 1.6);
    ell(g, 9.5, 17.5, 1.6, 1.1, '#6da34d');
    ell(g, 22.5, 25, 1.6, 1.1, '#6da34d');
    ell(g, 15, 27.5, 1.4, 1, '#6da34d');
  },
  demon(g) {
    poly(g, [[4, 9], [13, 12.5], [8, 21]], '#6a1f1a', '#2a0c0a', 2);
    poly(g, [[28, 9], [19, 12.5], [24, 21]], '#6a1f1a', '#2a0c0a', 2);
    ell(g, 8, 22.5, 2.6, 3.6, '#b03a30', '#4a1410', 2);
    ell(g, 24, 22.5, 2.6, 3.6, '#b03a30', '#4a1410', 2);
    ell(g, 16, 20.5, 7.6, 6.6, '#b03a30', '#4a1410', 2);
    ell(g, 16, 11, 6, 5.6, '#b03a30', '#4a1410', 2);
    poly(g, [[11.4, 7.4], [9.6, 2.4], [13.8, 6.4]], '#e8d8b0', '#8a7a50', 1.5);
    poly(g, [[20.6, 7.4], [22.4, 2.4], [18.2, 6.4]], '#e8d8b0', '#8a7a50', 1.5);
    ell(g, 13.4, 10.6, 1.6, 1.2, '#ffd66b');
    ell(g, 18.6, 10.6, 1.6, 1.2, '#ffd66b');
    seg(g, 13, 13.8, 19, 13.8, '#4a1410', 1.6);
    poly(g, [[14, 13.6], [14.7, 15.4], [15.4, 13.6]], '#e8e4d8');
    poly(g, [[18, 13.6], [17.3, 15.4], [16.6, 13.6]], '#e8e4d8');
  },
  boss(g) {
    poly(g, [[5, 15], [20, 7], [15, 27]], '#5a1815', '#200806', 2.5);
    poly(g, [[39, 15], [24, 7], [29, 27]], '#5a1815', '#200806', 2.5);
    seg(g, 10, 14, 17, 17, '#200806', 1.5);
    seg(g, 34, 14, 27, 17, '#200806', 1.5);
    g.strokeStyle = '#8a6a52'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(31, 33); g.quadraticCurveTo(38, 36, 36, 41); g.stroke();
    poly(g, [[36, 41], [40, 43], [37, 38.5]], '#8a2620', '#2a0a08', 1.5);
    ell(g, 22, 28, 11, 9, '#8a2620', '#2a0a08', 2.5);
    ell(g, 22, 30, 7, 5.4, '#c8785a');
    seg(g, 17, 28.5, 27, 28.5, '#a05a40', 1.2);
    seg(g, 17.8, 31, 26.2, 31, '#a05a40', 1.2);
    ell(g, 22, 14, 8.6, 7, '#8a2620', '#2a0a08', 2.5);
    ell(g, 22, 18, 5, 3, '#a04030', '#2a0a08', 1.5);
    ell(g, 20, 18.6, .7, .5, '#2a0a08');
    ell(g, 24, 18.6, .7, .5, '#2a0a08');
    poly(g, [[16.5, 9], [13, 2.5], [19, 7.5]], '#e8d8b0', '#8a7a50', 1.5);
    poly(g, [[27.5, 9], [31, 2.5], [25, 7.5]], '#e8d8b0', '#8a7a50', 1.5);
    ell(g, 18.4, 12.5, 2, 1.4, '#ff8c2a');
    ell(g, 25.6, 12.5, 2, 1.4, '#ff8c2a');
    ell(g, 18.4, 12.5, .8, .8, '#ffe0a0');
    ell(g, 25.6, 12.5, .8, .8, '#ffe0a0');
    poly(g, [[19.4, 20.4], [20.2, 22.4], [21, 20.4]], '#e8e4d8');
    poly(g, [[23, 20.4], [23.8, 22.4], [24.6, 20.4]], '#e8e4d8');
  },
  wraith(g) {
    g.globalAlpha = .88;
    g.beginPath();
    g.arc(16, 13, 7, Math.PI, 0);
    g.lineTo(24, 26); g.lineTo(20, 23); g.lineTo(16, 27); g.lineTo(12, 23); g.lineTo(8, 26);
    g.closePath();
    g.fillStyle = 'rgba(140,200,230,.9)'; g.fill();
    g.strokeStyle = '#3a5a70'; g.lineWidth = 2; g.stroke();
    g.globalAlpha = 1;
    ell(g, 13.2, 12, 1.6, 2.2, '#0e1a22');
    ell(g, 18.8, 12, 1.6, 2.2, '#0e1a22');
    ell(g, 13.2, 12, .5, .6, '#7ec8e3');
    ell(g, 18.8, 12, .5, .6, '#7ec8e3');
  },
  golem(g) {
    ell(g, 16, 20, 10, 8.5, '#8a94a8', '#3c4454', 2);
    g.fillStyle = '#6a7384'; g.fillRect(10, 16, 12, 10);
    g.strokeStyle = '#3c4454'; g.strokeRect(10, 16, 12, 10);
    ell(g, 16, 10, 7, 6, '#8a94a8', '#3c4454', 2);
    ell(g, 13.4, 10, 1.4, 1.2, '#e8c14f');
    ell(g, 18.6, 10, 1.4, 1.2, '#e8c14f');
    ell(g, 6, 20, 3, 5, '#7a8494', '#3c4454', 2);
    ell(g, 26, 20, 3, 5, '#7a8494', '#3c4454', 2);
    seg(g, 12, 14, 20, 14, '#3c4454', 2);
  },
  vampire(g) {
    ell(g, 16, 21, 8, 7, '#4a1c24', '#2a0c10', 2);
    ell(g, 16, 11, 6.4, 5.8, '#c9b8a0', '#6a4a40', 2);
    poly(g, [[10, 8], [8, 2], [13, 7]], '#1c1014', '#000', 1);
    poly(g, [[22, 8], [24, 2], [19, 7]], '#1c1014', '#000', 1);
    ell(g, 13.4, 10.6, 1.5, 1.2, '#c8452c');
    ell(g, 18.6, 10.6, 1.5, 1.2, '#c8452c');
    poly(g, [[14, 14], [14.6, 16.4], [15.4, 14]], '#e8e4d8');
    poly(g, [[18, 14], [17.4, 16.4], [16.6, 14]], '#e8e4d8');
    poly(g, [[8, 18], [16, 28], [24, 18]], '#2a1016', '#1a080c', 2);
  },
  lich(g) {
    ell(g, 16, 22, 7, 6, '#3a2a4a', '#1a1424', 2);
    ell(g, 16, 11, 6.2, 5.8, '#e8e4d8', '#8a857a', 2);
    g.fillStyle = '#2a1a38'; g.fillRect(9, 6, 14, 4);
    poly(g, [[9, 6], [16, 1], [23, 6]], '#2a1a38', '#1a1024', 1.5);
    ell(g, 13.4, 10.4, 1.6, 2, '#7ec8e3');
    ell(g, 18.6, 10.4, 1.6, 2, '#7ec8e3');
    seg(g, 24, 14, 28, 6, '#c4a574', 2);
    ell(g, 28, 5, 2, 2, '#bc8ee9');
  },
  dragonkin(g) {
    poly(g, [[4, 12], [14, 8], [10, 20]], '#8a5a20', '#3a2410', 2);
    poly(g, [[28, 12], [18, 8], [22, 20]], '#8a5a20', '#3a2410', 2);
    ell(g, 16, 20, 9, 8, '#c8782a', '#6a3a10', 2);
    ell(g, 16, 10, 6.4, 5.6, '#c8782a', '#6a3a10', 2);
    ell(g, 13.4, 10, 1.5, 1.2, '#ffe0a0');
    ell(g, 18.6, 10, 1.5, 1.2, '#ffe0a0');
    poly(g, [[12, 6], [10, 1], [15, 6]], '#e8d8b0', '#8a7a50', 1.5);
    poly(g, [[20, 6], [22, 1], [17, 6]], '#e8d8b0', '#8a7a50', 1.5);
    seg(g, 12, 14, 20, 14, '#6a3a10', 2);
  },
  voidlord(g) {
    poly(g, [[4, 16], [22, 6], [16, 30]], '#2a2440', '#100c18', 2.5);
    poly(g, [[40, 16], [22, 6], [28, 30]], '#2a2440', '#100c18', 2.5);
    ell(g, 22, 26, 11, 9, '#3a3458', '#161022', 2.5);
    ell(g, 22, 13, 8.4, 7, '#3a3458', '#161022', 2.5);
    ell(g, 18.4, 12, 2.2, 1.6, '#c8b8ff');
    ell(g, 25.6, 12, 2.2, 1.6, '#c8b8ff');
    ell(g, 18.4, 12, .8, .8, '#fff');
    ell(g, 25.6, 12, .8, .8, '#fff');
    poly(g, [[16, 8], [12, 1], [19, 7]], '#c8b8ff', '#6a5a90', 1.5);
    poly(g, [[28, 8], [32, 1], [25, 7]], '#c8b8ff', '#6a5a90', 1.5);
  },
  spider(g) {
    ell(g, 16, 18, 7, 5.5, '#5a3a68', '#2a1834', 2);
    for (const [x1, y1, x2, y2] of [
      [6, 10, 11, 16], [4, 18, 10, 18], [6, 26, 11, 20],
      [26, 10, 21, 16], [28, 18, 22, 18], [26, 26, 21, 20],
    ]) seg(g, x1, y1, x2, y2, '#3a2448', 2);
    ell(g, 16, 14, 5, 4.2, '#6a4a78', '#2a1834', 2);
    ell(g, 13.6, 13.2, 1.1, 1.1, '#e04535');
    ell(g, 18.4, 13.2, 1.1, 1.1, '#e04535');
  },
  cultist(g) {
    ell(g, 16, 22, 7.5, 6.5, '#4a2030', '#241018', 2);
    ell(g, 16, 12, 6, 5.4, '#c9b8a0', '#6a4a40', 2);
    poly(g, [[9, 8], [16, 1], [23, 8]], '#2a1018', '#14080c', 1.5);
    g.fillStyle = '#2a1018'; g.fillRect(10, 7, 12, 5);
    ell(g, 13.6, 12, 1.2, 1, '#c8452c');
    ell(g, 18.4, 12, 1.2, 1, '#c8452c');
    seg(g, 12, 16, 20, 16, '#6a2030', 2);
  },
  frostmage(g) {
    ell(g, 16, 22, 7, 6, '#3a5a78', '#1a3048', 2);
    ell(g, 16, 11, 6, 5.4, '#d8e8f4', '#6a8aa8', 2);
    g.fillStyle = '#2a4a68'; g.fillRect(10, 5, 12, 5);
    poly(g, [[10, 6], [16, 0], [22, 6]], '#2a4a68');
    ell(g, 13.5, 11, 1.3, 1.1, '#7ec8e3');
    ell(g, 18.5, 11, 1.3, 1.1, '#7ec8e3');
    seg(g, 24, 14, 28, 6, '#c4d8e8', 2);
    ell(g, 28, 5, 2.2, 2.2, '#7ec8e3');
  },
  abomination(g) {
    ell(g, 8, 20, 4, 6, '#6a8a4a', '#2a3a18', 2);
    ell(g, 24, 20, 4, 6, '#6a8a4a', '#2a3a18', 2);
    ell(g, 16, 20, 10, 8.5, '#5a7a3a', '#2a3a18', 2);
    ell(g, 16, 10, 7, 6, '#6a8a4a', '#2a3a18', 2);
    ell(g, 13, 9.5, 1.4, 1.6, '#e04535');
    ell(g, 19.5, 10.5, 1.1, 1.2, '#e04535');
    seg(g, 11, 14, 21, 15, '#2a3a18', 2);
    ell(g, 10, 16, 1.6, 1.2, '#8aaa5a');
    ell(g, 22, 24, 1.6, 1.2, '#8aaa5a');
  },
  seraph(g) {
    poly(g, [[2, 16], [14, 8], [12, 20]], '#e8d8a0', '#8a7a50', 2);
    poly(g, [[30, 16], [18, 8], [20, 20]], '#e8d8a0', '#8a7a50', 2);
    ell(g, 16, 20, 7, 7, '#f2ead0', '#8a7a50', 2);
    ell(g, 16, 10, 5.6, 5, '#f8f0d8', '#8a7a50', 2);
    ell(g, 13.6, 10, 1.2, 1.1, '#7ec8e3');
    ell(g, 18.4, 10, 1.2, 1.1, '#7ec8e3');
    poly(g, [[12, 4], [16, 0], [20, 4]], '#ffe8a0', '#c4a050', 1.5);
  },
  voidspawn(g) {
    ell(g, 16, 18, 8, 7, '#3a3458', '#161022', 2);
    ell(g, 16, 12, 5.5, 5, '#4a4468', '#161022', 2);
    ell(g, 13.4, 11.5, 1.4, 1.6, '#c8b8ff');
    ell(g, 18.6, 11.5, 1.4, 1.6, '#c8b8ff');
    poly(g, [[8, 8], [6, 2], [12, 8]], '#8b7ec8', '#3a3458', 1.5);
    poly(g, [[24, 8], [26, 2], [20, 8]], '#8b7ec8', '#3a3458', 1.5);
    ell(g, 16, 20, 3, 2.2, '#1a1628');
  },
  shrine(g) {
    g.fillStyle = '#6b4a2f'; g.fillRect(8, 20, 16, 6);
    g.strokeStyle = '#3a2818'; g.lineWidth = 2; g.strokeRect(8, 20, 16, 6);
    poly(g, [[10, 20], [16, 6], [22, 20]], '#c4a574', '#8a6a20', 2);
    ell(g, 16, 8, 3, 3, '#f2d27b', '#8a6a20', 1.5);
    ell(g, 16, 8, 1.2, 1.2, '#fff8e0');
  },
  camp(g) {
    ell(g, 16, 22, 8, 3, '#3a2818');
    seg(g, 10, 20, 14, 10, '#6b4a2f', 3);
    seg(g, 22, 20, 18, 10, '#6b4a2f', 3);
    ell(g, 16, 14, 4, 5, 'rgba(255,140,50,.9)');
    ell(g, 16, 13, 2, 3, 'rgba(255,220,120,.95)');
  },
  merchant(g) {
    ell(g, 16, 22, 8, 7, '#6b4a2f', '#3a2818', 2);
    ell(g, 16, 11, 6, 5.6, '#c9b8a0', '#6a4a40', 2);
    g.fillStyle = '#2a1c14'; g.fillRect(9, 6, 14, 5);
    poly(g, [[9, 8], [16, 2], [23, 8]], '#2a1c14');
    ell(g, 13.5, 11, 1.2, 1, '#1c202a');
    ell(g, 18.5, 11, 1.2, 1, '#1c202a');
    g.fillStyle = '#e0b34d'; g.fillRect(10, 20, 12, 5);
  },
};

const ITEM_SPRITE_FNS = {
  potion(g) {
    g.fillStyle = '#8a5a34'; g.fillRect(13.6, 3, 4.8, 3.4);
    g.strokeStyle = '#4a2c14'; g.lineWidth = 1; g.strokeRect(13.6, 3, 4.8, 3.4);
    g.fillStyle = 'rgba(205,228,240,.5)';
    g.fillRect(14.2, 6.4, 3.6, 4);
    g.strokeStyle = '#7a98a8'; g.strokeRect(14.2, 6.4, 3.6, 4);
    ell(g, 16, 18, 6.8, 6.8, 'rgba(205,228,240,.42)', '#7a98a8', 2);
    ell(g, 16, 19, 5.2, 5, '#d33b4b', '#a02035', 1.5);
    ell(g, 13.4, 16.2, 1.2, 2, 'rgba(255,255,255,.7)');
  },
  scroll(g) {
    g.fillStyle = '#e6d9b0'; g.fillRect(7, 10, 18, 8.6);
    g.strokeStyle = '#8a7a50'; g.lineWidth = 1.6; g.strokeRect(7, 10, 18, 8.6);
    ell(g, 7, 14.3, 2.2, 4.8, '#d8c898', '#8a7a50', 1.6);
    ell(g, 25, 14.3, 2.2, 4.8, '#d8c898', '#8a7a50', 1.6);
    seg(g, 11, 12.4, 21, 12.4, '#a89868', 1.2);
    seg(g, 11, 14.2, 21, 14.2, '#a89868', 1.2);
    g.fillStyle = '#b03a30'; g.fillRect(7, 16.4, 18, 2.2);
  },
  gold(g) {
    ell(g, 11, 19.5, 4.4, 3.2, '#e8c14f', '#8a6a20', 2);
    ell(g, 21, 19.5, 4.4, 3.2, '#e8c14f', '#8a6a20', 2);
    ell(g, 16, 15.5, 4.8, 3.6, '#f2d06b', '#8a6a20', 2);
    seg(g, 14.5, 14.2, 16.5, 14.8, '#fff8e0', 1.2);
    poly(g, [[23.5, 9.5], [24.2, 11.3], [26, 12], [24.2, 12.7], [23.5, 14.5], [22.8, 12.7], [21, 12], [22.8, 11.3]], '#fff8e0');
  },
  sword(g) {
    poly(g, [[16, 1.6], [18.2, 5], [18.2, 14], [13.8, 14], [13.8, 5]], '#dfe6f0', '#5a6478', 1.5);
    seg(g, 16, 5.5, 16, 13, '#9aa4b8', 1.2);
    g.fillStyle = '#e0b34d'; g.fillRect(10.8, 14, 10.4, 2.5);
    g.strokeStyle = '#8a6a20'; g.lineWidth = 1; g.strokeRect(10.8, 14, 10.4, 2.5);
    g.fillStyle = '#6b4a2f'; g.fillRect(14.6, 16.5, 2.8, 4.6);
    g.strokeStyle = '#3a2818'; g.strokeRect(14.6, 16.5, 2.8, 4.6);
    ell(g, 16, 22.8, 2, 2, '#e0b34d', '#8a6a20', 1.2);
  },
  axe(g) {
    g.fillStyle = '#6b4a2f'; g.fillRect(14.6, 4, 2.8, 17.5);
    g.strokeStyle = '#3a2818'; g.lineWidth = 1.5; g.strokeRect(14.6, 4, 2.8, 17.5);
    poly(g, [[17.4, 5], [25.5, 7.5], [26, 14.5], [17.4, 17]], '#c8d0dc', '#5a6478', 2);
    seg(g, 24.6, 8.4, 25, 13.6, '#eef2f8', 1.5);
    poly(g, [[14.6, 7], [10.8, 9], [14.6, 11.2]], '#aeb8c9', '#5a6478', 1.5);
    seg(g, 13.6, 9.4, 17.4, 9.4, '#3a2818', 1.2);
    seg(g, 13.6, 12.4, 17.4, 12.4, '#3a2818', 1.2);
    ell(g, 16, 23.4, 2, 1.6, '#e0b34d', '#8a6a20', 1.2);
  },
  armor(g) {
    poly(g, [[7, 9], [25, 9], [22.5, 20.5], [16, 24], [9.5, 20.5]], '#aeb8c9', '#3c4454', 2);
    ell(g, 8, 10, 3.2, 2.6, '#8a94a8', '#3c4454', 1.5);
    ell(g, 24, 10, 3.2, 2.6, '#8a94a8', '#3c4454', 1.5);
    ell(g, 16, 9.4, 3.2, 2, '#1c202a');
    seg(g, 16, 11.6, 16, 21.6, '#7e8a9c', 1.5);
    ell(g, 10.5, 13, .8, .8, '#e0b34d');
    ell(g, 21.5, 13, .8, .8, '#e0b34d');
    ell(g, 16, 22.8, .8, .8, '#e0b34d');
  },
  ring(g) {
    g.strokeStyle = '#e0b34d'; g.lineWidth = 3.2;
    g.beginPath(); g.arc(16, 17.5, 5.8, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = '#8a6a20'; g.lineWidth = 1;
    g.beginPath(); g.arc(16, 17.5, 7.4, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(16, 17.5, 4.3, 0, Math.PI * 2); g.stroke();
    poly(g, [[16, 4.5], [19.8, 8.6], [16, 12.6], [12.2, 8.6]], '#d33b4b', '#6a1018', 1.5);
    ell(g, 14.6, 7.4, .9, 1.2, 'rgba(255,255,255,.75)');
  },
  heart(g) {
    g.beginPath();
    g.arc(12.4, 11.5, 4.6, Math.PI, 0);
    g.arc(19.6, 11.5, 4.6, Math.PI, 0);
    g.lineTo(16, 24.5);
    g.closePath();
    g.fillStyle = '#e0354b'; g.fill();
    g.strokeStyle = '#5a0e18'; g.lineWidth = 2; g.stroke();
    ell(g, 12, 10, 1.6, 2.2, 'rgba(255,255,255,.75)');
  },
  chest(g) {
    g.fillStyle = '#6b4a2f'; g.fillRect(6, 12, 20, 14);
    g.strokeStyle = '#3a2818'; g.lineWidth = 2; g.strokeRect(6, 12, 20, 14);
    g.fillStyle = '#e0b34d'; g.fillRect(6, 17, 20, 3);
    ell(g, 16, 19, 2, 2, '#e0b34d', '#8a6a20', 1);
    g.fillStyle = '#8a5a34'; g.fillRect(8, 8, 16, 6);
    g.strokeRect(8, 8, 16, 6);
  },
};

const SPRITES = {};
const HERO_SPRITE_KEYS = {
  warrior: 'hero',
  ranger: 'heroRanger',
  mage: 'heroMage',
  assassin: 'heroAssassin',
};
const heroSpriteKeyFor = id => HERO_SPRITE_KEYS[id] || HERO_SPRITE_KEYS.warrior;
const SPLATS = [];
const decals = [];
function buildSprites() {
  if (SPRITES.hero) return;
  for (const [k, fn] of Object.entries({ ...SPRITE_FNS, ...ITEM_SPRITE_FNS })) {
    SPRITES[k] = mk(k === 'boss' || k === 'voidlord' ? 44 : 32, fn);
  }
  for (let v = 0; v < 3; v++) {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d');
    for (let i = 0; i < 7; i++) {
      ell(g, 16 + (vfx() * 16 - 8), 16 + (vfx() * 16 - 8),
        2 + vfx() * 4, 1.5 + vfx() * 3, 'rgba(90,18,22,.85)');
    }
    SPLATS.push(c);
  }
}
function addDecal(x, y) {
  decals.push({ x, y, v: Math.floor(vfx() * 3), rot: vfx() * 6.28 });
  if (decals.length > 60) decals.shift();
}

const TEXC = {};
function buildThemeTex(depthVal) {
  const ti = themeIdx(depthVal);
  if (TEXC[ti]) return;
  const t = THEMES[ti];
  const floors = [];
  for (let v = 0; v < 4; v++) {
    const c = document.createElement('canvas'); c.width = c.height = TILE;
    const g = c.getContext('2d');
    g.fillStyle = v % 2 ? t.fl2 : t.fl; g.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 18; i++) {
      g.fillStyle = vfx() < .5 ? t.sp1 : t.sp2;
      g.fillRect(Math.floor(vfx()*TILE), Math.floor(vfx()*TILE), 2 + Math.floor(vfx()*2), 2);
    }
    if (v === 2) {
      g.strokeStyle = t.sp1; g.lineWidth = 1.5; g.beginPath();
      g.moveTo(6, 7); g.lineTo(17, 17); g.lineTo(15, 27); g.stroke();
    }
    if (v === 3) {
      for (let i = 0; i < 3; i++) ell(g, 8 + rnd(18), 8 + rnd(18), 2.4, 1.8, t.sp2, t.sp1, 1);
    }
    g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(0, 0, TILE, 1); g.fillRect(0, 0, 1, TILE);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, TILE - 1, TILE, 1); g.fillRect(TILE - 1, 0, 1, TILE);
    floors.push(c);
  }
  const w = document.createElement('canvas'); w.width = w.height = TILE;
  const g = w.getContext('2d');
  g.fillStyle = t.wa; g.fillRect(0, 0, TILE, TILE);
  g.strokeStyle = t.wl; g.lineWidth = 1.5;
  for (let r = 0; r < 4; r++) {
    g.beginPath(); g.moveTo(0, r * 8 + .5); g.lineTo(TILE, r * 8 + .5); g.stroke();
    const off = r % 2 ? 8 : 0;
    for (let x = off; x <= TILE; x += 16) {
      g.beginPath(); g.moveTo(x + .5, r * 8); g.lineTo(x + .5, r * 8 + 8); g.stroke();
    }
  }
  g.fillStyle = t.wh; g.fillRect(0, 0, TILE, 2.5);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, TILE - 2.5, TILE, 2.5);
  TEXC[ti] = { floors, wall: w };
}
function texFor(depthVal) { return TEXC[themeIdx(depthVal)]; }

function rollRarity(minRarity) {
  const pool = RARITIES.map((r, i) => ({ r, i })).filter(o => o.i >= minRarity);
  const total = pool.reduce((s, o) => s + o.r.w, 0);
  let roll = rng() * total;
  for (const o of pool) { roll -= o.r.w; if (roll <= 0) return o.i; }
  return pool[pool.length - 1].i;
}
function genAffix(d) {
  const AR = RUN_PROFILE.affixRanges;
  // 词缀池按 profile 声明自适应：只从声明了数值区间的种类中抽取
  const kinds = Object.keys(AR).filter(k => {
    const r = AR[k];
    return !!r && (r.hiGrow !== undefined || r.hi !== undefined);
  });
  const kind = pick(kinds.length ? kinds : ['atk']);
  const r = AR[kind];
  if (r.hiGrow !== undefined) {
    return { k: kind, v: ri(r.lo, r.hiGrow) + Math.floor(d / (r.growDiv || 1)) };
  }
  return { k: kind, v: ri(r.lo, r.hi) + (r.flatPerDepth || 0) * d };
}
const WEAPON_SPR_BY_ICON = {
  'iron-sword': 'sword', 'broad-sword': 'sword', 'battle-axe': 'axe', 'rune-blade': 'sword',
  'hunting-bow': 'bow', 'arcane-staff': 'staff', 'dagger': 'dagger',
};
function weaponPoolForClass() {
  const tagged = WEAPON_BASES.filter(b => b.cls === classId);
  return tagged.length ? tagged : WEAPON_BASES;
}
// 装备评分：由唯一 equipment-stat-scoring 权威提供；core 只消费结果。
const INVENTORY_RULES = typeof window !== 'undefined' ? window.DE_INVENTORY_RULES_V130 : null;
if (!INVENTORY_RULES || INVENTORY_RULES.authority !== 'equipment-stat-scoring')
  throw new Error('Dungeon Echo equipment-stat-scoring authority missing');
const eqScoreOf = stats => INVENTORY_RULES.equipmentStatScore(stats);
// 锻造：主属性成长表与上限
const FORGE_MAX = 5;
const FORGE_MAIN = {
  weapon: ['atk', 2], armor: ['def', 2], ring: ['hp', 4],
  helmet: ['def', 2], boots: ['hp', 4], amulet: ['crit', 3],
};
// 经济价值与战斗适配评分分离：score/fitScore 继续回答“这件装备适不适合当前职业”，
// itemValueScore 回答“这件物品本身值多少”。机制词缀进入后者，但不会吞掉属性维度。
function mechanicValueBonus(it, statScore = eqScoreOf((it && it.stats) || {})) {
  if (!it || !it.mechanic || !MECHANIC_TRAITS[it.mechanic]) return 0;
  const power = Math.max(1, Math.min(2, Number(it.mechanicPower) || 1));
  const ratio = power >= 2 ? 0.30 : 0.18;
  const floor = power >= 2 ? 22 : 12;
  return Math.max(floor, Math.round(Math.max(0, statScore) * ratio));
}
function itemValueScore(it) {
  if (!it || typeof it !== 'object') return 0;
  const statScore = Math.max(0, eqScoreOf(it.stats || {}));
  return statScore + mechanicValueBonus(it, statScore);
}
const ECONOMY_RULES = typeof window !== 'undefined' ? window.DE_ECONOMY_RULES_V130 : null;
if (!ECONOMY_RULES || ECONOMY_RULES.authority !== 'equipment-transaction-pricing')
  throw new Error('Dungeon Echo equipment-transaction-pricing authority missing');
const forgeCost = it => ECONOMY_RULES.forgeCost(itemValueScore(it), it.forge || 0);
const sellPrice = it => ECONOMY_RULES.sellPrice(itemValueScore(it), it.forge || 0);
function genEquip(d, minRarity = 0) {
  const roll = rng();
  // 六栏位分布：武器 .30 护甲 .25 头盔 .15 靴 .15 戒指 .10 项链 .05
  const slot = roll < .30 ? 'weapon' : roll < .55 ? 'armor' : roll < .70 ? 'helmet' :
    roll < .85 ? 'boots' : roll < .95 ? 'ring' : 'amulet';
  const bases = slot === 'weapon' ? weaponPoolForClass() :
    slot === 'armor' ? ARMOR_BASES :
    slot === 'helmet' ? HELMET_BASES :
    slot === 'boots' ? BOOT_BASES :
    slot === 'ring' ? RING_BASES : AMULET_BASES;
  const pool = bases.filter(b => d >= b.min);
  const base = pool[Math.max(0, pool.length - 1 - rnd(Math.min(2, pool.length)))];
  const rarity = rollRarity(minRarity);
  const stats = {};
  if (base.atk) stats.atk = base.atk;
  if (base.def) stats.def = base.def;
  if (base.hp)  stats.hp = base.hp;
  if (base.crit) stats.crit = base.crit;
  const affixes = [];
  for (let i = 0; i < RARITIES[rarity].affixes; i++) {
    const a = genAffix(d);
    affixes.push(a);
    stats[a.k] = (stats[a.k] || 0) + a.v;
  }
  const spr = slot === 'weapon'
    ? (WEAPON_SPR_BY_ICON[base.icon] || 'sword')
    : slot === 'armor' ? 'armor' : slot === 'ring' ? 'ring' : 'trinket';
  const mechanic = mechanicForFreshItem(slot, rarity, d, base, affixes);
  const mechanicName = mechanic ? ` · ${MECHANIC_TRAITS[mechanic.id].name}` : '';
  return {
    slot, base, rarity, affixes, stats, spr, icon: base.icon,
    ...(mechanic ? { mechanic: mechanic.id, mechanicPower: mechanic.power } : {}),
    name: `${RARITIES[rarity].name}·${base.name}${mechanicName}`,
    score: eqScoreOf(stats),
  };
}

function mechanicPower(id) {
  if (!player || !player.equip) return 0;
  let best = 0;
  for (const it of Object.values(player.equip)) {
    if (!it || it.mechanic !== id) continue;
    best = Math.max(best, Math.max(1, Math.min(2, Number(it.mechanicPower) || 1)));
  }
  return best;
}
function consumeTimedMechanic(field, id) {
  if (!player || player[field] !== turns) return 0;
  const p = mechanicPower(id);
  player[field] = -1;
  return p;
}
function clearMechanicWindows() {
  if (!player) return;
  player.echoEdgeTurn = -1;
  player.reprisalTurn = -1;
  player.skirmishTurn = -1;
  player.braceTurn = -1;
  player.afterimageTurn = -1;
}
function applyDirectHitMechanic(dmg) {
  let out = Math.max(1, Math.round(dmg));
  const after = player && player.afterimageTurn === turns ? mechanicPower('afterimage') : 0;
  const brace = player && player.braceTurn === turns ? mechanicPower('brace') : 0;
  if (after) {
    player.afterimageTurn = -1;
    out = Math.max(1, Math.round(out * (after >= 2 ? 0.60 : 0.75)));
    floater(player, ui('残影卸力','Afterimage'), '#9fd7ff');
    msg(ui('【残影】削减了这次直击伤害。','[Afterimage] reduced this direct hit.'), 'good');
  } else if (brace) {
    player.braceTurn = -1;
    out = Math.max(1, Math.round(out * (brace >= 2 ? 0.50 : 0.65)));
    floater(player, ui('镇守','Brace'), '#f2d27b');
    msg(ui('【镇守】挡下了部分直击伤害。','[Brace] absorbed part of the direct hit.'), 'good');
  }
  return out;
}
function armReprisal() {
  if (player && player.hp > 0 && mechanicPower('reprisal')) player.reprisalTurn = turns;
}

const eqStat = k => ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet']
  .reduce((s, sl) => s + (player.equip[sl] ? (player.equip[sl].stats[k] || 0) : 0), 0);
const pMaxHp = () => player.hpBase + eqStat('hp');
const pAtk   = () => player.atkBase + eqStat('atk');
// 战士被动「坚甲」：天生扁平减伤，随等级成长（1级+1，每5级+1）——近战换血的生存根基
const warriorDr = () => (classId === 'warrior' ? 1 + Math.floor((player.lvl - 1) / 5) : 0);
const pDef   = () => eqStat('def') + (player.flatDr || 0) + warriorDr();
const pCrit  = () => {
  const crisis = mechanicPower('crisis');
  const crisisBonus = crisis && player.hp <= pMaxHp() * 0.40 ? (crisis >= 2 ? 20 : 12) : 0;
  return 5 + (classDef().critBase || 0) + (player.critBase || 0) + eqStat('crit') + crisisBonus;
};
const pLeech = () => (player.leechBase || 0) + eqStat('leech');
const pGoldBonus = () => (player.goldFind || 0) + eqStat('gold');
const pThorns   = () => (player.thornsBase || 0) + eqStat('thorns');
const pKillHeal = () => (player.regenBase || 0) + eqStat('regen');
const COMBAT_RULES = typeof window !== 'undefined' ? window.DE_COMBAT_RULES_V130 : null;
if (!COMBAT_RULES || COMBAT_RULES.authority !== 'critical-damage-multiplier')
  throw new Error('Dungeon Echo critical-damage-multiplier authority missing');
const pCritMul  = () => COMBAT_RULES.criticalMultiplier(player.critPower || 0);
const pPlunder  = () => 1 + (player.plunder || 0) / 100;
// —— 可读反制：隐藏随机穿甲已移除 ——
// 普通攻击永远按护甲结算；高 DEF 不再提高任何隐藏的无视护甲概率。
// 保留旧测试 API 名称并固定返回 0，避免外部调试脚本因接口消失而崩溃。
function pierceChanceOf() { return 0; }

function beginArmorBreak(m, mode) {
  if (!m || !m.armorBreak || (m.armorBreakCooldown || 0) > 0 || (m.armorBreakCharge || 0) > 0) return false;
  m.armorBreakCharge = 1;
  m.armorBreakMode = mode === 'ranged' ? 'ranged' : 'melee';
  floater(m, ui('破甲蓄力','Armor Break'), '#e0a73a');
  msg(m.armorBreakMode === 'ranged'
    ? ui(`${m.name} 锁定了你，下一回合将射出破甲重击——离开视线或射程！`, `${visibleWorldName(m.name)} locked on. Break line of sight or leave range before the next-turn Armor Break!`)
    : ui(`${m.name} 举起武器蓄力，下一回合将发动破甲重击——拉开距离！`, `${visibleWorldName(m.name)} is charging Armor Break. Create distance before the next turn!`), 'bad');
  sfx.skill();
  return true;
}
// 重伤期间治疗收益减半（吸血 / 药水 / 卷轴 / 神龛 / 击杀回复），自然回复停止。
const healMult = () => ((player.grievous || 0) > 0 ? 0.5 : 1);
function applyGrievous() {
  const dur = Math.max(1, 3 - (player.grivResist || 0));
  if ((player.grievous || 0) < dur) msg(ui('伤口崩裂——短时间内治疗效果减半！','Wounds reopen — healing is temporarily halved!'), 'bad');
  player.grievous = dur;
}
const classDef = () => CLASSES[classId] || CLASSES.warrior;
const echoModeNow = () => !!(player && player.echoMode);
const isFinalFloor = () => CONTENT_RULES.isFinalFloor(depth, MAX_DEPTH, echoModeNow());
const canDescendNow = () => CONTENT_RULES.canDescend(depth, MAX_DEPTH, echoModeNow());
const monsterPoolFor = d => CONTENT_RULES.monsterPool(MONSTERS, d);

function listWalkTiles(includeStairs) {
  const out = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map[y][x] === FLOOR || (includeStairs && map[y][x] === STAIRS)) out.push({ x, y });
    }
  }
  return out;
}

function tileTaken(x, y) {
  return (player && player.x === x && player.y === y) ||
    monsterAt(x, y) || itemAt(x, y) || npcAt(x, y);
}

function pickSpawn(minDist) {
  const floors = listWalkTiles(false);
  const far = floors.filter(p => !tileTaken(p.x, p.y) &&
    Math.abs(p.x - player.x) + Math.abs(p.y - player.y) >= minDist);
  const pool = far.length ? far : floors.filter(p => !tileTaken(p.x, p.y) &&
    !(p.x === player.x && p.y === player.y));
  if (!pool.length) return null;
  return pick(pool);
}

function floodFrom(sx, sy) {
  const seen = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  const q = [[sx, sy]];
  if (!inB(sx, sy) || map[sy][sx] === WALL) return { seen, n: 0 };
  seen[sy][sx] = true;
  let n = 0, qi = 0;
  while (qi < q.length) {
    const [x, y] = q[qi++];
    n++;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ox, ny = y + oy;
      if (inB(nx, ny) && !seen[ny][nx] && map[ny][nx] !== WALL) {
        seen[ny][nx] = true;
        q.push([nx, ny]);
      }
    }
  }
  return { seen, n };
}

function carveL(x0, y0, x1, y1) {
  if (rnd(2)) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) if (inB(x, y0)) map[y0][x] = FLOOR;
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) if (inB(x1, y)) map[y][x1] = FLOOR;
  } else {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) if (inB(x0, y)) map[y][x0] = FLOOR;
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) if (inB(x, y1)) map[y1][x] = FLOOR;
  }
}

function connectAllFloors(sx, sy) {
  for (let pass = 0; pass < 8; pass++) {
    const { seen } = floodFrom(sx, sy);
    let orphan = null;
    outer: for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        if (map[y][x] !== WALL && !seen[y][x]) { orphan = { x, y }; break outer; }
      }
    }
    if (!orphan) return true;
    carveL(sx, sy, orphan.x, orphan.y);
  }
  return floodFrom(sx, sy).n > 20;
}

function genLevel() {
  for (let attempt = 0; attempt < 50; attempt++) {
    map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(WALL));
    explored = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
    visible  = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
    monsters = []; items = []; npcs = []; traps = []; secrets = [];
    decals.length = 0; shopStock = []; floorCleared = false;

    const rooms = [];
    let tries = 180;
    const want = ri(8, 13);
    while (rooms.length < want && tries-- > 0) {
      const w = ri(4, 9), h = ri(3, 7);
      const x = rnd(MAP_W - w - 2) + 1, y = rnd(MAP_H - h - 2) + 1;
      if (rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x &&
                          y < r.y + r.h + 1 && y + h + 1 > r.y)) continue;
      rooms.push({ x, y, w, h });
      for (let j = y; j < y + h; j++)
        for (let i = x; i < x + w; i++) map[j][i] = FLOOR;
    }
    if (rooms.length < 4) continue;

    const cx = r => Math.floor(r.x + r.w / 2);
    const cy = r => Math.floor(r.y + r.h / 2);
    for (let i = 1; i < rooms.length; i++) {
      carveL(cx(rooms[i - 1]), cy(rooms[i - 1]), cx(rooms[i]), cy(rooms[i]));
    }
    // extra loops so the map isn't a single snake
    if (rooms.length > 4) {
      carveL(cx(rooms[0]), cy(rooms[0]), cx(rooms[rooms.length - 2]), cy(rooms[rooms.length - 2]));
    }

    const first = rooms[0], last = rooms[rooms.length - 1];
    player.x = cx(first); player.y = cy(first);
    if (!connectAllFloors(player.x, player.y)) continue;

    if (canDescendNow()) {
      map[cy(last)][cx(last)] = STAIRS;
      const { seen } = floodFrom(player.x, player.y);
      if (!seen[cy(last)][cx(last)]) {
        carveL(player.x, player.y, cx(last), cy(last));
        map[cy(last)][cx(last)] = STAIRS;
      }
    }

    spawnMonsters(rooms, last);
    spawnItems(rooms);
    spawnShop(rooms);
    spawnRest(rooms);
    spawnChest(rooms);
    spawnShrine(rooms);
    spawnTraps();
    spawnCasks(rooms);
    spawnSecret(rooms);
    ensureFloorContent(rooms);
    snapAll();
    return;
  }
  throw new Error('地图生成失败');
}

function randomFloorIn(rooms, minDistFromPlayer) {
  for (let t = 0; t < 240; t++) {
    const r = pick(rooms);
    const x = ri(r.x, r.x + r.w - 1), y = ri(r.y, r.y + r.h - 1);
    if (map[y][x] !== FLOOR) continue;
    if (tileTaken(x, y)) continue;
    if (minDistFromPlayer &&
        Math.abs(x - player.x) + Math.abs(y - player.y) < minDistFromPlayer) continue;
    return { x, y };
  }
  return pickSpawn(minDistFromPlayer || 1);
}

function makeMonster(base, p) {
  const FR = RUN_PROFILE.floorRules;
  const traits = (base.traits || []).slice();
  const elite = !base.boss && !base.midBoss && rng() < FR.eliteChance;
  let scale = 1;
  if (!base.boss && !base.midBoss && typeof base.min === 'number') {
    const band = clamp((depth - base.min) / Math.max(1, base.max - base.min), 0, 1);
    scale = 1 + band * FR.depthScaleMax;
  }
  if (player && player.echoMode && depth > MAX_DEPTH) {
    scale *= 1 + (depth - MAX_DEPTH) * 0.08;
  }
  const atkValue = Math.round(base.atk * (elite ? FR.eliteAtkMult : 1) * scale);
  const m = {
    ...base,
    traits,
    x: p.x, y: p.y, fx: p.x, fy: p.y,
    maxHp: Math.round(base.hp * (elite ? FR.eliteHpMult : 1) * scale),
    atk: atkValue,
    atkOrigin: atkValue,
    xp: Math.round(base.xp * (elite ? 2 : 1) * (player && player.echoMode ? 1.2 : 1)),
    elite, boss: !!base.boss, midBoss: !!base.midBoss,
    regen: !!base.regen || traits.includes('regen'),
    boom: !!base.boom || traits.includes('boom'),
    enrage: !!base.enrage || traits.includes('enrage'),
    enraged: false,
    armorBreak: !!base.armorBreak || traits.includes('armorBreak'),
    armorBreakCharge: 0, armorBreakMode: null, armorBreakCooldown: 0,
    alert: 0, skip: 0,
    hurtT: 0, lungeT: 0, ldx: 0, ldy: 0,
  };
  m.hp = m.maxHp;
  if (elite) m.name = '精英·' + m.name;
  return m;
}

function spawnMonsters(rooms, lastRoom) {
  const pool = monsterPoolFor(depth);
  const FR = RUN_PROFILE.floorRules;
  // 每个非出生房间至少一只——这是第二层起空关的根因修复
  for (let i = 1; i < rooms.length; i++) {
    const p = randomFloorIn([rooms[i]], 0);
    if (p) monsters.push(makeMonster(pick(pool), p));
  }
  const want = CONTENT_RULES.desiredMonsterCount(depth, FR);
  let guard = 0;
  while (monsters.length < want && guard++ < 400) {
    const p = pickSpawn(6);
    if (!p) break;
    monsters.push(makeMonster(pick(pool), p));
  }
  for (const mb of CONTENT_RULES.midBossesAtDepth(MID_BOSSES, depth, echoModeNow())) {
    const p = randomFloorIn([lastRoom], 0) || pickSpawn(4);
    if (p) {
      monsters.push(makeMonster({ ...mb, midBoss: true }, p));
      msg(fmtText(runText('midBossArrive', runText('bossFloorArrive'))), 'bad');
    }
  }
  if (isFinalFloor()) {
    const p = randomFloorIn([lastRoom], 0) || pickSpawn(3);
    if (p) {
      monsters.push(makeMonster({ ...BOSS_BASE, boss: true }, p));
      msg(fmtText(runText('bossFloorArrive')), 'bad');
    }
  } else if (CONTENT_RULES.echoGuardianFloor(depth, MAX_DEPTH, echoModeNow())) {
    const p = pickSpawn(5);
    if (p) {
      const echoBoss = {
        ...BOSS_BASE,
        name: '回响·' + BOSS_BASE.name,
        hp: Math.round(BOSS_BASE.hp * (0.55 + (depth - MAX_DEPTH) * 0.06)),
        atk: Math.round(BOSS_BASE.atk * (0.7 + (depth - MAX_DEPTH) * 0.04)),
        sprite: BOSS_BASE.sprite,
        color: BOSS_BASE.color,
        xp: Math.round(BOSS_BASE.xp * 0.45),
        midBoss: true,
      };
      monsters.push(makeMonster(echoBoss, p));
      msg(ui('一层回响凝聚成了守卫。','The floor echo condenses into a guardian.'), 'bad');
    }
  }
}

function spawnItems(rooms) {
  const LC = RUN_PROFILE.floorRules.lootChances;
  const LN = RUN_PROFILE.floorRules.lootCounts;
  const C = RUN_PROFILE.consumables;
  const put = it => {
    const p = pickSpawn(3) || randomFloorIn(rooms, 2);
    if (p) items.push({ ...it, ...p });
  };
  for (let i = 0, n = ri(LN.potionLo, LN.potionHi); i < n; i++)
    put({ type: 'potion', icon: C.potion.icon, name: C.potion.name });
  for (let i = 0, n = ri(LN.goldLo, LN.goldHi); i < n; i++)
    put({ type: 'gold', icon: C.gold.icon,
      val: ri(LN.floorGoldLo, LN.floorGoldHi) + depth * LN.floorGoldPerDepth,
      name: C.gold.name });
  if (rng() < LC.scroll)
    put({ type: 'scroll', icon: C.scroll.icon, name: C.scroll.name });
  if (greedyMode && rng() < 0.08)
    put({ type: 'escape', icon: C.scroll.icon, name: '回城卷轴' });
  if (rng() < LC.equip1)
    put({ type: 'equip', item: genEquip(depth), emoji: '', name: '装备' });
  if (rng() < LC.equip2)
    put({ type: 'equip', item: genEquip(depth), emoji: '', name: '装备' });
  if (C.key && rng() < (RUN_PROFILE.keyChance || 0.2))
    put({ type: 'key', icon: C.key.icon, name: C.key.name });
}

function spawnShop(rooms) {
  if (!CONTENT_RULES.isShopFloor(depth, SHOP_FLOORS, MAX_DEPTH, echoModeNow())) return;
  const p = randomFloorIn(rooms.slice(1), 5) || pickSpawn(5);
  if (!p) return;
  npcs.push({ type: 'shop', x: p.x, y: p.y, fx: p.x, fy: p.y, name: '蒙面商人' });
  shopStock = [
    { id: 'potion', name: '治疗药水', price: SHOP.potionPrice, kind: 'potion' },
    { id: 'scroll', name: '传送卷轴', price: SHOP.scrollPrice, kind: 'scroll' },
    { id: 'key', name: '锈蚀钥匙', price: SHOP.keyPrice, kind: 'key' },
  ];
  if (greedyMode) shopStock.push({ id: 'escape', name: '回城卷轴（按 T 回镇）', price: SHOP.escapePrice || 26, kind: 'escape' });
  shopStock.push(
    { id: 'heal', name: '包扎伤口（回满）', price: SHOP.healPrice, kind: 'heal' },
    { id: 'equip', name: '精选装备', price: 0, kind: 'equip', item: genEquip(depth, 1) },
  );
  const eq = shopStock[shopStock.length - 1];
  eq.name = eq.item.name;
  eq.price = Math.max(18, itemValueScore(eq.item) * (SHOP.equipMult || 3));
  msg(fmtText(runText('shopArrive', ui('商人在此等候。','The merchant is waiting.'))), 'gold');
}

function spawnRest(rooms) {
  if (!CONTENT_RULES.isRestFloor(depth, REST_FLOORS, MAX_DEPTH, echoModeNow())) return;
  const p = randomFloorIn(rooms.slice(1), 4) || pickSpawn(4);
  if (!p) return;
  npcs.push({ type: 'rest', x: p.x, y: p.y, fx: p.x, fy: p.y, name: '余烬营地' });
  msg(fmtText(runText('restArrive', ui('一处营地。','A camp waits here.'))), 'good');
}

function spawnChest(rooms) {
  if (rng() > (RUN_PROFILE.chestChance || 0.5)) return;
  const p = pickSpawn(6) || randomFloorIn(rooms, 6);
  if (!p) return;
  items.push({
    type: 'chest', x: p.x, y: p.y, locked: true,
    icon: 'dungeon-key', name: '上锁的宝箱',
  });
}

function spawnShrine(rooms) {
  const chance = (RUN_PROFILE.floorRules && RUN_PROFILE.floorRules.shrineChance) || 0.3;
  if (rng() > chance) return;
  const p = pickSpawn(6) || randomFloorIn(rooms.slice(1), 5);
  if (!p) return;
  npcs.push({ type: 'shrine', x: p.x, y: p.y, fx: p.x, fy: p.y, name: '无名神龛', used: false });
  msg(fmtText(runText('shrineArrive', ui('一座神龛在此。','A shrine waits here.'))), 'epic');
}

function spawnTraps() {
  const FR = RUN_PROFILE.floorRules || {};
  const n = ri(FR.trapCountLo || 0, FR.trapCountHi || 0);
  for (let i = 0; i < n; i++) {
    const p = pickSpawn(5);
    if (!p) break;
    traps.push({ x: p.x, y: p.y, armed: true, dmg: 2 + Math.floor(depth / 5) });
  }
}

// 木桶：地牢常见的可破坏容器。走到上面即打破，随机滚出金币/药水/装备，
// 也可能蹦出一只怪物——贪婪洞窟式的风险回报互动。
function spawnCasks(rooms) {
  const n = ri(2, 5);
  for (let i = 0; i < n; i++) {
    const p = pickSpawn(2);
    if (!p) break;
    items.push({ type: 'cask', x: p.x, y: p.y, icon: 'wooden-cask', name: '木桶' });
  }
}

function spawnSecret(rooms) {
  const chance = (RUN_PROFILE.floorRules && RUN_PROFILE.floorRules.secretChance) || 0.4;
  if (rng() > chance || rooms.length < 3) return;
  const r = rooms[rooms.length - 1];
  // 在地图边缘找一面邻接房间的墙，藏一间密室
  const candidates = [];
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (map[y][x] !== WALL) continue;
      const floors = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .filter(([ox, oy]) => map[y + oy][x + ox] === FLOOR);
      if (floors.length === 1) candidates.push({ x, y, ox: floors[0][0], oy: floors[0][1] });
    }
  }
  if (!candidates.length) return;
  const door = pick(candidates);
  const rx = door.x - door.ox, ry = door.y - door.oy;
  if (!inB(rx, ry) || map[ry][rx] !== WALL) return;
  secrets.push({ x: door.x, y: door.y, rx, ry, revealed: false });
}

function revealSecret(s) {
  if (s.revealed) return;
  s.revealed = true;
  map[s.y][s.x] = FLOOR;
  map[s.ry][s.rx] = FLOOR;
  const C = RUN_PROFILE.consumables;
  dropAt(s.rx, s.ry, { type: 'equip', item: genEquip(depth, 2), emoji: '', name: '装备' });
  dropAt(s.rx, s.ry, { type: 'gold', icon: C.gold.icon, val: 20 + depth * 4, name: C.gold.name });
  if (rng() < 0.5 && C.key) dropAt(s.rx, s.ry, { type: 'key', icon: C.key.icon, name: C.key.name });
  msg(ui('墙面裂开，露出一间密室！','The wall splits open, revealing a secret room!'), 'gold');
  sfx.chest();
  computeFov();
}

function ensureFloorContent(rooms) {
  const FR = RUN_PROFILE.floorRules;
  const C = RUN_PROFILE.consumables;
  const pool = monsterPoolFor(depth);
  const minM = Math.max(FR.minMonsters || 5, 4);
  let guard = 0;
  while (monsters.length < minM && guard++ < 300) {
    const p = pickSpawn(4);
    if (!p) break;
    monsters.push(makeMonster(pick(pool), p));
  }
  const countType = t => items.filter(it => it.type === t).length;
  const put = it => {
    const p = pickSpawn(2);
    if (p) items.push({ ...it, ...p });
  };
  while (countType('potion') < (FR.minPotions || 2)) {
    put({ type: 'potion', icon: C.potion.icon, name: C.potion.name });
    if (countType('potion') === 0) break;
  }
  while (countType('gold') < (FR.minGoldPiles || 2)) {
    put({ type: 'gold', icon: C.gold.icon,
      val: 6 + depth * 3, name: C.gold.name });
    if (countType('gold') === 0) break;
  }
  while (countType('equip') < (FR.minEquips || 1)) {
    put({ type: 'equip', item: genEquip(depth), emoji: '', name: '装备' });
    if (countType('equip') === 0) break;
  }
}

const walkable = (x, y) => inB(x, y) && map[y][x] !== WALL;
const monsterAt = (x, y) => monsters.find(m => m.x === x && m.y === y);
const itemAt = (x, y) => items.find(it => it.x === x && it.y === y);
const npcAt = (x, y) => (npcs || []).find(n => n.x === x && n.y === y);

function viewportFor(width) {
  if (width <= 520) return { cols: 15, rows: 15 };
  if (width <= 900) return { cols: 17, rows: 17 };
  return { cols: MAP_W, rows: MAP_H };
}
function updateCamera() {
  if (!player) return;
  view.x = clamp(player.x - Math.floor(view.cols / 2), 0, MAP_W - view.cols);
  view.y = clamp(player.y - Math.floor(view.rows / 2), 0, MAP_H - view.rows);
}
function applyViewport(width = window.innerWidth) {
  const next = viewportFor(width);
  if (view.cols !== next.cols || view.rows !== next.rows ||
      canvas.width !== next.cols * TILE || canvas.height !== next.rows * TILE) {
    view = { ...view, ...next };
    canvas.width = next.cols * TILE;
    canvas.height = next.rows * TILE;
  }
  updateCamera();
}

function los(x0, y0, x1, y1) {
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  while (!(x === x1 && y === y1)) {
    if (!(x === x0 && y === y0) && map[y][x] === WALL) return false;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx)  { err += dx; y += sy; }
  }
  return true;
}
function computeFov() {
  visible = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  for (let y = player.y - FOV_R; y <= player.y + FOV_R; y++) {
    for (let x = player.x - FOV_R; x <= player.x + FOV_R; x++) {
      if (!inB(x, y)) continue;
      if (Math.hypot(x - player.x, y - player.y) > FOV_R + 0.5) continue;
      if (los(player.x, player.y, x, y)) {
        visible[y][x] = true; explored[y][x] = true;
      }
    }
  }
  updateCamera();
}
function snapAll() {
  player.fx = player.x; player.fy = player.y;
  for (const m of monsters) { m.fx = m.x; m.fy = m.y; }
}

function lunge(ent, tx, ty) {
  ent.lungeT = 1; ent.ldx = Math.sign(tx - ent.x); ent.ldy = Math.sign(ty - ent.y);
}
let classSkillFxT = 0;
const CLASS_COMBAT_FX_STYLE = Object.freeze({
  warrior:{ main:'#eca548', soft:'#ffd585' },
  ranger:{ main:'#68d284', soft:'#b5f2b6' },
  mage:{ main:'#6fa4ff', soft:'#becbff' },
  assassin:{ main:'#bb70eb', soft:'#f49bdb' },
});
function applyDamageToMonster(m, dmg, crit) {
  m.hp -= dmg; m.hurtT = 1;
  floater(m, `-${dmg}`, crit ? '#eda23a' : '#fff');
  burst(m.fx, m.fy, m.color, crit ? 10 : 5);
  addTrauma(crit ? 0.28 : 0.12);
  addHitstop(crit ? 0.07 : 0.04);
  crit ? sfx.crit() : sfx.hit();
  const leech = Math.round(dmg * pLeech() / 100 * healMult());
  if (leech > 0 && player.hp < pMaxHp()) {
    player.hp = Math.min(pMaxHp(), player.hp + leech);
    floater(player, `+${leech}`, '#7dd87d');
  }
  if (m.enrage && !m.enraged && m.hp > 0 && m.hp <= m.maxHp * 0.5) {
    m.enraged = true;
    m.atk = Math.round(m.atkOrigin * 1.35);
    floater(m, ui('狂暴!','ENRAGED!'), '#ff6b5b');
    msg(ui(`${m.name} 陷入狂暴，攻势暴涨！`, `${visibleWorldName(m.name)} became enraged!`), 'bad');
    sfx.skill();
  }
  if (m.hp <= 0) killMonster(m);
}
function playerAttack(m) {
  lunge(player, m.x, m.y);
  let dmg = Math.max(1, pAtk() + ri(-1, 1) - m.def);
  let mult = 1;
  const echo = consumeTimedMechanic('echoEdgeTurn', 'echo_edge');
  if (echo) mult *= echo >= 2 ? 1.40 : 1.25;
  const reprisal = consumeTimedMechanic('reprisalTurn', 'reprisal');
  if (reprisal) mult *= reprisal >= 2 ? 1.50 : 1.30;
  const duel = mechanicPower('duelist');
  if (duel) {
    const adjacent = monsters.filter(x => Math.abs(x.x - player.x) + Math.abs(x.y - player.y) === 1).length;
    if (adjacent === 1) mult *= duel >= 2 ? 1.35 : 1.20;
  }
  dmg = Math.max(1, Math.round(dmg * mult));
  const crit = rng() * 100 < pCrit();
  if (crit) dmg = Math.round(dmg * pCritMul());
  const wasAlive = m.hp > 0;
  applyDamageToMonster(m, dmg, crit);
  if (wasAlive && m.hp <= 0) {
    const reaper = mechanicPower('reaper');
    if (reaper && player.skillCd > 0) {
      const refund = reaper >= 2 ? 2 : 1;
      player.skillCd = Math.max(0, player.skillCd - refund);
      msg(ui(`【收割】斩杀返还 ${refund} 回合技能冷却。`, `[Reaper] Kill refunded ${refund} turn${refund === 1 ? '' : 's'} of skill cooldown.`), 'good');
    }
  }
  if (m.hp > 0) msg(ui(`${crit ? '暴击！' : ''}你击中${m.name}，造成 ${dmg} 点伤害。`, `${crit ? 'Critical! ' : ''}You hit ${visibleWorldName(m.name)} for ${dmg} damage.`));
}
// 沿玩家面向方向（dx,dy 为单位步长，四方向）寻找视线内、射程内的敌人，
// 中途遇墙则视线被挡，返回 null。用于游侠等具备 rangedRange 的职业。
function findRangedTarget(dx, dy) {
  const range = classDef().rangedRange || 0;
  if (!range || (!dx && !dy)) return null;
  let x = player.x, y = player.y;
  for (let i = 0; i < range; i++) {
    x += dx; y += dy;
    if (!inB(x, y) || map[y][x] === WALL) return null;
    const m = monsterAt(x, y);
    if (m) return m;
  }
  return null;
}
function playerRangedAttack(m) {
  fireArrow(player.x, player.y, m.x, m.y);
  let dmg = Math.max(1, pAtk() + ri(-1, 1) - m.def);
  let mult = 1;
  const echo = consumeTimedMechanic('echoEdgeTurn', 'echo_edge');
  if (echo) mult *= echo >= 2 ? 1.40 : 1.25;
  const skirmish = consumeTimedMechanic('skirmishTurn', 'skirmish');
  if (skirmish) mult *= skirmish >= 2 ? 1.40 : 1.25;
  dmg = Math.max(1, Math.round(dmg * mult));
  const crit = rng() * 100 < pCrit();
  if (crit) dmg = Math.round(dmg * pCritMul());
  const wasAlive = m.hp > 0;
  applyDamageToMonster(m, dmg, crit);
  if (wasAlive && m.hp <= 0) {
    const reaper = mechanicPower('reaper');
    if (reaper && player.skillCd > 0) {
      const refund = reaper >= 2 ? 2 : 1;
      player.skillCd = Math.max(0, player.skillCd - refund);
      msg(ui(`【收割】远射斩杀返还 ${refund} 回合技能冷却。`, `[Reaper] Ranged kill refunded ${refund} turn${refund === 1 ? '' : 's'} of skill cooldown.`), 'good');
    }
  }
  if (m.hp > 0) msg(ui(`${crit ? '暴击！' : ''}你射中${m.name}，造成 ${dmg} 点伤害。`, `${crit ? 'Critical! ' : ''}You shot ${visibleWorldName(m.name)} for ${dmg} damage.`));
}
function monsterAttack(m, armorBreak = false) {
  lunge(m, player.x, player.y);
  // 游侠被动「灵巧」：一成几率闪开近战攻击（不挡远程——远程是游侠的克制面）
  if (classId === 'ranger' && player.hp > 0 && rng() < 0.10) {
    floater(player, ui('闪避','Dodge'), '#7ec8e3');
    msg(ui(`${m.name}的攻击被你灵巧闪开。`, `You dodged ${visibleWorldName(m.name)}'s attack.`));
    return;
  }
  const raw = m.atk + ri(-1, 1);
  let dmg = armorBreak ? Math.max(1, raw) : Math.max(1, raw - pDef());
  dmg = applyDirectHitMechanic(dmg);
  if (armorBreak) {
    floater(player, ui('破甲重击!','ARMOR BREAK!'), '#e0a73a');
    msg(ui(`${m.name} 的蓄力破甲命中，造成 ${dmg} 点无视护甲伤害！`, `${visibleWorldName(m.name)}'s Armor Break hit for ${dmg} armor-piercing damage!`), 'bad');
  } else {
    msg(ui(`${m.name}击中你，造成 ${dmg} 点伤害！`, `${visibleWorldName(m.name)} hit you for ${dmg} damage!`), 'bad');
  }
  player.hp -= dmg;
  armReprisal();
  floater(player, `-${dmg}`, '#ff6b6b');
  addTrauma(armorBreak ? 0.48 : 0.35); sfx.hurt();
  if (m.poison) {
    player.poison = Math.max(player.poison || 0, 3);
    msg(ui('毒素渗进伤口。','Poison seeps into the wound.'), 'bad');
  }
  if ((m.elite || m.boss || m.midBoss) && player.hp > 0) applyGrievous();
  if (m.leech) {
    const heal = Math.max(1, Math.round(dmg * m.leech));
    m.hp = Math.min(m.maxHp, m.hp + heal);
  }
  const th = pThorns();
  if (th > 0 && m.hp > 0 && player.hp > 0) {
    m.hp -= th; m.hurtT = 1;
    floater(m, `-${th}`, '#c9a7ff');
    burst(m.fx, m.fy, '#c9a7ff', 4);
    if (m.hp <= 0) {
      msg(ui(`${m.name} 撞上荆棘，被反噬而死！`, `${visibleWorldName(m.name)} died on your thorns!`), 'good');
      killMonster(m);
    } else {
      msg(ui(`荆棘反噬${m.name} ${th} 点。`, `Thorns dealt ${th} damage to ${visibleWorldName(m.name)}.`));
    }
  }
  if (player.hp <= 0) die();
}
function dropAt(x, y, it) {
  const seen = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  const q = [[x, y]];
  seen[y][x] = true;
  for (let qi = 0; qi < q.length; qi++) {
    const [cx0, cy0] = q[qi];
    const occupied = (player.x === cx0 && player.y === cy0) || monsterAt(cx0, cy0) || npcAt(cx0, cy0);
    if (map[cy0][cx0] === FLOOR && !itemAt(cx0, cy0) && !occupied) {
      items.push({ ...it, x: cx0, y: cy0 });
      return;
    }
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx0 + ox, ny = cy0 + oy;
      if (inB(nx, ny) && !seen[ny][nx]) {
        seen[ny][nx] = true;
        q.push([nx, ny]);
      }
    }
  }
}
const PROGRESSION_RULES = typeof window !== 'undefined' ? window.DE_PROGRESSION_RULES_V130 : null;
if (!PROGRESSION_RULES || PROGRESSION_RULES.authority !== 'level-up-arithmetic')
  throw new Error('Dungeon Echo level-up-arithmetic authority missing');
function killMonster(m) {
  const boomHit = m.boom && player.hp > 0 &&
    Math.abs(m.x - player.x) + Math.abs(m.y - player.y) <= 1;
  monsters.splice(monsters.indexOf(m), 1);
  player.kills++; player.xp += m.xp;
  burst(m.fx, m.fy, m.color, 14);
  addDecal(m.x, m.y);
  msg(ui(`${m.name}被消灭了！（+${m.xp} 经验）`, `${visibleWorldName(m.name)} was slain! (+${m.xp} XP)`), 'good');
  if (boomHit) {
    const dmg = Math.max(2, Math.round(m.atk * 0.55) - Math.floor(pDef() / 2));
    player.hp -= dmg;
    floater(player, `-${dmg}`, '#e0a73a');
    burst(m.fx, m.fy, '#e0a73a', 22);
    msg(ui(`${m.name} 炸裂开来，你受到 ${dmg} 点溅射伤害！`, `${visibleWorldName(m.name)} exploded, dealing ${dmg} splash damage to you!`), 'bad');
    sfx.hurt();
    if (player.hp <= 0) { die(); updateHud(); return; }
  }
  if (m.boss) {
    const tr = RUN_PROFILE.terminalReward;
    const C = RUN_PROFILE.consumables;
    dropAt(m.x, m.y, { type: tr.kind, icon: tr.icon, name: tr.name });
    dropAt(m.x, m.y, { type: 'gold', icon: C.gold.icon,
      val: tr.bossGoldBase + depth * tr.bossGoldPerDepth,
      name: C.gold.name });
    msg(fmtText(runText('bossDeath')), 'gold');
  } else if (m.midBoss) {
    const C = RUN_PROFILE.consumables;
    dropAt(m.x, m.y, { type: 'equip', item: genEquip(depth, 3), emoji: '', name: '装备' });
    dropAt(m.x, m.y, { type: 'gold', icon: C.gold.icon, val: 80 + depth * 8, name: C.gold.name });
    if (C.key) dropAt(m.x, m.y, { type: 'key', icon: C.key.icon, name: C.key.name });
    dropAt(m.x, m.y, { type: 'potion', icon: C.potion.icon, name: C.potion.name });
    if (greedyMode) dropAt(m.x, m.y, { type: 'escape', icon: C.scroll.icon, name: '回城卷轴' });
    msg(fmtText(runText('midBossDeath', ui('中层守卫倒下了。','The deep guardian has fallen.'))), 'gold');
    msg(ui(`守卫的战利品散落一地：史诗装备 · 金币` +
      (C.key ? ' · 钥匙' : '') + ` · ${C.potion.name}！`,
      `The guardian's loot spills across the floor: Epic gear · Gold${C.key ? ' · Key' : ''} · ${visibleWorldName(C.potion.name)}!`), 'good');
  } else if (m.elite) {
    dropAt(m.x, m.y, { type: 'equip', item: genEquip(depth, 2), emoji: '', name: '装备' });
  } else {
    const KL = RUN_PROFILE.floorRules.killLoot;
    const LN = RUN_PROFILE.floorRules.lootCounts;
    const C = RUN_PROFILE.consumables;
    const r = rng();
    if (r < KL.gold)
      dropAt(m.x, m.y, { type: 'gold', icon: C.gold.icon,
        val: Math.round((ri(LN.killGoldLo, LN.killGoldHi) + depth * LN.killGoldPerDepth) * pPlunder()),
        name: C.gold.name });
    else if (r < KL.potion)
      dropAt(m.x, m.y, { type: 'potion', icon: C.potion.icon, name: C.potion.name });
    else if (r < KL.equip)
      dropAt(m.x, m.y, { type: 'equip', item: genEquip(depth), emoji: '', name: '装备' });
  }
  const kh = Math.round(pKillHeal() * healMult());
  if (greedyMode && meta) meta.totalKills = (meta.totalKills || 0) + 1;
  if (kh > 0 && player.hp > 0 && player.hp < pMaxHp()) {
    const h = Math.min(pMaxHp() - player.hp, kh);
    player.hp += h;
    floater(player, `+${h}`, '#7dd87d');
  }
  while (player.xp >= PROGRESSION_RULES.xpThreshold(player.lvl)) {
    player.xp -= PROGRESSION_RULES.xpThreshold(player.lvl);
    const delta = PROGRESSION_RULES.levelUpDelta();
    player.lvl++; player.hpBase += delta.hpBase; player.atkBase += delta.atkBase;
    player.hp = Math.min(pMaxHp(), player.hp + delta.immediateHeal);
    floater(player, 'LEVEL UP!', '#eda23a');
    burst(player.fx, player.fy, '#eda23a', 16);
    sfx.levelup();
    msg(ui(`你升到了 ${player.lvl} 级！攻击+1，生命上限+6。`, `Level ${player.lvl}! ATK +1, Max HP +6.`), 'gold');
    if (PROGRESSION_RULES.talentDue(player.lvl)) pendingTalent = true;
  }
  if (!floorCleared && monsters.length === 0) {
    floorCleared = true;
    const bonus = 12 + depth * 3;
    player.gold += bonus;
    msg(fmtText(runText('floorClear', ui(`本层肃清。清场赏金 ${bonus}。`,`The floor is clear. Clear bonus: ${bonus} Gold.`))) + ui(`（+${bonus} 金）`, ` (+${bonus} Gold)`), 'gold');
    sfx.win();
  }
  if (pendingTalent) openTalent();
}
function die() {
  if (greedyMode && meta) {
    const hasIns = (meta.insurance || 0) > 0;
    const lostGold = player.gold;
    sfx.die();
    if (hasIns) {
      // 保险符：碎裂抵一次死亡——背包完好，随身金币仍坠入深渊
      meta.insurance--;
      syncMetaFromPlayer('insured');
      meta.wheelSpins = 0; meta.wheelResets = 0; meta.wheelSlots = null;
      enterTown();
      msg(ui(`保险符碎裂成金光！背包里的 ${player.inv.length} 件物品完好无损。`, `The Insurance Charm shatters into golden light! All ${player.inv.length} backpack items are safe.`), 'gold');
      msg(ui(`但随身携带的 ${lostGold} 金币还是掉进了深渊。`, `But ${lostGold} carried Gold still fell into the abyss.`), 'bad');
    } else {
      greedyDeathReturn(player.inv.length, lostGold);
    }
    return;
  }
  state = 'dead'; sfx.die(); saveBest(); clearRun();
  showOverlay('dead',
    ui(
      `你倒在了第 <b>${depth}</b> 层。<br>` +
        `${esc(classDef().name)} · 等级 <b>${player.lvl}</b> · 击杀 <b>${player.kills}</b> · 金币 <b>${player.gold}</b> · 回合 <b>${turns}</b><br>`,
      `You fell on Floor <b>${depth}</b>.<br>` +
        `${esc(classDef().name)} · Level <b>${player.lvl}</b> · Kills <b>${player.kills}</b> · Gold <b>${player.gold}</b> · Turns <b>${turns}</b><br>`) +
    bestText());
}
function winGame() {
  if (greedyMode && meta) {
    syncMetaFromPlayer(false);
    meta.bestDepth = Math.max(meta.bestDepth || 0, depth);
    meta.wins = (meta.wins || 0) + 1;
    checkAchv();
    saveMeta();
  }
  state = 'won'; sfx.win(); saveBest(); clearRun();
  showOverlay('win',
    `${fmtText(runText('winBody'))}` +
    ui(`下潜 <b>${depth}</b> 层 · ${esc(classDef().name)} · 等级 <b>${player.lvl}</b> · 击杀 <b>${player.kills}</b> · 金币 <b>${player.gold}</b>`,
      `Floor <b>${depth}</b> · ${esc(classDef().name)} · Level <b>${player.lvl}</b> · Kills <b>${player.kills}</b> · Gold <b>${player.gold}</b>`));
}

function pickupHere() {
  const it = itemAt(player.x, player.y);
  if (!it) return;
  let bagChanged = false;
  switch (it.type) {
    case 'potion':
      player.potions++; msg(ui('你捡起了一瓶治疗药水。','Picked up a Healing Potion.'), 'good'); break;
    case 'scroll':
      player.scrolls++; msg(ui('你捡起了一张传送卷轴。','Picked up a Teleport Scroll.'), 'good'); break;
    case 'escape':
      player.escapes = (player.escapes || 0) + 1;
      msg(ui('你捡起了一张回城卷轴——按 T 即可带着战利品平安回镇！','Picked up a Return Scroll — press T to bring your loot safely back to town!'), 'gold');
      break;
    case 'key':
      player.keys++; msg(ui('你捡起了一把锈蚀钥匙。','Picked up a Rusty Key.'), 'gold'); break;
    case 'gold': {
      const amt = Math.max(1, Math.round(it.val * (1 + pGoldBonus() / 100)));
      player.gold += amt; msg(ui(`你捡起了 ${amt} 枚金币。`, `Picked up ${amt} Gold.`), 'gold'); break;
    }
    case 'chest': {
      if (it.locked && player.keys <= 0) {
        msg(ui('宝箱锁着。你需要一把钥匙。','The chest is locked. You need a key.'), 'bad');
        return;
      }
      if (it.locked) player.keys--;
      items.splice(items.indexOf(it), 1);
      sfx.chest();
      const loot = genEquip(depth, 2);
      if (player.inv.length >= BAG_CAP) {
        dropAt(player.x, player.y, { type: 'equip', item: loot, emoji: '', name: '装备' });
        msg(ui(`你打开宝箱，【${loot.name}】掉在地上。`, `You opened the chest. [${visibleItemName(loot)}] fell to the ground.`), rarityLogCls(loot.rarity));
      } else {
        player.inv.push(loot);
        bagChanged = true;
        msg(ui(`你打开宝箱，获得【${loot.name}】。`, `You opened the chest and obtained [${visibleItemName(loot)}].`), rarityLogCls(loot.rarity));
      }
      if (rng() < 0.5) {
        player.gold += 12 + depth * 3;
        msg(ui('箱底还有一撮金币。','There is more Gold at the bottom of the chest.'), 'gold');
      }
      if (bagChanged) renderBag();
      sfx.pickup();
      persistRun();
      return;
    }
    case 'cask': {
      items.splice(items.indexOf(it), 1);
      sfx.chest();
      const roll = rng();
      if (roll < 0.45) {
        const amt = Math.max(1, Math.round((4 + depth * 2 + ri(0, 4)) * (1 + pGoldBonus() / 100)));
        player.gold += amt;
        msg(ui(`木桶裂开，滚出 ${amt} 枚金币。`, `The cask split open and spilled ${amt} Gold.`), 'gold');
        sfx.pickup();
      } else if (roll < 0.65) {
        player.potions++;
        msg(ui('木桶里藏着一眼治疗药水！','A Healing Potion was hidden in the cask!'), 'good');
        sfx.potion();
      } else if (roll < 0.76) {
        const loot = genEquip(depth, 1);
        if (player.inv.length >= BAG_CAP) {
          dropAt(player.x, player.y, { type: 'equip', item: loot, emoji: '', name: '装备' });
          msg(ui(`木桶里藏着【${loot.name}】，但它掉落在了地上。`, `The cask held [${visibleItemName(loot)}], but it fell to the ground.`), rarityLogCls(loot.rarity));
        } else {
          player.inv.push(loot);
          bagChanged = true;
          msg(ui(`木桶里藏着【${loot.name}】！`, `The cask held [${visibleItemName(loot)}]!`), rarityLogCls(loot.rarity));
        }
      } else if (roll < 0.85) {
        msg(ui('木桶碎片下空空如也。','Nothing but splinters inside the cask.'), 'dim');
      } else {
        msg(ui('木桶里积满了陈年灰尘。','The cask was filled with ancient dust.'), 'dim');
      }
      if (bagChanged) renderBag();
      persistRun();
      return;
    }
    case 'equip':
      if (player.inv.length >= BAG_CAP) {
        msg(ui('背包已满，无法拾取装备！','Backpack full — cannot pick up gear!')); return;
      }
      player.inv.push(it.item);
      bagChanged = true;
      msg(ui(`拾取【${it.item.name}】`, `Picked up [${visibleItemName(it.item)}]`), rarityLogCls(it.item.rarity));
      break;
    case 'amulet':
      items.splice(items.indexOf(it), 1);
      sfx.pickup();
      if (ENDLESS_AFTER) {
        showEchoChoice();
      } else {
        winGame();
      }
      return;
  }
  items.splice(items.indexOf(it), 1);
  if (bagChanged) renderBag();
  sfx.pickup();
}
function usePotion() {
  if (state !== 'playing') return;
  if (player.potions <= 0) { msg(ui('你没有药水了。','You have no potions left.')); return; }
  if (player.hp >= pMaxHp()) { msg(ui('你现在状态很好，不需要喝药水。','You are already healthy enough; no potion needed.')); return; }
  player.potions--;
  // 回复量随最大生命保底（18%），修正深层「药水越来越不解渴」的衰减
  const heal = Math.min(pMaxHp() - player.hp,
    Math.round(Math.max(14 + depth * 2, pMaxHp() * 0.18)
      * (1 + (player.potionBoost || 0) / 100) * healMult()));
  player.hp += heal;
  player.poison = 0;
  const clarity = mechanicPower('clarity');
  if (clarity && player.grievous > 0) {
    const before = player.grievous;
    player.grievous = clarity >= 2 ? 0 : Math.max(0, player.grievous - 1);
    msg(clarity >= 2
      ? ui('【清创】药力洗净了重伤。','[Clarity] The potion cleared Grievous Wounds.')
      : ui(`【清创】重伤缩短 ${before - player.grievous} 回合。`, `[Clarity] Grievous Wounds shortened by ${before - player.grievous} turn.`), 'good');
  }
  floater(player, `+${heal}`, '#7dd87d');
  sfx.potion();
  msg(ui(`你喝下药水，恢复了 ${heal} 点生命。`, `You drank a potion and restored ${heal} HP.`), 'good');
  endTurn();
}
function useScroll() {
  if (state !== 'playing') return;
  if (player.scrolls <= 0) { msg(ui('你没有卷轴了。','You have no scrolls left.')); return; }
  player.scrolls--;
  for (let t = 0; t < 300; t++) {
    const x = rnd(MAP_W), y = rnd(MAP_H);
    if (map[y][x] === FLOOR && !monsterAt(x, y) && !itemAt(x, y) && !npcAt(x, y)) {
      player.x = x; player.y = y; player.fx = x; player.fy = y;
      break;
    }
  }
  msg(ui('卷轴的光芒将你传送到了未知之处……','The scroll carries you to an unknown place…'));
  endTurn();
}
function useSkill() {
  if (state !== 'playing') return;
  if (player.skillCd > 0) { msg(ui(`技能冷却中（${player.skillCd} 回合）。`, `Skill cooldown: ${player.skillCd} turns.`)); return; }
  const sk = classDef().skill;
  const mobsBeforeSkill = monsters.length;
  let used = false;
  if (sk.id === 'cleave') {
    const adj = monsters.filter(m => Math.abs(m.x - player.x) + Math.abs(m.y - player.y) === 1);
    if (!adj.length) { msg(ui('附近没有可以横扫的敌人。','No adjacent enemies to Cleave.')); return; }
    const dmg = Math.max(1, Math.round(pAtk() * 1.5));
    sfx.skill();
    for (const m of [...adj]) {
      if (monsters.includes(m)) applyDamageToMonster(m, Math.max(1, dmg - m.def), false);
    }
    msg(ui(`横扫命中 ${adj.length} 个敌人！`, `Cleave hit ${adj.length} enemies!`), 'gold');
    used = true;
  } else if (sk.id === 'dash') {
    const [dx, dy] = player.facing || [1, 0];
    let nx = player.x, ny = player.y, hits = 0;
    for (let step = 0; step < 2; step++) {
      const tx = nx + dx, ty = ny + dy;
      if (!walkable(tx, ty) || npcAt(tx, ty)) break;
      const m = monsterAt(tx, ty);
      if (m) {
        applyDamageToMonster(m, Math.max(1, pAtk() + 2 - m.def), false);
        hits++;
        if (m.hp > 0) break;
      }
      nx = tx; ny = ty;
    }
    if (nx === player.x && ny === player.y && !hits) { msg(ui('这个方向无法疾步。','Dash is blocked in that direction.')); return; }
    player.x = nx; player.y = ny;
    sfx.skill();
    triggerTrap(nx, ny);
    pickupHere();
    msg(hits
      ? ui(`疾步穿过 ${hits} 个敌人。`, `Dash crossed ${hits} enemies.`)
      : ui('你向前疾步。','You dash forward.'), 'good');
    used = true;
  } else if (sk.id === 'bolt') {
    const vis = monsters.filter(m => visible[m.y] && visible[m.y][m.x]);
    if (!vis.length) { msg(ui('视野内没有可以点射的敌人。','No visible target for Arcane Bolt.')); return; }
    vis.sort((a, b) =>
      (Math.abs(a.x - player.x) + Math.abs(a.y - player.y)) -
      (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)));
    const m = vis[0];
    const dmg = Math.max(2, pAtk() + Math.round(player.lvl * 0.75) + 3 - Math.floor(m.def * 0.4));
    sfx.skill();
    applyDamageToMonster(m, dmg, true);
    const kx = Math.sign(m.x - player.x), ky = Math.sign(m.y - player.y);
    const bx = m.x + kx, by = m.y + ky;
    if (m.hp > 0 && walkable(bx, by) && !monsterAt(bx, by) && !npcAt(bx, by)) {
      m.x = bx; m.y = by;
    }
    msg(ui(`奥术弹击中${m.name}，造成 ${dmg} 点伤害。`, `Arcane Bolt hit ${visibleWorldName(m.name)} for ${dmg} damage.`), 'epic');
    used = true;
  } else if (sk.id === 'backstab') {
    const vis = monsters.filter(m => visible[m.y] && visible[m.y][m.x]);
    if (!vis.length) { msg(ui('视野内没有可以偷袭的目标。','No visible target for Shadowstrike.')); return; }
    vis.sort((a, b) =>
      (Math.abs(a.x - player.x) + Math.abs(a.y - player.y)) -
      (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)));
    const m = vis[0];
    const away = { x: Math.sign(m.x - player.x), y: Math.sign(m.y - player.y) };
    const spots = [
      { x: m.x + away.x, y: m.y + away.y },
      { x: m.x - away.x, y: m.y }, { x: m.x + away.x, y: m.y },
      { x: m.x, y: m.y - away.y }, { x: m.x, y: m.y + away.y },
      { x: m.x - away.x, y: m.y - away.y },
    ];
    const spot = spots.find(s => (s.x !== m.x || s.y !== m.y) &&
      walkable(s.x, s.y) && !monsterAt(s.x, s.y) && !npcAt(s.x, s.y));
    if (!spot) { msg(ui('目标周围没有落脚点，偷袭失败。','No safe landing tile beside the target; Shadowstrike failed.')); return; }
    player.x = spot.x; player.y = spot.y;
    const dmg = Math.max(2, Math.round((pAtk() + 2 - m.def) * 2.2));
    sfx.skill();
    applyDamageToMonster(m, dmg, true);
    triggerTrap(spot.x, spot.y);
    pickupHere();
    msg(ui(`你欺入${m.name}身侧，偷袭暴击造成 ${dmg} 点伤害！`, `Shadowstrike hits ${visibleWorldName(m.name)} for ${dmg} critical damage!`), 'epic');
    used = true;
  }
  if (!used) return;
  classSkillFxT = 1;
  const echo = mechanicPower('echo_edge');
  if (echo) player.echoEdgeTurn = turns + 1;
  const afterimage = mechanicPower('afterimage');
  if (afterimage) player.afterimageTurn = turns + 1;
  player.skillCd = Math.max(2, sk.cd - (player.skillHaste || 0));
  const overclock = mechanicPower('overclock');
  if (overclock && monsters.length < mobsBeforeSkill) {
    const refund = overclock >= 2 ? 2 : 1;
    player.skillCd = Math.max(0, player.skillCd - refund);
    msg(ui(`【回路超频】技能击杀返还 ${refund} 回合冷却。`, `[Overclock] Skill kill refunded ${refund} turn${refund === 1 ? '' : 's'} of cooldown.`), 'good');
  }
  if (state !== 'playing') { updateHud(); return; }
  endTurn();
}
function descend() {
  if (state !== 'playing') return;
  if (!canDescendNow()) { msg(fmtText(runText('bossGate')), 'bad'); return; }
  if (map[player.y][player.x] !== STAIRS) { msg(ui('这里没有向下的楼梯。站上去再按 Enter。','There are no stairs here. Stand on them and press Enter.')); return; }
  depth++;
  buildThemeTex(depth);
  genLevel(); computeFov(); sfx.stairs();
  const themeName = THEMES[themeIdx(depth)] ? visibleWorldName(THEMES[themeIdx(depth)].name) : ui('未知层域','Unknown Depths');
  msg(isFinalFloor()
    ? fmtText(runText('maxDepthArrive'))
    : player.echoMode
      ? ui(`回响第 ${depth} 层——${themeName}。怪物随着深度一同苏醒。`, `Echo Floor ${depth} — ${themeName}. The monsters awaken with the depth.`)
      : ui(`你沿着螺旋阶梯下到了第 ${depth} 层——${themeName}。`, `You descended the spiral stairs to Floor ${depth} — ${themeName}.`), 'gold');
  msg(ui(`本层有 ${monsters.length} 个敌人、${items.length} 处物资。`, `This floor has ${monsters.length} enemies and ${items.length} loot spots.`), 'good');
  renderBag(); updateHud();
  persistRun();
}

// ================= 快速下潜（付费跳层） =================
const QUICK_DIVE_STEP = 5;
function quickDiveCost(fromDepth, n) {
  const floors = Math.max(0, Math.floor(n) || 0);
  return floors * (8 + Math.max(1, Math.floor(fromDepth)) * 4);
}
function quickDive(n) {
  if (state !== 'playing') return;
  if (!canDescendNow()) { msg(fmtText(runText('bossGate')), 'bad'); return; }
  if (!map || map[player.y][player.x] !== STAIRS) { msg(ui('站到楼梯上才能快速下潜（Enter 是下一层）。','Stand on the stairs before descending.')); return; }
  let skip = Math.floor(Number(n) || QUICK_DIVE_STEP);
  if (!Number.isFinite(skip)) skip = QUICK_DIVE_STEP;
  skip = Math.max(1, Math.min(skip, MAX_DEPTH - depth));
  const cost = quickDiveCost(depth, skip);
  if ((player.gold || 0) < cost) {
    msg(ui(`金币不够——向回响支付 ${cost} G 才能直坠 ${skip} 层。`, `Not enough Gold — the Echo demands ${cost} G to dive ${skip} floors.`), 'bad');
    return;
  }
  player.gold -= cost;
  depth += skip;
  buildThemeTex(depth);
  genLevel(); computeFov(); sfx.stairs();
  msg(isFinalFloor()
    ? fmtText(runText('maxDepthArrive'))
    : ui(`你向回响支付了 ${cost} G，沿捷径直坠 ${skip} 层——来到第 ${depth} 层。`, `You paid the Echo ${cost} G and plunged ${skip} floors — arriving at Floor ${depth}.`), 'gold');
  msg(ui(`本层有 ${monsters.length} 个敌人、${items.length} 处物资。`, `This floor has ${monsters.length} enemies and ${items.length} loot spots.`), 'good');
  renderBag(); updateHud();
  persistRun();
}

function triggerTrap(x, y) {
  const t = (traps || []).find(tr => tr.armed && tr.x === x && tr.y === y);
  if (!t) return;
  t.armed = false;
  const dmg = Math.max(1, t.dmg - Math.floor(pDef() / 2));
  player.hp -= dmg;
  floater(player, `-${dmg}`, '#e0a73f');
  burst(x, y, '#e0a73f', 8);
  addTrauma(0.2);
  sfx.hurt();
  msg(ui(`你踩上了陷阱，受到 ${dmg} 点伤害！`, `You stepped on a trap and took ${dmg} damage!`), 'bad');
  if (player.hp <= 0) die();
}

function useRest(npc) {
  if (npc.used) { msg(ui('余烬已经冷了。','The embers have gone cold.')); return; }
  npc.used = true;
  const heal = Math.min(pMaxHp() - player.hp, Math.max(4, Math.floor(pMaxHp() * 0.45 * healMult())));
  player.hp = Math.min(pMaxHp(), player.hp + heal);
  player.poison = 0;
  floater(player, `+${heal}`, '#7dd87d');
  sfx.potion();
  msg(ui(`你在营地包扎伤口，恢复了 ${heal} 点生命。`, `You rest at camp and recover ${heal} HP.`), 'good');
  persistRun();
  updateHud();
}

function openShrine(npc) {
  if (npc.used) { msg(ui('神龛已经沉寂。','The shrine has gone silent.')); return; }
  shrineTarget = npc;
  state = 'shrine';
  const title = $('shrine-title');
  const copy = $('shrine-copy');
  if (title) title.textContent = ui('无名神龛','Nameless Shrine');
  if (copy) copy.textContent = ui('祈祷可能赐福，也可能索取代价。你要碰它吗？','Prayer may grant a blessing or demand a price. Touch the shrine?');
  showUi('shrine-screen');
}

function applyShrine() {
  const npc = shrineTarget;
  hideUi('shrine-screen');
  shrineTarget = null;
  if (!npc || npc.used) { state = 'playing'; return; }
  npc.used = true;
  const roll = rng();
  if (roll < 0.28) {
    const heal = Math.min(pMaxHp() - player.hp, Math.floor(pMaxHp() * 0.5 * healMult()));
    player.hp = Math.min(pMaxHp(), player.hp + heal);
    player.poison = 0;
    msg(ui(`神龛涌出温水，你恢复了 ${heal} 点生命。`, `Warm water flows from the shrine. You recover ${heal} HP.`), 'good');
    sfx.potion();
  } else if (roll < 0.5) {
    player.atkBase += 1;
    msg(ui('一柄无形的刃在你掌心成形。基础攻击 +1。','An unseen blade forms in your palm. Base ATK +1.'), 'gold');
    sfx.levelup();
  } else if (roll < 0.68) {
    player.hpBase += 8;
    player.hp = Math.min(pMaxHp(), player.hp + 8);
    msg(ui('石像把血肉还你。生命上限 +8。','The statue restores your flesh. Max HP +8.'), 'good');
    sfx.equip();
  } else if (roll < 0.82) {
    const loot = genEquip(depth, 2);
    if (player.inv.length < BAG_CAP) player.inv.push(loot);
    else dropAt(player.x, player.y, { type: 'equip', item: loot, emoji: '', name: '装备' });
    msg(ui(`神龛吐出一件祭品：【${loot.name}】。`, `The shrine yields an offering: [${visibleItemName(loot)}].`), rarityLogCls(loot.rarity));
    renderBag();
    sfx.chest();
  } else {
    const pool = monsterPoolFor(depth);
    let spawned = 0;
    for (let i = 0; i < 3; i++) {
      const p = pickSpawn(3);
      if (!p) break;
      monsters.push(makeMonster(pick(pool), p));
      spawned++;
    }
    player.gold += 25 + depth * 2;
    msg(ui(`暗影祭坛裂开，涌出 ${spawned} 个敌人。你同时摸到了金币。`, `The shadow altar splits open and releases ${spawned} enemies. You snatch some Gold.`), 'bad');
    sfx.hurt();
  }
  state = 'playing';
  persistRun();
  updateHud();
}

function openTalent() {
  pendingTalent = false;
  state = 'talent';
  const grid = $('talent-grid');
  const pool = [...TALENTS];
  const picks = [];
  while (picks.length < 3 && pool.length) {
    picks.push(pool.splice(rnd(pool.length), 1)[0]);
  }
  if (grid) {
    grid.innerHTML = picks.map(t => `
      <button type="button" class="class-card" data-talent="${esc(t.id)}">
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.desc)}</p>
      </button>`).join('');
  }
  showUi('talent-screen');
}

function pickTalent(id) {
  const t = TALENTS.find(x => x.id === id);
  hideUi('talent-screen');
  if (t) {
    t.apply(player);
    player.talents = player.talents || [];
    player.talents.push(t.id);
    msg(ui(`回响觉醒：【${t.name}】。${t.desc}`, `Echo awakened: [${t.name}]. ${t.desc}`), 'gold');
    sfx.levelup();
  }
  state = 'playing';
  renderBag(); renderEquip(); updateHud();
  persistRun();
  endTurn();
}

function showEchoChoice() {
  state = 'echo';
  showUi('echo-screen');
}

function chooseEchoLeave() {
  if (state !== 'echo') return false;
  hideUi('echo-screen');
  winGame();
  return true;
}

function chooseEchoStay() {
  if (state !== 'echo') return false;
  hideUi('echo-screen');
  player.echoMode = true;
  state = 'playing';
  msg(fmtText(runText('endlessArrive', ui('你踏入无尽回响。','You enter the Endless Echo.'))), 'epic');
  if (map[player.y][player.x] !== STAIRS) map[player.y][player.x] = STAIRS;
  sfx.stairs();
  persistRun();
  updateHud();
  return true;
}

function bfsStep(tx, ty) {
  if (!inB(tx, ty) || !explored[ty][tx] || map[ty][tx] === WALL) return null;
  const seen = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  const prev = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(null));
  const q = [[player.x, player.y]];
  seen[player.y][player.x] = true;
  for (let qi = 0; qi < q.length; qi++) {
    const [x, y] = q[qi];
    if (x === tx && y === ty) break;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ox, ny = y + oy;
      if (!inB(nx, ny) || seen[ny][nx]) continue;
      if (map[ny][nx] === WALL && !(secrets || []).some(s => !s.revealed && s.x === nx && s.y === ny)) continue;
      if (!explored[ny][nx] && !(nx === tx && ny === ty)) continue;
      if (monsterAt(nx, ny) && !(nx === tx && ny === ty)) continue;
      seen[ny][nx] = true;
      prev[ny][nx] = [x, y];
      q.push([nx, ny]);
    }
  }
  if (!seen[ty][tx]) return null;
  let cx = tx, cy = ty;
  const path = [[cx, cy]];
  while (!(cx === player.x && cy === player.y)) {
    const p = prev[cy][cx];
    if (!p) break;
    cx = p[0]; cy = p[1];
    path.push([cx, cy]);
  }
  path.reverse();
  return path;
}

function clickNav(tx, ty) {
  if (state !== 'playing' || !player) return;
  if (tx === player.x && ty === player.y) {
    if (map[ty][tx] === STAIRS) descend();
    return;
  }
  if (Math.abs(tx - player.x) + Math.abs(ty - player.y) === 1) {
    tryMove(tx - player.x, ty - player.y);
    return;
  }
  const path = bfsStep(tx, ty);
  if (!path || path.length < 2) return;
  const [nx, ny] = path[1];
  tryMove(nx - player.x, ny - player.y);
}

function equipFromBag(i) {
  const it = player.inv[i];
  if (!it || state !== 'playing') return;
  const old = player.equip[it.slot];
  player.equip[it.slot] = it;
  clearMechanicWindows();
  player.inv.splice(i, 1);
  if (old) player.inv.push(old);
  player.hp = Math.min(player.hp, pMaxHp());
  selectedBagIndex = -1;
  sfx.equip();
  if ((it.rarity || 0) >= 4 && greedyMode && meta) { meta.gotLegend = 1; msg(ui('传说藏品入账！远征录已记录。','Legendary item acquired! The Expedition Record has been updated.'), 'gold'); }
  msg(ui(`你装备了【${it.name}】。`, `You equipped [${visibleItemName(it)}].`), rarityLogCls(it.rarity));
  renderBag(); renderEquip(); updateHud();
  persistRun();
}
function unequip(slot) {
  if (state !== 'playing') return;
  const it = player.equip[slot];
  if (!it) return;
  if (player.inv.length >= BAG_CAP) { msg(ui('背包已满，无法卸下装备！','Backpack full — cannot unequip this item!')); return; }
  player.equip[slot] = null;
  clearMechanicWindows();
  player.inv.push(it);
  player.hp = Math.min(player.hp, pMaxHp());
  selectedBagIndex = -1;
  renderBag(); renderEquip(); updateHud();
}
function discardFromBag(i) {
  const it = player.inv[i];
  if (!it || state !== 'playing') return;
  dropAt(player.x, player.y, { type: 'equip', item: it, emoji: '', name: '装备' });
  player.inv.splice(i, 1);
  selectedBagIndex = -1;
  msg(ui(`你把【${it.name}】丢在了地上。`, `You dropped [${visibleItemName(it)}] on the ground.`));
  renderBag(); updateHud();
}
function renderBag() {
  if (!$('bag')) return;
  let html = '';
  for (let i = 0; i < BAG_CAP; i++) {
    const it = player.inv[i];
    const icon = it ? lootMarkup(it.icon) : '';
    html += it
      ? `<div class="bagcell r${it.rarity}${i === selectedBagIndex ? ' selected' : ''}" data-i="${i}" tabindex="0" role="button" aria-label="${esc(visibleItemName(it))}">${icon}<span class="dropx" data-drop="${i}" aria-label="${ui('丢弃','Drop')}">✕</span></div>`
      : `<div class="bagcell empty"></div>`;
  }
  $('bag').innerHTML = html;
  $('bagcount').textContent = `${player.inv.length}/${BAG_CAP}`;
  renderBagDetail();
}
function renderEquip() {
  for (const slot of ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet']) {
    const el = $('eq-' + slot); if (!el) continue;
    const it = player.equip[slot];
    const iconEl = el.querySelector('.eqicon');
    iconEl.innerHTML = it ? lootMarkup(it.icon) : '<span aria-hidden="true">◇</span>';
    const nameEl = el.querySelector('.eqname');
    if (it) {
      nameEl.textContent = visibleItemName(it);
      nameEl.style.color = RARITIES[it.rarity].color;
    } else {
      nameEl.textContent = visibleSlotName(slot);
      nameEl.style.color = '';
    }
  }
  const cls = $('st-class');
  if (cls) cls.textContent = classDef().name;
  const classChip = $('eq-class');
  if (classChip) {
    classChip.dataset.class = classId;
    const icon = classChip.querySelector('.eqicon');
    if (icon) icon.textContent = ({ warrior: '⚔', ranger: '➶', mage: '✦', assassin: '◆' })[classId] || '◇';
  }
}

function tooltipHtml(it, compareSlot) {
  const r = RARITIES[it.rarity];
  let html = `<div class="tname r${it.rarity}">${esc(visibleItemName(it))}</div>`;
  if (it.stats.atk) html += `<div>${esc(AFFIX_LABEL.atk(it.stats.atk))}</div>`;
  if (it.stats.def) html += `<div>${esc(AFFIX_LABEL.def(it.stats.def))}</div>`;
  if (it.stats.hp)  html += `<div>${esc(AFFIX_LABEL.hp(it.stats.hp))}</div>`;
  for (const a of (it.affixes || [])) {
    const label = AFFIX_LABEL[a.k];
    if (label) html += `<div class="affix">${esc(label(a.v))}</div>`;
  }
  const mechanicText = mechanicDescription(it);
  if (mechanicText) html += `<div class="affix">${esc(mechanicText)}</div>`;
  const fit = Number(it.score) || 0;
  const value = itemValueScore(it);
  html += `<div style="color:${r.color}">${ui(`适配评分 ${fit} · 内在价值 ${value}`, `Build Fit ${fit} · Item Value ${value}`)}</div>`;
  if (compareSlot) {
    const cur = player.equip[compareSlot];
    if (cur) {
      const fitDelta = fit - (Number(cur.score) || 0);
      const valueDelta = value - itemValueScore(cur);
      html += fitDelta > 0
        ? `<div class="cmp-up">${ui(`▲ 适配 +${fitDelta}`, `▲ Fit +${fitDelta}`)}</div>`
        : fitDelta < 0
          ? `<div class="cmp-down">${ui(`▼ 适配 ${fitDelta}`, `▼ Fit ${fitDelta}`)}</div>`
          : `<div>${ui('＝ 适配评分持平', '= Same build fit')}</div>`;
      html += valueDelta > 0
        ? `<div class="cmp-up">${ui(`◆ 价值 +${valueDelta}`, `◆ Value +${valueDelta}`)}</div>`
        : valueDelta < 0
          ? `<div class="cmp-down">${ui(`◇ 价值 ${valueDelta}`, `◇ Value ${valueDelta}`)}</div>`
          : `<div>${ui('◇ 内在价值持平', '◇ Same item value')}</div>`;
    }
  }
  return html;
}
function renderBagDetail() {
  const copy = $('bagdetail-copy');
  if (!copy) return;
  const equip = document.querySelector ? document.querySelector('[data-bag-equip]') : null;
  const drop = document.querySelector ? document.querySelector('[data-bag-drop]') : null;
  const it = player && player.inv[selectedBagIndex];
  if (it) {
    copy.innerHTML = tooltipHtml(it, it.slot);
    if (equip) equip.disabled = false;
    if (drop) drop.disabled = false;
  } else {
    copy.textContent = ui('轻触物品查看属性，再选择装备或丢弃。','Select an item to inspect it, then equip or drop it.');
    if (equip) equip.disabled = true;
    if (drop) drop.disabled = true;
  }
}
function showTooltip(e, html) {
  const t = $('tooltip'); if (!t) return;
  t.innerHTML = html;
  t.classList.remove('hidden');
  const x = clamp(e.clientX + 14, 4, window.innerWidth - 280);
  const y = clamp(e.clientY + 14, 4, window.innerHeight - 160);
  t.style.left = x + 'px'; t.style.top = y + 'px';
}
function hideTooltip() { const t = $('tooltip'); if (t) t.classList.add('hidden'); }

function tryMove(dx, dy) {
  if (state !== 'playing') return;
  const nx = player.x + dx, ny = player.y + dy;
  player.facing = [dx, dy];
  const secret = (secrets || []).find(s => !s.revealed && s.x === nx && s.y === ny);
  if (secret) {
    revealSecret(secret);
    endTurn();
    return;
  }
  const shop = npcAt(nx, ny);
  if (shop && shop.type === 'shop') { openShop(); return; }
  if (shop && shop.type === 'shrine') { openShrine(shop); return; }
  if (shop && shop.type === 'rest') { useRest(shop); return; }
  const m = monsterAt(nx, ny);
  if (m) {
    playerAttack(m);
    if (state !== 'playing') { updateHud(); return; }
  } else {
    const rangedM = findRangedTarget(dx, dy);
    if (rangedM) {
      playerRangedAttack(rangedM);
      if (state !== 'playing') { updateHud(); return; }
    } else if (walkable(nx, ny)) {
      player.x = nx; player.y = ny;
      if (mechanicPower('skirmish')) player.skirmishTurn = turns + 1;
      triggerTrap(nx, ny);
      pickupHere();
      if (state !== 'playing') { updateHud(); return; }
    } else {
      return;
    }
  }
  endTurn();
}

function waitTurn() {
  if (state !== 'playing') return;
  const brace = mechanicPower('brace');
  if (brace) {
    player.braceTurn = turns + 1;
    msg(ui('【镇守】你稳住架势，准备承受下一次直击。','[Brace] You steady your stance for the next direct hit.'), 'good');
  }
  const meditate = mechanicPower('meditate');
  if (meditate && player.skillCd > 0) {
    const refund = meditate >= 2 ? 2 : 1;
    player.skillCd = Math.max(0, player.skillCd - refund);
    msg(ui(`【凝息】额外恢复 ${refund} 回合技能冷却。`, `[Meditate] Restored ${refund} extra turn${refund === 1 ? '' : 's'} of skill cooldown.`), 'good');
  }
  msg(ui('你原地观察四周。','You wait and watch your surroundings.'));
  endTurn();
}
let flowDist = null;
function buildFlow() {
  flowDist = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(-1));
  const q = [[player.x, player.y]];
  flowDist[player.y][player.x] = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const [x, y] = q[qi];
    const d = flowDist[y][x];
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx2 = x + ox, ny2 = y + oy;
      if (inB(nx2, ny2) && map[ny2][nx2] !== WALL && flowDist[ny2][nx2] === -1) {
        flowDist[ny2][nx2] = d + 1;
        q.push([nx2, ny2]);
      }
    }
  }
}
function endTurn() {
  turns++;
  if (player.skillCd > 0) player.skillCd--;
  if (turns % (player.fastRegen ? 4 : 6) === 0 && !(player.grievous > 0) && player.hp > 0 && player.hp < pMaxHp()) player.hp++;
  if (player.grievous > 0) player.grievous--;
  if (player.poison > 0) {
    player.poison--;
    const pd = 1 + Math.floor(depth / 8);
    player.hp -= pd;
    floater(player, `-${pd}`, '#7dcc91');
    msg(ui(`毒素发作，失去 ${pd} 点生命。`, `Poison deals ${pd} damage.`), 'bad');
    if (player.hp <= 0) { die(); updateHud(); return; }
  }
  if (state !== 'playing') { updateHud(); return; }
  buildFlow();
  monstersTurn();
  if (state !== 'playing') { updateHud(); return; }
  computeFov();
  updateHud();
  if (turns % 4 === 0) persistRun();
}
function canSeePlayer(m) {
  const d = Math.max(Math.abs(m.x - player.x), Math.abs(m.y - player.y));
  return d <= AI_SIGHT && los(m.x, m.y, player.x, player.y);
}
function stepToward(m) {
  if (!flowDist) return randomStep(m);
  let bx = 0, by = 0, best = Infinity;
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx2 = m.x + ox, ny2 = m.y + oy;
    if (!inB(nx2, ny2)) continue;
    if ((nx2 === player.x && ny2 === player.y) || !walkable(nx2, ny2) || monsterAt(nx2, ny2) || npcAt(nx2, ny2)) continue;
    const fd = flowDist[ny2][nx2];
    if (fd < 0) continue;
    if (fd < best || (fd === best && rng() < 0.5)) { best = fd; bx = ox; by = oy; }
  }
  if (bx || by) { m.x += bx; m.y += by; }
}
function randomStep(m) {
  const [ox, oy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
  const nx = m.x + ox, ny = m.y + oy;
  if (walkable(nx, ny) && !monsterAt(nx, ny) && !npcAt(nx, ny) && !(nx === player.x && ny === player.y)) {
    m.x = nx; m.y = ny;
  }
}
function monsterRangedAttack(m, armorBreak = false) {
  fireArrow(m.x, m.y, player.x, player.y);
  const raw = Math.round(m.atk * 0.8) + ri(-1, 1);
  const effDef = Math.floor(pDef() / 2);
  let dmg = armorBreak ? Math.max(1, raw) : Math.max(1, raw - effDef);
  dmg = applyDirectHitMechanic(dmg);
  if (armorBreak) {
    floater(player, ui('破甲重击!','ARMOR BREAK!'), '#e0a73a');
    msg(ui(`${m.name} 的蓄力射击命中，造成 ${dmg} 点无视护甲伤害！`, `${visibleWorldName(m.name)}'s charged shot hit for ${dmg} armor-piercing damage!`), 'bad');
  } else {
    msg(ui(`${m.name} 远程袭击你，造成 ${dmg} 点伤害！`, `${visibleWorldName(m.name)} hit you from range for ${dmg} damage!`), 'bad');
  }
  player.hp -= dmg;
  armReprisal();
  floater(player, `-${dmg}`, '#ff6b6b');
  addTrauma(armorBreak ? 0.45 : 0.32); sfx.hurt();
  if ((m.elite || m.boss || m.midBoss) && player.hp > 0) applyGrievous();
  if (m.poison) {
    player.poison = Math.max(player.poison || 0, 3);
    msg(ui('毒素渗进伤口。','Poison seeps into the wound.'), 'bad');
  }
  if (player.hp <= 0) die();
}
function monstersTurn() {
  for (const m of [...monsters]) {
    if (m.slow) {
      m.skip = 1 - (m.skip || 0);
      if (m.skip) continue;
    }
    if (m.regen && m.hp > 0 && m.hp < m.maxHp) {
      const r = Math.max(1, Math.round(m.maxHp * 0.05));
      m.hp = Math.min(m.maxHp, m.hp + r);
      floater(m, `+${r}`, '#7dd87d');
    }
    if ((m.armorBreakCooldown || 0) > 0) m.armorBreakCooldown--;
    const cheb = Math.max(Math.abs(m.x - player.x), Math.abs(m.y - player.y));
    const adj = Math.abs(m.x - player.x) + Math.abs(m.y - player.y) === 1;

    // 已经亮出破甲蓄力：下一回合只有目标仍在原攻击条件内才会命中。
    // 玩家拉开距离/脱离视线会让这一整回合落空，形成明确的可操作反制。
    if ((m.armorBreakCharge || 0) > 0) {
      const rangedBreak = m.armorBreakMode === 'ranged';
      const valid = rangedBreak
        ? !!(m.ranged && canSeePlayer(m) && cheb <= m.ranged)
        : adj;
      m.armorBreakCharge = 0;
      m.armorBreakMode = null;
      if (valid) {
        if (rangedBreak) monsterRangedAttack(m, true);
        else monsterAttack(m, true);
        m.armorBreakCooldown = 3;
        if (state !== 'playing') return;
      } else {
        m.armorBreakCooldown = 1;
        floater(m, ui('蓄力落空','CHARGE MISSED'), '#9b8d78');
        msg(ui(`你避开了${m.name}的破甲重击窗口。`, `You avoided ${visibleWorldName(m.name)}'s Armor Break window.`), 'good');
      }
      continue;
    }

    // 特定敌人才具备破甲能力；先给完整一回合预警，不再用隐藏概率惩罚高防。
    if (m.armorBreak && (m.armorBreakCooldown || 0) <= 0) {
      if (adj && beginArmorBreak(m, 'melee')) continue;
      if (m.ranged && canSeePlayer(m) && cheb <= m.ranged && beginArmorBreak(m, 'ranged')) continue;
    }

    if (adj) {
      monsterAttack(m);
      if (state !== 'playing') return;
      continue;
    }
    if (m.ranged && canSeePlayer(m) && cheb <= m.ranged) {
      monsterRangedAttack(m);
      if (state !== 'playing') return;
      continue;
    }
    if (canSeePlayer(m)) {
      m.alert = AI_MEM;
      if (m.erratic && rng() < 0.5) randomStep(m);
      else stepToward(m);
    } else if (m.alert > 0) {
      m.alert--;
      stepToward(m);
    } else if (rng() < 0.25) {
      randomStep(m);
    }
  }
}

function lungeOff(e) {
  if (e.lungeT > 0) {
    const k = Math.sin(Math.PI * (1 - e.lungeT)) * 0.32 * TILE;
    return [e.ldx * k, e.ldy * k];
  }
  return [0, 0];
}
function drawClassCombatFx(now) {
  if (!player) return;
  const attack = clamp(Number(player.lungeT) || 0, 0, 1);
  const skill = clamp(classSkillFxT, 0, 1);
  if (attack <= .01 && skill <= .01) return;
  const style = CLASS_COMBAT_FX_STYLE[classId] || CLASS_COMBAT_FX_STYLE.warrior;
  const facing = Array.isArray(player.facing) ? player.facing : [1, 0];
  let dx = Number(facing[0]) || 0, dy = Number(facing[1]) || 0;
  if (!dx && !dy) dx = 1;
  const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
  const [lox, loy] = lungeOff(player);
  const bob = Math.sin(now * 2.6 + player.x * 7 + player.y * 5) * 1.3;
  const cx = player.fx * TILE + TILE / 2 + lox;
  const cy = player.fy * TILE + TILE / 2 + bob + loy - 3;
  const angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (classId === 'warrior') {
    ctx.strokeStyle = skill > .01 ? style.soft : style.main;
    ctx.globalAlpha = .35 + Math.max(attack, skill) * .5;
    ctx.lineWidth = 2 + Math.max(attack, skill) * 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22 + skill * 10 + attack * 6, -.82, .82);
    ctx.stroke();
  } else if (classId === 'ranger') {
    ctx.strokeStyle = style.main;
    ctx.globalAlpha = .35 + Math.max(attack, skill) * .45;
    for (let i = skill > .01 ? -1 : 0; i <= (skill > .01 ? 1 : 0); i++) {
      ctx.lineWidth = i === 0 ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(8, i * 6); ctx.lineTo(30 + skill * 18 + attack * 8, i * 3); ctx.stroke();
    }
  } else if (classId === 'mage') {
    ctx.strokeStyle = style.main;
    ctx.fillStyle = style.soft;
    ctx.globalAlpha = .35 + Math.max(attack, skill) * .45;
    ctx.lineWidth = 1.5 + skill;
    ctx.beginPath(); ctx.arc(18 + attack * 7, 0, 5 + attack * 4, 0, Math.PI * 2); ctx.fill();
    if (skill > .01) {
      ctx.beginPath(); ctx.arc(0, 0, 20 + (1 - skill) * 8, 0, Math.PI * 2); ctx.stroke();
      ctx.rotate(Math.PI / 4); ctx.strokeRect(-10, -10, 20, 20);
    }
  } else {
    ctx.strokeStyle = style.soft;
    ctx.globalAlpha = .35 + Math.max(attack, skill) * .5;
    ctx.lineWidth = 1.8;
    const reach = 20 + attack * 9 + skill * 8;
    ctx.beginPath(); ctx.moveTo(-7, -12); ctx.lineTo(reach, 9); ctx.moveTo(-5, 11); ctx.lineTo(reach - 2, -8); ctx.stroke();
    if (skill > .01) {
      ctx.strokeStyle = style.main; ctx.globalAlpha *= .55;
      ctx.beginPath(); ctx.moveTo(-18 - (1-skill)*12, -9); ctx.lineTo(8, 0); ctx.moveTo(-24 - (1-skill)*9, 8); ctx.lineTo(5, 1); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawShadow(px, py, rx, ry) {
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function drawCrown(px, py, w) {
  const h = w * .55;
  ctx.fillStyle = '#e0b34d';
  ctx.strokeStyle = '#8a6a20';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px - w / 2, py);
  ctx.lineTo(px - w / 2, py - h * .55);
  ctx.lineTo(px - w / 6, py - h * .2);
  ctx.lineTo(px, py - h);
  ctx.lineTo(px + w / 6, py - h * .2);
  ctx.lineTo(px + w / 2, py - h * .55);
  ctx.lineTo(px + w / 2, py);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}
function drawStairs(px, py, now) {
  ctx.fillStyle = '#04060b';
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  for (let i = 1; i <= 3; i++) {
    ctx.strokeStyle = `rgba(150,160,185,${.16 - i * .04})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 2 + i * 2.6, py + 2 + i * 2.6, TILE - 4 - i * 5.2, TILE - 4 - i * 5.2);
  }
  const a = .30 + .18 * Math.sin(now * 2.5);
  const g = ctx.createRadialGradient(px + TILE / 2, py + TILE / 2, 1, px + TILE / 2, py + TILE / 2, TILE * .55);
  g.addColorStop(0, `rgba(224,179,77,${a})`);
  g.addColorStop(1, 'rgba(224,179,77,0)');
  ctx.fillStyle = g;
  ctx.fillRect(px, py, TILE, TILE);
}
function drawTorch(px, py, now) {
  const cx = px + TILE / 2, cy = py + TILE * .62;
  seg(ctx, cx, cy + 8, cx, cy - 2, '#5a4632', 3.5);
  ell(ctx, cx, cy - 3, 2.5, 2, '#3a2c1e');
  const f = Math.sin(now * 9 + px) * 1.2;
  ell(ctx, cx, cy - 7 + f * .4, 3.2, 4.6, 'rgba(255,140,50,.9)');
  ell(ctx, cx, cy - 6.5, 1.8, 2.8, 'rgba(255,220,120,.95)');
}
function drawEntity(e, spr, size, now) {
  const [lox, loy] = lungeOff(e);
  const bob = Math.sin(now * 2.6 + e.x * 7 + e.y * 5) * 1.3;
  const px = e.fx * TILE + TILE / 2 + lox;
  const py = e.fy * TILE + TILE / 2 + bob + loy;
  drawShadow(e.fx * TILE + TILE / 2, e.fy * TILE + TILE - 4, size * .3, size * .11);
  ctx.drawImage(spr.img, px - size / 2, py - size / 2, size, size);
  if (e.hurtT > 0) {
    ctx.globalAlpha = Math.min(1, e.hurtT);
    ctx.drawImage(spr.white, px - size / 2, py - size / 2, size, size);
    ctx.globalAlpha = 1;
  }
  if ((e.armorBreakCharge || 0) > 0) {
    ctx.save();
    ctx.strokeStyle = '#e0a73a';
    ctx.lineWidth = 2;
    ctx.globalAlpha = .9;
    ctx.beginPath();
    ctx.arc(px, py, size * .58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f2d27b';
    ctx.font = `bold ${Math.max(14, Math.round(size * .42))}px "Segoe UI",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', px, py - size * .72);
    ctx.restore();
  }
  return [px, py];
}
function drawAtlasEntity(e, image, index, cols, rows, width, height, now) {
  const [lox, loy] = lungeOff(e);
  const bob = Math.sin(now * 2.6 + e.x * 7 + e.y * 5) * 1.3;
  const px = e.fx * TILE + TILE / 2 + lox;
  const py = e.fy * TILE + TILE / 2 + bob + loy;
  const sw = image.naturalWidth / cols, sh = image.naturalHeight / rows;
  const sx = (index % cols) * sw, sy = Math.floor(index / cols) * sh;
  drawShadow(e.fx * TILE + TILE / 2, e.fy * TILE + TILE - 4, width * .3, height * .09);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, sx, sy, sw, sh, px - width / 2, py - height / 2, width, height);
  if (e.hurtT > 0) {
    ctx.globalAlpha = Math.min(.75, e.hurtT);
    ctx.strokeStyle = '#fff3dd';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(width, height) * .43, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  return [px, py];
}
function equippedRarity(slot) {
  const item = player && player.equip && player.equip[slot];
  return item ? clamp(Number(item.rarity) || 0, 0, RARITIES.length - 1) : -1;
}
function drawEquippedHero(now) {
  const heroIndex = ['warrior', 'ranger', 'mage', 'assassin'].indexOf(classId);
  if (!imageReady(heroAtlasV11) || heroIndex < 0) {
    return drawEntity(player, SPRITES[heroSpriteKeyFor(classId)] || SPRITES.hero, 30, now);
  }
  const equipped = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet']
    .map(slot => equippedRarity(slot)).filter(r => r >= 0);
  const best = equipped.length ? Math.max(...equipped) : -1;
  const cx = player.fx * TILE + TILE / 2, cy = player.fy * TILE + TILE / 2;
  if (best >= 1) {
    const color = RARITIES[best].color;
    ctx.save();
    ctx.globalAlpha = .2 + best * .045 + .06 * Math.sin(now * 4);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 + best * .35;
    ctx.beginPath(); ctx.ellipse(cx, cy + TILE * .34, 15 + best, 5 + best * .25, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  const pos = drawAtlasEntity(player, heroAtlasV11, heroIndex, 4, 1, 43, 52, now);
  const px = pos[0], py = pos[1];
  ctx.save();
  ctx.lineCap = 'round';
  const weaponRarity = equippedRarity('weapon');
  if (weaponRarity >= 0) {
    ctx.strokeStyle = RARITIES[weaponRarity].color;
    ctx.globalAlpha = .72;
    ctx.lineWidth = 1.5 + weaponRarity * .3;
    ctx.beginPath();
    if (classId === 'ranger') ctx.arc(px, py - 2, 18, -.85, .85);
    else if (classId === 'mage') { ctx.moveTo(px + 12, py - 18); ctx.lineTo(px + 16, py + 15); }
    else { ctx.moveTo(px + 8, py + 12); ctx.lineTo(px + 19, py - 13); }
    ctx.stroke();
  }
  const armorRarity = equippedRarity('armor');
  if (armorRarity >= 0) {
    ctx.fillStyle = RARITIES[armorRarity].color;
    ctx.globalAlpha = .72;
    ctx.fillRect(px - 16, py - 7, 3, 7); ctx.fillRect(px + 13, py - 7, 3, 7);
  }
  const helmetRarity = equippedRarity('helmet');
  if (helmetRarity >= 0) {
    ctx.fillStyle = RARITIES[helmetRarity].color;
    ctx.globalAlpha = .84;
    ctx.beginPath(); ctx.moveTo(px - 4, py - 19); ctx.lineTo(px, py - 25); ctx.lineTo(px + 4, py - 19); ctx.fill();
  }
  const charmRarity = Math.max(equippedRarity('ring'), equippedRarity('amulet'));
  if (charmRarity >= 2) {
    ctx.fillStyle = RARITIES[charmRarity].color;
    ctx.globalAlpha = .55 + .25 * Math.sin(now * 5);
    ctx.beginPath(); ctx.arc(px, py - 3, 2 + charmRarity * .35, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  return pos;
}
function guardianArtIndex(m) {
  if (!m || !m.midBoss) return -1;
  const byName = MID_BOSSES.findIndex(b => b.name === m.name);
  if (byName >= 0) return byName;
  const byDepth = MID_BOSSES.findIndex(b => b.depth === depth);
  return byDepth;
}
function drawMonsterV11(m, now) {
  if (m.boss && imageReady(finalBossV11))
    return { pos: drawAtlasEntity(m, finalBossV11, 0, 1, 1, 72, 78, now), size: 78, bespoke: true };
  const guardianIndex = guardianArtIndex(m);
  if (guardianIndex >= 0 && imageReady(guardianAtlasV11))
    return { pos: drawAtlasEntity(m, guardianAtlasV11, guardianIndex, 3, 3, 62, 66, now), size: 66, bespoke: true };
  const monsterIndex = MONSTER_ART_INDEX[m.sprite];
  if (monsterIndex !== undefined && imageReady(monsterAtlasV11)) {
    const size = m.elite ? 40 : 35;
    return { pos: drawAtlasEntity(m, monsterAtlasV11, monsterIndex, 4, 4, size, size + 3, now), size: size + 3, bespoke: true };
  }
  const size = (m.boss || m.midBoss) ? 54 : 30;
  const spr = SPRITES[m.sprite] || SPRITES.demon;
  return { pos: drawEntity(m, spr, size, now), size, bespoke: false };
}
function drawLootIcon(id, px, py, size) {
  if (!id || !lootAtlas.complete || lootAtlas.naturalWidth < 4) return false;
  const p = lootCoord(id);
  const cell = lootAtlas.naturalWidth / 4;
  ctx.drawImage(lootAtlas, p.x * cell, p.y * cell, cell, cell,
    px - size / 2, py - size / 2, size, size);
  return true;
}
function drawMinimap() {
  if (!mctx || !map || !player) return;
  const cw = mini.width, ch = mini.height;
  const tw = cw / MAP_W, th = ch / MAP_H;
  mctx.fillStyle = '#070504';
  mctx.fillRect(0, 0, cw, ch);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (!explored[y][x]) continue;
      if (map[y][x] === WALL) mctx.fillStyle = '#3a2c22';
      else if (map[y][x] === STAIRS) mctx.fillStyle = '#e0b34d';
      else mctx.fillStyle = visible[y][x] ? '#6a5a48' : '#2a221c';
      mctx.fillRect(x * tw, y * th, tw, th);
    }
  }
  mctx.fillStyle = '#7dd87d';
  for (const n of npcs) {
    if (explored[n.y][n.x]) mctx.fillRect(n.x * tw, n.y * th, tw, th);
  }
  mctx.fillStyle = '#6fa9df';
  for (const it of items) {
    if (explored[it.y] && explored[it.y][it.x]) mctx.fillRect(it.x * tw, it.y * th, tw, th);
  }
  mctx.fillStyle = '#cf4c3f';
  for (const m of monsters) {
    if (visible[m.y] && visible[m.y][m.x]) mctx.fillRect(m.x * tw, m.y * th, tw, th);
  }
  mctx.fillStyle = '#f2d27b';
  mctx.fillRect(player.x * tw, player.y * th, tw, th);
}
function draw(now) {
  if (!player || !map) return;
  const T = texFor(depth);
  ctx.save();
  if (trauma > 0 && state === 'playing' && !reducedMotion) {
    const sh = trauma * trauma;
    ctx.translate((vfx() * 2 - 1) * sh * 7, (vfx() * 2 - 1) * sh * 7);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000';
  ctx.fillRect(-4, -4, canvas.width + 8, canvas.height + 8);
  ctx.save();
  ctx.translate(-view.x * TILE, -view.y * TILE);

  const torches = [];
  for (let y = view.y; y < view.y + view.rows; y++) {
    for (let x = view.x; x < view.x + view.cols; x++) {
      if (!explored[y][x]) continue;
      const px = x * TILE, py = y * TILE;
      const t = map[y][x];
      if (t === WALL) {
        ctx.drawImage(T.wall, px, py);
        if (y + 1 < MAP_H && map[y + 1][x] !== WALL) {
          ctx.fillStyle = 'rgba(0,0,0,.38)';
          ctx.fillRect(px, py + TILE - 7, TILE, 7);
        }
        if (visible[y][x] && y + 1 < MAP_H && map[y + 1][x] !== WALL &&
            (x * 13 + y * 7) % 9 === 0) {
          torches.push([px, py, x * 3.1 + y]);
          drawTorch(px, py, now);
        }
      } else {
        ctx.drawImage(T.floors[(x * 7 + y * 13) % 4], px, py);
        if (y > 0 && map[y - 1][x] === WALL) {
          ctx.fillStyle = 'rgba(0,0,0,.30)'; ctx.fillRect(px, py, TILE, 9);
          ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(px, py, TILE, 4);
        }
        if (x > 0 && map[y][x - 1] === WALL) {
          ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(px, py, 6, TILE);
        }
        if (t === STAIRS) drawStairs(px, py, now);
      }
      if (!visible[y][x]) {
        ctx.fillStyle = 'rgba(2,3,6,.78)';
        ctx.fillRect(px, py, TILE, TILE);
      }
    }
  }

  ctx.globalAlpha = .6;
  for (const d of decals) {
    if (!explored[d.y][d.x] || !visible[d.y][d.x]) continue;
    ctx.save();
    ctx.translate(d.x * TILE + TILE / 2, d.y * TILE + TILE / 2);
    ctx.rotate(d.rot);
    ctx.drawImage(SPLATS[d.v], -16, -16);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  for (const t of traps || []) {
    if (!t.armed || !visible[t.y] || !visible[t.y][t.x]) continue;
    const near = Math.abs(t.x - player.x) + Math.abs(t.y - player.y) <= 1;
    if (!near && !floorCleared) continue;
    const px = t.x * TILE, py = t.y * TILE;
    ctx.strokeStyle = 'rgba(224,167,63,.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 8, py + 8, TILE - 16, TILE - 16);
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 10); ctx.lineTo(px + TILE - 10, py + TILE - 10);
    ctx.moveTo(px + TILE - 10, py + 10); ctx.lineTo(px + 10, py + TILE - 10);
    ctx.stroke();
  }
  for (const s of secrets || []) {
    if (s.revealed || !explored[s.y] || !explored[s.y][s.x]) continue;
    const near = Math.abs(s.x - player.x) + Math.abs(s.y - player.y) <= 1;
    if (!near) continue;
    const px = s.x * TILE, py = s.y * TILE;
    ctx.strokeStyle = 'rgba(242,210,123,.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 6, py + 8); ctx.lineTo(px + 14, py + 18); ctx.lineTo(px + 10, py + 26);
    ctx.stroke();
  }

  for (const n of npcs) {
    if (!visible[n.y][n.x]) continue;
    const spr = n.type === 'shrine' ? SPRITES.shrine
      : n.type === 'rest' ? SPRITES.camp
      : SPRITES.merchant;
    drawEntity(n, spr || SPRITES.merchant, 30, now);
  }

  for (const it of items) {
    if (!visible[it.y][it.x]) continue;
    const iconId = it.type === 'equip' ? it.item.icon : it.type === 'chest' ? null : it.icon;
    const key = it.type === 'equip' ? it.item.spr
      : it.type === 'amulet' ? 'heart'
      : it.type === 'chest' ? 'chest'
      : it.type === 'key' ? 'gold'
      : it.type;
    const spr = SPRITES[key];
    if (!spr && !iconId) continue;
    const bob = Math.sin(now * 2.4 + it.x * 3 + it.y * 5) * 1.6;
    const px = it.x * TILE + TILE / 2, py = it.y * TILE + TILE / 2 + bob;
    drawShadow(px, it.y * TILE + TILE - 4, 7, 2.6);
    if (it.type === 'cask') {
      const by = it.y * TILE + TILE / 2 + bob * 0.6;
      ctx.fillStyle = '#6b4a2e';
      ctx.fillRect(px - 9, by - 8, 18, 14);
      ctx.fillStyle = '#4a301c';
      ctx.fillRect(px - 9, by - 5, 18, 3);
      ctx.fillRect(px - 9, by + 3, 18, 3);
      ctx.fillStyle = '#8a6a44';
      ctx.beginPath();
      ctx.ellipse(px, by - 8, 9, 3, 0, Math.PI, 0);
      ctx.fill();
      continue;
    }
    if (it.type === 'equip') {
      const glow = .45 + .3 * Math.sin(now * 4 + it.x);
      ctx.strokeStyle = RARITIES[it.item.rarity].color;
      ctx.globalAlpha = Math.max(.15, glow);
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 12, it.y * TILE + 4, 24, 24);
      ctx.globalAlpha = 1;
    }
    if (it.type === 'amulet') {
      const g2 = ctx.createRadialGradient(px, py, 2, px, py, TILE);
      g2.addColorStop(0, 'rgba(255,120,90,.35)');
      g2.addColorStop(1, 'rgba(255,120,90,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(px - TILE, py - TILE, TILE * 2, TILE * 2);
    }
    if (it.type === 'chest' && spr) {
      ctx.drawImage(spr.img, px - 12, py - 12, 24, 24);
    } else if (!drawLootIcon(iconId, px, py, 24) && spr) {
      ctx.drawImage(spr.img, px - 11, py - 11, 22, 22);
    }
  }

  for (const m of monsters) {
    if (!visible[m.y][m.x]) continue;
    const baseSize = (m.boss || m.midBoss) ? 66 : (m.elite ? 40 : 35);
    if (m.elite || m.boss || m.midBoss) {
      const c = m.boss ? 'rgba(255,90,60,' : 'rgba(224,179,77,';
      ctx.strokeStyle = c + (0.35 + 0.25 * Math.sin(now * 4)).toFixed(2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(m.fx * TILE + TILE / 2, m.fy * TILE + TILE - 4, baseSize * .34, baseSize * .12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    const drawn = drawMonsterV11(m, now);
    const [px, py] = drawn.pos, size = drawn.size;
    if (m.elite && !m.boss && !m.midBoss) drawCrown(px, py - size / 2 - 3, size * .42);
    if (m.hp < m.maxHp) {
      const bw = (m.boss || m.midBoss) ? TILE + 8 : TILE - 6;
      const bx = px - bw / 2, by = m.fy * TILE + 1;
      ctx.fillStyle = '#300'; ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = m.boss ? '#f80' : '#d33';
      ctx.fillRect(bx, by, bw * Math.max(0, m.hp) / m.maxHp, 4);
    }
  }

  drawEquippedHero(now);
  drawClassCombatFx(now);

  ctx.strokeStyle = '#f2e3ad';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const a of arrows) {
    const k = Math.min(1, a.t / a.dur);
    const ax = a.x0 + (a.x1 - a.x0) * k;
    const ay = a.y0 + (a.y1 - a.y0) * k;
    const ang = Math.atan2(a.y1 - a.y0, a.x1 - a.x0);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
    ctx.moveTo(2, -3); ctx.lineTo(7, 0); ctx.lineTo(2, 3);
    ctx.stroke();
    ctx.restore();
  }

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  ctx.globalCompositeOperation = 'lighter';
  for (const [tx, ty, seed] of torches) {
    const fl = .8 + .2 * Math.sin(now * 9 + seed * 7);
    const cx2 = tx + TILE / 2, cy2 = ty + TILE * .45;
    const g2 = ctx.createRadialGradient(cx2, cy2, 4, cx2, cy2, TILE * 2.8 * fl);
    g2.addColorStop(0, 'rgba(255,150,60,.16)');
    g2.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(cx2 - TILE * 3, cy2 - TILE * 3, TILE * 6, TILE * 6);
  }
  const plx = player.fx * TILE + TILE / 2, ply = player.fy * TILE + TILE / 2;
  const g3 = ctx.createRadialGradient(plx, ply, TILE, plx, ply, TILE * 4.2);
  g3.addColorStop(0, 'rgba(255,214,150,.10)');
  g3.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = g3;
  ctx.fillRect(plx - TILE * 4.5, ply - TILE * 4.5, TILE * 9, TILE * 9);
  ctx.globalCompositeOperation = 'source-over';

  const lg = ctx.createRadialGradient(plx, ply, TILE * 2, plx, ply, TILE * (FOV_R + 1.6));
  lg.addColorStop(0, 'rgba(0,0,0,0)');
  lg.addColorStop(1, 'rgba(0,0,0,.5)');
  ctx.fillStyle = lg;
  ctx.fillRect(-4, -4, canvas.width + 8, canvas.height + 8);

  ctx.font = 'bold 15px "Segoe UI",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const f of floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  const vg = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * .35,
    canvas.width / 2, canvas.height / 2, canvas.width * .62);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(-4, -4, canvas.width + 8, canvas.height + 8);
  ctx.restore();
  drawMinimap();
}

let lastT = 0, rafId = null;
function scheduleFrame() {
  if (rafId === null && !document.hidden) rafId = raf(frame);
}
function frame(t) {
  rafId = null;
  const dt = Math.min(.05, (t - lastT) / 1000 || 0);
  lastT = t;
  if (hitstop > 0) {
    hitstop -= dt;
    draw(t / 1000);
    scheduleFrame();
    return;
  }
  const lerp = e => {
    e.fx += (e.x - e.fx) * Math.min(1, dt * 14);
    e.fy += (e.y - e.fy) * Math.min(1, dt * 14);
    if (e.lungeT > 0) e.lungeT = Math.max(0, e.lungeT - dt * 5);
    if (e.hurtT > 0) e.hurtT = Math.max(0, e.hurtT - dt * 4);
  };
  if (classSkillFxT > 0) classSkillFxT = Math.max(0, classSkillFxT - dt * (reducedMotion ? 4 : 2.2));
  if (player) lerp(player);
  for (const m of monsters || []) lerp(m);
  for (const n of npcs || []) lerp(n);
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.y -= dt * 28; f.life -= dt * 1.2;
    if (f.life <= 0) floaters.splice(i, 1);
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.t += dt;
    if (a.t >= a.dur) arrows.splice(i, 1);
  }
  if (trauma > 0) trauma = Math.max(0, trauma - dt * 1.6);
  draw(t / 1000);
  scheduleFrame();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (rafId !== null) caf(rafId);
    rafId = null;
    if (state === 'playing') persistRun();
  } else {
    lastT = 0;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    scheduleFrame();
  }
});

function updateHud() {
  if (!player || !$('st-depth')) return;
  $('st-depth').textContent = player && player.echoMode ? depth + '∞' : depth;
  const themeEl = $('st-theme');
  if (themeEl) themeEl.textContent = ' · ' + (THEMES[themeIdx(depth)] ? visibleWorldName(THEMES[themeIdx(depth)].name) : '');
  $('st-hptext').textContent = `${Math.max(0, player.hp)}/${pMaxHp()}`;
  $('st-hpfill').style.width = Math.max(0, player.hp / pMaxHp() * 100) + '%';
  const lowHp = state === 'playing' && player.hp > 0 && player.hp / pMaxHp() <= 0.25;
  $('lowhp-vignette').classList.toggle('hidden', !lowHp);
  $('st-lvl').textContent = player.lvl;
  $('st-xp').textContent = `(${player.xp}/${PROGRESSION_RULES.xpThreshold(player.lvl)})`;
  $('st-atk').textContent = pAtk();
  $('st-def').textContent = pDef();
  $('st-crit').textContent = pCrit() + '%';
  $('st-gold').textContent = player.gold;
  $('st-potion').textContent = player.potions;
  $('st-scroll').textContent = player.scrolls;
  if ($('st-key')) $('st-key').textContent = player.keys || 0;
  if ($('st-escape')) $('st-escape').textContent = greedyMode ? (player.escapes || 0) : '—';
  if ($('st-mobs')) {
    const mobsEl = $('st-mobs');
    const bossHere = monsters && monsters.some(m => m.boss || m.midBoss);
    mobsEl.textContent = (monsters ? monsters.length : 0) + (bossHere ? ' ⚑' : '');
    mobsEl.classList.toggle('boss-here', !!bossHere);
  }
  const skEl = $('st-skill');
  if (skEl) {
    if (player.skillCd > 0) {
      skEl.textContent = ui(`${player.skillCd}回合`, `CD ${player.skillCd}`);
      skEl.className = 'cd';
    } else {
      skEl.textContent = classDef().skill.name;
      skEl.className = 'ready';
    }
  }
  const onStairs = map && map[player.y][player.x] === STAIRS;
  const shopHere = npcAt(player.x + (player.facing ? player.facing[0] : 0), player.y + (player.facing ? player.facing[1] : 0));
  $('hint').classList.toggle('active', onStairs);
  $('hint').textContent = onStairs
    ? (canDescendNow() ? ui(`> Enter 下潜 · J 快速下潜（${quickDiveCost(depth, QUICK_DIVE_STEP)} G 直坠 ${QUICK_DIVE_STEP} 层）`, '> Press Enter to descend') : ui('> 击败本层首领才能离开。','> Defeat the floor guardian before leaving.'))
    : shopHere && shopHere.type === 'shop'
      ? ui('> 撞向商人即可交易','> Walk into the merchant to trade')
      : shopHere && shopHere.type === 'shrine'
        ? ui('> 撞向神龛即可祈祷','> Walk into the shrine to pray')
        : shopHere && shopHere.type === 'rest'
          ? ui('> 撞向营地即可包扎','> Walk into the camp to rest')
          : ui('> 站在楼梯上按 Enter 下潜 · 点击已探索地块移动 · C 技能','> Stand on the stairs and press Enter to descend · click explored tiles to move · J Attack · K Skill');
  const fab = $('descend-fab');
  if (fab) fab.classList.toggle('hidden', !(onStairs && canDescendNow() && state === 'playing'));
  const qfab = $('quickdive-fab');
  if (qfab) qfab.classList.toggle('hidden', !(onStairs && canDescendNow() && state === 'playing'));
}

function loadBest() {
  try {
    const raw = JSON.parse(localStorage.getItem('de-best'));
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const clean = {};
    for (const key of ['bestDepth', 'bestGold', 'bestKills', 'bestLvl']) {
      const n = Number(raw[key]);
      if (Number.isFinite(n) && n >= 0) clean[key] = Math.floor(n);
    }
    return clean;
  }
  catch (e) { return {}; }
}
function saveBest() {
  const b = loadBest();
  b.bestDepth = Math.max(b.bestDepth || 0, depth);
  b.bestGold = Math.max(b.bestGold || 0, player.gold);
  b.bestKills = Math.max(b.bestKills || 0, player.kills);
  b.bestLvl = Math.max(b.bestLvl || 0, player.lvl);
  try { localStorage.setItem('de-best', JSON.stringify(b)); } catch (e) { /* 忽略 */ }
}
function bestText() {
  const b = loadBest();
  return ui(
    `历史最深：<b>${b.bestDepth || 0}</b> 层 · 历史最高等级：<b>${b.bestLvl || 1}</b> · 历史最多击杀：<b>${b.bestKills || 0}</b> · 历史最多金币：<b>${b.bestGold || 0}</b>`,
    `Deepest: <b>${b.bestDepth || 0}</b> · Highest Level: <b>${b.bestLvl || 1}</b> · Most Kills: <b>${b.bestKills || 0}</b> · Most Gold: <b>${b.bestGold || 0}</b>`);
}
function showOverlay(kind, bodyHtml) {
  const title = $('ov-title');
  title.textContent = kind === 'dead' ? ui('你死了','You Died') : ui('胜利！','Victory!');
  title.className = kind;
  $('ov-body').innerHTML = bodyHtml;
  $('overlay').classList.remove('hidden');
}
function hideOverlay() { $('overlay').classList.add('hidden'); }

function persistRun() {
  if (!player || (state !== 'playing' && state !== 'town')) return;
  const blob = {
    version: SAVE_VERSION,
    mode: greedyMode ? RUN_MODE_GREEDY : RUN_MODE_CLASSIC,
    profileId: PROFILE_ID,
    seed: RUN_SEED,
    rng: rngFn.getState(),
    classId,
    depth, turns, state,
    player: JSON.parse(JSON.stringify(player)),
    map, explored,
    monsters: monsters.map(m => ({ ...m })),
    items, npcs, shopStock, traps, secrets, floorCleared,
    decals: [...decals],
    logLines: logLines.slice(0, 12),
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(blob)); } catch (e) { /* 忽略 */ }
}
function peekRun() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!raw || raw.version !== SAVE_VERSION) return null;
    if (raw.profileId !== PROFILE_ID) return null;
    // 模式隔离：贪婪存档不能在经典模式下继续，反之亦然；旧存档视为经典
    const blobMode = raw.mode || RUN_MODE_CLASSIC;
    if (blobMode !== (greedyMode ? RUN_MODE_GREEDY : RUN_MODE_CLASSIC)) return null;
    if (raw.state !== 'playing' && raw.state !== 'town') return null;
    if (raw.state === 'town' && blobMode !== RUN_MODE_GREEDY) return null;
    return raw;
  } catch (e) { return null; }
}
function clearRun() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 忽略 */ }
}
function restoreRun(raw) {
  buildSprites();
  classId = raw.classId in CLASSES ? raw.classId : 'warrior';
  setSeed(raw.seed);
  rngFn.setState(raw.rng);
  depth = raw.depth; turns = raw.turns; state = 'playing';
  player = raw.player;
  map = raw.map; explored = raw.explored;
  monsters = raw.monsters || []; items = raw.items || []; npcs = raw.npcs || [];
  shopStock = raw.shopStock || [];
  traps = raw.traps || []; secrets = raw.secrets || [];
  floorCleared = !!raw.floorCleared;
  decals.length = 0;
  (raw.decals || []).forEach(d => decals.push(d));
  logLines = raw.logLines || [];
  visible = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  buildThemeTex(depth);
  hideOverlay();
  hideUi('title-screen'); hideUi('class-screen'); hideUi('pause-screen'); hideUi('shop-screen');
  hideUi('talent-screen'); hideUi('shrine-screen'); hideUi('echo-screen');
  applyViewport();
  computeFov();
  if ((!monsters || monsters.length === 0) && (!items || items.length === 0) && !isFinalFloor()) {
    ensureFloorContent([{ x: 1, y: 1, w: MAP_W - 2, h: MAP_H - 2 }]);
    msg(ui('空荡的回响被重新填满了。','The empty echo fills with danger again.'), 'good');
  }
  renderBag(); renderEquip(); updateHud();
  const logEl = $('log');
  if (logEl) logEl.innerHTML = logLines
    .map(l => `<div${l.cls ? ` class="${esc(l.cls)}"` : ''}>${esc(l.text)}</div>`).join('');
  if (raw.state === 'town') {
    // 贪婪远征：存档停在城镇——直接回到城镇界面
    if (!greedyMode) {
      clearRun();
      state = 'title';
      showTitle();
      return;
    }
    meta = sanitizeMeta(loadMeta() || defaultMeta(classId));
    saveMeta();
    state = 'town';
    showTown();
    return;
  }
  msg(ui('你从火堆旁醒来，记忆尚未散尽。','You wake beside the fire with your memories intact.'), 'good');
}

// 弹窗打开期间锁定页面滚动，防止背景画布跟着滚动条上下摆动
const UI_SCREENS = ['title-screen', 'class-screen', 'pause-screen', 'shop-screen',
  'talent-screen', 'shrine-screen', 'echo-screen', 'town-screen', 'achv-screen', 'help-screen',
  'overlay'];
function syncUiLock() {
  const open = UI_SCREENS.some(id => { const el = $(id); return el && !el.classList.contains('hidden'); });
  const de = document.documentElement;
  if (de && de.classList) de.classList.toggle('ui-lock', open);
}
function hideUi(id) { const el = $(id); if (el) el.classList.add('hidden'); syncUiLock(); }
function showUi(id) { const el = $(id); if (el) el.classList.remove('hidden'); syncUiLock(); }

function refreshTitle() {
  const save = peekRun();
  const cont = $('btn-continue');
  const metaEl = $('save-meta');
  if (cont) cont.classList.toggle('hidden', !save);
  if (metaEl) {
    const modeTag = greedyMode ? ui('贪婪远征','Greedy Expedition') : ui('经典回响','Classic Echo');
    const savedClass = CLASSES[save && save.classId]?.name || ui('冒险者','Adventurer');
    metaEl.textContent = save
      ? ui(`存档（${modeTag}）：${savedClass} · 第 ${save.depth} 层 · 等级 ${save.player.lvl}`,
        `Save (${modeTag}): ${savedClass} · Floor ${save.depth} · Level ${save.player.lvl}`)
      : ui(`尚无中途存档（${modeTag}）。下楼、暂停或离开页面时会自动写入。`,
        `No active save (${modeTag}). Progress is saved when descending, pausing, or leaving the page.`);
  }
  document.querySelectorAll('.depth-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.profile === PROFILE_ID);
  });
  const gbtn = $('btn-greedy');
  if (gbtn) {
    gbtn.textContent = greedyMode ? ui('贪婪远征：开','Greedy Expedition: On') : ui('贪婪远征：关','Greedy Expedition: Off');
    gbtn.classList.toggle('active', greedyMode);
    gbtn.setAttribute('aria-pressed', String(greedyMode));
  }
}
function showTitle() {
  state = 'title';
  hideUi('class-screen'); hideUi('pause-screen'); hideUi('shop-screen'); hideOverlay();
  showUi('title-screen');
  refreshTitle();
}
function showClassSelect() {
  hideUi('title-screen');
  showUi('class-screen');
  const grid = $('class-grid');
  if (!grid) return;
  grid.innerHTML = Object.values(CLASSES).map(c => `
    <button type="button" class="class-card" data-class="${c.id}">
      <span class="class-portrait" aria-hidden="true"></span>
      <span class="class-card-copy">
        <h3>${esc(c.name)}</h3>
        <p>${esc(c.blurb)}</p>
        <span class="stats">${ui(`生命 ${c.hpBase} · 攻击 ${c.atkBase} · 药水 ${c.potions} · 卷轴 ${c.scrolls}<br>技能：${esc(c.skill.name)}（冷却 ${c.skill.cd}）<br>${esc(c.skill.desc)}`, `HP ${c.hpBase} · ATK ${c.atkBase} · Potions ${c.potions} · Scrolls ${c.scrolls}<br>Skill: ${esc(c.skill.name)} (CD ${c.skill.cd})<br>${esc(c.skill.desc)}`)}</span>
      </span>
    </button>`).join('');
}

function openShop() {
  if (state !== 'playing') return;
  state = 'shop';
  sfx.shop();
  renderShop();
  showUi('shop-screen');
}
function visibleShopRowName(row) {
  if (!row) return '';
  if (row.item) return visibleItemName(row.item);
  if (row.id === 'escape') return ui('回城卷轴（按 T 回镇）','Return Scroll (T: return to town)');
  if (row.id === 'heal') return ui('包扎伤口（回满）','Bandage Wounds (full heal)');
  if (row.id === 'equip') return ui('精选装备','Featured Gear');
  return visibleWorldName(row.name);
}
function renderShop() {
  const goldEl = $('shop-gold');
  if (goldEl) goldEl.textContent = ui(`金币 ${player.gold}`, `Gold ${player.gold}`);
  const list = $('shop-list');
  if (!list) return;
  list.innerHTML = shopStock.map((row, i) => `
    <div class="shop-row">
      <span>${esc(visibleShopRowName(row))}</span>
      <b>${row.price} G</b>
      <button type="button" data-buy="${i}">${ui('购买','Buy')}</button>
    </div>`).join('');
}
function buyShop(i) {
  const row = shopStock[i];
  if (!row) return;
  if (player.gold < row.price) { msg(ui('金币不够。','Not enough Gold.'), 'bad'); return; }
  if (row.kind === 'equip' && player.inv.length >= BAG_CAP) { msg(ui('背包已满。','Backpack full.')); return; }
  player.gold -= row.price;
  if (row.kind === 'potion') player.potions++;
  else if (row.kind === 'scroll') player.scrolls++;
  else if (row.kind === 'escape') player.escapes = (player.escapes || 0) + 1;
  else if (row.kind === 'key') player.keys++;
  else if (row.kind === 'heal') { player.hp = pMaxHp(); player.poison = 0; }
  else if (row.kind === 'equip') {
    player.inv.push(row.item);
    shopStock.splice(i, 1);
    renderBag();
  }
  sfx.pickup();
  msg(ui(`你买下了【${row.name}】。`, `You bought [${row.item ? visibleItemName(row.item) : visibleWorldName(row.name)}].`), 'gold');
  renderShop(); updateHud(); persistRun();
}
function closeShop() {
  hideUi('shop-screen');
  state = 'playing';
  persistRun();
}
function closeShrine() {
  hideUi('shrine-screen');
  shrineTarget = null;
  state = 'playing';
}

// ================= 贪婪远征：城镇 / 回城 / 元进度 =================
function syncMetaFromPlayer(died) {
  if (!player) return;
  meta.lvl = player.lvl; meta.xp = player.xp;
  meta.hpBase = player.hpBase; meta.atkBase = player.atkBase;
  meta.critBase = player.critBase || 0; meta.leechBase = player.leechBase || 0;
  meta.skillHaste = player.skillHaste || 0; meta.goldFind = player.goldFind || 0;
  meta.flatDr = player.flatDr || 0;
  meta.thornsBase = player.thornsBase || 0; meta.regenBase = player.regenBase || 0;
  meta.potionBoost = player.potionBoost || 0; meta.critPower = player.critPower || 0;
  meta.grivResist = player.grivResist || 0; meta.plunder = player.plunder || 0;
  meta.fastRegen = player.fastRegen ? 1 : 0;
  meta.totalKills = (meta.totalKills || 0);
  meta.talents = (player.talents || []).slice();
  meta.potions = player.potions; meta.scrolls = player.scrolls;
  meta.keys = player.keys || 0; meta.escapes = player.escapes || 0;
  meta.equip = JSON.parse(JSON.stringify(player.equip));
  if (died === 'insured') {
    // 保险符结算：同步消耗品与穿戴，但保留背包；随身金币不入账（坠入深渊）
    meta.bag = JSON.parse(JSON.stringify(player.inv));
    meta.deaths = (meta.deaths || 0) + 1;
  }
  else if (died) { meta.bag = []; meta.deaths = (meta.deaths || 0) + 1; }
  else {
    meta.bag = JSON.parse(JSON.stringify(player.inv));
    // 回城结算：随身金币存入金库（死亡则全部丢失，不入账）
    meta.gold = (meta.gold || 0) + (player.gold || 0);
  }
}
// ================= 远征录：统计 + 成就 =================
const ACHV = [
  { id: 'first_run', name: '初次远征', desc: '出发进行一次贪婪远征', test: m => (m.runs || 0) >= 1 },
  { id: 'depth_10', name: '深入地底', desc: '到达第 10 层', test: m => (m.bestDepth || 0) >= 10 },
  { id: 'depth_30', name: '地底行者', desc: '到达第 30 层', test: m => (m.bestDepth || 0) >= 30 },
  { id: 'depth_60', name: '深渊旅人', desc: '到达第 60 层', test: m => (m.bestDepth || 0) >= 60 },
  { id: 'depth_100', name: '百层勇者', desc: '到达第 100 层', test: m => (m.bestDepth || 0) >= 100 },
  { id: 'kills_100', name: '屠戮者', desc: '累计击杀 100 个敌人', test: m => (m.totalKills || 0) >= 100 },
  { id: 'kills_500', name: '千斩万剐', desc: '累计击杀 500 个敌人', test: m => (m.totalKills || 0) >= 500 },
  { id: 'rich', name: '富甲一方', desc: '金库单次持有 1000 金币', test: m => (m.gold || 0) >= 1000 },
  { id: 'wheel_10', name: '回响赌徒', desc: '转盘累计抽奖 10 次', test: m => (m.wheelTotal || 0) >= 10 },
  { id: 'deaths_5', name: '死神常客', desc: '远征中死亡 5 次', test: m => (m.deaths || 0) >= 5 },
  { id: 'legend', name: '传说收藏家', desc: '装备过一件传说装备', test: m => !!m.gotLegend },
  { id: 'win', name: '心之归途', desc: '带走地牢之心（任意档位通关）', test: m => (m.wins || 0) >= 1 },
];
function checkAchv() {
  if (!meta) return [];
  const newly = [];
  for (const a of ACHV) {
    if (!meta.achv[a.id] && a.test(meta)) {
      meta.achv[a.id] = 1;
      newly.push(a);
      msg(ui(`成就达成：【${a.name}】——${a.desc}。`, `Achievement unlocked: [${a.name}] — ${a.desc}.`), 'gold');
    }
  }
  if (newly.length) sfx.levelup();
  return newly;
}
function renderAchv() {
  if (!meta) return;
  checkAchv();
  const statsEl = $('achv-stats');
  if (statsEl) statsEl.innerHTML = [
    [ui('最深到达','Deepest Floor'), ui(`${meta.bestDepth || 0} 层`, `Floor ${meta.bestDepth || 0}`)],
    [ui('远征次数','Expeditions'), `${meta.runs || 0}`],
    [ui('通关次数','Wins'), `${meta.wins || 0}`],
    [ui('累计击杀','Total Kills'), `${meta.totalKills || 0}`],
    [ui('死亡次数','Deaths'), `${meta.deaths || 0}`],
    [ui('金库金币','Vault Gold'), `${meta.gold || 0} G`],
    [ui('转盘总抽数','Wheel Spins'), `${meta.wheelTotal || 0}`],
  ].map(([k, v]) => `<div class="shop-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  const gridEl = $('achv-grid');
  if (gridEl) gridEl.innerHTML = ACHV.map(a => {
    const got = !!meta.achv[a.id];
    return `<div class="class-card achv-card${got ? '' : ' achv-locked'}">` +
      `<h3>${got ? '🏆' : '🔒'} ${esc(a.name)}</h3><p>${esc(a.desc)}</p></div>`;
  }).join('');
}
function enterTown() {
  state = 'town';
  checkAchv();
  meta.bestDepth = Math.max(meta.bestDepth || 0, depth);
  ensureWheel();
  saveMeta();
  persistRun();
  showTown();
}
function showTown() {
  hideOverlay();
  hideUi('title-screen'); hideUi('class-screen'); hideUi('pause-screen');
  hideUi('shop-screen'); hideUi('talent-screen'); hideUi('shrine-screen'); hideUi('echo-screen');
  showUi('town-screen');
  renderTown();
  ensureTownLoop();
}
// ================= 幸运转盘（城镇金币回收站） =================
// 8 个奖品槽在进镇时生成、随元档持久化；抽奖随机开一槽，重置则重摇全部槽位。
// 抽奖费与重置费都随本轮使用次数递增——金币越滚越贵，纯度极高的回收池。
// 死亡（含保险符结算）后计数归零、轮盘重摇：死神的怜悯，也防止无限膨胀。
const WHEEL_SLOTS = 8;
const WHEEL_BASE_SPIN = 40, WHEEL_SPIN_STEP = 20;
const WHEEL_BASE_RESET = 60, WHEEL_RESET_STEP = 40;
const wheelDepth = () => Math.max(3, meta ? (meta.bestDepth || 0) : 0);
const spinCost = () => WHEEL_BASE_SPIN + (meta && meta.wheelSpins || 0) * WHEEL_SPIN_STEP;
const resetWheelCost = () => WHEEL_BASE_RESET + (meta && meta.wheelResets || 0) * WHEEL_RESET_STEP;
function genWheelSlot() {
  const bd = wheelDepth();
  // v2 平衡奖池：装备合计仅 5%（稀有≥2 的 4% + 史诗≥3 的 1%）——
  // 转盘不能取代下地牢搏装备；药水 9%；空门 35% 让赌博有真实的刺。
  const pool = [
    { w: 24, make: () => ({ kind: 'gold', amount: ri(12, 22) + bd * 2 }) },
    { w: 5,  make: () => ({ kind: 'gold', amount: ri(60, 90) + bd * 6 }) },
    { w: 9,  make: () => ({ kind: 'potion' }) },
    { w: 9,  make: () => ({ kind: 'scroll' }) },
    { w: 6,  make: () => ({ kind: 'key' }) },
    { w: 5,  make: () => ({ kind: 'escape' }) },
    { w: 4,  make: () => ({ kind: 'equip', item: genEquip(bd, 2) }) },
    { w: 1,  make: () => ({ kind: 'equip', item: genEquip(bd, 3) }) },
    { w: 2,  make: () => ({ kind: 'insurance' }) },
    { w: 35, make: () => ({ kind: 'nothing' }) },
  ];
  const total = pool.reduce((s, o) => s + o.w, 0);
  let roll = rng() * total;
  for (const o of pool) { roll -= o.w; if (roll <= 0) return o.make(); }
  return { kind: 'nothing' };
}
const rollWheelSlots = () => Array.from({ length: WHEEL_SLOTS }, genWheelSlot);
const ensureWheel = () => {
  if (!meta) return;
  if (!Array.isArray(meta.wheelSlots) || meta.wheelSlots.length !== WHEEL_SLOTS)
    meta.wheelSlots = rollWheelSlots();
};
function wheelSlotText(s) {
  switch (s.kind) {
    case 'gold': return `${s.amount} G`;
    case 'potion': return ui('治疗药水','Healing Potion');
    case 'scroll': return ui('传送卷轴','Teleport Scroll');
    case 'key': return ui('锈蚀钥匙','Rusty Key');
    case 'escape': return ui('回城卷轴','Return Scroll');
    case 'insurance': return ui('保险符','Insurance Charm');
    case 'equip': return ui(`${visibleItemName(s.item)} ${s.item.score}分`, `${visibleItemName(s.item)} · Score ${s.item.score}`);
    default: return ui('空门','Empty');
  }
}
function applyWheelPrize(p) {
  switch (p.kind) {
    case 'gold':
      meta.gold += p.amount;
      msg(ui(`转出 ${p.amount} 金币，直接入账金库！`, `Won ${p.amount} Gold, deposited directly into the vault!`), 'gold');
      break;
    case 'potion': meta.potions++; msg(ui('转出一瓶治疗药水。','Won a Healing Potion.'), 'good'); break;
    case 'scroll': meta.scrolls++; msg(ui('转出一张传送卷轴。','Won a Teleport Scroll.'), 'good'); break;
    case 'key': meta.keys++; msg(ui('转出一把锈蚀钥匙。','Won a Rusty Key.'), 'good'); break;
    case 'escape': meta.escapes++; msg(ui('转出一张回城卷轴！','Won a Return Scroll!'), 'gold'); break;
    case 'insurance': meta.insurance = (meta.insurance || 0) + 1; msg(ui('转出一张保险符！','Won an Insurance Charm!'), 'gold'); break;
    case 'equip': {
      const it = p.item;
      if (meta.bag.length < BAG_CAP) { meta.bag.push(it); msg(ui(`转出装备【${it.name}】(${it.score} 分)，放进背包。`, `Won [${visibleItemName(it)}] (Score ${it.score}); sent to backpack.`), 'good'); }
      else { meta.stash.push(it); msg(ui(`背包已满，【${it.name}】直接寄存进仓库。`, `Backpack full; [${visibleItemName(it)}] was sent directly to the stash.`), 'good'); }
      break;
    }
    default: msg(ui('空门……回响今天不想理你。','Empty slot… the Echo ignores you today.'), 'bad');
  }
}
function spinWheel() {
  if (state !== 'town' || !meta) return;
  ensureWheel();
  const cost = spinCost();
  if (meta.gold < cost) { msg(ui(`金库金币不够——抽奖需要 ${cost} G。`, `Not enough vault Gold — spinning costs ${cost} G.`), 'bad'); return; }
  meta.gold -= cost;
  const idx = rnd(WHEEL_SLOTS);
  const prize = meta.wheelSlots[idx];
  meta.wheelSpins++;
  meta.wheelTotal = (meta.wheelTotal || 0) + 1;
  sfx.chest();
  msg(ui(`轮盘停在第 ${idx + 1} 槽——`, `The wheel stops on slot ${idx + 1} —`), 'info');
  applyWheelPrize(prize);
  startWheelSpin(idx);
  saveMeta(); renderTown();
}
function resetWheel() {
  if (state !== 'town' || !meta) return;
  const cost = resetWheelCost();
  if (meta.gold < cost) { msg(ui(`金库金币不够——重置轮盘需要 ${cost} G。`, `Not enough vault Gold — resetting costs ${cost} G.`), 'bad'); return; }
  meta.gold -= cost;
  meta.wheelResets++;
  meta.wheelSlots = rollWheelSlots();
  sfx.skill();
  msg(ui(`轮盘已重摇（第 ${meta.wheelResets} 次），看看新的八格。`, `Wheel reset ${meta.wheelResets} times. Check the new eight slots.`), 'info');
  startWheelKick();
  saveMeta(); renderTown();
}

// ---- 转盘视图：真正的圆盘 + 指针 + 缓动旋转（纯视觉层，结算保持同步） ----
const SECTOR_A = Math.PI * 2 / WHEEL_SLOTS;
const SECTOR_COLORS = {
  gold: '#8a5a20', potion: '#3f6b52', scroll: '#3d566e', key: '#4a4438',
  escape: '#50648a', insurance: '#6b4356', equip: '#7a3b52', nothing: '#241810',
};
function wheelSlotShort(s) {
  switch (s.kind) {
    case 'gold': return `${s.amount}G`;
    case 'potion': return ui('药水','Potion');
    case 'scroll': return ui('卷轴','Scroll');
    case 'key': return ui('钥匙','Key');
    case 'escape': return ui('回城','Return');
    case 'insurance': return ui('保险符','Insurance');
    case 'equip': {
      const name = visibleItemName(s.item);
      return name.length > 8 ? name.slice(0, 7) + '…' : name;
    }
    default: return ui('空门','Empty');
  }
}
let wheelBusy = false;
const wheelView = { angle: -SECTOR_A / 2, anim: null, lastWin: -1, winUntil: 0 };
function wheelCtxOf() {
  const cv = $('wheel-canvas');
  return cv && cv.getContext ? cv.getContext('2d') : null;
}
function drawWheel(now) {
  const ctx = wheelCtxOf();
  if (!ctx || !meta || !Array.isArray(meta.wheelSlots)) return;
  const W = 240, cx = W / 2, cy = W / 2, R = W / 2 - 10;
  if (wheelView.anim) {
    const an = wheelView.anim;
    const k = Math.min(1, (now - an.t0) / an.dur);
    wheelView.angle = an.from + (an.to - an.from) * (1 - Math.pow(1 - k, 3));
    if (k >= 1) {
      wheelView.lastWin = an.idx; wheelView.winUntil = now + 1600;
      wheelView.anim = null; wheelBusy = false; renderTown();
    }
  }
  ctx.clearRect(0, 0, W, W);
  ctx.beginPath(); ctx.arc(cx, cy, R + 5, 0, Math.PI * 2);
  ctx.fillStyle = '#120c09'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#8b6835'; ctx.stroke();
  for (let i = 0; i < WHEEL_SLOTS; i++) {
    const s = meta.wheelSlots[i];
    const a0 = -Math.PI / 2 + i * SECTOR_A + wheelView.angle, a1 = a0 + SECTOR_A;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
    ctx.fillStyle = SECTOR_COLORS[s.kind] || '#333'; ctx.fill();
    if (i % 2) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fill(); }
    if (i === wheelView.lastWin && now < wheelView.winUntil) {
      ctx.fillStyle = `rgba(242,210,123,${(.45 + .35 * Math.sin(now / 110)).toFixed(2)})`; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#f2d27b'; ctx.stroke();
    }
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(a0 + SECTOR_A / 2);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = s.kind === 'nothing' ? '#8d7f6b' : '#ffe9bd';
    ctx.fillText(wheelSlotShort(s), R - 10, 0);
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#2b1e14'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#8b6835'; ctx.stroke();
  // 指针固定在顶部，不随盘转动
  ctx.beginPath();
  ctx.moveTo(cx - 8, 4); ctx.lineTo(cx + 8, 4); ctx.lineTo(cx, 22); ctx.closePath();
  ctx.fillStyle = '#f2d27b'; ctx.fill();
}
function startWheelSpin(idx) {
  const cur = wheelView.angle;
  const target = -(idx + 0.5) * SECTOR_A;
  let delta = ((target - cur) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  delta += Math.PI * 2 * 4; // 至少四整圈再减速
  // 用元进度做确定性抖动，避免每次都停在扇区正中
  const jit = (((meta.wheelTotal * 37 + meta.wheelSpins * 11) % 100) / 100 - .5) * SECTOR_A * .5;
  wheelView.anim = { t0: performance.now(), dur: 3300, from: cur, to: cur + delta + jit, idx };
  wheelBusy = true;
}
function startWheelKick() {
  wheelView.lastWin = -1;
  const cur = wheelView.angle;
  wheelView.anim = { t0: performance.now(), dur: 620, from: cur, to: cur + Math.PI * 1.5, idx: -1 };
  wheelBusy = true;
}

// ---- 城镇场景：夜色小镇横幅（星空/远山/五座功能建筑/灯火/篝火动画） ----
let townStars = null;
let townRafId = 0;
function townTierForArt() {
  const best = Math.max(1, Number(meta && meta.bestDepth) || 1);
  return clamp(Math.ceil(best / 10), 1, 10);
}
function drawTownGrowthVisual(ctx, now, W, H, G) {
  const tier = townTierForArt();
  const glow = .72 + .22 * Math.sin(now / 260);
  for (let i = 0; i < tier; i++) {
    const x = 42 + i * ((W - 84) / 9);
    ctx.strokeStyle = 'rgba(70,52,36,.9)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, 11); ctx.lineTo(x, 25 + (i % 2) * 4); ctx.stroke();
    ctx.fillStyle = `rgba(255,181,74,${glow.toFixed(2)})`;
    ctx.fillRect(x - 3, 24 + (i % 2) * 4, 6, 8);
  }
  const people = Math.max(1, Math.floor(tier / 2));
  for (let i = 0; i < people; i++) {
    const x = W * .25 + i * Math.min(86, W * .1);
    const y = G + 8 + (i % 2) * 5;
    ctx.fillStyle = 'rgba(13,10,12,.82)';
    ctx.beginPath(); ctx.arc(x, y - 9, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 3, y - 6, 6, 12);
  }
  if (tier >= 4) {
    ctx.fillStyle = 'rgba(133,49,42,.9)';
    ctx.beginPath(); ctx.moveTo(W * .49, 18); ctx.lineTo(W * .56, 25); ctx.lineTo(W * .49, 45); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d7a640'; ctx.stroke();
  }
  if (tier >= 7) {
    const rg = ctx.createRadialGradient(W * .51, H * .58, 2, W * .51, H * .58, 34);
    rg.addColorStop(0, `rgba(145,105,255,${(.2 + .08 * Math.sin(now / 420)).toFixed(2)})`);
    rg.addColorStop(1, 'rgba(90,55,180,0)');
    ctx.fillStyle = rg; ctx.fillRect(W * .47, H * .38, W * .08, H * .38);
  }
  ctx.fillStyle = 'rgba(8,6,8,.72)';
  ctx.fillRect(10, 10, 128, 25);
  ctx.strokeStyle = 'rgba(224,167,64,.52)'; ctx.strokeRect(10.5, 10.5, 127, 24);
  ctx.font = '600 12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f2d27b';
  ctx.fillText(ui(`回响小镇 · 阶段 ${tier}`, `Echo Town · Tier ${tier}`), 20, 23);
}
function drawTownScene(now) {
  const cv = $('town-scene');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const W = cv.width || 900, H = cv.height || 210;
  const G = H * .78;
  if (imageReady(townBackdropV11)) {
    const iw = townBackdropV11.naturalWidth, ih = townBackdropV11.naturalHeight;
    const sh = Math.min(ih, iw * H / W);
    const sy = Math.max(0, Math.min(ih - sh, ih * .31));
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(townBackdropV11, 0, sy, iw, sh, 0, 0, W, H);
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, 'rgba(5,8,20,.08)'); shade.addColorStop(.7, 'rgba(5,4,8,.03)'); shade.addColorStop(1, 'rgba(5,3,4,.36)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
    drawTownGrowthVisual(ctx, now, W, H, G);
    drawTownFire(ctx, now, G);
    ctx.restore();
    return;
  }
  if (!townStars) {
    townStars = [];
    for (let i = 0; i < 46; i++) townStars.push({
      x: Math.random(), y: Math.random() * .42,
      r: Math.random() * 1.3 + .5, tw: Math.random() * 6,
    });
  }
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0b0916'); sky.addColorStop(.7, '#191022'); sky.addColorStop(1, '#241724');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  for (const st of townStars) {
    ctx.globalAlpha = .35 + .55 * Math.abs(Math.sin(now / 900 + st.tw));
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(st.x * W, st.y * H, st.r, st.r);
  }
  ctx.globalAlpha = 1;
  // 月
  ctx.beginPath(); ctx.arc(W * .86, H * .2, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#e9dfc2'; ctx.fill();
  ctx.beginPath(); ctx.arc(W * .86 + 7, H * .2 - 4, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(18,13,28,.9)'; ctx.fill();
  // 远山剪影
  ctx.fillStyle = '#140d18';
  ctx.beginPath(); ctx.moveTo(0, H * .62);
  ctx.lineTo(W * .12, H * .34); ctx.lineTo(W * .26, H * .58);
  ctx.lineTo(W * .42, H * .3); ctx.lineTo(W * .58, H * .6);
  ctx.lineTo(W * .74, H * .36); ctx.lineTo(W * .9, H * .58); ctx.lineTo(W, H * .44);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  // 街道
  ctx.fillStyle = '#1a120c'; ctx.fillRect(0, G, W, H - G);
  ctx.fillStyle = 'rgba(255,220,170,.05)';
  for (let x = 8; x < W; x += 26) ctx.fillRect(x, G + 8 + (x % 3) * 4, 12, 3);
  drawTownBuildings(ctx, now, W, H, G);
  drawTownGrowthVisual(ctx, now, W, H, G);
  drawTownFire(ctx, now, G);
}
function drawTownBuildings(ctx, now, W, H, G) {
  // 五座建筑与下方功能区一一对应：仓库 / 锻造 / 市集 / 客栈(出发) / 转盘
  const bw = (W - 60) / 5;
  const bld = [
    { n: ui('仓库','Stash'), c: '#3a3230', roof: '#57453a', h: 74 },
    { n: ui('锻造','Forge'), c: '#33261d', roof: '#6b3b28', h: 66, forge: true },
    { n: ui('市集','Market'), c: '#3d3226', roof: '#7a5a2c', h: 58, stall: true },
    { n: ui('客栈','Inn'), c: '#38291f', roof: '#5f4732', h: 84, lantern: true },
    { n: ui('转盘','Wheel'), c: '#2f2333', roof: '#5a3a63', h: 62, tent: true },
  ];
  bld.forEach((b, bi) => {
    const bx = 30 + bi * bw + 8, w = bw - 16, by = G - b.h;
    if (b.tent) {
      ctx.beginPath(); ctx.moveTo(bx - 4, G);
      ctx.quadraticCurveTo(bx + w / 2, by - 26, bx + w + 4, G); ctx.closePath();
      ctx.fillStyle = b.c; ctx.fill();
      ctx.strokeStyle = b.roof; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx + w / 2, by + 4, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#8a5a20'; ctx.fill();
      ctx.strokeStyle = '#f2d27b'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + w / 2 - 8, by + 4); ctx.lineTo(bx + w / 2 + 8, by + 4);
      ctx.moveTo(bx + w / 2, by - 4); ctx.lineTo(bx + w / 2, by + 12);
      ctx.stroke();
    } else if (b.stall) {
      ctx.fillStyle = b.c; ctx.fillRect(bx, by + 16, w, b.h - 16);
      for (let sx = 0; sx < w; sx += 12) {
        ctx.fillStyle = (sx / 12) % 2 ? '#8a4a2c' : '#d7c9a8';
        ctx.fillRect(bx + sx, by, Math.min(12, w - sx), 12);
      }
      ctx.fillStyle = '#241a12'; ctx.fillRect(bx + 4, by + 30, w - 8, 9);
      ctx.fillStyle = '#6b8a4a'; ctx.fillRect(bx + 9, by + 25, 8, 6);
      ctx.fillStyle = '#a64a3a'; ctx.fillRect(bx + 21, by + 25, 8, 6);
      ctx.fillStyle = '#8a6a2a'; ctx.fillRect(bx + 33, by + 25, 8, 6);
    } else {
      ctx.fillStyle = b.c; ctx.fillRect(bx, by, w, b.h);
      ctx.fillStyle = b.roof;
      ctx.beginPath(); ctx.moveTo(bx - 5, by); ctx.lineTo(bx + w / 2, by - 18); ctx.lineTo(bx + w + 5, by);
      ctx.closePath(); ctx.fill();
      [[bx + 8, by + 16], [bx + w - 17, by + 16], [bx + 8, by + 40]].forEach((wn, wi) => {
        const fl = .68 + .32 * Math.sin(now / 260 + bi * 2 + wi * 1.3);
        ctx.fillStyle = `rgba(242,196,96,${fl.toFixed(2)})`;
        ctx.fillRect(wn[0], wn[1], 9, 11);
        ctx.strokeStyle = 'rgba(0,0,0,.4)';
        ctx.strokeRect(wn[0] + .5, wn[1] + .5, 9, 11);
      });
      ctx.fillStyle = '#1c130c'; ctx.fillRect(bx + w / 2 - 8, G - 22, 16, 22);
      if (b.forge) {
        ctx.fillStyle = '#2a201a'; ctx.fillRect(bx + w - 14, by - 34, 10, 36);
        for (let sp = 0; sp < 3; sp++) {
          const sy = (now / 7 + sp * 21) % 46;
          ctx.globalAlpha = 1 - sy / 46;
          ctx.fillStyle = '#ff9d5c';
          ctx.fillRect(bx + w - 11 + Math.sin(now / 300 + sp) * 4, by - 38 - sy, 3, 3);
        }
        ctx.globalAlpha = 1;
      }
      if (b.lantern) {
        ctx.strokeStyle = '#57453a';
        ctx.beginPath(); ctx.moveTo(bx + w - 6, by + 2); ctx.lineTo(bx + w + 2, by + 12); ctx.stroke();
        const fl = .7 + .3 * Math.sin(now / 320 + bi);
        ctx.fillStyle = `rgba(255,170,70,${fl.toFixed(2)})`;
        ctx.fillRect(bx + w - 2, by + 12, 8, 10);
      }
    }
    ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#9b8d78';
    ctx.fillText(b.n, bx + w / 2, G + 3);
  });
}
function drawTownFire(ctx, now, G) {
  // 前景篝火（市集与客栈之间）
  const fx = W0_FIRE.x, fy = G + 14;
  const glow = ctx.createRadialGradient(fx, fy, 2, fx, fy, 46);
  glow.addColorStop(0, 'rgba(255,150,60,.28)'); glow.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = glow; ctx.fillRect(fx - 46, fy - 42, 92, 62);
  ctx.fillStyle = '#4a3423';
  ctx.fillRect(fx - 10, fy - 2, 20, 4); ctx.fillRect(fx - 4, fy - 6, 8, 10);
  for (let f = 0; f < 3; f++) {
    const fh = 12 + 6 * Math.sin(now / 130 + f * 2.1) - f * 3;
    ctx.fillStyle = ['#ff9d3c', '#ffcf6a', '#ff7a3c'][f];
    ctx.beginPath();
    ctx.moveTo(fx - 6 + f * 2, fy - 2);
    ctx.quadraticCurveTo(fx + Math.sin(now / 190 + f) * 4, fy - 4 - fh, fx + 6 - f * 2, fy - 2);
    ctx.closePath(); ctx.fill();
  }
}
const W0_FIRE = { x: 430 };
function townFrame(now) {
  townRafId = 0;
  if (state !== 'town') return;
  try { drawTownScene(now || 0); drawWheel(now || 0); } catch (e) { /* 绘制异常不阻塞游戏 */ }
  townRafId = requestAnimationFrame(townFrame);
}
function ensureTownLoop() {
  if (!townRafId && state === 'town') townRafId = requestAnimationFrame(townFrame);
}


function renderTown() {
  if (!meta) return;
  const head = $('town-head');
  const clsName = CLASSES[meta.classId] ? CLASSES[meta.classId].name : ui('冒险者','Adventurer');
  if (head) head.textContent = ui(
    `${clsName} · 等级 ${meta.lvl} · 金库 ${meta.gold} G · 最深 ${meta.bestDepth || 0} 层 · 远征 ${meta.runs || 0} 次`,
    `${clsName} · Level ${meta.lvl} · Vault ${meta.gold} G · Deepest Floor ${meta.bestDepth || 0} · Expeditions ${meta.runs || 0}`);
  const growth = $('town-growth');
  if (growth) {
    const tier = townTierForArt();
    const next = tier >= 10
      ? ui('小镇已完成最终扩建','Town expansion complete')
      : ui(`再征服第 ${tier * 10} 层守卫，进入阶段 ${tier + 1}`, `Defeat the Floor ${tier * 10} guardian to reach Tier ${tier + 1}`);
    const ready = (meta.potions || 0) >= 2 && (meta.escapes || 0) >= 1;
    growth.innerHTML =
      `<div><b>${ui(`城镇阶段 ${tier}/10`, `Town Tier ${tier}/10`)}</b><span>${next}</span></div>` +
      `<div class="town-readiness ${ready ? 'ready' : 'warn'}"><b>${ready ? ui('远征整备完成','Expedition Ready') : ui('补给仍有缺口','Supplies Missing')}</b>` +
      `<span>${ui(`药水 ${meta.potions || 0} · 回城卷轴 ${meta.escapes || 0} · 钥匙 ${meta.keys || 0}`, `Potions ${meta.potions || 0} · Return Scrolls ${meta.escapes || 0} · Keys ${meta.keys || 0}`)}</span></div>` +
      `<div><b>${ui('本阶段设施','Current Facilities')}</b><span>${ui('安全仓库 · 限量市集 · 锻造强化 · 已征服区出发','Safe Stash · Limited Market · Forge Upgrades · Conquered-Depth Departures')}</span></div>`;
  }
  const itemTag = it => {
    const f = it.forge || 0;
    const forgeTag = f ? ` +${f}` : '';
    return `${esc(visibleItemName(it))}${forgeTag}<small>${ui(`${it.score} 分`, `Score ${it.score}`)}</small>`;
  };
  const tradeBtns = (where, i, it) => {
    const fc = forgeCost(it);
    const maxed = (it.forge || 0) >= FORGE_MAX;
    return `<span class="row-actions">` +
      `<button type="button" data-forge="${where}:${i}"${(maxed || meta.gold < fc) ? ' disabled' : ''}` +
      ` title="${maxed ? ui('已至 +5 极致','Maxed at +5') : ui(`强化到 +${(it.forge || 0) + 1}，需 ${fc} G`, `Forge to +${(it.forge || 0) + 1} for ${fc} G`)}">${ui('强化','Forge')}</button>` +
      `<button type="button" data-sell="${where}:${i}" title="${ui(`出售得 ${sellPrice(it)} G`, `Sell for ${sellPrice(it)} G`)}">${ui(`卖 ${sellPrice(it)}G`, `Sell ${sellPrice(it)}G`)}</button>` +
      `</span>`;
  };
  const bagEl = $('town-bag');
  if (bagEl) bagEl.innerHTML =
    (meta.bag.length
      ? meta.bag.map((it, i) =>
        `<div class="town-row"><span>${itemTag(it)}</span>` +
        `<span class="row-actions"><button type="button" data-deposit="${i}">${ui('存入','Store')}</button>${tradeBtns('bag', i, it)}</span></div>`).join('')
      : `<p class="dim-note">${ui('背包空空如也。下潜搜刮，或从仓库取出。','Backpack empty. Explore the dungeon or withdraw gear from the stash.')}</p>`) +
    (meta.bag.length
      ? `<div class="town-row"><span></span><span class="row-actions"><button type="button" data-depositall="1">${ui('全部存入仓库','Store All')}</button></span></div>`
      : '');
  const stashEl = $('town-stash');
  if (stashEl) stashEl.innerHTML = meta.stash.length
    ? meta.stash.map((it, i) =>
      `<div class="town-row"><span>${itemTag(it)}</span>` +
      `<span class="row-actions"><button type="button" data-withdraw="${i}"${meta.bag.length >= BAG_CAP ? ' disabled' : ''}>${ui('取出','Withdraw')}</button>${tradeBtns('stash', i, it)}</span></div>`).join('')
    : `<p class="dim-note">${ui('仓库是空的。把装备「存入」这里，死亡也夺不走。','The stash is empty. Store gear here to keep it safe from death.')}</p>`;
  const shopEl = $('town-shop');
  if (shopEl) shopEl.innerHTML = [
    { id: 'potion', name: ui(`治疗药水 ×1（带 ${meta.potions}）`, `Healing Potion ×1 (carrying ${meta.potions})`), price: SHOP.potionPrice },
    { id: 'escape', name: ui(`回城卷轴 ×1（带 ${meta.escapes}）`, `Return Scroll ×1 (carrying ${meta.escapes})`), price: SHOP.escapePrice || 26 },
    { id: 'key', name: ui(`锈蚀钥匙 ×1（带 ${meta.keys}）`, `Rusty Key ×1 (carrying ${meta.keys})`), price: SHOP.keyPrice },
    { id: 'insurance', name: ui(`保险符 ×1 死亡保背包（带 ${meta.insurance || 0}）`, `Insurance Charm ×1 · protects backpack on death (carrying ${meta.insurance || 0})`), price: SHOP.insurancePrice || 120 },
  ].map(r =>
    `<div class="shop-row"><span>${esc(r.name)}</span><b>${r.price} G</b>` +
    `<button type="button" data-townbuy="${r.id}"${meta.gold < r.price ? ' disabled' : ''}>${ui('购买','Buy')}</button></div>`).join('');
  const wheelEl = $('town-wheel');
  if (wheelEl) {
    ensureWheel();
    const sc = spinCost(), rc = resetWheelCost();
    wheelEl.innerHTML =
      '<canvas id="wheel-canvas" width="240" height="240"></canvas>' +
      `<p class="dim-note wheel-hint">${ui('转盘停在哪格，就开哪格——空门也是命运。','The wheel opens the slot it lands on — Empty is part of the odds.')}</p>` +
      `<div class="row-actions"><button type="button" data-wheelspin="1"${(meta.gold < sc || wheelBusy) ? ' disabled' : ''}` +
      ` title="${ui(`转动轮盘，下一抽 ${sc} G`, `Spin the wheel for ${sc} G`)}">${ui(`抽奖 ${sc} G`, `Spin ${sc} G`)}</button>` +
      `<button type="button" data-wheelreset="1"${(meta.gold < rc || wheelBusy) ? ' disabled' : ''}` +
      ` title="${ui(`重摇全部八格，需 ${rc} G`, `Reroll all eight slots for ${rc} G`)}">${ui(`重置轮盘 ${rc} G`, `Reset Wheel ${rc} G`)}</button></div>`;
  }
}
function depositStash(i) {
  if (state !== 'town' || !meta) return;
  const it = meta.bag[i];
  if (!it) return;
  meta.bag.splice(i, 1);
  meta.stash.push(it);
  sfx.pickup();
  msg(ui(`【${it.name}】已存入仓库。死亡也夺不走仓库里的东西。`, `[${visibleItemName(it)}] stored safely. Death cannot take stash items.`), 'good');
  saveMeta(); renderTown();
}
function depositAllBag() {
  if (state !== 'town' || !meta) return;
  const n = meta.bag.length;
  if (!n) { msg(ui('背包里没有可存入的装备。','No backpack gear to store.')); return; }
  while (meta.bag.length) meta.stash.push(meta.bag.pop());
  sfx.chest();
  msg(ui(`已把 ${n} 件装备全部存入仓库。`, `Stored all ${n} items in the stash.`), 'gold');
  saveMeta(); renderTown();
}
function sellItem(where, i) {
  if (state !== 'town' || !meta) return;
  const arr = where === 'stash' ? meta.stash : meta.bag;
  const it = arr[i];
  if (!it) return;
  const g = sellPrice(it);
  arr.splice(i, 1);
  meta.gold += g;
  sfx.pickup();
  msg(ui(`卖出了【${it.name}】，入账 ${g} 金币。`, `Sold [${visibleItemName(it)}] for ${g} Gold.`), 'gold');
  saveMeta(); renderTown();
}
function forgeItem(where, i) {
  if (state !== 'town' || !meta) return;
  const arr = where === 'stash' ? meta.stash : meta.bag;
  const it = arr[i];
  if (!it) return;
  const lvl = it.forge || 0;
  if (lvl >= FORGE_MAX) { msg(ui('这件装备已经强化到极致（+5）。','This item is already maxed at +5.')); return; }
  const cost = forgeCost(it);
  if (meta.gold < cost) {
    msg(ui(`金库金币不够——强化到 +${lvl + 1} 需要 ${cost} G。去地牢里再搜刮一番！`, `Not enough vault Gold — forging to +${lvl + 1} costs ${cost} G.`), 'bad');
    return;
  }
  meta.gold -= cost;
  it.forge = lvl + 1;
  const [k, v] = FORGE_MAIN[it.slot] || ['hp', 2];
  it.stats = it.stats || {};
  it.stats[k] = (it.stats[k] || 0) + v;
  it.score = eqScoreOf(it.stats);
  sfx.levelup();
  msg(ui(`锻造成功！【${it.name}】强化至 +${it.forge}，花费 ${cost} G。`, `Forge success! [${visibleItemName(it)}] reached +${it.forge} for ${cost} G.`), 'epic');
  saveMeta(); renderTown();
}
function withdrawStash(i) {
  if (state !== 'town' || !meta) return;
  if (meta.bag.length >= BAG_CAP) { msg(ui('背包已满，先存点东西进去。','Backpack full — store something first.')); return; }
  const it = meta.stash.splice(i, 1)[0];
  if (!it) return;
  meta.bag.push(it);
  sfx.pickup();
  msg(ui(`【${it.name}】已从仓库取出。`, `[${visibleItemName(it)}] withdrawn from the stash.`), 'good');
  saveMeta(); renderTown();
}
function buyTown(id) {
  if (state !== 'town' || !meta) return;
  const prices = { potion: SHOP.potionPrice, escape: SHOP.escapePrice || 26, key: SHOP.keyPrice, insurance: SHOP.insurancePrice || 120 };
  const price = prices[id];
  if (!price) return;
  if (meta.gold < price) { msg(ui('金库里的金币不够。','Not enough Gold in the vault.'), 'bad'); return; }
  meta.gold -= price;
  if (id === 'potion') meta.potions++;
  else if (id === 'escape') meta.escapes++;
  else if (id === 'key') meta.keys++;
  else if (id === 'insurance') meta.insurance = (meta.insurance || 0) + 1;
  sfx.pickup();
  saveMeta(); renderTown();
}
function initGreedyRun(chosen) {
  classId = CLASSES[chosen] ? chosen : (meta && meta.classId) || 'warrior';
  meta = sanitizeMeta(loadMeta() || defaultMeta(classId));
  if (meta.classId !== classId) {
    // 换职业开新档：保留金库，其余重置
    const keepGold = meta.gold;
    meta = defaultMeta(classId);
    meta.gold = keepGold;
  }
  saveMeta();
  departTown();
}
function departTown() {
  if (!greedyMode || !meta) return;
  buildSprites();
  depth = 1; turns = 0; state = 'playing';
  buildThemeTex(depth);
  player = {
    x: 0, y: 0, fx: 0, fy: 0,
    hpBase: meta.hpBase,
    atkBase: meta.atkBase,
    lvl: meta.lvl, xp: meta.xp,
    gold: 0,
    potions: meta.potions, scrolls: meta.scrolls,
    keys: meta.keys || 0, escapes: meta.escapes || 0,
    inv: JSON.parse(JSON.stringify(meta.bag)),
    equip: JSON.parse(JSON.stringify(meta.equip)),
    lungeT: 0, hurtT: 0, ldx: 0, ldy: 0,
    facing: [1, 0], skillCd: 0, poison: 0,
    critBase: meta.critBase || 0, leechBase: meta.leechBase || 0,
    skillHaste: meta.skillHaste || 0, goldFind: meta.goldFind || 0,
    flatDr: meta.flatDr || 0,
    thornsBase: meta.thornsBase || 0, regenBase: meta.regenBase || 0,
    potionBoost: meta.potionBoost || 0, critPower: meta.critPower || 0,
    grivResist: meta.grivResist || 0, plunder: meta.plunder || 0,
    fastRegen: !!meta.fastRegen,
    talents: (meta.talents || []).slice(),
    echoMode: false,
  };
  // 注意：pMaxHp 读取全局 player，必须在 player 赋值完成之后再计算生命
  player.hp = pMaxHp();
  meta.runs = (meta.runs || 0) + 1;
  // 每次远征使用独立派生种子，保证同一次数可复现
  setSeed('greedy-' + PROFILE_ID + '-' + classId + '-' + meta.runs);
  saveMeta();
  logLines = []; floaters.length = 0; particles.length = 0; selectedBagIndex = -1;
  hideOverlay();
  hideUi('title-screen'); hideUi('class-screen'); hideUi('pause-screen'); hideUi('shop-screen');
  hideUi('talent-screen'); hideUi('shrine-screen'); hideUi('echo-screen'); hideUi('town-screen');
  genLevel();
  applyViewport();
  computeFov();
  msg(fmtText(runText('intro')));
  msg(ui(`第 ${meta.runs} 次下潜：搜刮战利品，用回城卷轴（T）把一切平安带回小镇——死在这里就会失去背包和金币！`, `Descent ${meta.runs}: loot what you can, then use Return Scroll (T) to bring it safely back to town — dying here loses your backpack and carried Gold!`), 'gold');
  msg(ui(`本层有 ${monsters.length} 个敌人、${items.length} 处物资。`, `This floor has ${monsters.length} enemies and ${items.length} loot spots.`), 'good');
  renderBag(); renderEquip(); updateHud();
  persistRun();
}
function useEscape() {
  if (!greedyMode || state !== 'playing') return;
  if ((player.escapes || 0) <= 0) {
    msg(ui('没有回城卷轴了——镇上商店有售，中层守卫也会掉落。','No Return Scrolls left — buy one in town or defeat a deep guardian.'), 'bad');
    return;
  }
  player.escapes--;
  const banked = player.gold;
  syncMetaFromPlayer(false);
  enterTown();
  msg(ui(`你撕开回城卷轴，平安回到小镇。${banked} 金币落入金库。`, `You tear open a Return Scroll and reach town safely. ${banked} Gold enters the vault.`), 'gold');
}
function greedyDeathReturn(lostInv, lostGold) {
  syncMetaFromPlayer(true);
  meta.wheelSpins = 0; meta.wheelResets = 0; meta.wheelSlots = null;
  enterTown();
  msg(ui(`你倒在第 ${depth} 层……失去了背包里的 ${lostInv} 件物品和随身 ${lostGold} 金币。`, `You fell on Floor ${depth} and lost ${lostInv} backpack items and ${lostGold} carried Gold.`), 'bad');
  msg(ui('好在穿在身上的装备还在。整备一番，再下去！','Your equipped gear survived. Prepare and descend again!'), 'gold');
}

const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
const openAchv = () => { renderAchv(); showUi('achv-screen'); };
if ($('btn-achv')) $('btn-achv').addEventListener('click', () => { ensureAudio(); openAchv(); });
if ($('btn-achv-town')) $('btn-achv-town').addEventListener('click', () => { ensureAudio(); hideUi('town-screen'); openAchv(); });
if ($('btn-achv-close')) $('btn-achv-close').addEventListener('click', () => {
  hideUi('achv-screen');
  if (state === 'town') showUi('town-screen');
});
if ($('btn-help')) $('btn-help').addEventListener('click', () => { ensureAudio(); showUi('help-screen'); });
if ($('btn-help-close')) $('btn-help-close').addEventListener('click', () => hideUi('help-screen'));
function syncFullscreenUi() {
  const button = $('fullscreen-toggle');
  if (!button) return;
  const active = Boolean(fullscreenElement());
  button.innerHTML = active
    ? ui('<span aria-hidden="true">⛶</span> 退出全屏 <kbd>F</kbd>', '<span aria-hidden="true">⛶</span> Exit Fullscreen <kbd>F</kbd>')
    : ui('<span aria-hidden="true">⛶</span> 全屏 <kbd>F</kbd>', '<span aria-hidden="true">⛶</span> Fullscreen <kbd>F</kbd>');
  if (button.setAttribute) button.setAttribute('aria-pressed', String(active));
}
async function toggleFullscreen() {
  const root = $('wrap');
  try {
    if (!fullscreenElement()) {
      const request = root && (root.requestFullscreen || root.webkitRequestFullscreen);
      if (!request) {
        msg(ui('当前浏览器不支持页面全屏，请使用浏览器自身的全屏功能。','This browser does not support page fullscreen. Use the browser\'s fullscreen mode.'), 'bad');
        return false;
      }
      await request.call(root);
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (!exit) {
        msg(ui('当前浏览器无法退出页面全屏，请按 Esc。','The page cannot exit fullscreen automatically. Press Esc.'), 'bad');
        return false;
      }
      await exit.call(document);
    }
    syncFullscreenUi();
    applyViewport(window.innerWidth);
    return true;
  } catch (error) {
    const detail = error && error.message ? `：${error.message}` : '';
    msg(ui(`全屏切换失败${detail}`, `Fullscreen toggle failed${detail}`), 'bad');
    syncFullscreenUi();
    return false;
  }
}
function onFullscreenChange() {
  syncFullscreenUi();
  applyViewport(window.innerWidth);
  hideTooltip();
}
document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);

function newGame(chosen) {
  if (chosen) classId = chosen;
  if (greedyMode) { initGreedyRun(classId); return; }
  setSeed(RUN_SEED);
  buildSprites();
  depth = 1; turns = 0; state = 'playing';
  const c = classDef();
  buildThemeTex(depth);
  player = {
    x: 0, y: 0, fx: 0, fy: 0,
    hpBase: c.hpBase, hp: c.hpBase, atkBase: c.atkBase,
    lvl: 1, xp: 0, gold: 0, potions: c.potions, scrolls: c.scrolls, keys: 0, kills: 0,
    inv: [], equip: { weapon: null, armor: null, ring: null },
    lungeT: 0, hurtT: 0, ldx: 0, ldy: 0,
    facing: [1, 0], skillCd: 0, poison: 0,
    critBase: 0, leechBase: 0, skillHaste: 0, goldFind: 0, flatDr: 0, grievous: 0,
    thornsBase: 0, regenBase: 0, potionBoost: 0, critPower: 0, grivResist: 0,
    plunder: 0, fastRegen: 0,
    talents: [], echoMode: false,
  };
  logLines = []; floaters.length = 0; particles.length = 0; selectedBagIndex = -1;
  hideOverlay();
  hideUi('title-screen'); hideUi('class-screen'); hideUi('pause-screen'); hideUi('shop-screen');
  hideUi('talent-screen'); hideUi('shrine-screen'); hideUi('echo-screen');
  genLevel();
  applyViewport();
  computeFov();
  msg(fmtText(runText('intro')));
  msg(ui(`你选择了${c.name}。技能「${c.skill.name}」按 C 释放。撞向敌人即攻击。` +
    (c.rangedRange ? `面朝敌人所在直线（射程 ${c.rangedRange} 格内、无遮挡）移动即可射箭。` : ''),
    `You chose ${c.name}. Press J to attack in your facing direction. Press K to use ${c.skill.name}.` +
    (c.rangedRange ? ` Ranged attacks reach ${c.rangedRange} unobstructed tiles along your facing line.` : '')));
  msg(ui(`本层有 ${monsters.length} 个敌人、${items.length} 处物资。站上楼梯按 Enter 下潜。`, `This floor has ${monsters.length} enemies and ${items.length} loot spots. Stand on the stairs and press Enter to descend.`), 'good');
  renderBag(); renderEquip(); updateHud();
  persistRun();
}

function pauseGame() {
  if (state !== 'playing') return;
  persistRun(); // 先写盘（此时仍是 playing），否则 persistRun 见 state==='paused' 会空操作
  state = 'paused';
  const copy = $('pause-copy');
  if (copy) copy.textContent = ui(`第 ${depth} 层 · ${classDef().name} · 进度已写入本地。`, `Floor ${depth} · ${classDef().name} · Progress saved locally.`);
  showUi('pause-screen');
}
function resumeGame() {
  if (state !== 'paused') return;
  hideUi('pause-screen');
  state = 'playing';
}

const KEYMAP = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
};
document.addEventListener('keydown', e => {
  ensureAudio();
  if (e.key === 'Escape') {
    if (state === 'shop') { closeShop(); return; }
    if (state === 'shrine') { closeShrine(); return; }
    if (state === 'paused') { resumeGame(); return; }
    if (state === 'playing') { pauseGame(); return; }
  }
  if (state === 'title' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault(); showClassSelect(); return;
  }
  if ((state === 'dead' || state === 'won') && (e.key === 'r' || e.key === 'R')) {
    showTitle(); return;
  }
  if (e.key === 'm' || e.key === 'M') {
    muted = !muted;
    msg(muted ? ui('音效已关闭。','Sound muted.') : ui('音效已开启。','Sound enabled.'));
    return;
  }
  if (state !== 'playing') return;
  if (KEYMAP[e.key]) { e.preventDefault(); tryMove(...KEYMAP[e.key]); return; }
  switch (e.key) {
    case ' ': e.preventDefault(); waitTurn(); break;
    case '.': waitTurn(); break;
    case 'q': case 'Q': usePotion(); break;
    case 'e': case 'E': useScroll(); break;
    case 't': case 'T': useEscape(); break;
    case 'c': case 'C': useSkill(); break;
    case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
    case '>': case 'Enter': case 'n': case 'N': case 'PageDown':
      e.preventDefault(); descend(); break;
    case 'j': case 'J': e.preventDefault(); quickDive(); break;
  }
});
document.querySelectorAll('#touch button[data-act]').forEach(btn => {
  btn.addEventListener('click', () => {
    ensureAudio();
    const act = btn.dataset.act;
    if (act === 'up') tryMove(0, -1);
    else if (act === 'down') tryMove(0, 1);
    else if (act === 'left') tryMove(-1, 0);
    else if (act === 'right') tryMove(1, 0);
    else if (act === 'wait') waitTurn();
    else if (act === 'potion') usePotion();
    else if (act === 'scroll') useScroll();
    else if (act === 'escape') useEscape();
    else if (act === 'skill') useSkill();
    else if (act === 'descend') descend();
    else if (act === 'quickdive') quickDive();
    else if (act === 'pause') { if (state === 'playing') pauseGame(); else if (state === 'paused') resumeGame(); }
    else if (act === 'mute') {
      muted = !muted;
      msg(muted ? ui('音效已关闭。','Sound muted.') : ui('音效已开启。','Sound enabled.'));
    }
  });
});

const usesPersistentBagDetail = () =>
  window.innerWidth <= 900 ||
  (typeof matchMedia === 'function' && matchMedia('(hover: none), (pointer: coarse)').matches);

if ($('bag')) {
  $('bag').addEventListener('click', e => {
    ensureAudio();
    const dx = e.target.closest('[data-drop]');
    if (dx) { discardFromBag(+dx.dataset.drop); hideTooltip(); return; }
    const cell = e.target.closest('[data-i]');
    if (cell) {
      const i = +cell.dataset.i;
      if (usesPersistentBagDetail()) {
        selectedBagIndex = i;
        renderBag();
      } else {
        equipFromBag(i);
      }
      hideTooltip();
    }
  });
  $('bag').addEventListener('mouseover', e => {
    const cell = e.target.closest('[data-i]');
    if (cell && player && player.inv[+cell.dataset.i]) {
      const it = player.inv[+cell.dataset.i];
      showTooltip(e, tooltipHtml(it, it.slot));
    } else hideTooltip();
  });
  $('bag').addEventListener('mouseleave', hideTooltip);
}
if (typeof document.querySelector === 'function') {
  const equipButton = document.querySelector('[data-bag-equip]');
  const dropButton = document.querySelector('[data-bag-drop]');
  if (equipButton) equipButton.addEventListener('click', () => equipFromBag(selectedBagIndex));
  if (dropButton) dropButton.addEventListener('click', () => discardFromBag(selectedBagIndex));
}

for (const slot of ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet']) {
  const el = $('eq-' + slot);
  if (!el) continue;
  el.addEventListener('click', () => { ensureAudio(); unequip(slot); hideTooltip(); });
  el.addEventListener('mouseover', e => {
    const it = player && player.equip[slot];
    if (it) showTooltip(e, tooltipHtml(it, null));
    else hideTooltip();
  });
  el.addEventListener('mouseleave', hideTooltip);
}
if ($('ov-restart')) $('ov-restart').addEventListener('click', () => { ensureAudio(); showTitle(); });
if ($('fullscreen-toggle')) $('fullscreen-toggle').addEventListener('click', () => { ensureAudio(); toggleFullscreen(); });
if ($('btn-new')) $('btn-new').addEventListener('click', () => { ensureAudio(); showClassSelect(); });
document.querySelectorAll('.depth-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.profile;
    if (id === PROFILE_ID) return;
    const url = new URL(location.href);
    url.searchParams.set('profile', id);
    url.searchParams.delete('seed');
    location.href = url.toString();
  });
});
if ($('btn-greedy')) $('btn-greedy').addEventListener('click', () => {
  ensureAudio();
  setGreedy(!greedyMode);
  msg(greedyMode
    ? ui('贪婪远征已开启：死亡会失去背包与随身金币，回城卷轴可保住一切。','Greedy Expedition enabled: death loses backpack items and carried Gold; Return Scrolls secure your haul.')
    : ui('已切回经典回响模式。','Classic Echo mode restored.'));
  refreshTitle();
});
if ($('town-screen')) $('town-screen').addEventListener('click', e => {
  const dep = e.target.closest('[data-deposit]');
  if (dep) { ensureAudio(); depositStash(+dep.dataset.deposit); return; }
  const depAll = e.target.closest('[data-depositall]');
  if (depAll) { ensureAudio(); depositAllBag(); return; }
  const wth = e.target.closest('[data-withdraw]');
  if (wth) { ensureAudio(); withdrawStash(+wth.dataset.withdraw); return; }
  const buy = e.target.closest('[data-townbuy]');
  if (buy) { ensureAudio(); buyTown(buy.dataset.townbuy); return; }
  const wsp = e.target.closest('[data-wheelspin]');
  if (wsp) { ensureAudio(); spinWheel(); return; }
  const wrs = e.target.closest('[data-wheelreset]');
  if (wrs) { ensureAudio(); resetWheel(); return; }
  const sel = e.target.closest('[data-sell]');
  if (sel) {
    ensureAudio();
    const [w, i] = sel.dataset.sell.split(':');
    sellItem(w, +i);
    return;
  }
  const forg = e.target.closest('[data-forge]');
  if (forg) {
    ensureAudio();
    const [w, i] = forg.dataset.forge.split(':');
    forgeItem(w, +i);
    return;
  }
});
if ($('btn-depart')) $('btn-depart').addEventListener('click', () => { ensureAudio(); departTown(); });
if ($('btn-town-exit')) $('btn-town-exit').addEventListener('click', () => {
  ensureAudio(); saveMeta(); hideUi('town-screen'); state = 'title'; showTitle();
});
if ($('btn-continue')) $('btn-continue').addEventListener('click', () => {
  ensureAudio();
  const save = peekRun();
  if (save) restoreRun(save);
});
if ($('btn-class-back')) $('btn-class-back').addEventListener('click', () => { ensureAudio(); showTitle(); });
if ($('class-grid')) $('class-grid').addEventListener('click', e => {
  const btn = e.target.closest('[data-class]');
  if (!btn) return;
  ensureAudio();
  newGame(btn.dataset.class);
});
if ($('btn-resume')) $('btn-resume').addEventListener('click', () => { ensureAudio(); resumeGame(); });
if ($('btn-save-quit')) $('btn-save-quit').addEventListener('click', () => {
  ensureAudio(); persistRun(); hideUi('pause-screen'); showTitle();
});
if ($('btn-shop-leave')) $('btn-shop-leave').addEventListener('click', () => { ensureAudio(); closeShop(); });
if ($('shop-list')) $('shop-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-buy]');
  if (!btn) return;
  ensureAudio();
  buyShop(+btn.dataset.buy);
});
if ($('talent-grid')) $('talent-grid').addEventListener('click', e => {
  const btn = e.target.closest('[data-talent]');
  if (!btn) return;
  ensureAudio();
  pickTalent(btn.dataset.talent);
});
if ($('btn-shrine-ok')) $('btn-shrine-ok').addEventListener('click', () => { ensureAudio(); applyShrine(); });
if ($('btn-shrine-leave')) $('btn-shrine-leave').addEventListener('click', () => {
  ensureAudio(); hideUi('shrine-screen'); shrineTarget = null; state = 'playing';
});
if ($('btn-echo-leave')) $('btn-echo-leave').addEventListener('click', () => { ensureAudio(); chooseEchoLeave(); });
if ($('btn-echo-stay')) $('btn-echo-stay').addEventListener('click', () => { ensureAudio(); chooseEchoStay(); });
if ($('descend-fab')) $('descend-fab').addEventListener('click', () => { ensureAudio(); descend(); });
if ($('quickdive-fab')) $('quickdive-fab').addEventListener('click', () => { ensureAudio(); quickDive(); });
if (canvas) {
  canvas.addEventListener('click', e => {
    if (state !== 'playing') return;
    ensureAudio();
    const rect = canvas.getBoundingClientRect();
    const tx = view.x + Math.floor((e.clientX - rect.left) / rect.width * view.cols);
    const ty = view.y + Math.floor((e.clientY - rect.top) / rect.height * view.rows);
    clickNav(tx, ty);
  });
}
window.addEventListener('resize', () => applyViewport());

if (typeof window !== 'undefined') {
  window.DE_TEST = {
    get depth() { return depth; },
    set depth(v) { depth = v; },
    get turns() { return turns; },
    set turns(v) { turns = v; },
    get state() { return state; },
    get player() { return player; },
    get mapGrid() { return map; },
    get monsters() { return monsters; },
    get items() { return items; },
    get npcs() { return npcs; },
    get traps() { return traps; },
    viewportFor, heroSpriteKeyFor,
    lootIconIds: [...LOOT_ICON_IDS],
    runProfile: { ...RUN_PROFILE },
    get seed() { return RUN_SEED; },
    setSeed,
    burnVfx(n = 4096) { for (let i = 0; i < n; i++) vfx(); },
    profileId: PROFILE_ID,
    get classId() { return classId; },
    validateProfile, requireProfile,
    descend, usePotion, useScroll, useSkill, waitTurn, tryMove,
    quickDive, quickDiveCost,
    pauseGame, resumeGame,
    pickTalent, chooseEchoLeave, chooseEchoStay,
    genEquip, pickupHere, equipFromBag, discardFromBag, killMonster, newGame, toggleFullscreen,
    persistRun, peekRun, restoreRun, CLASSES, TALENTS,
    genLevel, monsterPoolFor, pickSpawn, ensureFloorContent,
    makeMonster, applyDamageToMonster, monsterRangedAttack, monsterAttack, monstersTurn, beginArmorBreak, spawnCasks, endTurn,
    pThorns, pKillHeal, pMaxHp, pDef, pCrit, eqScoreOf, itemValueScore, mechanicValueBonus, forgeCost, sellPrice, pierceChanceOf,
    MECHANIC_TRAITS, mechanicPower, mechanicDescription, applyDirectHitMechanic,
    canDescendNow, isFinalFloor,
    get greedy() { return greedyMode; },
    setGreedy, getMeta: () => meta,
    get meta() { return meta; },
    useEscape, departTown, depositStash, withdrawStash, buyTown,
    spinWheel, resetWheel, spinCost, resetWheelCost, applyWheelPrize, genWheelSlot,
    ACHV, checkAchv,
    sellItem, forgeItem, depositAllBag, forgeCost, sellPrice, sanitizeMeta,
    closeShop, buyShop, closeShrine, getShopStock: () => shopStock,
  };
}

if ($('title-screen')) showTitle();
else newGame('warrior');
const seedLabel = $('seed-label');
if (seedLabel) seedLabel.textContent = RUN_SEED + ui('（' + PROFILE_ID + '）', ' (' + PROFILE_ID + ')');
syncFullscreenUi();
scheduleFrame();
})();
