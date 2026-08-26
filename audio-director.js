/* Dungeon Echo adaptive audio director v2.
 * Pure WebAudio, no external media/copyright dependency.
 * Audio UX follows the proven Moyu mixer contract: independent BGM/SFX 0-100 sliders,
 * persistent recommended mix (30/85), and one-key master mute with M.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_AUDIO_DIRECTOR) return;

  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const MUSIC_KEY = 'de-audio-music-vol-v2';
  const SFX_KEY = 'de-audio-sfx-vol-v2';
  const MUTE_KEY = 'de-audio-master-muted-v2';
  const RECOMMENDED = Object.freeze({ music:30, sfx:85 });
  const clampPct = v => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  const loadPct = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : clampPct(raw);
    } catch (e) { return fallback; }
  };

  let musicVolume = loadPct(MUSIC_KEY, RECOMMENDED.music);
  let sfxVolume = loadPct(SFX_KEY, RECOMMENDED.sfx);
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

  const MIXER_MARK = Symbol.for('de.audio.mixer.v2');
  const entries = new Set();
  let mixer = window.__DE_AUDIO_MIXER_V2 || null;

  function installMixer() {
    if (mixer) return mixer;
    const proto = window.AudioNode && window.AudioNode.prototype;
    if (!proto || typeof proto.connect !== 'function') return null;
    if (proto[MIXER_MARK]) {
      mixer = window.__DE_AUDIO_MIXER_V2 || null;
      return mixer;
    }
    const nativeConnect = proto.connect;
    const byContext = new WeakMap();

    function levels(entry) {
      if (!entry || !entry.ctx) return;
      const t = entry.ctx.currentTime;
      entry.master.gain.cancelScheduledValues(t);
      entry.master.gain.setTargetAtTime(muted ? 0 : 1, t, .025);
      entry.music.gain.cancelScheduledValues(t);
      entry.music.gain.setTargetAtTime(musicVolume / 100, t, .025);
      entry.sfx.gain.cancelScheduledValues(t);
      entry.sfx.gain.setTargetAtTime(sfxVolume / 100, t, .025);
    }

    function buses(ctx) {
      if (!ctx) return null;
      let entry = byContext.get(ctx);
      if (entry) return entry;
      const master = ctx.createGain();
      const music = ctx.createGain();
      const sfx = ctx.createGain();
      master.__deAudioBypass = true;
      music.__deAudioBypass = true;
      sfx.__deAudioBypass = true;
      nativeConnect.call(music, master);
      nativeConnect.call(sfx, master);
      nativeConnect.call(master, ctx.destination);
      entry = { ctx, master, music, sfx };
      byContext.set(ctx, entry);
      entries.add(entry);
      levels(entry);
      return entry;
    }

    proto.connect = function(destination, ...rest) {
      const ctx = this && this.context;
      if (ctx && destination === ctx.destination && !this.__deAudioBypass) {
        const entry = buses(ctx);
        const target = this.__deAudioBus === 'music' ? entry.music : entry.sfx;
        return nativeConnect.call(this, target, ...rest);
      }
      return nativeConnect.call(this, destination, ...rest);
    };
    proto[MIXER_MARK] = { nativeConnect, buses };

    mixer = {
      version:'v2', buses,
      apply(){ for (const entry of entries) levels(entry); },
      get music(){ return musicVolume; },
      get sfx(){ return sfxVolume; },
      get muted(){ return muted; },
    };
    window.__DE_AUDIO_MIXER_V2 = mixer;
    return mixer;
  }
  installMixer();

  let ctx = null;
  let directorOut = null;
  let musicBus = null;
  let ambienceBus = null;
  let started = false;
  let scene = 'none';
  let step = 0;
  let nextBeat = 0;
  let timer = 0;
  let noise = null;
  let lastState = '';
  let lastDepth = -1;

  const SCENES = Object.freeze({
    title:    { bpm:58, root:38, mode:[0,3,7,10], pattern:[0,null,2,null,1,null,3,null], gain:.50, pulse:false },
    town:     { bpm:76, root:43, mode:[0,4,7,9],  pattern:[0,2,1,2,0,3,1,2], gain:.52, pulse:false },
    dungeon:  { bpm:82, root:38, mode:[0,3,7,8],  pattern:[0,null,1,0,2,null,1,3], gain:.48, pulse:true },
    deep:     { bpm:90, root:36, mode:[0,1,6,7],  pattern:[0,1,null,2,0,3,1,null], gain:.54, pulse:true },
    guardian: { bpm:104,root:35, mode:[0,3,6,10], pattern:[0,1,0,2,3,1,0,2], gain:.61, pulse:true },
    boss:     { bpm:116,root:34, mode:[0,1,6,11], pattern:[0,2,1,3,0,1,2,3], gain:.68, pulse:true },
  });

  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function persist() {
    try {
      localStorage.setItem(MUSIC_KEY, String(musicVolume));
      localStorage.setItem(SFX_KEY, String(sfxVolume));
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch (e) {}
  }

  function applyMixer() {
    if (mixer && typeof mixer.apply === 'function') mixer.apply();
    syncControls();
  }

  function setVolumes(music, sfx, save=true) {
    musicVolume = clampPct(music);
    sfxVolume = clampPct(sfx);
    if (save) persist();
    applyMixer();
  }

  function setMuted(on, save=true) {
    muted = !!on;
    if (save) persist();
    applyMixer();
  }

  function resumeContext() {
    if (!ctx || ctx.state === 'running' || ctx.state === 'closed' || typeof ctx.resume !== 'function') return;
    ctx.resume().catch(() => {});
  }

  function ensureContext() {
    if (ctx) {
      resumeContext();
      return ctx;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      directorOut = ctx.createGain();
      directorOut.__deAudioBus = 'music';
      musicBus = ctx.createGain();
      ambienceBus = ctx.createGain();
      musicBus.gain.value = 1;
      ambienceBus.gain.value = .16;
      musicBus.connect(directorOut);
      ambienceBus.connect(directorOut);
      directorOut.connect(ctx.destination);
      if (mixer) mixer.buses(ctx);
      startAmbience();
      started = true;
      nextBeat = ctx.currentTime + .08;
      setScene(sceneForState());
      syncControls();
      return ctx;
    } catch (e) { return null; }
  }

  function startAmbience() {
    if (!ctx || noise) return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * 2));
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
    filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = .35;
    gain.gain.value = .11;
    src.buffer = buffer; src.loop = true;
    src.connect(filter); filter.connect(gain); gain.connect(ambienceBus);
    src.start();
    noise = { src, filter, gain };
  }

  function tone(freq, at, dur, gain=.04, type='triangle', detune=0, cutoff=1200) {
    if (!ctx || !musicBus || muted || musicVolume <= 0) return;
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(Math.max(24, freq), at); o.detune.setValueAtTime(detune, at);
    f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff, at); f.Q.value = .55;
    g.gain.setValueAtTime(.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), at + .018);
    g.gain.exponentialRampToValueAtTime(.0001, at + dur);
    o.connect(f); f.connect(g); g.connect(musicBus);
    o.start(at); o.stop(at + dur + .03);
  }

  function thump(at, strength=.028) {
    if (!ctx || muted || musicVolume <= 0) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(92, at); o.frequency.exponentialRampToValueAtTime(43, at + .12);
    g.gain.setValueAtTime(strength, at); g.gain.exponentialRampToValueAtTime(.0001, at + .16);
    o.connect(g); g.connect(musicBus); o.start(at); o.stop(at + .18);
  }

  function chime(at, midiNote, gain=.025) {
    tone(midi(midiNote), at, .42, gain, 'sine', 0, 2200);
    tone(midi(midiNote + 12), at + .012, .30, gain*.34, 'sine', 4, 2600);
  }

  function previewSfx() {
    const c = ensureContext();
    if (!c || muted || sfxVolume <= 0) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(620, c.currentTime);
    g.gain.setValueAtTime(.035, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .07);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + .08);
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
    scene = next; step = 0;
    if (ctx) nextBeat = ctx.currentTime + .06;
    if (musicBus && ctx) {
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(SCENES[next].gain, ctx.currentTime, .55);
    }
    if (noise && ctx) {
      const hz = next === 'town' ? 620 : next === 'title' ? 360 : next === 'boss' ? 260 : next === 'guardian' ? 310 : 420;
      const ng = next === 'town' ? .07 : next === 'boss' ? .16 : .10;
      noise.filter.frequency.setTargetAtTime(hz, ctx.currentTime, .8);
      noise.gain.gain.setTargetAtTime(ng, ctx.currentTime, .8);
    }
    if (started) sceneSting(next);
    syncControls();
  }

  function sceneSting(next) {
    if (!ctx || muted) return;
    const at = ctx.currentTime + .03, s = SCENES[next];
    if (next === 'town') { chime(at, s.root + 12, .018); chime(at + .18, s.root + 19, .013); }
    else if (next === 'guardian' || next === 'boss') { thump(at, next === 'boss' ? .06 : .045); tone(midi(s.root), at, .85, .045, 'sawtooth', 0, 540); }
    else if (next === 'dungeon' || next === 'deep') tone(midi(s.root), at, .65, .022, 'triangle', -6, 760);
  }

  function scheduleBeat(at) {
    const s = SCENES[scene] || SCENES.title;
    const idx = s.pattern[step % s.pattern.length], beat = 60 / s.bpm;
    if (idx !== null && idx !== undefined) {
      const interval = s.mode[idx % s.mode.length], note = s.root + interval, depth = Number(api.depth) || 1;
      const accent = step % 4 === 0 ? 1.18 : 1;
      tone(midi(note), at, beat*.80, .030*accent, scene === 'boss' ? 'sawtooth' : 'triangle', -4, scene === 'town' ? 1450 : 820);
      if (scene === 'town' && step % 2 === 0) chime(at + .02, note + 12, .010);
      if ((scene === 'deep' || scene === 'guardian' || scene === 'boss') && step % 4 === 2) tone(midi(note + (scene === 'boss' ? 1 : 12)), at, beat*.48, .012, 'sine', 3, 1800);
      if (scene === 'dungeon' && depth >= 40 && step % 8 === 6) tone(midi(note + 13), at, beat*.36, .009, 'sine', -7, 1700);
    }
    if (s.pulse && step % (scene === 'boss' ? 2 : 4) === 0) thump(at, scene === 'boss' ? .042 : scene === 'guardian' ? .034 : .022);
    step++;
  }

  function pump() {
    if (!ctx || ctx.state === 'closed') return;
    setScene(sceneForState());
    if (!muted && musicVolume > 0 && ctx.state === 'running') {
      const beat = 60 / (SCENES[scene] || SCENES.title).bpm;
      while (nextBeat < ctx.currentTime + .22) { scheduleBeat(nextBeat); nextBeat += beat; }
    } else nextBeat = ctx.currentTime + .08;
    const state = String(api.state || ''), depth = Number(api.depth) || 0;
    if (state !== lastState || depth !== lastDepth) { lastState = state; lastDepth = depth; syncControls(); }
  }

  function installUi() {
    if (document.getElementById('de-audio-settings-btn')) return;
    const stats = document.getElementById('stats');
    if (!stats) return;
    const full = document.getElementById('fullscreen-toggle');
    const wrap = document.createElement('span');
    wrap.id = 'de-audio-settings-wrap';
    wrap.innerHTML = `
      <button id="de-audio-settings-btn" type="button" aria-expanded="false">⚙ 声音</button>
      <span id="de-audio-settings-pop" hidden role="dialog" aria-label="声音设置">
        <span class="de-audio-head"><b>声音设置</b><button id="de-audio-master" type="button"></button></span>
        <label><span>背景音乐</span><input id="de-music-vol" type="range" min="0" max="100" step="1"><output id="de-music-out"></output></label>
        <label><span>游戏音效</span><input id="de-sfx-vol" type="range" min="0" max="100" step="1"><output id="de-sfx-out"></output></label>
        <span class="de-audio-tools"><button id="de-audio-preset" type="button">恢复推荐 30 / 85</button></span>
        <small>音乐与音效独立保存 · M 快速静音/恢复</small>
      </span>`;
    if (full && full.parentNode === stats) stats.insertBefore(wrap, full); else stats.appendChild(wrap);

    const style = document.createElement('style');
    style.id = 'de-audio-director-style-v2';
    style.textContent = `
      #de-audio-settings-wrap{position:relative;display:inline-flex}
      #de-audio-settings-btn,#de-audio-master,#de-audio-preset{border:1px solid rgba(224,167,58,.30);background:#17100c;color:#d9c7a3;cursor:pointer}
      #de-audio-settings-btn{padding:5px 9px;white-space:nowrap}
      #de-audio-settings-pop{position:absolute;right:0;top:calc(100% + 7px);z-index:80;width:310px;padding:12px;background:rgba(18,13,10,.98);border:1px solid #74582f;box-shadow:0 12px 36px rgba(0,0,0,.55);border-radius:8px}
      #de-audio-settings-pop:not([hidden]){display:block}
      #de-audio-settings-pop .de-audio-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;color:#f0d6a2}
      #de-audio-master{padding:5px 7px;font-size:11px}
      #de-audio-settings-pop label{display:grid;grid-template-columns:76px 1fr 44px;align-items:center;gap:8px;margin:10px 0;color:#d9c7a3;font-size:11px;font-weight:700}
      #de-audio-settings-pop input[type=range]{width:100%;accent-color:#d7a640;cursor:pointer}
      #de-audio-settings-pop output{text-align:right;color:#9fbde8;font-variant-numeric:tabular-nums}
      #de-audio-settings-pop .de-audio-tools{display:flex;justify-content:flex-end;margin-top:8px}
      #de-audio-preset{padding:5px 8px;font-size:10px}
      #de-audio-settings-pop small{display:block;border-top:1px solid rgba(139,104,53,.28);margin-top:10px;padding-top:8px;color:#8f816e;line-height:1.5}
      @media(max-width:700px){#de-audio-settings-pop{position:fixed;left:10px;right:10px;top:auto;bottom:10px;width:auto;max-width:none;padding:14px}#de-audio-settings-pop label{grid-template-columns:72px 1fr 46px;margin:13px 0}#de-audio-settings-pop input[type=range]{height:28px}}
    `;
    document.head.appendChild(style);

    const btn = document.getElementById('de-audio-settings-btn');
    const pop = document.getElementById('de-audio-settings-pop');
    const masterBtn = document.getElementById('de-audio-master');
    const music = document.getElementById('de-music-vol');
    const sfx = document.getElementById('de-sfx-vol');
    const preset = document.getElementById('de-audio-preset');

    btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); ensureContext(); const open = pop.hidden; pop.hidden = !open; btn.setAttribute('aria-expanded', String(open)); syncControls(); });
    pop.addEventListener('pointerdown', e => e.stopPropagation());
    document.addEventListener('pointerdown', e => { if (!e.target.closest('#de-audio-settings-wrap')) { pop.hidden = true; btn.setAttribute('aria-expanded','false'); } });
    masterBtn.addEventListener('click', e => { e.preventDefault(); setMuted(!muted); });
    music.addEventListener('input', e => { e.stopPropagation(); ensureContext(); setVolumes(music.value, sfxVolume); });
    sfx.addEventListener('input', e => { e.stopPropagation(); ensureContext(); setVolumes(musicVolume, sfx.value); clearTimeout(sfx._previewTimer); sfx._previewTimer=setTimeout(previewSfx,80); });
    preset.addEventListener('click', e => { e.preventDefault(); ensureContext(); setVolumes(RECOMMENDED.music, RECOMMENDED.sfx); previewSfx(); });
    syncControls();
  }

  function syncControls() {
    const music = document.getElementById('de-music-vol'), sfx = document.getElementById('de-sfx-vol');
    const mout = document.getElementById('de-music-out'), sout = document.getElementById('de-sfx-out');
    const masterBtn = document.getElementById('de-audio-master'), btn = document.getElementById('de-audio-settings-btn');
    if (music) music.value = String(musicVolume); if (sfx) sfx.value = String(sfxVolume);
    if (mout) mout.textContent = musicVolume + '%'; if (sout) sout.textContent = sfxVolume + '%';
    if (masterBtn) masterBtn.textContent = muted ? '总开关：关' : '总开关：开';
    if (btn) btn.textContent = muted ? '⚙ 静音' : `⚙ ${musicVolume}/${sfxVolume}`;
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
      } else if (key === 'k') chime(at, cid === 'mage' ? 69 : cid === 'ranger' ? 64 : cid === 'assassin' ? 58 : 55, .014);
    });
  }

  function unlock(e) {
    if (e && e.type === 'keydown' && String(e.key || '').toLowerCase() === 'm') return;
    ensureContext();
    if (ctx && !timer) timer = window.setInterval(pump, 70);
  }

  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resumeContext();
  });
  window.addEventListener('click', e => {
    const target = e && e.target;
    if (!target || typeof target.closest !== 'function' || !target.closest('[data-act="mute"]')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    ensureContext(); setMuted(!muted);
  }, true);
  window.addEventListener('keydown', e => {
    const key = String(e.key || '').toLowerCase();
    if (key === 'm') {
      e.preventDefault(); e.stopImmediatePropagation();
      ensureContext(); setMuted(!muted); return;
    }
    if (key === 'j' || key === 'k') { ensureContext(); richerActionAccent(key); }
  }, true);

  installUi();
  window.__DE_AUDIO_DIRECTOR = {
    version:'v2', scenes:{...SCENES}, ensureContext, setVolumes, setMuted, previewSfx,
    mixer:()=>mixer,
    get scene(){ return scene; }, get musicVolume(){ return musicVolume; }, get sfxVolume(){ return sfxVolume; }, get muted(){ return muted; },
  };
})();