/* Dungeon Echo town workspace event bridge v1.5.6.
 * Some production actions (commerce purchases, Return Scroll extraction, checkpoints)
 * intentionally own document-capture input and may stop propagation. Observe only at the
 * earlier window-capture boundary and schedule one microtask after settlement. No polling,
 * no MutationObserver, no gameplay ownership.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_TOWN_WORKSPACE_EVENTS_V156) return;
  const workspace = window.__DE_TOWN_WORKSPACE_V156;
  const api = window.DE_TEST;
  if (!workspace || !api) return;
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : fn => Promise.resolve().then(fn);
  let queued = false;
  function refreshAfterSettlement() {
    if (queued) return;
    queued = true;
    defer(() => {
      queued = false;
      if (api.state === 'town' && window.__DE_TOWN_WORKSPACE_V156) window.__DE_TOWN_WORKSPACE_V156.render();
    });
  }
  window.addEventListener('click', refreshAfterSettlement, true);
  window.addEventListener('keydown', refreshAfterSettlement, true);
  window.addEventListener('pointerup', refreshAfterSettlement, true);
  window.__DE_TOWN_WORKSPACE_EVENTS_V156 = Object.freeze({version:'v156',owner:'town-workspace-events-v156',refresh:refreshAfterSettlement});
})();
