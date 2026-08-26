Dungeon Echo 91hwl homepage mount

This package updates the existing 91hwl.cn homepage with the Dungeon Echo
project entry at /toys/dungeon-echo/ while preserving the Moyu game/detail
page. It verifies the current homepage hash before writing, keeps a server-side
backup, and rolls back both files when any origin or public check fails.

The homepage/project-page package has its own `SITE_VERSION`. It is intentionally
independent from the playable game's root `VERSION`, so a game-only hotfix cannot
silently relabel an older website candidate.

Current site candidate: 1.2.3

The v1.2.3 candidate is product-first and bilingual, uses the shipped Dungeon Echo
art instead of placeholder visuals, exposes Play / Details / GitHub routes clearly,
and documents the final mobile/visual cleanup without reopening gameplay balance.

Server usage:
  unzip 91hwl-home-dungeon-echo-v1.2.3.zip -d /tmp/91hwl-home-dungeon-echo-v1.2.3
  cd /tmp/91hwl-home-dungeon-echo-v1.2.3
  sudo ./ops/deploy.sh

Success markers:
  dungeon_echo_home_health=PASS
  dungeon_echo_home_mount=PASS
