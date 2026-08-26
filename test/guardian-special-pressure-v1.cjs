'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const pressure = fs.readFileSync(path.join(root, 'combat-pressure.js'), 'utf8');
const content = fs.readFileSync(path.join(root, 'content-system.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } };

ok(/__DE_GUARDIAN_SPECIAL_PRESSURE_V1/.test(pressure) && /version:\s*'v1'/.test(pressure), 'guardian special pressure declares v1');
ok(/new Set\(\[40, 60, 70, 80, 90, 100\]\)/.test(pressure), 'only intended late damage-guardian depths use special armor-break');
ok(!/new Set\(\[[^\]]*(?:20|30|50)[^\]]*\]\)/.test(pressure), '20/30 teaching specials and floor-50 healing are excluded');
ok(/stackText\(\)\.indexOf\('resolveSpecial'\)\s*>=\s*0/.test(pressure), 'armor-break bridge only recognizes telegraphed resolveSpecial calls');
ok(/coreMeleeAttack\.call\(this, m, true\)/.test(pressure) && /coreRangedAttack\.call\(this, m, true\)/.test(pressure), 'late telegraphed melee and ranged hits use core armor-break semantics');
ok(/function resolveSpecial\(\)/.test(content) && /api\.monsterAttack\(m\)/.test(content) && /api\.monsterRangedAttack\(m\)/.test(content), 'content specials still route through the public attack bridge');
ok(/armorBreak \? Math\.max\(1, raw\)/.test(core), 'core armor-break explicitly ignores armor');
ok(/function pierceChanceOf\(\) \{ return 0; \}/.test(core), 'hidden random pierce remains disabled');
ok(/破甲大招 · 命中无视护甲/.test(pressure) && /DE_GUARDIAN_ENCOUNTER/.test(pressure), 'players receive an explicit warning only during a real guardian special');
ok(!/player\.hp\s*[-+]?=|player\.equip\s*=|player\.flatDr\s*=/.test(pressure), 'special-pressure bridge does not fake damage or nerf player state');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
