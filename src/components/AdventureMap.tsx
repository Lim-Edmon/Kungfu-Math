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
 *   1. Buka URL: .../?mapdebug=1  (langsung ke petualangan, semua kota terbuka)
 *   2. Klik chip kota / pin — peta zoom ke kota itu (tanpa refresh, tanpa main)
 *   3. Klik di peta tepat di titik yang benar → panel mapX/mapY
 *   4. Salin ke adventure.ts (field mapX, mapY)
 *   Opsional: &mapfocus=derawan&mapzoom=0.45  |  &mapcenter=x,y
 *   Cek aset BG/musik: panel di bawah peta (mode debug)
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
      const on = q.get('mapdebug') === '1' || q.get('advdebug') === '1';
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

const MAP_ASPECT = 5760 / 2880; // world.webp aspect (full world 2:1)

type ViewBox = { minX: number; minY: number; vbW: number; vbH: number };

/** Konversi pixel frame → koordinat peta (perhitungkan letterbox meet) */
function clientToMap(
  clientX: number,
  clientY: number,
  frame: HTMLDivElement,
  vb: ViewBox
): { x: number; y: number } {
  const rect = frame.getBoundingClientRect();
  const fw = rect.width;
  const fh = rect.height;
  const lx = clientX - rect.left;
  const ly = clientY - rect.top;
  const vbAspect = vb.vbW / Math.max(0.0001, vb.vbH);
  const elAspect = fw / Math.max(0.0001, fh);
  let contentW = fw;
  let contentH = fh;
  let offsetX = 0;
  let offsetY = 0;
  if (elAspect > vbAspect) {
    contentW = fh * vbAspect;
    offsetX = (fw - contentW) / 2;
  } else {
    contentH = fw / vbAspect;
    offsetY = (fh - contentH) / 2;
  }
  const nx = (lx - offsetX) / Math.max(0.0001, contentW);
  const ny = (ly - offsetY) / Math.max(0.0001, contentH);
  return {
    x: vb.minX + nx * vb.vbW,
    y: vb.minY + ny * vb.vbH,
  };
}

/** Zoom %: 100 = standar game; lebih besar = lebih dekat */

/** Jaga viewBox tetap di dalam peta 0–100. Kota di tepi (Honolulu, Fiji, dll.)
 *  tetap di ujung — tidak dipaksa center jika itu menyebabkan area kosong. */
function clampViewBox(vb: ViewBox): ViewBox {
  let { minX, minY, vbW, vbH } = vb;
  // Jangan lebih besar dari seluruh peta
  vbW = Math.min(Math.max(vbW, 0.5), 100);
  vbH = Math.min(Math.max(vbH, 0.5), 100);
  // Geser agar tidak keluar kiri/atas/kanan/bawah
  if (minX < 0) minX = 0;
  if (minY < 0) minY = 0;
  if (minX + vbW > 100) minX = 100 - vbW;
  if (minY + vbH > 100) minY = 100 - vbH;
  minX = Math.max(0, Math.min(minX, 100 - vbW));
  minY = Math.max(0, Math.min(minY, 100 - vbH));
  return { minX, minY, vbW, vbH };
}

function viewBoxAround(cx: number, cy: number, zoomPct: number): ViewBox {
  const safeCx = Number.isFinite(cx) ? cx : 50;
  const safeCy = Number.isFinite(cy) ? cy : 50;
  const pct = Math.max(
    20,
    Math.min(800, Number.isFinite(zoomPct) ? zoomPct : 100)
  );
  const span = 6 * (100 / pct);
  let minX = safeCx - span / 2;
  let maxX = safeCx + span / 2;
  let minY = safeCy - span / 2;
  let maxY = safeCy + span / 2;
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
  return clampViewBox({ minX, minY, vbW, vbH });
}


/** Hitung viewBox dari daftar titik (mapX/mapY), jaga aspect peta */
function viewBoxFromPoints(
  points: { mapX: number; mapY: number }[],
  pad = 0.85,
  minSpan = 2.2
): ViewBox {
  if (!points.length) {
    return { minX: 0, minY: 0, vbW: 100, vbH: 100 };
  }
  let minX = Math.min(...points.map((p) => p.mapX)) - pad;
  let maxX = Math.max(...points.map((p) => p.mapX)) + pad;
  let minY = Math.min(...points.map((p) => p.mapY)) - pad;
  let maxY = Math.max(...points.map((p) => p.mapY)) + pad;
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
  return clampViewBox({ minX, minY, vbW, vbH });
}

