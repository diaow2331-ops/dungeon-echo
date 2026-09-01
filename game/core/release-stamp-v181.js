/* Dungeon Echo v1.8.1 visible release stamp. No timers or gameplay-state mutation. */
(() => {
  'use strict';
  if (typeof document === 'undefined' || window.__DE_RELEASE_STAMP_V181) return;
  const version = '1.8.1';
  const footer = document.querySelector('#help b:last-child');
  if (footer && footer.textContent !== `v${version}`) footer.textContent = `v${version}`;
  document.documentElement.dataset.release = version;
  window.__DE_RELEASE_STAMP_V180 = Object.freeze({ version });
})();
