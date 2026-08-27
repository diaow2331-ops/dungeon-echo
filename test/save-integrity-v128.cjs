'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'save-integrity-system.js'), 'utf8');

function storage(seed = {}) {
  const map = new Map(Object.entries(seed).map(([k,v]) => [k, String(v)]));
  return {
    getItem(k){ return map.has(k) ? map.get(k) : null; },
    setItem(k,v){ map.set(k, String(v)); },
    removeItem(k){ map.delete(k); },
    has(k){ return map.has(k); },
    value(k){ return map.get(k); },
    map,
  };
}

function blankGrid(value) {
  return Array.from({length:28}, () => Array.from({length:40}, () => value));
}

function validRun() {
  return {
    version:2, mode:'classic', profileId:'classic-100', state:'playing', classId:'ranger',
    seed:'safe-seed', rng:123456, depth:7, turns:42,
    player:{x:2,y:3,hp:20,hpBase:28,atkBase:3,inv:[],equip:{}},
    map:blankGrid(1), explored:blankGrid(false),
    monsters:[], items:[], npcs:[], shopStock:[], traps:[], secrets:[], floorCleared:false,
    logLines:[{text:'Safe log line',cls:'good'}]
  };
}

function validMeta() {
  return {v:1,classId:'ranger',gold:20,bag:[],stash:[],equip:{},talents:[]};
}

function execute(initial) {
  const localStorage = storage(initial);
  const sessionStorage = storage();
  const window = {};
  const context = {window, localStorage, sessionStorage, console, Object, Set, JSON, Number, Array};
  vm.createContext(context);
  vm.runInContext(src, context, {filename:'save-integrity-system.js'});
  return {window, localStorage, sessionStorage};
}

{
  const runText = JSON.stringify(validRun());
  const metaText = JSON.stringify(validMeta());
  const out = execute({'de-run-v6':runText,'de-greedy-meta-v1':metaText,'de-greedy-on-v1':'1','other-key':'keep'});
  assert.equal(out.localStorage.value('de-run-v6'), runText, 'valid run must remain byte-for-byte untouched');
  assert.equal(out.localStorage.value('de-greedy-meta-v1'), metaText, 'valid meta must remain byte-for-byte untouched');
  assert.equal(out.localStorage.value('de-greedy-on-v1'), '1');
  assert.equal(out.localStorage.value('other-key'), 'keep', 'unrelated storage must not be touched');
  assert(out.window.__DE_SAVE_INTEGRITY_V128, 'guard marker must install');
  assert.equal(out.window.__DE_SAVE_INTEGRITY_V128.version, 'v1');
}

{
  const bad = validRun();
  bad.logLines = [{text:'<img src=x onerror=alert(1)>',cls:'good'}];
  const out = execute({'de-run-v6':JSON.stringify(bad)});
  assert(!out.localStorage.has('de-run-v6'), 'HTML-like run text must be rejected before game boot');
  assert(out.window.__DE_SAVE_INTEGRITY_V128.report.removed.some(row => row.key === 'de-run-v6'));
}

{
  const bad = validRun();
  bad.map = [[1]];
  const out = execute({'de-run-v6':JSON.stringify(bad)});
  assert(!out.localStorage.has('de-run-v6'), 'malformed map must be rejected before restore');
}

{
  const bad = validRun();
  bad.player.x = 999;
  const out = execute({'de-run-v6':JSON.stringify(bad)});
  assert(!out.localStorage.has('de-run-v6'), 'out-of-bounds player position must be rejected');
}

{
  const bad = validMeta();
  bad.bag = [{name:'\"><img src=x>',slot:'weapon'}];
  const out = execute({'de-greedy-meta-v1':JSON.stringify(bad)});
  assert(!out.localStorage.has('de-greedy-meta-v1'), 'unsafe town item name must be rejected');
}

{
  const out = execute({'de-run-v6':'{broken','de-greedy-on-v1':'yes'});
  assert(!out.localStorage.has('de-run-v6'), 'invalid JSON must be removed');
  assert(!out.localStorage.has('de-greedy-on-v1'), 'invalid Greedy toggle must be removed');
}

assert(src.includes("const RUN_KEY = 'de-run-v6'"));
assert(src.includes("const META_KEY = 'de-greedy-meta-v1'"));
assert(src.includes('validGrid(raw.map, false)'));
assert(src.includes('validGrid(raw.explored, true)'));
assert(src.includes('FORBIDDEN_TEXT'));
assert(!/setInterval\s*\(/.test(src));

console.log('RESULT  Dungeon Echo v1.2.8 save integrity preflight PASS');
