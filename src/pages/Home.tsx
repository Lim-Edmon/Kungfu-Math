/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState, useEffect , useRef} from 'react';
import type {
  ArenaStyle,
  CharacterId,
  DisplayMode,
  InputMode,
} from '../lib/types';
import {
  ADVENTURE_CITIES,
  ADVENTURE_DIFFICULTIES,
  ADVENTURE_REGIONS,
  getCountryNameId,
  getCountryNameEn,
} from '../lib/adventure';
import type { DifficultyLevel } from '../lib/levels';
import { LEVELS, getLevelById } from '../lib/levels';
import { loadProgress, updateProgress } from '../lib/storage';
import {
  getCharactersByMode,
  getCharacterById,
  getDefaultCharacter,
  characterRoleLabel,
} from '../lib/characters';
import InstallHint from '../components/InstallHint';
import AdventureMap from '../components/AdventureMap';
import { t, getLang } from '../lib/i18n';
import { sfx } from '../lib/sound';

export type PlayKind = 'latihan' | 'petualangan';

function isMapDebug(): boolean {
  try {
    const q = new URLSearchParams(window.location.search);
    return q.get('mapdebug') === '1' || q.get('advdebug') === '1';
  } catch {
    return false;
  }
}

function mapDebugFocusFromUrl(): string | null {
  try {
    const q = new URLSearchParams(window.location.search);
    const f = (q.get('mapfocus') || '').toLowerCase().trim();
    return f || null;
  } catch {
    return null;
  }
}

/** Cek file aset ada (HEAD/GET singkat) — hanya mode debug */
/** Hanya file khusus kota — default.webp / BGM default tidak dihitung "ada". */
async function probeDedicatedAsset(url: string, kind: 'image' | 'audio'): Promise<boolean> {
  try {
    const r = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!r.ok) return false;
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    // SPA fallback sering balas index.html 200 — tolak text/html
    if (ct.includes('text/html')) return false;
    if (kind === 'image' && !(ct.includes('image') || ct.includes('octet-stream') || ct === '')) {
      // beberapa host tidak kirim CT; cek ekstensi path
      if (!/\.(webp|png|jpe?g)(\?|$)/i.test(url)) return false;
    }
    if (kind === 'audio' && !(ct.includes('audio') || ct.includes('mpeg') || ct.includes('octet-stream') || ct === '')) {
      if (!/\.mp3(\?|$)/i.test(url)) return false;
    }
    // pastikan body tidak kosong HTML
    if (ct.includes('text/')) return false;
    return true;
  } catch {
    return false;
  }
}

async function auditCityAssets(cityId: string): Promise<{ bg: boolean; music: boolean; bgPath: string; musicPath: string }> {
  const id = (cityId || '').toLowerCase();
  const bgCandidates = [
    `/cities/bg/${id}.webp`,
    `/cities/bg/${id}.png`,
    `/cities/bg/${id}.jpg`,
  ];
  let bgPath = bgCandidates[0];
  let bg = false;
  for (const cand of bgCandidates) {
    if (await probeDedicatedAsset(cand, 'image')) {
      bg = true;
      bgPath = cand;
      break;
    }
  }
  const musicPath = `/cities/music/${id}.mp3`;
  const music = await probeDedicatedAsset(musicPath, 'audio');
  return { bg, music, bgPath, musicPath };
}


type WizardStep = 1 | 2 | 3;

interface HomeProps {
  onStartGame: (
    mode: InputMode,
    characterId: CharacterId,
    level: DifficultyLevel,
    arena: ArenaStyle,
    playKind: PlayKind,
    adventureDiffId?: string,
    forceOps?: Array<'add' | 'sub' | 'mul' | 'div'>
  ) => void;
  initialPlayKind?: PlayKind;
}

function lastUnlockedCityId(unlocked: string[]): string {
  const list = unlocked?.length ? unlocked : ['jakarta'];
  for (let i = ADVENTURE_CITIES.length - 1; i >= 0; i--) {
    const id = ADVENTURE_CITIES[i].id;
    if (id === 'jakarta' || list.includes(id)) return id;
  }
  return 'jakarta';
}

