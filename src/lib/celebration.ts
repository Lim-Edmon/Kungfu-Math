/** Kungfu Math — milestone spotlight copy (pendekar tone). */

import {
  ADVENTURE_CITIES,
  ADVENTURE_REGIONS,
  getCityById,
  isSecretCityId,
} from './adventure';
import { getLang } from './i18n';

export type MilestoneKind = 'region' | 'world' | 'explorer';

export type MilestoneInfo = {
  kind: MilestoneKind;
  regionId?: string;
  regionLabel?: string;
};

export function getRegionLabel(regionId: string, lang: 'id' | 'en' = 'id'): string {
  const r = ADVENTURE_REGIONS.find((x) => x.id === regionId);
  if (!r) return regionId;
  return lang === 'en' ? r.labelEn : r.labelId;
}

/** Kota terakhir di region (urutan jalur), abaikan secret-polar. */
export function isRegionLastCity(cityId: string): boolean {
  const city = getCityById(cityId);
  if (!city || city.regionId === 'secret-polar' || isSecretCityId(cityId)) {
    return false;
  }
  const inReg = ADVENTURE_CITIES.filter(
    (c) => c.regionId === city.regionId && !isSecretCityId(c.id)
  );
  if (!inReg.length) return false;
  return inReg[inReg.length - 1].id === cityId;
}

/** Deteksi momen besar setelah lolos kota petualangan. */
export function detectMilestone(
  cityId: string,
  passed: boolean,
  nextCityId: string | null,
  highScores: Record<string, number>
): MilestoneInfo | null {
  if (!passed) return null;
  const city = getCityById(cityId);
  if (!city) return null;

  const northT = getCityById('north-pole')?.targetScore ?? 7500;
  const southT = getCityById('south-pole')?.targetScore ?? 7500;
  const northOk = (highScores['north-pole'] ?? 0) >= northT;
  const southOk = (highScores['south-pole'] ?? 0) >= southT;
  if (
    (cityId === 'north-pole' || cityId === 'south-pole') &&
    northOk &&
    southOk
  ) {
    return { kind: 'explorer' };
  }

  if (cityId === 'new-york') {
    return { kind: 'world' };
  }

  // Region selesai: kota terakhir region ATAU next beda region
  let regionClear = isRegionLastCity(cityId);
  if (!regionClear && nextCityId) {
    const next = getCityById(nextCityId);
    if (
      next &&
      next.regionId !== city.regionId &&
      city.regionId !== 'secret-polar'
    ) {
      regionClear = true;
    }
  }
  if (regionClear) {
    const lang = getLang() === 'en' ? 'en' : 'id';
    return {
      kind: 'region',
      regionId: city.regionId,
      regionLabel: getRegionLabel(city.regionId, lang),
    };
  }

  return null;
}

export function milestoneQuote(m: MilestoneInfo, lang: 'id' | 'en'): string {
  if (m.kind === 'explorer') {
    return lang === 'en'
      ? 'The whole world is under our feet. Greatest Explorer — the path is complete.'
      : 'Seluruh dunia sudah kita taklukkan. Greatest Explorer — perjalanan lengkap.';
  }
  if (m.kind === 'world') {
    return lang === 'en'
      ? 'Edge of the world reached. A secret path in the poles awaits.'
      : 'Ujung dunia tercapai. Jalur misteri di kutub… menunggu.';
  }
  const name = m.regionLabel || m.regionId || '';
  return lang === 'en'
    ? `${name} is conquered. Ready for the next path.`
    : `Region ${name} sudah kita taklukkan. Siap ke jalur berikutnya.`;
}

export function milestoneTitle(m: MilestoneInfo, lang: 'id' | 'en'): string {
  if (m.kind === 'explorer') return 'Greatest Explorer';
  if (m.kind === 'world') {
    return lang === 'en' ? "World's Edge" : 'Ujung Dunia';
  }
  return lang === 'en' ? 'Region Clear' : 'Region Takluk';
}
