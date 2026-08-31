import * as THREE from 'three';
import { BiomeType } from '../types/game';

export interface EnvironmentScene {
  group: THREE.Group;
  animatedObjects: {
    update: (delta: number, elapsed: number) => void;
  }[];
  biome: BiomeType;
  villageCoreMesh: THREE.Object3D;
  turretMeshes: THREE.Object3D[];
  barricadeMeshes: THREE.Object3D[];
  villagerMeshes: THREE.Object3D[];
}

export function buildScenarioEnvironment(biome: BiomeType, _villageLevel: number = 1): EnvironmentScene {
  const group = new THREE.Group();
  const animatedObjects: { update: (delta: number, elapsed: number) => void }[] = [];
  const turretMeshes: THREE.Object3D[] = [];
  const barricadeMeshes: THREE.Object3D[] = [];
  const villagerMeshes: THREE.Object3D[] = [];

  // Ground Setup
  let groundColor = 0x22c55e;
  let groundDetail = 0x16a34a;
  let rockColor = 0x64748b;
  let treeWood = 0x78350f;
  let treeLeaves = 0x15803d;

  if (biome === 'autumn_forest') {
    groundColor = 0xb45309;
    groundDetail = 0x78350f;
    treeLeaves = 0xd97706; // Amber & Red
  } else if (biome === 'desert_ruins') {
    groundColor = 0xeab308;
    groundDetail = 0xca8a04;
    rockColor = 0xd97706;
    treeWood = 0x92400e;
    treeLeaves = 0x65a30d;
  } else if (biome === 'frozen_bastion') {
    groundColor = 0xe2e8f0;
    groundDetail = 0x94a3b8;
    rockColor = 0x475569;
    treeLeaves = 0x38bdf8;
  } else if (biome === 'volcano_abyss') {
    groundColor = 0x1c1917;
    groundDetail = 0x450a0a;
    rockColor = 0x292524;
  } else if (biome === 'twilight_grove') {
    groundColor = 0x3b0764;
    groundDetail = 0x581c87;
    treeLeaves = 0xa855f7;
    rockColor = 0x4c1d95;
  } else if (biome === 'shadow_citadel') {
    groundColor = 0x09090b;
    groundDetail = 0x18181b;
    rockColor = 0x27272a;
  }

  // 1. Terrain Mesh (Large Ground with subtle geometric subdivision)
  const groundGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
  // Add subtle terrain height variations
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    // Keep village center flat (radius 12)
    const distFromCenter = Math.sqrt(x * x + y * y);
    if (distFromCenter > 10) {
      const height = (Math.sin(x * 0.2) + Math.cos(y * 0.2)) * 0.4;
      posAttr.setZ(i, height);
    }
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: groundColor,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true
  });

  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Cobblestone Path to Village
  const pathMat = new THREE.MeshStandardMaterial({ color: groundDetail, roughness: 0.9, flatShading: true });
  for (let i = -16; i <= 16; i += 2.5) {
    const pathTile = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 2.2), pathMat);
    pathTile.position.set(0, 0.02, i);
    pathTile.rotation.y = (Math.sin(i) * 0.1);
    pathTile.receiveShadow = true;
    group.add(pathTile);
  }

  // 2. VILLAGE TOWN HALL / CORE (Defend this at all costs!)
  const villageCoreGroup = new THREE.Group();
  villageCoreGroup.position.set(0, 0, 0);

  // Base Foundation
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.8, 5.5), baseMat);
  baseMesh.position.y = 0.4;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  villageCoreGroup.add(baseMesh);

  // Main Hall Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }); // Warm wood/stone
  const hallMesh = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.4, 4.5), wallMat);
  hallMesh.position.y = 1.9;
  hallMesh.castShadow = true;
  villageCoreGroup.add(hallMesh);

  // Town Hall Roof (Pyramid / Steep pitch)
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 }); // Royal Red Roof
  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.2, 4), roofMat);
  roofMesh.position.y = 4.2;
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.castShadow = true;
  villageCoreGroup.add(roofMesh);

  // Spire & Golden Bell
  const spireMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 }));
  spireMesh.position.y = 5.6;
  villageCoreGroup.add(spireMesh);

  // Glowing Village Heart / Sacred Crystal
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, roughness: 0.1, metalness: 0.9 });
  const crystalMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), crystalMat);
  crystalMesh.position.set(0, 2.8, 2.4);
  villageCoreGroup.add(crystalMesh);

  // Animated crystal hover & spin
  animatedObjects.push({
    update: (_, elapsed) => {
      crystalMesh.rotation.y = elapsed * 1.5;
      crystalMesh.position.y = 2.8 + Math.sin(elapsed * 2.5) * 0.15;
    }
  });

  group.add(villageCoreGroup);

  // 3. DEFENSIVE BARRICADES & WALLS (North, South, East, West choke points)
  const barricadePositions = [
    { x: -5, z: 6, rot: 0.3 },
    { x: 5, z: 6, rot: -0.3 },
    { x: -5, z: -6, rot: -0.3 },
    { x: 5, z: -6, rot: 0.3 },
    { x: -7, z: 0, rot: Math.PI / 2 },
    { x: 7, z: 0, rot: Math.PI / 2 },
  ];

  const woodBarricadeMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  barricadePositions.forEach(pos => {
    const bGroup = new THREE.Group();
    bGroup.position.set(pos.x, 0, pos.z);
    bGroup.rotation.y = pos.rot;

    // Spiked logs
    for (let i = -1.2; i <= 1.2; i += 0.8) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.4, 6), woodBarricadeMat);
      log.position.set(i, 0.7, 0);
      log.rotation.x = 0.2;
      log.castShadow = true;
      bGroup.add(log);
    }
    group.add(bGroup);
    barricadeMeshes.push(bGroup);
  });

  // 4. DEFENSE WATCHTOWERS / TURRETS
  const turretPositions = [
    { x: -8, z: 8 },
    { x: 8, z: 8 },
    { x: -8, z: -8 },
    { x: 8, z: -8 }
  ];

  const stoneMat = new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.8 });
  turretPositions.forEach((pos, idx) => {
    const tGroup = new THREE.Group();
    tGroup.position.set(pos.x, 0, pos.z);

    // Tower Body
    const towerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 3.5, 6), stoneMat);
    towerBody.position.y = 1.75;
    towerBody.castShadow = true;
    tGroup.add(towerBody);

    // Turret Top Platform
    const topPlat = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.0, 0.4, 6), woodBarricadeMat);
    topPlat.position.y = 3.6;
    tGroup.add(topPlat);

    // Ballista / Cannon on Top
    const cannon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1.2), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6 }));
    cannon.position.set(0, 4.0, 0);
    tGroup.add(cannon);

    group.add(tGroup);
    turretMeshes.push(tGroup);

    // Make turrets slowly scan around
    animatedObjects.push({
      update: (_, elapsed) => {
        cannon.rotation.y = elapsed * 0.5 + idx;
      }
    });
  });

  // 5. VILLAGE CITIZENS (Little cheering villagers)
  const citizenPositions = [
    { x: -2.5, z: 2 },
    { x: 2.5, z: 2 },
    { x: -2, z: -2.5 },
    { x: 2, z: -2.5 }
  ];

  citizenPositions.forEach((cPos, idx) => {
    const cGroup = new THREE.Group();
    cGroup.position.set(cPos.x, 0, cPos.z);

    const villagerBody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.25), new THREE.MeshStandardMaterial({ color: 0x3b82f6 + idx * 0x112233 }));
    villagerBody.position.y = 0.45;
    cGroup.add(villagerBody);

    const villagerHead = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    villagerHead.position.y = 0.8;
    cGroup.add(villagerHead);

    group.add(cGroup);
    villagerMeshes.push(cGroup);

    animatedObjects.push({
      update: (_, elapsed) => {
        // Little hop and cheer animation
        cGroup.position.y = Math.abs(Math.sin(elapsed * 4 + idx)) * 0.15;
      }
    });
  });

  // 6. BIOME-SPECIFIC SCENERY & PROPS
  if (biome === 'meadows') {
    // Green Trees, Windmill, Wildflowers
    buildWindmill(group, animatedObjects, 12, -12);
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.3;
      const radius = 16 + Math.random() * 16;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      buildPineOrOakTree(group, tx, tz, treeWood, treeLeaves, 0.8 + Math.random() * 0.6);
    }
  } else if (biome === 'autumn_forest') {
    // Amber & Red Trees, Campfire
    buildCampfire(group, animatedObjects, -10, 10);
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = 15 + Math.random() * 18;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      const leafColor = i % 2 === 0 ? 0xd97706 : 0xb91c1c;
      buildPineOrOakTree(group, tx, tz, treeWood, leafColor, 0.9 + Math.random() * 0.5);
    }
  } else if (biome === 'desert_ruins') {
    // Ancient Sandstone Obelisks, Palm Trees
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const ox = Math.cos(angle) * 18;
      const oz = Math.sin(angle) * 18;
      buildObelisk(group, ox, oz);
      buildPalmTree(group, ox + 3, oz + 3);
    }
  } else if (biome === 'frozen_bastion') {
    // Ice Crystals, Snow Pines, Braziers
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const radius = 16 + Math.random() * 16;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      buildIceSpire(group, tx, tz);
      buildPineOrOakTree(group, tx + 2, tz - 2, 0x334155, 0x93c5fd, 0.9);
    }
  } else if (biome === 'volcano_abyss') {
    // Molten Lava Fissures, Charred Rock Spires
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const rx = Math.cos(angle) * 18;
      const rz = Math.sin(angle) * 18;
      buildVolcanicSpire(group, rx, rz);
    }
    buildLavaPits(group, animatedObjects);
  } else if (biome === 'twilight_grove') {
    // Bioluminescent Mushrooms & Crystal Trees
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const mx = Math.cos(angle) * 17;
      const mz = Math.sin(angle) * 17;
      buildGlowingMushroom(group, animatedObjects, mx, mz, i);
    }
  } else if (biome === 'shadow_citadel') {
    // Gothic Spikes & Void Rifts
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const sx = Math.cos(angle) * 19;
      const sz = Math.sin(angle) * 19;
      buildCitadelSpire(group, sx, sz);
    }
  }

  return {
    group,
    animatedObjects,
    biome,
    villageCoreMesh: villageCoreGroup,
    turretMeshes,
    barricadeMeshes,
    villagerMeshes
  };
}

