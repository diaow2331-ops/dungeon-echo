/* Dungeon Echo risk/reward interactions v2.
 * Owns shrine wagers and cask downside resolution for the classic-100 production route.
 * Loaded after the synchronous gameplay stack so it wraps the final public gameplay API,
 * rather than hiding gameplay ownership inside production-bootstrap.js.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_RISK_REWARD_INTERACTIONS) return;

  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

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
    return String(value).replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
    }[c]));
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
      const maxHp = typeof api.pMaxHp === 'function'
        ? Math.max(1, Number(api.pMaxHp()) || 1)
        : Math.max(1, Number(p.hpBase) || 1);
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
      const maxHp = typeof api.pMaxHp === 'function'
        ? Math.max(1, Number(api.pMaxHp()) || 1)
        : Math.max(1, Number(p.hpBase) || 1);
      const cost = Math.max(1, Math.round(maxHp * .18));
      p.hp = Math.max(1, (Number(p.hp) || 1) - cost);
      const loot = typeof api.genEquip === 'function' ? api.genEquip(api.depth, 2) : null;
      if (loot) dropEquip(loot, npc.x, npc.y);
      text = loot
        ? `神龛索取 ${cost} 点生命，吐出祭品【${loot.name}】。`
        : `神龛索取 ${cost} 点生命，却只留下空响。`;
      cls = 'epic';
    } else if (outcome === 'greed-contract') {
      const gold = 18 + Math.max(1, Number(api.depth) || 1) * 3;
      p.gold = (Number(p.gold) || 0) + gold;
      const spawned = spawnThreat(2, { minDist:3, tag:`shrine-greed:${npc.x}:${npc.y}` });
      text = `你从祭坛夺走 ${gold} 金币，${spawned} 个被惊醒的敌人开始追来。`;
      cls = 'bad';
    } else if (outcome === 'guardian-trial') {
      const spawned = spawnThreat(1, { minDist:4, elite:true, tag:`shrine-elite:${npc.x}:${npc.y}` });
      text = spawned
        ? '神龛唤来一名祭坛守卫——击败它，史诗战利品才真正属于你。'
        : '神龛震动片刻，挑战却没有成形。';
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
    if (!p) return;
    const shrine = (api.npcs || [])
      .filter(n => n && n.type === 'shrine' && !n.used)
      .sort((a,b) =>
        (Math.abs(a.x-p.x)+Math.abs(a.y-p.y)) -
        (Math.abs(b.x-p.x)+Math.abs(b.y-p.y)))[0];
    if (!shrine) return;
    if (e.preventDefault) e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (typeof api.closeShrine === 'function') api.closeShrine();
    resolveShrine(shrine);
  }

  document.addEventListener('keydown', () => {
    armCaskWatch();
    queueMicrotask(syncShrineCopy);
  }, true);
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
    version:'p0-v2',
    owner:'risk-reward-system',
    rollFor,
    shrineOutcomeFor,
    resolveShrine,
    resolveCaskRisk,
    settleCasks,
  };
})();
