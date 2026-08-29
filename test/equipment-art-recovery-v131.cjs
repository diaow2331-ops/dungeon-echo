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
  return {
    sig: buf.subarray(0, 8).toString('hex'),
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length,
  };
}

const css = fs.readFileSync(path.join(root, 'game/ui/equipment-art-v13.css'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'game/core/production-bootstrap.js'), 'utf8');
const release = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8');
const weapons = pngInfo('art/equipment-weapons-v13.png');
const wearables = pngInfo('art/equipment-wearables-v13.png');

ok(weapons.sig === '89504e470d0a1a0a', 'weapon v13 sheet is a PNG');
ok(wearables.sig === '89504e470d0a1a0a', 'wearable v13 sheet is a PNG');
ok(weapons.width === 192 && weapons.height === 128, 'weapon sheet keeps 6x4 32px cells');
ok(wearables.width === 192 && wearables.height === 160, 'wearable sheet keeps 6x5 32px cells');
ok(weapons.bytes > 8000 && wearables.bytes > 8000, 'v13 sheets are non-placeholder assets');
const mappings = css.match(/\.loot-icon\[style\*="--ix:\d;--iy:\d"\]/g) || [];
ok(mappings.length === 26, 'all 26 equipment cells are statically remapped');
ok(!/--ix:3;--iy:2/.test(css) && !/--ix:0;--iy:3/.test(css), 'potion and teleport-scroll cells stay on canonical loot atlas');
ok(/installStaticEquipmentArt/.test(bootstrap) && /equipment-art-v13\.css/.test(bootstrap), 'production bootstrap installs the static equipment stylesheet');
ok(!/createElement\(['"]canvas['"]\)|requestAnimationFrame|setInterval/.test(css + bootstrap.match(/function installStaticEquipmentArt[\s\S]*?\n  }/)?.[0]), 'equipment art adds no Canvas or animation authority');
ok(/game\/ui\/equipment-art-v13\.css/.test(release) && /art\/equipment-weapons-v13\.png/.test(release) && /art\/equipment-wearables-v13\.png/.test(release), 'release allowlist includes recovered equipment art');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
