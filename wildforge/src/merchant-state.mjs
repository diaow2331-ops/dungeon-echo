import {
  STARTING_COPPER,STARTING_SATIETY,SATIETY_MAX,SETTLEMENTS,STARTER_CONTRACTS,GOODS,
  clamp,initialMarket,marketPrice,applyMarketTrade,contractById,travelSatietyCost
} from './merchant-economy.mjs';

export function freshMerchantState(seed='wildforge'){
  return {
    wallet:STARTING_COPPER,
    satiety:STARTING_SATIETY,
    markets:Object.fromEntries(SETTLEMENTS.map(s=>[s.id,initialMarket(seed,s.id)])),
    discovered:[],activeContract:null,completedContracts:[],questCargo:null,
    distanceTravelled:0,lastX:null,starvationClock:0
  };
}

export function sanitizeMerchantState(raw,seed='wildforge'){
  const base=freshMerchantState(seed),src=raw&&typeof raw==='object'?raw:{};
  base.wallet=Math.max(0,Math.floor(Number(src.wallet)||0));
  base.satiety=clamp(0,Number.isFinite(Number(src.satiety))?Number(src.satiety):STARTING_SATIETY,SATIETY_MAX);
  base.discovered=Array.isArray(src.discovered)?src.discovered.filter(id=>SETTLEMENTS.some(s=>s.id===id)):[];
  base.completedContracts=Array.isArray(src.completedContracts)?src.completedContracts.filter(id=>STARTER_CONTRACTS.some(q=>q.id===id)):[];
  base.activeContract=contractById(src.activeContract)?src.activeContract:null;
  base.questCargo=src.questCargo&&typeof src.questCargo==='object'?{...src.questCargo}:null;
  base.distanceTravelled=Math.max(0,Number(src.distanceTravelled)||0);
  base.lastX=Number.isFinite(Number(src.lastX))?Number(src.lastX):null;
  for(const s of SETTLEMENTS){
    const incoming=src.markets?.[s.id];if(!incoming||typeof incoming!=='object')continue;
    for(const id of Object.keys(GOODS)){
      const e=incoming[id];if(!e)continue;
      base.markets[s.id][id]={stock:Math.max(0,Math.floor(Number(e.stock)||0)),pressure:clamp(.8,Number(e.pressure)||1,1.25)};
    }
  }
  return base;
}

export function discoverSettlement(state,id){
  if(!SETTLEMENTS.some(s=>s.id===id)||state.discovered.includes(id))return false;
  state.discovered.push(id);return true;
}
export function acceptContract(state,id,atSettlement){
  const q=contractById(id);if(!q||state.activeContract||q.from!==atSettlement||state.completedContracts.includes(id))return false;
  state.activeContract=id;state.questCargo=q.cargo?{...q.cargo,contractId:id}:null;return true;
}
export function canCompleteContract(state,atSettlement){
  const q=contractById(state.activeContract);return !!q&&q.to===atSettlement;
}
export function completeContract(state,atSettlement){
  const q=contractById(state.activeContract);if(!q||q.to!==atSettlement)return 0;
  state.wallet+=q.reward;state.completedContracts.push(q.id);state.activeContract=null;state.questCargo=null;return q.reward;
}

export function quoteTrade(state,settlementId,goodId,side='buy',quantity=1){
  const entry=state.markets?.[settlementId]?.[goodId],unit=marketPrice(settlementId,goodId,entry,side),q=Math.max(1,Math.floor(quantity));
  return {unit,quantity:q,total:unit*q};
}
export function settleMarketTrade(state,settlementId,goodId,side='buy',quantity=1){
  const quote=quoteTrade(state,settlementId,goodId,side,quantity),entry=state.markets?.[settlementId]?.[goodId];
  if(!entry||!quote.unit)return {ok:false,quote};
  if(side==='buy'&&(state.wallet<quote.total||entry.stock<quote.quantity))return {ok:false,quote};
  state.markets[settlementId][goodId]=applyMarketTrade(entry,side,quote.quantity);
  state.wallet=Math.max(0,state.wallet+(side==='buy'?-quote.total:quote.total));
  return {ok:true,quote};
}

export function applyTravelCost(state,nextX,{night=false,burden=0}={}){
  const x=Number(nextX);if(!Number.isFinite(x))return 0;
  if(state.lastX===null){state.lastX=x;return 0;}
  const distance=Math.abs(x-state.lastX);state.lastX=x;
  if(distance<=0)return 0;
  const cost=travelSatietyCost(distance,night,burden);state.distanceTravelled+=distance;state.satiety=clamp(0,state.satiety-cost,SATIETY_MAX);return cost;
}
