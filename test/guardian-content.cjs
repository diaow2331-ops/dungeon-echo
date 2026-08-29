'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const core=fs.readFileSync(require('path').resolve(__dirname,'..','game/core/game.js'),'utf8');
assert(core.includes('normalizeGuardianIdentity(m);'),'spawn path must normalize guardian identity');
assert(core.includes('if (guardianAction(m))'),'monster authority must consume guardian warning/resolve turns');
assert(core.includes('drawGuardianTelegraph(m, now);'),'sole core renderer must draw telegraphs');
assert(!core.includes("'de-guardian-encounter-v1'"),'no guardian sidecar storage key may return');
const start=core.indexOf('const GUARDIAN_SPECS =');
const end=core.indexOf('function monstersTurn()',start);
assert(start>=0&&end>start,'guardian executable region must be discoverable');
const guardianRegion=core.slice(start,end);
assert(!guardianRegion.includes("createElement('canvas')"),'guardian recovery must not add a second canvas');
const hits={melee:0,ranged:0};
const ctx={save(){},restore(){},fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},set globalAlpha(v){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){}};
const sb={
  console, Math, ui:(zh,en)=>en, depth:20, turns:0, state:'playing', WALL:0, MAP_W:40, MAP_H:28, TILE:32,
  map:Array.from({length:28},()=>Array(40).fill(1)), player:{x:5,y:5,hp:500}, ctx,
  inB:(x,y)=>x>=0&&y>=0&&x<40&&y<28,
  msg(){}, floater(){},
  monsterAttack(){hits.melee++;}, monsterRangedAttack(){hits.ranged++;},
};
vm.createContext(sb);
vm.runInContext(core.slice(start,end)+`\n;globalThis.__g={normalizeGuardianIdentity,guardianState,guardianSpecFor,guardianAction,guardianFinalPhaseKey};`,sb,{filename:'guardian-core-behavior.js'});
const G=sb.__g;
let g={midBoss:true,depth:10,x:5,y:5,hp:100,maxHp:100}; G.normalizeGuardianIdentity(g); assert.equal(g.armorBreak,true,'Floor 10 must restore telegraphed armor break identity');
g={midBoss:true,depth:20,x:5,y:5,hp:100,maxHp:100,slow:true}; G.normalizeGuardianIdentity(g); assert.equal(g.regen,true); assert.equal(g.slow,false);
g={midBoss:true,depth:50,x:5,y:5,hp:50,maxHp:100,regen:true}; G.normalizeGuardianIdentity(g); assert.equal(g.ranged,2); assert.equal(g.regen,false);
g={midBoss:true,depth:90,x:5,y:5,hp:100,maxHp:100,enrage:true}; G.normalizeGuardianIdentity(g); assert.equal(g.ranged,3); assert.equal(g.enrage,false); assert.equal(g.leech,.10);

// Floor 20: warning consumes one guardian action; leaving radius makes resolution miss.
sb.depth=20; sb.turns=1; sb.player.x=6; sb.player.y=5; hits.melee=0;
g={midBoss:true,depth:20,x:5,y:5,hp:100,maxHp:100}; G.normalizeGuardianIdentity(g);
let st=G.guardianState(g); st.nextSpecialTurn=1;
assert.equal(G.guardianAction(g),true); assert.equal(st.active.id,'frost-ring');
sb.player.x=9; sb.turns=2; assert.equal(G.guardianAction(g),true); assert.equal(hits.melee,0,'Frost Ring must be dodgeable');

// Floor 30 mark snapshots the warned tile.
sb.depth=30; sb.turns=10; sb.player.x=8; sb.player.y=8; hits.melee=0;
g={midBoss:true,depth:30,x:5,y:5,hp:100,maxHp:100}; st=G.guardianState(g); st.nextSpecialTurn=10;
G.guardianAction(g); sb.player.x=9; sb.turns=11; G.guardianAction(g); assert.equal(hits.melee,0,'Ember Mark must miss after movement');

// Floor 50 heal is interruptible by any damage during warning.
sb.depth=50; sb.turns=20; sb.player.x=7; sb.player.y=5;
g={midBoss:true,depth:50,x:5,y:5,hp:50,maxHp:100}; G.normalizeGuardianIdentity(g); st=G.guardianState(g); st.nextSpecialTurn=20;
G.guardianAction(g); g.hp=45; sb.turns=21; G.guardianAction(g); assert.equal(g.hp,45,'Mending Channel must be interruptible');

// Floor 60 tether breaks at distance four.
sb.depth=60; sb.turns=30; sb.player.x=7; sb.player.y=5; hits.melee=0;
g={midBoss:true,depth:60,x:5,y:5,hp:100,maxHp:100}; st=G.guardianState(g); st.nextSpecialTurn=30;
G.guardianAction(g); sb.player.x=9; sb.turns=31; G.guardianAction(g); assert.equal(hits.melee,0,'Blood Tether must break at distance four');

// Floor 70 cross misses after leaving both axes.
sb.depth=70; sb.turns=40; sb.player.x=7; sb.player.y=5; hits.melee=0;
g={midBoss:true,depth:70,x:5,y:5,hp:100,maxHp:100}; st=G.guardianState(g); st.nextSpecialTurn=40;
G.guardianAction(g); sb.player.x=7; sb.player.y=6; sb.turns=41; G.guardianAction(g); assert.equal(hits.melee,0,'Rupture Cross must be dodgeable off both axes');

// Floor 90 always advances Mark -> Line -> Ring.
sb.depth=90; sb.turns=50; sb.player.x=8; sb.player.y=5;
g={midBoss:true,depth:90,x:5,y:5,hp:100,maxHp:100}; st=G.guardianState(g); st.nextSpecialTurn=50;
G.guardianAction(g); assert.equal(st.active.id,'echo-mark'); sb.player.x=9; sb.turns=51; G.guardianAction(g); assert.equal(st.sequenceIndex,1);
st.nextSpecialTurn=52; sb.turns=52; G.guardianAction(g); assert.equal(st.active.id,'echo-line','Echo Trial second step must be line');

// Floor 100 phase routing is HP-driven and state survives ordinary monster JSON serialization.
sb.depth=100; sb.turns=60;
g={boss:true,x:5,y:5,hp:1400,maxHp:1400}; G.normalizeGuardianIdentity(g); st=G.guardianState(g);
assert.equal(G.guardianSpecFor(g,st).id,'throne-mark'); g.hp=700; assert.equal(G.guardianSpecFor(g,st).id,'void-line'); g.hp=400; assert.equal(G.guardianSpecFor(g,st).id,'heart-nova');
st.nextSpecialTurn=60; G.guardianAction(g); const saved=JSON.parse(JSON.stringify(g)); assert(saved.guardianEncounter&&saved.guardianEncounter.active,'active guardian warning must ride existing monster serialization');

console.log('guardian_core_behavior_v131=PASS');
