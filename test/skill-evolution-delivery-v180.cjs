'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const gradient={addColorStop(){}};
function ctx(){return new Proxy({}, {get(_t,k){if(k==='canvas')return{width:32,height:32};if(typeof k==='string'&&k.startsWith('create'))return()=>gradient;if(k==='measureText')return()=>({width:10});return()=>{}},set(){return true}})}
function elem(id){return{id,innerHTML:'',textContent:'',disabled:false,title:'',style:{},dataset:{},hidden:false,getContext:()=>ctx(),getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),focus(){},classList:{add(){},remove(){},toggle(){},contains:()=>false},addEventListener(){},setAttribute(){},removeAttribute(){},replaceChildren(){},appendChild(){},append(){},querySelector:()=>elem(id+'-child')}}
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,elem(id));return elements.get(id)};
global.document={getElementById:id=>el(id),createElement:t=>t==='canvas'?{width:0,height:0,getContext:()=>ctx(),toDataURL:()=>''}:elem('created'),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},documentElement:{dataset:{}}};
global.window={innerWidth:1280,innerHeight:800,addEventListener(){},dispatchEvent(){},DE_PROFILES:{}};
global.localStorage={_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}};
global.requestAnimationFrame=()=>0;global.cancelAnimationFrame=()=>{};global.Image=class{set src(_v){}};global.matchMedia=()=>({matches:false});global.performance={now:()=>Date.now()};global.location={search:'?profile=classic-100'};
for(const id of ['classic-10','classic-20','classic-30','classic-40','classic-50','classic-60','classic-100']) vm.runInThisContext(fs.readFileSync(path.join(root,'profiles',id+'.profile.js'),'utf8'),{filename:id});
for(const rel of ['game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/inventory/set-rules-v180.js','game/domain/economy/economy-rules-v130.js','game/domain/town/town-rules-v130.js','game/domain/town/town-growth-rules-v180.js','game/domain/expedition/expedition-rules-v170.js','game/domain/progression/progression-rules-v130.js','game/domain/combat/combat-rules-v130.js']) vm.runInThisContext(fs.readFileSync(path.join(root,rel),'utf8'),{filename:rel});
vm.runInThisContext(fs.readFileSync(path.join(root,'game/core/game.js'),'utf8'),{filename:'game/core/game.js'});
const T=window.DE_TEST;

function fakeMonster(xp,id){
  return {id,name:'Evolution Probe '+id,color:'#999',x:1,y:1,fx:1,fy:1,hp:1,maxHp:1,atk:1,def:0,xp,
    boss:false,midBoss:false,elite:false,boom:false,regen:false,enrage:false,armorBreak:false,traits:[]};
}
function visibleTalentIds(){
  return [...String(el('talent-grid').innerHTML).matchAll(/data-talent="([^"]+)"/g)].map(m=>m[1]);
}

// Depth milestone must be independently discoverable even without a level-up.
T.newGame('warrior');
T.depth=20;
let pair=T.pendingSkillEvolution();
assert.equal(pair.length,2);
assert(pair.every(t=>t.id.startsWith('se_w20_')),'Floor 20 must expose exactly the warrior evolution pair');
assert.equal(T.openPendingSkillEvolution(),true);
assert.equal(T.state,'talent');
assert.deepEqual(visibleTalentIds().sort(),pair.map(t=>t.id).sort(),'depth-driven delivery must render exactly the pending evolution pair');

// A level-up talent and a depth evolution can become pending on the same kill.
// Resolving the evolution must preserve, then immediately deliver, the ordinary talent.
T.newGame('warrior');
T.depth=20;
let m=fakeMonster(45,'overlap');
T.monsters.push(m); T.killMonster(m);
assert.equal(T.player.lvl,3);
assert.equal(T.state,'talent','Level 3 at Floor 20 must open the evolution first');
assert(visibleTalentIds().every(id=>id.startsWith('se_w20_')));
T.pickTalent('se_w20_arc');
assert.equal(T.state,'talent','ordinary Level-3 talent must remain pending after the evolution choice');
const ordinary=visibleTalentIds();
assert.equal(ordinary.length,3);
assert(ordinary.every(id=>!id.startsWith('se_')),'the follow-up screen must be the preserved ordinary talent choice');
T.pickTalent(ordinary[0]);
assert.equal(T.state,'playing');
assert.equal(T.pendingSkillEvolution(),null);
assert(T.player.talents.includes('se_w20_arc')&&T.player.talents.includes(ordinary[0]));

// Jumping directly to Floor 80 must recover every missing milestone in order.
// This covers checkpoint departures / quick dives / restored old runs without introducing a second milestone ledger.
T.player.talents=['se_w20_arc'];
T.depth=80;
pair=T.pendingSkillEvolution();
assert(pair.every(t=>t.id.startsWith('se_w40_')),'earliest missing milestone must be Floor 40');
assert.equal(T.openPendingSkillEvolution(),true);
assert(visibleTalentIds().every(id=>id.startsWith('se_w40_')));
T.pickTalent(visibleTalentIds()[0]);
assert.equal(T.state,'talent');
assert(visibleTalentIds().every(id=>id.startsWith('se_w60_')),'Floor 60 must chain immediately after resolving Floor 40');
T.pickTalent(visibleTalentIds()[0]);
assert.equal(T.state,'talent');
assert(visibleTalentIds().every(id=>id.startsWith('se_w80_')),'Floor 80 must chain immediately after resolving Floor 60');
T.pickTalent(visibleTalentIds()[0]);
assert.equal(T.state,'playing');
assert.equal(T.pendingSkillEvolution(),null);
assert.equal(T.openPendingSkillEvolution(),false,'completed milestones must not reopen');

for(const depth of [20,40,60,80]){
  const chosen=T.player.talents.filter(id=>id.startsWith('se_w'+depth+'_'));
  assert.equal(chosen.length,1,'exactly one stable evolution choice must persist for Floor '+depth);
}

console.log('skill_evolution_delivery_v180=PASS');
