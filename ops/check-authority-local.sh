#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

checks=(
  test/single-authority-v130.cjs
  test/entry-authority-v130.cjs
  test/inventory-rules-v130.cjs
  test/economy-rules-v130.cjs
  test/progression-rules-v130.cjs
  test/content-rules-v130.cjs
  test/town-rules-v130.cjs
  test/combat-rules-v130.cjs
)

for check in "${checks[@]}"; do
  printf 'authority_check=%s\n' "$check"
  node "$check"
done

printf 'authority_check=PASS\n'
printf 'authority_policy=one-responsibility-one-production-authority\n'
