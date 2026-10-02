/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useEffect, useState } from 'react';
import { t } from '../lib/i18n';

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
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true;
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
      <p>{t('installTitle')}</p>
      <div className="install-hint-actions">
        {deferred ? (
          <button type="button" className="btn-primary" onClick={() => deferred.prompt()}>
            {t('installBtn')}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={() => alert(t('installAlert'))}
          >
            {t('installHow')}
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={dismiss}>
          {t('installLater')}
        </button>
      </div>
    </div>
  );
}
