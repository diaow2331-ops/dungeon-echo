const GOODS=Object.freeze(['greenheart_bale','emberfuel_crate','frostglass_case']);
const HOME=Object.freeze({greenheart_bale:'verdant',emberfuel_crate:'ember',frostglass_case:'frost'});
const NAMES=Object.freeze({
  verdant:[['苔桥聚落','Mossbridge'],['青篱驿','Greenfence'],['藤灯集','Vineland Lantern'],['河枝村','Riverbranch']],
  ember:[['烬脊营','Cinder Ridge'],['赤炉站','Redkiln'],['灰井集','Ashwell'],['炉风镇','Kilnwind']],
  frost:[['霜镜站','Frostmirror'],['白晶营','Whiteglass'],['寒灯驿','Cold Lantern'],['雪脊村','Snowridge']]
});

export const SETTLEMENT_TRADE_RADIUS=8.5;
export const SETTLEMENT_SAFE_RADIUS=11.5;
export const SETTLEMENT_GENERAL_DEMAND_CAP=8;
export const SETTLEMENT_MAX_RELIABILITY=5;
export const SETTLEMENT_PREFERENCE_PREMIUM=1.08;

function hashText(text=''){
  let h=2166136261>>>0;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function clampReliability(value=0){return Math.max(0,Math.min(SETTLEMENT_MAX_RELIABILITY,Math.floor(Number(value)||0)));}
function importedGoods(site){return GOODS.filter(id=>HOME[id]!==site?.biome);}

export function settlementName(site,lang='zh'){
  const list=NAMES[site?.biome]||NAMES.verdant;
  const ordinal=Math.floor(Math.abs(Number(site?.index)||0)/3),pair=list[ordinal%list.length];
  return lang==='en'?pair[1]:pair[0];
}
export function settlementLongTermPreference(site){
  const imports=importedGoods(site),h=hashText(`preference:${site?.id||'settlement'}`);
  return imports[h%Math.max(1,imports.length)]||GOODS[0];
}
export function settlementDailyDemand(site,day=0,reliability=0){
  const imports=importedGoods(site),h=hashText(`${site?.id||'settlement'}:${Math.max(0,Math.floor(day))}`),trust=clampReliability(reliability);
  const goodId=imports[h%Math.max(1,imports.length)]||GOODS[0];
  const quantity=4+((h>>>5)%4)+(trust>=2?1:0)+(trust>=4?1:0);
  const premium=1.16+((h>>>9)%5)*.05+trust*.01;
  const completionBonus=4+((h>>>13)%6)+trust*2;
  return Object.freeze({goodId,quantity,premium,completionBonus,reliability:trust});
}

export function settlementDemandKey(site,id){return `settlement:${site?.id||'unknown'}:${id}`;}
export function settlementDemandRemaining(site,day,sold=0,reliability=0){
  const demand=settlementDailyDemand(site,day,reliability);
  return Math.max(0,demand.quantity-Math.max(0,Number(sold)||0));
}
export function settlementSellPrice(basePrice,site,id,day=0,reliability=0){
  const demand=settlementDailyDemand(site,day,reliability),preference=settlementLongTermPreference(site),base=Math.max(1,Math.floor(Number(basePrice)||1));
  if(id===demand.goodId)return Math.max(1,Math.ceil(base*demand.premium));
  if(id===preference)return Math.max(1,Math.ceil(base*SETTLEMENT_PREFERENCE_PREMIUM));
  return base;
}
