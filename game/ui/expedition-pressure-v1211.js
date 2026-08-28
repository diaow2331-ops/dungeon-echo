/* Dungeon Echo expedition-pressure surface v1.2.11.
 * Presentation/input affordance for the Greedy Expedition loop only.
 * Makes carried value, retreat readiness and current danger legible without changing
 * loot, combat, RNG, saves or the underlying extraction rules.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_EXPEDITION_PRESSURE_V1211) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const t = (zh, en) => english ? en : zh;
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : fn => Promise.resolve().then(fn);
  let queued = false;
  let lastSig = '';
  let pulseTimer = 0;

  const style = document.createElement('style');
  style.id = 'de-expedition-pressure-style-v1211';
  style.textContent = `
    #de-expedition-pressure{margin:10px 0;padding:10px 11px;border:1px solid rgba(224,167,58,.20);border-left:3px solid rgba(224,167,58,.62);border-radius:7px;background:linear-gradient(145deg,rgba(27,19,14,.92),rgba(12,10,9,.94));box-shadow:0 8px 20px rgba(0,0,0,.16);transition:border-color .16s ease,transform .16s ease,background .16s ease}
    #de-expedition-pressure[hidden]{display:none!important}
    #de-expedition-pressure.de-risk-high{border-left-color:#bd6758;background:linear-gradient(145deg,rgba(48,23,19,.94),rgba(14,9,8,.96))}
    #de-expedition-pressure.de-bankable{border-left-color:#7b9e72}
    #de-expedition-pressure.de-pulse{transform:translateY(-1px);border-color:rgba(240,196,99,.54)}
    .de-expedition-pressure-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .de-expedition-pressure-head b{font-size:12px;color:#ead8b6}.de-expedition-pressure-head small{font-size:10px;color:#9e907c;text-align:right}
    .de-expedition-pressure-value{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:6px}.de-expedition-pressure-value strong{font:800 17px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#f1c45b}.de-expedition-pressure-value span{font-size:11px;color:#a99a85}
    .de-expedition-pressure-choice{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.de-expedition-pressure-choice span{padding:6px 7px;border:1px solid rgba(224,167,58,.12);border-radius:5px;background:rgba(0,0,0,.16);font-size:10px;line-height:1.35;color:#aa9b86}.de-expedition-pressure-choice b{display:block;color:#d9c7a5;font-size:10px;margin-bottom:2px}
    #de-expedition-return{width:100%;min-height:34px;margin-top:8px;border:1px solid rgba(224,167,58,.28);border-radius:5px;background:#25180f;color:#e4c47d;font:750 11px/1 system-ui,-apple-system,"Microsoft YaHei",sans-serif;cursor:pointer}#de-expedition-return:hover:not(:disabled){border-color:#dba94b;background:#312015}#de-expedition-return:disabled{opacity:.48;cursor:not-allowed}
    @media(max-width:900px){#de-expedition-pressure{margin:8px 0;padding:8px 9px}.de-expedition-pressure-choice{grid-template-columns:1fr}.de-expedition-pressure-value strong{font-size:15px}}
    @media(prefers-reduced-motion:reduce){#de-expedition-pressure{transition:none}}
  `;
  if (document.head) document.head.appendChild(style);

  const root = document.createElement('section');
  root.id = 'de-expedition-pressure';
  root.hidden = true;
  root.setAttribute('aria-live', 'polite');
  root.innerHTML = `
    <div class="de-expedition-pressure-head"><b></b><small></small></div>
    <div class="de-expedition-pressure-value"><strong></strong><span></span></div>
    <div class="de-expedition-pressure-choice"><span data-de-push></span><span data-de-bank></span></div>
    <button type="button" id="de-expedition-return"></button>`;
  const side = document.getElementById('side');
  const logbox = document.getElementById('logbox');
  if (side) side.insertBefore(root, logbox || null);
  else document.body.appendChild(root);

  const head = root.querySelector('.de-expedition-pressure-head b');
  const stateLabel = root.querySelector('.de-expedition-pressure-head small');
  const value = root.querySelector('.de-expedition-pressure-value strong');
  const sub = root.querySelector('.de-expedition-pressure-value span');
  const push = root.querySelector('[data-de-push]');
  const bank = root.querySelector('[data-de-bank]');
  const returnBtn = root.querySelector('#de-expedition-return');

  function snapshot() {
    const p = api.player;
    if (!p) return null;
    const maxHp = typeof api.pMaxHp === 'function' ? Math.max(1, Number(api.pMaxHp()) || 1) : Math.max(1, Number(p.hpBase) || 1);
    return {
      depth: Math.max(1, Number(api.depth) || 1),
      hp: Math.max(0, Number(p.hp) || 0),
      maxHp,
      bag: Array.isArray(p.inv) ? p.inv.length : 0,
      gold: Math.max(0, Number(p.gold) || 0),
      escapes: Math.max(0, Number(p.escapes) || 0),
      potions: Math.max(0, Number(p.potions) || 0),
    };
  }

  function signal(s) {
    if (!s) return 'normal';
    const hpRatio = s.hp / s.maxHp;
    if (hpRatio <= .35 || s.escapes <= 0) return 'risk';
    if (s.bag >= 8 || s.gold >= 70 + s.depth * 6) return 'bank';
    return 'normal';
  }

  function sync() {
    queued = false;
    const s = snapshot();
    const visible = !!(s && api.greedy && api.state === 'playing');
    root.hidden = !visible;
    if (!visible) { lastSig = ''; return false; }

    const mode = signal(s);
    root.classList.toggle('de-risk-high', mode === 'risk');
    root.classList.toggle('de-bankable', mode === 'bank');
    head.textContent = t('本趟携带', 'CARRIED THIS RUN');
    value.textContent = t(`${s.bag} 件 · ${s.gold} G`, `${s.bag} items · ${s.gold} G`);
    sub.textContent = t(`第 ${s.depth} 层 · 生命 ${s.hp}/${s.maxHp}`, `Floor ${s.depth} · HP ${s.hp}/${s.maxHp}`);

    if (mode === 'risk') {
      stateLabel.textContent = s.escapes <= 0 ? t('撤离机会耗尽', 'NO SAFE RETURN') : t('低生命', 'LOW HP');
    } else if (mode === 'bank') {
      stateLabel.textContent = t('已有可观收益', 'VALUE AT RISK');
    } else {
      stateLabel.textContent = s.escapes > 0 ? t('可安全回城', 'RETURN READY') : t('继续谨慎推进', 'PUSH CAREFULLY');
    }

    push.innerHTML = `<b>${t('继续深入', 'PUSH DEEPER')}</b>${t('更深层会提高装备品质与收益。', 'Deeper floors raise loot quality and reward.')}`;
    bank.innerHTML = `<b>${t('现在回城', 'BANK THE RUN')}</b>${t('把背包与随身金币锁进安全进度。', 'Secure backpack loot and carried Gold.')}`;

    returnBtn.disabled = s.escapes <= 0;
    returnBtn.textContent = s.escapes > 0
      ? t(`安全回城 · T · 剩余 ${s.escapes}`, `RETURN SAFELY · T · ${s.escapes} LEFT`)
      : t('没有可用回城机会', 'NO SAFE RETURN AVAILABLE');

    const sig = `${s.depth}|${s.bag}|${s.gold}|${s.hp}|${s.escapes}`;
    if (lastSig && sig !== lastSig && !root.classList.contains('de-pulse')) {
      root.classList.add('de-pulse');
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(() => root.classList.remove('de-pulse'), 240);
    }
    lastSig = sig;
    return true;
  }

  function schedule() {
    if (queued) return false;
    queued = true;
    defer(sync);
    return true;
  }

  returnBtn.addEventListener('click', () => {
    if (returnBtn.disabled || api.state !== 'playing' || !api.greedy || typeof api.useEscape !== 'function') return;
    api.useEscape();
    schedule();
  });

  document.addEventListener('keydown', schedule, true);
  document.addEventListener('click', schedule, true);
  window.addEventListener('focus', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });

  sync();
  window.__DE_EXPEDITION_PRESSURE_V1211 = {
    version:'v1.2.11-preview', owner:'expedition-pressure', locale:english?'en':'zh-CN', sync, schedule, snapshot, signal,
  };
})();
