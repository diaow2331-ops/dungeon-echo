/* Dungeon Echo production gameplay tuning.
 * Public route policy + human-play class balance only. Equipment/town/commerce/forge/progression/content own modules.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_GAMEPLAY_TUNING) return;

  const api = window.DE_TEST;
  if (!api || !api.CLASSES) return;
  window.__DE_GAMEPLAY_TUNING = 'prod-v8';

  if (api.profileId !== 'classic-100') {
    throw new Error('生产入口必须使用 classic-100 Profile。');
  }

  // Public expedition must discover 1→100 in order. The old paid unseen-floor skip is
  // removed; town-system replaces it with checkpoints unlocked only after guardians.
  document.querySelectorAll('[data-act="quickdive"],#quickdive-fab').forEach(el => el.remove());
  document.addEventListener('keydown', e => {
    if (String(e.key || '').toLowerCase() !== 'j') return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  function loadProductionModule(src, marker) {
    if (document.querySelector(`script[${marker}]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.setAttribute(marker, '1');
    document.head.appendChild(s);
  }
  if (!window.__DE_TOWN_SYSTEM) loadProductionModule('town-system.js', 'data-de-town-system');
  if (!window.__DE_COMMERCE_SYSTEM) loadProductionModule('commerce-system.js', 'data-de-commerce-system');
  if (!window.__DE_FORGE_SYSTEM) loadProductionModule('forge-system.js', 'data-de-forge-system');
  if (!window.__DE_PROGRESSION_SYSTEM) loadProductionModule('progression-system.js', 'data-de-progression-system');
  if (!window.__DE_CONTENT_SYSTEM) loadProductionModule('content-system.js', 'data-de-content-system');

  if (window.__DE_BALANCE_PATCH) return;
  const C = api.CLASSES;

  if (C.warrior) {
    C.warrior.hpBase = 40;
    C.warrior.blurb = '厚血近战。坚甲提供稳定容错；横扫冷却较短，正面推进和控场最可靠。';
    if (C.warrior.skill) C.warrior.skill.cd = 5;
  }
  if (C.ranger) {
    C.ranger.rangedRange = 4;
    C.ranger.blurb = '机动弓手。直线 4 格远射；灵巧闪避近战，疾步用于风筝、穿阵与脱离。';
  }
  if (C.mage) {
    C.mage.rangedRange = 3;
    C.mage.blurb = '脆弱炮台。直线 3 格奥术射击维持距离；奥术弹跨角度点杀高防目标并击退。';
  }
  if (C.assassin) {
    C.assassin.hpBase = 26;
    C.assassin.blurb = '高爆发游猎者。天生暴击 +10%；影袭瞬移斩首，但技能真空期较长，失位代价高。';
    if (C.assassin.skill) C.assassin.skill.cd = 7;
  }

  // Safe migration for untouched old greedy bases. Exact base values only: a player who
  // already gained permanent HP from shrines/talents is not altered retroactively.
  const migrateTimer = setInterval(() => {
    const m = api.meta;
    if (!m) return;
    if (m.classId === 'warrior' && m.hpBase === 38) m.hpBase = 40;
    if (m.classId === 'assassin' && m.hpBase === 24) m.hpBase = 26;
  }, 500);
  window.addEventListener('beforeunload', () => clearInterval(migrateTimer), { once: true });

  window.__DE_BALANCE_PATCH = 'human-v1';
})();