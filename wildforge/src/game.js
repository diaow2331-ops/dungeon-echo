import {VERSION, TILE, TILE_DEFS, ITEMS, RECIPES, ENEMY_TYPES, itemName, tileName} from './data.js';
import {World, WORLD_W, WORLD_H, encodeTiles, biomeIndexAt, makeRng} from './world.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const canvas = $('#game'), ctx = canvas.getContext('2d', {alpha:false});
const SAVE_KEY = 'wildforge.save.v010';
const LANG_KEY = 'wildforge.lang';
const HOTBAR_SIZE = 8;
const HOTBAR_DEFAULT = ['wood','soil','stone','torch','plank','workbench','campfire','rope'];
const GLYPH = {
  wood:'▥',soil:'▰',stone:'◆',coal:'●',copper_ore:'◈',iron_ore:'◇',crystal:'✦',sand:'▱',sandstone:'▤',ash:'◼',basalt:'⬟',ice:'⬢',snow:'▧',fiber:'≋',rope:'⌇',moss_spore:'✧',plank:'▥',ruin_brick:'▣',torch:'♨',workbench:'▦',campfire:'♨',
  wood_pick:'⌕',stone_pick:'⌕',copper_pick:'⌕',iron_pick:'⌕',wood_blade:'†',stone_blade:'†',copper_blade:'†',iron_blade:'†',crystal_blade:'✦',copper_bar:'▬',iron_bar:'▬'
};

let lang = localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh';
document.documentElement.dataset.lang = lang;
const tr = (zh,en) => lang === 'zh' ? zh : en;

const game = {
  running:false, world:null, seed:'', time:0.18, last:0, autosave:0, spawnTimer:0,
  player:null, inventory:{}, hotbar:[...HOTBAR_DEFAULT], selected:0, enemies:[],
  input:{left:false,right:false,jump:false,mine:false,place:false}, pointer:{x:0,y:0,active:false,worldX:0,worldY:0},
  mine:{key:'',progress:0}, attackCd:0, placeCd:0, hurtCd:0, uiOpen:false,
  camera:{x:0,y:0,tile:26}, dpr:1, cssW:innerWidth, cssH:innerHeight,
  toastTimer:0, saveDirty:false, objectiveStage:0, rng:Math.random
};

function freshPlayer(spawn) {
  return {x:spawn.x,y:spawn.y,vx:0,vy:0,w:.72,h:1.72,hp:100,maxHp:100,grounded:false,facing:1,jumpLatch:false,attackFlash:0,steps:0};
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
function currentPick() {
  const sel=selectedItem();
  return sel?.kind==='pick' && count(selectedId())>0 ? sel : {tier:0,power:.72};
}
function currentWeapon() {
  const sel=selectedItem();
  return sel?.kind==='weapon' && count(selectedId())>0 ? sel : {damage:2.5};
}
function seedNow() { return 'WF-'+Math.random().toString(36).slice(2,7).toUpperCase()+'-'+Date.now().toString(36).slice(-4).toUpperCase(); }
function saveExists() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }

function serialize() {
  const p=game.player;
  return {v:VERSION,seed:game.seed,time:game.time,tiles:encodeTiles(game.world.tiles),player:{x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,facing:p.facing},inventory:game.inventory,hotbar:game.hotbar,selected:game.selected,objectiveStage:game.objectiveStage};
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
  game.player=freshPlayer(game.world.spawn); Object.assign(game.player,raw.player||{});
  game.inventory=raw.inventory&&typeof raw.inventory==='object'?raw.inventory:freshInventory();
  game.hotbar=Array.isArray(raw.hotbar)&&raw.hotbar.length===HOTBAR_SIZE?raw.hotbar:[...HOTBAR_DEFAULT];
  game.selected=Math.max(0,Math.min(7,Number(raw.selected)||0)); game.time=Number(raw.time)||.18; game.objectiveStage=Number(raw.objectiveStage)||0;
  game.enemies=[]; game.running=true; game.saveDirty=false; startWorldUi();
}
function startNewWorld(seed) {
  game.seed=String(seed||seedNow()).slice(0,32); game.world=new World(game.seed); game.rng=makeRng(game.seed+'-runtime'); game.player=freshPlayer(game.world.spawn);
  game.inventory=freshInventory(); game.hotbar=[...HOTBAR_DEFAULT]; game.selected=0; game.time=.18; game.objectiveStage=0; game.enemies=[]; game.running=true; game.saveDirty=true; startWorldUi(); saveGame(false);
  toast(tr('新世界已生成：先收集青芯木','New world generated: gather Greenheart Wood first'));
}
function startWorldUi() {
  $('#startScreen').classList.add('hidden'); $('#deathScreen').classList.add('hidden'); $('#seedText').textContent=game.seed; renderHotbar(); renderInventory(); renderCraft(); resize();
  game.camera.x=game.player.x-game.cssW/game.camera.tile/2; game.camera.y=game.player.y-game.cssH/game.camera.tile/2; requestAnimationFrame(loop);
}

