/* Dungeon Echo staged combat rules v1.3.0.
 *
 * Pure deterministic combat math extracted from the canonical core and quarantined
 * defense/combat-pressure work. This library owns NO production authority yet.
 *
 * Boundary rule: combat rules calculate from caller-supplied values only. They do not
 * consume RNG, mutate actors, advance turns, emit VFX/audio, listen to input or persist.
 */
(() => {
  'use strict';

  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const nonNegative = value => Math.max(0, number(value));
  const positiveLevel = value => Math.max(1, Math.floor(number(value) || 1));

  function warriorDamageReduction(classId, level) {
    return classId === 'warrior' ? 1 + Math.floor((positiveLevel(level) - 1) / 5) : 0;
  }

  function totalDefense(equipmentDefense, flatDamageReduction, classId, level) {
    return nonNegative(equipmentDefense) + nonNegative(flatDamageReduction) +
      warriorDamageReduction(classId, level);
  }

  function criticalMultiplier(critPowerPercent=0) {
    return 1.8 + nonNegative(critPowerPercent) / 100;
  }

  function grievousHealMultiplier(grievousTurns=0) {
    return number(grievousTurns) > 0 ? 0.5 : 1;
  }

  function outgoingHitDamage({ attack=0, variance=0, targetDefense=0, multiplier=1, critical=false, critMultiplier=1.8 }={}) {
    const base = Math.max(1, number(attack) + number(variance) - nonNegative(targetDefense));
    let damage = Math.max(1, Math.round(base * Math.max(0, number(multiplier) || 1)));
    if (critical) damage = Math.max(1, Math.round(damage * Math.max(0, number(critMultiplier) || 1.8)));
    return damage;
  }

  function incomingMeleeDamage({ enemyAttack=0, variance=0, defense=0, armorBreak=false }={}) {
    const raw = number(enemyAttack) + number(variance);
    return Math.max(1, armorBreak ? raw : raw - nonNegative(defense));
  }

  function incomingRangedDamage({ enemyAttack=0, variance=0, defense=0, armorBreak=false }={}) {
    const raw = Math.round(number(enemyAttack) * 0.8) + number(variance);
    const effectiveDefense = Math.floor(nonNegative(defense) / 2);
    return Math.max(1, armorBreak ? raw : raw - effectiveDefense);
  }

  function thornsDamage(baseThorns=0, equipmentThorns=0) {
    return nonNegative(baseThorns) + nonNegative(equipmentThorns);
  }

  function killHeal(baseKillHeal=0, equipmentKillHeal=0, grievousTurns=0) {
    return Math.round((nonNegative(baseKillHeal) + nonNegative(equipmentKillHeal)) *
      grievousHealMultiplier(grievousTurns));
  }

  const api = Object.freeze({
    version: 'v1.3.0-staged',
    authority: 'none',
    sources: Object.freeze([
      'game/core/game.js',
      'archive/quarantine-v130/gameplay/combat/defense-system.js',
      'archive/quarantine-v130/gameplay/combat/combat-pressure.js',
    ]),
    warriorDamageReduction,
    totalDefense,
    criticalMultiplier,
    grievousHealMultiplier,
    outgoingHitDamage,
    incomingMeleeDamage,
    incomingRangedDamage,
    thornsDamage,
    killHeal,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_COMBAT_RULES_V130 = api;
})();
