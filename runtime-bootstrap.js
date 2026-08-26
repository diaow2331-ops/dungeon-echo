/* Dungeon Echo production UX bootstrap v1.
 * Owns the late presentation/control chain independently of optional shop-art modules.
 * Core game scripts load synchronously from index.html; these followers start after window
 * load so DE_TEST, visual art owners and production systems are all available.
 */
(() => {
  'use strict';
  if (typeof window==='undefined'||typeof document==='undefined'||window.__DE_PRODUCTION_UX_BOOTSTRAP)return;

  function loadScript(src, marker, ready, done) {
    if (ready()) { if (done) done(); return; }
    const selector=`script[${marker}]`;
    const existing=document.querySelector(selector);
    if (existing) {
      if (done) {
        existing.addEventListener('load',done,{once:true});
        existing.addEventListener('error',done,{once:true});
      }
      return;
    }
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    script.setAttribute(marker,'v1');
    if (done) {
      script.addEventListener('load',done,{once:true});
      script.addEventListener('error',done,{once:true});
    }
    document.body.appendChild(script);
  }

  function start() {
    loadScript('challenge-pressure.js','data-de-challenge-pressure',()=>!!window.__DE_CHALLENGE_PRESSURE_V1,()=>{
      loadScript('i18n.js','data-de-i18n',()=>!!window.DE_I18N,()=>{
        loadScript('i18n-runtime.js','data-de-i18n-runtime',()=>!!window.__DE_I18N_RUNTIME_V1,()=>{
          loadScript('i18n-content.js','data-de-i18n-content',()=>!!window.__DE_I18N_CONTENT_V2,()=>{
            loadScript('combat-controls.js','data-de-combat-controls',()=>!!window.__DE_COMBAT_CONTROLS_V1,()=>{
              loadScript('combat-hint-polish.js','data-de-combat-hint',()=>!!window.__DE_COMBAT_HINT_POLISH,()=>{
                loadScript('audio-director.js','data-de-audio-director',()=>!!window.__DE_AUDIO_DIRECTOR,()=>{
                  loadScript('mobile-ux.js','data-de-mobile-ux',()=>!!window.__DE_MOBILE_UX);
                });
              });
            });
          });
        });
      });
    });
  }

  if (document.readyState==='complete') setTimeout(start,0);
  else window.addEventListener('load',()=>setTimeout(start,0),{once:true});

  window.__DE_PRODUCTION_UX_BOOTSTRAP={version:'v1',start,loadScript};
})();
