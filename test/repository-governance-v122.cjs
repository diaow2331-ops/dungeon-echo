'use strict';
const fs=require('fs'),assert=require('assert');
const version=fs.readFileSync('VERSION','utf8').trim();
const readme=fs.readFileSync('README.md','utf8');
const maintenance=fs.readFileSync('MAINTENANCE.md','utf8');
const development=fs.readFileSync('DEVELOPMENT.md','utf8');
const localization=fs.readFileSync('docs/LOCALIZATION.md','utf8');
const ai=fs.readFileSync('AI_COLLABORATION.md','utf8');
const index=fs.readFileSync('index.html','utf8');
const english=fs.readFileSync('en/index.html','utf8');
const dev=fs.readFileSync('dev.html','utf8');
const runtime=fs.readFileSync('runtime-bootstrap.js','utf8');
const manifest=fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);

assert.strictEqual(version,'1.2.8','repository governance contract targets the current semantic release line');
assert(readme.includes('**Status:** v1.2.8'),'README must identify v1.2.8 as the semantic release line');
assert(readme.includes('https://play.91hwl.cn/dungeon-echo/en/'),'README must publish the fixed English route');
assert(readme.includes('core-screen-owner-v153.js')&&readme.includes('town-canvas-locale-v153.js'),'README must document final fixed-route render owners');
assert(readme.includes('locale-event-owner-v130.js')&&readme.includes('no longer loaded or shipped'),'README must record the retired translation-after-render stack as history only');

assert(maintenance.includes('post-v1.2.8 fixed-route convergence'),'maintenance guide must describe the current post-release architecture');
assert(maintenance.includes('Production localization is now **fixed-route and source-owned**'),'maintenance guide must name fixed-route localization ownership');
assert(maintenance.includes('must not patch `CanvasRenderingContext2D.prototype`'),'maintenance guide must preserve exact Canvas sink scoping');
assert(maintenance.includes('de-language-v1` is presentation state'),'maintenance guide must keep language outside gameplay save identity');

assert(development.includes('Production routes: `index.html` = fixed Chinese, `en/index.html` = fixed English'),'development guide must expose both fixed production routes');
assert(development.includes('translation-after-render stack'),'development guide must quarantine the retired locale architecture');
assert(development.includes('node test/final-fixed-locale-v153.cjs'),'development guide must expose the final locale contract');
assert(localization.includes('/dungeon-echo/en/'),'localization contract must use the fixed English route');
assert(localization.includes('must not patch `CanvasRenderingContext2D.prototype`'),'localization contract must scope Canvas ownership');

for(const retired of ['locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js']){
  assert(!runtime.includes(retired),`runtime must not load retired locale layer ${retired}`);
  assert(!manifest.includes(retired),`release manifest must not ship retired locale layer ${retired}`);
}
for(const owner of ['fixed-locale-entry-v130.js','stable-item-id-migration-v150.js','core-screen-owner-v153.js','town-canvas-locale-v153.js']){
  assert(runtime.includes(owner),`runtime missing fixed-route owner ${owner}`);
  assert(manifest.includes(owner),`release manifest missing fixed-route owner ${owner}`);
}
assert(/data-de-locale="zh-CN"/.test(index)&&/data-de-locale="en"/.test(english),'production entries must own explicit route locale identity');
assert(/<base href="\.\.\/">/.test(english),'English entry must share the root asset graph');
assert(!/[\u3400-\u9fff]/.test(english),'English static entry must contain no CJK presentation copy');
assert(!manifest.includes('dev.html'),'development harness must remain outside the production release package');
assert(dev.includes('data-act="skill">技能 <span>K</span>')&&dev.includes('J 攻击')&&dev.includes('K 职业技能'),'dev shell must retain current J/K controls');
assert(ai.includes('current active-skill input is **K**'),'AI collaboration history must distinguish current K from historical C');

console.log('repository_governance_current=PASS');