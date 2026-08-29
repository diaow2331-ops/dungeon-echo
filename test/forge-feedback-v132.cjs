'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const src = read('game/ui/forge-feedback-v132.js');
const core = read('game/core/game.js');
const runtime = read('game/core/runtime-bootstrap.js');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/);
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

ok(/const MAX_FORGE = 5/.test(src), 'feedback matches canonical +5 forge cap');
ok(/function snapshot\(item\)/.test(src) && /stats: Object\.freeze/.test(src) && /gold: Math\.max/.test(src), 'feedback snapshots stats and Gold before core mutation');
ok(/document\.addEventListener\('click', beforeForge, true\)/.test(src), 'capture phase records pre-forge state without owning action');
ok(/document\.addEventListener\('click', afterForge, false\)/.test(src), 'bubble phase observes completed canonical forge');
ok(/after\.forge <= record\.before\.forge/.test(src), 'toast appears only after a real forge level increase');
ok(/record\.before\.gold - after\.gold/.test(src), 'feedback reports actual Gold spent');
ok(/statDelta\(record\.before\.stats, after\.stats\)/.test(src), 'feedback reports actual stat deltas');
ok(/锻造 \+\$\{level\}\/\$\{MAX_FORGE\}/.test(src) && /Forge \+\$\{level\}\/\$\{MAX_FORGE\}/.test(src), 'persistent forge stage is bilingual +N/5');
ok(/强化成功/.test(src) && /Forge success/.test(src) && /消耗/.test(src) && /Spent/.test(src), 'success feedback is bilingual');

ok(!/refinePath|refineName|masterworked|DE_FORGE_REFINEMENT|data-de-refine/.test(src), 'feedback does not claim unrecovered refinement or masterwork mechanics');
ok(!/localStorage/.test(src), 'feedback writes no storage');
ok(!/getContext\(|requestAnimationFrame|MutationObserver|setInterval\(/.test(src), 'feedback owns no Canvas, RAF, observer or polling interval');
ok(!/preventDefault|stopPropagation|stopImmediatePropagation/.test(src), 'feedback observes input without capturing control flow');
ok(!/api\.[A-Za-z_$][\w$]*\s*=(?!=)/.test(src), 'feedback never assigns into gameplay APIs');
ok(!/\.gold\s*[-+*/]?=|\.forge\s*[-+*/]?=|\.stats\s*=/.test(src), 'feedback does not mutate item or economy state');

ok(/const FORGE_MAX = 5/.test(core), 'core remains forge cap authority');
ok(/function forgeItem\(where, i\)/.test(core), 'core remains forge action authority');
ok(runtime.includes('game/ui/forge-feedback-v132.js'), 'runtime loads current forge feedback');
ok(/forgeFeedback:'game\/ui\/forge-feedback-v132\.js'/.test(runtime), 'runtime declares forge feedback boundary');
ok(manifest.includes('game/ui/forge-feedback-v132.js'), 'release ships forge feedback');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
