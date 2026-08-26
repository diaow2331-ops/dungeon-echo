/* Regression contract: consumed one-shot dungeon NPCs must not remain collision blockers. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const listeners = {};
let persisted = 0;
const npcs = [
  { type: 'shrine', used: true, x: 1, y: 1 },
  { type: 'rest', used: true, x: 2, y: 1 },
  { type: 'shop', used: true, x: 3, y: 1 },
  { type: 'shrine', used: false, x: 4, y: 1 },
];

global.document = {
  readyState: 'complete',
  head: { appendChild() {} },
  createElement() { return { style: {}, set id(_v) {}, appendChild() {} }; },
  addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
};
global.localStorage = { getItem() { return null; }, setItem() {} };
global.window = {
  DE_TEST: {
    profileId: 'classic-100',
    state: 'playing',
    get npcs() { return npcs; },
    get meta() { return null; },
    persistRun() { persisted++; },
  },
  addEventListener() {},
};
global.queueMicrotask = global.queueMicrotask || (fn => Promise.resolve().then(fn));

vm.runInThisContext(fs.readFileSync(path.join(root, 'production-bootstrap.js'), 'utf8'), { filename: 'production-bootstrap.js' });

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

const bridge = window.__DE_DISPOSABLE_NPC_CLEANUP;
ok(bridge && bridge.version === 'p0-v1', 'disposable NPC cleanup boots');
ok(npcs.length === 2, 'already-used shrine and rest are removed at install');
ok(npcs.some(n => n.type === 'shop'), 'repeatable shop NPC is preserved');
ok(npcs.some(n => n.type === 'shrine' && !n.used), 'unused shrine remains interactable');
ok(persisted === 1, 'cleanup persists the collision-state repair');

(async () => {
  const shrine = npcs.find(n => n.type === 'shrine');
  shrine.used = true;
  const click = (listeners.click || [])[0];
  if (click) click({ target: null });
  await new Promise(resolve => queueMicrotask(resolve));
  ok(!npcs.some(n => n.type === 'shrine'), 'newly consumed shrine clears after the interaction event');
  ok(persisted === 2, 'post-interaction cleanup persists exactly once');
  console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
