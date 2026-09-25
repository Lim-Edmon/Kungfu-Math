/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useEffect, useMemo, useState } from 'react';
import { ADVENTURE_CITIES } from '../lib/adventure';

/** Aktifkan dengan ?mapdebug=1 di URL (dev atur pin tanpa edit-kode bolak-balik) */
function useMapDebug(): boolean {
  return useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('mapdebug') === '1';
    } catch {
      return false;
    }
  }, []);
}

interface AdventureMapProps {
  unlockedIds: string[];
  wonIds: string[];
  activeId: string;
  onSelect?: (cityId: string) => void;
  travelFromId?: string | null;
  travelToId?: string | null;
  onTravelDone?: () => void;
}

const MAP_ASPECT = 2800 / 1527; // world.webp aspect

export default function AdventureMap({
  unlockedIds,
  wonIds,
  activeId,
  onSelect,
  travelFromId,
  travelToId,
  onTravelDone,
}: AdventureMapProps) {
  const mapDebug = useMapDebug();
  const activeIdx = Math.max(
    0,
    ADVENTURE_CITIES.findIndex((c) => c.id === activeId)
  );
  // Debug: tampilkan semua kota. Normal: 1 sebelum + aktif + 2 sesudah
  const winStart = mapDebug
    ? 0
    : Math.max(0, activeIdx - 1);
  const winEnd = mapDebug
    ? ADVENTURE_CITIES.length - 1
    : Math.min(ADVENTURE_CITIES.length - 1, activeIdx + 2);
  const windowCities = ADVENTURE_CITIES.slice(winStart, winEnd + 1);

  const xs = windowCities.map((c) => c.mapX);
  const ys = windowCities.map((c) => c.mapY);
  const pad = mapDebug ? 4 : 1.4;
  let minX = Math.min(...xs) - pad;
  let maxX = Math.max(...xs) + pad;
  let minY = Math.min(...ys) - pad;
  let maxY = Math.max(...ys) + pad;

  const minSpan = mapDebug ? 12 : 3.2;
  if (maxX - minX < minSpan) {
    const m = (minX + maxX) / 2;
    minX = m - minSpan / 2;
    maxX = m + minSpan / 2;
  }
  if (maxY - minY < minSpan) {
    const m = (minY + maxY) / 2;
    minY = m - minSpan / 2;
    maxY = m + minSpan / 2;
  }

  let vbW = maxX - minX;
  let vbH = maxY - minY;
  if (vbW / vbH > MAP_ASPECT) {
    const needH = vbW / MAP_ASPECT;
    const extra = needH - vbH;
    minY -= extra / 2;
    maxY += extra / 2;
    vbH = needH;
  } else {
    const needW = vbH * MAP_ASPECT;
    const extra = needW - vbW;
    minX -= extra / 2;
    maxX += extra / 2;
    vbW = needW;
  }

  const pinR = Math.min(vbW, vbH) * 0.028;
  const fontSize = Math.min(vbW, vbH) * 0.055;

  const fromCity = travelFromId
    ? ADVENTURE_CITIES.find((c) => c.id === travelFromId)
    : null;
  const toCity = travelToId
    ? ADVENTURE_CITIES.find((c) => c.id === travelToId)
    : null;
  const traveling = !!(fromCity && toCity);

  const [t, setT] = useState(0);

  useEffect(() => {
    if (!traveling) {
      setT(0);
      return;
    }
    setT(0);
    let raf = 0;
    const start = performance.now();
    const dur = 1000;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onTravelDone?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [travelFromId, travelToId, traveling, onTravelDone]);

  const planeX =
    traveling && fromCity && toCity
      ? fromCity.mapX + (toCity.mapX - fromCity.mapX) * t
      : 0;
  const planeY =
    traveling && fromCity && toCity
      ? fromCity.mapY + (toCity.mapY - fromCity.mapY) * t
      : 0;

  // Tampilkan pin di window + sedikit tetangga agar konteks
  const renderStart = Math.max(0, winStart - 1);
  const renderEnd = Math.min(ADVENTURE_CITIES.length - 1, winEnd + 1);
  const renderCities = ADVENTURE_CITIES.slice(renderStart, renderEnd + 1);

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

        {traveling && fromCity && toCity && (
          <line
            x1={fromCity.mapX}
            y1={fromCity.mapY}
            x2={fromCity.mapX + (toCity.mapX - fromCity.mapX) * t}
            y2={fromCity.mapY + (toCity.mapY - fromCity.mapY) * t}
            stroke="#c41e3a"
            strokeWidth={Math.min(vbW, vbH) * 0.01}
            strokeDasharray={`${vbW * 0.02} ${vbW * 0.015}`}
            opacity="0.85"
          />
        )}

        {renderCities.map((c) => {
          const open = unlockedIds.includes(c.id) || c.id === 'jakarta';
          const won = wonIds.includes(c.id);
          const isActive = activeId === c.id;
          const short =
            c.id === 'kuala-lumpur'
              ? 'KL'
              : c.id === 'yogyakarta'
                ? 'Yogya'
                : c.nameId;

          let shape;
          const stroke = '#fff';
          const sw = pinR * 0.3;

          if (!open) {
            const s = pinR * 1.2;
            shape = (
              <polygon
                points={`${c.mapX},${c.mapY - s} ${c.mapX - s},${c.mapY + s * 0.7} ${c.mapX + s},${c.mapY + s * 0.7}`}
                fill="#9e9e9e"
                stroke={stroke}
                strokeWidth={sw}
              />
            );
          } else if (won && !isActive) {
            const s = pinR * 1.2;
            shape = (
              <polygon
                points={`${c.mapX},${c.mapY - s} ${c.mapX + s},${c.mapY} ${c.mapX},${c.mapY + s} ${c.mapX - s},${c.mapY}`}
                fill="#1565c0"
                stroke={stroke}
                strokeWidth={sw}
              />
            );
          } else if (isActive) {
            const r = pinR * 1.1;
            shape = (
              <g>
                <path
                  d={`M ${c.mapX} ${c.mapY + r * 1.55}
                     C ${c.mapX + r * 1.15} ${c.mapY + r * 0.15}, ${c.mapX + r} ${c.mapY - r * 0.25}, ${c.mapX} ${c.mapY - r}
                     C ${c.mapX - r} ${c.mapY - r * 0.25}, ${c.mapX - r * 1.15} ${c.mapY + r * 0.15}, ${c.mapX} ${c.mapY + r * 1.55} Z`}
                  fill="#2e7d32"
                  stroke={stroke}
                  strokeWidth={sw}
                />
                <circle
                  cx={c.mapX}
                  cy={c.mapY - r * 0.12}
                  r={r * 0.32}
                  fill="#fff"
                />
              </g>
            );
          } else {
            shape = (
              <circle
                cx={c.mapX}
                cy={c.mapY}
                r={pinR}
                fill="#66bb6a"
                stroke={stroke}
                strokeWidth={sw}
              />
            );
          }

          return (
            <g
              key={c.id}
              onClick={() => {
                if (open && onSelect) onSelect(c.id);
              }}
              style={{ cursor: open ? 'pointer' : 'default' }}
            >
              {shape}
              <text
                x={c.mapX}
                y={c.mapY - pinR * 2.0}
                textAnchor="middle"
                fontSize={fontSize}
                fill="#1b5e20"
                fontWeight="700"
                stroke="#fff"
                strokeWidth={fontSize * 0.1}
                paintOrder="stroke"
              >
                {mapDebug
                  ? `${short} ${c.mapX.toFixed(1)},${c.mapY.toFixed(1)}`
                  : short}
              </text>
            </g>
          );
        })}

        {traveling && fromCity && toCity && (() => {
          // Asset plane.png default moncong ATAS. Rotasi ke tujuan.
          // SVG: X kanan, Y bawah. 0° = atas (-Y).
          const dx = toCity.mapX - fromCity.mapX;
          const dy = toCity.mapY - fromCity.mapY;
          const rot = (Math.atan2(dx, -dy) * 180) / Math.PI;
          const s = Math.min(vbW, vbH) * (mapDebug ? 0.06 : 0.09);
          return (
            <image
              href="/cities/map/plane.png"
              x={planeX - s / 2}
              y={planeY - s / 2}
              width={s}
              height={s}
              transform={`rotate(${rot}, ${planeX}, ${planeY})`}
              style={{ pointerEvents: 'none' }}
            />
          );
        })()}
      </svg>
      <p className="adventure-map-legend">
        {mapDebug ? (
          <>
            MODE DEBUG PIN — label = mapX, mapY · edit di{' '}
            <code>src/lib/adventure.ts</code> · matikan: hapus{' '}
            <code>?mapdebug=1</code>
          </>
        ) : (
          <>Ketuk pin di peta · 📍 aktif · ◆ menang · ▲ terkunci</>
        )}
      </p>
    </div>
  );
}
