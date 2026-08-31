'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const version = read('VERSION').trim();
const generation = String(JSON.parse(read('docs/authority-map-v130.json')).cacheGeneration);
const stamped = rel => `${rel}?v=${generation}`;
const releaseStampPath = `game/core/release-stamp-v${version.replace(/\./g, '')}.js`;

const expectedScripts = [
  'game/core/production-bootstrap.js',
  'profiles/classic-100.profile.js',
  'game/locale/locale-data-v134.js',
  'game/domain/content/content-rules-v130.js',
  'game/domain/inventory/equipment-rules-v130.js',
  'game/domain/inventory/set-rules-v180.js',
  'game/domain/economy/economy-rules-v130.js',
  'game/domain/town/town-rules-v130.js',
  'game/domain/town/town-growth-rules-v180.js',
  'game/domain/expedition/expedition-rules-v170.js',
  'game/domain/progression/progression-rules-v130.js',
  'game/domain/combat/combat-rules-v130.js',
  'game/core/game.js',
  'game/locale/core-locale-data-v139.js',
  'game/input/desktop-controls.js',
  'game/core/runtime-bootstrap.js',
].map(stamped);

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
assert(bootstrap.includes("window.__DE_FRESH_CLASS_SELECT_PENDING = true") && core.includes("window.addEventListener('de:core-locale-ready'") && core.includes('showClassSelect();'), 'fresh reload must wait for canonical locale readiness before rendering class select');
assert(!bootstrap.includes('setTimeout(enterFreshClassSelect, 0)'), 'fresh class-select handoff must not depend on a zero-delay timer race');
assert(!bootstrap.includes("new KeyboardEvent('keydown'"), 'fresh reload must not synthesize keyboard input before core is ready');
assert(!/stopImmediatePropagation|DE_TEST|button\.click\s*\(/.test(bootstrap), 'new adventure owner must not use listener priority, test hooks, or synthetic button recursion');
assert(core.includes("if ($('btn-new')) $('btn-new').addEventListener"), 'historical core listener signature changed; re-review the synchronous claim before removing this transitional guard');
assert(!core.includes('btn-fresh-adventure'), 'core must not become a second owner of the fresh-adventure DOM command');
assert(bootstrap.indexOf('claimFreshAdventureButton();') < bootstrap.indexOf('window.__DE_PRODUCTION_AUTHORITY_V130'), 'fresh-adventure DOM claim must happen synchronously during bootstrap');

const runtime = read('game/core/runtime-bootstrap.js');
for (const token of [
  releaseStampPath,
  'game/locale/fixed-locale-entry-v130.js',
  'game/ui/responsive-final-v154.js',
  'game/ui/help-copy-v126.js',
  'game/ui/theme-atmosphere-v131.js',
  'game/ui/adaptive-bgm-v132.js',
  'game/ui/forge-feedback-v132.js',
]) assert(runtime.includes(token), `approved presentation follower missing: ${token}`);
assert.equal((runtime.match(/fresh\('/g) || []).length, 7, 'runtime presentation follower list changed; review authority before adding a follower');
assert(runtime.includes("followers:'presentation-only'"), 'runtime follower boundary must remain presentation-only');
assert(!/game\/systems\/|archive\/|art-runtime|combat-controls|town-workspace|btn-fresh-adventure/.test(runtime), 'runtime loader references non-authoritative follower or fresh-adventure owner');

console.log('entry_authority_v130=PASS');
