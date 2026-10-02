/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import type {
  ArenaStyle,
  CharacterId,
  DisplayMode,
  InputMode,
  PlayerProgress,
  ScoreRecord,
} from './types';
import { DEFAULT_PROGRESS } from './types';
import { getLang, t } from './i18n';
import { ADVENTURE_CITIES } from './adventure';

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
function parseScoreRecord(v: unknown): ScoreRecord | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const score = finiteNonNeg(o.score, MAX_SCORE);
  if (score === null) return null;
  const by = typeof o.by === 'string' ? o.by.slice(0, 24) : '';
  const at = typeof o.at === 'string' ? o.at.slice(0, 40) : '';
  const inputMode =
    typeof o.inputMode === 'string' && MODES.has(o.inputMode as InputMode)
      ? (o.inputMode as InputMode)
      : 'slice';
  const arena =
    typeof o.arena === 'string' && ARENAS.has(o.arena as ArenaStyle)
      ? (o.arena as ArenaStyle)
      : 'static';
  const rec: ScoreRecord = { score, by, at, inputMode, arena };
  if (typeof o.levelId === 'string' && LEVEL_IDS.has(o.levelId)) {
    rec.levelId = o.levelId;
  }
  if (typeof o.tempoId === 'string' && o.tempoId.length < 24) {
    rec.tempoId = o.tempoId;
  }
  return rec;
}

