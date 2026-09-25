/* Dungeon Echo v1.9.5 — render lifecycle / idle-work regression contract. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');

assert(core.includes("const DUNGEON_IDLE_FRAME_MS = reducedMotion ? 160 : 66"));
assert(core.includes("state !== 'playing' || rafId !== null || frameTimerId !== null"));
assert(core.includes('function dungeonVisualsActive()'));
assert(core.includes('function wakeFrame()'));
assert(core.includes("const TOWN_ACTIVE_FRAME_MS = reducedMotion ? 66 : 33"));
assert(core.includes("const TOWN_IDLE_FRAME_MS = reducedMotion ? 220 : 80"));
assert(core.includes('function townMotionActive('));
assert(core.includes('function scheduleTownFrame('));
assert(core.includes('function townSceneMotionActive()'));
assert(core.includes('function wheelMotionActive('));
assert(core.includes('if (sceneDue) {') && core.includes('if (wheelDue) {'));
assert(core.includes('wakeTownFrame();'));
assert(core.includes('let minimapPaintState = null;'));
assert(core.includes('function minimapStateChanged()'));
assert(core.includes('function minimapStateKey()'));
assert(core.includes('if (!force && paintKey === minimapPaintKey) return false'));

const gradient={addColorStop(){}};
function ctx(){return new Proxy({}, {get(_t,k){if(k==='canvas')return{width:32,height:32};if(typeof k==='string'&&k.startsWith('create'))return()=>gradient;if(k==='measureText')return()=>({width:10});return()=>{}},set(){return true}})}
function elem(id){return{id,innerHTML:'',textContent:'',disabled:false,title:'',style:{},dataset:{},hidden:false,width:id==='minimap'?160:0,height:id==='minimap'?112:0,getContext:()=>ctx(),getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),focus(){},classList:{add(){},remove(){},toggle(){},contains:()=>false},addEventListener(){},setAttribute(){},removeAttribute(){},replaceChildren(){},appendChild(){},append(){},querySelector:()=>elem(id+'-child')}}
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,elem(id));return elements.get(id)};
global.document={hidden:false,getElementById:id=>el(id),createElement:t=>t==='canvas'?{width:0,height:0,getContext:()=>ctx(),toDataURL:()=>''}:elem('created'),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},documentElement:{dataset:{}}};
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
let perf=T.visualPerfSnapshot();
assert.equal(perf.dungeonIdleMs,66);
assert(perf.minimapKey.length>0);

assert.equal(T.drawMinimap(true),true,'forced minimap paint must render');
assert.equal(T.drawMinimap(),false,'unchanged minimap state must skip a duplicate paint');
T.player.x+=1;
assert.equal(T.drawMinimap(),true,'player position change invalidates minimap cache');
assert.equal(T.drawMinimap(),false,'new minimap state is cached after repaint');

T.setGreedy(true);
T.newGame('warrior');
T.player.escapes=1;
T.monsters.splice(0,T.monsters.length);
T.useEscape();
let guard=0;while(T.state==='playing'&&guard++<5)T.endTurn();
assert.equal(T.state,'town');
perf=T.visualPerfSnapshot();
assert.equal(perf.townActiveMs,33);
assert.equal(perf.townIdleMs,80);
assert.equal(perf.townActive,false,'settled town should use idle cadence');
assert.equal(perf.townSceneActive,false,'settled town scene should not be in active cadence');
assert.equal(perf.wheelActive,false,'settled wheel should not animate');
T.setTownTarget(.8,.9);
let moved=T.visualPerfSnapshot();
assert.equal(moved.townActive,true,'avatar movement wakes full-rate town animation');
assert.equal(moved.townSceneActive,true,'avatar movement activates only the town-scene path');
assert.equal(moved.wheelActive,false,'avatar movement does not activate wheel animation');

console.log('performance_lifecycle_v195=PASS');
