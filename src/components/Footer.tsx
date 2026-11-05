/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { TRAKTEER_URL, KOFI_URL } from '../lib/constants';
import { t } from '../lib/i18n';

/**
 * Manusia: cukup "© Lim Edmon 2026" → /notice.html
 * "Dukung project ini" → popup di document.body (portal) agar di atas tombol Lanjut / bottom nav.
 */
export default function Footer() {
  const [open, setOpen] = useState(false);

  const modal =
    open &&
    createPortal(
      <div
        className="support-modal-backdrop"
        role="presentation"
        onClick={() => setOpen(false)}
      >
        <div
          className="support-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="support-modal-title">{t('supportModalTitle')}</h3>
          <p className="support-modal-note">{t('supportModalNote')}</p>
          <div className="support-links">
            <a
              href={TRAKTEER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-trakteer btn-trakteer-full"
            >
              {t('btnTrakteer')}
            </a>
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-kofi btn-trakteer-full"
            >
              {t('btnKofi')}
            </a>
          </div>
          <button
            type="button"
            className="support-modal-close"
            onClick={() => setOpen(false)}
          >
            {t('supportModalClose')}
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <footer className="app-footer">
      <button
        type="button"
        className="footer-support footer-support-btn"
        onClick={() => setOpen(true)}
      >
        {t('footerSupport')}
      </button>
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
      {modal}
    </footer>
  );
}
