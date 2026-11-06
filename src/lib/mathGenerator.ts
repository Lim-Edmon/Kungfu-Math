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

/** Riwayat singkat agar peluang ops tetap rata + tidak 3x sama beruntun */
const recentOps: OperationType[] = [];

function pickOp(ops: OperationType[]): OperationType {
  if (!ops.length) return 'add';
  if (ops.length === 1) {
    recentOps.push(ops[0]);
    if (recentOps.length > 12) recentOps.shift();
    return ops[0];
  }
  // Uniform random; tolak 3 operasi sama berturut jika ada alternatif
  for (let attempt = 0; attempt < 10; attempt++) {
    const op = ops[randomInt(0, ops.length - 1)];
    const n = recentOps.length;
    if (
      n >= 2 &&
      recentOps[n - 1] === op &&
      recentOps[n - 2] === op &&
      ops.some((o) => o !== op)
    ) {
      continue;
    }
    recentOps.push(op);
    if (recentOps.length > 12) recentOps.shift();
    return op;
  }
  const op = ops[randomInt(0, ops.length - 1)];
  recentOps.push(op);
  if (recentOps.length > 12) recentOps.shift();
  return op;
}

/**
 * Generate soal sesuai level (Pemula → Master)
 */
export function generateQuestion(
  levelId: DifficultyLevel | number = 'pemula',
  opts?: { forceOps?: OperationType[] }
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
  const forced = (opts?.forceOps || []).filter((op) =>
    (config.operations as OperationType[]).includes(op)
  );
  const opsPool =
    forced.length > 0 ? forced : (config.operations as OperationType[]);
  const operation = pickOp(opsPool.length ? opsPool : ['add']);

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

  // Jumlah bola total naik seiring level (user request)
  // pemula 4–6, dasar 4–7, menengah 5–8, mahir 5–9, master 6–10
  const ballRange: Record<string, [number, number]> = {
    pemula: [4, 6],
    dasar: [4, 7],
    menengah: [5, 8],
    mahir: [5, 9],
    master: [6, 10],
  };
  const [bMin, bMax] = ballRange[level] ?? [4, 6];
  const totalBalls = randomInt(bMin, bMax);
  const distractorCount = Math.max(1, totalBalls - correctNumbers.length);
  const distractors = makeDistractors(correctNumbers, distractorCount, maxVal);
  const used = new Set<number>([...correctNumbers, ...distractors]);

  // Pasangan alternatif (add/mul 2 angka) agar bukan cuma 1 jalur jawaban
  const alt: number[] = [];
  if (correctNumbers.length === 2 && (operation === 'add' || operation === 'mul')) {
    let tries = 0;
    while (alt.length < 4 && tries < 40) {
      tries++;
      if (operation === 'add') {
        const a = randomInt(1, Math.max(1, target - 1));
        const b = target - a;
        if (b < 1 || b > maxVal || a > maxVal) continue;
        if (!used.has(a)) {
          used.add(a);
          alt.push(a);
        }
        if (a !== b && !used.has(b)) {
          used.add(b);
          alt.push(b);
        }
      } else {
        // mul: faktor target
        const a = randomInt(2, Math.max(2, Math.min(maxVal, Math.floor(Math.sqrt(target)) + 8)));
        if (a === 0 || target % a !== 0) continue;
        const b = target / a;
        if (!Number.isInteger(b) || b < 1 || b > maxVal) continue;
        if (!used.has(a)) {
          used.add(a);
          alt.push(a);
        }
        if (a !== b && !used.has(b)) {
          used.add(b);
          alt.push(b);
        }
      }
    }
  }

  const allNumbers = shuffle([...correctNumbers, ...distractors, ...alt]).slice(
    0,
    Math.max(totalBalls, correctNumbers.length + distractorCount + Math.min(2, alt.length))
  );

  // Bom: mode termudah (pemula / sedikit bola) max 0–1 biar tidak "pasti benar"
  const bombIndexes: number[] = [];
  const possibleBombIndexes = allNumbers
    .map((_, i) => i)
    .filter((i) => !correctNumbers.includes(allNumbers[i]));
  const maxBombs =
    level === 'pemula' || totalBalls <= 5 ? 1 : 2;
  const bombCount = Math.min(randomInt(0, maxBombs), possibleBombIndexes.length);
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
