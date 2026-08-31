import { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState } from './types/game';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { EvolutionModal } from './components/EvolutionModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [isEvolutionOpen, setIsEvolutionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Game Engine
    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;

    engine.onStateChange = (state: GameState) => {
      setGameState(state);
      if (state === 'EVOLUTION') {
        setIsEvolutionOpen(true);
      }
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.startNewGame();
    }
  };

  const handleContinueNextWave = () => {
    setIsEvolutionOpen(false);
    if (engineRef.current) {
      engineRef.current.continueToNextWave();
    }
  };

  const handleTogglePause = () => {
    if (!engineRef.current) return;
    if (gameState === 'PLAYING') {
      engineRef.current.setGameState('PAUSED');
      setIsSettingsOpen(true);
    } else if (gameState === 'PAUSED') {
      engineRef.current.setGameState('PLAYING');
      setIsSettingsOpen(false);
    }
  };

  const handleResume = () => {
    setIsSettingsOpen(false);
    if (engineRef.current) {
      engineRef.current.setGameState('PLAYING');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />

      {/* Main Menu Screen */}
      {gameState === 'MENU' && (
        <MainMenu onStart={handleStartGame} />
      )}

      {/* In-Game HUD Overlay */}
      {engineRef.current && (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'WAVE_CLEAR') && (
        <HUD
          engine={engineRef.current}
          onOpenEvolution={() => setIsEvolutionOpen(true)}
          onOpenSettings={() => {
            setIsSettingsOpen(true);
            if (engineRef.current && gameState === 'PLAYING') {
              engineRef.current.setGameState('PAUSED');
            }
          }}
          onTogglePause={handleTogglePause}
        />
      )}

      {/* Evolution / DNA Upgrades Chamber */}
      {isEvolutionOpen && engineRef.current && (
        <EvolutionModal
          engine={engineRef.current}
          onContinue={handleContinueNextWave}
        />
      )}

      {/* Pause & Settings Modal */}
      {isSettingsOpen && engineRef.current && (
        <SettingsModal
          engine={engineRef.current}
          onResume={handleResume}
          onRestart={handleStartGame}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && engineRef.current && (
        <GameOverModal
          engine={engineRef.current}
          onRestart={handleStartGame}
        />
      )}

      {/* Victory Screen */}
      {gameState === 'VICTORY' && engineRef.current && (
        <VictoryModal
          engine={engineRef.current}
          onContinueEndless={() => {
            if (engineRef.current) {
              engineRef.current.continueToNextWave();
            }
          }}
          onRestart={handleStartGame}
        />
      )}
    </div>
  );
}
