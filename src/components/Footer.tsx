/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { TRAKTEER_URL } from '../lib/constants';

/** Footer yang selalu muncul di setiap halaman */
export default function Footer() {
  return (
    <footer className="app-footer">
      <a
        href={TRAKTEER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="footer-support"
      >
        ☕ Dukung project ini
      </a>
      <p className="footer-copy">© Lim Edmon 2026</p>
    </footer>
  );
}
