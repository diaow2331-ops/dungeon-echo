Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/ and /board-games/, replaces the bundled game at /dungeon-echo/, switches
the existing /srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.7.0.zip -d /tmp/91hwl-play-dungeon-echo-v1.7.0
  cd /tmp/91hwl-play-dungeon-echo-v1.7.0
  sudo ./ops/deploy.sh

v1.7.0 publishes cache generation 181 as the Living Town + Expedition Variety release:
- Town departure contracts provide bounded risk/reward choices.
- Optional dungeon echo events add Blood Offering, Cursed Cache and Elite Trial decisions.
- Elites gain affix identities instead of being only stat-scaled enemies.
- Normal-monster threat rises modestly with depth and engagement strikes are more meaningful.
- Guardians/Boss authored attack values remain outside the normal-monster pressure multiplier.
- game/domain/expedition/expedition-rules-v170.js owns deterministic expedition variation policy.
- game/core/game.js remains the sole runtime owner for RNG, state mutation, combat execution,
  rewards, persistence, Canvas rendering and gameplay input.
- Storage epoch remains v130; existing saves are preserved.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
