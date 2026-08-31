import * as THREE from 'three';

export class NestModel {
  public group: THREE.Group;
  public coreMesh!: THREE.Mesh;
  public shieldMesh!: THREE.Mesh;
  public rootsGroup!: THREE.Group;
  public sentriesGroup!: THREE.Group;
  public sentries: THREE.Mesh[] = [];

  private coreMat!: THREE.MeshStandardMaterial;
  private glowCoreMat!: THREE.MeshPhysicalMaterial;
  private shieldMat!: THREE.MeshPhysicalMaterial;
  private rootMat!: THREE.MeshStandardMaterial;
  private sentryMat!: THREE.MeshStandardMaterial;

  private pulseTime: number = 0;
  private pulseWaveProgress: number = 0;
  private isPulsing: boolean = false;

  constructor() {
    this.group = new THREE.Group();
    this.initMaterials();
    this.buildNest();
  }

  private initMaterials() {
    // Rich organic root bark
    this.rootMat = new THREE.MeshStandardMaterial({
      color: 0x3d2714,
      roughness: 0.85,
      metalness: 0.1
    });

    // Translucent glowing golden/amber egg sac (ooteca)
    this.glowCoreMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
      roughness: 0.25,
      transmission: 0.7,
      thickness: 1.5,
      ior: 1.45,
      transparent: true,
      opacity: 0.95
    });

    // Outer protective egg sac ridges
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.7,
      metalness: 0.2
    });

    // Energy Bio-Shield Bubble
    this.shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      transmission: 0.85,
      transparent: true,
      opacity: 0.45,
      wireframe: false,
      side: THREE.DoubleSide
    });

    // Sentry plant material
    this.sentryMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.4,
      roughness: 0.3
    });
  }

  private buildNest() {
    // 1. Root Base
    this.rootsGroup = new THREE.Group();
    const rootCount = 8;
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI * 2;
      const rootGeo = new THREE.CylinderGeometry(0.2, 0.4, 3.2, 6);
      const root = new THREE.Mesh(rootGeo, this.rootMat);
      root.position.set(Math.cos(angle) * 1.8, 0.5, Math.sin(angle) * 1.8);
      root.rotation.x = Math.sin(angle) * 0.5 + 0.3;
      root.rotation.z = -Math.cos(angle) * 0.5;
      root.castShadow = true;
      root.receiveShadow = true;
      this.rootsGroup.add(root);
    }
    this.group.add(this.rootsGroup);

    // 2. Central Egg Sac (Ooteca)
    const eggGeo = new THREE.SphereGeometry(1.6, 24, 20);
    eggGeo.scale(1.1, 1.4, 1.1);
    this.coreMesh = new THREE.Mesh(eggGeo, this.glowCoreMat);
    this.coreMesh.position.set(0, 1.8, 0);
    this.coreMesh.castShadow = true;
    this.group.add(this.coreMesh);

    // Outer organic ridges
    for (let i = 0; i < 5; i++) {
      const ringGeo = new THREE.TorusGeometry(1.4 - i * 0.15, 0.15, 8, 20);
      const ring = new THREE.Mesh(ringGeo, this.coreMat);
      ring.position.set(0, 0.8 + i * 0.5, 0);
      ring.rotation.x = Math.PI / 2;
      this.group.add(ring);
    }

    // 3. Bio-Shield Sphere
    const shieldGeo = new THREE.SphereGeometry(3.6, 24, 20);
    this.shieldMesh = new THREE.Mesh(shieldGeo, this.shieldMat);
    this.shieldMesh.position.set(0, 1.8, 0);
    this.group.add(this.shieldMesh);

    // 4. Sentries group
    this.sentriesGroup = new THREE.Group();
    this.group.add(this.sentriesGroup);
  }

  public updateSentries(count: number) {
    // Clear old
    while (this.sentriesGroup.children.length > 0) {
      this.sentriesGroup.remove(this.sentriesGroup.children[0]);
    }
    this.sentries = [];

    // Rebuild sentry pods
    for (let i = 0; i < count; i++) {
      const angle = (i / Math.max(1, count)) * Math.PI * 2;
      const sentryPod = new THREE.Group();
      sentryPod.position.set(Math.cos(angle) * 3.8, 0, Math.sin(angle) * 3.8);

      // Pod stem
      const stemGeo = new THREE.CylinderGeometry(0.12, 0.2, 1.6, 6);
      const stem = new THREE.Mesh(stemGeo, this.rootMat);
      stem.position.y = 0.8;
      sentryPod.add(stem);

      // Bulb head
      const headGeo = new THREE.DodecahedronGeometry(0.45);
      const head = new THREE.Mesh(headGeo, this.sentryMat);
      head.position.y = 1.6;
      head.castShadow = true;
      sentryPod.add(head);

      this.sentriesGroup.add(sentryPod);
      this.sentries.push(head);
    }
  }

  public triggerPulseWave() {
    this.isPulsing = true;
    this.pulseWaveProgress = 0;
  }

  public update(delta: number, shieldRatio: number, isUnderAttack: boolean) {
    this.pulseTime += delta;

    // Heartbeat core breathing
    const beat = Math.sin(this.pulseTime * 3) * 0.05 + Math.sin(this.pulseTime * 6) * 0.02;
    this.coreMesh.scale.set(1 + beat, 1 + beat * 1.2, 1 + beat);

    // Color shift on danger
    if (isUnderAttack) {
      this.glowCoreMat.emissive.setHex(0xef4444);
      this.glowCoreMat.emissiveIntensity = 0.8 + Math.sin(this.pulseTime * 12) * 0.4;
    } else {
      this.glowCoreMat.emissive.setHex(0xd97706);
      this.glowCoreMat.emissiveIntensity = 0.5 + beat * 0.5;
    }

    // Shield visibility and pulsation
    if (shieldRatio > 0) {
      this.shieldMesh.visible = true;
      this.shieldMat.opacity = Math.max(0.15, shieldRatio * 0.55);
      this.shieldMesh.rotation.y += delta * 0.4;
      this.shieldMesh.rotation.x += delta * 0.2;
    } else {
      this.shieldMesh.visible = false;
    }

    // Sentries idle animation
    this.sentries.forEach((sentry, idx) => {
      sentry.rotation.y += delta * 2;
      sentry.position.y = 1.6 + Math.sin(this.pulseTime * 2 + idx) * 0.15;
    });

    // Pulse blast wave
    if (this.isPulsing) {
      this.pulseWaveProgress += delta * 2.5;
      if (this.pulseWaveProgress >= 1) {
        this.isPulsing = false;
      }
    }
  }
}
