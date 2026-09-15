#!/usr/bin/env bash
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot4}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

editor_log="$(mktemp)"
trap 'rm -f "$editor_log"' EXIT
"$GODOT_BIN" --headless --editor --path "$ROOT" --quit 2>&1 | tee "$editor_log"
if grep -Eq 'SCRIPT ERROR:|Parse Error:' "$editor_log"; then
  echo "godot_editor_parse=FAIL" >&2
  exit 1
fi

run_gate() {
  local script="$1"
  local marker="$2"
  local log
  log="$(mktemp)"
  timeout 120 "$GODOT_BIN" --headless --path "$ROOT" --script "$script" 2>&1 | tee "$log"
  if grep -Eq "SCRIPT ERROR:|Parse Error:" "$log" || ! grep -Fq "$marker" "$log"; then
    echo "missing_gate_marker=$marker script=$script" >&2
    rm -f "$log"
    exit 1
  fi
  rm -f "$log"
}

run_gate res://tests/smoke_test.gd 'wildforge_godot_smoke=PASS'
run_gate res://tests/feel_test.gd 'wildforge_godot_feel=PASS'
run_gate res://tests/rhythm_test.gd 'wildforge_godot_rhythm=PASS'
run_gate res://tests/loop_test.gd 'wildforge_godot_loop=PASS'
run_gate res://tests/chunk_test.gd 'wildforge_godot_chunks=PASS'
run_gate res://tests/streaming_test.gd 'wildforge_chunk_streaming=PASS'
run_gate res://tests/actor_streaming_test.gd 'wildforge_actor_streaming=PASS'
run_gate res://tests/player_logistics_test.gd 'wildforge_player_logistics=PASS'
run_gate res://tests/multi_good_market_test.gd 'wildforge_multi_good_market=PASS'
run_gate res://tests/npc_dialogue_test.gd 'wildforge_npc_dialogue=PASS'
run_gate res://tests/mobile_ui_test.gd 'wildforge_mobile_ui=PASS'
run_gate res://tests/vegetation_test.gd 'wildforge_vegetation_authority=PASS'
run_gate res://tests/structure_test.gd 'wildforge_structure_authority=PASS'
run_gate res://tests/lighting_test.gd 'wildforge_chunk_lighting=PASS'
run_gate res://tests/fluid_test.gd 'wildforge_chunk_fluid=PASS'
run_gate res://tests/crafting_test.gd 'wildforge_godot_crafting=PASS'
run_gate res://tests/survival_test.gd 'wildforge_godot_survival=PASS'
run_gate res://tests/progression_test.gd 'wildforge_godot_progression=PASS'
run_gate res://tests/boar_test.gd 'wildforge_godot_boar=PASS'
run_gate res://tests/exploration_test.gd 'wildforge_godot_exploration=PASS'
run_gate res://tests/copper_test.gd 'wildforge_godot_copper=PASS'
run_gate res://tests/deepgate_test.gd 'wildforge_godot_deepgate=PASS'
run_gate res://tests/save_test.gd 'wildforge_godot_save=PASS'
run_gate res://tests/worldscale_test.gd 'wildforge_godot_worldscale=PASS'
run_gate res://tests/worldgen_test.gd 'wildforge_world_generator=PASS'
run_gate res://tests/biome_materials_test.gd 'wildforge_biome_materials=PASS'
run_gate res://tests/geography_economy_test.gd 'wildforge_geography_economy=PASS'
run_gate res://tests/shortage_response_test.gd 'wildforge_shortage_response=PASS'
run_gate res://tests/traveler_start_test.gd 'wildforge_traveler_start=PASS'
run_gate res://tests/first30_start_loop_test.gd 'wildforge_first30_start_loop=PASS'
run_gate res://tests/settlement_test.gd 'wildforge_three_settlements=PASS'
run_gate res://tests/world_simulation_test.gd 'wildforge_world_simulation=PASS'
run_gate res://tests/world_era_baseline_test.gd 'wildforge_world_era_baseline=PASS'
run_gate res://tests/world_era_transition_test.gd 'wildforge_world_era_transition=PASS'
run_gate res://tests/world_era_save_test.gd 'wildforge_world_era_save=PASS'
run_gate res://tests/world_era_no_backlog_test.gd 'wildforge_world_era_no_backlog=PASS'
run_gate res://tests/world_era_observation_test.gd 'wildforge_world_era_observation=PASS'
run_gate res://tests/world_era_delivery_test.gd 'wildforge_world_era_delivery=PASS'
run_gate res://tests/world_era_guidance_test.gd 'wildforge_world_era_guidance=PASS'
run_gate res://tests/world_era_notice_test.gd 'wildforge_world_era_notice=PASS'
run_gate res://tests/world_era_paths_test.gd 'wildforge_world_era_paths=PASS'
run_gate res://tests/world_era_presentation_test.gd 'wildforge_world_era_presentation=PASS'
run_gate res://tests/caravan_logistics_test.gd 'wildforge_caravan_logistics=PASS'
run_gate res://tests/caravan_projection_test.gd 'wildforge_caravan_projection=PASS'
run_gate res://tests/travel_event_test.gd 'wildforge_travel_event=PASS'
run_gate res://tests/route_hazard_test.gd 'wildforge_route_hazard=PASS'
run_gate res://tests/route_repair_test.gd 'wildforge_route_repair=PASS'
run_gate res://tests/player_route_intervention_test.gd 'wildforge_player_route_intervention=PASS'
run_gate res://tests/player_relief_delivery_test.gd 'wildforge_player_relief_delivery=PASS'
run_gate res://tests/displacement_test.gd 'wildforge_displacement=PASS'
run_gate res://tests/return_migration_test.gd 'wildforge_return_migration=PASS'
run_gate res://tests/faction_authority_test.gd 'wildforge_faction_authority=PASS'
run_gate res://tests/diplomacy_simulation_test.gd 'wildforge_diplomacy_simulation=PASS'
run_gate res://tests/war_annexation_test.gd 'wildforge_war_annexation=PASS'
run_gate res://tests/war_balance_test.gd 'wildforge_war_balance=PASS'
run_gate res://tests/war_visualization_test.gd 'wildforge_war_visualization=PASS'
run_gate res://tests/world_authority_test.gd 'wildforge_world_authority=PASS'
run_gate res://tests/ownership_test.gd 'wildforge_ownership_authority=PASS'
node "$ROOT/tests/recipe_parity.mjs" | tee /tmp/wildforge-recipe-parity.log
grep -Fq 'wildforge_godot_recipe_parity=PASS' /tmp/wildforge-recipe-parity.log
node "$ROOT/tests/survival_parity.mjs" | tee /tmp/wildforge-survival-parity.log
grep -Fq 'wildforge_godot_survival_parity=PASS' /tmp/wildforge-survival-parity.log
node "$ROOT/tests/progression_parity.mjs" | tee /tmp/wildforge-progression-parity.log
grep -Fq 'wildforge_godot_progression_parity=PASS' /tmp/wildforge-progression-parity.log

(cd "$ROOT" && node tests/exploration_parity.mjs)
(cd "$ROOT" && node tests/copper_parity.mjs)
(cd "$ROOT" && node tests/deepgate_parity.mjs)
(cd "$ROOT" && node tests/world_authority_contract.mjs)
