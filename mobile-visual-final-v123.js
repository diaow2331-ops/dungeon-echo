/* Dungeon Echo v1.2.3 mobile + visual finalization.
 * Presentation/input-latency hotfix only.
 * - removes the visual-polish player aura / skill-ready ring on every device;
 * - reduces non-essential overlay work on mobile where the overlay has no camera transform;
 * - breaks the mobile action MutationObserver self-trigger loop without replacing buttons;
 * - removes sticky/backdrop-filter pressure in non-fullscreen mobile browser chrome;
 * - makes touch gameplay actions fire on pointer-down instead of waiting for pointer-up click;
 * - disables the low-value center Wait target on the mobile D-pad to prevent movement mis-taps.
 * Gameplay rules, RNG, saves, keyboard controls and the production 1->100 route are unchanged.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_MOBILE_VISUAL_FINAL_V123) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const coarse = () => innerWidth <= 900 ||
    (typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches);

  const style = document.createElement('style');
  style.id = 'de-mobile-visual-final-v123';
  style.textContent = `
    html.de-mobile-ui body{overscroll-behavior:none}
    html.de-mobile-ui #wrap{overflow-anchor:none}
    html.de-mobile-ui #stage{contain:paint}
    html.de-mobile-ui #dpad button{touch-action:none;user-select:none;-webkit-user-select:none}
    html.de-mobile-ui #dpad [data-act="wait"]{visibility:hidden!important;pointer-events:none!important}
    html.de-mobile-ui #actions button{touch-action:manipulation;user-select:none;-webkit-user-select:none}
    html.de-mobile-ui.de-browser-chrome #stats{
      position:relative!important;top:auto!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important
    }
    html.de-mobile-ui.de-browser-chrome #touch{
      position:relative!important;bottom:auto!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
      box-shadow:0 3px 14px rgba(0,0,0,.24)!important
    }
    html.de-mobile-ui.de-browser-chrome canvas#game{transform:translateZ(0);backface-visibility:hidden}
  `;
  document.head.appendChild(style);

  function syncBrowserChromeClass() {
    const root = document.documentElement;
    const mobile = coarse();
    root.classList.toggle('de-browser-chrome', mobile && !document.fullscreenElement);
  }

  // mobile-ux.js originally observes #actions and then rewrites each button's textContent
  // from that observer callback. Moving the existing buttons into a fresh root preserves all
  // button listeners but leaves the old observer attached to a detached node, stopping the
  // self-triggered frame-by-frame mutation loop.
  function detachActionObserverLoop() {
    if (!coarse()) return false;
    const oldRoot = document.getElementById('actions');
    if (!oldRoot || oldRoot.dataset.v123ObserverDetached === '1') return false;
    const fresh = oldRoot.cloneNode(false);
    fresh.dataset.v123ObserverDetached = '1';
    while (oldRoot.firstChild) fresh.appendChild(oldRoot.firstChild);
    oldRoot.replaceWith(fresh);
    return true;
  }

  function disableMobileWait() {
    const wait = document.querySelector('#dpad [data-act="wait"]');
    if (!wait) return false;
    if (coarse()) {
      wait.disabled = true;
      wait.tabIndex = -1;
      wait.setAttribute('aria-hidden','true');
      wait.setAttribute('aria-label','');
      wait.dataset.v123MobileWaitDisabled = '1';
    } else if (wait.dataset.v123MobileWaitDisabled === '1') {
      wait.disabled = false;
      wait.removeAttribute('aria-hidden');
      wait.setAttribute('aria-label','等待一回合');
      wait.removeAttribute('data-v123-mobile-wait-disabled');
    }
    return true;
  }

  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (_) {}
  }

  function ownPointerButton(btn, repeat) {
    if (!btn || btn.dataset.v123PointerOwner === '1') return;
    btn.dataset.v123PointerOwner = '1';
    let delay = 0, interval = 0, suppressTrustedClick = false;

    const clear = e => {
      if (e && coarse()) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      clearTimeout(delay); clearInterval(interval);
      delay = interval = 0;
    };

    btn.addEventListener('pointerdown', e => {
      if (!coarse() || (Number.isFinite(e.button) && e.button !== 0)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      suppressTrustedClick = true;
      buzz(repeat ? 5 : 8);
      btn.click();
      if (repeat) {
        delay = setTimeout(() => {
          btn.click();
          interval = setInterval(() => btn.click(), 110);
        }, 190);
      }
      try { btn.setPointerCapture(e.pointerId); } catch (_) {}
    }, true);

    btn.addEventListener('pointerup', clear, true);
    btn.addEventListener('pointercancel', clear, true);
    btn.addEventListener('lostpointercapture', clear, true);
    btn.addEventListener('click', e => {
      if (suppressTrustedClick && e.isTrusted) {
        suppressTrustedClick = false;
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
  }

  function installImmediateTouch() {
    if (!coarse()) return;
    document.querySelectorAll('#dpad button:not([data-act="wait"])').forEach(btn => ownPointerButton(btn, true));
    const immediate = new Set(['attack','skill','potion','descend','escape','scroll']);
    document.querySelectorAll('#actions button[data-act]').forEach(btn => {
      if (immediate.has(btn.dataset.act)) ownPointerButton(btn, false);
    });
  }

  function visualMetrics(canvas) {
    const grid = api.mapGrid;
    const cols = Array.isArray(grid) && grid[0] ? grid[0].length : 40;
    const rows = Array.isArray(grid) && grid.length ? grid.length : 28;
    return {
      tw: (Number(canvas.width) || cols * 32) / Math.max(1, cols),
      th: (Number(canvas.height) || rows * 32) / Math.max(1, rows),
    };
  }

  function patchVisualOverlay() {
    const canvas = document.getElementById('de-visual-polish');
    if (!canvas || canvas.dataset.v123VisualPatched === '1' || typeof canvas.getContext !== 'function') return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const prevCreateRadialGradient = ctx.createRadialGradient.bind(ctx);
    const prevFillRect = ctx.fillRect.bind(ctx);
    const prevEllipse = ctx.ellipse.bind(ctx);
    const prevArc = ctx.arc.bind(ctx);
    let suppressNextGradientFill = false;

    ctx.createRadialGradient = function(x0, y0, r0, x1, y1, r1) {
      const m = visualMetrics(canvas);
      const inner = Math.abs(Number(r0));
      const outer = Math.abs(Number(r1));
      const sameCenter = Math.abs(Number(x0) - Number(x1)) < .01 && Math.abs(Number(y0) - Number(y1)) < .01;
      const playerAura = sameCenter &&
        inner >= m.tw * .105 && inner <= m.tw * .135 &&
        outer >= m.tw * .98 && outer <= m.tw * 1.20;

      // visual-polish.js uses world coordinates without the mobile camera translation.
      // On the 15x15/17x17 camera, entity-sized radial effects can therefore appear away
      // from their owners. Suppress those decorative entity radials on mobile; the core
      // canvas retains its correctly translated lighting/telegraphs.
      const mobileEntityRadial = coarse() && sameCenter && outer <= m.tw * 3.05;
      suppressNextGradientFill = playerAura || mobileEntityRadial;
      return prevCreateRadialGradient(x0, y0, r0, x1, y1, r1);
    };

    ctx.fillRect = function(...args) {
      if (suppressNextGradientFill) {
        suppressNextGradientFill = false;
        return;
      }
      suppressNextGradientFill = false;
      return prevFillRect(...args);
    };

    ctx.ellipse = function(cx, cy, rx, ry, rotation, start, end, ...rest) {
      const m = visualMetrics(canvas);
      const skillReadyRing =
        Math.abs(Number(rx) / Math.max(.001, m.tw) - .48) <= .07 &&
        Math.abs(Number(ry) / Math.max(.001, m.th) - .17) <= .05 &&
        Number(ctx.lineWidth) >= 1.1 && Number(ctx.lineWidth) <= 1.4;
      if (skillReadyRing) return;
      return prevEllipse(cx, cy, rx, ry, rotation, start, end, ...rest);
    };

    // Mobile keeps the core game's translated lighting. Tiny overlay dust particles are
    // optional presentation work, so skip them to lower paint pressure under browser chrome.
    ctx.arc = function(x, y, r, start, end, ...rest) {
      if (coarse() && Number(r) <= 2.1) return;
      return prevArc(x, y, r, start, end, ...rest);
    };

    canvas.dataset.v123VisualPatched = '1';
    return true;
  }

  function install() {
    syncBrowserChromeClass();
    detachActionObserverLoop();
    disableMobileWait();
    installImmediateTouch();
    patchVisualOverlay();
  }

  document.addEventListener('fullscreenchange', () => {
    syncBrowserChromeClass();
    disableMobileWait();
    requestAnimationFrame(installImmediateTouch);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) install(); });

  install();
  requestAnimationFrame(install);
  setTimeout(install, 80);

  window.__DE_MOBILE_VISUAL_FINAL_V123 = {
    version:'v1', coarse, install, patchVisualOverlay, detachActionObserverLoop,
    disableMobileWait, installImmediateTouch,
  };
})();
