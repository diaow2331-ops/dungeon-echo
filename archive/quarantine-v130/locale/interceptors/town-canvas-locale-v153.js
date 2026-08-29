/* Dungeon Echo fixed-route town canvas sink v1.5.3.
 * The legacy town animation lives inside game.js and redraws labels every frame.
 * This owner localizes only fillText calls on the two concrete town canvas contexts; it never
 * mutates item/save names, patches CanvasRenderingContext2D.prototype, or owns a timer/observer loop.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_TOWN_CANVAS_LOCALE_V153) return;
  const english = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase() === 'en';
  const data = window.DE_LOCALE_DATA;
  const api = window.DE_TEST;
  if (!english || !data || !api) {
    window.__DE_TOWN_CANVAS_LOCALE_V153 = Object.freeze({version:'v153',owner:'town-canvas-locale-v153',locale:english?'en':'zh-CN',active:false,contexts:0});
    return;
  }

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

  function localizedText(canvasId,text) {
    const raw=String(text==null?'':text);
    if (canvasId==='town-scene') {
      const tier=raw.match(/^回响小镇 · 阶段 (\d+)$/);
      if (tier) return `Echo Town · Tier ${tier[1]}`;
      return fixed[raw] || raw;
    }
    if (canvasId==='wheel-canvas') {
      if (fixed[raw]) return fixed[raw];
      if (/[\u3400-\u9fff]/.test(raw)) return localizeWheelItem(raw);
    }
    return raw;
  }

  const owned=[];
  function ownCanvas(id) {
    const canvas=document.getElementById(id);
    if (!canvas || typeof canvas.getContext!=='function') return false;
    const ctx=canvas.getContext('2d');
    if (!ctx || typeof ctx.fillText!=='function' || ctx.__deTownCanvasLocaleV153) return false;
    const raw=ctx.fillText;
    const wrapped=function(text,x,y,maxWidth) {
      const value=localizedText(id,text);
      return arguments.length>=4 ? raw.call(this,value,x,y,maxWidth) : raw.call(this,value,x,y);
    };
    try {
      ctx.fillText=wrapped;
      Object.defineProperty(ctx,'__deTownCanvasLocaleV153',{value:{raw,wrapped,id},configurable:true});
      owned.push(ctx);
      return true;
    } catch (_e) { return false; }
  }

  ownCanvas('town-scene');
  ownCanvas('wheel-canvas');

  function restore() {
    for (const ctx of owned.splice(0)) {
      const mark=ctx && ctx.__deTownCanvasLocaleV153;
      if (!mark) continue;
      if (ctx.fillText===mark.wrapped) ctx.fillText=mark.raw;
      try { delete ctx.__deTownCanvasLocaleV153; } catch (_e) {}
    }
    return true;
  }

  window.__DE_TOWN_CANVAS_LOCALE_V153 = Object.freeze({
    version:'v153',owner:'town-canvas-locale-v153',locale:'en',active:owned.length>0,contexts:owned.length,
    localizedText,restore,
  });
})();