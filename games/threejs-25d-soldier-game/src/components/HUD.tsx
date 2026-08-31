import React, { useState } from 'react';
import { 
  Heart, 
  Shield, 
  Flame, 
  Crosshair, 
  RotateCcw, 
  Pause, 
  Volume2, 
  VolumeX, 
  Zap, 
  Sparkles, 
  Skull,
  Coins
} from 'lucide-react';
import { SoldierRuntimeStats, WeaponStats, WeaponType } from '../types/game';
import { MonsterInstance } from '../game/models/MonsterModels';

interface HUDProps {
  stats: SoldierRuntimeStats;
  currentWeapon: WeaponStats;
  arsenal: Record<string, WeaponStats>;
  waveNumber: number;
  biomeName: string;
  monstersKilled: number;
  totalMonsters: number;
  score: number;
  credits: number;
  combo: number;
  boss: MonsterInstance | null;
  activePowerups: Map<string, number>;
  onSwitchWeapon: (id: WeaponType) => void;
  onReload: () => void;
  onSpecial: () => void;
  onDash: () => void;
  onMelee: () => void;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onMobileMove: (vx: number, jump: boolean) => void;
  onMobileFire: (aimX: number, aimY: number, fire: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  currentWeapon,
  arsenal,
  waveNumber,
  biomeName,
  monstersKilled,
  totalMonsters,
  score,
  credits,
  combo,
  boss,
  activePowerups,
  onSwitchWeapon,
  onReload,
  onSpecial,
  onDash,
  onMelee,
  onPause,
  isMuted,
  onToggleMute,
  onMobileMove,
  onMobileFire,
}) => {
  const [touchAiming, setTouchAiming] = useState(false);

  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (stats.shield / stats.maxShield) * 100));
  const jetpackPercent = Math.max(0, Math.min(100, (stats.jetpackFuel / stats.jetpackMaxFuel) * 100));
  const waveProgress = Math.min(100, (monstersKilled / totalMonsters) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none overflow-hidden font-rajdhani">
      {/* --- TOP BAR: Stats, Wave Tracker, Score & Pause --- */}
      <div className="flex items-start justify-between w-full">
        {/* Soldier Status Gauges */}
        <div className="cyber-panel p-3 min-w-[280px] max-w-[340px] pointer-events-auto shadow-lg">
          {/* Health Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs font-orbitron text-red-400 mb-1">
              <span className="flex items-center gap-1 font-bold">
                <Heart className="w-4 h-4 text-red-500 fill-red-500/30" /> SALUD (HP)
              </span>
              <span>{Math.ceil(stats.hp)} / {stats.maxHp}</span>
            </div>
            <div className="h-3.5 bg-slate-900/90 rounded-sm overflow-hidden p-0.5 border border-red-500/30">
              <div 
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-xs transition-all duration-150"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Shield Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs font-orbitron text-cyan-400 mb-1">
              <span className="flex items-center gap-1 font-bold">
                <Shield className="w-4 h-4 text-cyan-400 fill-cyan-400/30" /> ESCUDO NANO
              </span>
              <span>{Math.ceil(stats.shield)} / {stats.maxShield}</span>
            </div>
            <div className="h-2.5 bg-slate-900/90 rounded-sm overflow-hidden p-0.5 border border-cyan-500/30">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-xs transition-all duration-150"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>

          {/* Jetpack Fuel Gauge */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-orbitron text-amber-400 mb-0.5">
              <span className="flex items-center gap-1 font-semibold">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" /> JETPACK
              </span>
              <span>{Math.round(jetpackPercent)}%</span>
            </div>
            <div className="h-2 bg-slate-900/90 rounded-sm overflow-hidden p-0.5 border border-amber-500/30">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-xs transition-all duration-100"
                style={{ width: `${jetpackPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Wave Biome Title & Progress */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div className="cyber-panel px-5 py-2 text-center border-sky-400/40">
            <div className="flex items-center justify-center gap-2">
              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-xs font-orbitron font-bold rounded border border-sky-400/40">
                OLA {waveNumber} / 8
              </span>
              <h2 className="font-orbitron font-black text-sm md:text-base text-white glow-cyan tracking-wider">
                {biomeName}
              </h2>
            </div>
            
            {/* Wave Progress Bar */}
            <div className="w-48 md:w-64 mt-1.5 flex flex-col items-center">
              <div className="h-2 w-full bg-slate-900/90 rounded-full overflow-hidden border border-sky-500/40">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${waveProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Eliminados: {monstersKilled} / {totalMonsters}
              </span>
            </div>
          </div>

          {/* Boss Bar (if Boss Active) */}
          {boss && !boss.isDead && (
            <div className="cyber-panel-danger px-6 py-2 mt-2 text-center animate-pulse border-red-500/80 w-72 md:w-96 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-orbitron font-bold text-red-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Skull className="w-4 h-4 text-red-500" /> {boss.type.replace('boss_', '').toUpperCase()}
                </span>
                <span>{Math.ceil(boss.hp)} / {boss.maxHp}</span>
              </div>
              <div className="h-3 w-full bg-black/80 rounded overflow-hidden border border-red-600">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-yellow-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Score, Credits, Audio & Pause */}
        <div className="flex items-start gap-2 pointer-events-auto">
          <div className="cyber-panel px-4 py-2 text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs text-amber-400 font-orbitron font-semibold">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>{credits.toLocaleString()} CR</span>
            </div>
            <div className="text-sm md:text-base font-orbitron font-bold text-white tracking-wide">
              {score.toLocaleString()} PTS
            </div>
          </div>

          <button 
            onClick={onToggleMute}
            className="p-2.5 cyber-panel hover:bg-slate-800 text-sky-400 hover:text-white transition-colors"
            title="Silenciar / Activar Sonido"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button 
            onClick={onPause}
            className="p-2.5 cyber-panel hover:bg-slate-800 text-sky-400 hover:text-white transition-colors"
            title="Pausar Juego"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- MIDDLE: Combo Counter & Powerup Badges --- */}
      <div className="flex justify-between items-center w-full px-4">
        {/* Active Powerups */}
        <div className="flex flex-col gap-2">
          {Array.from(activePowerups.entries()).map(([pType, dur]) => (
            <div key={pType} className="cyber-panel px-3 py-1.5 flex items-center gap-2 text-xs font-orbitron border-amber-400/60 animate-pulse">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-amber-300 uppercase font-bold">{pType.replace('_', ' ')}</span>
              <span className="text-white bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">{Math.ceil(dur)}s</span>
            </div>
          ))}
        </div>

        {/* Combo Multiplier */}
        {combo > 1 && (
          <div className="cyber-panel-gold px-4 py-2 animate-bounce text-center">
            <div className="text-2xl md:text-3xl font-orbitron font-black text-amber-400 glow-amber">
              {combo}x COMBO!
            </div>
            <span className="text-xs text-amber-200 font-semibold tracking-wider">
              {combo >= 10 ? '🔥 DIOS DE LA GUERRA 🔥' : combo >= 5 ? '⚡ MASACRE ⚡' : 'MULTIPLICADOR'}
            </span>
          </div>
        )}
      </div>

      {/* --- BOTTOM BAR: Weapon Arsenal & Ammo & Controls --- */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full gap-2">
        {/* Quick Weapon Slots (1-8) */}
        <div className="flex items-center gap-1.5 cyber-panel p-2 pointer-events-auto overflow-x-auto max-w-full">
          {Object.values(arsenal).map((weapon, idx) => {
            const isActive = weapon.id === currentWeapon.id;
            return (
              <button
                key={weapon.id}
                onClick={() => weapon.unlocked && onSwitchWeapon(weapon.id)}
                disabled={!weapon.unlocked}
                className={`relative px-2.5 py-1.5 rounded text-xs font-orbitron transition-all flex flex-col items-center ${
                  isActive 
                    ? 'bg-sky-500/30 border border-sky-400 text-white shadow-md' 
                    : weapon.unlocked 
                      ? 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:border-sky-500/50' 
                      : 'bg-slate-950/60 border border-slate-900 text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              >
                <span className="text-[10px] text-sky-400 font-mono">[{idx + 1}]</span>
                <span className="font-semibold truncate max-w-[80px]">{weapon.name.split(' ')[0]}</span>
                {weapon.unlocked && (
                  <span className="text-[9px] text-slate-400">{weapon.currentAmmo}/{weapon.reserveAmmo}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Weapon Ammo & Special Ability Trigger */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Dash / Dodge Button */}
          <button 
            onClick={onDash}
            className="cyber-panel px-3 py-2 text-xs font-orbitron text-sky-300 hover:bg-sky-500/20 flex flex-col items-center"
            title="Rodar / Esquivar [F / Shift]"
          >
            <Zap className="w-5 h-5 text-sky-400" />
            <span>ROLL [F]</span>
          </button>

          {/* Melee Slash */}
          <button 
            onClick={onMelee}
            className="cyber-panel px-3 py-2 text-xs font-orbitron text-emerald-300 hover:bg-emerald-500/20 flex flex-col items-center"
            title="Ataque Cuerpo a Cuerpo [V / Clic Derecho]"
          >
            <Crosshair className="w-5 h-5 text-emerald-400" />
            <span>MELEE [V]</span>
          </button>

          {/* Special Grenade */}
          <button 
            onClick={onSpecial}
            disabled={stats.specialAbilityCharges <= 0}
            className={`cyber-panel px-3 py-2 text-xs font-orbitron flex flex-col items-center ${
              stats.specialAbilityCharges > 0 ? 'text-amber-300 hover:bg-amber-500/20' : 'text-slate-600 opacity-50'
            }`}
            title="Lanzar Granada [G]"
          >
            <Flame className="w-5 h-5 text-amber-400" />
            <span>GRANADA ({stats.specialAbilityCharges})</span>
          </button>

          {/* Active Ammo Counter & Reload */}
          <div className="cyber-panel px-4 py-2 flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] font-orbitron text-sky-400 font-bold uppercase tracking-wider">
                {currentWeapon.name}
              </div>
              <div className="text-2xl md:text-3xl font-orbitron font-black text-white">
                {currentWeapon.currentAmmo}
                <span className="text-sm font-normal text-slate-400"> / {currentWeapon.reserveAmmo}</span>
              </div>
            </div>
            <button 
              onClick={onReload}
              className="p-2 bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 rounded border border-sky-400/40 transition-colors"
              title="Recargar Arma [R]"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE TOUCH CONTROLS (Only displays on touch/small viewports) --- */}
      <div className="md:hidden flex justify-between items-end w-full pointer-events-auto pb-4 px-2">
        {/* Left D-pad Movement */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-sky-500/30 backdrop-blur-sm">
          <button 
            onTouchStart={() => onMobileMove(-1, false)}
            onTouchEnd={() => onMobileMove(0, false)}
            className="w-12 h-12 bg-slate-800 text-white rounded-xl active:bg-sky-600 font-bold text-xl flex items-center justify-center"
          >
            ◀
          </button>
          <button 
            onTouchStart={() => onMobileMove(0, true)}
            onTouchEnd={() => onMobileMove(0, false)}
            className="w-12 h-12 bg-sky-600 text-white rounded-xl active:bg-sky-400 font-bold text-sm flex items-center justify-center"
          >
            JUMP
          </button>
          <button 
            onTouchStart={() => onMobileMove(1, false)}
            onTouchEnd={() => onMobileMove(0, false)}
            className="w-12 h-12 bg-slate-800 text-white rounded-xl active:bg-sky-600 font-bold text-xl flex items-center justify-center"
          >
            ▶
          </button>
        </div>

        {/* Right Fire & Action Buttons */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <button 
              onClick={onDash}
              className="w-10 h-10 bg-cyan-600/80 active:bg-cyan-400 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-lg"
            >
              ROLL
            </button>
            <button 
              onClick={onMelee}
              className="w-10 h-10 bg-emerald-600/80 active:bg-emerald-400 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-lg"
            >
              KNIFE
            </button>
          </div>

          <button 
            onTouchStart={() => {
              setTouchAiming(true);
              onMobileFire(1, 0, true);
            }}
            onTouchEnd={() => {
              setTouchAiming(false);
              onMobileFire(0, 0, false);
            }}
            className={`w-16 h-16 rounded-full text-white font-orbitron font-black text-sm flex items-center justify-center shadow-2xl transition-all ${
              touchAiming ? 'bg-red-500 scale-95' : 'bg-red-600 border-2 border-red-300'
            }`}
          >
            FIRE
          </button>
        </div>
      </div>
    </div>
  );
};
