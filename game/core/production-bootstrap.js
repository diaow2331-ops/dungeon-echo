/* Dungeon Echo production bootstrap.
 * Public builds always enter the single 1→100 expedition. Internal short profiles
 * remain available through dev/test harnesses, but are never selected by index.html.
 *
 * v1.1 art bridge: route the legacy loot-atlas path to the completed unified
 * equipment atlas without changing any equipment IDs, save keys or save schemas.
 *
 * Production input integrity: movement keys may use normal OS key repeat, while
 * tactical one-shot actions are edge-triggered across keyboard, touch and gamepad.
 * This guard boots before game.js/combat-controls so repeated keydown events cannot
 * consume extra turns/items or oscillate pause/audio/fullscreen state.
 *
 * Gameplay systems own their own mechanics. Bootstrap is limited to production-entry
 * policy, input-edge policy and the legacy equipment-atlas presentation compatibility bridge.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;

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
