/* Dungeon Echo production UX bootstrap v35.
 * v1.8.1 town presentation patch on cache generation 183.
 * game/core/game.js remains sole gameplay/render/input/persistence writer.
 * This bootstrap may load presentation-only followers. Adaptive BGM owns only a private
 * WebAudio music graph; forge feedback only observes canonical town results and decorates DOM.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_PRODUCTION_UX_BOOTSTRAP) return;
  const assetVersion = '183';
  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const fresh = src => `${src}?v=${assetVersion}`;
  const chain = Object.freeze([
    [fresh('game/core/release-stamp-v181.js'), 'data-de-release-stamp-v181', () => !!window.__DE_RELEASE_STAMP_V181],
    [fresh('game/locale/fixed-locale-entry-v130.js'), 'data-de-fixed-locale-v130', () => !!window.__DE_FIXED_LOCALE_ENTRY],
    [fresh('game/ui/responsive-final-v154.js'), 'data-de-responsive-final-v154', () => !!window.__DE_RESPONSIVE_FINAL_V154],
    [fresh('game/ui/help-copy-v126.js'), 'data-de-help-copy-v126', () => !!window.__DE_HELP_COPY_V126],
    [fresh('game/ui/theme-atmosphere-v131.js'), 'data-de-theme-atmosphere-v131', () => !!window.__DE_THEME_ATMOSPHERE_V131],
    [fresh('game/ui/adaptive-bgm-v132.js'), 'data-de-adaptive-bgm-v132', () => !!window.__DE_ADAPTIVE_BGM_V132],
    [fresh('game/ui/forge-feedback-v132.js'), 'data-de-forge-feedback-v132', () => !!window.__DE_FORGE_FEEDBACK_V132],
  ]);
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
      script.setAttribute(marker, 'v35');
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
  window.__DE_PRODUCTION_UX_BOOTSTRAP = Object.freeze({
    version:'v35', assetVersion, locale:english?'en':'zh-CN',
    renderOwner:'game/core/game.js', gameplayStateOwner:'game/core/game.js',
    inputOwner:'game/core/game.js', persistenceWriter:'game/core/game.js',
    dynamicLoaderOwner:'game/core/runtime-bootstrap.js', followers:'presentation-only',
    audioFollower:'game/ui/adaptive-bgm-v132.js', forgeFeedback:'game/ui/forge-feedback-v132.js',
    start, loadScript, chain,
  });
})();
