import React from 'react';
import { GameEngine } from '../game/GameEngine';
import { Skull, RotateCcw, Award, Clock, Flame, Bug } from 'lucide-react';

interface GameOverModalProps {
  engine: GameEngine;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ engine, onRestart }) => {
  const { summary } = engine;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-red-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/80 text-center flex flex-col items-center">
        
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500 flex items-center justify-center mb-4 animate-bounce">
          <Skull className="w-8 h-8 text-red-400" />
        </div>

        <div className="text-xs font-gaming font-bold text-red-500 uppercase tracking-widest">
          DEFENSA FALLIDA
        </div>
        <h2 className="text-2xl sm:text-3xl font-gaming font-black text-white mt-1">
          EL NIDO HA CAÍDO
        </h2>
        <p className="text-sm text-zinc-400 mt-1 max-w-md">
          {summary.reason || 'La mantis o la ooteca han sucumbido ante el enjambre invasor.'}
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 my-6 text-left">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Oleadas Superadas</div>
              <div className="text-base font-black font-gaming text-white">{summary.wavesCleared}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
            <Bug className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Insectos Exterminados</div>
              <div className="text-base font-black font-gaming text-white">{summary.enemiesKilled}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
            <Flame className="w-5 h-5 text-fuchsia-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Daño Infligido</div>
              <div className="text-base font-black font-gaming text-white">{Math.round(summary.totalDamageDealt)}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Tiempo Sobrevivido</div>
              <div className="text-base font-black font-gaming text-white">{formatTime(summary.timeSurvived)}</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-gaming text-sm font-black rounded-2xl border border-red-400/60 shadow-xl shadow-red-950/80 cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reintentar Defensa del Nido</span>
        </button>
      </div>
    </div>
  );
};
