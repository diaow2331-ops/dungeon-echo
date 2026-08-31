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
const RECORD_KEY = 'de-expedition-record-v1';
const RECORD_VERSION = 1;
const GREEDY_KEY = 'de-greedy-on-v1';
const GUIDE_KEY = 'de-guide-v1';
const GUIDE_VERSION = 1;
const GUIDE_IDS = Object.freeze(['move', 'combat', 'gear', 'stairs', 'return']);
const AUDIO_PREF_KEY = 'de-audio-v1';
const AUDIO_PREF_VERSION = 1;
const AUDIO_DEFAULTS = Object.freeze({ music:0.60, sfx:0.78, muted:false });
const HAPTICS_DEFAULT = true;
const RUN_MODE_CLASSIC = 'classic';
const RUN_MODE_GREEDY = 'greedy';
const MANA_RULES = Object.freeze({
  warrior:  Object.freeze({ max:60, cost:30, regen:2, attackGain:2, focusGain:3 }),
  ranger:   Object.freeze({ max:70, cost:32, regen:2, attackGain:3, focusGain:4 }),
  mage:     Object.freeze({ max:100, cost:42, regen:3, attackGain:1, focusGain:10 }),
  assassin: Object.freeze({ max:65, cost:34, regen:2, attackGain:3, focusGain:4 }),
});
const manaRuleFor = cid => MANA_RULES[cid] || MANA_RULES.warrior;

// ================= 贪婪远征（元进度） =================
let greedyMode = false;
try {
  greedyMode = typeof localStorage !== 'undefined' &&
    localStorage.getItem(GREEDY_KEY) === '1';
} catch (e) { /* 无 localStorage 环境 */ }

let meta = null;
let record = null;
function defaultRecord() {
  return {
    v: RECORD_VERSION,
    runs: 0, wins: 0, totalKills: 0, deaths: 0, bestDepth: 0,
    safeReturns: 0, guardians: 0, legends: 0,
    achv: {},
  };
}
function sanitizeRecord(raw) {
  const out = defaultRecord();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const num = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
  for (const k of ['runs','wins','totalKills','deaths','bestDepth','safeReturns','guardians','legends']) out[k] = num(raw[k]);
  if (raw.achv && typeof raw.achv === 'object' && !Array.isArray(raw.achv)) {
    for (const k of Object.keys(raw.achv)) if (raw.achv[k]) out.achv[k] = 1;
  }
  return out;
}
function loadRecord() {
  let out = defaultRecord();
  try { out = sanitizeRecord(JSON.parse(localStorage.getItem(RECORD_KEY))); } catch (e) { /* start clean */ }
  // One-way lower-bound migration from pre-v1.3.5 history. This never writes back into Greedy economy.
  try {
    const oldMeta = JSON.parse(localStorage.getItem(META_KEY));
    if (oldMeta && typeof oldMeta === 'object') {
      out.runs = Math.max(out.runs, Number(oldMeta.runs) || 0);
      out.wins = Math.max(out.wins, Number(oldMeta.wins) || 0);
      out.totalKills = Math.max(out.totalKills, Number(oldMeta.totalKills) || 0);
      out.deaths = Math.max(out.deaths, Number(oldMeta.deaths) || 0);
      out.bestDepth = Math.max(out.bestDepth, Number(oldMeta.bestDepth) || 0);
      out.legends = Math.max(out.legends, oldMeta.gotLegend ? 1 : 0);
      if (oldMeta.achv && typeof oldMeta.achv === 'object')
        for (const k of Object.keys(oldMeta.achv)) if (oldMeta.achv[k]) out.achv[k] = 1;
    }
    const best = JSON.parse(localStorage.getItem('de-best'));
    if (best && typeof best === 'object') {
      out.bestDepth = Math.max(out.bestDepth, Number(best.bestDepth) || 0);
      out.totalKills = Math.max(out.totalKills, Number(best.bestKills) || 0);
    }
  } catch (e) { /* legacy data is optional */ }
  return sanitizeRecord(out);
}
function saveRecord() {
  if (!record) return;
  try { localStorage.setItem(RECORD_KEY, JSON.stringify(record)); } catch (e) { /* non-critical profile */ }
}
function ensureRecord() {
  if (!record) record = loadRecord();
  return record;
}
function recordRunStart() { const r=ensureRecord(); r.runs++; r.bestDepth=Math.max(r.bestDepth, depth || 1); saveRecord(); }
function recordDepth() { const r=ensureRecord(); r.bestDepth=Math.max(r.bestDepth, Math.max(1, Number(depth)||1)); }
function recordKill(m) { const r=ensureRecord(); r.totalKills++; if (m && m.midBoss) r.guardians++; }
function recordDeath() { const r=ensureRecord(); r.deaths++; saveRecord(); }
function recordWin() { const r=ensureRecord(); r.wins++; r.bestDepth=Math.max(r.bestDepth, Number(depth)||0); saveRecord(); }
function recordSafeReturn() { const r=ensureRecord(); r.safeReturns++; r.bestDepth=Math.max(r.bestDepth, Number(depth)||0); saveRecord(); }
function recordLegend() { const r=ensureRecord(); r.legends=Math.max(1,r.legends||0); saveRecord(); }
record = loadRecord();
function defaultMeta(classId) {
  const c = CLASSES[classId] || CLASSES.warrior;
  return {
    v: 1, classId: c.id,
    gold: 0,
    lvl: 1, xp: 0,
    hpBase: c.hpBase, atkBase: c.atkBase,
    manaMax: manaRuleFor(c.id).max, mana: manaRuleFor(c.id).max,
    critBase: 0, leechBase: 0, skillHaste: 0, goldFind: 0, flatDr: 0, grievous: 0,
    thornsBase: 0, regenBase: 0, potionBoost: 0, critPower: 0, grivResist: 0,
    plunder: 0, fastRegen: 0,
    talents: [],
    potions: Math.max(2, c.potions), scrolls: c.scrolls, keys: 0, escapes: 2,
    insurance: 0,
    totalKills: 0, wins: 0, wheelTotal: 0, gotLegend: 0, achv: {},
    wheelSpins: 0, wheelResets: 0, wheelSlots: null,
    market: null,
    contractId: 'none',
    townWorks: TOWN_GROWTH_RULES.sanitizeLevels({}),
    townEvent: null,
    townChronicle: [],
    relicFocusSet: '',
    relicLedger: {}, lastReturnDepth: 0,
    tavernVisits: 0, tavernLastRun: -1, tavernHistory: [],
    equip: { weapon: starterWeaponForClass(c.id), armor: null, helmet:null, boots:null, ring: null, amulet:null },
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
  base.manaMax = manaRuleFor(base.classId).max;
  base.mana = clamp(num(raw.mana, base.manaMax), 0, base.manaMax);
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
  const market = raw.market;
  const marketStock = market && market.stock;
  const marketIds = ['potion', 'scroll', 'escape', 'key', 'insurance'];
  if (market && market.v === 1 && Number.isInteger(market.cycleRun) && market.cycleRun >= 0 &&
      Number.isInteger(market.tier) && market.tier >= 1 && market.tier <= 10 &&
      marketStock && typeof marketStock === 'object' &&
      marketIds.every(id => Number.isInteger(marketStock[id]) && marketStock[id] >= 0 && marketStock[id] <= 99)) {
    base.market = { v: 1, cycleRun: market.cycleRun, tier: market.tier, stock: { ...marketStock } };
  }
  base.contractId = EXPEDITION_RULES.normalizeContractId(raw.contractId);
  base.townWorks = TOWN_GROWTH_RULES.sanitizeLevels(raw.townWorks);
  base.townEvent = null;
  if (raw.townEvent && typeof raw.townEvent === 'object' && !Array.isArray(raw.townEvent) && TOWN_GROWTH_RULES.eventById(raw.townEvent.id)) {
    const effect = raw.townEvent.effect && typeof raw.townEvent.effect === 'object' ? raw.townEvent.effect : {};
    base.townEvent = {
      id:String(raw.townEvent.id), cost:Math.min(9999, num(raw.townEvent.cost, 0)),
      effect:{
        gold:Math.min(9999, num(effect.gold, 0)), marketRestock:effect.marketRestock ? 1 : 0,
        escapes:Math.min(9, num(effect.escapes, 0)), keys:Math.min(9, num(effect.keys, 0)),
      },
    };
  }
  base.townChronicle = (Array.isArray(raw.townChronicle) ? raw.townChronicle : []).filter(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
    if (row.kind === 'return') return Number.isInteger(row.depth) && row.depth >= 1 && row.depth <= 9999;
    if (row.kind === 'project') return !!TOWN_GROWTH_RULES.project(row.id) && Number.isInteger(row.level) && row.level >= 1 && row.level <= 3;
    if (row.kind === 'event') return !!TOWN_GROWTH_RULES.eventById(row.id);
    if (row.kind === 'relic') return !!SET_RULES.setById(row.setId) && SET_RULES.SLOTS.includes(row.slot);
    return false;
  }).slice(-8).map(row => ({ ...row }));
  base.relicLedger = {};
  if (raw.relicLedger && typeof raw.relicLedger === 'object' && !Array.isArray(raw.relicLedger)) {
    for (const set of SET_RULES.SETS) for (const slot of SET_RULES.SLOTS) {
      const key = set.id + ':' + slot;
      if (raw.relicLedger[key]) base.relicLedger[key] = 1;
    }
  }
  base.lastReturnDepth = num(raw.lastReturnDepth, 0);
  base.tavernVisits = Math.min(TOWN_GROWTH_RULES.tavernToastCap(base.townWorks), num(raw.tavernVisits, 0));
  base.tavernLastRun = Number.isInteger(raw.tavernLastRun) && raw.tavernLastRun >= -1 ? raw.tavernLastRun : -1;
  const tavernRewardIds = ['hearth', 'edge', 'fortune', 'prosperity'];
  base.tavernHistory = (Array.isArray(raw.tavernHistory) ? raw.tavernHistory : [])
    .filter(id => tavernRewardIds.includes(id)).slice(-4);
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
  base.relicFocusSet = SET_RULES.normalizeFocusId(raw.relicFocusSet, base.bestDepth, base.relicLedger);
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

function loadGuideSeen() {
  const seen = new Set();
  try {
    const raw = JSON.parse(localStorage.getItem(GUIDE_KEY));
    if (raw && raw.v === GUIDE_VERSION && Array.isArray(raw.seen)) {
      raw.seen.forEach(id => { if (GUIDE_IDS.includes(id)) seen.add(id); });
      return seen;
    }
    // Existing players should not be forced through a newly-added first-run guide.
    const best = JSON.parse(localStorage.getItem('de-best'));
    const oldMeta = JSON.parse(localStorage.getItem(META_KEY));
    const experienced = !!(best && (best.bestDepth > 0 || best.bestKills > 0 || best.bestLvl > 1)) ||
      !!(oldMeta && (oldMeta.runs > 0 || oldMeta.bestDepth > 0 || oldMeta.totalKills > 0));
    if (experienced) GUIDE_IDS.forEach(id => seen.add(id));
  } catch (e) { /* no/invalid localStorage: keep an in-memory guide state */ }
  return seen;
}
const guideSeen = loadGuideSeen();
function saveGuideSeen() {
  try { localStorage.setItem(GUIDE_KEY, JSON.stringify({ v: GUIDE_VERSION, seen: [...guideSeen] })); }
  catch (e) { /* guide preference is non-critical */ }
}
function guideOnce(id, zh, en, cls='good') {
  if (!GUIDE_IDS.includes(id) || guideSeen.has(id)) return false;
  guideSeen.add(id);
  saveGuideSeen();
  msg(ui(`【入门】${zh}`, `[Guide] ${en}`), cls);
  return true;
}
function guideFirstRunStart() {
  guideOnce('move',
    '先用方向键 / WASD，或点击已探索地块移动。先看清房间，再决定要不要接敌。',
    'Move with arrows / WASD, or click explored tiles. Read the room before committing to a fight.');
}
function guideCombatOnce() {
  const ranged = classId === 'ranger' || classId === 'mage';
  guideOnce('combat',
    ranged ? '移动键只负责移动/贴身攻击；面向直线敌人按 J 远程普攻，K 释放职业技能（C 仍兼容）。' : '移动撞敌可近战；面向敌人按 J 主动攻击，K 释放职业技能（C 仍兼容）。',
    ranged ? 'Movement only moves or bump-attacks. Face a line target and press J for a ranged basic attack; K uses your class skill (C remains an alias).' : 'Bump to melee or face an enemy and press J to attack. K uses your class skill (C remains an alias).');
}
function guideGearOnce() {
  guideOnce('gear',
    '点击背包装备查看“职业适配”和“内在价值”，再决定装备或丢弃；高售价不等于更适合当前职业。',
    'Select backpack gear to compare Class Fit and Item Value before equipping or dropping it; a higher sale value does not always mean a better fit.');
}

const clampAudio01 = value => Math.max(0, Math.min(1, Number(value) || 0));
function loadAudioPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(AUDIO_PREF_KEY));
    if (raw && raw.v === AUDIO_PREF_VERSION) {
      return {
        v:AUDIO_PREF_VERSION,
        music: Number.isFinite(Number(raw.music)) ? clampAudio01(raw.music) : AUDIO_DEFAULTS.music,
        sfx: Number.isFinite(Number(raw.sfx)) ? clampAudio01(raw.sfx) : AUDIO_DEFAULTS.sfx,
        muted: !!raw.muted,
        haptics: typeof raw.haptics === 'boolean' ? raw.haptics : HAPTICS_DEFAULT,
      };
    }
  } catch (e) { /* invalid/missing preference falls back to recommended mix */ }
  return { v:AUDIO_PREF_VERSION, ...AUDIO_DEFAULTS, haptics:HAPTICS_DEFAULT };
}
let audioPrefs = loadAudioPrefs();
function audioSnapshot() {
  return Object.freeze({ music:audioPrefs.music, sfx:audioPrefs.sfx, muted:audioPrefs.muted, haptics:audioPrefs.haptics });
}
function saveAudioPrefs() {
  try { localStorage.setItem(AUDIO_PREF_KEY, JSON.stringify(audioPrefs)); }
  catch (e) { /* audio preference is non-critical */ }
}
function haptic(pattern) {
  if (!audioPrefs.haptics || reducedMotion || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  try { return !!navigator.vibrate(pattern); } catch (e) { return false; }
}
function broadcastAudioPrefs() {
  if (typeof document === 'undefined' || typeof CustomEvent !== 'function') return;
  try { document.dispatchEvent(new CustomEvent('de-audio-settings', { detail:audioSnapshot() })); }
  catch (e) { /* presentation follower may be absent */ }
}
if (typeof window !== 'undefined') {
  window.DE_AUDIO_PREFS_V133 = Object.freeze({ version:'v1.3.4', snapshot:audioSnapshot });
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
    blurb: '脆弱的远程施法者。法杖普攻可穿透部分护甲，奥术弹负责击退与爆发。',
    hpBase: 24, atkBase: 2, potions: 1, scrolls: 2,
    rangedRange: 4,
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

const EVO = (id, zhName, enName, zhDesc, enDesc) => [
  id, ui(zhName, enName), ui(zhDesc, enDesc),
];
const SKILL_EVOLUTION_ROWS = {
  warrior: {
    20: [
      EVO('se_w20_arc', '环斩', 'Arc Sweep',
        '横扫额外擦过四个斜角近身位；围攻时不再只处理十字四格。',
        'Sweep also clips the four adjacent diagonals, so surrounding enemies are no longer limited to the cardinal tiles.'),
      EVO('se_w20_guard', '盾势', 'Guard Stance',
        '施放横扫的这一回合获得额外减伤，适合贴身换血。',
        'Gain extra damage reduction during the turn Sweep is cast, improving close-range trades.'),
    ],
    40: [
      EVO('se_w40_reach', '破阵长锋', 'Linebreaker Reach',
        '横扫同时打击上下左右第二格目标，形成直线纵深。',
        'Sweep also hits targets two tiles away in the four cardinal directions.'),
      EVO('se_w40_rhythm', '战阵节拍', 'Battle Rhythm',
        '一次横扫覆盖至少两个目标时额外返还 1 回合冷却。',
        'If one Sweep covers at least two targets, refund 1 extra turn of cooldown.'),
    ],
    60: [
      EVO('se_w60_blood', '血战续行', 'Bloodied Advance',
        '横扫造成击杀时恢复少量最大生命。',
        'Kills caused by Sweep restore a small amount of Max HP.'),
      EVO('se_w60_pressure', '压阵', 'Press the Line',
        '横扫本身获得基于当前攻击的额外威力，强化破阵而非普攻。',
        'Sweep gains extra power based on current ATK, strengthening the skill rather than basic attacks.'),
    ],
    80: [
      EVO('se_w80_tempest', '风暴横扫', 'Tempest Sweep',
        '横扫扩展到两格范围内的非核心目标，成为真正的深层清场技。',
        'Sweep extends to secondary targets within two tiles, becoming a true deep-floor clearing skill.'),
      EVO('se_w80_fortress', '移动堡垒', 'Moving Fortress',
        '施放横扫时获得更强临时减伤；技能越用于危险贴身局面越有价值。',
        'Gain stronger temporary damage reduction while casting Sweep; it rewards committing in dangerous melee situations.'),
    ],
  },
  ranger: {
    20: [
      EVO('se_r20_evasion', '掠影', 'Passing Shadow',
        '疾步期间获得临时减伤，让位移可用于穿过危险接触区。',
        'Gain temporary damage reduction during Fleet Step, allowing movement through dangerous contact zones.'),
      EVO('se_r20_tempo', '轻装疾行', 'Lightfoot Tempo',
        '疾步本次施放按额外技能急速结算，缩短下一次位移等待。',
        'This Fleet Step gains extra skill haste, shortening the wait before the next movement skill.'),
    ],
    40: [
      EVO('se_r40_hunt', '猎杀续步', 'Hunt Continues',
        '疾步造成击杀时立即重置技能冷却。',
        'A kill caused by Fleet Step immediately resets its cooldown.'),
      EVO('se_r40_flow', '无伤转场', 'Clean Transition',
        '疾步没有造成击杀时额外返还 2 回合冷却，鼓励把技能用于走位。',
        'If Fleet Step does not kill, refund 2 extra cooldown turns, rewarding repositioning.'),
    ],
    60: [
      EVO('se_r60_marksman', '拉弦余势', 'Drawstring Momentum',
        '疾步成功后强化下一次方向攻击；空跑不会消耗在普通移动上。',
        'After a successful Fleet Step, empower the next directional attack; ordinary movement does not consume it.'),
      EVO('se_r60_sustain', '猎手续命', 'Hunter Renewal',
        '疾步击杀敌人时恢复最大生命，提升连续猎杀续航。',
        'Kills caused by Fleet Step restore Max HP, improving sustained hunts.'),
    ],
    80: [
      EVO('se_r80_chain', '无尽追猎', 'Endless Hunt',
        '疾步造成击杀时保持零冷却，并强化下一次方向攻击，形成高风险追猎链。',
        'Fleet Step kills keep cooldown at zero and empower the next directional attack, enabling a high-risk chase chain.'),
      EVO('se_r80_phantom', '幻步', 'Phantom Step',
        '疾步回合获得更强减伤，并为下一次方向攻击留下较小增幅。',
        'Gain stronger damage reduction during Fleet Step and leave a smaller boost for the next directional attack.'),
    ],
  },
  mage: {
    20: [
      EVO('se_m20_fork', '分叉奥术', 'Forked Arcana',
        '奥术弹命中前，同时削击第二近的可见敌人。',
        'Before Arcane Bolt lands, also strike the second-nearest visible enemy.'),
      EVO('se_m20_barrier', '施法屏障', 'Casting Barrier',
        '施放奥术弹的这一回合获得临时减伤，换取更稳定的站桩输出。',
        'Gain temporary damage reduction during the Arcane Bolt turn for more stable stationary damage.'),
    ],
    40: [
      EVO('se_m40_chain', '回响连锁', 'Echo Chain',
        '奥术弹额外波及第二、第三个可见目标，强化群战。',
        'Arcane Bolt also splashes the second and third visible targets, improving group fights.'),
      EVO('se_m40_focus', '单点聚焦', 'Single-Target Focus',
        '视野里只有一个敌人时，奥术弹获得显著额外威力。',
        'When only one enemy is visible, Arcane Bolt gains significant extra power.'),
    ],
    60: [
      EVO('se_m60_overload', '过载回路', 'Overload Circuit',
        '奥术弹造成击杀时额外返还 2 回合冷却。',
        'Arcane Bolt kills refund 2 extra turns of cooldown.'),
      EVO('se_m60_repulse', '强制退相', 'Forced Displacement',
        '奥术弹结算后若目标仍存活，会尝试把它再推离一格。',
        'If the target survives Arcane Bolt, attempt to push it one additional tile away.'),
    ],
    80: [
      EVO('se_m80_storm', '奥术风暴', 'Arcane Storm',
        '奥术弹施放前对最多三个次要可见目标造成高比例溅射。',
        'Before Arcane Bolt is cast, deal heavy splash damage to up to three secondary visible targets.'),
      EVO('se_m80_singularity', '奇点核心', 'Singularity Core',
        '只有单一可见目标时大幅强化本次奥术弹，但不改善群战。',
        'When exactly one target is visible, greatly empower this Arcane Bolt without improving group fights.'),
    ],
  },
  assassin: {
    20: [
      EVO('se_a20_execute', '斩首线', 'Execution Line',
        '影袭锁定的最近目标低于 45% 生命时，本次处决获得额外威力。',
        'When Shadow Strike targets an enemy below 45% HP, this execution gains extra power.'),
      EVO('se_a20_smoke', '烟遁', 'Smoke Veil',
        '施放影袭的这一回合获得临时减伤，降低落点失误成本。',
        'Gain temporary damage reduction during the Shadow Strike turn, reducing the cost of a bad landing.'),
    ],
    40: [
      EVO('se_a40_blood', '血返', 'Blood Return',
        '影袭击杀时恢复最大生命，适合连续切入。',
        'Shadow Strike kills restore Max HP, supporting repeated dives.'),
      EVO('se_a40_tempo', '影刃节拍', 'Shadowblade Tempo',
        '影袭击杀时额外返还 2 回合冷却。',
        'Shadow Strike kills refund 2 extra turns of cooldown.'),
    ],
    60: [
      EVO('se_a60_mark', '死亡标记', 'Death Mark',
        '影袭成功后强化下一次方向攻击，逼迫你继续贴身完成连段。',
        'After a successful Shadow Strike, empower the next directional attack and reward staying close to finish the combo.'),
      EVO('se_a60_escape', '脱影', 'Slip into Shadow',
        '影袭回合获得更强临时减伤，偏向安全进出。',
        'Gain stronger temporary damage reduction during the Shadow Strike turn, favoring safer entries and exits.'),
    ],
    80: [
      EVO('se_a80_chain', '无间影袭', 'Unbroken Shadow Strike',
        '影袭造成击杀时直接重置技能冷却。',
        'Shadow Strike kills immediately reset the skill cooldown.'),
      EVO('se_a80_predator', '猎物未死', 'Prey Survived',
        '影袭未能击杀时返还部分冷却并强化下一次方向攻击。',
        'If Shadow Strike does not kill, refund part of the cooldown and empower the next directional attack.'),
    ],
  },
};



const SKILL_EVOLUTION_MILESTONES = Object.freeze([20, 40, 60, 80]);
const SKILL_EVOLUTION_TALENTS = Object.freeze(Object.fromEntries(
  Object.entries(SKILL_EVOLUTION_ROWS).flatMap(([cid, milestones]) =>
    Object.entries(milestones).flatMap(([milestone, rows]) => rows.map(([id, name, desc]) => [id, Object.freeze({
      id, name: ui(`${milestone}层 · ${name}`, `Floor ${milestone} · ${name}`), desc, apply() {}, evolution: true, classId: cid, milestone: Number(milestone),
    })]))
  )
));
function skillEvolutionTalent(id) { return SKILL_EVOLUTION_TALENTS[id] || null; }
function hasSkillEvolution(id) { return !!(player && Array.isArray(player.talents) && player.talents.includes(id)); }
function pendingSkillEvolution() {
  if (!player) return null;
  const chosen = new Set(player.talents || []);
  for (const milestone of SKILL_EVOLUTION_MILESTONES) {
    if (depth < milestone) break;
    const pair = SKILL_EVOLUTION_ROWS[classId] && SKILL_EVOLUTION_ROWS[classId][milestone];
    if (pair && !pair.some(row => chosen.has(row[0]))) return pair.map(row => skillEvolutionTalent(row[0]));
  }
  return null;
}
let skillFollowup = null;
function skillFollowupPlan(cid, killed) {
  let scale = 0, zh = '', en = '';
  if (cid === 'ranger') {
    if (hasSkillEvolution('se_r60_marksman')) { scale = .35; zh = '拉弦余势'; en = 'Drawstring Momentum'; }
    if (hasSkillEvolution('se_r80_phantom') && scale < .20) { scale = .20; zh = '幻步余势'; en = 'Phantom Momentum'; }
    if (hasSkillEvolution('se_r80_chain') && killed && scale < .25) { scale = .25; zh = '无尽追猎'; en = 'Endless Hunt'; }
  } else if (cid === 'assassin') {
    if (hasSkillEvolution('se_a60_mark')) { scale = .40; zh = '死亡标记'; en = 'Death Mark'; }
    if (hasSkillEvolution('se_a80_predator') && !killed && scale < .25) { scale = .25; zh = '猎物未死'; en = 'Prey Survived'; }
  }
  return scale ? Object.freeze({ scale, zh, en }) : null;
}
function consumeSkillFollowup() {
  const plan = skillFollowup;
  if (plan) skillFollowup = null;
  return plan;
}



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
  // 六栏位扩展（21-32 号格）：生产 4×8 图集已完整覆盖，31 个 live id 各占独立格。
  'helm-cloth', 'helm-iron', 'helm-knight', 'helm-dragon',
  'boots-cloth', 'boots-leather', 'boots-steel', 'boots-wind',
  'amulet-copper', 'amulet-moonstone', 'amulet-guardian', 'amulet-abyss',
]);
const LOOT_ICON_INDEX = Object.fromEntries(LOOT_ICON_IDS.map((id, i) => [id, i]));
const lootAtlas = new Image();
lootAtlas.src = 'art/loot-atlas.png';
const equipmentWeaponsV13 = new Image();
equipmentWeaponsV13.src = 'art/equipment-weapons-v13.png';
const equipmentWearablesV13 = new Image();
equipmentWearablesV13.src = 'art/equipment-wearables-v13.png';
const heroAtlasV11 = new Image();
heroAtlasV11.src = 'art/hero-atlas-v11.png';
const heroActionAtlasV2 = new Image();
heroActionAtlasV2.src = 'art/hero-action-atlas-v2.svg';
const monsterAtlasV11 = new Image();
monsterAtlasV11.src = 'art/monster-atlas-v11.png';
const deepMonsterAtlasV1 = new Image();
deepMonsterAtlasV1.src = 'art/monster-deep-atlas-v1.svg';
const DEEP_MONSTER_ART_INDEX = Object.freeze({
  abomination:0, seraph:1, voidspawn:2, voidlord:3,
});
const guardianAtlasV11 = new Image();
guardianAtlasV11.src = 'art/guardian-atlas-v11.png';
const finalBossV11 = new Image();
finalBossV11.src = 'art/final-boss-v11.png';
const townBackdropV11 = new Image();
townBackdropV11.src = 'art/town-backdrop-v11.webp';
const townNpcAtlasV1 = new Image();
townNpcAtlasV1.src = 'art/town-npc-atlas-v1.svg';
const TOWN_NPC_ART = Object.freeze({
  quartermaster:0, smith:1, smithAction:2, recordsClerk:3,
  provisioner:4, provisionerCrate:5, travellingMerchant:6, townWatch:7,
  apothecaryApprentice:8, alchemist:9, oracle:10, oracleRitual:11,
  portalWarden:12, portalTechnician:13, innkeeper:14, expeditionScout:15,
});
const dungeonPropsAtlasV1 = new Image();
dungeonPropsAtlasV1.src = 'art/dungeon-props-atlas-v1.svg';
const DUNGEON_PROP_ART = Object.freeze({
  woodBarrel:4, webNest:6, iceCrystal:7, lavaVent:9, voidRift:10,
  campfire:15, treasureChest:17, marketStall:21, angelShrine:22,
});
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

