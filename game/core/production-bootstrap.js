/* Dungeon Echo production authority bootstrap v1.9.0.
 *
 * Production policy is deliberately simple:
 * - game/core/game.js is the sole dungeon/town Canvas renderer;
 * - no presentation overlay may redraw heroes, monsters, loot, terrain or town art;
 * - static presentation CSS may restyle DOM icons without owning gameplay or Canvas state;
 * - the v130 storage epoch stays stable and does not migrate any historical save;
 * - New Adventure has exactly one production DOM owner: this bootstrap.
 *
 * The historical game.js listener still targets #btn-new. This bootstrap runs first
 * and synchronously claims that DOM node by renaming it before game.js executes, so
 * the historical listener has no production target and never registers.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;

  const STORAGE_EPOCH = 'v130';
  const STORAGE_EPOCH_KEY = 'de-storage-epoch';
  const LEGACY_PREFIX = 'de-';
  const PERSISTENT_PREF_KEYS = new Set(['de-guide-v1', 'de-audio-v1', 'de-expedition-record-v1', 'de-greedy-on-v1']);
  const FRESH_BUTTON_ID = 'btn-fresh-adventure';
  const EQUIPMENT_STYLE_ID = 'de-equipment-art-v13-css';

  function installStaticEquipmentArt() {
    if (typeof document === 'undefined' || !document.head) return null;
    const existing = document.getElementById(EQUIPMENT_STYLE_ID);
    if (existing) return existing;
    const script = document.currentScript;
    const href = script && script.src
      ? new URL('../ui/equipment-art-v13.css', script.src).href
      : 'game/ui/equipment-art-v13.css';
    const link = document.createElement('link');
    link.id = EQUIPMENT_STYLE_ID;
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.dePresentation = 'equipment-v13';
    document.head.appendChild(link);
    return link;
  }

  // Static icon remapping only. This creates no Canvas, animation loop, input listener,
  // gameplay state, persistence writer or post-render follower.
  installStaticEquipmentArt();

  function clearDungeonStorage() {
    if (typeof localStorage === 'undefined') return 0;
    const remove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LEGACY_PREFIX) && key !== STORAGE_EPOCH_KEY && !PERSISTENT_PREF_KEYS.has(key)) remove.push(key);
    }
    for (const key of remove) localStorage.removeItem(key);
    localStorage.setItem(STORAGE_EPOCH_KEY, STORAGE_EPOCH);
    return remove.length;
  }

  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_EPOCH_KEY) !== STORAGE_EPOCH) {
      clearDungeonStorage();
    }
  } catch (_err) {}

  let autoFresh = false;
  if (typeof location !== 'undefined') {
    try {
      const url = new URL(location.href);
      autoFresh = url.searchParams.get('fresh') === '1';
      url.searchParams.delete('fresh');
      if (url.searchParams.get('profile') !== 'classic-100') url.searchParams.set('profile', 'classic-100');
      if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
        history.replaceState(null, '', url.href);
      }
    } catch (_err) {}
  }

  function beginFreshAdventure() {
    try { clearDungeonStorage(); } catch (_err) {}
    try {
      const url = new URL(location.href);
      url.searchParams.delete('seed');
      url.searchParams.set('profile', 'classic-100');
      url.searchParams.set('fresh', '1');
      location.replace(url.href);
    } catch (_err) {
      location.reload();
    }
  }

  function claimFreshAdventureButton() {
    if (typeof document === 'undefined') return null;
    const button = document.getElementById('btn-new');
    if (!button) return document.getElementById(FRESH_BUTTON_ID);
    button.id = FRESH_BUTTON_ID;
    // Preserve the reviewed title-action span previously supplied by #btn-new CSS.
    if (button.style) button.style.gridColumn = '1 / -1';
    button.addEventListener('click', beginFreshAdventure);
    return button;
  }

  // IMPORTANT: synchronous claim. production-bootstrap.js is the first production
  // script, so game.js later sees no #btn-new element and cannot bind a second owner.
  claimFreshAdventureButton();

  // Deterministic handoff: external parser-blocking scripts can yield between loads,
  // so setTimeout(0) is not a safe guarantee that core input is ready. Core consumes
  // this one-shot flag after its own listeners and title state are fully installed.
  if (autoFresh) window.__DE_FRESH_CLASS_SELECT_PENDING = true;

  const AUTHORITY = Object.freeze({
    version:'1.9.0',
    renderer:'game/core/game.js',
    gameplayState:'game/core/game.js',
    gameplayInput:'game/core/game.js',
    gameplayPersistence:'game/core/game.js',
    newAdventureReset:'game/core/production-bootstrap.js',
    staticEquipmentArt:'game/ui/equipment-art-v13.css',
    gamepadTransport:'game/input/desktop-controls.js',
    dynamicFollowerLoader:'game/core/runtime-bootstrap.js',
  });

  window.__DE_PRODUCTION_AUTHORITY_V130 = Object.freeze({
    version:'1.9.0',
    owner:'production-authority',
    renderOwner:'game/core/game.js',
    gameplayStateOwner:'game/core/game.js',
    gameplayInputOwner:'game/core/game.js',
    gameplayPersistenceOwner:'game/core/game.js',
    authority:AUTHORITY,
    storageEpoch:STORAGE_EPOCH,
    clearDungeonStorage,
    newAdventure:'gameplay-reset-preserve-preferences',
    newAdventureOwner:'single',
    newAdventureButtonId:FRESH_BUTTON_ID,
    historicalSaveMigration:false,
    presentationOverlays:false,
  });
})();
