import * as THREE from 'three';

// Material Cache for performance
const matCache = new Map<string, THREE.Material>();

function getMaterial(color: number | string, roughness: number = 0.5, metalness: number = 0.2, emissive: number = 0x000000, transparent: boolean = false, opacity: number = 1.0): THREE.MeshStandardMaterial {
  const key = `${color}_${roughness}_${metalness}_${emissive}_${transparent}_${opacity}`;
  if (!matCache.has(key)) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive,
      transparent,
      opacity,
      shadowSide: THREE.DoubleSide
    });
    matCache.set(key, mat);
  }
  return matCache.get(key) as THREE.MeshStandardMaterial;
}

export interface CharacterMeshGroup extends THREE.Group {
  userData: {
    leftLeg?: THREE.Object3D;
    rightLeg?: THREE.Object3D;
    leftArm?: THREE.Object3D;
    rightArm?: THREE.Object3D;
    head?: THREE.Object3D;
    weapon?: THREE.Object3D;
    wings?: THREE.Object3D[];
    glowOrb?: THREE.Object3D;
    shield?: THREE.Object3D;
    baseScale?: number;
  };
}

// 1. HERO COMMANDER (Kaelen)
export function createHeroModel(): CharacterMeshGroup {
  const group = new THREE.Group() as CharacterMeshGroup;
  group.userData = {};

  // Body / Armor (Royal Gold & Deep Blue)
  const armorMat = getMaterial(0x1d4ed8, 0.3, 0.4); // Royal Blue
  const goldTrimMat = getMaterial(0xf59e0b, 0.2, 0.7, 0x452500); // Gold Trim
  const skinMat = getMaterial(0xfbcfe8, 0.6, 0.1);
  const capeMat = getMaterial(0xb91c1c, 0.7, 0.1); // Crimson cape

  // Torso
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.8, 0.45);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 1.0;
  torso.castShadow = true;
  group.add(torso);

  // Gold Chest Emblem
  const emblemGeo = new THREE.BoxGeometry(0.35, 0.35, 0.48);
  const emblem = new THREE.Mesh(emblemGeo, goldTrimMat);
  emblem.position.y = 1.0;
  group.add(emblem);

  // Cape
  const capeGeo = new THREE.BoxGeometry(0.65, 0.9, 0.08);
  const cape = new THREE.Mesh(capeGeo, capeMat);
  cape.position.set(0, 0.8, -0.26);
  cape.rotation.x = 0.15;
  group.add(cape);

  // Head & Crowned Helmet
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.6;

  const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
  const head = new THREE.Mesh(headGeo, skinMat);
  headGroup.add(head);

  const helmGeo = new THREE.BoxGeometry(0.5, 0.25, 0.5);
  const helm = new THREE.Mesh(helmGeo, goldTrimMat);
  helm.position.y = 0.18;
  headGroup.add(helm);

  // Hero Crown Plume
  const plumeGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
  const plume = new THREE.Mesh(plumeGeo, getMaterial(0xef4444, 0.4, 0.1, 0x550000));
  plume.position.set(0, 0.4, -0.05);
  plume.rotation.x = -0.3;
  headGroup.add(plume);

  group.add(headGroup);
  group.userData.head = headGroup;

  // Legs
  const legMat = getMaterial(0x334155, 0.5, 0.3);
  const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.26);

  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.2, 0.32, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);
  group.userData.leftLeg = leftLeg;

  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.2, 0.32, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);
  group.userData.rightLeg = rightLeg;

  // Arms
  const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);

  const leftArm = new THREE.Mesh(armGeo, armorMat);
  leftArm.position.set(-0.48, 1.0, 0);
  leftArm.castShadow = true;
  group.add(leftArm);
  group.userData.leftArm = leftArm;

  const rightArm = new THREE.Group();
  rightArm.position.set(0.48, 1.0, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, armorMat);
  rightArmMesh.position.y = -0.15;
  rightArm.add(rightArmMesh);

  // Hero Greatsword
  const swordGroup = new THREE.Group();
  swordGroup.position.set(0, -0.35, 0.3);

  // Hilt
  const hiltGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6);
  const hilt = new THREE.Mesh(hiltGeo, goldTrimMat);
  hilt.rotation.x = Math.PI / 2;
  swordGroup.add(hilt);

  // Crossguard
  const guardGeo = new THREE.BoxGeometry(0.35, 0.08, 0.08);
  const guard = new THREE.Mesh(guardGeo, goldTrimMat);
  guard.position.z = 0.15;
  swordGroup.add(guard);

  // Glowing Blade
  const bladeGeo = new THREE.BoxGeometry(0.14, 1.1, 0.04);
  const bladeMat = getMaterial(0x93c5fd, 0.1, 0.9, 0x3b82f6);
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.set(0, 0.6, 0.15);
  swordGroup.add(blade);

  rightArm.add(swordGroup);
  group.add(rightArm);
  group.userData.rightArm = rightArm;
  group.userData.weapon = swordGroup;

  group.userData.baseScale = 1.0;
  return group;
}

