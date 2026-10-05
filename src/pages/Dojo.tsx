/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import { useState, useEffect, useRef, useMemo } from 'react';
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
  ADVENTURE_REGIONS,
  getCityById,
  getCountryNameId,
  getCountryNameEn,
} from '../lib/adventure';
import type { ScoreRecord } from '../lib/types';
import { t, getLang } from '../lib/i18n';
import { BADGE_DEFS } from '../lib/badges';

type DojoTab = 'level' | 'petualangan';

function tempoLabel(tempoId: string | undefined): string {
  if (!tempoId) return '';
  const d = ADVENTURE_DIFFICULTIES.find((x) => x.id === tempoId);
  if (!d) return tempoId;
  return getLang() === 'en' ? d.labelEn : d.labelId;
}

function formatRecordMeta(
  rec: ScoreRecord | undefined,
  kind: 'level' | 'adv',
  fallbackName: string
): string {
  if (!rec || rec.score <= 0) return '';
  const parts: string[] = [];
  const by = (rec.by || '').trim();
  if (by && by !== 'Pendekar') parts.push(by);
  else if (fallbackName) parts.push(fallbackName);
  const tgl = formatRecordDate(rec.at);
  if (tgl) parts.push(tgl);
  parts.push(inputModeLabel(rec.inputMode));
  parts.push(arenaLabel(rec.arena));
  if (kind === 'level' && rec.levelId) {
    const lv = getLevelById(rec.levelId as import('../lib/levels').DifficultyLevel);
    if (lv) {
      const lab = getLang() === 'en' ? lv.labelEn : lv.labelId;
      parts.push(`${t('lvPrefix')} ${lab}`);
    }
  }
  if (kind === 'adv' && rec.tempoId) {
    const tp = tempoLabel(rec.tempoId);
    if (tp) parts.push(`${t('tempoPrefix')} ${tp}`);
  }
  return parts.join(' · ');
}