export function normalizeProgress(raw: unknown): PlayerProgress {
  const base: PlayerProgress = {
    ...DEFAULT_PROGRESS,
    highScores: { ...DEFAULT_PROGRESS.highScores },
    highScoreRecords: {},
    adventureHighScores: {},
    adventureScoreRecords: {},
  };
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
  if (typeof p.languageChosen === 'boolean') {
    next.languageChosen = p.languageChosen;
  }
  if (typeof p.soundMuted === 'boolean') next.soundMuted = p.soundMuted;

  // Sinkron dengan ADVENTURE_CITIES — jangan hardcode (supaya kota baru tidak terhapus saat load/import)
  const VALID_CITIES = new Set(ADVENTURE_CITIES.map((c) => c.id));

  if (typeof p.adventureCityId === 'string' && VALID_CITIES.has(p.adventureCityId)) {
    next.adventureCityId = p.adventureCityId;
  } else {
    next.adventureCityId = 'jakarta';
  }

  if (Array.isArray(p.adventureUnlocked)) {
    next.adventureUnlocked = p.adventureUnlocked
      .filter((x): x is string => typeof x === 'string' && VALID_CITIES.has(x))
      .slice(0, 80);
  }
  // Jakarta SELALU terbuka dari awal (progress lama / import tanpa jakarta)
  if (!next.adventureUnlocked.includes('jakarta')) {
    next.adventureUnlocked = ['jakarta', ...next.adventureUnlocked];
  }
  if (next.adventureUnlocked.length === 0) {
    next.adventureUnlocked = ['jakarta'];
  }
  if (p.adventureHighScores && typeof p.adventureHighScores === 'object') {
    const ahs: Record<string, number> = {};
    for (const [k, v] of Object.entries(p.adventureHighScores as Record<string, unknown>)) {
      if (!VALID_CITIES.has(k)) continue;
      const n = finiteNonNeg(v, MAX_SCORE);
      if (n !== null) ahs[k] = n;
    }
    next.adventureHighScores = ahs;
  }

  if (p.adventureScoreRecords && typeof p.adventureScoreRecords === 'object') {
    const asr: Record<string, ScoreRecord> = {};
    for (const [k, v] of Object.entries(
      p.adventureScoreRecords as Record<string, unknown>
    )) {
      if (!VALID_CITIES.has(k)) continue;
      const rec = parseScoreRecord(v);
      if (rec) {
        asr[k] = rec;
        // sinkron angka jika belum / lebih rendah
        if ((next.adventureHighScores[k] ?? 0) < rec.score) {
          next.adventureHighScores[k] = rec.score;
        }
      }
    }
    next.adventureScoreRecords = asr;
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

  if (p.highScoreRecords && typeof p.highScoreRecords === 'object') {
    const hsr: Record<string, ScoreRecord> = {};
    for (const [k, v] of Object.entries(
      p.highScoreRecords as Record<string, unknown>
    )) {
      if (!LEVEL_IDS.has(k)) continue;
      const rec = parseScoreRecord(v);
      if (rec) {
        hsr[k] = { ...rec, levelId: k };
        if ((next.highScores[k] ?? 0) < rec.score) {
          next.highScores[k] = rec.score;
        }
      }
    }
    next.highScoreRecords = hsr;
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

export type RecordMeta = {
  playerName?: string;
  inputMode?: InputMode;
  arena?: ArenaStyle;
  tempoId?: string;
};

const CHAR_DISPLAY_NAMES: Record<string, string> = {
  'yu-jin': 'Yu Jin',
  'hong-yi': 'Hong Yi',
  'ming-zhe': 'Ming Zhe',
  'an-ning': 'An Ning',
  'zhi-xing': 'Zhi Xing',
  'yo-rin': 'Yo Rin',
};

/** Nama di rekor: nama pemain (jika diisi) → nama pendekar → Pemain */
function displayNameFrom(progress: PlayerProgress, override?: string): string {
  const n = (override ?? progress.playerName ?? '').trim();
  if (n) return n;
  const charName = CHAR_DISPLAY_NAMES[progress.preferredCharacter || ''];
  return charName || 'Pemain';
}

export function recordGameResult(
  levelId: string,
  score: number,
  meta?: RecordMeta
): { highScore: number; isNewRecord: boolean } {
  const safeScore = finiteNonNeg(score, MAX_SCORE) ?? 0;
  const progress = loadProgress();
  const prev = progress.highScores[levelId] ?? 0;
  const isNewRecord = safeScore > prev;
  const highScore = Math.max(prev, safeScore);

  const patch: Partial<PlayerProgress> = {
    highScores: {
      ...progress.highScores,
      [levelId]: highScore,
    },
    totalGamesPlayed: Math.min(
      (progress.totalGamesPlayed ?? 0) + 1,
      MAX_GAMES
    ),
  };

  if (isNewRecord) {
    const rec: ScoreRecord = {
      score: highScore,
      by: displayNameFrom(progress, meta?.playerName),
      at: new Date().toISOString(),
      inputMode: meta?.inputMode ?? progress.preferredMode ?? 'slice',
      arena: meta?.arena ?? progress.preferredArena ?? 'static',
      levelId,
    };
    patch.highScoreRecords = {
      ...(progress.highScoreRecords || {}),
      [levelId]: rec,
    };
  }

  updateProgress(patch);
  return { highScore, isNewRecord };
}

/** Update rekor petualangan per kota + detail (hanya jika skor lebih tinggi) */
export function recordAdventureScore(
  cityId: string,
  score: number,
  meta?: RecordMeta
): { highScore: number; isNewRecord: boolean } {
  const safeScore = finiteNonNeg(score, MAX_SCORE) ?? 0;
  const progress = loadProgress();
  const prev = progress.adventureHighScores?.[cityId] ?? 0;
  const isNewRecord = safeScore > prev;
  const highScore = Math.max(prev, safeScore);

  const patch: Partial<PlayerProgress> = {
    adventureHighScores: {
      ...(progress.adventureHighScores || {}),
      [cityId]: highScore,
    },
  };

  if (isNewRecord) {
    const rec: ScoreRecord = {
      score: highScore,
      by: displayNameFrom(progress, meta?.playerName),
      at: new Date().toISOString(),
      inputMode: meta?.inputMode ?? progress.preferredMode ?? 'slice',
      arena: meta?.arena ?? progress.preferredArena ?? 'static',
      tempoId: meta?.tempoId,
    };
    patch.adventureScoreRecords = {
      ...(progress.adventureScoreRecords || {}),
      [cityId]: rec,
    };
  }

  updateProgress(patch);
  return { highScore, isNewRecord };
}

/** Format tanggal singkat untuk Dojo (lokal ID) */
export function formatRecordDate(iso: string | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const loc = getLang() === 'en' ? 'en-GB' : 'id-ID';
    return d.toLocaleDateString(loc, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function arenaLabel(arena: ArenaStyle | undefined): string {
  return arena === 'agility' ? t('modeAgility') : t('modeStatic');
}

export function inputModeLabel(mode: InputMode | undefined): string {
  return mode === 'tap' ? t('modeTap') : t('modeSlice');
}
