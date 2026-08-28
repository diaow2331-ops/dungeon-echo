const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const runtime = read('game/ui/art-runtime-v2.js');
const staticFiles = read('ops/release/static-files.txt');

for (const rel of [
  'art/runtime/boss-guardian-atlas-v3.png',
  'art/runtime/final-boss-v3.png',
]) {
  assert(fs.existsSync(path.join(root, rel)), `missing runtime art: ${rel}`);
  assert(staticFiles.includes(rel), `release boundary missing: ${rel}`);
}

assert.match(runtime, /boss-guardian-atlas-v3\.png/);
assert.match(runtime, /final-boss-v3\.png/);
assert.match(runtime, /10:3[\s\S]*20:4[\s\S]*30:5[\s\S]*40:8[\s\S]*50:1[\s\S]*60:13[\s\S]*70:9[\s\S]*80:6[\s\S]*90:14/);
assert.match(runtime, /guardianDirect:Object\.keys\(GUARDIAN_CELL\)\.length/);
assert.match(runtime, /finalBossDirect:1/);
assert.match(runtime, /version:'v3-unified'/);
assert.match(runtime, /gameplayMutation:false/);

console.log('RESULT  art runtime v3 boss + guardian admission PASS');
