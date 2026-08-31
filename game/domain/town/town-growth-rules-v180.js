/* Dungeon Echo v1.8.0 pure town-growth policy.
 *
 * Sole deterministic authority for persistent town project definitions,
 * upgrade requirements, bounded project effects, return-event selection and
 * state-aware town NPC copy.
 * Core owns Gold/supply mutation, persistence, UI, Canvas and input.
 */
(() => {
  'use strict';

  const PROJECTS = Object.freeze([
    Object.freeze({
      id:'smithy',
      zh:'旧炉重燃', en:'Rekindled Smithy',
      levels:Object.freeze([
        Object.freeze({ tier:2, cost:120, zh:'重修风箱', en:'Restore the Bellows', effectZh:'锻造费用 -5%', effectEn:'Forge cost -5%' }),
        Object.freeze({ tier:4, cost:320, zh:'添置淬火槽', en:'Build a Quench Trough', effectZh:'锻造费用 -10%', effectEn:'Forge cost -10%' }),
        Object.freeze({ tier:7, cost:700, zh:'重铸主炉', en:'Recast the Main Furnace', effectZh:'锻造费用 -15%', effectEn:'Forge cost -15%' }),
      ]),
    }),
    Object.freeze({
      id:'market',
      zh:'东门商道', en:'East-Gate Trade Road',
      levels:Object.freeze([
        Object.freeze({ tier:2, cost:100, zh:'修整驿道', en:'Repair the Caravan Road', effectZh:'每类市集补给库存 +1', effectEn:'Town supply stock +1 each' }),
        Object.freeze({ tier:5, cost:280, zh:'设立护商队', en:'Fund Caravan Guards', effectZh:'每类市集补给库存 +2', effectEn:'Town supply stock +2 each' }),
        Object.freeze({ tier:8, cost:640, zh:'开放夜市', en:'Open the Night Market', effectZh:'每类市集补给库存 +3', effectEn:'Town supply stock +3 each' }),
      ]),
    }),
    Object.freeze({
      id:'relics',
      zh:'遗物馆扩建', en:'Relic Hall Expansion',
      levels:Object.freeze([
        Object.freeze({ tier:3, cost:150, relics:2, zh:'整理旧展柜', en:'Restore the Old Cases', effectZh:'史诗/传说具名遗物发现率 +3%', effectEn:'Epic/Legendary named-relic chance +3%' }),
        Object.freeze({ tier:6, cost:420, relics:8, zh:'建立编目室', en:'Build the Cataloguing Room', effectZh:'史诗/传说具名遗物发现率 +6%', effectEn:'Epic/Legendary named-relic chance +6%' }),
        Object.freeze({ tier:9, cost:900, relics:14, zh:'开放深层展厅', en:'Open the Deep Gallery', effectZh:'史诗/传说具名遗物发现率 +9%', effectEn:'Epic/Legendary named-relic chance +9%' }),
      ]),
    }),
    Object.freeze({
      id:'tavern',
      zh:'余烬酒馆', en:'Ember Tavern',
      levels:Object.freeze([
        Object.freeze({ tier:3, cost:140, zh:'扩建后堂', en:'Open the Back Room', effectZh:'角色祝酒上限 +1', effectEn:'Character toast cap +1' }),
        Object.freeze({ tier:6, cost:380, zh:'添置老酒窖', en:'Open the Old Cellar', effectZh:'角色祝酒上限 +2', effectEn:'Character toast cap +2' }),
        Object.freeze({ tier:9, cost:820, zh:'设立远征者长桌', en:'Build the Delvers Long Table', effectZh:'角色祝酒上限 +3', effectEn:'Character toast cap +3' }),
      ]),
    }),
  ]);

  const EVENTS = Object.freeze([
    Object.freeze({
      id:'relic_exhibition', minTier:1,
      zh:'遗物小展', en:'Relic Exhibition',
      zhStory:'遗物书记把你新带回来的东西摆进临时展柜。镇民第一次发现，地牢旧物并不只是“值几个金币”。',
      enStory:'The curator places your new relics in a temporary case. Townsfolk begin to see that dungeon relics are more than things with a sale price.',
      actionZh:'开放临展', actionEn:'Open the Exhibit',
    }),
    Object.freeze({
      id:'caravan_surplus', minTier:2,
      zh:'商队压仓货', en:'Caravan Surplus',
      zhStory:'东门来了一支赶夜路的商队。他们不想把沉重补给再背回去，愿意按镇内价把整批货留在这里。',
      enStory:'A caravan arrives after dark and would rather leave its heavy supplies in town than carry them back out.',
      actionZh:'收下压仓货', actionEn:'Take the Surplus',
    }),
    Object.freeze({
      id:'scout_cache', minTier:3,
      zh:'斥候的备用箱', en:'Scout Reserve Crate',
      zhStory:'远征斥候从旧岗哨拖回一只备用箱。里面的东西不漂亮，但每一样都能让人更有机会活着回来。',
      enStory:'Expedition scouts drag a reserve crate back from an abandoned post. Nothing inside is pretty, but all of it helps people come home alive.',
      actionZh:'买下备用箱', actionEn:'Buy the Reserve Crate',
    }),
  ]);

  const BY_ID = Object.freeze(Object.fromEntries(PROJECTS.map(row => [row.id,row])));
  const EVENT_BY_ID = Object.freeze(Object.fromEntries(EVENTS.map(row => [row.id,row])));

  function project(id) { return BY_ID[String(id || '')] || null; }
  function eventById(id) { return EVENT_BY_ID[String(id || '')] || null; }
  function sanitizeLevels(raw) {
    const out = {};
    for (const row of PROJECTS) {
      const levelValue = raw && Number.isFinite(Number(raw[row.id])) ? Math.floor(Number(raw[row.id])) : 0;
      out[row.id] = Math.max(0, Math.min(row.levels.length, levelValue));
    }
    return Object.freeze(out);
  }
  function level(raw,id) {
    const row = project(id); if (!row) return 0;
    const n = raw && Number.isFinite(Number(raw[id])) ? Math.floor(Number(raw[id])) : 0;
    return Math.max(0,Math.min(row.levels.length,n));
  }
  function currentEffect(raw,id) {
    const row=project(id), lvl=level(raw,id);
    if(!row || lvl<=0) return null;
    return row.levels[lvl-1];
  }
  function nextUpgrade(raw,id) {
    const row=project(id), lvl=level(raw,id);
    if(!row || lvl>=row.levels.length) return null;
    return Object.freeze({ projectId:row.id, nextLevel:lvl+1, ...row.levels[lvl] });
  }
  function canUpgrade(raw,id,{tier=1,gold=0,relics=0}={}) {
    const next=nextUpgrade(raw,id);
    if(!next) return Object.freeze({ok:false,reason:'max',next:null});
    if((Number(tier)||1)<next.tier) return Object.freeze({ok:false,reason:'tier',next});
    if((Number(relics)||0)<(next.relics||0)) return Object.freeze({ok:false,reason:'relics',next});
    if((Number(gold)||0)<next.cost) return Object.freeze({ok:false,reason:'gold',next});
    return Object.freeze({ok:true,reason:'ready',next});
  }

  const forgeDiscount = raw => 0.05 * level(raw,'smithy');
  const marketStockBonus = raw => level(raw,'market');
  const relicChanceBonus = raw => 0.03 * level(raw,'relics');
  const tavernToastCap = raw => 8 + level(raw,'tavern');

  function eventOffer(id,{tier=1,relics=0,newRelics=0}={}) {
    const row=eventById(id); if(!row) return null;
    const t=Math.max(1,Math.floor(Number(tier)||1));
    if(t<row.minTier) return null;
    if(row.id==='relic_exhibition') {
      if((Number(newRelics)||0)<=0) return null;
      const gold=Math.min(120,25+Math.max(1,Number(relics)||0)*4+Math.max(1,Number(newRelics)||0)*8);
      return Object.freeze({...row,cost:0,effect:Object.freeze({gold})});
    }
    if(row.id==='caravan_surplus') {
      return Object.freeze({...row,cost:70+t*15,effect:Object.freeze({marketRestock:1})});
    }
    if(row.id==='scout_cache') {
      return Object.freeze({...row,cost:90+t*15,effect:Object.freeze({escapes:1,keys:1})});
    }
    return null;
  }

  function eventForReturn(context={}) {
    if((Number(context.newRelics)||0)>0) return eventOffer('relic_exhibition',context);
    const pool=EVENTS.filter(row=>row.id!=='relic_exhibition')
      .map(row=>eventOffer(row.id,context)).filter(Boolean);
    if(!pool.length) return null;
    const seed=(Math.floor(Number(context.runs)||0)*7 + Math.floor(Number(context.lastReturnDepth)||0) +
      Math.floor(Number(context.relics)||0)*3 + Math.floor(Number(context.tier)||1)) >>> 0;
    return pool[seed%pool.length];
  }

  function npcLine(id,{tier=1,bestDepth=0,lastReturnDepth=0,relics=0,works={}}={}) {
    const t=Math.max(1,Math.floor(Number(tier)||1));
    const depth=Math.max(0,Math.floor(Number(bestDepth)||0));
    const last=Math.max(0,Math.floor(Number(lastReturnDepth)||0));
    switch(String(id||'')) {
      case 'smith': {
        const lvl=level(works,'smithy');
        if(lvl>=3) return Object.freeze({zh:'主炉终于重新烧红了。现在拿来的好东西，我敢让它进火。',en:'The main furnace is red again. Bring me something worth putting into the fire.'});
        if(lvl>=1) return Object.freeze({zh:'风箱不漏气以后，锤子落下去都像准了半寸。',en:'Since the bellows stopped leaking, every hammer blow lands half an inch truer.'});
        return Object.freeze({zh:'这破风箱一天漏三次气。等镇上有闲钱，先把它救活。',en:'These bellows leak three times a day. When the town can spare the coin, save them first.'});
      }
      case 'merchant': {
        const lvl=level(works,'market');
        if(lvl>=3) return Object.freeze({zh:'夜市一开，天亮前也有人来换货。现在这条路终于像条商路了。',en:'With the night market open, people trade before dawn. This road finally feels like a trade road.'});
        if(lvl>=1) return Object.freeze({zh:'路修平以后，车轴少断一根，镇上就能多留下一箱货。',en:'Every axle that survives the repaired road leaves another crate in town.'});
        return Object.freeze({zh:'东门那条路再烂下去，商队宁可绕三天也不进来。',en:'If the east road gets any worse, caravans will add three days just to avoid this place.'});
      }
      case 'innkeeper': {
        const lvl=level(works,'tavern');
        if(lvl>=2) return Object.freeze({zh:'酒窖有了，回来的人终于不用喝当天兑出来的东西。',en:'With a cellar, returning delvers no longer drink whatever was watered down that morning.'});
        if(last>0) return Object.freeze({zh:'第 '+last+' 层回来的？坐。今天有人会想听。',en:'Back from Floor '+last+'? Sit. People will want to hear it tonight.'});
        return Object.freeze({zh:'第一次回来以前，我不劝你点最贵的酒。',en:'Before your first safe return, I would not order the expensive bottle.'});
      }
      case 'records': {
        const lvl=level(works,'relics');
        if(relics>=12) return Object.freeze({zh:'你带回来的东西已经够撑起半间展厅。现在缺的不是货架，是完整的故事。',en:'Your relics could fill half a gallery now. What we lack is not shelf space, but complete stories.'});
        if(lvl>=1) return Object.freeze({zh:'已经归档 '+relics+' 件。别只看数值——名字和来历才决定它为什么值得留下。',en:relics+' relics catalogued. Do not look only at numbers; names and provenance are why they are worth keeping.'});
        return Object.freeze({zh:'先活着把第一件东西带回来。死人手里的宝贝进不了档案。',en:'Bring the first one back alive. A relic in a dead delver hand never reaches the archive.'});
      }
      case 'quartermaster':
        return Object.freeze({zh:t>=5?'仓库里开始有真正值得锁两道门的东西了。出发前别忘了把不想丢的都存下。':'先把能活着带回来的东西存好，再谈发财。',en:t>=5?'The stash finally holds things worth locking behind two doors. Store anything you cannot afford to lose.':'Store what you brought home alive before you start talking about getting rich.'});
      case 'oracle':
        return Object.freeze({zh:depth>=60?'越往下，命运越不像一条路，更像一群互相咬住尾巴的蛇。':'轮盘只是娱乐。真正的命运，是你什么时候决定回城。',en:depth>=60?'Deeper down, fate stops looking like a road and starts looking like snakes biting one another tails.':'The wheel is amusement. Real fate is deciding when to return home.'});
      case 'portal':
        return Object.freeze({zh:t>=7?'现在传送门每天都要校准。走得越深，回来的人越少，留下的坐标却越多。':'坐标不是路。能不能从那里回来，还是你自己的事。',en:t>=7?'The portal needs calibration every day now. Fewer people return from deeper routes, but the coordinate list keeps growing.':'A coordinate is not a road. Whether you return from it is still your problem.'});
      default:
        return Object.freeze({zh:'镇上的人各自忙着自己的事。',en:'Everyone in town has work of their own.'});
    }
  }

  const api = Object.freeze({
    version:'v1.8.0-development',
    authority:'town-growth-policy',
    PROJECTS,
    EVENTS,
    project,
    eventById,
    sanitizeLevels,
    level,
    currentEffect,
    nextUpgrade,
    canUpgrade,
    forgeDiscount,
    marketStockBonus,
    relicChanceBonus,
    tavernToastCap,
    eventOffer,
    eventForReturn,
    npcLine,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_TOWN_GROWTH_RULES_V180 = api;
})();
