/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Mode Petualangan — jalur:
 * Indonesia (Jawa → Sumatera → Kalimantan → Sulawesi → Papua/pulau → Nusa Tenggara → Bali terakhir)
 * lalu Asia Tenggara: Penang → Kuala Lumpur → Singapore
 *
 * Asset opsional (ganti file saja, nama = id kota):
 *   public/cities/bg/{id}.webp   (atau .png / .jpg)
 *   public/cities/music/{id}.mp3  (loop; tidak ada → BGM default)
 */

export interface AdventureCity {
  id: string;
  nameId: string;
  nameEn: string;
  countryId: string;
  /** Cluster kawasan: id | sea | … */
  regionId: string;
  theme: string;
  /** Skor minimum agar kota berikutnya terbuka */
  targetScore: number;
  blurbId: string;
  landmarkId: string;
  /** 2–3 fakta ringan untuk anak, diacak saat lolos kota */
  funFacts: string[];
  /** Posisi pin ABSOLUT di world.webp (0–100 % lebar/tinggi gambar penuh) */
  mapX: number;
  mapY: number;
}

export interface AdventureDifficulty {
  id: string;
  labelId: string;
  /** Detik ditambah tiap jawaban benar */
  timeBonus: number;
  /** Detik dikurangi tiap jawaban salah (0 = tidak ada) */
  timePenalty: number;
  descId: string;
}

export const ADVENTURE_REGIONS: { id: string; labelId: string }[] = [
  { id: 'id', labelId: 'Indonesia' },
  { id: 'sea', labelId: 'Asia Tenggara' },
];

/**
 * Nama negara LENGKAP untuk UI (anak).
 * JANGAN tampilkan kode ISO (tl, bn, ph, …).
 * Saat tambah kota/negara baru: WAJIB isi baris di sini dulu.
 */
export const COUNTRY_NAMES_ID: Record<string, string> = {
  // Jalur sekarang (Indonesia + SEA)
  id: 'Indonesia',
  tl: 'Timor Leste',
  bn: 'Brunei',
  ph: 'Filipina',
  my: 'Malaysia',
  sg: 'Singapura',
  th: 'Thailand',
  vn: 'Vietnam',
  kh: 'Kamboja',
  la: 'Laos',
  mm: 'Myanmar',
  // Cadangan region berikutnya
  cn: 'Tiongkok',
  jp: 'Jepang',
  kr: 'Korea Selatan',
  tw: 'Taiwan',
  mn: 'Mongolia',
  in: 'India',
  np: 'Nepal',
  bt: 'Bhutan',
  bd: 'Bangladesh',
  pk: 'Pakistan',
  lk: 'Sri Lanka',
  au: 'Australia',
  nz: 'Selandia Baru',
  fj: 'Fiji',
  pg: 'Papua Nugini',
  ru: 'Rusia',
  tr: 'Turki',
  ae: 'Uni Emirat Arab',
  sa: 'Arab Saudi',
  eg: 'Mesir',
  za: 'Afrika Selatan',
  ke: 'Kenya',
  ma: 'Maroko',
  gr: 'Yunani',
  it: 'Italia',
  va: 'Vatikan',
  es: 'Spanyol',
  pt: 'Portugal',
  fr: 'Prancis',
  de: 'Jerman',
  nl: 'Belanda',
  be: 'Belgia',
  ch: 'Swiss',
  at: 'Austria',
  pl: 'Polandia',
  cz: 'Ceko',
  hu: 'Hungaria',
  ro: 'Rumania',
  ua: 'Ukraina',
  se: 'Swedia',
  no: 'Norwegia',
  dk: 'Denmark',
  fi: 'Finlandia',
  is: 'Islandia',
  gb: 'Inggris',
  ie: 'Irlandia',
  us: 'Amerika Serikat',
  ca: 'Kanada',
  mx: 'Meksiko',
  br: 'Brasil',
  ar: 'Argentina',
  cl: 'Chili',
  pe: 'Peru',
  co: 'Kolombia',
  ec: 'Ekuador',
  bo: 'Bolivia',
  cu: 'Kuba',
  gl: 'Greenland',
};

export function getCountryNameId(countryId: string): string {
  const name = COUNTRY_NAMES_ID[countryId];
  if (name) return name;
  // Jangan tampilkan kode mentah ke anak
  return 'Negara lain';
}

/**
 * Tempo perjalanan — NAMA BERBEDA dari Level permainan
 * (Pemula / Dasar / Menengah / Mahir / Master).
 * 4 opsi → grid 2×2 di home.
 */