// Scenery Helpers
function buildPineOrOakTree(parent: THREE.Group, x: number, z: number, woodColor: number, leafColor: number, scale: number) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.set(scale, scale, scale);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.8, 6), new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.9 }));
  trunk.position.y = 0.9;
  trunk.castShadow = true;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.6, flatShading: true });
  // 3-tiered cone foliage
  for (let i = 0; i < 3; i++) {
    const tier = new THREE.Mesh(new THREE.ConeGeometry(1.6 - i * 0.35, 1.4, 6), leafMat);
    tier.position.y = 1.8 + i * 0.9;
    tier.castShadow = true;
    tree.add(tier);
  }
  parent.add(tree);
}

function buildWindmill(parent: THREE.Group, animated: { update: (delta: number, elapsed: number) => void }[], x: number, z: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 5, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }));
  base.position.y = 2.5;
  base.castShadow = true;
  group.add(base);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x991b1b }));
  roof.position.y = 5.9;
  group.add(roof);

  const bladeGroup = new THREE.Group();
  bladeGroup.position.set(0, 4.5, 1.3);

  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 0.05), bladeMat);
    blade.rotation.z = (i * Math.PI) / 2;
    bladeGroup.add(blade);
  }
  group.add(bladeGroup);
  parent.add(group);

  animated.push({
    update: (_, elapsed) => {
      bladeGroup.rotation.z = elapsed * 1.2;
    }
  });
}

