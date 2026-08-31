'use strict';
const fs=require('fs');
const paths=process.argv.slice(2);
if(paths.length!==6)throw new Error('usage: node build-site-v1111.cjs HOME DUNGEON MOYU ABOUT PRIVACY CONTACT');
const [homePath,...rest]=paths,OLD='1.11.0',VERSION='1.11.1';
function upgrade(path){
  let s=fs.readFileSync(path,'utf8');
  s=s.replaceAll(`data-site-version="${OLD}"`,`data-site-version="${VERSION}"`)
     .replaceAll(`site v${OLD}`,`site v${VERSION}`);
  return s;
}
let home=upgrade(homePath).replaceAll('v0.1.0','v0.1.1');
fs.writeFileSync(homePath,home);
for(const p of rest)fs.writeFileSync(p,upgrade(p));
for(const p of paths){
  const s=fs.readFileSync(p,'utf8');
  if(!s.includes('data-site-version="1.11.1"'))throw new Error('v1.11.1 site marker missing: '+p);
  if(!s.includes('site-v1110/style.css')||!s.includes('site-v1110/site.js'))throw new Error('v1.11 asset contract missing: '+p);
}
if(!home.includes('03 / v0.1.1')||!home.includes('方寸棋局 · Board Trio'))throw new Error('Board Trio v0.1.1 homepage marker missing');
console.log('site_v1111_build=PASS');
