// Ant Blade - core canvas game engine (no React dependencies)

export interface InputState {
  moveX: number;
  moveY: number;
  attackPressed: boolean;
  dashPressed: boolean;
}

export interface GameStats {
  score: number;
  kills: number;
  wave: number;
  timeSurvived: number;
}

export interface EngineCallbacks {
  onScoreChange: (score: number) => void;
  onHealthChange: (hp: number, maxHp: number) => void;
  onComboChange: (combo: number) => void;
  onWaveChange: (wave: number) => void;
  onGameOver: (stats: GameStats) => void;
}

type EnemyType = "aphid" | "spider" | "beetle";

interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  hitFlash: number;
  hurtCooldown: number;
  seed: number;
  facing: number;
  scale: number;
  // beetle charge state
  state: "chase" | "telegraph" | "charge";
  stateTimer: number;
  chargeCooldown: number;
  chargeDirX: number;
  chargeDirY: number;
  // spider jitter
  jitterTimer: number;
  jitterX: number;
  jitterY: number;
  squish: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  layer: "under" | "over";
}

interface FloatText {
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Pickup {
  x: number;
  y: number;
  type: "nectar" | "heart";
  value: number;
  bob: number;
  life: number;
}

interface SlashArc {
  x: number;
  y: number;
  angle: number;
  halfAngle: number;
  radius: number;
  life: number;
  maxLife: number;
}

interface Decoration {
  x: number;
  y: number;
  size: number;
  rot: number;
  type: "grass" | "pebble" | "leaf";
  sway: number;
  colorIdx: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  facing: number;
  moving: boolean;
  walkCycle: number;
  attackTimer: number;
  attackCooldown: number;
  dashTimer: number;
  dashCooldown: number;
  isDashing: boolean;
  invulTimer: number;
  hurtFlash: number;
  attackAnim: number;
  squashX: number;
  squashY: number;
  trail: { x: number; y: number; a: number }[];
}

const TAU = Math.PI * 2;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}
function angleDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const ENEMY_COLORS: Record<EnemyType, string> = {
  aphid: "#8bd450",
  spider: "#3a2e4a",
  beetle: "#4a3120",
};

export class GameEngine {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  width = 0;
  height = 0;
  dpr = 1;

  input: InputState = { moveX: 0, moveY: 0, attackPressed: false, dashPressed: false };

  active = false; // full simulation running
  gameOver = false;

  player: Player = this.makePlayer();
  enemies: Enemy[] = [];
  particles: Particle[] = [];
  floatTexts: FloatText[] = [];
  pickups: Pickup[] = [];
  slashArcs: SlashArc[] = [];
  decorations: Decoration[] = [];

  score = 0;
  displayedScore = 0;
  kills = 0;
  wave = 1;
  timeSurvived = 0;
  combo = 0;
  comboTimer = 0;

  spawnTimer = 1.2;
  waveTimer = 0;
  maxConcurrent = 4;
  enemyIdCounter = 1;

  shake = 0;
  flash = 0;
  flashColor = "255,80,80";
  ambientTime = 0;

