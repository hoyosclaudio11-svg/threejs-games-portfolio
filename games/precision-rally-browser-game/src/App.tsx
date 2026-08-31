import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  TrackStage,
  CarSpec,
  VehiclePhysicsState,
  PaceNote,
  GhostData,
  GhostPoint,
  GameSettings,
} from './types/game';
import { RALLY_STAGES } from './game/tracks';
import { RALLY_CARS } from './game/cars';
import { PhysicsEngine } from './game/physics';
import { ParticleSystem } from './game/particles';
import { GameRenderer } from './game/renderer';
import { InputManager } from './game/input';
import { audio } from './game/audio';
import { GhostSystem } from './game/ghost';
import {
  loadSettings,
  saveSettings,
  saveHighScore,
  getBestTimeForStage,
} from './utils/storage';

import { StartScreen } from './components/StartScreen';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { CountdownOverlay } from './components/CountdownOverlay';
import { PauseModal } from './components/PauseModal';
import { FinishScreen } from './components/FinishScreen';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SettingsModal } from './components/SettingsModal';

export function App() {
  // Game states
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedStage, setSelectedStage] = useState<TrackStage>(RALLY_STAGES[0]);
  const [selectedCar, setSelectedCar] = useState<CarSpec>(RALLY_CARS[0]);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Live Telemetry states for React HUD
  const [stageTime, setStageTime] = useState(0);
  const [countdownValue, setCountdownValue] = useState(-1);
  const [currentNote, setCurrentNote] = useState<PaceNote | null>(null);
  const [distanceToNote, setDistanceToNote] = useState(0);
  const [currentSectorIndex, setCurrentSectorIndex] = useState(0);
  const [sectorSplits, setSectorSplits] = useState<{ sectorId: number; time: number; delta: number }[]>([]);

  // Finish run summary data
  const [finishStats, setFinishStats] = useState<{
    finalTime: number;
    sectorTimes: number[];
    topSpeedKmh: number;
    driftScore: number;
    maxDriftAngle: number;
    isNewRecord: boolean;
    medal: 'gold' | 'silver' | 'bronze' | 'none';
  } | null>(null);

  // Canvas and Engine refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const inputRef = useRef<InputManager>(new InputManager());
  const ghostSystemRef = useRef<GhostSystem>(new GhostSystem());

  // Mutable Physics & Run references for 60fps loop
  const carStateRef = useRef<VehiclePhysicsState>(PhysicsEngine.createInitialState());
  const activeGhostRef = useRef<GhostData | null>(null);
  const topSpeedRef = useRef<number>(0);
  const maxDriftRef = useRef<number>(0);
  const passedSectorsRef = useRef<Set<number>>(new Set());
  const sectorTimesRef = useRef<number[]>([]);
  const lastNoteDistRef = useRef<number>(-100);
  const stageTimeRef = useRef<number>(0);

  // Initialize Audio & Canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;

    const handleResize = () => {
      if (canvas && rendererRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth;
        const height = window.innerHeight;
        rendererRef.current.resize(width * dpr, height * dpr);
      }
    };

    if (canvas) {
      rendererRef.current = new GameRenderer(canvas);
      handleResize();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync Audio mute state
  useEffect(() => {
    audio.setMuted(isMuted);
  }, [isMuted]);

  // Start Countdown and Initialize Race
  const startRace = useCallback(() => {
    audio.init();

    const startPoint = selectedStage.points[0];
    const secondPoint = selectedStage.points[1] || { x: 0, y: -50 };
    const startAngle = Math.atan2(secondPoint.y - startPoint.y, secondPoint.x - startPoint.x);

    carStateRef.current = PhysicsEngine.createInitialState(startPoint.x, startPoint.y, startAngle);
    particlesRef.current.clear();
    if (rendererRef.current) {
      rendererRef.current.clearSkidBuffer();
    }
    inputRef.current.reset();

    topSpeedRef.current = 0;
    maxDriftRef.current = 0;
    passedSectorsRef.current.clear();
    sectorTimesRef.current = [];
    lastNoteDistRef.current = -100;
    stageTimeRef.current = 0;

    // Load Ghost for stage
    activeGhostRef.current = GhostSystem.loadGhost(selectedStage.id);
    ghostSystemRef.current.startRecording();

    setStageTime(0);
    setCurrentSectorIndex(0);
    setSectorSplits([]);
    setCurrentNote(null);
    setFinishStats(null);

    // Run 3-2-1-GO Countdown sequence
    setGameState('countdown');
    setCountdownValue(3);
    audio.playCountdownBeep(false);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdownValue(count);

      if (count > 0) {
        audio.playCountdownBeep(false);
      } else if (count === 0) {
        audio.playCountdownBeep(true);
        setGameState('racing');
      } else {
        clearInterval(interval);
        setCountdownValue(-1);
      }
    }, 900);
  }, [selectedStage]);

  // Restart Current Stage
  const restartStage = useCallback(() => {
    startRace();
  }, [startRace]);

  // Pause & Resume
  const togglePause = useCallback(() => {
    if (gameState === 'racing') {
      setGameState('paused');
      audio.stopEngine();
    } else if (gameState === 'paused') {
      setGameState('racing');
    }
  }, [gameState]);

  // Next Stage navigation
  const handleNextStage = useCallback(() => {
    const currentIndex = RALLY_STAGES.findIndex((s) => s.id === selectedStage.id);
    const nextIndex = (currentIndex + 1) % RALLY_STAGES.length;
    setSelectedStage(RALLY_STAGES[nextIndex]);
    startRace();
  }, [selectedStage, startRace]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const gameLoop = (currentTimestamp: number) => {
      const dt = Math.min(0.05, (currentTimestamp - lastTimestamp) / 1000);
      lastTimestamp = currentTimestamp;

      const car = carStateRef.current;
      const input = inputRef.current.getState();
      const particles = particlesRef.current;
      const renderer = rendererRef.current;
      const ghostData = activeGhostRef.current;

      // Handle hotkey requests
      if (input.restart && (gameState === 'racing' || gameState === 'paused' || gameState === 'finished')) {
        restartStage();
      }
      if (input.pause && (gameState === 'racing' || gameState === 'paused')) {
        togglePause();
      }

      // Physics & Simulation Update (Only while Racing or Countdown)
      if (gameState === 'racing' || gameState === 'countdown') {
        if (gameState === 'racing') {
          stageTimeRef.current += dt;
          setStageTime(stageTimeRef.current);
        }

        // Apply steering sensitivity
        const adjustedInput = {
          ...input,
          steer: input.steer * settings.steeringSensitivity,
          throttle: gameState === 'countdown' ? 0 : input.throttle,
        };

        const physicsRes = PhysicsEngine.update(
          car,
          selectedCar,
          adjustedInput,
          selectedStage,
          dt
        );

        // Sound & FX triggers
        if (physicsRes.impactForce > 1.2) {
          audio.playImpact(physicsRes.impactForce);
          if (renderer && settings.screenShake) {
            renderer.triggerScreenShake(Math.min(12, physicsRes.impactForce * 2.5), 0.35);
          }
        }
        if (physicsRes.jumpLanded) {
          audio.playJumpLand();
          if (renderer && settings.screenShake) {
            renderer.triggerScreenShake(6, 0.25);
          }
        }
        if (physicsRes.backfired) {
          particles.emitExhaustFlame(car.x, car.y, car.angle);
        }

        // Cliff Fall / Reset Check
        if (car.isOffCliff) {
          audio.playImpact(5);
          // Teleport back to nearest spline track center with penalty
          const nearestPoint = selectedStage.points.find(
            (p) => Math.hypot(p.x - car.x, p.y - car.y) < 60
          ) || selectedStage.points[0];

          car.x = nearestPoint.x;
          car.y = nearestPoint.y;
          car.vx *= 0.1;
          car.vy *= 0.1;
          car.speed = 0;
          car.isOffCliff = false;
          stageTimeRef.current += 3.0; // 3-second penalty
          if (renderer) {
            renderer.triggerScreenShake(15, 0.5);
          }
        }

        // Emit Tire Roost Particles
        const wheels = [car.wheels.frontLeft, car.wheels.frontRight, car.wheels.rearLeft, car.wheels.rearRight];
        wheels.forEach((w) => {
          if (w.skidding && !car.isAirborne) {
            particles.emitTireRoost(
              w.x,
              w.y,
              w.steerAngle,
              car.speed,
              w.skidIntensity,
              w.surface
            );
          }
        });

        // Water Splash Particles
        if (car.surfaceCurrent === 'mud' && car.speedKmh > 50) {
          particles.emitWaterSplash(car.x, car.y, car.speed);
        }

        // Audio Engine Synthesis Update
        audio.updateEngine(
          car.rpm,
          adjustedInput.throttle,
          car.boostPressure,
          selectedCar.engineSoundProfile,
          car.isAirborne
        );

        // Tire slide sound
        const maxSkid = Math.max(...wheels.map((w) => w.skidIntensity));
        audio.updateTireSlide(maxSkid, car.surfaceCurrent, car.handbrake);

        // Record telemetry for top stats
        topSpeedRef.current = Math.max(topSpeedRef.current, car.speedKmh);
        maxDriftRef.current = Math.max(maxDriftRef.current, car.driftAngle * (180 / Math.PI));

        // Record Ghost Frame
        if (gameState === 'racing') {
          ghostSystemRef.current.recordFrame(
            stageTimeRef.current,
            car.x,
            car.y,
            car.angle,
            car.speed,
            car.steerAngle,
            car.brake > 0.2,
            car.isDrifting
          );
        }

        // 1. Sector Checkpoints Trigger
        selectedStage.sectors.forEach((sec, idx) => {
          if (!passedSectorsRef.current.has(sec.id) && car.distanceTravelled >= sec.distanceMeters) {
            passedSectorsRef.current.add(sec.id);
            const splitTime = stageTimeRef.current;
            const delta = splitTime - sec.targetTimeSeconds;
            sectorTimesRef.current.push(splitTime);

            setSectorSplits((prev) => [...prev, { sectorId: sec.id, time: splitTime, delta }]);
            setCurrentSectorIndex(idx + 1);
            audio.playSectorSplit(delta <= 0);
          }
        });

        // 2. Pace Notes Co-driver Trigger
        const upcomingNotes = selectedStage.paceNotes.filter(
          (n) => n.distanceMeters > car.distanceTravelled && n.distanceMeters - car.distanceTravelled < 160
        );

        if (upcomingNotes.length > 0) {
          const nextNote = upcomingNotes[0];
          const dist = nextNote.distanceMeters - car.distanceTravelled;
          setCurrentNote(nextNote);
          setDistanceToNote(dist);

          if (Math.abs(nextNote.distanceMeters - lastNoteDistRef.current) > 10) {
            lastNoteDistRef.current = nextNote.distanceMeters;
            audio.playPaceNoteCue(nextNote.severity);
          }
        } else {
          setCurrentNote(null);
        }

        // 3. Stage Finish Check
        if (car.distanceTravelled >= selectedStage.totalDistanceMeters && gameState === 'racing') {
          setGameState('finished');
          audio.stopEngine();
          audio.playFinishFanfare();

          const finalTotalTime = stageTimeRef.current;

          // Calculate medal
          let earnedMedal: 'gold' | 'silver' | 'bronze' | 'none' = 'none';
          if (finalTotalTime <= selectedStage.parTimeSeconds) earnedMedal = 'gold';
          else if (finalTotalTime <= selectedStage.silverTimeSeconds) earnedMedal = 'silver';
          else if (finalTotalTime <= selectedStage.bronzeTimeSeconds) earnedMedal = 'bronze';

          // Save high score
          const isRecord = saveHighScore({
            id: `run_${Date.now()}`,
            stageId: selectedStage.id,
            stageName: selectedStage.name,
            carId: selectedCar.id,
            carName: selectedCar.name,
            totalTimeSeconds: finalTotalTime,
            sectorTimes: sectorTimesRef.current,
            topSpeedKmh: topSpeedRef.current,
            avgSpeedKmh: Math.round((selectedStage.totalDistanceMeters / finalTotalTime) * 3.6),
            maxDriftAngle: maxDriftRef.current,
            driftScore: car.driftScore,
            date: new Date().toISOString().split('T')[0],
            cleanRun: car.damage < 15,
            medal: earnedMedal,
          });

          // Save ghost
          const ghostDataFinal = ghostSystemRef.current.finalizeRun(
            selectedStage.id,
            selectedCar.id,
            finalTotalTime
          );
          GhostSystem.saveGhost(ghostDataFinal);

          setFinishStats({
            finalTime: finalTotalTime,
            sectorTimes: sectorTimesRef.current,
            topSpeedKmh: topSpeedRef.current,
            driftScore: car.driftScore,
            maxDriftAngle: maxDriftRef.current,
            isNewRecord: isRecord,
            medal: earnedMedal,
          });
        }
      }

      // Update Particles
      particles.update(dt);

      // Interpolate Ghost Car position
      let ghostPoint: GhostPoint | null = null;
      if (ghostData && gameState === 'racing') {
        ghostPoint = GhostSystem.getGhostInterpolated(ghostData, stageTimeRef.current);
      }

      // Render Stage Frame to Canvas
      if (renderer) {
        renderer.render(
          car,
          selectedCar,
          selectedStage,
          ghostPoint,
          particles,
          settings,
          dt
        );
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, selectedCar, selectedStage, settings, restartStage, togglePause]);

  const bestTime = getBestTimeForStage(selectedStage.id);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 60 FPS HTML5 Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* 1. START / TITLE SCREEN */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-40">
          <StartScreen
            selectedStage={selectedStage}
            selectedCar={selectedCar}
            onSelectStage={setSelectedStage}
            onSelectCar={setSelectedCar}
            onStartGame={startRace}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
      )}

      {/* 2. RACING & COUNTDOWN HUD OVERLAY */}
      {(gameState === 'racing' || gameState === 'countdown') && (
        <>
          <HUD
            car={carStateRef.current}
            track={selectedStage}
            currentNote={currentNote}
            distanceToNote={distanceToNote}
            stageTime={stageTime}
            bestTime={bestTime}
            currentSectorIndex={currentSectorIndex}
            sectorSplits={sectorSplits}
            ghost={null}
            settings={settings}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            onPause={togglePause}
            onRestart={restartStage}
            onToggleCamera={() =>
              setSettings((prev) => ({
                ...prev,
                dynamicCameraRotation: !prev.dynamicCameraRotation,
              }))
            }
          />

          {/* On-Screen Mobile Touch Controls (Always available on touch devices) */}
          <TouchControls
            onSteer={(steer) => inputRef.current.setTouchInput({ steer })}
            onThrottle={(throttle) => inputRef.current.setTouchInput({ throttle })}
            onBrake={(brake) => inputRef.current.setTouchInput({ brake })}
            onHandbrake={(handbrake) => inputRef.current.setTouchInput({ handbrake })}
            mode={settings.touchControlsMode}
          />

          {/* Countdown 3-2-1-GO Overlay */}
          {gameState === 'countdown' && (
            <CountdownOverlay countdownValue={countdownValue} />
          )}
        </>
      )}

      {/* 3. PAUSE MODAL */}
      <PauseModal
        isOpen={gameState === 'paused'}
        settings={settings}
        isMuted={isMuted}
        onResume={togglePause}
        onRestart={restartStage}
        onExitToMenu={() => {
          setGameState('menu');
          audio.stopEngine();
        }}
        onToggleMute={() => setIsMuted(!isMuted)}
        onUpdateSettings={(partial) => {
          const updated = { ...settings, ...partial };
          setSettings(updated);
          saveSettings(updated);
        }}
      />

      {/* 4. FINISH SCREEN / TELEMETRY SUMMARY */}
      {gameState === 'finished' && finishStats && (
        <FinishScreen
          stage={selectedStage}
          car={selectedCar}
          finalTime={finishStats.finalTime}
          sectorTimes={finishStats.sectorTimes}
          topSpeedKmh={finishStats.topSpeedKmh}
          driftScore={finishStats.driftScore}
          maxDriftAngle={finishStats.maxDriftAngle}
          isNewRecord={finishStats.isNewRecord}
          medal={finishStats.medal}
          onRestart={restartStage}
          onNextStage={handleNextStage}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onExitToMenu={() => setGameState('menu')}
        />
      )}

      {/* 5. LEADERBOARD / RECORDS MODAL */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* 6. SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={setSettings}
      />
    </div>
  );
}

export default App;
