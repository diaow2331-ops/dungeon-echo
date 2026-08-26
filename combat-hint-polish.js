/* Dungeon Echo one-shot combat tutorial hint.
 * Presentation-only: keeps resource/skill feedback intact, but only shows the J/K control
 * tutorial once per browser profile and moves it away from the top-center play space.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_COMBAT_HINT_POLISH) return;

  const KEY = 'de-combat-hint-jk-v1';
  const TUTORIAL = /(?:面向敌人后按\s*J\s*攻击|J\s*攻击\s*·\s*K\s*技能|技能热键已改为\s*K)/i;
  let seen = false;
  try { seen = localStorage.getItem(KEY) === '1'; } catch (e) {}

  const style = document.createElement('style');
  style.id = 'de-combat-hint-polish-v1';
  style.textContent = `
    #de-combat-feedback{top:auto!important;bottom:12%!important;padding:5px 9px!important;border-radius:6px!important;
      background:rgba(7,10,16,.78)!important;border-color:rgba(132,157,196,.28)!important;
      color:#d7e1ef!important;font-size:12px!important;font-weight:600!important;letter-spacing:.01em!important;
      box-shadow:0 4px 14px rgba(0,0,0,.28)!important;backdrop-filter:blur(3px)}
    #de-combat-feedback.de-tutorial-fade{animation:deHintOnce 2.7s ease forwards}
    @keyframes deHintOnce{0%,64%{opacity:.92;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(4px)}}
    @media(prefers-reduced-motion:reduce){#de-combat-feedback.de-tutorial-fade{animation:none}}
  `;
  if (document.head) document.head.appendChild(style);

  function markSeen() {
    seen = true;
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  }

  function inspect(el) {
    if (!el) return;
    const text = String(el.textContent || '').trim();
    if (!TUTORIAL.test(text)) return;
    if (seen) {
      el.hidden = true;
      el.classList.remove('de-tutorial-fade');
      return;
    }
    markSeen();
    el.classList.add('de-tutorial-fade');
    setTimeout(() => {
      if (TUTORIAL.test(String(el.textContent || ''))) el.hidden = true;
      el.classList.remove('de-tutorial-fade');
    }, 2750);
  }

  const observer = typeof MutationObserver !== 'undefined'
    ? new MutationObserver(() => inspect(document.getElementById('de-combat-feedback')))
    : null;
  if (observer) observer.observe(document.body, { childList:true, subtree:true, characterData:true });
  inspect(document.getElementById('de-combat-feedback'));

  window.__DE_COMBAT_HINT_POLISH = { version:'v1', key:KEY, inspect, get seen(){ return seen; } };
})();
