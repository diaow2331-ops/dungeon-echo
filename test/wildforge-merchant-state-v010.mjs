import assert from 'node:assert/strict';
import {freshMerchantState,sanitizeMerchantState,discoverSettlement,acceptContract,canCompleteContract,completeContract,quoteTrade,settleMarketTrade,applyTravelCost} from '../wildforge/src/merchant-state.mjs';
import {STARTING_COPPER,STARTING_SATIETY,FIRST_PICKAXE_PRICE} from '../wildforge/src/merchant-economy.mjs';

const state=freshMerchantState('merchant-test');
assert.equal(state.wallet,STARTING_COPPER);assert.equal(state.satiety,STARTING_SATIETY);
assert.ok(state.markets.greenfield&&state.markets.embercross&&state.markets.frostgate);
assert.equal(discoverSettlement(state,'greenfield'),true);assert.equal(discoverSettlement(state,'greenfield'),false);
assert.equal(acceptContract(state,'ledger_errand','greenfield'),true);assert.equal(canCompleteContract(state,'greenfield'),true);
const firstReward=completeContract(state,'greenfield');assert.equal(firstReward,38);assert.equal(state.wallet,38);
assert.ok(state.wallet<FIRST_PICKAXE_PRICE,'first errand must not trivialize pickaxe goal');

const bread=quoteTrade(state,'greenfield','bread','buy',1);assert.ok(bread.total>0);
if(state.wallet>=bread.total){const before=state.markets.greenfield.bread.stock;const trade=settleMarketTrade(state,'greenfield','bread','buy',1);assert.equal(trade.ok,true);assert.equal(state.markets.greenfield.bread.stock,before-1);}
const satietyBefore=state.satiety;applyTravelCost(state,62);applyTravelCost(state,180,{night:true,burden:.7});assert.ok(state.satiety<satietyBefore);

assert.equal(acceptContract(state,'grain_run','greenfield'),true);assert.equal(canCompleteContract(state,'embercross'),true);const pay=completeContract(state,'embercross');assert.equal(pay,265);assert.equal(state.questCargo,null);
const saved=JSON.parse(JSON.stringify(state));const restored=sanitizeMerchantState(saved,'merchant-test');assert.equal(restored.wallet,state.wallet);assert.equal(restored.activeContract,null);assert.deepEqual(restored.completedContracts,state.completedContracts);
console.log(`wildforge_merchant_state_v010=PASS wallet=${state.wallet} satiety=${state.satiety.toFixed(2)}`);