// 2. SQUAD MEMBER 1: Sir Valerie (Iron Knight / Tank)
export function createKnightModel(): CharacterMeshGroup {
  const group = new THREE.Group() as CharacterMeshGroup;
  group.userData = {};

  const plateMat = getMaterial(0x64748b, 0.3, 0.7); // Steel
  const goldMat = getMaterial(0xeab308, 0.2, 0.8);
  const clothMat = getMaterial(0x15803d, 0.6, 0.1); // Green tabard

  // Bulky Torso
  const torsoGeo = new THREE.BoxGeometry(0.8, 0.85, 0.55);
  const torso = new THREE.Mesh(torsoGeo, plateMat);
  torso.position.y = 0.95;
  torso.castShadow = true;
  group.add(torso);

  const tabardGeo = new THREE.BoxGeometry(0.4, 0.86, 0.57);
  const tabard = new THREE.Mesh(tabardGeo, clothMat);
  tabard.position.y = 0.95;
  group.add(tabard);

  // Full Helmet
  const helmGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const helm = new THREE.Mesh(helmGeo, plateMat);
  helm.position.y = 1.6;
  const visorGeo = new THREE.BoxGeometry(0.35, 0.08, 0.52);
  const visor = new THREE.Mesh(visorGeo, getMaterial(0x0f172a, 0.1, 0.9, 0x00ffff));
  visor.position.y = 1.6;
  group.add(helm);
  group.add(visor);
  group.userData.head = helm;

  // Legs
  const legGeo = new THREE.BoxGeometry(0.28, 0.6, 0.3);
  const leftLeg = new THREE.Mesh(legGeo, plateMat);
  leftLeg.position.set(-0.22, 0.3, 0);
  group.add(leftLeg);
  group.userData.leftLeg = leftLeg;

  const rightLeg = new THREE.Mesh(legGeo, plateMat);
  rightLeg.position.set(0.22, 0.3, 0);
  group.add(rightLeg);
  group.userData.rightLeg = rightLeg;

  // Left Arm with Giant Tower Shield
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.5, 0.95, 0);
  const armMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.22), plateMat);
  armMeshL.position.y = -0.15;
  leftArm.add(armMeshL);

  const shieldGeo = new THREE.BoxGeometry(0.65, 1.1, 0.12);
  const shield = new THREE.Mesh(shieldGeo, goldMat);
  shield.position.set(-0.15, -0.1, 0.25);
  leftArm.add(shield);
  group.add(leftArm);
  group.userData.leftArm = leftArm;
  group.userData.shield = shield;

  // Right Arm with Heavy Mace
  const rightArm = new THREE.Group();
  rightArm.position.set(0.5, 0.95, 0);
  const armMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.22), plateMat);
  armMeshR.position.y = -0.15;
  rightArm.add(armMeshR);

  const maceHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), plateMat);
  maceHandle.position.set(0, -0.1, 0.3);
  maceHandle.rotation.x = Math.PI / 2;
  const maceHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18), goldMat);
  maceHead.position.set(0, 0.35, 0.3);
  rightArm.add(maceHandle);
  rightArm.add(maceHead);

  group.add(rightArm);
  group.userData.rightArm = rightArm;
  group.userData.weapon = rightArm;
  return group;
}

