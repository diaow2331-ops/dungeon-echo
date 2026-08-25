/* Dungeon Echo production equipment system v2.
 * Owns class-fit valuation, class-facing affix identity, deep rarity curve and the
 * 8→100 progression bridge for helmet/boots/amulet. Existing saved item stats are
 * never retroactively inflated; only newly generated production loot receives the
 * deep-slot base bonus.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__DE_EQUIPMENT_SYSTEM) return;

  const api = window.DE_TEST;
  if (!api || !api.runProfile || !api.CLASSES) return;
  if (api.profileId !== 'classic-100') throw new Error('生产装备系统仅支持 classic-100。');
  window.__DE_EQUIPMENT_SYSTEM = 'v2';

  const profile = api.runProfile;
  const currentClass = () => api.classId || (api.meta && api.meta.classId) || 'warrior';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---------- Class identity ----------
  // DEF affinity is deliberately conservative. The current core still has a random
  // anti-armor pierce rule, so production builds are steered toward HP/recovery/utility
  // until that combat rule is replaced by telegraphed armor-break behavior.
  const AFFINITY = {
    warrior:  { atk: 1.00, def: 0.65, hp: 1.26, crit: 0.82, leech: 1.08, gold: 0.90, thorns: 1.34, regen: 1.24 },
    ranger:   { atk: 1.12, def: 0.75, hp: 0.96, crit: 1.24, leech: 1.08, gold: 1.02, thorns: 0.70, regen: 1.02 },
    mage:     { atk: 1.18, def: 0.68, hp: 0.94, crit: 1.14, leech: 1.02, gold: 0.96, thorns: 0.58, regen: 1.12 },
    assassin: { atk: 1.18, def: 0.62, hp: 0.94, crit: 1.34, leech: 1.18, gold: 0.94, thorns: 0.54, regen: 0.96 },
  };

  const FIT_WEIGHT = {
    warrior:  { atk: 3.00, def: 1.70, hp: .90, crit: 1.00, leech: 1.60, gold: .10, thorns: 2.55, regen: 1.90 },
    ranger:   { atk: 3.30, def: 1.50, hp: .62, crit: 2.05, leech: 1.45, gold: .14, thorns: .70, regen: 1.15 },
    mage:     { atk: 3.60, def: 1.30, hp: .66, crit: 1.85, leech: 1.30, gold: .12, thorns: .50, regen: 1.30 },
    assassin: { atk: 3.50, def: 1.20, hp: .62, crit: 2.35, leech: 1.75, gold: .11, thorns: .45, regen: 1.00 },
  };

  function classFitScore(stats, classId = currentClass()) {
    const w = FIT_WEIGHT[classId] || FIT_WEIGHT.warrior;
    const s = stats || {};
    let total = 0;
    for (const [k, mul] of Object.entries(w)) total += (Number(s[k]) || 0) * mul;
    return Math.max(0, Math.round(total));
  }
  window.DE_EQUIP_FIT_SCORE = classFitScore;

  const MIN_GROW_DIV = { atk: 6, def: 10, thorns: 8, regen: 8 };
  const scaleRange = (src, mult, kind) => {
    const out = { ...src };
    const positiveFloor = v => (v > 0 ? 1 : 0);
    if (src.lo !== undefined) out.lo = Math.max(positiveFloor(src.lo), Math.round(src.lo * mult));
    if (src.hi !== undefined) out.hi = Math.max(out.lo || 0, Math.round(src.hi * mult));
    if (src.hiGrow !== undefined) out.hiGrow = Math.max(out.lo || 0, Math.round(src.hiGrow * mult));
    if (src.growDiv !== undefined) {
      const scaled = Math.max(2, Math.round(src.growDiv / Math.max(.55, mult)));
      out.growDiv = Math.max(MIN_GROW_DIV[kind] || 2, scaled);
    }
    return out;
  };

  // Profile is shallow-frozen; nested tables are shared with game.js and can be tuned
  // before future loot generation without rewriting old saved item stats.
  const AR = profile.affixRanges;
  if (AR && !AR.__deDoctrine) {
    const originals = {};
    for (const k of ['atk', 'def', 'hp', 'crit', 'leech', 'gold', 'thorns', 'regen']) {
      if (AR[k]) originals[k] = { ...AR[k] };
    }
    try { Object.defineProperty(AR, '__deDoctrine', { value: true, enumerable: false }); }
    catch (e) { AR.__deDoctrine = true; }
    for (const [k, src] of Object.entries(originals)) {
      try {
        Object.defineProperty(AR, k, {
          enumerable: true,
          configurable: true,
          get() {
            const affinity = AFFINITY[currentClass()] || AFFINITY.warrior;
            return scaleRange(src, affinity[k] || 1, k);
          },
        });
      } catch (e) { /* frozen custom data: retain original range */ }
    }
  }

  // Weapon identity: assassin/ranger/mage trade some raw durability for precision.
  for (const b of profile.weaponBases || []) {
    if (!b || b.__deWeaponDoctrine) continue;
    try { Object.defineProperty(b, '__deWeaponDoctrine', { value: true, enumerable: false }); }
    catch (e) { continue; }
    if (b.crit === undefined) {
      if (b.cls === 'assassin') b.crit = 2 + Math.floor((b.min || 1) / 7);
      else if (b.cls === 'ranger') b.crit = 1 + Math.floor((b.min || 1) / 9);
      else if (b.cls === 'mage') b.crit = 1 + Math.floor((b.min || 1) / 12);
    }
  }

  // Armor gets HP as a second survival axis. This deliberately reduces the incentive
  // for warrior to solve every problem by stacking DEF into the anti-armor pierce wall.
  for (const b of profile.armorBases || []) {
    if (!b || b.__deArmorDoctrine || b.hp !== undefined) continue;
    try {
      Object.defineProperty(b, '__deArmorDoctrine', { value: true, enumerable: false });
      Object.defineProperty(b, 'hp', {
        enumerable: true,
        configurable: true,
        get() {
          const f = currentClass() === 'warrior' ? 2.2 : currentClass() === 'ranger' ? 1.35 :
            currentClass() === 'assassin' ? 1.15 : 0.95;
          return Math.max(1, Math.round((b.def || 1) * f));
        },
      });
    } catch (e) { /* retain custom base */ }
  }

  // Rings are a flexible damage/survival slot rather than a second plain HP bar.
  for (const b of profile.ringBases || []) {
    if (!b || b.__deRingDoctrine || b.crit !== undefined) continue;
    try {
      Object.defineProperty(b, '__deRingDoctrine', { value: true, enumerable: false });
      Object.defineProperty(b, 'crit', {
        enumerable: true,
        configurable: true,
        get() {
          if (currentClass() === 'warrior') return 0;
          const v = 1 + Math.floor((b.min || 1) / 8);
          return currentClass() === 'assassin' ? v + 1 : v;
        },
      });
    } catch (e) { /* retain custom base */ }
  }

  // ---------- Deep loot quality ----------
  // Floor 1 stays near 50/27/14/7/2. Floor 100 trends to 26/30/22/14/8.
  const rarityTargets = [26, 30, 22, 14, 8];
  (profile.rarities || []).forEach((r, i) => {
    if (!r || r.__deDepthWeight || typeof r.w !== 'number') return;
    const base = r.w;
    try {
      Object.defineProperty(r, '__deDepthWeight', { value: true, enumerable: false });
      Object.defineProperty(r, 'w', {
        enumerable: true,
        configurable: true,
        get() {
          const d = clamp(Number(api.depth) || 1, 1, 100);
          const t = (d - 1) / 99;
          const target = rarityTargets[i] === undefined ? base : rarityTargets[i];
          return Math.max(.1, base + (target - base) * t);
        },
      });
    } catch (e) { /* retain fixed weight */ }
  });

  // ---------- Accessory progression bridge ----------
  // game.js currently owns only 4 static bases for these slots and stops at min=7.
  // New production loot receives an additive depth budget at the same major breakpoints
  // used by weapon/armor/ring. Defense growth stays intentionally shallow; most late
  // survivability comes from HP/recovery so current random pierce cannot dominate builds.
  const DEEP_THRESHOLDS = [14, 22, 32, 44, 58, 74, 92];
  const SLOT_BONUS = {
    helmet: [
      { hp: 6 }, { hp: 10, regen: 1 }, { hp: 16, regen: 1 },
      { hp: 24, regen: 2 }, { hp: 34, regen: 2 }, { hp: 46, regen: 3 }, { hp: 60, regen: 4 },
    ],
    boots: [
      { hp: 8 }, { hp: 14 }, { def: 1, hp: 22 },
      { def: 1, hp: 32 }, { def: 2, hp: 44 }, { def: 3, hp: 58 }, { def: 4, hp: 76 },
    ],
    amulet: [
      { hp: 6, crit: 1 }, { hp: 12, crit: 2 }, { hp: 20, crit: 3 },
      { hp: 30, crit: 5 }, { hp: 42, crit: 7 }, { hp: 56, crit: 9 }, { hp: 72, crit: 10 },
    ],
  };

  function depthBonus(slot, d) {
    const rows = SLOT_BONUS[slot];
    if (!rows) return null;
    let idx = -1;
    for (let i = 0; i < DEEP_THRESHOLDS.length; i++) if (d >= DEEP_THRESHOLDS[i]) idx = i;
    return idx >= 0 ? { ...rows[idx] } : null;
  }

  function mergeAffixLabels(it) {
    if (!Array.isArray(it.affixes) || it.affixes.length < 2) return;
    const order = [];
    const sums = Object.create(null);
    for (const a of it.affixes) {
      if (!a || typeof a.k !== 'string') continue;
      if (!(a.k in sums)) order.push(a.k);
      sums[a.k] = (sums[a.k] || 0) + (Number(a.v) || 0);
    }
    if (order.length < it.affixes.length) it.affixes = order.map(k => ({ k, v: sums[k] }));
  }

  function scoreOnly(it) {
    if (!it || typeof it !== 'object' || !it.stats) return;
    mergeAffixLabels(it);
    const score = classFitScore(it.stats);
    it.fitScore = score;
    it.score = score;
  }

  function prepareFreshItem(it, d) {
    if (!it || typeof it !== 'object' || !it.stats) return;
    if (!it.deEquipVersion) {
      const bonus = depthBonus(it.slot, d);
      if (bonus) {
        for (const [k, v] of Object.entries(bonus)) it.stats[k] = (Number(it.stats[k]) || 0) + v;
        it.depthBonus = bonus;
      }
      it.originDepth = d;
      it.deEquipVersion = 2;
    }
    scoreOnly(it);
  }

  // Track player object replacement so restored/legacy bags are valued but never
  // retroactively granted deep-slot stats. Items that appear later in the same player
  // object (e.g. chest rewards) are known to be fresh current-run loot.
  let lastPlayer = null;
  let knownPlayerItems = new WeakSet();

  function markExistingPlayer(p) {
    knownPlayerItems = new WeakSet();
    const existing = [];
    (p && p.inv || []).forEach(it => existing.push(it));
    Object.values(p && p.equip || {}).forEach(it => { if (it) existing.push(it); });
    for (const it of existing) {
      if (!it || typeof it !== 'object') continue;
      knownPlayerItems.add(it);
      scoreOnly(it);
    }
  }

  function syncEquipment() {
    const d = clamp(Number(api.depth) || 1, 1, 100);
    const p = api.player;
    if (p !== lastPlayer) {
      lastPlayer = p;
      markExistingPlayer(p);
    }

    // Floor loot is always fresh generation.
    (api.items || []).forEach(row => {
      if (row && row.type === 'equip' && row.item) prepareFreshItem(row.item, d);
    });

    // Shop equipment is also generated on the current floor.
    const stock = typeof api.getShopStock === 'function' ? api.getShopStock() : [];
    (stock || []).forEach(row => {
      if (!row || row.kind !== 'equip' || !row.item) return;
      prepareFreshItem(row.item, d);
      if (!row.__deFitPrice) {
        const mult = (profile.shop && profile.shop.equipMult) || 3;
        row.price = Math.max(18, row.item.score * mult);
        try { Object.defineProperty(row, '__deFitPrice', { value: true, enumerable: false }); }
        catch (e) { row.__deFitPrice = true; }
      }
    });

    // New objects appearing in the same player instance are fresh chest/direct rewards.
    if (p) {
      const current = [];
      (p.inv || []).forEach(it => current.push(it));
      Object.values(p.equip || {}).forEach(it => { if (it) current.push(it); });
      for (const it of current) {
        if (!it || typeof it !== 'object') continue;
        if (!knownPlayerItems.has(it)) {
          knownPlayerItems.add(it);
          prepareFreshItem(it, d);
        } else scoreOnly(it);
      }
    }

    // Town data may contain JSON copies. Tagged production items retain their bonus;
    // untagged legacy items receive score-only migration.
    const m = api.meta;
    if (m) {
      const townItems = [...(m.bag || []), ...(m.stash || []), ...Object.values(m.equip || {}).filter(Boolean)];
      for (const it of townItems) {
        if (it && it.deEquipVersion) prepareFreshItem(it, Number(it.originDepth) || d);
        else scoreOnly(it);
      }
    }
  }

  syncEquipment();
  const timer = setInterval(syncEquipment, 400);
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
  }
})();