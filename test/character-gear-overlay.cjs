'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'visual-polish.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

ok(/__DE_CHARACTER_GEAR_OVERLAY/.test(src) && /version:\s*'v1'/.test(src),
  'character gear overlay declares a stable v1 marker');
const map = src.match(/const EQUIPMENT_SOURCE_BY_ICON = Object\.freeze\(\{([\s\S]*?)\}\);/);
const iconCount = map ? (map[1].match(/'[^']+'\s*:\s*\['(?:weapon|wearable)'/g) || []).length : 0;
ok(iconCount === 26, 'all 26 current equipment icons have character-art sources');
for (const slot of ['weapon', 'armor', 'helmet', 'boots'])
  ok(new RegExp(`eq\\.${slot}`).test(src), `${slot} is rendered as a visible equipped layer`);
ok(/eq\.ring/.test(src) && /RARITY_GLOW/.test(src), 'ring becomes a rarity-aware character effect');
ok(/eq\.amulet/.test(src) && /Math\.PI\s*\/\s*4/.test(src), 'amulet becomes a visible chest-gem effect');
ok(/drawCharacterGear\(now, d\)/.test(src), 'gear rendering is wired into the dungeon paint pass');
ok(/imageSmoothingEnabled\s*=\s*false/.test(src), 'small v13 gear stays crisp when scaled on the hero');
ok(!/persistRun|endTurn|localStorage\.setItem|api\.player\s*=/.test(
  (src.match(/function drawCharacterGear[\s\S]*?\n  \}/) || [''])[0]),
  'gear overlay remains presentation-only');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
