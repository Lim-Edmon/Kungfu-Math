/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { loadProgress } from '../lib/storage';
import { LEVELS } from '../lib/levels';
import { getCharacterById } from '../lib/characters';

/**
 * Dojo = ringkasan progress pemain (skor per level, total main).
 * Belum ada mode latihan khusus di sini — fokus lihat rekor dulu.
 */
export default function Dojo() {
  // Baca ulang setiap kali tab Dojo dibuka
  const progress = loadProgress();
  const character = getCharacterById(progress.preferredCharacter);
  const displayName =
    progress.playerName?.trim() || character?.name || 'Pendekar';

  const rows = LEVELS.map((lv) => ({
    id: lv.id,
    label: lv.labelId,
    desc: lv.descId,
    score: progress.highScores[lv.id] ?? 0,
  }));

  const bestOverall = rows.reduce((m, r) => Math.max(m, r.score), 0);

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
            {progress.totalGamesPlayed} kali latihan · rekor terbaik{' '}
            <strong>{bestOverall}</strong>
          </p>
        </div>
      </section>

      <section className="dojo-section">
        <h2>Skor tertinggi per level</h2>
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

      <section className="dojo-section dojo-tips-section">
        <h2>Tips singkat</h2>
        <ul className="dojo-tips">
          <li>
            <strong>Tap</strong> — ketuk angka. Cocok karakter tangan kosong.
          </li>
          <li>
            <strong>Slice</strong> — tahan lalu geser melewati angka (mouse/jari).
          </li>
          <li>
            <strong>− dan ÷</strong> — urutan klik penting (pertama lalu kedua).
          </li>
          <li>
            Hindari bom 💣 — nyawa berkurang; angka yang sudah dipilih kembali.
          </li>
        </ul>
      </section>

      <p className="dojo-note">
        Main di tab <strong>Latihan</strong> untuk menambah rekor. Progress
        tersimpan di HP ini — bisa dipindah lewat kode di <strong>Pengaturan</strong>.
      </p>
    </div>
  );
}
