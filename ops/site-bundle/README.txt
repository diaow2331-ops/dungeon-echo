Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, overlays the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.0.0.zip -d /tmp/91hwl-play-dungeon-echo-v1.0.0
  cd /tmp/91hwl-play-dungeon-echo-v1.0.0
  sudo ./ops/deploy.sh

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
