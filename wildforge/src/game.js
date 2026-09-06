import {VERSION, TILE, TILE_DEFS, ITEMS, RECIPES, ENEMY_TYPES, itemName, tileName} from './data.js';
import {World, WORLD_W, WORLD_H, encodeTiles, biomeIndexAt, makeRng} from './world.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const canvas = $('#game'), ctx = canvas.getContext('2d', {alpha:false});
const SAVE_KEY = 'wildforge.save.v0130';
const LEGACY_SAVE_KEY_0120 = 'wildforge.save.v0120';
const LEGACY_SAVE_KEY_0110 = 'wildforge.save.v0110';
const LEGACY_SAVE_KEY_0100 = 'wildforge.save.v0100';
const LEGACY_SAVE_KEY = 'wildforge.save.v092';
const LEGACY_SAVE_KEY_091 = 'wildforge.save.v091';
const LEGACY_SAVE_KEY_090 = 'wildforge.save.v090';
const LEGACY_SAVE_KEY_080 = 'wildforge.save.v080';
const LEGACY_SAVE_KEY_070 = 'wildforge.save.v070';
const LEGACY_SAVE_KEY_060 = 'wildforge.save.v060';
const LEGACY_SAVE_KEY_OLD = 'wildforge.save.v050';
const LEGACY_SAVE_KEY_OLDER = 'wildforge.save.v040';
const LEGACY_SAVE_KEY_OLDEST = 'wildforge.save.v010';
const LANG_KEY = 'wildforge.lang';
const HOTBAR_SIZE = 8;
const BEACON_LINK_RANGE=96;
const ROUTE_RADIUS=4.5;
const ROUTE_SPEED_MULT=1.08;
const ROUTE_NIGHT_SPAWN_RELIEF=1.18;
const MAX_BEACON_SUPPLY=3;
const TRADE_POST_RADIUS=3.4;
const TRADE_DAILY_BUY_CAP=10;
const TRADE_DAILY_SELL_CAP=16;
const TRADE_DAILY_PRODUCTION_CAP=8;
const WAREHOUSE_CAP=24;
const CARGO_BASE_CAP=8;
const CARGO_FRAME_BONUS=8;
const FREIGHT_FULL_SPEED_PENALTY=.14;
const FREIGHT_NIGHT_THREAT=.18;
const FREIGHT_SPILL_BASE=.18;
const CARGO_BUNDLE_BASE_HP=54;
const CARGO_BUNDLE_HP_PER_UNIT=4;
const GUARD_BASE_COST=26;
const GUARD_CONTRACT_DAYS=1.5;
const GUARD_MAX_HP=72;
const GUARD_DAMAGE=6;
const RAIDER_MIN_COOLDOWN=70;
const TRADE_GOODS=Object.freeze({
  greenheart_bale:{home:'verdant',base:12},
  emberfuel_crate:{home:'ember',base:16},
  frostglass_case:{home:'frost',base:14}
});
const TRADE_PRODUCTION=Object.freeze({
  greenheart_bale:{home:'verdant',need:{wood:3,fiber:2}},
  emberfuel_crate:{home:'ember',need:{coal:2,sandstone:2}},
  frostglass_case:{home:'frost',need:{ice:3,snow:2}}
});
const HOTBAR_DEFAULT = ['wood','soil','stone','torch','plank','workbench','campfire','rope'];
const DEPTH_ZONES = Object.freeze([
  {min:0,id:'surface',zh:'地表边境',en:'Frontier Surface'},
  {min:8,id:'shallow',zh:'浅层洞带',en:'Shallow Caves'},
  {min:24,id:'copper',zh:'赤铜层',en:'Copper Strata'},
  {min:48,id:'iron',zh:'冷铁深层',en:'Cold-Iron Deep'},
  {min:76,id:'star',zh:'星晶裂隙',en:'Starshard Rift'}
]);
const GLYPH = {
  wood:'▥',soil:'▰',stone:'◆',coal:'●',copper_ore:'◈',iron_ore:'◇',crystal:'✦',sand:'▱',sandstone:'▤',ash:'◼',basalt:'⬟',ice:'⬢',snow:'▧',fiber:'≋',rope:'⌇',moss_spore:'✧',plank:'▥',ruin_brick:'▣',torch:'♨',workbench:'▦',campfire:'♨',platform:'═', beacon:'⌖',greenheart_bale:'▥',emberfuel_crate:'▣',frostglass_case:'◇',freight_frame:'⌑',
  wood_pick:'⌕',stone_pick:'⌕',copper_pick:'⌕',iron_pick:'⌕',delver_pick:'⌕',wood_blade:'†',stone_blade:'†',copper_blade:'†',iron_blade:'†',crystal_blade:'✦',sentinel_blade:'‡',arrow:'➹',wood_bow:'◜',crystal_bow:'◓',copper_bar:'▬',iron_bar:'▬',ancient_core:'◉'
};

let lang = localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh';
document.documentElement.dataset.lang = lang;
const tr = (zh,en) => lang === 'zh' ? zh : en;

let audioCtx=null;
function ensureAudio(){try{const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return null;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});return audioCtx;}catch{return null;}}
function sfx(kind,intensity=1){
  const ac=ensureAudio();if(!ac)return;const now=ac.currentTime,o=ac.createOscillator(),g=ac.createGain(),vol=Math.max(.004,Math.min(.035,.018*intensity));
  const map={jump:[230,390,.085,'triangle'],break:[120,72,.055,'square'],place:[165,120,.045,'triangle'],pickup:[520,760,.07,'sine'],hit:[105,58,.06,'square'],land:[92,66,.045,'triangle'],dash:[180,520,.11,'sawtooth'],shot:[410,210,.07,'triangle'],enemyShot:[260,92,.10,'square']},cfg=map[kind]||map.place;
  o.type=cfg[3];o.frequency.setValueAtTime(cfg[0],now);o.frequency.exponentialRampToValueAtTime(Math.max(25,cfg[1]),now+cfg[2]);g.gain.setValueAtTime(vol,now);g.gain.exponentialRampToValueAtTime(.0001,now+cfg[2]);o.connect(g);g.connect(ac.destination);o.start(now);o.stop(now+cfg[2]+.01);
}

const game = {
  running:false, world:null, seed:'', time:0.18, last:0, autosave:0, spawnTimer:0,
  player:null, inventory:{}, hotbar:[...HOTBAR_DEFAULT], selected:0, enemies:[], drops:[], projectiles:[], enemyProjectiles:[],
  input:{left:false,right:false,down:false,jump:false,mine:false,place:false,dash:false}, pointer:{x:0,y:0,active:false,worldX:0,worldY:0,kind:'mouse'},
  mine:{key:'',progress:0}, attackCd:0, placeCd:0, quickPlaceId:null, interactCd:0, hurtCd:0, uiOpen:false,
  camera:{x:0,y:0,tile:26}, dpr:1, cssW:innerWidth, cssH:innerHeight,
  forgePlaced:false, forgeActive:false, forgeProgress:0, bossActive:false, bossDefeated:false, completed:false,
  nightState:'init', nightSurge:0, nightsSurvived:0, outpostReady:false,
  fx:{particles:[],shake:0}, smartCursor:false, autoTool:false, moveAxis:{x:0,y:0,touch:false}, mobileAim:{x:1,y:0,active:false}, restFx:0, relicScanCd:0, relicHint:null, toastTimer:0, saveDirty:false, objectiveStage:0, discoveries:[], guardianDefeated:{}, openedChestCount:0, campRespawn:null, campBindTimer:0, infrastructure:{beacons:[]}, worldProgress:{biomesVisited:[],relicBiomes:[],evolution:0}, trade:{credits:12,day:0,bought:{},sold:{},produced:{},volume:0,turnover:0}, cargoBundles:[], guard:null, raiderCooldown:0, rng:Math.random
};

function freshPlayer(spawn) {
  return {x:spawn.x,y:spawn.y,vx:0,vy:0,w:.72,h:1.72,hp:100,maxHp:100,grounded:false,onPlatform:false,dropThrough:0,fallStartY:spawn.y,facing:1,jumpLatch:false,jumpBuffer:0,jumpHold:0,coyote:0,landingKick:0,attackFlash:0,steps:0,dashTimer:0,dashCooldown:0,dashX:0,dashY:0};
}
function freshInventory() { return {wood:0,soil:0,stone:0,fiber:0}; }
function freshTrade(){return {credits:12,day:0,bought:{},sold:{},produced:{},volume:0,turnover:0};}
function sanitizeTrade(raw){
  if(!raw||typeof raw!=='object')return freshTrade();const src=raw,base=freshTrade();
  base.credits=Math.max(0,Math.floor(Number(src.credits)||0));base.day=Math.max(0,Math.floor(Number(src.day)||0));base.volume=Math.max(0,Math.floor(Number(src.volume)||0));base.turnover=Math.max(0,Math.floor(Number(src.turnover)||0));
  base.bought=src.bought&&typeof src.bought==='object'?Object.fromEntries(Object.entries(src.bought).map(([k,v])=>[k,Math.max(0,Math.floor(Number(v)||0))])):{};base.sold=src.sold&&typeof src.sold==='object'?Object.fromEntries(Object.entries(src.sold).map(([k,v])=>[k,Math.max(0,Math.floor(Number(v)||0))])):{};base.produced=src.produced&&typeof src.produced==='object'?Object.fromEntries(Object.entries(src.produced).map(([k,v])=>[k,Math.max(0,Math.floor(Number(v)||0))])):{};return base;
}
function sanitizeWarehouse(raw){
  const src=raw&&typeof raw==='object'?raw:{},out={};let used=0;for(const id of Object.keys(TRADE_GOODS)){const n=Math.max(0,Math.floor(Number(src[id])||0)),take=Math.min(n,WAREHOUSE_CAP-used);if(take>0){out[id]=take;used+=take;}if(used>=WAREHOUSE_CAP)break;}return out;
}
function sanitizeCargoBundles(raw){
  if(!Array.isArray(raw))return[];return raw.slice(0,4).map(b=>{const contents={};let units=0;for(const id of Object.keys(TRADE_GOODS)){const n=Math.max(0,Math.floor(Number(b?.contents?.[id])||0));if(n){contents[id]=n;units+=n;}}const maxHp=Math.max(30,Number(b?.maxHp)||CARGO_BUNDLE_BASE_HP+units*CARGO_BUNDLE_HP_PER_UNIT);return {x:Number(b?.x)||0,y:Number(b?.y)||0,hp:Math.max(1,Math.min(maxHp,Number(b?.hp)||maxHp)),maxHp,contents};}).filter(b=>Object.keys(b.contents).length&&Number.isFinite(b.x)&&Number.isFinite(b.y));
}
function sanitizeGuard(raw){if(!raw||typeof raw!=='object'||Number(raw.hp)<=0||Number(raw.remaining)<=0)return null;return {x:Number(raw.x)||0,y:Number(raw.y)||0,hp:Math.max(1,Math.min(GUARD_MAX_HP,Number(raw.hp)||GUARD_MAX_HP)),maxHp:GUARD_MAX_HP,remaining:Math.max(0,Math.min(GUARD_CONTRACT_DAYS*180,Number(raw.remaining)||0)),attackCd:0,facing:1};}
function bundleUnits(b){return Object.values(b?.contents||{}).reduce((n,v)=>n+Math.max(0,Number(v)||0),0);}
function bundleValue(b){return Object.entries(b?.contents||{}).reduce((sum,[id,n])=>sum+(TRADE_GOODS[id]?.base||0)*Math.max(0,Number(n)||0),0);}
function cargoDeclaredValue(){return Object.entries(TRADE_GOODS).reduce((sum,[id,g])=>sum+count(id)*g.base,0);}
function activeGuard(){return game.guard&&game.guard.hp>0&&game.guard.remaining>0?game.guard:null;}
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
  if(game.pointer.kind==='touch'||game.autoTool)return bestOwned(['sentinel_blade','crystal_blade','crystal_bow','iron_blade','copper_blade','wood_bow','stone_blade','wood_blade'])||{damage:2.5};
  return {damage:2.5};
}
function tryDash(){
  const p=game.player;if(!p||p.dashCooldown>0||p.dashTimer>0||game.uiOpen)return false;
  const keyboard=(game.input.right?1:0)-(game.input.left?1:0);
  let dx=game.moveAxis.touch?game.moveAxis.x:keyboard,dy=game.moveAxis.touch?game.moveAxis.y:(game.input.down?1:game.input.jump?-1:0);
  if(Math.hypot(dx,dy)<.2){dx=p.facing;dy=0;}
  const len=Math.hypot(dx,dy)||1;p.dashX=dx/len;p.dashY=dy/len;p.dashTimer=.17;p.dashCooldown=.9;game.input.dash=false;p.vx=p.dashX*8;p.vy=p.dashY*2.5;game.player.attackFlash=.08;game.fx.shake=Math.max(game.fx.shake,2.4);sfx('dash',.9);haptic(8);spawnDebris(p.x,p.y+.45,'#d6a557',5,.45);return true;
}
function seedNow() { return 'WF-'+Math.random().toString(36).slice(2,7).toUpperCase()+'-'+Date.now().toString(36).slice(-4).toUpperCase(); }
function saveExists() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }

