/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Mode Petualangan — jalur MVP:
 * Jakarta → … → Bali → Malaysia → Singapore
 *
 * Asset opsional (ganti file saja, nama = id kota):
 *   public/cities/bg/{id}.webp   (atau .png / .jpg)
 *   public/cities/music/{id}.mp3
 */

export interface AdventureCity {
  id: string;
  nameId: string;
  nameEn: string;
  countryId: string;
  /** Cluster kawasan, e.g. sea = Asia Tenggara */
  regionId: string;
  theme: string;
  /** Skor minimum agar kota berikutnya terbuka */
  targetScore: number;
  blurbId: string;
  landmarkId: string;
  /** Posisi pin ABSOLUT di gambar world.webp (0–100 % lebar/tinggi gambar penuh, bukan relatif zoom) */
  mapX: number;
  mapY: number;
}

export interface AdventureDifficulty {
  id: string;
  labelId: string;
  timeBonus: number;
  descId: string;
}

export const ADVENTURE_REGIONS: { id: string; labelId: string }[] = [
  { id: 'sea', labelId: 'Asia Tenggara' },
  // nanti: asia-timur, eropa, dll.
];

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

/** Jakarta 500, tiap kota berikutnya +50 */
export const ADVENTURE_CITIES: AdventureCity[] = [
  {
    id: 'jakarta',
    nameId: 'Jakarta',
    nameEn: 'Jakarta',
    countryId: 'id',
    regionId: 'sea',
    theme: 'jakarta',
    targetScore: 500,
    blurbId: 'Ibukota — mulai petualangan',
    landmarkId: 'Monas',
    mapX: 80.35,
    mapY: 53.9,
  },
  {
    id: 'bandung',
    nameId: 'Bandung',
    nameEn: 'Bandung',
    countryId: 'id',
    regionId: 'sea',
    theme: 'bandung',
    targetScore: 550,
    blurbId: 'Kota kembang di pegunungan',
    landmarkId: 'Gedung Sate',
    mapX: 80.68,
    mapY: 54.46,
  },
  {
    id: 'yogyakarta',
    nameId: 'Yogyakarta',
    nameEn: 'Yogyakarta',
    countryId: 'id',
    regionId: 'sea',
    theme: 'yogyakarta',
    targetScore: 600,
    blurbId: 'Kota budaya & Malioboro',
    landmarkId: 'Tugu Yogya',
    mapX: 81.89,
    mapY: 55.16,
  },
  {
    id: 'surabaya',
    nameId: 'Surabaya',
    nameEn: 'Surabaya',
    countryId: 'id',
    regionId: 'sea',
    theme: 'surabaya',
    targetScore: 650,
    blurbId: 'Kota pahlawan & pelabuhan',
    landmarkId: 'Tugu Pahlawan',
    mapX: 82.93,
    mapY: 54.73,
  },
  {
    id: 'medan',
    nameId: 'Medan',
    nameEn: 'Medan',
    countryId: 'id',
    regionId: 'sea',
    theme: 'medan',
    targetScore: 700,
    blurbId: 'Gerbang Sumatera',
    landmarkId: 'Masjid Raya',
    mapX: 76.77,
    mapY: 46.22,
  },
  {
    id: 'makassar',
    nameId: 'Makassar',
    nameEn: 'Makassar',
    countryId: 'id',
    regionId: 'sea',
    theme: 'makassar',
    targetScore: 750,
    blurbId: 'Pantai Losari',
    landmarkId: 'Losari',
    mapX: 85.86,
    mapY: 53.08,
  },
  {
    id: 'bali',
    nameId: 'Bali',
    nameEn: 'Bali',
    countryId: 'id',
    regionId: 'sea',
    theme: 'bali',
    targetScore: 800,
    blurbId: 'Pulau yang dikenal dunia',
    landmarkId: 'Pura laut',
    mapX: 84.01,
    mapY: 55.84,
  },
  {
    id: 'malacca',
    nameId: 'Malacca',
    nameEn: 'Malacca',
    countryId: 'my',
    regionId: 'sea',
    theme: 'malacca',
    targetScore: 850,
    blurbId: 'Kota tua bersejarah',
    landmarkId: 'Stadthuys',
    mapX: 78.34,
    mapY: 47.32,
  },
  {
    id: 'penang',
    nameId: 'Penang',
    nameEn: 'Penang',
    countryId: 'my',
    regionId: 'sea',
    theme: 'penang',
    targetScore: 900,
    blurbId: 'George Town penuh warna',
    landmarkId: 'Street art',
    mapX: 77.5,
    mapY: 44.79,
  },
  {
    id: 'kuala-lumpur',
    nameId: 'Kuala Lumpur',
    nameEn: 'Kuala Lumpur',
    countryId: 'my',
    regionId: 'sea',
    theme: 'kuala-lumpur',
    targetScore: 950,
    blurbId: 'Ibukota Malaysia',
    landmarkId: 'Petronas',
    mapX: 78.09,
    mapY: 46.57,
  },
  {
    id: 'singapore',
    nameId: 'Singapore',
    nameEn: 'Singapore',
    countryId: 'sg',
    regionId: 'sea',
    theme: 'singapore',
    targetScore: 1000,
    blurbId: 'Kota modern tetangga',
    landmarkId: 'Marina Bay',
    mapX: 79.02,
    mapY: 47.98,
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

/** Path asset kota — ganti file di folder, nama = id kota */
/** Nama file = id kota, huruf kecil. Format BG: webp | png | jpg */
export function cityBgCandidates(cityId: string): string[] {
  const id = (cityId || 'default').toLowerCase();
  return [
    `/cities/bg/${id}.webp`,
    `/cities/bg/${id}.png`,
    `/cities/bg/${id}.jpg`,
    `/cities/bg/default.webp`,
    `/cities/bg/default.png`,
  ];
}

/** Musik kota: hanya .mp3, nama huruf kecil. Tidak ada → BGM default */
export function cityMusicSrc(cityId: string): string {
  const id = (cityId || '').toLowerCase();
  return `/cities/music/${id}.mp3`;
}
