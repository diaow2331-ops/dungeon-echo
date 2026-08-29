Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, replaces the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.4.1.zip -d /tmp/91hwl-play-dungeon-echo-v1.4.1
  cd /tmp/91hwl-play-dungeon-echo-v1.4.1
  sudo ./ops/deploy.sh

v1.4.1 publishes cache generation 177 as the living-town and hero-art patch:
high-detail class art now owns idle presentation, while transient action frames appear only during actual actions;
procedural equipment line geometry is replaced by restrained rarity glow. Echo Town now uses its authored backdrop
and expanded NPC atlas as a walkable plaza with keyboard/click movement, proximity prompts and seven interaction
hotspots. The Ember Tavern adds one escalating-price toast per completed expedition, eight per character at most,
with bounded permanent micro-growth. The single-authority runtime topology remains unchanged.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
