'use strict';
// ─────────────────────────────────────────────
// audio.js — 배경음과 대사 타자 소리 (파일 없이 Web Audio로 합성)
// 브라우저는 사용자가 키를 누르기 전엔 소리를 막기 때문에 첫 키 입력 때 start()
// ─────────────────────────────────────────────

const Sound = (() => {
  const VOLUME = 0.5;
  let ctx = null, master = null, muted = false;

  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

  // 음 하나: type 파형, 시작 시각 t, 길이 dur, 크기 vol
  function note(type, midi, t, dur, vol, dest = master) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = hz(midi);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env).connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // ── 배경음악: 장면마다 다른 곡 (story.js 의 musicTrack() 이 고른다) ──
  // 음표는 문자열로 적는다. 한 마디 = 8분음표 8칸. "E5" 음, "-" 앞 음을 늘임, "." 쉼표
  // 코드 이름 → 구성음 (근음이 맨 앞)
  const NOTE_OF = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const midiOf = s => {
    const m = /^([A-G][#b]?)(-?\d)$/.exec(s);
    return (Number(m[2]) + 1) * 12 + NOTE_OF[m[1]];
  };
  const CHORD = name => {
    const m = /^([A-G][#b]?)(m|7|maj7|m7)?$/.exec(name);
    const r = 48 + NOTE_OF[m[1]];   // 근음: 3옥타브 근처
    const q = m[2] || '';
    const third = q.startsWith('m') && q !== 'maj7' ? 3 : 4;
    const notes = [r, r + third, r + 7];
    if (q === '7' || q === 'm7') notes.push(r + 10);
    if (q === 'maj7') notes.push(r + 11);
    return notes;
  };
  // "E5 - C5 ." → [{ midi, len(칸 수) } 또는 null] 8칸
  const bar = s => {
    const cells = s.trim().split(/\s+/), out = new Array(cells.length).fill(null);
    let last = -1;
    cells.forEach((c, i) => {
      if (c === '-') { if (last >= 0) out[last].len++; }
      else if (c === '.') last = -1;
      else { out[i] = { midi: midiOf(c), len: 1 }; last = i; }
    });
    return out;
  };

  // 곡 정의
  //   bpm, chords(마디별), melody(마디별 문자열, 짧으면 반복), lead(멜로디 음색),
  //   arp(반주 무늬: 0~2 = 코드 음, 3 = 근음 옥타브 위, null = 쉼), arpVol, bass(무늬: 'r' 근음, '5' 5도, 'o' 옥타브, '.' 쉼),
  //   drums(8칸: k 킥, s 스네어, h 하이햇, '.' 쉼, 마디마다 반복), pad(코드를 길게 깔기), box(오르골)
  const TRACKS = {
    // 처음 곡 (원래 배경음): 타이틀부터 1장 방과 후 노을 전까지. 쓸쓸한 Am - F - Dm - E, 8마디 반복
    original: {
      bpm: 84, legacy: true,
      chords: ['Am', 'F', 'Dm', 'E'],
      melody: ['E5 . C5 . D5 C5 B4 .', 'C5 . . A4 C5 . F5 .', 'E5 . D5 . C5 . A4 .', 'B4 . G#4 . B4 D5 E5 .'],
      arp: [0, 1, 2, 3, 2, 1, 2, 1],
      bass: '. . . . . . . .',
      drums: '',
    },
    // 학교의 낮: 가볍게 통통 튀는 C장조
    day: {
      bpm: 100, lead: 'square', leadVol: 0.03, arpVol: 0.035,
      chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'Em', 'F', 'C', 'Dm', 'G', 'C', 'G'],
      melody: [
        'E5 - D5 C5 D5 - G4 -', 'B4 - C5 D5 D5 - - .', 'C5 - B4 A4 E5 - - .', 'F5 E5 D5 C5 A4 - - .',
        'E5 - D5 C5 D5 - G5 -', 'G5 F5 E5 D5 B4 - - .', 'A4 C5 F5 E5 D5 - C5 -', 'D5 - - . G4 . . .',
        'A4 - C5 E5 A5 - G5 -', 'G5 - E5 - B4 - - .', 'A4 - C5 - F5 - E5 D5', 'E5 - - - G4 - - .',
        'F5 - E5 D5 A4 - D5 -', 'D5 - B4 G4 D5 - F5 -', 'E5 - C5 - G5 - E5 -', 'D5 - - - . . . .',
      ],
      arp: [0, 2, 1, 2, 3, 2, 1, 2],
      bass: 'r . . r 5 . r .',
      drums: 'k . h . s . h h',
    },
    // 미스터리: 쓸쓸한 A단조 (방과 후, 창고, 타이틀)
    mystery: {
      bpm: 80, lead: 'square', leadVol: 0.032, arpVol: 0.04, pad: true,
      chords: ['Am', 'F', 'Dm', 'E', 'Am', 'F', 'Dm', 'E', 'Dm', 'Am', 'Bb', 'E', 'F', 'Dm', 'E', 'E7'],
      melody: [
        'E5 - C5 - D5 C5 B4 -', 'C5 - - A4 C5 - F5 -', 'E5 - D5 - C5 - A4 -', 'B4 - G#4 - B4 D5 E5 -',
        'A5 - - G5 F5 - E5 -', 'C5 - - - A4 - C5 -', 'D5 - F5 - A5 - G#5 -', 'E5 - - - - - . .',
        'F5 - E5 D5 A4 - - .', 'C5 - B4 A4 E4 - - .', 'D5 - F5 - Bb5 - A5 -', 'G#5 - - - B4 - - .',
        'A4 - C5 - F5 - E5 -', 'D5 - F5 - A4 - - .', 'B4 - D5 - G#4 - B4 -', 'E5 - - - - - . .',
      ],
      arp: [0, 1, 2, 3, 2, 1, 2, 1],
      bass: 'r - - - 5 - - -',
      drums: 'k . . . . . h .',
    },
    // 기억 속 2026년: 낡은 오르골
    memory: {
      bpm: 72, lead: 'sine', leadVol: 0.05, arpVol: 0.03, box: true,
      chords: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A'],
      melody: [
        'A5 . D6 . F6 . E6 D6', 'F6 . . . D6 . . .', 'C6 . F6 . A6 . G6 F6', 'E6 . . . C6 . . .',
        'A5 . D6 . F6 . A6 .', 'G6 . F6 . D6 . . .', 'Bb5 . D6 . G6 . F6 E6', 'C#6 . . . A5 . . .',
      ],
      arp: [0, null, 2, null, 1, null, 2, null],
      bass: 'r - - - - - - -',
      drums: '',
    },
    // 저녁의 집, 엔딩: 따뜻한 F장조
    home: {
      bpm: 70, lead: 'triangle', leadVol: 0.07, arpVol: 0.035, pad: true,
      chords: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C'],
      melody: [
        'A4 - C5 - F5 - E5 -', 'E5 - D5 C5 G4 - - .', 'F4 - A4 - D5 - C5 -', 'Bb4 - A4 G4 D5 - - .',
        'A4 - C5 - F5 - G5 -', 'E5 - C5 - G5 - - .', 'F5 - D5 - Bb4 - D5 -', 'C5 - - - - - . .',
      ],
      arp: [0, 1, 2, 1, 3, 1, 2, 1],
      bass: 'r - - - r - - -',
      drums: '',
    },
    // 추리 대결: 빠르고 긴장된 E단조
    tension: {
      bpm: 126, lead: 'square', leadVol: 0.03, arpVol: 0.03,
      chords: ['Em', 'C', 'D', 'B', 'Em', 'C', 'Am', 'B7'],
      melody: [
        'E5 . G5 . B5 . A5 G5', 'E5 . . . C5 . E5 .', 'F#5 . A5 . D6 . C6 B5', 'D#5 . . . B4 . D#5 .',
        'E5 . G5 . B5 . E6 .', 'D6 . C6 . G5 . E5 .', 'A5 . C6 . E6 . D6 C6', 'B5 . . . F#5 . D#5 .',
      ],
      arp: [0, 3, 0, 3, 0, 3, 0, 3],
      bass: 'r r r r r r 5 5',
      drums: 'k h s h k k s h',
    },
    // 개교기념식: 당당한 행진곡 G장조
    ceremony: {
      bpm: 108, lead: 'square', leadVol: 0.032, arpVol: 0.03, pad: true,
      chords: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'D', 'Em', 'C', 'G', 'D', 'C', 'D', 'G', 'G'],
      melody: [
        'B4 - D5 - G5 - F#5 E5', 'F#5 - - - D5 - - .', 'E5 - G5 - B5 - A5 G5', 'A5 - G5 - E5 - - .',
        'B4 - D5 - G5 - B5 -', 'A5 - F#5 - D5 - A5 -', 'G5 - E5 - C5 - E5 -', 'F#5 - - - - - . .',
        'G5 - B5 - E6 - D6 -', 'C6 - - - G5 - E5 -', 'D5 - G5 - B5 - D6 -', 'C6 - B5 - A5 - - .',
        'E5 - G5 - C6 - B5 -', 'A5 - F#5 - D5 - F#5 -', 'G5 - - - D5 - B4 -', 'G4 - - - - - . .',
      ],
      arp: [0, 2, 1, 2, 0, 2, 1, 2],
      bass: 'r . 5 . r . 5 .',
      drums: 'k . s . k k s s',
    },
  };
  // 문자열을 미리 풀어 둔다
  for (const t of Object.values(TRACKS)) {
    t.chordNotes = t.chords.map(CHORD);
    t.bars = t.melody.map(bar);
    t.bassCells = t.bass.split(/\s+/);
    t.drumCells = t.drums ? t.drums.split(/\s+/) : null;
  }

  let track = TRACKS.original, trackName = 'original', wantTrack = 'original', switchAt = 0;
  let step = 0, nextTime = 0, musicBus = null, leadBus = null, noiseBuf = null;

  // 북소리: 킥(내려가는 사인), 스네어·하이햇(잡음)
  function drum(kind, t) {
    if (kind === 'k') {
      const osc = ctx.createOscillator(), env = ctx.createGain();
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      env.gain.setValueAtTime(0.16, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(env).connect(musicBus);
      osc.start(t);
      osc.stop(t + 0.2);
      return;
    }
    const src = ctx.createBufferSource(), filt = ctx.createBiquadFilter(), env = ctx.createGain();
    src.buffer = noiseBuf;
    filt.type = kind === 'h' ? 'highpass' : 'bandpass';
    filt.frequency.value = kind === 'h' ? 7000 : 1800;
    const dur = kind === 'h' ? 0.04 : 0.12, vol = kind === 'h' ? 0.025 : 0.05;
    env.gain.setValueAtTime(vol, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(env).connect(musicBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.01);
  }

  function scheduleBgm() {
    // 곡 바꾸기: 잠깐 소리를 줄였다가, 줄어든 뒤에 새 곡을 처음부터
    if (wantTrack !== trackName && !switchAt) {
      switchAt = ctx.currentTime + 0.7;
      musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.18);
    }
    if (switchAt && ctx.currentTime >= switchAt) {
      trackName = wantTrack;
      track = TRACKS[trackName];
      step = 0;
      nextTime = ctx.currentTime + 0.05;
      switchAt = 0;
      musicBus.gain.setTargetAtTime(1, ctx.currentTime, 0.3);
    }
    if (switchAt) return;
    const eighth = 60 / track.bpm / 2;
    while (nextTime < ctx.currentTime + 0.25) {
      const b = Math.floor(step / 8) % track.chords.length, beat = step % 8;
      const chord = track.chordNotes[b];
      // 원래 곡은 예전 방식 그대로 (반주는 제 옥타브, 멜로디는 앞 4마디만, 근음 베이스 두 번)
      if (track.legacy) {
        const bar8 = Math.floor(step / 8) % 8, li = track.arp[beat];
        note('triangle', li === 3 ? chord[0] + 12 : chord[li], nextTime, eighth * 1.6, 0.05, musicBus);
        if (beat === 0 || beat === 4) note('triangle', chord[0] - 12, nextTime, eighth * 3.5, 0.08, musicBus);
        const ln = bar8 < 4 ? track.bars[bar8][beat] : null;
        if (ln) note('square', ln.midi, nextTime, eighth * 1.8, 0.035, leadBus);
        step++;
        nextTime += eighth;
        continue;
      }
      // 반주
      const i = track.arp[beat];
      if (i !== null && i !== undefined) {
        const m = i === 3 ? chord[0] + 12 : chord[i];
        if (track.box) {
          note('sine', m + 24, nextTime, eighth * 3, track.arpVol, musicBus);
        } else {
          note('triangle', m + 12, nextTime, eighth * 1.6, track.arpVol, musicBus);
        }
      }
      // 베이스
      const bc = track.bassCells[beat];
      if (bc === 'r' || bc === '5' || bc === 'o') {
        const m = chord[0] - 12 + (bc === '5' ? 7 : bc === 'o' ? 12 : 0);
        const len = track.bassCells.slice(beat + 1).findIndex(c => c !== '-');
        const hold = len < 0 ? 8 - beat : len + 1;
        note('triangle', m, nextTime, eighth * hold * 0.95, 0.09, musicBus);
      }
      // 패드: 마디 첫 박에 코드를 길게
      if (track.pad && beat === 0) {
        for (const m of chord.slice(0, 3)) note('sine', m + 12, nextTime, eighth * 8, 0.018, musicBus);
      }
      // 멜로디 (16마디 곡은 그대로, 짧은 곡은 반복)
      const mb = track.bars[b % track.bars.length], n = mb[beat];
      if (n) {
        if (track.box) {
          note('sine', n.midi, nextTime, eighth * Math.max(2, n.len * 1.5), track.leadVol, leadBus);
          note('sine', n.midi + 12, nextTime, eighth * 1.2, track.leadVol * 0.3, leadBus);
        } else {
          note(track.lead, n.midi, nextTime, eighth * n.len * 0.95, track.leadVol, leadBus);
        }
      }
      // 북
      if (track.drumCells) {
        const d = track.drumCells[beat];
        if (d && d !== '.') drum(d, nextTime);
      }
      step++;
      nextTime += eighth;
    }
  }

  // 곡 고르기 (매 프레임 불러도 된다 — 바뀔 때만 넘어간다)
  function setTrack(name) {
    if (TRACKS[name]) wantTrack = name;
  }

  function start() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.connect(master);
    // 네모파 멜로디는 살짝 둥글게
    leadBus = ctx.createBiquadFilter();
    leadBus.type = 'lowpass';
    leadBus.frequency.value = 1800;
    leadBus.connect(musicBus);
    // 잡음 (스네어·하이햇)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    trackName = wantTrack;
    track = TRACKS[trackName];
    nextTime = ctx.currentTime + 0.1;
    setInterval(scheduleBgm, 50);
  }

  // 대사 한 글자마다 짧은 "삑"
  function blip() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 520 + Math.random() * 40;
    env.gain.setValueAtTime(0.06, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(env).connect(master);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // 실험 화면 효과음
  const SFX = {
    move: [['square', 72, 0, 0.04, 0.05]],
    select: [['square', 76, 0, 0.05, 0.05], ['square', 83, 0.05, 0.08, 0.05]],
    hit: [['triangle', 64, 0, 0.08, 0.2], ['triangle', 57, 0.07, 0.15, 0.2]],
    hurt: [['square', 50, 0, 0.06, 0.12], ['square', 45, 0.06, 0.1, 0.12]],
    fire: [['sawtooth', 40, 0, 0.3, 0.06], ['sawtooth', 43, 0.1, 0.4, 0.05]],
    good: [['square', 72, 0, 0.08, 0.06], ['square', 76, 0.08, 0.08, 0.06], ['square', 79, 0.16, 0.2, 0.06]],
    bad: [['square', 60, 0, 0.1, 0.06], ['square', 55, 0.1, 0.2, 0.06]],
    // 1986년 나무 마루 삐걱
    creak: [['triangle', 43, 0, 0.14, 0.05], ['triangle', 46, 0.06, 0.1, 0.03]],
    // 화재벨 (따르르릉)
    bell: Array.from({ length: 10 }, (_, i) => ['square', i % 2 ? 86 : 89, i * 0.05, 0.05, 0.05]),
    // 발소리 (복도 저벅저벅)
    step: [['triangle', 38, 0, 0.06, 0.12], ['triangle', 35, 0.02, 0.05, 0.08]],
    // 학교 종 (딩동댕동)
    chime: [['triangle', 76, 0, 0.45, 0.06], ['triangle', 72, 0.5, 0.45, 0.06], ['triangle', 74, 1.0, 0.45, 0.06], ['triangle', 67, 1.5, 0.9, 0.06]],
    // 자물쇠 철컥
    lock: [['square', 84, 0, 0.03, 0.05], ['square', 70, 0.04, 0.06, 0.05]],
    // 회상 전환 지지직
    static: Array.from({ length: 14 }, (_, i) => ['square', 30 + ((i * 37) % 60), i * 0.06, 0.05, 0.04]),
  };
  function sfx(kind) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    for (const [type, midi, at, dur, vol] of SFX[kind]) note(type, midi, t + at, dur, vol);
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.setTargetAtTime(muted ? 0 : VOLUME, ctx.currentTime, 0.05);
    return muted;
  }

  return { start, blip, sfx, setTrack, toggleMute, get muted() { return muted; }, get track() { return trackName; } };
})();
