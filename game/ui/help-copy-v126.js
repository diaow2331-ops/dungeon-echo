/* Dungeon Echo controls-copy coherence v1.3.2.
 * DOM-only presentation follower: describes the canonical input contract owned by game.js.
 * It also repairs one stale English default HUD hint left behind by the retired J/K+Mana input path.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_HELP_COPY_V126) return;

  let queued = false;
  const english = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase() === 'en';
  const mobile = () => document.documentElement.classList.contains('de-mobile-ui');
  const STALE_HUD_CONTROLS = 'J Attack · K Skill';
  const CURRENT_HUD_CONTROLS = 'C Skill · J Quick Dive';

  function syncHelp() {
    const p = document.querySelector('#help-screen .help-cols p');
    if (!p) return false;
    if (english && mobile()) {
      p.innerHTML = 'Desktop: <b>WASD / arrow keys</b> move; <b>C</b> uses the class skill; <b>J</b> quick-dives; <b>Space / .</b> waits.<br>Mobile: use the <b>four-way D-pad</b> to move; use the visible <b>Skill</b> action for the class skill.<br>Potion Q · Scroll E · Return T · Descend Enter · Pause Esc.';
    } else if (english) {
      p.innerHTML = 'Move: <b>WASD / arrow keys / click explored tiles</b><br>Class skill: <b>C</b> · Quick dive: <b>J</b> · Wait: <b>Space / .</b><br>Potion: <b>Q</b> · Scroll: <b>E</b> · Return: <b>T</b><br>Descend: <b>Enter</b> (on stairs) · Pause: <b>Esc</b> · Sound: <b>M</b> · Fullscreen: <b>F</b>';
    } else if (mobile()) {
      p.innerHTML = '电脑：<b>WASD / 方向键</b>移动，<b>C</b>职业技能，<b>J</b>快速下潜，<b>空格 / .</b>等待。<br>手机：使用<b>左侧四向方向盘</b>移动，使用右侧可见的<b>技能</b>按钮释放职业技能。<br>药水 Q · 卷轴 E · 回城 T · 下楼 Enter · 暂停 Esc。';
    } else {
      p.innerHTML = '移动：<b>方向键 / WASD / 点击已探索地块</b><br>职业技能：<b>C</b> · 快速下潜：<b>J</b> · 等待：<b>空格 / .</b><br>药水：<b>Q</b> · 卷轴：<b>E</b> · 回城：<b>T</b><br>下潜：<b>Enter</b>（楼梯上） · 暂停：<b>Esc</b> · 声音：<b>M</b> · 全屏：<b>F</b>';
    }
    p.dataset.helpCopy = '1.3.2-current-controls';
    return true;
  }

  function syncHudHint() {
    if (!english) return false;
    const hint = document.getElementById('hint');
    if (!hint || !hint.textContent || !hint.textContent.includes(STALE_HUD_CONTROLS)) return false;
    hint.textContent = hint.textContent.replace(STALE_HUD_CONTROLS, CURRENT_HUD_CONTROLS);
    return true;
  }

  function sync() {
    queued = false;
    const help = syncHelp();
    const hint = syncHudHint();
    return help || hint;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  window.addEventListener('resize', schedule, { passive:true });
  window.addEventListener('orientationchange', schedule, { passive:true });
  window.addEventListener('focus', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('keydown', schedule, false);
  document.addEventListener('click', schedule, false);
  document.addEventListener('fullscreenchange', schedule);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  schedule();
  window.__DE_HELP_COPY_V126 = {
    version:'1.3.2', owner:'help-copy-v126', locale:english?'en':'zh-CN',
    syncHelp, syncHudHint, sync, schedule,
  };
})();
