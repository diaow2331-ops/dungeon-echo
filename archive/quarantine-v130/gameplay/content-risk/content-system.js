/* Dungeon Echo production content bridge v7.
 * Keeps late-game chapter palettes and all guardian encounter identity in one place.
 *
 * Stateful encounters:
 * 10 armor-break tutorial (core engine)
 * 20 Frost Ring
 * 30 Ember Mark
 * 40 Hunter Line
 * 50 Mending Channel
 * 60 Blood Tether
 * 70 Rupture Cross
 * 80 Arcane Strip
 * 90 Echo Trial (fixed three-pattern sequence)
 * 100 End-Abyss Sovereign (three HP-driven phases)
 *
 * Telegraph timing/state persists in a sidecar key so reload cannot cancel an announced
 * special. The core run-save schema stays unchanged. v6 makes guardian presentation
 * source-owned by the fixed Chinese/English route instead of runtime DOM translation.
 * v7 makes encounter progression action-driven and runs RAF only while a warning is visible.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__DE_CONTENT_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !api.runProfile) return;
  window.__DE_CONTENT_SYSTEM = 'v7';

  const p = api.runProfile;
  const ENCOUNTER_KEY = 'de-guardian-encounter-v1';
  const routeLang = typeof document !== 'undefined'
    ? String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase()
    : '';
  const english = routeLang === 'en';
  const copy = (zh, en) => english ? en : zh;

  if (Array.isArray(p.themes) && p.themes.length === 21) {
    p.themes.push(
      { name: copy('噤声王庭','Silent Court'), fl: '#11131d', fl2: '#0e1019', sp1: '#080a12', sp2: '#202536', wa: '#2b3144', wl: '#151925', wh: 'rgba(185,198,235,.10)' },
      { name: copy('黑星墓海','Blackstar Necropolis'), fl: '#17121d', fl2: '#120e19', sp1: '#0b0810', sp2: '#2a2034', wa: '#382b42', wl: '#1b1422', wh: 'rgba(208,176,230,.10)' },
      { name: copy('终末天井','Endfall Atrium'), fl: '#211014', fl2: '#1a0c10', sp1: '#100609', sp2: '#351920', wa: '#47212a', wl: '#210f15', wh: 'rgba(245,155,170,.11)' },
      { name: copy('回响王座','Echo Throne'), fl: '#0d0918', fl2: '#090612', sp1: '#05030c', sp2: '#211332', wa: '#301b48', wl: '#120a20', wh: 'rgba(210,185,255,.14)' }
    );
  }

  const guardians = Array.isArray(p.midBosses) ? p.midBosses : [];
  const patch = {
    10: { armorBreak: true },
    20: { regen: true, slow: false },
    30: { boom: true, enrage: false },
    40: { ranged: 4 },
    50: { ranged: 2, regen: false },
    60: { leech: 0.20, enrage: false },
    70: { regen: true, boom: true, slow: false },
    80: { ranged: 3, regen: false, enrage: false },
    90: { ranged: 3, regen: false, enrage: false, leech: 0.10 },
  };
  for (const g of guardians) {
    const extra = patch[g && g.depth];
    if (extra) Object.assign(g, extra);
  }

  // Keep the generic base useful for endless-echo bosses. The floor-100 runtime copy is
  // normalized below so the finale's pressure comes from its phases rather than passive regen/enrage.
  if (p.boss) Object.assign(p.boss, { ranged: 3, regen: true, enrage: true, leech: 0.12 });

  if (typeof document === 'undefined' || typeof requestAnimationFrame !== 'function') return;
  const game = document.getElementById('game');
  const stage = document.getElementById('stage');
  if (!game || !stage) return;

  const overlay = document.createElement('canvas');
  overlay.id = 'guardian-telegraph';
  overlay.width = game.width || 1280;
  overlay.height = game.height || 896;
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'absolute', inset: '0', width: '100%', height: 'auto',
    pointerEvents: 'none', zIndex: '5',
  });
  stage.appendChild(overlay);
  const octx = overlay.getContext && overlay.getContext('2d');

  const badge = document.createElement('div');
  badge.id = 'guardian-warning';
  badge.setAttribute('aria-live', 'polite');
  Object.assign(badge.style, {
    position: 'absolute', left: '50%', top: '12px', transform: 'translateX(-50%)',
    maxWidth: 'min(760px, 78%)', padding: '8px 12px',
    border: '1px solid rgba(242,210,123,.72)', background: 'rgba(10,7,7,.90)',
    color: '#f2d27b', font: '600 13px/1.45 "Segoe UI","Microsoft YaHei",sans-serif',
    letterSpacing: '.2px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,.38)',
    pointerEvents: 'none', zIndex: '6', opacity: '0', transition: 'opacity .12s ease',
  });
  stage.appendChild(badge);

  const SPECS = {
    20: { id: 'frost-ring', interval: 4, color: '#7ec8e3', title: copy('霜环蓄积','Frost Ring'), warn: copy('寒气将在下一回合覆盖守卫周围 2 格。离开霜环范围。','Frost will cover the 2-tile area around the guardian next turn. Leave the ring.'), radius: 2 },
    30: { id: 'ember-mark', interval: 4, color: '#ff8a45', title: copy('爆裂标记','Ember Mark'), warn: copy('脚下地块已被点燃。下一回合前离开这个格子。','Your tile is marked to ignite. Move off it before the next turn.') },
    40: { id: 'hunter-line', interval: 3, color: '#e7d7a4', title: copy('猎杀线','Hunter Line'), warn: copy('守卫锁定了一条射击线。横向/纵向侧移，或让地形挡住射线。','The guardian locks a firing line. Sidestep or break line of sight with terrain.'), range: 6 },
    50: { id: 'mending-channel', interval: 5, color: '#86d4a6', title: copy('愈合咏唱','Mending Channel'), warn: copy('守卫将在下一回合恢复大量生命。警告期间对它造成伤害即可打断。','The guardian will restore a large amount of HP next turn. Damage it during the warning to interrupt.' ) },
    60: { id: 'blood-tether', interval: 4, color: '#e05a65', title: copy('血契牵引','Blood Tether'), warn: copy('血链将在下一回合抽取近距离目标。与守卫拉开到 4 格以上。','The tether drains nearby targets next turn. Get at least 4 tiles away from the guardian.') },
    70: { id: 'rupture-cross', interval: 4, color: '#d7a640', title: copy('地脉震裂','Rupture Cross'), warn: copy('守卫将在自身横纵 3 格内震裂地面。离开十字形危险线。','The guardian ruptures the ground three tiles along its row and column. Leave the cross-shaped danger line.'), radius: 3 },
    80: { id: 'arcane-strip', interval: 4, color: '#a895ff', title: copy('星蚀弹幕','Eclipse Barrage'), warn: copy('弹幕锁定你所在的短直线。沿垂直于亮线的方向侧移一格。','The barrage locks a short line through you. Sidestep one tile perpendicular to the lit line.'), range: 2 },
  };

  const ECHO_SEQUENCE = [
    { id: 'echo-mark', interval: 3, color: '#ff8a45', title: copy('回响试炼 I · 踏焰','Echo Trial I · Step from Flame'), warn: copy('旧日爆裂标记再次出现。离开被锁定的地块。','The old Ember Mark returns. Leave the locked tile.'), sequence: true },
    { id: 'echo-line', interval: 3, color: '#e7d7a4', title: copy('回响试炼 II · 断线','Echo Trial II · Break the Line'), warn: copy('旧日猎杀线再次出现。侧移、离开射程或借墙断线。','The old Hunter Line returns. Sidestep, leave its range, or use a wall to break the line.'), range: 7, sequence: true },
    { id: 'echo-ring', interval: 3, color: '#7ec8e3', title: copy('回响试炼 III · 离环','Echo Trial III · Leave the Ring'), warn: copy('旧日霜环再次出现。离开守卫周围 2 格。','The old Frost Ring returns. Leave the 2-tile area around the guardian.'), radius: 2, sequence: true },
  ];

  const FINAL_PHASES = {
    crown: { id: 'throne-mark', interval: 3, color: '#d7a640', title: copy('终局第一相 · 王座烙印','Final Phase I · Throne Brand'), warn: copy('渊主烙印你脚下的地块。下一回合前离开。','The Abyss Sovereign brands your tile. Move before the next turn.') },
    void: { id: 'void-line', interval: 3, color: '#b49cff', title: copy('终局第二相 · 虚空裁线','Final Phase II · Void Line'), warn: copy('渊主锁定整条行列。侧移或借墙切断射线。','The Abyss Sovereign locks your entire row or column. Sidestep or break the line with a wall.'), range: 8 },
    heart: { id: 'heart-nova', interval: 2, color: '#ff6f6f', title: copy('终局第三相 · 深渊心爆','Final Phase III · Abyss Heart Nova'), warn: copy('渊主将引爆周围 2 格。停止贪刀，立刻拉开距离。','The Abyss Sovereign will detonate the surrounding 2 tiles. Stop attacking and create distance now.'), radius: 2 },
  };

  let tracked = null;
  let active = null;
  let nextSpecialTurn = Infinity;
  let lastTurn = Number(api.turns) || 0;
  let noticeUntil = 0;
  let noticeText = '';
  let noticeColor = '#f2d27b';
  let sequenceIndex = 0;
  let finalPhase = null;
  let rafId = 0;
  let syncQueued = false;

  const nowMs = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const depthNow = () => Number(api.depth) || 0;

  function loadEncounterState() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = JSON.parse(localStorage.getItem(ENCOUNTER_KEY));
      return raw && raw.v === 1 && raw.profileId === api.profileId ? raw : null;
    } catch (e) { return null; }
  }

  function clearEncounterState() {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(ENCOUNTER_KEY); } catch (e) {}
  }

  function guardianFingerprint(m) {
    return m ? {
      boss: !!m.boss,
      midBoss: !!m.midBoss,
      name: String(m.name || ''),
      maxHp: Math.max(0, Number(m.maxHp) || 0),
    } : null;
  }

  function encounterMatches(row, m) {
    if (!row || !m || Number(row.depth) !== depthNow()) return false;
    const saved = row.guardian || {}, current = guardianFingerprint(m) || {};
    if (!!saved.boss !== !!current.boss || !!saved.midBoss !== !!current.midBoss) return false;
    if (saved.name && current.name && saved.name !== current.name) return false;
    if (Number(saved.maxHp) > 0 && Number(current.maxHp) > 0 && Number(saved.maxHp) !== Number(current.maxHp)) return false;
    return true;
  }

  function guardianForDepth() {
    const list = api.monsters;
    if (!Array.isArray(list)) return null;
    const d = depthNow();
    if (d === 100) return list.find(m => m && m.boss && m.hp > 0) || null;
    return list.find(m => m && m.midBoss && m.hp > 0) || null;
  }

  function normalizeRuntimeGuardian(m, depth) {
    if (!m) return;
    if (depth === 80) {
      m.regen = false; m.enrage = false; m.enraged = false;
    } else if (depth === 90) {
      m.regen = false; m.enrage = false; m.enraged = false; m.leech = 0.10;
    } else if (depth === 100 && m.boss) {
      m.regen = false; m.enrage = false; m.enraged = false; m.leech = 0.08;
    }
  }

  function finalPhaseKey(m) {
    if (!m || !m.maxHp) return 'crown';
    const ratio = m.hp / m.maxHp;
    if (ratio > 0.66) return 'crown';
    if (ratio > 0.33) return 'void';
    return 'heart';
  }

  function specFor(depth, m) {
    if (SPECS[depth]) return SPECS[depth];
    if (depth === 90) return ECHO_SEQUENCE[sequenceIndex % ECHO_SEQUENCE.length];
    if (depth === 100 && m && m.boss) return FINAL_PHASES[finalPhaseKey(m)];
    return null;
  }

  function restoreReservedTurn() {
    if (!active || !active.guardian) return;
    const m = active.guardian;
    m.slow = active.originalSlow;
    m.skip = active.originalSkip;
  }

  function saveEncounterState() {
    const m = active && active.guardian ? active.guardian : tracked;
    if (!m || api.state !== 'playing') return false;
    const row = {
      v: 1,
      profileId: api.profileId,
      depth: depthNow(),
      turn: Number(api.turns) || 0,
      guardian: guardianFingerprint(m),
      sequenceIndex: Math.max(0, Number(sequenceIndex) || 0),
      finalPhase: finalPhase || null,
      nextSpecialTurn: Number.isFinite(nextSpecialTurn) ? Number(nextSpecialTurn) : null,
      active: active ? {
        specId: active.spec && active.spec.id || '',
        resolveTurn: Number(active.resolveTurn) || 0,
        originalSlow: !!active.originalSlow,
        originalSkip: Number(active.originalSkip) || 0,
        targetX: Number(active.targetX) || 0,
        targetY: Number(active.targetY) || 0,
        startHp: Number(active.startHp) || 0,
        axis: active.axis || null,
        line: Number.isFinite(Number(active.line)) ? Number(active.line) : null,
      } : null,
    };
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem(ENCOUNTER_KEY, JSON.stringify(row));
      return true;
    } catch (e) { return false; }
  }

  function resetEncounter(m) {
    restoreReservedTurn();
    active = null;
    tracked = m || null;
    sequenceIndex = 0;
    finalPhase = m && depthNow() === 100 ? finalPhaseKey(m) : null;
    if (m) normalizeRuntimeGuardian(m, depthNow());
    nextSpecialTurn = m && specFor(depthNow(), m) ? (Number(api.turns) || 0) + 2 : Infinity;
    if (m) saveEncounterState(); else clearEncounterState();
  }

  function showNotice(text, color, ms = 1150) {
    noticeText = text;
    noticeColor = color || '#f2d27b';
    noticeUntil = nowMs() + ms;
  }

  const lineLike = id => id === 'hunter-line' || id === 'echo-line' || id === 'void-line';

  function specById(id) {
    if (!id) return null;
    for (const spec of Object.values(SPECS)) if (spec.id === id) return spec;
    for (const spec of ECHO_SEQUENCE) if (spec.id === id) return spec;
    for (const spec of Object.values(FINAL_PHASES)) if (spec.id === id) return spec;
    return null;
  }

  function restoreEncounterState(m) {
    const row = loadEncounterState();
    if (!encounterMatches(row, m)) return false;
    tracked = m;
    sequenceIndex = Math.max(0, Math.floor(Number(row.sequenceIndex) || 0)) % ECHO_SEQUENCE.length;
    finalPhase = depthNow() === 100 && row.finalPhase && FINAL_PHASES[row.finalPhase]
      ? row.finalPhase : (depthNow() === 100 ? finalPhaseKey(m) : null);
    normalizeRuntimeGuardian(m, depthNow());
    nextSpecialTurn = Number.isFinite(Number(row.nextSpecialTurn))
      ? Number(row.nextSpecialTurn) : ((Number(api.turns) || 0) + 2);
    active = null;

    if (row.active) {
      const spec = specById(row.active.specId);
      if (spec) {
        active = {
          spec,
          guardian: m,
          resolveTurn: Number(row.active.resolveTurn) || ((Number(api.turns) || 0) + 1),
          originalSlow: !!row.active.originalSlow,
          originalSkip: Number(row.active.originalSkip) || 0,
          targetX: Number(row.active.targetX) || 0,
          targetY: Number(row.active.targetY) || 0,
          startHp: Number(row.active.startHp) || Number(m.hp) || 0,
          axis: row.active.axis === 'row' || row.active.axis === 'col' ? row.active.axis : null,
          line: Number.isFinite(Number(row.active.line)) ? Number(row.active.line) : null,
        };
        m.slow = true;
        m.skip = 0;
        showNotice(`${spec.title}: ${spec.warn}`, spec.color, 1800);
      }
    }
    return true;
  }

  function startSpecial(m, spec) {
    const player = api.player;
    if (!player || !m || !spec) return;
    active = {
      spec, guardian: m, resolveTurn: (Number(api.turns) || 0) + 1,
      originalSlow: !!m.slow, originalSkip: Number(m.skip) || 0,
      targetX: player.x, targetY: player.y, startHp: Number(m.hp) || 0,
      axis: null, line: null,
    };
    m.slow = true;
    m.skip = 0;

    if (lineLike(spec.id) || spec.id === 'arcane-strip') {
      const dx = Math.abs((player.x || 0) - (m.x || 0));
      const dy = Math.abs((player.y || 0) - (m.y || 0));
      active.axis = dx >= dy ? 'row' : 'col';
      active.line = active.axis === 'row' ? player.y : player.x;
    }
    showNotice(`${spec.title}: ${spec.warn}`, spec.color, 1800);
    saveEncounterState();
  }

  function lineClear(m, player, axis) {
    const grid = api.mapGrid;
    if (!Array.isArray(grid) || !grid.length) return true;
    if (axis === 'row') {
      if (m.y !== player.y) return false;
      const a = Math.min(m.x, player.x) + 1;
      const b = Math.max(m.x, player.x);
      for (let x = a; x < b; x++) if (grid[m.y] && grid[m.y][x] === 0) return false;
      return true;
    }
    if (m.x !== player.x) return false;
    const a = Math.min(m.y, player.y) + 1;
    const b = Math.max(m.y, player.y);
    for (let y = a; y < b; y++) if (grid[y] && grid[y][m.x] === 0) return false;
    return true;
  }

  function syncHpHud() {
    const player = api.player;
    if (!player) return;
    const max = Math.max(1, Number(api.pMaxHp && api.pMaxHp()) || 1);
    const hp = Math.max(0, Number(player.hp) || 0);
    const text = document.getElementById('st-hptext');
    const fill = document.getElementById('st-hpfill');
    if (text) text.textContent = `${hp}/${max}`;
    if (fill && fill.style) fill.style.width = `${Math.max(0, Math.min(100, hp / max * 100))}%`;
  }

  function resolveSpecial() {
    const a = active;
    if (!a) return;
    const m = a.guardian;
    const player = api.player;
    restoreReservedTurn();
    active = null;
    nextSpecialTurn = (Number(api.turns) || 0) + a.spec.interval;
    if (!m || !player || m.hp <= 0 || api.state !== 'playing') {
      clearEncounterState();
      return;
    }

    let hit = false;
    const id = a.spec.id;

    if (id === 'frost-ring' || id === 'echo-ring' || id === 'heart-nova') {
      const radius = a.spec.radius || 2;
      const dist = Math.max(Math.abs(player.x - m.x), Math.abs(player.y - m.y));
      hit = dist <= radius;
      if (hit) api.monsterAttack(m);
      const success = id === 'heart-nova'
        ? copy('心爆落空：你在最后一刻拉开了距离。','Heart Nova missed: you created distance at the last moment.')
        : copy('范围爆发落空：你及时离开了危险区。','The area burst missed: you escaped the danger zone in time.');
      showNotice(hit
        ? copy(`${a.spec.title}命中：警告区不能硬吃。`, `${a.spec.title} hit: do not stand inside the telegraphed area.`)
        : success, hit ? '#ff9d72' : '#86d4a6');
    } else if (id === 'ember-mark' || id === 'echo-mark' || id === 'throne-mark') {
      hit = player.x === a.targetX && player.y === a.targetY;
      if (hit) api.monsterAttack(m);
      showNotice(hit
        ? copy(`${a.spec.title}命中：原地贪刀付出了代价。`, `${a.spec.title} hit: greed on the marked tile cost you.`)
        : copy(`${a.spec.title}落空：你及时离开了锁定地块。`, `${a.spec.title} missed: you left the locked tile in time.`), hit ? '#ff9d72' : '#86d4a6');
    } else if (lineLike(id)) {
      const aligned = a.axis === 'row' ? player.y === a.line : player.x === a.line;
      const dist = Math.max(Math.abs(player.x - m.x), Math.abs(player.y - m.y));
      hit = aligned && dist <= (a.spec.range || 6) && lineClear(m, player, a.axis);
      if (hit) api.monsterRangedAttack(m);
      showNotice(hit
        ? copy(`${a.spec.title}命中：下一次看见锁线时侧移或断线。`, `${a.spec.title} hit: sidestep or break line of sight next time.`)
        : copy(`${a.spec.title}落空：你避开或切断了射线。`, `${a.spec.title} missed: you dodged or broke the firing line.`), hit ? '#ff9d72' : '#86d4a6');
    } else if (id === 'arcane-strip') {
      const r = a.spec.range || 2;
      hit = a.axis === 'row'
        ? player.y === a.targetY && Math.abs(player.x - a.targetX) <= r
        : player.x === a.targetX && Math.abs(player.y - a.targetY) <= r;
      if (hit) api.monsterRangedAttack(m);
      showNotice(hit
        ? copy('星蚀弹幕命中：短直线要沿垂直方向侧移。','Eclipse Barrage hit: sidestep perpendicular to the short line.')
        : copy('星蚀弹幕落空：你离开了锁定短线。','Eclipse Barrage missed: you left the locked short line.'), hit ? '#ff9d72' : '#86d4a6');
    } else if (id === 'mending-channel') {
      const interrupted = m.hp < a.startHp;
      if (interrupted) showNotice(copy('愈合咏唱被打断：持续施压阻止了这次回复。','Mending Channel interrupted: sustained pressure stopped the heal.'), '#86d4a6');
      else {
        const heal = Math.max(1, Math.round(m.maxHp * 0.15));
        m.hp = Math.min(m.maxHp, m.hp + heal);
        showNotice(copy(`愈合完成：守卫恢复了 ${heal} 点生命。`, `Mending completed: the guardian restored ${heal} HP.`), '#ffb07c');
      }
    } else if (id === 'blood-tether') {
      const dist = Math.max(Math.abs(player.x - m.x), Math.abs(player.y - m.y));
      hit = dist <= 3;
      if (hit) api.monsterAttack(m);
      showNotice(hit
        ? copy('血契抽取命中：下次在警告期间拉开到 4 格以上。','Blood Tether hit: get at least 4 tiles away during the next warning.')
        : copy('血契断裂：你成功拉开了距离。','Blood Tether broke: you created enough distance.'), hit ? '#ff9d72' : '#86d4a6');
    } else if (id === 'rupture-cross') {
      const r = a.spec.radius || 3;
      const dx = Math.abs(player.x - m.x);
      const dy = Math.abs(player.y - m.y);
      hit = (player.x === m.x && dy <= r) || (player.y === m.y && dx <= r);
      if (hit) api.monsterAttack(m);
      showNotice(hit
        ? copy('地脉震裂命中：十字线不能硬吃。','Rupture Cross hit: do not tank the cross-shaped danger line.')
        : copy('地脉震裂落空：你离开了横纵危险线。','Rupture Cross missed: you left the row-and-column danger line.'), hit ? '#ff9d72' : '#86d4a6');
    }

    if (a.spec.sequence) sequenceIndex = (sequenceIndex + 1) % ECHO_SEQUENCE.length;
    syncHpHud();
    saveEncounterState();
  }

  function processTurn() {
    const depth = depthNow();
    const m = guardianForDepth();
    if (m !== tracked) {
      if (!restoreEncounterState(m)) resetEncounter(m);
    }
    if (!m || api.state !== 'playing') return;
    normalizeRuntimeGuardian(m, depth);

    if (active && (Number(api.turns) || 0) >= active.resolveTurn) {
      resolveSpecial();
      return;
    }

    if (depth === 100 && !active) {
      const phase = finalPhaseKey(m);
      if (finalPhase && phase !== finalPhase) {
        finalPhase = phase;
        nextSpecialTurn = Math.min(nextSpecialTurn, (Number(api.turns) || 0) + 1);
        const text = phase === 'void'
          ? copy('终焉渊主进入第二阶段：王座碎裂，虚空裁线开始。','The End-Abyss Sovereign enters Phase II: the throne shatters and Void Line begins.')
          : copy('终焉渊主进入第三阶段：深渊之心暴露，心爆频率加快。','The End-Abyss Sovereign enters Phase III: the abyssal heart is exposed and Heart Nova accelerates.');
        showNotice(text, phase === 'void' ? '#b49cff' : '#ff6f6f', 1900);
        saveEncounterState();
      }
    }

    const spec = specFor(depth, m);
    if (!spec) return;
    if (!active && (Number(api.turns) || 0) >= nextSpecialTurn) {
      if (spec.id === 'mending-channel' && m.hp >= m.maxHp * 0.85) {
        nextSpecialTurn = (Number(api.turns) || 0) + 2;
        saveEncounterState();
      } else startSpecial(m, spec);
    }
  }

  function drawTelegraph() {
    if (!octx) return;
    if (overlay.width !== game.width) overlay.width = game.width;
    if (overlay.height !== game.height) overlay.height = game.height;
    octx.clearRect(0, 0, overlay.width, overlay.height);
    if (!active || !active.guardian || api.state !== 'playing') return;

    const grid = api.mapGrid;
    const cols = Array.isArray(grid) && grid[0] ? grid[0].length : 40;
    const rows = Array.isArray(grid) ? grid.length : 28;
    const tw = overlay.width / Math.max(1, cols);
    const th = overlay.height / Math.max(1, rows);
    const m = active.guardian;
    const id = active.spec.id;
    const color = active.spec.color;

    octx.save();
    octx.lineWidth = 3;
    octx.strokeStyle = color;
    octx.fillStyle = color;
    octx.globalAlpha = .18 + .06 * Math.sin(nowMs() / 110);

    if (id === 'frost-ring' || id === 'echo-ring' || id === 'heart-nova') {
      const r = active.spec.radius || 2;
      const x = (m.x - r) * tw, y = (m.y - r) * th;
      const size = r * 2 + 1;
      octx.fillRect(x, y, tw * size, th * size);
      octx.globalAlpha = .9;
      octx.strokeRect(x + 1.5, y + 1.5, tw * size - 3, th * size - 3);
    } else if (id === 'ember-mark' || id === 'echo-mark' || id === 'throne-mark') {
      const x = active.targetX * tw, y = active.targetY * th;
      octx.fillRect(x, y, tw, th);
      octx.globalAlpha = .95;
      octx.strokeRect(x + 2, y + 2, tw - 4, th - 4);
      octx.beginPath();
      octx.moveTo(x + 5, y + 5); octx.lineTo(x + tw - 5, y + th - 5);
      octx.moveTo(x + tw - 5, y + 5); octx.lineTo(x + 5, y + th - 5);
      octx.stroke();
    } else if (lineLike(id)) {
      if (active.axis === 'row') {
        const y = active.line * th;
        octx.fillRect(0, y, overlay.width, th);
        octx.globalAlpha = .95;
        octx.strokeRect(1.5, y + 2, overlay.width - 3, th - 4);
      } else {
        const x = active.line * tw;
        octx.fillRect(x, 0, tw, overlay.height);
        octx.globalAlpha = .95;
        octx.strokeRect(x + 2, 1.5, tw - 4, overlay.height - 3);
      }
    } else if (id === 'arcane-strip') {
      const r = active.spec.range || 2;
      if (active.axis === 'row') {
        const x = (active.targetX - r) * tw, y = active.targetY * th;
        octx.fillRect(x, y, tw * (r * 2 + 1), th);
        octx.globalAlpha = .95;
        octx.strokeRect(x + 1.5, y + 2, tw * (r * 2 + 1) - 3, th - 4);
      } else {
        const x = active.targetX * tw, y = (active.targetY - r) * th;
        octx.fillRect(x, y, tw, th * (r * 2 + 1));
        octx.globalAlpha = .95;
        octx.strokeRect(x + 2, y + 1.5, tw - 4, th * (r * 2 + 1) - 3);
      }
    } else if (id === 'mending-channel') {
      const x = (m.x - 1) * tw, y = (m.y - 1) * th;
      octx.fillRect(x, y, tw * 3, th * 3);
      octx.globalAlpha = .95;
      octx.strokeRect(x + 2, y + 2, tw * 3 - 4, th * 3 - 4);
    } else if (id === 'blood-tether') {
      const player = api.player;
      if (player) {
        octx.globalAlpha = .9; octx.lineWidth = 5;
        octx.beginPath();
        octx.moveTo((m.x + .5) * tw, (m.y + .5) * th);
        octx.lineTo((player.x + .5) * tw, (player.y + .5) * th);
        octx.stroke();
      }
    } else if (id === 'rupture-cross') {
      const r = active.spec.radius || 3;
      const x0 = Math.max(0, m.x - r) * tw, x1 = Math.min(cols, m.x + r + 1) * tw;
      const y0 = Math.max(0, m.y - r) * th, y1 = Math.min(rows, m.y + r + 1) * th;
      octx.fillRect(x0, m.y * th, x1 - x0, th);
      octx.fillRect(m.x * tw, y0, tw, y1 - y0);
      octx.globalAlpha = .95;
      octx.strokeRect(x0 + 1, m.y * th + 2, x1 - x0 - 2, th - 4);
      octx.strokeRect(m.x * tw + 2, y0 + 1, tw - 4, y1 - y0 - 2);
    }
    octx.restore();
  }

  function syncEncounter() {
    const turn = Number(api.turns) || 0;
    const guardianChanged = guardianForDepth() !== tracked;
    if (turn !== lastTurn || guardianChanged) {
      lastTurn = turn;
      processTurn();
    }
    const currentGuardian = guardianForDepth();
    if (!currentGuardian && tracked) resetEncounter(null);
    else if (!currentGuardian && api.state === 'playing') clearEncounterState();
  }

  function warningVisible(now = nowMs()) {
    return !!active || noticeUntil > now;
  }

  function paintWarning(now = nowMs()) {
    drawTelegraph();
    if (active) {
      badge.textContent = `${active.spec.title} · ${active.spec.warn}`;
      badge.style.color = active.spec.color;
      badge.style.borderColor = active.spec.color;
      badge.style.opacity = '1';
    } else if (noticeUntil > now) {
      badge.textContent = noticeText;
      badge.style.color = noticeColor;
      badge.style.borderColor = noticeColor;
      badge.style.opacity = '1';
    } else badge.style.opacity = '0';
  }

  function frame(now) {
    rafId = 0;
    const t = Number(now) || nowMs();
    if (document.hidden || api.state !== 'playing' || !warningVisible(t)) {
      paintWarning(t);
      return;
    }
    paintWarning(t);
    rafId = requestAnimationFrame(frame);
  }

  function startWarningLoop() {
    if (rafId || document.hidden || api.state !== 'playing' || !warningVisible()) return false;
    rafId = requestAnimationFrame(frame);
    return true;
  }

  function stopWarningLoop(clear = true) {
    if (rafId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
    const had = !!rafId;
    rafId = 0;
    if (clear) {
      if (octx) octx.clearRect(0, 0, overlay.width, overlay.height);
      badge.style.opacity = '0';
    }
    return had;
  }

  function syncLifecycle() {
    syncEncounter();
    const t = nowMs();
    paintWarning(t);
    if (!document.hidden && api.state === 'playing' && warningVisible(t)) return startWarningLoop();
    stopWarningLoop(true);
    return false;
  }

  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  function scheduleSync() {
    if (syncQueued) return false;
    syncQueued = true;
    defer(() => {
      syncQueued = false;
      syncLifecycle();
    });
    return true;
  }

  // Capture player actions before later owners can stop propagation; the microtask observes
  // the completed turn. Lifecycle events cover reload/resume without an idle animation loop.
  window.addEventListener('keydown', scheduleSync, true);
  window.addEventListener('click', scheduleSync, true);
  document.addEventListener('visibilitychange', syncLifecycle);
  window.addEventListener('focus', syncLifecycle);
  window.addEventListener('pageshow', syncLifecycle);
  window.addEventListener('pagehide', () => stopWarningLoop(false));
  window.addEventListener('resize', scheduleSync, { passive:true });

  window.DE_GUARDIAN_ENCOUNTER_STATE = {
    version: 'v3',
    owner: 'content-system',
    locale: english ? 'en' : 'zh-CN',
    load: loadEncounterState,
    save: saveEncounterState,
    clear: clearEncounterState,
    restore: restoreEncounterState,
    get active() { return active ? { specId: active.spec && active.spec.id, resolveTurn: active.resolveTurn, targetX: active.targetX, targetY: active.targetY, axis: active.axis, line: active.line } : null; },
    get sequenceIndex() { return sequenceIndex; },
    get nextSpecialTurn() { return nextSpecialTurn; },
    get animating() { return !!rafId; },
    sync: syncLifecycle,
    schedule: scheduleSync,
  };

  syncLifecycle();
})();
