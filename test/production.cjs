/* Dungeon Echo production entry contract.
 * Boots the exact local script list declared by index.html under a small browser stub.
 * This is the fast release gate for the public classic-100 route; short profiles remain
 * covered separately by smoke.cjs as deterministic development fixtures.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m => m[1]);
const expectedScripts = [
  'production-bootstrap.js',
  'profiles/classic-100.profile.js',
  'game.js',
  'equipment-system.js',
  'town-system.js',
  'commerce-system.js',
  'forge-system.js',
  'progression-system.js',
  'content-system.js',
  'visual-polish.js',
  'gameplay-tuning.js',
  'defense-system.js',
  'desktop-controls.js',
];

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

const gradient = { addColorStop() {} };
function makeCtx() {
  return new Proxy({}, {
    get(_target, key) {
      if (key === 'canvas') return { width: 32, height: 32 };
      if (key === 'measureText') return () => ({ width: 10 });
      if (typeof key === 'string' && key.startsWith('create')) return () => gradient;
      return () => {};
    },
    set() { return true; },
  });
}
function classList() {
  const values = new Set();
  return {
    add(...rows) { rows.forEach(row => values.add(row)); },
    remove(...rows) { rows.forEach(row => values.delete(row)); },
    toggle(row, force) {
      const next = force === undefined ? !values.has(row) : !!force;
      if (next) values.add(row); else values.delete(row);
      return next;
    },
    contains(row) { return values.has(row); },
  };
}
function makeEl(id = '') {
  return {
    id,
    innerHTML: '',
    textContent: '',
    title: '',
    disabled: false,
    style: {},
    dataset: {},
    children: [],
    parentNode: null,
    classList: classList(),
    getContext: () => makeCtx(),
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    insertBefore(child) { child.parentNode = this; this.children.push(child); return child; },
    remove() {},
    focus() {},
    click() {},
    closest() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}

const elements = new Map();
const el = id => {
  if (!elements.has(id)) elements.set(id, makeEl(id));
  return elements.get(id);
};

global.document = {
  head: makeEl('head'),
  body: makeEl('body'),
  activeElement: null,
  getElementById: id => el(id),
  createElement: tag => makeEl(tag === 'canvas' ? 'canvas' : ''),
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return true; },
};
global.window = {
  innerWidth: 1280,
  innerHeight: 800,
  DE_PROFILES: {},
  addEventListener() {},
  removeEventListener() {},
};
global.localStorage = {
  _m: new Map(),
  getItem(key) { return this._m.has(key) ? this._m.get(key) : null; },
  setItem(key, value) { this._m.set(key, String(value)); },
  removeItem(key) { this._m.delete(key); },
};
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.setInterval = () => 0;
global.clearInterval = () => {};
global.queueMicrotask = fn => fn();
global.Image = class { set src(_value) {} };
global.KeyboardEvent = class {
  constructor(type, init) { this.type = type; Object.assign(this, init); }
};
global.matchMedia = () => ({ matches: false });
global.performance = { now: () => Date.now() };
Object.defineProperty(global, 'navigator', {
  value: { getGamepads: () => [] },
  configurable: true,
});

global.location = {
  href: 'http://localhost/?profile=classic-30',
  search: '?profile=classic-30',
};
global.history = {
  replaceState(_state, _title, href) {
    const url = new URL(href);
    global.location.href = url.href;
    global.location.search = url.search;
  },
};

console.log('[production] static entry');
ok(JSON.stringify(scripts) === JSON.stringify(expectedScripts), 'index.html 生产脚本清单与顺序固定');
ok(!/profiles\/classic-(10|20|30|40|50|60)\.profile\.js/.test(html), '游客入口不加载短档位');
ok(!/data-act="quickdive"|id="quickdive-fab"/.test(html), '游客入口不公开未征服快速下潜');
ok(expectedScripts.every(src => fs.existsSync(path.join(root, src))), '全部生产脚本资源存在');
ok(fs.existsSync(path.join(root, 'art/title-backdrop.webp')) && /art\/title-backdrop\.webp/.test(html),
  '标题美术已预载并存在');
ok(fs.existsSync(path.join(root, 'art/class-roster.webp')) && /rel="preload" href="art\/class-roster\.webp"/.test(html),
  '四职业肖像已预载并存在');
for (const art of ['hero-atlas-v11.png', 'monster-atlas-v11.png', 'guardian-atlas-v11.png',
  'final-boss-v11.png', 'town-backdrop-v11.webp']) {
  ok(fs.existsSync(path.join(root, 'art', art)) && html.includes(`art/${art}`), `${art} 已预载并存在`);
}

for (const src of scripts) {
  const file = path.join(root, src);
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: src });
}

const T = window.DE_TEST;
console.log('\n[production] runtime contract');
ok(!!T, '生产引擎已启动');
ok(global.location.search === '?profile=classic-100', 'bootstrap 强制 classic-100 URL');
ok(T && T.profileId === 'classic-100', '引擎选择 classic-100');
ok(T && T.runProfile.floorRules.maxDepth === 100, '正式旅程最大深度 100');

const markers = [
  '__DE_EQUIPMENT_SYSTEM', '__DE_TOWN_SYSTEM', '__DE_COMMERCE_SYSTEM',
  '__DE_FORGE_SYSTEM', '__DE_PROGRESSION_SYSTEM', '__DE_CONTENT_SYSTEM',
  '__DE_VISUAL_POLISH', '__DE_GAMEPLAY_TUNING', '__DE_DEFENSE_MODEL', '__DE_GAMEPAD_BOOTED',
];
ok(markers.every(name => !!window[name]), '十个生产系统均同步装载');
ok(!!window.DE_TOWN_CHECKPOINTS && !!window.DE_TOWN_ECONOMY, '城镇检查点与阶段经济可用');
ok(!!window.DE_COMMERCE && !!window.DE_FORGE_REFINEMENT, '有限库存与锻造分支可用');
ok(!!window.DE_TALENT_RANKS && typeof window.DE_EQUIP_FIT_SCORE === 'function', '百层天赋与装备双轴价值可用');

console.log('\n[production] gameplay tuning');
ok(T.CLASSES.warrior.hpBase === 40 && T.CLASSES.warrior.skill.cd === 5, '战士 human-v1 生效');
ok(T.CLASSES.ranger.rangedRange === 4, '游侠 human-v1 射程生效');
ok(T.CLASSES.mage.rangedRange === 3, '秘术师直线远程生效');
ok(T.CLASSES.assassin.hpBase === 26 && T.CLASSES.assassin.skill.cd === 7, '刺客 human-v1 生效');
ok(new Set(['warrior', 'ranger', 'mage', 'assassin'].map(id => T.heroSpriteKeyFor(id))).size === 4,
  '四职业拥有独立实战角色轮廓');

const guardians = T.runProfile.midBosses || [];
const signatures = guardians.map(g => [g.armorBreak, g.slow, g.regen, g.boom, g.enrage, g.ranged, g.leech]
  .map(v => v || false).join('|'));
console.log('\n[production] chapter content');
ok(guardians.length === 9 && guardians.every(g => g.depth % 10 === 0), '10–90 层九位守卫齐全');
ok(new Set(signatures).size === 9, '九位守卫拥有不同机制组合');
ok(guardians.find(g => g.depth === 10).armorBreak === true, '第 10 层守卫教授可预判破甲');
ok(T.runProfile.themes.length >= 25, '85–100 层拥有独立章节主题');
ok(T.runProfile.boss.ranged === 3 && T.runProfile.boss.regen && T.runProfile.boss.enrage, '第 100 层终局机制桥已启用');

console.log('\n[production] greedy meta derived-stat repair');
T.setGreedy(true);
T.newGame('warrior');
{
  const broken = JSON.parse(JSON.stringify(T.meta));
  broken.talents = [
    'bramble', 'bramble', 'scavenge', 'elixir', 'frenzy', 'tenacity',
    'plunder', 'echoborn', 'w_reprise',
  ];
  for (const field of ['thornsBase', 'regenBase', 'potionBoost', 'critPower', 'grivResist', 'plunder']) broken[field] = 0;
  broken.fastRegen = 0;
  localStorage.setItem('de-greedy-meta-v1', JSON.stringify(broken));
  T.newGame('warrior');
  const repaired = window.DE_TALENT_RANKS.repairGreedyMeta();
  ok(repaired === true, '旧贪婪元档触发兼容回填');
  ok(T.player.thornsBase === 13 && T.meta.thornsBase === 13, '荆棘/铁血反击恢复反伤最低值');
  ok(T.player.regenBase === 5 && T.meta.regenBase === 5, '食腐/铁血反击恢复击杀回复最低值');
  ok(T.player.potionBoost === 40 && T.meta.potionBoost === 40, '强效药剂恢复药水强化');
  ok(T.player.critPower === 25 && T.meta.critPower === 25, '致命节奏恢复暴击伤害');
  ok(T.player.grivResist === 1 && T.meta.grivResist === 1, '坚韧恢复重伤抗性');
  ok(T.player.plunder === 25 && T.meta.plunder === 25, '掠夺者恢复掉落加成');
  ok(T.player.fastRegen === true && T.meta.fastRegen === 1, '回响体恢复快速自然回复');
  const disk = JSON.parse(localStorage.getItem('de-greedy-meta-v1'));
  ok(disk.thornsBase === 13 && disk.regenBase === 5 && disk.fastRegen === 1,
    '修复结果立即写回元存档，避免再次重载丢失');
  T.player.critPower = 99;
  T.meta.critPower = 99;
  window.DE_TALENT_RANKS.repairGreedyMeta();
  ok(T.player.critPower === 99 && T.meta.critPower === 99, '兼容修复只补最低值，不覆盖更高合法属性');
}
T.setGreedy(false);

console.log('\nRESULT  ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
