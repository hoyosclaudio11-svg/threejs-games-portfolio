import React, { useState } from 'react';
import { loadHighScores } from '../utils/storage';
import { RALLY_STAGES } from '../game/tracks';
import { Trophy, X, Calendar, Gauge, Zap } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>('all');
  const scores = loadHighScores();

  if (!isOpen) return null;

  const filteredScores =
    selectedStageId === 'all'
      ? scores
      : scores.filter((s) => s.stageId === selectedStageId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black flex flex-col gap-5 my-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-chakra font-black tracking-wide text-white uppercase">
                TABLA DE RÉCORDS & TELEMETRÍA
              </h2>
              <p className="text-xs font-mono-data text-slate-400">
                MEJORES TIEMPOS DE ETAPA Y SECTORES
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

        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedStageId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-chakra font-bold transition shrink-0 ${
              selectedStageId === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            TODAS LAS ETAPAS
          </button>
          {RALLY_STAGES.map((stg) => (
            <button
              key={stg.id}
              onClick={() => setSelectedStageId(stg.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-chakra font-bold transition flex items-center gap-1.5 shrink-0 ${
                selectedStageId === stg.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <span>{stg.flag}</span>
              <span>{stg.name}</span>
            </button>
          ))}
        </div>

        {/* Table Records */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60">
          <table className="w-full text-left text-xs font-mono-data">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] sticky top-0 border-b border-white/10">
              <tr>
                <th className="py-3 px-4">POS</th>
                <th className="py-3 px-4">ETAPA</th>
                <th className="py-3 px-4">VEHÍCULO</th>
                <th className="py-3 px-4">TIEMPO TOTAL</th>
                <th className="py-3 px-4 hidden md:table-cell">TOP VEL</th>
                <th className="py-3 px-4 hidden md:table-cell">DRIFT</th>
                <th className="py-3 px-4 hidden lg:table-cell">FECHA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredScores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No hay tiempos registrados todavía. ¡Sé el primero en marcar un récord!
                  </td>
                </tr>
              ) : (
                filteredScores.map((entry, idx) => {
                  const isTop3 = idx < 3;
                  const rankIcons = ['🥇', '🥈', '🥉'];

                  return (
                    <tr
                      key={entry.id || idx}
                      className="hover:bg-white/5 transition duration-150"
                    >
                      <td className="py-3 px-4 font-bold text-white">
                        {isTop3 ? rankIcons[idx] : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 font-semibold text-cyan-300">
                        {entry.stageName}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {entry.carName}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                        {formatTime(entry.totalTimeSeconds)}
                      </td>
                      <td className="py-3 px-4 text-slate-300 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-slate-400" />
                          <span>{entry.topSpeedKmh} km/h</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-amber-400 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>+{entry.driftScore}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{entry.date}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-white/10 pt-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-chakra font-bold text-sm tracking-wider uppercase transition active:scale-95 shadow-md shadow-cyan-500/20"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};
