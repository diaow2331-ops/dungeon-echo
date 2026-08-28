'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const version=fs.readFileSync('VERSION','utf8').trim();
const readme=fs.readFileSync('README.md','utf8');
const maintenance=fs.readFileSync('docs/MAINTENANCE.md','utf8');
const development=fs.readFileSync('docs/DEVELOPMENT.md','utf8');
const localization=fs.readFileSync('docs/LOCALIZATION.md','utf8');
const ai=fs.readFileSync('docs/AI_COLLABORATION.md','utf8');
const index=fs.readFileSync('index.html','utf8');
const english=fs.readFileSync('en/index.html','utf8');
const dev=fs.readFileSync('dev.html','utf8');
const runtime=fs.readFileSync('game/core/runtime-bootstrap.js','utf8');
const manifest=fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);
const rootJs=fs.readdirSync('.',{withFileTypes:true}).filter(entry=>entry.isFile()&&entry.name.endsWith('.js')).map(entry=>entry.name);
const localeOwners=['game/locale/fixed-locale-entry-v130.js','game/locale/stable-item-id-migration-v150.js','game/locale/core-screen-owner-v153.js','game/locale/town-canvas-locale-v153.js'];
const retiredRuntime=['i18n.js','i18n-runtime.js','i18n-content.js','ux-hotfix-v121.js','locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js'];

assert.strictEqual(version,'1.2.9','repository governance contract targets the current semantic release line');
assert(readme.includes('**Status:** v1.2.9'),'README must identify v1.2.9 as the semantic release line');
assert(readme.includes('https://play.91hwl.cn/dungeon-echo/en/'),'README must publish the fixed English route');
assert(readme.includes('game/core/')&&readme.includes('game/systems/')&&readme.includes('game/input/')&&readme.includes('game/locale/')&&readme.includes('game/ui/'),'README must expose organized runtime folders');
assert(readme.includes('archive/'),'README must explain historical code quarantine');
assert(readme.includes('docs/releases/'),'README must expose collected release history instead of loose root notes');
assert(readme.includes('docs/DEVELOPMENT.md')&&readme.includes('docs/MAINTENANCE.md'),'README source map must expose collected engineering docs');

assert.strictEqual(rootJs.length,0,`repository root must contain zero loose JavaScript files; found ${rootJs.join(', ')}`);
for(const retired of retiredRuntime){
  assert(fs.existsSync(path.join('archive','runtime',retired)),`retired runtime missing from archive: ${retired}`);
}
for(let patch=122;patch<=128;patch++){
  const stamp=`release-stamp-v${patch}.js`;
  assert(fs.existsSync(path.join('archive','release-stamps',stamp)),`historical release stamp missing from archive: ${stamp}`);
}
assert(fs.existsSync('game/core/release-stamp-v129.js'),'current release stamp must live with current core runtime');

for(const dir of ['game/core','game/systems','game/input','game/locale','game/ui']){
  assert(fs.existsSync(dir)&&fs.statSync(dir).isDirectory(),`organized runtime folder missing: ${dir}`);
}
assert(maintenance.includes('**v1.2.9**'),'maintenance guide must describe the current release architecture');
assert(maintenance.includes('Production localization is now **fixed-route and source-owned**'),'maintenance guide must name fixed-route localization ownership');
assert(maintenance.includes('must not patch `CanvasRenderingContext2D.prototype`'),'maintenance guide must preserve exact Canvas sink scoping');
assert(maintenance.includes('de-language-v1` is presentation state'),'maintenance guide must keep language outside gameplay save identity');

assert(development.includes('Production routes: `index.html` = fixed Chinese, `en/index.html` = fixed English'),'development guide must expose both fixed production routes');
assert(development.includes('game/core/game.js'),'development guide must document the organized core path');
assert(development.includes('translation-after-render stack'),'development guide must quarantine the retired locale architecture');
assert(development.includes('node test/final-fixed-locale-v153.cjs'),'development guide must expose the final locale contract');
assert(localization.includes('/dungeon-echo/en/'),'localization contract must use the fixed English route');
assert(localization.includes('must not patch `CanvasRenderingContext2D.prototype`'),'localization contract must scope Canvas ownership');

for(const retired of ['locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js']){
  assert(!runtime.includes(retired),`runtime must not load retired locale layer ${retired}`);
  assert(!manifest.some(file=>file===retired||file.endsWith('/'+retired)),`release manifest must not ship retired locale layer ${retired}`);
}
for(const owner of localeOwners){
  assert(runtime.includes(owner),`runtime missing fixed-route owner ${owner}`);
  assert(manifest.includes(owner),`release manifest missing fixed-route owner ${owner}`);
}
assert(/data-de-locale="zh-CN"/.test(index)&&/data-de-locale="en"/.test(english),'production entries must own explicit route locale identity');
assert(/<base href="\.\.\/">/.test(english),'English entry must share the root asset graph');
assert(!/[\u3400-\u9fff]/.test(english),'English static entry must contain no CJK presentation copy');
assert(index.includes('game/core/game.js?v=153')&&english.includes('game/core/game.js?v=153'),'production entries must boot organized core path');
assert(index.includes('game/input/combat-controls.js?v=153')&&english.includes('game/input/combat-controls.js?v=153'),'production entries must boot organized input path');
assert(!manifest.includes('dev.html'),'development harness must remain outside the production release package');
assert(dev.includes('data-act="skill">技能 <span>K</span>')&&dev.includes('J 攻击')&&dev.includes('K 职业技能'),'dev shell must retain current J/K controls');
assert(ai.includes('current active-skill input is **K**'),'AI collaboration history must distinguish current K from historical C');

console.log('repository_governance_current=PASS');
