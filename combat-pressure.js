/* Dungeon Echo human-pressure balance v2.
 * Re-aligns monster/guardian pressure with real 1-100 equipment growth.
 * Philosophy: no hidden random pierce. High armor remains valuable, but dangerous enemies
 * gain the existing one-turn telegraphed armor-break attack so standing still is not immunity.
 * Supply pressure is deliberately mild: floors still roll 1-2 potions, but are no longer
 * force-filled to two and kill drops stop turning deep monster packs into potion farms.
 * Late guardian telegraphs are true armor-break commitments: dodge them completely, or take
 * a hit that ignores armor while still respecting fixed mitigation.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__DE_HUMAN_PRESSURE_V2) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !api.runProfile) return;

  // Capture the untouched core combat entries now. gameplay-tuning loads later and wraps the
  // public API references used by content-system; ordinary monster AI calls lexical core funcs.
  const coreMeleeAttack = typeof api.monsterAttack === 'function' ? api.monsterAttack : null;
  const coreRangedAttack = typeof api.monsterRangedAttack === 'function' ? api.monsterRangedAttack : null;
  const BREAK_SPECIAL_DEPTHS = new Set([40, 60, 70, 80, 90, 100]);
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

  function stackText() {
    try { return String(new Error().stack || ''); } catch (e) { return ''; }
  }

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

  function isBreakingSpecialCall() {
    if (api.state !== 'playing' || !BREAK_SPECIAL_DEPTHS.has(Number(api.depth) || 0)) return false;
    return stackText().indexOf('resolveSpecial') >= 0;
  }

  function installGuardianSpecialBridge() {
    if (window.__DE_GUARDIAN_SPECIAL_PRESSURE_V1) return true;
    if (!coreMeleeAttack || !coreRangedAttack) return false;
    const tunedMelee = api.monsterAttack;
    const tunedRanged = api.monsterRangedAttack;
    if (typeof tunedMelee !== 'function' || typeof tunedRanged !== 'function') return false;
    // Wait until gameplay-tuning has replaced the public special references; otherwise we
    // would capture ourselves and create recursion on a later retry.
    if (tunedMelee === coreMeleeAttack && tunedRanged === coreRangedAttack) return false;

    api.monsterAttack = function(m, ...args) {
      if (isBreakingSpecialCall()) return coreMeleeAttack.call(this, m, true);
      return tunedMelee.call(this, m, ...args);
    };
    api.monsterRangedAttack = function(m, ...args) {
      if (isBreakingSpecialCall()) return coreRangedAttack.call(this, m, true);
      return tunedRanged.call(this, m, ...args);
    };
    window.__DE_GUARDIAN_SPECIAL_PRESSURE_V1 = {
      version: 'v1',
      depths: [...BREAK_SPECIAL_DEPTHS],
      isBreakingSpecialCall,
    };
    return true;
  }

  let breakBadge = null;
  function syncSpecialWarning() {
    const encounter = window.DE_GUARDIAN_ENCOUNTER;
    const active = encounter && encounter.active;
    const show = api.state === 'playing' && BREAK_SPECIAL_DEPTHS.has(Number(api.depth) || 0) && !!active;
    if (!show) {
      if (breakBadge) breakBadge.hidden = true;
      return false;
    }
    const stage = typeof document !== 'undefined' && document.getElementById('stage');
    if (!stage) return false;
    if (!breakBadge) {
      breakBadge = document.createElement('div');
      breakBadge.id = 'guardian-break-warning';
      breakBadge.setAttribute('aria-live', 'polite');
      breakBadge.textContent = '破甲大招 · 命中无视护甲';
      Object.assign(breakBadge.style, {
        position: 'absolute', left: '50%', top: '54px', transform: 'translateX(-50%)',
        zIndex: '6', pointerEvents: 'none', padding: '5px 9px', borderRadius: '6px',
        border: '1px solid rgba(255,116,82,.72)', background: 'rgba(34,8,7,.88)',
        color: '#ffb08d', font: '700 12px/1.35 "Segoe UI","Microsoft YaHei",sans-serif',
        boxShadow: '0 6px 18px rgba(0,0,0,.35)',
      });
      stage.appendChild(breakBadge);
    }
    breakBadge.hidden = false;
    return true;
  }

  function syncExisting() {
    installGuardianSpecialBridge();
    syncSpecialWarning();
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
  setTimeout(installGuardianSpecialBridge, 0);
  const timer = setInterval(syncExisting, 100);
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
  }

  window.__DE_HUMAN_PRESSURE_V2 = {
    version: 'v2',
    guardianTargets: GUARDIAN_TARGETS,
    heavyBreakCandidate,
    patchProfile,
    patchSupply,
    installGuardianSpecialBridge,
    syncSpecialWarning,
    syncExisting,
  };
  window.__DE_SUSTAIN_PRESSURE_V1 = {
    version: 'v1',
    supplyPolicy: { ...SUPPLY_POLICY },
    patchSupply,
  };
})();
