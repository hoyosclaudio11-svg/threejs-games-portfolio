import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, HelpCircle, X } from 'lucide-react';
import { audioManager } from '../services/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onOpenHandbook: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  onOpenHandbook,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border-2 border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
          <h2 className="text-xl font-black text-white tracking-wide">OPERACIÓN EN PAUSA</h2>
          <button
            onClick={onResume}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buttons Stack */}
        <div className="space-y-2.5">
          {/* Resume */}
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onResume();
            }}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>REANUDAR INCURSIÓN (ESC)</span>
          </button>

          {/* Instant Restart */}
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onRestart();
            }}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>REINICIAR MISIÓN [R]</span>
          </button>

          {/* Handbook */}
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onOpenHandbook();
            }}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>MANUAL TÁCTICO & CONTROLES</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleMute();
            }}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'ACTIVAR SONIDO' : 'SILENCIAR SONIDO'}</span>
          </button>

          {/* Quit to Base */}
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onMainMenu();
            }}
            className="w-full py-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>ABANDONAR AL MENÚ PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
