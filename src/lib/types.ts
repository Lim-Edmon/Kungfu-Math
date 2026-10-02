/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/** Tipe data utama untuk Kungfu Math */

export type InputMode = 'slice' | 'tap';

/** Diam = bola statis; agility = bola bergerak (mantul) */
export type ArenaStyle = 'static' | 'agility';

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
  /** Diam / Ketangkasan */
  arena: ArenaStyle;
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
}

export const DEFAULT_PROGRESS: PlayerProgress = {
  highScores: {},
  highScoreRecords: {},
  unlockedStages: [1, 2, 3, 4, 5],
  preferredMode: 'slice',
  preferredArena: 'static',
  preferredCharacter: 'yu-jin',
  preferredLevel: 'pemula',
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
};
