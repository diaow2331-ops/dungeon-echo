'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const gradient={addColorStop(){}};
function ctx(){return new Proxy({}, {get(_t,k){if(k==='canvas')return{width:32,height:32};if(typeof k==='string'&&k.startsWith('create'))return()=>gradient;if(k==='measureText')return()=>({width:10});return()=>{}},set(){return true}})}
function elem(id){return{id,innerHTML:'',textContent:'',disabled:false,title:'',style:{},dataset:{},getContext:()=>ctx(),classList:{add(){},remove(){},toggle(){},contains:()=>false},addEventListener(){},setAttribute(){},replaceChildren(){},appendChild(){},append(){},querySelector:()=>elem(id+'-child')}}
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,elem(id));return elements.get(id)};
global.document={getElementById:id=>el(id),createElement:t=>t==='canvas'?{width:0,height:0,getContext:()=>ctx(),toDataURL:()=>''}:elem('created'),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
global.window={innerWidth:1280,innerHeight:800,addEventListener(){},DE_PROFILES:{}};
global.localStorage={_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}};
global.requestAnimationFrame=()=>0;global.cancelAnimationFrame=()=>{};global.Image=class{set src(_v){}};global.matchMedia=()=>({matches:false});global.performance={now:()=>Date.now()};global.location={search:'?profile=classic-100'};
vm.runInThisContext(fs.readFileSync(path.join(root,'profiles/classic-100.profile.js'),'utf8'));
for(const rel of ['game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/economy/economy-rules-v130.js','game/domain/town/town-rules-v130.js','game/domain/expedition/expedition-rules-v170.js','game/domain/progression/progression-rules-v130.js','game/domain/combat/combat-rules-v130.js']) vm.runInThisContext(fs.readFileSync(path.join(root,rel),'utf8'),{filename:rel});
vm.runInThisContext(fs.readFileSync(path.join(root,'game/core/game.js'),'utf8'),{filename:'game/core/game.js'});
const T=window.DE_TEST;
assert.equal(T.monsterThreatScale(1,false,false),1.05);
assert(T.monsterThreatScale(50,false,false)>1.11 && T.monsterThreatScale(50,false,false)<1.13);
assert.equal(Number(T.monsterThreatScale(100,false,false).toFixed(2)),1.18);
assert.equal(Number(T.monsterThreatScale(100,true,false).toFixed(2)),1.22);
assert.equal(T.monsterThreatScale(100,true,true),1);
T.newGame('warrior');
T.depth=1; const early=T.makeMonster({sprite:'rat',name:'rat',color:'#fff',hp:10,atk:10,def:0,xp:1,min:1,max:100},{x:5,y:5});
T.depth=100; const late=T.makeMonster({sprite:'rat',name:'rat',color:'#fff',hp:10,atk:10,def:0,xp:1,min:1,max:100},{x:5,y:5});
assert(late.atk>early.atk,'late normal enemy attack must exceed early pressure');
const guardian=T.makeMonster({sprite:'boss',name:'guardian',color:'#fff',hp:100,atk:40,def:5,xp:10,midBoss:true},{x:5,y:5});
assert.equal(guardian.atk,40,'guardian authored ATK stays unchanged by normal-monster pressure');
const source=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');
assert(source.includes("const pressureScale = (m.boss || m.midBoss) ? 0.62 : m.elite ? 0.68 : 0.55;"));
console.log('monster_threat_v170=PASS');
