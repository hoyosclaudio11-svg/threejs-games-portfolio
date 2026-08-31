import React from 'react';
import { Award, X, CheckCircle2, Lock, Coins } from 'lucide-react';
import { GAME_ACHIEVEMENTS } from '../game/constants';
import { soundManager } from '../audio/SoundManager';

interface AchievementsModalProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-rajdhani">
      <div className="cyber-panel w-full max-w-2xl max-h-[85vh] flex flex-col border-sky-400/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-500/30 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-2xl font-orbitron font-black text-white glow-amber">
                LOGROS Y MEDALLAS DE HONOR
              </h2>
              <p className="text-xs text-slate-400">Recompensas desbloqueables por hazañas en el campo de batalla.</p>
            </div>
          </div>

          <button 
            onClick={() => {
              soundManager.playUIClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* List of achievements */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {GAME_ACHIEVEMENTS.map((ach) => {
            return (
              <div 
                key={ach.id}
                className="cyber-panel p-4 flex items-center justify-between border-slate-800 bg-slate-950/60"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-yellow-400">
                    <Award className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="font-orbitron font-bold text-sm text-white">{ach.title}</h4>
                    <p className="text-xs text-slate-400">{ach.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-sky-500 to-emerald-400"
                          style={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {ach.progress} / {ach.maxProgress}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-xs font-orbitron font-bold text-yellow-400 mb-1">
                    <Coins className="w-3.5 h-3.5" />
                    +{ach.rewardCredits} CR
                  </div>
                  {ach.unlocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-orbitron font-bold rounded border border-emerald-500/40">
                      <CheckCircle2 className="w-3 h-3" /> COMPLETADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-orbitron font-semibold rounded">
                      <Lock className="w-3 h-3" /> EN PROGRESO
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
