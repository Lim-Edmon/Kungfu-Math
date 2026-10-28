/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { TRAKTEER_URL } from '../lib/constants';
import { t } from '../lib/i18n';

/**
 * Manusia: cukup "© Lim Edmon 2026" → /notice.html (halaman mudah dibaca).
 * Robot/crawler menemukan sendiri di path standar (tanpa link di UI):
 *   /robots.txt · /NOTICE.txt · LICENSE
 */
export default function Footer() {
  return (
    <footer className="app-footer">
      <a
        href={TRAKTEER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="footer-support"
      >
        {t('footerSupport')}
      </a>
      <p className="footer-legal">
        <a
          href="/notice.html"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-copy-link"
          title={t('footerNotice')}
          aria-label={t('footerNoticeAria')}
        >
          {t('footerCopy')}
        </a>
      </p>
    </footer>
  );
}
