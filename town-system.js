/* Dungeon Echo production town systems v4.
 * Owns conquered-depth checkpoint return and production wheel lifecycle/economy policy.
 *
 * Checkpoints unlock only AFTER crossing each 10-floor guardian: 11/21/.../91.
 * Unseen floors can never be skipped.
 *
 * The legacy core wheel still owns its animation and seeded random selection. This layer
 * adds the missing production rules around it: a landed prize slot is consumed exactly
 * once, claimed state persists in meta saves, spin/reset prices receive a chapter-scaled
 * surcharge, and death can no longer reroll the visible board for free.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_TOWN_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;
  window.__DE_TOWN_SYSTEM = 'v4';

  const META_KEY = 'de-greedy-meta-v1';
  const WHEEL_STATE_KEY = 'de-town-wheel-state-v1';
  const CHECKPOINTS = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91];
  let selected = 1;

  // ---------- Shared town progression ----------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function townTier() {
    const best = Math.max(1, Number(api.meta && api.meta.bestDepth) || 1);
    return clamp(Math.ceil(best / 10), 1, 10);
  }

  function persistMeta() {
    const meta = api.meta;
    if (!meta) return;
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* storage unavailable */ }
  }

  // ---------- Conquered-depth checkpoints ----------
  function unlockedCheckpoints() {
    const best = Number(api.meta && api.meta.bestDepth) || 0;
    // A checkpoint at N+1 is proof that the guardian on N was passed. Reaching the
    // guardian floor alone does not unlock a skip around that fight.
    return CHECKPOINTS.filter(d => d === 1 || best >= d);
  }

  function deepestUnlocked() {
    const rows = unlockedCheckpoints();
    return rows[rows.length - 1] || 1;
  }

  function ensurePanel() {
    const town = document.getElementById('town-screen');
    if (!town) return null;
    let panel = document.getElementById('town-checkpoints');
    if (panel) return panel;
    const actions = town.querySelector('.title-actions');
    if (!actions || !actions.parentNode) return null;
    panel = document.createElement('div');
    panel.id = 'town-checkpoints';
    panel.className = 'checkpoint-panel';
    actions.parentNode.insertBefore(panel, actions);

    if (!document.getElementById('checkpoint-style')) {
      const style = document.createElement('style');
      style.id = 'checkpoint-style';
      style.textContent = `
        .checkpoint-panel{margin:14px 0 4px;padding:12px;border:1px solid rgba(224,167,58,.22);border-radius:8px;background:rgba(0,0,0,.12)}
        .checkpoint-head{display:flex;gap:10px;align-items:baseline;justify-content:space-between;margin-bottom:8px}
        .checkpoint-head b{color:#f2d27b}.checkpoint-head small{color:#9b8d78}
        .checkpoint-grid{display:flex;flex-wrap:wrap;gap:7px}.checkpoint-grid button{min-width:64px}
        .checkpoint-grid button.active{outline:2px solid rgba(242,210,123,.72);outline-offset:1px}
        .de-wheel-state{display:block;margin-top:7px;color:#9b8d78;font-size:12px;line-height:1.45}
      `;
      document.head.appendChild(style);
    }
    return panel;
  }

  function renderCheckpoints() {
    const panel = ensurePanel();
    if (!panel || !api.meta) return;
    const unlocked = unlockedCheckpoints();
    if (!unlocked.includes(selected)) selected = deepestUnlocked();
    const best = Number(api.meta.bestDepth) || 0;
    const sig = `${best}|${selected}|${unlocked.join(',')}`;
    if (!panel.dataset || panel.dataset.deCheckpointSig !== sig) {
      panel.innerHTML = `
        <div class="checkpoint-head">
          <b>已征服检查点</b>
          <small>最深到达 ${best} 层 · 通过十层守卫后解锁下一段</small>
        </div>
        <div class="checkpoint-grid">${unlocked.map(d =>
          `<button type="button" data-checkpoint="${d}" class="${d === selected ? 'active' : ''}">${d === 1 ? '第 1 层' : `第 ${d} 层`}</button>`
        ).join('')}</div>`;
      if (panel.dataset) panel.dataset.deCheckpointSig = sig;
    }
    const depart = document.getElementById('btn-depart');
    if (depart) {
      const text = selected === 1 ? '从第 1 层出发' : `从已征服区 · 第 ${selected} 层出发`;
      if (depart.textContent !== text) depart.textContent = text;
    }
  }

  function travelToCheckpoint(target) {
    target = Number(target) || 1;
    if (!unlockedCheckpoints().includes(target)) return false;

    // Let the core create a normal new greedy run first so player/meta/save state stay
    // canonical. Then reuse core descend() once to build the requested theme, map, FOV,
    // HUD and persistence instead of duplicating those internals here.
    api.departTown();
    if (target <= 1) return true;
    if (!api.player || !api.mapGrid) return false;

    api.depth = target - 1;
    api.mapGrid[api.player.y][api.player.x] = 2; // STAIRS constant in game.js
    api.descend();
    return api.depth === target;
  }

  // ---------- Fortune wheel production policy ----------
  // Core keeps the exact seeded spin animation. We observe the first `kind` read after a
  // spin is armed; that read happens inside applyWheelPrize() for the selected slot.
  // This lets us consume the exact landed slot without introducing a second RNG.
  let wheelArmed = false;
  let landedIndex = -1;
  let pendingWheelAction = null;

  const wheelClassId = () => String(api.meta && api.meta.classId || api.classId || 'warrior');
  const copySlots = slots => JSON.parse(JSON.stringify(slots || []));
  const slotFingerprint = slots => JSON.stringify(copySlots(slots));

  function loadWheelState() {
    try {
      const raw = JSON.parse(localStorage.getItem(WHEEL_STATE_KEY));
      return raw && raw.v === 1 && raw.classes && typeof raw.classes === 'object'
        ? raw : { v:1, classes:{} };
    } catch (e) { return { v:1, classes:{} }; }
  }

  function wheelShadowRow() {
    const root = loadWheelState();
    const row = root.classes[wheelClassId()];
    if (!row || !Array.isArray(row.slots) || row.slots.length !== 8) return null;
    return {
      slots: copySlots(row.slots),
      spins: Math.max(0, Number(row.spins) || 0),
      resets: Math.max(0, Number(row.resets) || 0),
    };
  }

  function snapshotWheel() {
    const meta = api.meta;
    if (!meta || !Array.isArray(meta.wheelSlots) || meta.wheelSlots.length !== 8) return false;
    const root = loadWheelState();
    root.classes[wheelClassId()] = {
      slots: copySlots(meta.wheelSlots),
      spins: Math.max(0, Number(meta.wheelSpins) || 0),
      resets: Math.max(0, Number(meta.wheelResets) || 0),
    };
    try {
      localStorage.setItem(WHEEL_STATE_KEY, JSON.stringify(root));
      return true;
    } catch (e) { return false; }
  }

  function restoreWheelShadow(row = wheelShadowRow()) {
    const meta = api.meta;
    if (!meta || !row) return false;
    meta.wheelSlots = copySlots(row.slots);
    meta.wheelSpins = row.spins;
    meta.wheelResets = row.resets;
    persistMeta();
    return true;
  }

  function reconcileWheelShadow() {
    const meta = api.meta;
    if (!meta || !Array.isArray(meta.wheelSlots) || meta.wheelSlots.length !== 8) return 'missing';
    if (wheelArmed || pendingWheelAction) return 'busy';
    const shadow = wheelShadowRow();
    if (!shadow) {
      snapshotWheel();
      return 'seeded';
    }

    const boardChanged = slotFingerprint(meta.wheelSlots) !== slotFingerprint(shadow.slots);
    const countersRegressed = (Number(meta.wheelSpins) || 0) < shadow.spins ||
      (Number(meta.wheelResets) || 0) < shadow.resets;
    if (boardChanged || countersRegressed) {
      restoreWheelShadow(shadow);
      return 'restored';
    }

    const countersAdvanced = (Number(meta.wheelSpins) || 0) > shadow.spins ||
      (Number(meta.wheelResets) || 0) > shadow.resets;
    if (countersAdvanced) snapshotWheel();
    return countersAdvanced ? 'advanced' : 'stable';
  }

  function wrapWheelSlots() {
    const meta = api.meta;
    if (!meta || !Array.isArray(meta.wheelSlots)) return;
    meta.wheelSlots.forEach((slot, index) => {
      if (!slot || typeof slot !== 'object' || slot.__deWheelTracked) return;
      let currentKind = String(slot.kind || 'nothing');
      try {
        Object.defineProperty(slot, '__deWheelTracked', { value: true, enumerable: false, configurable: true });
        Object.defineProperty(slot, 'kind', {
          enumerable: true,
          configurable: true,
          get() {
            if (wheelArmed && landedIndex < 0) {
              landedIndex = index;
              wheelArmed = false;
            }
            return currentKind;
          },
          set(v) { currentKind = String(v || 'nothing'); },
        });
      } catch (e) { /* plain objects should be configurable; fail closed if not */ }
    });
  }

  function claimedCount() {
    const meta = api.meta;
    return meta && Array.isArray(meta.wheelSlots)
      ? meta.wheelSlots.reduce((n, s) => n + (s && s.claimed ? 1 : 0), 0)
      : 0;
  }

  function consumeWheelSlot(index) {
    const meta = api.meta;
    if (!meta || !Array.isArray(meta.wheelSlots)) return false;
    const slot = meta.wheelSlots[index];
    if (!slot || slot.claimed) return false;
    const prizeKind = String(slot.kind || 'nothing');
    slot.claimed = true;
    slot.claimedKind = prizeKind;
    slot.claimedAtSpin = Number(meta.wheelTotal) || 0;
    // The core treats unknown/nothing kinds as an empty sector. Removing payload fields
    // guarantees an equipment object or gold amount cannot be paid again from this slot.
    slot.kind = 'nothing';
    if ('item' in slot) delete slot.item;
    if ('amount' in slot) delete slot.amount;
    persistMeta();
    snapshotWheel();
    return true;
  }

  function spinTotalCost() {
    const base = typeof api.spinCost === 'function' ? Number(api.spinCost()) || 0 : 40;
    // Chapter surcharge is intentionally simple until the full commerce rebuild (#10).
    // Tier 1 first spin: ~60G. Tier 10 first spin: ~240G. Existing per-spin escalation
    // still stacks on top, so death/reset cannot restore a trivially cheap late-game spin.
    return base + townTier() * 20;
  }

  function resetTotalCost() {
    const base = typeof api.resetWheelCost === 'function' ? Number(api.resetWheelCost()) || 0 : 60;
    // Reset fishing is more dangerous than a single spin because the board is visible.
    // Tier 1 starts around 105G; tier 10 around 510G before the core reset escalation.
    return base + townTier() * 45;
  }

  function setPolicyDisabled(btn, disabled) {
    if (!btn) return;
    if (disabled) {
      btn.disabled = true;
      btn.dataset.dePolicyDisabled = '1';
    } else if (btn.dataset.dePolicyDisabled === '1') {
      btn.disabled = false;
      delete btn.dataset.dePolicyDisabled;
    }
  }

  function syncWheelUi() {
    const meta = api.meta;
    if (!meta) return;
    reconcileWheelShadow();
    wrapWheelSlots();
    const wheel = document.getElementById('town-wheel');
    if (!wheel) return;
    const spinBtn = wheel.querySelector('[data-wheelspin]');
    const resetBtn = wheel.querySelector('[data-wheelreset]');
    const sc = spinTotalCost();
    const rc = resetTotalCost();
    const claimed = claimedCount();
    const exhausted = claimed >= 8;

    if (spinBtn) {
      const text = exhausted ? '本轮已全部领取' : `抽奖 ${sc} G`;
      const title = exhausted ? '重置轮盘后才能开启新一轮奖池' : `本阶段实际抽奖成本 ${sc} G`;
      if (spinBtn.textContent !== text) spinBtn.textContent = text;
      if (spinBtn.title !== title) spinBtn.title = title;
      setPolicyDisabled(spinBtn, exhausted || Number(meta.gold) < sc);
    }
    if (resetBtn) {
      const text = `重置轮盘 ${rc} G`;
      const title = `本阶段重摇全部八格，实际成本 ${rc} G`;
      if (resetBtn.textContent !== text) resetBtn.textContent = text;
      if (resetBtn.title !== title) resetBtn.title = title;
      setPolicyDisabled(resetBtn, Number(meta.gold) < rc);
    }

    let state = wheel.querySelector('.de-wheel-state');
    if (!state) {
      state = document.createElement('small');
      state.className = 'de-wheel-state';
      wheel.appendChild(state);
    }
    const claimedIndexes = Array.isArray(meta.wheelSlots)
      ? meta.wheelSlots.map((s, i) => s && s.claimed ? i + 1 : 0).filter(Boolean)
      : [];
    const text = claimedIndexes.length
      ? `城镇阶段 ${townTier()} · 已领取 ${claimed}/8 格（${claimedIndexes.join('、')}）；已领取格再次停中不会重复发奖。`
      : `城镇阶段 ${townTier()} · 八格奖池每格最多领取一次；重置会整盘换新。`;
    if (state.textContent !== text) state.textContent = text;
  }

  function flashWheelNote(text) {
    const hint = document.querySelector('#town-wheel .wheel-hint');
    if (hint && hint.textContent !== text) hint.textContent = text;
  }

  function beginWheelAction(kind, e) {
    if (api.state !== 'town' || !api.meta) return false;
    reconcileWheelShadow();
    wrapWheelSlots();
    const meta = api.meta;
    const isSpin = kind === 'spin';
    if (isSpin && claimedCount() >= 8) {
      e.preventDefault();
      e.stopImmediatePropagation();
      flashWheelNote('这一轮八格都已经领取，先重置轮盘再继续。');
      return false;
    }

    const base = isSpin
      ? (typeof api.spinCost === 'function' ? Number(api.spinCost()) || 0 : 40)
      : (typeof api.resetWheelCost === 'function' ? Number(api.resetWheelCost()) || 0 : 60);
    const total = isSpin ? spinTotalCost() : resetTotalCost();
    if (Number(meta.gold) < total) {
      e.preventDefault();
      e.stopImmediatePropagation();
      flashWheelNote(`金币不足：本阶段${isSpin ? '抽奖' : '重置'}需要 ${total} G。`);
      return false;
    }

    const extra = Math.max(0, total - base);
    if (extra) meta.gold -= extra;
    persistMeta();
    pendingWheelAction = {
      kind,
      extra,
      beforeSpins: Number(meta.wheelSpins) || 0,
      beforeResets: Number(meta.wheelResets) || 0,
    };
    if (isSpin) {
      landedIndex = -1;
      wheelArmed = true;
    }
    return true;
  }

  function settleWheelAction(kind) {
    const meta = api.meta;
    const pending = pendingWheelAction;
    if (!meta || !pending || pending.kind !== kind) return;
    const success = kind === 'spin'
      ? (Number(meta.wheelSpins) || 0) === pending.beforeSpins + 1
      : (Number(meta.wheelResets) || 0) === pending.beforeResets + 1;

    if (!success) {
      // Fail closed: if the core rejected/broke the action, return only our surcharge.
      if (pending.extra) meta.gold += pending.extra;
    } else if (kind === 'spin' && landedIndex >= 0) {
      consumeWheelSlot(landedIndex);
    } else if (kind === 'reset') {
      // A paid reset is the only legal way to replace the whole board.
      wrapWheelSlots();
      persistMeta();
      snapshotWheel();
    }

    wheelArmed = false;
    landedIndex = -1;
    pendingWheelAction = null;
    persistMeta();
    syncWheelUi();
  }

  // Capture before game.js' bubbling town handlers. Checkpoint buttons are module-owned;
  // wheel clicks continue into the core after this layer charges the chapter surcharge and
  // arms exact-slot observation, preserving the existing animation/RNG implementation.
  document.addEventListener('click', e => {
    const cp = e.target && e.target.closest ? e.target.closest('[data-checkpoint]') : null;
    if (cp) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const d = Number(cp.dataset.checkpoint) || 1;
      if (unlockedCheckpoints().includes(d)) selected = d;
      render();
      return;
    }

    const depart = e.target && e.target.closest ? e.target.closest('#btn-depart') : null;
    if (depart && api.state === 'town' && selected > 1) {
      e.preventDefault();
      e.stopImmediatePropagation();
      travelToCheckpoint(selected);
      return;
    }

    const wsp = e.target && e.target.closest ? e.target.closest('[data-wheelspin]') : null;
    if (wsp) { beginWheelAction('spin', e); return; }
    const wrs = e.target && e.target.closest ? e.target.closest('[data-wheelreset]') : null;
    if (wrs) beginWheelAction('reset', e);
  }, true);

  // Registered after game.js, so this bubble listener runs after the core town handler.
  // At that point counters and rewards reveal whether the action really completed.
  document.addEventListener('click', e => {
    const wsp = e.target && e.target.closest ? e.target.closest('[data-wheelspin]') : null;
    if (wsp) { settleWheelAction('spin'); return; }
    const wrs = e.target && e.target.closest ? e.target.closest('[data-wheelreset]') : null;
    if (wrs) { settleWheelAction('reset'); return; }
    if (api.state === 'town') queueMicrotask(render);
  }, false);

  function render() {
    if (api.state !== 'town' || !api.meta) return;
    renderCheckpoints();
    syncWheelUi();
  }

  // Town entry is observable at the town-screen visibility boundary. Rendering once on
  // that transition and after town clicks replaces the old 350ms polling loop, which
  // repeatedly rewrote localized DOM and amplified other observers while the town was open.
  const town = document.getElementById('town-screen');
  let observer = null;
  if (town && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => queueMicrotask(render));
    observer.observe(town, { attributes:true, attributeFilter:['class','hidden','aria-hidden'] });
  }
  queueMicrotask(render);
  window.addEventListener('pageshow', () => queueMicrotask(render));
  window.addEventListener('beforeunload', () => { if (observer) observer.disconnect(); }, { once: true });

  window.DE_TOWN_CHECKPOINTS = {
    unlocked: unlockedCheckpoints,
    travel: travelToCheckpoint,
    get selected() { return selected; },
  };
  window.DE_TOWN_ECONOMY = {
    version: 'v4',
    tier: townTier,
    wheelSpinCost: spinTotalCost,
    wheelResetCost: resetTotalCost,
    claimedWheelSlots: claimedCount,
    snapshotWheel,
    restoreWheelShadow,
    reconcileWheelShadow,
    wheelShadowRow,
    render,
  };
})();