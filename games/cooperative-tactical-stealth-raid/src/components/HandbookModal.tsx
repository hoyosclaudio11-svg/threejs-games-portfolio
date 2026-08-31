import React, { useState } from 'react';
import { X, ShieldAlert, Zap, Eye, Users, Crosshair, Award } from 'lucide-react';
import { audioManager } from '../services/audio';

interface HandbookModalProps {
  onClose: () => void;
}

export const HandbookModal: React.FC<HandbookModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'sync' | 'stealth' | 'revive' | 'controls'>('sync');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border-2 border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg sm:text-xl font-black text-white">MANUAL DE OPERACIONES TÁCTICAS</h2>
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

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 my-3 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
          <button
            onClick={() => { audioManager.playButtonClick(); setTab('sync'); }}
            className={`px-3 py-1.5 rounded font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'sync' ? 'bg-cyan-950 text-cyan-300 border border-cyan-400' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>SINCRONIZACIÓN COOPERATIVA</span>
          </button>
          <button
            onClick={() => { audioManager.playButtonClick(); setTab('stealth'); }}
            className={`px-3 py-1.5 rounded font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'stealth' ? 'bg-emerald-950 text-emerald-300 border border-emerald-400' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>SIGILO & VISIÓN</span>
          </button>
          <button
            onClick={() => { audioManager.playButtonClick(); setTab('revive'); }}
            className={`px-3 py-1.5 rounded font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'revive' ? 'bg-amber-950 text-amber-300 border border-amber-400' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>REANIMACIÓN & EXTRACCIÓN</span>
          </button>
          <button
            onClick={() => { audioManager.playButtonClick(); setTab('controls'); }}
            className={`px-3 py-1.5 rounded font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'controls' ? 'bg-purple-950 text-purple-300 border border-purple-400' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>CONTROLES</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto flex-1 text-xs text-slate-300 space-y-3 pr-1 my-2">
          {tab === 'sync' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-cyan-500/30">
                <div className="font-bold text-cyan-300 text-sm mb-1 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>¿Cómo funciona la Sincronización Dual?</span>
                </div>
                <p className="leading-relaxed">
                  Las cámaras acorazadas y barreras láser de alta seguridad requieren dos consolas terminales
                  activadas casi al mismo tiempo.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                  <li>El <strong className="text-white">Agente 1</strong> se acerca a la Terminal Alpha y presiona <strong className="text-cyan-400">[F / Touch]</strong>.</li>
                  <li>Se inicia una cuenta atrás de <strong className="text-amber-400">3.5 segundos</strong> y un pulso auditivo acelerado.</li>
                  <li>El <strong className="text-white">Agente 2</strong> debe pulsar la Terminal Beta dentro de la ventana de tiempo.</li>
                  <li>¡Al sincronizar, la red láser se apaga, las compuertas se abren y sumáis <strong className="text-emerald-400">+5,000 PTS</strong>!</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="font-bold text-amber-300 mb-1">Modo Solo con Compañero IA:</div>
                <p className="text-slate-400">
                  En modo solitario, tu compañero fantasma IA correrá automáticamente a la consola emparejada en cuanto actives tu terminal, completando la sincronización en equipo sin fricción.
                </p>
              </div>
            </div>
          )}

          {tab === 'stealth' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30">
                <div className="font-bold text-emerald-300 text-sm mb-1 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Conos de Visión & Ruido Acústico</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Los guardias y cámaras tienen conos de visión activos en pantalla.
                </p>
                <div className="grid grid-cols-3 gap-2 my-2 text-center text-[10px]">
                  <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 rounded">
                    <div className="text-emerald-400 font-bold">VERDE</div>
                    <div>Patrulla / Inconsciente</div>
                  </div>
                  <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded">
                    <div className="text-amber-400 font-bold">AMARILLO (?)</div>
                    <div>Sospecha / Investigando</div>
                  </div>
                  <div className="p-2 bg-red-950/60 border border-red-500/40 rounded">
                    <div className="text-red-400 font-bold">ROJO (!)</div>
                    <div>Combate / Alarma Total</div>
                  </div>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong className="text-white">Eliminación Sigilosa:</strong> Acércate por la espalda de un guardia dentro de su punto ciego y pulsa <strong className="text-emerald-400">[ESPACIO / CLIC / TOUCH]</strong> para un derribo instantáneo (+2,000 PTS).</li>
                  <li><strong className="text-white">Disparos con Silenciador:</strong> Las armas silenciadas (Ghost, Viper, Spectre) no alertan a guardias lejanos. Las armas no silenciadas provocan alerta de ruido inmediata.</li>
                </ul>
              </div>
            </div>
          )}

          {tab === 'revive' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/30">
                <div className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Reanimación de Compañero Caído</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Si un agente recibe daño letal, no muere al instante: entra en estado <strong className="text-red-400">INCAPACITADO</strong> con 35 segundos de sangrado.
                </p>
                <p className="mt-1 text-slate-400">
                  El compañero superviviente debe acudir a su posición y mantener pulsado <strong className="text-amber-400">[F / L / TOUCH]</strong> durante 2 segundos para inyectarle un estimulante táctico y reanimarlo al combate.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30">
                <div className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Zona de Extracción (LZ)</span>
                </div>
                <p className="text-slate-400">
                  Para completar la misión con éxito, ambos operativos deben permanecer dentro de la zona de evacuación verde hasta que la barra llegue al 100%, resistiendo cualquier oleada SWAT.
                </p>
              </div>
            </div>
          )}

          {tab === 'controls' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="font-bold text-cyan-400 text-sm mb-2">Resumen de Controles:</div>
                <div className="space-y-2 text-slate-300">
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="font-bold text-emerald-400">P1 (Teclado):</span> [W/A/S/D] Moverse • [ESPACIO / Ratón] Disparar • [F] Interactuar / Sincronizar • [Q] Gadget • [R] Recargar
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="font-bold text-cyan-400">P2 (Teclado Local 2P):</span> [Flechas] Moverse • [R-SHIFT / K] Disparar • [ENTER / L] Interactuar / Sincronizar • [P] Gadget
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="font-bold text-amber-400">Móvil / Pantalla Táctil:</span> Joystick izquierdo para desplazamiento • Botones táctiles a la derecha para disparo, sincronización y gadgets.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow"
          >
            ENTENDIDO, AGENTE
          </button>
        </div>
      </div>
    </div>
  );
};
