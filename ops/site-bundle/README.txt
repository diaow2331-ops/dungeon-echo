Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/ and /board-games/, replaces the bundled game at /dungeon-echo/, switches
the existing /srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.5.0.zip -d /tmp/91hwl-play-dungeon-echo-v1.5.0
  cd /tmp/91hwl-play-dungeon-echo-v1.5.0
  sudo ./ops/deploy.sh

v1.5.0 publishes cache generation 179 as the gameplay-feedback release:
class-specific hit audio, stronger critical/hurt/kill/guardian cues, optional haptics,
a denser mobile control layout, stepped desktop camera bands, and one-action Greedy
expedition readiness. Risky departures remain allowed and the v130 save epoch is unchanged.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
