(function(root,factory){
  const rules=typeof module==='object'&&module.exports?require('./rules.js'):root.BoardRules;
  const api=factory(rules);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BoardAI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(R){
'use strict';

const LEVELS=Object.freeze({
  easy:Object.freeze({label:'入门',xiangqiDepth:1,xiangqiMs:70,goReplies:0}),
  normal:Object.freeze({label:'标准',xiangqiDepth:2,xiangqiMs:280,goReplies:0}),
  hard:Object.freeze({label:'困难',xiangqiDepth:3,xiangqiMs:900,goReplies:10}),
});
const other=color=>color==='b'?'w':color==='w'?'b':color==='r'?'b':'r';
const levelOf=value=>Object.prototype.hasOwnProperty.call(LEVELS,value)?value:'normal';
function randomFor(options={}){
  if(typeof options.random==='function')return options.random;
  if(!Number.isFinite(options.seed))return Math.random;
  let state=(Number(options.seed)>>>0)||0x9e3779b9;
  return()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
}
function pickRanked(items,level,random,{easyPool=10,normalPool=2}={}){
  if(!items.length)return null;
  if(level==='hard')return items[0];
  const pool=Math.min(items.length,level==='easy'?easyPool:normalPool);
  if(pool===1)return items[0];
  if(level==='normal'&&random()<.78)return items[0];
  return items[Math.min(pool-1,Math.floor(random()*pool))];
}

const gomokuDirs=[[1,0],[0,1],[1,1],[1,-1]],GOMOKU_WIN=1e9;
function gomokuShape(board,x,y,color){
  board[y][x]=color;
  let score=0,strong=0;
  for(const[dx,dy]of gomokuDirs){
    let count=1,open=0;
    for(const sign of[-1,1]){
      let xx=x+dx*sign,yy=y+dy*sign;
      while(board[yy]?.[xx]===color){count++;xx+=dx*sign;yy+=dy*sign}
      if(board[yy]?.[xx]===null)open++;
    }
    if(count>=5){board[y][x]=null;return GOMOKU_WIN}
    if(count===4&&open)strong++;
    if(count===3&&open===2)strong++;
    const values=count===4?[0,56000,210000]:count===3?[0,4200,14500]:count===2?[0,420,1250]:count===1?[0,22,54]:[0,0,0];
    score+=values[open]||0;
  }
  board[y][x]=null;
  return score+(strong>=2?82000:0);
}
function gomokuPoints(board){
  const n=board.length,stones=[];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(board[y][x])stones.push([x,y]);
  if(!stones.length){const c=Math.floor(n/2);return[{x:c,y:c}]}
  const seen=new Set(),out=[];
  for(const[sx,sy]of stones)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    const x=sx+dx,y=sy+dy,key=x+','+y;
    if(x<0||y<0||x>=n||y>=n||board[y][x]||seen.has(key))continue;
    seen.add(key);out.push({x,y});
  }
  return out;
}
function gomokuRank(board,color){
  const enemy=other(color),mid=(board.length-1)/2;
  return gomokuPoints(board).map(point=>{
    const attack=gomokuShape(board,point.x,point.y,color),defence=gomokuShape(board,point.x,point.y,enemy);
    const forced=attack>=GOMOKU_WIN?3:defence>=GOMOKU_WIN?2:0;
    const center=board.length-Math.abs(point.x-mid)-Math.abs(point.y-mid);
    return{...point,attack,defence,forced,score:forced*1e10+attack+defence*1.08+center*.7};
  }).sort((a,b)=>b.score-a.score||a.y-b.y||a.x-b.x);
}
function gomoku(board,color='w',level='normal',options={}){
  level=levelOf(level);const random=randomFor(options),ranked=gomokuRank(board,color);
  if(!ranked.length)return null;
  const forced=ranked.filter(move=>move.forced);
  if(forced.length){const best=forced[0];return{x:best.x,y:best.y}}
  if(level==='hard'){
    const enemy=other(color),deep=ranked.slice(0,14).map(move=>{
      board[move.y][move.x]=color;
      const replies=gomokuRank(board,enemy).slice(0,8);
      let value=move.score;
      if(replies.some(reply=>reply.attack>=GOMOKU_WIN))value-=5e10;
      else if(replies.length){
        const reply=replies[0];board[reply.y][reply.x]=enemy;
        const follow=gomokuRank(board,color)[0];board[reply.y][reply.x]=null;
        value-=reply.score*.82;value+=(follow?.score||0)*.32;
      }
      board[move.y][move.x]=null;
      return{...move,deep:value};
    }).sort((a,b)=>b.deep-a.deep||b.score-a.score);
    return{x:deep[0].x,y:deep[0].y};
  }
  const chosen=pickRanked(ranked,level,random,{easyPool:12,normalPool:3});
  return chosen?{x:chosen.x,y:chosen.y}:null;
}

const pieceValue={K:100000,R:950,C:500,N:430,B:220,A:220,P:120},XIANGQI_MATE=1e8;
function xiangqiEval(board,color){
  let score=0;
  for(let y=0;y<10;y++)for(let x=0;x<9;x++){
    const p=board[y][x];if(!p)continue;
    const type=p.t.toUpperCase();let value=pieceValue[type]||0;
    if(type==='P'){
      const crossed=p.c==='r'?y<=4:y>=5,advance=p.c==='r'?9-y:y;
      value+=advance*5+(crossed?70:0)+(crossed?(4-Math.abs(4-x))*8:0);
    }else if(type==='N')value+=(4-Math.abs(4-x))*7+(4.5-Math.abs(4.5-y))*3;
    else if(type==='R'||type==='C')value+=(4-Math.abs(4-x))*3;
    score+=(p.c===color?1:-1)*value;
  }
  if(R.xiangqiInCheck(board,color))score-=45;
  if(R.xiangqiInCheck(board,other(color)))score+=45;
  return score;
}
function xiangqiMoves(board,color,options={}){
  const moves=[];
  for(let y=0;y<10;y++)for(let x=0;x<9;x++){
    const moving=board[y][x];if(!moving||moving.c!==color)continue;
    for(const target of R.xiangqiTargets(board,x,y)){
      const result=R.xiangqiMove(board,x,y,target.x,target.y);if(!result)continue;
      let order=(pieceValue[result.captured?.t.toUpperCase()]||0)*12-(pieceValue[moving.t.toUpperCase()]||0),repeatLoss=false;
      if(result.captured?.t.toUpperCase()==='K')order+=XIANGQI_MATE;
      const checks=R.xiangqiInCheck(result.board,other(color));if(checks)order+=900;
      if(options.repeatKeys&&R.xiangqiKey){const key=R.xiangqiKey(result.board,other(color)),seen=options.repeatKeys.reduce((n,k)=>n+(k===key?1:0),0);repeatLoss=checks&&seen>=2;if(repeatLoss)order-=XIANGQI_MATE*2}
      moves.push({fx:x,fy:y,tx:target.x,ty:target.y,board:result.board,captured:result.captured,order,repeatLoss});
    }
  }
  moves.sort((a,b)=>b.order-a.order);
  return moves;
}
function xiangqiSearch(board,color,depth,alpha,beta,deadline,ply=0){
  if(Date.now()>=deadline||depth<=0)return xiangqiEval(board,color);
  const moves=xiangqiMoves(board,color);
  if(!moves.length)return-XIANGQI_MATE+ply;
  let best=-Infinity;
  for(const move of moves){
    const value=-xiangqiSearch(move.board,other(color),depth-1,-beta,-alpha,deadline,ply+1);
    if(value>best)best=value;if(value>alpha)alpha=value;if(alpha>=beta||Date.now()>=deadline)break;
  }
  return best;
}
function xiangqi(board,color='b',level='normal',options={}){
  level=levelOf(level);const cfg=LEVELS[level],random=randomFor(options),allMoves=xiangqiMoves(board,color,options),safeMoves=allMoves.filter(move=>!move.repeatLoss),moves=safeMoves.length?safeMoves:allMoves;
  if(!moves.length)return null;
  const immediate=moves.find(move=>move.captured?.t.toUpperCase()==='K'||R.xiangqiTerminal(move.board,other(color)));
  if(immediate)return{fx:immediate.fx,fy:immediate.fy,tx:immediate.tx,ty:immediate.ty};
  if(level==='easy'){
    const pool=moves.slice(0,Math.min(10,moves.length));
    const choice=pool[Math.floor(random()*pool.length)]||moves[0];
    return{fx:choice.fx,fy:choice.fy,tx:choice.tx,ty:choice.ty};
  }
  const deadline=Date.now()+cfg.xiangqiMs,ranked=[];
  for(const move of moves){
    const score=-xiangqiSearch(move.board,other(color),cfg.xiangqiDepth-1,-Infinity,Infinity,deadline,1);
    ranked.push({...move,score});if(Date.now()>=deadline&&ranked.length>=8)break;
  }
  ranked.sort((a,b)=>b.score-a.score||b.order-a.order);
  const choice=pickRanked(ranked,level,random,{normalPool:2});
  return choice?{fx:choice.fx,fy:choice.fy,tx:choice.tx,ty:choice.ty}:null;
}

function goStars(size){return size===19?[3,9,15]:size===13?[3,6,9]:[2,4,6]}
function goRepeatSet(value){return value instanceof Set?value:new Set(Array.isArray(value)?value:[])}
function goNeighbors(board,x,y){return[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([xx,yy])=>yy>=0&&yy<board.length&&xx>=0&&xx<board.length)}
function likelyOwnEye(board,x,y,color){
  const ns=goNeighbors(board,x,y);if(ns.length<3||ns.some(([xx,yy])=>board[yy][xx]!==color))return false;
  const diagonals=[[x-1,y-1],[x+1,y-1],[x-1,y+1],[x+1,y+1]].filter(([xx,yy])=>yy>=0&&yy<board.length&&xx>=0&&xx<board.length);
  return diagonals.filter(([xx,yy])=>board[yy][xx]===color).length>=Math.max(2,diagonals.length-1);
}
function goMoveScore(board,x,y,color,result,stones){
  const enemy=other(color),ns=goNeighbors(board,x,y),seenFriendly=new Set(),seenEnemy=new Set();
  let saved=0,atari=0,friendly=0,hostile=0,empty=0;
  for(const[nx,ny]of ns){
    const value=board[ny][nx];
    if(value===color){
      friendly++;const group=R.group(board,nx,ny),key=group.stones.map(([gx,gy])=>gx+','+gy).sort()[0];
      if(!seenFriendly.has(key)&&group.libs.size===1&&group.libs.has(x+','+y)){seenFriendly.add(key);saved+=group.stones.length}
    }else if(value===enemy){
      hostile++;const group=R.group(result.board,nx,ny);
      if(group.stones.length){const key=group.stones.map(([gx,gy])=>gx+','+gy).sort()[0];if(!seenEnemy.has(key)&&group.libs.size===1){seenEnemy.add(key);atari+=group.stones.length}}
    }else empty++;
  }
  const own=R.group(result.board,x,y),libs=own.libs.size,n=board.length,edge=Math.min(x,y,n-1-x,n-1-y);
  let score=result.captured*1800+saved*240+atari*85+libs*22+hostile*20+friendly*8+empty*3;
  if(libs===1&&!result.captured)score-=360;if(likelyOwnEye(board,x,y,color)&&!result.captured)score-=460;
  if(stones<n*.9){let distance=Infinity;for(const sy of goStars(n))for(const sx of goStars(n))distance=Math.min(distance,Math.abs(x-sx)+Math.abs(y-sy));score+=Math.max(0,62-distance*9)}
  if(edge===0)score-=38;else if(edge===1)score-=9;
  return score;
}
function goRank(board,color,options={}){
  const n=board.length,stones=board.flat().filter(Boolean).length,repeatKeys=goRepeatSet(options.repeatKeys),ranked=[];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    if(board[y][x])continue;
    const result=R.goPlay(board,x,y,color,options.koKey||null,repeatKeys);if(!result.ok)continue;
    ranked.push({x,y,result,score:goMoveScore(board,x,y,color,result,stones)});
  }
  ranked.sort((a,b)=>b.score-a.score||a.y-b.y||a.x-b.x);return ranked;
}
function go(board,color='w',level='normal',options={}){
  level=levelOf(level);const random=randomFor(options),ranked=goRank(board,color,options),stones=board.flat().filter(Boolean).length,fill=stones/(board.length*board.length);
  if(!ranked.length)return null;
  if(level==='hard'){
    const enemy=other(color),repeat=goRepeatSet(options.repeatKeys),deep=ranked.slice(0,LEVELS.hard.goReplies).map(move=>{
      const nextRepeat=new Set(repeat);nextRepeat.add(move.result.key);
      const reply=goRank(move.result.board,enemy,{repeatKeys:nextRepeat})[0];
      return{...move,deep:move.score-(reply?.score||0)*.62};
    }).sort((a,b)=>b.deep-a.deep||b.score-a.score);
    if(fill>.72&&deep[0].score<5&&deep[0].deep<0)return null;
    return{x:deep[0].x,y:deep[0].y};
  }
  if(fill>.78&&ranked[0].score<(level==='easy'?18:8))return null;
  const tactical=ranked[0].result.captured>0?ranked.filter(move=>move.result.captured===ranked[0].result.captured):ranked;
  const choice=pickRanked(tactical,level,random,{easyPool:14,normalPool:3});
  return choice?{x:choice.x,y:choice.y}:null;
}

function choose(game,board,color,level='normal',options={}){
  if(game==='gomoku')return gomoku(board,color,level,options);
  if(game==='xiangqi')return xiangqi(board,color,level,options);
  if(game==='go')return go(board,color,level,options);
  throw new Error('unknown board game: '+game);
}
return{LEVELS,choose,gomoku,xiangqi,go,xiangqiEval,xiangqiMoves,goRank};
});
