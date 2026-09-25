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
    blurbId: 'Landmark nasional',
    landmarkId: 'Monas',
    funFacts: [
      'Monas tingginya 132 meter — setara gedung sekitar 44 lantai.',
      'Api di puncak Monas terbuat dari perunggu berlapis emas.',
      'Kota Tua di tepi pelabuhan Sunda Kelapa masih menyimpan gudang abad ke-17.',
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
    blurbId: 'Arsitektur & dataran tinggi',
    landmarkId: 'Gedung Sate',
    funFacts: [
      'Menara Gedung Sate meniru bentuk tusuk sate — lambang Jawa Barat.',
      'Bandung menjadi tuan rumah Konferensi Asia-Afrika tahun 1955.',
      'Kawah Putih di dekat Bandung berwarna putih kehijauan karena belerang.',
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
    blurbId: 'Budaya Jawa & UNESCO',
    landmarkId: 'Tugu Yogya',
    funFacts: [
      'Borobudur (dekat Yogya) punya lebih dari 2.600 panel relief batu.',
      'Tugu Yogya adalah titik nol kilometer resmi kota.',
      'Keraton Yogyakarta masih menjalankan upacara adat Kesultanan.',
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
    blurbId: 'Sejarah kemerdekaan',
    landmarkId: 'Tugu Pahlawan',
    funFacts: [
      'Nama Surabaya dari legenda perang hiu (sura) dan buaya (baya).',
      'Pertempuran 10 November 1945 di Surabaya jadi Hari Pahlawan nasional.',
      'Jembatan Suramadu menghubungkan Surabaya dengan pulau Madura.',
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
    blurbId: 'Sejarah & alam Sumatera',
    landmarkId: 'Istana Maimun',
    funFacts: [
      'Istana Maimun memadukan gaya Melayu, Islam, dan Eropa dalam satu bangunan.',
      'Danau Toba di dekat Medan terbentuk dari letusan supervulkan ~74.000 tahun lalu.',
      'Pulau Samosir di tengah Toba hampir seluas Singapura.',
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
    blurbId: 'Bahari & benteng',
    landmarkId: 'Fort Rotterdam',
    funFacts: [
      'Perahu pinisi Bugis-Makassar diakui UNESCO sebagai warisan budaya bahari.',
      'Fort Rotterdam dibangun di atas benteng kerajaan Gowa yang lebih tua.',
      'Pantai Losari punya jalur rekreasi panjang di tepi kota menghadap selat.',
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
    blurbId: 'Budaya & lanskap pulau',
    landmarkId: 'Pura tebing',
    funFacts: [
      'Sistem irigasi sawah Subak di Bali diakui UNESCO sebagai warisan budaya dunia.',
      'Pura Uluwatu berdiri di tebing kapur tinggi menghadap Samudra Hindia.',
      'Selat Lombok di timur Bali adalah garis Wallace — pemisah fauna Asia dan Australasia.',
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
    blurbId: 'UNESCO kota dagang',
    landmarkId: 'Stadthuys',
    funFacts: [
      'Melaka dan George Town bersama masuk daftar warisan dunia UNESCO.',
      'Stadthuys berwarna merah bata adalah bekas balai kota Belanda.',
      'Kesultanan Melaka pernah menguasai jalur rempah di Selat Malaka.',
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
    blurbId: 'UNESCO & street art',
    landmarkId: 'George Town',
    funFacts: [
      'Mural “Little Children on a Bicycle” jadi ikon foto jalanan George Town.',
      'Rumah toko Sino-Portuguese khas dua lantai memenuhi kota tua.',
      'Jembatan Penang menghubungkan pulau dengan semenanjung Malaysia.',
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
    blurbId: 'Arsitektur modern',
    landmarkId: 'Petronas',
    funFacts: [
      'Skybridge menghubungkan lantai 41 dan 42 Menara Petronas.',
      'Tiap menara tingginya 452 meter dengan 88 lantai.',
      'Desain denah menara terinspirasi motif bintang segi delapan.',
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
    blurbId: 'Kota-negara modern',
    landmarkId: 'Marina Bay',
    funFacts: [
      'Merlion diluncurkan tahun 1964 sebagai simbol pariwisata Singapura.',
      'Supertree di Gardens by the Bay menyala dengan lampu LED di malam hari.',
      'Singapore Botanic Gardens adalah situs UNESCO pertama di Singapura.',
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
