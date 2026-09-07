'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const html=read('wildforge/index.html'),css=read('wildforge/style.css'),game=read('wildforge/src/game.js'),world=read('wildforge/src/world.js'),data=read('wildforge/src/data.js');
assert.equal(read('wildforge/VERSION').trim(),'0.22.0');
assert(html.includes('<meta name="version" content="0.22.0"'));
assert(data.includes("VERSION = '0.22.0'"));
assert(game.includes("const SAVE_KEY = 'wildforge.save.v0220'"));
assert(html.includes('<meta name="version" content="0.22.0"'));assert(html.includes('id="victoryScreen"')&&html.includes('id="continueAfterVictory"'),'v0.3 finale UI missing');
for(const marker of ['id="game"','id="hotbar"','id="mobileControls"','id="portraitGuard"','id="inventoryPanel"','id="fullscreenBtn"']) assert(html.includes(marker),'missing '+marker);
assert(css.includes('@media (orientation:portrait)')&&css.includes('@media (max-height:520px) and (orientation:landscape)'),'landscape-first responsive contract missing');
assert(game.includes("screen.orientation.lock('landscape')"),'fullscreen landscape lock missing');
assert(game.includes("if(e.pointerType!=='touch')"),'touch canvas tap must aim without auto-mining');
assert(game.includes('mobileDirected?mobileAimPenalty(base.x,base.y):-.4'),'touch tap keeps exact-solid priority while joystick aim becomes directional');

