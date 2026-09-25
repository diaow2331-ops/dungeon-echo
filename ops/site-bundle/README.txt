Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/ and /board-games/, replaces the bundled game at /dungeon-echo/, switches
the existing /srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.9.7.zip -d /tmp/91hwl-play-dungeon-echo-v1.9.7
  cd /tmp/91hwl-play-dungeon-echo-v1.9.7
  sudo ./ops/deploy.sh

v1.9.7 publishes cache generation 197 as the Static Scene Layer + Visibility Filter Cache release:
- Dungeon wall/floor geometry is composed once per generated/restored floor into a reusable static map bitmap.
- Each visual frame crops only the active viewport from that map bitmap instead of redrawing every visible tile.
- FOV darkness is cached as a viewport-sized overlay and rebuilt only when FOV/camera state changes.
- Visible decals, traps, secrets, NPCs, items, monsters, stairs and torches share one turn/FOV scene-filter cache across animation frames.
- Authored Echo Town backdrop + shade are composed once per canvas size and reused while dynamic growth/fire/NPC effects stay live.
- Dynamic combat effects, stairs, torches, loot bobbing, monsters and town interactions remain uncached and continue to animate normally.
- Browser A/B regression tests show large reductions in dungeon draw calls and lower action-frame main-thread work without gameplay-rule changes.
- game/core/game.js remains the sole runtime owner for RNG, mutable gameplay state, turn execution,
  rewards, persistence, Canvas rendering and gameplay input.
- Storage epoch remains v130; existing saves are preserved.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
