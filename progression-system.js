/* Dungeon Echo production progression v2.
 * Curates long-run talents and adds 20/40/60/80 skill-evolution choices without new hotkeys.
 * Evolution choices are stored as talent ids, so existing save schemas stay compatible.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__DE_PROGRESSION_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !Array.isArray(api.TALENTS)) return;
  window.__DE_PROGRESSION_SYSTEM = 'v2';

  const source = api.TALENTS.slice();
  const byId = Object.fromEntries(source.map(t => [t.id, t]));

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
      { id: 'w_bulwark', name: '不动壁垒', desc: '生命上限 +18、受到伤害 -1。更偏向稳定承伤，而不是继续无脑堆护甲。', apply: p => { p.hpBase += 18; p.flatDr = (p.flatDr || 0) + 1; p.hp += 18; } },
      { id: 'w_reprise', name: '铁血反击', desc: '反伤 +5、击杀回复 +2。让贴身换血转化为持续收益。', apply: p => { p.thornsBase = (p.thornsBase || 0) + 5; p.regenBase = (p.regenBase || 0) + 2; } },
      { id: 'w_ravager', name: '破阵者', desc: '基础攻击 +2、吸血 +2%。牺牲部分纯防守，强化横扫推进。', apply: p => { p.atkBase += 2; p.leechBase = (p.leechBase || 0) + 2; } },
    ],
    ranger: [
      { id: 'r_eagle', name: '鹰眼', desc: '基础攻击 +2、暴击 +4%。奖励保持射线与距离。', apply: p => { p.atkBase += 2; p.critBase = (p.critBase || 0) + 4; } },
      { id: 'r_hunter', name: '猎手续航', desc: '生命上限 +8、击杀回复 +3。适合长距离清图而非频繁喝药。', apply: p => { p.hpBase += 8; p.regenBase = (p.regenBase || 0) + 3; p.hp += 8; } },
      { id: 'r_tempo', name: '疾猎节奏', desc: '技能冷却 -1、暴击 +3%。强化疾步拉扯，但不直接增加射程。', apply: p => { p.skillHaste = (p.skillHaste || 0) + 1; p.critBase = (p.critBase || 0) + 3; } },
    ],
    mage: [
      { id: 'm_focus', name: '奥术聚焦', desc: '基础攻击 +3、暴击伤害 +10%。强化炮台爆发。', apply: p => { p.atkBase += 3; p.critPower = (p.critPower || 0) + 10; } },
      { id: 'm_flow', name: '回响导流', desc: '技能冷却 -1，并立刻获得 1 张传送卷轴。强化控制与脱离循环。', apply: p => { p.skillHaste = (p.skillHaste || 0) + 1; p.scrolls = (p.scrolls || 0) + 1; } },
      { id: 'm_glass', name: '玻璃核心', desc: '生命上限 -6，基础攻击 +4、暴击 +4%。明确的高风险高伤路线。', apply: p => { p.hpBase = Math.max(12, p.hpBase - 6); p.atkBase += 4; p.critBase = (p.critBase || 0) + 4; if (typeof api.pMaxHp === 'function') p.hp = Math.min(p.hp, api.pMaxHp()); } },
    ],
    assassin: [
      { id: 'a_execute', name: '处决本能', desc: '暴击 +5%、暴击伤害 +12%。让影袭与普攻都更偏斩杀。', apply: p => { p.critBase = (p.critBase || 0) + 5; p.critPower = (p.critPower || 0) + 12; } },
      { id: 'a_blood', name: '血影', desc: '吸血 +4%、基础攻击 +1。提高连续猎杀后的自我恢复。', apply: p => { p.leechBase = (p.leechBase || 0) + 4; p.atkBase += 1; } },
      { id: 'a_shadow', name: '影步余韵', desc: '技能冷却 -1、生命上限 +6。降低影袭真空期的一次失位惩罚。', apply: p => { p.skillHaste = (p.skillHaste || 0) + 1; p.hpBase += 6; p.hp += 6; } },
    ],
  };

  const evolution = {
    warrior: {
      20: [
        ['se_w20_arc', '环斩', '横扫额外擦过四个斜角近身位；围攻时不再只处理十字四格。'],
        ['se_w20_guard', '盾势', '施放横扫的这一回合获得额外减伤，适合贴身换血。'],
      ],
      40: [
        ['se_w40_reach', '破阵长锋', '横扫同时打击上下左右第二格目标，形成直线纵深。'],
        ['se_w40_rhythm', '战阵节拍', '一次横扫覆盖至少两个目标时额外返还 1 回合冷却。'],
      ],
      60: [
        ['se_w60_blood', '血战续行', '横扫造成击杀时恢复少量最大生命。'],
        ['se_w60_pressure', '压阵', '横扫本身获得基于当前攻击的额外威力，强化破阵而非普攻。'],
      ],
      80: [
        ['se_w80_tempest', '风暴横扫', '横扫扩展到两格范围内的非核心目标，成为真正的深层清场技。'],
        ['se_w80_fortress', '移动堡垒', '施放横扫时获得更强临时减伤；技能越用于危险贴身局面越有价值。'],
      ],
    },
    ranger: {
      20: [
        ['se_r20_evasion', '掠影', '疾步期间获得临时减伤，让位移可用于穿过危险接触区。'],
        ['se_r20_tempo', '轻装疾行', '疾步本次施放按额外技能急速结算，缩短下一次位移等待。'],
      ],
      40: [
        ['se_r40_hunt', '猎杀续步', '疾步造成击杀时立即重置技能冷却。'],
        ['se_r40_flow', '无伤转场', '疾步没有造成击杀时额外返还 2 回合冷却，鼓励把技能用于走位。'],
      ],
      60: [
        ['se_r60_marksman', '拉弦余势', '疾步成功后强化下一次方向攻击；空跑不会消耗在普通移动上。'],
        ['se_r60_sustain', '猎手续命', '疾步击杀敌人时恢复最大生命，提升连续猎杀续航。'],
      ],
      80: [
        ['se_r80_chain', '无尽追猎', '疾步造成击杀时保持零冷却，并强化下一次方向攻击，形成高风险追猎链。'],
        ['se_r80_phantom', '幻步', '疾步回合获得更强减伤，并为下一次方向攻击留下较小增幅。'],
      ],
    },
    mage: {
      20: [
        ['se_m20_fork', '分叉奥术', '奥术弹命中前，同时削击第二近的可见敌人。'],
        ['se_m20_barrier', '施法屏障', '施放奥术弹的这一回合获得临时减伤，换取更稳定的站桩输出。'],
      ],
      40: [
        ['se_m40_chain', '回响连锁', '奥术弹额外波及第二、第三个可见目标，强化群战。'],
        ['se_m40_focus', '单点聚焦', '视野里只有一个敌人时，奥术弹获得显著额外威力。'],
      ],
      60: [
        ['se_m60_overload', '过载回路', '奥术弹造成击杀时额外返还 2 回合冷却。'],
        ['se_m60_repulse', '强制退相', '奥术弹结算后若目标仍存活，会尝试把它再推离一格。'],
      ],
      80: [
        ['se_m80_storm', '奥术风暴', '奥术弹施放前对最多三个次要可见目标造成高比例溅射。'],
        ['se_m80_singularity', '奇点核心', '只有单一可见目标时大幅强化本次奥术弹，但不改善群战。'],
      ],
    },
    assassin: {
      20: [
        ['se_a20_execute', '斩首线', '影袭锁定的最近目标低于 45% 生命时，本次处决获得额外威力。'],
        ['se_a20_smoke', '烟遁', '施放影袭的这一回合获得临时减伤，降低落点失误成本。'],
      ],
      40: [
        ['se_a40_blood', '血返', '影袭击杀时恢复最大生命，适合连续切入。'],
        ['se_a40_tempo', '影刃节拍', '影袭击杀时额外返还 2 回合冷却。'],
      ],
      60: [
        ['se_a60_mark', '死亡标记', '影袭成功后强化下一次方向攻击，逼迫你继续贴身完成连段。'],
        ['se_a60_escape', '脱影', '影袭回合获得更强临时减伤，偏向安全进出。'],
      ],
      80: [
        ['se_a80_chain', '无间影袭', '影袭造成击杀时直接重置技能冷却。'],
        ['se_a80_predator', '猎物未死', '影袭未能击杀时返还部分冷却并强化下一次方向攻击。'],
      ],
    },
  };

  const evoTalents = Object.create(null);
  for (const cid of Object.keys(evolution)) {
    for (const depth of Object.keys(evolution[cid])) {
      for (const [id, name, desc] of evolution[cid][depth]) evoTalents[id] = { id, name: `${depth}层 · ${name}`, desc, apply() {} };
    }
  }

  function rankCounts() {
    const counts = Object.create(null);
    const p = api.player;
    for (const id of (p && p.talents) || []) counts[id] = (counts[id] || 0) + 1;
    return counts;
  }

  function pendingEvolution() {
    const p = api.player;
    if (!p) return null;
    const cid = api.classId || 'warrior';
    const chosen = new Set(p.talents || []);
    const d = Number(api.depth) || 0;
    for (const milestone of [20, 40, 60, 80]) {
      if (d < milestone) break;
      const pair = evolution[cid] && evolution[cid][milestone];
      if (pair && !pair.some(row => chosen.has(row[0]))) return pair.map(row => evoTalents[row[0]]);
    }
    return null;
  }

  function eligiblePool() {
    const milestone = pendingEvolution();
    if (milestone) return milestone;
    const cid = api.classId || 'warrior';
    const counts = rankCounts();
    const ids = CLASS_BASE[cid] || CLASS_BASE.warrior;
    const pool = [];
    for (const id of ids) {
      const t = byId[id];
      if (t && (counts[id] || 0) < (CAP[id] || 1)) pool.push(t);
    }
    for (const t of classTalents[cid] || []) if ((counts[t.id] || 0) < (CAP[t.id] || 1)) pool.push(t);
    for (const id of ['pack', 'gold', 'plunder']) {
      const t = byId[id];
      if (t && !pool.includes(t) && (counts[id] || 0) < (CAP[id] || 1)) pool.push(t);
    }
    return pool;
  }

  function syncPool() {
    if (api.state === 'talent') return;
    const pool = eligiblePool();
    api.TALENTS.splice(0, api.TALENTS.length, ...pool);
  }

  const has = id => !!(api.player && Array.isArray(api.player.talents) && api.player.talents.includes(id));
  const equipAtk = p => ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet']
    .reduce((sum, slot) => sum + (p.equip && p.equip[slot] && p.equip[slot].stats ? Number(p.equip[slot].stats.atk) || 0 : 0), 0);
  const attack = () => Math.max(1, (Number(api.player && api.player.atkBase) || 0) + equipAtk(api.player || {}));
  const maxHp = () => typeof api.pMaxHp === 'function' ? Math.max(1, Number(api.pMaxHp()) || 1) : Math.max(1, Number(api.player && api.player.hpBase) || 1);
  const monsterCount = () => Array.isArray(api.monsters) ? api.monsters.length : 0;
  const inBounds = (x, y) => Array.isArray(api.mapGrid) && y >= 0 && y < api.mapGrid.length && x >= 0 && api.mapGrid[y] && x < api.mapGrid[y].length;
  const monsterAt = (x, y) => (api.monsters || []).find(m => m && m.hp > 0 && m.x === x && m.y === y) || null;
  const npcAt = (x, y) => (api.npcs || []).find(n => n && n.x === x && n.y === y) || null;
  const walkable = (x, y) => inBounds(x, y) && api.mapGrid[y][x] !== 0 && !monsterAt(x, y) && !npcAt(x, y);

  function lineClear(x0, y0, x1, y1) {
    let x = x0, y = y0;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (!(x === x1 && y === y1)) {
      const e2 = err * 2;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
      if (x === x1 && y === y1) return true;
      if (!inBounds(x, y) || api.mapGrid[y][x] === 0) return false;
    }
    return true;
  }

  function visibleMonsters() {
    const p = api.player;
    if (!p) return [];
    return (api.monsters || []).filter(m => m && m.hp > 0 && Math.hypot(m.x - p.x, m.y - p.y) <= 8.5 && lineClear(p.x, p.y, m.x, m.y))
      .sort((a, b) => (Math.abs(a.x - p.x) + Math.abs(a.y - p.y)) - (Math.abs(b.x - p.x) + Math.abs(b.y - p.y)));
  }

  function announce(text) {
    const hint = typeof document !== 'undefined' && document.getElementById ? document.getElementById('hint') : null;
    if (hint) hint.textContent = `› ${text}`;
  }

  function preSplashWarrior() {
    const p = api.player;
    if (!p) return;
    const coreAdjacent = (api.monsters || []).some(m => Math.abs(m.x - p.x) + Math.abs(m.y - p.y) === 1);
    if (!coreAdjacent) return;
    const targets = [];
    if (has('se_w20_arc')) for (const m of api.monsters || []) if (Math.abs(m.x - p.x) === 1 && Math.abs(m.y - p.y) === 1) targets.push([m, .65]);
    if (has('se_w40_reach')) for (const m of api.monsters || []) {
      const dx = Math.abs(m.x - p.x), dy = Math.abs(m.y - p.y);
      if ((dx === 2 && dy === 0) || (dx === 0 && dy === 2)) targets.push([m, .70]);
    }
    if (has('se_w80_tempest')) for (const m of api.monsters || []) {
      const dx = Math.abs(m.x - p.x), dy = Math.abs(m.y - p.y), core = dx + dy === 1;
      if (!core && Math.max(dx, dy) <= 2 && !targets.some(row => row[0] === m)) targets.push([m, .72]);
    }
    const base = attack();
    for (const [m, scale] of [...targets]) if (m.hp > 0) api.applyDamageToMonster(m, Math.max(1, Math.round(base * scale) - (Number(m.def) || 0)), false);
  }

  function preSplashMage(vis) {
    const base = attack(), rows = [];
    if (has('se_m80_storm')) for (const m of vis.slice(1, 4)) rows.push([m, .65]);
    else if (has('se_m40_chain')) for (const m of vis.slice(1, 3)) rows.push([m, .45]);
    else if (has('se_m20_fork') && vis[1]) rows.push([vis[1], .55]);
    for (const [m, scale] of rows) if (m && m.hp > 0) api.applyDamageToMonster(m, Math.max(1, Math.round(base * scale) - Math.floor((Number(m.def) || 0) * .4)), false);
  }

  // The cross-input follow-up state lives in gameplay-tuning. Progression only announces
  // the buff here; keeping a second keyboard-only state caused mouse/touch users to consume
  // one boost while leaving a stale keyboard boost available for a later extra hit.
  function announceNextAttack(label) {
    announce(`${label}已蓄势：下一次方向攻击获得强化。`);
  }

  function evolveSkill() {
    if (!api.player || api.state !== 'playing') return false;
    const cid = api.classId || 'warrior';
    if (!(api.player.talents || []).some(id => String(id).startsWith(`se_${cid[0]}`))) return false;
    if ((api.player.skillCd || 0) > 0) { api.useSkill(); return true; }

    const p = api.player;
    const beforeTurn = Number(api.turns) || 0, beforeCount = monsterCount(), beforeHp = Number(p.hp) || 0;
    const originalAtkBase = Number(p.atkBase) || 0, originalFlatDr = Number(p.flatDr) || 0, originalHaste = Number(p.skillHaste) || 0;
    let tempAtk = 0, tempDr = 0, tempHaste = 0;
    const visBefore = visibleMonsters(), targetBefore = visBefore[0] || null;

    if (cid === 'warrior') {
      preSplashWarrior();
      if (has('se_w20_guard')) tempDr += 3;
      if (has('se_w80_fortress')) tempDr += 7;
      if (has('se_w60_pressure')) tempAtk += Math.max(2, Math.round(attack() * .22));
    } else if (cid === 'mage') {
      preSplashMage(visBefore);
      if (has('se_m20_barrier')) tempDr += 4;
      if (has('se_m40_focus') && visBefore.length === 1) tempAtk += Math.max(2, Math.round(attack() * .30));
      if (has('se_m80_singularity') && visBefore.length === 1) tempAtk += Math.max(3, Math.round(attack() * .45));
    } else if (cid === 'ranger') {
      if (has('se_r20_evasion')) tempDr += 4;
      if (has('se_r80_phantom')) tempDr += 5;
      if (has('se_r20_tempo')) tempHaste += 1;
    } else if (cid === 'assassin') {
      if (has('se_a20_smoke')) tempDr += 4;
      if (has('se_a60_escape')) tempDr += 5;
      if (has('se_a20_execute') && targetBefore && targetBefore.maxHp && targetBefore.hp <= targetBefore.maxHp * .45) tempAtk += Math.max(2, Math.round(attack() * .35));
    }

    p.atkBase += tempAtk; p.flatDr = originalFlatDr + tempDr; p.skillHaste = originalHaste + tempHaste;
    api.useSkill();
    p.atkBase = originalAtkBase; p.flatDr = originalFlatDr; p.skillHaste = originalHaste;

    const used = (Number(api.turns) || 0) > beforeTurn;
    if (!used) return true;
    const killed = monsterCount() < beforeCount;

    if (cid === 'warrior') {
      const adjacentBefore = visBefore.filter(m => Math.abs(m.x - p.x) + Math.abs(m.y - p.y) <= 2).length;
      if (has('se_w40_rhythm') && adjacentBefore >= 2) p.skillCd = Math.max(0, (p.skillCd || 0) - 1);
      if (has('se_w60_blood') && killed) p.hp = Math.min(maxHp(), p.hp + Math.max(2, Math.round(maxHp() * .08)));
    } else if (cid === 'mage') {
      if (has('se_m60_overload') && killed) p.skillCd = Math.max(0, (p.skillCd || 0) - 2);
      if (has('se_m60_repulse') && targetBefore && targetBefore.hp > 0 && api.monsters.includes(targetBefore)) {
        const dx = Math.sign(targetBefore.x - p.x), dy = Math.sign(targetBefore.y - p.y), nx = targetBefore.x + dx, ny = targetBefore.y + dy;
        if (walkable(nx, ny)) { targetBefore.x = nx; targetBefore.y = ny; targetBefore.fx = nx; targetBefore.fy = ny; }
      }
    } else if (cid === 'ranger') {
      if (has('se_r80_chain') && killed) p.skillCd = 0;
      else if (has('se_r40_hunt') && killed) p.skillCd = 0;
      if (has('se_r40_flow') && !killed) p.skillCd = Math.max(0, (p.skillCd || 0) - 2);
      if (has('se_r60_sustain') && killed) p.hp = Math.min(maxHp(), p.hp + Math.max(2, Math.round(maxHp() * .10)));
      if (has('se_r60_marksman')) announceNextAttack('拉弦余势');
      if (has('se_r80_phantom')) announceNextAttack('幻步余势');
    } else if (cid === 'assassin') {
      if (has('se_a80_chain') && killed) p.skillCd = 0;
      else if (has('se_a40_tempo') && killed) p.skillCd = Math.max(0, (p.skillCd || 0) - 2);
      if (has('se_a40_blood') && killed) p.hp = Math.min(maxHp(), p.hp + Math.max(2, Math.round(maxHp() * .12)));
      if (has('se_a60_mark')) announceNextAttack('死亡标记');
      if (has('se_a80_predator') && !killed) { p.skillCd = Math.max(0, (p.skillCd || 0) - 2); announceNextAttack('猎物未死'); }
    }

    if ((Number(p.hp) || 0) > beforeHp) announce('技能进化触发了额外续航。');
    return true;
  }

  function skillInput(e) {
    if (!api.player || api.state !== 'playing') return;
    const isKey = e.type === 'keydown' && (e.key === 'c' || e.key === 'C');
    const target = e.type === 'click' && e.target && typeof e.target.closest === 'function' ? e.target.closest('[data-act="skill"]') : null;
    if (!isKey && !target) return;
    if (!evolveSkill()) return;
    e.preventDefault(); e.stopImmediatePropagation();
  }

  syncPool();
  const timer = setInterval(syncPool, 250);
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('keydown', skillInput, true);
    document.addEventListener('click', skillInput, true);
  }
  window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });

  window.DE_TALENT_RANKS = { caps: { ...CAP }, counts: rankCounts, eligible: eligiblePool };
  window.DE_SKILL_EVOLUTION = {
    choices: evolution,
    pending: pendingEvolution,
    has,
    cast: evolveSkill,
    nextAttackOwner: 'mechanics-integrity',
  };
})();
