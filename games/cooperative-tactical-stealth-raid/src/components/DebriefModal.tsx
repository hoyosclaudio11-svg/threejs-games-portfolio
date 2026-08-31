import React, { useEffect } from 'react';
import { MissionResult } from '../types/game';
import {
  Trophy,
  DollarSign,
  Clock,
  Skull,
  ShieldAlert,
  RotateCcw,
  Home,
  CheckCircle,
  XCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '../services/audio';

interface DebriefModalProps {
  result: MissionResult;
  onRestart: () => void;
  onNextMission?: () => void;
  onMainMenu: () => void;
  onOpenHighScores: () => void;
  hasNextMission: boolean;
}

export const DebriefModal: React.FC<DebriefModalProps> = ({
  result,
  onRestart,
  onNextMission,
  onMainMenu,
  onOpenHighScores,
  hasNextMission,
}) => {
  useEffect(() => {
    if (result.success) {
      // Trigger festive tactical confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#f59e0b', '#38bdf8'],
        });
      } catch {}
    }
  }, [result.success]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S+':
      case 'S':
        return 'text-amber-400 border-amber-400 bg-amber-950/60 shadow-amber-500/50';
      case 'A':
        return 'text-emerald-400 border-emerald-400 bg-emerald-950/60 shadow-emerald-500/50';
      case 'B':
        return 'text-cyan-400 border-cyan-400 bg-cyan-950/60 shadow-cyan-500/50';
      case 'C':
        return 'text-blue-400 border-blue-400 bg-blue-950/60 shadow-blue-500/50';
      default:
        return 'text-red-400 border-red-500 bg-red-950/60 shadow-red-500/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-300">
      <div className="bg-slate-900/95 border-2 border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 ${
            result.success ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400' : 'bg-red-600'
          }`}
        />

        {/* --- Header --- */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                DEBRIEFING TÁCTICO
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {result.success ? '¡MISIÓN CUMPLIDA - EXTRACCIÓN EXITOSA!' : 'INCURSIÓN FALLIDA: AGENTES CAÍDOS'}
            </h2>
            <div className="text-xs text-cyan-400 font-semibold">{result.missionName}</div>
          </div>

          {/* Grade Badge */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl ${getGradeColor(
              result.grade
            )}`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-300">RANGO</span>
            <span className="text-2xl sm:text-3xl font-black leading-none">{result.grade}</span>
          </div>
        </div>

        {/* --- Stats Grid --- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4">
          {/* Loot */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Botín Asegurado</span>
            </div>
            <div className="text-base font-bold text-emerald-400">
              ${result.lootCollected.toLocaleString()}
            </div>
          </div>

          {/* Time */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tiempo Total</span>
            </div>
            <div className="text-base font-bold text-cyan-300">
              {formatTime(result.timeTaken)}
            </div>
          </div>

          {/* Score */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Puntuación Final</span>
            </div>
            <div className="text-base font-bold text-amber-400">
              {Math.floor(result.score).toLocaleString()}
            </div>
          </div>

          {/* Stealth Kills */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Skull className="w-3.5 h-3.5 text-purple-400" />
              <span>Bajas Sigilosas</span>
            </div>
            <div className="text-sm font-bold text-white">
              {result.stealthKills} / {result.enemiesDowned}
            </div>
          </div>

          {/* Alarms */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Alarmas General</span>
            </div>
            <div className={`text-sm font-bold ${result.alarmsTriggered === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.alarmsTriggered === 0 ? '0 (FANTASMA PURO)' : `${result.alarmsTriggered} ALARMA(S)`}
            </div>
          </div>

          {/* Sync Hacks */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Sincronizaciones</span>
            </div>
            <div className="text-sm font-bold text-cyan-300">
              {result.syncHacksCompleted} Hacks
            </div>
          </div>
        </div>

        {/* --- Action Buttons --- */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-5">
          {/* Instant Retry */}
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onRestart();
            }}
            className="w-full sm:flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>REINTENTAR [R]</span>
          </button>

          {/* Next Mission (if victory and exists) */}
          {result.success && hasNextMission && onNextMission && (
            <button
              onClick={() => {
                audioManager.playButtonClick();
                onNextMission();
              }}
              className="w-full sm:flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-950/60"
            >
              <span>SIGUIENTE MISIÓN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Leaderboards */}
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onOpenHighScores();
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>RÉCORDS</span>
          </button>

          {/* Return to Base Menu */}
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onMainMenu();
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>MENÚ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
