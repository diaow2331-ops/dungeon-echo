/* Regression contract: utility NPCs must not occupy narrow dungeon chokepoints. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const listeners = {};
let persisted = 0;

// 7x7 map: a single-width corridor from x=1..3 opens into a 2x3 room at x=4..5.
const map = [
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,1,1,0],
  [0,1,1,1,1,1,0],
  [0,0,0,0,1,1,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
];
const npcs = [
  { type: 'shrine', used: false, x: 2, y: 3, fx: 2, fy: 3 },
  { type: 'shop', used: false, x: 3, y: 3, fx: 3, fy: 3 },
  { type: 'rest', used: true, x: 1, y: 3, fx: 1, fy: 3 },
];
const player = { x: 1, y: 2 };

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
    get mapGrid() { return map; },
    get player() { return player; },
    get monsters() { return []; },
    get items() { return []; },
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
ok(bridge && bridge.version === 'p0-v2', 'interaction pathing bridge boots');
ok(!npcs.some(n => n.type === 'rest'), 'consumed rest camp is removed before pathing');
const shrine = npcs.find(n => n.type === 'shrine');
const shop = npcs.find(n => n.type === 'shop');
ok(shrine && !(shrine.x === 2 && shrine.y === 3), 'unused shrine is moved out of the one-tile corridor');
ok(shop && !(shop.x === 3 && shop.y === 3), 'shop fallback spawn is moved out of the corridor');
ok(bridge.walkableNeighbors(map, shrine.x, shrine.y) >= 3, 'shrine lands on an open tile with at least three exits');
ok(bridge.walkableNeighbors(map, shop.x, shop.y) >= 3, 'shop lands on an open tile with at least three exits');
ok(!(shrine.x === shop.x && shrine.y === shop.y), 'relocated utility NPCs do not overlap');
ok(persisted === 1, 'combined cleanup/pathing repair persists once');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
