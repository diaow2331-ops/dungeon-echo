/* Dungeon Echo forge feedback v3.
 * Presentation only: forge stage badges + success/refinement/masterwork feedback.
 * Core forge cost/stat mutation remains owned by game.js + forge-system.js.
 * Fixed-route locale and DE_LOCALE_DATA own visible copy; no runtime translator dependency remains.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_FORGE_FEEDBACK_V122) return;
  const api = window.DE_TEST;
  if (!api) return;

  let pending = null;
  let toastTimer = 0;
  let decorateQueued = false;
  const localeData = window.DE_LOCALE_DATA || null;
  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = localeData ? !!localeData.isEnglish : routeLang === 'en';
  const copy = (zh, en) => english ? en : zh;

  const esc = value => String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const statLabels = {atk:['攻击','ATK'],def:['防御','DEF'],hp:['生命','HP'],crit:['暴击','Crit'],leech:['吸血','Leech'],gold:['金币','Gold Find'],thorns:['反伤','Thorns'],regen:['击杀回复','Kill Heal']};

  function itemAt(where,index){
    const meta=api.meta;if(!meta)return null;
    const arr=where==='stash'?meta.stash:meta.bag;
    return Array.isArray(arr)?arr[index]||null:null;
  }
  function snapshot(item){
    if(!item)return null;
    return {item,forge:Number(item.forge)||0,name:String(item.name||''),stats:{...(item.stats||{})},path:item.refinePath||'',pathName:item.refineName||'',masterworked:!!item.masterworked,gold:api.meta?Number(api.meta.gold)||0:0};
  }
  function displayItemName(item){
    const forge=window.DE_FORGE_REFINEMENT;
    if(forge&&typeof forge.displayItemName==='function')return forge.displayItemName(item);
    if(localeData&&typeof localeData.itemName==='function')return localeData.itemName(item);
    return String(item&&item.name||'');
  }
  function statDelta(before,after){
    const out=[];
    const keys=new Set([...Object.keys(before||{}),...Object.keys(after||{})]);
    for(const key of keys){
      const d=(Number(after&&after[key])||0)-(Number(before&&before[key])||0);if(!d)continue;
      if(localeData&&typeof localeData.affixText==='function'){out.push(localeData.affixText(key,d));continue}
      const pair=statLabels[key]||[key,key];out.push(`${english?pair[1]:pair[0]} +${d}${key==='crit'||key==='leech'||key==='gold'?'%':''}`)
    }
    return out;
  }

  function ensureStyle(){
    if(document.getElementById('de-forge-feedback-style'))return;
    const style=document.createElement('style');style.id='de-forge-feedback-style';style.textContent=`
      #de-forge-toast{position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:10020;min-width:280px;max-width:min(520px,calc(100vw - 28px));padding:11px 14px;border:1px solid rgba(224,167,58,.48);border-radius:10px;background:linear-gradient(180deg,rgba(34,22,14,.97),rgba(14,11,9,.97));box-shadow:0 12px 38px rgba(0,0,0,.48),inset 0 1px rgba(255,232,180,.06);color:#e9dac0;font:600 12px/1.45 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;pointer-events:none}
      #de-forge-toast b{display:block;color:#f3d47e;font-size:13px;margin-bottom:2px}#de-forge-toast small{display:block;color:#ac9a84;font-weight:500}
      .de-forge-stage{display:block!important;margin-top:3px!important;color:#c9ad72!important;font-size:10px!important;letter-spacing:.02em}.de-forge-stage.master{color:#e9c467!important;text-shadow:0 0 8px rgba(224,167,58,.25)}
      @media(max-width:700px){#de-forge-toast{top:11%;min-width:0;width:calc(100vw - 28px)}}
    `;document.head.appendChild(style);
  }

  function showToast(title,detail='',sub=''){
    ensureStyle();let el=document.getElementById('de-forge-toast');if(!el){el=document.createElement('div');el.id='de-forge-toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}
    el.innerHTML=`<b>${esc(title)}</b>${detail?`<div>${esc(detail)}</div>`:''}${sub?`<small>${esc(sub)}</small>`:''}`;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true},2600);
  }

  function refineLabel(item){
    if(!item||!item.refinePath)return '';
    if(localeData&&typeof localeData.refineName==='function')return localeData.refineName(item.refinePath);
    return english?String(item.refinePath):String(item.refineName||item.refinePath);
  }

  function stageText(item){
    const level=Math.max(0,Number(item&&item.forge)||0);
    if(english){
      if(item&&item.masterworked)return `Forge +${level}/5 · Masterwork`;
      if(item&&item.refinePath)return `Forge +${level}/5 · ${refineLabel(item)}`;
      if(level>=3)return `Forge +${level}/5 · Refinement pending`;
      return `Forge +${level}/5`;
    }
    if(item&&item.masterworked)return `锻造 +${level}/5 · 已淬炼`;
    if(item&&item.refinePath)return `锻造 +${level}/5 · ${refineLabel(item)||'已精炼'}`;
    if(level>=3)return `锻造 +${level}/5 · 待精炼`;
    return `锻造 +${level}/5`;
  }

  function decorateRows(){
    decorateQueued=false;
    if(api.state!=='town'||!api.meta)return false;
    let changed=0;
    for(const btn of document.querySelectorAll('[data-forge]')){
      const [where,raw]=String(btn.dataset.forge||'').split(':');const item=itemAt(where,Number(raw));const row=btn.closest('.town-row');if(!item||!row)continue;
      const label=row.children&&row.children[0];if(!label)continue;
      let badge=label.querySelector('.de-forge-stage');if(!badge){badge=document.createElement('small');badge.className='de-forge-stage';label.appendChild(badge);changed++}
      const text=stageText(item);if(badge.textContent!==text){badge.textContent=text;changed++}badge.classList.toggle('master',!!item.masterworked);
    }
    return changed>0;
  }
  function scheduleDecorate(){
    if(decorateQueued)return;
    decorateQueued=true;
    requestAnimationFrame(decorateRows);
  }

  document.addEventListener('click',e=>{
    scheduleDecorate();
    const btn=e.target&&e.target.closest?e.target.closest('[data-forge]'):null;if(!btn||api.state!=='town')return;
    const [where,raw]=String(btn.dataset.forge||'').split(':');const index=Number(raw),item=itemAt(where,index);if(!item)return;
    pending={where,index,before:snapshot(item)};
  },true);

  document.addEventListener('click',e=>{
    const btn=e.target&&e.target.closest?e.target.closest('[data-forge]'):null;if(!btn||!pending)return;
    const p=pending;pending=null;const item=itemAt(p.where,p.index);if(!item||item!==p.before.item)return;
    const after=snapshot(item);if(after.forge<=p.before.forge)return;
    const deltas=statDelta(p.before.stats,after.stats);const spent=Math.max(0,p.before.gold-after.gold);
    const name=displayItemName(item);
    const title=copy(`强化成功 · +${p.before.forge} → +${after.forge}`,`Forge success · +${p.before.forge} → +${after.forge}`);
    const detail=[name,...deltas].filter(Boolean).join(' · ');
    let sub=copy(`消耗 ${spent} 金币`,`Spent ${spent} Gold`);
    if(after.forge===3&&!after.path)sub+=copy(' · 已解锁精炼方向',' · Refinement unlocked');
    if(after.masterworked&&!p.before.masterworked)sub+=copy(' · 淬炼完成',' · Masterwork completed');
    showToast(title,detail,sub);scheduleDecorate();
  },false);

  // Forge-system handles refinement on document capture and stops the click there.
  // Window capture sees the source-localized choice first, then confirms on the next frame.
  window.addEventListener('click',e=>{
    const btn=e.target&&e.target.closest?e.target.closest('[data-de-refine]'):null;if(!btn)return;
    const choice=String(btn.textContent||'').replace(/\s+/g,' ').trim();
    requestAnimationFrame(()=>{showToast(copy('精炼路线已确定','Refinement locked in'),choice,copy('该路线会在 +5 时完成最终淬炼。','This path receives its final bonus at +5.'));decorateRows()});
  },true);

  document.addEventListener('keydown',scheduleDecorate,true);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleDecorate()});
  window.addEventListener('focus',scheduleDecorate);
  window.addEventListener('pageshow',scheduleDecorate);

  ensureStyle();scheduleDecorate();
  window.__DE_FORGE_FEEDBACK_V122={version:'v3',owner:'forge-feedback-v122',locale:english?'en':'zh-CN',decorateRows,scheduleDecorate,stageText,statDelta,showToast};
})();