export const INVENTORY_SLOT_COUNT=40;

const KIND_ORDER=Object.freeze({weapon:0,pick:1,ammo:2,cargo:3,upgrade:4,material:5});
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
}

function slotMarkup(id,count,{items,itemName,lang,glyph,active=false,hotbarIndex=null,inventoryIndex=null}){
  const def=items[id],name=def?itemName(id,lang):'',kind=def?.kind||'empty',rare=!!def?.rare,empty=!id;
  const classes=['item-slot',active?'active':'',rare?'rare':'',empty?'empty':'',inventoryIndex!==null?'inventory-slot':'',`kind-${kind}`].filter(Boolean).join(' ');
  const stats=def?statLines(id,def,{lang,itemName}):[];
  const tooltip=def?`<span class="slot-tooltip"><b>${esc(name)}</b>${stats.map(line=>`<small>${esc(line)}</small>`).join('')}</span>`:'';
  const key=hotbarIndex===null?'':`<span class="slot-key">${keyLabel(hotbarIndex)}</span>`;
  const qty=count>1?`<span class="slot-count">${Math.floor(count)}</span>`:'';
  const attrs=[id?`data-item="${esc(id)}" draggable="true"`:'',hotbarIndex!==null?`data-slot="${hotbarIndex}"`:'',inventoryIndex!==null?`data-inv-slot="${inventoryIndex}"`:''].filter(Boolean).join(' ');
  return `<button class="${classes}" ${attrs} aria-label="${esc(name||'empty slot')}">${key}${spriteMarkup(id)||`<span class="slot-icon">${esc(glyph[id]||'·')}</span>`}${qty}${tooltip}</button>`;
}
function bindDragSource(node,id){
  node.addEventListener('dragstart',event=>{if(!event.dataTransfer)return;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/x-wildforge-item',id);});
}
function bindDropTarget(node,onDrop){
  node.addEventListener('dragover',event=>{const id=event.dataTransfer?.types?.includes('text/x-wildforge-item');if(!id)return;event.preventDefault();node.classList.add('drop-target');});
  node.addEventListener('dragleave',()=>node.classList.remove('drop-target'));
  node.addEventListener('drop',event=>{event.preventDefault();node.classList.remove('drop-target');const id=event.dataTransfer?.getData('text/x-wildforge-item')||'';if(id)onDrop?.(id);});
}

export function normalizeInventoryLayout(raw,inventory={},items={}){
  const out=Array.from({length:INVENTORY_SLOT_COUNT},()=>''),seen=new Set();
  const valid=id=>typeof id==='string'&&id&&Number(inventory?.[id]||0)>0&&(!items||!Object.keys(items).length||!!items[id]);
  if(Array.isArray(raw))for(let i=0;i<Math.min(raw.length,INVENTORY_SLOT_COUNT);i++){const id=raw[i];if(valid(id)&&!seen.has(id)){out[i]=id;seen.add(id);}}
  const missing=Object.keys(inventory||{}).filter(id=>valid(id)&&!seen.has(id)).sort((a,b)=>kindRank(a,items)-kindRank(b,items));
  for(const id of missing){const slot=out.indexOf('');if(slot<0)break;out[slot]=id;seen.add(id);}
  return out;
}

export function renderInventorySlots({view,inventory,layout,items,itemName,lang,glyph,selectedId,onEquip,onMove}){
  if(!view)return;const normalized=normalizeInventoryLayout(layout,inventory,items),held=selectedId?.()||'',heldDef=items[held];
  const occupied=normalized.filter(Boolean).length,summary=heldDef?`<div class="inventory-held"><span>${lang==='zh'?'当前手持':'Held'}</span><b>${esc(itemName(held,lang))}</b><small>${esc(statLines(held,heldDef,{lang,itemName}).join(' · '))}</small></div>`:'';
  const slots=normalized.map((id,index)=>slotMarkup(id,Number(inventory?.[id]||0),{items,itemName,lang,glyph,active:held===id,inventoryIndex:index})).join('');
  view.innerHTML=`<div class="inventory-shell"><div class="inventory-topline"><b>${lang==='zh'?'物品栏':'Inventory'}</b><span>${occupied}/${INVENTORY_SLOT_COUNT}</span></div>${summary}<div class="inv-grid terraria-grid">${slots}</div><div class="inventory-hint">${lang==='zh'?'这是固定 40 槽背包：拖动物品可整理位置；点击物品可绑定到当前快捷栏。':'Fixed 40-slot pack: drag items to rearrange slots; click an item to bind it to the selected hotbar slot.'}</div></div>`;
  view.querySelectorAll('[data-inv-slot]').forEach(node=>{const target=Number(node.dataset.invSlot),id=node.dataset.item||'';if(id){node.addEventListener('click',()=>onEquip?.(id));bindDragSource(node,id);}bindDropTarget(node,itemId=>onMove?.(itemId,target));});
}

export function renderHotbarSlots({bar,hotbar,inventory,items,itemName,lang,glyph,selected,onSelect,onEquip,onClear}){
  if(!bar)return;const ids=Array.from({length:10},(_,i)=>hotbar[i]||''),held=ids[selected]||'',heldName=held&&items[held]?itemName(held,lang):lang==='zh'?'空手':'Empty hand';
  bar.innerHTML=`<div class="hotbar-rail">${ids.map((id,i)=>slotMarkup(id,Number(inventory?.[id]||0),{items,itemName,lang,glyph,active:i===selected,hotbarIndex:i})).join('')}</div><div class="hotbar-held">${esc(heldName)}</div>`;
  bar.querySelectorAll('[data-slot]').forEach(node=>{
    const slot=Number(node.dataset.slot);node.addEventListener('click',()=>onSelect?.(slot));bindDropTarget(node,id=>onEquip?.(slot,id));
    node.addEventListener('contextmenu',event=>{event.preventDefault();onClear?.(slot);});if(node.dataset.item)bindDragSource(node,node.dataset.item);
  });
}

export function normalizeHotbar(raw,defaults=[]){
  return Array.from({length:10},(_,i)=>Array.isArray(raw)&&typeof raw[i]==='string'?raw[i]:(defaults[i]||''));
}
