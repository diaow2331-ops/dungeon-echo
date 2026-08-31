'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const growth=require(path.join(root,'game/domain/town/town-growth-rules-v180.js'));
const economy=require(path.join(root,'game/domain/economy/economy-rules-v130.js'));
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const core=read('game/core/game.js'),css=read('style.css');
const authority=JSON.parse(read('docs/authority-map-v130.json'));

assert.equal(growth.smithyRefinementUnlocked({smithy:0}),true,'v1.7 +3 refinement must remain baseline');
assert.equal(growth.smithyMasterworkUnlocked({smithy:0}),true,'v1.7 +5 masterwork must remain baseline');
assert.equal(growth.smithyRetemperUnlocked({smithy:1}),false);
assert.equal(growth.smithyRetemperUnlocked({smithy:2}),true,'smithy Lv2 unlocks paid route retempering');
assert.equal(growth.smithyMasterRetemperUnlocked({smithy:2}),false);
assert.equal(growth.smithyMasterRetemperUnlocked({smithy:3}),true,'smithy Lv3 may safely retemper masterworked gear');
assert.equal(Number(growth.forgeDiscount({smithy:3}).toFixed(2)),.15);

assert.equal(growth.marketReadinessUnlocked({market:0}),true,'existing one-click readiness must not be removed from v1.7 saves');
assert.equal(growth.marketReadinessKeyTarget({market:0}),0);
assert.equal(growth.marketReadinessKeyTarget({market:1}),1,'trade road Lv1 upgrades the readiness kit with a Key');
assert.equal(growth.marketRestockUnlocked({market:1}),false);
assert.equal(growth.marketRestockUnlocked({market:2}),true,'trade road Lv2 unlocks one guarded-caravan restock');
assert.equal(growth.marketPriceDiscount({market:2}),0);
assert.equal(growth.marketPriceDiscount({market:3}),.08,'night market supplies are 8% cheaper');

assert.deepEqual([0,1,2,3].map(tavern=>growth.tavernChoiceCount({tavern})),[1,2,3,4],'tavern stages must progress random -> 2-way -> 3-way -> 4-way choice');
assert.deepEqual([0,1,2,3].map(tavern=>growth.tavernToastCap({tavern})),[8,9,10,11]);

assert.equal(economy.townMarketRestockCost(1),75);
assert.equal(economy.townMarketRestockCost(10),255);
assert.equal(economy.townSupplyPrice(16,10,.08),150);
assert.equal(economy.forgeRetemperCost(100,3,0,0),190);
assert(economy.forgeRetemperCost(100,3,1,0)>economy.forgeRetemperCost(100,3,0,0),'repeated retempers must rise in cost');

assert(/if \(it\.forge === 3 && !it\.refinePath\) \{[\s\S]*it\.refinePending = true/.test(core),'baseline +3 refinement trigger must remain unconditional');
assert(/const masterPath = it\.forge === 5 \? applyForgeMasterwork\(it\) : null/.test(core),'baseline +5 masterwork must remain unconditional');
assert(core.includes("TOWN_GROWTH_RULES.smithyRetemperUnlocked(works)")&&core.includes("TOWN_GROWTH_RULES.smithyMasterRetemperUnlocked(works)"),'smithy project must gate only new retemper capability');
assert(core.includes('function forgeRetemperCost(item)')&&core.includes('ECONOMY_RULES.forgeRetemperCost('),'retemper price must delegate to economy authority');
assert(core.includes('const current = forgeRefinementPath(item);'),'retemper eligibility must reject stale or invalid refinement-path ids');
assert(core.includes('function closeForgeRetemper()')&&core.includes('data-refinecancel="1"'),'optional retemper must be cancellable without weakening mandatory +3 refinement');

assert(core.includes('function townMarketRestockAvailable()')&&core.includes('function restockTownMarket()'),'market Lv2 must have a real restock service');
assert(core.includes('restockUsed:market.restockUsed ? 1 : 0'),'restock once-per-cycle state must persist');
assert(core.includes("TOWN_GROWTH_RULES.marketPriceDiscount(currentTownWorks())"),'town supply price must consume night-market discount');
assert(core.includes('TOWN_GROWTH_RULES.marketReadinessKeyTarget(currentTownWorks())'),'readiness kit must consume trade-road Key target');
assert(core.includes('data-townrestock="1"'),'market UI must expose guarded-caravan restock');

assert(core.includes('function tavernOfferChoices()')&&core.includes('data-taverndrink="${row.id}"'),'upgraded tavern must render an explicit drink choice menu');
assert(core.includes("drinkAtTavern(toast.dataset.taverndrink || '')"),'tavern click handler must preserve selected drink identity');
assert(core.includes('cap:2')&&core.includes('tavernRewardCounts'),'rare permanent ATK toast must keep a persistent hard cap when choices become deterministic');
assert(core.includes('tavernRewardCounts: {}'),'new save schema must initialize bounded reward counts');
assert(core.includes('base.tavernRewardCounts = {}'),'old meta must safely migrate reward-count state');

assert(core.includes('function townServiceStageHtml('),'service pages must state their current construction stage');
assert(css.includes('.town-service-stage')&&css.includes('.market-service-row')&&css.includes('.tavern-choice-grid'),'qualitative service upgrades require dedicated responsive presentation');
assert(/@media \(max-width: 560px\)[\s\S]*\.tavern-choice-grid \{ grid-template-columns: 1fr; \}/.test(css),'mobile tavern choice menu must collapse to one column');

assert.equal(authority.authorities.townServiceUpgradePolicy,'game/domain/town/town-growth-rules-v180.js');
assert.equal(authority.authorities.townMarketRestockPricing,'game/domain/economy/economy-rules-v130.js');
assert.equal(authority.authorities.forgeRetemperPricing,'game/domain/economy/economy-rules-v130.js');

console.log('town_services_v180=PASS');
