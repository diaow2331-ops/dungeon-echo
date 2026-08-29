/* Dungeon Echo adaptive BGM v1.3.2.
 * Presentation-only WebAudio music follower.
 *
 * Recovers the six-scene v1.2 musical language without restoring the retired audio runtime:
 * - no interception of the global audio connection graph;
 * - no SFX ownership or gameplay API mutation;
 * - no Canvas, gameplay storage, RNG, cooldown or save writes;
 * - one lifecycle-scoped setTimeout ticker schedules against AudioContext.currentTime.
 *
 * game/core/game.js remains the sole gameplay/input/persistence authority. This module only
 * reads DE_TEST state to select a music scene and mirrors the existing M / mute-button action
 * without preventing or stopping those events.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_ADAPTIVE_BGM_V132) return;

  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    window.__DE_ADAPTIVE_BGM_V132 = Object.freeze({ version:'v1.3.2', supported:false });
    return;
  }

  const LOOKAHEAD = 0.20;
  const TICK_MS = 80;
  const DEFAULT_VOLUME = 0.30;
  const SCENES = Object.freeze({
    title:    Object.freeze({ bpm:58,  root:38, mode:[0,3,7,10], pattern:[0,null,2,null,1,null,3,null], gain:.48, pulse:false }),
    town:     Object.freeze({ bpm:76,  root:43, mode:[0,4,7,9],  pattern:[0,2,1,2,0,3,1,2],       gain:.50, pulse:false }),
    dungeon:  Object.freeze({ bpm:82,  root:38, mode:[0,3,7,8],  pattern:[0,null,1,0,2,null,1,3],    gain:.46, pulse:true  }),
    deep:     Object.freeze({ bpm:90,  root:36, mode:[0,1,6,7],  pattern:[0,1,null,2,0,3,1,null],    gain:.52, pulse:true  }),
    guardian: Object.freeze({ bpm:104, root:35, mode:[0,3,6,10], pattern:[0,1,0,2,3,1,0,2],         gain:.59, pulse:true  }),
    boss:     Object.freeze({ bpm:116, root:34, mode:[0,1,6,11], pattern:[0,2,1,3,0,1,2,3],         gain:.66, pulse:true  }),
  });

  let ctx = null;
  let master = null;
  let music = null;
  let scene = 'title';
  let step = 0;
  let nextBeat = 0;
  let timer = 0;
  let unlocked = false;
  let muted = false;
  let volume = DEFAULT_VOLUME;

  const midi = note => 440 * Math.pow(2, (note - 69) / 12);
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

  function sceneForState() {
    const state = String(api.state || '');
    if (state === 'town' || state === 'shop') return 'town';
    if (state !== 'playing' && state !== 'shrine' && state !== 'talent' && state !== 'echo') return 'title';
    const mobs = Array.isArray(api.monsters) ? api.monsters : [];
    if (mobs.some(m => m && Number(m.hp) > 0 && m.boss)) return 'boss';
    if (mobs.some(m => m && Number(m.hp) > 0 && m.midBoss)) return 'guardian';
    return (Number(api.depth) || 1) >= 71 ? 'deep' : 'dungeon';
  }

  function applyGain() {
    if (!ctx || !master) return;
    const target = muted ? 0 : volume;
    const now = ctx.currentTime;
    try {
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(target, now, .04);
    } catch (_err) {
      master.gain.value = target;
    }
  }

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume().catch(() => {});
      return ctx;
    }
    try {
      ctx = new AudioCtor();
      master = ctx.createGain();
      music = ctx.createGain();
      master.gain.value = muted ? 0 : volume;
      music.gain.value = SCENES[scene].gain;
      music.connect(master);
      master.connect(ctx.destination);
      nextBeat = ctx.currentTime + .08;
      return ctx;
    } catch (_err) {
      ctx = null; master = null; music = null;
      return null;
    }
  }

  function tone(freq, at, dur, gain=.025, type='triangle', cutoff=1200, detune=0) {
    if (!ctx || !music || muted || volume <= 0) return;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(24, freq), at);
    osc.detune.setValueAtTime(detune, at);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, at);
    filter.Q.value = .55;
    amp.gain.setValueAtTime(.0001, at);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), at + .018);
    amp.gain.exponentialRampToValueAtTime(.0001, at + dur);
    osc.connect(filter); filter.connect(amp); amp.connect(music);
    osc.start(at); osc.stop(at + dur + .04);
  }

  function pulse(at, strength=.018) {
    if (!ctx || !music || muted || volume <= 0) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(88, at);
    osc.frequency.exponentialRampToValueAtTime(42, at + .12);
    amp.gain.setValueAtTime(strength, at);
    amp.gain.exponentialRampToValueAtTime(.0001, at + .16);
    osc.connect(amp); amp.connect(music);
    osc.start(at); osc.stop(at + .18);
  }

  function chime(at, note, gain=.014) {
    tone(midi(note), at, .38, gain, 'sine', 2200);
    tone(midi(note + 12), at + .012, .26, gain * .34, 'sine', 2600, 4);
  }

  function scheduleBeat(at) {
    const cfg = SCENES[scene] || SCENES.title;
    const beat = 60 / cfg.bpm;
    const idx = cfg.pattern[step % cfg.pattern.length];
    if (idx !== null && idx !== undefined) {
      const note = cfg.root + cfg.mode[idx % cfg.mode.length];
      const accent = step % 4 === 0 ? 1.16 : 1;
      tone(midi(note), at, beat * .78, .026 * accent,
        scene === 'boss' ? 'sawtooth' : 'triangle', scene === 'town' ? 1450 : 820, -4);
      if (scene === 'town' && step % 2 === 0) chime(at + .018, note + 12, .009);
      if ((scene === 'deep' || scene === 'guardian' || scene === 'boss') && step % 4 === 2)
        tone(midi(note + (scene === 'boss' ? 1 : 12)), at, beat * .44, .010, 'sine', 1800, 3);
      if (scene === 'dungeon' && (Number(api.depth) || 1) >= 40 && step % 8 === 6)
        tone(midi(note + 13), at, beat * .34, .008, 'sine', 1700, -7);
    }
    if (cfg.pulse && step % (scene === 'boss' ? 2 : 4) === 0)
      pulse(at, scene === 'boss' ? .036 : scene === 'guardian' ? .029 : .018);
    step++;
  }

  function switchScene(next) {
    if (!SCENES[next] || next === scene) return false;
    scene = next;
    step = 0;
    if (ctx) {
      nextBeat = ctx.currentTime + .06;
      const now = ctx.currentTime;
      try {
        music.gain.cancelScheduledValues(now);
        music.gain.setTargetAtTime(SCENES[next].gain, now, .55);
      } catch (_err) { music.gain.value = SCENES[next].gain; }
      if (next === 'town') { chime(now + .04, SCENES[next].root + 12, .015); chime(now + .20, SCENES[next].root + 19, .010); }
      else if (next === 'guardian' || next === 'boss') { pulse(now + .04, next === 'boss' ? .050 : .038); tone(midi(SCENES[next].root), now + .04, .78, .036, 'sawtooth', 560); }
      else if (next === 'dungeon' || next === 'deep') tone(midi(SCENES[next].root), now + .04, .58, .018, 'triangle', 760, -6);
    }
    return true;
  }

  function stopTicker() {
    if (timer) clearTimeout(timer);
    timer = 0;
  }

  function tick() {
    timer = 0;
    if (!unlocked || document.hidden || !ctx || ctx.state === 'closed') return;
    switchScene(sceneForState());
    if (ctx.state === 'running' && !muted && volume > 0) {
      const cfg = SCENES[scene] || SCENES.title;
      const beat = 60 / cfg.bpm;
      while (nextBeat < ctx.currentTime + LOOKAHEAD) {
        scheduleBeat(nextBeat);
        nextBeat += beat;
      }
    } else {
      nextBeat = ctx.currentTime + .08;
    }
    timer = setTimeout(tick, TICK_MS);
  }

  function startTicker() {
    if (!unlocked || document.hidden || timer) return false;
    const c = ensureContext();
    if (!c) return false;
    switchScene(sceneForState());
    timer = setTimeout(tick, 0);
    return true;
  }

  function unlock() {
    if (unlocked && ctx) { startTicker(); return true; }
    unlocked = true;
    const c = ensureContext();
    if (!c) return false;
    if (c.state === 'suspended' && typeof c.resume === 'function') c.resume().catch(() => {});
    startTicker();
    return true;
  }

  function setMuted(value) {
    muted = !!value;
    applyGain();
    if (!muted) startTicker();
    return muted;
  }

  function toggleMuted() { return setMuted(!muted); }

  function setVolume(value) {
    volume = clamp(Number(value) || 0, 0, 1);
    applyGain();
    if (volume > 0) startTicker();
    return volume;
  }

  function onKeydown(event) {
    if (String(event && event.key || '').toLowerCase() === 'm') toggleMuted();
    unlock();
  }

  function onClick(event) {
    const target = event && event.target;
    if (target && typeof target.closest === 'function' && target.closest('[data-act="mute"]')) toggleMuted();
    unlock();
  }

  document.addEventListener('keydown', onKeydown, false);
  document.addEventListener('pointerdown', unlock, { passive:true });
  document.addEventListener('touchstart', unlock, { passive:true });
  document.addEventListener('click', onClick, false);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTicker();
    else if (unlocked) startTicker();
  });
  window.addEventListener('pageshow', () => { if (unlocked) startTicker(); });
  window.addEventListener('pagehide', stopTicker);
  window.addEventListener('beforeunload', stopTicker, { once:true });

  window.__DE_ADAPTIVE_BGM_V132 = Object.freeze({
    version:'v1.3.2', supported:true, owner:'adaptive-bgm-v132',
    scenes:SCENES, sceneForState, switchScene, unlock, startTicker, stopTicker,
    setMuted, toggleMuted, setVolume,
    get scene(){ return scene; }, get muted(){ return muted; }, get volume(){ return volume; },
    get running(){ return !!timer; }, get context(){ return ctx; },
  });
})();