// 3. SQUAD MEMBER 2: Lyra (Elven Ranger)
export function createArcherModel(): CharacterMeshGroup {
  const group = new THREE.Group() as CharacterMeshGroup;
  group.userData = {};

  const leatherMat = getMaterial(0x047857, 0.6, 0.1); // Forest Emerald
  const woodMat = getMaterial(0xd97706, 0.5, 0.1);
  const skinMat = getMaterial(0xfde047, 0.7, 0.1);
  const hairMat = getMaterial(0xfef08a, 0.3, 0.1); // Golden elven hair

  // Slim Torso & Cloak
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), leatherMat);
  torso.position.y = 0.95;
  torso.castShadow = true;
  group.add(torso);

  // Quiver on back
  const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.6, 6), woodMat);
  quiver.position.set(0.15, 1.05, -0.22);
  quiver.rotation.z = -0.3;
  group.add(quiver);

  // Head & Hair
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.5;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), skinMat);
  headGroup.add(head);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 0.42), hairMat);
  hair.position.y = 0.1;
  headGroup.add(hair);

  // Elven Pointed Hood
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 4), leatherMat);
  hood.position.set(0, 0.32, -0.05);
  hood.rotation.x = -0.2;
  headGroup.add(hood);

  group.add(headGroup);
  group.userData.head = headGroup;

  // Legs
  const legGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2);
  const leftLeg = new THREE.Mesh(legGeo, leatherMat);
  leftLeg.position.set(-0.15, 0.32, 0);
  group.add(leftLeg);
  group.userData.leftLeg = leftLeg;

  const rightLeg = new THREE.Mesh(legGeo, leatherMat);
  rightLeg.position.set(0.15, 0.32, 0);
  group.add(rightLeg);
  group.userData.rightLeg = rightLeg;

  // Left Arm (holding Bow)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 0.95, 0);
  const armMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), skinMat);
  armMeshL.position.y = -0.15;
  leftArm.add(armMeshL);

  // Longbow
  const bowTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.04, 6, 12, Math.PI * 0.8),
    woodMat
  );
  bowTorus.position.set(0, -0.15, 0.2);
  bowTorus.rotation.y = Math.PI / 2;
  leftArm.add(bowTorus);
  group.add(leftArm);
  group.userData.leftArm = leftArm;
  group.userData.weapon = bowTorus;

  // Right Arm (drawing string)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 0.95, 0);
  const armMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), skinMat);
  armMeshR.position.y = -0.15;
  rightArm.add(armMeshR);
  group.add(rightArm);
  group.userData.rightArm = rightArm;

  return group;
}

