import React, { useState } from 'react';
import { CREAR_YACARE_RAW_JS } from '../models/crearyacareRawCode';
import { Copy, Check, Download, X, Code, Terminal, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'codigo' | 'ejemplo'>('codigo');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(CREAR_YACARE_RAW_JS);
    setCopied(true);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 }
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([CREAR_YACARE_RAW_JS], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'crearyacare.js';
    link.click();
    URL.revokeObjectURL(url);
  };

  const EJEMPLO_USO = `// 1. Importar Three.js y el archivo crearyacare.js
import * as THREE from 'three';
// (O incluir Three.js vía CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>)

// 2. Tu configuración estándar de Three.js (escena, cámara, luces, renderer)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(3, 2, 4);
camera.lookAt(0, 0.4, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 10, 7);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 1.0));

// 3. LLAMAR A LA FUNCIÓN crearyacaré()
const yacare = crearyacaré();
scene.add(yacare); // Devuelve un THREE.Group listo para añadir a tu escena

// 4. USAR LOS MÉTODOS REQUERIDOS:
yacare.caminar();        // Inicia el ciclo de caminata realista
// yacare.quedarseQuieto(); // Detiene el movimiento y reposa
// yacare.abrirBoca(0.5);   // Abre la mandíbula
// yacare.cerrarBoca();     // Cierra la mandíbula

// 5. Bucle de renderizado actualizando la cinemática
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  yacare.actualizar(delta); // Actualiza la marcha, cola y extremidades

  renderer.render(scene, camera);
}

animate();`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
                <span>función crearyacaré()</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  Pure JS / Three.js
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Código JavaScript limpio listo para copiar y usar en cualquier entorno.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              title="Descargar archivo crearyacare.js"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Descargar .js</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector de Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setTab('codigo')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-mono font-semibold border-b-2 transition-all ${
              tab === 'codigo'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Código Fuente crearyacaré()
          </button>
          <button
            onClick={() => setTab('ejemplo')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-mono font-semibold border-b-2 transition-all ${
              tab === 'ejemplo'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Guía de Integración / Ejemplo
          </button>
        </div>

        {/* Visor de Código con Scroll */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/90 font-mono text-xs leading-relaxed">
          {tab === 'codigo' ? (
            <pre className="text-emerald-300/90 whitespace-pre-wrap select-all font-mono">
              {CREAR_YACARE_RAW_JS}
            </pre>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-slate-300 text-xs">
                💡 <strong className="text-emerald-400">Sin dependencias externas:</strong> Solo necesitas Three.js. La función no incluye cámaras, luces ni controles, por lo que puedes integrarla limpiamente en cualquier proyecto Three.js existente.
              </div>
              <pre className="text-cyan-300/90 whitespace-pre-wrap select-all bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
                {EJEMPLO_USO}
              </pre>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-400 font-mono">
          <span>Primitivas: THREE.BoxGeometry, THREE.CylinderGeometry, THREE.SphereGeometry</span>
          <span>Métodos: caminar(), quedarseQuieto(), actualizar()</span>
        </div>
      </div>
    </div>
  );
};
