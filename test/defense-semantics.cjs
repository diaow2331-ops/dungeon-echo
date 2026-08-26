'use strict';
const fs=require('fs'),vm=require('vm');
const listeners={document:{},window:{}};
global.document={
  getElementById(){return null;},
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);},
};
global.queueMicrotask=global.queueMicrotask||((fn)=>Promise.resolve().then(fn));
global.setInterval=()=>0;global.clearInterval=()=>{};

let cid='warrior';
const player={lvl:11,flatDr:3,equip:{armor:{stats:{def:8}}}};
const monster={atk:20,hp:20};
const monsters=[monster];
const warriorDr=()=>cid==='warrior'?1+Math.floor((player.lvl-1)/5):0;
const eqDef=()=>Object.values(player.equip).reduce((n,it)=>n+(it&&it.stats?Number(it.stats.def)||0:0),0);
const api={
  profileId:'classic-100',get classId(){return cid;},get player(){return player;},get monsters(){return monsters;},get meta(){return null;},
  pDef(){return eqDef()+(Number(player.flatDr)||0)+warriorDr();},
};
global.window={DE_TEST:api,addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);}};
vm.runInThisContext(fs.readFileSync(require('path').join(__dirname,'..','defense-system.js'),'utf8'),{filename:'defense-system.js'});
const D=window.__DE_DEFENSE_MODEL;
D.sync();

function monsterAttack(m,armorBreak=false){
  const raw=m.atk;
  return armorBreak?Math.max(1,raw):Math.max(1,raw-api.pDef());
}
function monsterRangedAttack(m,armorBreak=false){
  const raw=Math.round(m.atk*.8);
  const eff=Math.floor(api.pDef()/2);
  return armorBreak?Math.max(1,raw):Math.max(1,raw-eff);
}
function killMonster(m){return Math.max(2,Math.round(m.atk*.55)-Math.floor(api.pDef()/2));}

let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('PASS '+n)}else{fail++;console.log('FAIL '+n)}};
ok(D&&D.version==='v1','defense model boots');
ok(D.armor()===8,'pDef now exposes equipment armor only');
ok(D.fixedReduction()===6,'flat DR plus warrior Ironhide remain separate');
ok(monsterAttack(monster,false)===6,'melee uses full armor plus full fixed reduction');
ok(monsterRangedAttack(monster,false)===6,'ranged uses half armor plus full fixed reduction');
ok(monsterAttack(monster,true)===14,'armor break ignores armor but not fixed reduction');
ok(monsterRangedAttack(monster,true)===10,'ranged armor break still respects fixed reduction');
ok(killMonster(monster)===2,'death explosion uses half armor and full fixed reduction');
ok(JSON.parse(JSON.stringify(player)).flatDr===3,'save serialization preserves real flat DR');
ok(D.rawAttack(monster)===20,'monster serialized/raw attack value remains unchanged');

function fixedDrLegacy(){return (Number(player.flatDr)||0)+warriorDr();}
function specialHit(m,meleeScale){
  const fd=Number(player.flatDr)||0,ma=Number(m.atk),extra=fixedDrLegacy();
  player.flatDr=fd+extra;
  if(meleeScale)m.atk=Math.round(ma*1.25);
  try{return monsterRangedAttack(m,false);}finally{player.flatDr=fd;if(meleeScale)m.atk=ma;}
}
ok(specialHit(monster,false)===6,'legacy ranged special does not double fixed DR');
ok(specialHit(monster,true)===10,'legacy melee-scaled special stays correctly mitigated');
ok(player.flatDr===3&&D.rawAttack(monster)===20,'special bridge restores canonical stats');

cid='ranger';
ok(D.fixedReduction()===3,'non-warrior keeps only explicit flat DR');
ok(monsterAttack(monster,false)===9,'non-warrior melee semantics remain correct');
ok(monsterRangedAttack(monster,false)===9,'non-warrior ranged semantics remain correct');
ok(monsterAttack(monster,true)===17,'non-warrior armor break preserves explicit flat DR');

console.log(`RESULT ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
