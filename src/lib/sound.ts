/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * SFX + BGM untuk Kungfu Math (MVP)
 *
 * Prioritas:
 * 1. File di /public/sounds/ (jika ada) → dipakai
 * 2. Jika file tidak ada → suara buatan Web Audio (fallback)
 *
 * Cara ganti nanti: taruh file MP3 dengan nama di bawah, tidak perlu ubah kode.
 *   bgm.mp3 | tap.mp3 | correct.mp3 | wrong.mp3 | combo.mp3
 *   finish.mp3 | select.mp3 | slash.mp3 | boom.mp3
 */

import { loadProgress } from './storage';

let audioCtx: AudioContext | null = null;
let bgmTimer: ReturnType<typeof setInterval> | null = null;
let bgmOn = false;
let bgmAudio: HTMLAudioElement | null = null;

const FILE_SFX: Record<string, string> = {
  tap: '/sounds/tap.mp3',
  correct: '/sounds/correct.mp3',
  wrong: '/sounds/wrong.mp3',
  combo: '/sounds/combo.mp3',
  finish: '/sounds/finish.mp3',
  select: '/sounds/select.mp3',
  slash: '/sounds/slash.mp3',
  boom: '/sounds/boom.mp3',
};

const cache: Record<string, HTMLAudioElement | null> = {};
const missing: Record<string, boolean> = {};

function isMuted(): boolean {
  try {
    return loadProgress().soundMuted === true;
  } catch {
    return false;
  }
}

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function playFile(key: string, volume = 0.5): boolean {
  if (isMuted()) return true;
  if (missing[key]) return false;

  try {
    if (!cache[key]) {
      const a = new Audio(FILE_SFX[key]);
      a.preload = 'auto';
      a.volume = volume;
      cache[key] = a;
      a.addEventListener('error', () => {
        missing[key] = true;
        cache[key] = null;
      });
    }
    const base = cache[key];
    if (!base || missing[key]) return false;
    // Clone biar tap cepat tidak saling potong
    const a = base.cloneNode(true) as HTMLAudioElement;
    a.volume = volume;
    void a.play().catch(() => {
      /* file mungkin belum ada — fallback tone */
      missing[key] = true;
    });
    return !missing[key];
  } catch {
    missing[key] = true;
    return false;
  }
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  volume = 0.12,
  delayMs = 0
): void {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const start = ctx.currentTime + delayMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

function playSlide(
  fromFreq: number,
  toFreq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  volume = 0.1
): void {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(toFreq, 1),
    ctx.currentTime + durationSec
  );
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + durationSec + 0.02);
}

const BGM_NOTES = [392, 440, 494, 523, 587, 523, 494, 440];

function playBgmStep(step: number): void {
  if (isMuted() || !bgmOn) return;
  const freq = BGM_NOTES[step % BGM_NOTES.length];
  playTone(freq, 0.28, 'sine', 0.04);
  playTone(freq / 2, 0.28, 'triangle', 0.02);
}

function playOrFallback(key: string, fallback: () => void, volume = 0.5): void {
  if (isMuted()) return;
  if (!playFile(key, volume)) fallback();
}

function startFallbackBgm(): void {
  if (bgmTimer || !bgmOn) return;
  let step = 0;
  playBgmStep(step);
  bgmTimer = setInterval(() => {
    step += 1;
    playBgmStep(step);
  }, 400);
}

let cityAudio: HTMLAudioElement | null = null;
let cityMissing: Record<string, boolean> = {};
/** Generasi putar: batalkan async play lama supaya tidak overlap */
let musicGen = 0;

function stopToneBgm(): void {
  bgmOn = false;
  if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
  if (bgmAudio) {
    try {
      bgmAudio.pause();
      bgmAudio.removeAttribute('src');
      bgmAudio.load();
    } catch {
      /* ignore */
    }
    bgmAudio = null;
  }
}

/** Hentikan SEMUA musik (kota + BGM default + tone) — wajib sebelum ganti lagu / keluar */
export function stopAllMusic(): void {
  musicGen += 1;
  if (cityAudio) {
    try {
      cityAudio.onended = null;
      cityAudio.onerror = null;
      cityAudio.pause();
      cityAudio.currentTime = 0;
      cityAudio.removeAttribute('src');
      cityAudio.load();
    } catch {
      /* ignore */
    }
    cityAudio = null;
  }
  if (bgmAudio) {
    try {
      bgmAudio.pause();
      bgmAudio.removeAttribute('src');
      bgmAudio.load();
    } catch {
      /* ignore */
    }
    bgmAudio = null;
  }
  stopToneBgm();
}

export function stopCityMusic(): void {
  stopAllMusic();
}

