import { useEffect, useState } from 'react';

/**
 * Banner kecil: ajak user pasang app ke layar utama (PWA).
 * Muncul jika browser mendukung beforeinstallprompt (Chrome Android dll).
 */
export default function InstallHint() {
  const [deferred, setDeferred] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
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
          if (choice.outcome === 'accepted') setHidden(true);
        },
      });
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (hidden || !deferred) return null;

  return (
    <div className="install-hint">
      <p>Pasang Kungfu Math di HP biar lebih mudah dibuka</p>
      <div className="install-hint-actions">
        <button type="button" className="btn-primary" onClick={() => deferred.prompt()}>
          Pasang
        </button>
        <button type="button" className="btn-ghost" onClick={() => setHidden(true)}>
          Nanti
        </button>
      </div>
    </div>
  );
}
