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
      zhDesc:'精英出现率 +8%，击杀精英获得额外金币；赏金每深入一段（10 层）继续提高。', enDesc:'Elite chance +8%; elite kills pay bonus Gold that grows every 10-floor segment.',
    }),
    Object.freeze({
      id:'relic', unlockTier:2,
      zh:'遗物搜掠契约', en:'Relic Sweep',
      zhDesc:'宝箱、异常回响与具名遗物更常见，但每层多 1 个陷阱；越深遗物越多、陷阱也越多。', enDesc:'More chests, echo events and named relics, but +1 trap per floor; deeper segments raise both relic odds and trap counts.',
    }),
    Object.freeze({
      id:'oath', unlockTier:2,
      zh:'老兵深潜誓约', en:'Veteran Oath',
      zhDesc:'普通敌人攻击 +12%，经验 +18%；每深入一段（10 层）二者继续同步攀升。', enDesc:'Normal enemies deal +12% ATK and grant +18% XP; both keep climbing every 10-floor segment.',
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

  /* Depth-segment escalation policy (v1.9.1).
   * Contracts stop being flat one-time picks: every 10-floor segment raises both
   * the risk and the reward of the chosen contract, so "push one segment deeper
   * or bank the haul now" becomes a live per-segment decision. Core composes these
   * pure escalations on top of the flat role modifiers above; it still owns all
   * RNG consumption, combat execution and state.
   */
  const ESCALATION_STEP_FLOORS = 10;
  const ESCALATION_MAX_STEP = 9;

  function escalationStep(depth) {
    const d = positiveInt(depth);
    return clamp(Math.floor((d - 1) / ESCALATION_STEP_FLOORS), 0, ESCALATION_MAX_STEP);
  }

  function contractEscalates(contractId) {
    return normalizeContractId(contractId) !== 'none';
  }

  function monsterAtkEscalation(contractId, depth) {
    if (normalizeContractId(contractId) !== 'oath') return 1;
    return Number((1 + 0.02 * escalationStep(depth)).toFixed(4));
  }

  function monsterXpEscalation(contractId, depth) {
    if (normalizeContractId(contractId) !== 'oath') return 1;
    return Number((1 + 0.025 * escalationStep(depth)).toFixed(4));
  }

  function trapEscalation(contractId, depth) {
    if (normalizeContractId(contractId) !== 'relic') return 0;
    return Math.floor(escalationStep(depth) / 3);
  }

  function namedRelicEscalation(contractId, depth) {
    if (normalizeContractId(contractId) !== 'relic') return 0;
    return Number((0.015 * escalationStep(depth)).toFixed(4));
  }

  function eliteBountyEscalation(depth, contractId) {
    if (normalizeContractId(contractId) !== 'hunt') return 0;
    return 3 * escalationStep(depth);
  }

  function escalationEffects(contractId, depth) {
    const id = normalizeContractId(contractId);
    return Object.freeze({
      contractId: id,
      step: escalationStep(depth),
      monsterAtkMultiplier: monsterAtkEscalation(id, depth),
      monsterXpMultiplier: monsterXpEscalation(id, depth),
      trapBonus: trapEscalation(id, depth),
      namedRelicChanceBonus: namedRelicEscalation(id, depth),
      eliteBountyBonus: eliteBountyEscalation(depth, id),
    });
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
    ESCALATION_STEP_FLOORS,
    ESCALATION_MAX_STEP,
    escalationStep,
    contractEscalates,
    monsterAtkEscalation,
    monsterXpEscalation,
    trapEscalation,
    namedRelicEscalation,
    eliteBountyEscalation,
    escalationEffects,
    eliteAffixPool,
    eventEligible,
    eventKinds,
    eventSpec,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_EXPEDITION_RULES_V170 = api;
})();
