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

T.setGreedy(true); T.newGame('warrior');
T.player.escapes=1; assert.equal(T.useEscape(),undefined); assert.equal(T.state,'town');
const meta=T.meta;
meta.gold=99999;

// Existing v1.7 readiness stays intact before any trade-road investment.
meta.townWorks={smithy:0,market:0,relics:0,tavern:0}; meta.potions=0; meta.escapes=0; meta.keys=0; meta.market=null;
let plan=T.townReadinessPlan();
assert.deepEqual(plan.rows.map(r=>r.id).sort(),['escape','potion']);
assert(T.buyTownReadiness());
assert.equal(meta.potions,2); assert.equal(meta.escapes,1); assert.equal(meta.keys,0);

// Road repair upgrades the same convenience action instead of removing it.
meta.townWorks={...meta.townWorks,market:1}; meta.potions=0; meta.escapes=0; meta.keys=0; meta.market=null;
plan=T.townReadinessPlan();
assert.deepEqual(plan.rows.map(r=>r.id).sort(),['escape','key','potion']);
assert(T.buyTownReadiness());
assert.equal(meta.potions,2); assert.equal(meta.escapes,1); assert.equal(meta.keys,1);

// Caravan Guards add one real refill per market cycle.
meta.townWorks={...meta.townWorks,market:2}; meta.market=null;
T.townReadinessPlan();
const stockBefore=meta.market.stock.potion;
assert(T.buyTown('potion'));
assert.equal(meta.market.stock.potion,stockBefore-1);
assert(T.townMarketRestockAvailable());
assert(T.restockTownMarket());
assert.equal(meta.market.stock.potion,stockBefore);
assert.equal(meta.market.restockUsed,1);
assert.equal(T.restockTownMarket(),false);

// Night Market changes canonical supply price, not a presentation-only label.
meta.townWorks={...meta.townWorks,market:2}; const normalPrice=T.townMarketPrice('potion',10);
meta.townWorks={...meta.townWorks,market:3}; const nightPrice=T.townMarketPrice('potion',10);
assert(nightPrice<normalPrice);

// Smithy adds retemper without taking away legacy refine/masterwork.
const item={name:'test blade',slot:'weapon',forge:3,refinePath:'keen',masterworked:false,stats:{atk:3,crit:4},score:7};
meta.townWorks={...meta.townWorks,smithy:1}; assert.equal(T.smithyCanRetemper(item),false);
meta.townWorks={...meta.townWorks,smithy:2}; assert.equal(T.smithyCanRetemper(item),true);
item.masterworked=true; assert.equal(T.smithyCanRetemper(item),false);
meta.townWorks={...meta.townWorks,smithy:3}; assert.equal(T.smithyCanRetemper(item),true);

// Tavern construction turns weighted randomness into bounded explicit choices.
meta.townWorks={...meta.townWorks,tavern:0}; meta.runs=10; meta.tavernVisits=0; meta.tavernLastRun=9; meta.tavernRewardCounts={}; meta.tavernHistory=[];
assert.equal(T.tavernOfferChoices().length,0);
meta.townWorks={...meta.townWorks,tavern:1}; assert.equal(T.tavernOfferChoices().length,2);
meta.townWorks={...meta.townWorks,tavern:3}; assert.equal(T.tavernOfferChoices().length,4);
const atk0=meta.atkBase;
assert(T.drinkAtTavern('edge')); assert.equal(meta.atkBase,atk0+1); assert.equal(T.tavernRewardCount('edge'),1);
meta.runs++; assert(T.drinkAtTavern('edge')); assert.equal(meta.atkBase,atk0+2); assert.equal(T.tavernRewardCount('edge'),2);
meta.runs++; assert.equal(T.drinkAtTavern('edge'),false); assert.equal(meta.atkBase,atk0+2);

console.log('town_services_runtime_v180=PASS');
