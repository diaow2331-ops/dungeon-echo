/* Dungeon Echo desktop gamepad adapter.
 * Translates Gamepad API input into the keyboard/menu contract owned by game.js.
 * Zero dependencies; safe no-op without a connected pad.
 */
(() => {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_GAMEPAD_BOOTED) return;
  window.__DE_GAMEPAD_BOOTED = true;

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
    badge.innerHTML = `<strong>手柄已接入</strong> · ${escapeHtml(shortName)}<br>` +
      '摇杆/十字键移动或选菜单 · A确认/下楼 · B等待/返回 · X技能 · Y药水 · LB卷轴 · RB全屏 · Start暂停 · 长按 View 回城';
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
      emitKey('t');
      const badge = ensureUi();
      badge.innerHTML = '<strong>回城指令</strong> · 长按 View 已触发';
      badge.classList.add('on');
    }
  }

  function tick(now) {
    rafId = requestAnimationFrame(tick);
    if (document.hidden || now - lastFrame < 16) return;
    lastFrame = now;
    const pad = pickPad();
    if (!pad) return;
    handleDirection(pad, now);
    edgeButton(pad, 0, () => { if (!activateMenu()) emitKey('Enter'); });
    edgeButton(pad, 1, () => { if (activeMenuRoot()) { if (!backMenu()) emitKey('Escape'); } else emitKey(' '); });
    edgeButton(pad, 2, 'c'); edgeButton(pad, 3, 'q'); edgeButton(pad, 4, 'e');
    edgeButton(pad, 5, () => { const btn = document.getElementById('fullscreen-toggle'); if (btn) btn.click(); else emitKey('f'); });
    edgeButton(pad, 9, 'Escape');
    handleReturnHold(pad, now);
  }

  function resetInput() {
    buttons.clear(); directions.clear(); returnHoldStarted = 0; returnHoldFired = false;
  }

  window.addEventListener('gamepadconnected', e => { activeIndex = e.gamepad.index; resetInput(); showStatus(e.gamepad); });
  window.addEventListener('gamepaddisconnected', e => {
    if (activeIndex === e.gamepad.index) activeIndex = null;
    resetInput();
    const pad = pickPad();
    if (!pad) showStatus(null);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetInput(); });
  if (typeof navigator.getGamepads === 'function' && typeof requestAnimationFrame === 'function') rafId = requestAnimationFrame(tick);
  window.addEventListener('beforeunload', () => { if (rafId) cancelAnimationFrame(rafId); }, { once: true });
})();

