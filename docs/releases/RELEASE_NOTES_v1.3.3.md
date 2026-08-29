# Dungeon Echo v1.3.3

Hot update focused on immediate playability after the first public X promotion.

## Audio rebuild

- Replaced the old single-oscillator beep family with original layered WebAudio SFX.
- Combat impacts now combine short filtered noise transients with a low tonal body instead of harsh square-wave beeps.
- Critical hits, hurt, pickup, potion, stairs, death, victory, equip, skill, shop and chest each use distinct envelopes/timbres.
- SFX pass through a private compressor/master bus to reduce spikes and clicks.
- No third-party/copyright audio samples were added.

## Music / SFX controls

- Added independent Music and SFX sliders, persisted on-device.
- Recommended default mix is Music 60% / SFX 78%.
- Music is significantly louder than the v1.3.2 30% fallback.
- `M` remains a fast master mute and now mutes both music and SFX through one canonical preference.
- Audio settings are reachable from the HUD, title screen and pause screen.
- New Adventure preserves audio and onboarding preferences while still resetting gameplay state.

## Decision clarity / onboarding

- Dungeon, backpack and town now use one canonical Class Fit score.
- Class Fit remains decision information; Item Value remains the economy/price basis.
- Added event-driven once-only guidance for movement, first combat, first gear, stairs and Return Scrolls.
- Existing experienced saves are not forced through the new guide.
- Canonical English HUD copy now states `C Skill · J Quick Dive`.

## Architecture

- `game/core/game.js` remains the sole audio-preference/SFX owner.
- `game/ui/adaptive-bgm-v132.js` owns only its private music graph and follows `de-audio-settings` events.
- The retired `audio-director`/destination interception topology remains quarantined.
- Public GitHub references were used for design principles only: Shattered Pixel Dungeon audio settings/event-specific SFX taxonomy and Tone.js/WebAudio envelope/filter/mixer patterns.

## Release boundary

- Semantic version: `1.3.3`.
- Public cache generation: `172`.
- Storage epoch stays `v130`; run/meta save compatibility is unchanged.
