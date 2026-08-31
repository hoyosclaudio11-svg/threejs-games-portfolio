import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { crearyacaré, YacareGroup, YacareColors } from '../models/crearyacare';
import { audioManager } from '../utils/audio';

export type EnvironmentMode = 'pantanal' | 'estudio' | 'radiografia';
export type CameraViewPreset = 'completo' | 'cabeza' | 'perfil' | 'superior' | 'cola';

interface ThreeViewportProps {
  onStatsUpdate?: (stats: { cajas: number; cilindros: number; esferas: number; total: number }) => void;
  environment: EnvironmentMode;
  wireframeMode: boolean;
  coloresActuales: YacareColors;
  yacareRefCallback?: (yacare: YacareGroup | null) => void;
  aguaNivel: number;
  mostrarAgua: boolean;
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  onStatsUpdate,
  environment,
  wireframeMode,
  coloresActuales,
  yacareRefCallback,
  aguaNivel,
  mostrarAgua
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const yacareInstanceRef = useRef<YacareGroup | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameId = useRef<number>(0);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const envGroupRef = useRef<THREE.Group | null>(null);

  // Estado de interacción de cámara tipo Orbit Controls
  const isDragging = useRef(false);
  const isPanning = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const spherical = useRef({ radius: 5.5, theta: 0.8, phi: 1.1 });
  const lookAtTarget = useRef(new THREE.Vector3(0, 0.4, 0.2));

  const [isLoading, setIsLoading] = useState(true);

  // Función para mover la cámara hacia presets
  const setCameraView = useCallback((preset: CameraViewPreset) => {
    switch (preset) {
      case 'completo':
        spherical.current = { radius: 5.2, theta: 0.75, phi: 1.15 };
        lookAtTarget.current.set(0, 0.4, 0.2);
        break;
      case 'cabeza':
        spherical.current = { radius: 2.4, theta: 0.25, phi: 1.3 };
        lookAtTarget.current.set(0, 0.45, 1.1);
        break;
      case 'perfil':
        spherical.current = { radius: 4.8, theta: Math.PI / 2, phi: 1.4 };
        lookAtTarget.current.set(0, 0.4, 0);
        break;
      case 'superior':
        spherical.current = { radius: 5.5, theta: 0.0, phi: 0.05 };
        lookAtTarget.current.set(0, 0.3, 0);
        break;
      case 'cola':
        spherical.current = { radius: 3.6, theta: Math.PI + 0.3, phi: 1.25 };
        lookAtTarget.current.set(0, 0.4, -1.2);
        break;
    }
  }, []);

