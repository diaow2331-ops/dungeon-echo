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
  'game/domain/content/content-rules-v130.js?v=169',
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

const bootstrap = read('game/core/production-bootstrap.js');
const core = read('game/core/game.js');
assert(bootstrap.includes("const FRESH_BUTTON_ID = 'btn-fresh-adventure'"), 'fresh adventure owner id missing');
assert(bootstrap.includes("button.id = FRESH_BUTTON_ID"), 'bootstrap must synchronously remove the historical btn-new identity before core loads');
assert(bootstrap.includes("button.addEventListener('click', beginFreshAdventure)"), 'bootstrap must be the fresh-adventure click owner');
assert(bootstrap.includes("setTimeout(enterFreshClassSelect, 0)"), 'fresh reload must hand off through the canonical title command after ordered scripts load');
assert(bootstrap.includes("new KeyboardEvent('keydown'"), 'fresh reload must enter class select through canonical keyboard input');
assert(!/stopImmediatePropagation|DE_TEST|button\.click\s*\(/.test(bootstrap), 'new adventure owner must not use listener priority, test hooks, or synthetic button recursion');
assert(core.includes("if ($('btn-new')) $('btn-new').addEventListener"), 'historical core listener signature changed; re-review the synchronous claim before removing this transitional guard');
assert(!core.includes('btn-fresh-adventure'), 'core must not become a second owner of the fresh-adventure DOM command');
assert(bootstrap.indexOf('claimFreshAdventureButton();') < bootstrap.indexOf('window.__DE_PRODUCTION_AUTHORITY_V130'), 'fresh-adventure DOM claim must happen synchronously during bootstrap');

const runtime = read('game/core/runtime-bootstrap.js');
for (const token of [
  'game/core/release-stamp-v130.js',
  'game/locale/fixed-locale-entry-v130.js',
  'game/ui/responsive-final-v154.js',
  'game/ui/help-copy-v126.js',
]) assert(runtime.includes(token), `approved DOM follower missing: ${token}`);
assert.equal((runtime.match(/fresh\('/g) || []).length, 4, 'runtime follower list changed; review authority before adding a follower');
assert(!/game\/systems\/|archive\/|art-runtime|combat-controls|town-workspace|btn-fresh-adventure/.test(runtime), 'runtime loader references non-authoritative follower or fresh-adventure owner');

console.log('entry_authority_v130=PASS');
