'use strict';
const fs=require('fs'),vm=require('vm');
const listeners={document:{},window:{}}, storage=new Map();
const log={html:'',insertAdjacentHTML(_p,s){this.html=s+this.html;}};
const hint={textContent:''}, townShop={innerHTML:'',dataset:{},querySelector(){return null;}};
global.localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v))};
global.document={
 getElementById(id){return id==='log'?log:id==='hint'?hint:id==='town-shop'?townShop:null;},
 addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);},
};
global.queueMicrotask=global.queueMicrotask||((fn)=>Promise.resolve().then(fn));
global.MutationObserver=undefined;
let state='playing', turns=30, persisted=0, escaped=0;
const player={x:3,y:3,hp:100,hpBase:100,gold:0,escapes:2};
const meta={bestDepth:20,runs:1,gold:0,potions:0,scrolls:0,escapes:2,keys:0,insurance:0};
const api={
 profileId:'classic-100', greedy:true,
 runProfile:{shop:{potionPrice:16,scrollPrice:28,keyPrice:22,healPrice:24,escapePrice:26,insurancePrice:120}},
 get state(){return state;}, get turns(){return turns;}, get depth(){return 20;},
 get player(){return player;}, get monsters(){return[];}, get npcs(){return[];}, get meta(){return meta;},
 pMaxHp(){return 100;}, getShopStock(){return[];},
 endTurn(){turns++;}, persistRun(){persisted++;},
 useEscape(){if(state!=='playing'||player.escapes<=0)return;player.escapes--;escaped++;state='town';},
 closeShop(){state='playing';},
};
global.window={DE_TEST:api,addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);}};
vm.runInThisContext(fs.readFileSync(require('path').join(__dirname,'..','commerce-system.js'),'utf8'),{filename:'commerce-system.js'});
const C=window.DE_COMMERCE;
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('PASS '+n)}else{fail++;console.log('FAIL '+n)}};
ok(C&&C.version==='v4','commerce v4 boots');
const t0=turns,e0=player.escapes;
ok(C.beginExtraction()===true,'extraction channel starts');
ok(turns===t0+1,'starting extraction costs exactly one turn');
ok(C.extractionReady()===true,'surviving channel makes extraction ready');
ok(player.escapes===e0,'channel start does not consume scroll before success');
ok(persisted>=1,'ready channel persists current run state');
ok(C.completeExtraction()===true,'ready extraction completes');
ok(state==='town'&&escaped===1,'completion uses normal return-to-town path');
ok(player.escapes===e0-1,'successful extraction consumes exactly one scroll');
state='playing';player.escapes=1;player.hp=100;
ok(C.beginExtraction()===true&&C.extractionReady(),'second channel can arm');
ok(C.clearExtraction('test')===true&&!C.extractionReady(),'channel can be interrupted without returning');
state='playing';player.escapes=1;
const evt={type:'keydown',key:'t',preventDefault(){this.p=true;},stopImmediatePropagation(){this.s=true;}};
for(const fn of listeners.document.keydown||[])fn(evt);
ok(evt.p&&evt.s&&C.extractionReady(),'T input is intercepted and arms channel');
const move={type:'keydown',key:'w',preventDefault(){},stopImmediatePropagation(){}};
for(const fn of listeners.document.keydown||[])fn(move);
ok(!C.extractionReady(),'movement input cancels a ready channel');
state='playing';player.escapes=1;player.hp=0;
ok(C.beginExtraction()===false&&!C.extractionReady(),'dead player cannot keep extraction channel');
console.log(`RESULT ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
