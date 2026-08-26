/* Dungeon Echo v1.2.2 ground-loot polish.
 * Presentation only: subtle ground shadow, rarity aura and pickup glint for visible loot.
 * Does not change item sprites, RNG, pickup rules, stats or fog-of-war information.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_WORLD_LOOT_V122) return;
  const api = window.DE_TEST;
  const stage = document.getElementById('stage');
  const game = document.getElementById('game');
  if (!api || !stage || !game || typeof game.getContext !== 'function') return;

  const overlay = document.createElement('canvas');
  overlay.id = 'de-world-loot-v122';
  overlay.setAttribute('aria-hidden','true');
  overlay.style.cssText = 'position:absolute;inset:0;width:100%;height:auto;pointer-events:none;z-index:3';
  stage.appendChild(overlay);
  const ctx = overlay.getContext('2d');
  if (!ctx) return;

  const RARITY = ['#aeb8c2','#63b77c','#62a7e8','#b27ce8','#eda23a'];
  const TYPE = {gold:'#e7b447',potion:'#d96b6b',key:'#68c7d9',scroll:'#8d9fe8',escape:'#d7bc72',equip:'#b6c4d2'};
  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));

  function los(x0,y0,x1,y1,grid) {
    let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy,x=x0,y=y0;
    while (!(x===x1&&y===y1)) {
      if (!(x===x0&&y===y0) && (!grid[y] || grid[y][x]===0)) return false;
      const e2=2*err; if(e2>-dy){err-=dy;x+=sx} if(e2<dx){err+=dx;y+=sy}
    }
    return true;
  }

  function viewState() {
    const grid=api.mapGrid,p=api.player;
    if(!Array.isArray(grid)||!grid.length||!p)return null;
    const mapRows=grid.length,mapCols=grid[0]&&grid[0].length||40;
    const cols=clamp(Math.round((Number(game.width)||1280)/32),1,mapCols);
    const rows=clamp(Math.round((Number(game.height)||896)/32),1,mapRows);
    const vx=clamp(Math.round(Number(p.x)||0)-Math.floor(cols/2),0,Math.max(0,mapCols-cols));
    const vy=clamp(Math.round(Number(p.y)||0)-Math.floor(rows/2),0,Math.max(0,mapRows-rows));
    return {grid,p,cols,rows,vx,vy,tw:(Number(game.width)||cols*32)/cols,th:(Number(game.height)||rows*32)/rows};
  }

  function visible(it,v) {
    if(!it||!v)return false;
    const x=Number(it.x),y=Number(it.y); if(!Number.isFinite(x)||!Number.isFinite(y))return false;
    if(x<v.vx||y<v.vy||x>=v.vx+v.cols||y>=v.vy+v.rows)return false;
    if(Math.hypot(x-v.p.x,y-v.p.y)>8.6)return false;
    return los(v.p.x,v.p.y,x,y,v.grid);
  }

  function colorFor(it) {
    if(it&&it.type==='equip'&&it.item){const r=clamp(Number(it.item.rarity)||0,0,4);return RARITY[r]}
    return TYPE[it&&it.type]||TYPE.equip;
  }
  function rarityFor(it){return it&&it.type==='equip'&&it.item?clamp(Number(it.item.rarity)||0,0,4):0}

  function paintItem(it,v,now) {
    if(!visible(it,v))return;
    const x=(Number(it.x)-v.vx+.5)*v.tw,y=(Number(it.y)-v.vy+.5)*v.th;
    const c=colorFor(it),rarity=rarityFor(it);
    const pulse=reduceMotion?.45:(.45+.55*Math.sin(now*.0045+(Number(it.x)||0)*.91+(Number(it.y)||0)*.47));
    const radius=Math.min(v.tw,v.th)*(it.type==='equip'?.42:.34);

    ctx.save();
    ctx.globalAlpha=.22+rarity*.025;
    ctx.fillStyle='rgba(0,0,0,.75)';
    ctx.beginPath();ctx.ellipse(x,y+v.th*.25,radius*.72,radius*.22,0,0,Math.PI*2);ctx.fill();

    const g=ctx.createRadialGradient(x,y+v.th*.08,1,x,y+v.th*.08,radius*(1.45+rarity*.08));
    g.addColorStop(0,c+'55');g.addColorStop(.48,c+'20');g.addColorStop(1,c+'00');
    ctx.globalAlpha=.55+pulse*.16;ctx.fillStyle=g;ctx.fillRect(x-radius*1.7,y-radius*1.7,radius*3.4,radius*3.4);

    ctx.strokeStyle=c;ctx.globalAlpha=.18+rarity*.07+pulse*.08;ctx.lineWidth=1+rarity*.22;
    ctx.beginPath();ctx.ellipse(x,y+v.th*.24,radius*(.62+rarity*.025),radius*.19,0,0,Math.PI*2);ctx.stroke();

    if(!reduceMotion){
      const gy=y-v.th*(.17+pulse*.08);ctx.globalAlpha=.22+rarity*.06+pulse*.20;ctx.fillStyle=c;
      ctx.beginPath();ctx.moveTo(x,gy-3-rarity);ctx.lineTo(x+1.8,gy);ctx.lineTo(x,gy+3+rarity);ctx.lineTo(x-1.8,gy);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }

  let last=0;
  function frame(now){
    if(now-last>=80){
      last=now;
      const w=Number(game.width)||1280,h=Number(game.height)||896;
      if(overlay.width!==w)overlay.width=w;if(overlay.height!==h)overlay.height=h;
      ctx.clearRect(0,0,w,h);
      if(api.state==='playing'){
        const v=viewState();for(const it of (api.items||[]))paintItem(it,v,now);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__DE_WORLD_LOOT_V122={version:'v1',viewState,visible,colorFor};
})();
