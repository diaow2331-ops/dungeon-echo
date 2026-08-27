/* Focused regression contract for the v1.3.0 locale event owner. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const listeners={window:{},document:{}};
let nativeConstructed=0,applyCalls=0,runtimeCalls=0,completeCalls=0;
class NativeMutationObserver{constructor(){nativeConstructed++;}observe(){}disconnect(){}takeRecords(){return[];}}

global.window=global;
global.MutationObserver=NativeMutationObserver;
global.document={
  hidden:false,body:{},
  querySelector(){return null;},
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);}
};
global.addEventListener=(type,fn)=>{(listeners.window[type] ||= []).push(fn);};

global.DE_I18N={apply(){applyCalls++;}};
global.__DE_LOCALE_V122={syncClassCards(){runtimeCalls++;},translateTree(){runtimeCalls++;}};
global.__DE_LOCALE_COMPLETENESS_V128={english:true,roots:[],translateTree(){completeCalls++;},enforceEquipmentLabels(){completeCalls++;}};

const src=fs.readFileSync(path.join(root,'locale-event-owner-v130.js'),'utf8');
vm.runInThisContext(src,{filename:'locale-event-owner-v130.js'});
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
const owner=global.__DE_LOCALE_EVENT_OWNER;
ok(owner&&owner.version==='v130'&&owner.intercepting,'locale event owner boots in interception phase');
const Virtual=global.MutationObserver;
const v=new Virtual(()=>{});v.observe({id:'root'},{childList:true,subtree:true});
ok(nativeConstructed===0&&owner.virtualObservers.includes(v),'legacy locale observer construction is virtualized, not native');
ok(v.targets.length===1,'virtual observer records requested roots without observing DOM');
owner.activate();
ok(global.MutationObserver===NativeMutationObserver&&owner.active&&!owner.intercepting,'native MutationObserver is restored on activation');
owner.sync();
ok(applyCalls>0&&runtimeCalls>=2&&completeCalls>0,'event owner resynchronizes both locale layers explicitly');
ok((listeners.window.keydown||[]).length&& (listeners.window.click||[]).length && (listeners.window.pageshow||[]).length,'real input/resume transitions own future locale sync');

const boot=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
const pFixed=boot.indexOf('fixed-locale-entry-v130.js'),pOwner=boot.indexOf('locale-event-owner-v130.js'),pRuntime=boot.indexOf('locale-runtime-v122.js'),pComplete=boot.indexOf('locale-completeness-v128.js');
ok(pFixed>0&&pFixed<pOwner&&pOwner<pRuntime&&pRuntime<pComplete,'bootstrap establishes fixed route identity before event-owned legacy locale pair');
ok(boot.includes("assetVersion = '133'")&&boot.includes("owner.activate()"),'bootstrap cache-busts generation 133 followers and activates owner after locale bootstrap');
const allow=fs.readFileSync(path.join(root,'ops/release/static-files.txt'),'utf8').split(/\r?\n/);
ok(allow.includes('fixed-locale-entry-v130.js')&&allow.includes('locale-event-owner-v130.js'),'release allowlist ships fixed route and locale event owners');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
