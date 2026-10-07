import { getLang } from './i18n';
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
  /** English fun facts */
  funFactsEn: string[];
  /** Posisi pin ABSOLUT di world.webp (0–100 % lebar/tinggi gambar penuh) */
  mapX: number;
  mapY: number;
}

export interface AdventureDifficulty {
  id: string;
  labelId: string;
  labelEn: string;
  /** Detik ditambah tiap jawaban benar */
  timeBonus: number;
  /** Detik dikurangi tiap jawaban salah (0 = tidak ada) */
  timePenalty: number;
  descId: string;
  descEn: string;
}

export const ADVENTURE_REGIONS: { id: string; labelId: string; labelEn: string }[] = [
  { id: 'id', labelId: 'Indonesia', labelEn: 'Indonesia' },
  { id: 'sea', labelId: 'Asia Tenggara', labelEn: 'Southeast Asia' },
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
  return 'Negara lain';
}

/** English country names for UI */
export const COUNTRY_NAMES_EN: Record<string, string> = {
  id: 'Indonesia', tl: 'Timor-Leste', bn: 'Brunei', ph: 'Philippines', my: 'Malaysia',
  sg: 'Singapore', th: 'Thailand', vn: 'Vietnam', kh: 'Cambodia', la: 'Laos', mm: 'Myanmar',
  cn: 'China', jp: 'Japan', kr: 'South Korea', tw: 'Taiwan', mn: 'Mongolia', in: 'India',
  np: 'Nepal', bt: 'Bhutan', bd: 'Bangladesh', pk: 'Pakistan', lk: 'Sri Lanka',
  au: 'Australia', nz: 'New Zealand', fj: 'Fiji', pg: 'Papua New Guinea', ru: 'Russia',
  tr: 'Turkey', ae: 'United Arab Emirates', sa: 'Saudi Arabia', eg: 'Egypt', za: 'South Africa',
  ke: 'Kenya', ma: 'Morocco', gr: 'Greece', it: 'Italy', va: 'Vatican City', es: 'Spain',
  pt: 'Portugal', fr: 'France', de: 'Germany', nl: 'Netherlands', be: 'Belgium', ch: 'Switzerland',
  at: 'Austria', pl: 'Poland', cz: 'Czechia', hu: 'Hungary', ro: 'Romania', ua: 'Ukraine',
  se: 'Sweden', no: 'Norway', dk: 'Denmark', fi: 'Finland', is: 'Iceland', gb: 'United Kingdom',
  ie: 'Ireland', us: 'United States', ca: 'Canada', mx: 'Mexico', br: 'Brazil', ar: 'Argentina',
  cl: 'Chile', pe: 'Peru', co: 'Colombia', ec: 'Ecuador', bo: 'Bolivia', cu: 'Cuba', gl: 'Greenland',
};

export function getCountryNameEn(countryId: string): string {
  return COUNTRY_NAMES_EN[countryId] || 'Another country';
}


/**
 * Tempo perjalanan — NAMA BERBEDA dari Level permainan
 * (Pemula / Dasar / Menengah / Mahir / Master).
 * 4 opsi → grid 2×2 di home.
 */
