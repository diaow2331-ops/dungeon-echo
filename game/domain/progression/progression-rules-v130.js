/* Dungeon Echo production level-up-arithmetic authority v1.3.0.
 *
 * Sole production authority for canonical XP thresholds, per-level HP/ATK/heal deltas,
 * talent-due classification and the permanent level-cap calculation. Snapshot clamping,
 * next-talent metadata and skill-evolution milestones remain dormant pure exports.
 *
 * Boundary rule: no XP/player/meta mutation, talent-screen control, input, DOM or storage.
 */
(() => {
  'use strict';

  const XP_PER_LEVEL = 15;
  const LEVEL_HP_GAIN = 6;
  const LEVEL_ATK_GAIN = 1;
  const LEVEL_HEAL_GAIN = 8;
  const TALENT_EVERY_LEVELS = 3;

  const DEFAULT_LEVEL_CAP = 50;
  const HP_HEADROOM = 160;
  const ATK_HEADROOM = 24;
  const SKILL_EVOLUTION_MILESTONES = Object.freeze([20, 40, 60, 80]);

  const nonNegativeInt = value => Math.max(0, Math.floor(Number(value) || 0));
  const positiveLevel = value => Math.max(1, Math.floor(Number(value) || 1));

  function xpThreshold(level) {
    return positiveLevel(level) * XP_PER_LEVEL;
  }

  function levelUpDelta() {
    return Object.freeze({
      hpBase: LEVEL_HP_GAIN,
      atkBase: LEVEL_ATK_GAIN,
      immediateHeal: LEVEL_HEAL_GAIN,
    });
  }

  function talentDue(level) {
    const lvl = positiveLevel(level);
    return lvl > 1 && lvl % TALENT_EVERY_LEVELS === 0;
  }

  function nextTalentLevel(level) {
    const lvl = positiveLevel(level);
    const rem = lvl % TALENT_EVERY_LEVELS;
    return rem === 0 ? lvl + TALENT_EVERY_LEVELS : lvl + (TALENT_EVERY_LEVELS - rem);
  }

  function progressionCaps(classBase, level, legacy={}) {
    const lvl = positiveLevel(level);
    const baseHp = Math.max(1, Number(classBase && classBase.hpBase) || 1);
    const baseAtk = Math.max(0, Number(classBase && classBase.atkBase) || 0);
    const legacyLvl = positiveLevel(legacy.legacyLvl || 1);
    const legacyHp = Math.max(1, Number(legacy.legacyHp) || 1);
    const legacyAtk = Math.max(0, Number(legacy.legacyAtk) || 0);

    return Object.freeze({
      level: Math.max(DEFAULT_LEVEL_CAP, legacyLvl),
      hp: Math.max(legacyHp, baseHp + (lvl - 1) * LEVEL_HP_GAIN + HP_HEADROOM),
      atk: Math.max(legacyAtk, baseAtk + (lvl - 1) * LEVEL_ATK_GAIN + ATK_HEADROOM),
    });
  }

  function clampGrowthSnapshot(snapshot, classBase, legacy={}) {
    const src = snapshot && typeof snapshot === 'object' ? snapshot : {};
    let level = positiveLevel(src.lvl);
    let hpBase = Math.max(1, Number(src.hpBase) || 1);
    let atkBase = Math.max(0, Number(src.atkBase) || 0);
    let xp = nonNegativeInt(src.xp);
    let changed = false;

    let caps = progressionCaps(classBase, level, legacy);
    if (level > caps.level) {
      const excess = level - caps.level;
      hpBase = Math.max(1, hpBase - excess * LEVEL_HP_GAIN);
      atkBase = Math.max(0, atkBase - excess * LEVEL_ATK_GAIN);
      level = caps.level;
      changed = true;
      caps = progressionCaps(classBase, level, legacy);
    }

    if (hpBase > caps.hp) { hpBase = caps.hp; changed = true; }
    if (atkBase > caps.atk) { atkBase = caps.atk; changed = true; }

    if (level >= caps.level) {
      const xpCap = xpThreshold(caps.level) - 1;
      if (xp > xpCap) { xp = xpCap; changed = true; }
    }

    return Object.freeze({ level, hpBase, atkBase, xp, changed, caps });
  }

  function reachedEvolutionMilestones(level) {
    const lvl = positiveLevel(level);
    return Object.freeze(SKILL_EVOLUTION_MILESTONES.filter(m => lvl >= m));
  }

  function nextEvolutionMilestone(level) {
    const lvl = positiveLevel(level);
    return SKILL_EVOLUTION_MILESTONES.find(m => m > lvl) || null;
  }

  const api = Object.freeze({
    version: 'v1.3.0-production',
    authority: 'level-up-arithmetic',
    sources: Object.freeze(['game/core/game.js']),
    XP_PER_LEVEL,
    LEVEL_HP_GAIN,
    LEVEL_ATK_GAIN,
    LEVEL_HEAL_GAIN,
    TALENT_EVERY_LEVELS,
    DEFAULT_LEVEL_CAP,
    HP_HEADROOM,
    ATK_HEADROOM,
    SKILL_EVOLUTION_MILESTONES,
    xpThreshold,
    levelUpDelta,
    talentDue,
    nextTalentLevel,
    progressionCaps,
    clampGrowthSnapshot,
    reachedEvolutionMilestones,
    nextEvolutionMilestone,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_PROGRESSION_RULES_V130 = api;
})();
