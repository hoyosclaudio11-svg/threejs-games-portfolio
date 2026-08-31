import React, { useEffect } from 'react';
import { TrackStage, CarSpec } from '../types/game';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ArrowRight, Home, Flame, Zap, Gauge } from 'lucide-react';

interface FinishScreenProps {
  stage: TrackStage;
  car: CarSpec;
  finalTime: number;
  sectorTimes: number[];
  topSpeedKmh: number;
  driftScore: number;
  maxDriftAngle: number;
  isNewRecord: boolean;
  medal: 'gold' | 'silver' | 'bronze' | 'none';
  onRestart: () => void;
  onNextStage: () => void;
  onOpenLeaderboard: () => void;
  onExitToMenu: () => void;
}

export const FinishScreen: React.FC<FinishScreenProps> = ({
  stage,
  car,
  finalTime,
  sectorTimes,
  topSpeedKmh,
  driftScore,
  maxDriftAngle,
  isNewRecord,
  medal,
  onRestart,
  onNextStage,
  onOpenLeaderboard,
  onExitToMenu,
}) => {
  useEffect(() => {
    if (medal === 'gold' || isNewRecord) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#f59e0b', '#10b981', '#ffffff'],
        });
      } catch {}
    }
  }, [medal, isNewRecord]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const getMedalInfo = () => {
    switch (medal) {
      case 'gold':
        return { label: 'MEDALLA DE ORO', color: 'text-amber-400', border: 'border-amber-400/50 bg-amber-950/40', icon: '🥇' };
      case 'silver':
        return { label: 'MEDALLA DE PLATA', color: 'text-slate-200', border: 'border-slate-300/50 bg-slate-800/40', icon: '🥈' };
      case 'bronze':
        return { label: 'MEDALLA DE BRONCE', color: 'text-amber-600', border: 'border-amber-600/50 bg-amber-950/20', icon: '🥉' };
      default:
        return { label: 'ETAPA FINALIZADA', color: 'text-cyan-400', border: 'border-cyan-500/30 bg-cyan-950/30', icon: '🏁' };
    }
  };

  const medalInfo = getMedalInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black flex flex-col gap-5 my-auto">
        {/* Header & Stage Flag */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{stage.flag}</span>
            <div>
              <div className="text-xs font-mono-data text-slate-400 uppercase">
                {stage.country} // {stage.name}
              </div>
              <h2 className="text-2xl md:text-3xl font-chakra font-black tracking-wide text-white uppercase">
                ¡TRAMO COMPLETADO!
              </h2>
            </div>
          </div>

          {/* New Record Flash Tag */}
          {isNewRecord && (
            <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-chakra font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-500/40 animate-bounce">
              ¡NUEVO RÉCORD!
            </div>
          )}
        </div>

        {/* Medal & Big Time Display */}
        <div className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center ${medalInfo.border}`}>
          <span className="text-4xl mb-1">{medalInfo.icon}</span>
          <span className={`text-xs font-mono-data font-bold uppercase tracking-widest ${medalInfo.color}`}>
            {medalInfo.label}
          </span>
          <span className="text-4xl md:text-5xl font-mono-data font-black text-white tracking-tight mt-1">
            {formatTime(finalTime)}
          </span>

          <div className="flex items-center gap-4 text-xs font-mono-data text-slate-400 mt-2">
            <span>OBJETIVO ORO: <strong className="text-amber-400">{formatTime(stage.parTimeSeconds)}</strong></span>
            <span>AUTO: <strong className="text-white">{car.name}</strong></span>
          </div>
        </div>

        {/* Sector Splits Breakdown */}
        <div className="space-y-2">
          <div className="text-xs font-mono-data font-bold text-slate-400 uppercase">
            TIEMPOS POR SECTORES
          </div>
          <div className="grid grid-cols-3 gap-2">
            {stage.sectors.map((sec, idx) => {
              const secTime = sectorTimes[idx] || (finalTime * (idx + 1)) / 3;
              const deltaVsTarget = secTime - sec.targetTimeSeconds;
              return (
                <div key={sec.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col">
                  <span className="text-[10px] font-mono-data text-slate-400">SECTOR {idx + 1}</span>
                  <span className="font-mono-data font-bold text-white text-sm">{formatTime(secTime)}</span>
                  <span className={`text-[10px] font-mono-data font-semibold ${deltaVsTarget <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {deltaVsTarget <= 0 ? '' : '+'}{deltaVsTarget.toFixed(2)}s
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telemetry Stats (Top speed, Drift angle, Drift score) */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs font-mono-data">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-white/10 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-slate-400 text-[10px]">VEL. MÁXIMA</div>
              <div className="text-white font-bold">{topSpeedKmh} km/h</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/40 border border-white/10 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-slate-400 text-[10px]">ÁNGULO DERRAPE</div>
              <div className="text-white font-bold">{Math.round(maxDriftAngle)}°</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/40 border border-white/10 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-400 text-[10px]">DRIFT SCORE</div>
              <div className="text-white font-bold">+{driftScore}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
          <button
            onClick={onRestart}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-amber-400 font-chakra font-bold text-base tracking-wider uppercase flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REINTENTAR (R)</span>
          </button>

          <button
            onClick={onNextStage}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-chakra font-black text-base tracking-wider uppercase flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            <span>SIGUIENTE ETAPA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs font-mono-data text-slate-400 border-t border-white/10 pt-3">
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 hover:text-cyan-300 transition"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Tabla de Tiempos</span>
          </button>

          <button
            onClick={onExitToMenu}
            className="flex items-center gap-1.5 hover:text-white transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Volver al Garaje</span>
          </button>
        </div>
      </div>
    </div>
  );
};
