/* Dungeon Echo production bootstrap.
 * Public builds always enter the single 1→100 expedition. Internal short profiles
 * remain available through dev/test harnesses, but are never selected by index.html.
 *
 * v1.1 art bridge: route the legacy loot-atlas path to the completed unified
 * equipment atlas without changing any equipment IDs, save keys or save schemas.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;

  const EQUIPMENT_ATLAS = 'art/loot-atlas-v12.svg';

  try {
    if (typeof document !== 'undefined' && !window.__DE_EQUIPMENT_ART_V12) {
      window.__DE_EQUIPMENT_ART_V12 = true;

      // Backpack/equipment-bar icons are CSS background sprites. Override only the
      // atlas URL; the existing 4×8 coordinates and item identities remain intact.
      const style = document.createElement('style');
      style.id = 'de-equipment-art-v12';
      style.textContent = `.loot-icon{background-image:url("${EQUIPMENT_ATLAS}")!important}`;
      document.head.appendChild(style);

      // Ground loot is drawn by game.js through an Image instance created later in
      // boot. Intercept only the legacy loot atlas source and leave every other image
      // untouched. This keeps game.js and save-compatible item IDs unchanged.
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

  if (typeof location === 'undefined') return;
  try {
    const url = new URL(location.href);
    if (url.searchParams.get('profile') !== 'classic-100') {
      url.searchParams.set('profile', 'classic-100');
      // Avoid an extra network/navigation round-trip before game.js boots.
      if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
        history.replaceState(null, '', url.href);
      }
    }
  } catch (e) {
    // Production hosting is normal http(s). If a non-standard shell rejects URL/history,
    // game.js will fail closed rather than silently selecting an arbitrary short profile.
  }
})();