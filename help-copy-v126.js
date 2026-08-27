/* Dungeon Echo v1.2.6 Help controls copy coherence.
 * Runs after locale + mobile owners so device-specific control guidance never overwrites the selected language.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_HELP_COPY_V126) return;

  let queued = false;
  const english = () => !!(window.DE_I18N && window.DE_I18N.isEnglish);
  const mobile = () => document.documentElement.classList.contains('de-mobile-ui');

  function sync() {
    queued = false;
    const p = document.querySelector('#help-screen .help-cols p');
    if (!p) return false;
    const en = english();
    if (en && mobile()) {
      p.innerHTML = 'Desktop: <b>WASD / arrow keys</b> move and face; <b>J</b> attacks, <b>K</b> uses a skill, <b>Space / .</b> waits.<br>Mobile: use the <b>four-way D-pad</b> to move and face; <b>Attack / Skill</b> are the primary right-side actions. The center Wait target is intentionally removed to prevent mis-taps.<br>Potion Q · Scroll E · Return T · Descend Enter · Pause Esc.';
    } else if (en) {
      p.innerHTML = 'Move: <b>WASD / arrow keys / click explored tiles</b><br>Attack: <b>J</b> (current facing) · Wait: <b>Space / .</b><br>Skill: <b>K</b> (costs mana) · Potion: <b>Q</b> · Scroll: <b>E</b><br>Return: <b>T</b> · Descend: <b>Enter</b> (on stairs)<br>Pause: <b>Esc</b> · Sound: <b>M</b> · Fullscreen: <b>F</b>';
    } else if (mobile()) {
      p.innerHTML = '电脑：<b>WASD / 方向键</b>移动与转向，<b>J</b>攻击，<b>K</b>技能，<b>空格 / .</b>等待。<br>手机：<b>左侧四向方向盘</b>移动与转向，右侧<b>攻击 / 技能</b>为主操作；中央等待键已移除以避免误触。<br>药水 Q · 卷轴 E · 回城 T · 下楼 Enter · 暂停 Esc。';
    } else {
      p.innerHTML = '移动：<b>方向键 / WASD / 点击已探索地块</b><br>攻击：<b>J</b>（当前面向） · 等待：<b>空格 / .</b><br>技能：<b>K</b>（消耗蓝量） · 药水：<b>Q</b> · 卷轴：<b>E</b><br>回城：<b>T</b> · 下潜：<b>Enter</b>（楼梯上）<br>暂停：<b>Esc</b> · 声音：<b>M</b> · 全屏：<b>F</b>';
    }
    p.dataset.helpCopy = '1.2.6';
    return true;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  window.addEventListener('resize', schedule, { passive:true });
  window.addEventListener('orientationchange', schedule, { passive:true });
  document.addEventListener('fullscreenchange', schedule);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(schedule).observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
  }
  schedule();
  window.__DE_HELP_COPY_V126 = { version:'1.2.6', sync };
})();
