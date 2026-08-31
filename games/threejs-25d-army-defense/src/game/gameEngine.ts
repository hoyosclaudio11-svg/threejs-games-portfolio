import * as THREE from 'three';
import { 
  HeroCommander, 
  SquadMember, 
  Enemy, 
  Projectile, 
  FloatingText, 
  VillageState, 
  WaveScenario, 
  FormationMode, 
  RelicItem
} from '../types/game';
import { soundManager } from '../audio/soundManager';
import { buildScenarioEnvironment, EnvironmentScene } from './environment';
import { 
  createHeroModel, 
  createKnightModel, 
  createArcherModel, 
  createMageModel, 
  createPriestessModel, 
  createBombardierModel, 
  createAssassinModel, 
  createEnemyModel,
  CharacterMeshGroup 
} from './characterModels';
import { VisualEffectsSystem } from './particleSystem';

export interface GameEngineCallbacks {
  onHeroHpChange: (hp: number, maxHp: number, shield: number) => void;
  onVillageHpChange: (hp: number, maxHp: number) => void;
  onSquadUpdate: (squad: SquadMember[]) => void;
  onWaveProgress: (enemiesLeft: number, totalEnemies: number, bossSpawned: boolean) => void;
  onWaveComplete: (waveNum: number, goldGained: number) => void;
  onGameOver: (victory: boolean, stats: any) => void;
  onGoldGain: (amount: number) => void;
  onComboChange: (combo: number) => void;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private animFrameId: number | null = null;
  private clock: THREE.Clock;
  private callbacks: GameEngineCallbacks;

  // Visual & Lighting
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private vfx: VisualEffectsSystem;
  private currentEnvironment: EnvironmentScene | null = null;

  // Entities State
  public hero: HeroCommander;
  public squad: SquadMember[] = [];
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public floatingTexts: FloatingText[] = [];
  public village: VillageState;
  public activeRelics: RelicItem[] = [];

  // Wave & Progression
  public currentWaveIndex: number = 0;
  public currentScenario: WaveScenario | null = null;
  public waveTimeElapsed: number = 0;
  public waveTotalEnemiesToSpawn: number = 0;
  public waveEnemiesSpawnedCount: number = 0;
  public isWaveActive: boolean = false;
  public isPaused: boolean = false;
  public gameSpeed: number = 1.0;
  public formationMode: FormationMode = 'follow';

  // Stats & Combat
  public gold: number = 200;
  public comboCount: number = 0;
  public comboTimer: number = 0;
  public totalKills: number = 0;
  public totalDamage: number = 0;
  public cameraShakeTimer: number = 0;
  public cameraShakeIntensity: number = 0;

