/**
 * Kungfu Math — Root component (Home / Game / Settings / Result / Dojo).
 * ---------------------------------------------------------------------
 * Author       : Lim Edmon
 * Built with   : AI coding partners (including Grok / xAI and others),
 *                as development assistants — final product owned by author
 * Created      : September 2026
 * Project type : Personal educational game (consumer / community)
 *
 * Disclaimer:
 * This code is provided as-is for the Kungfu Math learning game. It has
 * not been audited for production-grade security or reliability, and it
 * is NOT intended for handling payments, sensitive personal data, or any
 * safety-critical use. Feel free to use, modify, and learn from it for
 * this project — please keep this author credit if you copy or
 * redistribute any part of it elsewhere.
 * ---------------------------------------------------------------------
 */

import { useState, useEffect } from 'react';
import Home, { type PlayKind } from './pages/Home';
import Game from './pages/Game';
import Settings from './pages/Settings';
import Dojo from './pages/Dojo';
import Footer from './components/Footer';
import BottomNav, { type NavTab } from './components/BottomNav';
import type { ArenaStyle, CharacterId, InputMode } from './lib/types';
import type { DifficultyLevel } from './lib/levels';
import { getLevelById } from './lib/levels';
import { loadProgress, recordGameResult, updateProgress } from './lib/storage';
import {
  getCityById,
  getNextCityId,
  getAdventureDifficulty,
  pickCityFunFact,
  MVP_REGION_LAST_CITY_ID,
  MVP_REGION_UNLOCK_MSG,
} from './lib/adventure';
import './styles/theme.css';
import './App.css';

type Screen = 'home' | 'game' | 'result' | 'settings' | 'dojo';

