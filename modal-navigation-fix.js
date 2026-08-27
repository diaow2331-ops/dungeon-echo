/* Dungeon Echo v1.2.4 modal navigation repair.
 * Presentation-only: restores the missing fixed overlay layer for Help and Expedition Log.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_MODAL_NAV_FIX) return;

  const style = document.createElement('style');
  style.id = 'de-modal-navigation-fix-v124';
  style.textContent = `
#achv-screen,
#help-screen {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(5, 3, 2, .93);
  overflow-y: auto;
  overscroll-behavior: contain;
}
#achv-screen > .title-card,
#help-screen > .title-card {
  margin: auto;
}
#achv-screen.hidden,
#help-screen.hidden {
  display: none;
}
@media (max-width: 520px) {
  #achv-screen,
  #help-screen { padding: 12px; }
  #achv-screen > .title-card,
  #help-screen > .title-card { padding: 24px 18px; }
}
`;
  document.head.appendChild(style);

  // Preserve the existing game state machine. The title keeps running underneath Help;
  // Town deliberately hides while Expedition Log is open and is restored by game.js on close.
  document.documentElement.dataset.modalNavigationFix = '1.2.4';
  window.__DE_MODAL_NAV_FIX = { version: '1.2.4' };
})();
