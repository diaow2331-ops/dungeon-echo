/* Dungeon Echo production authority bootstrap v1.3.0.
 *
 * Production policy is deliberately simple:
 * - game/core/game.js is the sole dungeon/town Canvas renderer;
 * - no presentation overlay may redraw heroes, monsters, loot, terrain or town art;
 * - the v1.3.0 storage epoch starts clean and does not migrate any historical save;
 * - New Adventure means a genuinely new local game, including Greedy meta.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;

  const STORAGE_EPOCH = 'v130';
  const STORAGE_EPOCH_KEY = 'de-storage-epoch';
  const LEGACY_PREFIX = 'de-';

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

  let dispatchingFresh = false;
  function installNewAdventureReset() {
    if (typeof document === 'undefined') return false;
    const button = document.getElementById('btn-new');
    if (!button || button.__deV130ResetOwner) return !!button;
    button.__deV130ResetOwner = true;
    button.addEventListener('click', event => {
      if (dispatchingFresh) return;
      event.preventDefault();
      event.stopImmediatePropagation();
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
    }, true);
    return true;
  }

  function finishFreshStart(attempt = 0) {
    installNewAdventureReset();
    if (!autoFresh) return;
    const button = typeof document !== 'undefined' && document.getElementById('btn-new');
    if ((!window.DE_TEST || !button) && attempt < 100) {
      setTimeout(() => finishFreshStart(attempt + 1), 20);
      return;
    }
    if (!window.DE_TEST || !button) return;
    autoFresh = false;
    dispatchingFresh = true;
    try {
      window.DE_TEST.setSeed(String(Date.now()) + '-' + Math.random().toString(36).slice(2));
      button.click();
    } finally {
      dispatchingFresh = false;
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => finishFreshStart(), { once:true });
    else setTimeout(() => finishFreshStart(), 0);
  }

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
    historicalSaveMigration:false,
    presentationOverlays:false,
  });
})();
