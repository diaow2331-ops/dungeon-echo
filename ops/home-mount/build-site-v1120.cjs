'use strict';
// Homepage presentation follows the download gateway; game runtimes remain independent.
const fs = require('fs');
const pages = process.argv.slice(2);
if (pages.length !== 7) throw new Error('usage: build-site-v1120.cjs HOME DUNGEON MOYU BOARD ABOUT PRIVACY CONTACT');
const w = (zh, en) => `<span class="zh">${zh}</span><span class="en">${en}</span>`;
const panel = `<section id="downloads" class="download-hero" aria-labelledby="download-title">
  <div class="download-copy">
    <div class="product-heading"><div><div class="kicker">91HWL · MILKFROG</div><h1 id="download-title">${w('奶蛙磁盘清理', 'MilkFrog<br>Drive Cleaner')}</h1></div><div class="download-character" role="img" aria-label="MilkFrog hugging a disk"></div></div>
    <p class="product-tagline">${w('给磁盘松个绑，让整理更从容。', 'A little more space. A little less clutter.')}</p>
    <p class="product-lead">${w('扫描缓存、查找大文件、看清空间占用。<br>C 盘之外，其他固定磁盘也能一起整理。', 'Scan caches, find large files and see what fills your drives. Manage C and your other local disks in one place.')}</p>
    <div class="download-facts"><span>Windows 10 / 11 x64</span><span>${w('中文 / English', 'English / 中文')}</span><span>${w('24 个奶蛙动作', '24 mascot poses')}</span></div>
    <div class="product-assurance"><span aria-hidden="true">✓</span>${w('软件内无需激活，卡密仅用于领取下载与更新。', 'No in-app activation. Your code is only for downloads and updates.')}</div>
    <div class="product-shortcuts"><a href="#milkfrog-help">${w('下载与使用帮助', 'Download help')}</a><a class="download-play" href="#games">${w('下载时，玩一局 ↗', 'Play while downloading ↗')}</a></div>
  </div>
  <aside class="download-panel" aria-labelledby="download-panel-title">
    <div class="panel-topline"><span class="kicker">${w('软件下载 / 更新', 'DOWNLOAD / UPDATE')}</span><span class="release-badge" id="milkfrog-release" aria-live="polite">Windows x64</span></div>
    <h2 id="download-panel-title">${w('领取你的奶蛙', 'Get your MilkFrog')}</h2>
    <p>${w('粘贴卖家发给你的完整卡密，即可获取最新版。', 'Paste the complete code from your seller to get the latest release.')}</p>
    <form id="milkfrog-code-form" method="post" action="/api/milkfrog/verify">
      <label for="milkfrog-code">${w('交付卡密', 'Delivery code')}</label>
      <div class="code-input-row"><input id="milkfrog-code" name="code" type="text" maxlength="2048" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="MF-XXXXX-XXXXX-XXXXX-XXXXX" aria-describedby="milkfrog-code-hint milkfrog-status"><button id="milkfrog-paste" class="paste-button" type="button">${w('粘贴', 'Paste')}</button></div>
      <button class="btn primary" type="submit" id="milkfrog-verify">${w('验证卡密 · 获取下载 →', 'Verify code · Get downloads →')}</button>
      <p id="milkfrog-code-hint" class="download-note">${w('同一张卡密可再次下载、领取后续更新。', 'Keep your code for repeat downloads and future updates.')}</p>
    </form>
    <noscript><p>${w('请启用 JavaScript 后领取下载，或通过原订单联系卖家。','Enable JavaScript to claim downloads, or contact your seller through the original order.')}</p><style>#milkfrog-code-form{display:none}</style></noscript>
    <p id="milkfrog-status" class="download-status" role="status" aria-live="polite" aria-atomic="true"></p>
    <div id="milkfrog-downloads" hidden><div id="milkfrog-file-links"></div><p class="download-note">${w('链接 15 分钟内可开始下载；过期后点击“获取最新版本”。', 'Start within 15 minutes. Get fresh links below if they expire.')}</p><div class="download-actions"><button type="button" id="milkfrog-refresh">${w('获取最新版本', 'Get latest version')}</button><button type="button" id="milkfrog-logout">${w('退出领取', 'Sign out')}</button></div><a class="after-download-play" href="#games">${w('已开始下载？去玩个小游戏 ↗', 'Download started? Play a game ↗')}</a></div>
    <div class="download-mobile-note">${w('手机领取后，请在 Windows 电脑上下载并使用。', 'Using a phone? Download and run the app on a Windows PC.')}</div>
    <div class="panel-help"><span>${w('还没有卡密？请通过闲鱼向卖家购买。', 'Need a code? Contact the seller on Xianyu.')}</span><a href="#milkfrog-help">${w('遇到问题？', 'Need help?')}</a></div>
  </aside>
</section>
<section class="software-features" aria-label="MilkFrog features">
  <article><div class="feature-pose pose-scan" aria-hidden="true"></div><div><h2>${w('先看清，再整理', 'See before cleaning')}</h2><p>${w('缓存扫描、大文件查找与空间分析，按需选择。', 'Scan caches, locate large files and inspect disk usage.')}</p></div></article>
  <article><div class="feature-pose pose-clean" aria-hidden="true"></div><div><h2>${w('不止 C 盘', 'Beyond drive C')}</h2><p>${w('切换固定磁盘，分别查看与清理。', 'Switch between local drives to inspect and clean each one.')}</p></div></article>
  <article><div class="feature-pose pose-done" aria-hidden="true"></div><div><h2>${w('用你熟悉的方式', 'Make yourself at home')}</h2><p>${w('中英文自由切换，奶蛙陪你完成整理。', 'Switch between Chinese and English, with MilkFrog by your side.')}</p></div></article>
</section>`;
const gameIntro = `<section class="hero games-intro" aria-labelledby="hero-title"><div><div class="kicker">${w('下载间隙，轻松一下', 'TAKE A LITTLE BREAK')}</div><h2 id="hero-title">${w('下载在进行，游戏也开场。', 'Downloading? Time for a game.')}</h2><p>${w('三款浏览器游戏，打开即玩，无需安装或注册。游戏在新标签页打开，下载可以继续。', 'Three browser games. No install or sign-up. Games open in a new tab so your download can continue.')}</p></div><a class="game-source" href="https://github.com/diaow2331-ops/dungeon-echo">GitHub / Source ↗</a></section>`;
const faqs = [
  ['卡密在哪里？领取失败怎么办？', 'Where is my code? What if verification fails?', '使用闲鱼卖家交付消息中的完整卡密，不是订单号。核对复制内容，避免遗漏字符；仍无法领取时，通过原订单联系卖家。不要把完整卡密贴到公开反馈里。', 'Use the complete code in the seller’s Xianyu delivery message, not your order number. Check for missing characters, then contact the seller through the original order. Do not post your full code in public feedback.'],
  ['安装版与便携版，应该选哪个？', 'Installer or portable: which should I choose?', '日常使用推荐安装版；便携版解压后即可运行，适合自行管理软件文件夹。两种版本都用于 Windows 10 / 11 的 64 位电脑。', 'The installer is recommended for everyday use. Extract the portable version if you prefer to manage the app folder yourself. Both versions require 64-bit Windows 10 or 11.'],
  ['只能清理 C 盘吗？会自动删除吗？', 'Does it only clean C? Will it delete automatically?', '可以选择其他固定磁盘。先扫描并核对列表，再执行清理；大文件请确认用途后再处理。建议先关闭正在使用相关缓存的程序，并保留重要文件备份。', 'You can select other local drives. Scan and review the list before cleaning. Check what large files are used for before removing them. Close apps using those caches and keep backups of important files.'],
  ['换电脑、重新下载或更新，需要新卡密吗？', 'Do I need a new code for another PC or an update?', '同一张有效卡密可再次领取最新版。软件运行不需要卡密验证。当前浏览器会记住领取资格 90 天；使用共享电脑时，请点击“退出领取”。', 'The same valid code can request the latest release again. The app itself does not require code verification. This browser remembers access for 90 days; sign out on shared computers.'],
  ['链接过期或下载中断，怎么办？', 'What if a link expires or a download stops?', '点击“获取最新版本”重新生成下载链接，或重新输入卡密。链接可在生成后的 15 分钟内开始下载。手机无法运行 Windows 软件，请在电脑上打开本站领取。', 'Get the latest version to generate fresh links, or enter your code again. Start downloading within 15 minutes of link creation. Use a Windows PC to download and run the app.']
];
const help = `<section id="milkfrog-help" class="milkfrog-help" aria-labelledby="milkfrog-help-title"><div class="help-heading"><div class="kicker">${w('下载与使用帮助', 'A LITTLE HELP')}</div><h2 id="milkfrog-help-title">${w('从领取到整理，都有说明。', 'From download to a cleaner drive.')}</h2><p>${w('复制卡密 → 领取安装包 → 扫描并确认后清理', 'Copy your code → Download → Scan, review and clean')}</p><a href="/contact/">${w('其他问题与反馈 ↗', 'More questions & feedback ↗')}</a></div><div class="help-questions">${faqs.map(([q,e,a,b])=>`<details><summary>${w(q,e)}</summary><p>${w(a,b)}</p></details>`).join('')}</div></section>`;
for (let i=0;i<pages.length;i++) {
  let s=fs.readFileSync(pages[i],'utf8');
  if(!s.includes('data-site-version="1.11.9"')) throw new Error('previous site boundary missing');
  s=s.replaceAll('data-site-version="1.11.9"','data-site-version="1.12.0"').replaceAll('site v1.11.9','site v1.12.0').replaceAll('?v=1.11.9','?v=1.12.0');
  if(i===0) {
    s=s.replace('site-v190 site-v1110','site-v190 site-v1110 site-v1120');
    const start=s.indexOf('<section id="downloads"'),end=s.indexOf('<section class="hero"',start);
    if(start<0||end<0) throw new Error('download boundary missing');
    s=s.slice(0,start)+panel+s.slice(end);
    s=s.replace(/<style id="milkfrog-download-style">[\s\S]*?<\/style>/,'');
    s=s.replace(/<section class="hero"[\s\S]*?<\/section>/,gameIntro);
    s=s.replace(/<div class="ornament-divider"[\s\S]*?<\/div>/,'');
    // One game gallery; move the optional chooser below the full cards.
    const quick=s.match(/<section class="quick-pick"[\s\S]*?<\/section>/);
    if(!quick) throw new Error('game chooser missing');
    s=s.replace(quick[0],'');
    s=s.replace('<section class="section" aria-labelledby="principles-title">',quick[0]+help+'<section class="section" aria-labelledby="principles-title">');
    s=s.replaceAll(/(<a[^>]*href="https:\/\/play\.91hwl\.cn\/[^"<>]+"[^>]*)(>)/g,'$1 target="_blank" rel="noopener"$2');
    s=s.replace('<button type="button" data-game-choice="board">方寸棋局</button>', `<button type="button" data-game-choice="board">${w('方寸棋局','Board Trio')}</button>`);
    s=s.replaceAll('/assets/site-v1118/board-go.webp', '/assets/site-v1118/board-xiangqi.webp');
    s=s.replace('<div class="nav-links">',`<div class="nav-links"><a href="#milkfrog-help">${w('帮助','Help')}</a>`);
    // Keep language/theme controls visible on phones, outside the collapsed directory.
    const prefs=s.match(/<div class="prefs">[\s\S]*?id="themeToggle"[\s\S]*?<\/button><\/div>/);
    if(!prefs) throw new Error('site preferences missing');
    s=s.replace(prefs[0],'').replace('</header>',prefs[0]+'</header>');
    s=s.replace('<span class="brand-word">91hwl</span>','<span class="brand-word">91hwl<span class="brand-caption">'+w('软件与小游戏','SOFTWARE & PLAY')+'</span></span>');
    s=s.replace('</head>','<link rel="stylesheet" href="/assets/milkfrog/home.css?v=1.12.0"></head>');
    s=s.replace('独立浏览器游戏 · 2026',''+w('独立软件与浏览器游戏','Independent software & browser games')+' · 2026');
    s=s.replace('可复现 Bug 请走 GitHub Issues；站点、合作与隐私事务可发邮件。','游戏问题请走 GitHub Issues；卡密与购买问题，请通过闲鱼原订单联系卖家。');
    s=s.replace('Use GitHub Issues for reproducible bugs; email for site, collaboration and privacy matters.','Use GitHub Issues for game bugs. For codes and purchases, contact the seller through your original Xianyu order.');
    // Share cards describe the combined site rather than only its games.
    s=s.replaceAll('91hwl · Browser Games','91hwl · MilkFrog & Browser Games');
    s=s.replaceAll('三款浏览器游戏打开即玩：Dungeon Echo、Clock Out Alive 与方寸棋局。','奶蛙磁盘清理下载与更新，三款浏览器游戏打开即玩。');
    s=s.replaceAll('Three browser games, ready to play: Dungeon Echo, Clock Out Alive and Board Trio.','MilkFrog Drive Cleaner downloads and updates, plus three browser games.');
    if(!(s.indexOf('id="downloads"')<s.indexOf('id="games"')&&s.indexOf('id="games"')<s.indexOf('id="milkfrog-help"'))) throw new Error('homepage section order invalid');
  }
  fs.writeFileSync(pages[i],s);
}
console.log('site_v1120_homepage_polish=PASS');
