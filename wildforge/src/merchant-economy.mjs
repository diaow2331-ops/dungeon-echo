export const COIN = Object.freeze({ COPPER:1, SILVER:100, GOLD:10000, PLATINUM:1000000 });
export const STARTING_COPPER = 0;
export const STARTING_SATIETY = 82;
export const SATIETY_MAX = 100;
export const FIRST_PICKAXE_PRICE = 12 * COIN.GOLD + 50 * COIN.SILVER;

export const clamp = (lo, value, hi) => Math.max(lo, Math.min(hi, value));
export function splitMoney(total=0) {
  let left=Math.max(0,Math.floor(total));
  const platinum=Math.floor(left/COIN.PLATINUM);left%=COIN.PLATINUM;
  const gold=Math.floor(left/COIN.GOLD);left%=COIN.GOLD;
  const silver=Math.floor(left/COIN.SILVER);left%=COIN.SILVER;
  return {platinum,gold,silver,copper:left};
}
export function formatMoney(total=0,lang='zh') {
  const m=splitMoney(total),parts=[];
  if(m.platinum)parts.push(`${m.platinum}${lang==='zh'?'铂':'p'}`);
  if(m.gold)parts.push(`${m.gold}${lang==='zh'?'金':'g'}`);
  if(m.silver)parts.push(`${m.silver}${lang==='zh'?'银':'s'}`);
  if(m.copper||!parts.length)parts.push(`${m.copper}${lang==='zh'?'铜':'c'}`);
  return parts.join(' ');
}

export const GOODS = Object.freeze({
  grain:{zh:'谷物',en:'Grain',base:7,target:90,food:0},
  bread:{zh:'面包',en:'Bread',base:18,target:55,food:24},
  dried_meat:{zh:'风干肉',en:'Dried Meat',base:46,target:34,food:42},
  timber:{zh:'木材',en:'Timber',base:24,target:70},
  charcoal:{zh:'木炭',en:'Charcoal',base:38,target:58},
  hide:{zh:'兽皮',en:'Hide',base:52,target:36},
  herbs:{zh:'药草',en:'Medicinal Herbs',base:63,target:28},
  salt:{zh:'盐',en:'Salt',base:31,target:46},
  pottery:{zh:'陶器',en:'Pottery',base:72,target:26},
  cloth:{zh:'布匹',en:'Cloth',base:96,target:24},
  lamp_oil:{zh:'灯油',en:'Lamp Oil',base:118,target:22},
  tools:{zh:'铁制工具',en:'Iron Tools',base:235,target:18},
  copper_bar:{zh:'赤铜锭',en:'Red Copper Bar',base:310,target:16},
  iron_bar:{zh:'冷铁锭',en:'Cold Iron Bar',base:480,target:14},
  frostglass:{zh:'霜晶玻璃',en:'Frostglass',base:690,target:10},
  spice:{zh:'荒地香料',en:'Wastes Spice',base:820,target:9},
  relic_fragment:{zh:'遗迹碎片',en:'Relic Fragment',base:1450,target:5},
  star_crystal:{zh:'星晶',en:'Star Crystal',base:3900,target:3}
});

export const SETTLEMENTS = Object.freeze([
  {id:'greenfield',x:62,zh:'青麦镇',en:'Greenfield',faction:'verdant_league',guardRadius:18,
   factors:{grain:.62,bread:.72,timber:.76,hide:.82,herbs:.84,tools:1.34,charcoal:1.22,iron_bar:1.42,salt:1.18}},
  {id:'embercross',x:239,zh:'赤炉城',en:'Embercross',faction:'ember_guild',guardRadius:21,
   factors:{grain:1.48,bread:1.36,timber:1.31,charcoal:.68,tools:.72,copper_bar:.74,iron_bar:.78,spice:.76,herbs:1.24}},
  {id:'frostgate',x:401,zh:'白岩堡',en:'Frostgate',faction:'northern_watch',guardRadius:20,
   factors:{grain:1.58,bread:1.44,dried_meat:.78,cloth:1.23,lamp_oil:1.31,iron_bar:1.18,frostglass:.64,salt:.82,herbs:1.16}}
]);

