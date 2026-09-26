/* Dungeon Echo v1.9.9 — incremental log + cached town topology contract. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');

assert(core.includes('function renderLog()'));
assert(core.includes('renderLog._nodes || (renderLog._nodes = new WeakMap())'));
assert(core.includes('logEl.insertBefore(node, current)'));
assert(!core.includes("logEl.innerHTML = logLines"));
assert(core.includes('function refreshTownRosterCache()'));
assert(core.includes('function cachedTownStaticActors(W, H, tier)'));
assert(core.includes('const actors = cachedTownStaticActors(W, H, tier)'));
assert(!core.includes("const actors = townInteractables().map(row =>"));

const gradient={addColorStop(){}};
function ctx(){
  const target={font:'',canvas:{width:960,height:608}};
  return new Proxy(target,{get(t,k){
    if(k==='canvas')return t.canvas;
    if(k==='measureText')return text=>({width:String(text).length*7});
    if(k==='createLinearGradient'||k==='createRadialGradient')return()=>gradient;
    if(k in t)return t[k];
    return()=>{};
  },set(t,k,v){t[k]=v;return true}});
}
function classList(){const s=new Set();return{add(...xs){xs.forEach(x=>s.add(x))},remove(...xs){xs.forEach(x=>s.delete(x))},toggle(x,f){if(f===undefined){if(s.has(x)){s.delete(x);return false}s.add(x);return true}if(f)s.add(x);else s.delete(x);return!!f},contains:x=>s.has(x)}}
let seq=0;
function elem(id){
  const kids=[];
  const e={
    id,style:{},dataset:{},hidden:false,width:id==='minimap'?160:0,height:id==='minimap'?112:0,
    textContent:'',innerHTML:'',className:'',title:'',disabled:false,parentNode:null,
    classList:classList(),getContext:()=>ctx(),focus(){},addEventListener(){},setAttribute(){},removeAttribute(){},
    getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),
    querySelector:()=>elem(id+'-child-'+(++seq)),appendChild(n){this.insertBefore(n,null)},append(){},
    replaceChildren(...nodes){while(kids.length)kids.pop().parentNode=null;for(const n of nodes){kids.push(n);n.parentNode=this}},
    insertBefore(node,current){
      if(node.parentNode){const a=node.parentNode.children,i=a.indexOf(node);if(i>=0)a.splice(i,1)}
      let at=current?kids.indexOf(current):-1;if(at<0)at=kids.length;kids.splice(at,0,node);node.parentNode=this;
      return node;
    },
    remove(){if(!this.parentNode)return;const a=this.parentNode.children,i=a.indexOf(this);if(i>=0)a.splice(i,1);this.parentNode=null},
  };
  Object.defineProperty(e,'children',{get:()=>kids});
  Object.defineProperty(e,'lastElementChild',{get:()=>kids[kids.length-1]||null});
  Object.defineProperty(e,'ownerDocument',{get:()=>global.document});
  return e;
}
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,elem(id));return elements.get(id)};
global.document={hidden:false,getElementById:id=>el(id),createElement:t=>t==='canvas'?Object.assign(elem('canvas-'+(++seq)),{width:0,height:0,getContext:()=>ctx(),toDataURL:()=>''}):elem(t+'-'+(++seq)),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},documentElement:{dataset:{},classList:classList()}};
global.window={innerWidth:1280,innerHeight:800,addEventListener(){},dispatchEvent(){},DE_PROFILES:{}};
global.localStorage={_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}};
global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
global.Image=class{constructor(){this.complete=true;this.naturalWidth=1120;this.naturalHeight=640}set src(v){this._src=v}};
global.matchMedia=()=>({matches:false});global.performance={now:()=>1000};global.location={search:'?profile=classic-100'};
for(const id of ['classic-10','classic-20','classic-30','classic-40','classic-50','classic-60','classic-100'])
  vm.runInThisContext(fs.readFileSync(path.join(root,'profiles',id+'.profile.js'),'utf8'),{filename:id});
for(const rel of ['game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/inventory/set-rules-v180.js','game/domain/economy/economy-rules-v130.js','game/domain/town/town-rules-v130.js','game/domain/town/town-growth-rules-v180.js','game/domain/expedition/expedition-rules-v170.js','game/domain/progression/progression-rules-v130.js','game/domain/combat/combat-rules-v130.js'])
  vm.runInThisContext(fs.readFileSync(path.join(root,rel),'utf8'),{filename:rel});
vm.runInThisContext(core,{filename:'game/core/game.js'});
const T=window.DE_TEST;

T.newGame('warrior');
T.resetUiScenePerf();
T.monsters.splice(0,T.monsters.length);
T.traps.splice(0,T.traps.length);
for(let i=0;i<8;i++)T.waitTurn();
const logPerf=T.uiScenePerfSnapshot();
assert.equal(logPerf.logNodeCreates,8,'eight new wait messages create eight log rows, not eight full log trees');
assert.equal(logPerf.logNodeMoves,8,'each new head message requires only one DOM insertion');
assert(logPerf.logNodeWrites>=8&&logPerf.logNodeWrites<=10,'incremental log writes only new row content/classes');

T.setGreedy(true);T.newGame('warrior');
T.player.escapes=1;T.monsters.splice(0,T.monsters.length);T.useEscape();
let guard=0;while(T.state==='playing'&&guard++<5)T.endTurn();
assert.equal(T.state,'town');
T.resetUiScenePerf();
const rows1=T.townInteractables(),rows2=T.townInteractables();
assert.strictEqual(rows1,rows2,'stable town resident roster reuses one interactable array');
const a1=T.cachedTownStaticActors(1120,460,1),a2=T.cachedTownStaticActors(1120,460,1);
assert.strictEqual(a1,a2,'stable town actor topology reuses one sorted array');
const townPerf=T.uiScenePerfSnapshot();
assert(townPerf.townRosterHits>=1,'stable town roster records cache hits');
assert(townPerf.townActorHits>=1,'stable town actor topology records cache hits');

console.log('performance_ui_town_cache_v199=PASS');
