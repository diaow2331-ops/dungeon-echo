/* Dungeon Echo progressive onboarding v2.
 * Contextual, action-driven and persistent. Progress is inferred from real game outcomes,
 * so keyboard, touch and gamepad all advance the same tutorial contract.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_COMBAT_HINT_POLISH) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const KEY = 'de-onboarding-v2';
  const OLD_KEY = 'de-combat-hint-jk-v1';
  const ALL = ['move','attack','skill','bag','potion','stairs','escape','guardian'];
  const state = { done:{} };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (raw && raw.done && typeof raw.done === 'object') state.done = {...raw.done};
    if (!localStorage.getItem(KEY) && localStorage.getItem(OLD_KEY) === '1') { state.done.move=1; state.done.attack=1; }
  } catch (e) {}

  const i18n = () => window.DE_I18N;
  const tr = (key, fallback) => i18n() && typeof i18n().t === 'function' ? i18n().t(key) : fallback;
  const coarse = () => innerWidth <= 900 || (typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches);
  const text = {
    move: () => coarse() ? tr('tutorial.move.mobile','移动 · 用左侧方向盘移动；朝向也会跟着改变') : tr('tutorial.move.desktop','移动 · WASD / 方向键移动，同时改变面向'),
    attack: () => coarse() ? tr('tutorial.attack.mobile','攻击 · 面向敌人后点「攻击」') : tr('tutorial.attack.desktop','攻击 · 面向敌人后按 J'),
    skill: () => {
      const p=api.player,cost=window.__DE_COMBAT_CONTROLS_V1&&window.__DE_COMBAT_CONTROLS_V1.manaCost?window.__DE_COMBAT_CONTROLS_V1.manaCost():null;
      const base=coarse()?tr('tutorial.skill.mobile','技能 · 点「技能」释放，会消耗蓝量'):tr('tutorial.skill.desktop','技能 · K 释放，会消耗蓝量');
      if(!p)return base;
      const en=i18n()&&i18n().isEnglish;
      return en?`${base} · Mana ${p.mana}/${p.manaMax}${cost?`, cost ${cost}`:''}`:`${base} · ${p.mana}/${p.manaMax}${cost?`，消耗 ${cost}`:''}`;
    },
    bag: () => coarse() ? tr('tutorial.bag.mobile','装备 · 点背包物品查看属性，再点「装备」；穿戴不会覆盖角色立绘') : tr('tutorial.bag.desktop','装备 · 点击背包物品查看属性，再决定是否装备'),
    potion: () => coarse() ? tr('tutorial.potion.mobile','受伤后可点「药水」恢复；深层补给有限') : tr('tutorial.potion.desktop','受伤后按 Q 喝药；深层补给有限'),
    stairs: () => coarse() ? tr('tutorial.stairs.mobile','下潜 · 站上楼梯后点「下楼」进入下一层') : tr('tutorial.stairs.desktop','下潜 · 站上楼梯后按 Enter'),
    escape: () => coarse() ? tr('tutorial.escape.mobile','贪婪远征 · 点「回城」把背包和金币安全带回镇上') : tr('tutorial.escape.desktop','贪婪远征 · T 回城，把背包和金币安全带回镇上'),
    guardian: () => tr('tutorial.guardian','守卫破甲 · 明示的破甲大招命中会无视护甲；看到预警就走位，不要硬吃'),
  };

  let active='';let timer=0;let lastPlayer=null;
  let snap=null;
  const hpSum=()=> (api.monsters||[]).reduce((n,m)=>n+Math.max(0,Number(m&&m.hp)||0),0);
  const equipSig=p=>JSON.stringify(Object.fromEntries(Object.entries((p&&p.equip)||{}).map(([k,v])=>[k,v&&v.name||''])));
  const snapshot=()=>{
    const p=api.player;
    return p?{x:p.x,y:p.y,turn:Number(api.turns)||0,hp:hpSum(),mana:Number(p.mana),cd:Number(p.skillCd)||0,potions:Number(p.potions)||0,depth:Number(api.depth)||0,state:String(api.state||''),equip:equipSig(p)}:null;
  };

  function save(){try{localStorage.setItem(KEY,JSON.stringify({v:2,done:state.done}))}catch(e){}}
  const done=id=>!!state.done[id];
  function mark(id){if(!id||done(id))return;state.done[id]=1;save();if(active===id)hide()}
  function markAll(){for(const id of ALL)state.done[id]=1;save();hide()}

  const style=document.createElement('style');style.id='de-onboarding-style-v2';style.textContent=`
    #de-onboarding{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:12;display:flex;align-items:center;gap:10px;max-width:min(620px,86%);padding:8px 10px 8px 12px;border:1px solid rgba(132,157,196,.34);border-radius:8px;background:rgba(7,10,16,.86);color:#dbe6f4;box-shadow:0 5px 18px rgba(0,0,0,.34);backdrop-filter:blur(4px);font:600 12px/1.45 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;pointer-events:auto}
    #de-onboarding[hidden]{display:none}#de-onboarding b{color:#f1c45b;white-space:nowrap}#de-onboarding span{min-width:0}#de-onboarding button{border:0;background:transparent;color:#8ea2bb;padding:3px 4px;cursor:pointer;font-size:11px;white-space:nowrap}#de-onboarding button:hover{color:#fff}
    @media(max-width:700px) and (orientation:portrait){#de-onboarding{position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 190px);transform:none;max-width:none;z-index:90;font-size:12px;padding:8px 9px}#de-onboarding b{display:none}}
    @media(max-width:700px) and (orientation:landscape){#de-onboarding{position:fixed;left:8px;right:316px;bottom:calc(env(safe-area-inset-bottom) + 8px);transform:none;max-width:none;z-index:90;font-size:11px;padding:7px 8px}#de-onboarding b{display:none}}
  `;document.head.appendChild(style);
  const toast=document.createElement('div');toast.id='de-onboarding';toast.hidden=true;toast.innerHTML='<b></b><span></span><button type="button" data-tutorial-skip></button>';(document.getElementById('stage')||document.body).appendChild(toast);toast.querySelector('[data-tutorial-skip]').addEventListener('click',markAll);

  function syncLabels(){const b=toast.querySelector('b'),s=toast.querySelector('[data-tutorial-skip]');if(b)b.textContent=tr('tutorial.label','新手提示');if(s)s.textContent=tr('tutorial.skip','跳过教学');const r=document.getElementById('de-tutorial-reset');if(r)r.textContent=tr('tutorial.reset','重置教学')}
  function show(id,ttl=0){if(!id||done(id)||!text[id])return false;active=id;toast.querySelector('span').textContent=text[id]();syncLabels();toast.hidden=false;clearTimeout(timer);if(ttl>0)timer=setTimeout(()=>mark(id),ttl);return true}
  function hide(){clearTimeout(timer);timer=0;active='';toast.hidden=true}
  function adjacentEnemy(){const p=api.player;if(!p)return null;return(api.monsters||[]).find(m=>m&&Number(m.hp)>0&&Math.abs(Number(m.x)-p.x)+Math.abs(Number(m.y)-p.y)===1)||null}
  const anyThreat=()=> (api.monsters||[]).some(m=>m&&Number(m.hp)>0);
  const guardianCharging=()=> (api.monsters||[]).some(m=>m&&Number(m.hp)>0&&(m.midBoss||m.boss)&&Number(m.armorBreakCharge)>0)||!!document.querySelector('#guardian-telegraph:not(.hidden)');

  function inferProgress(cur){
    if(!snap||!cur)return;
    if(!done('move')&&(cur.x!==snap.x||cur.y!==snap.y))mark('move');
    if(!done('attack')&&cur.turn>snap.turn&&cur.x===snap.x&&cur.y===snap.y&&cur.hp<snap.hp)mark('attack');
    if(!done('skill')&&((Number.isFinite(cur.mana)&&Number.isFinite(snap.mana)&&cur.mana<snap.mana)||cur.cd>snap.cd))mark('skill');
    if(!done('potion')&&cur.potions<snap.potions)mark('potion');
    if(!done('stairs')&&cur.depth>snap.depth)mark('stairs');
    if(!done('escape')&&snap.state==='playing'&&cur.state==='town')mark('escape');
    if(!done('bag')&&cur.equip!==snap.equip)mark('bag');
  }

  function inspect(){
    const p=api.player,cur=snapshot();
    if(p!==lastPlayer){lastPlayer=p;snap=cur;active='';toast.hidden=true}
    inferProgress(cur);snap=cur;
    if(!p||api.state!=='playing')return;
    if(!done('move')){show('move');return}
    if(!done('attack')&&adjacentEnemy()){show('attack');return}
    if(!done('skill')&&done('attack')&&anyThreat()&&Number(p.skillCd||0)<=0&&Number.isFinite(Number(p.mana))){show('skill');return}
    if(!done('bag')&&done('skill')&&Array.isArray(p.inv)&&p.inv.length){show('bag');return}
    if(!done('potion')&&p.potions>0&&Number(p.hp)>0&&typeof api.pMaxHp==='function'&&p.hp/api.pMaxHp()<.62){show('potion',5200);return}
    const hint=document.getElementById('hint');if(!done('stairs')&&hint&&hint.classList.contains('active')){show('stairs',4800);return}
    if(!done('escape')&&api.meta&&Number(p.escapes)>0&&Number(api.depth)>=3){show('escape',5200);return}
    if(!done('guardian')&&guardianCharging()){show('guardian',6500);return}
    if(active&&done(active))hide();
  }

  document.addEventListener('click',e=>{if(!done('bag')&&e.target&&e.target.closest&&e.target.closest('#bag .bagcell'))mark('bag')},true);
  const LEGACY=/(?:面向敌人后按\s*J\s*攻击|J\s*攻击\s*·\s*K\s*技能|技能热键已改为\s*K)/i;
  const observer=typeof MutationObserver!=='undefined'?new MutationObserver(()=>{const el=document.getElementById('de-combat-feedback');if(el&&LEGACY.test(String(el.textContent||'')))el.hidden=true;attachReset()}):null;if(observer)observer.observe(document.body,{childList:true,subtree:true,characterData:true});

  function resetTutorial(){state.done={};save();hide();lastPlayer=null;snap=null;inspect()}
  function attachReset(){const tools=document.querySelector('#de-audio-settings-pop .de-audio-tools');if(!tools||document.getElementById('de-tutorial-reset'))return;const b=document.createElement('button');b.type='button';b.id='de-tutorial-reset';b.textContent=tr('tutorial.reset','重置教学');b.style.cssText='border:1px solid rgba(224,167,58,.3);background:#17100c;color:#d9c7a3;padding:5px 8px;font-size:10px;cursor:pointer;margin-right:auto';b.addEventListener('click',resetTutorial);tools.insertBefore(b,tools.firstChild)}
  window.addEventListener('de:languagechange',()=>{syncLabels();if(active&&!toast.hidden)toast.querySelector('span').textContent=text[active]()});

  setInterval(inspect,140);syncLabels();inspect();attachReset();window.__DE_COMBAT_HINT_POLISH={version:'v2',key:KEY,show,mark,resetTutorial,get state(){return JSON.parse(JSON.stringify(state))}};
})();
