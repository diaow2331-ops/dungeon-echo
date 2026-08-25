/* 地牢回响 Dungeon Echo 批量平衡模拟
 * bot 策略跑完整局，输出胜率与死亡层分布。
 * 用法：
 *   node test/sim.cjs                       # 默认 SIM_MANY=30 批量
 *   SIM_ONE=warrior node test/sim.cjs       # 单局追踪某职业
 *   SIM_MANY=20 node test/sim.cjs           # 指定批量
 *   SIM_DEPTH=classic-100 node test/sim.cjs # 指定档位
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
  removeItem(k) { this._m.delete(k); },
};
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.Image = class { set src(_v) {} };
global.matchMedia = () => ({ matches: false });
global.performance = { now: () => Date.now() };

// 档位选择提前到 game.js 加载前：让引擎按 ?profile= 真的选档（模拟浏览器 query）
const SIM_ONE = process.env.SIM_ONE;
const SIM_MANY = parseInt(process.env.SIM_MANY || '30', 10);
const SIM_DEPTH = process.env.SIM_DEPTH || 'classic-30';
global.location = { search: '?profile=' + SIM_DEPTH };

const root = path.resolve(__dirname, '..');
const PROFILE_IDS = ['classic-10', 'classic-20', 'classic-30', 'classic-40', 'classic-50', 'classic-60', 'classic-100'];
for (const p of PROFILE_IDS) {
  vm.runInThisContext(fs.readFileSync(path.join(root, 'profiles', `${p}.profile.js`), 'utf8'), { filename: `${p}.profile.js` });
}
vm.runInThisContext(fs.readFileSync(path.join(root, 'game.js'), 'utf8'), { filename: 'game.js' });

const T = window.DE_TEST;
const WALL = 0;
const LOOT_DETOUR = 10;   // 觅食绕路预算（格）：物品距离 ≤ 玩家到楼梯距离 + 预算
const STALL_TURNS = 250;  // 停滞阈值：连续无击杀/下潜进展则进入追猎模式
function bfs(goalX, goalY) {
  const p = T.player, map = T.mapGrid;
  if (!map || !map[p.y] || map[p.y][p.x] === undefined) return null;
  const blocked = new Set();
  for (const m of T.monsters) blocked.add(m.y * 40 + m.x);
  for (const n of T.npcs || []) blocked.add(n.y * 40 + n.x);
  const goalKey = goalY * 40 + goalX;
  const prev = new Map();
  const q = [[p.x, p.y]];
  prev.set(p.y * 40 + p.x, -1);
  let found = false, qi = 0;
  while (qi < q.length) {
    const [x, y] = q[qi++];
    const key = y * 40 + x;
    if (key === goalKey) { found = true; break; }
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ox, ny = y + oy, nk = ny * 40 + nx;
      if (nx < 0 || ny < 0 || nx >= 40 || ny >= 28) continue;
      if (prev.has(nk)) continue;
      if (map[ny][nx] === WALL) continue;
      if (blocked.has(nk) && nk !== goalKey) continue;
      prev.set(nk, key);
      q.push([nx, ny]);
    }
  }
  if (!found) return null;
  // 回溯得到距离与第一步
  let cur = goalKey, start = p.y * 40 + p.x, dist = 0;
  while (cur !== start && prev.get(cur) !== undefined && prev.get(cur) !== -1) { cur = prev.get(cur); dist++; }
  if (cur !== start) return null;
  let stepCur = goalKey;
  while (prev.get(stepCur) !== start && prev.get(stepCur) !== -1 && stepCur !== start) stepCur = prev.get(stepCur);
  if (stepCur === start) return null;
  return { dist, step: [stepCur % 40 - p.x, Math.floor(stepCur / 40) - p.y] };
}
function findStairs() {
  const map = T.mapGrid;
  for (let y = 0; y < 28; y++)
    for (let x = 0; x < 40; x++)
      if (map[y][x] === 2) return { x, y };
  return null;
}

function nearestMobDist(x, y) {
  let d = 99;
  for (const m of T.monsters) d = Math.min(d, Math.abs(m.x - x) + Math.abs(m.y - y));
  return d;
}
// 撤退步：四方向中找可走、无怪无 NPC 且离最近怪更远的一步；拉不开距离则不撤
function retreatStep() {
  const p = T.player;
  const cur = nearestMobDist(p.x, p.y);
  let best = null;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = p.x + dx, ny = p.y + dy;
    if (nx < 0 || ny < 0 || nx >= 40 || ny >= 28) continue;
    if (T.mapGrid[ny][nx] === 0) continue;
    if (T.monsters.some(m => m.x === nx && m.y === ny)) continue;
    if ((T.npcs || []).some(n => n.x === nx && n.y === ny)) continue;
    const d = nearestMobDist(nx, ny);
    if (!best || d > best.d) best = { d, step: [dx, dy] };
  }
  return best && best.d > cur ? best.step : null;
}

function runBot(classId, seed) {
  T.setSeed(seed);
  T.newGame(classId);
  let turns = 0;
  const MAX_T = 8000;
  let lastProgress = 0, seenKills = 0, seenDepth = 1;   // 停滞检测：破解风筝怪/绕圈死锁
  let shopCooldown = 0;                                  // 进店空手而归后的冷却（防开-关死循环）
  while (turns++ < MAX_T) {
    const st = T.state;
    if (st === 'dead' || st === 'won')
      return { outcome: st, depth: T.depth, lvl: T.player.lvl, kills: T.player.kills, turns };
    if (st === 'talent') { T.pickTalent('iron'); continue; }
    if (st === 'echo') { T.chooseEchoLeave(); continue; }
    if (st === 'shop') {
      // 拟人购物：药水补到 4 瓶；血量 <60% 时买包扎回满，然后离开
      const stock = T.getShopStock();
      const potIdx = stock.findIndex(r => r.kind === 'potion');
      const healIdx = stock.findIndex(r => r.kind === 'heal');
      while (potIdx >= 0 && T.player.potions < 4 && T.player.gold >= stock[potIdx].price) T.buyShop(potIdx);
      if (healIdx >= 0 && T.player.hp < T.pMaxHp() * 0.6 && T.player.gold >= stock[healIdx].price) T.buyShop(healIdx);
      if (T.player.potions < 2) shopCooldown = turns + 120;  // 没买到药，本层一段时间内不再进店
      T.closeShop();
      continue;
    }
    if (st === 'shrine') { T.closeShrine(); continue; }  // 不祈祷直接离开
    if (st !== 'playing')
      return { outcome: 'stuck-' + st, depth: T.depth, lvl: T.player.lvl, kills: T.player.kills, turns };
    const p = T.player;
    if (p.kills !== seenKills || T.depth !== seenDepth) {
      seenKills = p.kills; seenDepth = T.depth; lastProgress = turns; shopCooldown = 0;
    }
    // 喝药阈值按总血量（装备加成计入），不再按基础血量
    if (p.hp <= Math.round(T.pMaxHp() * 0.45) && p.potions > 0) { T.usePotion(); continue; }
    // 自动穿戴更高分的装备
    for (let i = 0; i < p.inv.length; i++) {
      const it = p.inv[i];
      const cur = p.equip[it.slot];
      if (it.score > ((cur && cur.score) || 0)) { T.equipFromBag(i); break; }
    }
    const adj = T.monsters.filter(m => Math.abs(m.x - p.x) + Math.abs(m.y - p.y) === 1);
    const stalled = turns - lastProgress > STALL_TURNS;
    // 残血脱离 / 游侠风筝：被贴脸且血量偏低时优先拉开距离（游侠移动可能触发自动射击）。
    // 停滞 250 回合后强制恢复进攻，防止「撤退↔追猎」无限拉锯；风筝要求还有药水可回，
    // 否则永远风筝不产生任何进展，战斗是唯一出路。
    if (adj.length && !stalled) {
      const lowHp = p.hp < T.pMaxHp() * 0.35 && p.potions > 0;  // 没药时撤退无意义，血战到底
      const kite = classId === 'ranger' && p.hp < T.pMaxHp() * 0.6 && p.potions > 0;
      if (lowHp || kite) {
        const s = retreatStep();
        if (s) { T.tryMove(s[0], s[1]); continue; }
      }
    }
    // 战士贴脸优先横扫（无目标时 useSkill 不消耗回合）。
    // 伤害判定必须逐怪对比 before/after——用「单怪血量 < 总和」会恒真导致死循环
    if (classId === 'warrior' && adj.length && p.skillCd === 0) {
      const before = adj.map(m => m.hp);
      T.useSkill();
      const after = adj.map(m => m.hp);
      if (p.skillCd > 0 || after.some((h, i) => h < before[i])) continue;
    }
    // 法师：视野内有怪且技能可用就点奥术弹（远程消耗；无效目标不耗回合）
    if (classId === 'mage' && p.skillCd === 0 && T.monsters.length) {
      T.useSkill();
      if (p.skillCd > 0) continue;
    }
    // 刺客：视野内有怪就影袭（瞬移+必爆；无落脚点/无目标时不耗回合）
    if (classId === 'assassin' && p.skillCd === 0 && T.monsters.length) {
      T.useSkill();
      if (p.skillCd > 0) continue;
    }
    // 游侠：贴脸被围时用疾步穿身（伤害+位移脱困）；伤害判定逐怪对比（同战士）
    if (classId === 'ranger' && adj.length && p.skillCd === 0) {
      const before = adj.map(m => m.hp);
      T.useSkill();
      const after = adj.map(m => m.hp);
      if (p.skillCd > 0 || after.some((h, i) => h < before[i])) continue;
    }
    if (adj.length) {
      const m = adj[0];
      T.tryMove(Math.sign(m.x - p.x), Math.sign(m.y - p.y));
      continue;
    }
    // 目标选择：护符 > 钥匙（必捡） > 停滞追猎 > 预算内觅食（药水/装备） > 楼梯
    const amulet = T.items.find(it => it.type === 'amulet');
    let goal = null, goalKind = null;
    if (amulet) { goal = { x: amulet.x, y: amulet.y }; goalKind = 'pickup'; }
    if (!goal && !stalled) {
      const keyIt = T.items.find(it => it.type === 'key');
      if (keyIt) { goal = { x: keyIt.x, y: keyIt.y }; goalKind = 'pickup'; }
    }
    // 主动补给：药水不足或血量偏低时走向商人（买药/包扎）；残血顺路用营地（撞即包扎，一次性）。
    // 必须买得起才去（按商店实际售价），且停滞时不进店——否则没钱也会反复撞店直到超时。
    if (!goal && !stalled && turns >= shopCooldown) {
      const stock = T.getShopStock() || [];
      const potPrice = (stock.find(r => r.kind === 'potion') || { price: 16 }).price;
      const healPrice = (stock.find(r => r.kind === 'heal') || { price: 24 }).price;
      const wantShop = (p.potions < 2 && p.gold >= potPrice) ||
        (p.hp < T.pMaxHp() * 0.55 && p.gold >= healPrice);
      const npc = (T.npcs || []).find(n =>
        (n.type === 'shop' && wantShop) ||
        (n.type === 'rest' && !n.used && p.hp < T.pMaxHp() * 0.7));
      if (npc) { goal = { x: npc.x, y: npc.y }; goalKind = 'npc'; }
    }
    if (!goal && stalled) {
      // 追猎模式：直扑最近的可达怪，破解远程风筝/绕圈死锁
      let best = null;
      for (const m of T.monsters) {
        const r = bfs(m.x, m.y);
        if (r && (!best || r.dist < best.dist)) best = { dist: r.dist, m };
      }
      if (best) { goal = { x: best.m.x, y: best.m.y }; goalKind = 'hunt'; }
    }
    if (!goal) {
      const stairs = findStairs();
      const toStairs = stairs ? bfs(stairs.x, stairs.y) : null;
      let best = null;                                   // { dist, item }
      for (const it of T.items) {
        if (it.type !== 'potion' && it.type !== 'equip') continue;
        if (it.type === 'equip' && p.inv.length >= 11) continue;   // 留 1 格余量
        const r = bfs(it.x, it.y);
        if (!r) continue;
        if (toStairs && r.dist > toStairs.dist + LOOT_DETOUR) continue;  // 绕路预算
        if (!best || r.dist < best.dist) best = { dist: r.dist, item: it };
      }
      if (best) { goal = { x: best.item.x, y: best.item.y }; goalKind = 'pickup'; }
      else if (stairs) { goal = stairs; goalKind = 'stairs'; }
    }
    if (!goal) { T.waitTurn(); continue; }
    if (p.x === goal.x && p.y === goal.y) {
      if (goalKind === 'pickup') { T.pickupHere(); continue; }
      if (goalKind === 'hunt') { T.waitTurn(); continue; }   // 目标怪已移动，下回合重算
      if (T.canDescendNow()) { T.descend(); continue; }
      T.waitTurn(); continue;
    }
    // NPC 目标：贴身即撞门（开商店 / 用营地）
    if (goalKind === 'npc' && Math.abs(goal.x - p.x) + Math.abs(goal.y - p.y) === 1) {
      T.tryMove(Math.sign(goal.x - p.x), Math.sign(goal.y - p.y));
      continue;
    }
    const step = bfs(goal.x, goal.y);
    if (!step || !step.step) {
      let nearest = null, nd = Infinity;
      for (const m of T.monsters) {
        const d = Math.abs(m.x - p.x) + Math.abs(m.y - p.y);
        if (d < nd) { nd = d; nearest = m; }
      }
      if (nearest) {
        const s2 = bfs(nearest.x, nearest.y);
        if (s2 && s2.step) { T.tryMove(s2.step[0], s2.step[1]); continue; }
      }
      T.waitTurn(); continue;
    }
    T.tryMove(step.step[0], step.step[1]);
  }
  return { outcome: 'timeout', depth: T.depth, lvl: T.player.lvl, kills: T.player.kills, turns };
}

// ---------- 批量运行 ----------
if (SIM_ONE) {
  const r = runBot(SIM_ONE, 'sim-one');
  console.log(`SIM_ONE=${SIM_ONE} -> ${r.outcome} depth=${r.depth} lvl=${r.lvl} kills=${r.kills} turns=${r.turns}`);
} else {
  const classes = ['warrior', 'ranger', 'mage', 'assassin'];
  console.log(`SIM_MANY=${SIM_MANY} profile=${SIM_DEPTH}`);
  for (const cid of classes) {
    let wins = 0, deaths = 0, timeouts = 0;
    const deathsAt = {};
    for (let i = 0; i < SIM_MANY; i++) {
      const r = runBot(cid, `sim-${cid}-${i}`);
      if (r.outcome === 'won') wins++;
      else if (r.outcome === 'dead') { deaths++; deathsAt[r.depth] = (deathsAt[r.depth] || 0) + 1; }
      else timeouts++;
    }
    const pc = (100 * wins / SIM_MANY).toFixed(1);
    console.log(`\n${cid.padEnd(9)} win ${pc}% (${wins}/${SIM_MANY})` +
      (deaths ? `  dead=${deaths}` : '') +
      (timeouts ? `  timeout=${timeouts}` : ''));
    if (deaths) {
      const top = Object.entries(deathsAt).sort((a, b) => b[1] - a[1]).slice(0, 4)
        .map(([d, n]) => `${d}层×${n}`).join(' ');
      console.log(`          死亡层 Top: ${top}`);
    }
  }
  console.log('\nsim 完成（bot 策略有限，胜率仅供参考）');
}

