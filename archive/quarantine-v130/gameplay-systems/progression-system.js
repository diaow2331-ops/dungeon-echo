/* Dungeon Echo production progression v3.
 * Curates long-run talents and adds 20/40/60/80 skill-evolution choices without new hotkeys.
 * Evolution choices are stored as stable talent ids, so existing save schemas stay compatible.
 * Pool maintenance is action-driven; the public combat input owner invokes evolution casts.
 * v3 makes every progression/talent/evolution label fixed-route Chinese/English at the source.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__DE_PROGRESSION_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !Array.isArray(api.TALENTS)) return;

  const routeLang = typeof document !== 'undefined'
    ? String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase()
    : '';
  const english = routeLang === 'en';
  const copy = (zh, en) => english ? en : zh;
  window.__DE_PROGRESSION_SYSTEM = 'v3';

  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  let syncQueued = false;

  const BASE_COPY = Object.freeze({
    iron: ['Ironbone', 'Max HP +12 and immediately restore 12 HP.'],
    edge: ['Edge', 'Base ATK +2.'],
    luck: ['Fortune', 'Crit +8%.'],
    blood: ['Blood Pact', 'Leech +5%.'],
    haste: ['Haste', 'Permanent skill cooldown -1 (minimum 2 turns).'],
    pack: ['Field Pack', 'Immediately gain +1 Potion and +1 Teleport Scroll.'],
    gold: ['Gilded Touch', 'Gold Find +20%.'],
    ward: ['Ward', 'Damage taken -1.'],
    bramble: ['Bramble Heart', 'Thorns +4. High-armor builds gain more from trading hits.'],
    scavenge: ['Scavenger', 'Restore 3 HP on kill.'],
    elixir: ['Potent Elixir', 'Potion healing +40%.'],
    frenzy: ['Lethal Rhythm', 'Critical damage +25% (1.8× → about 2.05×).'],
    tenacity: ['Tenacity', 'Grievous Wounds duration -1 turn (minimum 1).'],
    plunder: ['Plunderer', 'Gold dropped by kills +25%.'],
    stone: ['Stone Skin', 'Damage taken -2.'],
    echoborn: ['Echo-Born', 'Natural recovery accelerates: +1 HP every 4 turns.'],
  });

  const localizeBaseTalent = t => {
    if (!t || !english || !BASE_COPY[t.id]) return t;
    const row = BASE_COPY[t.id];
    return { ...t, name: row[0], desc: row[1] };
  };
  const source = api.TALENTS.slice().map(localizeBaseTalent);
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

  const T = (id, zhName, enName, zhDesc, enDesc, apply) => ({
    id, name: copy(zhName, enName), desc: copy(zhDesc, enDesc), apply,
  });
  const classTalents = {
    warrior: [
      T('w_bulwark', '不动壁垒', 'Immovable Bulwark',
        '生命上限 +18、受到伤害 -1。更偏向稳定承伤，而不是继续无脑堆护甲。',
        'Max HP +18 and damage taken -1. Favors reliable mitigation over stacking more Armor.',
        p => { p.hpBase += 18; p.flatDr = (p.flatDr || 0) + 1; p.hp += 18; }),
      T('w_reprise', '铁血反击', 'Iron Reprisal',
        '反伤 +5、击杀回复 +2。让贴身换血转化为持续收益。',
        'Thorns +5 and restore 2 HP on kill. Turns close-range trades into sustained value.',
        p => { p.thornsBase = (p.thornsBase || 0) + 5; p.regenBase = (p.regenBase || 0) + 2; }),
      T('w_ravager', '破阵者', 'Linebreaker',
        '基础攻击 +2、吸血 +2%。牺牲部分纯防守，强化横扫推进。',
        'Base ATK +2 and Leech +2%. Trades pure defense for stronger Sweep pressure.',
        p => { p.atkBase += 2; p.leechBase = (p.leechBase || 0) + 2; }),
    ],
    ranger: [
      T('r_eagle', '鹰眼', 'Eagle Eye',
        '基础攻击 +2、暴击 +4%。奖励保持射线与距离。',
        'Base ATK +2 and Crit +4%. Rewards maintaining clean firing lines and distance.',
        p => { p.atkBase += 2; p.critBase = (p.critBase || 0) + 4; }),
      T('r_hunter', '猎手续航', 'Hunter Sustain',
        '生命上限 +8、击杀回复 +3。适合长距离清图而非频繁喝药。',
        'Max HP +8 and restore 3 HP on kill. Supports long clears without constant potion use.',
        p => { p.hpBase += 8; p.regenBase = (p.regenBase || 0) + 3; p.hp += 8; }),
      T('r_tempo', '疾猎节奏', 'Hunting Tempo',
        '技能冷却 -1、暴击 +3%。强化疾步拉扯，但不直接增加射程。',
        'Skill cooldown -1 and Crit +3%. Strengthens Fleet Step kiting without adding range.',
        p => { p.skillHaste = (p.skillHaste || 0) + 1; p.critBase = (p.critBase || 0) + 3; }),
    ],
    mage: [
      T('m_focus', '奥术聚焦', 'Arcane Focus',
        '基础攻击 +3、暴击伤害 +10%。强化炮台爆发。',
        'Base ATK +3 and critical damage +10%. Reinforces artillery-style burst.',
        p => { p.atkBase += 3; p.critPower = (p.critPower || 0) + 10; }),
      T('m_flow', '回响导流', 'Echo Conduit',
        '技能冷却 -1，并立刻获得 1 张传送卷轴。强化控制与脱离循环。',
        'Skill cooldown -1 and immediately gain 1 Teleport Scroll. Improves control and escape cycles.',
        p => { p.skillHaste = (p.skillHaste || 0) + 1; p.scrolls = (p.scrolls || 0) + 1; }),
      T('m_glass', '玻璃核心', 'Glass Core',
        '生命上限 -6，基础攻击 +4、暴击 +4%。明确的高风险高伤路线。',
        'Max HP -6, Base ATK +4 and Crit +4%. A deliberate high-risk, high-damage path.',
        p => { p.hpBase = Math.max(12, p.hpBase - 6); p.atkBase += 4; p.critBase = (p.critBase || 0) + 4; if (typeof api.pMaxHp === 'function') p.hp = Math.min(p.hp, api.pMaxHp()); }),
    ],
    assassin: [
      T('a_execute', '处决本能', 'Execution Instinct',
        '暴击 +5%、暴击伤害 +12%。让影袭与普攻都更偏斩杀。',
        'Crit +5% and critical damage +12%. Pushes both Shadow Strike and basic attacks toward executions.',
        p => { p.critBase = (p.critBase || 0) + 5; p.critPower = (p.critPower || 0) + 12; }),
      T('a_blood', '血影', 'Bloodshadow',
        '吸血 +4%、基础攻击 +1。提高连续猎杀后的自我恢复。',
        'Leech +4% and Base ATK +1. Improves recovery through chained kills.',
        p => { p.leechBase = (p.leechBase || 0) + 4; p.atkBase += 1; }),
      T('a_shadow', '影步余韵', 'Shadowstep Echo',
        '技能冷却 -1、生命上限 +6。降低影袭真空期的一次失位惩罚。',
        'Skill cooldown -1 and Max HP +6. Softens one positioning mistake during Shadow Strike downtime.',
        p => { p.skillHaste = (p.skillHaste || 0) + 1; p.hpBase += 6; p.hp += 6; }),
    ],
  };

  const E = (id, zhName, enName, zhDesc, enDesc) => [
    id, copy(zhName, enName), copy(zhDesc, enDesc),
  ];
  const evolution = {
    warrior: {
      20: [
        E('se_w20_arc', '环斩', 'Arc Sweep',
          '横扫额外擦过四个斜角近身位；围攻时不再只处理十字四格。',
          'Sweep also clips the four adjacent diagonals, so surrounding enemies are no longer limited to the cardinal tiles.'),
        E('se_w20_guard', '盾势', 'Guard Stance',
          '施放横扫的这一回合获得额外减伤，适合贴身换血。',
          'Gain extra damage reduction during the turn Sweep is cast, improving close-range trades.'),
      ],
      40: [
        E('se_w40_reach', '破阵长锋', 'Linebreaker Reach',
          '横扫同时打击上下左右第二格目标，形成直线纵深。',
          'Sweep also hits targets two tiles away in the four cardinal directions.'),
        E('se_w40_rhythm', '战阵节拍', 'Battle Rhythm',
          '一次横扫覆盖至少两个目标时额外返还 1 回合冷却。',
          'If one Sweep covers at least two targets, refund 1 extra turn of cooldown.'),
      ],
      60: [
        E('se_w60_blood', '血战续行', 'Bloodied Advance',
          '横扫造成击杀时恢复少量最大生命。',
          'Kills caused by Sweep restore a small amount of Max HP.'),
        E('se_w60_pressure', '压阵', 'Press the Line',
          '横扫本身获得基于当前攻击的额外威力，强化破阵而非普攻。',
          'Sweep gains extra power based on current ATK, strengthening the skill rather than basic attacks.'),
      ],
      80: [
        E('se_w80_tempest', '风暴横扫', 'Tempest Sweep',
          '横扫扩展到两格范围内的非核心目标，成为真正的深层清场技。',
          'Sweep extends to secondary targets within two tiles, becoming a true deep-floor clearing skill.'),
        E('se_w80_fortress', '移动堡垒', 'Moving Fortress',
          '施放横扫时获得更强临时减伤；技能越用于危险贴身局面越有价值。',
          'Gain stronger temporary damage reduction while casting Sweep; it rewards committing in dangerous melee situations.'),
      ],
    },
    ranger: {
      20: [
        E('se_r20_evasion', '掠影', 'Passing Shadow',
          '疾步期间获得临时减伤，让位移可用于穿过危险接触区。',
          'Gain temporary damage reduction during Fleet Step, allowing movement through dangerous contact zones.'),
        E('se_r20_tempo', '轻装疾行', 'Lightfoot Tempo',
          '疾步本次施放按额外技能急速结算，缩短下一次位移等待。',
          'This Fleet Step gains extra skill haste, shortening the wait before the next movement skill.'),
      ],
      40: [
        E('se_r40_hunt', '猎杀续步', 'Hunt Continues',
          '疾步造成击杀时立即重置技能冷却。',
          'A kill caused by Fleet Step immediately resets its cooldown.'),
        E('se_r40_flow', '无伤转场', 'Clean Transition',
          '疾步没有造成击杀时额外返还 2 回合冷却，鼓励把技能用于走位。',
          'If Fleet Step does not kill, refund 2 extra cooldown turns, rewarding repositioning.'),
      ],
      60: [
        E('se_r60_marksman', '拉弦余势', 'Drawstring Momentum',
          '疾步成功后强化下一次方向攻击；空跑不会消耗在普通移动上。',
          'After a successful Fleet Step, empower the next directional attack; ordinary movement does not consume it.'),
        E('se_r60_sustain', '猎手续命', 'Hunter Renewal',
          '疾步击杀敌人时恢复最大生命，提升连续猎杀续航。',
          'Kills caused by Fleet Step restore Max HP, improving sustained hunts.'),
      ],
      80: [
        E('se_r80_chain', '无尽追猎', 'Endless Hunt',
          '疾步造成击杀时保持零冷却，并强化下一次方向攻击，形成高风险追猎链。',
          'Fleet Step kills keep cooldown at zero and empower the next directional attack, enabling a high-risk chase chain.'),
        E('se_r80_phantom', '幻步', 'Phantom Step',
          '疾步回合获得更强减伤，并为下一次方向攻击留下较小增幅。',
          'Gain stronger damage reduction during Fleet Step and leave a smaller boost for the next directional attack.'),
      ],
    },
    mage: {
      20: [
        E('se_m20_fork', '分叉奥术', 'Forked Arcana',
          '奥术弹命中前，同时削击第二近的可见敌人。',
          'Before Arcane Bolt lands, also strike the second-nearest visible enemy.'),
        E('se_m20_barrier', '施法屏障', 'Casting Barrier',
          '施放奥术弹的这一回合获得临时减伤，换取更稳定的站桩输出。',
          'Gain temporary damage reduction during the Arcane Bolt turn for more stable stationary damage.'),
      ],
      40: [
        E('se_m40_chain', '回响连锁', 'Echo Chain',
          '奥术弹额外波及第二、第三个可见目标，强化群战。',
          'Arcane Bolt also splashes the second and third visible targets, improving group fights.'),
        E('se_m40_focus', '单点聚焦', 'Single-Target Focus',
          '视野里只有一个敌人时，奥术弹获得显著额外威力。',
          'When only one enemy is visible, Arcane Bolt gains significant extra power.'),
      ],
      60: [
        E('se_m60_overload', '过载回路', 'Overload Circuit',
          '奥术弹造成击杀时额外返还 2 回合冷却。',
          'Arcane Bolt kills refund 2 extra turns of cooldown.'),
        E('se_m60_repulse', '强制退相', 'Forced Displacement',
          '奥术弹结算后若目标仍存活，会尝试把它再推离一格。',
          'If the target survives Arcane Bolt, attempt to push it one additional tile away.'),
      ],
      80: [
        E('se_m80_storm', '奥术风暴', 'Arcane Storm',
          '奥术弹施放前对最多三个次要可见目标造成高比例溅射。',
          'Before Arcane Bolt is cast, deal heavy splash damage to up to three secondary visible targets.'),
        E('se_m80_singularity', '奇点核心', 'Singularity Core',
          '只有单一可见目标时大幅强化本次奥术弹，但不改善群战。',
          'When exactly one target is visible, greatly empower this Arcane Bolt without improving group fights.'),
      ],
    },
    assassin: {
      20: [
        E('se_a20_execute', '斩首线', 'Execution Line',
          '影袭锁定的最近目标低于 45% 生命时，本次处决获得额外威力。',
          'When Shadow Strike targets an enemy below 45% HP, this execution gains extra power.'),
        E('se_a20_smoke', '烟遁', 'Smoke Veil',
          '施放影袭的这一回合获得临时减伤，降低落点失误成本。',
          'Gain temporary damage reduction during the Shadow Strike turn, reducing the cost of a bad landing.'),
      ],
      40: [
        E('se_a40_blood', '血返', 'Blood Return',
          '影袭击杀时恢复最大生命，适合连续切入。',
          'Shadow Strike kills restore Max HP, supporting repeated dives.'),
        E('se_a40_tempo', '影刃节拍', 'Shadowblade Tempo',
          '影袭击杀时额外返还 2 回合冷却。',
          'Shadow Strike kills refund 2 extra turns of cooldown.'),
      ],
      60: [
        E('se_a60_mark', '死亡标记', 'Death Mark',
          '影袭成功后强化下一次方向攻击，逼迫你继续贴身完成连段。',
          'After a successful Shadow Strike, empower the next directional attack and reward staying close to finish the combo.'),
        E('se_a60_escape', '脱影', 'Slip into Shadow',
          '影袭回合获得更强临时减伤，偏向安全进出。',
          'Gain stronger temporary damage reduction during the Shadow Strike turn, favoring safer entries and exits.'),
      ],
      80: [
        E('se_a80_chain', '无间影袭', 'Unbroken Shadow Strike',
          '影袭造成击杀时直接重置技能冷却。',
          'Shadow Strike kills immediately reset the skill cooldown.'),
        E('se_a80_predator', '猎物未死', 'Prey Survived',
          '影袭未能击杀时返还部分冷却并强化下一次方向攻击。',
          'If Shadow Strike does not kill, refund part of the cooldown and empower the next directional attack.'),
      ],
    },
  };

  const evoTalents = Object.create(null);
  for (const cid of Object.keys(evolution)) {
    for (const depth of Object.keys(evolution[cid])) {
      for (const [id, name, desc] of evolution[cid][depth]) {
        evoTalents[id] = {
          id,
          name: english ? `Floor ${depth} · ${name}` : `${depth}层 · ${name}`,
          desc,
          apply() {},
        };
      }
    }
  }

  function rankCounts() {
    const counts = Object.create(null);
    const p = api.player;
    for (const id of (p && p.talents) || []) counts[id] = (counts[id] || 0) + 1;
    return counts;
  }

  function derivedMinimums(talents) {
    const counts = Object.create(null);
    for (const id of Array.isArray(talents) ? talents : []) counts[id] = (counts[id] || 0) + 1;
    const n = id => counts[id] || 0;
    return {
      thornsBase: n('bramble') * 4 + n('w_reprise') * 5,
      regenBase: n('scavenge') * 3 + n('w_reprise') * 2 + n('r_hunter') * 3,
      potionBoost: n('elixir') * 40,
      critPower: n('frenzy') * 25 + n('m_focus') * 10 + n('a_execute') * 12,
      grivResist: n('tenacity'),
      plunder: n('plunder') * 25,
      fastRegen: n('echoborn') > 0,
    };
  }

  function repairGreedyMetaDerivedStats() {
    const meta = api.meta;
    if (!api.greedy || !meta) return false;
    const p = api.player;
    const talents = p && Array.isArray(p.talents) ? p.talents : meta.talents;
    const minimum = derivedMinimums(talents);
    let changed = false;
    for (const field of ['thornsBase', 'regenBase', 'potionBoost', 'critPower', 'grivResist', 'plunder']) {
      const need = minimum[field];
      const metaNow = Math.max(0, Number(meta[field]) || 0);
      if (metaNow < need) { meta[field] = need; changed = true; }
      if (p) {
        const playerNow = Math.max(0, Number(p[field]) || 0);
        if (playerNow < need) { p[field] = need; changed = true; }
      }
    }
    if (minimum.fastRegen) {
      if (!meta.fastRegen) { meta.fastRegen = 1; changed = true; }
      if (p && !p.fastRegen) { p.fastRegen = true; changed = true; }
    }
    if (changed && typeof localStorage !== 'undefined') {
      try { localStorage.setItem('de-greedy-meta-v1', JSON.stringify(meta)); } catch (e) { /* storage unavailable */ }
    }
    return changed;
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
    repairGreedyMetaDerivedStats();
    if (api.state === 'talent') return;
    const pool = eligiblePool();
    api.TALENTS.splice(0, api.TALENTS.length, ...pool);
  }

  function schedulePoolSync() {
    if (syncQueued) return;
    syncQueued = true;
    defer(() => {
      syncQueued = false;
      syncPool();
    });
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
    if (hint) hint.textContent = `› ${String(text)}`;
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
  function announceNextAttack(zhLabel, enLabel) {
    announce(copy(
      `${zhLabel}已蓄势：下一次方向攻击获得强化。`,
      `${enLabel} is primed: your next directional attack is empowered.`
    ));
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
      if (has('se_r60_marksman')) announceNextAttack('拉弦余势', 'Drawstring Momentum');
      if (has('se_r80_phantom')) announceNextAttack('幻步余势', 'Phantom Momentum');
    } else if (cid === 'assassin') {
      if (has('se_a80_chain') && killed) p.skillCd = 0;
      else if (has('se_a40_tempo') && killed) p.skillCd = Math.max(0, (p.skillCd || 0) - 2);
      if (has('se_a40_blood') && killed) p.hp = Math.min(maxHp(), p.hp + Math.max(2, Math.round(maxHp() * .12)));
      if (has('se_a60_mark')) announceNextAttack('死亡标记', 'Death Mark');
      if (has('se_a80_predator') && !killed) {
        p.skillCd = Math.max(0, (p.skillCd || 0) - 2);
        announceNextAttack('猎物未死', 'Prey Survived');
      }
    }

    if ((Number(p.hp) || 0) > beforeHp) announce(copy('技能进化触发了额外续航。', 'Skill evolution triggered extra sustain.'));
    return true;
  }

  syncPool();
  if (typeof document !== 'undefined' && document.addEventListener) {
    // Queue after the synchronous core action. Depth/talent changes are then reflected before
    // the next gameplay action without a polling follower and without owning skill input twice.
    document.addEventListener('keydown', schedulePoolSync, true);
    document.addEventListener('click', schedulePoolSync, true);
    document.addEventListener('visibilitychange', schedulePoolSync);
  }
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('focus', schedulePoolSync);
    window.addEventListener('load', schedulePoolSync, { once: true });
  }

  window.DE_TALENT_RANKS = {
    version: 'v3',
    owner: 'progression-system',
    locale: english ? 'en' : 'zh-CN',
    caps: { ...CAP },
    counts: rankCounts,
    eligible: eligiblePool,
    repairGreedyMeta: repairGreedyMetaDerivedStats,
    sync: syncPool,
    scheduleSync: schedulePoolSync,
  };
  window.DE_SKILL_EVOLUTION = {
    version: 'v3',
    owner: 'progression-system',
    locale: english ? 'en' : 'zh-CN',
    choices: evolution,
    pending: pendingEvolution,
    has,
    cast: evolveSkill,
    nextAttackOwner: 'mechanics-integrity',
    inputOwner: 'combat-controls',
  };
})();
