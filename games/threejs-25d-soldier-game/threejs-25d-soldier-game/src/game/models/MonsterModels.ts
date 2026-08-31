import * as THREE from 'three';
import { MonsterType } from '../../types/game';

export class MonsterInstance {
  public mesh: THREE.Group;
  public type: MonsterType;
  public hp: number;
  public maxHp: number;
  public speed: number;
  public damage: number;
  public attackRange: number;
  public attackCooldown: number;
  public attackTimer: number = 0;
  public scoreValue: number;
  public creditsValue: number;
  public isBoss: boolean;
  public isFlying: boolean;
  public hasShield: boolean;
  public shieldActive: boolean = true;
  public shootProjectile: boolean;
  public isDead: boolean = false;
  
  public x: number = 0;
  public y: number = 0;
  public z: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public facing: number = -1; // -1 = left, 1 = right

  public animTime: number = Math.random() * 10;
  public flashTimer: number = 0;
  public deathTimer: number = 0;

  // Visual sub-parts for animation
  private bodyMesh: THREE.Mesh | null = null;
  private limbs: THREE.Object3D[] = [];
  private glowingParts: THREE.Mesh[] = [];
  private shieldMesh: THREE.Mesh | null = null;
  private originalMaterials: Map<THREE.Mesh, THREE.Material> = new Map();
  private hitMaterial: THREE.MeshBasicMaterial;

  constructor(type: MonsterType, stats: any, spawnX: number, spawnY: number = 0) {
    this.type = type;
    this.hp = stats.maxHp;
    this.maxHp = stats.maxHp;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.attackRange = stats.attackRange;
    this.attackCooldown = stats.attackCooldown;
    this.scoreValue = stats.scoreValue;
    this.creditsValue = stats.creditsValue;
    this.isBoss = !!stats.isBoss;
    this.isFlying = !!stats.flying;
    this.hasShield = !!stats.hasShield;
    this.shootProjectile = !!stats.shootProjectile;

    this.x = spawnX;
    this.y = this.isFlying ? 3.5 + Math.random() * 1.5 : spawnY;
    this.z = 0;

    this.mesh = new THREE.Group();
    this.mesh.position.set(this.x, this.y, this.z);

    this.hitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.buildMesh(type, stats);
  }

