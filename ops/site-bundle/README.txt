Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, replaces the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.3.0.zip -d /tmp/91hwl-play-dungeon-echo-v1.3.0
  cd /tmp/91hwl-play-dungeon-echo-v1.3.0
  sudo ./ops/deploy.sh

v1.3.0 publishes cache generation 168 and establishes one production authority:
game/core/game.js is the only dungeon/town Canvas renderer. Historical art overlays,
Canvas interception/cleanup layers, save-integrity/migration shims and transitional
New Run patches are not shipped. The first v1.3.0 visit clears prior Dungeon Echo
localStorage namespaces and starts the v130 storage epoch. New Adventure is a full
Dungeon Echo reset, including Greedy meta; no historical save migration is performed.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
