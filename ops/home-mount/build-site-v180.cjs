'use strict';
const fs=require('fs');
const paths=process.argv.slice(2);
if(paths.length!==6)throw new Error('usage: node build-site-v180.cjs HOME DUNGEON MOYU ABOUT PRIVACY CONTACT');
const [homePath,dungeonPath,moyuPath,aboutPath,privacyPath,contactPath]=paths;
const VERSION='1.8.0',OLD='1.7.0',asset='/assets/site-v180/';
const header='<header class="top"><a class="brand" href="/" data-carry aria-label="91hwl 首页"><span class="brand-seal" aria-hidden="true">九一</span><span class="brand-word">91hwl</span></a><button class="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-controls="siteNav"><span class="zh i18n-zh">目录</span><span class="en i18n-en">Menu</span><i aria-hidden="true">☰</i></button><div class="nav" id="siteNav"><div class="nav-links"><a href="/#games" data-carry><span class="zh i18n-zh">游艺</span><span class="en i18n-en">Games</span></a><a href="/about/" data-carry><span class="zh i18n-zh">站志</span><span class="en i18n-en">About</span></a><a href="/privacy/" data-carry><span class="zh i18n-zh">案卷</span><span class="en i18n-en">Privacy</span></a><a href="/contact/" data-carry><span class="zh i18n-zh">来函</span><span class="en i18n-en">Contact</span></a></div><div class="prefs"><div class="seg" aria-label="Language / 语言"><button data-lang-choice="zh">中文</button><button data-lang-choice="en">EN</button></div><button class="theme-toggle" id="themeToggle" type="button" aria-label="Theme">日</button></div></div></header>';
const swapArt=(html,replacement)=>html.replace(/<figure class="record-art">.*?<\/figure>/s,replacement);
function upgrade(path,bodyClass){
 let s=fs.readFileSync(path,'utf8');
 s=s.replaceAll('data-site-version="'+OLD+'"','data-site-version="'+VERSION+'"')
    .replaceAll('/assets/site-v170/style.css?v='+OLD,asset+'style.css?v='+VERSION)
    .replaceAll('/assets/site-v170/site.js?v='+OLD,asset+'site.js?v='+VERSION)
    .replaceAll('/assets/site-v170/wang-jian-landscape-1668.jpg',asset+'wang-jian-landscape-1668.jpg')
    .replaceAll('site v'+OLD,'site v'+VERSION)
    .replace(/<header class="top">.*?<\/header>/s,header);
 if(bodyClass&&!s.includes(bodyClass))s=s.replace(/<body class="([^"]*)"/,'<body class="$1 '+bodyClass+'"');
 fs.writeFileSync(path,s);return s;
}
let home=upgrade(homePath,'site-v180');
home=home.replace('class="office-media"','class="office-media game-media-moyu"');
home=home.replace('<section class="section draw-section"','<section class="section draw-section draw-v180"');
home=home.replace('<span class="draw-seal" data-draw-seal>壹</span>','<span class="draw-stick" aria-hidden="true"></span><span class="draw-seal" data-draw-seal>壹</span>');
home=home.replace(/<footer class="footer"><span>91hwl · site v1\.8\.0<\/span>/,'<footer class="footer folio-footer"><span><b>九一游艺录</b> · 卷一 · 2026 · site v1.8.0</span>');
fs.writeFileSync(homePath,home);
let dungeon=upgrade(dungeonPath,'site-v180');
let moyu=upgrade(moyuPath,'site-v180');
let about=upgrade(aboutPath,'site-v180 record-about');
let privacy=upgrade(privacyPath,'site-v180 record-privacy');
let contact=upgrade(contactPath,'site-v180 record-contact');
privacy=swapArt(privacy,'<aside class="record-emblem privacy-emblem" aria-label="隐私案卷"><span class="emblem-seal">私</span><div><small>PRIVACY / LOCAL FIRST</small><b><span class="zh">少取、明示、可选择。</span><span class="en">Collect less. Explain clearly. Keep choice.</span></b></div></aside>');
contact=swapArt(contact,'<aside class="record-letter" aria-label="联系渠道"><small>来函处 / CONTACT DESK</small><b>GitHub Security Policy</b><span><span class="zh">BUG · 建议 · 合作 · 隐私</span><span class="en">BUGS · IDEAS · COLLAB · PRIVACY</span></span><i aria-hidden="true">九一</i></aside>');
about=about.replace('<figure class="record-art">','<figure class="record-art about-art">');
for(const [p,s] of [[dungeonPath,dungeon],[moyuPath,moyu],[aboutPath,about],[privacyPath,privacy],[contactPath,contact]])fs.writeFileSync(p,s);
for(const p of paths){const s=fs.readFileSync(p,'utf8');if(!s.includes('data-site-version="1.8.0"')||!s.includes('site-v180/style.css')||!s.includes('site-v180/site.js')||!s.includes('id="navToggle"'))throw new Error('v1.8 shared shell missing: '+p)}
if(!fs.readFileSync(homePath,'utf8').includes('game-media-moyu'))throw new Error('v1.8 Moyu cover hook missing');
if(!fs.readFileSync(privacyPath,'utf8').includes('privacy-emblem'))throw new Error('v1.8 privacy identity missing');
if(!fs.readFileSync(contactPath,'utf8').includes('record-letter'))throw new Error('v1.8 contact identity missing');
console.log('site_v180_build=PASS');
