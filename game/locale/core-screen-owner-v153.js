/* Dungeon Echo fixed-route core screen owner v1.5.3.
 * Retires translation-after-render for the final legacy core screens without adding
 * DOM observers, polling loops or generic tree translation. The English fixed route
 * owns only the exact dynamic sinks that game.js still renders Chinese-first.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_CORE_SCREEN_OWNER_V153) return;

  const api = window.DE_TEST;
  const data = window.DE_LOCALE_DATA;
  if (!api || api.profileId !== 'classic-100' || !data) return;

  const english = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase() === 'en';
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
  const itemName = item => typeof data.itemName === 'function' ? data.itemName(item) : String(item && item.name || '');
  const className = id => typeof data.className === 'function' ? data.className(id) : String(id || '');
  const worldName = value => typeof data.worldName === 'function' ? data.worldName(value) : String(value || '');
  const visible = id => {
    const el = $(id);
    return !!(el && !el.classList.contains('hidden') && el.getAttribute('aria-hidden') !== 'true');
  };
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  let queued = false;

  const CLASS_EN = Object.freeze({
    warrior:{name:'Warrior',blurb:'Durable melee fighter. Armor scales with level; Cleave controls adjacent packs.',skill:{name:'Cleave',desc:'Deal 150% ATK to adjacent enemies.'}},
    ranger:{name:'Ranger',blurb:'Line-of-sight archer with ranged attacks and agile close-range defense.',skill:{name:'Dash',desc:'Dash 2 tiles and damage enemies crossed.'}},
    mage:{name:'Arcanist',blurb:'Fragile ranged caster. Arcane Bolt pressures armored targets and controls space.',skill:{name:'Arcane Bolt',desc:'Strike the nearest visible enemy, partially ignore DEF and knock it back.'}},
    assassin:{name:'Assassin',blurb:'Fragile burst melee class with innate critical chance and positional pressure.',skill:{name:'Shadowstrike',desc:'Blink beside the nearest visible enemy and land a guaranteed critical strike.'}},
  });

  function bestHtml() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem('de-best')) || {}; } catch (_e) {}
    const n = (v,d=0) => Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.floor(Number(v)) : d;
    return `Deepest: <b>${n(raw.bestDepth)}</b> · Highest Level: <b>${n(raw.bestLvl,1)}</b> · Most Kills: <b>${n(raw.bestKills)}</b> · Most Gold: <b>${n(raw.bestGold)}</b>`;
  }

  function renderTitle() {
    if (!english) return false;
    const save = typeof api.peekRun === 'function' ? api.peekRun() : null;
    const cont = $('btn-continue');
    const metaEl = $('save-meta');
    if (cont) cont.classList.toggle('hidden', !save);
    const mode = api.greedy ? 'Greedy Expedition' : 'Classic Echo';
    if (metaEl) {
      metaEl.textContent = save
        ? `Save (${mode}): ${className(save.classId) || 'Adventurer'} · Floor ${Number(save.depth)||1} · Level ${Number(save.player && save.player.lvl)||1}`
        : `No mid-run save (${mode}). Progress is written when descending, pausing or leaving the page.`;
    }
    const greedy = $('btn-greedy');
    if (greedy) {
      greedy.textContent = api.greedy ? 'Greedy Expedition: On' : 'Greedy Expedition: Off';
      greedy.setAttribute('aria-pressed', String(!!api.greedy));
    }
    return true;
  }

  function renderClassSelect() {
    if (!english) return false;
    const grid = $('class-grid');
    if (!grid) return false;
    grid.innerHTML = Object.values(api.CLASSES || {}).map(c => {
      const copy = CLASS_EN[c.id] || {name:className(c.id)||c.name,blurb:c.blurb||'',skill:{name:c.skill&&c.skill.name||'',desc:c.skill&&c.skill.desc||''}};
      return `<button type="button" class="class-card" data-class="${esc(c.id)}">` +
        `<span class="class-portrait" aria-hidden="true"></span><span class="class-card-copy">` +
        `<h3>${esc(copy.name)}</h3><p>${esc(copy.blurb)}</p>` +
        `<span class="stats">HP ${Number(c.hpBase)||0} · ATK ${Number(c.atkBase)||0} · Potions ${Number(c.potions)||0} · Scrolls ${Number(c.scrolls)||0}` +
        `<br>Skill: ${esc(copy.skill.name)} (Cooldown ${Number(c.skill&&c.skill.cd)||0})<br>${esc(copy.skill.desc)}</span>` +
        `</span></button>`;
    }).join('');
    return true;
  }

  function renderPause() {
    if (!english || api.state !== 'paused') return false;
    const copy = $('pause-copy');
    if (copy) copy.textContent = `Floor ${Number(api.depth)||1} · ${className(api.classId) || 'Adventurer'} · Progress saved locally.`;
    return true;
  }

  function renderOverlay() {
    if (!english || (api.state !== 'dead' && api.state !== 'won')) return false;
    const player = api.player;
    if (!player) return false;
    const title = $('ov-title'), body = $('ov-body'), overlay = $('overlay');
    if (!title || !body || !overlay) return false;
    const cls = className(api.classId) || 'Adventurer';
    if (api.state === 'dead') {
      title.textContent = 'You Died';
      title.className = 'dead';
      body.innerHTML = `You fell on Floor <b>${Number(api.depth)||1}</b>.<br>` +
        `${esc(cls)} · Level <b>${Number(player.lvl)||1}</b> · Kills <b>${Number(player.kills)||0}</b> · Gold <b>${Number(player.gold)||0}</b> · Turns <b>${Number(api.turns)||0}</b><br>` + bestHtml();
    } else {
      const reward = api.runProfile && api.runProfile.terminalReward;
      const heart = worldName(reward && reward.name || '终焉之心') || 'Dungeon Heart';
      title.textContent = 'Victory!';
      title.className = 'win';
      body.innerHTML = `You claimed the <b>${esc(heart)}</b>. The hundred-floor dungeon collapses behind you!<br>` +
        `Floor <b>${Number(api.depth)||1}</b> · ${esc(cls)} · Level <b>${Number(player.lvl)||1}</b> · Kills <b>${Number(player.kills)||0}</b> · Gold <b>${Number(player.gold)||0}</b>`;
    }
    return true;
  }

  function shopName(row) {
    if (!row) return '';
    if (row.kind === 'equip' && row.item) return itemName(row.item);
    const fixed = {
      potion:'Healing Potion', scroll:'Teleport Scroll', key:'Rusty Key',
      escape:'Return Scroll (press T to return)', heal:'Bandage Wounds (full heal)'
    };
    if (fixed[row.kind]) return fixed[row.kind];
    const raw = String(row.name || '');
    return /[\u3400-\u9fff]/.test(raw) ? worldName(raw) : raw;
  }

  function renderDungeonShop() {
    if (!english || api.state !== 'shop') return false;
    const p = api.player;
    const list = $('shop-list');
    const gold = $('shop-gold');
    if (gold && p) gold.textContent = `Gold ${Number(p.gold)||0}`;
    if (!list) return false;
    const stock = typeof api.getShopStock === 'function' ? api.getShopStock() : [];
    list.innerHTML = (Array.isArray(stock) ? stock : []).map((row,i) =>
      `<div class="shop-row"><span>${esc(shopName(row))}</span><b>${Number(row.price)||0} G</b>` +
      `<button type="button" data-buy="${i}">Buy</button></div>`).join('');
    return true;
  }

  function townItemTag(it) {
    const forge = Number(it && it.forge)||0;
    return `${esc(itemName(it))}${forge ? ` +${forge}` : ''}<small>Score ${Number(it&&it.score)||0}</small>`;
  }

  function townTradeButtons(where, i, it, gold) {
    const lvl = Number(it && it.forge)||0;
    const maxed = lvl >= 5;
    const forgeCost = typeof api.forgeCost === 'function' ? Number(api.forgeCost(it))||0 : 0;
    const sell = typeof api.sellPrice === 'function' ? Number(api.sellPrice(it))||0 : 0;
    const forgeTitle = maxed ? 'Already at +5 maximum' : `Forge to +${lvl+1} for ${forgeCost} G`;
    return `<span class="row-actions">` +
      `<button type="button" data-forge="${where}:${i}"${(maxed || gold < forgeCost) ? ' disabled' : ''} title="${esc(forgeTitle)}">Forge</button>` +
      `<button type="button" data-sell="${where}:${i}" title="Sell for ${sell} G">Sell ${sell}G</button></span>`;
  }

  function renderTown() {
    if (!english || api.state !== 'town' || !api.meta) return false;
    const meta = api.meta;
    const gold = Number(meta.gold)||0;
    const head = $('town-head');
    if (head) head.textContent = `${className(meta.classId) || 'Adventurer'} · Level ${Number(meta.lvl)||1} · Vault ${gold} G · Deepest Floor ${Number(meta.bestDepth)||0} · Expeditions ${Number(meta.runs)||0}`;

    const growth = $('town-growth');
    if (growth) {
      const tier = Math.max(1,Math.min(10,Math.ceil(Math.max(1,Number(meta.bestDepth)||1)/10)));
      const next = tier >= 10 ? 'Town expansion complete' : `Defeat the Floor ${tier*10} guardian to unlock Town Tier ${tier+1}`;
      const ready = (Number(meta.potions)||0) >= 2 && (Number(meta.escapes)||0) >= 1;
      growth.innerHTML =
        `<div><b>Town Tier ${tier}/10</b><span>${esc(next)}</span></div>` +
        `<div class="town-readiness ${ready?'ready':'warn'}"><b>${ready?'Expedition Ready':'Supplies Missing'}</b>` +
        `<span>Potions ${Number(meta.potions)||0} · Return Scrolls ${Number(meta.escapes)||0} · Keys ${Number(meta.keys)||0}</span></div>` +
        `<div><b>Facilities</b><span>Safe Stash · Limited Market · Forge · Conquered Checkpoints</span></div>`;
    }

    const bag = Array.isArray(meta.bag) ? meta.bag : [];
    const stash = Array.isArray(meta.stash) ? meta.stash : [];
    const bagEl = $('town-bag');
    if (bagEl) bagEl.innerHTML =
      (bag.length ? bag.map((it,i) => `<div class="town-row"><span>${townItemTag(it)}</span>` +
        `<span class="row-actions"><button type="button" data-deposit="${i}">Store</button>${townTradeButtons('bag',i,it,gold)}</span></div>`).join('')
        : '<p class="dim-note">Your backpack is empty. Descend for loot or withdraw gear from the stash.</p>') +
      (bag.length ? '<div class="town-row"><span></span><span class="row-actions"><button type="button" data-depositall="1">Store All</button></span></div>' : '');

    const stashEl = $('town-stash');
    if (stashEl) stashEl.innerHTML = stash.length
      ? stash.map((it,i) => `<div class="town-row"><span>${townItemTag(it)}</span>` +
        `<span class="row-actions"><button type="button" data-withdraw="${i}"${bag.length >= 12 ? ' disabled' : ''}>Withdraw</button>${townTradeButtons('stash',i,it,gold)}</span></div>`).join('')
      : '<p class="dim-note">The stash is empty. Stored gear remains safe even if an expedition ends in death.</p>';

    if (window.DE_COMMERCE && typeof window.DE_COMMERCE.renderShop === 'function') {
      try { window.DE_COMMERCE.renderShop(true); } catch (_e) {}
    }
    if (window.DE_TOWN_ECONOMY && typeof window.DE_TOWN_ECONOMY.render === 'function') {
      try { window.DE_TOWN_ECONOMY.render(); } catch (_e) {}
    }
    return true;
  }

  function renderChrome() {
    if (!english) return false;
    const fs = $('fullscreen-toggle');
    if (fs) {
      const active = !!(document.fullscreenElement || document.webkitFullscreenElement);
      fs.innerHTML = active ? '<span aria-hidden="true">⛶</span> Exit Fullscreen <kbd>F</kbd>' : '<span aria-hidden="true">⛶</span> Fullscreen <kbd>F</kbd>';
      fs.setAttribute('aria-pressed', String(active));
    }
    const seed = $('seed-label');
    if (seed) {
      const raw = String(seed.textContent || '');
      const m = raw.match(/^(.+?)（(.+?)）$/);
      if (m) seed.textContent = `${m[1]} (${m[2]})`;
    }
    const cls = $('st-class');
    if (cls && api.classId) cls.textContent = className(api.classId);
    return true;
  }

  function sync() {
    queued = false;
    if (!english) return false;
    renderChrome();
    if (api.state === 'title' || visible('title-screen')) renderTitle();
    if (visible('class-screen')) renderClassSelect();
    if (api.state === 'paused' || visible('pause-screen')) renderPause();
    if (api.state === 'dead' || api.state === 'won' || visible('overlay')) renderOverlay();
    if (api.state === 'shop' || visible('shop-screen')) renderDungeonShop();
    if (api.state === 'town' || visible('town-screen')) renderTown();
    return true;
  }

  function schedule() {
    if (!english || queued) return false;
    queued = true;
    // One extra microtask lets later capture owners settle their own exact-state work first.
    defer(() => defer(sync));
    return true;
  }

  const ACTION_KEYS = new Set([
    'Escape','Enter',' ','PageDown','>','.',
    'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
    'w','W','a','A','s','S','d','D','q','Q','e','E','t','T','c','C','j','J','k','K','r','R','f','F'
  ]);
  const ACTION_TARGETS = [
    '#title-screen button','#class-screen button','#pause-screen button','#overlay button',
    '#shop-screen button','#town-screen button','#touch button[data-act]','#game','#descend-fab','#quickdive-fab'
  ].join(',');

  document.addEventListener('keydown', e => { if (ACTION_KEYS.has(String(e.key||''))) schedule(); }, false);
  document.addEventListener('click', e => {
    const t = e.target;
    if (t && typeof t.closest === 'function' && t.closest(ACTION_TARGETS)) schedule();
  }, false);
  document.addEventListener('fullscreenchange', schedule, false);
  document.addEventListener('webkitfullscreenchange', schedule, false);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); }, false);
  window.addEventListener('focus', schedule);
  window.addEventListener('pageshow', schedule);

  // Gamepad Return calls the semantic API directly and emits no DOM key event.
  // Wrap only that exposed boundary so a successful extraction gets the same fixed-route repaint.
  if (typeof api.useEscape === 'function' && !api.useEscape.__deCoreScreenV153) {
    const rawUseEscape = api.useEscape;
    const wrapped = function(...args) {
      const out = rawUseEscape.apply(this,args);
      schedule();
      return out;
    };
    wrapped.__deCoreScreenV153 = true;
    api.useEscape = wrapped;
  }

  window.__DE_CORE_SCREEN_OWNER_V153 = Object.freeze({
    version:'v153', owner:'core-screen-owner-v153', locale:english?'en':'zh-CN',
    sync, schedule, renderTitle, renderClassSelect, renderPause, renderOverlay,
    renderDungeonShop, renderTown, renderChrome,
  });

  sync();
})();
