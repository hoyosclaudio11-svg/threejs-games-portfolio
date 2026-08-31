import * as THREE from "three";
import { ARENA_RADIUS, type MantisInput } from "./types";

/** Suaviza un ángulo acortando el camino más corto. */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

interface Foreleg {
  pivot: THREE.Group;
  elbow: THREE.Group;
  splay: number;
}

/**
 * La mantis religiosa protagonista. Construida con primitivas: cuerpo
 * alargado verde, ojos brillantes, antenas y dos grandes patas raptoriales
 * (garras) plegadas en "oración" que se abalanzan al atacar.
 */
export class Mantis {
  group = new THREE.Group();
  body = new THREE.Group();
  position = new THREE.Vector3(0, 0, 6);
  vel = new THREE.Vector3();

  facing = 0;
  hp = 120;
  readonly maxHp = 120;
  readonly radius = 0.95;
  readonly speed = 9.5;

  // Parámetros de combate (los lee el Game para resolver impactos)
  readonly slashRange = 2.7;
  readonly slashArc = 1.5;
  readonly slashDmg = 17;
  readonly slashCdMax = 0.4;
  readonly spinRange = 3.3;
  readonly spinDmg = 30;
  readonly spinCdMax = 6;
  readonly dashSpeed = 30;
  readonly dashDmg = 20;
  readonly dashCdMax = 2.1;
  readonly dashDur = 0.22;

  slashCd = 0;
  spinCd = 0;
  dashCd = 0;

  private slashAnim = 0;
  private spinAnim = 0;
  spinning = false;
  private dashTimer = 0;
  private dashVel = new THREE.Vector3();
  dashHits = new Set<number>();
  invuln = 0;
  alive = true;

  private walkPhase = 0;
  private t = 0;

