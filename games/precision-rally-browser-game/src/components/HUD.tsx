import React from 'react';
import {
  VehiclePhysicsState,
  TrackStage,
  PaceNote,
  GhostPoint,
  GameSettings,
} from '../types/game';
import { PaceNoteBanner } from './PaceNoteBanner';
import { MiniMap } from './MiniMap';
import { Pause, RotateCcw, Volume2, VolumeX, Eye } from 'lucide-react';

interface HUDProps {
  car: VehiclePhysicsState;
  track: TrackStage;
  currentNote: PaceNote | null;
  distanceToNote: number;
  stageTime: number;
  bestTime: number | null;
  currentSectorIndex: number;
  sectorSplits: { sectorId: number; time: number; delta: number }[];
  ghost: GhostPoint | null;
  settings: GameSettings;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
  onToggleCamera: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  car,
  track,
  currentNote,
  distanceToNote,
  stageTime,
  bestTime,
  currentSectorIndex,
  sectorSplits,
  ghost,
  settings,
  isMuted,
  onToggleMute,
  onPause,
  onRestart,
  onToggleCamera,
}) => {
  // Format stage time (MM:SS.ms)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const speedDisplay =
    settings.speedUnit === 'mph' ? Math.round(car.speedKmh * 0.621371) : car.speedKmh;
  const speedUnitText = settings.speedUnit === 'mph' ? 'MPH' : 'KM/H';

  // Calculate live delta vs Best Time (or par time if no ghost)
  const targetTimeAtDistance =
    ((car.distanceTravelled / track.totalDistanceMeters) * (bestTime || track.parTimeSeconds)) ||
    1;
  const liveDelta = stageTime - targetTimeAtDistance;

  // Surface colors and labels
  const surfaceInfo: Record<string, { label: string; color: string; badge: string }> = {
    tarmac: { label: 'TARMAC', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500' },
    gravel: { label: 'GRAVEL', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500' },
    mud: { label: 'DEEP MUD', color: 'text-yellow-600', badge: 'bg-yellow-600/20 border-yellow-600' },
    snow: { label: 'SNOW', color: 'text-sky-300', badge: 'bg-sky-500/20 border-sky-400' },
    ice: { label: 'BLACK ICE', color: 'text-cyan-300', badge: 'bg-cyan-500/20 border-cyan-400' },
    grass: { label: 'OFF-TRACK', color: 'text-red-400', badge: 'bg-red-500/20 border-red-500' },
  };

  const currentSurface = surfaceInfo[car.surfaceCurrent] || surfaceInfo.tarmac;

  // RPM percentage
  const rpmPct = Math.min(100, (car.rpm / 8500) * 100);
  const isRedline = car.rpm > 7600;

  // Stage progress percentage
  const progressPct = Math.min(100, (car.distanceTravelled / track.totalDistanceMeters) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 md:p-6 overflow-hidden">
      {/* 1. TOP BAR: Progress, Stage Info, Live Timing & Quick Actions */}
      <div className="flex flex-col gap-2 w-full max-w-5xl mx-auto">
        {/* Stage Progress Bar with Sectors */}
        <div className="relative w-full h-2.5 bg-slate-900/80 rounded-full border border-white/20 overflow-hidden shadow-md">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-75"
            style={{ width: `${progressPct}%` }}
          />
          {/* Sector Gate Markers on Progress Bar */}
          {track.sectors.map((sec, idx) => {
            const secPct = (sec.distanceMeters / track.totalDistanceMeters) * 100;
            return (
              <div
                key={sec.id}
                className="absolute top-0 bottom-0 w-0.5 bg-white/60"
                style={{ left: `${secPct}%` }}
                title={`Sector ${idx + 1}`}
              />
            );
          })}
        </div>

        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Stage Title & Location */}
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/15 backdrop-blur-md flex items-center gap-2">
              <span className="text-xl">{track.flag}</span>
              <div>
                <div className="text-xs font-mono-data text-slate-400 uppercase leading-none">
                  {track.location}
                </div>
                <div className="text-sm md:text-base font-chakra font-bold text-white tracking-wide leading-tight">
                  {track.name}
                </div>
              </div>
            </div>

            {/* Surface Badge */}
            <div
              className={`hidden sm:flex px-2.5 py-1 rounded-lg border text-xs font-mono-data font-bold uppercase backdrop-blur-md ${currentSurface.badge} ${currentSurface.color}`}
            >
              {currentSurface.label}
            </div>

            {/* Current Sector Badge */}
            <div className="hidden md:flex px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono-data font-bold uppercase">
              SECTOR {currentSectorIndex + 1}/{track.sectors.length}
            </div>
          </div>

          {/* Center: Stage Live Timer & Delta */}
          <div className="flex flex-col items-center">
            <div className="px-4 py-1.5 rounded-xl bg-slate-950/85 border border-white/20 backdrop-blur-md shadow-xl flex items-center gap-3">
              <span className="text-xl sm:text-2xl md:text-3xl font-mono-data font-bold text-white tracking-wider">
                {formatTime(stageTime)}
              </span>

              {/* Delta Comparison */}
              <div
                className={`px-2 py-0.5 rounded text-xs font-mono-data font-bold ${
                  liveDelta <= 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
              >
                {liveDelta <= 0 ? '' : '+'}
                {liveDelta.toFixed(2)}s
              </div>
            </div>

            {/* Target / Par time */}
            <div className="text-[10px] font-mono-data text-slate-400 mt-0.5">
              TARGET: {formatTime(bestTime || track.parTimeSeconds)}
            </div>
          </div>

          {/* Right: Quick Action Buttons & Mini-Map */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleCamera}
              title="Cambiar Cámara (C)"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/20 text-slate-300 hover:text-white transition shadow-lg active:scale-95"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              title="Silenciar Audio"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/20 text-slate-300 hover:text-white transition shadow-lg active:scale-95"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onRestart}
              title="Reiniciar Etapa (R)"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/20 text-amber-400 hover:text-amber-300 transition shadow-lg active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onPause}
              title="Pausar (Esc)"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/20 text-white transition shadow-lg active:scale-95"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Co-Driver Pace Note Banner & Sector Popups */}
      <div className="flex flex-col items-center gap-3 my-auto">
        {settings.showPaceNotes && (
          <PaceNoteBanner currentNote={currentNote} distanceToNote={distanceToNote} />
        )}

        {/* Sector Split Notification Toast */}
        {sectorSplits.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-slate-950/90 border border-cyan-500 text-xs font-mono-data text-cyan-300 shadow-xl animate-fade-in">
            <span>SECTOR {sectorSplits[sectorSplits.length - 1].sectorId} SPLIT:</span>
            <span className="font-bold text-white">
              {formatTime(sectorSplits[sectorSplits.length - 1].time)}
            </span>
            <span
              className={`font-bold ${
                sectorSplits[sectorSplits.length - 1].delta <= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              ({sectorSplits[sectorSplits.length - 1].delta <= 0 ? '' : '+'}
              {sectorSplits[sectorSplits.length - 1].delta.toFixed(2)}s)
            </span>
          </div>
        )}

        {/* Drift Status Banner */}
        {car.isDrifting && (
          <div className="px-3 py-1 rounded-lg bg-black/75 border border-amber-500/60 backdrop-blur-md flex items-center gap-2 shadow-lg shadow-amber-500/20">
            <span className="font-chakra font-bold text-amber-400 text-sm tracking-wider uppercase animate-pulse">
              DRIFT // {Math.round(car.driftAngle * (180 / Math.PI))}°
            </span>
            <span className="text-xs font-mono-data font-bold text-white bg-amber-600/40 px-1.5 py-0.5 rounded">
              +{car.driftScore} PTS
            </span>
          </div>
        )}

        {/* Handbrake Warning Flash */}
        {car.handbrake && (
          <div className="px-3 py-1 rounded-lg bg-red-600/90 border border-white text-white font-chakra font-bold text-sm tracking-widest uppercase shadow-lg shadow-red-600/60 animate-bounce">
            [ HANDBRAKE LOCK ]
          </div>
        )}

        {/* Airborne Flight Flash */}
        {car.isAirborne && (
          <div className="px-3 py-1 rounded-lg bg-cyan-600/80 border border-cyan-300 text-white font-chakra font-bold text-sm tracking-widest uppercase shadow-lg animate-pulse">
            AIRBORNE JUMP!
          </div>
        )}
      </div>

      {/* 3. BOTTOM BAR: Telemetry Gauges (Speed, Gear, RPM, Boost, G-Meter) + Radar Map */}
      <div className="flex items-end justify-between w-full max-w-5xl mx-auto">
        {/* Left: Mini-Map Radar */}
        <div className="hidden sm:block">
          <MiniMap track={track} car={car} ghost={ghost} />
        </div>

        {/* Right / Center: Digital Telemetry Gauge Cluster */}
        <div className="flex items-end gap-3 p-3 rounded-2xl bg-slate-950/85 border border-white/20 backdrop-blur-md shadow-2xl">
          {/* G-Force Ball Meter */}
          <div className="hidden md:flex flex-col items-center justify-center p-2 rounded-xl bg-black/40 border border-white/10 w-16 h-16 relative">
            <div className="absolute top-1 text-[8px] font-mono-data text-slate-400">G-FORCE</div>
            <div className="w-10 h-10 rounded-full border border-slate-700 relative flex items-center justify-center">
              <div
                className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400"
                style={{
                  transform: `translate(${Math.max(-14, Math.min(14, car.lateralG * 10))}px, ${Math.max(
                    -14,
                    Math.min(14, car.longitudinalG * 10)
                  )}px)`,
                }}
              />
            </div>
            <div className="absolute bottom-1 text-[8px] font-mono-data text-slate-300">
              {Math.abs(car.lateralG).toFixed(1)}G
            </div>
          </div>

          {/* Speed & Gear Block */}
          <div className="flex flex-col items-center px-3">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-mono-data font-black text-white tracking-tighter drop-shadow">
                {speedDisplay}
              </span>
              <span className="text-xs font-chakra font-bold text-slate-400 uppercase">
                {speedUnitText}
              </span>
            </div>

            {/* Gear and Boost */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono-data text-slate-400">GEAR</span>
                <span className="font-chakra font-bold text-base text-yellow-400 px-1.5 py-0.2 bg-white/10 rounded border border-yellow-400/30">
                  {car.gear}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono-data text-slate-400">BOOST</span>
                <span className="font-mono-data font-bold text-xs text-cyan-300">
                  {car.boostPressure.toFixed(1)} BAR
                </span>
              </div>
            </div>
          </div>

          {/* Tachometer RPM Gauge & Shift Lights */}
          <div className="flex flex-col gap-1 w-28 md:w-36">
            <div className="flex items-center justify-between text-[10px] font-mono-data text-slate-400">
              <span>RPM {Math.round(car.rpm)}</span>
              <span className={isRedline ? 'text-red-400 font-bold animate-pulse' : ''}>8.5K</span>
            </div>

            {/* RPM Segments */}
            <div className="h-3.5 w-full bg-slate-900 rounded-md p-0.5 border border-white/15 overflow-hidden flex gap-0.5">
              <div
                className={`h-full rounded-sm transition-all duration-75 ${
                  isRedline
                    ? 'bg-red-500 animate-pulse shadow-md shadow-red-500'
                    : car.rpm > 6000
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${rpmPct}%` }}
              />
            </div>

            {/* Shift alert indicators */}
            <div className="flex justify-between gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map((i) => {
                const active = car.rpm >= 3500 + i * 900;
                return (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-sm ${
                      active
                        ? i === 5
                          ? 'bg-red-500 animate-pulse'
                          : i >= 4
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
