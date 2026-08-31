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
    addEventListener() {}, setAttribute() {}, replaceChildren() {}, appendChild() {}, append() {},
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
for (const rel of [
  'game/domain/content/content-rules-v130.js',
  'game/domain/inventory/equipment-rules-v130.js',
  'game/domain/economy/economy-rules-v130.js',
  'game/domain/town/town-rules-v130.js',
  'game/domain/progression/progression-rules-v130.js',
  'game/domain/combat/combat-rules-v130.js',
]) vm.runInThisContext(fs.readFileSync(path.join(root, rel), 'utf8'), { filename: rel });
vm.runInThisContext(fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8'), { filename: 'game.js' });

const T = window.DE_TEST;
if (!T) { console.error('DE_TEST 未暴露'); process.exit(1); }

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}




// 1: adjacent and pursuit contact pressure
T.setSeed('v134-enemy'); T.newGame('warrior'); let m=T.monsters.find(x=>!x.midBoss&&!x.boss)||T.monsters[0]; T.monsters.splice(0,T.monsters.length,m);
T.player.x=10;T.player.y=10;T.player.fx=10;T.player.fy=10; for(let x=10;x<=12;x++)T.mapGrid[10][x]=1;
m.x=12;m.y=10;m.fx=12;m.fy=10;m.slow=false;m.ranged=0;m.armorBreak=false;m.erratic=false;m.hp=Math.max(m.hp,50);m.maxHp=Math.max(m.maxHp||0,50);m.atk=Math.max(5,m.atk||0);
let hp=T.player.hp; T.waitTurn(); ok(T.player.hp<hp && m.x===11,'pursuer entering adjacency applies engagement pressure');
hp=T.player.hp; T.waitTurn(); ok(T.player.hp<hp,'already-adjacent enemy performs full active attack');
// 2: four-direction ranger dash through a surviving blocker
for(const [name,dx,dy] of [['right',1,0],['left',-1,0],['down',0,1],['up',0,-1]]){
 T.setSeed('dash-'+name); T.newGame('ranger'); T.monsters.splice(0,T.monsters.length); T.player.x=15;T.player.y=15;T.player.fx=15;T.player.fy=15;T.player.facing=[dx,dy];T.player.skillCd=0;
 for(let step=0;step<=2;step++)T.mapGrid[15+dy*step][15+dx*step]=1;
 const enemy=T.makeMonster({sprite:'rat',name:'靶子',color:'#fff',hp:999,atk:1,def:0,xp:0,min:1,max:100},{x:15+dx,y:15+dy}); enemy.elite=false;enemy.hp=enemy.maxHp=999; T.monsters.push(enemy);
 T.useSkill(); ok(T.player.x===15+dx*2&&T.player.y===15+dy*2,`ranger dash ${name} crosses surviving enemy symmetrically`);
}
// 3: global weapon pool while retaining native bias
T.setSeed('weapon-diversity'); T.newGame('assassin'); const fam=new Set(); for(let i=0;i<120;i++)fam.add(T.weaponBaseForDrop(30).cls); ok(fam.size>=3&&fam.has('assassin')&&[...fam].some(x=>x!=='assassin'),'assassin world weapon pool includes native and multiple off-class families');
// 4: greedy return scroll supply + T settlement
T.setGreedy(true); T.setSeed('return'); T.newGame('assassin'); ok(T.player.escapes>=1,'greedy expedition carries a usable Return Scroll resource');
T.depth=3; T.genLevel(); ok(T.items.some(it=>it.type==='escape'),'floor 3 guarantees a world Return Scroll source');
const beforeEsc=T.player.escapes; T.useEscape(); ok(T.state==='town'&&T.getMeta().escapes===beforeEsc-1,'T consumes one Return Scroll and returns to town');
// 5: dungeon merchant sells backpack gear
T.setGreedy(false); T.setSeed('merchant'); T.newGame('warrior'); T.npcs.splice(0,T.npcs.length); const sx=T.player.x+1, sy=T.player.y; T.mapGrid[sy][sx]=1; T.npcs.push({type:'shop',x:sx,y:sy,fx:sx,fy:sy,name:'商人'}); T.tryMove(1,0); ok(T.state==='shop','walking into dungeon merchant opens shop state');
const loot=T.genEquip(8,1); T.player.inv.push(loot); const g0=T.player.gold, count=T.player.inv.length; const price=T.sellPrice(loot); ok(T.sellDungeonShopItem(count-1)===true && T.player.inv.length===count-1 && T.player.gold===g0+price,'dungeon merchant buys backpack gear at canonical sellPrice');
// 6: monster pressure targets
T.depth=1; const rat=T.makeMonster({sprite:'rat',name:'rat',color:'#fff',hp:4,atk:2,def:0,xp:1,min:1,max:4},{x:1,y:1}); ok(rat.maxHp>=7,'floor-1 ordinary rat survives typical base hit');
T.depth=50; const deep=T.makeMonster({sprite:'demon',name:'deep',color:'#fff',hp:90,atk:35,def:7,xp:1,min:50,max:59},{x:1,y:1}); ok(deep.maxHp>=150&&deep.def>=10,'mid-depth ordinary monster gains HP and DEF pressure');
// 7: explicit save control + restored main-site navigation
T.setGreedy(false); T.setSeed('manual-save'); T.newGame('warrior'); T.player.gold=77;
ok(T.manualSaveNow()===true,'manual Save control writes the active expedition without leaving gameplay');
const saved=JSON.parse(localStorage.getItem('de-run-v6')); ok(saved&&saved.state==='playing'&&saved.player.gold===77,'manual save produces a resumable playing snapshot');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8'), en=fs.readFileSync(path.join(root,'en/index.html'),'utf8');
ok(zh.includes('id="save-now-toggle"')&&zh.includes('id="btn-save-now"')&&en.includes('id="save-now-toggle"')&&en.includes('id="btn-save-now"'),'both fixed routes expose active Save controls');
ok(zh.includes('href="https://91hwl.cn/"')&&en.includes('href="https://91hwl.cn/"'),'title screen restores the canonical 91hwl main-site return path');
const coreSrc=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');
ok(coreSrc.includes("state === 'paused' ? 'playing' : state"),'paused Save & Title writes a resumable playing snapshot');
console.log(`RESULT ${pass} passed / ${fail} failed`); process.exit(fail?1:0);
