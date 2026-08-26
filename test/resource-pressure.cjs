'use strict';
const fs=require('fs'),vm=require('vm');
const listeners={document:{},window:{}};
global.localStorage={getItem(){return null;},setItem(){}};
global.document={
  getElementById(){return null;},
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);},
};
global.queueMicrotask=global.queueMicrotask||((fn)=>Promise.resolve().then(fn));
global.MutationObserver=undefined;

const floorRules={
  baseMonsterCount:5, monsterPerDepth:1, maxMonsters:24, minMonsters:5,
  eliteChance:0.14,
  killLoot:{gold:0.60,potion:0.74,equip:0.83},
  lootCounts:{potionLo:1,potionHi:2},
  minPotions:2,
};
const runProfile={
  floorRules,
  shop:{potionPrice:16,scrollPrice:28,keyPrice:22,healPrice:24,escapePrice:26,insurancePrice:120},
};
const api={
  profileId:'classic-100', greedy:true, runProfile,
  state:'title', depth:1, turns:0,
  player:null, monsters:[], npcs:[], meta:null,
};
global.window={DE_TEST:api,addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);}};
vm.runInThisContext(fs.readFileSync(require('path').join(__dirname,'..','commerce-system.js'),'utf8'),{filename:'commerce-system.js'});
const C=window.DE_COMMERCE;
let pass=0,fail=0;
const ok=(c,n)=>{if(c){pass++;console.log('PASS '+n)}else{fail++;console.log('FAIL '+n)}};
const near=(a,b,e=.000001)=>Math.abs(a-b)<=e;

ok(C&&C.version==='v4','commerce v4 boots');
ok(floorRules.minPotions===1,'floor potion minimum reduced to one');
ok(floorRules.lootCounts.potionLo===1&&floorRules.lootCounts.potionHi===1,'floor generation produces one baseline potion');
ok(near(floorRules.killLoot.potion-floorRules.killLoot.gold,.07),'normal-kill potion band is seven percent');
ok(floorRules.killLoot.gold<floorRules.killLoot.potion&&floorRules.killLoot.potion<floorRules.killLoot.equip,'kill-loot threshold ordering remains valid');
const early=C.expectedFloorPotionSupply(1), late=C.expectedFloorPotionSupply(20);
ok(early>1&&early<1.5,'early floor expected potion supply stays above one but below one-and-a-half');
ok(late>2&&late<2.5,'late floor expected potion supply is about 2.4 potions');
ok(late<4.9/1.9,'late baseline supply is roughly halved versus prior profile');
ok(floorRules.eliteChance===0.14&&floorRules.maxMonsters===24,'combat density and elite rate are untouched');
ok(C.resourcePressure.floorPotions===1&&near(C.resourcePressure.killPotionChance,.07),'resource-pressure contract is exposed for debug');
ok(C.applyResourcePressure()===false,'resource-pressure patch is idempotent');

console.log(`RESULT ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
