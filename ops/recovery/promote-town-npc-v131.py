from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[2]
core = root / 'game/core/game.js'
s = core.read_text()

art_anchor = "const townBackdropV11 = new Image();\ntownBackdropV11.src = 'art/town-backdrop-v11.webp';\n"
art_add = """const townNpcAtlasV1 = new Image();
townNpcAtlasV1.src = 'art/town-npc-atlas-v1.svg';
const TOWN_NPC_ART = Object.freeze({
  quartermaster:0, smith:1, provisioner:4, alchemist:9, oracle:10, portalWarden:12,
});
"""
assert s.count(art_anchor) == 1, 'town asset anchor mismatch'
s = s.replace(art_anchor, art_anchor + art_add, 1)

growth_anchor = "function drawTownGrowthVisual(ctx, now, W, H, G) {\n"
helper = r"""function drawTownNpcFigure(ctx, index, x, baseY, now, facing = 1, scale = 1) {
  const bob = reducedMotion ? 0 : Math.sin(now * .0026 + x * .013) * 1.15;
  const y = baseY + bob;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.38)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 12 * scale, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  if (imageReady(townNpcAtlasV1)) {
    const cols = 4, rows = 4;
    const sw = townNpcAtlasV1.naturalWidth / cols, sh = townNpcAtlasV1.naturalHeight / rows;
    const sx = (index % cols) * sw, sy = Math.floor(index / cols) * sh;
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
    ctx.translate(x, y - 23 * scale); ctx.scale(facing, 1);
    ctx.drawImage(townNpcAtlasV1, sx, sy, sw, sh, -18 * scale, -27 * scale, 36 * scale, 50 * scale);
  } else {
    ctx.fillStyle = 'rgba(24,18,20,.9)';
    ctx.beginPath(); ctx.arc(x, y - 16, 4.2 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 5 * scale, y - 12, 10 * scale, 16);
  }
  ctx.restore();
}
function drawTownNpcPopulation(ctx, now, W, G, tier) {
  const roles = [
    { min:1, cell:TOWN_NPC_ART.quartermaster, x:.12, face:1, scale:.92 },
    { min:1, cell:TOWN_NPC_ART.provisioner, x:.50, face:-1, scale:.90 },
    { min:2, cell:TOWN_NPC_ART.smith, x:.29, face:1, scale:.96 },
    { min:3, cell:TOWN_NPC_ART.alchemist, x:.40, face:-1, scale:.90 },
    { min:4, cell:TOWN_NPC_ART.oracle, x:.68, face:1, scale:.92 },
    { min:7, cell:TOWN_NPC_ART.portalWarden, x:.86, face:-1, scale:.94 },
  ];
  for (const role of roles) if (tier >= role.min)
    drawTownNpcFigure(ctx, role.cell, W * role.x, G + 13, now, role.face, role.scale);
}
"""
assert s.count(growth_anchor) == 1, 'town growth anchor mismatch'
s = s.replace(growth_anchor, helper + growth_anchor, 1)

old_people = """  const people = Math.max(1, Math.floor(tier / 2));
  for (let i = 0; i < people; i++) {
    const x = W * .25 + i * Math.min(86, W * .1);
    const y = G + 8 + (i % 2) * 5;
    ctx.fillStyle = 'rgba(13,10,12,.82)';
    ctx.beginPath(); ctx.arc(x, y - 9, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 3, y - 6, 6, 12);
  }
"""
assert s.count(old_people) == 1, 'generic town silhouette block mismatch'
s = s.replace(old_people, "  drawTownNpcPopulation(ctx, now, W, G, tier);\n", 1)
core.write_text(s)

src = root / 'archive/quarantine-v130/art/assets/runtime/hero-action-atlas-v2.svg'
dst = root / 'art/town-npc-atlas-v1.svg'
shutil.copyfile(src, dst)

manifest = root / 'ops/release/static-files.txt'
m = manifest.read_text()
anchor = 'art/town-backdrop-v11.webp\n'
assert m.count(anchor) == 1, 'release allowlist anchor mismatch'
if 'art/town-npc-atlas-v1.svg\n' not in m:
    m = m.replace(anchor, anchor + 'art/town-npc-atlas-v1.svg\n', 1)
manifest.write_text(m)
