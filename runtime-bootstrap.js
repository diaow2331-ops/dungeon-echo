/* Dungeon Echo production UX bootstrap v5.
 * Core gameplay/input/balance are synchronous in index.html.
 * Release-critical followers use a version query so one deployment cannot mix cached generations.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_PRODUCTION_UX_BOOTSTRAP) return;

  const assetVersion = '125';
  const fresh = src => `${src}?v=${assetVersion}`;
  const chain = Object.freeze([
    [fresh('release-stamp-v125.js'), 'data-de-release-stamp-v125', () => !!window.__DE_RELEASE_STAMP_V125],
    [fresh('locale-runtime-v122.js'), 'data-de-locale-v122', () => !!window.__DE_LOCALE_V122],
    [fresh('character-art-cleanup-v122.js'), 'data-de-character-cleanup-v122', () => !!window.__DE_CHARACTER_ART_CLEANUP_V122],
    [fresh('world-loot-polish-v122.js'), 'data-de-world-loot-v122', () => !!window.__DE_WORLD_LOOT_V122],
    [fresh('forge-feedback-v122.js'), 'data-de-forge-feedback-v122', () => !!window.__DE_FORGE_FEEDBACK_V122],
    [fresh('combat-hint-polish.js'), 'data-de-combat-hint', () => !!window.__DE_COMBAT_HINT_POLISH],
    [fresh('audio-director.js'), 'data-de-audio-director', () => !!window.__DE_AUDIO_DIRECTOR],
    [fresh('mobile-ux.js'), 'data-de-mobile-ux', () => !!window.__DE_MOBILE_UX],
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
      script.setAttribute(marker, 'v5');
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

  window.__DE_PRODUCTION_UX_BOOTSTRAP = { version:'v5', assetVersion, start, loadScript, chain };
})();
