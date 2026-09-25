/* Dungeon Echo v1.9.6 — dirty-only HUD DOM regression contract. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');

assert(core.includes('const hudElementCache = Object.create(null);'));
assert(core.includes("let lastHudSignature = '';"));
assert(core.includes('if (signature === lastHudSignature) {'));
assert(core.includes('if (el.textContent === next) { hudPerf.skips++; return false; }'));
assert(core.includes('if (el.style[key] === next) { hudPerf.skips++; return false; }'));
assert(core.includes('if (current === next) { hudPerf.skips++; return false; }'));
assert(core.includes('const maxHp = pMaxHp();'));
assert(core.includes('const canDescend = onStairs && canDescendNow();'));

const gradient={addColorStop(){}};
function ctx(){return new Proxy({}, {get(_t,k){if(k==='canvas')return{width:32,height:32};if(typeof k==='string'&&k.startsWith('create'))return()=>gradient;if(k==='measureText')return()=>({width:10});return()=>{}},set(){return true}})}
function classList(){
  const set=new Set();
  return {
    add(...xs){for(const x of xs)set.add(x)},
    remove(...xs){for(const x of xs)set.delete(x)},
    toggle(x,force){if(force===undefined){if(set.has(x)){set.delete(x);return false}set.add(x);return true}if(force)set.add(x);else set.delete(x);return !!force},
    contains:x=>set.has(x),
    _set:set,
  };
}
function elem(id){
  const cl=classList();
  let cn='';
  return {
    id,innerHTML:'',textContent:'',disabled:false,title:'',style:{},dataset:{},hidden:false,
    width:id==='minimap'?160:0,height:id==='minimap'?112:0,
    get className(){return cn},set className(v){cn=String(v);cl._set.clear();for(const x of cn.split(/\s+/).filter(Boolean))cl._set.add(x)},
    classList:cl,getContext:()=>ctx(),
    getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),focus(){},addEventListener(){},
    setAttribute(){},removeAttribute(){},replaceChildren(){},appendChild(){},append(){},querySelector:()=>elem(id+'-child')
  };
}
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

T.resetHudPerf(true);
T.player.gold+=7;
T.player.hp=Math.max(1,T.player.hp-3);
T.updateHud();
const changed=T.hudPerfSnapshot();
assert(changed.queries>=15,'first cached HUD pass should resolve its DOM nodes');
assert(changed.writes>=2,'changed player state must commit visible HUD writes');
assert(changed.cached>=15,'HUD nodes should be retained in the lazy cache');

T.resetHudPerf(false);
T.updateHud();
const stable=T.hudPerfSnapshot();
assert.equal(stable.queries,0,'stable HUD pass must not repeat getElementById lookups');
assert.equal(stable.writes,0,'stable HUD pass must produce zero DOM writes');
assert.equal(stable.frameSkips,1,'stable HUD pass should exit once at the whole-frame signature guard');
assert.equal(stable.skips,0,'whole-frame early exit should avoid per-field dirty comparisons');

T.resetHudPerf(false);
T.player.mana=Math.max(0,T.player.mana-1);
T.updateHud();
const mana=T.hudPerfSnapshot();
assert(mana.writes>=2 && mana.writes<=4,'single resource change should touch only its dependent HUD fields');

console.log('performance_dom_v196=PASS');
