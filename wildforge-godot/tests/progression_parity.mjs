import fs from "node:fs";
const data = fs.readFileSync(new URL("../../wildforge/src/data.js", import.meta.url), "utf8");
const player = fs.readFileSync(new URL("../scripts/player/player.gd", import.meta.url), "utf8");
const crafting = fs.readFileSync(new URL("../scripts/crafting/slice_crafting.gd", import.meta.url), "utf8");
const checks = [
  ["canvas stone pick stats", /stone_pick:\{[^\n]*tier:2,power:1\.75\}/, data],
  ["canvas wood blade stats", /wood_blade:\{[^\n]*damage:5,knockback:4\.2\}/, data],
  ["canvas stone blade stats", /stone_blade:\{[^\n]*damage:7,knockback:4\.8\}/, data],
  ["canvas stone pick recipe", /\{id:'stone_pick',out:\{id:'stone_pick',n:1\},need:\{stone:8,wood:2\},station:'workbench'\}/, data],
  ["canvas stone blade recipe", /\{id:'stone_blade',out:\{id:'stone_blade',n:1\},need:\{stone:6,wood:2\},station:'workbench'\}/, data],
  ["godot stone pick power", /const STONE_PICK_POWER := 1\.75/, player],
  ["godot blade reference damage", /const STARTER_BLADE_REFERENCE_DAMAGE := 5\.0[\s\S]*const STONE_BLADE_REFERENCE_DAMAGE := 7\.0/, player],
  ["godot blade reference knockback", /const STARTER_BLADE_REFERENCE_KNOCKBACK := 4\.2[\s\S]*const STONE_BLADE_REFERENCE_KNOCKBACK := 4\.8/, player],
  ["godot stone pick recipe", /"stone_pick": \{"out_id": "stone_pick", "out_n": 1, "need": \{"stone": 8, "wood": 2\}, "station": "workbench"/, crafting],
  ["godot stone blade recipe", /"stone_blade": \{"out_id": "stone_blade", "out_n": 1, "need": \{"stone": 6, "wood": 2\}, "station": "workbench"/, crafting],
];
for (const [name,re,text] of checks) {
  if (!re.test(text)) throw new Error(`progression parity drift: ${name}`);
  console.log(`PASS: ${name}`);
}
console.log("wildforge_godot_progression_parity=PASS");