function toast(text) { const el=$('#toast'); el.textContent=text; el.classList.add('show'); clearTimeout(game.toastTimer); game.toastTimer=setTimeout(()=>el.classList.remove('show'),1900); }
function updateObjective() {
  let stage=game.objectiveStage;
  if(stage===0 && count('wood')>=4)stage=1;
  if(stage<=1 && count('workbench')>=1)stage=2;
  if(stage<=2 && ['wood_pick','stone_pick','copper_pick','iron_pick'].some(id=>count(id)>0))stage=3;
  if(stage!==game.objectiveStage){game.objectiveStage=stage;game.saveDirty=true;}
  const copyZh=['砍取青芯木 → 收集至少 4 块','制造木板 → 做出第一张工匠台','制作一把青芯镐 → 开始追踪赤铜','向地下深入 → 找到赤铜、冷铁与遗迹'];
  const copyEn=['Gather at least 4 Greenheart Wood','Make planks → craft your first Craft Table','Craft a Greenheart Pick → start hunting copper','Go deeper → find copper, cold iron and ruins'];
  $('#objectiveText').textContent=(lang==='zh'?copyZh:copyEn)[Math.min(stage,3)];
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
function updatePlayer(dt) {
  const p=game.player; if(!p)return;
  const dir=(game.input.right?1:0)-(game.input.left?1:0);
  const accel=p.grounded?32:20, max=5.5;
  if(dir){p.vx+=dir*accel*dt;p.facing=dir;} else p.vx*=Math.pow(.0007,dt);
  p.vx=Math.max(-max,Math.min(max,p.vx));
  if(game.input.jump&&!p.jumpLatch&&p.grounded){p.vy=-10.7;p.grounded=false;p.jumpLatch=true;}
  if(!game.input.jump)p.jumpLatch=false;
  p.vy=Math.min(14,p.vy+27*dt);
  const nx=p.x+p.vx*dt; if(!aabbSolid(nx,p.y,p.w,p.h))p.x=nx; else p.vx=0;
  const ny=p.y+p.vy*dt;
  if(!aabbSolid(p.x,ny,p.w,p.h)){p.y=ny;p.grounded=false;}else{if(p.vy>0)p.grounded=true;p.vy=0;}
  if(p.y>WORLD_H+5){hurtPlayer(999,'void');}
  p.x=Math.max(.8,Math.min(WORLD_W-.8,p.x)); p.attackFlash=Math.max(0,p.attackFlash-dt);
}

function pointerWorld() {
  const tile=game.camera.tile;
  return {x:game.camera.x+game.pointer.x/tile,y:game.camera.y+game.pointer.y/tile};
}
function reachTarget() {
  let wx,wy;
  if(game.pointer.active){const q=pointerWorld();wx=Math.floor(q.x);wy=Math.floor(q.y);} else {wx=Math.floor(game.player.x+game.player.facing*2);wy=Math.floor(game.player.y);}
  const dx=wx+.5-game.player.x,dy=wy+.5-game.player.y;
  return {x:wx,y:wy,ok:Math.hypot(dx,dy)<=5.25};
}
function nearestEnemyAtTarget(t) {
  let best=null,bd=1.15;
  for(const e of game.enemies){if(e.dead)continue;const d=Math.hypot(e.x-(t.x+.5),e.y-(t.y+.5));if(d<bd&&Math.hypot(e.x-game.player.x,e.y-game.player.y)<=5.25){best=e;bd=d;}}
  return best;
}
function attack(e) {
  if(game.attackCd>0||!e)return;
  const weapon=currentWeapon(), damage=weapon.damage||2.5; e.hp-=damage; e.hit=.16; game.attackCd=.32; game.player.attackFlash=.18;
  toast(`${tr('命中','Hit')} ${lang==='zh'?e.def.zh:e.def.en} · -${Math.round(damage)}`);
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e) {
  e.dead=true; const type=e.type;
  if(type==='moss_crawler'){addItem('fiber',1+Math.floor(game.rng()*2));if(game.rng()<.22)addItem('moss_spore',1);}
  else if(type==='ash_scuttler'){addItem('coal',1);if(game.rng()<.3)addItem('copper_ore',1);}
  else if(type==='shardback'){addItem('ice',1+Math.floor(game.rng()*2));if(game.rng()<.18)addItem('crystal',1);}
  else if(type==='hollow_wisp'){addItem('moss_spore',1+Math.floor(game.rng()*2));}
  else {addItem('ruin_brick',1);if(game.rng()<.25)addItem('iron_ore',1);}
  game.saveDirty=true;
}
function mine(dt) {
  const t=reachTarget(); if(!t.ok)return resetMine(); const enemy=nearestEnemyAtTarget(t); if(enemy)return attack(enemy);
  const tile=game.world.get(t.x,t.y),def=TILE_DEFS[tile]; if(!def||tile===TILE.AIR)return resetMine();
  const pick=currentPick(), required=Number(def.tier||0); if((pick.tier||0)<required){resetMine();toast(tr(`需要更高等级的镐：${def.zh}`,`A stronger pick is required: ${def.en}`));game.input.mine=false;return;}
  const key=t.x+','+t.y;if(game.mine.key!==key){game.mine.key=key;game.mine.progress=0;}
  game.mine.progress+=dt*(pick.power||.7)/Math.max(.12,def.hardness||.5);
  if(game.mine.progress>=1){game.world.set(t.x,t.y,TILE.AIR);if(def.drop)addItem(def.drop,1);game.mine.progress=0;game.saveDirty=true;}
}
function resetMine(){game.mine.key='';game.mine.progress=0;}
function canPlaceAt(x,y){if(game.world.get(x,y)!==TILE.AIR)return false;if(Math.abs(x+.5-game.player.x)<.7&&Math.abs(y+.5-game.player.y)<1.4)return false;return true;}
function place() {
  if(game.placeCd>0)return; const t=reachTarget(); if(!t.ok)return; const id=selectedId(),item=ITEMS[id]; if(!item?.tile||count(id)<1)return;
  const def=TILE_DEFS[item.tile]; if(!def?.place)return;
  if(!canPlaceAt(t.x,t.y))return;
  const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>game.world.get(t.x+dx,t.y+dy)!==TILE.AIR);
  if(!adjacent&&item.tile!==TILE.TORCH)return;
  game.world.set(t.x,t.y,item.tile);consume(id,1);game.placeCd=.16;renderHotbar();game.saveDirty=true;
}

