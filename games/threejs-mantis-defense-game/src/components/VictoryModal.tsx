import React from 'react';
import { GameEngine } from '../game/GameEngine';
import { Trophy, ArrowRight, RotateCcw, Award, Bug, Clock, Sparkles } from 'lucide-react';

interface VictoryModalProps {
  engine: GameEngine;
  onContinueEndless: () => void;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ engine, onContinueEndless, onRestart }) => {
  const { summary } = engine;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/90 text-center flex flex-col items-center">
        
        {/* Trophy Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/40 animate-pulse">
          <Trophy className="w-8 h-8 text-yellow-400" />
        </div>

        <div className="text-xs font-gaming font-bold text-emerald-400 uppercase tracking-widest">
          ¡VICTORIA ABSOLUTA!
        </div>
        <h2 className="text-2xl sm:text-3xl font-gaming font-black text-white mt-1">
          EL NIDO HA SIDO SALVADO
        </h2>
        <p className="text-sm text-zinc-300 mt-1 max-w-md">
          Has derrotado al Escarabajo Ciervo Goliat y erradicado las 10 oleadas de la gran invasión estacional. Las crías nacerán a salvo.
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 my-6 text-left">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-emerald-500/30 flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Oleadas Superadas</div>
              <div className="text-base font-black font-gaming text-white">{summary.wavesCleared}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-emerald-500/30 flex items-center gap-3">
            <Bug className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Bajas Enemigas</div>
              <div className="text-base font-black font-gaming text-white">{summary.enemiesKilled}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-emerald-500/30 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Biomasa Acumulada</div>
              <div className="text-base font-black font-gaming text-white">{summary.biomassCollected}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-emerald-500/30 flex items-center gap-3">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Tiempo Total</div>
              <div className="text-base font-black font-gaming text-white">{formatTime(summary.timeSurvived)}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={onContinueEndless}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-gaming text-xs sm:text-sm font-black rounded-2xl border border-emerald-400/60 shadow-xl shadow-emerald-950/80 cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <span>Modo Infinito (Oleada 11+)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRestart}
            className="py-3.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-gaming text-xs sm:text-sm font-bold rounded-2xl border border-zinc-700 cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Nueva Partida</span>
          </button>
        </div>
      </div>
    </div>
  );
};
