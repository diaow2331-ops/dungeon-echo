'use strict';
const assert = require('assert');
const fs = require('fs');

const [,, homePath, dePath, moyuPath] = process.argv;
assert(homePath && dePath && moyuPath, 'usage: node build-social-v134.cjs <home.html> <dungeon-detail.html> <moyu-detail.html>');

const ADSENSE_CLIENT = 'ca-pub-2648680835467283';
const ADSENSE_SNIPPET = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>`;

const replaceOnce = (text, from, to, label) => {
  const first = text.indexOf(from);
  assert(first >= 0, `missing ${label}`);
  assert.equal(text.indexOf(from, first + from.length), -1, `duplicate ${label}`);
  return text.slice(0, first) + to + text.slice(first + from.length);
};

const addSocialMeta = (text, { url, title, description, image, imageAlt }) => {
  const anchor = '<meta name="twitter:card" content="summary_large_image">';
  const block = `${anchor}\n<meta name="robots" content="index,follow,max-image-preview:large">\n<meta property="og:url" content="${url}">\n<meta property="og:site_name" content="91hwl">\n<meta property="og:image:alt" content="${imageAlt}">\n<meta name="twitter:title" content="${title}">\n<meta name="twitter:description" content="${description}">\n<meta name="twitter:image" content="${image}">\n<meta name="twitter:image:alt" content="${imageAlt}">`;
  return replaceOnce(text, anchor, block, `${title} social card anchor`);
};

const addAdSense = (text, label) => {
  assert(!text.includes(ADSENSE_CLIENT), `${label} already contains AdSense client`);
  return replaceOnce(text, '</head>', `${ADSENSE_SNIPPET}\n</head>`, `${label} head close`);
};

let home = fs.readFileSync(homePath, 'utf8');
let de = fs.readFileSync(dePath, 'utf8');
let moyu = fs.readFileSync(moyuPath, 'utf8');

home = addSocialMeta(home, {
  url: 'https://91hwl.cn/',
  title: '91hwl · Browser Games',
  description: 'Two complete browser-native games. No launcher, no account wall — just open and play on desktop or mobile.',
  image: 'https://play.91hwl.cn/dungeon-echo/art/title-backdrop.webp',
  imageAlt: 'Dungeon Echo dark-fantasy title artwork used on the 91hwl browser-games homepage.'
});

de = addSocialMeta(de, {
  url: 'https://91hwl.cn/toys/dungeon-echo/',
  title: 'Dungeon Echo · 100-Floor Browser Roguelike',
  description: 'Four classes, six gear slots, Mana, readable bosses and a push-or-retreat loop across one continuous Floor 1 to Floor 100 expedition.',
  image: 'https://play.91hwl.cn/dungeon-echo/art/title-backdrop.webp',
  imageAlt: 'Dungeon Echo title artwork for the 100-floor browser roguelike.'
});
de = replaceOnce(
  de,
  '<a class="btn" href="https://github.com/diaow2331-ops/dungeon-echo">GitHub</a>',
  '<a class="btn" href="https://github.com/diaow2331-ops/dungeon-echo">GitHub / Source</a>',
  'Dungeon source CTA'
);
de = replaceOnce(
  de,
  '<span class="chip"><span class="zh">电脑 + 手机</span><span class="en">PC + MOBILE</span></span>',
  '<span class="chip"><span class="zh">电脑 + 手机</span><span class="en">PC + MOBILE</span></span><span class="chip">MIT · OPEN SOURCE</span>',
  'Dungeon open-source chip'
);

home = addAdSense(home, 'homepage');
de = addAdSense(de, 'Dungeon detail');
moyu = addAdSense(moyu, 'Moyu detail');

for (const [name, text] of [['home', home], ['Dungeon', de]]) {
  assert(text.includes('name="robots" content="index,follow,max-image-preview:large"'), `${name} robots preview policy missing`);
  assert(text.includes('property="og:url"'), `${name} og:url missing`);
  assert(text.includes('property="og:site_name" content="91hwl"'), `${name} og:site_name missing`);
  assert(text.includes('property="og:image:alt"'), `${name} og:image:alt missing`);
  assert(text.includes('name="twitter:title"'), `${name} twitter:title missing`);
  assert(text.includes('name="twitter:description"'), `${name} twitter:description missing`);
  assert(text.includes('name="twitter:image"'), `${name} twitter:image missing`);
  assert(text.includes('name="twitter:image:alt"'), `${name} twitter:image:alt missing`);
}
for (const [name, text] of [['home', home], ['Dungeon', de], ['Moyu', moyu]]) {
  assert(text.includes(ADSENSE_CLIENT), `${name} AdSense client missing`);
  assert.equal(text.split(ADSENSE_CLIENT).length - 1, 1, `${name} AdSense client must appear exactly once`);
}
assert(de.includes('GitHub / Source'));
assert(de.includes('MIT · OPEN SOURCE'));

fs.writeFileSync(homePath, home);
fs.writeFileSync(dePath, de);
fs.writeFileSync(moyuPath, moyu);
