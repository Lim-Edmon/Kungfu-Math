/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CharacterId, InputMode } from '../lib/types';
import type { DifficultyLevel } from '../lib/levels';
import { getLevelById } from '../lib/levels';
import { getCharacterById } from '../lib/characters';
import { generateQuestion } from '../lib/mathGenerator';
import type { MathQuestion } from '../lib/mathGenerator';
import type { FloatingNumber, GameState } from '../lib/gameTypes';
import {
  INITIAL_LIVES,
  ROUND_SECONDS,
  POINTS_PER_SOLVE,
  COMBO_BONUS,
} from '../lib/gameTypes';
import { sfx } from '../lib/sound';
import { loadProgress } from '../lib/storage';

interface GameProps {
  mode: InputMode;
  characterId: CharacterId;
  level: DifficultyLevel;
  /** true = bola bergerak (mode ketangkasan) */
  agility?: boolean;
  onExit: () => void;
  onFinish: (score: number, grade: string) => void;
}

/**
 * Posisikan angka di area aman (tidak kepotong atas/bawah).
 * Y dibatasi ~18–72% supaya di laptop tidak terpotong tombol Keluar.
 */
function createNumbersFromQuestion(
  question: MathQuestion,
  agility = false,
  /** 1 = normal; <1 lebih pelan (Tap + ketangkasan lebih mudah) */
  speedScale = 1
): FloatingNumber[] {
  const count = question.candidates.length;
  const cols = count <= 4 ? 2 : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const xMargin = 12;
  const yMin = 18;
  const yMax = 72;
  const xSpan = 100 - xMargin * 2;
  const ySpan = yMax - yMin;
  const cellW = xSpan / cols;
  const cellH = ySpan / rows;

  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (Math.random() - 0.5) * cellW * 0.3;
    const jitterY = (Math.random() - 0.5) * cellH * 0.25;
    const x = xMargin + cellW * (col + 0.5) + jitterX;
    const y = yMin + cellH * (row + 0.5) + jitterY;
    positions.push({
      x: Math.max(12, Math.min(88, x)),
      y: Math.max(yMin, Math.min(yMax, y)),
    });
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  return question.candidates.map((value, index) => {
    const isBomb = question.bombIndexes.includes(index);
    // Kecepatan acak untuk mode ketangkasan (% per detik)
    const speed = (12 + Math.random() * 22) * speedScale;
    const angle = Math.random() * Math.PI * 2;
    return {
      id: `n-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      value,
      x: positions[index].x,
      y: positions[index].y,
      isBomb,
      sliced: false,
      vx: agility ? Math.cos(angle) * speed : 0,
      vy: agility ? Math.sin(angle) * speed : 0,
    };
  });
}

function calcGrade(score: number, solved: number, maxCombo: number): string {
  if (solved >= 12 && maxCombo >= 5 && score >= 1500) return 'S';
  if (solved >= 8 && score >= 900) return 'A';
  if (solved >= 5 && score >= 500) return 'B';
  return 'C';
}

/**
 * Ganti tanda ? di soal dengan angka yang sudah dipilih, berurutan.
 * Contoh: "? + ? = 20" + [10] → "10 + ? = 20"
 *         "? + ? = 20" + [10, 8] → "10 + 8 = 20"
 */
function fillDisplay(display: string, selectedValues: number[]): string {
  let result = display;
  for (const value of selectedValues) {
    result = result.replace('?', String(value));
  }
  return result;
}

/** Berapa angka yang harus dipilih untuk soal ini */
function getNeededCount(question: MathQuestion): number {
  // Satu tanda tanya → 1 angka; dua tanda tanya → 2 angka
  const blanks = (question.display.match(/\?/g) || []).length;
  return Math.max(1, blanks);
}

/**
 * Cek jawaban.
 * + dan × : urutan bebas (10+5 = 5+10).
 * − dan ÷ : urutan KLIK berlaku (70÷10 ≠ 10÷70).
 */
function isValidSelection(
  question: MathQuestion,
  selectedValues: number[]
): boolean {
  const { operation, target, display } = question;
  const needed = getNeededCount(question);

  if (selectedValues.length < needed) return false;

  // Satu angka (contoh: "7 × ? = 56")
  if (needed === 1) {
    const n = selectedValues[0];
    const leftMul = display.match(/^(\d+)\s*[×x*]\s*\?/);
    if (leftMul && operation === 'mul') {
      return Number(leftMul[1]) * n === target;
    }
    const leftAdd = display.match(/^(\d+)\s*\+\s*\?/);
    if (leftAdd && operation === 'add') {
      return Number(leftAdd[1]) + n === target;
    }
    const leftSub = display.match(/^(\d+)\s*[−\-]\s*\?/);
    if (leftSub && operation === 'sub') {
      return Number(leftSub[1]) - n === target;
    }
    const leftDiv = display.match(/^(\d+)\s*[÷/]\s*\?/);
    if (leftDiv && operation === 'div') {
      const left = Number(leftDiv[1]);
      return n !== 0 && left / n === target;
    }
    return n === target;
  }

  // Dua angka — urutan = urutan klik/geser
  const [a, b] = selectedValues;

  if (operation === 'add') {
    // urutan bebas
    return a + b === target;
  }
  if (operation === 'mul') {
    // urutan bebas
    return a * b === target;
  }
  if (operation === 'sub') {
    // a − b (klik pertama − klik kedua)
    return a - b === target;
  }
  if (operation === 'div') {
    // a ÷ b (klik pertama ÷ klik kedua)
    return b !== 0 && a / b === target;
  }
  return false;
}

export default function Game({
  mode,
  characterId,
  level,
  agility = false,
  onExit,
  onFinish,
}: GameProps) {
  const character = getCharacterById(characterId);
  const playerName = loadProgress().playerName?.trim() || '';
  const displayName = playerName || character?.name || 'Pendekar';
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Batalkan pindah soal kalau jawaban salah / keluar */
  const nextQuestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const levelRef = useRef(level);
  levelRef.current = level;

  const clearNextQuestionTimeout = useCallback(() => {
    if (nextQuestionTimeoutRef.current) {
      clearTimeout(nextQuestionTimeoutRef.current);
      nextQuestionTimeoutRef.current = null;
    }
  }, []);

  const [countdownLabel, setCountdownLabel] = useState('READY');
  const [state, setState] = useState<GameState>(() => ({
    status: 'countdown',
    mode,
    characterId,
    lives: INITIAL_LIVES,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: ROUND_SECONDS,
    question: null,
    numbers: [],
    selectedIds: [],
    questionsSolved: 0,
    stage: 1,
  }));

  // BGM selama bermain
  useEffect(() => {
    sfx.startBgm();
    return () => sfx.stopBgm();
  }, []);

  // READY → 3 → 2 → 1 → GO → main
  useEffect(() => {
    if (state.status !== 'countdown') return;
    const steps: { label: string; ms: number }[] = [
      { label: 'READY', ms: 700 },
      { label: '3', ms: 700 },
      { label: '2', ms: 700 },
      { label: '1', ms: 700 },
      { label: 'GO!', ms: 500 },
    ];
    let i = 0;
    setCountdownLabel(steps[0].label);
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      i += 1;
      if (i >= steps.length) {
        const q = generateQuestion(levelRef.current);
        setState((prev) => ({
          ...prev,
          status: 'playing',
          question: q,
          numbers: createNumbersFromQuestion(
            q,
            agility,
            mode === 'tap' && agility ? 0.7 : 1
          ),
          selectedIds: [],
        }));
        return;
      }
      setCountdownLabel(steps[i].label);
      timer = setTimeout(next, steps[i].ms);
    };
    timer = setTimeout(next, steps[0].ms);
    return () => clearTimeout(timer);
  }, [state.status, agility, mode]);

  // Timer hitung mundur
  useEffect(() => {
    if (state.status !== 'playing') return;

    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          clearNextQuestionTimeout();
          sfx.finish();
          const grade = calcGrade(
            prev.score,
            prev.questionsSolved,
            prev.maxCombo
          );
          setTimeout(() => onFinish(prev.score, grade), 100);
          return { ...prev, timeLeft: 0, status: 'won' };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, onFinish, clearNextQuestionTimeout]);

  // Bersihkan timeout saat unmount
  useEffect(() => {
    return () => clearNextQuestionTimeout();
  }, [clearNextQuestionTimeout]);

  const spawnNextQuestion = useCallback((prev: GameState): GameState => {
    // Tetap di level yang dipilih user (tidak auto-naik mid-game)
    const q = generateQuestion(levelRef.current);
    return {
      ...prev,
      question: q,
      numbers: createNumbersFromQuestion(q, agility, mode === 'tap' && agility ? 0.7 : 1),
      selectedIds: [],
    };
  }, [agility, mode]);

  /**
   * Kehilangan nyawa.
   * - Soal TETAP SAMA (tidak ganti)
   * - restoreIds: bola non-bom muncul lagi
   * - Bom tetap hilang
   */
  const loseLife = useCallback(
    (
      prev: GameState,
      updatedNumbers: FloatingNumber[],
      restoreIds: string[] = []
    ): GameState => {
      // Pastikan tidak ada pindah soal yang tertunda
      clearNextQuestionTimeout();

      let numbers = updatedNumbers;
      if (restoreIds.length > 0) {
        const restoreSet = new Set(restoreIds);
        // Kembalikan bola + token baru agar animasi "hilang" tidak nempel (opacity 0)
        const token = Date.now();
        numbers = updatedNumbers.map((n) => {
          if (!(restoreSet.has(n.id) && !n.isBomb)) return n;
          const speed =
            (12 + Math.random() * 22) *
            (mode === 'tap' && agility ? 0.7 : 1);
          const angle = Math.random() * Math.PI * 2;
          return {
            ...n,
            sliced: false,
            id: `${n.id}-r${token}`,
            vx: agility ? Math.cos(angle) * speed : n.vx,
            vy: agility ? Math.sin(angle) * speed : n.vy,
          };
        });
      }

      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        sfx.finish();
        const grade = calcGrade(
          prev.score,
          prev.questionsSolved,
          prev.maxCombo
        );
        setTimeout(() => onFinish(prev.score, grade), 100);
        return {
          ...prev,
          lives: 0,
          combo: 0,
          status: 'lost',
          question: prev.question, // tetap soal yang sama
          numbers,
          selectedIds: [],
        };
      }

      // Jawaban salah: nyawa berkurang, bola balik, SOAL TIDAK BERUBAH
      return {
        ...prev,
        lives: newLives,
        combo: 0,
        question: prev.question,
        numbers,
        selectedIds: [],
      };
    },
    [onFinish, clearNextQuestionTimeout, agility, mode]
  );

  const handleNumberTap = useCallback(
    (num: FloatingNumber) => {
      if (state.status !== 'playing' || num.sliced) return;
      if (!state.question) return;
      // countdown selesai dulu baru boleh aksi

      setState((prev) => {
        if (!prev.question) return prev;

        // Bom → nyawa −1, bom hilang, SEMUA bola non-bom yang sempat hilang MUNCUL LANGSUNG
        if (num.isBomb) {
          sfx.boom();
          clearNextQuestionTimeout();
          const token = Date.now();
          const updated = prev.numbers.map((n) => {
            if (n.id === num.id) {
              // bom tetap hilang
              return { ...n, sliced: true };
            }
            if (n.isBomb) return n;
            // kembalikan semua non-bom yang sudah sliced (termasuk yang baru dipilih)
            if (n.sliced) {
              return {
                ...n,
                sliced: false,
                // id baru = komponen baru, animasi opacity 0 tidak nempel
                id: `restored-${token}-${n.value}-${Math.random().toString(36).slice(2, 6)}`,
              };
            }
            return n;
          });
          const newLives = prev.lives - 1;
          if (newLives <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            sfx.finish();
            const grade = calcGrade(
              prev.score,
              prev.questionsSolved,
              prev.maxCombo
            );
            setTimeout(() => onFinish(prev.score, grade), 100);
            return {
              ...prev,
              lives: 0,
              combo: 0,
              status: 'lost' as const,
              numbers: updated,
              selectedIds: [],
            };
          }
          return {
            ...prev,
            lives: newLives,
            combo: 0,
            numbers: updated,
            selectedIds: [],
            question: prev.question,
          };
        }

        const updatedNumbers = prev.numbers.map((n) =>
          n.id === num.id ? { ...n, sliced: true } : n
        );
        const newSelectedIds = [...prev.selectedIds, num.id];
        const selectedValues = newSelectedIds.map(
          (id) => prev.numbers.find((n) => n.id === id)!.value
        );
        const needed = getNeededCount(prev.question);

        // Belum cukup angka → tunggu klik berikutnya
        if (selectedValues.length < needed) {
          if (mode === 'slice') sfx.slash();
          else sfx.tap();
          return {
            ...prev,
            numbers: updatedNumbers,
            selectedIds: newSelectedIds,
          };
        }

        // Cek jawaban
        if (isValidSelection(prev.question, selectedValues)) {
          const newCombo = prev.combo + 1;
          const points =
            POINTS_PER_SOLVE +
            (newCombo > 1 ? (newCombo - 1) * COMBO_BONUS : 0);
          if (mode === 'slice') sfx.slash();
          if (newCombo > 1) sfx.combo();
          else sfx.correct();
          const next: GameState = {
            ...prev,
            score: prev.score + points,
            combo: newCombo,
            maxCombo: Math.max(prev.maxCombo, newCombo),
            questionsSolved: prev.questionsSolved + 1,
            numbers: updatedNumbers,
            selectedIds: newSelectedIds,
          };
          // Hanya benar → ganti soal setelah jeda singkat
          clearNextQuestionTimeout();
          nextQuestionTimeoutRef.current = setTimeout(() => {
            nextQuestionTimeoutRef.current = null;
            setState((p) => spawnNextQuestion(p));
          }, 350);
          return next;
        }

        // Salah → nyawa −1, bola muncul lagi, SOAL TETAP
        sfx.wrong();
        return loseLife(prev, updatedNumbers, newSelectedIds);
      });
    },
    [state.status, loseLife, spawnNextQuestion, clearNextQuestionTimeout, onFinish]
  );


  // Mode ketangkasan: bola mantul di arena
  useEffect(() => {
    if (!agility || state.status !== 'playing') return;

    let raf = 0;
    let last = performance.now();
    const xMin = 12;
    const xMax = 88;
    const yMin = 18;
    const yMax = 72;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      setState((prev) => {
        if (prev.status !== 'playing') return prev;
        let changed = false;
        let numbers = prev.numbers.map((n) => {
          if (n.sliced) return n;
          const vx = n.vx ?? 0;
          const vy = n.vy ?? 0;
          if (vx === 0 && vy === 0) return n;
          changed = true;
          let x = n.x + vx * dt;
          let y = n.y + vy * dt;
          let nvx = vx;
          let nvy = vy;
          if (x < xMin) {
            x = xMin;
            nvx = Math.abs(vx);
          } else if (x > xMax) {
            x = xMax;
            nvx = -Math.abs(vx);
          }
          if (y < yMin) {
            y = yMin;
            nvy = Math.abs(vy);
          } else if (y > yMax) {
            y = yMax;
            nvy = -Math.abs(vy);
          }
          return { ...n, x, y, vx: nvx, vy: nvy };
        });

        // Tolak pelan antar bola supaya jarang numpuk exact (kurangi double-hit)
        const minDist = 11;
        for (let i = 0; i < numbers.length; i++) {
          if (numbers[i].sliced) continue;
          for (let j = i + 1; j < numbers.length; j++) {
            if (numbers[j].sliced) continue;
            const dx = numbers[j].x - numbers[i].x;
            const dy = numbers[j].y - numbers[i].y;
            const d = Math.hypot(dx, dy) || 0.01;
            if (d >= minDist) continue;
            changed = true;
            const push = ((minDist - d) / 2) * 0.35;
            const nx = dx / d;
            const ny = dy / d;
            const a = { ...numbers[i] };
            const b = { ...numbers[j] };
            a.x = Math.max(xMin, Math.min(xMax, a.x - nx * push));
            a.y = Math.max(yMin, Math.min(yMax, a.y - ny * push));
            b.x = Math.max(xMin, Math.min(xMax, b.x + nx * push));
            b.y = Math.max(yMin, Math.min(yMax, b.y + ny * push));
            numbers[i] = a;
            numbers[j] = b;
          }
        }

        if (!changed) return prev;
        return { ...prev, numbers };
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [agility, state.status]);

  const hearts = Array.from({ length: INITIAL_LIVES }, (_, i) =>
    i < state.lives ? '❤️' : '🖤'
  );

  // Angka yang sudah dipilih → tampilkan di soal menggantikan ?
  const selectedValues = state.selectedIds.map(
    (id) => state.numbers.find((n) => n.id === id)?.value ?? 0
  );
  const displayText = state.question
    ? fillDisplay(state.question.display, selectedValues)
    : '...';
  const levelLabel = getLevelById(level).labelId;
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const isSlicingRef = useRef(false);
  const slicedThisGestureRef = useRef<Set<string>>(new Set());

  /**
   * Mode Slice: hit-test geometri.
   * Jika beberapa bola tumpuk di titik yang sama → hanya 1 bola
   * (terdekat ke pointer; kalau sama, yang digambar paling atas).
   * Satu frame = maksimal satu hit, supaya nyawa tidak −2 sekaligus.
   */
  const handleSliceMove = useCallback(
    (clientX: number, clientY: number) => {
      if (mode !== 'slice' || !isSlicingRef.current) return;
      const arena = arenaRef.current;
      if (!arena) return;

      const rect = arena.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const px = ((clientX - rect.left) / rect.width) * 100;
      const py = ((clientY - rect.top) / rect.height) * 100;

      const hitR = 9;
      const hitR2 = hitR * hitR;

      let bestId: string | null = null;
      let bestDist = Infinity;
      let bestIndex = -1;

      for (let index = 0; index < state.numbers.length; index++) {
        const num = state.numbers[index];
        if (num.sliced) continue;
        if (slicedThisGestureRef.current.has(num.id)) continue;
        const dx = num.x - px;
        const dy = num.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 > hitR2) continue;
        // Lebih dekat menang; jarak hampir sama → index lebih besar = "di depan"
        if (
          d2 < bestDist - 0.0001 ||
          (Math.abs(d2 - bestDist) <= 0.0001 && index > bestIndex)
        ) {
          bestId = num.id;
          bestDist = d2;
          bestIndex = index;
        }
      }

      if (bestId) {
        const hit = state.numbers.find((n) => n.id === bestId);
        if (hit && !hit.sliced) {
          slicedThisGestureRef.current.add(hit.id);
          handleNumberTap(hit);
        }
      }
    },
    [mode, state.numbers, handleNumberTap]
  );

  const onArenaPointerDown = (e: React.PointerEvent) => {
    if (mode !== 'slice' || state.status !== 'playing') return;
    // Jangan mulai drag dari tombol keluar dll.
    e.preventDefault();
    isSlicingRef.current = true;
    slicedThisGestureRef.current = new Set();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    handleSliceMove(e.clientX, e.clientY);
  };

  const onArenaPointerMove = (e: React.PointerEvent) => {
    if (mode !== 'slice' || !isSlicingRef.current) return;
    handleSliceMove(e.clientX, e.clientY);
  };

  const onArenaPointerUp = (e: React.PointerEvent) => {
    if (mode !== 'slice') return;
    isSlicingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="game-screen">
      <div className="game-inner">
        <div className="game-hud">
          <div className="hud-left">
            <span className="hud-lives">{hearts.join('')}</span>
            <span className="hud-char">
              {character?.emoji ?? '🥋'} {displayName} · {levelLabel}
            </span>
          </div>
          <div className="hud-center">
            <span className="hud-timer">{state.timeLeft}s</span>
          </div>
          <div className="hud-right">
            <span className="hud-score">{state.score}</span>
            {state.combo > 1 && (
              <span className="hud-combo">x{state.combo}</span>
            )}
            <button type="button" className="btn-exit-top" onClick={onExit}>
              Keluar
            </button>
          </div>
        </div>

        <div className="game-question">
          <p className="question-text">{displayText}</p>
          <p className="question-hint">
            {mode === 'tap'
              ? 'Ketuk angka yang benar'
              : 'Tahan lalu geser melewati angka (mouse atau jari)'}
          </p>
        </div>

        <div className="game-char-banner">
          {character?.imageCloseSrc || character?.imageSrc ? (
            <img
              src={character.imageCloseSrc || character.imageSrc}
              alt={character.name}
              className="game-char-img"
              width={56}
              height={56}
            />
          ) : (
            <span className="game-char-emoji" aria-hidden>
              {character?.emoji ?? '🥋'}
            </span>
          )}
          <div className="game-char-text">
            <strong>{displayName}</strong>
            <span>
              {character?.nicknameId ?? ''}
              {mode === 'slice' ? ' · Slice' : ' · Tap'}
              {agility ? ' · Bergerak' : ''}
            </span>
          </div>
        </div>

        <div
          className={`game-arena ${mode === 'slice' ? 'slice-mode' : ''} ${agility ? 'agility-mode' : ''}`}
          ref={arenaRef}
          onPointerDown={onArenaPointerDown}
          onPointerMove={onArenaPointerMove}
          onPointerUp={onArenaPointerUp}
          onPointerCancel={onArenaPointerUp}
        >
          {state.status === 'countdown' && (
            <div className="countdown-overlay" aria-live="polite">
              <span
                key={countdownLabel}
                className={`countdown-text ${
                  countdownLabel === 'GO!' ? 'is-go' : ''
                } ${countdownLabel === 'READY' ? 'is-ready' : ''}`}
              >
                {countdownLabel}
              </span>
            </div>
          )}
          {state.numbers.map((num, index) => {
            const hitClass = num.sliced
              ? mode === 'slice'
                ? 'hit-slice'
                : 'hit-tap'
              : '';
            return (
              <button
                type="button"
                key={num.id}
                data-num-id={num.sliced ? undefined : num.id}
                className={`floating-number ${num.isBomb ? 'is-bomb' : ''} ${hitClass}`}
                style={{
                  left: `${num.x}%`,
                  top: `${num.y}%`,
                  opacity: num.sliced ? undefined : 1,
                  zIndex: num.sliced ? 0 : index + 1,
                }}
                disabled={num.sliced}
                onPointerDown={(e) => {
                  if (mode !== 'tap' || num.sliced) return;
                  e.preventDefault();
                  e.stopPropagation();
                  handleNumberTap(num);
                }}
              >
                {num.isBomb ? '💣' : num.value}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
