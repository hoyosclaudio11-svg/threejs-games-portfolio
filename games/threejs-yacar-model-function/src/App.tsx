import { useState, useCallback } from 'react';
import { ThreeViewport, EnvironmentMode } from './components/ThreeViewport';
import { ControlPanel } from './components/ControlPanel';
import { CodeViewerModal } from './components/CodeViewerModal';
import { InfoModal } from './components/InfoModal';
import { YacareGroup, YacareColors } from './models/crearyacare';
import { PRESETS_YACARE } from './utils/presets';
import { Code2, Info, Maximize, Minimize, Compass } from 'lucide-react';

export function App() {
  const [yacareInstance, setYacareInstance] = useState<YacareGroup | null>(null);
  const [environment, setEnvironment] = useState<EnvironmentMode>('pantanal');
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [coloresActuales, setColoresActuales] = useState<YacareColors>(PRESETS_YACARE[0].colores);
  const [stats, setStats] = useState({ cajas: 86, cilindros: 64, esferas: 10, total: 160 });
  const [aguaNivel, setAguaNivel] = useState<number>(0.22);
  const [mostrarAgua, setMostrarAgua] = useState<boolean>(true);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false);

  const handleYacareRef = useCallback((yacare: YacareGroup | null) => {
    setYacareInstance(yacare);
  }, []);

  const handleStatsUpdate = useCallback((newStats: { cajas: number; cilindros: number; esferas: number; total: number }) => {
    setStats(newStats);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Barra de Navegación Superior */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐊</span>
            <div>
              <h1 className="text-sm md:text-base font-bold font-mono text-emerald-400 tracking-tight flex items-center gap-2">
                <span>crearyacaré()</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Three.js Primitivas
                </span>
              </h1>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-800 text-xs text-slate-400 font-mono">
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] text-amber-300">📦 Cajas</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] text-emerald-300">⚡ Cilindros</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] text-cyan-300">🔮 Esferas</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] text-slate-300">🎨 Flat Shading</span>
          </div>
        </div>

        {/* Acciones Rápidas del Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Código JS crearyacaré()</span>
            <span className="sm:hidden">Código JS</span>
          </button>

          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Detalles y Anatomía"
          >
            <Info className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Botón toggle en móvil para abrir panel lateral */}
          <button
            onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
            className="md:hidden p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Área Principal Dividida: Canvas 3D + Panel de Control */}
      <main className="flex-1 flex relative overflow-hidden">
        {/* Viewport 3D Three.js */}
        <div className="flex-1 h-full relative">
          <ThreeViewport
            environment={environment}
            wireframeMode={wireframeMode}
            coloresActuales={coloresActuales}
            onStatsUpdate={handleStatsUpdate}
            yacareRefCallback={handleYacareRef}
            aguaNivel={aguaNivel}
            mostrarAgua={mostrarAgua}
          />
        </div>

        {/* Panel Lateral de Controles (Desktop) */}
        <div className="hidden md:block w-96 h-full shrink-0 z-20 shadow-2xl">
          <ControlPanel
            yacare={yacareInstance}
            environment={environment}
            setEnvironment={setEnvironment}
            wireframeMode={wireframeMode}
            setWireframeMode={setWireframeMode}
            coloresActuales={coloresActuales}
            setColoresActuales={setColoresActuales}
            stats={stats}
            onOpenCodeModal={() => setIsCodeModalOpen(true)}
            onOpenInfoModal={() => setIsInfoModalOpen(true)}
            aguaNivel={aguaNivel}
            setAguaNivel={setAguaNivel}
            mostrarAgua={mostrarAgua}
            setMostrarAgua={setMostrarAgua}
          />
        </div>

        {/* Drawer de Controles en Móvil */}
        {isMobilePanelOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex justify-end">
            <div className="w-5/6 h-full bg-slate-900 shadow-2xl flex flex-col">
              <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-emerald-400">Panel de Control</span>
                <button
                  onClick={() => setIsMobilePanelOpen(false)}
                  className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300"
                >
                  Cerrar ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ControlPanel
                  yacare={yacareInstance}
                  environment={environment}
                  setEnvironment={setEnvironment}
                  wireframeMode={wireframeMode}
                  setWireframeMode={setWireframeMode}
                  coloresActuales={coloresActuales}
                  setColoresActuales={setColoresActuales}
                  stats={stats}
                  onOpenCodeModal={() => { setIsMobilePanelOpen(false); setIsCodeModalOpen(true); }}
                  onOpenInfoModal={() => { setIsMobilePanelOpen(false); setIsInfoModalOpen(true); }}
                  aguaNivel={aguaNivel}
                  setAguaNivel={setAguaNivel}
                  mostrarAgua={mostrarAgua}
                  setMostrarAgua={setMostrarAgua}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modales de Código e Información */}
      <CodeViewerModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
}

export default App;
