import * as THREE from 'three';

export class MantisModel {
  public group: THREE.Group;
  
  // Model parts for animation
  private headGroup!: THREE.Group;
  private abdomen!: THREE.Mesh;
  private leftArmGroup!: THREE.Group;
  private rightArmGroup!: THREE.Group;
  private leftForearmGroup!: THREE.Group;
  private rightForearmGroup!: THREE.Group;
  
  private leftWings!: THREE.Group;
  private rightWings!: THREE.Group;
  
  private legs: THREE.Group[] = [];
  
  // Materials
  private chitinMat!: THREE.MeshStandardMaterial;
  private bladeMat!: THREE.MeshStandardMaterial;
  private eyeMat!: THREE.MeshStandardMaterial;
  private wingMat!: THREE.MeshPhysicalMaterial;
  
  // Animation state
  private walkTime: number = 0;
  private attackType: 'none' | 'slash1' | 'slash2' | 'dual' | 'leap' = 'none';
  private attackProgress: number = 0; // 0 to 1
  
  constructor() {
    this.group = new THREE.Group();
    this.initMaterials();
    this.buildModel();
  }

  private initMaterials() {
    // Vibrant emerald predatory mantis chitin
    this.chitinMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.38,
      metalness: 0.22,
      flatShading: false
    });

    // Sharp razor blade edge
    this.bladeMat = new THREE.MeshStandardMaterial({
      color: 0x86efac,
      emissive: 0x15803d,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.6
    });

    // Compound eyes
    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x059669,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9
    });

    // Translucent iridescent wings
    this.wingMat = new THREE.MeshPhysicalMaterial({
      color: 0xa7f3d0,
      transmission: 0.75,
      opacity: 0.85,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.5,
      side: THREE.DoubleSide
    });
  }

  private buildModel() {
    // 1. Thorax (Main Central Pivot)
    const thoraxGeo = new THREE.CylinderGeometry(0.32, 0.45, 1.8, 8);
    const thorax = new THREE.Mesh(thoraxGeo, this.chitinMat);
    thorax.rotation.x = Math.PI / 3.2;
    thorax.position.set(0, 1.1, -0.2);
    thorax.castShadow = true;
    thorax.receiveShadow = true;
    this.group.add(thorax);

    // Pronotum (Shield behind head)
    const pronotumGeo = new THREE.ConeGeometry(0.48, 1.4, 7);
    const pronotum = new THREE.Mesh(pronotumGeo, this.chitinMat);
    pronotum.rotation.x = -Math.PI / 3.2;
    pronotum.position.set(0, 1.6, 0.45);
    pronotum.castShadow = true;
    this.group.add(pronotum);

    // 2. Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 2.1, 0.85);

    // Triangular Head
    const headGeo = new THREE.ConeGeometry(0.42, 0.65, 5);
    const headMesh = new THREE.Mesh(headGeo, this.chitinMat);
    headMesh.rotation.x = -Math.PI / 2.2;
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Compound Eyes
    const eyeGeo = new THREE.SphereGeometry(0.22, 10, 10);
    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    leftEye.position.set(0.32, 0.12, 0.05);
    leftEye.scale.set(1, 1.3, 1.2);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    rightEye.position.set(-0.32, 0.12, 0.05);
    rightEye.scale.set(1, 1.3, 1.2);
    this.headGroup.add(rightEye);

    // Antennae
    const antGeo = new THREE.CylinderGeometry(0.02, 0.04, 1.2, 5);
    const leftAnt = new THREE.Mesh(antGeo, this.chitinMat);
    leftAnt.position.set(0.18, 0.6, 0.3);
    leftAnt.rotation.set(-0.4, 0, -0.3);
    this.headGroup.add(leftAnt);

    const rightAnt = new THREE.Mesh(antGeo, this.chitinMat);
    rightAnt.position.set(-0.18, 0.6, 0.3);
    rightAnt.rotation.set(-0.4, 0, 0.3);
    this.headGroup.add(rightAnt);

    // Mandibles
    const mandGeo = new THREE.ConeGeometry(0.08, 0.3, 4);
    const leftMand = new THREE.Mesh(mandGeo, this.bladeMat);
    leftMand.position.set(0.1, -0.28, 0.2);
    leftMand.rotation.set(0.5, 0, -0.4);
    this.headGroup.add(leftMand);

    const rightMand = new THREE.Mesh(mandGeo, this.bladeMat);
    rightMand.position.set(-0.1, -0.28, 0.2);
    rightMand.rotation.set(0.5, 0, 0.4);
    this.headGroup.add(rightMand);

    this.group.add(this.headGroup);

    // 3. Abdomen
    const abdGeo = new THREE.ConeGeometry(0.52, 2.6, 7);
    this.abdomen = new THREE.Mesh(abdGeo, this.chitinMat);
    this.abdomen.position.set(0, 0.8, -1.5);
    this.abdomen.rotation.x = -Math.PI / 1.8;
    this.abdomen.castShadow = true;
    this.group.add(this.abdomen);

    // 4. Raptorial Forelegs
    const arms = this.buildRaptorialArms();
    this.leftArmGroup = arms.leftArm;
    this.rightArmGroup = arms.rightArm;
    this.leftForearmGroup = arms.leftForearm;
    this.rightForearmGroup = arms.rightForearm;
    this.group.add(this.leftArmGroup);
    this.group.add(this.rightArmGroup);

    // 5. Walking Legs
    this.buildWalkingLegs();

    // 6. Wings
    this.buildWings();

    // Base scale
    this.group.scale.set(1.4, 1.4, 1.4);
  }

  private buildRaptorialArms() {
    const leftArm = new THREE.Group();
    leftArm.position.set(0.4, 1.8, 0.5);

    const femurGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.3, 6);
    const leftFemur = new THREE.Mesh(femurGeo, this.chitinMat);
    leftFemur.position.set(0, 0.6, 0);
    leftFemur.rotation.x = -0.4;
    leftFemur.castShadow = true;
    leftArm.add(leftFemur);

    for (let i = 0; i < 4; i++) {
      const spineGeo = new THREE.ConeGeometry(0.04, 0.22, 4);
      const spine = new THREE.Mesh(spineGeo, this.bladeMat);
      spine.position.set(0.1, 0.3 + i * 0.2, 0.08);
      spine.rotation.z = -Math.PI / 3;
      leftArm.add(spine);
    }

    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, 1.2, 0.2);

    const tibiaGeo = new THREE.CylinderGeometry(0.09, 0.13, 1.4, 6);
    const leftTibia = new THREE.Mesh(tibiaGeo, this.chitinMat);
    leftTibia.position.set(0, -0.6, 0.2);
    leftTibia.rotation.x = 0.9;
    leftTibia.castShadow = true;
    leftForearm.add(leftTibia);

    const leftBlade = new THREE.Group();
    leftBlade.position.set(0, -1.2, 0.5);
    const bladeCurve = new THREE.CylinderGeometry(0.04, 0.14, 1.2, 5);
    const bladeMesh = new THREE.Mesh(bladeCurve, this.bladeMat);
    bladeMesh.rotation.z = -0.3;
    bladeMesh.rotation.x = -0.6;
    bladeMesh.scale.set(0.6, 1.2, 2.2);
    bladeMesh.castShadow = true;
    leftBlade.add(bladeMesh);

    leftForearm.add(leftBlade);
    leftArm.add(leftForearm);

    const rightArm = new THREE.Group();
    rightArm.position.set(-0.4, 1.8, 0.5);

    const rightFemur = new THREE.Mesh(femurGeo, this.chitinMat);
    rightFemur.position.set(0, 0.6, 0);
    rightFemur.rotation.x = -0.4;
    rightFemur.castShadow = true;
    rightArm.add(rightFemur);

    for (let i = 0; i < 4; i++) {
      const spineGeo = new THREE.ConeGeometry(0.04, 0.22, 4);
      const spine = new THREE.Mesh(spineGeo, this.bladeMat);
      spine.position.set(-0.1, 0.3 + i * 0.2, 0.08);
      spine.rotation.z = Math.PI / 3;
      rightArm.add(spine);
    }

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, 1.2, 0.2);

    const rightTibia = new THREE.Mesh(tibiaGeo, this.chitinMat);
    rightTibia.position.set(0, -0.6, 0.2);
    rightTibia.rotation.x = 0.9;
    rightTibia.castShadow = true;
    rightForearm.add(rightTibia);

    const rightBlade = new THREE.Group();
    rightBlade.position.set(0, -1.2, 0.5);
    const rightBladeMesh = new THREE.Mesh(bladeCurve, this.bladeMat);
    rightBladeMesh.rotation.z = 0.3;
    rightBladeMesh.rotation.x = -0.6;
    rightBladeMesh.scale.set(0.6, 1.2, 2.2);
    rightBladeMesh.castShadow = true;
    rightBlade.add(rightBladeMesh);

    rightForearm.add(rightBlade);
    rightArm.add(rightForearm);

    leftArm.rotation.set(0.3, 0.2, -0.4);
    leftForearm.rotation.set(-1.6, 0, 0.3);
    rightArm.rotation.set(0.3, -0.2, 0.4);
    rightForearm.rotation.set(-1.6, 0, -0.3);

    return {
      leftArm,
      rightArm,
      leftForearm,
      rightForearm
    };
  }

  private buildWalkingLegs() {
    const legConfigs = [
      { side: 1, posZ: -0.1, angleY: 0.8 },
      { side: -1, posZ: -0.1, angleY: -0.8 },
      { side: 1, posZ: -0.7, angleY: 1.8 },
      { side: -1, posZ: -0.7, angleY: -1.8 },
    ];

    legConfigs.forEach((cfg) => {
      const legBase = new THREE.Group();
      legBase.position.set(cfg.side * 0.35, 0.9, cfg.posZ);

      const thighGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.4, 5);
      const thigh = new THREE.Mesh(thighGeo, this.chitinMat);
      thigh.position.set(cfg.side * 0.5, 0.2, 0);
      thigh.rotation.z = cfg.side * -1.1;
      thigh.castShadow = true;
      legBase.add(thigh);

      const shinGroup = new THREE.Group();
      shinGroup.position.set(cfg.side * 1.1, 0.6, 0);

      const shinGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.8, 5);
      const shin = new THREE.Mesh(shinGeo, this.chitinMat);
      shin.position.set(cfg.side * 0.3, -0.8, 0);
      shin.rotation.z = cfg.side * 0.4;
      shin.castShadow = true;
      shinGroup.add(shin);

      legBase.add(shinGroup);
      legBase.rotation.y = cfg.angleY;

      this.group.add(legBase);
      this.legs.push(legBase);
    });
  }

  private buildWings() {
    this.leftWings = new THREE.Group();
    this.rightWings = new THREE.Group();

    this.leftWings.position.set(0.15, 1.4, -0.3);
    this.rightWings.position.set(-0.15, 1.4, -0.3);

    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(0.6, 1.2, 0.5, 2.6);
    wingShape.quadraticCurveTo(0.1, 2.8, -0.2, 1.5);
    wingShape.quadraticCurveTo(-0.1, 0.4, 0, 0);

    const wingGeo = new THREE.ShapeGeometry(wingShape);
    const leftWingMesh = new THREE.Mesh(wingGeo, this.wingMat);
    leftWingMesh.rotation.x = -Math.PI / 2.3;
    leftWingMesh.rotation.z = -0.15;
    this.leftWings.add(leftWingMesh);

    const rightWingMesh = new THREE.Mesh(wingGeo, this.wingMat);
    rightWingMesh.rotation.x = -Math.PI / 2.3;
    rightWingMesh.rotation.z = 0.15;
    rightWingMesh.scale.set(-1, 1, 1);
    this.rightWings.add(rightWingMesh);

    this.group.add(this.leftWings);
    this.group.add(this.rightWings);
  }

  public triggerAttack(type: 'slash1' | 'slash2' | 'dual' | 'leap') {
    this.attackType = type;
    this.attackProgress = 0;
  }

  public setStealth(stealthActive: boolean) {
    const opacity = stealthActive ? 0.35 : 1.0;
    this.chitinMat.transparent = stealthActive;
    this.chitinMat.opacity = opacity;
  }

  public setFrenzy(frenzyActive: boolean) {
    if (frenzyActive) {
      this.bladeMat.emissive.setHex(0xd946ef);
      this.eyeMat.emissive.setHex(0xf43f5e);
      this.bladeMat.emissiveIntensity = 1.2;
    } else {
      this.bladeMat.emissive.setHex(0x15803d);
      this.eyeMat.emissive.setHex(0x059669);
      this.bladeMat.emissiveIntensity = 0.35;
    }
  }

  public update(
    delta: number, 
    isMoving: boolean, 
    lookDirection: THREE.Vector3, 
    isDashing: boolean = false, 
    isFrenzy: boolean = false
  ) {
    if (lookDirection.lengthSq() > 0.001) {
      const targetAngle = Math.atan2(lookDirection.x, lookDirection.z);
      let diff = targetAngle - this.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.group.rotation.y += diff * Math.min(1, delta * 18);
    }

    const speedMult = isDashing ? 3.2 : (isMoving ? 1.6 : 0.4);
    this.walkTime += delta * 9 * speedMult;

    this.abdomen.rotation.z = Math.sin(this.walkTime * 0.5) * 0.08;
    this.abdomen.rotation.x = -Math.PI / 1.8 + Math.cos(this.walkTime * 0.8) * 0.06;

    this.headGroup.rotation.y = Math.sin(this.walkTime * 0.4) * 0.12;
    this.headGroup.rotation.x = Math.cos(this.walkTime * 0.6) * 0.08;

    if (isMoving) {
      this.legs.forEach((leg, i) => {
        const offset = (i % 2 === 0 ? 0 : Math.PI);
        leg.rotation.z = Math.sin(this.walkTime + offset) * 0.28;
        leg.position.y = 0.9 + Math.max(0, Math.sin(this.walkTime + offset)) * 0.25;
      });
    } else {
      this.legs.forEach((leg) => {
        leg.rotation.z *= 0.85;
        leg.position.y = THREE.MathUtils.lerp(leg.position.y, 0.9, 0.15);
      });
    }

    if (isDashing || isFrenzy || this.attackType === 'leap') {
      const flutter = Math.sin(performance.now() * 0.06) * 0.8;
      this.leftWings.rotation.z = -0.4 + flutter;
      this.rightWings.rotation.z = 0.4 - flutter;
      this.leftWings.rotation.x = -Math.PI / 4 + flutter * 0.3;
      this.rightWings.rotation.x = -Math.PI / 4 + flutter * 0.3;
    } else {
      this.leftWings.rotation.z = THREE.MathUtils.lerp(this.leftWings.rotation.z, 0, 0.1);
      this.rightWings.rotation.z = THREE.MathUtils.lerp(this.rightWings.rotation.z, 0, 0.1);
      this.leftWings.rotation.x = THREE.MathUtils.lerp(this.leftWings.rotation.x, -Math.PI / 2.3, 0.1);
      this.rightWings.rotation.x = THREE.MathUtils.lerp(this.rightWings.rotation.x, -Math.PI / 2.3, 0.1);
    }

    if (this.attackType !== 'none') {
      this.attackProgress += delta * 6.5;

      if (this.attackProgress >= 1) {
        this.attackType = 'none';
        this.attackProgress = 0;
      } else {
        const p = this.attackProgress;
        const swing = Math.sin(p * Math.PI);

        if (this.attackType === 'slash1') {
          this.rightArmGroup.rotation.set(0.3 + swing * 0.9, -0.2 - swing * 1.1, 0.4 - swing * 0.8);
          this.rightForearmGroup.rotation.set(-1.6 + swing * 2.2, 0, -0.3 + swing * 0.7);
          this.leftArmGroup.rotation.set(0.4, 0.3, -0.5);
        } else if (this.attackType === 'slash2') {
          this.leftArmGroup.rotation.set(0.3 + swing * 0.9, 0.2 + swing * 1.1, -0.4 + swing * 0.8);
          this.leftForearmGroup.rotation.set(-1.6 + swing * 2.2, 0, 0.3 - swing * 0.7);
          this.rightArmGroup.rotation.set(0.4, -0.3, 0.5);
        } else if (this.attackType === 'dual') {
          this.leftArmGroup.rotation.set(0.2 + swing * 1.2, 0.1 + swing * 0.8, -0.3 + swing * 0.9);
          this.rightArmGroup.rotation.set(0.2 + swing * 1.2, -0.1 - swing * 0.8, 0.3 - swing * 0.9);
          this.leftForearmGroup.rotation.set(-1.6 + swing * 2.4, 0, 0.2);
          this.rightForearmGroup.rotation.set(-1.6 + swing * 2.4, 0, -0.2);
        } else if (this.attackType === 'leap') {
          this.leftArmGroup.rotation.set(-0.8 + swing * 1.4, 0.5, -0.8);
          this.rightArmGroup.rotation.set(-0.8 + swing * 1.4, -0.5, 0.8);
          this.leftForearmGroup.rotation.set(0.2, 0, 0);
          this.rightForearmGroup.rotation.set(0.2, 0, 0);
        }
      }
    } else {
      const idleBob = Math.sin(this.walkTime * 0.5) * 0.05;
      this.leftArmGroup.rotation.set(0.3 + idleBob, 0.2, -0.4);
      this.leftForearmGroup.rotation.set(-1.6 + idleBob, 0, 0.3);
      this.rightArmGroup.rotation.set(0.3 - idleBob, -0.2, 0.4);
      this.rightForearmGroup.rotation.set(-1.6 - idleBob, 0, -0.3);
    }
  }
}
