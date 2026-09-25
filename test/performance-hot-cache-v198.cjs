/* Dungeon Echo v1.9.8 — allocation-free hot render-cache guard contract. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');

assert(core.includes('let minimapPaintState = null;'));
assert(core.includes('function minimapStateChanged()'));
assert(core.includes('dungeonStaticLayerCache.revision === dungeonMapRevision'));
assert(core.includes('dungeonVisibilityLayerCache.revision === dungeonMapRevision'));
assert(core.includes('const cache = dungeonSceneFilterCache;'));
assert(core.includes('dungeonPlayerGradientCache.plx === plx'));
assert(core.includes('dungeonVignetteCache.width === canvas.width'));
assert(core.includes('townBackdropLayerCache.source === townBackdrop'));
assert(!core.includes('function dungeonTextureSignature(T)'));

const gradient={addColorStop(){}};
function context(){
  const target={font:'',canvas:{width:960,height:608}};
  return new Proxy(target,{get(t,k){
    if(k==='canvas')return t.canvas;
    if(k==='measureText')return text=>({width:String(text).length*7});
    if(k==='createRadialGradient'||k==='createLinearGradient')return()=>gradient;
    if(k in t)return t[k]; return()=>{};
  },set(t,k,v){t[k]=v;return true}});
}
function classList(){const s=new Set();return{add(...xs){xs.forEach(x=>s.add(x))},remove(...xs){xs.forEach(x=>s.delete(x))},toggle(x,f){if(f===undefined){if(s.has(x)){s.delete(x);return false}s.add(x);return true}if(f)s.add(x);else s.delete(x);return!!f},contains:x=>s.has(x)}}
const contexts=new Map();
function canvas(id,width=960,height=608){return{id,width,height,style:{},dataset:{},hidden:false,getContext:()=>{if(!contexts.has(id))contexts.set(id,context());return contexts.get(id)},toDataURL:()=>'',addEventListener(){},setAttribute(){},removeAttribute(){},focus(){},getBoundingClientRect:()=>({left:0,top:0,width,height}),classList:classList(),querySelector:()=>null,appendChild(){},append(){},replaceChildren(){}}}
function elem(id){
  if(id==='game')return canvas(id,960,608);
  if(id==='minimap')return canvas(id,160,112);
  if(id==='town-scene')return canvas(id,1120,460);
  if(id==='wheel-canvas')return canvas(id,240,240);
  return{id,innerHTML:'',textContent:'',disabled:false,title:'',style:{},dataset:{},hidden:false,width:0,height:0,getContext:()=>context(),getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),focus(){},classList:classList(),addEventListener(){},setAttribute(){},removeAttribute(){},replaceChildren(){},appendChild(){},append(){},querySelector:()=>elem(id+'-child')};
}
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,elem(id));return elements.get(id)};
global.document={hidden:false,getElementById:id=>el(id),createElement:t=>t==='canvas'?canvas('off-'+elements.size,0,0):elem('created'),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},documentElement:{dataset:{},classList:classList()}};
global.window={innerWidth:1280,innerHeight:800,addEventListener(){},dispatchEvent(){},DE_PROFILES:{}};
global.localStorage={_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}};
global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
global.Image=class{constructor(){this.complete=true;this.naturalWidth=1120;this.naturalHeight=640}set src(v){this._src=v}};
global.matchMedia=()=>({matches:false});global.performance={now:()=>1000};global.location={search:'?profile=classic-100&seed=v198-hot-cache'};
for(const id of ['classic-10','classic-20','classic-30','classic-40','classic-50','classic-60','classic-100']) vm.runInThisContext(fs.readFileSync(path.join(root,'profiles',id+'.profile.js'),'utf8'),{filename:id});
for(const rel of ['game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/inventory/set-rules-v180.js','game/domain/economy/economy-rules-v130.js','game/domain/town/town-rules-v130.js','game/domain/town/town-growth-rules-v180.js','game/domain/expedition/expedition-rules-v170.js','game/domain/progression/progression-rules-v130.js','game/domain/combat/combat-rules-v130.js']) vm.runInThisContext(fs.readFileSync(path.join(root,rel),'utf8'),{filename:rel});
vm.runInThisContext(core,{filename:'game/core/game.js'});
const T=window.DE_TEST;

T.newGame('warrior');
T.resetRenderCachePerf(true);
T.draw(1);
T.resetRenderCachePerf(false);
T.draw(1.1);
const stable=T.renderCacheSnapshot();
assert(stable.dungeonLayerHits>=1,'unchanged draw reuses static dungeon layer');
assert(stable.visibilityLayerHits>=1,'unchanged draw reuses viewport visibility layer');
assert(stable.sceneFilterHits>=1,'unchanged draw reuses filtered scene');
assert(stable.dungeonGradientHits>=2,'unchanged draw reuses player lighting and vignette');
assert.equal(T.drawMinimap(),false,'unchanged minimap state skips repaint without a joined string key');

const layer=T.cachedDungeonStaticLayer(),vis=T.cachedDungeonVisibilityLayer(),scene=T.cachedDungeonScene();
T.genLevel();
assert.notStrictEqual(T.cachedDungeonStaticLayer(),layer,'new floor still invalidates static layer');
assert.notStrictEqual(T.cachedDungeonVisibilityLayer(),vis,'new floor still invalidates visibility layer');
assert.notStrictEqual(T.cachedDungeonScene(),scene,'new floor still invalidates scene filter');

console.log('performance_hot_cache_v198=PASS');
