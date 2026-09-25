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
  { id: 'id', labelId: 'Indonesia' },
  // Fase berikutnya: { id: 'sea', labelId: 'Asia Tenggara' }, …
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
    regionId: 'id',
    theme: 'jakarta',
    targetScore: 500,
    blurbId: 'Landmark nasional',
    landmarkId: 'Monas',
    funFacts: [
      'Monas tingginya 132 m — setara gedung ~44 lantai.',
      'Api puncak Monas dari perunggu berlapis emas.',
      'Kota Tua di Sunda Kelapa masih punya gudang abad ke-17.',
    ],
    mapX: 76.9,
    mapY: 58.4,
  },
  {
    id: 'bandung',
    nameId: 'Bandung',
    nameEn: 'Bandung',
    countryId: 'id',
    regionId: 'id',
    theme: 'bandung',
    targetScore: 550,
    blurbId: 'Arsitektur & dataran tinggi',
    landmarkId: 'Gedung Sate',
    funFacts: [
      'Menara Gedung Sate meniru bentuk tusuk sate.',
      'Bandung tuan rumah Konferensi Asia-Afrika 1955.',
      'Kawah Putih berwarna putih kehijauan karena belerang.',
    ],
    mapX: 77.23,
    mapY: 58.7,
  },
  {
    id: 'semarang',
    nameId: 'Semarang',
    nameEn: 'Semarang',
    countryId: 'id',
    regionId: 'id',
    theme: 'semarang',
    targetScore: 600,
    blurbId: 'Sejarah kolonial',
    landmarkId: 'Lawang Sewu',
    funFacts: [
      'Lawang Sewu berarti seribu pintu karena sangat banyak jendela.',
      'Dulu kantor pusat kereta api Hindia Belanda.',
      'Kota Lama Semarang dilestarikan sebagai kawasan bersejarah.',
    ],
    mapX: 77.7,
    mapY: 58.2,
  },
  {
    id: 'yogyakarta',
    nameId: 'Yogyakarta',
    nameEn: 'Yogyakarta',
    countryId: 'id',
    regionId: 'id',
    theme: 'yogyakarta',
    targetScore: 650,
    blurbId: 'Budaya Jawa & UNESCO',
    landmarkId: 'Tugu Yogya',
    funFacts: [
      'Borobudur (dekat Yogya) punya >2.600 panel relief batu.',
      'Tugu Yogya titik nol kilometer resmi kota.',
      'Keraton masih menjalankan upacara adat Kesultanan.',
    ],
    mapX: 78.2,
    mapY: 59.6,
  },
  {
    id: 'solo',
    nameId: 'Solo',
    nameEn: 'Solo',
    countryId: 'id',
    regionId: 'id',
    theme: 'solo',
    targetScore: 700,
    blurbId: 'Budaya Jawa',
    landmarkId: 'Keraton Solo',
    funFacts: [
      'Solo punya dua istana: Kasunanan dan Mangkunegaran.',
      'Motif batik parang dan kawung khas Solo.',
      'Pasar Klewer termasuk pasar batik terbesar di Indonesia.',
    ],
    mapX: 78.35,
    mapY: 59.3,
  },
  {
    id: 'surabaya',
    nameId: 'Surabaya',
    nameEn: 'Surabaya',
    countryId: 'id',
    regionId: 'id',
    theme: 'surabaya',
    targetScore: 750,
    blurbId: 'Sejarah kemerdekaan',
    landmarkId: 'Tugu Pahlawan',
    funFacts: [
      'Nama Surabaya dari legenda hiu (sura) dan buaya (baya).',
      '10 November 1945 jadi Hari Pahlawan nasional.',
      'Jembatan Suramadu menghubungkan Surabaya–Madura.',
    ],
    mapX: 78.43,
    mapY: 58.85,
  },
  {
    id: 'bali',
    nameId: 'Bali',
    nameEn: 'Bali',
    countryId: 'id',
    regionId: 'id',
    theme: 'bali',
    targetScore: 800,
    blurbId: 'Budaya & UNESCO',
    landmarkId: 'Pura tebing',
    funFacts: [
      'Sistem irigasi Subak diakui UNESCO warisan budaya dunia.',
      'Pura Uluwatu di tebing kapur menghadap Samudra Hindia.',
      'Selat Lombok adalah garis Wallace pemisah fauna Asia–Australasia.',
    ],
    mapX: 79.24,
    mapY: 60.05,
  },
  {
    id: 'flores',
    nameId: 'Flores',
    nameEn: 'Flores',
    countryId: 'id',
    regionId: 'id',
    theme: 'flores',
    targetScore: 850,
    blurbId: 'UNESCO & alam',
    landmarkId: 'Kelimutu',
    funFacts: [
      'Komodo secara alami hanya hidup di kawasan Nusa Tenggara Timur.',
      'Danau Kelimutu bisa berganti warna karena mineral di air.',
      'Pulau Padar punya tiga teluk terlihat dari satu puncak.',
    ],
    mapX: 81.2,
    mapY: 59.8,
  },
  {
    id: 'makassar',
    nameId: 'Makassar',
    nameEn: 'Makassar',
    countryId: 'id',
    regionId: 'id',
    theme: 'makassar',
    targetScore: 900,
    blurbId: 'Bahari & sejarah',
    landmarkId: 'Fort Rotterdam',
    funFacts: [
      'Pinisi Bugis-Makassar diakui UNESCO warisan budaya bahari.',
      'Fort Rotterdam di atas bekas benteng kerajaan Gowa.',
      'Losari jalur rekreasi panjang menghadap selat.',
    ],
    mapX: 80.36,
    mapY: 57.53,
  },
  {
    id: 'derawan',
    nameId: 'Derawan',
    nameEn: 'Derawan',
    countryId: 'id',
    regionId: 'id',
    theme: 'derawan',
    targetScore: 950,
    blurbId: 'Bahari',
    landmarkId: 'Laguna',
    funFacts: [
      'Danau Kakaban dihuni ubur-ubur yang tidak menyengat.',
      'Penyu hijau bertelur di pantai Derawan.',
      'Masuk segitiga terumbu karang dunia (Coral Triangle).',
    ],
    mapX: 82.5,
    mapY: 54.5,
  },
  {
    id: 'manado',
    nameId: 'Manado',
    nameEn: 'Manado',
    countryId: 'id',
    regionId: 'id',
    theme: 'manado',
    targetScore: 1000,
    blurbId: 'Bahari / taman laut',
    landmarkId: 'Bunaken',
    funFacts: [
      'Bunaken punya dinding terumbu curam ratusan meter.',
      'Satu titik selam bisa memuat puluhan spesies ikan tropis.',
      'Taman Nasional Bunaken dilindungi sejak 1991.',
    ],
    mapX: 82.8,
    mapY: 52.8,
  },
  {
    id: 'raja-ampat',
    nameId: 'Raja Ampat',
    nameEn: 'Raja Ampat',
    countryId: 'id',
    regionId: 'id',
    theme: 'raja-ampat',
    targetScore: 1050,
    blurbId: 'Bahari',
    landmarkId: 'Wayag',
    funFacts: [
      'Keanekaragaman ikan karang di Raja Ampat termasuk tertinggi di dunia.',
      'Karst Wayag seperti gundukan hijau di laut toska.',
      'Nama Ampat dari empat pulau utama: Waigeo, Batanta, Salawati, Misool.',
    ],
    mapX: 84.2,
    mapY: 55.5,
  },
  {
    id: 'jayapura',
    nameId: 'Jayapura',
    nameEn: 'Jayapura',
    countryId: 'id',
    regionId: 'id',
    theme: 'jayapura',
    targetScore: 1100,
    blurbId: 'Alam ekstrem',
    landmarkId: 'Puncak Jaya',
    funFacts: [
      'Puncak Jaya (Cartenz) ~4.884 m — tertinggi di Oceania.',
      'Satu-satunya gletser tropis di Indonesia ada di sini.',
      'Gletsernya mencair cepat dalam beberapa dekade terakhir.',
    ],
    mapX: 86.5,
    mapY: 56.2,
  },
  {
    id: 'medan',
    nameId: 'Medan',
    nameEn: 'Medan',
    countryId: 'id',
    regionId: 'id',
    theme: 'medan',
    targetScore: 1150,
    blurbId: 'Sejarah & alam Sumatera',
    landmarkId: 'Istana Maimun',
    funFacts: [
      'Istana Maimun memadukan gaya Melayu, Islam, dan Eropa.',
      'Danau Toba dekat Medan dari letusan supervulkan ~74.000 tahun lalu.',
      'Pulau Samosir di tengah Toba hampir seluas Singapura.',
    ],
    mapX: 74.84,
    mapY: 51.26,
  },
];

/** Kota terakhir region Indonesia — lolos = siap buka SEA (fase berikutnya) */
export const MVP_REGION_LAST_CITY_ID = 'medan';

export const MVP_REGION_UNLOCK_MSG =
  'Kamu sudah berhasil membuka akses ke regional lain — Asia Tenggara! Selamat menikmati petualangan barumu.';


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
