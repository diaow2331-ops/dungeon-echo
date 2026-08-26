/* Dungeon Echo production UX bootstrap v1.
 * Owns the late presentation/control chain independently of optional art/shop modules.
 * Core production scripts are already available when this file runs at the end of index.html,
 * so UX followers can start immediately without waiting for heavyweight image/window load.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_PRODUCTION_UX_BOOTSTRAP) return;

  const chain = Object.freeze([
    ['challenge-pressure.js', 'data-de-challenge-pressure', () => !!window.__DE_CHALLENGE_PRESSURE_V1],
    ['i18n.js', 'data-de-i18n', () => !!window.DE_I18N],
    ['i18n-runtime.js', 'data-de-i18n-runtime', () => !!window.__DE_I18N_RUNTIME_V1],
    ['i18n-content.js', 'data-de-i18n-content', () => !!window.__DE_I18N_CONTENT_V2],
    ['combat-controls.js', 'data-de-combat-controls', () => !!window.__DE_COMBAT_CONTROLS_V1],
    ['combat-hint-polish.js', 'data-de-combat-hint', () => !!window.__DE_COMBAT_HINT_POLISH],
    ['audio-director.js', 'data-de-audio-director', () => !!window.__DE_AUDIO_DIRECTOR],
    ['mobile-ux.js', 'data-de-mobile-ux', () => !!window.__DE_MOBILE_UX],
  ]);

  let started = false;

  function loadScript(src, marker, ready) {
    return new Promise(resolve => {
      if (ready()) { resolve('ready'); return; }
      const existing = document.querySelector(`script[${marker}]`);
      if (existing) {
        // A duplicate owner should never block the rest of the chain. If it is still
        // loading, resolve on either outcome; if it already loaded, continue now.
        if (existing.dataset && existing.dataset.deSettled === '1') { resolve('existing'); return; }
        const settle = () => {
          if (existing.dataset) existing.dataset.deSettled = '1';
          resolve(ready() ? 'ready' : 'existing');
        };
        existing.addEventListener('load', settle, { once:true });
        existing.addEventListener('error', settle, { once:true });
        setTimeout(settle, 0);
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute(marker, 'v1');
      const settle = status => {
        if (script.dataset) script.dataset.deSettled = '1';
        resolve(status);
      };
      script.addEventListener('load', () => settle(ready() ? 'ready' : 'loaded'), { once:true });
      script.addEventListener('error', () => settle('error'), { once:true });
      document.body.appendChild(script);
    });
  }

  async function start() {
    if (started) return false;
    started = true;
    for (const [src, marker, ready] of chain) {
      try { await loadScript(src, marker, ready); }
      catch (_err) { /* one optional UX layer must never block the following layers */ }
    }
    return true;
  }

  if (document.body) setTimeout(start, 0);
  else window.addEventListener('DOMContentLoaded', () => setTimeout(start, 0), { once:true });

  window.__DE_PRODUCTION_UX_BOOTSTRAP = { version:'v1', start, loadScript, chain };
})();