// 4. SQUAD MEMBER 3: Ignis (Pyromancer / Fire Mage)
export function createMageModel(): CharacterMeshGroup {
  const group = new THREE.Group() as CharacterMeshGroup;
  group.userData = {};

  const robeMat = getMaterial(0xd97706, 0.6, 0.1, 0x451a03); // Deep Crimson-Amber Robe
  const goldMat = getMaterial(0xfacc15, 0.2, 0.8);
  const fireMat = getMaterial(0xef4444, 0.2, 0.8, 0xff5500);

  // Mage Robe Body
  const robeGeo = new THREE.ConeGeometry(0.45, 1.2, 8);
  const robe = new THREE.Mesh(robeGeo, robeMat);
  robe.position.y = 0.6;
  robe.castShadow = true;
  group.add(robe);

  // Head with Wizard Hat
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.4;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), getMaterial(0xffedd5, 0.8, 0.1));
  headGroup.add(head);

  // Brim & Cone Hat
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 8), robeMat);
  hatBrim.position.y = 0.2;
  headGroup.add(hatBrim);

  const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 8), robeMat);
  hatCone.position.set(0, 0.5, -0.05);
  hatCone.rotation.x = -0.2;
  headGroup.add(hatCone);

  group.add(headGroup);
  group.userData.head = headGroup;

  // Left Leg / Right Leg beneath robe
  const legGeo = new THREE.BoxGeometry(0.15, 0.4, 0.15);
  const leftLeg = new THREE.Mesh(legGeo, robeMat);
  leftLeg.position.set(-0.15, 0.2, 0);
  group.add(leftLeg);
  group.userData.leftLeg = leftLeg;

  const rightLeg = new THREE.Mesh(legGeo, robeMat);
  rightLeg.position.set(0.15, 0.2, 0);
  group.add(rightLeg);
  group.userData.rightLeg = rightLeg;

  // Arms
  const armGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
  const leftArm = new THREE.Mesh(armGeo, robeMat);
  leftArm.position.set(-0.4, 0.95, 0);
  group.add(leftArm);
  group.userData.leftArm = leftArm;

  // Right Arm holding Fire Staff
  const rightArm = new THREE.Group();
  rightArm.position.set(0.4, 0.95, 0);
  const armR = new THREE.Mesh(armGeo, robeMat);
  armR.position.y = -0.15;
  rightArm.add(armR);

  // Staff
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), goldMat);
  staff.position.set(0, 0.1, 0.25);

  // Floating Fire Core
  const fireOrb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18), fireMat);
  fireOrb.position.set(0, 0.85, 0.25);
  rightArm.add(staff);
  rightArm.add(fireOrb);
  group.add(rightArm);
  group.userData.rightArm = rightArm;
  group.userData.glowOrb = fireOrb;
  group.userData.weapon = staff;

  return group;
}

// 5. SQUAD MEMBER 4: Astrid (Storm / Light Priestess)
export function createPriestessModel(): CharacterMeshGroup {
  const group = new THREE.Group() as CharacterMeshGroup;
  group.userData = {};

  const whiteSilk = getMaterial(0xf8fafc, 0.4, 0.2, 0x1e293b);
  const holyGold = getMaterial(0xfde047, 0.2, 0.9, 0xfacc15);
  const cyanAura = getMaterial(0x38bdf8, 0.1, 0.9, 0x0284c7);

  // Flowing White & Gold Gown
  const gown = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 1.1, 8), whiteSilk);
  gown.position.y = 0.6;
  gown.castShadow = true;
  group.add(gown);

  // Head with Golden Halo
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.45;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), getMaterial(0xfde68a, 0.7, 0.1));
  headGroup.add(head);

  // Glowing Halo
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 8, 16), holyGold);
  halo.position.set(0, 0.3, -0.1);
  halo.rotation.x = Math.PI / 4;
  headGroup.add(halo);

  group.add(headGroup);
  group.userData.head = headGroup;

  // Arms
  const armGeo = new THREE.BoxGeometry(0.16, 0.5, 0.16);
  const leftArm = new THREE.Mesh(armGeo, whiteSilk);
  leftArm.position.set(-0.35, 0.95, 0);
  group.add(leftArm);
  group.userData.leftArm = leftArm;

  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 0.95, 0);
  const armR = new THREE.Mesh(armGeo, whiteSilk);
  armR.position.y = -0.12;
  rightArm.add(armR);

  // Scepter of Light
  const scepter = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 6), holyGold);
  scepter.position.set(0, 0.15, 0.2);
  const topCross = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), cyanAura);
  topCross.position.set(0, 0.8, 0.2);
  rightArm.add(scepter);
  rightArm.add(topCross);
  group.add(rightArm);
  group.userData.rightArm = rightArm;
  group.userData.glowOrb = topCross;

  return group;
}

