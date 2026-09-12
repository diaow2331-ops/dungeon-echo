import fs from "node:fs";
const data = fs.readFileSync(new URL("../../wildforge/src/data.js", import.meta.url), "utf8");
const game = fs.readFileSync(new URL("../../wildforge/src/game.js", import.meta.url), "utf8");
const player = fs.readFileSync(new URL("../scripts/player/player.gd", import.meta.url), "utf8");
const crafting = fs.readFileSync(new URL("../scripts/crafting/slice_crafting.gd", import.meta.url), "utf8");
const checks = [
  ["canvas hunger max", /const HUNGER_MAX=100;/, game],
  ["canvas hunger start", /const HUNGER_START=82;/, game],
  ["canvas hunger drain", /const HUNGER_DRAIN_PER_SEC=HUNGER_MAX\/\(180\*4\);/, game],
  ["canvas starvation interval", /const STARVATION_DAMAGE_INTERVAL=4;/, game],
  ["canvas raw meat nourish", /raw_meat:\{[^\n]*nourish:9\}/, data],
  ["canvas ration nourish", /trail_ration:\{[^\n]*nourish:38\}/, data],
  ["canvas campfire recipe", /\{id:'campfire',out:\{id:'campfire',n:1\},need:\{stone:6,wood:2\}\}/, data],
  ["canvas ration recipe", /\{id:'trail_ration',out:\{id:'trail_ration',n:1\},need:\{raw_meat:2,wood:1\},station:'campfire'\}/, data],
  ["godot hunger max", /const HUNGER_MAX := 100\.0/, player],
  ["godot hunger start", /const HUNGER_START := 82\.0/, player],
  ["godot traveler hunger drain override", /const HUNGER_DRAIN_PER_SEC := HUNGER_MAX \/ 1800\.0/, player],
  ["godot slow camp rest", /const CAMP_REST_HEAL_PER_SEC := 0\.4/, player],
  ["godot raw meat nourish", /const RAW_MEAT_NOURISH := 9\.0/, player],
  ["godot ration nourish", /const TRAIL_RATION_NOURISH := 38\.0/, player],
  ["godot campfire recipe", /"campfire": \{"out_id": "campfire", "out_n": 1, "need": \{"stone": 6, "wood": 2\}\}/, crafting],
  ["godot ration recipe", /"trail_ration": \{"out_id": "trail_ration", "out_n": 1, "need": \{"raw_meat": 2, "wood": 1\}, "station": "campfire"\}/, crafting],
];
for (const [name, re, text] of checks) {
  if (!re.test(text)) throw new Error(`survival parity drift: ${name}`);
  console.log(`PASS: ${name}`);
}
console.log("wildforge_godot_survival_parity=PASS");
