/**
 * Kungfu Math — Root component (Home / Game / Settings / Result / Dojo).
 * ---------------------------------------------------------------------
 * Author       : Lim Edmon
 * Built with   : AI coding partners (including Grok / xAI and others),
 *                as development assistants — final product owned by author
 * Created      : September 2026
 * Project type : Personal educational game (consumer / community)
 *
 * Copyright (c) 2026 Lim Edmon. All Rights Reserved.
 * Proprietary — not open source. See LICENSE and README.
 *
 * Disclaimer:
 * Provided as-is for education and personal play. Not audited for
 * production security, payments, or sensitive data. Unauthorized
 * copying, redistribution, or claiming this work as your own is
 * prohibited without prior written permission from the author.
 * ---------------------------------------------------------------------
 */

import { useState, useEffect , useRef } from 'react';
import Home, { type PlayKind } from './pages/Home';
import Game from './pages/Game';
import Settings from './pages/Settings';
import Tutorial from './components/Tutorial';
import Dojo from './pages/Dojo';
import Footer from './components/Footer';
import BottomNav, { type NavTab } from './components/BottomNav';
import AdventureMap from './components/AdventureMap';
import { playMenuBgm, stopAllMusic, installMusicBackgroundGuard } from './lib/sound';
import type { ArenaStyle, CharacterId, InputMode } from './lib/types';
import type { DifficultyLevel } from './lib/levels';
import { getLevelById } from './lib/levels';
import {
  loadProgress,
  recordGameResult,
  recordAdventureScore,
  updateProgress,
} from './lib/storage';
import {
  ADVENTURE_CITIES,
  getCityById,
  getNextCityId,
  getNextPlayableCityId,
  getAdventureDifficulty,
  pickCityFunFact,
  cityBgCandidates,
  MVP_REGION_LAST_CITY_ID,
  MVP_REGION_UNLOCK_MSG,
} from './lib/adventure';
import { setLang, detectLangFromDevice, t, getLang } from './lib/i18n';
import { useOnline, getIsOnline } from './lib/offline';
import OfflineBanner from './components/OfflineBanner';
import {
  nextDailyStreak,
  evaluateNewBadges,
  getBadgeDef,
} from './lib/badges';
import './styles/theme.css';
import './App.css';

type Screen = 'home' | 'game' | 'result' | 'settings' | 'dojo';

