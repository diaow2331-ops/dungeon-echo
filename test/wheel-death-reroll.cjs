'use strict';
const fs=require('fs'),vm=require('vm');
const storage=new Map();
const listeners={document:{},window:{}};
global.localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v))};
global.document={
  documentElement:{dataset:{deLocale:'zh-CN'}},
  hidden:false,
  getElementById(){return null;},
  querySelector(){return null;},
  createElement(){return {style:{},dataset:{}};},
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);},
  head:{appendChild(){}},
};
global.MutationObserver=undefined;

const board=(prefix)=>Array.from({length:8},(_,i)=>({kind:i===0?'gold':'nothing',amount:i===0?10:undefined,label:`${prefix}${i}`}));
const meta={
  classId:'warrior',bestDepth:20,gold:500,
  wheelSlots:board('A'),wheelSpins:2,wheelResets:1,wheelTotal:7,
};
const api={
  profileId:'classic-100',
  get state(){return 'town';}, get meta(){return meta;},
  spinCost(){return 40;}, resetWheelCost(){return 60;},
  departTown(){}, descend(){},
};
global.window={DE_TEST:api,addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);}};
const src=fs.readFileSync(require('path').join(__dirname,'..','town-system.js'),'utf8');
vm.runInThisContext(src,{filename:'town-system.js'});
const E=window.DE_TOWN_ECONOMY;
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('PASS '+n)}else{fail++;console.log('FAIL '+n)}};
const sig=()=>JSON.stringify(meta.wheelSlots);

ok(E&&E.version==='v5'&&E.owner==='town-system','town economy v5 boots with explicit owner');
ok(!/setInterval\s*\(/.test(src),'town system has no polling render loop');
ok(!/MutationObserver/.test(src),'town system has no DOM observer');
ok(/addEventListener\('keydown',\s*scheduleRender,\s*false\)/.test(src),'town lifecycle follows real key transitions');
ok(src.includes('Conquered Checkpoints')&&src.includes('All prizes claimed'),'town dynamic policy copy is bilingual at render source');
ok(src.includes('deCheckpointSig'),'checkpoint DOM is signature-guarded against redundant rewrites');
ok(E.locale==='zh-CN','fixed route identity is exposed by town owner');
ok(E.snapshotWheel()===true,'initial wheel snapshot saves');
const original=sig();
let shadow=E.wheelShadowRow();
ok(shadow&&shadow.spins===2&&shadow.resets===1,'snapshot keeps spin/reset counters');

meta.wheelSlots=board('DEATH'); meta.wheelSpins=0; meta.wheelResets=0;
ok(E.reconcileWheelShadow()==='restored','unexpected death reroll is detected');
ok(sig()===original,'death-generated board is replaced with prior board');
ok(meta.wheelSpins===2&&meta.wheelResets===1,'death cannot reset wheel action counters');

meta.wheelSlots=board('PAID'); meta.wheelSpins=0; meta.wheelResets=2;
ok(E.snapshotWheel()===true,'paid reset result can become new legal snapshot');
const paid=sig();
ok(E.reconcileWheelShadow()==='stable','legal reset board remains stable');
ok(sig()===paid&&paid!==original,'paid reset board is preserved instead of rolled back');

meta.wheelSlots[0].claimed=true; meta.wheelSlots[0].kind='nothing'; meta.wheelSpins=1;
ok(E.snapshotWheel()===true,'claimed-slot state can be snapshotted');
meta.wheelSlots=board('DEATH2'); meta.wheelSpins=0; meta.wheelResets=0;
ok(E.reconcileWheelShadow()==='restored','later death still restores claimed board state');
ok(meta.wheelSlots[0].claimed===true&&meta.wheelSlots[0].kind==='nothing','claimed prize cannot be resurrected by death reroll');

console.log(`RESULT ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);