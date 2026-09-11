#!/usr/bin/env bash
set -euo pipefail
GODOT="${GODOT:-godot4}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$GODOT" --headless --path "$ROOT" --editor --quit
"$GODOT" --headless --path "$ROOT" --script res://tests/smoke_test.gd