  // Input State
  public keysDown: { [key: string]: boolean } = {};
  public mousePos: THREE.Vector2 = new THREE.Vector2();
  public raycaster: THREE.Raycaster = new THREE.Raycaster();
  public groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  public virtualMoveVector: { x: number; z: number } = { x: 0, z: 0 };

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbae6fd);
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.015);

    this.camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.5, 300);
    this.camera.position.set(0, 24, 22);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    this.sunLight.position.set(25, 40, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -25;
    this.sunLight.shadow.camera.right = 25;
    this.sunLight.shadow.camera.top = 25;
    this.sunLight.shadow.camera.bottom = -25;
    this.scene.add(this.sunLight);

    // VFX System
    this.vfx = new VisualEffectsSystem();
    this.scene.add(this.vfx.group);

    // Initial Hero State
    this.hero = {
      name: 'Kaelen',
      level: 1,
      stats: {
        hp: 450,
        maxHp: 450,
        attack: 60,
        defense: 20,
        moveSpeed: 6.8,
        attackSpeed: 1.6,
        attackRange: 2.8,
        critChance: 0.2
      },
      position: { x: 0, z: 4 },
      velocity: { x: 0, z: 0 },
      rotation: 0,
      isDashing: false,
      dashCooldown: 0,
      dashTimer: 0,
      skills: [
        {
          id: 'whirlwind',
          name: 'Torbellino Giratorio',
          nameEn: 'Whirlwind Slash',
          description: 'Giro de 360° con espada de energía que arrastra y corta a todos los enemigos cercanos.',
          descriptionEn: 'Sweeping 360 vortex slash drawing in and slicing all surrounding foes.',
          cooldown: 5.0,
          currentCooldown: 0,
          icon: 'RotateCw',
          color: '#3b82f6',
          keybind: 'Q',
          soundType: 'whirlwind'
        },
        {
          id: 'leap_slam',
          name: 'Salto Devastador',
          nameEn: 'Heroic Leap Slam',
          description: 'Salta hacia adelante y cae con una onda expansiva que aturde a los enemigos por 2.5s.',
          descriptionEn: 'Leaps high and slams down dealing massive shockwave impact and stun.',
          cooldown: 8.0,
          currentCooldown: 0,
          icon: 'Zap',
          color: '#eab308',
          keybind: 'E',
          soundType: 'leap'
        },
        {
          id: 'rally_cry',
          name: 'Grito de Guerra del Comandante',
          nameEn: 'Commander Rallying Cry',
          description: 'Toca el cuerno de batalla: +50% velocidad y +100% daño al escuadrón, y refresca sus habilidades.',
          descriptionEn: 'Blows war horn: +50% speed, +100% attack to squad, and refreshes squad cooldowns!',
          cooldown: 14.0,
          currentCooldown: 0,
          icon: 'Flame',
          color: '#ef4444',
          keybind: 'R',
          soundType: 'horn'
        },
        {
          id: 'holy_banner',
          name: 'Estandarte Sagrado de la Aldea',
          nameEn: 'Holy Guardian Banner',
          description: 'Clava un estandarte sagrado que cura +150 HP a todos los aliados y al núcleo de la aldea.',
          descriptionEn: 'Plants a holy banner restoring +150 HP to allies and the village core.',
          cooldown: 18.0,
          currentCooldown: 0,
          icon: 'Shield',
          color: '#10b981',
          keybind: 'F',
          soundType: 'banner'
        }
      ],
      state: 'idle',
      animTimer: 0,
      attackCooldown: 0,
      killCount: 0,
      damageDealt: 0,
      shield: 0,
      maxShield: 150
    };

    // Hero 3D Model
    const heroMesh = createHeroModel();
    heroMesh.position.set(this.hero.position.x, 0, this.hero.position.z);
    this.scene.add(heroMesh);
    (this.hero as any).modelMesh = heroMesh;

    // Initial Village State
    this.village = {
      hp: 1000,
      maxHp: 1000,
      level: 1,
      barricadeHp: 400,
      maxBarricadeHp: 400,
      turretLevel: 1,
      turretCooldown: 0,
      repairRate: 2,
      citizenCount: 4,
      isUnderAttack: false,
      damageFlashTimer: 0
    };

    this.setupWindowListeners();
    this.startLoop();
  }

  private setupWindowListeners() {
    const onResize = () => {
      if (!this.container) return;
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const onKeyDown = (e: KeyboardEvent) => {
      this.keysDown[e.code] = true;
      this.keysDown[e.key.toLowerCase()] = true;

      // Number keys for squad skills
      if (e.key === '1') this.triggerSquadSkill(0);
      if (e.key === '2') this.triggerSquadSkill(1);
      if (e.key === '3') this.triggerSquadSkill(2);
      if (e.key === '4') this.triggerSquadSkill(3);
      if (e.key === '5') this.triggerSquadSkill(4);
      if (e.key === '6') this.triggerSquadSkill(5);

      // Hero Skills
      if (e.code === 'KeyQ') this.triggerHeroSkill(0);
      if (e.code === 'KeyE') this.triggerHeroSkill(1);
      if (e.code === 'KeyR') this.triggerHeroSkill(2);
      if (e.code === 'KeyF') this.triggerHeroSkill(3);
      if (e.code === 'Space') this.triggerHeroDash();

      // Formations
      if (e.code === 'KeyZ') this.setFormation('follow');
      if (e.code === 'KeyX') this.setFormation('defend_village');
      if (e.code === 'KeyC') this.setFormation('assault');
      if (e.code === 'KeyV') this.setFormation('spread');
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysDown[e.code] = false;
      this.keysDown[e.key.toLowerCase()] = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = this.container.getBoundingClientRect();
      this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        this.heroPrimaryAttack();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    this.container.addEventListener('mousedown', onMouseDown);
  }

  // WAVE SETUP & ENVIRONMENT TRANSITION
  public loadWave(scenario: WaveScenario, squadPool: SquadMember[]) {
    this.currentScenario = scenario;
    this.currentWaveIndex = scenario.waveNumber;
    this.waveTimeElapsed = 0;
    this.waveEnemiesSpawnedCount = 0;
    this.waveTotalEnemiesToSpawn = scenario.enemies.reduce((acc, curr) => acc + curr.count, 0) + (scenario.boss ? 1 : 0);
    this.isWaveActive = true;

    // 1. Remove previous environment
    if (this.currentEnvironment) {
      this.scene.remove(this.currentEnvironment.group);
    }

    // 2. Clear old enemies & projectiles
    this.enemies.forEach(e => {
      if (e.modelMesh) this.scene.remove(e.modelMesh);
    });
    this.enemies = [];

    this.projectiles.forEach(p => {
      if (p.modelMesh) this.scene.remove(p.modelMesh);
    });
    this.projectiles = [];
    this.vfx.clearAll();

    // 3. Rebuild Scenario Environment
    this.currentEnvironment = buildScenarioEnvironment(scenario.biome, this.village.level);
    this.scene.add(this.currentEnvironment.group);

    // Apply Biome Atmosphere & Lighting
    this.scene.background = new THREE.Color(scenario.skyColor);
    this.scene.fog = new THREE.FogExp2(scenario.fogColor, 0.012);
    this.ambientLight.color.setHex(scenario.ambientColor);
    this.sunLight.color.setHex(scenario.sunColor);
    this.vfx.initWeather(scenario.biome);

    // 4. Setup Squad for this wave
    // Unlock new squad units if reached goal
    this.squad = squadPool.slice(0, scenario.squadCountGoal).map(s => {
      s.isUnlocked = true;
      s.stats.hp = s.stats.maxHp;
      // Position around Hero
      return s;
    });

    // Create 3D meshes for squad members
    this.squad.forEach((member) => {
      if ((member as any).modelMesh) {
        this.scene.remove((member as any).modelMesh);
      }
      let mesh: CharacterMeshGroup;
      if (member.typeId === 'valerie') mesh = createKnightModel();
      else if (member.typeId === 'lyra') mesh = createArcherModel();
      else if (member.typeId === 'ignis') mesh = createMageModel();
      else if (member.typeId === 'astrid') mesh = createPriestessModel();
      else if (member.typeId === 'krom') mesh = createBombardierModel();
      else mesh = createAssassinModel();

      mesh.position.set(member.position.x, 0, member.position.z);
      this.scene.add(mesh);
      (member as any).modelMesh = mesh;
    });

    // Reset Hero position to center-front
    this.hero.position = { x: 0, z: 4 };
    this.hero.stats.hp = this.hero.stats.maxHp;
    if ((this.hero as any).modelMesh) {
      (this.hero as any).modelMesh.position.set(0, 0, 4);
    }

    // Start Biome Background Music
    soundManager.startBiomeMusic(scenario.biome);

    // Trigger Initial UI updates
    this.callbacks.onHeroHpChange(this.hero.stats.hp, this.hero.stats.maxHp, this.hero.shield);
    this.callbacks.onVillageHpChange(this.village.hp, this.village.maxHp);
    this.callbacks.onSquadUpdate(this.squad);
    this.callbacks.onWaveProgress(this.waveTotalEnemiesToSpawn, this.waveTotalEnemiesToSpawn, false);
  }

  // MAIN GAME TICK
  private startLoop() {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);
      if (this.isPaused) return;

      const rawDelta = this.clock.getDelta();
      const delta = Math.min(rawDelta, 0.1) * this.gameSpeed;
      const elapsed = this.clock.getElapsedTime();

      this.update(delta, elapsed);
      this.render();
    };
    animate();
  }

  private update(delta: number, elapsed: number) {
    // 1. Environment animations
    if (this.currentEnvironment) {
      this.currentEnvironment.animatedObjects.forEach(obj => obj.update(delta, elapsed));
    }

    // 2. Camera tracking & Shake
    this.updateCamera(delta);

    // 3. Hero Update (Input, Movement, Cooldowns)
    this.updateHero(delta);

    // 4. Squad Update (AI, Movement, Attacks)
    this.updateSquad(delta);

    // 5. Wave Spawner & Enemy AI
    if (this.isWaveActive && this.currentScenario) {
      this.updateWaveSpawner(delta);
    }
    this.updateEnemies(delta);

    // 6. Projectiles Physics & Collisions
    this.updateProjectiles(delta);

    // 7. Village State & Turrets
    this.updateVillage(delta);

    // 8. VFX & Particles
    this.vfx.update(delta);

    // 9. Floating damage texts
    this.updateFloatingTexts(delta);

    // 10. Combo decay
    if (this.comboCount > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.callbacks.onComboChange(0);
      }
    }

    // 11. Relics passive effects
    this.updateRelics(delta);
  }

  private updateCamera(delta: number) {
    const targetX = this.hero.position.x * 0.7;
    const targetZ = this.hero.position.z * 0.7 + 3;

    // Smooth Lerp Camera Follow
    this.camera.position.x += (targetX - this.camera.position.x) * delta * 4.0;
    this.camera.position.z += (targetZ + 22 - this.camera.position.z) * delta * 4.0;
    this.camera.position.y += (24 - this.camera.position.y) * delta * 4.0;

    // Camera Shake
    if (this.cameraShakeTimer > 0) {
      this.cameraShakeTimer -= delta;
      const shakeOffset = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.x += shakeOffset;
      this.camera.position.y += shakeOffset;
    }

    this.camera.lookAt(targetX, 0, targetZ - 3);
  }

  public triggerScreenShake(intensity: number = 0.5, duration: number = 0.25) {
    this.cameraShakeIntensity = intensity;
    this.cameraShakeTimer = duration;
  }

  private updateHero(delta: number) {
    // Movement input vector
    let mx = 0;
    let mz = 0;

    if (this.keysDown['KeyW'] || this.keysDown['ArrowUp']) mz -= 1;
    if (this.keysDown['KeyS'] || this.keysDown['ArrowDown']) mz += 1;
    if (this.keysDown['KeyA'] || this.keysDown['ArrowLeft']) mx -= 1;
    if (this.keysDown['KeyD'] || this.keysDown['ArrowRight']) mx += 1;

    // Add virtual joystick
    if (this.virtualMoveVector.x !== 0 || this.virtualMoveVector.z !== 0) {
      mx += this.virtualMoveVector.x;
      mz += this.virtualMoveVector.z;
    }

    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0.01) {
      mx /= len;
      mz /= len;
      const speed = this.hero.stats.moveSpeed * (this.hero.isDashing ? 2.5 : 1.0);
      this.hero.position.x += mx * speed * delta;
      this.hero.position.z += mz * speed * delta;

      // Keep inside bounds
      this.hero.position.x = Math.max(-28, Math.min(28, this.hero.position.x));
      this.hero.position.z = Math.max(-28, Math.min(28, this.hero.position.z));

      this.hero.rotation = Math.atan2(mx, mz);
      this.hero.state = 'moving';
      this.hero.animTimer += delta * 12;
    } else {
      this.hero.state = 'idle';
      this.hero.animTimer += delta * 3;
    }

    // Cooldown timers
    if (this.hero.attackCooldown > 0) this.hero.attackCooldown -= delta;
    if (this.hero.dashCooldown > 0) this.hero.dashCooldown -= delta;

    if (this.hero.isDashing) {
      this.hero.dashTimer -= delta;
      if (this.hero.dashTimer <= 0) {
        this.hero.isDashing = false;
      }
    }

    this.hero.skills.forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown = Math.max(0, skill.currentCooldown - delta);
      }
    });

    // Update 3D Mesh & Animations
    const mesh = (this.hero as any).modelMesh as CharacterMeshGroup;
    if (mesh) {
      mesh.position.set(this.hero.position.x, 0, this.hero.position.z);
      mesh.rotation.y = this.hero.rotation;

      // Walk cycle animation
      if (mesh.userData.leftLeg && mesh.userData.rightLeg) {
        if (this.hero.state === 'moving') {
          const legAngle = Math.sin(this.hero.animTimer) * 0.7;
          mesh.userData.leftLeg.rotation.x = legAngle;
          mesh.userData.rightLeg.rotation.x = -legAngle;
        } else {
          mesh.userData.leftLeg.rotation.x = 0;
          mesh.userData.rightLeg.rotation.x = 0;
        }
      }

      // Idle breathing bob
      if (mesh.userData.head) {
        mesh.userData.head.position.y = 1.6 + Math.sin(this.hero.animTimer * 0.5) * 0.04;
      }
    }
  }

  public heroPrimaryAttack() {
    if (this.hero.attackCooldown > 0) return;
    this.hero.attackCooldown = 1.0 / this.hero.stats.attackSpeed;

    soundManager.playHeroSlash();

    // Raycast or Directional sweep in front of Hero
    const sweepRadius = this.hero.stats.attackRange;
    const heroAngle = this.hero.rotation;
    const forwardX = Math.sin(heroAngle);
    const forwardZ = Math.cos(heroAngle);

    // Visual Slash Sparkles & Arc
    this.vfx.spawnHitSparkle(
      this.hero.position.x + forwardX * 1.5,
      1.0,
      this.hero.position.z + forwardZ * 1.5,
      0x93c5fd,
      12
    );

    // Hit check against enemies
    this.enemies.forEach(enemy => {
      const dx = enemy.position.x - this.hero.position.x;
      const dz = enemy.position.z - this.hero.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= sweepRadius) {
        // Dot product to ensure enemy is in front cone (180 deg)
        const dot = (dx * forwardX + dz * forwardZ) / (dist || 1);
        if (dot > -0.2) {
          const isCrit = Math.random() < this.hero.stats.critChance;
          const dmg = Math.round(this.hero.stats.attack * (isCrit ? 2.0 : 1.0) * (0.9 + Math.random() * 0.2));
          this.damageEnemy(enemy, dmg, isCrit, 'hero');

          // Knockback
          enemy.position.x += forwardX * 1.2;
          enemy.position.z += forwardZ * 1.2;
        }
      }
    });

    // Weapon Swing animation
    const mesh = (this.hero as any).modelMesh as CharacterMeshGroup;
    if (mesh && mesh.userData.rightArm) {
      mesh.userData.rightArm.rotation.x = -Math.PI / 2;
      setTimeout(() => {
        if (mesh && mesh.userData.rightArm) mesh.userData.rightArm.rotation.x = 0;
      }, 140);
    }
  }

  public triggerHeroSkill(index: number) {
    const skill = this.hero.skills[index];
    if (!skill || skill.currentCooldown > 0) return;

    // Apply cooldown
    skill.currentCooldown = skill.cooldown;

    if (skill.id === 'whirlwind') {
      soundManager.playWhirlwind();
      this.vfx.spawnWhirlwindArc(this.hero.position.x, this.hero.position.z);
      this.triggerScreenShake(0.4, 0.3);

      const radius = 6.5;
      this.enemies.forEach(enemy => {
        const dx = enemy.position.x - this.hero.position.x;
        const dz = enemy.position.z - this.hero.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= radius) {
          const dmg = Math.round(this.hero.stats.attack * 2.2);
          this.damageEnemy(enemy, dmg, true, 'hero');
          // Vortex suck-in
          enemy.position.x -= (dx / dist) * 2.0;
          enemy.position.z -= (dz / dist) * 2.0;
        }
      });
    } else if (skill.id === 'leap_slam') {
      soundManager.playHeroLeap();
      const forwardX = Math.sin(this.hero.rotation);
      const forwardZ = Math.cos(this.hero.rotation);

      // Leap forward
      this.hero.position.x += forwardX * 6.0;
      this.hero.position.z += forwardZ * 6.0;
      this.vfx.spawnExplosion(this.hero.position.x, 0, this.hero.position.z, 5.0, 0xfacc15);
      this.triggerScreenShake(0.7, 0.4);

      const radius = 6.0;
      this.enemies.forEach(enemy => {
        const dx = enemy.position.x - this.hero.position.x;
        const dz = enemy.position.z - this.hero.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= radius) {
          const dmg = Math.round(this.hero.stats.attack * 2.8);
          this.damageEnemy(enemy, dmg, true, 'hero');
          // Stun effect
          enemy.statusEffects.push({
            type: 'stun',
            duration: 2.5,
            potency: 1.0,
            color: '#facc15'
          });
        }
      });
    } else if (skill.id === 'rally_cry') {
      soundManager.playBattleHorn();
      this.vfx.spawnHolyAura(this.hero.position.x, this.hero.position.z);
      this.triggerScreenShake(0.3, 0.2);

      // Buff all squad members
      this.squad.forEach(member => {
        member.skill.currentCooldown = 0; // Instant reset!
        member.stats.hp = Math.min(member.stats.maxHp, member.stats.hp + 80);
      });
      this.spawnFloatingText('¡GRITO DE GUERRA!', { x: this.hero.position.x, z: this.hero.position.z }, '#ef4444', 2.0, true);
    } else if (skill.id === 'holy_banner') {
      soundManager.playHealSpell();
      this.vfx.spawnHolyAura(this.hero.position.x, this.hero.position.z);

      // Heal village core & allies
      this.village.hp = Math.min(this.village.maxHp, this.village.hp + 200);
      this.callbacks.onVillageHpChange(this.village.hp, this.village.maxHp);

      this.hero.stats.hp = Math.min(this.hero.stats.maxHp, this.hero.stats.hp + 200);
      this.callbacks.onHeroHpChange(this.hero.stats.hp, this.hero.stats.maxHp, this.hero.shield);

      this.squad.forEach(m => {
        m.stats.hp = Math.min(m.stats.maxHp, m.stats.hp + 200);
      });
      this.spawnFloatingText('+200 HP ALDEA & EJÉRCITO', { x: 0, z: 0 }, '#10b981', 2.0, true);
    }
  }

  public triggerHeroDash() {
    if (this.hero.dashCooldown > 0 || this.hero.isDashing) return;
    this.hero.isDashing = true;
    this.hero.dashTimer = 0.25;
    this.hero.dashCooldown = 1.2;

    this.vfx.spawnHitSparkle(this.hero.position.x, 0.5, this.hero.position.z, 0x60a5fa, 8);
  }

  // SQUAD TACTICS & SKILLS
  public setFormation(mode: FormationMode) {
    this.formationMode = mode;
  }

  public triggerSquadSkill(index: number) {
    const member = this.squad[index];
    if (!member || !member.isUnlocked || member.skill.currentCooldown > 0) return;

    member.skill.currentCooldown = member.skill.cooldown;

    if (member.typeId === 'valerie') {
      // Shield Charge & Taunt
      soundManager.playHeroSlash();
      const nearest = this.getNearestEnemy(member.position);
      if (nearest) {
        member.position.x = nearest.position.x - 1;
        member.position.z = nearest.position.z;
        this.vfx.spawnExplosion(member.position.x, 0, member.position.z, 4.0, 0x3b82f6);
        this.triggerScreenShake(0.4, 0.25);

        // Taunt nearby enemies to Valerie
        this.enemies.forEach(e => {
          const dist = Math.hypot(e.position.x - member.position.x, e.position.z - member.position.z);
          if (dist < 8) {
            e.targetType = 'squad';
            e.targetId = member.id;
            this.damageEnemy(e, Math.round(member.stats.attack * 2.0), false, 'squad');
          }
        });
      }
    } else if (member.typeId === 'lyra') {
      // Rain of Arrows
      soundManager.playArrowShoot();
      const targetPos = this.getClusterEnemyPosition() || { x: 0, z: 12 };
      this.vfx.spawnExplosion(targetPos.x, 0, targetPos.z, 6.0, 0x10b981);

      // Rain 12 arrows
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          const offsetX = (Math.random() - 0.5) * 6;
          const offsetZ = (Math.random() - 0.5) * 6;
          this.spawnProjectile({
            id: 'arrow_' + Math.random(),
            sourceType: 'squad',
            sourceId: member.id,
            position: { x: targetPos.x + offsetX, z: targetPos.z + offsetZ - 8 },
            height: 12,
            velocity: { x: 0, z: 8 },
            vertVelocity: -15,
            targetPos: { x: targetPos.x + offsetX, z: targetPos.z + offsetZ },
            damage: Math.round(member.stats.attack * 1.4),
            isCrit: true,
            splashRadius: 1.8,
            piercing: false,
            pierceCount: 0,
            color: '#10b981',
            type: 'arrow',
            lifetime: 0,
            maxLifetime: 1.5
          });
        }, i * 50);
      }
    } else if (member.typeId === 'ignis') {
      // Cataclysmic Meteor
      soundManager.playMeteorStrike();
      const targetPos = this.getClusterEnemyPosition() || { x: 0, z: 10 };
      this.vfx.spawnExplosion(targetPos.x, 0, targetPos.z, 7.0, 0xef4444);
      this.triggerScreenShake(0.8, 0.4);

      this.enemies.forEach(e => {
        const dist = Math.hypot(e.position.x - targetPos.x, e.position.z - targetPos.z);
        if (dist <= 7.0) {
          const dmg = Math.round(member.stats.attack * 3.5);
          this.damageEnemy(e, dmg, true, 'squad');
          e.statusEffects.push({
            type: 'burn',
            duration: 4.0,
            potency: 25,
            tickRate: 0.5,
            tickTimer: 0,
            color: '#ef4444'
          });
        }
      });
    } else if (member.typeId === 'astrid') {
      // Divine Storm & Heal
      soundManager.playLightning();
      soundManager.playHealSpell();
      this.vfx.spawnHolyAura(0, 0);

      // Chain lightning 6 enemies
      const candidates = [...this.enemies].slice(0, 6);
      candidates.forEach(e => {
        this.vfx.spawnHitSparkle(e.position.x, 1.5, e.position.z, 0x38bdf8, 15);
        this.damageEnemy(e, Math.round(member.stats.attack * 2.4), true, 'squad');
      });

      // Heal all allies & village
      this.village.hp = Math.min(this.village.maxHp, this.village.hp + 120);
      this.callbacks.onVillageHpChange(this.village.hp, this.village.maxHp);
      this.hero.stats.hp = Math.min(this.hero.stats.maxHp, this.hero.stats.hp + 120);
      this.callbacks.onHeroHpChange(this.hero.stats.hp, this.hero.stats.maxHp, this.hero.shield);
      this.squad.forEach(m => (m.stats.hp = Math.min(m.stats.maxHp, m.stats.hp + 120)));
    } else if (member.typeId === 'krom') {
      // Mortar Barrage
      soundManager.playMeteorStrike();
      const targetPos = this.getClusterEnemyPosition() || { x: 0, z: 12 };

      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const rx = targetPos.x + (Math.random() - 0.5) * 5;
          const rz = targetPos.z + (Math.random() - 0.5) * 5;
          this.vfx.spawnExplosion(rx, 0, rz, 4.0, 0xeab308);
          this.triggerScreenShake(0.4, 0.2);

          this.enemies.forEach(e => {
            if (Math.hypot(e.position.x - rx, e.position.z - rz) < 4.0) {
              this.damageEnemy(e, Math.round(member.stats.attack * 1.8), true, 'squad');
            }
          });
        }, i * 120);
      }
    } else if (member.typeId === 'zephyr') {
      // Shadow Flurry
      soundManager.playHeroSlash();
      const targetList = [...this.enemies].slice(0, 8);
      targetList.forEach((e, idx) => {
        setTimeout(() => {
          this.vfx.spawnHitSparkle(e.position.x, 1.0, e.position.z, 0xa855f7, 10);
          this.damageEnemy(e, Math.round(member.stats.attack * 3.0), true, 'squad');
        }, idx * 60);
      });
    }

    this.callbacks.onSquadUpdate(this.squad);
  }

  private updateSquad(delta: number) {
    this.squad.forEach((member, index) => {
      // Cooldown timer
      if (member.skill.currentCooldown > 0) {
        member.skill.currentCooldown = Math.max(0, member.skill.currentCooldown - delta);
      }
      if (member.attackCooldown > 0) {
        member.attackCooldown -= delta;
      }

      // Determine Target Position based on Formation
      let targetX = this.hero.position.x;
      let targetZ = this.hero.position.z;

      if (this.formationMode === 'follow') {
        // Wedge formation around hero
        const angle = this.hero.rotation + Math.PI + (index % 2 === 0 ? 1 : -1) * (0.5 + Math.floor(index / 2) * 0.4);
        const dist = 2.5 + Math.floor(index / 2) * 1.2;
        targetX = this.hero.position.x + Math.sin(angle) * dist;
        targetZ = this.hero.position.z + Math.cos(angle) * dist;
      } else if (this.formationMode === 'defend_village') {
        // Circle around Village Core
        const angle = (index / this.squad.length) * Math.PI * 2;
        targetX = Math.sin(angle) * 5.5;
        targetZ = Math.cos(angle) * 5.5;
      } else if (this.formationMode === 'assault') {
        // Move towards nearest enemies
        const nearest = this.getNearestEnemy(member.position);
        if (nearest) {
          targetX = nearest.position.x * 0.8;
          targetZ = nearest.position.z * 0.8;
        }
      }

      // Move toward target position
      const dx = targetX - member.position.x;
      const dz = targetZ - member.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.4) {
        const moveStep = Math.min(dist, member.stats.moveSpeed * delta);
        member.position.x += (dx / dist) * moveStep;
        member.position.z += (dz / dist) * moveStep;
        member.state = 'moving';
        member.animTimer += delta * 10;
      } else {
        member.state = 'idle';
        member.animTimer += delta * 2;
      }

      // Auto-Attack nearest enemy within range
      const targetEnemy = this.getNearestEnemy(member.position);
      if (targetEnemy && member.attackCooldown <= 0) {
        const enemyDist = Math.hypot(targetEnemy.position.x - member.position.x, targetEnemy.position.z - member.position.z);
        if (enemyDist <= member.stats.attackRange) {
          member.attackCooldown = 1.0 / member.stats.attackSpeed;
          this.executeSquadAutoAttack(member, targetEnemy);
        }
      }

      // Update 3D Mesh
      const mesh = (member as any).modelMesh as CharacterMeshGroup;
      if (mesh) {
        mesh.position.set(member.position.x, 0, member.position.z);
        if (targetEnemy) {
          mesh.rotation.y = Math.atan2(targetEnemy.position.x - member.position.x, targetEnemy.position.z - member.position.z);
        } else if (dist > 0.1) {
          mesh.rotation.y = Math.atan2(dx, dz);
        }

        // Leg walk animation
        if (mesh.userData.leftLeg && mesh.userData.rightLeg) {
          const legAngle = member.state === 'moving' ? Math.sin(member.animTimer) * 0.6 : 0;
          mesh.userData.leftLeg.rotation.x = legAngle;
          mesh.userData.rightLeg.rotation.x = -legAngle;
        }
      }
    });
  }

  private executeSquadAutoAttack(member: SquadMember, enemy: Enemy) {
    if (member.typeId === 'valerie') {
      // Melee strike
      soundManager.playEnemyHit();
      this.vfx.spawnHitSparkle(enemy.position.x, 1.0, enemy.position.z, 0x3b82f6, 6);
      this.damageEnemy(enemy, member.stats.attack, Math.random() < member.stats.critChance, 'squad');
    } else if (member.typeId === 'lyra') {
      // Shoot arrow projectile
      soundManager.playArrowShoot();
      this.spawnProjectile({
        id: 'arrow_' + Math.random(),
        sourceType: 'squad',
        sourceId: member.id,
        position: { x: member.position.x, z: member.position.z },
        height: 1.2,
        velocity: {
          x: (enemy.position.x - member.position.x) * 3.5,
          z: (enemy.position.z - member.position.z) * 3.5
        },
        vertVelocity: 0,
        targetPos: { x: enemy.position.x, z: enemy.position.z },
        damage: member.stats.attack,
        isCrit: Math.random() < member.stats.critChance,
        splashRadius: 0,
        piercing: false,
        pierceCount: 0,
        color: '#10b981',
        type: 'arrow',
        lifetime: 0,
        maxLifetime: 1.2
      });
    } else if (member.typeId === 'ignis') {
      // Shoot Fireball
      soundManager.playFireball();
      this.spawnProjectile({
        id: 'fireball_' + Math.random(),
        sourceType: 'squad',
        sourceId: member.id,
        position: { x: member.position.x, z: member.position.z },
        height: 1.2,
        velocity: {
          x: (enemy.position.x - member.position.x) * 2.8,
          z: (enemy.position.z - member.position.z) * 2.8
        },
        vertVelocity: 0,
        targetPos: { x: enemy.position.x, z: enemy.position.z },
        damage: member.stats.attack,
        isCrit: Math.random() < member.stats.critChance,
        splashRadius: 2.2,
        piercing: false,
        pierceCount: 0,
        color: '#f97316',
        type: 'fireball',
        lifetime: 0,
        maxLifetime: 1.4
      });
    } else if (member.typeId === 'astrid') {
      // Holy Light Bolt
      soundManager.playLightning();
      this.vfx.spawnHitSparkle(enemy.position.x, 1.2, enemy.position.z, 0x38bdf8, 8);
      this.damageEnemy(enemy, member.stats.attack, Math.random() < member.stats.critChance, 'squad');
    } else if (member.typeId === 'krom') {
      // Grenade
      soundManager.playFireball();
      this.spawnProjectile({
        id: 'grenade_' + Math.random(),
        sourceType: 'squad',
        sourceId: member.id,
        position: { x: member.position.x, z: member.position.z },
        height: 1.0,
        velocity: {
          x: (enemy.position.x - member.position.x) * 2.2,
          z: (enemy.position.z - member.position.z) * 2.2
        },
        vertVelocity: 4.0,
        targetPos: { x: enemy.position.x, z: enemy.position.z },
        damage: member.stats.attack,
        isCrit: Math.random() < member.stats.critChance,
        splashRadius: 3.0,
        piercing: false,
        pierceCount: 0,
        color: '#eab308',
        type: 'grenade',
        lifetime: 0,
        maxLifetime: 1.2
      });
    } else if (member.typeId === 'zephyr') {
      // Backstab melee
      soundManager.playHeroSlash();
      this.vfx.spawnHitSparkle(enemy.position.x, 1.0, enemy.position.z, 0xa855f7, 8);
      this.damageEnemy(enemy, member.stats.attack * 1.5, true, 'squad');
    }
  }

  // ENEMY SPAWNING & COMBAT
  private updateWaveSpawner(delta: number) {
    if (!this.currentScenario) return;
    this.waveTimeElapsed += delta;

    // Check enemy definitions
    this.currentScenario.enemies.forEach(group => {
      if (this.waveTimeElapsed >= group.delay) {
        const timeSinceStart = this.waveTimeElapsed - group.delay;
        const totalSpawnedSoFar = Math.floor(timeSinceStart / group.interval);
        const shouldHaveSpawned = Math.min(group.count, totalSpawnedSoFar);

        // Track how many we spawned for this group using a custom property
        const spawnedKey = `spawned_${group.type}`;
        const currentlySpawned = (this.currentScenario as any)[spawnedKey] || 0;

        if (currentlySpawned < shouldHaveSpawned) {
          const toSpawn = shouldHaveSpawned - currentlySpawned;
          for (let i = 0; i < toSpawn; i++) {
            this.spawnEnemy(group.type, false);
            (this.currentScenario as any)[spawnedKey] = currentlySpawned + 1 + i;
            this.waveEnemiesSpawnedCount++;
          }
        }
      }
    });

    // Boss Spawn
    if (this.currentScenario.boss && !(this.currentScenario as any).bossSpawned) {
      if (this.waveTimeElapsed >= this.currentScenario.boss.spawnDelay) {
        (this.currentScenario as any).bossSpawned = true;
        this.spawnEnemy(this.currentScenario.boss.type, true);
        this.waveEnemiesSpawnedCount++;
        soundManager.playBattleHorn();
        this.spawnFloatingText('¡ALERTA DE JEFE!', { x: 0, z: 16 }, '#ef4444', 3.0, true);
        this.triggerScreenShake(1.0, 0.6);
      }
    }

    // Check Victory
    const allSpawned = this.waveEnemiesSpawnedCount >= this.waveTotalEnemiesToSpawn;
    const allDead = this.enemies.length === 0;

    if (allSpawned && allDead && this.isWaveActive) {
      this.onWaveVictory();
    }

    this.callbacks.onWaveProgress(
      this.waveTotalEnemiesToSpawn - this.totalKills,
      this.waveTotalEnemiesToSpawn,
      !!(this.currentScenario as any).bossSpawned
    );
  }

  public spawnEnemy(type: any, isBoss: boolean = false) {
    // Spawn around outer ring
    const angle = Math.random() * Math.PI * 2;
    const spawnRadius = 24 + Math.random() * 6;
    const px = Math.cos(angle) * spawnRadius;
    const pz = Math.sin(angle) * spawnRadius;

    let baseHp = 90;
    let baseAtk = 18;
    let baseSpeed = 3.2;
    let goldReward = 15;

    if (type === 'goblin_runner') {
      baseHp = 60;
      baseAtk = 12;
      baseSpeed = 4.8;
      goldReward = 10;
    } else if (type === 'orc_warrior') {
      baseHp = 140;
      baseAtk = 24;
      baseSpeed = 3.0;
      goldReward = 20;
    } else if (type === 'skeleton_archer') {
      baseHp = 80;
      baseAtk = 22;
      baseSpeed = 2.8;
      goldReward = 18;
    } else if (type === 'dark_mage') {
      baseHp = 110;
      baseAtk = 32;
      baseSpeed = 2.6;
      goldReward = 28;
    } else if (type === 'siege_troll') {
      baseHp = 450;
      baseAtk = 55;
      baseSpeed = 1.8;
      goldReward = 60;
    } else if (type === 'flying_gargoyle') {
      baseHp = 130;
      baseAtk = 28;
      baseSpeed = 3.8;
      goldReward = 25;
    }

    if (isBoss) {
      baseHp = 2200 + this.currentWaveIndex * 800;
      baseAtk = 65 + this.currentWaveIndex * 15;
      baseSpeed = 2.4;
      goldReward = 300 + this.currentWaveIndex * 100;
    }

    // Scale with wave number
    const waveMult = 1.0 + (this.currentWaveIndex - 1) * 0.25;
    const enemy: Enemy = {
      id: 'enemy_' + Math.random(),
      type,
      name: isBoss ? 'GRAN JEFE' : type.replace('_', ' ').toUpperCase(),
      nameEn: isBoss ? 'BOSS' : type,
      isBoss,
      isElite: false,
      position: { x: px, z: pz },
      stats: {
        hp: Math.round(baseHp * waveMult),
        maxHp: Math.round(baseHp * waveMult),
        attack: Math.round(baseAtk * waveMult),
        defense: 10,
        moveSpeed: baseSpeed,
        attackSpeed: 1.0,
        attackRange: type === 'skeleton_archer' || type === 'dark_mage' ? 9.0 : 2.2,
        critChance: 0.1
      },
      targetType: Math.random() > 0.4 ? 'village' : 'hero',
      state: 'moving',
      animTimer: 0,
      attackCooldown: 0,
      specialCooldown: 5.0,
      goldReward,
      color: isBoss ? '#ef4444' : '#64748b',
      size: isBoss ? 2.5 : 1.0,
      statusEffects: []
    };

    const mesh = createEnemyModel(type, isBoss);
    mesh.position.set(px, 0, pz);
    this.scene.add(mesh);
    (enemy as any).modelMesh = mesh;

    this.enemies.push(enemy);
  }

  private updateEnemies(delta: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Update status effects (burn, poison, stun)
      let isStunned = false;
      for (let sIdx = enemy.statusEffects.length - 1; sIdx >= 0; sIdx--) {
        const effect = enemy.statusEffects[sIdx];
        effect.duration -= delta;

        if (effect.type === 'stun') isStunned = true;
        if (effect.type === 'burn' || effect.type === 'poison') {
          effect.tickTimer = (effect.tickTimer || 0) + delta;
          if (effect.tickTimer >= (effect.tickRate || 0.5)) {
            effect.tickTimer = 0;
            this.damageEnemy(enemy, effect.potency, false, 'squad', false);
          }
        }

        if (effect.duration <= 0) {
          enemy.statusEffects.splice(sIdx, 1);
        }
      }

      if (isStunned) {
        enemy.state = 'stunned';
        continue;
      }

      if (enemy.attackCooldown > 0) enemy.attackCooldown -= delta;

      // Determine Target (Village Center or Hero)
      let targetX = 0;
      let targetZ = 0;

      if (enemy.targetType === 'hero') {
        targetX = this.hero.position.x;
        targetZ = this.hero.position.z;
      } else if (enemy.targetType === 'squad' && enemy.targetId) {
        const squadTarget = this.squad.find(s => s.id === enemy.targetId);
        if (squadTarget) {
          targetX = squadTarget.position.x;
          targetZ = squadTarget.position.z;
        } else {
          enemy.targetType = 'village';
        }
      }

      const dx = targetX - enemy.position.x;
      const dz = targetZ - enemy.position.z;
      const dist = Math.hypot(dx, dz);

      // If close enough to attack
      if (dist <= enemy.stats.attackRange) {
        enemy.state = 'attacking';
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 1.0 / enemy.stats.attackSpeed;
          this.executeEnemyAttack(enemy);
        }
      } else {
        // Move towards target
        enemy.state = 'moving';
        const speed = enemy.stats.moveSpeed;
        enemy.position.x += (dx / dist) * speed * delta;
        enemy.position.z += (dz / dist) * speed * delta;
        enemy.animTimer += delta * 8;
      }

      // Update 3D Mesh
      const mesh = (enemy as any).modelMesh as CharacterMeshGroup;
      if (mesh) {
        mesh.position.set(enemy.position.x, 0, enemy.position.z);
        mesh.rotation.y = Math.atan2(dx, dz);

        // Flapping wings for gargoyles
        if (mesh.userData.wings) {
          const wingAngle = Math.sin(enemy.animTimer * 2) * 0.5;
          mesh.userData.wings[0].rotation.z = wingAngle;
          mesh.userData.wings[1].rotation.z = -wingAngle;
        }

        // Leg walk animation
        if (mesh.userData.leftLeg && mesh.userData.rightLeg) {
          const legAngle = enemy.state === 'moving' ? Math.sin(enemy.animTimer) * 0.7 : 0;
          mesh.userData.leftLeg.rotation.x = legAngle;
          mesh.userData.rightLeg.rotation.x = -legAngle;
        }
      }
    }
  }

  private executeEnemyAttack(enemy: Enemy) {
    if (enemy.targetType === 'village') {
      // Attack Village Core
      soundManager.playEnemyHit();
      this.village.hp = Math.max(0, this.village.hp - enemy.stats.attack);
      this.village.damageFlashTimer = 0.2;
      this.callbacks.onVillageHpChange(this.village.hp, this.village.maxHp);
      this.vfx.spawnHitSparkle(0, 1.5, 0, 0xef4444, 8);

      if (this.village.hp <= 0) {
        this.onGameOver(false);
      }
    } else if (enemy.targetType === 'hero') {
      // Attack Hero Commander
      if (this.hero.isDashing) return; // i-frames!
      soundManager.playEnemyHit();
      const dmg = enemy.stats.attack;

      if (this.hero.shield > 0) {
        this.hero.shield = Math.max(0, this.hero.shield - dmg);
      } else {
        this.hero.stats.hp = Math.max(0, this.hero.stats.hp - dmg);
      }

      this.callbacks.onHeroHpChange(this.hero.stats.hp, this.hero.stats.maxHp, this.hero.shield);
      this.vfx.spawnHitSparkle(this.hero.position.x, 1.2, this.hero.position.z, 0xef4444, 10);
      this.triggerScreenShake(0.3, 0.2);

      if (this.hero.stats.hp <= 0) {
        // Check Phoenix Relic auto-revive
        const phoenix = this.activeRelics.find(r => r.effectType === 'revive_token' && r.purchased);
        if (phoenix) {
          phoenix.purchased = false; // Consume revive
          this.hero.stats.hp = this.hero.stats.maxHp;
          this.callbacks.onHeroHpChange(this.hero.stats.hp, this.hero.stats.maxHp, this.hero.shield);
          this.vfx.spawnHolyAura(this.hero.position.x, this.hero.position.z);
          this.spawnFloatingText('¡PLUMA DE FÉNIX ACTIVADA!', { x: this.hero.position.x, z: this.hero.position.z }, '#facc15', 2.5, true);
        } else {
          this.onGameOver(false);
        }
      }
    } else if (enemy.targetType === 'squad' && enemy.targetId) {
      const squadTarget = this.squad.find(s => s.id === enemy.targetId);
      if (squadTarget) {
        squadTarget.stats.hp = Math.max(0, squadTarget.stats.hp - enemy.stats.attack);
        this.vfx.spawnHitSparkle(squadTarget.position.x, 1.0, squadTarget.position.z, 0xef4444, 6);
        this.callbacks.onSquadUpdate(this.squad);
      }
    }
  }

  public damageEnemy(enemy: Enemy, damage: number, isCrit: boolean = false, source: 'hero' | 'squad' = 'hero', spawnSparkles: boolean = true) {
    if (enemy.stats.hp <= 0) return;

    enemy.stats.hp -= damage;
    this.totalDamage += damage;

    // Combo system
    this.comboCount++;
    this.comboTimer = 2.5;
    this.callbacks.onComboChange(this.comboCount);

    if (spawnSparkles) {
      const sparkleColor = isCrit ? 0xf59e0b : source === 'hero' ? 0x93c5fd : 0x34d399;
      this.vfx.spawnHitSparkle(enemy.position.x, 1.0, enemy.position.z, sparkleColor, isCrit ? 14 : 6);
    }

    this.spawnFloatingText(
      `${isCrit ? 'CRIT! ' : ''}${damage}`,
      { x: enemy.position.x, z: enemy.position.z },
      isCrit ? '#f59e0b' : '#ffffff',
      isCrit ? 1.6 : 1.1,
      isCrit
    );

    // Enemy Death Check
    if (enemy.stats.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: Enemy) {
    soundManager.playEnemyDeath();
    this.totalKills++;
    this.vfx.spawnExplosion(enemy.position.x, 0, enemy.position.z, enemy.isBoss ? 5.0 : 2.0, 0xfacc15);

    // Gold reward calculation with Midas relic
    let goldGain = enemy.goldReward;
    const midas = this.activeRelics.find(r => r.effectType === 'gold_multiplier' && r.purchased);
    if (midas) goldGain = Math.round(goldGain * (1.0 + midas.value));

    this.gold += goldGain;
    this.callbacks.onGoldGain(this.gold);
    soundManager.playCoin();

    // Remove 3D Mesh
    if ((enemy as any).modelMesh) {
      this.scene.remove((enemy as any).modelMesh);
    }

    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
  }

  // PROJECTILES SYSTEM
  public spawnProjectile(p: Projectile) {
    // 3D mesh for projectile
    let mesh: THREE.Mesh;
    if (p.type === 'arrow') {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 4), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      mesh.rotation.x = Math.PI / 2;
    } else if (p.type === 'fireball') {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    } else if (p.type === 'grenade') {
      mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0xeab308 }));
    } else {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    }

    mesh.position.set(p.position.x, p.height, p.position.z);
    this.scene.add(mesh);
    p.modelMesh = mesh;

    this.projectiles.push(p);
  }

  private updateProjectiles(delta: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime += delta;

      if (p.lifetime >= p.maxLifetime) {
        if (p.modelMesh) this.scene.remove(p.modelMesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      p.position.x += p.velocity.x * delta;
      p.position.z += p.velocity.z * delta;
      p.height += p.vertVelocity * delta;

      if (p.modelMesh) {
        p.modelMesh.position.set(p.position.x, Math.max(0.2, p.height), p.position.z);
      }

      // Check collision with enemies
      for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
        const enemy = this.enemies[eIdx];
        const dist = Math.hypot(enemy.position.x - p.position.x, enemy.position.z - p.position.z);

        if (dist <= (p.splashRadius > 0 ? p.splashRadius : 1.4)) {
          if (p.splashRadius > 0) {
            this.vfx.spawnExplosion(p.position.x, 0, p.position.z, p.splashRadius, 0xf97316);
            this.enemies.forEach(e => {
              if (Math.hypot(e.position.x - p.position.x, e.position.z - p.position.z) <= p.splashRadius) {
                this.damageEnemy(e, p.damage, p.isCrit, p.sourceType === 'hero' ? 'hero' : 'squad');
              }
            });
          } else {
            this.damageEnemy(enemy, p.damage, p.isCrit, p.sourceType === 'hero' ? 'hero' : 'squad');
          }

          if (p.modelMesh) this.scene.remove(p.modelMesh);
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  // VILLAGE DEFENSE
  private updateVillage(delta: number) {
    // Village Core Turret Auto-defense
    this.village.turretCooldown -= delta;
    if (this.village.turretCooldown <= 0 && this.enemies.length > 0) {
      this.village.turretCooldown = 2.0;
      const target = this.getNearestEnemy({ x: 0, z: 0 });
      if (target && Math.hypot(target.position.x, target.position.z) < 16) {
        soundManager.playArrowShoot();
        this.spawnProjectile({
          id: 'turret_' + Math.random(),
          sourceType: 'turret',
          sourceId: 'village',
          position: { x: 0, z: 0 },
          height: 4.0,
          velocity: {
            x: (target.position.x) * 2.5,
            z: (target.position.z) * 2.5
          },
          vertVelocity: 0,
          targetPos: { x: target.position.x, z: target.position.z },
          damage: 50 * this.village.turretLevel,
          isCrit: false,
          splashRadius: 0,
          piercing: false,
          pierceCount: 0,
          color: '#f59e0b',
          type: 'turret_bolt',
          lifetime: 0,
          maxLifetime: 1.5
        });
      }
    }
  }

  private updateRelics(delta: number) {
    // Yggdrasil Heart regen
    const heart = this.activeRelics.find(r => r.effectType === 'village_regen' && r.purchased);
    if (heart && this.village.hp < this.village.maxHp) {
      this.village.hp = Math.min(this.village.maxHp, this.village.hp + delta * 5);
      this.callbacks.onVillageHpChange(this.village.hp, this.village.maxHp);
    }
  }

  // FLOATING TEXTS
  public spawnFloatingText(text: string, pos: { x: number; z: number }, color: string = '#ffffff', fontSize: number = 1.0, isCrit: boolean = false) {
    this.floatingTexts.push({
      id: 'text_' + Math.random(),
      text,
      position: { x: pos.x, z: pos.z },
      height: 1.8,
      color,
      lifetime: 0,
      maxLifetime: 1.2,
      fontSize,
      isCrit
    });
  }

  private updateFloatingTexts(delta: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.lifetime += delta;
      ft.height += delta * 1.5;
      if (ft.lifetime >= ft.maxLifetime) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // HELPERS
  private getNearestEnemy(pos: { x: number; z: number }): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;
    this.enemies.forEach(e => {
      const d = Math.hypot(e.position.x - pos.x, e.position.z - pos.z);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    });
    return nearest;
  }

  private getClusterEnemyPosition(): { x: number; z: number } | null {
    if (this.enemies.length === 0) return null;
    let sumX = 0;
    let sumZ = 0;
    this.enemies.forEach(e => {
      sumX += e.position.x;
      sumZ += e.position.z;
    });
    return {
      x: sumX / this.enemies.length,
      z: sumZ / this.enemies.length
    };
  }

  private onWaveVictory() {
    this.isWaveActive = false;
    soundManager.playVictoryFanfare();
    const goldBonus = this.currentScenario?.totalGoldReward || 300;
    this.gold += goldBonus;
    this.callbacks.onGoldGain(this.gold);
    this.callbacks.onWaveComplete(this.currentWaveIndex, goldBonus);
  }

  private onGameOver(victory: boolean) {
    this.isWaveActive = false;
    if (!victory) {
      soundManager.playDefeatSound();
    }
    this.callbacks.onGameOver(victory, {
      wavesCompleted: this.currentWaveIndex - (victory ? 0 : 1),
      totalKills: this.totalKills,
      totalDamage: this.totalDamage,
      gold: this.gold
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
