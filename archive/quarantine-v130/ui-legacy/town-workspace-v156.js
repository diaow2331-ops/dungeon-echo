/* Dungeon Echo town workspace v1.5.6.
 * Presentation-only owner for the Greedy Expedition town.
 *
 * The legacy core may continue maintaining its historical town DOM for compatibility,
 * but that DOM is hidden here. Players see one fixed-route workspace with bounded panels:
 * Gear / Market / Fortune / Progress. This avoids long-page scrolling, keeps the dungeon
 * canvas out of the town presentation, and removes visible locale races without polling or
 * MutationObserver translation passes.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_TOWN_WORKSPACE_V156) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const town = document.getElementById('town-screen');
  const card = town && town.querySelector('.title-card');
  if (!town || !card) return;

  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const data = window.DE_LOCALE_DATA || null;
  const t = (zh, en) => english ? en : zh;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
  const classNames = {
    warrior:['战士','Warrior'], ranger:['游侠','Ranger'], mage:['秘术师','Arcanist'], assassin:['刺客','Assassin'],
  };
  const itemName = item => data && typeof data.itemName === 'function' ? data.itemName(item) : String(item && item.name || '');
  const slotName = slot => data && typeof data.slotName === 'function' ? data.slotName(slot) : t({weapon:'武器',armor:'护甲',helmet:'头盔',boots:'靴子',ring:'戒指',amulet:'项链'}[slot] || slot, {weapon:'Weapon',armor:'Armor',helmet:'Helmet',boots:'Boots',ring:'Ring',amulet:'Amulet'}[slot] || slot);
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : fn => Promise.resolve().then(fn);
  let activeTab = 'gear';

  function installStyle() {
    if (document.getElementById('de-town-workspace-style-v156')) return;
    const style = document.createElement('style');
    style.id = 'de-town-workspace-style-v156';
    style.textContent = `
      #town-screen{overflow:hidden!important;padding:12px!important;background:#080504!important;background-image:radial-gradient(circle at 50% 15%,rgba(83,49,27,.20),rgba(5,3,2,.97) 68%),url("art/town-backdrop-v11.webp")!important;background-position:center!important;background-size:cover!important}
      #town-screen>.title-card{width:min(1180px,calc(100vw - 24px))!important;height:calc(100dvh - 24px);max-height:920px;min-height:0;margin:auto!important;padding:16px 18px 14px!important;display:flex!important;flex-direction:column;gap:8px;overflow:hidden!important;background:linear-gradient(145deg,rgba(31,21,15,.985),rgba(12,8,7,.99));box-shadow:0 22px 72px rgba(0,0,0,.78)}
      #town-screen>.title-card>.kicker,#town-screen>.title-card>h2,#town-screen>.title-card>.lede{margin-top:0;margin-bottom:2px}
      #town-screen>.title-card>h2{font-size:clamp(24px,3vw,34px);line-height:1.05}
      #town-screen>.title-card>.lede.dim-note{font-size:12px;line-height:1.4;margin-bottom:2px}
      #town-screen #town-scene{display:block;flex:0 0 auto;width:100%;height:clamp(92px,17vh,158px)!important;object-fit:cover;border-radius:8px;margin:0!important}
      #town-screen .de-town-legacy{display:none!important}
      #town-screen #town-checkpoints{display:none!important}
      #de-town-workspace{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;gap:8px}
      .de-town-summary{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:8px;flex:0 0 auto}
      .de-town-chip{min-width:0;padding:8px 10px;border:1px solid rgba(224,167,58,.18);border-left:3px solid rgba(224,167,58,.62);background:rgba(7,5,4,.30);text-align:left}
      .de-town-chip.warn{border-left-color:#b9644d}.de-town-chip.good{border-left-color:#6f9d78}
      .de-town-chip b{display:block;color:#eadab9;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.de-town-chip span{display:block;color:#9f917f;font-size:11px;line-height:1.35;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .de-town-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;flex:0 0 auto;padding-bottom:1px}.de-town-tabs::-webkit-scrollbar{display:none}
      .de-town-tab{min-height:38px!important;padding:7px 15px!important;white-space:nowrap;border-radius:5px!important;color:#b8a892!important;background:rgba(18,12,9,.72)!important}.de-town-tab[aria-selected="true"]{color:#1a1008!important;background:#d8a53c!important;border-color:#f0cc78!important}
      .de-town-panel{display:none;flex:1 1 auto;min-height:0;overflow:hidden;border:1px solid rgba(224,167,58,.17);border-radius:8px;background:rgba(7,5,4,.25)}
      .de-town-panel.active{display:flex;flex-direction:column}
      .de-town-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px 8px;border-bottom:1px solid rgba(224,167,58,.14)}
      .de-town-panel-head b{color:#f0d999}.de-town-panel-head small{color:#948674}.de-town-panel-head button{min-height:34px!important;padding:5px 10px!important}
      .de-town-scroll{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;padding:10px;scrollbar-gutter:stable}
      .de-town-gear-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;height:100%;min-height:0}
      .de-town-service{display:flex;min-height:0;flex-direction:column;border:1px solid rgba(224,167,58,.13);border-radius:7px;background:rgba(15,10,8,.42)}
      .de-town-item-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;align-content:start}
      .de-town-item{min-width:0;padding:9px;border:1px solid rgba(224,167,58,.16);border-radius:6px;background:linear-gradient(145deg,rgba(38,25,17,.72),rgba(18,12,9,.72));text-align:left}
      .de-town-item-name{display:block;color:#e4d3b5;font-weight:650;font-size:12px;line-height:1.35;overflow-wrap:anywhere}.de-town-item-meta{display:block;color:#948674;font-size:10px;line-height:1.35;margin-top:4px}
      .de-town-item-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:8px}.de-town-item-actions button{min-width:0;min-height:32px!important;padding:5px 5px!important;font-size:11px!important;overflow:hidden;text-overflow:ellipsis}
      .de-town-empty{padding:16px;color:#8f8170;text-align:center;font-size:12px;line-height:1.5}
      #de-town-market .shop-row{margin:0 0 7px;padding:9px 10px;grid-template-columns:minmax(0,1fr) auto auto;background:rgba(23,15,11,.58)}
      #de-town-market .shop-row button{min-height:34px;padding:6px 10px}
      #de-town-fortune{align-items:center;justify-content:center;text-align:center}.de-town-wheel-wrap{width:min(720px,100%);margin:auto;display:grid;grid-template-columns:minmax(230px,300px) minmax(240px,1fr);align-items:center;gap:22px;padding:10px 14px}.de-town-wheel-copy{text-align:left}.de-town-wheel-copy h3{margin:0 0 7px;color:#f0d999}.de-town-wheel-copy p{color:#9f917f;font-size:12px;line-height:1.55}.de-town-wheel-actions{display:flex;flex-wrap:wrap;gap:7px}.de-town-wheel-actions button{min-height:38px!important}.de-town-wheel-state{display:block;margin-top:8px;color:#8f8170;font-size:11px;line-height:1.45}
      #wheel-canvas{width:min(260px,100%);height:auto;aspect-ratio:1;border-radius:50%;justify-self:center}
      .de-town-progress-grid{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.de-town-progress-grid button{min-width:76px}.de-town-progress-grid button.active{outline:2px solid rgba(242,210,123,.72);outline-offset:1px}
      .de-town-portal{display:flex;gap:7px;flex-wrap:wrap}.de-town-portal a,.de-title-portal a{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:6px 10px;border:1px solid rgba(224,167,58,.30);border-radius:4px;background:rgba(20,14,10,.62);color:#cbb895;text-decoration:none;font-size:11px;font-weight:650}.de-town-portal a:hover,.de-title-portal a:hover{border-color:#d8a53c;color:#f1d89b}
      .de-title-portal{display:flex;justify-content:center;gap:7px;flex-wrap:wrap;margin:0 0 10px}
      #town-screen>.title-card>.title-actions{display:grid!important;grid-template-columns:minmax(180px,2fr) repeat(2,minmax(120px,1fr));gap:7px;flex:0 0 auto;margin-top:0}#town-screen>.title-card>.title-actions button{min-height:38px!important;padding:7px 10px!important}
      @media(max-width:780px){#town-screen{padding:6px!important}#town-screen>.title-card{width:calc(100vw - 12px)!important;height:calc(100dvh - 12px);padding:10px!important;gap:6px}#town-screen>.title-card>h2{font-size:23px}#town-screen>.title-card>.kicker,#town-screen>.title-card>.lede.dim-note{display:none}#town-screen #town-scene{height:88px!important}.de-town-summary{grid-template-columns:1fr 1fr}.de-town-summary .de-town-chip:last-child{display:none}.de-town-gear-grid{grid-template-columns:1fr}.de-town-service{max-height:none}.de-town-wheel-wrap{grid-template-columns:1fr;gap:8px;padding:6px}.de-town-wheel-copy{text-align:center}.de-town-wheel-actions{justify-content:center}#wheel-canvas{width:min(190px,48vw)}#town-screen>.title-card>.title-actions{grid-template-columns:1fr 1fr}#town-screen #btn-depart{grid-column:1/-1}.de-town-item-grid{grid-template-columns:repeat(auto-fill,minmax(145px,1fr))}}
      @media(max-width:430px){.de-town-summary{grid-template-columns:1fr}.de-town-summary .de-town-chip:nth-child(2){display:none}.de-town-tab{padding:6px 11px!important}.de-town-panel-head{padding:8px}.de-town-scroll{padding:7px}.de-town-item-actions{grid-template-columns:1fr 1fr}.de-town-item-actions button:first-child{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function installPortalLinks() {
    const titleCard = document.querySelector('#title-screen>.title-card');
    if (titleCard && !titleCard.querySelector('.de-title-portal')) {
      const nav = document.createElement('nav');
      nav.className = 'de-title-portal';
      nav.setAttribute('aria-label', t('站点导航','Site navigation'));
      nav.innerHTML = `<a href="https://91hwl.cn/">${t('← 返回 91hwl','← 91hwl Home')}</a><a href="https://play.91hwl.cn/moyu/">${t('体验《摸鱼到下班》','Play Clock Out Alive')}</a>`;
      const kicker = titleCard.querySelector('.kicker');
      if (kicker && kicker.nextSibling) titleCard.insertBefore(nav, kicker.nextSibling);
      else titleCard.insertBefore(nav, titleCard.firstChild);
    }
  }

  function retireLegacyTownSinks() {
    const renameHide = (id, next) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.id = next;
      el.hidden = true;
    };
    renameHide('town-head','town-head-legacy');
    renameHide('town-growth','town-growth-legacy');
    renameHide('town-bag','town-bag-legacy');
    renameHide('town-stash','town-stash-legacy');
    const legacyCols = town.querySelector('.town-cols');
    if (legacyCols) legacyCols.classList.add('de-town-legacy');
    const legacyWheel = document.getElementById('town-wheel');
    if (legacyWheel) {
      legacyWheel.id = 'town-wheel-legacy';
      legacyWheel.innerHTML = '';
    }
  }

  function buildWorkspace() {
    if (document.getElementById('de-town-workspace')) return;
    const actions = town.querySelector('.title-actions');
    if (!actions) return;
    const root = document.createElement('section');
    root.id = 'de-town-workspace';
    root.setAttribute('aria-label', t('城镇工作台','Town workspace'));
    root.innerHTML = `
      <div class="de-town-summary" id="de-town-summary"></div>
      <div class="de-town-tabs" role="tablist" aria-label="${t('城镇功能','Town services')}">
        <button type="button" class="de-town-tab" data-de-town-tab="gear" role="tab">${t('装备与仓库','Gear & Stash')}</button>
        <button type="button" class="de-town-tab" data-de-town-tab="market" role="tab">${t('补给市集','Market')}</button>
        <button type="button" class="de-town-tab" data-de-town-tab="fortune" role="tab">${t('命运转盘','Fortune')}</button>
        <button type="button" class="de-town-tab" data-de-town-tab="progress" role="tab">${t('远征进度','Progress')}</button>
      </div>
      <section class="de-town-panel" id="de-town-gear" data-de-town-panel="gear" role="tabpanel">
        <div class="de-town-gear-grid">
          <section class="de-town-service"><div class="de-town-panel-head"><span><b>${t('随身背包','Backpack')}</b><br><small>${t('死亡会失去','Carried · at risk')}</small></span><button type="button" data-depositall="1">${t('全部存入','Store All')}</button></div><div class="de-town-scroll"><div id="de-town-bag" class="de-town-item-grid"></div></div></section>
          <section class="de-town-service"><div class="de-town-panel-head"><span><b>${t('安全仓库','Stash')}</b><br><small>${t('死亡也会保留','Fully safe')}</small></span><span id="de-town-stash-count"></span></div><div class="de-town-scroll"><div id="de-town-stash" class="de-town-item-grid"></div></div></section>
        </div>
      </section>
      <section class="de-town-panel" id="de-town-market-panel" data-de-town-panel="market" role="tabpanel"><div class="de-town-panel-head"><span><b>${t('限量市集','Limited Market')}</b><br><small>${t('库存随远征周期刷新','Stock refreshes after a completed return')}</small></span></div><div class="de-town-scroll" id="de-town-market"></div></section>
      <section class="de-town-panel" id="de-town-fortune" data-de-town-panel="fortune" role="tabpanel"><div class="de-town-scroll"><div class="de-town-wheel-wrap"><canvas id="wheel-canvas" width="240" height="240"></canvas><div class="de-town-wheel-copy"><h3>${t('命运转盘','Fortune Wheel')}</h3><p class="wheel-hint" id="de-town-wheel-hint">${t('每格最多领取一次；空门也是真实结果。','Each prize slot can pay once; an empty slot is a real outcome.')}</p><div class="de-town-wheel-actions"><button type="button" data-wheelspin="1" id="de-town-spin"></button><button type="button" data-wheelreset="1" id="de-town-reset"></button></div><small class="de-town-wheel-state" id="de-town-wheel-state"></small></div></div></div></section>
      <section class="de-town-panel" id="de-town-progress" data-de-town-panel="progress" role="tabpanel"><div class="de-town-scroll"><div class="de-town-panel-head"><span><b>${t('已征服检查点','Conquered Checkpoints')}</b><br><small id="de-town-progress-copy"></small></span></div><div class="de-town-progress-grid" id="de-town-progress-grid"></div><div class="de-town-portal" style="margin-top:14px"><a href="https://91hwl.cn/">${t('← 返回 91hwl','← 91hwl Home')}</a><a href="https://play.91hwl.cn/moyu/">${t('体验《摸鱼到下班》','Play Clock Out Alive')}</a></div></div></section>`;
    card.insertBefore(root, actions);
  }

  function classLabel(id) {
    const pair = classNames[id] || [id || '冒险者', id || 'Adventurer'];
    return english ? pair[1] : pair[0];
  }

  function tier() {
    const econ = window.DE_TOWN_ECONOMY;
    if (econ && typeof econ.tier === 'function') return Number(econ.tier()) || 1;
    return Math.max(1, Math.min(10, Math.ceil((Number(api.meta && api.meta.bestDepth) || 1) / 10)));
  }

  function renderSummary() {
    const meta = api.meta;
    const root = document.getElementById('de-town-summary');
    if (!meta || !root) return;
    const townTier = tier();
    const best = Number(meta.bestDepth) || 0;
    const ready = (Number(meta.potions) || 0) >= 2 && (Number(meta.escapes) || 0) >= 1;
    const next = townTier >= 10 ? t('城镇已完成最终扩建','Town fully developed') : t(`击败第 ${townTier * 10} 层守卫后进入阶段 ${townTier + 1}`, `Defeat the Floor ${townTier * 10} guardian to unlock Tier ${townTier + 1}`);
    root.innerHTML = `
      <div class="de-town-chip"><b>${esc(classLabel(meta.classId))} · ${t('等级','Level')} ${Number(meta.lvl)||1} · ${t('金库','Vault')} ${Number(meta.gold)||0} G</b><span>${t(`最深 ${best} 层 · 远征 ${Number(meta.runs)||0} 次`,`Deepest Floor ${best} · Expeditions ${Number(meta.runs)||0}`)}</span></div>
      <div class="de-town-chip ${ready?'good':'warn'}"><b>${ready?t('远征整备完成','Expedition Ready'):t('补给仍有缺口','Supplies Missing')}</b><span>${t('药水','Potions')} ${Number(meta.potions)||0} · ${t('回城卷轴','Return Scrolls')} ${Number(meta.escapes)||0} · ${t('钥匙','Keys')} ${Number(meta.keys)||0}</span></div>
      <div class="de-town-chip"><b>${t(`城镇阶段 ${townTier}/10`,`Town Tier ${townTier}/10`)}</b><span>${esc(next)}</span></div>`;
  }

  function itemCard(item, where, index) {
    const fit = Number(item && item.score) || 0;
    const value = typeof api.itemValueScore === 'function' ? api.itemValueScore(item) : fit;
    const forge = Number(item && item.forge) || 0;
    const forgeCost = typeof api.forgeCost === 'function' ? api.forgeCost(item) : 0;
    const sell = typeof api.sellPrice === 'function' ? api.sellPrice(item) : 0;
    const canForge = forge < 5 && Number(api.meta && api.meta.gold) >= forgeCost;
    const primary = where === 'bag'
      ? `<button type="button" data-deposit="${index}">${t('存入','Store')}</button>`
      : `<button type="button" data-withdraw="${index}"${(api.meta && api.meta.bag && api.meta.bag.length >= 12)?' disabled':''}>${t('取出','Take')}</button>`;
    return `<article class="de-town-item"><span class="de-town-item-name">${esc(itemName(item))}</span><span class="de-town-item-meta">${esc(slotName(item.slot))} · ${t('适配','Fit')} ${fit} · ${t('价值','Value')} ${value}${forge?` · +${forge}`:''}</span><div class="de-town-item-actions">${primary}<button type="button" data-forge="${where}:${index}"${canForge?'':' disabled'} title="${forge>=5?t('已至 +5','Max +5'):t(`强化费用 ${forgeCost} G`,`Forge cost ${forgeCost} G`)}">${t('强化','Forge')}</button><button type="button" data-sell="${where}:${index}">${t(`卖 ${sell}G`,`Sell ${sell}G`)}</button></div></article>`;
  }

  function renderGear() {
    const meta = api.meta;
    if (!meta) return;
    const bag = document.getElementById('de-town-bag');
    const stash = document.getElementById('de-town-stash');
    const stashCount = document.getElementById('de-town-stash-count');
    const bagRows = Array.isArray(meta.bag) ? meta.bag : [];
    const stashRows = Array.isArray(meta.stash) ? meta.stash : [];
    if (bag) bag.innerHTML = bagRows.length ? bagRows.map((it,i)=>itemCard(it,'bag',i)).join('') : `<div class="de-town-empty">${t('背包为空。下潜搜刮，或从仓库取出装备。','Backpack empty. Descend for loot or withdraw gear from the stash.')}</div>`;
    if (stash) stash.innerHTML = stashRows.length ? stashRows.map((it,i)=>itemCard(it,'stash',i)).join('') : `<div class="de-town-empty">${t('仓库为空。存入装备后，即使死亡也不会失去。','Stash empty. Stored gear remains safe even after death.')}</div>`;
    if (stashCount) stashCount.textContent = `${stashRows.length}`;
  }

  function renderMarket() {
    const legacy = document.getElementById('town-shop');
    const visible = document.getElementById('de-town-market');
    const commerce = window.DE_COMMERCE;
    if (!legacy || !visible) return;
    if (commerce && typeof commerce.renderShop === 'function') commerce.renderShop(true);
    visible.innerHTML = legacy.innerHTML || `<div class="de-town-empty">${t('市集正在整理库存。','The market is preparing its stock.')}</div>`;
  }

  function renderFortune() {
    const meta = api.meta;
    if (!meta) return;
    const econ = window.DE_TOWN_ECONOMY;
    const spin = document.getElementById('de-town-spin');
    const reset = document.getElementById('de-town-reset');
    const state = document.getElementById('de-town-wheel-state');
    const sc = econ && typeof econ.wheelSpinCost === 'function' ? Number(econ.wheelSpinCost()) || 0 : (typeof api.spinCost === 'function' ? api.spinCost() : 40);
    const rc = econ && typeof econ.wheelResetCost === 'function' ? Number(econ.wheelResetCost()) || 0 : (typeof api.resetWheelCost === 'function' ? api.resetWheelCost() : 60);
    const claimed = econ && typeof econ.claimedWheelSlots === 'function' ? Number(econ.claimedWheelSlots()) || 0 : 0;
    if (spin) {
      spin.textContent = claimed >= 8 ? t('本轮已全部领取','All Prizes Claimed') : t(`抽奖 ${sc} G`,`Spin ${sc} G`);
      spin.disabled = claimed >= 8 || Number(meta.gold) < sc;
    }
    if (reset) {
      reset.textContent = t(`重置 ${rc} G`,`Reset ${rc} G`);
      reset.disabled = Number(meta.gold) < rc;
    }
    if (state) state.textContent = t(`城镇阶段 ${tier()} · 已领取 ${claimed}/8 格；已领取格不会重复发奖。`,`Town Tier ${tier()} · ${claimed}/8 slots claimed; claimed slots never pay twice.`);
  }

  function renderProgress() {
    const checkpoints = window.DE_TOWN_CHECKPOINTS;
    const grid = document.getElementById('de-town-progress-grid');
    const copy = document.getElementById('de-town-progress-copy');
    if (!grid) return;
    const unlocked = checkpoints && typeof checkpoints.unlocked === 'function' ? checkpoints.unlocked() : [1];
    const selected = checkpoints ? Number(checkpoints.selected) || 1 : 1;
    const best = Number(api.meta && api.meta.bestDepth) || 0;
    grid.innerHTML = unlocked.map(d => `<button type="button" data-checkpoint="${d}" class="${d===selected?'active':''}">${english?`Floor ${d}`:`第 ${d} 层`}</button>`).join('');
    if (copy) copy.textContent = t(`最深到达 ${best} 层 · 每击败一个十层守卫解锁下一段。`,`Deepest Floor ${best} · each 10-floor guardian unlocks the next segment.`);
  }

  function hideLegacyCheckpoint() {
    const cp = document.getElementById('town-checkpoints');
    if (cp) cp.style.display = 'none';
  }

  function renderAll() {
    if (api.state !== 'town' || !api.meta) return false;
    hideLegacyCheckpoint();
    renderSummary();
    renderGear();
    renderMarket();
    renderFortune();
    renderProgress();
    return true;
  }

  function setTab(tab) {
    if (!['gear','market','fortune','progress'].includes(tab)) tab = 'gear';
    activeTab = tab;
    document.querySelectorAll('[data-de-town-tab]').forEach(btn => {
      const on = btn.dataset.deTownTab === tab;
      btn.setAttribute('aria-selected', String(on));
      btn.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('[data-de-town-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.deTownPanel === tab));
    renderAll();
  }

  installStyle();
  installPortalLinks();
  retireLegacyTownSinks();
  buildWorkspace();
  setTab(activeTab);

  town.addEventListener('click', e => {
    const tab = e.target && e.target.closest ? e.target.closest('[data-de-town-tab]') : null;
    if (tab) {
      e.preventDefault();
      setTab(tab.dataset.deTownTab);
      return;
    }
    // Core/system handlers update data earlier in the same event path. A microtask renders
    // the fixed workspace after all synchronous settlement but before the browser paints.
    defer(renderAll);
  }, false);
  document.addEventListener('keydown', () => defer(renderAll), false);
  window.addEventListener('pageshow', () => defer(renderAll));
  window.addEventListener('focus', () => defer(renderAll));

  window.__DE_TOWN_WORKSPACE_V156 = Object.freeze({
    version:'v156', owner:'town-workspace-v156', locale:english?'en':'zh-CN',
    render:renderAll, setTab, get tab(){ return activeTab; },
  });
})();
