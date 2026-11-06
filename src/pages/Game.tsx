/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { CharacterId, InputMode } from '../lib/types';
import type { DifficultyLevel } from '../lib/levels';
import { getLevelById } from '../lib/levels';
import { getCharacterById } from '../lib/characters';
import { generateQuestion } from '../lib/mathGenerator';
import type { MathQuestion, OperationType } from '../lib/mathGenerator';
import type { FloatingNumber, GameState } from '../lib/gameTypes';
import {
  INITIAL_LIVES,
  ROUND_SECONDS,
  POINTS_PER_SOLVE,
  COMBO_BONUS_STATIC,
  COMBO_BONUS_AGILITY,
  computeSolvePoints,
} from '../lib/gameTypes';
import { cityBgCandidates } from '../lib/adventure';
import { t } from '../lib/i18n';
import { sfx, playCityMusic, stopAllMusic } from '../lib/sound';
import { loadProgress, updateProgress } from '../lib/storage';

function playEndSound(score: number, target?: number) {
  // Lolos kota / di atas target → fanfare; selain itu nada selesai biasa
  if (target != null && score >= target) {
    sfx.win();
    setTimeout(() => sfx.combo(), 180);
  } else {
    sfx.finish();
  }
}

interface GameProps {
  mode: InputMode;
  characterId: CharacterId;
  level: DifficultyLevel;
  /** true = bola bergerak (mode ketangkasan) */
  /** @deprecated pakai arenaStyle */
  agility?: boolean;
  arenaStyle?: 'static' | 'agility' | 'pass';
  practiceSession?: 'grade' | 'sprint';
  sprintTarget?: number;
  /** Petualangan: detik ditambah tiap jawaban benar */
  timeBonusSec?: number;
  /** Petualangan: detik dikurangi tiap jawaban salah */
  timePenaltySec?: number;
  /** Petualangan: nama kota di HUD */
  cityName?: string;
  cityId?: string;
  /** Petualangan: skor lolos ke kota berikutnya */
  targetScore?: number;
  onExit: () => void;
  /** Latihan Fokus: batasi operasi (harus cocok level) */
  forceOps?: Array<'add' | 'sub' | 'mul' | 'div'>;
  /** Petualangan: id tempo utk pengali skor */
  tempoId?: string;
  /**
   * true = jangan mulai countdown dulu (transisi peta masih di depan).
   * BG + HUD sudah siap di belakang.
   */
  holdStart?: boolean;
  onFinish: (
    score: number,
    grade: string,
    meta?: {
      maxCombo: number;
      perfect: boolean;
      sprintMs?: number;
      sessionKind?: string;
      sprintLength?: number;
    }
  ) => void;
}

/**
 * Posisikan angka di area aman (tidak kepotong atas/bawah).
 * Y dibatasi ~18–72% supaya di laptop tidak terpotong tombol {t('exit')}.
 */
/** Cek apakah sisa jawaban (setelah partial select) masih ada di arena */

type PassSide = 'left' | 'right' | 'top' | 'bottom';

function randomPassSide(): PassSide {
  const sides: PassSide[] = ['left', 'right', 'top', 'bottom'];
  return sides[Math.floor(Math.random() * 4)]!;
}

/** Spawn 1 bola lewat — 4 sisi, titik/speed/arah acak (berantakan tapi adil) */
function spawnPassBall(
  value: number,
  isBomb: boolean,
  speedScale = 1
): FloatingNumber {
  const side = randomPassSide();
  const base =
    (11 + Math.random() * 18) * speedScale * arenaMoveSpeedScale();
  // drift lebih besar = lintasan diagonal, tidak selalu lurus
  const drift =
    (Math.random() - 0.5) * (8 + Math.random() * 10) * speedScale * arenaMoveSpeedScale();
  // titik keluar tersebar di tepi (bukan selalu tengah)
  const yEdge = 6 + Math.random() * 88;
  const xEdge = 6 + Math.random() * 88;
  const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  switch (side) {
    case 'left':
      return {
        id,
        value,
        x: -4 - Math.random() * 14,
        y: yEdge,
        isBomb,
        sliced: false,
        vx: base * (0.85 + Math.random() * 0.45),
        vy: drift,
      };
    case 'right':
      return {
        id,
        value,
        x: 104 + Math.random() * 14,
        y: yEdge,
        isBomb,
        sliced: false,
        vx: -base * (0.85 + Math.random() * 0.45),
        vy: drift,
      };
    case 'top':
      return {
        id,
        value,
        x: xEdge,
        y: -4 - Math.random() * 14,
        isBomb,
        sliced: false,
        vx: drift,
        vy: base * (0.85 + Math.random() * 0.45),
      };
    case 'bottom':
    default:
      return {
        id,
        value,
        x: xEdge,
        y: 104 + Math.random() * 14,
        isBomb,
        sliced: false,
        vx: drift,
        vy: -base * (0.85 + Math.random() * 0.45),
      };
  }
}

/**
 * Apakah masih bisa menyelesaikan soal dengan angka di arena + yang sudah dipilih?
 * (bukan cuma 1 pasangan seed — terima pasangan mana pun yang valid)
 */
function isPassCompletable(
  question: MathQuestion,
  selected: number[],
  liveValues: number[]
): boolean {
  const needed = getNeededCount(question);
  if (selected.length >= needed) return true;

  if (needed === 1) {
    return liveValues.some((v) => isValidSelection(question, [v]));
  }

  // 2 angka
  if (selected.length === 1) {
    const a = selected[0];
    return liveValues.some((v) => isValidSelection(question, [a, v]));
  }

  // selected.length === 0: ada pasangan valid di liveValues
  for (let i = 0; i < liveValues.length; i++) {
    for (let j = 0; j < liveValues.length; j++) {
      if (i === j) {
        // a+a atau a×a boleh jika dua bola sama ada
        const count = liveValues.filter((x) => x === liveValues[i]).length;
        if (count < 2) continue;
      }
      if (isValidSelection(question, [liveValues[i], liveValues[j]])) return true;
    }
  }
  return false;
}

