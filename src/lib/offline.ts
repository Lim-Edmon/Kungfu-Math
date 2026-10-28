/** Kungfu Math — deteksi online/offline (client only) */

import { useEffect, useState } from 'react';

export function getIsOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  // navigator.onLine kadang tetap true di HP; tetap dipakai sebagai sinyal utama
  return navigator.onLine !== false;
}

/**
 * true = online.
 * Default true sampai effect jalan (hindari flash offline di first paint).
 * Listener online/offline + sync saat tab terlihat lagi.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(getIsOnline());
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    document.addEventListener('visibilitychange', sync);
    // Beberapa WebView jarang fire offline — cek saat fokus
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  return online;
}
