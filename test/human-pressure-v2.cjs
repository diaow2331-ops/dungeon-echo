'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'combat-pressure.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const release = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8');
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } };

ok(/__DE_HUMAN_PRESSURE_V2/.test(src) && /version:\s*'v2'/.test(src), 'human pressure v2 marker exists');
ok(/depthScaleMax\s*=\s*0\.50/.test(src) && /eliteAtkMult\s*=\s*1\.45/.test(src) && /eliteHpMult\s*=\s*2\.20/.test(src), 'ordinary and elite growth rises moderately');
const rows = [...src.matchAll(/\b(10|20|30|40|50|60|70|80|90|100):\s*\{\s*hp:\s*(\d+),\s*atk:\s*(\d+),\s*def:\s*(\d+)/g)].map(m => ({ d:+m[1], hp:+m[2], atk:+m[3], def:+m[4] })).sort((a,b)=>a.d-b.d);
ok(rows.length === 10, 'all nine guardians and final boss have explicit targets');
ok(rows.every((r,i) => i === 0 || (r.hp > rows[i-1].hp && r.atk > rows[i-1].atk && r.def > rows[i-1].def)), 'guardian hp/atk/def pressure increases monotonically');
ok(rows.length && rows[rows.length-1].atk >= 100 && rows[rows.length-1].hp >= 2000, 'final boss is aligned to endgame gear scale');
ok(/base\.armorBreak\s*=\s*true/.test(src) && /m\.armorBreak\s*=\s*true/.test(src), 'dangerous archetypes and guardians receive readable armor-break capability');
ok(/if \(min >= 50/.test(src) && /depth >= 30 && m\.elite/.test(src), 'armor-break is concentrated in deep/heavy/elite threats rather than every monster');
ok(/function pierceChanceOf\(\) \{ return 0; \}/.test(core), 'hidden random pierce remains disabled');
ok(/破甲蓄力/.test(core) && /下一回合/.test(core) && /蓄力落空/.test(core), 'armor-break keeps a full readable counterplay turn');
ok(!/player\.hp\s*=|player\.hpBase\s*=|player\.atkBase\s*=|player\.flatDr\s*=|player\.equip\s*=/.test(src), 'pressure module does not nerf player stats or equipment');
ok(/content-system\.js"><\/script>\s*<script src="combat-pressure\.js"><\/script>/.test(html), 'pressure tuning loads after guardian content ownership');
ok(/combat-pressure\.js/.test(release), 'release allowlist ships human pressure tuning');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
