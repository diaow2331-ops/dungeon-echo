/* Dungeon Echo v1.2.1 UX hotfix.
 * - Language selection lives on the title screen and reloads into the selected locale.
 * - Runtime language hot-switching is no longer exposed during a run.
 * - Repairs high-frequency mixed zh/en combat-log remnants without touching save data.
 * - Keeps empty equipment-slot labels and the standing hint aligned with the locked locale.
 * - Treats the first real successful skill feedback as tutorial completion and suppresses
 *   routine repeated skill-cost toasts afterwards; mana/cooldown UI remains authoritative.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_UX_HOTFIX_V121) return;
  const L = window.DE_I18N;
  const api = window.DE_TEST;
  if (!L || !api) return;

  const STORAGE_KEY = 'de-language-v1';
  const slotKeys = {weapon:'slot.weapon',armor:'slot.armor',helmet:'slot.helmet',boots:'slot.boots',ring:'slot.ring',amulet:'slot.amulet'};
  let logQueued = false;
  let skillFeedbackSeen = false;

  function languageUrl(next) {
    const u = new URL(location.href);
    u.searchParams.set('lang', next === 'en' ? 'en' : 'zh');
    return u;
  }

  function navigateLanguage(next) {
    const lang = String(next).toLowerCase() === 'en' ? 'en' : 'zh-CN';
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_e) {}
    const target = languageUrl(lang);
    const wanted = lang === 'en' ? 'en' : 'zh';
    const current = String(new URL(location.href).searchParams.get('lang') || '').toLowerCase();
    if ((wanted === 'en' && current === 'en') || (wanted === 'zh' && (current === 'zh' || current === 'zh-cn'))) return false;
    location.replace(target.href);
    return true;
  }

  function installLanguageEntry() {
    const title = document.querySelector('#title-screen .title-card');
    if (!title) return;
    let box = document.getElementById('de-title-language');
    if (!box) {
      box = document.createElement('div');
      box.id = 'de-title-language';
      box.setAttribute('aria-label','Language / 语言');
      box.innerHTML = '<span>Language / 语言</span><button type="button" data-lang="zh-CN">中文</button><button type="button" data-lang="en">English</button>';
      const actions = title.querySelector('.title-actions');
      if (actions) title.insertBefore(box, actions); else title.appendChild(box);
      box.addEventListener('click', e => {
        const btn = e.target && e.target.closest ? e.target.closest('button[data-lang]') : null;
        if (!btn) return;
        e.preventDefault();
        navigateLanguage(btn.dataset.lang);
      });
    }
    for (const btn of box.querySelectorAll('button[data-lang]')) {
      const active = btn.dataset.lang === L.lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    // Keep the legacy live-switch button inaccessible. i18n.js may still maintain it internally,
    // but the player can only choose language from the title screen and selection reloads the page.
    const legacy = document.getElementById('de-lang-toggle');
    if (legacy) { legacy.hidden = true; legacy.tabIndex = -1; legacy.setAttribute('aria-hidden','true'); }
  }

  function installStyle() {
    if (document.getElementById('de-v121-ux-style')) return;
    const style = document.createElement('style');
    style.id = 'de-v121-ux-style';
    style.textContent = `
      #de-lang-toggle{display:none!important}
      #de-title-language{display:flex;align-items:center;justify-content:center;gap:7px;margin:14px 0 4px;color:#9ba9bd;font:600 11px/1.2 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
      #de-title-language>span{margin-right:3px;letter-spacing:.04em}
      #de-title-language button{min-width:70px;border:1px solid rgba(132,157,196,.32);border-radius:7px;background:rgba(8,12,19,.78);color:#b9c6d7;padding:6px 10px;cursor:pointer}
      #de-title-language button.active{border-color:rgba(224,167,58,.58);background:rgba(60,42,18,.62);color:#f2d695;box-shadow:inset 0 0 0 1px rgba(224,167,58,.12)}
      #de-title-language button:hover{color:#fff;border-color:rgba(224,167,58,.45)}
      @media(max-width:700px){#de-title-language{margin-top:10px;flex-wrap:wrap}#de-title-language>span{width:100%;text-align:center;margin:0 0 2px}}
    `;
    document.head.appendChild(style);
  }

  function currentEquip() {
    const p = api.player;
    if (p && p.equip) return p.equip;
    if (api.meta && api.meta.equip) return api.meta.equip;
    return {};
  }

  function syncEmptyEquipmentSlots() {
    const equip = currentEquip();
    for (const [slot,key] of Object.entries(slotKeys)) {
      if (equip && equip[slot]) continue;
      const el = document.querySelector(`#eq-${slot} .eqname`);
      if (el) {
        const wanted = L.t(key);
        if (el.textContent !== wanted) el.textContent = wanted;
      }
    }
  }

  function syncStandingHint() {
    const hint = document.getElementById('hint');
    if (!hint || !L.isEnglish) return;
    const raw = String(hint.textContent || '');
    if (!/[\u3400-\u9fff]/.test(raw)) return;
    let out = raw
      .replace(/站在楼梯上按 Enter 下潜/g,'Stand on stairs and press Enter to descend')
      .replace(/点击已探索地块可移动/g,'click explored tiles to move')
      .replace(/J 攻击/g,'J Attack')
      .replace(/K 技能/g,'K Skill')
      .replace(/ · /g,' · ');
    if (out !== raw) hint.textContent = out;
  }

  function repairMixedEnglish(input) {
    if (!L.isEnglish) return input;
    let out = String(input || '');
    if (!/[\u3400-\u9fff]/.test(out)) return out;
    out = out
      .replace(/你Gear了/g,'You equipped ')
      .replace(/你装备了/g,'You equipped ')
      .replace(/你捡起了?/g,'You picked up ')
      .replace(/你击中([^，,]+)[，,]\s*dealt\s*(\d+)\s*damage/gi,'You hit $1 for $2 damage')
      .replace(/你击中([^，,]+)[，,]\s*造成\s*(\d+)\s*点伤害/g,'You hit $1 for $2 damage')
      .replace(/([^，,。！!]+)击中你[，,]\s*dealt\s*(\d+)\s*damage/gi,'$1 hits you for $2 damage')
      .replace(/([^，,。！!]+)击中你[，,]\s*造成\s*(\d+)\s*点伤害/g,'$1 hits you for $2 damage')
      .replace(/精英\s*/g,'Elite ')
      .replace(/被消灭了/g,' was slain')
      .replace(/被击败了/g,' was defeated')
      .replace(/\(\+(\d+)\s*经验\)/g,'(+$1 XP)')
      .replace(/\+(\d+)\s*经验/g,'+$1 XP')
      .replace(/(\d+)\s*枚\s*Gold/gi,'$1 Gold')
      .replace(/(\d+)\s*枚\s*金币/g,'$1 Gold')
      .replace(/\s*。/g,'.')
      .replace(/！/g,'!')
      .replace(/，/g,', ')
      .replace(/\s{2,}/g,' ');
    return out;
  }

  function repairLog() {
    logQueued = false;
    if (!L.isEnglish) return;
    const root = document.getElementById('log');
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const raw = String(node.nodeValue || '');
      if (!/[\u3400-\u9fff]/.test(raw)) continue;
      const wanted = repairMixedEnglish(raw);
      if (wanted !== raw) node.nodeValue = wanted;
    }
  }

  function queueLogRepair() {
    if (logQueued) return;
    logQueued = true;
    queueMicrotask(repairLog);
  }

  function isSuccessfulSkillFeedback(el) {
    if (!el || !el.classList || !el.classList.contains('skill')) return false;
    return /(?:−|-)[0-9]+\s*(?:蓝量|mana)/i.test(String(el.textContent || ''));
  }

  function handleCombatFeedback() {
    const el = document.getElementById('de-combat-feedback');
    if (!el || el.hidden) return;
    const hint = window.__DE_COMBAT_HINT_POLISH;
    if (isSuccessfulSkillFeedback(el)) {
      if (hint && typeof hint.mark === 'function') hint.mark('skill');
      if (skillFeedbackSeen) el.hidden = true;
      else skillFeedbackSeen = true;
      return;
    }
    const tutorialDone = hint && hint.state && hint.state.done && hint.state.done.skill;
    if (tutorialDone && /(?:J\s*攻击\s*·\s*K\s*技能|J\s*Attack\s*·\s*K\s*Skill)/i.test(String(el.textContent || ''))) el.hidden = true;
  }

  function sync() {
    installStyle();
    installLanguageEntry();
    syncEmptyEquipmentSlots();
    syncStandingHint();
    queueLogRepair();
    handleCombatFeedback();
  }

  // Public callers also get safe reload semantics. The old hidden button closes over the original
  // i18n setter, so it remains hidden and unreachable instead of being used for live switching.
  L.setLang = navigateLanguage;

  const log = document.getElementById('log');
  if (log && typeof MutationObserver !== 'undefined') new MutationObserver(queueLogRepair).observe(log,{childList:true,subtree:true,characterData:true});
  const feedbackRoot = document.getElementById('stage') || document.body;
  if (feedbackRoot && typeof MutationObserver !== 'undefined') new MutationObserver(handleCombatFeedback).observe(feedbackRoot,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','hidden']});

  setInterval(() => { installLanguageEntry(); syncEmptyEquipmentSlots(); syncStandingHint(); handleCombatFeedback(); }, 400);
  sync();
  window.__DE_UX_HOTFIX_V121 = {version:'v1',navigateLanguage,repairMixedEnglish,repairLog,sync};
})();
