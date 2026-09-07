export const TRANSPORT_CONTRACT_DAYS=2;

function hashText(text=''){
  let h=2166136261>>>0;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}

export function makeTransportOffer({day=0,originX=0,originBiome='',settlements=[],cargoByHome={},reliabilityBySettlement={}}={}){
  const goodId=cargoByHome[originBiome];
  if(!goodId)return null;
  const candidates=(settlements||[]).filter(site=>site?.id&&site.biome!==originBiome&&Math.abs(Number(site.x)-originX)>=48);
  if(!candidates.length)return null;
  const h=hashText(`${Math.max(0,Math.floor(day))}:${originBiome}:${Math.floor(originX/8)}`);
  const destination=candidates[h%candidates.length],reliability=Math.max(0,Math.min(5,Math.floor(Number(reliabilityBySettlement?.[destination.id])||0))),quantity=3+((h>>>5)%4)+(reliability>=3?1:0),distance=Math.abs(Number(destination.x)-originX);
  const reward=8+quantity*4+Math.min(36,Math.floor(distance/28))+reliability*3;
  return Object.freeze({
    offerId:`${Math.max(0,Math.floor(day))}:${originBiome}:${Math.floor(originX)}:${destination.id}:${goodId}`,
    goodId,quantity,reward,distance:Math.round(distance),destinationId:destination.id,destinationBiome:destination.biome,destinationX:Number(destination.x)||0,destinationReliability:reliability
  });
}

export function contractDaysLeft(contract,day=0){
  if(!contract)return 0;
  return Math.max(0,Math.floor(Number(contract.deadlineDay)||0)-Math.max(0,Math.floor(day))+1);
}
