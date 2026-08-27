'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'..','world-loot-polish-v122.js'),'utf8');
assert(!/requestAnimationFrame\(frame\);\s*window\.__DE_WORLD_LOOT_V122/.test(source),'legacy unconditional tail RAF must stay removed');
assert(source.includes("api.state!=='playing'"),'loot overlay loop must gate on active playing state');
assert(source.includes("window.addEventListener('pagehide',()=>stop(true))"),'pagehide must stop the visual loop');

const listeners={document:{},window:{}};
let state='title',nextId=1,rafCalls=0,cancelCalls=0;
const raf=new Map();
const ctx={
  clearRect(){},save(){},restore(){},beginPath(){},ellipse(){},fill(){},createRadialGradient(){return{addColorStop(){}}},fillRect(){},stroke(){},moveTo(){},lineTo(){},closePath(){},
  set globalAlpha(v){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},
};
const game={width:1280,height:896,getContext(){return ctx;}};
const stage={appendChild(){}};
const overlay={id:'',style:{},width:0,height:0,setAttribute(){},getContext(){return ctx;}};
global.document={
  hidden:false,
  getElementById(id){return id==='stage'?stage:id==='game'?game:null;},
  createElement(tag){assert.equal(tag,'canvas');return overlay;},
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);},
};
global.window={
  DE_TEST:{get state(){return state;},mapGrid:[[1]],player:{x:0,y:0},items:[]},
  addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);},
};
global.matchMedia=()=>({matches:false});
global.requestAnimationFrame=fn=>{const id=nextId++;raf.set(id,fn);rafCalls++;return id;};
global.cancelAnimationFrame=id=>{raf.delete(id);cancelCalls++;};
global.performance={now:()=>100};
global.queueMicrotask=fn=>fn();

vm.runInThisContext(source,{filename:'world-loot-polish-v122.js'});
const W=window.__DE_WORLD_LOOT_V122;
assert(W&&W.version==='v3','world-loot owner v3 must boot');
assert.equal(W.running,false,'title screen must own no RAF loop');
assert.equal(rafCalls,0,'title boot must schedule no animation frame');

state='playing';
assert.equal(W.start(),true,'playing state starts the overlay loop');
assert.equal(W.running,true);
assert.equal(rafCalls,1);
let id=[...raf.keys()][0],fn=raf.get(id);raf.delete(id);fn(100);
assert.equal(W.running,true,'active frame schedules its successor');
assert.equal(rafCalls,2);

state='town';
id=[...raf.keys()][0];fn=raf.get(id);raf.delete(id);fn(180);
assert.equal(W.running,false,'first frame after town transition self-terminates');
assert.equal(rafCalls,2,'town transition must not schedule a successor frame');

state='playing';W.start();assert(W.running);
document.hidden=true;
for(const fn2 of listeners.document.visibilitychange||[])fn2();
assert.equal(W.running,false,'hidden page stops the active loop');
assert(cancelCalls>=1,'hidden-page stop cancels an outstanding RAF');

document.hidden=false;state='title';
for(const fn2 of listeners.window.pageshow||[])fn2();
assert.equal(W.running,false,'pageshow on title stays idle');

console.log('world_loot_active_loop_v139=PASS');