/** Nilai yang membantu melengkapi jawaban (bukan hanya seed correctNumbers) */
function complementaryValues(
  question: MathQuestion,
  selected: number[],
  maxVal: number
): number[] {
  const needed = getNeededCount(question);
  const out: number[] = [];
  const { operation, target } = question;

  if (needed === 1) {
    // satu blank: seed correct
    return [...question.correctNumbers];
  }

  if (selected.length === 1) {
    const a = selected[0];
    if (operation === 'add') out.push(target - a);
    else if (operation === 'mul' && a !== 0 && target % a === 0) out.push(target / a);
    else if (operation === 'sub') {
      out.push(a - target); // a - b = target → b = a - target
      out.push(a + target); // kalau klik terbalik jarang, tapi decoy ok
    } else if (operation === 'div') {
      if (a !== 0 && target !== 0) out.push(a / target); // a/b=target → b=a/target
      out.push(a * target);
    }
  } else {
    // belum pilih: taruh seed + beberapa pasangan alt
    out.push(...question.correctNumbers);
    if (operation === 'add') {
      for (let a = 1; a < target && out.length < 6; a++) {
        const b = target - a;
        if (b >= 1 && b <= maxVal) {
          out.push(a, b);
        }
      }
    } else if (operation === 'mul') {
      for (let a = 2; a <= maxVal && out.length < 6; a++) {
        if (target % a === 0) {
          const b = target / a;
          if (b >= 1 && b <= maxVal) out.push(a, b);
        }
      }
    } else {
      out.push(...question.correctNumbers);
    }
  }

  return [
    ...new Set(
      out
        .filter((n) => Number.isFinite(n) && n > 0 && Number.isInteger(n))
        .map((n) => Math.round(n))
    ),
  ];
}

/**
 * Jaga arena Pass: minimal banyak bola + selalu ada jalur jawaban.
 * Tidak boleh sisa 1 bola jawaban sendirian.
 */
function ensurePassPopulation(
  question: MathQuestion,
  numbers: FloatingNumber[],
  selected: number[],
  speedScale: number
): FloatingNumber[] {
  let live = numbers.filter((n) => !n.sliced);
  const sliced = numbers.filter((n) => n.sliced);
  const MIN_LIVE = Math.max(5, Math.min(8, question.candidates.length));

  const liveVals = () => live.filter((n) => !n.isBomb).map((n) => n.value);
  const maxVal = Math.max(20, ...question.candidates, question.target, 30);

  // 1) Pastikan completable
  let guard = 0;
  while (!isPassCompletable(question, selected, liveVals()) && guard < 12) {
    guard++;
    const comps = complementaryValues(question, selected, maxVal);
    const pick =
      comps[Math.floor(Math.random() * Math.max(1, comps.length))] ??
      question.correctNumbers[0] ??
      1;
    live.push(spawnPassBall(pick, false, speedScale));
  }

  // 2) Isi sampai MIN_LIVE — campuran kandidat soal + pelengkap
  guard = 0;
  while (live.length < MIN_LIVE && guard < 16) {
    guard++;
    const pool = [
      ...question.candidates,
      ...complementaryValues(question, selected, maxVal),
    ];
    const decoys = pool.filter((v) => {
      // jangan spam bom di sini
      return true;
    });
    const v =
      decoys[Math.floor(Math.random() * decoys.length)] ??
      question.candidates[Math.floor(Math.random() * question.candidates.length)] ??
      1;
    // ~12% bom dari kandidat non-correct (kalau ada slot bom di soal)
    const bombish =
      Math.random() < 0.1 &&
      !question.correctNumbers.includes(v) &&
      selected.length === 0;
    live.push(spawnPassBall(v, bombish, speedScale));
  }

  // 3) Cap biar tidak penuh sesak
  if (live.length > 16) {
    live = live.slice(-16);
  }

  return [...sliced, ...live];
}




/** Skala kecepatan arena gerak: desktop lebih pelan (terasa setara HP). */
function arenaMoveSpeedScale(extra = 1): number {
  // Titik tengah: ~70% kecepatan awal. Desktop sedikit lebih pelan dari HP.
  let base = 0.92;
  try {
    if (typeof window !== 'undefined' && window.innerWidth >= 900) base = 0.78;
  } catch {
    /* ignore */
  }
  return base * extra;
}

