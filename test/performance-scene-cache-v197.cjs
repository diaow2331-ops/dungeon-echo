/* Dungeon Echo v1.9.7 — static scene-layer + visibility-filter cache contract. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');

assert(core.includes('function cachedDungeonStaticLayer()'));
assert(core.includes('function cachedDungeonVisibilityLayer()'));
assert(core.includes('function cachedDungeonScene()'));
assert(core.includes('function cachedTownBackdropLayer(W, H, townBackdrop)'));
assert(core.includes('if (staticLayer) ctx.drawImage(staticLayer, 0, 0);'));
assert(core.includes('if (visibilityLayer) ctx.drawImage(visibilityLayer, 0, 0);'));
assert(core.includes('for (const m of scene.monsters)'));
assert(core.includes('for (const it of scene.items)'));
assert(core.includes('if (backdropLayer) ctx.drawImage(backdropLayer, 0, 0);'));

const gradient={addColorStop(){}};
let mainDraws=0,offscreenDraws=0;
function context(kind='main'){
  const target={font:'',canvas:{width:1280,height:896}};
  return new Proxy(target,{
    get(t,k){
      if(k==='canvas')return t.canvas;
      if(k==='measureText')return text=>({width:String(text).length*7});
      if(k==='createRadialGradient'||k==='createLinearGradient')return()=>gradient;
      if(k==='drawImage')return()=>{ if(kind==='main') mainDraws++; else offscreenDraws++; };
      if(k in t)return t[k];
      return()=>{};
    },
    set(t,k,v){t[k]=v;return true}
  });
}
function classList(){const s=new Set();return{add(...xs){xs.forEach(x=>s.add(x))},remove(...xs){xs.forEach(x=>s.delete(x))},toggle(x,f){if(f===undefined){if(s.has(x)){s.delete(x);return false}s.add(x);return true}if(f)s.add(x);else s.delete(x);return!!f},contains:x=>s.has(x)}}
const contexts=new Map();
function canvas(id,width=1280,height=896,kind='main'){
  return {id,width,height,getContext:()=>{if(!contexts.has(id))contexts.set(id,context(kind));const c=contexts.get(id);c.canvas.width=width;c.canvas.height=height;return c;},toDataURL:()=>''};
}
function elem(id){
  if(id==='game')return canvas(id,960,608,'main');
  if(id==='minimap')return canvas(id,160,112,'main');
  if(id==='town-scene')return canvas(id,1120,460,'main');
  if(id==='wheel-canvas')return canvas(id,240,240,'main');
  return{id,innerHTML:'',textContent:'',disabled:false,title:'',style:{},dataset:{},hidden:false,width:0,height:0,getContext:()=>context('main'),getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),focus(){},classList:classList(),addEventListener(){},setAttribute(){},removeAttribute(){},replaceChildren(){},appendChild(){},append(){},querySelector:()=>elem(id+'-child')};
}
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,elem(id));return elements.get(id)};
let offscreenSeq=0;
global.document={
  hidden:false,
  getElementById:id=>el(id),
  createElement:t=>t==='canvas'?canvas('offscreen-'+(++offscreenSeq),0,0,'offscreen'):elem('created'),
  querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},documentElement:{dataset:{},classList:classList()}
};
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
T.resetRenderCachePerf(true);
const static1=T.cachedDungeonStaticLayer();
const vis1=T.cachedDungeonVisibilityLayer();
const scene1=T.cachedDungeonScene();
let first=T.renderCacheSnapshot();
assert(static1&&vis1&&scene1,'first dungeon cache pass creates all scene artifacts');
assert(first.dungeonLayerMisses===1&&first.visibilityLayerMisses===1&&first.sceneFilterMisses===1,'first dungeon scene pass records cache misses');

T.resetRenderCachePerf(false);
assert.strictEqual(T.cachedDungeonStaticLayer(),static1,'unchanged floor reuses static dungeon bitmap');
assert.strictEqual(T.cachedDungeonVisibilityLayer(),vis1,'unchanged FOV reuses visibility bitmap');
assert.strictEqual(T.cachedDungeonScene(),scene1,'unchanged turn/FOV reuses filtered scene lists');
let second=T.renderCacheSnapshot();
assert(second.dungeonLayerHits===1&&second.visibilityLayerHits===1&&second.sceneFilterHits===1,'unchanged dungeon scene records cache hits');

T.genLevel();
T.resetRenderCachePerf(false);
assert.notStrictEqual(T.cachedDungeonStaticLayer(),static1,'new floor invalidates static dungeon bitmap');
assert.notStrictEqual(T.cachedDungeonVisibilityLayer(),vis1,'new floor invalidates visibility bitmap');
assert.notStrictEqual(T.cachedDungeonScene(),scene1,'new floor invalidates filtered scene lists');
let changed=T.renderCacheSnapshot();
assert(changed.dungeonLayerMisses===1&&changed.visibilityLayerMisses===1&&changed.sceneFilterMisses===1,'new floor rebuilds all dungeon scene caches');

T.setGreedy(true);T.newGame('warrior');
T.player.escapes=1;T.monsters.splice(0,T.monsters.length);T.useEscape();
let guard=0;while(T.state==='playing'&&guard++<5)T.endTurn();
assert.equal(T.state,'town');
T.resetRenderCachePerf(true);mainDraws=0;offscreenDraws=0;
T.drawTownScene(1000);
const townFirst=T.renderCacheSnapshot();
assert.equal(townFirst.townLayerMisses,1,'first authored town draw builds backdrop bitmap');
const offscreenAfterFirst=offscreenDraws;
T.resetRenderCachePerf(false);
T.drawTownScene(1100);
const townSecond=T.renderCacheSnapshot();
assert.equal(townSecond.townLayerHits,1,'second authored town draw reuses backdrop bitmap');
assert.equal(townSecond.townLayerMisses,0,'second authored town draw does not rebuild backdrop bitmap');
assert.equal(offscreenDraws,offscreenAfterFirst,'cached town draw performs no new offscreen backdrop composition');

console.log('performance_scene_cache_v197=PASS');
