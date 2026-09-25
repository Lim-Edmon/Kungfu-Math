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
} from '../lib/adventure';
import type { DifficultyLevel } from '../lib/levels';
import { LEVELS } from '../lib/levels';
import { loadProgress, updateProgress } from '../lib/storage';
import {
  getCharactersByMode,
  getCharacterById,
  getDefaultCharacter,
} from '../lib/characters';
import InstallHint from '../components/InstallHint';
import AdventureMap from '../components/AdventureMap';
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
    adventureDiffId?: string
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
  const [playKind, setPlayKind] = useState<PlayKind | null>(
    initialPlayKind ?? null
  );
  const [cityId, setCityId] = useState('jakarta');
  const [travelFrom, setTravelFrom] = useState<string | null>(null);
  const [travelTo, setTravelTo] = useState<string | null>(null);
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
        <p className="home-loading-title">Kungfu Math</p>
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
            width={84}
            height={84}
          />
          <div className="wizard-header-text">
            <h1 className="home-title">Kungfu Math</h1>
            <p className="home-tagline">Latih hitung ala pendekar</p>
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
                  <strong>{lv.labelId}</strong>
                  <span>{lv.descId}</span>
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
                <span className="mode-name">Latihan</span>
                <span className="mode-desc">Waktu tetap 60 detik</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${playKind === 'petualangan' ? 'active' : ''}`}
                onClick={() => setPlayKind('petualangan')}
              >
                <span className="mode-icon">🌏</span>
                <span className="mode-name">Petualangan</span>
                <span className="mode-desc">Jelajah kota · bonus waktu</span>
              </button>
            </div>

            {playKind === 'petualangan' && (
              <div className="city-pick">
                <h3 className="subsection-title">Tingkat petualangan</h3>
                <div className="mode-buttons adventure-diff-buttons">
                  {ADVENTURE_DIFFICULTIES.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      className={`mode-btn ${adventureDiffId === d.id ? 'active' : ''}`}
                      onClick={() => setAdventureDiffId(d.id)}
                    >
                      <span className="mode-name">{d.labelId}</span>
                      <span className="mode-desc">{d.descId}</span>
                    </button>
                  ))}
                </div>

                <h3 className="subsection-title">Pilih kota</h3>
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
                <p className="character-hint">
                  Ketuk pin atau chip · nomor = urutan jalur
                </p>
                <div className="city-region-stack">
                  {ADVENTURE_REGIONS.map((reg) => {
                    const cities = ADVENTURE_CITIES.filter(
                      (c) => c.regionId === reg.id
                    );
                    if (cities.length === 0) return null;
                    return (
                      <div key={reg.id} className="city-region-block">
                        <p className="city-region-label">{reg.labelId}</p>
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
                              c.countryId === 'id'
                                ? 'Indonesia'
                                : c.countryId === 'my'
                                  ? 'Malaysia'
                                  : c.countryId === 'sg'
                                    ? 'Singapura'
                                    : c.countryId;
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
                                }}
                              >
                                <span className="city-chip-name">
                                  {order}. {c.nameId}
                                </span>
                                <span className="city-chip-country">
                                  {country}
                                </span>
                              </button>
                            );
                          })}
                        </div>
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
                <span className="mode-name">Diam</span>
                <span className="mode-desc">Bola diam di tempat</span>
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
                <span className="mode-name">Ketangkasan</span>
                <span className="mode-desc">Bola bergerak</span>
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
                <span className="mode-name">Slice</span>
                <span className="mode-desc">Geser / tebas</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${mode === 'tap' ? 'active' : ''}`}
                onClick={() => handleSelectMode('tap')}
              >
                <span className="mode-icon">👊</span>
                <span className="mode-name">Tap</span>
                <span className="mode-desc">Tekan bola</span>
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
                          <span>{char.nicknameId}</span>
                        </div>
                        {isSelected && <span className="check-mark">✓</span>}
                      </button>
                    );
                  })}
                </div>

                <label className="player-name-field name-after-char">
                  <span>Nama (opsional)</span>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => handlePlayerNameChange(e.target.value)}
                    placeholder="Namamu"
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
              Kembali
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
              Lanjut
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
                    : undefined
                );
              }}
            >
              Mulai Bermain
            </button>
          )}
        </div>
      </div>

      <InstallHint />
    </div>
  );
}