// 6. SQUAD MEMBER 5: Krom (Dwarven Bombardier)
export function createBombardierModel(): CharacterMeshGroup {
  const group = new THREE.Group() as CharacterMeshGroup;
  group.userData = {};

  const ironMat = getMaterial(0x475569, 0.4, 0.6);
  const copperMat = getMaterial(0xb45309, 0.3, 0.7);
  const beardMat = getMaterial(0xe11d48, 0.7, 0.1); // Flaming red beard

  // Stocky Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.6), ironMat);
  torso.position.y = 0.75;
  torso.castShadow = true;
  group.add(torso);

  // Big Backpack Mortar
  const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), copperMat);
  cannon.position.set(0, 1.0, -0.35);
  cannon.rotation.x = -0.5;
  group.add(cannon);

  // Head with Mining Goggles & Huge Beard
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.25;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.42), getMaterial(0xffedd5, 0.7, 0.1));
  headGroup.add(head);

  // Huge Beard
  const beard = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.25), beardMat);
  beard.position.set(0, -0.22, 0.2);
  headGroup.add(beard);

  // Iron Helm with Goggles
  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.2, 0.46), ironMat);
  helm.position.y = 0.2;
  headGroup.add(helm);

  group.add(headGroup);
  group.userData.head = headGroup;

  // Short Stout Legs
  const legGeo = new THREE.BoxGeometry(0.24, 0.45, 0.26);
  const leftLeg = new THREE.Mesh(legGeo, ironMat);
  leftLeg.position.set(-0.2, 0.22, 0);
  group.add(leftLeg);
  group.userData.leftLeg = leftLeg;

  const rightLeg = new THREE.Mesh(legGeo, ironMat);
  rightLeg.position.set(0.2, 0.22, 0);
  group.add(rightLeg);
  group.userData.rightLeg = rightLeg;

  // Right Hand Cannon / Blunderbuss
  const rightArm = new THREE.Group();
  rightArm.position.set(0.5, 0.75, 0);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), ironMat);
  armR.position.y = -0.1;
  rightArm.add(armR);

  const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.6, 8), copperMat);
  gunBarrel.position.set(0, 0, 0.35);
  gunBarrel.rotation.x = Math.PI / 2;
  rightArm.add(gunBarrel);
  group.add(rightArm);
  group.userData.rightArm = rightArm;
  group.userData.weapon = gunBarrel;

  return group;
}

// 7. SQUAD MEMBER 6: Zephyr (Shadow Assassin)
export function createAssassinModel(): CharacterMeshGroup {
  const group = new THREE.Group() as CharacterMeshGroup;
  group.userData = {};

  const stealthMat = getMaterial(0x0f172a, 0.4, 0.3); // Midnight Black
  const purpleMat = getMaterial(0xa855f7, 0.2, 0.8, 0x6b21a8); // Void Purple

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), stealthMat);
  torso.position.y = 0.95;
  group.add(torso);

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.45;
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), stealthMat);
  headGroup.add(hood);

  const glowingEyes = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.44), purpleMat);
  glowingEyes.position.y = 0.02;
  headGroup.add(glowingEyes);
  group.add(headGroup);
  group.userData.head = headGroup;

  const legGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2);
  const leftLeg = new THREE.Mesh(legGeo, stealthMat);
  leftLeg.position.set(-0.16, 0.32, 0);
  group.add(leftLeg);
  group.userData.leftLeg = leftLeg;

  const rightLeg = new THREE.Mesh(legGeo, stealthMat);
  rightLeg.position.set(0.16, 0.32, 0);
  group.add(rightLeg);
  group.userData.rightLeg = rightLeg;

  // Dual Poison Daggers
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38, 0.95, 0);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), stealthMat);
  armL.position.y = -0.15;
  leftArm.add(armL);
  const daggerL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.02), purpleMat);
  daggerL.position.set(0, -0.3, 0.15);
  leftArm.add(daggerL);
  group.add(leftArm);
  group.userData.leftArm = leftArm;

  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 0.95, 0);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), stealthMat);
  armR.position.y = -0.15;
  rightArm.add(armR);
  const daggerR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.02), purpleMat);
  daggerR.position.set(0, -0.3, 0.15);
  rightArm.add(daggerR);
  group.add(rightArm);
  group.userData.rightArm = rightArm;

  return group;
}

