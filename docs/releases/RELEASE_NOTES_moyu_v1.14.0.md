# Clock Out Alive / 摸鱼到下班 v1.14.0

v1.14.0 is the first asset-backed character art pass. It changes presentation, not the accepted run rules.

## Player art

- Adds `moyu/assets/sprites/hero.png`, a transparent 384×384 4×4 sheet with 96×96 cells.
- Adds a tracked JSON frame manifest for idle, six-frame run, crouch, jump, double jump, air pose, fall, land, hurt and victory slots.
- Runtime animation selects frames from grounded state, vertical velocity, jump count, landing squash and ending state.
- Visual placement is anchored to the authoritative player foot position; physics remains 44×66 and collision geometry is unchanged.
- The accepted v1.13.1 vector runner is retained as a load-failure fallback only.

## Release safety

- The production bundle now includes the PNG and manifest as tracked canonical release inputs.
- Release tests compare the binary sprite bytes, and deployment validates the reviewed SHA-256 before activation.
- Origin healthcheck fetches the public sprite and rejects a mismatched asset.

## Deliberately unchanged

Route length, Jump / Double Jump input, Daily Shift, scene hazard rules, pickups, scoring, endings, local saves and the 44×66 player body are unchanged. Boss and obstacle sprite work is intentionally left for a separate art batch.
