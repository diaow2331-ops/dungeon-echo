/* Dungeon Echo production UX bootstrap v16.
 * Core gameplay/input/balance are synchronous in index.html.
 * Release-critical followers use one version query so deployments cannot mix cached generations.
 * Fixed-route locale identity and language-neutral item migration are established before presentation owners boot.
 *
 * v16 advances the v1.2.12 hotfix to public cache generation 167, restores the established
 * high-detail hero presentation and makes New Run discard only the active expedition save.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_PRODUCTION_UX_BOOTSTRAP) return;

  const assetVersion = '167';
  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const fresh = src => `${src}?v=${assetVersion}`;

  const baseChain = [
    [fresh('game/core/release-stamp-v1212.js'), 'data-de-release-stamp-v1212', () => !!window.__DE_RELEASE_STAMP_V1212],
    [fresh('game/locale/fixed-locale-entry-v130.js'), 'data-de-fixed-locale-v130', () => !!window.__DE_FIXED_LOCALE_ENTRY],
    [fresh('game/locale/stable-item-id-migration-v150.js'), 'data-de-stable-item-id-v150', () => !!window.__DE_STABLE_ITEM_ID_MIGRATION_V150],
    [fresh('game/locale/core-screen-owner-v153.js'), 'data-de-core-screen-v153', () => !!window.__DE_CORE_SCREEN_OWNER_V153],
    [fresh('game/ui/new-run-reset-v167.js'), 'data-de-new-run-reset-v167', () => !!window.__DE_NEW_RUN_RESET_V167],
    [fresh('game/ui/town-workspace-v156.js'), 'data-de-town-workspace-v156', () => !!window.__DE_TOWN_WORKSPACE_V156],
    [fresh('game/ui/town-workspace-events-v156.js'), 'data-de-town-workspace-events-v156', () => !!window.__DE_TOWN_WORKSPACE_EVENTS_V156],
    [fresh('game/locale/town-canvas-locale-v153.js'), 'data-de-town-canvas-locale-v153', () => !!window.__DE_TOWN_CANVAS_LOCALE_V153],
  ];
  const followerChain = [
    [fresh('game/ui/character-art-cleanup-v122.js'), 'data-de-character-cleanup-v122', () => !!window.__DE_CHARACTER_ART_CLEANUP_V122],
    [fresh('game/ui/world-loot-polish-v122.js'), 'data-de-world-loot-v122', () => !!window.__DE_WORLD_LOOT_V122],
    [fresh('game/ui/forge-feedback-v122.js'), 'data-de-forge-feedback-v122', () => !!window.__DE_FORGE_FEEDBACK_V122],
    [fresh('game/ui/combat-hint-polish.js'), 'data-de-combat-hint', () => !!window.__DE_COMBAT_HINT_POLISH],
    [fresh('game/ui/expedition-pressure-v1211.js'), 'data-de-expedition-pressure-v1211', () => !!window.__DE_EXPEDITION_PRESSURE_V1211],
    [fresh('game/ui/audio-director.js'), 'data-de-audio-director', () => !!window.__DE_AUDIO_DIRECTOR],
    [fresh('game/ui/mobile-ux.js'), 'data-de-mobile-ux', () => !!window.__DE_MOBILE_UX],
    [fresh('game/ui/responsive-final-v154.js'), 'data-de-responsive-final-v154', () => !!window.__DE_RESPONSIVE_FINAL_V154],
    [fresh('game/ui/help-copy-v126.js'), 'data-de-help-copy-v126', () => !!window.__DE_HELP_COPY_V126],
    [fresh('game/ui/expedition-record-v126.js'), 'data-de-expedition-record-v126', () => !!window.__DE_EXPEDITION_RECORD_V126],
  ];
  const chain = Object.freeze([...baseChain, ...followerChain]);

  let started = false;
  function loadScript(src, marker, ready) {
    return new Promise(resolve => {
      if (ready()) { resolve('ready'); return; }
      const existing = document.querySelector(`script[${marker}]`);
      if (existing) {
        let done = false;
        const settle = status => { if (done) return; done = true; resolve(status || (ready() ? 'ready' : 'existing')); };
        existing.addEventListener('load', () => settle(ready() ? 'ready' : 'existing'), { once:true });
        existing.addEventListener('error', () => settle('error'), { once:true });
        setTimeout(() => settle('timeout'), 1200);
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute(marker, 'v16');
      let done = false;
      const settle = status => { if (done) return; done = true; resolve(status); };
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
      try { await loadScript(src, marker, ready); } catch (_err) {}
    }
    return true;
  }
  if (document.body) start(); else window.addEventListener('DOMContentLoaded', start, { once:true });
  window.__DE_PRODUCTION_UX_BOOTSTRAP = {version:'v16',assetVersion,locale:english?'en':'zh-CN',english,start,loadScript,chain,baseChain:Object.freeze(baseChain),followerChain:Object.freeze(followerChain)};
})();
