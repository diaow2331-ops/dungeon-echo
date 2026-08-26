Dungeon Echo 91hwl homepage mount

This package updates the existing 91hwl.cn homepage with the Dungeon Echo
project entry at /toys/dungeon-echo/ while preserving the Moyu game/detail
page. It verifies the current homepage hash before writing, keeps a server-side
backup, and rolls back both files when any origin or public check fails.

The homepage/project-page package has its own `SITE_VERSION`. It is intentionally
independent from the playable game's root `VERSION`, so a game hotfix cannot
silently relabel an older, not-yet-deployed website candidate.

Current site candidate: 1.2.2

Server usage:
  unzip 91hwl-home-dungeon-echo-v1.2.2.zip -d /tmp/91hwl-home-dungeon-echo-v1.2.2
  cd /tmp/91hwl-home-dungeon-echo-v1.2.2
  sudo ./ops/deploy.sh

Success markers:
  dungeon_echo_home_health=PASS
  dungeon_echo_home_mount=PASS
