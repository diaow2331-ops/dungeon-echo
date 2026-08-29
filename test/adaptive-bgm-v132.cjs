'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const bgm = read('game/ui/adaptive-bgm-v132.js');
const runtime = read('game/core/runtime-bootstrap.js');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/);
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

for (const scene of ['title','town','dungeon','deep','guardian','boss'])
  ok(new RegExp(`${scene}:\\s*Object\\.freeze\\(\\{`).test(bgm), `scene exists: ${scene}`);
ok(/const DEFAULT_VOLUME = 0\.30/.test(bgm), 'music defaults to the historical 30% mix target');
ok(/const LOOKAHEAD = 0\.20/.test(bgm) && /const TICK_MS = 80/.test(bgm), 'short WebAudio look-ahead ticker is explicit');
ok(/setTimeout\(tick, TICK_MS\)/.test(bgm) && /clearTimeout\(timer\)/.test(bgm), 'ticker has explicit start/stop lifecycle');
ok(/document\.hidden/.test(bgm) && /pagehide/.test(bgm) && /beforeunload/.test(bgm), 'ticker follows page lifecycle');
ok(/music\.connect\(master\);\s*master\.connect\(ctx\.destination\)/.test(bgm), 'BGM owns only its private music graph');
ok(!/AudioNode\.prototype|prototype\.connect|MIXER_MARK|__DE_AUDIO_MIXER/.test(bgm), 'retired SFX interception does not return');
ok(!/getContext\(|requestAnimationFrame|setInterval\(/.test(bgm), 'BGM owns no Canvas, RAF or polling interval');
ok(!/localStorage/.test(bgm), 'BGM writes no gameplay or presentation storage');
ok(!/preventDefault|stopPropagation|stopImmediatePropagation/.test(bgm), 'BGM observes existing mute/unlock input without capturing it');
ok(!/api\.[A-Za-z_$][\w$]*\s*=/.test(bgm), 'BGM never assigns into DE_TEST gameplay APIs');
ok(/m\.boss/.test(bgm) && /m\.midBoss/.test(bgm) && /api\.depth/.test(bgm), 'scene selection reads canonical encounter/depth state');
ok(runtime.includes('game/ui/adaptive-bgm-v132.js'), 'runtime bootstrap loads adaptive BGM');
ok(/followers:'presentation-only'/.test(runtime) && /audioFollower:'game\/ui\/adaptive-bgm-v132\.js'/.test(runtime), 'runtime declares bounded audio follower authority');
ok(manifest.includes('game/ui/adaptive-bgm-v132.js'), 'release manifest ships adaptive BGM');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
