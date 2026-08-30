# Clock Out Alive / 摸鱼到下班 v1.13.1

v1.13.1 is a focused game-feel pass on top of v1.13.0 Playfield First. It does not change route length, collision geometry, core Jump / Double Jump controls, Daily Shift rules or permanent progression.

## Skill feedback

- Perfect Near Miss now gets a short screen pulse, radial burst and layered chiptune cue.
- Every fifth Combo produces a compact Flow milestone without covering the playfield for long.
- The Combo chip exposes its remaining 6.5-second lifetime through a shrinking bar; Combo 5+ receives a Flow state.

## Movement feedback

- Ground takeoff produces a stronger low dust kick.
- Double jump has its own expanding air ring and particle burst.
- Hard landings create a short floor pulse, dust and proportional squash while leaving physics unchanged.

## Runner motion rewrite

The old front-facing puppet pose has been replaced by a right-facing 3/4 runner silhouette. Grounded motion now uses opposing arm/leg gait around fixed hip and shoulder anchors. Airborne posture is velocity-driven: ascent tucks progressively, the double jump tightens the pose further, and falling extends the legs toward a landing stance. The whole body shares one lean/bob transform, so the head and torso no longer appear frozen while the limbs swing independently. The 44×66 gameplay body and collision rules are unchanged.

## Threat readability

Boss spot-check rushes use a 0.34-second warning window instead of the previous 0.24-second cue, plus a short edge alert and stronger audio duck before acceleration. This improves readability without removing the rush itself.

## Acceptance

Focused browser probes verify Perfect/Combo feedback state, double-jump burst, hard-landing pulse, boss warning state, Combo lifetime UI and unchanged mobile/desktop playfield geometry. The canonical release gate must still pass and the packaged `game.js` must remain byte-identical to tracked canonical source.
