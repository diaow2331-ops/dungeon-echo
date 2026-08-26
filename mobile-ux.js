/* Dungeon Echo mobile UX v2.
 * Touch ergonomics only: responsive HUD, thumb-zone controls, hold-to-walk and haptics.
 * v2 stabilizes non-fullscreen browser chrome, removes the center Wait mis-tap target,
 * and makes high-frequency touch input react on pointer-down.
 * Desktop keyboard/mouse behavior and gameplay rules are unchanged.
 */
(() => {
  'use strict';
  if (typeof window==='undefined'||typeof document==='undefined')return;
  if(window.__DE_MOBILE_UX)return;
  const api=window.DE_TEST;
  if(!api||api.profileId!=='classic-100')return;

  const coarse=()=>innerWidth<=900||(typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches);
  const originals=new WeakMap();
  const optionalIds=['st-xp','st-crit','st-key','st-mobs','st-scroll'];
  const order=['attack','skill','potion','descend','escape','scroll','pause','mute'];
  let active=false,applying=false,applyQueued=false,lastWidth=innerWidth;

  const style=document.createElement('style');
  style.id='de-mobile-ux-v2';
  style.textContent=`
    html.de-mobile-ui body{overscroll-behavior:none}
    html.de-mobile-ui #wrap{padding:6px 7px calc(8px + env(safe-area-inset-bottom));max-width:100%;overflow-anchor:none}
    html.de-mobile-ui header h1{font-size:17px;margin:2px 2px 5px;letter-spacing:2px}
    html.de-mobile-ui header h1 .sub{display:none}
    html.de-mobile-ui #stats{position:sticky;top:0;z-index:24;justify-content:flex-start;gap:5px 9px;padding:7px 8px;background:rgba(24,17,13,.96);backdrop-filter:blur(7px);font-size:11px}
    html.de-mobile-ui #stats .de-mobile-optional{display:none!important}
    html.de-mobile-ui #fullscreen-toggle{margin-left:auto;padding:5px 7px}html.de-mobile-ui #fullscreen-toggle kbd{display:none}
    html.de-mobile-ui #de-audio-settings-btn{padding:6px 8px;font-size:11px}
    html.de-mobile-ui #equipbar{gap:5px;overflow-x:auto;scrollbar-width:none;padding:4px 1px 3px}
    html.de-mobile-ui #equipbar::-webkit-scrollbar{display:none}
    html.de-mobile-ui #equipbar .eqslot{min-width:48px;width:48px;min-height:42px;padding:4px;justify-content:center;border-radius:6px}
    html.de-mobile-ui #equipbar .eqname{display:none}html.de-mobile-ui #equipbar .eqicon{width:34px;height:34px;flex-basis:34px}
    html.de-mobile-ui #main{grid-template-columns:1fr;grid-template-areas:"game" "touch" "side";gap:8px;margin-top:6px}
    html.de-mobile-ui #stage{width:100%;max-width:620px;justify-self:center;touch-action:manipulation;contain:paint}
    html.de-mobile-ui canvas#game{width:100%;max-width:none;border-width:1px;box-shadow:0 0 0 2px #100b08,0 8px 22px rgba(0,0,0,.5)}
    html.de-mobile-ui #minimap{width:112px;height:78px;right:6px;bottom:6px;opacity:.88}
    html.de-mobile-ui #touch{display:grid!important;grid-template-columns:174px minmax(0,1fr);gap:9px;width:min(100%,620px);margin:0 auto;padding:8px;
      position:sticky;bottom:0;z-index:22;background:linear-gradient(180deg,rgba(10,7,6,.93),rgba(6,4,3,.985));border:1px solid rgba(139,104,53,.38);
      box-shadow:0 -7px 22px rgba(0,0,0,.34);backdrop-filter:blur(8px);padding-bottom:calc(8px + env(safe-area-inset-bottom))}
    html.de-mobile-ui #dpad{grid-template-columns:repeat(3,52px);grid-template-rows:repeat(3,52px);gap:5px;align-self:center;justify-self:center}
    html.de-mobile-ui .pad{border-radius:9px;font-size:22px;min-width:0;min-height:0;-webkit-tap-highlight-color:transparent;touch-action:none;user-select:none;-webkit-user-select:none}
    html.de-mobile-ui #dpad [data-act="wait"]{visibility:hidden!important;pointer-events:none!important}
    html.de-mobile-ui #actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;align-content:center}
    html.de-mobile-ui #actions button{min-height:42px;padding:7px 5px;border-radius:8px;font-size:12px;font-weight:700;-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;-webkit-user-select:none}
    html.de-mobile-ui #actions button span{display:none}
    html.de-mobile-ui #actions [data-act="attack"],html.de-mobile-ui #actions [data-act="skill"]{min-height:52px;font-size:15px;border-color:#a57b3d;background:linear-gradient(180deg,#46301b,#25160d);box-shadow:inset 0 1px rgba(255,236,184,.10),0 3px 8px rgba(0,0,0,.3)}
    html.de-mobile-ui #actions [data-act="skill"]{border-color:#557dba;background:linear-gradient(180deg,#24385c,#141c31)}
    html.de-mobile-ui #actions [data-act="potion"],html.de-mobile-ui #actions [data-act="descend"]{border-color:#6d7048}
    html.de-mobile-ui #side{width:100%;max-width:620px;justify-self:center;gap:8px}
    html.de-mobile-ui #bagbox{padding:9px}html.de-mobile-ui #bag{grid-template-columns:repeat(4,1fr);gap:6px}
    html.de-mobile-ui .bagcell .dropx{display:block;width:27px;height:27px;line-height:25px;font-size:13px}
    html.de-mobile-ui #bagdetail{display:block;margin-top:7px;padding-top:7px}
    html.de-mobile-ui #logbox{min-height:110px;max-height:165px;padding:8px}html.de-mobile-ui #log{min-height:72px;max-height:112px;font-size:11px}
    html.de-mobile-ui #hint{padding:7px 9px;font-size:11px}
    html.de-mobile-ui .title-card{width:min(100%,620px)!important;padding:18px 14px!important;margin:auto}
    html.de-mobile-ui #title-screen,html.de-mobile-ui #class-screen,html.de-mobile-ui #pause-screen,html.de-mobile-ui #shop-screen,html.de-mobile-ui #talent-screen,html.de-mobile-ui #shrine-screen,html.de-mobile-ui #echo-screen,html.de-mobile-ui #town-screen{padding:10px 7px calc(10px + env(safe-area-inset-bottom))}
    html.de-mobile-ui .town-row{align-items:flex-start;flex-wrap:wrap;padding:8px 6px}html.de-mobile-ui .town-row button{min-height:38px;padding:6px 10px}
    html.de-mobile-ui #town-screen .title-actions{position:sticky;bottom:0;background:rgba(12,8,6,.94);padding:7px 0 calc(7px + env(safe-area-inset-bottom));z-index:2}
    html.de-mobile-ui.de-browser-chrome #stats{position:relative!important;top:auto!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    html.de-mobile-ui.de-browser-chrome #touch{position:relative!important;bottom:auto!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:0 3px 14px rgba(0,0,0,.24)!important}
    html.de-mobile-ui.de-browser-chrome canvas#game{transform:translateZ(0);backface-visibility:hidden}
    @media(max-width:390px){html.de-mobile-ui #touch{grid-template-columns:158px minmax(0,1fr);padding-left:5px;padding-right:5px}html.de-mobile-ui #dpad{grid-template-columns:repeat(3,47px);grid-template-rows:repeat(3,47px);gap:4px}html.de-mobile-ui #actions button{font-size:11px;min-height:40px}html.de-mobile-ui #actions [data-act="attack"],html.de-mobile-ui #actions [data-act="skill"]{font-size:14px;min-height:48px}}
    @media(max-width:900px) and (orientation:landscape) and (max-height:560px){
      html.de-mobile-ui header h1,html.de-mobile-ui #equipbar{display:none}
      html.de-mobile-ui #stats{position:relative;gap:4px 7px;padding:5px 7px}
      html.de-mobile-ui #main{grid-template-columns:minmax(0,1fr) 300px;grid-template-areas:"game touch" "side side";align-items:start;gap:7px}
      html.de-mobile-ui #stage{max-width:none}html.de-mobile-ui canvas#game{max-height:calc(100vh - 78px);width:auto;max-width:100%;margin:auto}
      html.de-mobile-ui #touch{position:sticky;top:5px;bottom:auto;grid-template-columns:1fr;padding:7px;height:fit-content}
      html.de-mobile-ui.de-browser-chrome #touch{position:relative!important;top:auto!important}
      html.de-mobile-ui #dpad{grid-template-columns:repeat(3,46px);grid-template-rows:repeat(3,46px)}
      html.de-mobile-ui #actions button{min-height:36px}html.de-mobile-ui #actions [data-act="attack"],html.de-mobile-ui #actions [data-act="skill"]{min-height:44px}
      html.de-mobile-ui #side{grid-area:side;max-width:none;display:grid;grid-template-columns:1fr 1fr}html.de-mobile-ui #hint{grid-column:1/-1}
    }
  `;
  document.head.appendChild(style);

  function buzz(ms=8){try{if(navigator.vibrate)navigator.vibrate(ms)}catch(e){}}
  function markOptional(){for(const id of optionalIds){const el=document.getElementById(id);const stat=el&&el.closest('.stat');if(stat)stat.classList.add('de-mobile-optional')}}

  function prepareActions(on){
    const root=document.getElementById('actions');if(!root)return;
    const buttons=Array.from(root.querySelectorAll('button[data-act]'));
    if(on){
      for(const btn of buttons)if(!originals.has(btn))originals.set(btn,btn.innerHTML);
      const map=new Map(buttons.map(b=>[b.dataset.act,b]));
      const desired=order.filter(act=>map.has(act));
      const current=Array.from(root.querySelectorAll('button[data-act]')).map(b=>b.dataset.act).filter(act=>desired.includes(act));
      if(current.join('|')!==desired.join('|'))for(const act of desired)root.appendChild(map.get(act));
    }
  }

  function syncMobileWait(on){
    const wait=document.querySelector('#dpad [data-act="wait"]');if(!wait)return;
    if(on){wait.disabled=true;wait.tabIndex=-1;wait.setAttribute('aria-hidden','true');wait.setAttribute('aria-label','')}
    else{wait.disabled=false;wait.removeAttribute('aria-hidden');wait.setAttribute('aria-label','等待一回合')}
  }

  function installFastPress(btn,repeat=false){
    if(!btn||btn.__deFastPress)return;btn.__deFastPress=true;
    let timeout=0,interval=0,suppressTrustedClick=false;
    const clear=e=>{
      if(e&&active){e.preventDefault();e.stopImmediatePropagation()}
      clearTimeout(timeout);clearInterval(interval);timeout=interval=0;
    };
    btn.addEventListener('pointerdown',e=>{
      if(!active||(Number.isFinite(e.button)&&e.button!==0))return;
      e.preventDefault();e.stopImmediatePropagation();suppressTrustedClick=true;buzz(repeat?5:9);btn.click();
      if(repeat){timeout=setTimeout(()=>{btn.click();interval=setInterval(()=>btn.click(),110)},190)}
      try{btn.setPointerCapture(e.pointerId)}catch(err){}
    },true);
    btn.addEventListener('pointerup',clear,true);btn.addEventListener('pointercancel',clear,true);btn.addEventListener('lostpointercapture',clear,true);
    btn.addEventListener('click',e=>{if(suppressTrustedClick&&e.isTrusted){suppressTrustedClick=false;e.preventDefault();e.stopImmediatePropagation()}},true);
  }

  function installHaptics(){
    document.querySelectorAll('#dpad button:not([data-act="wait"])').forEach(btn=>installFastPress(btn,true));
    const immediate=new Set(['attack','skill','potion','descend','escape','scroll']);
    document.querySelectorAll('#actions button[data-act]').forEach(btn=>{if(immediate.has(btn.dataset.act))installFastPress(btn,false)});
    document.querySelectorAll('#actions button[data-act="pause"],#actions button[data-act="mute"]').forEach(btn=>{if(btn.__deBuzz)return;btn.__deBuzz=true;btn.addEventListener('pointerdown',()=>{if(active)buzz(5)},{passive:true})});
  }

  function syncMobileHelp(){
    const help=document.querySelector('#help-screen .help-cols');if(!help||help.dataset.mobileCopy==='1')return;help.dataset.mobileCopy='1';
    const first=help.querySelector('p');if(first)first.innerHTML='电脑：<b>WASD / 方向键</b>移动与转向，<b>J</b>攻击，<b>K</b>技能，<b>空格 / .</b>等待。<br>手机：<b>左侧四向方向盘</b>移动与转向，右侧<b>攻击 / 技能</b>为主操作；中央等待键已移除以避免误触。<br>药水 Q · 卷轴 E · 回城 T · 下楼 Enter · 暂停 Esc。';
  }

  function syncBrowserChrome(on){document.documentElement.classList.toggle('de-browser-chrome',on&&!document.fullscreenElement)}

  function apply(){
    if(applying)return;applying=true;
    try{
      const on=coarse();active=on;document.documentElement.classList.toggle('de-mobile-ui',on);syncBrowserChrome(on);
      markOptional();prepareActions(on);syncMobileWait(on);installHaptics();syncMobileHelp();
      const game=document.getElementById('game');if(game)game.setAttribute('aria-label',on?'地牢地图：使用下方四向方向盘移动，也可点已探索地块':'地牢地图：使用方向键、WASD 或点击已探索地块移动');
    }finally{applying=false}
  }

  function queueApply(){if(applyQueued)return;applyQueued=true;requestAnimationFrame(()=>{applyQueued=false;apply()})}
  window.addEventListener('resize',()=>{
    const width=innerWidth;
    if(Math.abs(width-lastWidth)<2){syncBrowserChrome(coarse());return}
    lastWidth=width;queueApply();
  },{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(apply,120));
  document.addEventListener('fullscreenchange',queueApply);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
  apply();setTimeout(apply,80);
  window.__DE_MOBILE_UX={version:'v2',apply,get active(){return active},coarse};
})();
