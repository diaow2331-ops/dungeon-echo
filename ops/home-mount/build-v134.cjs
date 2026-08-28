'use strict';
const assert=require('assert');
const fs=require('fs');
const [,,homePath,dePath,moyuPath]=process.argv;
assert(homePath&&dePath&&moyuPath,'usage: node build-v134.cjs <home.html> <dungeon-detail.html> <moyu-detail.html>');
const replaceOnce=(text,from,to,label)=>{const i=text.indexOf(from);assert(i>=0,`missing ${label}`);assert.equal(text.indexOf(from,i+from.length),-1,`duplicate ${label}`);return text.slice(0,i)+to+text.slice(i+from.length)};
const replaceAll=(text,from,to,label)=>{const hits=text.split(from).length-1;assert(hits>0,`missing ${label}`);return text.split(from).join(to)};

let home=fs.readFileSync(homePath,'utf8');
let de=fs.readFileSync(dePath,'utf8');
let moyu=fs.readFileSync(moyuPath,'utf8');

home=replaceAll(home,'data-site-version="1.3.3"','data-site-version="1.3.4"','home site version');
home=replaceAll(home,'v1.2.7','v1.2.10','home Dungeon version');
home=replaceAll(home,'v1.11.3','v1.11.5','home Moyu version');
home=replaceAll(home,'site v1.3.3','site v1.3.4','home footer site version');
const moyuCta='<a class="btn" href="https://play.91hwl.cn/moyu/" data-carry><span class="i18n-zh">开始摸鱼</span><span class="i18n-en">Play Clock Out Alive</span></a>';
home=replaceOnce(home,moyuCta,moyuCta+'<a class="btn" href="https://github.com/diaow2331-ops/dungeon-echo">GitHub / Source</a>','homepage source CTA');
home=replaceOnce(home,'<b><span class="i18n-zh">字号有层级</span><span class="i18n-en">One type scale</span></b>','<b><span class="i18n-zh">公开仓库</span><span class="i18n-en">OPEN SOURCE</span></b>','homepage open-source heading');
home=replaceOnce(home,'<p><span class="i18n-zh">导航、按钮、正文、卡片标题和页面标题固定在统一字号阶梯。</span><span class="i18n-en">Navigation, controls, body copy and headings share one deliberate scale.</span></p>','<p><span class="i18n-zh">代码、发行说明与工程治理公开在 GitHub；欢迎试玩后提交 Issue。</span><span class="i18n-en">Source, release notes and engineering history are public on GitHub; play first, then file an issue.</span></p>','homepage open-source copy');

home=replaceOnce(home,
'<p><span class="i18n-zh">两款完整的浏览器游戏，不装启动器、不注册账号。深入 100 层地牢，或者从办公室撑到 18:00。</span><span class="i18n-en">Two complete browser games with no launcher and no account wall. Descend through 100 dungeon floors, or survive the office until 18:00.</span></p>',
'<p><span class="i18n-zh">两款完整的浏览器游戏，共用一套清晰的电脑与手机体验，不装启动器、不注册账号。Dungeon Echo 是一场从第 1 层推进到第 100 层的构筑远征；Clock Out Alive 则把办公室四小时压缩成一场约四分钟的反应跑酷。打开就能玩，进度留在当前浏览器。</span><span class="i18n-en">Two complete browser games, built for both desktop and mobile with no launcher and no account wall. Dungeon Echo is a build-driven expedition from Floor 1 to Floor 100; Clock Out Alive compresses four office hours into a roughly four-minute reaction run. Open the page, play immediately, and keep progress in your browser.</span></p>',
'homepage richer hero copy');
home=replaceOnce(home,
'<p><span class="i18n-zh">都支持电脑与手机，存档留在当前浏览器。</span><span class="i18n-en">Both work on desktop and mobile, with local browser saves.</span></p>',
'<p><span class="i18n-zh">两款游戏都针对电脑与手机分别做了交互收口：键盘、触控与响应式布局不是附带支持，而是正式体验的一部分。存档留在当前浏览器，不需要账号。</span><span class="i18n-en">Both games treat desktop and mobile as first-class targets: keyboard, touch and responsive layout are part of the production experience rather than afterthoughts. Saves stay in the current browser, with no account required.</span></p>',
'homepage richer games summary');

