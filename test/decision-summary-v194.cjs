/* Dungeon Echo v1.9.4 — player-facing decision clarity regression contract. */
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
global.requestAnimationFrame=()=>0;global.cancelAnimationFrame=()=>{};global.Image=class{set src(_v){}};
global.matchMedia=()=>({matches:false});global.performance={now:()=>Date.now()};global.location={search:'?profile=classic-100'};
vm.runInThisContext(fs.readFileSync(path.join(root,'profiles/classic-100.profile.js'),'utf8'),{filename:'classic-100'});
for(const rel of ['game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/inventory/set-rules-v180.js','game/domain/economy/economy-rules-v130.js','game/domain/town/town-rules-v130.js','game/domain/town/town-growth-rules-v180.js','game/domain/expedition/expedition-rules-v170.js','game/domain/progression/progression-rules-v130.js','game/domain/combat/combat-rules-v130.js'])
  vm.runInThisContext(fs.readFileSync(path.join(root,rel),'utf8'),{filename:rel});
vm.runInThisContext(fs.readFileSync(path.join(root,'game/core/game.js'),'utf8'),{filename:'game.js'});
const T=window.DE_TEST;

T.setGreedy(true);T.newGame('warrior');T.depth=12;T.monsters.splice(0,T.monsters.length);
T.player.escapes=1;T.player.gold=37;T.player.hp=Math.max(1,Math.floor(T.pMaxHp()*0.6));
T.useEscape();let guard=0;while(T.state==='playing'&&guard++<5)T.endTurn();
assert.equal(T.state,'town');
assert.equal(T.lastTownOutcome.kind,'safe');
assert.equal(T.lastTownOutcome.depth,12);
assert.equal(T.lastTownOutcome.gold,37);

const meta=T.meta;
meta.bestDepth=31;meta.hpPct=45;meta.potions=1;meta.escapes=0;meta.keys=0;meta.contractId='oath';meta.market=null;
assert(T.selectTownCheckpoint(21));
assert(T.selectTownContract('oath'));
const brief=T.townDepartureDecisionSnapshot();
assert.equal(brief.startDepth,21);
assert.equal(brief.hpPct,45);
assert.equal(brief.contractId,'oath');
assert(brief.contractDetailEn.includes('Normal enemy ATK +16%'));
assert(brief.contractDetailEn.includes('XP +24%'));
assert.equal(brief.ready,false);
assert(el('town-contracts').innerHTML.includes('town-decision-summary'));

const game=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
assert(game.includes("['move', 'combat', 'gear', 'stairs', 'return', 'aim', 'contract']"));
assert(game.includes('2 full turns') && game.includes("guideOnce('contract'"));
assert(css.includes('.town-decision-summary') && css.includes('.town-outcome.safe') && css.includes('.town-outcome.danger'));
console.log('decision_summary_v194=PASS');
