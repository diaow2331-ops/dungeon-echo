/* Focused regression contract for the narrowed transitional locale event owner. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const listeners={window:{},document:{}};
const roots=new Map();
let nativeConstructed=0,applyCalls=0,classSyncCalls=0,runtimeTreeCalls=0,completeTreeCalls=0,equipCalls=0;
class NativeMutationObserver{constructor(){nativeConstructed++;}observe(){}disconnect(){}takeRecords(){return[];}}

function makeRoot(selector,visible=false){
  const state={visible};
  return {
    id:selector,state,hidden:false,
    classList:{contains(name){return name==='hidden'?!state.visible:false;}},
    getAttribute(name){return name==='aria-hidden'&&!state.visible?'true':null;}
  };
}
for(const selector of ['#title-screen','#class-screen','#pause-screen','#overlay','#shop-screen','#town-screen']) roots.set(selector,makeRoot(selector,selector==='#title-screen'));

global.window=global;
global.MutationObserver=NativeMutationObserver;
global.document={
  hidden:false,body:{id:'body'},
  querySelector(selector){return roots.get(selector)||null;},
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);}
};
global.addEventListener=(type,fn)=>{(listeners.window[type] ||= []).push(fn);};

global.DE_I18N={apply(){applyCalls++;}};
global.__DE_LOCALE_V122={syncClassCards(){classSyncCalls++;},translateTree(rootNode){assert.notStrictEqual(rootNode,document.body,'runtime must never translate the entire body');runtimeTreeCalls++;return 1;}};
global.__DE_LOCALE_COMPLETENESS_V128={english:true,translateTree(rootNode){assert.notStrictEqual(rootNode,document.body,'completeness must never translate the entire body');completeTreeCalls++;return 1;},enforceEquipmentLabels(){equipCalls++;}};

const src=fs.readFileSync(path.join(root,'locale-event-owner-v130.js'),'utf8');
vm.runInThisContext(src,{filename:'locale-event-owner-v130.js'});
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
const owner=global.__DE_LOCALE_EVENT_OWNER;
ok(owner&&owner.version==='v145'&&owner.intercepting,'locale event owner boots in interception phase');
const Virtual=global.MutationObserver;
const v=new Virtual(()=>{});v.observe({id:'root'},{childList:true,subtree:true});
ok(nativeConstructed===0&&owner.virtualObservers.includes(v),'legacy locale observer construction is virtualized, not native');
ok(v.targets.length===1,'virtual observer records requested roots without observing DOM');
ok(Array.isArray(owner.legacyRoots)&&owner.legacyRoots.length===6,'bridge exposes only six residual core roots');
for(const retired of ['#stats','#equipbar','#stage','#touch','#log','#bag','#bagdetail','#tooltip','#hint','#help','#talent-screen','#shrine-screen','#echo-screen','#achv-screen'])
  ok(!owner.legacyRoots.includes(retired),`source-localized root stays out of legacy bridge: ${retired}`);
owner.activate();
ok(global.MutationObserver===NativeMutationObserver&&owner.active&&!owner.intercepting,'native MutationObserver is restored on activation');
ok(applyCalls===1&&classSyncCalls===0&&equipCalls===0,'only the stable base owner is primed once; redundant class/equipment compatibility calls are retired');
let before={applyCalls,classSyncCalls,equipCalls,runtimeTreeCalls,completeTreeCalls};
owner.sync();
ok(applyCalls===before.applyCalls&&classSyncCalls===before.classSyncCalls&&equipCalls===before.equipCalls,'per-action sync does not rerun broad static localization');
ok(runtimeTreeCalls-before.runtimeTreeCalls===1&&completeTreeCalls-before.completeTreeCalls===1,'only the visible title residual root is translated');

roots.get('#title-screen').state.visible=false;
before={runtimeTreeCalls,completeTreeCalls};
owner.sync();
ok(runtimeTreeCalls===before.runtimeTreeCalls&&completeTreeCalls===before.completeTreeCalls,'active gameplay with no residual screen performs zero legacy tree scans');

roots.get('#town-screen').state.visible=true;
before={runtimeTreeCalls,completeTreeCalls};
owner.sync();
ok(runtimeTreeCalls-before.runtimeTreeCalls===1&&completeTreeCalls-before.completeTreeCalls===1,'town transition translates only the visible town residual root');
ok(owner.activeResidualRoots().length===1&&owner.activeResidualRoots()[0].id==='#town-screen','visible-root resolver exposes only the active residual screen');
ok(!src.includes('translateTree(document.body)'),'source contract forbids body-wide runtime translation');
ok((listeners.window.keydown||[]).length&&(listeners.window.click||[]).length&&(listeners.window.pageshow||[]).length,'real input/resume transitions own future residual sync');

const boot=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
const pFixed=boot.indexOf('fixed-locale-entry-v130.js'),pOwner=boot.indexOf('locale-event-owner-v130.js'),pRuntime=boot.indexOf('locale-runtime-v122.js'),pComplete=boot.indexOf('locale-completeness-v128.js');
ok(pFixed>0&&pFixed<pOwner&&pOwner<pRuntime&&pRuntime<pComplete,'bootstrap establishes fixed route identity before the transitional English bridge');
ok(boot.includes("assetVersion = '140'")&&boot.includes('owner.activate()'),'bootstrap remains generation 140 and activates the bridge after locale bootstrap');
ok(/const englishBridge = english \? \[/.test(boot),'legacy locale bridge remains English-only');
const allow=fs.readFileSync(path.join(root,'ops','release','static-files.txt'),'utf8').split(/\r?\n/);
ok(allow.includes('fixed-locale-entry-v130.js')&&allow.includes('locale-event-owner-v130.js'),'release allowlist still ships transitional fixed-route/event owners');
new Function(src);
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);