function buildCampfire(parent: THREE.Group, animated: { update: (delta: number, elapsed: number) => void }[], x: number, z: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const stones = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.2, 6, 8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
  stones.rotation.x = Math.PI / 2;
  stones.position.y = 0.1;
  group.add(stones);

  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff5500, roughness: 0.2 }));
  fire.position.y = 0.6;
  group.add(fire);
  parent.add(group);

  animated.push({
    update: (_, elapsed) => {
      fire.scale.y = 1.0 + Math.sin(elapsed * 8) * 0.2;
    }
  });
}

function buildObelisk(parent: THREE.Group, x: number, z: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const obeliskMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 4.5, 4), obeliskMat);
  pillar.position.y = 2.25;
  pillar.rotation.y = Math.PI / 4;
  pillar.castShadow = true;
  group.add(pillar);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 4), new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xb45309, metalness: 0.8 }));
  cap.position.y = 5.0;
  cap.rotation.y = Math.PI / 4;
  group.add(cap);

  parent.add(group);
}

function buildPalmTree(parent: THREE.Group, x: number, z: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 4.0, 6), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  trunk.position.y = 2.0;
  trunk.rotation.z = 0.15;
  trunk.castShadow = true;
  group.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.5 });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 1.8), leafMat);
    leaf.position.set(0.3, 4.0, 0);
    leaf.rotation.y = (i * Math.PI) / 3;
    leaf.rotation.x = 0.5;
    group.add(leaf);
  }

  parent.add(group);
}

