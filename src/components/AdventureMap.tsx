/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ADVENTURE_CITIES } from '../lib/adventure';
import { t as i18n } from '../lib/i18n';

/**
 * Dev peta — buka di browser (dev / production):
 *
 *   ?mapdebug=1
 *     → semua kota, zoom longgar, klik peta = dapat mapX/mapY
 *
 *   ?mapdebug=1&mapzoom=2
 *     → lebih zoom OUT (angka besar = lebih jauh)
 *
 *   ?mapdebug=1&mapzoom=0.5
 *     → lebih zoom IN
 *
 *   ?mapdebug=1&mapfocus=derawan
 *     → center zoom ke kota itu (id kecil, contoh: jakarta, derawan)
 *
 *   ?mapdebug=1&mapcenter=79.34,53.09&mapzoom=0.6
 *     → center ke koordinat manual + zoom
 *
 * Cara rapikan titik (contoh Derawan / Kalimantan):
 *   1. Buka URL: .../?mapdebug=1&mapfocus=derawan&mapzoom=0.45
 *   2. Klik di peta tepat di pulau/kota yang benar
 *   3. Salin mapX / mapY yang muncul di panel debug
 *   4. Tempel ke adventure.ts (field mapX, mapY kota itu)
 *   5. Refresh — pin harus tepat di titik klik
 */

type MapDebug = {
  on: boolean;
  zoom: number;
  focusId: string | null;
  center: { x: number; y: number } | null;
};

