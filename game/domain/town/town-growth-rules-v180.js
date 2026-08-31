/* Dungeon Echo v1.8.0 pure town-growth policy.
 *
 * Sole deterministic authority for persistent town project definitions,
 * upgrade requirements and bounded project effects.
 * Core owns gold mutation, persistence, market refresh, UI and rendering.
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
        Object.freeze({ tier:9, cost:820, zh:'设立远征者长桌', en:'Build the Delvers’ Long Table', effectZh:'角色祝酒上限 +3', effectEn:'Character toast cap +3' }),
      ]),
    }),
  ]);

  const BY_ID = Object.freeze(Object.fromEntries(PROJECTS.map(row => [row.id,row])));

  function project(id) { return BY_ID[String(id || '')] || null; }
  function sanitizeLevels(raw) {
    const out = {};
    for (const row of PROJECTS) {
      const level = raw && Number.isFinite(Number(raw[row.id])) ? Math.floor(Number(raw[row.id])) : 0;
      out[row.id] = Math.max(0, Math.min(row.levels.length, level));
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

  const api = Object.freeze({
    version:'v1.8.0-development',
    authority:'town-growth-policy',
    PROJECTS,
    project,
    sanitizeLevels,
    level,
    currentEffect,
    nextUpgrade,
    canUpgrade,
    forgeDiscount,
    marketStockBonus,
    relicChanceBonus,
    tavernToastCap,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_TOWN_GROWTH_RULES_V180 = api;
})();
