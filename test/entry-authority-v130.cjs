'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const expectedScripts = [
  'game/core/production-bootstrap.js?v=169',
  'profiles/classic-100.profile.js?v=169',
  'game/locale/locale-data-v134.js?v=169',
  'game/core/game.js?v=169',
  'game/locale/core-locale-data-v139.js?v=169',
  'game/input/desktop-controls.js?v=169',
  'game/core/runtime-bootstrap.js?v=169',
];

for (const rel of ['index.html','en/index.html']) {
  const html = read(rel);
  const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(blocks.length, expectedScripts.length, `${rel}: unexpected script count`);
  const srcs = blocks.map(m => {
    const src = m[1].match(/\bsrc=["']([^"']+)["']/i);
    assert(src, `${rel}: inline script is forbidden`);
    assert.equal(m[2].trim(), '', `${rel}: script body must stay empty`);
    return src[1];
  });
  assert.deepEqual(srcs, expectedScripts, `${rel}: production script authority/order changed`);
  assert(!/\son(?:click|keydown|keyup|keypress|pointerdown|pointerup|touchstart|touchend|mousedown|mouseup)\s*=/i.test(html), `${rel}: inline gameplay event handler is forbidden`);
  assert(!/archive\/quarantine-v130|game\/systems\//.test(html), `${rel}: quarantine/wrapper runtime referenced`);
}

const profile = read('profiles/classic-100.profile.js');
assert(profile.includes("window.DE_PROFILES['classic-100']"), 'classic profile registration missing');
assert(!/addEventListener|removeEventListener|getContext\s*\(|localStorage|sessionStorage|DE_TEST/.test(profile), 'profile must remain data/config only');

const runtime = read('game/core/runtime-bootstrap.js');
for (const token of [
  'game/core/release-stamp-v130.js',
  'game/locale/fixed-locale-entry-v130.js',
  'game/ui/responsive-final-v154.js',
  'game/ui/help-copy-v126.js',
]) assert(runtime.includes(token), `approved DOM follower missing: ${token}`);
assert.equal((runtime.match(/fresh\('/g) || []).length, 4, 'runtime follower list changed; review authority before adding a follower');
assert(!/game\/systems\/|archive\/|art-runtime|combat-controls|town-workspace/.test(runtime), 'runtime loader references non-authoritative follower');

console.log('entry_authority_v130=PASS');
