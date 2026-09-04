import {VERSION, TILE, TILE_DEFS, ITEMS, RECIPES, ENEMY_TYPES, itemName, tileName} from './data.js';
import {World, WORLD_W, WORLD_H, encodeTiles, biomeIndexAt, makeRng} from './world.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const canvas = $('#game'), ctx = canvas.getContext('2d', {alpha:false});
const SAVE_KEY = 'wildforge.save.v010';
const LANG_KEY = 'wildforge.lang';
const HOTBAR_SIZE = 8;
const HOTBAR_DEFAULT = ['wood','soil','stone','torch','plank','workbench','campfire','rope'];
const DEPTH_ZONES = Object.freeze([
  {min:0,id:'surface',zh:'地表边境',en:'Frontier Surface'},
  {min:8,id:'shallow',zh:'浅层洞带',en:'Shallow Caves'},
  {min:24,id:'copper',zh:'赤铜层',en:'Copper Strata'},
  {min:48,id:'iron',zh:'冷铁深层',en:'Cold-Iron Deep'},
  {min:76,id:'star',zh:'星晶裂隙',en:'Starshard Rift'}
]);
const GLYPH = {
  wood:'▥',soil:'▰',stone:'◆',coal:'●',copper_ore:'◈',iron_ore:'◇',crystal:'✦',sand:'▱',sandstone:'▤',ash:'◼',basalt:'⬟',ice:'⬢',snow:'▧',fiber:'≋',rope:'⌇',moss_spore:'✧',plank:'▥',ruin_brick:'▣',torch:'♨',workbench:'▦',campfire:'♨',platform:'═',
  wood_pick:'⌕',stone_pick:'⌕',copper_pick:'⌕',iron_pick:'⌕',delver_pick:'⌕',wood_blade:'†',stone_blade:'†',copper_blade:'†',iron_blade:'†',crystal_blade:'✦',sentinel_blade:'‡',copper_bar:'▬',iron_bar:'▬',ancient_core:'◉'
};

let lang = localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh';
document.documentElement.dataset.lang = lang;
const tr = (zh,en) => lang === 'zh' ? zh : en;

const game = {
  running:false, world:null, seed:'', time:0.18, last:0, autosave:0, spawnTimer:0,
  player:null, inventory:{}, hotbar:[...HOTBAR_DEFAULT], selected:0, enemies:[], drops:[],
  input:{left:false,right:false,down:false,jump:false,mine:false,place:false}, pointer:{x:0,y:0,active:false,worldX:0,worldY:0,kind:'mouse'},
  mine:{key:'',progress:0}, attackCd:0, placeCd:0, quickPlaceId:null, interactCd:0, hurtCd:0, uiOpen:false,
  camera:{x:0,y:0,tile:26}, dpr:1, cssW:innerWidth, cssH:innerHeight,
  fx:{particles:[],shake:0}, smartCursor:false, autoTool:false, mobileAim:{x:1,y:0,active:false}, restFx:0, relicScanCd:0, relicHint:null, toastTimer:0, saveDirty:false, objectiveStage:0, discoveries:[], guardianDefeated:{}, openedChestCount:0, rng:Math.random
};

function freshPlayer(spawn) {
  return {x:spawn.x,y:spawn.y,vx:0,vy:0,w:.72,h:1.72,hp:100,maxHp:100,grounded:false,onPlatform:false,dropThrough:0,fallStartY:spawn.y,facing:1,jumpLatch:false,jumpBuffer:0,coyote:0,attackFlash:0,steps:0};
}
function freshInventory() { return {wood:0,soil:0,stone:0,fiber:0}; }
function count(id) { return Number(game.inventory[id]||0); }
function addItem(id,n=1) {
  if (!ITEMS[id] || n<=0) return false;
  const max=ITEMS[id].stack||99;
  game.inventory[id]=Math.min(max, count(id)+n); game.saveDirty=true; updateObjective(); return true;
}
function consume(id,n=1) { if(count(id)<n)return false; game.inventory[id]-=n; if(game.inventory[id]<=0)delete game.inventory[id]; game.saveDirty=true; return true; }
function selectedId() { return game.hotbar[game.selected]; }
function selectedItem() { return ITEMS[selectedId()] || null; }
function bestOwned(ids){for(const id of ids)if(count(id)>0)return ITEMS[id];return null;}
function currentPick() {
  const sel=selectedItem();
  if(sel?.kind==='pick'&&count(selectedId())>0)return sel;
  if(game.pointer.kind==='touch'||game.autoTool)return bestOwned(['delver_pick','iron_pick','copper_pick','stone_pick','wood_pick'])||{tier:0,power:.72};
  return {tier:0,power:.72};
}
function currentWeapon() {
  const sel=selectedItem();
  if(sel?.kind==='weapon'&&count(selectedId())>0)return sel;
  if(game.pointer.kind==='touch'||game.autoTool)return bestOwned(['sentinel_blade','crystal_blade','iron_blade','copper_blade','stone_blade','wood_blade'])||{damage:2.5};
  return {damage:2.5};
}
function seedNow() { return 'WF-'+Math.random().toString(36).slice(2,7).toUpperCase()+'-'+Date.now().toString(36).slice(-4).toUpperCase(); }
function saveExists() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }

function serialize() {
  const p=game.player;
  return {v:VERSION,seed:game.seed,time:game.time,tiles:encodeTiles(game.world.tiles),player:{x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,facing:p.facing},inventory:game.inventory,hotbar:game.hotbar,selected:game.selected,objectiveStage:game.objectiveStage,discoveries:game.discoveries,guardianDefeated:game.guardianDefeated,openedChestCount:game.openedChestCount};
}
function saveGame(show=true) {
  if (!game.running || !game.world) return;
  try { localStorage.setItem(SAVE_KEY,JSON.stringify(serialize())); game.saveDirty=false; game.autosave=0; if(show)toast(tr('世界已保存在此设备','World saved on this device')); }
  catch(e){ console.error(e); if(show)toast(tr('保存失败：浏览器存储不可用','Save failed: local storage unavailable')); }
}
function readSave() {
  try { const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); return raw&&raw.v===VERSION&&raw.seed&&raw.tiles?raw:null; } catch { return null; }
}
function applySave(raw) {
  game.seed=raw.seed; game.world=new World(raw.seed,raw.tiles); game.rng=makeRng(raw.seed+'-runtime');
  game.player=freshPlayer(game.world.spawn); Object.assign(game.player,raw.player||{}); game.player.fallStartY=game.player.y; game.player.onPlatform=false; game.player.dropThrough=0;
  game.inventory=raw.inventory&&typeof raw.inventory==='object'?raw.inventory:freshInventory();
  game.hotbar=Array.isArray(raw.hotbar)&&raw.hotbar.length===HOTBAR_SIZE?raw.hotbar:[...HOTBAR_DEFAULT];
  game.selected=Math.max(0,Math.min(7,Number(raw.selected)||0)); game.time=Number(raw.time)||.18; game.objectiveStage=Number(raw.objectiveStage)||0; game.discoveries=Array.isArray(raw.discoveries)?raw.discoveries:[]; game.guardianDefeated=raw.guardianDefeated&&typeof raw.guardianDefeated==='object'?raw.guardianDefeated:{}; game.openedChestCount=Math.max(0,Number(raw.openedChestCount)||0);
  game.enemies=[]; game.drops=[]; game.fx={particles:[],shake:0}; game.relicScanCd=0; game.relicHint=null; game.running=true; game.saveDirty=false; startWorldUi();
}
function startNewWorld(seed) {
  game.seed=String(seed||seedNow()).slice(0,32); game.world=new World(game.seed); game.rng=makeRng(game.seed+'-runtime'); game.player=freshPlayer(game.world.spawn);
  game.inventory=freshInventory(); game.hotbar=[...HOTBAR_DEFAULT]; game.selected=0; game.time=.18; game.objectiveStage=0; game.discoveries=[]; game.guardianDefeated={}; game.openedChestCount=0; game.enemies=[]; game.drops=[]; game.fx={particles:[],shake:0}; game.relicScanCd=0; game.relicHint=null; game.running=true; game.saveDirty=true; startWorldUi(); saveGame(false);
  toast(tr('新世界已生成：先收集青芯木','New world generated: gather Greenheart Wood first'));
}
function startWorldUi() {
  $('#startScreen').classList.add('hidden'); $('#deathScreen').classList.add('hidden'); $('#seedText').textContent=game.seed; renderHotbar(); renderInventory(); renderCraft(); resize();
  game.camera.x=game.player.x-game.cssW/game.camera.tile/2; game.camera.y=game.player.y-game.cssH/game.camera.tile/2; requestAnimationFrame(loop);
}

