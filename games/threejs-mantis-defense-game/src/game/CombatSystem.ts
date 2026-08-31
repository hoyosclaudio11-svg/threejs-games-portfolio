import * as THREE from 'three';
import { Projectile, Particle, DamageNumber, EnemyInstance } from '../types/game';
import { soundManager } from '../audio/SoundManager';

export class CombatSystem {
  public scene: THREE.Scene;
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public damageNumbers: DamageNumber[] = [];

  // Projectile Mesh Pool
  private projectileGroup: THREE.Group;
  private projectileGeos: Record<string, THREE.BufferGeometry> = {};
  private projectileMats: Record<string, THREE.Material> = {};

  // Instanced Particle Mesh
  private particleInstancedMesh!: THREE.InstancedMesh;
  private maxParticles: number = 800;
  private dummyObj = new THREE.Object3D();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.projectileGroup = new THREE.Group();
    this.scene.add(this.projectileGroup);

    this.initPools();
  }

  private initPools() {
    // Projectile Geometries
    this.projectileGeos['acid'] = new THREE.SphereGeometry(0.35, 8, 6);
    this.projectileGeos['stinger'] = new THREE.ConeGeometry(0.12, 0.6, 5);
    this.projectileGeos['web'] = new THREE.IcosahedronGeometry(0.3, 0);
    this.projectileGeos['spore'] = new THREE.DodecahedronGeometry(0.25);
    this.projectileGeos['boss_orb'] = new THREE.SphereGeometry(0.7, 10, 8);

    // Materials
    this.projectileMats['acid'] = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });

    this.projectileMats['stinger'] = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.6
    });

    this.projectileMats['web'] = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xe2e8f0,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85
    });

    this.projectileMats['spore'] = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9
    });

    this.projectileMats['boss_orb'] = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 1.2
    });

    // High performance instanced particles
    const partGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const partMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });

    this.particleInstancedMesh = new THREE.InstancedMesh(partGeo, partMat, this.maxParticles);
    this.particleInstancedMesh.count = 0;
    this.particleInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.particleInstancedMesh);
  }

  // Spawn Projectile
  public spawnProjectile(
    isPlayer: boolean,
    type: 'acid' | 'stinger' | 'web' | 'spore' | 'boss_orb',
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage: number,
    splashRadius: number = 0,
    effect?: 'poison' | 'slow' | 'stun',
    effectDuration?: number
  ) {
    const geo = this.projectileGeos[type] || this.projectileGeos['acid'];
    const mat = this.projectileMats[type] || this.projectileMats['acid'];

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    this.projectileGroup.add(mesh);

    const projectile: Projectile = {
      id: 'proj_' + Math.random().toString(36).substring(2, 8),
      isPlayer,
      type,
      position: origin.clone(),
      velocity: direction.clone().normalize().multiplyScalar(speed),
      damage,
      radius: type === 'boss_orb' ? 0.7 : 0.35,
      splashRadius,
      life: 4.5,
      maxLife: 4.5,
      mesh,
      color: type === 'acid' ? 0x22c55e : (type === 'web' ? 0xf8fafc : 0xf59e0b),
      effect,
      effectDuration
    };

    this.projectiles.push(projectile);
  }

  // Spawn Particle Bursts
  public spawnParticleBurst(
    position: THREE.Vector3,
    colorHex: number,
    count: number = 12,
    type: 'spark' | 'blood' | 'acid' | 'spore' | 'shockwave' = 'acid',
    speedMult: number = 1.0
  ) {
    const col = new THREE.Color(colorHex);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift(); // Evict oldest
      }

      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.3) * Math.PI;
      const speed = (2 + Math.random() * 6) * speedMult;

      const particle: Particle = {
        position: position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3)),
        velocity: new THREE.Vector3(
          Math.cos(angle) * Math.cos(elev) * speed,
          Math.sin(elev) * speed + 2.5,
          Math.sin(angle) * Math.cos(elev) * speed
        ),
        color: col,
        size: 0.15 + Math.random() * 0.25,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 0.6 + Math.random() * 0.5,
        alpha: 1.0,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 8,
        gravity: type === 'spore' ? 1.5 : 9.8,
        type
      };

      this.particles.push(particle);
    }
  }

  // Add floating damage number
  public addDamageNumber(text: string, pos: THREE.Vector3, color: string = '#ef4444', isCrit: boolean = false) {
    this.damageNumbers.push({
      id: 'dmg_' + Math.random().toString(36).substring(2, 7),
      text,
      position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.2 + Math.random() * 0.4, (Math.random() - 0.5) * 0.6)),
      screenPos: { x: 0, y: 0 },
      color,
      life: 0.85,
      maxLife: 0.85,
      isCrit
    });
  }

  // Melee Raptorial Claw Arc Check
  public checkMeleeCone(
    mantisPos: THREE.Vector3,
    lookDir: THREE.Vector3,
    range: number,
    halfAngleRad: number,
    damage: number,
    critChance: number,
    critMultiplier: number,
    enemies: EnemyInstance[],
    onEnemyDamaged: (enemy: EnemyInstance, dmg: number, isCrit: boolean) => void
  ): { hits: number; totalDamage: number } {
    let hits = 0;
    let totalDamage = 0;

    const lookNorm = lookDir.clone().setY(0).normalize();

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const dist = mantisPos.distanceTo(enemy.position);

      if (dist <= range + enemy.stats.size * 0.6) {
        // Angle check
        const toEnemy = enemy.position.clone().sub(mantisPos).setY(0).normalize();
        const dot = lookNorm.dot(toEnemy);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

        if (angle <= halfAngleRad) {
          // HIT!
          const isCrit = Math.random() < critChance;
          const rawDmg = isCrit ? damage * critMultiplier : damage;
          // Apply armor reduction
          const finalDmg = Math.max(1, rawDmg * (1 - enemy.stats.armor));

          hits++;
          totalDamage += finalDmg;

          // Visual and Audio FX
          this.spawnParticleBurst(enemy.position, 0xef4444, 10, 'blood');
          this.spawnParticleBurst(enemy.position, 0x86efac, 6, 'spark');
          this.addDamageNumber(Math.round(finalDmg).toString(), enemy.position, isCrit ? '#f59e0b' : '#ffffff', isCrit);

          onEnemyDamaged(enemy, finalDmg, isCrit);
        }
      }
    }

    return { hits, totalDamage };
  }

  // AoE Splash Damage Burst (Leap slam, acid splash, nest pulse)
  public applyAoE(
    centerPos: THREE.Vector3,
    radius: number,
    damage: number,
    knockback: number,
    enemies: EnemyInstance[],
    onEnemyDamaged: (enemy: EnemyInstance, dmg: number, isCrit: boolean) => void,
    statusEffect?: { slow?: number; poison?: number; stun?: number; fear?: number }
  ) {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const dist = centerPos.distanceTo(enemy.position);

      if (dist <= radius + enemy.stats.size * 0.5) {
        const falloff = 1 - (dist / (radius + 1));
        const finalDmg = Math.max(1, damage * Math.max(0.4, falloff) * (1 - enemy.stats.armor));

        // Knockback
        if (knockback > 0) {
          const pushDir = enemy.position.clone().sub(centerPos).normalize();
          enemy.position.addScaledVector(pushDir, knockback * Math.max(0.3, falloff));
        }

        // Apply Status effects
        if (statusEffect) {
          if (statusEffect.slow) {
            enemy.statusEffects.slow = Math.max(enemy.statusEffects.slow, statusEffect.slow);
            enemy.statusEffects.slowAmount = 0.5;
          }
          if (statusEffect.stun) {
            enemy.statusEffects.stun = Math.max(enemy.statusEffects.stun, statusEffect.stun);
          }
          if (statusEffect.fear) {
            enemy.statusEffects.fear = Math.max(enemy.statusEffects.fear, statusEffect.fear);
          }
          if (statusEffect.poison) {
            enemy.statusEffects.poison = Math.max(enemy.statusEffects.poison, statusEffect.poison);
            enemy.statusEffects.poisonDps = 25;
          }
        }

        this.addDamageNumber(Math.round(finalDmg).toString(), enemy.position, '#22c55e', false);
        this.spawnParticleBurst(enemy.position, 0x22c55e, 8, 'acid');

        onEnemyDamaged(enemy, finalDmg, false);
      }
    }
  }

  // Main Loop Update
  public update(
    delta: number,
    enemies: EnemyInstance[],
    playerPosition: THREE.Vector3,
    onEnemyDamaged: (enemy: EnemyInstance, dmg: number, isCrit: boolean) => void,
    onPlayerHit: (dmg: number, effect?: 'poison' | 'slow' | 'stun') => void,
    onNestHit: (dmg: number) => void,
    camera: THREE.Camera,
    viewportWidth: number,
    viewportHeight: number
  ) {
    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= delta;

      // Move
      proj.position.addScaledVector(proj.velocity, delta);
      if (proj.mesh) {
        proj.mesh.position.copy(proj.position);
      }

      // Check Expire / Ground Hit
      if (proj.life <= 0 || proj.position.y <= 0.1) {
        if (proj.splashRadius > 0) {
          soundManager.playAcidImpact();
          this.spawnParticleBurst(proj.position, proj.color, 14, 'acid');
          this.applyAoE(proj.position, proj.splashRadius, proj.damage, 1.2, enemies, onEnemyDamaged, { poison: 3.5 });
        }
        this.destroyProjectile(i);
        continue;
      }

      // Collisions
      if (proj.isPlayer) {
        // Player projectile -> hit enemies
        let hasHit = false;
        for (let j = 0; j < enemies.length; j++) {
          const enemy = enemies[j];
          const dist = proj.position.distanceTo(enemy.position);

          if (dist <= proj.radius + enemy.stats.size * 0.6) {
            hasHit = true;
            soundManager.playAcidImpact();
            this.spawnParticleBurst(proj.position, 0x22c55e, 12, 'acid');

            if (proj.splashRadius > 0) {
              this.applyAoE(proj.position, proj.splashRadius, proj.damage, 1.0, enemies, onEnemyDamaged, { poison: 4.0 });
            } else {
              const finalDmg = Math.max(1, proj.damage * (1 - enemy.stats.armor));
              this.addDamageNumber(Math.round(finalDmg).toString(), enemy.position, '#22c55e', false);
              onEnemyDamaged(enemy, finalDmg, false);
            }
            break;
          }
        }

        if (hasHit) {
          this.destroyProjectile(i);
          continue;
        }
      } else {
        // Enemy projectile -> hit player or nest
        const distToPlayer = proj.position.distanceTo(playerPosition);
        if (distToPlayer <= proj.radius + 1.2) {
          soundManager.playHit(false, true);
          this.spawnParticleBurst(proj.position, proj.color, 8, 'spark');
          onPlayerHit(proj.damage, proj.effect);
          this.destroyProjectile(i);
          continue;
        }

        const distToNest = Math.hypot(proj.position.x, proj.position.z);
        if (distToNest <= 3.2) {
          soundManager.playHit(false, true);
          this.spawnParticleBurst(proj.position, proj.color, 8, 'spark');
          onNestHit(proj.damage);
          this.destroyProjectile(i);
          continue;
        }
      }
    }

    // 2. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.life -= delta;

      if (part.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      part.velocity.y -= part.gravity * delta;
      part.position.addScaledVector(part.velocity, delta);
      part.rotation += part.rotationSpeed * delta;
      part.alpha = Math.max(0, part.life / part.maxLife);

      if (part.position.y <= 0.1) {
        part.position.y = 0.1;
        part.velocity.y = -part.velocity.y * 0.3;
      }
    }

    // Render Instanced Particles
    const renderPartCount = Math.min(this.particles.length, this.maxParticles);
    this.particleInstancedMesh.count = renderPartCount;

    for (let i = 0; i < renderPartCount; i++) {
      const part = this.particles[i];
      this.dummyObj.position.copy(part.position);
      const s = part.size * part.alpha;
      this.dummyObj.scale.set(s, s, s);
      this.dummyObj.rotation.set(part.rotation, part.rotation * 0.7, 0);
      this.dummyObj.updateMatrix();

      this.particleInstancedMesh.setMatrixAt(i, this.dummyObj.matrix);
      this.particleInstancedMesh.setColorAt(i, part.color);
    }

    this.particleInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.particleInstancedMesh.instanceColor) {
      this.particleInstancedMesh.instanceColor.needsUpdate = true;
    }

    // 3. Update Damage Numbers (3D to 2D projection)
    const projVec = new THREE.Vector3();

    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dmg = this.damageNumbers[i];
      dmg.life -= delta;

      if (dmg.life <= 0) {
        this.damageNumbers.splice(i, 1);
        continue;
      }

      // Rise up
      dmg.position.y += delta * 1.6;

      // Project 3D vector to screen 2D
      projVec.copy(dmg.position);
      projVec.project(camera);

      // Check if behind camera
      if (projVec.z > 1) {
        dmg.screenPos = { x: -9999, y: -9999 };
      } else {
        dmg.screenPos = {
          x: (projVec.x * 0.5 + 0.5) * viewportWidth,
          y: (-(projVec.y * 0.5) + 0.5) * viewportHeight
        };
      }
    }
  }

  private destroyProjectile(index: number) {
    const proj = this.projectiles[index];
    if (proj.mesh) {
      this.projectileGroup.remove(proj.mesh);
    }
    this.projectiles.splice(index, 1);
  }

  public clearAll() {
    this.projectiles.forEach((p) => {
      if (p.mesh) this.projectileGroup.remove(p.mesh);
    });
    this.projectiles = [];
    this.particles = [];
    this.damageNumbers = [];
    this.particleInstancedMesh.count = 0;
  }
}
