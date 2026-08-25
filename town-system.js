/* Dungeon Echo production town/progression bridge v1.
 * Returning to town should preserve the greed loop without forcing a floor-1 replay.
 * Checkpoints unlock only AFTER crossing each 10-floor guardian: 11/21/.../91.
 * Unseen floors can never be skipped.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_TOWN_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;
  window.__DE_TOWN_SYSTEM = 'v1';

  const CHECKPOINTS = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91];
  let selected = 1;

  function unlockedCheckpoints() {
    const best = Number(api.meta && api.meta.bestDepth) || 0;
    // A checkpoint at N+1 is proof that the guardian on N was passed. Reaching the
    // guardian floor alone does not unlock a skip around that fight.
    return CHECKPOINTS.filter(d => d === 1 || best >= d);
  }

  function deepestUnlocked() {
    const rows = unlockedCheckpoints();
    return rows[rows.length - 1] || 1;
  }

  function ensurePanel() {
    const town = document.getElementById('town-screen');
    if (!town) return null;
    let panel = document.getElementById('town-checkpoints');
    if (panel) return panel;
    const actions = town.querySelector('.title-actions');
    if (!actions || !actions.parentNode) return null;
    panel = document.createElement('div');
    panel.id = 'town-checkpoints';
    panel.className = 'checkpoint-panel';
    actions.parentNode.insertBefore(panel, actions);

    if (!document.getElementById('checkpoint-style')) {
      const style = document.createElement('style');
      style.id = 'checkpoint-style';
      style.textContent = `
        .checkpoint-panel{margin:14px 0 4px;padding:12px;border:1px solid rgba(224,167,58,.22);border-radius:8px;background:rgba(0,0,0,.12)}
        .checkpoint-head{display:flex;gap:10px;align-items:baseline;justify-content:space-between;margin-bottom:8px}
        .checkpoint-head b{color:#f2d27b}.checkpoint-head small{color:#9b8d78}
        .checkpoint-grid{display:flex;flex-wrap:wrap;gap:7px}.checkpoint-grid button{min-width:64px}
        .checkpoint-grid button.active{outline:2px solid rgba(242,210,123,.72);outline-offset:1px}
      `;
      document.head.appendChild(style);
    }
    return panel;
  }

  function render() {
    if (api.state !== 'town' || !api.meta) return;
    const panel = ensurePanel();
    if (!panel) return;
    const unlocked = unlockedCheckpoints();
    if (!unlocked.includes(selected)) selected = deepestUnlocked();
    const best = Number(api.meta.bestDepth) || 0;
    panel.innerHTML = `
      <div class="checkpoint-head">
        <b>已征服检查点</b>
        <small>最深到达 ${best} 层 · 通过十层守卫后解锁下一段</small>
      </div>
      <div class="checkpoint-grid">${unlocked.map(d =>
        `<button type="button" data-checkpoint="${d}" class="${d === selected ? 'active' : ''}">${d === 1 ? '第 1 层' : `第 ${d} 层`}</button>`
      ).join('')}</div>`;
    const depart = document.getElementById('btn-depart');
    if (depart) depart.textContent = selected === 1 ? '从第 1 层出发' : `从已征服区 · 第 ${selected} 层出发`;
  }

  function travelToCheckpoint(target) {
    target = Number(target) || 1;
    if (!unlockedCheckpoints().includes(target)) return false;

    // Let the core create a normal new greedy run first so player/meta/save state stay
    // canonical. Then reuse core descend() once to build the requested theme, map, FOV,
    // HUD and persistence instead of duplicating those internals here.
    api.departTown();
    if (target <= 1) return true;
    if (!api.player || !api.mapGrid) return false;

    api.depth = target - 1;
    api.mapGrid[api.player.y][api.player.x] = 2; // STAIRS constant in game.js
    api.descend();
    return api.depth === target;
  }

  // Capture before game.js' bubbling town handlers. Checkpoint buttons are module-owned;
  // the departure button is intercepted only when a non-floor-1 checkpoint is selected.
  document.addEventListener('click', e => {
    const cp = e.target && e.target.closest ? e.target.closest('[data-checkpoint]') : null;
    if (cp) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const d = Number(cp.dataset.checkpoint) || 1;
      if (unlockedCheckpoints().includes(d)) selected = d;
      render();
      return;
    }

    const depart = e.target && e.target.closest ? e.target.closest('#btn-depart') : null;
    if (!depart || api.state !== 'town' || selected <= 1) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    travelToCheckpoint(selected);
  }, true);

  // Town can be entered by escape, death, insurance, restore, or title flow. A small
  // observer timer keeps this module independent from core rendering without patching it.
  const timer = setInterval(render, 350);
  window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });

  window.DE_TOWN_CHECKPOINTS = {
    unlocked: unlockedCheckpoints,
    travel: travelToCheckpoint,
    get selected() { return selected; },
  };
})();