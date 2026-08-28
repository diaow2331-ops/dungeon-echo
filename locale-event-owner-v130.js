/* Dungeon Echo locale event owner v1.4.3.
 * Transitional owner for the legacy locale-runtime/completeness pair.
 * It virtualizes only the MutationObserver instances those two scripts create during
 * bootstrap, restores the native constructor immediately afterward, then resynchronizes
 * only the remaining Chinese-first core screens from real UI/state transitions.
 *
 * The fixed-route migration now owns HUD, combat log, equipment, tooltip, touch/help,
 * shrine/echo and talent presentation at source. Do not re-expand this bridge to body-wide
 * translation; residual roots should shrink until the English bridge can be deleted.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_LOCALE_EVENT_OWNER) return;

  const NativeMutationObserver = window.MutationObserver;
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  const virtualObservers = [];
  const legacyRoots = Object.freeze([
    '#title-screen', '#class-screen', '#pause-screen', '#overlay',
    '#shop-screen', '#town-screen', '#achv-screen',
  ]);
  let intercepting = typeof NativeMutationObserver === 'function';
  let active = false;
  let queued = false;
  let primed = false;

  class VirtualMutationObserver {
    constructor(callback) {
      this.callback = typeof callback === 'function' ? callback : (() => {});
      this.targets = [];
      virtualObservers.push(this);
    }
    observe(target, options) { this.targets.push({ target, options: { ...(options || {}) } }); }
    disconnect() { this.targets.length = 0; }
    takeRecords() { return []; }
  }

  if (intercepting) window.MutationObserver = VirtualMutationObserver;

  function primeStaticOwners() {
    if (primed) return false;
    primed = true;
    const base = window.DE_I18N;
    if (base && typeof base.apply === 'function') {
      try { base.apply(); } catch (_e) { /* presentation bootstrap must not stop gameplay */ }
    }
    const runtime = window.__DE_LOCALE_V122;
    if (runtime && typeof runtime.syncClassCards === 'function') {
      try { runtime.syncClassCards(); } catch (_e) {}
    }
    const complete = window.__DE_LOCALE_COMPLETENESS_V128;
    if (complete && complete.english && typeof complete.enforceEquipmentLabels === 'function') {
      try { complete.enforceEquipmentLabels(); } catch (_e) {}
    }
    return true;
  }

  function translateResidualRoot(root) {
    if (!root) return 0;
    let changed = 0;
    const runtime = window.__DE_LOCALE_V122;
    if (runtime && typeof runtime.translateTree === 'function') {
      try { changed += Number(runtime.translateTree(root)) || 0; } catch (_e) {}
    }
    const complete = window.__DE_LOCALE_COMPLETENESS_V128;
    if (complete && complete.english && typeof complete.translateTree === 'function') {
      try { changed += Number(complete.translateTree(root)) || 0; } catch (_e) {}
    }
    return changed;
  }

  function sync() {
    let changed = 0;
    for (const selector of legacyRoots) {
      const root = document.querySelector(selector);
      if (root) changed += translateResidualRoot(root);
    }
    return changed;
  }

  function schedule() {
    if (queued) return false;
    queued = true;
    defer(() => { queued = false; sync(); });
    return true;
  }

  function armEvents() {
    if (active) return false;
    active = true;
    window.addEventListener('keydown', schedule, true);
    window.addEventListener('click', schedule, true);
    window.addEventListener('focus', schedule);
    window.addEventListener('pageshow', schedule);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
    return true;
  }

  function activate() {
    if (intercepting) {
      window.MutationObserver = NativeMutationObserver;
      intercepting = false;
    }
    primeStaticOwners();
    armEvents();
    schedule();
    return true;
  }

  function afterFollower() {
    if (!active) return false;
    return schedule();
  }

  window.__DE_LOCALE_EVENT_OWNER = {
    version:'v143',
    get active(){ return active; },
    get intercepting(){ return intercepting; },
    get primed(){ return primed; },
    legacyRoots,
    virtualObservers,
    activate,
    afterFollower,
    schedule,
    sync,
    primeStaticOwners,
    translateResidualRoot,
  };
})();