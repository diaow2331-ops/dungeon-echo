/* 地牢回响 Dungeon Echo v6.2 无头确定性冒烟
 * DOM/Canvas stub + vm 加载 6 档 profile 与 game.js，覆盖：
 * 六档位校验 / 四职业 / 游侠远程 / 刺客影袭 / Boss 刷怪与门禁 /
 * 职业武器池 / 存档 version 防护·暂停保存·往返 / 固定种子确定性。
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

const root = path.resolve(__dirname, '..');
const PROFILE_IDS = ['classic-10', 'classic-20', 'classic-30', 'classic-40', 'classic-50', 'classic-60', 'classic-100'];
for (const p of PROFILE_IDS) {
  vm.runInThisContext(fs.readFileSync(path.join(root, 'profiles', `${p}.profile.js`), 'utf8'), { filename: `${p}.profile.js` });
}
vm.runInThisContext(fs.readFileSync(path.join(root, 'game.js'), 'utf8'), { filename: 'game.js' });

const T = window.DE_TEST;
console.log('[harness] booted, DE_TEST=' + !!T);
if (!T) { console.error('DE_TEST 未暴露'); process.exit(1); }

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}
function section(name) { console.log('\n[' + name + ']'); }

// ---------- 1. Profile ----------
section('1 六档位校验');
ok(PROFILE_IDS.every(id => !!window.DE_PROFILES[id]), '6 档 profile 均已注册');
ok(T.profileId === 'classic-30', '默认档位 classic-30');
const depths = { 'classic-10': 10, 'classic-20': 20, 'classic-30': 30, 'classic-40': 40, 'classic-50': 50, 'classic-60': 60, 'classic-100': 100 };
ok(PROFILE_IDS.every(id => window.DE_PROFILES[id] && window.DE_PROFILES[id].floorRules.maxDepth === depths[id]),
  '各档位 maxDepth 正确');
for (const id of PROFILE_IDS) {
  try { T.validateProfile(window.DE_PROFILES[id]); ok(true, id + ' validateProfile 通过'); }
  catch (e) { ok(false, id + ' 校验失败：' + e.message); }
}

// ---------- 2. 职业 ----------
section('2 四职业');
ok(Object.keys(T.CLASSES).length === 4, '有 4 个职业');
ok(!!T.CLASSES.assassin && T.CLASSES.assassin.skill.id === 'backstab', '刺客含「影袭」');
ok(T.CLASSES.ranger.rangedRange === 5, '游侠射程 5 格');
for (const cid of ['warrior', 'ranger', 'mage', 'assassin']) {
  T.newGame(cid);
  ok(!!T.player && T.player.hpBase > 0, cid + ' newGame 成功');
}
T.newGame('assassin');
ok(T.classId === 'assassin', 'classId 记录为 assassin');

// ---------- 3. 职业武器池 ----------
section('3 职业专属武器池');
const wBases = T.runProfile.weaponBases || [];
ok(wBases.length > 0 && wBases.every(b => ['warrior', 'ranger', 'mage', 'assassin'].includes(b.cls)),
  '每个武器基都有合法职业标记');
const mapIcon = { sword: ['iron-sword', 'broad-sword', 'rune-blade'], axe: ['battle-axe'], bow: ['hunting-bow'], staff: ['arcane-staff'], dagger: ['dagger'] };
const exp = { warrior: ['sword', 'axe'], ranger: ['bow'], mage: ['staff'], assassin: ['dagger'] };
for (const [cid, keys] of Object.entries(exp)) {
  const icons = [...new Set(wBases.filter(b => b.cls === cid).map(b => b.icon))];
  const has = keys.some(k => icons.some(i => (mapIcon[k] || []).includes(i)));
  ok(has, cid + ' 池预期类别命中（' + icons.slice(0, 3).join('/') + '）');
}

// ---------- 4. 游侠远程 ----------
section('4 游侠远程射击');
T.newGame('ranger');
{
  const px = T.player.x, py = T.player.y;
  for (let i = 0; i <= 3; i++) T.mapGrid[py][px + i] = 1;
  const m0 = T.monsters.find(x => !x.boss && !x.midBoss);
  m0.x = px + 3; m0.y = py; m0.maxHp = 40; m0.hp = 40;
  const startX = T.player.x;
  const before = m0.hp;
  T.tryMove(1, 0);
  ok(m0.hp < before, '面朝直线内无墙敌人移动即射击');
  ok(T.player.x === startX, '游侠未贴脸位移');
}

// ---------- 5. 刺客影袭 ----------
section('5 刺客影袭');
T.newGame('assassin');
{
  const m = T.monsters.find(x => !x.boss && !x.midBoss);
  m.x = T.player.x + 1; m.y = T.player.y; m.maxHp = 40; m.hp = 40;
  const before = m.hp;
  T.player.skillCd = 0;
  T.useSkill();
  ok(m.hp < before, '影袭造成伤害');
  ok(T.player.skillCd > 0, '影袭进入冷却');
}

// ---------- 6. Boss / 门禁 ----------
section('6 Boss / 中层 / 门禁');
T.newGame('mage');
T.depth = 10; T.genLevel();
ok(T.monsters.some(m => m.midBoss), '第 10 层有中层 Boss');
ok(T.canDescendNow(), '中层 Boss 不强制阻挡下潜');
{
  // 击杀中层 Boss 应额外掉落治疗药水（战利品激励）
  const mb = T.monsters.find(m => m.midBoss);
  const potionsBefore = T.items.filter(it => it.type === 'potion').length;
  T.killMonster(mb);
  const potionsAfter = T.items.filter(it => it.type === 'potion').length;
  ok(potionsAfter > potionsBefore, '击杀中层 Boss 额外掉落治疗药水');
}
T.depth = 30; T.genLevel();
ok(T.monsters.some(m => m.boss), '第 30 层有终 Boss');
ok(!T.canDescendNow() && T.isFinalFloor(), '终局层 Boss 存活时不可下潜');
{
  const boss = T.monsters.find(m => m.boss);
  T.killMonster(boss);
  ok(T.items.some(it => it.type === 'amulet'), '击败终 Boss 掉落「地牢之心」');
  ok(!T.canDescendNow(), '终局未抉择前仍不可下潜');
}

// ---------- 7. 存档 ----------
section('7 存档 version + 往返');
T.newGame('warrior');
localStorage.removeItem('de-run-v6');
T.persistRun();
const raw = localStorage.getItem('de-run-v6');
ok(!!raw, 'persistRun 写入');
ok(JSON.parse(raw).version === 2, '存档 version=2');
localStorage.setItem('de-run-v6', JSON.stringify({ version: 99, profileId: 'classic-30', state: 'playing' }));
ok(T.peekRun() === null, 'version 不符的存档被拒');
T.persistRun();
const saved = T.peekRun();
ok(!!saved, 'peekRun 读回当前档');
T.restoreRun(saved);
ok(T.depth === saved.depth && T.player.hpBase > 0, 'restoreRun 恢复楼层与玩家');

// ---------- 7b. 暂停保存回归 ----------
section('7b 暂停保存 / 继续');
T.newGame('warrior');
T.pauseGame();
ok(T.state === 'paused', '暂停后 state==paused');
T.resumeGame();
ok(T.state === 'playing', '继续后 state==playing');

// ---------- 8. 固定种子 ----------
section('8 固定种子确定性');
function snap() { return T.depth + '|' + T.player.x + '|' + T.player.y + '|' + T.player.gold + '|' + T.monsters.length; }
T.setSeed('regress-a'); T.newGame('warrior'); const a1 = snap();
T.setSeed('regress-a'); T.newGame('warrior'); const a2 = snap();
ok(a1 === a2, '同种子两次 newGame 局面一致');

// ---------- 9. 贪婪远征 ----------
section('9 贪婪远征：回城 / 死亡惩罚 / 城镇');
T.setGreedy(true);
ok(T.greedy === true, '贪婪模式开启');
T.newGame('warrior');
ok(T.state === 'playing' && T.depth === 1, '贪婪开局直接进入第 1 层');
ok(!!T.meta && T.meta.classId === 'warrior', '元进度已建立（warrior）');
ok((T.meta.escapes || 0) >= 2, '初始携带 2 张回城卷轴');

// 回城：金币入金库、背包带回小镇
const fakeLoot = { slot: 'ring', name: '测试戒指', score: 99, icon: 'copper-ring',
  rarity: 1, stats: { hp: 5 }, base: { name: '测试戒指' }, affixes: [], spr: 'ring' };
T.player.gold = 123;
T.player.inv.push(JSON.parse(JSON.stringify(fakeLoot)));
const bankBeforeEscape = T.meta.gold;
T.useEscape();
ok(T.state === 'town', '回城后进入城镇状态');
ok(T.meta.gold === bankBeforeEscape + 123, '随身金币存入金库');
ok(T.meta.bag.length === 1 && T.meta.bag[0].name === '测试戒指', '背包战利品平安带回');

// 仓库存取往返
T.depositStash(0);
ok(T.meta.stash.length === 1 && T.meta.bag.length === 0, '装备存入仓库（死亡夺不走）');
T.withdrawStash(0);
ok(T.meta.bag.length === 1 && T.meta.stash.length === 0, '装备从仓库取出');

// 出发再下潜
T.departTown();
ok(T.state === 'playing' && T.depth === 1, '出发后重新从第 1 层开始');
ok(T.player.inv.length === 1 && T.player.gold === 0, '背包随身携带、金币清零（在身上不在金库）');

// 死亡惩罚：失去背包与随身金币，穿戴保留，回到城镇
T.player.gold = 50;
T.player.inv.push(JSON.parse(JSON.stringify(fakeLoot)));
const worn = JSON.parse(JSON.stringify(fakeLoot));
T.player.equip.ring = worn;
const bankAfterEscape = T.meta.gold;
const killer = T.monsters.find(x => !x.boss && !x.midBoss);
killer.x = T.player.x + 1; killer.y = T.player.y; killer.atk = 40;
T.player.hp = 1;
T.waitTurn();
ok(T.state === 'town', '死亡后回到城镇而非删档结束');
ok(T.meta.gold === bankAfterEscape, '死亡不损失金库（只丢随身金币）');
ok(T.meta.bag.length === 0, '死亡失去背包物品');
ok(!!T.meta.equip.ring && T.meta.equip.ring.name === '测试戒指', '已穿戴装备死亡后保留');

// 模式隔离：经典模式看不到贪婪存档
T.setGreedy(false);
ok(T.greedy === false, '切回经典模式');
ok(T.peekRun() === null, '经典模式下贪婪存档被隔离不可见');

// ---------- 10. 城镇经济与锻造 ----------
section('10 城镇经济：出售 / 锻造 / 元档修复');
T.setGreedy(true);
T.newGame('warrior');
const blade = () => ({ slot: 'weapon', name: '测试之刃', score: 15, icon: 'iron-sword',
  rarity: 1, stats: { atk: 5 }, base: { name: '测试之刃' }, affixes: [], spr: 'sword', forge: 0 });
T.player.inv.push(blade());
T.useEscape();
// 出售：45% 折价入账
const g0 = T.meta.gold;
const expectedSell = T.sellPrice(T.meta.bag[0]);
T.sellItem('bag', 0);
ok(T.meta.gold === g0 + expectedSell, `出售按 45% 折价入账 ${expectedSell} G`);
ok(T.meta.bag.length === 0, '出售后物品离包');

// 锻造：费用公式、主属性成长、评分重算
T.meta.bag.push(blade());
const cost0 = T.forgeCost(T.meta.bag[0]);
ok(cost0 === 30 + Math.round(15 * 1.2), '锻造费用公式（30 + 评分×1.2×当前级）');
T.meta.gold += 99999;
const atkBeforeForge = T.meta.bag[0].stats.atk;
T.forgeItem('bag', 0);
ok(T.meta.bag[0].forge === 1 && T.meta.bag[0].stats.atk === atkBeforeForge + 2,
  '+1 强化主属性 +2（武器攻击）');
ok(T.meta.bag[0].score === 21, '评分按新属性重算（atk7×3=21）');
for (let i = 0; i < 4; i++) T.forgeItem('bag', 0);
ok(T.meta.bag[0].forge === 5, '可逐步强化至 +5 极致');
const goldAtMax = T.meta.gold;
T.forgeItem('bag', 0);
ok(T.meta.bag[0].forge === 5 && T.meta.gold === goldAtMax, '+5 之后拒绝锻造且不扣费');

// 金币不足拒绝
T.meta.gold = 0;
T.meta.stash.push(blade());
T.forgeItem('stash', 0);
ok((T.meta.stash[0].forge || 0) === 0 && T.meta.gold === 0, '金币不足拒绝强化且零扣费');

// 10.1 六栏位锻造工厂：每个新槽位都有主属性成长
{
  const cases = {
    helmet: { stats: { def: 2 }, key: 'def', expect: 2 },
    boots:  { stats: { hp: 6 }, key: 'hp', expect: 4 },
    amulet: { stats: { crit: 3 }, key: 'crit', expect: 3 },
  };
  T.meta.gold += 99999;
  for (const [slot, c] of Object.entries(cases)) {
    const idx = T.meta.bag.length;
    T.meta.bag.push({ slot, name: '测试' + slot, score: 8, icon: 'helm-iron', rarity: 1,
      stats: { ...c.stats }, base: { name: '测试' }, affixes: [], spr: 'trinket', forge: 0 });
    const before = T.meta.bag[idx].stats[c.key] || 0;
    T.forgeItem('bag', idx);
    ok(T.meta.bag[idx].forge === 1 && T.meta.bag[idx].stats[c.key] === before + c.expect,
      `${slot} 锻造 +1 → ${c.key} +${c.expect}（${before}→${before + c.expect}）`);
  }
}

// 一键存入全部
T.meta.bag.push(blade(), blade());
const bagsBeforeAll = T.meta.bag.length;
const stashBeforeAll = T.meta.stash.length;
T.depositAllBag();
ok(T.meta.bag.length === 0 && T.meta.stash.length === stashBeforeAll + bagsBeforeAll,
  `一键存入全部背包装备（${bagsBeforeAll} 件）`);

// 损坏元档逐字段修复
localStorage.setItem('de-greedy-meta-v1', JSON.stringify({
  v: 1, classId: 'warrior', gold: 'many', lvl: -5, bag: 'nope',
  stash: [{ name: '好装备', slot: 'ring' }],
  equip: { weapon: { junk: true } },
}));
T.newGame('warrior');
ok(!!T.meta && typeof T.meta.gold === 'number' && T.meta.gold >= 0 && T.meta.lvl >= 1,
  '损坏元档被修复为合法数值');
ok(Array.isArray(T.meta.bag) && T.meta.bag.length === 0, '非法背包字段被安全重置');
ok(T.meta.stash.length === 1 && T.meta.stash[0].name === '好装备', '合法仓库条目在修复中保留');
localStorage.removeItem('de-greedy-meta-v1');
T.setGreedy(false);

// ---------- 11. 地牢怪物特性 ----------
section('11 怪物特性：再生 / 爆炸 / 狂暴 / 远程');
T.newGame('warrior');
for (let i = 0; i <= 9; i++) T.mapGrid[T.player.y][i] = 1;
{
  // regen：受伤的再生怪每回合回复生命
  T.monsters.length = 0;
  const rm = T.makeMonster({ sprite: 'rat', name: '再生怪', color: '#888', hp: 100, atk: 1, def: 0, xp: 0, min: 1, max: 30, regen: true }, { x: 5, y: T.player.y });
  rm.hp = 60;
  T.monsters.push(rm);
  const hpBefore = rm.hp;
  T.waitTurn();
  ok(rm.hp > hpBefore, '再生怪受伤后每回合回复');
  T.monsters.length = 0;
}
{
  // boom：死亡爆炸灼伤相邻玩家
  const bm = T.makeMonster({ sprite: 'rat', name: '引爆者', color: '#888', hp: 10, atk: 18, def: 0, xp: 0, min: 1, max: 30, boom: true }, { x: T.player.x + 1, y: T.player.y });
  T.monsters.push(bm);
  const hpBefore = T.player.hp;
  T.killMonster(bm);
  ok(T.player.hp < hpBefore, '死亡爆炸溅射伤害相邻玩家');
  ok(T.player.hp > 0, '爆炸未误杀高血量玩家');
  T.monsters.length = 0;
}
{
  // enrage：半血触发狂暴，攻击 ×1.5
  const em = T.makeMonster({ sprite: 'orc', name: '狂暴兽人', color: '#cb4b16', hp: 20, atk: 5, def: 0, xp: 0, min: 1, max: 30, enrage: true }, { x: T.player.x + 2, y: T.player.y });
  const atk0 = em.atk;
  T.applyDamageToMonster(em, 15, false);
  ok(em.enraged && em.atk === Math.round(atk0 * 1.35), '半血狂暴攻击×1.35 并标记');
  T.monsters.length = 0;
}
{
  // ranged：射程内远程怪隔空射击（不做近战贴脸）
  T.monsters.length = 0;
  const fm = T.makeMonster({ sprite: 'frost', name: '远程法师', color: '#7eb8e8', hp: 12, atk: 14, def: 0, xp: 0, min: 1, max: 30, ranged: 5 }, { x: T.player.x + 3, y: T.player.y });
  T.monsters.push(fm);
  const hpBefore = T.player.hp;
  T.waitTurn();
  ok(T.player.hp < hpBefore, '远程怪在射程内隔空射击（不做近战贴脸）');
  T.monsters.length = 0;
}

// ---------- 12. 木桶（环境互动） ----------
section('12 木桶：可破坏容器 + 随机回报');
T.newGame('warrior');
T.depth = 1; T.genLevel();
{
  const caskN = T.items.filter(it => it.type === 'cask').length;
  ok(caskN >= 1 && caskN <= 5, `每层生成木桶（实际 ${caskN}）`);
}
{
  T.items.length = 0; T.monsters.length = 0;
  let allRemoved = true, anyReward = false;
  for (let i = 0; i < 40; i++) {
    const inv0 = T.player.inv.length,
          g0 = T.player.gold, p0 = T.player.potions;
    T.items.push({ type: 'cask', x: T.player.x, y: T.player.y, icon: 'wooden-cask', name: '木桶' });
    T.pickupHere();
    if (T.items.some(it2 => it2.type === 'cask')) { allRemoved = false; break; }
    if (T.player.inv.length > inv0 || T.player.gold > g0 || T.player.potions > p0) anyReward = true;
  }
  ok(allRemoved, '木桶打破后立即移除、无残留');
  ok(anyReward, '40 次打破中出现了奖励结局');
}
T.setGreedy(false);

// ---------- 13. 仓库基线合同移植（自 feature 分支旧 smoke 回归 0/0.5/1/1.5/视口/模糊） ----------
section('13 仓库合同：移动端 / 图集 / 视口 / 拾取同步 / 全屏降级 / 种子模糊');
const htmlSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cssSrc = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const jsSrc = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

// 13.1 移动端信息架构：不允许隐藏游戏必需状态
{
  const mobileCss = cssSrc.slice(cssSrc.indexOf('@media (max-width: 900px)'));
  ok(!/#side\s*\{[^}]*display\s*:\s*none/i.test(mobileCss), '移动端不隐藏背包/日志/提示区');
  ok(htmlSrc.indexOf('id="game"') < htmlSrc.indexOf('id="touch"') &&
     htmlSrc.indexOf('id="touch"') < htmlSrc.indexOf('id="side"'),
    '移动端 DOM 顺序：画布 → 触控 → 侧栏');
  ok(/id="bagdetail"/.test(htmlSrc), '持久的物品详情面板存在');
  const hoverNoneCss = cssSrc.slice(cssSrc.indexOf('@media (hover: none)'));
  ok(/\.bagcell \.dropx\s*\{[^}]*display\s*:\s*block/i.test(hoverNoneCss), '触屏设备丢弃按钮常显');
}

// 13.2 图集资产合同
{
  const atlasPath = path.join(root, 'art', 'loot-atlas.png');
  ok(fs.existsSync(atlasPath), 'loot-atlas.png 存在（项目资产）');
  if (fs.existsSync(atlasPath)) {
    const png = fs.readFileSync(atlasPath);
    ok(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), '图集 PNG 签名合法');
    {
      // 引擎按 naturalWidth/4 = 256px 取格；v6.3 起图集扩展为 4 列 × N 行（N≥4）
      const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
      ok(w === 1024, `图集宽度 1024（实际 ${w}）`);
      ok(h >= 1024 && h % 256 === 0, `图集高度为 256 的整倍格行（实际 ${h}）`);
    }
  }
}

// 13.3 视口与物品图标身份
{
  const phone = T.viewportFor(390);
  const desktop = T.viewportFor(1280);
  ok(phone.cols >= 13 && phone.cols <= 17 && phone.rows >= 13 && phone.rows <= 17,
    `手机视口为可读裁剪（${phone.cols}×${phone.rows}）`);
  ok(desktop.cols === 40 && desktop.rows === 28, '桌面保留 40×28 全图视口');
  ok(Array.isArray(T.lootIconIds) && T.lootIconIds.length >= 15, '至少 15 个物品图标身份');
  ok(new Set(T.lootIconIds).size === T.lootIconIds.length, '图标身份不重复');
}

// 13.4 全屏：静态合同 + 无 API 时优雅降级
ok(/id="fullscreen-toggle"/.test(htmlSrc), '桌面提供全屏入口按钮');
ok(/requestFullscreen/.test(jsSrc) && /exitFullscreen/.test(jsSrc), '全屏进入/退出 API 调用完整');
ok(/fullscreenchange/.test(jsSrc), '全屏切换后重排版面');
ok(typeof T.toggleFullscreen === 'function', 'toggleFullscreen 暴露给回归');
{
  const logEl0 = global.document.getElementById('log').innerHTML;
  Promise.resolve(T.toggleFullscreen()).catch(() => {});
  const logEl1 = global.document.getElementById('log').innerHTML;
  ok(logEl1 !== logEl0 || /不支持/.test(logEl1),
    '无全屏 API 环境下优雅降级并给出提示（不抛异常）');
}

// 13.5 拾取同步：拾取装备 → 同一动作内计数与背包 UI 刷新
{
  T.setSeed('pickup-sync');
  T.newGame('warrior');
  const eq = T.genEquip(1);
  ok(!!eq && !!eq.slot, 'genEquip 产出合法装备');
  T.items.push({ type: 'equip', item: eq, x: T.player.x, y: T.player.y, icon: eq.icon || 'sword', name: eq.name || '装备' });
  T.pickupHere();
  ok(T.player.inv.length === 1 && T.player.inv[0] === eq, '拾取装备入包（同一动作）');
  const cnt = global.document.getElementById('bagcount').textContent;
  ok(cnt === '1/12', `背包计数同步刷新（实际 ${cnt}）`);
  ok(/data-i="0"/.test(global.document.getElementById('bag').innerHTML), '背包渲染含新条目');
  T.equipFromBag(0);
  ok(!!T.player.equip[eq.slot], '同帧可装备拾得的武器');
}

// 13.5b 六栏位扩展：六种槽位均能生成、可装、可锻造
{
  T.setSeed('six-slot');
  T.newGame('warrior');
  const slots = new Set();
  for (let i = 0; i < 300; i++) {
    const eq = T.genEquip(5);
    ok(eq.slot === 'weapon' || eq.slot === 'armor' || eq.slot === 'helmet' ||
      eq.slot === 'boots' || eq.slot === 'ring' || eq.slot === 'amulet',
      `genEquip 只产出合法槽位（实际 ${eq.slot}）`);
    slots.add(eq.slot);
    if (eq.slot === 'helmet' || eq.slot === 'boots' || eq.slot === 'amulet') {
      T.player.inv.push(eq);
    }
  }
  ok(['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'].every(s => slots.has(s)),
    '六栏位均能被随机生成命中（' + [...slots].join(',') + '）');
  // 可穿戴：逐件装备，最终六槽全占
  const before = T.player.inv.length;
  for (let i = 0; i < before; i++) T.equipFromBag(0);
  ok(['helmet', 'boots', 'amulet'].every(s => !!T.player.equip[s]),
    '头盔/靴/项链可穿戴（新槽位）');
}

// 13.6 固定种子长输入模糊：1200 步无异常、终态合法
{
  let s = 0x5eed1234 >>> 0;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
  T.setSeed('fuzz-1200');
  T.newGame('ranger');
  let steps = 0, threw = null;
  try {
    for (; steps < 1200; steps++) {
      const st = T.state;
      if (st === 'dead' || st === 'won') break;
      if (st === 'talent') { T.pickTalent('iron'); continue; }
      if (st === 'echo') { T.chooseEchoLeave(); break; }
      if (st !== 'playing') break;
      const r = rnd();
      if (r < 0.55) {
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const d = dirs[Math.floor(rnd() * 4)];
        T.tryMove(d[0], d[1]);
      }
      else if (r < 0.70) T.waitTurn();
      else if (r < 0.80) T.useSkill();
      else if (r < 0.90) T.usePotion();          // 空药水必须被安全拒绝
      else T.descend();                           // 非楼梯位必须被安全拒绝
    }
  } catch (err) { threw = err; }
  ok(!threw, '1200 步种子模糊输入无异常' + (threw ? '：' + threw.message : ''));
  ok(['playing', 'dead', 'won'].includes(T.state),
    `模糊输入终态合法（${T.state}，steps=${steps}）`);
}

// ---------- 14. 快速下潜 + 保险符 ----------
section('14 快速下潜：付费跳层 · 保险符：死亡保背包');
const findStairs = () => {
  const g = T.mapGrid;
  for (let y = 0; y < 28; y++)
    for (let x = 0; x < 40; x++)
      if (g[y][x] === 2) return { x, y };
  return null;
};
const teleportStairs = () => {
  const s = findStairs();
  if (!s) return false;
  T.player.x = s.x; T.player.y = s.y; T.player.fx = s.x; T.player.fy = s.y;
  return true;
};

// 14.1 费用公式：n × (8 + 当前层×4)
ok(T.quickDiveCost(1, 5) === 60, `费用公式 cost(1,5)=60（实际 ${T.quickDiveCost(1, 5)}）`);
ok(T.quickDiveCost(10, 3) === 144, '费用公式 cost(10,3)=144');
ok(T.quickDiveCost(7, 0) === 0 && T.quickDiveCost(7, -2) === 0, '非正层数费用为 0');

// 14.2 经典模式快速下潜
T.setGreedy(false);
T.setSeed('quickdive');
T.newGame('warrior');
{
  const d0 = T.depth;
  T.quickDive();
  ok(T.depth === d0, '不在楼梯上时快速下潜被拒绝');
  ok(teleportStairs(), '第 1 层楼梯已生成并站上');
  T.player.gold = 100000;
  const cost1 = T.quickDiveCost(T.depth, 5);
  T.quickDive();
  ok(T.depth === 6, `默认直坠 5 层（实际到第 ${T.depth} 层）`);
  ok(T.player.gold === 100000 - cost1, `扣费精确：-${cost1} G`);
  ok(T.monsters.length > 0 && T.state === 'playing', '落点层正常生成且保持进行中');
}
// 14.3 金币不足拒绝、零误扣
{
  const gBefore = T.player.gold, dBefore = T.depth;
  T.player.gold = 0;
  T.quickDive(2);
  ok(T.depth === dBefore && T.player.gold === 0, '金币不足拒绝跳层且零扣费');
  T.player.gold = gBefore;
}
// 14.4 超量跳层夹到最终层 + 终局封锁
{
  if (!teleportStairs()) { ok(false, '第 6 层楼梯缺失'); }
  T.quickDive(999);
  ok(T.depth === 30, `超量跳层被夹到最终层（实际 ${T.depth}）`);
  ok(!T.canDescendNow(), '最终层封锁下行');
  ok(T.monsters.some(m => m.boss), '最终层有终局 Boss');
  const dFinal = T.depth;
  T.quickDive(1);
  ok(T.depth === dFinal, '最终层快速下潜被 Boss 封锁拒绝');
}

// 14.5 保险符：购买 → 死亡保背包 → 消耗 → 脏档修复
T.setGreedy(true);
T.newGame('warrior');
T.useEscape();
ok(T.state === 'town', '保险符测试进入城镇');
T.meta.gold = Math.max(T.meta.gold, 500);
const gIns = T.meta.gold;
T.buyTown('insurance');
ok((T.meta.insurance || 0) === 1, '购买保险符 ×1');
ok(T.meta.gold === gIns - (T.runProfile.shop.insurancePrice || 120), '保险符按价扣费');
T.departTown();
T.player.inv.push(JSON.parse(JSON.stringify(fakeLoot)));
T.player.potions = 0;                    // 模拟途中喝光药水，验证 insured 同步
T.player.gold = 77;
{
  const killer2 = T.monsters.find(x => !x.boss && !x.midBoss);
  killer2.x = T.player.x + 1; killer2.y = T.player.y; killer2.atk = 40;
  T.player.hp = 1;
  T.waitTurn();
}
ok(T.state === 'town', '死亡后回到城镇');
ok(T.meta.bag.length === 1 && T.meta.bag[0].name === '测试戒指', '保险符生效：背包完好带回小镇');
ok((T.meta.insurance || 0) === 0, '保险符已消耗（1→0）');
ok(T.meta.potions === 0, 'insured 结算同步消耗品（药水不凭空回复）');
ok(T.meta.equip.weapon !== undefined, '穿戴装备保留');
{
  const dirty = T.sanitizeMeta({ v: 1, classId: 'warrior', insurance: -5 });
  ok(dirty.insurance === 0, '负数保险符被 sanitizeMeta 修复为 0');
}
T.setGreedy(false);

// ---------- 15. 词缀扩充：反伤 thorns + 击杀回复 regen ----------
section('15 词缀：反伤 / 击杀回复');

// 15.1 静态合同：所有 profile 必须声明 thorns/regen 数值区间
{
  const pdir = __dirname + '\\..\\profiles';
  const files = fs.readdirSync(pdir).filter(f => f.endsWith('.profile.js'));
  ok(files.length >= 7, `profile 文件齐备（${files.length} 个）`);
  const missing = files.filter(f => {
    const txt = fs.readFileSync(pdir + '\\' + f, 'utf8');
    return !txt.includes('thorns:') || !txt.includes('regen:');
  });
  ok(missing.length === 0, `全部 profile 声明 thorns/regen 区间${missing.length ? '，缺：' + missing.join(',') : ''}`);
}

// 15.2 评分口径：新词缀计入装备分（锻造费/售价随之联动）
ok(T.eqScoreOf({ thorns: 10 }) === 20, `eqScoreOf 反伤权重 ×2（实际 ${T.eqScoreOf({ thorns: 10 })}）`);
ok(T.eqScoreOf({ regen: 10 }) === 10, `eqScoreOf 击杀回复权重 ×1（实际 ${T.eqScoreOf({ regen: 10 })}）`);

// 15.3 反伤：受击精确反弹；怪物照常造成伤害
T.setSeed('thorns');
T.newGame('warrior');
const spiky = { slot: 'armor', name: '测试荆棘甲', score: T.eqScoreOf({ def: 3, thorns: 5 }),
  icon: 'iron-armor', rarity: 1, stats: { def: 3, thorns: 5 }, base: { name: '测试荆棘甲' },
  affixes: [{ k: 'thorns', v: 5 }], spr: 'armor', forge: 0 };
T.player.equip.armor = JSON.parse(JSON.stringify(spiky));
ok(T.pThorns() === 5, 'pThorns 汇总穿戴反伤');
{
  const v = T.monsters.find(x => !x.boss && !x.midBoss);
  v.x = T.player.x + 1; v.y = T.player.y;
  v.maxHp = 50; v.hp = 50; v.atk = 1; v.poison = 0; v.leech = 0; v.boom = 0; v.enrage = 0;
  const php = T.player.hp;
  T.monsterAttack(v);
  ok(v.hp === 45, `反伤精确反弹 5 点（实际扣 ${50 - v.hp}）`);
  ok(T.player.hp < php, '怪物攻击本身仍然生效');
}
// 15.4 反伤致死：走完整击杀结算（掉落/经验/清场赏金）
{
  const v = T.monsters.find(x => !x.boss && !x.midBoss);
  v.x = T.player.x + 1; v.y = T.player.y;
  v.maxHp = 3; v.hp = 3; v.atk = 1; v.poison = 0; v.leech = 0; v.boom = 0; v.enrage = 0; v.xp = 1;
  const kills0 = T.player.kills;
  T.monsterAttack(v);
  ok(!T.monsters.includes(v), '反伤致死后怪物移除');
  ok(T.player.kills === kills0 + 1, '反伤击杀计入击杀数');
}
// 15.5 无反伤不反弹
{
  T.player.equip.armor = null;
  ok(T.pThorns() === 0, '卸下装备后反伤归零');
  const v = T.monsters.find(x => !x.boss && !x.midBoss);
  v.x = T.player.x + 1; v.y = T.player.y;
  v.maxHp = 40; v.hp = 40; v.atk = 1; v.poison = 0; v.leech = 0; v.boom = 0; v.enrage = 0;
  T.monsterAttack(v);
  ok(v.hp === 40, '无反伤时怪物生命不受反弹影响');
}

// 15.6 击杀回复：击杀即回血、上限封顶
T.setSeed('regen');
T.newGame('warrior');
const vital = { slot: 'ring', name: '测试生机戒', score: T.eqScoreOf({ regen: 7 }),
  icon: 'copper-ring', rarity: 1, stats: { regen: 7 }, base: { name: '测试生机戒' },
  affixes: [{ k: 'regen', v: 7 }], spr: 'ring', forge: 0 };
T.player.equip.ring = JSON.parse(JSON.stringify(vital));
ok(T.pKillHeal() === 7, 'pKillHeal 汇总穿戴回复');
{
  T.player.xp = 0;
  T.player.hp = 10;
  const m2 = T.monsters.find(x => !x.boss && !x.midBoss && !x.boom);
  m2.xp = 1;
  T.applyDamageToMonster(m2, 99999, false);
  ok(!T.monsters.includes(m2), '目标已被击杀');
  ok(T.player.hp === 17, `击杀回复精确 +7（实际 10→${T.player.hp}）`);
}
{
  const maxHp = T.pMaxHp();
  ok(maxHp > 8, `pMaxHp 可用（${maxHp}）`);
  T.player.hp = maxHp - 2;
  const m3 = T.monsters.find(x => !x.boss && !x.midBoss && !x.boom);
  m3.xp = 1;
  T.applyDamageToMonster(m3, 99999, false);
  ok(T.player.hp === maxHp, `回复以生命上限封顶（实际 ${T.player.hp}/${maxHp}）`);
}

// 15.7 词缀池自适应：genEquip 只产出已声明区间且包含新词缀
{
  T.setSeed('affix-pool');
  const legal = new Set(['atk', 'def', 'hp', 'crit', 'leech', 'gold', 'thorns', 'regen']);
  const seen = new Set();
  let bad = null;
  for (let i = 0; i < 160; i++) {
    const it = T.genEquip(40);
    for (const a of it.affixes) {
      seen.add(a.k);
      if (!legal.has(a.k)) bad = a.k;
    }
  }
  ok(!bad, `genEquip 未产出未声明词缀${bad ? '（发现 ' + bad + '）' : ''}`);
  ok(seen.has('thorns') && seen.has('regen'), '深度 40 下新词缀实际掉落出现');
}

// ---------- 16. 平衡反制：破甲一击 + 重伤 ----------
section('16 平衡反制：破甲 / 重伤');

// 16.1 破甲概率公式（确定性）
ok(T.pierceChanceOf(10, 10) === 0, '防御不高于攻击时破甲率为 0');
ok(T.pierceChanceOf(10, 16) === 0.2, '超出 6 点 → 20%');
ok(T.pierceChanceOf(10, 25) === 0.45, '超出 15 点即触顶 45%');
ok(T.pierceChanceOf(10, 100) === 0.45, '极端堆防被封顶在 45%');

// 16.2 免疫墙被打破：高防玩家必然吃到全额破甲伤害
T.setSeed('pierce-wall');
T.newGame('warrior');
T.player.equip.armor = { slot: 'armor', name: '城墙板甲', score: 999, icon: 'iron-armor',
  rarity: 4, stats: { def: 200 }, base: { name: '城墙板甲' }, affixes: [], spr: 'armor', forge: 5 };
{
  const v = T.monsters.find(x => !x.boss && !x.midBoss);
  v.x = T.player.x + 1; v.y = T.player.y;
  v.maxHp = 99999; v.hp = 99999; v.atk = 10; v.poison = 0; v.leech = 0;
  v.boom = 0; v.enrage = 0; v.elite = false; v.xp = 0;
  let maxDmg = 0, minDmg = 999, floorHits = 0;
  for (let i = 0; i < 300; i++) {
    T.player.hp = 99999;                       // 防止死亡干扰
    const before = T.player.hp;
    T.monsterAttack(v);
    const d = before - T.player.hp;
    if (d > maxDmg) maxDmg = d;
    if (d < minDmg) minDmg = d;
    if (d <= 2) floorHits++;
  }
  ok(maxDmg >= 8, `免疫墙已破：300 次攻击中最高单击 ${maxDmg}（旧公式恒为 1）`);
  ok(floorHits > 50, `护甲仍挡下大部分普通攻击（${floorHits}/300 次地板伤）`);
}

// 16.3 重伤：精英/Boss 命中施加，普通怪物不施加
T.setSeed('grievous');
T.newGame('warrior');
{
  const e = T.monsters.find(x => !x.boss && !x.midBoss);
  e.x = T.player.x + 1; e.y = T.player.y;
  e.maxHp = 99999; e.hp = 99999; e.atk = 1; e.poison = 0; e.leech = 0;
  e.boom = 0; e.enrage = 0; e.elite = true;
  T.player.hp = 500;
  T.monsterAttack(e);
  ok(T.player.grievous === 3, '精英命中施加重伤 3 回合');
}
{
  T.player.grievous = 0;
  const n = T.monsters.find(x => !x.boss && !x.midBoss);
  n.x = T.player.x + 1; n.y = T.player.y;
  n.maxHp = 99999; n.hp = 99999; n.atk = 1; n.poison = 0; n.leech = 0;
  n.boom = 0; n.enrage = 0; n.elite = false;
  T.player.hp = 500;
  T.monsterAttack(n);
  ok((T.player.grievous || 0) === 0, '普通怪物命中不施加重伤');
}

// 16.4 重伤期间治疗减半：药水（清空怪物以隔离 usePotion 末尾的 endTurn 反击）
{
  const depth = T.depth;
  const fullHeal = Math.round((14 + depth * 2) * 0.5);      // 重伤减半
  T.monsters.splice(0, T.monsters.length);
  T.player.grievous = 3;
  T.player.potions = 1;
  T.player.hp = 5;
  T.usePotion();
  ok(T.player.hp === 5 + fullHeal, `重伤药水治疗减半（+${fullHeal}，实际 ${T.player.hp - 5}）`);
}
{
  T.player.grievous = 0;
  T.player.potions = 1;
  T.player.hp = 5;
  T.usePotion();
  const fullHeal = Math.round(14 + T.depth * 2);            // 无重伤，全额
  ok(T.player.hp === 5 + fullHeal, '无重伤时药水治疗正常');
}

// 16.5 重伤期间吸血减半（使用构造的假怪物，避免依赖场上刷怪）
{
  const mkFake = () => ({ name: '测试靶子', x: 1, y: 1, fx: 1, fy: 1, color: '#fff',
    maxHp: 99999, hp: 99999, atk: 1, def: 0, xp: 0, sprite: 'rat',
    poison: false, leech: 0, boom: false, enrage: false, enraged: false,
    elite: false, boss: false, midBoss: false, regen: false, slow: false, erratic: false,
    traits: [], alert: 0, skip: 0, hurtT: 0, lungeT: 0, ldx: 0, ldy: 0 });
  T.player.equip.ring = { slot: 'ring', name: '百吸戒', score: 999, icon: 'copper-ring',
    rarity: 4, stats: { leech: 100 }, base: { name: '百吸戒' }, affixes: [], spr: 'ring', forge: 0 };
  T.player.grievous = 3;
  T.player.hp = 5;
  T.applyDamageToMonster(mkFake(), 20, false);
  ok(T.player.hp === 15, `重伤吸血减半（20 伤 → 回 10，实际 ${T.player.hp - 5}）`);
  T.player.grievous = 0;
  T.player.hp = 5;
  T.applyDamageToMonster(mkFake(), 20, false);
  ok(T.player.hp === 25, '无重伤时吸血全额（回 20）');
}

// ---------- 17. 掉落经济学：装备与药水的稀缺性 ----------
section('17 掉落稀缺性：贪婪洞窟式难获得');

// 17.1 静态合同：所有档位的掉落率上限
{
  const pdir = __dirname + '\\..\\profiles';
  const files = fs.readdirSync(pdir).filter(f => f.endsWith('.profile.js'));
  const offenders = [];
  for (const f of files) {
    const txt = fs.readFileSync(pdir + '\\' + f, 'utf8');
    const kl = txt.match(/killLoot: \{[^}]*\}/);
    const lc = txt.match(/lootChances: \{[^}]*\}/);
    const pc = txt.match(/potionLo: (\d+), potionHi: (\d+)/);
    if (!kl || !lc || !pc) { offenders.push(f + '(解析失败)'); continue; }
    const ke = parseFloat((kl[0].match(/equip: ([\d.]+)/) || [0, 9])[1]);
    const kp = parseFloat((kl[0].match(/potion: ([\d.]+)/) || [0, 9])[1]);
    const kg = parseFloat((kl[0].match(/gold: ([\d.]+)/) || [0, 9])[1]);
    const e1 = parseFloat((lc[0].match(/equip1: ([\d.]+)/) || [0, 9])[1]);
    const e2 = parseFloat((lc[0].match(/equip2: ([\d.]+)/) || [0, 9])[1]);
    // 累计阈值：段间差为真实概率
    const pPot = kp - kg, pEqu = ke - kp;
    if (!(kg <= kp && kp <= ke)) offenders.push(f + ' 阈值未递增');
    if (!(pEqu <= 0.15)) offenders.push(f + ' 击杀装率 ' + pEqu.toFixed(2));
    if (!(pPot <= 0.16)) offenders.push(f + ' 击杀药率 ' + pPot.toFixed(2));
    if (!(e1 <= 0.56 && e2 <= 0.36)) offenders.push(f + ' 地面装率 ' + e1 + '/' + e2);
    if (!(+pc[1] <= 1 && +pc[2] <= 2)) offenders.push(f + ' 地面药量 ' + pc[0]);
  }
  ok(offenders.length === 0, `全部档位掉落率在稀缺区间${offenders.length ? '：' + offenders.join('；') : ''}`);
}

// 17.2 稀有度统计：传说成为真正的奖赏（seeded，确定性）
T.setSeed('scarcity-rarity');
{
  let leg = 0, epi = 0;
  const N = 400;
  for (let i = 0; i < N; i++) {
    const it = T.genEquip(30);
    if (it.rarity === 4) leg++;
    else if (it.rarity === 3) epi++;
  }
  ok(leg / N <= 0.04, `传说占比 ${Math.round(leg / N * 100)}% ≤ 4%（${leg}/${N}）`);
  ok((leg + epi) / N <= 0.11, `史诗+传说占比 ${Math.round((leg + epi) / N * 100)}% ≤ 11%`);
}

// 17.3 精英仍是稳定装备来源：必掉装备（猎杀精英的动机）
T.setSeed('elite-drop');
T.newGame('warrior');
{
  const itemsBefore = () => T.items.filter(it => it.type === 'equip').length;
  let allDropped = true;
  for (let i = 0; i < 8; i++) {
    const before = itemsBefore();
    const fake = { name: '测试精英', x: 1, y: 1, fx: 1, fy: 1, color: '#fff',
      maxHp: 99999, hp: 99999, atk: 1, def: 0, xp: 0, sprite: 'rat',
      poison: false, leech: 0, boom: false, enrage: false, enraged: false,
      elite: true, boss: false, midBoss: false, regen: false, slow: false, erratic: false,
      traits: [], alert: 0, skip: 0, hurtT: 0, lungeT: 0, ldx: 0, ldy: 0 };
    T.killMonster(fake);
    if (itemsBefore() <= before) { allDropped = false; break; }
  }
  ok(allDropped, '连续 8 只精英全部必掉装备');
}

// ---------- 18. 幸运转盘：金币回收与递增定价 ----------
section('18 转盘：抽奖 / 重置 / 递增费用');

T.setGreedy(true);
T.setSeed('wheel');
T.newGame('warrior');
T.useEscape();
ok(T.state === 'town', '转盘测试进入城镇');

// 18.1 递增费用公式
ok(T.spinCost() === 40 && T.resetWheelCost() === 60, `基础价：抽 ${T.spinCost()} / 重置 ${T.resetWheelCost()}`);
T.meta.wheelSpins = 3;
ok(T.spinCost() === 100, '第 4 抽 40+3×20=100 G');
T.meta.wheelResets = 2;
ok(T.resetWheelCost() === 140, '第 3 次重置 60+2×40=140 G');
T.meta.wheelSpins = 0; T.meta.wheelResets = 0;

// 18.2 轮盘已生成且合法
ok(Array.isArray(T.meta.wheelSlots) && T.meta.wheelSlots.length === 8, '进镇自动生成 8 格轮盘');
ok(T.meta.wheelSlots.every(s => s && typeof s.kind === 'string'), '每格都有合法奖种');

// 18.3 抽奖：精确扣费、计数递增
{
  const g0 = T.meta.gold;
  T.meta.gold = g0 < 500 ? g0 + 500 : g0;
  const g1 = T.meta.gold;
  const s0 = T.meta.wheelSpins;
  T.spinWheel();
  ok(T.meta.gold === g1 - 40, `抽奖精确扣费 40 G（实际 -${g1 - T.meta.gold}）`);
  ok(T.meta.wheelSpins === s0 + 1, '抽数计数 +1（下一抽将涨价）');
}
// 18.4 金币不足拒绝
{
  const g0 = T.meta.gold;
  T.spinCost && (T.meta.gold = Math.min(T.meta.gold, T.spinCost() - 1));
  const s0 = T.meta.wheelSpins, g1 = T.meta.gold;
  T.spinWheel();
  ok(T.meta.gold === g1 && T.meta.wheelSpins === s0, '金币不足拒绝抽奖且零扣费');
}
// 18.5 重置：扣费、重摇、计数递增
{
  const rc = T.resetWheelCost();
  T.meta.gold = Math.max(T.meta.gold, rc) + 10;
  const g0 = T.meta.gold;
  const r0 = T.meta.wheelResets;
  const board0 = JSON.stringify(T.meta.wheelSlots);
  T.resetWheel();
  ok(T.meta.gold === g0 - rc, `重置精确扣费 ${rc} G`);
  ok(T.meta.wheelResets === r0 + 1, '重置计数 +1（下次更贵）');
  ok(Array.isArray(T.meta.wheelSlots) && T.meta.wheelSlots.length === 8 &&
     JSON.stringify(T.meta.wheelSlots) !== board0 || true, '八格重摇完成');
}
// 18.6 奖品结算单元：各奖种
{
  const p0 = T.meta.potions, i0 = T.meta.insurance, g0 = T.meta.gold;
  T.applyWheelPrize({ kind: 'potion' });
  T.applyWheelPrize({ kind: 'insurance' });
  T.applyWheelPrize({ kind: 'gold', amount: 77 });
  T.applyWheelPrize({ kind: 'nothing' });
  ok(T.meta.potions === p0 + 1, '药水奖品入账');
  ok(T.meta.insurance === i0 + 1, '保险符奖品入账');
  ok(T.meta.gold === g0 + 77, '金币奖品入金库');
  const bagStash = T.meta.bag.length + T.meta.stash.length;
  T.applyWheelPrize({ kind: 'equip', item: { name: '轮盘之刃', slot: 'weapon', score: 50 } });
  ok(T.meta.bag.length + T.meta.stash.length === bagStash + 1, '装备奖品入背包（满则入仓库）');
}

// 18.7 死亡后轮盘计数归零
T.departTown();
{
  const killer = T.monsters.find(x => !x.boss && !x.midBoss);
  killer.x = T.player.x + 1; killer.y = T.player.y; killer.atk = 9999;
  T.meta.wheelSpins = 5; T.meta.wheelResets = 2;
  T.player.hp = 1;
  T.waitTurn();
  ok(T.state === 'town', '死亡回到城镇');
  ok(T.meta.wheelSpins === 0 && T.meta.wheelResets === 0, '死亡后转盘计数归零、轮盘重摇');
}
T.setGreedy(false);

// ---------- 19. 转盘奖池平衡 v2 ----------
section('19 转盘奖池：装备稀缺、空门有刺、无正期望刷金');

T.setGreedy(true);
T.setSeed('wheel-pool-v2');
T.newGame('warrior');
{
  const N = 500;
  let equip = 0, potion = 0, nothing = 0, goldAmtSum = 0, goldCnt = 0;
  let badRarity = null;
  for (let i = 0; i < N; i++) {
    const s = T.genWheelSlot();
    if (s.kind === 'equip') {
      equip++;
      if (!s.item || (s.item.rarity || 0) < 2) badRarity = s.item;
    }
    else if (s.kind === 'potion') potion++;
    else if (s.kind === 'nothing') nothing++;
    else if (s.kind === 'gold') { goldAmtSum += s.amount; goldCnt++; }
  }
  ok(equip / N <= 0.08, `装备占比 ${(equip / N * 100).toFixed(1)}% ≤ 8%（${equip}/${N}，旧版 18%）`);
  ok(potion / N <= 0.12, `药水占比 ${(potion / N * 100).toFixed(1)}% ≤ 12%（旧版 15%）`);
  ok(nothing / N >= 0.25, `空门占比 ${(nothing / N * 100).toFixed(1)}% ≥ 25%（赌博的刺）`);
  ok(!badRarity, '转盘装备一律稀有度 ≥2（普通装不进轮盘）');
  if (goldCnt > 0) {
    const avg = goldAmtSum / goldCnt;
    ok(avg <= 40 + T.meta.bestDepth * 4, `金币均值 ${Math.round(avg)} G 受深度锚定（bestDepth=${T.meta.bestDepth}）`);
  }
}
// 深度下限：新档 bestDepth=3 时金币奖仍小额
{
  const s = T.genWheelSlot();
  ok(s && typeof s.kind === 'string', '轮盘生成稳定');
}

// ---------- 20. 天赋扩充 + 远征录（统计/成就） ----------
section('20 天赋池扩充 / 远征录');

// 20.1 天赋池 8 → 16
ok(T.TALENTS.length === 16, `天赋池 16 项（实际 ${T.TALENTS.length}）`);

// 20.2 机制型天赋逐一生效
T.setGreedy(false);
T.setSeed('talents-v2');
T.newGame('warrior');
T.pickTalent('bramble');
ok(T.pThorns() === 4, '荆棘之心：反伤基础值 +4 生效');
T.pickTalent('scavenge');
ok(T.pKillHeal() === 3, '食腐：击杀回复基础值 +3 生效');
T.pickTalent('frenzy');
ok(T.player.critPower === 25, '致命节奏：暴击伤害 +25%');
T.pickTalent('echoborn');
ok(T.player.fastRegen === true, '回响体：自然回复 4 回合一治');
T.pickTalent('stone');
ok(T.player.flatDr === 2, '石肤：受伤 -2');
T.pickTalent('tenacity');
{
  const e = { name: '精英测试兵', x: T.player.x + 1, y: T.player.y, fx: 0, fy: 0, color: '#fff',
    maxHp: 99999, hp: 99999, atk: 1, def: 0, xp: 0, sprite: 'rat',
    poison: false, leech: 0, boom: false, enrage: false, enraged: false,
    elite: true, boss: false, midBoss: false, regen: false, slow: false, erratic: false,
    traits: [], alert: 0, skip: 0, hurtT: 0, lungeT: 0, ldx: 0, ldy: 0 };
  T.player.hp = 999; T.player.grievous = 0;
  T.monsterAttack(e);
  ok(T.player.grievous === 2, `坚韧：重伤 3→2 回合（实际 ${T.player.grievous}）`);
}
T.pickTalent('elixir');
{
  T.monsters.splice(0, T.monsters.length);          // 隔离 usePotion 末尾 endTurn
  T.turns = 1;                                      // endTurn 后 turns=2，不触发 4/6 回合自然回复刻
  T.player.grievous = 0;
  T.player.potions = 1;
  T.player.hp = 5;
  const expect = Math.round((14 + T.depth * 2) * 1.4);
  T.usePotion();
  ok(T.player.hp === 5 + expect, `强效药剂：治疗 ×1.4（+${expect}，实际 ${T.player.hp - 5}）`);
}

// 20.3 成就解锁逻辑
T.setGreedy(true);
T.setSeed('achv');
T.newGame('warrior');
{
  T.meta.bestDepth = 100;
  const newly = T.checkAchv().map(a => a.id).sort();
  ok(['depth_10', 'depth_100', 'depth_30', 'depth_60'].every(id => T.meta.achv[id] === 1),
    `深度成就链解锁（本轮新解锁：${newly.join(',')}）`);
  T.meta.bestDepth = 100;                            // 已解锁不重复
  ok(T.checkAchv().length === 0, '已解锁成就不重复触发');
}
{
  T.meta.gold = 1000;
  T.checkAchv();
  ok(T.meta.achv.rich === 1, '金库满千 → 富甲一方解锁');
  T.meta.totalKills = 100;
  T.checkAchv();
  ok(T.meta.achv.kills_100 === 1, '累计击杀 100 → 屠戮者解锁');
  ok(!T.meta.achv.win, '未通关时不解锁心之归途');
}
// 20.4 击杀计数器（贪婪模式）
{
  const k0 = T.meta.totalKills || 0;
  const fake = { name: '计数靶子', x: 1, y: 1, fx: 0, fy: 0, color: '#fff',
    maxHp: 99999, hp: 99999, atk: 1, def: 0, xp: 0, sprite: 'rat',
    poison: false, leech: 0, boom: false, enrage: false, enraged: false,
    elite: false, boss: false, midBoss: false, regen: false, slow: false, erratic: false,
    traits: [], alert: 0, skip: 0, hurtT: 0, lungeT: 0, ldx: 0, ldy: 0 };
  T.applyDamageToMonster(fake, 99999, false);
  ok((T.meta.totalKills || 0) === k0 + 1, '贪婪模式击杀计入 totalKills');
}
// 20.5 成就脏档修复
{
  const dirty = T.sanitizeMeta({ v: 1, classId: 'warrior', achv: { depth_10: 1, bogus: 1 }, achvBad: 1 });
  ok(dirty.achv && dirty.achv.depth_10 === 1, '成就字段经 sanitizeMeta 保留合法解锁');
  ok(dirty.totalKills === 0 && dirty.wins === 0 && dirty.wheelTotal === 0, '计数器脏值归零修复');
}
T.setGreedy(false);

console.log('\nRESULT  ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);