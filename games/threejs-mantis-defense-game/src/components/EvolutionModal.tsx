import React from 'react';
import { GameEngine } from '../game/GameEngine';
import { 
  Sparkles, Sword, FlaskConical, Wind, 
  Shield, HeartPulse, Egg, Zap, Flame, 
  ArrowRight, Check
} from 'lucide-react';

interface EvolutionModalProps {
  engine: GameEngine;
  onContinue: () => void;
}

export const EvolutionModal: React.FC<EvolutionModalProps> = ({ engine, onContinue }) => {
  const { playerStats, upgrades, currentWaveNumber } = engine;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sword': return <Sword className="w-6 h-6 text-emerald-400" />;
      case 'FlaskConical': return <FlaskConical className="w-6 h-6 text-lime-400" />;
      case 'Wind': return <Wind className="w-6 h-6 text-cyan-400" />;
      case 'Shield': return <Shield className="w-6 h-6 text-blue-400" />;
      case 'HeartPulse': return <HeartPulse className="w-6 h-6 text-rose-400" />;
      case 'Egg': return <Egg className="w-6 h-6 text-amber-400" />;
      case 'Zap': return <Zap className="w-6 h-6 text-yellow-400" />;
      case 'Flame': return <Flame className="w-6 h-6 text-fuchsia-400" />;
      default: return <Sparkles className="w-6 h-6 text-emerald-400" />;
    }
  };

  const handleUpgrade = (upgradeId: string) => {
    engine.purchaseUpgrade(upgradeId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-zinc-950/95 border border-emerald-500/50 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 bg-emerald-950/20">
          <div>
            <div className="text-[11px] font-gaming text-emerald-400 tracking-widest uppercase font-bold">
              Cámara de Metamorfosis Genética
            </div>
            <h2 className="text-xl sm:text-2xl font-gaming font-black text-white">
              Evolución de la Mantis • Oleada {currentWaveNumber} Superada
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-black/70 px-4 py-2 rounded-2xl border border-emerald-500/40">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Biomasa Disponible</span>
              <span className="text-xl font-black font-gaming text-emerald-400">{playerStats.biomass}</span>
            </div>
          </div>
        </div>

        {/* Upgrade Grid */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {upgrades.map((upgrade) => {
            const isMax = upgrade.currentLevel >= upgrade.maxLevel;
            const canAfford = playerStats.biomass >= upgrade.cost && !isMax;

            return (
              <div 
                key={upgrade.id}
                className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                  isMax 
                    ? 'bg-zinc-900/40 border-zinc-800 opacity-60' 
                    : (canAfford 
                        ? 'bg-zinc-900/80 border-emerald-500/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/40' 
                        : 'bg-zinc-950/60 border-zinc-800/80')
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-700/60">
                      {getIcon(upgrade.icon)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm sm:text-base">{upgrade.title}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                          <div 
                            key={i}
                            className={`w-3.5 h-1.5 rounded-full ${
                              i < upgrade.currentLevel 
                                ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' 
                                : 'bg-zinc-800'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-zinc-400 ml-1">
                          {upgrade.currentLevel}/{upgrade.maxLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
                    {upgrade.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/80">
                  {isMax ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                      <Check className="w-4 h-4" /> Nivel Máximo
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 text-sm font-bold text-emerald-400 font-gaming">
                      <Sparkles className="w-4 h-4" />
                      <span>{upgrade.cost} Biomasa</span>
                    </div>
                  )}

                  {!isMax && (
                    <button
                      onClick={() => handleUpgrade(upgrade.id)}
                      disabled={!canAfford}
                      className={`px-4 py-1.5 rounded-xl font-gaming text-xs font-bold transition-all cursor-pointer ${
                        canAfford 
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-950/60 hover:scale-105 active:scale-95' 
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      Mutar ADN
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-emerald-500/30 bg-black/60">
          <div className="text-xs text-zinc-400">
            Próxima Incursión: <strong className="text-emerald-400 font-gaming">Oleada {currentWaveNumber + 1}</strong>
          </div>

          <button
            onClick={onContinue}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-gaming text-sm font-black rounded-2xl border border-emerald-400/60 shadow-xl shadow-emerald-950/80 cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <span>Iniciar Siguiente Oleada</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
