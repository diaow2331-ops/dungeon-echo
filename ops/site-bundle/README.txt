Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, replaces the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.3.5.zip -d /tmp/91hwl-play-dungeon-echo-v1.3.5
  cd /tmp/91hwl-play-dungeon-echo-v1.3.5
  sudo ./ops/deploy.sh

v1.3.5 publishes cache generation 174 as a post-launch experience hotfix:
the Expedition Record is now an independent cross-run profile shared by Classic and Greedy expeditions;
existing history is migrated as a lower bound, New Adventure preserves the global record, and achievements expose
visible progress instead of an empty panel. Canonical Canvas now renders ground equipment from the reviewed v13
tier sheets, native white scrollbars are themed, the HUD Save control matches adjacent controls, and small route/HUD
copy residues are corrected. The single-authority runtime topology remains unchanged.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