function toast(text) { const el=$('#toast'); el.textContent=text; el.classList.add('show'); clearTimeout(game.toastTimer); game.toastTimer=setTimeout(()=>el.classList.remove('show'),1900); }
function currentDepth() {
  if(!game.world||!game.player)return 0;
  const x=Math.max(0,Math.min(WORLD_W-1,Math.floor(game.player.x)));
  return Math.max(0,Math.floor(game.player.y-game.world.surface[x]));
}
function currentDepthZone(depth=currentDepth()) {
  let zone=DEPTH_ZONES[0];
  for(const candidate of DEPTH_ZONES)if(depth>=candidate.min)zone=candidate;
  return zone;
}
function updateObjective() {
  let stage=0;
  if(count('wood')>=4)stage=1;
  if(count('workbench')>=1)stage=2;
  if(['wood_pick','stone_pick','copper_pick','iron_pick','delver_pick'].some(id=>count(id)>0))stage=3;
  if(count('copper_ore')>=2||count('copper_bar')>=1||count('copper_pick')>0)stage=4;
  if(count('copper_pick')>0)stage=5;
  if(count('iron_ore')>=2||count('iron_bar')>=1||count('iron_pick')>0)stage=6;
  if(count('iron_pick')>0)stage=7;
  if(count('crystal')>0)stage=8;
  if(stage!==game.objectiveStage){game.objectiveStage=stage;game.saveDirty=true;}
  const copyZh=['砍取青芯木 → 收集至少 4 块','制造木板 → 做出第一张工匠台','制作一把青芯镐 → 开始追踪赤铜','下到浅层洞带 → 采到赤铜矿','熔炼赤铜 → 为下一把镐准备材料','打造赤铜镐 → 前往冷铁深层','采集冷铁 → 升级深层装备','打造冷铁镐 → 寻找星晶裂隙','带回第一块星晶 → 深层循环已打通'];
  const copyEn=['Gather at least 4 Greenheart Wood','Make planks → craft your first Craft Table','Craft a Greenheart Pick → start hunting copper','Reach the shallow caves → mine red copper','Smelt red copper → prepare the next pick','Forge a Copper Pick → descend for cold iron','Gather cold iron → upgrade deep gear','Forge a Cold-Iron Pick → seek the Starshard Rift','Return with your first Star Crystal → deep loop online'];
  $('#objectiveText').textContent=(lang==='zh'?copyZh:copyEn)[Math.min(stage,8)];
}
function relicArrow(dx,dy){if(Math.abs(dx)>Math.abs(dy)*1.45)return dx>0?'→':'←';if(Math.abs(dy)>Math.abs(dx)*1.45)return dy>0?'↓':'↑';return dy>0?(dx>0?'↘':'↙'):(dx>0?'↗':'↖');}
function updateRelicHint(dt){
  game.relicScanCd-=dt;if(game.relicScanCd>0)return;game.relicScanCd=.28;
  const p=game.player,r=18,minX=Math.max(0,Math.floor(p.x-r)),maxX=Math.min(WORLD_W-1,Math.ceil(p.x+r)),minY=Math.max(0,Math.floor(p.y-r)),maxY=Math.min(WORLD_H-1,Math.ceil(p.y+r));let best=null;
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){if(game.world.get(x,y)!==TILE.RELIC_CHEST)continue;const dx=x+.5-p.x,dy=y+.5-p.y,d=Math.hypot(dx,dy);if(d<=r&&(!best||d<best.d))best={x,y,dx,dy,d};}
  game.relicHint=best;
  if(best){$('#objectiveText').textContent=tr(`◆ 遗迹共鸣 ${relicArrow(best.dx,best.dy)} · ${Math.ceil(best.d)}m`,`◆ RELIC SIGNAL ${relicArrow(best.dx,best.dy)} · ${Math.ceil(best.d)}m`);}else updateObjective();
}
function updateProgression(dt) {
  const zone=currentDepthZone();
  if(zone.id!=='surface'&&!game.discoveries.includes(zone.id)){
    game.discoveries.push(zone.id);game.saveDirty=true;
    toast(tr(`发现区域 · ${zone.zh}`,`Region discovered · ${zone.en}`));
    if(game.pointer.kind==='touch'&&navigator.vibrate)navigator.vibrate(22);
    game.fx.shake=Math.max(game.fx.shake,3.5);
  }
  updateRelicHint(dt);
}

function resize() {
  game.cssW=innerWidth; game.cssH=innerHeight; game.dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(game.cssW*game.dpr); canvas.height=Math.round(game.cssH*game.dpr); canvas.style.width=game.cssW+'px';canvas.style.height=game.cssH+'px';
  ctx.setTransform(game.dpr,0,0,game.dpr,0,0); game.camera.tile=Math.max(18,Math.min(34,Math.floor(game.cssH/22)));
}
addEventListener('resize',resize,{passive:true});

function aabbSolid(x,y,w=.72,h=1.72) {
  const minX=Math.floor(x-w/2+.03), maxX=Math.floor(x+w/2-.03), minY=Math.floor(y-h/2+.03), maxY=Math.floor(y+h/2-.03);
  for(let ty=minY;ty<=maxY;ty++)for(let tx=minX;tx<=maxX;tx++)if(game.world.solid(tx,ty))return true;
  return false;
}
function playerTouchesTile(tileId){
  const p=game.player,minX=Math.floor(p.x-p.w*.32),maxX=Math.floor(p.x+p.w*.32),minY=Math.floor(p.y-p.h*.38),maxY=Math.floor(p.y+p.h*.42);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(game.world.get(x,y)===tileId)return true;
  return false;
}
function platformLandingY(x,currentY,nextY,w,h,ignore=false) {
  if(ignore||nextY<=currentY)return null;
  const left=x-w/2+.08,right=x+w/2-.08,from=currentY+h/2,to=nextY+h/2;
  for(let ty=Math.floor(from);ty<=Math.floor(to)+1;ty++){
    if(from>ty+.08||to<ty-.02)continue;
    for(let tx=Math.floor(left);tx<=Math.floor(right);tx++)if(game.world.get(tx,ty)===TILE.PLATFORM)return ty-h/2-.001;
  }
  return null;
}
function applyFallDamage(p,landingY) {
  const distance=Math.max(0,landingY-Number(p.fallStartY??landingY));
  if(distance<=7.5)return;
  const damage=Math.min(70,Math.max(1,Math.round((distance-7.5)*4.2)));
  hurtPlayer(damage,'fall');game.fx.shake=Math.max(game.fx.shake,Math.min(7,2+damage*.08));spawnDebris(p.x,p.y+p.h*.45,'#b69472',Math.min(12,4+Math.floor(damage/5)),.65);haptic(Math.min(30,8+damage));toast(tr(`坠落受伤 · -${damage}`,`Fall damage · -${damage}`));
}
function updatePlayer(dt) {
  const p=game.player; if(!p)return;
  const wasGrounded=p.grounded,wasPlatform=!!p.onPlatform;
  p.dropThrough=Math.max(0,Number(p.dropThrough||0)-dt);
  if(game.input.down&&wasGrounded&&wasPlatform){p.dropThrough=.24;p.grounded=false;p.onPlatform=false;p.y+=.09;p.fallStartY=p.y;}
  const dir=(game.input.right?1:0)-(game.input.left?1:0);
  const accel=p.grounded?32:20, max=5.5;
  if(dir){p.vx+=dir*accel*dt;p.facing=dir;} else p.vx*=Math.pow(.0007,dt);
  if(game.pointer.active&&(game.input.mine||game.input.place)){const q=pointerWorld();if(Math.abs(q.x-p.x)>.18)p.facing=Math.sign(q.x-p.x)||p.facing;}
  p.vx=Math.max(-max,Math.min(max,p.vx));
  const onRope=playerTouchesTile(TILE.ROPE);
  p.coyote=p.grounded?.11:Math.max(0,p.coyote-dt);
  if(onRope){
    p.jumpBuffer=0;p.jumpLatch=game.input.jump;p.grounded=false;p.onPlatform=false;p.fallStartY=p.y;
    const targetVy=game.input.jump?-4.8:game.input.down?4.1:1.15,blend=Math.min(1,dt*(game.input.jump||game.input.down?16:8));
    p.vy+=(targetVy-p.vy)*blend;p.vy=Math.max(-5.2,Math.min(4.3,p.vy));
  }else{
    if(game.input.jump&&!p.jumpLatch){p.jumpBuffer=.12;p.jumpLatch=true;}
    if(!game.input.jump)p.jumpLatch=false;
    p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
    if(p.jumpBuffer>0&&p.coyote>0){p.vy=-10.7;p.grounded=false;p.onPlatform=false;p.coyote=0;p.jumpBuffer=0;}
    p.vy=Math.min(14,p.vy+27*dt);
  }
  const nx=p.x+p.vx*dt;if(!aabbSolid(nx,p.y,p.w,p.h))p.x=nx;else p.vx=0;
  const ny=p.y+p.vy*dt,impactVy=p.vy,platformY=platformLandingY(p.x,p.y,ny,p.w,p.h,p.dropThrough>0||onRope);
  p.onPlatform=false;
  if(platformY!==null){
    p.y=platformY;p.grounded=true;p.onPlatform=true;p.vy=0;if(!wasGrounded&&impactVy>0)applyFallDamage(p,p.y);p.fallStartY=p.y;
  }else if(!aabbSolid(p.x,ny,p.w,p.h)){
    p.y=ny;p.grounded=false;if(p.vy<0||wasGrounded)p.fallStartY=p.y;
  }else{
    if(p.vy>0){p.grounded=true;if(!wasGrounded)applyFallDamage(p,p.y);p.fallStartY=p.y;}p.vy=0;
  }
  if(p.y>WORLD_H+5){hurtPlayer(999,'void');}
  p.x=Math.max(.8,Math.min(WORLD_W-.8,p.x));p.attackFlash=Math.max(0,p.attackFlash-dt);
}
function updateHazards(){
  const p=game.player,minX=Math.floor(p.x-p.w*.42),maxX=Math.floor(p.x+p.w*.42),minY=Math.floor(p.y-p.h*.35),maxY=Math.floor(p.y+p.h*.48);let spike=false;
  for(let y=minY;y<=maxY&&!spike;y++)for(let x=minX;x<=maxX;x++)if(game.world.get(x,y)===TILE.RUIN_SPIKE){spike=true;break;}
  if(spike&&game.hurtCd<=0){hurtPlayer(7,'ruin_spike');spawnDebris(p.x,p.y+.55,'#9a909d',5,.55);game.fx.shake=Math.max(game.fx.shake,2.5);haptic(10);}
}

function pointerWorld() {
  const tile=game.camera.tile;
  return {x:game.camera.x+game.pointer.x/tile,y:game.camera.y+game.pointer.y/tile};
}
function targetInReach(x,y){return Math.hypot(x+.5-game.player.x,y+.5-game.player.y)<=5.25;}
function baseTarget(){
  if(game.pointer.active){const q=pointerWorld();return {x:Math.floor(q.x),y:Math.floor(q.y),qx:q.x,qy:q.y};}
  const x=Math.floor(game.player.x+game.player.facing*2),y=Math.floor(game.player.y);return {x,y,qx:x+.5,qy:y+.5};
}
function assistedEnemyTarget(base){
  let best=null,bestScore=1.8;
  for(const e of game.enemies){
    if(e.dead||Math.hypot(e.x-game.player.x,e.y-game.player.y)>5.25)continue;
    const score=Math.hypot(e.x-base.qx,e.y-base.qy);
    if(score<bestScore){bestScore=score;best={x:Math.floor(e.x),y:Math.floor(e.y)};}
  }
  return best;
}
function reachTarget(mode='aim') {
  const base=baseTarget(),assist=game.pointer.kind==='touch'||game.smartCursor;
  let best={x:base.x,y:base.y,score:0};
  if(assist){
    if(mode!=='place'){const enemy=assistedEnemyTarget(base);if(enemy)return {x:enemy.x,y:enemy.y,ok:true,assisted:true};}
    const radius=game.smartCursor&&game.pointer.kind!=='touch'?2:1,baseTile=game.world.get(base.x,base.y),baseAir=baseTile===TILE.AIR;
    best=mode!=='place'&&!baseAir&&targetInReach(base.x,base.y)?{x:base.x,y:base.y,score:-.4}:null;
    for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
      const x=base.x+ox,y=base.y+oy;if(!targetInReach(x,y))continue;
      const tile=game.world.get(x,y),air=tile===TILE.AIR;
      if(mode==='place'){if(!air||!canPlaceAt(x,y))continue;const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>game.world.get(x+dx,y+dy)!==TILE.AIR);if(!adjacent)continue;}
      else if(air)continue;
      const score=Math.hypot(x+.5-base.qx,y+.5-base.qy)+(Math.abs(ox)+Math.abs(oy))*.06;
      if(!best||score<best.score)best={x,y,score};
    }
    if(!best)best={x:base.x,y:base.y,score:0};
  }
  return {x:best.x,y:best.y,ok:targetInReach(best.x,best.y),assisted:assist&&(best.x!==base.x||best.y!==base.y)};
}

