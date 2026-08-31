const assert=require('assert');
const R=require('../board-games/rules.js');
let g=R.gomokuBoard();
for(let x=3;x<=7;x++)g[5][x]='b';
assert(R.gomokuWin(g,5,5,'b'));
let x=R.xiangqiBoard();
assert(R.xiangqiMove(x,1,9,2,7));
let blocked=R.xiangqiBoard();
blocked[8][1]={c:'r',t:'P'};
assert.strictEqual(R.xiangqiMove(blocked,1,9,2,7),null);
let cannon=Array.from({length:10},()=>Array(9).fill(null));
cannon[9][4]={c:'r',t:'K'}; cannon[0][4]={c:'b',t:'k'}; cannon[5][4]={c:'r',t:'P'};
cannon[7][0]={c:'r',t:'C'}; cannon[5][0]={c:'r',t:'P'}; cannon[2][0]={c:'b',t:'R'};
assert(R.xiangqiMove(cannon,0,7,0,2));
let face=Array.from({length:10},()=>Array(9).fill(null));
face[9][4]={c:'r',t:'K'}; face[0][4]={c:'b',t:'k'}; face[5][4]={c:'r',t:'R'};
assert.strictEqual(R.xiangqiMove(face,4,5,3,5),null);
let stale=Array.from({length:10},()=>Array(9).fill(null));
stale[0][4]={c:'b',t:'k'}; stale[9][4]={c:'r',t:'K'}; stale[5][4]={c:'r',t:'P'};
stale[9][3]={c:'r',t:'R'}; stale[9][5]={c:'r',t:'R'}; stale[1][0]={c:'r',t:'R'};
assert.strictEqual(R.xiangqiInCheck(stale,'b'),false);
assert.strictEqual(R.xiangqiTerminal(stale,'b'),'stalemate');
const xqKeyRed=R.xiangqiKey(R.xiangqiBoard(),'r'),xqKeyBlack=R.xiangqiKey(R.xiangqiBoard(),'b');
assert.notStrictEqual(xqKeyRed,xqKeyBlack);
assert.strictEqual(xqKeyRed,R.xiangqiKey(R.xiangqiBoard(),'r'));
let full=R.gomokuBoard(3); full.forEach(row=>row.fill('b'));
assert.strictEqual(R.gomokuFull(full),true);
let b=R.goBoard(5);
b[1][1]='w'; b[0][1]='b'; b[1][0]='b'; b[2][1]='b';
let take=R.goPlay(b,2,1,'b');
assert(take.ok&&take.captured===1&&take.board[1][1]===null);
assert.deepStrictEqual(take.capturedStones,[{x:1,y:1,color:'w'}]);
let s=R.goBoard(3);
s[0][1]='w'; s[1][0]='w'; s[1][2]='w'; s[2][1]='w';
assert.strictEqual(R.goPlay(s,1,1,'b').reason,'suicide');
let score=R.goScore([['b','b',null],['b',null,'w'],[null,'w','w']],0);
assert(score.black>0&&score.white>0);
console.log('board_games_rules=PASS');
// Whole-board repetition guard: a legal candidate that recreates any earlier
// position must be rejected even when it is not the immediate simple-ko board.
let repeatBase=R.goBoard(3);
let repeatCandidate=R.goPlay(repeatBase,1,1,'b');
assert(repeatCandidate.ok);
let repeated=R.goPlay(repeatBase,1,1,'b',null,new Set([repeatCandidate.key]));
assert.strictEqual(repeated.ok,false);
assert.strictEqual(repeated.reason,'repeat');

// Group exposure is used by the scoring phase to mark connected dead stones
// as one unit rather than requiring stone-by-stone cleanup.
let grp=R.goBoard(4);
grp[1][1]='w'; grp[1][2]='w'; grp[2][2]='w';
const connected=R.group(grp,1,1);
assert.strictEqual(connected.stones.length,3);
assert(connected.libs.size>0);
