# Dungeon Echo v1.2.11

Dungeon Echo v1.2.11 is a gameplay-clarity patch on public runtime cache generation **156**. It preserves the v1.2 save namespaces, fixed Chinese/English routes, economy ownership and extraction rules.

## What changed

- Greedy Expedition now surfaces the push-deeper vs bank-the-run decision with current carried value, HP pressure, floor depth and Return Scroll state.
- The return action continues to delegate to the canonical extraction owner rather than introducing a second retreat path.
- Underground shop cards now expose bilingual class-fit comparisons against currently equipped gear.
- The v1.2.11 expedition-pressure follower is part of the immutable release manifest and public cache generation 156.
- 91hwl's companion trust surfaces remain in the same public release chain; personal contact details are no longer retained in the public source tree, while GitHub Issues remains the preferred public bug channel.

## Compatibility

No progress reset is required. Existing local browser saves, stable item identifiers, Return Scroll state and Chinese/English fixed-route continuity are preserved. The patch does not change RNG ownership or create a new save namespace.

## Validation provenance

The candidate is gated by the targeted deterministic v1.2.11 expedition-pressure contract, the v1.2 release-freeze contract, the immutable Dungeon bundle test, the 91hwl home/trust-surface contract and the combined public-release ZIP build in GitHub Actions.
