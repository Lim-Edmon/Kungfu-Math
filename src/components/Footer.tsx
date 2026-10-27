/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { TRAKTEER_URL } from '../lib/constants';
import { t } from '../lib/i18n';

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
        <a href="/NOTICE.txt" target="_blank" rel="noopener noreferrer">
          {t('footerNotice')}
        </a>
        {' · '}
        <span className="footer-copy">{t('footerCopy')}</span>
      </p>
    </footer>
  );
}
