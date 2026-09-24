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
    const a = cache[key];
    if (!a || missing[key]) return false;
    a.currentTime = 0;
    a.volume = volume;
    void a.play().catch(() => {
      missing[key] = true;
    });
    return true;
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

/** Musik kota opsional: /cities/music/{id}.mp3 — loop, fallback diam */
function playDefaultBgmLoop() {
  if (isMuted()) return;
  try {
    stopCityMusic();
    const a = new Audio('/sounds/bgm.mp3');
    a.loop = true;
    a.volume = 0.3;
    a.preload = 'auto';
    a.addEventListener('error', () => {
      cityAudio = null;
    });
    cityAudio = a;
    void a.play().catch(() => {
      cityAudio = null;
    });
  } catch {
    /* diam */
  }
}

/** Musik kota (mp3 huruf kecil). Gagal / tidak ada → /sounds/bgm.mp3 */
export function playCityMusic(cityId: string | undefined) {
  stopCityMusic();
  if (isMuted()) return;
  const id = (cityId || '').toLowerCase();
  if (!id || cityMissing[id]) {
    playDefaultBgmLoop();
    return;
  }
  try {
    const a = new Audio(`/cities/music/${id}.mp3`);
    a.loop = true;
    a.volume = 0.35;
    a.preload = 'auto';
    const fail = () => {
      cityMissing[id] = true;
      playDefaultBgmLoop();
    };
    a.addEventListener('error', fail);
    cityAudio = a;
    void a.play().catch(fail);
  } catch {
    cityMissing[id] = true;
    playDefaultBgmLoop();
  }
}

export function stopCityMusic() {
  if (cityAudio) {
    try {
      cityAudio.pause();
      cityAudio.src = '';
    } catch {
      /* ignore */
    }
    cityAudio = null;
  }
}

export const sfx = {
  tap(): void {
    playOrFallback('tap', () => {
      playTone(640, 0.05, 'triangle', 0.09);
      playTone(820, 0.04, 'sine', 0.06, 30);
    });
  },
  correct(): void {
    playOrFallback('correct', () => {
      playTone(523, 0.07, 'sine', 0.11);
      playTone(659, 0.07, 'sine', 0.11, 60);
      playTone(784, 0.12, 'sine', 0.12, 120);
    });
  },
  wrong(): void {
    playOrFallback('wrong', () => playSlide(320, 90, 0.22, 'square', 0.07));
  },
  combo(): void {
    playOrFallback('combo', () => {
      playTone(659, 0.05, 'triangle', 0.1);
      playTone(784, 0.05, 'triangle', 0.1, 45);
      playTone(988, 0.1, 'sine', 0.12, 90);
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
    playOrFallback('slash', () => playSlide(800, 200, 0.12, 'sawtooth', 0.05));
  },
  boom(): void {
    playOrFallback('boom', () => {
      playSlide(150, 40, 0.25, 'square', 0.08);
      playTone(60, 0.2, 'triangle', 0.06, 20);
    });
  },

  startBgm(): void {
    if (isMuted()) return;
    bgmOn = true;

    // Matikan fallback dulu (biar tidak dobel / nempel nada lama)
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
    if (bgmAudio) {
      try {
        bgmAudio.pause();
      } catch {
        /* ignore */
      }
      bgmAudio = null;
    }

    try {
      // File harus ada di: public/sounds/bgm.mp3
      // (di browser jadi URL /sounds/bgm.mp3)
      const a = new Audio('/sounds/bgm.mp3');
      a.loop = true;
      a.volume = 0.35;
      a.preload = 'auto';
      bgmAudio = a;

      const tryPlay = () => {
        if (!bgmOn || isMuted()) return;
        void a
          .play()
          .then(() => {
            // File berhasil → pastikan fallback mati
            if (bgmTimer) {
              clearInterval(bgmTimer);
              bgmTimer = null;
            }
          })
          .catch(() => {
            // Autoplay diblokir browser atau file gagal
            console.warn(
              '[Kungfu Math] Gagal putar bgm.mp3 — cek file di public/sounds/bgm.mp3'
            );
            startFallbackBgm();
          });
      };

      a.addEventListener('canplay', tryPlay, { once: true });
      a.addEventListener(
        'error',
        () => {
          console.warn(
            '[Kungfu Math] bgm.mp3 tidak ketemu. Path yang benar: public/sounds/bgm.mp3'
          );
          bgmAudio = null;
          startFallbackBgm();
        },
        { once: true }
      );
      a.load();
    } catch {
      startFallbackBgm();
    }
  },

  stopBgm(): void {
    bgmOn = false;
    if (bgmAudio) {
      try {
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
      } catch {
        /* ignore */
      }
      bgmAudio = null;
    }
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  },
};
