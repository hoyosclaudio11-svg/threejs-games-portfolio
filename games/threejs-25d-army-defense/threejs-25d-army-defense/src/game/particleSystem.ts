import * as THREE from 'three';
import { BiomeType } from '../types/game';

interface Particle {
  mesh: THREE.Mesh | THREE.Sprite;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  startScale: number;
  endScale: number;
  rotSpeed: number;
}

export class VisualEffectsSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private weatherParticles: THREE.Points | null = null;
  private weatherGeo: THREE.BufferGeometry | null = null;
  private currentWeatherType: BiomeType = 'meadows';

  constructor() {
    this.group = new THREE.Group();
  }

  public initWeather(biome: BiomeType) {
    this.currentWeatherType = biome;
    if (this.weatherParticles) {
      this.group.remove(this.weatherParticles);
      this.weatherGeo?.dispose();
      this.weatherParticles = null;
    }

    const count = 400;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    let baseColor = new THREE.Color(0xffffff);
    if (biome === 'autumn_forest') baseColor = new THREE.Color(0xd97706);
    else if (biome === 'desert_ruins') baseColor = new THREE.Color(0xfde047);
    else if (biome === 'frozen_bastion') baseColor = new THREE.Color(0xe0f2fe);
    else if (biome === 'volcano_abyss') baseColor = new THREE.Color(0xef4444);
    else if (biome === 'twilight_grove') baseColor = new THREE.Color(0xc084fc);
    else if (biome === 'shadow_citadel') baseColor = new THREE.Color(0xa855f7);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 18 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      colors[i * 3] = baseColor.r + (Math.random() - 0.5) * 0.2;
      colors[i * 3 + 1] = baseColor.g + (Math.random() - 0.5) * 0.2;
      colors[i * 3 + 2] = baseColor.b + (Math.random() - 0.5) * 0.2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.weatherGeo = geo;

    const mat = new THREE.PointsMaterial({
      size: biome === 'frozen_bastion' || biome === 'autumn_forest' ? 0.35 : 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.weatherParticles = new THREE.Points(geo, mat);
    this.group.add(this.weatherParticles);
  }

  public spawnHitSparkle(x: number, y: number, z: number, color: number = 0xfacc15, count: number = 8) {
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1.0 });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + 0.5, z);
      this.group.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        2 + Math.random() * 4,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity: vel,
        lifetime: 0,
        maxLifetime: 0.35 + Math.random() * 0.2,
        startScale: 1.0,
        endScale: 0.0,
        rotSpeed: (Math.random() - 0.5) * 10
      });
    }
  }

  public spawnExplosion(x: number, y: number, z: number, radius: number = 3.5, color: number = 0xf97316) {
    // Expanding Ring Wave
    const ringGeo = new THREE.RingGeometry(0.1, 0.6, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, y + 0.1, z);
    this.group.add(ring);

    this.particles.push({
      mesh: ring,
      velocity: new THREE.Vector3(0, 0, 0),
      lifetime: 0,
      maxLifetime: 0.5,
      startScale: 0.5,
      endScale: radius * 1.5,
      rotSpeed: 0
    });

    // Fire Spores
    this.spawnHitSparkle(x, y + 0.5, z, color, 20);
  }

  public spawnWhirlwindArc(x: number, z: number) {
    const torusGeo = new THREE.TorusGeometry(2.5, 0.15, 6, 24);
    const torusMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.85 });
    const arc = new THREE.Mesh(torusGeo, torusMat);
    arc.rotation.x = Math.PI / 2;
    arc.position.set(x, 1.0, z);
    this.group.add(arc);

    this.particles.push({
      mesh: arc,
      velocity: new THREE.Vector3(0, 1.2, 0),
      lifetime: 0,
      maxLifetime: 0.45,
      startScale: 0.6,
      endScale: 2.2,
      rotSpeed: 15
    });
  }

  public spawnHolyAura(x: number, z: number) {
    // Holy Healing Column
    const cylGeo = new THREE.CylinderGeometry(2.8, 2.8, 5, 16, 1, true);
    const cylMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.set(x, 2.5, z);
    this.group.add(cyl);

    this.particles.push({
      mesh: cyl,
      velocity: new THREE.Vector3(0, 0.5, 0),
      lifetime: 0,
      maxLifetime: 1.0,
      startScale: 1.0,
      endScale: 1.5,
      rotSpeed: 3
    });
  }

  public update(delta: number) {
    // 1. Update weather particles
    if (this.weatherGeo && this.weatherParticles) {
      const pos = this.weatherGeo.attributes.position as THREE.BufferAttribute;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i);
        let x = pos.getX(i);
        let z = pos.getZ(i);

        if (this.currentWeatherType === 'frozen_bastion') {
          y -= delta * 9;
          x += delta * 4;
        } else if (this.currentWeatherType === 'autumn_forest') {
          y -= delta * 3;
          x += Math.sin(y * 2) * delta * 1.5;
        } else if (this.currentWeatherType === 'volcano_abyss') {
          y += delta * 5; // Rising ash embers
          if (y > 18) y = 0.5;
        } else {
          y -= delta * 4;
        }

        if (y < 0.2) {
          y = 18;
          x = (Math.random() - 0.5) * 50;
          z = (Math.random() - 0.5) * 50;
        }

        pos.setY(i, y);
        pos.setX(i, x);
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    }

    // 2. Update burst particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime += delta;
      const progress = p.lifetime / p.maxLifetime;

      if (progress >= 1.0) {
        this.group.remove(p.mesh);
        p.mesh.geometry?.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics motion
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= delta * 9.8; // Gravity

      // Scale transition
      const curScale = p.startScale + (p.endScale - p.startScale) * progress;
      p.mesh.scale.set(curScale, curScale, curScale);

      // Rotation
      if (p.rotSpeed !== 0) {
        p.mesh.rotation.y += p.rotSpeed * delta;
      }

      // Fade out opacity
      const mat = (p.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat && mat.transparent) {
        mat.opacity = Math.max(0, 1.0 - progress);
      }
    }
  }

  public clearAll() {
    this.particles.forEach(p => {
      this.group.remove(p.mesh);
      p.mesh.geometry?.dispose();
    });
    this.particles = [];
  }
}
