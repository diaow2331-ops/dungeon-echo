'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const core=fs.readFileSync(require('path').resolve(__dirname,'..','game/core/game.js'),'utf8');
assert(!core.includes("'de-town-wheel-state-v1'"),'retired wheel shadow sidecar must stay absent');
assert(!core.includes('meta.wheelSpins = 0; meta.wheelResets = 0; meta.wheelSlots = null;'),'death must not reset wheel lifecycle');
assert(core.includes("if (s && s.claimed) return ui('已领','Claimed');"),'claimed wheel sectors must be visible');
assert(core.includes('All prizes claimed'),'exhausted wheel UI contract missing');

const start=core.indexOf('const WHEEL_SLOTS = 8;');
const end=core.indexOf('// ---- 转盘视图',start);
assert(start>=0&&end>start,'wheel executable region must be discoverable');
const equip={name:'Test Blade',score:9};
const slots=[{kind:'equip',item:equip},...Array.from({length:7},()=>({kind:'nothing'}))];
const sb={
  console, Math, BAG_CAP:12,
  meta:{bestDepth:1,gold:1000,wheelSpins:0,wheelResets:0,wheelTotal:0,wheelSlots:slots,bag:[],stash:[],potions:0,scrolls:0,keys:0,escapes:0,insurance:0},
  state:'town',
  clamp:(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),
  ui:(zh,en)=>en, visibleItemName:it=>it.name,
  rng:()=>.99, ri:(a)=>a, genEquip:()=>({name:'Fresh',score:1}), rnd:()=>0,
  msg(){}, sfx:{chest(){},skill(){}}, startWheelSpin(){}, startWheelKick(){}, saveMeta(){}, renderTown(){},
};
vm.createContext(sb);
vm.runInContext(core.slice(start,end)+`\n;globalThis.__w={spinCost,resetWheelCost,wheelClaimedCount,consumeWheelSlot,spinWheel,resetWheel,ensureWheel};`,sb,{filename:'wheel-core.js'});
const W=sb.__w;
const tier1Spin=W.spinCost(), tier1Reset=W.resetWheelCost();
assert.equal(tier1Spin,60,'Tier 1 spin must include reviewed 20G tier surcharge');
assert.equal(tier1Reset,105,'Tier 1 reset must include reviewed 45G tier surcharge');
const gold0=sb.meta.gold;
assert.equal(W.spinWheel(),true); assert.equal(sb.meta.bag.length,1,'first equipment landing must award once');
assert.equal(sb.meta.wheelSlots[0].claimed,true); assert.equal(sb.meta.wheelSlots[0].kind,'nothing');
assert(!('item' in sb.meta.wheelSlots[0]),'claimed equipment payload must be consumed');
const gold1=sb.meta.gold;
assert.equal(W.spinWheel(),true); assert.equal(sb.meta.bag.length,1,'repeat claimed landing must not duplicate equipment');
assert(sb.meta.gold<gold1&&gold1<gold0,'repeat claimed landing remains a paid empty result');
sb.meta.wheelSlots.forEach(s=>{s.claimed=true;s.kind='nothing';delete s.item;delete s.amount;});
const exhaustedGold=sb.meta.gold;
assert.equal(W.spinWheel(),false); assert.equal(sb.meta.gold,exhaustedGold,'all-claimed board must block without charging');
sb.meta.bestDepth=100;
assert(W.spinCost()>tier1Spin&&W.resetWheelCost()>tier1Reset,'Tier 10 wheel costs must exceed Tier 1 for equal-or-higher counters');
const beforeReset=sb.meta.gold; const oldBoard=sb.meta.wheelSlots;
assert.equal(W.resetWheel(),true); assert.notEqual(sb.meta.wheelSlots,oldBoard,'paid reset must replace board');
assert.equal(sb.meta.wheelResets,1); assert(sb.meta.gold<beforeReset);
assert.equal(W.wheelClaimedCount(),0,'fresh paid board must have no claimed slots');
const persisted=JSON.parse(JSON.stringify(sb.meta)); assert(Array.isArray(persisted.wheelSlots)&&persisted.wheelResets===1,'wheel lifecycle must ride existing meta serialization');
console.log('wheel_lifecycle_core_v131=PASS');
