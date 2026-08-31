Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/ and /board-games/, replaces the bundled game at /dungeon-echo/, switches
the existing /srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.6.0.zip -d /tmp/91hwl-play-dungeon-echo-v1.6.0
  cd /tmp/91hwl-play-dungeon-echo-v1.6.0
  sudo ./ops/deploy.sh

v1.6.0 publishes cache generation 180 as the modular-authority release:
the v1.5 gameplay feedback remains intact while town checkpoint/readiness rules and
deterministic town/expedition pricing are promoted into single-purpose production
authorities. Core still owns every state mutation, transaction, save, render and input path.
Risky departures remain allowed and the v130 save epoch is unchanged.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
