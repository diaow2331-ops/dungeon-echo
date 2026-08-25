# Dungeon Echo v1.0.0 — First Public Release

Dungeon Echo v1.0.0 is the first public, static-site release of the complete 1→100-floor journey.

## What is included

- One production journey from floor 1 through the floor-100 finale.
- Warrior, Ranger, Arcanist and Assassin, each with distinct combat rules, build preferences, selection art and in-dungeon silhouettes.
- Greedy Expedition: descend, collect loot, return to town, secure valuables, forge or shop, then push deeper.
- Six equipment slots, class-aware drops, affixes and build-defining Epic/Legendary mechanics.
- Ten-floor guardian cadence, late-floor themes and a complete final-heart/endless-echo resolution.
- Keyboard, mouse/touch and Gamepad API controls; local, backend-free saves.
- First-release title, class-selection, HUD and town visual polish.

## Release gates

- Public production entry contract: 24/24.
- Deterministic floor 1→100 victory chain: 13/13.
- Historical gameplay and save regression suite: 525/525.
- Static release allowlist, local-resource closure and Nginx mount contract.

## Save compatibility

The game keeps compatible local saves in the browser. Invalid or incompatible run data fails closed instead of being executed as game state. Clearing site data or changing to a different origin/path storage partition can remove local progress; no cloud account or server-side backup exists in v1.0.0.

## Known limitations

- Save data is local to one browser profile and device.
- Long-run balance will continue to be tuned from real player evidence; simulation bots do not model every retreat, shopping and kiting decision.
- Skill milestone evolution and additional bespoke boss presentation remain post-launch work.
- Gamepad support uses the browser Gamepad API and may vary by controller/browser mapping.
- The initial release favors a safe `no-store` cache policy over aggressive CDN caching.

## Deployment

The release is a fixed static-file package. The repository contains an immutable SHA-based staging script and a `/dungeon-echo/` Nginx location template under `ops/`.
