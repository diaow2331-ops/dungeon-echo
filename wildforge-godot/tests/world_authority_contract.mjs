import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const scripts = path.join(root, 'scripts');
let failed = false;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

for (const file of walk(scripts).filter((p) => p.endsWith('.gd'))) {
  if (file.endsWith(path.join('world', 'block_world.gd'))) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (/\bworld\.cells\b|\.cells\.(erase|clear)\s*\(|\.cells\s*\[/.test(source)) {
    console.error(`FAIL direct world cell mutation/reference outside authority: ${path.relative(root, file)}`);
    failed = true;
  }
}
const player = fs.readFileSync(path.join(root, 'scripts/player/player.gd'), 'utf8');
for (const required of [
  'world.mine_at(cell, pick_power(), "player")',
  'world.place_at(cell, tile, "player")',
  'world.spawn_workbench(cell, "player")',
  'world.spawn_campfire(cell, "player")',
]) {
  if (!player.includes(required)) {
    console.error(`FAIL player world edit route missing: ${required}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('wildforge_world_authority_contract=PASS');
