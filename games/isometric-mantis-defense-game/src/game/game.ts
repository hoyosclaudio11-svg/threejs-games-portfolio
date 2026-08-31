import * as THREE from "three";
import { Input } from "./input";
import { AudioEngine } from "./audio";
import { Effects } from "./effects";
import { buildWorld } from "./world";
import { Nest } from "./nest";
import { Mantis } from "./mantis";
import { Enemy } from "./enemy";
import {
  ARENA_RADIUS,
  type EnemyContext,
  type EnemyType,
  type GameCallbacks,
  type HudState,
  type MantisInput,
} from "./types";

const COMBO_WINDOW = 2.6;
const SCORE: Record<EnemyType, number> = {
  beetle: 10,
  wasp: 8,
  grub: 16,
  stalker: 14,
  brute: 90,
};
const BURST_COUNT: Record<EnemyType, number> = {
  beetle: 12,
  wasp: 10,
  grub: 16,
  stalker: 12,
  brute: 28,
};

const COLORS = {
  slash: new THREE.Color(0x8effc0),
  spin: new THREE.Color(0x5ce0c8),
  hit: new THREE.Color(0xfff0a0),
  dash: new THREE.Color(0x9fe8ff),
  nestHit: new THREE.Color(0xff5a5a),
  fireflyA: new THREE.Color(0x8effc0),
  fireflyB: new THREE.Color(0x7fd8ff),
};

interface PendingSpawn {
  type: EnemyType;
  time: number;
}

/**
 * Núcleo del juego: escena, cámara isométrica, bucle, combate, oleadas.
 */
export class Game {
  private container: HTMLElement;
  private cb: GameCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private input: Input;
  private audio = new AudioEngine();
  private effects: Effects;
  private disposeWorld: () => void;
  private nest: Nest;
  private mantis: Mantis;
  private enemies: Enemy[] = [];
  private raf = 0;

  // Cámara
  private camDir = new THREE.Vector3(1, 0.92, 1).normalize();
  private camTarget = new THREE.Vector3(0, 1.5, 0);
  private camFwd = new THREE.Vector3();
  private camRight = new THREE.Vector3();
  private viewSize = 25;

  // Estado
  private phase: HudState["phase"] = "menu";
  private wave = 0;
  private score = 0;
  private kills = 0;
  private combo = 0;
  private maxCombo = 0;
  private comboTimer = 0;
  private pending: PendingSpawn[] = [];
  private waveActive = false;
  private breaking = false;
  private breakTimer = 0;
  private waveClock = 0;
  private banner = "";
  private bannerSub = "";
  private bannerTimer = 0;

  private shakeMag = 0;
  private hudTimer = 0;
  private fireflyTimer = 0;

  constructor(container: HTMLElement, cb: GameCallbacks) {
    this.container = container;
    this.cb = cb;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.inset = "0";
    this.renderer.domElement.style.zIndex = "0";

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x141026);
    this.scene.fog = new THREE.Fog(0x1a1430, 36, 92);

    const aspect = w / h;
    const vs = this.viewSize;
    this.camera = new THREE.OrthographicCamera(
      -vs * aspect,
      vs * aspect,
      vs,
      -vs,
      0.1,
      400
    );
    const camPos = this.camTarget.clone().addScaledVector(this.camDir, 72);
    this.camera.position.copy(camPos);
    this.camera.lookAt(this.camTarget);
    this.camera.updateMatrixWorld();
    // Base de movimiento relativa a la cámara (ejes reales de la matriz)
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    right.y = 0;
    right.normalize();
    const fwd = new THREE.Vector3()
      .setFromMatrixColumn(this.camera.matrixWorld, 2)
      .multiplyScalar(-1);
    fwd.y = 0;
    fwd.normalize();
    this.camRight.copy(right);
    this.camFwd.copy(fwd);

    this.input = new Input(this.renderer.domElement);
    this.effects = new Effects(this.scene);
    this.disposeWorld = buildWorld(this.scene);
    this.nest = new Nest(this.scene, new THREE.Vector3(0, 0, 0));
    this.mantis = new Mantis(this.scene);
    this.mantis.reset(new THREE.Vector3(0, 0, 9));

