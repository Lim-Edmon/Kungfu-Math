/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

/** Satu sumber kebenaran untuk link dukungan */
export const TRAKTEER_URL = 'https://trakteer.id/lim.edmon';

export const APP_NAME = 'Kungfu Math';

/** URL resmi PWA (share / ajakan) */
export const APP_URL = 'https://kungfu-math.vercel.app/';

/**
 * Template ajakan ke keluarga / anak (WA, copy, share sistem).
 * Ringan, ramah, tanpa jargon.
 */
export function buildInviteText(): string {
  return (
    `Halo 👋\n\n` +
    `Coba deh main *Kungfu Math* bareng anak / keponakan / sepupu.\n` +
    `Belajar hitung cepat lewat game seru (slice & tap) — bukan flashcard biasa 😊\n\n` +
    `Gratis main di HP (bisa dipasang ke layar utama):\n` +
    `${APP_URL}\n\n` +
    `Semoga membantu anak lebih senang dan lebih cerdas berhitung.\n` +
    `Yuk cobain sebentar saja dulu! 🥋✨`
  );
}
