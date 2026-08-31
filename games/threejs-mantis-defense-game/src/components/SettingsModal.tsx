import React, { useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { soundManager } from '../audio/SoundManager';
import { Play, RotateCcw, Volume2, Monitor, X, Sliders } from 'lucide-react';

interface SettingsModalProps {
  engine: GameEngine;
  onResume: () => void;
  onRestart: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ engine, onResume, onRestart }) => {
  const [sfxVol, setSfxVol] = useState(70);
  const [musicVol, setMusicVol] = useState(50);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setSfxVol(v);
    soundManager.setSfxVolume(v / 100);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setMusicVol(v);
    soundManager.setMusicVolume(v / 100);
  };

  const handleQualityChange = (newQuality: 'low' | 'medium' | 'high' | 'ultra') => {
    setQuality(newQuality);
    if (!engine.renderer) return;

    if (newQuality === 'low') {
      engine.renderer.setPixelRatio(1);
      engine.renderer.shadowMap.enabled = false;
    } else if (newQuality === 'medium') {
      engine.renderer.setPixelRatio(1);
      engine.renderer.shadowMap.enabled = true;
    } else if (newQuality === 'high') {
      engine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      engine.renderer.shadowMap.enabled = true;
    } else {
      engine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      engine.renderer.shadowMap.enabled = true;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950/95 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/80 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-gaming font-black text-white">JUEGO EN PAUSA</h2>
          </div>
          <button
            onClick={onResume}
            className="p-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Volume Controls */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Efectos de Sonido (SFX)</span>
            </div>
            <span className="font-gaming text-emerald-400">{sfxVol}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxVol}
            onChange={handleSfxChange}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
          />

          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mt-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Música y Atmósfera Dinámica</span>
            </div>
            <span className="font-gaming text-cyan-400">{musicVol}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={musicVol}
            onChange={handleMusicChange}
            className="w-full accent-cyan-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
          />
        </div>

        {/* Graphics Presets */}
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Calidad Gráfica y Rendimiento</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
              <button
                key={q}
                onClick={() => handleQualityChange(q)}
                className={`py-2 rounded-xl text-xs font-gaming font-bold capitalize transition-all cursor-pointer ${
                  quality === q
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60 border border-emerald-400'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {q === 'low' ? 'Bajo' : (q === 'medium' ? 'Medio' : (q === 'high' ? 'Alto' : 'Ultra'))}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-zinc-800">
          <button
            onClick={onResume}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-gaming text-sm font-black rounded-2xl border border-emerald-400/60 shadow-xl cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Reanudar Cacería</span>
          </button>

          <button
            onClick={onRestart}
            className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-red-300 font-gaming text-xs font-bold rounded-2xl border border-zinc-800 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar Partida</span>
          </button>
        </div>
      </div>
    </div>
  );
};
