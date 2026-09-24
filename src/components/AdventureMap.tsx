/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { ADVENTURE_CITIES } from '../lib/adventure';

interface AdventureMapProps {
  unlockedIds: string[];
  activeId: string;
  onSelect?: (cityId: string) => void;
}

/**
 * Peta dunia (gambar) + pin dari mapX/mapY (persen 0–100, equirectangular).
 * Viewport di-zoom ke kawasan Asia Tenggara agar pin bisa diketuk.
 */
export default function AdventureMap({
  unlockedIds,
  activeId,
  onSelect,
}: AdventureMapProps) {
  const active = ADVENTURE_CITIES.find((c) => c.id === activeId) ?? ADVENTURE_CITIES[0];

  // Zoom region: long ~90–135E, lat ~20N–15S → persen pada peta 0–100
  // x: 75–87.5, y: 38.9–58.3 — sedikit longgar
  const pad = 4;
  const xs = ADVENTURE_CITIES.map((c) => c.mapX);
  const ys = ADVENTURE_CITIES.map((c) => c.mapY);
  let minX = Math.min(...xs) - pad;
  let maxX = Math.max(...xs) + pad;
  let minY = Math.min(...ys) - pad;
  let maxY = Math.max(...ys) + pad;
  // pastikan aspek tidak terlalu sempit
  if (maxX - minX < 12) {
    const m = (minX + maxX) / 2;
    minX = m - 6;
    maxX = m + 6;
  }
  if (maxY - minY < 12) {
    const m = (minY + maxY) / 2;
    minY = m - 6;
    maxY = m + 6;
  }
  const vbW = maxX - minX;
  const vbH = maxY - minY;

  const route = ADVENTURE_CITIES.map((c) => `${c.mapX},${c.mapY}`).join(' ');

  return (
    <div className="adventure-map-wrap" aria-label="Peta jalur petualangan">
      <svg
        className="adventure-map"
        viewBox={`${minX} ${minY} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
      >
        <image
          href="/cities/map/world.webp"
          x={0}
          y={0}
          width={100}
          height={100}
          preserveAspectRatio="none"
        />
        <polyline
          points={route}
          fill="none"
          stroke="#c41e3a"
          strokeWidth={vbW * 0.012}
          strokeDasharray={`${vbW * 0.02} ${vbW * 0.015}`}
          opacity="0.65"
        />
        {ADVENTURE_CITIES.map((c) => {
          const open = unlockedIds.includes(c.id) || c.id === 'jakarta';
          const isActive = activeId === c.id;
          const r = isActive ? vbW * 0.035 : vbW * 0.028;
          const short =
            c.id === 'kuala-lumpur'
              ? 'KL'
              : c.id === 'yogyakarta'
                ? 'Yogya'
                : c.nameId;
          return (
            <g
              key={c.id}
              onClick={() => {
                if (open && onSelect) onSelect(c.id);
              }}
              style={{ cursor: open ? 'pointer' : 'default' }}
            >
              <circle
                cx={c.mapX}
                cy={c.mapY}
                r={r}
                fill={open ? (isActive ? '#c41e3a' : '#2e7d32') : '#9e9e9e'}
                stroke="#fff"
                strokeWidth={vbW * 0.008}
              />
              <text
                x={c.mapX}
                y={c.mapY - r * 1.35}
                textAnchor="middle"
                fontSize={vbW * 0.055}
                fill="#1b5e20"
                fontWeight="700"
                stroke="#fff"
                strokeWidth={vbW * 0.008}
                paintOrder="stroke"
              >
                {short}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="adventure-map-legend">
        Zoom kawasan aktif · hijau terbuka · merah dipilih · abu terkunci
        {active ? ` · fokus: ${active.nameId}` : ''}
      </p>
    </div>
  );
}
