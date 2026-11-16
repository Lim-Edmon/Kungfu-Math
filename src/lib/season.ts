/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Tema musiman — TANPA API di HP (offline).
 *
 * Natal: otomatis 25 Nov → 6 Jan setiap tahun.
 * Imlek & Lebaran: jendela 2025–2050 dari tanggal puncak terverifikasi
 *   (Umm al-Qura / HKO), ±1 bulan sebelum → +1 minggu sesudah.
 *   Bisa ±1 hari vs penetapan resmi (hilal) — jendela lebar meng-cover itu.
 *
 * Setelah 2050: hanya Natal otomatis; Imlek/Lebaran tidak muncul (tabel habis).
 * Irisan: data-season "imlek-lebaran" | "natal-lebaran" | "natal-imlek"
 *   → CSS menumpuk 2 pola line-art (bukan 1 file gabungan).
 *
 * Tes: ?season=natal | lebaran | imlek | natal-lebaran | imlek-lebaran | off
 */

export type SeasonTag = 'natal' | 'lebaran' | 'imlek';

type Window = { tag: SeasonTag; start: string; end: string; note?: string };

const SEASON_WINDOWS: Window[] = [
  { tag: 'imlek', start: '2024-12-29', end: '2025-02-05', note: 'Imlek 2025 ~29 Jan' },
  { tag: 'imlek', start: '2026-01-17', end: '2026-02-24', note: 'Imlek 2026 ~17 Feb' },
  { tag: 'imlek', start: '2027-01-06', end: '2027-02-13', note: 'Imlek 2027 ~6 Feb' },
  { tag: 'imlek', start: '2027-12-26', end: '2028-02-02', note: 'Imlek 2028 ~26 Jan' },
  { tag: 'imlek', start: '2029-01-13', end: '2029-02-20', note: 'Imlek 2029 ~13 Feb' },
  { tag: 'imlek', start: '2030-01-03', end: '2030-02-10', note: 'Imlek 2030 ~3 Feb' },
  { tag: 'imlek', start: '2030-12-23', end: '2031-01-30', note: 'Imlek 2031 ~23 Jan' },
  { tag: 'imlek', start: '2032-01-11', end: '2032-02-18', note: 'Imlek 2032 ~11 Feb' },
  { tag: 'imlek', start: '2032-12-31', end: '2033-02-07', note: 'Imlek 2033 ~31 Jan' },
  { tag: 'imlek', start: '2034-01-19', end: '2034-02-26', note: 'Imlek 2034 ~19 Feb' },
  { tag: 'imlek', start: '2035-01-08', end: '2035-02-15', note: 'Imlek 2035 ~8 Feb' },
  { tag: 'imlek', start: '2035-12-28', end: '2036-02-04', note: 'Imlek 2036 ~28 Jan' },
  { tag: 'imlek', start: '2037-01-15', end: '2037-02-22', note: 'Imlek 2037 ~15 Feb' },
  { tag: 'imlek', start: '2038-01-04', end: '2038-02-11', note: 'Imlek 2038 ~4 Feb' },
  { tag: 'imlek', start: '2038-12-24', end: '2039-01-31', note: 'Imlek 2039 ~24 Jan' },
  { tag: 'imlek', start: '2040-01-12', end: '2040-02-19', note: 'Imlek 2040 ~12 Feb' },
  { tag: 'imlek', start: '2041-01-01', end: '2041-02-08', note: 'Imlek 2041 ~1 Feb' },
  { tag: 'imlek', start: '2041-12-22', end: '2042-01-29', note: 'Imlek 2042 ~22 Jan' },
  { tag: 'imlek', start: '2043-01-10', end: '2043-02-17', note: 'Imlek 2043 ~10 Feb' },
  { tag: 'imlek', start: '2043-12-30', end: '2044-02-06', note: 'Imlek 2044 ~30 Jan' },
  { tag: 'imlek', start: '2045-01-17', end: '2045-02-24', note: 'Imlek 2045 ~17 Feb' },
  { tag: 'imlek', start: '2046-01-06', end: '2046-02-13', note: 'Imlek 2046 ~6 Feb' },
  { tag: 'imlek', start: '2046-12-26', end: '2047-02-02', note: 'Imlek 2047 ~26 Jan' },
  { tag: 'imlek', start: '2048-01-14', end: '2048-02-21', note: 'Imlek 2048 ~14 Feb' },
  { tag: 'imlek', start: '2049-01-02', end: '2049-02-09', note: 'Imlek 2049 ~2 Feb' },
  { tag: 'imlek', start: '2049-12-23', end: '2050-01-30', note: 'Imlek 2050 ~23 Jan' },
  { tag: 'lebaran', start: '2026-02-20', end: '2026-03-27', note: 'Lebaran 2026 ~20 Mar' },
  { tag: 'lebaran', start: '2027-02-09', end: '2027-03-16', note: 'Lebaran 2027 ~9 Mar' },
  { tag: 'lebaran', start: '2028-01-26', end: '2028-03-04', note: 'Lebaran 2028 ~26 Feb' },
  { tag: 'lebaran', start: '2029-01-14', end: '2029-02-21', note: 'Lebaran 2029 ~14 Feb' },
  { tag: 'lebaran', start: '2030-01-04', end: '2030-02-11', note: 'Lebaran 2030 ~4 Feb' },
  { tag: 'lebaran', start: '2030-12-24', end: '2031-01-31', note: 'Lebaran 2031 ~24 Jan' },
  { tag: 'lebaran', start: '2031-12-14', end: '2032-01-21', note: 'Lebaran 2032 ~14 Jan' },
  { tag: 'lebaran', start: '2032-12-02', end: '2033-01-09', note: 'Lebaran 2033 ~2 Jan' },
  { tag: 'lebaran', start: '2033-11-23', end: '2033-12-30', note: 'Lebaran 2033 ~23 Dec' },
  { tag: 'lebaran', start: '2034-11-12', end: '2034-12-19', note: 'Lebaran 2034 ~12 Dec' },
  { tag: 'lebaran', start: '2035-11-01', end: '2035-12-08', note: 'Lebaran 2035 ~1 Dec' },
  { tag: 'lebaran', start: '2036-10-19', end: '2036-11-26', note: 'Lebaran 2036 ~19 Nov' },
  { tag: 'lebaran', start: '2037-10-08', end: '2037-11-15', note: 'Lebaran 2037 ~8 Nov' },
  { tag: 'lebaran', start: '2038-09-29', end: '2038-11-05', note: 'Lebaran 2038 ~29 Oct' },
  { tag: 'lebaran', start: '2039-09-19', end: '2039-10-26', note: 'Lebaran 2039 ~19 Oct' },
  { tag: 'lebaran', start: '2040-09-07', end: '2040-10-14', note: 'Lebaran 2040 ~7 Oct' },
  { tag: 'lebaran', start: '2041-08-26', end: '2041-10-03', note: 'Lebaran 2041 ~26 Sep' },
  { tag: 'lebaran', start: '2042-08-15', end: '2042-09-22', note: 'Lebaran 2042 ~15 Sep' },
  { tag: 'lebaran', start: '2043-08-04', end: '2043-09-11', note: 'Lebaran 2043 ~4 Sep' },
  { tag: 'lebaran', start: '2044-07-24', end: '2044-08-31', note: 'Lebaran 2044 ~24 Aug' },
  { tag: 'lebaran', start: '2045-07-13', end: '2045-08-20', note: 'Lebaran 2045 ~13 Aug' },
  { tag: 'lebaran', start: '2046-07-02', end: '2046-08-09', note: 'Lebaran 2046 ~2 Aug' },
  { tag: 'lebaran', start: '2047-06-23', end: '2047-07-30', note: 'Lebaran 2047 ~23 Jul' },
  { tag: 'lebaran', start: '2048-06-10', end: '2048-07-17', note: 'Lebaran 2048 ~10 Jul' },
  { tag: 'lebaran', start: '2049-05-29', end: '2049-07-06', note: 'Lebaran 2049 ~29 Jun' },
  { tag: 'lebaran', start: '2050-05-18', end: '2050-06-25', note: 'Lebaran 2050 ~18 Jun' },
];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function natalActive(now: Date): boolean {
  const m = now.getMonth();
  const day = now.getDate();
  if (m === 10 && day >= 25) return true;
  if (m === 11) return true;
  if (m === 0 && day <= 6) return true;
  return false;
}

