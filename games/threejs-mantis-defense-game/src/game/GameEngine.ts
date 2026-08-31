import * as THREE from 'three';
import { GameState, PlayerStats, NestStats, Cooldowns, ActiveBuffs, GameSummary, UpgradeOption, EnemyInstance } from '../types/game';
import { INITIAL_PLAYER_STATS, INITIAL_NEST_STATS, ARENA_RADIUS, UPGRADES_LIST, getWaveData } from './constants';
import { MantisModel } from './MantisModel';
import { NestModel } from './NestModel';
import { Environment } from './Environment';
import { EnemyManager } from './EnemyManager';
import { CombatSystem } from './CombatSystem';
import { soundManager } from '../audio/SoundManager';
import confetti from 'canvas-confetti';

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;

  // Game Systems
  public mantis: MantisModel;
  public nest: NestModel;
  public environment: Environment;
  public enemyManager: EnemyManager;
  public combatSystem: CombatSystem;

  // Game State
  public state: GameState = 'MENU';
  public currentWaveNumber: number = 1;
  public totalEnemiesInWave: number = 0;
  public enemiesRemainingInWave: number = 0;
  public waveTimer: number = 0;
  public waveStatusText: string = '';

  // Player & Nest Data
  public playerStats: PlayerStats = { ...INITIAL_PLAYER_STATS };
  public nestStats: NestStats = { ...INITIAL_NEST_STATS };
  public playerPosition = new THREE.Vector3(0, 0.4, 5);
  public playerVelocity = new THREE.Vector3();
  public lookDirection = new THREE.Vector3(0, 0, -1);
  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public dashDuration: number = 0.22;
  public dashDirection = new THREE.Vector3();
  
  // Leap Ability State
  public isLeaping: boolean = false;
  public leapTimer: number = 0;
  public leapDuration: number = 0.55;
  public leapStartPos = new THREE.Vector3();
  public leapTargetPos = new THREE.Vector3();

  // Attack combo tracking
  private comboStep: number = 0;
  private comboResetTimer: number = 0;

  // Cooldowns & Active Buffs
  public cooldowns: Cooldowns = {
    melee: 0,
    acid: 0,
    dash: 0,
    leap: 0,
    frenzy: 0,
    screech: 0,
    nestPulse: 0
  };

  public activeBuffs: ActiveBuffs = {
    frenzy: 0,
    stealth: 0,
    damageBoost: 0,
    speedBoost: 0
  };

  // Upgrades
  public upgrades: UpgradeOption[] = JSON.parse(JSON.stringify(UPGRADES_LIST));

  // Battle Summary Statistics
  public summary: GameSummary = {
    wavesCleared: 0,
    enemiesKilled: 0,
    killsByType: {},
    totalDamageDealt: 0,
    biomassCollected: 0,
    timeSurvived: 0,
    victory: false,
    reason: ''
  };

  // Input state
  public keys: Record<string, boolean> = {};
  public mousePos = new THREE.Vector2();
  public mouseGroundPoint = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Camera settings
  private cameraTarget = new THREE.Vector3();
  private cameraOffset = new THREE.Vector3(0, 24, 18);
  private cameraShakeIntensity: number = 0;

  // Sentry auto-fire timer
  private sentryFireTimer: number = 0;

  // React Callbacks
  public onStateChange?: (state: GameState) => void;
  public onStatsUpdate?: () => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 300);
    this.camera.position.set(0, 24, 18);
    this.camera.lookAt(0, 0, 0);

    // 2. Renderer with performance optimizations
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // 3. Instantiate Subsystems
    this.environment = new Environment(this.scene);
    this.nest = new NestModel();
    this.scene.add(this.nest.group);

    this.mantis = new MantisModel();
    this.scene.add(this.mantis.group);
    this.mantis.group.position.copy(this.playerPosition);

    this.enemyManager = new EnemyManager(this.scene);
    this.combatSystem = new CombatSystem(this.scene);

    // 4. Bind listeners
    this.bindEvents();

    // 5. Start loop
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onResize = () => {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    soundManager.init(); // User gesture trigger
    const code = e.code.toLowerCase();
    this.keys[code] = true;

    if (code === 'escape' || code === 'keyp') {
      if (this.state === 'PLAYING') {
        this.setGameState('PAUSED');
      } else if (this.state === 'PAUSED') {
        this.setGameState('PLAYING');
      }
    }

    if (this.state !== 'PLAYING') return;

    if (code === 'space' || code === 'shiftleft') {
      this.triggerDash();
    } else if (code === 'keyq') {
      this.triggerLeap();
    } else if (code === 'keye') {
      this.triggerFrenzy();
    } else if (code === 'keyf') {
      this.triggerScreech();
    } else if (code === 'keyr') {
      this.triggerNestPulse();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const code = e.code.toLowerCase();
    this.keys[code] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    this.mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Raycast onto ground plane for 360-degree aiming
    this.raycaster.setFromCamera(this.mousePos, this.camera);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, hit)) {
      this.mouseGroundPoint.copy(hit);
      this.lookDirection.subVectors(hit, this.playerPosition).setY(0).normalize();
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    soundManager.init();
    if (this.state !== 'PLAYING') return;

    if (e.button === 0) {
      // Left Click: Melee Raptor Slash
      this.triggerMeleeSlash();
    } else if (e.button === 2) {
      // Right Click: Bio-Acid Spit
      this.triggerAcidSpit();
    }
  };

  // Set Game State
  public setGameState(newState: GameState) {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  // Start / Restart Game
  public startNewGame() {
    soundManager.init();
    this.currentWaveNumber = 1;
    this.playerStats = { ...INITIAL_PLAYER_STATS };
    this.nestStats = { ...INITIAL_NEST_STATS };
    this.playerPosition.set(0, 0.4, 6);
    this.mantis.group.position.copy(this.playerPosition);

    this.cooldowns = { melee: 0, acid: 0, dash: 0, leap: 0, frenzy: 0, screech: 0, nestPulse: 0 };
    this.activeBuffs = { frenzy: 0, stealth: 0, damageBoost: 0, speedBoost: 0 };

    this.upgrades = JSON.parse(JSON.stringify(UPGRADES_LIST));
    this.summary = {
      wavesCleared: 0,
      enemiesKilled: 0,
      killsByType: {},
      totalDamageDealt: 0,
      biomassCollected: 0,
      timeSurvived: 0,
      victory: false,
      reason: ''
    };

    this.enemyManager.clearAll();
    this.combatSystem.clearAll();
    this.nest.updateSentries(0);

    this.startWave(this.currentWaveNumber);
    this.setGameState('PLAYING');
  }

  // Start Wave
  public startWave(waveNum: number) {
    this.currentWaveNumber = waveNum;
    const waveDef = getWaveData(waveNum);

    this.environment.setEnvironmentMood(waveDef.environmentMood);
    soundManager.setWaveIntensity(Math.min(5, Math.ceil(waveNum / 2)));

    if (waveDef.bossType) {
      soundManager.playBossSpawn();
      this.addScreenShake(0.8);
    }

    // Build spawn queue
    const queue: { type: any; delay: number }[] = [];
    const totalEnemies = waveDef.totalEnemies;
    this.totalEnemiesInWave = totalEnemies + (waveDef.bossType ? 1 : 0);
    this.enemiesRemainingInWave = this.totalEnemiesInWave;

    for (let i = 0; i < totalEnemies; i++) {
      // Pick type from weights
      const rand = Math.random();
      let cum = 0;
      let chosenType = waveDef.composition[0].type;
      for (const comp of waveDef.composition) {
        cum += comp.weight;
        if (rand <= cum) {
          chosenType = comp.type;
          break;
        }
      }
      queue.push({
        type: chosenType,
        delay: waveDef.spawnInterval * (0.6 + Math.random() * 0.8)
      });
    }

    // Insert Boss in the middle or end
    if (waveDef.bossType) {
      queue.splice(Math.floor(queue.length * 0.3), 0, {
        type: waveDef.bossType,
        delay: 0.5
      });
    }

    this.enemyManager.prepareWave(queue);
    this.waveStatusText = `OLEADA ${waveNum}: ${waveDef.title}`;
  }

  // --- PLAYER COMBAT ABILITIES ---

  public triggerMeleeSlash() {
    if (this.cooldowns.melee > 0) return;

    this.cooldowns.melee = 1.0 / (this.playerStats.attackSpeed * (this.activeBuffs.frenzy > 0 ? 1.8 : 1.0));
    this.comboStep = (this.comboStep + 1) % 3;
    this.comboResetTimer = 0.8;

    // Trigger visual slash pose
    const slashAnim = this.comboStep === 0 ? 'slash1' : (this.comboStep === 1 ? 'slash2' : 'dual');
    this.mantis.triggerAttack(slashAnim);
    soundManager.playSlash(this.comboStep);

    // Check hit cone
    const dmg = this.playerStats.meleeDamage * (this.activeBuffs.frenzy > 0 ? 1.5 : 1.0);
    const range = this.playerStats.meleeRange;
    const arc = Math.PI / 2.2; // 80 degree cone

    const result = this.combatSystem.checkMeleeCone(
      this.playerPosition,
      this.lookDirection,
      range,
      arc,
      dmg,
      this.playerStats.critChance,
      this.playerStats.critMultiplier,
      this.enemyManager.enemies,
      (enemy, damage, isCrit) => this.onEnemyHit(enemy, damage, isCrit)
    );

    if (result.hits > 0) {
      this.addScreenShake(0.12);
      // Life leech
      if (this.playerStats.lifeLeech > 0) {
        const heal = result.totalDamage * this.playerStats.lifeLeech;
        this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + heal);
      }
    }
  }

  public triggerAcidSpit() {
    if (this.cooldowns.acid > 0) return;
    this.cooldowns.acid = this.playerStats.acidCooldown;

    soundManager.playAcidShoot();

    const spawnPos = this.playerPosition.clone().add(new THREE.Vector3(0, 1.8, 0)).addScaledVector(this.lookDirection, 1.2);
    const dmg = this.playerStats.acidDamage * (this.activeBuffs.frenzy > 0 ? 1.3 : 1.0);

    this.combatSystem.spawnProjectile(
      true,
      'acid',
      spawnPos,
      this.lookDirection,
      36.0,
      dmg,
      this.playerStats.acidSplashRadius,
      'poison',
      4.0
    );
  }

  public triggerDash() {
    if (this.cooldowns.dash > 0 || this.isDashing || this.isLeaping) return;
    this.cooldowns.dash = this.playerStats.dashCooldown;
    this.isDashing = true;
    this.dashTimer = 0;

    // Dash in movement direction or facing direction
    if (this.playerVelocity.lengthSq() > 0.01) {
      this.dashDirection.copy(this.playerVelocity).normalize();
    } else {
      this.dashDirection.copy(this.lookDirection).normalize();
    }

    soundManager.playDash();
    this.combatSystem.spawnParticleBurst(this.playerPosition, 0x86efac, 12, 'spark');
  }

  public triggerLeap() {
    if (this.cooldowns.leap > 0 || this.isLeaping) return;
    this.cooldowns.leap = this.playerStats.leapCooldown;
    this.isLeaping = true;
    this.leapTimer = 0;

    this.leapStartPos.copy(this.playerPosition);
    // Leap 12 meters forward towards mouse aim point
    this.leapTargetPos.copy(this.playerPosition).addScaledVector(this.lookDirection, 12.0);

    // Clamp inside arena
    const dist = Math.hypot(this.leapTargetPos.x, this.leapTargetPos.z);
    if (dist > ARENA_RADIUS - 2) {
      this.leapTargetPos.normalize().multiplyScalar(ARENA_RADIUS - 2);
    }

    this.mantis.triggerAttack('leap');
    soundManager.playLeap();
  }

  public triggerFrenzy() {
    if (this.cooldowns.frenzy > 0) return;
    this.cooldowns.frenzy = this.playerStats.frenzyCooldown;
    this.activeBuffs.frenzy = 6.0; // 6 seconds duration
    this.activeBuffs.stealth = 2.5; // Brief camouflage

    this.mantis.setFrenzy(true);
    this.mantis.setStealth(true);
    soundManager.playFrenzy();
    this.addScreenShake(0.3);
    this.combatSystem.spawnParticleBurst(this.playerPosition, 0xd946ef, 24, 'shockwave', 1.5);
  }

  public triggerScreech() {
    if (this.cooldowns.screech > 0) return;
    this.cooldowns.screech = this.playerStats.screechCooldown;

    soundManager.playScreech();
    this.addScreenShake(0.35);

    // Ultrasonic Stun / Fear wave (radius 18m)
    this.combatSystem.spawnParticleBurst(this.playerPosition, 0x38bdf8, 30, 'shockwave', 2.0);
    this.combatSystem.applyAoE(
      this.playerPosition,
      18.0,
      35,
      6.0,
      this.enemyManager.enemies,
      (enemy, dmg, isCrit) => this.onEnemyHit(enemy, dmg, isCrit),
      { stun: 3.2, fear: 2.0 }
    );
  }

  public triggerNestPulse() {
    if (this.cooldowns.nestPulse > 0 || this.nestStats.shield <= 0) return;
    this.cooldowns.nestPulse = this.playerStats.nestPulseCooldown;

    soundManager.playNestPulse();
    this.nest.triggerPulseWave();
    this.addScreenShake(0.45);

    const nestCenter = new THREE.Vector3(0, 0, 0);
    this.combatSystem.spawnParticleBurst(nestCenter, 0x0284c7, 36, 'shockwave', 2.2);

    // Repel all insects from nest & deal high damage
    this.combatSystem.applyAoE(
      nestCenter,
      16.0,
      90,
      12.0,
      this.enemyManager.enemies,
      (enemy, dmg, isCrit) => this.onEnemyHit(enemy, dmg, isCrit),
      { stun: 2.5, slow: 4.0 }
    );
  }

  // --- COMBAT EVENT HANDLERS ---

  private onEnemyHit(enemy: EnemyInstance, damage: number, isCrit: boolean) {
    this.summary.totalDamageDealt += damage;
    this.playerStats.score += Math.round(damage);

    enemy.stats.health -= damage;
    soundManager.playHit(isCrit, enemy.stats.size > 2.0);

    if (enemy.stats.health <= 0) {
      this.onEnemyKilled(enemy);
    }
  }

  private onEnemyKilled(enemy: EnemyInstance) {
    this.summary.enemiesKilled++;
    this.summary.killsByType[enemy.type] = (this.summary.killsByType[enemy.type] || 0) + 1;
    this.playerStats.score += enemy.stats.scoreValue;
    this.enemiesRemainingInWave = Math.max(0, this.enemiesRemainingInWave - 1);

    const idx = this.enemyManager.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemyManager.killEnemy(enemy, idx);
    }

    // Check Wave Completion
    if (this.enemiesRemainingInWave <= 0 && this.enemyManager.enemies.length === 0) {
      this.onWaveCleared();
    }
  }

  private onPlayerHit(damage: number, effect?: 'poison' | 'slow' | 'stun') {
    if (this.state !== 'PLAYING') return;

    const actualDmg = Math.max(1, damage * (1 - this.playerStats.armor));
    this.playerStats.health = Math.max(0, this.playerStats.health - actualDmg);
    this.addScreenShake(0.25);

    if (effect === 'poison') {
      // Periodic green damage
      this.combatSystem.spawnParticleBurst(this.playerPosition, 0x22c55e, 8, 'acid');
    }

    if (this.playerStats.health <= 0) {
      this.triggerGameOver('La Mantis Religiosa ha caído en combate.');
    }
  }

  private onNestHit(damage: number) {
    if (this.state !== 'PLAYING') return;

    this.nestStats.isUnderAttack = true;
    this.nestStats.attackWarningTimer = 1.2;
    soundManager.playNestAlarm();
    this.addScreenShake(0.18);

    // Damage shield first
    if (this.nestStats.shield > 0) {
      const shieldDmg = Math.min(this.nestStats.shield, damage);
      this.nestStats.shield -= shieldDmg;
      damage -= shieldDmg;
    }

    if (damage > 0) {
      this.nestStats.health = Math.max(0, this.nestStats.health - damage);
    }

    if (this.nestStats.health <= 0) {
      this.triggerGameOver('¡El Nido (Ooteca) ha sido destruido por el enjambre!');
    }
  }

  private onWaveCleared() {
    this.summary.wavesCleared = this.currentWaveNumber;
    const waveDef = getWaveData(this.currentWaveNumber);
    const reward = waveDef.rewardBiomass;

    this.playerStats.biomass += reward;
    this.playerStats.totalBiomassEarned += reward;
    this.playerStats.score += reward * 10;

    soundManager.playWaveClear();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (this.currentWaveNumber >= 10 && !this.summary.victory) {
      this.summary.victory = true;
      this.setGameState('VICTORY');
    } else {
      this.setGameState('EVOLUTION');
    }
  }

  public triggerGameOver(reason: string) {
    this.summary.reason = reason;
    this.setGameState('GAME_OVER');
  }

  public purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.find((u) => u.id === upgradeId);
    if (!upgrade || upgrade.currentLevel >= upgrade.maxLevel) return false;

    if (this.playerStats.biomass >= upgrade.cost) {
      this.playerStats.biomass -= upgrade.cost;
      upgrade.currentLevel++;

      // Apply bonus
      const bonus = upgrade.statBonus(upgrade.currentLevel - 1);
      Object.assign(this.playerStats, bonus);

      // Nest shield & sentries
      if (bonus.nestShield) {
        this.nestStats.maxShield += bonus.nestShield;
        this.nestStats.shield = this.nestStats.maxShield;
      }
      if (bonus.nestSentry !== undefined) {
        this.nestStats.sentryCount = bonus.nestSentry;
        this.nest.updateSentries(this.nestStats.sentryCount);
      }

      // Increase next tier cost
      upgrade.cost = Math.round(upgrade.cost * 1.5);
      soundManager.playPickup();
      return true;
    }
    return false;
  }

  public continueToNextWave() {
    this.startWave(this.currentWaveNumber + 1);
    this.setGameState('PLAYING');
  }

  private addScreenShake(intensity: number) {
    this.cameraShakeIntensity = Math.min(1.2, this.cameraShakeIntensity + intensity);
  }

  // --- MAIN ANIMATION / GAME LOOP ---

  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(0.06, this.clock.getDelta());

    if (this.state === 'PLAYING') {
      this.summary.timeSurvived += delta;
      this.updatePlayer(delta);
      this.updateNest(delta);
      this.updateSubsystems(delta);
    }

    this.updateCamera(delta);
    this.renderer.render(this.scene, this.camera);

    if (this.onStatsUpdate) {
      this.onStatsUpdate();
    }
  }

  private updatePlayer(delta: number) {
    // 1. Cooldown Tickers
    for (const key in this.cooldowns) {
      if ((this.cooldowns as any)[key] > 0) {
        (this.cooldowns as any)[key] = Math.max(0, (this.cooldowns as any)[key] - delta);
      }
    }

    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= delta;
      if (this.comboResetTimer <= 0) {
        this.comboStep = 0;
      }
    }

    // 2. Active Buffs
    if (this.activeBuffs.frenzy > 0) {
      this.activeBuffs.frenzy -= delta;
      if (this.activeBuffs.frenzy <= 0) {
        this.mantis.setFrenzy(false);
      }
    }

    if (this.activeBuffs.stealth > 0) {
      this.activeBuffs.stealth -= delta;
      if (this.activeBuffs.stealth <= 0) {
        this.mantis.setStealth(false);
      }
    }

    // 3. Movement Physics (WASD)
    if (this.isLeaping) {
      this.leapTimer += delta;
      const t = this.leapTimer / this.leapDuration;

      if (t >= 1) {
        this.isLeaping = false;
        this.playerPosition.copy(this.leapTargetPos);
        this.playerPosition.y = 0.4;
        soundManager.playSlam();
        this.addScreenShake(0.5);

        // Ground Smash Shockwave damage
        this.combatSystem.spawnParticleBurst(this.playerPosition, 0x86efac, 24, 'shockwave', 1.8);
        this.combatSystem.applyAoE(
          this.playerPosition,
          7.5,
          this.playerStats.meleeDamage * 1.8,
          8.0,
          this.enemyManager.enemies,
          (enemy, dmg, isCrit) => this.onEnemyHit(enemy, dmg, isCrit),
          { stun: 1.5 }
        );
      } else {
        // Parabolic Leap Arc
        this.playerPosition.lerpVectors(this.leapStartPos, this.leapTargetPos, t);
        this.playerPosition.y = 0.4 + Math.sin(t * Math.PI) * 5.0; // Jump height
      }
    } else if (this.isDashing) {
      this.dashTimer += delta;
      if (this.dashTimer >= this.dashDuration) {
        this.isDashing = false;
      } else {
        this.playerPosition.addScaledVector(this.dashDirection, this.playerStats.dashSpeed * delta);
      }
    } else {
      // Regular Walk
      const moveX = (this.keys['keyd'] || this.keys['arrowright'] ? 1 : 0) - (this.keys['keya'] || this.keys['arrowleft'] ? 1 : 0);
      const moveZ = (this.keys['keys'] || this.keys['arrowdown'] ? 1 : 0) - (this.keys['keyw'] || this.keys['arrowup'] ? 1 : 0);

      this.playerVelocity.set(moveX, 0, moveZ);
      const isMoving = this.playerVelocity.lengthSq() > 0.01;

      if (isMoving) {
        this.playerVelocity.normalize();
        const speed = this.playerStats.moveSpeed * (this.activeBuffs.frenzy > 0 ? 1.4 : 1.0);
        this.playerPosition.addScaledVector(this.playerVelocity, speed * delta);
      }

      // Constrain within arena
      const distFromCenter = Math.hypot(this.playerPosition.x, this.playerPosition.z);
      if (distFromCenter > ARENA_RADIUS - 1.5) {
        const angle = Math.atan2(this.playerPosition.z, this.playerPosition.x);
        this.playerPosition.x = Math.cos(angle) * (ARENA_RADIUS - 1.5);
        this.playerPosition.z = Math.sin(angle) * (ARENA_RADIUS - 1.5);
      }
    }

    // 4. Update Mantis 3D Mesh
    this.mantis.group.position.copy(this.playerPosition);
    const isMoving = this.playerVelocity.lengthSq() > 0.01 && !this.isLeaping;
    this.mantis.update(
      delta,
      isMoving,
      this.lookDirection,
      this.isDashing,
      this.activeBuffs.frenzy > 0
    );

    // 5. Check Biomass Pickups
    for (let i = this.enemyManager.biomassOrbs.length - 1; i >= 0; i--) {
      const orb = this.enemyManager.biomassOrbs[i];
      if (this.playerPosition.distanceTo(orb.position) < 1.8) {
        this.playerStats.biomass += orb.value;
        this.playerStats.totalBiomassEarned += orb.value;
        this.summary.biomassCollected += orb.value;
        this.playerStats.score += orb.value * 5;
        soundManager.playPickup();
        this.enemyManager.biomassOrbs.splice(i, 1);
      }
    }
  }

  private updateNest(delta: number) {
    // Attack warning decay
    if (this.nestStats.attackWarningTimer > 0) {
      this.nestStats.attackWarningTimer -= delta;
      if (this.nestStats.attackWarningTimer <= 0) {
        this.nestStats.isUnderAttack = false;
      }
    }

    // Shield auto-regeneration when not under attack
    if (!this.nestStats.isUnderAttack && this.nestStats.shield < this.nestStats.maxShield) {
      this.nestStats.shield = Math.min(this.nestStats.maxShield, this.nestStats.shield + this.nestStats.shieldRegenRate * delta);
    }

    // Sentry auto-targeting
    if (this.nestStats.sentryCount > 0) {
      this.sentryFireTimer += delta;
      if (this.sentryFireTimer >= 1.2) {
        this.sentryFireTimer = 0;
        this.fireSentries();
      }
    }

    const shieldRatio = this.nestStats.maxShield > 0 ? this.nestStats.shield / this.nestStats.maxShield : 0;
    this.nest.update(delta, shieldRatio, this.nestStats.isUnderAttack);
  }

  private fireSentries() {
    if (this.enemyManager.enemies.length === 0) return;

    for (let i = 0; i < this.nest.sentries.length; i++) {
      const sentryObj = this.nest.sentries[i];
      const sentryWorldPos = new THREE.Vector3();
      sentryObj.getWorldPosition(sentryWorldPos);

      // Find nearest enemy
      let nearest: EnemyInstance | null = null;
      let minD = 22;

      for (const enemy of this.enemyManager.enemies) {
        const d = sentryWorldPos.distanceTo(enemy.position);
        if (d < minD) {
          minD = d;
          nearest = enemy;
        }
      }

      if (nearest) {
        const dir = nearest.position.clone().sub(sentryWorldPos).normalize();
        this.combatSystem.spawnProjectile(
          true,
          'spore',
          sentryWorldPos,
          dir,
          28.0,
          24.0,
          1.5,
          'slow',
          2.0
        );
      }
    }
  }

  private updateSubsystems(delta: number) {
    // 1. Environment Pollen & Ambient Lights
    this.environment.update(delta);

    // 2. Enemy AI & Spawns
    this.enemyManager.update(
      delta,
      this.playerPosition,
      this.activeBuffs.stealth > 0,
      (enemy, target) => {
        if (target === 'player') {
          this.onPlayerHit(enemy.stats.damage);
        } else {
          this.onNestHit(enemy.stats.damage);
        }
      },
      (enemy, targetPos) => {
        // Enemy Ranged Shot
        const dir = targetPos.clone().sub(enemy.position).normalize();
        const pType = enemy.type === 'spider_stalker' ? 'web' : (enemy.type === 'boss_queen_hornet' ? 'boss_orb' : 'acid');
        this.combatSystem.spawnProjectile(
          false,
          pType,
          enemy.position.clone().add(new THREE.Vector3(0, 0.6, 0)),
          dir,
          22.0,
          enemy.stats.damage,
          enemy.type === 'boss_queen_hornet' ? 3.0 : 0,
          enemy.type === 'spider_stalker' ? 'slow' : undefined,
          2.5
        );
      }
    );

    // 3. Combat System (Projectiles, Particles, Damage text)
    this.combatSystem.update(
      delta,
      this.enemyManager.enemies,
      this.playerPosition,
      (enemy, dmg, isCrit) => this.onEnemyHit(enemy, dmg, isCrit),
      (dmg, effect) => this.onPlayerHit(dmg, effect),
      (dmg) => this.onNestHit(dmg),
      this.camera,
      window.innerWidth,
      window.innerHeight
    );
  }

  private updateCamera(delta: number) {
    // Camera smooth follow centered between Mantis and Nest/Mouse
    this.cameraTarget.x = THREE.MathUtils.lerp(this.cameraTarget.x, this.playerPosition.x * 0.75, delta * 6);
    this.cameraTarget.z = THREE.MathUtils.lerp(this.cameraTarget.z, this.playerPosition.z * 0.75, delta * 6);
    this.cameraTarget.y = THREE.MathUtils.lerp(this.cameraTarget.y, this.playerPosition.y * 0.5, delta * 6);

    this.camera.position.x = this.cameraTarget.x + this.cameraOffset.x;
    this.camera.position.y = this.cameraTarget.y + this.cameraOffset.y;
    this.camera.position.z = this.cameraTarget.z + this.cameraOffset.z;

    // Apply Screen Shake
    if (this.cameraShakeIntensity > 0) {
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 2.5);
      const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 1.5;
      const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 1.5;
      const shakeZ = (Math.random() - 0.5) * this.cameraShakeIntensity * 1.5;
      this.camera.position.add(new THREE.Vector3(shakeX, shakeY, shakeZ));
    }

    this.camera.lookAt(this.cameraTarget);
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);

    soundManager.destroy();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
