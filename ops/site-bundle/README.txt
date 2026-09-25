Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/ and /board-games/, replaces the bundled game at /dungeon-echo/, switches
the existing /srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.9.5.zip -d /tmp/91hwl-play-dungeon-echo-v1.9.5
  cd /tmp/91hwl-play-dungeon-echo-v1.9.5
  sudo ./ops/deploy.sh

v1.9.5 publishes cache generation 195 as the Render Lifecycle + Interaction Performance release:
- The dungeon Canvas no longer owns a permanent requestAnimationFrame loop outside active play.
- Static dungeon scenes fall back to a bounded low-frequency ambient cadence and wake immediately for gameplay/VFX.
- The minimap caches unchanged world/FOV state instead of rescanning the full 40×28 map every visual frame.
- Town rendering uses an adaptive lifecycle: low-frequency when settled and near-30fps while an interaction is moving.
- The town-scene and wheel canvases repaint independently, so a spinning wheel no longer redraws the whole town every frame.
- Visibility transitions cancel pending timers/frames and resume only the renderer required by the active state.
- Browser benchmarking shows large reductions in idle and town main-thread work without changing combat rules or save data.
- game/core/game.js remains the sole runtime owner for RNG, mutable gameplay state, turn execution,
  rewards, persistence, Canvas rendering and gameplay input.
- Storage epoch remains v130; existing saves are preserved.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
