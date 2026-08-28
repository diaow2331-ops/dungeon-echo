/* Dungeon Echo v1.2.9 visible release stamp. No timers or gameplay-state mutation. */
(() => {
  'use strict';
  if (typeof document === 'undefined' || window.__DE_RELEASE_STAMP_V129) return;
  const version = '1.2.9';
  const footer = document.querySelector('#help b:last-child');
  if (footer && footer.textContent !== `v${version}`) footer.textContent = `v${version}`;
  document.documentElement.dataset.release = version;
  window.__DE_RELEASE_STAMP_V129 = { version };
})();
