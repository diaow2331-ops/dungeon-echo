/* Dungeon Echo v1.2.7 visible release stamp. No timers or gameplay-state mutation. */
(() => {
  'use strict';
  if (typeof document === 'undefined' || window.__DE_RELEASE_STAMP_V127) return;
  const version = '1.2.7';
  const footer = document.getElementById('help');
  if (footer) {
    const tags = footer.querySelectorAll('b');
    const badge = tags.length ? tags[tags.length - 1] : null;
    if (badge && /^v\d+\.\d+\.\d+$/.test(String(badge.textContent || '').trim())) badge.textContent = `v${version}`;
  }
  document.documentElement.dataset.release = version;
  window.__DE_RELEASE_STAMP_V127 = { version };
})();