export const ADVENTURE_DIFFICULTIES: AdventureDifficulty[] = [
  { id: 'santai', labelId: 'Santai', labelEn: 'Easygoing', timeBonus: 3, timePenalty: 0, descId: '+3 dtk tiap benar', descEn: '+3s per correct' },
  { id: 'ringan', labelId: 'Ringan', labelEn: 'Light', timeBonus: 1, timePenalty: 0, descId: '+1 dtk tiap benar', descEn: '+1s per correct' },
  { id: 'normal', labelId: 'Normal', labelEn: 'Normal', timeBonus: 0, timePenalty: 0, descId: 'Tanpa bonus waktu', descEn: 'No time bonus' },
  { id: 'berani', labelId: 'Berani', labelEn: 'Bold', timeBonus: 0, timePenalty: 3, descId: 'Salah −3 dtk', descEn: 'Wrong −3s' },
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
      'Monas di Jakarta tingginya 132 m — setara gedung sekitar 44 lantai.',
      'Api di puncak Monas Jakarta terbuat dari perunggu berlapis emas.',
      'Kota Tua Jakarta di Sunda Kelapa masih punya gudang abad ke-17.',
    ],
    funFactsEn: [
      'The National Monument (Monas) in Jakarta is about 132 meters tall.',
      'Jakarta is Indonesia’s capital and the country’s largest city.',
      'Jakarta’s old town, Kota Tua, still has colonial-era buildings.'
    ],
    mapX: 79.3,
    mapY: 66.95,
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
      'Menara Gedung Sate di Bandung bentuknya meniru tusuk sate.',
      'Bandung tuan rumah Konferensi Asia-Afrika 1955.',
      'Kawah Putih dekat Bandung berwarna putih kehijauan karena belerang.',
    ],
    funFactsEn: [
      'Bandung is often called the City of Flowers for its parks and blooms.',
      'Gedung Sate in Bandung is a famous landmark with a skewer-shaped tower.',
      'Bandung sits on a highland plateau, so evenings feel cooler.'
    ],
    mapX: 79.51,
    mapY: 67.38,
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
      'Lawang Sewu di Semarang berarti seribu pintu karena sangat banyak jendela.',
      'Semarang dulu merupakan kantor pusat kereta api Hindia Belanda.',
      'Kota Lama Semarang dilestarikan sebagai kawasan bersejarah.',
    ],
    funFactsEn: [
      'Semarang once housed the main railway office of the Dutch East Indies.',
      'Lawang Sewu in Semarang is a historic building with many windows.',
      'Semarang’s old harbor area shows the city’s long trading history.'
    ],
    mapX: 80.27,
    mapY: 67.41,
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
      'Candi Borobudur dekat Yogyakarta punya lebih dari 2.600 panel relief batu.',
      'Tugu Yogyakarta adalah titik nol kilometer resmi kota ini.',
      'Keraton Yogyakarta masih menjalankan upacara adat Kesultanan.',
    ],
    funFactsEn: [
      'Borobudur near Yogyakarta has more than 2,600 stone relief panels.',
      'The Yogyakarta Palace (Kraton) is still the heart of local culture.',
      'Malioboro Street in Yogyakarta is a popular walking and shopping area.'
    ],
    mapX: 80.25,
    mapY: 67.92,
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
      'Motif batik parang dan kawung adalah ciri khas Solo.',
      'Pasar Klewer di Solo termasuk pasar batik terbesar di Indonesia.',
    ],
    funFactsEn: [
      'Solo (Surakarta) is known for its royal courts and batik tradition.',
      'The Mangkunegaran Palace in Solo is an important cultural center.',
      'Solo and Yogyakarta are neighboring royal cities on Java.'
    ],
    mapX: 80.37,
    mapY: 67.77,
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
      'Pertempuran Surabaya 10 November 1945 jadi Hari Pahlawan nasional.',
      'Jembatan Suramadu menghubungkan Surabaya dengan Pulau Madura.',
    ],
    funFactsEn: [
      'Surabaya is often called the City of Heroes.',
      'The Suramadu Bridge links Surabaya with Madura Island.',
      'Tugu Pahlawan in Surabaya honors the city’s independence struggle.'
    ],
    mapX: 80.9,
    mapY: 67.58,
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
      'Istana Maimun di Medan memadukan gaya Melayu, Islam, dan Eropa.',
      'Danau Toba dekat Medan dari letusan supervulkan ~74.000 tahun lalu.',
      'Pulau Samosir di dekat Medan, di tengah Danau Toba, hampir seluas Singapura.',
    ],
    funFactsEn: [
      'Istana Maimun in Medan mixes Malay, Islamic, and European styles.',
      'Lake Toba near Medan was formed by a supervolcano about 74,000 years ago.',
      'Samosir Island near Medan, in Lake Toba, is nearly as large as Singapore.'
    ],
    mapX: 77.09,
    mapY: 60.96,
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
      'Di kepulauan Derawan, Danau Kakaban dihuni ubur-ubur yang tidak menyengat.',
      'Di pantai Derawan, penyu hijau sering bertelur.',
      'Kepulauan Derawan masuk segitiga terumbu karang dunia (Coral Triangle).',
    ],
    funFactsEn: [
      'In the Derawan islands, Kakaban Lake is home to stingless jellyfish.',
      'Green turtles often nest on Derawan’s beaches.',
      'The Derawan islands are part of the world’s Coral Triangle.'
    ],
    mapX: 82.37,
    mapY: 61.77,
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
      'Fort Rotterdam di Makassar berdiri di atas bekas benteng kerajaan Gowa.',
      'Pantai Losari di Makassar adalah jalur rekreasi panjang menghadap selat.',
    ],
    funFactsEn: [
      'Fort Rotterdam in Makassar is a well-preserved historic fort.',
      'Losari Beach is a popular waterfront in Makassar.',
      'Makassar has long been a major port of eastern Indonesia.'
    ],
    mapX: 82.7,
    mapY: 66.3,
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
      'Taman Laut Bunaken dekat Manado punya dinding terumbu curam ratusan meter.',
      'Di laut Manado, satu titik selam bisa memuat puluhan spesies ikan tropis.',
      'Taman Nasional Bunaken di Manado dilindungi sejak tahun 1991.',
    ],
    funFactsEn: [
      'Bunaken near Manado is famous for colorful coral reefs.',
      'Manado sits by a bay with hills and clear sea views.',
      'North Sulawesi near Manado is known for rich marine life.'
    ],
    mapX: 84.16,
    mapY: 62.26,
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
      'Karst Wayag di Raja Ampat tampak seperti gundukan hijau di laut toska.',
      'Nama Raja Ampat dari empat pulau utama: Waigeo, Batanta, Salawati, dan Misool.',
    ],
    funFactsEn: [
      'Raja Ampat has some of the richest coral diversity on Earth.',
      'The limestone islands of Raja Ampat rise from bright turquoise water.',
      'Raja Ampat is part of West Papua’s spectacular seascape.'
    ],
    mapX: 85.69,
    mapY: 63.3,
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
      'Puncak Jaya (Cartenz) dekat Jayapura tingginya ~4.884 m — tertinggi di Oceania.',
      'Satu-satunya gletser tropis di Indonesia ada di pegunungan dekat Jayapura.',
      'Gletser di dekat Jayapura mencair cepat dalam beberapa dekade terakhir.',
    ],
    funFactsEn: [
      'Jayapura is the capital of Papua province in Indonesia.',
      'Yos Sudarso Bay frames the coastal city of Jayapura.',
      'Jayapura is a gateway to Papua’s highlands and coast.'
    ],
    mapX: 88.44,
    mapY: 64.7,
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
      'Komodo secara alami hanya hidup di kawasan Flores dan pulau sekitarnya di NTT.',
      'Danau Kelimutu di Flores bisa berganti warna karena mineral di air.',
      'Pulau Padar di Flores punya tiga teluk yang terlihat dari satu puncak.',
    ],
    funFactsEn: [
      'Komodo dragons live naturally around Flores and nearby islands.',
      'Kelimutu on Flores has crater lakes that change color.',
      'Flores is part of East Nusa Tenggara with dramatic volcanic landscapes.'
    ],
    mapX: 83.3,
    mapY: 68.55,
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
      'Sistem irigasi Subak di Bali diakui UNESCO sebagai warisan budaya dunia.',
      'Pura Uluwatu di Bali berdiri di tebing kapur menghadap Samudra Hindia.',
      'Selat Lombok dekat Bali adalah garis Wallace pemisah fauna Asia–Australasia.',
    ],
    funFactsEn: [
      'Bali is known worldwide for its temples and rice terraces.',
      'Tanah Lot and Uluwatu are famous sea temples in Bali.',
      'Balinese culture blends art, dance, and daily offerings.'
    ],
    mapX: 81.56,
    mapY: 68.44,
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
      'Patung Cristo Rei di Dili berdiri di bukit menghadap teluk.',
      'Dili adalah ibu kota Timor-Leste yang merdeka sebagai negara pada tahun 2002.',
      'Di Dili, bahasa resmi Timor-Leste termasuk Tetum dan Portugis.',
    ],
    funFactsEn: [
      'Cristo Rei above Dili is a large statue overlooking the sea.',
      'Dili is the capital of Timor-Leste.',
      'Dili’s waterfront faces a calm tropical bay.'
    ],
    mapX: 84.35,
    mapY: 68.38,
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
      'Masjid Omar Ali Saifuddien di Brunei tampak mengapung di laguna buatan.',
      'Brunei salah satu negara terkecil di Asia dengan hutan hujan yang luas.',
      'Kampong Ayer di Brunei adalah permukiman di atas air yang sudah berusia berabad-abad.',
    ],
    funFactsEn: [
      'Omar Ali Saifuddien Mosque is a landmark of Bandar Seri Begawan, Brunei.',
      'Brunei is a small country on the island of Borneo.',
      'Much of Brunei is covered by rainforest.'
    ],
    mapX: 81.48,
    mapY: 60.17,
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
      'Salib Magellan di Cebu terkait kedatangan pelayaran Eropa pada abad ke-16.',
      'Cebu termasuk pusat perdagangan pulau yang ramai di Visayas.',
      'Pantai dan pulau kecil di sekitar Cebu populer untuk snorkel.',
    ],
    funFactsEn: [
      'Cebu is one of the Philippines’ oldest cities.',
      'Magellan’s Cross in Cebu marks an early colonial landing site.',
      'Cebu’s harbor has long been a busy trading center.'
    ],
    mapX: 83.9,
    mapY: 56.86,
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
      'Intramuros di Manila adalah kota bertembok peninggalan zaman Spanyol.',
      'Manila Bay terkenal dengan pemandangan matahari terbenam yang oranye.',
      'Jeepney warna-warni adalah transportasi ikonik di jalanan Manila.',
    ],
    funFactsEn: [
      'Manila Bay sunsets are a famous view of the Philippine capital region.',
      'Intramuros is the old walled city of Manila.',
      'Manila is one of the densest urban areas in Southeast Asia.'
    ],
    mapX: 83.11,
    mapY: 54.25,
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
      'Mural “Little Children on a Bicycle” di Penang jadi ikon foto jalanan George Town.',
      'Rumah toko lama di Penang sering berwarna cerah dan berlantai dua.',
      'Jembatan Penang menghubungkan pulau dengan semenanjung Malaysia.',
    ],
    funFactsEn: [
      'George Town in Penang is known for street art and shophouses.',
      'Penang is an island state on Malaysia’s northwest coast.',
      'Clan jetties in Penang show historic waterfront settlements.'
    ],
    mapX: 77.54,
    mapY: 59.86,
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
      'Skybridge di Kuala Lumpur menghubungkan lantai 41 dan 42 Menara Petronas.',
      'Tiap menara Petronas di Kuala Lumpur tingginya 452 meter dengan 88 lantai.',
      'Desain denah Menara Petronas di Kuala Lumpur terinspirasi motif bintang segi delapan.',
    ],
    funFactsEn: [
      'The Petronas Twin Towers are a symbol of Kuala Lumpur.',
      'Kuala Lumpur is the capital of Malaysia.',
      'KL is often used as a short name for Kuala Lumpur.'
    ],
    mapX: 77.91,
    mapY: 61.24,
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
      'Merlion di Singapore punya kepala singa dan badan ikan — simbol kota pelabuhan.',
      'Supertree di Gardens by the Bay, Singapore, menyala dengan lampu LED di malam hari.',
      'Hampir setengah wilayah Singapore adalah ruang hijau dan taman.',
    ],
    funFactsEn: [
      'Marina Bay Sands is a famous modern landmark in Singapore.',
      'Singapore is a city-state at the tip of the Malay Peninsula.',
      'The Merlion is a well-known symbol of Singapore.'
    ],
    mapX: 78.48,
    mapY: 62.34,
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
      'Teluk Phang Nga dekat Phuket punya batu karst yang muncul dari laut toska.',
      'Kota tua Phuket menyimpan bangunan Sino-Portuguese berwarna cerah.',
    ],
    funFactsEn: [
      'Phuket is Thailand’s largest island and a major beach destination.',
      'Limestone cliffs and clear water shape Phuket’s coast.',
      'Phuket Town has colorful old shophouses and markets.'
    ],
    mapX: 77.02,
    mapY: 58.35,
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
      'Ho Chi Minh City masih sering disebut Saigon oleh banyak warga setempat.',
      'Pasar Ben Thanh di Ho Chi Minh menjadi titik orientasi pusat kota yang ramai.',
      'Sungai Saigon membelah Ho Chi Minh; dulu jalur dagang penting di selatan Vietnam.',
    ],
    funFactsEn: [
      'Ho Chi Minh City is Vietnam’s largest city.',
      'The Notre-Dame Cathedral is a landmark in Ho Chi Minh City.',
      'The city’s busy rivers and canals once shaped its trade.'
    ],
    mapX: 79.24,
    mapY: 56.56,
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
      'Wat Arun di Bangkok dihiasi keramik berwarna yang berkilau saat matahari terbit.',
      'Nama resmi Bangkok termasuk yang terpanjang di dunia untuk nama tempat.',
      'Perahu long-tail di Bangkok menjadi transportasi khas di sungai Chao Phraya.',
    ],
    funFactsEn: [
      'Wat Arun by the Chao Phraya River is a Bangkok icon.',
      'Bangkok is the capital of Thailand.',
      'Bangkok’s grand palace complex draws visitors from around the world.'
    ],
    mapX: 77.59,
    mapY: 54.77,
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
      'Angkor Wat dekat Siem Reap digambarkan di bendera Kamboja.',
      'Relief batu di dinding Angkor dekat Siem Reap menceritakan legenda Hindu-Buddha.',
      'Kompleks Angkor di Siem Reap pernah menjadi pusat kekaisaran Khmer yang luas.',
    ],
    funFactsEn: [
      'Angkor Wat near Siem Reap is one of the world’s great temple complexes.',
      'Siem Reap is the gateway town to the Angkor temples in Cambodia.',
      'Sunrise over Angkor Wat near Siem Reap is a famous view.'
    ],
    mapX: 78.49,
    mapY: 55.0,
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
      'Phnom Penh berdiri di pertemuan tiga sungai besar.',
      'Pagoda Perak di Phnom Penh dihiasi ubin perak di lantai kompleks istana.',
    ],
    funFactsEn: [
      'The Royal Palace with golden roofs is a symbol of Phnom Penh.',
      'Phnom Penh is the capital of Cambodia on the Mekong River.',
      'The Mekong and Tonle Sap rivers meet near Phnom Penh.'
    ],
    mapX: 78.78,
    mapY: 56.11,
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
      'Doi Suthep di Chiang Mai punya ratusan anak tangga dilindungi naga emas.',
      'Chiang Mai dulu ibu kota kerajaan Lanna di utara Thailand.',
      'Pasar malam Chiang Mai terkenal dengan kerajinan kayu dan kain.',
    ],
    funFactsEn: [
      'Doi Suthep temple overlooks the city of Chiang Mai.',
      'Chiang Mai’s old city is framed by a square moat and walls.',
      'Chiang Mai is a cultural center of northern Thailand.'
    ],
    mapX: 77.18,
    mapY: 51.7,
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
      'Setiap pagi di Luang Prabang, biksu berjalan menerima sedekah nasi dari warga.',
      'Air terjun Kuang Si dekat Luang Prabang airnya berwarna toska karena mineral.',
    ],
    funFactsEn: [
      'Luang Prabang is a historic town of monasteries in Laos.',
      'The Mekong and Nam Khan rivers meet at Luang Prabang.',
      'Morning alms-giving is a well-known tradition in Luang Prabang.'
    ],
    mapX: 78.03,
    mapY: 51.03,
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
      'Di dataran Bagan (Myanmar) berdiri ribuan pagoda dan kuil bata kuno.',
      'Balon udara sering terbang di atas Bagan saat matahari terbit.',
      'Bagan dulu ibu kota kerajaan yang makmur di sepanjang Sungai Irrawaddy.',
    ],
    funFactsEn: [
      'Bagan in Myanmar is famous for thousands of ancient temples.',
      'Sunrise over the Bagan plain shows countless pagoda silhouettes.',
      'Hot-air balloons often fly over Bagan at dawn.'
    ],
    mapX: 76.06,
    mapY: 50.25,
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
      'Danau Hoan Kiem di Hanoi berarti “danau mengembalikan pedang” dari legenda kura-kura.',
      'Kawasan kota lama Hanoi punya puluhan jalan kecil yang dulu dibagi menurut jenis kerajinan.',
      'Jembatan The Huc di Hanoi berwarna merah mengarah ke pulau kuil di tengah danau.',
    ],
    funFactsEn: [
      'Hoan Kiem Lake and its turtle tower are icons of Hanoi.',
      'Hanoi is the capital of Vietnam.',
      'Hanoi’s Old Quarter has narrow streets and long trading history.'
    ],
    mapX: 79.03,
    mapY: 50.33,
  },
];

/** Kota terakhir region Indonesia — lolos = buka Asia Tenggara */
export const MVP_REGION_LAST_CITY_ID = 'bali';

export const MVP_REGION_UNLOCK_MSG =
  'Kamu sudah berhasil membuka akses ke regional lain — Asia Tenggara! Selamat menikmati petualangan barumu.';

/** Kota terakhir jalur SEA (ujung utara) */
export const MVP_PATH_LAST_CITY_ID = 'hanoi';

/** Teks cadangan ID — UI pakai i18n journeyEnd* */
export const MVP_PATH_COMPLETE_MSG =
  'Luar biasa! Kamu berhasil mencapai ujung perjalanan saat ini. Mohon menunggu — petualangan baru menanti berikutnya.';

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
  const list =
    getLang() === 'en' && city.funFactsEn?.length
      ? city.funFactsEn
      : city.funFacts;
  if (!list?.length) return null;
  return list[Math.floor(Math.random() * list.length)] ?? null;
}