function resultHeadline(
  grade: string,
  isNewRecord: boolean,
  score: number,
  opts?: { passedCity?: boolean; cityName?: string }
): { title: string; sub: string; tone: string } {
  if (isNewRecord) {
    return {
      title: 'Rekor baru!',
      sub: 'Kamu pecahkan rekor sendiri. Hebat!',
      tone: 'record',
    };
  }
  if (opts?.passedCity) {
    return {
      title: 'Kota berhasil!',
      sub: opts.cityName
        ? `Target ${opts.cityName} tercapai. Kamu bisa lanjut ke kota berikut!`
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
      title: 'Waktu habis!',
      sub: 'Tidak apa-apa. Yuk coba lagi!',
      tone: 'try',
    };
  }
  return {
    title: 'Sudah berusaha!',
    sub: 'Tetap semangat. Latihan lagi, pasti naik!',
    tone: 'try',
  };
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedMode, setSelectedMode] = useState<InputMode>('slice');
  const [selectedArena, setSelectedArena] = useState<ArenaStyle>('static');
  const [playKind, setPlayKind] = useState<PlayKind>('latihan');
  const [adventureDiffId, setAdventureDiffId] = useState('normal');
  const [passedCity, setPassedCity] = useState(false);
  const [funFact, setFunFact] = useState<string | null>(null);
  const [nextCityId, setNextCityId] = useState<string | null>(null);
  const [lastCityId, setLastCityId] = useState('jakarta');
  const [homePlayKind, setHomePlayKind] = useState<PlayKind | undefined>(undefined);
  const [homeKey, setHomeKey] = useState(0);
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] =
    useState<CharacterId | null>(null);
  const [selectedLevel, setSelectedLevel] =
    useState<DifficultyLevel>('pemula');
  const [lastScore, setLastScore] = useState(0);
  const [lastGrade, setLastGrade] = useState('C');
  const [lastHighScore, setLastHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Tema & preferensi dari localStorage saat app dibuka (bukan hanya di Home)
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
  }, []);

  useEffect(() => {
    if (!celebrateOpen) return;
    const t = setTimeout(() => setCelebrateOpen(false), 1800);
    return () => clearTimeout(t);
  }, [celebrateOpen]);

    const handleStartGame = (
    mode: InputMode,
    characterId: CharacterId,
    level: DifficultyLevel,
    arena: ArenaStyle = 'static',
    kind: PlayKind = 'latihan',
    diffId: string = 'normal'
  ) => {
    setSelectedMode(mode);
    setSelectedArena(arena);
    setSelectedCharacterId(characterId);
    setSelectedLevel(level);
    setPlayKind(kind);
    setAdventureDiffId(diffId || 'normal');
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
    updateProgress({ adventureCityId: nextCityId });
    setPassedCity(false);
    setScreen('game');
  };

  const handleBackToAdventureMap = () => {
    setHomePlayKind('petualangan');
    setScreen('home');
  };

  const handleFinishGame = (score: number, grade: string) => {
    const { highScore, isNewRecord: neu } = recordGameResult(
      selectedLevel,
      score
    );
    setLastScore(score);
    setLastGrade(grade);
    setLastHighScore(highScore);
    setIsNewRecord(neu);
    setPassedCity(false);
    setNextCityId(null);
    setFunFact(null);

    if (playKind === 'petualangan') {
      const prog = loadProgress();
      const cityId = prog.adventureCityId || 'jakarta';
      setLastCityId(cityId);
      const city = getCityById(cityId);
      const prevHs = prog.adventureHighScores?.[cityId] ?? 0;
      const best = Math.max(prevHs, score);
      const ahs = { ...(prog.adventureHighScores || {}), [cityId]: best };
      let unlocked = [...(prog.adventureUnlocked || ['jakarta'])];
      if (!unlocked.includes('jakarta')) unlocked = ['jakarta', ...unlocked];
      let nextId: string | null = null;
      let passed = false;
      if (score >= city.targetScore) {
        passed = true;
        nextId = getNextCityId(cityId);
        if (nextId && !unlocked.includes(nextId)) {
          unlocked = [...unlocked, nextId];
        }
      }
      updateProgress({
        adventureHighScores: ahs,
        adventureUnlocked: unlocked,
      });
      setPassedCity(passed);
      setNextCityId(nextId);
      setFunFact(passed ? pickCityFunFact(cityId) : null);
    }

    const willCelebrate =
      neu ||
      (playKind === 'petualangan' &&
        score >= getCityById(loadProgress().adventureCityId || 'jakarta').targetScore) ||
      grade === 'S' ||
      grade === 'A';
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
    if (tab === 'home') setScreen('home');
    else if (tab === 'dojo') setScreen('dojo');
    else setScreen('settings');
    // Langsung scroll saat klik tab (jangan tunggu effect saja)
    scrollToTop();
  };

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

  const showChrome = screen !== 'game';
  const levelLabel = getLevelById(selectedLevel).labelId;

  return (
    <div
      className={`app ${screen === 'game' ? 'is-game' : ''} ${
        showChrome ? 'has-bottom-nav' : ''
      }`}
    >
      <main className="app-main">
        {screen === 'home' && (
          <Home
            key={homeKey}
            onStartGame={handleStartGame}
            initialPlayKind={homePlayKind}
          />
        )}

        {screen === 'dojo' && <Dojo />}

        {screen === 'settings' && (
          <Settings onBack={() => setScreen('home')} />
        )}

        {screen === 'game' && selectedCharacterId && (
          <Game
            mode={selectedMode}
            characterId={selectedCharacterId}
            level={selectedLevel}
            agility={selectedArena === 'agility'}
            timeBonusSec={
              playKind === 'petualangan'
                ? getAdventureDifficulty(adventureDiffId).timeBonus
                : 0
            }
            cityName={
              playKind === 'petualangan'
                ? getCityById(loadProgress().adventureCityId || 'jakarta').nameId
                : undefined
            }
            cityId={
              playKind === 'petualangan'
                ? loadProgress().adventureCityId || 'jakarta'
                : undefined
            }
            targetScore={
              playKind === 'petualangan'
                ? getCityById(loadProgress().adventureCityId || 'jakarta')
                    .targetScore
                : undefined
            }
            onExit={handleExitGame}
            onFinish={handleFinishGame}
          />
        )}

        {screen === 'result' && (() => {
          const city =
            playKind === 'petualangan' ? getCityById(lastCityId) : null;
          const nextCity = nextCityId ? getCityById(nextCityId) : null;
          const headline = resultHeadline(lastGrade, isNewRecord, lastScore, {
            passedCity: playKind === 'petualangan' && passedCity,
            cityName: city?.nameId,
          });
          const celebrate =
            isNewRecord ||
            passedCity ||
            lastGrade === 'S' ||
            lastGrade === 'A';
          return (
            <div className={`result-screen tone-${headline.tone}`}>
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
                    <p className="result-celebrate-hint">Ketuk untuk lanjut</p>
                  </div>
                </button>
              )}

              <div className="result-summary">
                <p className="result-level">
                  {playKind === 'petualangan' && city
                    ? `Petualangan · ${city.nameId}`
                    : `Level: ${levelLabel}`}
                </p>
                <p className="result-score-line">
                  <strong>Skor {lastScore}</strong>
                  <span> · Nilai {lastGrade}</span>
                </p>
                {playKind === 'petualangan' && city && (
                  <p className="result-high">
                    {passedCity
                      ? `Target ${city.targetScore} poin ${city.nameId} tercapai${
                          nextCity
                            ? ', kamu bisa lanjut ke kota berikut.'
                            : '.'
                        }`
                      : `Target ${city.targetScore} poin · belum tercapai. Coba lagi ya!`}
                    {isNewRecord ? ' Rekor baru!' : ''}
                  </p>
                )}
                {playKind !== 'petualangan' && (
                  <p className="result-high">
                    Rekor: {lastHighScore}
                    {isNewRecord ? ' · baru!' : ''}
                  </p>
                )}
                {funFact && passedCity && (
                  <div className="result-funfact">
                    <p className="result-funfact-label">Tahukah kamu?</p>
                    <p className="result-funfact-text">{funFact}</p>
                  </div>
                )}
                {passedCity &&
                  lastCityId === MVP_REGION_LAST_CITY_ID &&
                  !nextCity && (
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
                    Lanjut ke {nextCity.nameId}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handlePlayAgain}
                >
                  {playKind === 'petualangan' && city
                    ? `Main lagi di ${city.nameId}`
                    : 'Main lagi'}
                </button>
                {playKind === 'petualangan' ? (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleBackToAdventureMap}
                  >
                    Kembali ke peta
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleExitGame}
                  >
                    Kembali ke Latihan
                  </button>
                )}
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setScreen('dojo')}
                >
                  Lihat Dojo
                </button>
              </div>
            </div>
          );
        })()}
      </main>

      {showChrome && (
        <>
          <Footer />
          <BottomNav active={navActive} onChange={handleNav} />
        </>
      )}
    </div>
  );
}

export default App;
