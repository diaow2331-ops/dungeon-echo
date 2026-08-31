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

assert.strictEqual(version,'0.3.0','Board Trio semantic version must be 0.3.0');
assert(html.includes('<meta name="version" content="0.3.0">'),'HTML version marker missing');
assert(html.includes('style.css?v=030')&&html.includes('rules.js?v=030')&&html.includes('game.js?v=030'),'cache generation v030 incomplete');
assert(html.includes('id="confirmBtn"')&&html.includes('>落子</button>'),'pointer-confirm placement contract missing');
assert(html.includes('id="resumeBtn"')&&html.includes('>继续下棋</button>'),'Go scoring resume action missing');
assert(html.includes('id="resignBtn"')&&html.includes('>认输</button>'),'resign action missing');
assert(html.includes('死子确认')&&html.includes('双方确认再按中国面积规则计分'),'Go scoring-phase copy missing');

assert(game.includes('selectPlacement(x,y)')&&game.includes('function confirmPlacement()'),'v0.2.1 select-then-confirm placement must remain intact');
assert(game.includes('scoring=false')&&game.includes('dead=new Set()')&&game.includes("scoreApprover='b'"),'Go scoring state missing');
assert(game.includes("if(passes>=2){scoring=true;dead.clear();scoreApprover='b'"),'two passes must enter scoring instead of ending immediately');
assert(!game.includes('winner=`终局估算'),'legacy two-pass immediate winner path must stay retired');

assert(game.includes('function toggleDeadGroup(x,y)')&&game.includes('R.group(board,x,y).stones'),'dead-stone marking must operate on connected groups');
assert(game.includes('allDead=stones.every'),'dead group toggle/revival contract missing');
assert(game.includes('function scoringBoard()')&&game.includes('return R.goScore(scoringBoard())'),'scoring must use the board after agreed dead-stone removal');
assert(game.includes("if(scoreApprover==='b'){scoreApprover='w'"),'black scoring approval stage missing');
assert(game.includes('winner=s.winner')&&game.includes('resultNote=`终局 ${s.margin.toFixed(1)} 目'),'white confirmation must finalize scoring');
assert(game.includes('function resumeGo()')&&game.includes("showNotice('已退出计分阶段，继续下棋'"),'resume-play path missing');
assert(game.includes('replaceTopSnapshot()'),'non-move scoring state must update current history node instead of inflating move count');

assert(rules.includes('repeatKeys=null')&&rules.includes("reason:'repeat'"),'whole-board repetition rule missing');
assert(game.includes('function goRepeatKeys()')&&game.includes('goRepeatKeys())'),'Go gameplay must feed prior whole-board positions into the rule engine');
assert(game.includes('全局同形：不能形成此前出现过的整盘局面'),'whole-board repetition feedback missing');

assert(game.includes('function armResign()')&&game.includes("resignBtn.textContent='确认认输'"),'guarded resign flow missing');
assert(game.includes("resultNote=loser+'认输'")&&game.includes('winner=opponentWinner()'),'resignation must award the game to the opponent');
assert(game.includes('resignBtn.disabled=!!winner||scoring'),'resign must be unavailable after game end or during Go scoring agreement');

assert(css.includes('.actions #confirmBtn:not(:disabled)'),'placement/scoring confirmation visual state missing');
assert(css.includes('.actions #resumeBtn:not(:disabled)'),'resume-play visual state missing');
assert(css.includes('.actions #resignBtn:not(:disabled)'),'resign visual state missing');
assert(game.includes("dataset.gameVersion='0.3.0'"),'runtime version marker missing');

console.log('board_games_mechanics_v030=PASS');
