/* Dungeon Echo production bootstrap.
 * Public builds always enter the single 1→100 expedition. Internal short profiles
 * remain available through dev/test harnesses, but are never selected by index.html.
 *
 * v1.1 art bridge: route the legacy loot-atlas path to the completed unified
 * equipment atlas without changing any equipment IDs, save keys or save schemas.
 *
 * Gameplay risk/reward interactions live in risk-reward-system.js and permanent
 * progression guards live in progression-guard-system.js. Bootstrap owns production
 * entry policy, presentation compatibility and NPC stabilization only.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;

  const EQUIPMENT_ATLAS = 'art/loot-atlas-v12.svg';

  try {
    if (typeof document !== 'undefined' && !window.__DE_EQUIPMENT_ART_V12) {
      window.__DE_EQUIPMENT_ART_V12 = true;

      const style = document.createElement('style');
      style.id = 'de-equipment-art-v12';
      style.textContent = `.loot-icon{background-image:url("${EQUIPMENT_ATLAS}")!important}`;
      document.head.appendChild(style);

      if (typeof HTMLImageElement !== 'undefined') {
        const proto = HTMLImageElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'src');
        if (desc && desc.get && desc.set) {
          Object.defineProperty(proto, 'src', {
            configurable: desc.configurable,
            enumerable: desc.enumerable,
            get: desc.get,
            set(value) {
              const raw = String(value == null ? '' : value);
              const next = /(?:^|\/)art\/loot-atlas\.png(?:[?#].*)?$/.test(raw)
                ? EQUIPMENT_ATLAS : value;
              return desc.set.call(this, next);
            },
          });
        }
      }
    }
  } catch (e) {
    // Art routing is presentation-only. If a restrictive browser rejects the bridge,
    // the original atlas remains a safe fallback and gameplay still boots.
  }

  if (typeof location !== 'undefined') {
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('profile') !== 'classic-100') {
        url.searchParams.set('profile', 'classic-100');
        if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
          history.replaceState(null, '', url.href);
        }
      }
    } catch (e) {
      // Production hosting is normal http(s). If a non-standard shell rejects URL/history,
      // game.js will fail closed rather than silently selecting an arbitrary short profile.
    }
  }

  function installDisposableNpcCleanup() {
    if (window.__DE_DISPOSABLE_NPC_CLEANUP) return;
    const api = window.DE_TEST;
    if (!api || api.profileId !== 'classic-100' || typeof document === 'undefined') return;
    const disposable = new Set(['shrine', 'rest']);
    const utilities = new Set(['shrine', 'rest', 'shop']);
    const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];

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

    function stabilize() {
      const changed = cleanup() + relocateChokepoints();
      if (changed && typeof api.persistRun === 'function' && (api.state === 'playing' || api.state === 'town')) {
        api.persistRun();
      }
      return changed;
    }

    function schedule() { queueMicrotask(stabilize); }
    document.addEventListener('keydown', schedule, false);
    document.addEventListener('click', schedule, false);
    stabilize();
    window.__DE_DISPOSABLE_NPC_CLEANUP = {
      version: 'p0-v2', cleanup, relocateChokepoints, stabilize, walkableNeighbors,
    };
  }

  function installPostBootGuards() {
    installDisposableNpcCleanup();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading' || !document.readyState)
      window.addEventListener('DOMContentLoaded', installPostBootGuards, { once: true });
    else installPostBootGuards();
  }
})();
