import * as THREE from 'three';
import { SoldierModel } from './models/SoldierModel';
import { MonsterInstance } from './models/MonsterModels';
import { ScenarioBuilder } from './models/ScenarioBuilder';
import { soundManager } from '../audio/SoundManager';
import { 
  WeaponType, 
  WeaponStats, 
  SoldierRuntimeStats, 
  PowerupType, 
  FloatingText, 
  DropItem 
} from '../types/game';
import { 
  SCENARIO_BIOMES, 
  WEAPON_DEFINITIONS, 
  MONSTER_DEFINITIONS, 
  SOLDIER_CLASSES 
} from './constants';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: SoldierRuntimeStats) => void;
  onWeaponUpdate: (currentWeapon: WeaponStats, arsenal: Record<string, WeaponStats>) => void;
  onWaveProgressUpdate: (monstersKilled: number, totalMonsters: number, waveNumber: number, biomeName: string) => void;
  onScoreUpdate: (score: number, credits: number, combo: number) => void;
  onBossUpdate: (boss: MonsterInstance | null) => void;
  onWaveCleared: (waveNumber: number) => void;
  onGameOver: (victory: boolean, stats: any) => void;
  onFloatingTextsUpdate: (texts: FloatingText[]) => void;
}

export class GameEngine {
  private container: HTMLDivElement;
  private callbacks: GameEngineCallbacks;
  
  // Three.js Core
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Game Systems
  public scenarioBuilder: ScenarioBuilder;
  public soldierModel: SoldierModel;
  public currentWave: number = 1;
  public currentBiome: any = SCENARIO_BIOMES[0];

  // Player State
  public soldierStats: SoldierRuntimeStats;
  public playerX: number = 0;
  public playerY: number = 0;
  public playerZ: number = 0;
  public playerVx: number = 0;
  public playerVy: number = 0;
  public isGrounded: boolean = true;
  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public dashCooldownTimer: number = 0;
  public invulnerableTimer: number = 0;
  public activeWeaponId: WeaponType = 'assault_rifle';
  public arsenal: Record<string, WeaponStats>;
  public isFiring: boolean = false;
  public fireTimer: number = 0;
  public reloadTimer: number = 0;
  public isReloading: boolean = false;

  // Active Powerups
  public activePowerups: Map<PowerupType, number> = new Map();

  // Projectiles & Particles
  private projectiles: any[] = [];
  private enemyProjectiles: any[] = [];
  private drops: DropItem[] = [];
  private floatingTexts: FloatingText[] = [];
  private bloodParticles: any[] = [];

  // Monsters
  public monsters: MonsterInstance[] = [];
  public currentBoss: MonsterInstance | null = null;
  public monstersSpawnedThisWave: number = 0;
  public monstersKilledThisWave: number = 0;
  private spawnTimer: number = 0;

  // Score, Combo & Stats Tracking
  public score: number = 0;
  public credits: number = 200;
  public combo: number = 0;
  public comboTimer: number = 0;
  public totalKills: number = 0;
  public bossesDefeated: number = 0;
  public gameStartTime: number = Date.now();

  // Camera 2.5D Controller & Shake
  private cameraTargetX: number = 0;
  private cameraTargetY: number = 4.5;
  private cameraShakeIntensity: number = 0;
  private timeScale: number = 1.0;
  private bulletTimeTimer: number = 0;

  // Inputs
  private keys: Record<string, boolean> = {};
  private mouseAim = { x: 0, y: 0, worldX: 0, worldY: 0 };
  private mouseRaycaster = new THREE.Raycaster();
  private mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  constructor(container: HTMLDivElement, callbacks: GameEngineCallbacks, soldierClassId: string = 'commando') {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Setup Three.js Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030712);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    // 2.5D side-isometric angle
    this.camera.position.set(0, 6, 18);
    this.camera.lookAt(0, 3, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // 2. Init Arsenal Clone
    this.arsenal = JSON.parse(JSON.stringify(WEAPON_DEFINITIONS));
    
    // Select Soldier Class
    const sClass = SOLDIER_CLASSES.find(c => c.id === soldierClassId) || SOLDIER_CLASSES[0];
    this.activeWeaponId = sClass.defaultWeapon;
    this.arsenal[this.activeWeaponId].unlocked = true;

    // Init Soldier Runtime Stats
    this.soldierStats = {
      maxHp: sClass.baseHp,
      hp: sClass.baseHp,
      maxShield: sClass.baseShield,
      shield: sClass.baseShield,
      shieldRechargeRate: 8,
      shieldRechargeDelay: 2.2,
      moveSpeed: sClass.baseSpeed,
      sprintMultiplier: 1.35,
      jumpForce: 13.0,
      jetpackMaxFuel: 100,
      jetpackFuel: 100,
      jetpackBurnRate: 45,
      jetpackRechargeRate: 28,
      dashCooldown: 1.2,
      damageMultiplier: 1.0,
      critChance: 0.10,
      critMultiplier: 2.0,
      lifeSteal: 0.0,
      pickupRadius: 5.0,
      creditBonus: 0.0,
      specialAbilityCooldown: 12,
      specialAbilityMaxCharges: 3,
      specialAbilityCharges: 3,
    };

    // 3. Init Soldier 3D Model
    this.soldierModel = new SoldierModel(sClass.primaryColor, sClass.glowColor);
    this.soldierModel.buildWeaponMesh(this.activeWeaponId);
    this.scene.add(this.soldierModel.mesh);

    // 4. Scenario Builder
    this.scenarioBuilder = new ScenarioBuilder(this.scene);
    this.loadWave(1);

    // 5. Attach Event Listeners
    this.setupEventListeners();
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.gameStartTime = Date.now();
    soundManager.startMusic(this.currentWave);
    this.loop();
  }

