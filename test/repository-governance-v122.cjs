'use strict';
const fs = require('fs');
const assert = require('assert');

const version = fs.readFileSync('VERSION', 'utf8').trim();
const readme = fs.readFileSync('README.md', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const dev = fs.readFileSync('dev.html', 'utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt', 'utf8').split(/\r?\n/).filter(Boolean);

assert.strictEqual(version, '1.2.2', 'repository governance contract targets v1.2.2');
assert(readme.includes('**Status:** v1.2.2'), 'README must identify v1.2.2 as current repository/public release line');
assert(readme.includes('locale-runtime-v122.js'), 'README must document the stable v1.2.2 locale owner');
assert(!readme.includes('├── i18n.js') && !readme.includes('├── i18n-runtime.js') && !readme.includes('├── i18n-content.js') && !readme.includes('├── ux-hotfix-v121.js'), 'README must not advertise retired localization layers');
assert(!index.includes('正式版 <b>v1.2.1</b>'), 'static footer must not advertise v1.2.1 after VERSION moved to 1.2.2');

assert(dev.includes('data-act="skill">技能 <span>K</span>'), 'dev shell must use current K skill control');
assert(dev.includes('J 攻击') && dev.includes('K 职业技能'), 'dev shell must describe current J/K combat controls');
assert(!dev.includes('quickdive-fab') && !dev.includes('快速下潜：<b>J</b>'), 'dev shell must not reuse J for obsolete quick-dive UI');
for (const f of ['equipment-system.js','town-system.js','commerce-system.js','forge-system.js','progression-system.js','content-system.js','combat-pressure.js','visual-polish.js','equipment-shop-ui.js','gameplay-tuning.js','defense-system.js','desktop-controls.js','combat-controls.js','challenge-pressure.js','runtime-bootstrap.js']) {
  assert(dev.includes(`<script src="${f}"></script>`), `dev shell missing current shared runtime layer: ${f}`);
}
assert(dev.includes('id="town-growth"') && dev.includes('data-service="market"'), 'dev town shell must retain the current service/progression structure');
assert(!manifest.includes('dev.html'), 'development harness must remain outside the production release package');

console.log('repository_governance_v122=PASS');
