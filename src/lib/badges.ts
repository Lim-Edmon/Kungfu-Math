/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Lencana & rekor ringkas (latihan + petualangan)
 */

export type BadgeId =
  | 'first_play'
  | 'combo_5'
  | 'combo_10'
  | 'combo_20'
  | 'combo_adv_5'
  | 'combo_adv_10'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'cities_5'
  | 'cities_14'
  | 'perfect_run'
  | 'perfect_cities_3'
  | 'region_id'
  | 'region_sea';

export interface BadgeDef {
  id: BadgeId;
  emoji: string;
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
  /** latihan | petualangan | umum */
  group: 'latihan' | 'petualangan' | 'umum';
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'first_play',
    emoji: '🥋',
    titleId: 'Langkah pertama',
    titleEn: 'First steps',
    descId: 'Selesaikan 1 permainan',
    descEn: 'Finish 1 game',
    group: 'umum',
  },
  {
    id: 'combo_5',
    emoji: '🔥',
    titleId: 'Combo 5',
    titleEn: 'Combo 5',
    descId: 'Combo ×5 tanpa salah (latihan)',
    descEn: '×5 combo without miss (practice)',
    group: 'latihan',
  },
  {
    id: 'combo_10',
    emoji: '⚡',
    titleId: 'Combo 10',
    titleEn: 'Combo 10',
    descId: 'Combo ×10 tanpa salah (latihan)',
    descEn: '×10 combo without miss (practice)',
    group: 'latihan',
  },
  {
    id: 'combo_20',
    emoji: '🌟',
    titleId: 'Combo 20',
    titleEn: 'Combo 20',
    descId: 'Combo ×20 tanpa salah (latihan)',
    descEn: '×20 combo without miss (practice)',
    group: 'latihan',
  },
  {
    id: 'combo_adv_5',
    emoji: '🗺️',
    titleId: 'Combo petualang 5',
    titleEn: 'Adventure combo 5',
    descId: 'Combo ×5 di petualangan',
    descEn: '×5 combo in adventure',
    group: 'petualangan',
  },
  {
    id: 'combo_adv_10',
    emoji: '🏆',
    titleId: 'Combo petualang 10',
    titleEn: 'Adventure combo 10',
    descId: 'Combo ×10 di petualangan',
    descEn: '×10 combo in adventure',
    group: 'petualangan',
  },
  {
    id: 'streak_3',
    emoji: '📅',
    titleId: 'Streak 3 hari',
    titleEn: '3-day streak',
    descId: 'Main 3 hari berturut-turut',
    descEn: 'Play 3 days in a row',
    group: 'umum',
  },
  {
    id: 'streak_7',
    emoji: '💪',
    titleId: 'Streak 7 hari',
    titleEn: '7-day streak',
    descId: 'Main 7 hari berturut-turut',
    descEn: 'Play 7 days in a row',
    group: 'umum',
  },
  {
    id: 'streak_14',
    emoji: '👑',
    titleId: 'Streak 14 hari',
    titleEn: '14-day streak',
    descId: 'Main 14 hari berturut-turut',
    descEn: 'Play 14 days in a row',
    group: 'umum',
  },
  {
    id: 'cities_5',
    emoji: '🚩',
    titleId: '5 kota',
    titleEn: '5 cities',
    descId: 'Buka 5 kota di petualangan',
    descEn: 'Unlock 5 adventure cities',
    group: 'petualangan',
  },
  {
    id: 'cities_14',
    emoji: '🌏',
    titleId: '14 kota',
    titleEn: '14 cities',
    descId: 'Buka 14 kota (seluruh Indonesia jalur)',
    descEn: 'Unlock 14 cities (Indonesia path)',
    group: 'petualangan',
  },
  {
    id: 'perfect_run',
    emoji: '✨',
    titleId: 'Tanpa salah',
    titleEn: 'Perfect run',
    descId: 'Selesaikan 1 run tanpa jawaban salah',
    descEn: 'Finish a run with no wrong answers',
    group: 'umum',
  },
  {
    id: 'perfect_cities_3',
    emoji: '🎯',
    titleId: '3 kota sempurna',
    titleEn: '3 perfect cities',
    descId: 'Lolos 3 kota berturut tanpa salah',
    descEn: 'Clear 3 cities in a row with no mistakes',
    group: 'petualangan',
  },
  {
    id: 'region_id',
    emoji: '🇮🇩',
    titleId: 'Jelajah Nusantara',
    titleEn: 'Nusantara explorer',
    descId: 'Selesaikan region Indonesia (sampai Bali)',
    descEn: 'Clear Indonesia region (through Bali)',
    group: 'petualangan',
  },
  {
    id: 'region_sea',
    emoji: '🌴',
    titleId: 'Jelajah Asia Tenggara',
    titleEn: 'SEA explorer',
    descId: 'Selesaikan jalur Asia Tenggara (sampai Hanoi)',
    descEn: 'Clear Southeast Asia path (through Hanoi)',
    group: 'petualangan',
  },
];

export function getBadgeDef(id: string): BadgeDef | undefined {
  return BADGE_DEFS.find((b) => b.id === id);
}

/** Tanggal lokal YYYY-MM-DD */
export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateKey(d);
}

/**
 * Hitung streak setelah 1 sesi selesai.
 * return { streak, lastPlayDate }
 */
export function nextDailyStreak(
  lastPlayDate: string | undefined,
  currentStreak: number
): { streak: number; lastPlayDate: string } {
  const today = localDateKey();
  if (lastPlayDate === today) {
    return { streak: Math.max(1, currentStreak || 1), lastPlayDate: today };
  }
  if (lastPlayDate === yesterdayKey()) {
    return { streak: Math.max(1, (currentStreak || 0) + 1), lastPlayDate: today };
  }
  return { streak: 1, lastPlayDate: today };
}

export interface BadgeEvalInput {
  already: string[];
  totalGames: number;
  dailyStreak: number;
  maxComboPractice: number;
  maxComboAdventure: number;
  citiesUnlocked: number;
  perfectCityStreak: number;
  /** run ini sempurna */
  runPerfect: boolean;
  /** id kota terakhir yang baru diloloskan (opsional) */
  justClearedCityId?: string | null;
  /** daftar kota dengan skor >= target */
  clearedCityIds: string[];
}

export function evaluateNewBadges(input: BadgeEvalInput): BadgeId[] {
  const have = new Set(input.already);
  const unlocked: BadgeId[] = [];

  const tryAdd = (id: BadgeId, cond: boolean) => {
    if (cond && !have.has(id)) {
      unlocked.push(id);
      have.add(id);
    }
  };

  tryAdd('first_play', input.totalGames >= 1);
  tryAdd('combo_5', input.maxComboPractice >= 5);
  tryAdd('combo_10', input.maxComboPractice >= 10);
  tryAdd('combo_20', input.maxComboPractice >= 20);
  tryAdd('combo_adv_5', input.maxComboAdventure >= 5);
  tryAdd('combo_adv_10', input.maxComboAdventure >= 10);
  tryAdd('streak_3', input.dailyStreak >= 3);
  tryAdd('streak_7', input.dailyStreak >= 7);
  tryAdd('streak_14', input.dailyStreak >= 14);
  tryAdd('cities_5', input.citiesUnlocked >= 5);
  tryAdd('cities_14', input.citiesUnlocked >= 14);
  tryAdd('perfect_run', input.runPerfect);
  tryAdd('perfect_cities_3', input.perfectCityStreak >= 3);
  tryAdd('region_id', input.clearedCityIds.includes('bali'));
  tryAdd('region_sea', input.clearedCityIds.includes('hanoi'));

  return unlocked;
}
