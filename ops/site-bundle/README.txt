Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/ and /board-games/, replaces the bundled game at /dungeon-echo/, switches
the existing /srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.9.8.zip -d /tmp/91hwl-play-dungeon-echo-v1.9.8
  cd /tmp/91hwl-play-dungeon-echo-v1.9.8
  sudo ./ops/deploy.sh

v1.9.8 publishes cache generation 198 as the Dynamic Gradient Cache + High-DPI Audit release:
- Equipment-drop aura gradients are reused within pixel buckets instead of recreated every animation frame.
- Amulet aura gradients are cached by pixel position.
- Torch-light gradients quantize flicker radius into nine buckets per torch position and reuse native CanvasGradient objects.
- Existing v1.9.7 static-map/FOV/scene-filter caches remain intact.
- High-DPI audit confirmed the game Canvas backing store stays at the same logical dimensions across DPR 1/2/3; CSS scaling does not multiply backing pixels.
- Dynamic effects still pulse and flicker because alpha and radius bucket selection remain frame-driven.
- Browser A/B showed repeated native radial-gradient construction materially reduced without gameplay-rule changes.
- game/core/game.js remains the sole runtime owner for RNG, mutable gameplay state, turn execution,
  rewards, persistence, Canvas rendering and gameplay input.
- Storage epoch remains v130; existing saves are preserved.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
