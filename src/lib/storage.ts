/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import type {
  ArenaStyle,
  CharacterId,
  DisplayMode,
  InputMode,
  PlayerProgress,
} from './types';
import { DEFAULT_PROGRESS } from './types';

const STORAGE_KEY = 'kungfu-math-progress';
const CODE_PREFIX = 'KM1.';
const MAX_SCORE = 999_999;
const MAX_GAMES = 1_000_000;

const LEVEL_IDS = new Set(['pemula', 'dasar', 'menengah', 'mahir', 'master']);
const CHAR_IDS = new Set([
  'hong-yi',
  'ming-zhe',
  'yu-jin',
  'an-ning',
  'zhi-xing',
  'yo-rin',
]);
const MODES = new Set<InputMode>(['slice', 'tap']);
const ARENAS = new Set<ArenaStyle>(['static', 'agility']);
const DISPLAYS = new Set<DisplayMode>(['siang', 'malam', 'nyaman']);
const LANGS = new Set(['id', 'en']);

function finiteNonNeg(n: unknown, max: number): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
  return Math.min(Math.floor(n), max);
}

/** Normalisasi + whitelist — untrusted JSON (import / localStorage rusak) */
export function normalizeProgress(raw: unknown): PlayerProgress {
  const base = { ...DEFAULT_PROGRESS, highScores: { ...DEFAULT_PROGRESS.highScores } };
  if (!raw || typeof raw !== 'object') return base;

  const p = raw as Record<string, unknown>;
  const next: PlayerProgress = { ...base };

  if (typeof p.playerName === 'string') {
    next.playerName = p.playerName.slice(0, 16);
  }

  if (typeof p.preferredMode === 'string' && MODES.has(p.preferredMode as InputMode)) {
    next.preferredMode = p.preferredMode as InputMode;
  }
  if (typeof p.preferredArena === 'string' && ARENAS.has(p.preferredArena as ArenaStyle)) {
    next.preferredArena = p.preferredArena as ArenaStyle;
  }
  if (typeof p.preferredCharacter === 'string' && CHAR_IDS.has(p.preferredCharacter)) {
    next.preferredCharacter = p.preferredCharacter as CharacterId;
  }
  if (typeof p.preferredLevel === 'string' && LEVEL_IDS.has(p.preferredLevel)) {
    next.preferredLevel = p.preferredLevel as PlayerProgress['preferredLevel'];
  }
  if (typeof p.displayMode === 'string' && DISPLAYS.has(p.displayMode as DisplayMode)) {
    next.displayMode = p.displayMode as DisplayMode;
  }
  if (typeof p.language === 'string' && LANGS.has(p.language)) {
    next.language = p.language as 'id' | 'en';
  }
  if (typeof p.soundMuted === 'boolean') next.soundMuted = p.soundMuted;

  if (typeof p.adventureCityId === 'string' && p.adventureCityId.length < 40) {
    next.adventureCityId = p.adventureCityId;
  }
  if (Array.isArray(p.adventureUnlocked)) {
    next.adventureUnlocked = p.adventureUnlocked
      .filter((x): x is string => typeof x === 'string')
      .slice(0, 20);
    if (next.adventureUnlocked.length === 0) {
      next.adventureUnlocked = [...DEFAULT_PROGRESS.adventureUnlocked];
    }
  }
  if (p.adventureHighScores && typeof p.adventureHighScores === 'object') {
    const ahs: Record<string, number> = {};
    for (const [k, v] of Object.entries(p.adventureHighScores as Record<string, unknown>)) {
      const n = finiteNonNeg(v, MAX_SCORE);
      if (n !== null) ahs[k] = n;
    }
    next.adventureHighScores = ahs;
  }

  // isSubscribed: fase test — terima boolean, JANGAN dipakai sebagai kontrol bayar
  if (typeof p.isSubscribed === 'boolean') next.isSubscribed = p.isSubscribed;

  const games = finiteNonNeg(p.totalGamesPlayed, MAX_GAMES);
  if (games !== null) next.totalGamesPlayed = games;

  if (p.highScores && typeof p.highScores === 'object') {
    const hs: Record<string, number> = { ...base.highScores };
    for (const [k, v] of Object.entries(p.highScores as Record<string, unknown>)) {
      if (!LEVEL_IDS.has(k)) continue;
      const s = finiteNonNeg(v, MAX_SCORE);
      if (s !== null) hs[k] = s;
    }
    next.highScores = hs;
  }

  if (Array.isArray(p.unlockedStages)) {
    next.unlockedStages = p.unlockedStages
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0)
      .map((n) => Math.floor(n))
      .slice(0, 20);
    if (next.unlockedStages.length === 0) {
      next.unlockedStages = [...DEFAULT_PROGRESS.unlockedStages];
    }
  }

  return next;
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS, highScores: {} };
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PROGRESS, highScores: {} };
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
  } catch (err) {
    console.warn('Gagal menyimpan progress:', err);
  }
}

export function updateProgress(partial: Partial<PlayerProgress>): PlayerProgress {
  const next = normalizeProgress({ ...loadProgress(), ...partial });
  saveProgress(next);
  return next;
}

/**
 * Export = snapshot progress SAAT INI.
 * Kode berubah setiap kali progress berubah (bukan PIN tetap).
 */
export function exportProgress(): string {
  const json = JSON.stringify(loadProgress());
  const body = btoa(unescape(encodeURIComponent(json)));
  return CODE_PREFIX + body;
}

export function importProgress(encoded: string): boolean {
  try {
    let raw = encoded.trim().replace(/\s+/g, '');
    if (raw.startsWith(CODE_PREFIX)) raw = raw.slice(CODE_PREFIX.length);
    const json = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(json);
    const merged = normalizeProgress(parsed);
    saveProgress(merged);
    return true;
  } catch {
    return false;
  }
}

export function recordGameResult(
  levelId: string,
  score: number
): { highScore: number; isNewRecord: boolean } {
  const safeScore = finiteNonNeg(score, MAX_SCORE) ?? 0;
  const progress = loadProgress();
  const prev = progress.highScores[levelId] ?? 0;
  const isNewRecord = safeScore > prev;
  const highScore = Math.max(prev, safeScore);

  updateProgress({
    highScores: {
      ...progress.highScores,
      [levelId]: highScore,
    },
    totalGamesPlayed: Math.min(
      (progress.totalGamesPlayed ?? 0) + 1,
      MAX_GAMES
    ),
  });

  return { highScore, isNewRecord };
}
