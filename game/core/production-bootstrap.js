/* Dungeon Echo production authority bootstrap v1.3.0.
 *
 * Production policy is deliberately simple:
 * - game/core/game.js is the sole dungeon/town Canvas renderer;
 * - no presentation overlay may redraw heroes, monsters, loot, terrain or town art;
 * - the v1.3.0 storage epoch starts clean and does not migrate any historical save;
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
  const FRESH_BUTTON_ID = 'btn-fresh-adventure';

  function clearDungeonStorage() {
    if (typeof localStorage === 'undefined') return 0;
    const remove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LEGACY_PREFIX) && key !== STORAGE_EPOCH_KEY) remove.push(key);
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

  function enterFreshClassSelect() {
    if (!autoFresh || typeof document === 'undefined') return;
    autoFresh = false;
    try {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
    } catch (_err) {}
  }

  if (autoFresh && typeof setTimeout === 'function') {
    // Production scripts are parser-blocking and ordered. A zero-delay task therefore
    // runs after game.js has installed the canonical title-screen keyboard command.
    setTimeout(enterFreshClassSelect, 0);
  }

  const AUTHORITY = Object.freeze({
    version:'1.3.0',
    renderer:'game/core/game.js',
    gameplayState:'game/core/game.js',
    gameplayInput:'game/core/game.js',
    gameplayPersistence:'game/core/game.js',
    newAdventureReset:'game/core/production-bootstrap.js',
    gamepadTransport:'game/input/desktop-controls.js',
    dynamicFollowerLoader:'game/core/runtime-bootstrap.js',
  });

  window.__DE_PRODUCTION_AUTHORITY_V130 = Object.freeze({
    version:'1.3.0',
    owner:'production-authority',
    renderOwner:'game/core/game.js',
    gameplayStateOwner:'game/core/game.js',
    gameplayInputOwner:'game/core/game.js',
    gameplayPersistenceOwner:'game/core/game.js',
    authority:AUTHORITY,
    storageEpoch:STORAGE_EPOCH,
    clearDungeonStorage,
    newAdventure:'full-reset',
    newAdventureOwner:'single',
    newAdventureButtonId:FRESH_BUTTON_ID,
    historicalSaveMigration:false,
    presentationOverlays:false,
  });
})();
