/* Dungeon Echo production UX bootstrap v14.
 * Core gameplay/input/balance are synchronous in index.html.
 * Release-critical followers use one version query so deployments cannot mix cached generations.
 * Fixed-route locale identity and language-neutral item migration are established before presentation owners boot.
 *
 * v13 removed the last translation-after-render bridge from production. Chinese and English now boot the
 * same graph; the fixed English route owns its remaining legacy core sinks through exact screen/canvas owners.
 * v14 finalizes the v1.2.9 release boundary without changing cache generation 153 or gameplay/save semantics.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_PRODUCTION_UX_BOOTSTRAP) return;

  const assetVersion = '153';
  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const fresh = src => `${src}?v=${assetVersion}`;

  const baseChain = [
    [fresh('release-stamp-v129.js'), 'data-de-release-stamp-v129', () => !!window.__DE_RELEASE_STAMP_V129],
    [fresh('fixed-locale-entry-v130.js'), 'data-de-fixed-locale-v130', () => !!window.__DE_FIXED_LOCALE_ENTRY],
    [fresh('stable-item-id-migration-v150.js'), 'data-de-stable-item-id-v150', () => !!window.__DE_STABLE_ITEM_ID_MIGRATION_V150],
    [fresh('core-screen-owner-v153.js'), 'data-de-core-screen-v153', () => !!window.__DE_CORE_SCREEN_OWNER_V153],
    [fresh('town-canvas-locale-v153.js'), 'data-de-town-canvas-locale-v153', () => !!window.__DE_TOWN_CANVAS_LOCALE_V153],
  ];
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
  const chain = Object.freeze([...baseChain, ...followerChain]);

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
      script.setAttribute(marker, 'v14');
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
      catch (_err) { /* optional presentation/data migration layers must not block later followers */ }
    }
    return true;
  }

  if (document.body) start();
  else window.addEventListener('DOMContentLoaded', start, { once:true });

  window.__DE_PRODUCTION_UX_BOOTSTRAP = {
    version:'v14', assetVersion, locale:english ? 'en' : 'zh-CN', english,
    start, loadScript, chain, baseChain:Object.freeze(baseChain), followerChain:Object.freeze(followerChain),
  };
})();
