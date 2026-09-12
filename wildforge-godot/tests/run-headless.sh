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
  "$GODOT_BIN" --headless --path "$ROOT" --script "$script" 2>&1 | tee "$log"
  if ! grep -Fq "$marker" "$log"; then
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
run_gate res://tests/vegetation_test.gd 'wildforge_vegetation_authority=PASS'
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
