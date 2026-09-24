/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Level kesulitan Kungfu Math
 * Label UI: umum & aman (Pemula → Master)
 * Isi soal: mengikuti capaian matematika Kurikulum Merdeka (di balik layar)
 */

export type DifficultyLevel =
  | 'pemula'
  | 'dasar'
  | 'menengah'
  | 'mahir'
  | 'master';

export interface LevelConfig {
  id: DifficultyLevel;
  labelId: string;
  labelEn: string;
  /** Deskripsi singkat untuk orang tua */
  descId: string;
  /** Angka 1–5 untuk generator */
  difficulty: number;
  /** Operasi yang diizinkan */
  operations: Array<'add' | 'sub' | 'mul' | 'div'>;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 'pemula',
    labelId: 'Pemula',
    labelEn: 'Beginner',
    descId: 'Penjumlahan kecil (setara TK–SD 1)',
    difficulty: 1,
    operations: ['add'],
  },
  {
    id: 'dasar',
    labelId: 'Dasar',
    labelEn: 'Basic',
    descId: 'Penjumlahan & pengurangan (SD 1–2)',
    difficulty: 2,
    operations: ['add', 'sub'],
  },
  {
    id: 'menengah',
    labelId: 'Menengah',
    labelEn: 'Intermediate',
    descId: 'Perkalian & pembagian dasar (SD 3–4)',
    difficulty: 3,
    operations: ['add', 'sub', 'mul', 'div'],
  },
  {
    id: 'mahir',
    labelId: 'Mahir',
    labelEn: 'Advanced',
    descId: 'Campuran & angka lebih besar (SD 5–6)',
    difficulty: 4,
    operations: ['add', 'sub', 'mul', 'div'],
  },
  {
    id: 'master',
    labelId: 'Master',
    labelEn: 'Master',
    descId: 'Tantangan cepat (SMP & dewasa)',
    difficulty: 5,
    operations: ['add', 'sub', 'mul', 'div'],
  },
];

export function getLevelById(id: DifficultyLevel): LevelConfig {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}