function viewBoxForCityIndex(idx: number): ViewBox {
  const cities = ADVENTURE_CITIES.slice(
    Math.max(0, idx - 2),
    Math.min(ADVENTURE_CITIES.length, idx + 3)
  );
  return viewBoxFromPoints(cities);
}

function spanOf(vb: ViewBox): number {
  return Math.max(vb.vbW, vb.vbH);
}

function animateViewBox(
  from: ViewBox,
  to: ViewBox,
  duration: number,
  onFrame: (vb: ViewBox) => void,
  onDone?: () => void
): () => void {
  const t0 = performance.now();
  let raf = 0;
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / duration);
    const e = ease(p);
    onFrame({
      minX: from.minX + (to.minX - from.minX) * e,
      minY: from.minY + (to.minY - from.minY) * e,
      vbW: from.vbW + (to.vbW - from.vbW) * e,
      vbH: from.vbH + (to.vbH - from.vbH) * e,
    });
    if (p < 1) raf = requestAnimationFrame(tick);
    else onDone?.();
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

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
  const [debugZoomPct, setDebugZoomPct] = useState(() => {
    if (!mapDebug.on) return 100;
    const z = mapDebug.zoom || 1;
    return Math.max(20, Math.min(800, Math.round(100 / z)));
  });
  const [debugZoomInput, setDebugZoomInput] = useState('100');
  const [debugCenter, setDebugCenter] = useState<{ x: number; y: number } | null>(
    null
  );
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    originCenter: { x: number; y: number };
    originVB: ViewBox;
  } | null>(null);

  const activeIdx = Math.max(
    0,
    ADVENTURE_CITIES.findIndex((c) => c.id === activeId)
  );

  useEffect(() => {
    if (!mapDebug.on) return;
    const c = ADVENTURE_CITIES.find((x) => x.id === activeId);
    if (!c) return;
    setDebugCenter((prev) => {
      if (prev && prev.x === c.mapX && prev.y === c.mapY) return prev;
      return { x: c.mapX, y: c.mapY };
    });
  }, [activeId, mapDebug.on]);

  useEffect(() => {
    setDebugZoomInput(String(Math.round(debugZoomPct)));
  }, [debugZoomPct]);

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
    zoomCities = ADVENTURE_CITIES;
  }

  let minX: number;
  let maxX: number;
  let minY: number;
  let maxY: number;

  if (mapDebug.on) {
    const focusCity = ADVENTURE_CITIES.find(
      (c) => c.id === (activeId || mapDebug.focusId || '')
    );
    const cx =
      debugCenter?.x ?? mapDebug.center?.x ?? focusCity?.mapX ?? 50;
    const cy =
      debugCenter?.y ?? mapDebug.center?.y ?? focusCity?.mapY ?? 50;
    const vb = viewBoxAround(cx, cy, debugZoomPct);
    minX = vb.minX;
    maxX = vb.minX + vb.vbW;
    minY = vb.minY;
    maxY = vb.minY + vb.vbH;
  } else {
    const xs = zoomCities.map((c) => c.mapX);
    const ys = zoomCities.map((c) => c.mapY);
    const pad = 0.85;
    minX = Math.min(...xs) - pad;
    maxX = Math.max(...xs) + pad;
    minY = Math.min(...ys) - pad;
    maxY = Math.max(...ys) + pad;

    const minSpan = 2.2;
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

  // Tepi peta: jangan tampilkan area kosong di luar 0–100
  {
    const clamped = clampViewBox({ minX, minY, vbW, vbH });
    minX = clamped.minX;
    minY = clamped.minY;
    vbW = clamped.vbW;
    vbH = clamped.vbH;
    maxX = minX + vbW;
    maxY = minY + vbH;
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

  /**
   * Zoom intro world → target hanya SEKALI per mount.
   * Saat traveling, efek di bawah yang atur urutan zoom ↔ pesawat.
   */
  const [zoomVB, setZoomVB] = useState<ViewBox>({
    minX: 0,
    minY: 0,
    vbW: 100,
    vbH: 100,
  });
  const didIntroZoomRef = useRef(false);
  const zoomVBRef = useRef(zoomVB);
  zoomVBRef.current = zoomVB;
  /** true = travel effect sedang mengontrol zoom (jangan di-override) */
  const travelOwnsZoomRef = useRef(false);

  useEffect(() => {
    if (mapDebug.on) {
      setZoomVB((prev) => {
        if (
          prev.minX === minX &&
          prev.minY === minY &&
          prev.vbW === vbW &&
          prev.vbH === vbH
        ) {
          return prev;
        }
        return { minX, minY, vbW, vbH };
      });
      return;
    }
    if (traveling || travelOwnsZoomRef.current) return;
    const end: ViewBox = { minX, minY, vbW, vbH };
    if (didIntroZoomRef.current) {
      setZoomVB(end);
      return;
    }
    didIntroZoomRef.current = true;
    const start: ViewBox = { minX: 0, minY: 0, vbW: 100, vbH: 100 };
    setZoomVB(start);
    return animateViewBox(start, end, 2000, setZoomVB);
  }, [activeId, minX, minY, vbW, vbH, mapDebug.on, traveling, debugZoomPct, debugCenter]);

  // Nilai view yang dipakai render (hasil animasi zoom)
  const drawMinX = zoomVB.minX;
  const drawMinY = zoomVB.minY;
  const drawVbW = zoomVB.vbW;
  const drawVbH = zoomVB.vbH;
  const drawMaxX = drawMinX + drawVbW;
  const drawMaxY = drawMinY + drawVbH;
  const pinR = Math.min(drawVbW, drawVbH) * (mapDebug.on ? 0.016 : 0.028);
  const fontSize = Math.min(drawVbW, drawVbH) * (mapDebug.on ? 0.022 : 0.055);

  /**
   * Urutan pindah kota:
   * - Perlu zoom OUT (view lebih luas) → zoom dulu, baru pesawat terbang
   * - Perlu zoom IN (view lebih dekat) → pesawat dulu, baru zoom in
   */
  useEffect(() => {
    if (!traveling || !fromCity || !toCity) {
      setT(0);
      travelOwnsZoomRef.current = false;
      return;
    }

    travelOwnsZoomRef.current = true;
    setT(0);

    const toIdx = ADVENTURE_CITIES.findIndex((c) => c.id === toCity.id);
    const targetVB =
      toIdx >= 0 ? viewBoxForCityIndex(toIdx) : { minX, minY, vbW, vbH };
    // View selama terbang: selalu tampilkan kota asal + tujuan
    const flightVB = viewBoxFromPoints(
      [
        { mapX: fromCity.mapX, mapY: fromCity.mapY },
        { mapX: toCity.mapX, mapY: toCity.mapY },
      ],
      1.2,
      3.0
    );

    const current = { ...zoomVBRef.current };
    const curSpan = spanOf(current);
    const tgtSpan = spanOf(targetVB);
    const flightSpan = spanOf(flightVB);

    const dist = Math.hypot(
      toCity.mapX - fromCity.mapX,
      toCity.mapY - fromCity.mapY
    );
    const SPEED = 4.2;
    const flightDur = Math.max(700, Math.min(8000, (dist / SPEED) * 1000));

    let cancelZoom: (() => void) | null = null;
    let cancelFlight: (() => void) | null = null;
    let cancelled = false;

    const runFlight = (after: () => void) => {
      const t0 = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        if (cancelled) return;
        const p = Math.min(1, (now - t0) / flightDur);
        setT(p);
        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          after();
        }
      };
      raf = requestAnimationFrame(tick);
      cancelFlight = () => cancelAnimationFrame(raf);
    };

    const finish = () => {
      if (cancelled) return;
      travelOwnsZoomRef.current = false;
      onTravelDone?.();
    };

    const settleToTarget = (from: ViewBox) => {
      // Sudah dekat dengan target → selesai
      if (Math.abs(spanOf(from) - tgtSpan) < 0.15) {
        setZoomVB(targetVB);
        finish();
        return;
      }
      cancelZoom = animateViewBox(from, targetVB, 700, setZoomVB, finish);
    };

    // —— Zoom OUT: view tujuan lebih luas → zoom dulu, lalu terbang ——
    if (tgtSpan > curSpan * 1.08 || flightSpan > curSpan * 1.08) {
      const pre =
        flightSpan >= tgtSpan * 0.95 ? flightVB : targetVB;
      cancelZoom = animateViewBox(current, pre, 650, setZoomVB, () => {
        if (cancelled) return;
        runFlight(() => settleToTarget(zoomVBRef.current));
      });
    }
    // —— Zoom IN: view tujuan lebih dekat → terbang dulu, baru zoom in ——
    else if (tgtSpan < curSpan * 0.92) {
      // Pastikan kedua kota kelihatan selama terbang
      const bothVisible =
        fromCity.mapX >= current.minX &&
        fromCity.mapX <= current.minX + current.vbW &&
        fromCity.mapY >= current.minY &&
        fromCity.mapY <= current.minY + current.vbH &&
        toCity.mapX >= current.minX &&
        toCity.mapX <= current.minX + current.vbW &&
        toCity.mapY >= current.minY &&
        toCity.mapY <= current.minY + current.vbH;

      const startFlight = () => {
        runFlight(() => {
          cancelZoom = animateViewBox(
            zoomVBRef.current,
            targetVB,
            750,
            setZoomVB,
            finish
          );
        });
      };

      if (!bothVisible) {
        cancelZoom = animateViewBox(current, flightVB, 500, setZoomVB, () => {
          if (cancelled) return;
          startFlight();
        });
      } else {
        startFlight();
      }
    }
    // —— Skala mirip: pastikan rute kelihatan, terbang, settle ——
    else {
      const needFlightView =
        flightSpan > curSpan * 1.05 ||
        !(
          toCity.mapX >= current.minX &&
          toCity.mapX <= current.minX + current.vbW &&
          toCity.mapY >= current.minY &&
          toCity.mapY <= current.minY + current.vbH
        );
      if (needFlightView) {
        cancelZoom = animateViewBox(current, flightVB, 500, setZoomVB, () => {
          if (cancelled) return;
          runFlight(() => settleToTarget(zoomVBRef.current));
        });
      } else {
        runFlight(() => settleToTarget(zoomVBRef.current));
      }
    }

    return () => {
      cancelled = true;
      cancelZoom?.();
      cancelFlight?.();
      travelOwnsZoomRef.current = false;
    };
  }, [
    travelFromId,
    travelToId,
    traveling,
    onTravelDone,
    fromCity,
    toCity,
    minX,
    minY,
    vbW,
    vbH,
  ]);

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

  /**
   * Posisi HTML overlay harus cocok dengan SVG (preserveAspectRatio meet).
   * Di laptop, max-height frame bisa beda aspect → letterbox → % sederhana meleset.
   */
  const pct = (mapX: number, mapY: number) => {
    const nx = (mapX - drawMinX) / drawVbW;
    const ny = (mapY - drawMinY) / drawVbH;
    const frame = frameRef.current;
    if (!frame || drawVbW <= 0 || drawVbH <= 0) {
      return { left: `${nx * 100}%`, top: `${ny * 100}%` };
    }
    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    if (fw <= 0 || fh <= 0) {
      return { left: `${nx * 100}%`, top: `${ny * 100}%` };
    }
    const vbAspect = drawVbW / drawVbH;
    const elAspect = fw / fh;
    if (elAspect > vbAspect) {
      // letterbox kiri–kanan
      const contentW = fh * vbAspect;
      const offsetX = (fw - contentW) / 2;
      return {
        left: `${((offsetX + nx * contentW) / fw) * 100}%`,
        top: `${ny * 100}%`,
      };
    }
    // letterbox atas–bawah
    const contentH = fw / vbAspect;
    const offsetY = (fh - contentH) / 2;
    return {
      left: `${nx * 100}%`,
      top: `${((offsetY + ny * contentH) / fh) * 100}%`,
    };
  };

  const currentVB: ViewBox = {
    minX: drawMinX,
    minY: drawMinY,
    vbW: drawVbW,
    vbH: drawVbH,
  };

  const applyZoomPct = (next: number) => {
    const pct = Math.max(20, Math.min(800, Math.round(next)));
    setDebugZoomPct(pct);
    setDebugZoomInput(String(pct));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mapDebug.on || !frameRef.current) return;
    if ((e.target as HTMLElement).closest('.adventure-map-hit')) return;
    const center = debugCenter || {
      x: drawMinX + drawVbW / 2,
      y: drawMinY + drawVbH / 2,
    };
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      originCenter: { ...center },
      originVB: { ...currentVB },
    };
    try {
      frameRef.current.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d?.active || !frameRef.current) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const rect = frameRef.current.getBoundingClientRect();
    const fw = rect.width;
    const fh = rect.height;
    const vbAspect = d.originVB.vbW / Math.max(0.0001, d.originVB.vbH);
    const elAspect = fw / Math.max(0.0001, fh);
    let contentW = fw;
    let contentH = fh;
    if (elAspect > vbAspect) contentW = fh * vbAspect;
    else contentH = fw / vbAspect;
    const mapDx = (dx / Math.max(0.0001, contentW)) * d.originVB.vbW;
    const mapDy = (dy / Math.max(0.0001, contentH)) * d.originVB.vbH;
    setDebugCenter({
      x: d.originCenter.x - mapDx,
      y: d.originCenter.y - mapDy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const wasDrag = d.moved;
    dragRef.current = null;
    if (!mapDebug.on || !frameRef.current) return;
    if (wasDrag) return;
    if ((e.target as HTMLElement).closest('.adventure-map-hit')) return;
    const pt = clientToMap(e.clientX, e.clientY, frameRef.current, currentVB);
    setClickCoord({
      x: Math.round(pt.x * 100) / 100,
      y: Math.round(pt.y * 100) / 100,
    });
    setCopied(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!mapDebug.on) return;
    e.preventDefault();
    applyZoomPct(debugZoomPct * (e.deltaY > 0 ? 1 / 1.15 : 1.15));
  };

  const copyCoord = async () => {
    if (!clickCoord) return;
    try {
      await navigator.clipboard.writeText(
        [
          '    mapX: ' + clickCoord.x + ',',
          '    mapY: ' + clickCoord.y + ',',
        ].join(String.fromCharCode(10))
      );
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
        onPointerDown={mapDebug.on ? handlePointerDown : undefined}
        onPointerMove={mapDebug.on ? handlePointerMove : undefined}
        onPointerUp={mapDebug.on ? handlePointerUp : undefined}
        onPointerCancel={mapDebug.on ? handlePointerUp : undefined}
        onWheel={mapDebug.on ? handleWheel : undefined}
        style={mapDebug.on ? { touchAction: 'none', cursor: 'grab' } : undefined}
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
          <div className="map-debug-toolbar">
            <button
              type="button"
              className="btn-ghost map-debug-zoom-btn"
              onClick={() => applyZoomPct(debugZoomPct / 1.5)}
              title={i18n('mapDebugZoomOut')}
            >
              −
            </button>
            <label className="map-debug-zoom-label">
              <span>{i18n('mapDebugZoom')}</span>
              <input
                type="number"
                min={20}
                max={800}
                step={10}
                value={debugZoomInput}
                onChange={(e) => setDebugZoomInput(e.target.value)}
                onBlur={() => {
                  const n = parseFloat(debugZoomInput);
                  if (Number.isFinite(n)) applyZoomPct(n);
                  else setDebugZoomInput(String(Math.round(debugZoomPct)));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const n = parseFloat(debugZoomInput);
                    if (Number.isFinite(n)) applyZoomPct(n);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
              <span>%</span>
            </label>
            <button
              type="button"
              className="btn-ghost map-debug-zoom-btn"
              onClick={() => applyZoomPct(debugZoomPct * 1.5)}
              title={i18n('mapDebugZoomIn')}
            >
              +
            </button>
            <button
              type="button"
              className="btn-ghost map-debug-zoom-btn"
              onClick={() => applyZoomPct(100)}
              title={i18n('mapDebugZoomReset')}
            >
              100%
            </button>
          </div>
          <p className="map-debug-meta">
            {i18n('mapDebugCenter')}:{' '}
            <code>
              {(debugCenter?.x ?? viewCenter.x).toFixed(2)},{' '}
              {(debugCenter?.y ?? viewCenter.y).toFixed(2)}
            </code>
            {' · '}
            {i18n('mapDebugActiveCity')}: <code>{activeId}</code>
          </p>
          {clickCoord ? (
            <div className="map-debug-coord">
              <pre className="map-debug-snippet">
                {[
                  '    mapX: ' + clickCoord.x + ',',
                  '    mapY: ' + clickCoord.y + ',',
                ].join(String.fromCharCode(10))}
              </pre>
              <button
                type="button"
                className="btn-primary map-debug-copy"
                onClick={copyCoord}
              >
                {copied ? i18n('mapDebugCopied') : i18n('mapDebugCopy')}
              </button>
            </div>
          ) : (
            <p className="map-debug-hint">{i18n('mapDebugClickHint')}</p>
          )}
          <p className="map-debug-hint">{i18n('mapDebugPanHint')}</p>
        </div>
      )}

      <p className="adventure-map-legend">
        {mapDebug.on ? i18n('mapDebugLegend') : i18n('mapLegend')}
      </p>
    </div>
  );
}
