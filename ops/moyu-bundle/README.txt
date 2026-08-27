91hwl Clock Out Alive file-upload bundle

- Replaces only /moyu/ inside the existing /srv/91hwl-play release tree.
- Preserves /dungeon-echo/ and /healthz.
- Verifies bundle checksums, product/version markers, bilingual/mobile contracts and the public VERSION endpoint.
- Switches the shared current symlink atomically and rolls back on healthcheck failure.

Build from the repository with:
  ./ops/release/build-moyu-bundle.sh /tmp/91hwl-play-moyu-v1.11.0.zip
