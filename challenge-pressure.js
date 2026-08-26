/* Dungeon Echo challenge pressure v1.
 * Human-play follow-up: the current 1-100 route is slightly too forgiving once a build
 * stabilizes. This layer raises mistake cost without creating HP sponges or hidden pierce.
 * - Floors 1-20: unchanged.
 * - Regular monster attack ramps smoothly to +8% by floor 100.
 * - Elites receive another +3% attack pressure.
 * - Guardian/final-boss basic attack is ~5-6% higher from floor 40 onward.
 * HP, defense, loot, supplies, armor-break readability and player stats are untouched.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__DE_CHALLENGE_PRESSURE_V1) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !api.runProfile) return;

  const START_DEPTH = 20;
  const MAX_DEPTH = 100;
  const MAX_REGULAR_BONUS = 0.08;
  const ELITE_BONUS = 0.03;
  const GUARDIAN_ATK = Object.freeze({
    10:18, 20:25, 30:33, 40:42, 50:52,
    60:61, 70:72, 80:83, 90:96, 100:110,
  });

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function regularAttackMultiplier(depth, elite=false) {
    const d = clamp(Number(depth) || 1, 1, MAX_DEPTH);
    const ramp = clamp((d - START_DEPTH) / (MAX_DEPTH - START_DEPTH), 0, 1);
    return 1 + ramp * MAX_REGULAR_BONUS + (elite ? ELITE_BONUS : 0);
  }

  function patchProfile() {
    const profile = api.runProfile;
    if (!profile) return false;
    const patch = base => {
      if (!base) return;
      const depth = Number(base.depth) || (base.boss ? 100 : 10);
      if (GUARDIAN_ATK[depth]) base.atk = GUARDIAN_ATK[depth];
    };
    patch(profile.midBoss);
    for (const g of profile.midBosses || []) patch(g);
    if (profile.boss) { profile.boss.depth = profile.boss.depth || 100; patch(profile.boss); }
    return true;
  }

  function tuneGuardian(m, depth) {
    if (!m || (!m.midBoss && !m.boss) || m.__deChallengeGuardianV1) return false;
    const target = GUARDIAN_ATK[m.boss ? 100 : depth];
    if (!target) return false;
    m.atk = target;
    m.atkOrigin = target;
    m.__deChallengeGuardianV1 = true;
    return true;
  }

  function tuneRegular(m, depth) {
    if (!m || m.midBoss || m.boss || m.__deChallengeRegularV1) return false;
    const mult = regularAttackMultiplier(depth, !!m.elite);
    if (mult <= 1.0001) {
      m.__deChallengeRegularV1 = true;
      return false;
    }
    const atk = Math.max(1, Number(m.atk) || 1);
    const origin = Math.max(1, Number(m.atkOrigin) || atk);
    m.atk = Math.max(1, Math.round(atk * mult));
    m.atkOrigin = Math.max(1, Math.round(origin * mult));
    m.__deChallengeRegularV1 = true;
    return true;
  }

  function sync() {
    if (api.state !== 'playing') return 0;
    const depth = Math.max(1, Number(api.depth) || 1);
    let changed = 0;
    for (const m of api.monsters || []) {
      if (!m || Number(m.hp) <= 0) continue;
      if (m.midBoss || m.boss) changed += tuneGuardian(m, depth) ? 1 : 0;
      else changed += tuneRegular(m, depth) ? 1 : 0;
    }
    return changed;
  }

  patchProfile();
  sync();
  const timer = setInterval(sync, 120);
  window.addEventListener('beforeunload', () => clearInterval(timer), { once:true });

  window.__DE_CHALLENGE_PRESSURE_V1 = {
    version:'v1',
    regularAttackMultiplier,
    guardianAtk:{...GUARDIAN_ATK},
    patchProfile,
    sync,
  };
})();
