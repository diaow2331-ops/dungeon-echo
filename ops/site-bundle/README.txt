Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/ and /board-games/, replaces the bundled game at /dungeon-echo/, switches
the existing /srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.8.1.zip -d /tmp/91hwl-play-dungeon-echo-v1.8.1
  cd /tmp/91hwl-play-dungeon-echo-v1.8.1
  sudo ./ops/deploy.sh

v1.8.1 publishes cache generation 183 as the Town Viewport + Fullscreen polish release:
- Four persistent three-stage town projects change both presentation and service capability.
- Six authored six-piece relic sets carry fixed names, lore, signatures and distinct 6/6 capstones.
- Relic Hall research, return events, a town chronicle and unlockable residents make safe returns visible.
- Town NPCs use new scene/portrait atlases and a contextual dialogue card.
- Permanent level growth closes at Level 50 while Floor 20/40/60/80 skill evolutions remain deliverable.
- Town, set, economy and expedition policy modules remain pure authorities consumed by canonical core.
- game/core/game.js remains the sole runtime owner for RNG, state mutation, combat execution,
  rewards, persistence, Canvas rendering and gameplay input.
- Storage epoch remains v130; existing saves are preserved.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
