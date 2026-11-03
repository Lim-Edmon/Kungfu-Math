/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/**
 * Hapus BG + musik satu kota dari Cache Storage (service worker).
 * Dipakai saat pindah kota supaya HP tidak menumpuk semua aset,
 * dan orang iseng tidak “sekali buka dapat semua kota di cache”.
 * Bukan proteksi total: URL aset tetap bisa di-fetch manual jika diketahui.
 */

const KEEP_IDS = new Set(['dojo', 'default']);

function assetPaths(cityId: string): string[] {
  const id = (cityId || '').toLowerCase().trim();
  if (!id || KEEP_IDS.has(id)) return [];
  return [
    `/cities/bg/${id}.webp`,
    `/cities/bg/${id}.png`,
    `/cities/bg/${id}.jpg`,
    `/cities/music/${id}.mp3`,
  ];
}

/** Hapus entry cache untuk satu kota (semua nama cache di origin ini). */
export async function purgeCityAssets(cityId: string): Promise<void> {
  if (typeof caches === 'undefined') return;
  const paths = assetPaths(cityId);
  if (!paths.length) return;
  try {
    const names = await caches.keys();
    await Promise.all(
      names.map(async (name) => {
        const cache = await caches.open(name);
        await Promise.all(
          paths.flatMap((p) => [
            cache.delete(p),
            cache.delete(new URL(p, self.location.origin).href),
          ])
        );
      })
    );
  } catch {
    /* ignore — cache API bisa gagal di private mode */
  }
}

let lastFetchedCityId: string | null = null;

/**
 * Saat masuk kota baru: hapus cache kota sebelumnya (bukan dojo/default),
 * lalu biarkan fetch kota baru mengisi cache seperti biasa.
 */
export function onCityAssetsEnter(cityId: string | undefined): void {
  const id = (cityId || '').toLowerCase().trim();
  if (!id) return;
  const prev = lastFetchedCityId;
  lastFetchedCityId = id;
  if (prev && prev !== id && !KEEP_IDS.has(prev)) {
    void purgeCityAssets(prev);
  }
}
