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
  /** Full device window (transisi): tanpa max-height crop manual */
  fillViewport?: boolean;
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

/**
 * Jaga viewBox di dalam peta 0–100.
 * Tiap sumbu diusahakan center ke preferCx/preferCy secara mandiri:
 * - kalau muat → center
 * - kalau di tepi (Honolulu X, Fiji X, Reykjavik Y, dll.) → nempel ujung sumbu itu saja
 *   sumbu lain tetap center jika masih muat.
 */
function clampViewBox(
  vb: ViewBox,
  preferCx?: number,
  preferCy?: number
): ViewBox {
  let { vbW, vbH } = vb;
  vbW = Math.min(Math.max(vbW, 0.5), 100);
  vbH = Math.min(Math.max(vbH, 0.5), 100);
  const cx = Number.isFinite(preferCx as number)
    ? (preferCx as number)
    : vb.minX + vb.vbW / 2;
  const cy = Number.isFinite(preferCy as number)
    ? (preferCy as number)
    : vb.minY + vb.vbH / 2;
  let minX = cx - vbW / 2;
  let minY = cy - vbH / 2;
  if (minX < 0) minX = 0;
  if (minY < 0) minY = 0;
  if (minX + vbW > 100) minX = 100 - vbW;
  if (minY + vbH > 100) minY = 100 - vbH;
  minX = Math.max(0, Math.min(minX, 100 - vbW));
  minY = Math.max(0, Math.min(minY, 100 - vbH));
  return { minX, minY, vbW, vbH };
}

/**
 * Samakan aspect viewBox ke target (layar / frame), lalu clamp di tepi 0–100.
 * Mentok → geser center (tahan di sisi itu), bukan letterbox biru, bukan potong isi.
 */
function applyAspectAndClamp(
  minX: number,
  minY: number,
  vbW: number,
  vbH: number,
  preferCx: number,
  preferCy: number,
  targetAspect: number
): ViewBox {
  const aspect = Math.max(0.2, Math.min(5, targetAspect || MAP_ASPECT));
  if (vbW / Math.max(0.0001, vbH) > aspect) {
    const needH = vbW / aspect;
    minY -= (needH - vbH) / 2;
    vbH = needH;
  } else {
    const needW = vbH * aspect;
    minX -= (needW - vbW) / 2;
    vbW = needW;
  }
  return clampViewBox({ minX, minY, vbW, vbH }, preferCx, preferCy);
}

function viewBoxAround(
  cx: number,
  cy: number,
  zoomPct: number,
  targetAspect: number = MAP_ASPECT
): ViewBox {
  const safeCx = Number.isFinite(cx) ? cx : 50;
  const safeCy = Number.isFinite(cy) ? cy : 50;
  const pct = Math.max(
    20,
    Math.min(800, Number.isFinite(zoomPct) ? zoomPct : 100)
  );
  const span = 6 * (100 / pct);
  return applyAspectAndClamp(
    safeCx - span / 2,
    safeCy - span / 2,
    span,
    span,
    safeCx,
    safeCy,
    targetAspect
  );
}

/** Hitung viewBox dari daftar titik (mapX/mapY), jaga aspect target */
function viewBoxFromPoints(
  points: { mapX: number; mapY: number }[],
  pad = 0.85,
  minSpan = 2.2,
  targetAspect: number = MAP_ASPECT
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
  const vbW = maxX - minX;
  const vbH = maxY - minY;
  return applyAspectAndClamp(
    minX,
    minY,
    vbW,
    vbH,
    minX + vbW / 2,
    minY + vbH / 2,
    targetAspect
  );
}

/** Span maksimum zoom (map %). Tetangga jalur ±2 yang terlalu jauh
 *  (Honolulu↔Ilulissat, Fiji↔Auckland) tidak boleh bikin zoom setara dunia. */