  private foreL!: Foreleg;
  private foreR!: Foreleg;
  private midLegs: THREE.Object3D[] = [];
  private head!: THREE.Object3D;
  private antennae: THREE.Object3D[] = [];
  private disposables: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];

  constructor(scene: THREE.Scene) {
    this.build();
    this.group.add(this.body);
    scene.add(this.group);
    this.group.position.copy(this.position);
  }

  private add(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    mesh: THREE.Object3D
  ): THREE.Mesh {
    const m = new THREE.Mesh(geo, mat);
    mesh.add(m);
    this.disposables.push({ geo, mat });
    return m;
  }

  private build(): void {
    const green = new THREE.Color(0x57c24a);
    const greenDark = new THREE.Color(0x2f7d33);
    const greenLight = new THREE.Color(0x8fe06a);

    const bodyMat = (c: THREE.Color) =>
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, flatShading: true });
    const matBody = bodyMat(green);
    const matBodyDark = bodyMat(greenDark);
    const matBodyLight = bodyMat(greenLight);

    // Cabeza (triangular) — al frente (+Z)
    const headGeo = new THREE.ConeGeometry(0.42, 0.9, 6);
    this.head = new THREE.Group();
    const headMesh = this.add(headGeo, matBody, this.head);
    headMesh.rotation.x = Math.PI / 2; // apunta hacia +Z
    headMesh.position.z = 0.25;
    this.head.position.set(0, 0.95, 1.05);
    this.body.add(this.head);

    // Ojos grandes y brillantes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xaaffe6,
      emissive: 0x6fffd0,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    for (const sx of [-1, 1]) {
      const eye = this.add(new THREE.SphereGeometry(0.18, 12, 10), eyeMat, this.head);
      eye.position.set(sx * 0.22, 0.05, 0.55);
    }
    this.disposables.push({ geo: new THREE.BufferGeometry(), mat: eyeMat });

    // Antenas
    const antMat = new THREE.MeshStandardMaterial({ color: greenLight, roughness: 0.6 });
    for (const sx of [-1, 1]) {
      const ant = new THREE.Group();
      const seg = this.add(new THREE.CylinderGeometry(0.025, 0.04, 0.9, 5), antMat, ant);
      seg.position.y = 0.45;
      ant.position.set(sx * 0.12, 0.15, 0.6);
      ant.rotation.x = -0.5;
      ant.rotation.z = sx * 0.25;
      this.head.add(ant);
      this.antennae.push(ant);
    }
    this.disposables.push({ geo: new THREE.BufferGeometry(), mat: antMat });

    // Tórax
    const thorax = this.add(new THREE.SphereGeometry(0.5, 12, 10), matBody, this.body);
    thorax.position.set(0, 0.85, 0.4);
    thorax.scale.set(1, 0.9, 1.3);

    // Abdomen largo y elevado
    const abd = this.add(new THREE.SphereGeometry(0.6, 14, 12), matBodyDark, this.body);
    abd.position.set(0, 1.0, -0.7);
    abd.scale.set(0.9, 0.85, 1.8);
    const abdTip = this.add(new THREE.ConeGeometry(0.4, 0.8, 10), matBodyDark, this.body);
    abdTip.position.set(0, 1.0, -1.7);
    abdTip.rotation.x = -Math.PI / 2;

    // Patas medias/traseras (silueta)
    const legMat = bodyMat(greenDark);
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        const leg = new THREE.Group();
        const seg = this.add(new THREE.CylinderGeometry(0.06, 0.08, 1.1, 6), legMat, leg);
        seg.position.y = -0.55;
        leg.position.set(sx * 0.4, 0.8, i === 0 ? 0.5 : -0.2);
        leg.rotation.z = sx * 0.9;
        leg.rotation.x = -0.3;
        this.body.add(leg);
        this.midLegs.push(leg);
      }
    }
    this.disposables.push({ geo: new THREE.BufferGeometry(), mat: legMat });

    // Patas raptoriales (garras) — el arma
    const clawMat = bodyMat(greenLight);
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x163d18,
      roughness: 0.5,
      flatShading: true,
    });
    this.foreL = this.buildForeleg(-1, clawMat, spineMat, matBodyLight);
    this.foreR = this.buildForeleg(1, clawMat, spineMat, matBodyLight);
    this.disposables.push({ geo: new THREE.BufferGeometry(), mat: clawMat });
    this.disposables.push({ geo: new THREE.BufferGeometry(), mat: spineMat });
  }

  private buildForeleg(
    side: number,
    mat: THREE.Material,
    spineMat: THREE.Material,
    jointMat: THREE.Material
  ): Foreleg {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.42, 0.95, 0.7);
    this.body.add(pivot);

    // Fémur (segmento grueso) hacia adelante
    const femur = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.95, 8),
      mat
    );
    femur.geometry.rotateX(Math.PI / 2);
    femur.position.z = 0.5;
    femur.castShadow = true;
    pivot.add(femur);
    this.disposables.push({ geo: femur.geometry, mat });

    // Espinas del fémur
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 5), spineMat);
      sp.position.set(side * 0.12, 0.06, 0.25 + i * 0.18);
      sp.rotation.z = side * 1.0;
      pivot.add(sp);
      this.disposables.push({ geo: sp.geometry, mat: spineMat });
    }

    // Codo + tibia (garra plegada)
    const elbow = new THREE.Group();
    elbow.position.z = 0.95;
    pivot.add(elbow);
    const tibia = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.06, 0.95, 7),
      jointMat
    );
    tibia.geometry.rotateX(Math.PI / 2);
    tibia.position.z = 0.5;
    tibia.castShadow = true;
    elbow.add(tibia);
    this.disposables.push({ geo: tibia.geometry, mat: jointMat });
    // Garra final
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 6), spineMat);
    claw.geometry.rotateX(Math.PI / 2);
    claw.position.z = 1.0;
    elbow.add(claw);
    this.disposables.push({ geo: claw.geometry, mat: spineMat });

    return { pivot, elbow, splay: side * 0.35 };
  }

  /** Devuelve true si realmente inició el corte (cooldown y estado ok). */
  tryStartSlash(): boolean {
    if (this.slashCd > 0 || this.spinning || this.dashTimer > 0 || !this.alive) return false;
    this.slashCd = this.slashCdMax;
    this.slashAnim = 1;
    return true;
  }

  tryStartSpin(): boolean {
    if (this.spinCd > 0 || this.spinning || this.dashTimer > 0 || !this.alive) return false;
    this.spinCd = this.spinCdMax;
    this.spinning = true;
    this.spinAnim = 1;
    this.invuln = Math.max(this.invuln, 0.35);
    return true;
  }

  tryStartDash(dir: THREE.Vector3): boolean {
    if (this.dashCd > 0 || this.dashTimer > 0 || !this.alive) return false;
    this.dashCd = this.dashCdMax;
    this.dashTimer = this.dashDur;
    const d = dir.lengthSq() > 0.0001 ? dir.clone().normalize() : this.forward();
    this.dashVel.copy(d).multiplyScalar(this.dashSpeed);
    this.facing = Math.atan2(d.x, d.z);
    this.invuln = Math.max(this.invuln, this.dashDur + 0.06);
    this.dashHits.clear();
    return true;
  }

  forward(): THREE.Vector3 {
    return new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
  }

  get isDashing(): boolean {
    return this.dashTimer > 0;
  }

  get isInvuln(): boolean {
    return this.invuln > 0;
  }

  takeDamage(dmg: number, from: THREE.Vector3): boolean {
    if (this.invuln > 0 || !this.alive) return false;
    this.hp -= dmg;
    // pequeño retroceso
    const kb = this.position.clone().sub(from).setY(0).normalize().multiplyScalar(2.2);
    this.vel.add(kb);
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  reset(pos: THREE.Vector3): void {
    this.hp = this.maxHp;
    this.slashCd = this.spinCd = this.dashCd = 0;
    this.slashAnim = this.spinAnim = 0;
    this.spinning = false;
    this.dashTimer = 0;
    this.invuln = 0;
    this.alive = true;
    this.vel.set(0, 0, 0);
    this.position.copy(pos);
    this.facing = Math.PI;
    this.group.position.copy(pos);
  }

  update(dt: number, input: MantisInput): void {
    this.t += dt;

    // Cooldowns
    this.slashCd = Math.max(0, this.slashCd - dt);
    this.spinCd = Math.max(0, this.spinCd - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.slashAnim = Math.max(0, this.slashAnim - dt * 4.5);
    this.spinAnim = Math.max(0, this.spinAnim - dt * 1.4);
    if (this.spinAnim <= 0) this.spinning = false;

    // Movimiento
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.position.addScaledVector(this.dashVel, dt);
      this.dashVel.multiplyScalar(Math.max(0, 1 - dt * 4));
    } else if (this.alive) {
      const move = input.move;
      const len = move.length();
      if (len > 0.01) {
        const dir = move.clone().multiplyScalar(1 / len);
        this.vel.x += (dir.x * this.speed - this.vel.x) * Math.min(1, dt * 12);
        this.vel.z += (dir.z * this.speed - this.vel.z) * Math.min(1, dt * 12);
      } else {
        this.vel.multiplyScalar(Math.max(0, 1 - dt * 10));
      }
      this.position.addScaledVector(this.vel, dt);
    } else {
      this.vel.multiplyScalar(Math.max(0, 1 - dt * 6));
    }

    // Limite del escenario
    const r = Math.hypot(this.position.x, this.position.z);
    const maxR = ARENA_RADIUS - this.radius;
    if (r > maxR) {
      this.position.x *= maxR / r;
      this.position.z *= maxR / r;
    }

    // Orientación
    if (this.spinning) {
      this.facing += dt * 16;
    } else {
      this.facing = lerpAngle(this.facing, input.aimAngle, Math.min(1, dt * 16));
    }

    // Velocidad horizontal para animar
    const speed = this.dashTimer > 0 ? this.dashSpeed * 0.5 : Math.hypot(this.vel.x, this.vel.z);
    this.walkPhase += dt * (6 + speed * 1.2);

    this.group.position.copy(this.position);
    this.group.rotation.y = this.facing;

    // Bob del cuerpo
    const moving = speed > 0.6 ? 1 : 0.2;
    this.body.position.y = Math.sin(this.walkPhase * 2) * 0.06 * moving;
    this.body.rotation.z = Math.sin(this.walkPhase) * 0.03 * moving;

    // Antenas se menean
    this.antennae.forEach((a, i) => {
      a.rotation.x = -0.5 + Math.sin(this.t * 4 + i) * 0.15;
    });

    // Patas medias caminan
    this.midLegs.forEach((leg, i) => {
      leg.rotation.x = -0.3 + Math.sin(this.walkPhase + i * 1.4) * 0.35 * moving;
    });

    // Animación de las garras (plegado <-> extendido)
    const ease = 1 - Math.pow(1 - this.slashAnim, 3);
    const foldX = -0.5;
    const extX = 0.35;
    const foldElbow = 2.7;
    const extElbow = 0.2;
    for (const f of [this.foreL, this.foreR]) {
      const x = foldX + (extX - foldX) * ease;
      const ex = foldElbow + (extElbow - foldElbow) * ease;
      const spinBoost = this.spinning ? 0.6 : 0;
      f.pivot.rotation.set(x, f.splay, 0);
      f.elbow.rotation.set(ex + spinBoost, 0, 0);
    }
  }

  dispose(): void {
    this.group.parent?.remove(this.group);
    this.disposables.forEach((d) => {
      d.geo.dispose();
      d.mat.dispose();
    });
  }
}
