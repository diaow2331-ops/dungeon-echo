Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, overlays the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.2.12.zip -d /tmp/91hwl-play-dungeon-echo-v1.2.12
  cd /tmp/91hwl-play-dungeon-echo-v1.2.12
  sudo ./ops/deploy.sh

The v1.2.12 bundle publishes cache generation 166 for both zh/en entries and
ships the complete art closeout together: unified entity art, nine guardians and
the floor-100 boss, 21-theme terrain materials, detailed town/NPC presentation,
four-class directional combat FX, four-direction hero art and the current loot/
equipment artwork. Dynamic equipment-on-body overlays are intentionally excluded.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
