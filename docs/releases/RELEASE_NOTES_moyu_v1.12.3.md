# Clock Out Alive / 摸鱼到下班 v1.12.3

v1.12.3 adds the planned deterministic Daily Shift as an optional replay layer. Normal runs remain random and keep the same controls, progression and endings.

## Daily seed

The Daily Shift derives a stable seed from the player’s local calendar date. Gameplay-affecting choices use that seeded stream: obstacle selection, gap bands, moving-hazard geometry, pickup routes, office events and rare gameplay moments. Cosmetic-only particles, screen shake and ambient text remain unseeded, so presentation can stay lively without changing the challenge route.

Restarting the Daily Shift on the same local date restarts the same gameplay PRNG sequence. A new local date produces a new seed automatically.

## Office modifier

Each date deterministically selects one lightweight modifier: Meeting Marathon increases meeting pressure, Buggy Build increases BUG pressure, or Coffee Shortage reduces pickup opportunities. No modifier adds a new control or permanent player power.

## Run ledger

Daily runs are tagged with date + modifier in Last Run and Top 5. Existing v1.12.2 records remain compatible; records without Daily metadata render as normal runs. No account, streak reward or server dependency is introduced.

## Acceptance boundary

The focused gate verifies v1.12.3 fingerprints, Daily Shift mounts, deterministic seed helpers, daily ledger metadata and byte-for-byte canonical packaging. Browser acceptance verifies same-day sequence repeatability, normal-mode non-determinism, Daily UI state and preservation of desktop/mobile viewport-first layout.
