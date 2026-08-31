import React, { useState } from 'react';
import { 
  Play, Shield, Sword, Sparkles, 
  ChevronRight 
} from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  const [activeTab, setActiveTab] = useState<'play' | 'lore' | 'controls'>('play');

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-radial from-emerald-950/40 via-black/80 to-black backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-zinc-950/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/90 flex flex-col items-center text-center overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-gaming font-bold tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>THREE.JS 3D SURVIVAL SIMULATION</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-black font-gaming text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-200 to-emerald-500 tracking-tight drop-shadow-md">
          MANTIS GUARDIAN
        </h1>
        <div className="text-sm sm:text-base font-gaming font-semibold text-emerald-400/90 tracking-widest uppercase mt-1">
          Defensa del Nido Ancestral
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 my-5 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('play')}
            className={`px-4 py-1.5 rounded-xl text-xs font-gaming font-bold transition-all cursor-pointer ${
              activeTab === 'play' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Misión
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-4 py-1.5 rounded-xl text-xs font-gaming font-bold transition-all cursor-pointer ${
              activeTab === 'controls' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Controles
          </button>
          <button
            onClick={() => setActiveTab('lore')}
            className={`px-4 py-1.5 rounded-xl text-xs font-gaming font-bold transition-all cursor-pointer ${
              activeTab === 'lore' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Bestiario
          </button>
        </div>

        {/* Tab Contents */}
        <div className="w-full min-h-[160px] text-left text-xs sm:text-sm text-zinc-300">
          {activeTab === 'play' && (
            <div className="flex flex-col gap-3">
              <p className="leading-relaxed text-zinc-300">
                Encarna a la <strong className="text-emerald-400">Mantis Religiosa Alfa</strong>, el máximo depredador del sotobosque. Tu única misión es proteger la <strong className="text-amber-400">Ooteca (el nido de huevos)</strong> contra 10 oleadas de invasores implacables: hormigas carnívoras, avispas aéreas, escarabajos acorazados y colosos titánicos.
              </p>
              
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-emerald-500/20 text-center">
                  <Sword className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <div className="font-bold text-white text-[11px]">Garras y Ácido</div>
                  <div className="text-[10px] text-zinc-400">Combate fluido</div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-amber-500/20 text-center">
                  <Shield className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <div className="font-bold text-white text-[11px]">Protege el Nido</div>
                  <div className="text-[10px] text-zinc-400">Escudo y Centinelas</div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-fuchsia-500/20 text-center">
                  <Sparkles className="w-4 h-4 text-fuchsia-400 mx-auto mb-1" />
                  <div className="font-bold text-white text-[11px]">Evolución ADN</div>
                  <div className="text-[10px] text-zinc-400">Mutaciones y Poder</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Movimiento 360°</span>
                <strong className="text-emerald-400 font-gaming">W, A, S, D</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Apuntar Objetivo</span>
                <strong className="text-emerald-400 font-gaming">Cursor Mouse</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Corte Garra Raptora</span>
                <strong className="text-emerald-400 font-gaming">Clic Izquierdo</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Bilis Bio-Ácida (AoE)</span>
                <strong className="text-lime-400 font-gaming">Clic Derecho</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Impulso Alar (Dash)</span>
                <strong className="text-cyan-400 font-gaming">ESPACIO / SHIFT</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Salto Aplastante</span>
                <strong className="text-yellow-400 font-gaming">[ Q ]</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Furia Alfa / Camuflaje</span>
                <strong className="text-fuchsia-400 font-gaming">[ E ]</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Chirrido Sónico / Repulsión</span>
                <strong className="text-sky-400 font-gaming">[ F ] / [ R ]</strong>
              </div>
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1"></span>
                <div>
                  <strong className="text-white text-xs">Hormigas Rojas & Ácidas:</strong>
                  <p className="text-[11px] text-zinc-400">Atacan en enjambres coordinados y escupen veneno a distancia hacia el nido.</p>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 mt-1"></span>
                <div>
                  <strong className="text-white text-xs">Avispas y Abejas Zángano:</strong>
                  <p className="text-[11px] text-zinc-400">Vuelan en 3D en picada para clavar aguijones neurotóxicos.</p>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1"></span>
                <div>
                  <strong className="text-white text-xs">Escarabajos Rinoceronte & Titanes:</strong>
                  <p className="text-[11px] text-zinc-400">Tanques fuertemente acorazados con embestidas que destruyen las defensas.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Start Game Button */}
        <button
          onClick={onStart}
          className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-gaming text-base sm:text-lg font-black rounded-2xl border border-emerald-400/60 shadow-xl shadow-emerald-950/90 cursor-pointer flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>INICIAR CACERÍA Y DEFENDER EL NIDO</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
