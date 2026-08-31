'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const html=read('board-games/index.html');
const game=read('board-games/game.js');
const css=read('board-games/style.css');
const version=read('board-games/VERSION').trim();

assert.strictEqual(version,'0.6.1','Board Trio semantic version must be 0.6.1');
assert(html.includes('<meta name="version" content="0.6.1">'),'HTML version marker missing');
assert(html.includes('style.css?v=061')&&html.includes('rules.js?v=061')&&html.includes('game.js?v=061'),'cache generation v050 incomplete');
assert(html.includes('id="timeControl"')&&html.includes('value="300"')&&html.includes('value="600"'),'time-control selector missing');
assert(html.includes('id="clockA"')&&html.includes('id="clockB"'),'dual clock surface missing');
assert(html.includes('id="recordList"')&&html.includes('id="reviewPrevBtn"')&&html.includes('id="reviewNextBtn"'),'record/review surface missing');
assert(html.includes('id="reviewLiveBtn"')&&html.includes('id="reviewBranchBtn"'),'review exit/branch actions missing');

assert(game.includes('clockLimit,clocks:{...clocks},recordLabel'),'clock and record data must live in canonical history snapshots');
assert(game.includes('function settleClock()')&&game.includes('clocks[turn]=Math.max'),'per-side countdown engine missing');
assert(game.includes("return clockLimit>0&&!winner&&!scoring&&reviewing===null"),'clock must pause during scoring, review and terminal states');
assert(game.includes("resultNote=loser+T('超时'")&&game.includes('winner=opponentWinner()'),'timeout loss result flow missing');
assert(game.includes("timeSelect.disabled=setupLocked||aiBusy"),'time control must lock after play begins');
assert(game.includes('setInterval(tickClocks,250)'),'bounded clock ticker missing');

assert(game.includes('function renderRecord()')&&game.includes('history[i].recordLabel'),'per-move record renderer missing');
assert(game.includes('function enterReview(index)')&&game.includes('function leaveReview('),'review navigation state missing');
assert(game.includes('history=history.slice(0,reviewing+1)'),'branch-from-review must truncate future history');
assert(game.includes("T('已从该手恢复实战，后续棋谱已截断'"),'branch-from-review feedback missing');
assert(game.includes('recordLabel=`${sideShort(mover)} ${coord(x,y)}`'),'Gomoku move record missing');
assert(game.includes('recordLabel=`${sideShort(movedColor)} ${glyph[moving.t]}'),'Xiangqi move record missing');
assert(game.includes("recordLabel=`${sideShort(mover)} ${coord(x,y)}${res.captured?T(\' · 提\',\' · capture \')+res.captured:\'\'}`"),'Go move/capture record missing');
assert(game.includes("recordLabel=`${sideShort(mover)} ${T(\'停一手\',\'Pass\')}`"),'Go pass record missing');
assert(game.includes('if(reviewing!==null)return;if(humanBlocked())'),'board input must be inert during review');

assert(css.includes('.matchbar')&&css.includes('.clock-pair')&&css.includes('.clock.active'),'clock presentation states missing');
assert(css.includes('.record-panel')&&css.includes('.record-list button.active'),'record/review presentation missing');
assert(game.includes("dataset.gameVersion='0.6.1'"),'runtime version marker missing');

console.log('board_games_record_clock_v050=PASS');
