/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import type { CharacterId, InputMode } from './types';
import type { MathQuestion } from './mathGenerator';

export type GameStatus = 'playing' | 'paused' | 'won' | 'lost';

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
export const COMBO_BONUS = 25;