const EQUIPMENT_SOURCE_BY_ICON = Object.freeze({
  'iron-sword':['weapon',0,0],'broad-sword':['weapon',1,0],'battle-axe':['weapon',3,1],'rune-blade':['weapon',3,0],
  'dagger':['weapon',2,3],'hunting-bow':['weapon',5,1],'arcane-staff':['weapon',4,2],
  'leather-armor':['wearable',0,0],'chain-mail':['wearable',2,0],'plate-armor':['wearable',4,0],'mithril-armor':['wearable',3,0],
  'copper-ring':['wearable',0,3],'ruby-ring':['wearable',2,3],'guardian-ring':['wearable',4,3],
  'helm-cloth':['wearable',0,1],'helm-iron':['wearable',2,1],'helm-knight':['wearable',3,1],'helm-dragon':['wearable',5,1],
  'boots-cloth':['wearable',0,2],'boots-leather':['wearable',1,2],'boots-steel':['wearable',2,2],'boots-wind':['wearable',4,2],
  'amulet-copper':['wearable',0,4],'amulet-moonstone':['wearable',1,4],'amulet-guardian':['wearable',3,4],'amulet-abyss':['wearable',5,4],
});
const WEAPON_ART_THRESHOLDS = Object.freeze([1,3,5,7,10,14,17,22,32,44,58,74,92]);
const ARMOR_ART_THRESHOLDS = Object.freeze([1,3,5,7,14,22,32,44,58,74,92]);
const RING_ART_THRESHOLDS = Object.freeze([1,3,6,13,21,32,44,58,74,92]);
const WEAPON_TIER_ART = Object.freeze({
  warrior:[[0,0],[1,0],[2,1],[3,0],[4,0],[0,1],[3,1],[5,0],[4,1],[3,0],[5,3],[4,3],[5,3]],
  ranger:[[5,1],[0,2],[1,2],[2,2],[0,2],[1,2],[2,2],[0,2],[1,2],[2,2],[1,2],[2,2],[2,2]],
  mage:[[3,2],[4,2],[0,3],[4,2],[3,2],[5,2],[4,2],[0,3],[1,3],[5,2],[4,2],[5,2],[5,2]],
  assassin:[[2,3],[3,3],[4,3],[2,3],[3,3],[4,3],[3,3],[4,3],[2,3],[4,3],[3,3],[4,3],[4,3]],
});
const ARMOR_TIER_ART = Object.freeze([[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[4,0],[5,0],[5,0],[5,0],[5,0]]);
const RING_TIER_ART = Object.freeze([[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[4,3],[5,3],[5,3],[5,3]]);
function equipmentTierIndex(min, thresholds) {
  const value=Math.max(1,Number(min)||1); let idx=0;
  for(let i=0;i<thresholds.length;i++) if(value>=thresholds[i]) idx=i;
  return idx;
}
function equipmentArtSource(item) {
  if (!item || typeof item !== 'object') return null;
  const base=item.base && typeof item.base==='object' ? item.base : null;
  if (item.slot==='weapon' && base) {
    const row=WEAPON_TIER_ART[base.cls] || WEAPON_TIER_ART.warrior;
    const cell=row[equipmentTierIndex(base.min,WEAPON_ART_THRESHOLDS)] || row[0];
    return ['weapon',cell[0],cell[1]];
  }
  if (item.slot==='armor' && base) return ['wearable',...(ARMOR_TIER_ART[equipmentTierIndex(base.min,ARMOR_ART_THRESHOLDS)]||ARMOR_TIER_ART[0])];
  if (item.slot==='ring' && base) return ['wearable',...(RING_TIER_ART[equipmentTierIndex(base.min,RING_ART_THRESHOLDS)]||RING_TIER_ART[0])];
  return EQUIPMENT_SOURCE_BY_ICON[item.icon] || null;
}
function drawGroundEquipment(item, px, py, size=29) {
  const src=equipmentArtSource(item); if(!src) return false;
  const [sheetId,sx,sy]=src;
  const image=sheetId==='weapon' ? equipmentWeaponsV13 : equipmentWearablesV13;
  if(!imageReady(image)) return false;
  const cols=6, rows=sheetId==='weapon'?4:5, sw=image.naturalWidth/cols, sh=image.naturalHeight/rows;
  ctx.save(); ctx.imageSmoothingEnabled=false;
  ctx.shadowColor='rgba(0,0,0,.8)'; ctx.shadowBlur=6; ctx.shadowOffsetY=3;
  ctx.drawImage(image,sx*sw,sy*sh,sw,sh,px-size/2,py-size/2,size,size);
  ctx.restore(); return true;
}

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
const EXPEDITION_RULES = typeof window !== 'undefined' ? window.DE_EXPEDITION_RULES_V170 : null;
if (!EXPEDITION_RULES || EXPEDITION_RULES.authority !== 'expedition-variation-policy')
  throw new Error('Dungeon Echo expedition-variation-policy authority missing');
const currentExpeditionContractId = () => EXPEDITION_RULES.normalizeContractId(
  greedyMode && player && player.contractId ? player.contractId : 'none');
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
// SFX design: short envelopes + filtered transient/noise + tonal body, mixed through a private
// compressor/master bus. The recipes stay synthetic and original; no third-party audio assets.
let audioCtx = null, sfxMaster = null, sfxCompressor = null, sfxNoiseBuffer = null;
function applySfxMix() {
  if (!audioCtx || !sfxMaster) return;
  const target = audioPrefs.muted ? 0 : audioPrefs.sfx;
  const now = audioCtx.currentTime;
  try {
    sfxMaster.gain.cancelScheduledValues(now);
    sfxMaster.gain.setTargetAtTime(target, now, .025);
  } catch (e) { sfxMaster.gain.value = target; }
}
function buildSfxNoise() {
  if (!audioCtx || sfxNoiseBuffer) return;
  const frames = Math.max(1, Math.floor(audioCtx.sampleRate * .42));
  const buffer = audioCtx.createBuffer(1, frames, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 0x51f15e ^ frames;
  for (let i = 0; i < data.length; i++) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    data[i] = ((seed >>> 0) / 4294967295) * 2 - 1;
  }
  sfxNoiseBuffer = buffer;
}
function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      sfxMaster = audioCtx.createGain();
      sfxCompressor = audioCtx.createDynamicsCompressor();
      sfxCompressor.threshold.value = -18;
      sfxCompressor.knee.value = 18;
      sfxCompressor.ratio.value = 4;
      sfxCompressor.attack.value = .004;
      sfxCompressor.release.value = .14;
      sfxMaster.connect(sfxCompressor);
      sfxCompressor.connect(audioCtx.destination);
      buildSfxNoise();
      applySfxMix();
    } catch (e) { audioCtx = null; sfxMaster = null; sfxCompressor = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    try { audioCtx.resume(); } catch (e) { /* ignore */ }
  }
}
function toneLayer(freq, dur, opts={}) {
  if (audioPrefs.muted || audioPrefs.sfx <= 0 || !audioCtx || !sfxMaster) return;
  try {
    const at = audioCtx.currentTime + Math.max(0, Number(opts.delay) || 0);
    const attack = Math.max(.002, Number(opts.attack) || .004);
    const peak = Math.max(.0002, Number(opts.gain) || .035);
    const end = at + Math.max(.02, dur);
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const amp = audioCtx.createGain();
    osc.type = opts.type || 'triangle';
    osc.frequency.setValueAtTime(Math.max(28, freq), at);
    if (opts.endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(28, opts.endFreq), end);
    filter.type = opts.filterType || 'lowpass';
    filter.frequency.setValueAtTime(Math.max(90, Number(opts.cutoff) || 1800), at);
    filter.Q.value = Math.max(.1, Number(opts.q) || .7);
    amp.gain.setValueAtTime(.0001, at);
    amp.gain.exponentialRampToValueAtTime(peak, at + attack);
    amp.gain.exponentialRampToValueAtTime(.0001, end);
    osc.connect(filter); filter.connect(amp); amp.connect(sfxMaster);
    osc.start(at); osc.stop(end + .025);
  } catch (e) { /* ignore individual voice failure */ }
}
function noiseLayer(dur, opts={}) {
  if (audioPrefs.muted || audioPrefs.sfx <= 0 || !audioCtx || !sfxMaster) return;
  try {
    buildSfxNoise();
    const at = audioCtx.currentTime + Math.max(0, Number(opts.delay) || 0);
    const end = at + Math.max(.02, dur);
    const src = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const amp = audioCtx.createGain();
    src.buffer = sfxNoiseBuffer;
    filter.type = opts.filterType || 'bandpass';
    filter.frequency.setValueAtTime(Math.max(90, Number(opts.freq) || 900), at);
    filter.Q.value = Math.max(.15, Number(opts.q) || .8);
    amp.gain.setValueAtTime(.0001, at);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0002, Number(opts.gain) || .025), at + .003);
    amp.gain.exponentialRampToValueAtTime(.0001, end);
    src.connect(filter); filter.connect(amp); amp.connect(sfxMaster);
    src.start(at); src.stop(end + .02);
  } catch (e) { /* ignore individual transient failure */ }
}
function delayedSfx(ms, fn) { setTimeout(() => { if (!audioPrefs.muted) fn(); }, ms); }
const sfx = {
  hit() {
    const kind = arguments[0] || 'warrior';
    if (kind === 'ranger') {
      noiseLayer(.036, { freq:2450, q:1.2, gain:.025 });
      toneLayer(310, .065, { endFreq:180, type:'square', gain:.024, cutoff:1500 });
    } else if (kind === 'mage') {
      toneLayer(510, .10, { endFreq:820, type:'sine', gain:.032, cutoff:2800 });
      noiseLayer(.055, { freq:1750, q:.8, gain:.018 });
    } else if (kind === 'assassin') {
      noiseLayer(.045, { freq:3100, q:1.4, gain:.030 });
      toneLayer(220, .07, { endFreq:110, type:'sawtooth', gain:.022, cutoff:1300 });
    } else {
      toneLayer(138, .085, { endFreq:82, type:'triangle', gain:.045, cutoff:900 });
      noiseLayer(.050, { freq:1050, q:.72, gain:.028 });
    }
  },
  crit() {
    const kind = arguments[0] || 'warrior';
    this.hit(kind);
    toneLayer(kind === 'mage' ? 980 : 720, .12, { endFreq:330, type:'sine', gain:.032, cutoff:3000, delay:.012 });
    noiseLayer(.085, { freq:1850, q:.9, gain:.044 });
  },
  hurt() {
    toneLayer(92, .16, { endFreq:54, type:'sine', gain:.052, cutoff:650 });
    noiseLayer(.105, { freq:360, q:.65, gain:.030 });
  },
  kill(boss=false) {
    toneLayer(boss ? 82 : 110, boss ? .28 : .15, { endFreq:48, type:'triangle', gain:boss ? .058 : .038, cutoff:720 });
    noiseLayer(boss ? .18 : .09, { freq:boss ? 420 : 780, q:.65, gain:boss ? .042 : .026 });
  },
  dodge() {
    noiseLayer(.06, { freq:2700, q:1.1, gain:.018 });
    toneLayer(540, .085, { endFreq:880, type:'sine', gain:.018, cutoff:3000 });
  },
  warning() {
    toneLayer(180, .12, { endFreq:145, type:'square', gain:.028, cutoff:900 });
    delayedSfx(105, () => toneLayer(180, .12, { endFreq:145, type:'square', gain:.028, cutoff:900 }));
  },
  pickup() {
    toneLayer(740, .10, { endFreq:900, type:'sine', gain:.024, cutoff:2600 });
    delayedSfx(62, () => toneLayer(1046, .12, { type:'sine', gain:.020, cutoff:3000 }));
  },
  potion() {
    noiseLayer(.14, { freq:1250, q:.55, gain:.018 });
    toneLayer(410, .18, { endFreq:680, type:'sine', gain:.026, cutoff:2200, delay:.02 });
  },
  levelup() {
    [523,659,784,1046].forEach((f,i) => delayedSfx(i*82, () => toneLayer(f,.15,{type:'sine',gain:.026,cutoff:3000})));
  },
  stairs() {
    noiseLayer(.18, { freq:680, q:.55, gain:.020 });
    toneLayer(380, .24, { endFreq:155, type:'triangle', gain:.032, cutoff:1200 });
  },
  die() {
    noiseLayer(.30, { freq:240, q:.5, gain:.032 });
    toneLayer(190, .48, { endFreq:48, type:'triangle', gain:.060, cutoff:700 });
  },
  win() {
    [523,659,784,1046,1318].forEach((f,i) => delayedSfx(i*105, () => toneLayer(f,.20,{type:'sine',gain:.025,cutoff:3300})));
  },
  equip() {
    noiseLayer(.045, { freq:2100, q:1.1, gain:.018 });
    toneLayer(510, .09, { endFreq:620, type:'triangle', gain:.022, cutoff:2500 });
  },
  skill() {
    noiseLayer(.18, { freq:1450, q:.55, gain:.024 });
    toneLayer(260, .22, { endFreq:620, type:'sine', gain:.030, cutoff:2000 });
    toneLayer(760, .14, { endFreq:520, type:'triangle', gain:.018, cutoff:2800, delay:.025 });
  },
  shop() {
    toneLayer(660, .10, { type:'sine', gain:.023, cutoff:2800 });
    delayedSfx(74, () => toneLayer(990,.12,{type:'sine',gain:.018,cutoff:3200}));
  },
  chest() {
    toneLayer(116, .11, { endFreq:72, type:'triangle', gain:.040, cutoff:700 });
    noiseLayer(.055, { freq:1850, q:.85, gain:.022, delay:.035 });
    delayedSfx(92, () => toneLayer(440,.10,{endFreq:560,type:'sine',gain:.018,cutoff:2400}));
  },
};
function syncAudioControls() {
  const music = $('audio-music'), sfxInput = $('audio-sfx');
  const musicOut = $('audio-music-value'), sfxOut = $('audio-sfx-value');
  if (music) music.value = String(Math.round(audioPrefs.music * 100));
  if (sfxInput) sfxInput.value = String(Math.round(audioPrefs.sfx * 100));
  if (musicOut) musicOut.textContent = `${Math.round(audioPrefs.music * 100)}%`;
  if (sfxOut) sfxOut.textContent = `${Math.round(audioPrefs.sfx * 100)}%`;
  const master = $('audio-master');
  if (master) {
    master.textContent = audioPrefs.muted ? ui('总静音：开','Master Mute: On') : ui('总静音：关','Master Mute: Off');
    master.setAttribute('aria-pressed', String(audioPrefs.muted));
  }
  const haptics = $('audio-haptics');
  if (haptics) {
    haptics.textContent = audioPrefs.haptics ? ui('触觉反馈：开','Haptics: On') : ui('触觉反馈：关','Haptics: Off');
    haptics.setAttribute('aria-pressed', String(audioPrefs.haptics));
  }
}
function setAudioMix(kind, percent) {
  if (kind !== 'music' && kind !== 'sfx') return;
  audioPrefs = { ...audioPrefs, [kind]:clampAudio01(Number(percent) / 100) };
  saveAudioPrefs();
  if (kind === 'sfx') applySfxMix();
  syncAudioControls();
  broadcastAudioPrefs();
}
function setAudioMuted(value, announce=true) {
  audioPrefs = { ...audioPrefs, muted:!!value };
  saveAudioPrefs();
  applySfxMix();
  syncAudioControls();
  broadcastAudioPrefs();
  if (announce) msg(audioPrefs.muted ? ui('声音已静音。','Audio muted.') : ui('声音已恢复。','Audio restored.'));
}
function toggleAudioMuted(announce=true) { setAudioMuted(!audioPrefs.muted, announce); }
function toggleHaptics() {
  audioPrefs = { ...audioPrefs, haptics:!audioPrefs.haptics };
  saveAudioPrefs(); syncAudioControls(); broadcastAudioPrefs();
  if (audioPrefs.haptics) haptic(24);
  msg(audioPrefs.haptics ? ui('触觉反馈已开启。','Haptics enabled.') : ui('触觉反馈已关闭。','Haptics disabled.'));
}
function resetAudioMix() {
  audioPrefs = { v:AUDIO_PREF_VERSION, ...AUDIO_DEFAULTS, haptics:audioPrefs.haptics };
  saveAudioPrefs(); applySfxMix(); syncAudioControls(); broadcastAudioPrefs();
  sfx.pickup();
  msg(ui('声音已恢复推荐混音：音乐 60% / 音效 78%。','Recommended mix restored: Music 60% / SFX 78%.'), 'good');
}

// ================= 状态 =================
let map, explored, visible;
let player, monsters = [], items = [], npcs = [], traps = [], secrets = [];
let depth, turns, state;
let classId = 'warrior';
let logLines = [];
const floaters = [], particles = [], arrows = [], impactFx = [];
let trauma = 0, hitstop = 0, hurtFlash = 0;
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
function resetCombatPresentation() {
  floaters.length = 0; particles.length = 0; arrows.length = 0; impactFx.length = 0;
  trauma = 0; hitstop = 0; hurtFlash = 0;
}
function playerImpactCue(severe=false) {
  hurtFlash = Math.max(hurtFlash, severe ? .72 : .48);
  addHitstop(severe ? .055 : .035);
  haptic(severe ? [28, 22, 42] : 22);
}

// ================= 消息 =================
function renderLog() {
  const logEl = $('log');
  if (logEl) logEl.innerHTML = logLines
    .map(l => `<div${l.cls ? ` class="${esc(l.cls)}"` : ''}>${esc(l.text)}</div>`).join('');
}
function msg(text, cls, meta=null) {
  logLines.unshift({ text, cls, ...(meta || {}) });
  if (logLines.length > 30) logLines.pop();
  renderLog();
}
function incomingCombatMsg(text, damage) {
  const head = logLines[0];
  const dmg = Math.max(0, Math.round(Number(damage) || 0));
  if (head && head.kind === 'incoming-combat' && head.turn === turns) {
    head.count = (head.count || 1) + 1;
    head.damage = (head.damage || 0) + dmg;
    head.text = ui(
      `本回合敌人连续命中 ${head.count} 次，共 ${head.damage} 点伤害。`,
      `Enemies hit ${head.count} times this turn for ${head.damage} total damage.`
    );
    head.cls = 'combat-danger';
    renderLog();
    return;
  }
  msg(text, 'combat-danger', { kind:'incoming-combat', turn:turns, count:1, damage:dmg });
}
const rarityLogCls = r => r >= 4 ? 'gold' : r === 3 ? 'epic' : 'good';