function createNumbersFromQuestion(
  question: MathQuestion,
  arenaStyle: 'static' | 'agility' | 'pass' = 'static',
  /** 1 = normal; <1 lebih pelan (Tap + gerak lebih mudah) */
  speedScale = 1
): FloatingNumber[] {
  const count = question.candidates.length;
  const yMin = 8;
  const yMax = 90;

  if (arenaStyle === 'pass') {
    // Spawn dari 4 sisi acak
    return question.candidates.map((value, index) => {
      const isBomb = question.bombIndexes.includes(index);
      return spawnPassBall(value, isBomb, speedScale);
    });
  }

  const cols = count <= 4 ? 2 : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const xMargin = 12;
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

  const agility = arenaStyle === 'agility';
  return question.candidates.map((value, index) => {
    const isBomb = question.bombIndexes.includes(index);
    const speed = (10 + Math.random() * 14) * speedScale * arenaMoveSpeedScale();
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

/** Petualangan: S/A hanya jika lolos target. Latihan: ambang skor absolut. */
function calcGrade(
  score: number,
  solved: number,
  maxCombo: number,
  opts?: { targetScore?: number; isAdventure?: boolean }
): string {
  const target = opts?.targetScore;
  if (opts?.isAdventure && typeof target === 'number' && target > 0) {
    const passed = score >= target;
    if (passed && score >= target * 1.35 && maxCombo >= 8 && solved >= 10) return 'S';
    if (passed && (score >= target * 1.1 || maxCombo >= 5)) return 'A';
    if (passed) return 'B';
    if (score >= target * 0.7) return 'C';
    return 'D';
  }
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

/** Pecah teks soal jadi angka + simbol berwarna (supaya + vs × jelas). */
function renderQuestionParts(
  text: string,
  operation: OperationType | undefined
): ReactNode {
  const tokens = text.split(/(\d+|\?|[+\-−×÷=]|\s+)/).filter((t) => t !== '');
  let pastEq = false;
  return tokens.map((tok, i) => {
    const t = tok.trim();
    if (t === '') return <span key={i}>{tok}</span>;
    if (t === '=') {
      pastEq = true;
      return (
        <span key={i} className="q-eq" aria-hidden={false}>
          =
        </span>
      );
    }
    if (/^\d+$/.test(t) || t === '?') {
      const isEmpty = t === '?';
      const kind = pastEq ? 'answer' : isEmpty ? 'empty' : 'filled';
      return (
        <span
          key={i}
          className={`q-card q-card-${kind}`}
          aria-label={isEmpty ? '?' : t}
        >
          <span className="q-card-inner">{isEmpty ? '?' : t}</span>
        </span>
      );
    }
    if (t === '+' || t === '−' || t === '-' || t === '×' || t === '÷') {
      let kind = 'add';
      if (operation === 'add') kind = 'add';
      else if (operation === 'sub') kind = 'sub';
      else if (operation === 'mul') kind = 'mul';
      else if (operation === 'div') kind = 'div';
      else if (t === '−' || t === '-') kind = 'sub';
      else if (t === '×') kind = 'mul';
      else if (t === '÷') kind = 'div';
      else kind = 'add';
      const symbol =
        kind === 'add' ? '+' : kind === 'sub' ? '−' : kind === 'mul' ? '×' : '÷';
      return (
        <span key={i} className={`q-op q-op-${kind}`} aria-hidden={false}>
          {symbol}
        </span>
      );
    }
    return <span key={i}>{tok}</span>;
  });
}


function opChipLabel(op: OperationType | undefined): string {
  if (!op) return '';
  if (op === 'add') return t('opChipAdd');
  if (op === 'sub') return t('opChipSub');
  if (op === 'mul') return t('opChipMul');
  return t('opChipDiv');
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
  arenaStyle: arenaStyleProp,
  practiceSession = 'grade',
  sprintTarget = 5,
  timeBonusSec = 0,
  timePenaltySec = 0,
  cityName,
  cityId,
  targetScore,
  onExit,
  forceOps,
  tempoId,
  holdStart = false,
  onFinish,
}: GameProps) {
  const arenaStyle: 'static' | 'agility' | 'pass' =
    arenaStyleProp ?? (agility ? 'agility' : 'static');
  const isMoving = arenaStyle === 'agility' || arenaStyle === 'pass';
  const isSprint = practiceSession === 'sprint';
  const sprintGoal = Math.max(1, sprintTarget || 5);
  const sprintStartedAtRef = useRef<number>(0);
  const forceOpsRef = useRef(forceOps);
  forceOpsRef.current = forceOps;
  const tempoIdRef = useRef(tempoId);
  tempoIdRef.current = tempoId;
  const levelIdRef = useRef(level);
  levelIdRef.current = level;
  const mistakesRef = useRef(0);
  /** Waktu soal saat ini muncul (ms) */
  const questionShownAtRef = useRef<number>(0);
  /** Sudah salah di soal berjalan (batalkan bonus cepat) */
  const questionHadMistakeRef = useRef(false);
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
  /**
   * BG arena: null dulu sampai Image() onload — cegah flash dojo / file 404.
   * Latihan → dojo; petualangan → kota (fallback default, BUKAN dojo).
   */
  const [resolvedBgUrl, setResolvedBgUrl] = useState<string | null>(null);
  const [opFlash, setOpFlash] = useState(false);
  const prevOpRef = useRef<OperationType | null>(null);
  const [bgReady, setBgReady] = useState(false);
  const [showVolumeHint, setShowVolumeHint] = useState(true);
  /** Layer jejak slice — DOM langsung (bukan React setState tiap move) */
  const trailLayerRef = useRef<HTMLDivElement | null>(null);
  /** Layer efek benturan tap (kena / miss) */
  const impactLayerRef = useRef<HTMLDivElement | null>(null);
  const lastTrailTsRef = useRef(0);
  /** Animasi avatar HUD: idle | attack | miss */
  const [avatarPose, setAvatarPose] = useState<'idle' | 'attack' | 'miss'>('idle');
  const avatarPoseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [soundMuted, setSoundMuted] = useState(
    () => loadProgress().soundMuted === true
  );
  const toggleMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    updateProgress({ soundMuted: next });
    if (next) {
      stopAllMusic();
    } else if (cityId) {
      playCityMusic(cityId);
    } else {
      sfx.startBgm();
    }
  };
  const [state, setState] = useState<GameState>(() => ({
    status: 'countdown',
    mode,
    characterId,
    lives: INITIAL_LIVES,
    score: 0,
    combo: 0,
    maxCombo: 0,
    // Sprint = count-up dari 0 sejak READY; Grade = count-down 60
    timeLeft: practiceSession === 'sprint' ? 0 : ROUND_SECONDS,
    question: null,
    numbers: [],
    selectedIds: [],
    selectedValues: [],
    questionsSolved: 0,
    stage: 1,
  }));


  // Pause total saat tab/PWA tidak terlihat
  const [bgPaused, setBgPaused] = useState(false);
  const statusBeforePauseRef = useRef<'playing' | 'countdown' | null>(null);
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) return;
      setState((prev) => {
        if (prev.status !== 'playing' && prev.status !== 'countdown') return prev;
        statusBeforePauseRef.current = prev.status;
        return { ...prev, status: 'paused' };
      });
      setBgPaused(true);
      stopAllMusic();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const resumeFromBgPause = () => {
    const back = statusBeforePauseRef.current || 'playing';
    statusBeforePauseRef.current = null;
    setBgPaused(false);
    setState((prev) =>
      prev.status === 'paused'
        ? { ...prev, status: back }
        : prev
    );
    if (cityId) playCityMusic(cityId);
    else sfx.startBgm();
  };

  // Musik: tahan selama holdStart (transisi peta), baru mulai saat overlay hilang
  useEffect(() => {
    if (holdStart) {
      stopAllMusic();
      return;
    }
    if (cityId) playCityMusic(cityId);
    else sfx.startBgm();
    return () => stopAllMusic();
  }, [cityId, holdStart]);

  // Resolve BG: probe dulu, baru tampil (hindari flash dojo / broken image).
  useEffect(() => {
    setBgReady(false);
    setResolvedBgUrl(null);
    const candidates = cityBgCandidates(cityId ? cityId : 'dojo');
    // Petualangan: jangan pernah pakai path dojo
    const list = cityId
      ? candidates.filter((u) => !u.includes('/dojo.'))
      : candidates;
    let cancelled = false;
    const probe = (url: string) =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
    (async () => {
      for (const url of list) {
        const ok = await probe(url);
        if (cancelled) return;
        if (ok) {
          setResolvedBgUrl(url);
          setBgReady(true);
          return;
        }
      }
      if (!cancelled) {
        if (cityId) {
          for (const fb of ['/cities/bg/default.webp', '/cities/bg/default.jpg', '/cities/bg/default.png']) {
            if (await probe(fb)) {
              if (!cancelled) {
                setResolvedBgUrl(fb);
                setBgReady(true);
              }
              return;
            }
          }
          // Kota tanpa aset: arena polos (bukan dojo)
          if (!cancelled) {
            setResolvedBgUrl(null);
            setBgReady(true);
          }
          return;
        }
        // Latihan / offline: coba dojo, jika belum ter-cache → arena polos
        for (const fb of ['/cities/bg/dojo.webp', '/cities/bg/dojo.jpg', '/cities/bg/dojo.png']) {
          if (await probe(fb)) {
            if (!cancelled) {
              setResolvedBgUrl(fb);
              setBgReady(true);
            }
            return;
          }
        }
        if (!cancelled) {
          setResolvedBgUrl(null);
          setBgReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cityId]);


  // Selesai / keluar → musik kota wajib diam (soft-lock anti tabrakan)
  useEffect(() => {
    if (state.status === 'won' || state.status === 'lost') {
      stopAllMusic();
    }
  }, [state.status]);

  // READY → 3 → 2 → 1 → GO → main (tunggu holdStart selesai = peta sudah land)
  useEffect(() => {
    if (state.status !== 'countdown') return;
    if (holdStart) {
      setCountdownLabel('READY');
      return;
    }
    const steps: { label: string; ms: number }[] = [
      { label: 'READY', ms: 700 },
      { label: '3', ms: 650 },
      { label: '2', ms: 650 },
      { label: '1', ms: 650 },
      { label: 'GO!', ms: 450 },
    ];
    let i = 0;
    setCountdownLabel(steps[0].label);
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      i += 1;
      if (i >= steps.length) {
        const q = generateQuestion(levelRef.current, { forceOps: forceOpsRef.current });
        sprintStartedAtRef.current = performance.now();
        setState((prev) => ({
          ...prev,
          status: 'playing',
          // Sprint: timer dipakai sbg elapsed (naik); grade: countdown 60s
          timeLeft: isSprint ? 0 : prev.timeLeft,
          question: q,
          numbers: createNumbersFromQuestion(
            q,
            arenaStyle,
            mode === 'tap' && isMoving ? 0.7 : 1
          ),
          selectedIds: [],
          selectedValues: [],
        }));
        return;
      }
      setCountdownLabel(steps[i].label);
      timer = setTimeout(next, steps[i].ms);
    };
    timer = setTimeout(next, steps[0].ms);
    return () => clearTimeout(timer);
  }, [state.status, arenaStyle, isMoving, mode, holdStart]);

  // Timer: Grade = hitung mundur; Sprint = hitung naik (elapsed)
  useEffect(() => {
    if (state.status !== 'playing') return;

    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (isSprint) {
          // Elapsed detik; batas aman 10 menit
          const nextT = prev.timeLeft + 1;
          if (nextT >= 600) {
            if (timerRef.current) clearInterval(timerRef.current);
            clearNextQuestionTimeout();
            stopAllMusic();
            playEndSound(prev.score, targetScore);
            const sprintMs = Math.round(performance.now() - sprintStartedAtRef.current);
            const grade = calcGrade(prev.score, prev.questionsSolved, prev.maxCombo, {});
            setTimeout(
              () =>
                onFinish(prev.score, grade, {
                  maxCombo: prev.maxCombo,
                  perfect: mistakesRef.current === 0 && prev.questionsSolved > 0,
                  sprintMs,
                  sessionKind: 'sprint',
                  sprintLength: sprintGoal,
                }),
              100
            );
            return { ...prev, timeLeft: nextT, status: 'won' };
          }
          return { ...prev, timeLeft: nextT };
        }
        if (prev.timeLeft <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          clearNextQuestionTimeout();
          stopAllMusic();
          playEndSound(prev.score, targetScore);
          const grade = calcGrade(
            prev.score,
            prev.questionsSolved,
            prev.maxCombo,
            {
              targetScore,
              isAdventure: typeof targetScore === 'number' && targetScore > 0,
            }
          );
          setTimeout(
            () =>
              onFinish(prev.score, grade, {
                maxCombo: prev.maxCombo,
                perfect:
                  mistakesRef.current === 0 && prev.questionsSolved > 0,
              }),
            100
          );
          return { ...prev, timeLeft: 0, status: 'won' };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, onFinish, clearNextQuestionTimeout, isSprint, sprintGoal, targetScore]);

  // Bersihkan timeout saat unmount
  useEffect(() => {
    return () => clearNextQuestionTimeout();
  }, [clearNextQuestionTimeout]);

  const spawnNextQuestion = useCallback((prev: GameState): GameState => {
    // Tetap di level yang dipilih user (tidak auto-naik mid-game)
    const q = generateQuestion(levelRef.current, { forceOps: forceOpsRef.current });
    const scale = mode === 'tap' && isMoving ? 0.7 : 1;
    // Mode Lewat: soal baru = gelombang baru dari tepi (nilai acak soal baru)
    // Jangan pakai bola sisa soal lama di tengah layar
    if (arenaStyle === 'pass') {
      return {
        ...prev,
        question: q,
        numbers: createNumbersFromQuestion(q, 'pass', scale),
        selectedIds: [],
        selectedValues: [],
      };
    }
    return {
      ...prev,
      question: q,
      numbers: createNumbersFromQuestion(q, arenaStyle, scale),
      selectedIds: [],
      selectedValues: [],
    };
  }, [arenaStyle, mode, isMoving]);

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
        const token = Date.now();
        const scale = mode === 'tap' && isMoving ? 0.7 : 1;
        numbers = updatedNumbers.map((n) => {
          if (!(restoreSet.has(n.id) && !n.isBomb)) return n;
          // Diam: posisi sama. Pantul: titik terakhir + arah baru. Lewat: masuk dari tepi.
          if (arenaStyle === 'pass') {
            const nb = spawnPassBall(n.value, !!n.isBomb, scale);
            return { ...n, ...nb, sliced: false, id: `${n.id}-r${token}` };
          }
          if (arenaStyle === 'agility') {
            const speed = (7 + Math.random() * 11) * scale * arenaMoveSpeedScale();
            const angle = Math.random() * Math.PI * 2;
            return {
              ...n,
              sliced: false,
              id: `${n.id}-r${token}`,
              // titik terakhir saat ditebas
              x: n.x,
              y: n.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
            };
          }
          // static: posisi sama, diam
          return {
            ...n,
            sliced: false,
            id: `${n.id}-r${token}`,
            vx: 0,
            vy: 0,
          };
        });
      }

      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        clearNextQuestionTimeout();
        stopAllMusic();
        playEndSound(prev.score, targetScore);
        const grade = calcGrade(
          prev.score,
          prev.questionsSolved,
          prev.maxCombo,
          {
            targetScore,
            isAdventure: typeof targetScore === 'number' && targetScore > 0,
          }
        );
        // Langsung ke hasil — jangan andalkan delay (anti layar blank)
        const finalScore = prev.score;
        const finalCombo = prev.maxCombo;
        const finalSolved = prev.questionsSolved;
        queueMicrotask(() => {
          onFinish(finalScore, grade, {
            maxCombo: finalCombo,
            perfect: mistakesRef.current === 0 && finalSolved > 0,
          });
        });
        return {
          ...prev,
          lives: 0,
          combo: 0,
          status: 'lost',
          question: prev.question,
          // Pertahankan bola di layar supaya tidak "kosong total" sebelum result
          numbers: numbers.length ? numbers : prev.numbers,
          selectedIds: [],
          selectedValues: [],
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
        selectedValues: [],
      };
    },
    [onFinish, clearNextQuestionTimeout, isMoving, mode, arenaStyle]
  );


  // Catat saat soal baru muncul (untuk bonus jawab cepat)
  useEffect(() => {
    if (state.status !== 'playing' || !state.question) return;
    questionShownAtRef.current = performance.now();
    questionHadMistakeRef.current = false;
  }, [state.question?.display, state.question?.target, state.status]);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const isSlicingRef = useRef(false);
  const slicedThisGestureRef = useRef<Set<string>>(new Set());

  /** Gaya serang dari data karakter (weapon / style) */
  const attackStyle =
    (character as { weapon?: string; style?: string } | undefined)?.weapon ||
    (character as { style?: string } | undefined)?.style ||
    (mode === 'slice' ? 'tongkat' : 'shaolin');

  const pulseAvatar = useCallback((pose: 'attack' | 'miss') => {
    if (avatarPoseTimerRef.current) clearTimeout(avatarPoseTimerRef.current);
    setAvatarPose(pose);
    avatarPoseTimerRef.current = setTimeout(() => {
      setAvatarPose('idle');
      avatarPoseTimerRef.current = null;
    }, pose === 'miss' ? 320 : 420);
  }, []);

  /** Efek benturan anime-style di arena (tap kena / miss) */
  const spawnImpact = useCallback((clientX: number, clientY: number, kind: 'hit' | 'miss') => {
    const arena = arenaRef.current;
    const layer = impactLayerRef.current;
    if (!arena || !layer) return;
    const r = arena.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const x = ((clientX - r.left) / r.width) * 100;
    const y = ((clientY - r.top) / r.height) * 100;
    const el = document.createElement('span');
    el.className = `tap-impact ${kind === 'hit' ? 'is-hit' : 'is-miss'}`;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.innerHTML =
      '<i class="tap-impact-core"></i>' +
      '<i class="tap-impact-ring"></i>' +
      '<i class="tap-impact-ring delay"></i>' +
      '<i class="tap-impact-spark s1"></i>' +
      '<i class="tap-impact-spark s2"></i>' +
      '<i class="tap-impact-spark s3"></i>' +
      '<i class="tap-impact-spark s4"></i>';
    layer.appendChild(el);
    while (layer.childElementCount > 8) {
      layer.removeChild(layer.firstElementChild as Node);
    }
    window.setTimeout(() => {
      if (el.parentNode === layer) layer.removeChild(el);
    }, 480);
  }, []);

  const handleNumberTap = useCallback(
    (num: FloatingNumber) => {
      if (state.status !== 'playing' || num.sliced) return;
      if (!state.question) return;
      // countdown selesai dulu baru boleh aksi

      // Avatar + efek benturan di posisi bola
      pulseAvatar(num.isBomb ? 'miss' : 'attack');
      if (mode === 'tap' && arenaRef.current) {
        const btn = arenaRef.current.querySelector(
          `[data-num-id="${num.id}"]`
        ) as HTMLElement | null;
        if (btn) {
          const br = btn.getBoundingClientRect();
          spawnImpact(br.left + br.width / 2, br.top + br.height / 2, num.isBomb ? 'miss' : 'hit');
        }
      }

      setState((prev) => {
        if (!prev.question) return prev;

        // Bom → nyawa −1, bom hilang, SEMUA bola non-bom yang sempat hilang MUNCUL LANGSUNG
        if (num.isBomb) {
          mistakesRef.current += 1;
          questionHadMistakeRef.current = true;
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
              const base = {
                ...n,
                sliced: false,
                id: `restored-${token}-${n.value}-${Math.random().toString(36).slice(2, 6)}`,
              };
              if (arenaStyle === 'pass') {
                const nb = spawnPassBall(
                  n.value,
                  false,
                  mode === 'tap' ? 0.7 : 1
                );
                return { ...base, ...nb, id: base.id, sliced: false };
              }
              return base;
            }
            return n;
          });
          const newLives = prev.lives - 1;
          if (newLives <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            clearNextQuestionTimeout();
            stopAllMusic();
            playEndSound(prev.score, targetScore);
            const grade = calcGrade(
              prev.score,
              prev.questionsSolved,
              prev.maxCombo,
              {
                targetScore,
                isAdventure: typeof targetScore === 'number' && targetScore > 0,
              }
            );
            const finalScore = prev.score;
            const finalCombo = prev.maxCombo;
            const finalSolved = prev.questionsSolved;
            queueMicrotask(() => {
              onFinish(finalScore, grade, {
                maxCombo: finalCombo,
                perfect: mistakesRef.current === 0 && finalSolved > 0,
              });
            });
            return {
              ...prev,
              lives: 0,
              combo: 0,
              status: 'lost' as const,
              numbers: updated.length ? updated : prev.numbers,
              selectedIds: [],
              selectedValues: [],
            };
          }
          return {
            ...prev,
            lives: newLives,
            combo: 0,
            numbers: updated,
            selectedIds: [],
            selectedValues: [],
            question: prev.question,
          };
        }

        // Simpan NILAI. Bola ditandai sliced → tidak dirender / tidak tabrakan
        // (tetap di data supaya kalau salah bisa muncul lagi di posisi yang tepat).
        const newSelectedIds = [...prev.selectedIds, num.id];
        const newSelectedValues = [...(prev.selectedValues || []), num.value];
        const updatedNumbers = prev.numbers.map((n) =>
          n.id === num.id ? { ...n, sliced: true } : n
        );
        const needed = getNeededCount(prev.question);

        // Belum cukup angka → tunggu klik berikutnya
        if (newSelectedValues.length < needed) {
          if (mode === 'slice') sfx.slash();
          else sfx.tap();
          return {
            ...prev,
            numbers: updatedNumbers,
            selectedIds: newSelectedIds,
            selectedValues: newSelectedValues,
          };
        }

        const selectedValues = newSelectedValues;
        // Cek jawaban
        if (isValidSelection(prev.question, selectedValues)) {
          const newCombo = prev.combo + 1;
          const elapsedMs = performance.now() - questionShownAtRef.current;
          const fastSolve =
            !questionHadMistakeRef.current &&
            elapsedMs > 0 &&
            elapsedMs < 1000;
          const points = computeSolvePoints({
            combo: newCombo,
            agility: isMoving,
            tempoId: tempoIdRef.current,
            levelId: levelIdRef.current,
            forceOps: forceOpsRef.current,
            fastSolve,
            inputMode: mode,
          });
          if (mode === 'slice') sfx.slash();
          if (newCombo > 1) sfx.combo();
          else sfx.correct();
          const bonus = timeBonusSec > 0 ? timeBonusSec : 0;
          const solved = prev.questionsSolved + 1;
          const next: GameState = {
            ...prev,
            score: prev.score + points,
            combo: newCombo,
            maxCombo: Math.max(prev.maxCombo, newCombo),
            questionsSolved: solved,
            timeLeft:
              isSprint
                ? prev.timeLeft
                : bonus > 0
                  ? prev.timeLeft + bonus
                  : prev.timeLeft,
            numbers: updatedNumbers,
            selectedIds: newSelectedIds,
            selectedValues: newSelectedValues,
          };
          clearNextQuestionTimeout();
          if (isSprint && solved >= sprintGoal) {
            if (timerRef.current) clearInterval(timerRef.current);
            stopAllMusic();
            playEndSound(next.score, targetScore);
            const sprintMs = Math.round(
              performance.now() - sprintStartedAtRef.current
            );
            const grade = calcGrade(next.score, solved, next.maxCombo, {});
            setTimeout(
              () =>
                onFinish(next.score, grade, {
                  maxCombo: next.maxCombo,
                  perfect: mistakesRef.current === 0 && solved > 0,
                  sprintMs,
                  sessionKind: 'sprint',
                  sprintLength: sprintGoal,
                }),
              100
            );
            return { ...next, status: 'won' };
          }
          nextQuestionTimeoutRef.current = setTimeout(() => {
            nextQuestionTimeoutRef.current = null;
            setState((p) => spawnNextQuestion(p));
          }, 350);
          return next;
        }

        // Salah → nyawa −1, bola muncul lagi, SOAL TETAP; tempo Berani: −waktu
        mistakesRef.current += 1;
          questionHadMistakeRef.current = true;
        sfx.wrong();
        let withTime = prev;
        if (timePenaltySec > 0) {
          const newTime = Math.max(0, prev.timeLeft - timePenaltySec);
          if (newTime <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            clearNextQuestionTimeout();
            stopAllMusic();
            playEndSound(prev.score, targetScore);
            const grade = calcGrade(
          prev.score,
          prev.questionsSolved,
          prev.maxCombo,
          {
            targetScore,
            isAdventure: typeof targetScore === 'number' && targetScore > 0,
          }
        );
            setTimeout(
              () =>
                onFinish(prev.score, grade, {
                  maxCombo: prev.maxCombo,
                  perfect:
                    mistakesRef.current === 0 && prev.questionsSolved > 0,
                }),
              100
            );
            return {
              ...prev,
              timeLeft: 0,
              status: 'won' as const,
              numbers: updatedNumbers,
              selectedIds: [],
              selectedValues: [],
            };
          }
          withTime = { ...prev, timeLeft: newTime };
        }
        return loseLife(withTime, updatedNumbers, newSelectedIds);
      });
    },
    [
      state.status,
      loseLife,
      spawnNextQuestion,
      clearNextQuestionTimeout,
      onFinish,
      timeBonusSec,
      timePenaltySec,
      mode,
      targetScore,
      pulseAvatar,
      spawnImpact,
      isSprint,
      sprintGoal,
      isMoving,
      arenaStyle,
    ]
  );


  // Mode Pantul (bounce) + Lewat (pass)
  useEffect(() => {
    if (!isMoving || state.status !== 'playing') return;

    let raf = 0;
    let last = performance.now();
    // Margin ~5%: bola pantul sampai dekat tepi arena (bukan “tembok” di 12/88)
    const xMin = 5;
    const xMax = 95;
    const yMin = 8;
    const yMax = 90;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      setState((prev) => {
        if (prev.status !== 'playing' || !prev.question) return prev;
        if (arenaStyle === 'pass') {
          // Gerak hanya bola aktif; sliced tetap di data (posisi terakhir) tapi tidak gerak
          let numbers = prev.numbers.map((n) => {
            if (n.sliced) return n;
            const vx = n.vx ?? 0;
            const vy = n.vy ?? 0;
            // Lewat: tidak pantul tepi — biar keluar layar, lalu di-respawn jika perlu
            return {
              ...n,
              x: n.x + vx * dt,
              y: n.y + vy * dt,
              vx,
              vy,
            };
          });
          // Benturan antar bola aktif saja
          // Collision pixel-space (bola ~54px)
          const aw = arenaRef.current?.clientWidth || 360;
          const ah = arenaRef.current?.clientHeight || 400;
          const minDistPx = 54 * 0.98;
          const liveIdx = numbers
            .map((n, i) => (!n.sliced ? i : -1))
            .filter((i) => i >= 0);
          for (let ii = 0; ii < liveIdx.length; ii++) {
            for (let jj = ii + 1; jj < liveIdx.length; jj++) {
              const i = liveIdx[ii];
              const j = liveIdx[jj];
              const a = numbers[i];
              const b = numbers[j];
              const ax = (a.x / 100) * aw;
              const ay = (a.y / 100) * ah;
              const bx = (b.x / 100) * aw;
              const by = (b.y / 100) * ah;
              let dx = bx - ax;
              let dy = by - ay;
              let dist = Math.hypot(dx, dy);
              if (dist < 0.01) {
                dx = 0.01;
                dy = 0;
                dist = 0.01;
              }
              if (dist >= minDistPx) continue;
              const nx = dx / dist;
              const ny = dy / dist;
              const overlapPx = (minDistPx - dist) / 2 + 0.5;
              a.x -= (nx * overlapPx / aw) * 100;
              a.y -= (ny * overlapPx / ah) * 100;
              b.x += (nx * overlapPx / aw) * 100;
              b.y += (ny * overlapPx / ah) * 100;
              const avx = a.vx ?? 0;
              const avy = a.vy ?? 0;
              const bvx = b.vx ?? 0;
              const bvy = b.vy ?? 0;
              const va = avx * nx + avy * ny;
              const vb = bvx * nx + bvy * ny;
              const dv = va - vb;
              a.vx = avx - dv * nx;
              a.vy = avy - dv * ny;
              b.vx = bvx + dv * nx;
              b.vy = bvy + dv * ny;
              numbers[i] = { ...a };
              numbers[j] = { ...b };
            }
          }
          // Buang yang lewat tepi (4 sisi). Sliced tetap (untuk restore salah).
          numbers = numbers.filter(
            (n) =>
              n.sliced ||
              (n.x > -18 && n.x < 118 && n.y > -18 && n.y < 118)
          );
          // Isi ulang: selalu ada jalur jawaban + min ~5–8 bola (bukan 1 bola sendirian)
          const scale = mode === 'tap' ? 0.7 : 1;
          numbers = ensurePassPopulation(
            prev.question,
            numbers,
            prev.selectedValues || [],
            scale
          );
          return { ...prev, numbers };
        }

        // agility bounce: dinding + tabrakan antar bola (tidak nembus)
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
        // Tabrakan pixel-space (bola agility 64px) — selaras visual
        const aw = arenaRef.current?.clientWidth || 360;
        const ah = arenaRef.current?.clientHeight || 400;
        const minDistPx = 64 * 0.98;
        const liveIdx = numbers
          .map((n, i) => (!n.sliced ? i : -1))
          .filter((i) => i >= 0);
        for (let ii = 0; ii < liveIdx.length; ii++) {
          for (let jj = ii + 1; jj < liveIdx.length; jj++) {
            const i = liveIdx[ii];
            const j = liveIdx[jj];
            const a = { ...numbers[i] };
            const b = { ...numbers[j] };
            const ax = (a.x / 100) * aw;
            const ay = (a.y / 100) * ah;
            const bx = (b.x / 100) * aw;
            const by = (b.y / 100) * ah;
            let dx = bx - ax;
            let dy = by - ay;
            let dist = Math.hypot(dx, dy);
            if (dist < 0.01) {
              dx = 0.01;
              dy = 0;
              dist = 0.01;
            }
            if (dist >= minDistPx) continue;
            changed = true;
            const nx = dx / dist;
            const ny = dy / dist;
            const overlapPx = (minDistPx - dist) / 2 + 0.5;
            a.x -= (nx * overlapPx / aw) * 100;
            a.y -= (ny * overlapPx / ah) * 100;
            b.x += (nx * overlapPx / aw) * 100;
            b.y += (ny * overlapPx / ah) * 100;
            a.x = Math.max(xMin, Math.min(xMax, a.x));
            a.y = Math.max(yMin, Math.min(yMax, a.y));
            b.x = Math.max(xMin, Math.min(xMax, b.x));
            b.y = Math.max(yMin, Math.min(yMax, b.y));
            // Kecepatan di px/s supaya pantul selaras sumbu X/Y arena
            const avxPx = ((a.vx ?? 0) / 100) * aw;
            const avyPx = ((a.vy ?? 0) / 100) * ah;
            const bvxPx = ((b.vx ?? 0) / 100) * aw;
            const bvyPx = ((b.vy ?? 0) / 100) * ah;
            const va = avxPx * nx + avyPx * ny;
            const vb = bvxPx * nx + bvyPx * ny;
            if (va - vb > 0) {
              const dv = va - vb;
              const navx = avxPx - dv * nx;
              const navy = avyPx - dv * ny;
              const nbvx = bvxPx + dv * nx;
              const nbvy = bvyPx + dv * ny;
              a.vx = (navx / aw) * 100;
              a.vy = (navy / ah) * 100;
              b.vx = (nbvx / aw) * 100;
              b.vy = (nbvy / ah) * 100;
            }
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
  }, [isMoving, arenaStyle, state.status, mode]);


  const hearts = Array.from({ length: INITIAL_LIVES }, (_, i) =>
    i < state.lives ? '❤️' : '🖤'
  );

  // Angka yang sudah dipilih (disimpan terpisah dari bola visual)
  const selectedValues = state.selectedValues || [];
  const displayText = state.question
    ? fillDisplay(state.question.display, selectedValues)
    : '...';

  // Flash kotak soal saat jenis operasi berganti (mata "reset")
  useEffect(() => {
    const op = state.question?.operation;
    if (!op || state.status !== 'playing') return;
    if (prevOpRef.current != null && prevOpRef.current !== op) {
      setOpFlash(true);
      const tid = window.setTimeout(() => setOpFlash(false), 380);
      prevOpRef.current = op;
      return () => window.clearTimeout(tid);
    }
    prevOpRef.current = op;
  }, [state.question?.operation, state.question?.display, state.status]);

  const levelLabel = getLevelById(level).labelId;
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
    if (state.status !== 'playing') return;
    // Tap mode: ketuk area kosong → efek “nonjok miss” + avatar
    if (mode === 'tap') {
      // Kalau target adalah bola, event sudah di-stop di tombol bola
      e.preventDefault();
      pulseAvatar('miss');
      spawnImpact(e.clientX, e.clientY, 'miss');
      sfx.tap();
      return;
    }
    if (mode !== 'slice') return;
    // Slice: mulai drag — jejak tetap mengalir meski belum kena bola
    e.preventDefault();
    isSlicingRef.current = true;
    slicedThisGestureRef.current = new Set();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    handleSliceMove(e.clientX, e.clientY);
    // titik awal jejak
    const arena = arenaRef.current;
    const layer = trailLayerRef.current;
    if (arena && layer) {
      const r = arena.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      const dot = document.createElement('span');
      dot.className = 'slice-trail-dot';
      dot.style.left = `${x}%`;
      dot.style.top = `${y}%`;
      layer.appendChild(dot);
      window.setTimeout(() => {
        if (dot.parentNode === layer) layer.removeChild(dot);
      }, 360);
    }
  };

  const onArenaPointerMove = (e: React.PointerEvent) => {
    if (mode !== 'slice' || !isSlicingRef.current) return;
    handleSliceMove(e.clientX, e.clientY);
    // Throttle ~60fps + tulis DOM langsung (hindari re-render React)
    const now = performance.now();
    if (now - lastTrailTsRef.current < 16) return;
    lastTrailTsRef.current = now;
    const arena = arenaRef.current;
    const layer = trailLayerRef.current;
    if (!arena || !layer) return;
    const r = arena.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    const dot = document.createElement('span');
    dot.className = 'slice-trail-dot';
    dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
    layer.appendChild(dot);
    // Batasi jumlah node
    while (layer.childElementCount > 16) {
      layer.removeChild(layer.firstElementChild as Node);
    }
    window.setTimeout(() => {
      if (dot.parentNode === layer) layer.removeChild(dot);
    }, 360);
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
        {/* HUD kompak 1 baris: avatar+info kiri | timer tengah | skor+keluar kanan */}
        <div className="game-hud">
          <div className="hud-left">
            <div className="hud-identity">
              {character?.imageSrc || character?.imageCloseSrc ? (
                <img
                  src={character.imageSrc || character.imageCloseSrc}
                  alt=""
                  className={`hud-avatar hud-avatar-full pose-${avatarPose} style-${attackStyle}`}
                  width={72}
                  height={90}
                />
              ) : (
                <span
                  className={`hud-avatar-emoji pose-${avatarPose} style-${attackStyle}`}
                  aria-hidden
                >
                  {character?.emoji ?? '🥋'}
                </span>
              )}
              <div className="hud-identity-text">
                <strong className="hud-name">{displayName}</strong>
                <span className="hud-meta">
                  {mode === 'slice' ? t('modeSlice') : t('modeTap')}
                  {arenaStyle === 'pass'
                    ? ` · ${t('modePass')}`
                    : arenaStyle === 'agility'
                      ? ` · ${t('modeAgility')}`
                      : ` · ${t('modeStatic')}`}
                </span>
                <span className="hud-lives-row">
                  <span className="hud-lives">{hearts.join('')}</span>
                  <span className="hud-context">
                    {cityName ? cityName : levelLabel}
                    {timePenaltySec > 0 ? ` · salah −${timePenaltySec}s` : ''}
                    {timeBonusSec > 0 ? ` · +${timeBonusSec}s` : ''}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="hud-center">
            {isSprint ? (
              <span className="hud-sprint-progress hud-sprint-center" aria-live="polite">
                {state.questionsSolved}/{sprintGoal}
              </span>
            ) : (
              <span className="hud-timer">{state.timeLeft}s</span>
            )}
          </div>
          <div className="hud-right">
            {/* Baris 1: Keluar + Suara bersebelahan */}
            <div className="hud-right-row hud-right-actions">
              <button type="button" className="btn-exit-top" onClick={onExit}>
                {t('exit')}
              </button>
              <button
                type="button"
                className={`btn-mute-hud ${soundMuted ? 'is-muted' : ''}`}
                onClick={toggleMute}
                aria-label={soundMuted ? t('muteOn') : t('muteOff')}
                title={soundMuted ? t('muteTitleOff') : t('muteTitleOn')}
              >
                {soundMuted ? '🔇' : '🔊'}
              </button>
            </div>
            {/* Sprint: waktu di kanan (goal = tercepat). Grade: skor + combo */}
            {isSprint ? (
              <div className="hud-right-row hud-right-score">
                <span className="hud-score hud-sprint-time" aria-live="polite">
                  {state.timeLeft}s
                </span>
              </div>
            ) : (
              <div className="hud-right-row hud-right-score">
                <span className="hud-score">{state.score}</span>
                {state.combo >= 2 && (
                  <span className="hud-combo" aria-live="polite">
                    {t('comboInline').replace('{n}', String(state.combo))}
                  </span>
                )}
              </div>
            )}
            {/* Baris 3: target kota (petualangan) */}
            {!isSprint && cityName && typeof targetScore === 'number' && (
              <div className="hud-target" title={cityName}>
                ≥{targetScore}
              </div>
            )}
          </div>
        </div>

        <div className={`game-question ${opFlash ? 'op-flash' : ''}`}>
          {state.question?.operation && (
            <span
              className={`op-chip op-chip-${state.question.operation}`}
              aria-label={opChipLabel(state.question.operation)}
            >
              {opChipLabel(state.question.operation)}
            </span>
          )}
          <p className="question-text">
            {state.question
              ? renderQuestionParts(displayText, state.question.operation)
              : displayText}
          </p>
        </div>

        <div
          className={`game-arena city-bg ${!resolvedBgUrl && bgReady ? 'game-arena-plain' : ''} ${mode === 'slice' ? 'slice-mode' : ''} ${isMoving ? 'agility-mode' : ''} ${arenaStyle === 'pass' ? 'pass-mode' : ''}`}
          data-city={cityId || 'default'}
          style={{
            /* Tunggu probe OK — jangan tampil dojo/broken sebentar */
            backgroundImage:
              bgReady && resolvedBgUrl
                ? `linear-gradient(color-mix(in srgb, var(--color-bg) 12%, transparent), color-mix(in srgb, var(--color-bg) 18%, transparent)), url(${resolvedBgUrl})`
                : undefined,
            backgroundColor: 'var(--color-bg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
          }}
          ref={arenaRef}
          onPointerDown={onArenaPointerDown}
          onPointerMove={onArenaPointerMove}
          onPointerUp={onArenaPointerUp}
          onPointerCancel={onArenaPointerUp}
        >
          {state.status === 'countdown' && (
            <div className="countdown-overlay" aria-live="polite">
              {showVolumeHint && (
                <p className="volume-hint">{t('volumeHint')}</p>
              )}
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

          {state.status === 'paused' && bgPaused && (
            <div className="countdown-overlay pause-overlay" onClick={resumeFromBgPause} role="button" tabIndex={0}>
              <div className="countdown-label is-ready">{t('pausedTitle')}</div>
              <p className="pause-hint">{t('pausedHint')}</p>
            </div>
          )}

          {(state.status === 'lost' || state.status === 'won') && (
            <div className="countdown-overlay end-overlay" aria-live="polite">
              <span className="countdown-text is-ready">
                {state.status === 'won' ? '✓' : t('timeUp') || 'TIME UP'}
              </span>
              <p className="pause-hint">
                {state.score} · {state.questionsSolved}
                {isSprint ? `/${sprintGoal}` : ''}
              </p>
            </div>
          )}

          <div
            ref={trailLayerRef}
            className="slice-trail-layer"
            aria-hidden
          />
          <div
            ref={impactLayerRef}
            className="tap-impact-layer"
            aria-hidden
          />
          {state.combo >= 2 && state.status === 'playing' && !isSprint && (
            <div className="combo-float" key={`c-${state.combo}-${state.questionsSolved}`} aria-hidden>
              {t('comboInline').replace('{n}', String(state.combo))}
            </div>
          )}
          {state.numbers.map((num, index) => {
            // Sudah dipilih: tidak dirender = hilang visual + tembus (slice/pantul)
            if (num.sliced) return null;
            return (
              <button
                type="button"
                key={num.id}
                data-num-id={num.id}
                className={`floating-number ${num.isBomb ? 'is-bomb' : ''}`}
                style={{
                  left: `${num.x}%`,
                  top: `${num.y}%`,
                  opacity: 1,
                  zIndex: index + 1,
                }}
                onPointerDown={(e) => {
                  if (mode !== 'tap') return;
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

        {/* Bar tipis portrait: isi ruang (arena lebih pendek) — tanpa link */}
        <div className="game-chrome-footer" aria-hidden="true">
          <span className="game-chrome-copy">© Lim Edmon 2026</span>
        </div>
      </div>
    </div>
  );
}
