'use strict';
const fs = require('fs');
const assert = require('assert');

const version = fs.readFileSync('VERSION', 'utf8').trim();
const readme = fs.readFileSync('README.md', 'utf8');
const maintenance = fs.readFileSync('MAINTENANCE.md', 'utf8');
const roadmap = fs.readFileSync('PRODUCTION_ROADMAP.md', 'utf8');
const development = fs.readFileSync('DEVELOPMENT.md', 'utf8');
const ai = fs.readFileSync('AI_COLLABORATION.md', 'utf8');
const xLaunch = fs.readFileSync('docs/X_LAUNCH_CHECKLIST.md', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const dev = fs.readFileSync('dev.html', 'utf8');
const runtime = fs.readFileSync('runtime-bootstrap.js', 'utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt', 'utf8').split(/\r?\n/).filter(Boolean);

assert.strictEqual(version, '1.2.3', 'repository governance contract targets v1.2.3');
assert(readme.includes('**Status:** v1.2.3'), 'README must identify v1.2.3 as current repository release line');
assert(readme.includes('locale-runtime-v122.js'), 'README must document the stable locale owner');
assert(!readme.includes('├── i18n.js') && !readme.includes('├── i18n-runtime.js') && !readme.includes('├── i18n-content.js') && !readme.includes('├── ux-hotfix-v121.js'), 'README must not advertise retired localization layers');
assert(!readme.includes('mobile-visual-final-v123.js'), 'README must not document a discarded hotfix layer');

assert(maintenance.includes('**v1.2.3**'), 'maintenance guide must identify v1.2.3 as current contract');
assert(maintenance.includes('`locale-runtime-v122.js` is the current language owner'), 'maintenance guide must name the current locale owner');
assert(maintenance.includes('deliberately not exposed on the mobile D-pad'), 'maintenance guide must preserve the mobile wait-control decision');
assert(!maintenance.includes('Frozen release candidate: **v1.2.0**'), 'maintenance guide must not freeze current state at v1.2.0');
assert(!maintenance.includes('`i18n.js` is the language owner'), 'maintenance guide must not restore the retired locale owner');

assert(roadmap.includes('当前仓库基线：**v1.2.3**'), 'roadmap must start from v1.2.3');
assert(roadmap.includes('仓库治理 → 分支收束 → 91hwl 网站展示'), 'roadmap must preserve the post-game governance/site sequence');
assert(roadmap.includes('美术线到此收尾'), 'roadmap must keep the broad art pass closed');
assert(roadmap.includes('v1.2.3 移除 PC / 手机主角常驻光圈'), 'roadmap must record the final visual-device defect fix');
assert(!roadmap.includes('v1.2.0 已冻结为发布候选'), 'roadmap must not advertise v1.2.0 as current candidate');

assert(development.includes('Attack: **J**') && development.includes('Skill: **K** + Mana'), 'development guide must expose the current J/K contract');
assert(development.includes('Localization owner: `locale-runtime-v122.js`'), 'development guide must expose the current locale owner');
assert(development.includes('The old C-skill / J-quick-dive UI is also retired'), 'development guide must explicitly quarantine the old control contract');

assert(ai.includes('current active-skill input is **K**'), 'AI collaboration history must distinguish current K from historical C');
assert(ai.includes('v1.2.2 art/UX pass is treated as the end of this broad game-polish cycle'), 'AI collaboration record must preserve the broad art-closure provenance');

assert(xLaunch.includes('standard non-Premium X account'), 'X launch plan must target the actual standard-account publishing constraint');
assert(xLaunch.includes('Preferred four-image set'), 'X launch plan must prioritize a media-first four-image package');
assert(!xLaunch.includes('Long-form story / X Article'), 'X launch plan must not depend on Premium Article publishing');

assert(runtime.includes('release-stamp-v123.js'), 'runtime must expose the current release stamp');
assert(!runtime.includes('mobile-visual-final-v123.js'), 'runtime must not accumulate a redundant finalizer layer');
assert(!index.includes('正式版 <b>v1.2.1</b>'), 'static footer must not regress to v1.2.1');
assert(dev.includes('data-act="skill">技能 <span>K</span>'), 'dev shell must use current K skill control');
assert(dev.includes('J 攻击') && dev.includes('K 职业技能'), 'dev shell must describe current J/K combat controls');
assert(!dev.includes('quickdive-fab') && !dev.includes('快速下潜：<b>J</b>'), 'dev shell must not reuse J for obsolete quick-dive UI');
for (const f of ['equipment-system.js','town-system.js','commerce-system.js','forge-system.js','progression-system.js','content-system.js','combat-pressure.js','visual-polish.js','equipment-shop-ui.js','gameplay-tuning.js','defense-system.js','desktop-controls.js','combat-controls.js','challenge-pressure.js','runtime-bootstrap.js']) {
  assert(dev.includes(`<script src="${f}"></script>`), `dev shell missing current shared runtime layer: ${f}`);
}
assert(dev.includes('id="town-growth"') && dev.includes('data-service="market"'), 'dev town shell must retain the current service/progression structure');
assert(!manifest.includes('dev.html'), 'development harness must remain outside the production release package');
assert(manifest.includes('release-stamp-v123.js'), 'production manifest must include the current release stamp');
assert(!manifest.includes('mobile-visual-final-v123.js'), 'production manifest must not include discarded hotfix layers');

console.log('repository_governance_current=PASS');
