/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState } from 'react';
import {
  loadProgress,
  formatRecordDate,
  arenaLabel,
  inputModeLabel,
} from '../lib/storage';
import { LEVELS, getLevelById } from '../lib/levels';
import { getCharacterById } from '../lib/characters';
import {
  ADVENTURE_CITIES,
  ADVENTURE_DIFFICULTIES,
  getCityById,
  getCountryNameId,
} from '../lib/adventure';
import type { ScoreRecord } from '../lib/types';

type DojoTab = 'level' | 'petualangan';

function tempoLabel(tempoId: string | undefined): string {
  if (!tempoId) return '';
  const d = ADVENTURE_DIFFICULTIES.find((x) => x.id === tempoId);
  return d?.labelId ?? tempoId;
}

function formatRecordMeta(
  rec: ScoreRecord | undefined,
  kind: 'level' | 'adv',
  fallbackName: string
): string {
  if (!rec || rec.score <= 0) return '';
  const parts: string[] = [];
  const by = (rec.by || '').trim();
  // Data lama "Pendekar" diganti nama aktual
  if (by && by !== 'Pendekar') parts.push(by);
  else if (fallbackName) parts.push(fallbackName);
  const tgl = formatRecordDate(rec.at);
  if (tgl) parts.push(tgl);
  parts.push(inputModeLabel(rec.inputMode));
  parts.push(arenaLabel(rec.arena));
  if (kind === 'level' && rec.levelId) {
    const lv = getLevelById(rec.levelId as import('../lib/levels').DifficultyLevel);
    if (lv?.labelId) parts.push(`Lv ${lv.labelId}`);
  }
  if (kind === 'adv' && rec.tempoId) {
    const tp = tempoLabel(rec.tempoId);
    if (tp) parts.push(`Tempo ${tp}`);
  }
  return parts.join(' · ');
}

export default function Dojo() {
  const progress = loadProgress();
  // Belum main / belum pilih: tampilkan Yu Jin (bukan Hong Yi warisan data lama)
  const preferredId =
    progress.totalGamesPlayed > 0 && progress.preferredCharacter
      ? progress.preferredCharacter
      : 'yu-jin';
  const character = getCharacterById(preferredId);
  const displayName =
    progress.playerName?.trim() || character?.name || 'Pemain';

  const [tab, setTab] = useState<DojoTab>('level');
  const [tipsOpen, setTipsOpen] = useState(false);

  const rows = LEVELS.map((lv) => {
    const rec = progress.highScoreRecords?.[lv.id];
    const score = rec?.score ?? progress.highScores[lv.id] ?? 0;
    return {
      id: lv.id,
      label: lv.labelId,
      desc: lv.descId,
      score,
      meta: formatRecordMeta(rec, 'level', displayName),
    };
  });

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
        <h1>Progres</h1>
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
                  {r.meta ? (
                    <span className="dojo-score-meta">{r.meta}</span>
                  ) : null}
                </div>
                <span className="dojo-score-value">
                  {r.score > 0 ? r.score : '—'}
                </span>
              </li>
            ))}
          </ul>
          <p className="dojo-record-note">
            Detail rekor: nama · tanggal · Slice/Tap · Diam/Ketangkasan
          </p>
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
              const rec = progress.adventureScoreRecords?.[c.id];
              const hs =
                rec?.score ?? progress.adventureHighScores?.[c.id] ?? 0;
              const passed = hs >= c.targetScore;
              const country = getCountryNameId(c.countryId);
              const isCurrent = c.id === currentCity.id;
              const meta = formatRecordMeta(rec, 'adv', displayName);
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
                    {meta ? (
                      <span className="dojo-score-meta">{meta}</span>
                    ) : null}
                  </div>
                  <span className="dojo-score-value">
                    {hs > 0 ? hs : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="dojo-record-note">
            Detail rekor: nama · tanggal · Slice/Tap · Diam/Ketangkasan · tempo
          </p>
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
              kota berikutnya. Bonus waktu tergantung tempo perjalanan.
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
