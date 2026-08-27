/* Dungeon Echo production UX bootstrap v10.
 * Core gameplay/input/balance are synchronous in index.html.
 * Release-critical followers use one version query so deployments cannot mix cached generations.
 * Fixed route locale identity is established before the transitional locale presentation pair boots.
 * Locale presentation is event-owned: legacy locale observers are virtualized only while the
 * locale pair boots, then the native MutationObserver is restored before later followers load.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_PRODUCTION_UX_BOOTSTRAP) return;

  const assetVersion = '133';
  const fresh = src => `${src}?v=${assetVersion}`;
  const chain = Object.freeze([
    [fresh('release-stamp-v128.js'), 'data-de-release-stamp-v128', () => !!window.__DE_RELEASE_STAMP_V128],
    [fresh('fixed-locale-entry-v130.js'), 'data-de-fixed-locale-v130', () => !!window.__DE_FIXED_LOCALE_ENTRY],
    [fresh('locale-event-owner-v130.js'), 'data-de-locale-event-owner-v130', () => !!window.__DE_LOCALE_EVENT_OWNER],
    [fresh('locale-runtime-v122.js'), 'data-de-locale-v122', () => !!window.__DE_LOCALE_V122],
    [fresh('locale-completeness-v128.js'), 'data-de-locale-completeness-v128', () => !!window.__DE_LOCALE_COMPLETENESS_V128],
    [fresh('character-art-cleanup-v122.js'), 'data-de-character-cleanup-v122', () => !!window.__DE_CHARACTER_ART_CLEANUP_V122],
    [fresh('world-loot-polish-v122.js'), 'data-de-world-loot-v122', () => !!window.__DE_WORLD_LOOT_V122],
    [fresh('forge-feedback-v122.js'), 'data-de-forge-feedback-v122', () => !!window.__DE_FORGE_FEEDBACK_V122],
    [fresh('combat-hint-polish.js'), 'data-de-combat-hint', () => !!window.__DE_COMBAT_HINT_POLISH],
    [fresh('audio-director.js'), 'data-de-audio-director', () => !!window.__DE_AUDIO_DIRECTOR],
    [fresh('mobile-ux.js'), 'data-de-mobile-ux', () => !!window.__DE_MOBILE_UX],
    [fresh('help-copy-v126.js'), 'data-de-help-copy-v126', () => !!window.__DE_HELP_COPY_V126],
    [fresh('expedition-record-v126.js'), 'data-de-expedition-record-v126', () => !!window.__DE_EXPEDITION_RECORD_V126],
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
      script.setAttribute(marker, 'v10');
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

  function localeOwner() { return window.__DE_LOCALE_EVENT_OWNER || null; }
  function afterFollower(src) {
    const owner = localeOwner();
    if (!owner) return;
    if (String(src).includes('locale-completeness-v128.js')) {
      if (typeof owner.activate === 'function') owner.activate();
      return;
    }
    if (owner.active && typeof owner.afterFollower === 'function') owner.afterFollower();
  }

  async function start() {
    if (started) return false;
    started = true;
    try {
      for (const [src, marker, ready] of chain) {
        try { await loadScript(src, marker, ready); }
        catch (_err) { /* optional presentation layers must not block later followers */ }
        afterFollower(src);
      }
    } finally {
      const owner = localeOwner();
      if (owner && !owner.active && typeof owner.activate === 'function') owner.activate();
    }
    return true;
  }

  if (document.body) start();
  else window.addEventListener('DOMContentLoaded', start, { once:true });

  window.__DE_PRODUCTION_UX_BOOTSTRAP = { version:'v10', assetVersion, start, loadScript, chain, afterFollower };
})();
