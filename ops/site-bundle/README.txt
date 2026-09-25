Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/ and /board-games/, replaces the bundled game at /dungeon-echo/, switches
the existing /srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.9.4.zip -d /tmp/91hwl-play-dungeon-echo-v1.9.4
  cd /tmp/91hwl-play-dungeon-echo-v1.9.4
  sudo ./ops/deploy.sh

v1.9.4 publishes cache generation 194 as the Gameplay Depth + Decision Clarity release:
- Expedition contracts escalate by ten-floor segment so risk and reward grow together.
- Safe return preserves attrition; Return Scrolls channel for two full turns and any damage interrupts them.
- Return-channel inventory loopholes are closed, including equip, unequip and drop commands.
- Ordinary monsters use bounded last-seen memory instead of tracking the hidden live player through walls.
- Ranged enemies seek/hold firing distance, melee pursuit respects crowding, and erratic enemies stay purposeful.
- Explicit ranged J attacks gain a narrow deterministic aim assist that never shoots through walls or behind the player.
- Departure risk briefs and return/death summaries expose the consequences behind push-or-bank decisions.
- Guardian/final-boss authored pressure remains frozen; the rejected Guardian Fury escalation does not ship.
- game/core/game.js remains the sole runtime owner for RNG, mutable gameplay state, turn execution,
  rewards, persistence, Canvas rendering and gameplay input.
- Storage epoch remains v130; existing saves are preserved.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
