# Art Runtime v3

This pass continues the repository's presentation-only art integration without changing gameplay ownership.

## Visible coverage added

- Eleven additional live monster archetypes are mapped to the completed 4×4 deep-monster atlas after their appropriate depth thresholds.
- Floor 10/20/30/40/50/60/70/80/90 guardians are restaged from the existing 3×3 guardian atlas with larger silhouettes, ground sigils and depth-tinted aura treatment.
- The floor-100 final boss is restaged from the dedicated final-boss art with a larger silhouette and distinct void aura.
- Deterministic ambient dressing uses the admitted 6×4 prop atlas to place low-opacity, non-interactive scenery on otherwise empty visible floor cells.

## Ownership boundary

`game/ui/art-runtime-v3.js` is presentation-only. It does not write saves, consume RNG, change collision, spawn entities, mutate combat stats or alter progression. The core canvas remains the fallback when an art asset cannot load.

## Follow-up art batches

The next visual pass should focus on town scene composition/NPC identity, then expand hero directional/action coverage and equipment icon diversity. Source sheets remain archival inputs until normalized into deterministic runtime atlases.
