Dungeon Echo 91HWL deployment bundle

This package extends the existing play.91hwl.cn release tree. It preserves
/moyu/, replaces the bundled game at /dungeon-echo/, switches the existing
/srv/91hwl-play/current symlink atomically, and rolls back on failed checks.

Server usage:
  unzip 91hwl-play-dungeon-echo-v1.3.3.zip -d /tmp/91hwl-play-dungeon-echo-v1.3.3
  cd /tmp/91hwl-play-dungeon-echo-v1.3.3
  sudo ./ops/deploy.sh

v1.3.3 publishes cache generation 172 as a post-launch UX/audio hot update:
Class Fit is consistent across dungeon/backpack/town decisions, first-run guidance is event-driven
and once-only, the old harsh oscillator beeps are replaced by layered filtered WebAudio SFX,
and Music / SFX now have independent persistent 0–100% controls (recommended 60 / 78).
M remains the canonical master mute. New Adventure resets gameplay while preserving audio/onboarding
preferences. The retired audio-director and destination interception topology remain quarantined.

Success markers:
  dungeon_echo_healthcheck=PASS
  dungeon_echo_site_deploy=PASS
