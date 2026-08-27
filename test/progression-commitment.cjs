/* Focused regression contract for the current v1.2.6 progression commitment. */
'use strict';
const fs=require('fs'), path=require('path'), vm=require('vm');
const root=process.env.DE_ROOT || path.resolve(__dirname,'..');
const storage=new Map();
const listeners={window:{},document:{}};
global.localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const hint={textContent:''};
global.document={
  readyState:'loading', head:{appendChild(){}},
  createElement(){return {style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},appendChild(){}};},
  querySelectorAll(){return[];},
  getElementById(id){return id==='hint'?hint:null;},
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);}
};
global.setInterval=()=>0; global.clearInterval=()=>{};
let turns=7, state='playing', depth=1;
const meta={classId:'warrior',bestDepth:0,lvl:80,xp:999,hpBase:1200,atkBase:300};
const item={name:'试验剑',forge:0,score:10,originDepth:1,stats:{atk:2}};
const player={lvl:80,xp:999,hpBase:1200,atkBase:300,hp:1200,equip:{weapon:null,armor:null,helmet:null,boots:null,ring:null,amulet:null},inv:[item],talents:[],flatDr:0,grievous:0};
let endTurns=0;
const api={
 profileId:'classic-100',
 CLASSES:{warrior:{hpBase:38,atkBase:4,skill:{cd:6}},ranger:{rangedRange:5},mage:{},assassin:{hpBase:24,atkBase:3,skill:{cd:6}}},
 TALENTS:[], get depth(){return depth;},set depth(v){depth=v;},get turns(){return turns;},get state(){return state;},get player(){return player;},get monsters(){return[];},get mapGrid(){return[[1]];},get classId(){return meta.classId;},get meta(){return meta;},
 descend(){depth++;},useSkill(){},monsterAttack(){},monsterRangedAttack(){},pMaxHp(){return player.hpBase;},
 endTurn(){endTurns++;turns++;},
};
global.window={DE_TEST:api,addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);}};
global.location={href:'http://localhost/?profile=classic-30',search:'?profile=classic-30'};
global.history={replaceState(_s,_t,href){const u=new URL(href);location.href=u.href;location.search=u.search;}};
// Pre-seed a prior guard row so the test can verify new future growth is clamped, not grandfathered.
storage.set('de-progression-guard-v1',JSON.stringify({v:1,classes:{warrior:{legacyLvl:20,legacyHp:160,legacyAtk:28}}}));
vm.runInThisContext(fs.readFileSync(path.join(root,'production-bootstrap.js'),'utf8'),{filename:'production-bootstrap.js'});
vm.runInThisContext(fs.readFileSync(path.join(root,'gameplay-tuning.js'),'utf8'),{filename:'gameplay-tuning.js'});
for(const fn of (listeners.window.DOMContentLoaded||[])) fn();
let pass=0,fail=0; const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
const P=window.__DE_PROGRESSION_COMMITMENT;
ok(P&&P.version==='p0-v2','progression commitment boots current contract');
ok(P&&P.equipmentTurnOwner==='gameplay-tuning-fallback','isolated progression harness declares its equipment fallback owner');
ok(window.__DE_XP_CAP_GUARD&&window.__DE_XP_CAP_GUARD.version==='p0-v1','event-time XP cap guard boots after production scripts');
ok(meta.lvl===50 && player.lvl===50,'future permanent level growth is capped at 50');
ok(meta.hpBase<=494 && player.hpBase<=494,'future base HP growth is bounded after overflow rollback');
ok(meta.atkBase<=77 && player.atkBase<=77,'future base ATK growth is bounded after overflow rollback');
const grandfather=P.capsFor(90,{id:'warrior',row:{legacyLvl:90,legacyHp:900,legacyAtk:150}});
ok(grandfather.level===90 && grandfather.hp>=900 && grandfather.atk>=150,'existing stronger legacy saves form the compatibility floor');
const xpKeep=player.xp; const releaseXp=window.__DE_XP_CAP_GUARD.hold();
ok(typeof releaseXp==='function'&&player.xp<0,'cap guard parks XP before a capped player action');
player.xp+=2400; releaseXp();
ok(player.xp===xpKeep,'cap guard restores pre-action capped XP without transient level gain');

(async()=>{
 const click=(listeners.window.click||[]).slice(-1)[0];
 const target={closest(sel){return sel.includes('#bag [data-i]')?this:null;}};
 const before=P.loadoutSig();
 click({target});
 // Simulate the already-registered core click handler equipping the selected bag item.
 player.equip.weapon=item; player.inv=[];
 await new Promise(r=>queueMicrotask(r));
 ok(P.loadoutSig()!==before,'loadout signature detects real equipment mutation');
 ok(endTurns===1 && turns===8,'in-dungeon equipment mutation consumes exactly one turn');
 ok(player.grievous===0,'synthetic anti-regen flag does not persist after equipment turn');
 console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
 process.exit(fail?1:0);
})();
