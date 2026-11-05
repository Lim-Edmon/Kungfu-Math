/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Tema musiman — TANPA API di HP pemain (offline, tanpa limit/biaya).
 *
 * Natal: dihitung otomatis tiap tahun (25 Nov → 6 Jan) — tidak perlu update manual.
 * Imlek & Lebaran: jendela hardcode ~2025–2035 (sudah dilebarkan
 *   ≈1 bulan sebelum puncak → ≈1 minggu sesudah). Cukup untuk ~10 tahun
 *   tanpa kamu buka laptop. Setelah 2035, sekali isi ulang tabel (bukan tiap tahun).
 *
 * Irisan: data-season digabung, mis. "imlek-lebaran" / "natal-imlek".
 * Tes: ?season=natal | lebaran | imlek | imlek-lebaran | off
 */

export type SeasonTag = 'natal' | 'lebaran' | 'imlek';

type Window = { tag: SeasonTag; start: string; end: string; note?: string };

const SEASON_WINDOWS: Window[] = [
  { tag: 'imlek', start: '2025-12-29', end: '2026-02-24', note: 'Imlek 2026 ~17 Feb' },
  { tag: 'imlek', start: '2027-01-06', end: '2027-02-13', note: 'Imlek 2027 ~6 Feb' },
  { tag: 'imlek', start: '2028-01-26', end: '2028-03-04', note: 'Imlek 2028 ~26 Jan' },
  { tag: 'imlek', start: '2029-01-14', end: '2029-02-21', note: 'Imlek 2029 ~13 Feb' },
  { tag: 'imlek', start: '2030-01-03', end: '2030-02-10', note: 'Imlek 2030 ~3 Feb' },
  { tag: 'imlek', start: '2031-01-22', end: '2031-03-01', note: 'Imlek 2031 ~23 Jan' },
  { tag: 'imlek', start: '2032-01-11', end: '2032-02-18', note: 'Imlek 2032 ~11 Feb' },
  { tag: 'imlek', start: '2033-01-30', end: '2033-03-08', note: 'Imlek 2033 ~31 Jan' },
  { tag: 'imlek', start: '2034-01-19', end: '2034-02-26', note: 'Imlek 2034 ~19 Feb' },
  { tag: 'imlek', start: '2035-01-08', end: '2035-02-15', note: 'Imlek 2035 ~8 Feb' },

  { tag: 'lebaran', start: '2026-02-20', end: '2026-03-27', note: 'Lebaran 2026 ~20 Mar' },
  { tag: 'lebaran', start: '2027-02-10', end: '2027-03-17', note: 'Lebaran 2027 ~10 Mar' },
  { tag: 'lebaran', start: '2028-02-28', end: '2028-04-05', note: 'Lebaran 2028 ~27 Mar' },
  { tag: 'lebaran', start: '2029-02-17', end: '2029-03-26', note: 'Lebaran 2029 ~15 Mar' },
  { tag: 'lebaran', start: '2030-02-06', end: '2030-03-15', note: 'Lebaran 2030 ~5 Mar' },
  { tag: 'lebaran', start: '2031-02-25', end: '2031-04-03', note: 'Lebaran 2031 ~26 Mar' },
  { tag: 'lebaran', start: '2032-02-14', end: '2032-03-23', note: 'Lebaran 2032 ~14 Mar' },
  { tag: 'lebaran', start: '2033-02-03', end: '2033-03-12', note: 'Lebaran 2033 ~3 Mar' },
  { tag: 'lebaran', start: '2034-02-22', end: '2034-03-31', note: 'Lebaran 2034 ~22 Mar' },
  { tag: 'lebaran', start: '2035-02-11', end: '2035-03-20', note: 'Lebaran 2035 ~12 Mar' },
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
