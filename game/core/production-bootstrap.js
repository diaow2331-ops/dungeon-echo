/* Dungeon Echo production bootstrap.
 * Public builds always enter the single 1→100 expedition. Internal short profiles
 * remain available through dev/test harnesses, but are never selected by index.html.
 *
 * v1.1 art bridge: route the legacy loot-atlas path to the completed unified
 * equipment atlas without changing any equipment IDs, save keys or save schemas.
 * v4 art coordinator + hero gear + town art: suppress stale direct entity-art tags,
 * then load one fresh unified entity runtime plus terrain, equipment-feedback and
 * town presentation layers. They may replace visible art, but core canvas/gameplay
 * remains the fail-safe fallback.
 *
 * Production input integrity: movement keys may use normal OS key repeat, while
 * tactical one-shot actions are edge-triggered across keyboard, touch and gamepad.
 * This guard boots before game.js/combat-controls so repeated keydown events cannot
 * consume extra turns/items or oscillate pause/audio/fullscreen state.
 *
 * Gameplay systems own their own mechanics. Bootstrap is limited to production-entry
 * policy, input-edge policy and presentation compatibility/loading bridges.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;

  const BOOTSTRAP_SRC = typeof document !== 'undefined' && document.currentScript
    ? document.currentScript.src : '';

  const ONE_SHOT_REPEAT_KEYS = new Set([
    'Escape', ' ', 'Spacebar', '.',
    'q', 'Q', 'e', 'E', 't', 'T', 'c', 'C', 'j', 'J', 'k', 'K',
    'm', 'M', 'f', 'F', 'r', 'R', 'n', 'N', 'Enter', 'PageDown', '>',
  ]);
  if (!window.__DE_ONE_SHOT_REPEAT_GUARD && typeof window.addEventListener === 'function') {
    const repeatGuard = event => {
      if (!event || !event.repeat || !ONE_SHOT_REPEAT_KEYS.has(String(event.key || ''))) return;
      if (typeof event.preventDefault === 'function') event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    };
    window.addEventListener('keydown', repeatGuard, true);
    window.__DE_ONE_SHOT_REPEAT_GUARD = {
      version:'v1', owner:'production-bootstrap', keys:ONE_SHOT_REPEAT_KEYS, repeatGuard,
    };
  }

  const EQUIPMENT_ATLAS = 'art/loot-atlas-v12.svg';

  try {
    if (typeof document !== 'undefined' && !window.__DE_EQUIPMENT_ART_V12) {
      window.__DE_EQUIPMENT_ART_V12 = true;

      const style = document.createElement('style');
      style.id = 'de-equipment-art-v12';
      style.textContent = `.loot-icon{background-image:url("${EQUIPMENT_ATLAS}")!important}`;
      document.head.appendChild(style);

      if (typeof HTMLImageElement !== 'undefined') {
        const proto = HTMLImageElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'src');
        if (desc && desc.get && desc.set) {
          Object.defineProperty(proto, 'src', {
            configurable: desc.configurable,
            enumerable: desc.enumerable,
            get: desc.get,
            set(value) {
              const raw = String(value == null ? '' : value);
              const next = /(?:^|\/)art\/loot-atlas\.png(?:[?#].*)?$/.test(raw)
                ? EQUIPMENT_ATLAS : value;
              return desc.set.call(this, next);
            },
          });
        }
      }
    }
  } catch (e) {
    // Art routing is presentation-only. If a restrictive browser rejects the bridge,
    // the original atlas remains a safe fallback and gameplay still boots.
  }

  // index.html still contains the legacy direct v2 tag with an old cache generation.
  // Reserve its guard before the parser reaches that tag; art-runtime-v4 then clears
  // this sentinel and performs one fresh v160 entity-runtime load. This prevents stale
  // cached entity art and also removes the former v2+v3 double-draw path.
  if (!window.__DE_ART_RUNTIME_V4 && !window.__DE_ART_RUNTIME_V2) {
    window.__DE_ART_RUNTIME_V2 = Object.freeze({
      version:'superseded-by-v4', owner:'production-bootstrap', sentinel:true,
    });
  }

  const appendArtRuntime = (id, file, guard) => {
    if (typeof document === 'undefined' || window[guard] || document.getElementById(id)) return;
    try {
      const script = document.createElement('script');
      script.id = id;
      script.async = false;
      script.src = new URL(file,
        BOOTSTRAP_SRC || (typeof location !== 'undefined' ? location.href : '')).href;
      (document.body || document.head || document.documentElement).appendChild(script);
    } catch (e) {
      // Art overlays are optional presentation. Core art/gameplay remains authoritative.
    }
  };
  const loadArtRuntimes = () => {
    appendArtRuntime('de-art-runtime-v4-loader', '../ui/art-runtime-v4.js?v=160', '__DE_ART_RUNTIME_V4');
    appendArtRuntime('de-hero-gear-art-v162-loader', '../ui/hero-gear-art-v162.js?v=162', '__DE_HERO_GEAR_ART_V162');
    appendArtRuntime('de-town-art-v160-loader', '../ui/town-art-v160.js?v=161', '__DE_TOWN_ART_V160');
  };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadArtRuntimes, { once:true });
    } else {
      loadArtRuntimes();
    }
  }

  if (typeof location !== 'undefined') {
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('profile') !== 'classic-100') {
        url.searchParams.set('profile', 'classic-100');
        if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
          history.replaceState(null, '', url.href);
        }
      }
    } catch (e) {
      // Production hosting is normal http(s). If a non-standard shell rejects URL/history,
      // game.js will fail closed rather than silently selecting an arbitrary short profile.
    }
  }
})();