    window.addEventListener("resize", this.onResize);
    this.emitHud();
  }

  start(): void {
    this.clock.start();
    this.loop();
  }

  // --- Flujo de juego ---
  beginGame(): void {
    this.audio.ensure();
    // Limpiar enemigos previos
    for (const e of this.enemies) e.dispose();
    this.enemies = [];
    this.pending = [];
    this.waveActive = false;
    this.breaking = false;
    this.score = 0;
    this.kills = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.nest.hp = this.nest.maxHp;
    this.mantis.reset(new THREE.Vector3(0, 0, 9));
    this.phase = "playing";
    this.startNextWave();
    this.emitHud();
  }

  private startNextWave(): void {
    this.wave++;
    this.waveActive = true;
    this.breaking = false;
    this.waveClock = 0;
    this.pending = this.buildWave(this.wave);
    const hasBoss = this.pending.some((p) => p.type === "brute");
    this.banner = `OLEADA ${this.wave}`;
    this.bannerSub = hasBoss ? "⚠  JEFE: BRUTO  ⚠" : "¡Defiende el nido!";
    this.bannerTimer = 2.6;
    this.audio.waveStart();
  }

  private beginBreak(): void {
    this.breaking = true;
    this.breakTimer = this.wave === 0 ? 3 : 6;
    this.banner = `OLEADA ${this.wave} SUPERADA`;
    this.bannerSub = "Prepárate para la siguiente...";
    this.bannerTimer = this.breakTimer;
  }

  private buildWave(n: number): PendingSpawn[] {
    const list: EnemyType[] = [];
    const beetles = 4 + n;
    const wasps = n >= 2 ? 2 + Math.floor(n * 0.9) : 0;
    const grubs = n >= 3 ? 1 + Math.floor(n * 0.5) : 0;
    const stalkers = n >= 3 ? Math.floor((n - 2) * 0.7) : 0;
    const brutes = n >= 5 && n % 5 === 0 ? 1 + Math.floor(n / 10) : 0;
    const push = (t: EnemyType, c: number) => {
      for (let i = 0; i < c; i++) list.push(t);
    };
    push("beetle", beetles);
    push("wasp", wasps);
    push("grub", grubs);
    push("stalker", stalkers);
    // Mezclar (dejar los brutos aparte)
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    const interval = Math.max(0.45, 1.1 - n * 0.03);
    const out: PendingSpawn[] = list.map((t, i) => ({
      type: t,
      time: i * interval + Math.random() * 0.35,
    }));
    // Brutos al final, más separados
    const baseTime = out.length ? out[out.length - 1].time + 2 : 1;
    for (let i = 0; i < brutes; i++) {
      out.push({ type: "brute", time: baseTime + i * 2.5 });
    }
    return out;
  }

  private spawnEnemy(type: EnemyType): void {
    const ang = Math.random() * Math.PI * 2;
    const dist = ARENA_RADIUS + 1.5 + Math.random() * 2;
    const pos = new THREE.Vector3(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    const e = new Enemy(this.scene, type, pos, this.wave);
    this.enemies.push(e);
  }

  private endGame(): void {
    if (this.phase === "gameover") return;
    this.phase = "gameover";
    this.waveActive = false;
    this.breaking = false;
    this.pending = [];
    this.banner = "";
    this.bannerSub = "";
    // Explosión dramática del héroe o del nido
    const pos =
      this.mantis.hp <= 0
        ? this.mantis.position.clone().setY(1)
        : this.nest.position.clone().setY(2);
    this.effects.burst(pos, COLORS.spin, 40, {
      speed: 9,
      size: 0.7,
      life: 1.2,
      gravity: 4,
    });
    this.effects.shockwave(pos, COLORS.nestHit, 8);
    this.audio.gameOver();
    this.shakeMag = Math.max(this.shakeMag, 1.2);
    this.emitHud();
  }

  // --- Combate ---
  private damageEnemy(e: Enemy, dmg: number, fromPos: THREE.Vector3): void {
    const dir = e.position.clone().sub(fromPos);
    dir.y = 0;
    if (dir.lengthSq() < 1e-5) dir.set(0, 0, 1);
    dir.normalize();
    const died = e.takeDamage(dmg, dir);
    const p = e.position.clone();
    p.y += 0.7;
    if (died) {
      this.killEnemy(e, p);
    } else {
      this.effects.spark(p, COLORS.hit);
      this.audio.hit();
    }
  }

  private killEnemy(e: Enemy, pos: THREE.Vector3): void {
    this.combo++;
    this.comboTimer = COMBO_WINDOW;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const mult = 1 + (this.combo - 1) * 0.1;
    this.score += Math.round(SCORE[e.type] * mult);
    this.kills++;
    const col = new THREE.Color(e.config.color);
    this.effects.burst(pos, col, BURST_COUNT[e.type], {
      speed: 6,
      size: 0.45,
      life: 0.7,
      gravity: 5,
    });
    this.audio.enemyDeath();
    if (this.combo % 5 === 0) this.audio.combo(this.combo);
  }

  private damageNest = (dmg: number): void => {
    const died = this.nest.takeDamage(dmg);
    this.effects.groundRing(this.nest.position, COLORS.nestHit, 4, 0.7);
    this.audio.nestHit();
    this.shakeMag = Math.max(this.shakeMag, 0.5);
    if (died) this.endGame();
  };

  private damageMantis = (dmg: number, from: THREE.Vector3): void => {
    if (this.mantis.isInvuln || !this.mantis.alive) return;
    const died = this.mantis.takeDamage(dmg, from);
    const p = this.mantis.position.clone();
    p.y += 1;
    this.effects.spark(p, COLORS.hit);
    this.audio.hit();
    this.shakeMag = Math.max(this.shakeMag, 0.28);
    if (died) this.endGame();
  };

  // --- Update principal ---
  private updateGame(dt: number): void {
    this.camera.updateMatrixWorld();

    // Entrada de movimiento (relativa a cámara)
    const i = this.input;
    let mf = 0;
    let mr = 0;
    if (i.isDown("KeyW", "ArrowUp")) mf += 1;
    if (i.isDown("KeyS", "ArrowDown")) mf -= 1;
    if (i.isDown("KeyD", "ArrowRight")) mr += 1;
    if (i.isDown("KeyA", "ArrowLeft")) mr -= 1;
    const move = new THREE.Vector3();
    move.addScaledVector(this.camFwd, mf).addScaledVector(this.camRight, mr);
    if (move.lengthSq() > 1) move.normalize();

    // Puntero → punto en el suelo
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((i.pointer.x - rect.left) / rect.width) * 2 - 1,
      -((i.pointer.y - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const ray = this.raycaster.ray;
    let aim = this.mantis.position.clone().add(this.mantis.forward());
    if (Math.abs(ray.direction.y) > 1e-5) {
      const t = -ray.origin.y / ray.direction.y;
      if (t > 0) aim = ray.origin.clone().addScaledVector(ray.direction, t);
    }
    const aimAngle = Math.atan2(
      aim.x - this.mantis.position.x,
      aim.z - this.mantis.position.z
    );

    // Acciones
    const slashReq = i.mouseDown || i.justPressed("KeyJ");
    const spinReq = i.rightPressed() || i.justPressed("Space", "KeyK");
    const dashReq = i.justPressed("ShiftLeft", "ShiftRight", "KeyL");

    if (slashReq && this.mantis.tryStartSlash()) {
      const p = this.mantis.position.clone();
      this.effects.slashArc(p, this.mantis.facing, this.mantis.slashRange, this.mantis.slashArc, COLORS.slash);
      this.audio.slash();
      this.shakeMag = Math.max(this.shakeMag, 0.18);
      const half = this.mantis.slashArc / 2;
      for (const e of this.enemies) {
        const dx = e.position.x - p.x;
        const dz = e.position.z - p.z;
        const d = Math.hypot(dx, dz);
        if (d > this.mantis.slashRange + e.radius) continue;
        let diff = Math.atan2(dx, dz) - this.mantis.facing;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) <= half) this.damageEnemy(e, this.mantis.slashDmg, p);
      }
    }

    if (spinReq && this.mantis.tryStartSpin()) {
      const p = this.mantis.position.clone();
      this.effects.shockwave(p, COLORS.spin, this.mantis.spinRange);
      this.audio.spin();
      this.shakeMag = Math.max(this.shakeMag, 0.35);
      for (const e of this.enemies) {
        const d = Math.hypot(e.position.x - p.x, e.position.z - p.z);
        if (d <= this.mantis.spinRange + e.radius) {
          this.damageEnemy(e, this.mantis.spinDmg, p);
        }
      }
    }

    if (dashReq) {
      const dir = move.lengthSq() > 0.01 ? move.clone() : this.mantis.forward();
      if (this.mantis.tryStartDash(dir)) {
        this.audio.dash();
        this.effects.dashPuff(this.mantis.position.clone().setY(0.5), COLORS.dash);
      }
    }

    // Update mantis
    const input: MantisInput = { move, aimPoint: aim, aimAngle, slash: slashReq, spin: spinReq, dash: dashReq };
    this.mantis.update(dt, input);

    // Estela del dash
    if (this.mantis.isDashing) {
      this.effects.dashPuff(this.mantis.position.clone().setY(0.5), COLORS.dash);
      // Daño por contacto durante el dash
      const p = this.mantis.position;
      for (const e of this.enemies) {
        if (this.mantis.dashHits.has(e.id)) continue;
        const d = Math.hypot(e.position.x - p.x, e.position.z - p.z);
        if (d <= this.mantis.radius + e.radius + 0.4) {
          this.mantis.dashHits.add(e.id);
          this.damageEnemy(e, this.mantis.dashDmg, p);
        }
      }
    }

    // Update enemigos
    const ctx: EnemyContext = {
      dt,
      mantisPos: this.mantis.position,
      nestPos: this.nest.position,
      mantisAlive: this.mantis.alive,
      mantisInvuln: this.mantis.isInvuln,
      nestRadius: this.nest.radius,
      damageNest: this.damageNest,
      damageMantis: this.damageMantis,
    };
    for (const e of this.enemies) e.update(dt, ctx);

    // Eliminar muertos
    if (this.enemies.some((e) => e.isDead)) {
      this.enemies = this.enemies.filter((e) => {
        if (e.isDead) {
          e.dispose();
          return false;
        }
        return true;
      });
    }

    // Combo
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // Oleadas
    this.updateWaves(dt);

    // Banner
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.banner = "";
        this.bannerSub = "";
      }
    }
  }

  private updateWaves(dt: number): void {
    if (this.waveActive) {
      this.waveClock += dt;
      while (this.pending.length && this.pending[0].time <= this.waveClock) {
        const p = this.pending.shift()!;
        this.spawnEnemy(p.type);
      }
      if (this.pending.length === 0 && this.enemies.length === 0) {
        this.waveActive = false;
        this.beginBreak();
      }
    } else if (this.breaking) {
      this.breakTimer -= dt;
      if (this.breakTimer <= 0) {
        this.breaking = false;
        this.startNextWave();
      }
    }
  }

  // --- Ambiente (fireflies) ---
  private updateAmbience(dt: number): void {
    this.fireflyTimer -= dt;
    if (this.fireflyTimer <= 0) {
      this.fireflyTimer = 0.18;
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * ARENA_RADIUS;
      const pos = new THREE.Vector3(
        Math.cos(ang) * dist,
        1 + Math.random() * 5,
        Math.sin(ang) * dist
      );
      const col = Math.random() < 0.5 ? COLORS.fireflyA : COLORS.fireflyB;
      this.effects.burst(pos, col, 1, {
        speed: 0.5,
        size: 0.5,
        life: 3.2,
        gravity: -0.35,
        upBias: 1,
      });
    }
  }

  private updateCamera(dt: number): void {
    this.shakeMag = Math.max(0, this.shakeMag - dt * 2.2);
    const s = this.shakeMag;
    const ox = (Math.random() - 0.5) * s;
    const oy = (Math.random() - 0.5) * s;
    const oz = (Math.random() - 0.5) * s;
    this.camera.position
      .copy(this.camTarget)
      .addScaledVector(this.camDir, 72)
      .add(new THREE.Vector3(ox, oy, oz));
    this.camera.lookAt(
      this.camTarget.x + ox,
      this.camTarget.y + oy,
      this.camTarget.z + oz
    );
  }

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.effects.update(dt);
    this.updateAmbience(dt);
    this.nest.update(dt);

    if (this.phase === "playing") {
      this.updateGame(dt);
    } else if (this.phase === "menu") {
      const idle: MantisInput = {
        move: new THREE.Vector3(),
        aimPoint: this.mantis.position.clone().add(this.mantis.forward()),
        aimAngle: this.mantis.facing,
        slash: false,
        spin: false,
        dash: false,
      };
      this.mantis.update(dt, idle);
    }

    this.updateCamera(dt);

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.emitHud();
      this.hudTimer = 0.08;
    }

    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();
  };

  // --- HUD ---
  private emitHud(): void {
    const enemiesLeft =
      this.waveActive || this.breaking
        ? this.enemies.length + this.pending.length
        : 0;
    const s: HudState = {
      phase: this.phase,
      mantisHp: this.mantis.hp,
      mantisMaxHp: this.mantis.maxHp,
      mantisInvuln: this.mantis.isInvuln,
      nestHp: this.nest.hp,
      nestMaxHp: this.nest.maxHp,
      wave: this.wave,
      score: this.score,
      enemiesLeft,
      waveBreak: this.breaking,
      breakCountdown: Math.max(0, Math.ceil(this.breakTimer)),
      slashCd: this.mantis.slashCd,
      slashCdMax: this.mantis.slashCdMax,
      spinCd: this.mantis.spinCd,
      spinCdMax: this.mantis.spinCdMax,
      dashCd: this.mantis.dashCd,
      dashCdMax: this.mantis.dashCdMax,
      combo: this.combo,
      banner: this.bannerTimer > 0 ? this.banner : "",
      bannerSub: this.bannerTimer > 0 ? this.bannerSub : "",
      boss: false,
      muted: this.audio.muted,
      kills: this.kills,
      maxCombo: this.maxCombo,
    };
    this.cb.onHud(s);
  }

  toggleMute(): void {
    this.audio.setMuted(!this.audio.muted);
    this.emitHud();
  }

  private onResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const aspect = w / h;
    const vs = this.viewSize;
    this.camera.left = -vs * aspect;
    this.camera.right = vs * aspect;
    this.camera.top = vs;
    this.camera.bottom = -vs;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.input.dispose();
    for (const e of this.enemies) e.dispose();
    this.enemies = [];
    this.effects.dispose();
    this.nest.dispose();
    this.mantis.dispose();
    this.disposeWorld();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