export function settlementById(id){return SETTLEMENTS.find(s=>s.id===id)||null;}
export function nearestSettlement(x){return SETTLEMENTS.reduce((best,s)=>!best||Math.abs(s.x-x)<Math.abs(best.x-x)?s:best,null);}
export function isGuardedSurface(x,y,surfaceY){
  return SETTLEMENTS.some(s=>Math.abs(s.x-x)<=s.guardRadius && y<=surfaceY+8);
}

function seededUnit(text=''){
  let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)/4294967295;
}
export function initialMarket(seed,settlementId){
  const s=settlementById(settlementId);if(!s)return {};
  const market={};
  for(const [id,g] of Object.entries(GOODS)){
    const factor=s.factors[id]??1,noise=.82+seededUnit(`${seed}:${settlementId}:${id}`)*.38;
    const abundance=clamp(.45,(1/factor)*noise,1.85);
    market[id]={stock:Math.max(1,Math.round(g.target*abundance)),pressure:1};
  }
  return market;
}
export function marketPrice(settlementId,goodId,marketEntry,side='buy'){
  const s=settlementById(settlementId),g=GOODS[goodId];if(!s||!g)return 0;
  const stock=Math.max(0,Number(marketEntry?.stock)||0),target=g.target||20;
  const local=s.factors[goodId]??1,scarcity=clamp(.72,1+((target-stock)/target)*.46,1.58);
  const pressure=clamp(.8,Number(marketEntry?.pressure)||1,1.25);
  const ask=Math.max(1,Math.round(g.base*local*scarcity*pressure));
  return side==='sell'?Math.max(1,Math.floor(ask*.84)):ask;
}
export function applyMarketTrade(entry,side,quantity=1){
  const q=Math.max(0,Math.floor(quantity)),e={stock:Math.max(0,Number(entry?.stock)||0),pressure:clamp(.8,Number(entry?.pressure)||1,1.25)};
  if(side==='buy'){e.stock=Math.max(0,e.stock-q);e.pressure=clamp(.8,e.pressure+q*.006,1.25);}
  else {e.stock+=q;e.pressure=clamp(.8,e.pressure-q*.004,1.25);}
  return e;
}

export const FOOD_IDS = Object.freeze(['bread','dried_meat']);
export function satietyBand(value){
  const v=clamp(0,Number(value)||0,SATIETY_MAX);
  if(v<=0)return {id:'starving',speed:.82,regen:false};
  if(v<10)return {id:'famished',speed:.88,regen:false};
  if(v<25)return {id:'hungry',speed:.94,regen:true};
  return {id:'fed',speed:1,regen:true};
}
export function travelSatietyCost(distanceTiles=0,night=false,burden=0){
  const distance=Math.max(0,Number(distanceTiles)||0),load=clamp(0,Number(burden)||0,1);
  return distance*.035*(night?1.18:1)*(1+load*.28);
}
export function eatSatiety(current,goodId,count=1){
  const food=GOODS[goodId]?.food||0;return clamp(0,(Number(current)||0)+food*Math.max(0,Math.floor(count)),SATIETY_MAX);
}

export const STARTER_CONTRACTS = Object.freeze([
  {id:'ledger_errand',from:'greenfield',to:'greenfield',zh:'替商会清点仓单',en:'Count the Guild Ledgers',reward:38,cargo:null,starter:true},
  {id:'grain_run',from:'greenfield',to:'embercross',zh:'把赊出的谷物送到赤炉城',en:'Carry Consigned Grain to Embercross',reward:265,cargo:{id:'grain',n:8},starter:true},
  {id:'north_mail',from:'embercross',to:'frostgate',zh:'送达北境商函',en:'Deliver the Northern Trade Letter',reward:410,cargo:{id:'trade_letter',n:1},starter:false}
]);
export function contractById(id){return STARTER_CONTRACTS.find(q=>q.id===id)||null;}
export function firstPickaxeOffer(){return {itemId:'wood_pick',settlementId:'embercross',price:FIRST_PICKAXE_PRICE};}