function nearestEnemyAtTarget(t) {
  let best=null,bd=1.15;
  for(const e of game.enemies){if(e.dead)continue;const d=Math.hypot(e.x-(t.x+.5),e.y-(t.y+.5));if(d<bd&&Math.hypot(e.x-game.player.x,e.y-game.player.y)<=5.25){best=e;bd=d;}}
  return best;
}
function attack(e) {
  if(game.attackCd>0||!e)return;
  const weapon=currentWeapon(), damage=weapon.damage||2.5; e.hp-=damage; e.hit=.16; game.attackCd=.32; game.player.attackFlash=.18;spawnDebris(e.x,e.y,e.def.color,5,.9);game.fx.shake=Math.max(game.fx.shake,2.2);haptic(10);
  toast(`${tr('命中','Hit')} ${lang==='zh'?e.def.zh:e.def.en} · -${Math.round(damage)}`);
  if(e.hp<=0)killEnemy(e);
}
function spawnDrop(id,n,x,y) {
  if(!ITEMS[id]||n<=0)return;
  game.drops.push({id,n,x,y:y-.15,vx:(game.rng()-.5)*2.5,vy:-2.8-game.rng()*1.4,age:0,bob:game.rng()*Math.PI*2});
}
function chestKey(x,y){return `${Math.floor(x)},${Math.floor(y)}`;}
function activeChestGuardian(key){return game.enemies.find(e=>!e.dead&&e.elite&&e.chestKey===key)||null;}
function spawnChestGuardian(t,key){
  if(activeChestGuardian(key))return;
  const base=ENEMY_TYPES.ruin_sentinel,depth=Math.max(0,t.y-game.world.surface[Math.max(0,Math.min(WORLD_W-1,t.x))]),zone=currentDepthZone(depth);
  const scale=zone.id==='star'?2.25:zone.id==='iron'?1.9:zone.id==='copper'?1.62:1.45;
  const def={...base,zh:'遗迹守箱者',en:'Relic Warden',hp:Math.round(base.hp*scale),damage:Math.round(base.damage*(1.18+scale*.22)),speed:base.speed*1.08,color:'#c99b58'};
  const side=game.player.x<t.x?-1:1;let gx=t.x+side*2.3,gy=t.y-.55;
  for(const ox of [side*2.3,-side*2.3,side*3.2,-side*3.2]){if(!enemyCollides(t.x+ox,gy,.9,.9)){gx=t.x+ox;break;}}
  game.enemies.push({type:'ruin_sentinel',def,x:gx,y:gy,vx:0,vy:0,hp:def.hp,maxHp:def.hp,dead:false,hit:0,attack:.45,flying:false,dir:-side,elite:true,chestKey:key,specialCd:1.1,windup:0,charge:0});
  game.fx.shake=Math.max(game.fx.shake,5.5);spawnDebris(t.x+.5,t.y+.5,'#d4aa62',14,1.4);haptic(24);
  toast(tr('遗物箱苏醒了守箱者！','The relic cache awakened its warden!'));
}
function openRelicChest(t,key){
  const depth=Math.max(0,t.y-game.world.surface[Math.max(0,Math.min(WORLD_W-1,t.x))]),zone=currentDepthZone(depth),x=t.x+.5,y=t.y+.15;
  game.world.set(t.x,t.y,TILE.AIR);game.openedChestCount++;
  spawnDrop('ancient_core',1,x,y);spawnDrop('coal',2+Math.floor(game.rng()*3),x,y);
  if(zone.id==='star'){spawnDrop('crystal',2+Math.floor(game.rng()*3),x,y);spawnDrop('iron_bar',2,x,y);}
  else if(zone.id==='iron'){spawnDrop('iron_ore',3+Math.floor(game.rng()*3),x,y);if(game.rng()<.55)spawnDrop('crystal',1,x,y);}
  else {spawnDrop('copper_ore',3+Math.floor(game.rng()*3),x,y);spawnDrop('stone',3+Math.floor(game.rng()*3),x,y);}
  if(game.openedChestCount===1){if(count('sentinel_blade')===0)spawnDrop('sentinel_blade',1,x,y);else spawnDrop('delver_pick',1,x,y);}
  else if(game.rng()<.22&&count('delver_pick')===0)spawnDrop('delver_pick',1,x,y);
  else if(game.rng()<.24&&count('sentinel_blade')===0)spawnDrop('sentinel_blade',1,x,y);
  spawnDebris(x,y,'#e0b968',22,1.8);game.fx.shake=Math.max(game.fx.shake,6);haptic(28);game.saveDirty=true;
  toast(tr(`遗物箱开启 · ${zone.zh}`,`Relic cache opened · ${zone.en}`));
}
function tryOpenRelicChest(t){
  if(game.interactCd>0)return;game.interactCd=.45;game.input.mine=false;resetMine();const key=chestKey(t.x,t.y);
  if(!game.guardianDefeated[key]){spawnChestGuardian(t,key);return;}
  openRelicChest(t,key);
}
function killEnemy(e) {
  e.dead=true; const type=e.type;
  if(e.elite&&e.chestKey){game.guardianDefeated[e.chestKey]=true;spawnDebris(e.x,e.y,'#e7bf70',18,1.55);game.fx.shake=Math.max(game.fx.shake,5);toast(tr('守箱者倒下，遗物箱已解锁','Warden defeated. The relic cache is unlocked'));game.saveDirty=true;}
  if(type==='moss_crawler'){spawnDrop('fiber',1+Math.floor(game.rng()*2),e.x,e.y);if(game.rng()<.22)spawnDrop('moss_spore',1,e.x,e.y);}
  else if(type==='ash_scuttler'){spawnDrop('coal',1,e.x,e.y);if(game.rng()<.3)spawnDrop('copper_ore',1,e.x,e.y);}
  else if(type==='shardback'){spawnDrop('ice',1+Math.floor(game.rng()*2),e.x,e.y);if(game.rng()<.18)spawnDrop('crystal',1,e.x,e.y);}
  else if(type==='hollow_wisp'){spawnDrop('moss_spore',1+Math.floor(game.rng()*2),e.x,e.y);}
  else {spawnDrop('ruin_brick',1,e.x,e.y);if(game.rng()<.25)spawnDrop('iron_ore',1,e.x,e.y);}
  game.saveDirty=true;
}
function haptic(ms){if(game.pointer.kind==='touch'&&navigator.vibrate)navigator.vibrate(ms);}
function spawnDebris(wx,wy,color,n=5,force=1){
  for(let i=0;i<n;i++){
    const a=game.rng()*Math.PI*2,speed=(.8+game.rng()*2.2)*force;
    game.fx.particles.push({x:wx+(game.rng()-.5)*.45,y:wy+(game.rng()-.5)*.45,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-1.2,life:.3+game.rng()*.35,max:.65,size:.07+game.rng()*.08,color});
  }
  if(game.fx.particles.length>120)game.fx.particles.splice(0,game.fx.particles.length-120);
}
function mine(dt) {
  const t=reachTarget(); if(!t.ok)return resetMine(); const enemy=nearestEnemyAtTarget(t); if(enemy)return attack(enemy);
  const tile=game.world.get(t.x,t.y),def=TILE_DEFS[tile]; if(!def||tile===TILE.AIR)return resetMine();
  if(tile===TILE.RELIC_CHEST)return tryOpenRelicChest(t);
  const pick=currentPick(), required=Number(def.tier||0); if((pick.tier||0)<required){resetMine();toast(tr(`需要更高等级的镐：${def.zh}`,`A stronger pick is required: ${def.en}`));game.input.mine=false;return;}
  const key=t.x+','+t.y;if(game.mine.key!==key){game.mine.key=key;game.mine.progress=0;}
  const before=game.mine.progress;
  game.mine.progress+=dt*(pick.power||.7)/Math.max(.12,def.hardness||.5);
  if(Math.floor(before*4)!==Math.floor(game.mine.progress*4)){spawnDebris(t.x+.5,t.y+.5,def.color,2,.45);haptic(5);}
  if(game.mine.progress>=1){game.world.set(t.x,t.y,TILE.AIR);if(tile===TILE.RUIN_URN)breakRuinUrn(t);else if(def.drop)spawnDrop(def.drop,1,t.x+.5,t.y+.5);spawnDebris(t.x+.5,t.y+.5,def.color,tile===TILE.RUIN_URN?11:8,tile===TILE.RUIN_URN?1.3:1.1);game.fx.shake=Math.max(game.fx.shake,tile===TILE.RUIN_URN?3.6:2.8);haptic(tile===TILE.RUIN_URN?18:14);game.mine.progress=0;game.saveDirty=true;renderHotbar();}
}
function breakRuinUrn(t){
  const depth=Math.max(0,t.y-game.world.surface[Math.max(0,Math.min(WORLD_W-1,t.x))]),zone=currentDepthZone(depth),x=t.x+.5,y=t.y+.45,roll=game.rng();
  if(roll<.34)spawnDrop('coal',1+Math.floor(game.rng()*2),x,y);
  else if(roll<.58)spawnDrop('torch',1+Math.floor(game.rng()*3),x,y);
  else if(zone.id==='iron'||zone.id==='star')spawnDrop('iron_ore',1+Math.floor(game.rng()*2),x,y);
  else if(zone.id==='copper')spawnDrop('copper_ore',1+Math.floor(game.rng()*2),x,y);
  else spawnDrop(game.rng()<.5?'stone':'rope',1,x,y);
  if(game.rng()<.08)spawnDrop('moss_spore',1,x,y);
}
function resetMine(){game.mine.key='';game.mine.progress=0;}
function canPlaceAt(x,y){if(game.world.get(x,y)!==TILE.AIR)return false;if(Math.abs(x+.5-game.player.x)<.7&&Math.abs(y+.5-game.player.y)<1.4)return false;return true;}
function place(idOverride=null) {
  if(game.placeCd>0)return; const t=reachTarget('place'); if(!t.ok)return; const id=idOverride||(game.autoTool&&count('torch')>0?'torch':selectedId()),item=ITEMS[id]; if(!item?.tile||count(id)<1)return;
  const def=TILE_DEFS[item.tile]; if(!def?.place)return;
  if(!canPlaceAt(t.x,t.y))return;
  const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>game.world.get(t.x+dx,t.y+dy)!==TILE.AIR);
  if(!adjacent&&item.tile!==TILE.TORCH)return;
  game.world.set(t.x,t.y,item.tile);consume(id,1);game.placeCd=.16;spawnDebris(t.x+.5,t.y+.5,def.color,4,.4);game.fx.shake=Math.max(game.fx.shake,1.2);haptic(8);renderHotbar();game.saveDirty=true;
}

