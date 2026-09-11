import fs from "node:fs";

const canvas = fs.readFileSync(new URL("../../wildforge/src/data.js", import.meta.url), "utf8");
const godot = fs.readFileSync(new URL("../scripts/crafting/slice_crafting.gd", import.meta.url), "utf8");

const required = [
  {id:"plank", canvas:/\{id:'plank',out:\{id:'plank',n:4\},need:\{wood:1\}\}/, godot:/"plank": \{"out_id": "plank", "out_n": 4, "need": \{"wood": 1\}\}/},
  {id:"workbench", canvas:/\{id:'workbench',out:\{id:'workbench',n:1\},need:\{plank:8\}\}/, godot:/"workbench": \{"out_id": "workbench", "out_n": 1, "need": \{"plank": 8\}\}/},
];

for (const r of required) {
  if (!r.canvas.test(canvas)) throw new Error(`canonical recipe missing: ${r.id}`);
  if (!r.godot.test(godot)) throw new Error(`Godot recipe drift: ${r.id}`);
  console.log(`PASS: recipe parity ${r.id}`);
}
console.log("wildforge_godot_recipe_parity=PASS");
