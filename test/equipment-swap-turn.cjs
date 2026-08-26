'use strict';
const fs=require('fs'),vm=require('vm');
const listeners={document:{},window:{}};
const log={html:'',insertAdjacentHTML(_p,s){this.html=s+this.html;}};
const hint={textContent:''};
global.document={
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);},
  getElementById(id){return id==='log'?log:id==='hint'?hint:null;},
};
global.queueMicrotask=global.queueMicrotask||((fn)=>Promise.resolve().then(fn));
global.setInterval=()=>0; global.clearInterval=()=>{};

let state='playing', turns=8, persisted=0, extractionClears=0;
const w1={name:'w1',slot:'weapon',stats:{atk:2},affixes:[]};
const w2={name:'w2',slot:'weapon',stats:{atk:3},affixes:[]};
const a1={name:'a1',slot:'armor',stats:{def:1},affixes:[]};
let player={equip:{weapon:w1,armor:a1,helmet:null,boots:null,ring:null,amulet:null},inv:[w2]};
const profile={
  affixRanges:{},weaponBases:[],armorBases:[],ringBases:[],rarities:[],shop:{equipMult:3},
};
const api={
  profileId:'classic-100',runProfile:profile,CLASSES:{warrior:{}},classId:'warrior',
  get state(){return state;},get depth(){return 20;},get player(){return player;},
  get items(){return[];},get meta(){return null;},getShopStock(){return[];},
  endTurn(){turns++;},persistRun(){persisted++;},
};
global.window={
  DE_TEST:api,
  DE_COMMERCE:{clearExtraction(){extractionClears++;return true;}},
  addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);},
};

vm.runInThisContext(fs.readFileSync(require('path').join(__dirname,'..','equipment-system.js'),'utf8'),{filename:'equipment-system.js'});
const G=window.__DE_EQUIPMENT_SWAP_TURN;
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('PASS '+n)}else{fail++;console.log('FAIL '+n)}};
ok(G&&G.version==='v1','gear-swap turn guard boots');
let before=G.snapshotEquip();
ok(before&&before.equip[0]===w1,'snapshot captures equipped object identity');
ok(G.settleEquipChange(before)===false&&turns===8,'unchanged loadout costs no turn');

before=G.snapshotEquip(); player.equip.weapon=w2;
ok(G.settleEquipChange(before)===true&&turns===9,'weapon swap costs exactly one turn');
ok(extractionClears===1,'gear swap interrupts ready extraction channel');
ok(persisted===1,'real gear swap persists run');

before=G.snapshotEquip(); player.inv.push({name:'junk'});
ok(G.settleEquipChange(before)===false&&turns===9,'inventory-only change remains free');

before=G.snapshotEquip(); player.equip.weapon=null;
ok(G.settleEquipChange(before)===true&&turns===10,'unequip costs exactly one turn');

before=G.snapshotEquip(); player.equip.weapon=w1; player.equip.armor=null;
ok(G.settleEquipChange(before)===true&&turns===11,'multiple slot mutations in one action cost one turn');

before=G.snapshotEquip(); player={equip:{weapon:w1,armor:null},inv:[]};
ok(G.settleEquipChange(before)===false&&turns===11,'player replacement is not mistaken for a gear action');

state='town';
ok(G.snapshotEquip()===null,'town equipment management does not arm turn cost');

state='playing'; before=G.snapshotEquip(); player.equip.weapon=w2; state='town';
ok(G.settleEquipChange(before)===false&&turns===11,'state transition before settlement is not charged');

console.log(`RESULT ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
