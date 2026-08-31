import * as THREE from "three";
import { ARENA_RADIUS, type EnemyContext, type EnemyType } from "./types";

let ENEMY_ID = 1;

export interface EnemyConfig {
  hp: number;
  speed: number;
  dmg: number;
  radius: number;
  attackRange: number;
  attackCd: number;
  color: number;
  aggro: number; // distancia a la que persigue a la mantis (>9999 = siempre)
  scale: number;
  fly: boolean;
  boss: boolean;
}

const BASE: Record<EnemyType, EnemyConfig> = {
  beetle: {
    hp: 34, speed: 3.0, dmg: 7, radius: 0.7, attackRange: 1.7, attackCd: 1.0,
    color: 0x6a3fa0, aggro: 4.5, scale: 1, fly: false, boss: false,
  },
  wasp: {
    hp: 16, speed: 6.0, dmg: 5, radius: 0.55, attackRange: 1.9, attackCd: 0.8,
    color: 0xf2c40f, aggro: 0, scale: 0.95, fly: true, boss: false,
  },
  grub: {
    hp: 64, speed: 2.3, dmg: 10, radius: 0.95, attackRange: 2.0, attackCd: 1.3,
    color: 0xa7c64f, aggro: 3.5, scale: 1.15, fly: false, boss: false,
  },
  stalker: {
    hp: 30, speed: 6.6, dmg: 8, radius: 0.6, attackRange: 1.7, attackCd: 0.9,
    color: 0xe23b8b, aggro: 99999, scale: 1.0, fly: false, boss: false,
  },
  brute: {
    hp: 220, speed: 1.8, dmg: 20, radius: 1.5, attackRange: 2.7, attackCd: 1.6,
    color: 0x9a2233, aggro: 5, scale: 1.8, fly: false, boss: true,
  },
};

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export class Enemy {
  id: number;
  type: EnemyType;
  config: EnemyConfig;
  group = new THREE.Group();
  position = new THREE.Vector3();
  facing = 0;
  hp: number;
  maxHp: number;
  dmg: number;
  radius: number;
  speed: number;

  private vel = new THREE.Vector3();
  private knock = new THREE.Vector3();
  private attackTimer = 0;
  private hitFlash = 0;
  private spawnT = 0;
  private dead = false;
  private walkPhase = Math.random() * 10;
  private t = 0;
  private attackAnim = 0;
  private bodyRef = new THREE.Group();
  private flashMats: THREE.MeshStandardMaterial[] = [];
  private legRefs: THREE.Object3D[] = [];
  private wings: THREE.Object3D[] = [];
  private disposables: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];
  private baseY: number;

  constructor(
    scene: THREE.Scene,
    type: EnemyType,
    pos: THREE.Vector3,
    wave: number
  ) {
    this.id = ENEMY_ID++;
    this.type = type;
    this.config = BASE[type];
    const hpMult = 1 + wave * 0.09;
    const speedMult = Math.min(1.5, 1 + wave * 0.012);
    const dmgMult = 1 + wave * 0.05;
    this.hp = Math.round(this.config.hp * hpMult);
    this.maxHp = this.hp;
    this.dmg = this.config.dmg * dmgMult;
    this.radius = this.config.radius;
    this.speed = this.config.speed * speedMult;
    this.baseY = this.config.fly ? 1.7 : 0;
    this.position.copy(pos);

    this.group.add(this.bodyRef);
    this.build();
    this.group.scale.setScalar(0.01);
    this.group.position.copy(pos);
    scene.add(this.group);
  }

  private add(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    parent: THREE.Object3D,
    flash = false
  ): THREE.Mesh {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    parent.add(m);
    this.disposables.push({ geo, mat });
    if (flash && (mat as THREE.MeshStandardMaterial).emissive) {
      this.flashMats.push(mat as THREE.MeshStandardMaterial);
    }
    return m;
  }

  private build(): void {
    const s = this.config.scale;
    switch (this.type) {
      case "beetle":
        this.buildBeetle(s);
        break;
      case "wasp":
        this.buildWasp(s);
        break;
      case "grub":
        this.buildGrub(s);
        break;
      case "stalker":
        this.buildStalker(s);
        break;
      case "brute":
        this.buildBrute(s);
        break;
    }
  }

  private makeMat(color: number, rough = 0.6): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: rough,
      flatShading: true,
    });
  }

  private makeLegs(
    parent: THREE.Object3D,
    count: number,
    spread: number,
    zStart: number,
    zSpan: number,
    len: number,
    mat: THREE.Material
  ): void {
    for (const side of [-1, 1]) {
      for (let i = 0; i < count; i++) {
        const leg = new THREE.Group();
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, len, 5), mat);
        seg.geometry.translate(0, -len / 2, 0);
        seg.castShadow = true;
        leg.add(seg);
        leg.position.set(side * spread, 0, zStart - i * (zSpan / Math.max(1, count - 1)));
        leg.rotation.z = side * 0.8;
        parent.add(leg);
        this.legRefs.push(leg);
        this.disposables.push({ geo: seg.geometry, mat });
      }
    }
  }

  private buildBeetle(s: number): void {
    const body = this.makeMat(0x4a2d75);
    const shell = this.makeMat(0x6a3fa0, 0.3);
    shell.metalness = 0.2;
    const belly = this.add(new THREE.SphereGeometry(0.55 * s, 12, 10), body, this.bodyRef, true);
    belly.scale.set(1, 0.8, 1.3);
    belly.position.y = 0.45 * s;
    const dome = this.add(
      new THREE.SphereGeometry(0.6 * s, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      shell,
      this.bodyRef,
      true
    );
    dome.scale.set(1, 0.8, 1.2);
    dome.position.y = 0.55 * s;
    // Cabeza + mandíbulas
    const head = this.add(new THREE.SphereGeometry(0.32 * s, 10, 8), body, this.bodyRef, true);
    head.position.set(0, 0.4 * s, 0.7 * s);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff5566, emissive: 0xff2233, emissiveIntensity: 2,
    });
    for (const sx of [-1, 1]) {
      const e = this.add(new THREE.SphereGeometry(0.07 * s, 8, 6), eyeMat, this.bodyRef);
      e.position.set(sx * 0.16 * s, 0.5 * s, 0.85 * s);
    }
    this.makeLegs(this.bodyRef, 3, 0.5 * s, 0.4 * s, 0.7 * s, 0.6 * s, body);
  }

  private buildWasp(s: number): void {
    const bodyMat = this.makeMat(0x1a1a1a);
    const stripeMat = this.makeMat(0xf2c40f, 0.4);
    // Cuerpo segmentado
    const segs = 3;
    for (let i = 0; i < segs; i++) {
      const m = i % 2 === 0 ? bodyMat : stripeMat;
      const seg = this.add(new THREE.SphereGeometry(0.28 * s, 10, 8), m, this.bodyRef, true);
      seg.position.z = (i - 1) * 0.42 * s;
      seg.scale.set(1, 1, 1.3);
    }
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff7788, emissive: 0xff3344, emissiveIntensity: 2,
    });
    for (const sx of [-1, 1]) {
      const e = this.add(new THREE.SphereGeometry(0.08 * s, 8, 6), eyeMat, this.bodyRef);
      e.position.set(sx * 0.14 * s, 0.08 * s, 0.5 * s);
    }
    // Aguijón
    const stinger = this.add(new THREE.ConeGeometry(0.08 * s, 0.35 * s, 6), stripeMat, this.bodyRef);
    stinger.position.z = -1.05 * s;
    stinger.rotation.x = -Math.PI / 2;
    // Alas
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xbbeeff, transparent: true, opacity: 0.35,
      roughness: 0.3, side: THREE.DoubleSide,
    });
    for (const side of [-1, 1]) {
      const wing = new THREE.Group();
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.5 * s, 10), wingMat);
      w.scale.set(1, 0.5, 1);
      w.position.x = 0.5 * s;
      wing.add(w);
      wing.position.set(side * 0.2 * s, 0.25 * s, 0);
      wing.rotation.z = side * 0.5;
      this.bodyRef.add(wing);
      this.wings.push(wing);
      this.disposables.push({ geo: w.geometry, mat: wingMat });
    }
  }

  private buildGrub(s: number): void {
    const mat = this.makeMat(0xb6cf5a);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const r = (0.5 - i * 0.06) * s;
      const seg = this.add(new THREE.SphereGeometry(r, 10, 8), mat, this.bodyRef, true);
      seg.position.z = (i - 2) * 0.4 * s;
      seg.scale.set(1, 0.85, 1);
    }
    const mouth = this.add(new THREE.SphereGeometry(0.22 * s, 8, 6), this.makeMat(0x3a2a14), this.bodyRef);
    mouth.position.set(0, -0.05 * s, 0.7 * s);
  }

  private buildStalker(s: number): void {
    const mat = this.makeMat(0x7a1f4a);
    const body = this.add(new THREE.SphereGeometry(0.3 * s, 10, 8), mat, this.bodyRef, true);
    body.scale.set(1, 0.7, 2);
    body.position.y = 0.6 * s;
    const head = this.add(new THREE.ConeGeometry(0.22 * s, 0.5 * s, 6), mat, this.bodyRef, true);
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 0.55 * s, 0.55 * s);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff66cc, emissive: 0xff2aa0, emissiveIntensity: 2.4,
    });
    for (const sx of [-1, 1]) {
      const e = this.add(new THREE.SphereGeometry(0.07 * s, 8, 6), eyeMat, this.bodyRef);
      e.position.set(sx * 0.12 * s, 0.6 * s, 0.7 * s);
    }
    this.makeLegs(this.bodyRef, 2, 0.35 * s, 0.15 * s, 0.5 * s, 0.9 * s, mat);
  }

  private buildBrute(s: number): void {
    const mat = this.makeMat(0x7a1f2b);
    const plateMat = this.makeMat(0x4a141c, 0.4);
    plateMat.metalness = 0.3;
    const body = this.add(new THREE.SphereGeometry(0.95 * s, 14, 12), mat, this.bodyRef, true);
    body.scale.set(1.1, 0.9, 1.3);
    body.position.y = 0.85 * s;
    const plate = this.add(
      new THREE.SphereGeometry(1.0 * s, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      plateMat,
      this.bodyRef,
      true
    );
    plate.scale.set(1.1, 0.7, 1.3);
    plate.position.y = 1.0 * s;
    // Mandíbulas grandes
    for (const side of [-1, 1]) {
      const jaw = this.add(new THREE.ConeGeometry(0.18 * s, 0.7 * s, 6), plateMat, this.bodyRef);
      jaw.position.set(side * 0.35 * s, 0.7 * s, 1.0 * s);
      jaw.rotation.z = side * 0.7;
    }
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00, emissive: 0xff6600, emissiveIntensity: 2.6,
    });
    for (const sx of [-1, 1]) {
      const e = this.add(new THREE.SphereGeometry(0.14 * s, 8, 6), eyeMat, this.bodyRef);
      e.position.set(sx * 0.3 * s, 1.0 * s, 1.1 * s);
    }
    this.makeLegs(this.bodyRef, 3, 0.85 * s, 0.6 * s, 1.0 * s, 1.1 * s, mat);
  }

  takeDamage(dmg: number, knockDir: THREE.Vector3): boolean {
    if (this.dead) return false;
    this.hp -= dmg;
    this.hitFlash = 0.14;
    this.knock.addScaledVector(knockDir, 3.0);
    this.attackAnim = Math.min(1, this.attackAnim + 0.3);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      return true;
    }
    return false;
  }

  get isDead(): boolean {
    return this.dead;
  }

  private resolveTarget(
    ctx: EnemyContext
  ): { pos: THREE.Vector3; extra: number } {
    const dmantis = this.position.distanceToSquared(ctx.mantisPos);
    const targetMantis =
      ctx.mantisAlive &&
      (this.config.aggro > 1000 ||
        dmantis < this.config.aggro * this.config.aggro);
    return targetMantis
      ? { pos: ctx.mantisPos, extra: 0 }
      : { pos: ctx.nestPos, extra: ctx.nestRadius };
  }

  update(dt: number, ctx: EnemyContext): void {
    this.t += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    this.attackAnim = Math.max(0, this.attackAnim - dt * 3);
    this.spawnT = Math.min(1, this.spawnT + dt * 2.6);

    // Escala de aparición
    const sp = this.spawnT * this.spawnT * (3 - 2 * this.spawnT);
    this.group.scale.setScalar(Math.max(0.05, sp));

    const target = this.resolveTarget(ctx);
    const tpos = target.pos;
    const dx = tpos.x - this.position.x;
    const dz = tpos.z - this.position.z;
    const dist = Math.hypot(dx, dz);
    const stopRange = this.config.attackRange + target.extra;

    // Decidir mover o atacar
    let moving = false;
    if (dist > stopRange) {
      const inv = 1 / (dist || 1);
      this.vel.x = dx * inv * this.speed;
      this.vel.z = dz * inv * this.speed;
      moving = true;
      this.attackTimer = Math.min(this.attackTimer, this.config.attackCd * 0.5);
    } else {
      this.vel.set(0, 0, 0);
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = this.config.attackCd;
        this.attackAnim = 1;
        if (tpos === ctx.nestPos) ctx.damageNest(this.dmg);
        else ctx.damageMantis(this.dmg, this.position);
      }
    }

    // Integrar movimiento + retroceso
    this.position.x += (this.vel.x + this.knock.x) * dt;
    this.position.z += (this.vel.z + this.knock.z) * dt;
    this.knock.multiplyScalar(Math.max(0, 1 - dt * 6));

    // Mantener dentro del escenario
    const r = Math.hypot(this.position.x, this.position.z);
    const maxR = ARENA_RADIUS - 0.5;
    if (r > maxR) {
      this.position.x *= maxR / r;
      this.position.z *= maxR / r;
    }

    // Orientación
    const wantFace = Math.atan2(dx, dz || 0.0001);
    this.facing = lerpAngle(this.facing, wantFace, Math.min(1, dt * 10));
    this.group.rotation.y = this.facing;

    // Y base + flotación
    const fly = this.config.fly;
    const bob = fly ? Math.sin(this.t * 8) * 0.18 : 0;
    this.group.position.set(this.position.x, this.baseY + bob, this.position.z);

    // Caminar
    const phaseSpeed = moving ? 9 : 2;
    this.walkPhase += dt * phaseSpeed;
    this.legRefs.forEach((leg, i) => {
      leg.rotation.x = Math.sin(this.walkPhase + i * 1.1) * 0.4 * (moving ? 1 : 0.2);
    });
    this.wings.forEach((w, i) => {
      w.rotation.z = (i === 0 ? -0.5 : 0.5) + Math.sin(this.t * 50 + i) * 0.5;
    });

    // Lunge de ataque
    const lunge = this.attackAnim;
    this.bodyRef.position.z = lunge * 0.25;
    this.bodyRef.position.y = 0;

    // Flash de daño
    const flash = this.hitFlash;
    for (const m of this.flashMats) {
      m.emissive.setRGB(flash, flash, flash);
      m.emissiveIntensity = flash * 2.5;
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
