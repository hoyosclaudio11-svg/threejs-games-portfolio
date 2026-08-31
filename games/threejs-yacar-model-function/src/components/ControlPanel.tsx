import React, { useState } from 'react';
import { YacareGroup, YacareColors } from '../models/crearyacare';
import { PRESETS_YACARE, YacarePreset } from '../utils/presets';
import { audioManager } from '../utils/audio';
import { EnvironmentMode } from './ThreeViewport';
import {
  Play,
  Pause,
  Waves,
  Sparkles,
  Volume2,
  VolumeX,
  Code2,
  Eye,
  Sliders,
  Palette,
  Info
} from 'lucide-react';

interface ControlPanelProps {
  yacare: YacareGroup | null;
  environment: EnvironmentMode;
  setEnvironment: (env: EnvironmentMode) => void;
  wireframeMode: boolean;
  setWireframeMode: (wf: boolean) => void;
  coloresActuales: YacareColors;
  setColoresActuales: (colores: YacareColors) => void;
  stats: { cajas: number; cilindros: number; esferas: number; total: number };
  onOpenCodeModal: () => void;
  onOpenInfoModal: () => void;
  aguaNivel: number;
  setAguaNivel: (n: number) => void;
  mostrarAgua: boolean;
  setMostrarAgua: (m: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  yacare,
  environment,
  setEnvironment,
  wireframeMode,
  setWireframeMode,
  coloresActuales,
  setColoresActuales,
  stats,
  onOpenCodeModal,
  onOpenInfoModal,
  aguaNivel,
  setAguaNivel,
  mostrarAgua,
  setMostrarAgua
}) => {
  const [tab, setTab] = useState<'animacion' | 'personalizacion' | 'entorno'>('animacion');
  const [velocidad, setVelocidad] = useState<number>(1.0);
  const [anguloBoca, setAnguloBoca] = useState<number>(0.0);
  const [estadoActual, setEstadoActual] = useState<'quieto' | 'caminando' | 'nadando'>('quieto');
  const [sonidoActivo, setSonidoActivo] = useState<boolean>(true);
  const [presetSeleccionado, setPresetSeleccionado] = useState<string>('overo');

  // Control de caminar()
  const handleCaminar = () => {
    if (!yacare) return;
    yacare.caminar(velocidad);
    setEstadoActual('caminando');
    audioManager.playStep();
  };

  // Control de quedarseQuieto()
  const handleQuedarseQuieto = () => {
    if (!yacare) return;
    yacare.quedarseQuieto();
    setEstadoActual('quieto');
  };

  // Control de nadar()
  const handleNadar = () => {
    if (!yacare) return;
    yacare.nadar(velocidad);
    setEstadoActual('nadando');
    audioManager.playSplash();
  };

  // Control de morder()
  const handleMorder = () => {
    if (!yacare) return;
    audioManager.playBite();
    yacare.morder();
  };

  // Rugido / Bellow
  const handleRugir = () => {
    if (!yacare) return;
    audioManager.playRoar();
    yacare.abrirBoca(0.7);
    setTimeout(() => {
      yacare.cerrarBoca();
    }, 1400);
  };

  // Giro Mortal
  const handleGirarMortal = () => {
    if (!yacare) return;
    audioManager.playSplash();
    yacare.girarMortal();
  };

  // Modificar ángulo de mandíbula
  const handleBocaChange = (val: number) => {
    setAnguloBoca(val);
    if (yacare) {
      yacare.abrirBoca(val);
    }
  };

  // Cambiar velocidad
  const handleVelocidadChange = (val: number) => {
    setVelocidad(val);
    if (yacare) {
      yacare.estado.velocidad = val;
    }
  };

  // Aplicar Preset
  const handleSelectPreset = (preset: YacarePreset) => {
    setPresetSeleccionado(preset.id);
    setColoresActuales(preset.colores);
    if (yacare) {
      yacare.establecerColor(preset.colores);
    }
  };

  // Cambiar Color Individual
  const handleColorChange = (key: keyof YacareColors, hexValue: string) => {
    const numericColor = parseInt(hexValue.replace('#', '0x'), 16);
    const updated = { ...coloresActuales, [key]: numericColor };
    setColoresActuales(updated);
    if (yacare) {
      yacare.establecerColor({ [key]: numericColor });
    }
  };

  // Alternar Sonido
  const handleToggleSound = () => {
    const newState = audioManager.toggleSound();
    setSonidoActivo(newState);
  };

  // Convertir número Three.js a hex string para el input color
  const toHexStr = (c: number | string | undefined) => {
    if (!c) return '#2c3b28';
    if (typeof c === 'string') return c;
    return '#' + c.toString(16).padStart(6, '0');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/95 border-l border-slate-800 text-slate-200 overflow-y-auto">
      {/* Header del Panel */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold font-mono tracking-wide text-emerald-400">
              crearyacaré()
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSound}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={sonidoActivo ? 'Desactivar audio' : 'Activar audio'}
            >
              {sonidoActivo ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={onOpenInfoModal}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Información y Anatomía"
            >
              <Info className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          Modelo 3D procedural generado 100% con primitivas de Three.js (<span className="text-emerald-400 font-mono">cajas</span>, <span className="text-emerald-400 font-mono">cilindros</span>, <span className="text-emerald-400 font-mono">esferas</span>).
        </p>

        {/* Botón Destacado: Ver Código Fuente JavaScript crearyacaré() */}
        <button
          onClick={onOpenCodeModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-mono text-xs font-semibold shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-all active:scale-[0.98]"
        >
          <Code2 className="w-4 h-4" />
          <span>Ver / Copiar Función JS crearyacaré()</span>
        </button>
      </div>

      {/* Tabs de Navegación del Panel */}
      <div className="flex border-b border-slate-800 bg-slate-950/60">
        <button
          onClick={() => setTab('animacion')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold font-mono transition-all border-b-2 ${
            tab === 'animacion'
              ? 'text-emerald-400 border-emerald-500 bg-slate-800/40'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          Métodos & Anim
        </button>
        <button
          onClick={() => setTab('personalizacion')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold font-mono transition-all border-b-2 ${
            tab === 'personalizacion'
              ? 'text-emerald-400 border-emerald-500 bg-slate-800/40'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Pieles & Color
        </button>
        <button
          onClick={() => setTab('entorno')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold font-mono transition-all border-b-2 ${
            tab === 'entorno'
              ? 'text-emerald-400 border-emerald-500 bg-slate-800/40'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Entorno
        </button>
      </div>

      {/* Contenido de Tabs */}
      <div className="p-4 flex-1 space-y-5">
        {/* TAB 1: ANIMACIONES Y MÉTODOS REQUERIDOS */}
        {tab === 'animacion' && (
          <div className="space-y-4">
            {/* Métodos Principales Requeridos */}
            <div>
              <label className="text-[11px] uppercase font-mono font-bold text-slate-400 mb-2 block tracking-wider">
                Métodos del Requerimiento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCaminar}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-mono text-xs font-semibold transition-all shadow-md ${
                    estadoActual === 'caminando'
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 font-bold'
                      : 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/40 hover:bg-emerald-800/80'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  caminar()
                </button>

                <button
                  onClick={handleQuedarseQuieto}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-mono text-xs font-semibold transition-all shadow-md ${
                    estadoActual === 'quieto'
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-bold'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Pause className="w-4 h-4 fill-current" />
                  quedarseQuieto()
                </button>
              </div>
            </div>

            {/* Acciones y Gestos adicionales del Caimán */}
            <div>
              <label className="text-[11px] uppercase font-mono font-bold text-slate-400 mb-2 block tracking-wider">
                Comportamientos de Yacaré
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleNadar}
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg font-mono text-xs transition-all ${
                    estadoActual === 'nadando'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/40 hover:bg-cyan-900/60'
                  }`}
                >
                  <Waves className="w-4 h-4 mb-1" />
                  <span>nadar()</span>
                </button>

                <button
                  onClick={handleMorder}
                  className="flex flex-col items-center justify-center py-2 px-2 rounded-lg font-mono text-xs bg-rose-950/50 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60 transition-all active:scale-95"
                >
                  <span className="text-base mb-0.5">🐊</span>
                  <span>morder()</span>
                </button>

                <button
                  onClick={handleRugir}
                  className="flex flex-col items-center justify-center py-2 px-2 rounded-lg font-mono text-xs bg-amber-950/50 text-amber-300 border border-amber-800/40 hover:bg-amber-900/60 transition-all active:scale-95"
                >
                  <span className="text-base mb-0.5">🔊</span>
                  <span>rugir()</span>
                </button>
              </div>

              <div className="mt-2">
                <button
                  onClick={handleGirarMortal}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-mono text-xs bg-gradient-to-r from-red-950/70 to-orange-950/70 text-orange-200 border border-orange-700/40 hover:from-red-900/70 hover:to-orange-900/70 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>girarMortal() [Death Roll 360°]</span>
                </button>
              </div>
            </div>

            {/* Deslizador de Velocidad */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400">Velocidad de Movimiento:</span>
                <span className="text-emerald-400 font-bold">{velocidad.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={velocidad}
                onChange={(e) => handleVelocidadChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Deslizador de Apertura de Mandíbula */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400">Apertura de Mandíbula (abrirBoca):</span>
                <span className="text-amber-400 font-bold">{Math.round(anguloBoca * (180 / Math.PI))}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={anguloBoca}
                onChange={(e) => handleBocaChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
                <span>Cerrada</span>
                <span>Intermedia</span>
                <span>Máxima</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PIELES BIOLÓGICAS Y COLORES */}
        {tab === 'personalizacion' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase font-mono font-bold text-slate-400 mb-2 block tracking-wider">
                Especies & Presets de Yacaré
              </label>
              <div className="space-y-2">
                {PRESETS_YACARE.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                      presetSeleccionado === p.id
                        ? 'bg-emerald-950/50 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-slate-200">{p.nombre}</span>
                      <span className="text-[10px] italic font-serif text-emerald-400/80">{p.nombreCientifico}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                      {p.descripcion}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Selectores de Color Manuales */}
            <div>
              <label className="text-[11px] uppercase font-mono font-bold text-slate-400 mb-2 block tracking-wider">
                Paleta de Colores Planos
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Piel Dorsal:</span>
                  <input
                    type="color"
                    value={toHexStr(coloresActuales.dorsal)}
                    onChange={(e) => handleColorChange('dorsal', e.target.value)}
                    className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Vientre:</span>
                  <input
                    type="color"
                    value={toHexStr(coloresActuales.ventral)}
                    onChange={(e) => handleColorChange('ventral', e.target.value)}
                    className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Crestas/Escamas:</span>
                  <input
                    type="color"
                    value={toHexStr(coloresActuales.escamas)}
                    onChange={(e) => handleColorChange('escamas', e.target.value)}
                    className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Ojos:</span>
                  <input
                    type="color"
                    value={toHexStr(coloresActuales.ojos)}
                    onChange={(e) => handleColorChange('ojos', e.target.value)}
                    className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ENTORNO Y VISUALIZACIÓN */}
        {tab === 'entorno' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase font-mono font-bold text-slate-400 mb-2 block tracking-wider">
                Modo de Entorno 3D
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setEnvironment('pantanal')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    environment === 'pantanal'
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-lg block mb-1">🌿</span>
                  <span className="text-xs font-mono">Pantanal</span>
                </button>

                <button
                  onClick={() => setEnvironment('estudio')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    environment === 'estudio'
                      ? 'bg-slate-800 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-lg block mb-1">🏛️</span>
                  <span className="text-xs font-mono">Estudio</span>
                </button>

                <button
                  onClick={() => setEnvironment('radiografia')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    environment === 'radiografia'
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-lg block mb-1">🔬</span>
                  <span className="text-xs font-mono">Radiografía</span>
                </button>
              </div>
            </div>

            {/* Alternar Wireframe */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono">Modo Wireframe / Malla:</span>
              </div>
              <button
                onClick={() => setWireframeMode(!wireframeMode)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  wireframeMode
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {wireframeMode ? 'Activado' : 'Desactivado'}
              </button>
            </div>

            {/* Nivel de agua en Pantanal */}
            {environment === 'pantanal' && (
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">Superficie del Agua:</span>
                  <button
                    onClick={() => setMostrarAgua(!mostrarAgua)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      mostrarAgua ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {mostrarAgua ? 'Visible' : 'Oculta'}
                  </button>
                </div>
                {mostrarAgua && (
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>Nivel de Inmersión:</span>
                      <span className="text-cyan-400">{aguaNivel.toFixed(2)}m</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.6"
                      step="0.02"
                      value={aguaNivel}
                      onChange={(e) => setAguaNivel(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CONTADOR DE PRIMITIVAS (Cumplimiento del prompt) */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-950">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Primitivas Utilizadas (Three.js):
            </span>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
              Total: {stats.total}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-amber-400 block font-bold text-sm">{stats.cajas}</span>
              <span className="text-[10px] text-slate-400">Cajas</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-emerald-400 block font-bold text-sm">{stats.cilindros}</span>
              <span className="text-[10px] text-slate-400">Cilindros</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-cyan-400 block font-bold text-sm">{stats.esferas}</span>
              <span className="text-[10px] text-slate-400">Esferas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
