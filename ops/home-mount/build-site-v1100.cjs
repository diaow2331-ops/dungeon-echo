'use strict';
const fs=require('fs');
const paths=process.argv.slice(2);
if(paths.length!==6)throw new Error('usage: node build-site-v1100.cjs HOME DUNGEON MOYU ABOUT PRIVACY CONTACT');
const [homePath,dungeonPath,moyuPath,aboutPath,privacyPath,contactPath]=paths;
const VERSION='1.10.0',OLD='1.9.0',asset='/assets/site-v1100/';
function upgrade(path){let s=fs.readFileSync(path,'utf8');s=s.replaceAll(`data-site-version="${OLD}"`,`data-site-version="${VERSION}"`).replaceAll(`/assets/site-v190/style.css?v=${OLD}`,`${asset}style.css?v=${VERSION}`).replaceAll(`/assets/site-v190/site.js?v=${OLD}`,`${asset}site.js?v=${VERSION}`).replaceAll('/assets/site-v190/wang-jian-landscape-1668.jpg',asset+'wang-jian-landscape-1668.jpg').replaceAll('/assets/site-v190/dungeon-roster.webp',asset+'dungeon-roster.webp').replaceAll('/assets/site-v190/moyu-run-v1230.jpg',asset+'moyu-run-v1265.jpg').replaceAll(`site v${OLD}`,`site v${VERSION}`);s=s.replace(/<body([^>]*)class="([^"]*)"/,(_,a,c)=>{const set=new Set(c.split(/\s+/).filter(Boolean));set.add('site-v1100');return `<body${a}class="${[...set].join(' ')}"`});return s;}
let home=upgrade(homePath).replaceAll('v1.23.0','v1.26.5').replaceAll('四分钟 · 二段跳 · 两种结局','四分钟 · 高清四幕 · 全屏可读').replaceAll('4 MIN · DOUBLE JUMP · 2 ENDINGS','4 MIN · HD SCENES · READABLE UI');
if(!home.includes('ornament-divider'))home=home.replace(/<\/aside><\/section>\s*<section class="quick-pick"/,'</aside></section><div class="ornament-divider" aria-hidden="true"><span><i></i></span></div><section class="quick-pick"');
fs.writeFileSync(homePath,home);
const dungeon=upgrade(dungeonPath);fs.writeFileSync(dungeonPath,dungeon);
let moyu=upgrade(moyuPath).replaceAll('v1.23.0','v1.26.5').replace('"softwareVersion":"1.23.0"','"softwareVersion":"1.26.5"');
moyu=moyu.replace('<h3><span class="zh">四幕皆有新声</span><span class="en">Four scenes, fuller sound</span></h3><p><span class="zh">v1.26.5 在四幕独立 8-bit 配乐基础上，将此前制作的老板、BUG、临时需求、邮件、咖啡渍、哑铃与拾取物图集重新接回运行时，让障碍与主角终于处在同一套美术语言里。</span><span class="en">v1.26.5 keeps the four long-form 8-bit scene scores and reconnects the previously produced Boss, BUG, request, mail, spill, dumbbell and pickup art to the live runtime for a coherent visual language.</span></p>','<h3><span class="zh">画面与信息都更清楚</span><span class="en">Clearer world, readable UI</span></h3><p><span class="zh">v1.26.5 将主角、障碍与办公室地面统一到同一透视空间，并把普通、全屏与手机 HUD、事件提示整体放大；四幕高清场景、二段跳物理与碰撞判定保持不变。</span><span class="en">v1.26.5 unifies the runner, hazards and office floor in one perspective space, while enlarging HUD and event text across desktop, fullscreen and mobile. HD scenes, double-jump physics and collision rules stay unchanged.</span></p>');
fs.writeFileSync(moyuPath,moyu);
for(const p of [aboutPath,privacyPath,contactPath])fs.writeFileSync(p,upgrade(p));
for(const p of paths){const s=fs.readFileSync(p,'utf8');if(!s.includes('data-site-version="1.10.0"')||!s.includes('site-v1100/style.css')||!s.includes('site-v1100/site.js')||!s.includes('id="navToggle"'))throw new Error('v1.10 shared shell missing: '+p)}
if(!home.includes('v1.26.5')||!home.includes('moyu-run-v1265.jpg')||!home.includes('ornament-divider'))throw new Error('v1.10 homepage Moyu/decor update missing');
if(!moyu.includes('softwareVersion":"1.26.5"')||!moyu.includes('画面与信息都更清楚'))throw new Error('v1.10 Moyu detail update missing');
console.log('site_v1100_build=PASS');