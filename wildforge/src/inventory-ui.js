export const INVENTORY_SLOT_COUNT=40;

const KIND_ORDER=Object.freeze({weapon:0,pick:1,ammo:2,cargo:3,upgrade:4,material:5});
const KIND_LABEL=Object.freeze({
  weapon:{zh:'武器',en:'Weapon'},pick:{zh:'工具',en:'Tool'},ammo:{zh:'弹药',en:'Ammo'},
  cargo:{zh:'货物',en:'Cargo'},upgrade:{zh:'装备',en:'Upgrade'},material:{zh:'物资',en:'Material'}
});


const ATLAS_SIZE=Object.freeze({w:512,h:256});
const ITEM_SPRITES=Object.freeze({
  soil:[16,0,16,16],wood:[256,0,64,64],fiber:[320,0,64,64],stone:[384,0,64,64],coal:[448,0,64,64],
  copper_ore:[256,64,64,64],iron_ore:[320,64,64,64],sand:[384,64,64,64],ice:[448,64,64,64],
  clay:[256,128,64,64],plank:[320,128,64,64],rope:[384,128,64,64],torch:[448,128,64,64],
  campfire:[256,192,64,64],workbench:[320,192,64,64],crystal:[448,192,64,64],
  beacon:[144,0,24,40],greenheart_bale:[208,0,40,22],emberfuel_crate:[188,44,40,24],frostglass_case:[232,44,24,24]
});
function spriteMarkup(id){
  const r=ITEM_SPRITES[id];if(!r)return'';const [x,y,w,h]=r,scale=Math.min(2,32/w,32/h),sw=ATLAS_SIZE.w*scale,sh=ATLAS_SIZE.h*scale;
  return `<span class="slot-sprite" style="width:${(w*scale).toFixed(2)}px;height:${(h*scale).toFixed(2)}px;background-size:${sw.toFixed(2)}px ${sh.toFixed(2)}px;background-position:${(-x*scale).toFixed(2)}px ${(-y*scale).toFixed(2)}px"></span>`;
}

