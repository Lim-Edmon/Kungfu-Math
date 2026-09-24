/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { ADVENTURE_CITIES } from '../lib/adventure';

interface AdventureMapProps {
  unlockedIds: string[];
  activeId: string;
  onSelect?: (cityId: string) => void;
}

/**
 * Peta stilasi Asia Tenggara (SVG).
 * Pin = mapX/mapY di adventure.ts (persen viewBox 0–100, barat← →timur, utara↑).
 */
export default function AdventureMap({
  unlockedIds,
  activeId,
  onSelect,
}: AdventureMapProps) {
  const route = ADVENTURE_CITIES.map((c) => `${c.mapX},${c.mapY}`).join(' ');

  return (
    <div className="adventure-map-wrap" aria-label="Peta jalur petualangan">
      <svg
        className="adventure-map"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        role="img"
      >
        <defs>
          <linearGradient id="mapSea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#81d4fa" />
            <stop offset="100%" stopColor="#e1f5fe" />
          </linearGradient>
          <linearGradient id="mapLand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c8e6c9" />
            <stop offset="100%" stopColor="#a5d6a7" />
          </linearGradient>
        </defs>

        {/* laut */}
        <rect width="100" height="100" rx="4" fill="url(#mapSea)" />

        {/* siluet kasar daratan — stilasi, bukan GIS presisi */}
        {/* Sumatera */}
        <path
          fill="url(#mapLand)"
          stroke="#81c784"
          strokeWidth="0.3"
          d="M14,18 L20,16 L26,22 L28,36 L26,48 L22,58 L16,62 L12,52 L10,36 L12,24 Z"
        />
        {/* Semenanjung Malaysia */}
        <path
          fill="url(#mapLand)"
          stroke="#81c784"
          strokeWidth="0.3"
          d="M34,12 L44,14 L46,22 L44,34 L42,42 L40,48 L36,46 L34,36 L32,22 Z"
        />
        {/* Jawa */}
        <path
          fill="url(#mapLand)"
          stroke="#81c784"
          strokeWidth="0.3"
          d="M42,56 L52,54 L64,56 L72,58 L74,64 L66,68 L54,70 L46,68 L40,62 Z"
        />
        {/* Bali (kecil) */}
        <ellipse cx="76" cy="70" rx="3.5" ry="2.2" fill="url(#mapLand)" stroke="#81c784" strokeWidth="0.3" />
        {/* Sulawesi kasar */}
        <path
          fill="url(#mapLand)"
          stroke="#81c784"
          strokeWidth="0.3"
          d="M84,42 L90,40 L94,48 L92,58 L86,62 L82,54 L80,48 Z"
        />
        {/* Kalimantan potongan barat (opsional nuansa) */}
        <path
          fill="url(#mapLand)"
          stroke="#81c784"
          strokeWidth="0.3"
          opacity="0.85"
          d="M58,28 L72,26 L78,36 L74,48 L62,50 L56,40 Z"
        />

        {/* jalur petualangan (urutan unlock, bukan jarak terdekat) */}
        <polyline
          points={route}
          fill="none"
          stroke="#c41e3a"
          strokeWidth="0.7"
          strokeDasharray="1.2 0.9"
          opacity="0.55"
        />

        {ADVENTURE_CITIES.map((c) => {
          const unlocked = unlockedIds.includes(c.id) || c.id === 'jakarta';
          const active = activeId === c.id;
          const short =
            c.id === 'kuala-lumpur'
              ? 'KL'
              : c.id === 'yogyakarta'
                ? 'Yogya'
                : c.nameId;
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
                r={active ? 2.6 : 2.1}
                fill={unlocked ? (active ? '#c41e3a' : '#2e7d32') : '#bdbdbd'}
                stroke="#fff"
                strokeWidth="0.55"
              />
              <text
                x={c.mapX}
                y={c.mapY - 3.2}
                textAnchor="middle"
                fontSize="2.4"
                fill="#1b5e20"
                fontWeight="700"
              >
                {short}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="adventure-map-legend">
        Hijau = terbuka · Merah = kota aktif · Abu = terkunci — ketuk pin
      </p>
    </div>
  );
}
