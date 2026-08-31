'use strict';
const fs=require('fs');
const path=require('path');
const pages=process.argv.slice(2);
if(pages.length!==7)throw new Error('usage: node build-site-v1118.cjs HOME DUNGEON MOYU BOARD ABOUT PRIVACY CONTACT');
const [homePath,dePath,moyuPath,boardPath,...rest]=pages;
const repo=path.resolve(__dirname,'../..');
const readVersion=rel=>fs.readFileSync(path.join(repo,rel),'utf8').trim();
const versions=Object.freeze({dungeon:readVersion('VERSION'),moyu:readVersion('moyu/VERSION'),board:readVersion('board-games/VERSION'),site:readVersion('ops/home-mount/SITE_VERSION')});
for(const [name,value] of Object.entries(versions))if(!/^\d+\.\d+\.\d+$/.test(value))throw new Error(`${name} version is not semantic: ${value}`);
if(versions.site!=='1.11.8')throw new Error(`unexpected v1118 site version: ${versions.site}`);
function upgrade(file){
  let s=fs.readFileSync(file,'utf8');
  if(!s.includes('data-site-version="1.11.7"'))throw new Error(`site v1.11.7 marker missing: ${file}`);
  s=s.replaceAll('data-site-version="1.11.7"','data-site-version="1.11.8"').replaceAll('site v1.11.7','site v1.11.8')
    .replaceAll('/assets/site-v1110/style.css?v=1.10.0','/assets/site-v1110/style.css?v=1.11.8')
    .replaceAll('/assets/site-v1110/site.js?v=1.10.0','/assets/site-v1110/site.js?v=1.11.8');
  return s;
}
let home=upgrade(homePath);
const boardPlay='<a class="btn primary" href="https://play.91hwl.cn/board-games/" data-carry><span class="i18n-zh">开始对弈</span><span class="i18n-en">Play now</span></a>';
const boardDetails='<a class="btn" href="/toys/board-games/" data-carry><span class="i18n-zh">项目详情</span><span class="i18n-en">Details</span></a>';
if(!home.includes('/toys/board-games/'))home=home.replace(boardPlay,boardPlay+boardDetails);
home=home.replace('<span class="hero-board-grid" aria-hidden="true"></span>','<img src="/assets/site-v1118/board-xiangqi.webp" alt="Board Trio Xiangqi game interface">');
home=home.replace('<span class="tag">LOCAL 2P</span>','<span class="tag">LOCAL AI</span>');
home=home.replace('五子棋、中国象棋与围棋共用一套轻量棋桌。三种棋新增逐手棋谱、复盘与双方棋钟；围棋继续支持死子确认、双方计分确认与整盘重复局面校验。','五子棋、中国象棋与围棋共用一张棋桌。三档本地 AI、双人同屏、逐手棋谱、复盘、棋钟与全屏模式都已接入；围棋采用中国面积计分并保留提子与死子确认。').replace('Gomoku, Xiangqi and Go share one lightweight board table with per-move records, replay and optional per-side clocks; Go retains scoring agreement and whole-board repetition prevention.','Gomoku, Xiangqi and Go share one table with three local AI levels, local two-player play, records, replay, clocks and fullscreen; Go uses Chinese area scoring with capture and dead-stone review.');
home=home.replace('<div class="board-preview" aria-hidden="true"></div>','<img class="board-card-shot" src="/assets/site-v1118/board-go.webp" alt="Board Trio Go game interface">');
if(!home.includes(`Board Trio v${versions.board}`))home=home.replace(/(Clock Out Alive v[^<]+)(<\/span><\/footer>)/,`$1 · Board Trio v${versions.board}$2`);
fs.writeFileSync(homePath,home);

let dungeon=upgrade(dePath).replaceAll('v1.5.0',`v${versions.dungeon}`);
const oldDeZh='v1.6.0 强化战斗打击反馈、移动端触控与远征整备流程；职业命中音效、暴击/受伤反馈、可选触觉和一键补给均收进单一权威运行时，现有存档继续兼容。';
const oldDeEn='v1.6.0 upgrades combat feedback, mobile controls and expedition readiness with class-specific hit audio, critical/hurt cues, optional haptics and one-tap core supplies inside the single-authority runtime, while existing saves remain compatible.';
const newDeZh='v1.6.0 保留 v1.5 的战斗反馈、移动触控与远征整备体验，并进一步把城镇检查点、远征整备阈值与经济计算收拢到单一规则权威，降低后续维护风险；现有存档继续兼容。';
const newDeEn='v1.6.0 keeps the v1.5 combat feedback, mobile controls and expedition-readiness flow while consolidating town checkpoints, readiness thresholds and economy calculations into single rule authorities. Existing saves remain compatible.';
dungeon=dungeon.replace(oldDeZh,newDeZh).replace(oldDeEn,newDeEn);
const oldGallery=/<section class="section"><div class="gallery">[\s\S]*?<\/div><\/section><section class="final">/;
const deGallery=`<section class="section project-media"><div class="project-media-head"><div><div class="kicker"><span class="zh">现有美术资产</span><span class="en">IN-GAME ART</span></div><h2><span class="zh">城镇、守卫与百层终局。</span><span class="en">Town, guardians and the floor-100 finale.</span></h2></div><p><span class="zh">这里展示的是游戏仓库正在使用的场景与图集，不是另做的一套宣传图。</span><span class="en">These are production scenes and atlases from the game repository, not a separate promotional art set.</span></p></div><div class="project-gallery"><figure class="media-card wide"><img src="/assets/site-v1118/dungeon-town.webp" alt="Dungeon Echo town"><figcaption><b><span class="zh">城镇 · 远征之间的安全阶段</span><span class="en">Town · the safe phase between expeditions</span></b><small>TOWN BACKDROP</small></figcaption></figure><figure class="media-card tall atlas"><img src="/assets/site-v1118/dungeon-guardians.webp" alt="Dungeon Echo guardian atlas"><figcaption><b><span class="zh">守卫图集 · 阶段压力来源</span><span class="en">Guardian atlas · staged pressure</span></b><small>GUARDIAN ATLAS</small></figcaption></figure><figure class="media-card tall atlas"><img src="/assets/site-v1118/dungeon-weapons.webp" alt="Dungeon Echo equipment weapons"><figcaption><b><span class="zh">装备构筑 · 武器层级</span><span class="en">Build craft · weapon tiers</span></b><small>EQUIPMENT ATLAS</small></figcaption></figure><figure class="media-card wide atlas"><img src="/assets/site-v1118/dungeon-final.webp" alt="Dungeon Echo final boss"><figcaption><b><span class="zh">第 100 层 · 终局首领</span><span class="en">Floor 100 · final boss</span></b><small>FINAL BOSS</small></figcaption></figure></div></section><section class="final">`;
if(!oldGallery.test(dungeon))throw new Error('Dungeon legacy gallery marker missing');
dungeon=dungeon.replace(oldGallery,deGallery);
fs.writeFileSync(dePath,dungeon);

