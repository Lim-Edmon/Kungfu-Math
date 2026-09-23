/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState, useEffect } from 'react';
import type { ArenaStyle, CharacterId, DisplayMode, InputMode } from '../lib/types';
import { ADVENTURE_CITIES } from '../lib/adventure';
import type { DifficultyLevel } from '../lib/levels';
import { LEVELS } from '../lib/levels';
import { loadProgress, updateProgress } from '../lib/storage';
import { getCharactersByMode, getCharacterById } from '../lib/characters';
import InstallHint from '../components/InstallHint';
import { sfx } from '../lib/sound';

export type PlayKind = 'latihan' | 'petualangan';

interface HomeProps {
  onStartGame: (
    mode: InputMode,
    characterId: CharacterId,
    level: DifficultyLevel,
    arena: ArenaStyle,
    playKind: PlayKind
  ) => void;
}

export default function Home({ onStartGame }: HomeProps) {
  const [mode, setMode] = useState<InputMode>('slice');
  const [arena, setArena] = useState<ArenaStyle>('static');
  const [playKind, setPlayKind] = useState<PlayKind>('latihan');
  const [cityId, setCityId] = useState('shanghai');
  const [selectedCharacterId, setSelectedCharacterId] =
    useState<CharacterId | null>(null);
  const [level, setLevel] = useState<DifficultyLevel>('pemula');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('siang');
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [playerName, setPlayerName] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const progress = loadProgress();
    setMode(progress.preferredMode);
    setArena(progress.preferredArena ?? 'static');
    setCityId(progress.adventureCityId ?? 'shanghai');
    setDisplayMode(progress.displayMode);
    setLevel(progress.preferredLevel ?? 'pemula');
    setHighScores(progress.highScores ?? {});
    setPlayerName(progress.playerName ?? '');
    document.documentElement.setAttribute('data-theme', progress.displayMode);

    const savedChar = getCharacterById(progress.preferredCharacter);
    if (savedChar && savedChar.mode === progress.preferredMode) {
      setSelectedCharacterId(progress.preferredCharacter);
    } else {
      setSelectedCharacterId(null);
    }

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

  const handleModeChange = (newMode: InputMode) => {
    setMode(newMode);
    setSelectedCharacterId(null);
    updateProgress({ preferredMode: newMode });
  };

  const handleArenaChange = (next: ArenaStyle) => {
    setArena(next);
    updateProgress({ preferredArena: next });
  };

  const handleSelectCharacter = (id: CharacterId) => {
    setSelectedCharacterId(id);
    updateProgress({ preferredCharacter: id });
    sfx.select();
  };

  const handleLevelChange = (id: DifficultyLevel) => {
    setLevel(id);
    updateProgress({ preferredLevel: id });
  };

  const characters = getCharactersByMode(mode);
  const canStart = selectedCharacterId !== null;

  if (!ready) {
    return (
      <div className="loading-screen">
        <p>Memuat Kungfu Math...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="logo-row">
          <img
            src="/logo.png"
            alt=""
            className="app-logo"
            width={48}
            height={48}
          />
          <h1 className="logo">Kungfu Math</h1>
        </div>
        <p className="tagline">Latih hitung cepat ala pendekar!</p>
      </header>

      {/* Mode Tampilan */}
      <section className="display-section">
        <h3>Mode Tampilan</h3>
        <div className="display-buttons">
          <button
            type="button"
            className={`display-btn ${displayMode === 'siang' ? 'active' : ''}`}
            onClick={() => handleDisplayChange('siang')}
          >
            ☀️ Siang
          </button>
          <button
            type="button"
            className={`display-btn ${displayMode === 'malam' ? 'active' : ''}`}
            onClick={() => handleDisplayChange('malam')}
          >
            🌙 Malam
          </button>
          <button
            type="button"
            className={`display-btn ${displayMode === 'nyaman' ? 'active' : ''}`}
            onClick={() => handleDisplayChange('nyaman')}
          >
            👁️ Nyaman Mata
          </button>
        </div>
      </section>

      {/* Nama pemain */}
      <section className="player-name-section">
        <h2>Nama pendekarmu</h2>
        <input
          type="text"
          className="player-name-input"
          placeholder="Contoh: Budi, Aya, Ninja Kecil..."
          value={playerName}
          maxLength={16}
          onChange={(e) => handlePlayerNameChange(e.target.value)}
        />
        <p className="character-hint">
          Opsional — muncul di game menggantikan nama karakter
        </p>
      </section>

      {/* 1. Level */}
      <section className="level-section">
        <h2>1. Pilih Level</h2>
        <div className="level-list">
          {LEVELS.map((lv) => {
            const hs = highScores[lv.id];
            return (
              <button
                type="button"
                key={lv.id}
                className={`level-btn ${level === lv.id ? 'active' : ''}`}
                onClick={() => handleLevelChange(lv.id)}
              >
                <strong>{lv.labelId}</strong>
                <span>{lv.descId}</span>
                {typeof hs === 'number' && hs > 0 && (
                  <span className="level-highscore">Rekor: {hs}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Jenis main */}
      <section className="mode-section">
        <h2>2. Jenis Main</h2>
        <div className="mode-buttons">
          <button
            type="button"
            className={`mode-btn ${playKind === 'latihan' ? 'active' : ''}`}
            onClick={() => setPlayKind('latihan')}
          >
            <span className="mode-icon">📚</span>
            <span className="mode-name">Latihan</span>
            <span className="mode-desc">Timer 60 detik, level bebas</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${playKind === 'petualangan' ? 'active' : ''}`}
            onClick={() => setPlayKind('petualangan')}
          >
            <span className="mode-icon">🌏</span>
            <span className="mode-name">Petualangan</span>
            <span className="mode-desc">Kota + bonus waktu</span>
          </button>
        </div>
        {playKind === 'petualangan' && (
          <div className="city-pick">
            <p className="character-hint">Kota aktif (terbuka saja yang bisa dipilih)</p>
            <div className="level-list">
              {ADVENTURE_CITIES.map((c) => {
                const prog = loadProgress();
                const unlocked = (prog.adventureUnlocked || ['shanghai']).includes(c.id);
                const hs = prog.adventureHighScores?.[c.id] ?? 0;
                return (
                  <button
                    type="button"
                    key={c.id}
                    className={`level-btn ${cityId === c.id ? 'active' : ''} ${!unlocked ? 'disabled' : ''}`}
                    disabled={!unlocked}
                    onClick={() => {
                      if (!unlocked) return;
                      setCityId(c.id);
                      updateProgress({ adventureCityId: c.id });
                    }}
                  >
                    <strong>{c.nameId}</strong>
                    <span>{c.blurbId}</span>
                    <span className="level-highscore">
                      Target {c.targetScore}
                      {hs > 0 ? ` · Rekor ${hs}` : ''}
                      {!unlocked ? ' · Terkunci' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3. Arena */}
      <section className="mode-section arena-section">
        <h2>3. Arena</h2>
        <div className="mode-buttons">
          <button
            type="button"
            className={`mode-btn ${arena === 'static' ? 'active' : ''}`}
            onClick={() => handleArenaChange('static')}
          >
            <span className="mode-icon">🎯</span>
            <span className="mode-name">Diam</span>
            <span className="mode-desc">Angka diam di tempat</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${arena === 'agility' ? 'active' : ''}`}
            onClick={() => handleArenaChange('agility')}
          >
            <span className="mode-icon">💨</span>
            <span className="mode-name">Ketangkasan</span>
            <span className="mode-desc">Angka bergerak & mantul</span>
          </button>
        </div>
      </section>

      {/* 3–4. Cara main + pendekar (satu alur) */}
      <div className="play-setup">
      <section className="mode-section">
        <h2>4. Pilih Cara Main</h2>
        <div className="mode-buttons">
          <button
            type="button"
            className={`mode-btn ${mode === 'slice' ? 'active' : ''}`}
            onClick={() => handleModeChange('slice')}
          >
            <span className="mode-icon">⚔️</span>
            <span className="mode-name">Slice</span>
            <span className="mode-desc">Geser untuk tebas</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'tap' ? 'active' : ''}`}
            onClick={() => handleModeChange('tap')}
          >
            <span className="mode-icon">👊</span>
            <span className="mode-name">Tap</span>
            <span className="mode-desc">Tekan angka yang benar</span>
          </button>
        </div>
      </section>

      <section className="character-section">
        <h2>5. Pilih Pendekar</h2>
        <p className="character-hint">
          {mode === 'slice'
            ? 'Slice → pendekar bersenjata'
            : 'Tap → pendekar tangan kosong'}{' '}
          — wajib dipilih sebelum mulai
        </p>
        <div className="character-list">
          {characters.map((char) => {
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
                      const t = e.currentTarget;
                      t.style.display = 'none';
                      const fallback = t.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = 'inline';
                    }}
                  />
                  <span className="avatar-emoji" style={{ display: 'none' }} aria-hidden>
                    {char.emoji}
                  </span>
                </div>
                <div className="character-info">
                  <strong>{char.name}</strong>
                  <span>{char.nicknameId}</span>
                  <span className="char-blurb">{char.blurbId}</span>
                </div>
                {isSelected && <span className="check-mark">✓</span>}
              </button>
            );
          })}
        </div>
      </section>
      </div>

      <div className="start-section">
        <button
          type="button"
          className={`btn-primary btn-start ${!canStart ? 'disabled' : ''}`}
          disabled={!canStart}
          onClick={() => {
            if (selectedCharacterId) {
              onStartGame(mode, selectedCharacterId, level, arena, playKind);
            }
          }}
        >
          {canStart ? 'Mulai Latihan' : 'Pilih Pendekar Dulu'}
        </button>
      </div>

      <InstallHint />
    </div>
  );
}