// ENEMY BUILDERS
export function createEnemyModel(type: string, isBoss: boolean = false): CharacterMeshGroup {
  const group = new THREE.Group() as CharacterMeshGroup;
  group.userData = {};

  if (type === 'goblin_runner') {
    const skin = getMaterial(0x65a30d, 0.6, 0.1);
    const rag = getMaterial(0x78350f, 0.8, 0.1);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.3), rag);
    torso.position.y = 0.6;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.32, 0.35), skin);
    head.position.y = 1.0;
    group.add(head);

    // Goblin Ears
    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), skin);
    earL.position.set(-0.25, 1.05, 0);
    earL.rotation.z = Math.PI / 3;
    group.add(earL);

    const earR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), skin);
    earR.position.set(0.25, 1.05, 0);
    earR.rotation.z = -Math.PI / 3;
    group.add(earR);

    const legGeo = new THREE.BoxGeometry(0.14, 0.4, 0.15);
    const leftLeg = new THREE.Mesh(legGeo, skin);
    leftLeg.position.set(-0.12, 0.2, 0);
    group.add(leftLeg);
    group.userData.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, skin);
    rightLeg.position.set(0.12, 0.2, 0);
    group.add(rightLeg);
    group.userData.rightLeg = rightLeg;

    const dagger = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), getMaterial(0x94a3b8, 0.3, 0.7));
    dagger.position.set(0.3, 0.6, 0.2);
    group.add(dagger);
  } else if (type === 'orc_warrior') {
    const skin = getMaterial(0x166534, 0.7, 0.2);
    const armor = getMaterial(0x374151, 0.4, 0.6);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.6), armor);
    torso.position.y = 1.0;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), skin);
    head.position.y = 1.65;
    group.add(head);

    // Spiked Shoulders
    const padL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 4), armor);
    padL.position.set(-0.55, 1.35, 0);
    group.add(padL);

    const padR = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 4), armor);
    padR.position.set(0.55, 1.35, 0);
    group.add(padR);

    const legGeo = new THREE.BoxGeometry(0.28, 0.65, 0.3);
    const leftLeg = new THREE.Mesh(legGeo, armor);
    leftLeg.position.set(-0.25, 0.32, 0);
    group.add(leftLeg);
    group.userData.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, armor);
    rightLeg.position.set(0.25, 0.32, 0);
    group.add(rightLeg);
    group.userData.rightLeg = rightLeg;

    // Battle Axe
    const axe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.4), getMaterial(0xe11d48, 0.3, 0.8));
    axe.position.set(0.55, 0.9, 0.3);
    group.add(axe);
  } else if (type === 'skeleton_archer') {
    const bone = getMaterial(0xf1f5f9, 0.8, 0.1);
    const darkCloth = getMaterial(0x334155, 0.7, 0.1);

    const ribcage = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.3), darkCloth);
    ribcage.position.y = 0.9;
    group.add(ribcage);

    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), bone);
    skull.position.y = 1.45;
    group.add(skull);

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), getMaterial(0xef4444, 0.1, 0.9, 0xff0000));
    eyeL.position.set(-0.08, 1.45, 0.18);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), getMaterial(0xef4444, 0.1, 0.9, 0xff0000));
    eyeR.position.set(0.08, 1.45, 0.18);
    group.add(eyeR);

    const legGeo = new THREE.BoxGeometry(0.12, 0.65, 0.12);
    const leftLeg = new THREE.Mesh(legGeo, bone);
    leftLeg.position.set(-0.14, 0.32, 0);
    group.add(leftLeg);
    group.userData.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, bone);
    rightLeg.position.set(0.14, 0.32, 0);
    group.add(rightLeg);
    group.userData.rightLeg = rightLeg;

    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 4, 8, Math.PI * 0.8), getMaterial(0x78350f, 0.6, 0.1));
    bow.position.set(0.35, 0.9, 0.2);
    bow.rotation.y = Math.PI / 2;
    group.add(bow);
  } else if (type === 'dark_mage') {
    const robeMat = getMaterial(0x581c87, 0.5, 0.2, 0x2e1065);
    const orbMat = getMaterial(0xc084fc, 0.1, 0.9, 0xa855f7);

    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 8), robeMat);
    robe.position.y = 0.65;
    group.add(robe);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), robeMat);
    hood.position.y = 1.4;
    group.add(hood);

    const darkOrb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), orbMat);
    darkOrb.position.set(0.4, 1.1, 0.3);
    group.add(darkOrb);
    group.userData.glowOrb = darkOrb;
  } else if (type === 'siege_troll') {
    const skin = getMaterial(0x52525b, 0.8, 0.1);
    const trunk = getMaterial(0x451a03, 0.9, 0.1);

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.2), skin);
    body.position.y = 1.5;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), skin);
    head.position.y = 2.65;
    group.add(head);

    const legGeo = new THREE.BoxGeometry(0.5, 0.8, 0.5);
    const leftLeg = new THREE.Mesh(legGeo, skin);
    leftLeg.position.set(-0.45, 0.4, 0);
    group.add(leftLeg);
    group.userData.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, skin);
    rightLeg.position.set(0.45, 0.4, 0);
    group.add(rightLeg);
    group.userData.rightLeg = rightLeg;

    const logClub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 8), trunk);
    logClub.position.set(1.0, 1.8, 0.4);
    logClub.rotation.z = -0.2;
    group.add(logClub);
  } else if (type === 'flying_gargoyle') {
    const stone = getMaterial(0x334155, 0.7, 0.3);
    const redGlow = getMaterial(0xdc2626, 0.2, 0.8, 0xff0000);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), stone);
    body.position.y = 1.8; // Levitating
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), stone);
    head.position.set(0, 2.3, 0.1);
    group.add(head);

    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), redGlow);
    hornL.position.set(-0.15, 2.6, 0);
    group.add(hornL);

    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), redGlow);
    hornR.position.set(0.15, 2.6, 0);
    group.add(hornR);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.9, 0.5, 0.05);
    const wingL = new THREE.Mesh(wingGeo, stone);
    wingL.position.set(-0.7, 2.0, -0.2);
    wingL.rotation.y = 0.4;
    group.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, stone);
    wingR.position.set(0.7, 2.0, -0.2);
    wingR.rotation.y = -0.4;
    group.add(wingR);
    group.userData.wings = [wingL, wingR];
  } else if (isBoss) {
    // BOSS VARIANTS
    const bossMat = getMaterial(
      type === 'ogre_boss' ? 0xb91c1c :
      type === 'treant_boss' ? 0x15803d :
      type === 'mummy_pharaoh_boss' ? 0xeab308 :
      type === 'frost_jotunn_boss' ? 0x0284c7 :
      type === 'dragon_fiend_boss' ? 0x7f1d1d :
      type === 'fey_queen_boss' ? 0xc084fc : 0x000000,
      0.3, 0.6,
      0xff2200
    );

    // Massive Boss Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 1.8), bossMat);
    body.position.y = 2.0;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), bossMat);
    head.position.y = 3.6;
    group.add(head);

    // Glowing Boss Crown / Spikes
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.9, 6), getMaterial(0xf59e0b, 0.1, 0.9, 0xffbb00));
    crown.position.y = 4.4;
    group.add(crown);

    const legGeo = new THREE.BoxGeometry(0.7, 1.2, 0.7);
    const leftLeg = new THREE.Mesh(legGeo, bossMat);
    leftLeg.position.set(-0.7, 0.6, 0);
    group.add(leftLeg);
    group.userData.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, bossMat);
    rightLeg.position.set(0.7, 0.6, 0);
    group.add(rightLeg);
    group.userData.rightLeg = rightLeg;

    // Giant Boss Weapon / Energy Core
    const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 0.6), getMaterial(0xef4444, 0.1, 0.9, 0xff0000));
    weapon.position.set(1.5, 2.2, 0.6);
    group.add(weapon);
  } else {
    // Fallback enemy
    const fallbackMat = getMaterial(0xef4444, 0.5, 0.2);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.5), fallbackMat);
    body.position.y = 0.8;
    group.add(body);
  }

  return group;
}