function serialize() {
  const p=game.player;
  return {v:VERSION,seed:game.seed,time:game.time,tiles:encodeTiles(game.world.tiles),player:{x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,facing:p.facing},inventory:game.inventory,hotbar:game.hotbar,selected:game.selected,objectiveStage:game.objectiveStage,discoveries:game.discoveries,guardianDefeated:game.guardianDefeated,openedChestCount:game.openedChestCount,campRespawn:game.campRespawn,forgePlaced:game.forgePlaced,forgeActive:game.forgeActive,bossActive:game.bossActive,bossDefeated:game.bossDefeated,completed:game.completed,nightsSurvived:game.nightsSurvived,outpostReady:game.outpostReady,infrastructure:game.infrastructure,worldProgress:game.worldProgress,trade:game.trade,cargoBundles:game.cargoBundles,guard:activeGuard()};
}
function saveGame(show=true) {
  if (!game.running || !game.world) return;
  try { localStorage.setItem(SAVE_KEY,JSON.stringify(serialize())); game.saveDirty=false; game.autosave=0; if(show)toast(tr('世界已保存在此设备','World saved on this device')); }
  catch(e){ console.error(e); if(show)toast(tr('保存失败：浏览器存储不可用','Save failed: local storage unavailable')); }
}
function readSave() {
  try { for(const key of [SAVE_KEY,LEGACY_SAVE_KEY_0120,LEGACY_SAVE_KEY_0110,LEGACY_SAVE_KEY_0100,LEGACY_SAVE_KEY,LEGACY_SAVE_KEY_091,LEGACY_SAVE_KEY_090,LEGACY_SAVE_KEY_080,LEGACY_SAVE_KEY_070,LEGACY_SAVE_KEY_060,LEGACY_SAVE_KEY_OLD,LEGACY_SAVE_KEY_OLDER,LEGACY_SAVE_KEY_OLDEST]){const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw&&raw.seed&&raw.tiles&&(raw.v===VERSION||raw.v==='0.12.0'||raw.v==='0.11.0'||raw.v==='0.10.0'||raw.v==='0.9.2'||raw.v==='0.9.1'||raw.v==='0.9.0'||raw.v==='0.8.0'||raw.v==='0.7.0'||raw.v==='0.6.0'||raw.v==='0.5.0'||raw.v==='0.4.0'||raw.v==='0.3.0'||raw.v==='0.1.0'))return raw;} return null; } catch { return null; }
}
function applySave(raw) {
  game.seed=raw.seed; game.world=new World(raw.seed,raw.tiles); game.rng=makeRng(raw.seed+'-runtime');
  game.player=freshPlayer(game.world.spawn); Object.assign(game.player,raw.player||{}); game.player.fallStartY=game.player.y; game.player.onPlatform=false; game.player.dropThrough=0;
  game.inventory=raw.inventory&&typeof raw.inventory==='object'?raw.inventory:freshInventory();
  game.hotbar=Array.isArray(raw.hotbar)&&raw.hotbar.length===HOTBAR_SIZE?raw.hotbar:[...HOTBAR_DEFAULT];
  game.selected=Math.max(0,Math.min(7,Number(raw.selected)||0)); game.time=Number(raw.time)||.18; game.objectiveStage=Number(raw.objectiveStage)||0; game.trade=sanitizeTrade(raw.trade); game.cargoBundles=sanitizeCargoBundles(raw.cargoBundles); game.guard=sanitizeGuard(raw.guard); game.raiderCooldown=0; game.worldProgress=raw.worldProgress&&typeof raw.worldProgress==='object'?{biomesVisited:Array.isArray(raw.worldProgress.biomesVisited)?raw.worldProgress.biomesVisited:[],relicBiomes:Array.isArray(raw.worldProgress.relicBiomes)?raw.worldProgress.relicBiomes:[],evolution:Math.max(0,Number(raw.worldProgress.evolution)||0)}:{biomesVisited:[],relicBiomes:[],evolution:0}; game.infrastructure=raw.infrastructure&&typeof raw.infrastructure==='object'?{beacons:Array.isArray(raw.infrastructure.beacons)?raw.infrastructure.beacons.filter(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)).slice(0,8).map(b=>({x:b.x,y:b.y,createdAt:Number(b.createdAt)||0,supply:Math.min(MAX_BEACON_SUPPLY,Math.max(0,Number(b.supply)||0)),warehouse:sanitizeWarehouse(b.warehouse)})):[]}:{beacons:[]}; game.nightsSurvived=Math.max(0,Number(raw.nightsSurvived)||0); game.outpostReady=!!raw.outpostReady; game.nightState='init'; game.nightSurge=0; game.discoveries=Array.isArray(raw.discoveries)?raw.discoveries:[]; game.guardianDefeated=raw.guardianDefeated&&typeof raw.guardianDefeated==='object'?raw.guardianDefeated:{}; game.openedChestCount=Math.max(0,Number(raw.openedChestCount)||0); game.campRespawn=raw.campRespawn&&Number.isFinite(raw.campRespawn.x)&&Number.isFinite(raw.campRespawn.y)?raw.campRespawn:null; game.forgePlaced=!!raw.forgePlaced; game.forgeActive=!!raw.forgeActive; game.forgeProgress=0; game.bossActive=!!raw.bossActive; game.bossDefeated=!!raw.bossDefeated; game.completed=!!raw.completed; game.campBindTimer=0;
  game.enemies=[]; game.drops=[]; game.projectiles=[]; game.enemyProjectiles=[]; game.fx={particles:[],shake:0}; game.relicScanCd=0; game.relicHint=null; game.running=true; game.saveDirty=raw.v!==VERSION; startWorldUi(); resumeRiftEncounter(); if(game.completed){$('#victoryScreen').classList.remove('hidden');game.uiOpen=true;}
}
function startNewWorld(seed) {
  game.seed=String(seed||seedNow()).slice(0,32); game.world=new World(game.seed); game.rng=makeRng(game.seed+'-runtime'); game.player=freshPlayer(game.world.spawn);
  game.inventory=freshInventory(); game.projectiles=[]; game.enemyProjectiles=[]; game.hotbar=[...HOTBAR_DEFAULT]; game.selected=0; game.worldProgress={biomesVisited:[],relicBiomes:[],evolution:0}; game.trade=freshTrade(); game.cargoBundles=[]; game.guard=null; game.raiderCooldown=0; game.infrastructure={beacons:[]}; game.time=.18; game.objectiveStage=0; game.discoveries=[]; game.guardianDefeated={}; game.openedChestCount=0; game.campRespawn=null; game.nightsSurvived=0; game.outpostReady=false; game.nightState='init'; game.nightSurge=0; game.forgePlaced=false; game.forgeActive=false; game.forgeProgress=0; game.bossActive=false; game.bossDefeated=false; game.completed=false; game.campBindTimer=0; game.enemies=[]; game.drops=[]; game.projectiles=[]; game.fx={particles:[],shake:0}; game.relicScanCd=0; game.relicHint=null; game.running=true; game.saveDirty=true; startWorldUi(); saveGame(false);
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
function nightPhase(){const light=dayLight();return light<.38?'night':light<.58?'dusk':'day';}
function campfireDistance(x,y,fire=nearbyStationTile('campfire')){if(!fire)return Infinity;return Math.hypot(x-(fire.x+.5),y-(fire.y+.5));}
function updateWorldRhythm(dt){
  const phase=nightPhase();
  if(game.nightState==='init'){game.nightState=phase;game.nightSurge=phase==='night'?18:0;return;}
  if(phase===game.nightState){if(phase==='night')game.nightSurge=Math.max(0,game.nightSurge-dt);return;}
  const previous=game.nightState;game.nightState=phase;
  if(phase==='night'){
    game.nightSurge=18;game.spawnTimer=Math.min(game.spawnTimer,.45);
    toast(tr('夜幕降临 · 荒兽开始躁动','Nightfall · the frontier grows restless'));game.fx.shake=Math.max(game.fx.shake,.7);
  }else if(previous==='night'&&phase==='dusk'){
    game.nightSurge=0;
  }else if(previous==='dusk'&&phase==='day'){
    game.nightsSurvived++;game.saveDirty=true;
    const fire=nearbyStationTile('campfire'),bench=nearbyStationTile('workbench');
    game.outpostReady=!!(fire&&bench&&game.campRespawn);
    const supplied=replenishBeaconSupplies();
    const supplyCopy=supplied?tr(` · 路网补给 ${supplied} 处`,` · route supplies ${supplied}`):'';
    if(game.outpostReady){
      const biome=game.world.biome(game.player.x),reward=biome.id==='verdant'?'fiber':biome.id==='ember'?'coal':'ice';
      const bonus=1+(game.nightsSurvived%3===0?1:0);addItem(reward,bonus);
      toast(tr(`日出 · 守夜 ${game.nightsSurvived} 夜 · 前哨回收 ${itemName(reward,'zh')} ×${bonus}`,`Sunrise · ${game.nightsSurvived} nights · outpost salvage ${itemName(reward,'en')} ×${bonus}`)+supplyCopy);
    }else toast(tr(`日出 · 守夜 ${game.nightsSurvived} 夜`,`Sunrise · ${game.nightsSurvived} nights survived`)+supplyCopy);
    saveGame(false);
  }
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
  if(count('star_forge')>0||game.forgePlaced)stage=9;
  if(game.forgeActive)stage=10;
  if(game.bossDefeated)stage=11;
  if(game.completed)stage=12;
  if(stage!==game.objectiveStage){game.objectiveStage=stage;game.saveDirty=true;}
  const copyZh=['砍取青芯木 → 收集至少 4 块','制造木板 → 做出第一张工匠台','制作一把青芯镐 → 开始追踪赤铜','下到浅层洞带 → 采到赤铜矿','熔炼赤铜 → 为下一把镐准备材料','打造赤铜镐 → 前往冷铁深层','采集冷铁 → 升级深层装备','打造冷铁镐 → 寻找星晶裂隙','带回第一块星晶 → 深层循环已打通','打造星核炉 → 带它深入星晶裂隙','在裂隙点燃星核炉 → 做好迎战准备','击败裂隙巨兽 → 为荒境锻造新的回声','荒境熔炉已点亮 → 可以继续探索这个世界'];
  const copyEn=['Gather at least 4 Greenheart Wood','Make planks → craft your first Craft Table','Craft a Greenheart Pick → start hunting copper','Reach the shallow caves → mine red copper','Smelt red copper → prepare the next pick','Forge a Copper Pick → descend for cold iron','Gather cold iron → upgrade deep gear','Forge a Cold-Iron Pick → seek the Starshard Rift','Return with your first Star Crystal → deep loop online','Build a Starcore Forge → carry it into the Starshard Rift','Ignite the Starcore Forge in the rift → brace for impact','Defeat the Rift Behemoth → forge a new echo for the frontier','Wildforge is lit → the world remains yours to explore'];
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
function freshWorldProgress(){return {biomesVisited:[],relicBiomes:[],evolution:0};}
function freshInfrastructure(){return {beacons:[]};}
function beaconAt(x,y){const list=game.infrastructure?.beacons||[];return list.find(b=>Math.hypot(b.x-(x+.5),b.y-(y+.5))<.72)||null;}
function nearestBeacon(){const p=game.player,list=game.infrastructure?.beacons||[];let best=null,bd=Infinity;for(const b of list){const d=Math.hypot(b.x-p.x,b.y-p.y);if(d<bd){bd=d;best={...b,d};}}return best;}
function beaconKey(x,y){return `${Math.floor(x)},${Math.floor(y)}`;}
function beaconLinks(){
  const list=[...(game.infrastructure?.beacons||[])].sort((a,b)=>a.x-b.x||a.y-b.y);
  const links=[];
  for(let i=1;i<list.length;i++){const a=list[i-1],b=list[i],d=Math.hypot(b.x-a.x,b.y-a.y);if(d<=BEACON_LINK_RANGE)links.push({a,b,d});}
  return links;
}
function pointSegmentDistance(x,y,a,b){
  const vx=b.x-a.x,vy=b.y-a.y,wx=x-a.x,wy=y-a.y,len2=vx*vx+vy*vy;
  const t=len2?Math.max(0,Math.min(1,(wx*vx+wy*vy)/len2)):0,px=a.x+vx*t,py=a.y+vy*t;
  return Math.hypot(x-px,y-py);
}
function linkedBeaconKeys(){const keys=new Set();for(const link of beaconLinks()){keys.add(beaconKey(link.a.x,link.a.y));keys.add(beaconKey(link.b.x,link.b.y));}return keys;}
function beaconComponents(){
  const list=[...(game.infrastructure?.beacons||[])],links=beaconLinks(),byKey=new Map(list.map(b=>[beaconKey(b.x,b.y),b])),adj=new Map(list.map(b=>[beaconKey(b.x,b.y),[]]));
  for(const {a,b} of links){const ak=beaconKey(a.x,a.y),bk=beaconKey(b.x,b.y);adj.get(ak)?.push(bk);adj.get(bk)?.push(ak);}
  const seen=new Set(),out=[];for(const b of list){const root=beaconKey(b.x,b.y);if(seen.has(root))continue;const q=[root],component=[];seen.add(root);while(q.length){const k=q.shift(),node=byKey.get(k);if(node)component.push(node);for(const n of adj.get(k)||[])if(!seen.has(n)){seen.add(n);q.push(n);}}out.push(component);}return out;
}
function beaconComponentFor(b){if(!b)return[];const key=beaconKey(b.x,b.y);return beaconComponents().find(c=>c.some(x=>beaconKey(x.x,x.y)===key))||[];}
function componentBiomeIds(component){return [...new Set((component||[]).map(b=>game.world.biome(b.x).id))].sort();}
function beaconExchangeGood(b){const component=beaconComponentFor(b),local=game.world.biome(b.x).id,other=componentBiomeIds(component).find(id=>id!==local);if(!other)return null;const map={verdant:'fiber',ember:'coal',frost:'ice'};return {biome:other,id:map[other]};}
function syncTradeDay(){if(!game.trade)game.trade=freshTrade();const day=Math.max(0,Math.floor(game.nightsSurvived||0));if(game.trade.day!==day){game.trade.day=day;game.trade.bought={};game.trade.sold={};game.trade.produced={};game.saveDirty=true;}}
function nearbyTradePost(){
  if(!game.world||!game.player)return null;const nearest=nearestBeacon();if(!nearest||nearest.d>TRADE_POST_RADIUS)return null;const beacon=beaconAt(Math.floor(nearest.x),Math.floor(nearest.y))||nearest,component=beaconComponentFor(beacon),biomes=componentBiomeIds(component);return {beacon,biome:game.world.biome(beacon.x),linked:linkedBeaconKeys().has(beaconKey(beacon.x,beacon.y)),biomeCount:biomes.length};
}
function cargoLoad(){return Object.keys(TRADE_GOODS).reduce((n,id)=>n+count(id)*Math.max(1,Number(ITEMS[id]?.cargoWeight)||1),0);}
function cargoCapacity(){return CARGO_BASE_CAP+(count('freight_frame')>0?CARGO_FRAME_BONUS:0);}
function cargoLoadRatio(){return Math.max(0,Math.min(1,cargoLoad()/Math.max(1,cargoCapacity())));}
function cargoMoveMultiplier(routeActive=false){const effective=Math.max(0,(cargoLoadRatio()-.2)/.8),routeMitigation=routeActive?.35:1;return 1-FREIGHT_FULL_SPEED_PENALTY*effective*routeMitigation;}
function cargoNightSpawnFactor(routeActive=false){if(routeActive||game.nightState!=='night')return 1;return 1-FREIGHT_NIGHT_THREAT*cargoLoadRatio();}
function carriedCargoIds(){return Object.keys(TRADE_GOODS).filter(id=>count(id)>0);}
function cargoRoom(id,n=1){const weight=Math.max(1,Number(ITEMS[id]?.cargoWeight)||1);return cargoLoad()+weight*n<=cargoCapacity()&&count(id)+n<=(ITEMS[id]?.stack||20);}
function nearestCargoBundle(x=game.player?.x||0,y=game.player?.y||0,range=Infinity){let best=null,bd=range;for(const b of game.cargoBundles||[]){const d=Math.hypot(b.x-x,b.y-y);if(d<bd){bd=d;best=b;}}return best;}
function deployCargoBundle(){
  const ids=carriedCargoIds();if(!ids.length)return recoverCargoBundle();const p=game.player,contents={};let units=0;for(const id of ids){const n=count(id);if(n>0){contents[id]=n;units+=n;consume(id,n);}}const maxHp=CARGO_BUNDLE_BASE_HP+units*CARGO_BUNDLE_HP_PER_UNIT;game.cargoBundles.push({x:p.x+p.facing*.75,y:p.y+.35,hp:maxHp,maxHp,contents});game.cargoBundles=game.cargoBundles.slice(-4);game.saveDirty=true;renderInventory();renderHotbar();renderTrade();toast(tr(`货包已放下 · ${units} 件 · 现在可以正常战斗`,`Cargo set down · ${units} units · weapons are free`));return true;
}
function recoverCargoBundle(){
  const b=nearestCargoBundle(game.player?.x||0,game.player?.y||0,1.8);if(!b)return toast(tr('附近没有可收起的货包','No cargo bundle nearby'));let moved=0;for(const id of Object.keys(TRADE_GOODS)){let n=Math.max(0,Math.floor(Number(b.contents[id])||0));while(n>0&&cargoRoom(id,1)){addItem(id,1);b.contents[id]=--n;moved++;}if(n<=0)delete b.contents[id];}if(!bundleUnits(b))game.cargoBundles=game.cargoBundles.filter(x=>x!==b);game.saveDirty=true;renderInventory();renderHotbar();renderTrade();toast(moved?tr(`收起货物 · ${moved} 件`,`Recovered cargo · ${moved} units`):tr('货运容量不足','Not enough cargo capacity'));return moved>0;
}
function toggleCargoBundle(){return cargoLoad()>0?deployCargoBundle():recoverCargoBundle();}
function damageCargoBundle(b,amount,source='combat'){
  if(!b||amount<=0)return false;b.hp=Math.max(0,b.hp-amount);spawnDebris(b.x,b.y,source==='friendly'?'#d9b46f':'#b97a55',4,.55);if(b.hp>0){game.saveDirty=true;return true;}const ids=Object.keys(b.contents).filter(id=>b.contents[id]>0);if(!ids.length){game.cargoBundles=game.cargoBundles.filter(x=>x!==b);return false;}let roll=Math.floor(game.rng()*ids.reduce((n,id)=>n+b.contents[id],0)),lost=ids[0];for(const id of ids){roll-=b.contents[id];if(roll<0){lost=id;break;}}b.contents[lost]--;if(b.contents[lost]<=0)delete b.contents[lost];const remaining=bundleUnits(b);if(remaining){b.maxHp=CARGO_BUNDLE_BASE_HP+remaining*CARGO_BUNDLE_HP_PER_UNIT;b.hp=Math.max(24,b.maxHp*.55);}else game.cargoBundles=game.cargoBundles.filter(x=>x!==b);game.saveDirty=true;toast(tr(`货包受损 · ${itemName(lost,'zh')} ×1 报废`,`Cargo damaged · ${itemName(lost,'en')} ×1 lost`));return true;
}
function guardHireCost(){return GUARD_BASE_COST+Math.ceil(cargoDeclaredValue()*.08);}
function hireGuard(){
  const market=nearbyTradePost();if(!market)return;if(activeGuard())return toast(tr('护卫契约仍在生效','Escort contract is still active'));if(cargoLoad()<=0)return toast(tr('先装好货，再决定是否雇佣护卫','Load cargo first, then decide whether to hire a guard'));const cost=guardHireCost();if(game.trade.credits<cost)return toast(tr(`铸印不足 · 雇佣护卫需要 ◆${cost}`,`Not enough Forge Marks · guard costs ◆${cost}`));game.trade.credits-=cost;const p=game.player;game.guard={x:p.x-p.facing*1.2,y:p.y,hp:GUARD_MAX_HP,maxHp:GUARD_MAX_HP,remaining:GUARD_CONTRACT_DAYS*180,attackCd:0,facing:p.facing};game.saveDirty=true;renderTrade();toast(tr(`已雇佣边境护卫 · ◆${cost} · 约 ${Math.round(GUARD_CONTRACT_DAYS*24)} 小时`,`Frontier guard hired · ◆${cost} · about ${Math.round(GUARD_CONTRACT_DAYS*24)} hours`));
}
function hurtGuard(amount){const g=activeGuard();if(!g)return false;g.hp=Math.max(0,g.hp-amount);spawnDebris(g.x,g.y,'#b8c7b7',5,.65);if(g.hp<=0){game.guard=null;toast(tr('护卫倒下了','Your guard has fallen'));}game.saveDirty=true;return true;}
function updateGuard(dt){
  const g=activeGuard();if(!g){if(game.guard){game.guard=null;game.saveDirty=true;toast(tr('护卫契约结束','Escort contract ended'));}return;}g.remaining=Math.max(0,g.remaining-dt);g.attackCd=Math.max(0,g.attackCd-dt);const p=game.player,desired=p.x-p.facing*1.35,dx=desired-g.x;if(Math.abs(dx)>5){g.x=p.x-p.facing*1.1;g.y=p.y;return;}g.facing=Math.sign(dx)||g.facing;const speed=Math.abs(dx)>1.6?4.7:2.6,nx=g.x+Math.sign(dx)*speed*dt;if(!enemyCollides(nx,g.y,.64,1.25))g.x=nx;const groundY=p.y;if(Math.abs(g.y-groundY)>2.4)g.y=groundY;else g.y+=(groundY-g.y)*Math.min(1,dt*5);let target=null,bd=5.7;for(const e of game.enemies){if(e.dead)continue;const d=Math.hypot(e.x-g.x,e.y-g.y);if(d<bd){bd=d;target=e;}}if(target&&g.attackCd<=0){target.hp-=GUARD_DAMAGE;target.hit=.13;g.attackCd=.7;g.facing=Math.sign(target.x-g.x)||g.facing;spawnDebris(target.x,target.y,'#b8c7b7',4,.6);if(target.hp<=0)killEnemy(target);}
}
function raiderSpawnChance(){
  const value=cargoDeclaredValue();if(value<=0)return 0;const p=game.player,surface=game.world?.surface[Math.max(0,Math.min(WORLD_W-1,Math.floor(p.x)))]||0;if(p.y>surface+8||campfireDistance(p.x,p.y)<4.1)return 0;const base=.0015+Math.min(.058,Math.max(0,value-20)/260*.058),route=routeStateAt(p.x,p.y),night=game.nightState==='night'?1.55:1;return base*night*(route.active?.48:1)*(activeGuard()?.72:1);
}
function warehouseUnits(b){return Object.keys(TRADE_GOODS).reduce((n,id)=>n+Math.max(0,Number(b?.warehouse?.[id])||0),0);}
function warehouseCount(b,id){return Math.max(0,Number(b?.warehouse?.[id])||0);}
function warehouseAdd(b,id,n=1){if(!b||!TRADE_GOODS[id]||warehouseUnits(b)+n>WAREHOUSE_CAP)return false;b.warehouse=b.warehouse&&typeof b.warehouse==='object'?b.warehouse:{};b.warehouse[id]=warehouseCount(b,id)+n;game.saveDirty=true;return true;}
function warehouseTake(b,id,n=1){if(!b||warehouseCount(b,id)<n)return false;b.warehouse[id]-=n;if(b.warehouse[id]<=0)delete b.warehouse[id];game.saveDirty=true;return true;}
function tradePrice(id,market,side){
  const good=TRADE_GOODS[id];if(!good||!market)return null;const local=good.home===market.biome.id,network=market.linked?1.06:1;
  if(side==='buy'){if(!local)return null;return Math.max(1,Math.ceil(good.base*(market.linked?.94:1)));}
  return Math.max(1,Math.floor(good.base*(local?.52:1.48)*(local?1:network)));
}
function productionKey(market,id){return beaconKey(market.beacon.x,market.beacon.y)+':'+id;}
function canProduceTradeGood(id,market=nearbyTradePost()){
  const recipe=TRADE_PRODUCTION[id];if(!market||!recipe||recipe.home!==market.biome.id||!nearStation('workbench'))return false;const used=Number(game.trade.produced[productionKey(market,id)]||0);return used<TRADE_DAILY_PRODUCTION_CAP&&warehouseUnits(market.beacon)<WAREHOUSE_CAP&&Object.entries(recipe.need).every(([mat,n])=>count(mat)>=n);
}
function produceTradeGood(id){
  syncTradeDay();const market=nearbyTradePost(),recipe=TRADE_PRODUCTION[id];if(!market||!recipe||recipe.home!==market.biome.id)return;if(!nearStation('workbench'))return toast(tr('生产货物需要路标附近有工匠台','Cargo production needs a Craft Table beside the trade post'));const key=productionKey(market,id),used=Number(game.trade.produced[key]||0);if(used>=TRADE_DAILY_PRODUCTION_CAP)return toast(tr('该据点今日生产额已满','This depot has reached today’s production limit'));if(warehouseUnits(market.beacon)>=WAREHOUSE_CAP)return toast(tr('据点仓库已满','Depot warehouse is full'));if(!Object.entries(recipe.need).every(([mat,n])=>count(mat)>=n))return toast(tr('生产原料不足','Not enough production materials'));for(const [mat,n] of Object.entries(recipe.need))consume(mat,n);warehouseAdd(market.beacon,id,1);game.trade.produced[key]=used+1;game.saveDirty=true;renderTrade();renderInventory();renderHotbar();toast(tr(`生产完成 · ${itemName(id,'zh')} 已入库`,`Produced · ${itemName(id,'en')} stored at depot`));
}
function loadWarehouseCargo(id){
  const market=nearbyTradePost();if(!market||warehouseCount(market.beacon,id)<=0)return;if(!cargoRoom(id,1))return toast(tr(`货运已满 ${cargoLoad()}/${cargoCapacity()} · 制作货运背架可扩容`,`Cargo full ${cargoLoad()}/${cargoCapacity()} · craft a Freight Frame to expand capacity`));if(!warehouseTake(market.beacon,id,1))return;addItem(id,1);renderTrade();renderInventory();renderHotbar();
}
function storeWarehouseCargo(id){
  const market=nearbyTradePost();if(!market||count(id)<=0)return;if(warehouseUnits(market.beacon)>=WAREHOUSE_CAP)return toast(tr('据点仓库已满','Depot warehouse is full'));consume(id,1);warehouseAdd(market.beacon,id,1);renderTrade();renderInventory();renderHotbar();
}
function buyTradeGood(id){
  syncTradeDay();const market=nearbyTradePost(),good=TRADE_GOODS[id];if(!market||!good||good.home!==market.biome.id)return;const used=Number(game.trade.bought[id]||0),price=tradePrice(id,market,'buy');if(used>=TRADE_DAILY_BUY_CAP)return toast(tr('今日该货物已售罄','This local stock is sold out for today'));if(game.trade.credits<price)return toast(tr('铸印不足','Not enough Forge Marks'));if(!cargoRoom(id,1))return toast(tr(`货运已满 ${cargoLoad()}/${cargoCapacity()} · 先卸货或扩容`,`Cargo full ${cargoLoad()}/${cargoCapacity()} · unload or expand capacity`));game.trade.credits-=price;game.trade.bought[id]=used+1;game.trade.volume++;game.trade.turnover+=price;addItem(id,1);game.saveDirty=true;renderTrade();renderInventory();renderHotbar();
}
function sellTradeGood(id){
  syncTradeDay();const market=nearbyTradePost(),good=TRADE_GOODS[id];if(!market||!good||count(id)<=0)return;const key=market.biome.id+':'+id,used=Number(game.trade.sold[key]||0),price=tradePrice(id,market,'sell');if(used>=TRADE_DAILY_SELL_CAP)return toast(tr('这里今日已收满这种货','This market has met today’s demand for that cargo'));consume(id,1);game.trade.credits+=price;game.trade.sold[key]=used+1;game.trade.volume++;game.trade.turnover+=price;game.saveDirty=true;renderTrade();renderInventory();renderHotbar();
}
function routeStateAt(x,y){
  const links=beaconLinks();let best=null,distance=Infinity;
  for(const link of links){const d=pointSegmentDistance(x,y,link.a,link.b);if(d<distance){distance=d;best=link;}}
  const component=best?beaconComponentFor(best.a):[],biomes=componentBiomeIds(component);return {active:!!best&&distance<=ROUTE_RADIUS,distance,links,linkedCount:linkedBeaconKeys().size,link:best,component,biomes,biomeCount:biomes.length};
}
function totalBeaconSupply(){return (game.infrastructure?.beacons||[]).reduce((n,b)=>n+Math.max(0,Number(b.supply)||0),0);}
function registerBeacon(x,y){
  const key=beaconKey(x,y),list=game.infrastructure?.beacons||[];
  if(list.some(b=>beaconKey(b.x,b.y)===key))return false;
  if(list.length>=8){toast(tr('边境路标已达上限（8处），先拆除旧路标','Beacon network is full (8). Remove an old beacon first'));return false;}
  list.push({x:x+.5,y:y+.5,createdAt:Math.floor(Date.now()/1000),supply:0,warehouse:{}});game.infrastructure={beacons:list};game.saveDirty=true;return true;
}
function removeBeacon(x,y){const key=beaconKey(x,y);const list=(game.infrastructure?.beacons||[]).filter(b=>beaconKey(b.x,b.y)!==key);game.infrastructure={beacons:list};game.saveDirty=true;}
function replenishBeaconSupplies(){
  const linked=linkedBeaconKeys();let supplied=0;
  for(const b of game.infrastructure?.beacons||[]){if(!linked.has(beaconKey(b.x,b.y)))continue;const before=Math.max(0,Number(b.supply)||0);b.supply=Math.min(MAX_BEACON_SUPPLY,before+1);if(b.supply>before)supplied++;}
  if(supplied)game.saveDirty=true;return supplied;
}
function beaconSupplyBundle(b){const biome=game.world.biome(b.x).id,bundle=biome==='verdant'?[['fiber',2],['wood',1]]:biome==='ember'?[['coal',2],['torch',1]]:[['rope',2],['ice',1]],exchange=beaconExchangeGood(b);if(exchange)bundle.push([exchange.id,1]);return bundle;}
function claimBeaconSupply(b){
  const charges=Math.min(MAX_BEACON_SUPPLY,Math.max(0,Number(b?.supply)||0));if(!charges)return 0;
  const bundle=beaconSupplyBundle(b);let claimable=charges;
  for(const [id,n] of bundle){const room=Math.max(0,(ITEMS[id]?.stack||99)-count(id));claimable=Math.min(claimable,Math.floor(room/n));}
  if(claimable<=0){toast(tr('行囊中的对应物资已满，补给继续留存在路标','Matching supplies are full; the beacon keeps its stored charge'));return 0;}
  for(const [id,n] of bundle)addItem(id,n*claimable);b.supply=charges-claimable;game.saveDirty=true;renderHotbar();
  const detail=bundle.map(([id,n])=>`${itemName(id,lang)} ×${n*claimable}`).join(' · ');toast(tr(`路网补给已领取 · ${detail}`,`Route supply claimed · ${detail}`));return claimable;
}
function attuneBeacon(t){
  const b=beaconAt(t.x,t.y);if(!b)return false;if(Math.hypot(game.player.x-b.x,game.player.y-b.y)>3.2)return false;
  const claimed=claimBeaconSupply(b);game.campRespawn={x:b.x,y:b.y};game.outpostReady=!!(nearbyStationTile('campfire')&&nearbyStationTile('workbench')&&game.campRespawn);game.saveDirty=true;saveGame(false);
  if(!claimed)toast(tr('路标已校准 · 它现在是你的远方归点','Beacon attuned · it is now your distant return point'));
  spawnDebris(b.x,b.y,'#d6a557',claimed?13:9,.65);return true;
}

function updateWorldEvolution(){
  const p=game.worldProgress||freshWorldProgress();
  const next=Math.max(p.evolution, game.bossDefeated?4: p.relicBiomes.length>=3?3: p.biomesVisited.length>=3?2: p.biomesVisited.length>=1?1:0);
  if(next!==p.evolution){p.evolution=next;game.worldProgress=p;game.saveDirty=true;const msg=next>=4?tr('荒境回声已改变，星核余烬将持续留存','The frontier has changed; Starcore embers will persist'):next>=3?tr('三处遗迹共鸣已连接，荒境进入回响时代','Three relic echoes now resonate; the frontier enters an age of echoes'):next>=2?tr('三地均已留下你的探索印记','All three lands now bear your exploration marks'):tr('你的第一处探索印记已留在荒境','Your first exploration mark now remains in the frontier');toast(msg);}
}
function markBiomeVisited(id){
  if(!id)return;const p=game.worldProgress||freshWorldProgress();
  if(!p.biomesVisited.includes(id)){p.biomesVisited.push(id);p.biomesVisited.sort();game.worldProgress=p;game.saveDirty=true;const index=['verdant','ember','frost'].indexOf(id);const x=Math.max(2,Math.min(WORLD_W-3,Math.floor((index+.5)*WORLD_W/3)));for(const ox of [0,-1,1]){const tx=x+ox,ty=game.world.surface[Math.max(0,Math.min(WORLD_W-1,tx))]-1;if(game.world.get(tx,ty)===TILE.AIR){game.world.set(tx,ty,TILE.TORCH);break;}}}
  updateWorldEvolution();
}
function markRelicBiome(id){
  if(!id)return;const p=game.worldProgress||freshWorldProgress();
  if(!p.relicBiomes.includes(id)){p.relicBiomes.push(id);p.relicBiomes.sort();game.worldProgress=p;game.saveDirty=true;}
  updateWorldEvolution();
}
function evolveRelicSite(t){
  const candidates=[[1,0],[-1,0],[2,0],[-2,0],[0,-1],[0,1]];let placed=0;
  for(const [dx,dy] of candidates){const x=t.x+dx,y=t.y+dy;if(x<1||x>=WORLD_W-1||y<1||y>=WORLD_H-1)continue;if(game.world.get(x,y)===TILE.AIR){game.world.set(x,y,placed===0?TILE.GLOW_MOSS:TILE.TORCH);placed++;if(placed>=3)break;}}
}
function evolveOutpost(fire){
  if(!fire)return;const y=game.world.surface[Math.max(0,Math.min(WORLD_W-1,fire.x))]-2,x=fire.x;if(game.world.get(x,y)===TILE.AIR)game.world.set(x,y,TILE.TORCH);
}

function updateProgression(dt) {
  updateWorldRhythm(dt);
  const zone=currentDepthZone();
  const biomeId=game.world.biome(game.player.x).id;
  if(!(game.worldProgress?.biomesVisited||[]).includes(biomeId))markBiomeVisited(biomeId);
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
  ctx.setTransform(game.dpr,0,0,game.dpr,0,0);
  const touchViewport=matchMedia('(pointer:coarse)').matches;
  game.camera.tile=touchViewport?Math.max(20,Math.min(32,Math.floor(game.cssH/18))):Math.max(22,Math.min(38,Math.floor(game.cssH/20)));
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
function approach(value,target,amount){return value<target?Math.min(target,value+amount):Math.max(target,value-amount);}
function tryStepUp(p,nx){
  if(!p.grounded||game.input.down||p.vy<-.15)return false;
  if(!aabbSolid(nx,p.y,p.w,p.h))return false;
  for(const rise of [.25,.5,.75,1]){
    const y=p.y-rise;if(aabbSolid(nx,y,p.w,p.h))continue;
    p.x=nx;p.y=y;p.grounded=true;p.onPlatform=false;p.vy=0;p.landingKick=Math.max(p.landingKick,.08);return true;
  }
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
  const p=game.player;if(!p)return;
  p.dashCooldown=Math.max(0,(p.dashCooldown||0)-dt);
  if(game.input.dash)tryDash();
  if(p.dashTimer>0){
    p.dashTimer=Math.max(0,p.dashTimer-dt);
    const nx=p.x+p.dashX*14*dt,ny=p.y+p.dashY*5*dt;
    if(!aabbSolid(nx,ny,p.w,p.h)){p.x=nx;p.y=ny;}else p.dashTimer=0;
    p.vx=p.dashX*7;p.vy=p.dashY*2;
    p.attackFlash=Math.max(0,p.attackFlash-dt);
    return;
  }
  const wasGrounded=p.grounded,wasPlatform=!!p.onPlatform;
  p.dropThrough=Math.max(0,Number(p.dropThrough||0)-dt);p.landingKick=Math.max(0,(p.landingKick||0)-dt);
  if(game.input.down&&wasGrounded&&wasPlatform){p.dropThrough=.24;p.grounded=false;p.onPlatform=false;p.y+=.09;p.fallStartY=p.y;}

  const keyboard=(game.input.right?1:0)-(game.input.left?1:0),analog=game.moveAxis.touch?game.moveAxis.x:keyboard;
  const dir=Math.abs(analog)<.08?0:Math.max(-1,Math.min(1,analog)),route=routeStateAt(p.x,p.y),freightMove=cargoMoveMultiplier(route.active),max=5.75*(route.active?ROUTE_SPEED_MULT:1)*freightMove,targetVx=dir*max;
  const accel=p.grounded?39:22,decel=p.grounded?47:9;
  if(dir){p.vx=approach(p.vx,targetVx,accel*dt);p.facing=dir>0?1:-1;}else p.vx=approach(p.vx,0,decel*dt);
  if(game.pointer.active&&(game.input.mine||game.input.place)){const q=pointerWorld();if(Math.abs(q.x-p.x)>.18)p.facing=Math.sign(q.x-p.x)||p.facing;}

  const onRope=playerTouchesTile(TILE.ROPE);
  p.coyote=p.grounded?.12:Math.max(0,p.coyote-dt);
  if(onRope){
    p.jumpBuffer=0;p.jumpHold=0;p.jumpLatch=game.input.jump;p.grounded=false;p.onPlatform=false;p.fallStartY=p.y;
    const axisY=game.moveAxis.touch?game.moveAxis.y:(game.input.down?1:game.input.jump?-1:0),targetVy=axisY<-.22?-5.1:axisY>.22?4.4:1.05,blend=Math.min(1,dt*(Math.abs(axisY)>.22?17:9));
    p.vy+=(targetVy-p.vy)*blend;p.vy=Math.max(-5.35,Math.min(4.55,p.vy));
  }else{
    if(game.input.jump&&!p.jumpLatch){p.jumpBuffer=.13;p.jumpLatch=true;}
    if(!game.input.jump)p.jumpLatch=false;
    p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
    if(p.jumpBuffer>0&&p.coyote>0){p.vy=-10.15;p.grounded=false;p.onPlatform=false;p.coyote=0;p.jumpBuffer=0;p.jumpHold=.17;sfx('jump',.8);}
    let gravity=29;
    if(p.vy<0&&p.jumpHold>0){
      if(game.input.jump){gravity=17.5;p.jumpHold=Math.max(0,p.jumpHold-dt);}else{p.vy*=.57;p.jumpHold=0;gravity=31;}
    }
    p.vy=Math.min(14,p.vy+gravity*dt);
  }

  const nx=p.x+p.vx*dt;
  if(!aabbSolid(nx,p.y,p.w,p.h))p.x=nx;else if(!tryStepUp(p,nx))p.vx=0;
  const ny=p.y+p.vy*dt,impactVy=p.vy,platformY=platformLandingY(p.x,p.y,ny,p.w,p.h,p.dropThrough>0||onRope);
  p.onPlatform=false;
  if(platformY!==null){
    p.y=platformY;p.grounded=true;p.onPlatform=true;p.vy=0;
    if(!wasGrounded&&impactVy>0){applyFallDamage(p,p.y);if(impactVy>5.2){p.landingKick=.12;spawnDebris(p.x,p.y+p.h*.45,'#b69472',3,.32);game.fx.shake=Math.max(game.fx.shake,1.15);sfx('land',.7);}}
    p.fallStartY=p.y;
  }else if(!aabbSolid(p.x,ny,p.w,p.h)){
    p.y=ny;p.grounded=false;if(p.vy<0||wasGrounded)p.fallStartY=p.y;
  }else{
    if(p.vy>0){p.grounded=true;if(!wasGrounded){applyFallDamage(p,p.y);if(impactVy>5.2){p.landingKick=.12;spawnDebris(p.x,p.y+p.h*.45,'#b69472',3,.32);game.fx.shake=Math.max(game.fx.shake,1.15);sfx('land',.7);}}p.fallStartY=p.y;}p.vy=0;
  }
  if(p.y>WORLD_H+5)hurtPlayer(999,'void');
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
function targetInReach(x,y,reach=5.25){return Math.hypot(x+.5-game.player.x,y+.5-game.player.y)<=reach;}
function baseTarget(){
  if(game.pointer.active){const q=pointerWorld();return {x:Math.floor(q.x),y:Math.floor(q.y),qx:q.x,qy:q.y};}
  const x=Math.floor(game.player.x+game.player.facing*2),y=Math.floor(game.player.y);return {x,y,qx:x+.5,qy:y+.5};
}
function assistedEnemyTarget(base){
  const range=Math.max(5.25,currentWeapon()?.range||5.25);
  let best=null,bestScore=1.8;
  for(const e of game.enemies){
    if(e.dead||Math.hypot(e.x-game.player.x,e.y-game.player.y)>range)continue;
    const score=Math.hypot(e.x-base.qx,e.y-base.qy);
    if(score<bestScore){bestScore=score;best={x:Math.floor(e.x),y:Math.floor(e.y)};}
  }
  return best;
}
function mobileAimPenalty(x,y){
  if(game.pointer.kind!=='touch'||!game.mobileAim.active)return 0;
  const dx=x+.5-game.player.x,dy=y+.5-game.player.y,d=Math.hypot(dx,dy)||1,dot=(dx*game.mobileAim.x+dy*game.mobileAim.y)/d;
  let penalty=(1-Math.max(-1,Math.min(1,dot)))*4.5;
  if(Math.abs(game.mobileAim.y)<.3&&Math.abs(dy)>.9)penalty+=.75;
  return penalty;
}
function reachTarget(mode='aim') {
  const base=baseTarget(),combatReach=Math.max(5.25,currentWeapon()?.range||5.25),assist=game.pointer.kind==='touch'||game.smartCursor,mobileDirected=game.pointer.kind==='touch'&&game.mobileAim.active;
  let best={x:base.x,y:base.y,score:0};
  if(assist){
    if(mode!=='place'){const enemy=assistedEnemyTarget(base);if(enemy)return {x:enemy.x,y:enemy.y,ok:true,assisted:true};}
    const radius=game.smartCursor&&game.pointer.kind!=='touch'?2:1,baseTile=game.world.get(base.x,base.y),baseAir=baseTile===TILE.AIR;
    best=mode!=='place'&&!baseAir&&targetInReach(base.x,base.y,combatReach)?{x:base.x,y:base.y,score:mobileDirected?mobileAimPenalty(base.x,base.y):-.4}:null;
    for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
      const x=base.x+ox,y=base.y+oy;if(!targetInReach(x,y,mode==='place'?5.25:combatReach))continue;
      const tile=game.world.get(x,y),air=tile===TILE.AIR;
      if(mode==='place'){if(!air||!canPlaceAt(x,y))continue;const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>game.world.get(x+dx,y+dy)!==TILE.AIR);if(!adjacent)continue;}
      else if(air)continue;
      const score=Math.hypot(x+.5-base.qx,y+.5-base.qy)+(Math.abs(ox)+Math.abs(oy))*.06+mobileAimPenalty(x,y);
      if(!best||score<best.score)best={x,y,score};
    }
    if(!best)best={x:base.x,y:base.y,score:0};
  }
  return {x:best.x,y:best.y,ok:targetInReach(best.x,best.y),assisted:assist&&(best.x!==base.x||best.y!==base.y)};
}

function nearestEnemyAtTarget(t) {
  let best=null,bd=1.15;
  for(const e of game.enemies){if(e.dead)continue;const d=Math.hypot(e.x-(t.x+.5),e.y-(t.y+.5));if(d<bd&&Math.hypot(e.x-game.player.x,e.y-game.player.y)<=Math.max(5.25,currentWeapon()?.range||5.25)){best=e;bd=d;}}
  return best;
}
function attack(e) {
  if(game.attackCd>0||!e)return;if(cargoLoad()>0){game.attackCd=.28;toast(tr('背负货物时无法正常战斗 · 按 R 放下货包','Weapons are tied up by cargo · press R to set the load down'));return;}
  const weapon=currentWeapon(),damage=weapon.damage||2.5;
  if(weapon.ranged){const ammo=weapon.ammo||'arrow';if(count(ammo)<1){toast(tr('没有弹药：先制造骨木箭','No ammo: craft Woodbone Arrows first'));game.attackCd=.2;return;}consume(ammo,1);const q=game.pointer.active?pointerWorld():{x:game.player.x+game.player.facing*2,y:game.player.y};let dx=q.x-game.player.x,dy=q.y-(game.player.y-.22);const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;game.projectiles.push({x:game.player.x+dx*.7,y:game.player.y-.22,vx:dx*weapon.speed,vy:dy*weapon.speed,damage,life:Math.max(0.65,(weapon.range||12)/(weapon.speed||15)*1.25),kind:weapon.id});game.attackCd=.42;game.player.attackFlash=.14;sfx('shot',.75);game.fx.shake=Math.max(game.fx.shake,.8);haptic(6);toast(`${tr('发射','Shot')} ${itemName(weapon.id,lang)}`);return;}
  e.hp-=damage; e.hit=.16; game.attackCd=.32; game.player.attackFlash=.18;sfx('hit',.9);spawnDebris(e.x,e.y,e.def.color,5,.9);game.fx.shake=Math.max(game.fx.shake,2.2);haptic(10);
  toast(`${tr('命中','Hit')} ${lang==='zh'?e.def.zh:e.def.en} · -${Math.round(damage)}`);
  if(e.hp<=0)killEnemy(e);
}
function spawnDrop(id,n,x,y) {
  if(!ITEMS[id]||n<=0)return null;
  const drop={id,n,x,y:y-.15,vx:(game.rng()-.5)*2.5,vy:-2.8-game.rng()*1.4,age:0,bob:game.rng()*Math.PI*2};game.drops.push(drop);return drop;
}
function spillCargoOnHit(source='enemy'){
  const ids=carriedCargoIds();if(!ids.length||source==='fall'||source==='void')return false;const p=game.player,route=routeStateAt(p.x,p.y),ward=campfireDistance(p.x,p.y)<4.1,ratio=cargoLoadRatio(),frame=count('freight_frame')>0;let chance=FREIGHT_SPILL_BASE*ratio*(game.nightState==='night'?1.35:1)*(route.active?.45:1)*(ward?.25:1)*(frame?.55:1);if(['ruin_sentinel','rift_beast'].includes(source))chance*=.65;if(game.rng()>=chance)return false;let roll=Math.floor(game.rng()*ids.reduce((n,id)=>n+count(id),0)),id=ids[0];for(const candidate of ids){roll-=count(candidate);if(roll<0){id=candidate;break;}}consume(id,1);const d=spawnDrop(id,1,p.x+p.facing*.45,p.y+.1);if(d){d.age=-.85;d.vx=-p.facing*(3.2+game.rng()*1.4);d.vy=-3.4-game.rng();}renderInventory();renderHotbar();renderTrade();toast(tr(`货物震落 · ${itemName(id,'zh')} · 快捡回来！`,`Cargo spilled · ${itemName(id,'en')} · recover it!`));return true;
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
  game.world.set(t.x,t.y,TILE.AIR);game.openedChestCount++;markRelicBiome(game.world.biome(t.x).id);evolveRelicSite(t);
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
function findStarForge(){
  if(!game.world)return null;
  for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W;x++)if(game.world.get(x,y)===TILE.STAR_FORGE)return {x,y};
  return null;
}
function resumeRiftEncounter(){
  if(game.forgeActive&&game.bossActive&&!game.bossDefeated){const forge=findStarForge();if(forge)spawnRiftBeast(forge);else{game.forgeActive=false;game.bossActive=false;game.saveDirty=true;}}
}
function spawnRiftBeast(t){
  if(game.enemies.some(e=>!e.dead&&e.boss))return;
  const base=ENEMY_TYPES.rift_beast,side=game.player.x<t.x?-1:1;
  let x=t.x+.5+side*5.4,y=t.y-1.1;
  for(const ox of [side*5.4,side*3.8,-side*3.8,side*6.8]){const tx=t.x+.5+ox;if(!enemyCollides(tx,y,1.05,1.15)){x=tx;break;}}
  const def={...base,hp:Math.round(base.hp*(1+Math.min(.28,currentDepth()/260))),damage:Math.round(base.damage*(1+Math.min(.25,currentDepth()/320)))};
  game.enemies.push({type:'rift_beast',def,x,y,vx:0,vy:0,hp:def.hp,maxHp:def.hp,dead:false,hit:0,attack:0,flying:false,dir:-side,elite:true,boss:true,specialCd:1.35,windup:0,charge:0,bossRoar:0});
  game.bossActive=true;game.fx.shake=Math.max(game.fx.shake,8);spawnDebris(x,y,'#d36b75',24,1.8);haptic(40);toast(tr('裂隙巨兽自裂口中现身！','The Rift Behemoth emerges from the fracture!'));
}
function igniteForge(t,dt){
  if(game.forgeActive||game.bossDefeated)return;
  const depth=Math.max(0,t.y-game.world.surface[Math.max(0,Math.min(WORLD_W-1,t.x))]);
  if(depth<76){game.forgeProgress=0;toast(tr('星核炉需要进入星晶裂隙深层才能点燃','The Starcore Forge must reach the Starshard Rift to ignite'));return;}
  const before=game.forgeProgress;game.forgeProgress=Math.min(1,game.forgeProgress+dt/2.6);
  if(Math.floor(game.forgeProgress*5)!==Math.floor(before*5)){spawnDebris(t.x+.5,t.y+.15,'#a18ff0',3,.35);game.fx.shake=Math.max(game.fx.shake,.35);}
  if(game.forgeProgress>=1){game.forgeActive=true;game.forgeProgress=0;game.input.mine=false;game.saveDirty=true;saveGame(false);spawnRiftBeast(t);game.fx.shake=Math.max(game.fx.shake,10);}
}

function tryOpenRelicChest(t){
  if(game.interactCd>0)return;game.interactCd=.45;game.input.mine=false;resetMine();const key=chestKey(t.x,t.y);
  if(!game.guardianDefeated[key]){spawnChestGuardian(t,key);return;}
  openRelicChest(t,key);
}
function killEnemy(e) {
  e.dead=true; const type=e.type;
  if(e.boss){game.bossActive=false;game.bossDefeated=true;game.completed=true;updateWorldEvolution();game.saveDirty=true;game.input.left=game.input.right=game.input.jump=game.input.mine=game.input.place=false;saveGame(false);game.fx.shake=Math.max(game.fx.shake,12);spawnDebris(e.x,e.y,'#efc77d',34,2.3);haptic(55);setTimeout(()=>{if($('#victoryScreen')){$('#victoryText').textContent=tr('你点亮了星核炉，也击穿了裂隙巨兽。荒境不会因此停止生长。','You lit the Starcore Forge and broke the Rift Behemoth. The frontier will keep growing.');$('#victoryScreen').classList.remove('hidden');game.uiOpen=true;}},120);}
  if(e.elite&&e.chestKey){game.guardianDefeated[e.chestKey]=true;spawnDebris(e.x,e.y,'#e7bf70',18,1.55);game.fx.shake=Math.max(game.fx.shake,5);toast(tr('守箱者倒下，遗物箱已解锁','Warden defeated. The relic cache is unlocked'));game.saveDirty=true;}
  if(type==='moss_crawler'){spawnDrop('fiber',1+Math.floor(game.rng()*2),e.x,e.y);if(game.rng()<.22)spawnDrop('moss_spore',1,e.x,e.y);}
  else if(type==='ash_scuttler'){spawnDrop('coal',1,e.x,e.y);if(game.rng()<.3)spawnDrop('copper_ore',1,e.x,e.y);}
  else if(type==='shardback'){spawnDrop('ice',1+Math.floor(game.rng()*2),e.x,e.y);if(game.rng()<.18)spawnDrop('crystal',1,e.x,e.y);}
  else if(type==='hollow_wisp'){spawnDrop('moss_spore',1+Math.floor(game.rng()*2),e.x,e.y);}
  else if(type==='greyveil_raider'){const bounty=2+Math.floor(game.rng()*3);game.trade.credits+=bounty;toast(tr(`击退劫徒 · 缉赏 ◆${bounty}`,`Raider repelled · bounty ◆${bounty}`));}
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
function stableMineTarget(next){
  if(!game.mine.key)return next;const [x,y]=game.mine.key.split(',').map(Number);
  if(!Number.isFinite(x)||!Number.isFinite(y)||game.world.get(x,y)===TILE.AIR||!targetInReach(x,y))return next;
  if(game.pointer.kind==='touch'&&game.mobileAim.active){const dx=x+.5-game.player.x,dy=y+.5-game.player.y,d=Math.hypot(dx,dy)||1,dot=(dx*game.mobileAim.x+dy*game.mobileAim.y)/d;if(dot>.86)return {x,y,ok:true,assisted:true};}
  if(game.smartCursor&&game.pointer.kind!=='touch'){const q=pointerWorld();if(Math.hypot(x+.5-q.x,y+.5-q.y)<1.35)return {x,y,ok:true,assisted:true};}
  return next;
}
function mine(dt) {
  const t=stableMineTarget(reachTarget()); if(!t.ok)return resetMine(); const enemy=nearestEnemyAtTarget(t); if(enemy)return attack(enemy);
  const tile=game.world.get(t.x,t.y),def=TILE_DEFS[tile]; if(!def||tile===TILE.AIR)return resetMine();
  if(tile===TILE.RELIC_CHEST)return tryOpenRelicChest(t);
  if(tile===TILE.STAR_FORGE)return igniteForge(t,dt);
  if(tile===TILE.BEACON){if(game.input.mine){attuneBeacon(t);game.input.mine=false;}return;}
  const pick=currentPick(), required=Number(def.tier||0); if((pick.tier||0)<required){resetMine();toast(tr(`需要更高等级的镐：${def.zh}`,`A stronger pick is required: ${def.en}`));game.input.mine=false;return;}
  const key=t.x+','+t.y;if(game.mine.key!==key){game.mine.key=key;game.mine.progress=0;}
  const before=game.mine.progress;
  game.mine.progress+=dt*(pick.power||.7)/Math.max(.12,def.hardness||.5);
  if(Math.floor(before*4)!==Math.floor(game.mine.progress*4)){spawnDebris(t.x+.5,t.y+.5,def.color,2,.38);haptic(3);}
  if(game.mine.progress>=1){game.world.set(t.x,t.y,TILE.AIR);if(tile===TILE.BEACON){removeBeacon(t.x,t.y);toast(tr('边境路标已拆除','Frontier Beacon dismantled'));}sfx('break',tile===TILE.RUIN_URN?1.15:.75);if(tile===TILE.RUIN_URN)breakRuinUrn(t);else if(def.drop)spawnDrop(def.drop,1,t.x+.5,t.y+.5);spawnDebris(t.x+.5,t.y+.5,def.color,tile===TILE.RUIN_URN?11:7,tile===TILE.RUIN_URN?1.25:.85);game.fx.shake=Math.max(game.fx.shake,tile===TILE.RUIN_URN?2.5:.55);haptic(tile===TILE.RUIN_URN?15:9);game.mine.progress=0;game.saveDirty=true;renderHotbar();}
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
function hasPlacementSupport(x,y,tile){return tile===TILE.TORCH||[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>game.world.get(x+dx,y+dy)!==TILE.AIR);}
function bridgeAssistTarget(item,fallback){
  if(item?.tile!==TILE.PLATFORM||game.mobileAim.active)return fallback;
  const assist=game.pointer.kind==='touch'||game.smartCursor;if(!assist)return fallback;
  const axis=game.moveAxis.touch?game.moveAxis.x:((game.input.right?1:0)-(game.input.left?1:0));if(Math.abs(axis)<.22)return fallback;
  const dir=Math.sign(axis),p=game.player,x=Math.floor(p.x+dir*.9),y=Math.floor(p.y+p.h/2+.14);
  if(targetInReach(x,y)&&canPlaceAt(x,y)&&hasPlacementSupport(x,y,item.tile))return {x,y,ok:true,assisted:true,bridge:true};
  return fallback;
}
function placementTarget(item){return bridgeAssistTarget(item,reachTarget('place'));}
function place(idOverride=null) {
  if(game.placeCd>0)return;const id=idOverride||(game.autoTool&&count('torch')>0?'torch':selectedId()),item=ITEMS[id];
  const existing=game.world&&reachTarget('aim');if(existing?.ok&&game.world.get(existing.x,existing.y)===TILE.BEACON){const b=beaconAt(existing.x,existing.y);if(b&&warehouseUnits(b)>0){toast(tr('先清空路标仓库，再拆除据点','Empty the depot warehouse before dismantling this beacon'));return;}removeBeacon(existing.x,existing.y);game.world.set(existing.x,existing.y,TILE.AIR);spawnDrop('beacon',1,existing.x+.5,existing.y+.5);toast(tr('边境路标已拆除并回收','Frontier Beacon dismantled and recovered'));game.saveDirty=true;return;}
  if(!item?.tile||count(id)<1)return;
  const t=placementTarget(item);if(!t.ok)return;const def=TILE_DEFS[item.tile];if(!def?.place||!canPlaceAt(t.x,t.y)||!hasPlacementSupport(t.x,t.y,item.tile))return;
  game.world.set(t.x,t.y,item.tile);consume(id,1);if(item.tile===TILE.BEACON&&!registerBeacon(t.x,t.y)) {game.world.set(t.x,t.y,TILE.AIR);addItem(id,1);return;} if(item.tile===TILE.STAR_FORGE){game.forgePlaced=true;game.saveDirty=true;toast(tr('星核炉已安放：带它深入星晶裂隙','Starcore Forge placed: carry its power into the rift'));}sfx('place',.65);game.placeCd=(item.tile===TILE.PLATFORM||item.tile===TILE.ROPE)?0.085:0.115;spawnDebris(t.x+.5,t.y+.5,def.color,3,.28);game.fx.shake=Math.max(game.fx.shake,.18);haptic(4);renderHotbar();game.saveDirty=true;
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
    if(dist<.72&&d.age>.1){addItem(d.id,d.n);d.dead=true;sfx('pickup',ITEMS[d.id]?.rare?1.25:.55);spawnDebris(d.x,d.y,ITEMS[d.id]?.rare?'#e9c16b':'#f0d9a2',ITEMS[d.id]?.rare?8:3,ITEMS[d.id]?.rare?.75:.35);haptic(ITEMS[d.id]?.rare?18:4);if(ITEMS[d.id]?.rare)toast(tr(`发现稀有装备 · ${itemName(d.id,'zh')}`,`Rare gear found · ${itemName(d.id,'en')}`));else if(d.id==='ancient_core')toast(tr('获得古代机芯','Ancient Core acquired'));renderHotbar();}
  }
  game.drops=game.drops.filter(d=>!d.dead&&d.age<45);
}
function updateProjectiles(dt){
  for(const p of game.projectiles){p.life-=dt;p.vy+=7.5*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.life<=0||game.world.solid(Math.floor(p.x),Math.floor(p.y))){p.dead=true;continue;}const bundle=nearestCargoBundle(p.x,p.y,.58);if(bundle){damageCargoBundle(bundle,Math.max(4,p.damage*.75),'friendly');p.dead=true;continue;}for(const e of game.enemies){if(e.dead||Math.hypot(e.x-p.x,e.y-p.y)>.58)continue;e.hp-=p.damage;e.hit=.13;spawnDebris(e.x,e.y,e.def.color,4,.65);game.fx.shake=Math.max(game.fx.shake,1.4);p.dead=true;if(e.hp<=0)killEnemy(e);break;}}
  game.projectiles=game.projectiles.filter(p=>!p.dead&&p.life>0);
}
function enemyCollides(x,y,w=.72,h=.72){const minX=Math.floor(x-w/2),maxX=Math.floor(x+w/2),minY=Math.floor(y-h/2),maxY=Math.floor(y+h/2);for(let yy=minY;yy<=maxY;yy++)for(let xx=minX;xx<=maxX;xx++)if(game.world.solid(xx,yy))return true;return false;}
function spawnEnemy() {
  if(game.enemies.filter(e=>!e.dead).length>=11)return;
  const p=game.player,side=game.rng()<.5?-1:1,fire=nearbyStationTile('campfire');
  let x=Math.max(3,Math.min(WORLD_W-4,p.x+side*(9+game.rng()*12)));
  if(game.nightState==='night'&&fire){const fx=fire.x+.5,fy=fire.y+.5;for(let tries=0;tries<5&&Math.hypot(x-fx,p.y-fy)<7.5;tries++)x=Math.max(3,Math.min(WORLD_W-4,p.x+(game.rng()<.5?-1:1)*(10+game.rng()*15)));}
  const sx=Math.floor(x), surface=game.world.surface[sx], underground=p.y>surface+9;
  let candidates=Object.entries(ENEMY_TYPES).filter(([,d])=>!d.boss&&!d.raider&&(underground?d.underground:(!d.underground&&d.biome===game.world.biome(x).id)));
  const raider=ENEMY_TYPES.greyveil_raider;if(!underground&&game.raiderCooldown<=0&&raider&&game.rng()<raiderSpawnChance()){candidates=[['greyveil_raider',raider]];game.raiderCooldown=RAIDER_MIN_COOLDOWN+game.rng()*45;toast(tr('灰披劫徒盯上了你的货！','Greyveil raiders have marked your cargo!'));}
  if(underground&&p.y<68)candidates=candidates.filter(([,d])=>d.flying||game.rng()>.35);
  if(game.nightState==='night'&&underground&&game.rng()<.46){const wisp=candidates.find(([type])=>type==='hollow_wisp');if(wisp)candidates=[wisp];}
  if(!candidates.length)return; const [type,baseDef]=candidates[Math.floor(game.rng()*candidates.length)];const zone=currentDepthZone();const scale=zone.id==='star'?1.55:zone.id==='iron'?1.32:zone.id==='copper'?1.17:1;const def={...baseDef,hp:Math.round(baseDef.hp*scale),damage:Math.max(1,Math.round(baseDef.damage*(.85+scale*.15)))};
  let y=surface-1;
  if(underground){y=Math.max(surface+6,Math.min(WORLD_H-6,p.y+(game.rng()-.5)*14));for(let tries=0;tries<18&&game.world.solid(x,y);tries++)y+=game.rng()<.5?-1:1;}
  game.enemies.push({type,def,x:x+.5,y:y-.3,vx:0,vy:0,hp:def.hp,maxHp:def.hp,dead:false,hit:0,attack:0,flying:!!def.flying,dir:side*-1,rangedCd:type==='hollow_wisp'?1.4:0,windup:0});
}
function playerHitboxContains(x,y){const p=game.player;return x>p.x-p.w*.58&&x<p.x+p.w*.58&&y>p.y-p.h*.58&&y<p.y+p.h*.58;}
function spawnEnemyProjectile(e){
  const p=game.player,dx=p.x-e.x,dy=(p.y-.18)-e.y,len=Math.hypot(dx,dy)||1,speed=7.4;
  game.enemyProjectiles.push({x:e.x,y:e.y-.05,vx:dx/len*speed,vy:dy/len*speed,damage:8,life:2.1});sfx('enemyShot',.65);game.fx.shake=Math.max(game.fx.shake,.65);spawnDebris(e.x,e.y,'#66c7ae',4,.5);
}
function updateEnemyProjectiles(dt){
  for(const p of game.enemyProjectiles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const ward=campfireDistance(p.x,p.y)<4.1;if(ward){p.dead=true;spawnDebris(p.x,p.y,'#72d7b8',2,.25);continue;}if(p.life<=0||game.world.solid(Math.floor(p.x),Math.floor(p.y))){p.dead=true;continue;}const cargo=nearestCargoBundle(p.x,p.y,.62);if(cargo){damageCargoBundle(cargo,p.damage,'enemy');p.dead=true;continue;}if(playerHitboxContains(p.x,p.y)){hurtPlayer(p.damage,'wisp_bolt');p.dead=true;game.fx.shake=Math.max(game.fx.shake,3.2);spawnDebris(game.player.x,game.player.y,'#66c7ae',7,.7);}}
  game.enemyProjectiles=game.enemyProjectiles.filter(p=>!p.dead&&p.life>0);
}
function updateEnemies(dt) {
  game.raiderCooldown=Math.max(0,(game.raiderCooldown||0)-dt);updateGuard(dt);const p=game.player,night=game.nightState==='night',fire=nearbyStationTile('campfire');game.spawnTimer-=dt;if(game.spawnTimer<=0){const route=routeStateAt(p.x,p.y),relief=night&&route.active?ROUTE_NIGHT_SPAWN_RELIEF:1,freightThreat=cargoNightSpawnFactor(route.active);game.spawnTimer=((night?(game.nightSurge>0?.72:1.15):dayLight()<.58?2.1:2.9)+game.rng()*(night?1.15:2))*relief*freightThreat;spawnEnemy();}
  for(const e of game.enemies){if(e.dead)continue;e.hit=Math.max(0,e.hit-dt);e.attack=Math.max(0,e.attack-dt);const g=!e.elite?activeGuard():null,cargoTarget=e.type==='greyveil_raider'?nearestCargoBundle(e.x,e.y,18):null,playerDist=Math.hypot(p.x-e.x,p.y-e.y),guardDist=g?Math.hypot(g.x-e.x,g.y-e.y):Infinity,target=cargoTarget||((g&&guardDist<playerDist*.92)?g:p),dx=target.x-e.x,dy=target.y-e.y,dist=Math.hypot(dx,dy);if(Math.min(playerDist,dist)>30)continue;
    const fireDist=campfireDistance(e.x,e.y,fire);if(fireDist<4.1&&!e.elite){e.vx*=Math.pow(.03,dt);if(e.flying)e.vy*=Math.pow(.03,dt);continue;}
    const dir=Math.sign(dx)||1;e.dir=dir;
    if(e.type==='hollow_wisp'){
      e.rangedCd=Math.max(0,(e.rangedCd||0)-dt);
      if(e.windup>0){e.windup-=dt;e.vx*=Math.pow(.02,dt);if(e.windup<=0)spawnEnemyProjectile(e);}
      else if(e.rangedCd<=0&&dist>5.2&&dist<12&&Math.abs(dy)<4){e.windup=.48;e.rangedCd=2.45;e.vx=0;toast(tr('空洞微光正在凝聚幽光弹','Hollow Wisp is charging a dusk bolt'));}
      else {e.vx+=(dir*e.def.speed*.55-e.vx)*dt*2.4;e.vy+=((Math.sign(dy)*e.def.speed*.52-e.vy))*dt*1.8;e.x+=e.vx*dt;e.y+=e.vy*dt;}
      continue;
    }
    if(e.elite){
      e.specialCd=Math.max(0,(e.specialCd||0)-dt);
      if(e.windup>0){e.windup-=dt;e.vx*=Math.pow(.03,dt);if(e.windup<=0){e.charge=.34;e.vx=dir*8.2;e.attack=0;game.fx.shake=Math.max(game.fx.shake,3);spawnDebris(e.x,e.y,'#e1b55e',8,.85);}}
      else if(e.charge>0){e.charge-=dt;const nx=e.x+e.vx*dt;if(!enemyCollides(nx,e.y,.82,.82))e.x=nx;else{e.charge=0;e.vx=0;game.fx.shake=Math.max(game.fx.shake,2.4);}if(dist<1.25&&e.attack<=0){hurtPlayer(Math.round(e.def.damage*1.55),e.type);e.attack=1.05;e.charge=0;game.fx.shake=Math.max(game.fx.shake,5.5);haptic(20);}continue;}
      else if(e.specialCd<=0&&dist>2.3&&dist<8.5&&Math.abs(dy)<2.1){e.windup=.62;e.specialCd=2.7;e.vx=0;toast(tr('守箱者正在蓄力冲锋','Relic Warden is charging'));}
    }
    if(e.flying){e.vx+=(dir*e.def.speed-e.vx)*dt*2.7;e.vy+=((Math.sign(dy)*e.def.speed*.75)-e.vy)*dt*2.1;e.x+=e.vx*dt;e.y+=e.vy*dt;}
    else{const speed=e.elite?e.def.speed*.82:e.def.speed;e.vx+=(dir*speed-e.vx)*dt*4;e.vy=Math.min(12,e.vy+25*dt);const nx=e.x+e.vx*dt;if(!enemyCollides(nx,e.y))e.x=nx;else{e.vx=0;if(!e.elite&&game.rng()<.05)e.vy=-7.5;}const ny=e.y+e.vy*dt;if(!enemyCollides(e.x,ny))e.y=ny;else e.vy=0;}
    if(dist<1.05&&e.attack<=0){if(cargoTarget)damageCargoBundle(cargoTarget,e.def.damage*1.15,'raider');else if(target===g)hurtGuard(e.def.damage);else hurtPlayer(e.def.damage,e.type);e.attack=e.elite?1.05:.85;}
  }
  game.enemies=game.enemies.filter(e=>!e.dead&&Math.abs(e.x-p.x)<48&&e.y<WORLD_H+8);
}
function updateFx(dt){
  game.fx.shake=Math.max(0,game.fx.shake-dt*12);
  for(const p of game.fx.particles){p.life-=dt;p.vy+=8*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
  game.fx.particles=game.fx.particles.filter(p=>p.life>0);
}
function hurtPlayer(amount,source='enemy') {
  if(game.player?.dashTimer>0&&amount<999)return;
  const ward=campfireDistance(game.player?.x||0,game.player?.y||0)<4.1;
  if(ward&&amount<999&&source!=='fall'&&!['ruin_sentinel','rift_beast'].includes(source))amount=Math.max(1,Math.round(amount*.72));
  if(game.hurtCd>0&&amount<999&&source!=='fall')return;const p=game.player;p.hp=Math.max(0,p.hp-amount);game.hurtCd=.65;if(source!=='fall'){p.vx-=p.facing*2.2;spillCargoOnHit(source);}if(p.hp<=0)die(source);
}
function die(source) {
  const strandedCargo=cargoLoad();if(strandedCargo>0)deployCargoBundle();game.input.left=game.input.right=game.input.jump=game.input.mine=game.input.place=false;game.running=false;
  const lost=[];for(const [id,n] of Object.entries(game.inventory)){if(ITEMS[id]?.kind==='material'&&n>2){const d=Math.max(1,Math.floor(n*.25));game.inventory[id]-=d;lost.push(`${itemName(id,lang)} ×${d}`);}}
  game.saveDirty=true;saveGame(false);
  $('#deathText').textContent=(strandedCargo>0?tr(`货物留在倒下的位置（${strandedCargo} 件）。`,`Your cargo remains where you fell (${strandedCargo} units). `):'')+(lost.length?tr('撤回营地时另遗失：','Other supplies lost while retreating: ')+lost.slice(0,4).join(' · '):tr('其余随身物资已保住。','Other carried supplies were kept.'));$('#deathScreen').classList.remove('hidden');
}
function respawn(){const p=game.player,camp=game.campRespawn,p0=camp&&!aabbSolid(camp.x,camp.y,p.w,p.h)?camp:game.world.spawn;p.x=p0.x;p.y=p0.y;p.vx=p.vy=0;p.hp=p.maxHp;p.fallStartY=p.y;p.onPlatform=false;p.dropThrough=0;p.dashTimer=0;p.dashCooldown=0;game.enemies=[];game.drops=[];game.projectiles=[];game.enemyProjectiles=[];game.running=true;$('#deathScreen').classList.add('hidden');if(game.forgeActive&&game.bossActive&&!game.bossDefeated)resumeRiftEncounter();game.saveDirty=true;saveGame(false);game.last=performance.now();requestAnimationFrame(loop);}

function nearbyStationTile(station) {
  const target=station==='workbench'?TILE.WORKBENCH:TILE.CAMPFIRE,p=game.player;if(!p)return null;
  let best=null,bd=Infinity;
  for(let y=Math.floor(p.y)-4;y<=Math.floor(p.y)+4;y++)for(let x=Math.floor(p.x)-4;x<=Math.floor(p.x)+4;x++)if(game.world.get(x,y)===target){const d=Math.hypot(x+.5-p.x,y+.5-p.y);if(d<bd){bd=d;best={x,y};}}
  return best;
}
function nearStation(station){return !!nearbyStationTile(station);}
function stationAvailable(station){return !station||nearStation(station);}
function safeCampPoint(fire){for(const dx of [0,-1,1,-2,2]){const x=fire.x+.5+dx,y=fire.y+.14;if(!aabbSolid(x,y,.72,1.72))return {x,y};}return null;}
function updateCampfireRest(dt){
  const p=game.player;if(!p)return;const fire=nearbyStationTile('campfire'),bench=nearbyStationTile('workbench');
  if(fire&&p.hp<p.maxHp&&game.hurtCd<=0){p.hp=Math.min(p.maxHp,p.hp+(game.nightState==='night'?3.1:2.4)*dt);game.restFx-=dt;if(game.restFx<=0){game.restFx=.5;spawnDebris(p.x,p.y+.5,'#e69a55',1,.22);}}
  if(fire&&bench&&game.hurtCd<=0){game.campBindTimer+=dt;game.outpostReady=!!game.campRespawn;if(game.campBindTimer>=1.6){const point=safeCampPoint(fire),key=point?`${point.x.toFixed(1)},${point.y.toFixed(1)}`:'',old=game.campRespawn?`${game.campRespawn.x.toFixed(1)},${game.campRespawn.y.toFixed(1)}`:'';if(point&&key!==old){game.campRespawn=point;game.outpostReady=true;game.saveDirty=true;saveGame(false);evolveOutpost(fire);spawnDebris(fire.x+.5,fire.y+.4,'#e4ad53',10,.6);toast(tr('前哨营地已绑定 · 守护区与日出回收已启用','Outpost bound · ward and dawn salvage enabled'));}game.campBindTimer=0;}}else {game.campBindTimer=0;game.outpostReady=false;}
}

function canCraft(r){return stationAvailable(r.station)&&Object.entries(r.need).every(([id,n])=>count(id)>=n);}
function craft(r) {
  if(!canCraft(r)){toast(r.station&&!stationAvailable(r.station)?tr('需要靠近对应制造设施','Move closer to the required crafting station'):tr('材料不足','Not enough materials'));return;}
  for(const [id,n] of Object.entries(r.need))consume(id,n);addItem(r.out.id,r.out.n);if(['pick','weapon'].includes(ITEMS[r.out.id]?.kind))game.hotbar[game.selected]=r.out.id;renderInventory();renderCraft();renderHotbar();toast(r.out.id==='beacon'?tr('边境路标完成 · 建站后可采购本地货，再运往异地出售','Frontier Beacon ready · establish a post, load local cargo, then sell it abroad'):`${tr('制造','Crafted')} · ${itemName(r.out.id,lang)} ×${r.out.n}`);
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
function renderTrade(){
  const view=$('#tradeView');if(!view)return;if(!game.world||!game.player){view.innerHTML='';return;}syncTradeDay();const market=nearbyTradePost();if(!market){view.innerHTML=`<div class="trade-empty"><b>${tr('附近没有贸易路标','No trade post nearby')}</b><span>${tr('靠近边境路标后可生产、入库、装货和交易。真正的货物必须由你带过荒野。','Stand beside a Frontier Beacon to produce, store, load and trade. Real cargo must cross the frontier with you.')}</span></div>`;return;}
  const route=market.linked?tr(`路网 ${Math.max(1,market.biomeCount)} 地`,`Route · ${Math.max(1,market.biomeCount)} biomes`):tr('孤立路标','Isolated beacon'),load=cargoLoad(),cap=cargoCapacity(),warehouse=warehouseUnits(market.beacon),bench=nearStation('workbench'),guard=activeGuard(),guardCost=guardHireCost();
  const rows=Object.entries(TRADE_GOODS).map(([id,good])=>{const local=good.home===market.biome.id,buy=tradePrice(id,market,'buy'),sell=tradePrice(id,market,'sell'),bought=Number(game.trade.bought[id]||0),sold=Number(game.trade.sold[market.biome.id+':'+id]||0),owned=count(id),stored=warehouseCount(market.beacon,id),recipe=TRADE_PRODUCTION[id],produced=Number(game.trade.produced[productionKey(market,id)]||0),need=recipe?Object.entries(recipe.need).map(([mat,n])=>`${itemName(mat,lang)} ${count(mat)}/${n}`).join(' · '):'',canProduce=local&&bench&&canProduceTradeGood(id,market);return `<div class="trade-row ${local?'export':'demand'}"><div class="trade-good"><b>${GLYPH[id]||'◆'} ${itemName(id,lang)}</b><small>${local?tr('本地货物 · 可生产/采购','Local cargo · produce or buy'):tr('异地需求 · 高价收购','Imported demand · premium buyback')}</small>${local?`<small class="produce-need">${tr('生产','Make')}: ${need}</small>`:''}</div><div class="trade-owned">${tr('随身','Pack')} ${owned} · ${tr('仓','Depot')} ${stored}</div><div class="trade-actions">${local?`<button data-trade-produce="${id}" ${canProduce?'':'disabled'}>${tr('生产','Make')}<small>${TRADE_DAILY_PRODUCTION_CAP-produced}</small></button><button data-trade-buy="${id}" ${bought>=TRADE_DAILY_BUY_CAP||!cargoRoom(id,1)?'disabled':''}>${tr('采购','Buy')} ◆${buy}<small>${TRADE_DAILY_BUY_CAP-bought}</small></button>`:''}<button data-trade-load="${id}" ${stored<=0||!cargoRoom(id,1)?'disabled':''}>${tr('装货','Load')}</button><button data-trade-store="${id}" ${owned<=0||warehouse>=WAREHOUSE_CAP?'disabled':''}>${tr('入库','Store')}</button><button data-trade-sell="${id}" ${owned<=0||sold>=TRADE_DAILY_SELL_CAP?'disabled':''}>${tr('出售','Sell')} ◆${sell}<small>${TRADE_DAILY_SELL_CAP-sold}</small></button></div></div>`;}).join('');
  view.innerHTML=`<div class="trade-head"><div><b>${lang==='zh'?market.biome.zh:market.biome.en} · ${tr('边境货站','Frontier Depot')}</b><small>${route}${market.linked?tr(' · 联网成交 +6%',' · linked demand +6%'):''}</small></div><strong>◆ ${game.trade.credits}</strong></div><div class="logistics-strip"><span>${tr('货运','Cargo')} <b>${load}/${cap}</b>${count('freight_frame')>0?` · ${tr('背架','Frame')}`:''}</span><span>${tr('仓库','Depot')} <b>${warehouse}/${WAREHOUSE_CAP}</b></span><span>${tr('工匠台','Craft Table')} <b>${bench?tr('在线','Ready'):tr('缺失','Missing')}</b></span><span>${tr('护卫','Guard')} <b>${guard?Math.ceil(guard.hp)+'/'+guard.maxHp:tr('无','None')}</b></span></div><div class="escort-hire"><button data-hire-guard ${guard||load<=0?'disabled':''}>${guard?tr('护卫契约生效中','Guard on contract'):load<=0?tr('先装货再雇护卫','Load cargo before hiring'):tr(`雇佣护卫 ◆${guardCost}`,`Hire guard ◆${guardCost}`)}</button><small>${tr('护卫会跟随并近战拦截普通敌人；契约持续约一昼夜半。','Guard follows and intercepts ordinary hostiles for about 1.5 days.')}</small></div><div class="trade-note">${tr('本地原料可在工匠台打包成标准货物并直接入库；装货后占用货运容量，必须亲自送往异地才能获得需求溢价。','Local materials can be packed at a Craft Table and stored here. Loaded cargo consumes carrying capacity and earns its premium only after you deliver it to another biome.')}</div><div class="trade-list">${rows}</div>`;
  view.querySelector('[data-hire-guard]')?.addEventListener('click',hireGuard);view.querySelectorAll('[data-trade-produce]').forEach(b=>b.onclick=()=>produceTradeGood(b.dataset.tradeProduce));view.querySelectorAll('[data-trade-buy]').forEach(b=>b.onclick=()=>buyTradeGood(b.dataset.tradeBuy));view.querySelectorAll('[data-trade-load]').forEach(b=>b.onclick=()=>loadWarehouseCargo(b.dataset.tradeLoad));view.querySelectorAll('[data-trade-store]').forEach(b=>b.onclick=()=>storeWarehouseCargo(b.dataset.tradeStore));view.querySelectorAll('[data-trade-sell]').forEach(b=>b.onclick=()=>sellTradeGood(b.dataset.tradeSell));
}

function renderHotbar() {
  const bar=$('#hotbar');bar.innerHTML=game.hotbar.map((id,i)=>{const n=count(id),def=ITEMS[id],has=n>1;return `<button class="hot-slot${i===game.selected?' active':''}${has?' has-count':''}" data-slot="${i}" title="${def?itemName(id,lang):''}"><span class="key">${i+1}</span><span class="glyph">${GLYPH[id]||'·'}</span><span class="label">${def?itemName(id,lang):'—'}</span>${has?`<span class="count">${n}</span>`:''}</button>`;}).join('');bar.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{game.selected=+b.dataset.slot;renderHotbar();renderInventory();game.saveDirty=true;});
}

function dayLight(){const phase=(game.time%1);return Math.max(.13,Math.min(1,.18+.95*Math.max(0,Math.sin(phase*Math.PI*2-Math.PI/2)*.5+.5)));}
function timeLabel(){const t=(game.time%1)*24;const hour=Math.floor((t+6)%24);return `${String(hour).padStart(2,'0')}:${String(Math.floor((t*60)%60)).padStart(2,'0')}`;}
function updateHud(){
  const p=game.player;if(!p)return;$('#hpFill').style.width=(100*p.hp/p.maxHp)+'%';$('#hpText').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;
  const b=game.world.biome(p.x);$('#biomeText').textContent=lang==='zh'?b.zh:b.en;const surface=game.world.surface[Math.max(0,Math.min(WORLD_W-1,Math.floor(p.x)))];
  const depth=Math.max(0,Math.floor(p.y-surface)),zone=currentDepthZone(depth);$('#depthText').textContent=depth<3?tr(zone.zh,zone.en):tr(`${zone.zh} · ${depth}m`,`${zone.en} · ${depth}m`);
  const phase=game.nightState==='night'?tr('夜袭','Night Watch'):game.nightState==='dusk'?tr('暮色','Dusk'):tr('白昼','Daylight');$('#timeText').textContent=timeLabel()+' · '+phase;
  const beacon=nearestBeacon(),route=routeStateAt(p.x,p.y),supply=totalBeaconSupply();
  const routeText=(route.active?tr(`补给路 +8% · ${route.biomeCount}地 · ${supply}`,`SUPPLY ROUTE +8% · ${route.biomeCount} biomes · ${supply}`):beacon?tr(`路标 ${Math.ceil(beacon.d)}m · 线${route.links.length}`,`Beacon ${Math.ceil(beacon.d)}m · L${route.links.length}`):tr('无路标','No beacon'))+` · ◆${Math.max(0,Math.floor(game.trade?.credits||0))} · ▣${cargoLoad()}/${cargoCapacity()}${cargoLoadRatio()>.75?tr(' 重载',' HEAVY'):''}${activeGuard()?tr(' · ⚔护卫',' · ⚔GUARD'):''}`;
  const beaconEl=$('#beaconText');if(beaconEl){beaconEl.textContent=routeText;beaconEl.classList.toggle('route-active',route.active);beaconEl.classList.toggle('has-supply',supply>0);}
  const danger=$('#dangerText');if(danger){danger.textContent=game.nightState==='night'?(game.nightSurge>0?tr('夜袭高压','NIGHT SURGE'):tr('夜袭','NIGHT WATCH')):game.nightState==='dusk'?tr('守夜准备','PREPARE'):tr('安全','SAFE');danger.classList.toggle('active',game.nightState==='night');danger.classList.toggle('warning',game.nightState==='dusk');danger.title=[fireNotice(),routeText].filter(Boolean).join(' · ');}
}

function fireNotice(){const d=campfireDistance(game.player?.x||0,game.player?.y||0);return d<4.1?tr('熔火堆守护范围内','Within Ember Pit ward'):d<Infinity?tr('靠近熔火堆可建立守护营地','Stay near an Ember Pit to establish a safe camp'):'';}

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
  const p=game.player,b=game.world.biome(p.x),light=dayLight(),depth=currentDepth(),deep=Math.max(0,Math.min(1,(depth-5)/42)),phase=(game.time%1)*Math.PI*2,s=game.camera.tile;
  const grad=ctx.createLinearGradient(0,0,0,game.cssH);
  grad.addColorStop(0,mixColor(mixColor('#182934','#0a1116',deep),b.sky,light*(1-deep*.78)));
  grad.addColorStop(.58,mixColor('#15262d',b.deep,.62+deep*.28));
  grad.addColorStop(1,mixColor('#070c10',b.deep,Math.min(1,light+.14)*(1-deep*.55)));
  ctx.fillStyle=grad;ctx.fillRect(0,0,game.cssW,game.cssH);
  if(deep<.2){
    const orbX=(.5+.46*Math.sin(phase))*game.cssW,orbY=(.62-.47*Math.cos(phase))*game.cssH;
    ctx.globalAlpha=(.16+.42*light)*(1-deep*5);ctx.fillStyle=light>.45?'#f3d59d':'#b8d4ea';ctx.beginPath();ctx.arc(orbX,orbY,25+10*light,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.18*(1-deep*4);ctx.fillStyle='#e9f0e9';for(let i=0;i<34;i++){const x=wrapScreen(i*173-game.camera.x*s*.035,game.cssW+80)-40,y=22+(i*47%Math.max(70,game.cssH*.46));const r=1+(i%3)*.45;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=.11+.05*light;ctx.fillStyle=b.id==='ember'?'#d78565':'#c5dde1';for(let i=0;i<7;i++){const x=wrapScreen(i*221-game.camera.x*s*.055,game.cssW+260)-130,y=75+(i*71%110);ctx.beginPath();ctx.ellipse(x,y,46+(i%3)*20,10+(i%2)*4,0,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
  }
  drawBiomeParallax(b,deep,s);
  if(deep>.08){
    ctx.fillStyle=`rgba(63,77,82,${.08+deep*.12})`;for(let i=0;i<11;i++){const x=wrapScreen(i*151-game.camera.x*s*.08,game.cssW+260)-130,y=80+(i*83%Math.max(100,game.cssH-160));ctx.beginPath();ctx.ellipse(x,y,80+i%3*30,18+i%4*6,-.08,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=.10+deep*.09;ctx.fillStyle='#020608';ctx.fillRect(0,game.cssH*.72,game.cssW,game.cssH*.28);ctx.globalAlpha=1;
  }
}
function mixColor(a,b,t){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),ar=pa>>16,ag=pa>>8&255,ab=pa&255,br=pb>>16,bg=pb>>8&255,bb=pb&255;return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;}
function drawTile(tx,ty,id) {
  const def=TILE_DEFS[id];if(!def||id===TILE.AIR)return;const {x,y,s}=tileRect(tx,ty);if(x+s<0||y+s<0||x>game.cssW||y>game.cssH)return;
  if(id===TILE.LEAF||id===TILE.GLOW_MOSS||id===TILE.TORCH||id===TILE.CAMPFIRE||id===TILE.RUIN_SPIKE||id===TILE.RUIN_URN||id===TILE.ROPE||id===TILE.PLATFORM){drawNonSolidTile(x,y,s,id,def);return;}
  const h=((tx*73856093)^(ty*19349663)^(id*83492791))>>>0;
  const top=game.world.get(tx,ty-1),left=game.world.get(tx-1,ty),right=game.world.get(tx+1,ty),below=game.world.get(tx,ty+1);
  ctx.fillStyle=def.color;ctx.fillRect(x,y,s+1,s+1);
  if(top===TILE.AIR||top===TILE.LEAF||top===TILE.GLOW_MOSS){ctx.fillStyle='rgba(244,224,170,.20)';ctx.fillRect(x,y,s+1,Math.max(2,s*.09));}
  if(!TILE_DEFS[top]?.solid){ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(x+1,y+1,s-2,Math.max(1,s*.04));}
  ctx.fillStyle='rgba(0,0,0,.14)';ctx.fillRect(x,y+s-Math.max(3,s*.08),s,Math.max(3,s*.08));
  if(left===TILE.AIR){ctx.fillStyle='rgba(255,255,255,.045)';ctx.fillRect(x,y,Math.max(1,s*.035),s);}
  if(right===TILE.AIR){ctx.fillStyle='rgba(0,0,0,.05)';ctx.fillRect(x+s-Math.max(1,s*.035),y,Math.max(1,s*.035),s);}
  ctx.fillStyle='rgba(255,255,255,.045)';
  for(let k=0;k<3;k++){
    const px=x+3+((h>>(k*5))%Math.max(5,s-6)),py=y+3+((h>>(k*7+2))%Math.max(5,s-7));
    ctx.fillRect(px,py,Math.max(1.5,s*.055),Math.max(1.5,s*.055));
  }
  if([TILE.COAL,TILE.COPPER,TILE.IRON,TILE.CRYSTAL].includes(id)){
    const oreColor=id===TILE.COAL?'#20252a':id===TILE.COPPER?'#d17b56':id===TILE.IRON?'#d0d7d9':'#c2b6ff';ctx.fillStyle=oreColor;
    for(let k=0;k<4;k++){
      const ox=3+((h>>(k*4))%Math.max(4,s-7)),oy=4+((h>>(k*6+2))%Math.max(4,s-8));
      ctx.fillRect(x+ox,y+oy,Math.max(2,s*.10),Math.max(2,s*.10));
      if(id===TILE.CRYSTAL&&k<2){ctx.fillStyle='rgba(255,245,255,.45)';ctx.fillRect(x+ox-1,y+oy-1,Math.max(1,s*.05),Math.max(3,s*.16));ctx.fillStyle=oreColor;}
    }
  }
  if(id===TILE.GRASS||id===TILE.SNOW||id===TILE.ASH){
    ctx.fillStyle=id===TILE.SNOW?'rgba(255,255,255,.20)':id===TILE.GRASS?'rgba(166,204,104,.18)':'rgba(220,132,105,.10)';
    for(let k=0;k<5;k++){const px=x+2+((h>>(k*3))%(Math.max(3,s-4)));ctx.fillRect(px,y+2+(k%2),Math.max(2,s*.08),Math.max(1,s*.06));}
  }
  if(id===TILE.WOOD){ctx.fillStyle='rgba(48,27,17,.34)';ctx.fillRect(x+s*.46,y,s*.10,s);ctx.fillStyle='rgba(236,185,109,.14)';ctx.fillRect(x+s*.20,y+s*.16,s*.5,Math.max(2,s*.06));}
  if(id===TILE.WORKBENCH){ctx.fillStyle='#63412c';ctx.fillRect(x+2,y+s*.27,s-4,s*.18);ctx.fillRect(x+s*.17,y+s*.44,s*.12,s*.56);ctx.fillRect(x+s*.71,y+s*.44,s*.12,s*.56);ctx.fillStyle='#d29b60';ctx.fillRect(x+s*.27,y+s*.06,s*.46,s*.10);}
  if(id===TILE.BEACON){const active=beaconAt(tx,ty),linked=active&&linkedBeaconKeys().has(beaconKey(active.x,active.y)),supply=Math.min(MAX_BEACON_SUPPLY,Math.max(0,Number(active?.supply)||0)),pulse=.55+.45*Math.sin(performance.now()*.005+tx);ctx.fillStyle='#5d4730';ctx.fillRect(x+s*.36,y+s*.20,s*.28,s*.70);ctx.fillStyle=linked?'#d0a15e':'#b58a52';ctx.fillRect(x+s*.22,y+s*.14,s*.56,s*.16);ctx.fillStyle=`rgba(238,207,132,${.42+pulse*(linked?.5:.35)})`;ctx.fillRect(x+s*.40,y+s*.02,s*.20,s*.20);if(active){ctx.strokeStyle=linked?'rgba(114,215,184,.78)':'rgba(238,207,132,.55)';ctx.lineWidth=Math.max(1,s*(linked?.055:.035));ctx.beginPath();ctx.arc(x+s*.5,y+s*.10,s*(linked?.39:.34),Math.PI,Math.PI*2);ctx.stroke();}for(let i=0;i<supply;i++){ctx.fillStyle='#85d9bd';ctx.fillRect(x+s*(.28+i*.20),y+s*.80,s*.12,s*.10);}}
  if(id===TILE.STAR_FORGE){const pulse=.55+.45*Math.sin(performance.now()*.006+tx);ctx.fillStyle='#29283e';ctx.fillRect(x+s*.09,y+s*.22,s*.82,s*.70);ctx.fillStyle='#65558e';ctx.fillRect(x+s*.18,y+s*.12,s*.64,s*.18);ctx.fillStyle=`rgba(190,158,255,${.35+pulse*.35})`;ctx.fillRect(x+s*.38,y+s*.28,s*.24,s*.48);ctx.fillStyle='#d9c5ff';ctx.fillRect(x+s*.44,y+s*.34,s*.12,s*.30);ctx.strokeStyle=`rgba(236,217,255,${.35+pulse*.3})`;ctx.lineWidth=Math.max(1,s*.045);ctx.strokeRect(x+s*.10,y+s*.23,s*.80,s*.66);}
  if(id===TILE.RUIN){ctx.strokeStyle='rgba(227,209,222,.24)';ctx.lineWidth=Math.max(1,s*.04);ctx.strokeRect(x+1,y+1,s-2,s-2);ctx.fillStyle='rgba(220,205,218,.08)';ctx.fillRect(x+s*.14,y+s*.15,s*.72,s*.06);}
  if(id===TILE.RELIC_CHEST){const pulse=.55+.45*Math.sin(performance.now()*.004+tx);ctx.fillStyle='#49371f';ctx.fillRect(x+s*.08,y+s*.3,s*.84,s*.62);ctx.fillStyle='#9d7b43';ctx.fillRect(x+s*.05,y+s*.24,s*.9,s*.18);ctx.fillStyle='#e1bd6c';ctx.fillRect(x+s*.44,y+s*.28,s*.13,s*.48);ctx.fillStyle=`rgba(255,220,130,${.18+pulse*.34})`;ctx.fillRect(x+s*.28,y+s*.08,s*.44,s*.15);ctx.strokeStyle='#2e2418';ctx.lineWidth=Math.max(1,s*.05);ctx.strokeRect(x+s*.08,y+s*.3,s*.84,s*.62);}
}
function drawNonSolidTile(x,y,s,id,def){
  if(id===TILE.LEAF){
    const seed=((x*17+y*31)|0)>>>0;ctx.fillStyle=def.color;ctx.globalAlpha=.94;
    const side=s*.13,rows=seed%3===0?3:2;
    for(let ry=0;ry<rows;ry++)for(let rx=0;rx<3;rx++){
      if(((seed>>(rx+ry*3))&3)===0&&rx===2&&ry===rows-1)continue;
      const px=x+s*.14+rx*s*.27,py=y+s*.18+ry*s*.27;
      ctx.fillRect(px,py,Math.max(3,side),Math.max(3,side));
    }
    ctx.fillStyle='rgba(188,219,116,.18)';ctx.fillRect(x+s*.22,y+s*.18,s*.15,s*.07);ctx.fillRect(x+s*.52,y+s*.45,s*.11,s*.06);ctx.globalAlpha=1;return;
  }
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
function drawProjectiles(){
  const s=game.camera.tile;for(const p of game.projectiles){const x=(p.x-game.camera.x)*s,y=(p.y-game.camera.y)*s;if(x<-20||x>game.cssW+20||y<-20||y>game.cssH+20)continue;const ang=Math.atan2(p.vy,p.vx);ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.strokeStyle=p.kind==='crystal_bow'?'#c6bcff':'#dfc59e';ctx.lineWidth=Math.max(1,s*.045);ctx.beginPath();ctx.moveTo(-s*.34,0);ctx.lineTo(s*.28,0);ctx.stroke();ctx.fillStyle=p.kind==='crystal_bow'?'#d7ceff':'#8f6b48';ctx.beginPath();ctx.moveTo(s*.35,0);ctx.lineTo(s*.1,-s*.11);ctx.lineTo(s*.1,s*.11);ctx.closePath();ctx.fill();ctx.restore();}}
function drawEnemyProjectiles(){
  const s=game.camera.tile;for(const p of game.enemyProjectiles){const x=(p.x-game.camera.x)*s,y=(p.y-game.camera.y)*s;if(x<-30||x>game.cssW+30||y<-30||y>game.cssH+30)continue;ctx.save();ctx.translate(x,y);const ang=Math.atan2(p.vy,p.vx),pulse=.6+.4*Math.sin(performance.now()*.012);ctx.rotate(ang);ctx.globalAlpha=.2+pulse*.15;ctx.fillStyle='#66c7ae';ctx.beginPath();ctx.arc(0,0,s*.3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#9be5cf';ctx.lineWidth=Math.max(1,s*.055);ctx.beginPath();ctx.moveTo(-s*.24,0);ctx.lineTo(s*.2,0);ctx.stroke();ctx.fillStyle='#4b8e7b';ctx.beginPath();ctx.arc(s*.2,0,s*.09,0,Math.PI*2);ctx.fill();ctx.restore();}}
function drawCargoBundles(){
  const s=game.camera.tile;for(const b of game.cargoBundles||[]){const x=(b.x-game.camera.x)*s,y=(b.y-game.camera.y)*s,w=s*.82,h=s*.62,ratio=Math.max(0,b.hp/b.maxHp);ctx.fillStyle='#3d2c22';ctx.fillRect(x-w/2,y-h/2,w,h);ctx.strokeStyle=ratio>.6?'#d0a15e':ratio>.3?'#d78055':'#c24f4f';ctx.lineWidth=Math.max(1,s*.055);ctx.strokeRect(x-w/2,y-h/2,w,h);ctx.fillStyle='#d7b268';ctx.fillRect(x-w*.34,y-h*.1,w*.68,h*.16);ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x-w/2,y-h*.7,w,h*.12);ctx.fillStyle=ratio>.35?'#7bd5b8':'#e48166';ctx.fillRect(x-w/2,y-h*.7,w*ratio,h*.12);ctx.fillStyle='#f0d9a2';ctx.font=`${Math.max(8,s*.28)}px system-ui`;ctx.textAlign='center';ctx.fillText('▣'+bundleUnits(b),x,y+h*.82);}
}
function drawGuard(){const g=activeGuard();if(!g)return;const s=game.camera.tile,x=(g.x-game.camera.x)*s,y=(g.y-game.camera.y)*s;ctx.save();ctx.translate(x,y);if(g.facing<0)ctx.scale(-1,1);ctx.fillStyle='#27383d';ctx.fillRect(-s*.25,-s*.72,s*.5,s*.82);ctx.fillStyle='#a9b9ae';ctx.fillRect(-s*.19,-s*.96,s*.38,s*.28);ctx.fillStyle='#c29b5f';ctx.fillRect(s*.22,-s*.58,s*.08,s*.62);ctx.restore();ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x-s*.32,y-s*1.12,s*.64,s*.08);ctx.fillStyle='#78c59c';ctx.fillRect(x-s*.32,y-s*1.12,s*.64*(g.hp/g.maxHp),s*.08);}
function drawDrops(){
  const s=game.camera.tile;
  for(const d of game.drops){
    const x=(d.x-game.camera.x)*s,y=(d.y-game.camera.y)*s+Math.sin(d.bob)*2;
    if(x<-30||x>game.cssW+30||y<-30||y>game.cssH+30)continue;
    const item=ITEMS[d.id],rare=!!item?.rare||d.id==='ancient_core';
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,s*.22,s*(rare?.34:.25),s*.10,0,0,Math.PI*2);ctx.fill();
    if(rare){ctx.globalAlpha=.18+.08*Math.sin(performance.now()*.006+d.bob);ctx.fillStyle='#efc96d';ctx.beginPath();ctx.arc(0,0,s*.52,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
    const color=item?.tile?TILE_DEFS[item.tile]?.color||'#d8c18b':rare?'#e8c16b':'#d8c18b';
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-s*(rare?.30:.22));ctx.lineTo(s*(rare?.26:.19),0);ctx.lineTo(0,s*(rare?.30:.22));ctx.lineTo(-s*(rare?.26:.19),0);ctx.closePath();ctx.fill();
    ctx.strokeStyle=rare?'rgba(255,236,176,.95)':'rgba(245,232,192,.72)';ctx.lineWidth=Math.max(1,rare?s*.045:s*.028);ctx.stroke();
    if(d.n>1){ctx.fillStyle='#fff3d1';ctx.font=`700 ${Math.max(8,s*.28)}px system-ui`;ctx.fillText(String(d.n),s*.18,s*.28);}
    ctx.restore();
  }
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
  }else if(item.kind==='weapon'&&item.ranged){
    ctx.strokeStyle=id==='crystal_bow'?'#b9afff':'#b08459';ctx.lineWidth=Math.max(2,s*.075);ctx.beginPath();ctx.arc(w*.28,0,h*.42,-1.15,1.15);ctx.stroke();ctx.strokeStyle='#d9c8ae';ctx.lineWidth=Math.max(1,s*.025);ctx.beginPath();ctx.moveTo(w*.28,-h*.38);ctx.lineTo(w*.28,h*.38);ctx.stroke();
  }else if(item.kind==='weapon'){
    ctx.strokeStyle=id==='sentinel_blade'?'#e0b85f':id==='crystal_blade'?'#b7adff':id==='iron_blade'?'#c5cccf':id==='copper_blade'?'#d7815b':id==='stone_blade'?'#9aa1a3':'#b58a5f';ctx.lineWidth=Math.max(3,s*.1);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w*.88,-h*.25);ctx.stroke();ctx.strokeStyle='#6e4d33';ctx.lineWidth=Math.max(2,s*.07);ctx.beginPath();ctx.moveTo(w*.08,-h*.02);ctx.lineTo(w*.31,h*.13);ctx.stroke();
  }else if(item.tile){ctx.fillStyle=TILE_DEFS[item.tile]?.color||'#b8a27c';ctx.fillRect(w*.32,-h*.18,w*.34,w*.34);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.strokeRect(w*.32,-h*.18,w*.34,w*.34);}
  ctx.restore();
}
function drawPlayer(){
  const p=game.player,s=game.camera.tile,x=(p.x-game.camera.x)*s,y=(p.y-game.camera.y)*s,w=p.w*s,h=p.h*s;ctx.save();ctx.translate(x,y);
  const land=Math.min(1,(p.landingKick||0)/.12);if(land>0)ctx.scale(1+land*.065,1-land*.07);if(p.facing<0)ctx.scale(-1,1);
  const moving=Math.min(1,Math.abs(p.vx)/3.8),walk=Math.sin(performance.now()*.020)*moving;
  ctx.fillStyle='rgba(0,0,0,.30)';ctx.beginPath();ctx.ellipse(0,h*.49,w*.52,h*.09,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=game.hurtCd>0?'#ef9b8e':'#d9c5a7';ctx.fillRect(-w*.23,-h*.49,w*.46,h*.29);
  ctx.fillStyle='#202a2c';ctx.beginPath();ctx.moveTo(-w*.28,-h*.54);ctx.lineTo(0,-h*.66);ctx.lineTo(w*.28,-h*.54);ctx.lineTo(w*.22,-h*.46);ctx.lineTo(-w*.22,-h*.46);ctx.closePath();ctx.fill();
  ctx.fillStyle='#334c4f';ctx.fillRect(-w*.33,-h*.18,w*.66,h*.58);
  ctx.fillStyle='#9b6d47';ctx.fillRect(-w*.36,-h*.10,w*.12,h*.24);ctx.fillRect(w*.24,-h*.10,w*.12,h*.24);
  ctx.fillStyle='#151f22';ctx.fillRect(-w*.31+walk*2,h*.39,w*.24,h*.44);ctx.fillRect(w*.07-walk*2,h*.39,w*.24,h*.44);
  ctx.fillStyle='#b08a5e';ctx.fillRect(-w*.34+walk*2,h*.77,w*.30,h*.09);ctx.fillRect(w*.05-walk*2,h*.77,w*.30,h*.09);
  ctx.fillStyle='#e6d7b9';ctx.fillRect(w*.10,-h*.38,w*.06,h*.045);ctx.fillStyle='#c88b56';ctx.fillRect(-w*.03,-h*.43,w*.13,h*.035);
  if(p.grounded&&moving>.2){ctx.fillStyle='rgba(212,178,129,.24)';ctx.fillRect(-w*.38+walk*3,h*.86,w*.10,h*.03);ctx.fillRect(w*.24-walk*3,h*.86,w*.10,h*.03);}
  drawHeldItem(s,w,h);
  if(p.attackFlash>0){ctx.strokeStyle='rgba(247,216,144,.92)';ctx.lineWidth=Math.max(2,s*.075);ctx.beginPath();ctx.arc(w*.16,0,w*1.45,-.85,.55);ctx.stroke();}
  ctx.restore();
}
function drawEnemyBody(e,s){
  const c=e.def.color,t=e.type;ctx.fillStyle=c;
  if(t==='moss_crawler'){
    ctx.beginPath();ctx.ellipse(0,s*.04,s*.48,s*.3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#46683e';ctx.beginPath();ctx.arc(-s*.1,-s*.13,s*.31,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle='#365130';ctx.lineWidth=Math.max(2,s*.06);for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*s*.12,-s*.26);ctx.lineTo(i*s*.14,-s*.4-Math.abs(i)*s*.025);ctx.stroke();}
  }else if(t==='ash_scuttler'){
    ctx.beginPath();ctx.ellipse(0,0,s*.34,s*.23,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#71352e';ctx.lineWidth=Math.max(2,s*.06);for(const side of [-1,1])for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(side*s*.18,i*s*.1);ctx.lineTo(side*s*(.43+Math.abs(i)*.05),s*(.18+i*.16));ctx.stroke();}ctx.fillStyle='#f0a05e';ctx.fillRect(e.dir>0?s*.12:-s*.2,-s*.08,s*.07,s*.07);
  }else if(t==='shardback'){
    ctx.beginPath();ctx.ellipse(0,s*.05,s*.43,s*.29,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b7d9e8';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*s*.14,-s*.16);ctx.lineTo(i*s*.11,-s*(.48-Math.abs(i)*.05));ctx.lineTo((i+.65)*s*.14,-s*.14);ctx.closePath();ctx.fill();}ctx.fillStyle='#1d3543';ctx.fillRect(e.dir>0?s*.14:-s*.22,-s*.02,s*.07,s*.07);
  }else if(t==='rift_beast'){
    ctx.fillStyle='#6e3946';ctx.beginPath();ctx.ellipse(0,s*.02,s*.62,s*.43,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=c;ctx.fillRect(-s*.48,-s*.25,s*.96,s*.50);ctx.fillStyle='#4b2838';for(const side of [-1,1])for(let i=0;i<2;i++){const lx=side*(.28+i*.18)*s;ctx.fillRect(lx-s*.06,s*.25,s*.11,s*.30);}
    ctx.fillStyle='#f6d48b';for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*s*.22,-s*.26);ctx.lineTo(side*s*.48,-s*.68);ctx.lineTo(side*s*.34,-s*.13);ctx.closePath();ctx.fill();}ctx.fillStyle='#fff0d0';ctx.fillRect(e.dir>0?s*.30:-s*.38,-s*.10,s*.08,s*.08);
  }else if(t==='hollow_wisp'){
    ctx.globalAlpha=.22;ctx.beginPath();ctx.arc(0,0,s*.62,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(0,0,s*.31,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d5fff2';ctx.beginPath();ctx.arc(-s*.07,-s*.06,s*.08,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=c;ctx.lineWidth=Math.max(2,s*.05);ctx.beginPath();ctx.moveTo(-s*.12,s*.25);ctx.quadraticCurveTo(0,s*.52,s*.15,s*.28);ctx.stroke();
  }else{
    ctx.fillStyle='#5c5069';ctx.fillRect(-s*.34,-s*.34,s*.68,s*.68);ctx.fillStyle=c;ctx.fillRect(-s*.25,-s*.26,s*.5,s*.52);ctx.fillStyle='#c9b4dc';ctx.fillRect(-s*.07,-s*.12,s*.14,s*.14);ctx.strokeStyle='#43394d';ctx.lineWidth=Math.max(2,s*.07);ctx.strokeRect(-s*.34,-s*.34,s*.68,s*.68);
  }
}
function drawEnemies(){
  const s=game.camera.tile;for(const e of game.enemies){if(e.dead)continue;const x=(e.x-game.camera.x)*s,y=(e.y-game.camera.y)*s;if(x<-100||x>game.cssW+100||y<-100||y>game.cssH+100)continue;ctx.save();ctx.translate(x,y);if(e.dir<0)ctx.scale(-1,1);if(e.boss){const pulse=.68+.32*Math.sin(performance.now()*.005);ctx.strokeStyle=`rgba(239,199,125,${.55+pulse*.35})`;ctx.lineWidth=Math.max(2,s*.09);ctx.beginPath();ctx.arc(0,0,s*(1.02+.08*Math.sin(performance.now()*.004)),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.10+pulse*.08;ctx.fillStyle='#d96d7a';ctx.beginPath();ctx.arc(0,0,s*1.12,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}if(e.elite){const pulse=.72+.28*Math.sin(performance.now()*.007);ctx.strokeStyle=e.windup>0?`rgba(255,116,76,${pulse})`:`rgba(234,190,96,${pulse})`;ctx.lineWidth=Math.max(2,s*.08);ctx.beginPath();ctx.arc(0,0,s*(e.windup>0?.72:.58),0,Math.PI*2);ctx.stroke();ctx.fillStyle=e.windup>0?`rgba(235,87,49,${.09+pulse*.08})`:`rgba(223,171,76,${.07+pulse*.05})`;ctx.beginPath();ctx.arc(0,0,s*(e.windup>0?.8:.7),0,Math.PI*2);ctx.fill();if(e.windup>0){ctx.strokeStyle=`rgba(255,199,113,${.55+pulse*.35})`;ctx.lineWidth=Math.max(1,s*.045);ctx.beginPath();ctx.moveTo(s*.45,0);ctx.lineTo(s*2.1,0);ctx.stroke();}if(e.charge>0){ctx.globalAlpha=.22;ctx.fillStyle='#f1b95a';ctx.fillRect(-s*1.8,-s*.28,s*1.8,s*.56);ctx.globalAlpha=1;}}if(e.hit>0)ctx.globalAlpha=.52;drawEnemyBody(e,s);ctx.globalAlpha=1;if(e.elite||e.hp<e.maxHp){ctx.fillStyle='rgba(0,0,0,.68)';ctx.fillRect(-s*(e.boss?.9:.48),-s*(e.boss?.86:.7),s*(e.boss?1.8:.96),Math.max(4,s*.045));ctx.fillStyle=e.boss?'#e3b968':e.elite?'#d5a44e':'#c76658';ctx.fillRect(-s*(e.boss?.9:.48),-s*(e.boss?.86:.7),s*(e.boss?1.8:.96)*(e.hp/e.maxHp),Math.max(4,s*.045));if(e.boss){ctx.fillStyle='#f5ddae';ctx.font=`700 ${Math.max(10,s*.32)}px system-ui`;ctx.textAlign='center';ctx.fillText(tr('裂隙巨兽','Rift Behemoth'),0,-s*1.02);}}ctx.restore();}
}
const lightCanvas=document.createElement('canvas'),lightCtx=lightCanvas.getContext('2d');
function ensureLightBuffer(){const w=Math.max(1,Math.round(game.cssW)),h=Math.max(1,Math.round(game.cssH));if(lightCanvas.width!==w||lightCanvas.height!==h){lightCanvas.width=w;lightCanvas.height=h;}}
function punchLight(px,py,r,strength=1){const g=lightCtx.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(0,0,0,${strength})`);g.addColorStop(.45,`rgba(0,0,0,${strength*.72})`);g.addColorStop(1,'rgba(0,0,0,0)');lightCtx.fillStyle=g;lightCtx.beginPath();lightCtx.arc(px,py,r,0,Math.PI*2);lightCtx.fill();}
function drawLighting(){
  const depth=currentDepth(),night=1-dayLight(),dark=Math.min(.88,Math.max(night*.5,depth<=2?0:0.18+depth*.009));if(dark<.04)return;
  ensureLightBuffer();lightCtx.clearRect(0,0,lightCanvas.width,lightCanvas.height);lightCtx.globalCompositeOperation='source-over';lightCtx.fillStyle=`rgba(3,7,10,${dark})`;lightCtx.fillRect(0,0,lightCanvas.width,lightCanvas.height);lightCtx.globalCompositeOperation='destination-out';
  const s=game.camera.tile,p=game.player;punchLight((p.x-game.camera.x)*s,(p.y-game.camera.y)*s,s*(depth>8?2.35:3.2),.88);
  const minX=Math.max(0,Math.floor(game.camera.x)-1),maxX=Math.min(WORLD_W-1,Math.ceil(game.camera.x+game.cssW/s)+1),minY=Math.max(0,Math.floor(game.camera.y)-1),maxY=Math.min(WORLD_H-1,Math.ceil(game.camera.y+game.cssH/s)+1);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const id=game.world.get(x,y);if(id===TILE.TORCH)punchLight((x+.5-game.camera.x)*s,(y+.5-game.camera.y)*s,s*5.2,1);else if(id===TILE.CAMPFIRE)punchLight((x+.5-game.camera.x)*s,(y+.5-game.camera.y)*s,s*6.4,1);else if(id===TILE.CRYSTAL||id===TILE.GLOW_MOSS||id===TILE.RELIC_CHEST||id===TILE.STAR_FORGE)punchLight((x+.5-game.camera.x)*s,(y+.5-game.camera.y)*s,s*(id===TILE.CRYSTAL?2.8:id===TILE.RELIC_CHEST?2.25:id===TILE.STAR_FORGE?3.2:1.7),id===TILE.RELIC_CHEST?.36:id===TILE.STAR_FORGE?.62:.55);}
  lightCtx.globalCompositeOperation='source-over';ctx.drawImage(lightCanvas,0,0,game.cssW,game.cssH);
}
function drawTarget(){
  const heldId=game.quickPlaceId||selectedId(),held=ITEMS[heldId],placing=!!held?.tile&&!game.input.mine,t=placing?placementTarget(held):stableMineTarget(reachTarget());if(!t.ok)return;
  const {x,y,s}=tileRect(t.x,t.y),tile=game.world.get(t.x,t.y);ctx.strokeStyle=t.assisted?'rgba(114,215,184,.95)':'rgba(242,216,158,.86)';ctx.lineWidth=t.assisted?2:1.4;ctx.strokeRect(x+.8,y+.8,s-1.6,s-1.6);
  if(placing&&tile===TILE.AIR&&canPlaceAt(t.x,t.y)){const def=TILE_DEFS[held.tile];ctx.save();ctx.globalAlpha=.24;ctx.fillStyle=def?.color||'#d8c18b';ctx.fillRect(x+2,y+2,s-4,s-4);ctx.globalAlpha=.7;ctx.strokeStyle=hasPlacementSupport(t.x,t.y,held.tile)?'rgba(125,220,176,.8)':'rgba(220,108,96,.8)';ctx.strokeRect(x+2.5,y+2.5,s-5,s-5);ctx.restore();}
  if(game.mine.key===t.x+','+t.y&&game.mine.progress>0){const p=Math.min(1,game.mine.progress);ctx.strokeStyle=`rgba(255,238,203,${.25+p*.7})`;ctx.lineWidth=Math.max(1,1+p*1.6);ctx.beginPath();ctx.moveTo(x+s*.18,y+s*.2);ctx.lineTo(x+s*(.38+p*.08),y+s*.48);ctx.lineTo(x+s*.24,y+s*.82);ctx.moveTo(x+s*.78,y+s*.16);ctx.lineTo(x+s*(.58-p*.08),y+s*.45);ctx.lineTo(x+s*.76,y+s*.78);if(p>.48){ctx.moveTo(x+s*.46,y+s*.08);ctx.lineTo(x+s*.5,y+s*.33);ctx.lineTo(x+s*.37,y+s*.63);ctx.lineTo(x+s*.52,y+s*.92);}ctx.stroke();}
}

function drawSupplyRoutes(){
  const links=beaconLinks();if(!links.length)return;const s=game.camera.tile,now=performance.now(),p=game.player;ctx.save();ctx.lineCap='round';ctx.setLineDash([Math.max(5,s*.34),Math.max(4,s*.22)]);ctx.lineDashOffset=-(now*.025%(s*.56));
  for(const link of links){const ax=(link.a.x-game.camera.x)*s,ay=(link.a.y-game.camera.y)*s,bx=(link.b.x-game.camera.x)*s,by=(link.b.y-game.camera.y)*s;if(Math.max(ax,bx)<-40||Math.min(ax,bx)>game.cssW+40||Math.max(ay,by)<-40||Math.min(ay,by)>game.cssH+40)continue;const biomes=componentBiomeIds(beaconComponentFor(link.a)),diverse=biomes.length>1,active=pointSegmentDistance(p.x,p.y,link.a,link.b)<=ROUTE_RADIUS;ctx.globalAlpha=active?.62:diverse?.34:.22;ctx.strokeStyle=diverse?'#82d7bc':'#d3b66d';ctx.lineWidth=Math.max(1.4,s*(active?.075:.045));ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}
  ctx.restore();
}

function drawFx(){
  const s=game.camera.tile;
  for(const p of game.fx.particles){const x=(p.x-game.camera.x)*s,y=(p.y-game.camera.y)*s,a=Math.max(0,p.life/p.max);ctx.globalAlpha=a;ctx.fillStyle=p.color;const q=Math.max(2,p.size*s);ctx.fillRect(x-q/2,y-q/2,q,q);}
  ctx.globalAlpha=1;
}
function render(){ctx.save();if(game.fx.shake>0)ctx.translate((game.rng()-.5)*game.fx.shake,(game.rng()-.5)*game.fx.shake);drawBackdrop();drawWorld();drawSupplyRoutes();drawProjectiles();drawEnemyProjectiles();drawEnemies();drawDrops();drawCargoBundles();drawGuard();drawPlayer();drawTarget();drawFx();ctx.restore();drawLighting();updateHud();updateTargetTip();}
function updateTargetTip(){if(!game.pointer.active){$('#targetTip').classList.remove('show');return;}const t=reachTarget();if(!t.ok){$('#targetTip').textContent=tr('超出触及范围','Out of reach');$('#targetTip').classList.add('show');return;}const e=nearestEnemyAtTarget(t);if(e)$('#targetTip').textContent=`${e.elite?tr('精英 · ','ELITE · '):''}${lang==='zh'?e.def.zh:e.def.en} · ${Math.ceil(e.hp)}/${e.maxHp}`;else{const id=game.world.get(t.x,t.y);if(id===TILE.RELIC_CHEST){const unlocked=!!game.guardianDefeated[chestKey(t.x,t.y)];$('#targetTip').textContent=unlocked?tr('遗物箱 · 已解锁 · 采/战键开启','Relic Cache · Unlocked · Mine/Fight to open'):tr('遗物箱 · 守箱者沉睡其中','Relic Cache · A warden sleeps within');}else if(id===TILE.BEACON){const b=beaconAt(t.x,t.y),linked=linkedBeaconKeys().has(beaconKey(b?.x||t.x,b?.y||t.y)),supply=Math.min(MAX_BEACON_SUPPLY,Math.max(0,Number(b?.supply)||0)),component=beaconComponentFor(b),biomeCount=componentBiomeIds(component).length,exchange=b?beaconExchangeGood(b):null,cargo=exchange?itemName(exchange.id,lang):tr('本地','Local'),stored=warehouseUnits(b);$('#targetTip').textContent=tr(`边境路标 · ${linked?biomeCount+'地路网':'孤立'} · 仓库 ${stored}/${WAREHOUSE_CAP} · E→贸易`,`Frontier Beacon · ${linked?biomeCount+'-biome link':'Isolated'} · Depot ${stored}/${WAREHOUSE_CAP} · E→Trade`);}else if(id===TILE.STAR_FORGE){const pct=Math.round(game.forgeProgress*100);$('#targetTip').textContent=game.forgeActive?(game.bossActive?tr('星核炉 · 裂隙已唤醒 · 撑住！','Starcore Forge · Rift awakened · Hold the line!'):tr('星核炉 · 已点燃','Starcore Forge · Ignited')):(pct>0?tr(`星核炉 · 点燃 ${pct}%`,`Starcore Forge · Igniting ${pct}%`):tr('星核炉 · 长按采/战键点燃','Starcore Forge · Hold Mine/Use to ignite'));}else $('#targetTip').textContent=id===TILE.AIR?`${t.x}, ${t.y}`:`${tileName(id,lang)} · ${t.x}, ${t.y}`;}$('#targetTip').classList.add('show');}
function updateCamera(dt){const p=game.player,s=game.camera.tile,lookX=Math.max(-1.35,Math.min(1.35,p.vx*.22)),lookY=p.vy>5?Math.min(.7,(p.vy-5)*.07):0,targetX=p.x+lookX-game.cssW/s*.5,targetY=p.y+lookY-game.cssH/s*.55,k=1-Math.pow(.0014,dt);game.camera.x+=(targetX-game.camera.x)*k;game.camera.y+=(targetY-game.camera.y)*k;game.camera.x=Math.max(0,Math.min(WORLD_W-game.cssW/s,game.camera.x));game.camera.y=Math.max(0,Math.min(WORLD_H-game.cssH/s,game.camera.y));}

function loop(now){if(!game.running)return;let dt=Math.min(.033,Math.max(.001,(now-(game.last||now))/1000));game.last=now;syncMobileAim();if(!game.uiOpen){updatePlayer(dt);updateHazards();updateActions(dt);updateProjectiles(dt);updateEnemyProjectiles(dt);updateEnemies(dt);updateDrops(dt);updateCampfireRest(dt);updateProgression(dt);game.time=(game.time+dt/180)%1;}updateFx(dt);updateCamera(dt);render();game.autosave+=dt;if(game.autosave>10&&game.saveDirty)saveGame(false);requestAnimationFrame(loop);}

function setInput(action,on){if(action in game.input)game.input[action]=on;}
function aimFromEvent(e){game.pointer.kind=e.pointerType==='touch'?'touch':'mouse';const r=canvas.getBoundingClientRect();game.pointer.x=e.clientX-r.left;game.pointer.y=e.clientY-r.top;game.pointer.active=true;const q=pointerWorld();game.pointer.worldX=q.x;game.pointer.worldY=q.y;$('#crosshair').style.left=e.clientX+'px';$('#crosshair').style.top=e.clientY+'px';$('#crosshair').style.display='block';}
function setAimVector(nx,ny){
  const mag=Math.hypot(nx,ny)||1,nx2=nx/mag,ny2=ny/mag,s=game.camera.tile,reach=4.45;
  game.mobileAim.x=nx2;game.mobileAim.y=ny2;game.pointer.kind='touch';game.pointer.active=true;game.pointer.x=(game.player.x-game.camera.x+nx2*reach)*s;game.pointer.y=(game.player.y-game.camera.y+ny2*reach)*s;const q=pointerWorld();game.pointer.worldX=q.x;game.pointer.worldY=q.y;$('#crosshair').style.left=game.pointer.x+'px';$('#crosshair').style.top=game.pointer.y+'px';$('#crosshair').style.display='block';
}
function syncMobileAim(){if(game.mobileAim.active)setAimVector(game.mobileAim.x,game.mobileAim.y);}
function cycleHotbar(step){game.selected=(game.selected+step+HOTBAR_SIZE)%HOTBAR_SIZE;renderHotbar();renderInventory();game.saveDirty=true;}
canvas.addEventListener('pointermove',e=>aimFromEvent(e));
canvas.addEventListener('pointerdown',e=>{ensureAudio();if(!game.running||game.uiOpen)return;aimFromEvent(e);try{canvas.setPointerCapture?.(e.pointerId);}catch{}if(e.pointerType!=='touch'){if(e.button===2)game.input.place=true;else game.input.mine=true;}e.preventDefault();});
canvas.addEventListener('pointerup',e=>{if(e.button===2)game.input.place=false;else game.input.mine=false;e.preventDefault();});
canvas.addEventListener('pointercancel',()=>{game.input.mine=game.input.place=false;});canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{if(!game.running||game.uiOpen)return;cycleHotbar(e.deltaY>0?1:-1);e.preventDefault();},{passive:false});
addEventListener('keydown',e=>{ensureAudio();if(e.repeat&&['KeyE','KeyF','KeyR','Escape','ControlLeft','ControlRight'].includes(e.code))return;if(/^Digit[1-8]$/.test(e.code)){game.selected=+e.code.slice(-1)-1;renderHotbar();renderInventory();return;}if(e.code==='ControlLeft'||e.code==='ControlRight'){game.smartCursor=!game.smartCursor;toast(game.smartCursor?tr('智能光标 · 开','Smart Cursor · ON'):tr('智能光标 · 关','Smart Cursor · OFF'));e.preventDefault();return;}if(e.code==='ShiftLeft'||e.code==='ShiftRight'){game.autoTool=true;return;}if(e.code==='KeyE'){togglePanel('inventoryPanel');return;}if(e.code==='KeyR'){toggleCargoBundle();e.preventDefault();return;}if(e.code==='KeyQ'){setInput('dash',true);e.preventDefault();return;}if(e.code==='Escape'){closePanels();return;}if(e.code==='KeyF'){goFullscreen();return;}if(e.code==='KeyA'||e.code==='ArrowLeft')setInput('left',true);if(e.code==='KeyD'||e.code==='ArrowRight')setInput('right',true);if(e.code==='KeyS'||e.code==='ArrowDown')setInput('down',true);if(e.code==='Space'||e.code==='KeyW'||e.code==='ArrowUp'){setInput('jump',true);e.preventDefault();}});
addEventListener('keyup',e=>{if(e.code==='KeyA'||e.code==='ArrowLeft')setInput('left',false);if(e.code==='KeyD'||e.code==='ArrowRight')setInput('right',false);if(e.code==='KeyQ')setInput('dash',false);if(e.code==='KeyS'||e.code==='ArrowDown')setInput('down',false);if(e.code==='ShiftLeft'||e.code==='ShiftRight')game.autoTool=false;if(e.code==='Space'||e.code==='KeyW'||e.code==='ArrowUp')setInput('jump',false);});

function setupStick(el,onMove,onEnd){
  let activeId=null;const knob=el.querySelector('.stick-knob');
  const move=e=>{if(activeId!==e.pointerId)return;const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.32,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy)||1,scale=Math.min(1,max/len),px=dx*scale,py=dy*scale;knob.style.transform=`translate(${px}px,${py}px)`;onMove(px/max,py/max,Math.min(1,len/max),e);e.preventDefault();};
  el.addEventListener('pointerdown',e=>{ensureAudio();if(e.pointerType==='touch')game.pointer.kind='touch';if(activeId!==null)return;activeId=e.pointerId;el.classList.add('active');try{el.setPointerCapture?.(e.pointerId);}catch{}move(e);});
  el.addEventListener('pointermove',move);
  const end=e=>{if(activeId!==e.pointerId)return;activeId=null;el.classList.remove('active');knob.style.transform='translate(0,0)';onEnd(e);e.preventDefault();};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
}
setupStick($('#moveStick'),(x,y,mag)=>{const dead=.16,ax=Math.abs(x)<dead?0:Math.sign(x)*(Math.abs(x)-dead)/(1-dead),ay=Math.abs(y)<dead?0:Math.sign(y)*(Math.abs(y)-dead)/(1-dead);game.moveAxis.x=ax;game.moveAxis.y=ay;game.moveAxis.touch=true;setInput('left',ax<-.12);setInput('right',ax>.12);setInput('down',ay>.42);setInput('jump',ay<-.42);},()=>{game.moveAxis.x=game.moveAxis.y=0;game.moveAxis.touch=false;setInput('left',false);setInput('right',false);setInput('down',false);setInput('jump',false);});
setupStick($('#aimStick'),(x,y,mag)=>{if(mag>.16){game.mobileAim.active=true;setAimVector(x,y);setInput('mine',true);}else{game.mobileAim.active=false;setInput('mine',false);}},()=>{game.mobileAim.active=false;setInput('mine',false);});
const jumpOn=e=>{e.preventDefault();setInput('jump',true);};const jumpOff=e=>{e.preventDefault();setInput('jump',false);};$('#mobileJump').addEventListener('pointerdown',jumpOn);$('#mobileJump').addEventListener('pointerup',jumpOff);$('#mobileJump').addEventListener('pointercancel',jumpOff);
const placeOn=e=>{e.preventDefault();if(e.pointerType==='touch')game.pointer.kind='touch';game.quickPlaceId=null;setInput('place',true);};const placeOff=e=>{e.preventDefault();setInput('place',false);game.quickPlaceId=null;};$('#mobilePlace').addEventListener('pointerdown',placeOn);$('#mobilePlace').addEventListener('pointerup',placeOff);$('#mobilePlace').addEventListener('pointercancel',placeOff);
const torchOn=e=>{e.preventDefault();if(e.pointerType==='touch')game.pointer.kind='touch';game.quickPlaceId='torch';setInput('place',true);};const torchOff=e=>{e.preventDefault();setInput('place',false);game.quickPlaceId=null;};$('#mobileTorch').addEventListener('pointerdown',torchOn);$('#mobileTorch').addEventListener('pointerup',torchOff);$('#mobileTorch').addEventListener('pointercancel',torchOff);
$('#mobileDash').addEventListener('pointerdown',e=>{e.preventDefault();game.pointer.kind='touch';game.input.dash=true;setTimeout(()=>game.input.dash=false,40);});
$('#mobileCargo').onclick=()=>toggleCargoBundle();
$('#mobilePack').onclick=()=>togglePanel('inventoryPanel');

function closePanels(){for(const id of ['inventoryPanel','menuPanel'])$('#'+id).classList.add('hidden');game.uiOpen=false;}
function togglePanel(id){const panel=$('#'+id),willOpen=panel.classList.contains('hidden');closePanels();if(willOpen){panel.classList.remove('hidden');game.uiOpen=true;if(id==='inventoryPanel'){renderInventory();renderCraft();renderTrade();}}}
$$('.panel-close').forEach(b=>b.onclick=()=>closePanels());
$$('[data-tab]').forEach(btn=>btn.onclick=()=>{$$('[data-tab]').forEach(x=>x.classList.toggle('active',x===btn));for(const [tab,id] of [['inventory','inventoryView'],['craft','craftView'],['trade','tradeView']])$('#'+id).classList.toggle('hidden',btn.dataset.tab!==tab);if(btn.dataset.tab==='craft')renderCraft();if(btn.dataset.tab==='trade')renderTrade();});
$('#menuBtn').onclick=()=>togglePanel('menuPanel');$('#saveBtn').onclick=()=>saveGame(true);$('#menuSaveBtn').onclick=()=>saveGame(true);$('#controlsBtn').onclick=()=>$('#controlsCopy').classList.toggle('hidden');
$('#newWorldBtn').onclick=()=>{if(confirm(tr('这会替换当前本地世界。继续？','This replaces the current local world. Continue?'))){for(const key of [SAVE_KEY,LEGACY_SAVE_KEY_0120,LEGACY_SAVE_KEY_0110,LEGACY_SAVE_KEY_0100,LEGACY_SAVE_KEY,LEGACY_SAVE_KEY_091,LEGACY_SAVE_KEY_090,LEGACY_SAVE_KEY_080,LEGACY_SAVE_KEY_070,LEGACY_SAVE_KEY_060,LEGACY_SAVE_KEY_OLD,LEGACY_SAVE_KEY_OLDER,LEGACY_SAVE_KEY_OLDEST])localStorage.removeItem(key);location.reload();}};
$('#respawnBtn').onclick=respawn;
$('#continueAfterVictory').onclick=()=>{$('#victoryScreen').classList.add('hidden');game.uiOpen=false;game.last=performance.now();};
async function goFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();if(screen.orientation?.lock)await screen.orientation.lock('landscape').catch(()=>{});}catch{}resize();}
$('#fullscreenBtn').onclick=goFullscreen;

function setLang(next){lang=next;document.documentElement.dataset.lang=lang;localStorage.setItem(LANG_KEY,lang);renderHotbar();renderInventory();renderCraft();renderTrade();updateObjective();updateHud();}
$('#langBtn').onclick=()=>setLang(lang==='zh'?'en':'zh');

const saved=readSave();$('#seedInput').value=saved?.seed||seedNow();if(saved)$('#continueBtn').classList.remove('hidden');
$('#continueBtn').onclick=()=>{const raw=readSave();if(raw)applySave(raw);else startNewWorld($('#seedInput').value);};
$('#startBtn').onclick=()=>startNewWorld($('#seedInput').value.trim()||seedNow());
updateObjective();renderHotbar();resize();
