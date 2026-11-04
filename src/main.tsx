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
window.setTimeout(hideBootSplash, 600);

function detectLang(): 'id' | 'en' {
  try {
    const raw = localStorage.getItem('kungfu-math-progress');
    if (raw) {
      const j = JSON.parse(raw) as { language?: string };
      if (j.language === 'en') return 'en';
      if (j.language === 'id') return 'id';
    }
  } catch {
    /* ignore */
  }
  return (navigator.language || '').toLowerCase().startsWith('id') ? 'id' : 'en';
}

/**
 * Popup tengah: ada pembaruan + tombol Muat ulang.
 * Tidak auto-reload — user yang klik (banyak yang tidak tahu pull-to-refresh).
 */
function showUpdateBanner() {
  if (document.getElementById('km-update-banner')) return;

  const lang = detectLang();
  const title =
    lang === 'en' ? 'Update available' : 'Ada pembaruan';
  const msg =
    lang === 'en'
      ? 'A newer version is ready. Reload to get the latest improvements.'
      : 'Versi baru sudah siap. Muat ulang untuk mendapatkan pembaruan terbaru.';
  const btnLabel = lang === 'en' ? 'Reload now' : 'Muat ulang sekarang';

  const wrap = document.createElement('div');
  wrap.id = 'km-update-banner';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.innerHTML =
    '<div class="km-update-card">' +
    '<div class="km-update-title"></div>' +
    '<p class="km-update-msg"></p>' +
    '<button type="button" class="km-update-btn"></button>' +
    '</div>';

  const titleEl = wrap.querySelector('.km-update-title');
  const msgEl = wrap.querySelector('.km-update-msg');
  const btnEl = wrap.querySelector('.km-update-btn') as HTMLButtonElement | null;
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = msg;
  if (btnEl) {
    btnEl.textContent = btnLabel;
    btnEl.addEventListener('click', () => {
      // Aktifkan SW menunggu (jika ada), lalu reload
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
          })
          .catch(() => {});
      }
      window.setTimeout(() => window.location.reload(), 80);
    });
  }
  document.body.appendChild(wrap);
}

/**
 * Service Worker (PWA)
 * - Cek update saat buka / tab fokus
 * - Versi baru → popup tengah + tombol Muat ulang (bukan reload paksa)
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (ev) => {
    if (ev.data && ev.data.type === 'SW_ACTIVATED') {
      showUpdateBanner();
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showUpdateBanner();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        const tryPrompt = () => {
          if (reg.waiting) showUpdateBanner();
        };

        reg.update().catch(() => {});
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        });

        tryPrompt();

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
