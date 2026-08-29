Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, replaces the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.4.2.zip -d /tmp/91hwl-play-dungeon-echo-v1.4.2
  cd /tmp/91hwl-play-dungeon-echo-v1.4.2
  sudo ./ops/deploy.sh

v1.4.2 publishes cache generation 178 as the paged-town release:
Echo Town stays inside a fixed viewport and opens on a larger 1120 × 460 walkable panorama. Gear, Market, Tavern,
Fortune and Depart now have focused pages, while town NPC interactions route directly to the matching district.
Each page owns its overflow, so service management never stretches the town into a long document or moves the
underlying game page. The single-authority runtime topology and existing save epoch remain unchanged.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
