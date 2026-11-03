/**
 * Kungfu Math — App entry point.
 * Author: Lim Edmon · See src/App.tsx for full disclaimer.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Analytics } from '@vercel/analytics/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>
);

/** Sembunyikan splash boot setelah React siap */
function hideBootSplash() {
  const el = document.getElementById('boot-splash');
  if (!el) return;
  el.classList.add('boot-hide');
  window.setTimeout(() => el.remove(), 300);
}
// Biarkan splash (logo + judul + ©) sempat terbaca
window.setTimeout(hideBootSplash, 600);

/**
 * Banner update: user klik “Muat ulang” (bukan auto-reload diam-diam).
 * Banyak orang tidak tahu pull-to-refresh.
 */
function showUpdateBanner() {
  if (document.getElementById('km-update-banner')) return;

  let lang = 'id';
  try {
    const raw = localStorage.getItem('kungfu-math-progress');
    if (raw) {
      const j = JSON.parse(raw) as { language?: string };
      if (j.language === 'en') lang = 'en';
    } else if (!(navigator.language || '').toLowerCase().startsWith('id')) {
      lang = 'en';
    }
  } catch {
    /* ignore */
  }

  const msg =
    lang === 'en'
      ? 'Update available. Reload for new cities and features.'
      : 'Ada pembaruan. Muat ulang untuk kota/fitur baru.';
  const btnLabel = lang === 'en' ? 'Reload' : 'Muat ulang';

  const bar = document.createElement('div');
  bar.id = 'km-update-banner';
  bar.setAttribute('role', 'status');
  bar.innerHTML =
    '<span class="km-update-msg"></span>' +
    '<button type="button" class="km-update-btn"></button>';
  const msgEl = bar.querySelector('.km-update-msg');
  const btnEl = bar.querySelector('.km-update-btn') as HTMLButtonElement | null;
  if (msgEl) msgEl.textContent = msg;
  if (btnEl) {
    btnEl.textContent = btnLabel;
    btnEl.addEventListener('click', () => {
      window.location.reload();
    });
  }
  document.body.appendChild(bar);
}

/**
 * Service Worker (PWA):
 * - Cek update saat buka app
 * - Versi baru → tampilkan banner + tombol Muat ulang (bukan reload paksa)
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (ev) => {
    if (ev.data && ev.data.type === 'SW_ACTIVATED') {
      showUpdateBanner();
    }
  });

  // controllerchange: SW baru mengontrol halaman — tawarkan reload, jangan paksa
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showUpdateBanner();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update().catch(() => {});
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        });
        // Ada worker menunggu (update terpasang)?
        if (reg.waiting) {
          showUpdateBanner();
        }
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });
      })
      .catch((err) => {
        console.warn('SW gagal didaftarkan:', err);
      });
  });
}
