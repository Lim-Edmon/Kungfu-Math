/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/** Tipe data utama untuk Kungfu Math */

export type InputMode = 'slice' | 'tap';

/** Diam / Pantul / Lewat */
export type ArenaStyle = 'static' | 'agility' | 'pass';

/** Latihan: Grade = skor 60 dtk; Sprint = waktu N soal */
export type PracticeSessionKind = 'grade' | 'sprint';
export type SprintLength = 5 | 10 | 20;

export type DisplayMode = 'siang' | 'malam' | 'nyaman';

export type CharacterId =
  | 'hong-yi'
  | 'ming-zhe'
  | 'yu-jin'
  | 'an-ning'
  | 'zhi-xing'
  | 'yo-rin';

export interface Character {
  id: CharacterId;
  name: string;
  nicknameId: string;
  nicknameEn: string;
  gender: 'male' | 'female';
  mode: InputMode;
  weapon?: string;
  style?: string;
  /** Emoji/chibi sementara — nanti diganti gambar */
  emoji: string;
  /** Warna avatar */
  color: string;
  /** Deskripsi singkat imut */
  blurbId: string;
  /** Full body — pemilihan di Home */
  imageSrc: string;
  /** Close-up — banner saat main */
  imageCloseSrc: string;
}

/** Detail rekor (siapa, kapan, kondisi main) */
export interface ScoreRecord {
  score: number;
  /** Nama pemain saat rekor tercipta */
  by: string;
  /** ISO date string */
  at: string;
  /** Slice / Tap */
  inputMode: InputMode;
  /** Diam / Pantul / Lewat */
  arena: ArenaStyle;
  /** Latihan grade vs sprint */
  sessionKind?: PracticeSessionKind;
  /** Sprint: jumlah soal (5/10) */
  sprintLength?: SprintLength;
  /** Level soal (latihan) */
  levelId?: string;
  /** Tempo petualangan (santai/ringan/normal/berani) */
  tempoId?: string;
}

export interface PlayerProgress {
  highScores: Record<string, number>;
  /** Detail rekor latihan per level — sumber kebenaran untuk Dojo */
  highScoreRecords: Record<string, ScoreRecord>;
  unlockedStages: number[];
  preferredMode: InputMode;
  preferredArena: ArenaStyle;
  preferredCharacter: CharacterId;
  preferredLevel: import('./levels').DifficultyLevel;
  /** Tempo petualangan terakhir (mudah/normal/…) */
  preferredAdventureDiff: string;
  displayMode: DisplayMode;
  isSubscribed: boolean;
  soundMuted: boolean;
  totalGamesPlayed: number;
  language: 'id' | 'en';
  /** true = user memilih manual di Pengaturan (jangan auto-overwrite) */
  languageChosen: boolean;
  /** Nama panggilan pemain (muncul di game) */
  playerName: string;
  /** Mode petualangan: kota aktif */
  adventureCityId: string;
  /** Kota yang sudah terbuka */
  adventureUnlocked: string[];
  /** Skor terbaik per kota (angka) */
  adventureHighScores: Record<string, number>;
  /** Detail rekor petualangan per kota */
  adventureScoreRecords: Record<string, ScoreRecord>;
  /** Sudah melihat tutorial first-play */
  tutorialSeen: boolean;
  /**
   * Journey pemula:
   * intro → static (dojo diam target 200) → bounce (500) → pass (500) → done
   * Pemain lama (sudah pernah main) dimigrasi ke 'done'.
   */
  onboardingPhase: 'intro' | 'static' | 'bounce' | 'pass' | 'done';
  /** Pemain lama sudah ditawari / menolak ulang journey dasar */
  onboardingRedoOfferSeen: boolean;
  /**
   * true = kunci mode longgar (pemain lama / sudah pernah selesai journey).
   * Ulang latihan dasar TIDAK mengunci Pantul/Lewat/Petualangan & TIDAK reset kota.
   */
  onboardingRelaxed: boolean;
  /**
   * Kunci cerita “pertama kali” yang sudah dirayakan
   * contoh: region:sea | mode:slice | arena:pass | session:sprint
   */
  storyFirsts: string[];
  /** Latihan: acak operasi atau fokus operasi tertentu */
  practiceOpsMode: 'random' | 'focus';
  /** Best sprint time ms keyed by `${levelId}|${len}|${arena}` */
  sprintBestMs: Record<string, number>;
  /** Operasi yang difokuskan (jika focus) */
  focusOps: Array<'add' | 'sub' | 'mul' | 'div'>;
  /** Streak harian (hari berturut main) */
  dailyStreak: number;
  /** YYYY-MM-DD lokal terakhir main */
  lastPlayDate: string;
  /** Combo max sesi latihan */
  maxComboPractice: number;
  /** Combo max sesi petualangan */
  maxComboAdventure: number;
  /** Kota diloloskan sempurna berturut (tanpa salah di run itu) */
  perfectCityStreak: number;
  /** Id lencana yang sudah didapat */
  badges: string[];
}

export const DEFAULT_PROGRESS: PlayerProgress = {
  highScores: {},
  highScoreRecords: {},
  unlockedStages: [1, 2, 3, 4, 5],
  preferredMode: 'slice',
  preferredArena: 'static',
  preferredCharacter: 'yu-jin',
  preferredLevel: 'pemula',
  preferredAdventureDiff: 'normal',
  displayMode: 'siang',
  isSubscribed: false,
  soundMuted: false,
  totalGamesPlayed: 0,
  language: 'id',
  languageChosen: false,
  playerName: '',
  adventureCityId: 'jakarta',
  adventureUnlocked: ['jakarta'],
  adventureHighScores: {},
  adventureScoreRecords: {},
  tutorialSeen: false,
  onboardingPhase: 'intro',
  onboardingRedoOfferSeen: false,
  onboardingRelaxed: false,
  storyFirsts: [],
  practiceOpsMode: 'random',
  sprintBestMs: {},
  focusOps: ['add'],
  dailyStreak: 0,
  lastPlayDate: '',
  maxComboPractice: 0,
  maxComboAdventure: 0,
  perfectCityStreak: 0,
  badges: [],
};
