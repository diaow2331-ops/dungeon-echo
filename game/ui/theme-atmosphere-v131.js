/* Dungeon Echo 21-band atmosphere recovery.
 * DOM-only depth observer: translates the already-rendered HUD floor number into a presentation attribute.
 * It does not read DE_TEST, touch Canvas contexts, own input, poll, write storage, or mutate gameplay state.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_THEME_ATMOSPHERE_V131) return;

  const stage = document.getElementById('stage');
  const depthEl = document.getElementById('st-depth');
  if (!stage || !depthEl || typeof MutationObserver === 'undefined') return;

  const bandForDepth = value => {
    const depth = Math.max(1, Number.parseInt(String(value || '1'), 10) || 1);
    return Math.min(20, Math.floor((depth - 1) / 4));
  };
  const apply = () => {
    const band = bandForDepth(depthEl.textContent);
    if (stage.dataset.deThemeBand !== String(band)) stage.dataset.deThemeBand = String(band);
    return band;
  };

  const observer = new MutationObserver(apply);
  observer.observe(depthEl, { childList:true, subtree:true, characterData:true });
  apply();

  window.__DE_THEME_ATMOSPHERE_V131 = Object.freeze({
    version:'1.3.1-atmosphere',
    owner:'dom-presentation',
    source:'hud-depth-text',
    gameplayMutation:false,
    canvasContext:false,
    polling:false,
    bands:21,
    bandForDepth,
    apply,
    observer,
  });
})();