const TAG_ORDER: SeasonTag[] = ['natal', 'imlek', 'lebaran'];

export function getActiveSeasonTags(now = new Date()): SeasonTag[] {
  const key = ymd(now);
  const hit = new Set<SeasonTag>();
  if (natalActive(now)) hit.add('natal');
  for (const w of SEASON_WINDOWS) {
    if (key >= w.start && key <= w.end) hit.add(w.tag);
  }
  return TAG_ORDER.filter((t) => hit.has(t));
}

const SEASON_FORCE_KEY = 'kungfu-math-season-force';

/** Parse "natal", "natal lebaran", "imlek-lebaran", etc. → tags or 'none'. */
export function parseSeasonForceText(raw: string): SeasonTag[] | 'none' | null {
  const q = (raw || '').toLowerCase().trim();
  if (!q) return null;
  const compact = q.replace(/[^a-z]/g, '');
  // Reset → ikut tanggal nyata
  if (
    compact === 'off' ||
    compact === 'none' ||
    compact === 'seasonoff' ||
    compact === 'seasonnone' ||
    compact === 'seasonnormal' ||
    compact === 'seasonauto' ||
    compact === 'musimoff' ||
    compact === 'musimnormal' ||
    compact === 'musimauto' ||
    compact === 'normalsseason' ||
    compact === 'autoseason'
  ) {
    return 'none';
  }
  if (compact === 'christmas' || compact === 'xmas') return ['natal'];
  if (compact === 'eid' || compact === 'eidulfitri') return ['lebaran'];
  if (compact === 'cny' || compact === 'chinese' || compact === 'chinesenewyear')
    return ['imlek'];
  // Urutan bebas: natal+lebaran, imlek+lebaran, dll.
  const hit = new Set<SeasonTag>();
  for (const t of TAG_ORDER) {
    if (compact.includes(t)) hit.add(t);
  }
  // "natallebaran" etc. already covered by includes
  if (!hit.size) return null;
  return TAG_ORDER.filter((t) => hit.has(t));
}

