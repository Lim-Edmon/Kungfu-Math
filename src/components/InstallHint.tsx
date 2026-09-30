/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useEffect, useState } from 'react';

/**
 * Banner PWA: pasang ke layar utama.
 * - Chrome Android: tombol Pasang (beforeinstallprompt)
 * - Lainnya: petunjuk singkat manual
 */
export default function InstallHint() {
  const [deferred, setDeferred] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem('km_install_hint_hide') === '1';
    } catch {
      return false;
    }
  });
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    try {
      const sw =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setStandalone(!!sw);
    } catch {
      /* ignore */
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const ev = e as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      };
      setDeferred({
        prompt: async () => {
          await ev.prompt();
          const choice = await ev.userChoice;
          if (choice.outcome === 'accepted') {
            setHidden(true);
            try {
              localStorage.setItem('km_install_hint_hide', '1');
            } catch {
              /* ignore */
            }
          }
        },
      });
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (hidden || standalone) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem('km_install_hint_hide', '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="install-hint">
      <p>Pasang Kungfu Math di HP biar lebih mudah dibuka</p>
      <div className="install-hint-actions">
        {deferred ? (
          <button type="button" className="btn-primary" onClick={() => deferred.prompt()}>
            Pasang
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              alert(
                'Cara pasang:\n\n' +
                  '• Chrome Android: menu ⋮ → “Tambahkan ke layar utama” / “Install app”\n' +
                  '• Safari iPhone: tombol Bagikan → “Ke Layar Utama”\n' +
                  '• Laptop Chrome: ikon install di kanan address bar (jika ada)'
              );
            }}
          >
            Cara pasang
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={dismiss}>
          Nanti
        </button>
      </div>
    </div>
  );
}
