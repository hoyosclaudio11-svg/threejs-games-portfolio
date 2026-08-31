import React, { useState } from 'react';
import { getStoredHighScores } from '../services/storage';
import { HighScoreRecord } from '../types/game';
import { Trophy, X, DollarSign, Clock, ShieldCheck, Trash2 } from 'lucide-react';
import { audioManager } from '../services/audio';

interface HighScoresModalProps {
  onClose: () => void;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({ onClose }) => {
  const [scores, setScores] = useState<HighScoreRecord[]>(() => getStoredHighScores());
  const [filterMission, setFilterMission] = useState<string>('ALL');

  const filtered = filterMission === 'ALL'
    ? scores
    : scores.filter(s => s.missionId === filterMission);

  const handleClear = () => {
    if (window.confirm('¿Seguro que deseas reiniciar el registro de puntuaciones locales?')) {
      localStorage.removeItem('ghost_protocol_highscores_v1');
      setScores([]);
      audioManager.playButtonClick();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border-2 border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-black text-white">TABLA DE RÉCORDS TÁCTICOS</h2>
          </div>
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-2 my-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['ALL', 'mission_1', 'mission_2', 'mission_3'].map(key => (
              <button
                key={key}
                onClick={() => {
                  audioManager.playButtonClick();
                  setFilterMission(key);
                }}
                className={`px-3 py-1 rounded font-bold transition-colors whitespace-nowrap ${
                  filterMission === key
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {key === 'ALL'
                  ? 'TODAS'
                  : key === 'mission_1'
                  ? 'OP-BLACKOUT'
                  : key === 'mission_2'
                  ? 'OP-FROSTBITE'
                  : 'OP-IRONCLAD'}
              </button>
            ))}
          </div>

          {scores.length > 0 && (
            <button
              onClick={handleClear}
              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 p-1 hover:bg-red-950/40 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>BORRAR</span>
            </button>
          )}
        </div>

        {/* Scores List */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1 my-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No hay registros tácticos aún. ¡Completa tu primera incursión!
            </div>
          ) : (
            filtered.map((rec, idx) => (
              <div
                key={rec.id}
                className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm ${
                      idx === 0
                        ? 'bg-amber-500 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{rec.playerName}</span>
                      <span className="text-[10px] text-cyan-400 font-bold px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30">
                        {rec.grade}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {rec.gameMode === 'COOP_LOCAL' ? '2P CO-OP' : 'SOLO + IA'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                      {rec.missionName} • {rec.date}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 text-right">
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] justify-end">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{formatTime(rec.timeSeconds)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] justify-end">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>{rec.stealthRank}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-amber-400 font-black text-sm sm:text-base">
                      {rec.score.toLocaleString()} PTS
                    </div>
                    <div className="flex items-center gap-0.5 text-emerald-400 text-[11px] justify-end font-bold">
                      <DollarSign className="w-3 h-3" />
                      <span>{rec.lootValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer close */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};
