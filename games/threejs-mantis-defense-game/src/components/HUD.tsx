import React, { useState, useEffect } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Minimap } from './Minimap';
import { 
  Heart, Shield, Zap, Sparkles, Sword, 
  Wind, Crosshair, Flame, Pause, Volume2, 
  VolumeX, AlertTriangle, Play
} from 'lucide-react';

interface HUDProps {
  engine: GameEngine | null;
  onOpenEvolution: () => void;
  onOpenSettings: () => void;
  onTogglePause: () => void;
}

export const HUD: React.FC<HUDProps> = ({ 
  engine, 
  onOpenEvolution, 
  onOpenSettings,
  onTogglePause 
}) => {
  const [, setTick] = useState(0);
  const [fps, setFps] = useState(60);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = () => {
      animId = requestAnimationFrame(loop);
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      setTick((t) => (t + 1) % 1000);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!engine) return null;

  const { playerStats, nestStats, cooldowns, activeBuffs, currentWaveNumber, enemiesRemainingInWave, totalEnemiesInWave } = engine;
  const playerHpPct = Math.max(0, (playerStats.health / playerStats.maxHealth) * 100);
  const nestHpPct = Math.max(0, (nestStats.health / nestStats.maxHealth) * 100);
  const nestShieldPct = nestStats.maxShield > 0 ? Math.max(0, (nestStats.shield / nestStats.maxShield) * 100) : 0;
  const waveProgressPct = totalEnemiesInWave > 0 
    ? Math.max(0, Math.min(100, ((totalEnemiesInWave - enemiesRemainingInWave) / totalEnemiesInWave) * 100)) 
    : 100;

  // Ability Cooldown percentage helpers
  const getCdRatio = (curr: number, max: number) => max > 0 ? Math.max(0, Math.min(1, curr / max)) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 sm:p-5 overflow-hidden">
      
      {/* 1. TOP BAR */}
      <div className="flex items-start justify-between gap-3">
        {/* Mantis Health & Stats */}
        <div className="flex flex-col gap-1.5 w-64 sm:w-80 pointer-events-auto bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-gaming text-xs sm:text-sm font-black text-emerald-400 tracking-wider">
                MANTIS GUARDIAN
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nv. {playerStats.level}</span>
            </div>
          </div>

          {/* Health Bar */}
          <div className="relative w-full h-4 sm:h-5 bg-zinc-900/90 rounded-lg overflow-hidden border border-emerald-500/40">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-400 transition-all duration-150"
              style={{ width: `${playerHpPct}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] sm:text-xs font-bold text-white drop-shadow">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                <span>Salud</span>
              </div>
              <span>{Math.round(playerStats.health)} / {playerStats.maxHealth}</span>
            </div>
          </div>

          {/* Active Buff Indicators */}
          <div className="flex items-center gap-2 pt-0.5 text-[11px] text-zinc-300">
            {activeBuffs.frenzy > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-fuchsia-950/80 border border-fuchsia-500 text-fuchsia-300 flex items-center gap-1 font-bold animate-pulse">
                <Flame className="w-3 h-3 text-fuchsia-400 fill-fuchsia-400" />
                Furia Alfa ({activeBuffs.frenzy.toFixed(1)}s)
              </span>
            )}
            {activeBuffs.stealth > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500 text-cyan-300 font-semibold">
                Camuflaje
              </span>
            )}
            <span className="text-[10px] text-zinc-400 ml-auto">
              Armadura: {Math.round(playerStats.armor * 100)}% | Robo: {Math.round(playerStats.lifeLeech * 100)}%
            </span>
          </div>
        </div>

        {/* Center: Wave Tracker & Biomass */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          {/* Wave Card */}
          <div className="bg-black/75 backdrop-blur-md px-4 sm:px-6 py-2 rounded-2xl border border-emerald-500/40 shadow-xl text-center">
            <div className="text-[10px] sm:text-xs font-gaming text-emerald-400 tracking-widest uppercase font-bold">
              {engine.waveStatusText || `OLEADA ${currentWaveNumber}`}
            </div>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-base sm:text-xl font-gaming font-black text-white">
                {enemiesRemainingInWave} <span className="text-xs font-normal text-zinc-400">enemigos</span>
              </span>
              <span className="w-1 h-3 bg-zinc-600 rounded"></span>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm sm:text-base">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>{playerStats.biomass}</span>
                <span className="text-[10px] text-emerald-200 uppercase font-semibold">Biomasa</span>
              </div>
            </div>

            {/* Wave Progress Bar */}
            <div className="w-40 sm:w-56 h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden border border-zinc-700">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${waveProgressPct}%` }}
              />
            </div>
          </div>

          {/* Quick Shop & Utility Buttons */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onOpenEvolution}
              className="px-3 py-1 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-gaming text-xs font-bold rounded-lg border border-emerald-400/60 shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mutaciones ADN</span>
            </button>

            <button
              onClick={onTogglePause}
              className="p-1.5 bg-black/60 hover:bg-zinc-800 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors"
              title="Pausar (ESC/P)"
            >
              {engine.state === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 bg-black/60 hover:bg-zinc-800 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors"
              title="Ajustes y Guía"
            >
              <Pause className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsMuted(!isMuted);
              }}
              className="p-1.5 bg-black/60 hover:bg-zinc-800 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors"
              title="Silenciar / Activar Sonido"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nest (Ooteca) Status & Radar */}
        <div className="flex items-start gap-3 pointer-events-auto">
          <div className={`flex flex-col gap-1.5 w-60 sm:w-72 bg-black/60 backdrop-blur-md p-3 rounded-2xl border ${nestStats.isUnderAttack ? 'border-red-500 shadow-red-950/60 animate-pulse' : 'border-amber-500/30 shadow-amber-950/30'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${nestStats.isUnderAttack ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`}></span>
                <span className="font-gaming text-xs sm:text-sm font-black text-amber-400 tracking-wider">
                  EL NIDO (OOTECA)
                </span>
              </div>
              {nestStats.isUnderAttack && (
                <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-950/90 px-1.5 py-0.5 rounded border border-red-500 animate-bounce">
                  <AlertTriangle className="w-3 h-3" /> ¡PELIGRO!
                </span>
              )}
            </div>

            {/* Nest Health Bar */}
            <div className="relative w-full h-3.5 sm:h-4 bg-zinc-900/90 rounded-lg overflow-hidden border border-amber-500/40">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 transition-all duration-150"
                style={{ width: `${nestHpPct}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] sm:text-[10px] font-bold text-white drop-shadow">
                <span>Vitalidad</span>
                <span>{Math.round(nestStats.health)} / {nestStats.maxHealth}</span>
              </div>
            </div>

            {/* Nest Shield Bar */}
            <div className="relative w-full h-2.5 bg-zinc-950 rounded-md overflow-hidden border border-sky-500/40">
              <div 
                className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-150"
                style={{ width: `${nestShieldPct}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-1.5 text-[8px] font-bold text-sky-200">
                <div className="flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5 text-sky-400" />
                  <span>Escudo</span>
                </div>
                <span>{Math.round(nestStats.shield)} / {nestStats.maxShield}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
              <span>Plantas Centinela: <strong className="text-emerald-400">{nestStats.sentryCount}</strong></span>
              <span>Puntaje: <strong className="text-white">{playerStats.score}</strong></span>
            </div>
          </div>

          {/* Tactical Minimap */}
          <div className="hidden md:block">
            <Minimap engine={engine} />
          </div>
        </div>
      </div>

      {/* 2. FLOATING DAMAGE NUMBERS OVERLAY */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {engine.combatSystem.damageNumbers.map((dmg) => {
          if (dmg.screenPos.x < -100 || dmg.screenPos.y < -100) return null;
          const alpha = dmg.life / dmg.maxLife;
          return (
            <div
              key={dmg.id}
              className={`absolute font-black font-gaming transform -translate-x-1/2 -translate-y-1/2 transition-opacity ${
                dmg.isCrit ? 'text-lg text-amber-300 scale-125 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]' : 'text-sm text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]'
              }`}
              style={{
                left: `${dmg.screenPos.x}px`,
                top: `${dmg.screenPos.y}px`,
                opacity: alpha,
                color: dmg.color
              }}
            >
              {dmg.text}
            </div>
          );
        })}
      </div>

      {/* 3. BOTTOM ACTION BAR & ABILITIES */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        <div className="flex items-center justify-center gap-2 sm:gap-3 bg-black/80 backdrop-blur-lg p-2.5 sm:p-3 rounded-2xl border border-emerald-500/40 shadow-2xl shadow-emerald-950/60 max-w-full overflow-x-auto">
          
          {/* 1. Melee Slash (LMB) */}
          <AbilitySlot
            icon={<Sword className="w-5 h-5 text-emerald-400" />}
            keybind="LMB"
            title="Garras de Quitina"
            cooldownRatio={getCdRatio(cooldowns.melee, 1 / playerStats.attackSpeed)}
            onClick={() => engine.triggerMeleeSlash()}
            badge="Melee"
          />

          {/* 2. Acid Spit (RMB) */}
          <AbilitySlot
            icon={<Crosshair className="w-5 h-5 text-lime-400" />}
            keybind="RMB"
            title="Bilis Bio-Ácida"
            cooldownRatio={getCdRatio(cooldowns.acid, playerStats.acidCooldown)}
            onClick={() => engine.triggerAcidSpit()}
            badge="Rango AoE"
          />

          {/* 3. Dash (SPACE) */}
          <AbilitySlot
            icon={<Wind className="w-5 h-5 text-cyan-400" />}
            keybind="SPACE"
            title="Impulso Alar"
            cooldownRatio={getCdRatio(cooldowns.dash, playerStats.dashCooldown)}
            onClick={() => engine.triggerDash()}
            badge="Esquiva"
          />

          {/* 4. Leap Slam [Q] */}
          <AbilitySlot
            icon={<Zap className="w-5 h-5 text-emerald-300" />}
            keybind="Q"
            title="Salto Depredador"
            cooldownRatio={getCdRatio(cooldowns.leap, playerStats.leapCooldown)}
            cooldownSecs={cooldowns.leap}
            onClick={() => engine.triggerLeap()}
            badge="Aturdir"
          />

          {/* 5. Alpha Frenzy [E] */}
          <AbilitySlot
            icon={<Flame className="w-5 h-5 text-fuchsia-400" />}
            keybind="E"
            title="Depredador Alfa"
            cooldownRatio={getCdRatio(cooldowns.frenzy, playerStats.frenzyCooldown)}
            cooldownSecs={cooldowns.frenzy}
            onClick={() => engine.triggerFrenzy()}
            badge="Furia + Camu"
            isActive={activeBuffs.frenzy > 0}
          />

          {/* 6. Sonic Screech [F] */}
          <AbilitySlot
            icon={<Volume2 className="w-5 h-5 text-sky-400" />}
            keybind="F"
            title="Chirrido Sónico"
            cooldownRatio={getCdRatio(cooldowns.screech, playerStats.screechCooldown)}
            cooldownSecs={cooldowns.screech}
            onClick={() => engine.triggerScreech()}
            badge="Pánico Masivo"
          />

          {/* 7. Nest Pulse [R] */}
          <AbilitySlot
            icon={<Shield className="w-5 h-5 text-amber-400" />}
            keybind="R"
            title="Pulso del Nido"
            cooldownRatio={getCdRatio(cooldowns.nestPulse, playerStats.nestPulseCooldown)}
            cooldownSecs={cooldowns.nestPulse}
            onClick={() => engine.triggerNestPulse()}
            badge="Repulsión"
            disabled={nestStats.shield <= 0}
          />
        </div>

        {/* Controls Hint & FPS */}
        <div className="flex items-center justify-between w-full max-w-2xl px-2 text-[11px] text-zinc-400">
          <div>
            Controles: <strong className="text-zinc-200">WASD</strong> Moverse | <strong className="text-zinc-200">Mouse</strong> Apuntar | <strong className="text-zinc-200">Clic Izq</strong> Cortar | <strong className="text-zinc-200">Clic Der</strong> Escupir
          </div>
          <div className="flex items-center gap-3">
            <span>FPS: <strong className="text-emerald-400 font-bold">{fps}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AbilitySlotProps {
  icon: React.ReactNode;
  keybind: string;
  title: string;
  cooldownRatio: number;
  cooldownSecs?: number;
  badge?: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const AbilitySlot: React.FC<AbilitySlotProps> = ({
  icon,
  keybind,
  title,
  cooldownRatio,
  cooldownSecs,
  badge,
  onClick,
  isActive,
  disabled
}) => {
  const isReady = cooldownRatio <= 0 && !disabled;

  return (
    <button
      onClick={onClick}
      disabled={!isReady}
      title={title}
      className={`relative group flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-xl border transition-all cursor-pointer select-none ${
        isActive 
          ? 'bg-fuchsia-950/80 border-fuchsia-400 shadow-lg shadow-fuchsia-500/40 animate-pulse'
          : (isReady 
              ? 'bg-zinc-900/90 border-emerald-500/40 hover:border-emerald-400 hover:scale-105 active:scale-95 shadow-md shadow-emerald-950/40' 
              : 'bg-zinc-950/90 border-zinc-800 opacity-60')
      }`}
    >
      {/* Radial Cooldown Overlay */}
      {cooldownRatio > 0 && (
        <div 
          className="absolute inset-0 bg-black/70 rounded-xl overflow-hidden pointer-events-none flex items-center justify-center text-xs font-bold text-white font-gaming"
        >
          <div 
            className="absolute bottom-0 inset-x-0 bg-emerald-600/30"
            style={{ height: `${cooldownRatio * 100}%` }}
          />
          <span className="relative z-10">{cooldownSecs ? cooldownSecs.toFixed(1) : ''}</span>
        </div>
      )}

      {/* Keybind Tag */}
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-zinc-800 border border-zinc-600 rounded text-[9px] font-bold text-zinc-300 font-gaming shadow">
        {keybind}
      </span>

      <div className="mt-1">
        {icon}
      </div>

      {badge && (
        <span className="text-[8px] font-bold text-zinc-400 scale-90 truncate max-w-[48px] mt-0.5">
          {badge}
        </span>
      )}
    </button>
  );
};
