/* Dungeon Echo production content bridge v3.
 * Keeps late-game chapter palettes and guardian content data in one place, then layers
 * the first bespoke, readable guardian state machines on top of the core turn engine.
 *
 * v3 encounter slice:
 * - floor 20: Frost Ring — radius-2 pulse, one full turn of warning; step out of range.
 * - floor 30: Ember Mark — marks the player's current tile; move off it before detonation.
 * - floor 40: Hunter Line — locks a row/column; sidestep or use terrain before the shot.
 * - floor 50: Mending Channel — interrupt the heal by damaging the guardian during the tell.
 * - floor 60: Blood Tether — break beyond range 3 before the drain resolves.
 * - floor 70: Rupture Cross — leave the guardian's short row/column blast lanes.
 *
 * These mechanics deliberately keep save schemas unchanged. Encounter telegraph state is
 * transient and is safely rebuilt after a reload instead of being serialized into saves.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__DE_CONTENT_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !api.runProfile) return;
  window.__DE_CONTENT_SYSTEM = 'v3';

  const p = api.runProfile;

  if (Array.isArray(p.themes) && p.themes.length === 21) {
    p.themes.push(
      { name: '噤声王庭', fl: '#11131d', fl2: '#0e1019', sp1: '#080a12', sp2: '#202536', wa: '#2b3144', wl: '#151925', wh: 'rgba(185,198,235,.10)' },
      { name: '黑星墓海', fl: '#17121d', fl2: '#120e19', sp1: '#0b0810', sp2: '#2a2034', wa: '#382b42', wl: '#1b1422', wh: 'rgba(208,176,230,.10)' },
      { name: '终末天井', fl: '#211014', fl2: '#1a0c10', sp1: '#100609', sp2: '#351920', wa: '#47212a', wl: '#210f15', wh: 'rgba(245,155,170,.11)' },
      { name: '回响王座', fl: '#0d0918', fl2: '#090612', sp1: '#05030c', sp2: '#211332', wa: '#301b48', wl: '#120a20', wh: 'rgba(210,185,255,.14)' }
    );
  }

  const guardians = Array.isArray(p.midBosses) ? p.midBosses : [];
  const patch = {
    10: { armorBreak: true },
    20: { regen: true },
    30: { boom: true },
    40: { ranged: 4 },
    50: { ranged: 2 },
    60: { leech: 0.20 },
    70: { regen: true, boom: true },
    80: { ranged: 3, regen: true },
    90: { ranged: 3, enrage: true, leech: 0.15 },
  };
  for (const g of guardians) {
    const extra = patch[g && g.depth];
    if (extra) Object.assign(g, extra);
  }

  if (p.boss) {
    Object.assign(p.boss, { ranged: 3, regen: true, enrage: true, leech: 0.12 });
  }

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
    20: { id: 'frost-ring', interval: 4, color: '#7ec8e3', title: '霜环蓄积', warn: '寒气将在下一回合覆盖守卫周围 2 格。离开霜环范围。' },
    30: { id: 'ember-mark', interval: 4, color: '#ff8a45', title: '爆裂标记', warn: '脚下地块已被点燃。下一回合前离开这个格子。' },
    40: { id: 'hunter-line', interval: 3, color: '#e7d7a4', title: '猎杀线', warn: '守卫锁定了一条射击线。横向/纵向侧移，或让地形挡住射线。' },
    50: { id: 'mending-channel', interval: 5, color: '#86d4a6', title: '愈合咏唱', warn: '守卫将在下一回合恢复大量生命。警告期间对它造成伤害即可打断。' },
    60: { id: 'blood-tether', interval: 4, color: '#e05a65', title: '血契牵引', warn: '血链将在下一回合抽取近距离目标。与守卫拉开到 4 格以上。' },
    70: { id: 'rupture-cross', interval: 4, color: '#d7a640', title: '地脉震裂', warn: '守卫将在自身横纵 3 格内震裂地面。离开十字形危险线。' },
  };

  let tracked = null;
  let active = null;
  let nextSpecialTurn = Infinity;
  let lastTurn = Number(api.turns) || 0;
  let noticeUntil = 0;
  let noticeText = '';
  let noticeColor = '#f2d27b';

  const nowMs = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

  function guardianForDepth() {
    const list = api.monsters;
    if (!Array.isArray(list)) return null;
    return list.find(m => m && m.midBoss && m.hp > 0) || null;
  }

  function restoreReservedTurn() {
    if (!active || !active.guardian) return;
    const m = active.guardian;
    m.slow = active.originalSlow;
    m.skip = active.originalSkip;
  }

  function resetEncounter(m) {
    restoreReservedTurn();
    active = null;
    tracked = m || null;
    nextSpecialTurn = m && SPECS[api.depth] ? (Number(api.turns) || 0) + 2 : Infinity;
  }

  function showNotice(text, color, ms = 1150) {
    noticeText = text;
    noticeColor = color || '#f2d27b';
    noticeUntil = nowMs() + ms;
  }

  function startSpecial(m, spec) {
    const player = api.player;
    if (!player || !m) return;
    active = {
      spec, guardian: m, resolveTurn: (Number(api.turns) || 0) + 1,
      originalSlow: !!m.slow, originalSkip: Number(m.skip) || 0,
      targetX: player.x, targetY: player.y, startHp: Number(m.hp) || 0,
      axis: null, line: null,
    };
    m.slow = true;
    m.skip = 0;
    if (spec.id === 'hunter-line') {
      const dx = Math.abs((player.x || 0) - (m.x || 0));
      const dy = Math.abs((player.y || 0) - (m.y || 0));
      active.axis = dx >= dy ? 'row' : 'col';
      active.line = active.axis === 'row' ? player.y : player.x;
    }
    showNotice(`${spec.title}：${spec.warn}`, spec.color, 1800);
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
    if (!m || !player || m.hp <= 0 || api.state !== 'playing') return;

    let hit = false;
    if (a.spec.id === 'frost-ring') {
      const dist = Math.max(Math.abs(player.x - m.x), Math.abs(player.y - m.y));
      hit = dist <= 2;
      if (hit) api.monsterAttack(m);
      showNotice(hit ? '霜环命中：你没能及时离开寒气范围。' : '霜环落空：你成功退出了寒气范围。', hit ? '#ff9d72' : '#86d4a6');
    } else if (a.spec.id === 'ember-mark') {
      hit = player.x === a.targetX && player.y === a.targetY;
      if (hit) api.monsterAttack(m);
      showNotice(hit ? '爆裂标记引爆：原地贪刀付出了代价。' : '爆裂标记落空：你及时离开了燃烧地块。', hit ? '#ff9d72' : '#86d4a6');
    } else if (a.spec.id === 'hunter-line') {
      const aligned = a.axis === 'row' ? player.y === a.line : player.x === a.line;
      const dist = Math.max(Math.abs(player.x - m.x), Math.abs(player.y - m.y));
      hit = aligned && dist <= 6 && lineClear(m, player, a.axis);
      if (hit) api.monsterRangedAttack(m);
      showNotice(hit ? '猎杀线命中：下一次看见锁线时侧移一格。' : '猎杀线落空：你避开或切断了射线。', hit ? '#ff9d72' : '#86d4a6');
    } else if (a.spec.id === 'mending-channel') {
      const interrupted = m.hp < a.startHp;
      if (interrupted) showNotice('愈合咏唱被打断：持续施压阻止了这次回复。', '#86d4a6');
      else {
        const heal = Math.max(1, Math.round(m.maxHp * 0.15));
        m.hp = Math.min(m.maxHp, m.hp + heal);
        showNotice(`愈合完成：守卫恢复了 ${heal} 点生命。`, '#ffb07c');
      }
    } else if (a.spec.id === 'blood-tether') {
      const dist = Math.max(Math.abs(player.x - m.x), Math.abs(player.y - m.y));
      hit = dist <= 3;
      if (hit) api.monsterAttack(m);
      showNotice(hit ? '血契抽取命中：下次在警告期间拉开到 4 格以上。' : '血契断裂：你成功拉开了距离。', hit ? '#ff9d72' : '#86d4a6');
    } else if (a.spec.id === 'rupture-cross') {
      const dx = Math.abs(player.x - m.x);
      const dy = Math.abs(player.y - m.y);
      hit = (player.x === m.x && dy <= 3) || (player.y === m.y && dx <= 3);
      if (hit) api.monsterAttack(m);
      showNotice(hit ? '地脉震裂命中：十字线不能硬吃。' : '地脉震裂落空：你离开了横纵危险线。', hit ? '#ff9d72' : '#86d4a6');
    }
    syncHpHud();
  }

  function processTurn() {
    const depth = Number(api.depth) || 0;
    const spec = SPECS[depth];
    const m = guardianForDepth();
    if (m !== tracked) resetEncounter(m);
    if (!spec || !m || api.state !== 'playing') return;
    if (active && (Number(api.turns) || 0) >= active.resolveTurn) {
      resolveSpecial();
      return;
    }
    if (!active && (Number(api.turns) || 0) >= nextSpecialTurn) {
      if (spec.id === 'mending-channel' && m.hp >= m.maxHp * 0.85) nextSpecialTurn = (Number(api.turns) || 0) + 2;
      else startSpecial(m, spec);
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
    const color = active.spec.color;
    octx.save();
    octx.lineWidth = 3;
    octx.strokeStyle = color;
    octx.fillStyle = color;
    octx.globalAlpha = .18 + .06 * Math.sin(nowMs() / 110);

    if (active.spec.id === 'frost-ring') {
      const x = (m.x - 2) * tw, y = (m.y - 2) * th;
      octx.fillRect(x, y, tw * 5, th * 5);
      octx.globalAlpha = .9;
      octx.strokeRect(x + 1.5, y + 1.5, tw * 5 - 3, th * 5 - 3);
    } else if (active.spec.id === 'ember-mark') {
      const x = active.targetX * tw, y = active.targetY * th;
      octx.fillRect(x, y, tw, th);
      octx.globalAlpha = .95;
      octx.strokeRect(x + 2, y + 2, tw - 4, th - 4);
      octx.beginPath();
      octx.moveTo(x + 5, y + 5); octx.lineTo(x + tw - 5, y + th - 5);
      octx.moveTo(x + tw - 5, y + 5); octx.lineTo(x + 5, y + th - 5);
      octx.stroke();
    } else if (active.spec.id === 'hunter-line') {
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
    } else if (active.spec.id === 'mending-channel') {
      const x = (m.x - 1) * tw, y = (m.y - 1) * th;
      octx.fillRect(x, y, tw * 3, th * 3);
      octx.globalAlpha = .95;
      octx.strokeRect(x + 2, y + 2, tw * 3 - 4, th * 3 - 4);
    } else if (active.spec.id === 'blood-tether') {
      const player = api.player;
      if (player) {
        octx.globalAlpha = .9;
        octx.lineWidth = 5;
        octx.beginPath();
        octx.moveTo((m.x + .5) * tw, (m.y + .5) * th);
        octx.lineTo((player.x + .5) * tw, (player.y + .5) * th);
        octx.stroke();
      }
    } else if (active.spec.id === 'rupture-cross') {
      const x0 = Math.max(0, m.x - 3) * tw;
      const x1 = Math.min(cols, m.x + 4) * tw;
      const y0 = Math.max(0, m.y - 3) * th;
      const y1 = Math.min(rows, m.y + 4) * th;
      octx.fillRect(x0, m.y * th, x1 - x0, th);
      octx.fillRect(m.x * tw, y0, tw, y1 - y0);
      octx.globalAlpha = .95;
      octx.strokeRect(x0 + 1, m.y * th + 2, x1 - x0 - 2, th - 4);
      octx.strokeRect(m.x * tw + 2, y0 + 1, tw - 4, y1 - y0 - 2);
    }
    octx.restore();
  }

  function frame() {
    const turn = Number(api.turns) || 0;
    if (turn !== lastTurn) {
      lastTurn = turn;
      processTurn();
    }
    const currentGuardian = guardianForDepth();
    if (!currentGuardian && tracked) resetEncounter(null);
    drawTelegraph();
    const t = nowMs();
    if (active) {
      badge.textContent = `${active.spec.title} · ${active.spec.warn}`;
      badge.style.color = active.spec.color;
      badge.style.borderColor = active.spec.color;
      badge.style.opacity = '1';
    } else if (noticeUntil > t) {
      badge.textContent = noticeText;
      badge.style.color = noticeColor;
      badge.style.borderColor = noticeColor;
      badge.style.opacity = '1';
    } else badge.style.opacity = '0';
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
