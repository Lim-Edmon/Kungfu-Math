/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Tema musiman (skeleton).
 *
 * Natal = kalender matahari (tetap tiap tahun).
 * Lebaran & Imlek = kalender lunar → tanggal bergeser.
 *   Tidak fetch internet (PWA offline-friendly).
 *   Isi jendela per tahun di SEASON_WINDOWS (update ~1×/tahun).
 *   Acuan: ~1 bulan sebelum tanggal utama → ~1 minggu sesudah.
 *
 * Irisan: data-season digabung, mis. "imlek-lebaran" (CSS pakai *=).
 *
 * Tes: ?season=natal | lebaran | imlek | imlek-lebaran | off
 *
 * Sumber tanggal — TANPA API runtime (hindari limit/biaya/offline gagal):
 *   - Update manual ~1×/tahun, idealnya sekitar 1 Juli:
 *     isi jendela 1 Juli tahun ini → 30 Juni tahun depan di SEASON_WINDOWS.
 *   - Acuan saat update: Kemenag / MABIMS (Lebaran), lunar calendar (Imlek),
 *     Natal tetap matahari. Estimasi dulu; koreksi jika resmi bergeser 1 hari.
 *   - Tidak fetch API di HP pemain.
 *
 * Sumber tanggal (update manual tahunan, bukan runtime):
 *   - Imlek: timeanddate / penanggalan resmi CNY
 *   - Lebaran (Idul Fitri): Kemenag RI / timeanddate Eid al-Fitr
 */

export type SeasonTag = 'natal' | 'lebaran' | 'imlek';

type Window = { tag: SeasonTag; start: string; end: string; note?: string };

/**
 * Jendela event (≈1 bulan sebelum → ≈1 minggu sesudah puncak).
 * Perbarui setiap akhir tahun untuk 1–2 tahun ke depan.
 */
const SEASON_WINDOWS: Window[] = [
  { tag: 'natal', start: '2025-11-25', end: '2026-01-06', note: 'Natal 2025/26' },
  { tag: 'natal', start: '2026-11-25', end: '2027-01-06', note: 'Natal 2026/27' },
  { tag: 'natal', start: '2027-11-25', end: '2028-01-06', note: 'Natal 2027/28' },

  { tag: 'imlek', start: '2026-01-17', end: '2026-02-24', note: 'Imlek 2026 (puncak ~17 Feb)' },
  { tag: 'imlek', start: '2027-01-06', end: '2027-02-13', note: 'Imlek 2027 (puncak ~6 Feb)' },
  { tag: 'imlek', start: '2028-01-26', end: '2028-03-04', note: 'Imlek 2028 (perkiraan)' },

  { tag: 'lebaran', start: '2026-02-20', end: '2026-03-27', note: 'Lebaran 2026 (puncak ~20 Mar)' },
  { tag: 'lebaran', start: '2027-02-10', end: '2027-03-17', note: 'Lebaran 2027 (puncak ~10 Mar)' },
  { tag: 'lebaran', start: '2028-02-28', end: '2028-04-05', note: 'Lebaran 2028 (perkiraan)' },
];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const TAG_ORDER: SeasonTag[] = ['natal', 'imlek', 'lebaran'];

export function getActiveSeasonTags(now = new Date()): SeasonTag[] {
  const key = ymd(now);
  const hit = new Set<SeasonTag>();
  for (const w of SEASON_WINDOWS) {
    if (key >= w.start && key <= w.end) hit.add(w.tag);
  }
  return TAG_ORDER.filter((t) => hit.has(t));
}

export function getSeasonOverrideFromUrl(): SeasonTag[] | 'none' | null {
  try {
    const q = (new URLSearchParams(window.location.search).get('season') || '')
      .toLowerCase()
      .trim();
    if (!q) return null;
    if (q === 'off' || q === 'none') return 'none';
    if (q === 'christmas') return ['natal'];
    if (q === 'eid') return ['lebaran'];
    if (q === 'cny' || q === 'chinese') return ['imlek'];
    const parts = q.split(/[-+,]/).map((s) => s.trim()).filter(Boolean);
    const tags = parts.filter((p): p is SeasonTag =>
      TAG_ORDER.includes(p as SeasonTag)
    );
    return tags.length ? tags : null;
  } catch {
    return null;
  }
}

export function getActiveSeasonAttr(now = new Date()): string {
  const over = typeof window !== 'undefined' ? getSeasonOverrideFromUrl() : null;
  if (over === 'none') return '';
  const tags = over ?? getActiveSeasonTags(now);
  return tags.join('-');
}

/** Kompat: string atribut atau 'none' */
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
