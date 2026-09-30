/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useEffect, useMemo, useState } from 'react';
import { ADVENTURE_CITIES } from '../lib/adventure';

/**
 * Dev peta:
 *   ?mapdebug=1          → semua kota + zoom longgar
 *   ?mapdebug=1&mapzoom=2 → lebih zoom out (angka lebih besar = lebih jauh)
 *   ?mapdebug=1&mapzoom=0.6 → lebih zoom in
 */
function useMapDebug(): { on: boolean; zoom: number } {
  return useMemo(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const on = q.get('mapdebug') === '1';
      const z = parseFloat(q.get('mapzoom') || '1');
      const zoom = Number.isFinite(z) && z > 0.2 && z < 20 ? z : 1;
      return { on, zoom };
    } catch {
      return { on: false, zoom: 1 };
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
  // Debug: semua kota. Normal: 2 sebelum + aktif + 2 sesudah
  const winStart = mapDebug.on ? 0 : Math.max(0, activeIdx - 2);
  const winEnd = mapDebug.on
    ? ADVENTURE_CITIES.length - 1
    : Math.min(ADVENTURE_CITIES.length - 1, activeIdx + 2);
  const windowCities = ADVENTURE_CITIES.slice(winStart, winEnd + 1);

  const xs = windowCities.map((c) => c.mapX);
  const ys = windowCities.map((c) => c.mapY);
  const pad = mapDebug.on ? 4 * mapDebug.zoom : 0.85;
  let minX = Math.min(...xs) - pad;
  let maxX = Math.max(...xs) + pad;
  let minY = Math.min(...ys) - pad;
  let maxY = Math.max(...ys) + pad;

  const minSpan = mapDebug.on ? 12 * mapDebug.zoom : 2.2;
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

  const pinR = Math.min(vbW, vbH) * (mapDebug.on ? 0.018 : 0.028);
  const fontSize = Math.min(vbW, vbH) * (mapDebug.on ? 0.028 : 0.055);

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

  const renderStart = Math.max(0, winStart - 1);
  const renderEnd = Math.min(ADVENTURE_CITIES.length - 1, winEnd + 1);
  const renderCities = ADVENTURE_CITIES.slice(renderStart, renderEnd + 1);

  /** Posisi % di frame peta (viewBox → kotak HTML, aspect sama = tanpa letterbox) */
  const pct = (mapX: number, mapY: number) => ({
    left: `${((mapX - minX) / vbW) * 100}%`,
    top: `${((mapY - minY) / vbH) * 100}%`,
  });

  return (
    <div className="adventure-map-wrap" aria-label="Peta jalur petualangan">
      <div className="adventure-map-frame">
        <svg
          className="adventure-map"
          viewBox={`${minX} ${minY} ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-hidden
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
              const s = pinR * 1.15;
              shape = (
                <polygon
                  points={`${c.mapX},${c.mapY - s} ${c.mapX - s * 0.95},${c.mapY + s * 0.65} ${c.mapX + s * 0.95},${c.mapY + s * 0.65}`}
                  fill="#9e9e9e"
                  stroke={stroke}
                  strokeWidth={sw}
                />
              );
            } else if (won && !isActive) {
              const s = pinR * 1.15;
              shape = (
                <polygon
                  points={`${c.mapX},${c.mapY - s} ${c.mapX + s},${c.mapY} ${c.mapX},${c.mapY + s} ${c.mapX - s},${c.mapY}`}
                  fill="#1565c0"
                  stroke={stroke}
                  strokeWidth={sw}
                />
              );
            } else if (isActive) {
              const r = pinR * 1.25;
              shape = (
                <g>
                  <circle
                    cx={c.mapX}
                    cy={c.mapY}
                    r={r * 1.35}
                    fill="none"
                    stroke="#2e7d32"
                    strokeWidth={r * 0.22}
                    opacity={0.45}
                  />
                  <circle
                    cx={c.mapX}
                    cy={c.mapY}
                    r={r}
                    fill="#2e7d32"
                    stroke={stroke}
                    strokeWidth={sw}
                  />
                  <circle
                    cx={c.mapX}
                    cy={c.mapY}
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
              <g key={c.id}>
                {shape}
                <text
                  x={c.mapX}
                  y={c.mapY - pinR * 2.15}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fill="#1b5e20"
                  fontWeight="700"
                  stroke="#fff"
                  strokeWidth={fontSize * 0.1}
                  paintOrder="stroke"
                >
                  {short}
                </text>
              </g>
            );
          })}

          {traveling && fromCity && toCity && (() => {
            const dx = toCity.mapX - fromCity.mapX;
            const dy = toCity.mapY - fromCity.mapY;
            const rot = (Math.atan2(dx, -dy) * 180) / Math.PI;
            const s = Math.min(vbW, vbH) * (mapDebug.on ? 0.06 : 0.14);
            return (
              <g
                transform={`rotate(${rot}, ${planeX}, ${planeY})`}
                style={{ pointerEvents: 'none' }}
              >
                <circle
                  cx={planeX}
                  cy={planeY}
                  r={s * 0.55}
                  fill="rgba(255, 120, 40, 0.45)"
                  stroke="#fff"
                  strokeWidth={s * 0.04}
                />
                <image
                  href="/cities/map/plane.png"
                  x={planeX - s / 2}
                  y={planeY - s / 2}
                  width={s}
                  height={s}
                  style={{
                    filter:
                      'brightness(1.2) saturate(1.35) drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
                  }}
                />
              </g>
            );
          })()}
        </svg>

        {/* Area ketuk HTML — pusat = pin kota (mapX/mapY), bukan hit-test SVG */}
        {renderCities.map((c) => {
          const open = unlockedIds.includes(c.id) || c.id === 'jakarta';
          if (!open || !onSelect) return null;
          const pos = pct(c.mapX, c.mapY);
          const isActive = activeId === c.id;
          return (
            <button
              key={`hit-${c.id}`}
              type="button"
              className={`adventure-map-hit${isActive ? ' is-active' : ''}${mapDebug.on ? ' is-debug' : ''}`}
              style={{ left: pos.left, top: pos.top }}
              aria-label={`Pilih ${c.nameId}`}
              onClick={() => onSelect(c.id)}
            />
          );
        })}
      </div>

      <p className="adventure-map-legend">
        {mapDebug.on ? (
          <>
            Debug pin · zoom={mapDebug.zoom} · edit mapX/mapY di adventure.ts ·{' '}
            <code>?mapdebug=1&amp;mapzoom=2</code> (out) /{' '}
            <code>mapzoom=0.6</code> (in)
          </>
        ) : (
          <>Ketuk pin di peta · 📍 aktif · ◆ menang · ▲ terkunci</>
        )}
      </p>
    </div>
  );
}
