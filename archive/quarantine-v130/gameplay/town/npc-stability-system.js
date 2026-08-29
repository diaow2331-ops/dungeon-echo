/* Dungeon Echo NPC stability owner v5.
 * Removes consumed one-shot utility NPCs and relocates utility spawns away from
 * narrow chokepoints without changing interaction rewards or persistence schemas.
 *
 * v4 made the expensive map-wide relocation pass floor/NPC-set scoped. v5 also
 * narrows post-action cleanup scheduling to interactions that can actually move the
 * player, consume a utility NPC, restore a run, or create/leave a floor.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_DISPOSABLE_NPC_CLEANUP) return;

  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const disposable = new Set(['shrine', 'rest']);
  const utilities = new Set(['shrine', 'rest', 'shop']);
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
  const ACTION_KEYS = new Set([
    'ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D',
    'Enter','n','N','PageDown','>',
  ]);
  const ACTION_TARGETS = [
    '[data-act="up"]','[data-act="down"]','[data-act="left"]','[data-act="right"]',
    '#game','#btn-shrine-ok','#descend-fab','#btn-depart','#btn-continue','[data-class]','[data-checkpoint]',
  ].join(',');
  let queued = false;
  let queuedForce = false;
  let lastNpcList = null;
  let lastDepth = null;
  let lastCount = -1;

  function cleanup() {
    const list = api.npcs;
    if (!Array.isArray(list) || !list.length) return 0;
    let removed = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const npc = list[i];
      if (!npc || !npc.used || !disposable.has(String(npc.type || ''))) continue;
      list.splice(i, 1);
      removed++;
    }
    return removed;
  }

  function walkableNeighbors(grid, x, y) {
    let n = 0;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (ny >= 0 && ny < grid.length && grid[ny] && nx >= 0 && nx < grid[ny].length && grid[ny][nx] !== 0) n++;
    }
    return n;
  }

  function occupied(x, y, self) {
    const p = api.player;
    if (p && p.x === x && p.y === y) return true;
    if ((api.monsters || []).some(m => m && m.hp > 0 && m.x === x && m.y === y)) return true;
    if ((api.items || []).some(it => it && it.x === x && it.y === y)) return true;
    return (api.npcs || []).some(n => n && n !== self && n.x === x && n.y === y);
  }

  function relocateChokepoints() {
    const grid = api.mapGrid;
    const list = api.npcs;
    if (!Array.isArray(grid) || !grid.length || !Array.isArray(list) || !list.length) return 0;
    let moved = 0;
    for (const npc of list) {
      if (!npc || !utilities.has(String(npc.type || ''))) continue;
      const x0 = Number(npc.x), y0 = Number(npc.y);
      if (!Number.isFinite(x0) || !Number.isFinite(y0)) continue;
      if (walkableNeighbors(grid, x0, y0) >= 3) continue;

      let best = null;
      for (let y = 1; y < grid.length - 1; y++) {
        const row = grid[y];
        if (!row) continue;
        for (let x = 1; x < row.length - 1; x++) {
          if (row[x] !== 1 || occupied(x, y, npc)) continue;
          const exits = walkableNeighbors(grid, x, y);
          if (exits < 3) continue;
          const dist = Math.abs(x - x0) + Math.abs(y - y0);
          const score = dist * 10 - exits;
          if (!best || score < best.score) best = { x, y, score };
        }
      }
      if (!best) continue;
      npc.x = npc.fx = best.x;
      npc.y = npc.fy = best.y;
      moved++;
    }
    return moved;
  }

  function relocationNeeded(force=false) {
    if (force) return true;
    const list = api.npcs;
    const count = Array.isArray(list) ? list.length : 0;
    return list !== lastNpcList || Number(api.depth) !== lastDepth || count !== lastCount;
  }

  function rememberNpcSet() {
    const list = api.npcs;
    lastNpcList = list;
    lastDepth = Number(api.depth);
    lastCount = Array.isArray(list) ? list.length : 0;
  }

  function stabilize(force=false) {
    const removed = cleanup();
    const moved = relocationNeeded(force) ? relocateChokepoints() : 0;
    rememberNpcSet();
    const changed = removed + moved;
    if (changed && typeof api.persistRun === 'function' && (api.state === 'playing' || api.state === 'town')) {
      api.persistRun();
    }
    return changed;
  }

  function schedule(force=false) {
    if (force) queuedForce = true;
    if (queued) return false;
    queued = true;
    queueMicrotask(() => {
      const forceNow = queuedForce;
      queuedForce = false;
      queued = false;
      stabilize(forceNow);
    });
    return true;
  }

  function scheduleFromKey(e) {
    if (!e || !ACTION_KEYS.has(String(e.key || ''))) return false;
    return schedule(false);
  }

  function scheduleFromClick(e) {
    const t = e && e.target;
    if (!t || typeof t.closest !== 'function' || !t.closest(ACTION_TARGETS)) return false;
    return schedule(false);
  }

  document.addEventListener('keydown', scheduleFromKey, false);
  document.addEventListener('click', scheduleFromClick, false);
  stabilize(true);

  window.__DE_DISPOSABLE_NPC_CLEANUP = {
    version:'p0-v5',
    owner:'npc-stability-system',
    cleanup,
    relocateChokepoints,
    relocationNeeded,
    stabilize,
    schedule,
    scheduleFromKey,
    scheduleFromClick,
    walkableNeighbors,
    get relocationStamp(){ return { depth:lastDepth, count:lastCount, list:lastNpcList }; },
  };
})();
