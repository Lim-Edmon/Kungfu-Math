/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useEffect, useState } from 'react';
import { t } from '../lib/i18n';

const HIDE_KEY = 'km_install_hint_hide';

function isStandaloneDisplay(): boolean {
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (nav.standalone === true) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Hanya tampil jika browser benar-benar menawarkan install (beforeinstallprompt).
 * - Sudah PWA / standalone → sembunyi
 * - User pilih Nanti / sudah install → sembunyi (localStorage)
 * - Tanpa event install (iOS, dll.) → tidak spam “cara pasang”
 */
export default function InstallHint() {
  const [deferred, setDeferred] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());

    const mq = window.matchMedia?.('(display-mode: standalone)');
    const onMq = () => setStandalone(isStandaloneDisplay());
    mq?.addEventListener?.('change', onMq);

    const handler = (e: Event) => {
      e.preventDefault();
      const ev = e as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      };
      setDeferred({
        prompt: async () => {
          await ev.prompt();
          try {
            const choice = await ev.userChoice;
            if (choice.outcome === 'accepted') {
              setHidden(true);
              localStorage.setItem(HIDE_KEY, '1');
            }
          } catch {
            /* ignore */
          }
        },
      });
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setHidden(true);
      setDeferred(null);
      try {
        localStorage.setItem(HIDE_KEY, '1');
      } catch {
        /* ignore */
      }
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      mq?.removeEventListener?.('change', onMq);
    };
  }, []);

  if (hidden || standalone || !deferred) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(HIDE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="install-hint">
      <p>{t('installTitle')}</p>
      <div className="install-hint-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => deferred.prompt()}
        >
          {t('installBtn')}
        </button>
        <button type="button" className="btn-ghost" onClick={dismiss}>
          {t('installLater')}
        </button>
      </div>
    </div>
  );
}
