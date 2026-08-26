'use strict';
const fs=require('fs'),vm=require('vm');
const listeners={document:{},window:{}};
let state='playing';
const grid={innerHTML:'',querySelector(sel){return sel==='button[data-talent]'&&this.innerHTML.includes('data-talent=')?{}:null;}};
global.document={
  getElementById(id){return id==='talent-grid'?grid:null;},
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);},
};
global.queueMicrotask=global.queueMicrotask||((fn)=>Promise.resolve().then(fn));
global.setInterval=()=>0;global.clearInterval=()=>{};
const player={lvl:50,flatDr:0,potions:2,scrolls:1,equip:{}};
const normal={id:'edge',name:'锋刃',desc:'基础攻击 +2。',apply(p){p.atkBase=(p.atkBase||0)+2;}};
let eligible=[];
const api={
  profileId:'classic-100',TALENTS:[],get state(){return state;},get player(){return player;},get monsters(){return[];},get meta(){return null;},
  pDef(){return 0;},
};
global.window={
  DE_TEST:api,
  DE_TALENT_RANKS:{eligible:()=>eligible.slice()},
  addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);},
};
vm.runInThisContext(fs.readFileSync(require('path').join(__dirname,'..','defense-system.js'),'utf8'),{filename:'defense-system.js'});
const S=window.__DE_TALENT_SAFETY;
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('PASS '+n)}else{fail++;console.log('FAIL '+n)}};

ok(S&&S.version==='v1','talent safety boots');
ok(api.TALENTS.length===1&&api.TALENTS[0].id==='overflow_supply','empty eligible pool is preseeded before next level-up');
const p0=player.potions,s0=player.scrolls;api.TALENTS[0].apply(player);
ok(player.potions===p0+1&&player.scrolls===s0+1,'overflow reward is finite supplies, not permanent combat power');

eligible=[normal];S.syncPool();
ok(api.TALENTS.length===1&&api.TALENTS[0]===normal,'real eligible talents replace overflow fallback');

eligible=[];api.TALENTS.length=0;state='talent';grid.innerHTML='';
ok(S.repairTalentScreen()===true,'already blank talent screen is repaired immediately');
ok(grid.innerHTML.includes('overflow_supply'),'repaired screen exposes selectable fallback button');
ok(api.TALENTS.length===1&&api.TALENTS[0].id==='overflow_supply','core pickTalent can resolve repaired fallback id');
ok(S.repairTalentScreen()===false,'repair is idempotent once a talent button exists');

state='playing';eligible=[normal];S.sync();
ok(api.TALENTS[0]===normal,'leaving talent state immediately restores curated pool');
console.log(`RESULT ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
