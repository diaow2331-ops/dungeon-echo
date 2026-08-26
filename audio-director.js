/* Dungeon Echo adaptive audio director v1.
 * Pure WebAudio, no external media/copyright dependency.
 * Adds scene-aware low-fi dark-fantasy BGM/ambience while leaving core combat SFX intact.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_AUDIO_DIRECTOR) return;

  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const SETTINGS_KEY = 'de-audio-director-v1';
  const LEVELS = [0.18, 0.28, 0.40];
  let levelIndex = 1;
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    const n = Number(raw && raw.bgm);
    if (Number.isFinite(n)) {
      const i = LEVELS.findIndex(v => Math.abs(v - n) < 0.01);
      if (i >= 0) levelIndex = i;
    }
  } catch (e) {}

  let ctx = null;
  let master = null;
  let musicBus = null;
  let ambienceBus = null;
  let muted = false;
  let started = false;
  let scene = 'none';
  let step = 0;
  let nextBeat = 0;
  let timer = 0;
  let noise = null;
  let lastState = '';
  let lastDepth = -1;

  const SCENES = Object.freeze({
    title:    { bpm:58, root:38, mode:[0,3,7,10], pattern:[0,null,2,null,1,null,3,null], gain:.72, pulse:false },
    town:     { bpm:76, root:43, mode:[0,4,7,9],  pattern:[0,2,1,2,0,3,1,2], gain:.74, pulse:false },
    dungeon:  { bpm:82, root:38, mode:[0,3,7,8],  pattern:[0,null,1,0,2,null,1,3], gain:.70, pulse:true },
    deep:     { bpm:90, root:36, mode:[0,1,6,7],  pattern:[0,1,null,2,0,3,1,null], gain:.78, pulse:true },
    guardian: { bpm:104,root:35, mode:[0,3,6,10], pattern:[0,1,0,2,3,1,0,2], gain:.88, pulse:true },
    boss:     { bpm:116,root:34, mode:[0,1,6,11], pattern:[0,2,1,3,0,1,2,3], gain:.98, pulse:true },
  });

  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const now = () => ctx ? ctx.currentTime : 0;

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ bgm:LEVELS[levelIndex] })); } catch (e) {}
  }

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      musicBus = ctx.createGain();
      ambienceBus = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      musicBus.gain.value = LEVELS[levelIndex];
      ambienceBus.gain.value = 0.11;
      musicBus.connect(master);
      ambienceBus.connect(master);
      master.connect(ctx.destination);
      startAmbience();
      started = true;
      nextBeat = ctx.currentTime + 0.08;
      updateChip();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function startAmbience() {
    if (!ctx || noise) return;
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i=0;i<length;i++) {
      const white = Math.random() * 2 - 1;
      last = last * .985 + white * .015;
      data[i] = last * .65;
    }
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = .35;
    gain.gain.value = .12;
    src.buffer = buffer;
    src.loop = true;
    src.connect(filter); filter.connect(gain); gain.connect(ambienceBus);
    src.start();
    noise = { src, filter, gain };
  }

  function tone(freq, at, dur, gain=.04, type='triangle', detune=0, cutoff=1200) {
    if (!ctx || !musicBus || muted) return;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(24, freq), at);
    o.detune.setValueAtTime(detune, at);
    f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff, at); f.Q.value = .55;
    g.gain.setValueAtTime(.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), at + .018);
    g.gain.exponentialRampToValueAtTime(.0001, at + dur);
    o.connect(f); f.connect(g); g.connect(musicBus);
    o.start(at); o.stop(at + dur + .03);
  }

  function thump(at, strength=.028) {
    if (!ctx || muted) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(92, at);
    o.frequency.exponentialRampToValueAtTime(43, at + .12);
    g.gain.setValueAtTime(strength, at);
    g.gain.exponentialRampToValueAtTime(.0001, at + .16);
    o.connect(g); g.connect(musicBus);
    o.start(at); o.stop(at + .18);
  }

  function chime(at, midiNote, gain=.025) {
    tone(midi(midiNote), at, .42, gain, 'sine', 0, 2200);
    tone(midi(midiNote + 12), at + .012, .30, gain*.34, 'sine', 4, 2600);
  }

  function sceneForState() {
    const state = String(api.state || '');
    if (state === 'town' || state === 'shop') return 'town';
    if (state !== 'playing' && state !== 'shrine' && state !== 'talent' && state !== 'echo') return 'title';
    const mobs = Array.isArray(api.monsters) ? api.monsters : [];
    if (mobs.some(m => m && Number(m.hp) > 0 && m.boss)) return 'boss';
    if (mobs.some(m => m && Number(m.hp) > 0 && m.midBoss)) return 'guardian';
    return (Number(api.depth) || 1) >= 71 ? 'deep' : 'dungeon';
  }

  function setScene(next) {
    if (!SCENES[next] || next === scene) return;
    scene = next;
    step = 0;
    if (ctx) nextBeat = ctx.currentTime + .06;
    if (musicBus && ctx) {
      const target = LEVELS[levelIndex] * SCENES[next].gain;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(target, ctx.currentTime, .55);
    }
    if (noise && ctx) {
      const hz = next === 'town' ? 620 : next === 'title' ? 360 : next === 'boss' ? 260 : next === 'guardian' ? 310 : 420;
      noise.filter.frequency.setTargetAtTime(hz, ctx.currentTime, .8);
      const ng = next === 'town' ? .075 : next === 'boss' ? .17 : .11;
      noise.gain.gain.setTargetAtTime(ng, ctx.currentTime, .8);
    }
    if (started) sceneSting(next);
  }

  function sceneSting(next) {
    if (!ctx || muted) return;
    const at = ctx.currentTime + .03;
    const s = SCENES[next];
    if (next === 'town') {
      chime(at, s.root + 12, .018); chime(at + .18, s.root + 19, .013);
    } else if (next === 'guardian' || next === 'boss') {
      thump(at, next === 'boss' ? .06 : .045);
      tone(midi(s.root), at, .85, .045, 'sawtooth', 0, 540);
    } else if (next === 'dungeon' || next === 'deep') {
      tone(midi(s.root), at, .65, .022, 'triangle', -6, 760);
    }
  }

  function scheduleBeat(at) {
    const s = SCENES[scene] || SCENES.title;
    const idx = s.pattern[step % s.pattern.length];
    const beat = 60 / s.bpm;
    if (idx !== null && idx !== undefined) {
      const interval = s.mode[idx % s.mode.length];
      const note = s.root + interval;
      const depth = Number(api.depth) || 1;
      const accent = (step % 4 === 0) ? 1.18 : 1;
      tone(midi(note), at, beat*.80, .030*accent, scene === 'boss' ? 'sawtooth' : 'triangle', -4, scene === 'town' ? 1450 : 820);
      if (scene === 'town' && step % 2 === 0) chime(at + .02, note + 12, .010);
      if ((scene === 'deep' || scene === 'guardian' || scene === 'boss') && step % 4 === 2) {
        tone(midi(note + (scene === 'boss' ? 1 : 12)), at, beat*.48, .012, 'sine', 3, 1800);
      }
      if (scene === 'dungeon' && depth >= 40 && step % 8 === 6) tone(midi(note + 13), at, beat*.36, .009, 'sine', -7, 1700);
    }
    if (s.pulse && step % (scene === 'boss' ? 2 : 4) === 0) thump(at, scene === 'boss' ? .042 : scene === 'guardian' ? .034 : .022);
    step++;
  }

  function pump() {
    if (!ctx || ctx.state === 'closed') return;
    setScene(sceneForState());
    if (!muted && ctx.state === 'running') {
      const s = SCENES[scene] || SCENES.title;
      const beat = 60 / s.bpm;
      while (nextBeat < ctx.currentTime + .22) {
        scheduleBeat(nextBeat);
        nextBeat += beat;
      }
    } else {
      nextBeat = ctx.currentTime + .08;
    }
    const state = String(api.state || '');
    const depth = Number(api.depth) || 0;
    if (state !== lastState || depth !== lastDepth) { lastState = state; lastDepth = depth; updateChip(); }
  }

  function setMuted(on) {
    muted = !!on;
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, .08);
    }
    updateChip();
  }

  function cycleVolume() {
    levelIndex = (levelIndex + 1) % LEVELS.length;
    saveSettings();
    if (ctx && musicBus) {
      const s = SCENES[scene] || SCENES.title;
      musicBus.gain.setTargetAtTime(LEVELS[levelIndex] * s.gain, ctx.currentTime, .12);
    }
    updateChip();
  }

  function updateChip() {
    let chip = document.getElementById('de-audio-chip');
    if (!chip) return;
    const pct = Math.round(LEVELS[levelIndex] * 100);
    chip.textContent = muted ? '♫ 静音' : `♫ ${pct}%`;
    chip.setAttribute('aria-pressed', String(muted));
    chip.title = '点击切换音乐音量 · M 同时静音/恢复音乐与游戏音效';
  }

  function installUi() {
    if (document.getElementById('de-audio-chip')) return;
    const full = document.getElementById('fullscreen-toggle');
    const stats = document.getElementById('stats');
    if (!stats) return;
    const chip = document.createElement('button');
    chip.id = 'de-audio-chip';
    chip.type = 'button';
    chip.className = 'audio-chip';
    chip.addEventListener('click', e => { e.preventDefault(); ensureContext(); cycleVolume(); });
    if (full && full.parentNode === stats) stats.insertBefore(chip, full); else stats.appendChild(chip);

    const style = document.createElement('style');
    style.id = 'de-audio-director-style';
    style.textContent = `
      #de-audio-chip{border:1px solid rgba(224,167,58,.22);background:rgba(20,15,11,.72);color:#cdbb99;
        border-radius:7px;padding:5px 8px;font:600 11px/1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;
        transition:border-color .15s ease,background .15s ease,color .15s ease}
      #de-audio-chip:hover{border-color:rgba(224,167,58,.45);background:rgba(36,25,16,.84);color:#f0d6a2}
      @media(max-width:700px){#de-audio-chip{display:none}}
    `;
    if (document.head) document.head.appendChild(style);
    updateChip();
  }

  function richerActionAccent(key) {
    if (!ctx || muted || api.state !== 'playing') return;
    const before = Number(api.turns) || 0;
    queueMicrotask(() => {
      const after = Number(api.turns) || 0;
      if (after <= before || !ctx || muted) return;
      const at = ctx.currentTime + .005;
      const cid = api.classId || (api.meta && api.meta.classId) || 'warrior';
      if (key === 'j') {
        const f = cid === 'warrior' ? 95 : cid === 'ranger' ? 185 : cid === 'mage' ? 240 : 150;
        tone(f, at, .07, .018, cid === 'mage' ? 'sine' : 'triangle', cid === 'assassin' ? -40 : 0, 1400);
      } else if (key === 'k') {
        chime(at, cid === 'mage' ? 69 : cid === 'ranger' ? 64 : cid === 'assassin' ? 58 : 55, .014);
      }
    });
  }

  function unlock(e) {
    if (e && e.type === 'keydown' && String(e.key || '').toLowerCase() === 'm') return;
    ensureContext();
    if (ctx && !timer) timer = window.setInterval(pump, 70);
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('touchstart', unlock, true);
  }

  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('keydown', e => {
    const key = String(e.key || '').toLowerCase();
    if (key === 'm') {
      ensureContext();
      setMuted(!muted);
      return;
    }
    ensureContext();
    if (ctx && !timer) timer = window.setInterval(pump, 70);
    if (key === 'j' || key === 'k') richerActionAccent(key);
  }, false);

  installUi();
  setScene(sceneForState());
  window.__DE_AUDIO_DIRECTOR = {
    version:'v1', ensureContext, setMuted, cycleVolume,
    get scene(){ return scene; }, get muted(){ return muted; }, get volume(){ return LEVELS[levelIndex]; },
  };
})();
