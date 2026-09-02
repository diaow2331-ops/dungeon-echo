Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/ and /board-games/, replaces the bundled game at /dungeon-echo/, switches
the existing /srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.9.0.zip -d /tmp/91hwl-play-dungeon-echo-v1.9.0
  cd /tmp/91hwl-play-dungeon-echo-v1.9.0
  sudo ./ops/deploy.sh

v1.9.0 publishes cache generation 190 as the Living Town + Authored Environment release:
- Safe-return town business expands from three to six deterministic events.
- Smithy, Trade Road and Tavern construction now unlock ordinary town-side consequences.
- State-aware street rumors and matching NPC news make expedition returns visible.
- Echo Town gains a new authored plaza plus Smithy, Market, Ember Tavern and Relic Hall scenes.
- The main town backdrop is preloaded; service scenes remain lazy and mobile-cropped.
- Existing construction sprites, NPC atlases and six-piece named relic art remain authoritative.
- game/core/game.js remains the sole runtime owner for RNG, state mutation, combat execution,
  rewards, persistence, Canvas rendering and gameplay input.
- Storage epoch remains v130; existing saves are preserved.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
