/* Dungeon Echo v1.9.4 — bounded ordinary-monster tactics regression contract. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } };
const gradient = { addColorStop() {} };
function ctx() { return new Proxy({}, { get(_t, k) { if (k === 'canvas') return { width:32, height:32 }; if (typeof k === 'string' && k.startsWith('create')) return () => gradient; if (k === 'measureText') return () => ({ width:10 }); return () => {}; }, set() { return true; } }); }
function elem(id) { return { id, innerHTML:'', textContent:'', disabled:false, title:'', style:{}, dataset:{}, hidden:false, getContext:() => ctx(), getBoundingClientRect:() => ({ left:0, top:0, width:1000, height:600 }), focus(){}, classList:{ add(){}, remove(){}, toggle(){}, contains:() => false }, addEventListener(){}, setAttribute(){}, removeAttribute(){}, replaceChildren(){}, appendChild(){}, append(){}, querySelector:() => elem(id+'-child') }; }
const elements = new Map(), el = id => { if (!elements.has(id)) elements.set(id, elem(id)); return elements.get(id); };
global.document = { getElementById:id => el(id), createElement:t => t === 'canvas' ? { width:0, height:0, getContext:() => ctx(), toDataURL:() => '' } : elem('created'), querySelector:() => null, querySelectorAll:() => [], addEventListener(){}, documentElement:{ dataset:{} } };
global.window = { innerWidth:1280, innerHeight:800, addEventListener(){}, dispatchEvent(){}, DE_PROFILES:{} };
global.localStorage = { _m:new Map(), getItem(k){ return this._m.has(k) ? this._m.get(k) : null; }, setItem(k,v){ this._m.set(k,String(v)); }, removeItem(k){ this._m.delete(k); } };
global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {}; global.Image = class { set src(_v) {} };
global.matchMedia = () => ({ matches:false }); global.performance = { now:() => Date.now() }; global.location = { search:'?profile=classic-100' };
vm.runInThisContext(fs.readFileSync(path.join(root,'profiles/classic-100.profile.js'),'utf8'), { filename:'classic-100' });
for (const rel of ['game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/inventory/set-rules-v180.js','game/domain/economy/economy-rules-v130.js','game/domain/town/town-rules-v130.js','game/domain/town/town-growth-rules-v180.js','game/domain/expedition/expedition-rules-v170.js','game/domain/progression/progression-rules-v130.js','game/domain/combat/combat-rules-v130.js'])
  vm.runInThisContext(fs.readFileSync(path.join(root,rel),'utf8'), { filename:rel });
vm.runInThisContext(fs.readFileSync(path.join(root,'game/core/game.js'),'utf8'), { filename:'game.js' });
const T = window.DE_TEST;
ok(!!T && typeof T.ordinaryMonsterAction === 'function', 'core exposes ordinary tactical AI to deterministic tests');
T.setGreedy(false); T.newGame('warrior'); T.depth = 1;
function arena() {
  const map = T.mapGrid;
  for (let y=0;y<map.length;y++) for (let x=0;x<map[y].length;x++) map[y][x] = (x===0||y===0||x===map[y].length-1||y===map.length-1) ? 0 : 1;
  T.monsters.splice(0,T.monsters.length); T.npcs.splice(0,T.npcs.length);
  T.player.hp = Math.max(500, T.pMaxHp()); T.player.poison = 0; T.player.grievous = 0;
}
function monster(x,y,extra={}) {
  const m = T.makeMonster({ sprite:'rat', name:'AI Probe', color:'#fff', hp:999, atk:20, def:0, xp:0, min:1, max:100, ...extra }, { x,y });
  m.x=x; m.y=y; m.fx=x; m.fy=y; m.armorBreak=false; m.slow=false; m.regen=false; T.monsters.push(m); return m;
}
arena(); T.player.x=5; T.player.y=8; T.mapGrid[6][5]=0;
let m = monster(5,5); m.lastSeenX=8; m.lastSeenY=5; m.alert=3; T.ordinaryMonsterAction(m);
ok(m.x===6 && m.y===5, 'broken-LOS monster pursues the remembered tile instead of hidden live player position');
ok(m.lastSeenX===8 && m.lastSeenY===5 && m.alert===2, 'last-seen memory remains bounded and counts down while LOS is broken');
arena(); T.player.x=8; T.player.y=5; m = monster(5,5,{ ranged:4 });
let hp0=T.player.hp; T.setSeed('ranged-fire'); T.ordinaryMonsterAction(m);
ok(T.player.hp < hp0 && m.x===5 && m.y===5, 'ranged enemy holds a valid firing lane and shoots without needless movement');
arena(); T.player.x=8; T.player.y=5; m = monster(7,5,{ ranged:4 }); hp0=T.player.hp; T.ordinaryMonsterAction(m);
ok(m.x===6 && m.y===5, 'ranged enemy repositions away from melee pressure when a retreat tile exists');
ok(T.player.hp===hp0, 'ranged reposition does not also fire in the same action');
arena(); T.player.x=8; T.player.y=5; T.mapGrid[5][6]=0; m = monster(5,5,{ ranged:4 });
m.lastSeenX=8; m.lastSeenY=5; m.alert=3; hp0=T.player.hp; T.ordinaryMonsterAction(m);
ok(T.player.hp===hp0, 'ranged enemy never shoots through a wall');
ok(!(m.x===6 && m.y===5) && T.mapGrid[m.y][m.x]!==0, 'remembered pursuit never steps through a wall');
arena(); T.player.x=8; T.player.y=5; m = monster(5,5); const blocker=monster(6,5); T.ordinaryMonsterAction(m);
ok(!(m.x===blocker.x && m.y===blocker.y), 'melee pursuit cannot occupy another monster tile');
ok(m.x===5 && (m.y===4 || m.y===6), 'crowding-aware pursuit chooses a shortest legal detour instead of backing away');
function erraticStep(seed) {
  arena(); T.player.x=10; T.player.y=7; const e=monster(5,5,{ erratic:true });
  T.setSeed(seed); const before=Math.abs(e.x-T.player.x)+Math.abs(e.y-T.player.y); T.ordinaryMonsterAction(e);
  return { x:e.x,y:e.y,before,after:Math.abs(e.x-T.player.x)+Math.abs(e.y-T.player.y) };
}
const e1=erraticStep('erratic-purpose'), e2=erraticStep('erratic-purpose');
ok(e1.x===e2.x && e1.y===e2.y, 'erratic engaged movement is deterministic under controlled RNG');
ok(e1.after<e1.before, 'erratic engaged movement remains purpose-driven instead of arbitrary wandering');
arena(); T.player.x=8; T.player.y=5; m=monster(6,5); hp0=T.player.hp; T.setSeed('one-action'); T.endTurn();
ok(m.x===7 && m.y===5, 'ordinary melee closes one tile toward the player');
ok(T.player.hp===hp0, 'ordinary melee cannot move and land a full attack in the same turn');
arena(); T.player.x=8; T.player.y=5;
const g=T.makeMonster({ sprite:'boss', name:'Guardian Probe', color:'#fff', hp:999, atk:20, def:0, xp:0, depth:15, midBoss:true }, { x:6,y:5 });
g.x=6; g.y=5; g.fx=6; g.fy=5; g.armorBreak=false; g.ranged=0; T.monsters.push(g); hp0=T.player.hp; T.setSeed('guardian-legacy'); T.endTurn();
ok(g.x===7 && g.y===5 && T.player.hp<hp0, 'guardian keeps the previously shipped move-plus-pressure cadence');
const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');
ok(core.includes('if (m.boss || m.midBoss) guardianLegacyAction(m);') && core.includes('else ordinaryMonsterAction(m);'), 'guardian AI is gated away from the new ordinary-monster tactics path');
console.log('\nRESULT  ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail ? 1 : 0);
