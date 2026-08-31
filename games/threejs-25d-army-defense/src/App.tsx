import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { 
  HeroCommander, 
  SquadMember, 
  VillageState, 
  WaveScenario, 
  FormationMode, 
  RelicItem 
} from './types/game';
import { 
  INITIAL_SQUAD_MEMBERS, 
  WAVE_SCENARIOS, 
  SHOP_RELICS 
} from './game/waveConfigs';
import { HUD } from './components/HUD';
import { Minimap } from './components/Minimap';
import { ShopModal } from './components/ShopModal';
import { GameOverModal } from './components/GameOverModal';
import { WaveIntroBanner } from './components/WaveIntroBanner';
import { SettingsModal } from './components/SettingsModal';
import { StartScreen } from './components/StartScreen';
import { VirtualControls } from './components/VirtualControls';
import { soundManager } from './audio/soundManager';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI State
  const [gameState, setGameState] = useState<'start' | 'playing' | 'shop' | 'gameover'>('start');
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [waveNum, setWaveNum] = useState<number>(1);
  const [currentScenario, setCurrentScenario] = useState<WaveScenario | null>(WAVE_SCENARIOS[0]);
  const [gold, setGold] = useState<number>(150);
  const [combo, setCombo] = useState<number>(0);
  const [formation, setFormation] = useState<FormationMode>('follow');
  const [gameSpeed, setGameSpeed] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [musicVol, setMusicVol] = useState<number>(0.35);
  const [sfxVol, setSfxVol] = useState<number>(0.6);
  const [enemiesRemaining, setEnemiesRemaining] = useState<number>(0);
  const [totalEnemiesInWave, setTotalEnemiesInWave] = useState<number>(0);
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showWaveBanner, setShowWaveBanner] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [finalStats, setFinalStats] = useState<any>({
    wavesCompleted: 0,
    totalKills: 0,
    totalDamage: 0,
    gold: 0
  });

  // Entities state mirrors for React HUD
  const [squadList, setSquadList] = useState<SquadMember[]>(() => JSON.parse(JSON.stringify(INITIAL_SQUAD_MEMBERS)));
  const [relicsList, setRelicsList] = useState<RelicItem[]>(() => JSON.parse(JSON.stringify(SHOP_RELICS)));

  const [heroState, setHeroState] = useState<HeroCommander>({
    name: 'Kaelen',
    level: 1,
    stats: {
      hp: 450,
      maxHp: 450,
      attack: 60,
      defense: 20,
      moveSpeed: 6.8,
      attackSpeed: 1.6,
      attackRange: 2.8,
      critChance: 0.2
    },
    position: { x: 0, z: 4 },
    velocity: { x: 0, z: 0 },
    rotation: 0,
    isDashing: false,
    dashCooldown: 0,
    dashTimer: 0,
    skills: [],
    state: 'idle',
    animTimer: 0,
    attackCooldown: 0,
    killCount: 0,
    damageDealt: 0,
    shield: 0,
    maxShield: 150
  });

  const [villageState, setVillageState] = useState<VillageState>({
    hp: 1000,
    maxHp: 1000,
    level: 1,
    barricadeHp: 400,
    maxBarricadeHp: 400,
    turretLevel: 1,
    turretCooldown: 0,
    repairRate: 2,
    citizenCount: 4,
    isUnderAttack: false,
    damageFlashTimer: 0
  });

  // Callbacks for Engine
  const handleHeroHpChange = useCallback((hp: number, maxHp: number, shield: number) => {
    setHeroState(prev => ({
      ...prev,
      stats: { ...prev.stats, hp, maxHp },
      shield
    }));
  }, []);

  const handleVillageHpChange = useCallback((hp: number, maxHp: number) => {
    setVillageState(prev => ({
      ...prev,
      hp,
      maxHp
    }));
  }, []);

  const handleSquadUpdate = useCallback((squad: SquadMember[]) => {
    setSquadList([...squad]);
  }, []);

  const handleWaveProgress = useCallback((remaining: number, total: number, bossSpawned: boolean) => {
    setEnemiesRemaining(remaining);
    setTotalEnemiesInWave(total);
    setBossActive(bossSpawned);
  }, []);

  const handleWaveComplete = useCallback((_completedWave: number, _goldGained: number) => {
    soundManager.playVictoryFanfare();
    setGameState('shop');
    setShowWaveBanner(false);
  }, []);

  const handleGameOver = useCallback((victory: boolean, stats: any) => {
    setIsVictory(victory);
    setFinalStats(stats);
    setGameState('gameover');
  }, []);

  const handleGoldGain = useCallback((newGold: number) => {
    setGold(newGold);
  }, []);

  const handleComboChange = useCallback((newCombo: number) => {
    setCombo(newCombo);
  }, []);

  // Initialize Game Engine
  const initEngine = useCallback(() => {
    if (!containerRef.current) return;

    if (engineRef.current) {
      engineRef.current.destroy();
    }

    const engine = new GameEngine(containerRef.current, {
      onHeroHpChange: handleHeroHpChange,
      onVillageHpChange: handleVillageHpChange,
      onSquadUpdate: handleSquadUpdate,
      onWaveProgress: handleWaveProgress,
      onWaveComplete: handleWaveComplete,
      onGameOver: handleGameOver,
      onGoldGain: handleGoldGain,
      onComboChange: handleComboChange
    });

    engine.gold = gold;
    engine.activeRelics = relicsList;
    engineRef.current = engine;

    // Load initial wave scenario
    const scenario = WAVE_SCENARIOS[waveNum - 1] || WAVE_SCENARIOS[0];
    setCurrentScenario(scenario);
    engine.loadWave(scenario, squadList);
    setHeroState(engine.hero);
    setShowWaveBanner(true);
  }, [waveNum, gold, relicsList, squadList, handleHeroHpChange, handleVillageHpChange, handleSquadUpdate, handleWaveProgress, handleWaveComplete, handleGameOver, handleGoldGain, handleComboChange]);

  // Start Playing from Start Screen
  const handleStartGame = () => {
    setGameState('playing');
    setWaveNum(1);
    setGold(150);
    const freshSquad = JSON.parse(JSON.stringify(INITIAL_SQUAD_MEMBERS));
    const freshRelics = JSON.parse(JSON.stringify(SHOP_RELICS));
    setSquadList(freshSquad);
    setRelicsList(freshRelics);
    setTimeout(() => {
      initEngine();
    }, 50);
  };

  // Next Wave from Shop
  const handleStartNextWave = () => {
    const nextWaveNum = waveNum + 1;
    if (nextWaveNum > WAVE_SCENARIOS.length) {
      // Victory
      handleGameOver(true, {
        wavesCompleted: 7,
        totalKills: engineRef.current?.totalKills || 50,
        totalDamage: engineRef.current?.totalDamage || 25000,
        gold
      });
      return;
    }

    setWaveNum(nextWaveNum);
    const nextScen = WAVE_SCENARIOS[nextWaveNum - 1];
    setCurrentScenario(nextScen);
    setGameState('playing');
    setShowWaveBanner(true);

    if (engineRef.current) {
      engineRef.current.activeRelics = relicsList;
      engineRef.current.loadWave(nextScen, squadList);
    }
  };

  // Restart / Play Again
  const handleRestart = () => {
    setGameState('playing');
    setWaveNum(1);
    setGold(150);
    const freshSquad = JSON.parse(JSON.stringify(INITIAL_SQUAD_MEMBERS));
    const freshRelics = JSON.parse(JSON.stringify(SHOP_RELICS));
    setSquadList(freshSquad);
    setRelicsList(freshRelics);
    setTimeout(() => {
      initEngine();
    }, 50);
  };

  // Upgrade Actions from Shop
  const handleUpgradeHero = (type: 'attack' | 'hp' | 'speed' | 'crit', cost: number) => {
    if (gold < cost) return;
    setGold(prev => prev - cost);
    if (engineRef.current) {
      engineRef.current.gold -= cost;
      if (type === 'attack') engineRef.current.hero.stats.attack += 20;
      else if (type === 'hp') {
        engineRef.current.hero.stats.maxHp += 100;
        engineRef.current.hero.stats.hp = engineRef.current.hero.stats.maxHp;
        engineRef.current.hero.maxShield += 50;
        engineRef.current.hero.shield = engineRef.current.hero.maxShield;
      } else if (type === 'speed') engineRef.current.hero.stats.moveSpeed += 0.8;
      else if (type === 'crit') engineRef.current.hero.stats.critChance = Math.min(0.8, engineRef.current.hero.stats.critChance + 0.1);

      engineRef.current.hero.level += 1;
      setHeroState({ ...engineRef.current.hero });
    }
  };

  const handleUpgradeSquadMember = (memberId: string, cost: number) => {
    if (gold < cost) return;
    setGold(prev => prev - cost);
    if (engineRef.current) {
      engineRef.current.gold -= cost;
      const target = engineRef.current.squad.find(s => s.id === memberId);
      if (target) {
        target.level += 1;
        target.stats.attack = Math.round(target.stats.attack * 1.3);
        target.stats.maxHp = Math.round(target.stats.maxHp * 1.25);
        target.stats.hp = target.stats.maxHp;
        target.skill.cooldown = Math.max(3.0, target.skill.cooldown * 0.9);
      }
      setSquadList([...engineRef.current.squad]);
    }
  };

  const handleUpgradeVillage = (type: 'hp' | 'turret' | 'repair_full', cost: number) => {
    if (gold < cost) return;
    setGold(prev => prev - cost);
    if (engineRef.current) {
      engineRef.current.gold -= cost;
      if (type === 'hp') {
        engineRef.current.village.maxHp += 300;
        engineRef.current.village.hp = engineRef.current.village.maxHp;
        engineRef.current.village.level += 1;
      } else if (type === 'turret') {
        engineRef.current.village.turretLevel += 1;
      } else if (type === 'repair_full') {
        engineRef.current.village.hp = engineRef.current.village.maxHp;
        engineRef.current.hero.stats.hp = engineRef.current.hero.stats.maxHp;
      }
      setVillageState({ ...engineRef.current.village });
    }
  };

  const handleBuyRelic = (relicId: string, cost: number) => {
    if (gold < cost) return;
    setGold(prev => prev - cost);
    soundManager.playCoin();
    setRelicsList(prev => prev.map(r => r.id === relicId ? { ...r, purchased: true } : r));
    if (engineRef.current) {
      engineRef.current.gold -= cost;
      const relic = engineRef.current.activeRelics.find(r => r.id === relicId);
      if (relic) relic.purchased = true;
    }
  };

  // Speed & Pause toggles
  const handleToggleSpeed = () => {
    const speeds = [1.0, 1.5, 2.0];
    const curIdx = speeds.indexOf(gameSpeed);
    const nextSpeed = speeds[(curIdx + 1) % speeds.length];
    setGameSpeed(nextSpeed);
    if (engineRef.current) engineRef.current.gameSpeed = nextSpeed;
  };

  const handleTogglePause = () => {
    const nextPause = !isPaused;
    setIsPaused(nextPause);
    if (engineRef.current) engineRef.current.isPaused = nextPause;
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundManager.setMuted(nextMute);
  };

  // Tactical Formation
  const handleSetFormation = (mode: FormationMode) => {
    setFormation(mode);
    if (engineRef.current) engineRef.current.setFormation(mode);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
      soundManager.stopBiomeMusic();
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* IN-GAME HUD LAYER */}
      {gameState === 'playing' && (
        <>
          <HUD
            hero={engineRef.current ? engineRef.current.hero : heroState}
            squad={engineRef.current ? engineRef.current.squad : squadList}
            village={engineRef.current ? engineRef.current.village : villageState}
            scenario={currentScenario}
            waveNum={waveNum}
            gold={gold}
            combo={combo}
            formation={formation}
            gameSpeed={gameSpeed}
            isPaused={isPaused}
            isMuted={isMuted}
            enemiesRemaining={enemiesRemaining}
            totalEnemiesInWave={totalEnemiesInWave}
            bossActive={bossActive}
            onTriggerHeroSkill={(idx) => engineRef.current?.triggerHeroSkill(idx)}
            onTriggerHeroDash={() => engineRef.current?.triggerHeroDash()}
            onHeroAttack={() => engineRef.current?.heroPrimaryAttack()}
            onTriggerSquadSkill={(idx) => engineRef.current?.triggerSquadSkill(idx)}
            onSetFormation={handleSetFormation}
            onToggleSpeed={handleToggleSpeed}
            onTogglePause={handleTogglePause}
            onToggleMute={handleToggleMute}
            onOpenSettings={() => setShowSettings(true)}
            lang={lang}
          />

          {/* Minimap Radar (Top Right) */}
          <div className="absolute top-16 right-3 pointer-events-none z-10 hidden sm:block">
            <Minimap
              hero={engineRef.current ? engineRef.current.hero : heroState}
              squad={engineRef.current ? engineRef.current.squad : squadList}
              enemies={engineRef.current ? engineRef.current.enemies : []}
            />
          </div>

          {/* Virtual Touch Controls (Mobile) */}
          <VirtualControls
            onMove={(vec) => {
              if (engineRef.current) engineRef.current.virtualMoveVector = vec;
            }}
            onAttack={() => engineRef.current?.heroPrimaryAttack()}
            onDash={() => engineRef.current?.triggerHeroDash()}
            lang={lang}
          />

          {/* Cinematic Wave Intro Banner */}
          {showWaveBanner && currentScenario && (
            <WaveIntroBanner
              scenario={currentScenario}
              lang={lang}
              onDismiss={() => setShowWaveBanner(false)}
            />
          )}
        </>
      )}

      {/* START MENU */}
      {gameState === 'start' && (
        <StartScreen
          onStartGame={handleStartGame}
          lang={lang}
          setLang={setLang}
        />
      )}

      {/* INTERMISSION SHOP MODAL */}
      {gameState === 'shop' && (
        <ShopModal
          gold={gold}
          waveNum={waveNum}
          nextScenario={WAVE_SCENARIOS[waveNum] || null}
          hero={engineRef.current ? engineRef.current.hero : heroState}
          squad={squadList}
          village={engineRef.current ? engineRef.current.village : villageState}
          relics={relicsList}
          onUpgradeHero={handleUpgradeHero}
          onUpgradeSquadMember={handleUpgradeSquadMember}
          onUpgradeVillage={handleUpgradeVillage}
          onBuyRelic={handleBuyRelic}
          onStartNextWave={handleStartNextWave}
          lang={lang}
        />
      )}

      {/* GAME OVER (VICTORY / DEFEAT) */}
      {gameState === 'gameover' && (
        <GameOverModal
          isVictory={isVictory}
          stats={finalStats}
          onRestart={handleRestart}
          onStartEndless={handleRestart}
          lang={lang}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          lang={lang}
          setLang={setLang}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          musicVol={musicVol}
          setMusicVol={setMusicVol}
          sfxVol={sfxVol}
          setSfxVol={setSfxVol}
        />
      )}

    </div>
  );
};

export default App;
