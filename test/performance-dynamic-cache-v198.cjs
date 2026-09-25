/* Dungeon Echo v1.9.8 — reusable dynamic CanvasGradient cache contract. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');

assert(core.includes('function cachedDungeonDynamicGradient(key, create)'));
assert(core.includes('function cachedEquipmentAuraGradient(px, py, color)'));
assert(core.includes('function cachedAmuletAuraGradient(px, py)'));
assert(core.includes('function cachedTorchAuraGradient(cx, cy, fl)'));
assert(core.includes("const key = ['torch-aura', cx, cy, bucket].join('|')"));
assert(!core.includes('const rg = ctx.createRadialGradient(px, py + 7, 1, px, py + 7, 21)'));
assert(!core.includes('const g2 = ctx.createRadialGradient(px, py, 2, px, py, TILE)'));
assert(!core.includes('const g2 = ctx.createRadialGradient(cx2, cy2, 4, cx2, cy2, TILE * 2.8 * fl)'));

let radialCalls=0;
const gradient={addColorStop(){}};
function context(){
  const target={font:'',canvas:{width:960,height:608}};
  return new Proxy(target,{
    get(t,k){
      if(k==='canvas')return t.canvas;
      if(k==='measureText')return text=>({width:String(text).length*7});
      if(k==='createRadialGradient')return()=>{radialCalls++;return gradient};
      if(k==='createLinearGradient')return()=>gradient;
      if(k in t)return t[k];
      return()=>{};
    },
    set(t,k,v){t[k]=v;return true}
  });
}
function classList(){const s=new Set();return{add(...xs){xs.forEach(x=>s.add(x))},remove(...xs){xs.forEach(x=>s.delete(x))},toggle(x,f){if(f===undefined){if(s.has(x)){s.delete(x);return false}s.add(x);return true}if(f)s.add(x);else s.delete(x);return!!f},contains:x=>s.has(x)}}
const contexts=new Map();
function canvas(id,width=960,height=608){
  return{id,width,height,style:{},dataset:{},hidden:false,getContext:()=>{if(!contexts.has(id))contexts.set(id,context());return contexts.get(id)},toDataURL:()=>'',addEventListener(){},setAttribute(){},removeAttribute(){},focus(){},getBoundingClientRect:()=>({left:0,top:0,width,height}),classList:classList(),querySelector:()=>null,appendChild(){},append(){},replaceChildren(){}};
}
function elem(id){
  if(id==='game')return canvas(id,960,608);
  if(id==='minimap')return canvas(id,160,112);
  if(id==='town-scene')return canvas(id,1120,460);
  if(id==='wheel-canvas')return canvas(id,240,240);
  return{id,innerHTML:'',textContent:'',disabled:false,title:'',style:{},dataset:{},hidden:false,width:0,height:0,getContext:()=>context(),getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),focus(){},classList:classList(),addEventListener(){},setAttribute(){},removeAttribute(){},replaceChildren(){},appendChild(){},append(){},querySelector:()=>elem(id+'-child')};
}
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,elem(id));return elements.get(id)};
let offscreen=0;
global.document={hidden:false,getElementById:id=>el(id),createElement:t=>t==='canvas'?canvas('off'+(++offscreen),0,0):elem('created'),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},documentElement:{dataset:{},classList:classList()}};
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
T.resetRenderCachePerf(true);radialCalls=0;
const eq1=T.cachedEquipmentAuraGradient(100.2,120.1,'#ffaa33');
const eq2=T.cachedEquipmentAuraGradient(100.4,120.4,'#ffaa33');
const am1=T.cachedAmuletAuraGradient(100.2,120.1);
const t1=T.cachedTorchAuraGradient(64,64,.80);
const t2=T.cachedTorchAuraGradient(64,64,.81);
let first=T.renderCacheSnapshot();
assert(eq1&&am1&&t1&&t2,'dynamic cache creates reusable CanvasGradient objects');
assert.strictEqual(eq2,eq1,'subpixel equipment bob within one pixel bucket reuses its gradient');
assert(first.dynamicGradientMisses===3,'equipment, amulet and same torch bucket create three gradients');
assert(first.dynamicGradientHits===2,'subpixel equipment bob and nearby torch flicker share cached gradients');
assert.equal(radialCalls,3,'three unique cache entries create three native radial gradients');

T.resetRenderCachePerf(false);radialCalls=0;
assert.strictEqual(T.cachedEquipmentAuraGradient(100.3,120.3,'#ffaa33'),eq1);
assert.strictEqual(T.cachedAmuletAuraGradient(100.2,120.1),am1);
assert.strictEqual(T.cachedTorchAuraGradient(64,64,.80),t1);
let second=T.renderCacheSnapshot();
assert(second.dynamicGradientHits===3&&second.dynamicGradientMisses===0,'stable dynamic glows are all cache hits');
assert.equal(radialCalls,0,'stable dynamic glows create no new native gradients');

T.resetRenderCachePerf(true);radialCalls=0;
for(let i=0;i<240;i++) T.cachedTorchAuraGradient(64,64,.8+.2*Math.abs(Math.sin(i*.17)));
const torch=T.renderCacheSnapshot();
assert(torch.dynamicGradientMisses<=9,'torch flicker uses at most nine cached radius buckets');
assert(torch.dynamicGradientHits>=231,'long torch animation reuses quantized native gradients');
assert(radialCalls<=9,'long torch animation constructs at most nine native gradients');

console.log('performance_dynamic_cache_v198=PASS');
