import * as THREE from 'three';
import { WeaponType } from '../../types/game';

export class SoldierModel {
  public mesh: THREE.Group;
  public torso: THREE.Mesh;
  public head: THREE.Mesh;
  public visor: THREE.Mesh;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public jetpack: THREE.Group;
  public jetpackFlames: THREE.Mesh[];
  public weaponContainer: THREE.Group;
  public muzzleFlash: THREE.PointLight;
  public muzzleMesh: THREE.Mesh;
  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;
  public meleeBlade: THREE.Mesh;

  private primaryColor: THREE.Color;
  private glowColor: THREE.Color;
  private armorMaterial: THREE.MeshStandardMaterial;
  private glowMaterial: THREE.MeshBasicMaterial;
  private darkArmorMaterial: THREE.MeshStandardMaterial;

  public animTime: number = 0;
  public isRunning: boolean = false;
  public isRolling: boolean = false;
  public isJumping: boolean = false;
  public isMeleeing: boolean = false;
  public meleeProgress: number = 0;
  public recoilAmount: number = 0;
  public aimAngle: number = 0; // in radians
  public facingDirection: number = 1; // 1 = right, -1 = left

  constructor(primaryHex: string = '#0284c7', glowHex: string = '#38bdf8') {
    this.primaryColor = new THREE.Color(primaryHex);
    this.glowColor = new THREE.Color(glowHex);

    this.mesh = new THREE.Group();

    // Materials
    this.armorMaterial = new THREE.MeshStandardMaterial({
      color: this.primaryColor,
      roughness: 0.35,
      metalness: 0.75,
    });

    this.darkArmorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.6,
    });

    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: this.glowColor,
    });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
    this.torso = new THREE.Mesh(torsoGeo, this.armorMaterial);
    this.torso.position.y = 1.35;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Armor chest plate detail
    const chestPlateGeo = new THREE.BoxGeometry(0.65, 0.5, 0.15);
    const chestPlate = new THREE.Mesh(chestPlateGeo, this.darkArmorMaterial);
    chestPlate.position.set(0, 0.1, 0.22);
    this.torso.add(chestPlate);

    // Glowing chest emblem / reactor
    const reactorGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
    reactorGeo.rotateX(Math.PI / 2);
    const reactor = new THREE.Mesh(reactorGeo, this.glowMaterial);
    reactor.position.set(0, 0.15, 0.3);
    this.torso.add(reactor);

    // Belt
    const beltGeo = new THREE.BoxGeometry(0.74, 0.15, 0.48);
    const belt = new THREE.Mesh(beltGeo, this.darkArmorMaterial);
    belt.position.set(0, -0.4, 0);
    this.torso.add(belt);

    // Head / Cyber Helmet
    const headGeo = new THREE.BoxGeometry(0.48, 0.5, 0.48);
    this.head = new THREE.Mesh(headGeo, this.darkArmorMaterial);
    this.head.position.set(0, 0.68, 0);
    this.head.castShadow = true;
    this.torso.add(this.head);

    // Glowing Visor
    const visorGeo = new THREE.BoxGeometry(0.42, 0.14, 0.12);
    this.visor = new THREE.Mesh(visorGeo, this.glowMaterial);
    this.visor.position.set(0, 0.05, 0.22);
    this.head.add(this.visor);

    // Helmet antennae / tactical camera
    const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const ant = new THREE.Mesh(antGeo, this.armorMaterial);
    ant.position.set(0.24, 0.25, -0.1);
    this.head.add(ant);

    // Jetpack on back
    this.jetpack = new THREE.Group();
    this.jetpack.position.set(0, 0.1, -0.32);
    
    const packMainGeo = new THREE.BoxGeometry(0.5, 0.6, 0.2);
    const packMain = new THREE.Mesh(packMainGeo, this.darkArmorMaterial);
    this.jetpack.add(packMain);

    // Thruster nozzles
    this.jetpackFlames = [];
    [-0.15, 0.15].forEach(xOff => {
      const nozzleGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.25, 12);
      const nozzle = new THREE.Mesh(nozzleGeo, this.armorMaterial);
      nozzle.position.set(xOff, -0.3, 0);
      this.jetpack.add(nozzle);

      // Jet flame
      const flameGeo = new THREE.ConeGeometry(0.1, 0.4, 8);
      flameGeo.rotateX(Math.PI);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(xOff, -0.5, 0);
      flame.visible = false;
      this.jetpack.add(flame);
      this.jetpackFlames.push(flame);
    });

    this.torso.add(this.jetpack);

    // Arms
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.46, 0.28, 0);
    this.torso.add(this.rightArm);

    const shoulderRGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const shoulderR = new THREE.Mesh(shoulderRGeo, this.armorMaterial);
    this.rightArm.add(shoulderR);

    const armRGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.55, 10);
    armRGeo.translate(0, -0.28, 0);
    const armR = new THREE.Mesh(armRGeo, this.darkArmorMaterial);
    this.rightArm.add(armR);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.46, 0.28, 0);
    this.torso.add(this.leftArm);

    const shoulderLGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const shoulderL = new THREE.Mesh(shoulderLGeo, this.armorMaterial);
    this.leftArm.add(shoulderL);

    const armLGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.55, 10);
    armLGeo.translate(0, -0.28, 0);
    const armL = new THREE.Mesh(armLGeo, this.darkArmorMaterial);
    this.leftArm.add(armL);

    // Weapon mount container attached to right arm
    this.weaponContainer = new THREE.Group();
    this.weaponContainer.position.set(0, -0.45, 0.25);
    this.rightArm.add(this.weaponContainer);

    // Muzzle flash light
    this.muzzleFlash = new THREE.PointLight(0x38bdf8, 0, 10);
    this.muzzleFlash.position.set(0, 0, 1.2);
    this.weaponContainer.add(this.muzzleFlash);

    // Muzzle flash visual mesh
    const muzzleFlashGeo = new THREE.OctahedronGeometry(0.2, 0);
    const muzzleFlashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.muzzleMesh = new THREE.Mesh(muzzleFlashGeo, muzzleFlashMat);
    this.muzzleMesh.position.set(0, 0, 1.2);
    this.muzzleMesh.visible = false;
    this.weaponContainer.add(this.muzzleMesh);

    // Melee Energy Blade
    const bladeGeo = new THREE.BoxGeometry(0.04, 0.8, 0.12);
    bladeGeo.translate(0, 0.4, 0);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    this.meleeBlade = new THREE.Mesh(bladeGeo, bladeMat);
    this.meleeBlade.position.set(-0.15, -0.3, 0.1);
    this.meleeBlade.rotation.x = Math.PI / 4;
    this.meleeBlade.visible = false;
    this.leftArm.add(this.meleeBlade);

    // Legs
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.22, 0.85, 0);
    this.mesh.add(this.rightLeg);

    const legRGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 10);
    legRGeo.translate(0, -0.4, 0);
    const legR = new THREE.Mesh(legRGeo, this.armorMaterial);
    legR.castShadow = true;
    this.rightLeg.add(legR);

    const bootRGeo = new THREE.BoxGeometry(0.24, 0.2, 0.38);
    bootRGeo.translate(0, -0.75, 0.08);
    const bootR = new THREE.Mesh(bootRGeo, this.darkArmorMaterial);
    this.rightLeg.add(bootR);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.22, 0.85, 0);
    this.mesh.add(this.leftLeg);

    const legLGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 10);
    legLGeo.translate(0, -0.4, 0);
    const legL = new THREE.Mesh(legLGeo, this.armorMaterial);
    legL.castShadow = true;
    this.leftLeg.add(legL);

    const bootLGeo = new THREE.BoxGeometry(0.24, 0.2, 0.38);
    bootLGeo.translate(0, -0.75, 0.08);
    const bootL = new THREE.Mesh(bootLGeo, this.darkArmorMaterial);
    this.leftLeg.add(bootL);

    // Flashlight
    this.flashlight = new THREE.SpotLight(0xffffff, 2.5, 30, Math.PI / 5, 0.4, 1.2);
    this.flashlight.position.set(0, 1.6, 0.3);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(5, 1.6, 0);
    this.mesh.add(this.flashlight);
    this.mesh.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    // Build default weapon mesh
    this.buildWeaponMesh('assault_rifle');
  }

  public setColors(primaryHex: string, glowHex: string) {
    this.primaryColor.set(primaryHex);
    this.glowColor.set(glowHex);
    this.armorMaterial.color.set(this.primaryColor);
    this.glowMaterial.color.set(this.glowColor);
    (this.meleeBlade.material as THREE.MeshBasicMaterial).color.set(this.glowColor);
  }

  public buildWeaponMesh(weaponType: WeaponType) {
    // Clear old weapon parts
    while (this.weaponContainer.children.length > 2) { // keep flash and muzzleMesh
      const child = this.weaponContainer.children[this.weaponContainer.children.length - 1];
      if (child !== this.muzzleFlash && child !== this.muzzleMesh) {
        this.weaponContainer.remove(child);
      }
    }

    const gunMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const energyGlowMat = new THREE.MeshBasicMaterial({ color: this.glowColor });

    switch (weaponType) {
      case 'shotgun': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.9), gunMat);
        body.position.set(0, 0, 0.3);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 12), barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.05, 0.7);
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.28), this.armorMaterial);
        pump.position.set(0, -0.05, 0.55);
        this.weaponContainer.add(body, barrel, pump);
        this.muzzleFlash.position.set(0, 0.05, 1.15);
        this.muzzleMesh.position.set(0, 0.05, 1.15);
        break;
      }
      case 'plasma_rifle': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.85), gunMat);
        body.position.set(0, 0, 0.3);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.7, 12), barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.04, 0.7);
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 16), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
        coil.position.set(0, 0.04, 0.6);
        this.weaponContainer.add(body, barrel, coil);
        this.muzzleFlash.color.set(0x34d399);
        this.muzzleFlash.position.set(0, 0.04, 1.1);
        this.muzzleMesh.position.set(0, 0.04, 1.1);
        break;
      }
      case 'minigun': {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 16), gunMat);
        body.rotation.x = Math.PI / 2;
        body.position.set(0, -0.05, 0.25);
        const barrels = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.9, 12), barrelMat);
        barrels.rotation.x = Math.PI / 2;
        barrels.position.set(0, -0.05, 0.75);
        const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.35), this.armorMaterial);
        ammoBox.position.set(-0.2, -0.15, 0.2);
        this.weaponContainer.add(body, barrels, ammoBox);
        this.muzzleFlash.color.set(0xfacc15);
        this.muzzleFlash.position.set(0, -0.05, 1.25);
        this.muzzleMesh.position.set(0, -0.05, 1.25);
        break;
      }
      case 'rocket_launcher': {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 16), gunMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0, 0.1, 0.3);
        const scope = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), energyGlowMat);
        scope.position.set(0, 0.26, 0.2);
        this.weaponContainer.add(tube, scope);
        this.muzzleFlash.color.set(0xef4444);
        this.muzzleFlash.position.set(0, 0.1, 1.05);
        this.muzzleMesh.position.set(0, 0.1, 1.05);
        break;
      }
      case 'laser_beam': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.9), gunMat);
        body.position.set(0, 0, 0.3);
        const lens = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
        lens.position.set(0, 0.04, 0.8);
        this.weaponContainer.add(body, lens);
        this.muzzleFlash.color.set(0xa855f7);
        this.muzzleFlash.position.set(0, 0.04, 0.85);
        this.muzzleMesh.position.set(0, 0.04, 0.85);
        break;
      }
      case 'sniper_railgun': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 1.3), gunMat);
        body.position.set(0, 0.02, 0.5);
        const rails = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.9), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
        rails.position.set(0, 0.08, 0.7);
        this.weaponContainer.add(body, rails);
        this.muzzleFlash.color.set(0x06b6d4);
        this.muzzleFlash.position.set(0, 0.02, 1.2);
        this.muzzleMesh.position.set(0, 0.02, 1.2);
        break;
      }
      default: { // assault rifle
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.7), gunMat);
        body.position.set(0, 0, 0.25);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 10), barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.05, 0.6);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.14), this.darkArmorMaterial);
        mag.position.set(0, -0.16, 0.2);
        mag.rotation.x = -0.2;
        this.weaponContainer.add(body, barrel, mag);
        this.muzzleFlash.color.set(0x38bdf8);
        this.muzzleFlash.position.set(0, 0.05, 0.95);
        this.muzzleMesh.position.set(0, 0.05, 0.95);
        break;
      }
    }
  }

  public triggerMuzzleFlash() {
    this.muzzleFlash.intensity = 3.5;
    this.muzzleMesh.visible = true;
    this.muzzleMesh.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.5, 1 + Math.random() * 0.5);
    this.recoilAmount = 0.35;
  }

  public triggerMelee() {
    this.isMeleeing = true;
    this.meleeProgress = 0;
    this.meleeBlade.visible = true;
  }

  public update(delta: number, vx: number) {
    this.animTime += delta;

    // Decay recoil and muzzle flash
    if (this.recoilAmount > 0) {
      this.recoilAmount = Math.max(0, this.recoilAmount - delta * 3.5);
    }
    if (this.muzzleFlash.intensity > 0) {
      this.muzzleFlash.intensity = Math.max(0, this.muzzleFlash.intensity - delta * 25);
      if (this.muzzleFlash.intensity <= 0.1) {
        this.muzzleMesh.visible = false;
      }
    }

    // Jetpack flame toggle
    this.jetpackFlames.forEach(flame => {
      flame.visible = this.isJumping;
      if (this.isJumping) {
        const scale = 0.8 + Math.sin(this.animTime * 30) * 0.4;
        flame.scale.set(scale, scale * (1 + Math.random() * 0.5), scale);
      }
    });

    // Melee swing animation
    if (this.isMeleeing) {
      this.meleeProgress += delta * 5.0;
      this.leftArm.rotation.x = -Math.sin(this.meleeProgress * Math.PI) * 2.2;
      this.leftArm.rotation.y = Math.cos(this.meleeProgress * Math.PI) * 1.5;
      if (this.meleeProgress >= 1.0) {
        this.isMeleeing = false;
        this.meleeBlade.visible = false;
        this.leftArm.rotation.set(0, 0, 0);
      }
    }

    // Facing direction and 2.5D Aiming Rotation
    this.mesh.rotation.y = this.facingDirection === 1 ? 0 : Math.PI;

    // Arm aiming elevation / angle
    const targetAimAngle = this.aimAngle * this.facingDirection;
    this.rightArm.rotation.x = -targetAimAngle + this.recoilAmount * 0.4;
    this.head.rotation.x = -targetAimAngle * 0.5;

    // Flashlight tracking
    this.flashlightTarget.position.set(
      Math.cos(this.aimAngle) * 10,
      1.6 + Math.sin(this.aimAngle) * 10,
      0
    );

    // Combat Roll Dodge
    if (this.isRolling) {
      this.torso.position.y = 0.8;
      this.mesh.rotation.z -= this.facingDirection * delta * 18;
      this.leftLeg.rotation.x = -1.2;
      this.rightLeg.rotation.x = 1.2;
      return;
    } else {
      this.mesh.rotation.z = 0;
      this.torso.position.y = 1.35;
    }

    // Running / Jumping / Idle Legs Animation
    if (this.isJumping) {
      this.leftLeg.rotation.x = -0.5;
      this.rightLeg.rotation.x = 0.4;
      this.torso.position.y = 1.38;
    } else if (this.isRunning || Math.abs(vx) > 0.5) {
      const legFreq = 14;
      this.leftLeg.rotation.x = Math.sin(this.animTime * legFreq) * 0.75;
      this.rightLeg.rotation.x = -Math.sin(this.animTime * legFreq) * 0.75;
      this.torso.position.y = 1.35 + Math.abs(Math.sin(this.animTime * legFreq)) * 0.08;
      if (!this.isMeleeing) {
        this.leftArm.rotation.x = -Math.sin(this.animTime * legFreq) * 0.6;
      }
    } else {
      // Idle Breathing
      const idle = Math.sin(this.animTime * 3) * 0.03;
      this.torso.position.y = 1.35 + idle;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      if (!this.isMeleeing) {
        this.leftArm.rotation.x = idle * 2;
      }
    }
  }
}
