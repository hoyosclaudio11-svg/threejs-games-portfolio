import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  RotateCcw, 
  Coins, 
  Swords, 
  ShieldAlert, 
  Sparkles,
  Flame
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface GameOverModalProps {
  isVictory: boolean;
  stats: {
    wavesCompleted: number;
    totalKills: number;
    totalDamage: number;
    gold: number;
  };
  onRestart: () => void;
  onStartEndless?: () => void;
  lang: 'es' | 'en';
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  stats,
  onRestart,
  onStartEndless,
  lang
}) => {
  const isEs = lang === 'es';

  useEffect(() => {
    if (isVictory) {
      soundManager.playVictoryFanfare();
      // Confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      const interval = setInterval(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 select-none animate-fadeIn font-sans">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl w-full max-w-lg p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        
        {/* Decorative ambient light */}
        <div className={`absolute -top-24 w-60 h-60 rounded-full blur-3xl opacity-30 ${isVictory ? 'bg-amber-400' : 'bg-rose-600'}`} />

        {/* Icon */}
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl mb-4 border-2 ${
          isVictory 
            ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-slate-950' 
            : 'bg-gradient-to-br from-rose-600 to-rose-900 border-rose-400 text-white'
        }`}>
          {isVictory ? <Trophy className="w-10 h-10 animate-bounce" /> : <ShieldAlert className="w-10 h-10 animate-pulse" />}
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black text-white tracking-wide mb-1">
          {isVictory 
            ? (isEs ? '¡VICTORIA LEGENDARIA!' : 'LEGENDARY VICTORY!') 
            : (isEs ? 'LA ALDEA HA CAÍDO' : 'THE VILLAGE HAS FALLEN')}
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-5">
          {isVictory
            ? (isEs ? '¡Has derrotado a todas las oleadas del Señor Oscuro y protegido a los aldeanos para siempre!' : 'You have conquered all waves, defeated the Dark Overlord, and saved the village!')
            : (isEs ? 'Las hordas de monstruos rompieron tus defensas. ¡Reorganiza tu ejército y vuelve a intentarlo!' : 'The monster hordes overwhelmed your defenses. Rally your army and try again!')}
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">{isEs ? 'Oleadas Completadas' : 'Waves Cleared'}</div>
              <div className="text-sm font-black text-white">{stats.wavesCompleted} / 7</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">{isEs ? 'Monstruos Eliminados' : 'Monsters Slain'}</div>
              <div className="text-sm font-black text-white">{stats.totalKills}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">{isEs ? 'Daño Total Infligido' : 'Total Damage'}</div>
              <div className="text-sm font-black text-white">{stats.totalDamage.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">{isEs ? 'Oro Acumulado' : 'Total Gold'}</div>
              <div className="text-sm font-black text-white">{stats.gold}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 border border-amber-300 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isEs ? 'Jugar de Nuevo' : 'Play Again'}</span>
          </button>

          {isVictory && onStartEndless && (
            <button
              onClick={onStartEndless}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 border border-purple-400 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isEs ? 'Supervivencia Infinita' : 'Endless Survival'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
