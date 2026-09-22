/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/** Tipe data utama untuk Kungfu Math */

export type InputMode = 'slice' | 'tap';

/** Diam = bola statis; agility = bola bergerak (mantul) */
export type ArenaStyle = 'static' | 'agility';

export type DisplayMode = 'siang' | 'malam' | 'nyaman';

export type CharacterId =
  | 'hong-yi'
  | 'ming-zhe'
  | 'ling-yun'
  | 'an-ning'
  | 'zhi-xing'
  | 'qing-lan';

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
  /** Path gambar chibi di public/ (svg/png) */
  imageSrc: string;
}

export interface PlayerProgress {
  highScores: Record<string, number>;
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
  /** Nama panggilan pemain (muncul di game) */
  playerName: string;
}

export const DEFAULT_PROGRESS: PlayerProgress = {
  highScores: {},
  unlockedStages: [1, 2, 3, 4, 5],
  preferredMode: 'slice',
  preferredArena: 'static',
  preferredCharacter: 'hong-yi',
  preferredLevel: 'pemula',
  displayMode: 'siang',
  isSubscribed: false,
  soundMuted: false,
  totalGamesPlayed: 0,
  language: 'id',
  playerName: '',
};
