'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const strip=code=>code.replace(/^\s*import\s+[^;]+;\s*$/gm,'').replace(/^export\s+/gm,'');
const dataCode=strip(read('wildforge/src/data.js'));
const surfaceCode=strip(read('wildforge/src/surface-content.js'));
const worldCode=strip(read('wildforge/src/world.js'));
const game=read('wildforge/src/game.js'),css=read('wildforge/style.css');
const data=new Function(`${dataCode}\nreturn {BIOMES,TILE,TILE_DEFS};`)();
const worldApi=new Function('__data',`const {BIOMES,TILE,TILE_DEFS}=__data;${surfaceCode}${worldCode}\nreturn {World,encodeTiles};`)(data);
let min=Infinity,max=0;
for(let i=0;i<80;i++){
  const world=new worldApi.World(`WF-P1-SPAWN-${i}`),first=world.settlements[0],distance=Math.abs(first.x-world.spawn.x);
  min=Math.min(min,distance);max=Math.max(max,distance);
  assert.equal(first.biome,'verdant','first sovereign must remain the Verdant faction');
  assert(distance>=35&&distance<=90,`first settlement must be discoverable after the survival opening; got ${distance} for seed ${i}`);
}
const layoutSeed='WF-P0-AID-01',fresh=new worldApi.World(layoutSeed),encoded=worldApi.encodeTiles(fresh.tiles),freshReload=new worldApi.World(layoutSeed,encoded,{nearSpawnCapital:true}),legacyReload=new worldApi.World(layoutSeed,encoded,{nearSpawnCapital:false});
assert.equal(freshReload.settlements[0].x,fresh.settlements[0].x,'new v0.42 worlds must keep the near-spawn capital after save/reload');
assert(Math.abs(legacyReload.settlements[0].x-freshReload.settlements[0].x)>100,'legacy layout test seed must prove old worlds can preserve their former capital placement');
for(const marker of [
  "markMilestone('first-meal')",
  "markMilestone('first-settlement')",
  "markMilestone('first-market')",
  "markMilestone('first-contract')",
  "markMilestone('cross-region-delivery')",
  "实时短缺",
  "LIVE SHORTAGE",
  "指向真实短缺的运输委托",
  "transport contract driven by a real shortage",
  "firstTown=nearestSettlement(game.player.x,game.player.y,18)",
  "good.home!==market.site.biome"
])assert(game.includes(marker),'Phase 1 onboarding contract missing: '+marker);
assert(game.includes("const settlementSale=Object.keys(trade.sold||{}).some(key=>String(key).startsWith('settlement:'))"),'old saves must infer settlement onboarding only from real settlement sales');
assert(game.includes("settlementLayout:game.settlementLayout")&&game.includes("LEGACY_SAVE_KEY_0410 = 'wildforge.save.v0410'")&&game.includes("raw.v==='0.41.0'")&&game.includes("nearSpawnCapital:game.settlementLayout==='onboarding-v2'"),'v0.42 must preserve legacy settlement layout while keeping new-world onboarding placement');
assert(game.includes("hasMilestone('crafted-workbench')")&&game.includes("hasMilestone('crafted-pick')"),'crafted onboarding milestones must survive placed/consumed items');
assert(game.includes("game.infrastructure?.beacons||[]")&&game.includes('onboardingCargoReady()'),'beacon/cargo onboarding must derive from existing authoritative state');
assert(game.includes('liveNeeds=Object.keys(TRADE_GOODS).map')&&game.includes('settlementFrontierQuote(site,id)'),'first settlement demand must read live frontier inventory pressure');
assert(game.includes("tr('今日采购订单','Daily procurement')")&&!game.includes("tr('今日急需','Priority')"),'daily deterministic bonus must not masquerade as live shortage');
assert(css.includes('.settlement-order.live-shortage'),'live shortage must be visually distinct without a new panel');
const serializeStart=game.indexOf('function serialize()'),serializeEnd=game.indexOf('function saveGame(',serializeStart),serialized=game.slice(serializeStart,serializeEnd);
assert(serialized.includes('discoveries:game.discoveries'),'onboarding milestones must reuse the existing discovery persistence');
assert(!serialized.includes('onboarding:'),'Phase 1 must not introduce a second onboarding save state');
console.log(`wildforge_phase1_onboarding=PASS first-settlement-distance=${min}-${max} live-shortage single-authority milestones`);
