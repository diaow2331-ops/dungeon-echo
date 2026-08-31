'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const growth=require(path.join(root,'game/domain/town/town-growth-rules-v180.js'));
const economy=require(path.join(root,'game/domain/economy/economy-rules-v130.js'));
const sets=require(path.join(root,'game/domain/inventory/set-rules-v180.js'));
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const core=read('game/core/game.js');
const zh=read('index.html'),en=read('en/index.html'),css=read('style.css'),manifest=read('ops/release/static-files.txt');
const authority=JSON.parse(read('docs/authority-map-v130.json'));

assert.equal(growth.authority,'town-growth-policy');
assert.equal(growth.version,'v1.8.0-development');
assert.deepEqual(growth.PROJECTS.map(x=>x.id),['smithy','market','relics','tavern']);
for(const row of growth.PROJECTS){
  assert.equal(row.levels.length,3,row.id+' should have three bounded construction stages');
  assert(row.levels.every((x,i)=>x.cost>0 && x.tier>=2 && (!i || x.cost>row.levels[i-1].cost)),row.id+' upgrade curve must be bounded and rising');
}
const clean=growth.sanitizeLevels({});
assert.equal(growth.level(clean,'smithy'),0);
assert.equal(Number(growth.forgeDiscount({smithy:3}).toFixed(2)),.15);
assert.equal(growth.marketStockBonus({market:3}),3);
assert.equal(growth.relicChanceBonus({relics:3}),.09);
assert.equal(growth.tavernToastCap({tavern:3}),11);
assert.equal(growth.level({smithy:99},'smithy'),3,'project levels must clamp to authored maximum');

let check=growth.canUpgrade({},'smithy',{tier:1,gold:999,relics:99});
assert.equal(check.reason,'tier');
check=growth.canUpgrade({},'smithy',{tier:2,gold:0,relics:99});
assert.equal(check.reason,'gold');
check=growth.canUpgrade({},'smithy',{tier:2,gold:120,relics:99});
assert(check.ok&&check.next.nextLevel===1);
check=growth.canUpgrade({relics:1},'relics',{tier:6,gold:999,relics:7});
assert.equal(check.reason,'relics');
check=growth.canUpgrade({relics:1},'relics',{tier:6,gold:999,relics:8});
assert(check.ok);

assert.equal(economy.forgeCost(100,0),150);
assert.equal(economy.forgeCost(100,0,growth.forgeDiscount({smithy:3})),128);
assert.equal(economy.townSupplyStock('potion',1,growth.marketStockBonus({market:3})),7);
assert.equal(Number((sets.namedChance(3,growth.relicChanceBonus({relics:3}))-sets.namedChance(3)).toFixed(2)),.09);

assert(core.includes("window.DE_TOWN_GROWTH_RULES_V180")&&core.includes("authority !== 'town-growth-policy'"),'core must consume pure town-growth policy');
assert(core.includes('function upgradeTownWork(id)'),'core must own the gold mutation/commit boundary');
assert(core.includes("if (id === 'market') meta.market = null;"),'market construction must invalidate stale authored stock');
assert(core.includes('function renderTownWorks()'),'plaza must visibly render construction projects');
assert(core.includes('data-townwork="${row.id}"'),'town project cards must expose explicit actions');
assert(core.includes("TOWN_GROWTH_RULES.forgeDiscount(currentTownWorks())"),'smithy project must feed canonical economy pricing');
assert(core.includes("TOWN_GROWTH_RULES.marketStockBonus(currentTownWorks())"),'market project must feed canonical stock calculation');
assert(core.includes("TOWN_GROWTH_RULES.relicChanceBonus(currentTownWorks())"),'relic project must feed named-drop policy');
assert(core.includes('TOWN_GROWTH_RULES.tavernToastCap(currentTownWorks())'),'tavern project must feed bounded toast cap');
assert(core.includes("ui(row.zh, row.en) + (workLevel ?"),'walkable town nameplates must reflect construction level');
assert(css.includes('.town-work-grid')&&css.includes('.town-work-card'),'town projects need dedicated responsive presentation');

for(const [name,html] of [['zh',zh],['en',en]]){
  assert(html.includes('game/domain/town/town-growth-rules-v180.js?v=181'),name+' boots town-growth policy');
  assert(html.indexOf('town-growth-rules-v180.js?v=181')<html.indexOf('game/core/game.js?v=181'),name+' boots town-growth policy before core');
}
assert(manifest.includes('game/domain/town/town-growth-rules-v180.js'),'release allowlist must ship town-growth authority');
assert.equal(authority.authorities.townGrowthPolicy,'game/domain/town/town-growth-rules-v180.js');
assert.equal(authority.authorities.townProjectPersistence,'game/core/game.js');

console.log('town_growth_v180=PASS');
