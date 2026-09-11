#!/usr/bin/env bash
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot4}"
"$GODOT_BIN" --headless --editor --path "$(cd "$(dirname "$0")/.." && pwd)" --quit
"$GODOT_BIN" --headless --path "$(cd "$(dirname "$0")/.." && pwd)" --script res://tests/smoke_test.gd
"$GODOT_BIN" --headless --path "$(cd "$(dirname "$0")/.." && pwd)" --script res://tests/feel_test.gd
"$GODOT_BIN" --headless --path "$(cd "$(dirname "$0")/.." && pwd)" --script res://tests/rhythm_test.gd
"$GODOT_BIN" --headless --path "$(cd "$(dirname "$0")/.." && pwd)" --script res://tests/loop_test.gd
