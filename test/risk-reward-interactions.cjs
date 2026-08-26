'use strict';
const fs=require('fs'), vm=require('vm');
const listeners={document:{},window:{}};
const storage=new Map();
const log={html:'',insertAdjacentHTML(_p,s){this.html=s+this.html;}};
const hint={textContent:''}, shrineCopy={textContent:''}, shrineOk={textContent:''};
global.localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v))};
global.document={
 readyState:'complete',head:{appendChild(){}},
 createElement(){return {style:{}};},
 querySelectorAll(){return[];},
 addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);},
 getElementById(id){return id==='log'?log:id==='hint'?hint:id==='shrine-copy'?shrineCopy:id==='btn-shrine-ok'?shrineOk:null;}
};
global.queueMicrotask=global.queueMicrotask||((fn)=>Promise.resolve().then(fn));
global.setInterval=()=>0;global.clearInterval=()=>{};
let state='playing', turns=9, depth=20, persisted=0, spawnedAt=0;
const map=Array.from({length:7},()=>Array(7).fill(1));
const shrine={type:'shrine',used:false,x:3,y:3,fx:3,fy:3};
const cask={type:'cask',x:2,y:2};
const npcs=[shrine];
const items=[cask];
const monsters=[];
const player={x:3,y:2,hp:100,hpBase:100,atkBase:10,potions:0,poison:0,grievous:0,gold:0,inv:[]};
const api={
 profileId:'classic-100', get state(){return state;}, get turns(){return turns;}, get depth(){return depth;}, get seed(){return 'risk-test';},
 get player(){return player;}, get npcs(){return npcs;}, get items(){return items;}, get monsters(){return monsters;}, get mapGrid(){return map;}, get meta(){return null;},
 pMaxHp(){return 100;},
 genEquip(_d,min){return {name:`祭品R${min}`,rarity:min,slot:'weapon',stats:{atk:3}};},
 monsterPoolFor(){return [{name:'试验怪',hp:10,atk:3,def:0,xp:5,traits:[]}];},
 pickSpawn(){spawnedAt++; return {x:1+spawnedAt,y:5};},
 makeMonster(base,pos){return {...base,...pos,fx:pos.x,fy:pos.y,maxHp:base.hp,hp:base.hp,atkOrigin:base.atk,elite:false};},
 endTurn(){turns++;},persistRun(){persisted++;},closeShrine(){state='playing';},
 tryMove(){},useSkill(){},pickupHere(){},
};
global.window={DE_TEST:api,addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);}};
vm.runInThisContext(fs.readFileSync(require('path').join(__dirname,'..','production-bootstrap.js'),'utf8'),{filename:'production-bootstrap.js'});
const R=window.__DE_RISK_REWARD_INTERACTIONS;
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
ok(R&&R.version==='p0-v1','risk-reward bridge boots');
ok(R.shrineOutcomeFor(shrine,.10)==='mending','shrine healing band');
ok(R.shrineOutcomeFor(shrine,.30)==='blood-offering','shrine blood-offering band');
ok(R.shrineOutcomeFor(shrine,.60)==='greed-contract','shrine greed-contract band');
ok(R.shrineOutcomeFor(shrine,.80)==='guardian-trial','shrine guardian-trial band');
ok(R.shrineOutcomeFor(shrine,.95)==='curse','shrine curse band');
const t0=turns, atk0=player.atkBase;
const outcome=R.resolveShrine(shrine,.30);
ok(outcome==='blood-offering','blood-offering resolves');
ok(!npcs.includes(shrine),'consumed shrine leaves collision layer');
ok(player.hp===82,'blood-offering pays 18% max-HP cost');
ok(player.inv.length===1&&player.inv[0].rarity===2,'blood-offering grants bounded rare+ equipment');
ok(turns===t0+1,'shrine acceptance costs exactly one turn');
ok(player.hpBase===100,'shrine no longer increases permanent base HP');
ok(player.atkBase===atk0,'shrine no longer increases permanent base ATK');
const m0=monsters.length;
const risk1=R.resolveCaskRisk(cask,.10);
ok(risk1==='ambush'&&monsters.length===m0+1,'cask can produce a real ambush');
ok(R.resolveCaskRisk(cask,.10)==='none'&&monsters.length===m0+1,'same cask risk never resolves twice');
const cask2={type:'cask',x:4,y:2}; items.push(cask2);
player.poison=0;player.grievous=0;
ok(R.resolveCaskRisk(cask2,.25)==='contamination','cask can contaminate player');
ok(player.poison>=3&&player.grievous>=2,'contamination has real resource pressure');
const cask3={type:'cask',x:5,y:2}; items.push(cask3);
ok(R.resolveCaskRisk(cask3,.50)==='none','most casks preserve ordinary reward-only resolution');
ok(persisted>=3,'meaningful risk state is persisted');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
