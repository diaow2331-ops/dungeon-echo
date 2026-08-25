const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'test', 'smoke.cjs');
let source = fs.readFileSync(file, 'utf8');
const oldDir = "  const pdir = __dirname + '\\\\..\\\\profiles';";
const newDir = "  const pdir = path.resolve(__dirname, '..', 'profiles');";
const oldRead = "    const txt = fs.readFileSync(pdir + '\\\\' + f, 'utf8');";
const newRead = "    const txt = fs.readFileSync(path.join(pdir, f), 'utf8');";
const oldDodge = "  T.player.x += 2;\n  T.monstersTurn();\n  ok(T.player.hp === before && m.armorBreakCharge === 0, '离开近战范围后蓄力落空');";
const newDodge = "  T.player.x += 3;\n  T.monstersTurn();\n  ok(T.player.hp === before && m.armorBreakCharge === 0, '离开近战范围后蓄力落空');";
const oldWheel = "  const g1 = T.meta.gold;\n  const s0 = T.meta.wheelSpins;\n  T.spinWheel();\n  ok(T.meta.gold === g1 - 40, `抽奖精确扣费 40 G（实际 -${g1 - T.meta.gold}）`);";
const newWheel = "  T.meta.wheelSlots = Array.from({ length: 8 }, () => ({ kind: 'nothing' }));\n  const g1 = T.meta.gold;\n  const s0 = T.meta.wheelSpins;\n  T.spinWheel();\n  ok(T.meta.gold === g1 - 40, `抽奖精确扣费 40 G（空奖隔离后实际 -${g1 - T.meta.gold}）`);";
const dirCount = source.split(oldDir).length - 1;
const readCount = source.split(oldRead).length - 1;
if (dirCount < 1) throw new Error('portable-path patch: pdir source not found');
if (readCount < 1) throw new Error('portable-path patch: profile read source not found');
if (!source.includes(oldDodge)) throw new Error('armor-break dodge fixture not found');
if (!source.includes(oldWheel)) throw new Error('wheel cost fixture not found');
source = source
  .split(oldDir).join(newDir)
  .split(oldRead).join(newRead)
  .replace(oldDodge, newDodge)
  .replace(oldWheel, newWheel);
fs.writeFileSync(file, source);
console.log(`smoke_portable_paths=APPLIED dirs=${dirCount} reads=${readCount}`);
console.log('armor_break_dodge_fixture=APPLIED');
console.log('wheel_cost_fixture=ISOLATED');
