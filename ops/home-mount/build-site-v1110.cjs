'use strict';
const fs=require('fs');
const paths=process.argv.slice(2);
if(paths.length!==6)throw new Error('usage: node build-site-v1110.cjs HOME DUNGEON MOYU ABOUT PRIVACY CONTACT');
const [homePath,dungeonPath,moyuPath,aboutPath,privacyPath,contactPath]=paths;
const OLD='1.10.0',VERSION='1.11.0';
function upgrade(path){let s=fs.readFileSync(path,'utf8');s=s.replaceAll(`data-site-version="${OLD}"`,`data-site-version="${VERSION}"`).replaceAll('/assets/site-v1100/','/assets/site-v1110/').replaceAll('site-v1100','site-v1110').replaceAll(`site v${OLD}`,`site v${VERSION}`);return s;}
let home=upgrade(homePath);
home=home.replace('91hwl — 中式风格的独立浏览器游戏志。两款游戏打开即玩，下一作下一款开发中。','91hwl — 三款独立浏览器游戏打开即玩：百层地牢、办公室跑酷与三合一棋局。');
home=home.replace('这里有两款独立制作的浏览器游戏：Dungeon Echo 是百层地牢构筑，Clock Out Alive 是四分钟办公室跑酷。无需安装，也不用注册。','这里有三款独立制作的浏览器游戏：Dungeon Echo 是百层地牢构筑，Clock Out Alive 是四分钟办公室跑酷，方寸棋局把五子棋、中国象棋与围棋放进同一张桌。无需安装，也不用注册。');
home=home.replace('Independent browser games live here: a hundred-floor dungeon expedition and a four-minute office escape. No install, no account—and a third place is already waiting.','Three browser games live here: a hundred-floor dungeon expedition, a four-minute office escape, and Board Trio with Gomoku, Xiangqi and Go. No install, no account wall.');
home=home.replace('<span><span class="i18n-zh">2 款可玩</span><span class="i18n-en">2 PLAYABLE</span></span><span><span class="i18n-zh">下一款开发中</span><span class="i18n-en">1 IN THE WORKS</span></span>','<span><span class="i18n-zh">3 款可玩</span><span class="i18n-en">3 PLAYABLE</span></span><span><span class="i18n-zh">地牢 · 跑酷 · 棋类</span><span class="i18n-en">DUNGEON · RUNNER · BOARD</span></span>');
const boardHero='<a class="hero-game hero-game-board" href="https://play.91hwl.cn/board-games/" data-carry><span class="hero-board-grid" aria-hidden="true"></span><span><b>方寸棋局 · Board Trio</b><small><span class="zh">五子棋 · 中国象棋 · 围棋</span><span class="en">GOMOKU · XIANGQI · GO</span></small></span></a>';
if(!home.includes('hero-game-board'))home=home.replace('<div class="hero-showcase-foot">',boardHero+'<div class="hero-showcase-foot">');
home=home.replace('<span><span class="zh">两款游戏可玩</span><span class="en">2 games live</span></span><span><span class="zh">下一款开发中</span><span class="en">More in development</span></span>','<span><span class="zh">三款游戏可玩</span><span class="en">3 games live</span></span><span><span class="zh">第三款：方寸棋局</span><span class="en">NEW: BOARD TRIO</span></span>');
home=home.replace('想慢慢构筑，就选 Dungeon Echo；想快速来一局，就选 Clock Out Alive。也可以交给随机推荐。','想慢慢构筑，就选 Dungeon Echo；想快速来一局，就选 Clock Out Alive；想安静对弈，就选方寸棋局。也可以交给随机推荐。').replace('Choose Dungeon Echo for a longer build, Clock Out Alive for a quick run, or let us pick.','Choose Dungeon Echo for a longer build, Clock Out Alive for a quick run, Board Trio for a classic match, or let us pick.');
home=home.replace('<button type="button" data-game-choice="random">','<button type="button" data-game-choice="board">方寸棋局</button><button type="button" data-game-choice="random">');
home=home.replace('<span class="i18n-zh">两款游戏，现在就能玩。</span><span class="i18n-en">Two games now. One place reserved.</span>','<span class="i18n-zh">三款游戏，现在就能玩。</span><span class="i18n-en">Three games. Ready now.</span>');
home=home.replace('想慢慢构筑，可以下地牢；想快速来一局，可以从工位跑到下班。下一款游戏也在开发中。','想慢慢构筑，可以下地牢；想快速来一局，可以从工位跑到下班；想坐下来对弈，可以直接打开五子棋、中国象棋或围棋。').replace('Build carefully through a hundred floors, or jump straight into a four-minute escape. The next game will take its place here.','Build through a hundred floors, jump into a four-minute escape, or sit down for Gomoku, Xiangqi and Go.');
const boardCard='<article class="game-card game-card-board"><div class="game-media game-media-board"><span class="game-index">03 / v0.1.0</span><div class="board-preview" aria-hidden="true"></div></div><div class="game-copy"><div class="game-tags"><span class="tag">3 GAMES</span><span class="tag">LOCAL 2P</span><span class="tag">9 / 13 / 19 GO</span></div><h3>方寸棋局 · Board Trio</h3><p><span class="i18n-zh">五子棋、中国象棋与围棋共用一套轻量棋桌。本地双人、悔棋、重开，围棋支持提子、劫与终局计分。</span><span class="i18n-en">Gomoku, Xiangqi and Go share one lightweight board table with local two-player play, undo and restart.</span></p><div class="btns"><a class="btn primary" href="https://play.91hwl.cn/board-games/" data-carry><span class="i18n-zh">开始对弈</span><span class="i18n-en">Play now</span></a></div></div></article>';
home=home.replace(/<article class="coming-card"[\s\S]*?<\/article>/,boardCard);
home=home.replaceAll('下一款开发中','方寸棋局已上线');
fs.writeFileSync(homePath,home);
for(const p of [dungeonPath,moyuPath,privacyPath,contactPath])fs.writeFileSync(p,upgrade(p));
let about=upgrade(aboutPath).replaceAll('两款浏览器游戏','三款浏览器游戏').replaceAll('两款现有游戏','三款现有游戏').replaceAll('两款游戏','三款游戏').replace('Dungeon Echo 与 Clock Out Alive','Dungeon Echo、Clock Out Alive 与方寸棋局').replace('Dungeon Echo and Clock Out Alive','Dungeon Echo, Clock Out Alive and Board Trio');
fs.writeFileSync(aboutPath,about);
for(const p of paths){const s=fs.readFileSync(p,'utf8');if(!s.includes('data-site-version="1.11.0"')||!s.includes('site-v1110/style.css')||!s.includes('site-v1110/site.js'))throw new Error('v1.11 shared shell missing: '+p)}
if(!home.includes('hero-game-board')||!home.includes('game-card-board')||!home.includes('data-game-choice="board"')||!home.includes('https://play.91hwl.cn/board-games/')||home.includes('下一款开发中'))throw new Error('v1.11 Board Trio homepage integration missing');
console.log('site_v1110_build=PASS');
