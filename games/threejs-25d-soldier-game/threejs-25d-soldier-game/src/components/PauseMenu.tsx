import React from 'react';
import { Play, RotateCcw, Home, Volume2, Music, Crosshair } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface PauseMenuProps {
  soundVolume: number;
  musicVolume: number;
  onSetSoundVolume: (v: number) => void;
  onSetMusicVolume: (v: number) => void;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  soundVolume,
  musicVolume,
  onSetSoundVolume,
  onSetMusicVolume,
  onResume,
  onRestart,
  onQuit,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-rajdhani">
      <div className="cyber-panel w-full max-w-lg p-6 border-sky-400/50 shadow-2xl space-y-6">
        
        {/* Title */}
        <div className="text-center border-b border-sky-500/30 pb-4">
          <span className="text-xs font-orbitron text-sky-400 font-bold tracking-widest uppercase">
            MISIÓN EN PAUSA
          </span>
          <h2 className="text-3xl font-orbitron font-black text-white glow-cyan">
            SISTEMA TÁCTICO
          </h2>
        </div>

        {/* Audio Controls */}
        <div className="space-y-4 bg-slate-950/70 p-4 rounded border border-slate-800">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-orbitron text-slate-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-400" /> Efectos de Sonido
              </span>
              <span>{Math.round(soundVolume * 100)}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onSetSoundVolume(val);
                soundManager.setSoundVolume(val);
              }}
              className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-orbitron text-slate-300">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-purple-400" /> Música Synthwave
              </span>
              <span>{Math.round(musicVolume * 100)}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onSetMusicVolume(val);
                soundManager.setMusicVolume(val);
              }}
              className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Controls Quick Guide */}
        <div className="bg-slate-950/70 p-4 rounded border border-slate-800 text-xs">
          <h3 className="font-orbitron font-bold text-sky-400 mb-2.5 flex items-center gap-1.5">
            <Crosshair className="w-4 h-4" /> GUÍA DE CONTROLES
          </h3>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-slate-800 rounded text-sky-300 font-mono">A / D</span> Moverse</div>
            <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-slate-800 rounded text-sky-300 font-mono">W / ESPACIO</span> Saltar / Jetpack</div>
            <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-slate-800 rounded text-sky-300 font-mono">CLIC IZQ</span> Disparar</div>
            <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-slate-800 rounded text-sky-300 font-mono">F / SHIFT</span> Rodar / Esquiva</div>
            <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-slate-800 rounded text-sky-300 font-mono">V / CLIC DER</span> Cuchillo Melee</div>
            <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-slate-800 rounded text-sky-300 font-mono">G</span> Granada Especial</div>
            <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-slate-800 rounded text-sky-300 font-mono">1 - 8 / RUEDA</span> Cambiar Arma</div>
            <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-slate-800 rounded text-sky-300 font-mono">R</span> Recargar Arma</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              soundManager.playUIClick();
              onResume();
            }}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-black font-orbitron font-bold text-sm rounded shadow-lg flex items-center justify-center gap-2 cyber-button"
          >
            <Play className="w-5 h-5 fill-black" />
            REANUDAR COMBATE
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick();
              onRestart();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-orbitron font-bold text-xs rounded border border-slate-600 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            REINICIAR MISIÓN
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick();
              onQuit();
            }}
            className="w-full py-2.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-orbitron font-bold text-xs rounded border border-rose-800 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            SALIR AL MENÚ PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};
