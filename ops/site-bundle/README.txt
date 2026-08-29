Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, replaces the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.4.0.zip -d /tmp/91hwl-play-dungeon-echo-v1.4.0
  cd /tmp/91hwl-play-dungeon-echo-v1.4.0
  sudo ./ops/deploy.sh

v1.4.0 publishes cache generation 176 as the core balance and UX recovery release:
J is the explicit basic attack, K is the class skill (C alias), Ranger and Arcanist have blocked-line ranged basics,
and Mana is persistent canonical state. Signature starter weapons and class proficiency protect class identity while
preserving class-agnostic loot. Greedy New Run intent survives reload; inventory uses select/detail/explicit-equip;
desktop gameplay fits common viewports; low-health potion access, combat-log signal and ground-loot readability are
improved; and NPC placement is connectivity-safe. The single-authority runtime topology remains unchanged.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
