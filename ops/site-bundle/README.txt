Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, replaces the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.3.4.zip -d /tmp/91hwl-play-dungeon-echo-v1.3.4
  cd /tmp/91hwl-play-dungeon-echo-v1.3.4
  sudo ./ops/deploy.sh

v1.3.4 publishes cache generation 173 as a core-gameplay hotfix:
Return Scrolls gain a guaranteed source in every ten-floor band plus random/merchant/guardian supply;
dungeon merchants can buy backpack gear; world weapon families no longer depend on the selected class;
melee pursuers apply reduced engagement pressure when they close into contact; Ranger Fleet Step uses one
symmetric four-direction traversal rule; and ordinary monster HP/DEF now sustain real multi-hit fights.
Guardians keep their reviewed pressure values. The single-authority runtime topology remains unchanged.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