export default function Dojo() {
  const [badgesOpen, setBadgesOpen] = useState(false);
  const progress = loadProgress();
  // Belum main / belum pilih: tampilkan Yu Jin (bukan Hong Yi warisan data lama)
  const preferredId =
    progress.totalGamesPlayed > 0 && progress.preferredCharacter
      ? progress.preferredCharacter
      : 'yu-jin';
  const character = getCharacterById(preferredId);
  const displayName =
    progress.playerName?.trim() || character?.name || t('playerDefault');

  const [tab, setTab] = useState<DojoTab>('level');
  const [tipsOpen, setTipsOpen] = useState(false);
  const [openRegions, setOpenRegions] = useState<Record<string, boolean>>({});
  const regionListRef = useRef<HTMLDivElement>(null);

  const rows = LEVELS.map((lv) => {
    const rec = progress.highScoreRecords?.[lv.id];
    const score = rec?.score ?? progress.highScores[lv.id] ?? 0;
    return {
      id: lv.id,
      label: getLang() === 'en' ? lv.labelEn : lv.labelId,
      desc: getLang() === 'en' ? lv.descEn : lv.descId,
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

  /** Region aktif = region kota saat ini; next = region berikutnya jika ada kota terbuka di sana */
  const activeRegionId = currentCity.regionId;
  const regionsWithUnlock = useMemo(() => {
    const set = new Set<string>();
    unlockedList.forEach((id) => {
      const c = ADVENTURE_CITIES.find((x) => x.id === id);
      if (c) set.add(c.regionId);
    });
    set.add('id');
    return set;
  }, [unlockedList]);

  // Default buka: HANYA region aktif (user bisa buka manual region lain)
  useEffect(() => {
    if (tab !== 'petualangan') return;
    const init: Record<string, boolean> = {};
    ADVENTURE_REGIONS.forEach((r) => {
      init[r.id] = r.id === activeRegionId;
    });
    setOpenRegions(init);
  }, [tab, activeRegionId]);

  // Klik di luar list region → collapse semua kecuali region aktif
  useEffect(() => {
    if (tab !== 'petualangan') return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = regionListRef.current;
      if (!el) return;
      const target = e.target as Node;
      if (el.contains(target)) return;
      setOpenRegions((prev) => {
        const next = { ...prev };
        ADVENTURE_REGIONS.forEach((r) => {
          next[r.id] = r.id === activeRegionId;
        });
        return next;
      });
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [tab, activeRegionId]);

  return (
    <div className="dojo-page">
      <header className="dojo-header">
        <h1>{t('dojoTitle')}</h1>
        <p className="dojo-sub">{t('dojoSub')}</p>
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
            {progress.totalGamesPlayed} {t('gamesPlayed')} · {t('practiceRecord')}{' '}
            <strong>{bestOverall}</strong>
          </p>
          <p className="dojo-hero-meta dojo-hero-adv">
            {t('adventureProgress')}: {passedCount}/{ADVENTURE_CITIES.length} {t('citiesCleared')} ·
            {t('position')} <strong>{getLang() === 'en' ? currentCity.nameEn : currentCity.nameId}</strong>
          </p>
        </div>
      </section>


      <section className="dojo-stats-card" aria-label="Streak">
        <h3 className="dojo-section-title">{t('streakTitle')}</h3>
        {(progress.dailyStreak || 0) > 0 ? (
          <p className="dojo-streak-line">
            🔥 <strong>{progress.dailyStreak}</strong> {t('streakDays')}
          </p>
        ) : (
          <p className="settings-note">{t('streakNone')}</p>
        )}
      </section>

      <section className="dojo-stats-card" aria-label="Combo records">
        <h3 className="dojo-section-title">{t('recordsTitle')}</h3>
        <ul className="dojo-record-list">
          <li>
            {t('maxComboPractice')}: <strong>×{progress.maxComboPractice || 0}</strong>
          </li>
          <li>
            {t('maxComboAdventure')}: <strong>×{progress.maxComboAdventure || 0}</strong>
          </li>
          <li>
            {t('perfectCityStreakLabel')}:{' '}
            <strong>{progress.perfectCityStreak || 0}</strong>
          </li>
        </ul>
      </section>

      <section className="dojo-stats-card" aria-label="Badges">
        <button
          type="button"
          className="dojo-collapse-btn"
          onClick={() => setBadgesOpen((v) => !v)}
          aria-expanded={badgesOpen}
        >
          <h3 className="dojo-section-title">
            {t('badgesTitle')}
            <span className="dojo-collapse-hint">
              {badgesOpen ? t('badgesToggleHide') : t('badgesToggle')}
            </span>
          </h3>
        </button>
        {badgesOpen && (
          <>
            <ul className="badge-grid">
              {BADGE_DEFS.map((b) => {
                const unlocked = (progress.badges || []).includes(b.id);
                const title = getLang() === 'en' ? b.titleEn : b.titleId;
                const desc = getLang() === 'en' ? b.descEn : b.descId;
                return (
                  <li
                    key={b.id}
                    className={`badge-item ${unlocked ? '' : 'locked'}`}
                    title={desc}
                  >
                    <span className="badge-emoji">{unlocked ? b.emoji : '🔒'}</span>
                    <span className="badge-title">{title}</span>
                  </li>
                );
              })}
            </ul>
            {(progress.badges || []).length === 0 && (
              <p className="settings-note">{t('badgesEmpty')}</p>
            )}
          </>
        )}
      </section>

      <div className="dojo-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'level'}
          className={`dojo-tab ${tab === 'level' ? 'active' : ''}`}
          onClick={() => setTab('level')}
        >
          {t('tabPerLevel')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'petualangan'}
          className={`dojo-tab ${tab === 'petualangan' ? 'active' : ''}`}
          onClick={() => setTab('petualangan')}
        >
          {t('tabAdventure')}
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
        </section>
      )}

      {tab === 'petualangan' && (
        <section className="dojo-section">
          <p className="dojo-adv-summary">
            {t('citiesOpen')} {unlockedCount} {t('citiesUnit')} · {t('bestAdventure')}{' '}
            <strong>{bestAdventure > 0 ? bestAdventure : '—'}</strong>
          </p>
          <div className="dojo-region-list" ref={regionListRef}>
            {ADVENTURE_REGIONS.map((reg) => {
              const cities = ADVENTURE_CITIES.filter((c) => c.regionId === reg.id);
              if (!cities.length) return null;
              const regionUnlocked = regionsWithUnlock.has(reg.id);
              const open = !!openRegions[reg.id];
              const label =
                getLang() === 'en' ? reg.labelEn : reg.labelId;
              const openCount = cities.filter(
                (c) => c.id === 'jakarta' || unlockedList.includes(c.id)
              ).length;
              return (
                <div
                  key={reg.id}
                  className={`dojo-region ${regionUnlocked ? '' : 'is-locked'}`}
                >
                  <button
                    type="button"
                    className="dojo-region-head"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenRegions((prev) => ({
                        ...prev,
                        [reg.id]: !prev[reg.id],
                      }))
                    }
                  >
                    <span>
                      {open ? '▾' : '▸'} {label}
                    </span>
                    <span className="dojo-region-meta">
                      {openCount}/{cities.length}
                      {!regionUnlocked ? ` · ${t('locked')}` : ''}
                    </span>
                  </button>
                  {open && (
                    <ul className="dojo-score-list dojo-region-body">
                      {cities.map((c) => {
                        const i = ADVENTURE_CITIES.findIndex((x) => x.id === c.id);
                        const unlocked =
                          c.id === 'jakarta' || unlockedList.includes(c.id);
                        const rec = progress.adventureScoreRecords?.[c.id];
                        const hs =
                          rec?.score ??
                          progress.adventureHighScores?.[c.id] ??
                          0;
                        const passed = hs >= c.targetScore;
                        const country =
                          getLang() === 'en'
                            ? getCountryNameEn(c.countryId)
                            : getCountryNameId(c.countryId);
                        const isCurrent = c.id === currentCity.id;
                        const meta = formatRecordMeta(rec, 'adv', displayName);
                        return (
                          <li
                            key={c.id}
                            className={`dojo-score-row ${isCurrent ? 'dojo-row-current' : ''}`}
                          >
                            <div>
                              <span className="dojo-score-label">
                                {passed ? '✅' : unlocked ? '📌' : '🔒'}{' '}
                                {i + 1}.{' '}
                                {getLang() === 'en' ? c.nameEn : c.nameId}
                                {isCurrent ? ` · ${t('nowHere')}` : ''}
                              </span>
                              <span className="dojo-score-desc">
                                {country} · {t('target')} {c.targetScore}
                                {!unlocked
                                  ? ` · ${t('locked')}`
                                  : passed
                                    ? ` · ${t('cleared')}`
                                    : ''}
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
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="dojo-tips-section">
        <button
          type="button"
          className="dojo-tips-toggle"
          onClick={() => setTipsOpen((o) => !o)}
          aria-expanded={tipsOpen}
        >
          <span>{t('tipsTitle')}</span>
          <span className="dojo-tips-chevron" aria-hidden>
            {tipsOpen ? '▾' : '▸'}
          </span>
        </button>
        {tipsOpen && (
          <ul className="dojo-tips">
            <li>{t('tipSlice')}</li>
            <li>{t('tipTap')}</li>
            <li>{t('tipAgility')}</li>
            <li>{t('tipAdventure')}</li>
            <li>{t('tipExport')}</li>
          </ul>
        )}
      </section>

      
    </div>
  );
}
