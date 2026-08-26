/* Dungeon Echo production bootstrap.
 * Public builds always enter the single 1→100 expedition. Internal short profiles
 * remain available through dev/test harnesses, but are never selected by index.html.
 *
 * v1.1 art bridge: route the legacy loot-atlas path to the completed unified
 * equipment atlas without changing any equipment IDs, save keys or save schemas.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;

  const EQUIPMENT_ATLAS = 'art/loot-atlas-v12.svg';

  try {
    if (typeof document !== 'undefined' && !window.__DE_EQUIPMENT_ART_V12) {
      window.__DE_EQUIPMENT_ART_V12 = true;

      // Backpack/equipment-bar icons are CSS background sprites. Override only the
      // atlas URL; the existing 4×8 coordinates and item identities remain intact.
      const style = document.createElement('style');
      style.id = 'de-equipment-art-v12';
      style.textContent = `.loot-icon{background-image:url("${EQUIPMENT_ATLAS}")!important}`;
      document.head.appendChild(style);

      // Ground loot is drawn by game.js through an Image instance created later in
      // boot. Intercept only the legacy loot atlas source and leave every other image
      // untouched. This keeps game.js and save-compatible item IDs unchanged.
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
        // Avoid an extra network/navigation round-trip before game.js boots.
        if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
          history.replaceState(null, '', url.href);
        }
      }
    } catch (e) {
      // Production hosting is normal http(s). If a non-standard shell rejects URL/history,
      // game.js will fail closed rather than silently selecting an arbitrary short profile.
    }
  }

  // The permanent-growth guard is installed after all synchronous production scripts have
  // booted. At the cap, core killMonster() must never see enough XP to create a transient
  // level/talent before gameplay-tuning's compatibility clamp runs.
  function installXpCapGuard() {
    if (window.__DE_XP_CAP_GUARD) return;
    const api = window.DE_TEST;
    if (!api || api.profileId !== 'classic-100' || typeof document === 'undefined') return;
    const KEY = 'de-progression-guard-v1';
    const DEFAULT_CAP = 50;

    function levelCap() {
      const meta = api.meta;
      if (!meta) return null;
      const id = meta.classId || api.classId || 'warrior';
      try {
        const raw = JSON.parse(localStorage.getItem(KEY));
        const row = raw && raw.v === 1 && raw.classes && raw.classes[id];
        return Math.max(DEFAULT_CAP, Number(row && row.legacyLvl) || 1);
      } catch (e) {
        return DEFAULT_CAP;
      }
    }

    function hold() {
      const p = api.player;
      const cap = levelCap();
      if (!p || !cap || (Number(p.lvl) || 1) < cap) return null;
      const keep = Math.min(Math.max(0, Number(p.xp) || 0), cap * 15 - 1);
      p.xp = -1000000000;
      return () => {
        if (api.player === p) p.xp = keep;
      };
    }

    function arm() {
      if (api.state !== 'playing') return;
      const release = hold();
      if (release) queueMicrotask(release);
    }

    // Document capture runs after gameplay-tuning's window-capture equipment snapshot,
    // but before the core's target/bubble handlers. For equipment, its queued synthetic
    // endTurn therefore executes while XP is parked; release follows in the next microtask.
    document.addEventListener('keydown', arm, true);
    document.addEventListener('click', arm, true);
    window.__DE_XP_CAP_GUARD = { version: 'p0-v1', levelCap, hold };
  }

  // Non-hostile dungeon interactables must not become route blockers. Consumed one-shot
  // entities leave the collision array, while live utility NPCs that spawned in a narrow
  // corridor are moved to the nearest open floor tile with at least three walkable exits.
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
    installXpCapGuard();
    installDisposableNpcCleanup();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading' || !document.readyState)
      window.addEventListener('DOMContentLoaded', installPostBootGuards, { once: true });
    else installPostBootGuards();
  }
})();
