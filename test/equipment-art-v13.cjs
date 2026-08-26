'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

function pngInfo(rel) {
  const buf = fs.readFileSync(path.join(root, rel));
  const sig = buf.subarray(0, 8).toString('hex');
  return {
    sig,
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length,
  };
}

const visual = fs.readFileSync(path.join(root, 'visual-polish.js'), 'utf8');
const release = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8');
const weapons = pngInfo('art/equipment-weapons-v13.png');
const wearables = pngInfo('art/equipment-wearables-v13.png');

ok(weapons.sig === '89504e470d0a1a0a', 'weapon v13 sheet is a PNG');
ok(wearables.sig === '89504e470d0a1a0a', 'wearable v13 sheet is a PNG');
ok(weapons.width === 192 && weapons.height === 128, 'weapon sheet keeps the 6x4 32px-cell contract');
ok(wearables.width === 192 && wearables.height === 160, 'wearable sheet keeps the 6x5 32px-cell contract');
ok(weapons.bytes > 8000 && wearables.bytes > 8000, 'v13 sheets are non-placeholder art assets');
ok(/__DE_EQUIPMENT_ART_V13/.test(visual) && /version:\s*'v13'/.test(visual), 'visual layer declares equipment art v13');
const mapBody = visual.match(/const EQUIPMENT_ICON_MAP = Object\.freeze\(\[([\s\S]*?)\]\);/);
const mapped = mapBody ? (mapBody[1].match(/\[\d,\d,'(?:weapon|wearable)',\d,\d\]/g) || []).length : 0;
ok(mapped === 26, 'all 26 current equipment icon IDs are routed to v13 art');
ok(/equipment-weapons-v13\.png/.test(release) && /equipment-wearables-v13\.png/.test(release), 'release allowlist includes both v13 source sheets');
ok(!/healing-potion.*EQUIPMENT_ICON_MAP|teleport-scroll.*EQUIPMENT_ICON_MAP/.test(visual), 'consumables remain on the legacy loot atlas');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
