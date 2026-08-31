import * as THREE from "three";

/** Crea una textura circular suave para partículas y efectos. */
function makeDotTexture(): THREE.Texture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  drag: number;
  gravity: number;
}

interface Transient {
  obj: THREE.Object3D;
  life: number;
  maxLife: number;
  update: (t: number, dt: number) => void;
  disposeMat?: boolean;
}

/**
 * Sistema de partículas (Points con shader propio para tamaño/alpha por
 * partícula) + mallas efímeras (arcos de corte, ondas de choque, anillos).
 */
export class Effects {
  private scene: THREE.Scene;
  private max = 700;
  private alive: Particle[] = [];
  private free: Particle[] = [];

  private points: THREE.Points;
  private posAttr: THREE.BufferAttribute;
  private colAttr: THREE.BufferAttribute;
  private sizeAttr: THREE.BufferAttribute;
  private alphaAttr: THREE.BufferAttribute;
  private dotTex: THREE.Texture;

  private transients: Transient[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.dotTex = makeDotTexture();
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.max * 3);
    const col = new Float32Array(this.max * 3);
    const siz = new Float32Array(this.max);
    const alp = new Float32Array(this.max);
    this.posAttr = new THREE.BufferAttribute(pos, 3);
    this.colAttr = new THREE.BufferAttribute(col, 3);
    this.sizeAttr = new THREE.BufferAttribute(siz, 1);
    this.alphaAttr = new THREE.BufferAttribute(alp, 1);
    geo.setAttribute("position", this.posAttr);
    geo.setAttribute("color", this.colAttr);
    geo.setAttribute("aSize", this.sizeAttr);
    geo.setAttribute("aAlpha", this.alphaAttr);
    geo.setDrawRange(0, 0);

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: this.dotTex } },
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (320.0 / max(-mv.z, 0.1));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(vColor * t.rgb, vAlpha * t.a);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  private spawn(p: Partial<Particle>): void {
    const part =
      this.free.pop() ??
      ({
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        r: 1,
        g: 1,
        b: 1,
        drag: 2,
        gravity: 0,
      } as Particle);
    Object.assign(part, p);
    this.alive.push(part);
  }

  burst(
    pos: THREE.Vector3,
    color: THREE.Color,
    count: number,
    opts?: {
      speed?: number;
      size?: number;
      life?: number;
      gravity?: number;
      spread?: number;
      upBias?: number;
    }
  ): void {
    const speed = opts?.speed ?? 5;
    const size = opts?.size ?? 0.4;
    const life = opts?.life ?? 0.6;
    const gravity = opts?.gravity ?? 6;
    const upBias = opts?.upBias ?? 0.4;
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * upBias + 0.3,
        Math.random() * 2 - 1
      ).normalize();
      const s = speed * (0.4 + Math.random() * 0.8);
      this.spawn({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        vx: dir.x * s,
        vy: dir.y * s,
        vz: dir.z * s,
        life: life * (0.6 + Math.random() * 0.6),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        r: color.r,
        g: color.g,
        b: color.b,
        drag: 2.4,
        gravity,
      });
    }
  }

  /** Pequeño chisporroteo al golpear. */
  spark(pos: THREE.Vector3, color: THREE.Color): void {
    this.burst(pos, color, 6, { speed: 6, size: 0.32, life: 0.3, gravity: 2 });
  }

  /** Arco de corte delante de la mantis. */
  slashArc(
    pos: THREE.Vector3,
    facing: number,
    range: number,
    arc: number,
    color: THREE.Color
  ): void {
    const geo = new THREE.RingGeometry(range * 0.25, range, 18, 1, -arc / 2, arc);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pivot = new THREE.Group();
    pivot.position.copy(pos);
    pivot.position.y += 0.6;
    pivot.rotation.y = facing;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    pivot.add(mesh);
    this.scene.add(pivot);
    const initScale = 0.5;
    this.addTransient(pivot, 0.26, (t) => {
      const s = initScale + (1 - initScale) * Math.min(1, t * 2.2);
      mesh.scale.setScalar(s);
      mat.opacity = 0.85 * (1 - t);
    });
  }

  /** Onda de choque expansiva (especial giratorio). */
  shockwave(pos: THREE.Vector3, color: THREE.Color, maxR: number): void {
    const geo = new THREE.RingGeometry(0.4, 0.7, 40);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.15;
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    this.addTransient(mesh, 0.5, (t) => {
      const s = 0.4 + (maxR / 0.7) * t;
      mesh.scale.setScalar(s);
      mat.opacity = 0.9 * (1 - t);
    });
  }

  /** Anillo en el suelo (impacto en el nido, etc.). */
  groundRing(
    pos: THREE.Vector3,
    color: THREE.Color,
    maxR: number,
    width = 0.5
  ): void {
    const geo = new THREE.RingGeometry(maxR * 0.7, maxR * 0.7 + width, 48);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.1;
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    this.addTransient(mesh, 0.55, (t) => {
      const s = 0.2 + 1.6 * t;
      mesh.scale.setScalar(s);
      mat.opacity = 0.8 * (1 - t);
    });
  }

  /** Estela del dash. */
  dashPuff(pos: THREE.Vector3, color: THREE.Color): void {
    this.burst(pos, color, 5, {
      speed: 2.5,
      size: 0.5,
      life: 0.35,
      gravity: -1,
      upBias: 0.2,
    });
  }

  private addTransient(
    obj: THREE.Object3D,
    life: number,
    update: (t: number, dt: number) => void,
    disposeMat = true
  ): void {
    this.transients.push({ obj, life, maxLife: life, update, disposeMat });
  }

  update(dt: number): void {
    // Partículas
    const alive = this.alive;
    for (let i = alive.length - 1; i >= 0; i--) {
      const p = alive[i];
      p.life -= dt;
      if (p.life <= 0) {
        alive[i] = alive[alive.length - 1];
        alive.pop();
        this.free.push(p);
        continue;
      }
      p.vy -= p.gravity * dt;
      const dragF = Math.max(0, 1 - p.drag * dt);
      p.vx *= dragF;
      p.vy *= dragF;
      p.vz *= dragF;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.05) p.y = 0.05;
    }

    const n = Math.min(alive.length, this.max);
    for (let i = 0; i < n; i++) {
      const p = alive[i];
      const k = p.life / p.maxLife;
      this.posAttr.array[i * 3] = p.x;
      this.posAttr.array[i * 3 + 1] = p.y;
      this.posAttr.array[i * 3 + 2] = p.z;
      this.colAttr.array[i * 3] = p.r;
      this.colAttr.array[i * 3 + 1] = p.g;
      this.colAttr.array[i * 3 + 2] = p.b;
      this.sizeAttr.array[i] = p.size * (0.6 + 0.6 * k);
      this.alphaAttr.array[i] = Math.min(1, k * 1.6);
    }
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    this.alphaAttr.needsUpdate = true;
    this.points.geometry.setDrawRange(0, n);

    // Transitorios
    for (let i = this.transients.length - 1; i >= 0; i--) {
      const tr = this.transients[i];
      tr.life -= dt;
      const t = 1 - Math.max(0, tr.life) / tr.maxLife;
      tr.update(t, dt);
      if (tr.life <= 0) {
        this.scene.remove(tr.obj);
        tr.obj.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (tr.disposeMat && m.material) {
            const mat = m.material as THREE.Material | THREE.Material[];
            if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
            else mat.dispose();
          }
        });
        this.transients[i] = this.transients[this.transients.length - 1];
        this.transients.pop();
      }
    }
  }

  dispose(): void {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.dotTex.dispose();
    for (const tr of this.transients) {
      this.scene.remove(tr.obj);
    }
    this.transients = [];
    this.alive = [];
    this.free = [];
  }
}
