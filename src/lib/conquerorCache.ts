/** Preload / clear conqueror celebration assets (bukan HUD attack). */

import { getConquerorAnimSrc, getConquerorStillSrc } from './characters';

const CACHE_NAME = 'km-conqueror-v1';

export function conquerorUrls(characterId: string): string[] {
  return [getConquerorAnimSrc(characterId), getConquerorStillSrc(characterId)];
}

/** Unduh ke Cache API + warm Image — untuk kota yang hampir milestone. */
export async function preloadConqueror(characterId: string): Promise<void> {
  const urls = conquerorUrls(characterId);
  try {
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        urls.map(async (u) => {
          try {
            const hit = await cache.match(u);
            if (!hit) await cache.add(u);
          } catch {
            /* ignore single fail */
          }
        })
      );
    }
  } catch {
    /* ignore */
  }
  // Warm HTTP cache juga
  urls.forEach((u) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = u;
  });
}

/** Hapus cache conqueror saat keluar game / tutup app — hemat penyimpanan. */
export async function clearConquerorCache(): Promise<void> {
  try {
    if ('caches' in window) {
      await caches.delete(CACHE_NAME);
    }
  } catch {
    /* ignore */
  }
}
