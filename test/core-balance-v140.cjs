'use strict';
const fs=require('fs'), path=require('path'), vm=require('vm');
const root=path.resolve(__dirname,'..');
const gradient={addColorStop(){}};
function ctx(){return new Proxy({}, {get(_t,k){if(k==='canvas')return{width:32,height:32};if(typeof k==='string'&&k.startsWith('create'))return()=>gradient;if(k==='measureText')return()=>({width:10});return()=>{}},set(){return true}})}
function elem(id){return{id,innerHTML:'',textContent:'',disabled:false,title:'',style:{},dataset:{},getContext:()=>ctx(),classList:{add(){},remove(){},toggle(){},contains:()=>false},addEventListener(){},setAttribute(){},replaceChildren(){},appendChild(){},append(){},querySelector:()=>elem(id+'-child')}}
const elements=new Map(), el=id=>{if(!elements.has(id))elements.set(id,elem(id));return elements.get(id)};
global.document={getElementById:id=>el(id),createElement:t=>t==='canvas'?{width:0,height:0,getContext:()=>ctx(),toDataURL:()=>''}:elem('created'),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
global.window={innerWidth:1280,innerHeight:800,addEventListener(){},DE_PROFILES:{}};
global.localStorage={_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null},setItem(k,v){this._m.set(k,String(v))},removeItem(k){this._m.delete(k)}};
global.requestAnimationFrame=()=>0; global.cancelAnimationFrame=()=>{}; global.Image=class{set src(_v){}}; global.matchMedia=()=>({matches:false}); global.performance={now:()=>Date.now()}; global.location={search:'?profile=classic-100'};
for(const id of ['classic-10','classic-20','classic-30','classic-40','classic-50','classic-60','classic-100']) vm.runInThisContext(fs.readFileSync(path.join(root,'profiles',`${id}.profile.js`),'utf8'),{filename:id});
for(const rel of ['game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/economy/economy-rules-v130.js','game/domain/town/town-rules-v130.js','game/domain/progression/progression-rules-v130.js','game/domain/combat/combat-rules-v130.js']) vm.runInThisContext(fs.readFileSync(path.join(root,rel),'utf8'),{filename:rel});
vm.runInThisContext(fs.readFileSync(path.join(root,'game/core/game.js'),'utf8'),{filename:'game/core/game.js'});
const T=window.DE_TEST; let pass=0,fail=0; const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
const clearMobs=()=>T.monsters.splice(0,T.monsters.length);
const floorLine=(x0,y0,x1,y1)=>{for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)T.mapGrid[y][x]=1};
const dummy=(x,y,def=0)=>{const m=T.makeMonster({sprite:'rat',name:'靶子',color:'#fff',hp:999,atk:1,def,xp:0,min:1,max:100},{x,y});m.hp=m.maxHp=999;m.elite=false;m.ranged=0;m.armorBreak=false;m.erratic=false;return m};

// Signature loadout + class-agnostic world loot.
for(const cid of ['warrior','ranger','mage','assassin']){T.newGame(cid);ok(T.player.equip.weapon&&T.weaponClassOf(T.player.equip.weapon)===cid,`${cid} starts with its own signature weapon`)}
T.newGame('assassin'); T.setSeed('v140-world-weapons'); const fam=new Set(); for(let i=0;i<160;i++)fam.add(T.weaponBaseForDrop(30).cls); ok(fam.size===4,'world weapon drops retain all four class families independent of current class');
const staff=T.starterWeaponForClass('mage'); ok(T.canEquipForClass(staff)===false && T.classFitOf(staff)===0,'Assassin cannot equip Mage staff and off-class fit is zero');
const dagger=T.player.equip.weapon, count0=T.player.inv.length; T.player.inv.push(staff); T.equipFromBag(count0); ok(T.player.equip.weapon===dagger&&T.player.inv.includes(staff),'blocked off-class equip preserves both current weapon and found staff');

// Blocking service NPCs must never cut the only route across a generated floor.
const floorConnectedWithoutNpcs=()=>{
  const g=T.mapGrid,H=g.length,W=g[0].length,blocked=new Set(T.npcs.map(n=>`${n.x},${n.y}`));
  const q=[[T.player.x,T.player.y]],seen=new Set([`${T.player.x},${T.player.y}`]);
  for(let qi=0;qi<q.length;qi++){const [x,y]=q[qi];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(nx<0||ny<0||nx>=W||ny>=H||g[ny][nx]===0||blocked.has(k)||seen.has(k))continue;seen.add(k);q.push([nx,ny])}}
  let open=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]!==0&&!blocked.has(`${x},${y}`))open++;
  return seen.size===open;
};
let npcSafe=true,npcFailure='';
T.newGame('warrior');
npcSweep:for(let seed=0;seed<24;seed++)for(let d=1;d<=10;d++){T.setSeed(`v140-npc-connect-${seed}-${d}`);T.depth=d;T.genLevel();if(!floorConnectedWithoutNpcs()){npcSafe=false;npcFailure=` (seed ${seed}, floor ${d})`;break npcSweep}}
ok(npcSafe,'service NPC placement preserves every generated floor route'+npcFailure);