function buildIceSpire(parent: THREE.Group, x: number, z: number) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    emissive: 0x0284c7,
    roughness: 0.1,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85
  });
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4.5, 6), mat);
  spire.position.set(x, 2.25, z);
  spire.rotation.z = (Math.random() - 0.5) * 0.2;
  spire.castShadow = true;
  parent.add(spire);
}

function buildVolcanicSpire(parent: THREE.Group, x: number, z: number) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.2, 5.0, 6), mat);
  spire.position.set(x, 2.5, z);
  spire.castShadow = true;
  parent.add(spire);

  const lavaTop = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff3300 }));
  lavaTop.position.set(x, 5.0, z);
  parent.add(lavaTop);
}

function buildLavaPits(parent: THREE.Group, animated: { update: (delta: number, elapsed: number) => void }[]) {
  const lavaMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xdc2626, roughness: 0.2 });
  const pit = new THREE.Mesh(new THREE.RingGeometry(12, 14, 16), lavaMat);
  pit.rotation.x = -Math.PI / 2;
  pit.position.y = 0.05;
  parent.add(pit);

  animated.push({
    update: (_, elapsed) => {
      lavaMat.emissiveIntensity = 0.8 + Math.sin(elapsed * 3) * 0.3;
    }
  });
}

function buildGlowingMushroom(parent: THREE.Group, animated: { update: (delta: number, elapsed: number) => void }[], x: number, z: number, seed: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0xf3e8ff }));
  stem.position.y = 0.9;
  group.add(stem);

  const capMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, roughness: 0.3 });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
  cap.position.y = 1.8;
  group.add(cap);

  parent.add(group);

  animated.push({
    update: (_, elapsed) => {
      capMat.emissiveIntensity = 0.7 + Math.sin(elapsed * 2 + seed) * 0.4;
    }
  });
}

function buildCitadelSpire(parent: THREE.Group, x: number, z: number) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4, metalness: 0.7 });
  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.0, 1.6), mat);
  tower.position.set(x, 3.0, z);
  tower.castShadow = true;
  parent.add(tower);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626 });
  const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), eyeMat);
  eye.position.set(x, 6.2, z);
  parent.add(eye);
}
