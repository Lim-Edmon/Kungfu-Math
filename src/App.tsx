import { useState } from 'react';
import Home from './pages/Home';
import Game from './pages/Game';
import Settings from './pages/Settings';
import Footer from './components/Footer';
import type { CharacterId, InputMode } from './lib/types';
import type { DifficultyLevel } from './lib/levels';
import { getLevelById } from './lib/levels';
import { recordGameResult } from './lib/storage';
import './styles/theme.css';
import './App.css';

type Screen = 'home' | 'game' | 'result' | 'settings';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedMode, setSelectedMode] = useState<InputMode>('slice');
  const [selectedCharacterId, setSelectedCharacterId] =
    useState<CharacterId | null>(null);
  const [selectedLevel, setSelectedLevel] =
    useState<DifficultyLevel>('pemula');
  const [lastScore, setLastScore] = useState(0);
  const [lastGrade, setLastGrade] = useState('C');
  const [lastHighScore, setLastHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const handleStartGame = (
    mode: InputMode,
    characterId: CharacterId,
    level: DifficultyLevel
  ) => {
    setSelectedMode(mode);
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

  const levelLabel = getLevelById(selectedLevel).labelId;

  return (
    <div className={`app ${screen === 'game' ? 'is-game' : ''}`}>
      <main className="app-main">
        {screen === 'home' && (
          <Home
            onStartGame={handleStartGame}
            onOpenSettings={() => setScreen('settings')}
          />
        )}

        {screen === 'settings' && (
          <Settings onBack={() => setScreen('home')} />
        )}

        {screen === 'game' && selectedCharacterId && (
          <Game
            mode={selectedMode}
            characterId={selectedCharacterId}
            level={selectedLevel}
            onExit={handleExitGame}
            onFinish={handleFinishGame}
          />
        )}

        {screen === 'result' && (
          <div className="result-screen">
            <h2>Selesai!</h2>
            <p className="result-level">Level: {levelLabel}</p>
            <p className="result-grade">Grade: {lastGrade}</p>
            <p className="result-score">Skor: {lastScore}</p>
            <p className="result-high">
              Rekor level ini: {lastHighScore}
              {isNewRecord ? ' 🎉 Rekor baru!' : ''}
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
                Kembali ke Home
              </button>
            </div>
          </div>
        )}
      </main>

      {screen !== 'game' && <Footer />}
    </div>
  );
}

export default App;
