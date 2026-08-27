/* Dungeon Echo production UX bootstrap v11.
 * Core gameplay/input/balance are synchronous in index.html.
 * Release-critical followers use one version query so deployments cannot mix cached generations.
 * Fixed route locale identity is established before any presentation follower boots.
 *
 * Chinese is now a true fixed-source route: it never loads the legacy runtime translator,
 * completeness layer or locale-event owner. English keeps the transitional bridge only until
 * game.js finishes its source-localization cut. Later followers are route-owned modules and boot
 * identically for both pages.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_PRODUCTION_UX_BOOTSTRAP) return;

  const assetVersion = '140';
  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const fresh = src => `${src}?v=${assetVersion}`;

  const baseChain = [
    [fresh('release-stamp-v128.js'), 'data-de-release-stamp-v128', () => !!window.__DE_RELEASE_STAMP_V128],
    [fresh('fixed-locale-entry-v130.js'), 'data-de-fixed-locale-v130', () => !!window.__DE_FIXED_LOCALE_ENTRY],
  ];
  const englishBridge = english ? [
    [fresh('locale-event-owner-v130.js'), 'data-de-locale-event-owner-v130', () => !!window.__DE_LOCALE_EVENT_OWNER],
    [fresh('locale-runtime-v122.js'), 'data-de-locale-v122', () => !!window.__DE_LOCALE_V122],
    [fresh('locale-completeness-v128.js'), 'data-de-locale-completeness-v128', () => !!window.__DE_LOCALE_COMPLETENESS_V128],
  ] : [];
  const followerChain = [
    [fresh('character-art-cleanup-v122.js'), 'data-de-character-cleanup-v122', () => !!window.__DE_CHARACTER_ART_CLEANUP_V122],
    [fresh('world-loot-polish-v122.js'), 'data-de-world-loot-v122', () => !!window.__DE_WORLD_LOOT_V122],
    [fresh('forge-feedback-v122.js'), 'data-de-forge-feedback-v122', () => !!window.__DE_FORGE_FEEDBACK_V122],
    [fresh('combat-hint-polish.js'), 'data-de-combat-hint', () => !!window.__DE_COMBAT_HINT_POLISH],
    [fresh('audio-director.js'), 'data-de-audio-director', () => !!window.__DE_AUDIO_DIRECTOR],
    [fresh('mobile-ux.js'), 'data-de-mobile-ux', () => !!window.__DE_MOBILE_UX],
    [fresh('help-copy-v126.js'), 'data-de-help-copy-v126', () => !!window.__DE_HELP_COPY_V126],
    [fresh('expedition-record-v126.js'), 'data-de-expedition-record-v126', () => !!window.__DE_EXPEDITION_RECORD_V126],
  ];
  const chain = Object.freeze([...baseChain, ...englishBridge, ...followerChain]);

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
      script.setAttribute(marker, 'v11');
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

  function localeOwner() { return english ? (window.__DE_LOCALE_EVENT_OWNER || null) : null; }
  function afterFollower(src) {
    if (!english) return;
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

  window.__DE_PRODUCTION_UX_BOOTSTRAP = {
    version:'v11', assetVersion, locale:english ? 'en' : 'zh-CN', english,
    start, loadScript, chain, baseChain:Object.freeze(baseChain),
    englishBridge:Object.freeze(englishBridge), followerChain:Object.freeze(followerChain), afterFollower,
  };
})();
