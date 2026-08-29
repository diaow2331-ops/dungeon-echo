'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8');
let pass=0, fail=0;
const ok=(cond,name)=>{if(cond){pass++;console.log('  PASS '+name)}else{fail++;console.log('  FAIL '+name)}};

ok(/const SAVE_KEY = 'de-run-v6'/.test(core), 'run save key remains de-run-v6');
ok(/const SAVE_VERSION = 2/.test(core), 'run save schema remains version 2');
ok(/const META_KEY = 'de-greedy-meta-v1'/.test(core), 'meta save key remains stable');
ok(/function sanitizeMeta\(raw\)/.test(core), 'core owns meta sanitization');
ok(/function persistRun\(\)/.test(core), 'core owns run persistence');
ok(/function peekRun\(\)/.test(core), 'core owns guarded run reads');
ok(/function restoreRun\(raw\)/.test(core), 'core owns run restoration');
ok(/raw\.version !== SAVE_VERSION/.test(core), 'run reads reject wrong save versions');
ok(/raw\.profileId !== PROFILE_ID/.test(core), 'run reads reject wrong profile identity');
ok(/RUN_MODE_GREEDY/.test(core) && /RUN_MODE_CLASSIC/.test(core), 'classic and greedy run modes remain explicit');
ok(/localStorage\.setItem\(SAVE_KEY, JSON\.stringify\(blob\)\)/.test(core), 'run blob is persisted through the canonical save key');
ok(/localStorage\.removeItem\(SAVE_KEY\)/.test(core), 'core owns run deletion');
ok(/setSeed\(raw\.seed\)/.test(core) && /rngFn\.setState\(raw\.rng\)/.test(core), 'restore recovers deterministic run seed and RNG state');
ok(/skillFollowup = null;/.test(core), 'transient combat follow-up is cleared before restore');
ok(!fs.existsSync(path.join(root,'game/core/save-integrity-system.js')), 'retired save-integrity wrapper is absent');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
