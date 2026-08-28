/* Dungeon Echo final responsive owner v154.
 * Release-only presentation layer: closes the 901-1180px laptop layout gap and
 * keeps portrait touch targets at a reliable minimum size. No gameplay, save,
 * locale, balance or input semantics are changed here.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_RESPONSIVE_FINAL_V154) return;

  const style = document.createElement('style');
  style.id = 'de-responsive-final-v154';
  style.textContent = `
    /* Mid-width keyboard/laptop windows: stop squeezing the 40x28 dungeon beside a fixed 300px sidebar. */
    @media (min-width:901px) and (max-width:1180px) {
      #wrap{padding-left:14px;padding-right:14px}
      #main{grid-template-columns:minmax(0,1fr);grid-template-areas:"game" "side";gap:10px}
      #stage{width:min(100%,980px);justify-self:center}
      #side{width:min(100%,980px);justify-self:center;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;align-items:start}
      #side #hint{grid-column:1/-1}
      #bag{grid-template-columns:repeat(6,minmax(0,1fr));min-height:0}
      #equipbar{max-width:100%;overflow-x:auto;scrollbar-width:thin;padding-bottom:3px}
      #equipbar .eqslot{flex:0 0 142px;min-width:142px}
    }

    /* Portrait phones: secondary actions must not shrink below a dependable thumb target. */
    @media (max-width:900px) and (orientation:portrait) {
      html.de-mobile-ui #actions button{min-height:44px!important}
      html.de-mobile-ui #actions [data-act="attack"],
      html.de-mobile-ui #actions [data-act="skill"]{min-height:52px!important}
    }
  `;
  document.head.appendChild(style);

  window.__DE_RESPONSIVE_FINAL_V154 = Object.freeze({
    version:'v154', owner:'responsive-final-v154',
    desktopRange:'901-1180', portraitTouchMin:44,
  });
})();
