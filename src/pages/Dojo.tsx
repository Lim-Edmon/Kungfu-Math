/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState } from 'react';
import { loadProgress } from '../lib/storage';
import { LEVELS } from '../lib/levels';
import { getCharacterById } from '../lib/characters';
import {
  ADVENTURE_CITIES,
  getCityById,
  getCountryNameId,
} from '../lib/adventure';

type DojoTab = 'level' | 'petualangan';

export default function Dojo() {
  const progress = loadProgress();
  const character = getCharacterById(progress.preferredCharacter);
  const displayName =
    progress.playerName?.trim() || character?.name || 'Pendekar';

  const [tab, setTab] = useState<DojoTab>('level');
  const [tipsOpen, setTipsOpen] = useState(false);

  const rows = LEVELS.map((lv) => ({
    id: lv.id,
    label: lv.labelId,
    desc: lv.descId,
    score: progress.highScores[lv.id] ?? 0,
  }));

  const bestOverall = rows.reduce((m, r) => Math.max(m, r.score), 0);

  const unlockedList = progress.adventureUnlocked?.length
    ? progress.adventureUnlocked
    : ['jakarta'];
  const unlockedCount = unlockedList.length;
  const currentCity = getCityById(
    progress.adventureCityId || 'jakarta'
  );
  const passedCount = ADVENTURE_CITIES.filter((c) => {
    const hs = progress.adventureHighScores?.[c.id] ?? 0;
    return hs >= c.targetScore;
  }).length;
  const bestAdventure = ADVENTURE_CITIES.reduce(
    (m, c) => Math.max(m, progress.adventureHighScores?.[c.id] ?? 0),
    0
  );

  return (
    <div className="dojo-page">
      <header className="dojo-header">
        <h1>Dojo</h1>
        <p className="dojo-sub">Rekor & progress kamu</p>
      </header>

      <section className="dojo-card dojo-hero">
        <div className="dojo-hero-avatar" aria-hidden>
          {character?.imageCloseSrc || character?.imageSrc ? (
            <img
              src={character.imageCloseSrc || character.imageSrc}
              alt=""
              className="dojo-hero-img"
              width={56}
              height={56}
            />
          ) : (
            <span className="dojo-hero-emoji">{character?.emoji ?? '🥋'}</span>
          )}
        </div>
        <div>
          <p className="dojo-hero-name">{displayName}</p>
          <p className="dojo-hero-meta">
            {progress.totalGamesPlayed} kali main · rekor latihan{' '}
            <strong>{bestOverall}</strong>
          </p>
          <p className="dojo-hero-meta dojo-hero-adv">
            Petualangan: {passedCount}/{ADVENTURE_CITIES.length} kota lolos ·
            posisi <strong>{currentCity.nameId}</strong>
          </p>
        </div>
      </section>

      <div className="dojo-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'level'}
          className={`dojo-tab ${tab === 'level' ? 'active' : ''}`}
          onClick={() => setTab('level')}
        >
          Per level
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'petualangan'}
          className={`dojo-tab ${tab === 'petualangan' ? 'active' : ''}`}
          onClick={() => setTab('petualangan')}
        >
          Petualangan
        </button>
      </div>

      {tab === 'level' && (
        <section className="dojo-section">
          <ul className="dojo-score-list">
            {rows.map((r) => (
              <li key={r.id} className="dojo-score-row">
                <div>
                  <span className="dojo-score-label">{r.label}</span>
                  <span className="dojo-score-desc">{r.desc}</span>
                </div>
                <span className="dojo-score-value">
                  {r.score > 0 ? r.score : '—'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'petualangan' && (
        <section className="dojo-section">
          <p className="dojo-adv-summary">
            Terbuka {unlockedCount} kota · rekor tertinggi petualangan{' '}
            <strong>{bestAdventure > 0 ? bestAdventure : '—'}</strong>
          </p>
          <ul className="dojo-score-list">
            {ADVENTURE_CITIES.map((c, i) => {
              const unlocked =
                c.id === 'jakarta' || unlockedList.includes(c.id);
              const hs = progress.adventureHighScores?.[c.id] ?? 0;
              const passed = hs >= c.targetScore;
              const country = getCountryNameId(c.countryId);
              const isCurrent = c.id === currentCity.id;
              return (
                <li
                  key={c.id}
                  className={`dojo-score-row ${isCurrent ? 'dojo-row-current' : ''}`}
                >
                  <div>
                    <span className="dojo-score-label">
                      {passed ? '✅' : unlocked ? '📌' : '🔒'} {i + 1}.{' '}
                      {c.nameId}
                      {isCurrent ? ' · sekarang' : ''}
                    </span>
                    <span className="dojo-score-desc">
                      {country} · target {c.targetScore}
                      {!unlocked ? ' · terkunci' : passed ? ' · lolos' : ''}
                    </span>
                  </div>
                  <span className="dojo-score-value">
                    {hs > 0 ? hs : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="dojo-tips-section">
        <button
          type="button"
          className="dojo-tips-toggle"
          onClick={() => setTipsOpen((o) => !o)}
          aria-expanded={tipsOpen}
        >
          <span>Tips singkat</span>
          <span className="dojo-tips-chevron" aria-hidden>
            {tipsOpen ? '▾' : '▸'}
          </span>
        </button>
        {tipsOpen && (
          <ul className="dojo-tips">
            <li>
              <strong>Tap</strong> — ketuk angka. Cocok karakter tangan kosong.
            </li>
            <li>
              <strong>Slice</strong> — tahan lalu geser melewati angka.
            </li>
            <li>
              <strong>− dan ÷</strong> — urutan klik penting (pertama lalu kedua).
            </li>
            <li>
              Hindari bom 💣 — nyawa berkurang; angka yang dipilih kembali.
            </li>
            <li>
              <strong>Petualangan</strong> — capai target skor kota untuk buka
              kota berikutnya. Bonus waktu tergantung tingkat kesulitan.
            </li>
          </ul>
        )}
      </section>

      <p className="dojo-note">
        Progress tersimpan di HP ini — bisa dipindah lewat kode di{' '}
        <strong>Pengaturan</strong>.
      </p>
    </div>
  );
}
