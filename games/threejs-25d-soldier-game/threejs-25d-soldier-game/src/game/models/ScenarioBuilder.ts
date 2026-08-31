import * as THREE from 'three';
import { ScenarioBiome } from '../../types/game';

export class ScenarioBuilder {
  public scene: THREE.Scene;
  public environmentGroup: THREE.Group;
  public particleGroup: THREE.Group;
  public lightsGroup: THREE.Group;
  
  private ambientLight: THREE.AmbientLight | null = null;
  private dirLight: THREE.DirectionalLight | null = null;
  private weatherParticles: THREE.Points | null = null;
  private particlePositions: Float32Array | null = null;
  private particleVelocities: Float32Array | null = null;
  private particleCount: number = 600;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.environmentGroup = new THREE.Group();
    this.particleGroup = new THREE.Group();
    this.lightsGroup = new THREE.Group();

    this.scene.add(this.environmentGroup);
    this.scene.add(this.particleGroup);
    this.scene.add(this.lightsGroup);
  }

  public buildBiome(biome: ScenarioBiome) {
    // Clear previous biome objects
    this.clear();

    // 1. Configure Fog
    this.scene.fog = new THREE.FogExp2(biome.fogColor, biome.fogDensity);

    // 2. Configure Lighting
    this.ambientLight = new THREE.AmbientLight(biome.ambientLightColor, biome.ambientIntensity);
    this.lightsGroup.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(biome.directionalLightColor, biome.directionalIntensity);
    this.dirLight.position.set(10, 20, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.lightsGroup.add(this.dirLight);

    // 3. Ground Platform (Length 80 along X, Width 14 along Z)
    this.buildGround(biome);

    // 4. Elevated Platforms and Tactical Cover
    this.buildPlatformsAndCover(biome);

    // 5. Biome Specific Scenery & Backdrops
    this.buildBackdropScenery(biome);

    // 6. Dynamic Weather Particle System
    this.buildWeatherParticles(biome);
  }

  private clear() {
    while (this.environmentGroup.children.length > 0) {
      const obj = this.environmentGroup.children[0];
      this.environmentGroup.remove(obj);
    }
    while (this.particleGroup.children.length > 0) {
      const obj = this.particleGroup.children[0];
      this.particleGroup.remove(obj);
    }
    while (this.lightsGroup.children.length > 0) {
      const obj = this.lightsGroup.children[0];
      this.lightsGroup.remove(obj);
    }
    this.weatherParticles = null;
    this.particlePositions = null;
    this.particleVelocities = null;
  }

  private buildGround(biome: ScenarioBiome) {
    // Main ground deck
    const groundGeo = new THREE.BoxGeometry(90, 4, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: biome.groundColor,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -2, 0);
    ground.receiveShadow = true;
    this.environmentGroup.add(ground);

    // Decorative grid edge lines
    const gridGeo = new THREE.PlaneGeometry(90, 16, 45, 8);
    gridGeo.rotateX(-Math.PI / 2);
    const gridMat = new THREE.MeshBasicMaterial({
      color: biome.ambientLightColor,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.set(0, 0.02, 0);
    this.environmentGroup.add(gridMesh);

    // Side warning / boundary light strips
    [-7, 7].forEach(zPos => {
      const stripGeo = new THREE.BoxGeometry(90, 0.2, 0.3);
      const stripMat = new THREE.MeshBasicMaterial({ color: biome.directionalLightColor });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, 0.1, zPos);
      this.environmentGroup.add(strip);
    });
  }

  private buildPlatformsAndCover(biome: ScenarioBiome) {
    const platMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.3,
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: biome.ambientLightColor });

    // 2 Elevated platforms on left and right for tactical vertical gameplay
    const platformLocations = [
      { x: -14, y: 3.2, z: 0, w: 9, h: 0.6, d: 4 },
      { x: 14, y: 3.2, z: 0, w: 9, h: 0.6, d: 4 },
      { x: 0, y: 5.5, z: 0, w: 8, h: 0.6, d: 4 },
    ];

    platformLocations.forEach(p => {
      const platGeo = new THREE.BoxGeometry(p.w, p.h, p.d);
      const platMesh = new THREE.Mesh(platGeo, platMat);
      platMesh.position.set(p.x, p.y, p.z);
      platMesh.receiveShadow = true;
      platMesh.castShadow = true;
      this.environmentGroup.add(platMesh);

      // Neon trim on platform edge
      const trimGeo = new THREE.BoxGeometry(p.w + 0.1, 0.1, p.d + 0.1);
      const trim = new THREE.Mesh(trimGeo, glowMat);
      trim.position.set(p.x, p.y - 0.2, p.z);
      this.environmentGroup.add(trim);

      // Support pillars
      [-p.w / 2.5, p.w / 2.5].forEach(xOff => {
        const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, p.y, 8);
        const pillar = new THREE.Mesh(pillarGeo, platMat);
        pillar.position.set(p.x + xOff, p.y / 2, p.z);
        this.environmentGroup.add(pillar);
      });
    });

    // Barricades / Crates on ground
    const cratePositions = [
      { x: -24, z: -2 },
      { x: -8, z: 2 },
      { x: 8, z: -2 },
      { x: 24, z: 2 },
    ];

    cratePositions.forEach(pos => {
      const crateGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
      const crateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(pos.x, 0.8, pos.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.environmentGroup.add(crate);
    });
  }

  private buildBackdropScenery(biome: ScenarioBiome) {
    const wave = biome.waveNumber;

    if (wave === 1) {
      // --- CYBERPUNK CITY ---
      // Skyscrapers in background
      for (let i = -6; i <= 6; i++) {
        const h = 20 + Math.random() * 25;
        const w = 6 + Math.random() * 4;
        const towerGeo = new THREE.BoxGeometry(w, h, 6);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(i * 7 + (Math.random() * 2 - 1), h / 2, -14 - Math.random() * 6);
        this.environmentGroup.add(tower);

        // Glowing billboard panels
        if (i % 2 === 0) {
          const signGeo = new THREE.PlaneGeometry(4, 2);
          const signColor = i % 4 === 0 ? 0x38bdf8 : 0xf43f5e;
          const signMat = new THREE.MeshBasicMaterial({ color: signColor, side: THREE.DoubleSide });
          const sign = new THREE.Mesh(signGeo, signMat);
          sign.position.set(tower.position.x, 8 + Math.random() * 8, tower.position.z + 3.1);
          this.environmentGroup.add(sign);
        }
      }
    } else if (wave === 2) {
      // --- MARS CANYON ---
      // Red Sandstone Monoliths & Ribcages
      for (let i = -7; i <= 7; i++) {
        const rockGeo = new THREE.ConeGeometry(3 + Math.random() * 2, 14 + Math.random() * 10, 5);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.95 });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(i * 6, (14 + Math.random() * 10) / 2 - 2, -14 - Math.random() * 4);
        rock.rotation.y = Math.random() * Math.PI;
        this.environmentGroup.add(rock);
      }

      // Giant Alien Ribcages
      [-15, 15].forEach(xPos => {
        const ribGroup = new THREE.Group();
        ribGroup.position.set(xPos, 0, -8);
        for (let r = 0; r < 5; r++) {
          const ribGeo = new THREE.TorusGeometry(3.5, 0.3, 6, 12, Math.PI);
          const ribMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
          const rib = new THREE.Mesh(ribGeo, ribMat);
          rib.position.set(r * 2 - 4, 0, 0);
          rib.rotation.y = Math.PI / 2;
          ribGroup.add(rib);
        }
        this.environmentGroup.add(ribGroup);
      });
    } else if (wave === 3) {
      // --- TOXIC REFINERY ---
      // Giant Glowing Chemical Tanks & Waste Pipes
      for (let i = -5; i <= 5; i++) {
        const tankGeo = new THREE.CylinderGeometry(2.5, 2.5, 16, 16);
        const tankMat = new THREE.MeshStandardMaterial({ color: 0x14532d, metalness: 0.6 });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(i * 8, 8, -15);
        this.environmentGroup.add(tank);

        // Glowing radioactive toxic core
        const coreGeo = new THREE.SphereGeometry(1.2, 12, 12);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(i * 8, 6, -12);
        this.environmentGroup.add(core);

        const pointL = new THREE.PointLight(0x4ade80, 1.5, 10);
        pointL.position.copy(core.position);
        this.lightsGroup.add(pointL);
      }
    } else if (wave === 4) {
      // --- ARCTIC BASE ---
      // Crystalline Ice Spires & Metallic Bunkers
      for (let i = -7; i <= 7; i++) {
        const spireGeo = new THREE.OctahedronGeometry(3.5, 0);
        spireGeo.scale(0.8, 4.0, 0.8);
        const spireMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.1,
          metalness: 0.3,
          transparent: true,
          opacity: 0.85
        });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(i * 6, 6, -14 - Math.random() * 5);
        this.environmentGroup.add(spire);
      }
    } else if (wave === 5) {
      // --- LAVA FOUNDRY ---
      // Magma River in Background and Industrial Chimneys
      for (let i = -6; i <= 6; i++) {
        const chimneyGeo = new THREE.CylinderGeometry(1.2, 2.2, 18, 12);
        const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 });
        const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
        chimney.position.set(i * 7, 9, -15);
        this.environmentGroup.add(chimney);

        // Lava glow spout
        const lavaGlowGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.4, 12);
        const lavaGlow = new THREE.Mesh(lavaGlowGeo, new THREE.MeshBasicMaterial({ color: 0xf97316 }));
        lavaGlow.position.set(i * 7, 18, -15);
        this.environmentGroup.add(lavaGlow);
      }
    } else if (wave === 6) {
      // --- ALIEN HIVE ---
      // Organic Pulsing Pods & Bio-structures
      for (let i = -8; i <= 8; i++) {
        const eggGeo = new THREE.SphereGeometry(1.8, 12, 12);
        eggGeo.scale(1.0, 1.8, 1.0);
        const eggMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.3 });
        const egg = new THREE.Mesh(eggGeo, eggMat);
        egg.position.set(i * 5, 2, -12 - Math.random() * 4);
        this.environmentGroup.add(egg);

        const veinGeo = new THREE.TorusGeometry(2.2, 0.2, 6, 16);
        const vein = new THREE.Mesh(veinGeo, new THREE.MeshBasicMaterial({ color: 0xc084fc }));
        vein.position.copy(egg.position);
        this.environmentGroup.add(vein);
      }
    } else if (wave === 7) {
      // --- ORBITAL DEFENSE STATION ---
      // Space Backdrop, Giant Earth sphere & solar arrays
      const earthGeo = new THREE.SphereGeometry(18, 24, 24);
      const earthMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.8 });
      const earth = new THREE.Mesh(earthGeo, earthMat);
      earth.position.set(10, 14, -38);
      this.environmentGroup.add(earth);

      // Starry background points
      const starsGeo = new THREE.BufferGeometry();
      const starVerts = [];
      for (let s = 0; s < 400; s++) {
        starVerts.push(
          (Math.random() - 0.5) * 120,
          (Math.random() - 0.5) * 60 + 20,
          -45 - Math.random() * 20
        );
      }
      starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
      const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8 }));
      this.environmentGroup.add(stars);
    } else {
      // --- VOID DIMENSION (Wave 8) ---
      // Swirling Void Monoliths & Black Hole Ring
      const blackHoleRingGeo = new THREE.TorusGeometry(12, 1.2, 16, 40);
      const blackHoleRing = new THREE.Mesh(blackHoleRingGeo, new THREE.MeshBasicMaterial({ color: 0xe879f9, wireframe: true }));
      blackHoleRing.position.set(0, 16, -26);
      this.environmentGroup.add(blackHoleRing);

      for (let i = -6; i <= 6; i++) {
        const shardGeo = new THREE.OctahedronGeometry(2.5, 0);
        shardGeo.scale(0.8, 3.2, 0.8);
        const shard = new THREE.Mesh(shardGeo, new THREE.MeshBasicMaterial({ color: 0xc026d3, wireframe: true }));
        shard.position.set(i * 7, 8 + Math.sin(i) * 6, -18);
        this.environmentGroup.add(shard);
      }
    }
  }

  private buildWeatherParticles(biome: ScenarioBiome) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.particleCount * 3);
    const vel = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18;

      // Velocities depending on weather
      if (biome.weatherEffect === 'rain') {
        vel[i * 3 + 0] = -4.0;
        vel[i * 3 + 1] = -25.0;
        vel[i * 3 + 2] = 0;
      } else if (biome.weatherEffect === 'sandstorm') {
        vel[i * 3 + 0] = -18.0;
        vel[i * 3 + 1] = -2.0;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 2;
      } else if (biome.weatherEffect === 'blizzard') {
        vel[i * 3 + 0] = -12.0;
        vel[i * 3 + 1] = -14.0;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 3;
      } else if (biome.weatherEffect === 'lava_embers') {
        vel[i * 3 + 0] = (Math.random() - 0.5) * 3;
        vel[i * 3 + 1] = 6.0 + Math.random() * 4;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 3;
      } else {
        // Spores / Void particles floating
        vel[i * 3 + 0] = (Math.random() - 0.5) * 2;
        vel[i * 3 + 1] = (Math.random() - 0.5) * 2;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particlePositions = pos;
    this.particleVelocities = vel;

    const particleColor = new THREE.Color(biome.ambientLightColor);
    const pMat = new THREE.PointsMaterial({
      color: particleColor,
      size: biome.weatherEffect === 'rain' ? 0.35 : 0.6,
      transparent: true,
      opacity: 0.7,
    });

    this.weatherParticles = new THREE.Points(geo, pMat);
    this.particleGroup.add(this.weatherParticles);
  }

  public update(delta: number) {
    if (!this.weatherParticles || !this.particlePositions || !this.particleVelocities) return;

    for (let i = 0; i < this.particleCount; i++) {
      this.particlePositions[i * 3 + 0] += this.particleVelocities[i * 3 + 0] * delta;
      this.particlePositions[i * 3 + 1] += this.particleVelocities[i * 3 + 1] * delta;
      this.particlePositions[i * 3 + 2] += this.particleVelocities[i * 3 + 2] * delta;

      // Wrap around bounds
      if (this.particlePositions[i * 3 + 1] < 0) {
        this.particlePositions[i * 3 + 1] = 24;
      } else if (this.particlePositions[i * 3 + 1] > 25) {
        this.particlePositions[i * 3 + 1] = 0.5;
      }

      if (this.particlePositions[i * 3 + 0] < -40) {
        this.particlePositions[i * 3 + 0] = 40;
      } else if (this.particlePositions[i * 3 + 0] > 40) {
        this.particlePositions[i * 3 + 0] = -40;
      }
    }

    this.weatherParticles.geometry.attributes.position.needsUpdate = true;
  }
}