  private buildMesh(type: MonsterType, stats: any) {
    const scale = stats.scale || 1.0;
    this.mesh.scale.set(scale, scale, scale);

    switch (type) {
      case 'crawler': {
        // Quadruped alien bug
        const bodyGeo = new THREE.SphereGeometry(0.5, 8, 8);
        bodyGeo.scale(1.2, 0.6, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.4;
        this.mesh.add(this.bodyMesh);
        this.registerMaterial(this.bodyMesh, bodyMat);

        // Glowing red eyes
        [-0.15, 0.15].forEach(zOff => {
          const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
          const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
          const eye = new THREE.Mesh(eyeGeo, eyeMat);
          eye.position.set(0.45, 0.45, zOff);
          this.mesh.add(eye);
        });

        // 4 Legs
        [-0.3, 0.3].forEach(xOff => {
          [-0.35, 0.35].forEach(zOff => {
            const leg = new THREE.Group();
            leg.position.set(xOff, 0.35, zOff);
            const legGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.5, 6);
            legGeo.translate(0, -0.25, 0);
            const legMesh = new THREE.Mesh(legGeo, bodyMat);
            leg.add(legMesh);
            leg.rotation.z = (xOff > 0 ? 0.3 : -0.3);
            this.mesh.add(leg);
            this.limbs.push(leg);
          });
        });
        break;
      }

      case 'mutant_brute': {
        // Massive muscular mutant
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.7), bodyMat);
        torso.position.y = 1.2;
        this.bodyMesh = torso;
        this.mesh.add(torso);
        this.registerMaterial(torso, bodyMat);

        // Spikes on shoulders
        [-0.45, 0.45].forEach(xOff => {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
          spike.position.set(xOff, 1.8, 0);
          this.mesh.add(spike);
        });

        // Head with jaw
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), bodyMat);
        head.position.set(0.2, 1.85, 0);
        this.mesh.add(head);

        // Heavy Club in Hand
        const clubArm = new THREE.Group();
        clubArm.position.set(0.5, 1.4, 0.4);
        const club = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.08, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
        club.position.set(0, -0.4, 0);
        clubArm.add(club);
        this.mesh.add(clubArm);
        this.limbs.push(clubArm);

        // Legs
        [-0.25, 0.25].forEach(zOff => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), bodyMat);
          leg.position.set(0, 0.4, zOff);
          this.mesh.add(leg);
          this.limbs.push(leg);
        });
        break;
      }

      case 'acid_spitter': {
        // Slithering creature with toxic glowing sac
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.5 });
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8), bodyMat);
        torso.position.y = 0.7;
        this.bodyMesh = torso;
        this.mesh.add(torso);
        this.registerMaterial(torso, bodyMat);

        // Glowing toxic sac on back
        const sacGeo = new THREE.SphereGeometry(0.45, 12, 12);
        sacGeo.scale(1, 1.2, 1);
        const sacMat = new THREE.MeshBasicMaterial({ color: 0xa3e635 });
        const sac = new THREE.Mesh(sacGeo, sacMat);
        sac.position.set(-0.3, 0.9, 0);
        this.mesh.add(sac);
        this.glowingParts.push(sac);

        // Spout nozzle
        const snout = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), bodyMat);
        snout.rotation.z = -Math.PI / 2;
        snout.position.set(0.4, 1.0, 0);
        this.mesh.add(snout);
        break;
      }

      case 'flying_horror': {
        // Floating bat/drone alien
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.3 });
        const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), bodyMat);
        this.bodyMesh = body;
        this.mesh.add(body);
        this.registerMaterial(body, bodyMat);

        // Wings
        [-1, 1].forEach(dir => {
          const wing = new THREE.Group();
          wing.position.set(0, 0, dir * 0.3);
          const wingGeo = new THREE.BufferGeometry();
          const verts = new Float32Array([
            0, 0, 0,
            0.6, 0.4, dir * 0.8,
            -0.4, 0.2, dir * 0.7
          ]);
          wingGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
          wingGeo.computeVertexNormals();
          const wingMesh = new THREE.Mesh(wingGeo, new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide }));
          wing.add(wingMesh);
          this.mesh.add(wing);
          this.limbs.push(wing);
        });

        // Glowing core
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
        this.mesh.add(core);
        this.glowingParts.push(core);
        break;
      }

      case 'cyber_hound': {
        // Robotic beast
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, metalness: 0.8, roughness: 0.3 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 0.45), bodyMat);
        torso.position.y = 0.55;
        this.bodyMesh = torso;
        this.mesh.add(torso);
        this.registerMaterial(torso, bodyMat);

        // Chrome head and jaw
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), bodyMat);
        head.position.set(0.6, 0.75, 0);
        this.mesh.add(head);

        // Glowing orange visor eye
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.32), new THREE.MeshBasicMaterial({ color: 0xfb923c }));
        eye.position.set(0.65, 0.8, 0);
        this.mesh.add(eye);
        this.glowingParts.push(eye);

        // 4 Mechanical Legs
        [-0.35, 0.35].forEach(xOff => {
          [-0.2, 0.2].forEach(zOff => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.55, 8), bodyMat);
            leg.position.set(xOff, 0.28, zOff);
            this.mesh.add(leg);
            this.limbs.push(leg);
          });
        });
        break;
      }

      case 'shield_golem': {
        // Armored Golem with blue energy shield in front
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.7, roughness: 0.3 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.8), bodyMat);
        torso.position.y = 1.1;
        this.bodyMesh = torso;
        this.mesh.add(torso);
        this.registerMaterial(torso, bodyMat);

        // Massive Energy Shield Plate in front
        const shieldGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.08, 16, 1, false, 0, Math.PI);
        shieldGeo.rotateY(-Math.PI / 2);
        shieldGeo.rotateZ(Math.PI / 2);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: 0x60a5fa,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.shieldMesh.position.set(0.7, 1.1, 0);
        this.mesh.add(this.shieldMesh);
        break;
      }

      case 'phantom_stalker': {
        // Floating cloaked phantom assassin
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.2 });
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.4, 8), bodyMat);
        body.position.y = 1.0;
        this.bodyMesh = body;
        this.mesh.add(body);
        this.registerMaterial(body, bodyMat);

        // Glowing void claws
        [-0.4, 0.4].forEach(zOff => {
          const claw = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0xc084fc }));
          claw.position.set(0.4, 1.0, zOff);
          this.mesh.add(claw);
          this.limbs.push(claw);
          this.glowingParts.push(claw);
        });
        break;
      }

      case 'bomb_bug': {
        // Pulsing round bomb insect
        const bodyGeo = new THREE.SphereGeometry(0.45, 12, 12);
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.45;
        this.mesh.add(this.bodyMesh);
        this.registerMaterial(this.bodyMesh, bodyMat);

        // Fuse antenna on top
        const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        fuse.position.set(0, 0.95, 0);
        this.mesh.add(fuse);
        this.glowingParts.push(fuse);
        break;
      }

      // --- MEGA BOSSES ---
      case 'boss_sand_behemoth': {
        // Gorgon: Giant rock worm with horn crown
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
        const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 0), bodyMat);
        torso.position.y = 1.8;
        this.bodyMesh = torso;
        this.mesh.add(torso);
        this.registerMaterial(torso, bodyMat);

        // Massive rock horns
        [-0.9, 0.9].forEach(zOff => {
          const horn = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
          horn.position.set(0.3, 2.8, zOff);
          horn.rotation.z = -0.4;
          this.mesh.add(horn);
        });

        // Glowing magma maw
        const maw = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
        maw.position.set(1.2, 1.8, 0);
        this.mesh.add(maw);
        this.glowingParts.push(maw);
        break;
      }

      case 'boss_frost_golem': {
        // Frostbite: Colossal ice titan
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.1, metalness: 0.2 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 1.4), bodyMat);
        torso.position.y = 2.2;
        this.bodyMesh = torso;
        this.mesh.add(torso);
        this.registerMaterial(torso, bodyMat);

        // Glowing Cyan Core
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        core.position.set(0.6, 2.2, 0);
        this.mesh.add(core);
        this.glowingParts.push(core);

        // Spiked Ice Fist
        const fist = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), bodyMat);
        fist.position.set(1.0, 1.4, 0.9);
        this.mesh.add(fist);
        this.limbs.push(fist);
        break;
      }

      case 'boss_hive_queen': {
        // Arachna: Giant spider queen
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.4 });
        const abdomen = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), bodyMat);
        abdomen.position.set(-1.0, 1.6, 0);
        this.bodyMesh = abdomen;
        this.mesh.add(abdomen);
        this.registerMaterial(abdomen, bodyMat);

        const thorax = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 10), bodyMat);
        thorax.position.set(0.6, 1.4, 0);
        this.mesh.add(thorax);

        // Multiple glowing purple eyes
        for (let i = 0; i < 6; i++) {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xe879f9 }));
          eye.position.set(1.4, 1.6 + (i % 2) * 0.2, (i - 2.5) * 0.25);
          this.mesh.add(eye);
          this.glowingParts.push(eye);
        }

        // 6 Giant spider legs
        for (let i = 0; i < 6; i++) {
          const zSide = i % 2 === 0 ? 1 : -1;
          const leg = new THREE.Group();
          leg.position.set((i - 2.5) * 0.4, 1.2, zSide * 0.8);
          const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 1.6, 6), bodyMat);
          seg1.rotation.x = zSide * 0.8;
          leg.add(seg1);
          this.mesh.add(leg);
          this.limbs.push(leg);
        }
        break;
      }

      case 'boss_void_titan': {
        // Xul'Gor: Cosmic Void God
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x170c26, roughness: 0.1, metalness: 0.9 });
        const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), bodyMat);
        torso.position.y = 3.0;
        this.bodyMesh = torso;
        this.mesh.add(torso);
        this.registerMaterial(torso, bodyMat);

        // Rotating void rings
        const ringGeo = new THREE.TorusGeometry(2.6, 0.12, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, wireframe: true });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.position.y = 3.0;
        this.mesh.add(ring1);
        this.limbs.push(ring1);

        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.position.y = 3.0;
        ring2.rotation.x = Math.PI / 3;
        this.mesh.add(ring2);
        this.limbs.push(ring2);

        // Giant glowing laser eye core
        const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff007f }));
        eyeCore.position.set(0.6, 3.0, 0);
        this.mesh.add(eyeCore);
        this.glowingParts.push(eyeCore);
        break;
      }
    }
  }

  private registerMaterial(mesh: THREE.Mesh, mat: THREE.Material) {
    this.originalMaterials.set(mesh, mat);
  }

  public takeDamage(amount: number): boolean {
    this.hp -= amount;
    this.flashTimer = 0.08;
    
    // Flash white on hit
    if (this.bodyMesh) {
      this.bodyMesh.material = this.hitMaterial;
    }

    if (this.hp <= 0) {
      this.isDead = true;
      return true; // killed
    }
    return false;
  }

  public update(delta: number, playerX: number, playerY: number): { shouldAttack: boolean; shootType?: string } {
    this.animTime += delta;
    if (this.attackTimer > 0) {
      this.attackTimer -= delta;
    }

    // Flash hit reset
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0 && this.bodyMesh) {
        const orig = this.originalMaterials.get(this.bodyMesh);
        if (orig) this.bodyMesh.material = orig;
      }
    }

    if (this.isDead) {
      this.deathTimer += delta;
      this.mesh.position.y -= delta * 2;
      this.mesh.scale.multiplyScalar(Math.max(0.01, 1 - delta * 3));
      return { shouldAttack: false };
    }

    // AI Tracking
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    this.facing = dx > 0 ? 1 : -1;
    this.mesh.rotation.y = this.facing === 1 ? 0 : Math.PI;

    // Movement AI
    if (this.isFlying) {
      // Swarm in air, swooping toward player
      const targetHoverY = playerY + 3.0 + Math.sin(this.animTime * 3) * 1.2;
      this.vy = (targetHoverY - this.y) * 2.0;
      this.vx = Math.sign(dx) * this.speed;

      this.x += this.vx * delta;
      this.y += this.vy * delta;
      this.mesh.position.set(this.x, this.y, this.z);
    } else {
      // Ground AI
      if (dist > this.attackRange * 0.8) {
        this.vx = Math.sign(dx) * this.speed;
        this.x += this.vx * delta;
      } else {
        this.vx = 0;
      }
      this.mesh.position.x = this.x;
    }

    // Animated limbs / wings
    if (this.type === 'crawler') {
      this.limbs.forEach((leg, idx) => {
        leg.rotation.x = Math.sin(this.animTime * 18 + idx) * 0.5;
      });
    } else if (this.type === 'flying_horror') {
      this.limbs.forEach((wing, idx) => {
        wing.rotation.x = Math.sin(this.animTime * 24) * (idx === 0 ? 0.8 : -0.8);
      });
    } else if (this.type === 'bomb_bug') {
      const pulse = 1.0 + Math.sin(this.animTime * 15) * 0.25;
      this.mesh.scale.set(pulse, pulse, pulse);
    } else if (this.type === 'boss_void_titan') {
      if (this.limbs[0]) this.limbs[0].rotation.z += delta * 1.5;
      if (this.limbs[1]) this.limbs[1].rotation.y += delta * 1.8;
    }

    // Attack Triggering
    let shouldAttack = false;
    if (dist <= this.attackRange && this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      shouldAttack = true;
    }

    return { shouldAttack, shootType: this.shootProjectile ? 'acid' : undefined };
  }
}
