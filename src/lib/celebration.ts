/** Kungfu Math — milestone spotlight copy (pendekar tone). */

import {
  ADVENTURE_REGIONS,
  getCityById,
  type AdventureCity,
} from './adventure';
import { getLang } from './i18n';

export type MilestoneKind = 'region' | 'world' | 'explorer';

export type MilestoneInfo = {
  kind: MilestoneKind;
  /** Region that was just cleared (for kind=region) */
  regionId?: string;
  regionLabel?: string;
};

export function getRegionLabel(regionId: string, lang: 'id' | 'en' = 'id'): string {
  const r = ADVENTURE_REGIONS.find((x) => x.id === regionId);
  if (!r) return regionId;
  return lang === 'en' ? r.labelEn : r.labelId;
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

  const northOk = (highScores['north-pole'] ?? 0) >= (getCityById('north-pole')?.targetScore ?? 7500);
  const southOk = (highScores['south-pole'] ?? 0) >= (getCityById('south-pole')?.targetScore ?? 7500);
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

  // Lolos kota terakhir region: kota berikutnya beda region (atau ujung non-NY sudah ditangani)
  if (nextCityId) {
    const next = getCityById(nextCityId);
    if (next && next.regionId !== city.regionId && city.regionId !== 'secret-polar') {
      const lang = getLang() === 'en' ? 'en' : 'id';
      return {
        kind: 'region',
        regionId: city.regionId,
        regionLabel: getRegionLabel(city.regionId, lang),
      };
    }
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
  // region
  const name = m.regionLabel || m.regionId || '';
  return lang === 'en'
    ? `${name} is conquered. Ready for the next path.`
    : `Region ${name} sudah kita taklukkan. Siap ke jalur berikutnya.`;
}

export function milestoneTitle(m: MilestoneInfo, lang: 'id' | 'en'): string {
  if (m.kind === 'explorer') {
    return lang === 'en' ? 'Greatest Explorer' : 'Greatest Explorer';
  }
  if (m.kind === 'world') {
    return lang === 'en' ? 'World’s Edge' : 'Ujung Dunia';
  }
  return lang === 'en' ? 'Region Clear' : 'Region Takluk';
}