  public pause(isPaused: boolean) {
    this.isPaused = isPaused;
  }

  public destroy() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    soundManager.stopMusic();
    this.removeEventListeners();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }

  // --- WAVE MANAGEMENT ---
  public loadWave(waveNumber: number) {
    this.currentWave = waveNumber;
    const biomeIdx = (waveNumber - 1) % SCENARIO_BIOMES.length;
    this.currentBiome = SCENARIO_BIOMES[biomeIdx];

    // Clear previous monsters, projectiles and drops
    this.monsters.forEach(m => this.scene.remove(m.mesh));
    this.monsters = [];
    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.projectiles = [];
    this.enemyProjectiles.forEach(p => this.scene.remove(p.mesh));
    this.enemyProjectiles = [];
    this.drops.forEach(d => { if (d.mesh) this.scene.remove(d.mesh); });
    this.drops = [];

    this.currentBoss = null;
    this.monstersSpawnedThisWave = 0;
    this.monstersKilledThisWave = 0;
    this.spawnTimer = 0.5;

    // Refill Jetpack and partial shield
    this.soldierStats.jetpackFuel = this.soldierStats.jetpackMaxFuel;
    this.soldierStats.shield = this.soldierStats.maxShield;

    // Reset player position
    this.playerX = 0;
    this.playerY = 0;
    this.playerVx = 0;
    this.playerVy = 0;

    // Build 3D scenario environment
    this.scenarioBuilder.buildBiome(this.currentBiome);
    soundManager.setWaveTheme(waveNumber);

    this.updateHUD();
  }

  // --- CONTROLS & EVENT LISTENERS ---
  private setupEventListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('resize', this.onResize);
  }

  private removeEventListeners() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onResize);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Weapon slots 1 - 8
    if (e.code >= 'Digit1' && e.code <= 'Digit8') {
      const idx = parseInt(e.code.replace('Digit', '')) - 1;
      const weaponKeys = Object.keys(this.arsenal);
      if (weaponKeys[idx]) {
        this.switchWeapon(weaponKeys[idx] as WeaponType);
      }
    }

    // Q / E quick switch
    if (e.code === 'KeyQ') this.cycleWeapon(-1);
    if (e.code === 'KeyE') this.cycleWeapon(1);

    // R = Reload
    if (e.code === 'KeyR') this.reloadWeapon();

    // Space / Shift for Roll Dodge
    if (e.code === 'KeyF' || e.code === 'ShiftLeft') {
      this.triggerDash();
    }

    // Melee attack with V or Right Click
    if (e.code === 'KeyV') {
      this.triggerMelee();
    }

    // Special Ability G
    if (e.code === 'KeyG') {
      this.triggerSpecialAbility();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseAim.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseAim.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to 2.5D plane (Z = 0)
    this.mouseRaycaster.setFromCamera(new THREE.Vector2(this.mouseAim.x, this.mouseAim.y), this.camera);
    const target = new THREE.Vector3();
    this.mouseRaycaster.ray.intersectPlane(this.mousePlane, target);
    if (target) {
      this.mouseAim.worldX = target.x;
      this.mouseAim.worldY = target.y;
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) { // Left Click = Fire
      this.isFiring = true;
    } else if (e.button === 2) { // Right Click = Melee / Special
      this.triggerMelee();
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isFiring = false;
    }
  };

  private onWheel = (e: WheelEvent) => {
    if (e.deltaY > 0) this.cycleWeapon(1);
    else if (e.deltaY < 0) this.cycleWeapon(-1);
  };

  private onResize = () => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // Mobile Touch Input Triggers
  public touchMove(vx: number, jump: boolean) {
    this.playerVx = vx * this.soldierStats.moveSpeed;
    if (jump) this.keys['KeyW'] = true;
  }

  public touchAimAndFire(aimX: number, aimY: number, fire: boolean) {
    this.mouseAim.worldX = this.playerX + aimX * 10;
    this.mouseAim.worldY = this.playerY + aimY * 10 + 1.2;
    this.isFiring = fire;
  }

  public triggerDash() {
    if (this.dashCooldownTimer > 0 || this.isDashing) return;
    this.isDashing = true;
    this.dashTimer = 0.28;
    this.dashCooldownTimer = this.soldierStats.dashCooldown;
    this.invulnerableTimer = 0.32;
    this.soldierModel.isRolling = true;
    soundManager.playDash();

    // Spawn dash smoke / spark
    this.spawnSparks(this.playerX, this.playerY + 0.5, 8, 0x38bdf8);
  }

  public triggerMelee() {
    this.soldierModel.triggerMelee();
    soundManager.playMeleeSlash();

    // Check melee collision in front of soldier
    const reach = 2.8;
    const facing = this.soldierModel.facingDirection;
    
    this.monsters.forEach(m => {
      if (m.isDead) return;
      const dx = m.x - this.playerX;
      if (Math.sign(dx) === facing && Math.abs(dx) <= reach && Math.abs(m.y - this.playerY) < 2.5) {
        const meleeDamage = 75 * this.soldierStats.damageMultiplier;
        const killed = m.takeDamage(meleeDamage);
        soundManager.playMonsterHit(m.isBoss);
        this.addFloatingText(`-${Math.round(meleeDamage)}`, m.x, m.y + 1.5, '#38bdf8', 1.4);
        this.spawnSparks(m.x, m.y + 1.0, 12, 0x38bdf8);
        if (killed) this.onMonsterKilled(m);
      }
    });
  }

  public triggerSpecialAbility() {
    if (this.soldierStats.specialAbilityCharges <= 0) return;
    this.soldierStats.specialAbilityCharges--;

    // Launch Frag/Cryo Grenade towards mouse
    const dx = this.mouseAim.worldX - this.playerX;
    const dy = this.mouseAim.worldY - (this.playerY + 1.2);
    const angle = Math.atan2(dy, dx);

    const grenadeGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const grenadeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const grenadeMesh = new THREE.Mesh(grenadeGeo, grenadeMat);
    grenadeMesh.position.set(this.playerX, this.playerY + 1.2, 0);
    this.scene.add(grenadeMesh);

    const speed = 18;
    this.projectiles.push({
      mesh: grenadeMesh,
      x: this.playerX,
      y: this.playerY + 1.2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 5,
      damage: 350 * this.soldierStats.damageMultiplier,
      isExplosive: true,
      explosiveRadius: 7.0,
      life: 1.2,
      pierceRemaining: 1,
      color: '#38bdf8'
    });

    this.addFloatingText('¡GRANADA LANZADA!', this.playerX, this.playerY + 2.5, '#38bdf8', 1.2);
  }

  public switchWeapon(weaponId: WeaponType) {
    if (!this.arsenal[weaponId] || !this.arsenal[weaponId].unlocked) return;
    this.activeWeaponId = weaponId;
    this.soldierModel.buildWeaponMesh(weaponId);
    this.isReloading = false;
    this.reloadTimer = 0;
    this.updateHUD();
  }

  public cycleWeapon(direction: number) {
    const unlockedWeapons = Object.values(this.arsenal).filter(w => w.unlocked);
    if (unlockedWeapons.length <= 1) return;
    const currentIdx = unlockedWeapons.findIndex(w => w.id === this.activeWeaponId);
    let nextIdx = (currentIdx + direction) % unlockedWeapons.length;
    if (nextIdx < 0) nextIdx = unlockedWeapons.length - 1;
    this.switchWeapon(unlockedWeapons[nextIdx].id);
  }

  public reloadWeapon() {
    const weapon = this.arsenal[this.activeWeaponId];
    if (this.isReloading || weapon.currentAmmo >= weapon.magazineSize || weapon.reserveAmmo <= 0) return;
    this.isReloading = true;
    this.reloadTimer = weapon.reloadTime;
    soundManager.playReload();
  }

  // --- MAIN LOOP ---
  private loop = () => {
    if (!this.isRunning) return;
    this.animationFrameId = requestAnimationFrame(this.loop);

    if (this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const rawDelta = Math.min(this.clock.getDelta(), 0.1);
    
    // Bullet time slow-mo
    if (this.bulletTimeTimer > 0) {
      this.bulletTimeTimer -= rawDelta;
      this.timeScale = 0.35;
    } else {
      this.timeScale = 1.0;
    }
    const delta = rawDelta * this.timeScale;

    // 1. Update Player Physics & Movement
    this.updatePlayer(delta);

    // 2. Update Weapons & Projectiles
    this.updateCombat(delta);

    // 3. Update Monsters AI & Spawns
    this.updateMonsters(delta);

    // 4. Update Pickups & Floating Texts
    this.updateDropsAndFX(delta);

    // 5. Update Scenario & Particle Weather
    this.scenarioBuilder.update(delta);

    // 6. Update Camera 2.5D Tracking & Shake
    this.updateCamera(delta);

    // 7. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  };

  // --- PLAYER UPDATE ---
  private updatePlayer(delta: number) {
    const stats = this.soldierStats;

    // Timers
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= delta;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= delta;

    // Horizontal Movement
    if (this.isDashing) {
      this.dashTimer -= delta;
      this.playerX += this.soldierModel.facingDirection * stats.moveSpeed * 2.6 * delta;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.soldierModel.isRolling = false;
      }
    } else {
      let moveDir = 0;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir += 1;

      const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
      const speed = stats.moveSpeed * (isSprinting ? stats.sprintMultiplier : 1.0);

      this.playerVx = moveDir * speed;
      this.playerX += this.playerVx * delta;

      // Restrict player inside platform bounds (-38 to +38)
      this.playerX = Math.max(-38, Math.min(38, this.playerX));
    }

    // Vertical Movement & Gravity
    const gravity = -32;
    this.playerVy += gravity * delta;
    this.playerY += this.playerVy * delta;

    // Ground & Platform Collisions
    let groundHeight = 0; // base floor
    // Check elevated platforms
    const platforms = [
      { x: -14, w: 9, y: 3.2 },
      { x: 14, w: 9, y: 3.2 },
      { x: 0, w: 8, y: 5.5 },
    ];

    for (const p of platforms) {
      if (
        this.playerX >= p.x - p.w / 2 - 0.4 &&
        this.playerX <= p.x + p.w / 2 + 0.4 &&
        this.playerY >= p.y - 0.2 &&
        this.playerY <= p.y + 0.8 &&
        this.playerVy <= 0
      ) {
        groundHeight = p.y;
        break;
      }
    }

    if (this.playerY <= groundHeight) {
      this.playerY = groundHeight;
      this.playerVy = 0;
      this.isGrounded = true;
      this.soldierModel.isJumping = false;
    } else {
      this.isGrounded = false;
      this.soldierModel.isJumping = true;
    }

    // Jump & Jetpack Thrust
    if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space']) {
      if (this.isGrounded) {
        this.playerVy = stats.jumpForce;
        this.isGrounded = false;
      } else if (stats.jetpackFuel > 0) {
        // Jetpack thrust in air
        this.playerVy = Math.min(10, this.playerVy + 40 * delta);
        stats.jetpackFuel = Math.max(0, stats.jetpackFuel - stats.jetpackBurnRate * delta);
        soundManager.playJetpack();
      }
    } else {
      // Recharge Jetpack when not holding jump
      if (this.isGrounded && stats.jetpackFuel < stats.jetpackMaxFuel) {
        stats.jetpackFuel = Math.min(stats.jetpackMaxFuel, stats.jetpackFuel + stats.jetpackRechargeRate * delta);
      }
    }

    // Shield Recharge
    if (stats.shield < stats.maxShield) {
      stats.shield = Math.min(stats.maxShield, stats.shield + stats.shieldRechargeRate * delta);
    }

    // Aim Angle towards Mouse in 2.5D plane
    const aimDx = this.mouseAim.worldX - this.playerX;
    const aimDy = this.mouseAim.worldY - (this.playerY + 1.4);
    this.soldierModel.facingDirection = aimDx >= 0 ? 1 : -1;
    this.soldierModel.aimAngle = Math.atan2(aimDy, Math.abs(aimDx));

    // Update Soldier 3D Model
    this.soldierModel.mesh.position.set(this.playerX, this.playerY, this.playerZ);
    this.soldierModel.isRunning = Math.abs(this.playerVx) > 0.5;
    this.soldierModel.update(delta, this.playerVx);
  }

  // --- COMBAT & WEAPONS ---
  private updateCombat(delta: number) {
    const weapon = this.arsenal[this.activeWeaponId];
    if (this.fireTimer > 0) this.fireTimer -= delta;

    // Reload progress
    if (this.isReloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        const needed = weapon.magazineSize - weapon.currentAmmo;
        const amount = Math.min(needed, weapon.reserveAmmo);
        weapon.currentAmmo += amount;
        weapon.reserveAmmo -= amount;
        this.updateHUD();
      }
    }

    // Active Quad Damage Powerup
    const quadMult = this.activePowerups.has('quad_damage') ? 2.5 : 1.0;

    // Weapon Firing
    if (this.isFiring && this.fireTimer <= 0 && !this.isReloading && !this.isDashing) {
      if (weapon.currentAmmo > 0) {
        weapon.currentAmmo--;
        this.fireTimer = 1.0 / weapon.fireRate;
        this.soldierModel.triggerMuzzleFlash();
        soundManager.playShoot(weapon.id);
        this.cameraShakeIntensity = weapon.id === 'shotgun' || weapon.id === 'rocket_launcher' ? 0.35 : 0.12;

        // Spawn Bullets
        const aimDx = this.mouseAim.worldX - this.playerX;
        const aimDy = this.mouseAim.worldY - (this.playerY + 1.35);
        const baseAngle = Math.atan2(aimDy, aimDx);

        const count = weapon.bulletCount || 1;
        for (let b = 0; b < count; b++) {
          const spreadOffset = (Math.random() - 0.5) * weapon.spread * 2;
          const bulletAngle = baseAngle + spreadOffset;

          const isCrit = Math.random() < this.soldierStats.critChance;
          const damage = weapon.damage * this.soldierStats.damageMultiplier * quadMult * (isCrit ? this.soldierStats.critMultiplier : 1.0);

          this.spawnBullet(
            this.playerX + (this.soldierModel.facingDirection === 1 ? 0.6 : -0.6),
            this.playerY + 1.35,
            bulletAngle,
            weapon,
            damage,
            isCrit
          );
        }

        this.updateHUD();

        // Auto reload on empty
        if (weapon.currentAmmo === 0) {
          this.reloadWeapon();
        }
      } else {
        this.reloadWeapon();
      }
    }

    // Update Player Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.mesh.position.set(p.x, p.y, 0);

      // Check collision with monsters
      let hit = false;
      for (const m of this.monsters) {
        if (m.isDead) return;
        const dist = Math.hypot(m.x - p.x, (m.y + 0.8) - p.y);
        const hitRadius = (m.isBoss ? 2.5 : 1.0);

        if (dist <= hitRadius) {
          // Front Shield Check
          if (m.hasShield && m.shieldActive) {
            const bulletFromFront = Math.sign(p.vx) !== m.facing;
            if (bulletFromFront) {
              soundManager.playShieldBreak();
              this.addFloatingText('¡BLOQUEADO!', m.x, m.y + 1.8, '#60a5fa', 1.0);
              this.spawnSparks(p.x, p.y, 6, 0x60a5fa);
              hit = true;
              break;
            }
          }

          // Damage Monster
          const killed = m.takeDamage(p.damage);
          soundManager.playMonsterHit(m.isBoss);
          this.addFloatingText(
            `${p.isCrit ? 'CRÍTICO! ' : ''}-${Math.round(p.damage)}`,
            m.x + (Math.random() - 0.5),
            m.y + 1.2 + Math.random() * 0.8,
            p.isCrit ? '#facc15' : '#ffffff',
            p.isCrit ? 1.5 : 1.1
          );

          this.spawnSparks(p.x, p.y, 10, p.isCrit ? 0xfacc15 : 0xff4444);

          // Explosive AOE Damage (Rockets / Grenades)
          if (p.isExplosive) {
            soundManager.playExplosion(m.isBoss ? 'large' : 'medium');
            this.cameraShakeIntensity = 0.45;
            this.monsters.forEach(otherM => {
              if (otherM === m || otherM.isDead) return;
              const aoeDist = Math.hypot(otherM.x - p.x, otherM.y - p.y);
              if (aoeDist <= (p.explosiveRadius || 5.0)) {
                const aoeDmg = p.damage * 0.7 * (1 - aoeDist / (p.explosiveRadius || 5.0));
                const aoeKilled = otherM.takeDamage(aoeDmg);
                if (aoeKilled) this.onMonsterKilled(otherM);
              }
            });
          }

          if (killed) {
            this.onMonsterKilled(m);
          }

          p.pierceRemaining--;
          if (p.pierceRemaining <= 0) {
            hit = true;
          }
          break;
        }
      }

      if (hit || p.life <= 0 || p.y < 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // Update Enemy Projectiles (Acid, Plasma)
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.life -= delta;
      ep.x += ep.vx * delta;
      ep.y += ep.vy * delta;
      ep.mesh.position.set(ep.x, ep.y, 0);

      // Check collision with Player
      const dist = Math.hypot(this.playerX - ep.x, (this.playerY + 1.0) - ep.y);
      if (dist < 1.2) {
        this.damagePlayer(ep.damage);
        this.scene.remove(ep.mesh);
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      if (ep.life <= 0 || ep.y < 0) {
        this.scene.remove(ep.mesh);
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private spawnBullet(x: number, y: number, angle: number, weapon: WeaponStats, damage: number, isCrit: boolean) {
    const isLaser = weapon.id === 'laser_beam';
    const isRocket = weapon.id === 'rocket_launcher';

    const geo = isRocket 
      ? new THREE.ConeGeometry(0.18, 0.7, 8) 
      : new THREE.CylinderGeometry(0.06, 0.06, isLaser ? 2.5 : 0.6, 6);
    
    geo.rotateZ(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: isCrit ? 0xfacc15 : weapon.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    mesh.rotation.z = angle;
    this.scene.add(mesh);

    const speed = weapon.bulletSpeed;
    this.projectiles.push({
      mesh,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      isCrit,
      isExplosive: isRocket,
      explosiveRadius: weapon.explosiveRadius,
      pierceRemaining: weapon.piercing || 1,
      life: 1.5,
      color: weapon.color,
    });
  }

  // --- MONSTERS & SPAWNING ---
  private updateMonsters(delta: number) {
    const biome = this.currentBiome;

    // Combo Timer Decay
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.callbacks.onScoreUpdate(this.score, this.credits, this.combo);
      }
    }

    // Monster Spawning
    if (this.monstersSpawnedThisWave < biome.totalMonsterTarget) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0 && this.monsters.filter(m => !m.isDead).length < biome.concurrentMax) {
        this.spawnRandomMonster();
        this.spawnTimer = biome.spawnInterval;
      }
    } else if (biome.bossType && !this.currentBoss && this.monsters.filter(m => !m.isDead).length === 0) {
      // Spawn Boss
      this.spawnBoss(biome.bossType);
    }

    // Update Monster AI & Attacks
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      const result = m.update(delta, this.playerX, this.playerY);

      if (m.isDead && m.deathTimer > 0.4) {
        this.scene.remove(m.mesh);
        this.monsters.splice(i, 1);
        continue;
      }

      if (result.shouldAttack && !m.isDead) {
        if (result.shootType === 'acid') {
          // Shoot acid glob
          this.spawnEnemyAcid(m.x, m.y + 0.8, this.playerX, this.playerY + 1.0, m.damage);
        } else {
          // Melee attack hit player
          this.damagePlayer(m.damage);
          if (m.type === 'bomb_bug') {
            soundManager.playExplosion('small');
            m.takeDamage(999);
            this.onMonsterKilled(m);
          }
        }
      }
    }

    // Check Wave Completion
    if (
      this.monstersSpawnedThisWave >= biome.totalMonsterTarget &&
      this.monsters.length === 0 &&
      (!biome.bossType || (this.currentBoss && this.currentBoss.isDead))
    ) {
      this.onWaveComplete();
    }
  }

  private spawnRandomMonster() {
    const biome = this.currentBiome;
    const type = biome.monstersAllowed[Math.floor(Math.random() * biome.monstersAllowed.length)];
    const stats = MONSTER_DEFINITIONS[type];

    // Spawn on left or right side outside active viewport
    const side = Math.random() > 0.5 ? 1 : -1;
    const spawnX = this.playerX + side * (24 + Math.random() * 8);

    const monster = new MonsterInstance(type, stats, spawnX, 0);
    this.scene.add(monster.mesh);
    this.monsters.push(monster);
    this.monstersSpawnedThisWave++;

    this.updateHUD();
  }

  private spawnBoss(bossType: any) {
    const stats = MONSTER_DEFINITIONS[bossType];
    const monster = new MonsterInstance(bossType, stats, this.playerX + 22, 0);
    this.scene.add(monster.mesh);
    this.monsters.push(monster);
    this.currentBoss = monster;

    soundManager.playMonsterDeath(bossType, true);
    this.cameraShakeIntensity = 0.6;
    this.addFloatingText(`⚠️ ALERTA DE JEFE: ${stats.name.toUpperCase()} ⚠️`, this.playerX, this.playerY + 4, '#ef4444', 2.0);
    this.callbacks.onBossUpdate(this.currentBoss);
  }

  private spawnEnemyAcid(fromX: number, fromY: number, toX: number, toY: number, damage: number) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    const geo = new THREE.SphereGeometry(0.25, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x84cc16 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(fromX, fromY, 0);
    this.scene.add(mesh);

    const speed = 14;
    this.enemyProjectiles.push({
      mesh,
      x: fromX,
      y: fromY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      life: 2.0,
    });
  }

  private onMonsterKilled(monster: MonsterInstance) {
    this.totalKills++;
    this.monstersKilledThisWave++;

    // Combo system
    this.combo++;
    this.comboTimer = 3.5;
    const comboMultiplier = 1 + Math.min(3.0, this.combo * 0.15);

    // Score & Credits
    const earnedScore = Math.round(monster.scoreValue * comboMultiplier);
    const earnedCredits = Math.round(monster.creditsValue * (1 + this.soldierStats.creditBonus));
    this.score += earnedScore;
    this.credits += earnedCredits;

    // Life steal
    if (this.soldierStats.lifeSteal > 0) {
      const heal = Math.round(this.soldierStats.maxHp * this.soldierStats.lifeSteal);
      this.soldierStats.hp = Math.min(this.soldierStats.maxHp, this.soldierStats.hp + heal);
      this.addFloatingText(`+${heal} HP`, this.playerX, this.playerY + 2.0, '#4ade80', 1.1);
    }

    soundManager.playMonsterDeath(monster.type, monster.isBoss);

    if (monster.isBoss) {
      this.bossesDefeated++;
      this.bulletTimeTimer = 1.4; // Slow motion cinematic on boss kill
      this.currentBoss = null;
      this.callbacks.onBossUpdate(null);
    }

    // Drop Credits & Powerups
    this.spawnDrop(monster.x, monster.y + 0.5, monster.isBoss);

    this.callbacks.onScoreUpdate(this.score, this.credits, this.combo);
    this.updateHUD();
  }

  private damagePlayer(amount: number) {
    if (this.invulnerableTimer > 0 || this.isDashing || this.activePowerups.has('invulnerability')) return;

    let dmg = amount;
    // Shield absorbs first
    if (this.soldierStats.shield > 0) {
      if (this.soldierStats.shield >= dmg) {
        this.soldierStats.shield -= dmg;
        dmg = 0;
      } else {
        dmg -= this.soldierStats.shield;
        this.soldierStats.shield = 0;
        soundManager.playShieldBreak();
      }
    }

    if (dmg > 0) {
      this.soldierStats.hp -= dmg;
      soundManager.playPlayerHurt();
      this.cameraShakeIntensity = 0.35;
      this.addFloatingText(`-${Math.round(dmg)}`, this.playerX, this.playerY + 2.0, '#ef4444', 1.4);
    }

    if (this.soldierStats.hp <= 0) {
      this.soldierStats.hp = 0;
      this.onPlayerDeath();
    }

    this.updateHUD();
  }

  private onPlayerDeath() {
    this.isRunning = false;
    soundManager.playGameOver();
    const stats = {
      score: this.score,
      credits: this.credits,
      waveReached: this.currentWave,
      kills: this.totalKills,
      bossesDefeated: this.bossesDefeated,
      timeSurvivedSec: Math.floor((Date.now() - this.gameStartTime) / 1000)
    };
    this.callbacks.onGameOver(false, stats);
  }

  private onWaveComplete() {
    soundManager.playWaveComplete();
    this.credits += 250 + this.currentWave * 75;
    
    if (this.currentWave >= 8) {
      // Victory finale!
      this.callbacks.onGameOver(true, {
        score: this.score,
        credits: this.credits,
        waveReached: this.currentWave,
        kills: this.totalKills,
        bossesDefeated: this.bossesDefeated,
        timeSurvivedSec: Math.floor((Date.now() - this.gameStartTime) / 1000)
      });
    } else {
      this.callbacks.onWaveCleared(this.currentWave);
    }
  }

  // --- DROPS & PICKUPS ---
  private spawnDrop(x: number, y: number, isBoss: boolean = false) {
    const isPowerup = isBoss || Math.random() < 0.22;

    const dropGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const dropMat = new THREE.MeshBasicMaterial({ color: isPowerup ? 0xf43f5e : 0xfacc15 });
    const dropMesh = new THREE.Mesh(dropGeo, dropMat);
    dropMesh.position.set(x, y, 0);
    this.scene.add(dropMesh);

    const powerups: PowerupType[] = ['medkit', 'shield_pack', 'quad_damage', 'nuke_bomb', 'infinite_ammo', 'time_warp'];
    const chosenPowerup = isPowerup ? powerups[Math.floor(Math.random() * powerups.length)] : undefined;

    this.drops.push({
      id: Math.random().toString(),
      type: isPowerup ? 'powerup' : 'credit',
      powerupType: chosenPowerup,
      creditValue: 20 + Math.floor(Math.random() * 30),
      x,
      y,
      z: 0,
      vx: (Math.random() - 0.5) * 4,
      vy: 5 + Math.random() * 3,
      vz: 0,
      lifeTime: 14.0,
      maxLifeTime: 14.0,
      mesh: dropMesh,
    });
  }

  private updateDropsAndFX(delta: number) {
    // Update Powerup Expirations
    for (const [pType, duration] of this.activePowerups.entries()) {
      if (duration <= delta) {
        this.activePowerups.delete(pType);
      } else {
        this.activePowerups.set(pType, duration - delta);
      }
    }

    // Update Drops Physics & Magnet Pickup
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.lifeTime -= delta;

      // Magnet attraction towards player
      const dx = this.playerX - drop.x;
      const dy = (this.playerY + 1.0) - drop.y;
      const dist = Math.hypot(dx, dy);

      if (dist < this.soldierStats.pickupRadius) {
        const pullSpeed = (this.soldierStats.pickupRadius - dist) * 8.0;
        drop.vx = (dx / dist) * pullSpeed;
        drop.vy = (dy / dist) * pullSpeed;
      } else {
        drop.vy -= 18 * delta; // Gravity
      }

      drop.x += drop.vx * delta;
      drop.y += drop.vy * delta;
      if (drop.y < 0.3) {
        drop.y = 0.3;
        drop.vy = 0;
      }

      if (drop.mesh) {
        drop.mesh.position.set(drop.x, drop.y, 0);
        drop.mesh.rotation.y += delta * 3;
        drop.mesh.rotation.x += delta * 2;
      }

      // Pickup Collision with Player
      if (dist < 1.2) {
        if (drop.type === 'credit') {
          soundManager.playCreditPickup();
          this.credits += drop.creditValue || 25;
          this.addFloatingText(`+${drop.creditValue} CR`, drop.x, drop.y + 0.8, '#facc15', 1.0);
        } else if (drop.powerupType) {
          this.applyPowerup(drop.powerupType);
        }

        if (drop.mesh) this.scene.remove(drop.mesh);
        this.drops.splice(i, 1);
        this.callbacks.onScoreUpdate(this.score, this.credits, this.combo);
        continue;
      }

      if (drop.lifeTime <= 0) {
        if (drop.mesh) this.scene.remove(drop.mesh);
        this.drops.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= delta;
      ft.y += ft.vy * delta;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
    this.callbacks.onFloatingTextsUpdate([...this.floatingTexts]);
  }

  private applyPowerup(type: PowerupType) {
    soundManager.playPowerupPickup();
    switch (type) {
      case 'medkit':
        this.soldierStats.hp = Math.min(this.soldierStats.maxHp, this.soldierStats.hp + 45);
        this.addFloatingText('+45 HP (BOTIQUÍN)', this.playerX, this.playerY + 2.0, '#22c55e', 1.3);
        break;
      case 'shield_pack':
        this.soldierStats.shield = this.soldierStats.maxShield;
        this.addFloatingText('ESCUDO REPARADO', this.playerX, this.playerY + 2.0, '#38bdf8', 1.3);
        break;
      case 'quad_damage':
        this.activePowerups.set('quad_damage', 10.0);
        this.addFloatingText('¡DAÑO CUÁDRUPLE!', this.playerX, this.playerY + 2.5, '#a855f7', 1.6);
        break;
      case 'nuke_bomb':
        soundManager.playExplosion('large');
        this.cameraShakeIntensity = 0.8;
        this.monsters.forEach(m => {
          if (!m.isDead && !m.isBoss) {
            m.takeDamage(600);
            this.onMonsterKilled(m);
          }
        });
        this.addFloatingText('💥 BOMBA NUCLEAR 💥', this.playerX, this.playerY + 2.5, '#ef4444', 1.8);
        break;
      case 'infinite_ammo':
        this.activePowerups.set('infinite_ammo', 8.0);
        this.arsenal[this.activeWeaponId].currentAmmo = this.arsenal[this.activeWeaponId].magazineSize;
        this.addFloatingText('MUNICIÓN INFINITA', this.playerX, this.playerY + 2.0, '#eab308', 1.4);
        break;
      case 'time_warp':
        this.bulletTimeTimer = 6.0;
        this.addFloatingText('DISTORSIÓN TEMPORAL', this.playerX, this.playerY + 2.0, '#06b6d4', 1.4);
        break;
      case 'invulnerability':
        this.activePowerups.set('invulnerability', 6.0);
        this.addFloatingText('INVULNERABLE', this.playerX, this.playerY + 2.0, '#ec4899', 1.4);
        break;
    }
  }

  private addFloatingText(text: string, x: number, y: number, color: string, scale: number) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      z: 0,
      color,
      scale,
      life: 0.85,
      maxLife: 0.85,
      vy: 1.8,
    });
  }

  private spawnSparks(x: number, y: number, count: number, colorHex: number) {
    for (let s = 0; s < count; s++) {
      const sparkGeo = new THREE.OctahedronGeometry(0.08, 0);
      const sparkMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set(x, y, 0);
      this.scene.add(spark);

      const angle = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 6;
      this.bloodParticles.push({
        mesh: spark,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.3,
      });
    }
  }

  // --- CAMERA 2.5D CONTROLLER ---
  private updateCamera(delta: number) {
    // Dynamic smooth camera tracking soldier with horizontal lead
    const leadOffset = this.soldierModel.facingDirection * 3.0;
    this.cameraTargetX += (this.playerX + leadOffset - this.cameraTargetX) * 5.0 * delta;
    this.cameraTargetY += (Math.max(3.0, this.playerY + 2.0) - this.cameraTargetY) * 5.0 * delta;

    // Screen Shake decay
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 2;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 2.5);
    }

    this.camera.position.set(this.cameraTargetX + shakeX, this.cameraTargetY + 4.5 + shakeY, 17);
    this.camera.lookAt(this.cameraTargetX, this.cameraTargetY + 1.2, 0);
  }

  private updateHUD() {
    this.callbacks.onStatsUpdate({ ...this.soldierStats });
    this.callbacks.onWeaponUpdate(this.arsenal[this.activeWeaponId], { ...this.arsenal });
    this.callbacks.onWaveProgressUpdate(
      this.monstersKilledThisWave,
      this.currentBiome.totalMonsterTarget,
      this.currentWave,
      this.currentBiome.name
    );
  }
}
