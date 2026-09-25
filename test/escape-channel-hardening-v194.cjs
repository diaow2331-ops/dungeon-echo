/* Dungeon Echo v1.9.4 — return-channel edge hardening contract. */
'use strict';
const fs=require('fs'), path=require('path'), vm=require('vm');
const root=path.resolve(__dirname,'..');
let pass=0, fail=0;
const ok=(c,n)=>{ if(c){pass++;console.log('  PASS '+n);} else {fail++;console.log('  FAIL '+n);} };
const gradient={addColorStop(){}};
function ctx(){return new Proxy({}, {get(_t,k){if(k==='canvas')return{width:32,height:32};if(typeof k==='string'&&k.startsWith('create'))return()=>gradient;if(k==='measureText')return()=>({width:10});return()=>{}},set(){return true}})}
function elem(id){return{id,innerHTML:'',textContent:'',disabled:false,title:'',style:{},dataset:{},hidden:false,getContext:()=>ctx(),getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),focus(){},classList:{add(){},remove(){},toggle(){},contains:()=>false},addEventListener(){},setAttribute(){},removeAttribute(){},replaceChildren(){},appendChild(){},append(){},querySelector:()=>elem(id+'-child')}}
const elements=new Map(), el=id=>{if(!elements.has(id))elements.set(id,elem(id));return elements.get(id)};
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
ok(!!T && typeof T.unequip==='function','core exposes inventory actions for channel regression coverage');
T.setGreedy(false);T.newGame('warrior');T.monsters.splice(0,T.monsters.length);
const gear={slot:'armor',name:'Channel Coat',stats:{def:1},rarity:0,score:1};

T.player.inv=[gear];T.player.equip.armor=null;T.player.escapeChannel=2;T.player.escapeChannelHp=T.player.hp;
T.equipFromBag(0);
ok(T.player.escapeChannel===1 && T.player.equip.armor===null && T.player.inv[0]===gear,'equip command during return channel advances focus but cannot swap gear for free');

T.player.escapeChannel=2;T.player.escapeChannelHp=T.player.hp;
const floorItems=T.items.length;T.discardFromBag(0);
ok(T.player.escapeChannel===1 && T.player.inv[0]===gear && T.items.length===floorItems,'discard command during return channel advances focus but cannot drop inventory for free');

T.player.inv=[];T.player.equip.armor=gear;T.player.escapeChannel=2;T.player.escapeChannelHp=T.player.hp;
T.unequip('armor');
ok(T.player.escapeChannel===1 && T.player.equip.armor===gear && T.player.inv.length===0,'unequip command during return channel advances focus but cannot reshuffle gear for free');

T.player.equip.armor=null;T.player.escapeChannel=2;T.player.hp=T.pMaxHp()-5;T.player.escapeChannelHp=T.player.hp;
T.player.poison=1;T.turns=8;const hp0=T.player.hp;
T.endTurn();
ok(T.player.hp===hp0,'turn-9 passive regen and 1 poison damage can numerically cancel');
ok(T.player.escapeChannel===0,'any real damage still interrupts channel even when passive regen masks final HP delta');

const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');
ok(core.includes('const escapeTurnSafeHp = escapeChannelActive()') && core.includes('(Number(player.hp) || 0) < escapeTurnSafeHp'),'channel interruption compares against post-recovery pre-hazard HP');

console.log('\nRESULT  '+pass+' passed / '+fail+' failed');
process.exit(fail?1:0);
