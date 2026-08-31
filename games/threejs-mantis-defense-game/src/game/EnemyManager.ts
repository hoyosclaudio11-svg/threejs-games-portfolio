import * as THREE from 'three';
import { EnemyInstance, EnemyType, EnemyStats, BiomassOrb } from '../types/game';
import { ARENA_RADIUS, NEST_POSITION, NEST_RADIUS } from './constants';
import { soundManager } from '../audio/SoundManager';

export class EnemyManager {
  public scene: THREE.Scene;
  public enemies: EnemyInstance[] = [];
  public biomassOrbs: BiomassOrb[] = [];
  
  // Reusable scratch vectors to eliminate garbage collection
  private tempVec1 = new THREE.Vector3();
  private tempVec2 = new THREE.Vector3();
  private tempVec3 = new THREE.Vector3();
  private tempColor = new THREE.Color();

  // Shared Geometries & Materials for high-performance reuse
  private geometries: Record<string, THREE.BufferGeometry> = {};
  private materials: Record<string, THREE.Material> = {};

  // Biomass InstancedMesh for thousands of glowing orbs at 60 FPS
  private biomassInstancedMesh!: THREE.InstancedMesh;
  private maxBiomassCount: number = 300;
  private dummyObj = new THREE.Object3D();

  // Wave spawn queue
  private spawnQueue: { type: EnemyType; delay: number }[] = [];
  private spawnTimer: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initSharedAssets();
    this.initBiomassMesh();
  }

  private initSharedAssets() {
    // Geometries
    this.geometries['ant_head'] = new THREE.SphereGeometry(0.3, 8, 6);
    this.geometries['ant_thorax'] = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 6);
    this.geometries['ant_abdomen'] = new THREE.SphereGeometry(0.45, 8, 6);
    this.geometries['ant_mandible'] = new THREE.ConeGeometry(0.08, 0.35, 4);

    this.geometries['bee_body'] = new THREE.SphereGeometry(0.45, 8, 8);
    this.geometries['bee_wing'] = new THREE.PlaneGeometry(0.5, 0.9);
    this.geometries['stinger'] = new THREE.ConeGeometry(0.08, 0.4, 4);

    this.geometries['beetle_shell'] = new THREE.SphereGeometry(0.8, 10, 8);
    this.geometries['beetle_horn'] = new THREE.ConeGeometry(0.2, 1.2, 5);

    this.geometries['spider_body'] = new THREE.SphereGeometry(0.55, 8, 8);
    this.geometries['spider_leg'] = new THREE.CylinderGeometry(0.04, 0.06, 1.0, 4);

    this.geometries['orb'] = new THREE.DodecahedronGeometry(0.3);

    // Materials
    this.materials['ant_red'] = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
    this.materials['ant_soldier'] = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.4, metalness: 0.3 });
    this.materials['ant_acid'] = new THREE.MeshStandardMaterial({ color: 0x65a30d, emissive: 0x4d7c0f, emissiveIntensity: 0.4 });
    
    this.materials['bee_yellow'] = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    this.materials['bee_wing'] = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });

    this.materials['beetle_armor'] = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.2,
      metalness: 0.8
    });

    this.materials['spider_dark'] = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.7
    });

    this.materials['boss_hornet'] = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      emissive: 0x9a3412,
      emissiveIntensity: 0.4,
      metalness: 0.4
    });

    this.materials['boss_goliath'] = new THREE.MeshStandardMaterial({
      color: 0x312e81,
      emissive: 0x1e1b4b,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });

    this.materials['biomass_mat'] = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 0.9,
      roughness: 0.1
    });
  }

  private initBiomassMesh() {
    this.biomassInstancedMesh = new THREE.InstancedMesh(
      this.geometries['orb'],
      this.materials['biomass_mat'],
      this.maxBiomassCount
    );
    this.biomassInstancedMesh.count = 0;
    this.biomassInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.biomassInstancedMesh);
  }

  public getEnemyStats(type: EnemyType): EnemyStats {
    switch (type) {
      case 'ant_worker':
        return {
          type,
          name: 'Hormiga Obrera',
          maxHealth: 55,
          health: 55,
          speed: 13.5,
          damage: 10,
          attackSpeed: 1.6,
          attackRange: 2.2,
          isFlying: false,
          flyingHeight: 0,
          biomassValue: 5,
          scoreValue: 40,
          size: 1.0,
          color: 0xb91c1c,
          armor: 0,
          targetPreference: 'closest'
        };
      case 'ant_soldier':
        return {
          type,
          name: 'Hormiga Soldado',
          maxHealth: 140,
          health: 140,
          speed: 11.0,
          damage: 22,
          attackSpeed: 1.3,
          attackRange: 2.4,
          isFlying: false,
          flyingHeight: 0,
          biomassValue: 12,
          scoreValue: 90,
          size: 1.35,
          color: 0x7f1d1d,
          armor: 0.20,
          targetPreference: 'player'
        };
      case 'ant_acid':
        return {
          type,
          name: 'Hormiga Escupidora Ácida',
          maxHealth: 85,
          health: 85,
          speed: 10.0,
          damage: 16,
          attackSpeed: 0.8,
          attackRange: 14.0, // Ranged kiting
          isFlying: false,
          flyingHeight: 0,
          biomassValue: 14,
          scoreValue: 110,
          size: 1.15,
          color: 0x65a30d,
          armor: 0.05,
          targetPreference: 'nest'
        };
      case 'bee_drone':
        return {
          type,
          name: 'Abeja Zángano Cazadora',
          maxHealth: 75,
          health: 75,
          speed: 17.5,
          damage: 18,
          attackSpeed: 1.4,
          attackRange: 2.6,
          isFlying: true,
          flyingHeight: 2.8,
          biomassValue: 15,
          scoreValue: 125,
          size: 1.1,
          color: 0xfacc15,
          armor: 0,
          targetPreference: 'player'
        };
      case 'wasp_hunter':
        return {
          type,
          name: 'Avispa de Choque',
          maxHealth: 130,
          health: 130,
          speed: 20.0,
          damage: 26,
          attackSpeed: 1.2,
          attackRange: 2.8,
          isFlying: true,
          flyingHeight: 3.2,
          biomassValue: 22,
          scoreValue: 180,
          size: 1.3,
          color: 0xf59e0b,
          armor: 0.15,
          targetPreference: 'nest'
        };
      case 'beetle_tank':
        return {
          type,
          name: 'Escarabajo Rinoceronte Blindado',
          maxHealth: 380,
          health: 380,
          speed: 7.8,
          damage: 42,
          attackSpeed: 0.7,
          attackRange: 3.0,
          isFlying: false,
          flyingHeight: 0,
          biomassValue: 35,
          scoreValue: 280,
          size: 1.8,
          color: 0x1e1b4b,
          armor: 0.50, // 50% damage reduction
          targetPreference: 'nest'
        };
      case 'spider_stalker':
        return {
          type,
          name: 'Araña Cazadora Tejedora',
          maxHealth: 160,
          health: 160,
          speed: 15.0,
          damage: 24,
          attackSpeed: 1.1,
          attackRange: 12.0,
          isFlying: false,
          flyingHeight: 0,
          biomassValue: 25,
          scoreValue: 220,
          size: 1.4,
          color: 0x09090b,
          armor: 0.10,
          targetPreference: 'player'
        };
      case 'boss_queen_hornet':
        return {
          type,
          name: 'LA REINA AVISPÓN TITÁN',
          maxHealth: 1600,
          health: 1600,
          speed: 14.0,
          damage: 45,
          attackSpeed: 1.0,
          attackRange: 18.0,
          isFlying: true,
          flyingHeight: 4.5,
          biomassValue: 200,
          scoreValue: 2500,
          size: 3.2,
          color: 0xea580c,
          armor: 0.35,
          targetPreference: 'player'
        };
      case 'boss_goliath_beetle':
        return {
          type,
          name: 'EL ESCARABAJO CIERVO GOLIAT',
          maxHealth: 3200,
          health: 3200,
          speed: 9.0,
          damage: 75,
          attackSpeed: 0.6,
          attackRange: 4.5,
          isFlying: false,
          flyingHeight: 0,
          biomassValue: 400,
          scoreValue: 5000,
          size: 3.8,
          color: 0x312e81,
          armor: 0.65,
          targetPreference: 'nest'
        };
      case 'boss_locust_lord':
        return {
          type,
          name: 'SEÑOR DE LA PLAGA',
          maxHealth: 4500,
          health: 4500,
          speed: 18.0,
          damage: 60,
          attackSpeed: 1.5,
          attackRange: 15.0,
          isFlying: true,
          flyingHeight: 4.0,
          biomassValue: 600,
          scoreValue: 8000,
          size: 3.5,
          color: 0x15803d,
          armor: 0.45,
          targetPreference: 'closest'
        };
    }
  }

  public spawnEnemy(type: EnemyType, spawnPos?: THREE.Vector3): EnemyInstance {
    const stats = this.getEnemyStats(type);

    let position: THREE.Vector3;
    if (spawnPos) {
      position = spawnPos.clone();
    } else {
      // Spawn at random perimeter edge
      const angle = Math.random() * Math.PI * 2;
      const r = ARENA_RADIUS - 1.5;
      const y = stats.isFlying ? stats.flyingHeight : 0.4;
      position = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
    }

    const mesh = this.createEnemyMesh(type, stats);
    mesh.position.copy(position);
    this.scene.add(mesh);

    const enemy: EnemyInstance = {
      id: 'enemy_' + Math.random().toString(36).substring(2, 9),
      type,
      stats,
      position,
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      mesh,
      isInstanced: false,
      targetPosition: new THREE.Vector3(NEST_POSITION.x, 0, NEST_POSITION.z),
      state: 'spawning',
      attackCooldown: Math.random() * 0.8,
      deathTimer: 0,
      statusEffects: {
        slow: 0,
        slowAmount: 0,
        poison: 0,
        poisonDps: 0,
        stun: 0,
        fear: 0
      },
      animationPhase: Math.random() * Math.PI * 2,
      wingPhase: Math.random() * Math.PI * 2
    };

    this.enemies.push(enemy);
    return enemy;
  }

  private createEnemyMesh(type: EnemyType, stats: EnemyStats): THREE.Group {
    const group = new THREE.Group();
    const s = stats.size;

    if (type.startsWith('ant')) {
      const mat = type === 'ant_acid' 
        ? this.materials['ant_acid'] 
        : (type === 'ant_soldier' ? this.materials['ant_soldier'] : this.materials['ant_red']);

      // Head
      const head = new THREE.Mesh(this.geometries['ant_head'], mat);
      head.position.set(0, 0.4 * s, 0.5 * s);
      head.scale.set(s, s, s);
      head.castShadow = true;
      group.add(head);

      // Mandibles
      const mand1 = new THREE.Mesh(this.geometries['ant_mandible'], this.materials['ant_soldier']);
      mand1.position.set(0.2 * s, 0.3 * s, 0.8 * s);
      mand1.rotation.set(0.6, 0, -0.4);
      group.add(mand1);

      const mand2 = new THREE.Mesh(this.geometries['ant_mandible'], this.materials['ant_soldier']);
      mand2.position.set(-0.2 * s, 0.3 * s, 0.8 * s);
      mand2.rotation.set(0.6, 0, 0.4);
      group.add(mand2);

      // Thorax
      const thorax = new THREE.Mesh(this.geometries['ant_thorax'], mat);
      thorax.position.set(0, 0.35 * s, 0);
      thorax.rotation.x = Math.PI / 2;
      thorax.scale.set(s, s, s);
      thorax.castShadow = true;
      group.add(thorax);

      // Abdomen
      const abd = new THREE.Mesh(this.geometries['ant_abdomen'], mat);
      abd.position.set(0, 0.45 * s, -0.7 * s);
      abd.scale.set(s * 1.1, s * 1.1, s * 1.4);
      abd.castShadow = true;
      group.add(abd);

      // 6 legs
      for (let i = 0; i < 3; i++) {
        const z = (i - 1) * 0.3 * s;
        const legR = new THREE.Mesh(this.geometries['spider_leg'], mat);
        legR.position.set(0.4 * s, 0.2 * s, z);
        legR.rotation.z = -1.1;
        group.add(legR);

        const legL = new THREE.Mesh(this.geometries['spider_leg'], mat);
        legL.position.set(-0.4 * s, 0.2 * s, z);
        legL.rotation.z = 1.1;
        group.add(legL);
      }
    } else if (type === 'bee_drone' || type === 'wasp_hunter' || type === 'boss_queen_hornet') {
      const mat = type === 'boss_queen_hornet' 
        ? this.materials['boss_hornet'] 
        : this.materials['bee_yellow'];

      // Body (Striped / Amber)
      const body = new THREE.Mesh(this.geometries['bee_body'], mat);
      body.scale.set(s * 0.9, s * 0.9, s * 1.5);
      body.castShadow = true;
      group.add(body);

      // Stinger
      const stinger = new THREE.Mesh(this.geometries['stinger'], this.materials['ant_soldier']);
      stinger.position.set(0, -0.1 * s, -0.9 * s);
      stinger.rotation.x = -Math.PI / 2;
      group.add(stinger);

      // Wings (Left & Right)
      const wingR = new THREE.Mesh(this.geometries['bee_wing'], this.materials['bee_wing']);
      wingR.position.set(0.4 * s, 0.4 * s, 0);
      wingR.rotation.x = Math.PI / 2;
      wingR.name = 'wingR';
      group.add(wingR);

      const wingL = new THREE.Mesh(this.geometries['bee_wing'], this.materials['bee_wing']);
      wingL.position.set(-0.4 * s, 0.4 * s, 0);
      wingL.rotation.x = Math.PI / 2;
      wingL.name = 'wingL';
      group.add(wingL);
    } else if (type === 'beetle_tank' || type === 'boss_goliath_beetle') {
      const mat = type === 'boss_goliath_beetle' 
        ? this.materials['boss_goliath'] 
        : this.materials['beetle_armor'];

      // Big Domed Shell
      const shell = new THREE.Mesh(this.geometries['beetle_shell'], mat);
      shell.scale.set(s * 1.1, s * 0.8, s * 1.3);
      shell.position.y = 0.5 * s;
      shell.castShadow = true;
      group.add(shell);

      // Horn
      const horn = new THREE.Mesh(this.geometries['beetle_horn'], mat);
      horn.position.set(0, 0.8 * s, 1.2 * s);
      horn.rotation.x = 0.5;
      horn.scale.set(s, s * 1.3, s);
      horn.castShadow = true;
      group.add(horn);

      // Heavy Legs
      for (let i = 0; i < 3; i++) {
        const z = (i - 1) * 0.6 * s;
        const legR = new THREE.Mesh(this.geometries['spider_leg'], mat);
        legR.position.set(0.8 * s, 0.3 * s, z);
        legR.scale.set(1.5, 1.2, 1.5);
        legR.rotation.z = -1.0;
        group.add(legR);

        const legL = new THREE.Mesh(this.geometries['spider_leg'], mat);
        legL.position.set(-0.8 * s, 0.3 * s, z);
        legL.scale.set(1.5, 1.2, 1.5);
        legL.rotation.z = 1.0;
        group.add(legL);
      }
    } else if (type === 'spider_stalker') {
      const mat = this.materials['spider_dark'];

      // Cephalothorax & Abdomen
      const body = new THREE.Mesh(this.geometries['spider_body'], mat);
      body.scale.set(s * 1.1, s * 0.6, s * 1.2);
      body.position.y = 0.4 * s;
      body.castShadow = true;
      group.add(body);

      // 8 Spidery legs
      for (let i = 0; i < 4; i++) {
        const z = (i - 1.5) * 0.35 * s;
        const angle = (i - 1.5) * 0.3;

        const legR = new THREE.Mesh(this.geometries['spider_leg'], mat);
        legR.position.set(0.6 * s, 0.4 * s, z);
        legR.rotation.set(0, angle, -0.9);
        group.add(legR);

        const legL = new THREE.Mesh(this.geometries['spider_leg'], mat);
        legL.position.set(-0.6 * s, 0.4 * s, z);
        legL.rotation.set(0, -angle, 0.9);
        group.add(legL);
      }
    }

    return group;
  }

  public prepareWave(queue: { type: EnemyType; delay: number }[]) {
    this.spawnQueue = [...queue];
    this.spawnTimer = 0;
  }

  public spawnBiomass(pos: THREE.Vector3, totalValue: number) {
    const orbCount = Math.min(6, Math.max(1, Math.floor(totalValue / 6)));
    const valuePerOrb = Math.ceil(totalValue / orbCount);

    for (let i = 0; i < orbCount; i++) {
      if (this.biomassOrbs.length >= this.maxBiomassCount) {
        this.biomassOrbs.shift(); // Evict oldest
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const orb: BiomassOrb = {
        id: 'bio_' + Math.random().toString(36).substring(2, 8),
        position: new THREE.Vector3(
          pos.x + (Math.random() - 0.5) * 0.5,
          Math.max(0.4, pos.y + 0.3),
          pos.z + (Math.random() - 0.5) * 0.5
        ),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          3.5 + Math.random() * 2.5,
          Math.sin(angle) * speed
        ),
        value: valuePerOrb,
        life: 25.0, // 25 seconds before fading
        type: totalValue > 100 ? 'royal_jelly' : (totalValue > 30 ? 'amber' : 'green')
      };

      this.biomassOrbs.push(orb);
    }
  }

  public killEnemy(enemy: EnemyInstance, index: number) {
    // Spawn Biomass
    this.spawnBiomass(enemy.position, enemy.stats.biomassValue);

    // Play death audio
    soundManager.playHit(false, enemy.stats.size > 2.0);

    // Remove 3D Mesh
    if (enemy.mesh) {
      this.scene.remove(enemy.mesh);
    }

    this.enemies.splice(index, 1);
  }

  public update(
    delta: number, 
    playerPosition: THREE.Vector3, 
    isPlayerStealthed: boolean,
    onEnemyAttack: (enemy: EnemyInstance, target: 'player' | 'nest') => void,
    onEnemyRangedFire: (enemy: EnemyInstance, targetPos: THREE.Vector3) => void
  ) {
    // 1. Process Wave Spawning Queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer += delta;
      if (this.spawnTimer >= this.spawnQueue[0].delay) {
        const item = this.spawnQueue.shift()!;
        this.spawnEnemy(item.type);
        this.spawnTimer = 0;
      }
    }

    // 2. Update Active Enemies AI & Movement
    const nestPos = this.tempVec1.set(NEST_POSITION.x, 0, NEST_POSITION.z);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.mesh) continue;

      // Handle Status Effects
      if (enemy.statusEffects.stun > 0) {
        enemy.statusEffects.stun -= delta;
        continue; // Cannot act while stunned
      }

      if (enemy.statusEffects.poison > 0) {
        enemy.statusEffects.poison -= delta;
        const tickDmg = enemy.statusEffects.poisonDps * delta;
        enemy.stats.health -= tickDmg;
        if (enemy.stats.health <= 0) {
          this.killEnemy(enemy, i);
          continue;
        }
      }

      if (enemy.statusEffects.slow > 0) {
        enemy.statusEffects.slow -= delta;
      }

      if (enemy.statusEffects.fear > 0) {
        enemy.statusEffects.fear -= delta;
      }

      // Determine Target (Nest or Mantis)
      let targetPos = nestPos;
      let targetType: 'player' | 'nest' = 'nest';

      const distToPlayer = enemy.position.distanceTo(playerPosition);
      const distToNest = enemy.position.distanceTo(nestPos);

      if (enemy.statusEffects.fear > 0) {
        // Run away from player/nest
        this.tempVec2.subVectors(enemy.position, playerPosition).normalize();
        targetPos = this.tempVec3.copy(enemy.position).addScaledVector(this.tempVec2, 10);
      } else if (!isPlayerStealthed && (enemy.stats.targetPreference === 'player' || (enemy.stats.targetPreference === 'closest' && distToPlayer < distToNest + 4))) {
        targetPos = playerPosition;
        targetType = 'player';
      } else {
        targetPos = nestPos;
        targetType = 'nest';
      }

      // Movement Vector
      this.tempVec2.subVectors(targetPos, enemy.position);
      if (!enemy.stats.isFlying) {
        this.tempVec2.y = 0;
      }
      const distToTarget = this.tempVec2.length();
      this.tempVec2.normalize();

      // Swarm Flocking / Separation from other nearby insects (avoiding overlapping clump)
      const avoidVec = this.tempVec3.set(0, 0, 0);
      let neighbors = 0;
      for (let j = 0; j < this.enemies.length; j++) {
        if (i === j) continue;
        const other = this.enemies[j];
        const distSq = enemy.position.distanceToSquared(other.position);
        const minDist = (enemy.stats.size + other.stats.size) * 0.8;
        if (distSq < minDist * minDist && distSq > 0.001) {
          const d = Math.sqrt(distSq);
          avoidVec.x += (enemy.position.x - other.position.x) / d;
          avoidVec.z += (enemy.position.z - other.position.z) / d;
          neighbors++;
        }
      }

      if (neighbors > 0) {
        avoidVec.multiplyScalar(1.2 / neighbors);
        this.tempVec2.add(avoidVec).normalize();
      }

      // Speed calculation
      let currentSpeed = enemy.stats.speed;
      if (enemy.statusEffects.slow > 0) {
        currentSpeed *= (1 - enemy.statusEffects.slowAmount);
      }

      // Range Check for Attack
      const attackRange = enemy.stats.attackRange;
      const targetRadius = targetType === 'nest' ? NEST_RADIUS : 1.2;

      if (distToTarget <= attackRange + targetRadius) {
        // In Attack Range
        enemy.state = 'attacking';
        enemy.attackCooldown -= delta;

        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 1.0 / enemy.stats.attackSpeed;

          if (enemy.type === 'ant_acid' || enemy.type === 'spider_stalker' || enemy.type === 'boss_queen_hornet') {
            // Ranged Attack
            onEnemyRangedFire(enemy, targetPos);
          } else {
            // Melee Attack
            onEnemyAttack(enemy, targetType);
          }
        }
      } else {
        // Move towards target
        enemy.state = 'running';
        enemy.position.addScaledVector(this.tempVec2, currentSpeed * delta);

        // Clamp inside arena boundary
        const distFromCenter = Math.hypot(enemy.position.x, enemy.position.z);
        if (distFromCenter > ARENA_RADIUS - 1.0) {
          const angle = Math.atan2(enemy.position.z, enemy.position.x);
          enemy.position.x = Math.cos(angle) * (ARENA_RADIUS - 1.0);
          enemy.position.z = Math.sin(angle) * (ARENA_RADIUS - 1.0);
        }
      }

      // Update Mesh Transform & Visual Animations
      enemy.mesh.position.copy(enemy.position);

      // Face direction of movement
      if (this.tempVec2.lengthSq() > 0.001) {
        const lookAngle = Math.atan2(this.tempVec2.x, this.tempVec2.z);
        enemy.mesh.rotation.y = THREE.MathUtils.lerp(enemy.mesh.rotation.y, lookAngle, delta * 12);
      }

      // Flying Wing Flutter & Hover Bobbing
      if (enemy.stats.isFlying) {
        enemy.animationPhase += delta * 18;
        enemy.mesh.position.y = enemy.stats.flyingHeight + Math.sin(enemy.animationPhase * 0.4) * 0.35;

        const wingR = enemy.mesh.getObjectByName('wingR');
        const wingL = enemy.mesh.getObjectByName('wingL');
        if (wingR && wingL) {
          const flutter = Math.sin(enemy.animationPhase) * 0.7;
          wingR.rotation.z = flutter;
          wingL.rotation.z = -flutter;
        }
      } else {
        // Crawling Leg & Body Sway
        enemy.animationPhase += delta * currentSpeed * 1.5;
        enemy.mesh.position.y = 0.2 + Math.abs(Math.sin(enemy.animationPhase)) * 0.12;
      }
    }

    // 3. Update Biomass Orbs
    this.updateBiomassOrbs(delta, playerPosition);
  }

  private updateBiomassOrbs(delta: number, playerPosition: THREE.Vector3) {
    const magnetRadius = 7.5; // Biomass magnet pull range
    const count = this.biomassOrbs.length;

    for (let i = count - 1; i >= 0; i--) {
      const orb = this.biomassOrbs[i];
      orb.life -= delta;

      // Magnet pull towards Mantis
      const distToPlayer = orb.position.distanceTo(playerPosition);
      if (distToPlayer < magnetRadius) {
        this.tempVec1.subVectors(playerPosition, orb.position).normalize();
        const pullSpeed = (1 - distToPlayer / magnetRadius) * 26 + 10;
        orb.position.addScaledVector(this.tempVec1, pullSpeed * delta);
      } else {
        // Physics bounce on ground
        orb.velocity.y -= 9.8 * delta;
        orb.position.addScaledVector(orb.velocity, delta);

        if (orb.position.y <= 0.3) {
          orb.position.y = 0.3;
          orb.velocity.y = -orb.velocity.y * 0.4;
          orb.velocity.x *= 0.7;
          orb.velocity.z *= 0.7;
        }
      }

      // Check Expire
      if (orb.life <= 0) {
        this.biomassOrbs.splice(i, 1);
      }
    }

    // Render Instanced Biomass Orbs
    const renderCount = Math.min(this.biomassOrbs.length, this.maxBiomassCount);
    this.biomassInstancedMesh.count = renderCount;

    for (let i = 0; i < renderCount; i++) {
      const orb = this.biomassOrbs[i];
      this.dummyObj.position.copy(orb.position);
      const s = orb.type === 'royal_jelly' ? 1.6 : (orb.type === 'amber' ? 1.2 : 0.85);
      this.dummyObj.scale.set(s, s, s);
      this.dummyObj.rotation.y += delta * 2;
      this.dummyObj.updateMatrix();

      this.biomassInstancedMesh.setMatrixAt(i, this.dummyObj.matrix);
      
      // Color tint
      const col = orb.type === 'royal_jelly' 
        ? 0xd946ef 
        : (orb.type === 'amber' ? 0xf59e0b : 0x22c55e);
      this.tempColor.setHex(col);
      this.biomassInstancedMesh.setColorAt(i, this.tempColor);
    }

    this.biomassInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.biomassInstancedMesh.instanceColor) {
      this.biomassInstancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public clearAll() {
    this.enemies.forEach((enemy) => {
      if (enemy.mesh) this.scene.remove(enemy.mesh);
    });
    this.enemies = [];
    this.biomassOrbs = [];
    this.spawnQueue = [];
    this.biomassInstancedMesh.count = 0;
  }
}
