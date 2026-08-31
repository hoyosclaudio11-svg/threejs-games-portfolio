import React from 'react';
import { 
  Play, 
  Users, 
  Sparkles, 
  MapPin, 
  Crown
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface StartScreenProps {
  onStartGame: () => void;
  lang: 'es' | 'en';
  setLang: (lang: 'es' | 'en') => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  lang,
  setLang
}) => {
  const isEs = lang === 'es';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fadeIn font-sans">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl w-full max-w-4xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-32 right-10 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl" />

        {/* Top Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/40 uppercase tracking-widest flex items-center gap-1.5 shadow">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>2.5D THREE.JS TACTICAL ACTION DEFENSE</span>
          </span>

          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setLang('es')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition border ${
                lang === 'es' 
                  ? 'bg-amber-500 text-slate-950 border-amber-300' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition border ${
                lang === 'en' 
                  ? 'bg-amber-500 text-slate-950 border-amber-300' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Game Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-tight mb-2">
          {isEs ? 'GUARDIANES DE LA CORONA' : 'GUARDIANS OF THE REALM'}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mb-6">
          {isEs
            ? 'Comanda a un guerrero legendario y lidera a tu mini-ejército creciente (comienza con 2, luego 3, 4, 5...) para proteger el corazón de la aldea en escenarios cambiantes en cada oleada.'
            : 'Lead a legendary warrior commander and an expanding mini-army (starts with 2, then 3, 4, 5...) with unique abilities to defend the village core across changing biomes.'}
        </p>

        {/* 3 Core Features Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8 text-left">
          {/* Card 1: Squad Evolution */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1.5 shadow">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Users className="w-4 h-4" />
              <span>{isEs ? 'Ejército en Crecimiento' : 'Expanding Army'}</span>
            </div>
            <p className="text-xs text-slate-400">
              {isEs 
                ? 'Oleada 1 empieza con 2 guerreros (Sir Valerie y Lyra), luego se unen Piromantes, Sacerdotisas, Artilleros y Asesinos.' 
                : 'Wave 1 starts with 2 squadmates, unlocking Pyromancers, Priestesses, Bombardiers and Assassins as you advance.'}
            </p>
          </div>

          {/* Card 2: Changing Scenarios */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1.5 shadow">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <MapPin className="w-4 h-4" />
              <span>{isEs ? 'Escenarios Diferentes' : 'Changing Biomes'}</span>
            </div>
            <p className="text-xs text-slate-400">
              {isEs 
                ? 'Praderas verdes, bosques de otoño, ruinas del desierto, cumbres heladas, volcanes de lava y ciudadelas malditas.' 
                : 'Emerald plains, autumn forests, desert ruins, frozen bastions, magma calderas and shadow citadels.'}
            </p>
          </div>

          {/* Card 3: Skills & Tactics */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1.5 shadow">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>{isEs ? 'Habilidades & Tácticas' : 'Skills & Formations'}</span>
            </div>
            <p className="text-xs text-slate-400">
              {isEs 
                ? 'Combos de torbellino, meteoritos, lluvia de flechas, relámpagos divinos y órdenes de formación en tiempo real.' 
                : 'Whirlwind vortexes, meteors, arrow storms, chain lightning and real-time tactical squad formations.'}
            </p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => {
            soundManager.init();
            soundManager.playBattleHorn();
            onStartGame();
          }}
          className="py-4 px-10 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-slate-950 font-black text-lg shadow-2xl flex items-center gap-3 border-2 border-amber-200 transition transform hover:-translate-y-0.5"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>{isEs ? '¡COMENZAR LA DEFENSA!' : 'START VILLAGE DEFENSE!'}</span>
        </button>

        {/* Controls preview line */}
        <div className="mt-4 text-[11px] text-slate-400 flex items-center gap-4 flex-wrap justify-center font-mono">
          <span>🎮 WASD / Flechas: Mover</span>
          <span>⚔️ Click: Atacar</span>
          <span>⚡ Espacio: Esquivar</span>
          <span>✨ Q,E,R,F: Habilidades</span>
          <span>👥 1-6: Escuadrón</span>
        </div>

      </div>
    </div>
  );
};
