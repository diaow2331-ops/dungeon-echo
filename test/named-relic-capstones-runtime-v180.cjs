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
const T=window.DE_TEST, rules=window.DE_SET_RULES_V180;
T.newGame('warrior');

const expected={
  ashen_watch:'brace',
  drowned_bell:'clarity',
  star_hunt:'echo_edge',
  rust_saints:'meditate',
  void_court:'reaper',
  shattered_moon:'afterimage',
};
for(const set of rules.SETS){
  const mechanic=expected[set.id];
  assert(mechanic,set.id+' missing expected runtime capstone mapping');
  const equip={};
  for(const slot of rules.SLOTS.slice(0,5)) equip[slot]={slot,setId:set.id,setPiece:slot};
  T.player.equip=equip;
  assert.equal(T.mechanicPower(mechanic),0,set.id+' must not activate its capstone at five pieces');
  equip[rules.SLOTS[5]]={slot:rules.SLOTS[5],setId:set.id,setPiece:rules.SLOTS[5]};
  T.player.equip=equip;
  assert.equal(T.mechanicPower(mechanic),2,set.id+' complete six-piece set must enter the canonical mechanic engine at power 2');
  delete equip[rules.SLOTS[2]];
  assert.equal(T.mechanicPower(mechanic),0,set.id+' capstone must switch off immediately when a specified piece is removed');
}

// A same-floor stream used to collapse onto a few relic slots because identity hashing had no
// per-drop entropy. Legendary probes now stay close to a six-way authored-piece distribution.
T.setSeed('v180-named-slot-runtime');
const slotCounts=Object.fromEntries(rules.SLOTS.map(slot=>[slot,0]));
let named=0;
for(let i=0;i<3600;i++){
  const item=T.genEquip(80,4);
  if(!item.namedSet) continue;
  named++; slotCounts[item.slot]++;
}
assert(named>1800&&named<2400,'Legendary named-relic rate should remain near the authored 58% band');
for(const slot of rules.SLOTS){
  const share=slotCounts[slot]/named;
  assert(share>.13&&share<.20,slot+' named relic share must stay near one-sixth; got '+share.toFixed(3));
}
console.log('named_relic_capstones_runtime_v180=PASS');
