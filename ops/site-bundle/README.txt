Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, overlays the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.2.12.zip -d /tmp/91hwl-play-dungeon-echo-v1.2.12
  cd /tmp/91hwl-play-dungeon-echo-v1.2.12
  sudo ./ops/deploy.sh

The v1.2.12 corrective hotfix publishes cache generation 167 for both zh/en entries.
It keeps the complete guardian/boss, terrain, deep monster/prop, town/NPC and current
loot/equipment art pass while restoring the established high-detail hero/action atlas.
The experimental pixel-direction hero overlay, line-drawn class FX and equipment-on-body
overlay are excluded. New Run now clears the active expedition save and prepares a fresh
seed unless the URL explicitly supplies ?seed=; Greedy meta/town progression is preserved.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
