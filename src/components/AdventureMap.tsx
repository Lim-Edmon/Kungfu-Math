/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { ADVENTURE_CITIES } from '../lib/adventure';

interface AdventureMapProps {
  unlockedIds: string[];
  activeId: string;
  onSelect?: (cityId: string) => void;
}

/**
 * Peta jalur MVP (SVG). Pin = mapX/mapY di adventure.ts (persen).
 * Ganti gambar peta nanti: sesuaikan mapX/mapY, bukan hardcode di PNG.
 */
export default function AdventureMap({
  unlockedIds,
  activeId,
  onSelect,
}: AdventureMapProps) {
  const points = ADVENTURE_CITIES.map((c) => `${c.mapX},${c.mapY}`).join(' ');

  return (
    <div className="adventure-map-wrap" aria-label="Peta jalur petualangan">
      <svg
        className="adventure-map"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        role="img"
      >
        <defs>
          <linearGradient id="mapSea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b3e5fc" />
            <stop offset="100%" stopColor="#e0f7fa" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="4" fill="url(#mapSea)" />
        {/* jalur */}
        <polyline
          points={points}
          fill="none"
          stroke="#c41e3a"
          strokeWidth="0.8"
          strokeDasharray="1.5 1"
          opacity="0.7"
        />
        {ADVENTURE_CITIES.map((c) => {
          const unlocked = unlockedIds.includes(c.id) || c.id === 'jakarta';
          const active = activeId === c.id;
          return (
            <g
              key={c.id}
              className={`map-pin ${unlocked ? 'is-open' : 'is-locked'} ${active ? 'is-active' : ''}`}
              onClick={() => {
                if (unlocked && onSelect) onSelect(c.id);
              }}
              style={{ cursor: unlocked ? 'pointer' : 'default' }}
            >
              <circle
                cx={c.mapX}
                cy={c.mapY}
                r={active ? 2.8 : 2.2}
                fill={unlocked ? (active ? '#c41e3a' : '#2e7d32') : '#9e9e9e'}
                stroke="#fff"
                strokeWidth="0.5"
              />
              <text
                x={c.mapX}
                y={c.mapY - 3.5}
                textAnchor="middle"
                fontSize="2.6"
                fill="#333"
                fontWeight="600"
              >
                {c.nameId.length > 10 ? c.nameId.slice(0, 8) + '…' : c.nameId}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="adventure-map-legend">
        🟢 terbuka · 🔴 kota aktif · ⚪ terkunci — ketuk pin untuk pilih
      </p>
    </div>
  );
}