function updateActions(dt){game.attackCd=Math.max(0,game.attackCd-dt);game.placeCd=Math.max(0,game.placeCd-dt);game.hurtCd=Math.max(0,game.hurtCd-dt);if(game.uiOpen)return;if(game.input.mine)mine(dt);else resetMine();if(game.input.place)place();}

function enemyCollides(x,y,w=.72,h=.72){const minX=Math.floor(x-w/2),maxX=Math.floor(x+w/2),minY=Math.floor(y-h/2),maxY=Math.floor(y+h/2);for(let yy=minY;yy<=maxY;yy++)for(let xx=minX;xx<=maxX;xx++)if(game.world.solid(xx,yy))return true;return false;}
function spawnEnemy() {
  if(game.enemies.filter(e=>!e.dead).length>=11)return;
  const p=game.player, side=game.rng()<.5?-1:1, x=Math.max(3,Math.min(WORLD_W-4,p.x+side*(9+game.rng()*12)));
  const sx=Math.floor(x), surface=game.world.surface[sx], underground=p.y>surface+9;
  let candidates=Object.entries(ENEMY_TYPES).filter(([,d])=>underground?d.underground:(!d.underground&&d.biome===game.world.biome(x).id));
  if(underground&&p.y<68)candidates=candidates.filter(([,d])=>d.flying||game.rng()>.35);
  if(!candidates.length)return; const [type,def]=candidates[Math.floor(game.rng()*candidates.length)];
  let y=surface-1;
  if(underground){y=Math.max(surface+6,Math.min(WORLD_H-6,p.y+(game.rng()-.5)*14));for(let tries=0;tries<18&&game.world.solid(x,y);tries++)y+=game.rng()<.5?-1:1;}
  game.enemies.push({type,def,x:x+.5,y:y-.3,vx:0,vy:0,hp:def.hp,maxHp:def.hp,dead:false,hit:0,attack:0,flying:!!def.flying,dir:side*-1});
}
function updateEnemies(dt) {
  const p=game.player;game.spawnTimer-=dt;const night=dayLight()<.42;if(game.spawnTimer<=0){game.spawnTimer=(night?1.6:2.9)+game.rng()*2;spawnEnemy();}
  for(const e of game.enemies){if(e.dead)continue;e.hit=Math.max(0,e.hit-dt);e.attack=Math.max(0,e.attack-dt);const dx=p.x-e.x,dy=p.y-e.y,dist=Math.hypot(dx,dy);if(dist>30)continue;
    const dir=Math.sign(dx)||1;e.dir=dir;
    if(e.flying){e.vx+=(dir*e.def.speed-e.vx)*dt*2.7;e.vy+=((Math.sign(dy)*e.def.speed*.75)-e.vy)*dt*2.1;e.x+=e.vx*dt;e.y+=e.vy*dt;}
    else{e.vx+=(dir*e.def.speed-e.vx)*dt*4;e.vy=Math.min(12,e.vy+25*dt);const nx=e.x+e.vx*dt;if(!enemyCollides(nx,e.y))e.x=nx;else{e.vx=0;if(game.rng()<.05)e.vy=-7.5;}const ny=e.y+e.vy*dt;if(!enemyCollides(e.x,ny))e.y=ny;else e.vy=0;}
    if(dist<1.05&&e.attack<=0){hurtPlayer(e.def.damage,e.type);e.attack=.85;}
  }
  game.enemies=game.enemies.filter(e=>!e.dead&&Math.abs(e.x-p.x)<48&&e.y<WORLD_H+8);
}
function hurtPlayer(amount,source='enemy') {
  if(game.hurtCd>0&&amount<999)return;const p=game.player;p.hp=Math.max(0,p.hp-amount);game.hurtCd=.65;p.vx-=p.facing*2.2;if(p.hp<=0)die(source);
}
function die(source) {
  game.input.left=game.input.right=game.input.jump=game.input.mine=game.input.place=false;game.running=false;saveGame(false);
  const lost=[];for(const [id,n] of Object.entries(game.inventory)){if(ITEMS[id]?.kind==='material'&&n>2){const d=Math.max(1,Math.floor(n*.25));game.inventory[id]-=d;lost.push(`${itemName(id,lang)} ×${d}`);}}
  $('#deathText').textContent=lost.length?tr('你在撤回营地时遗失了：','You lost while retreating to camp: ')+lost.slice(0,4).join(' · '):tr('你保住了随身物资。','You kept your carried supplies.');$('#deathScreen').classList.remove('hidden');
}
function respawn(){const p=game.player,p0=game.world.spawn;p.x=p0.x;p.y=p0.y;p.vx=p.vy=0;p.hp=p.maxHp;game.enemies=[];game.running=true;$('#deathScreen').classList.add('hidden');game.saveDirty=true;saveGame(false);game.last=performance.now();requestAnimationFrame(loop);}