// Movement never auto-fires; J explicitly fires Ranger line attack.
T.newGame('ranger'); clearMobs(); T.player.x=10;T.player.y=10;T.player.fx=10;T.player.fy=10;T.player.facing=[1,0];floorLine(10,10,15,10);let m=dummy(14,10,2);T.monsters.push(m);T.player.mana=20;let hp=m.hp,turn=T.turns;T.tryMove(1,0);ok(T.player.x===11&&m.hp===hp&&T.turns===turn+1,'Ranger movement toward a distant target moves only and never auto-fires');ok(T.player.mana===22,'ordinary Ranger movement restores only base Mana');
T.player.x=10;T.player.y=10;T.player.fx=10;T.player.fy=10;T.player.facing=[1,0];T.player.mana=20;hp=m.hp;turn=T.turns;ok(T.directionalAttack()===true&&m.hp<hp&&T.turns===turn+1,'Ranger J directional action attacks a line target up to range');ok(T.player.mana===25,'successful Ranger basic attack restores base + attack Mana');

// Mage has an explicit ranged basic attack with its own resource pacing.
T.newGame('mage'); clearMobs();T.player.x=10;T.player.y=10;T.player.fx=10;T.player.fy=10;T.player.facing=[1,0];floorLine(10,10,14,10);m=dummy(14,10,12);T.monsters.push(m);T.player.mana=20;hp=m.hp;turn=T.turns;ok(T.directionalAttack()===true&&m.hp<hp&&T.turns===turn+1,'Arcanist J directional action performs a ranged staff basic attack');ok(T.player.mana===24,'Arcanist ranged basic restores base + attack Mana');

// Mana skill economy: invalid/no-resource casts are free; valid cast spends then receives normal turn regen.
T.newGame('warrior');clearMobs();T.player.x=10;T.player.y=10;T.player.fx=10;T.player.fy=10;floorLine(10,10,11,10);T.player.mana=60;turn=T.turns;T.useSkill();ok(T.turns===turn&&T.player.mana===60,'invalid Cleave with no adjacent target spends neither turn nor Mana');
m=dummy(11,10,0);T.monsters.push(m);T.player.mana=10;turn=T.turns;T.useSkill();ok(T.turns===turn&&T.player.mana===10&&m.hp===999,'insufficient Mana blocks skill before damage or turn spend');
T.player.mana=60;T.player.skillCd=0;turn=T.turns;T.useSkill();ok(T.turns===turn+1&&T.player.mana===32,'successful Warrior skill costs 30 Mana then receives 2 normal turn regen');
T.player.mana=10;turn=T.turns;T.waitTurn();ok(T.turns===turn+1&&T.player.mana===15,'waiting restores base Mana plus class focus bonus');

// Mana save migration and exact persistence.
T.player.mana=17;ok(T.persistRun()===true,'run with Mana persists through canonical save owner');let raw=JSON.parse(localStorage.getItem('de-run-v6'));T.player.mana=1;T.restoreRun(raw);ok(T.player.mana===17&&T.player.manaMax===60,'restore preserves canonical Mana state');
raw=JSON.parse(localStorage.getItem('de-run-v6'));delete raw.player.mana;delete raw.player.manaMax;T.restoreRun(raw);ok(T.player.mana===60&&T.player.manaMax===60,'legacy save without Mana migrates to full class Mana');

// Legacy off-class equipped weapon is safely recovered, never silently deleted.
T.newGame('assassin');T.persistRun();raw=JSON.parse(localStorage.getItem('de-run-v6'));raw.player.equip.weapon=T.starterWeaponForClass('mage');raw.player.inv=[];T.restoreRun(raw);ok(T.player.equip.weapon===null&&T.player.inv.some(it=>T.weaponClassOf(it)==='mage'),'legacy off-class equipped weapon migrates into inventory without loss');

console.log(`\nRESULT ${pass} passed / ${fail} failed`);process.exit(fail?1:0);
