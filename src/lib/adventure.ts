/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Mode Petualangan — jalur MVP:
 * Jakarta → … → Bali → Malaysia → Singapore
 */

export interface AdventureCity {
  id: string;
  nameId: string;
  nameEn: string;
  countryId: string;
  theme: string;
  /** Skor minimum agar kota berikutnya terbuka */
  targetScore: number;
  blurbId: string;
  landmarkId: string;
}

/** Tingkat sulit Petualangan = beda bonus detik tiap jawaban benar */
export interface AdventureDifficulty {
  id: string;
  labelId: string;
  timeBonus: number;
  descId: string;
}

export const ADVENTURE_DIFFICULTIES: AdventureDifficulty[] = [
  { id: 'mudah', labelId: 'Mudah', timeBonus: 5, descId: '+5 dtk tiap benar' },
  { id: 'normal', labelId: 'Normal', timeBonus: 3, descId: '+3 dtk tiap benar' },
  { id: 'sulit', labelId: 'Sulit', timeBonus: 2, descId: '+2 dtk tiap benar' },
  { id: 'master', labelId: 'Master', timeBonus: 1, descId: '+1 dtk tiap benar' },
  { id: 'extreme', labelId: 'Extreme', timeBonus: 0, descId: 'Tanpa bonus waktu' },
];

export function getAdventureDifficulty(id: string): AdventureDifficulty {
  return (
    ADVENTURE_DIFFICULTIES.find((d) => d.id === id) ?? ADVENTURE_DIFFICULTIES[1]
  );
}

export const ADVENTURE_CITIES: AdventureCity[] = [
  {
    id: 'jakarta',
    nameId: 'Jakarta',
    nameEn: 'Jakarta',
    countryId: 'id',
    theme: 'jakarta',
    targetScore: 200,
    blurbId: 'Ibukota — mulai petualangan',
    landmarkId: 'Monas',
  },
  {
    id: 'bandung',
    nameId: 'Bandung',
    nameEn: 'Bandung',
    countryId: 'id',
    theme: 'bandung',
    targetScore: 250,
    blurbId: 'Kota kembang di pegunungan',
    landmarkId: 'Gedung Sate',
  },
  {
    id: 'yogyakarta',
    nameId: 'Yogyakarta',
    nameEn: 'Yogyakarta',
    countryId: 'id',
    theme: 'yogyakarta',
    targetScore: 300,
    blurbId: 'Kota budaya & Malioboro',
    landmarkId: 'Tugu Yogya',
  },
  {
    id: 'surabaya',
    nameId: 'Surabaya',
    nameEn: 'Surabaya',
    countryId: 'id',
    theme: 'surabaya',
    targetScore: 350,
    blurbId: 'Kota pahlawan & pelabuhan',
    landmarkId: 'Tugu Pahlawan',
  },
  {
    id: 'medan',
    nameId: 'Medan',
    nameEn: 'Medan',
    countryId: 'id',
    theme: 'medan',
    targetScore: 400,
    blurbId: 'Gerbang Sumatera',
    landmarkId: 'Masjid Raya',
  },
  {
    id: 'makassar',
    nameId: 'Makassar',
    nameEn: 'Makassar',
    countryId: 'id',
    theme: 'makassar',
    targetScore: 450,
    blurbId: 'Pantai Losari',
    landmarkId: 'Losari',
  },
  {
    id: 'bali',
    nameId: 'Bali',
    nameEn: 'Bali',
    countryId: 'id',
    theme: 'bali',
    targetScore: 500,
    blurbId: 'Pulau yang dikenal dunia',
    landmarkId: 'Pura laut',
  },
  {
    id: 'malacca',
    nameId: 'Malacca',
    nameEn: 'Malacca',
    countryId: 'my',
    theme: 'malacca',
    targetScore: 550,
    blurbId: 'Kota tua bersejarah',
    landmarkId: 'Stadthuys',
  },
  {
    id: 'penang',
    nameId: 'Penang',
    nameEn: 'Penang',
    countryId: 'my',
    theme: 'penang',
    targetScore: 600,
    blurbId: 'George Town penuh warna',
    landmarkId: 'Street art',
  },
  {
    id: 'kuala-lumpur',
    nameId: 'Kuala Lumpur',
    nameEn: 'Kuala Lumpur',
    countryId: 'my',
    theme: 'kuala-lumpur',
    targetScore: 700,
    blurbId: 'Ibukota Malaysia',
    landmarkId: 'Petronas',
  },
  {
    id: 'singapore',
    nameId: 'Singapore',
    nameEn: 'Singapore',
    countryId: 'sg',
    theme: 'singapore',
    targetScore: 800,
    blurbId: 'Kota modern tetangga',
    landmarkId: 'Marina Bay',
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
