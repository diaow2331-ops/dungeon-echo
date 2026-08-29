'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel));
const text = rel => read(rel).toString('utf8');
const sha = rel => crypto.createHash('sha256').update(read(rel)).digest('hex');
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

const npc = text('art/town-npc-atlas-v1.svg');
const hero = 'art/hero-action-atlas-v2.svg';
ok(/width="192" height="192" viewBox="0 0 192 192"/.test(npc), 'town NPC atlas preserves 4x4 48px cell geometry');
ok(sha('art/town-npc-atlas-v1.svg') !== sha(hero), 'town NPC art is no longer an alias of hero action art');
ok(!/data:image\/png;base64/i.test(npc), 'town NPC atlas is an independent vector asset, not an embedded hero raster');
const live = [
  ['quartermaster', '0 0'],
  ['smith', '48 0'],
  ['provisioner', '0 48'],
  ['alchemist', '48 96'],
  ['oracle', '96 96'],
  ['portal-warden', '0 144'],
];
for (const [role, xy] of live) {
  const [x, y] = xy.split(' ');
  ok(npc.includes(`data-role="${role}" transform="translate(${x} ${y})"`), `${role} remains in its canonical runtime cell`);
}
ok((npc.match(/data-role=/g) || []).length === 16, 'all 16 atlas cells have explicit role identity');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
