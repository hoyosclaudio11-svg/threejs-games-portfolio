import React, { useState } from 'react';
import { Skull, X, ShieldAlert, Zap, Flame, Crown, Crosshair, Heart } from 'lucide-react';
import { MONSTER_DEFINITIONS } from '../game/constants';
import { soundManager } from '../audio/SoundManager';

interface BestiaryModalProps {
  onClose: () => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ onClose }) => {
  const monsters = Object.values(MONSTER_DEFINITIONS);
  const [selectedMonster, setSelectedMonster] = useState(monsters[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-rajdhani">
      <div className="cyber-panel w-full max-w-5xl max-h-[90vh] flex flex-col border-sky-400/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-500/30 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Skull className="w-6 h-6 text-red-500" />
            <div>
              <h2 className="text-2xl font-orbitron font-black text-white glow-red">
                BESTIARIO DE ESPECÍMENES MUTANTES
              </h2>
              <p className="text-xs text-slate-400">Archivos clasificados de amenazas biológicas y titanes cósmicos.</p>
            </div>
          </div>

          <button 
            onClick={() => {
              soundManager.playUIClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content: List + Detail View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Monster List */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto p-4 space-y-2 bg-slate-950/40">
            {monsters.map((m) => {
              const isSelected = selectedMonster.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    soundManager.playUIClick();
                    setSelectedMonster(m);
                  }}
                  className={`w-full text-left p-3 rounded-lg font-orbitron text-xs transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'bg-sky-500/20 border border-sky-400 text-white shadow-md' 
                      : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {m.isBoss ? (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Skull className="w-4 h-4 text-red-400" />
                    )}
                    <span className="font-bold truncate max-w-[170px]">{m.name}</span>
                  </div>
                  {m.isBoss && (
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-[9px] rounded uppercase font-bold">
                      JEFE
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Detail Card */}
          <div className="w-full md:w-2/3 p-6 overflow-y-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-orbitron font-bold rounded ${
                    selectedMonster.isBoss ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-sky-500/20 text-sky-400'
                  }`}>
                    {selectedMonster.isBoss ? 'AMENAZA CLASE TITÁN' : 'INFESTACIÓN COMÚN'}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-orbitron font-black text-white mt-1">
                  {selectedMonster.displayName}
                </h3>
              </div>

              <div className="cyber-panel px-4 py-2 text-right">
                <span className="text-[10px] text-slate-400 block font-orbitron">VALOR POR BAJA</span>
                <span className="text-base font-orbitron font-bold text-yellow-400">{selectedMonster.scoreValue} PTS</span>
              </div>
            </div>

            {/* Description Lore */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-orbitron font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> REPORTE TÁCTICO
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedMonster.description}
              </p>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-orbitron font-semibold mb-1">
                  <Heart className="w-4 h-4" /> SALUD (HP)
                </div>
                <div className="text-lg font-orbitron font-black text-white">{selectedMonster.maxHp}</div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-orbitron font-semibold mb-1">
                  <Zap className="w-4 h-4" /> VELOCIDAD
                </div>
                <div className="text-lg font-orbitron font-black text-white">{selectedMonster.speed} m/s</div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-orbitron font-semibold mb-1">
                  <Flame className="w-4 h-4" /> DAÑO BASE
                </div>
                <div className="text-lg font-orbitron font-black text-white">{selectedMonster.damage}</div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-orbitron font-semibold mb-1">
                  <Crosshair className="w-4 h-4" /> ALCANCE
                </div>
                <div className="text-lg font-orbitron font-black text-white">
                  {selectedMonster.shootProjectile ? 'Distancia' : `${selectedMonster.attackRange} m`}
                </div>
              </div>
            </div>

            {/* Tactical Advice */}
            <div className="p-4 bg-sky-950/20 border border-sky-500/30 rounded-xl text-xs text-slate-300">
              <span className="font-orbitron font-bold text-sky-400 uppercase block mb-1">CONSEJO DE COMBATE:</span>
              {selectedMonster.hasShield ? (
                'Este gólem cuenta con una barrera frontal. Flanquéalo con saltos de jetpack o utiliza el lanzacohetes / granadas para reventarlo por detrás.'
              ) : selectedMonster.shootProjectile ? (
                'Mantente en constante movimiento lateral o utiliza las plataformas elevadas para esquivar los proyectiles de ácido.'
              ) : selectedMonster.isBoss ? (
                'Guarda tu arma pesada y granadas para sus fases de ataque en reposo. Usa el Roll [F] para ser invulnerable durante sus embestidas.'
              ) : (
                'Apunta a la cabeza para críticos y encadena bajas consecutivas para multiplicar tu puntaje.'
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
