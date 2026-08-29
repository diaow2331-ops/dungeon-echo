Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, replaces the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.3.1.zip -d /tmp/91hwl-play-dungeon-echo-v1.3.1
  cd /tmp/91hwl-play-dungeon-echo-v1.3.1
  sudo ./ops/deploy.sh

v1.3.1 publishes cache generation 170 and completes the reviewed v1.3 recovery pass:
four-class combat FX, detailed town NPCs, dungeon props, deep monsters, conquered-depth
departures, finite tier-scaled market stock, 20/40/60/80 skill evolution and the 10→100
guardian encounter chain now live inside the canonical owners. Historical overlays,
wrappers and storage sidecars remain retired. The v130 storage epoch stays stable, so
v1.3.0 runs remain compatible.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
