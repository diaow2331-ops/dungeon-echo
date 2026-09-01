/* Dungeon Echo v1.7.0 pure expedition-variation policy.
 *
 * Sole deterministic authority for Greedy Expedition contracts, optional dungeon
 * event specifications and elite-affix eligibility. Core owns RNG consumption,
 * runtime state, combat execution, rewards, UI, rendering and persistence.
 */
(() => {
  'use strict';

  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, Number(value) || 0));
  const positiveInt = value => Math.max(1, Math.floor(Number(value) || 1));

  const CONTRACTS = Object.freeze([
    Object.freeze({
      id:'none', unlockTier:1,
      zh:'自由远征', en:'Free Expedition',
      zhDesc:'不附加额外风险或奖励。', enDesc:'No extra risk or reward modifier.',
    }),
    Object.freeze({
      id:'hunt', unlockTier:1,
      zh:'精英猎杀号令', en:'Elite Hunt',
      zhDesc:'精英出现率 +8%，击杀精英获得额外金币。', enDesc:'Elite chance +8%; elite kills pay bonus Gold.',
    }),
    Object.freeze({
      id:'relic', unlockTier:2,
      zh:'遗物搜掠契约', en:'Relic Sweep',
      zhDesc:'宝箱、异常回响与具名遗物更常见，但每层多 1 个陷阱。', enDesc:'More chests, echo events and named relics, but +1 trap per floor.',
    }),
    Object.freeze({
      id:'oath', unlockTier:2,
      zh:'老兵深潜誓约', en:'Veteran Oath',
      zhDesc:'普通敌人攻击 +12%，经验 +18%；适合冲击永久等级上限。', enDesc:'Normal enemies deal +12% ATK and grant +18% XP; best for pushing toward the permanent level cap.',
    }),
  ]);

  const byId = id => CONTRACTS.find(row => row.id === id) || CONTRACTS[0];

  function normalizeContractId(id) {
    return byId(String(id || 'none')).id;
  }

  function availableContracts(tier) {
    const t = clamp(Math.floor(Number(tier) || 1), 1, 10);
    return Object.freeze(CONTRACTS.filter(row => row.unlockTier <= t));
  }

  function eliteChance(baseChance, contractId) {
    return clamp((Number(baseChance) || 0) + (normalizeContractId(contractId) === 'hunt' ? 0.08 : 0), 0, 0.65);
  }

  function chestChance(baseChance, contractId) {
    return clamp((Number(baseChance) || 0) + (normalizeContractId(contractId) === 'relic' ? 0.18 : 0), 0, 0.92);
  }

  function trapBonus(contractId) {
    return normalizeContractId(contractId) === 'relic' ? 1 : 0;
  }

  function namedRelicChanceBonus(contractId) {
    return normalizeContractId(contractId) === 'relic' ? 0.16 : 0;
  }

  function eventChance(contractId) {
    return normalizeContractId(contractId) === 'relic' ? 0.34 : 0.22;
  }

  function monsterAtkMultiplier(contractId) {
    return normalizeContractId(contractId) === 'oath' ? 1.12 : 1;
  }

  function monsterXpMultiplier(contractId) {
    return normalizeContractId(contractId) === 'oath' ? 1.18 : 1;
  }

  function eliteBounty(depth, contractId) {
    if (normalizeContractId(contractId) !== 'hunt') return 0;
    return 8 + positiveInt(depth);
  }

  function eliteAffixPool(depth, baseTraits=[]) {
    const d = positiveInt(depth);
    const existing = new Set(Array.isArray(baseTraits) ? baseTraits : []);
    const pool = [];
    if (!existing.has('enrage')) pool.push('enrage');
    if (d >= 10 && !existing.has('leech')) pool.push('leech');
    if (d >= 20 && !existing.has('boom')) pool.push('boom');
    return Object.freeze(pool);
  }

  function eventEligible(depth, maxDepth, echoMode=false) {
    const d = positiveInt(depth);
    const max = positiveInt(maxDepth);
    if (!echoMode && d >= max) return false;
    if (!echoMode && d % 10 === 0) return false;
    return d >= 3;
  }

  function eventKinds(depth) {
    const d = positiveInt(depth);
    const kinds = ['blood-offering', 'cursed-cache'];
    if (d >= 6) kinds.push('echo-trial');
    return Object.freeze(kinds);
  }

  function eventSpec(kind, depth) {
    const d = positiveInt(depth);
    switch (kind) {
      case 'blood-offering':
        return Object.freeze({ kind, hpRatio:0.18, minRarity:2 });
      case 'echo-trial':
        return Object.freeze({ kind, eliteCount:2, rewardGold:25 + d * 4 });
      case 'cursed-cache':
      default:
        return Object.freeze({ kind:'cursed-cache', potionCost:1, fallbackHpRatio:0.10, rewardGold:18 + d * 3 });
    }
  }

  const api = Object.freeze({
    version:'v1.7.0-production',
    authority:'expedition-variation-policy',
    sources:Object.freeze(['game/core/game.js']),
    CONTRACTS,
    normalizeContractId,
    availableContracts,
    eliteChance,
    chestChance,
    trapBonus,
    namedRelicChanceBonus,
    eventChance,
    monsterAtkMultiplier,
    monsterXpMultiplier,
    eliteBounty,
    eliteAffixPool,
    eventEligible,
    eventKinds,
    eventSpec,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_EXPEDITION_RULES_V170 = api;
})();
