/* Dungeon Echo desktop gamepad adapter v5.
 * Translates Gamepad API input into the keyboard/menu contract owned by game.js.
 * Zero dependencies; safe no-op without a connected pad.
 * Fixed Chinese/English routes own all visible controller copy directly.
 * v3 keeps the Gamepad sampling RAF alive only while a pad is actually connected and the page is visible.
 * v5 is transport-only: gamepad actions emit the canonical keyboard contract and never call gameplay systems directly.
 */
(() => {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_GAMEPAD_BOOTED) return;
  window.__DE_GAMEPAD_BOOTED = true;

  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const copy = (zh, en) => english ? en : zh;
  const DEADZONE = 0.55;
  const INITIAL_REPEAT_MS = 250;
  const REPEAT_MS = 115;
  const LONG_PRESS_MS = 650;

  let activeIndex = null;
  let rafId = 0;
  let lastFrame = 0;
  const buttons = new Map();
  const directions = new Map();
  let returnHoldStarted = 0;
  let returnHoldFired = false;

  function emitKey(key) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  }

  function triggerReturn() {
    emitKey('t');
    return true;
  }

  const MENU_ROOTS = [
    'overlay', 'help-screen', 'achv-screen', 'town-screen', 'echo-screen',
    'shrine-screen', 'talent-screen', 'shop-screen', 'pause-screen',
    'class-screen', 'title-screen',
  ];

  function activeMenuRoot() {
    for (const id of MENU_ROOTS) {
      const root = document.getElementById(id);
      if (root && !root.classList.contains('hidden')) return root;
    }
    return null;
  }

  function menuButtons(root) {
    if (!root) return [];
    return Array.from(root.querySelectorAll('button:not([disabled])')).filter(btn => {
      const cs = typeof getComputedStyle === 'function' ? getComputedStyle(btn) : null;
      return !btn.classList.contains('hidden') && (!cs || (cs.display !== 'none' && cs.visibility !== 'hidden'));
    });
  }

  function moveMenuFocus(delta) {
    const root = activeMenuRoot();
    const list = menuButtons(root);
    if (!list.length) return false;
    const current = document.activeElement;
    let i = list.indexOf(current);
    if (i < 0) i = delta > 0 ? -1 : 0;
    i = (i + delta + list.length) % list.length;
    list[i].focus({ preventScroll: false });
    return true;
  }

  function activateMenu() {
    const root = activeMenuRoot();
    const list = menuButtons(root);
    if (!list.length) return false;
    let target = list.includes(document.activeElement) ? document.activeElement : null;
    if (!target) target = list.find(btn => btn.classList.contains('primary')) || list[0];
    target.click();
    return true;
  }

  function backMenu() {
    const root = activeMenuRoot();
    if (!root) return false;
    const backByRoot = {
      'help-screen': 'btn-help-close', 'achv-screen': 'btn-achv-close',
      'class-screen': 'btn-class-back', 'pause-screen': 'btn-resume',
      'shop-screen': 'btn-shop-leave', 'shrine-screen': 'btn-shrine-leave',
    };
    const id = backByRoot[root.id];
    const btn = id ? document.getElementById(id) : null;
    if (!btn || btn.disabled) return false;
    btn.click();
    return true;
  }

  function ensureUi() {
    let badge = document.getElementById('gamepad-badge');
    if (badge) return badge;
    const style = document.createElement('style');
    style.textContent = `
      #gamepad-badge{position:fixed;right:14px;bottom:14px;z-index:1200;max-width:min(360px,calc(100vw - 28px));padding:8px 10px;border:1px solid rgba(224,167,58,.42);border-radius:8px;background:rgba(20,13,9,.92);color:#d9c7a3;font:12px/1.45 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.34);pointer-events:none;opacity:0;transform:translateY(6px);transition:opacity .18s ease,transform .18s ease}
      #gamepad-badge.on{opacity:.92;transform:none} #gamepad-badge strong{color:#f2d27b;font-weight:700}
      @media (max-width:900px),(pointer:coarse){#gamepad-badge{display:none}}
      @media (prefers-reduced-motion:reduce){#gamepad-badge{transition:none}}`;
    document.head.appendChild(style);
    badge = document.createElement('div');
    badge.id = 'gamepad-badge';
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-live', 'polite');
    document.body.appendChild(badge);
    return badge;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function showStatus(pad) {
    const badge = ensureUi();
    if (!pad) { badge.classList.remove('on'); badge.textContent = ''; return; }
    const shortName = (pad.id || 'Gamepad').replace(/\s*\([^)]*\)\s*/g, ' ').trim().slice(0, 42);
    badge.innerHTML = english
      ? `<strong>Gamepad connected</strong> · ${escapeHtml(shortName)}<br>` +
        'Stick/D-pad Move or Menu · A Confirm/Descend · B Wait/Back · X Skill · Y Potion · LB Scroll · RT Quick Dive · RB Fullscreen · Start Pause · Hold View Return'
      : `<strong>手柄已接入</strong> · ${escapeHtml(shortName)}<br>` +
        '摇杆/十字键移动或选菜单 · A确认/下楼 · B等待/返回 · X技能 · Y药水 · LB卷轴 · RT快速下潜 · RB全屏 · Start暂停 · 长按 View 回城';
    badge.classList.add('on');
  }

  function getPads() {
    try { return typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : []; }
    catch (e) { return []; }
  }

  function pickPad() {
    const pads = getPads();
    if (activeIndex !== null && pads[activeIndex] && pads[activeIndex].connected) return pads[activeIndex];
    for (const pad of pads) {
      if (pad && pad.connected) { activeIndex = pad.index; showStatus(pad); return pad; }
    }
    activeIndex = null;
    return null;
  }

  function pressed(pad, index) {
    const b = pad.buttons && pad.buttons[index];
    return !!b && (b.pressed || b.value > 0.6);
  }

  function edgeButton(pad, index, keyOrFn) {
    const down = pressed(pad, index);
    const was = buttons.get(index) || false;
    if (down && !was) {
      if (typeof keyOrFn === 'function') keyOrFn(); else emitKey(keyOrFn);
    }
    buttons.set(index, down);
  }

  function directionState(pad) {
    const ax = (pad.axes && pad.axes[0]) || 0;
    const ay = (pad.axes && pad.axes[1]) || 0;
    const left = pressed(pad, 14) || ax < -DEADZONE;
    const right = pressed(pad, 15) || ax > DEADZONE;
    const up = pressed(pad, 12) || ay < -DEADZONE;
    const down = pressed(pad, 13) || ay > DEADZONE;
    if ((left || right) && (up || down) && Math.abs(ax) !== Math.abs(ay)) {
      if (Math.abs(ax) > Math.abs(ay)) return left ? 'ArrowLeft' : 'ArrowRight';
      return up ? 'ArrowUp' : 'ArrowDown';
    }
    if (left && !right) return 'ArrowLeft';
    if (right && !left) return 'ArrowRight';
    if (up && !down) return 'ArrowUp';
    if (down && !up) return 'ArrowDown';
    return null;
  }

  function handleDirection(pad, now) {
    const key = directionState(pad);
    for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) if (k !== key) directions.delete(k);
    if (!key) return;
    const state = directions.get(key);
    const menu = activeMenuRoot();
    const fire = () => menu ? moveMenuFocus(key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1) : emitKey(key);
    if (!state) { fire(); directions.set(key, { next: now + INITIAL_REPEAT_MS }); return; }
    if (now >= state.next) { fire(); state.next = now + REPEAT_MS; }
  }

  function handleReturnHold(pad, now) {
    const down = pressed(pad, 8);
    if (!down) { returnHoldStarted = 0; returnHoldFired = false; return; }
    if (!returnHoldStarted) returnHoldStarted = now;
    if (!returnHoldFired && now - returnHoldStarted >= LONG_PRESS_MS) {
      returnHoldFired = true;
      triggerReturn();
      const badge = ensureUi();
      badge.innerHTML = copy(
        '<strong>回城指令</strong> · 长按 View 已触发',
        '<strong>Return command</strong> · Hold View triggered'
      );
      badge.classList.add('on');
    }
  }

  function resetInput() {
    buttons.clear(); directions.clear(); returnHoldStarted = 0; returnHoldFired = false;
  }

  function stopLoop() {
    if (rafId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
    const had = !!rafId;
    rafId = 0;
    lastFrame = 0;
    return had;
  }

  function tick(now) {
    rafId = 0;
    if (document.hidden) { resetInput(); return; }
    const pad = pickPad();
    if (!pad) { resetInput(); showStatus(null); return; }
    if (now - lastFrame >= 16) {
      lastFrame = now;
      handleDirection(pad, now);
      edgeButton(pad, 0, () => { if (!activateMenu()) emitKey('Enter'); });
      edgeButton(pad, 1, () => { if (activeMenuRoot()) { if (!backMenu()) emitKey('Escape'); } else emitKey(' '); });
      edgeButton(pad, 2, 'c'); edgeButton(pad, 3, 'q'); edgeButton(pad, 4, 'e');
      edgeButton(pad, 5, () => { const btn = document.getElementById('fullscreen-toggle'); if (btn) btn.click(); else emitKey('f'); });
      edgeButton(pad, 7, 'j');
      edgeButton(pad, 9, 'Escape');
      handleReturnHold(pad, now);
    }
    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId || document.hidden || typeof navigator.getGamepads !== 'function' || typeof requestAnimationFrame !== 'function') return false;
    const pad = pickPad();
    if (!pad) return false;
    lastFrame = 0;
    rafId = requestAnimationFrame(tick);
    return true;
  }

  window.addEventListener('gamepadconnected', e => {
    activeIndex = e.gamepad.index;
    resetInput();
    showStatus(e.gamepad);
    startLoop();
  });
  window.addEventListener('gamepaddisconnected', e => {
    if (activeIndex === e.gamepad.index) activeIndex = null;
    resetInput();
    stopLoop();
    const pad = pickPad();
    if (pad) startLoop();
    else showStatus(null);
  });
  document.addEventListener('visibilitychange', () => {
    resetInput();
    if (document.hidden) stopLoop();
    else startLoop();
  });
  window.addEventListener('pageshow', startLoop);
  window.addEventListener('pagehide', stopLoop);
  window.addEventListener('beforeunload', stopLoop, { once: true });

  // Some browsers expose already-connected pads before gamepadconnected reaches page script.
  startLoop();

  window.__DE_GAMEPAD_ADAPTER = {
    version:'v5', owner:'desktop-controls', locale:english ? 'en' : 'zh-CN',
    showStatus, activeMenuRoot, moveMenuFocus, activateMenu, backMenu, triggerReturn, startLoop, stopLoop,
    get running() { return !!rafId; },
  };
})();
