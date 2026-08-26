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

    document.addEventListener('keydown', arm, true);
    document.addEventListener('click', arm, true);
    window.__DE_XP_CAP_GUARD = { version: 'p0-v1', levelCap, hold };
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

  function installRiskRewardInteractions() {
    if (window.__DE_RISK_REWARD_INTERACTIONS) return;
    const api = window.DE_TEST;
    if (!api || api.profileId !== 'classic-100' || typeof document === 'undefined') return;
    const resolvedCasks = new WeakSet();
    const originalTryMove = api.tryMove;
    const originalUseSkill = api.useSkill;
    const originalPickupHere = api.pickupHere;

    function hash32(text) {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      h ^= h >>> 13;
      h = Math.imul(h, 0x5bd1e995) >>> 0;
      h ^= h >>> 15;
      return h >>> 0;
    }

    function rollFor(tag) {
      const p = api.player || {};
      const key = [api.seed || '', api.depth || 0, api.turns || 0, p.x || 0, p.y || 0, tag].join('|');
      return hash32(key) / 4294967296;
    }

    function escHtml(value) {
      return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }

    function surfaceMessage(text, cls) {
      const log = document.getElementById && document.getElementById('log');
      if (log && typeof log.insertAdjacentHTML === 'function') {
        log.insertAdjacentHTML('afterbegin', `<div${cls ? ` class="${escHtml(cls)}"` : ''}>${escHtml(text)}</div>`);
      }
      const hint = document.getElementById && document.getElementById('hint');
      if (hint) hint.textContent = `› ${text}`;
    }

    function removeNpc(npc) {
      const list = api.npcs;
      if (!Array.isArray(list)) return false;
      const i = list.indexOf(npc);
      if (i < 0) return false;
      list.splice(i, 1);
      return true;
    }

    function dropEquip(loot, x, y) {
      const p = api.player;
      if (!p || !loot) return false;
      p.inv = Array.isArray(p.inv) ? p.inv : [];
      if (p.inv.length < 12) {
        p.inv.push(loot);
        return true;
      }
      if (Array.isArray(api.items)) {
        api.items.push({ type:'equip', item:loot, emoji:'', name:'装备', x, y });
      }
      return false;
    }

    function spawnThreat(count, opts = {}) {
      const pool = typeof api.monsterPoolFor === 'function' ? api.monsterPoolFor(api.depth) : [];
      if (!Array.isArray(pool) || !pool.length || !Array.isArray(api.monsters)) return 0;
      let spawned = 0;
      for (let i = 0; i < count; i++) {
        const pos = typeof api.pickSpawn === 'function' ? api.pickSpawn(opts.minDist || 3) : null;
        if (!pos) break;
        const r = rollFor(`${opts.tag || 'threat'}:${i}`);
        const base = pool[Math.min(pool.length - 1, Math.floor(r * pool.length))];
        const m = typeof api.makeMonster === 'function' ? api.makeMonster(base, pos) : null;
        if (!m) continue;
        if (opts.elite) {
          m.elite = true;
          m.name = `祭坛守卫·${String(m.name || '怪物').replace(/^精英·/, '')}`;
          m.maxHp = Math.max(1, Math.round((Number(m.maxHp) || Number(m.hp) || 1) * 1.25));
          m.hp = m.maxHp;
          m.atk = Math.max(1, Math.round((Number(m.atk) || 1) * 1.15));
          m.atkOrigin = m.atk;
          m.xp = Math.max(1, Math.round((Number(m.xp) || 1) * 1.4));
        }
        api.monsters.push(m);
        spawned++;
      }
      return spawned;
    }

    function shrineOutcomeFor(npc, forcedRoll) {
      const r = Number.isFinite(forcedRoll) ? Math.max(0, Math.min(.999999, forcedRoll))
        : rollFor(`shrine:${npc && npc.x}:${npc && npc.y}`);
      if (r < .28) return 'mending';
      if (r < .50) return 'blood-offering';
      if (r < .70) return 'greed-contract';
      if (r < .88) return 'guardian-trial';
      return 'curse';
    }

    function resolveShrine(npc, forcedRoll) {
      const p = api.player;
      if (!npc || npc.used || !p) return null;
      npc.used = true;
      removeNpc(npc);
      const outcome = shrineOutcomeFor(npc, forcedRoll);
      let text = '';
      let cls = 'good';

      if (outcome === 'mending') {
        const maxHp = typeof api.pMaxHp === 'function' ? Math.max(1, Number(api.pMaxHp()) || 1) : Math.max(1, Number(p.hpBase) || 1);
        const heal = Math.min(Math.max(0, maxHp - (Number(p.hp) || 0)), Math.max(6, Math.round(maxHp * .35)));
        if (heal > 0) {
          p.hp += heal;
          p.poison = 0;
          text = `神龛洗净伤口，恢复 ${heal} 点生命。`;
        } else {
          p.potions = (Number(p.potions) || 0) + 1;
          text = '神龛的余辉凝成一瓶药水。';
        }
      } else if (outcome === 'blood-offering') {
        const maxHp = typeof api.pMaxHp === 'function' ? Math.max(1, Number(api.pMaxHp()) || 1) : Math.max(1, Number(p.hpBase) || 1);
        const cost = Math.max(1, Math.round(maxHp * .18));
        p.hp = Math.max(1, (Number(p.hp) || 1) - cost);
        const loot = typeof api.genEquip === 'function' ? api.genEquip(api.depth, 2) : null;
        if (loot) dropEquip(loot, npc.x, npc.y);
        text = loot ? `神龛索取 ${cost} 点生命，吐出祭品【${loot.name}】。` : `神龛索取 ${cost} 点生命，却只留下空响。`;
        cls = 'epic';
      } else if (outcome === 'greed-contract') {
        const gold = 18 + Math.max(1, Number(api.depth) || 1) * 3;
        p.gold = (Number(p.gold) || 0) + gold;
        const spawned = spawnThreat(2, { minDist:3, tag:`shrine-greed:${npc.x}:${npc.y}` });
        text = `你从祭坛夺走 ${gold} 金币，${spawned} 个被惊醒的敌人开始追来。`;
        cls = 'bad';
      } else if (outcome === 'guardian-trial') {
        const spawned = spawnThreat(1, { minDist:4, elite:true, tag:`shrine-elite:${npc.x}:${npc.y}` });
        text = spawned ? '神龛唤来一名祭坛守卫——击败它，史诗战利品才真正属于你。' : '神龛震动片刻，挑战却没有成形。';
        cls = spawned ? 'bad' : 'dim';
      } else {
        p.grievous = Math.max(Number(p.grievous) || 0, 4);
        p.poison = Math.max(Number(p.poison) || 0, 3);
        text = '神龛反噬：重伤与毒素同时缠上身体。';
        cls = 'bad';
      }

      if (typeof api.endTurn === 'function' && api.state === 'playing') api.endTurn();
      surfaceMessage(text, cls);
      if (typeof api.persistRun === 'function' && (api.state === 'playing' || api.state === 'town')) api.persistRun();
      return outcome;
    }

    function resolveCaskRisk(cask, forcedRoll) {
      const p = api.player;
      if (!cask || !p || resolvedCasks.has(cask)) return 'none';
      resolvedCasks.add(cask);
      const r = Number.isFinite(forcedRoll) ? Math.max(0, Math.min(.999999, forcedRoll))
        : rollFor(`cask:${cask.x}:${cask.y}`);
      let outcome = 'none';
      if (r < .18) {
        const spawned = spawnThreat(1, { minDist:3, tag:`cask-ambush:${cask.x}:${cask.y}` });
        if (spawned) {
          outcome = 'ambush';
          surfaceMessage('木桶底板突然弹开——一只潜伏的怪物被惊醒了。', 'bad');
        }
      } else if (r < .30) {
        p.poison = Math.max(Number(p.poison) || 0, 3);
        p.grievous = Math.max(Number(p.grievous) || 0, 2);
        outcome = 'contamination';
        surfaceMessage('腐败粉尘扑了一脸：你中了毒，伤口也开始恶化。', 'bad');
      }
      if (outcome !== 'none' && typeof api.persistRun === 'function' && api.state === 'playing') api.persistRun();
      return outcome;
    }

    function caskSnapshot() {
      return (api.items || []).filter(it => it && it.type === 'cask' && !resolvedCasks.has(it));
    }

    function settleCasks(before) {
      if (!Array.isArray(before) || !before.length) return 0;
      let n = 0;
      const live = api.items || [];
      for (const cask of before) {
        if (live.includes(cask) || resolvedCasks.has(cask)) continue;
        resolveCaskRisk(cask);
        n++;
      }
      return n;
    }

    function armCaskWatch() {
      if (api.state !== 'playing') return;
      const before = caskSnapshot();
      if (before.length) queueMicrotask(() => settleCasks(before));
    }

    function syncShrineCopy() {
      if (api.state !== 'shrine') return;
      const copy = document.getElementById && document.getElementById('shrine-copy');
      const ok = document.getElementById && document.getElementById('btn-shrine-ok');
      if (copy) copy.textContent = '这是一次真正的赌注：可能治愈、以血换祭品、唤来追兵或遭受诅咒。仍要触碰吗？';
      if (ok) ok.textContent = '接受赌注';
    }

    function interceptShrine(e) {
      const t = e && e.target;
      const btn = t && typeof t.closest === 'function' ? t.closest('#btn-shrine-ok') : null;
      if (!btn || api.state !== 'shrine') return;
      const p = api.player;
      const shrine = (api.npcs || [])
        .filter(n => n && n.type === 'shrine' && !n.used)
        .sort((a,b) => (Math.abs(a.x-p.x)+Math.abs(a.y-p.y)) - (Math.abs(b.x-p.x)+Math.abs(b.y-p.y)))[0];
      if (!shrine) return;
      if (e.preventDefault) e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      if (typeof api.closeShrine === 'function') api.closeShrine();
      resolveShrine(shrine);
    }

    document.addEventListener('keydown', () => { armCaskWatch(); queueMicrotask(syncShrineCopy); }, true);
    document.addEventListener('click', armCaskWatch, true);
    window.addEventListener('click', interceptShrine, true);
    document.addEventListener('click', () => queueMicrotask(syncShrineCopy), false);

    if (typeof originalTryMove === 'function') {
      api.tryMove = function(...args) {
        const before = caskSnapshot();
        const out = originalTryMove.apply(this, args);
        settleCasks(before);
        return out;
      };
    }
    if (typeof originalUseSkill === 'function') {
      api.useSkill = function(...args) {
        const before = caskSnapshot();
        const out = originalUseSkill.apply(this, args);
        settleCasks(before);
        return out;
      };
    }
    if (typeof originalPickupHere === 'function') {
      api.pickupHere = function(...args) {
        const before = caskSnapshot();
        const out = originalPickupHere.apply(this, args);
        settleCasks(before);
        return out;
      };
    }

    window.__DE_RISK_REWARD_INTERACTIONS = {
      version:'p0-v1', rollFor, shrineOutcomeFor, resolveShrine, resolveCaskRisk, settleCasks,
    };
  }

  function installPostBootGuards() {
    installXpCapGuard();
    installDisposableNpcCleanup();
    installRiskRewardInteractions();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading' || !document.readyState)
      window.addEventListener('DOMContentLoaded', installPostBootGuards, { once: true });
    else installPostBootGuards();
  }
})();