// ================= 特效 =================
function floater(ent, text, color, scale=1) {
  floaters.push({ x: ent.fx * TILE + TILE / 2, y: ent.fy * TILE, text, color, scale, life: 1 });
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
function fireArrow(x0, y0, x1, y1, kind='arrow') {
  arrows.push({
    x0: x0 * TILE + TILE / 2, y0: y0 * TILE + TILE / 2,
    x1: x1 * TILE + TILE / 2, y1: y1 * TILE + TILE / 2,
    t: 0, dur: 0.16, kind,
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
const THEME_MOTIFS = Object.freeze([
  'masonry','moss','vein','ember','frost','ripple','rune','forge','web','star','crack',
  'vein','frost','ember','rune','bone','star','dark','crack','rune','dark',
]);
function paintThemeMotif(g, motif, r, t, variant = 0) {
  g.save();
  g.globalAlpha = .34 + variant * .035;
  g.strokeStyle = t.sp2; g.fillStyle = t.sp2; g.lineWidth = 1.15;
  const line = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); g.stroke(); };
  if (motif === 'masonry') {
    for (let y=8;y<TILE;y+=8) { line([[2,y+.5],[TILE-2,y+.5]]); const x=((y/8+variant)%2?10:20); line([[x,y-8],[x,y]]); }
  } else if (motif === 'moss') {
    for (let i=0;i<6;i++) { const x=4+r()*(TILE-8), y=5+r()*(TILE-10); g.beginPath(); g.arc(x,y,1.3+r()*2,0,Math.PI*2); g.fill(); }
  } else if (motif === 'vein') {
    line([[3,25],[10+r()*4,18],[18+r()*3,20],[29,7]]); line([[15,19],[11,9]]);
  } else if (motif === 'ember') {
    for (let i=0;i<7;i++) { const x=4+r()*24,y=5+r()*22; g.globalAlpha=.18+r()*.34; g.fillRect(x,y,1.5+r()*2,1.5+r()*2); }
  } else if (motif === 'frost') {
    const cx=10+r()*12, cy=10+r()*12; for (let a=0;a<Math.PI;a+=Math.PI/3) { const dx=Math.cos(a)*8,dy=Math.sin(a)*8; line([[cx-dx,cy-dy],[cx+dx,cy+dy]]); }
  } else if (motif === 'ripple') {
    for (let i=0;i<3;i++) { g.beginPath(); g.ellipse(16,16,5+i*5,2+i*2.2,.2,0,Math.PI*2); g.stroke(); }
  } else if (motif === 'rune') {
    line([[7,24],[12,7],[18,23],[24,8]]); line([[10,16],[21,16]]);
  } else if (motif === 'forge') {
    g.strokeRect(6.5,6.5,19,19); for (const [x,y] of [[9,9],[23,9],[9,23],[23,23]]) { g.beginPath(); g.arc(x,y,1.5,0,Math.PI*2); g.fill(); }
  } else if (motif === 'web') {
    const cx=7+variant*4,cy=7; for (const [x,y] of [[30,6],[30,28],[7,30],[18,30]]) line([[cx,cy],[x,y]]); for (let rr=7;rr<23;rr+=6) { g.beginPath(); g.arc(cx,cy,rr,0,Math.PI*.65); g.stroke(); }
  } else if (motif === 'star') {
    for (let i=0;i<6;i++) { const x=4+r()*24,y=4+r()*24; g.fillRect(x,y,1.5,1.5); if (i<2) { line([[x-3,y],[x+4,y]]); line([[x,y-3],[x,y+4]]); } }
  } else if (motif === 'crack') {
    line([[4,5],[12,13],[9,20],[20,27],[28,21]]); line([[12,13],[21,10]]);
  } else if (motif === 'bone') {
    for (let i=0;i<3;i++) { const x=5+r()*20,y=7+r()*18; line([[x,y],[x+7,y+3]]); g.beginPath(); g.arc(x,y,1.5,0,Math.PI*2); g.arc(x+7,y+3,1.5,0,Math.PI*2); g.stroke(); }
  } else if (motif === 'dark') {
    for (let i=0;i<3;i++) { g.beginPath(); g.arc(7+r()*18,7+r()*18,2+r()*5,0,Math.PI*2); g.stroke(); }
  }
  g.restore();
}
function buildThemeTex(depthVal) {
  const ti = themeIdx(depthVal);
  if (TEXC[ti]) return;
  const t = THEMES[ti];
  // Presentation construction owns a theme-local RNG. Building a Canvas must never advance
  // gameplay RNG or alter future rooms, drops, combat rolls or equipment.
  const texRng = makeRng(hashSeed(`theme-texture:${ti}`));
  const tr = () => texRng();
  const motif = THEME_MOTIFS[ti] || 'masonry';
  const floors = [];
  for (let v = 0; v < 4; v++) {
    const c = document.createElement('canvas'); c.width = c.height = TILE;
    const g = c.getContext('2d');
    g.fillStyle = v % 2 ? t.fl2 : t.fl; g.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 18; i++) {
      g.fillStyle = tr() < .5 ? t.sp1 : t.sp2;
      g.fillRect(Math.floor(tr()*TILE), Math.floor(tr()*TILE), 2 + Math.floor(tr()*2), 2);
    }
    paintThemeMotif(g, motif, tr, t, v);
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
  paintThemeMotif(g, motif, tr, t, 1);
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
function weaponBaseForDrop(d) {
  // World loot belongs to the dungeon, not to the selected hero class. Pick an available
  // weapon family first, then a depth-appropriate base inside that family. Class Fit remains
  // decision information only and never feeds back into generation.
  const families = [...new Set(WEAPON_BASES.map(b => b.cls).filter(Boolean))]
    .filter(cid => WEAPON_BASES.some(b => b.cls === cid && d >= b.min));
  if (!families.length) {
    const pool = WEAPON_BASES.filter(b => d >= b.min);
    return pool.length ? pick(pool) : WEAPON_BASES[0];
  }
  const family = pick(families);
  const pool = WEAPON_BASES.filter(b => b.cls === family && d >= b.min);
  return pool[Math.max(0, pool.length - 1 - rnd(Math.min(2, pool.length)))];
}
// 装备评分：由唯一 equipment-stat-scoring 权威提供；core 只消费结果。
const INVENTORY_RULES = typeof window !== 'undefined' ? window.DE_INVENTORY_RULES_V130 : null;
if (!INVENTORY_RULES || INVENTORY_RULES.authority !== 'equipment-stat-scoring')
  throw new Error('Dungeon Echo equipment-stat-scoring authority missing');
const SET_RULES = typeof window !== 'undefined' ? window.DE_SET_RULES_V180 : null;
if (!SET_RULES || SET_RULES.authority !== 'named-set-policy')
  throw new Error('Dungeon Echo named-set-policy authority missing');
const eqScoreOf = stats => INVENTORY_RULES.equipmentStatScore(stats);
function starterWeaponForClass(targetClass) {
  const base = WEAPON_BASES.find(b => b.cls === targetClass && Number(b.min) <= 1) || WEAPON_BASES.find(b => b.cls === targetClass);
  if (!base) return null;
  const stats = { atk: Math.max(1, Number(base.atk) || 1) };
  return {
    slot:'weapon', base:{ ...base }, rarity:0, affixes:[], stats,
    spr:WEAPON_SPR_BY_ICON[base.icon] || 'sword', icon:base.icon,
    name:`${RARITIES[0].name}·${base.name}`, score:eqScoreOf(stats), starter:true,
  };
}
const weaponClassOf = item => typeof INVENTORY_RULES.weaponClassForItem === 'function'
  ? INVENTORY_RULES.weaponClassForItem(item) : (item && item.base && item.base.cls) || null;
const canEquipForClass = (item, targetClass=classId) => typeof INVENTORY_RULES.canEquipItem === 'function'
  ? INVENTORY_RULES.canEquipItem(item, targetClass) : !(item && item.slot === 'weapon' && weaponClassOf(item) && weaponClassOf(item) !== targetClass);
const classFitOf = (item, targetClass=classId) => {
  if (!item || typeof item !== 'object') return 0;
  if (typeof INVENTORY_RULES.itemClassFitScore === 'function') return INVENTORY_RULES.itemClassFitScore(item, targetClass);
  if (!canEquipForClass(item, targetClass)) return 0;
  return typeof INVENTORY_RULES.classFitScore === 'function'
    ? INVENTORY_RULES.classFitScore(item.stats || {}, targetClass)
    : eqScoreOf(item.stats || {});
};
function weaponRequirementText(item) {
  const required = weaponClassOf(item);
  if (!required) return '';
  const className = CLASSES[required] ? CLASSES[required].name : required;
  return canEquipForClass(item)
    ? ui(`武器专精：${className}`, `Weapon proficiency: ${className}`)
    : ui(`需要 ${className} 专精 · 当前职业无法装备`, `Requires ${className} proficiency · your current class cannot equip it`);
}
// 锻造：主属性成长表与上限
const FORGE_MAX = 5;
const FORGE_MAIN = {
  weapon: ['atk', 2], armor: ['def', 2], ring: ['hp', 4],
  helmet: ['def', 2], boots: ['hp', 4], amulet: ['crit', 3],
};
const FORGE_REFINEMENT_PATHS = Object.freeze({
  weapon: Object.freeze([
    Object.freeze({ id:'keen', zh:'锋锐', en:'Keen', zhDesc:'更稳定地走暴击路线。', enDesc:'Commit the weapon to a steadier critical-hit route.', refine:{crit:4}, master:{crit:4} }),
    Object.freeze({ id:'blooded', zh:'饮血', en:'Blooded', zhDesc:'用持续吸血换取推进续航。', enDesc:'Trade raw burst for sustained leech while pushing deeper.', refine:{leech:3}, master:{leech:3} }),
  ]),
  armor: Object.freeze([
    Object.freeze({ id:'bastion', zh:'壁垒', en:'Bastion', zhDesc:'把生存重心转向生命，而不是继续堆纯护甲。', enDesc:'Shift survivability toward HP instead of stacking only armor.', refine:{hp:20}, master:{hp:20} }),
    Object.freeze({ id:'barbed', zh:'荆棘', en:'Barbed', zhDesc:'近战换血时获得更强反伤收益。', enDesc:'Gain stronger thorns value when trading hits in melee.', refine:{thorns:5}, master:{thorns:5} }),
  ]),
  helmet: Object.freeze([
    Object.freeze({ id:'vital', zh:'生息', en:'Vital', zhDesc:'扩大生命池，提高失误容错。', enDesc:'Expand the HP pool to increase room for mistakes.', refine:{hp:18}, master:{hp:18} }),
    Object.freeze({ id:'restoring', zh:'回春', en:'Restoring', zhDesc:'强化击杀后的长期续航。', enDesc:'Strengthen long-run sustain after kills.', refine:{regen:3}, master:{regen:2} }),
  ]),
  boots: Object.freeze([
    Object.freeze({ id:'stout', zh:'稳步', en:'Stout', zhDesc:'以生命换取稳定推进。', enDesc:'Use extra HP to make forward progress more forgiving.', refine:{hp:16}, master:{hp:16} }),
    Object.freeze({ id:'hunter', zh:'猎步', en:'Hunter', zhDesc:'轻量暴击方向，适合主动拉扯构筑。', enDesc:'A light crit route for active kiting builds.', refine:{crit:3}, master:{crit:3} }),
  ]),
  ring: Object.freeze([
    Object.freeze({ id:'precision', zh:'洞察', en:'Precision', zhDesc:'把戒指定型为暴击核心。', enDesc:'Turn the ring into a critical-hit centerpiece.', refine:{crit:5}, master:{crit:5} }),
    Object.freeze({ id:'sanguine', zh:'血契', en:'Sanguine', zhDesc:'把戒指定型为吸血续航核心。', enDesc:'Turn the ring into a leech-and-sustain centerpiece.', refine:{leech:4}, master:{leech:4} }),
  ]),
  amulet: Object.freeze([
    Object.freeze({ id:'fury', zh:'狂意', en:'Fury', zhDesc:'直接强化攻击，适合高压输出路线。', enDesc:'Directly increase ATK for high-pressure damage routes.', refine:{atk:3}, master:{atk:3} }),
    Object.freeze({ id:'focus', zh:'凝神', en:'Focus', zhDesc:'把项链定型为暴击/爆发方向。', enDesc:'Commit the amulet to a crit-and-burst route.', refine:{crit:5}, master:{crit:5} }),
  ]),
});
function forgeRefinementPath(item) {
  const rows = FORGE_REFINEMENT_PATHS[item && item.slot] || [];
  return rows.find(row => row.id === item.refinePath) || null;
}
function addForgeStats(item, stats) {
  if (!item || !stats) return;
  item.stats = item.stats || {};
  for (const [key, value] of Object.entries(stats)) item.stats[key] = (Number(item.stats[key]) || 0) + Number(value || 0);
  item.score = eqScoreOf(item.stats);
}
function applyForgeMasterwork(item) {
  if (!item || item.masterworked || (Number(item.forge) || 0) < FORGE_MAX) return null;
  const path = forgeRefinementPath(item);
  if (!path) return null;
  addForgeStats(item, path.master);
  item.masterworked = true;
  item.masterworkVersion = 1;
  return path;
}
// 决策评分与经济价值严格分离：item.score 是通用属性分；classFitOf() 回答“是否适合当前职业”；
// itemValueScore() 回答“物品本身值多少”。class fit 不得进入售价、掉落或自动装备逻辑。
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
if (!ECONOMY_RULES || ECONOMY_RULES.authority !== 'economy-pricing')
  throw new Error('Dungeon Echo economy-pricing authority missing');
const TOWN_RULES = typeof window !== 'undefined' ? window.DE_TOWN_RULES_V130 : null;
if (!TOWN_RULES || TOWN_RULES.authority !== 'town-checkpoint-readiness-policy')
  throw new Error('Dungeon Echo town-checkpoint-readiness-policy authority missing');
const TOWN_GROWTH_RULES = typeof window !== 'undefined' ? window.DE_TOWN_GROWTH_RULES_V180 : null;
if (!TOWN_GROWTH_RULES || TOWN_GROWTH_RULES.authority !== 'town-growth-policy')
  throw new Error('Dungeon Echo town-growth-policy authority missing');
const currentTownWorks = () => greedyMode && meta && meta.townWorks ? meta.townWorks : {};
const townWorkLevel = id => TOWN_GROWTH_RULES.level(currentTownWorks(), id);
const relicLedgerCount = () => meta && meta.relicLedger
  ? Object.keys(meta.relicLedger).filter(key => meta.relicLedger[key]).length : 0;
const forgeCost = it => ECONOMY_RULES.forgeCost(
  itemValueScore(it), it.forge || 0, TOWN_GROWTH_RULES.forgeDiscount(currentTownWorks()));
const sellPrice = it => ECONOMY_RULES.sellPrice(itemValueScore(it), it.forge || 0);
function genEquip(d, minRarity = 0) {
  const roll = rng();
  // 六栏位分布：武器 .30 护甲 .25 头盔 .15 靴 .15 戒指 .10 项链 .05
  const slot = roll < .30 ? 'weapon' : roll < .55 ? 'armor' : roll < .70 ? 'helmet' :
    roll < .85 ? 'boots' : roll < .95 ? 'ring' : 'amulet';
  const bases = slot === 'armor' ? ARMOR_BASES :
    slot === 'helmet' ? HELMET_BASES :
    slot === 'boots' ? BOOT_BASES :
    slot === 'ring' ? RING_BASES : AMULET_BASES;
  const pool = slot === 'weapon' ? null : bases.filter(b => d >= b.min);
  let base = slot === 'weapon' ? weaponBaseForDrop(d) :
    pool[Math.max(0, pool.length - 1 - rnd(Math.min(2, pool.length)))];
  const rarity = rollRarity(minRarity);
  const namedHash = hashSeed([RUN_SEED, d, slot, rarity, base && base.name, classId].join('|'));
  const namedRoll = (namedHash >>> 0) / 4294967295;
  const namedSet = namedRoll < SET_RULES.namedChance(rarity, TOWN_GROWTH_RULES.relicChanceBonus(currentTownWorks()))
    ? SET_RULES.chooseSet(d, namedHash, meta && meta.relicFocusSet, townWorkLevel('relics')) : null;
  // Named set weapons are relics for the active hero, not anonymous world weapon-family noise.
  if (namedSet && slot === 'weapon') {
    const own = WEAPON_BASES.filter(b => b.cls === classId && d >= b.min);
    if (own.length) base = own[Math.max(0, own.length - 1 - (Math.abs(namedHash) % Math.min(2, own.length)))];
  }
  const stats = {};
  if (base.atk) stats.atk = base.atk;
  if (base.def) stats.def = base.def;
  if (base.hp)  stats.hp = base.hp;
  if (base.crit) stats.crit = base.crit;
  const affixes = [];
  // A named relic leads with its identity and fixed signature; keep at most one random secondary affix
  // so the item does not collapse back into a stack of unrelated stat lines.
  const affixCount = namedSet ? Math.min(1, RARITIES[rarity].affixes) : RARITIES[rarity].affixes;
  for (let i = 0; i < affixCount; i++) {
    const a = genAffix(d);
    affixes.push(a);
    stats[a.k] = (stats[a.k] || 0) + a.v;
  }
  const signatureStats = namedSet ? SET_RULES.signatureStats(namedSet.id, slot, d) : null;
  if (signatureStats) for (const [k, v] of Object.entries(signatureStats)) stats[k] = (stats[k] || 0) + (Number(v) || 0);
  const spr = slot === 'weapon'
    ? (WEAPON_SPR_BY_ICON[base.icon] || 'sword')
    : slot === 'armor' ? 'armor' : slot === 'ring' ? 'ring' : 'trinket';
  const mechanic = namedSet ? null : mechanicForFreshItem(slot, rarity, d, base, affixes);
  const mechanicName = mechanic ? ` · ${MECHANIC_TRAITS[mechanic.id].name}` : '';
  const namedPiece = namedSet ? SET_RULES.piece(namedSet.id, slot, classId) : null;
  return {
    slot, base, rarity, affixes, stats, spr, icon: base.icon,
    ...(mechanic ? { mechanic: mechanic.id, mechanicPower: mechanic.power } : {}),
    ...(namedPiece ? {
      namedSet:true, setId:namedPiece.setId, setPiece:namedPiece.slot,
      namedEn:namedPiece.en, loreZh:namedPiece.zhLore, loreEn:namedPiece.enLore,
      setNameZh:namedPiece.setNameZh, setNameEn:namedPiece.setNameEn,
      signatureStats:{ ...(signatureStats || {}) },
    } : {}),
    name: namedPiece ? namedPiece.zh : `${RARITIES[rarity].name}·${base.name}${mechanicName}`,
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
const namedSetStats = () => SET_RULES.statBonuses(player && player.equip ? player.equip : {});
const setStat = k => Number(namedSetStats()[k]) || 0;
const pMaxHp = () => player.hpBase + eqStat('hp');
const pAtk   = () => player.atkBase + eqStat('atk');
// 战士被动「坚甲」：天生扁平减伤，随等级成长（1级+1，每5级+1）——近战换血的生存根基
const warriorDr = () => (classId === 'warrior' ? 1 + Math.floor((player.lvl - 1) / 5) : 0);
const pArmor = () => eqStat('def');
const pFixedDr = () => (player.flatDr || 0) + warriorDr() + setStat('fixedDr');
const pDef = () => pArmor() + pFixedDr();
const mitigatePlayerHit = (raw, armorScale = 1, ignoreArmor = false) => {
  const armor = ignoreArmor ? 0 : Math.floor(pArmor() * Math.max(0, armorScale));
  return Math.max(1, Math.round(raw) - armor - pFixedDr());
};
const pCrit  = () => {
  const crisis = mechanicPower('crisis');
  const crisisBonus = crisis && player.hp <= pMaxHp() * 0.40 ? (crisis >= 2 ? 20 : 12) : 0;
  return 5 + (classDef().critBase || 0) + (player.critBase || 0) + eqStat('crit') + setStat('crit') + crisisBonus;
};
const pLeech = () => (player.leechBase || 0) + eqStat('leech') + setStat('leech');
const pGoldBonus = () => (player.goldFind || 0) + eqStat('gold');
const pThorns   = () => (player.thornsBase || 0) + eqStat('thorns');
const pKillHeal = () => (player.regenBase || 0) + eqStat('regen') + setStat('regen');
const COMBAT_RULES = typeof window !== 'undefined' ? window.DE_COMBAT_RULES_V130 : null;
if (!COMBAT_RULES || COMBAT_RULES.authority !== 'critical-damage-multiplier')
  throw new Error('Dungeon Echo critical-damage-multiplier authority missing');
const pCritMul  = () => COMBAT_RULES.criticalMultiplier((player.critPower || 0) + setStat('critPower'));
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
function ensurePlayerMana(p=player, cid=classId) {
  if (!p) return null;
  const rule = manaRuleFor(cid);
  p.manaMax = rule.max;
  const current = Number(p.mana);
  p.mana = Number.isFinite(current) ? clamp(Math.round(current), 0, p.manaMax) : p.manaMax;
  return p;
}
const skillManaCost = () => manaRuleFor(classId).cost;
function recoverMana(extra=0, announceFocus=false) {
  if (!player) return 0;
  ensurePlayerMana();
  const rule = manaRuleFor(classId);
  const before = player.mana;
  player.mana = clamp(player.mana + rule.regen + Math.max(0, Math.round(Number(extra) || 0)), 0, player.manaMax);
  const gain = player.mana - before;
  if (announceFocus && gain > 0) msg(ui(`凝神恢复 ${gain} 点蓝量。`, `Focus restored ${gain} Mana.`), 'good');
  return gain;
}
function spendMana(amount) {
  if (!player) return false;
  ensurePlayerMana();
  const cost = Math.max(0, Math.round(Number(amount) || 0));
  if (player.mana < cost) return false;
  player.mana -= cost;
  return true;
}
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

function npcPlacementKeepsFloorConnected(x, y) {
  const blocked = (bx, by) =>
    (bx === x && by === y) || !!npcAt(bx, by);
  const seen = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  const q = [[player.x, player.y]];
  if (blocked(player.x, player.y) || map[player.y][player.x] === WALL) return false;
  seen[player.y][player.x] = true;
  for (let qi = 0; qi < q.length; qi++) {
    const [cx, cy] = q[qi];
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + ox, ny = cy + oy;
      if (!inB(nx, ny) || seen[ny][nx] || map[ny][nx] === WALL || blocked(nx, ny)) continue;
      seen[ny][nx] = true;
      q.push([nx, ny]);
    }
  }
  let open = 0;
  for (let cy = 0; cy < MAP_H; cy++)
    for (let cx = 0; cx < MAP_W; cx++)
      if (map[cy][cx] !== WALL && !blocked(cx, cy)) open++;
  return q.length === open;
}

function pickNpcSpawn(rooms, minDist) {
  const all = listWalkTiles(false).filter(p => !tileTaken(p.x, p.y) &&
    !(p.x === player.x && p.y === player.y));
  const distant = all.filter(p =>
    Math.abs(p.x - player.x) + Math.abs(p.y - player.y) >= minDist);
  const inRooms = p => rooms.some(r =>
    p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
  for (const pool of [
    distant.filter(inRooms), distant, all.filter(inRooms), all,
  ]) {
    const safe = pool.filter(p => npcPlacementKeepsFloorConnected(p.x, p.y));
    if (safe.length) return pick(safe);
  }
  return null;
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
    spawnExpeditionEvent(rooms);
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

function monsterThreatScale(d, elite=false, bossLike=false) {
  if (bossLike) return 1;
  // v1.7 threat pass: keep ordinary enemies relevant through the whole descent
  // without touching authored guardian/final-boss ATK.
  const depthThreat = 0.07 + Math.min(0.17, Math.max(0, Number(d) - 1) * 0.00175);
  return 1 + depthThreat + (elite ? 0.06 : 0);
}
function makeMonster(base, p, options={}) {
  const FR = RUN_PROFILE.floorRules;
  const traits = (base.traits || []).slice();
  const contractId = currentExpeditionContractId();
  const eliteRollChance = EXPEDITION_RULES.eliteChance(FR.eliteChance, contractId);
  const elite = !base.boss && !base.midBoss && (!!options.forceElite || rng() < eliteRollChance);
  let scale = 1;
  if (!base.boss && !base.midBoss && typeof base.min === 'number') {
    const band = clamp((depth - base.min) / Math.max(1, base.max - base.min), 0, 1);
    scale = 1 + band * FR.depthScaleMax;
  }
  if (player && player.echoMode && depth > MAX_DEPTH) {
    scale *= 1 + (depth - MAX_DEPTH) * 0.08;
  }
  const bossLike = !!(base.boss || base.midBoss);
  const contractAtk = !bossLike ? EXPEDITION_RULES.monsterAtkMultiplier(contractId) : 1;
  const threatScale = monsterThreatScale(depth, elite, bossLike);
  const atkValue = Math.round(base.atk * (elite ? FR.eliteAtkMult : 1) * scale * contractAtk * threatScale);
  const normalPressure = base.boss || base.midBoss ? 1 : 1.70 + Math.min(0.30, Math.max(0, depth - 1) * 0.0031);
  const hpPressure = elite ? normalPressure * 0.86 : normalPressure;
  const defPressure = base.boss || base.midBoss ? Number(base.def) || 0 :
    Math.max(0, Math.round((Number(base.def) || 0) * scale * (elite ? 1.22 : 1) + Math.floor(depth / 16)));
  const m = {
    ...base,
    traits,
    x: p.x, y: p.y, fx: p.x, fy: p.y,
    maxHp: Math.max(1, Math.round(base.hp * (elite ? FR.eliteHpMult : 1) * scale * hpPressure)),
    def: defPressure,
    atk: atkValue,
    atkOrigin: atkValue,
    xp: Math.round(base.xp * (elite ? 2 : 1) * (player && player.echoMode ? 1.2 : 1) *
      ((!base.boss && !base.midBoss) ? EXPEDITION_RULES.monsterXpMultiplier(contractId) : 1)),
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
  normalizeGuardianIdentity(m);
  if (elite) {
    const affixPool = EXPEDITION_RULES.eliteAffixPool(depth, traits);
    const affix = affixPool.length ? affixPool[rnd(affixPool.length)] : null;
    if (affix === 'enrage') { m.enrage = true; m.eliteAffix = 'enrage'; m.name = '狂怒·精英·' + m.name; }
    else if (affix === 'leech') { m.leech = Math.max(Number(m.leech) || 0, 0.18); m.eliteAffix = 'leech'; m.name = '吸血·精英·' + m.name; }
    else if (affix === 'boom') { m.boom = true; m.eliteAffix = 'boom'; m.name = '爆裂·精英·' + m.name; }
    else m.name = '精英·' + m.name;
  }
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
  const returnChance = clamp(Number(RUN_PROFILE.floorRules.returnScrollChance) || 0.16, 0, 1);
  const returnOffset = Math.max(1, Math.min(9, Math.floor(Number(RUN_PROFILE.floorRules.returnScrollGuaranteeOffset) || 3)));
  const guaranteedReturn = greedyMode && ((depth - returnOffset) % 10 === 0);
  if (greedyMode && (guaranteedReturn || rng() < returnChance))
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
  const p = pickNpcSpawn(rooms.slice(1), 5);
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
  const p = pickNpcSpawn(rooms.slice(1), 4);
  if (!p) return;
  npcs.push({ type: 'rest', x: p.x, y: p.y, fx: p.x, fy: p.y, name: '余烬营地' });
  msg(fmtText(runText('restArrive', ui('一处营地。','A camp waits here.'))), 'good');
}

function spawnChest(rooms) {
  const chance = EXPEDITION_RULES.chestChance(RUN_PROFILE.chestChance || 0.5, currentExpeditionContractId());
  if (rng() > chance) return;
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
  const p = pickNpcSpawn(rooms.slice(1), 5);
  if (!p) return;
  npcs.push({ type: 'shrine', x: p.x, y: p.y, fx: p.x, fy: p.y, name: '无名神龛', used: false });
  msg(fmtText(runText('shrineArrive', ui('一座神龛在此。','A shrine waits here.'))), 'epic');
}

function spawnTraps() {
  const FR = RUN_PROFILE.floorRules || {};
  const n = ri(FR.trapCountLo || 0, FR.trapCountHi || 0) +
    EXPEDITION_RULES.trapBonus(currentExpeditionContractId());
  for (let i = 0; i < n; i++) {
    const p = pickSpawn(5);
    if (!p) break;
    traps.push({ x: p.x, y: p.y, armed: true, dmg: 2 + Math.floor(depth / 5) });
  }
}

function spawnExpeditionEvent(rooms) {
  if (!EXPEDITION_RULES.eventEligible(depth, MAX_DEPTH, echoModeNow())) return;
  if (rng() > EXPEDITION_RULES.eventChance(currentExpeditionContractId())) return;
  const p = pickNpcSpawn(rooms.slice(1), 5);
  if (!p) return;
  const kinds = EXPEDITION_RULES.eventKinds(depth);
  if (!kinds.length) return;
  const eventKind = kinds[rnd(kinds.length)];
  npcs.push({
    type:'event', eventKind, used:false, trialResolved:false,
    x:p.x, y:p.y, fx:p.x, fy:p.y,
    name:'异常回响',
  });
  msg(ui('你察觉到一处不稳定的异常回响。靠近后可以选择是否接受它的交易。',
    'You sense an unstable echo event. Approach it to decide whether to accept its bargain.'), 'epic');
}

function expeditionEventCopy(kind) {
  if (kind === 'blood-offering') return {
    title:ui('血契祭台','Blood Offering'),
    copy:ui('献出 18% 最大生命，换取一件稀有以上装备。代价立即支付。',
      'Pay 18% Max HP for a Rare-or-better item. The cost is immediate.'),
    accept:ui('献血换取遗物','Offer Blood'),
  };
  if (kind === 'echo-trial') return {
    title:ui('精英试炼','Elite Trial'),
    copy:ui('唤来两名带词缀的精英。全部击败后获得额外金币；逃跑则赏金作废。',
      'Summon two affixed elites. Defeat both for bonus Gold; retreating forfeits the bounty.'),
    accept:ui('接受试炼','Accept Trial'),
  };
  return {
    title:ui('诅咒钱匣','Cursed Cache'),
    copy:ui('支付 1 瓶药水换取金币；若没有药水，则以 10% 最大生命代偿。',
      'Pay 1 Potion for Gold; with no Potion, the cache takes 10% Max HP instead.'),
    accept:ui('打开钱匣','Open Cache'),
  };
}

function openExpeditionEvent(npc) {
  if (!npc || npc.used) { msg(ui('这处异常回响已经沉寂。','This echo event has gone dormant.')); return; }
  shrineTarget = npc;
  state = 'shrine';
  const row = expeditionEventCopy(npc.eventKind);
  if ($('shrine-title')) $('shrine-title').textContent = row.title;
  if ($('shrine-copy')) $('shrine-copy').textContent = row.copy;
  if ($('btn-shrine-ok')) $('btn-shrine-ok').textContent = row.accept;
  if ($('btn-shrine-leave')) $('btn-shrine-leave').textContent = ui('暂不触碰','Leave It');
  showUi('shrine-screen');
}

function settleExpeditionTrial(trialId) {
  if (!trialId || monsters.some(m => m && m.eventTrialId === trialId)) return false;
  const event = npcs.find(n => n && n.type === 'event' && n.eventTrialId === trialId);
  if (!event || event.trialResolved) return false;
  event.trialResolved = true;
  const reward = Math.max(0, Number(event.trialReward) || 0);
  player.gold += reward;
  msg(ui(`精英试炼完成。异常回响吐出 ${reward} G。`,
    `Elite Trial complete. The echo releases ${reward} Gold.`), 'gold');
  sfx.win();
  return true;
}

function applyExpeditionEvent(npc) {
  const spec = EXPEDITION_RULES.eventSpec(npc.eventKind, depth);
  npc.used = true;
  if (spec.kind === 'blood-offering') {
    const cost = Math.max(1, Math.floor(pMaxHp() * spec.hpRatio));
    if (player.hp <= cost) {
      npc.used = false;
      msg(ui('你的生命不足以支付这份血契。','You do not have enough life to pay this blood offering.'), 'bad');
      return false;
    }
    player.hp -= cost;
    const loot = genEquip(depth, spec.minRarity);
    if (player.inv.length < BAG_CAP) player.inv.push(loot);
    else dropAt(player.x, player.y, { type:'equip', item:loot, emoji:'', name:'装备' });
    msg(ui(`血契抽走 ${cost} 点生命，换来【${loot.name}】。`,
      `The pact takes ${cost} HP and yields [${visibleItemName(loot)}].`), rarityLogCls(loot.rarity));
    sfx.chest(); renderBag();
  } else if (spec.kind === 'echo-trial') {
    const pool = monsterPoolFor(depth);
    const trialId = `echo-trial-${depth}-${turns}-${Math.floor(rng() * 1e9)}`;
    let spawned = 0;
    for (let i=0; i<spec.eliteCount; i++) {
      const pos = pickSpawn(3);
      if (!pos) break;
      const monster = makeMonster(pick(pool), pos, { forceElite:true });
      monster.eventTrialId = trialId;
      monsters.push(monster);
      spawned++;
    }
    if (!spawned) {
      npc.used = false;
      msg(ui('回响没有找到可供试炼的落点。','The echo cannot find space for the trial.'), 'bad');
      return false;
    }
    npc.eventTrialId = trialId;
    npc.trialReward = spec.rewardGold;
    msg(ui(`试炼开启：${spawned} 名精英现身。全部击败可得 ${spec.rewardGold} G。`,
      `Trial started: ${spawned} elites appeared. Defeat them all for ${spec.rewardGold} Gold.`), 'bad');
    sfx.warning();
  } else {
    if ((player.potions || 0) >= spec.potionCost) {
      player.potions -= spec.potionCost;
      msg(ui(`钱匣吞掉 ${spec.potionCost} 瓶药水。`,`The cache consumes ${spec.potionCost} Potion.`), 'bad');
    } else {
      const cost = Math.max(1, Math.floor(pMaxHp() * spec.fallbackHpRatio));
      player.hp = Math.max(1, player.hp - cost);
      msg(ui(`没有药水可供献祭，钱匣改为抽走 ${cost} 点生命。`,
        `With no Potion to take, the cache drains ${cost} HP instead.`), 'bad');
    }
    player.gold += spec.rewardGold;
    msg(ui(`你从诅咒钱匣中取出 ${spec.rewardGold} G。`,
      `You take ${spec.rewardGold} Gold from the cursed cache.`), 'gold');
    sfx.pickup();
  }
  return true;
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
  if (width <= 1180) return { cols: 23, rows: 17 };
  if (width < 1680) return { cols: 27, rows: 19 };
  return { cols: 31, rows: 21 };
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
function impactCue(m, kind=classId, crit=false) {
  const style = CLASS_COMBAT_FX_STYLE[kind] || CLASS_COMBAT_FX_STYLE.warrior;
  const dx = (m.fx - player.fx) * TILE, dy = (m.fy - player.fy) * TILE;
  impactFx.push({
    x:m.fx * TILE + TILE / 2, y:m.fy * TILE + TILE / 2,
    angle:Math.atan2(dy, dx), kind, color:style.main, soft:style.soft,
    crit:!!crit, life:1,
  });
  haptic(crit ? [22, 16, 34] : 16);
}
function applyDamageToMonster(m, dmg, crit, impactKind=classId) {
  m.hp -= dmg; m.hurtT = 1;
  floater(m, `-${dmg}`, crit ? '#ffd061' : '#fff', crit ? 1.34 : 1.06);
  burst(m.fx, m.fy, m.color, crit ? 12 : 6);
  impactCue(m, impactKind, crit);
  addTrauma(crit ? 0.28 : 0.12);
  addHitstop(crit ? 0.07 : 0.04);
  crit ? sfx.crit(impactKind) : sfx.hit(impactKind);
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
  const skillPlan = consumeSkillFollowup();
  const skillBonus = skillPlan ? Math.max(1, Math.round(pAtk() * skillPlan.scale)) : 0;
  let dmg = Math.max(1, pAtk() + skillBonus + ri(-1, 1) - m.def);
  let mult = 1;
  if (skillPlan) msg(ui(`【${skillPlan.zh}】强化了这次方向攻击。`, `[${skillPlan.en}] empowered this directional attack.`), 'good');
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
  if (m.hp > 0) msg(ui(`${crit ? '暴击！' : ''}你击中${m.name}，造成 ${dmg} 点伤害。`, `${crit ? 'Critical! ' : ''}You hit ${visibleWorldName(m.name)} for ${dmg} damage.`), 'combat');
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
function playerRangedAttack(m, attackClass=classId) {
  const arcane = attackClass === 'mage';
  fireArrow(player.x, player.y, m.x, m.y, arcane ? 'arcane' : 'arrow');
  const skillPlan = consumeSkillFollowup();
  const skillBonus = skillPlan ? Math.max(1, Math.round(pAtk() * skillPlan.scale)) : 0;
  const rawAtk = arcane ? Math.max(1, Math.round(pAtk() * 0.90)) : pAtk();
  const targetDef = arcane ? Math.floor((Number(m.def) || 0) * 0.45) : (Number(m.def) || 0);
  let dmg = Math.max(1, rawAtk + skillBonus + ri(-1, 1) - targetDef);
  let mult = 1;
  if (skillPlan) msg(ui(`【${skillPlan.zh}】强化了这次方向攻击。`, `[${skillPlan.en}] empowered this directional attack.`), 'good');
  const echo = consumeTimedMechanic('echoEdgeTurn', 'echo_edge');
  if (echo) mult *= echo >= 2 ? 1.40 : 1.25;
  const skirmish = consumeTimedMechanic('skirmishTurn', 'skirmish');
  if (skirmish && attackClass === 'ranger') mult *= skirmish >= 2 ? 1.40 : 1.25;
  dmg = Math.max(1, Math.round(dmg * mult));
  const crit = rng() * 100 < pCrit();
  if (crit) dmg = Math.round(dmg * pCritMul());
  const wasAlive = m.hp > 0;
  applyDamageToMonster(m, dmg, crit, attackClass);
  if (wasAlive && m.hp <= 0) {
    const reaper = mechanicPower('reaper');
    if (reaper && player.skillCd > 0) {
      const refund = reaper >= 2 ? 2 : 1;
      player.skillCd = Math.max(0, player.skillCd - refund);
      msg(ui(`【收割】远程斩杀返还 ${refund} 回合技能冷却。`, `[Reaper] Ranged kill refunded ${refund} turn${refund === 1 ? '' : 's'} of cooldown.`), 'good');
    }
  }
  if (m.hp > 0) msg(arcane
    ? ui(`${crit ? '暴击！' : ''}奥术冲击命中${m.name}，造成 ${dmg} 点伤害。`, `${crit ? 'Critical! ' : ''}Arcane force hit ${visibleWorldName(m.name)} for ${dmg} damage.`)
    : ui(`${crit ? '暴击！' : ''}你射中${m.name}，造成 ${dmg} 点伤害。`, `${crit ? 'Critical! ' : ''}You shot ${visibleWorldName(m.name)} for ${dmg} damage.`), 'combat');
}

function directionalAttack() {
  if (state !== 'playing' || !player) return false;
  const facing = Array.isArray(player.facing) ? player.facing : [1, 0];
  const dx = Math.sign(Number(facing[0]) || 0), dy = Math.sign(Number(facing[1]) || 0);
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false;
  const ranged = classDef().rangedRange || 0;
  const target = ranged ? findRangedTarget(dx, dy) : monsterAt(player.x + dx, player.y + dy);
  if (!target) {
    msg(ranged
      ? ui('当前朝向的射程内没有敌人。', 'No enemy is in range along your current facing.')
      : ui('当前朝向没有可以攻击的敌人。', 'No enemy is adjacent in your current facing.'));
    return false;
  }
  guideCombatOnce();
  if (ranged) playerRangedAttack(target, classId);
  else playerAttack(target);
  if (state !== 'playing') { updateHud(); return true; }
  endTurn(manaRuleFor(classId).attackGain, false);
  return true;
}
function monsterAttack(m, armorBreak = false, damageScale = 1) {
  lunge(m, player.x, player.y);
  // 游侠被动「灵巧」：一成几率闪开近战攻击（不挡远程——远程是游侠的克制面）
  if (classId === 'ranger' && player.hp > 0 && rng() < 0.10) {
    floater(player, ui('闪避','Dodge'), '#7ec8e3', 1.08);
    msg(ui(`${m.name}的攻击被你灵巧闪开。`, `You dodged ${visibleWorldName(m.name)}'s attack.`));
    sfx.dodge(); haptic(10);
    return;
  }
  const raw = Math.max(1, Math.round((m.atk + ri(-1, 1)) * Math.max(0.1, Number(damageScale) || 1)));
  let dmg = mitigatePlayerHit(raw, 1, armorBreak);
  dmg = applyDirectHitMechanic(dmg);
  if (armorBreak) {
    floater(player, ui('破甲重击!','ARMOR BREAK!'), '#e0a73a');
    msg(ui(`${m.name} 的蓄力破甲命中，造成 ${dmg} 点无视护甲伤害！`, `${visibleWorldName(m.name)}'s Armor Break hit for ${dmg} armor-piercing damage!`), 'bad');
  } else {
    incomingCombatMsg(ui(`${m.name}击中你，造成 ${dmg} 点伤害！`, `${visibleWorldName(m.name)} hit you for ${dmg} damage!`), dmg);
  }
  player.hp -= dmg; player.hurtT = 1;
  armReprisal();
  floater(player, `-${dmg}`, '#ff6b6b');
  addTrauma(armorBreak ? 0.48 : 0.35);
  playerImpactCue(armorBreak); sfx.hurt();
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
  sfx.kill(!!(m.boss || m.midBoss));
  addDecal(m.x, m.y);
  msg(ui(`${m.name}被消灭了！（+${m.xp} 经验）`, `${visibleWorldName(m.name)} was slain! (+${m.xp} XP)`), 'good');
  if (boomHit) {
    const dmg = Math.max(2, mitigatePlayerHit(Math.round(m.atk * 0.55), .5, false));
    player.hp -= dmg; player.hurtT = 1;
    floater(player, `-${dmg}`, '#e0a73a');
    burst(m.fx, m.fy, '#e0a73a', 22);
    msg(ui(`${m.name} 炸裂开来，你受到 ${dmg} 点溅射伤害！`, `${visibleWorldName(m.name)} exploded, dealing ${dmg} splash damage to you!`), 'bad');
    playerImpactCue(true); sfx.hurt();
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
  if (m.elite) {
    const bounty = EXPEDITION_RULES.eliteBounty(depth, currentExpeditionContractId());
    if (bounty > 0) {
      player.gold += bounty;
      msg(ui(`猎杀号令赏金 +${bounty} G。`, `Elite Hunt bounty +${bounty} Gold.`), 'gold');
    }
  }
  if (m.eventTrialId) settleExpeditionTrial(m.eventTrialId);
  const kh = Math.round(pKillHeal() * healMult());
  if (greedyMode && meta) meta.totalKills = (meta.totalKills || 0) + 1;
  recordKill(m);
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
  recordDeath();
  if (greedyMode && meta) {
    const hasIns = (meta.insurance || 0) > 0;
    const lostGold = player.gold;
    sfx.die();
    if (hasIns) {
      // 保险符：碎裂抵一次死亡——背包完好，随身金币仍坠入深渊
      meta.insurance--;
      syncMetaFromPlayer('insured');
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
  recordWin();
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
      msg(ui('你捡起了一张回城卷轴。','Picked up a Return Scroll.'), 'gold');
      if (greedyMode) guideOnce('return',
        '按 T 回城会把背包与随身金币安全带回小镇；死在远征里会失去未保全的背包与金币。',
        'Press T to return safely with your backpack and carried Gold; dying on an expedition loses unsecured backpack loot and Gold.', 'gold');
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
        selectedBagIndex = player.inv.length - 1;
        bagChanged = true;
        guideGearOnce();
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
          selectedBagIndex = player.inv.length - 1;
          bagChanged = true;
          guideGearOnce();
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
      selectedBagIndex = player.inv.length - 1;
      bagChanged = true;
      guideGearOnce();
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
      * (1 + ((player.potionBoost || 0) + setStat('potionBoost')) / 100) * healMult()));
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
function useBaseSkill() {
  if (state !== 'playing') return;
  ensurePlayerMana();
  if (player.skillCd > 0) { msg(ui(`技能冷却中（${player.skillCd} 回合）。`, `Skill cooldown: ${player.skillCd} turns.`)); return; }
  const manaCost = skillManaCost();
  if (player.mana < manaCost) {
    msg(ui(`蓝量不足：${player.mana}/${manaCost}。等待可更快恢复。`, `Not enough Mana: ${player.mana}/${manaCost}. Waiting restores it faster.`), 'bad');
    return;
  }
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
    const facing = Array.isArray(player.facing) ? player.facing : [1, 0];
    const dx = Math.sign(Number(facing[0]) || 0), dy = Math.sign(Number(facing[1]) || 0);
    if (Math.abs(dx) + Math.abs(dy) !== 1) { msg(ui('没有有效的疾步方向。','No valid dash direction.')); return; }
    const originX = player.x, originY = player.y;
    let landingX = originX, landingY = originY, hits = 0;
    for (let step = 1; step <= 2; step++) {
      const tx = originX + dx * step, ty = originY + dy * step;
      if (!walkable(tx, ty) || npcAt(tx, ty)) break;
      const m = monsterAt(tx, ty);
      if (m) {
        applyDamageToMonster(m, Math.max(1, pAtk() + 2 - m.def), false);
        hits++;
        if (state !== 'playing') return;
        if (m.hp > 0) continue;
      }
      if (!monsterAt(tx, ty)) { landingX = tx; landingY = ty; }
    }
    if (landingX === originX && landingY === originY && !hits) {
      msg(ui('这个方向被地形或角色挡住，无法疾步。','Terrain or a character blocks the dash in that direction.'));
      return;
    }
    player.x = landingX; player.y = landingY;
    sfx.skill();
    triggerTrap(landingX, landingY);
    pickupHere();
    msg(hits
      ? ui(`疾步掠过 ${hits} 个敌人，落在前方安全位置。`, `Dash cut through ${hits} enemies and landed on the furthest safe tile.`)
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
  if (!spendMana(manaCost)) return;
  classSkillFxT = 1;
  const echo = mechanicPower('echo_edge');
  if (echo) player.echoEdgeTurn = turns + 1;
  const afterimage = mechanicPower('afterimage');
  if (afterimage) player.afterimageTurn = turns + 1;
  player.skillCd = Math.max(2, sk.cd - (player.skillHaste || 0) - setStat('skillHaste'));
  const overclock = mechanicPower('overclock');
  if (overclock && monsters.length < mobsBeforeSkill) {
    const refund = overclock >= 2 ? 2 : 1;
    player.skillCd = Math.max(0, player.skillCd - refund);
    msg(ui(`【回路超频】技能击杀返还 ${refund} 回合冷却。`, `[Overclock] Skill kill refunded ${refund} turn${refund === 1 ? '' : 's'} of cooldown.`), 'good');
  }
  if (state !== 'playing') { updateHud(); return; }
  endTurn();
}

function skillEvolutionVisibleMonsters() {
  return monsters.filter(m => m && m.hp > 0 && visible[m.y] && visible[m.y][m.x])
    .sort((a, b) => (Math.abs(a.x - player.x) + Math.abs(a.y - player.y)) - (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)));
}
function skillEvolutionWarriorSplash() {
  const coreAdjacent = monsters.some(m => Math.abs(m.x - player.x) + Math.abs(m.y - player.y) === 1);
  if (!coreAdjacent) return;
  const targets = [];
  if (hasSkillEvolution('se_w20_arc')) for (const m of monsters) if (Math.abs(m.x-player.x)===1 && Math.abs(m.y-player.y)===1) targets.push([m,.65]);
  if (hasSkillEvolution('se_w40_reach')) for (const m of monsters) {
    const dx=Math.abs(m.x-player.x), dy=Math.abs(m.y-player.y);
    if ((dx===2&&dy===0)||(dx===0&&dy===2)) targets.push([m,.70]);
  }
  if (hasSkillEvolution('se_w80_tempest')) for (const m of monsters) {
    const dx=Math.abs(m.x-player.x), dy=Math.abs(m.y-player.y), core=dx+dy===1;
    if (!core && Math.max(dx,dy)<=2 && !targets.some(row=>row[0]===m)) targets.push([m,.72]);
  }
  const base=pAtk();
  for (const [m,scale] of [...targets]) if (m.hp>0 && monsters.includes(m)) applyDamageToMonster(m,Math.max(1,Math.round(base*scale)-(Number(m.def)||0)),false);
}
function skillEvolutionMageSplash(vis) {
  const base=pAtk(), rows=[];
  if (hasSkillEvolution('se_m80_storm')) for (const m of vis.slice(1,4)) rows.push([m,.65]);
  else if (hasSkillEvolution('se_m40_chain')) for (const m of vis.slice(1,3)) rows.push([m,.45]);
  else if (hasSkillEvolution('se_m20_fork') && vis[1]) rows.push([vis[1],.55]);
  for (const [m,scale] of rows) if (m && m.hp>0 && monsters.includes(m)) applyDamageToMonster(m,Math.max(1,Math.round(base*scale)-Math.floor((Number(m.def)||0)*.4)),false);
}
function useSkill() {
  if (state !== 'playing' || !player) return;
  const cid=classId;
  const hasAny=(player.talents||[]).some(id=>String(id).startsWith(`se_${cid[0]}`));
  ensurePlayerMana();
  if (!hasAny || player.skillCd>0 || player.mana<skillManaCost()) return useBaseSkill();
  const p=player, beforeTurn=turns, beforeCount=monsters.length, beforeHp=Number(p.hp)||0;
  const originalAtk=Number(p.atkBase)||0, originalDr=Number(p.flatDr)||0, originalHaste=Number(p.skillHaste)||0;
  const visBefore=skillEvolutionVisibleMonsters(), targetBefore=visBefore[0]||null;
  const nearbyBefore=monsters.filter(m=>Math.abs(m.x-p.x)+Math.abs(m.y-p.y)<=2).length;
  let tempAtk=0,tempDr=0,tempHaste=0;
  if (cid==='warrior') {
    skillEvolutionWarriorSplash();
    if (hasSkillEvolution('se_w20_guard')) tempDr+=3;
    if (hasSkillEvolution('se_w80_fortress')) tempDr+=7;
    if (hasSkillEvolution('se_w60_pressure')) tempAtk+=Math.max(2,Math.round(pAtk()*.22));
  } else if (cid==='mage') {
    skillEvolutionMageSplash(visBefore);
    if (hasSkillEvolution('se_m20_barrier')) tempDr+=4;
    if (hasSkillEvolution('se_m40_focus') && visBefore.length===1) tempAtk+=Math.max(2,Math.round(pAtk()*.30));
    if (hasSkillEvolution('se_m80_singularity') && visBefore.length===1) tempAtk+=Math.max(3,Math.round(pAtk()*.45));
  } else if (cid==='ranger') {
    if (hasSkillEvolution('se_r20_evasion')) tempDr+=4;
    if (hasSkillEvolution('se_r80_phantom')) tempDr+=5;
    if (hasSkillEvolution('se_r20_tempo')) tempHaste+=1;
  } else if (cid==='assassin') {
    if (hasSkillEvolution('se_a20_smoke')) tempDr+=4;
    if (hasSkillEvolution('se_a60_escape')) tempDr+=5;
    if (hasSkillEvolution('se_a20_execute') && targetBefore && targetBefore.maxHp && targetBefore.hp<=targetBefore.maxHp*.45) tempAtk+=Math.max(2,Math.round(pAtk()*.35));
  }
  p.atkBase=originalAtk+tempAtk; p.flatDr=originalDr+tempDr; p.skillHaste=originalHaste+tempHaste;
  try { useBaseSkill(); }
  finally { p.atkBase=originalAtk; p.flatDr=originalDr; p.skillHaste=originalHaste; }
  const used=turns>beforeTurn;
  if (!used) return;
  const killed=monsters.length<beforeCount;
  if (cid==='warrior') {
    if (hasSkillEvolution('se_w40_rhythm') && nearbyBefore>=2) p.skillCd=Math.max(0,(p.skillCd||0)-1);
    if (hasSkillEvolution('se_w60_blood') && killed) p.hp=Math.min(pMaxHp(),p.hp+Math.max(2,Math.round(pMaxHp()*.08)));
  } else if (cid==='mage') {
    if (hasSkillEvolution('se_m60_overload') && killed) p.skillCd=Math.max(0,(p.skillCd||0)-2);
    if (hasSkillEvolution('se_m60_repulse') && targetBefore && targetBefore.hp>0 && monsters.includes(targetBefore)) {
      const dx=Math.sign(targetBefore.x-p.x),dy=Math.sign(targetBefore.y-p.y),nx=targetBefore.x+dx,ny=targetBefore.y+dy;
      if (walkable(nx,ny) && !monsterAt(nx,ny) && !npcAt(nx,ny)) { targetBefore.x=nx;targetBefore.y=ny;targetBefore.fx=nx;targetBefore.fy=ny; }
    }
  } else if (cid==='ranger') {
    if ((hasSkillEvolution('se_r80_chain')||hasSkillEvolution('se_r40_hunt')) && killed) p.skillCd=0;
    if (hasSkillEvolution('se_r40_flow') && !killed) p.skillCd=Math.max(0,(p.skillCd||0)-2);
    if (hasSkillEvolution('se_r60_sustain') && killed) p.hp=Math.min(pMaxHp(),p.hp+Math.max(2,Math.round(pMaxHp()*.10)));
  } else if (cid==='assassin') {
    if (hasSkillEvolution('se_a80_chain') && killed) p.skillCd=0;
    else if (hasSkillEvolution('se_a40_tempo') && killed) p.skillCd=Math.max(0,(p.skillCd||0)-2);
    if (hasSkillEvolution('se_a40_blood') && killed) p.hp=Math.min(pMaxHp(),p.hp+Math.max(2,Math.round(pMaxHp()*.12)));
    if (hasSkillEvolution('se_a80_predator') && !killed) p.skillCd=Math.max(0,(p.skillCd||0)-2);
  }
  skillFollowup=skillFollowupPlan(cid,killed);
  if (skillFollowup) msg(ui(`【${skillFollowup.zh}】已蓄势：下一次方向攻击获得强化。`,`[${skillFollowup.en}] is primed: your next directional attack is empowered.`),'good');
  if ((Number(p.hp)||0)>beforeHp) msg(ui('技能进化触发了额外续航。','Skill evolution triggered extra sustain.'),'good');
}

function descend() {
  if (state !== 'playing') return;
  if (!canDescendNow()) { msg(fmtText(runText('bossGate')), 'bad'); return; }
  if (map[player.y][player.x] !== STAIRS) { msg(ui('这里没有向下的楼梯。站上去再按 Enter。','There are no stairs here. Stand on them and press Enter.')); return; }
  depth++;
  recordDepth();
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
  return ECONOMY_RULES.quickDiveCost(fromDepth, n);
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
  recordDepth();
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
  const dmg = mitigatePlayerHit(t.dmg, .5, false);
  player.hp -= dmg; player.hurtT = 1;
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
  if (npc.type === 'event') {
    applyExpeditionEvent(npc);
    state = 'playing';
    if ($('btn-shrine-ok')) $('btn-shrine-ok').textContent = ui('祈祷','Pray');
    if ($('btn-shrine-leave')) $('btn-shrine-leave').textContent = ui('离开','Leave');
    persistRun(); updateHud(); return;
  }
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
  const evolutionPicks = pendingSkillEvolution();
  const pool = evolutionPicks ? [...evolutionPicks] : [...TALENTS];
  const picks = [];
  if (evolutionPicks) picks.push(...pool);
  else while (picks.length < 3 && pool.length) {
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
  const t = TALENTS.find(x => x.id === id) || skillEvolutionTalent(id);
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
  if (!canEquipForClass(it)) {
    const required = weaponClassOf(it);
    const requiredName = required && CLASSES[required] ? CLASSES[required].name : ui('对应职业','the matching class');
    msg(ui(`无法装备【${it.name}】：需要 ${requiredName} 武器专精。可以带回城、出售、存仓或锻造。`, `Cannot equip [${visibleItemName(it)}]: it requires ${requiredName} weapon proficiency. You can still carry, sell, stash, or forge it.`), 'bad');
    selectedBagIndex = i;
    renderBag();
    return;
  }
  const old = player.equip[it.slot];
  player.equip[it.slot] = it;
  clearMechanicWindows();
  player.inv.splice(i, 1);
  if (old) player.inv.push(old);
  player.hp = Math.min(player.hp, pMaxHp());
  selectedBagIndex = -1;
  sfx.equip();
  if ((it.rarity || 0) >= 4) {
    recordLegend();
    if (greedyMode && meta) meta.gotLegend = 1;
    msg(ui('传说藏品入账！远征录已记录。','Legendary item acquired! The Expedition Record has been updated.'), 'gold');
  }
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
function migrateLegacyEquippedWeaponToInventory() {
  if (!player || !player.equip || !player.equip.weapon || canEquipForClass(player.equip.weapon)) return false;
  const legacy = player.equip.weapon;
  player.equip.weapon = null;
  if (player.inv.length < BAG_CAP) {
    player.inv.push(legacy);
    selectedBagIndex = player.inv.length - 1;
  } else if (Array.isArray(items) && map) {
    dropAt(player.x, player.y, { type:'equip', item:legacy, emoji:'', name:'装备' });
  } else {
    player.inv.push(legacy);
  }
  player.hp = Math.min(player.hp, pMaxHp());
  msg(ui(`旧存档中的【${legacy.name}】不符合当前职业武器专精，已安全卸下。`, `Legacy weapon [${visibleItemName(legacy)}] does not match this class proficiency and was safely unequipped.`), 'gold');
  return true;
}
function migrateGreedyMetaWeapon() {
  if (!meta || !meta.equip || !meta.equip.weapon || canEquipForClass(meta.equip.weapon, meta.classId)) return false;
  const legacy = meta.equip.weapon;
  meta.equip.weapon = null;
  if ((meta.bag || []).length < BAG_CAP) meta.bag.push(legacy);
  else {
    meta.stash = Array.isArray(meta.stash) ? meta.stash : [];
    meta.stash.push(legacy);
  }
  return true;
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
  let html = `<div class="tname r${it.rarity}${it.namedSet ? ' named-relic-name' : ''}">${esc(visibleItemName(it))}</div>`;
  if (it.namedSet) {
    const set = SET_RULES.setById(it.setId);
    const count = (SET_RULES.equippedCounts(player && player.equip || {})[it.setId] || 0);
    const lore = ui(it.loreZh || '', it.loreEn || '');
    const sig = Object.entries(it.signatureStats || {}).map(([k,v]) => {
      const label = AFFIX_LABEL[k];
      return label ? label(v) : `${k} +${v}`;
    }).join(' · ');
    html += `<div class="named-relic-set">${esc(ui(it.setNameZh || (set && set.zh) || '', it.setNameEn || (set && set.en) || ''))} · ${count}/6 ${ui('已装备','equipped')}</div>`;
    if (lore) html += `<div class="named-relic-lore">“${esc(lore)}”</div>`;
    if (sig) html += `<div class="named-relic-signature">${ui('遗物固有','Relic signature')} · ${esc(sig)}</div>`;
    if (set) html += `<div class="named-relic-bonuses">${set.bonuses.map(b => `<span class="${count >= b.pieces ? 'active' : ''}">${b.pieces}/6 · ${esc(ui(b.zh,b.en))}</span>`).join('')}</div>`;
  }
  if (it.stats.atk) html += `<div>${esc(AFFIX_LABEL.atk(it.stats.atk))}</div>`;
  if (it.stats.def) html += `<div>${esc(AFFIX_LABEL.def(it.stats.def))}</div>`;
  if (it.stats.hp)  html += `<div>${esc(AFFIX_LABEL.hp(it.stats.hp))}</div>`;
  for (const a of (it.affixes || [])) {
    const label = AFFIX_LABEL[a.k];
    if (label) html += `<div class="affix">${esc(label(a.v))}</div>`;
  }
  const mechanicText = mechanicDescription(it);
  if (mechanicText) html += `<div class="affix">${esc(mechanicText)}</div>`;
  const requirement = weaponRequirementText(it);
  if (requirement) html += `<div class="${canEquipForClass(it) ? 'proficiency-ok' : 'cmp-down'}">${esc(requirement)}</div>`;
  const fit = classFitOf(it);
  const value = itemValueScore(it);
  html += `<div style="color:${r.color}">${ui(`职业适配 ${fit} · 内在价值 ${value}`, `Class Fit ${fit} · Item Value ${value}`)}</div>`;
  if (compareSlot) {
    const cur = player.equip[compareSlot];
    if (cur) {
      const fitDelta = fit - classFitOf(cur);
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
    if (equip) {
      equip.disabled = !canEquipForClass(it);
      equip.title = canEquipForClass(it) ? '' : weaponRequirementText(it);
    }
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
  let manaBonus = 0;
  const secret = (secrets || []).find(s => !s.revealed && s.x === nx && s.y === ny);
  if (secret) {
    revealSecret(secret);
    endTurn();
    return;
  }
  const shop = npcAt(nx, ny);
  if (shop && shop.type === 'shop') { openShop(); return; }
  if (shop && shop.type === 'shrine') { openShrine(shop); return; }
  if (shop && shop.type === 'event') { openExpeditionEvent(shop); return; }
  if (shop && shop.type === 'rest') { useRest(shop); return; }
  const m = monsterAt(nx, ny);
  if (m) {
    guideCombatOnce();
    playerAttack(m);
    manaBonus = manaRuleFor(classId).attackGain;
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
  endTurn(manaBonus, false);
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
  endTurn(manaRuleFor(classId).focusGain, true);
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
function endTurn(manaBonus=0, announceFocus=false) {
  turns++;
  if (player.skillCd > 0) player.skillCd--;
  recoverMana(manaBonus, announceFocus);
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
  if (bx || by) { m.x += bx; m.y += by; return true; }
  return false;
}
function engagementStrike(m) {
  if (!m || m.hp <= 0 || state !== 'playing') return false;
  if (Math.abs(m.x - player.x) + Math.abs(m.y - player.y) !== 1) return false;
  floater(m, ui('追击!','PRESS!'), '#e0a73a');
  const pressureScale = (m.boss || m.midBoss) ? 0.66 : m.elite ? 0.74 : 0.60;
  monsterAttack(m, false, pressureScale);
  return true;
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
  let dmg = mitigatePlayerHit(raw, .5, armorBreak);
  dmg = applyDirectHitMechanic(dmg);
  if (armorBreak) {
    floater(player, ui('破甲重击!','ARMOR BREAK!'), '#e0a73a');
    msg(ui(`${m.name} 的蓄力射击命中，造成 ${dmg} 点无视护甲伤害！`, `${visibleWorldName(m.name)}'s charged shot hit for ${dmg} armor-piercing damage!`), 'bad');
  } else {
    incomingCombatMsg(ui(`${m.name} 远程袭击你，造成 ${dmg} 点伤害！`, `${visibleWorldName(m.name)} hit you from range for ${dmg} damage!`), dmg);
  }
  player.hp -= dmg; player.hurtT = 1;
  armReprisal();
  floater(player, `-${dmg}`, '#ff6b6b');
  addTrauma(armorBreak ? 0.45 : 0.32);
  playerImpactCue(armorBreak); sfx.hurt();
  if ((m.elite || m.boss || m.midBoss) && player.hp > 0) applyGrievous();
  if (m.poison) {
    player.poison = Math.max(player.poison || 0, 3);
    msg(ui('毒素渗进伤口。','Poison seeps into the wound.'), 'bad');
  }
  if (player.hp <= 0) die();
}
const GUARDIAN_SPECS = Object.freeze({
  20: { id:'frost-ring', interval:4, color:'#7ec8e3', radius:2,
    title:ui('霜环蓄积','Frost Ring'), warn:ui('寒气将在下一回合覆盖守卫周围 2 格。离开霜环范围。','Frost will cover the 2-tile area around the guardian next turn. Leave the ring.') },
  30: { id:'ember-mark', interval:4, color:'#ff8a45',
    title:ui('爆裂标记','Ember Mark'), warn:ui('脚下地块已被点燃。下一回合前离开这个格子。','Your tile is marked to ignite. Move off it before the next turn.') },
  40: { id:'hunter-line', interval:3, color:'#e7d7a4', range:6,
    title:ui('猎杀线','Hunter Line'), warn:ui('守卫锁定了一条射击线。侧移、离开射程或借墙断线。','The guardian locks a firing line. Sidestep, leave range, or break line of sight.') },
  50: { id:'mending-channel', interval:5, color:'#86d4a6',
    title:ui('愈合咏唱','Mending Channel'), warn:ui('守卫将在下一回合恢复生命。警告期间造成伤害即可打断。','The guardian will heal next turn. Damage it during the warning to interrupt.') },
  60: { id:'blood-tether', interval:4, color:'#e05a65',
    title:ui('血契牵引','Blood Tether'), warn:ui('血链将在下一回合抽取近距离目标。拉开到 4 格以上。','The tether drains nearby targets next turn. Get at least 4 tiles away.') },
  70: { id:'rupture-cross', interval:4, color:'#d7a640', radius:3,
    title:ui('地脉震裂','Rupture Cross'), warn:ui('守卫将在自身横纵 3 格内震裂地面。离开十字危险线。','The guardian ruptures three tiles along its row and column. Leave the cross.') },
  80: { id:'arcane-strip', interval:4, color:'#a895ff', range:2,
    title:ui('星蚀弹幕','Eclipse Barrage'), warn:ui('弹幕锁定短直线。沿垂直方向侧移一格。','The barrage locks a short line. Sidestep one tile perpendicular to it.') },
});
const GUARDIAN_ECHO_SEQUENCE = Object.freeze([
  { id:'echo-mark', interval:3, color:'#ff8a45', title:ui('回响试炼 I · 踏焰','Echo Trial I · Step from Flame'), warn:ui('离开被锁定地块。','Leave the marked tile.') },
  { id:'echo-line', interval:3, color:'#e7d7a4', range:7, title:ui('回响试炼 II · 断线','Echo Trial II · Break the Line'), warn:ui('侧移、离开射程或借墙断线。','Sidestep, leave range, or break the line.') },
  { id:'echo-ring', interval:3, color:'#7ec8e3', radius:2, title:ui('回响试炼 III · 离环','Echo Trial III · Leave the Ring'), warn:ui('离开守卫周围 2 格。','Leave the 2-tile area around the guardian.') },
]);
const GUARDIAN_FINAL_PHASES = Object.freeze({
  crown:{ id:'throne-mark', interval:3, color:'#d7a640', title:ui('终局第一相 · 王座烙印','Final Phase I · Throne Brand'), warn:ui('下一回合前离开脚下烙印。','Move off the branded tile before next turn.') },
  void:{ id:'void-line', interval:3, color:'#b49cff', range:8, title:ui('终局第二相 · 虚空裁线','Final Phase II · Void Line'), warn:ui('侧移或借墙切断射线。','Sidestep or break the line with terrain.') },
  heart:{ id:'heart-nova', interval:2, color:'#ff6f6f', radius:2, title:ui('终局第三相 · 深渊心爆','Final Phase III · Abyss Heart Nova'), warn:ui('停止贪刀，离开守卫周围 2 格。','Stop attacking and leave the 2-tile blast area.') },
});
function guardianDepth(m) {
  if (!m) return depth;
  if (m.boss) return depth;
  return Math.max(1, Math.floor(Number(m.depth) || depth));
}
function normalizeGuardianIdentity(m) {
  if (!m || (!m.midBoss && !m.boss)) return m;
  const d=guardianDepth(m);
  if (d===10) m.armorBreak=true;
  else if (d===20) { m.regen=true; m.slow=false; }
  else if (d===30) { m.boom=true; m.enrage=false; m.enraged=false; }
  else if (d===40) m.ranged=4;
  else if (d===50) { m.ranged=2; m.regen=false; }
  else if (d===60) { m.leech=.20; m.enrage=false; m.enraged=false; }
  else if (d===70) { m.regen=true; m.boom=true; m.slow=false; }
  else if (d===80) { m.ranged=3; m.regen=false; m.enrage=false; m.enraged=false; }
  else if (d===90) { m.ranged=3; m.regen=false; m.enrage=false; m.enraged=false; m.leech=.10; }
  else if (d===100 && m.boss) { m.ranged=3; m.regen=false; m.enrage=false; m.enraged=false; m.leech=.08; }
  return m;
}
function guardianFinalPhaseKey(m) {
  const ratio=m && m.maxHp ? m.hp/m.maxHp : 1;
  return ratio>.66 ? 'crown' : ratio>.33 ? 'void' : 'heart';
}
function guardianSpecById(id) {
  for (const spec of Object.values(GUARDIAN_SPECS)) if (spec.id===id) return spec;
  for (const spec of GUARDIAN_ECHO_SEQUENCE) if (spec.id===id) return spec;
  for (const spec of Object.values(GUARDIAN_FINAL_PHASES)) if (spec.id===id) return spec;
  return null;
}
function guardianState(m) {
  if (!m || (!m.midBoss && !m.boss)) return null;
  const d=guardianDepth(m);
  if (d<20 || d>100 || (d===100 && !m.boss)) return null;
  if (!m.guardianEncounter || m.guardianEncounter.version!==1) {
    m.guardianEncounter={
      version:1, nextSpecialTurn:turns+2, sequenceIndex:0, active:null,
      finalPhase:d===100 ? guardianFinalPhaseKey(m) : null,
    };
  }
  return m.guardianEncounter;
}
function guardianSpecFor(m,s) {
  const d=guardianDepth(m);
  if (GUARDIAN_SPECS[d]) return GUARDIAN_SPECS[d];
  if (d===90) return GUARDIAN_ECHO_SEQUENCE[(s.sequenceIndex||0)%GUARDIAN_ECHO_SEQUENCE.length];
  if (d===100 && m.boss) return GUARDIAN_FINAL_PHASES[guardianFinalPhaseKey(m)];
  return null;
}
const guardianLineLike=id => id==='hunter-line' || id==='echo-line' || id==='void-line';
function guardianStartSpecial(m,s,spec) {
  const dx=Math.abs(player.x-m.x), dy=Math.abs(player.y-m.y);
  const axis=(guardianLineLike(spec.id) || spec.id==='arcane-strip') ? (dx>=dy?'row':'col') : null;
  s.active={
    id:spec.id, resolveTurn:turns+1,
    targetX:player.x, targetY:player.y, startHp:m.hp,
    axis, line:axis==='row'?player.y:axis==='col'?player.x:null,
  };
  floater(m, spec.title, spec.color, 1.12);
  msg(`${spec.title}: ${spec.warn}`, 'bad');
  if (typeof sfx !== 'undefined' && sfx && typeof sfx.warning === 'function') sfx.warning();
  if (typeof haptic === 'function') haptic([18, 45, 18]);
}
function guardianLineClear(m,axis) {
  if (axis==='row') {
    if (m.y!==player.y) return false;
    for (let x=Math.min(m.x,player.x)+1;x<Math.max(m.x,player.x);x++) if (map[m.y] && map[m.y][x]===WALL) return false;
    return true;
  }
  if (axis==='col') {
    if (m.x!==player.x) return false;
    for (let y=Math.min(m.y,player.y)+1;y<Math.max(m.y,player.y);y++) if (map[y] && map[y][m.x]===WALL) return false;
    return true;
  }
  return false;
}
function guardianResolveSpecial(m,s) {
  const a=s.active;
  if (!a) return false;
  const spec=guardianSpecById(a.id);
  s.active=null;
  if (!spec) return true;
  s.nextSpecialTurn=turns+spec.interval;
  let hit=false;
  if (a.id==='frost-ring' || a.id==='echo-ring' || a.id==='heart-nova') {
    const r=spec.radius||2;
    hit=Math.max(Math.abs(player.x-m.x),Math.abs(player.y-m.y))<=r;
    if (hit) monsterAttack(m);
  } else if (a.id==='ember-mark' || a.id==='echo-mark' || a.id==='throne-mark') {
    hit=player.x===a.targetX && player.y===a.targetY;
    if (hit) monsterAttack(m);
  } else if (guardianLineLike(a.id)) {
    const aligned=a.axis==='row' ? player.y===a.line : player.x===a.line;
    const dist=Math.max(Math.abs(player.x-m.x),Math.abs(player.y-m.y));
    hit=aligned && dist<=(spec.range||6) && guardianLineClear(m,a.axis);
    if (hit) monsterRangedAttack(m);
  } else if (a.id==='arcane-strip') {
    const r=spec.range||2;
    hit=a.axis==='row'
      ? player.y===a.targetY && Math.abs(player.x-a.targetX)<=r
      : player.x===a.targetX && Math.abs(player.y-a.targetY)<=r;
    if (hit) monsterRangedAttack(m);
  } else if (a.id==='mending-channel') {
    if (m.hp<a.startHp) msg(ui('愈合咏唱被打断。','Mending Channel interrupted.'),'good');
    else {
      const heal=Math.max(1,Math.round(m.maxHp*.15));
      m.hp=Math.min(m.maxHp,m.hp+heal);
      msg(ui(`愈合完成：守卫恢复 ${heal} 点生命。`,`Mending completed: guardian restored ${heal} HP.`),'bad');
    }
  } else if (a.id==='blood-tether') {
    hit=Math.max(Math.abs(player.x-m.x),Math.abs(player.y-m.y))<=3;
    if (hit) monsterAttack(m);
  } else if (a.id==='rupture-cross') {
    const r=spec.radius||3, dx=Math.abs(player.x-m.x), dy=Math.abs(player.y-m.y);
    hit=(player.x===m.x && dy<=r) || (player.y===m.y && dx<=r);
    if (hit) monsterAttack(m);
  }
  if (guardianDepth(m)===90) s.sequenceIndex=((s.sequenceIndex||0)+1)%GUARDIAN_ECHO_SEQUENCE.length;
  if (a.id!=='mending-channel') msg(hit
    ? ui(`${spec.title}命中。下一次按预警反制。`,`${spec.title} hit. Counter the next warning.`)
    : ui(`${spec.title}落空：反制成功。`,`${spec.title} missed: counterplay succeeded.`), hit?'bad':'good');
  return true;
}
function guardianAction(m) {
  if (!m || state!=='playing' || (!m.midBoss && !m.boss)) return false;
  normalizeGuardianIdentity(m);
  const s=guardianState(m);
  if (!s) return false;
  if (s.active && turns>=Number(s.active.resolveTurn||0)) return guardianResolveSpecial(m,s);
  if (guardianDepth(m)===100 && m.boss && !s.active) {
    const phase=guardianFinalPhaseKey(m);
    if (s.finalPhase!==phase) {
      s.finalPhase=phase;
      s.nextSpecialTurn=Math.min(Number(s.nextSpecialTurn)||Infinity,turns+1);
      msg(phase==='void'
        ? ui('终焉渊主进入第二阶段：虚空裁线开始。','The End-Abyss Sovereign enters Phase II: Void Line begins.')
        : ui('终焉渊主进入第三阶段：深渊心爆加速。','The End-Abyss Sovereign enters Phase III: Heart Nova accelerates.'),'bad');
    }
  }
  if (s.active || turns<Number(s.nextSpecialTurn||Infinity)) return false;
  const spec=guardianSpecFor(m,s);
  if (!spec) return false;
  if (spec.id==='mending-channel' && m.hp>=m.maxHp*.85) {
    s.nextSpecialTurn=turns+2;
    return false;
  }
  guardianStartSpecial(m,s,spec);
  return true;
}
function drawGuardianTelegraph(m,now) {
  const a=m && m.guardianEncounter && m.guardianEncounter.active;
  if (!a) return;
  const spec=guardianSpecById(a.id);
  if (!spec) return;
  const pulse=.12+.08*Math.sin(now*8);
  const fillCell=(x,y,alpha=.22) => {
    if (!inB(x,y)) return;
    ctx.globalAlpha=alpha+pulse;
    ctx.fillStyle=spec.color;
    ctx.fillRect(x*TILE+2,y*TILE+2,TILE-4,TILE-4);
    ctx.globalAlpha=.88;
    ctx.strokeStyle=spec.color;
    ctx.lineWidth=2;
    ctx.strokeRect(x*TILE+3,y*TILE+3,TILE-6,TILE-6);
  };
  ctx.save();
  if (a.id==='frost-ring' || a.id==='echo-ring' || a.id==='heart-nova') {
    const r=spec.radius||2;
    for (let y=m.y-r;y<=m.y+r;y++) for (let x=m.x-r;x<=m.x+r;x++) fillCell(x,y,.13);
  } else if (a.id==='ember-mark' || a.id==='echo-mark' || a.id==='throne-mark') {
    fillCell(a.targetX,a.targetY,.3);
  } else if (guardianLineLike(a.id)) {
    const r=spec.range||6;
    if (a.axis==='row') for (let x=Math.max(0,m.x-r);x<=Math.min(MAP_W-1,m.x+r);x++) fillCell(x,a.line,.12);
    else for (let y=Math.max(0,m.y-r);y<=Math.min(MAP_H-1,m.y+r);y++) fillCell(a.line,y,.12);
  } else if (a.id==='arcane-strip') {
    const r=spec.range||2;
    if (a.axis==='row') for (let x=a.targetX-r;x<=a.targetX+r;x++) fillCell(x,a.targetY,.14);
    else for (let y=a.targetY-r;y<=a.targetY+r;y++) fillCell(a.targetX,y,.14);
  } else if (a.id==='rupture-cross') {
    const r=spec.radius||3;
    for (let d=-r;d<=r;d++) { fillCell(m.x+d,m.y,.14); fillCell(m.x,m.y+d,.14); }
  } else if (a.id==='blood-tether') {
    ctx.globalAlpha=.82; ctx.strokeStyle=spec.color; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(m.x*TILE+TILE/2,m.y*TILE+TILE/2);
    ctx.lineTo(player.x*TILE+TILE/2,player.y*TILE+TILE/2); ctx.stroke();
  } else if (a.id==='mending-channel') {
    ctx.globalAlpha=.45+pulse; ctx.strokeStyle=spec.color; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(m.x*TILE+TILE/2,m.y*TILE+TILE/2,TILE*.72,0,Math.PI*2); ctx.stroke();
  }
  ctx.restore();
}

function monstersTurn() {
  for (const m of [...monsters]) {
    if (guardianAction(m)) {
      if (state !== 'playing') return;
      continue;
    }
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
      else if (stepToward(m) && engagementStrike(m) && state !== 'playing') return;
    } else if (m.alert > 0) {
      m.alert--;
      if (stepToward(m) && engagementStrike(m) && state !== 'playing') return;
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
  const hurt = clamp(Number(e.hurtT) || 0, 0, 1);
  ctx.translate(px, py);
  if (hurt > 0 && !reducedMotion) ctx.scale(1 + hurt * .09, 1 - hurt * .07);
  ctx.drawImage(image, sx, sy, sw, sh, -width / 2, -height / 2, width, height);
  if (hurt > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(.82, hurt);
    ctx.filter = 'brightness(3.8) saturate(0)';
    ctx.drawImage(image, sx, sy, sw, sh, -width / 2, -height / 2, width, height);
    ctx.restore();
    ctx.globalAlpha = Math.min(.78, hurt);
    ctx.strokeStyle = '#fff3dd';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(width, height) * .43, 0, Math.PI * 2);
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
    // Equipment identity is carried by the authored class sprite. A restrained ground glow
    // communicates rarity without drawing fake weapon/armor geometry across the character.
    const color = RARITIES[best].color;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = .08 + best * .025 + .025 * Math.sin(now * 4);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(cx, cy + TILE * .34, 14 + best, 4.5 + best * .2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  const hurtState = clamp(Number(player.hurtT) || 0, 0, 1) > .01;
  const skillState = clamp(classSkillFxT, 0, 1) > .01;
  const attackState = clamp(Number(player.lungeT) || 0, 0, 1) > .01;
  // Sprite-state ownership stays in the canonical renderer: hurt > skill > attack > idle.
  const actionCol = hurtState ? 2 : skillState ? 3 : attackState ? 1 : 0;
  const useActionAtlas = actionCol !== 0 && imageReady(heroActionAtlasV2);
  const heroImage = useActionAtlas ? heroActionAtlasV2 : heroAtlasV11;
  const heroFrame = useActionAtlas ? heroIndex * 4 + actionCol : heroIndex;
  const pos = drawAtlasEntity(player, heroImage, heroFrame, 4, useActionAtlas ? 4 : 1, 43, 52, now);
  if (best >= 2) {
    const color = RARITIES[best].color;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < Math.min(3, best); i++) {
      const phase = now * (1.4 + i * .18) + i * 2.2;
      ctx.globalAlpha = .16 + .08 * Math.sin(phase);
      ctx.beginPath();
      ctx.arc(pos[0] + Math.sin(phase) * (11 + i * 2), pos[1] + 16 - ((now * .018 + i * 8) % 22), 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
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
  const deepMonsterIndex = DEEP_MONSTER_ART_INDEX[m.sprite];
  if (deepMonsterIndex !== undefined && imageReady(deepMonsterAtlasV1)) {
    const size = m.elite ? 40 : 35;
    return { pos: drawAtlasEntity(m, deepMonsterAtlasV1, deepMonsterIndex, 4, 4, size, size + 3, now), size: size + 3, bespoke: true };
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
function drawDungeonProp(index, px, py, width, height, alpha = 1) {
  if (!imageReady(dungeonPropsAtlasV1) || !Number.isInteger(index) || index < 0) return false;
  const cols = 6, rows = 4;
  const sw = dungeonPropsAtlasV1.naturalWidth / cols, sh = dungeonPropsAtlasV1.naturalHeight / rows;
  const sx = (index % cols) * sw, sy = Math.floor(index / cols) * sh;
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true;
  ctx.shadowColor = 'rgba(0,0,0,.72)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  ctx.drawImage(dungeonPropsAtlasV1, sx, sy, sw, sh, px - width / 2, py - height / 2, width, height);
  ctx.restore(); return true;
}
const trapPropForDepth = d => d >= 75 ? DUNGEON_PROP_ART.voidRift
  : d >= 50 ? DUNGEON_PROP_ART.lavaVent : d >= 25 ? DUNGEON_PROP_ART.iceCrystal : DUNGEON_PROP_ART.webNest;
const dungeonNpcProp = type => type === 'shrine' ? DUNGEON_PROP_ART.angelShrine
  : type === 'event' ? DUNGEON_PROP_ART.voidRift
  : type === 'rest' ? DUNGEON_PROP_ART.campfire : type === 'shop' ? DUNGEON_PROP_ART.marketStall : -1;
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
    const cx = px + TILE / 2, cy = py + TILE / 2;
    if (!drawDungeonProp(trapPropForDepth(depth), cx, cy, 28, 28, .92)) {
      ctx.strokeStyle = 'rgba(224,167,63,.55)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 8, py + 8, TILE - 16, TILE - 16); ctx.beginPath();
      ctx.moveTo(px + 10, py + 10); ctx.lineTo(px + TILE - 10, py + TILE - 10);
      ctx.moveTo(px + TILE - 10, py + 10); ctx.lineTo(px + 10, py + TILE - 10); ctx.stroke();
    }
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
    const spr = n.type === 'shrine' || n.type === 'event' ? SPRITES.shrine : n.type === 'rest' ? SPRITES.camp : SPRITES.merchant;
    const prop = dungeonNpcProp(n.type);
    const px = n.fx * TILE + TILE / 2, py = n.fy * TILE + TILE / 2;
    const dims = n.type === 'shop' ? [34, 32] : (n.type === 'shrine' || n.type === 'event') ? [31, 36] : [30, 30];
    if (prop < 0 || !drawDungeonProp(prop, px, py, dims[0], dims[1], .98))
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
      if (!drawDungeonProp(DUNGEON_PROP_ART.woodBarrel, px, by, 28, 28, .96)) {
        ctx.fillStyle = '#6b4a2e'; ctx.fillRect(px - 9, by - 8, 18, 14);
        ctx.fillStyle = '#4a301c'; ctx.fillRect(px - 9, by - 5, 18, 3); ctx.fillRect(px - 9, by + 3, 18, 3);
        ctx.fillStyle = '#8a6a44'; ctx.beginPath(); ctx.ellipse(px, by - 8, 9, 3, 0, Math.PI, 0); ctx.fill();
      }
      continue;
    }
    if (it.type === 'equip') {
      const glow = .34 + .18 * Math.sin(now * 3.5 + it.x);
      const rarityColor = RARITIES[it.item.rarity].color;
      const rg = ctx.createRadialGradient(px, py + 7, 1, px, py + 7, 21);
      rg.addColorStop(0, rarityColor);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save(); ctx.globalAlpha = Math.max(.12, glow * .42); ctx.fillStyle = rg;
      ctx.fillRect(px - 23, py - 16, 46, 46);
      ctx.globalAlpha = .38 + glow * .45; ctx.strokeStyle = rarityColor; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(px, py + 12, 13, 4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    if (it.type === 'amulet') {
      const g2 = ctx.createRadialGradient(px, py, 2, px, py, TILE);
      g2.addColorStop(0, 'rgba(255,120,90,.35)');
      g2.addColorStop(1, 'rgba(255,120,90,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(px - TILE, py - TILE, TILE * 2, TILE * 2);
    }
    if (it.type === 'chest') {
      if (!drawDungeonProp(DUNGEON_PROP_ART.treasureChest, px, py, 30, 28, .98) && spr)
        ctx.drawImage(spr.img, px - 12, py - 12, 24, 24);
    } else if (it.type === 'equip' && drawGroundEquipment(it.item, px, py, 31)) {
      // canonical Canvas owns tier-specific ground equipment art
    } else if (!drawLootIcon(iconId, px, py, 27) && spr) {
      ctx.drawImage(spr.img, px - 12, py - 12, 24, 24);
    }
    if (it.type === 'equip' && Math.max(Math.abs(it.x - player.x), Math.abs(it.y - player.y)) <= 2) {
      const rawLabel = visibleItemName(it.item);
      const label = rawLabel.length > 13 ? rawLabel.slice(0, 12) + '…' : rawLabel;
      ctx.save();
      ctx.font = '700 11px "Segoe UI","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const labelW = Math.min(108, Math.max(28, ctx.measureText(label).width + 10));
      ctx.fillStyle = 'rgba(8,6,5,.82)'; ctx.fillRect(px - labelW / 2, py - 24, labelW, 15);
      ctx.strokeStyle = RARITIES[it.item.rarity].color; ctx.globalAlpha = .72;
      ctx.strokeRect(px - labelW / 2, py - 24, labelW, 15);
      ctx.globalAlpha = 1; ctx.fillStyle = '#f4e8d1'; ctx.fillText(label, px, py - 16.5);
      ctx.restore();
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
    drawGuardianTelegraph(m, now);
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

  for (const fx of impactFx) {
    const p = 1 - fx.life;
    const alpha = Math.max(0, fx.life);
    const radius = (fx.crit ? 9 : 6) + p * (fx.crit ? 25 : 17);
    ctx.save();
    ctx.translate(fx.x, fx.y);
    ctx.rotate(fx.angle);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = fx.color;
    ctx.fillStyle = fx.soft;
    ctx.lineWidth = fx.crit ? 3.5 : 2.2;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
    if (fx.kind === 'mage') {
      ctx.beginPath(); ctx.arc(0, 0, radius * .58, 0, Math.PI * 2); ctx.stroke();
    } else if (fx.kind === 'ranger') {
      ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, -5); ctx.lineTo(radius, 0); ctx.lineTo(2, 5); ctx.stroke();
    } else {
      ctx.lineWidth = fx.crit ? 6 : 4;
      ctx.beginPath();
      ctx.moveTo(-radius * .8, fx.kind === 'assassin' ? -radius * .55 : radius * .45);
      ctx.lineTo(radius * .9, fx.kind === 'assassin' ? radius * .45 : -radius * .55);
      ctx.stroke();
    }
    ctx.restore();
  }

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
    ctx.strokeStyle = a.kind === 'arcane' ? '#80b4ff' : '#f2e3ad';
    ctx.shadowColor = a.kind === 'arcane' ? '#477cff' : 'transparent';
    ctx.shadowBlur = a.kind === 'arcane' ? 7 : 0;
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

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const f of floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.font = `900 ${Math.round(15 * (f.scale || 1))}px "Segoe UI",sans-serif`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(20,8,5,.86)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (hurtFlash > 0) {
    ctx.fillStyle = `rgba(150,16,12,${Math.min(.34, hurtFlash * .42)})`;
    ctx.fillRect(-4, -4, canvas.width + 8, canvas.height + 8);
  }

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
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vy += 160 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = impactFx.length - 1; i >= 0; i--) {
    impactFx[i].life -= dt * (impactFx[i].crit ? 2.5 : 3.6);
    if (impactFx[i].life <= 0) impactFx.splice(i, 1);
  }
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.t += dt;
    if (a.t >= a.dur) arrows.splice(i, 1);
  }
  if (trauma > 0) trauma = Math.max(0, trauma - dt * 1.6);
  if (hurtFlash > 0) hurtFlash = Math.max(0, hurtFlash - dt * 2.8);
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
  ensurePlayerMana();
  if ($('st-manatext')) $('st-manatext').textContent = `${player.mana}/${player.manaMax}`;
  if ($('st-manafill')) $('st-manafill').style.width = (player.manaMax ? player.mana / player.manaMax * 100 : 0) + '%';
  const lowHp = state === 'playing' && player.hp > 0 && player.hp / pMaxHp() <= 0.25;
  $('lowhp-vignette').classList.toggle('hidden', !lowHp);
  if ($('st-potion-wrap')) {
    $('st-potion-wrap').classList.toggle('urgent', lowHp && player.potions > 0);
    $('st-potion-wrap').title = lowHp && player.potions > 0
      ? ui(`生命危险：按 Q 或点击这里使用治疗药水（剩余 ${player.potions}）`, `Critical HP: press Q or click here to use a Healing Potion (${player.potions} left)`)
      : ui('使用治疗药水（Q）', 'Use Healing Potion (Q)');
  }
  $('st-lvl').textContent = player.lvl;
  $('st-xp').textContent = `(${player.xp}/${PROGRESSION_RULES.xpThreshold(player.lvl)})`;
  $('st-atk').textContent = pAtk();
  $('st-def').textContent = pDef();
  $('st-crit').textContent = pCrit() + '%';
  $('st-gold').textContent = player.gold;
  $('st-potion').textContent = player.potions;
  $('st-scroll').textContent = player.scrolls;
  if ($('st-key')) $('st-key').textContent = player.keys || 0;
  if ($('st-escape')) $('st-escape').textContent = player.escapes || 0;
  if ($('st-escape-wrap')) $('st-escape-wrap').style.display = greedyMode ? '' : 'none';
  if ($('st-mobs')) {
    const mobsEl = $('st-mobs');
    const bossHere = monsters && monsters.some(m => m.boss || m.midBoss);
    mobsEl.textContent = (monsters ? monsters.length : 0) + (bossHere ? ' ⚑' : '');
    mobsEl.classList.toggle('boss-here', !!bossHere);
  }
  const skEl = $('st-skill');
  if (skEl) {
    const manaCost = skillManaCost();
    if (player.skillCd > 0) {
      skEl.textContent = ui(`${player.skillCd}回合 · ${manaCost}蓝`, `CD ${player.skillCd} · ${manaCost} MP`);
      skEl.className = 'cd';
    } else if (player.mana < manaCost) {
      skEl.textContent = ui(`蓝量 ${player.mana}/${manaCost}`, `Mana ${player.mana}/${manaCost}`);
      skEl.className = 'mana-low';
    } else {
      skEl.textContent = ui(`${classDef().skill.name} · ${manaCost}蓝`, `${classDef().skill.name} · ${manaCost} MP`);
      skEl.className = 'ready';
    }
  }
  const onStairs = map && map[player.y][player.x] === STAIRS;
  if (state === 'playing' && onStairs) guideOnce('stairs',
    'Enter 正常下潜；Shift+Enter 是满足条件时的付费快速下潜。J 始终是主动攻击。',
    'Enter descends normally. Shift+Enter is the paid Quick Dive when available. J always means basic attack.');
  const shopHere = npcAt(player.x + (player.facing ? player.facing[0] : 0), player.y + (player.facing ? player.facing[1] : 0));
  $('hint').classList.toggle('active', onStairs);
  $('hint').textContent = onStairs
    ? (canDescendNow() ? ui(`> Enter 下潜 · Shift+Enter 快速下潜（${quickDiveCost(depth, QUICK_DIVE_STEP)} G 直坠 ${QUICK_DIVE_STEP} 层）`, `> Enter Descend · Shift+Enter Quick Dive (${quickDiveCost(depth, QUICK_DIVE_STEP)} G for ${QUICK_DIVE_STEP} floors)`) : ui('> 击败本层首领才能离开。','> Defeat the floor guardian before leaving.'))
    : shopHere && shopHere.type === 'shop'
      ? ui('> 撞向商人即可交易','> Walk into the merchant to trade')
      : shopHere && shopHere.type === 'shrine'
        ? ui('> 撞向神龛即可祈祷','> Walk into the shrine to pray')
        : shopHere && shopHere.type === 'event'
          ? ui('> 撞向异常回响，决定是否接受交易','> Walk into the echo event to consider its bargain')
          : shopHere && shopHere.type === 'rest'
            ? ui('> 撞向营地即可包扎','> Walk into the camp to rest')
          : ui('> J 主动攻击 · K 技能（C 兼容）· 点击已探索地块移动','> J Basic Attack · K Skill (C alias) · click explored tiles to move');
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
  if (!player || (state !== 'playing' && state !== 'town' && state !== 'paused')) return false;
  const savedState = state === 'paused' ? 'playing' : state;
  const blob = {
    version: SAVE_VERSION,
    mode: greedyMode ? RUN_MODE_GREEDY : RUN_MODE_CLASSIC,
    profileId: PROFILE_ID,
    seed: RUN_SEED,
    rng: rngFn.getState(),
    classId,
    depth, turns, state: savedState,
    player: JSON.parse(JSON.stringify(player)),
    map, explored,
    monsters: monsters.map(m => ({ ...m })),
    items, npcs, shopStock, traps, secrets, floorCleared,
    decals: [...decals],
    logLines: logLines.slice(0, 12),
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(blob)); saveRecord(); return true; }
  catch (e) { return false; }
}
function manualSaveNow() {
  if (!persistRun()) return false;
  if (state === 'paused') {
    const copy = $('pause-copy');
    if (copy) copy.textContent = ui(`第 ${depth} 层 · ${classDef().name} · 已手动保存。`, `Floor ${depth} · ${classDef().name} · Saved manually.`);
  } else if (state === 'playing') {
    msg(ui('当前远征已手动保存。','Current expedition saved manually.'), 'good');
    updateHud();
  }
  return true;
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
  skillFollowup = null;
  buildSprites();
  classId = raw.classId in CLASSES ? raw.classId : 'warrior';
  setSeed(raw.seed);
  rngFn.setState(raw.rng);
  depth = raw.depth; turns = raw.turns; state = 'playing';
  player = raw.player;
  ensurePlayerMana(player, classId);
  map = raw.map; explored = raw.explored;
  monsters = raw.monsters || []; items = raw.items || []; npcs = raw.npcs || [];
  shopStock = raw.shopStock || [];
  traps = raw.traps || []; secrets = raw.secrets || [];
  floorCleared = !!raw.floorCleared;
  decals.length = 0;
  (raw.decals || []).forEach(d => decals.push(d));
  logLines = raw.logLines || [];
  migrateLegacyEquippedWeaponToInventory();
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
const UI_SCREENS = ['title-screen', 'class-screen', 'pause-screen', 'audio-settings-screen', 'shop-screen',
  'talent-screen', 'refine-screen', 'shrine-screen', 'echo-screen', 'town-screen', 'achv-screen', 'help-screen',
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
        <span class="stats">${ui(`生命 ${c.hpBase} · 攻击 ${c.atkBase} · 蓝量 ${manaRuleFor(c.id).max}<br>技能：${esc(c.skill.name)}（${manaRuleFor(c.id).cost} 蓝 · 冷却 ${c.skill.cd}）<br>${c.rangedRange ? `J 远程普攻：${c.rangedRange} 格<br>` : 'J 主动普攻<br>'}${esc(c.skill.desc)}`, `HP ${c.hpBase} · ATK ${c.atkBase} · Mana ${manaRuleFor(c.id).max}<br>Skill: ${esc(c.skill.name)} (${manaRuleFor(c.id).cost} MP · CD ${c.skill.cd})<br>${c.rangedRange ? `J Ranged Basic: ${c.rangedRange} tiles<br>` : 'J Basic Attack<br>'}${esc(c.skill.desc)}`)}</span>
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
  const buyRows = shopStock.map((row, i) => `
    <div class="shop-row">
      <span>${esc(visibleShopRowName(row))}</span>
      <b>${row.price} G</b>
      <button type="button" data-buy="${i}">${ui('购买','Buy')}</button>
    </div>`).join('');
  const sellRows = (player.inv || []).map((it, i) => `
    <div class="shop-row shop-sell-row">
      <span>${esc(visibleItemName(it))}<small>${ui(`职业适配 ${classFitOf(it)}`, `Class Fit ${classFitOf(it)}`)}</small></span>
      <b>+${sellPrice(it)} G</b>
      <button type="button" data-shop-sell="${i}">${ui('出售','Sell')}</button>
    </div>`).join('');
  list.innerHTML = `<h3>${ui('购买','Buy')}</h3>${buyRows}<h3>${ui('出售背包装备','Sell Backpack Gear')}</h3>` +
    (sellRows || `<p class="lede">${ui('背包里没有可出售的装备。','No backpack gear to sell.')}</p>`);
}
function sellDungeonShopItem(i) {
  if (state !== 'shop' || !player || !Array.isArray(player.inv)) return false;
  const it = player.inv[i];
  if (!it) return false;
  const gold = sellPrice(it);
  player.inv.splice(i, 1);
  player.gold += gold;
  selectedBagIndex = -1;
  sfx.shop();
  msg(ui(`你把【${it.name}】卖给了蒙面商人，获得 ${gold} G。`, `You sold [${visibleItemName(it)}] to the masked merchant for ${gold} G.`), 'gold');
  renderBag(); renderShop(); updateHud(); persistRun();
  return true;
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
  if ($('btn-shrine-ok')) $('btn-shrine-ok').textContent = ui('祈祷','Pray');
  if ($('btn-shrine-leave')) $('btn-shrine-leave').textContent = ui('离开','Leave');
  state = 'playing';
}

// ================= 贪婪远征：城镇 / 回城 / 元进度 =================
const TOWN_MARKET_SUPPLIES = Object.freeze({
  potion: { zh:'治疗药水', en:'Healing Potion', base:SHOP.potionPrice || 16,
    held:m => m.potions || 0,
    apply:m => { m.potions = (m.potions || 0) + 1; } },
  scroll: { zh:'传送卷轴', en:'Teleport Scroll', base:SHOP.scrollPrice || 28,
    held:m => m.scrolls || 0,
    apply:m => { m.scrolls = (m.scrolls || 0) + 1; } },
  escape: { zh:'回城卷轴', en:'Return Scroll', base:SHOP.escapePrice || 26,
    held:m => m.escapes || 0,
    apply:m => { m.escapes = (m.escapes || 0) + 1; } },
  key: { zh:'锈蚀钥匙', en:'Rusty Key', base:SHOP.keyPrice || 22,
    held:m => m.keys || 0,
    apply:m => { m.keys = (m.keys || 0) + 1; } },
  insurance: { zh:'保险符', en:'Insurance Charm', base:SHOP.insurancePrice || 120,
    held:m => m.insurance || 0,
    apply:m => { m.insurance = (m.insurance || 0) + 1; } },
});
const TOWN_MARKET_IDS = Object.freeze(Object.keys(TOWN_MARKET_SUPPLIES));
function townMarketPrice(id, tier) {
  const def = TOWN_MARKET_SUPPLIES[id];
  if (!def) return 0;
  return ECONOMY_RULES.townSupplyPrice(def.base, tier);
}
function freshTownMarket(tier = townTierForArt()) {
  const stock = {};
  const projectBonus = TOWN_GROWTH_RULES.marketStockBonus(currentTownWorks());
  for (const id of TOWN_MARKET_IDS) stock[id] = ECONOMY_RULES.townSupplyStock(id, tier, projectBonus);
  return { v:1, cycleRun:Math.max(0, Math.floor(Number(meta && meta.runs) || 0)), tier, stock };
}
function validTownMarket(row) {
  return !!(row && row.v === 1 && Number.isInteger(row.cycleRun) && row.cycleRun >= 0 &&
    Number.isInteger(row.tier) && row.tier >= 1 && row.tier <= 10 && row.stock &&
    TOWN_MARKET_IDS.every(id => Number.isInteger(row.stock[id]) && row.stock[id] >= 0 && row.stock[id] <= 99));
}
function ensureTownMarket() {
  if (!meta) return null;
  const cycleRun = Math.max(0, Math.floor(Number(meta.runs) || 0));
  const tier = townTierForArt();
  if (!validTownMarket(meta.market) || meta.market.cycleRun !== cycleRun || meta.market.tier !== tier) {
    meta.market = freshTownMarket(tier);
    saveMeta();
  }
  return meta.market;
}
function townReadinessPlan() {
  const market = ensureTownMarket();
  if (!meta || !market) return { rows:[], total:0, ready:false, available:false, affordable:false };
  const need = TOWN_RULES.expeditionSupplyNeeds(meta);
  const rows = Object.entries(need).filter(([, count]) => count > 0).map(([id, count]) => ({
    id, count, price:townMarketPrice(id, market.tier),
    available:(market.stock[id] || 0) >= count,
  }));
  const total = rows.reduce((sum, row) => sum + row.price * row.count, 0);
  return {
    rows, total, ready:rows.length === 0,
    available:rows.every(row => row.available),
    affordable:(meta.gold || 0) >= total,
  };
}
function buyTownReadiness() {
  if (state !== 'town' || !meta) return false;
  const plan = townReadinessPlan();
  if (plan.ready) { msg(ui('基础补给已经齐备。','Core supplies are already ready.'), 'good'); return true; }
  if (!plan.available) { msg(ui('本轮市集库存不足，无法一键补齐。','This market cycle lacks enough stock to complete the kit.'), 'bad'); return false; }
  if (!plan.affordable) { msg(ui(`补齐基础物资需要 ${plan.total} G，金库不足。`, `Completing the core kit costs ${plan.total} G; the vault is short.`), 'bad'); return false; }
  const market = ensureTownMarket();
  for (const row of plan.rows) {
    meta.gold -= row.price * row.count;
    market.stock[row.id] -= row.count;
    for (let i = 0; i < row.count; i++) TOWN_MARKET_SUPPLIES[row.id].apply(meta);
  }
  sfx.shop();
  msg(ui(`军需清单已补齐：2 瓶药水、1 张回城卷轴（${plan.total} G）。`, `Quartermaster kit complete: 2 Potions and 1 Return Scroll (${plan.total} G).`), 'gold');
  saveMeta(); renderTown();
  return true;
}

// 酒馆是受控的长期成长金币池：每次远征归来至多一杯；基础上限八杯，城镇工程最多扩到十一杯。
// 小幅永久收益让“活着回城”更有意义，但低权重攻击成长与硬上限避免刷酒取代装备。
const tavernMaxToasts = () => TOWN_GROWTH_RULES.tavernToastCap(currentTownWorks());
const TAVERN_REWARDS = Object.freeze([
  { id:'hearth', weight:50, zh:'炉火麦酒', en:'Hearth Ale', zhEffect:'生命上限永久 +2', enEffect:'Permanent Max HP +2', apply:m => { m.hpBase += 2; } },
  { id:'edge', weight:10, zh:'猎人烈酒', en:"Hunter's Spirit", zhEffect:'基础攻击永久 +1', enEffect:'Permanent Base ATK +1', apply:m => { m.atkBase += 1; } },
  { id:'fortune', weight:25, zh:'幸运苹果酒', en:'Lucky Cider', zhEffect:'暴击率永久 +1%', enEffect:'Permanent Crit +1%', apply:m => { m.critBase += 1; } },
  { id:'prosperity', weight:15, zh:'商路黑啤', en:'Caravan Stout', zhEffect:'金币获取永久 +1%', enEffect:'Permanent Gold Find +1%', apply:m => { m.goldFind += 1; } },
]);
function tavernCost() {
  return ECONOMY_RULES.tavernToastCost(meta && meta.tavernVisits, townTierForArt());
}
function tavernRewardById(id) { return TAVERN_REWARDS.find(row => row.id === id) || null; }
function tavernAvailable() {
  if (!meta || (meta.tavernVisits || 0) >= tavernMaxToasts()) return false;
  return (meta.tavernLastRun ?? -1) < (meta.runs || 0);
}
function drinkAtTavern() {
  if (state !== 'town' || !meta) return false;
  if ((meta.tavernVisits || 0) >= tavernMaxToasts()) {
    msg(ui('酒馆老板摇头：你的回响已经足够浓烈了。', 'The innkeeper shakes his head: your echo is strong enough already.'), 'gold');
    return false;
  }
  if (!tavernAvailable()) {
    msg(ui('这一趟已经喝过了。完成下一次远征后再来。', 'You already drank after this expedition. Return from another descent first.'), 'bad');
    return false;
  }
  const cost = tavernCost();
  if (meta.gold < cost) {
    msg(ui(`酒钱需要 ${cost} G，金库还不够。`, `The toast costs ${cost} G; the vault is short.`), 'bad');
    return false;
  }
  const total = TAVERN_REWARDS.reduce((sum, row) => sum + row.weight, 0);
  let roll = rng() * total;
  let reward = TAVERN_REWARDS[0];
  for (const row of TAVERN_REWARDS) { roll -= row.weight; if (roll <= 0) { reward = row; break; } }
  meta.gold -= cost;
  reward.apply(meta);
  meta.tavernVisits = (meta.tavernVisits || 0) + 1;
  meta.tavernLastRun = Math.max(0, Math.floor(Number(meta.runs) || 0));
  meta.tavernHistory = [...(meta.tavernHistory || []), reward.id].slice(-4);
  saveMeta();
  sfx.levelup();
  msg(ui(`你举杯喝下【${reward.zh}】：${reward.zhEffect}。`, `You raise [${reward.en}]: ${reward.enEffect}.`), 'gold');
  renderTown();
  return true;
}

const TOWN_CHECKPOINTS = TOWN_RULES.CHECKPOINTS;
const TOWN_HOTSPOTS = Object.freeze([
  { id:'quartermaster', cell:TOWN_NPC_ART.quartermaster, x:.11, y:.83, face:1, service:'stash', zh:'军需官', en:'Quartermaster' },
  { id:'smith', cell:TOWN_NPC_ART.smith, activeCell:TOWN_NPC_ART.smithAction, x:.27, y:.82, face:1, service:'bag', zh:'铁匠', en:'Smith' },
  { id:'innkeeper', cell:TOWN_NPC_ART.innkeeper, x:.43, y:.84, face:-1, service:'tavern', zh:'酒馆老板', en:'Innkeeper' },
  { id:'merchant', cell:TOWN_NPC_ART.travellingMerchant, x:.59, y:.82, face:-1, service:'market', zh:'行商', en:'Merchant' },
  { id:'oracle', cell:TOWN_NPC_ART.oracle, activeCell:TOWN_NPC_ART.oracleRitual, x:.72, y:.82, face:1, service:'wheel', zh:'占卜师', en:'Oracle' },
  { id:'records', cell:TOWN_NPC_ART.recordsClerk, x:.82, y:.83, face:-1, service:'relics', zh:'遗物书记', en:'Relic Curator' },
  { id:'portal', cell:TOWN_NPC_ART.portalWarden, activeCell:TOWN_NPC_ART.portalTechnician, x:.92, y:.82, face:-1, action:'portal', zh:'传送守卫', en:'Portal Warden' },
]);
const TOWN_WORK_FOR_HOTSPOT = Object.freeze({ smith:'smithy', innkeeper:'tavern', merchant:'market', records:'relics' });
const TOWN_RESIDENT_VISUALS = Object.freeze({
  provisioner:{ cell:TOWN_NPC_ART.provisioner, x:.52, y:.91, face:1, scale:.72 },
  apothecary:{ cell:TOWN_NPC_ART.apothecaryApprentice, x:.65, y:.91, face:-1, scale:.72 },
  watch:{ cell:TOWN_NPC_ART.townWatch, x:.035, y:.88, face:1, scale:.76 },
  scout:{ cell:TOWN_NPC_ART.expeditionScout, x:.975, y:.91, face:-1, scale:.74 },
  technician:{ cell:TOWN_NPC_ART.portalTechnician, x:.90, y:.91, face:1, scale:.70 },
  alchemist:{ cell:TOWN_NPC_ART.alchemist, x:.66, y:.90, face:1, scale:.70 },
});
let selectedTownCheckpoint = 1;
let townActiveService = 'plaza';
let townPendingHotspot = '';
let townLastFrame = 0;
let townPromptKey = '';
const townAvatar = { x:.5, y:.90, tx:.5, ty:.90, face:1 };
function activeTownResidents() {
  if (!meta) return [];
  const roster = TOWN_GROWTH_RULES.residentRoster({
    tier:townTierForArt(), works:meta.townWorks || {},
  });
  return roster.map(row => {
    const visual = TOWN_RESIDENT_VISUALS[row.id];
    return visual ? { ...row, ...visual, kind:'resident' } : null;
  }).filter(Boolean);
}
function townInteractables() { return [...TOWN_HOTSPOTS, ...activeTownResidents()]; }
function townHotspotById(id) { return townInteractables().find(row => row.id === id) || null; }
function nearestTownHotspot(maxDistance = Infinity) {
  let best = null, bestDistance = Infinity;
  for (const row of townInteractables()) {
    const dx = townAvatar.x - row.x, dy = (townAvatar.y - row.y) * .72;
    const distance = Math.hypot(dx, dy);
    if (distance < bestDistance) { best = row; bestDistance = distance; }
  }
  return bestDistance <= maxDistance ? { row:best, distance:bestDistance } : null;
}
function updateTownPrompt() {
  const prompt = $('town-prompt');
  if (!prompt) return;
  const near = nearestTownHotspot(.105);
  const key = near ? near.row.id : 'walk';
  if (key === townPromptKey) return;
  townPromptKey = key;
  prompt.textContent = near
    ? ui(`E / Enter 与${near.row.zh}交互 · 点击其他角色可自动走近`, `E / Enter: interact with ${near.row.en} · click another character to walk over`)
    : ui('WASD / 方向键在广场漫步 · 点击角色自动走近 · E / Enter 交互', 'Walk the plaza with WASD / arrows · click a character to approach · E / Enter interacts');
}
const TOWN_PAGE_FOR_SERVICE = Object.freeze({
  plaza:'plaza', bag:'gear', stash:'gear', market:'market', tavern:'tavern', wheel:'wheel', relics:'relics', portal:'depart',
});
const TOWN_DEFAULT_SERVICE_FOR_PAGE = Object.freeze({
  plaza:'plaza', gear:'stash', market:'market', tavern:'tavern', wheel:'wheel', relics:'relics', depart:'portal',
});
function townPageForService(service) { return TOWN_PAGE_FOR_SERVICE[service] || 'plaza'; }
function selectTownPage(page, focusTab = false) {
  if (!Object.prototype.hasOwnProperty.call(TOWN_DEFAULT_SERVICE_FOR_PAGE, page)) return false;
  if (townPageForService(townActiveService) !== page) townActiveService = TOWN_DEFAULT_SERVICE_FOR_PAGE[page];
  renderTownFocus(focusTab);
  return true;
}
function renderTownFocus(focusTab = false) {
  if (typeof document.querySelectorAll !== 'function') return;
  const page = townPageForService(townActiveService);
  document.querySelectorAll('#town-screen .town-service[data-service]').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.service === townActiveService);
  });
  document.querySelectorAll('#town-screen [data-town-page-panel]').forEach(panel => {
    const active = panel.dataset.townPagePanel === page;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
  document.querySelectorAll('#town-screen [data-town-page]').forEach(tab => {
    const active = tab.dataset.townPage === page;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
    tab.tabIndex = 0;
    if (active && focusTab && typeof tab.focus === 'function') tab.focus({ preventScroll:true });
  });
}
function townNpcLine(row) {
  if (!row || !meta) return null;
  const context = {
    tier:townTierForArt(), bestDepth:meta.bestDepth || 0, lastReturnDepth:meta.lastReturnDepth || 0,
    relics:relicLedgerCount(), works:meta.townWorks || {}, eventId:meta.townEvent ? meta.townEvent.id : '',
  };
  return row.kind === 'resident'
    ? TOWN_GROWTH_RULES.residentLine(row.id, context)
    : TOWN_GROWTH_RULES.npcLine(row.id, context);
}
function activateTownHotspot(row, focusTab = true) {
  if (!row || state !== 'town') return false;
  townPendingHotspot = '';
  const line = townNpcLine(row);
  if (focusTab && line) msg(ui(`${row.zh}：${line.zh}`, `${row.en}: ${line.en}`), 'good');
  if (row.action === 'portal') {
    townActiveService = 'portal';
    renderTownFocus(focusTab);
    const depart = $('btn-depart');
    if (depart) depart.focus({ preventScroll:true });
    return true;
  }
  townActiveService = row.kind === 'resident' ? 'plaza' : (row.service || 'stash');
  renderTownFocus(focusTab);
  return true;
}
function interactTown() {
  const near = nearestTownHotspot(.13);
  return near ? activateTownHotspot(near.row, true) : false;
}
function setTownTarget(x, y, hotspotId = '') {
  townAvatar.tx = clamp(Number(x) || .5, .045, .955);
  townAvatar.ty = clamp(Number(y) || .9, .79, .93);
  if (Math.abs(townAvatar.tx - townAvatar.x) > .004) townAvatar.face = townAvatar.tx >= townAvatar.x ? 1 : -1;
  townPendingHotspot = hotspotId;
}
function moveTownAvatar(dx, dy) {
  if (state !== 'town') return false;
  setTownTarget(townAvatar.tx + dx * .075, townAvatar.ty + dy * .055);
  return true;
}
function advanceTownAvatar(now) {
  const dt = townLastFrame ? Math.min(.05, Math.max(0, (now - townLastFrame) / 1000)) : 0;
  townLastFrame = now;
  const dx = townAvatar.tx - townAvatar.x, dy = townAvatar.ty - townAvatar.y;
  const distance = Math.hypot(dx, dy);
  if (distance > .001 && dt > 0) {
    const step = Math.min(distance, .46 * dt);
    townAvatar.x += dx / distance * step;
    townAvatar.y += dy / distance * step;
  }
  if (townPendingHotspot && Math.hypot(townAvatar.tx - townAvatar.x, townAvatar.ty - townAvatar.y) < .012)
    activateTownHotspot(townHotspotById(townPendingHotspot), true);
  updateTownPrompt();
}
function unlockedTownCheckpoints() {
  return TOWN_RULES.unlockedCheckpoints(meta && meta.bestDepth);
}
function selectTownCheckpoint(target) {
  if (state !== 'town' || !meta) return false;
  const checkpointDepth = Math.max(1, Math.floor(Number(target) || 1));
  if (!TOWN_RULES.isCheckpointUnlocked(checkpointDepth, meta.bestDepth)) return false;
  selectedTownCheckpoint = checkpointDepth;
  renderTown();
  return true;
}
function availableTownContracts() {
  return EXPEDITION_RULES.availableContracts(townTierForArt());
}
function selectTownContract(id) {
  if (state !== 'town' || !meta) return false;
  const normalized = EXPEDITION_RULES.normalizeContractId(id);
  if (!availableTownContracts().some(row => row.id === normalized)) return false;
  meta.contractId = normalized;
  saveMeta();
  renderTown();
  return true;
}
function renderTownContracts() {
  const panel = $('town-contracts');
  if (!panel || !meta) return;
  const rows = availableTownContracts();
  if (!rows.some(row => row.id === meta.contractId)) meta.contractId = 'none';
  const selected = EXPEDITION_RULES.normalizeContractId(meta.contractId);
  panel.innerHTML = `<div class="checkpoint-head"><b>${ui('远征委托','Expedition Contract')}</b><small>${ui('出发前选择 · 仅影响下一次远征','Choose before departure · affects the next expedition')}</small></div>` +
    `<div class="town-contract-grid">${rows.map(row => {
      const active = row.id === selected;
      return `<button type="button" data-contract="${row.id}" class="${active ? 'active' : ''}" aria-pressed="${active}"><b>${ui(row.zh,row.en)}</b><small>${ui(row.zhDesc,row.enDesc)}</small></button>`;
    }).join('')}</div>`;
}
function renderTownCheckpoints() {
  const panel = $('town-checkpoints');
  if (!panel || !meta) return;
  const unlocked = unlockedTownCheckpoints();
  if (!unlocked.includes(selectedTownCheckpoint)) selectedTownCheckpoint = 1;
  const best = Math.max(0, Math.floor(Number(meta.bestDepth) || 0));
  panel.replaceChildren();
  const head = document.createElement('div');
  head.className = 'checkpoint-head';
  const title = document.createElement('b');
  title.textContent = ui('已征服段首', 'Conquered Checkpoints');
  const note = document.createElement('small');
  note.textContent = ui(`最深 ${best} 层 · 到达新段首后即可从小镇重返`, `Deepest Floor ${best} · reached segment starts become departure points`);
  head.append(title, note);
  panel.appendChild(head);
  const grid = document.createElement('div');
  grid.className = 'checkpoint-grid';
  const nextLocked = TOWN_CHECKPOINTS.find(d => !unlocked.includes(d));
  const visibleCheckpoints = [...unlocked, ...(nextLocked ? [nextLocked] : [])];
  for (const checkpointDepth of visibleCheckpoints) {
    const open = unlocked.includes(checkpointDepth);
    const active = open && checkpointDepth === selectedTownCheckpoint;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.checkpoint = String(checkpointDepth);
    button.textContent = ui(`第 ${checkpointDepth} 层`, `Floor ${checkpointDepth}`);
    button.className = `${active ? 'active' : ''}${open ? '' : ' locked'}`;
    button.disabled = !open;
    button.setAttribute('aria-disabled', String(!open));
    button.setAttribute('aria-pressed', String(active));
    button.title = open
      ? ui(`从第 ${checkpointDepth} 层出发`, `Depart for Floor ${checkpointDepth}`)
      : ui(`尚未到达第 ${checkpointDepth} 层`, `Floor ${checkpointDepth} not reached yet`);
    grid.appendChild(button);
  }
  panel.appendChild(grid);
  const depart = $('btn-depart');
  if (depart) {
    const readiness = townReadinessPlan();
    const destination = selectedTownCheckpoint === 1
      ? ui('从第 1 层出发', 'Depart for Floor 1')
      : ui(`从已征服区 · 第 ${selectedTownCheckpoint} 层出发`, `Depart from conquered ground · Floor ${selectedTownCheckpoint}`);
    depart.textContent = `${destination} · ${readiness.ready ? ui('补给齐备','Kit Ready') : ui('补给不足','Low Supplies')}`;
    depart.classList.toggle('town-depart-warning', !readiness.ready);
    depart.title = readiness.ready
      ? ui('基础补给齐备，可以直接出发。','Core supplies are ready for departure.')
      : ui('仍可冒险出发，但建议至少准备 2 瓶药水和 1 张回城卷轴。','You may still depart, but 2 Potions and 1 Return Scroll are recommended.');
  }
}
function registerReturnedRelics(items) {
  if (!meta) return [];
  meta.relicLedger = meta.relicLedger && typeof meta.relicLedger === 'object' ? meta.relicLedger : {};
  const newly = [];
  for (const item of (Array.isArray(items) ? items : [])) {
    const key = SET_RULES.collectionKey(item);
    if (!key || meta.relicLedger[key]) continue;
    meta.relicLedger[key] = 1;
    const piece = SET_RULES.piece(item.setId, item.setPiece, meta.classId);
    if (piece) {
      newly.push(piece);
      recordTownChronicle({ kind:'relic', setId:item.setId, slot:item.setPiece });
    }
  }
  return newly;
}
function syncMetaFromPlayer(died) {
  if (!player) return;
  meta.lvl = player.lvl; meta.xp = player.xp;
  meta.hpBase = player.hpBase; meta.atkBase = player.atkBase;
  meta.manaMax = manaRuleFor(classId).max; meta.mana = clamp(Number(player.mana) || 0, 0, meta.manaMax);
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
// ================= 远征录：跨局档案 + 成就 =================
const ACHV = [
  { id:'first_run', zh:'初次远征', en:'First Descent', zhDesc:'完成一次出发。', enDesc:'Begin your first expedition.', value:r=>r.runs, target:1 },
  { id:'depth_10', zh:'深入地底', en:'Below the Threshold', zhDesc:'到达第 10 层。', enDesc:'Reach Floor 10.', value:r=>r.bestDepth, target:10 },
  { id:'depth_30', zh:'地底行者', en:'Deep Walker', zhDesc:'到达第 30 层。', enDesc:'Reach Floor 30.', value:r=>r.bestDepth, target:30 },
  { id:'depth_60', zh:'深渊旅人', en:'Abyss Traveler', zhDesc:'到达第 60 层。', enDesc:'Reach Floor 60.', value:r=>r.bestDepth, target:60 },
  { id:'depth_100', zh:'百层勇者', en:'Hundred-Floor Hero', zhDesc:'到达第 100 层。', enDesc:'Reach Floor 100.', value:r=>r.bestDepth, target:100 },
  { id:'kills_100', zh:'屠戮者', en:'Monster Slayer', zhDesc:'累计击杀 100 个敌人。', enDesc:'Defeat 100 enemies across runs.', value:r=>r.totalKills, target:100 },
  { id:'kills_500', zh:'千斩万剐', en:'Five Hundred Echoes', zhDesc:'累计击杀 500 个敌人。', enDesc:'Defeat 500 enemies across runs.', value:r=>r.totalKills, target:500 },
  { id:'returns_5', zh:'知进知退', en:'Live to Delve Again', zhDesc:'安全回城 5 次。', enDesc:'Return safely to town 5 times.', value:r=>r.safeReturns, target:5 },
  { id:'guardians_9', zh:'守卫猎手', en:'Guardian Hunter', zhDesc:'累计击败 9 位深层守卫。', enDesc:'Defeat 9 deep guardians across runs.', value:r=>r.guardians, target:9 },
  { id:'rich', zh:'富甲一方', en:'Vault Keeper', zhDesc:'贪婪远征金库持有 1000 金币。', enDesc:'Hold 1000 Gold in the Greedy vault.', value:(_,e)=>e.gold, target:1000 },
  { id:'wheel_10', zh:'回响赌徒', en:'Echo Gambler', zhDesc:'幸运转盘累计抽奖 10 次。', enDesc:'Spin the town wheel 10 times.', value:(_,e)=>e.wheelTotal, target:10 },
  { id:'deaths_5', zh:'死神常客', en:'Frequent Visitor', zhDesc:'累计死亡 5 次。', enDesc:'Die 5 times across expeditions.', value:r=>r.deaths, target:5 },
  { id:'legend', zh:'传说收藏家', en:'Legend Collector', zhDesc:'获得一件传说装备。', enDesc:'Acquire a legendary item.', value:r=>r.legends, target:1 },
  { id:'win', zh:'心之归途', en:'Heartbound', zhDesc:'带走终焉之心，完成百层远征。', enDesc:'Carry the Dungeon Heart out and finish the hundred-floor journey.', value:r=>r.wins, target:1 },
];
function achievementEconomy() {
  const m=meta || loadMeta() || null;
  return { gold:Math.max(0,Number(m&&m.gold)||0), wheelTotal:Math.max(0,Number(m&&m.wheelTotal)||0) };
}
function checkAchv(announce=true) {
  const r=ensureRecord(), econ=achievementEconomy(), newly=[];
  for (const a of ACHV) {
    if (!r.achv[a.id] && a.value(r,econ) >= a.target) {
      r.achv[a.id]=1; newly.push(a);
      if (announce) msg(ui(`成就达成：【${a.zh}】——${a.zhDesc}`, `Achievement unlocked: [${a.en}] — ${a.enDesc}`), 'gold');
    }
  }
  if (newly.length) { saveRecord(); if (announce) sfx.levelup(); }
  return newly;
}
function renderAchv() {
  const r=ensureRecord(), econ=achievementEconomy();
  checkAchv(false);
  const unlocked=ACHV.filter(a=>r.achv[a.id]).length;
  const statsEl=$('achv-stats');
  if (statsEl) statsEl.innerHTML=[
    [ui('最深到达','Deepest Floor'),ui(`${r.bestDepth} 层`,`Floor ${r.bestDepth}`)],
    [ui('累计远征','Expeditions'),`${r.runs}`],
    [ui('累计击杀','Total Kills'),`${r.totalKills}`],
    [ui('通关次数','Wins'),`${r.wins}`],
    [ui('死亡次数','Deaths'),`${r.deaths}`],
    [ui('安全回城','Safe Returns'),`${r.safeReturns}`],
    [ui('深层守卫','Guardians'),`${r.guardians}`],
    [ui('成就解锁','Achievements'),`${unlocked} / ${ACHV.length}`],
  ].map(([k,v])=>`<div class="record-stat"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  const gridEl=$('achv-grid');
  if (gridEl) gridEl.innerHTML=ACHV.map(a=>{
    const got=!!r.achv[a.id], value=Math.max(0,Number(a.value(r,econ))||0);
    const pct=Math.max(0,Math.min(100,Math.round(value/a.target*100)));
    const progress=a.target===1 ? (got?ui('已完成','Complete'):ui('未完成','Not yet')) : `${Math.min(value,a.target)} / ${a.target}`;
    return `<div class="achv-card${got?' unlocked':' achv-locked'}">`+
      `<div class="achv-icon" aria-hidden="true">${got?'✦':'◇'}</div><div class="achv-copy"><h3>${esc(ui(a.zh,a.en))}</h3>`+
      `<p>${esc(ui(a.zhDesc,a.enDesc))}</p><div class="achv-progress"><i style="width:${pct}%"></i></div><small>${esc(progress)}</small></div></div>`;
  }).join('');
}
function enterTown() {
  skillFollowup = null;
  recordDepth(); saveRecord();
  state = 'town';
  townActiveService = 'plaza';
  checkAchv();
  meta.bestDepth = Math.max(meta.bestDepth || 0, depth);
  ensureWheel();
  saveMeta();
  persistRun();
  showTown();
}
function townCanvasSizeFor(width = window.innerWidth) {
  return width <= 760 ? { width: 720, height: 480 } : { width: 1120, height: 460 };
}
function applyTownViewport(width = window.innerWidth) {
  const cv = $('town-scene');
  if (!cv) return;
  const next = townCanvasSizeFor(width);
  if (cv.width !== next.width || cv.height !== next.height) {
    cv.width = next.width;
    cv.height = next.height;
    townStars = null;
  }
}
function showTown() {
  hideOverlay();
  hideUi('title-screen'); hideUi('class-screen'); hideUi('pause-screen');
  hideUi('shop-screen'); hideUi('talent-screen'); hideUi('shrine-screen'); hideUi('echo-screen');
  showUi('town-screen');
  applyTownViewport();
  townLastFrame = 0; townPromptKey = '';
  renderTown();
  renderTownFocus(false); updateTownPrompt();
  ensureTownLoop();
}
// ================= 幸运转盘（城镇金币回收站） =================
// 8 个奖品槽随元档持久化；每格最多结算一次，只有付费重置才能换新盘。
// 抽奖/重置同时按操作次数与城镇阶段递增，死亡不会免费洗盘或清掉成本。
const WHEEL_SLOTS = 8;
const wheelDepth = () => Math.max(3, meta ? (meta.bestDepth || 0) : 0);
const wheelTownTier = () => ECONOMY_RULES.townTier(meta && meta.bestDepth);
const spinCost = () => ECONOMY_RULES.wheelSpinCost(meta && meta.wheelSpins, wheelTownTier());
const resetWheelCost = () => ECONOMY_RULES.wheelResetCost(meta && meta.wheelResets, wheelTownTier());
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
const wheelClaimedCount = () => meta && Array.isArray(meta.wheelSlots)
  ? meta.wheelSlots.reduce((n, slot) => n + (slot && slot.claimed ? 1 : 0), 0) : 0;
function consumeWheelSlot(index) {
  if (!meta || !Array.isArray(meta.wheelSlots)) return false;
  const slot = meta.wheelSlots[index];
  if (!slot || slot.claimed) return false;
  const prizeKind = String(slot.kind || 'nothing');
  slot.claimed = true;
  slot.claimedKind = prizeKind;
  slot.claimedAtSpin = Number(meta.wheelTotal) || 0;
  slot.kind = 'nothing';
  if ('item' in slot) delete slot.item;
  if ('amount' in slot) delete slot.amount;
  return true;
}
function wheelSlotText(s) {
  if (s && s.claimed) return ui('已领取','Claimed');
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
  if (state !== 'town' || !meta) return false;
  ensureWheel();
  if (wheelClaimedCount() >= WHEEL_SLOTS) {
    msg(ui('这一轮八格都已经领取，先付费重置轮盘。','All eight slots are claimed. Reset the wheel before spinning again.'), 'bad');
    return false;
  }
  const cost = spinCost();
  if (meta.gold < cost) {
    msg(ui(`金库金币不够——抽奖需要 ${cost} G。`, `Not enough vault Gold — spinning costs ${cost} G.`), 'bad');
    return false;
  }
  meta.gold -= cost;
  const idx = rnd(WHEEL_SLOTS);
  const prize = meta.wheelSlots[idx];
  meta.wheelSpins++;
  meta.wheelTotal = (meta.wheelTotal || 0) + 1;
  sfx.chest();
  msg(ui(`轮盘停在第 ${idx + 1} 槽——`, `The wheel stops on slot ${idx + 1} —`), 'info');
  if (prize && !prize.claimed) {
    applyWheelPrize(prize);
    consumeWheelSlot(idx);
  } else {
    msg(ui('这一格已经领取过，本次不会重复发奖。','This slot was already claimed; it pays nothing again.'), 'bad');
  }
  startWheelSpin(idx);
  saveMeta(); renderTown();
  return true;
}
function resetWheel() {
  if (state !== 'town' || !meta) return false;
  const cost = resetWheelCost();
  if (meta.gold < cost) { msg(ui(`金库金币不够——重置轮盘需要 ${cost} G。`, `Not enough vault Gold — resetting costs ${cost} G.`), 'bad'); return false; }
  meta.gold -= cost;
  meta.wheelResets++;
  meta.wheelSlots = rollWheelSlots();
  sfx.skill();
  msg(ui(`轮盘已重摇（第 ${meta.wheelResets} 次），看看新的八格。`, `Wheel reset ${meta.wheelResets} times. Check the new eight slots.`), 'info');
  startWheelKick();
  saveMeta(); renderTown();
  return true;
}

// ---- 转盘视图：真正的圆盘 + 指针 + 缓动旋转（纯视觉层，结算保持同步） ----
const SECTOR_A = Math.PI * 2 / WHEEL_SLOTS;
const SECTOR_COLORS = {
  gold: '#8a5a20', potion: '#3f6b52', scroll: '#3d566e', key: '#4a4438',
  escape: '#50648a', insurance: '#6b4356', equip: '#7a3b52', nothing: '#241810',
};
function wheelSlotShort(s) {
  if (s && s.claimed) return ui('已领','Claimed');
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
    ctx.fillStyle = s.claimed ? '#241810' : (SECTOR_COLORS[s.kind] || '#333'); ctx.fill();
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
  return ECONOMY_RULES.townTier(meta && meta.bestDepth);
}
function drawTownNpcFigure(ctx, index, x, baseY, now, facing = 1, scale = 1) {
  const bob = reducedMotion ? 0 : Math.sin(now * .0026 + x * .013) * 1.15;
  const y = baseY + bob;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.38)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 12 * scale, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  if (imageReady(townNpcAtlasV1)) {
    const cols = 4, rows = 4;
    const sw = townNpcAtlasV1.naturalWidth / cols, sh = townNpcAtlasV1.naturalHeight / rows;
    const sx = (index % cols) * sw, sy = Math.floor(index / cols) * sh;
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
    ctx.translate(x, y - 23 * scale); ctx.scale(facing, 1);
    ctx.drawImage(townNpcAtlasV1, sx, sy, sw, sh, -18 * scale, -27 * scale, 36 * scale, 50 * scale);
  } else {
    ctx.fillStyle = 'rgba(24,18,20,.9)';
    ctx.beginPath(); ctx.arc(x, y - 16, 4.2 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 5 * scale, y - 12, 10 * scale, 16);
  }
  ctx.restore();
}
function drawTownHeroFigure(ctx, x, baseY, now, facing = 1, scale = 1) {
  const activeClass = meta && CLASSES[meta.classId] ? meta.classId : classId;
  const heroIndex = ['warrior', 'ranger', 'mage', 'assassin'].indexOf(activeClass);
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,.46)';
  ctx.beginPath(); ctx.ellipse(0, 1, 13, 3.6, 0, 0, Math.PI * 2); ctx.fill();
  const bob = reducedMotion ? 0 : Math.sin(now * .006) * .8;
  if (heroIndex >= 0 && imageReady(heroAtlasV11)) {
    const sw = heroAtlasV11.naturalWidth / 4, sh = heroAtlasV11.naturalHeight;
    ctx.translate(0, -27 + bob); ctx.scale(facing, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = 'rgba(0,0,0,.72)'; ctx.shadowBlur = 7; ctx.shadowOffsetY = 3;
    ctx.drawImage(heroAtlasV11, heroIndex * sw, 0, sw, sh, -22, -28, 44, 56);
  } else if (heroIndex >= 0 && imageReady(heroActionAtlasV2)) {
    const sw = heroActionAtlasV2.naturalWidth / 4, sh = heroActionAtlasV2.naturalHeight / 4;
    ctx.translate(0, -27 + bob); ctx.scale(facing, 1);
    ctx.drawImage(heroActionAtlasV2, 0, heroIndex * sh, sw, sh, -21, -27, 42, 54);
  } else {
    ctx.fillStyle = '#bda37b'; ctx.beginPath(); ctx.arc(0, -31, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b2d28'; ctx.fillRect(-7, -26, 14, 24);
  }
  ctx.restore();
}
function townRowHasNews(row) {
  if (!row || !meta || !meta.townEvent) return false;
  const eventId = meta.townEvent.id;
  return (eventId === 'relic_exhibition' && row.id === 'records') ||
    (eventId === 'caravan_surplus' && (row.id === 'merchant' || row.id === 'provisioner')) ||
    (eventId === 'scout_cache' && row.id === 'scout');
}
function drawTownNameplate(ctx, row, x, baseY, active, scale = 1) {
  const workId = TOWN_WORK_FOR_HOTSPOT[row.id];
  const workLevel = workId ? townWorkLevel(workId) : 0;
  const news = townRowHasNews(row);
  const label = ui(row.zh, row.en) + (workLevel ? ui(` · 建设 ${workLevel}`, ` · Lv ${workLevel}`) : '') + (news ? ' · !' : '');
  ctx.save();
  ctx.font = `600 ${Math.round(10 * scale)}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const width = Math.ceil(ctx.measureText(label).width) + 14 * scale;
  const height = 18 * scale, y = baseY - 65 * scale;
  ctx.fillStyle = active ? 'rgba(39,25,12,.94)' : 'rgba(7,6,8,.78)';
  ctx.strokeStyle = active ? '#f2d27b' : 'rgba(183,147,91,.56)';
  ctx.lineWidth = active ? 1.4 : 1;
  ctx.fillRect(x - width / 2, y, width, height);
  ctx.strokeRect(x - width / 2 + .5, y + .5, width - 1, height - 1);
  ctx.fillStyle = active ? '#fff0bd' : '#d5c4aa';
  ctx.fillText(label, x, y + height / 2);
  ctx.restore();
}
function drawTownNpcPopulation(ctx, now, W, H, G, tier) {
  const near = nearestTownHotspot(.105);
  const artScale = clamp(H / 300, 1, 1.34);
  const actors = townInteractables().map(row => ({ type:row.kind === 'resident' ? 'resident' : 'hotspot', row, x:W * row.x, baseY:H * row.y }));
  const extras = [
    { min:6, cell:TOWN_NPC_ART.townWatch, x:.19, y:.91, face:-1, scale:.70 },
    { min:9, cell:TOWN_NPC_ART.provisionerCrate, x:.50, y:.92, face:-1, scale:.68 },
  ];
  for (const row of extras) if (tier >= row.min)
    actors.push({ type:'extra', row, x:W * row.x, baseY:H * row.y });
  actors.push({ type:'hero', x:W * townAvatar.x, baseY:H * townAvatar.y });
  actors.sort((a, b) => a.baseY - b.baseY);
  for (const actor of actors) {
    if (actor.type === 'hero') {
      drawTownHeroFigure(ctx, actor.x, actor.baseY, now, townAvatar.face, artScale);
      continue;
    }
    if (actor.type === 'extra') {
      drawTownNpcFigure(ctx, actor.row.cell, actor.x, actor.baseY, now, actor.row.face, actor.row.scale * artScale);
      continue;
    }
    const row = actor.row;
    const selected = row.kind !== 'resident' && (townActiveService === row.service || (row.action === 'portal' && townActiveService === 'portal'));
    const nearby = !!(near && near.row.id === row.id);
    const hasNews = townRowHasNews(row);
    const pulse = !reducedMotion && row.activeCell !== undefined && (selected || nearby || hasNews) && Math.floor(now / 620) % 2;
    if (selected || nearby || hasNews) {
      ctx.save();
      ctx.globalAlpha = .2 + .08 * Math.sin(now * .006);
      ctx.fillStyle = '#f2d27b';
      ctx.beginPath(); ctx.ellipse(actor.x, actor.baseY + 2, 18 * artScale, 5 * artScale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const figureScale = row.kind === 'resident'
      ? (Number(row.scale) || .74) * (nearby ? 1.06 : 1)
      : (selected ? 1.02 : .94);
    drawTownNpcFigure(ctx, pulse ? row.activeCell : row.cell, actor.x, actor.baseY, now, row.face, figureScale * artScale);
    drawTownNameplate(ctx, row, actor.x, actor.baseY, selected || nearby || hasNews, (row.kind === 'resident' ? Math.max(.78, Number(row.scale) || .74) : 1) * artScale);
  }
}
function drawTownProjectLandmarks(ctx, now, W, H) {
  const smithy=townWorkLevel('smithy'), market=townWorkLevel('market'), tavern=townWorkLevel('tavern'), relics=townWorkLevel('relics');
  ctx.save();
  if (smithy) {
    const x=W*.27, y=H*.61, pulse=.45+.18*Math.sin(now/180);
    ctx.fillStyle='rgba(35,20,14,.88)'; ctx.fillRect(x-22,y-10,44,18);
    ctx.strokeStyle='rgba(202,128,54,.78)'; ctx.strokeRect(x-21.5,y-9.5,43,17);
    ctx.fillStyle=`rgba(255,132,42,${pulse.toFixed(2)})`; ctx.fillRect(x-8,y-4,16,8);
    ctx.fillStyle='rgba(46,38,35,.9)'; ctx.fillRect(x+12,y-22,7,13);
    if (smithy>=2) { ctx.fillStyle='rgba(242,170,73,.82)'; ctx.fillRect(x-19,y-15,5,5); ctx.fillRect(x+14,y-16,5,5); }
    if (smithy>=3) { ctx.strokeStyle='rgba(246,209,126,.7)'; ctx.beginPath(); ctx.moveTo(x-26,y+11); ctx.lineTo(x+26,y+11); ctx.stroke(); }
  }
  if (market) {
    const x=W*.59, y=H*.63;
    ctx.fillStyle='rgba(82,48,30,.88)'; ctx.fillRect(x-27,y-4,54,13);
    ctx.fillStyle=market>=2?'rgba(153,61,50,.88)':'rgba(112,76,45,.82)';
    ctx.beginPath(); ctx.moveTo(x-31,y-5); ctx.lineTo(x-20,y-19); ctx.lineTo(x+25,y-19); ctx.lineTo(x+31,y-5); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#8b673b'; for(let i=0;i<market+1;i++) ctx.fillRect(x-25+i*15,y+10,9,7);
    if(market>=3){ ctx.fillStyle='rgba(242,210,123,.78)'; ctx.fillRect(x+22,y-17,3,3); ctx.fillRect(x-25,y-17,3,3); }
  }
  if (tavern) {
    const x=W*.43, y=H*.60, pulse=.62+.16*Math.sin(now/260);
    for(let i=0;i<tavern+1;i++){
      const lx=x+(i-(tavern/2))*14;
      ctx.strokeStyle='rgba(96,68,42,.85)'; ctx.beginPath(); ctx.moveTo(lx,y-13); ctx.lineTo(lx,y-5); ctx.stroke();
      ctx.fillStyle=`rgba(255,190,83,${pulse.toFixed(2)})`; ctx.fillRect(lx-3,y-5,6,7);
    }
  }
  if (relics>=2) {
    const x=W*.82, y=H*.58;
    ctx.strokeStyle=relics>=3?'rgba(238,202,118,.86)':'rgba(173,131,73,.68)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x-35,y-24); ctx.lineTo(x-35,y+17); ctx.moveTo(x+35,y-24); ctx.lineTo(x+35,y+17); ctx.stroke();
    if(relics>=3){ ctx.fillStyle='rgba(219,178,91,.72)'; ctx.fillRect(x-38,y-27,76,3); }
  }
  ctx.restore();
}
function drawTownEventNotice(ctx, now, W, H) {
  if (!meta || !meta.townEvent) return;
  const pulse=.68+.22*Math.sin(now/210);
  const x=W*.51, y=H*.62;
  ctx.save();
  ctx.fillStyle='rgba(47,31,18,.92)';
  ctx.fillRect(x-18,y-14,36,25);
  ctx.strokeStyle='rgba(212,157,74,.78)';
  ctx.strokeRect(x-17.5,y-13.5,35,24);
  ctx.fillStyle='rgba(232,196,124,.82)';
  ctx.fillRect(x-11,y-7,22,2);
  ctx.fillRect(x-9,y-1,18,2);
  ctx.fillStyle='rgba(111,78,42,.95)';
  ctx.fillRect(x-2,y+11,4,17);
  ctx.font='700 16px "Segoe UI", sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(255,207,104,'+pulse.toFixed(2)+')';
  ctx.fillText('!',x,y-23);
  ctx.restore();
}
function drawTownGrowthVisual(ctx, now, W, H, G) {
  drawTownProjectLandmarks(ctx, now, W, H);
  drawTownEventNotice(ctx, now, W, H);
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
  if (tier >= 3) {
    const relicCount = meta && meta.relicLedger
      ? Object.keys(meta.relicLedger).filter(k => meta.relicLedger[k]).length : 0;
    const ax = W * .82, ay = H * .58;
    const pulse = .55 + .18 * Math.sin(now / 430);
    ctx.save();
    ctx.fillStyle = 'rgba(28,18,13,.88)';
    ctx.strokeStyle = relicCount ? `rgba(226,177,82,${pulse.toFixed(2)})` : 'rgba(124,96,60,.58)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(ax - 28, ay - 19, 56, 31);
    ctx.strokeRect(ax - 27.5, ay - 18.5, 55, 30);
    ctx.fillStyle = relicCount ? '#e4be6d' : '#8d7657';
    ctx.font = '700 12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('◇', ax, ay - 7);
    ctx.font = '600 9px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(ui('遗物馆','RELICS'), ax, ay + 4);
    if (relicCount) {
      ctx.fillStyle = '#f3d98e';
      ctx.font = '700 8px "Segoe UI", sans-serif';
      ctx.fillText(String(relicCount), ax + 21, ay - 13);
    }
    ctx.restore();
  }
  drawTownNpcPopulation(ctx, now, W, H, G, tier);
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
  try { advanceTownAvatar(now || 0); drawTownScene(now || 0); drawWheel(now || 0); } catch (e) { /* 绘制异常不阻塞游戏 */ }
  townRafId = requestAnimationFrame(townFrame);
}
function ensureTownLoop() {
  if (!townRafId && state === 'town') townRafId = requestAnimationFrame(townFrame);
}


let activeRefineItem = null;
function refinePathLabel(path) {
  if (!path) return '';
  return LOCALE_DATA && typeof LOCALE_DATA.refineName === 'function'
    ? LOCALE_DATA.refineName(path.id) : ui(path.zh, path.en);
}
function refineStatText(stats) {
  return Object.entries(stats || {}).map(([key, value]) =>
    LOCALE_DATA && typeof LOCALE_DATA.affixText === 'function'
      ? LOCALE_DATA.affixText(key, value) : `${key} +${value}`).join(' · ');
}
function pendingRefineItem() {
  if (!meta) return null;
  return [...(meta.bag || []), ...(meta.stash || [])].find(it => it && it.refinePending && !it.refinePath) || null;
}
function openForgeRefinement(item) {
  if (state !== 'town' || !item || !item.refinePending || item.refinePath) return;
  const rows = FORGE_REFINEMENT_PATHS[item.slot] || [];
  if (!rows.length) { item.refinePending = false; return; }
  activeRefineItem = item;
  const title = $('refine-title'), copy = $('refine-copy'), grid = $('refine-grid');
  if (title) title.textContent = ui(`+3 精炼：为【${visibleItemName(item)}】定一个方向`, `+3 Refinement: choose a path for [${visibleItemName(item)}]`);
  if (copy) copy.textContent = ui('精炼不会失败，也不会毁坏装备。这个选择会在 +5 时自动继续淬炼强化。', 'Refinement cannot fail or destroy the item. Your choice receives a second automatic upgrade at +5.');
  if (grid) grid.innerHTML = rows.map(path => `<button type="button" class="refine-choice" data-refine="${path.id}"><b>${esc(refinePathLabel(path))} · ${esc(refineStatText(path.refine))}</b><small>${esc(ui(path.zhDesc, path.enDesc))}</small></button>`).join('');
  showUi('refine-screen');
}
function chooseForgeRefinement(pathId) {
  const item = activeRefineItem;
  if (!item || !item.refinePending || item.refinePath) return;
  const path = (FORGE_REFINEMENT_PATHS[item.slot] || []).find(row => row.id === pathId);
  if (!path) return;
  item.refinePath = path.id;
  item.refineVersion = 1;
  item.refinePending = false;
  addForgeStats(item, path.refine);
  activeRefineItem = null;
  hideUi('refine-screen');
  sfx.levelup();
  msg(ui(`精炼完成：【${visibleItemName(item)}】获得 ${refineStatText(path.refine)}。`, `Refinement complete: [${visibleItemName(item)}] gained ${refineStatText(path.refine)}.`), 'epic');
  saveMeta(); renderTown();
}


function recordTownChronicle(entry) {
  if (!meta || !entry || typeof entry !== 'object') return;
  meta.townChronicle = Array.isArray(meta.townChronicle) ? meta.townChronicle : [];
  meta.townChronicle.push({ ...entry });
  if (meta.townChronicle.length > 8) meta.townChronicle = meta.townChronicle.slice(-8);
}
function townChronicleText(row) {
  if (!row) return '';
  if (row.kind === 'return') return ui('第 ' + row.depth + ' 层平安归来。', 'Returned safely from Floor ' + row.depth + '.');
  if (row.kind === 'project') {
    const project = TOWN_GROWTH_RULES.project(row.id);
    return project ? ui('工程完工：' + project.zh + ' Lv ' + row.level + '。', 'Project completed: ' + project.en + ' Lv ' + row.level + '.') : '';
  }
  if (row.kind === 'event') {
    const event = TOWN_GROWTH_RULES.eventById(row.id);
    return event ? ui('镇务处理：' + event.zh + '。', 'Town event resolved: ' + event.en + '.') : '';
  }
  if (row.kind === 'relic') {
    const piece = SET_RULES.piece(row.setId,row.slot,meta.classId);
    return piece ? ui('遗物入藏：' + piece.zh + '。', 'Relic catalogued: ' + piece.en + '.') : '';
  }
  return '';
}
function townChronicleHtml() {
  const rows = Array.isArray(meta && meta.townChronicle) ? meta.townChronicle.slice(-5).reverse() : [];
  if (!rows.length) return '';
  return '<section class="town-chronicle"><b>' + ui('近事镇志','Recent Town Chronicle') + '</b><div>' +
    rows.map(row => '<span>' + esc(townChronicleText(row)) + '</span>').join('') + '</div></section>';
}
function townProjectContext() {
  return { tier:townTierForArt(), gold:meta ? (meta.gold || 0) : 0, relics:relicLedgerCount() };
}
function upgradeTownWork(id) {
  if (state !== 'town' || !meta) return false;
  const row = TOWN_GROWTH_RULES.project(id);
  if (!row) return false;
  const check = TOWN_GROWTH_RULES.canUpgrade(meta.townWorks || {}, id, townProjectContext());
  if (!check.ok || !check.next) {
    const next = check.next;
    if (check.reason === 'max') msg(ui(`${row.zh}已经完成全部扩建。`, `${row.en} is fully upgraded.`), 'good');
    else if (check.reason === 'tier') msg(ui(`需要城镇阶段 ${next.tier}。`, `Requires Town Tier ${next.tier}.`), 'bad');
    else if (check.reason === 'relics') msg(ui(`需要遗物馆藏 ${next.relics} 件。`, `Requires ${next.relics} catalogued relics.`), 'bad');
    else if (check.reason === 'gold') msg(ui(`建设需要 ${next.cost} G，金库不足。`, `Construction costs ${next.cost} Gold; the vault is short.`), 'bad');
    return false;
  }
  meta.gold -= check.next.cost;
  const current = TOWN_GROWTH_RULES.level(meta.townWorks || {}, id);
  meta.townWorks = { ...(meta.townWorks || {}), [id]:current + 1 };
  recordTownChronicle({ kind:'project', id, level:current + 1 });
  if (id === 'market') meta.market = null;
  saveMeta();
  sfx.levelup();
  msg(ui(
    `城镇工程完成：【${row.zh}】${check.next.zh}。${check.next.effectZh}`,
    `Town project completed: [${row.en}] ${check.next.en}. ${check.next.effectEn}`
  ), 'epic');
  renderTown();
  return true;
}
function renderTownWorks() {
  const host = $('town-works');
  if (!host || !meta) return;
  const context = townProjectContext();
  host.innerHTML =
    `<header><div><b>${ui('城镇工程','Town Works')}</b><span>${ui('金库不只是存钱：把远征所得真正变成一个更强、更繁荣的据点。','The vault is not just storage: turn expedition wealth into a stronger, busier home base.')}</span></div>` +
    `<small>${ui(`可用金库 ${meta.gold || 0} G`, `Vault ${meta.gold || 0} G`)}</small></header>` +
    `<div class="town-work-grid">${TOWN_GROWTH_RULES.PROJECTS.map(row => {
      const level = TOWN_GROWTH_RULES.level(meta.townWorks || {}, row.id);
      const current = TOWN_GROWTH_RULES.currentEffect(meta.townWorks || {}, row.id);
      const check = TOWN_GROWTH_RULES.canUpgrade(meta.townWorks || {}, row.id, context);
      const next = check.next;
      let label = ui('已全部完工','Fully Built');
      if (next) {
        if (check.reason === 'tier') label = ui(`阶段 ${next.tier} 解锁`, `Unlocks at Tier ${next.tier}`);
        else if (check.reason === 'relics') label = ui(`馆藏 ${context.relics}/${next.relics}`, `Relics ${context.relics}/${next.relics}`);
        else if (check.reason === 'gold') label = ui(`需要 ${next.cost} G`, `Need ${next.cost} G`);
        else label = ui(`建设 ${next.cost} G`, `Build ${next.cost} G`);
      }
      const effect = current ? ui(current.effectZh,current.effectEn) : ui('尚未建设','Not yet built');
      const nextName = next ? ui(next.zh,next.en) : ui('最终形态','Final form');
      return `<article class="town-work-card${level >= row.levels.length ? ' complete' : ''}"><div class="town-work-title"><b>${esc(ui(row.zh,row.en))}</b><em>Lv ${level}/${row.levels.length}</em></div>` +
        `<p>${esc(effect)}</p><small>${ui('下一步','Next')}: ${esc(nextName)}</small>` +
        `<button type="button" data-townwork="${row.id}"${check.ok ? '' : ' disabled'}>${esc(label)}</button></article>`;
    }).join('')}</div>`;
}
function stageTownReturnEvent(newRelics = 0) {
  if (!meta || meta.townEvent) return null;
  const tier = ECONOMY_RULES.townTier(Math.max(meta.bestDepth || 0, Number(depth) || 0));
  const offer = TOWN_GROWTH_RULES.eventForReturn({
    tier,
    relics:relicLedgerCount(),
    newRelics:Math.max(0, Number(newRelics) || 0),
    runs:meta.runs || 0,
    lastReturnDepth:Math.max(meta.lastReturnDepth || 0, Number(depth) || 0),
  });
  if (!offer) return null;
  meta.townEvent = {
    id:offer.id,
    cost:Math.max(0, Number(offer.cost) || 0),
    effect:{ ...(offer.effect || {}) },
  };
  return meta.townEvent;
}
function currentTownEventOffer() {
  if (!meta || !meta.townEvent) return null;
  const row = TOWN_GROWTH_RULES.eventById(meta.townEvent.id);
  if (!row) return null;
  return {
    ...row,
    cost:Math.max(0, Number(meta.townEvent.cost) || 0),
    effect:{ ...(meta.townEvent.effect || {}) },
  };
}
function townEventEffectText(offer) {
  if (!offer) return '';
  const effect = offer.effect || {};
  if (effect.gold) return ui('镇民捐赠与门票可收入 ' + effect.gold + ' G。', 'Donations and admission will add ' + effect.gold + ' Gold to the vault.');
  if (effect.marketRestock) return ui('立即补满本轮市集补给库存。', 'Immediately restock the current town market.');
  if (effect.escapes || effect.keys) return ui('获得回城卷轴 +' + (effect.escapes || 0) + '、钥匙 +' + (effect.keys || 0) + '。', 'Gain Return Scroll +' + (effect.escapes || 0) + ' and Key +' + (effect.keys || 0) + '.');
  return ui('这件事会改变今天的城镇。', 'This will change the town today.');
}
function townEventHtml() {
  const offer = currentTownEventOffer();
  if (!offer) return '';
  const affordable = !offer.cost || (meta.gold || 0) >= offer.cost;
  const costText = offer.cost ? ui('花费 ' + offer.cost + ' G', 'Cost ' + offer.cost + ' G') : ui('无需花费', 'No cost');
  const label = ui(offer.actionZh, offer.actionEn) + (offer.cost ? ' · ' + offer.cost + ' G' : '');
  return '<section class="town-event-card"><div class="town-event-copy"><p class="kicker">' +
    ui('今日镇务', 'Town Event') + '</p><h3>' + esc(ui(offer.zh, offer.en)) + '</h3><p>' +
    esc(ui(offer.zhStory, offer.enStory)) + '</p><small>' + esc(townEventEffectText(offer)) + ' · ' +
    esc(costText) + '</small></div><button type="button" data-townevent="resolve"' +
    (affordable ? '' : ' disabled') + '>' + esc(label) + '</button></section>';
}
function resolveTownEvent() {
  if (state !== 'town' || !meta) return false;
  const offer = currentTownEventOffer();
  if (!offer) return false;
  if (offer.cost && (meta.gold || 0) < offer.cost) {
    msg(ui('金库不足，暂时处理不了这件镇务。', 'The vault is too low to handle this town event yet.'), 'bad');
    return false;
  }
  if (offer.cost) meta.gold -= offer.cost;
  const effect = offer.effect || {};
  if (effect.gold) meta.gold += Math.max(0, Number(effect.gold) || 0);
  if (effect.marketRestock) meta.market = freshTownMarket(townTierForArt());
  if (effect.escapes) meta.escapes = (meta.escapes || 0) + Math.max(0, Number(effect.escapes) || 0);
  if (effect.keys) meta.keys = (meta.keys || 0) + Math.max(0, Number(effect.keys) || 0);
  recordTownChronicle({ kind:'event', id:offer.id });
  meta.townEvent = null;
  saveMeta();
  sfx.pickup();
  msg(ui('镇务已经处理完毕。小镇今天和昨天有了一点不同。', 'The town matter is settled. Today the town is a little different from yesterday.'), 'good');
  renderTown();
  return true;
}
function selectRelicFocus(setId) {
  if (state !== 'town' || !meta) return false;
  const hallLevel = townWorkLevel('relics');
  if (hallLevel <= 0) {
    msg(ui('先扩建遗物馆，书记才有余力追查特定套装的线索。', 'Expand the Relic Hall before asking the curator to track a specific set.'), 'bad');
    return false;
  }
  const requested = String(setId || '');
  if (!requested || requested === meta.relicFocusSet) {
    meta.relicFocusSet = '';
    saveMeta();
    msg(ui('遗物馆停止定向追查，重新整理全部线索。', 'The Relic Hall stops targeted research and returns to the full archive.'), 'good');
    renderTown();
    return true;
  }
  const normalized = SET_RULES.normalizeFocusId(requested, meta.bestDepth || 0, meta.relicLedger || {});
  if (!normalized) {
    msg(ui('这套遗物还没有足够线索，暂时无法定向研究。', 'There are not enough clues to focus research on that set yet.'), 'bad');
    return false;
  }
  meta.relicFocusSet = normalized;
  saveMeta();
  const set = SET_RULES.setById(normalized);
  const pct = Math.round(SET_RULES.focusWeight(hallLevel) * 100);
  msg(ui(`遗物馆开始追查【${set.zh}】线索：出现具名遗物时，约 ${pct}% 会优先指向该套。`, `Relic Hall research now tracks [${set.en}]: about ${pct}% of eligible named relics will favor this set.`), 'epic');
  renderTown();
  return true;
}
function renderTownRelics() {
  const host = $('town-relics');
  if (!host || !meta) return;
  const ledger = meta.relicLedger || {};
  const equipped = SET_RULES.equippedCounts(meta.equip || {});
  const totalFound = Object.keys(ledger).filter(k => ledger[k]).length;
  const totalPieces = SET_RULES.SETS.length * SET_RULES.SLOTS.length;
  const hallLevel = townWorkLevel('relics');
  const focusSet = SET_RULES.setById(meta.relicFocusSet);
  const focusPct = Math.round(SET_RULES.focusWeight(hallLevel) * 100);
  const research = hallLevel > 0
    ? `<div class="relic-research"><div><b>${ui('线索追查','Research Focus')}</b><span>${focusSet ? ui(`当前追查：${focusSet.zh} · 具名遗物偏向约 ${focusPct}%`, `Tracking: ${focusSet.en} · about ${focusPct}% of eligible named relics favor it`) : ui(`可指定一套进行追查 · 当前偏向强度 ${focusPct}%`, `Choose one set to track · current focus strength ${focusPct}%`)}</span></div>${focusSet ? `<button type="button" data-relicfocus="">${ui('取消追查','Clear Focus')}</button>` : ''}</div>`
    : `<div class="relic-research locked"><div><b>${ui('线索追查未开放','Research Focus Locked')}</b><span>${ui('完成“整理旧展柜”后，可让遗物馆定向追查某一套六件遗物。','Complete “Restore the Old Cases” to let the Relic Hall track one six-piece set.')}</span></div></div>`;
  host.innerHTML =
    `<div class="relic-summary"><b>${ui('馆藏进度','Archive Progress')} ${totalFound}/${totalPieces}</b><span>${ui('只有安全带回小镇的具名遗物才会永久留下记录。','Only named relics safely returned to town are permanently catalogued.')}</span></div>` + research +
    SET_RULES.SETS.map(set => {
      const progress = SET_RULES.collectionProgress(ledger, set.id);
      const worn = equipped[set.id] || 0;
      const known = progress.found > 0 || (meta.bestDepth || 0) >= set.minDepth;
      const focusable = hallLevel > 0 && SET_RULES.normalizeFocusId(set.id, meta.bestDepth || 0, ledger) === set.id;
      const focused = meta.relicFocusSet === set.id;
      const story = known
        ? ui(set.zhStory,set.enStory)
        : ui(`书记只知道这批遗物大约出现在第 ${set.minDepth} 层以后。`, `The curator only knows these relics begin appearing around Floor ${set.minDepth}.`);
      const pieces = SET_RULES.SLOTS.map(slot => {
        const piece = SET_RULES.piece(set.id, slot, meta.classId);
        const found = !!ledger[set.id + ':' + slot];
        const active = !!(meta.equip && meta.equip[slot] && meta.equip[slot].setId === set.id);
        const pieceName = found ? ui(piece.zh,piece.en) : ui(`未归档的${visibleSlotName(slot)}`, `Uncatalogued ${visibleSlotName(slot)}`);
        const lore = found ? ui(piece.zhLore,piece.enLore) : ui('故事仍留在地牢里。','Its story is still somewhere below.');
        return `<article class="relic-piece${found ? ' found' : ''}${active ? ' equipped' : ''}"><div class="relic-piece-head"><span>${esc(visibleSlotName(slot))}</span><b>${esc(pieceName)}</b>${active ? `<em>${ui('穿戴中','Equipped')}</em>` : ''}</div><p>${esc(lore)}</p></article>`;
      }).join('');
      const bonuses = set.bonuses.map(b =>
        `<span class="${worn >= b.pieces ? 'active' : ''}"><b>${b.pieces}/6</b>${esc(ui(b.zh,b.en))}</span>`
      ).join('');
      const focusButton = focusable
        ? `<button type="button" class="relic-focus-action${focused ? ' active' : ''}" data-relicfocus="${set.id}">${focused ? ui(`追查中 · ${focusPct}%`,`Tracking · ${focusPct}%`) : ui('追查此套线索','Track This Set')}</button>`
        : '';
      return `<section class="relic-set-card${known ? '' : ' rumor'}${focused ? ' focused' : ''}"><header><div><p class="kicker">${ui('具名六件套','Named Six-Piece Set')}</p><h3>${esc(ui(set.zh,set.en))}</h3></div><strong>${ui(`馆藏 ${progress.found}/6 · 穿戴 ${worn}/6`, `Archive ${progress.found}/6 · Equipped ${worn}/6`)}</strong></header><p class="relic-set-story">${esc(story)}</p><div class="relic-piece-grid">${pieces}</div><div class="relic-set-bonuses">${bonuses}</div>${focusButton}</section>`;
    }).join('');
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
    const readiness = townReadinessPlan();
    const ready = readiness.ready;
    const kitActionLabel = !readiness.available
      ? ui('本轮库存不足', 'Market Stock Short')
      : !readiness.affordable
        ? ui(`还差 ${Math.max(0, readiness.total - (meta.gold || 0))} G`, `Need ${Math.max(0, readiness.total - (meta.gold || 0))} G More`)
        : ui(`一键补齐 ${readiness.total} G`, `Complete Kit ${readiness.total} G`);
    const kitButton = ready
      ? `<button type="button" class="town-ready-action" disabled>${ui('基础补给齐备','Core Kit Ready')}</button>`
      : `<button type="button" class="town-ready-action" data-townready="1"${(!readiness.available || !readiness.affordable) ? ' disabled' : ''}>${kitActionLabel}</button>`;
    const relicFound = Object.keys(meta.relicLedger || {}).filter(k => meta.relicLedger[k]).length;
    const checkpointCount = unlockedTownCheckpoints().length;
    const residentCount = TOWN_HOTSPOTS.length + activeTownResidents().length;
    const returnNote = (meta.lastReturnDepth || 0) > 0
      ? ui(`最近一次有人从第 ${meta.lastReturnDepth} 层活着回来，酒馆里还在谈这件事。`, `Someone returned alive from Floor ${meta.lastReturnDepth}; the tavern is still talking about it.`)
      : ui('镇上的人还没有等到你的第一次平安归来。','The town is still waiting for your first safe return.');
    growth.innerHTML =
      `<div><b>${ui(`城镇阶段 ${tier}/10`, `Town Tier ${tier}/10`)}</b><span>${next}</span></div>` +
      `<div class="town-readiness ${ready ? 'ready' : 'warn'}"><b>${ready ? ui('远征整备完成','Expedition Ready') : ui('补给仍有缺口','Supplies Missing')}</b>` +
      `<span>${ui(`药水 ${meta.potions || 0} · 回城卷轴 ${meta.escapes || 0} · 钥匙 ${meta.keys || 0}`, `Potions ${meta.potions || 0} · Return Scrolls ${meta.escapes || 0} · Keys ${meta.keys || 0}`)}</span>${kitButton}</div>` +
      `<div><b>${ui('镇务动态','Town Ledger')}</b><span>${ui(`遗物馆 ${relicFound}/${SET_RULES.SETS.length * 6} · 已记录出发点 ${checkpointCount} · 广场常驻 ${residentCount}`, `Relic Hall ${relicFound}/${SET_RULES.SETS.length * 6} · Departure records ${checkpointCount} · Plaza residents ${residentCount}`)}</span></div>` +
      `<div class="town-rumor"><b>${ui('街巷传闻','Street Rumor')}</b><span>${returnNote}</span></div>` +
      townChronicleHtml() +
      townEventHtml() +
      `<section id="town-works" class="town-works" aria-live="polite"></section>`;
  }
  renderTownCheckpoints();
  renderTownContracts();
  renderTownWorks();
  renderTownRelics();
  const itemTag = it => {
    const f = it.forge || 0;
    const forgeTag = f ? ` +${f}` : '';
    const fit = classFitOf(it, meta.classId);
    const equipped = meta.equip && meta.equip[it.slot];
    const equippedFit = equipped ? classFitOf(equipped, meta.classId) : null;
    const delta = equippedFit === null ? null : fit - equippedFit;
    const fitText = delta === null
      ? ui(`职业适配 ${fit}`, `Class fit ${fit}`)
      : ui(`职业适配 ${fit} · 较当前 ${delta >= 0 ? '+' : ''}${delta}`, `Class fit ${fit} · ${delta >= 0 ? '+' : ''}${delta} vs equipped`);
    const identity = it.namedSet
      ? `<small class="town-item-identity">${esc(ui(it.setNameZh || '', it.setNameEn || ''))} · ${ui('具名遗物','Named Relic')}</small>`
      : '';
    return `<span class="${it.namedSet ? 'town-named-item' : ''}">${esc(visibleItemName(it))}${forgeTag}${identity}<small>${ui(`${it.score} 分`, `Score ${it.score}`)} · ${esc(fitText)}</small></span>`;
  };
  const tradeBtns = (where, i, it) => {
    const fc = forgeCost(it);
    const maxed = (it.forge || 0) >= FORGE_MAX;
    const pendingRefine = !!(it.refinePending && !it.refinePath);
    const forgeDisabled = maxed || pendingRefine || meta.gold < fc;
    const forgeTitle = pendingRefine
      ? ui('先完成 +3 精炼，再继续强化。', 'Complete the +3 refinement before forging further.')
      : maxed ? ui('已至 +5 极致','Maxed at +5')
      : ui(`强化到 +${(it.forge || 0) + 1}，需 ${fc} G`, `Forge to +${(it.forge || 0) + 1} for ${fc} G`);
    return `<span class="row-actions">` +
      `<button type="button" data-forge="${where}:${i}"${forgeDisabled ? ' disabled' : ''}` +
      ` title="${forgeTitle}">${pendingRefine ? ui('待精炼','Refine') : ui('强化','Forge')}</button>` +
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
  if (shopEl) {
    const market = ensureTownMarket();
    shopEl.innerHTML = market ? TOWN_MARKET_IDS.map(id => {
      const def = TOWN_MARKET_SUPPLIES[id];
      const price = townMarketPrice(id, market.tier);
      const left = market.stock[id] || 0;
      const held = def.held(meta);
      const label = ui(def.zh, def.en);
      return `<div class="shop-row" data-town-supply="${id}"><span>${esc(label)} ×1 <small>${ui(`持有 ${held} · 库存 ${left}`, `Held ${held} · Stock ${left}`)}</small></span>` +
        `<b>${price} G</b><button type="button" data-townbuy="${id}"${left <= 0 || meta.gold < price ? ' disabled' : ''}>${left > 0 ? ui('购买','Buy') : ui('售罄','Sold out')}</button></div>`;
    }).join('') + `<p class="dim-note">${ui(`城镇阶段 ${market.tier} · 本轮库存固定；开启下一次远征后刷新。`, `Town Tier ${market.tier} · Stock is fixed for this expedition cycle and refreshes after the next expedition begins.`)}</p>` : '';
  }
  const tavernEl = $('town-tavern');
  if (tavernEl) {
    const visits = Math.max(0, meta.tavernVisits || 0);
    const cost = tavernCost();
    const available = tavernAvailable();
    const toastCap = tavernMaxToasts();
    const complete = visits >= toastCap;
    const history = (meta.tavernHistory || []).map(tavernRewardById).filter(Boolean);
    const historyText = history.length
      ? history.map(row => ui(row.zhEffect, row.enEffect)).join(' · ')
      : ui('尚未留下酒馆回响', 'No tavern echoes yet');
    tavernEl.innerHTML =
      `<div class="tavern-offer"><b>${ui('回响祝酒','Echo Toast')}</b><span>${ui(`每次远征归来限一杯 · 当前上限 ${toastCap} 杯`, `One after each expedition · current cap ${toastCap}`)}</span></div>` +
      `<p class="dim-note">${ui('不是免费刷属性：酒价递增、结果随机、攻击成长低权重，并有永久硬上限。','Not a free stat farm: rising price, random result, low-weight ATK, and a permanent hard cap.')}</p>` +
      `<div class="tavern-history"><small>${ui(`已饮 ${visits}/${toastCap}`, `Toasts ${visits}/${toastCap}`)}</small><span>${esc(historyText)}</span></div>` +
      `<button type="button" class="tavern-drink" data-taverndrink="1"${(!available || meta.gold < cost) ? ' disabled' : ''}>` +
      `${complete ? ui('回响已满','Echo Complete') : available ? ui(`举杯 ${cost} G`,`Raise a Toast ${cost} G`) : ui('完成下一次远征后再来','Return from another expedition')}</button>`;
  }
  const wheelEl = $('town-wheel');
  if (wheelEl) {
    ensureWheel();
    const sc = spinCost(), rc = resetWheelCost();
    const claimed = wheelClaimedCount(), exhausted = claimed >= WHEEL_SLOTS;
    wheelEl.innerHTML =
      '<canvas id="wheel-canvas" width="240" height="240"></canvas>' +
      `<p class="dim-note wheel-hint">${ui(`八格每格最多领取一次 · 已领取 ${claimed}/8`, `Each slot pays once · ${claimed}/8 claimed`)}</p>` +
      `<div class="row-actions"><button type="button" data-wheelspin="1"${(exhausted || meta.gold < sc || wheelBusy) ? ' disabled' : ''}` +
      ` title="${ui(exhausted ? '八格已领完，请先重置轮盘' : `转动轮盘，下一抽 ${sc} G`, exhausted ? 'All slots claimed; reset the wheel first' : `Spin the wheel for ${sc} G`)}">${exhausted ? ui('本轮已全部领取','All prizes claimed') : ui(`抽奖 ${sc} G`, `Spin ${sc} G`)}</button>` +
      `<button type="button" data-wheelreset="1"${(meta.gold < rc || wheelBusy) ? ' disabled' : ''}` +
      ` title="${ui(`重摇全部八格，需 ${rc} G`, `Reroll all eight slots for ${rc} G`)}">${ui(`重置轮盘 ${rc} G`, `Reset Wheel ${rc} G`)}</button></div>`;
  }
  renderTownFocus(false);
  const pending = pendingRefineItem();
  if (pending && $('refine-screen') && $('refine-screen').classList.contains('hidden')) openForgeRefinement(pending);
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
  if (it.refinePending && !it.refinePath) {
    msg(ui('先完成这件装备的 +3 精炼，再继续强化。',"Complete this item's +3 refinement before forging further."), 'bad');
    openForgeRefinement(it);
    return;
  }
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
  if (it.forge === 3 && !it.refinePath) {
    it.refinePending = true;
    it.refineVersion = 1;
  }
  const masterPath = it.forge === 5 ? applyForgeMasterwork(it) : null;
  sfx.levelup();
  const finish = masterPath
    ? ui(` · ${refinePathLabel(masterPath)}淬炼完成`, ` · ${refinePathLabel(masterPath)} Masterwork completed`)
    : it.refinePending ? ui(' · 等待 +3 精炼选择', ' · +3 refinement choice ready') : '';
  msg(ui(`锻造成功！【${visibleItemName(it)}】强化至 +${it.forge}，花费 ${cost} G${finish}。`, `Forge success! [${visibleItemName(it)}] reached +${it.forge} for ${cost} G${finish}.`), 'epic');
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
  if (state !== 'town' || !meta) return false;
  const market = ensureTownMarket();
  const def = TOWN_MARKET_SUPPLIES[id];
  if (!market || !def) return false;
  const left = Math.max(0, Number(market.stock[id]) || 0);
  const price = townMarketPrice(id, market.tier);
  if (left <= 0) {
    msg(ui(`${def.zh}本轮已经售罄。`, `${def.en} is sold out for this expedition cycle.`), 'bad');
    renderTown();
    return false;
  }
  if (meta.gold < price) {
    msg(ui(`金库金币不足：${def.zh}需要 ${price} G。`, `Not enough vault Gold: ${def.en} costs ${price} G.`), 'bad');
    return false;
  }
  meta.gold -= price;
  def.apply(meta);
  market.stock[id] = left - 1;
  sfx.pickup();
  msg(ui(`购入【${def.zh}】×1。`, `Bought [${def.en}] ×1.`), 'good');
  saveMeta(); renderTown();
  return true;
}
function initGreedyRun(chosen) {
  classId = CLASSES[chosen] ? chosen : (meta && meta.classId) || 'warrior';
  meta = sanitizeMeta(loadMeta() || defaultMeta(classId));
  migrateGreedyMetaWeapon();
  if (meta.classId !== classId) {
    // 换职业开新档：保留金库，其余重置
    const keepGold = meta.gold;
    meta = defaultMeta(classId);
    meta.gold = keepGold;
  }
  saveMeta();
  departTown();
}
function departTown(targetDepth = selectedTownCheckpoint) {
  if (!greedyMode || !meta) return;
  const unlocked = unlockedTownCheckpoints();
  const requested = Math.max(1, Math.floor(Number(targetDepth) || 1));
  const startDepth = unlocked.includes(requested) ? requested : 1;
  selectedTownCheckpoint = startDepth;
  buildSprites();
  depth = startDepth; turns = 0; state = 'playing';
  buildThemeTex(depth);
  player = {
    x: 0, y: 0, fx: 0, fy: 0,
    hpBase: meta.hpBase,
    atkBase: meta.atkBase,
    manaMax: manaRuleFor(classId).max, mana: clamp(Number(meta.mana), 0, manaRuleFor(classId).max),
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
    contractId: availableTownContracts().some(row => row.id === EXPEDITION_RULES.normalizeContractId(meta.contractId))
      ? EXPEDITION_RULES.normalizeContractId(meta.contractId) : 'none',
    echoMode: false,
  };
  ensurePlayerMana(player, classId);
  // 注意：pMaxHp 读取全局 player，必须在 player 赋值完成之后再计算生命
  player.hp = pMaxHp();
  meta.runs = (meta.runs || 0) + 1;
  recordRunStart();
  // 每次远征使用独立派生种子，保证同一次数可复现
  setSeed('greedy-' + PROFILE_ID + '-' + classId + '-' + meta.runs);
  saveMeta();
  logLines = []; resetCombatPresentation(); selectedBagIndex = -1;
  hideOverlay();
  hideUi('title-screen'); hideUi('class-screen'); hideUi('pause-screen'); hideUi('shop-screen');
  hideUi('talent-screen'); hideUi('shrine-screen'); hideUi('echo-screen'); hideUi('town-screen');
  genLevel();
  applyViewport();
  computeFov();
  msg(fmtText(runText('intro')));
  guideFirstRunStart();
  msg(ui(`第 ${meta.runs} 次下潜：从第 ${startDepth} 层出发。搜刮战利品，用回城卷轴（T）把一切平安带回小镇——死在这里就会失去背包和金币！`, `Descent ${meta.runs}: departing from Floor ${startDepth}. Loot what you can, then use Return Scroll (T) to bring it safely back to town — dying here loses your backpack and carried Gold!`), 'gold');
  const contract = EXPEDITION_RULES.CONTRACTS.find(row => row.id === player.contractId);
  if (contract && contract.id !== 'none') msg(ui(`本次委托：${contract.zh}。${contract.zhDesc}`, `Expedition contract: ${contract.en}. ${contract.enDesc}`), 'epic');
  msg(ui(`本层有 ${monsters.length} 个敌人、${items.length} 处物资。`, `This floor has ${monsters.length} enemies and ${items.length} loot spots.`), 'good');
  renderBag(); renderEquip(); updateHud();
  persistRun();
}
function useEscape() {
  if (!greedyMode || state !== 'playing') return;
  if ((player.escapes || 0) <= 0) {
    msg(ui('没有回城卷轴了——地牢每个十层区段都有保底来源，商人和中层守卫也能补充。','No Return Scrolls left — every ten-floor band has a guaranteed source, and merchants/guardians provide more.'), 'bad');
    return;
  }
  player.escapes--;
  const banked = player.gold;
  recordSafeReturn();
  syncMetaFromPlayer(false);
  meta.lastReturnDepth = Math.max(0, Number(depth) || 0);
  recordTownChronicle({ kind:'return', depth:meta.lastReturnDepth });
  const returnedRelics = registerReturnedRelics([
    ...(meta.bag || []),
    ...Object.values(meta.equip || {}).filter(Boolean),
  ]);
  const stagedTownEvent = stageTownReturnEvent(returnedRelics.length);
  enterTown();
  msg(ui(`你撕开回城卷轴，平安回到小镇。${banked} 金币落入金库。`, `You tear open a Return Scroll and reach town safely. ${banked} Gold enters the vault.`), 'gold');
  if (returnedRelics.length) {
    msg(ui(
      `遗物书记登记了 ${returnedRelics.length} 件新的具名遗物：${returnedRelics.map(p => p.zh).join('、')}。`,
      `The relic curator catalogued ${returnedRelics.length} new named relic${returnedRelics.length === 1 ? '' : 's'}: ${returnedRelics.map(p => p.en).join(', ')}.`
    ), 'epic');
  }
  if (stagedTownEvent) {
    const row = TOWN_GROWTH_RULES.eventById(stagedTownEvent.id);
    if (row) msg(ui(`镇上有新动静：【${row.zh}】。`, `Something is happening in town: [${row.en}].`), 'good');
  }
}
function greedyDeathReturn(lostInv, lostGold) {
  syncMetaFromPlayer(true);
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
  skillFollowup = null;
  if (chosen) classId = chosen;
  if (greedyMode) { initGreedyRun(classId); return; }
  setSeed(RUN_SEED);
  buildSprites();
  depth = 1; turns = 0; state = 'playing';
  recordRunStart();
  const c = classDef();
  buildThemeTex(depth);
  player = {
    x: 0, y: 0, fx: 0, fy: 0,
    hpBase: c.hpBase, hp: c.hpBase, atkBase: c.atkBase,
    manaMax: manaRuleFor(classId).max, mana: manaRuleFor(classId).max,
    lvl: 1, xp: 0, gold: 0, potions: c.potions, scrolls: c.scrolls, keys: 0, kills: 0,
    inv: [], equip: { weapon: starterWeaponForClass(classId), armor: null, helmet:null, boots:null, ring: null, amulet:null },
    lungeT: 0, hurtT: 0, ldx: 0, ldy: 0,
    facing: [1, 0], skillCd: 0, poison: 0,
    critBase: 0, leechBase: 0, skillHaste: 0, goldFind: 0, flatDr: 0, grievous: 0,
    thornsBase: 0, regenBase: 0, potionBoost: 0, critPower: 0, grivResist: 0,
    plunder: 0, fastRegen: 0,
    talents: [], echoMode: false,
  };
  logLines = []; resetCombatPresentation(); selectedBagIndex = -1;
  hideOverlay();
  hideUi('title-screen'); hideUi('class-screen'); hideUi('pause-screen'); hideUi('shop-screen');
  hideUi('talent-screen'); hideUi('shrine-screen'); hideUi('echo-screen');
  genLevel();
  applyViewport();
  computeFov();
  msg(fmtText(runText('intro')));
  guideFirstRunStart();
  msg(ui(`本层有 ${monsters.length} 个敌人、${items.length} 处物资。`, `This floor has ${monsters.length} enemies and ${items.length} loot spots.`), 'good');
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
    if ($('audio-settings-screen') && !$('audio-settings-screen').classList.contains('hidden')) { hideUi('audio-settings-screen'); return; }
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
    toggleAudioMuted(true);
    return;
  }
  if ($('audio-settings-screen') && !$('audio-settings-screen').classList.contains('hidden')) return;
  if (state === 'town') {
    const tag = String(e.target && e.target.tagName || '').toUpperCase();
    if ((tag === 'BUTTON' || tag === 'SUMMARY') && (e.key === 'Enter' || e.key === ' ')) return;
    if (KEYMAP[e.key]) { e.preventDefault(); moveTownAvatar(...KEYMAP[e.key]); return; }
    if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); interactTown(); return;
    }
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); return; }
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
    case 'k': case 'K': case 'c': case 'C': useSkill(); break;
    case 'j': case 'J': e.preventDefault(); directionalAttack(); break;
    case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
    case '>': case 'Enter': case 'n': case 'N': case 'PageDown':
      e.preventDefault();
      if (e.key === 'Enter' && e.shiftKey) quickDive(); else descend();
      break;
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
    else if (act === 'attack') directionalAttack();
    else if (act === 'skill') useSkill();
    else if (act === 'descend') descend();
    else if (act === 'quickdive') quickDive();
    else if (act === 'pause') { if (state === 'playing') pauseGame(); else if (state === 'paused') resumeGame(); }
    else if (act === 'mute') toggleAudioMuted(true);
  });
});

document.querySelectorAll('[data-open-audio]').forEach(btn => btn.addEventListener('click', () => {
  ensureAudio(); syncAudioControls(); showUi('audio-settings-screen');
}));
if ($('audio-settings-close')) $('audio-settings-close').addEventListener('click', () => hideUi('audio-settings-screen'));
if ($('st-potion-wrap')) $('st-potion-wrap').addEventListener('click', () => { ensureAudio(); usePotion(); });
if ($('audio-master')) $('audio-master').addEventListener('click', () => toggleAudioMuted(true));
if ($('audio-haptics')) $('audio-haptics').addEventListener('click', toggleHaptics);
if ($('audio-defaults')) $('audio-defaults').addEventListener('click', resetAudioMix);
if ($('audio-music')) $('audio-music').addEventListener('input', e => setAudioMix('music', e.target.value));
if ($('audio-sfx')) {
  $('audio-sfx').addEventListener('input', e => setAudioMix('sfx', e.target.value));
  $('audio-sfx').addEventListener('change', () => { ensureAudio(); sfx.equip(); });
}
syncAudioControls();

if ($('bag')) {
  $('bag').addEventListener('click', e => {
    ensureAudio();
    const dx = e.target.closest('[data-drop]');
    if (dx) { discardFromBag(+dx.dataset.drop); hideTooltip(); return; }
    const cell = e.target.closest('[data-i]');
    if (cell) {
      selectedBagIndex = +cell.dataset.i;
      renderBag();
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
  const pageTab = e.target.closest('[data-town-page]');
  if (pageTab) { ensureAudio(); selectTownPage(pageTab.dataset.townPage, false); return; }
  const service = e.target.closest('.town-service[data-service]');
  if (service) { townActiveService = service.dataset.service || townActiveService; renderTownFocus(false); }
  const checkpoint = e.target.closest('[data-checkpoint]');
  if (checkpoint) { ensureAudio(); selectTownCheckpoint(+checkpoint.dataset.checkpoint); return; }
  const contract = e.target.closest('[data-contract]');
  if (contract) { ensureAudio(); selectTownContract(contract.dataset.contract); return; }
  const townWork = e.target.closest('[data-townwork]');
  if (townWork) { ensureAudio(); upgradeTownWork(townWork.dataset.townwork); return; }
  const townEvent = e.target.closest('[data-townevent]');
  if (townEvent) { ensureAudio(); resolveTownEvent(); return; }
  const relicFocus = e.target.closest('[data-relicfocus]');
  if (relicFocus) { ensureAudio(); selectRelicFocus(relicFocus.dataset.relicfocus || ''); return; }
  const dep = e.target.closest('[data-deposit]');
  if (dep) { ensureAudio(); depositStash(+dep.dataset.deposit); return; }
  const depAll = e.target.closest('[data-depositall]');
  if (depAll) { ensureAudio(); depositAllBag(); return; }
  const wth = e.target.closest('[data-withdraw]');
  if (wth) { ensureAudio(); withdrawStash(+wth.dataset.withdraw); return; }
  const buy = e.target.closest('[data-townbuy]');
  if (buy) { ensureAudio(); buyTown(buy.dataset.townbuy); return; }
  const ready = e.target.closest('[data-townready]');
  if (ready) { ensureAudio(); buyTownReadiness(); return; }
  const toast = e.target.closest('[data-taverndrink]');
  if (toast) { ensureAudio(); drinkAtTavern(); return; }
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
if ($('town-scene')) $('town-scene').addEventListener('pointerdown', e => {
  if (state !== 'town') return;
  ensureAudio();
  const canvas = $('town-scene');
  const rect = canvas.getBoundingClientRect();
  const x = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  const y = clamp((e.clientY - rect.top) / Math.max(1, rect.height), .79, .93);
  let nearest = null, distance = Infinity;
  for (const row of townInteractables()) {
    const d = Math.hypot(x - row.x, (y - row.y) * .72);
    if (d < distance) { nearest = row; distance = d; }
  }
  if (nearest && distance < .09) {
    const standX = clamp(nearest.x + (nearest.x < .5 ? .045 : -.045), .05, .95);
    setTownTarget(standX, .9, nearest.id);
  } else setTownTarget(x, y);
  canvas.focus({ preventScroll:true });
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
if ($('save-now-toggle')) $('save-now-toggle').addEventListener('click', () => { ensureAudio(); manualSaveNow(); });
if ($('btn-save-now')) $('btn-save-now').addEventListener('click', () => { ensureAudio(); manualSaveNow(); });
if ($('btn-save-quit')) $('btn-save-quit').addEventListener('click', () => {
  ensureAudio(); persistRun(); hideUi('pause-screen'); showTitle();
});
if ($('btn-shop-leave')) $('btn-shop-leave').addEventListener('click', () => { ensureAudio(); closeShop(); });
if ($('shop-list')) $('shop-list').addEventListener('click', e => {
  const buy = e.target.closest('[data-buy]');
  const sell = e.target.closest('[data-shop-sell]');
  if (!buy && !sell) return;
  ensureAudio();
  if (buy) buyShop(+buy.dataset.buy);
  else sellDungeonShopItem(+sell.dataset.shopSell);
});
if ($('talent-grid')) $('talent-grid').addEventListener('click', e => {
  const btn = e.target.closest('[data-talent]');
  if (!btn) return;
  ensureAudio();
  pickTalent(btn.dataset.talent);
});
if ($('refine-grid')) $('refine-grid').addEventListener('click', e => {
  const btn = e.target.closest('[data-refine]');
  if (!btn) return;
  ensureAudio();
  chooseForgeRefinement(btn.dataset.refine);
});
if ($('btn-shrine-ok')) $('btn-shrine-ok').addEventListener('click', () => { ensureAudio(); applyShrine(); });
if ($('btn-shrine-leave')) $('btn-shrine-leave').addEventListener('click', () => {
  ensureAudio(); closeShrine();
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
window.addEventListener('resize', () => {
  applyViewport();
  if (state === 'town') applyTownViewport();
});

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
    viewportFor, townCanvasSizeFor, heroSpriteKeyFor,
    lootIconIds: [...LOOT_ICON_IDS],
    runProfile: { ...RUN_PROFILE },
    get seed() { return RUN_SEED; },
    setSeed,
    burnVfx(n = 4096) { for (let i = 0; i < n; i++) vfx(); },
    profileId: PROFILE_ID,
    get classId() { return classId; },
    validateProfile, requireProfile,
    descend, usePotion, useScroll, useSkill, waitTurn, tryMove, directionalAttack,
    quickDive, quickDiveCost, skillManaCost,
    pauseGame, resumeGame,
    pickTalent, chooseEchoLeave, chooseEchoStay,
    genEquip, pickupHere, equipFromBag, discardFromBag, killMonster, newGame, toggleFullscreen,
    persistRun, manualSaveNow, peekRun, restoreRun, CLASSES, TALENTS,
    genLevel, monsterPoolFor, pickSpawn, ensureFloorContent,
    makeMonster, monsterThreatScale, applyDamageToMonster, monsterRangedAttack, monsterAttack, monstersTurn, beginArmorBreak, spawnCasks, endTurn,
    weaponBaseForDrop, starterWeaponForClass, weaponClassOf, canEquipForClass, sellDungeonShopItem,
    pThorns, pKillHeal, pMaxHp, pDef, pCrit, eqScoreOf, classFitOf, itemValueScore, mechanicValueBonus, forgeCost, sellPrice, pierceChanceOf,
    audioSnapshot,
    MECHANIC_TRAITS, mechanicPower, mechanicDescription, applyDirectHitMechanic,
    canDescendNow, isFinalFloor,
    get greedy() { return greedyMode; },
    setGreedy, getMeta: () => meta,
    get meta() { return meta; },
    useEscape, departTown, depositStash, withdrawStash, buyTown,
    tavernCost, tavernAvailable, drinkAtTavern, moveTownAvatar, setTownTarget, interactTown,
    TOWN_HOTSPOTS, activeTownResidents, townInteractables, townNpcLine, townRowHasNews, selectRelicFocus, get townAvatar() { return { ...townAvatar }; },
    unlockedTownCheckpoints, selectTownCheckpoint, get selectedTownCheckpoint() { return selectedTownCheckpoint; },
    spinWheel, resetWheel, spinCost, resetWheelCost, applyWheelPrize, genWheelSlot,
    ACHV, checkAchv, getRecord: () => ({ ...ensureRecord(), achv:{...ensureRecord().achv} }),
    sellItem, forgeItem, depositAllBag, forgeCost, sellPrice, sanitizeMeta,
    closeShop, buyShop, closeShrine, getShopStock: () => shopStock,
  };
}

if ($('title-screen')) {
  showTitle();
  if (typeof window !== 'undefined' && window.__DE_FRESH_CLASS_SELECT_PENDING) {
    const enterFreshClassSelect = () => {
      if (!window.__DE_FRESH_CLASS_SELECT_PENDING) return;
      window.__DE_FRESH_CLASS_SELECT_PENDING = false;
      showClassSelect();
    };
    if (window.__DE_CORE_LOCALE_DATA_V139) enterFreshClassSelect();
    else window.addEventListener('de:core-locale-ready', enterFreshClassSelect, { once:true });
  }
} else newGame('warrior');
const seedLabel = $('seed-label');
if (seedLabel) seedLabel.textContent = RUN_SEED + ui('（' + PROFILE_ID + '）', ' (' + PROFILE_ID + ')');
syncFullscreenUi();
scheduleFrame();
})();
