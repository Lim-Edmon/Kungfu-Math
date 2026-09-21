import type { PlayerProgress } from './types';
import { DEFAULT_PROGRESS } from './types';

const STORAGE_KEY = 'kungfu-math-progress';

/** Baca progress pemain dari localStorage */
export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };

    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;

    // Gabungkan dengan default supaya field baru tidak hilang
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      highScores: { ...DEFAULT_PROGRESS.highScores, ...parsed.highScores },
      unlockedStages: parsed.unlockedStages ?? DEFAULT_PROGRESS.unlockedStages,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

/** Simpan progress pemain ke localStorage */
export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn('Gagal menyimpan progress:', err);
  }
}

/** Update sebagian progress lalu simpan */
export function updateProgress(
  partial: Partial<PlayerProgress>
): PlayerProgress {
  const current = loadProgress();
  const next = { ...current, ...partial };
  saveProgress(next);
  return next;
}

const CODE_PREFIX = 'KM1.';

/**
 * Export progress jadi kode pindah HP (tanpa login).
 * Format: KM1.<base64> — bisa dikirim via WhatsApp.
 */
export function exportProgress(): string {
  const progress = loadProgress();
  const json = JSON.stringify(progress);
  const body = btoa(unescape(encodeURIComponent(json)));
  return CODE_PREFIX + body;
}

/**
 * Import progress dari kode hasil export.
 * Menerima dengan atau tanpa prefix KM1.
 */
export function importProgress(encoded: string): boolean {
  try {
    let raw = encoded.trim().replace(/\s+/g, '');
    if (raw.startsWith(CODE_PREFIX)) {
      raw = raw.slice(CODE_PREFIX.length);
    }
    // Kompatibel dengan kode lama (tanpa prefix)
    const json = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(json) as Partial<PlayerProgress>;

    if (typeof parsed !== 'object' || parsed === null) return false;

    const merged: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      ...parsed,
      highScores: {
        ...DEFAULT_PROGRESS.highScores,
        ...(parsed.highScores || {}),
      },
      unlockedStages: parsed.unlockedStages ?? DEFAULT_PROGRESS.unlockedStages,
    };

    saveProgress(merged);
    return true;
  } catch {
    return false;
  }
}

/**
 * Catat skor tertinggi per level + tambah jumlah game dimainkan.
 * Mengembalikan high score terbaru untuk level itu.
 */
export function recordGameResult(
  levelId: string,
  score: number
): { highScore: number; isNewRecord: boolean } {
  const progress = loadProgress();
  const prev = progress.highScores[levelId] ?? 0;
  const isNewRecord = score > prev;
  const highScore = Math.max(prev, score);

  updateProgress({
    highScores: {
      ...progress.highScores,
      [levelId]: highScore,
    },
    totalGamesPlayed: (progress.totalGamesPlayed ?? 0) + 1,
  });

  return { highScore, isNewRecord };
}
