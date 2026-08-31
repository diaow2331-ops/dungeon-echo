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
const T=window.DE_TEST, expedition=window.DE_EXPEDITION_RULES_V170, progression=window.DE_PROGRESSION_RULES_V130;

T.setGreedy(true); T.newGame('warrior');
assert.equal(T.progressionLevelCap(),50,'fresh permanent progression must use the authored Level 50 cap');
assert.equal(expedition.availableContracts(1).some(row=>row.id==='oath'),false);
assert.equal(expedition.availableContracts(2).some(row=>row.id==='oath'),true,'Veteran Oath must unlock before the normal Level-50 cap point');

function xpMonster(xp,id){
  return {id,name:'XP Probe '+id,color:'#999',x:1,y:1,fx:1,fy:1,hp:1,maxHp:1,atk:1,def:0,xp,
    boss:false,midBoss:false,elite:false,boom:false,regen:false,enrage:false,armorBreak:false,traits:[]};
}
let m=xpMonster(100000,'burst');
T.monsters.push(m); T.killMonster(m);
assert.equal(T.player.lvl,50,'one oversized XP award must never cross the permanent cap');
assert(T.player.xp>=0&&T.player.xp<progression.xpThreshold(50),'latent over-cap XP must be parked below the Level-50 threshold');
assert.equal(T.player.atkBase,53,'fresh warrior permanent ATK growth stops after 49 level deltas');
const cappedXp=T.player.xp;
m=xpMonster(5000,'postcap'); T.monsters.push(m); T.killMonster(m);
assert.equal(T.player.lvl,50,'post-cap kills cannot create transient extra levels');
assert.equal(T.player.xp,cappedXp,'post-cap kills cannot accumulate latent XP');
T.meta.lvl=49; assert.equal(T.townContractEnabled('oath'),true,'Veteran Oath remains selectable while permanent progression has runway');
T.meta.lvl=50; assert.equal(T.townPermanentLevelCapReached(),true); assert.equal(T.townContractEnabled('oath'),false,'Veteran Oath must become unavailable when XP has no permanent value');

// Preserve already-strong historical saves as a compatibility floor instead of rolling them back.
T.meta.lvl=80; T.meta.hpBase=900; T.meta.atkBase=150;
T.player.lvl=80; T.player.xp=9999; T.player.hpBase=900; T.player.atkBase=150;
assert.equal(T.progressionLevelCap(),80,'existing over-50 legacy saves form their own permanent level ceiling');
T.settleProgressionXpCap();
assert.equal(T.player.lvl,80);
assert(T.player.xp<progression.xpThreshold(80),'legacy saves still receive latent-XP protection at their grandfathered ceiling');
m=xpMonster(10000,'legacy'); T.monsters.push(m); T.killMonster(m);
assert.equal(T.player.lvl,80,'grandfathered saves cannot ratchet their historical ceiling upward');

const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');
assert(core.includes("ui('(永久等级 MAX)','(Permanent Level MAX)')"),'HUD must present explicit MAX state instead of a misleading frozen XP fraction');
assert(core.includes("row.id === 'oath'")&&core.includes('Permanent level cap reached'),'town contract UI must explain why the XP oath is disabled at cap');

console.log('progression_cap_runtime_v180=PASS');
