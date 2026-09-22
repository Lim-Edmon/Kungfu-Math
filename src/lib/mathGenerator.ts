/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Generator soal matematika untuk Kungfu Math
 * Selalu ada minimal 1 pasangan valid di antara kandidat.
 * Validasi jawaban di Game: pasangan mana pun yang benar diterima (+ dan ×).
 */

import type { DifficultyLevel } from './levels';
import { getLevelById } from './levels';

export type OperationType = 'add' | 'sub' | 'mul' | 'div';

export interface MathQuestion {
  display: string;
  /** Satu contoh pasangan valid (untuk pastikan kandidat berisi solusi) */
  correctNumbers: number[];
  candidates: number[];
  bombIndexes: number[];
  operation: OperationType;
  target: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDistractors(correct: number[], count: number, maxVal: number): number[] {
  const result: number[] = [];
  const used = new Set(correct);

  let guard = 0;
  while (result.length < count && guard < 80) {
    guard++;
    const base = correct[randomInt(0, correct.length - 1)];
    const offset = randomInt(-6, 6) || 1;
    const n = Math.max(1, Math.min(maxVal, base + offset));
    if (!used.has(n)) {
      used.add(n);
      result.push(n);
    }
  }
  return result;
}

function pickOp(ops: OperationType[]): OperationType {
  return ops[randomInt(0, ops.length - 1)];
}

/**
 * Generate soal sesuai level (Pemula → Master)
 */
export function generateQuestion(
  levelId: DifficultyLevel | number = 'pemula'
): MathQuestion {
  // Support lama: angka 1–5 masih diterima
  let level: DifficultyLevel = 'pemula';
  if (typeof levelId === 'number') {
    const map: DifficultyLevel[] = [
      'pemula',
      'dasar',
      'menengah',
      'mahir',
      'master',
    ];
    level = map[Math.max(0, Math.min(4, levelId - 1))];
  } else {
    level = levelId;
  }

  const config = getLevelById(level);
  const operation = pickOp(config.operations);

  let a: number;
  let b: number;
  let target: number;
  let correctNumbers: number[];
  let display: string;
  let maxVal = 20;

  switch (level) {
    case 'pemula': {
      // Hanya penjumlahan, hasil kecil (≤12), setara TK–SD1
      maxVal = 12;
      a = randomInt(1, 6);
      b = randomInt(1, 6);
      target = a + b;
      correctNumbers = [a, b];
      display = `? + ? = ${target}`;
      break;
    }
    case 'dasar': {
      // + dan −, angka sampai ~20
      maxVal = 25;
      if (operation === 'sub') {
        a = randomInt(5, 20);
        b = randomInt(1, a - 1);
        target = a - b;
        correctNumbers = [a, b];
        display = `? − ? = ${target}`;
      } else {
        a = randomInt(2, 12);
        b = randomInt(2, 12);
        target = a + b;
        correctNumbers = [a, b];
        display = `? + ? = ${target}`;
      }
      break;
    }
    case 'menengah': {
      // Mulai × dan ÷ tabel 1–10
      maxVal = 100;
      if (operation === 'mul') {
        a = randomInt(2, 9);
        b = randomInt(2, 9);
        target = a * b;
        if (Math.random() > 0.45) {
          correctNumbers = [a, b];
          display = `? × ? = ${target}`;
        } else {
          correctNumbers = [b];
          display = `${a} × ? = ${target}`;
        }
      } else if (operation === 'div') {
        b = randomInt(2, 9);
        target = randomInt(2, 9);
        a = b * target;
        correctNumbers = [a, b];
        display = `? ÷ ? = ${target}`;
      } else if (operation === 'sub') {
        a = randomInt(10, 50);
        b = randomInt(1, a - 1);
        target = a - b;
        correctNumbers = [a, b];
        display = `? − ? = ${target}`;
      } else {
        a = randomInt(5, 30);
        b = randomInt(5, 30);
        target = a + b;
        correctNumbers = [a, b];
        display = `? + ? = ${target}`;
      }
      break;
    }
    case 'mahir': {
      maxVal = 200;
      if (operation === 'mul') {
        a = randomInt(3, 12);
        b = randomInt(3, 12);
        target = a * b;
        correctNumbers = [a, b];
        display = `? × ? = ${target}`;
      } else if (operation === 'div') {
        b = randomInt(2, 12);
        target = randomInt(2, 12);
        a = b * target;
        correctNumbers = [a, b];
        display = `? ÷ ? = ${target}`;
      } else if (operation === 'sub') {
        a = randomInt(20, 99);
        b = randomInt(5, a - 5);
        target = a - b;
        correctNumbers = [a, b];
        display = `? − ? = ${target}`;
      } else {
        a = randomInt(15, 60);
        b = randomInt(15, 60);
        target = a + b;
        correctNumbers = [a, b];
        display = `? + ? = ${target}`;
      }
      break;
    }
    case 'master':
    default: {
      maxVal = 300;
      if (operation === 'mul') {
        a = randomInt(4, 15);
        b = randomInt(4, 15);
        target = a * b;
        correctNumbers = [a, b];
        display = `? × ? = ${target}`;
      } else if (operation === 'div') {
        b = randomInt(3, 12);
        target = randomInt(3, 15);
        a = b * target;
        correctNumbers = [a, b];
        display = `? ÷ ? = ${target}`;
      } else if (operation === 'sub') {
        a = randomInt(30, 120);
        b = randomInt(10, a - 5);
        target = a - b;
        correctNumbers = [a, b];
        display = `? − ? = ${target}`;
      } else {
        a = randomInt(20, 80);
        b = randomInt(20, 80);
        target = a + b;
        correctNumbers = [a, b];
        display = `? + ? = ${target}`;
      }
      break;
    }
  }

  const distractorCount = randomInt(3, 5);
  const distractors = makeDistractors(correctNumbers, distractorCount, maxVal);
  const allNumbers = shuffle([...correctNumbers, ...distractors]);

  // Bom: 0–2, bukan angka jawaban
  const bombIndexes: number[] = [];
  const possibleBombIndexes = allNumbers
    .map((_, i) => i)
    .filter((i) => !correctNumbers.includes(allNumbers[i]));
  const bombCount = Math.min(randomInt(0, 2), possibleBombIndexes.length);
  const shuffledBombs = shuffle(possibleBombIndexes);
  for (let i = 0; i < bombCount; i++) {
    bombIndexes.push(shuffledBombs[i]);
  }

  return {
    display,
    correctNumbers,
    candidates: allNumbers,
    bombIndexes,
    operation,
    target,
  };
}