const storyCss=`<style id="site-story-polish">
.hero{padding-bottom:42px}.section{padding:50px 0}.site-story{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(330px,.88fr);gap:16px;padding:0 0 52px}.site-story-main,.site-story-card{border:1px solid var(--line);border-radius:16px;background:var(--surface)}.site-story-main{padding:30px 32px;background:linear-gradient(135deg,var(--surface),var(--surface2))}.site-story-main h2{margin:9px 0 14px;font-size:clamp(28px,3vw,40px);line-height:1.08;letter-spacing:-.04em}.site-story-main p{margin:0;color:var(--muted);font-size:15.5px;line-height:1.8}.site-story-main p+p{margin-top:12px}.site-story-grid{display:grid;grid-template-columns:1fr;gap:10px}.site-story-card{padding:18px 20px}.site-story-card small{display:block;color:var(--gold);font:850 11px/1.4 ui-monospace,monospace;letter-spacing:.08em}.site-story-card b{display:block;margin:6px 0 5px;font-size:17px}.site-story-card p{margin:0;color:var(--muted);font-size:13.5px;line-height:1.65}@media(max-width:900px){.site-story{grid-template-columns:1fr;padding-bottom:42px}.site-story-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:720px){.hero{padding-bottom:34px}.section{padding:42px 0}.site-story{padding-bottom:38px}.site-story-main{padding:24px 22px}.site-story-grid{grid-template-columns:1fr}.site-story-main h2{font-size:30px}}
</style>`;
home=replaceOnce(home,'</head>',storyCss+'</head>','homepage story styles');

const story=`<section class="site-story" aria-label="About the games">
  <article class="site-story-main">
    <div class="kicker"><span class="i18n-zh">一个站点 · 两款完整作品</span><span class="i18n-en">ONE SITE · TWO COMPLETE GAMES</span></div>
    <h2><span class="i18n-zh">不是两个试玩入口，而是两种完整的压力体验。</span><span class="i18n-en">Not two demos. Two complete kinds of pressure.</span></h2>
    <p><span class="i18n-zh">Dungeon Echo 把选择压力放在构筑、资源与撤退时机上：你要在 100 层长线里决定什么时候继续贪、什么时候带着战利品回城。Clock Out Alive 则把压力压缩到几分钟内：会议、临时需求、BUG、老板和不断提速的办公室障碍要求即时反应。</span><span class="i18n-en">Dungeon Echo puts pressure on builds, resources and retreat timing: across a 100-floor run you decide when to push deeper and when to bank what you have earned. Clock Out Alive compresses pressure into minutes, asking you to react to meetings, surprise requests, bugs, bosses and an office that keeps accelerating.</span></p>
    <p><span class="i18n-zh">两款游戏都坚持浏览器原生：无需安装、无需注册、无需等待启动器。我们把更多精力放在可重复游玩、清晰输入、移动端适配和可直接反馈的问题追踪上。</span><span class="i18n-en">Both stay browser-native: no install, no registration and no launcher wait. The engineering focus goes into replayability, clear input, mobile fit and a public feedback loop you can inspect directly.</span></p>
  </article>
  <div class="site-story-grid">
    <article class="site-story-card"><small>01 / DUNGEON ECHO</small><b><span class="i18n-zh">100 层构筑远征</span><span class="i18n-en">A 100-floor build expedition</span></b><p><span class="i18n-zh">四职业、六装备位、Mana、技能演化、回城风险与第 100 层终局共同组成一条完整路线。</span><span class="i18n-en">Four classes, six gear slots, Mana, evolving skills, retreat risk and a Floor-100 finale form one complete route.</span></p></article>
    <article class="site-story-card"><small>02 / CLOCK OUT ALIVE</small><b><span class="i18n-zh">约四分钟的办公室跑酷</span><span class="i18n-en">A roughly four-minute office run</span></b><p><span class="i18n-zh">从 14:00 撑到 18:00，四个场景、动态障碍与两个结局，把“准点下班”做成一场反应挑战。</span><span class="i18n-en">Survive from 14:00 to 18:00 through four scenes, dynamic hazards and two endings built around one goal: clock out on time.</span></p></article>
    <article class="site-story-card"><small>03 / OPEN DEVELOPMENT</small><b><span class="i18n-zh">源码、版本与问题公开</span><span class="i18n-en">Source, releases and issues are public</span></b><p><span class="i18n-zh">GitHub 仓库记录代码、发行说明和后续修复。试玩后遇到问题，可以直接从网页进入仓库反馈。</span><span class="i18n-en">The GitHub repository tracks code, release notes and follow-up fixes. If something breaks, the site links straight to the public issue trail.</span></p></article>
  </div>
</section>`;
home=replaceOnce(home,'</div></section>\n<section class="section" id="games">','</div></section>\n'+story+'\n<section class="section" id="games">','homepage story section');

