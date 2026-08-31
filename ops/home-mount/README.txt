91hwl home mount · site v1.11.7

This bundle owns only the 91hwl.cn presentation surface. Component game versions are read from their canonical version files and written into the bundle as DUNGEON_VERSION, MOYU_VERSION and BOARD_VERSION.

v1.11.7 removes personal contact identifiers from the public site, routes sensitive vulnerability reports through the repository Security Policy, and synchronizes the homepage/detail version labels from the component authorities.

The playable games remain separately deployed under play.91hwl.cn. The home-mount deployer must not rewrite those game trees.

Build:
  bash ops/release/build-home-mount-bundle.sh

Deploy only the immutable, checksummed bundle and let its healthcheck verify both 91hwl.cn and the live component versions.
