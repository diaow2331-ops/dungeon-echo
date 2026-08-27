/* Focused regression contract for the current progression guard owner. */
'use strict';
const fs=require('fs'), path=require('path'), vm=require('vm');
const root=process.env.DE_ROOT || path.resolve(__dirname,'..');
const storage=new Map();
const listeners={window:{},document:{}};
global.localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const hint={textContent:''};
global.document={
  readyState:'complete', head:{appendChild(){}},
  createElement(){return {style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},appendChild(){}};},
  querySelectorAll(){return[];},
  getElementById(id){return id==='hint'?hint:null;},
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);}
};
global.setInterval=()=>{throw new Error('progression owner must not install a polling timer')}; global.clearInterval=()=>{};
let turns=7, state='playing', depth=1;
const meta={classId:'warrior',bestDepth:0,lvl:80,xp:999,hpBase:1200,atkBase:300};
const player={lvl:80,xp:999,hpBase:1200,atkBase:300,hp:1200,equip:{weapon:null,armor:null,helmet:null,boots:null,ring:null,amulet:null},inv:[],talents:[],flatDr:0,grievous:0};
const api={
 profileId:'classic-100',
 CLASSES:{warrior:{hpBase:38,atkBase:4,skill:{cd:6}},ranger:{rangedRange:5},mage:{},assassin:{hpBase:24,atkBase:3,skill:{cd:6}}},
 TALENTS:[], get depth(){return depth;},set depth(v){depth=v;},get turns(){return turns;},get state(){return state;},get player(){return player;},get monsters(){return[];},get mapGrid(){return[[1]];},get classId(){return meta.classId;},get meta(){return meta;},
 descend(){depth++;},useSkill(){},monsterAttack(){},monsterRangedAttack(){},pMaxHp(){return player.hpBase;},endTurn(){turns++;},
};
global.window={DE_TEST:api,addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);}};
// Pre-seed a prior guard row so the test verifies future growth is clamped rather than grandfathered.
storage.set('de-progression-guard-v1',JSON.stringify({v:1,classes:{warrior:{legacyLvl:20,legacyHp:160,legacyAtk:28}}}));

vm.runInThisContext(fs.readFileSync(path.join(root,'progression-guard-system.js'),'utf8'),{filename:'progression-guard-system.js'});
const ownerBefore=window.__DE_PROGRESSION_COMMITMENT;

let pass=0,fail=0; const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
const P=window.__DE_PROGRESSION_COMMITMENT;
ok(P&&P.version==='p0-v3'&&P.owner==='progression-guard-system','progression guard boots as the sole production owner');
ok(P&&P.equipmentTurnOwner==='equipment-system','progression owner leaves equipment turn authority to equipment-system');
ok(window.__DE_XP_CAP_GUARD&&window.__DE_XP_CAP_GUARD.version==='p0-v2'&&window.__DE_XP_CAP_GUARD.owner==='progression-guard-system','XP parking belongs to the same progression owner');
ok(meta.lvl===50 && player.lvl===50,'future permanent level growth is capped at 50');
ok(meta.hpBase<=494 && player.hpBase<=494,'future base HP growth is bounded after overflow rollback');
ok(meta.atkBase<=77 && player.atkBase<=77,'future base ATK growth is bounded after overflow rollback');
ok(meta.xp===749 && player.xp===749,'capped saves cannot retain latent over-cap XP');

const grandfather=P.capsFor(90,{id:'warrior',row:{legacyLvl:90,legacyHp:900,legacyAtk:150}});
ok(grandfather.level===90 && grandfather.hp>=900 && grandfather.atk>=150,'existing stronger legacy saves form the compatibility floor');
const xpKeep=player.xp; const releaseXp=window.__DE_XP_CAP_GUARD.hold();
ok(typeof releaseXp==='function'&&player.xp<0,'cap guard parks XP before a capped player action');
player.xp+=2400; releaseXp();
ok(player.xp===xpKeep,'cap guard restores pre-action capped XP without transient level gain');

// Production loads progression-guard-system before gameplay-tuning. The legacy compatibility
// block in gameplay-tuning must yield without replacing the explicit owner.
global.setInterval=()=>0;
vm.runInThisContext(fs.readFileSync(path.join(root,'gameplay-tuning.js'),'utf8'),{filename:'gameplay-tuning.js'});
ok(window.__DE_PROGRESSION_COMMITMENT===ownerBefore,'legacy gameplay-tuning progression block yields to the explicit owner');

const bootstrap=fs.readFileSync(path.join(root,'production-bootstrap.js'),'utf8');
ok(!bootstrap.includes('installXpCapGuard')&&!bootstrap.includes('__DE_XP_CAP_GUARD'),'production bootstrap no longer owns XP progression');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const guardPos=index.indexOf('progression-guard-system.js?v=');
const tuningPos=index.indexOf('gameplay-tuning.js?v=');
ok(guardPos>0&&tuningPos>guardPos,'production loads progression guard before gameplay tuning');
const allow=fs.readFileSync(path.join(root,'ops/release/static-files.txt'),'utf8').split(/\r?\n/);
ok(allow.includes('progression-guard-system.js'),'release allowlist carries the progression owner');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