export function getSeasonOverrideFromUrl(): SeasonTag[] | 'none' | null {
  try {
    const q = (new URLSearchParams(window.location.search).get('season') || '')
      .toLowerCase()
      .trim();
    if (!q) return null;
    return parseSeasonForceText(q);
  } catch {
    return null;
  }
}

export function getSeasonForceFromStorage(): SeasonTag[] | 'none' | null {
  try {
    const raw = localStorage.getItem(SEASON_FORCE_KEY);
    if (raw === null || raw === '') return null;
    if (raw === 'none' || raw === 'off') return 'none';
    return parseSeasonForceText(raw);
  } catch {
    return null;
  }
}

/** Simpan paksa musim (cheat / URL). null = hapus paksa, ikut kalender. */
export function setSeasonForce(tags: SeasonTag[] | 'none' | null): void {
  try {
    if (tags === null) {
      localStorage.removeItem(SEASON_FORCE_KEY);
    } else if (tags === 'none') {
      localStorage.setItem(SEASON_FORCE_KEY, 'none');
    } else {
      localStorage.setItem(SEASON_FORCE_KEY, tags.join('-'));
    }
  } catch {
    /* ignore */
  }
}

/**
 * Prioritas: ?season= URL → localStorage force (cheat) → kalender.
 * 'none' = matikan overlay (bukan "tidak ada override").
 */
export function getActiveSeasonAttr(now = new Date()): string {
  if (typeof window !== 'undefined') {
    const url = getSeasonOverrideFromUrl();
    if (url === 'none') return '';
    if (url) return url.join('-');
    const stored = getSeasonForceFromStorage();
    if (stored === 'none') return '';
    if (stored) return stored.join('-');
  }
  return getActiveSeasonTags(now).join('-');
}

/**
 * Terapkan teks cheat musim.
 * return: 'auto' = ikut kalender; 'natal' | 'natal-lebaran' | … = paksa; null = bukan cheat musim.
 */
export function applySeasonCheatText(raw: string): string | null {
  const parsed = parseSeasonForceText(raw);
  if (parsed === null) return null;
  if (parsed === 'none') {
    // "season off / normal / auto" → hapus paksa, ikuti tanggal
    setSeasonForce(null);
    applySeasonToDocument(getActiveSeasonAttr());
    return 'auto';
  }
  setSeasonForce(parsed);
  applySeasonToDocument(parsed.join('-'));
  return parsed.join('-');
}

export function getActiveSeason(now = new Date()): string {
  return getActiveSeasonAttr(now) || 'none';
}

export function applySeasonToDocument(seasonAttr?: string): void {
  try {
    const attr =
      seasonAttr !== undefined ? seasonAttr : getActiveSeasonAttr();
    const root = document.documentElement;
    if (!attr || attr === 'none') root.removeAttribute('data-season');
    else root.setAttribute('data-season', attr);
  } catch {
    /* ignore */
  }
}

export function seasonHas(
  tag: SeasonTag,
  attr = typeof document !== 'undefined'
    ? document.documentElement.getAttribute('data-season') || getActiveSeasonAttr()
    : getActiveSeasonAttr()
): boolean {
  if (!attr) return false;
  return attr.split('-').includes(tag);
}
