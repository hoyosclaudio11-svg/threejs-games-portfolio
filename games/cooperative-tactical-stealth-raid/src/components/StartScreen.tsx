import React, { useState } from 'react';
import { GameMode, MissionConfig, OperativeClass } from '../types/game';
import { MISSIONS, OPERATIVES } from '../game/levels';
import {
  Shield,
  Zap,
  Users,
  User,
  Crosshair,
  Trophy,
  HelpCircle,
  Play,
  Volume2,
  VolumeX,
  Lock,
  ChevronRight
} from 'lucide-react';
import { audioManager } from '../services/audio';

interface StartScreenProps {
  onStartMission: (mission: MissionConfig, mode: GameMode, p1Class: OperativeClass, p2Class: OperativeClass) => void;
  onOpenHighScores: () => void;
  onOpenHandbook: () => void;
  unlockedMissions: string[];
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartMission,
  onOpenHighScores,
  onOpenHandbook,
  unlockedMissions,
  isMuted,
  onToggleMute,
}) => {
  const [selectedMission, setSelectedMission] = useState<MissionConfig>(MISSIONS[0]);
  const [gameMode, setGameMode] = useState<GameMode>('SOLO_AI');
  const [p1Class, setP1Class] = useState<OperativeClass>('ghost');
  const [p2Class, setP2Class] = useState<OperativeClass>('viper');

  const operativeKeys = Object.keys(OPERATIVES) as OperativeClass[];

  const handleLaunch = () => {
    audioManager.unlockAudio();
    audioManager.playButtonClick();
    onStartMission(selectedMission, gameMode, p1Class, p2Class);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-mono overflow-y-auto select-none">
      {/* Background blueprint tech pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 20%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
            linear-gradient(to right, #1e293b 1px, transparent 1px),
            linear-gradient(to bottom, #1e293b 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 36px 36px, 36px 36px',
        }}
      />

      {/* --- HEADER --- */}
      <header className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/30 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
              SISTEMA TÁCTICO MILITAR CLASIFICADO
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2 mt-1">
            <span>PROTOCOLO</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400">
              FANTASMA
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Incursión & Sigilo Cooperativo • Sincronización Simultánea • Extracción de Botín
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onOpenHandbook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-cyan-400 transition-colors shadow"
          >
            <HelpCircle className="w-4 h-4" />
            <span>MANUAL TÁCTICO</span>
          </button>
          <button
            onClick={onOpenHighScores}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs text-amber-300 hover:text-amber-200 transition-colors shadow"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>RÉCORDS</span>
          </button>
          <button
            onClick={onToggleMute}
            className="p-2 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* --- MAIN GRID: Mission Select, Mode, Loadouts --- */}
      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 my-4">
        {/* Left Column: Game Mode & Mission Selector (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Mode Toggle */}
          <div className="bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2.5 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Modalidad de Incursión</span>
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  audioManager.playButtonClick();
                  setGameMode('SOLO_AI');
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  gameMode === 'SOLO_AI'
                    ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs">SOLO + IA GHOST</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Controla al líder mientras el compañero IA cubre tu espalda y sincroniza accesos.
                </p>
              </button>

              <button
                onClick={() => {
                  audioManager.playButtonClick();
                  setGameMode('COOP_LOCAL');
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  gameMode === 'COOP_LOCAL'
                    ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs">COOPERATIVO 2P</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  2 Jugadores en el mismo teclado o pantalla táctil simultánea.
                </p>
              </button>
            </div>
          </div>

          {/* Mission Select List */}
          <div className="bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2.5 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                <span>Seleccionar Misión de Infiltración</span>
              </h2>

              <div className="space-y-2">
                {MISSIONS.map(m => {
                  const isSelected = selectedMission.id === m.id;
                  const isUnlocked = unlockedMissions.includes(m.id);

                  return (
                    <button
                      key={m.id}
                      disabled={!isUnlocked}
                      onClick={() => {
                        audioManager.playButtonClick();
                        setSelectedMission(m);
                      }}
                      className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-400 shadow-lg shadow-emerald-950/40 text-white'
                          : isUnlocked
                          ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-cyan-400">{m.code}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              m.difficulty === 'EASY'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                                : m.difficulty === 'MEDIUM'
                                ? 'bg-amber-950 text-amber-400 border border-amber-600/40'
                                : 'bg-red-950 text-red-400 border border-red-600/40'
                            }`}
                          >
                            {m.difficulty}
                          </span>
                        </div>
                        <div className="font-bold text-xs mt-0.5">{m.name}</div>
                        <div className="text-[10px] text-slate-400">{m.location}</div>
                      </div>

                      <div className="text-right">
                        {isUnlocked ? (
                          <div className="text-emerald-400 font-bold text-xs">
                            ${m.targetLootValue.toLocaleString()}
                          </div>
                        ) : (
                          <Lock className="w-4 h-4 text-slate-600 ml-auto" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mission Briefing */}
            <div className="mt-4 p-3 bg-slate-900/80 rounded border border-slate-800 text-xs">
              <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1">
                Briefing Táctico:
              </div>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                {selectedMission.briefing.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Operative Customization / Loadouts (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Equipo y Agentes Tácticos</span>
              </span>
              <span className="text-[10px] text-slate-500">SELECCIÓN DE CLASE</span>
            </h2>

            {/* Two Agents Loadout Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agent 1 */}
              <div className="p-3 bg-slate-900/70 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: OPERATIVES[p1Class].avatarColor }}
                    />
                    <span className="font-bold text-xs text-white">AGENTE 01 (ALPHA)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">
                    {gameMode === 'SOLO_AI' ? 'LÍDER' : 'JUGADOR 1'}
                  </span>
                </div>

                {/* Class Selector Buttons */}
                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  {operativeKeys.map(key => (
                    <button
                      key={key}
                      onClick={() => {
                        audioManager.playButtonClick();
                        setP1Class(key);
                      }}
                      className={`px-2 py-1.5 rounded text-xs font-bold transition-all ${
                        p1Class === key
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-400 shadow'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                      }`}
                    >
                      {OPERATIVES[key].name}
                    </button>
                  ))}
                </div>

                {/* Selected Op Details */}
                <div className="text-[11px] space-y-1 text-slate-300">
                  <div className="font-bold text-emerald-400">{OPERATIVES[p1Class].role}</div>
                  <div className="text-[10px] text-slate-400">{OPERATIVES[p1Class].description}</div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-300 pt-1">
                    <Zap className="w-3 h-3" />
                    <span>{OPERATIVES[p1Class].specialAbility}</span>
                  </div>
                </div>
              </div>

              {/* Agent 2 */}
              <div className="p-3 bg-slate-900/70 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: OPERATIVES[p2Class].avatarColor }}
                    />
                    <span className="font-bold text-xs text-white">AGENTE 02 (BRAVO)</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 uppercase font-bold">
                    {gameMode === 'SOLO_AI' ? 'COMPAÑERO IA' : 'JUGADOR 2'}
                  </span>
                </div>

                {/* Class Selector Buttons */}
                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  {operativeKeys.map(key => (
                    <button
                      key={key}
                      onClick={() => {
                        audioManager.playButtonClick();
                        setP2Class(key);
                      }}
                      className={`px-2 py-1.5 rounded text-xs font-bold transition-all ${
                        p2Class === key
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                      }`}
                    >
                      {OPERATIVES[key].name}
                    </button>
                  ))}
                </div>

                {/* Selected Op Details */}
                <div className="text-[11px] space-y-1 text-slate-300">
                  <div className="font-bold text-cyan-400">{OPERATIVES[p2Class].role}</div>
                  <div className="text-[10px] text-slate-400">{OPERATIVES[p2Class].description}</div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-300 pt-1">
                    <Zap className="w-3 h-3" />
                    <span>{OPERATIVES[p2Class].specialAbility}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Quick Reference Card */}
          <div className="bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl p-3.5 shadow-xl text-[11px] text-slate-300">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center justify-between">
              <span>Esquema de Controles</span>
              <span className="text-cyan-400">TECLADO & PANTALLA TÁCTIL</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-emerald-400 font-bold text-[10px] mb-1">JUGADOR 1 (ALPHA)</div>
                <div><span className="text-white font-bold">[W/A/S/D]</span> Moverse</div>
                <div><span className="text-white font-bold">[ESPACIO / CLIC]</span> Disparar / Derribo</div>
                <div><span className="text-white font-bold">[F / TOUCH]</span> Interactuar / Sincronizar / Reanimar</div>
                <div><span className="text-white font-bold">[Q]</span> Granada de Humo / Gadget | <span className="text-white font-bold">[R]</span> Recargar</div>
              </div>

              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-cyan-400 font-bold text-[10px] mb-1">JUGADOR 2 (BRAVO) / IA</div>
                <div><span className="text-white font-bold">[FLECHAS]</span> Moverse (Modo 2P)</div>
                <div><span className="text-white font-bold">[R-SHIFT / K]</span> Disparar</div>
                <div><span className="text-white font-bold">[ENTER / L]</span> Interactuar / Sincronizar</div>
                <div><span className="text-white font-bold">[P]</span> Gadget | <span className="text-cyan-300 font-bold">(Modo IA: Sincroniza y asiste en auto)</span></div>
              </div>
            </div>
          </div>

          {/* Giant Launch Button */}
          <button
            onClick={handleLaunch}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black tracking-widest text-lg sm:text-xl shadow-2xl shadow-cyan-950/60 border border-emerald-300 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Play className="w-6 h-6 fill-current text-white" />
            <span>DESPLEGAR EN {selectedMission.code}</span>
          </button>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800">
        <div>PROTOCOLO FANTASMA v2.4 • MOTOR CANVAS 60 FPS • HÁPTICA ACTIVADA</div>
        <div>COOPERACIÓN TÁCTICA OBLIGATORIA</div>
      </footer>
    </div>
  );
};
