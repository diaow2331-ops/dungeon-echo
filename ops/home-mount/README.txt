Dungeon Echo 91hwl homepage mount

This package updates the existing 91hwl.cn homepage with the second Web Toy,
adds /toys/dungeon-echo/, and preserves the existing Moyu game and detail page.
It verifies the current homepage hash before writing, keeps a server-side
backup, and rolls back both files when any origin or public check fails.

Server usage:
  unzip 91hwl-home-dungeon-echo-v1.1.0.zip -d /tmp/91hwl-home-dungeon-echo-v1.1.0
  cd /tmp/91hwl-home-dungeon-echo-v1.1.0
  sudo ./ops/deploy.sh

Success markers:
  dungeon_echo_home_health=PASS
  dungeon_echo_home_mount=PASS
