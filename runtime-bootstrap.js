/* Dungeon Echo production UX bootstrap v4.
 * Core gameplay/input/balance are synchronous in index.html.
 * Locale is one stable event-driven owner; late followers are presentation-only.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_PRODUCTION_UX_BOOTSTRAP) return;

  const chain = Object.freeze([
    ['release-stamp-v124.js', 'data-de-release-stamp-v124', () => !!window.__DE_RELEASE_STAMP_V124],
    ['locale-runtime-v122.js', 'data-de-locale-v122', () => !!window.__DE_LOCALE_V122],
    ['character-art-cleanup-v122.js', 'data-de-character-cleanup-v122', () => !!window.__DE_CHARACTER_ART_CLEANUP_V122],
    ['world-loot-polish-v122.js', 'data-de-world-loot-v122', () => !!window.__DE_WORLD_LOOT_V122],
    ['forge-feedback-v122.js', 'data-de-forge-feedback-v122', () => !!window.__DE_FORGE_FEEDBACK_V122],
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
        let done = false;
        const settle = status => {
          if (done) return;
          done = true;
          resolve(status || (ready() ? 'ready' : 'existing'));
        };
        existing.addEventListener('load', () => settle(ready() ? 'ready' : 'existing'), { once:true });
        existing.addEventListener('error', () => settle('error'), { once:true });
        setTimeout(() => settle('timeout'), 1200);
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute(marker, 'v4');
      let done = false;
      const settle = status => {
        if (done) return;
        done = true;
        resolve(status);
      };
      script.addEventListener('load', () => settle(ready() ? 'ready' : 'loaded'), { once:true });
      script.addEventListener('error', () => settle('error'), { once:true });
      document.body.appendChild(script);
      setTimeout(() => settle('timeout'), 3000);
    });
  }

  async function start() {
    if (started) return false;
    started = true;
    for (const [src, marker, ready] of chain) {
      try { await loadScript(src, marker, ready); }
      catch (_err) { /* optional presentation layers must not block later followers */ }
    }
    return true;
  }

  if (document.body) start();
  else window.addEventListener('DOMContentLoaded', start, { once:true });

  window.__DE_PRODUCTION_UX_BOOTSTRAP = { version:'v4', start, loadScript, chain };
})();
