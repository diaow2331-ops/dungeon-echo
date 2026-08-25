/* Dungeon Echo production bootstrap.
 * Public builds always enter the single 1→100 expedition. Internal short profiles
 * remain available through dev/test harnesses, but are never selected by index.html.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof location === 'undefined') return;
  try {
    const url = new URL(location.href);
    if (url.searchParams.get('profile') === 'classic-100') return;
    url.searchParams.set('profile', 'classic-100');
    // Avoid an extra network/navigation round-trip before game.js boots.
    if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
      history.replaceState(null, '', url.href);
    }
  } catch (e) {
    // Production hosting is normal http(s). If a non-standard shell rejects URL/history,
    // game.js will fail closed rather than silently selecting an arbitrary short profile.
  }
})();