export default function Home({ onStartGame, initialPlayKind }: HomeProps) {
  const [step, setStep] = useState<WizardStep>(1);
  /** null = belum dipilih (kecuali default yang diizinkan) */
  const [mode, setMode] = useState<InputMode | null>(null);
  const [arena, setArena] = useState<ArenaStyle | null>(null);
  const [opsMode, setOpsMode] = useState<'random' | 'focus'>(() =>
    loadProgress().practiceOpsMode === 'focus' ? 'focus' : 'random'
  );
  const [focusOps, setFocusOps] = useState<Array<'add' | 'sub' | 'mul' | 'div'>>(() => {
    const o = loadProgress().focusOps;
    return o?.length ? o : ['add'];
  });
  const [playKind, setPlayKind] = useState<PlayKind | null>(
    initialPlayKind ?? null
  );
  const [cityId, setCityId] = useState('jakarta');
  const [travelFrom, setTravelFrom] = useState<string | null>(null);
  const [travelTo, setTravelTo] = useState<string | null>(null);
  /** Region list kota di petualangan — default hanya region kota aktif */
  const [openHomeRegions, setOpenHomeRegions] = useState<Record<string, boolean>>({});
  /** Panel region: prev | current | next — max 3 baris */
  const [regionPanel, setRegionPanel] = useState<'prev' | 'current' | 'next'>('current');
  /** Sub-region terbuka di dalam panel prev/next */
  const [openSubRegion, setOpenSubRegion] = useState<string | null>(null);
  const [adventureDiffId, setAdventureDiffId] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] =
    useState<CharacterId | null>(null);
  const [level, setLevel] = useState<DifficultyLevel | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('siang');
  const [playerName, setPlayerName] = useState('');
  const [ready, setReady] = useState(false);
  const mapDebug = isMapDebug();
  const allCityIds = ADVENTURE_CITIES.map((c) => c.id);
  const [assetAudit, setAssetAudit] = useState<
    Record<string, { bg: boolean; music: boolean; bgPath: string; musicPath: string }>
  >({});
  const [assetAuditDone, setAssetAuditDone] = useState(false);
  const [exitDebugConfirm, setExitDebugConfirm] = useState(false);
  /** Highlight field yang belum diisi (scroll + shake) */
  const [fieldError, setFieldError] = useState<string | null>(null);
  const fieldRefs = {
    mode: useRef<HTMLDivElement>(null),
    character: useRef<HTMLDivElement>(null),
    arena: useRef<HTMLDivElement>(null),
    level: useRef<HTMLDivElement>(null),
    playKind: useRef<HTMLDivElement>(null),
    tempo: useRef<HTMLDivElement>(null),
  };

  /**
   * Kembali ke peta (setelah selesai kota) → langsung step 3 petualangan,
   * dan isi ulang slice/tap + pendekar + arena + level + tempo dari pilihan terakhir
   * supaya tidak harus mundur ke langkah 1 lagi.
   */
  useEffect(() => {
    if (!initialPlayKind) return;
    setPlayKind(initialPlayKind);
    setStep(3);
    const p = loadProgress();
    if (p.preferredMode === 'slice' || p.preferredMode === 'tap') {
      setMode(p.preferredMode);
    }
    if (p.preferredCharacter) {
      setSelectedCharacterId(p.preferredCharacter);
    }
    if (p.preferredArena === 'static' || p.preferredArena === 'agility') {
      setArena(p.preferredArena);
    }
    if (p.preferredLevel) {
      setLevel(p.preferredLevel);
    }
    const tempo = p.preferredAdventureDiff;
    if (typeof tempo === 'string' && ADVENTURE_DIFFICULTIES.some((d) => d.id === tempo)) {
      setAdventureDiffId(tempo);
    } else if (initialPlayKind === 'petualangan') {
      setAdventureDiffId('normal');
    }
  }, [initialPlayKind]);

  /** Mode debug peta: langsung step 2 petualangan, fokus URL opsional */
  useEffect(() => {
    if (!mapDebug) return;
    setPlayKind('petualangan');
    setStep(3);
    setAdventureDiffId('normal');
    const f = mapDebugFocusFromUrl();
    if (f && ADVENTURE_CITIES.some((c) => c.id === f)) {
      setCityId(f);
    }
    // accordion: hanya region kota fokus / jakarta
    const focusId = (f && ADVENTURE_CITIES.some((c) => c.id === f)) ? f : 'jakarta';
    const focusCity = ADVENTURE_CITIES.find((c) => c.id === focusId);
    const regId = focusCity?.regionId || 'id';
    const open: Record<string, boolean> = {};
    ADVENTURE_REGIONS.forEach((r) => {
      open[r.id] = r.id === regId;
    });
    setOpenHomeRegions(open);
  }, [mapDebug]);

  /** Audit BG + musik semua kota (debug) */
  useEffect(() => {
    if (!mapDebug) return;
    let cancelled = false;
    (async () => {
      const result: typeof assetAudit = {};
      for (const c of ADVENTURE_CITIES) {
        if (cancelled) return;
        result[c.id] = await auditCityAssets(c.id);
        if (!cancelled) setAssetAudit({ ...result });
      }
      if (!cancelled) setAssetAuditDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [mapDebug]);

  useEffect(() => {
    const progress = loadProgress();
    // Hanya default yang diizinkan
    setDisplayMode(progress.displayMode || 'siang');
    document.documentElement.setAttribute(
      'data-theme',
      progress.displayMode || 'siang'
    );
    const unlocked = progress.adventureUnlocked || ['jakarta'];
    setCityId(
      progress.adventureCityId &&
        (progress.adventureCityId === 'jakarta' ||
          unlocked.includes(progress.adventureCityId))
        ? progress.adventureCityId
        : lastUnlockedCityId(unlocked)
    );
    setPlayerName(progress.playerName ?? '');
    // Level / arena / playKind / mode / karakter: tidak diisi default dari storage
    setReady(true);
  }, []);

  const handlePlayerNameChange = (value: string) => {
    const clean = value.slice(0, 16);
    setPlayerName(clean);
    updateProgress({ playerName: clean });
  };

  const handleDisplayChange = (newMode: DisplayMode) => {
    setDisplayMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode);
    updateProgress({ displayMode: newMode });
  };

  const cycleDisplayMode = () => {
    const order: DisplayMode[] = ['siang', 'malam', 'nyaman'];
    const i = order.indexOf(displayMode);
    handleDisplayChange(order[(i + 1) % order.length]);
  };

  const displayIcon =
    displayMode === 'malam' ? '🌙' : displayMode === 'nyaman' ? '👁️' : '☀️';
  const displayTitle =
    displayMode === 'malam'
      ? 'Malam'
      : displayMode === 'nyaman'
        ? 'Nyaman'
        : 'Siang';

  const handleSelectMode = (m: InputMode) => {
    setMode(m);
    const def = getDefaultCharacter(m); // yu-jin / yo-rin
    setSelectedCharacterId(def.id);
    updateProgress({ preferredMode: m, preferredCharacter: def.id });
    sfx.select();
  };

  const handleSelectCharacter = (id: CharacterId) => {
    const char = getCharacterById(id);
    if (!char) return;
    setMode(char.mode);
    setSelectedCharacterId(id);
    updateProgress({ preferredMode: char.mode, preferredCharacter: id });
    sfx.select();
  };

  /** Step 1: slice/tap + karakter. Step 2: diam/gerak + level. Step 3: latihan/petualangan. */
  const missingOnStep = (s: WizardStep): string | null => {
    if (s === 1) {
      if (mode == null) return 'mode';
      if (selectedCharacterId == null) return 'character';
      return null;
    }
    if (s === 2) {
      if (arena == null) return 'arena';
      if (level == null) return 'level';
      return null;
    }
    if (s === 3) {
      if (playKind == null) return 'playKind';
      if (playKind === 'petualangan' && adventureDiffId == null) return 'tempo';
      return null;
    }
    return null;
  };

  const canGoNext = (): boolean => missingOnStep(step) == null;

  const focusMissing = (key: string) => {
    setFieldError(key);
    const el = fieldRefs[key as keyof typeof fieldRefs]?.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('field-shake');
      // reflow agar animasi bisa diputar ulang
      void el.offsetWidth;
      el.classList.add('field-shake');
    }
    window.setTimeout(() => setFieldError((cur) => (cur === key ? null : cur)), 2200);
  };

  /** Boleh buka langkah s hanya jika mandatory sebelumnya terpenuhi */
  const canReachStep = (s: WizardStep): boolean => {
    if (s === 1) return true;
    if (s >= 2 && missingOnStep(1) != null) return false;
    if (s >= 3 && missingOnStep(2) != null) return false;
    return true;
  };

  const canStart =
    mode != null &&
    selectedCharacterId != null &&
    level != null &&
    arena != null &&
    playKind != null &&
    (playKind !== 'petualangan' || adventureDiffId != null);

  if (!ready) {
    return (
      <div className="home-page home-loading">
        <img src="/logo.png" alt="" className="home-loading-logo" width={88} height={88} />
        <p className="home-loading-title">Kungfu&nbsp;Math</p>
        <p className="loading-text">Memuat…</p>
        <p className="home-loading-copy">© Lim Edmon 2026</p>
      </div>
    );
  }

  return (
    <div className="home-page home-wizard">
      <header className="wizard-sticky">
        <div className="home-header wizard-header-row">
          <img
            src="/logo.png"
            alt=""
            className="home-logo"
            width={48}
            height={48}
          />
          <div className="wizard-header-text">
            <h1
              className="home-title"
              style={{
                whiteSpace: 'nowrap',
                wordBreak: 'keep-all',
                overflowWrap: 'normal',
                fontSize: '1.15rem',
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: '-0.03em',
              }}
            >
              {'Kungfu\u00A0Math'}
            </h1>
            <p className="home-tagline">{t('tagline')}</p>
          </div>
          <button
            type="button"
            className="display-chip cycle header-display"
            onClick={cycleDisplayMode}
            title={`Tampilan: ${displayTitle}`}
            aria-label={`Tampilan ${displayTitle}`}
          >
            {displayIcon}
          </button>
        </div>
      </header>

      {!mapDebug && (
        <div className="wizard-progress" aria-label="Langkah">
          {([1, 2, 3] as WizardStep[]).map((s) => {
            const reach = canReachStep(s);
            return (
              <button
                key={s}
                type="button"
                className={`wizard-dot ${step === s ? 'active' : ''} ${step > s ? 'done' : ''} ${!reach ? 'locked' : ''}`}
                disabled={!reach}
                onClick={() => {
                  if (reach) setStep(s);
                }}
                aria-label={`Langkah ${s}`}
              />
            );
          })}
        </div>
      )}

      <div className="wizard-body">


        {step === 3 && mapDebug && (
          <section className="wizard-panel map-debug-panel">
            <div className="map-debug-banner" role="status">
              <strong>{t('mapDebugTitle')}</strong>
              {' — '}
              {t('mapDebugBanner')}
              <div className="map-debug-banner-hint">{t('mapDebugUrlHint')}</div>
            </div>

            

            <h3 className="subsection-title">{t('pickCity')}</h3>
            <div className="city-region-stack">
              {(() => {
                // Mapdebug: semua kota "terbuka"; pola max 3 baris sama seperti main
                const regionsWithCities = ADVENTURE_REGIONS.map((reg) => {
                  const cities = ADVENTURE_CITIES.filter((c) => c.regionId === reg.id);
                  return { reg, cities };
                }).filter((x) => x.cities.length > 0);
                const activeCity =
                  ADVENTURE_CITIES.find((c) => c.id === cityId) || ADVENTURE_CITIES[0];
                const curIdx = Math.max(
                  0,
                  regionsWithCities.findIndex((x) => x.reg.id === activeCity.regionId)
                );
                const prevRegs = regionsWithCities.slice(0, curIdx);
                const currentPack = regionsWithCities[curIdx];
                const nextRegs = regionsWithCities.slice(curIdx + 1);

                const chips = (cities: typeof ADVENTURE_CITIES) => (
                  <div className="city-chip-row" role="list">
                    {cities.map((c) => {
                      const country =
                        getLang() === 'en'
                          ? getCountryNameEn(c.countryId)
                          : getCountryNameId(c.countryId);
                      const order =
                        ADVENTURE_CITIES.findIndex((x) => x.id === c.id) + 1;
                      return (
                        <button
                          type="button"
                          key={c.id}
                          role="listitem"
                          className={`city-chip ${cityId === c.id ? 'active' : ''}`}
                          onClick={() => {
                            setCityId(c.id);
                            setRegionPanel('current');
                            setOpenSubRegion(null);
                          }}
                        >
                          <span className="city-chip-name">
                            {order}. {getLang() === 'en' ? c.nameEn : c.nameId}
                          </span>
                          <span className="city-chip-country">{country}</span>
                        </button>
                      );
                    })}
                  </div>
                );

                const subRegs = (packs: typeof regionsWithCities) => (
                  <div className="city-region-locked-list">
                    {packs.map(({ reg, cities }) => {
                      const label =
                        getLang() === 'en' ? reg.labelEn : reg.labelId;
                      const subOpen = openSubRegion === reg.id;
                      return (
                        <div key={reg.id} className="city-region-sub">
                          <button
                            type="button"
                            className="city-region-sub-head"
                            aria-expanded={subOpen}
                            onClick={() =>
                              setOpenSubRegion(subOpen ? null : reg.id)
                            }
                          >
                            {subOpen ? '▾' : '▸'} {label}
                          </button>
                          {subOpen && chips(cities)}
                        </div>
                      );
                    })}
                  </div>
                );

                return (
                  <>
                    {prevRegs.length > 0 && (
                      <div className="city-region-block dojo-region is-group-bar">
                        <button
                          type="button"
                          className="dojo-region-head city-region-label city-region-locked-summary"
                          aria-expanded={regionPanel === 'prev'}
                          onClick={() => {
                            setRegionPanel((p) =>
                              p === 'prev' ? 'current' : 'prev'
                            );
                            setOpenSubRegion(null);
                          }}
                        >
                          <span>
                            {regionPanel === 'prev' ? '▾' : '▸'}{' '}
                            {getLang() === 'en'
                              ? `Earlier regions (${prevRegs.length})`
                              : `Region sebelumnya (${prevRegs.length})`}
                          </span>
                        </button>
                        {regionPanel === 'prev' && subRegs(prevRegs)}
                      </div>
                    )}
                    {currentPack && (
                      <div className="city-region-block dojo-region is-current-region">
                        <button
                          type="button"
                          className="dojo-region-head city-region-label"
                          aria-expanded={regionPanel === 'current'}
                          onClick={() => {
                            setRegionPanel('current');
                            setOpenSubRegion(null);
                          }}
                        >
                          <span>
                            {regionPanel === 'current' ? '▾' : '▸'}{' '}
                            {getLang() === 'en'
                              ? currentPack.reg.labelEn
                              : currentPack.reg.labelId}
                          </span>
                        </button>
                        {regionPanel === 'current' && chips(currentPack.cities)}
                      </div>
                    )}
                    {nextRegs.length > 0 && (
                      <div className="city-region-block dojo-region is-group-bar">
                        <button
                          type="button"
                          className="dojo-region-head city-region-label city-region-locked-summary"
                          aria-expanded={regionPanel === 'next'}
                          onClick={() => {
                            setRegionPanel((p) =>
                              p === 'next' ? 'current' : 'next'
                            );
                            setOpenSubRegion(null);
                          }}
                        >
                          <span>
                            {regionPanel === 'next' ? '▾' : '▸'}{' '}
                            {getLang() === 'en'
                              ? `Later regions (${nextRegs.length})`
                              : `Region berikutnya (${nextRegs.length})`}
                          </span>
                        </button>
                        {regionPanel === 'next' && subRegs(nextRegs)}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

{(() => {
              const unlocked = allCityIds;
              const wonIds: string[] = [];
              return (
                <AdventureMap
                  unlockedIds={unlocked}
                  wonIds={wonIds}
                  activeId={cityId}
                  travelFromId={null}
                  travelToId={null}
                  onSelect={(id) => {
                    if (id === cityId) return;
                    setCityId(id);
                  }}
                />
              );
            })()}

                        <div className="map-debug-assets">
              <h4 className="subsection-title">{t('mapDebugAssetsTitle')}</h4>
              <p className="wizard-panel-hint">
                {assetAuditDone ? t('mapDebugAssetsDone') : t('mapDebugAssetsScanning')}
              </p>
              <div className="map-debug-asset-list">
                {ADVENTURE_CITIES.map((c) => {
                  const a = assetAudit[c.id];
                  const sel = c.id === cityId;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      className={`map-debug-asset-row${sel ? ' is-active' : ''}`}
                      onClick={() => setCityId(c.id)}
                    >
                      <span className="map-debug-asset-name">{c.nameId}</span>
                      <span
                        className={a?.bg ? 'map-debug-ok' : 'map-debug-miss'}
                        title={a?.bgPath || 'bg'}
                      >
                        BG {a ? (a.bg ? '✓' : '✗') : '…'}
                      </span>
                      <span
                        className={a?.music ? 'map-debug-ok' : 'map-debug-miss'}
                        title={a?.musicPath || 'mp3'}
                      >
                        {getLang() === 'en' ? 'Music' : 'Musik'}{' '}
                        {a ? (a.music ? '✓' : '✗') : '…'}
                      </span>
                    </button>
                  );
                })}
              </div>
              {assetAuditDone && (
                <p className="wizard-panel-hint">
                  {t('mapDebugMissingBg')}:{' '}
                  {ADVENTURE_CITIES.filter((c) => !assetAudit[c.id]?.bg)
                    .map((c) => c.id)
                    .join(', ') || '—'}
                  <br />
                  {t('mapDebugMissingMusic')}:{' '}
                  {ADVENTURE_CITIES.filter((c) => !assetAudit[c.id]?.music)
                    .map((c) => c.id)
                    .join(', ') || '—'}
                </p>
              )}
            </div>

            <div className="map-debug-exit-wrap">
              {!exitDebugConfirm ? (
                <button
                  type="button"
                  className="btn-primary map-debug-exit-btn"
                  onClick={() => setExitDebugConfirm(true)}
                >
                  {t('mapDebugExit')}
                </button>
              ) : (
                <div className="map-debug-exit-confirm" role="alertdialog" aria-modal="true">
                  <p>{t('mapDebugExitConfirm')}</p>
                  <div className="map-debug-exit-confirm-actions">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setExitDebugConfirm(false)}
                    >
                      {t('mapDebugExitNo')}
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        try {
                          const u = new URL(window.location.href);
                          u.searchParams.delete('mapdebug');
                          u.searchParams.delete('advdebug');
                          u.searchParams.delete('mapfocus');
                          u.searchParams.delete('mapzoom');
                          u.searchParams.delete('mapcenter');
                          window.location.href =
                            u.pathname + (u.search || '') + u.hash;
                        } catch {
                          window.location.href = '/';
                        }
                      }}
                    >
                      {t('mapDebugExitYes')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {step === 3 && !mapDebug && (
          <section className="wizard-panel">
            <div
              ref={fieldRefs.playKind}
              className={`wizard-field ${fieldError === 'playKind' ? 'field-error' : ''}`}
            >
            <div className="mode-buttons">
              <button
                type="button"
                className={`mode-btn ${playKind === 'latihan' ? 'active' : ''}`}
                onClick={() => { setPlayKind('latihan'); setFieldError(null); }}
              >
                <span className="mode-icon">📚</span>
                <span className="mode-name">{t('playLatihan')}</span>
                <span className="mode-desc">{t('playLatihanDesc')}</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${playKind === 'petualangan' ? 'active' : ''}`}
                onClick={() => { setPlayKind('petualangan'); setFieldError(null); }}
              >
                <span className="mode-icon">🌏</span>
                <span className="mode-name">{t('playPetualangan')}</span>
                <span className="mode-desc">{t('playPetualanganDesc')}</span>
              </button>
            </div>
            </div>

            {playKind === 'latihan' && level && getLevelById(level).operations.length > 1 && (
              <div className="ops-mode-block">
                <h3 className="subsection-title">{t('opsModeTitle')}</h3>
                <div className="mode-buttons mode-buttons-compact">
                  <button
                    type="button"
                    className={`mode-btn ${opsMode === 'random' ? 'active' : ''}`}
                    onClick={() => {
                      setOpsMode('random');
                      updateProgress({ practiceOpsMode: 'random' });
                    }}
                  >
                    <span className="mode-name">{t('opsRandom')}</span>
                    <span className="mode-desc">{t('opsRandomDesc')}</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${opsMode === 'focus' ? 'active' : ''}`}
                    onClick={() => {
                      setOpsMode('focus');
                      updateProgress({ practiceOpsMode: 'focus' });
                    }}
                  >
                    <span className="mode-name">{t('opsFocus')}</span>
                    <span className="mode-desc">{t('opsFocusDesc')}</span>
                  </button>
                </div>
                {opsMode === 'focus' && (
                  <div className="focus-ops-row">
                    {(
                      [
                        ['add', t('opAdd')],
                        ['sub', t('opSub')],
                        ['mul', t('opMul')],
                        ['div', t('opDiv')],
                      ] as const
                    )
                      .filter(([id]) =>
                        (getLevelById(level).operations as string[]).includes(id)
                      )
                      .map(([id, label]) => {
                        const on = focusOps.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            className={`focus-op-chip ${on ? 'active' : ''}`}
                            onClick={() => {
                              const allowed = getLevelById(level).operations as Array<
                                'add' | 'sub' | 'mul' | 'div'
                              >;
                              let next = on
                                ? focusOps.filter((x) => x !== id)
                                : [...focusOps, id];
                              next = next.filter((x) => allowed.includes(x));
                              if (next.length === 0) next = [id];
                              setFocusOps(next);
                              updateProgress({
                                focusOps: next,
                                practiceOpsMode: 'focus',
                              });
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {playKind === 'petualangan' && (
              <div className="city-pick">
                <div
                  ref={fieldRefs.tempo}
                  className={`wizard-field ${fieldError === 'tempo' ? 'field-error' : ''}`}
                >
                <h3 className="subsection-title">{t('tempoTitle')}</h3>
                <p className="wizard-panel-hint">{t('tempoHint')}</p>
                <div className="mode-buttons adventure-diff-buttons">
                  {ADVENTURE_DIFFICULTIES.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      className={`mode-btn ${adventureDiffId === d.id ? 'active' : ''}`}
                      onClick={() => {
                        setAdventureDiffId(d.id);
                        setFieldError(null);
                        updateProgress({ preferredAdventureDiff: d.id });
                      }}
                    >
                      <span className="mode-name">{getLang() === 'en' ? d.labelEn : d.labelId}</span>
                      <span className="mode-desc">{getLang() === 'en' ? d.descEn : d.descId}</span>
                    </button>
                  ))}
                </div>
                </div>

                <h3 className="subsection-title">{t('pickCity')}</h3>
                {(() => {
                  const prog = loadProgress();
                  const unlocked = prog.adventureUnlocked || ['jakarta'];
                  const wonIds = ADVENTURE_CITIES.filter((c) => {
                    const hs = prog.adventureHighScores?.[c.id] ?? 0;
                    return hs >= c.targetScore;
                  }).map((c) => c.id);
                  return (
                    <AdventureMap
                      unlockedIds={unlocked}
                      wonIds={wonIds}
                      activeId={cityId}
                      travelFromId={travelFrom}
                      travelToId={travelTo}
                      onTravelDone={() => {
                        setTravelFrom(null);
                        setTravelTo(null);
                      }}
                      onSelect={(id) => {
                        if (id === cityId) return;
                        setTravelFrom(cityId);
                        setTravelTo(id);
                        setCityId(id);
                        updateProgress({ adventureCityId: id });
                      }}
                    />
                  );
                })()}
                <div className="city-region-stack">
                  {(() => {
                    const prog = loadProgress();
                    const unlockedList = prog.adventureUnlocked?.length
                      ? prog.adventureUnlocked
                      : ['jakarta'];
                    const isCityOpen = (id: string) =>
                      id === 'jakarta' || unlockedList.includes(id);
                    const regionsWithCities = ADVENTURE_REGIONS.map((reg) => {
                      const cities = ADVENTURE_CITIES.filter(
                        (c) => c.regionId === reg.id
                      );
                      return { reg, cities };
                    }).filter((x) => x.cities.length > 0);

                    const activeCity =
                      ADVENTURE_CITIES.find((c) => c.id === cityId) ||
                      ADVENTURE_CITIES[0];
                    const curIdx = Math.max(
                      0,
                      regionsWithCities.findIndex(
                        (x) => x.reg.id === activeCity.regionId
                      )
                    );
                    const prevRegs = regionsWithCities.slice(0, curIdx);
                    const currentPack = regionsWithCities[curIdx];
                    const nextRegs = regionsWithCities.slice(curIdx + 1);

                    const renderCityChips = (
                      cities: typeof ADVENTURE_CITIES
                    ) => (
                      <div className="city-chip-row" role="list">
                        {cities.map((c) => {
                          const unlocked = isCityOpen(c.id);
                          const country =
                            getLang() === 'en'
                              ? getCountryNameEn(c.countryId)
                              : getCountryNameId(c.countryId);
                          const order =
                            ADVENTURE_CITIES.findIndex((x) => x.id === c.id) + 1;
                          return (
                            <button
                              type="button"
                              key={c.id}
                              role="listitem"
                              className={`city-chip ${cityId === c.id ? 'active' : ''} ${!unlocked ? 'disabled' : ''}`}
                              disabled={!unlocked}
                              onClick={() => {
                                if (!unlocked) return;
                                if (c.id !== cityId) {
                                  setTravelFrom(cityId);
                                  setTravelTo(c.id);
                                }
                                setCityId(c.id);
                                updateProgress({ adventureCityId: c.id });
                                setRegionPanel('current');
                                setOpenSubRegion(null);
                              }}
                            >
                              <span className="city-chip-name">
                                {order}.{' '}
                                {getLang() === 'en' ? c.nameEn : c.nameId}
                              </span>
                              <span className="city-chip-country">
                                {country}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );

                    const renderSubRegions = (
                      packs: typeof regionsWithCities,
                      panel: 'prev' | 'next'
                    ) => (
                      <div className="city-region-locked-list">
                        {packs.map(({ reg, cities }) => {
                          const label =
                            getLang() === 'en' ? reg.labelEn : reg.labelId;
                          const subOpen = openSubRegion === reg.id;
                          const anyOpen = cities.some((c) => isCityOpen(c.id));
                          return (
                            <div
                              key={reg.id}
                              className={`city-region-sub ${anyOpen ? '' : 'is-locked'}`}
                            >
                              <button
                                type="button"
                                className="city-region-sub-head"
                                aria-expanded={subOpen}
                                onClick={() =>
                                  setOpenSubRegion(subOpen ? null : reg.id)
                                }
                              >
                                {subOpen ? '▾' : '▸'} {label}
                                {!anyOpen && (
                                  <span className="city-region-sub-lock">
                                    {' '}
                                    🔒
                                  </span>
                                )}
                              </button>
                              {subOpen && renderCityChips(cities)}
                            </div>
                          );
                        })}
                      </div>
                    );

                    return (
                      <>
                        {prevRegs.length > 0 && (
                          <div className="city-region-block dojo-region is-group-bar">
                            <button
                              type="button"
                              className="dojo-region-head city-region-label city-region-locked-summary"
                              aria-expanded={regionPanel === 'prev'}
                              onClick={() => {
                                setRegionPanel((p) =>
                                  p === 'prev' ? 'current' : 'prev'
                                );
                                setOpenSubRegion(null);
                              }}
                            >
                              <span>
                                {regionPanel === 'prev' ? '▾' : '▸'}{' '}
                                {getLang() === 'en'
                                  ? `Earlier regions (${prevRegs.length})`
                                  : `Region sebelumnya (${prevRegs.length})`}
                              </span>
                            </button>
                            {regionPanel === 'prev' &&
                              renderSubRegions(prevRegs, 'prev')}
                          </div>
                        )}

                        {currentPack && (
                          <div className="city-region-block dojo-region is-current-region">
                            <button
                              type="button"
                              className="dojo-region-head city-region-label"
                              aria-expanded={regionPanel === 'current'}
                              onClick={() => {
                                setRegionPanel('current');
                                setOpenSubRegion(null);
                              }}
                            >
                              <span>
                                {regionPanel === 'current' ? '▾' : '▸'}{' '}
                                {getLang() === 'en'
                                  ? currentPack.reg.labelEn
                                  : currentPack.reg.labelId}
                              </span>
                            </button>
                            {regionPanel === 'current' &&
                              renderCityChips(currentPack.cities)}
                          </div>
                        )}

                        {nextRegs.length > 0 && (
                          <div className="city-region-block dojo-region is-group-bar">
                            <button
                              type="button"
                              className="dojo-region-head city-region-label city-region-locked-summary"
                              aria-expanded={regionPanel === 'next'}
                              onClick={() => {
                                setRegionPanel((p) =>
                                  p === 'next' ? 'current' : 'next'
                                );
                                setOpenSubRegion(null);
                              }}
                            >
                              <span>
                                {regionPanel === 'next' ? '▾' : '▸'}{' '}
                                {getLang() === 'en'
                                  ? `Later regions (${nextRegs.length})`
                                  : `Region berikutnya (${nextRegs.length})`}
                              </span>
                            </button>
                            {regionPanel === 'next' &&
                              renderSubRegions(nextRegs, 'next')}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="wizard-panel">
            <div
              ref={fieldRefs.arena}
              className={`wizard-field ${fieldError === 'arena' ? 'field-error' : ''}`}
            >
              <h2 className="wizard-panel-title">{t('modeTitle')}</h2>
              <div className="mode-buttons">
                <button
                  type="button"
                  className={`mode-btn ${arena === 'static' ? 'active' : ''}`}
                  onClick={() => {
                    setArena('static');
                    setFieldError(null);
                    updateProgress({ preferredArena: 'static' });
                  }}
                >
                  <span className="mode-icon">🎯</span>
                  <span className="mode-name">{t('modeStatic')}</span>
                  <span className="mode-desc">{t('modeStaticDesc')}</span>
                </button>
                <button
                  type="button"
                  className={`mode-btn ${arena === 'agility' ? 'active' : ''}`}
                  onClick={() => {
                    setArena('agility');
                    setFieldError(null);
                    updateProgress({ preferredArena: 'agility' });
                  }}
                >
                  <span className="mode-icon">⚡</span>
                  <span className="mode-name">{t('modeAgility')}</span>
                  <span className="mode-desc">{t('modeAgilityDesc')}</span>
                </button>
              </div>
            </div>

            <div
              ref={fieldRefs.level}
              className={`wizard-field ${fieldError === 'level' ? 'field-error' : ''}`}
            >
              <h3 className="subsection-title">{t('levelTitle')}</h3>
              <div className="level-list compact-levels">
              {LEVELS.map((lv) => (
                <button
                  type="button"
                  key={lv.id}
                  className={`level-btn ${level === lv.id ? 'active' : ''}`}
                  onClick={() => {
                    setLevel(lv.id);
                    setFieldError(null);
                    updateProgress({ preferredLevel: lv.id });
                  }}
                >
                  <strong>{getLang() === 'en' ? lv.labelEn : lv.labelId}</strong>
                  <span>{getLang() === 'en' ? lv.descEn : lv.descId}</span>
                </button>
              ))}
            </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="wizard-panel step-character">
            <div
              ref={fieldRefs.mode}
              className={`wizard-field ${fieldError === 'mode' ? 'field-error' : ''}`}
            >
            <div className="mode-buttons">
              <button
                type="button"
                className={`mode-btn ${mode === 'slice' ? 'active' : ''}`}
                onClick={() => { handleSelectMode('slice'); setFieldError(null); }}
              >
                <span className="mode-icon">⚔️</span>
                <span className="mode-name">{t('inputSlice')}</span>
                <span className="mode-desc">{t('inputSliceDesc')}</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${mode === 'tap' ? 'active' : ''}`}
                onClick={() => { handleSelectMode('tap'); setFieldError(null); }}
              >
                <span className="mode-icon">👊</span>
                <span className="mode-name">{t('inputTap')}</span>
                <span className="mode-desc">{t('inputTapDesc')}</span>
              </button>
            </div>
            </div>

            {mode && (
              <>
                <div
                  ref={fieldRefs.character}
                  className={`character-list character-list-spaced wizard-field ${fieldError === 'character' ? 'field-error' : ''}`}
                >
                  {getCharactersByMode(mode).map((char) => {
                    const isSelected = selectedCharacterId === char.id;
                    return (
                      <button
                        type="button"
                        key={char.id}
                        className={`character-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => { handleSelectCharacter(char.id); setFieldError(null); }}
                      >
                        <div
                          className="character-avatar"
                          style={{ backgroundColor: char.color }}
                        >
                          <img
                            src={char.imageSrc}
                            alt={char.name}
                            className="avatar-img"
                            width={96}
                            height={96}
                            onError={(e) => {
                              const el = e.currentTarget;
                              el.style.display = 'none';
                              const fb =
                                el.nextElementSibling as HTMLElement | null;
                              if (fb) fb.style.display = 'inline';
                            }}
                          />
                          <span
                            className="avatar-emoji"
                            style={{ display: 'none' }}
                            aria-hidden
                          >
                            {char.emoji}
                          </span>
                        </div>
                        <div className="character-info">
                          <strong>{char.name}</strong>
                          <span>{characterRoleLabel(char, getLang())}</span>
                        </div>
                        {isSelected && <span className="check-mark">✓</span>}
                      </button>
                    );
                  })}
                </div>

                <label className="player-name-field name-after-char">
                  <span>{t('nameOptional')}</span>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => handlePlayerNameChange(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    maxLength={16}
                    autoComplete="nickname"
                  />
                </label>
              </>
            )}
          </section>
        )}
      </div>

      {!mapDebug && (
      <div className="wizard-footer-bar">
        <div className="wizard-nav">
          {step > 1 && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep((s) => (s - 1) as WizardStep)}
            >
              {t('back')}
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const miss = missingOnStep(step);
                if (miss) {
                  focusMissing(miss);
                  return;
                }
                setFieldError(null);
                setStep((s) => (s + 1) as WizardStep);
              }}
            >
              {t('next')}
            </button>
          ) : (
            <button
              type="button"
              className={`btn-primary btn-start ${mapDebug ? 'disabled' : ''}`}
              disabled={mapDebug}
              title={mapDebug ? t('mapDebugBanner') : undefined}
              onClick={() => {
                if (mapDebug) return;
                const miss = missingOnStep(3) || (
                  !selectedCharacterId || !mode || !level || !arena || !playKind
                    ? 'playKind'
                    : null
                );
                if (miss) {
                  // mungkin field di step sebelumnya
                  if (missingOnStep(1)) {
                    setStep(1);
                    window.setTimeout(() => focusMissing(missingOnStep(1)!), 50);
                    return;
                  }
                  if (missingOnStep(2)) {
                    setStep(2);
                    window.setTimeout(() => focusMissing(missingOnStep(2)!), 50);
                    return;
                  }
                  focusMissing(miss);
                  return;
                }
                if (
                  !selectedCharacterId ||
                  !mode ||
                  !level ||
                  !arena ||
                  !playKind
                )
                  return;
                onStartGame(
                  mode,
                  selectedCharacterId,
                  level,
                  arena,
                  playKind,
                  playKind === 'petualangan'
                    ? adventureDiffId || undefined
                    : undefined,
                  playKind === 'latihan' &&
                  opsMode === 'focus' &&
                  level &&
                  getLevelById(level).operations.length > 1
                    ? focusOps.filter((op) =>
                        (getLevelById(level).operations as string[]).includes(op)
                      )
                    : undefined
                );
              }}
            >
              {t('startPlay')}
            </button>
          )}
        </div>
      </div>
      )}

      <InstallHint />
    </div>
  );
}
