import React, { useState } from 'react';
import { TacticalEngine } from '../game/engine';
import { OPERATIVES } from '../game/levels';
import {
  Shield,
  Activity,
  Crosshair,
  Volume2,
  VolumeX,
  Pause,
  Clock,
  DollarSign,
  AlertTriangle,
  Radio,
  Zap,
  CheckCircle2,
  Circle,
  HelpCircle
} from 'lucide-react';

interface TacticalHUDProps {
  engine: TacticalEngine;
  onPause: () => void;
  onOpenHandbook: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  engine,
  onPause,
  onOpenHandbook,
  onToggleMute,
  isMuted,
}) => {
  const [showObjectives, setShowObjectives] = useState(true);

  const p1 = engine.p1;
  const p2 = engine.p2;
  const op1 = OPERATIVES[p1.operativeClass];
  const op2 = OPERATIVES[p2.operativeClass];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 font-mono select-none overflow-hidden">
      {/* --- TOP BAR: Mission Intel & Alarm Meter --- */}
      <div className="flex items-start justify-between gap-2 z-10">
        {/* Left: Mission & Objectives Toggle */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur border border-cyan-500/30 px-3 py-1.5 rounded text-xs text-cyan-400 shadow-lg shadow-cyan-950/40">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-bold tracking-wider uppercase">{engine.mission.code}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 truncate max-w-[140px] sm:max-w-[220px]">{engine.mission.name}</span>
            <button
              onClick={() => setShowObjectives(!showObjectives)}
              className="ml-2 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-cyan-300 rounded border border-cyan-500/30 transition-colors"
            >
              {showObjectives ? 'OCULTAR' : 'OBJETIVOS'}
            </button>
          </div>

          {/* Objectives Drawer */}
          {showObjectives && (
            <div className="bg-slate-950/90 backdrop-blur border border-slate-700/60 p-2.5 rounded text-[11px] max-w-[320px] shadow-xl text-slate-300 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                <span>Directivas de Misión</span>
                <span className="text-emerald-400">+{engine.mission.targetLootValue.toLocaleString()} $</span>
              </div>
              <div className="space-y-1">
                {engine.mission.objectives.map(obj => (
                  <div key={obj.id} className="flex items-start gap-1.5">
                    {obj.isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <span className={obj.isCompleted ? 'text-emerald-300 line-through' : 'text-slate-200'}>
                      {obj.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: ALARM STATUS & LOOT EXTRACTED */}
        <div className="flex flex-col items-center gap-1">
          {/* Alarm Banner */}
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-lg backdrop-blur transition-all duration-300 ${
              engine.isAlarmLockdown
                ? 'bg-red-950/90 border-red-500 text-red-400 shadow-red-900/50 animate-bounce'
                : engine.alarmLevel > 0
                ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400 shadow-emerald-950/30'
            }`}
          >
            {engine.isAlarmLockdown ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400 animate-spin" />
                <span className="text-xs font-black tracking-widest uppercase">
                  ¡CÓDIGO ROJO: RESPUESTA SWAT ACTIVA!
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold tracking-wider uppercase">
                  ESTADO DE SIGILO: INDETECTADO
                </span>
              </>
            )}
          </div>

          {/* Loot & Time */}
          <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur border border-slate-700/50 px-3 py-1 rounded text-xs text-slate-200 shadow">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>${engine.totalLootExtracted.toLocaleString()}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 text-cyan-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(engine.missionTime)}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="text-amber-400 font-semibold">
              PTS: {Math.floor(engine.totalScore).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls (Pause, Handbook, Mute) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={onOpenHandbook}
            title="Manual Táctico"
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 rounded shadow transition-colors active:scale-95"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/60 rounded shadow transition-colors active:scale-95"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onPause}
            title="Pausar Partida (ESC)"
            className="p-2 bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 rounded shadow transition-colors active:scale-95"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- CENTER ALERTS TICKER --- */}
      <div className="flex flex-col items-center gap-1.5 my-auto max-w-lg mx-auto w-full pointer-events-none">
        {engine.alerts.slice(0, 3).map((alert, idx) => (
          <div
            key={alert.id}
            className={`px-4 py-1.5 rounded text-xs sm:text-sm font-bold tracking-wide backdrop-blur border shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95 ${
              alert.type === 'sync'
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-cyan-900/40'
                : alert.type === 'alarm'
                ? 'bg-red-950/90 border-red-500 text-red-300 shadow-red-900/50'
                : alert.type === 'downed'
                ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-amber-900/50'
                : alert.type === 'loot'
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-900/40'
                : 'bg-slate-900/90 border-slate-600 text-slate-200'
            }`}
            style={{ opacity: 1 - idx * 0.2 }}
          >
            {alert.text}
          </div>
        ))}
      </div>

      {/* --- BOTTOM BAR: Operative 1 & Operative 2 Status Bars --- */}
      <div className="flex items-end justify-between gap-2 z-10">
        {/* Operative 1 (Alpha - Left) */}
        <div
          className={`p-3 rounded-lg border backdrop-blur shadow-2xl transition-all max-w-[280px] sm:max-w-[320px] w-full ${
            p1.isDowned
              ? 'bg-red-950/90 border-red-500/80 shadow-red-950/60 animate-pulse'
              : 'bg-slate-950/90 border-emerald-500/40 shadow-emerald-950/20'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow"
                style={{ backgroundColor: p1.color }}
              />
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                P1: {op1.name}
              </span>
              <span className="text-[10px] text-slate-400">({op1.role.split(' ')[0]})</span>
            </div>
            {p1.isDowned && (
              <span className="text-[10px] font-bold text-red-400 bg-red-900/60 px-1.5 py-0.5 rounded">
                ¡CAÍDO ({Math.ceil(p1.downedTimer)}s)!
              </span>
            )}
          </div>

          {/* Health & Armor Bars */}
          <div className="space-y-1 mb-2">
            {/* HP */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <Activity className="w-3 h-3 text-red-400 shrink-0" />
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-emerald-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, (p1.hp / p1.maxHp) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-300 w-8 text-right font-bold">
                {Math.ceil(p1.hp)}
              </span>
            </div>

            {/* Armor */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, (p1.armor / p1.maxArmor) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-cyan-300 w-8 text-right">
                {Math.ceil(p1.armor)}
              </span>
            </div>
          </div>

          {/* Weapon & Gadget slots */}
          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span className={p1.ammo <= 3 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-200'}>
                {p1.ammo} / {op1.primaryWeapon.magSize}
              </span>
              {p1.isReloading && (
                <span className="text-[10px] text-cyan-400 animate-pulse">RECARGANDO...</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-300">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{p1.gadgetType.replace('_', ' ').toUpperCase()}:</span>
              <span className="text-amber-400 font-bold">{p1.gadgetCount}</span>
            </div>
          </div>
        </div>

        {/* Operative 2 (Bravo - Right) */}
        <div
          className={`p-3 rounded-lg border backdrop-blur shadow-2xl transition-all max-w-[280px] sm:max-w-[320px] w-full ${
            p2.isDowned
              ? 'bg-red-950/90 border-red-500/80 shadow-red-950/60 animate-pulse'
              : 'bg-slate-950/90 border-cyan-500/40 shadow-cyan-950/20'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow"
                style={{ backgroundColor: p2.color }}
              />
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                {engine.gameMode === 'SOLO_AI' ? 'COMPAÑERO IA' : 'P2'}: {op2.name}
              </span>
            </div>
            {p2.isDowned ? (
              <span className="text-[10px] font-bold text-red-400 bg-red-900/60 px-1.5 py-0.5 rounded">
                ¡CAÍDO ({Math.ceil(p2.downedTimer)}s)!
              </span>
            ) : engine.gameMode === 'SOLO_AI' ? (
              <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30">
                COBERTURA AUTOMÁTICA
              </span>
            ) : null}
          </div>

          {/* Health & Armor Bars */}
          <div className="space-y-1 mb-2">
            {/* HP */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <Activity className="w-3 h-3 text-red-400 shrink-0" />
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-cyan-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, (p2.hp / p2.maxHp) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-300 w-8 text-right font-bold">
                {Math.ceil(p2.hp)}
              </span>
            </div>

            {/* Armor */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, (p2.armor / p2.maxArmor) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-cyan-300 w-8 text-right">
                {Math.ceil(p2.armor)}
              </span>
            </div>
          </div>

          {/* Weapon & Gadget slots */}
          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {p2.ammo} / {op2.primaryWeapon.magSize}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-300">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{p2.gadgetType.replace('_', ' ').toUpperCase()}:</span>
              <span className="text-amber-400 font-bold">{p2.gadgetCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
