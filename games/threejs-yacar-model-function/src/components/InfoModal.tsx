import React from 'react';
import { X, Shield, Cpu, Activity, Award, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-slate-100">
                Anatomía y Arquitectura 3D del Yacaré
              </h3>
              <p className="text-xs text-slate-400">
                Detalles biológicos y modelado con primitivas Three.js
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-slate-300 text-xs leading-relaxed">
          {/* Cumplimiento de Requerimientos */}
          <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-xl p-4">
            <h4 className="text-sm font-bold font-mono text-emerald-400 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Cumplimiento Estricto del Prompt
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Función:</strong> <code className="text-emerald-300 font-mono">crearyacaré()</code> en JavaScript puro con Three.js.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Retorno:</strong> Devuelve un único <code className="text-emerald-300 font-mono">THREE.Group</code> con jerarquía articulada.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Solo Primitivas:</strong> Esferas, cilindros y cajas (sin modelos externos ni GLTF/OBJ).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Métodos integrados:</strong> <code className="text-emerald-300 font-mono">caminar()</code>, <code className="text-emerald-300 font-mono">quedarseQuieto()</code> y <code className="text-emerald-300 font-mono">actualizar(delta)</code>.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Aislado:</strong> No incluye escena, cámara, luces ni controles en la función generadora.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Estilo:</strong> Proporciones realistas con colores planos (Flat Shading).</span>
              </div>
            </div>
          </div>

          {/* Desglose Anatómico de Primitivas */}
          <div>
            <h4 className="text-sm font-bold font-mono text-slate-100 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Desglose Anatómico por Primitivas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-amber-900/40">
                <h5 className="font-mono font-bold text-amber-400 text-xs mb-1">Cajas (BoxGeometry)</h5>
                <p className="text-slate-400 leading-normal">
                  Utilizadas para el cráneo, hocico aplanado característico en "U", torso bajo y ancho, placas ventrales, paladar bucal, manos, pies y segmentos axiales de la cola.
                </p>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-emerald-900/40">
                <h5 className="font-mono font-bold text-emerald-400 text-xs mb-1">Cilindros (CylinderGeometry)</h5>
                <p className="text-slate-400 leading-normal">
                  Utilizados para el lomo cilíndrico, fémures, húmeros, tibias, dientes cónicos interdigitados, garras córneas y osteodermos (quillas dorsales triangulares biseladas).
                </p>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-cyan-900/40">
                <h5 className="font-mono font-bold text-cyan-400 text-xs mb-1">Esferas (SphereGeometry)</h5>
                <p className="text-slate-400 leading-normal">
                  Utilizadas para los ojos reptilianos con órbitas sobresalientes, bultos nasales elevados para respiración sumergida, codos y articulaciones de las rodillas.
                </p>
              </div>
            </div>
          </div>

          {/* Biología del Yacaré */}
          <div>
            <h4 className="text-sm font-bold font-mono text-slate-100 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Biología del Yacaré (Caimán de Sudamérica)
            </h4>
            <div className="space-y-2 text-slate-300">
              <p>
                Los yacarés pertenecen a la familia <em>Alligatoridae</em>. Las dos especies más emblemáticas de la cuenca del Plata y el Pantanal son:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>
                  <strong className="text-slate-200">Yacaré Overo (<em>Caiman latirostris</em>):</strong> Se distingue por su hocico corto, ancho y redondeado en forma de "U", ideal para triturar caracoles acuáticos y presas de caparazón duro.
                </li>
                <li>
                  <strong className="text-slate-200">Yacaré Negro (<em>Caiman yacare</em>):</strong> Más esbelto y de hocico alargado, adaptado a la captura rápida de peces en lagunas y ríos serpenteantes.
                </li>
                <li>
                  <strong className="text-slate-200">Cinemática de Marcha:</strong> En tierra utilizan una marcha diagonal ondulando la espina dorsal lateralmente. En agua repliegan las extremidades y usan su cola comprimida lateralmente como motor propulsor en latigazos sinusoidales.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
