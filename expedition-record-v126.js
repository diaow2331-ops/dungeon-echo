/* Dungeon Echo expedition record presentation v1.3.4.
 * Read-only UI owner for the Greedy Expedition record: full catalog, progress and zero-state.
 * Fixed-route locale owns every visible label; this module never mutates gameplay, balance or save data.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_EXPEDITION_RECORD_V126) return;

  const META_KEY = 'de-greedy-meta-v1';
  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const CATALOG = Object.freeze([
    { id:'first_run', zh:['初次远征','出发进行一次贪婪远征'], en:['First Expedition','Begin a Greedy Expedition.'], value:m=>m.runs, target:1, unit:['次','run'] },
    { id:'depth_10', zh:['深入地底','到达第 10 层'], en:['Below the Threshold','Reach Floor 10.'], value:m=>m.bestDepth, target:10, unit:['层','floors'] },
    { id:'depth_30', zh:['地底行者','到达第 30 层'], en:['Underworld Walker','Reach Floor 30.'], value:m=>m.bestDepth, target:30, unit:['层','floors'] },
    { id:'depth_60', zh:['深渊旅人','到达第 60 层'], en:['Abyss Traveler','Reach Floor 60.'], value:m=>m.bestDepth, target:60, unit:['层','floors'] },
    { id:'depth_100', zh:['百层勇者','到达第 100 层'], en:['Hundred-Floor Victor','Reach Floor 100.'], value:m=>m.bestDepth, target:100, unit:['层','floors'] },
    { id:'kills_100', zh:['屠戮者','累计击杀 100 个敌人'], en:['Slayer','Defeat 100 enemies across expeditions.'], value:m=>m.totalKills, target:100, unit:['击杀','kills'] },
    { id:'kills_500', zh:['千斩万剐','累计击杀 500 个敌人'], en:['Five Hundred Echoes','Defeat 500 enemies across expeditions.'], value:m=>m.totalKills, target:500, unit:['击杀','kills'] },
    { id:'rich', zh:['富甲一方','金库持有 1000 金币'], en:['Vault of Gold','Hold 1,000 Gold in the vault.'], value:m=>m.gold, target:1000, unit:['金币','Gold'] },
    { id:'wheel_10', zh:['回响赌徒','转盘累计抽奖 10 次'], en:['Echo Gambler','Spin the fortune wheel 10 times.'], value:m=>m.wheelTotal, target:10, unit:['次','spins'] },
    { id:'deaths_5', zh:['死神常客','远征中死亡 5 次'], en:['Death’s Regular','Die 5 times in Greedy Expeditions.'], value:m=>m.deaths, target:5, unit:['次','deaths'] },
    { id:'legend', zh:['传说收藏家','装备过一件传说装备'], en:['Legend Collector','Equip a legendary item.'], value:m=>m.gotLegend?1:0, target:1, unit:['件','item'] },
    { id:'win', zh:['心之归途','带走第 100 层的地牢之心'], en:['Heartbound Homecoming','Leave Floor 100 with the Dungeon Heart.'], value:m=>m.wins, target:1, unit:['次','win'] },
  ]);

  const num = v => Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0;
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function readMeta() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(META_KEY) || 'null'); } catch (_err) {}
    const hasProfile = !!(raw && typeof raw === 'object' && !Array.isArray(raw));
    raw = hasProfile ? raw : {};
    return {
      hasProfile,
      bestDepth:num(raw.bestDepth), runs:num(raw.runs), totalKills:num(raw.totalKills), deaths:num(raw.deaths),
      gold:num(raw.gold), wheelTotal:num(raw.wheelTotal), wins:num(raw.wins), gotLegend:raw.gotLegend ? 1 : 0,
      achv:raw.achv && typeof raw.achv === 'object' && !Array.isArray(raw.achv) ? raw.achv : {},
    };
  }

  function unlocked(item, meta) {
    return !!meta.achv[item.id] || num(item.value(meta)) >= item.target;
  }

  function injectStyle() {
    if (document.getElementById('de-expedition-record-v126-style')) return;
    const style = document.createElement('style');
    style.id = 'de-expedition-record-v126-style';
    style.textContent = `
#achv-screen > .title-card{width:min(1120px,100%)}
#achv-stats{margin:4px 0 16px}
.de-record-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px;padding:10px 12px;border:1px solid rgba(215,166,64,.28);background:rgba(10,7,5,.34);text-align:left}
.de-record-summary strong{color:var(--accent-hi);font-size:15px}.de-record-summary span{color:var(--dim);font-size:12px}
.de-record-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.de-record-stat{min-width:0;padding:9px 11px;border:1px solid rgba(139,104,53,.36);background:rgba(15,10,8,.58);text-align:left}
.de-record-stat span,.de-record-stat b{display:block}.de-record-stat span{color:var(--dim);font-size:11px}.de-record-stat b{margin-top:2px;color:#fff7e8;font-size:15px}
#achv-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
#achv-grid .achv-card{display:flex;min-height:144px;flex-direction:column;padding:14px 15px;background:linear-gradient(160deg,rgba(36,25,18,.92),rgba(15,10,8,.96));border:1px solid var(--border);box-shadow:0 7px 18px rgba(0,0,0,.2);opacity:1;filter:none}
#achv-grid .achv-card.achv-locked{opacity:.66;filter:saturate(.72)}
#achv-grid .achv-card.achv-unlocked{border-color:rgba(215,166,64,.7);box-shadow:inset 0 0 0 1px rgba(242,210,123,.06),0 8px 22px rgba(0,0,0,.28)}
#achv-grid .achv-card h3{color:var(--accent-hi);font-size:15px;line-height:1.35}
#achv-grid .achv-card p{margin-top:6px;line-height:1.5}
.de-achv-progress{margin-top:auto;padding-top:11px;color:var(--dim);font:11px/1.35 Consolas,monospace}
.de-achv-bar{height:4px;margin-top:6px;overflow:hidden;background:#0c0806;border:1px solid rgba(139,104,53,.32)}
.de-achv-bar i{display:block;height:100%;background:var(--accent);transform-origin:left center}
.de-record-empty-note{margin:0 0 12px;padding:9px 11px;color:var(--dim);background:rgba(8,6,5,.35);border-left:3px solid var(--border-hi);font-size:12px;text-align:left}
@media(max-width:820px){.de-record-stats,#achv-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:540px){#achv-screen{padding:10px 7px calc(10px + env(safe-area-inset-bottom))}.de-record-summary{align-items:flex-start;flex-direction:column}.de-record-stats,#achv-grid{grid-template-columns:1fr}#achv-grid .achv-card{min-height:122px}}
`;
    document.head.appendChild(style);
  }

  function render() {
    const root = document.getElementById('achv-screen');
    if (!root) return false;
    injectStyle();
    const meta = readMeta();
    const gotCount = CATALOG.filter(item => unlocked(item, meta)).length;

    const kicker = root.querySelector('.title-card > .kicker');
    const title = root.querySelector('.title-card > h2');
    const section = root.querySelector('.title-card > h3');
    const close = document.getElementById('btn-achv-close');
    if (kicker) kicker.textContent = english ? 'GREEDY EXPEDITION · RECORD' : '贪婪远征 · 远征录';
    if (title) title.textContent = english ? 'Expedition Record' : '远征档案';
    if (section) section.textContent = english ? `Achievements · ${gotCount}/${CATALOG.length}` : `成就 · ${gotCount}/${CATALOG.length}`;
    if (close) close.textContent = english ? 'Close' : '关闭';

    const statsEl = document.getElementById('achv-stats');
    const stats = english ? [
      ['Deepest Floor', meta.bestDepth], ['Expeditions', meta.runs], ['Total Kills', meta.totalKills],
      ['Deaths', meta.deaths], ['Vault Gold', `${meta.gold} G`], ['Wheel Spins', meta.wheelTotal],
    ] : [
      ['最深到达', `${meta.bestDepth} 层`], ['远征次数', meta.runs], ['累计击杀', meta.totalKills],
      ['死亡次数', meta.deaths], ['金库金币', `${meta.gold} G`], ['转盘总抽数', meta.wheelTotal],
    ];
    if (statsEl) {
      const summary = english
        ? `<div class="de-record-summary"><strong>${gotCount} / ${CATALOG.length} unlocked</strong><span>${meta.hasProfile ? 'Progress is read from this browser’s Greedy Expedition save.' : 'No expedition profile yet — the full catalog is still visible below.'}</span></div>`
        : `<div class="de-record-summary"><strong>已解锁 ${gotCount} / ${CATALOG.length}</strong><span>${meta.hasProfile ? '进度读取自当前浏览器的贪婪远征存档。' : '尚未建立远征档案——仍可先查看下方完整成就目录。'}</span></div>`;
      const note = meta.hasProfile ? '' : `<div class="de-record-empty-note">${english ? 'Start a Greedy Expedition to begin recording progress. Locked achievements are shown in advance so the route is never hidden.' : '开始一次贪婪远征后即可记录进度。未完成成就会提前显示，不再把成长目标藏起来。'}</div>`;
      statsEl.innerHTML = summary + note + `<div class="de-record-stats">${stats.map(([k,v])=>`<div class="de-record-stat"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`;
    }

    const grid = document.getElementById('achv-grid');
    if (grid) grid.innerHTML = CATALOG.map(item => {
      const got = unlocked(item, meta);
      const value = Math.max(0, num(item.value(meta)));
      const shown = Math.min(value, item.target);
      const pct = Math.max(0, Math.min(100, Math.round((shown / item.target) * 100)));
      const text = english ? item.en : item.zh;
      const unit = english ? item.unit[1] : item.unit[0];
      const progress = got ? (english ? 'Unlocked' : '已解锁') : `${shown} / ${item.target}${unit ? ` ${unit}` : ''}`;
      return `<article class="class-card achv-card ${got ? 'achv-unlocked' : 'achv-locked'}" data-achv-id="${item.id}" aria-label="${esc(text[0])}">` +
        `<h3>${got ? '◆' : '◇'} ${esc(text[0])}</h3><p>${esc(text[1])}</p>` +
        `<div class="de-achv-progress">${esc(progress)}<div class="de-achv-bar" aria-hidden="true"><i style="width:${got ? 100 : pct}%"></i></div></div></article>`;
    }).join('');
    root.dataset.recordUi = '1.3.4';
    return true;
  }

  function scheduleRender() {
    if (typeof queueMicrotask === 'function') queueMicrotask(render);
    else setTimeout(render, 0);
  }

  ['btn-achv','btn-achv-town'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', scheduleRender);
  });
  const screen = document.getElementById('achv-screen');
  if (screen && !screen.classList.contains('hidden')) scheduleRender();

  window.__DE_EXPEDITION_RECORD_V126 = { version:'1.3.4', owner:'expedition-record-v126', locale:english?'en':'zh-CN', render, catalogSize:CATALOG.length };
})();