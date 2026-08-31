import * as THREE from "three";
import { ARENA_RADIUS } from "./types";

/** Generador de números pseudo-aleatorios con semilla para decoración estable. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGroundTexture(): THREE.Texture {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  // Base musgo
  ctx.fillStyle = "#243a23";
  ctx.fillRect(0, 0, size, size);
  const rnd = mulberry32(7);
  // Manchas de color
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 6 + rnd() * 40;
    const hue = 90 + rnd() * 40;
    const light = 12 + rnd() * 26;
    ctx.fillStyle = `hsla(${hue}, ${30 + rnd() * 30}%, ${light}%, 0.5)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Brillos mágicos dispersos
  for (let i = 0; i < 220; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 1 + rnd() * 2.5;
    ctx.fillStyle = `rgba(150,255,210,${0.15 + rnd() * 0.35})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Construye el entorno: suelo, anillo del borde, decoración mágica y luces.
 * Devuelve una función de limpieza.
 */
export function buildWorld(scene: THREE.Scene): () => void {
  const disposables: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];
  const objs: THREE.Object3D[] = [];

  // --- Luces ---
  const hemi = new THREE.HemisphereLight(0x9fb8ff, 0x20331f, 0.85);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0x404a6b, 0.5);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xcfe0ff, 1.15);
  dir.position.set(18, 34, 14);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 120;
  const sc = 34;
  dir.shadow.camera.left = -sc;
  dir.shadow.camera.right = sc;
  dir.shadow.camera.top = sc;
  dir.shadow.camera.bottom = -sc;
  dir.shadow.bias = -0.0004;
  dir.shadow.normalBias = 0.04;
  scene.add(dir);
  scene.add(dir.target);

  // --- Suelo ---
  const groundTex = makeGroundTexture();
  const groundGeo = new THREE.CircleGeometry(ARENA_RADIUS + 6, 80);
  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTex,
    roughness: 0.96,
    metalness: 0.0,
    color: 0x8fbf86,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  objs.push(ground);
  disposables.push({ geo: groundGeo, mat: groundMat });

  // Anillo de borde místico
  const ringGeo = new THREE.TorusGeometry(ARENA_RADIUS, 0.5, 12, 120);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x2a6f5a,
    emissive: 0x2ee6a0,
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  scene.add(ring);
  objs.push(ring);
  disposables.push({ geo: ringGeo, mat: ringMat });

  // Anillos concéntricos tenues
  for (let i = 1; i <= 3; i++) {
    const r = ARENA_RADIUS * (i / 4);
    const g = new THREE.RingGeometry(r - 0.06, r + 0.06, 96);
    const m = new THREE.MeshBasicMaterial({
      color: 0x39e6a0,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;
    scene.add(mesh);
    objs.push(mesh);
    disposables.push({ geo: g, mat: m });
  }

  const rnd = mulberry32(42);

  const add = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    mesh: THREE.Object3D
  ) => {
    scene.add(mesh);
    objs.push(mesh);
    disposables.push({ geo, mat });
  };

  // --- Setas mágicas ---
  const capColors = [0x4be3a0, 0x6ad0ff, 0xc46bff, 0xffd166];
  for (let i = 0; i < 16; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = 8 + rnd() * (ARENA_RADIUS - 9);
    const x = Math.cos(ang) * dist;
    const z = Math.sin(ang) * dist;
    const s = 0.7 + rnd() * 0.9;
    const grp = new THREE.Group();
    grp.position.set(x, 0, z);
    const stemGeo = new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 0.9 * s, 8);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0xeaf3e0,
      roughness: 0.8,
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.45 * s;
    stem.castShadow = true;
    grp.add(stem);
    const capCol = capColors[(rnd() * capColors.length) | 0];
    const capGeo = new THREE.SphereGeometry(0.42 * s, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({
      color: capCol,
      emissive: capCol,
      emissiveIntensity: 0.9,
      roughness: 0.5,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.9 * s;
    cap.scale.y = 0.7;
    cap.castShadow = true;
    grp.add(cap);
    scene.add(grp);
    objs.push(grp);
    disposables.push({ geo: stemGeo, mat: stemMat });
    disposables.push({ geo: capGeo, mat: capMat });
  }

  // --- Cristales brillantes ---
  const crystalColors = [0x3fe0ff, 0xb46bff, 0x4dffb0];
  for (let i = 0; i < 10; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = 10 + rnd() * (ARENA_RADIUS - 11);
    const grp = new THREE.Group();
    grp.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    grp.rotation.y = rnd() * Math.PI;
    const col = crystalColors[(rnd() * crystalColors.length) | 0];
    const n = 1 + ((rnd() * 3) | 0);
    for (let j = 0; j < n; j++) {
      const h = 0.8 + rnd() * 1.6;
      const g = new THREE.ConeGeometry(0.28 + rnd() * 0.2, h, 5);
      const m = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 1.1,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set((rnd() - 0.5) * 0.6, h / 2, (rnd() - 0.5) * 0.6);
      mesh.castShadow = true;
      grp.add(mesh);
      disposables.push({ geo: g, mat: m });
    }
    scene.add(grp);
    objs.push(grp);
  }

  // --- Rocas ---
  for (let i = 0; i < 14; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = 7 + rnd() * (ARENA_RADIUS - 8);
    const s = 0.5 + rnd() * 1.1;
    const g = new THREE.DodecahedronGeometry(s, 0);
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.28, 0.15, 0.18 + rnd() * 0.1),
      roughness: 1,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(Math.cos(ang) * dist, s * 0.4, Math.sin(ang) * dist);
    mesh.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    mesh.scale.y = 0.7;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    add(g, m, mesh);
  }

  // --- Mechones de hierba ---
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x4f8f4a,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 60; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = 5 + rnd() * (ARENA_RADIUS - 6);
    const grp = new THREE.Group();
    grp.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    const blades = 3 + ((rnd() * 3) | 0);
    for (let j = 0; j < blades; j++) {
      const g = new THREE.ConeGeometry(0.07, 0.5 + rnd() * 0.5, 4);
      const mesh = new THREE.Mesh(g, grassMat);
      mesh.position.set((rnd() - 0.5) * 0.3, 0.25, (rnd() - 0.5) * 0.3);
      mesh.rotation.z = (rnd() - 0.5) * 0.4;
      grp.add(mesh);
    }
    scene.add(grp);
    objs.push(grp);
  }
  disposables.push({ geo: new THREE.BufferGeometry(), mat: grassMat });

  return () => {
    objs.forEach((o) => scene.remove(o));
    disposables.forEach((d) => {
      d.geo.dispose();
      d.mat.dispose();
    });
    scene.remove(hemi, ambient, dir);
    groundTex.dispose();
  };
}