for(const behavior of ['function mine(dt)','function place(','function craft(r)','function updateEnemies(dt)','function saveGame(show=true)','function respawn()','function spawnDrop(','function updateDrops(dt)','function drawLighting()','function updateProgression(dt)']) assert(game.includes(behavior),'runtime behavior missing: '+behavior);
assert(game.includes('jumpBuffer')&&game.includes('coyote'),'movement forgiveness missing');
assert(game.includes('moveAxis:{x:0,y:0,touch:false}')&&game.includes('targetVx=dir*max'),'analog movement speed missing');
assert(game.includes('p.jumpHold=JUMP_HOLD_TIME')&&game.includes('p.vy=Math.max(p.vy,-5.25)'),'variable jump height missing');
assert(game.includes('function tryStepUp')&&game.includes('landingKick'),'step assist / landing feel missing');
assert(game.includes('function stableMineTarget')&&game.includes('function bridgeAssistTarget'),'continuous mine/build assist missing');
assert(game.includes('function sfx(kind,intensity=1)')&&game.includes('ensureAudio()'),'procedural interaction sound feedback missing');
assert(game.includes("game.pointer.kind==='touch'")&&game.includes("reachTarget(mode='aim')"),'touch target assist missing');
assert(game.includes('DEPTH_ZONES')&&game.includes("id:'star'"),'depth progression missing');
for(const worldRule of ['carveCaves(rng)','scatterOre(rng','placeTrees(rng)','placeGlowMoss(rng)','placeRuins(rng)']) assert(world.includes(worldRule),'world rule missing: '+worldRule);
const tileEntries=(data.match(/solid:(?:true|false)/g)||[]).length;
const recipeEntries=(data.match(/\{id:'[^']+',out:\{id:/g)||[]).length;
const enemyEntries=(data.match(/hp:\d+,damage:\d+,speed:/g)||[]).length;
assert(tileEntries>=24,'expected at least 24 tile/material definitions');
assert(recipeEntries>=22,'expected at least 19 craft recipes');
assert(enemyEntries>=6,'expected six enemy families including the finale boss');
assert(data.includes('RELIC_CHEST:23')&&world.includes('TILE.RELIC_CHEST'),'relic cache world content missing');
assert(data.includes("ancient_core:{id:'ancient_core'")&&data.includes("sentinel_blade:{id:'sentinel_blade'")&&data.includes("delver_pick:{id:'delver_pick'"),'relic loot identity missing');
assert(game.includes('function tryOpenRelicChest(t)')&&game.includes('guardianDefeated'),'guarded relic-cache runtime missing');
assert(data.includes('STAR_FORGE:28')&&data.includes("id:'star_forge'")&&data.includes("rift_beast:{zh:'裂隙巨兽'"),'v0.3 finale content missing');
assert(game.includes('function igniteForge(t,dt)')&&game.includes('function spawnRiftBeast(t)')&&game.includes('bossDefeated')&&game.includes('continueAfterVictory'),'v0.3 finale runtime missing');
assert(data.includes("id:'arrow'")&&data.includes("id:'wood_bow'")&&data.includes("id:'crystal_bow'"),'v0.4 ranged content missing');
assert(game.includes('function updateProjectiles(dt)')&&game.includes('weapon.ranged')&&game.includes('drawProjectiles'),'v0.4 ranged runtime missing');
assert(data.includes('RUIN_SPIKE:24')&&world.includes('TILE.RUIN_SPIKE')&&game.includes('function updateHazards()'),'ruin spike hazard missing');
assert(game.includes('function updateRelicHint(dt)')&&game.includes('RELIC SIGNAL'),'relic resonance guidance missing');

for(const marker of ['TILE.RELIC_CHEST','function tryOpenRelicChest(t)','function spawnChestGuardian(t,key)','function openRelicChest(t,key)','ancient_core','sentinel_blade','delver_pick','specialCd:1.1','e.windup=.62','e.charge=.34']) assert((game+data+world).includes(marker),'relic exploration contract missing: '+marker);
assert(world.includes('this.ruins.push({x,y,w:rw,h:rh,biome,chestX,chestY})'),'ruin chest metadata missing');
assert(world.includes('TILE.RUIN_URN')&&game.includes('function breakRuinUrn(t)'),'breakable ruin urn exploration prop missing');
assert(data.includes('ROPE:26')&&data.includes("rope:{id:'rope'")&&game.includes('playerTouchesTile(TILE.ROPE)'),'climbable rope tool missing');
assert(data.includes('PLATFORM:27')&&data.includes("id:'platform'")&&game.includes('platformLandingY')&&game.includes('applyFallDamage'),'one-way platform and fall-risk loop missing');
assert(game.includes('campRespawn')&&game.includes('safeCampPoint')&&game.includes('前哨营地已绑定'),'camp return loop missing');
assert(html.includes('id="moveStick"')&&html.includes('id="aimStick"')&&html.includes('id="mobilePlace"')&&html.includes('id="mobileTorch"'),'dual-stick landscape touch controls missing');
assert(game.includes("canvas.addEventListener('wheel'")&&game.includes('game.smartCursor=!game.smartCursor')&&game.includes('game.autoTool=true'),'desktop native-sandbox input helpers missing');
assert(game.includes("setupStick($('#moveStick')")&&game.includes("setupStick($('#aimStick')")&&game.includes('syncMobileAim()'),'analog touch runtime missing');
assert(game.includes("game.quickPlaceId='torch'")&&game.includes("game.autoTool&&count('torch')>0?'torch'"),'quick torch input missing');
assert(game.includes('miningSwing=game.input.mine')&&game.includes('pointerWorld():{x:game.player.x+game.player.facing*2'),'aim-following tool swing missing');
for(const protectedName of ['Creeper','Zombie','Slime King','Eye of Cthulhu','Netherite','Enderman']) assert(!html.includes(protectedName)&&!data.includes(protectedName),'copied game identity found: '+protectedName);
const combined=html+css+game+world+data;for(const foreign of ['../moyu/','../board-games/','../game/core/','/moyu/','/board-games/'])assert(!combined.includes(foreign),'Wildforge crosses game boundary: '+foreign);
const catalog=JSON.parse(read('games.json'));assert(!catalog.games.some(g=>g.id==='wildforge'),'incubating Wildforge must not enter public catalog before promotion');

assert(game.includes('function tryDash()')&&game.includes('dashCooldown')&&game.includes('dashTimer'),'v0.5 dodge runtime missing');
assert(game.includes('function updateEnemyProjectiles(dt)')&&game.includes('function spawnEnemyProjectile(e)'),'reactive enemy projectile runtime missing');
assert(game.includes("e.type==='hollow_wisp'")&&game.includes('幽光弹'),'hollow wisp ranged behavior missing');
assert(game.includes("if(game.player?.dashTimer>0&&amount<999)return;"),'dash i-frames missing');
assert(html.includes('id="mobileDash"'),'mobile dash control missing');
assert(game.includes("e.code==='KeyQ'")&&game.includes("$('#mobileDash')"),'dash input contract missing');

assert(data.includes("VERSION = '0.22.0'"),'data module version must match incubation build');
assert(game.includes("const SAVE_KEY = 'wildforge.save.v0220'"),'v0.9 save key missing');
assert(game.includes('function nightPhase()')&&game.includes('function updateWorldRhythm(dt)'),'day/night rhythm runtime missing');
assert(game.includes('nightSurge')&&game.includes('nightsSurvived'),'night survival state missing');
assert(game.includes('LEGACY_SAVE_KEY_OLDEST')&&game.includes('LEGACY_SAVE_KEY_070')&&game.includes('location.reload()'),'new-world reset must clear all legacy saves');
assert(game.includes('campfireDistance')&&game.includes('fireDist<4.1&&!e.elite'),'campfire ward missing');
assert(game.includes("game.nightState==='night'?3.1:2.4"),'night campfire healing boost missing');
assert(game.includes('game.rng()<.46')&&game.includes("type==='hollow_wisp"),'night wisp weighting missing');
assert(html.includes('id="dangerText"'),'night danger HUD marker missing');
assert(html.includes('class="route-readout"')&&html.includes('id="beaconText"'),'dedicated route HUD line missing');
assert(css.includes('#dangerText.active')&&css.includes('#dangerText.warning'),'night danger HUD styling missing');
console.log(`wildforge_v0220=PASS tiles=${tileEntries} recipes=${recipeEntries} enemies=${enemyEntries}`);

assert(game.includes("const SAVE_KEY = 'wildforge.save.v0220'"),'v0.9 save key missing');
assert(game.includes('outpostReady'),'outpost readiness state missing');
assert(game.includes('outpost salvage')&&game.includes('日出 · 守夜'),'dawn outpost salvage feedback missing');
assert(game.includes("Math.round(amount*.72)")&&game.includes("!['ruin_sentinel','rift_beast'].includes(source)"),'outpost ward damage mitigation must exclude elite/boss damage');
assert(game.includes("campfireDistance(p.x,p.y)<4.1"),'campfire ward must intercept enemy projectiles');
assert(game.includes('LEGACY_SAVE_KEY_OLDEST'),'legacy save chain missing');
assert(game.includes('LEGACY_SAVE_KEY_060')&&game.includes("raw.v==='0.7.0'"),'v0.7 migration chain missing');
assert(game.includes('worldProgress')&&game.includes('markBiomeVisited')&&game.includes('markRelicBiome'),'persistent world memory missing');
assert(game.includes('worldProgress:game.worldProgress'),'world memory must be persisted');
assert(game.includes('evolveRelicSite')&&game.includes('evolveOutpost'),'world evolution traces missing');
assert(game.includes('updateWorldEvolution')&&game.includes('evolution:0'),'world evolution state missing');

assert(game.includes("const SAVE_KEY = 'wildforge.save.v0220'"),'v0.9 save key missing');
assert(data.includes('BEACON:29')&&data.includes("id:'beacon'"),'persistent beacon content missing');
assert(game.includes('infrastructure')&&game.includes('registerBeacon')&&game.includes('attuneBeacon')&&game.includes('nearestBeacon'),'beacon network runtime missing');
assert(game.includes('infrastructure:game.infrastructure'),'beacon network must be persisted');
assert(game.includes("raw.v===VERSION")&&game.includes("raw.v==='0.8.0'")&&game.includes("LEGACY_SAVE_KEY_080 = 'wildforge.save.v080'"),'v0.8 migration chain missing');
console.log('wildforge_v0220=PASS beacon_network=persistent');


assert(game.includes('const BEACON_LINK_RANGE=96'),'v0.9.2 beacon link range missing');
assert(game.includes('const ROUTE_RADIUS=4.5'),'v0.9.2 route corridor radius missing');
assert(game.includes('const ROUTE_SPEED_MULT=1.08'),'v0.9.2 route travel benefit missing');
assert(game.includes('const ROUTE_NIGHT_SPAWN_RELIEF=1.18'),'v0.9.2 bounded night route relief missing');
assert(game.includes('const MAX_BEACON_SUPPLY=3'),'v0.9.2 beacon supply cap missing');
for(const fn of ['function beaconLinks()','function routeStateAt(x,y)','function replenishBeaconSupplies()','function claimBeaconSupply(b)']) assert(game.includes(fn),'route-network runtime missing: '+fn);
assert(game.includes('route.active?ROUTE_SPEED_MULT:1'),'route speed multiplier is not applied to player travel');
assert(game.includes('night&&route.active?ROUTE_NIGHT_SPAWN_RELIEF:1'),'route night relief is not applied only at spawn cadence');
assert(game.includes("raw.v==='0.9.0'")&&game.includes("LEGACY_SAVE_KEY_090 = 'wildforge.save.v090'"),'v0.9.0 migration chain missing');
assert(game.includes('Math.min(MAX_BEACON_SUPPLY,Math.max(0,Number(b.supply)||0))'),'beacon supply migration clamp missing');
assert(game.includes('replenishBeaconSupplies()'),'linked beacon dawn replenishment missing');
assert(game.includes("id===TILE.BEACON")&&game.includes('补给')&&game.includes('Supply'),'beacon target supply state missing');
assert(game.includes("classList.toggle('route-active'")&&css.includes('.route-readout #beaconText.route-active'),'route HUD state is not visually surfaced');
assert(game.includes('for(let i=0;i<supply;i++)'),'beacon supply pips missing');
assert(game.includes('let claimable=charges')&&game.includes('b.supply=charges-claimable'),'beacon claim must preserve unclaimed supply instead of silently clipping stacks');
assert(game.includes("!['ruin_sentinel','rift_beast'].includes(source)"),'route work must preserve elite/boss damage exception');
console.log('wildforge_v0220=PASS route_network=supply-route');


for(const fn of ['function beaconComponents()','function beaconComponentFor(b)','function componentBiomeIds(component)','function beaconExchangeGood(b)','function drawSupplyRoutes()']) assert(game.includes(fn),'v0.9.2 route/cargo helper missing: '+fn);
assert(game.includes('exchange=beaconExchangeGood(b)'),'cross-biome exchange cargo is not derived from the beacon component');
assert(game.includes("verdant:'fiber'")&&game.includes("ember:'coal'")&&game.includes("frost:'ice'"),'cross-biome cargo mapping missing');
assert(game.includes('bundle.push([exchange.id,1])'),'cross-biome cargo must add one bounded exchange good per route charge');
assert(game.includes('biomeCount')&&game.includes('货运')&&game.includes('Cargo'),'route diversity/cargo state is not surfaced in HUD/target feedback');
assert(game.includes('ctx.setLineDash')&&game.includes('drawSupplyRoutes();'),'route signal layer missing from render graph');
assert(game.includes("raw.v==='0.9.2'")&&game.includes("LEGACY_SAVE_KEY = 'wildforge.save.v092'"),'v0.9.1 migration chain missing');
assert(game.includes("LEGACY_SAVE_KEY_090 = 'wildforge.save.v090'"),'v0.9.0 migration key must remain explicit');
assert(css.includes('.route-readout .cargo'),'route cargo HUD styling missing');
console.log('wildforge_v0220=PASS route_visibility=cross-biome-cargo');


assert(html.includes('data-tab="trade"')&&html.includes('id="tradeView"'),'trade tab surface missing');
for(const marker of ['TRADE_GOODS','TRADE_POST_RADIUS','TRADE_DAILY_BUY_CAP','TRADE_DAILY_SELL_CAP','function nearbyTradePost()','function tradePrice(id,market,side)','function buyTradeGood(id)','function sellTradeGood(id)','function renderTrade()']) assert(game.includes(marker),'trade runtime missing: '+marker);
assert(game.includes('game.trade.credits-=price')&&game.includes('game.trade.credits+=price'),'trade currency mutation missing');
assert(game.includes('trade:game.trade')&&game.includes('sanitizeTrade(raw.trade)'),'trade state must persist and migrate');
assert(html.includes('求生 <i>→</i> 采集')&&html.includes('生产')&&html.includes('装货')&&html.includes('运输')&&html.includes('交易'),'trade-survival logistics loop is not visible on start screen');
assert(css.includes('.trade-row.export')&&css.includes('.trade-row.demand'),'trade market visual states missing');
console.log('wildforge_v0220=PASS frontier_market=regional-arbitrage');

assert(data.includes("{id:'beacon',out:{id:'beacon',n:1},need:{plank:8,torch:2,rope:2},station:'workbench'}"),'trade post must be craftable before metal-tier progression');
assert(!data.includes("{id:'beacon',out:{id:'beacon',n:1},need:{iron_bar:"),'trade core must not remain cold-iron gated');
assert(game.includes("if(!raw||typeof raw!=='object')return freshTrade()"),'legacy saves must receive starter trade state');
assert(game.includes('E→贸易')&&game.includes('load local cargo'),'trade onboarding feedback missing');
console.log('wildforge_v0220=PASS trade_onboarding=early-game');

assert(game.includes("const LEGACY_SAVE_KEY_0100 = 'wildforge.save.v0100'" )&&game.includes("raw.v==='0.10.0'"),'v0.10 migration chain missing');
for(const id of ['greenheart_bale','emberfuel_crate','frostglass_case','freight_frame']) assert(data.includes(id+':{id:'), 'v0.11 cargo/upgrader item missing: '+id);
assert(game.includes("greenheart_bale:{home:'verdant',base:12}")&&game.includes("emberfuel_crate:{home:'ember',base:16}")&&game.includes("frostglass_case:{home:'frost',base:14}"),'packaged cargo market identities missing');
assert(game.includes('const WAREHOUSE_CAP=24')&&game.includes('const CARGO_BASE_CAP=8')&&game.includes('const CARGO_FRAME_BONUS=8'),'warehouse/cargo capacity contract missing');
for(const fn of ['function sanitizeWarehouse(raw)','function cargoLoad()','function cargoCapacity()','function warehouseUnits(b)','function warehouseAdd(b,id,n=1)','function warehouseTake(b,id,n=1)','function produceTradeGood(id)','function loadWarehouseCargo(id)','function storeWarehouseCargo(id)']) assert(game.includes(fn),'v0.11 logistics runtime missing: '+fn);
assert(game.includes('warehouse:sanitizeWarehouse(b.warehouse)')&&game.includes('warehouse:{}'),'beacon warehouses must persist and initialize');
assert(game.includes("if(b&&warehouseUnits(b)>0)")&&game.includes('Empty the depot warehouse'),'warehouse cargo must block beacon dismantle');
assert(game.includes('if(!cargoRoom(id,1))')&&game.includes('Freight Frame'),'market/warehouse load must respect freight capacity');
assert(data.includes("{id:'freight_frame',out:{id:'freight_frame',n:1},need:{plank:10,rope:4},station:'workbench'}"),'early freight capacity upgrade recipe missing');
assert(game.includes('TRADE_DAILY_PRODUCTION_CAP')&&game.includes("nearStation('workbench')")&&game.includes('game.trade.produced'),'bounded depot production missing');
assert(html.includes('生产 <i>→</i> 装货'),'v0.11 logistics core loop is not surfaced');
assert(css.includes('.logistics-strip'),'logistics HUD/panel styling missing');
console.log('wildforge_v0220=PASS depot_logistics=production-storage-capacity');

assert(game.includes("const LEGACY_SAVE_KEY_0110 = 'wildforge.save.v0110'")&&game.includes("raw.v==='0.11.0'"),'v0.11 migration chain missing');
assert(game.includes('const FREIGHT_FULL_SPEED_PENALTY=.14')&&game.includes('const FREIGHT_NIGHT_THREAT=.18')&&game.includes('const FREIGHT_SPILL_BASE=.18'),'freight risk tuning constants missing');
for(const fn of ['function cargoLoadRatio()','function cargoMoveMultiplier(routeActive=false)','function cargoNightSpawnFactor(routeActive=false)','function carriedCargoIds()',"function spillCargoOnHit(source='enemy')"]) assert(game.includes(fn),'v0.12 haul-risk runtime missing: '+fn);
assert(game.includes('max=MOVE_SPEED*(route.active?ROUTE_SPEED_MULT:1)*freightMove'),'cargo load must affect movement through canonical player speed');
assert(game.includes('nextEncounterDelay({phase'),'off-route night cargo pressure must affect spawn cadence through canonical enemy scheduler');
assert(game.includes('spillCargoOnHit(source)')&&game.includes('d.age=-.85'),'accepted hits must be able to spill recoverable cargo with pickup delay');
assert(game.includes("route.active?.45:1")&&game.includes("frame?.55:1")&&game.includes("ward?.25:1"),'route/frame/camp spill mitigation missing');
assert(game.includes("cargoLoadRatio()>.75?tr(' 重载',' HEAVY')"),'heavy-load HUD warning missing');
assert(html.includes('货包'),'haul risk is not surfaced to players');
console.log('wildforge_v0220=PASS haul_risk=weight-night-spill');


assert(game.includes("const LEGACY_SAVE_KEY_0120 = 'wildforge.save.v0120'")&&game.includes("raw.v==='0.12.0'"),'v0.12 migration chain missing');
assert(data.includes("greyveil_raider:{zh:'灰披劫徒'")&&data.includes('raider:true'),'cargo-value raider identity missing');
for(const fn of ['function sanitizeCargoBundles(raw)','function deployCargoBundle()','function recoverCargoBundle()','function toggleCargoBundle()','function damageCargoBundle(b,amount,source=\'combat\')','function hireGuard()','function updateGuard(dt)','function raiderSpawnChance()','function drawCargoBundles()','function drawGuard()']) assert(game.includes(fn),'v0.13 armed-haul runtime missing: '+fn);
assert(game.includes("if(cargoLoad()>0){game.attackCd=.28")&&game.includes('Weapons are tied up by cargo'),'carried standardized cargo must block normal combat');
assert(game.includes("e.code==='KeyR'")&&html.includes('id="mobileCargo"'),'desktop/mobile cargo set-down controls missing');
assert(game.includes("nearestCargoBundle(p.x,p.y,.58)")&&game.includes("damageCargoBundle(bundle,Math.max(4,p.damage*.75),'friendly')"),'friendly-fire cargo damage missing');
assert(game.includes("nearestCargoBundle(p.x,p.y,.62)")&&game.includes("damageCargoBundle(cargo,p.damage,'enemy')"),'enemy projectile cargo damage missing');
assert(game.includes("e.type==='greyveil_raider'")&&game.includes("damageCargoBundle(cargoTarget,e.def.damage*1.15,'raider')"),'raiders must target grounded cargo');
assert(game.includes('const GUARD_BASE_COST=26')&&game.includes('GUARD_CONTRACT_DAYS=1.5')&&game.includes('GUARD_MAX_HP=72'),'guard contract tuning missing');
assert(game.includes('if(cargoLoad()<=0)return toast')&&game.includes('game.trade.credits-=cost'),'guard hire must require an active cargo run and spend trade currency');
assert(game.includes('g.remaining=Math.max(0,g.remaining-dt)')&&game.includes('sanitizeGuard(raw.guard)'),'guard duration must use persistent remaining time, not cyclic day phase');
assert(game.includes("const strandedCargo=cargoLoad();if(strandedCargo>0)deployCargoBundle()"),'death must strand cargo instead of safely teleporting it to camp');
assert(game.includes("const base=.0015+Math.min(.058")&&game.includes("game.nightState==='night'?1.55:1")&&game.includes("route.active?.48:1")&&game.includes("activeGuard()?.72:1"),'raider risk must scale with cargo value and be mitigated by route/guard');
assert(game.includes('cargoBundles:game.cargoBundles')&&game.includes('guard:activeGuard()'),'cargo bundles and escort contract must persist');
assert(css.includes('.escort-hire')&&css.includes('.mobile-side-actions .cargo'),'escort/cargo controls styling missing');
console.log('wildforge_v0220=PASS armed_haul=cargo-setdown-raiders-escort');

assert(game.includes("const LEGACY_SAVE_KEY_0130 = 'wildforge.save.v0130'")&&game.includes("raw.v==='0.13.0'"),'v0.13.0 migration chain missing');
console.log('wildforge_v0220=PASS hotfix-save-migration');


const artPath=path.join(root,'wildforge/assets/core-art.webp'),artSources=read('wildforge/assets/ART-SOURCES.md');
assert(fs.existsSync(artPath)&&fs.statSync(artPath).size>30000,'v0.18 Drive-derived runtime pixel atlas missing/too small');
for(const source of ['01_environment_tileset.png','02_characters_enemies_animations.png','03_trade_outpost_props.png','04_items_ui_icons.png'])assert(artSources.includes(source),'Drive art source manifest missing: '+source);
for(const marker of ["const CORE_ART_SRC='./assets/core-art.webp'",'function artReady()','function drawArt(key,x,y,w,h)',"[TILE.GRASS]:'tile_grass'","drawArt('player_'+frame","t==='moss_crawler'&&artReady()","t==='greyveil_raider'&&artReady()","drawArt('guard_'+frame","drawArt('prop_cargo'"]) assert(game.includes(marker),'v0.14 pixel-art runtime missing: '+marker);
assert(game.includes("const LEGACY_SAVE_KEY_0131 = 'wildforge.save.v0131'")&&game.includes("raw.v==='0.13.1'"),'v0.13.1 migration chain missing');
const exporter=read('ops/release/build-wildforge-single-html.mjs');
assert(exporter.includes("assets/core-art.webp")&&exporter.includes("data:image/webp;base64"),'single-file exporter must inline the pixel atlas');
assert(game.includes('ctx.imageSmoothingEnabled=false'),'pixel-art rendering must disable interpolation');
assert(game.includes('function drawDrops(){'),'drop rendering must remain intact after art integration');
console.log('wildforge_v0220=PASS visual_foundation=pixel-atlas');

assert(game.includes('const PHYSICS_STEP=1/120')&&game.includes('while(game.physicsAccumulator>=PHYSICS_STEP'),'fixed-step control simulation missing');
assert(game.includes('const GROUND_TURN=104')&&game.includes('turning?GROUND_TURN:GROUND_ACCEL'),'responsive reversal tuning missing');
assert(game.includes('const JUMP_HOLD_TIME=.19')&&game.includes('const FALL_GRAVITY=34'),'jump arc tuning missing');
assert(game.includes('function primaryUseMode()')&&game.includes("return item?.kind==='weapon'&&count(id)>0?'attack':'mine'"),'held-item primary use semantics missing');
assert(game.includes('function attack(e=null)')&&!game.includes('if(game.attackCd>0||!e)return'),'ranged weapons must be usable without an enemy lock');
assert(game.includes('function meleeEnemyTarget()')&&game.includes('if(!e)e=meleeEnemyTarget()'),'melee proximity forgiveness missing');
assert(game.includes('function clearHeldInputs()')&&game.includes("addEventListener('blur',clearHeldInputs)"),'stuck-input recovery missing');
assert(game.includes('game.wheelAccum+=e.deltaY')&&game.includes('Math.abs(game.wheelAccum)>=48'),'high-resolution wheel gating missing');
assert(game.includes('Math.exp(-18*Math.max(0,dt))')&&game.includes('Math.round(game.camera.x*s)/s'),'responsive pixel-snapped camera missing');
assert(game.includes("const LEGACY_SAVE_KEY_0140 = 'wildforge.save.v0140'")&&game.includes("raw.v==='0.14.0'"),'v0.14 save migration missing');

const inventoryCss=read('wildforge/inventory-ui.css'),inventoryUi=read('wildforge/src/inventory-ui.js'),combatTuning=read('wildforge/src/combat-tuning.js'),surfaceContent=read('wildforge/src/surface-content.js'),settlementEconomy=read('wildforge/src/settlement-economy.js'),transportContracts=read('wildforge/src/transport-contracts.js');
assert(inventoryUi.includes('ATLAS_SIZE=Object.freeze({w:512,h:256})'),'Drive atlas inventory dimensions missing');
for(const id of ['wood','fiber','copper_ore','iron_ore','sand','ice','clay','rope','campfire','crystal'])assert(inventoryUi.includes(id+':['),'Drive atlas item mapping missing: '+id);
assert(data.includes("bramble_boar:{zh:'棘鬃兽'")&&game.includes("t==='bramble_boar'&&artReady()"),'Drive atlas surface fauna integration missing');
assert(world.includes('export const WORLD_W = 1920'),'v0.16 horizontal world expansion missing');
assert(world.includes('BIOME_BAND_W = 160')&&world.includes('LEGACY_WORLD_W = 480'),'v0.16 repeated biome bands / legacy expansion contract missing');
assert(world.includes('decorateSurface(this,rng')&&surfaceContent.includes('export function decorateSurface'),'surface content module missing');
assert(game.includes('const HOTBAR_SIZE = 10')&&inventoryUi.includes('INVENTORY_SLOT_COUNT=40'),'Terraria-like 10-slot / 40-slot inventory grammar missing');
assert(game.includes("/^Digit[0-9]$/")&&html.includes('1–9 / 0'),'10-slot keyboard mapping missing');
assert(inventoryCss.includes('.terraria-grid')&&inventoryCss.includes('.slot-tooltip'),'slot-first inventory styling/tooltip missing');
assert(game.includes('applyEnemyKnockback(e')&&combatTuning.includes('knockbackResistance(enemy)'),'enemy knockback response missing');
assert(data.includes('knockback:6.2')&&data.includes('knockbackResist:.58'),'weapon/enemy knockback tuning missing');
assert(game.includes('encounterCap({underground,night')&&game.includes('nextEncounterDelay({phase'),'reduced encounter scheduler missing');
assert(combatTuning.includes('dayBase:6.2')&&combatTuning.includes('surfaceCapDay:5'),'surface encounter pressure was not reduced');
assert(game.includes("const LEGACY_SAVE_KEY_0150 = 'wildforge.save.v0150'"),'v0.15 save expansion bridge missing');
assert(game.includes("const LEGACY_SAVE_KEY_0160 = 'wildforge.save.v0160'")&&game.includes("raw.v==='0.16.0'"),'v0.16 save migration bridge missing');
assert(game.includes("const LEGACY_SAVE_KEY_0170 = 'wildforge.save.v0170'")&&game.includes("raw.v==='0.17.0'"),'v0.17 save migration bridge missing');
assert(game.includes("const LEGACY_SAVE_KEY_0180 = 'wildforge.save.v0180'")&&game.includes("raw.v==='0.18.0'"),'v0.18 save migration bridge missing');
assert(surfaceContent.includes('export function buildSettlements')&&world.includes('this.settlements=buildSettlements(this,this.seed)'),'deterministic surface settlements missing');
const settlementRuntime=new Function(settlementEconomy.replace(/^export\s+/gm,'')+'\nreturn {SETTLEMENT_MAX_RELIABILITY,SETTLEMENT_PREFERENCE_PREMIUM,settlementName,settlementLongTermPreference,settlementDailyDemand,settlementDemandRemaining,settlementSellPrice};')();
const demandA=settlementRuntime.settlementDailyDemand({id:'test-verdant',biome:'verdant'},2),demandB=settlementRuntime.settlementDailyDemand({id:'test-verdant',biome:'verdant'},2);assert.deepEqual(demandA,demandB,'settlement demand must be deterministic per site/day');assert.notEqual(demandA.goodId,'greenheart_bale','priority demand must be imported cargo');assert(demandA.quantity>=4&&demandA.quantity<=7&&demandA.premium>=1.16&&demandA.premium<=1.36,'settlement demand tuning out of bounds');
const surfaceRuntime=new Function(surfaceContent.replace(/^export\s+/gm,'')+'\nreturn {buildSettlements};')(),fakeWorld={w:1920,surface:Int16Array.from({length:1920},()=>40),biome:x=>({id:['verdant','ember','frost'][Math.floor(x/160)%3]})},sitesA=surfaceRuntime.buildSettlements(fakeWorld,'WF-TEST'),sitesB=surfaceRuntime.buildSettlements(fakeWorld,'WF-TEST');assert.equal(sitesA.length,12,'expected one settlement per 160-tile frontier band');assert.deepEqual(sitesA,sitesB,'settlement placement must be deterministic for a seed');assert.equal(new Set(sitesA.map(site=>settlementRuntime.settlementName(site,'en'))).size,12,'frontier settlements should have distinct first-pass names');
for(const marker of ['SETTLEMENT_TRADE_RADIUS','SETTLEMENT_SAFE_RADIUS','SETTLEMENT_GENERAL_DEMAND_CAP','settlementDailyDemand','settlementDemandRemaining','settlementSellPrice']) assert(settlementEconomy.includes(marker),'settlement economy contract missing: '+marker);
for(const marker of ['function nearestSettlement(','function nearbySettlementMarket()','function sellSettlementGood(id)','function renderSettlementTrade(view,market)','function drawSettlements()']) assert(game.includes(marker),'settlement runtime missing: '+marker);
assert(game.includes('nearestSettlement(p.x,p.y,SETTLEMENT_SAFE_RADIUS)'),'settlement safe perimeter must affect surface encounters');
assert(game.includes("drawArt('prop_crates'")&&game.includes("drawArt('prop_workbench'")&&game.includes("drawArt('prop_barrels'"),'Drive settlement props are not integrated');
assert(game.includes("for(const t of [.25,.5,.75])")&&game.includes('drawSettlements();drawSupplyRoutes();'),'recognizable route-node / settlement render layer missing');
assert(css.includes('.settlement-order')&&css.includes('.trade-row.priority-demand'),'settlement demand UI styling missing');
const contractRuntime=new Function(transportContracts.replace(/^export\s+/gm,'')+'\nreturn {TRANSPORT_CONTRACT_DAYS,makeTransportOffer,contractDaysLeft};')();
const contractSites=[{id:'ember-a',biome:'ember',x:210},{id:'frost-a',biome:'frost',x:380},{id:'verdant-far',biome:'verdant',x:600}],contractArgs={day:3,originX:50,originBiome:'verdant',settlements:contractSites,cargoByHome:{verdant:'greenheart_bale',ember:'emberfuel_crate',frost:'frostglass_case'}},offerA=contractRuntime.makeTransportOffer(contractArgs),offerB=contractRuntime.makeTransportOffer(contractArgs);assert.deepEqual(offerA,offerB,'transport offer must be deterministic per day/origin');assert(offerA&&offerA.goodId==='greenheart_bale'&&offerA.destinationBiome!=='verdant','transport offer must carry local cargo to another biome');assert(offerA.quantity>=3&&offerA.quantity<=6&&offerA.reward>0&&offerA.distance>=48,'transport offer tuning out of bounds');assert.equal(contractRuntime.TRANSPORT_CONTRACT_DAYS,2,'transport deadline contract changed unexpectedly');assert.equal(contractRuntime.contractDaysLeft({deadlineDay:5},4),2,'contract day countdown must be inclusive');
for(const marker of ['function sanitizeTransportContract(','function activeTransportContract()','function acceptTransportContract()','function deliverTransportContract(site,id)','contractsCompleted','data-accept-contract','matchingTransportContract'])assert(game.includes(marker),'transport contract runtime missing: '+marker);
assert(game.includes('game.nightsSurvived++;game.saveDirty=true;syncTradeDay()'),'transport expiry must sync on dawn');assert(css.includes('.transport-contract')&&css.includes('.trade-row.contract-cargo'),'transport contract UI styling missing');assert(exporter.includes('transport-contracts.js')&&exporter.includes('__WF_CONTRACTS'),'single-file exporter missing transport contract module');
assert(html.includes('聚落记忆')&&html.includes('长期偏好')&&html.includes('可靠度'),'v0.22 settlement-memory changes are not surfaced on start screen');
console.log('wildforge_v0220=PASS settlement-demand-destinations');
console.log('wildforge_v0220=PASS surface-inventory-knockback-expansion');
console.log('wildforge_v0220=PASS terraria_like_controls=fixed-step-context-use-camera');


// v0.20 foundation-feel regression gates preserved under v0.21.
assert(game.includes("const LEGACY_SAVE_KEY_0190 = 'wildforge.save.v0190'" )&&game.includes("raw.v==='0.19.0'"),'v0.19 save migration bridge missing');
assert(game.includes("const HOTBAR_DEFAULT = Array.from({length:HOTBAR_SIZE},()=> '')"),'new worlds must start with an actually empty hotbar');
assert(game.includes('function freshInventory() { return {}; }'),'new worlds must start with an actually empty inventory');
assert(game.includes('inventoryLayout:Array.from({length:INVENTORY_SLOT_COUNT}')&&game.includes('inventoryLayout:game.inventoryLayout'),'persistent inventory-slot layout missing');
assert(game.includes('function moveInventoryItem(id,target)')&&game.includes('function canStoreItem(id,n=1)'),'inventory move/capacity runtime missing');
assert(inventoryUi.includes('export function normalizeInventoryLayout')&&inventoryUi.includes('data-inv-slot')&&inventoryUi.includes('onMove?.(itemId,target)'),'fixed 40-slot drag-reorder inventory contract missing');
const invRuntime=new Function(inventoryUi.replace(/^export\s+/gm,'')+'\nreturn {INVENTORY_SLOT_COUNT,normalizeInventoryLayout};')();
const invItems={wood:{kind:'material'},stone:{kind:'material'}},inv={wood:5,stone:2};
const normalized=invRuntime.normalizeInventoryLayout(['','','stone'],inv,invItems);assert.equal(normalized.length,40,'inventory layout must always normalize to 40 slots');assert.equal(normalized[2],'stone');assert(normalized.includes('wood'),'owned item omitted during inventory migration');
assert(data.includes('TREE_TRUNK:30')&&data.includes("30:{id:'tree_trunk'")&&data.includes('solid:false')&&data.includes('natural:true'),'non-blocking natural tree tile missing');
assert(world.includes('TILE.TREE_TRUNK')&&surfaceContent.includes('TILE.TREE_TRUNK')&&world.includes('relaxLegacySurfaceTrees()'),'natural/legacy surface tree traversal migration missing');
assert(game.includes('id===TILE.TREE_TRUNK')&&game.includes('drawNonSolidTile'),'tree trunk non-solid render path missing');
assert(settlementEconomy.includes('SETTLEMENT_TRADE_RADIUS=8.5')&&settlementEconomy.includes('SETTLEMENT_SAFE_RADIUS=11.5'),'settlement interaction footprint not enlarged');
assert(game.includes("s*17.6")&&game.includes("const houses=[[-7.1,2.45,3.3]")&&game.includes('进入聚落贸易'),'large settlement landmark presentation missing');
assert(exporter.includes('normalizeInventoryLayout')&&exporter.includes('INVENTORY_SLOT_COUNT'),'single-file exporter missing v0.20 inventory module exports');
console.log('wildforge_v0220=PASS foundation_feel=large-settlement-real-pack-pass-through-trees');

assert(game.includes("LEGACY_SAVE_KEY_0200 = 'wildforge.save.v0200'"),'v0.20 save migration key missing');
for(const marker of ['function drawBiomeAtmosphere()','function drawSurfaceAccents()','warehouseUnits(active)','prop_crates','prop_barrels']) assert(game.includes(marker),'v0.21 visual-state marker missing: '+marker);
assert(game.includes("site.biome==='verdant'")&&game.includes("site.biome==='ember'")&&game.includes('drawSettlements()'),'biome-specific settlement identity missing');
assert(game.includes('for(const site of game.world?.settlements||[])')&&game.includes('punchLight(px+q*s'),'settlement night-light layer missing');
assert(game.includes('drawBackdrop();drawBiomeAtmosphere();drawWorld();drawSurfaceAccents();drawSettlements();'),'v0.21 render ordering missing');
console.log('wildforge_v0220=PASS visual_spiral=biomes-settlements-depots');


// v0.22 settlement memory / reliability gates.
assert(game.includes("const LEGACY_SAVE_KEY_0210 = 'wildforge.save.v0210'")&&game.includes("raw.v==='0.21.0'"),'v0.21 save migration bridge missing');
assert(settlementEconomy.includes('SETTLEMENT_MAX_RELIABILITY=5')&&settlementEconomy.includes('SETTLEMENT_PREFERENCE_PREMIUM=1.08'),'settlement memory tuning constants missing');
const memorySite={id:'memory-verdant',biome:'verdant',index:0},memoryPreference=settlementRuntime.settlementLongTermPreference(memorySite);
assert(['emberfuel_crate','frostglass_case'].includes(memoryPreference),'long-term preference must be imported cargo');
const memoryLow=settlementRuntime.settlementDailyDemand(memorySite,3,0),memoryHigh=settlementRuntime.settlementDailyDemand(memorySite,3,5);
assert(memoryHigh.quantity>=memoryLow.quantity+2,'high reliability must expand priority order quantity');
assert(memoryHigh.premium>memoryLow.premium&&memoryHigh.completionBonus>memoryLow.completionBonus,'high reliability must improve order economics');
let preferenceDay=0;while(preferenceDay<20&&settlementRuntime.settlementDailyDemand(memorySite,preferenceDay,0).goodId===memoryPreference)preferenceDay++;
assert(preferenceDay<20,'test must find a day where stable preference differs from daily priority');
assert.equal(settlementRuntime.settlementSellPrice(100,memorySite,memoryPreference,preferenceDay,0),108,'stable preference premium must be deterministic and bounded');
const lowTrustOffer=contractRuntime.makeTransportOffer({...contractArgs,reliabilityBySettlement:{}}),highTrustOffer=contractRuntime.makeTransportOffer({...contractArgs,reliabilityBySettlement:{[lowTrustOffer.destinationId]:5}});
assert.equal(highTrustOffer.destinationId,lowTrustOffer.destinationId,'reliability must not reroll the transport destination');
assert.equal(highTrustOffer.destinationReliability,5,'transport offer must expose destination reliability');
assert(highTrustOffer.quantity===lowTrustOffer.quantity+1&&highTrustOffer.reward>lowTrustOffer.reward,'trusted destinations must offer larger, better-paid transport work');
for(const marker of ['settlementReliability:{}','function settlementReliability(site)','function adjustSettlementReliability(site,delta=0)','function settlementReliabilityPips(site)','reliabilityBySettlement','adjustSettlementReliability(site,-1)','adjustSettlementReliability(site,1)']) assert(game.includes(marker),'settlement reliability runtime missing: '+marker);
assert(game.includes('settlementLongTermPreference(site)')&&game.includes('SETTLEMENT_PREFERENCE_PREMIUM'),'long-term preference is not wired into settlement runtime/UI');
assert(game.includes('settlementReliability=src.settlementReliability')&&game.includes('SETTLEMENT_MAX_RELIABILITY'),'reliability save sanitization missing');
assert(css.includes('.settlement-memory')&&css.includes('.trade-row.preferred-demand'),'settlement memory presentation missing');
assert(exporter.includes('settlementLongTermPreference')&&exporter.includes('SETTLEMENT_MAX_RELIABILITY')&&exporter.includes('SETTLEMENT_PREFERENCE_PREMIUM'),'single-file exporter missing settlement-memory exports');
console.log('wildforge_v0220=PASS settlement_memory=preference-reliability-causality');