function esc(value){return String(value??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}
function kindRank(id,items){return KIND_ORDER[items[id]?.kind]??9;}
function keyLabel(index){return index===9?'0':String(index+1);}

function statLines(id,def,{lang,itemName}){
  if(!def)return[];const out=[];
  if(def.kind==='weapon'){
    out.push(lang==='zh'?`${def.damage||0} 伤害`:`${def.damage||0} damage`);
    if(def.knockback)out.push(lang==='zh'?`${def.knockback.toFixed(1)} 击退`:`${def.knockback.toFixed(1)} knockback`);
    if(def.ranged)out.push(lang==='zh'?`远程 · ${itemName(def.ammo||'arrow',lang)}`:`Ranged · ${itemName(def.ammo||'arrow',lang)}`);
  }
  if(def.kind==='pick')out.push(lang==='zh'?`镐力 ${Math.round((def.power||1)*100)}% · 等级 ${def.tier||0}`:`Pick power ${Math.round((def.power||1)*100)}% · tier ${def.tier||0}`);
  if(def.kind==='cargo')out.push(lang==='zh'?`标准货物 · 负重 ${def.cargoWeight||1}`:`Standard cargo · load ${def.cargoWeight||1}`);
  if(def.tile!==undefined)out.push(lang==='zh'?'可放置':'Placeable');
  if(def.rare)out.push(lang==='zh'?'稀有物品':'Rare item');
  return out;
}function slotMarkup(id,count,{items,itemName,lang,glyph,active=false,index=null,empty=false}){
  const def=items[id],name=def?itemName(id,lang):'',kind=def?.kind||'empty',rare=!!def?.rare;
  const classes=['item-slot',active?'active':'',rare?'rare':'',empty||!id?'empty':'',`kind-${kind}`].filter(Boolean).join(' ');
  const stats=def?statLines(id,def,{lang,itemName}):[];
  const tooltip=def?`<span class="slot-tooltip"><b>${esc(name)}</b>${stats.map(line=>`<small>${esc(line)}</small>`).join('')}</span>`:'';
  const key=index===null?'':`<span class="slot-key">${keyLabel(index)}</span>`;
  const qty=count>1?`<span class="slot-count">${Math.floor(count)}</span>`:'';
  return `<button class="${classes}" ${id?`data-item="${esc(id)}" draggable="true"`:''}${index!==null?` data-slot="${index}"`:''} aria-label="${esc(name||'empty slot')}">${key}${spriteMarkup(id)||`<span class="slot-icon">${esc(glyph[id]||'·')}</span>`}${qty}${tooltip}</button>`;
}

function bindDragSource(node,id){
  node.addEventListener('dragstart',event=>{if(!event.dataTransfer)return;event.dataTransfer.effectAllowed='copy';event.dataTransfer.setData('text/x-wildforge-item',id);});
}

export function renderInventorySlots({view,inventory,items,itemName,lang,glyph,selectedId,onEquip}){
  if(!view)return;const rows=Object.entries(inventory||{}).filter(([,n])=>Number(n)>0).sort((a,b)=>kindRank(a[0],items)-kindRank(b[0],items)||itemName(a[0],lang).localeCompare(itemName(b[0],lang)));
  const occupied=rows.slice(0,INVENTORY_SLOT_COUNT),empty=Math.max(0,INVENTORY_SLOT_COUNT-occupied.length);
  const held=selectedId?.()||'';const heldDef=items[held];
  const summary=heldDef?`<div class="inventory-held"><span>${lang==='zh'?'当前手持':'Held'}</span><b>${esc(itemName(held,lang))}</b><small>${esc(statLines(held,heldDef,{lang,itemName}).join(' · '))}</small></div>`:'';
  const slots=occupied.map(([id,n])=>slotMarkup(id,Number(n),{items,itemName,lang,glyph,active:held===id})).join('')+Array.from({length:empty},()=>slotMarkup('',0,{items,itemName,lang,glyph,empty:true})).join('');
  view.innerHTML=`<div class="inventory-shell"><div class="inventory-topline"><b>${lang==='zh'?'物品栏':'Inventory'}</b><span>${occupied.length}/${INVENTORY_SLOT_COUNT}</span></div>${summary}<div class="inv-grid terraria-grid">${slots}</div><div class="inventory-hint">${lang==='zh'?'点击物品放入当前快捷栏；桌面端也可拖到快捷栏槽位。':'Click an item to assign the selected hotbar slot; on desktop you can also drag it onto a slot.'}</div></div>`;
  view.querySelectorAll('[data-item]').forEach(node=>{const id=node.dataset.item;node.addEventListener('click',()=>onEquip?.(id));bindDragSource(node,id);});
}
export function renderHotbarSlots({bar,hotbar,inventory,items,itemName,lang,glyph,selected,onSelect,onEquip,onClear}){
  if(!bar)return;const ids=Array.from({length:10},(_,i)=>hotbar[i]||'');
  const held=ids[selected]||'',heldName=held&&items[held]?itemName(held,lang):lang==='zh'?'空手':'Empty hand';
  bar.innerHTML=`<div class="hotbar-rail">${ids.map((id,i)=>slotMarkup(id,Number(inventory?.[id]||0),{items,itemName,lang,glyph,active:i===selected,index:i,empty:!id})).join('')}</div><div class="hotbar-held">${esc(heldName)}</div>`;
  bar.querySelectorAll('[data-slot]').forEach(node=>{
    const slot=Number(node.dataset.slot);node.addEventListener('click',()=>onSelect?.(slot));
    node.addEventListener('dragover',event=>{event.preventDefault();node.classList.add('drop-target');});
    node.addEventListener('dragleave',()=>node.classList.remove('drop-target'));
    node.addEventListener('drop',event=>{event.preventDefault();node.classList.remove('drop-target');const id=event.dataTransfer?.getData('text/x-wildforge-item')||'';if(id&&items[id])onEquip?.(slot,id);});
    node.addEventListener('contextmenu',event=>{event.preventDefault();onClear?.(slot);});
    if(node.dataset.item)bindDragSource(node,node.dataset.item);
  });
}

export function normalizeHotbar(raw,defaults=[]){
  const out=Array.from({length:10},(_,i)=>Array.isArray(raw)&&typeof raw[i]==='string'?raw[i]:(defaults[i]||''));
  return out;
}