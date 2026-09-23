/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Mode Petualangan — MVP 1
 * Jakarta → … → Bali → Malaysia → Singapore
 * Urutan negara lain: review nanti.
 */

export interface AdventureCity {
  id: string;
  nameId: string;
  nameEn: string;
  countryId: string;
  theme: string;
  /** Threshold skor untuk buka kota berikutnya (run tetap ~60 dtk) */
  targetScore: number;
  /** Detik ditambah tiap jawaban benar (default normal; difficulty override di UI nanti) */
  timeBonus: number;
  blurbId: string;
  landmarkId: string;
}

export const ADVENTURE_CITIES: AdventureCity[] = [
  {
    id: 'jakarta',
    nameId: 'Jakarta',
    nameEn: 'Jakarta',
    countryId: 'id',
    theme: 'jakarta',
    targetScore: 200,
    timeBonus: 3,
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
    timeBonus: 3,
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
    timeBonus: 3,
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
    timeBonus: 3,
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
    timeBonus: 3,
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
    timeBonus: 3,
    blurbId: 'Pantai Losari & timur Indonesia',
    landmarkId: 'Losari',
  },
  {
    id: 'bali',
    nameId: 'Bali',
    nameEn: 'Bali',
    countryId: 'id',
    theme: 'bali',
    targetScore: 500,
    timeBonus: 3,
    blurbId: 'Pulau yang paling dikenal dunia',
    landmarkId: 'Pura laut',
  },
  {
    id: 'malacca',
    nameId: 'Malacca',
    nameEn: 'Malacca',
    countryId: 'my',
    theme: 'malacca',
    targetScore: 550,
    timeBonus: 3,
    blurbId: 'Kota tua bersejarah Malaysia',
    landmarkId: 'Stadthuys',
  },
  {
    id: 'penang',
    nameId: 'Penang',
    nameEn: 'Penang',
    countryId: 'my',
    theme: 'penang',
    targetScore: 600,
    timeBonus: 3,
    blurbId: 'George Town penuh warna',
    landmarkId: 'Street art Penang',
  },
  {
    id: 'kuala-lumpur',
    nameId: 'Kuala Lumpur',
    nameEn: 'Kuala Lumpur',
    countryId: 'my',
    theme: 'kuala-lumpur',
    targetScore: 700,
    timeBonus: 3,
    blurbId: 'Ibukota Malaysia yang megah',
    landmarkId: 'Petronas',
  },
  {
    id: 'singapore',
    nameId: 'Singapore',
    nameEn: 'Singapore',
    countryId: 'sg',
    theme: 'singapore',
    targetScore: 800,
    timeBonus: 3,
    blurbId: 'Ujung MVP — kota global tetangga',
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
