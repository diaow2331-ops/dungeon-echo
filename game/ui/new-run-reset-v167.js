/* Dungeon Echo new-run reset v1.6.7.
 * Production UX guard: choosing New Run discards only the active expedition save.
 * Greedy Expedition meta/town progression is intentionally preserved.
 * If no explicit ?seed= is present, a fresh run seed is prepared before class select.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_NEW_RUN_RESET_V167) return;

  const SAVE_KEY = 'de-run-v6';
  let pending = false;

  function clearActiveRun() {
    try { localStorage.removeItem(SAVE_KEY); } catch (_err) {}
    const cont = document.getElementById('btn-continue');
    if (cont) cont.classList.add('hidden');
    const meta = document.getElementById('save-meta');
    if (meta) meta.textContent = '';
  }

  function hasExplicitSeed() {
    try { return new URL(location.href).searchParams.has('seed'); }
    catch (_err) { return false; }
  }

  function freshSeed() {
    if (hasExplicitSeed()) return null;
    let token = '';
    try {
      if (crypto && typeof crypto.getRandomValues === 'function') {
        const words = new Uint32Array(2);
        crypto.getRandomValues(words);
        token = `${words[0].toString(36)}${words[1].toString(36)}`;
      }
    } catch (_err) {}
    if (!token) token = `${Date.now().toString(36)}-${Math.floor((performance && performance.now ? performance.now() : 0) * 1000).toString(36)}`;
    const seed = `run-${token}`;
    const api = window.DE_TEST;
    if (api && typeof api.setSeed === 'function') api.setSeed(seed);
    const label = document.getElementById('seed-label');
    if (label) label.textContent = `${seed}（classic-100）`;
    return seed;
  }

  document.addEventListener('click', event => {
    const target = event.target && event.target.closest ? event.target : null;
    if (!target) return;

    if (target.closest('#btn-new')) {
      pending = true;
      clearActiveRun();
      freshSeed();
      return;
    }

    if (pending && target.closest('#class-grid [data-class]')) {
      clearActiveRun();
      pending = false;
      return;
    }

    if (target.closest('#btn-class-back')) pending = false;
  }, true);

  window.__DE_NEW_RUN_RESET_V167 = {
    version:'1.6.7',
    owner:'production-ux',
    activeRunKey:SAVE_KEY,
    clearsMeta:false,
    preservesExplicitSeed:true,
    clearActiveRun,
    freshSeed,
  };
})();