function playBgmFile(volume: number, gen: number): void {
  if (isMuted()) return;
  try {
    const a = new Audio('/sounds/bgm.mp3');
    a.loop = true;
    a.volume = volume;
    a.preload = 'auto';
    cityAudio = a;
    void a.play().then(() => {
      if (gen !== musicGen) {
        try {
          a.pause();
        } catch {
          /* ignore */
        }
      }
    }).catch(() => {
      if (gen === musicGen) {
        cityAudio = null;
        bgmOn = true;
        startFallbackBgm();
      }
    });
  } catch {
    if (gen === musicGen) {
      bgmOn = true;
      startFallbackBgm();
    }
  }
}

/** BGM lembut di menu / setelah game (volume lebih rendah) */
export function playMenuBgm(): void {
  stopAllMusic();
  if (isMuted()) return;
  const gen = musicGen;
  playBgmFile(0.16, gen);
}

/** BGM default saat main tanpa musik kota */
function playDefaultBgmLoop(): void {
  if (isMuted()) return;
  const gen = musicGen;
  playBgmFile(0.28, gen);
}

/**
 * Musik kota: /cities/music/{id}.mp3
 * Selalu matikan lagu lama dulu. Gagal → BGM default (bukan numpuk).
 */
export function playCityMusic(cityId: string | undefined): void {
  stopAllMusic();
  if (isMuted()) return;
  const id = (cityId || '').toLowerCase();
  if (!id || cityMissing[id]) {
    playDefaultBgmLoop();
    return;
  }
  const gen = musicGen;
  try {
    const a = new Audio(`/cities/music/${id}.mp3`);
    a.loop = true;
    a.volume = 0.34;
    a.preload = 'auto';
    const fail = () => {
      if (gen !== musicGen) return;
      cityMissing[id] = true;
      if (cityAudio === a) cityAudio = null;
      playDefaultBgmLoop();
    };
    a.addEventListener('error', fail, { once: true });
    cityAudio = a;
    void a.play().then(() => {
      if (gen !== musicGen) {
        try {
          a.pause();
        } catch {
          /* ignore */
        }
      }
    }).catch(fail);
  } catch {
    cityMissing[id] = true;
    playDefaultBgmLoop();
  }
}

export const sfx = {
  tap(): void {
    playOrFallback('tap', () => {
      // “klik” pendek + echo kecil — terasa di HP
      playTone(720, 0.04, 'triangle', 0.14);
      playTone(980, 0.035, 'sine', 0.1, 25);
      playTone(1200, 0.03, 'sine', 0.05, 50);
    });
  },
  correct(): void {
    playOrFallback('correct', () => {
      playTone(523, 0.06, 'sine', 0.13);
      playTone(659, 0.07, 'sine', 0.13, 55);
      playTone(784, 0.11, 'triangle', 0.14, 110);
    });
  },
  wrong(): void {
    playOrFallback('wrong', () => playSlide(280, 70, 0.2, 'square', 0.09));
  },
  combo(): void {
    playOrFallback('combo', () => {
      playTone(659, 0.05, 'triangle', 0.12);
      playTone(784, 0.05, 'triangle', 0.12, 40);
      playTone(988, 0.08, 'sine', 0.14, 80);
      playTone(1175, 0.1, 'sine', 0.1, 130);
    });
  },
  /** Menang / lolos kota / rekor — nada lebih ceria */
  win(): void {
    playOrFallback('finish', () => {
      const ctx = getCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.0001, now + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.2, now + i * 0.12 + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.35);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.12);
          o.stop(now + i * 0.12 + 0.4);
        });
      } catch {
        /* ignore */
      }
    });
  },
  /** Waktu habis / biasa */
  finish(): void {
    playOrFallback('finish', () => {
      playTone(392, 0.1, 'sine', 0.1);
      playTone(523, 0.1, 'sine', 0.1, 90);
      playTone(659, 0.1, 'sine', 0.1, 180);
      playTone(784, 0.18, 'triangle', 0.12, 270);
    });
  },
  select(): void {
    playOrFallback('select', () => {
      playTone(440, 0.06, 'triangle', 0.08);
      playTone(554, 0.08, 'sine', 0.09, 50);
    });
  },
  slash(): void {
    playOrFallback('slash', () => {
      // Whoosh tebas
      playSlide(1100, 180, 0.11, 'sawtooth', 0.07);
      playSlide(700, 120, 0.09, 'triangle', 0.05);
    });
  },
  boom(): void {
    playOrFallback('boom', () => {
      playSlide(180, 35, 0.28, 'square', 0.1);
      playTone(55, 0.22, 'triangle', 0.08, 15);
      playTone(90, 0.15, 'sine', 0.05, 40);
    });
  },

  /** BGM saat Latihan (bukan petualangan). Jangan dipanggil bareng playCityMusic. */
  startBgm(): void {
    stopAllMusic();
    if (isMuted()) return;
    playDefaultBgmLoop();
  },

  stopBgm(): void {
    stopAllMusic();
  },
};
