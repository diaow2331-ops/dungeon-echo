Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/ and /board-games/, replaces the bundled game at /dungeon-echo/, switches
the existing /srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.9.6.zip -d /tmp/91hwl-play-dungeon-echo-v1.9.6
  cd /tmp/91hwl-play-dungeon-echo-v1.9.6
  sudo ./ops/deploy.sh

v1.9.6 publishes cache generation 196 as the HUD Dirty-Update + Render Cache release:
- HUD DOM nodes are resolved lazily once and reused instead of repeated getElementById lookups.
- Unchanged HUD frames exit at a whole-state signature before any per-field DOM comparison.
- Changed HUD values use dirty-only text/style/property/class writers.
- Stable Canvas text widths and lighting/town gradients are cached and reused.
- Dungeon player lighting, vignette, stairs glow and stable town gradients avoid repeated native gradient construction.
- Town authored NPC labels reuse cached text metrics.
- Browser regression benchmarks show large reductions in DOM queries/writes and stable render primitives without gameplay-rule changes.
- game/core/game.js remains the sole runtime owner for RNG, mutable gameplay state, turn execution,
  rewards, persistence, Canvas rendering and gameplay input.
- Storage epoch remains v130; existing saves are preserved.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
