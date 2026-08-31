import * as THREE from 'three';
import { ARENA_RADIUS } from './constants';

export class Environment {
  public group: THREE.Group;
  public dirLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  public pointLights: THREE.PointLight[] = [];
  public fog!: THREE.FogExp2;

  private pollenParticles!: THREE.Points;
  private pollenGeo!: THREE.BufferGeometry;
  private pollenPositions!: Float32Array;
  private pollenCount: number = 400;

  private mushrooms: THREE.Mesh[] = [];
  private groundMesh!: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    
    this.initLighting(scene);
    this.buildGround();
    this.buildSurroundingProps();
    this.buildFloatingPollen();
  }

  private initLighting(scene: THREE.Scene) {
    // Hemispheric Ambient Light (Rich forest canopy)
    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x14532d, 0.7);
    scene.add(this.hemiLight);

    // Main Sunlight / Moonbeam with shadows
    this.dirLight = new THREE.DirectionalLight(0xfef08a, 1.4);
    this.dirLight.position.set(25, 45, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 120;
    
    const d = ARENA_RADIUS + 8;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    scene.add(this.dirLight);

    // Fog
    this.fog = new THREE.FogExp2(0x062114, 0.015);
    scene.fog = this.fog;
  }

  private buildGround() {
    // Forest ground disc
    const groundGeo = new THREE.CylinderGeometry(ARENA_RADIUS + 4, ARENA_RADIUS + 6, 2, 48);
    
    // Procedural terrain vertex variation
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0.5) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        // Subtle organic undulations
        const bump = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.4 + Math.sin(x * 0.3 + z * 0.2) * 0.2;
        pos.setY(i, y + bump);
      }
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x14341c, // Rich moss green
      roughness: 0.85,
      metalness: 0.1,
      flatShading: false
    });

    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.position.y = -1;
    this.groundMesh.receiveShadow = true;
    this.group.add(this.groundMesh);

    // Arena Perimeter Ring Border
    const borderGeo = new THREE.TorusGeometry(ARENA_RADIUS, 0.8, 12, 64);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x2e1065,
      emissive: 0x10b981,
      emissiveIntensity: 0.2,
      roughness: 0.6
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.rotation.x = Math.PI / 2;
    border.position.y = 0.2;
    this.group.add(border);
  }

  private buildSurroundingProps() {
    // 1. Giant Forest Boulders & Ancient Roots on perimeter
    const rockGeo = new THREE.DodecahedronGeometry(1, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1
    });

    const rootMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.85
    });

    // Place giant boundary elements
    const count = 28;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
      const dist = ARENA_RADIUS + 1 + Math.random() * 3;

      // Giant boundary rock
      const scale = 2.5 + Math.random() * 3.5;
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(Math.cos(angle) * dist, scale * 0.4, Math.sin(angle) * dist);
      rock.scale.set(scale, scale * (0.8 + Math.random() * 0.6), scale);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);

      // Boundary Roots arching over
      if (i % 3 === 0) {
        const rootGeo = new THREE.CylinderGeometry(0.5, 0.9, 8, 7);
        const rootMesh = new THREE.Mesh(rootGeo, rootMat);
        rootMesh.position.set(Math.cos(angle) * (dist - 1), 2, Math.sin(angle) * (dist - 1));
        rootMesh.rotation.set(0.6, angle, 0.4);
        rootMesh.castShadow = true;
        this.group.add(rootMesh);
      }
    }

    // 2. Bioluminescent Mushrooms around the arena
    const mushCapGeo = new THREE.ConeGeometry(1.2, 0.9, 8);
    const mushStemGeo = new THREE.CylinderGeometry(0.2, 0.35, 2, 6);

    const mushColors = [0x06b6d4, 0xa855f7, 0x10b981, 0xf59e0b];

    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * (ARENA_RADIUS - 12);
      const col = mushColors[i % mushColors.length];

      const capMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.7,
        roughness: 0.3
      });

      const mushGroup = new THREE.Group();
      mushGroup.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

      const stem = new THREE.Mesh(mushStemGeo, rockMat);
      stem.position.y = 1;
      mushGroup.add(stem);

      const cap = new THREE.Mesh(mushCapGeo, capMat);
      cap.position.y = 2;
      cap.scale.set(1.1, 0.7, 1.1);
      cap.castShadow = true;
      mushGroup.add(cap);

      this.mushrooms.push(cap);

      // Add a subtle point light to some mushrooms
      if (i % 4 === 0) {
        const pLight = new THREE.PointLight(col, 1.2, 12, 1.5);
        pLight.position.set(0, 2.5, 0);
        mushGroup.add(pLight);
        this.pointLights.push(pLight);
      }

      this.group.add(mushGroup);
    }
  }

  private buildFloatingPollen() {
    this.pollenGeo = new THREE.BufferGeometry();
    this.pollenPositions = new Float32Array(this.pollenCount * 3);

    for (let i = 0; i < this.pollenCount; i++) {
      this.pollenPositions[i * 3] = (Math.random() - 0.5) * ARENA_RADIUS * 2;
      this.pollenPositions[i * 3 + 1] = Math.random() * 8 + 0.5;
      this.pollenPositions[i * 3 + 2] = (Math.random() - 0.5) * ARENA_RADIUS * 2;
    }

    this.pollenGeo.setAttribute('position', new THREE.BufferAttribute(this.pollenPositions, 3));

    // Glowing particle dots
    const pollenMat = new THREE.PointsMaterial({
      color: 0x86efac,
      size: 0.18,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.pollenParticles = new THREE.Points(this.pollenGeo, pollenMat);
    this.group.add(this.pollenParticles);
  }

  public setEnvironmentMood(mood: 'day' | 'sunset' | 'night' | 'toxic_fog' | 'blood_moon') {
    switch (mood) {
      case 'day':
        this.dirLight.color.setHex(0xfef08a);
        this.dirLight.intensity = 1.4;
        this.hemiLight.color.setHex(0x7dd3fc);
        this.hemiLight.groundColor.setHex(0x14532d);
        this.fog.color.setHex(0x062114);
        this.fog.density = 0.012;
        break;
      case 'sunset':
        this.dirLight.color.setHex(0xf97316);
        this.dirLight.intensity = 1.6;
        this.hemiLight.color.setHex(0xfb923c);
        this.hemiLight.groundColor.setHex(0x361a0d);
        this.fog.color.setHex(0x280e05);
        this.fog.density = 0.015;
        break;
      case 'night':
        this.dirLight.color.setHex(0x38bdf8);
        this.dirLight.intensity = 0.8;
        this.hemiLight.color.setHex(0x1e1b4b);
        this.hemiLight.groundColor.setHex(0x022c22);
        this.fog.color.setHex(0x030712);
        this.fog.density = 0.02;
        break;
      case 'toxic_fog':
        this.dirLight.color.setHex(0x84cc16);
        this.dirLight.intensity = 1.1;
        this.hemiLight.color.setHex(0x4ade80);
        this.hemiLight.groundColor.setHex(0x14532d);
        this.fog.color.setHex(0x052e16);
        this.fog.density = 0.028;
        break;
      case 'blood_moon':
        this.dirLight.color.setHex(0xdc2626);
        this.dirLight.intensity = 1.8;
        this.hemiLight.color.setHex(0x7f1d1d);
        this.hemiLight.groundColor.setHex(0x450a0a);
        this.fog.color.setHex(0x1c0505);
        this.fog.density = 0.024;
        break;
    }
  }

  public update(delta: number) {
    // Drift pollen particles
    const pos = this.pollenPositions;
    const time = performance.now() * 0.001;

    for (let i = 0; i < this.pollenCount; i++) {
      const idx = i * 3;
      pos[idx] += Math.sin(time + i) * delta * 1.5;
      pos[idx + 1] += Math.cos(time * 0.8 + i) * delta * 1.0;
      pos[idx + 2] += Math.cos(time + i) * delta * 1.5;

      // Wrap boundaries
      if (pos[idx + 1] < 0.2) pos[idx + 1] = 8;
      if (pos[idx + 1] > 8.5) pos[idx + 1] = 0.3;
      if (Math.hypot(pos[idx], pos[idx + 2]) > ARENA_RADIUS + 2) {
        pos[idx] = (Math.random() - 0.5) * 10;
        pos[idx + 2] = (Math.random() - 0.5) * 10;
      }
    }
    this.pollenGeo.attributes.position.needsUpdate = true;

    // Mushroom subtle breathing glow
    this.mushrooms.forEach((mush, idx) => {
      const mat = mush.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.sin(time * 2 + idx) * 0.25;
    });
  }
}
