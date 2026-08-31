import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Smartphone, Settings } from 'lucide-react';
import { GameSettings } from '../types/game';

interface PauseModalProps {
  isOpen: boolean;
  settings: GameSettings;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExitToMenu: () => void;
  onToggleMute: () => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  settings,
  isMuted,
  onResume,
  onRestart,
  onExitToMenu,
  onToggleMute,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl shadow-black/80 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-2xl font-chakra font-black tracking-wide text-white uppercase">
              CARRERA EN PAUSA
            </h2>
          </div>
          <span className="text-xs font-mono-data text-slate-400">[ESC / P]</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-chakra font-black text-lg tracking-wider uppercase flex items-center justify-center gap-3 transition active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>CONTINUAR</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-amber-400 font-chakra font-bold text-base tracking-wider uppercase flex items-center justify-center gap-3 transition active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
            <span>REINICIAR ETAPA (R)</span>
          </button>

          <button
            onClick={onExitToMenu}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-300 font-chakra font-bold text-base tracking-wider uppercase flex items-center justify-center gap-3 transition active:scale-95"
          >
            <Home className="w-5 h-5" />
            <span>VOLVER AL MENÚ / GARAJE</span>
          </button>
        </div>

        {/* In-Game Quick Settings */}
        <div className="pt-3 border-t border-white/10 flex flex-col gap-3 text-xs font-mono-data">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              SONIDO GLOBAL:
            </span>
            <button
              onClick={onToggleMute}
              className="px-3 py-1 rounded-lg bg-slate-800 border border-white/10 text-white flex items-center gap-2"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-red-400" /> Silenciado
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Activo
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              VIBRACIÓN / HÁPTICA:
            </span>
            <button
              onClick={() => onUpdateSettings({ haptics: !settings.haptics })}
              className={`px-3 py-1 rounded-lg border text-xs font-bold ${
                settings.haptics
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-800 border-white/10 text-slate-400'
              }`}
            >
              {settings.haptics ? 'ACTIVADA' : 'DESACTIVADA'}
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>SENSIBILIDAD DIRECCIÓN:</span>
              <span className="text-white font-bold">{Math.round(settings.steeringSensitivity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.steeringSensitivity}
              onChange={(e) => onUpdateSettings({ steeringSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
