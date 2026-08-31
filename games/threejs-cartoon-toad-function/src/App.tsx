import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { crearSapo, type Sapo } from "./crearSapo";

type Accion = "quieto" | "caminar" | "saltar";

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sapoRef = useRef<Sapo | null>(null);
  const jumpTimer = useRef<number | null>(null);
  const [accion, setAccion] = useState<Accion>("quieto");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x7ec8c3, 12, 38);

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      80,
    );
    camera.position.set(4.2, 2.8, 5.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 0.7, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;

    scene.add(new THREE.AmbientLight(0xc8f0e8, 0.45));

    const hemi = new THREE.HemisphereLight(0x9ee7ff, 0x3d6b3a, 0.7);
    scene.add(hemi);

    const sol = new THREE.DirectionalLight(0xfff1c9, 1.35);
    sol.position.set(6, 10, 4);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    sol.shadow.camera.near = 1;
    sol.shadow.camera.far = 28;
    sol.shadow.camera.left = -8;
    sol.shadow.camera.right = 8;
    sol.shadow.camera.top = 8;
    sol.shadow.camera.bottom = -8;
    sol.shadow.bias = -0.0008;
    scene.add(sol);

    const fill = new THREE.DirectionalLight(0x88d5ff, 0.28);
    fill.position.set(-5, 3, -4);
    scene.add(fill);

    const aguaGeo = new THREE.PlaneGeometry(48, 48, 80, 80);
    const aguaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color("#0d5c62") },
        uShallow: { value: new THREE.Color("#3cbcb0") },
        uHighlight: { value: new THREE.Color("#d4fff4") },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vUv = uv;
          vec3 p = position;
          float w1 = sin(p.x * 0.35 + uTime * 1.1) * 0.07;
          float w2 = cos(p.y * 0.28 + uTime * 0.85) * 0.055;
          vWave = w1 + w2;
          p.z += vWave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uDeep;
        uniform vec3 uShallow;
        uniform vec3 uHighlight;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          float d = length(vUv - 0.5);
          vec3 col = mix(uShallow, uDeep, smoothstep(0.15, 0.72, d));
          col += uHighlight * (vWave * 0.55 + 0.04);
          float spark = smoothstep(0.045, 0.0, abs(vWave - 0.04));
          col += uHighlight * spark * 0.15;
          gl_FragColor = vec4(col, 0.94);
        }
      `,
      transparent: true,
    });
    const agua = new THREE.Mesh(aguaGeo, aguaMat);
    agua.rotation.x = -Math.PI / 2;
    agua.position.y = -0.08;
    agua.receiveShadow = true;
    scene.add(agua);

    const orilla = new THREE.Mesh(
      new THREE.CircleGeometry(9.5, 48),
      new THREE.MeshToonMaterial({ color: 0x2f6b3a }),
    );
    orilla.rotation.x = -Math.PI / 2;
    orilla.position.y = -0.09;
    orilla.receiveShadow = true;
    scene.add(orilla);

    function crearNenufar(radio: number, color: number) {
      const g = new THREE.Group();
      const hoja = new THREE.Mesh(
        new THREE.CylinderGeometry(radio, radio * 0.98, 0.055, 36),
        new THREE.MeshToonMaterial({ color }),
      );
      hoja.receiveShadow = true;
      hoja.castShadow = true;
      g.add(hoja);
      const vena = new THREE.Mesh(
        new THREE.BoxGeometry(radio * 1.5, 0.02, 0.05),
        new THREE.MeshToonMaterial({ color: 0x1f5a2c }),
      );
      vena.position.y = 0.03;
      g.add(vena);
      const muesca = new THREE.Mesh(
        new THREE.BoxGeometry(radio * 0.35, 0.07, radio * 0.55),
        new THREE.MeshToonMaterial({ color: 0x1a6b68 }),
      );
      muesca.position.set(radio * 0.72, 0, 0);
      g.add(muesca);
      return g;
    }

    const pad = crearNenufar(1.55, 0x3d9a4a);
    pad.position.y = 0.01;
    scene.add(pad);

    const extras: [number, number, number, number][] = [
      [-2.8, 1.6, 0.85, 0x348a42],
      [3.1, -1.4, 1.05, 0x2f7d3c],
      [-1.4, -2.9, 0.7, 0x41964c],
      [2.4, 2.6, 0.6, 0x2c8340],
    ];
    extras.forEach(([x, z, r, c], i) => {
      const n = crearNenufar(r, c);
      n.position.set(x, 0.005, z);
      n.rotation.y = i * 1.1;
      scene.add(n);
    });

    function flor(x: number, z: number) {
      const g = new THREE.Group();
      const centro = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 10),
        new THREE.MeshToonMaterial({ color: 0xffe066 }),
      );
      centro.position.y = 0.08;
      g.add(centro);
      for (let i = 0; i < 8; i++) {
        const petalo = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 10, 8),
          new THREE.MeshToonMaterial({ color: 0xff7eb6 }),
        );
        const a = (i / 8) * Math.PI * 2;
        petalo.position.set(Math.cos(a) * 0.14, 0.07, Math.sin(a) * 0.14);
        petalo.scale.set(1.3, 0.35, 0.8);
        g.add(petalo);
      }
      g.position.set(x, 0.04, z);
      scene.add(g);
    }
    flor(-2.8, 1.6);
    flor(3.1, -1.4);

    function junco(x: number, z: number, h: number) {
      const g = new THREE.Group();
      const tallo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.045, h, 8),
        new THREE.MeshToonMaterial({ color: 0x3d7a32 }),
      );
      tallo.position.y = h / 2;
      tallo.castShadow = true;
      g.add(tallo);
      const espiga = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.07, 0.38, 8),
        new THREE.MeshToonMaterial({ color: 0x6b3a1f }),
      );
      espiga.position.y = h + 0.12;
      espiga.castShadow = true;
      g.add(espiga);
      g.position.set(x, 0, z);
      g.rotation.z = (Math.random() - 0.5) * 0.15;
      scene.add(g);
    }
    [
      [-4.2, 2.2, 1.8],
      [-4.6, 1.6, 2.2],
      [-3.9, 2.8, 1.5],
      [4.4, -2.4, 1.9],
      [4.8, -1.8, 2.4],
      [4.1, -3.0, 1.6],
      [-3.5, -3.4, 1.7],
    ].forEach(([x, z, h]) => junco(x, z, h));

    function roca(x: number, z: number, s: number) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(s, 10, 8),
        new THREE.MeshToonMaterial({ color: 0x6d7a72 }),
      );
      m.scale.set(1.3, 0.55, 1.1);
      m.position.set(x, s * 0.25, z);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    }
    roca(-3.6, -1.2, 0.42);
    roca(-3.1, -1.55, 0.28);
    roca(3.6, 1.8, 0.36);

    const luciernagas: THREE.Mesh[] = [];
    for (let i = 0; i < 14; i++) {
      const l = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xd6ff6b,
          transparent: true,
          opacity: 0.85,
        }),
      );
      l.position.set(
        (Math.random() - 0.5) * 8,
        0.4 + Math.random() * 2.2,
        (Math.random() - 0.5) * 8,
      );
      l.userData = {
        ox: l.position.x,
        oy: l.position.y,
        oz: l.position.z,
        s: 0.6 + Math.random() * 1.4,
        p: Math.random() * Math.PI * 2,
      };
      scene.add(l);
      luciernagas.push(l);
    }

    const sapo = crearSapo();
    sapo.position.y = 0.04;
    scene.add(sapo);
    sapoRef.current = sapo;
    setListo(true);

    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      aguaMat.uniforms.uTime.value = t;
      luciernagas.forEach((l) => {
        const u = l.userData;
        l.position.x = u.ox + Math.sin(t * u.s + u.p) * 0.35;
        l.position.y = u.oy + Math.sin(t * u.s * 1.3 + u.p) * 0.22;
        l.position.z = u.oz + Math.cos(t * u.s * 0.8 + u.p) * 0.3;
        (l.material as THREE.MeshBasicMaterial).opacity =
          0.45 + Math.sin(t * 3 + u.p) * 0.35;
      });
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      controls.dispose();
      renderer.dispose();
      aguaGeo.dispose();
      aguaMat.dispose();
      sapoRef.current = null;
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const actuar = (siguiente: Accion) => {
    const sapo = sapoRef.current;
    if (!sapo) return;
    if (jumpTimer.current) {
      window.clearTimeout(jumpTimer.current);
      jumpTimer.current = null;
    }
    if (siguiente === "caminar") sapo.caminar();
    if (siguiente === "saltar") {
      sapo.saltar();
      jumpTimer.current = window.setTimeout(() => {
        setAccion((a) => (a === "saltar" ? "quieto" : a));
      }, 1250);
    }
    if (siguiente === "quieto") sapo.quedarseQuieto();
    setAccion(siguiente);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #8fd4e8 0%, #5eb8c4 42%, #2f8f8a 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 70% 0%, #ffe7a8 0%, transparent 46%)",
        }}
      />

      <div ref={mountRef} className="absolute inset-0" />

      <header className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-5 md:p-8">
        <div>
          <p className="font-display text-[11px] uppercase tracking-[0.28em] text-emerald-50/80">
            Three.js · primitivas
          </p>
          <h1 className="font-display mt-1 text-4xl font-semibold leading-none tracking-tight md:text-5xl">
            El Sapo
          </h1>
          <p className="mt-2 max-w-xs text-sm text-emerald-50/85">
            Modelo cartoon con esferas, cilindros y cajas. Prueba sus tres
            acciones.
          </p>
        </div>
        <div className="hidden rounded-2xl bg-white/15 px-4 py-3 text-right backdrop-blur-md md:block">
          <p className="text-[11px] uppercase tracking-widest text-white/70">
            Estado
          </p>
          <p className="font-display text-lg capitalize">{accion}</p>
        </div>
      </header>

      <div className="absolute bottom-6 left-1/2 z-10 w-[min(92vw,560px)] -translate-x-1/2">
        <div className="rounded-3xl border border-white/25 bg-emerald-950/35 p-3 shadow-2xl shadow-emerald-950/30 backdrop-blur-xl md:p-4">
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <Boton
              activo={accion === "caminar"}
              disabled={!listo}
              onClick={() => actuar("caminar")}
              etiqueta="Caminar"
              icono="🚶"
            />
            <Boton
              activo={accion === "saltar"}
              disabled={!listo}
              onClick={() => actuar("saltar")}
              etiqueta="Saltar"
              icono="⬆"
            />
            <Boton
              activo={accion === "quieto"}
              disabled={!listo}
              onClick={() => actuar("quieto")}
              etiqueta="Quieto"
              icono="☺"
            />
          </div>
          <p className="mt-3 text-center text-[11px] text-white/65">
            Arrastra para orbitar · rueda para zoom ·{" "}
            <span className="text-white/90">crearSapo()</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Boton({
  activo,
  disabled,
  onClick,
  etiqueta,
  icono,
}: {
  activo: boolean;
  disabled: boolean;
  onClick: () => void;
  etiqueta: string;
  icono: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`font-display rounded-2xl px-2 py-3 text-sm transition md:px-3 md:py-3.5 md:text-base ${
        activo
          ? "bg-lime-300 text-emerald-950 shadow-lg shadow-lime-300/30"
          : "bg-white/15 text-white hover:bg-white/25"
      } disabled:opacity-40`}
    >
      <span className="mr-1.5">{icono}</span>
      {etiqueta}
    </button>
  );
}
