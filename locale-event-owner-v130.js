/* Dungeon Echo locale event owner v1.3.0.
 * Transitional owner for the legacy locale-runtime/completeness pair.
 * It virtualizes only the MutationObserver instances those two scripts create during
 * bootstrap, restores the native constructor immediately afterward, then resynchronizes
 * locale presentation from real UI/state transitions instead of permanent DOM observation.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_LOCALE_EVENT_OWNER) return;

  const NativeMutationObserver = window.MutationObserver;
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  const virtualObservers = [];
  let intercepting = typeof NativeMutationObserver === 'function';
  let active = false;
  let queued = false;

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

  function sync() {
    const base = window.DE_I18N;
    if (base && typeof base.apply === 'function') {
      try { base.apply(); } catch (_e) { /* presentation sync must not stop gameplay */ }
    }

    const runtime = window.__DE_LOCALE_V122;
    if (runtime && typeof runtime.syncClassCards === 'function') {
      try { runtime.syncClassCards(); } catch (_e) {}
    }
    if (runtime && typeof runtime.translateTree === 'function' && document.body) {
      try { runtime.translateTree(document.body); } catch (_e) {}
    }

    const complete = window.__DE_LOCALE_COMPLETENESS_V128;
    if (complete && complete.english) {
      if (typeof complete.translateTree === 'function') {
        const roots = Array.isArray(complete.roots) ? complete.roots : [];
        for (const selector of roots) {
          const root = document.querySelector(selector);
          if (root) {
            try { complete.translateTree(root); } catch (_e) {}
          }
        }
      }
      if (typeof complete.enforceEquipmentLabels === 'function') {
        try { complete.enforceEquipmentLabels(); } catch (_e) {}
      }
    }
    return true;
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
    armEvents();
    schedule();
    return true;
  }

  function afterFollower() {
    if (!active) return false;
    return schedule();
  }

  window.__DE_LOCALE_EVENT_OWNER = {
    version:'v130',
    get active(){ return active; },
    get intercepting(){ return intercepting; },
    virtualObservers,
    activate,
    afterFollower,
    schedule,
    sync,
  };
})();
