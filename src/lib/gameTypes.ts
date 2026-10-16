/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import type { CharacterId, InputMode } from './types';
import type { MathQuestion } from './mathGenerator';

export type GameStatus = 'countdown' | 'playing' | 'paused' | 'won' | 'lost';

export interface FloatingNumber {
  id: string;
  value: number;
  x: number; // 0–100 (%)
  y: number; // 0–100 (%)
  isBomb: boolean;
  sliced: boolean;
  /** Kecepatan mode ketangkasan (% arena per detik) */
  vx?: number;
  vy?: number;
}

export interface GameState {
  status: GameStatus;
  mode: InputMode;
  characterId: CharacterId;
  lives: number;
  score: number;
  combo: number;
  maxCombo: number;
  timeLeft: number; // detik
  question: MathQuestion | null;
  numbers: FloatingNumber[];
  /** id bola yang sudah dipilih di soal ini */
  selectedIds: string[];
  questionsSolved: number;
  stage: number;
}

export const INITIAL_LIVES = 3;
export const ROUND_SECONDS = 60;
export const POINTS_PER_SOLVE = 100;
/** Bonus per tingkat combo: diam +5, bergerak +10 */
export const COMBO_BONUS_STATIC = 5;
export const COMBO_BONUS_AGILITY = 10;
/** @deprecated pakai COMBO_BONUS_STATIC / AGILITY */
export const COMBO_BONUS = 5;


/** Pengali skor (bisa ditumpuk). Lihat docs/SCORING.md */
export const TEMPO_SCORE_MULT: Record<string, number> = {
  santai: 1.0,
  ringan: 1.05,
  normal: 1.1,
  berani: 1.15,
};

export const LEVEL_SCORE_MULT: Record<string, number> = {
  pemula: 1.0,
  dasar: 1.05,
  menengah: 1.1,
  mahir: 1.15,
  master: 1.2,
};

export const AGILITY_SCORE_MULT = 1.1;
export const STATIC_SCORE_MULT = 1.0;

/** Focus ops: add/sub only 1.0; mixed with mul/div 1.05; mul/div only 1.1; full/random = 1.0 */
export function opsScoreMultiplier(
  forceOps?: Array<'add' | 'sub' | 'mul' | 'div'> | null
): number {
  if (!forceOps || forceOps.length === 0) return 1.0;
  const set = new Set(forceOps);
  const hasEasy = set.has('add') || set.has('sub');
  const hasHard = set.has('mul') || set.has('div');
  if (hasHard && !hasEasy) return 1.1;
  if (hasHard && hasEasy) return 1.05;
  return 1.0;
}

export function computeSolvePoints(opts: {
  combo: number;
  agility: boolean;
  tempoId?: string | null;
  levelId?: string | null;
  forceOps?: Array<'add' | 'sub' | 'mul' | 'div'> | null;
}): number {
  const comboBonus = opts.agility ? COMBO_BONUS_AGILITY : COMBO_BONUS_STATIC;
  const raw =
    POINTS_PER_SOLVE +
    (opts.combo > 1 ? (opts.combo - 1) * comboBonus : 0);
  const tempoMul = TEMPO_SCORE_MULT[opts.tempoId || ''] ?? 1.0;
  const levelMul = LEVEL_SCORE_MULT[opts.levelId || ''] ?? 1.0;
  const arenaMul = opts.agility ? AGILITY_SCORE_MULT : STATIC_SCORE_MULT;
  const opsMul = opsScoreMultiplier(opts.forceOps);
  return Math.round(raw * tempoMul * levelMul * arenaMul * opsMul);
}
