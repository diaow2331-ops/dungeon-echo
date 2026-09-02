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
        Object.freeze({ tier:2, cost:750, zh:'重修风箱', en:'Restore the Bellows', effectZh:'锻造费用 -5% · 铁匠铺开始稳定营业', effectEn:'Forge cost -5% · the smithy becomes a dependable service' }),
        Object.freeze({ tier:4, cost:2200, zh:'添置淬火槽', en:'Build a Quench Trough', effectZh:'锻造费用 -10% · 开放付费重淬', effectEn:'Forge cost -10% · unlock paid retempering' }),
        Object.freeze({ tier:7, cost:5200, zh:'重铸主炉', en:'Recast the Main Furnace', effectZh:'锻造费用 -15% · 大师装备也可保留淬炼并重淬', effectEn:'Forge cost -15% · masterworked gear can be safely retempered' }),
      ]),
    }),
    Object.freeze({
      id:'market',
      zh:'东门商道', en:'East-Gate Trade Road',
      levels:Object.freeze([
        Object.freeze({ tier:2, cost:650, zh:'修整驿道', en:'Repair the Caravan Road', effectZh:'每类库存 +1 · 一键整备额外补齐 1 把钥匙', effectEn:'Stock +1 each · one-click kit also tops up 1 Key' }),
        Object.freeze({ tier:5, cost:1900, zh:'设立护商队', en:'Fund Caravan Guards', effectZh:'每类库存 +2 · 每轮可召回护商队补货一次', effectEn:'Stock +2 each · one guarded-caravan restock per cycle' }),
        Object.freeze({ tier:8, cost:4800, zh:'开放夜市', en:'Open the Night Market', effectZh:'每类库存 +3 · 夜市补给价格 -8%', effectEn:'Stock +3 each · Night Market supply price -8%' }),
      ]),
    }),
    Object.freeze({
      id:'relics',
      zh:'遗物馆扩建', en:'Relic Hall Expansion',
      levels:Object.freeze([
        Object.freeze({ tier:3, cost:950, relics:2, zh:'整理旧展柜', en:'Restore the Old Cases', effectZh:'具名发现率 +3% · 套装追查倾向 50%', effectEn:'Named chance +3% · set research preference 50%' }),
        Object.freeze({ tier:6, cost:3000, relics:8, zh:'建立编目室', en:'Build the Cataloguing Room', effectZh:'具名发现率 +6% · 套装追查倾向 65%', effectEn:'Named chance +6% · set research preference 65%' }),
        Object.freeze({ tier:9, cost:6500, relics:14, zh:'开放深层展厅', en:'Open the Deep Gallery', effectZh:'具名发现率 +9% · 套装追查倾向 80%', effectEn:'Named chance +9% · set research preference 80%' }),
      ]),
    }),
    Object.freeze({
      id:'tavern',
      zh:'余烬酒馆', en:'Ember Tavern',
      levels:Object.freeze([
        Object.freeze({ tier:3, cost:850, zh:'扩建后堂', en:'Open the Back Room', effectZh:'祝酒上限 +1 · 每次从 2 杯中选择', effectEn:'Toast cap +1 · choose from 2 drinks each return' }),
        Object.freeze({ tier:6, cost:2700, zh:'添置老酒窖', en:'Open the Old Cellar', effectZh:'祝酒上限 +2 · 每次从 3 杯中选择', effectEn:'Toast cap +2 · choose from 3 drinks each return' }),
        Object.freeze({ tier:9, cost:6000, zh:'设立远征者长桌', en:'Build the Delvers Long Table', effectZh:'祝酒上限 +3 · 四种祝酒全部可选', effectEn:'Toast cap +3 · all four toasts become selectable' }),
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
      id:'scout_cache', minTier:5,
      zh:'斥候的备用箱', en:'Scout Reserve Crate',
      zhStory:'远征斥候从旧岗哨拖回一只备用箱。里面的东西不漂亮，但每一样都能让人更有机会活着回来。',
      enStory:'Expedition scouts drag a reserve crate back from an abandoned post. Nothing inside is pretty, but all of it helps people come home alive.',
      actionZh:'买下备用箱', actionEn:'Buy the Reserve Crate',
    }),
    Object.freeze({
      id:'apothecary_batch', minTier:3, project:'market', minProject:1,
      zh:'药剂学徒的整锅新药', en:'Apothecary Batch',
      zhStory:'修好的商路终于把一批没摔碎的药瓶送进镇里。药剂学徒熬了一整锅，比零买便宜，但得现在决定要不要留下。',
      enStory:'The repaired road finally delivers a crate of unbroken glass. The apprentice brews a full batch, cheaper than buying bottles one by one if the town takes it now.',
      actionZh:'收下这批药', actionEn:'Take the Batch',
    }),
    Object.freeze({
      id:'smithy_commission', minTier:2, project:'smithy', minProject:1,
      zh:'铁匠铺的商队急单', en:'Smithy Caravan Commission',
      zhStory:'过路商队临时坏了两副车轴。重燃的铁匠铺接下急单，工钱不多，却让镇上的炉火第一次替“远征之外”的生活挣钱。',
      enStory:'A passing caravan breaks two axles. The rekindled smithy takes the rush job; the pay is modest, but the furnace earns coin for something other than delving.',
      actionZh:'交付急单', actionEn:'Deliver the Commission',
    }),
    Object.freeze({
      id:'long_table_pool', minTier:3, project:'tavern', minProject:1,
      zh:'长桌凑出的远征份子', en:'Long-Table Supply Pool',
      zhStory:'酒馆里几名旧远征者把零钱和没用完的补给凑成一份。他们不白送，只按成本转给下一个肯往深处走的人。',
      enStory:'Several retired delvers pool spare coin and unused supplies at the tavern. It is not charity; they will pass it on at cost to whoever heads down next.',
      actionZh:'接下这份补给', actionEn:'Take the Supply Pool',
    }),
  ]);

  const RESIDENTS = Object.freeze([
    Object.freeze({ id:'provisioner', zh:'补给商', en:'Provisioner', minTier:2 }),
    Object.freeze({ id:'apothecary', zh:'药剂学徒', en:'Apothecary Apprentice', minTier:3, project:'market', minProject:1 }),
    Object.freeze({ id:'watch', zh:'东门镇卫', en:'East-Gate Watch', minTier:4 }),
    Object.freeze({ id:'scout', zh:'远征斥候', en:'Expedition Scout', minTier:5 }),
    Object.freeze({ id:'technician', zh:'传送技师', en:'Portal Technician', minTier:7 }),
    Object.freeze({ id:'alchemist', zh:'驻镇炼金师', en:'Resident Alchemist', minTier:8, project:'market', minProject:2 }),
  ]);

  const BY_ID = Object.freeze(Object.fromEntries(PROJECTS.map(row => [row.id,row])));
  const EVENT_BY_ID = Object.freeze(Object.fromEntries(EVENTS.map(row => [row.id,row])));
  const RESIDENT_BY_ID = Object.freeze(Object.fromEntries(RESIDENTS.map(row => [row.id,row])));

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
  const smithyRefinementUnlocked = () => true;
  const smithyRetemperUnlocked = raw => level(raw,'smithy') >= 2;
  const smithyMasterworkUnlocked = () => true;
  const smithyMasterRetemperUnlocked = raw => level(raw,'smithy') >= 3;
  const marketStockBonus = raw => level(raw,'market');
  const marketReadinessUnlocked = () => true;
  const marketReadinessKeyTarget = raw => level(raw,'market') >= 1 ? 1 : 0;
  const marketRestockUnlocked = raw => level(raw,'market') >= 2;
  const marketPriceDiscount = raw => level(raw,'market') >= 3 ? 0.08 : 0;
  const relicChanceBonus = raw => 0.03 * level(raw,'relics');
  const tavernToastCap = raw => 8 + level(raw,'tavern');
  const tavernChoiceCount = raw => [1,2,3,4][level(raw,'tavern')];

  function eventOffer(id,{tier=1,relics=0,newRelics=0,works={}}={}) {
    const row=eventById(id); if(!row) return null;
    const t=Math.max(1,Math.floor(Number(tier)||1));
    if(t<row.minTier) return null;
    if(row.project && level(works,row.project)<(row.minProject||1)) return null;
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
    if(row.id==='apothecary_batch') {
      return Object.freeze({...row,cost:45+t*8,effect:Object.freeze({potions:2})});
    }
    if(row.id==='smithy_commission') {
      return Object.freeze({...row,cost:0,effect:Object.freeze({gold:35+t*9})});
    }
    if(row.id==='long_table_pool') {
      return Object.freeze({...row,cost:50+t*10,effect:Object.freeze({potions:1,escapes:1})});
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

  function townRumor({tier=1,runs=0,bestDepth=0,lastReturnDepth=0,relics=0,works={},eventId='',focusActive=false}={}) {
    const t=Math.max(1,Math.floor(Number(tier)||1));
    const depth=Math.max(0,Math.floor(Number(bestDepth)||0));
    const last=Math.max(0,Math.floor(Number(lastReturnDepth)||0));
    const archive=Math.max(0,Math.floor(Number(relics)||0));
    const pool=[];
    const pending=eventById(eventId);
    if(pending) return Object.freeze({
      zh:`公告板上的“${pending.zh}”被人围着看。镇里现在会等你做决定，而不是等你路过。`,
      en:`People are gathered around “${pending.en}” on the notice board. The town now waits for your decisions instead of merely watching you pass through.`,
    });
    if(level(works,'smithy')>0) pool.push(Object.freeze({
      zh:'铁匠铺的烟从早到晚都没断过。最近来修农具和车轴的人，已经比来修剑的人多了。',
      en:'Smoke rises from the smithy all day now. Lately more people bring farm tools and wagon axles than swords.',
    }));
    if(level(works,'market')>0) pool.push(Object.freeze({
      zh:level(works,'market')>=3?'夜市开起来以后，东门天不亮就有人讨价还价。':'东门的车辙越来越深，说明商队终于不再只是路过。',
      en:level(works,'market')>=3?'Since the night market opened, bargaining starts at the east gate before dawn.':'The wagon ruts at the east gate are getting deeper. Caravans finally stop here instead of merely passing through.',
    }));
    if(level(works,'tavern')>0) pool.push(Object.freeze({
      zh:level(works,'tavern')>=3?'远征者长桌每晚都有人给空位留一杯酒。没人问那张椅子的人还能不能回来。':'余烬酒馆开始记得谁从哪一层回来，也记得谁没有回来。',
      en:level(works,'tavern')>=3?'Every night someone leaves a drink at an empty seat on the delvers long table. Nobody asks whether its owner will return.':'The Ember Tavern has begun remembering who returned from which floor—and who did not.',
    }));
    if(level(works,'relics')>0 || archive>0) pool.push(Object.freeze({
      zh:focusActive?'遗物馆把一整块墙留给同一套失散遗物。书记说，缺的不是“更强的属性”，而是最后几段故事。':'遗物馆的孩子已经会认出几件具名遗物的轮廓，开始争论哪一件最像英雄留下的东西。',
      en:focusActive?'The Relic Hall has reserved an entire wall for one scattered set. The curator says what is missing is not “better stats,” but the last pieces of its story.':'Children at the Relic Hall can recognize several named relics by silhouette now and argue over which one looks most like something a hero would leave behind.',
    }));
    if(depth>=80) pool.push(Object.freeze({
      zh:'镇卫说最近深夜敲门的人少了，但每一次敲门，全镇都会先安静一下。',
      en:'The watch says fewer people knock at the gate after midnight now, but every knock makes the whole town go quiet first.',
    }));
    else if(last>0) pool.push(Object.freeze({
      zh:`酒馆里还在谈有人从第 ${last} 层活着回来的事。说法已经添油加醋了三遍。`,
      en:`The tavern is still talking about someone returning alive from Floor ${last}. The story has already been embellished three times.`,
    }));
    if(!pool.length) pool.push(Object.freeze({
      zh:t<=1?'镇子还小得像个补给点。大家都在等第一次真正值得记住的平安归来。':'人开始留下来，而不是补完给养就走。这里正在慢慢变成一个镇。',
      en:t<=1?'The settlement is still little more than a supply stop. Everyone is waiting for the first safe return worth remembering.':'People are starting to stay instead of leaving after resupplying. This place is slowly becoming a town.',
    }));
    const seed=(Math.floor(Number(runs)||0)*13 + depth*3 + archive*5 + t) >>> 0;
    return pool[seed%pool.length];
  }

  function residentById(id) { return RESIDENT_BY_ID[String(id || '')] || null; }
  function residentRoster({tier=1,works={}}={}) {
    const t=Math.max(1,Math.floor(Number(tier)||1));
    return Object.freeze(RESIDENTS.filter(row => {
      if(t<row.minTier) return false;
      if(row.project && level(works,row.project)<(row.minProject||1)) return false;
      return true;
    }));
  }
  function residentLine(id,{tier=1,bestDepth=0,lastReturnDepth=0,relics=0,works={},eventId=''}={}) {
    const row=residentById(id); if(!row) return null;
    const depth=Math.max(0,Math.floor(Number(bestDepth)||0));
    const last=Math.max(0,Math.floor(Number(lastReturnDepth)||0));
    switch(row.id) {
      case 'provisioner':
        if(eventId==='caravan_surplus') return Object.freeze({zh:'东门那批压仓货还没散。你要是想让市集今天重新满起来，现在就去拍板。',en:'The east-gate surplus is still waiting. If you want the market full again today, now is the time to decide.'});
        if(level(works,'market')>=2) return Object.freeze({zh:'护商队走起来以后，路上少丢一车货，镇里就多一排货架。',en:'With caravan guards on the road, every wagon that survives becomes another stocked shelf in town.'});
        return Object.freeze({zh:'我以前只在这里停半天。现在至少值得把货卸下来慢慢卖。',en:'I used to stop here for half a day. Now it is worth unloading the wagon and staying awhile.'});
      case 'apothecary':
        if(eventId==='apothecary_batch') return Object.freeze({zh:'这一锅刚好熬完。你们要是不要，我就拆成小瓶按市价慢慢卖。',en:'This batch is ready now. If the town does not take it, I will bottle it and sell it slowly at market price.'});
        return Object.freeze({zh:level(works,'market')>=3?'夜市最麻烦的不是客人，是他们总想半夜买现熬的药。':'商路一修，药材终于不用靠背篓一趟趟扛进来了。',en:level(works,'market')>=3?'The hardest part of a night market is people wanting fresh medicine at midnight.':'Since the road was repaired, herbs no longer have to arrive one basket at a time.'});
      case 'watch':
        return Object.freeze({zh:depth>=60?'最近回来的人越来越少，登记在门口的名字却越来越长。我们开始两班倒守夜了。':'镇子人一多，门就不能再像以前一样随便敞着。',en:depth>=60?'Fewer delvers return now, but the list of names at the gate keeps growing. We started double night watches.':'As the town grows, the gate cannot stay open as carelessly as it once did.'});
      case 'scout':
        if(eventId==='scout_cache') return Object.freeze({zh:'备用箱是我从旧岗哨里拖回来的。里面没宝贝，只有能让人多活几层的东西。',en:'I dragged that reserve crate out of an abandoned post. No treasure inside, just things that buy a few more floors of life.'});
        if(last>0) return Object.freeze({zh:'你从第 '+last+' 层回来后，我把那段路重新标了一遍。下次别以为旧路线还会一样。',en:'After you came back from Floor '+last+', I marked that route again. Do not assume the old path will behave the same next time.'});
        return Object.freeze({zh:'我负责把能回来的路画出来。你负责证明那些线不是白画。',en:'I draw routes people might return from. You prove the lines were worth drawing.'});
      case 'technician':
        return Object.freeze({zh:depth>=80?'深层坐标会自己漂。每次有人回来，我都要把整组参数重算一遍。':'传送门不是门，是一堆很容易把人送错地方的参数。',en:depth>=80?'Deep coordinates drift on their own. Every safe return makes me recalculate the whole set.':'The portal is not a door. It is a pile of parameters that can send you to the wrong place.'});
      case 'alchemist':
        return Object.freeze({zh:relics>=10?'馆里那些旧器物沾着的残留，比市面上最贵的试剂还有意思。':'等商路稳定些，我才能把易碎的瓶瓶罐罐运进来，不然全碎在路上。',en:relics>=10?'The residue on those old relics is more interesting than the most expensive reagent in the market.':'Once the trade road is stable, I can bring fragile glassware in without losing half of it on the way.'});
      default:
        return Object.freeze({zh:'镇上比以前热闹多了。',en:'The town is much busier than it used to be.'});
    }
  }

  function npcLine(id,{tier=1,bestDepth=0,lastReturnDepth=0,relics=0,works={},eventId=''}={}) {
    const t=Math.max(1,Math.floor(Number(tier)||1));
    const depth=Math.max(0,Math.floor(Number(bestDepth)||0));
    const last=Math.max(0,Math.floor(Number(lastReturnDepth)||0));
    switch(String(id||'')) {
      case 'smith': {
        const lvl=level(works,'smithy');
        if(eventId==='smithy_commission') return Object.freeze({zh:'那两副车轴已经打好了。钱不算多，但这说明炉子终于不只靠你一个人养着。',en:'Those two axles are finished. The pay is not much, but it means this furnace no longer survives on your expeditions alone.'});
        if(lvl>=3) return Object.freeze({zh:'主炉终于重新烧红了。现在拿来的好东西，我敢让它进火。',en:'The main furnace is red again. Bring me something worth putting into the fire.'});
        if(lvl>=1) return Object.freeze({zh:'风箱不漏气以后，锤子落下去都像准了半寸。',en:'Since the bellows stopped leaking, every hammer blow lands half an inch truer.'});
        return Object.freeze({zh:'这破风箱一天漏三次气。等镇上有闲钱，先把它救活。',en:'These bellows leak three times a day. When the town can spare the coin, save them first.'});
      }
      case 'merchant': {
        if(eventId==='caravan_surplus') return Object.freeze({zh:'那支商队今晚就走。要补货就现在决定，明早只剩车辙。',en:'That caravan leaves tonight. Decide now if you want the stock; by morning there will be only wagon tracks.'});
        const lvl=level(works,'market');
        if(lvl>=3) return Object.freeze({zh:'夜市一开，天亮前也有人来换货。现在这条路终于像条商路了。',en:'With the night market open, people trade before dawn. This road finally feels like a trade road.'});
        if(lvl>=1) return Object.freeze({zh:'路修平以后，车轴少断一根，镇上就能多留下一箱货。',en:'Every axle that survives the repaired road leaves another crate in town.'});
        return Object.freeze({zh:'东门那条路再烂下去，商队宁可绕三天也不进来。',en:'If the east road gets any worse, caravans will add three days just to avoid this place.'});
      }
      case 'innkeeper': {
        const lvl=level(works,'tavern');
        if(eventId==='long_table_pool') return Object.freeze({zh:'长桌上那份不是施舍。活着回来以后，把没用完的东西再给下一个人，就算还账。',en:'That bundle on the long table is not charity. Come back alive, pass what you did not use to the next delver, and call the debt paid.'});
        if(lvl>=2) return Object.freeze({zh:'酒窖有了，回来的人终于不用喝当天兑出来的东西。',en:'With a cellar, returning delvers no longer drink whatever was watered down that morning.'});
        if(last>0) return Object.freeze({zh:'第 '+last+' 层回来的？坐。今天有人会想听。',en:'Back from Floor '+last+'? Sit. People will want to hear it tonight.'});
        return Object.freeze({zh:'第一次回来以前，我不劝你点最贵的酒。',en:'Before your first safe return, I would not order the expensive bottle.'});
      }
      case 'records': {
        if(eventId==='relic_exhibition') return Object.freeze({zh:'这次带回来的东西值得单独开一只柜。先让镇里的人看看，他们才会明白我们为什么要扩馆。',en:'What you brought back deserves its own case. Let the town see it; then they will understand why this hall needs to grow.'});
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
    RESIDENTS,
    project,
    eventById,
    residentById,
    residentRoster,
    sanitizeLevels,
    level,
    currentEffect,
    nextUpgrade,
    canUpgrade,
    forgeDiscount,
    smithyRefinementUnlocked,
    smithyRetemperUnlocked,
    smithyMasterworkUnlocked,
    smithyMasterRetemperUnlocked,
    marketStockBonus,
    marketReadinessUnlocked,
    marketReadinessKeyTarget,
    marketRestockUnlocked,
    marketPriceDiscount,
    relicChanceBonus,
    tavernToastCap,
    tavernChoiceCount,
    eventOffer,
    eventForReturn,
    townRumor,
    residentLine,
    npcLine,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_TOWN_GROWTH_RULES_V180 = api;
})();