export const ADVENTURE_DIFFICULTIES: AdventureDifficulty[] = [
  { id: 'santai', labelId: 'Santai', timeBonus: 3, timePenalty: 0, descId: '+3 dtk tiap benar' },
  { id: 'ringan', labelId: 'Ringan', timeBonus: 1, timePenalty: 0, descId: '+1 dtk tiap benar' },
  { id: 'normal', labelId: 'Normal', timeBonus: 0, timePenalty: 0, descId: 'Tanpa bonus waktu' },
  { id: 'berani', labelId: 'Berani', timeBonus: 0, timePenalty: 3, descId: 'Salah −3 dtk (+nyawa)' },
];

export function getAdventureDifficulty(id: string): AdventureDifficulty {
  return (
    ADVENTURE_DIFFICULTIES.find((d) => d.id === id) ?? ADVENTURE_DIFFICULTIES[1]
  );
}

/**
 * Urutan Indonesia (per permintaan):
 * Jawa → Medan (Sumatera) → Kalimantan → Sulawesi → pulau timur → Nusa Tenggara → Bali terakhir
 * Lalu SEA: Penang → KL → Singapore
 * Target: Jakarta 500, +50 tiap kota
 */
export const ADVENTURE_CITIES: AdventureCity[] = [
  // —— Jawa ——
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
    mapY: 58.95,
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
    mapY: 58.7,
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
    mapX: 77.7,
    mapY: 59.4,
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
    mapX: 77.8,
    mapY: 59.23,
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
    mapX: 78.2,
    mapY: 59.03,
  },
  // —— Sumatera ——
  {
    id: 'medan',
    nameId: 'Medan',
    nameEn: 'Medan',
    countryId: 'id',
    regionId: 'id',
    theme: 'medan',
    targetScore: 800,
    blurbId: 'Sejarah & alam Sumatera',
    landmarkId: 'Istana Maimun',
    funFacts: [
      'Istana Maimun memadukan gaya Melayu, Islam, dan Eropa.',
      'Danau Toba dekat Medan dari letusan supervulkan ~74.000 tahun lalu.',
      'Pulau Samosir di tengah Toba hampir seluas Singapura.',
    ],
    mapX: 75.28,
    mapY: 52.28,
  },
  // —— Kalimantan ——
  {
    id: 'derawan',
    nameId: 'Derawan',
    nameEn: 'Derawan',
    countryId: 'id',
    regionId: 'id',
    theme: 'derawan',
    targetScore: 850,
    blurbId: 'Bahari',
    landmarkId: 'Laguna',
    funFacts: [
      'Danau Kakaban dihuni ubur-ubur yang tidak menyengat.',
      'Penyu hijau bertelur di pantai Derawan.',
      'Masuk segitiga terumbu karang dunia (Coral Triangle).',
    ],
    mapX: 79.34,
    mapY: 53.09,
  },
  // —— Sulawesi ——
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
    mapX: 79.58,
    mapY: 57.72,
  },
  {
    id: 'manado',
    nameId: 'Manado',
    nameEn: 'Manado',
    countryId: 'id',
    regionId: 'id',
    theme: 'manado',
    targetScore: 950,
    blurbId: 'Bahari / taman laut',
    landmarkId: 'Bunaken',
    funFacts: [
      'Bunaken punya dinding terumbu curam ratusan meter.',
      'Satu titik selam bisa memuat puluhan spesies ikan tropis.',
      'Taman Nasional Bunaken dilindungi sejak 1991.',
    ],
    mapX: 80.71,
    mapY: 53.59,
  },
  // —— Papua / pulau timur ——
  {
    id: 'raja-ampat',
    nameId: 'Raja Ampat',
    nameEn: 'Raja Ampat',
    countryId: 'id',
    regionId: 'id',
    theme: 'raja-ampat',
    targetScore: 1000,
    blurbId: 'Bahari',
    landmarkId: 'Wayag',
    funFacts: [
      'Keanekaragaman ikan karang di Raja Ampat termasuk tertinggi di dunia.',
      'Karst Wayag seperti gundukan hijau di laut toska.',
      'Nama Ampat dari empat pulau utama: Waigeo, Batanta, Salawati, Misool.',
    ],
    mapX: 81.95,
    mapY: 54.76,
  },
  {
    id: 'jayapura',
    nameId: 'Jayapura',
    nameEn: 'Jayapura',
    countryId: 'id',
    regionId: 'id',
    theme: 'jayapura',
    targetScore: 1050,
    blurbId: 'Alam ekstrem',
    landmarkId: 'Puncak Jaya',
    funFacts: [
      'Puncak Jaya (Cartenz) ~4.884 m — tertinggi di Oceania.',
      'Satu-satunya gletser tropis di Indonesia ada di sini.',
      'Gletsernya mencair cepat dalam beberapa dekade terakhir.',
    ],
    mapX: 83.99,
    mapY: 56.09,
  },
  // —— Nusa Tenggara ——
  {
    id: 'flores',
    nameId: 'Flores',
    nameEn: 'Flores',
    countryId: 'id',
    regionId: 'id',
    theme: 'flores',
    targetScore: 1100,
    blurbId: 'UNESCO & alam',
    landmarkId: 'Kelimutu',
    funFacts: [
      'Komodo secara alami hanya hidup di kawasan Nusa Tenggara Timur.',
      'Danau Kelimutu bisa berganti warna karena mineral di air.',
      'Pulau Padar punya tiga teluk terlihat dari satu puncak.',
    ],
    mapX: 79.93,
    mapY: 59.84,
  },
  // —— Bali terakhir di Indonesia ——
  {
    id: 'bali',
    nameId: 'Bali',
    nameEn: 'Bali',
    countryId: 'id',
    regionId: 'id',
    theme: 'bali',
    targetScore: 1150,
    blurbId: 'Budaya & UNESCO',
    landmarkId: 'Pura tebing',
    funFacts: [
      'Sistem irigasi Subak diakui UNESCO warisan budaya dunia.',
      'Pura Uluwatu di tebing kapur menghadap Samudra Hindia.',
      'Selat Lombok adalah garis Wallace pemisah fauna Asia–Australasia.',
    ],
    mapX: 78.71,
    mapY: 59.9,
  },

  // —— Asia Tenggara (setelah lolos Bali) ——
  // Dekat Indo dulu: Dili (TL) → Brunei → Filipina → MY → SG → naik utara (TH…VN)
  {
    id: 'dili',
    nameId: 'Dili',
    nameEn: 'Dili',
    countryId: 'tl',
    regionId: 'sea',
    theme: 'dili',
    targetScore: 1200,
    blurbId: 'Ibukota Timor-Leste',
    landmarkId: 'Cristo Rei',
    funFacts: [
      'Patung Cristo Rei di bukit menghadap Teluk Dili.',
      'Timor-Leste merdeka sebagai negara pada tahun 2002.',
      'Bahasa resmi termasuk Tetum dan Portugis.',
    ],
    mapX: 80.85,
    mapY: 59.85,
  },
  {
    id: 'brunei',
    nameId: 'Brunei',
    nameEn: 'Brunei',
    countryId: 'bn',
    regionId: 'sea',
    theme: 'brunei',
    targetScore: 1250,
    blurbId: 'Negara kecil Borneo',
    landmarkId: 'Masjid Omar Ali',
    funFacts: [
      'Masjid Omar Ali Saifuddien tampak mengapung di laguna buatan.',
      'Brunei salah satu negara terkecil di Asia dengan hutan hujan yang luas.',
      'Kampong Ayer adalah permukiman di atas air yang sudah berusia berabad-abad.',
    ],
    mapX: 78.65,
    mapY: 51.46,
  },
  {
    id: 'cebu',
    nameId: 'Cebu',
    nameEn: 'Cebu',
    countryId: 'ph',
    regionId: 'sea',
    theme: 'cebu',
    targetScore: 1300,
    blurbId: 'Bahari & sejarah',
    landmarkId: 'Magellan Cross',
    funFacts: [
      'Salib Magellan di Cebu terkait kedatangan pelayaran Eropa abad ke-16.',
      'Cebu termasuk pusat perdagangan pulau yang ramai di Visayas.',
      'Pantai dan pulau kecil di sekitar Cebu populer untuk snorkel.',
    ],
    mapX: 80.51,
    mapY: 48.09,
  },
  {
    id: 'manila',
    nameId: 'Manila',
    nameEn: 'Manila',
    countryId: 'ph',
    regionId: 'sea',
    theme: 'manila',
    targetScore: 1350,
    blurbId: 'Ibukota & sejarah',
    landmarkId: 'Intramuros',
    funFacts: [
      'Intramuros adalah kota bertembok peninggalan zaman Spanyol.',
      'Manila Bay terkenal dengan pemandangan matahari terbenam yang oranye.',
      'Jeepney warna-warni adalah transportasi ikonik di jalanan Filipina.',
    ],
    mapX: 79.91,
    mapY: 45.42,
  },
  {
    id: 'penang',
    nameId: 'Penang',
    nameEn: 'Penang',
    countryId: 'my',
    regionId: 'sea',
    theme: 'penang',
    targetScore: 1400,
    blurbId: 'UNESCO & street art',
    landmarkId: 'George Town',
    funFacts: [
      'Mural “Little Children on a Bicycle” jadi ikon foto jalanan George Town.',
      'Rumah toko lama di Penang sering berwarna cerah dan berlantai dua.',
      'Jembatan Penang menghubungkan pulau dengan semenanjung Malaysia.',
    ],
    mapX: 75.62,
    mapY: 51.14,
  },
  {
    id: 'kuala-lumpur',
    nameId: 'Kuala Lumpur',
    nameEn: 'Kuala Lumpur',
    countryId: 'my',
    regionId: 'sea',
    theme: 'kuala-lumpur',
    targetScore: 1450,
    blurbId: 'Arsitektur modern',
    landmarkId: 'Petronas',
    funFacts: [
      'Skybridge menghubungkan lantai 41 dan 42 Menara Petronas.',
      'Tiap menara tingginya 452 meter dengan 88 lantai.',
      'Desain denah menara terinspirasi motif bintang segi delapan.',
    ],
    mapX: 75.91,
    mapY: 52.56,
  },
  {
    id: 'singapore',
    nameId: 'Singapore',
    nameEn: 'Singapore',
    countryId: 'sg',
    regionId: 'sea',
    theme: 'singapore',
    targetScore: 1500,
    blurbId: 'Kota-negara modern',
    landmarkId: 'Marina Bay',
    funFacts: [
      'Merlion punya kepala singa dan badan ikan — simbol kota pelabuhan Singapura.',
      'Supertree di Gardens by the Bay menyala dengan lampu LED di malam hari.',
      'Hampir setengah wilayah Singapura adalah ruang hijau dan taman.',
    ],
    mapX: 76.35,
    mapY: 53.67,
  },
  {
    id: 'phuket',
    nameId: 'Phuket',
    nameEn: 'Phuket',
    countryId: 'th',
    regionId: 'sea',
    theme: 'phuket',
    targetScore: 1550,
    blurbId: 'Bahari',
    landmarkId: 'Pantai Patong',
    funFacts: [
      'Phuket adalah pulau terbesar di Thailand.',
      'Teluk Phang Nga punya batu karst yang muncul dari laut toska.',
      'Kota tua Phuket menyimpan bangunan Sino-Portuguese berwarna cerah.',
    ],
    mapX: 75.22,
    mapY: 49.61,
  },
  {
    id: 'ho-chi-minh',
    nameId: 'Ho Chi Minh',
    nameEn: 'Ho Chi Minh City',
    countryId: 'vn',
    regionId: 'sea',
    theme: 'ho-chi-minh',
    targetScore: 1600,
    blurbId: 'Kota besar selatan',
    landmarkId: 'Balai Kota',
    funFacts: [
      'Kota ini masih sering disebut Saigon oleh banyak warga setempat.',
      'Pasar Ben Thanh menjadi titik orientasi pusat kota yang ramai.',
      'Sungai Saigon membelah kota; dulu jalur dagang penting di selatan Vietnam.',
    ],
    mapX: 76.93,
    mapY: 47.77,
  },
  {
    id: 'bangkok',
    nameId: 'Bangkok',
    nameEn: 'Bangkok',
    countryId: 'th',
    regionId: 'sea',
    theme: 'bangkok',
    targetScore: 1650,
    blurbId: 'Ibukota & kuil',
    landmarkId: 'Wat Arun',
    funFacts: [
      'Wat Arun dihiasi keramik berwarna yang berkilau saat matahari terbit.',
      'Nama resmi Bangkok termasuk yang terpanjang di dunia untuk nama tempat.',
      'Perahu long-tail menjadi transportasi khas di sungai Chao Phraya.',
    ],
    mapX: 75.66,
    mapY: 45.94,
  },
  {
    id: 'siem-reap',
    nameId: 'Siem Reap',
    nameEn: 'Siem Reap',
    countryId: 'kh',
    regionId: 'sea',
    theme: 'siem-reap',
    targetScore: 1700,
    blurbId: 'UNESCO / World Wonder',
    landmarkId: 'Angkor Wat',
    funFacts: [
      'Angkor Wat adalah kuil beragama yang digambarkan di bendera Kamboja.',
      'Relief batu di dinding Angkor menceritakan legenda Hindu-Buddha.',
      'Kompleks Angkor pernah menjadi pusat kekaisaran Khmer yang luas.',
    ],
    mapX: 76.35,
    mapY: 46.19,
  },
  {
    id: 'phnom-penh',
    nameId: 'Phnom Penh',
    nameEn: 'Phnom Penh',
    countryId: 'kh',
    regionId: 'sea',
    theme: 'phnom-penh',
    targetScore: 1750,
    blurbId: 'Ibukota',
    landmarkId: 'Istana Kerajaan',
    funFacts: [
      'Istana Kerajaan Phnom Penh masih dipakai keluarga kerajaan Kamboja.',
      'Kota ini berdiri di pertemuan tiga sungai besar.',
      'Pagoda Perak di kompleks istana dihiasi ubin perak di lantai.',
    ],
    mapX: 76.58,
    mapY: 47.32,
  },
  {
    id: 'chiang-mai',
    nameId: 'Chiang Mai',
    nameEn: 'Chiang Mai',
    countryId: 'th',
    regionId: 'sea',
    theme: 'chiang-mai',
    targetScore: 1800,
    blurbId: 'Kota gunung & kuil',
    landmarkId: 'Doi Suthep',
    funFacts: [
      'Doi Suthep punya ratusan anak tangga dilindungi naga emas.',
      'Chiang Mai dulu ibu kota kerajaan Lanna di utara Thailand.',
      'Pasar malam Chiang Mai terkenal dengan kerajinan kayu dan kain.',
    ],
    mapX: 75.35,
    mapY: 42.81,
  },
  {
    id: 'luang-prabang',
    nameId: 'Luang Prabang',
    nameEn: 'Luang Prabang',
    countryId: 'la',
    regionId: 'sea',
    theme: 'luang-prabang',
    targetScore: 1850,
    blurbId: 'UNESCO',
    landmarkId: 'Kuil & Mekong',
    funFacts: [
      'Luang Prabang diakui UNESCO karena memadukan kuil Lao dan rumah kolonial.',
      'Setiap pagi biksu berjalan menerima sedekah nasi dari warga.',
      'Air terjun Kuang Si airnya berwarna toska karena mineral.',
    ],
    mapX: 76.0,
    mapY: 42.13,
  },
  {
    id: 'bagan',
    nameId: 'Bagan',
    nameEn: 'Bagan',
    countryId: 'mm',
    regionId: 'sea',
    theme: 'bagan',
    targetScore: 1900,
    blurbId: 'UNESCO / warisan',
    landmarkId: 'Dataran pagoda',
    funFacts: [
      'Di dataran Bagan berdiri ribuan pagoda dan kuil bata kuno.',
      'Balon udara sering terbang di atas Bagan saat matahari terbit.',
      'Bagan dulu ibu kota kerajaan yang makmur di sepanjang Sungai Irrawaddy.',
    ],
    mapX: 74.49,
    mapY: 41.33,
  },
  {
    id: 'hanoi',
    nameId: 'Hanoi',
    nameEn: 'Hanoi',
    countryId: 'vn',
    regionId: 'sea',
    theme: 'hanoi',
    targetScore: 1950,
    blurbId: 'Ibukota & danau',
    landmarkId: 'Danau Hoan Kiem',
    funFacts: [
      'Nama Hoan Kiem berarti “danau mengembalikan pedang” dari legenda kura-kura.',
      'Kawasan kota lama Hanoi punya puluhan jalan kecil yang dulu dibagi menurut jenis kerajinan.',
      'Jembatan The Huc berwarna merah mengarah ke pulau kuil di tengah danau.',
    ],
    mapX: 76.76,
    mapY: 41.41,
  },
];

/** Kota terakhir region Indonesia — lolos = buka Asia Tenggara */
export const MVP_REGION_LAST_CITY_ID = 'bali';

export const MVP_REGION_UNLOCK_MSG =
  'Kamu sudah berhasil membuka akses ke regional lain — Asia Tenggara! Selamat menikmati petualangan barumu.';

/** Kota terakhir jalur SEA (ujung utara) */
export const MVP_PATH_LAST_CITY_ID = 'hanoi';

export const MVP_PATH_COMPLETE_MSG =
  'Kamu sudah menuntaskan jalur Indonesia dan Asia Tenggara. Hebat, pendekar!';

export function getCityById(id: string): AdventureCity {
  return ADVENTURE_CITIES.find((c) => c.id === id) ?? ADVENTURE_CITIES[0];
}

export function getNextCityId(currentId: string): string | null {
  const i = ADVENTURE_CITIES.findIndex((c) => c.id === currentId);
  if (i < 0 || i >= ADVENTURE_CITIES.length - 1) return null;
  return ADVENTURE_CITIES[i + 1].id;
}

/** Path asset kota — ganti file di folder, nama = id kota */
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
