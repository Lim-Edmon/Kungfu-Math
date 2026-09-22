/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

export type NavTab = 'home' | 'dojo' | 'settings';

interface BottomNavProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Menu utama">
      <button
        type="button"
        className={`bottom-nav-item ${active === 'home' ? 'active' : ''}`}
        onClick={() => onChange('home')}
      >
        <span className="bottom-nav-icon" aria-hidden>
          🥋
        </span>
        <span className="bottom-nav-label">Latihan</span>
      </button>
      <button
        type="button"
        className={`bottom-nav-item ${active === 'dojo' ? 'active' : ''}`}
        onClick={() => onChange('dojo')}
      >
        <span className="bottom-nav-icon" aria-hidden>
          🏯
        </span>
        <span className="bottom-nav-label">Dojo</span>
      </button>
      <button
        type="button"
        className={`bottom-nav-item ${active === 'settings' ? 'active' : ''}`}
        onClick={() => onChange('settings')}
      >
        <span className="bottom-nav-icon" aria-hidden>
          ⚙️
        </span>
        <span className="bottom-nav-label">Atur</span>
      </button>
    </nav>
  );
}
