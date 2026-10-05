/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState, useEffect } from 'react';
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
import { LEVELS } from '../lib/levels';
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

type WizardStep = 1 | 2 | 3 | 4;

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
  const [adventureDiffId, setAdventureDiffId] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] =
    useState<CharacterId | null>(null);
  const [level, setLevel] = useState<DifficultyLevel | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('siang');
  const [playerName, setPlayerName] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (initialPlayKind) {
      setPlayKind(initialPlayKind);
      setStep(2);
    }
  }, [initialPlayKind]);

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

  const canGoNext = (): boolean => {
    if (step === 1) return level != null;
    if (step === 2) {
      if (playKind == null) return false;
      if (playKind === 'petualangan' && adventureDiffId == null) return false;
      return true;
    }
    if (step === 3) return arena != null;
    return false;
  };


  /** Boleh buka langkah s hanya jika mandatory langkah sebelumnya terpenuhi */
  const canReachStep = (s: WizardStep): boolean => {
    if (s === 1) return true;
    if (s >= 2 && level == null) return false;
    if (s >= 3) {
      if (playKind == null) return false;
      if (playKind === 'petualangan' && adventureDiffId == null) return false;
    }
    if (s >= 4 && arena == null) return false;
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

      <div className="wizard-progress" aria-label="Langkah">
        {([1, 2, 3, 4] as WizardStep[]).map((s) => {
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

      <div className="wizard-body">
        {step === 1 && (
          <section className="wizard-panel">
            <h2 className="wizard-panel-title">{t('levelTitle')}</h2>
            <p className="wizard-panel-hint">{t('levelHint')}</p>
            <div className="level-list compact-levels">
              {LEVELS.map((lv) => (
                <button
                  type="button"
                  key={lv.id}
                  className={`level-btn ${level === lv.id ? 'active' : ''}`}
                  onClick={() => {
                    setLevel(lv.id);
                    updateProgress({ preferredLevel: lv.id });
                  }}
                >
                  <strong>{getLang() === 'en' ? lv.labelEn : lv.labelId}</strong>
                  <span>{getLang() === 'en' ? lv.descEn : lv.descId}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="wizard-panel">
            <div className="mode-buttons">
              <button
                type="button"
                className={`mode-btn ${playKind === 'latihan' ? 'active' : ''}`}
                onClick={() => setPlayKind('latihan')}
              >
                <span className="mode-icon">📚</span>
                <span className="mode-name">{t('playLatihan')}</span>
                <span className="mode-desc">{t('playLatihanDesc')}</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${playKind === 'petualangan' ? 'active' : ''}`}
                onClick={() => setPlayKind('petualangan')}
              >
                <span className="mode-icon">🌏</span>
                <span className="mode-name">{t('playPetualangan')}</span>
                <span className="mode-desc">{t('playPetualanganDesc')}</span>
              </button>
            </div>

            {playKind === 'latihan' && (
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
                    ).map(([id, label]) => {
                      const on = focusOps.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`focus-op-chip ${on ? 'active' : ''}`}
                          onClick={() => {
                            let next = on
                              ? focusOps.filter((x) => x !== id)
                              : [...focusOps, id];
                            if (next.length === 0) next = [id];
                            setFocusOps(next);
                            updateProgress({ focusOps: next, practiceOpsMode: 'focus' });
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
                <h3 className="subsection-title">{t('tempoTitle')}</h3>
                <p className="wizard-panel-hint">{t('tempoHint')}</p>
                <div className="mode-buttons adventure-diff-buttons">
                  {ADVENTURE_DIFFICULTIES.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      className={`mode-btn ${adventureDiffId === d.id ? 'active' : ''}`}
                      onClick={() => setAdventureDiffId(d.id)}
                    >
                      <span className="mode-name">{getLang() === 'en' ? d.labelEn : d.labelId}</span>
                      <span className="mode-desc">{getLang() === 'en' ? d.descEn : d.descId}</span>
                    </button>
                  ))}
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
                  {ADVENTURE_REGIONS.map((reg) => {
                    const cities = ADVENTURE_CITIES.filter(
                      (c) => c.regionId === reg.id
                    );
                    if (cities.length === 0) return null;
                    const activeCity = ADVENTURE_CITIES.find((c) => c.id === cityId);
                    const isActiveReg = (activeCity?.regionId || 'id') === reg.id;
                    const open =
                      openHomeRegions[reg.id] !== undefined
                        ? !!openHomeRegions[reg.id]
                        : isActiveReg;
                    const label = getLang() === 'en' ? reg.labelEn : reg.labelId;
                    return (
                      <div key={reg.id} className="city-region-block dojo-region">
                        <button
                          type="button"
                          className="dojo-region-head city-region-label"
                          aria-expanded={open}
                          onClick={() =>
                            setOpenHomeRegions((prev) => ({
                              ...prev,
                              [reg.id]: !open,
                            }))
                          }
                        >
                          <span>
                            {open ? '▾' : '▸'} {label}
                          </span>
                        </button>
                        {open && (
                          <div className="city-chip-row" role="list">
                            {cities.map((c) => {
                              const prog = loadProgress();
                              const unlockedList = prog.adventureUnlocked?.length
                                ? prog.adventureUnlocked
                                : ['jakarta'];
                              const unlocked =
                                c.id === 'jakarta' ||
                                unlockedList.includes(c.id);
                              const country =
                                getLang() === 'en'
                                  ? getCountryNameEn(c.countryId)
                                  : getCountryNameId(c.countryId);
                              const order =
                                ADVENTURE_CITIES.findIndex((x) => x.id === c.id) +
                                1;
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
                                    setOpenHomeRegions((prev) => ({
                                      ...prev,
                                      [c.regionId]: true,
                                    }));
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="wizard-panel">
            <h2 className="wizard-panel-title">{t('modeTitle')}</h2>
            <p className="wizard-panel-hint">{t('modeHint')}</p>
            <div className="mode-buttons">
              <button
                type="button"
                className={`mode-btn ${arena === 'static' ? 'active' : ''}`}
                onClick={() => {
                  setArena('static');
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
                  updateProgress({ preferredArena: 'agility' });
                }}
              >
                <span className="mode-icon">⚡</span>
                <span className="mode-name">{t('modeAgility')}</span>
                <span className="mode-desc">{t('modeAgilityDesc')}</span>
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="wizard-panel step-character">
            <div className="mode-buttons">
              <button
                type="button"
                className={`mode-btn ${mode === 'slice' ? 'active' : ''}`}
                onClick={() => handleSelectMode('slice')}
              >
                <span className="mode-icon">⚔️</span>
                <span className="mode-name">{t('inputSlice')}</span>
                <span className="mode-desc">{t('inputSliceDesc')}</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${mode === 'tap' ? 'active' : ''}`}
                onClick={() => handleSelectMode('tap')}
              >
                <span className="mode-icon">👊</span>
                <span className="mode-name">{t('inputTap')}</span>
                <span className="mode-desc">{t('inputTapDesc')}</span>
              </button>
            </div>

            {mode && (
              <>
                <div className="character-list character-list-spaced">
                  {getCharactersByMode(mode).map((char) => {
                    const isSelected = selectedCharacterId === char.id;
                    return (
                      <button
                        type="button"
                        key={char.id}
                        className={`character-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectCharacter(char.id)}
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
          {step < 4 ? (
            <button
              type="button"
              className={`btn-primary ${!canGoNext() ? 'disabled' : ''}`}
              disabled={!canGoNext()}
              onClick={() => {
                if (!canGoNext()) return;
                setStep((s) => (s + 1) as WizardStep);
              }}
            >
              {t('next')}
            </button>
          ) : (
            <button
              type="button"
              className={`btn-primary btn-start ${!canStart ? 'disabled' : ''}`}
              disabled={!canStart}
              onClick={() => {
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
                  playKind === 'latihan' && opsMode === 'focus'
                    ? focusOps
                    : undefined
                );
              }}
            >
              {t('startPlay')}
            </button>
          )}
        </div>
      </div>

      <InstallHint />
    </div>
  );
}