/* v1.1 release polish: restore title modals and make equipped gear visibly layered on heroes. */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_V11_RELEASE_POLISH) return;
  window.__DE_V11_RELEASE_POLISH = true;

  const style = document.createElement('style');
  style.textContent = `
    #achv-screen,#help-screen{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(5,3,2,.92);overflow-y:auto}
    #achv-screen>.title-card,#help-screen>.title-card{margin:auto}
    #achv-screen.hidden,#help-screen.hidden{display:none}
    #stage{position:relative}
    #de-gear-overlay{position:absolute;left:0;top:0;z-index:4;width:100%;height:auto;pointer-events:none;image-rendering:pixelated}
    #minimap,#descend-fab,#lowhp-vignette{z-index:6}
  `;
  document.head.appendChild(style);

  function itemRarity(item) {
    if (!item) return -1;
    const n = Number(item.rarity);
    return Number.isFinite(n) ? Math.max(0, Math.min(4, n)) : 0;
  }

  const COLORS = ['#b7a58a', '#66c58a', '#65a8e8', '#b982ec', '#f1c45b'];
  function gearColor(item) { return COLORS[Math.max(0, itemRarity(item))] || COLORS[0]; }
  function variant(item) {
    const s = String(item && (item.name || item.id || item.kind) || '');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return Math.abs(h) % 3;
  }

  function glow(ctx, item) {
    const r = itemRarity(item);
    if (r < 2) return;
    ctx.shadowColor = COLORS[r];
    ctx.shadowBlur = 3 + r * 2.2;
  }

  function drawArmor(ctx, x, y, item, cid) {
    if (!item) return;
    const color = gearColor(item);
    ctx.save(); glow(ctx, item); ctx.strokeStyle = color; ctx.fillStyle = color + '38'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (cid === 'warrior') { ctx.moveTo(x-10,y-13);ctx.lineTo(x-15,y-5);ctx.lineTo(x-11,y+11);ctx.lineTo(x+11,y+11);ctx.lineTo(x+15,y-5);ctx.lineTo(x+10,y-13); }
    else if (cid === 'ranger') { ctx.moveTo(x-9,y-12);ctx.lineTo(x-12,y+8);ctx.lineTo(x,y+14);ctx.lineTo(x+12,y+8);ctx.lineTo(x+8,y-12); }
    else if (cid === 'mage') { ctx.moveTo(x-7,y-11);ctx.lineTo(x-12,y+14);ctx.lineTo(x,y+18);ctx.lineTo(x+12,y+14);ctx.lineTo(x+7,y-11); }
    else { ctx.moveTo(x-8,y-11);ctx.lineTo(x-11,y+10);ctx.lineTo(x,y+14);ctx.lineTo(x+11,y+10);ctx.lineTo(x+8,y-11); }
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
  }

  function drawHelmet(ctx, x, y, item, cid) {
    if (!item) return;
    const color = gearColor(item);
    ctx.save(); glow(ctx, item); ctx.strokeStyle=color;ctx.fillStyle=color+'50';ctx.lineWidth=2;
    ctx.beginPath();
    if (cid === 'warrior') { ctx.arc(x,y-19,7,Math.PI,0);ctx.lineTo(x+7,y-15);ctx.lineTo(x-7,y-15);ctx.closePath(); }
    else if (cid === 'ranger') { ctx.moveTo(x-8,y-17);ctx.quadraticCurveTo(x,y-28,x+8,y-17);ctx.lineTo(x+5,y-13);ctx.lineTo(x-5,y-13);ctx.closePath(); }
    else if (cid === 'mage') { ctx.arc(x,y-18,8,Math.PI*1.08,Math.PI*1.92);ctx.moveTo(x,y-27);ctx.lineTo(x+2,y-22); }
    else { ctx.moveTo(x-8,y-18);ctx.lineTo(x-4,y-24);ctx.lineTo(x+4,y-24);ctx.lineTo(x+8,y-18);ctx.lineTo(x+5,y-14);ctx.lineTo(x-5,y-14);ctx.closePath(); }
    ctx.fill();ctx.stroke();ctx.restore();
  }

  function drawBoots(ctx, x, y, item) {
    if (!item) return;
    const color=gearColor(item);ctx.save();glow(ctx,item);ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(x-6,y+13);ctx.lineTo(x-9,y+20);ctx.lineTo(x-4,y+20);ctx.moveTo(x+6,y+13);ctx.lineTo(x+9,y+20);ctx.lineTo(x+4,y+20);ctx.stroke();ctx.restore();
  }

  function drawWeapon(ctx, x, y, item, cid) {
    if (!item) return;
    const color=gearColor(item), v=variant(item);ctx.save();glow(ctx,item);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2.4;ctx.lineCap='round';ctx.lineJoin='round';
    if (cid === 'warrior') {
      if (v === 1) { ctx.beginPath();ctx.moveTo(x+13,y-8);ctx.lineTo(x+18,y+16);ctx.stroke();ctx.beginPath();ctx.moveTo(x+10,y-8);ctx.lineTo(x+22,y-13);ctx.lineTo(x+23,y-5);ctx.closePath();ctx.fill(); }
      else { ctx.beginPath();ctx.moveTo(x+13,y+14);ctx.lineTo(x+20,y-16-v*3);ctx.stroke();ctx.beginPath();ctx.moveTo(x+15,y-14-v*3);ctx.lineTo(x+22,y-19-v*3);ctx.lineTo(x+20,y-11-v*3);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(x+10,y+6);ctx.lineTo(x+18,y+8);ctx.stroke(); }
    } else if (cid === 'ranger') {
      ctx.beginPath();ctx.arc(x+12,y,13+v,Math.PI*.58,Math.PI*1.42);ctx.stroke();ctx.beginPath();ctx.moveTo(x+4,y-11);ctx.lineTo(x+4,y+11);ctx.stroke();
    } else if (cid === 'mage') {
      ctx.beginPath();ctx.moveTo(x+13,y+18);ctx.lineTo(x+16,y-16);ctx.stroke();ctx.beginPath();ctx.arc(x+17,y-20,4+v*.7,0,Math.PI*2);ctx.fill();
    } else {
      ctx.beginPath();ctx.moveTo(x+8,y+11);ctx.lineTo(x+18,y-11-v*2);ctx.moveTo(x-8,y+11);ctx.lineTo(x-18,y-11-v*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+17,y-12-v*2);ctx.lineTo(x+20,y-17-v*2);ctx.moveTo(x-17,y-12-v*2);ctx.lineTo(x-20,y-17-v*2);ctx.stroke();
    }
    ctx.restore();
  }

  function drawJewelry(ctx, x, y, ring, amulet) {
    if (amulet) {
      const c=gearColor(amulet);ctx.save();glow(ctx,amulet);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(x-5,y-10);ctx.lineTo(x,y-3);ctx.lineTo(x+5,y-10);ctx.stroke();ctx.beginPath();ctx.arc(x,y-1,2.2,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    if (ring) {
      const c=gearColor(ring);ctx.save();glow(ctx,ring);ctx.strokeStyle=c;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(x+11,y+2,2.7,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }

  function installGearOverlay() {
    const game=document.getElementById('game'), stage=document.getElementById('stage');
    if (!game || !stage || document.getElementById('de-gear-overlay')) return;
    const canvas=document.createElement('canvas');canvas.id='de-gear-overlay';canvas.width=game.width;canvas.height=game.height;stage.appendChild(canvas);
    const ctx=canvas.getContext('2d');
    const frame=now=>{
      requestAnimationFrame(frame);ctx.clearRect(0,0,canvas.width,canvas.height);
      const api=window.DE_TEST,p=api&&api.player;if(!api||!p||!Number.isFinite(p.fx)||!Number.isFinite(p.fy))return;
      const x=p.fx*32+16,y=p.fy*32+16+Math.sin(now*.0026+p.x*7+p.y*5)*1.3,e=p.equip||{},cid=api.classId||'warrior';
      drawArmor(ctx,x,y,e.armor,cid);drawHelmet(ctx,x,y,e.helmet,cid);drawBoots(ctx,x,y,e.boots);drawWeapon(ctx,x,y,e.weapon,cid);drawJewelry(ctx,x,y,e.ring,e.amulet);
    };
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installGearOverlay, { once:true });
  else installGearOverlay();
})();
