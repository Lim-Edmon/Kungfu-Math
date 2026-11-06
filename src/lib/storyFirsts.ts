/** Kungfu Math — cerita “pertama kali” (region / mode) · gaya pendekar */

import type { ArenaStyle, InputMode, PlayerProgress } from './types';
import {
  ADVENTURE_CITIES,
  getCityById,
  getCountryNameEn,
  getCountryNameId,
  getRegionLabel,
} from './adventure';
import { loadProgress, updateProgress } from './storage';

export type StoryLang = 'id' | 'en';

function hasFirst(key: string, p?: PlayerProgress): boolean {
  const list = (p ?? loadProgress()).storyFirsts || [];
  return list.includes(key);
}

function markFirst(key: string): void {
  const p = loadProgress();
  const list = [...(p.storyFirsts || [])];
  if (list.includes(key)) return;
  list.push(key);
  updateProgress({ storyFirsts: list.slice(0, 80) });
}

/** Apakah kota ini first clear di region-nya (belum ada kota lain di region yg lolos target)? */
export function isFirstClearInRegion(
  cityId: string,
  highScores: Record<string, number> | undefined
): boolean {
  const city = getCityById(cityId);
  const regionId = city.regionId;
  const hs = highScores || {};
  for (const c of ADVENTURE_CITIES) {
    if (c.regionId !== regionId) continue;
    if (c.id === cityId) continue;
    if ((hs[c.id] ?? 0) >= c.targetScore) return false;
  }
  // Kota ini sendiri belum pernah lolos (caller cek wasUncleared)
  return true;
}

export function buildRegionFirstCityMessage(
  cityId: string,
  lang: StoryLang
): string {
  const city = getCityById(cityId);
  const name = lang === 'en' ? city.nameEn : city.nameId;
  const country =
    lang === 'en'
      ? getCountryNameEn(city.countryId)
      : getCountryNameId(city.countryId);
  const region = getRegionLabel(city.regionId, lang);
  const place =
    country && country !== name ? `${name} (${country})` : name;

  if (lang === 'en') {
    return (
      `Warrior, you just claimed ${place} — your first city in ${region}! ` +
      `Keep advancing and conquer the rest of this land. ` +
      `Enjoy the journey: turn the sound on so each city’s atmosphere comes alive.`
    );
  }
  return (
    `Pendekar, kamu baru saja menaklukkan ${place} — kota pertama di kawasan ${region}! ` +
    `Terus melangkah dan taklukkan sisanya. ` +
    `Nikmati perjalanan ini: nyalakan suara agar suasana kotanya terasa lebih hidup.`
  );
}

export function buildModeFirstMessage(
  kind:
    | 'slice'
    | 'tap'
    | 'static'
    | 'agility'
    | 'pass'
    | 'sprint'
    | 'grade',
  lang: StoryLang
): string {
  const id: Record<string, string> = {
    slice:
      'Pendekar, kamu baru saja menyelesaikan latihan tebas (Slice) pertamamu. Pertajam terus skill ini agar gerakanmu semakin cepat dan akurat.',
    tap:
      'Pendekar, kamu baru saja menyelesaikan latihan ketuk (Tap) pertamamu. Asah terus ketepatan jari agar setiap ketukan mengena.',
    static:
      'Pendekar, kamu baru saja menyelesaikan latihan bola diam pertamamu. Tenang dan fokus — dasar yang kokoh untuk semua arena.',
    agility:
      'Pendekar, kamu baru saja menyelesaikan latihan bola pantul pertamamu. Tetap fokus mengikuti gerak bola dan temukan jawabannya.',
    pass:
      'Pendekar, kamu baru saja menyelesaikan latihan bola lewat pertamamu. Amati sebelum mereka lewat — ketajaman matamu akan tumbuh.',
    sprint:
      'Pendekar, kamu baru saja menyelesaikan latihan Sprint pertamamu. Terus berlatih agar hitunganmu makin cepat.',
    grade:
      'Pendekar, kamu baru saja menyelesaikan sesi Grade (60 detik) pertamamu. Asah stamina hitungmu di dojo.',
  };
  const en: Record<string, string> = {
    slice:
      'Warrior, you just finished your first Slice training. Keep sharpening that cut so every swipe is fast and true.',
    tap:
      'Warrior, you just finished your first Tap training. Hone your precision so every tap lands clean.',
    static:
      'Warrior, you just finished your first Still-ball session. Calm focus is the foundation of every arena.',
    agility:
      'Warrior, you just finished your first Bounce training. Stay locked on the moving balls and find the answer.',
    pass:
      'Warrior, you just finished your first Pass-by training. Watch closely before they slip away — your eye will grow sharper.',
    sprint:
      'Warrior, you just finished your first Sprint. Keep training so your calculations get faster.',
    grade:
      'Warrior, you just finished your first Grade session (60 seconds). Build your math stamina in the dojo.',
  };
  return (lang === 'en' ? en : id)[kind] || '';
}

export interface StoryHypeResult {
  /** Pesan utama (prioritas tertinggi) */
  primary: string | null;
  /** Pesan tambahan (opsional, max 1) */
  secondary: string | null;
  /** Key yang baru ditandai */
  marked: string[];
}

/**
 * Evaluasi cerita first-time setelah run selesai.
 * Menandai key di progress agar tidak diulang.
 */
export function evaluateStoryFirsts(opts: {
  lang: StoryLang;
  isAdventure: boolean;
  passedCity: boolean;
  cityId?: string;
  /** skor kota sebelum run (untuk first clear) */
  prevCityHs?: number;
  cityTarget?: number;
  inputMode: InputMode;
  arena: ArenaStyle;
  sessionKind?: 'grade' | 'sprint' | string;
}): StoryHypeResult {
  const p = loadProgress();
  const marked: string[] = [];
  const msgs: string[] = [];

  const tryMark = (key: string, msg: string) => {
    if (hasFirst(key, p) || marked.includes(key)) return;
    if ((p.storyFirsts || []).includes(key)) return;
    marked.push(key);
    if (msg) msgs.push(msg);
  };

  // 1) Kota pertama di region (prioritas cerita petualangan)
  if (
    opts.isAdventure &&
    opts.passedCity &&
    opts.cityId &&
    opts.cityTarget != null &&
    (opts.prevCityHs ?? 0) < opts.cityTarget
  ) {
    const hs = { ...(p.adventureHighScores || {}) };
    if (isFirstClearInRegion(opts.cityId, hs)) {
      const key = `region:${getCityById(opts.cityId).regionId}`;
      tryMark(key, buildRegionFirstCityMessage(opts.cityId, opts.lang));
    }
  }

  // 2) Sesi latihan (Sprint / Grade)
  if (!opts.isAdventure) {
    const sk = opts.sessionKind === 'sprint' ? 'sprint' : ('grade' as const);
    tryMark(`session:${sk}`, buildModeFirstMessage(sk, opts.lang));
  }

  // 3) Arena
  tryMark(
    `arena:${opts.arena}`,
    buildModeFirstMessage(
      opts.arena === 'agility'
        ? 'agility'
        : opts.arena === 'pass'
          ? 'pass'
          : 'static',
      opts.lang
    )
  );

  // 4) Input Slice / Tap
  tryMark(
    `mode:${opts.inputMode}`,
    buildModeFirstMessage(opts.inputMode, opts.lang)
  );

  if (marked.length) {
    const list = [...(p.storyFirsts || []), ...marked];
    updateProgress({ storyFirsts: list.slice(0, 80) });
  }

  return {
    primary: msgs[0] || null,
    secondary: msgs[1] || null,
    marked,
  };
}
