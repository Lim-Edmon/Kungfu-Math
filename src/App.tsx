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
import Home from './pages/Home';
import Game from './pages/Game';
import Settings from './pages/Settings';
import Dojo from './pages/Dojo';
import Footer from './components/Footer';
import BottomNav, { type NavTab } from './components/BottomNav';
import type { ArenaStyle, CharacterId, InputMode } from './lib/types';
import type { DifficultyLevel } from './lib/levels';
import { getLevelById } from './lib/levels';
import { loadProgress, recordGameResult } from './lib/storage';
import './styles/theme.css';
import './App.css';

type Screen = 'home' | 'game' | 'result' | 'settings' | 'dojo';

function resultHeadline(
  grade: string,
  isNewRecord: boolean,
  score: number
): { title: string; sub: string; tone: string } {
  if (isNewRecord) {
    return {
      title: 'NEW RECORD!',
      sub: 'Rekor baru — hebat sekali!',
      tone: 'record',
    };
  }
  if (grade === 'S') {
    return {
      title: 'CONGRATULATIONS!',
      sub: 'Master hitung! Kamu luar biasa!',
      tone: 'great',
    };
  }
  if (grade === 'A') {
    return {
      title: 'WELL DONE!',
      sub: 'Kerja bagus, pendekar!',
      tone: 'great',
    };
  }
  if (grade === 'B') {
    return {
      title: 'DOING WELL!',
      sub: 'Bagus belajar, terus latihan!',
      tone: 'good',
    };
  }
  if (score <= 0) {
    return {
      title: 'TIME UP!',
      sub: 'Coba lagi — kamu pasti bisa!',
      tone: 'try',
    };
  }
  return {
    title: 'NICE TRY!',
    sub: 'Latihan lagi biar makin jago!',
    tone: 'try',
  };
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedMode, setSelectedMode] = useState<InputMode>('slice');
  const [selectedArena, setSelectedArena] = useState<ArenaStyle>('static');
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

  const handleStartGame = (
    mode: InputMode,
    characterId: CharacterId,
    level: DifficultyLevel,
    arena: ArenaStyle = 'static'
  ) => {
    setSelectedMode(mode);
    setSelectedArena(arena);
    setSelectedCharacterId(characterId);
    setSelectedLevel(level);
    setScreen('game');
  };

  const handleExitGame = () => {
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
    setScreen('result');
  };

  const handlePlayAgain = () => {
    if (selectedCharacterId) {
      setScreen('game');
    } else {
      setScreen('home');
    }
  };

  const handleNav = (tab: NavTab) => {
    if (tab === 'home') setScreen('home');
    else if (tab === 'dojo') setScreen('dojo');
    else setScreen('settings');
  };

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
        {screen === 'home' && <Home onStartGame={handleStartGame} />}

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
            onExit={handleExitGame}
            onFinish={handleFinishGame}
          />
        )}

        {screen === 'result' && (() => {
          const headline = resultHeadline(
            lastGrade,
            isNewRecord,
            lastScore
          );
          return (
            <div className={`result-screen tone-${headline.tone}`}>
              <div className="result-burst" aria-hidden>
                {isNewRecord || lastGrade === 'S' || lastGrade === 'A'
                  ? '🎉✨🏆'
                  : lastGrade === 'B'
                    ? '⭐👏'
                    : '💪🌟'}
              </div>
              <p className="result-float-title">{headline.title}</p>
              <p className="result-float-sub">{headline.sub}</p>
              <p className="result-level">Level: {levelLabel}</p>
              <p className="result-grade">Grade: {lastGrade}</p>
              <p className="result-score">Skor: {lastScore}</p>
              <p className="result-high">
                Rekor level ini: {lastHighScore}
                {isNewRecord ? ' 🎉' : ''}
              </p>
              <div className="result-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handlePlayAgain}
                >
                  Main Lagi
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleExitGame}
                >
                  Kembali ke Latihan
                </button>
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
