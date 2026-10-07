/**
 * Kungfu Math — App entry point.
 * Author: Lim Edmon · See src/App.tsx for full disclaimer.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/** Sembunyikan splash boot setelah React siap */
function hideBootSplash() {
  const el = document.getElementById('boot-splash');
  if (!el) return;
  el.classList.add('boot-hide');
  window.setTimeout(() => el.remove(), 300);
}
// Setelah frame pertama
// Biarkan splash (logo + judul + ©) sempat terbaca
window.setTimeout(hideBootSplash, 600);

/**
 * Service Worker (PWA):
 * - Cek update saat buka app
 * - Versi baru aktif → hapus cache lama (di sw.js) + reload sekali
 * User tidak perlu "Clear site data" manual untuk aset baru (peta, dll.)
 */
if ('serviceWorker' in navigator) {
  let reloading = false;
  const reloadOnce = () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);
  navigator.serviceWorker.addEventListener('message', (ev) => {
    if (ev.data && ev.data.type === 'SW_ACTIVATED') reloadOnce();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update().catch(() => {});
        // Cek update lagi saat tab kembali fokus
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        });
      })
      .catch((err) => {
        console.warn('SW gagal didaftarkan:', err);
      });
  });
}
