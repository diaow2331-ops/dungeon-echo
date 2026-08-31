(()=>{
'use strict';
const R=window.BoardRules,AI=window.BoardAI,canvas=document.getElementById('board'),ctx=canvas.getContext('2d'),playcard=document.querySelector('.playcard');
const statusEl=document.getElementById('status'),gameName=document.getElementById('gameName'),hint=document.getElementById('ruleHint'),moveCount=document.getElementById('moveCount'),noticeEl=document.getElementById('notice'),sessionHint=document.getElementById('sessionHint');
const restartBtn=document.getElementById('restartBtn'),undoBtn=document.getElementById('undoBtn'),confirmBtn=document.getElementById('confirmBtn'),resumeBtn=document.getElementById('resumeBtn'),resignBtn=document.getElementById('resignBtn'),passBtn=document.getElementById('passBtn'),sizeWrap=document.getElementById('goSizeWrap'),sizeSelect=document.getElementById('goSize'),soundBtn=document.getElementById('soundBtn');
const timeSelect=document.getElementById('timeControl'),clockA=document.getElementById('clockA'),clockB=document.getElementById('clockB'),clockALabel=document.getElementById('clockALabel'),clockBLabel=document.getElementById('clockBLabel'),clockATime=document.getElementById('clockATime'),clockBTime=document.getElementById('clockBTime');
const recordList=document.getElementById('recordList'),reviewLabel=document.getElementById('reviewLabel'),reviewPrevBtn=document.getElementById('reviewPrevBtn'),reviewNextBtn=document.getElementById('reviewNextBtn'),reviewLiveBtn=document.getElementById('reviewLiveBtn'),reviewBranchBtn=document.getElementById('reviewBranchBtn');
const opponentSelect=document.getElementById('opponentMode'),difficultySelect=document.getElementById('difficulty'),seatSelect=document.getElementById('humanSeat'),aiState=document.getElementById('aiState');
const names={gomoku:'五子棋',xiangqi:'中国象棋',go:'围棋'},sessions=Object.create(null),coordLetters='ABCDEFGHJKLMNOPQRST';
let mode='gomoku',board,turn='b',winner=null,resultNote='',selected=null,targets=[],history=[],last=null,passes=0,captures={b:0,w:0},cursor=null,pending=null,scoring=false,dead=new Set(),scoreApprover='b',activeKey='',audio=null,noticeTimer=0,restartArmed=false,restartTimer=0,resignArmed=false,resignTimer=0;
let recordLabel='',reviewing=null,clockLimit=0,clocks={b:0,w:0,r:0},clockStamp=performance.now();
let soundOn=readSoundPreference(),opponent=readMatchSetting('opponent','ai'),difficulty=readMatchSetting('difficulty','normal'),humanSeat=readMatchSetting('seat','first');
let aiBusy=false,aiTimer=0,aiWorker=null,aiRequest=0;

function readSoundPreference(){try{return localStorage.getItem('board-trio-sound-v1')!=='off'}catch{return true}}
function saveSoundPreference(){try{localStorage.setItem('board-trio-sound-v1',soundOn?'on':'off')}catch{}}
function readMatchSetting(key,fallback){try{return localStorage.getItem('board-trio-'+key+'-v1')||fallback}catch{return fallback}}
function saveMatchSettings(){try{localStorage.setItem('board-trio-opponent-v1',opponent);localStorage.setItem('board-trio-difficulty-v1',difficulty);localStorage.setItem('board-trio-seat-v1',humanSeat)}catch{}}
function firstColor(){return mode==='xiangqi'?'r':'b'}
function secondColor(){return mode==='xiangqi'?'b':'w'}
function humanColor(){return humanSeat==='first'?firstColor():secondColor()}
function aiColor(){return humanSeat==='first'?secondColor():firstColor()}
function aiEnabled(){return opponent==='ai'}
function aiOwns(side=turn){return aiEnabled()&&side===aiColor()}
function humanBlocked(){return aiBusy||(!scoring&&aiOwns())||(scoring&&aiEnabled()&&scoreApprover===aiColor())}
function humanSideName(){const color=humanColor();return mode==='xiangqi'?(color==='r'?'红方':'黑方'):(color==='b'?'黑方':'白方')}
function clickSound(freq=240,dur=.045){if(!soundOn)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+dur);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+dur)}catch{}}
function cancelAI(){
  clearTimeout(aiTimer);aiTimer=0;aiBusy=false;aiRequest++;
  if(aiWorker){aiWorker.terminate();aiWorker=null}
}
function aiOptions(){
  if(mode!=='go')return{};
  return{koKey:history.length>=2?R.boardKey(history[history.length-2].board):null,repeatKeys:[...goRepeatKeys()]};
}
function finishAI(message){
  if(!message||message.id!==aiRequest||!aiBusy)return;
  aiBusy=false;
  if(message.error){sync();showNotice('电脑本回合计算失败，请重试或切换难度','warn',2800);return}
  applyAiMove(message.move);
}
function fallbackAI(id,payload){
  if(id!==aiRequest||!aiBusy)return;
  try{finishAI({id,move:AI.choose(payload.game,payload.board,payload.color,payload.level,payload.options)})}
  catch(error){finishAI({id,error:String(error&&error.message||error)})}
}
function queueAI(delay=220){
  if(!aiEnabled()||winner||reviewing!==null)return;
  const scoringTurn=scoring&&scoreApprover===aiColor(),playingTurn=!scoring&&turn===aiColor();
  if((!scoringTurn&&!playingTurn)||aiBusy)return;
  aiBusy=true;const id=++aiRequest;sync();
  aiTimer=setTimeout(()=>{
    aiTimer=0;if(id!==aiRequest||!aiBusy)return;
    if(scoringTurn){aiBusy=false;confirmScore(true);return}
    const payload={game:mode,board:R.clone(board),color:turn,level:difficulty,options:aiOptions()};
    if(typeof Worker!=='function'){fallbackAI(id,payload);return}
    try{
      aiWorker=aiWorker||new Worker('ai-worker.js?v=050');
      aiWorker.onmessage=event=>finishAI(event.data);
      aiWorker.onerror=()=>{if(id!==aiRequest||!aiBusy)return;aiWorker.terminate();aiWorker=null;fallbackAI(id,payload)};
      aiWorker.postMessage({id,...payload});
    }catch{fallbackAI(id,payload)}
  },delay);
}
function applyAiMove(move){
  if(!aiEnabled()||winner||reviewing!==null||scoring||turn!==aiColor())return;
  if(!move){
    if(mode==='go')passGo(true);
    else{winner=humanColor();resultNote='电脑无合法着法';replaceTopSnapshot();sync();draw()}
    return;
  }
  if(mode==='gomoku')onGomoku(move.x,move.y,true);
  else if(mode==='xiangqi'){
    selected={x:move.fx,y:move.fy};targets=R.xiangqiTargets(board,move.fx,move.fy);
    onXiangqi(move.tx,move.ty,true);
  }else onGo(move.x,move.y,true);
}
function sessionKey(){const base=mode==='go'?`go:${sizeSelect.value}`:mode;return base+':'+opponent+(opponent==='ai'?':'+humanSeat:'')}
function saveSession(key=activeKey){if(!key||!board)return;if(reviewing===null){settleClock();replaceTopSnapshot()}sessions[key]={board,turn,winner,resultNote,selected,targets,history,last,passes,captures,cursor,scoring,dead:new Set(dead),scoreApprover,clockLimit,clocks:{...clocks},recordLabel}}
function loadSession(key){const s=sessions[key];if(!s)return false;board=s.board;turn=s.turn;winner=s.winner;resultNote=s.resultNote||'';selected=s.selected;targets=s.targets;history=s.history;last=s.last;passes=s.passes;captures=s.captures;cursor=s.cursor;pending=null;scoring=!!s.scoring;dead=new Set(s.dead||[]);scoreApprover=s.scoreApprover||'b';clockLimit=Number(s.clockLimit)||0;clocks={b:0,w:0,r:0,...s.clocks};recordLabel=s.recordLabel||'';reviewing=null;timeSelect.value=String(clockLimit);clockStamp=performance.now();return true}
function initClocks(limit){clockLimit=Number(limit)||0;clocks={b:clockLimit,w:clockLimit,r:clockLimit};clockStamp=performance.now()}
function freshBoard(){winner=null;resultNote='';selected=null;targets=[];history=[];last=null;passes=0;captures={b:0,w:0};cursor=null;pending=null;scoring=false;dead=new Set();scoreApprover='b';reviewing=null;recordLabel='';turn=mode==='xiangqi'?'r':'b';board=mode==='gomoku'?R.gomokuBoard():mode==='xiangqi'?R.xiangqiBoard():R.goBoard(+sizeSelect.value);initClocks(+timeSelect.value);snapshot()}
function reset(){cancelAI();freshBoard();cancelRestart();cancelResign();clearNotice();saveSession();sync();draw();queueAI()}
function stateSnapshot(){return{board:R.clone(board),turn,winner,resultNote,selected:selected&&{...selected},last:last&&{...last},passes,captures:{...captures},scoring,dead:[...dead],scoreApprover,clockLimit,clocks:{...clocks},recordLabel}}
function snapshot(){history.push(stateSnapshot())}
function replaceTopSnapshot(){if(history.length)history[history.length-1]=stateSnapshot()}
function applySnapshot(s){board=R.clone(s.board);turn=s.turn;winner=s.winner;resultNote=s.resultNote||'';selected=s.selected&&{...s.selected};last=s.last&&{...s.last};passes=s.passes;captures={...s.captures};scoring=!!s.scoring;dead=new Set(s.dead||[]);scoreApprover=s.scoreApprover||'b';clockLimit=Number(s.clockLimit)||0;clocks={b:0,w:0,r:0,...s.clocks};recordLabel=s.recordLabel||'';pending=null;targets=selected&&mode==='xiangqi'?R.xiangqiTargets(board,selected.x,selected.y):[];cursor=last?{...last}:cursor;timeSelect.value=String(clockLimit);clockStamp=performance.now()}
function restore(s){applySnapshot(s);sync();draw()}
function showNotice(text,tone='info',ms=1800){clearTimeout(noticeTimer);noticeEl.hidden=false;noticeEl.dataset.tone=tone;noticeEl.textContent=text;noticeTimer=setTimeout(clearNotice,ms)}
function clearNotice(){clearTimeout(noticeTimer);noticeEl.hidden=true;noticeEl.textContent=''}
function cancelRestart(){clearTimeout(restartTimer);restartArmed=false;restartBtn.classList.remove('armed');restartBtn.textContent='重开'}
function armRestart(){if(reviewing!==null)return;if(history.length<=1&&!pending&&!scoring){reset();return}if(restartArmed){reset();showNotice('已开始新局','ok');return}restartArmed=true;restartBtn.classList.add('armed');restartBtn.textContent='再点一次重开';showNotice('再次点击“重开”才会清空当前对局','warn',2200);restartTimer=setTimeout(cancelRestart,2200)}
function cancelResign(){clearTimeout(resignTimer);resignArmed=false;resignBtn.classList.remove('armed');resignBtn.textContent='认输'}
function currentSideName(){if(mode==='xiangqi')return turn==='r'?'红方':'黑方';return turn==='b'?'黑方':'白方'}
function opponentWinner(){if(mode==='xiangqi')return turn==='r'?'b':'r';return turn==='b'?'w':'b'}
function armResign(){if(winner||scoring||reviewing!==null||humanBlocked())return;if(resignArmed){if(!settleClock())return;const loser=currentSideName();winner=opponentWinner();resultNote=loser+'认输';pending=null;cancelResign();replaceTopSnapshot();showNotice(resultNote,'ok',2600);sync();draw();return}resignArmed=true;resignBtn.classList.add('armed');resignBtn.textContent='确认认输';showNotice('再次点击“认输”才会结束本局','warn',2200);resignTimer=setTimeout(cancelResign,2200)}
function clockRunning(){return clockLimit>0&&!winner&&!scoring&&reviewing===null}
function settleClock(){const now=performance.now(),dt=Math.max(0,(now-clockStamp)/1000);clockStamp=now;if(!clockRunning())return true;clocks[turn]=Math.max(0,(clocks[turn]??clockLimit)-dt);if(clocks[turn]<=0){clocks[turn]=0;handleTimeout();return false}return true}
function handleTimeout(){if(winner||scoring||reviewing!==null)return;const loser=currentSideName();winner=opponentWinner();resultNote=loser+'超时';pending=null;cancelResign();replaceTopSnapshot();showNotice(resultNote,'warn',3000);sync();draw()}
function formatClock(value){if(!clockLimit)return '∞';const s=Math.max(0,Math.ceil(value||0)),m=Math.floor(s/60),r=s%60;return String(m).padStart(2,'0')+':'+String(r).padStart(2,'0')}
function renderClocks(){const aKey=mode==='xiangqi'?'r':'b',bKey=mode==='xiangqi'?'b':'w';clockALabel.textContent=mode==='xiangqi'?'红方':'黑方';clockBLabel.textContent=mode==='xiangqi'?'黑方':'白方';clockATime.textContent=formatClock(clocks[aKey]);clockBTime.textContent=formatClock(clocks[bKey]);const running=clockRunning();clockA.classList.toggle('active',running&&turn===aKey);clockB.classList.toggle('active',running&&turn===bKey);clockA.classList.toggle('low',clockLimit>0&&clocks[aKey]<=30);clockB.classList.toggle('low',clockLimit>0&&clocks[bKey]<=30)}
function tickClocks(){settleClock();renderClocks()}
function scoringBoard(){const next=R.clone(board);for(const key of dead){const [x,y]=key.split(',').map(Number);if(next[y])next[y][x]=null}return next}
function scorePreview(){return R.goScore(scoringBoard())}
function goWinnerText(){if(!winner)return'';const side=winner==='b'?'黑方':'白方';return side+'胜'+(resultNote?' · '+resultNote:'')}
function syncUrl(){const url=new URL(location.href);url.searchParams.set('game',mode);if(mode==='go')url.searchParams.set('size',sizeSelect.value);else url.searchParams.delete('size');url.searchParams.set('opponent',opponent);if(opponent==='ai'){url.searchParams.set('difficulty',difficulty);url.searchParams.set('seat',humanSeat)}else{url.searchParams.delete('difficulty');url.searchParams.delete('seat')}window.history.replaceState(null,'',url)}
function sync(){
  const inReview=reviewing!==null,aiTurn=aiEnabled()&&((scoring&&scoreApprover===aiColor())||(!scoring&&turn===aiColor())),setupLocked=inReview||history.length>1||scoring||!!winner;
  gameName.textContent=names[mode];moveCount.textContent=Math.max(0,history.length-1)+' 手';
  sizeWrap.hidden=mode!=='go';passBtn.hidden=mode!=='go'||scoring||!!winner;resumeBtn.hidden=mode!=='go'||!scoring||!!winner;
  confirmBtn.hidden=mode==='xiangqi'||!!winner;confirmBtn.textContent=scoring?(scoreApprover==='b'?'黑方确认':'白方确认'):'落子';
  confirmBtn.disabled=inReview||aiTurn||aiBusy||!!winner||mode==='xiangqi'||(!scoring&&!pending);passBtn.disabled=inReview||aiTurn||aiBusy;resumeBtn.disabled=inReview||aiBusy;
  undoBtn.disabled=inReview||scoring||!!winner||(!aiBusy&&!pending&&history.length<=1);restartBtn.disabled=inReview||(history.length<=1&&!pending&&!scoring);resignBtn.disabled=inReview||aiTurn||aiBusy||!!winner||scoring;
  sizeSelect.disabled=setupLocked;timeSelect.disabled=setupLocked||aiBusy;opponentSelect.disabled=setupLocked||aiBusy;seatSelect.disabled=opponent!=='ai'||setupLocked||aiBusy;difficultySelect.disabled=opponent!=='ai'||inReview||aiBusy;
  if(mode==='gomoku'){hint.textContent='自由规则：先连成五子者胜。';statusEl.textContent=winner?(winner==='draw'?'和棋':(winner==='b'?'黑方胜':'白方胜')+(resultNote?' · '+resultNote:'')):(turn==='b'?'黑方落子':'白方落子');sessionHint.textContent='先选落点，再点“落子”确认'}
  if(mode==='xiangqi'){hint.textContent='基础完整规则：不能送将；支持将帅照面、将死与困毙。';statusEl.textContent=winner?(winner==='r'?'红方胜':'黑方胜')+(resultNote?' · '+resultNote:''):(turn==='r'?'红方':'黑方')+(R.xiangqiInCheck(board,turn)?' · 将军':'走棋');sessionHint.textContent='选棋子，再点目标位置'}
  if(mode==='go'){if(scoring&&!winner){const s=scorePreview();hint.textContent=`计分阶段：点棋子可标记/取消整组死子 · 当前估算 黑 ${s.black.toFixed(1)} / 白 ${s.white.toFixed(1)}`;statusEl.textContent=scoreApprover==='b'?'黑方确认计分':'白方确认计分';sessionHint.textContent='双方确认前可继续调整死子，或恢复下棋'}else{hint.textContent=`中国面积计分 · 贴目 7.5 · 黑提 ${captures.b} · 白提 ${captures.w} · 禁止重复整盘局面`;statusEl.textContent=winner?goWinnerText():(turn==='b'?'黑方落子':'白方落子');sessionHint.textContent='先选落点，再点“落子”确认'}}
  if(pending&&!winner&&!scoring&&mode!=='xiangqi')statusEl.textContent+=' · 待确认';
  if(aiBusy&&!winner){statusEl.textContent='电脑思考中…';sessionHint.textContent='本地计算进行中，页面仍可正常响应'}
  else if(aiTurn&&!winner)sessionHint.textContent='请等待电脑落子';
  if(inReview)statusEl.textContent=`复盘 · 第 ${reviewing}/${Math.max(0,history.length-1)} 手`;
  const levelLabel=AI.LEVELS[difficulty]?.label||'标准';
  aiState.textContent=opponent==='local'?'双人同屏':aiBusy?`电脑思考中 · ${levelLabel}`:`本地 AI · ${levelLabel} · 你执${humanSideName()}`;
  aiState.dataset.busy=String(aiBusy);playcard.dataset.aiTurn=String(aiTurn||aiBusy);
  soundBtn.textContent='声音 '+(soundOn?'开':'关');soundBtn.setAttribute('aria-pressed',String(soundOn));
  canvas.setAttribute('aria-label',inReview?`${names[mode]}复盘，第 ${reviewing} 手。`:scoring?'围棋计分阶段。点击棋子组标记死子，双方依次确认计分。':mode==='xiangqi'?`${names[mode]}棋盘。${statusEl.textContent}。选择己方棋子后选择目标位置。`:`${names[mode]}棋盘。${statusEl.textContent}。先选择落点，再确认落子。`);
  renderClocks();renderRecord();
}
function resize(){const wrap=canvas.parentElement,w=Math.max(240,Math.min(wrap.clientWidth-2,mode==='xiangqi'?720:820)),ratio=mode==='xiangqi'?10/9:1,cssH=Math.round(w*ratio);canvas.style.width=w+'px';canvas.style.height=cssH+'px';const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(cssH*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
function geom(){const w=parseFloat(canvas.style.width)||700,h=parseFloat(canvas.style.height)||700;if(mode==='xiangqi'){const m=Math.max(28,w*.065),sx=(w-2*m)/8,sy=(h-2*m)/9;return{w,h,m,sx,sy,nx:9,ny:10}}const n=board.length,m=Math.max(22,w*.05),s=(w-2*m)/(n-1);return{w,h,m,sx:s,sy:s,nx:n,ny:n}}
function paper(g){ctx.clearRect(0,0,g.w,g.h);const grad=ctx.createLinearGradient(0,0,g.w,g.h);grad.addColorStop(0,'#e6c57f');grad.addColorStop(1,'#c99f57');ctx.fillStyle=grad;ctx.fillRect(0,0,g.w,g.h);ctx.fillStyle='rgba(90,55,18,.05)';for(let i=0;i<18;i++)ctx.fillRect((i*83)%g.w,0,1,g.h)}
function drawGrid(g){ctx.strokeStyle='#5a3a1d';ctx.lineWidth=1.1;ctx.beginPath();for(let x=0;x<g.nx;x++){const px=g.m+x*g.sx;ctx.moveTo(px,g.m);ctx.lineTo(px,g.m+(g.ny-1)*g.sy)}for(let y=0;y<g.ny;y++){const py=g.m+y*g.sy;ctx.moveTo(g.m,py);ctx.lineTo(g.m+(g.nx-1)*g.sx,py)}ctx.stroke()}
function stone(x,y,color,g,r=.43,alpha=1){const px=g.m+x*g.sx,py=g.m+y*g.sy,rad=Math.min(g.sx,g.sy)*r,grad=ctx.createRadialGradient(px-rad*.35,py-rad*.35,rad*.1,px,py,rad);ctx.save();ctx.globalAlpha=alpha;if(color==='b'){grad.addColorStop(0,'#555');grad.addColorStop(.45,'#202020');grad.addColorStop(1,'#050505')}else{grad.addColorStop(0,'#fff');grad.addColorStop(.65,'#eee9dc');grad.addColorStop(1,'#bdb7aa')}ctx.fillStyle=grad;ctx.beginPath();ctx.arc(px,py,rad,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color==='b'?'#000':'#999';ctx.lineWidth=.8;ctx.stroke();ctx.restore()}
function markLast(g){if(!last)return;const px=g.m+last.x*g.sx,py=g.m+last.y*g.sy,rad=Math.max(3,Math.min(g.sx,g.sy)*.11);ctx.save();ctx.fillStyle=mode==='xiangqi'?'#1f6f54':'#b33124';ctx.beginPath();ctx.arc(px,py,rad,0,Math.PI*2);ctx.fill();ctx.restore()}
function drawCursor(g){if(!cursor||winner||reviewing!==null)return;const{x,y}=cursor;if(x<0||y<0||x>=g.nx||y>=g.ny)return;const px=g.m+x*g.sx,py=g.m+y*g.sy,rad=Math.max(8,Math.min(g.sx,g.sy)*.38);ctx.save();ctx.strokeStyle='rgba(27,91,70,.95)';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(px,py,rad,0,Math.PI*2);ctx.stroke();ctx.restore();if(mode!=='xiangqi'&&!scoring&&!pending&&!board[y][x])stone(x,y,turn,g,mode==='go'?.46:.43,.24)}
function drawPending(g){if(!pending||winner||scoring||reviewing!==null||mode==='xiangqi')return;const{x,y}=pending;if(board[y]&&board[y][x])return;const px=g.m+x*g.sx,py=g.m+y*g.sy,rad=Math.max(9,Math.min(g.sx,g.sy)*.43);stone(x,y,turn,g,mode==='go'?.46:.43,.62);ctx.save();ctx.strokeStyle='#1b5b46';ctx.lineWidth=2.5;ctx.setLineDash([]);ctx.beginPath();ctx.arc(px,py,rad,0,Math.PI*2);ctx.stroke();ctx.restore()}
function drawGomoku(g){drawGrid(g);const stars=[3,7,11];ctx.fillStyle='#51351d';for(const y of stars)for(const x of stars){ctx.beginPath();ctx.arc(g.m+x*g.sx,g.m+y*g.sy,2.4,0,Math.PI*2);ctx.fill()}for(let y=0;y<15;y++)for(let x=0;x<15;x++)if(board[y][x])stone(x,y,board[y][x],g);markLast(g);drawCursor(g);drawPending(g)}
function drawGo(g){
  drawGrid(g);
  const n=board.length,pts=n===19?[3,9,15]:n===13?[3,6,9]:[2,4,6];
  ctx.fillStyle='#51351d';
  for(const y of pts)for(const x of pts){ctx.beginPath();ctx.arc(g.m+x*g.sx,g.m+y*g.sy,Math.max(1.7,g.sx*.08),0,Math.PI*2);ctx.fill()}
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(board[y][x])stone(x,y,board[y][x],g,.46,dead.has(x+','+y)?.32:1);
  if((scoring||winner)&&dead.size){
    ctx.save();ctx.strokeStyle='#a12820';ctx.lineWidth=2;
    for(const key of dead){const[x,y]=key.split(',').map(Number),px=g.m+x*g.sx,py=g.m+y*g.sy,r=Math.max(5,g.sx*.18);ctx.beginPath();ctx.moveTo(px-r,py-r);ctx.lineTo(px+r,py+r);ctx.moveTo(px+r,py-r);ctx.lineTo(px-r,py+r);ctx.stroke()}
    ctx.restore();
  }
  if(!scoring)markLast(g);
  drawCursor(g);drawPending(g);
}
const glyph={R:'车',N:'马',B:'相',A:'仕',K:'帅',C:'炮',P:'兵',r:'车',n:'马',b:'象',a:'士',k:'将',c:'炮',p:'卒'};
function drawXiangqi(g){paper(g);ctx.strokeStyle='#56371d';ctx.lineWidth=1.25;for(let y=0;y<10;y++){const py=g.m+y*g.sy;ctx.beginPath();ctx.moveTo(g.m,py);ctx.lineTo(g.m+8*g.sx,py);ctx.stroke()}for(let x=0;x<9;x++){const px=g.m+x*g.sx;ctx.beginPath();ctx.moveTo(px,g.m);ctx.lineTo(px,g.m+4*g.sy);ctx.moveTo(px,g.m+5*g.sy);ctx.lineTo(px,g.m+9*g.sy);ctx.stroke()}ctx.beginPath();ctx.moveTo(g.m+3*g.sx,g.m);ctx.lineTo(g.m+5*g.sx,g.m+2*g.sy);ctx.moveTo(g.m+5*g.sx,g.m);ctx.lineTo(g.m+3*g.sx,g.m+2*g.sy);ctx.moveTo(g.m+3*g.sx,g.m+7*g.sy);ctx.lineTo(g.m+5*g.sx,g.m+9*g.sy);ctx.moveTo(g.m+5*g.sx,g.m+7*g.sy);ctx.lineTo(g.m+3*g.sx,g.m+9*g.sy);ctx.stroke();ctx.fillStyle='rgba(93,55,22,.78)';ctx.font=`${Math.max(15,g.sx*.28)}px "Noto Serif SC","Songti SC",serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('楚 河',g.m+2*g.sx,g.m+4.5*g.sy);ctx.fillText('汉 界',g.m+6*g.sx,g.m+4.5*g.sy);
  if(reviewing===null)for(const t of targets){const capture=!!board[t.y][t.x];ctx.fillStyle=capture?'rgba(151,50,38,.2)':'rgba(26,103,76,.25)';ctx.strokeStyle=capture?'rgba(151,50,38,.9)':'rgba(26,103,76,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(g.m+t.x*g.sx,g.m+t.y*g.sy,Math.min(g.sx,g.sy)*(capture?.29:.18),0,Math.PI*2);capture?ctx.stroke():ctx.fill()}
  for(let y=0;y<10;y++)for(let x=0;x<9;x++){const p=board[y][x];if(!p)continue;const px=g.m+x*g.sx,py=g.m+y*g.sy,rad=Math.min(g.sx,g.sy)*.39;ctx.fillStyle='#f5dfb2';ctx.beginPath();ctx.arc(px,py,rad,0,Math.PI*2);ctx.fill();ctx.lineWidth=selected&&reviewing===null&&selected.x===x&&selected.y===y?3:1.5;ctx.strokeStyle=p.c==='r'?'#a12820':'#30271e';ctx.stroke();ctx.fillStyle=p.c==='r'?'#a12820':'#30271e';ctx.font=`700 ${Math.max(17,rad*1.08)}px "Noto Serif SC","Songti SC",serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(glyph[p.t],px,py+1)}markLast(g);drawCursor(g)}
function draw(){if(!board)return;const g=geom();if(mode!=='xiangqi')paper(g);if(mode==='gomoku')drawGomoku(g);else if(mode==='xiangqi')drawXiangqi(g);else drawGo(g)}
function point(ev){const r=canvas.getBoundingClientRect(),g=geom(),mx=(ev.clientX-r.left)*(g.w/r.width),my=(ev.clientY-r.top)*(g.h/r.height),x=Math.round((mx-g.m)/g.sx),y=Math.round((my-g.m)/g.sy);return{x,y,g}}
function insidePoint(x,y){const g=geom();return x>=0&&y>=0&&x<g.nx&&y<g.ny}
function coord(x,y){return(coordLetters[x]||String(x+1))+(board.length-y)}
function onGomoku(x,y,fromAI=false){if((!fromAI&&humanBlocked())||winner||reviewing!==null||!insidePoint(x,y))return false;if(board[y][x]){showNotice('这里已经有棋子','warn');return false}if(!settleClock())return false;const mover=turn;board[y][x]=turn;last={x,y};cursor={x,y};recordLabel=`${mover==='b'?'黑':'白'} ${coord(x,y)}`;clickSound(turn==='b'?190:285);if(R.gomokuWin(board,x,y,turn)){winner=turn;showNotice((turn==='b'?'黑方':'白方')+'连成五子','ok',2600)}else if(R.gomokuFull(board)){winner='draw';showNotice('棋盘已满，本局和棋','ok',2600)}else turn=turn==='b'?'w':'b';snapshot();sync();draw();queueAI();return true}
function onXiangqi(x,y,fromAI=false){if((!fromAI&&humanBlocked())||winner||reviewing!==null||!insidePoint(x,y))return false;cursor={x,y};const p=board[y][x];if(!selected){if(p&&p.c===turn){selected={x,y};targets=R.xiangqiTargets(board,x,y);draw();return true}showNotice('请选择己方棋子','warn');draw();return false}if(p&&p.c===turn){selected={x,y};targets=R.xiangqiTargets(board,x,y);draw();return true}const fx=selected.x,fy=selected.y,moving=board[fy][fx],moved=R.xiangqiMove(board,fx,fy,x,y);if(!moved){showNotice('此走法不合法','warn');draw();return false}if(!settleClock())return false;const captured=moved.captured,movedColor=turn,enemy=turn==='r'?'b':'r';board=moved.board;last={x,y};recordLabel=`${movedColor==='r'?'红':'黑'} ${glyph[moving.t]} ${fx+1},${fy+1}→${x+1},${y+1}${captured?' ×'+glyph[captured.t]:''}`;clickSound(captured?150:230);selected=null;targets=[];if(captured&&captured.t.toUpperCase()==='K'){winner=movedColor;resultNote='将帅被吃';showNotice((movedColor==='r'?'红方':'黑方')+'获胜','ok',2600)}else{const terminal=R.xiangqiTerminal(board,enemy);if(terminal){winner=movedColor;resultNote=terminal==='stalemate'?'困毙':'将死';showNotice(resultNote+'，'+(movedColor==='r'?'红方':'黑方')+'胜','ok',2600)}else turn=enemy}snapshot();sync();draw();queueAI();return true}
function goRepeatKeys(){return new Set(history.map(s=>R.boardKey(s.board)))}
function goIssueText(reason){return reason==='ko'?'劫争：此处暂不可立即回提':reason==='repeat'?'全局同形：不能形成此前出现过的整盘局面':reason==='suicide'?'禁自杀：此处无气':'该点已有棋子'}
function onGo(x,y,fromAI=false){if((!fromAI&&humanBlocked())||winner||scoring||reviewing!==null||!insidePoint(x,y))return false;if(!settleClock())return false;cursor={x,y};const mover=turn,koKey=history.length>=2?R.boardKey(history[history.length-2].board):null,res=R.goPlay(board,x,y,turn,koKey,goRepeatKeys());if(!res.ok){showNotice(goIssueText(res.reason),'warn');clickSound(100,.07);draw();return false}board=res.board;captures[turn]+=res.captured;last={x,y};passes=0;recordLabel=`${mover==='b'?'黑':'白'} ${coord(x,y)}${res.captured?' · 提'+res.captured:''}`;clickSound(res.captured?155:245);if(res.captured)showNotice(`提子 ${res.captured} 枚`,'ok');turn=turn==='b'?'w':'b';snapshot();sync();draw();queueAI();return true}
function placementIssue(x,y){if(!insidePoint(x,y))return 'outside';if(board[y][x])return 'occupied';if(mode==='go'){const koKey=history.length>=2?R.boardKey(history[history.length-2].board):null,res=R.goPlay(board,x,y,turn,koKey,goRepeatKeys());if(!res.ok)return res.reason}return null}
function selectPlacement(x,y){if(humanBlocked()||winner||scoring||reviewing!==null||mode==='xiangqi')return false;cursor={x,y};const issue=placementIssue(x,y);if(issue){pending=null;sync();showNotice(goIssueText(issue),'warn');clickSound(100,.07);draw();return false}pending={x,y};sync();showNotice('已选择落点，点击“落子”确认','info',2400);draw();return true}
function confirmPlacement(){if(humanBlocked()||!pending||winner||scoring||reviewing!==null||mode==='xiangqi')return false;const{x,y}=pending;pending=null;return mode==='gomoku'?onGomoku(x,y):onGo(x,y)}
function toggleDeadGroup(x,y){if(humanBlocked()||mode!=='go'||!scoring||winner||reviewing!==null||!insidePoint(x,y)||!board[y][x])return false;const stones=R.group(board,x,y).stones,allDead=stones.every(([sx,sy])=>dead.has(sx+','+sy));for(const[sx,sy]of stones){const key=sx+','+sy;if(allDead)dead.delete(key);else dead.add(key)}scoreApprover='b';replaceTopSnapshot();sync();draw();showNotice(allDead?'已恢复该棋组为活棋':'已标记整组死子','info',1800);queueAI();return true}
function confirmScore(fromAI=false){if((!fromAI&&humanBlocked())||mode!=='go'||!scoring||winner||reviewing!==null)return false;if(scoreApprover==='b'){scoreApprover='w';replaceTopSnapshot();sync();showNotice('黑方已确认，请白方确认','ok',2200);queueAI();return true}const s=scorePreview();winner=s.winner;resultNote=`终局 ${s.margin.toFixed(1)} 目（黑 ${s.black.toFixed(1)} / 白 ${s.white.toFixed(1)}）`;scoring=false;replaceTopSnapshot();sync();draw();showNotice(goWinnerText(),'ok',3000);return true}
function resumeGo(){if(humanBlocked()||mode!=='go'||!scoring||winner||reviewing!==null)return;scoring=false;dead.clear();scoreApprover='b';passes=0;pending=null;replaceTopSnapshot();sync();draw();showNotice('已退出计分阶段，继续下棋','ok',2200);queueAI()}
function passGo(fromAI=false){if((!fromAI&&humanBlocked())||mode!=='go'||winner||scoring||reviewing!==null)return false;cancelRestart();cancelResign();if(!settleClock())return false;pending=null;const mover=turn;passes++;last=null;cursor=cursor||defaultCursor();recordLabel=`${mover==='b'?'黑':'白'} 停一手`;clickSound(330);turn=turn==='b'?'w':'b';if(passes>=2){scoring=true;dead.clear();scoreApprover='b';showNotice('双方连续停一手，进入死子确认与计分阶段','ok',2800)}else if(!fromAI)showNotice('已停一手；对方再停一手将进入计分阶段','info',2200);snapshot();sync();draw();queueAI();return true}
function confirmPrimary(){return scoring?confirmScore():confirmPlacement()}
function renderRecord(){const total=Math.max(0,history.length-1),inReview=reviewing!==null;reviewLabel.textContent=inReview?`复盘 · ${reviewing}/${total}`:`实战 · ${total} 手`;reviewPrevBtn.disabled=total===0||(inReview&&reviewing<=0);reviewNextBtn.disabled=!inReview||reviewing>=total;reviewLiveBtn.disabled=!inReview;const target=inReview?history[reviewing]:null;reviewBranchBtn.disabled=!inReview||reviewing>=total||!target||!!target.winner||!!target.scoring;recordList.replaceChildren();if(total===0){const li=document.createElement('li');li.className='record-empty';li.textContent='落子后生成逐手棋谱';recordList.append(li);return}for(let i=1;i<history.length;i++){const li=document.createElement('li'),btn=document.createElement('button');btn.type='button';btn.dataset.reviewIndex=String(i);btn.textContent=`${i}. ${history[i].recordLabel||'局面'}`;btn.classList.toggle('active',inReview&&i===reviewing);btn.classList.toggle('live',!inReview&&i===total);li.append(btn);recordList.append(li)}}
function enterReview(index){if(index<0||index>=history.length)return;cancelAI();if(reviewing===null){pending=null;settleClock();replaceTopSnapshot()}reviewing=index;applySnapshot(history[index]);reviewing=index;cancelRestart();cancelResign();clearNotice();sync();draw()}
function leaveReview(silent=false){if(reviewing===null)return;const live=history[history.length-1];reviewing=null;applySnapshot(live);reviewing=null;sync();draw();queueAI();if(!silent)showNotice('已回到当前实战局面','ok')}
function branchFromReview(){if(reviewing===null||reviewing>=history.length-1)return;const target=history[reviewing];if(target.winner||target.scoring)return;history=history.slice(0,reviewing+1);reviewing=null;applySnapshot(history[history.length-1]);reviewing=null;pending=null;cancelRestart();cancelResign();replaceTopSnapshot();saveSession();sync();draw();queueAI();showNotice('已从该手恢复实战，后续棋谱已截断','warn',2600)}
function previousReview(){const total=history.length-1;if(total<=0)return;enterReview(reviewing===null?Math.max(0,total-1):Math.max(0,reviewing-1))}
function nextReview(){if(reviewing===null)return;enterReview(Math.min(history.length-1,reviewing+1))}
function defaultCursor(){const g=geom();return{x:Math.floor((g.nx-1)/2),y:mode==='xiangqi'?6:Math.floor((g.ny-1)/2)}}
function undoMove(){
  cancelRestart();cancelResign();if(reviewing!==null||scoring||winner)return;
  if(pending){pending=null;sync();draw();showNotice('已取消待确认落点','ok');return}
  if(history.length<=1)return;
  settleClock();cancelAI();
  let steps=1;
  if(aiEnabled()&&turn===humanColor()){
    if(history.length===2&&humanSeat==='second'){showNotice('电脑刚落下开局棋，请先走一手再悔棋','info',2200);return}
    steps=2;
  }
  while(steps-->0&&history.length>1)history.pop();
  restore(history[history.length-1]);showNotice(aiEnabled()?'已悔棋，回到你上次落子前':'已悔棋','ok');queueAI();
}
function changeSetup(){
  if(opponentSelect.disabled||seatSelect.disabled&&opponentSelect.value===opponent)return;
  saveSession();cancelAI();cancelRestart();cancelResign();clearNotice();
  opponent=opponentSelect.value==='local'?'local':'ai';humanSeat=seatSelect.value==='second'?'second':'first';saveMatchSettings();
  activeKey=sessionKey();const restored=loadSession(activeKey);if(!restored)freshBoard();
  sync();resize();queueAI();showNotice(restored&&history.length>1?'已恢复对应对局':opponent==='ai'?'已切换为人机对弈':'已切换为双人同屏','ok',2200);
}
function switchGame(next){if(next===mode)return;if(reviewing!==null)leaveReview(true);saveSession();cancelAI();cancelRestart();cancelResign();clearNotice();pending=null;mode=next;activeKey=sessionKey();const restored=loadSession(activeKey);if(!restored)freshBoard();syncUrl();sync();resize();queueAI();showNotice(restored&&history.length>1?'已恢复这类棋的当前对局':'已切换至'+names[mode],'ok')}
canvas.addEventListener('pointerup',ev=>{if(reviewing!==null)return;if(humanBlocked()){showNotice('请等待电脑完成本回合','info');return}cancelResign();const{x,y}=point(ev);cursor={x,y};if(scoring)toggleDeadGroup(x,y);else if(mode==='xiangqi')onXiangqi(x,y);else selectPlacement(x,y)});
canvas.addEventListener('pointermove',ev=>{if(reviewing!==null||(ev.pointerType!=='mouse'&&ev.pointerType!=='pen'))return;const{x,y}=point(ev);if(!insidePoint(x,y))return;if(!cursor||cursor.x!==x||cursor.y!==y){cursor={x,y};draw()}});
canvas.addEventListener('pointerleave',ev=>{if(reviewing===null&&ev.pointerType==='mouse'&&document.activeElement!==canvas){cursor=null;draw()}});
canvas.addEventListener('focus',()=>{if(!cursor)cursor=last?{...last}:defaultCursor();draw()});
canvas.addEventListener('keydown',ev=>{if(reviewing!==null||humanBlocked()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(ev.key))return;ev.preventDefault();cancelResign();if(!cursor)cursor=last?{...last}:defaultCursor();const g=geom();if(ev.key==='ArrowLeft')cursor.x=Math.max(0,cursor.x-1);else if(ev.key==='ArrowRight')cursor.x=Math.min(g.nx-1,cursor.x+1);else if(ev.key==='ArrowUp')cursor.y=Math.max(0,cursor.y-1);else if(ev.key==='ArrowDown')cursor.y=Math.min(g.ny-1,cursor.y+1);else if(scoring)toggleDeadGroup(cursor.x,cursor.y);else if(mode==='xiangqi')onXiangqi(cursor.x,cursor.y);else if(pending&&pending.x===cursor.x&&pending.y===cursor.y)confirmPlacement();else selectPlacement(cursor.x,cursor.y);draw()});
document.querySelectorAll('[data-game]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-game]').forEach(b=>b.classList.toggle('active',b===btn));switchGame(btn.dataset.game)}));
confirmBtn.addEventListener('click',()=>{cancelResign();confirmPrimary()});
resumeBtn.addEventListener('click',()=>{cancelResign();resumeGo()});
resignBtn.addEventListener('click',armResign);
restartBtn.addEventListener('click',armRestart);
undoBtn.addEventListener('click',undoMove);
sizeSelect.addEventListener('change',()=>{if(mode!=='go'||sizeSelect.disabled)return;if(reviewing!==null)leaveReview(true);saveSession();cancelAI();cancelRestart();cancelResign();clearNotice();pending=null;activeKey=sessionKey();const restored=loadSession(activeKey);if(!restored)freshBoard();syncUrl();sync();resize();queueAI();showNotice(restored&&history.length>1?`已恢复 ${sizeSelect.value}×${sizeSelect.value} 对局`:`已切换为 ${sizeSelect.value}×${sizeSelect.value} 棋盘`,'ok')});
timeSelect.addEventListener('change',()=>{if(timeSelect.disabled)return;initClocks(+timeSelect.value);replaceTopSnapshot();saveSession();sync();showNotice(clockLimit?`本局棋钟：双方 ${Math.round(clockLimit/60)} 分钟`:'本局已设为不限时','ok',2000)});
passBtn.addEventListener('click',()=>passGo(false));
opponentSelect.addEventListener('change',()=>{changeSetup();syncUrl()});
seatSelect.addEventListener('change',()=>{changeSetup();syncUrl()});
difficultySelect.addEventListener('change',()=>{if(difficultySelect.disabled)return;difficulty=AI.LEVELS[difficultySelect.value]?difficultySelect.value:'normal';saveMatchSettings();syncUrl();sync();showNotice('电脑难度已切换为'+AI.LEVELS[difficulty].label,'ok',1800)});
soundBtn.addEventListener('click',()=>{soundOn=!soundOn;saveSoundPreference();sync();if(soundOn)clickSound();showNotice('声音已'+(soundOn?'开启':'关闭'),'ok')});
reviewPrevBtn.addEventListener('click',previousReview);reviewNextBtn.addEventListener('click',nextReview);reviewLiveBtn.addEventListener('click',()=>leaveReview());reviewBranchBtn.addEventListener('click',branchFromReview);
recordList.addEventListener('click',ev=>{const btn=ev.target.closest('button[data-review-index]');if(btn)enterReview(+btn.dataset.reviewIndex)});
window.addEventListener('resize',resize,{passive:true});

const qs=new URLSearchParams(location.search),requested=qs.get('game'),requestedSize=+qs.get('size'),requestedOpponent=qs.get('opponent'),requestedDifficulty=qs.get('difficulty'),requestedSeat=qs.get('seat');
if(names[requested])mode=requested;if([9,13,19].includes(requestedSize))sizeSelect.value=String(requestedSize);
if(['ai','local'].includes(requestedOpponent))opponent=requestedOpponent;if(AI.LEVELS[requestedDifficulty])difficulty=requestedDifficulty;if(['first','second'].includes(requestedSeat))humanSeat=requestedSeat;
if(!['ai','local'].includes(opponent))opponent='ai';if(!AI.LEVELS[difficulty])difficulty='normal';if(!['first','second'].includes(humanSeat))humanSeat='first';
opponentSelect.value=opponent;difficultySelect.value=difficulty;seatSelect.value=humanSeat;saveMatchSettings();activeKey=sessionKey();syncUrl();
document.querySelectorAll('[data-game]').forEach(b=>b.classList.toggle('active',b.dataset.game===mode));
canvas.tabIndex=0;reset();resize();setInterval(tickClocks,250);window.addEventListener('beforeunload',cancelAI);document.documentElement.dataset.gameVersion='0.5.0';
})();
