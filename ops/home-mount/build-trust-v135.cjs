'use strict';
const assert = require('assert');
const fs = require('fs');

const [,, homePath, dePath, moyuPath] = process.argv;
assert(homePath && dePath && moyuPath, 'usage: node build-trust-v135.cjs <home.html> <dungeon-detail.html> <moyu-detail.html>');

const replaceOnce = (text, from, to, label) => {
  const first = text.indexOf(from);
  assert(first >= 0, `missing ${label}`);
  assert.equal(text.indexOf(from, first + from.length), -1, `duplicate ${label}`);
  return text.slice(0, first) + to + text.slice(first + from.length);
};
const replaceAll = (text, from, to, label) => {
  const count = text.split(from).length - 1;
  assert(count > 0, `missing ${label}`);
  return text.split(from).join(to);
};

let home = fs.readFileSync(homePath, 'utf8');
let de = fs.readFileSync(dePath, 'utf8');
let moyu = fs.readFileSync(moyuPath, 'utf8');

for (const [name, text] of [['home', home], ['Dungeon', de], ['Moyu', moyu]]) {
  assert(text.includes('data-site-version="1.3.4"'), `${name} must enter v1.3.5 from the staged v1.3.4 surface`);
}
home = replaceAll(home, 'data-site-version="1.3.4"', 'data-site-version="1.3.5"', 'homepage site version');
de = replaceAll(de, 'data-site-version="1.3.4"', 'data-site-version="1.3.5"', 'Dungeon detail site version');
moyu = replaceAll(moyu, 'data-site-version="1.3.4"', 'data-site-version="1.3.5"', 'Moyu detail site version');
home = replaceAll(home, 'site v1.3.4', 'site v1.3.5', 'homepage footer site version');

const trustCss = `<style id="site-trust-hub-v135">
.site-trust-hub{margin:8px 0 30px;padding:34px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(135deg,var(--surface),var(--surface2));box-shadow:0 12px 34px rgba(0,0,0,.08)}
.site-trust-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.72fr);gap:28px;align-items:end;margin-bottom:24px}.site-trust-head h2{margin:8px 0 0;font-size:clamp(30px,3.4vw,44px);line-height:1.05;letter-spacing:-.045em}.site-trust-head p{margin:0;color:var(--muted);font-size:15px;line-height:1.75}
.site-trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.site-trust-card{min-width:0;padding:22px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--bg) 32%,transparent)}.site-trust-card small{display:block;color:var(--gold);font:850 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em}.site-trust-card h3{margin:8px 0 8px;font-size:20px;letter-spacing:-.025em}.site-trust-card p{margin:0 0 16px;color:var(--muted);font-size:14px;line-height:1.72}.site-trust-card .trust-mail{display:block;margin:-4px 0 16px;color:var(--text);font:800 13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}.site-trust-card .trust-link{display:inline-flex;min-height:42px;align-items:center;padding:0 13px;border:1px solid var(--line);border-radius:8px;background:var(--surface);text-decoration:none;font-size:13px;font-weight:850}.site-trust-card .trust-link:hover{border-color:var(--gold)}
.footer{font-size:13px;padding-top:24px}.footer a{font-weight:850}
@media(max-width:900px){.site-trust-head{grid-template-columns:1fr;gap:10px}.site-trust-grid{grid-template-columns:1fr 1fr}.site-trust-card:last-child{grid-column:1/-1}}
@media(max-width:720px){.site-trust-hub{padding:24px 20px;margin-bottom:24px}.site-trust-grid{grid-template-columns:1fr}.site-trust-card:last-child{grid-column:auto}.site-trust-head h2{font-size:31px}.site-trust-card{padding:20px}}
</style>`;
home = replaceOnce(home, '</head>', `${trustCss}\n</head>`, 'homepage trust hub style anchor');

const oldLegal = '<nav class="site-legal" aria-label="Site information"><a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/contact/">Contact</a></nav>';
const trustHub = `<section class="site-trust-hub" aria-labelledby="site-trust-title">
  <div class="site-trust-head">
    <div><div class="kicker"><span class="i18n-zh">站点信息</span><span class="i18n-en">SITE INFORMATION</span></div><h2 id="site-trust-title"><span class="i18n-zh">关于、隐私与联系，一眼就能找到。</span><span class="i18n-en">About, privacy and contact — easy to find.</span></h2></div>
    <p><span class="i18n-zh">91hwl 是独立维护的浏览器游戏站点。游戏无需账号，核心进度留在当前浏览器；站点如何运行、广告如何使用、问题如何反馈，都在这里公开说明。</span><span class="i18n-en">91hwl is an independently maintained browser-game site. Games require no account and core progress stays in your browser; how the site works, how ads are used and how to reach us are documented openly here.</span></p>
  </div>
  <div class="site-trust-grid">
    <article class="site-trust-card"><small>01 / ABOUT</small><h3><span class="i18n-zh">关于 91hwl</span><span class="i18n-en">About 91hwl</span></h3><p><span class="i18n-zh">了解这个站点在做什么、两款游戏的定位，以及为什么坚持“打开即玩”和公开开发。</span><span class="i18n-en">See what the site is for, how the two games differ, and why we keep the experience open-and-play with public development.</span></p><a class="trust-link" href="/about/"><span class="i18n-zh">了解这个站点 →</span><span class="i18n-en">About the site →</span></a></article>
    <article class="site-trust-card"><small>02 / PRIVACY</small><h3><span class="i18n-zh">隐私与广告</span><span class="i18n-en">Privacy &amp; ads</span></h3><p><span class="i18n-zh">查看本地存档、基础访问日志、Google AdSense 与同意管理的说明。游戏运行界面本身不作为广告展示面。</span><span class="i18n-en">Read how local saves, basic access logs, Google AdSense and consent are handled. The playable game interfaces themselves are not ad surfaces.</span></p><a class="trust-link" href="/privacy/"><span class="i18n-zh">查看隐私说明 →</span><span class="i18n-en">Read privacy details →</span></a></article>
    <article class="site-trust-card"><small>03 / CONTACT</small><h3><span class="i18n-zh">联系与反馈</span><span class="i18n-en">Contact &amp; feedback</span></h3><p><span class="i18n-zh">可复现 Bug 和技术问题优先走 GitHub Issues；安全或隐私敏感内容请先查看 Security Policy；普通反馈使用 GitHub Issues。</span><span class="i18n-en">Reproducible bugs and technical issues are best filed on GitHub Issues; security or privacy-sensitive material should follow the Security Policy; ordinary feedback should use GitHub Issues.</span></p><a class="trust-mail" href="https://github.com/diaow2331-ops/dungeon-echo/security/policy">GitHub Security Policy</a><a class="trust-link" href="/contact/"><span class="i18n-zh">查看全部联系方式 →</span><span class="i18n-en">See contact options →</span></a></article>
  </div>
</section>`;
home = replaceOnce(home, oldLegal, trustHub, 'homepage compact legal navigation');

assert(home.includes('site-trust-hub-v135'));
assert(home.includes('关于、隐私与联系，一眼就能找到。'));
assert(home.includes('About, privacy and contact — easy to find.'));
assert(home.includes('https://github.com/diaow2331-ops/dungeon-echo/security/policy'));
assert(home.includes('游戏运行界面本身不作为广告展示面'));
assert(!home.includes(oldLegal), 'homepage compact legal nav must be replaced by visible trust hub');
for (const page of [home, de, moyu]) assert(page.includes('data-site-version="1.3.5"'));

fs.writeFileSync(homePath, home);
fs.writeFileSync(dePath, de);
fs.writeFileSync(moyuPath, moyu);
