import { useState, useRef, useEffect } from 'react';
import { GameEngine } from './game/GameEngine';
import { HUD } from './components/HUD';
import { ArmoryModal } from './components/ArmoryModal';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { BestiaryModal } from './components/BestiaryModal';
import { AchievementsModal } from './components/AchievementsModal';
import { MainMenu } from './components/MainMenu';
import { soundManager } from './audio/SoundManager';
import { 
  SoldierRuntimeStats, 
  WeaponStats, 
  WeaponType, 
  UpgradeItem, 
  RoguelitePerk, 
  FloatingText 
} from './types/game';
import { WEAPON_DEFINITIONS, SOLDIER_CLASSES } from './game/constants';
import * as THREE from 'three';

type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'ARMORY' | 'GAMEOVER';

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI & Modal States
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedSoldierClassId, setSelectedSoldierClassId] = useState<string>('commando');
  const [showBestiary, setShowBestiary] = useState<boolean>(false);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);

  // HUD & Runtime Sync State
  const [stats, setStats] = useState<SoldierRuntimeStats>({
    maxHp: 100,
    hp: 100,
    maxShield: 50,
    shield: 50,
    shieldRechargeRate: 8,
    shieldRechargeDelay: 2.2,
    moveSpeed: 7.5,
    sprintMultiplier: 1.35,
    jumpForce: 13.0,
    jetpackMaxFuel: 100,
    jetpackFuel: 100,
    jetpackBurnRate: 45,
    jetpackRechargeRate: 28,
    dashCooldown: 1.2,
    damageMultiplier: 1.0,
    critChance: 0.1,
    critMultiplier: 2.0,
    lifeSteal: 0,
    pickupRadius: 5,
    creditBonus: 0,
    specialAbilityCooldown: 12,
    specialAbilityMaxCharges: 3,
    specialAbilityCharges: 3,
  });

  const [currentWeapon, setCurrentWeapon] = useState<WeaponStats>(WEAPON_DEFINITIONS['assault_rifle']);
  const [arsenal, setArsenal] = useState<Record<string, WeaponStats>>(WEAPON_DEFINITIONS);
  const [waveNumber, setWaveNumber] = useState<number>(1);
  const [biomeName, setBiomeName] = useState<string>('Sector Urbano 7');
  const [monstersKilled, setMonstersKilled] = useState<number>(0);
  const [totalMonsters, setTotalMonsters] = useState<number>(22);
  const [score, setScore] = useState<number>(0);
  const [credits, setCredits] = useState<number>(200);
  const [combo, setCombo] = useState<number>(0);
  const [currentBoss, setCurrentBoss] = useState<any>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Post Game Stats
  const [gameOverStats, setGameOverStats] = useState<any>({
    victory: false,
    stats: {
      score: 0,
      credits: 0,
      waveReached: 1,
      kills: 0,
      bossesDefeated: 0,
      timeSurvivedSec: 0,
    },
  });

  // Audio Settings
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [soundVolume, setSoundVolume] = useState<number>(0.8);
  const [musicVolume, setMusicVolume] = useState<number>(0.5);

  // Initialize Game on Play
  const handleStartGame = (soldierClassId: string, _isEndless: boolean) => {
    setSelectedSoldierClassId(soldierClassId);
    setGameState('PLAYING');

    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

    if (!containerRef.current) return;

    const engine = new GameEngine(
      containerRef.current,
      {
        onStatsUpdate: (newStats) => setStats(newStats),
        onWeaponUpdate: (activeW, newArsenal) => {
          setCurrentWeapon({ ...activeW });
          setArsenal({ ...newArsenal });
        },
        onWaveProgressUpdate: (killed, total, wave, name) => {
          setMonstersKilled(killed);
          setTotalMonsters(total);
          setWaveNumber(wave);
          setBiomeName(name);
        },
        onScoreUpdate: (newScore, newCredits, newCombo) => {
          setScore(newScore);
          setCredits(newCredits);
          setCombo(newCombo);
        },
        onBossUpdate: (boss) => {
          setCurrentBoss(boss);
        },
        onWaveCleared: (clearedWave) => {
          setWaveNumber(clearedWave);
          setGameState('ARMORY');
          if (engineRef.current) engineRef.current.pause(true);
        },
        onGameOver: (victory, finalStats) => {
          setGameOverStats({ victory, stats: finalStats });
          setGameState('GAMEOVER');
        },
        onFloatingTextsUpdate: (texts) => {
          setFloatingTexts(texts);
        },
      },
      soldierClassId
    );

    engineRef.current = engine;
    engine.start();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  // Keyboard Pause handler (Escape / P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
          if (engineRef.current) engineRef.current.pause(true);
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
          if (engineRef.current) engineRef.current.pause(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Audio Toggle
  const handleToggleMute = () => {
    if (isMuted) {
      soundManager.setSoundVolume(soundVolume);
      soundManager.setMusicVolume(musicVolume);
      setIsMuted(false);
    } else {
      soundManager.setSoundVolume(0);
      soundManager.setMusicVolume(0);
      setIsMuted(true);
    }
  };

  // Armory Actions
  const handleBuyUpgrade = (upgrade: UpgradeItem) => {
    if (!engineRef.current) return;
    const currentCost = Math.round(upgrade.cost * Math.pow(upgrade.costMultiplier, upgrade.level - 1));
    if (credits >= currentCost && upgrade.level < upgrade.maxLevel) {
      soundManager.playUIClick();
      engineRef.current.credits -= currentCost;
      upgrade.apply(engineRef.current.soldierStats);
      upgrade.level++;
      setCredits(engineRef.current.credits);
      setStats({ ...engineRef.current.soldierStats });
    }
  };

  const handleUnlockWeapon = (weaponId: WeaponType) => {
    if (!engineRef.current) return;
    const weapon = engineRef.current.arsenal[weaponId];
    if (weapon && !weapon.unlocked && credits >= weapon.upgradeCost) {
      soundManager.playPowerupPickup();
      engineRef.current.credits -= weapon.upgradeCost;
      weapon.unlocked = true;
      setCredits(engineRef.current.credits);
      setArsenal({ ...engineRef.current.arsenal });
    }
  };

  const handleUpgradeWeapon = (weaponId: WeaponType) => {
    if (!engineRef.current) return;
    const weapon = engineRef.current.arsenal[weaponId];
    const cost = weapon.upgradeCost * weapon.level;
    if (weapon && weapon.unlocked && credits >= cost) {
      soundManager.playPowerupPickup();
      engineRef.current.credits -= cost;
      weapon.level++;
      weapon.damage = Math.round(weapon.damage * 1.25);
      weapon.magazineSize = Math.round(weapon.magazineSize * 1.2);
      weapon.currentAmmo = weapon.magazineSize;
      setCredits(engineRef.current.credits);
      setArsenal({ ...engineRef.current.arsenal });
    }
  };

  const handleSelectRoguelitePerk = (perk: RoguelitePerk) => {
    if (!engineRef.current) return;
    soundManager.playPowerupPickup();
    perk.apply(engineRef.current.soldierStats, engineRef.current);
    setStats({ ...engineRef.current.soldierStats });
  };

  const handleRefillAmmo = () => {
    if (!engineRef.current || credits < 100) return;
    soundManager.playReload();
    engineRef.current.credits -= 100;
    Object.values(engineRef.current.arsenal).forEach((w) => {
      w.reserveAmmo = w.maxReserveAmmo;
      w.currentAmmo = w.magazineSize;
    });
    setCredits(engineRef.current.credits);
    setArsenal({ ...engineRef.current.arsenal });
  };

  const handleHealPlayer = () => {
    if (!engineRef.current || credits < 80) return;
    soundManager.playPowerupPickup();
    engineRef.current.credits -= 80;
    engineRef.current.soldierStats.hp = engineRef.current.soldierStats.maxHp;
    engineRef.current.soldierStats.shield = engineRef.current.soldierStats.maxShield;
    setCredits(engineRef.current.credits);
    setStats({ ...engineRef.current.soldierStats });
  };

  const handleStartNextWave = () => {
    if (!engineRef.current) return;
    const nextWave = waveNumber + 1;
    setWaveNumber(nextWave);
    engineRef.current.loadWave(nextWave);
    engineRef.current.pause(false);
    setGameState('PLAYING');
  };

  const handleResumeGame = () => {
    if (engineRef.current) engineRef.current.pause(false);
    setGameState('PLAYING');
  };

  const handleRestartGame = () => {
    handleStartGame(selectedSoldierClassId, false);
  };

  const handleQuitToMenu = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setGameState('MENU');
  };

  const activeSoldierClass = SOLDIER_CLASSES.find((c) => c.id === selectedSoldierClassId) || SOLDIER_CLASSES[0];

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Cyber Scanlines Overlay */}
      <div className="scanlines absolute inset-0 z-10 pointer-events-none" />

      {/* Floating 3D Damage Numbers */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        {floatingTexts.map((ft) => {
          if (!engineRef.current) return null;
          // Project 3D coordinate to 2D screen
          const vector = new THREE.Vector3(ft.x, ft.y, 0);
          vector.project(engineRef.current.camera);
          const screenX = ((vector.x + 1) / 2) * window.innerWidth;
          const screenY = ((-vector.y + 1) / 2) * window.innerHeight;

          return (
            <div
              key={ft.id}
              className="absolute font-orbitron font-black text-sm drop-shadow-md select-none transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-100"
              style={{
                left: `${screenX}px`,
                top: `${screenY}px`,
                color: ft.color,
                transform: `translate(-50%, -50%) scale(${ft.scale})`,
                opacity: ft.life / ft.maxLife,
              }}
            >
              {ft.text}
            </div>
          );
        })}
      </div>

      {/* HUD (Active during PLAYING or PAUSED) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <div className="relative z-30 w-full h-full">
          <HUD
            stats={stats}
            currentWeapon={currentWeapon}
            arsenal={arsenal}
            waveNumber={waveNumber}
            biomeName={biomeName}
            monstersKilled={monstersKilled}
            totalMonsters={totalMonsters}
            score={score}
            credits={credits}
            combo={combo}
            boss={currentBoss}
            activePowerups={engineRef.current?.activePowerups || new Map()}
            onSwitchWeapon={(id) => engineRef.current?.switchWeapon(id)}
            onReload={() => engineRef.current?.reloadWeapon()}
            onSpecial={() => engineRef.current?.triggerSpecialAbility()}
            onDash={() => engineRef.current?.triggerDash()}
            onMelee={() => engineRef.current?.triggerMelee()}
            onPause={() => {
              setGameState('PAUSED');
              engineRef.current?.pause(true);
            }}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onMobileMove={(vx, jump) => engineRef.current?.touchMove(vx, jump)}
            onMobileFire={(ax, ay, fire) => engineRef.current?.touchAimAndFire(ax, ay, fire)}
          />
        </div>
      )}

      {/* MAIN MENU */}
      {gameState === 'MENU' && (
        <div className="relative z-40 w-full h-full">
          <MainMenu
            onStartGame={handleStartGame}
            onOpenBestiary={() => setShowBestiary(true)}
            onOpenAchievements={() => setShowAchievements(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        </div>
      )}

      {/* PAUSE MENU */}
      {gameState === 'PAUSED' && (
        <div className="relative z-50">
          <PauseMenu
            soundVolume={soundVolume}
            musicVolume={musicVolume}
            onSetSoundVolume={(v) => setSoundVolume(v)}
            onSetMusicVolume={(v) => setMusicVolume(v)}
            onResume={handleResumeGame}
            onRestart={handleRestartGame}
            onQuit={handleQuitToMenu}
          />
        </div>
      )}

      {/* ARMORY MODAL (Between Waves) */}
      {gameState === 'ARMORY' && (
        <div className="relative z-50">
          <ArmoryModal
            waveCompleted={waveNumber}
            credits={credits}
            stats={stats}
            arsenal={arsenal}
            onBuyUpgrade={handleBuyUpgrade}
            onUnlockWeapon={handleUnlockWeapon}
            onUpgradeWeapon={handleUpgradeWeapon}
            onSelectRoguelitePerk={handleSelectRoguelitePerk}
            onRefillAmmo={handleRefillAmmo}
            onHealPlayer={handleHealPlayer}
            onStartNextWave={handleStartNextWave}
          />
        </div>
      )}

      {/* GAME OVER (Victory / Defeat) */}
      {gameState === 'GAMEOVER' && (
        <div className="relative z-50">
          <GameOverModal
            victory={gameOverStats.victory}
            stats={gameOverStats.stats}
            soldierName={activeSoldierClass.name}
            onRestart={handleRestartGame}
            onMainMenu={handleQuitToMenu}
          />
        </div>
      )}

      {/* BESTIARY MODAL */}
      {showBestiary && <BestiaryModal onClose={() => setShowBestiary(false)} />}

      {/* ACHIEVEMENTS MODAL */}
      {showAchievements && <AchievementsModal onClose={() => setShowAchievements(false)} />}
    </div>
  );
}
export default App;
