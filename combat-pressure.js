/* Dungeon Echo human-pressure balance v2.
 * Re-aligns monster/guardian pressure with real 1-100 equipment growth.
 * Philosophy: no hidden random pierce. High armor remains valuable, but dangerous enemies
 * gain the existing one-turn telegraphed armor-break attack so standing still is not immunity.
 * Supply pressure is deliberately mild: floors still roll 1-2 potions, but are no longer
 * force-filled to two and kill drops stop turning deep monster packs into potion farms.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__DE_HUMAN_PRESSURE_V2) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !api.runProfile) return;

  const profile = api.runProfile;
  const SUPPLY_POLICY = Object.freeze({ minPotions: 1, killPotionThreshold: 0.67 });
  const GUARDIAN_TARGETS = Object.freeze({
    10:  { hp: 140,  atk: 18,  def: 6 },
    20:  { hp: 220,  atk: 25,  def: 9 },
    30:  { hp: 320,  atk: 32,  def: 11 },
    40:  { hp: 440,  atk: 40,  def: 14 },
    50:  { hp: 580,  atk: 49,  def: 17 },
    60:  { hp: 740,  atk: 58,  def: 20 },
    70:  { hp: 920,  atk: 68,  def: 23 },
    80:  { hp: 1140, atk: 79,  def: 26 },
    90:  { hp: 1400, atk: 91,  def: 30 },
    100: { hp: 2200, atk: 104, def: 34 },
  });

  function applyTarget(base, depth) {
    const target = GUARDIAN_TARGETS[depth];
    if (!base || !target) return false;
    base.hp = target.hp;
    base.atk = target.atk;
    base.def = target.def;
    base.armorBreak = true;
    return true;
  }

  function heavyBreakCandidate(base) {
    if (!base || typeof base !== 'object') return false;
    const min = Math.max(0, Number(base.min) || 0);
    if (min >= 50 && (base.slow || base.sprite === 'dragonkin' || base.sprite === 'golem')) return true;
    if (min >= 70 && Number(base.ranged) >= 2) return true;
    if (min >= 84 && (base.boom || base.enrage)) return true;
    return false;
  }

  function patchSupply(fr) {
    if (!fr) return false;
    fr.minPotions = SUPPLY_POLICY.minPotions;
    const drops = fr.killLoot;
    if (drops && Number(drops.gold) < SUPPLY_POLICY.killPotionThreshold &&
        SUPPLY_POLICY.killPotionThreshold < Number(drops.equip)) {
      drops.potion = SUPPLY_POLICY.killPotionThreshold;
    }
    return true;
  }

  function patchProfile() {
    const fr = profile.floorRules;
    if (fr) {
      fr.depthScaleMax = 0.50;
      fr.eliteChance = 0.16;
      fr.eliteHpMult = 2.20;
      fr.eliteAtkMult = 1.45;
      patchSupply(fr);
    }
    if (profile.midBoss) applyTarget(profile.midBoss, 10);
    for (const g of profile.midBosses || []) applyTarget(g, Number(g && g.depth));
    if (profile.boss) applyTarget(profile.boss, 100);
    for (const base of profile.monsters || []) {
      if (heavyBreakCandidate(base)) base.armorBreak = true;
    }
  }

  function runtimeTarget(m, depth) {
    if (!m) return null;
    if (m.boss && depth === 100) return GUARDIAN_TARGETS[100];
    if (m.midBoss) return GUARDIAN_TARGETS[depth] || null;
    return null;
  }

  function retuneGuardian(m, depth) {
    const target = runtimeTarget(m, depth);
    if (!target || m.__deHumanPressureV2) return false;
    const oldMax = Math.max(1, Number(m.maxHp) || Number(m.hp) || 1);
    const ratio = Math.max(0, Math.min(1, (Number(m.hp) || 0) / oldMax));
    m.maxHp = target.hp;
    m.hp = Math.max(1, Math.min(target.hp, Math.round(target.hp * ratio)));
    m.atk = target.atk;
    m.atkOrigin = target.atk;
    m.def = target.def;
    m.armorBreak = true;
    m.__deHumanPressureV2 = true;
    return true;
  }

  function syncExisting() {
    if (api.state !== 'playing') return 0;
    const depth = Math.max(1, Number(api.depth) || 1);
    let changed = 0;
    for (const m of api.monsters || []) {
      if (!m || Number(m.hp) <= 0) continue;
      if (retuneGuardian(m, depth)) changed++;
      if (m.midBoss || m.boss) {
        m.armorBreak = true;
      } else if (depth >= 30 && m.elite) {
        if (!m.armorBreak) changed++;
        m.armorBreak = true;
      } else if (heavyBreakCandidate(m)) {
        if (!m.armorBreak) changed++;
        m.armorBreak = true;
      }
    }
    return changed;
  }

  patchProfile();
  syncExisting();
  const timer = setInterval(syncExisting, 250);
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
  }

  window.__DE_HUMAN_PRESSURE_V2 = {
    version: 'v2',
    guardianTargets: GUARDIAN_TARGETS,
    heavyBreakCandidate,
    patchProfile,
    patchSupply,
    syncExisting,
  };
  window.__DE_SUSTAIN_PRESSURE_V1 = {
    version: 'v1',
    supplyPolicy: { ...SUPPLY_POLICY },
    patchSupply,
  };
})();
