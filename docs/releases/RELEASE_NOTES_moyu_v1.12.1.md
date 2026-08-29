# Clock Out Alive / 摸鱼到下班 v1.12.1

v1.12.1 is the first focused P1 gameplay patch on top of the v1.12.0 canonical-runtime and viewport-first foundation. It does not add permanent stats, equipment or a new mandatory input.

## Scene-specific judgement

- Workstation owns boss spot-check rushes, concentrating the “save the second jump” read in the opening office scene.
- Meeting gates after the tutorial gate drift vertically within a small bounded range, turning the opening into a timing read instead of a fixed hole.
- Pantry has the highest chance of high-route Risk Forms, so optional rewards require a deliberate jump line.
- Gym dumbbells can bounce, making the landing window dynamic without adding another button.

## Temporary risk/reward pickups

- **Coffee:** unchanged simple +35m pickup.
- **Leave Slip:** +10m, lasts up to 8 seconds, absorbs one collision, then disappears. Using the save drops Combo to zero, so it is defensive rather than a free optimal pickup.
- **Risk Form:** +15m, lasts 7 seconds and doubles only the near-miss bonus. It creates a score-chasing route rather than permanent power.

## Near-miss scoring

Near-miss now has normal and Perfect tiers. A pass within 24 logical pixels scores as a near-miss; the tightest <=8px route scores as Perfect. Risk Form doubles the near-miss component only. The safe route still reaches 18:00; skilled players can voluntarily trade clearance for score.

## Boundaries

Jump / Double Jump remains the only required action. Existing route length, endings, local save format and v1.12.0 viewport-first layout remain intact. Top-run history, richer Run Summary, deterministic Daily Shift and any fast-fall experiment remain separate follow-up work.

## Focused acceptance

The v1.12.1 candidate passed the canonical release contract and a real headless-Chrome browser gate at 1600×761 desktop and 390×844 portrait mobile. The gate verified the v1.12.0 viewport-first boundary plus deterministic debug probes for Leave Slip consumption, Risk Form timing, normal/Perfect near-miss score separation, doubled risk bonus, drifting second meeting gate and bouncing gym dumbbell. No browser console errors or horizontal overflow were observed.
