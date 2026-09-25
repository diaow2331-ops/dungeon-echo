/* Dungeon Echo v1.9.4 visible release stamp. No timers or gameplay-state mutation. */
(() => {
  'use strict';
  if (typeof document === 'undefined' || window.__DE_RELEASE_STAMP_V194) return;
  const version = '1.9.4';
  const footer = document.querySelector('#help b:last-child');
  if (footer && footer.textContent !== `v${version}`) footer.textContent = `v${version}`;
  document.documentElement.dataset.release = version;
  window.__DE_RELEASE_STAMP_V194 = Object.freeze({ version });
})();
