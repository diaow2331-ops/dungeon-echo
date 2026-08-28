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

de=replaceOnce(de,'玩法说明、远征录、双语和移动端交互已经通过真人验收；v1.2.7 进一步收拢机制所有权与发布一致性。','v1.2.10 收口桌面一次性键位、901–1180px 笔记本布局与手机触控尺寸；固定中英文路线与兼容存档保持不变。','Dungeon current Chinese release copy');
de=replaceOnce(de,'How to Play, Expedition Record, bilingual UI and mobile controls remain verified; v1.2.7 further consolidates mechanic ownership and release consistency.','v1.2.10 tightens one-shot desktop input, 901–1180px laptop layout and mobile touch targets while preserving fixed ZH/EN routes and compatible saves.','Dungeon current English release copy');
de=replaceAll(de,'data-site-version="1.3.3"','data-site-version="1.3.4"','Dungeon detail site version');
de=replaceAll(de,'v1.2.7','v1.2.10','Dungeon detail version');

moyu=replaceOnce(moyu,'<h3><span class="zh">先把字看清楚</span><span class="en">Readable first</span></h3><p><span class="zh">结算正文、操作说明、顶部按钮与辅助信息统一到同一字号阶梯。</span><span class="en">Results, control notes, top buttons and supporting text now share one readable type scale.</span></p>','<h3><span class="zh">双端更稳</span><span class="en">Cleaner across screens</span></h3><p><span class="zh">语言首屏与运行时保持一致，键盘连发、Canvas 布局与窄屏安全区进一步收口，电脑和手机都更稳定。</span><span class="en">First-paint language, keyboard repeat, Canvas layout and narrow-screen safe areas are tightened for steadier desktop and mobile play.</span></p>','Moyu current release copy');
moyu=replaceAll(moyu,'data-site-version="1.3.3"','data-site-version="1.3.4"','Moyu detail site version');
moyu=replaceAll(moyu,'v1.11.3','v1.11.5','Moyu detail version');

for(const [name,text] of [['home',home],['Dungeon',de],['Moyu',moyu]]){
  assert(text.includes('data-site-version="1.3.4"'),`${name} v1.3.4 marker missing`);
  assert(text.includes('name="google" content="notranslate"'),`${name} notranslate marker missing`);
}
assert(home.includes('v1.2.10')&&home.includes('v1.11.5')&&home.includes('GitHub / Source'));
assert(de.includes('softwareVersion":"1.2.10"')&&de.includes('901–1180px'));
assert(moyu.includes('softwareVersion":"1.11.5"')&&moyu.includes('Cleaner across screens'));
fs.writeFileSync(homePath,home);
fs.writeFileSync(dePath,de);
fs.writeFileSync(moyuPath,moyu);
