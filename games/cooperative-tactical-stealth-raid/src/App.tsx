import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameMode, MissionConfig, MissionResult, OperativeClass } from './types/game';
import { MISSIONS } from './game/levels';
import { GameInputs, TacticalEngine } from './game/engine';
import { TacticalCanvas } from './components/TacticalCanvas';
import { TacticalHUD } from './components/TacticalHUD';
import { TouchControls } from './components/TouchControls';
import { StartScreen } from './components/StartScreen';
import { DebriefModal } from './components/DebriefModal';
import { HighScoresModal } from './components/HighScoresModal';
import { PauseModal } from './components/PauseModal';
import { HandbookModal } from './components/HandbookModal';
import { audioManager } from './services/audio';
import { getUnlockedMissions, saveHighScore, unlockMission } from './services/storage';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'DEBRIEF'>('START');
  const [engine, setEngine] = useState<TacticalEngine | null>(null);
  const [missionResult, setMissionResult] = useState<MissionResult | null>(null);
  const [unlockedMissions, setUnlockedMissions] = useState<string[]>(() => getUnlockedMissions());

  // Current session parameters
  const [currentMission, setCurrentMission] = useState<MissionConfig>(MISSIONS[0]);
  const [currentGameMode, setCurrentGameMode] = useState<GameMode>('SOLO_AI');
  const [currentP1Class, setCurrentP1Class] = useState<OperativeClass>('ghost');
  const [currentP2Class, setCurrentP2Class] = useState<OperativeClass>('viper');

  // Modals
  const [showHighScores, setShowHighScores] = useState(false);
  const [showHandbook, setShowHandbook] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Viewport dimensions
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isMobile, setIsMobile] = useState(false);

  // High performance input buffer
  const inputsRef = useRef<GameInputs>({
    p1: {
      up: false,
      down: false,
      left: false,
      right: false,
      aimX: 0,
      aimY: 0,
      shoot: false,
      interact: false,
      gadget: false,
      reload: false,
      crouch: false,
    },
    p2: {
      up: false,
      down: false,
      left: false,
      right: false,
      aimX: 0,
      aimY: 0,
      shoot: false,
      interact: false,
      gadget: false,
      reload: false,
      crouch: false,
    },
  });

  // Check mobile device & window resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setIsMobile(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 1024
      );
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Pause with Escape
      if (e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
          if (engine) engine.isPaused = true;
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
          if (engine) engine.isPaused = false;
        }
        return;
      }

      // Quick restart with R during debrief or playing
      if (e.code === 'KeyR' && (gameState === 'DEBRIEF' || (gameState === 'PLAYING' && e.ctrlKey))) {
        e.preventDefault();
        restartCurrentMission();
        return;
      }

      const inp = inputsRef.current;

      // --- Player 1 Keys ---
      if (e.code === 'KeyW') inp.p1.up = true;
      if (e.code === 'KeyS') inp.p1.down = true;
      if (e.code === 'KeyA') inp.p1.left = true;
      if (e.code === 'KeyD') inp.p1.right = true;
      if (e.code === 'Space') {
        inp.p1.shoot = true;
        e.preventDefault();
      }
      if (e.code === 'KeyF') {
        inp.p1.interact = true;
        // Trigger terminal interact directly
        if (engine && gameState === 'PLAYING') {
          const p1 = engine.p1;
          const term = engine.terminals.find(
            t => !t.isCompleted && Math.hypot(t.x - p1.x, t.y - p1.y) < t.radius + 25
          );
          if (term) engine.interactTerminal(p1, term);
        }
      }
      if (e.code === 'KeyQ') inp.p1.gadget = true;
      if (e.code === 'KeyR' && !e.ctrlKey) inp.p1.reload = true;
      if (e.code === 'ShiftLeft') inp.p1.crouch = true;

      // --- Player 2 Keys (Local Co-op) ---
      if (e.code === 'ArrowUp') { inp.p2.up = true; e.preventDefault(); }
      if (e.code === 'ArrowDown') { inp.p2.down = true; e.preventDefault(); }
      if (e.code === 'ArrowLeft') { inp.p2.left = true; e.preventDefault(); }
      if (e.code === 'ArrowRight') { inp.p2.right = true; e.preventDefault(); }
      if (e.code === 'ShiftRight' || e.code === 'KeyK') inp.p2.shoot = true;
      if (e.code === 'Enter' || e.code === 'KeyL') {
        inp.p2.interact = true;
        if (engine && gameState === 'PLAYING') {
          const p2 = engine.p2;
          const term = engine.terminals.find(
            t => !t.isCompleted && Math.hypot(t.x - p2.x, t.y - p2.y) < t.radius + 25
          );
          if (term) engine.interactTerminal(p2, term);
        }
      }
      if (e.code === 'KeyP') inp.p2.gadget = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const inp = inputsRef.current;

      // P1
      if (e.code === 'KeyW') inp.p1.up = false;
      if (e.code === 'KeyS') inp.p1.down = false;
      if (e.code === 'KeyA') inp.p1.left = false;
      if (e.code === 'KeyD') inp.p1.right = false;
      if (e.code === 'Space') inp.p1.shoot = false;
      if (e.code === 'KeyF') inp.p1.interact = false;
      if (e.code === 'KeyQ') inp.p1.gadget = false;
      if (e.code === 'KeyR') inp.p1.reload = false;
      if (e.code === 'ShiftLeft') inp.p1.crouch = false;

      // P2
      if (e.code === 'ArrowUp') inp.p2.up = false;
      if (e.code === 'ArrowDown') inp.p2.down = false;
      if (e.code === 'ArrowLeft') inp.p2.left = false;
      if (e.code === 'ArrowRight') inp.p2.right = false;
      if (e.code === 'ShiftRight' || e.code === 'KeyK') inp.p2.shoot = false;
      if (e.code === 'Enter' || e.code === 'KeyL') inp.p2.interact = false;
      if (e.code === 'KeyP') inp.p2.gadget = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (engine && gameState === 'PLAYING') {
        const cw = window.innerWidth;
        const ch = window.innerHeight;
        // World aim coordinates
        const mouseWorldX = engine.p1.x + (e.clientX - cw / 2);
        const mouseWorldY = engine.p1.y + (e.clientY - ch / 2);
        inputsRef.current.p1.aimX = mouseWorldX;
        inputsRef.current.p1.aimY = mouseWorldY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && gameState === 'PLAYING') {
        inputsRef.current.p1.shoot = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        inputsRef.current.p1.shoot = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState, engine]);

  // Main 60 FPS Game Loop Driver
  useEffect(() => {
    if (gameState !== 'PLAYING' || !engine) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      engine.update(dt, inputsRef.current);

      // Check Victory or Defeat
      if (engine.isVictory || engine.isGameOver) {
        const result = engine.calculateMissionResult();
        setMissionResult(result);
        saveHighScore(result);

        if (result.success) {
          // Unlock next mission if available
          const currIdx = MISSIONS.findIndex(m => m.id === result.missionId);
          if (currIdx >= 0 && currIdx + 1 < MISSIONS.length) {
            const nextId = MISSIONS[currIdx + 1].id;
            unlockMission(nextId);
            setUnlockedMissions(getUnlockedMissions());
          }
        }

        setGameState('DEBRIEF');
        return;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, engine]);

  // Start Mission
  const startMission = useCallback((
    mission: MissionConfig,
    mode: GameMode,
    p1Class: OperativeClass,
    p2Class: OperativeClass
  ) => {
    setCurrentMission(mission);
    setCurrentGameMode(mode);
    setCurrentP1Class(p1Class);
    setCurrentP2Class(p2Class);

    const newEngine = new TacticalEngine(mission, mode, p1Class, p2Class);
    setEngine(newEngine);
    setGameState('PLAYING');
    setMissionResult(null);
  }, []);

  // Instant Restart
  const restartCurrentMission = useCallback(() => {
    if (engine) {
      engine.isGameOver = true; // Cleanup
    }
    const newEngine = new TacticalEngine(currentMission, currentGameMode, currentP1Class, currentP2Class);
    setEngine(newEngine);
    setGameState('PLAYING');
    setMissionResult(null);
  }, [currentMission, currentGameMode, currentP1Class, currentP2Class, engine]);

  // Next Mission
  const handleNextMission = useCallback(() => {
    const currIdx = MISSIONS.findIndex(m => m.id === currentMission.id);
    if (currIdx >= 0 && currIdx + 1 < MISSIONS.length) {
      const nextMission = MISSIONS[currIdx + 1];
      startMission(nextMission, currentGameMode, currentP1Class, currentP2Class);
    }
  }, [currentMission, currentGameMode, currentP1Class, currentP2Class, startMission]);

  // Return to Base
  const handleMainMenu = useCallback(() => {
    audioManager.stopBackgroundTrack();
    setGameState('START');
    setEngine(null);
  }, []);

  // Sound Toggle
  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    audioManager.setMuted(next);
  }, [isMuted]);

  const currentMissionIdx = MISSIONS.findIndex(m => m.id === currentMission.id);
  const hasNextMission = currentMissionIdx >= 0 && currentMissionIdx + 1 < MISSIONS.length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 1. START SCREEN */}
      {gameState === 'START' && (
        <StartScreen
          onStartMission={startMission}
          onOpenHighScores={() => setShowHighScores(true)}
          onOpenHandbook={() => setShowHandbook(true)}
          unlockedMissions={unlockedMissions}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* 2. ACTIVE GAMEPLAY CANVAS & HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'DEBRIEF') && engine && (
        <>
          <TacticalCanvas
            engine={engine}
            width={viewport.width}
            height={viewport.height}
          />

          <TacticalHUD
            engine={engine}
            onPause={() => {
              setGameState('PAUSED');
              engine.isPaused = true;
            }}
            onOpenHandbook={() => setShowHandbook(true)}
            onToggleMute={toggleMute}
            isMuted={isMuted}
          />

          <TouchControls
            engine={engine}
            inputsRef={inputsRef}
            isMobile={isMobile}
          />
        </>
      )}

      {/* 3. PAUSE MODAL */}
      {gameState === 'PAUSED' && engine && (
        <PauseModal
          onResume={() => {
            setGameState('PLAYING');
            engine.isPaused = false;
          }}
          onRestart={restartCurrentMission}
          onMainMenu={handleMainMenu}
          onOpenHandbook={() => setShowHandbook(true)}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* 4. DEBRIEF / GAME OVER MODAL */}
      {gameState === 'DEBRIEF' && missionResult && (
        <DebriefModal
          result={missionResult}
          onRestart={restartCurrentMission}
          onNextMission={handleNextMission}
          onMainMenu={handleMainMenu}
          onOpenHighScores={() => setShowHighScores(true)}
          hasNextMission={hasNextMission}
        />
      )}

      {/* 5. HIGH SCORES LEADERBOARD MODAL */}
      {showHighScores && (
        <HighScoresModal onClose={() => setShowHighScores(false)} />
      )}

      {/* 6. HANDBOOK & TACTICAL MANUAL MODAL */}
      {showHandbook && (
        <HandbookModal onClose={() => setShowHandbook(false)} />
      )}
    </div>
  );
};
export default App;
