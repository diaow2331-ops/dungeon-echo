import {BIOMES, TILE, TILE_DEFS} from './data.js';
import {decorateSurface} from './surface-content.js';

export const LEGACY_WORLD_W = 480;
export const WORLD_W = 1920;
export const WORLD_H = 144;
export const BIOME_BAND_W = 160;

function hashSeed(text='wildforge') {
  let h = 2166136261 >>> 0;
  for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function makeRng(seed) {
  let a = hashSeed(seed) || 0x9e3779b9;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const idx = (x,y,w=WORLD_W) => y*w+x;
const inBounds = (x,y,w=WORLD_W,h=WORLD_H) => x>=0 && x<w && y>=0 && y<h;

export function biomeIndexAt(x,w=WORLD_W) {
  const width=Math.max(1,Number(w)||WORLD_W),clamped=Math.max(0,Math.min(width-1,Math.floor(Number(x)||0)));
  return Math.floor(clamped/BIOME_BAND_W)%BIOMES.length;
}

function encodedTileCount(raw){
  let total=0;for(const run of String(raw||'').split(',')){if(!run)continue;const parts=run.split('.'),count=parseInt(parts[1],36);if(!Number.isFinite(count)||count<1)return 0;total+=count;}return total;
}

export function encodeTiles(tiles) {
  const out=[];
  let last=tiles[0], count=1;
  for (let i=1;i<tiles.length;i++) {
    const v=tiles[i];
    if (v===last && count<65535) count++;
    else { out.push(last.toString(36)+'.'+count.toString(36)); last=v; count=1; }
  }
  out.push(last.toString(36)+'.'+count.toString(36));
  return out.join(',');
}

export function decodeTiles(raw, expected=WORLD_W*WORLD_H) {
  const tiles=new Uint8Array(expected);
  let at=0;
  for (const run of String(raw||'').split(',')) {
    if (!run) continue;
    const [a,b]=run.split('.');
    const value=parseInt(a,36), count=parseInt(b,36);
    if (!Number.isFinite(value)||!Number.isFinite(count)||count<1||at+count>expected) throw new Error('invalid tile save');
    tiles.fill(value,at,at+count); at+=count;
  }
  if (at!==expected) throw new Error('incomplete tile save');
  return tiles;
}

export class World {
  constructor(seed, saved=null) {
    this.seed=String(seed||'wildforge'); this.w=WORLD_W; this.h=WORLD_H;
    this.surface=new Int16Array(this.w);
    this.ruins=[];
    this.surfaceSites=[];
    if (saved) {
      const count=encodedTileCount(saved);
      if(count===this.w*this.h){
        this.tiles=decodeTiles(saved,this.w*this.h);this.rebuildSurface();this.surfaceSites=[];
        const sx=Math.min(this.w-8,560);this.spawn={x:sx+.5,y:this.surface[sx]-1.1};
      }else if(count===LEGACY_WORLD_W*this.h){
        const legacy=decodeTiles(saved,LEGACY_WORLD_W*this.h);this.generate();
        for(let y=0;y<this.h;y++)for(let x=0;x<LEGACY_WORLD_W;x++)this.tiles[y*this.w+x]=legacy[y*LEGACY_WORLD_W+x];
        this.rebuildSurface();this.surfaceSites=this.surfaceSites.filter(site=>site.x>=LEGACY_WORLD_W+18);
        const sx=54;this.spawn={x:sx+.5,y:this.surface[sx]-1.1};this.expandedLegacy=true;
      }else throw new Error('unsupported tile save dimensions');
    } else this.generate();
  }
  get(x,y) {
    x=Math.floor(x); y=Math.floor(y);
    if (!inBounds(x,y,this.w,this.h)) return y<0?TILE.AIR:TILE.STONE;
    return this.tiles[idx(x,y,this.w)];
  }
  set(x,y,v) {
    x=Math.floor(x); y=Math.floor(y);
    if (inBounds(x,y,this.w,this.h)) this.tiles[idx(x,y,this.w)]=v;
  }
  solid(x,y) { const d=TILE_DEFS[this.get(x,y)]; return !!(d&&d.solid); }
  biome(x) { return BIOMES[biomeIndexAt(x,this.w)]; }
  rebuildSurface() {
    const natural=new Set([TILE.GRASS,TILE.SOIL,TILE.STONE,TILE.COAL,TILE.COPPER,TILE.IRON,TILE.CRYSTAL,TILE.SAND,TILE.SANDSTONE,TILE.ASH,TILE.BASALT,TILE.ICE,TILE.SNOW,TILE.CLAY]);
    for (let x=0;x<this.w;x++) {
      let y=0;
      while (y<this.h-1 && !natural.has(this.get(x,y))) y++;
      this.surface[x]=y;
    }
  }
  generate() {
    const rng=makeRng(this.seed);
    this.tiles=new Uint8Array(this.w*this.h);
    let wander=0;
    for (let x=0;x<this.w;x++) {
      const b=BIOMES[biomeIndexAt(x,this.w)];
      wander=(wander+(rng()-.5)*1.25)*.82;
      const wave=Math.sin(x*.053)*2.8+Math.sin(x*.017)*4.4;
      const surface=Math.max(31,Math.min(61,Math.round(43+wave+wander+(b.id==='ember'?4:b.id==='frost'?-1:0))));
      this.surface[x]=surface;
      for (let y=surface;y<this.h;y++) {
        const depth=y-surface;
        let tile=depth===0?b.surface:(depth<5?b.fill:b.deepTile);
        if (b.id==='ember' && depth===1 && rng()<.22) tile=TILE.SAND;
        if (b.id==='verdant' && depth>2 && depth<10 && rng()<.07) tile=TILE.CLAY;
        this.set(x,y,tile);
      }
    }
    this.carveCaves(rng);
    this.scatterOre(rng,TILE.COAL,4,92,1,3);
    this.scatterOre(rng,TILE.COPPER,8,104,2,3);
    this.scatterOre(rng,TILE.IRON,18,126,2,4);
    this.scatterOre(rng,TILE.CRYSTAL,38,138,2,3);
    this.scatterOre(rng,TILE.CLAY,5,90,2,4);
    this.placeTrees(rng);
    this.placeGlowMoss(rng);
    this.placeRuins(rng);
    const spawnX=Math.min(this.w-8,560);
    decorateSurface(this,rng,{TILE,spawnX});
    this.clearSpawn(spawnX);
  }
  carveCaves(rng) {
    const caveCount=Math.round(165*(this.w/LEGACY_WORLD_W));
    for (let c=0;c<caveCount;c++) {
      let x=6+Math.floor(rng()*(this.w-12));
      let y=this.surface[x]+7+Math.floor(rng()*(this.h-this.surface[x]-15));
      let angle=rng()*Math.PI*2;
      const steps=24+Math.floor(rng()*92);
      for (let s=0;s<steps;s++) {
        angle+=(rng()-.5)*.85;
        x+=Math.cos(angle)*1.25; y+=Math.sin(angle)*.8;
        const r=1+(rng()<.22?1:0)+(rng()<.05?1:0);
        for (let oy=-r;oy<=r;oy++) for (let ox=-r;ox<=r;ox++) {
          if (ox*ox+oy*oy<=r*r+1 && y+oy>this.surface[Math.max(0,Math.min(this.w-1,Math.floor(x+ox)))]+4) this.set(x+ox,y+oy,TILE.AIR);
        }
        if (x<4||x>this.w-5||y<18||y>this.h-5) break;
      }
    }
  }
  scatterOre(rng,tile,minDepth,maxY,minR,maxR) {
    const base=tile===TILE.COAL?270:tile===TILE.COPPER?190:tile===TILE.IRON?145:tile===TILE.CRYSTAL?72:105;
    const tries=Math.round(base*(this.w/LEGACY_WORLD_W));
    for (let n=0;n<tries;n++) {
      const x=4+Math.floor(rng()*(this.w-8));
      const sy=this.surface[x];
      const low=Math.min(this.h-5,sy+minDepth), high=Math.min(this.h-4,Math.max(low+1,maxY));
      const y=low+Math.floor(rng()*(high-low));
      const current=this.get(x,y);
      if (current===TILE.AIR||current===TILE.WOOD||current===TILE.RUIN) continue;
      const r=minR+Math.floor(rng()*(maxR-minR+1));
      for (let oy=-r;oy<=r;oy++) for (let ox=-r;ox<=r;ox++) {
        if (ox*ox+oy*oy>r*r+rng()*2) continue;
        const tx=x+ox,ty=y+oy,base=this.get(tx,ty);
        if ([TILE.STONE,TILE.BASALT,TILE.SANDSTONE,TILE.ICE,TILE.CLAY].includes(base)) this.set(tx,ty,tile);
      }
    }
  }
  placeTrees(rng) {
    for (let x=8;x<this.w-8;x+=2) {
      const b=this.biome(x); if (b.id!=='verdant'||rng()>.22) continue;
      const y=this.surface[x]; if (this.get(x,y)!==TILE.GRASS) continue;
      const h=4+Math.floor(rng()*4);
      for (let i=1;i<=h;i++) this.set(x,y-i,TILE.WOOD);
      const top=y-h;
      for (let oy=-2;oy<=2;oy++) for (let ox=-2;ox<=2;ox++) {
        if (Math.abs(ox)+Math.abs(oy)<=3 && this.get(x+ox,top+oy)===TILE.AIR) this.set(x+ox,top+oy,TILE.LEAF);
      }
    }
  }
  placeGlowMoss(rng) {
    const mossCount=Math.round(520*(this.w/LEGACY_WORLD_W));
    for (let n=0;n<mossCount;n++) {
      const x=3+Math.floor(rng()*(this.w-6)), y=52+Math.floor(rng()*(this.h-56));
      if (this.get(x,y)!==TILE.AIR) continue;
      if ([this.get(x,y+1),this.get(x-1,y),this.get(x+1,y)].some(t=>TILE_DEFS[t]&&TILE_DEFS[t].solid) && rng()<.72) this.set(x,y,TILE.GLOW_MOSS);
    }
  }
  placeRuins(rng) {
    for(let bandStart=0;bandStart<this.w;bandStart+=BIOME_BAND_W){
      const biome=biomeIndexAt(bandStart+1,this.w),minX=bandStart+18,maxX=Math.min(this.w-18,bandStart+BIOME_BAND_W-18);
      const count=1+(rng()<.35?1:0);
      for(let n=0;n<count;n++){
        const x=minX+Math.floor(rng()*Math.max(8,maxX-minX));
        const y=Math.min(this.h-18,this.surface[x]+24+Math.floor(rng()*42));
        const rw=8+Math.floor(rng()*8),rh=5+Math.floor(rng()*5);
        for(let yy=0;yy<rh;yy++)for(let xx=0;xx<rw;xx++){const edge=yy===0||yy===rh-1||xx===0||xx===rw-1;this.set(x+xx,y+yy,edge?TILE.RUIN:TILE.AIR);}
        const door=1+Math.floor(rng()*(rw-2));this.set(x+door,y+rh-1,TILE.AIR);this.set(x+door,y+rh-2,TILE.AIR);
        if(rng()<.7)this.set(x+Math.floor(rw/2),y+rh-2,TILE.TORCH);
        const chestX=x+Math.max(1,Math.min(rw-2,Math.floor(rw*.68))),chestY=y+rh-2;this.set(chestX,chestY,TILE.RELIC_CHEST);
        const traps=1+(rng()<.45?1:0);for(let t=0;t<traps;t++){const trapX=x+2+Math.floor(rng()*Math.max(1,rw-4)),trapY=y+rh-2;if(this.get(trapX,trapY)===TILE.AIR)this.set(trapX,trapY,TILE.RUIN_SPIKE);}
        const urns=1+Math.floor(rng()*3);for(let u=0;u<urns;u++){const urnX=x+1+Math.floor(rng()*Math.max(1,rw-2)),urnY=y+rh-2;if(this.get(urnX,urnY)===TILE.AIR&&Math.abs(urnX-chestX)>1)this.set(urnX,urnY,TILE.RUIN_URN);}
        this.ruins.push({x,y,w:rw,h:rh,biome,chestX,chestY});
      }
    }
  }
  clearSpawn(spawnX=Math.min(this.w-8,560)) {
    const x=spawnX,y=this.surface[x];
    for(let yy=y-5;yy<y;yy++)for(let xx=x-3;xx<=x+3;xx++)this.set(xx,yy,TILE.AIR);
    this.spawn={x:x+.5,y:y-1.1};
  }

}
