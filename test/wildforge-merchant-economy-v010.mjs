import assert from 'node:assert/strict';
import {
  COIN,STARTING_COPPER,STARTING_SATIETY,SATIETY_MAX,FIRST_PICKAXE_PRICE,
  GOODS,SETTLEMENTS,STARTER_CONTRACTS,splitMoney,formatMoney,initialMarket,
  marketPrice,applyMarketTrade,satietyBand,travelSatietyCost,eatSatiety,firstPickaxeOffer
} from '../wildforge/src/merchant-economy.mjs';

assert.deepEqual(COIN,{COPPER:1,SILVER:100,GOLD:10000,PLATINUM:1000000});
assert.equal(STARTING_COPPER,0,'fresh merchant must start penniless');
assert.equal(STARTING_SATIETY,82);assert.equal(SATIETY_MAX,100);
assert.deepEqual(splitMoney(1020304),{platinum:1,gold:2,silver:3,copper:4});
assert.equal(formatMoney(125000,'zh'),'12金 50银');
assert.equal(FIRST_PICKAXE_PRICE,125000,'first pickaxe must remain a medium-term capital goal');
assert.equal(firstPickaxeOffer().settlementId,'embercross');

assert.equal(SETTLEMENTS.length,3,'surface vertical slice needs three trade nodes');
assert.deepEqual(SETTLEMENTS.map(x=>x.id),['greenfield','embercross','frostgate']);
assert.ok(Object.keys(GOODS).length>=18,'commodity catalog too thin');
assert.ok(STARTER_CONTRACTS.some(q=>q.starter&&q.reward>0&&!q.cargo),'penniless local starter work missing');
assert.ok(STARTER_CONTRACTS.some(q=>q.starter&&q.cargo),'consigned starter cargo missing');

const green=initialMarket('seed-a','greenfield');
const ember=initialMarket('seed-a','embercross');
assert.deepEqual(green,initialMarket('seed-a','greenfield'),'market generation must be deterministic');
const grainGreen=marketPrice('greenfield','grain',green.grain,'buy');
const grainEmber=marketPrice('embercross','grain',ember.grain,'sell');
assert.ok(grainEmber>grainGreen,'starter grain route must expose a real price spread');
const bought=applyMarketTrade(green.grain,'buy',10);
assert.ok(bought.stock<green.grain.stock && marketPrice('greenfield','grain',bought,'buy')>=grainGreen,'buying must consume stock and resist infinite fixed-price arbitrage');
const sold=applyMarketTrade(ember.grain,'sell',10);
assert.ok(sold.stock>ember.grain.stock,'selling must add local stock');

assert.equal(satietyBand(80).speed,1);assert.ok(satietyBand(20).speed<1);assert.equal(satietyBand(0).regen,false);
assert.ok(travelSatietyCost(100,true,.8)>travelSatietyCost(100,false,0),'night/load must raise route operating cost');
assert.equal(eatSatiety(70,'bread',2),100,'food must restore and clamp satiety');
console.log(`wildforge_merchant_economy_v010=PASS goods=${Object.keys(GOODS).length} settlements=${SETTLEMENTS.length} grain_spread=${grainGreen}->${grainEmber}`);
