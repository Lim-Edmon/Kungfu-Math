/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Mode Petualangan — skeleton MVP
 * Kota → target skor → unlock berikutnya. Jawaban benar = bonus waktu.
 */

export interface AdventureCity {
  id: string;
  nameId: string;
  nameEn: string;
  /** Nuansa visual (CSS data-city) */
  theme: string;
  /** Skor minimum untuk buka kota berikutnya */
  targetScore: number;
  /** Detik ditambah tiap jawaban benar */
  timeBonus: number;
  blurbId: string;
}

export const ADVENTURE_CITIES: AdventureCity[] = [
  {
    id: 'shanghai',
    nameId: 'Shanghai',
    nameEn: 'Shanghai',
    theme: 'shanghai',
    targetScore: 300,
    timeBonus: 2,
    blurbId: 'Kota pelabuhan — mulai perjalananmu',
  },
  {
    id: 'beijing',
    nameId: 'Beijing',
    nameEn: 'Beijing',
    theme: 'beijing',
    targetScore: 500,
    timeBonus: 2,
    blurbId: 'Ibukota — target lebih tinggi',
  },
  {
    id: 'tokyo',
    nameId: 'Tokyo',
    nameEn: 'Tokyo',
    theme: 'tokyo',
    targetScore: 700,
    timeBonus: 3,
    blurbId: 'Sakura & ketangkasan',
  },
  {
    id: 'bangkok',
    nameId: 'Bangkok',
    nameEn: 'Bangkok',
    theme: 'bangkok',
    targetScore: 900,
    timeBonus: 3,
    blurbId: 'Kuil emas di ujung petualangan MVP',
  },
];

export function getCityById(id: string): AdventureCity {
  return ADVENTURE_CITIES.find((c) => c.id === id) ?? ADVENTURE_CITIES[0];
}

export function getNextCityId(currentId: string): string | null {
  const i = ADVENTURE_CITIES.findIndex((c) => c.id === currentId);
  if (i < 0 || i >= ADVENTURE_CITIES.length - 1) return null;
  return ADVENTURE_CITIES[i + 1].id;
}
