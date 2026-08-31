'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const html=read('board-games/index.html');
const game=read('board-games/game.js');
const rules=read('board-games/rules.js');
const css=read('board-games/style.css');
const version=read('board-games/VERSION').trim();

assert(/^\d+\.\d+\.\d+$/.test(version),'Board Trio VERSION must be semantic');
assert(html.includes(`<meta name="version" content="${version}">`),'HTML version marker must match VERSION');
const cache=(html.match(/style\.css\?v=(\d+)/)||[])[1];
assert(cache&&html.includes(`rules.js?v=${cache}`)&&html.includes(`game.js?v=${cache}`),'Board Trio cache generation must be coherent');
assert(html.includes('id="confirmBtn"')&&html.includes('data-zh="落子" data-en="Play"'),'pointer-confirm placement contract missing');
assert(html.includes('id="resumeBtn"')&&html.includes('data-zh="继续下棋" data-en="Resume"'),'Go scoring resume action missing');
assert(html.includes('id="resignBtn"')&&html.includes('data-zh="认输" data-en="Resign"'),'resign action missing');
assert(html.includes('死子确认')&&html.includes('中国面积计分'),'Go scoring-phase copy missing');

assert(html.includes('id="startMatchBtn"')&&html.includes('id="clearDataBtn"'),'AI start / data-reset controls missing');
assert(html.includes('id="volumeRange"')&&html.includes('id="volumeValue"'),'music volume control missing');
assert(html.includes('id="goCaptureStats"')&&html.includes('id="goCaptureLayer"')&&html.includes('id="goCaptureText"'),'Go capture feedback surface missing');
assert(game.includes('function showGoCaptureFx(')&&game.includes('res.capturedStones'),'Go capture animation runtime missing');
assert(rules.includes('capturedStones.push'),'Go rule engine must expose removed-stone coordinates');
assert(game.includes('function startMatch()')&&game.includes('if(!matchStarted||!aiEnabled()'),'AI must not open before explicit match start');
assert(game.includes('function clearBoardData()'),'Board Trio runtime reset missing');
const ui=read('board-games/ui.js');
assert(ui.includes("startsWith('board-trio-')")&&ui.includes("board-trio-volume-v1"),'BoardUI scoped reset / volume persistence missing');

assert(game.includes('selectPlacement(x,y)')&&game.includes('function confirmPlacement()'),'v0.2.1 select-then-confirm placement must remain intact');
assert(game.includes('scoring=false')&&game.includes('dead=new Set()')&&game.includes("scoreApprover='b'"),'Go scoring state missing');
assert(game.includes("if(passes>=2){scoring=true;dead.clear();scoreApprover='b'"),'two passes must enter scoring instead of ending immediately');
assert(!game.includes('winner=`终局估算'),'legacy two-pass immediate winner path must stay retired');

assert(game.includes('function toggleDeadGroup(x,y)')&&game.includes('R.group(board,x,y).stones'),'dead-stone marking must operate on connected groups');
assert(game.includes('allDead=stones.every'),'dead group toggle/revival contract missing');
assert(game.includes('function scoringBoard()')&&game.includes('return R.goScore(scoringBoard())'),'scoring must use the board after agreed dead-stone removal');
assert(game.includes("if(scoreApprover==='b'){scoreApprover='w'"),'black scoring approval stage missing');
assert(game.includes('winner=s.winner')&&game.includes('resultNote=T(`终局 ${s.margin.toFixed(1)} 目'),'white confirmation must finalize scoring');
assert(game.includes('function resumeGo()')&&game.includes("T('已退出计分阶段，继续下棋'"),'resume-play path missing');
assert(game.includes('replaceTopSnapshot()'),'non-move scoring state must update current history node instead of inflating move count');

assert(rules.includes('repeatKeys=null')&&rules.includes("reason:'repeat'"),'whole-board repetition rule missing');
assert(game.includes('function goRepeatKeys()')&&game.includes('goRepeatKeys())'),'Go gameplay must feed prior whole-board positions into the rule engine');
assert(game.includes('全局同形：不能形成此前出现过的整盘局面'),'whole-board repetition feedback missing');

assert(game.includes('function armResign()')&&game.includes("resignBtn.textContent=T('确认认输'"),'guarded resign flow missing');
assert(game.includes("resultNote=loser+T('认输'")&&game.includes('winner=opponentWinner()'),'resignation must award the game to the opponent');
assert(game.includes('resignBtn.disabled=waitingStart||inReview||aiTurn||aiBusy||!!winner||scoring'),'resign must be unavailable before AI start, after game end or during Go scoring agreement');

assert(css.includes('.actions #confirmBtn:not(:disabled)'),'placement/scoring confirmation visual state missing');
assert(css.includes('.actions #resumeBtn:not(:disabled)'),'resume-play visual state missing');
assert(css.includes('.actions #resignBtn:not(:disabled)'),'resign visual state missing');
assert(game.includes(`dataset.gameVersion='${version}'`),'runtime version marker must match VERSION');

console.log('board_games_mechanics_v050=PASS');