function updateActions(dt){game.attackCd=Math.max(0,game.attackCd-dt);game.placeCd=Math.max(0,game.placeCd-dt);game.interactCd=Math.max(0,game.interactCd-dt);game.hurtCd=Math.max(0,game.hurtCd-dt);if(game.uiOpen)return;if(game.input.mine)mine(dt);else resetMine();if(game.input.place)place(game.quickPlaceId);}

function updateDrops(dt){
  const p=game.player;
  for(const d of game.drops){
    d.age+=dt;d.bob+=dt*4.5;const dx=p.x-d.x,dy=p.y-d.y,dist=Math.hypot(dx,dy),important=!!ITEMS[d.id]?.rare||d.id==='ancient_core';
    const magnet=important?8.2:5.4;if(dist<magnet&&d.age>.08){const pull=Math.max(important?12:5,(important?34:22)-dist*(important?3.1:3));d.vx+=dx/Math.max(.15,dist)*pull*dt;d.vy+=dy/Math.max(.15,dist)*pull*dt;}
    d.vy=Math.min(important?6:8,d.vy+13*dt);
    const nx=d.x+d.vx*dt;if(!enemyCollides(nx,d.y,.28,.28))d.x=nx;else d.vx*=-.2;
    const ny=d.y+d.vy*dt;if(!enemyCollides(d.x,ny,.28,.28))d.y=ny;else{d.vy*=-.22;d.vx*=.8;}
    if(dist<.72&&d.age>.1){addItem(d.id,d.n);d.dead=true;spawnDebris(d.x,d.y,ITEMS[d.id]?.rare?'#e9c16b':'#f0d9a2',ITEMS[d.id]?.rare?8:3,ITEMS[d.id]?.rare?.75:.35);haptic(ITEMS[d.id]?.rare?18:4);if(ITEMS[d.id]?.rare)toast(tr(`发现稀有装备 · ${itemName(d.id,'zh')}`,`Rare gear found · ${itemName(d.id,'en')}`));else if(d.id==='ancient_core')toast(tr('获得古代机芯','Ancient Core acquired'));renderHotbar();}
  }
  game.drops=game.drops.filter(d=>!d.dead&&d.age<45);
}
function enemyCollides(x,y,w=.72,h=.72){const minX=Math.floor(x-w/2),maxX=Math.floor(x+w/2),minY=Math.floor(y-h/2),maxY=Math.floor(y+h/2);for(let yy=minY;yy<=maxY;yy++)for(let xx=minX;xx<=maxX;xx++)if(game.world.solid(xx,yy))return true;return false;}
function spawnEnemy() {
  if(game.enemies.filter(e=>!e.dead).length>=11)return;
  const p=game.player, side=game.rng()<.5?-1:1, x=Math.max(3,Math.min(WORLD_W-4,p.x+side*(9+game.rng()*12)));
  const sx=Math.floor(x), surface=game.world.surface[sx], underground=p.y>surface+9;
  let candidates=Object.entries(ENEMY_TYPES).filter(([,d])=>underground?d.underground:(!d.underground&&d.biome===game.world.biome(x).id));
  if(underground&&p.y<68)candidates=candidates.filter(([,d])=>d.flying||game.rng()>.35);
  if(!candidates.length)return; const [type,baseDef]=candidates[Math.floor(game.rng()*candidates.length)];const zone=currentDepthZone();const scale=zone.id==='star'?1.55:zone.id==='iron'?1.32:zone.id==='copper'?1.17:1;const def={...baseDef,hp:Math.round(baseDef.hp*scale),damage:Math.max(1,Math.round(baseDef.damage*(.85+scale*.15)))};
  let y=surface-1;
  if(underground){y=Math.max(surface+6,Math.min(WORLD_H-6,p.y+(game.rng()-.5)*14));for(let tries=0;tries<18&&game.world.solid(x,y);tries++)y+=game.rng()<.5?-1:1;}
  game.enemies.push({type,def,x:x+.5,y:y-.3,vx:0,vy:0,hp:def.hp,maxHp:def.hp,dead:false,hit:0,attack:0,flying:!!def.flying,dir:side*-1});
}
function updateEnemies(dt) {
  const p=game.player;game.spawnTimer-=dt;const night=dayLight()<.42;if(game.spawnTimer<=0){game.spawnTimer=(night?1.6:2.9)+game.rng()*2;spawnEnemy();}
  for(const e of game.enemies){if(e.dead)continue;e.hit=Math.max(0,e.hit-dt);e.attack=Math.max(0,e.attack-dt);const dx=p.x-e.x,dy=p.y-e.y,dist=Math.hypot(dx,dy);if(dist>30)continue;
    const dir=Math.sign(dx)||1;e.dir=dir;
    if(e.elite){
      e.specialCd=Math.max(0,(e.specialCd||0)-dt);
      if(e.windup>0){e.windup-=dt;e.vx*=Math.pow(.03,dt);if(e.windup<=0){e.charge=.34;e.vx=dir*8.2;e.attack=0;game.fx.shake=Math.max(game.fx.shake,3);spawnDebris(e.x,e.y,'#e1b55e',8,.85);}}
      else if(e.charge>0){e.charge-=dt;const nx=e.x+e.vx*dt;if(!enemyCollides(nx,e.y,.82,.82))e.x=nx;else{e.charge=0;e.vx=0;game.fx.shake=Math.max(game.fx.shake,2.4);}if(dist<1.25&&e.attack<=0){hurtPlayer(Math.round(e.def.damage*1.55),e.type);e.attack=1.05;e.charge=0;game.fx.shake=Math.max(game.fx.shake,5.5);haptic(20);}continue;}
      else if(e.specialCd<=0&&dist>2.3&&dist<8.5&&Math.abs(dy)<2.1){e.windup=.62;e.specialCd=2.7;e.vx=0;toast(tr('守箱者正在蓄力冲锋','Relic Warden is charging'));}
    }
    if(e.flying){e.vx+=(dir*e.def.speed-e.vx)*dt*2.7;e.vy+=((Math.sign(dy)*e.def.speed*.75)-e.vy)*dt*2.1;e.x+=e.vx*dt;e.y+=e.vy*dt;}
    else{const speed=e.elite?e.def.speed*.82:e.def.speed;e.vx+=(dir*speed-e.vx)*dt*4;e.vy=Math.min(12,e.vy+25*dt);const nx=e.x+e.vx*dt;if(!enemyCollides(nx,e.y))e.x=nx;else{e.vx=0;if(!e.elite&&game.rng()<.05)e.vy=-7.5;}const ny=e.y+e.vy*dt;if(!enemyCollides(e.x,ny))e.y=ny;else e.vy=0;}
    if(dist<1.05&&e.attack<=0){hurtPlayer(e.def.damage,e.type);e.attack=e.elite?1.05:.85;}
  }
  game.enemies=game.enemies.filter(e=>!e.dead&&Math.abs(e.x-p.x)<48&&e.y<WORLD_H+8);
}
function updateFx(dt){
  game.fx.shake=Math.max(0,game.fx.shake-dt*12);
  for(const p of game.fx.particles){p.life-=dt;p.vy+=8*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
  game.fx.particles=game.fx.particles.filter(p=>p.life>0);
}
function hurtPlayer(amount,source='enemy') {
  if(game.hurtCd>0&&amount<999&&source!=='fall')return;const p=game.player;p.hp=Math.max(0,p.hp-amount);game.hurtCd=.65;if(source!=='fall')p.vx-=p.facing*2.2;if(p.hp<=0)die(source);
}
function die(source) {
  game.input.left=game.input.right=game.input.jump=game.input.mine=game.input.place=false;game.running=false;saveGame(false);
  const lost=[];for(const [id,n] of Object.entries(game.inventory)){if(ITEMS[id]?.kind==='material'&&n>2){const d=Math.max(1,Math.floor(n*.25));game.inventory[id]-=d;lost.push(`${itemName(id,lang)} ×${d}`);}}
  $('#deathText').textContent=lost.length?tr('你在撤回营地时遗失了：','You lost while retreating to camp: ')+lost.slice(0,4).join(' · '):tr('你保住了随身物资。','You kept your carried supplies.');$('#deathScreen').classList.remove('hidden');
}
function respawn(){const p=game.player,p0=game.world.spawn;p.x=p0.x;p.y=p0.y;p.vx=p.vy=0;p.hp=p.maxHp;game.enemies=[];game.drops=[];game.running=true;$('#deathScreen').classList.add('hidden');game.saveDirty=true;saveGame(false);game.last=performance.now();requestAnimationFrame(loop);}

function nearStation(station) {
  const target=station==='workbench'?TILE.WORKBENCH:TILE.CAMPFIRE,p=game.player;
  for(let y=Math.floor(p.y)-4;y<=Math.floor(p.y)+4;y++)for(let x=Math.floor(p.x)-4;x<=Math.floor(p.x)+4;x++)if(game.world.get(x,y)===target)return true;
  return false;
}
function stationAvailable(station){return !station||nearStation(station);}
function updateCampfireRest(dt){
  const p=game.player;if(!p||p.hp>=p.maxHp||game.hurtCd>0||!nearStation('campfire'))return;
  p.hp=Math.min(p.maxHp,p.hp+2.4*dt);game.restFx-=dt;if(game.restFx<=0){game.restFx=.5;spawnDebris(p.x,p.y+.5,'#e69a55',1,.22);}
}

function canCraft(r){return stationAvailable(r.station)&&Object.entries(r.need).every(([id,n])=>count(id)>=n);}
function craft(r) {
  if(!canCraft(r)){toast(r.station&&!stationAvailable(r.station)?tr('需要靠近对应制造设施','Move closer to the required crafting station'):tr('材料不足','Not enough materials'));return;}
  for(const [id,n] of Object.entries(r.need))consume(id,n);addItem(r.out.id,r.out.n);if(['pick','weapon'].includes(ITEMS[r.out.id]?.kind))game.hotbar[game.selected]=r.out.id;renderInventory();renderCraft();renderHotbar();toast(`${tr('制造','Crafted')} · ${itemName(r.out.id,lang)} ×${r.out.n}`);
}
function renderInventory() {
  const view=$('#inventoryView');if(!view)return;const rows=Object.entries(game.inventory).filter(([,n])=>n>0).sort((a,b)=>(ITEMS[a[0]]?.kind||'').localeCompare(ITEMS[b[0]]?.kind||'')||a[0].localeCompare(b[0]));
  if(!rows.length){view.innerHTML=`<div class="inv-empty">${tr('行囊还是空的。先从地表开始采集。','Your pack is empty. Start gathering at the surface.')}</div>`;return;}
  view.innerHTML='<div class="inv-grid">'+rows.map(([id,n])=>`<button class="inv-item${selectedId()===id?' active':''}${ITEMS[id]?.rare?' rare':''}" data-equip="${id}"><b>${GLYPH[id]||'•'} ${itemName(id,lang)}</b><span>× ${n}</span></button>`).join('')+'</div>';
  view.querySelectorAll('[data-equip]').forEach(btn=>btn.onclick=()=>equipToHotbar(btn.dataset.equip));
}
function equipToHotbar(id){game.hotbar[game.selected]=id;renderHotbar();renderInventory();game.saveDirty=true;}
function renderCraft() {
  const view=$('#craftView');if(!view)return;const wb=game.world&&nearStation('workbench'),cf=game.world&&nearStation('campfire');$('#stationText').textContent=tr(`附近设施：${wb?'工匠台 ':''}${cf?'熔火堆':''}${!wb&&!cf?'徒手制造':''}`,`Nearby: ${wb?'Craft Table ':''}${cf?'Ember Pit':''}${!wb&&!cf?'Hand crafting':''}`);
  view.innerHTML='<div class="recipe-list">'+RECIPES.map((r,i)=>{const can=game.world&&canCraft(r);const need=Object.entries(r.need).map(([id,n])=>`${itemName(id,lang)} ${count(id)}/${n}`).join(' · ');const station=r.station?`<span class="station">${r.station==='workbench'?tr('工匠台','Craft Table'):tr('熔火堆','Ember Pit')}</span>`:'';return `<button class="recipe ${can?'can':'locked'}" data-recipe="${i}"><span class="name">${itemName(r.out.id,lang)} ×${r.out.n}</span>${station}<span class="need">${need}</span></button>`;}).join('')+'</div>';
  view.querySelectorAll('[data-recipe]').forEach(btn=>btn.onclick=()=>craft(RECIPES[+btn.dataset.recipe]));
}
function renderHotbar() {
  const bar=$('#hotbar');bar.innerHTML=game.hotbar.map((id,i)=>{const n=count(id),def=ITEMS[id],has=n>1;return `<button class="hot-slot${i===game.selected?' active':''}${has?' has-count':''}" data-slot="${i}" title="${def?itemName(id,lang):''}"><span class="key">${i+1}</span><span class="glyph">${GLYPH[id]||'·'}</span><span class="label">${def?itemName(id,lang):'—'}</span>${has?`<span class="count">${n}</span>`:''}</button>`;}).join('');bar.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{game.selected=+b.dataset.slot;renderHotbar();renderInventory();game.saveDirty=true;});
}

