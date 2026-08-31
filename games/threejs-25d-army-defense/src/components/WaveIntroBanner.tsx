import React, { useEffect, useState } from 'react';
import { WaveScenario } from '../types/game';
import { Shield, Sparkles, UserPlus } from 'lucide-react';

interface WaveIntroBannerProps {
  scenario: WaveScenario;
  lang: 'es' | 'en';
  onDismiss: () => void;
}

export const WaveIntroBanner: React.FC<WaveIntroBannerProps> = ({
  scenario,
  lang,
  onDismiss
}) => {
  const [visible, setVisible] = useState(true);
  const isEs = lang === 'es';

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 4200);
    return () => clearTimeout(timer);
  }, [scenario, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-40 flex justify-center pointer-events-none px-4 select-none animate-fadeIn">
      <div className="bg-slate-950/90 backdrop-blur-xl border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl max-w-xl w-full text-center flex flex-col items-center gap-2 transform transition-all duration-500 scale-100">
        
        {/* Scenario Biome Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/40 uppercase tracking-widest flex items-center gap-1.5 shadow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEs ? `ESCENARIO DE LA OLEADA ${scenario.waveNumber}` : `WAVE ${scenario.waveNumber} SCENARIO`}</span>
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 tracking-wide mt-1">
          {isEs ? scenario.name : scenario.nameEn}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm font-semibold text-amber-300/90 max-w-md">
          {isEs ? scenario.subtitle : scenario.subtitleEn}
        </p>

        {/* Squad size notice */}
        <div className="flex items-center gap-3 mt-1 bg-slate-900/80 px-4 py-1.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1 text-xs text-slate-300 font-bold">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>{isEs ? `Tamaño del Ejército: ${scenario.squadCountGoal} Guerreros` : `Squad Size: ${scenario.squadCountGoal} Units`}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-xs text-slate-300 font-bold">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>{isEs ? 'Objetivo: Proteger la Aldea' : 'Goal: Defend the Village'}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 mt-1 max-w-md italic">
          "{isEs ? scenario.description : scenario.descriptionEn}"
        </p>
      </div>
    </div>
  );
};
