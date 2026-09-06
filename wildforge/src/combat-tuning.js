export const ENCOUNTER_TUNING=Object.freeze({
  surfaceCapDay:5,
  surfaceCapNight:7,
  undergroundCap:9,
  spawnSafeRadius:30,
  dayBase:6.2,
  dayJitter:4.2,
  duskBase:5.0,
  duskJitter:3.4,
  nightBase:3.9,
  nightJitter:3.0,
  surgeBase:2.9,
  surgeJitter:2.2,
});

export function encounterCap({underground=false,night=false,surge=false}={}){
  if(underground)return ENCOUNTER_TUNING.undergroundCap;
  if(night||surge)return ENCOUNTER_TUNING.surfaceCapNight;
  return ENCOUNTER_TUNING.surfaceCapDay;
}

export function nextEncounterDelay({phase='day',surge=false,rng=Math.random,routeRelief=1,freightFactor=1}={}){
  let base=ENCOUNTER_TUNING.dayBase,jitter=ENCOUNTER_TUNING.dayJitter;
  if(phase==='dusk'){base=ENCOUNTER_TUNING.duskBase;jitter=ENCOUNTER_TUNING.duskJitter;}
  if(phase==='night'){base=surge?ENCOUNTER_TUNING.surgeBase:ENCOUNTER_TUNING.nightBase;jitter=surge?ENCOUNTER_TUNING.surgeJitter:ENCOUNTER_TUNING.nightJitter;}
  return (base+rng()*jitter)*Math.max(.8,routeRelief)*Math.max(.72,freightFactor);
}
export function suppressEarlySurfaceEncounter({underground=false,night=false,distanceFromSpawn=Infinity,cargoValue=0,rng=Math.random}={}){
  if(underground||night||cargoValue>0||distanceFromSpawn>=ENCOUNTER_TUNING.spawnSafeRadius)return false;
  const safety=1-Math.max(0,Math.min(1,distanceFromSpawn/ENCOUNTER_TUNING.spawnSafeRadius));
  return rng()<(.35+.45*safety);
}

export function knockbackResistance(enemy){
  const explicit=Number(enemy?.def?.knockbackResist);
  if(Number.isFinite(explicit))return Math.max(0,Math.min(.98,explicit));
  if(enemy?.boss)return .9;
  if(enemy?.elite)return .55;
  if(enemy?.flying)return .28;
  return .15;
}

export function applyEnemyKnockback(enemy,{base=4.2,damage=1,direction=1,vertical=.72}={}){
  if(!enemy||enemy.dead)return 0;const resist=knockbackResistance(enemy),damageRatio=Math.max(0,Number(damage)||0)/Math.max(1,Number(enemy.maxHp)||1);
  let force=Math.max(0,Number(base)||0)*(1-resist)*(damageRatio>=.1?1.28:1);
  force=Math.min(10.5,force);const dir=Math.sign(direction)||1;
  enemy.vx=(Number(enemy.vx)||0)+dir*force;
  if(!enemy.flying)enemy.vy=Math.min(Number(enemy.vy)||0,-Math.max(.7,force*vertical*.28));
  else enemy.vy=(Number(enemy.vy)||0)-Math.max(.15,force*vertical*.12);
  enemy.knockbackTimer=Math.max(Number(enemy.knockbackTimer)||0,.11+Math.min(.11,force*.015));
  return force;
}