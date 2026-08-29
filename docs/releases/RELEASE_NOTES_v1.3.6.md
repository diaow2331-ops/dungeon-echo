# Dungeon Echo v1.3.6

Small post-launch UI/localization hotfix.

- English **New Run** now waits for the fixed-route core locale data before rendering the class-selection cards, preventing the first class screen from appearing in Chinese.
- The fresh-adventure transition remains deterministic and does not return to the retired `setTimeout(0)` timing race.
- The no-save **Continue** control now actually hides instead of relying on an undefined generic `.hidden` rule.
- No gameplay, balance, persistence schema, audio mix, or Canvas authority changes.

Release boundary: cache generation 175, runtime bootstrap v27.