function nearStation(station) {
  const target=station==='workbench'?TILE.WORKBENCH:TILE.CAMPFIRE,p=game.player;
  for(let y=Math.floor(p.y)-4;y<=Math.floor(p.y)+4;y++)for(let x=Math.floor(p.x)-4;x<=Math.floor(p.x)+4;x++)if(game.world.get(x,y)===target)return true;
  return false;
}
function stationAvailable(station){return !station||nearStation(station);}
function canCraft(r){return stationAvailable(r.station)&&Object.entries(r.need).every(([id,n])=>count(id)>=n);}
function craft(r) {
  if(!canCraft(r)){toast(r.station&&!stationAvailable(r.station)?tr('需要靠近对应制造设施','Move closer to the required crafting station'):tr('材料不足','Not enough materials'));return;}
  for(const [id,n] of Object.entries(r.need))consume(id,n);addItem(r.out.id,r.out.n);if(['pick','weapon'].includes(ITEMS[r.out.id]?.kind))game.hotbar[game.selected]=r.out.id;renderInventory();renderCraft();renderHotbar();toast(`${tr('制造','Crafted')} · ${itemName(r.out.id,lang)} ×${r.out.n}`);
}
function renderInventory() {
  const view=$('#inventoryView');if(!view)return;const rows=Object.entries(game.inventory).filter(([,n])=>n>0).sort((a,b)=>(ITEMS[a[0]]?.kind||'').localeCompare(ITEMS[b[0]]?.kind||'')||a[0].localeCompare(b[0]));
  if(!rows.length){view.innerHTML=`<div class="inv-empty">${tr('行囊还是空的。先从地表开始采集。','Your pack is empty. Start gathering at the surface.')}</div>`;return;}
  view.innerHTML='<div class="inv-grid">'+rows.map(([id,n])=>`<button class="inv-item${selectedId()===id?' active':''}" data-equip="${id}"><b>${GLYPH[id]||'•'} ${itemName(id,lang)}</b><span>× ${n}</span></button>`).join('')+'</div>';
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
function updateHud(){const p=game.player;if(!p)return;$('#hpFill').style.width=(100*p.hp/p.maxHp)+'%';$('#hpText').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;const b=game.world.biome(p.x);$('#biomeText').textContent=lang==='zh'?b.zh:b.en;const surface=game.world.surface[Math.max(0,Math.min(WORLD_W-1,Math.floor(p.x)))];const depth=Math.max(0,Math.floor(p.y-surface));$('#depthText').textContent=depth<3?tr('地表','Surface'):tr(`地下 ${depth}m`,`Depth ${depth}m`);$('#timeText').textContent=timeLabel()+' · '+(dayLight()<.38?tr('深夜','Night'):dayLight()<.68?tr('暮光','Twilight'):tr('白昼','Day'));}

function tileRect(tx,ty){const s=game.camera.tile;return {x:Math.floor((tx-game.camera.x)*s),y:Math.floor((ty-game.camera.y)*s),s};}
function drawBackdrop() {
  const p=game.player,b=game.world.biome(p.x),light=dayLight(),grad=ctx.createLinearGradient(0,0,0,game.cssH);grad.addColorStop(0,mixColor('#111a24',b.sky,light));grad.addColorStop(1,mixColor('#10171a',b.deep,Math.min(1,light+.12)));ctx.fillStyle=grad;ctx.fillRect(0,0,game.cssW,game.cssH);
  const phase=(game.time%1)*Math.PI*2, orbX=(.5+.46*Math.sin(phase))*game.cssW,orbY=(.65-.5*Math.cos(phase))*game.cssH;ctx.globalAlpha=.18+.35*light;ctx.fillStyle=light>.45?'#f2d59a':'#b8d3e9';ctx.beginPath();ctx.arc(orbX,orbY,26,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  const s=game.camera.tile;ctx.fillStyle='rgba(13,30,34,.22)';for(let i=0;i<16;i++){const x=((i*97-game.camera.x*s*.18)%(game.cssW+180))-90;const h=80+(i*37%120);ctx.beginPath();ctx.moveTo(x,game.cssH);ctx.lineTo(x+70,game.cssH-h);ctx.lineTo(x+150,game.cssH);ctx.fill();}
}
function mixColor(a,b,t){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),ar=pa>>16,ag=pa>>8&255,ab=pa&255,br=pb>>16,bg=pb>>8&255,bb=pb&255;return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;}
function drawTile(tx,ty,id) {
  const def=TILE_DEFS[id];if(!def||id===TILE.AIR)return;const {x,y,s}=tileRect(tx,ty);if(x+s<0||y+s<0||x>game.cssW||y>game.cssH)return;
  if(id===TILE.LEAF||id===TILE.GLOW_MOSS||id===TILE.TORCH||id===TILE.CAMPFIRE){drawNonSolidTile(x,y,s,id,def);return;}
  ctx.fillStyle=def.color;ctx.fillRect(x,y,s+1,s+1);const h=((tx*73856093)^(ty*19349663)^(id*83492791))>>>0;ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(x+2+(h%5),y+2+((h>>3)%5),Math.max(2,s*.22),Math.max(1,s*.08));ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x,y+s-3,s,3);
  if([TILE.COAL,TILE.COPPER,TILE.IRON,TILE.CRYSTAL].includes(id)){ctx.fillStyle=id===TILE.COAL?'#171a1d':id===TILE.COPPER?'#d07850':id===TILE.IRON?'#c2c7c7':'#b3a4ff';for(let k=0;k<3;k++){const ox=3+((h>>(k*4))%Math.max(4,s-8)),oy=4+((h>>(k*6+2))%Math.max(4,s-9));ctx.fillRect(x+ox,y+oy,Math.max(2,s*.12),Math.max(2,s*.12));}}
  if(id===TILE.WOOD){ctx.fillStyle='rgba(55,31,19,.3)';ctx.fillRect(x+s*.45,y,s*.12,s);}if(id===TILE.WORKBENCH){ctx.fillStyle='#5d3d28';ctx.fillRect(x+2,y+s*.28,s-4,s*.18);ctx.fillRect(x+s*.18,y+s*.45,s*.12,s*.55);ctx.fillRect(x+s*.7,y+s*.45,s*.12,s*.55);}if(id===TILE.RUIN){ctx.strokeStyle='rgba(209,190,218,.18)';ctx.strokeRect(x+1,y+1,s-2,s-2);}
}
function drawNonSolidTile(x,y,s,id,def){if(id===TILE.LEAF){ctx.fillStyle=def.color;ctx.globalAlpha=.88;ctx.beginPath();ctx.arc(x+s*.5,y+s*.5,s*.48,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;return;}if(id===TILE.GLOW_MOSS){ctx.fillStyle='rgba(82,211,166,.16)';ctx.beginPath();ctx.arc(x+s*.5,y+s*.5,s*.62,0,Math.PI*2);ctx.fill();ctx.fillStyle=def.color;ctx.fillRect(x+s*.25,y+s*.58,s*.5,Math.max(2,s*.12));return;}if(id===TILE.TORCH){ctx.fillStyle='#6d4932';ctx.fillRect(x+s*.47,y+s*.4,Math.max(2,s*.1),s*.55);ctx.fillStyle='#ffc568';ctx.beginPath();ctx.arc(x+s*.52,y+s*.28,s*.16,0,Math.PI*2);ctx.fill();return;}if(id===TILE.CAMPFIRE){ctx.fillStyle='#74513b';ctx.fillRect(x+s*.18,y+s*.72,s*.64,s*.12);ctx.fillStyle='#ed804c';ctx.beginPath();ctx.moveTo(x+s*.5,y+s*.18);ctx.lineTo(x+s*.25,y+s*.72);ctx.lineTo(x+s*.72,y+s*.72);ctx.closePath();ctx.fill();}}
function drawWorld() {
  const s=game.camera.tile,minX=Math.max(0,Math.floor(game.camera.x)-1),maxX=Math.min(WORLD_W-1,Math.ceil(game.camera.x+game.cssW/s)+1),minY=Math.max(0,Math.floor(game.camera.y)-1),maxY=Math.min(WORLD_H-1,Math.ceil(game.camera.y+game.cssH/s)+1);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)drawTile(x,y,game.world.get(x,y));
}
function drawPlayer(){const p=game.player,s=game.camera.tile,x=(p.x-game.camera.x)*s,y=(p.y-game.camera.y)*s,w=p.w*s,h=p.h*s;ctx.save();ctx.translate(x,y);if(p.facing<0)ctx.scale(-1,1);ctx.fillStyle=game.hurtCd>0?'#f0a094':'#d7c3a6';ctx.fillRect(-w*.3,-h*.45,w*.6,h*.34);ctx.fillStyle='#334c4f';ctx.fillRect(-w*.38,-h*.08,w*.76,h*.55);ctx.fillStyle='#1c282b';ctx.fillRect(-w*.34,h*.46,w*.26,h*.42);ctx.fillRect(w*.08,h*.46,w*.26,h*.42);ctx.fillStyle='#6a4a35';ctx.fillRect(-w*.36,-h*.56,w*.72,h*.14);ctx.fillStyle='#e3d5b7';ctx.fillRect(w*.08,-h*.36,w*.08,h*.06);if(p.attackFlash>0){ctx.strokeStyle='#f0d08f';ctx.lineWidth=Math.max(2,s*.08);ctx.beginPath();ctx.arc(w*.2,0,w*1.4,-.8,.65);ctx.stroke();}ctx.restore();}
function drawEnemies(){const s=game.camera.tile;for(const e of game.enemies){if(e.dead)continue;const x=(e.x-game.camera.x)*s,y=(e.y-game.camera.y)*s;if(x<-60||x>game.cssW+60||y<-60||y>game.cssH+60)continue;ctx.save();ctx.translate(x,y);if(e.hit>0)ctx.globalAlpha=.55;ctx.fillStyle=e.def.color;if(e.flying){ctx.beginPath();ctx.arc(0,0,s*.38,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(0,0,s*.64,0,Math.PI*2);ctx.fill();}else{ctx.beginPath();ctx.moveTo(-s*.42,s*.28);ctx.quadraticCurveTo(-s*.48,-s*.25,0,-s*.38);ctx.quadraticCurveTo(s*.48,-s*.25,s*.42,s*.28);ctx.closePath();ctx.fill();ctx.fillStyle='#11191b';ctx.fillRect(e.dir>0?s*.12:-s*.2,-s*.12,s*.08,s*.08);}ctx.globalAlpha=1;if(e.hp<e.maxHp){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(-s*.42,-s*.58,s*.84,3);ctx.fillStyle='#c76658';ctx.fillRect(-s*.42,-s*.58,s*.84*(e.hp/e.maxHp),3);}ctx.restore();}}
function drawTarget(){const t=reachTarget();if(!t.ok)return;const {x,y,s}=tileRect(t.x,t.y);ctx.strokeStyle='rgba(242,216,158,.86)';ctx.lineWidth=1.4;ctx.strokeRect(x+.8,y+.8,s-1.6,s-1.6);if(game.mine.key===t.x+','+t.y&&game.mine.progress>0){ctx.fillStyle='rgba(239,194,104,.2)';ctx.fillRect(x,y,s*game.mine.progress,s);}}
function render(){drawBackdrop();drawWorld();drawEnemies();drawPlayer();drawTarget();const night=1-dayLight();if(night>.2){ctx.fillStyle=`rgba(3,8,13,${Math.min(.48,night*.45)})`;ctx.fillRect(0,0,game.cssW,game.cssH);}updateHud();updateTargetTip();}
function updateTargetTip(){if(!game.pointer.active){$('#targetTip').classList.remove('show');return;}const t=reachTarget();if(!t.ok){$('#targetTip').textContent=tr('超出触及范围','Out of reach');$('#targetTip').classList.add('show');return;}const e=nearestEnemyAtTarget(t);if(e)$('#targetTip').textContent=`${lang==='zh'?e.def.zh:e.def.en} · ${Math.ceil(e.hp)}/${e.maxHp}`;else{const id=game.world.get(t.x,t.y);$('#targetTip').textContent=id===TILE.AIR?`${t.x}, ${t.y}`:`${tileName(id,lang)} · ${t.x}, ${t.y}`;}$('#targetTip').classList.add('show');}
function updateCamera(dt){const p=game.player,s=game.camera.tile,targetX=p.x-game.cssW/s*.5,targetY=p.y-game.cssH/s*.55;const k=1-Math.pow(.001,dt);game.camera.x+=(targetX-game.camera.x)*k;game.camera.y+=(targetY-game.camera.y)*k;game.camera.x=Math.max(0,Math.min(WORLD_W-game.cssW/s,game.camera.x));game.camera.y=Math.max(0,Math.min(WORLD_H-game.cssH/s,game.camera.y));}

function loop(now){if(!game.running)return;let dt=Math.min(.033,Math.max(.001,(now-(game.last||now))/1000));game.last=now;if(!game.uiOpen){updatePlayer(dt);updateActions(dt);updateEnemies(dt);game.time=(game.time+dt/180)%1;}updateCamera(dt);render();game.autosave+=dt;if(game.autosave>10&&game.saveDirty)saveGame(false);requestAnimationFrame(loop);}

function setInput(action,on){if(action in game.input)game.input[action]=on;}
function aimFromEvent(e){const r=canvas.getBoundingClientRect();game.pointer.x=e.clientX-r.left;game.pointer.y=e.clientY-r.top;game.pointer.active=true;const q=pointerWorld();game.pointer.worldX=q.x;game.pointer.worldY=q.y;$('#crosshair').style.left=e.clientX+'px';$('#crosshair').style.top=e.clientY+'px';$('#crosshair').style.display='block';}
canvas.addEventListener('pointermove',e=>aimFromEvent(e));
canvas.addEventListener('pointerdown',e=>{if(!game.running||game.uiOpen)return;aimFromEvent(e);canvas.setPointerCapture?.(e.pointerId);if(e.button===2)game.input.place=true;else game.input.mine=true;e.preventDefault();});
canvas.addEventListener('pointerup',e=>{if(e.button===2)game.input.place=false;else game.input.mine=false;e.preventDefault();});
canvas.addEventListener('pointercancel',()=>{game.input.mine=game.input.place=false;});canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if(e.repeat&&['KeyE','KeyF','Escape'].includes(e.code))return;if(/^Digit[1-8]$/.test(e.code)){game.selected=+e.code.slice(-1)-1;renderHotbar();return;}if(e.code==='KeyE'){togglePanel('inventoryPanel');return;}if(e.code==='Escape'){closePanels();return;}if(e.code==='KeyF'){goFullscreen();return;}if(e.code==='KeyA'||e.code==='ArrowLeft')setInput('left',true);if(e.code==='KeyD'||e.code==='ArrowRight')setInput('right',true);if(e.code==='Space'||e.code==='KeyW'||e.code==='ArrowUp'){setInput('jump',true);e.preventDefault();}});
addEventListener('keyup',e=>{if(e.code==='KeyA'||e.code==='ArrowLeft')setInput('left',false);if(e.code==='KeyD'||e.code==='ArrowRight')setInput('right',false);if(e.code==='Space'||e.code==='KeyW'||e.code==='ArrowUp')setInput('jump',false);});

$$('[data-hold]').forEach(btn=>{const action=btn.dataset.hold;const on=e=>{e.preventDefault();setInput(action,true);};const off=e=>{e.preventDefault();setInput(action,false);};btn.addEventListener('pointerdown',on);btn.addEventListener('pointerup',off);btn.addEventListener('pointercancel',off);btn.addEventListener('pointerleave',off);});
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
