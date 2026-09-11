export const TRANSPORT_CONTRACT_DAYS=2;

function hashText(text=''){
  let h=2166136261>>>0;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}

export function makeTransportOffer({day=0,originX=0,originBiome='',settlements=[],cargoByHome={},reliabilityBySettlement={},demandBySettlement=null,completedContracts=0}={}){
  const goodId=cargoByHome[originBiome];
  if(!goodId)return null;
  const candidates=(settlements||[]).filter(site=>site?.id&&site.biome!==originBiome&&Math.abs(Number(site.x)-originX)>=48);
  if(!candidates.length)return null;
  const h=hashText(`${Math.max(0,Math.floor(day))}:${originBiome}:${Math.floor(originX/8)}`),firstRoute=Math.max(0,Math.floor(Number(completedContracts)||0))<1;
  const ranked=demandBySettlement?candidates.map((site,index)=>({site,index,need:Math.max(0,Number(demandBySettlement?.[site.id]?.[goodId])||0),distance:Math.abs(Number(site.x)-originX)})).sort((a,b)=>b.need-a.need||((a.index-(h%candidates.length)+candidates.length)%candidates.length)-((b.index-(h%candidates.length)+candidates.length)%candidates.length)):null;
  const starterPool=ranked?.filter(x=>x.need>0),starter=(starterPool?.length?starterPool:ranked||candidates.map((site,index)=>({site,index,need:0,distance:Math.abs(Number(site.x)-originX)}))).slice().sort((a,b)=>a.distance-b.distance||b.need-a.need)[0],destination=firstRoute?starter.site:(ranked?.[0]?.need>0?ranked[0].site:candidates[h%candidates.length]),reliability=Math.max(0,Math.min(5,Math.floor(Number(reliabilityBySettlement?.[destination.id])||0))),needBoost=Math.min(2,Math.floor((Number(demandBySettlement?.[destination.id]?.[goodId])||0)*3)),rawQuantity=Math.min(8,3+((h>>>5)%4)+(reliability>=3?1:0)+needBoost),quantity=firstRoute?Math.min(4,rawQuantity):rawQuantity,distance=Math.abs(Number(destination.x)-originX);
  const reward=8+quantity*4+Math.min(36,Math.floor(distance/28))+reliability*3+(firstRoute?4:0);
  return Object.freeze({
    offerId:`${Math.max(0,Math.floor(day))}:${originBiome}:${Math.floor(originX)}:${destination.id}:${goodId}`,
    goodId,quantity,reward,distance:Math.round(distance),destinationId:destination.id,destinationBiome:destination.biome,destinationX:Number(destination.x)||0,destinationReliability:reliability
  });
}

export function contractDaysLeft(contract,day=0){
  if(!contract)return 0;
  return Math.max(0,Math.floor(Number(contract.deadlineDay)||0)-Math.max(0,Math.floor(day))+1);
}
