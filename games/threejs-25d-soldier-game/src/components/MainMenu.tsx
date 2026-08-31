import React, { useState } from 'react';
import { 
  Play, 
  BookOpen, 
  Award, 
  Crosshair, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Infinity as InfinityIcon,
  Layers
} from 'lucide-react';
import { SOLDIER_CLASSES } from '../game/constants';
import { soundManager } from '../audio/SoundManager';

interface MainMenuProps {
  onStartGame: (soldierClassId: string, isEndless: boolean) => void;
  onOpenBestiary: () => void;
  onOpenAchievements: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenBestiary,
  onOpenAchievements,
  isMuted,
  onToggleMute,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('commando');
  const [isEndless, setIsEndless] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  const activeClass = SOLDIER_CLASSES.find(c => c.id === selectedClassId) || SOLDIER_CLASSES[0];

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between p-4 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 overflow-y-auto font-rajdhani select-none">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-500/20 rounded-lg border border-sky-400/40">
            <Crosshair className="w-6 h-6 text-sky-400 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <span className="text-xs font-orbitron font-bold text-sky-400 uppercase tracking-widest">
            PROYECTO: DEFENSA 2.5D THREE.JS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playUIClick();
              onOpenBestiary();
            }}
            className="cyber-panel px-3.5 py-2 text-xs font-orbitron font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-red-400" />
            BESTIARIO
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick();
              onOpenAchievements();
            }}
            className="cyber-panel px-3.5 py-2 text-xs font-orbitron font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-yellow-400" />
            LOGROS
          </button>

          <button
            onClick={onToggleMute}
            className="p-2.5 cyber-panel hover:bg-slate-800 text-sky-400"
            title="Silenciar / Activar Audio"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Title & Hero */}
      <div className="my-auto text-center max-w-4xl mx-auto py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-400/30 rounded-full text-xs font-orbitron text-sky-300 mb-4 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>MOTOR 3D / 2.5D ACCIÓN • 8 ESCENARIOS ÚNICOS • MEGA JEFES</span>
        </div>

        <h1 className="text-4xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-200 to-indigo-400 glow-cyan tracking-wider uppercase leading-tight">
          CYBER SOLDIER
        </h1>
        <h2 className="text-xl md:text-3xl font-orbitron font-black text-amber-400 glow-amber tracking-widest mt-1">
          ONSLAUGHT: OLEADAS DE MONSTRUOS
        </h2>

        <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto mt-4 leading-relaxed">
          Ponte en la piel de un soldado de élite cibernético. Lucha a través de 8 biomas 3D dinámicos, 
          adquiere armas devastadoras, esquiva ataques mortales y extermina la horda alienígena.
        </p>

        {/* Soldier Class Selector Grid */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          {SOLDIER_CLASSES.map((sc) => {
            const isSelected = selectedClassId === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => {
                  soundManager.playUIClick();
                  setSelectedClassId(sc.id);
                }}
                className={`cyber-panel p-3.5 cursor-pointer transition-all border-2 flex flex-col justify-between ${
                  isSelected 
                    ? 'border-sky-400 bg-sky-500/20 scale-[1.03] shadow-lg shadow-sky-500/20' 
                    : 'border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-orbitron font-bold text-sky-400 uppercase">Clase</span>
                    {isSelected && <span className="text-[10px] text-amber-400 font-bold">✓ ELEGIDO</span>}
                  </div>
                  <h4 className="font-orbitron font-bold text-sm text-white mb-1">{sc.name}</h4>
                  <p className="text-[11px] text-slate-400 leading-tight mb-2">{sc.title}</p>
                </div>

                <div className="text-[10px] text-slate-400 bg-slate-950/70 p-1.5 rounded border border-slate-800">
                  <span className="text-emerald-400 block font-semibold">{sc.passiveDescription}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Game Mode Selector (Campaign vs Endless) */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => {
              soundManager.playUIClick();
              setIsEndless(false);
            }}
            className={`px-4 py-2 rounded font-orbitron text-xs font-bold flex items-center gap-2 border transition-all ${
              !isEndless 
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-md' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4 text-sky-400" />
            CAMPAÑA (8 BIOMAS + JEFES)
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick();
              setIsEndless(true);
            }}
            className={`px-4 py-2 rounded font-orbitron text-xs font-bold flex items-center gap-2 border transition-all ${
              isEndless 
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
          >
            <InfinityIcon className="w-4 h-4 text-amber-400" />
            SUPERVIVENCIA INFINITA
          </button>
        </div>

        {/* Main Play Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              soundManager.playUIClick();
              onStartGame(selectedClassId, isEndless);
            }}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 hover:from-sky-400 hover:to-emerald-300 text-black font-orbitron font-black text-lg rounded-xl shadow-xl shadow-sky-500/30 transition-all flex items-center justify-center gap-3 cyber-button"
          >
            <Play className="w-6 h-6 fill-black" />
            INICIAR COMBATE ({activeClass.name})
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick();
              setShowHowToPlay(true);
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-orbitron font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2"
          >
            ¿CÓMO JUGAR?
          </button>
        </div>
      </div>

      {/* Bottom Footer Credits & Controls Notice */}
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/80 gap-2">
        <div>Controles: <span className="text-slate-400">A/D</span> Moverse • <span className="text-slate-400">W/Espacio</span> Saltar/Jetpack • <span className="text-slate-400">Clic</span> Disparar • <span className="text-slate-400">F/Shift</span> Rodar • <span className="text-slate-400">V</span> Melee</div>
        <div className="font-mono text-[11px] text-sky-400/70">Three.js 2.5D Engine • Audio Sintetizado en Tiempo Real</div>
      </div>

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="cyber-panel w-full max-w-xl p-6 border-sky-400/50 shadow-2xl space-y-4">
            <h3 className="text-xl font-orbitron font-bold text-white glow-cyan">MANUAL DEL SOLDADO</h3>
            
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded border border-slate-800">
              <p><strong className="text-sky-400">1. Movimiento y Esquiva:</strong> Usa <span className="text-white font-mono">A / D</span> para desplazarte. Mantén presionado <span className="text-white font-mono">W o Espacio</span> en el aire para activar los propulsores del Jetpack. Presiona <span className="text-white font-mono">F o Shift</span> para hacer una voltereta táctica que te otorga inmunidad temporal contra golpes.</p>
              <p><strong className="text-sky-400">2. Apuntado y Armas:</strong> Apunta libremente en 360° con el ratón. Dispara con el <span className="text-white">Clic Izquierdo</span>. Cambia rápidamente de arma con las teclas <span className="text-white font-mono">1 al 8</span> o la rueda del ratón.</p>
              <p><strong className="text-sky-400">3. Escenarios Cambiantes:</strong> Cada oleada te traslada a un nuevo bioma 3D (Callejones de Neón, Cañones de Marte, Refinería Tóxica, Base Ártica, etc.) con sus propios tipos de enemigos y clima.</p>
              <p><strong className="text-sky-400">4. Armería entre Oleadas:</strong> Tras superar una oleada, selecciona una ventaja gratuita y gasta tus créditos en desbloquear y mejorar nuevas armas y atributos en la tienda.</p>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-orbitron font-bold text-xs rounded"
            >
              ENTENDIDO, VOLVER AL MENÚ
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
