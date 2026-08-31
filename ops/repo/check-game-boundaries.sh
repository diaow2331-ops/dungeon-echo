#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
node test/games-catalog.cjs
node test/games-boundaries.cjs
echo 'game_repository_boundaries=PASS'