function dayLight(){const phase=(game.time%1);return Math.max(.13,Math.min(1,.18+.95*Math.max(0,Math.sin(phase*Math.PI*2-Math.PI/2)*.5+.5)));}
function timeLabel(){const t=(game.time%1)*24;const hour=Math.floor((t+6)%24);return `${String(hour).padStart(2,'0')}:${String(Math.floor((t*60)%60)).padStart(2,'0')}`;}
function updateHud(){const p=game.player;if(!p)return;$('#hpFill').style.width=(100*p.hp/p.maxHp)+'%';$('#hpText').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;const b=game.world.biome(p.x);$('#biomeText').textContent=lang==='zh'?b.zh:b.en;const surface=game.world.surface[Math.max(0,Math.min(WORLD_W-1,Math.floor(p.x)))];const depth=Math.max(0,Math.floor(p.y-surface)),zone=currentDepthZone(depth);$('#depthText').textContent=depth<3?tr(zone.zh,zone.en):tr(`${zone.zh} · ${depth}m`,`${zone.en} · ${depth}m`);$('#timeText').textContent=timeLabel()+' · '+(dayLight()<.38?tr('深夜','Night'):dayLight()<.68?tr('暮光','Twilight'):tr('白昼','Day'));}

function tileRect(tx,ty){const s=game.camera.tile;return {x:Math.floor((tx-game.camera.x)*s),y:Math.floor((ty-game.camera.y)*s),s};}
function wrapScreen(v,m){return ((v%m)+m)%m;}
function drawBiomeParallax(b,deep,s){
  if(deep>.34)return;const fade=Math.max(0,1-deep*3),w=game.cssW,h=game.cssH,scroll=game.camera.x*s;
  ctx.save();ctx.globalAlpha=.18*fade;
  if(b.id==='verdant'){
    ctx.fillStyle='#183c38';
    for(let i=0;i<12;i++){const x=wrapScreen(i*143-scroll*.12,w+190)-95,base=h*.82,r=58+(i%4)*16;ctx.beginPath();ctx.arc(x,base-r*.35,r,Math.PI,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=.24*fade;ctx.fillStyle='#102f2a';
    for(let i=0;i<18;i++){const x=wrapScreen(i*109-scroll*.22,w+140)-70,base=h*.88,th=54+(i*31%95);ctx.fillRect(x-4,base-th,8,th);ctx.beginPath();ctx.arc(x,base-th,22+(i%3)*5,0,Math.PI*2);ctx.fill();}
  }else if(b.id==='ember'){
    ctx.fillStyle='#4c2827';
    for(let i=0;i<10;i++){const x=wrapScreen(i*181-scroll*.13,w+230)-115,base=h*.86,bw=95+(i%3)*34,bh=75+(i*29%100);ctx.beginPath();ctx.moveTo(x-bw*.5,base);ctx.lineTo(x-bw*.38,base-bh*.72);ctx.lineTo(x-bw*.18,base-bh);ctx.lineTo(x+bw*.28,base-bh);ctx.lineTo(x+bw*.46,base);ctx.closePath();ctx.fill();}
    ctx.globalAlpha=.26*fade;ctx.fillStyle='#351c20';
    for(let i=0;i<15;i++){const x=wrapScreen(i*127-scroll*.24,w+180)-90,base=h*.9,bh=45+(i*47%115),bw=22+(i%4)*8;ctx.fillRect(x-bw*.5,base-bh,bw,bh);ctx.fillRect(x-bw*.8,base-bh,bw*1.6,9);}
  }else{
    ctx.fillStyle='#314c68';
    for(let i=0;i<11;i++){const x=wrapScreen(i*166-scroll*.11,w+220)-110,base=h*.88,mh=105+(i*41%150),mw=120+(i%3)*35;ctx.beginPath();ctx.moveTo(x-mw*.6,base);ctx.lineTo(x,base-mh);ctx.lineTo(x+mw*.62,base);ctx.closePath();ctx.fill();ctx.globalAlpha=.3*fade;ctx.fillStyle='#a8c8d5';ctx.beginPath();ctx.moveTo(x-mw*.14,base-mh*.76);ctx.lineTo(x,base-mh);ctx.lineTo(x+mw*.15,base-mh*.74);ctx.lineTo(x+mw*.04,base-mh*.8);ctx.closePath();ctx.fill();ctx.globalAlpha=.18*fade;ctx.fillStyle='#314c68';}
    ctx.globalAlpha=.23*fade;ctx.fillStyle='#203b52';
    for(let i=0;i<13;i++){const x=wrapScreen(i*137-scroll*.23,w+170)-85,base=h*.91,mh=65+(i*53%105);ctx.beginPath();ctx.moveTo(x-58,base);ctx.lineTo(x,base-mh);ctx.lineTo(x+62,base);ctx.closePath();ctx.fill();}
  }
  ctx.restore();
}
function drawBackdrop() {
  const p=game.player,b=game.world.biome(p.x),light=dayLight(),depth=currentDepth(),deep=Math.max(0,Math.min(1,(depth-5)/42)),grad=ctx.createLinearGradient(0,0,0,game.cssH);
  grad.addColorStop(0,mixColor(mixColor('#111a24','#0a1116',deep),b.sky,light*(1-deep*.85)));grad.addColorStop(1,mixColor('#090f13',b.deep,Math.min(1,light+.12)*(1-deep*.65)));ctx.fillStyle=grad;ctx.fillRect(0,0,game.cssW,game.cssH);
  if(deep<.2){const phase=(game.time%1)*Math.PI*2,orbX=(.5+.46*Math.sin(phase))*game.cssW,orbY=(.65-.5*Math.cos(phase))*game.cssH;ctx.globalAlpha=(.18+.35*light)*(1-deep*5);ctx.fillStyle=light>.45?'#f2d59a':'#b8d3e9';ctx.beginPath();ctx.arc(orbX,orbY,26,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  const s=game.camera.tile;drawBiomeParallax(b,deep,s);
  if(deep>.08){ctx.fillStyle=`rgba(63,77,82,${.08+deep*.12})`;for(let i=0;i<11;i++){const x=wrapScreen(i*151-game.camera.x*s*.08,game.cssW+260)-130,y=80+(i*83%Math.max(100,game.cssH-160));ctx.beginPath();ctx.ellipse(x,y,80+i%3*30,18+i%4*6,-.08,0,Math.PI*2);ctx.fill();}}
}
function mixColor(a,b,t){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),ar=pa>>16,ag=pa>>8&255,ab=pa&255,br=pb>>16,bg=pb>>8&255,bb=pb&255;return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;}
function drawTile(tx,ty,id) {
  const def=TILE_DEFS[id];if(!def||id===TILE.AIR)return;const {x,y,s}=tileRect(tx,ty);if(x+s<0||y+s<0||x>game.cssW||y>game.cssH)return;
  if(id===TILE.LEAF||id===TILE.GLOW_MOSS||id===TILE.TORCH||id===TILE.CAMPFIRE||id===TILE.RUIN_SPIKE||id===TILE.RUIN_URN||id===TILE.ROPE||id===TILE.PLATFORM){drawNonSolidTile(x,y,s,id,def);return;}
  ctx.fillStyle=def.color;ctx.fillRect(x,y,s+1,s+1);const h=((tx*73856093)^(ty*19349663)^(id*83492791))>>>0;ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(x+2+(h%5),y+2+((h>>3)%5),Math.max(2,s*.22),Math.max(1,s*.08));ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x,y+s-3,s,3);
  if([TILE.COAL,TILE.COPPER,TILE.IRON,TILE.CRYSTAL].includes(id)){ctx.fillStyle=id===TILE.COAL?'#171a1d':id===TILE.COPPER?'#d07850':id===TILE.IRON?'#c2c7c7':'#b3a4ff';for(let k=0;k<3;k++){const ox=3+((h>>(k*4))%Math.max(4,s-8)),oy=4+((h>>(k*6+2))%Math.max(4,s-9));ctx.fillRect(x+ox,y+oy,Math.max(2,s*.12),Math.max(2,s*.12));}}
  if(id===TILE.WOOD){ctx.fillStyle='rgba(55,31,19,.3)';ctx.fillRect(x+s*.45,y,s*.12,s);}if(id===TILE.WORKBENCH){ctx.fillStyle='#5d3d28';ctx.fillRect(x+2,y+s*.28,s-4,s*.18);ctx.fillRect(x+s*.18,y+s*.45,s*.12,s*.55);ctx.fillRect(x+s*.7,y+s*.45,s*.12,s*.55);}if(id===TILE.RUIN){ctx.strokeStyle='rgba(209,190,218,.18)';ctx.strokeRect(x+1,y+1,s-2,s-2);}if(id===TILE.RELIC_CHEST){const pulse=.55+.45*Math.sin(performance.now()*.004+tx);ctx.fillStyle='#49371f';ctx.fillRect(x+s*.08,y+s*.3,s*.84,s*.62);ctx.fillStyle='#8e6c3b';ctx.fillRect(x+s*.05,y+s*.24,s*.9,s*.18);ctx.fillStyle='#d3a95d';ctx.fillRect(x+s*.44,y+s*.28,s*.13,s*.48);ctx.fillStyle=`rgba(240,202,112,${.2+pulse*.3})`;ctx.fillRect(x+s*.32,y+s*.12,s*.36,s*.16);ctx.strokeStyle='#2e2418';ctx.lineWidth=Math.max(1,s*.05);ctx.strokeRect(x+s*.08,y+s*.3,s*.84,s*.62);}
}
function drawNonSolidTile(x,y,s,id,def){
  if(id===TILE.LEAF){ctx.fillStyle=def.color;ctx.globalAlpha=.88;ctx.beginPath();ctx.arc(x+s*.5,y+s*.5,s*.48,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;return;}
  if(id===TILE.GLOW_MOSS){ctx.fillStyle='rgba(82,211,166,.16)';ctx.beginPath();ctx.arc(x+s*.5,y+s*.5,s*.62,0,Math.PI*2);ctx.fill();ctx.fillStyle=def.color;ctx.fillRect(x+s*.25,y+s*.58,s*.5,Math.max(2,s*.12));return;}
  if(id===TILE.TORCH){ctx.fillStyle='#6d4932';ctx.fillRect(x+s*.47,y+s*.4,Math.max(2,s*.1),s*.55);ctx.fillStyle='#ffc568';ctx.beginPath();ctx.arc(x+s*.52,y+s*.28,s*.16,0,Math.PI*2);ctx.fill();return;}
  if(id===TILE.CAMPFIRE){ctx.fillStyle='#74513b';ctx.fillRect(x+s*.18,y+s*.72,s*.64,s*.12);ctx.fillStyle='#ed804c';ctx.beginPath();ctx.moveTo(x+s*.5,y+s*.18);ctx.lineTo(x+s*.25,y+s*.72);ctx.lineTo(x+s*.72,y+s*.72);ctx.closePath();ctx.fill();return;}
  if(id===TILE.RUIN_SPIKE){ctx.fillStyle='#4b454f';ctx.fillRect(x+s*.08,y+s*.82,s*.84,s*.12);ctx.fillStyle=def.color;for(let i=0;i<4;i++){const bx=x+s*(.12+i*.22);ctx.beginPath();ctx.moveTo(bx,y+s*.82);ctx.lineTo(bx+s*.1,y+s*.25);ctx.lineTo(bx+s*.2,y+s*.82);ctx.closePath();ctx.fill();}return;}
  if(id===TILE.RUIN_URN){ctx.fillStyle='#5c493b';ctx.fillRect(x+s*.29,y+s*.25,s*.42,s*.12);ctx.fillStyle=def.color;ctx.beginPath();ctx.moveTo(x+s*.25,y+s*.39);ctx.quadraticCurveTo(x+s*.16,y+s*.58,x+s*.27,y+s*.83);ctx.quadraticCurveTo(x+s*.5,y+s*.96,x+s*.73,y+s*.83);ctx.quadraticCurveTo(x+s*.84,y+s*.58,x+s*.75,y+s*.39);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(220,190,151,.28)';ctx.lineWidth=Math.max(1,s*.04);ctx.beginPath();ctx.moveTo(x+s*.32,y+s*.55);ctx.lineTo(x+s*.67,y+s*.55);ctx.stroke();return;}
  if(id===TILE.ROPE){ctx.strokeStyle=def.color;ctx.lineWidth=Math.max(2,s*.07);ctx.beginPath();ctx.moveTo(x+s*.5,y-s*.05);ctx.lineTo(x+s*.5,y+s*1.05);ctx.stroke();ctx.strokeStyle='rgba(70,47,29,.55)';ctx.lineWidth=Math.max(1,s*.035);for(let k=1;k<=3;k++){const ky=y+s*k*.25;ctx.beginPath();ctx.moveTo(x+s*.39,ky);ctx.lineTo(x+s*.61,ky);ctx.stroke();}return;}
  if(id===TILE.PLATFORM){ctx.fillStyle='#513b29';ctx.fillRect(x+s*.04,y+s*.18,s*.92,Math.max(3,s*.16));ctx.fillStyle=def.color;ctx.fillRect(x+s*.04,y+s*.1,s*.92,Math.max(3,s*.14));ctx.fillStyle='rgba(238,212,168,.22)';for(let k=1;k<4;k++)ctx.fillRect(x+s*k/4,y+s*.11,1,s*.14);}
}
function drawWorld() {
  const s=game.camera.tile,minX=Math.max(0,Math.floor(game.camera.x)-1),maxX=Math.min(WORLD_W-1,Math.ceil(game.camera.x+game.cssW/s)+1),minY=Math.max(0,Math.floor(game.camera.y)-1),maxY=Math.min(WORLD_H-1,Math.ceil(game.camera.y+game.cssH/s)+1);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)drawTile(x,y,game.world.get(x,y));
}
function drawDrops(){
  const s=game.camera.tile;
  for(const d of game.drops){const x=(d.x-game.camera.x)*s,y=(d.y-game.camera.y)*s+Math.sin(d.bob)*2;if(x<-30||x>game.cssW+30||y<-30||y>game.cssH+30)continue;ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,s*.18,s*.25,s*.09,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=ITEMS[d.id]?.tile?TILE_DEFS[ITEMS[d.id].tile]?.color||'#d8c18b':'#d8c18b';ctx.fillRect(-s*.18,-s*.18,s*.36,s*.36);ctx.strokeStyle='rgba(245,232,192,.7)';ctx.strokeRect(-s*.18,-s*.18,s*.36,s*.36);if(d.n>1){ctx.fillStyle='#fff3d1';ctx.font=`700 ${Math.max(8,s*.28)}px system-ui`;ctx.fillText(String(d.n),s*.12,s*.28);}ctx.restore();}
}
function drawHeldItem(s,w,h){
  let id=selectedId(),item=selectedItem();
  if(game.input.mine){const t=reachTarget(),enemy=t.ok?nearestEnemyAtTarget(t):null;item=enemy?currentWeapon():currentPick();id=item?.id||id;}
  if(!item||(!game.input.mine&&count(id)<=0))return;
  const q=game.pointer.active?pointerWorld():{x:game.player.x+game.player.facing*2,y:game.player.y},dx=(q.x-game.player.x)*game.player.facing,dy=q.y-game.player.y,aim=Math.atan2(dy,Math.max(.45,Math.abs(dx)))*.72;
  const miningSwing=game.input.mine?(-.16+Math.sin(performance.now()*.024)*.48):0,swing=game.player.attackFlash>0?-.72:miningSwing;
  ctx.save();ctx.translate(w*.34,h*.08);ctx.rotate(aim+swing);
  if(item.kind==='pick'){
    ctx.strokeStyle='#7c5a3d';ctx.lineWidth=Math.max(2,s*.08);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w*.82,h*.34);ctx.stroke();
    ctx.strokeStyle=id==='delver_pick'?'#e0b85f':id==='iron_pick'?'#c3c9cb':id==='copper_pick'?'#d17b56':id==='stone_pick'?'#8f999f':'#b08459';ctx.lineWidth=Math.max(3,s*.11);ctx.beginPath();ctx.moveTo(w*.58,h*.16);ctx.lineTo(w*.92,h*.05);ctx.stroke();
  }else if(item.kind==='weapon'){
    ctx.strokeStyle=id==='sentinel_blade'?'#e0b85f':id==='crystal_blade'?'#b7adff':id==='iron_blade'?'#c5cccf':id==='copper_blade'?'#d7815b':id==='stone_blade'?'#9aa1a3':'#b58a5f';ctx.lineWidth=Math.max(3,s*.1);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w*.88,-h*.25);ctx.stroke();ctx.strokeStyle='#6e4d33';ctx.lineWidth=Math.max(2,s*.07);ctx.beginPath();ctx.moveTo(w*.08,-h*.02);ctx.lineTo(w*.31,h*.13);ctx.stroke();
  }else if(item.tile){ctx.fillStyle=TILE_DEFS[item.tile]?.color||'#b8a27c';ctx.fillRect(w*.32,-h*.18,w*.34,w*.34);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.strokeRect(w*.32,-h*.18,w*.34,w*.34);}
  ctx.restore();
}
function drawPlayer(){
  const p=game.player,s=game.camera.tile,x=(p.x-game.camera.x)*s,y=(p.y-game.camera.y)*s,w=p.w*s,h=p.h*s;ctx.save();ctx.translate(x,y);if(p.facing<0)ctx.scale(-1,1);
  const walk=Math.sin(performance.now()*.018)*Math.min(1,Math.abs(p.vx)/3.5);ctx.fillStyle=game.hurtCd>0?'#f0a094':'#d7c3a6';ctx.fillRect(-w*.3,-h*.45,w*.6,h*.34);ctx.fillStyle='#334c4f';ctx.fillRect(-w*.38,-h*.08,w*.76,h*.55);ctx.fillStyle='#1c282b';ctx.fillRect(-w*.34+walk*2,h*.46,w*.26,h*.42);ctx.fillRect(w*.08-walk*2,h*.46,w*.26,h*.42);ctx.fillStyle='#6a4a35';ctx.fillRect(-w*.36,-h*.56,w*.72,h*.14);ctx.fillStyle='#e3d5b7';ctx.fillRect(w*.08,-h*.36,w*.08,h*.06);
  drawHeldItem(s,w,h);
  if(p.attackFlash>0){ctx.strokeStyle='#f0d08f';ctx.lineWidth=Math.max(2,s*.08);ctx.beginPath();ctx.arc(w*.2,0,w*1.4,-.8,.65);ctx.stroke();}ctx.restore();
}
function drawEnemyBody(e,s){
  const c=e.def.color,t=e.type;ctx.fillStyle=c;
  if(t==='moss_crawler'){
    ctx.beginPath();ctx.ellipse(0,s*.04,s*.48,s*.3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#46683e';ctx.beginPath();ctx.arc(-s*.1,-s*.13,s*.31,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle='#365130';ctx.lineWidth=Math.max(2,s*.06);for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*s*.12,-s*.26);ctx.lineTo(i*s*.14,-s*.4-Math.abs(i)*s*.025);ctx.stroke();}
  }else if(t==='ash_scuttler'){
    ctx.beginPath();ctx.ellipse(0,0,s*.34,s*.23,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#71352e';ctx.lineWidth=Math.max(2,s*.06);for(const side of [-1,1])for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(side*s*.18,i*s*.1);ctx.lineTo(side*s*(.43+Math.abs(i)*.05),s*(.18+i*.16));ctx.stroke();}ctx.fillStyle='#f0a05e';ctx.fillRect(e.dir>0?s*.12:-s*.2,-s*.08,s*.07,s*.07);
  }else if(t==='shardback'){
    ctx.beginPath();ctx.ellipse(0,s*.05,s*.43,s*.29,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b7d9e8';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*s*.14,-s*.16);ctx.lineTo(i*s*.11,-s*(.48-Math.abs(i)*.05));ctx.lineTo((i+.65)*s*.14,-s*.14);ctx.closePath();ctx.fill();}ctx.fillStyle='#1d3543';ctx.fillRect(e.dir>0?s*.14:-s*.22,-s*.02,s*.07,s*.07);
  }else if(t==='hollow_wisp'){
    ctx.globalAlpha=.22;ctx.beginPath();ctx.arc(0,0,s*.62,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(0,0,s*.31,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d5fff2';ctx.beginPath();ctx.arc(-s*.07,-s*.06,s*.08,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=c;ctx.lineWidth=Math.max(2,s*.05);ctx.beginPath();ctx.moveTo(-s*.12,s*.25);ctx.quadraticCurveTo(0,s*.52,s*.15,s*.28);ctx.stroke();
  }else{
    ctx.fillStyle='#5c5069';ctx.fillRect(-s*.34,-s*.34,s*.68,s*.68);ctx.fillStyle=c;ctx.fillRect(-s*.25,-s*.26,s*.5,s*.52);ctx.fillStyle='#c9b4dc';ctx.fillRect(-s*.07,-s*.12,s*.14,s*.14);ctx.strokeStyle='#43394d';ctx.lineWidth=Math.max(2,s*.07);ctx.strokeRect(-s*.34,-s*.34,s*.68,s*.68);
  }
}
function drawEnemies(){
  const s=game.camera.tile;for(const e of game.enemies){if(e.dead)continue;const x=(e.x-game.camera.x)*s,y=(e.y-game.camera.y)*s;if(x<-60||x>game.cssW+60||y<-60||y>game.cssH+60)continue;ctx.save();ctx.translate(x,y);if(e.dir<0)ctx.scale(-1,1);if(e.elite){const pulse=.72+.28*Math.sin(performance.now()*.007);ctx.strokeStyle=e.windup>0?`rgba(255,116,76,${pulse})`:`rgba(234,190,96,${pulse})`;ctx.lineWidth=Math.max(2,s*.08);ctx.beginPath();ctx.arc(0,0,s*(e.windup>0?.72:.58),0,Math.PI*2);ctx.stroke();ctx.fillStyle=e.windup>0?`rgba(235,87,49,${.09+pulse*.08})`:`rgba(223,171,76,${.07+pulse*.05})`;ctx.beginPath();ctx.arc(0,0,s*(e.windup>0?.8:.7),0,Math.PI*2);ctx.fill();if(e.windup>0){ctx.strokeStyle=`rgba(255,199,113,${.55+pulse*.35})`;ctx.lineWidth=Math.max(1,s*.045);ctx.beginPath();ctx.moveTo(s*.45,0);ctx.lineTo(s*2.1,0);ctx.stroke();}if(e.charge>0){ctx.globalAlpha=.22;ctx.fillStyle='#f1b95a';ctx.fillRect(-s*1.8,-s*.28,s*1.8,s*.56);ctx.globalAlpha=1;}}if(e.hit>0)ctx.globalAlpha=.52;drawEnemyBody(e,s);ctx.globalAlpha=1;if(e.elite||e.hp<e.maxHp){ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(-s*.48,-s*.7,s*.96,4);ctx.fillStyle=e.elite?'#d5a44e':'#c76658';ctx.fillRect(-s*.48,-s*.7,s*.96*(e.hp/e.maxHp),4);}ctx.restore();}
}
const lightCanvas=document.createElement('canvas'),lightCtx=lightCanvas.getContext('2d');
function ensureLightBuffer(){const w=Math.max(1,Math.round(game.cssW)),h=Math.max(1,Math.round(game.cssH));if(lightCanvas.width!==w||lightCanvas.height!==h){lightCanvas.width=w;lightCanvas.height=h;}}
function punchLight(px,py,r,strength=1){const g=lightCtx.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(0,0,0,${strength})`);g.addColorStop(.45,`rgba(0,0,0,${strength*.72})`);g.addColorStop(1,'rgba(0,0,0,0)');lightCtx.fillStyle=g;lightCtx.beginPath();lightCtx.arc(px,py,r,0,Math.PI*2);lightCtx.fill();}
function drawLighting(){
  const depth=currentDepth(),night=1-dayLight(),dark=Math.min(.88,Math.max(night*.5,depth<=2?0:0.18+depth*.009));if(dark<.04)return;
  ensureLightBuffer();lightCtx.clearRect(0,0,lightCanvas.width,lightCanvas.height);lightCtx.globalCompositeOperation='source-over';lightCtx.fillStyle=`rgba(3,7,10,${dark})`;lightCtx.fillRect(0,0,lightCanvas.width,lightCanvas.height);lightCtx.globalCompositeOperation='destination-out';
  const s=game.camera.tile,p=game.player;punchLight((p.x-game.camera.x)*s,(p.y-game.camera.y)*s,s*(depth>8?2.35:3.2),.88);
  const minX=Math.max(0,Math.floor(game.camera.x)-1),maxX=Math.min(WORLD_W-1,Math.ceil(game.camera.x+game.cssW/s)+1),minY=Math.max(0,Math.floor(game.camera.y)-1),maxY=Math.min(WORLD_H-1,Math.ceil(game.camera.y+game.cssH/s)+1);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const id=game.world.get(x,y);if(id===TILE.TORCH)punchLight((x+.5-game.camera.x)*s,(y+.5-game.camera.y)*s,s*5.2,1);else if(id===TILE.CAMPFIRE)punchLight((x+.5-game.camera.x)*s,(y+.5-game.camera.y)*s,s*6.4,1);else if(id===TILE.CRYSTAL||id===TILE.GLOW_MOSS||id===TILE.RELIC_CHEST)punchLight((x+.5-game.camera.x)*s,(y+.5-game.camera.y)*s,s*(id===TILE.CRYSTAL?2.8:id===TILE.RELIC_CHEST?2.25:1.7),id===TILE.RELIC_CHEST?.36:.55);}
  lightCtx.globalCompositeOperation='source-over';ctx.drawImage(lightCanvas,0,0,game.cssW,game.cssH);
}
function drawTarget(){const t=reachTarget();if(!t.ok)return;const {x,y,s}=tileRect(t.x,t.y);ctx.strokeStyle=t.assisted?'rgba(114,215,184,.95)':'rgba(242,216,158,.86)';ctx.lineWidth=t.assisted?2:1.4;ctx.strokeRect(x+.8,y+.8,s-1.6,s-1.6);if(game.mine.key===t.x+','+t.y&&game.mine.progress>0){const p=Math.min(1,game.mine.progress);ctx.strokeStyle=`rgba(255,238,203,${.25+p*.7})`;ctx.lineWidth=Math.max(1,1+p*1.6);ctx.beginPath();ctx.moveTo(x+s*.18,y+s*.2);ctx.lineTo(x+s*(.38+p*.08),y+s*.48);ctx.lineTo(x+s*.24,y+s*.82);ctx.moveTo(x+s*.78,y+s*.16);ctx.lineTo(x+s*(.58-p*.08),y+s*.45);ctx.lineTo(x+s*.76,y+s*.78);if(p>.48){ctx.moveTo(x+s*.46,y+s*.08);ctx.lineTo(x+s*.5,y+s*.33);ctx.lineTo(x+s*.37,y+s*.63);ctx.lineTo(x+s*.52,y+s*.92);}ctx.stroke();}}
function drawFx(){
  const s=game.camera.tile;
  for(const p of game.fx.particles){const x=(p.x-game.camera.x)*s,y=(p.y-game.camera.y)*s,a=Math.max(0,p.life/p.max);ctx.globalAlpha=a;ctx.fillStyle=p.color;const q=Math.max(2,p.size*s);ctx.fillRect(x-q/2,y-q/2,q,q);}
  ctx.globalAlpha=1;
}
function render(){ctx.save();if(game.fx.shake>0)ctx.translate((game.rng()-.5)*game.fx.shake,(game.rng()-.5)*game.fx.shake);drawBackdrop();drawWorld();drawEnemies();drawDrops();drawPlayer();drawTarget();drawFx();ctx.restore();drawLighting();updateHud();updateTargetTip();}
function updateTargetTip(){if(!game.pointer.active){$('#targetTip').classList.remove('show');return;}const t=reachTarget();if(!t.ok){$('#targetTip').textContent=tr('超出触及范围','Out of reach');$('#targetTip').classList.add('show');return;}const e=nearestEnemyAtTarget(t);if(e)$('#targetTip').textContent=`${e.elite?tr('精英 · ','ELITE · '):''}${lang==='zh'?e.def.zh:e.def.en} · ${Math.ceil(e.hp)}/${e.maxHp}`;else{const id=game.world.get(t.x,t.y);if(id===TILE.RELIC_CHEST){const unlocked=!!game.guardianDefeated[chestKey(t.x,t.y)];$('#targetTip').textContent=unlocked?tr('遗物箱 · 已解锁 · 采/战键开启','Relic Cache · Unlocked · Mine/Fight to open'):tr('遗物箱 · 守箱者沉睡其中','Relic Cache · A warden sleeps within');}else $('#targetTip').textContent=id===TILE.AIR?`${t.x}, ${t.y}`:`${tileName(id,lang)} · ${t.x}, ${t.y}`;}$('#targetTip').classList.add('show');}
function updateCamera(dt){const p=game.player,s=game.camera.tile,targetX=p.x-game.cssW/s*.5,targetY=p.y-game.cssH/s*.55;const k=1-Math.pow(.001,dt);game.camera.x+=(targetX-game.camera.x)*k;game.camera.y+=(targetY-game.camera.y)*k;game.camera.x=Math.max(0,Math.min(WORLD_W-game.cssW/s,game.camera.x));game.camera.y=Math.max(0,Math.min(WORLD_H-game.cssH/s,game.camera.y));}

function loop(now){if(!game.running)return;let dt=Math.min(.033,Math.max(.001,(now-(game.last||now))/1000));game.last=now;syncMobileAim();if(!game.uiOpen){updatePlayer(dt);updateHazards();updateActions(dt);updateEnemies(dt);updateDrops(dt);updateCampfireRest(dt);updateProgression(dt);game.time=(game.time+dt/180)%1;}updateFx(dt);updateCamera(dt);render();game.autosave+=dt;if(game.autosave>10&&game.saveDirty)saveGame(false);requestAnimationFrame(loop);}

function setInput(action,on){if(action in game.input)game.input[action]=on;}
function aimFromEvent(e){game.pointer.kind=e.pointerType==='touch'?'touch':'mouse';const r=canvas.getBoundingClientRect();game.pointer.x=e.clientX-r.left;game.pointer.y=e.clientY-r.top;game.pointer.active=true;const q=pointerWorld();game.pointer.worldX=q.x;game.pointer.worldY=q.y;$('#crosshair').style.left=e.clientX+'px';$('#crosshair').style.top=e.clientY+'px';$('#crosshair').style.display='block';}
function setAimVector(nx,ny){
  const mag=Math.hypot(nx,ny)||1,nx2=nx/mag,ny2=ny/mag,s=game.camera.tile,reach=4.45;
  game.mobileAim.x=nx2;game.mobileAim.y=ny2;game.pointer.kind='touch';game.pointer.active=true;game.pointer.x=(game.player.x-game.camera.x+nx2*reach)*s;game.pointer.y=(game.player.y-game.camera.y+ny2*reach)*s;const q=pointerWorld();game.pointer.worldX=q.x;game.pointer.worldY=q.y;$('#crosshair').style.left=game.pointer.x+'px';$('#crosshair').style.top=game.pointer.y+'px';$('#crosshair').style.display='block';
}
function syncMobileAim(){if(game.mobileAim.active)setAimVector(game.mobileAim.x,game.mobileAim.y);}
function cycleHotbar(step){game.selected=(game.selected+step+HOTBAR_SIZE)%HOTBAR_SIZE;renderHotbar();renderInventory();game.saveDirty=true;}
canvas.addEventListener('pointermove',e=>aimFromEvent(e));
canvas.addEventListener('pointerdown',e=>{if(!game.running||game.uiOpen)return;aimFromEvent(e);try{canvas.setPointerCapture?.(e.pointerId);}catch{}if(e.pointerType!=='touch'){if(e.button===2)game.input.place=true;else game.input.mine=true;}e.preventDefault();});
canvas.addEventListener('pointerup',e=>{if(e.button===2)game.input.place=false;else game.input.mine=false;e.preventDefault();});
canvas.addEventListener('pointercancel',()=>{game.input.mine=game.input.place=false;});canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{if(!game.running||game.uiOpen)return;cycleHotbar(e.deltaY>0?1:-1);e.preventDefault();},{passive:false});
addEventListener('keydown',e=>{if(e.repeat&&['KeyE','KeyF','Escape','ControlLeft','ControlRight'].includes(e.code))return;if(/^Digit[1-8]$/.test(e.code)){game.selected=+e.code.slice(-1)-1;renderHotbar();renderInventory();return;}if(e.code==='ControlLeft'||e.code==='ControlRight'){game.smartCursor=!game.smartCursor;toast(game.smartCursor?tr('智能光标 · 开','Smart Cursor · ON'):tr('智能光标 · 关','Smart Cursor · OFF'));e.preventDefault();return;}if(e.code==='ShiftLeft'||e.code==='ShiftRight'){game.autoTool=true;return;}if(e.code==='KeyE'){togglePanel('inventoryPanel');return;}if(e.code==='Escape'){closePanels();return;}if(e.code==='KeyF'){goFullscreen();return;}if(e.code==='KeyA'||e.code==='ArrowLeft')setInput('left',true);if(e.code==='KeyD'||e.code==='ArrowRight')setInput('right',true);if(e.code==='KeyS'||e.code==='ArrowDown')setInput('down',true);if(e.code==='Space'||e.code==='KeyW'||e.code==='ArrowUp'){setInput('jump',true);e.preventDefault();}});
addEventListener('keyup',e=>{if(e.code==='KeyA'||e.code==='ArrowLeft')setInput('left',false);if(e.code==='KeyD'||e.code==='ArrowRight')setInput('right',false);if(e.code==='KeyS'||e.code==='ArrowDown')setInput('down',false);if(e.code==='ShiftLeft'||e.code==='ShiftRight')game.autoTool=false;if(e.code==='Space'||e.code==='KeyW'||e.code==='ArrowUp')setInput('jump',false);});

function setupStick(el,onMove,onEnd){
  let activeId=null;const knob=el.querySelector('.stick-knob');
  const move=e=>{if(activeId!==e.pointerId)return;const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.32,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy)||1,scale=Math.min(1,max/len),px=dx*scale,py=dy*scale;knob.style.transform=`translate(${px}px,${py}px)`;onMove(px/max,py/max,Math.min(1,len/max),e);e.preventDefault();};
  el.addEventListener('pointerdown',e=>{if(activeId!==null)return;activeId=e.pointerId;el.classList.add('active');try{el.setPointerCapture?.(e.pointerId);}catch{}move(e);});
  el.addEventListener('pointermove',move);
  const end=e=>{if(activeId!==e.pointerId)return;activeId=null;el.classList.remove('active');knob.style.transform='translate(0,0)';onEnd(e);e.preventDefault();};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
}
setupStick($('#moveStick'),(x,y,mag)=>{const dead=.22;setInput('left',x<-dead);setInput('right',x>dead);setInput('down',y>.48);setInput('jump',y<-.48);},()=>{setInput('left',false);setInput('right',false);setInput('down',false);setInput('jump',false);});
setupStick($('#aimStick'),(x,y,mag)=>{if(mag>.16){game.mobileAim.active=true;setAimVector(x,y);setInput('mine',true);}else{game.mobileAim.active=false;setInput('mine',false);}},()=>{game.mobileAim.active=false;setInput('mine',false);});
const jumpOn=e=>{e.preventDefault();setInput('jump',true);};const jumpOff=e=>{e.preventDefault();setInput('jump',false);};$('#mobileJump').addEventListener('pointerdown',jumpOn);$('#mobileJump').addEventListener('pointerup',jumpOff);$('#mobileJump').addEventListener('pointercancel',jumpOff);
const placeOn=e=>{e.preventDefault();game.quickPlaceId=null;setInput('place',true);};const placeOff=e=>{e.preventDefault();setInput('place',false);game.quickPlaceId=null;};$('#mobilePlace').addEventListener('pointerdown',placeOn);$('#mobilePlace').addEventListener('pointerup',placeOff);$('#mobilePlace').addEventListener('pointercancel',placeOff);
const torchOn=e=>{e.preventDefault();game.quickPlaceId='torch';setInput('place',true);};const torchOff=e=>{e.preventDefault();setInput('place',false);game.quickPlaceId=null;};$('#mobileTorch').addEventListener('pointerdown',torchOn);$('#mobileTorch').addEventListener('pointerup',torchOff);$('#mobileTorch').addEventListener('pointercancel',torchOff);
$('#mobilePack').onclick=()=>togglePanel('inventoryPanel');

function closePanels(){for(const id of ['inventoryPanel','menuPanel'])$('#'+id).classList.add('hidden');game.uiOpen=false;}
function togglePanel(id){const panel=$('#'+id),willOpen=panel.classList.contains('hidden');closePanels();if(willOpen){panel.classList.remove('hidden');game.uiOpen=true;if(id==='inventoryPanel'){renderInventory();renderCraft();}}}
$$('.panel-close').forEach(b=>b.onclick=()=>closePanels());
$$('[data-tab]').forEach(btn=>btn.onclick=()=>{$$('[data-tab]').forEach(x=>x.classList.toggle('active',x===btn));$('#inventoryView').classList.toggle('hidden',btn.dataset.tab!=='inventory');$('#craftView').classList.toggle('hidden',btn.dataset.tab!=='craft');if(btn.dataset.tab==='craft')renderCraft();});
$('#menuBtn').onclick=()=>togglePanel('menuPanel');$('#saveBtn').onclick=()=>saveGame(true);$('#menuSaveBtn').onclick=()=>saveGame(true);$('#controlsBtn').onclick=()=>$('#controlsCopy').classList.toggle('hidden');
$('#newWorldBtn').onclick=()=>{if(confirm(tr('这会替换当前本地世界。继续？','This replaces the current local world. Continue?'))){localStorage.removeItem(SAVE_KEY);location.reload();}};
$('#respawnBtn').onclick=respawn;
async function goFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();if(screen.orientation?.lock)await screen.orientation.lock('landscape').catch(()=>{});}catch{}resize();}
$('#fullscreenBtn').onclick=goFullscreen;

function setLang(next){lang=next;document.documentElement.dataset.lang=lang;localStorage.setItem(LANG_KEY,lang);renderHotbar();renderInventory();renderCraft();updateObjective();updateHud();}
$('#langBtn').onclick=()=>setLang(lang==='zh'?'en':'zh');

const saved=readSave();$('#seedInput').value=saved?.seed||seedNow();if(saved)$('#continueBtn').classList.remove('hidden');
$('#continueBtn').onclick=()=>{const raw=readSave();if(raw)applySave(raw);else startNewWorld($('#seedInput').value);};
$('#startBtn').onclick=()=>startNewWorld($('#seedInput').value.trim()||seedNow());
updateObjective();renderHotbar();resize();
