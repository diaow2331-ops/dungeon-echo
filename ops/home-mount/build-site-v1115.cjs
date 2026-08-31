'use strict';
const fs=require('fs');
const paths=process.argv.slice(2);
if(paths.length!==6)throw new Error('usage: node build-site-v1115.cjs HOME DUNGEON MOYU ABOUT PRIVACY CONTACT');
const [homePath,...rest]=paths,OLD='1.11.4',VERSION='1.11.5';
function upgrade(path){
  let s=fs.readFileSync(path,'utf8');
  if(!s.includes(`data-site-version="${OLD}"`))throw new Error(`site v${OLD} marker missing: ${path}`);
  return s.replaceAll(`data-site-version="${OLD}"`,`data-site-version="${VERSION}"`)
          .replaceAll(`site v${OLD}`,`site v${VERSION}`);
}
let home=upgrade(homePath);
const oldZh='五子棋、中国象棋与围棋共用一套轻量棋桌。五子棋与围棋先选落点、再确认落子；象棋保持选棋子后点目标位置，并支持悔棋与防误触重开。';
const newZh='五子棋、中国象棋与围棋共用一套轻量棋桌。围棋加入死子确认、双方计分确认与整盘重复局面校验；三种棋均支持悔棋、认输与防误触重开。';
const oldEn='Gomoku, Xiangqi and Go share one lightweight board table. Gomoku and Go use select-then-confirm placement, while Xiangqi keeps piece-then-destination play, with undo and guarded restart.';
const newEn='Gomoku, Xiangqi and Go share one lightweight board table. Go adds dead-group review, two-side score confirmation and whole-board repetition prevention; all three support undo, resignation and guarded restart.';
if(!home.includes('03 / v0.2.1'))throw new Error('Board Trio v0.2.1 homepage marker missing');
if(!home.includes(oldZh)||!home.includes(oldEn))throw new Error('Board Trio v0.2.1 release copy missing');
home=home.replaceAll('v0.2.1','v0.3.0').replace(oldZh,newZh).replace(oldEn,newEn);
fs.writeFileSync(homePath,home);
for(const p of rest)fs.writeFileSync(p,upgrade(p));
for(const p of paths){
  const s=fs.readFileSync(p,'utf8');
  if(!s.includes('data-site-version="1.11.5"'))throw new Error('v1.11.5 site marker missing: '+p);
  if(!s.includes('site-v1110/style.css')||!s.includes('site-v1110/site.js'))throw new Error('v1.11 asset contract missing: '+p);
}
if(!home.includes('03 / v0.3.0')||!home.includes(newZh)||!home.includes(newEn))throw new Error('Board Trio v0.3.0 homepage refresh missing');
console.log('site_v1115_board_v030=PASS');
