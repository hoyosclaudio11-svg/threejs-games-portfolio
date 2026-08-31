import * as THREE from "three";

/**
 * El nido sagrado que la mantis debe proteger. Nido orgánico formado por
 * una masa de vainas (huevos) con un núcleo brillante en el centro.
 */
export class Nest {
  group = new THREE.Group();
  core: THREE.Mesh;
  private coreMat: THREE.MeshStandardMaterial;
  private light: THREE.PointLight;
  private disposables: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];
  private hitFlash = 0;
  private t = 0;

  hp: number;
  readonly maxHp: number;
  readonly radius = 3.4;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.group.position.copy(position);
    this.maxHp = 1000;
    this.hp = this.maxHp;

    // Base / montículo
    const baseGeo = new THREE.SphereGeometry(this.radius, 28, 18);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x3a4a2a,
      roughness: 1,
      flatShading: true,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.scale.set(1.1, 0.62, 1.1);
    base.position.y = 0.4;
    base.castShadow = true;
    base.receiveShadow = true;
    this.group.add(base);
    this.disposables.push({ geo: baseGeo, mat: baseMat });

    // Vainas de huevos alrededor
    const podMat = new THREE.MeshStandardMaterial({
      color: 0xc9e8a0,
      roughness: 0.6,
      emissive: 0x2a3a14,
      emissiveIntensity: 0.4,
      flatShading: true,
    });
    const podCount = 11;
    for (let i = 0; i < podCount; i++) {
      const ang = (i / podCount) * Math.PI * 2;
      const r = this.radius * 0.55;
      const geo = new THREE.SphereGeometry(0.7 + Math.random() * 0.3, 10, 8);
      const pod = new THREE.Mesh(geo, podMat);
      pod.position.set(Math.cos(ang) * r, 0.9 + Math.random() * 0.4, Math.sin(ang) * r);
      pod.scale.set(1, 1.4, 1);
      pod.castShadow = true;
      this.group.add(pod);
      this.disposables.push({ geo, mat: podMat });
    }

    // Núcleo brillante
    const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0xbdf5a0,
      emissive: 0x8cff5e,
      emissiveIntensity: 1.6,
      roughness: 0.3,
    });
    this.core = new THREE.Mesh(coreGeo, this.coreMat);
    this.core.position.y = 1.7;
    this.group.add(this.core);
    this.disposables.push({ geo: coreGeo, mat: this.coreMat });

    // Halo
    const haloGeo = new THREE.SphereGeometry(1.5, 20, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xa6ff8a,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.y = 1.7;
    this.group.add(halo);
    this.disposables.push({ geo: haloGeo, mat: haloMat });

    // Luz cálida
    this.light = new THREE.PointLight(0x9dff6a, 26, 26, 2);
    this.light.position.y = 2.2;
    this.group.add(this.light);

    scene.add(this.group);
  }

  get position(): THREE.Vector3 {
    return this.group.position;
  }

  takeDamage(dmg: number): boolean {
    this.hp -= dmg;
    this.hitFlash = 1;
    if (this.hp <= 0) {
      this.hp = 0;
      return true;
    }
    return false;
  }

  update(dt: number): void {
    this.t += dt;
    this.core.rotation.y += dt * 0.5;
    this.core.rotation.x += dt * 0.2;
    const pulse = 0.5 + Math.sin(this.t * 2.2) * 0.5;
    const lowHp = this.hp / this.maxHp < 0.4;
    const speed = lowHp ? 6 : 2.2;
    const f = lowHp ? 0.5 + Math.sin(this.t * speed) * 0.5 : pulse;
    const flash = Math.max(0, this.hitFlash);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3);
    this.coreMat.emissiveIntensity = 1.3 + f * 0.8 + flash * 3;
    this.light.intensity = 22 + f * 10 + flash * 30;
    const s = 1 + flash * 0.12 + Math.sin(this.t * speed) * 0.03;
    this.core.scale.setScalar(s);
  }

  dispose(): void {
    this.group.parent?.remove(this.group);
    this.disposables.forEach((d) => {
      d.geo.dispose();
      d.mat.dispose();
    });
  }
}
