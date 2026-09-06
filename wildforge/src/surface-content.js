const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const solidish=(world,TILE,x,y)=>world.get(x,y)!==TILE.AIR;

function flatEnough(world,x,radius=4){
  const base=world.surface[x];let min=base,max=base;
  for(let dx=-radius;dx<=radius;dx++){const y=world.surface[clamp(x+dx,0,world.w-1)];min=Math.min(min,y);max=Math.max(max,y);}
  return max-min<=3;
}

function clearPocket(world,TILE,x,y,w,h){
  for(let yy=y-h;yy<y;yy++)for(let xx=x-Math.floor(w/2);xx<=x+Math.floor(w/2);xx++)if(world.get(xx,yy)!==TILE.AIR)world.set(xx,yy,TILE.AIR);
}

function verdantWreck(world,rng,TILE,x,y){
  const width=5+Math.floor(rng()*4);clearPocket(world,TILE,x,y,width+2,5);
  for(let dx=-Math.floor(width/2);dx<=Math.floor(width/2);dx++)world.set(x+dx,y-1,TILE.PLANK);
  world.set(x-Math.floor(width/2),y-2,TILE.WOOD);world.set(x-Math.floor(width/2),y-3,TILE.WOOD);
  world.set(x+Math.floor(width/2),y-2,TILE.WOOD);
  if(rng()<.8)world.set(x,y-2,TILE.RUIN_URN);
  if(rng()<.55)world.set(x+1,y-3,TILE.TORCH);
  return 'verdant-wreck';
}

function verdantGrove(world,rng,TILE,x,y){
  const count=2+Math.floor(rng()*2);
  for(let i=0;i<count;i++){const tx=x-3+i*3,gy=world.surface[tx],h=3+Math.floor(rng()*3);for(let n=1;n<=h;n++)world.set(tx,gy-n,TILE.WOOD);for(let oy=-1;oy<=1;oy++)for(let ox=-2;ox<=2;ox++)if(Math.abs(ox)+Math.abs(oy)<3&&world.get(tx+ox,gy-h+oy)===TILE.AIR)world.set(tx+ox,gy-h+oy,TILE.LEAF);}
  return 'verdant-grove';
}function emberSpire(world,rng,TILE,x,y){
  const towers=[-2,0,2];for(const dx of towers){const gy=world.surface[x+dx],h=2+Math.floor(rng()*4);for(let n=1;n<=h;n++)world.set(x+dx,gy-n,n===h?TILE.RUIN:TILE.BASALT);}
  if(rng()<.7)world.set(x,y-1,TILE.RUIN_URN);
  return 'ember-spires';
}

function emberArch(world,rng,TILE,x,y){
  clearPocket(world,TILE,x,y,8,6);const left=x-3,right=x+3,height=3+Math.floor(rng()*2);
  for(let n=1;n<=height;n++){world.set(left,y-n,TILE.RUIN);world.set(right,y-n,TILE.RUIN);}
  for(let xx=left;xx<=right;xx++)world.set(xx,y-height,TILE.RUIN);
  world.set(x,y-1,TILE.RUIN_URN);if(rng()<.6)world.set(x+2,y-height+1,TILE.TORCH);
  return 'ember-arch';
}

function frostArch(world,rng,TILE,x,y){
  clearPocket(world,TILE,x,y,9,6);const left=x-3,right=x+3,height=3+Math.floor(rng()*2);
  for(let n=1;n<=height;n++){world.set(left,y-n,TILE.ICE);world.set(right,y-n,TILE.ICE);}
  for(let xx=left;xx<=right;xx++)if(xx!==x||rng()>.35)world.set(xx,y-height,TILE.ICE);
  if(rng()<.55)world.set(x,y-1,TILE.RUIN_URN);
  return 'frost-arch';
}

function frostCairn(world,rng,TILE,x,y){
  const h=3+Math.floor(rng()*3);for(let n=1;n<=h;n++){const half=Math.max(0,Math.floor((h-n)/2));for(let dx=-half;dx<=half;dx++)world.set(x+dx,y-n,n===h?TILE.CRYSTAL:TILE.STONE);}
  if(rng()<.5)world.set(x+2,y-1,TILE.TORCH);
  return 'frost-cairn';
}
export function decorateSurface(world,rng,{TILE,spawnX}){
  const sites=[];const margin=Math.max(28,Math.floor(world.w*.018));
  const cadence=72;let x=margin+Math.floor(rng()*28);
  while(x<world.w-margin){
    const sx=Math.floor(x);if(Math.abs(sx-spawnX)>22&&flatEnough(world,sx,5)){
      const biome=world.biome(sx),y=world.surface[sx];let kind='';
      if(biome.id==='verdant')kind=rng()<.56?verdantGrove(world,rng,TILE,sx,y):verdantWreck(world,rng,TILE,sx,y);
      else if(biome.id==='ember')kind=rng()<.54?emberSpire(world,rng,TILE,sx,y):emberArch(world,rng,TILE,sx,y);
      else kind=rng()<.56?frostArch(world,rng,TILE,sx,y):frostCairn(world,rng,TILE,sx,y);
      sites.push(Object.freeze({x:sx,y,biome:biome.id,kind}));
    }
    x+=cadence+Math.floor(rng()*58);
  }
  world.surfaceSites=sites;
  return sites;
}

function settlementHash(text=''){
  let h=2166136261>>>0;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function settlementRoll(seed,index){
  let a=settlementHash(`${seed}:settlement:${index}`)||0x9e3779b9;
  a^=a<<13;a^=a>>>17;a^=a<<5;
  return (a>>>0)/4294967296;
}
export function buildSettlements(world,seed='wildforge'){
  const sites=[],bandWidth=160;
  for(let bandStart=0,index=0;bandStart<world.w;bandStart+=bandWidth,index++){
    const bandEnd=Math.min(world.w-24,bandStart+136),base=bandStart+58+Math.floor(settlementRoll(seed,index)*44);
    let best=clamp(base,bandStart+24,bandEnd),bestScore=99;
    for(let dx=-18;dx<=18;dx+=3){const x=clamp(base+dx,bandStart+24,bandEnd),y=world.surface[x];let score=0;for(let q=-4;q<=4;q++)score=Math.max(score,Math.abs(world.surface[clamp(x+q,0,world.w-1)]-y));if(score<bestScore){best=x;bestScore=score;}if(score<=1)break;}
    const biome=world.biome(best),y=world.surface[best];
    sites.push(Object.freeze({id:`settlement-${index}-${biome.id}`,index,x:best+.5,y:y-.35,biome:biome.id,kind:'settlement'}));
  }
  return sites;
}

export function surfaceContentDensity(worldWidth){
  return Math.max(1,Math.round(worldWidth/100));
}