function resultHeadline(
  grade: string,
  isNewRecord: boolean,
  score: number,
  opts?: { passedCity?: boolean; cityName?: string; journeyComplete?: boolean }
): { title: string; sub: string; tone: string } {
  if (opts?.journeyComplete) {
    return {
      title: t('journeyEndTitle'),
      sub: t('journeyEndBody'),
      tone: 'record',
    };
  }
  if (isNewRecord) {
    return {
      title: t('newRecord'),
      sub: t('newRecordSub'),
      tone: 'record',
    };
  }
  if (opts?.passedCity) {
    return {
      title: t('cityCleared'),
      sub: opts.cityName
        ? getLang() === 'en'
          ? `Target in ${opts.cityName} reached. You can continue to the next city!`
          : `Target ${opts.cityName} tercapai. Kamu bisa lanjut ke kota berikut!`
        : getLang() === 'en'
          ? 'City target reached. You can continue to the next city!'
          : 'Target kota tercapai. Kamu bisa lanjut ke kota berikut!',
      tone: 'great',
    };
  }
  if (grade === 'S' || grade === 'A') {
    return {
      title: 'Keren banget!',
      sub: 'Hitunganmu sudah jago, pendekar!',
      tone: 'great',
    };
  }
  if (grade === 'B') {
    return {
      title: 'Bagus semangat!',
      sub: 'Sudah bagus. Coba sekali lagi biar lebih tinggi!',
      tone: 'good',
    };
  }
  if (score <= 0) {
    return {
      title: t('timeUp'),
      sub: 'Tidak apa-apa. Yuk coba lagi!',
      tone: 'try',
    };
  }
  return {
    title: 'Sudah berusaha!',
    sub: t('timeUpSub'),
    tone: 'try',
  };
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedMode, setSelectedMode] = useState<InputMode>('slice');
  const [selectedArena, setSelectedArena] = useState<ArenaStyle>('static');
  const [playKind, setPlayKind] = useState<PlayKind>('latihan');
  const [adventureDiffId, setAdventureDiffId] = useState('ringan');
  const [passedCity, setPassedCity] = useState(false);
  /** Gagal tembus target kota beruntun (session) → hint mode lebih sulit */
  const [cityFailStreak, setCityFailStreak] = useState(0);
  const [funFact, setFunFact] = useState<string | null>(null);
  /** Fun fact: popup manual close (anak sempat baca) */
  const [funFactOpen, setFunFactOpen] = useState(false);
  const [nextCityId, setNextCityId] = useState<string | null>(null);
  /** Transisi full-screen peta + pesawat sebelum masuk kota berikutnya */
  const [travelOverlay, setTravelOverlay] = useState<
    null | { fromId: string; toId: string; phase: 'in' | 'out' }
  >(null);
  /** BG kota tujuan — standby di belakang peta saat transisi */
  const [travelCityBg, setTravelCityBg] = useState<string | null>(null);
  const [lastCityId, setLastCityId] = useState('jakarta');
  /** Sesi dimulai saat offline → jangan rekam rekor/badge/streak */
  const [offlineSession, setOfflineSession] = useState(false);
  const online = useOnline();
  const [offlineNavPopup, setOfflineNavPopup] = useState(false);
  /** Internet putus di tengah mode yang butuh koneksi */
  const [offlineMidOpen, setOfflineMidOpen] = useState(false);
  const wasOnlineRef = useRef(true);
  const [homePlayKind, setHomePlayKind] = useState<PlayKind | undefined>(undefined);
  const [homeKey, setHomeKey] = useState(0);
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [journeyEndOpen, setJourneyEndOpen] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [lastMaxCombo, setLastMaxCombo] = useState(0);
  const [forceOps, setForceOps] = useState<
    Array<'add' | 'sub' | 'mul' | 'div'> | undefined
  >(undefined);
  const [selectedCharacterId, setSelectedCharacterId] =
    useState<CharacterId | null>(null);
  const [selectedLevel, setSelectedLevel] =
    useState<DifficultyLevel>('pemula');
  const [lastScore, setLastScore] = useState(0);
  const [lastGrade, setLastGrade] = useState('C');
  const [lastHighScore, setLastHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Tema, bahasa, preferensi dari localStorage saat app dibuka
  const [langTick, setLangTick] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialFromSettings, setTutorialFromSettings] = useState(false);
  useEffect(() => {
    const p = loadProgress();
    document.documentElement.setAttribute(
      'data-theme',
      p.displayMode || 'siang'
    );
    setSelectedMode(p.preferredMode || 'slice');
    setSelectedLevel(p.preferredLevel || 'pemula');
    if (p.preferredCharacter) {
      setSelectedCharacterId(p.preferredCharacter);
    }
    // Bahasa: manual jika sudah dipilih; else auto (luar Indonesia → EN)
    let lang = p.language || 'id';
    if (!p.languageChosen) {
      const detected = detectLangFromDevice();
      lang = detected;
      if (detected !== p.language) {
        updateProgress({ language: detected });
      }
    }
    setLang(lang);
    setLangTick((n) => n + 1);
    // Tutorial first-play (sekali)
    if (!loadProgress().tutorialSeen) {
      setTutorialOpen(true);
      setTutorialFromSettings(false);
    }
  }, []);

  // Musik ikut pause saat minimize / ganti app (home + in-game)
  useEffect(() => {
    installMusicBackgroundGuard();
  }, []);

  // Menu / hasil: BGM default volume rendah. Jangan stop saat pindah tab (home↔dojo↔settings).
  // Hanya stop saat masuk game — Game.tsx yang atur musik kota / BGM main.
  useEffect(() => {
    if (screen === 'game') return;
    playMenuBgm();
  }, [screen]);

  // Ucapan selamat: auto-close singkat (~1,4 dtk); ketuk juga bisa tutup
  useEffect(() => {
    if (!celebrateOpen) return;
    const t = setTimeout(() => setCelebrateOpen(false), 3000);
    return () => clearTimeout(t);
  }, [celebrateOpen]);

    const handleStartGame = (
    mode: InputMode,
    characterId: CharacterId,
    level: DifficultyLevel,
    arena: ArenaStyle = 'static',
    kind: PlayKind = 'latihan',
    diffId: string = 'normal',
    opsForce?: Array<'add' | 'sub' | 'mul' | 'div'>,
    adventureCityIdArg?: string
  ) => {
    setSelectedMode(mode);
    setSelectedArena(arena);
    setSelectedCharacterId(characterId);
    setSelectedLevel(level);
    setPlayKind(kind);
    setAdventureDiffId(diffId || 'normal');
    setForceOps(kind === 'latihan' ? opsForce : undefined);
    // Kota petualangan: pakai yang terlihat di UI (cityId), jangan andalkan storage lama
    const cityForRun =
      kind === 'petualangan'
        ? adventureCityIdArg || loadProgress().adventureCityId || 'jakarta'
        : undefined;
    if (cityForRun) {
      setLastCityId(cityForRun);
      updateProgress({ adventureCityId: cityForRun });
    }
    // Simpan pilihan terakhir → "Kembali ke peta" bisa isi default lagi
    updateProgress({
      preferredMode: mode,
      preferredCharacter: characterId,
      preferredLevel: level,
      preferredArena: arena,
      preferredAdventureDiff: diffId || 'normal',
      ...(cityForRun ? { adventureCityId: cityForRun } : {}),
    });
    setOfflineSession(!getIsOnline());
    setScreen('game');
  };

  const handleExitGame = () => {
    // Keluar di tengah game → selalu ke menu paling awal (langkah 1)
    setHomePlayKind(undefined);
    setHomeKey((k) => k + 1);
    setScreen('home');
  };

  const handleContinueNextCity = () => {
    if (!nextCityId || !selectedCharacterId) return;
    const fromId = lastCityId || loadProgress().adventureCityId || 'jakarta';
    const toId = nextCityId;
    updateProgress({ adventureCityId: toId });
    setLastCityId(toId);
    setPassedCity(false);
    setNextCityId(null);
    setFunFact(null);
    setFunFactOpen(false);
    // Game kota tujuan mount di belakang peta (holdStart) — BG/HUD ready
    setScreen('game');
    setTravelOverlay({ fromId, toId, phase: 'in' });
  };

  const finishTravelToGame = () => {
    // Lepas peta → countdown game mulai (sudah ready di belakang)
    setTravelOverlay(null);
    setScreen('game');
  };

  const handleTravelOverlayDone = () => {
    // Dipanggil setelah pesawat landed + 0.5s — fade peta singkat
    setTravelOverlay((prev) => (prev ? { ...prev, phase: 'out' } : null));
    window.setTimeout(() => {
      finishTravelToGame();
    }, 700);
  };

  const handleBackToAdventureMap = () => {
    // Kota baru terbuka → peta fokus ke situ (region baru otomatis terbuka)
    if (passedCity && nextCityId) {
      updateProgress({ adventureCityId: nextCityId });
    }
    setHomePlayKind('petualangan');
    setHomeKey((k) => k + 1);
    setScreen('home');
  };

  const handleFinishGame = (
    score: number,
    grade: string,
    runMeta?: { maxCombo: number; perfect: boolean }
  ) => {
    const prog0 = loadProgress();
    const maxCombo = runMeta?.maxCombo ?? 0;
    setLastMaxCombo(maxCombo);

    // Offline session: latihan murni, tidak ubah progress / rekor / badge
    if (offlineSession) {
      setLastScore(score);
      setLastGrade(grade);
      setLastHighScore(prog0.highScores?.[selectedLevel] ?? 0);
      setIsNewRecord(false);
      setPassedCity(false);
      setNextCityId(null);
      setFunFact(null);
      setFunFactOpen(false);
      setJourneyEndOpen(false);
      setNewBadges([]);
      setCelebrateOpen(false);
      setScreen('result');
      return;
    }

    const meta = {
      playerName: prog0.playerName,
      inputMode: selectedMode,
      arena: selectedArena,
      tempoId: playKind === 'petualangan' ? adventureDiffId : undefined,
    };
    const { highScore, isNewRecord: neu } = recordGameResult(
      selectedLevel,
      score,
      meta
    );
    setLastScore(score);
    setLastGrade(grade);
    setLastHighScore(highScore);
    setIsNewRecord(neu);
    setPassedCity(false);
    setNextCityId(null);
    setFunFact(null);
    setFunFactOpen(false);
    setJourneyEndOpen(false);
    setNewBadges([]);

    const perfect = !!runMeta?.perfect;
    let passed = false;
    let nextId: string | null = null;
    let cityId = prog0.adventureCityId || 'jakarta';

    if (playKind === 'petualangan') {
      const prog = loadProgress();
      cityId = prog.adventureCityId || 'jakarta';
      setLastCityId(cityId);
      const city = getCityById(cityId);
      recordAdventureScore(cityId, score, meta);
      let unlocked = [...(prog.adventureUnlocked || ['jakarta'])];
      if (!unlocked.includes('jakarta')) unlocked = ['jakarta', ...unlocked];
      if (score >= city.targetScore) {
        passed = true;
        // playdebug / ?debug=1 → jalur penuh; normal → berhenti di Oceania
        let playDbg = false;
        try {
          const q = new URLSearchParams(window.location.search);
          playDbg =
            q.get('playdebug') === '1' ||
            q.get('debug') === '1' ||
            sessionStorage.getItem('kungfu-math-playdebug') === '1';
        } catch {
          playDbg = false;
        }
        nextId = playDbg
          ? getNextCityId(cityId)
          : getNextPlayableCityId(cityId);
        if (nextId && !unlocked.includes(nextId)) {
          unlocked = [...unlocked, nextId];
        }
      }
      // Jika kota berikutnya beda region → simpan fokus ke kota itu (peta buka region baru)
      const progressPatch: {
        adventureUnlocked: string[];
        adventureCityId?: string;
      } = {
        adventureUnlocked: unlocked,
      };
      // Fokus peta ke kota yang baru terbuka (region baru jadi current)
      if (passed && nextId) {
        progressPatch.adventureCityId = nextId;
      }
      updateProgress(progressPatch);
      setPassedCity(passed);
      setNextCityId(nextId);
      if (passed) setCityFailStreak(0);
      else setCityFailStreak((n) => n + 1);
      const fact = passed ? pickCityFunFact(cityId) : null;
      setFunFact(fact);
      // Normal: ujung = Port Moresby. Playdebug: ujung = New York (data penuh).
      const atEnd = passed && !nextId;
      setFunFactOpen(!!fact && !atEnd);
      setJourneyEndOpen(atEnd);
    }

    // Streak + combo + perfect-city + badges
    const progA = loadProgress();
    const streakInfo = nextDailyStreak(progA.lastPlayDate, progA.dailyStreak || 0);
    const maxComboPractice =
      playKind === 'latihan'
        ? Math.max(progA.maxComboPractice || 0, maxCombo)
        : progA.maxComboPractice || 0;
    const maxComboAdventure =
      playKind === 'petualangan'
        ? Math.max(progA.maxComboAdventure || 0, maxCombo)
        : progA.maxComboAdventure || 0;
    let perfectCityStreak = progA.perfectCityStreak || 0;
    if (playKind === 'petualangan' && passed) {
      perfectCityStreak = perfect ? perfectCityStreak + 1 : 0;
    }
    const clearedCityIds = ADVENTURE_CITIES.filter((c) => {
      const hs = (loadProgress().adventureHighScores || {})[c.id] ?? 0;
      return hs >= c.targetScore;
    }).map((c) => c.id);
    const citiesUnlocked = (loadProgress().adventureUnlocked || ['jakarta']).length;
    const newly = evaluateNewBadges({
      already: progA.badges || [],
      totalGames: progA.totalGamesPlayed || 0,
      dailyStreak: streakInfo.streak,
      maxComboPractice,
      maxComboAdventure,
      citiesUnlocked,
      perfectCityStreak,
      runPerfect: perfect,
      justClearedCityId: passed ? cityId : null,
      clearedCityIds,
    });
    const badges = [...(progA.badges || []), ...newly];
    updateProgress({
      dailyStreak: streakInfo.streak,
      lastPlayDate: streakInfo.lastPlayDate,
      maxComboPractice,
      maxComboAdventure,
      perfectCityStreak,
      badges,
    });
    if (newly.length) setNewBadges(newly);

    const willCelebrate =
      neu ||
      passed ||
      grade === 'S' ||
      grade === 'A' ||
      newly.length > 0;
    setCelebrateOpen(willCelebrate);
    setScreen('result');
  };

  const handlePlayAgain = () => {
    if (selectedCharacterId) {
      setScreen('game');
    } else {
      setScreen('home');
    }
  };

  const scrollToTop = () => {
    const top = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document.querySelectorAll('.app-main, .home-page, .dojo-page, .settings-page, .app').forEach((el) => {
        (el as HTMLElement).scrollTop = 0;
      });
    };
    top();
    requestAnimationFrame(top);
  };

  const handleNav = (tab: NavTab) => {
    // Offline: Progres dikunci — sesi offline tidak menyimpan; arahkan pesan sama
    if (!online && tab === 'dojo') {
      setOfflineNavPopup(true);
      return;
    }
    if (tab === 'home') setScreen('home');
    else if (tab === 'dojo') setScreen('dojo');
    else setScreen('settings');
    // Langsung scroll saat klik tab (jangan tunggu effect saja)
    scrollToTop();
  };


  // Internet putus di tengah petualangan / bola gerak → beri tahu, jangan paksa keluar
  useEffect(() => {
    const prev = wasOnlineRef.current;
    wasOnlineRef.current = online;
    if (prev && !online && screen === 'game') {
      const needsNet = playKind === 'petualangan' || selectedArena === 'agility';
      if (needsNet) setOfflineMidOpen(true);
    }
    // Online lagi → tutup soft notice
    if (online) setOfflineMidOpen(false);
  }, [online, screen, playKind, selectedArena]);

  // Setiap ganti layar → mulai dari atas
  useEffect(() => {
    scrollToTop();
    const t1 = window.setTimeout(scrollToTop, 0);
    const t2 = window.setTimeout(scrollToTop, 80);
    const t3 = window.setTimeout(scrollToTop, 200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [screen]);

  const navActive: NavTab =
    screen === 'settings' ? 'settings' : screen === 'dojo' ? 'dojo' : 'home';

  // Sembunyikan menu bawah hanya saat main. Di hasil tetap tampil (fun fact di layer atas).
  const mapDebugMode = (() => {
    try {
      const q = new URLSearchParams(window.location.search);
      return q.get('mapdebug') === '1' || q.get('advdebug') === '1';
    } catch {
      return false;
    }
  })();
  const showChrome = screen !== 'game' && !mapDebugMode;

  // Safety: jika animasi tidak selesai, tetap masuk game
  useEffect(() => {
    if (!travelOverlay || travelOverlay.phase !== 'in') return;
    const safety = window.setTimeout(() => {
      finishTravelToGame();
    }, 15000);
    return () => window.clearTimeout(safety);
  }, [travelOverlay?.fromId, travelOverlay?.toId, travelOverlay?.phase]);

  // Preload + set BG kota tujuan di belakang peta (siap sebelum fade)
  useEffect(() => {
    if (!travelOverlay?.toId) {
      setTravelCityBg(null);
      return;
    }
    let cancelled = false;
    const list = cityBgCandidates(travelOverlay.toId).filter(
      (u) => !u.includes('/dojo.')
    );
    const probe = (url: string) =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
    (async () => {
      for (const url of list) {
        if (cancelled) return;
        if (await probe(url)) {
          if (!cancelled) setTravelCityBg(url);
          return;
        }
      }
      if (!cancelled) {
        for (const fb of ['/cities/bg/default.webp', '/cities/bg/default.jpg']) {
          if (await probe(fb)) {
            if (!cancelled) setTravelCityBg(fb);
            return;
          }
        }
        if (!cancelled) setTravelCityBg(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [travelOverlay?.toId]);

  const showBottomNav = showChrome;
  const _lv = getLevelById(selectedLevel);
  const levelLabel = getLang() === 'en' ? _lv.labelEn : _lv.labelId;

  return (
    <div
      className={`app ${screen === 'game' ? 'is-game' : ''} ${
        showChrome ? 'has-bottom-nav' : ''
      }`}
    >
      <OfflineBanner online={online} />
      <main className="app-main">
        {screen === 'home' && (
          <Home
            key={`${homeKey}-${langTick}`}
            onStartGame={handleStartGame}
            initialPlayKind={homePlayKind}
            offline={!online}
          />
        )}

        {screen === 'dojo' && <Dojo key={langTick} offline={!online} />}

        {screen === 'settings' && (
          <Settings
            onShowTutorial={() => {
              setTutorialFromSettings(true);
              setTutorialOpen(true);
            }}
            key={langTick}
            onBack={() => setScreen('home')}
            onLangChange={() => setLangTick((n) => n + 1)}
            offline={!online}
          />
        )}

        {screen === 'game' && selectedCharacterId && (
          <Game
            key={`game-${lastCityId}-${playKind}`}
            mode={selectedMode}
            characterId={selectedCharacterId}
            level={selectedLevel}
            holdStart={!!travelOverlay}
            agility={selectedArena === 'agility'}
            timeBonusSec={
              playKind === 'petualangan'
                ? getAdventureDifficulty(adventureDiffId).timeBonus
                : 0
            }
            timePenaltySec={
              playKind === 'petualangan'
                ? getAdventureDifficulty(adventureDiffId).timePenalty
                : 0
            }
            cityName={
              playKind === 'petualangan'
                ? (getLang()==='en'
                    ? getCityById(lastCityId || 'jakarta').nameEn
                    : getCityById(lastCityId || 'jakarta').nameId)
                : undefined
            }
            cityId={
              playKind === 'petualangan'
                ? lastCityId || 'jakarta'
                : undefined
            }
            targetScore={
              playKind === 'petualangan'
                ? getCityById(lastCityId || 'jakarta').targetScore
                : undefined
            }
            onExit={handleExitGame}
            forceOps={forceOps}
            tempoId={
              playKind === 'petualangan' ? adventureDiffId : undefined
            }
            onFinish={handleFinishGame}
          />
        )}

        {screen === 'result' && !travelOverlay && (() => {
          const city =
            playKind === 'petualangan' ? getCityById(lastCityId) : null;
          const nextCity = nextCityId ? getCityById(nextCityId) : null;
          const journeyComplete =
            playKind === 'petualangan' && passedCity && !nextCity;
          const headline = resultHeadline(lastGrade, isNewRecord, lastScore, {
            passedCity: playKind === 'petualangan' && passedCity && !journeyComplete,
            cityName: getLang()==='en' ? city?.nameEn : city?.nameId,
            journeyComplete,
          });
          const celebrate =
            isNewRecord ||
            passedCity ||
            lastGrade === 'S' ||
            lastGrade === 'A' ||
            journeyComplete;
          return (
            <div className={`result-screen tone-${headline.tone}`}>
              {/* Ucapan selamat: layer atas, auto-close singkat */}
              {celebrate && celebrateOpen && (
                <button
                  type="button"
                  className="result-celebrate-overlay"
                  onClick={() => setCelebrateOpen(false)}
                  aria-label="Tutup ucapan"
                >
                  <div className="result-celebrate-box">
                    <div className="result-confetti" aria-hidden>
                      <span>🎉</span>
                      <span>✨</span>
                      <span>🎊</span>
                      <span>⭐</span>
                      <span>🏆</span>
                      <span>💫</span>
                    </div>
                    <p className="result-float-title">{headline.title}</p>
                    <p className="result-float-sub">{headline.sub}</p>
                  </div>
                </button>
              )}

              {/* Ujung jalur petualangan: popup khusus, tutup manual */}
              {journeyComplete && journeyEndOpen && (
                <div
                  className="result-funfact-overlay result-journey-end-overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="journey-end-title"
                >
                  <div className="result-funfact-modal result-journey-end-modal">
                    <p className="result-journey-emoji" aria-hidden>
                      🏆
                    </p>
                    <p id="journey-end-title" className="result-funfact-label">
                      {t('journeyEndTitle')}
                    </p>
                    <p className="result-funfact-text">{t('journeyEndBody')}</p>
                    <p className="result-journey-hint">{t('journeyEndHint')}</p>
                    <button
                      type="button"
                      className="btn-primary result-funfact-close"
                      onClick={() => setJourneyEndOpen(false)}
                    >
                      {t('btnGotIt')}
                    </button>
                  </div>
                </div>
              )}

              {/* Fun fact: layer bawah, HARUS ditutup manual agar anak sempat baca */}
              {funFact && passedCity && funFactOpen && !journeyComplete && (
                <div
                  className="result-funfact-overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="funfact-title"
                >
                  <div className="result-funfact-modal">
                    <p id="funfact-title" className="result-funfact-label">
                      {t('knowTitle')}
                    </p>
                    <p className="result-funfact-text">{funFact}</p>
                    <button
                      type="button"
                      className="btn-primary result-funfact-close"
                      onClick={() => setFunFactOpen(false)}
                    >
                      {t('btnGotIt')}
                    </button>
                  </div>
                </div>
              )}

              <div className="result-summary">
                <p className="result-level">
                  {playKind === 'petualangan' && city
                    ? `${t('playPetualangan')} · ${getLang()==='en' ? city.nameEn : city.nameId}`
                    : `${t('levelTitle')}: ${levelLabel}`}
                </p>
                {offlineSession && (
                  <p className="offline-result-hint" role="status">
                    {t('offlineResultHint')}
                  </p>
                )}
                <p className="result-score-line">
                  <strong>{t('score')} {lastScore}</strong>
                  <span> · {lastGrade}</span>
                </p>
                <p className="result-combo-note">
                  {t('runMaxCombo')}: ×{lastMaxCombo}
                </p>
                {playKind === 'petualangan' && city && (
                  <p className="result-high">
                    {passedCity
                      ? getLang() === 'en'
                        ? `Target ${city.targetScore} points in ${city.nameEn} reached${
                            nextCity ? '. You can continue to the next city.' : '.'
                          }`
                        : `Target ${city.targetScore} poin ${city.nameId} tercapai${
                            nextCity ? ', kamu bisa lanjut ke kota berikut.' : '.'
                          }`
                      : getLang() === 'en'
                        ? `Target ${city.targetScore} · not reached yet. Try again!`
                        : `Target ${city.targetScore} poin · belum tercapai. Coba lagi ya!`}
                    {isNewRecord
                      ? getLang() === 'en'
                        ? ' New record!'
                        : ' Rekor baru!'
                      : ''}
                  </p>
                )}

                {playKind === 'petualangan' &&
                  city &&
                  !passedCity &&
                  cityFailStreak >= 2 && (
                  <p className="result-fail-hint" role="status">
                    {t('failHintHarder')}
                  </p>
                )}

                {playKind !== 'petualangan' && !offlineSession && (
                  <p className="result-high">
                    {t('highScore')}: {lastHighScore}
                    {isNewRecord
                      ? getLang() === 'en'
                        ? ' · new!'
                        : ' · baru!'
                      : ''}
                  </p>
                )}
                {newBadges.length > 0 && (
                  <div className="result-funfact result-badges-new">
                    <p className="result-funfact-label">{t('newBadgesTitle')}</p>
                    <ul className="badge-new-list">
                      {newBadges.map((id) => {
                        const b = getBadgeDef(id);
                        if (!b) return null;
                        const title = getLang() === 'en' ? b.titleEn : b.titleId;
                        return (
                          <li key={id}>
                            {b.emoji} {title}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {passedCity &&
                  lastCityId === MVP_REGION_LAST_CITY_ID &&
                  nextCity && (
                  <div className="result-funfact result-region-unlock">
                    <p className="result-funfact-text">{MVP_REGION_UNLOCK_MSG}</p>
                  </div>
                )}
              </div>

              <div className="result-actions">
                {playKind === 'petualangan' && passedCity && nextCity && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleContinueNextCity}
                  >
                    {t('continueCity')} {getLang() === 'en' ? nextCity.nameEn : nextCity.nameId}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handlePlayAgain}
                >
                  {playKind === 'petualangan' && city
                    ? (getLang()==='en' ? `${t('playAgain')} in ${city.nameEn}` : `${t('playAgain')} di ${city.nameId}`)
                    : t('playAgain')}
                </button>
                {playKind === 'petualangan' ? (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleBackToAdventureMap}
                  >
                    {passedCity && nextCity
                      ? t('chooseOtherCity')
                      : t('backToMap')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleExitGame}
                  >
                    {t('backToPractice')}
                  </button>
                )}
                {!offlineSession && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setScreen('dojo')}
                  >
                    {t('seeProgress')}
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </main>

      {tutorialOpen && (
        <Tutorial
          fromSettings={tutorialFromSettings}
          onClose={() => {
            setTutorialOpen(false);
            if (!tutorialFromSettings) {
              updateProgress({ tutorialSeen: true });
            }
          }}
        />
      )}

      {showChrome && <Footer />}

      {travelOverlay && (
        <div
          className={`travel-overlay travel-overlay-${travelOverlay.phase}`}
          role="dialog"
          aria-modal="true"
          aria-label={t('continueCity')}
        >
          <div className="travel-overlay-inner">
            <AdventureMap
              fillViewport
              unlockedIds={
                loadProgress().adventureUnlocked?.length
                  ? loadProgress().adventureUnlocked
                  : ['jakarta']
              }
              wonIds={ADVENTURE_CITIES.filter((c) => {
                const hs = loadProgress().adventureHighScores?.[c.id] ?? 0;
                return hs >= c.targetScore;
              }).map((c) => c.id)}
              activeId={travelOverlay.toId}
              travelFromId={travelOverlay.fromId}
              travelToId={travelOverlay.toId}
              onTravelDone={handleTravelOverlayDone}
            />
          </div>
        </div>
      )}

      {showBottomNav && (
        <BottomNav key={langTick} active={navActive} onChange={handleNav} offline={!online} />
      )}

      {offlineMidOpen && screen === 'game' && (
        <div
          className="offline-need-net-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setOfflineMidOpen(false)}
        >
          <div className="offline-need-net-box" onClick={(e) => e.stopPropagation()}>
            <p className="offline-need-net-title">{t('offlineMidTitle')}</p>
            <p className="offline-need-net-body">
              {playKind === 'petualangan'
                ? t('offlineMidBodyAdventure')
                : t('offlineMidBody')}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setOfflineMidOpen(false)}
            >
              {t('offlineMidOk')}
            </button>
          </div>
        </div>
      )}

      {offlineNavPopup && (
        <div
          className="offline-need-net-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setOfflineNavPopup(false)}
        >
          <div className="offline-need-net-box" onClick={(e) => e.stopPropagation()}>
            <p className="offline-need-net-title">{t('offlineTitle')}</p>
            <p className="offline-need-net-body">{t('offlinePopup')}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setOfflineNavPopup(false)}
            >
              {t('offlinePopupOk')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
