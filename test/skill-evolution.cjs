'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('game/core/game.js'),docs=read('docs/SKILL_EVOLUTION.md');
assert(!fs.existsSync(path.join(root,'progression-system.js')),'retired root progression wrapper must remain absent');
assert(core.includes('const SKILL_EVOLUTION_ROWS = {'),'evolution data must live in canonical core');
assert(core.includes('id, ui(zhName, enName), ui(zhDesc, enDesc)'),'evolution data must use canonical core locale helper');
const evoStart=core.indexOf('const EVO ='),evoEnd=core.indexOf('function hashSeed',evoStart);
assert(evoStart>=0&&evoEnd>evoStart,'evolution initialization block must be bounded');
const sandbox={ui:(zh,en)=>en,player:null,depth:100,classId:'warrior'}; vm.createContext(sandbox);
vm.runInContext(core.slice(evoStart,evoEnd)+'\n;globalThis.__evoCount=Object.keys(SKILL_EVOLUTION_TALENTS).length;',sandbox,{filename:'skill-evolution-init.js'});
assert.equal(sandbox.__evoCount,32,'evolution initialization must execute and materialize 32 choices');
assert(core.includes('function pendingSkillEvolution()'),'core must own milestone delivery');
assert(core.includes('for (const milestone of SKILL_EVOLUTION_MILESTONES)'),'earliest-missing milestone scan required');
assert(core.includes('const evolutionPicks = pendingSkillEvolution();'),'talent screen must prioritize a pending evolution pair');
assert(core.includes('if (evolutionPicks) picks.push(...pool);'),'pending milestone must expose exactly its pair, not random ordinary talents');
assert(core.includes("TALENTS.find(x => x.id === id) || skillEvolutionTalent(id)"),'pickTalent must accept stable evolution ids');
const ids=[...core.matchAll(/EVO\('(se_[^']+)'/g)].map(m=>m[1]);
assert.equal(ids.length,32,'must contain 32 reviewed evolution choices');
assert.equal(new Set(ids).size,32,'all evolution ids must be unique');
for(const c of ['w','r','m','a']) for(const d of [20,40,60,80])
  assert.equal(ids.filter(id=>id.startsWith(`se_${c}${d}_`)).length,2,`${c} floor ${d} must have exactly two choices`);
assert(core.includes('function useBaseSkill() {')&&core.includes('function useSkill() {'),'base cast must be wrapped inside core, not an external runtime');
assert(core.includes('finally { p.atkBase=originalAtk; p.flatDr=originalDr; p.skillHaste=originalHaste; }'),'temporary cast stats must always restore');
assert(core.includes('let skillFollowup = null;'),'follow-up attack state must be transient module state');
assert(core.includes('function consumeSkillFollowup()'),'core must own follow-up consumption');
const melee=core.slice(core.indexOf('function playerAttack('),core.indexOf('function findRangedTarget('));
const ranged=core.slice(core.indexOf('function playerRangedAttack('),core.indexOf('function monsterAttack('));
assert(melee.includes('consumeSkillFollowup()')&&ranged.includes('consumeSkillFollowup()'),'melee and ranged shared core paths must consume follow-up');
assert(!core.includes('window.DE_SKILL_EVOLUTION'),'no old global wrapper API should return');
assert(!core.includes('Press J to attack in your facing direction. Press K to use'),'legacy English K/J skill hint must be gone');
assert(core.includes("guideOnce('combat'") && core.includes('C uses your class skill.'),'English contextual combat guide must match current C contract');
assert(docs.includes('`C` hotkey'),'formal skill-evolution docs must match production C input');
console.log('skill_evolution_core_v131=PASS');

// Execute the actual core evolution functions against a minimal deterministic combat sandbox.
{
  const dataStart=core.indexOf('const EVO ='),dataEnd=core.indexOf('function hashSeed',dataStart);
  const castStart=core.indexOf('function skillEvolutionVisibleMonsters()'),castEnd=core.indexOf('function descend()',castStart);
  assert(dataStart>=0&&dataEnd>dataStart&&castStart>=0&&castEnd>castStart,'core evolution executable regions must be discoverable');
  const sb={
    console, ui:(zh,en)=>en,
    state:'playing',classId:'warrior',depth:20,turns:0,
    player:{x:5,y:5,hp:70,hpBase:100,atkBase:10,flatDr:0,skillHaste:0,skillCd:0,equip:{},talents:[]},
    monsters:[],npcs:[],visible:Array.from({length:12},()=>Array(12).fill(true)),
    msg(){},
  };
  sb.pAtk=()=>sb.player.atkBase;
  sb.pMaxHp=()=>sb.player.hpBase;
  sb.walkable=()=>true;
  sb.monsterAt=(x,y)=>sb.monsters.find(m=>m.x===x&&m.y===y)||null;
  sb.npcAt=()=>null;
  sb.applyDamageToMonster=(m,dmg)=>{m.hp-=dmg;if(m.hp<=0)sb.monsters.splice(sb.monsters.indexOf(m),1);};
  sb.useBaseSkill=()=>{sb.turns++;sb.player.skillCd=5;};
  vm.createContext(sb);
  vm.runInContext(core.slice(dataStart,dataEnd)+core.slice(castStart,castEnd)+`\n;globalThis.__evo={pendingSkillEvolution,useSkill,consumeSkillFollowup};`,sb,{filename:'skill-evolution-behavior.js'});

  let pair=sb.__evo.pendingSkillEvolution();
  assert.equal(pair.length,2); assert(pair.every(t=>t.id.startsWith('se_w20_')),'Floor 20 must offer the warrior pair');
  sb.player.talents=['se_w20_guard']; sb.depth=40;
  pair=sb.__evo.pendingSkillEvolution();
  assert.equal(pair.length,2); assert(pair.every(t=>t.id.startsWith('se_w40_')),'earliest missing milestone must advance to Floor 40');

  sb.depth=20; sb.player.talents=['se_w20_guard']; sb.player.skillCd=0; sb.turns=0;
  sb.monsters=[{x:6,y:5,hp:30,maxHp:30,def:0}];
  let drSeen=-1; sb.useBaseSkill=()=>{drSeen=sb.player.flatDr;sb.turns++;sb.player.skillCd=5;};
  sb.__evo.useSkill();
  assert.equal(drSeen,3,'Guard Stance must exist during the cast turn');
  assert.equal(sb.player.flatDr,0,'Guard Stance must not leak permanent DR');

  sb.player.talents=['se_w20_arc'];sb.player.skillCd=0;sb.turns=0;sb.player.atkBase=10;
  const diag={x:6,y:6,hp:30,maxHp:30,def:0};sb.monsters=[{x:6,y:5,hp:30,maxHp:30,def:0},diag];
  sb.useBaseSkill=()=>{sb.turns++;sb.player.skillCd=5;};sb.__evo.useSkill();
  assert(diag.hp<30,'Arc Sweep must damage a diagonal secondary target');

  sb.classId='mage';sb.depth=20;sb.player.talents=['se_m20_fork'];sb.player.skillCd=0;sb.turns=0;sb.player.x=1;sb.player.y=1;
  const primary={x:3,y:1,hp:30,maxHp:30,def:0},secondary={x:4,y:1,hp:30,maxHp:30,def:0};sb.monsters=[primary,secondary];
  sb.useBaseSkill=()=>{sb.turns++;sb.player.skillCd=5;};sb.__evo.useSkill();
  assert(secondary.hp<30,'Forked Arcana must damage the second visible target');

  sb.classId='ranger';sb.depth=40;sb.player.talents=['se_r40_hunt'];sb.player.skillCd=0;sb.turns=0;sb.player.x=1;sb.player.y=1;
  sb.monsters=[{x:2,y:1,hp:1,maxHp:1,def:0}];
  sb.useBaseSkill=()=>{sb.monsters=[];sb.turns++;sb.player.skillCd=5;};sb.__evo.useSkill();
  assert.equal(sb.player.skillCd,0,'Hunt Continues must reset cooldown after a skill kill');

  sb.classId='assassin';sb.depth=20;sb.player.talents=['se_a20_execute'];sb.player.skillCd=0;sb.turns=0;sb.player.atkBase=10;
  sb.monsters=[{x:2,y:1,hp:4,maxHp:10,def:0}];let atkSeen=0;
  sb.useBaseSkill=()=>{atkSeen=sb.player.atkBase;sb.turns++;sb.player.skillCd=5;};sb.__evo.useSkill();
  assert(atkSeen>10,'Execution Line must raise ATK for a low-health target cast');
  assert.equal(sb.player.atkBase,10,'Execution Line must restore permanent ATK');

  sb.classId='ranger';sb.depth=60;sb.player.talents=['se_r60_marksman'];sb.player.skillCd=0;sb.turns=0;sb.monsters=[];
  sb.useBaseSkill=()=>{sb.turns++;sb.player.skillCd=5;};sb.__evo.useSkill();
  const follow=sb.__evo.consumeSkillFollowup();
  assert(follow&&follow.scale===.35,'Drawstring Momentum must arm the reviewed +35% follow-up');
  assert.equal(sb.__evo.consumeSkillFollowup(),null,'follow-up must be consumed exactly once');
}
console.log('skill_evolution_behavior_v131=PASS');