de=replaceOnce(de,'玩法说明、远征录、双语和移动端交互已经通过真人验收；v1.2.7 进一步收拢机制所有权与发布一致性。','v1.2.10 收口桌面一次性键位、901–1180px 笔记本布局与手机触控尺寸；固定中英文路线与兼容存档保持不变。','Dungeon current Chinese release copy');
de=replaceOnce(de,'How to Play, Expedition Record, bilingual UI and mobile controls remain verified; v1.2.7 further consolidates mechanic ownership and release consistency.','v1.2.10 tightens one-shot desktop input, 901–1180px laptop layout and mobile touch targets while preserving fixed ZH/EN routes and compatible saves.','Dungeon current English release copy');
de=replaceAll(de,'data-site-version="1.3.3"','data-site-version="1.3.4"','Dungeon detail site version');
de=replaceAll(de,'v1.2.7','v1.2.10','Dungeon detail version');
de=replaceOnce(de,'"softwareVersion":"1.2.7"','"softwareVersion":"1.2.10"','Dungeon structured version');

moyu=replaceOnce(moyu,'<h3><span class="zh">先把字看清楚</span><span class="en">Readable first</span></h3><p><span class="zh">结算正文、操作说明、顶部按钮与辅助信息统一到同一字号阶梯。</span><span class="en">Results, control notes, top buttons and supporting text now share one readable type scale.</span></p>','<h3><span class="zh">双端更稳</span><span class="en">Cleaner across screens</span></h3><p><span class="zh">语言首屏与运行时保持一致，键盘连发、Canvas 布局与窄屏安全区进一步收口，电脑和手机都更稳定。</span><span class="en">First-paint language, keyboard repeat, Canvas layout and narrow-screen safe areas are tightened for steadier desktop and mobile play.</span></p>','Moyu current release copy');
moyu=replaceAll(moyu,'data-site-version="1.3.3"','data-site-version="1.3.4"','Moyu detail site version');
moyu=replaceAll(moyu,'v1.11.3','v1.11.5','Moyu detail version');
moyu=replaceOnce(moyu,'"softwareVersion":"1.11.3"','"softwareVersion":"1.11.5"','Moyu structured version');

for(const [name,text] of [['home',home],['Dungeon',de],['Moyu',moyu]]){
  assert(text.includes('data-site-version="1.3.4"'),`${name} v1.3.4 marker missing`);
  assert(text.includes('name="google" content="notranslate"'),`${name} notranslate marker missing`);
}
assert(home.includes('v1.2.10')&&home.includes('v1.11.5')&&home.includes('GitHub / Source'));
assert(home.includes('site-story-polish')&&home.includes('100 层构筑远征')&&home.includes('roughly four-minute office run'));
assert(de.includes('softwareVersion":"1.2.10"')&&de.includes('901–1180px'));
assert(moyu.includes('softwareVersion":"1.11.5"')&&moyu.includes('Cleaner across screens'));
fs.writeFileSync(homePath,home);
fs.writeFileSync(dePath,de);
fs.writeFileSync(moyuPath,moyu);