function useMapDebug(): MapDebug {
  return useMemo(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const on = q.get('mapdebug') === '1';
      const z = parseFloat(q.get('mapzoom') || '1');
      const zoom = Number.isFinite(z) && z > 0.15 && z < 30 ? z : 1;
      const focusId = (q.get('mapfocus') || '').toLowerCase().trim() || null;
      let center: { x: number; y: number } | null = null;
      const mc = q.get('mapcenter');
      if (mc) {
        const [a, b] = mc.split(',').map((s) => parseFloat(s.trim()));
        if (Number.isFinite(a) && Number.isFinite(b)) center = { x: a, y: b };
      }
      return { on, zoom, focusId, center };
    } catch {
      return { on: false, zoom: 1, focusId: null, center: null };
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
  const frameRef = useRef<HTMLDivElement>(null);
  const [clickCoord, setClickCoord] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const activeIdx = Math.max(
    0,
    ADVENTURE_CITIES.findIndex((c) => c.id === activeId)
  );

  /** Index kota terbuka paling jauh di jalur */
  const lastUnlockedIdx = useMemo(() => {
    let max = 0;
    ADVENTURE_CITIES.forEach((c, i) => {
      if (unlockedIds.includes(c.id) || c.id === 'jakarta') {
        if (i > max) max = i;
      }
    });
    return max;
  }, [unlockedIds]);

  /**
   * Kota terkunci yang BOLEH tampil pin:
   * hanya 2 kota berikutnya setelah kota terbuka terakhir.
   */
  const lockedPreviewIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 1; i <= 2; i++) {
      const c = ADVENTURE_CITIES[lastUnlockedIdx + i];
      if (c) ids.add(c.id);
    }
    return ids;
  }, [lastUnlockedIdx]);

  // —— Zoom window ——
  // Normal: aktif ± 2 kota (urutan jalur)
  // Debug + mapfocus/mapcenter: zoom ke titik itu
  let zoomCities = ADVENTURE_CITIES.slice(
    Math.max(0, activeIdx - 2),
    Math.min(ADVENTURE_CITIES.length, activeIdx + 3)
  );

  if (mapDebug.on) {
    if (mapDebug.focusId) {
      const fc = ADVENTURE_CITIES.find((c) => c.id === mapDebug.focusId);
      if (fc) zoomCities = [fc];
      else zoomCities = ADVENTURE_CITIES;
    } else if (mapDebug.center) {
      zoomCities = []; // pakai center manual di bawah
    } else {
      zoomCities = ADVENTURE_CITIES;
    }
  }

  let minX: number;
  let maxX: number;
  let minY: number;
  let maxY: number;

  if (mapDebug.on && mapDebug.center && zoomCities.length === 0) {
    const span = 8 * mapDebug.zoom;
    minX = mapDebug.center.x - span / 2;
    maxX = mapDebug.center.x + span / 2;
    minY = mapDebug.center.y - span / 2;
    maxY = mapDebug.center.y + span / 2;
  } else if (mapDebug.on && mapDebug.focusId && zoomCities.length === 1) {
    const c = zoomCities[0];
    const span = 6 * mapDebug.zoom;
    minX = c.mapX - span / 2;
    maxX = c.mapX + span / 2;
    minY = c.mapY - span / 2;
    maxY = c.mapY + span / 2;
  } else {
    const xs = zoomCities.map((c) => c.mapX);
    const ys = zoomCities.map((c) => c.mapY);
    const pad = mapDebug.on ? 3 * mapDebug.zoom : 0.85;
    minX = Math.min(...xs) - pad;
    maxX = Math.max(...xs) + pad;
    minY = Math.min(...ys) - pad;
    maxY = Math.max(...ys) + pad;

    const minSpan = mapDebug.on ? 10 * mapDebug.zoom : 2.2;
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

  const viewCenter = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };

  // pinR/fontSize dihitung ulang setelah zoom animasi (lihat drawPinR)

  const fromCity = travelFromId
    ? ADVENTURE_CITIES.find((c) => c.id === travelFromId)
    : null;
  const toCity = travelToId
    ? ADVENTURE_CITIES.find((c) => c.id === travelToId)
    : null;
  const traveling = !!(fromCity && toCity);

  const [t, setT] = useState(0);

  /** Zoom intro: world → target ~2 detik saat masuk / ganti kota aktif */
  const [zoomVB, setZoomVB] = useState({
    minX: 0,
    minY: 0,
    vbW: 100,
    vbH: 100,
  });

  useEffect(() => {
    if (mapDebug.on) {
      setZoomVB({ minX, minY, vbW, vbH });
      return;
    }
    // Mulai dari peta dunia penuh
    const start = { minX: 0, minY: 0, vbW: 100, vbH: 100 };
    const end = { minX, minY, vbW, vbH };
    setZoomVB(start);
    const dur = 2000;
    const t0 = performance.now();
    let raf = 0;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = ease(p);
      setZoomVB({
        minX: start.minX + (end.minX - start.minX) * e,
        minY: start.minY + (end.minY - start.minY) * e,
        vbW: start.vbW + (end.vbW - start.vbW) * e,
        vbH: start.vbH + (end.vbH - start.vbH) * e,
      });
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeId, minX, minY, vbW, vbH, mapDebug.on]);

  // Nilai view yang dipakai render (hasil animasi zoom)
  const drawMinX = zoomVB.minX;
  const drawMinY = zoomVB.minY;
  const drawVbW = zoomVB.vbW;
  const drawVbH = zoomVB.vbH;
  const drawMaxX = drawMinX + drawVbW;
  const drawMaxY = drawMinY + drawVbH;
  const pinR = Math.min(drawVbW, drawVbH) * (mapDebug.on ? 0.016 : 0.028);
  const fontSize = Math.min(drawVbW, drawVbH) * (mapDebug.on ? 0.022 : 0.055);

  useEffect(() => {
    if (!traveling) {
      setT(0);
      return;
    }
    setT(0);
    if (!fromCity || !toCity) return;
    // Kecepatan konstan (unit peta / detik) — bukan durasi tetap
    // jarak dekat → singkat; jarak jauh → lebih lama (bukan "flash")
    const dist = Math.hypot(
      toCity.mapX - fromCity.mapX,
      toCity.mapY - fromCity.mapY
    );
    const SPEED = 4.2; // map units per second (stabil)
    const dur = Math.max(700, Math.min(8000, (dist / SPEED) * 1000));
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onTravelDone?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [travelFromId, travelToId, traveling, onTravelDone, fromCity, toCity]);

  const planeX =
    traveling && fromCity && toCity
      ? fromCity.mapX + (toCity.mapX - fromCity.mapX) * t
      : 0;
  const planeY =
    traveling && fromCity && toCity
      ? fromCity.mapY + (toCity.mapY - fromCity.mapY) * t
      : 0;

  /** Apakah koordinat kota masuk viewBox (sedikit margin) */
  const inView = (mapX: number, mapY: number) => {
    const m = Math.min(drawVbW, drawVbH) * 0.05;
    return (
      mapX >= drawMinX - m &&
      mapX <= drawMaxX + m &&
      mapY >= drawMinY - m &&
      mapY <= drawMaxY + m
    );
  };

  /**
   * Pin yang ditampilkan:
   * - Debug: semua kota
   * - Normal:
   *   • kota terbuka / menang → jika dalam zoom
   *   • kota terkunci → HANYA 2 berikutnya setelah terbuka terakhir
   *     (meski secara geografis masuk zoom, kota ke-3+ tidak tampil)
   */
  const renderCities = mapDebug.on
    ? ADVENTURE_CITIES
    : ADVENTURE_CITIES.filter((c) => {
        const open = unlockedIds.includes(c.id) || c.id === 'jakarta';
        const won = wonIds.includes(c.id);
        if (open || won) {
          return inView(c.mapX, c.mapY);
        }
        // terkunci: hanya 2 preview
        return lockedPreviewIds.has(c.id);
      });

  const pct = (mapX: number, mapY: number) => ({
    left: `${((mapX - drawMinX) / drawVbW) * 100}%`,
    top: `${((mapY - drawMinY) / drawVbH) * 100}%`,
  });

  /** Klik peta (debug) → koordinat absolut 0–100 */
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapDebug.on || !frameRef.current) return;
    // jangan ambil klik dari tombol pin
    if ((e.target as HTMLElement).closest('.adventure-map-hit')) return;
    const rect = frameRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const mapX = drawMinX + px * drawVbW;
    const mapY = drawMinY + py * drawVbH;
    setClickCoord({
      x: Math.round(mapX * 100) / 100,
      y: Math.round(mapY * 100) / 100,
    });
    setCopied(false);
  };

  const copyCoord = async () => {
    if (!clickCoord) return;
    const text = `mapX: ${clickCoord.x},\n    mapY: ${clickCoord.y},`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="adventure-map-wrap" aria-label="Peta jalur petualangan">
      <div
        className={`adventure-map-frame${mapDebug.on ? ' is-debug' : ''}`}
        ref={frameRef}
        onClick={handleMapClick}
      >
        <svg
          className="adventure-map"
          viewBox={`${drawMinX} ${drawMinY} ${drawVbW} ${drawVbH}`}
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
              strokeWidth={Math.min(drawVbW, drawVbH) * 0.01}
              strokeDasharray={`${drawVbW * 0.02} ${drawVbW * 0.015}`}
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
                  {mapDebug.on ? `${c.nameId}` : short}
                </text>
                {mapDebug.on && (
                  <text
                    x={c.mapX}
                    y={c.mapY + pinR * 2.4}
                    textAnchor="middle"
                    fontSize={fontSize * 0.85}
                    fill="#333"
                    stroke="#fff"
                    strokeWidth={fontSize * 0.08}
                    paintOrder="stroke"
                  >
                    {c.mapX.toFixed(1)},{c.mapY.toFixed(1)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Tanda klik debug */}
          {mapDebug.on && clickCoord && (
            <g>
              <circle
                cx={clickCoord.x}
                cy={clickCoord.y}
                r={pinR * 0.9}
                fill="none"
                stroke="#e65100"
                strokeWidth={pinR * 0.25}
              />
              <circle
                cx={clickCoord.x}
                cy={clickCoord.y}
                r={pinR * 0.25}
                fill="#e65100"
              />
            </g>
          )}

          {traveling && fromCity && toCity && (() => {
            const dx = toCity.mapX - fromCity.mapX;
            const dy = toCity.mapY - fromCity.mapY;
            const rot = (Math.atan2(dx, -dy) * 180) / Math.PI;
            const s = Math.min(drawVbW, drawVbH) * (mapDebug.on ? 0.06 : 0.14);
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

        {/* Area ketuk HTML — pusat = pin kota */}
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
              onClick={(e) => {
                e.stopPropagation();
                onSelect(c.id);
              }}
            />
          );
        })}
      </div>

      {mapDebug.on && (
        <div className="map-debug-panel">
          <p>
            <strong>Mode debug peta</strong>
          </p>
          <p>
            Center view: <code>{viewCenter.x.toFixed(2)}, {viewCenter.y.toFixed(2)}</code>
            {' · '}
            span ≈ {vbW.toFixed(1)} × {vbH.toFixed(1)}
          </p>
          {clickCoord ? (
            <p>
              Klik: <code>mapX: {clickCoord.x}, mapY: {clickCoord.y}</code>{' '}
              <button type="button" className="btn-ghost map-debug-copy" onClick={copyCoord}>
                {copied ? 'Tersalin ✓' : 'Salin'}
              </button>
            </p>
          ) : (
            <p>Klik di peta untuk ambil mapX/mapY titik itu.</p>
          )}
          <p className="map-debug-hint">
            Fokus kota:{' '}
            <code>?mapdebug=1&amp;mapfocus=derawan&amp;mapzoom=0.45</code>
            <br />
            Fokus koordinat:{' '}
            <code>?mapdebug=1&amp;mapcenter=79.34,53.09&amp;mapzoom=0.5</code>
            <br />
            Zoom out: <code>mapzoom=2</code> · Zoom in: <code>mapzoom=0.4</code>
          </p>
        </div>
      )}

      <p className="adventure-map-legend">
        {mapDebug.on ? (
          <>Debug · klik peta = koordinat · edit di adventure.ts</>
        ) : (
          <>{i18n('mapLegend')}</>
        )}
      </p>
    </div>
  );
}
