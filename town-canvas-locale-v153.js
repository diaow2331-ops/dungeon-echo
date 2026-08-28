/* Dungeon Echo fixed-route town canvas sink v1.5.3.
 * The legacy town animation lives inside game.js and redraws labels every frame.
 * This owner localizes only fillText calls made by the two town canvases; it never
 * mutates item/save names and owns no timer, observer or animation loop.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_TOWN_CANVAS_LOCALE_V153) return;
  const english = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase() === 'en';
  const proto = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
  const data = window.DE_LOCALE_DATA;
  const api = window.DE_TEST;
  if (!english || !proto || typeof proto.fillText !== 'function' || !data || !api) {
    window.__DE_TOWN_CANVAS_LOCALE_V153 = Object.freeze({version:'v153',owner:'town-canvas-locale-v153',locale:english?'en':'zh-CN',active:false});
    return;
  }
  if (proto.__deTownCanvasLocaleV153) return;

  const rawFillText = proto.fillText;
  const fixed = Object.freeze({
    '仓库':'Stash','锻造':'Forge','市集':'Market','客栈':'Inn','转盘':'Wheel',
    '药水':'Potion','卷轴':'Scroll','钥匙':'Key','回城':'Return','保险符':'Charm','空门':'Empty',
  });
  const shortLegacy = value => {
    const raw=String(value||'');
    return raw.length>5 ? raw.slice(0,4)+'…' : raw;
  };
  const shortEnglish = value => {
    const raw=String(value||'');
    return raw.length>12 ? raw.slice(0,11)+'…' : raw;
  };

  function localizeWheelItem(text) {
    const meta=api.meta;
    const slots=meta && Array.isArray(meta.wheelSlots) ? meta.wheelSlots : [];
    for (const slot of slots) {
      const item=slot && slot.kind==='equip' && slot.item;
      if (!item || shortLegacy(item.name)!==text) continue;
      return shortEnglish(typeof data.itemName==='function' ? data.itemName(item) : item.name);
    }
    return text;
  }

  function localizedText(ctx,text) {
    const raw=String(text==null?'':text);
    const id=ctx && ctx.canvas && ctx.canvas.id;
    if (id==='town-scene') {
      const tier=raw.match(/^回响小镇 · 阶段 (\d+)$/);
      if (tier) return `Echo Town · Tier ${tier[1]}`;
      return fixed[raw] || raw;
    }
    if (id==='wheel-canvas') {
      if (fixed[raw]) return fixed[raw];
      if (/[\u3400-\u9fff]/.test(raw)) return localizeWheelItem(raw);
    }
    return raw;
  }

  function fixedFillText(text,x,y,maxWidth) {
    const value=localizedText(this,text);
    return arguments.length>=4
      ? rawFillText.call(this,value,x,y,maxWidth)
      : rawFillText.call(this,value,x,y);
  }

  Object.defineProperty(proto,'__deTownCanvasLocaleV153',{value:true,configurable:true});
  proto.fillText=fixedFillText;

  function restore() {
    if (proto.fillText===fixedFillText) proto.fillText=rawFillText;
    try { delete proto.__deTownCanvasLocaleV153; } catch (_e) {}
    return true;
  }

  window.__DE_TOWN_CANVAS_LOCALE_V153 = Object.freeze({
    version:'v153',owner:'town-canvas-locale-v153',locale:'en',active:true,
    localizedText,restore,
  });
})();
