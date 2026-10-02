/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { t } from '../lib/i18n';

export type NavTab = 'home' | 'dojo' | 'settings';

interface BottomNavProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main menu">
      <button
        type="button"
        className={`bottom-nav-item ${active === 'home' ? 'active' : ''}`}
        onClick={() => onChange('home')}
      >
        <span className="bottom-nav-icon" aria-hidden>
          🥋
        </span>
        <span className="bottom-nav-label">{t('navLatihan')}</span>
      </button>
      <button
        type="button"
        className={`bottom-nav-item ${active === 'dojo' ? 'active' : ''}`}
        onClick={() => onChange('dojo')}
      >
        <span className="bottom-nav-icon" aria-hidden>
          🏯
        </span>
        <span className="bottom-nav-label">{t('navProgres')}</span>
      </button>
      <button
        type="button"
        className={`bottom-nav-item ${active === 'settings' ? 'active' : ''}`}
        onClick={() => onChange('settings')}
      >
        <span className="bottom-nav-icon" aria-hidden>
          ⚙️
        </span>
        <span className="bottom-nav-label">{t('navPengaturan')}</span>
      </button>
    </nav>
  );
}
