'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const R=require('../board-games/rules.js');
const AI=require('../board-games/ai.js');
const levels=['easy','normal','hard'];

const version=read('board-games/VERSION').trim();
assert(/^\d+\.\d+\.\d+$/.test(version),'Board Trio VERSION must be semantic');
const html=read('board-games/index.html'),game=read('board-games/game.js'),worker=read('board-games/ai-worker.js'),source=read('board-games/ai.js');
const cache=(html.match(/style\.css\?v=(\d+)/)||[])[1];
assert(cache,'Board Trio cache generation missing');
assert(html.includes('id="opponentMode"')&&html.includes('id="difficulty"')&&html.includes('id="humanSeat"'),'AI match controls missing');
assert(html.includes('value="easy"')&&html.includes('value="normal"')&&html.includes('value="hard"'),'three difficulty levels missing');
assert(html.includes(`ai.js?v=${cache}`)&&html.includes(`game.js?v=${cache}`),'AI cache generation missing');
assert(game.includes(`new Worker('ai-worker.js?v=${cache}')`),'AI must run off the UI thread when workers are available');
assert(game.includes('function queueAI(')&&game.includes('function applyAiMove('),'AI turn coordinator missing');
assert(game.includes("mode==='xiangqi'")&&game.includes('repeatKeys:history.map'),'Xiangqi AI history context missing');
assert(source.includes('repeatLoss')&&source.includes('safeMoves'),'Xiangqi AI must avoid a known perpetual-check loss when alternatives exist');
assert(game.includes("opponent==='ai'")&&game.includes("humanSeat==='first'"),'opponent and side selection state missing');
assert(game.includes('已悔棋，回到你上次落子前'),'AI round undo feedback missing');
assert(worker.includes(`importScripts('rules.js?v=${cache}','ai.js?v=${cache}')`)&&worker.includes('self.postMessage'),'worker bridge missing');
assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|\/v1\/|api[-_.]/iu.test(source+worker),'local AI must not contain API/network calls');
assert.deepStrictEqual(Object.keys(AI.LEVELS),levels);

for(const level of levels){
  const block=R.gomokuBoard();
  for(let x=3;x<=6;x++)block[7][x]='b';
  block[7][2]='w';
  assert.deepStrictEqual(AI.gomoku(block,'w',level,{seed:7}),{x:7,y:7},'Gomoku must block an immediate five at '+level);

  const win=R.gomokuBoard();
  for(let x=3;x<=6;x++)win[5][x]='w';
  win[5][2]='b';
  assert.deepStrictEqual(AI.gomoku(win,'w',level,{seed:11}),{x:7,y:5},'Gomoku must take an immediate win at '+level);

  const initial=R.xiangqiBoard();
  const red=R.xiangqiMove(initial,4,6,4,5);
  const move=AI.xiangqi(red.board,'b',level,{seed:13});
  assert(move&&R.xiangqiMove(red.board,move.fx,move.fy,move.tx,move.ty),'Xiangqi AI produced an illegal move at '+level);

  const go=R.goBoard(9);
  go[4][4]='b';go[4][3]='w';go[3][4]='w';go[4][5]='w';
  const goMove=AI.go(go,'w',level,{seed:17});
  const result=goMove&&R.goPlay(go,goMove.x,goMove.y,'w');
  assert(result?.ok&&result.captured===1,'Go AI must finish a one-liberty capture at '+level);
}

const repeatBoard=R.goBoard(5);
repeatBoard[2][2]='b';
const ranked=AI.goRank(repeatBoard,'w');
assert(ranked.length>1);
const forbidden=ranked[0].result.key;
const repeatMove=AI.go(repeatBoard,'w','hard',{repeatKeys:[forbidden],seed:19});
if(repeatMove){
  const replay=R.goPlay(repeatBoard,repeatMove.x,repeatMove.y,'w',null,new Set([forbidden]));
  assert(replay.ok,'Go AI must respect whole-board repetition');
}

const hardStart=Date.now();
const hardMove=AI.xiangqi(R.xiangqiBoard(),'r','hard',{seed:23});
assert(hardMove&&Date.now()-hardStart<2500,'Hard Xiangqi must stay within its local search budget');
console.log('board_games_ai_v050=PASS');
