/* Dungeon Echo fixed locale entry owner v1.3.0.
 * Route identity chooses language before gameplay boots. Chinese and English pages stay on
 * the same origin and therefore share the existing run/meta/stash/equipment localStorage.
 * Legacy ?lang= links are redirected to the matching fixed route.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_FIXED_LOCALE_ENTRY) return;

  const rootEl = document.documentElement;
  const declared = String(rootEl && rootEl.dataset && rootEl.dataset.deLocale || '').toLowerCase();
  const lang = declared === 'en' ? 'en' : 'zh-CN';
  const storageKey = 'de-language-v1';

  function siteRoot() {
    try { return new URL('./', document.baseURI || location.href); }
    catch (_e) { return null; }
  }

  function targetUrl(next) {
    const normalized = String(next || '').toLowerCase() === 'en' ? 'en' : 'zh-CN';
    try {
      const current = new URL(location.href);
      const root = siteRoot();
      if (!root) return current.href;
      current.pathname = normalized === 'en' ? new URL('en/', root).pathname : root.pathname;
      current.searchParams.delete('lang');
      current.hash = '';
      return current.href;
    } catch (_e) { return ''; }
  }

  function navigate(next, replace=false) {
    const href = targetUrl(next);
    if (!href || href === String(location && location.href || '')) return false;
    if (replace && location && typeof location.replace === 'function') location.replace(href);
    else if (location && typeof location.assign === 'function') location.assign(href);
    else if (location) location.href = href;
    return true;
  }

  // Preserve old public links while converging the product onto route-owned locale identity.
  let legacy = '';
  try { legacy = String(new URL(location.href).searchParams.get('lang') || '').toLowerCase(); } catch (_e) {}
  if (legacy === 'en' && lang !== 'en') {
    window.__DE_FIXED_LOCALE_ENTRY = { version:'v130', lang, targetUrl, navigate, redirected:true };
    navigate('en', true);
    return;
  }
  if ((legacy === 'zh' || legacy === 'zh-cn') && lang === 'en') {
    window.__DE_FIXED_LOCALE_ENTRY = { version:'v130', lang, targetUrl, navigate, redirected:true };
    navigate('zh-CN', true);
    return;
  }

  try { localStorage.setItem(storageKey, lang); } catch (_e) {}
  if (rootEl) rootEl.lang = lang === 'en' ? 'en' : 'zh-CN';

  // locale-runtime-v122 creates the language buttons later. Capture their clicks so the
  // selector changes fixed routes rather than reintroducing a query-driven mixed mode.
  document.addEventListener('click', e => {
    const target = e && e.target;
    const button = target && typeof target.closest === 'function'
      ? target.closest('#de-title-language button[data-lang]') : null;
    if (!button) return;
    const next = String(button.dataset && button.dataset.lang || '').toLowerCase() === 'en' ? 'en' : 'zh-CN';
    if (next === lang) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    navigate(next, false);
  }, true);

  window.__DE_FIXED_LOCALE_ENTRY = {
    version:'v130',
    lang,
    owner:'fixed-locale-entry-v130',
    targetUrl,
    navigate,
    redirected:false,
  };
})();