let moyu=upgrade(moyuPath);
const poster=/<div class="poster">[\s\S]*?<\/div><\/div><\/section>/;
const moyuHero=`<figure class="art detail-moyu-hero"><img src="/assets/site-v1110/moyu-run-v1265.jpg" alt="Clock Out Alive office runner gameplay"><figcaption class="art-label"><span class="zh">实机画面 · 四幕办公室跑酷</span><span class="en">GAMEPLAY · FOUR OFFICE SCENES</span></figcaption></figure></section>`;
if(!poster.test(moyu))throw new Error('Moyu legacy poster marker missing');
moyu=moyu.replace(poster,moyuHero);
const finalMarker='<section class="final">';
const moyuGallery=`<section class="section project-media"><div class="project-media-head"><div><div class="kicker"><span class="zh">实机与图集</span><span class="en">GAMEPLAY & ATLASES</span></div><h2><span class="zh">四幕办公室，不只是一张时间表。</span><span class="en">Four office acts, beyond the clock.</span></h2></div><p><span class="zh">场景、主角和障碍物都直接取自当前仓库素材，让项目页真正展示游戏本身。</span><span class="en">Scenes, hero and hazards come directly from the current repository so the project page shows the actual game.</span></p></div><div class="project-gallery"><figure class="media-card wide"><img src="/assets/site-v1110/moyu-run-v1265.jpg" alt="Clock Out Alive gameplay"><figcaption><b><span class="zh">实机画面 · 追着 18:00 跑</span><span class="en">Gameplay · run toward 18:00</span></b><small>LIVE GAMEPLAY</small></figcaption></figure><figure class="media-card tall"><img src="/assets/site-v1118/moyu-scenes.webp" alt="Clock Out Alive scene backdrops"><figcaption><b><span class="zh">四幕场景 · 工位到健身房</span><span class="en">Four scenes · desk to gym</span></b><small>SCENE BACKDROPS</small></figcaption></figure><figure class="media-card tall atlas"><img src="/assets/site-v1118/moyu-hero.webp" alt="Clock Out Alive hero atlas"><figcaption><b><span class="zh">主角动作图集</span><span class="en">Runner action atlas</span></b><small>HERO ATLAS</small></figcaption></figure><figure class="media-card wide atlas"><img src="/assets/site-v1118/moyu-hazards.webp" alt="Clock Out Alive office hazards"><figcaption><b><span class="zh">障碍图集 · 老板、BUG 与临时需求</span><span class="en">Hazards · boss, BUGs and requests</span></b><small>HAZARD ATLAS</small></figcaption></figure></div></section>`;
if(!moyu.includes(finalMarker))throw new Error('Moyu final marker missing');
moyu=moyu.replace(finalMarker,moyuGallery+finalMarker);
fs.writeFileSync(moyuPath,moyu);

let board=upgrade(boardPath).replaceAll('__BOARD_VERSION__',versions.board);
fs.writeFileSync(boardPath,board);
for(const file of rest)fs.writeFileSync(file,upgrade(file));

for(const file of pages){const s=fs.readFileSync(file,'utf8');if(!s.includes('data-site-version="1.11.8"'))throw new Error(`site version drift: ${file}`);if(!s.includes('/assets/site-v1110/style.css?v=1.11.8')||!s.includes('/assets/site-v1110/site.js?v=1.11.8'))throw new Error(`shared cache drift: ${file}`);if(/mailto:[^"'\s>]+@/i.test(s))throw new Error(`personal mail route remains: ${file}`);if(/https:\/\/x\.com\//i.test(s))throw new Error(`personal social route remains: ${file}`)}
if(!home.includes('/toys/board-games/')||!home.includes('board-xiangqi.webp')||!home.includes('board-card-shot'))throw new Error('homepage Board details / real imagery missing');
if(!dungeon.includes('dungeon-guardians.webp')||!dungeon.includes(newDeZh))throw new Error('Dungeon v1.11.8 detail enrichment missing');
if(!moyu.includes('moyu-scenes.webp')||!moyu.includes('detail-moyu-hero'))throw new Error('Moyu v1.11.8 detail enrichment missing');
if(board.includes('__BOARD_VERSION__')||!board.includes(`softwareVersion\":\"${versions.board}\"`)||!board.includes('三种棋，一张桌')||!board.includes('board-gomoku.webp'))throw new Error('Board detail build missing');
console.log(`site_v1118_project_details=PASS site=${versions.site} dungeon=${versions.dungeon} moyu=${versions.moyu} board=${versions.board}`);
