/* 地牢回响 v6.2 —— classic-100 百层端到端下潜回归
 * 直驱引擎：newGame → 逐层清怪/下潜 → 验证 9 个中层 Boss 按层出现
 * → 第 100 层楼梯被终局 Boss 封锁 → 击杀掉落「终焉之心」
 * → 拾取触发无尽回响选择 → 离开 → won。
 * 运行：node test/descent100.cjs   （exit 0 = 全部通过）
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const gradient = { addColorStop() {} };
function makeCtx() {
  return new Proxy({}, {
    get(_t, k) {
      if (k === 'canvas') return { width: 32, height: 32 };
      if (typeof k === 'string' && k.startsWith('create')) return () => gradient;
      if (k === 'measureText') return () => ({ width: 10 });
      return () => {};
    },
    set() { return true; },
  });
}
function makeCanvasEl() { return { width: 0, height: 0, getContext: () => makeCtx() }; }
function makeEl(id) {
  return {
    id, innerHTML: '', textContent: '', disabled: false, style: {}, dataset: {},
    getContext: () => makeCtx(),
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {}, setAttribute() {},
    querySelector: () => makeEl(id + '-child'),
  };
}
const elements = new Map();
const el = id => { if (!elements.has(id)) elements.set(id, makeEl(id)); return elements.get(id); };
global.document = {
  getElementById: id => el(id),
  createElement: tag => (tag === 'canvas' ? makeCanvasEl() : makeEl('created')),
  querySelector: () => null, querySelectorAll: () => [], addEventListener() {},
};
global.window = { innerWidth: 1280, innerHeight: 800, addEventListener() {}, DE_PROFILES: {} };
global.localStorage = {
  _m: new Map(),
  getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
  setItem(k, v) { this._m.set(k, String(v)); },
  removeItem(k) { return this._m.delete(k); },
};
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.Image = class { set src(_v) {} };
global.matchMedia = () => ({ matches: false });
global.performance = { now: () => Date.now() };
// 关键：让引擎按 ?profile=classic-100 选档
global.location = { search: '?profile=classic-100' };

const root = path.resolve(__dirname, '..');
const PROFILE_IDS = ['classic-10', 'classic-20', 'classic-30', 'classic-40', 'classic-50', 'classic-60', 'classic-100'];
for (const p of PROFILE_IDS) {
  vm.runInThisContext(fs.readFileSync(path.join(root, 'profiles', `${p}.profile.js`), 'utf8'), { filename: `${p}.profile.js` });
}
vm.runInThisContext(fs.readFileSync(path.join(root, 'game.js'), 'utf8'), { filename: 'game.js' });

const T = window.DE_TEST;
if (!T) { console.error('DE_TEST 未暴露'); process.exit(1); }

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

// ---------- 引擎档位确认 ----------
console.log('[descent100] profile=' + T.profileId);
ok(T.profileId === 'classic-100', '引擎以 classic-100 档启动');
ok(T.runProfile.floorRules.maxDepth === 100, 'maxDepth=100');

// ---------- 百层直驱 ----------
T.setSeed('descent100');
T.newGame('warrior');
ok(T.depth === 1 && T.state === 'playing', '开局第 1 层');

const MID_FLOORS = [10, 20, 30, 40, 50, 60, 70, 80, 90];
const seenMid = [];            // {depth, names[]}
let missingStairs = 0;
let gateBlocked = false;
let guard = 0;

function findTile(tileVal) {
  const map = T.mapGrid;
  for (let y = 0; y < 28; y++)
    for (let x = 0; x < 40; x++)
      if (map[y][x] === tileVal) return { x, y };
  return null;
}
function teleportTo(pt) {
  T.player.x = pt.x; T.player.y = pt.y;
  T.player.fx = pt.x; T.player.fy = pt.y;
}
function clearFloor() {
  while (T.monsters.length) {
    T.player.hp = T.player.hpBase;          // 免疫爆炸溅射等死亡路径
    T.killMonster(T.monsters[0]);
    if (T.state === 'dead') return false;
  }
  return true;
}

while (T.depth < 100 && guard++ < 600) {
  if (T.state === 'talent') { T.pickTalent('iron'); continue; }
  if (T.state !== 'playing') break;
  const mids = T.monsters.filter(m => m.midBoss).map(m => m.name);
  if (mids.length) seenMid.push({ depth: T.depth, names: mids });
  if (!clearFloor()) break;
  const s = findTile(2 /* STAIRS */);
  if (!s) { missingStairs++; break; }
  teleportTo(s);
  T.descend();
}

ok(T.depth === 100, '逐层下潜抵达第 100 层（实际 ' + T.depth + '）');
ok(missingStairs === 0, '每层都生成了下行楼梯');
ok(guard < 600, '循环未失控（guard=' + guard + '）');
ok(seenMid.length === MID_FLOORS.length &&
   MID_FLOORS.every(d => seenMid.some(x => x.depth === d)),
  '9 个中层 Boss 全部按指定层出现（10..90）');

// ---------- 第 100 层：封锁 → 击杀 → 拾取 → 回响选择 → 胜利 ----------
if (T.depth === 100 && T.state === 'playing') {
  ok(T.monsters.some(m => m.boss), '第 100 层生成终局 Boss');
  ok(!T.monsters.some(m => m.midBoss), '100 层不生成中层 Boss');
  clearFloor();
  const s2 = findTile(2);
  if (s2) { teleportTo(s2); }
  const d0 = T.depth;
  T.descend();
  gateBlocked = T.depth === d0;
  ok(gateBlocked, '100 层楼梯被终局 Boss 封锁（descend 拒绝）');

  // Boss 已被 clearFloor 杀掉并掉落心脏；若封锁测试前未杀则现在补杀
  while (T.monsters.length) { T.player.hp = T.player.hpBase; T.killMonster(T.monsters[0]); }
  const heart = T.items.find(i => i.type === 'amulet');
  ok(!!heart, '终焉之心已从 Boss 掉落');
  if (heart) {
    teleportTo(heart);
    T.pickupHere();
    ok(T.state === 'echo', '拾取心脏 → 进入无尽回响选择（endlessAfter）');
    if (T.state === 'echo') {
      T.chooseEchoLeave();
      ok(T.state === 'won', '选择离开 → 胜利结算 won');
    }
  }
} else if (T.depth === 100) {
  ok(false, '第 100 层流程未执行（state=' + T.state + '）');
}

console.log('\nRESULT  ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
