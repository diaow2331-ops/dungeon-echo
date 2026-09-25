/* Dungeon Echo v1.9.6 — stable Canvas cache regression contract. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');

assert(core.includes('function cachedMeasureTextWidth(context, text)'));
assert(core.includes('function cachedDungeonPlayerGradients(plx, ply)'));
assert(core.includes('function cachedDungeonVignette()'));
assert(core.includes('function cachedTownGradient(context, key, create)'));
assert(core.includes('ctx.fillStyle = cachedStairsGradient(px, py);'));
assert(core.includes('cachedMeasureTextWidth(ctx, label)'));
assert(core.includes("cachedTownGradient(ctx, 'backdrop-shade|'"));
assert(core.includes("cachedTownGradient(ctx, 'fire-glow|'"));

const gradient={addColorStop(){}};
let measureCalls=0,radialCalls=0,linearCalls=0;
function ctx(){
  return new Proxy({font:''},{
    get(t,k){
      if(k==='canvas')return{width:960,height:640};
      if(k==='measureText')return text=>{measureCalls++;return{width:String(text).length*7}};
      if(k==='createRadialGradient')return()=>{radialCalls++;return gradient};
      if(k==='createLinearGradient')return()=>{linearCalls++;return gradient};
      if(k in t)return t[k];
      return()=>{};
    },
    set(t,k,v){t[k]=v;return true}
  });
}
function classList(){const s=new Set();return{add(...xs){xs.forEach(x=>s.add(x))},remove(...xs){xs.forEach(x=>s.delete(x))},toggle(x,f){if(f===undefined){if(s.has(x)){s.delete(x);return false}s.add(x);return true}if(f)s.add(x);else s.delete(x);return!!f},contains:x=>s.has(x)}}
const contexts=new Map();
function elem(id){return{id,innerHTML:'',textContent:'',disabled:false,title:'',style:{},dataset:{},hidden:false,width:id==='minimap'?160:id==='town-scene'?1120:id==='wheel-canvas'?240:0,height:id==='minimap'?112:id==='town-scene'?460:id==='wheel-canvas'?240:0,getContext:()=>{if(!contexts.has(id))contexts.set(id,ctx());return contexts.get(id)},getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),focus(){},classList:classList(),addEventListener(){},setAttribute(){},removeAttribute(){},replaceChildren(){},appendChild(){},append(){},querySelector:()=>elem(id+'-child')}}
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,elem(id));return elements.get(id)};
global.document={hidden:false,getElementById:id=>el(id),createElement:t=>t==='canvas'?{width:0,height:0,getContext:()=>ctx(),toDataURL:()=>''}:elem('created'),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},documentElement:{dataset:{},classList:classList()}};
global.window={innerWidth:1280,innerHeight:800,addEventListener(){},dispatchEvent(){},DE_PROFILES:{}};
global.localStorage={_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}};
global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};global.Image=class{set src(_v){}};global.matchMedia=()=>({matches:false});global.performance={now:()=>1000};global.location={search:'?profile=classic-100'};
for(const id of ['classic-10','classic-20','classic-30','classic-40','classic-50','classic-60','classic-100'])
  vm.runInThisContext(fs.readFileSync(path.join(root,'profiles',id+'.profile.js'),'utf8'),{filename:id});
for(const rel of ['game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/inventory/set-rules-v180.js','game/domain/economy/economy-rules-v130.js','game/domain/town/town-rules-v130.js','game/domain/town/town-growth-rules-v180.js','game/domain/expedition/expedition-rules-v170.js','game/domain/progression/progression-rules-v130.js','game/domain/combat/combat-rules-v130.js'])
  vm.runInThisContext(fs.readFileSync(path.join(root,rel),'utf8'),{filename:rel});
vm.runInThisContext(core,{filename:'game/core/game.js'});
const T=window.DE_TEST;

T.newGame('warrior');
T.resetRenderCachePerf(true);
T.draw(1);
const dungeonFirst=T.renderCacheSnapshot();
assert(dungeonFirst.dungeonGradientMisses>=2,'first stable dungeon draw should build cached lighting gradients');
T.resetRenderCachePerf(false);
T.draw(1.1);
const dungeonSecond=T.renderCacheSnapshot();
assert.equal(dungeonSecond.dungeonGradientMisses,0,'unchanged dungeon draw must not rebuild cached lighting gradients');
assert(dungeonSecond.dungeonGradientHits>=2,'unchanged dungeon draw must reuse cached lighting gradients');

T.setGreedy(true);T.newGame('warrior');
T.player.escapes=1;T.monsters.splice(0,T.monsters.length);T.useEscape();
let guard=0;while(T.state==='playing'&&guard++<5)T.endTurn();
assert.equal(T.state,'town');
T.resetRenderCachePerf(true);measureCalls=radialCalls=linearCalls=0;
T.drawTownScene(1000);
const townFirst=T.renderCacheSnapshot(), firstMeasure=measureCalls, firstLinear=linearCalls, firstRadial=radialCalls;
assert(townFirst.textMeasureMisses>=5,'first town draw should measure authored NPC labels');
assert(townFirst.townGradientMisses>=2,'first town draw should build stable town gradients');
T.resetRenderCachePerf(false);measureCalls=radialCalls=linearCalls=0;
T.drawTownScene(1100);
const townSecond=T.renderCacheSnapshot();
assert.equal(townSecond.textMeasureMisses,0,'second unchanged town draw must not re-measure labels');
assert(townSecond.textMeasureHits>=5,'second unchanged town draw must reuse label widths');
assert.equal(townSecond.townGradientMisses,0,'second unchanged town draw must not rebuild stable town gradients');
assert(townSecond.townGradientHits>=2,'second unchanged town draw must reuse stable town gradients');
assert(measureCalls<firstMeasure,'cached town draw should make fewer native measureText calls');
assert(linearCalls<firstLinear,'cached town draw should make fewer native linear-gradient calls');
assert(radialCalls<=firstRadial,'cached town draw should not increase native radial-gradient calls');

console.log('performance_render_cache_v196=PASS');
