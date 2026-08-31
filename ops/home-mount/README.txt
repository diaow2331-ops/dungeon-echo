91hwl home mount · site v1.11.8

This bundle owns only the 91hwl.cn presentation surface. Component game versions are read from their canonical version files and written into the bundle as DUNGEON_VERSION, MOYU_VERSION and BOARD_VERSION.

v1.11.8 completes the project-detail surface for all three games. Board Trio receives its own bilingual detail page; Dungeon Echo and Clock Out Alive gain denser real-art galleries drawn from their repository atlases, while the homepage gives every live game both Play and Details routes.

The playable games remain separately deployed under play.91hwl.cn. The home-mount deployer must not rewrite those game trees.

Build:
  bash ops/release/build-home-mount-bundle.sh

Deploy only the immutable, checksummed bundle and let its healthcheck verify both 91hwl.cn and the live component versions.