  // Construir entorno del Pantanal / Esteros
  const buildPantanalEnv = (envGroup: THREE.Group) => {
    // 1. Suelo de barro y ribera
    const groundGeo = new THREE.PlaneGeometry(35, 35, 48, 48);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const dist = Math.sqrt(vx * vx + vy * vy);
      const mudHills = Math.sin(vx * 0.4) * Math.cos(vy * 0.4) * 0.25 + Math.sin(dist * 0.8) * 0.15;
      pos.setZ(i, mudHills);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3d3020, // Barro húmedo pantanoso
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    envGroup.add(ground);

    // 2. Orilla de arena y fango
    const sandMat = new THREE.MeshStandardMaterial({
      color: 0x4a3b2c,
      roughness: 0.85,
      flatShading: true
    });
    const sandIslandGeo = new THREE.CylinderGeometry(2.8, 3.8, 0.25, 24);
    const sandIsland = new THREE.Mesh(sandIslandGeo, sandMat);
    sandIsland.position.set(0, 0.06, 0.1);
    sandIsland.receiveShadow = true;
    envGroup.add(sandIsland);

    // 3. Camalotes / Irupé (Nenúfares gigantes de los Esteros del Iberá)
    const plantGroup = new THREE.Group();
    const padGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.02, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x2e6930,
      roughness: 0.7,
      flatShading: true
    });
    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xf5edf0,
      roughness: 0.5,
      flatShading: true
    });

    const posicionesIrupe = [
      { x: -2.8, z: 1.8, s: 1.1 },
      { x: -2.3, z: -2.4, s: 0.9 },
      { x: 2.6, z: 2.1, s: 1.2 },
      { x: 3.2, z: -1.6, s: 0.85 },
      { x: -3.6, z: -0.8, s: 1.3 },
      { x: 1.8, z: -3.2, s: 0.95 }
    ];

    posicionesIrupe.forEach((p) => {
      const irupe = new THREE.Mesh(padGeo, padMat);
      irupe.position.set(p.x, 0.22, p.z);
      irupe.scale.set(p.s, 1, p.s);
      irupe.receiveShadow = true;
      plantGroup.add(irupe);

      // Flor de irupé en el centro de algunas hojas
      if (p.s > 1.0) {
        const flor = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 6), flowerMat);
        flor.position.set(p.x, 0.32, p.z);
        plantGroup.add(flor);
      }
    });

    // 4. Juncos y totoras de ribera (cilindros delgados)
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x3e522d, roughness: 0.8, flatShading: true });
    for (let r = 0; r < 36; r++) {
      const angle = (r / 36) * Math.PI * 2;
      const radius = 3.6 + (Math.sin(r * 4) * 0.8);
      const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 1.4 + Math.random() * 0.8, 5), reedMat);
      reed.position.set(
        Math.cos(angle) * radius,
        0.7 + Math.random() * 0.2,
        Math.sin(angle) * radius
      );
      reed.rotation.z = (Math.random() - 0.5) * 0.2;
      reed.rotation.x = (Math.random() - 0.5) * 0.2;
      reed.castShadow = true;
      plantGroup.add(reed);
    }

    envGroup.add(plantGroup);
  };

  // Construir entorno de Estudio Minimalista
  const buildStudioEnv = (envGroup: THREE.Group) => {
    // Pedestal circular elegante
    const baseGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.2, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1f2429,
      roughness: 0.4,
      metalness: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.1;
    base.receiveShadow = true;
    envGroup.add(base);

    // Anillo exterior de luz suave
    const ringGeo = new THREE.TorusGeometry(3.6, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4f83cc });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    envGroup.add(ring);

    // Suelo infinito
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0e1117,
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.21;
    floor.receiveShadow = true;
    envGroup.add(floor);

    // Rejilla técnica sutil
    const grid = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
    grid.position.y = -0.2;
    envGroup.add(grid);
  };

  // Inicializar Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Escena
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0f0d);
    scene.fog = new THREE.FogExp2(0x0a0f0d, 0.035);

    // Cámara
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(3.8, 2.4, 4.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    containerRef.current.appendChild(renderer.domElement);

    // Luces
    const hemiLight = new THREE.HemisphereLight(0xe8f0e0, 0x1e281c, 0.75);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffae8, 2.2);
    sunLight.position.set(6, 12, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.camera.left = -6;
    sunLight.shadow.camera.right = 6;
    sunLight.shadow.camera.top = 6;
    sunLight.shadow.camera.bottom = -6;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x70a090, 1.1);
    rimLight.position.set(-6, 4, -8);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xddeebb, 0.6, 15);
    fillLight.position.set(0, 3, 3);
    scene.add(fillLight);

    // Grupo de entorno dinámico
    const envGroup = new THREE.Group();
    envGroupRef.current = envGroup;
    scene.add(envGroup);

    // Agua animada
    const waterGeo = new THREE.PlaneGeometry(32, 32, 40, 40);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1d4a3e,
      roughness: 0.1,
      metalness: 0.15,
      transparent: true,
      opacity: 0.72,
      flatShading: true
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0.22;
    waterMesh.receiveShadow = true;
    waterMeshRef.current = waterMesh;
    scene.add(waterMesh);

    // Construir el modelo Yacaré usando la función crearyacaré()
    const yacare = crearyacaré(coloresActuales);
    yacareInstanceRef.current = yacare;
    scene.add(yacare);

    if (yacareRefCallback) {
      yacareRefCallback(yacare);
    }

    if (onStatsUpdate) {
      onStatsUpdate(yacare.obtenerEstadisticas());
    }

    // Por defecto inicia en reposo natural
    yacare.quedarseQuieto();

    setIsLoading(false);

    // Bucle de animación
    const clock = new THREE.Clock();
    let aguaTiempo = 0;

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      aguaTiempo += delta;

      // Actualizar el yacaré mediante su método cinemático
      if (yacareInstanceRef.current) {
        yacareInstanceRef.current.actualizar(delta);
      }

      // Ondulación del agua
      if (waterMeshRef.current && waterMeshRef.current.visible) {
        const posAttr = waterMeshRef.current.geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i);
          const vy = posAttr.getY(i);
          const onda = Math.sin(vx * 0.8 + aguaTiempo * 2.2) * 0.03 +
                       Math.cos(vy * 0.7 + aguaTiempo * 1.8) * 0.025;
          posAttr.setZ(i, onda);
        }
        waterMeshRef.current.geometry.computeVertexNormals();
        posAttr.needsUpdate = true;
      }

      // Suavizado de cámara Orbit
      const s = spherical.current;
      const x = s.radius * Math.sin(s.phi) * Math.sin(s.theta) + lookAtTarget.current.x;
      const y = s.radius * Math.cos(s.phi) + lookAtTarget.current.y;
      const z = s.radius * Math.sin(s.phi) * Math.cos(s.theta) + lookAtTarget.current.z;

      camera.position.lerp(new THREE.Vector3(x, y, z), 0.1);
      camera.lookAt(lookAtTarget.current);

      renderer.render(scene, camera);
    };

    animate();

    // Redimensionamiento
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Actualizar entorno según modo
  useEffect(() => {
    if (!envGroupRef.current || !sceneRef.current) return;

    // Limpiar objetos previos del entorno
    while (envGroupRef.current.children.length > 0) {
      const obj = envGroupRef.current.children[0];
      envGroupRef.current.remove(obj);
    }

    if (environment === 'pantanal') {
      sceneRef.current.background = new THREE.Color(0x0c140f);
      sceneRef.current.fog = new THREE.FogExp2(0x0c140f, 0.03);
      buildPantanalEnv(envGroupRef.current);
      if (waterMeshRef.current) waterMeshRef.current.visible = mostrarAgua;
    } else if (environment === 'estudio') {
      sceneRef.current.background = new THREE.Color(0x0d1117);
      sceneRef.current.fog = new THREE.FogExp2(0x0d1117, 0.02);
      buildStudioEnv(envGroupRef.current);
      if (waterMeshRef.current) waterMeshRef.current.visible = false;
    } else if (environment === 'radiografia') {
      sceneRef.current.background = new THREE.Color(0x06090e);
      sceneRef.current.fog = new THREE.FogExp2(0x06090e, 0.015);
      const grid = new THREE.GridHelper(30, 30, 0x00ffcc, 0x003344);
      grid.position.y = -0.05;
      envGroupRef.current.add(grid);
      if (waterMeshRef.current) waterMeshRef.current.visible = false;
    }
  }, [environment, mostrarAgua]);

  // Actualizar nivel de agua
  useEffect(() => {
    if (waterMeshRef.current) {
      waterMeshRef.current.position.y = aguaNivel;
      waterMeshRef.current.visible = mostrarAgua && environment === 'pantanal';
    }
  }, [aguaNivel, mostrarAgua, environment]);

  // Actualizar colores
  useEffect(() => {
    if (yacareInstanceRef.current) {
      yacareInstanceRef.current.establecerColor(coloresActuales);
    }
  }, [coloresActuales]);

  // Modo Wireframe / Radiografía de Primitivas
  useEffect(() => {
    if (!yacareInstanceRef.current) return;

    yacareInstanceRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (wireframeMode || environment === 'radiografia') {
          child.material.wireframe = true;
          // Colorear según tipo de geometría para visualización de primitivas
          if (environment === 'radiografia') {
            if (child.geometry instanceof THREE.BoxGeometry) {
              child.material.color.set(0xff9900); // Cajas: Ámbar / Naranja
            } else if (child.geometry instanceof THREE.CylinderGeometry) {
              child.material.color.set(0x00ff88); // Cilindros: Verde esmeralda
            } else if (child.geometry instanceof THREE.SphereGeometry) {
              child.material.color.set(0x00ccff); // Esferas: Cian
            }
          }
        } else {
          child.material.wireframe = false;
          // Restaurar colores normales
          yacareInstanceRef.current?.establecerColor(coloresActuales);
        }
      }
    });
  }, [wireframeMode, environment, coloresActuales]);

  // Controladores de ratón y gestos táctiles (Orbit Controls personalizado y fluido)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2 || e.shiftKey) {
      isPanning.current = true;
    } else {
      isDragging.current = true;
    }
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };

    if (isDragging.current) {
      spherical.current.theta -= deltaX * 0.008;
      spherical.current.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, spherical.current.phi - deltaY * 0.008));
    } else if (isPanning.current) {
      const panSpeed = 0.004 * spherical.current.radius;
      lookAtTarget.current.x -= deltaX * panSpeed * Math.cos(spherical.current.theta);
      lookAtTarget.current.z += deltaX * panSpeed * Math.sin(spherical.current.theta);
      lookAtTarget.current.y += deltaY * panSpeed;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    isPanning.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    spherical.current.radius = Math.max(1.8, Math.min(14.0, spherical.current.radius + e.deltaY * 0.005));
  };

  // Interacción táctil en móvil
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging.current && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      spherical.current.theta -= deltaX * 0.009;
      spherical.current.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, spherical.current.phi - deltaY * 0.009));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Click en el yacaré para provocar mordisco interactivo con sonido
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current || !yacareInstanceRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObject(yacareInstanceRef.current, true);

    if (intersects.length > 0) {
      audioManager.playBite();
      yacareInstanceRef.current.morder();
    }
  };

  // Captura de pantalla en alta resolución
  const takeScreenshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `yacare-threejs-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCanvasClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-emerald-400 font-mono text-sm tracking-wider">CONSTRUYENDO YACARÉ CON PRIMITIVAS...</p>
        </div>
      )}

      {/* Botones rápidos de Cámara en la esquina superior izquierda */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-emerald-900/40 shadow-xl">
        <span className="text-[10px] uppercase font-mono text-emerald-400/80 px-2 flex items-center font-bold">
          Cámara:
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setCameraView('completo'); }}
          className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-200 bg-slate-800/80 hover:bg-emerald-700 hover:text-white transition-all shadow-sm active:scale-95"
        >
          General
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setCameraView('cabeza'); }}
          className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-200 bg-slate-800/80 hover:bg-emerald-700 hover:text-white transition-all shadow-sm active:scale-95"
        >
          Hocico / Cabeza
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setCameraView('perfil'); }}
          className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-200 bg-slate-800/80 hover:bg-emerald-700 hover:text-white transition-all shadow-sm active:scale-95"
        >
          Perfil
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setCameraView('superior'); }}
          className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-200 bg-slate-800/80 hover:bg-emerald-700 hover:text-white transition-all shadow-sm active:scale-95"
        >
          Cenital (Top)
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setCameraView('cola'); }}
          className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-200 bg-slate-800/80 hover:bg-emerald-700 hover:text-white transition-all shadow-sm active:scale-95"
        >
          Cola
        </button>
      </div>

      {/* Botón de Captura de Pantalla en la esquina superior derecha */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); takeScreenshot(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-800/60 hover:text-white transition-all backdrop-blur-md shadow-lg"
          title="Tomar captura de pantalla PNG"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Foto PNG
        </button>
      </div>

      {/* Leyenda de navegación e interactividad en la parte inferior */}
      <div className="absolute bottom-3 left-4 z-10 pointer-events-none hidden md:flex items-center gap-4 text-[11px] font-mono text-slate-400 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
        <span>🖱️ Arrastrar: Rotar</span>
        <span>🖱️ Click Der / Shift: Desplazar</span>
        <span>🔍 Rueda: Zoom</span>
        <span className="text-emerald-400 font-semibold">⚡ Click en el Yacaré: Mordisco</span>
      </div>

      {/* Leyenda de primitivas en modo Radiografía */}
      {environment === 'radiografia' && (
        <div className="absolute bottom-3 right-4 z-10 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-mono">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm inline-block" /> Cajas (Box)
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" /> Cilindros (Cyl)
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full inline-block" /> Esferas (Sph)
          </span>
        </div>
      )}
    </div>
  );
};