  private rafId = 0;
  private lastTime = 0;
  private callbacks: EngineCallbacks;
  private lastScoreSent = -1;
  private lastComboSent = -1;
  private lastWaveSent = -1;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.loop = this.loop.bind(this);
  }

  makePlayer(): Player {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 16,
      hp: 100,
      maxHp: 100,
      facing: 0,
      moving: false,
      walkCycle: 0,
      attackTimer: 0,
      attackCooldown: 0,
      dashTimer: 0,
      dashCooldown: 0,
      isDashing: false,
      invulTimer: 0,
      hurtFlash: 0,
      attackAnim: 0,
      squashX: 1,
      squashY: 1,
      trail: [],
    };
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(width * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(height * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.generateDecorations();
    this.player.x = clamp(this.player.x, 40, this.width - 40);
    this.player.y = clamp(this.player.y, 40, this.height - 40);
  }

  generateDecorations() {
    const decs: Decoration[] = [];
    const count = Math.floor((this.width * this.height) / 9000);
    for (let i = 0; i < count; i++) {
      const margin = 12;
      const x = rand(margin, this.width - margin);
      const y = rand(margin, this.height - margin);
      const r = Math.random();
      decs.push({
        x,
        y,
        size: rand(6, 14),
        rot: rand(0, TAU),
        type: r < 0.55 ? "grass" : r < 0.8 ? "pebble" : "leaf",
        sway: rand(0, TAU),
        colorIdx: Math.floor(rand(0, 3)),
      });
    }
    this.decorations = decs;
  }

  reset() {
    this.player = this.makePlayer();
    this.player.x = this.width / 2;
    this.player.y = this.height / 2;
    this.enemies = [];
    this.particles = [];
    this.floatTexts = [];
    this.pickups = [];
    this.slashArcs = [];
    this.score = 0;
    this.displayedScore = 0;
    this.kills = 0;
    this.wave = 1;
    this.timeSurvived = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.spawnTimer = 1.1;
    this.waveTimer = 0;
    this.maxConcurrent = 4;
    this.shake = 0;
    this.flash = 0;
    this.gameOver = false;
    this.lastScoreSent = -1;
    this.lastComboSent = -1;
    this.lastWaveSent = -1;
    // instant action: spawn a couple of enemies right away near the edges
    this.spawnEnemy("aphid", true);
    this.spawnEnemy("aphid", true);
    this.callbacks.onHealthChange(this.player.hp, this.player.maxHp);
    this.callbacks.onScoreChange(0);
    this.callbacks.onComboChange(0);
    this.callbacks.onWaveChange(1);
  }

  start() {
    if (!this.rafId) {
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  pause() {
    this.active = false;
  }

  resume() {
    this.active = true;
    this.lastTime = performance.now();
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private loop(t: number) {
    const dt = Math.min(0.033, Math.max(0.001, (t - this.lastTime) / 1000));
    this.lastTime = t;
    this.ambientTime += dt;
    if (this.active && !this.gameOver) {
      this.update(dt);
    }
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  }

  // ---------------- SPAWNING ----------------

  spawnEnemy(forceType?: EnemyType, initial = false) {
    const difficulty = 1 + (this.wave - 1) * 0.14;
    let type: EnemyType = forceType ?? "aphid";
    if (!forceType) {
      const roll = Math.random();
      if (this.wave >= 3 && roll < 0.22) type = "beetle";
      else if (this.wave >= 2 && roll < 0.55) type = "spider";
      else type = "aphid";
    }

    let x = 0;
    let y = 0;
    const margin = 30;
    for (let attempt = 0; attempt < 10; attempt++) {
      const edge = Math.floor(rand(0, 4));
      if (edge === 0) {
        x = rand(margin, this.width - margin);
        y = margin;
      } else if (edge === 1) {
        x = this.width - margin;
        y = rand(margin, this.height - margin);
      } else if (edge === 2) {
        x = rand(margin, this.width - margin);
        y = this.height - margin;
      } else {
        x = margin;
        y = rand(margin, this.height - margin);
      }
      if (initial || dist(x, y, this.player.x, this.player.y) > 140) break;
    }

    const base = {
      aphid: { hp: 22, speed: 62, damage: 8, radius: 13 },
      spider: { hp: 16, speed: 118, damage: 7, radius: 11 },
      beetle: { hp: 60, speed: 46, damage: 16, radius: 19 },
    }[type];

    const enemy: Enemy = {
      id: this.enemyIdCounter++,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: base.radius,
      hp: Math.round(base.hp * difficulty),
      maxHp: Math.round(base.hp * difficulty),
      damage: Math.round(base.damage * (1 + (this.wave - 1) * 0.08)),
      speed: base.speed * (1 + (this.wave - 1) * 0.05),
      hitFlash: 0,
      hurtCooldown: 0,
      seed: rand(0, 100),
      facing: 0,
      scale: 1,
      state: "chase",
      stateTimer: 0,
      chargeCooldown: rand(0.5, 1.5),
      chargeDirX: 0,
      chargeDirY: 0,
      jitterTimer: 0,
      jitterX: 0,
      jitterY: 0,
      squish: 0,
    };
    this.enemies.push(enemy);
  }

  // ---------------- UPDATE ----------------

  update(dt: number) {
    this.timeSurvived += dt;
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateSeparation();
    this.updateParticles(dt);
    this.updatePickups(dt);
    this.updateSlashArcs(dt);
    this.updateSpawning(dt);
    this.updateScoreAndCombo(dt);

    this.shake = Math.max(0, this.shake - dt * 3.2);
    this.flash = Math.max(0, this.flash - dt * 2.2);

    if (this.player.hp <= 0 && !this.gameOver) {
      this.gameOver = true;
      this.active = false;
      this.callbacks.onGameOver({
        score: Math.floor(this.score),
        kills: this.kills,
        wave: this.wave,
        timeSurvived: this.timeSurvived,
      });
    }
  }

  private updateScoreAndCombo(dt: number) {
    this.score += dt * 2.4; // survival trickle
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }
    const flooredScore = Math.floor(this.score);
    if (flooredScore !== this.lastScoreSent) {
      this.lastScoreSent = flooredScore;
      this.callbacks.onScoreChange(flooredScore);
    }
    if (this.combo !== this.lastComboSent) {
      this.lastComboSent = this.combo;
      this.callbacks.onComboChange(this.combo);
    }
    if (this.wave !== this.lastWaveSent) {
      this.lastWaveSent = this.wave;
      this.callbacks.onWaveChange(this.wave);
    }
  }

  private updateSpawning(dt: number) {
    this.waveTimer += dt;
    if (this.waveTimer > 18) {
      this.waveTimer = 0;
      this.wave += 1;
      this.maxConcurrent = Math.min(14, this.maxConcurrent + 1);
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemies.length < this.maxConcurrent) {
      this.spawnEnemy();
      const base = rand(1.6, 2.6);
      const difficultyFactor = 1 + (this.wave - 1) * 0.18;
      this.spawnTimer = Math.max(0.45, base / difficultyFactor);
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    const input = this.input;

    p.hurtFlash = Math.max(0, p.hurtFlash - dt * 3);
    p.invulTimer = Math.max(0, p.invulTimer - dt);
    p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.attackAnim = Math.max(0, p.attackAnim - dt * 4.5);

    let mx = input.moveX;
    let my = input.moveY;
    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }

    // Dash trigger (held + cooldown gated, works for tap or hold)
    if (input.dashPressed && p.dashCooldown <= 0 && !p.isDashing) {
      let dirX = mx;
      let dirY = my;
      if (Math.hypot(dirX, dirY) < 0.05) {
        dirX = Math.cos(p.facing);
        dirY = Math.sin(p.facing);
      }
      const n = Math.hypot(dirX, dirY) || 1;
      p.vx = (dirX / n) * 620;
      p.vy = (dirY / n) * 620;
      p.isDashing = true;
      p.dashTimer = 0.16;
      p.dashCooldown = 0.75;
      p.invulTimer = 0.28;
      this.spawnBurst(p.x, p.y, "#d8c9a3", 8, 40, 140, 0.35, 3, "under");
    }

    if (p.isDashing) {
      p.dashTimer -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const decay = Math.pow(0.9, dt * 60);
      p.vx *= decay;
      p.vy *= decay;
      if (Math.random() < 0.6) {
        this.spawnBurst(p.x, p.y, "#c9b98a", 1, 5, 20, 0.25, 2.5, "under");
      }
      if (p.dashTimer <= 0) {
        p.isDashing = false;
      }
    } else {
      const speed = 190;
      p.vx = mx * speed;
      p.vy = my * speed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.moving = mag > 0.05;
      if (p.moving) {
        p.facing = Math.atan2(my, mx);
        p.walkCycle += dt * 9 * clamp(mag, 0.4, 1);
      }
    }

    p.x = clamp(p.x, p.radius + 6, this.width - p.radius - 6);
    p.y = clamp(p.y, p.radius + 6, this.height - p.radius - 6);

    // squash/stretch feedback
    const targetSX = p.isDashing ? 1.35 : 1 + Math.sin(p.walkCycle) * 0.03;
    const targetSY = p.isDashing ? 0.75 : 1 - Math.sin(p.walkCycle) * 0.03;
    p.squashX = lerp(p.squashX, targetSX, 0.25);
    p.squashY = lerp(p.squashY, targetSY, 0.25);

    // trail for dash
    p.trail.push({ x: p.x, y: p.y, a: p.isDashing ? 0.5 : 0 });
    if (p.trail.length > 6) p.trail.shift();

    // Attack trigger (held + cooldown gated, works for tap or hold)
    if (input.attackPressed && p.attackCooldown <= 0) {
      this.performAttack();
    }

    // pickups collection
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      if (dist(pk.x, pk.y, p.x, p.y) < p.radius + 14) {
        if (pk.type === "nectar") {
          this.score += pk.value;
          this.spawnFloatText(pk.x, pk.y - 10, `+${pk.value}`, "#ffe27a");
          this.spawnBurst(pk.x, pk.y, "#ffe27a", 6, 30, 60, 0.3, 2, "over");
        } else {
          p.hp = clamp(p.hp + pk.value, 0, p.maxHp);
          this.callbacks.onHealthChange(p.hp, p.maxHp);
          this.spawnFloatText(pk.x, pk.y - 10, `+${pk.value} HP`, "#7CFC9A");
          this.spawnBurst(pk.x, pk.y, "#7CFC9A", 8, 30, 60, 0.35, 2.5, "over");
        }
        this.pickups.splice(i, 1);
      }
    }

    // enemy contact damage to player
    if (p.invulTimer <= 0) {
      for (const e of this.enemies) {
        if (dist(e.x, e.y, p.x, p.y) < p.radius + e.radius - 2) {
          this.damagePlayer(e.damage, e.x, e.y);
          break;
        }
      }
    }
  }

  private damagePlayer(amount: number, sourceX: number, sourceY: number) {
    const p = this.player;
    p.hp = clamp(p.hp - amount, 0, p.maxHp);
    p.invulTimer = 0.9;
    p.hurtFlash = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.triggerShake(9);
    this.flash = 0.55;
    this.flashColor = "255,70,70";
    const angle = Math.atan2(p.y - sourceY, p.x - sourceX);
    p.vx = Math.cos(angle) * 260;
    p.vy = Math.sin(angle) * 260;
    p.x += p.vx * 0.03;
    p.y += p.vy * 0.03;
    this.spawnBurst(p.x, p.y, "#ff8080", 10, 60, 120, 0.4, 3, "over");
    this.callbacks.onHealthChange(p.hp, p.maxHp);
  }

  private performAttack() {
    const p = this.player;
    p.attackCooldown = 0.34;
    p.attackTimer = 0.16;
    p.attackAnim = 1;

    const range = p.radius + 46;
    const halfAngle = 0.95;
    const hitX = p.x + Math.cos(p.facing) * (p.radius + 14);
    const hitY = p.y + Math.sin(p.facing) * (p.radius + 14);

    this.slashArcs.push({
      x: p.x,
      y: p.y,
      angle: p.facing,
      halfAngle,
      radius: range,
      life: 0.16,
      maxLife: 0.16,
    });
    this.spawnBurst(hitX, hitY, "#fdf3c7", 5, 40, 90, 0.2, 2, "over");

    let hitAny = false;
    for (const e of this.enemies) {
      const d = dist(p.x, p.y, e.x, e.y);
      if (d > range + e.radius) continue;
      const ang = Math.atan2(e.y - p.y, e.x - p.x);
      if (Math.abs(angleDiff(ang, p.facing)) > halfAngle) continue;
      hitAny = true;
      const dmg = 22;
      e.hp -= dmg;
      e.hitFlash = 1;
      const kAngle = Math.atan2(e.y - p.y, e.x - p.x);
      e.vx += Math.cos(kAngle) * 340;
      e.vy += Math.sin(kAngle) * 340;
      e.squish = 1;
      this.spawnBurst(e.x, e.y, "#fff6d0", 6, 60, 110, 0.28, 2.5, "over");
      this.spawnFloatText(e.x, e.y - e.radius - 6, `${dmg}`, "#ffffff");

      if (e.hp <= 0) {
        this.killEnemy(e);
      }
    }
    if (hitAny) {
      this.triggerShake(6);
    } else {
      this.triggerShake(2);
    }
  }

  private killEnemy(e: Enemy) {
    e.hp = -9999; // mark dead, filtered out later
    this.combo += 1;
    this.comboTimer = 2.1;
    const scoreMap: Record<EnemyType, number> = { aphid: 10, spider: 16, beetle: 32 };
    const mult = 1 + Math.min(this.combo - 1, 10) * 0.12;
    const points = Math.round(scoreMap[e.type] * mult);
    this.score += points;
    this.kills += 1;
    this.spawnFloatText(e.x, e.y - 14, `+${points}`, "#ffd54a", 16);
    this.spawnBurst(e.x, e.y, ENEMY_COLORS[e.type], 16, 90, 160, 0.55, 3.5, "over");
    this.triggerShake(this.combo >= 3 ? 10 : 6);

    if (Math.random() < 0.35) {
      this.pickups.push({ x: e.x, y: e.y, type: "nectar", value: Math.round(rand(4, 10)), bob: 0, life: 8 });
    }
    if (this.player.hp < this.player.maxHp * 0.5 && Math.random() < 0.14) {
      this.pickups.push({ x: e.x, y: e.y, type: "heart", value: 20, bob: 0, life: 10 });
    }
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hp <= -999) {
        this.enemies.splice(i, 1);
        continue;
      }
      e.hitFlash = Math.max(0, e.hitFlash - dt * 4);
      e.squish = Math.max(0, e.squish - dt * 5);
      e.hurtCooldown = Math.max(0, e.hurtCooldown - dt);

      const toPX = p.x - e.x;
      const toPY = p.y - e.y;
      const d = Math.hypot(toPX, toPY) || 1;
      const dirX = toPX / d;
      const dirY = toPY / d;
      e.facing = Math.atan2(toPY, toPX);

      if (e.type === "aphid") {
        const wob = Math.sin(this.ambientTime * 3 + e.seed) * 22;
        e.vx = dirX * e.speed + -dirY * wob * dt * 10;
        e.vy = dirY * e.speed + dirX * wob * dt * 10;
      } else if (e.type === "spider") {
        e.jitterTimer -= dt;
        if (e.jitterTimer <= 0) {
          e.jitterTimer = rand(0.15, 0.35);
          e.jitterX = rand(-1, 1);
          e.jitterY = rand(-1, 1);
        }
        e.vx = dirX * e.speed + e.jitterX * 60;
        e.vy = dirY * e.speed + e.jitterY * 60;
      } else if (e.type === "beetle") {
        e.chargeCooldown -= dt;
        e.stateTimer -= dt;
        if (e.state === "chase") {
          e.vx = dirX * e.speed;
          e.vy = dirY * e.speed;
          if (d < 240 && e.chargeCooldown <= 0) {
            e.state = "telegraph";
            e.stateTimer = 0.45;
            e.chargeDirX = dirX;
            e.chargeDirY = dirY;
            e.vx = 0;
            e.vy = 0;
          }
        } else if (e.state === "telegraph") {
          e.vx = lerp(e.vx, 0, 0.2);
          e.vy = lerp(e.vy, 0, 0.2);
          if (e.stateTimer <= 0) {
            e.state = "charge";
            e.stateTimer = 0.38;
          }
        } else if (e.state === "charge") {
          e.vx = e.chargeDirX * e.speed * 4.4;
          e.vy = e.chargeDirY * e.speed * 4.4;
          if (e.stateTimer <= 0) {
            e.state = "chase";
            e.chargeCooldown = rand(2, 3.2);
          }
        }
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;
      const edecay = Math.pow(0.86, dt * 60);
      e.vx *= edecay;
      e.vy *= edecay;

      e.x = clamp(e.x, e.radius, this.width - e.radius);
      e.y = clamp(e.y, e.radius, this.height - e.radius);
    }
  }

  private updateSeparation() {
    const n = this.enemies.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = this.enemies[i];
        const b = this.enemies[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const minD = a.radius + b.radius - 4;
        if (d < minD) {
          const push = (minD - d) / 2;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }

  private updatePickups(dt: number) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.bob += dt * 4;
      pk.life -= dt;
      if (pk.life <= 0) this.pickups.splice(i, 1);
    }
  }

  private updateSlashArcs(dt: number) {
    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      const s = this.slashArcs[i];
      s.life -= dt;
      if (s.life <= 0) this.slashArcs.splice(i, 1);
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.vy += pt.gravity * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.94;
      pt.vy *= 0.94;
    }
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const f = this.floatTexts[i];
      f.life -= dt;
      f.y += f.vy * dt;
      if (f.life <= 0) this.floatTexts.splice(i, 1);
    }
    if (this.particles.length > 260) {
      this.particles.splice(0, this.particles.length - 260);
    }
  }

  spawnBurst(
    x: number,
    y: number,
    color: string,
    count: number,
    speedMin: number,
    speedMax: number,
    life: number,
    size: number,
    layer: "under" | "over"
  ) {
    for (let i = 0; i < count; i++) {
      const ang = rand(0, TAU);
      const spd = rand(speedMin, speedMax);
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: life * rand(0.6, 1.2),
        maxLife: life,
        size: size * rand(0.7, 1.3),
        color,
        gravity: layer === "under" ? 40 : 10,
        layer,
      });
    }
  }

  spawnFloatText(x: number, y: number, text: string, color: string, size = 14) {
    this.floatTexts.push({ x, y, vy: -34, text, life: 0.8, maxLife: 0.8, color, size });
  }

  triggerShake(amount: number) {
    this.shake = Math.min(24, this.shake + amount);
  }

  // ---------------- RENDER ----------------

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    let sx = 0;
    let sy = 0;
    if (this.shake > 0.05) {
      sx = (Math.random() * 2 - 1) * this.shake;
      sy = (Math.random() * 2 - 1) * this.shake;
    }
    ctx.translate(sx, sy);

    this.drawBackground(ctx, w, h);
    this.drawDecorations(ctx);
    this.drawPickups(ctx);
    this.drawParticles(ctx, "under");
    this.drawEnemies(ctx);
    this.drawSlashArcs(ctx);
    this.drawPlayer(ctx);
    this.drawParticles(ctx, "over");
    this.drawFloatTexts(ctx);

    ctx.restore();

    this.drawVignette(ctx, w, h);
    if (this.flash > 0.001) {
      ctx.fillStyle = `rgba(${this.flashColor},${this.flash * 0.45})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#5b7a3a");
    grad.addColorStop(1, "#42602a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // soil border
    ctx.strokeStyle = "rgba(60,40,20,0.35)";
    ctx.lineWidth = 26;
    ctx.strokeRect(13, 13, w - 26, h - 26);
    ctx.strokeStyle = "rgba(120,90,50,0.25)";
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, w - 48, h - 48);
  }

  private drawDecorations(ctx: CanvasRenderingContext2D) {
    for (const d of this.decorations) {
      const sway = Math.sin(this.ambientTime * 1.4 + d.sway) * 0.12;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot + sway);
      if (d.type === "grass") {
        ctx.strokeStyle = ["#3f6b28", "#4f7d33", "#5c8a3c"][d.colorIdx];
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, d.size / 2);
        ctx.quadraticCurveTo(d.size * 0.4, 0, 0, -d.size);
        ctx.stroke();
      } else if (d.type === "pebble") {
        ctx.fillStyle = "rgba(90,80,65,0.5)";
        ctx.beginPath();
        ctx.ellipse(0, 0, d.size * 0.5, d.size * 0.36, 0, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(60,110,40,0.45)";
        ctx.beginPath();
        ctx.ellipse(0, 0, d.size * 0.5, d.size * 0.28, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawPickups(ctx: CanvasRenderingContext2D) {
    for (const pk of this.pickups) {
      const bobY = Math.sin(pk.bob) * 4;
      const fadeAlpha = pk.life < 1.5 ? Math.max(0, pk.life / 1.5) : 1;
      ctx.save();
      ctx.globalAlpha = fadeAlpha;
      ctx.translate(pk.x, pk.y + bobY);
      if (pk.type === "nectar") {
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
        glow.addColorStop(0, "rgba(255,225,120,0.6)");
        glow.addColorStop(1, "rgba(255,225,120,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#ffd54a";
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 7, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#fff3c4";
        ctx.beginPath();
        ctx.ellipse(-1.5, -2, 2, 2.4, 0, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = "#ff5f7a";
        ctx.beginPath();
        const s = 7;
        ctx.moveTo(0, s);
        ctx.bezierCurveTo(s * 1.6, s * 0.2, s * 1.1, -s, 0, -s * 0.2);
        ctx.bezierCurveTo(-s * 1.1, -s, -s * 1.6, s * 0.2, 0, s);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, layer: "under" | "over") {
    for (const pt of this.particles) {
      if (pt.layer !== layer) continue;
      const a = clamp(pt.life / pt.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * a, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawFloatTexts(ctx: CanvasRenderingContext2D) {
    for (const f of this.floatTexts) {
      const a = clamp(f.life / f.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = f.color;
      ctx.font = `bold ${f.size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  private drawSlashArcs(ctx: CanvasRenderingContext2D) {
    for (const s of this.slashArcs) {
      const a = clamp(s.life / s.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.85;
      const grad = ctx.createRadialGradient(s.x, s.y, s.radius * 0.3, s.x, s.y, s.radius);
      grad.addColorStop(0, "rgba(255,255,255,0.05)");
      grad.addColorStop(0.7, "rgba(255,250,220,0.55)");
      grad.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, s.radius * (0.7 + 0.3 * (1 - a)), s.angle - s.halfAngle, s.angle + s.halfAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawEnemies(ctx: CanvasRenderingContext2D) {
    const sorted = [...this.enemies].sort((a, b) => a.y - b.y);
    for (const e of sorted) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const stretch = 1 + e.squish * 0.4;
      const squeeze = 1 - e.squish * 0.3;

      // shadow
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(0, e.radius * 0.8, e.radius * 0.8, e.radius * 0.3, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.rotate(e.facing);
      ctx.scale(stretch, squeeze);

      const flashMix = e.hitFlash;
      const baseColor = ENEMY_COLORS[e.type];

      if (e.type === "aphid") {
        this.drawAphid(ctx, e, flashMix);
      } else if (e.type === "spider") {
        this.drawSpider(ctx, e, flashMix);
      } else {
        this.drawBeetle(ctx, e, flashMix, baseColor);
      }

      // hp bar
      ctx.restore();
      if (e.hp < e.maxHp) {
        ctx.save();
        const bw = e.radius * 1.8;
        ctx.translate(e.x - bw / 2, e.y - e.radius - 12);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(0, 0, bw, 4);
        ctx.fillStyle = "#7CFC9A";
        ctx.fillRect(0, 0, bw * clamp(e.hp / e.maxHp, 0, 1), 4);
        ctx.restore();
      }
    }
  }

  private drawAphid(ctx: CanvasRenderingContext2D, e: Enemy, flash: number) {
    const pulse = 1 + Math.sin(this.ambientTime * 5 + e.seed) * 0.05;
    const color = flash > 0.05 ? "#ffffff" : "#8bd450";
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.radius * pulse, e.radius * 0.85 * pulse, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(-e.radius * 0.3, -e.radius * 0.3, e.radius * 0.35, e.radius * 0.22, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#294f14";
    ctx.beginPath();
    ctx.arc(e.radius * 0.55, -e.radius * 0.2, 1.8, 0, TAU);
    ctx.fill();
  }

  private drawSpider(ctx: CanvasRenderingContext2D, e: Enemy, flash: number) {
    const legPhase = this.ambientTime * 14 + e.seed;
    ctx.strokeStyle = flash > 0.05 ? "#ffffff" : "#241c30";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const side = i < 2 ? 1 : -1;
      const idx = i % 2;
      const wig = Math.sin(legPhase + i) * 5;
      const baseAngle = side * (0.6 + idx * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const kx = Math.cos(baseAngle) * e.radius * 1.1;
      const ky = Math.sin(baseAngle) * e.radius * 0.7 + wig;
      ctx.quadraticCurveTo(kx * 0.6, ky, kx * 1.4, ky * 1.3);
      ctx.stroke();
    }
    ctx.fillStyle = flash > 0.05 ? "#ffffff" : "#3a2e4a";
    ctx.beginPath();
    ctx.ellipse(-e.radius * 0.2, 0, e.radius * 0.75, e.radius * 0.6, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(e.radius * 0.55, 0, e.radius * 0.4, e.radius * 0.35, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ff4d4d";
    ctx.beginPath();
    ctx.arc(e.radius * 0.75, -e.radius * 0.12, 1.6, 0, TAU);
    ctx.arc(e.radius * 0.75, e.radius * 0.12, 1.6, 0, TAU);
    ctx.fill();
  }

  private drawBeetle(ctx: CanvasRenderingContext2D, e: Enemy, flash: number, baseColor: string) {
    let color = baseColor;
    if (e.state === "telegraph") {
      const t = 0.5 + 0.5 * Math.sin(this.ambientTime * 30);
      color = `rgba(255,${140 + t * 60},40,1)`;
    }
    if (flash > 0.05) color = "#ffffff";
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.radius, e.radius * 0.8, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -e.radius * 0.7);
    ctx.lineTo(0, e.radius * 0.7);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(e.radius * 0.65, 0, e.radius * 0.32, e.radius * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.ellipse(-e.radius * 0.25, -e.radius * 0.3, e.radius * 0.28, e.radius * 0.16, -0.4, 0, TAU);
    ctx.fill();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;

    // dash trail
    for (let i = 0; i < p.trail.length; i++) {
      const t = p.trail[i];
      if (t.a <= 0) continue;
      const alpha = (t.a * (i + 1)) / p.trail.length;
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = "#7a2e1f";
      ctx.beginPath();
      ctx.ellipse(t.x, t.y, p.radius * 0.8, p.radius * 0.6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.radius * 0.85, p.radius * 0.9, p.radius * 0.35, 0, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.facing);
    ctx.scale(p.squashX, p.squashY);

    const blink = p.invulTimer > 0 && Math.floor(this.ambientTime * 16) % 2 === 0;
    const bodyColor = blink ? "#ffffff" : p.hurtFlash > 0.05 ? "#ff9d8a" : "#7a2e1f";
    const darkColor = blink ? "#eeeeee" : "#5a2015";

    const legSwing = Math.sin(p.walkCycle) * (p.moving ? 10 : 2);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2.4;
    for (let i = -1; i <= 1; i++) {
      const dirSign = i === 0 ? 1 : i;
      const offset = i * 6;
      const swing = legSwing * (i % 2 === 0 ? 1 : -1);
      ctx.beginPath();
      ctx.moveTo(offset, -p.radius * 0.3);
      ctx.lineTo(offset - 10, -p.radius * 0.3 - 8 + swing * 0.3);
      ctx.moveTo(offset, p.radius * 0.3);
      ctx.lineTo(offset - 10, p.radius * 0.3 + 8 - swing * 0.3);
      ctx.stroke();
      void dirSign;
    }

    // abdomen
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(-p.radius * 0.85, 0, p.radius * 0.85, p.radius * 0.62, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.ellipse(-p.radius * 1.05, -p.radius * 0.2, p.radius * 0.3, p.radius * 0.16, 0, 0, TAU);
    ctx.fill();

    // thorax
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.radius * 0.55, p.radius * 0.48, 0, 0, TAU);
    ctx.fill();

    // head
    ctx.beginPath();
    ctx.ellipse(p.radius * 0.75, 0, p.radius * 0.42, p.radius * 0.38, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.ellipse(p.radius * 0.65, -p.radius * 0.14, p.radius * 0.15, p.radius * 0.08, 0, 0, TAU);
    ctx.fill();

    // eyes
    ctx.fillStyle = "#161616";
    ctx.beginPath();
    ctx.arc(p.radius * 0.95, -p.radius * 0.12, 2.4, 0, TAU);
    ctx.arc(p.radius * 0.95, p.radius * 0.12, 2.4, 0, TAU);
    ctx.fill();

    // antennae
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1.6;
    const antWiggle = Math.sin(this.ambientTime * 6) * 4;
    ctx.beginPath();
    ctx.moveTo(p.radius * 1.1, -p.radius * 0.2);
    ctx.quadraticCurveTo(p.radius * 1.5, -p.radius * 0.6 + antWiggle, p.radius * 1.7, -p.radius * 0.9);
    ctx.moveTo(p.radius * 1.1, p.radius * 0.2);
    ctx.quadraticCurveTo(p.radius * 1.5, p.radius * 0.6 - antWiggle, p.radius * 1.7, p.radius * 0.9);
    ctx.stroke();

    // mandibles (open when attacking)
    const mandibleOpen = 0.2 + p.attackAnim * 0.9;
    ctx.strokeStyle = "#2a1a12";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(p.radius * 1.15, -3);
    ctx.lineTo(p.radius * 1.15 + 10, -3 - mandibleOpen * 10);
    ctx.moveTo(p.radius * 1.15, 3);
    ctx.lineTo(p.radius * 1.15 + 10, 3 + mandibleOpen * 10);
    ctx.stroke();

    ctx.restore();
  }

  private drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const grad = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.35,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.75
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}
