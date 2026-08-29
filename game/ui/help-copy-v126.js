/* Dungeon Echo controls-copy coherence v1.4.2.
 * DOM-only presentation follower: describes the canonical input contract owned by game.js.
 * It also repairs one stale English default HUD hint left behind by the retired J/K+Mana input path.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_HELP_COPY_V126) return;

  let queued = false;
  const english = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase() === 'en';
  const mobile = () => document.documentElement.classList.contains('de-mobile-ui');
  const STALE_HUD_CONTROLS = 'C Skill · J Quick Dive';
  const CURRENT_HUD_CONTROLS = 'J Basic Attack · K Skill';

  function syncHelp() {
    const p = document.querySelector('#help-screen .help-cols p');
    if (!p) return false;
    if (english && mobile()) {
      p.innerHTML = 'Desktop: <b>WASD / arrow keys</b> move; <b>J</b> attacks; <b>K</b> uses the class skill (<b>C</b> remains an alias); <b>Shift+Enter</b> quick-dives.<br>Mobile: use the <b>D-pad</b> to move and the visible <b>Attack</b> / <b>Skill</b> actions.<br>Wait Space / . · Potion Q · Scroll E · Return T · Descend Enter · Pause Esc.';
    } else if (english) {
      p.innerHTML = 'Move: <b>WASD / arrow keys / click explored tiles</b><br>Basic attack: <b>J</b> · Class skill: <b>K</b> (<b>C</b> alias) · Quick dive: <b>Shift+Enter</b><br>Wait: <b>Space / .</b> · Potion: <b>Q</b> · Scroll: <b>E</b> · Return: <b>T</b><br>Descend: <b>Enter</b> · Pause: <b>Esc</b> · Sound: <b>M</b> · Fullscreen: <b>F</b>';
    } else if (mobile()) {
      p.innerHTML = '电脑：<b>WASD / 方向键</b>移动，<b>J</b>主动攻击，<b>K</b>职业技能（<b>C</b>仍兼容），<b>Shift+Enter</b>快速下潜。<br>手机：使用<b>方向盘</b>移动，使用可见的<b>攻击</b>/<b>技能</b>按钮。<br>等待 空格 / . · 药水 Q · 卷轴 E · 回城 T · 下楼 Enter · 暂停 Esc。';
    } else {
      p.innerHTML = '移动：<b>方向键 / WASD / 点击已探索地块</b><br>主动攻击：<b>J</b> · 职业技能：<b>K</b>（<b>C</b>兼容）· 快速下潜：<b>Shift+Enter</b><br>等待：<b>空格 / .</b> · 药水：<b>Q</b> · 卷轴：<b>E</b> · 回城：<b>T</b><br>下潜：<b>Enter</b> · 暂停：<b>Esc</b> · 声音：<b>M</b> · 全屏：<b>F</b>';
    }
    p.dataset.helpCopy = '1.4.2-current-controls';
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
    version:'1.4.2', owner:'help-copy-v126', locale:english?'en':'zh-CN',
    syncHelp, syncHudHint, sync, schedule,
  };
})();
