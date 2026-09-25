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

/** Daftarkan Service Worker (PWA) */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW gagal didaftarkan:', err);
    });
  });
}
