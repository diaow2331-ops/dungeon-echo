/* Dungeon Echo production progression v1.
 * Rebuilds the exposed talent pool between level-ups so 100-floor characters develop
 * along class routes instead of endlessly stacking the same universal stat talents.
 * No new combat buttons: this layer uses the existing talent selection flow.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__DE_PROGRESSION_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !Array.isArray(api.TALENTS)) return;
  window.__DE_PROGRESSION_SYSTEM = 'v1';

  const source = api.TALENTS.slice();
  const byId = Object.fromEntries(source.map(t => [t.id, t]));

  // Hard caps prevent 100-floor runs from degenerating into infinite flat DR/crit/haste.
  const CAP = {
    iron: 2, edge: 3, luck: 2, blood: 2, haste: 3, pack: 2, gold: 3, ward: 2,
    bramble: 3, scavenge: 3, elixir: 2, frenzy: 2, tenacity: 2, plunder: 3,
    stone: 1, echoborn: 1,
    w_bulwark: 2, w_reprise: 3, w_ravager: 3,
    r_eagle: 3, r_hunter: 3, r_tempo: 2,
    m_focus: 3, m_flow: 2, m_glass: 2,
    a_execute: 3, a_blood: 3, a_shadow: 2,
  };

  const CLASS_BASE = {
    warrior:  ['iron', 'blood', 'ward', 'bramble', 'scavenge', 'tenacity'],
    ranger:   ['edge', 'luck', 'blood', 'haste', 'scavenge', 'gold'],
    mage:     ['edge', 'luck', 'haste', 'elixir', 'frenzy', 'echoborn'],
    assassin: ['edge', 'luck', 'blood', 'haste', 'frenzy', 'scavenge'],
  };

  const classTalents = {
    warrior: [
      {
        id: 'w_bulwark', name: '不动壁垒',
        desc: '生命上限 +18、受到伤害 -1。更偏向稳定承伤，而不是继续无脑堆护甲。',
        apply: p => { p.hpBase += 18; p.flatDr = (p.flatDr || 0) + 1; p.hp += 18; },
      },
      {
        id: 'w_reprise', name: '铁血反击',
        desc: '反伤 +5、击杀回复 +2。让贴身换血转化为持续收益。',
        apply: p => { p.thornsBase = (p.thornsBase || 0) + 5; p.regenBase = (p.regenBase || 0) + 2; },
      },
      {
        id: 'w_ravager', name: '破阵者',
        desc: '基础攻击 +2、吸血 +2%。牺牲部分纯防守，强化横扫推进。',
        apply: p => { p.atkBase += 2; p.leechBase = (p.leechBase || 0) + 2; },
      },
    ],
    ranger: [
      {
        id: 'r_eagle', name: '鹰眼',
        desc: '基础攻击 +2、暴击 +4%。奖励保持射线与距离。',
        apply: p => { p.atkBase += 2; p.critBase = (p.critBase || 0) + 4; },
      },
      {
        id: 'r_hunter', name: '猎手续航',
        desc: '生命上限 +8、击杀回复 +3。适合长距离清图而非频繁喝药。',
        apply: p => { p.hpBase += 8; p.regenBase = (p.regenBase || 0) + 3; p.hp += 8; },
      },
      {
        id: 'r_tempo', name: '疾猎节奏',
        desc: '技能冷却 -1、暴击 +3%。强化疾步拉扯，但不直接增加射程。',
        apply: p => { p.skillHaste = (p.skillHaste || 0) + 1; p.critBase = (p.critBase || 0) + 3; },
      },
    ],
    mage: [
      {
        id: 'm_focus', name: '奥术聚焦',
        desc: '基础攻击 +3、暴击伤害 +10%。强化炮台爆发。',
        apply: p => { p.atkBase += 3; p.critPower = (p.critPower || 0) + 10; },
      },
      {
        id: 'm_flow', name: '回响导流',
        desc: '技能冷却 -1，并立刻获得 1 张传送卷轴。强化控制与脱离循环。',
        apply: p => { p.skillHaste = (p.skillHaste || 0) + 1; p.scrolls = (p.scrolls || 0) + 1; },
      },
      {
        id: 'm_glass', name: '玻璃核心',
        desc: '生命上限 -6，基础攻击 +4、暴击 +4%。明确的高风险高伤路线。',
        apply: p => {
          p.hpBase = Math.max(12, p.hpBase - 6);
          p.atkBase += 4;
          p.critBase = (p.critBase || 0) + 4;
          if (typeof api.pMaxHp === 'function') p.hp = Math.min(p.hp, api.pMaxHp());
        },
      },
    ],
    assassin: [
      {
        id: 'a_execute', name: '处决本能',
        desc: '暴击 +5%、暴击伤害 +12%。让影袭与普攻都更偏斩杀。',
        apply: p => { p.critBase = (p.critBase || 0) + 5; p.critPower = (p.critPower || 0) + 12; },
      },
      {
        id: 'a_blood', name: '血影',
        desc: '吸血 +4%、基础攻击 +1。提高连续猎杀后的自我恢复。',
        apply: p => { p.leechBase = (p.leechBase || 0) + 4; p.atkBase += 1; },
      },
      {
        id: 'a_shadow', name: '影步余韵',
        desc: '技能冷却 -1、生命上限 +6。降低影袭真空期的一次失位惩罚。',
        apply: p => { p.skillHaste = (p.skillHaste || 0) + 1; p.hpBase += 6; p.hp += 6; },
      },
    ],
  };

  function rankCounts() {
    const counts = Object.create(null);
    const p = api.player;
    for (const id of (p && p.talents) || []) counts[id] = (counts[id] || 0) + 1;
    return counts;
  }

  function eligiblePool() {
    const cid = api.classId || 'warrior';
    const counts = rankCounts();
    const ids = CLASS_BASE[cid] || CLASS_BASE.warrior;
    const pool = [];
    for (const id of ids) {
      const t = byId[id];
      if (t && (counts[id] || 0) < (CAP[id] || 1)) pool.push(t);
    }
    for (const t of classTalents[cid] || []) {
      if ((counts[t.id] || 0) < (CAP[t.id] || 1)) pool.push(t);
    }

    // Very long/endless runs may exhaust the curated pool. Keep harmless resource
    // choices available rather than presenting fewer than three buttons.
    for (const id of ['pack', 'gold', 'plunder']) {
      const t = byId[id];
      if (t && !pool.includes(t) && (counts[id] || 0) < (CAP[id] || 1)) pool.push(t);
    }
    return pool;
  }

  function syncPool() {
    // Do not alter a selection screen after its three choices are already rendered;
    // pickTalent() resolves by id from TALENTS, so preserve that set until selection.
    if (api.state === 'talent') return;
    const pool = eligiblePool();
    api.TALENTS.splice(0, api.TALENTS.length, ...pool);
  }

  syncPool();
  const timer = setInterval(syncPool, 250);
  window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });

  window.DE_TALENT_RANKS = {
    caps: { ...CAP },
    counts: rankCounts,
    eligible: eligiblePool,
  };
})();