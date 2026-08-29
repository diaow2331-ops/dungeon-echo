/* Dungeon Echo fixed locale entry owner v1.3.8.
 * Route identity chooses language for the whole page load. Chinese and English pages stay
 * on the same origin and therefore share the existing run/meta/stash/equipment localStorage.
 * Legacy ?lang= links are redirected to the matching fixed route.
 * This owner also owns the title language selector; production no longer depends on a live DOM translator.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_FIXED_LOCALE_ENTRY) return;

  const rootEl = document.documentElement;
  const declared = String(rootEl && rootEl.dataset && rootEl.dataset.deLocale || '').toLowerCase();
  const lang = declared === 'en' ? 'en' : 'zh-CN';
  const storageKey = 'de-language-v1';

  // Fixed locale routes are already fully authored in their target language. Browser-level
  // translators must not translate the English route back into Chinese (or vice versa).
  function installNoTranslateBoundary() {
    if (rootEl) {
      rootEl.setAttribute('translate', 'no');
      rootEl.classList.add('notranslate');
      rootEl.lang = lang === 'en' ? 'en' : 'zh-CN';
    }
    let meta = document.querySelector('meta[name="google"][content="notranslate"]');
    if (!meta && document.head) {
      meta = document.createElement('meta');
      meta.name = 'google';
      meta.content = 'notranslate';
      document.head.appendChild(meta);
    }
    const protectBody = () => {
      if (!document.body) return;
      document.body.setAttribute('translate', 'no');
      document.body.classList.add('notranslate');
    };
    if (document.body) protectBody();
    else document.addEventListener('DOMContentLoaded', protectBody, { once:true });
  }
  installNoTranslateBoundary();

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
    window.__DE_FIXED_LOCALE_ENTRY = { version:'v138', lang, targetUrl, navigate, redirected:true };
    navigate('en', true);
    return;
  }
  if ((legacy === 'zh' || legacy === 'zh-cn') && lang === 'en') {
    window.__DE_FIXED_LOCALE_ENTRY = { version:'v138', lang, targetUrl, navigate, redirected:true };
    navigate('zh-CN', true);
    return;
  }

  try { localStorage.setItem(storageKey, lang); } catch (_e) {}
  if (rootEl) rootEl.lang = lang === 'en' ? 'en' : 'zh-CN';

  function installLanguageEntry() {
    const title = document.querySelector('#title-screen .title-card');
    if (!title) return false;
    let box = document.getElementById('de-title-language');
    if (!box) {
      box = document.createElement('div');
      box.id = 'de-title-language';
      box.setAttribute('aria-label', 'Language / 语言');
      box.innerHTML = '<span>Language / 语言</span><button type="button" data-lang="zh-CN">中文</button><button type="button" data-lang="en">English</button>';
      const actions = title.querySelector('.title-actions');
      actions ? title.insertBefore(box, actions) : title.appendChild(box);
    }
    for (const button of box.querySelectorAll('button[data-lang]')) {
      const active = (String(button.dataset.lang || '').toLowerCase() === 'en' ? 'en' : 'zh-CN') === lang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    // Keep the historical style id for compatibility with older cached pages; this fixed-route owner is its sole production owner.
    if (!document.getElementById('de-locale-v122-style')) {
      const style = document.createElement('style');
      style.id = 'de-locale-v122-style';
      style.dataset.owner = 'fixed-locale-entry-v130';
      style.textContent = '#de-lang-toggle{display:none!important}#de-title-language{display:flex;align-items:center;justify-content:center;gap:7px;margin:13px 0 5px;color:#9ba9bd;font:600 11px/1.2 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}#de-title-language>span{margin-right:3px}#de-title-language button{min-width:70px;border:1px solid rgba(132,157,196,.32);border-radius:7px;background:rgba(8,12,19,.78);color:#b9c6d7;padding:6px 10px;cursor:pointer}#de-title-language button.active{border-color:rgba(224,167,58,.58);background:rgba(60,42,18,.62);color:#f2d695}@media(max-width:700px){#de-title-language{flex-wrap:wrap}#de-title-language>span{width:100%;text-align:center;margin:0}}';
      document.head.appendChild(style);
    }
    return true;
  }

  // The selector is route-owned and navigates directly between fixed pages.
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

  installLanguageEntry();

  window.__DE_FIXED_LOCALE_ENTRY = {
    version:'v138',
    lang,
    owner:'fixed-locale-entry-v130',
    targetUrl,
    navigate,
    installLanguageEntry,
    installNoTranslateBoundary,
    redirected:false,
  };
})();