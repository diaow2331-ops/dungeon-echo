/* Dungeon Echo v1.2.2 forge feedback layer.
 * Presentation only: forge stage badges + success/refinement/masterwork feedback.
 * Core forge cost/stat mutation remains owned by game.js + forge-system.js.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_FORGE_FEEDBACK_V122) return;
  const api = window.DE_TEST;
  if (!api) return;

  let pending = null;
  let toastTimer = 0;
  const L = () => window.DE_I18N;
  const isEn = () => !!(L() && L().isEnglish);
  const translate = text => L() && typeof L().translate === 'function' ? L().translate(text) : text;

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
  function statDelta(before,after){
    const out=[];
    const keys=new Set([...Object.keys(before||{}),...Object.keys(after||{})]);
    for(const key of keys){const d=(Number(after&&after[key])||0)-(Number(before&&before[key])||0);if(!d)continue;const pair=statLabels[key]||[key,key];out.push(`${isEn()?pair[1]:pair[0]} +${d}${key==='crit'||key==='leech'||key==='gold'?'%':''}`)}
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

  function stageText(item){
    const level=Math.max(0,Number(item&&item.forge)||0);
    if(isEn()){
      if(item&&item.masterworked)return `Forge +${level}/5 · Masterwork`;
      if(item&&item.refinePath)return `Forge +${level}/5 · ${translate(item.refineName||item.refinePath)}`;
      if(level>=3)return `Forge +${level}/5 · Refinement pending`;
      return `Forge +${level}/5`;
    }
    if(item&&item.masterworked)return `锻造 +${level}/5 · 已淬炼`;
    if(item&&item.refinePath)return `锻造 +${level}/5 · ${item.refineName||'已精炼'}`;
    if(level>=3)return `锻造 +${level}/5 · 待精炼`;
    return `锻造 +${level}/5`;
  }

  function decorateRows(){
    if(api.state!=='town'||!api.meta)return;
    for(const btn of document.querySelectorAll('[data-forge]')){
      const [where,raw]=String(btn.dataset.forge||'').split(':');const item=itemAt(where,Number(raw));const row=btn.closest('.town-row');if(!item||!row)continue;
      const label=row.children&&row.children[0];if(!label)continue;
      let badge=label.querySelector('.de-forge-stage');if(!badge){badge=document.createElement('small');badge.className='de-forge-stage';label.appendChild(badge)}
      badge.textContent=stageText(item);badge.classList.toggle('master',!!item.masterworked);
    }
  }

  document.addEventListener('click',e=>{
    const btn=e.target&&e.target.closest?e.target.closest('[data-forge]'):null;if(!btn||api.state!=='town')return;
    const [where,raw]=String(btn.dataset.forge||'').split(':');const index=Number(raw),item=itemAt(where,index);if(!item)return;
    pending={where,index,before:snapshot(item)};
  },true);

  document.addEventListener('click',e=>{
    const btn=e.target&&e.target.closest?e.target.closest('[data-forge]'):null;if(!btn||!pending)return;
    const p=pending;pending=null;const item=itemAt(p.where,p.index);if(!item||item!==p.before.item)return;
    const after=snapshot(item);if(after.forge<=p.before.forge)return;
    const deltas=statDelta(p.before.stats,after.stats);const spent=Math.max(0,p.before.gold-after.gold);
    const name=translate(after.name||p.before.name);
    const title=isEn()?`Forge success · +${p.before.forge} → +${after.forge}`:`强化成功 · +${p.before.forge} → +${after.forge}`;
    const detail=[name,...deltas].filter(Boolean).join(' · ');
    let sub=isEn()?`Spent ${spent} Gold`:`消耗 ${spent} 金币`;
    if(after.forge===3&&!after.path)sub+=isEn()?' · Refinement unlocked':' · 已解锁精炼方向';
    if(after.masterworked&&!p.before.masterworked)sub+=isEn()?' · Masterwork completed':' · 淬炼完成';
    showToast(title,detail,sub);requestAnimationFrame(decorateRows);
  },false);

  // Forge-system handles refinement on document capture and stops the click there.
  // Window capture sees the choice first, then confirms on the next animation frame.
  window.addEventListener('click',e=>{
    const btn=e.target&&e.target.closest?e.target.closest('[data-de-refine]'):null;if(!btn)return;
    const choice=String(btn.textContent||'').replace(/\s+/g,' ').trim();
    requestAnimationFrame(()=>{showToast(isEn()?'Refinement locked in':'精炼路线已确定',translate(choice),isEn()?'This path receives its final bonus at +5.':'该路线会在 +5 时完成最终淬炼。');decorateRows()});
  },true);

  const town=document.getElementById('town-screen');
  if(town&&typeof MutationObserver!=='undefined')new MutationObserver(records=>{if(records.some(r=>r.addedNodes&&r.addedNodes.length))decorateRows()}).observe(town,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('#btn-depart,#btn-town-exit,[data-deposit],[data-withdraw],[data-sell]'))requestAnimationFrame(decorateRows)},false);

  ensureStyle();decorateRows();
  window.__DE_FORGE_FEEDBACK_V122={version:'v1',decorateRows,stageText,statDelta,showToast};
})();
