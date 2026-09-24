/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { ADVENTURE_CITIES } from '../lib/adventure';

interface AdventureMapProps {
  unlockedIds: string[];
  activeId: string;
  onSelect?: (cityId: string) => void;
}

/** Rasio peta dunia (world.webp) — jangan distorsi */
const MAP_ASPECT = 1600 / 872;

/**
 * Pin = mapX/mapY ABSOLUT di world.webp (0–100 % gambar penuh).
 * Zoom hanya memotong tampilan; tidak mengubah arti mapX/mapY.
 * Zoom ke bounding box kota + padding, viewBox aspek = MAP_ASPECT (tidak gepeng).
 */
export default function AdventureMap({
  unlockedIds,
  activeId,
  onSelect,
}: AdventureMapProps) {
  const active =
    ADVENTURE_CITIES.find((c) => c.id === activeId) ?? ADVENTURE_CITIES[0];

  const xs = ADVENTURE_CITIES.map((c) => c.mapX);
  const ys = ADVENTURE_CITIES.map((c) => c.mapY);
  const pad = 3.5;
  let minX = Math.min(...xs) - pad;
  let maxX = Math.max(...xs) + pad;
  let minY = Math.min(...ys) - pad;
  let maxY = Math.max(...ys) + pad;

  let vbW = maxX - minX;
  let vbH = maxY - minY;
  // Samakan aspek viewBox dengan gambar (tidak ubah ratio saat zoom)
  const targetAspect = MAP_ASPECT; // width/height
  if (vbW / vbH > targetAspect) {
    // terlalu lebar → tambah tinggi
    const needH = vbW / targetAspect;
    const extra = needH - vbH;
    minY -= extra / 2;
    maxY += extra / 2;
    vbH = needH;
  } else {
    const needW = vbH * targetAspect;
    const extra = needW - vbW;
    minX -= extra / 2;
    maxX += extra / 2;
    vbW = needW;
  }

  const route = ADVENTURE_CITIES.map((c) => `${c.mapX},${c.mapY}`).join(' ');
  const pinR = Math.min(vbW, vbH) * 0.022;
  const fontSize = Math.min(vbW, vbH) * 0.045;

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
          strokeWidth={Math.min(vbW, vbH) * 0.008}
          strokeDasharray={`${vbW * 0.015} ${vbW * 0.012}`}
          opacity="0.6"
        />
        {ADVENTURE_CITIES.map((c) => {
          const open = unlockedIds.includes(c.id) || c.id === 'jakarta';
          const isActive = activeId === c.id;
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
                r={isActive ? pinR * 1.25 : pinR}
                fill={open ? (isActive ? '#c41e3a' : '#2e7d32') : '#9e9e9e'}
                stroke="#fff"
                strokeWidth={pinR * 0.25}
              />
              <text
                x={c.mapX}
                y={c.mapY - pinR * 1.5}
                textAnchor="middle"
                fontSize={fontSize}
                fill="#1b5e20"
                fontWeight="700"
                stroke="#fff"
                strokeWidth={fontSize * 0.12}
                paintOrder="stroke"
              >
                {short}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="adventure-map-legend">
        Hijau = terbuka · Merah = dipilih · Abu = terkunci
        {active ? ` · ${active.nameId}` : ''}
      </p>
    </div>
  );
}
