import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Globe, 
  Keyboard, 
  X, 
  HelpCircle
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface SettingsModalProps {
  onClose: () => void;
  lang: 'es' | 'en';
  setLang: (lang: 'es' | 'en') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  musicVol: number;
  setMusicVol: (vol: number) => void;
  sfxVol: number;
  setSfxVol: (vol: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  lang,
  setLang,
  isMuted,
  setIsMuted,
  musicVol,
  setMusicVol,
  sfxVol,
  setSfxVol
}) => {
  const isEs = lang === 'es';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">{isEs ? 'Ajustes y Controles' : 'Settings & Controls'}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          
          {/* Audio Controls */}
          <div className="space-y-3 bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{isEs ? 'Sonido y Música' : 'Audio & Music'}</span>
              </div>
              <button
                onClick={() => {
                  const nextMute = !isMuted;
                  setIsMuted(nextMute);
                  soundManager.setMuted(nextMute);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                  isMuted 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isMuted ? (isEs ? 'Silenciado' : 'Muted') : (isEs ? 'Activo' : 'Active')}
              </button>
            </div>

            {/* Music Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{isEs ? 'Volumen Música:' : 'Music Volume:'}</span>
                <span>{Math.round(musicVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMusicVol(val);
                  soundManager.setMusicVolume(val);
                }}
                className="w-full accent-amber-400"
              />
            </div>

            {/* SFX Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{isEs ? 'Efectos de Sonido (SFX):' : 'Sound Effects (SFX):'}</span>
                <span>{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSfxVol(val);
                  soundManager.setSfxVolume(val);
                }}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center justify-between bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{isEs ? 'Idioma del Juego' : 'Game Language'}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                  lang === 'es' 
                    ? 'bg-amber-500 text-slate-950 border-amber-300 font-black' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Español
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                  lang === 'en' 
                    ? 'bg-amber-500 text-slate-950 border-amber-300 font-black' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Controls Keymap Guide */}
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span>{isEs ? 'Guía de Teclas y Controles' : 'Controls & Keybindings'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400">{isEs ? 'Mover Comandante' : 'Move Commander'}</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold">W, A, S, D / Flechas</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400">{isEs ? 'Ataque Espada' : 'Sword Slash'}</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold">Click Izq.</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400">{isEs ? 'Esquiva / Rodar' : 'Dodge Roll'}</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-blue-300 font-bold">Espacio (Space)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400">{isEs ? 'Habilidades Héroe' : 'Hero Skills'}</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-bold">Q, E, R, F</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400">{isEs ? 'Habilidades Escuadrón' : 'Squad Skills'}</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-purple-300 font-bold">1, 2, 3, 4, 5, 6</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400">{isEs ? 'Tácticas de Formación' : 'Formations'}</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-bold">Z, X, C, V</span>
              </div>
            </div>
          </div>

          {/* Goal Info */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200/90">
            <HelpCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-amber-300 mb-1">{isEs ? '¿Cómo jugar y ganar?' : 'How to Play & Win'}</div>
              <p>
                {isEs 
                  ? 'Cada oleada te llevará a un nuevo escenario y añadirá guerreros adicionales con habilidades únicas a tu escuadrón (primero 2, luego 3, 4, 5...). Protege el Núcleo de la Aldea y a tu comandante eliminando todas las oleadas invasoras.' 
                  : 'Each wave moves to a completely new biome and expands your mini-army with new unique hero units (starts with 2, then 3, 4, 5, etc.). Protect the Village Core and defeat the invading hordes!'}
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950">
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
          >
            {isEs ? 'Cerrar Ajustes' : 'Close Settings'}
          </button>
        </div>

      </div>
    </div>
  );
};
