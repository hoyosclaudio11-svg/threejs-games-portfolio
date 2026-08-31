import React from 'react';
import { GameSettings } from '../types/game';
import { saveSettings } from '../utils/storage';
import { X, Sliders, Smartphone, Camera, Flag } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onClose: () => void;
  onUpdateSettings: (settings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const update = (partial: Partial<GameSettings>) => {
    const updated = { ...settings, ...partial };
    onUpdateSettings(updated);
    saveSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black flex flex-col gap-5 my-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-chakra font-black tracking-wide text-white uppercase">
                CONFIGURACIÓN & PREFERENCIAS
              </h2>
              <p className="text-xs font-mono-data text-slate-400">
                FÍSICAS, CÁMARA Y RETROALIMENTACIÓN HÁPTICA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-4 overflow-y-auto pr-1 text-xs font-mono-data text-slate-300">
          {/* Section 1: Gameplay & Steering */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
            <div className="text-xs font-chakra font-bold text-cyan-300 flex items-center gap-2">
              <Flag className="w-4 h-4" />
              <span>CONTROL & CONDUCCIÓN</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span>SENSIBILIDAD DEL VOLANTE:</span>
                <span className="text-white font-bold">{Math.round(settings.steeringSensitivity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={settings.steeringSensitivity}
                onChange={(e) => update({ steeringSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span>UNIDAD DE VELOCIDAD:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => update({ speedUnit: 'kmh' })}
                  className={`px-3 py-1 rounded-lg border text-xs font-bold ${
                    settings.speedUnit === 'kmh'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-800 text-slate-400 border-white/10'
                  }`}
                >
                  KM/H
                </button>
                <button
                  onClick={() => update({ speedUnit: 'mph' })}
                  className={`px-3 py-1 rounded-lg border text-xs font-bold ${
                    settings.speedUnit === 'mph'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-800 text-slate-400 border-white/10'
                  }`}
                >
                  MPH
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Camera & Screen Shake */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
            <div className="text-xs font-chakra font-bold text-amber-400 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span>CÁMARA & RETROALIMENTACIÓN VISUAL</span>
            </div>

            <div className="flex items-center justify-between">
              <span>ROTACIÓN DINÁMICA DE CÁMARA:</span>
              <button
                onClick={() => update({ dynamicCameraRotation: !settings.dynamicCameraRotation })}
                className={`px-3 py-1 rounded-lg border font-bold ${
                  settings.dynamicCameraRotation
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                    : 'bg-slate-800 text-slate-400 border-white/10'
                }`}
              >
                {settings.dynamicCameraRotation ? 'ACTIVO' : 'ESTÁTICA'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span>VIBRACIÓN DE PANTALLA (SCREEN SHAKE):</span>
              <button
                onClick={() => update({ screenShake: !settings.screenShake })}
                className={`px-3 py-1 rounded-lg border font-bold ${
                  settings.screenShake
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                    : 'bg-slate-800 text-slate-400 border-white/10'
                }`}
              >
                {settings.screenShake ? 'ACTIVO' : 'DESACTIVADO'}
              </button>
            </div>
          </div>

          {/* Section 3: Audio, Haptics & Ghost */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
            <div className="text-xs font-chakra font-bold text-emerald-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>AUDIO, HÁPTICA & AUTO FANTASMA</span>
            </div>

            <div className="flex items-center justify-between">
              <span>RESPUESTA HÁPTICA (VIBRACIÓN MÓVIL):</span>
              <button
                onClick={() => update({ haptics: !settings.haptics })}
                className={`px-3 py-1 rounded-lg border font-bold ${
                  settings.haptics
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                    : 'bg-slate-800 text-slate-400 border-white/10'
                }`}
              >
                {settings.haptics ? 'ACTIVADA' : 'DESACTIVADA'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span>AUTO FANTASMA (MEJOR TIEMPO):</span>
              <button
                onClick={() => update({ showGhost: !settings.showGhost })}
                className={`px-3 py-1 rounded-lg border font-bold ${
                  settings.showGhost
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                    : 'bg-slate-800 text-slate-400 border-white/10'
                }`}
              >
                {settings.showGhost ? 'VISIBLE' : 'OCULTO'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span>NOTAS DE COPILOTO (PACENOTES HUD):</span>
              <button
                onClick={() => update({ showPaceNotes: !settings.showPaceNotes })}
                className={`px-3 py-1 rounded-lg border font-bold ${
                  settings.showPaceNotes
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                    : 'bg-slate-800 text-slate-400 border-white/10'
                }`}
              >
                {settings.showPaceNotes ? 'ACTIVADAS' : 'OCULTAS'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-white/10 pt-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-chakra font-bold text-sm tracking-wider uppercase transition active:scale-95 shadow-md shadow-cyan-500/20"
          >
            GUARDAR Y SALIR
          </button>
        </div>
      </div>
    </div>
  );
};
