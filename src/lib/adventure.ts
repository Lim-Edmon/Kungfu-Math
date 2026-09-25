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
  /** 2–3 fakta ringan untuk anak, diacak saat lolos kota */
  funFacts: string[];
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
    funFacts: [
      'Tahukah kamu? Monas tingginya 132 meter — kira-kira setinggi 44 lantai!',
      'Jakarta dulu pernah disebut Batavia pada zaman kolonial.',
      'Di Jakarta ada banyak sungai; dulu kota ini dikenal sebagai “kota air”.',
    ],
    mapX: 76.9,
    mapY: 58.4,
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
    funFacts: [
      'Tahukah kamu? Bandung sering disebut Kota Kembang karena banyak taman dan bunga.',
      'Gedung Sate punya ornamen yang mirip tusuk sate di puncaknya.',
      'Udara Bandung terasa lebih sejuk karena kota ini di dataran tinggi.',
    ],
    mapX: 77.23,
    mapY: 58.7,
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
    funFacts: [
      'Tahukah kamu? Tugu Yogya jadi titik nol kilometer kota Yogyakarta.',
      'Yogyakarta punya keraton yang masih aktif sebagai pusat budaya.',
      'Malioboro adalah jalan legendaris untuk jalan-jalan dan oleh-oleh.',
    ],
    mapX: 78.2,
    mapY: 59.6,
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
    funFacts: [
      'Tahukah kamu? Nama Surabaya diambil dari legenda hiu (sura) dan buaya (baya).',
      'Surabaya disebut Kota Pahlawan karena peran pentingnya dalam sejarah.',
      'Pelabuhan di Surabaya termasuk yang tersibuk di Indonesia.',
    ],
    mapX: 78.43,
    mapY: 58.85,
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
    funFacts: [
      'Tahukah kamu? Medan adalah kota terbesar di pulau Sumatera.',
      'Istana Maimun di Medan punya gaya arsitektur yang memadukan beberapa budaya.',
      'Medan terkenal dengan kuliner yang berani dan kaya rasa.',
    ],
    mapX: 74.84,
    mapY: 51.26,
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
    funFacts: [
      'Tahukah kamu? Pantai Losari jadi tempat favorit menikmati matahari terbenam.',
      'Makassar dikenal dengan perahu pinisi yang legendaris.',
      'Fort Rotterdam adalah benteng tua yang masih bisa dikunjungi.',
    ],
    mapX: 80.36,
    mapY: 57.53,
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
    funFacts: [
      'Tahukah kamu? Bali punya banyak pura di tepi laut dan tebing.',
      'Perahu jukung sering terlihat di pantai-pantai Bali.',
      'Bali dikenal dunia karena alam dan budayanya yang khas.',
    ],
    mapX: 79.24,
    mapY: 60.05,
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
    funFacts: [
      'Tahukah kamu? Melaka dulu menjadi pelabuhan dagang penting di Asia Tenggara.',
      'Bangunan merah Stadthuys jadi ikon kota tua Melaka.',
      'Sungai Melaka membelah kawasan bersejarah kota ini.',
    ],
    mapX: 75.79,
    mapY: 52.26,
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
    funFacts: [
      'Tahukah kamu? George Town di Penang penuh mural dan rumah berwarna-warni.',
      'Penang terkenal dengan makanan jalanan yang enak-enak.',
      'Banyak bangunan tua di Penang dilindungi sebagai warisan budaya.',
    ],
    mapX: 75.28,
    mapY: 49.96,
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
    funFacts: [
      'Tahukah kamu? Menara kembar Petronas sempat jadi yang tertinggi di dunia.',
      'Kuala Lumpur sering disingkat KL.',
      'Di KL ada taman dan danau di dekat menara Petronas.',
    ],
    mapX: 75.64,
    mapY: 51.58,
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
    funFacts: [
      'Tahukah kamu? Merlion adalah maskot Singapura: kepala singa, badan ikan.',
      'Marina Bay Sands bentuknya seperti kapal di atas tiga gedung.',
      'Singapura sangat hijau meski kotanya modern dan padat.',
    ],
    mapX: 76.21,
    mapY: 52.87,
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


/** Ambil 1 fun fact acak untuk kota (saat lolos). */
export function pickCityFunFact(cityId: string): string | null {
  const city = getCityById(cityId);
  const list = city.funFacts;
  if (!list?.length) return null;
  return list[Math.floor(Math.random() * list.length)] ?? null;
}
