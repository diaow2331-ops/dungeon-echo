'use strict';
const fs = require('fs');

const files = process.argv.slice(2);
if (files.length !== 6) throw new Error('usage: node build-site-v1112.cjs HOME DUNGEON MOYU ABOUT PRIVACY CONTACT');
const [homePath, dePath, moyuPath, aboutPath, privacyPath, contactPath] = files;
const read = p => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s);
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

let home = read(homePath);
let de = read(dePath);
let moyu = read(moyuPath);
let about = read(aboutPath);
let privacy = read(privacyPath);
let contact = read(contactPath);
const pages = [['home', home], ['Dungeon', de], ['Moyu', moyu], ['about', about], ['privacy', privacy], ['contact', contact]];

for (const [name, text] of pages) {
  assert(text.includes('data-site-version="1.11.1"'), `${name} must enter site v1.11.2 from v1.11.1`);
}

const oldZh = 'v1.4.2 把回响小镇收进固定视口并拆成广场、整备、市集、酒馆、命运与出发六页；1120×460 可步行广场保留更多画面细节，地牢玩法与存档契约不变。';
const oldEn = 'v1.4.2 keeps Echo Town inside a fixed viewport with dedicated Plaza, Gear, Market, Tavern, Fortune and Depart pages. Its 1120×460 walkable plaza preserves more scene detail while dungeon gameplay and save contracts stay unchanged.';
const newZh = 'v1.5.0 强化战斗打击反馈、移动端触控与远征整备流程；职业命中音效、暴击/受伤反馈、可选触觉和一键补给均收进单一权威运行时，现有存档继续兼容。';
const newEn = 'v1.5.0 upgrades combat feedback, mobile controls and expedition readiness with class-specific hit audio, critical/hurt cues, optional haptics and one-tap core supplies inside the single-authority runtime, while existing saves remain compatible.';

assert(home.includes('v1.4.2'), 'homepage Dungeon v1.4.2 marker missing');
assert(home.includes('v0.1.1'), 'homepage Board Trio v0.1.1 marker missing');
assert(de.includes('softwareVersion":"1.4.2"'), 'Dungeon structured v1.4.2 marker missing');
assert(de.includes(oldZh) && de.includes(oldEn), 'Dungeon v1.4.2 release copy missing');

const bump = text => text
  .replaceAll('data-site-version="1.11.1"', 'data-site-version="1.11.2"')
  .replaceAll('site v1.11.1', 'site v1.11.2');

home = bump(home).replaceAll('v1.4.2', 'v1.5.0');
de = bump(de)
  .replaceAll('softwareVersion":"1.4.2"', 'softwareVersion":"1.5.0"')
  .replace(oldZh, newZh)
  .replace(oldEn, newEn)
  .replaceAll('v1.4.2', 'v1.5.0');
moyu = bump(moyu);
about = bump(about);
privacy = bump(privacy);
contact = bump(contact);

assert(home.includes('v1.5.0') && home.includes('v0.1.1') && !home.includes('v1.4.2'), 'homepage product versions did not converge');
assert(de.includes('softwareVersion":"1.5.0"') && de.includes(newZh) && de.includes(newEn), 'Dungeon detail did not converge on v1.5.0');
for (const [name, text] of [['home',home],['Dungeon',de],['Moyu',moyu],['about',about],['privacy',privacy],['contact',contact]]) {
  assert(text.includes('data-site-version="1.11.2"'), `${name} site v1.11.2 marker missing`);
}

write(homePath, home);
write(dePath, de);
write(moyuPath, moyu);
write(aboutPath, about);
write(privacyPath, privacy);
write(contactPath, contact);
console.log('site_v1112_dungeon_v150=PASS');
