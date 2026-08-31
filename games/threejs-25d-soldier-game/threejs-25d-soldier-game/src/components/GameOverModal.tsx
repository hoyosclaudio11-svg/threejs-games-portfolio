import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Home, Crosshair, Award, Clock, Coins } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface GameOverModalProps {
  victory: boolean;
  stats: {
    score: number;
    credits: number;
    waveReached: number;
    kills: number;
    bossesDefeated: number;
    timeSurvivedSec: number;
  };
  soldierName: string;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  victory,
  stats,
  soldierName,
  onRestart,
  onMainMenu,
}) => {
  useEffect(() => {
    if (victory) {
      // Fire confetti bursts
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      const interval = setInterval(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [victory]);

  const minutes = Math.floor(stats.timeSurvivedSec / 60);
  const seconds = stats.timeSurvivedSec % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg font-rajdhani">
      <div className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl space-y-6 ${
        victory 
          ? 'cyber-panel-gold border-amber-400' 
          : 'cyber-panel-danger border-red-500/80'
      }`}>
        
        {/* Banner */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-full mb-3 bg-black/50 border border-current">
            {victory ? (
              <Trophy className="w-10 h-10 text-yellow-400 animate-bounce" />
            ) : (
              <Skull className="w-10 h-10 text-red-500 animate-pulse" />
            )}
          </div>

          <h1 className={`text-3xl md:text-4xl font-orbitron font-black uppercase tracking-wider ${
            victory ? 'text-amber-400 glow-amber' : 'text-red-500 glow-red'
          }`}>
            {victory ? '¡VICTORIA ABSOLUTA!' : 'SOLDADO CAÍDO EN ACCIÓN'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {victory 
              ? 'Has derrotado a Xul\'Gor y purgado la invasión monstruosa del planeta.' 
              : 'Las hordas te han superado. Vuelve a armarte y reintenta la purga.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 p-2 bg-slate-900/60 rounded">
            <Award className="w-5 h-5 text-sky-400" />
            <div>
              <span className="text-[10px] text-slate-400 block font-orbitron">PUNTUACIÓN FINAL</span>
              <span className="text-base font-orbitron font-bold text-white">{stats.score.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-900/60 rounded">
            <Coins className="w-5 h-5 text-yellow-400" />
            <div>
              <span className="text-[10px] text-slate-400 block font-orbitron">CRÉDITOS OBTENIDOS</span>
              <span className="text-base font-orbitron font-bold text-yellow-300">{stats.credits.toLocaleString()} CR</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-900/60 rounded">
            <Crosshair className="w-5 h-5 text-red-400" />
            <div>
              <span className="text-[10px] text-slate-400 block font-orbitron">MONSTRUOS ELIMINADOS</span>
              <span className="text-base font-orbitron font-bold text-white">{stats.kills} bajas</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-900/60 rounded">
            <Trophy className="w-5 h-5 text-purple-400" />
            <div>
              <span className="text-[10px] text-slate-400 block font-orbitron">TITANES / JEFES</span>
              <span className="text-base font-orbitron font-bold text-white">{stats.bossesDefeated} derrotados</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-900/60 rounded">
            <Skull className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 block font-orbitron">OLA ALCANZADA</span>
              <span className="text-base font-orbitron font-bold text-sky-300">Ola {stats.waveReached} / 8</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-900/60 rounded">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-400 block font-orbitron">TIEMPO EN COMBATE</span>
              <span className="text-base font-orbitron font-bold text-white">{timeFormatted}</span>
            </div>
          </div>
        </div>

        {/* Soldier Class Tag */}
        <div className="text-center text-xs text-slate-400">
          Operativo registrado: <span className="text-sky-400 font-bold font-orbitron">{soldierName}</span>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => {
              soundManager.playUIClick();
              onRestart();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 hover:from-sky-500 hover:to-emerald-400 text-black font-orbitron font-black text-sm rounded shadow-lg flex items-center justify-center gap-2 cyber-button"
          >
            <RotateCcw className="w-5 h-5" />
            VOLVER A JUGAR
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick();
              onMainMenu();
            }}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-orbitron font-bold text-xs rounded border border-slate-700 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            MENÚ PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};
