import React, { useState } from 'react';
import { TrackStage, CarSpec } from '../types/game';
import { RALLY_STAGES } from '../game/tracks';
import { RALLY_CARS } from '../game/cars';
import { getBestTimeForStage } from '../utils/storage';
import {
  Play,
  Trophy,
  Settings as SettingsIcon,
  Zap,
  Gauge,
  Flame,
} from 'lucide-react';

interface StartScreenProps {
  selectedStage: TrackStage;
  selectedCar: CarSpec;
  onSelectStage: (stage: TrackStage) => void;
  onSelectCar: (car: CarSpec) => void;
  onStartGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  selectedStage,
  selectedCar,
  onSelectStage,
  onSelectCar,
  onStartGame,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'stage' | 'car' | 'guide'>('stage');

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '--:--.---';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const getSurfaceBadge = (surface: string) => {
    switch (surface) {
      case 'snow':
      case 'ice':
        return 'bg-sky-500/20 text-sky-300 border-sky-400';
      case 'gravel':
        return 'bg-amber-500/20 text-amber-300 border-amber-500';
      case 'mud':
        return 'bg-yellow-700/30 text-yellow-400 border-yellow-600';
      case 'tarmac':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500';
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto p-4 md:p-8">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-mono-data font-black text-xs uppercase tracking-wider">
              PRECISION SIM
            </span>
            <span className="text-xs font-mono-data text-slate-400 uppercase tracking-widest">
              WRC / STAGE CHAMPIONSHIP
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-chakra font-black tracking-tight text-white uppercase mt-1 drop-shadow-md">
            APEX <span className="text-cyan-400">RALLY</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mt-0.5">
            Domina la transferencia de peso, el freno de mano y el control de tracción en barro, nieve y grava.
          </p>
        </div>

        {/* Action buttons in header */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onOpenLeaderboard}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-200 text-sm font-semibold transition active:scale-95 shadow-md"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Récords</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-200 transition active:scale-95 shadow-md"
            title="Ajustes"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 my-4 flex-1 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('stage')}
            className={`px-5 py-2 rounded-xl text-sm font-chakra font-bold transition ${
              activeTab === 'stage'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            1. SELECCIONAR ETAPA ({selectedStage.name})
          </button>
          <button
            onClick={() => setActiveTab('car')}
            className={`px-5 py-2 rounded-xl text-sm font-chakra font-bold transition ${
              activeTab === 'car'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            2. GARAJE & VEHÍCULO ({selectedCar.name})
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-5 py-2 rounded-xl text-sm font-chakra font-bold transition ${
              activeTab === 'guide'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            GUÍA DE RALLY & TÉCNICA
          </button>
        </div>

        {/* TAB 1: STAGE SELECT */}
        {activeTab === 'stage' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {RALLY_STAGES.map((stage) => {
              const isSelected = stage.id === selectedStage.id;
              const stageBest = getBestTimeForStage(stage.id);

              return (
                <div
                  key={stage.id}
                  onClick={() => onSelectStage(stage)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.02]'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/30 hover:bg-slate-900/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{stage.flag}</span>
                      <span
                        className={`text-[10px] font-mono-data font-bold px-2 py-0.5 rounded-full border uppercase ${getSurfaceBadge(
                          stage.primarySurface
                        )}`}
                      >
                        {stage.primarySurface}
                      </span>
                    </div>

                    <h3 className="font-chakra font-bold text-lg text-white mt-2 leading-snug">
                      {stage.name}
                    </h3>
                    <p className="text-xs font-mono-data text-slate-400">{stage.location}</p>

                    <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-xs font-mono-data">
                    <div className="flex justify-between text-slate-400">
                      <span>DISTANCIA:</span>
                      <span className="text-white font-bold">{stage.totalDistanceMeters}m</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>DIFICULTAD:</span>
                      <span
                        className={`font-bold ${
                          stage.difficulty === 'Extreme'
                            ? 'text-red-400'
                            : stage.difficulty === 'Hard'
                            ? 'text-orange-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {stage.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>RÉCORD:</span>
                      <span className="text-cyan-300 font-bold">{formatTime(stageBest)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CAR GARAGE */}
        {activeTab === 'car' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RALLY_CARS.map((car) => {
              const isSelected = car.id === selectedCar.id;

              return (
                <div
                  key={car.id}
                  onClick={() => onSelectCar(car)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.02]'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/30 hover:bg-slate-900/80'
                  }`}
                >
                  <div>
                    {/* Livery Color Sample Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: car.color }}
                        />
                        <span className="font-mono-data font-bold text-xs px-2 py-0.5 rounded bg-black/60 border border-white/15 text-yellow-400">
                          {car.drivetrain}
                        </span>
                      </div>
                      <span className="text-xs font-mono-data text-slate-400">{car.class}</span>
                    </div>

                    <h3 className="font-chakra font-black text-xl text-white">{car.name}</h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{car.description}</p>
                  </div>

                  {/* Telemetry Stats Bars */}
                  <div className="mt-5 space-y-2 text-xs font-mono-data">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>POTENCIA:</span>
                        <span className="text-white font-bold">{car.horsePower} HP</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${(car.horsePower / 550) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>AGARRE & TRACCIÓN:</span>
                        <span className="text-white font-bold">{Math.round(car.gripFactor * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${(car.gripFactor / 1.4) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>MANIOBRABILIDAD (DRIFT):</span>
                        <span className="text-white font-bold">{car.handling}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${car.handling}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between text-slate-400 border-t border-white/10">
                      <span>PESO: <strong className="text-white">{car.weightKg} kg</strong></span>
                      <span>VEL. MÁX: <strong className="text-white">{car.topSpeedKmh} km/h</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: RALLY GUIDE & TECHNIQUES */}
        {activeTab === 'guide' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/15">
              <div className="flex items-center gap-2 text-cyan-400 font-chakra font-bold text-lg mb-2">
                <Zap className="w-5 h-5" />
                <span>SCANDINAVIAN FLICK</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Antes de una horquilla cerrada, gira bruscamente en dirección contraria, suelta el acelerador para cargar peso al eje delantero y gira con fuerza hacia el vértice. La inercia balanceará la trasera perfectamente para derrapar sin perder velocidad.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/15">
              <div className="flex items-center gap-2 text-red-400 font-chakra font-bold text-lg mb-2">
                <Flame className="w-5 h-5" />
                <span>FRENO DE MANO (E-BRAKE)</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Presiona la barra espaciadora o el botón rojo <strong>[E-BRAKE]</strong> por una fracción de segundo para bloquear las ruedas traseras. Ideal para horquillas de primera marcha en barro y nieve profunda.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/15">
              <div className="flex items-center gap-2 text-amber-400 font-chakra font-bold text-lg mb-2">
                <Gauge className="w-5 h-5" />
                <span>SUPERFICIES & TRACCIÓN</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong>Nieve/Hielo:</strong> Frena muy temprano y evita acelerar a fondo en curva.<br />
                <strong>Barro:</strong> Gran resistencia al avance; mantén el turbo cargado con RPM altas.<br />
                <strong>Grava:</strong> Derrapes largos y predecibles; usa contravolante suave.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER LAUNCH BAR */}
      <footer className="relative z-10 border-t border-white/10 pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Active Stage & Car summary */}
        <div className="flex items-center gap-4 text-xs font-mono-data text-slate-300">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10">
            <span>ETAPA:</span>
            <span className="text-cyan-300 font-bold">{selectedStage.name}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10">
            <span>AUTO:</span>
            <span className="text-yellow-400 font-bold">{selectedCar.name} ({selectedCar.drivetrain})</span>
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={onStartGame}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-chakra font-black text-xl tracking-wider uppercase transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>¡INICIAR TRAMO CRONOMETRADO!</span>
        </button>
      </footer>
    </div>
  );
};