const MAP_ZOOM_MAX_SPAN = 14;
const MAP_ZOOM_MIN_SPAN = 3.5;
/** Zoom lokal saat tetangga jalur terlalu jarang (≈ viewBoxAround 75%) */
const MAP_ZOOM_LOCAL_PCT = 75;

/**
 * Zoom window: usahakan 2 kota sebelum + aktif + 2 sesudah (urutan jalur).
 * Jika rentang geografis > MAP_ZOOM_MAX_SPAN → jatuh ke frame lokal di kota aktif
 * (tetangga jauh tidak memaksa peta melebar).
 */
function viewBoxForCityIndex(
  idx: number,
  targetAspect: number = MAP_ASPECT
): ViewBox {
  const safeIdx = Math.max(0, Math.min(ADVENTURE_CITIES.length - 1, idx));
  const cities = ADVENTURE_CITIES.slice(
    Math.max(0, safeIdx - 2),
    Math.min(ADVENTURE_CITIES.length, safeIdx + 3)
  );
  let vb = viewBoxFromPoints(cities, 0.9, MAP_ZOOM_MIN_SPAN, targetAspect);
  if (Math.max(vb.vbW, vb.vbH) > MAP_ZOOM_MAX_SPAN) {
    const c = ADVENTURE_CITIES[safeIdx];
    if (c) {
      // Frame lokal di kota aktif; coba tarik tetangga yang masih muat
      const local = viewBoxAround(c.mapX, c.mapY, MAP_ZOOM_LOCAL_PCT, targetAspect);
      const near = cities.filter(
        (p) =>
          Math.abs(p.mapX - c.mapX) <= local.vbW * 0.45 &&
          Math.abs(p.mapY - c.mapY) <= local.vbH * 0.45
      );
      if (near.length > 1) {
        vb = viewBoxFromPoints(near, 0.9, MAP_ZOOM_MIN_SPAN, targetAspect);
        if (Math.max(vb.vbW, vb.vbH) > MAP_ZOOM_MAX_SPAN) {
          vb = local;
        }
      } else {
        vb = local;
      }
    }
  }
  return vb;
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
  fillViewport = false,
}: AdventureMapProps) {
  const mapDebug = useMapDebug();
  const frameRef = useRef<HTMLDivElement>(null);
  /** Rasio frame (lebar/tinggi). Fullscreen → ikut layar; normal → 2:1 peta. */
  const [frameAspect, setFrameAspect] = useState(MAP_ASPECT);
  /** Peta siap — hindari pin tanpa gambar di awal transisi */
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const src = '/cities/map/world.webp';
    const img = new Image();
    const mark = () => {
      if (!cancelled) setMapReady(true);
    };
    img.onload = mark;
    img.onerror = mark; // jangan blokir selamanya
    img.src = src;
    if (img.complete) mark();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        const a = w / h;
        setFrameAspect((prev) => (Math.abs(prev - a) < 0.01 ? prev : a));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fillViewport]);
  /**
   * Aspect viewBox = ukuran frame aktual (sama untuk pilih Adventure & transisi).
   * Pilih kota: frame CSS 2:1. Transisi: full layar. Mentok tepi → clamp, bukan biru.
   */
  const targetAspect = frameAspect;
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
    setDebugCenter({ x: c.mapX, y: c.mapY });
    // Pilih kota baru → kembali ke zoom jalur ±2 (bukan manual)
    setDebugZoomPct(100);
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
    // Default: sama seperti main (±2 jalur, capped). Manual zoom (≠100) → viewBoxAround.
    const useManualZoom = Math.abs(debugZoomPct - 100) > 0.5;
    const vb = useManualZoom
      ? viewBoxAround(cx, cy, debugZoomPct, targetAspect)
      : viewBoxForCityIndex(
          focusCity
            ? ADVENTURE_CITIES.findIndex((c) => c.id === focusCity.id)
            : activeIdx
        );
    minX = vb.minX;
    maxX = vb.minX + vb.vbW;
    minY = vb.minY;
    maxY = vb.minY + vb.vbH;
  } else {
    const vb = viewBoxForCityIndex(activeIdx, targetAspect);
    minX = vb.minX;
    maxX = vb.minX + vb.vbW;
    minY = vb.minY;
    maxY = vb.minY + vb.vbH;
  }

  let vbW = maxX - minX;
  let vbH = maxY - minY;
  // Samakan aspect ke frame (layar saat fullscreen) → meet mengisi penuh, tanpa biru.
  // Mentok tepi peta → clamp geser center (bukan potong, bukan letterbox).
  {
    const preferCx = (minX + maxX) / 2;
    const preferCy = (minY + maxY) / 2;
    const fitted = applyAspectAndClamp(
      minX,
      minY,
      vbW,
      vbH,
      preferCx,
      preferCy,
      targetAspect
    );
    minX = fitted.minX;
    minY = fitted.minY;
    vbW = fitted.vbW;
    vbH = fitted.vbH;
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
  /** Stabil — ganti tempo/parent re-render jangan restart animasi pesawat */
  const onTravelDoneRef = useRef(onTravelDone);
  onTravelDoneRef.current = onTravelDone;
  const targetAspectRef = useRef(targetAspect);
  targetAspectRef.current = targetAspect;

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
    if (traveling || travelOwnsZoomRef.current || fillViewport) return;
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
   * Urutan transisi lanjut kota:
   * 1) Expand dari titik tengah → full window (CSS), view = aturan zoom kota asal
   * 2–3) Pesawat terbang; kamera & zoom mengikuti jalur → aturan kota tujuan
   * 4) Snap soft ke viewBox tujuan
   * 5) Parent fade-out → masuk permainan
   */
  useEffect(() => {
    // Hanya restart saat pasangan kota asal→tujuan berubah (bukan tempo/re-render parent)
    if (!travelFromId || !travelToId) {
      setT(0);
      travelOwnsZoomRef.current = false;
      return;
    }
    const fromC = ADVENTURE_CITIES.find((c) => c.id === travelFromId);
    const toC = ADVENTURE_CITIES.find((c) => c.id === travelToId);
    if (!fromC || !toC) {
      setT(0);
      travelOwnsZoomRef.current = false;
      return;
    }
    if (travelFromId === travelToId) {
      setT(0);
      travelOwnsZoomRef.current = false;
      return;
    }

    travelOwnsZoomRef.current = true;
    setT(0);

    const aspect = targetAspectRef.current;
    const fromIdx = ADVENTURE_CITIES.findIndex((c) => c.id === fromC.id);
    const toIdx = ADVENTURE_CITIES.findIndex((c) => c.id === toC.id);
    const startRuleVB =
      fromIdx >= 0
        ? viewBoxForCityIndex(fromIdx, aspect)
        : { minX: 0, minY: 0, vbW: 100, vbH: 100 };
    const endRuleVB =
      toIdx >= 0
        ? viewBoxForCityIndex(toIdx, aspect)
        : { minX: 0, minY: 0, vbW: 100, vbH: 100 };

    // (1) Langsung di frame kota asal — hindari flash view dunia gelap
    setZoomVB(startRuleVB);
    zoomVBRef.current = startRuleVB;

    const dist = Math.hypot(toC.mapX - fromC.mapX, toC.mapY - fromC.mapY);
    /** Pelan + ~0.5s ekstra total (expand + terbang + jeda + fade) */
    const SPEED = 3.0;
    const flightDur = Math.max(1400, Math.min(10000, (dist / SPEED) * 1000));
    /** Samakan dengan CSS travelMapExpand (1.2s) */
    const EXPAND_MS = fillViewport ? 1200 : 0;

    let cancelled = false;
    let started = false; // cegah begin() ganda (onload + timeout = reset pesawat)
    let raf = 0;
    let expandTimer = 0;
    let doneTimer = 0;
    let waitMapTimer = 0;

    const ease = (x: number) => 1 - Math.pow(1 - x, 2.6);

    const runFlight = () => {
      if (cancelled) return;
      const t0 = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const p = Math.min(1, (now - t0) / flightDur);
        const e = ease(p);
        setT(p);

        const cx = fromC.mapX + (toC.mapX - fromC.mapX) * e;
        const cy = fromC.mapY + (toC.mapY - fromC.mapY) * e;
        const ruleW =
          startRuleVB.vbW + (endRuleVB.vbW - startRuleVB.vbW) * e;
        const ruleH =
          startRuleVB.vbH + (endRuleVB.vbH - startRuleVB.vbH) * e;
        const vb = clampViewBox(
          {
            minX: cx - ruleW / 2,
            minY: cy - ruleH / 2,
            vbW: ruleW,
            vbH: ruleH,
          },
          cx,
          cy
        );
        setZoomVB(vb);
        zoomVBRef.current = vb;

        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setZoomVB(endRuleVB);
          zoomVBRef.current = endRuleVB;
          setT(1);
          // Jeda di kota tujuan, lalu parent mulai fade-out
          doneTimer = window.setTimeout(() => {
            if (cancelled) return;
            travelOwnsZoomRef.current = false;
            onTravelDoneRef.current?.();
          }, 700);
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const beginOnce = () => {
      if (cancelled || started) return;
      started = true;
      if (EXPAND_MS > 0) {
        expandTimer = window.setTimeout(runFlight, EXPAND_MS);
      } else {
        runFlight();
      }
    };

    // Preload peta — sekali begin saja (bukan onload DAN timeout)
    const probe = new Image();
    probe.src = '/cities/map/world.webp';
    const already =
      mapReady || (probe.complete && probe.naturalWidth > 0);

    if (!fillViewport || already) {
      if (already) setMapReady(true);
      beginOnce();
    } else {
      const onReady = () => {
        if (cancelled) return;
        window.clearTimeout(waitMapTimer);
        setMapReady(true);
        beginOnce();
      };
      probe.onload = onReady;
      waitMapTimer = window.setTimeout(onReady, 1500);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(expandTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(waitMapTimer);
      travelOwnsZoomRef.current = false;
    };
  }, [travelFromId, travelToId, fillViewport]);

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
        className={`adventure-map-frame${mapDebug.on ? ' is-debug' : ''}${fillViewport ? ' is-fill-viewport' : ''}`}
        ref={frameRef}
        onPointerDown={mapDebug.on ? handlePointerDown : undefined}
        onPointerMove={mapDebug.on ? handlePointerMove : undefined}
        onPointerUp={mapDebug.on ? handlePointerUp : undefined}
        onPointerCancel={mapDebug.on ? handlePointerUp : undefined}
        onWheel={mapDebug.on ? handleWheel : undefined}
        style={mapDebug.on ? { touchAction: 'none', cursor: 'grab' } : undefined}
      >
        <svg
          className={`adventure-map${mapReady ? ' is-map-ready' : ' is-map-loading'}`}
          viewBox={`${drawMinX} ${drawMinY} ${drawVbW} ${drawVbH}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-hidden
        >
          {/* Pin 0–100; viewBox aspect = frame → meet isi penuh. Mentok tepi = clamp, bukan biru. */}
          <image
            href="/cities/map/world.webp"
            x={0}
            y={0}
            width={100}
            height={100}
            preserveAspectRatio="none"
            opacity={mapReady ? 1 : 0}
            onLoad={() => setMapReady(true)}
          />

          {mapReady && traveling && fromCity && toCity && (
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

          {mapReady && renderCities.map((c) => {
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
                {/* Koordinat hanya hover (PC) — tidak menumpuk label di peta */}
                {mapDebug.on && (
                  <title>
                    {`${c.nameId}: mapX ${c.mapX.toFixed(2)}, mapY ${c.mapY.toFixed(2)}`}
                  </title>
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

        {/* Area ketuk HTML — pusat = pin kota (tunggu peta siap) */}
        {mapReady &&
          renderCities.map((c) => {
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
