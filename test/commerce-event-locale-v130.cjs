'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const core=fs.readFileSync(require('path').resolve(__dirname,'..','game/core/game.js'),'utf8');
assert(core.includes('market: null'),'new meta must default market state safely');
assert(core.includes('const market = raw.market;'),'sanitizer must preserve only validated market state');
assert(!core.includes("'de-town-commerce-v1'"),'retired commerce sidecar key must stay absent');
assert(core.includes("scroll: { zh:'传送卷轴', en:'Teleport Scroll'"),'Town market must restore Teleport Scroll');
assert(core.includes('Held ${held} · Stock ${left}'),'Town market UI must expose stock');

const a=core.indexOf('const TOWN_MARKET_SUPPLIES =');
const b=core.indexOf('const TOWN_CHECKPOINTS =',a);
const c=core.indexOf('function buyTown(id) {');
const next=core.indexOf('\nfunction ',c+1);
assert(a>=0&&b>a&&c>b&&next>c,'market executable regions must be discoverable');
const sb={
  console, Math,
  SHOP:{potionPrice:16,scrollPrice:28,escapePrice:26,keyPrice:22,insurancePrice:120},
  meta:{runs:1,bestDepth:1,gold:10000,potions:0,scrolls:0,escapes:0,keys:0,insurance:0,market:null},
  state:'town',
  clamp:(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),
  townTierForArt(){return Math.max(1,Math.min(10,Math.ceil(Math.max(1,Number(sb.meta.bestDepth)||1)/10)));},
  saveCount:0, saveMeta(){sb.saveCount++;}, renderTown(){},
  ui:(zh,en)=>en, msg(){}, sfx:{pickup(){}},
};
vm.createContext(sb);
vm.runInContext(core.slice(a,b)+core.slice(c,next)+`\n;globalThis.__m={ensureTownMarket,townMarketPrice,buyTown,freshTownMarket};`,sb,{filename:'town-market-core.js'});
const M=sb.__m;
let market=M.ensureTownMarket();
assert.deepEqual(JSON.parse(JSON.stringify(market.stock)),{potion:4,scroll:2,escape:1,key:2,insurance:1},'Tier 1 stock curve mismatch');
const same=M.ensureTownMarket(); assert.equal(same,market,'reopening Town must not refresh stock');
const price1=M.townMarketPrice('potion',1); const gold0=sb.meta.gold;
assert.equal(M.buyTown('potion'),true); assert.equal(market.stock.potion,3); assert.equal(sb.meta.potions,1); assert.equal(sb.meta.gold,gold0-price1);
M.buyTown('escape'); const afterSold=sb.meta.gold; assert.equal(market.stock.escape,0); assert.equal(M.buyTown('escape'),false); assert.equal(sb.meta.gold,afterSold,'sold-out purchase must not charge Gold');
sb.meta.runs=2; market=M.ensureTownMarket(); assert.equal(market.cycleRun,2); assert.equal(market.stock.escape,1,'new expedition cycle must refresh stock');
sb.meta.bestDepth=41; market=M.ensureTownMarket(); assert.equal(market.tier,5); assert.equal(market.stock.escape,2,'Tier 5 must expand Return Scroll stock');
assert(M.townMarketPrice('potion',5)>price1,'late Town Tier prices must scale upward');
const persisted=JSON.parse(JSON.stringify(sb.meta)); assert(persisted.market&&persisted.market.stock,'market state must ride existing meta serialization');
console.log('town_market_core_v131=PASS');
