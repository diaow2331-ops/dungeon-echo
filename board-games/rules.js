(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BoardRules=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clone=b=>b.map(r=>r.map(v=>v&&typeof v==='object'?{...v}:v));
const empty=(h,w)=>Array.from({length:h},()=>Array(w).fill(null));
const inside=(b,x,y)=>y>=0&&y<b.length&&x>=0&&x<b[0].length;

function gomokuBoard(size=15){return empty(size,size)}
function gomokuWin(board,x,y,color){
  const dirs=[[1,0],[0,1],[1,1],[1,-1]];
  return dirs.some(([dx,dy])=>{let n=1;for(const s of [-1,1]){let xx=x+dx*s,yy=y+dy*s;while(inside(board,xx,yy)&&board[yy][xx]===color){n++;xx+=dx*s;yy+=dy*s}}return n>=5});
}
function gomokuFull(board){return board.every(row=>row.every(Boolean))}

const X={R:'车',N:'马',B:'相',A:'仕',K:'帅',C:'炮',P:'兵',r:'车',n:'马',b:'象',a:'士',k:'将',c:'炮',p:'卒'};
function xiangqiBoard(){
  const b=empty(10,9), put=(x,y,c,t)=>b[y][x]={c,t};
  ['R','N','B','A','K','A','B','N','R'].forEach((t,x)=>put(x,9,'r',t));
  put(1,7,'r','C');put(7,7,'r','C');[0,2,4,6,8].forEach(x=>put(x,6,'r','P'));
  ['R','N','B','A','K','A','B','N','R'].forEach((t,x)=>put(x,0,'b',t.toLowerCase()));
  put(1,2,'b','c');put(7,2,'b','c');[0,2,4,6,8].forEach(x=>put(x,3,'b','p'));
  return b;
}
function palace(c,x,y){return x>=3&&x<=5&&(c==='r'?y>=7&&y<=9:y>=0&&y<=2)}
function clearLine(b,x1,y1,x2,y2){let n=0;if(x1===x2){for(let y=Math.min(y1,y2)+1;y<Math.max(y1,y2);y++)if(b[y][x1])n++}else if(y1===y2){for(let x=Math.min(x1,x2)+1;x<Math.max(x1,x2);x++)if(b[y1][x])n++}else return -1;return n}
function rawXiangqiMove(b,fx,fy,tx,ty){
  if(!inside(b,fx,fy)||!inside(b,tx,ty)||(fx===tx&&fy===ty))return false;
  const p=b[fy][fx],q=b[ty][tx];if(!p||(q&&q.c===p.c))return false;
  const dx=tx-fx,dy=ty-fy,ax=Math.abs(dx),ay=Math.abs(dy),t=p.t.toUpperCase();
  if(t==='R')return (fx===tx||fy===ty)&&clearLine(b,fx,fy,tx,ty)===0;
  if(t==='C'){if(!(fx===tx||fy===ty))return false;const n=clearLine(b,fx,fy,tx,ty);return q?n===1:n===0}
  if(t==='N'){if(!((ax===1&&ay===2)||(ax===2&&ay===1)))return false;const lx=fx+(ax===2?Math.sign(dx):0),ly=fy+(ay===2?Math.sign(dy):0);return !b[ly][lx]}
  if(t==='B'){if(ax!==2||ay!==2)return false;if(p.c==='r'&&ty<5)return false;if(p.c==='b'&&ty>4)return false;return !b[fy+dy/2][fx+dx/2]}
  if(t==='A')return ax===1&&ay===1&&palace(p.c,tx,ty);
  if(t==='K'){
    if(q&&q.t.toUpperCase()==='K'&&fx===tx&&clearLine(b,fx,fy,tx,ty)===0)return true;
    return ax+ay===1&&palace(p.c,tx,ty);
  }
  if(t==='P'){
    if(p.c==='r'){if(dy===-1&&dx===0)return true;return fy<=4&&dy===0&&ax===1}
    if(dy===1&&dx===0)return true;return fy>=5&&dy===0&&ax===1;
  }
  return false;
}
function findKing(b,c){for(let y=0;y<10;y++)for(let x=0;x<9;x++){const p=b[y][x];if(p&&p.c===c&&p.t.toUpperCase()==='K')return{x,y}}return null}
function xiangqiInCheck(b,c){const k=findKing(b,c);if(!k)return true;const enemy=c==='r'?'b':'r';for(let y=0;y<10;y++)for(let x=0;x<9;x++){const p=b[y][x];if(p&&p.c===enemy&&rawXiangqiMove(b,x,y,k.x,k.y))return true}return false}
function xiangqiMove(b,fx,fy,tx,ty){
  const p=b[fy]&&b[fy][fx];if(!p||!rawXiangqiMove(b,fx,fy,tx,ty))return null;
  const next=clone(b),captured=next[ty][tx];next[ty][tx]=next[fy][fx];next[fy][fx]=null;
  if(xiangqiInCheck(next,p.c))return null;
  return{board:next,captured};
}
function xiangqiTargets(b,x,y){const p=b[y]&&b[y][x],out=[];if(!p)return out;for(let yy=0;yy<10;yy++)for(let xx=0;xx<9;xx++)if(xiangqiMove(b,x,y,xx,yy))out.push({x:xx,y:yy});return out}
function xiangqiHasMove(b,c){for(let y=0;y<10;y++)for(let x=0;x<9;x++){const p=b[y][x];if(p&&p.c===c&&xiangqiTargets(b,x,y).length)return true}return false}
function xiangqiTerminal(b,c){if(xiangqiHasMove(b,c))return null;return xiangqiInCheck(b,c)?'checkmate':'stalemate'}
function xiangqiKey(b,turn=''){return b.map(row=>row.map(p=>p?(p.c+':'+p.t):'..').join(',')).join('/')+'|'+turn}

function goBoard(size=19){return empty(size,size)}
function neighbors(b,x,y){return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([xx,yy])=>inside(b,xx,yy))}
function group(b,x,y){const color=b[y][x];if(!color)return{stones:[],libs:new Set};const todo=[[x,y]],seen=new Set,stones=[],libs=new Set;while(todo.length){const [cx,cy]=todo.pop(),key=cx+','+cy;if(seen.has(key))continue;seen.add(key);stones.push([cx,cy]);for(const [nx,ny] of neighbors(b,cx,cy)){if(!b[ny][nx])libs.add(nx+','+ny);else if(b[ny][nx]===color&&!seen.has(nx+','+ny))todo.push([nx,ny])}}return{stones,libs}}
function boardKey(b){return b.map(r=>r.map(v=>v||'.').join('')).join('/')}
function goPlay(b,x,y,color,koKey=null,repeatKeys=null){
  if(!inside(b,x,y)||b[y][x])return{ok:false,reason:'occupied'};
  const next=clone(b),opp=color==='b'?'w':'b';next[y][x]=color;let captured=0;
  for(const [nx,ny] of neighbors(next,x,y)){if(next[ny][nx]!==opp)continue;const g=group(next,nx,ny);if(g.libs.size===0){for(const [sx,sy] of g.stones)next[sy][sx]=null;captured+=g.stones.length}}
  if(group(next,x,y).libs.size===0)return{ok:false,reason:'suicide'};
  const key=boardKey(next);if(koKey&&key===koKey)return{ok:false,reason:'ko'};
  if(repeatKeys){const repeated=typeof repeatKeys.has==='function'?repeatKeys.has(key):Array.isArray(repeatKeys)&&repeatKeys.includes(key);if(repeated)return{ok:false,reason:'repeat'}}
  return{ok:true,board:next,captured,key};
}
function goScore(b,komi=7.5){
  let black=0,white=komi;const seen=new Set;
  for(let y=0;y<b.length;y++)for(let x=0;x<b.length;x++){
    const v=b[y][x];if(v==='b'){black++;continue}if(v==='w'){white++;continue}
    const start=x+','+y;if(seen.has(start))continue;const todo=[[x,y]],region=[],border=new Set;while(todo.length){const [cx,cy]=todo.pop(),k=cx+','+cy;if(seen.has(k))continue;seen.add(k);region.push([cx,cy]);for(const[nx,ny]of neighbors(b,cx,cy)){const nv=b[ny][nx];if(!nv&&!seen.has(nx+','+ny))todo.push([nx,ny]);else if(nv)border.add(nv)}}if(border.size===1){if(border.has('b'))black+=region.length;else white+=region.length}
  }
  return{black,white,winner:black>white?'b':'w',margin:Math.abs(black-white)};
}
return{X,clone,gomokuBoard,gomokuWin,gomokuFull,xiangqiBoard,xiangqiMove,xiangqiTargets,xiangqiInCheck,xiangqiHasMove,xiangqiTerminal,xiangqiKey,goBoard,goPlay,goScore,boardKey,group};
});
