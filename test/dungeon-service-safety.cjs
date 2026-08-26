'use strict';
const fs = require('fs'), vm = require('vm');

const storage = new Map();
const listeners = { document: {}, window: {} };
const log = { html:'', insertAdjacentHTML(_p,s){ this.html=s+this.html; } };
const hint = { textContent:'' };
const townShop = { innerHTML:'', dataset:{}, querySelector(){ return null; } };
const shopList = { querySelector(){ return null; } };
const shopGold = { textContent:'' };
global.localStorage = {
  getItem:k=>storage.has(k)?storage.get(k):null,
  setItem:(k,v)=>storage.set(k,String(v)),
};
global.document = {
  getElementById(id) {
    return id==='town-shop'?townShop:id==='shop-list'?shopList:id==='shop-gold'?shopGold:
      id==='log'?log:id==='hint'?hint:null;
  },
  addEventListener(type, fn){ (listeners.document[type] ||= []).push(fn); },
};
global.queueMicrotask = global.queueMicrotask || (fn => Promise.resolve().then(fn));
global.MutationObserver = undefined;

let state='playing', depth=5, turns=20, persisted=0, closed=0;
const player = { x:3, y:3, hp:50, hpBase:100, gold:1000 };
const monsters = [];
const rest = { type:'rest', used:false, x:4, y:3 };
const npcs = [rest];
const stock = [
  {kind:'potion', name:'治疗药水', price:16},
  {kind:'heal', name:'包扎伤口（回满）', price:24},
];
const meta = {bestDepth:5,runs:1,gold:1000,potions:0,scrolls:0,escapes:0,keys:0,insurance:0};
const api = {
  profileId:'classic-100',
  runProfile:{shop:{potionPrice:16,scrollPrice:28,keyPrice:22,healPrice:24,escapePrice:26,insurancePrice:120}},
  get state(){ return state; },
  get depth(){ return depth; },
  get turns(){ return turns; },
  get player(){ return player; },
  get monsters(){ return monsters; },
  get npcs(){ return npcs; },
  get meta(){ return meta; },
  pMaxHp(){ return 100; },
  getShopStock(){ return stock; },
  closeShop(){ state='playing'; closed++; },
  endTurn(){ turns++; },
  persistRun(){ persisted++; },
};
global.window = {
  DE_TEST: api,
  addEventListener(type, fn){ (listeners.window[type] ||= []).push(fn); },
};

vm.runInThisContext(fs.readFileSync(require('path').join(__dirname,'..','commerce-system.js'),'utf8'), {filename:'commerce-system.js'});
const C = window.DE_COMMERCE;
let pass=0, fail=0;
const ok=(cond,name)=>{ if(cond){pass++; console.log('PASS '+name);} else {fail++; console.log('FAIL '+name);} };

ok(C && C.version==='v2', 'commerce v2 boots');
ok(C.dungeonTier(1)===1 && C.dungeonTier(96)===10, 'dungeon tier bands');
const shallow=C.dungeonHealPrice(5,50,100), deep=C.dungeonHealPrice(95,50,100);
ok(shallow>0 && deep>shallow*3, 'deep healing price scales materially');
ok(C.dungeonHealPrice(95,100,100)===0, 'full HP has no heal charge');

monsters.push({x:5,y:3,hp:10,alert:0});
ok(C.unsafeForTrade()===true, 'nearby living monster blocks trade');
state='shop'; closed=0;
ok(C.syncDungeonShop()==='blocked' && state==='playing' && closed===1, 'unsafe shop is immediately closed');
monsters.length=0;

state='shop'; depth=95; player.hp=50; player.gold=1000; stock[1].price=24;
ok(C.syncDungeonShop()==='synced' && stock[1].price===deep && stock[1].price>24, 'safe shop gets depth-scaled heal price');
player.hp=100;
ok(C.syncDungeonShop()==='full' && stock[1].name.includes('已满血'), 'full HP heal row is marked unavailable');

state='playing'; rest.used=true; const t0=turns;
ok(C.settleUsedRests([rest])===1 && turns===t0+1, 'rest use costs exactly one turn');
ok(C.settleUsedRests([rest])===0 && turns===t0+1, 'same rest never charges twice');
ok(persisted>=1, 'rest turn settlement persists run');

monsters.push({x:20,y:20,hp:10,alert:2});
ok(C.unsafeForTrade()===true, 'alerted pursuer blocks trade even at range');
monsters[0].alert=0;
ok(C.unsafeForTrade()===false, 'distant unalerted monster does not block trade');

console.log(`RESULT ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
