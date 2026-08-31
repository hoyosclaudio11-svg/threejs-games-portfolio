import { WaveScenario, SquadMember } from '../types/game';

export const INITIAL_SQUAD_MEMBERS: SquadMember[] = [
  // Member 1: Sir Valerie (Iron Knight)
  {
    id: 'valerie',
    typeId: 'valerie',
    name: 'Sir Valerie',
    role: 'Vanguard / Provocador',
    roleEn: 'Iron Vanguard / Tank',
    color: '#3b82f6',
    accentColor: '#1d4ed8',
    level: 1,
    isUnlocked: true,
    stats: {
      hp: 320,
      maxHp: 320,
      attack: 35,
      defense: 25,
      moveSpeed: 4.5,
      attackSpeed: 1.1,
      attackRange: 2.2,
      critChance: 0.1
    },
    skill: {
      id: 'shield_charge',
      name: 'Embestida de Escudo',
      nameEn: 'Shield Charge & Taunt',
      description: 'Carga contra una multitud de enemigos, aturdiéndolos y forzando a que lo ataquen a él en lugar de la aldea.',
      descriptionEn: 'Charges into enemy groups, stunning them and forcing aggro away from village.',
      cooldown: 8,
      currentCooldown: 0,
      icon: 'ShieldAlert',
      color: '#3b82f6',
      keybind: '1',
      soundType: 'shield',
      range: 8,
      areaRadius: 4
    },
    position: { x: -2.5, z: 2 },
    targetPosition: { x: -2.5, z: 2 },
    targetEnemyId: null,
    state: 'idle',
    animTimer: 0,
    attackCooldown: 0,
    killCount: 0,
    damageDealt: 0
  },

  // Member 2: Lyra (Elven Ranger)
  {
    id: 'lyra',
    typeId: 'lyra',
    name: 'Lyra la Cazadora',
    role: 'Tiradora a Distancia',
    roleEn: 'Elven Ranger / Sniper',
    color: '#10b981',
    accentColor: '#047857',
    level: 1,
    isUnlocked: true,
    stats: {
      hp: 180,
      maxHp: 180,
      attack: 48,
      defense: 8,
      moveSpeed: 5.2,
      attackSpeed: 1.4,
      attackRange: 10.0,
      critChance: 0.25
    },
    skill: {
      id: 'arrow_rain',
      name: 'Lluvia de Flechas',
      nameEn: 'Rain of Sacred Arrows',
      description: 'Dispara una ráfaga devastadora de 15 flechas de energía celestial que aniquilan hordas a distancia.',
      descriptionEn: 'Unleashes a barrage of 15 celestial arrows decimating enemy swarms at long range.',
      cooldown: 9,
      currentCooldown: 0,
      icon: 'Target',
      color: '#10b981',
      keybind: '2',
      soundType: 'arrow',
      range: 12,
      areaRadius: 6
    },
    position: { x: 2.5, z: 2 },
    targetPosition: { x: 2.5, z: 2 },
    targetEnemyId: null,
    state: 'idle',
    animTimer: 0,
    attackCooldown: 0,
    killCount: 0,
    damageDealt: 0
  },

  // Member 3: Ignis (Pyromancer - Unlocked Wave 2)
  {
    id: 'ignis',
    typeId: 'ignis',
    name: 'Ignis el Piromante',
    role: 'Mago Explosivo / Fuego',
    roleEn: 'Pyromancer / AoE Burst',
    color: '#f97316',
    accentColor: '#ea580c',
    level: 1,
    isUnlocked: false,
    stats: {
      hp: 160,
      maxHp: 160,
      attack: 65,
      defense: 6,
      moveSpeed: 4.8,
      attackSpeed: 0.9,
      attackRange: 8.5,
      critChance: 0.2
    },
    skill: {
      id: 'meteor_strike',
      name: 'Cataclismo Ígneo',
      nameEn: 'Cataclysmic Meteor',
      description: 'Invoca un colosal meteorito en llamas que aplasta e incendia el área de impacto.',
      descriptionEn: 'Summons a flaming meteor from the heavens dealing massive area burn damage.',
      cooldown: 11,
      currentCooldown: 0,
      icon: 'Flame',
      color: '#f97316',
      keybind: '3',
      soundType: 'meteor',
      range: 11,
      areaRadius: 5.5
    },
    position: { x: -3.5, z: -1 },
    targetPosition: { x: -3.5, z: -1 },
    targetEnemyId: null,
    state: 'idle',
    animTimer: 0,
    attackCooldown: 0,
    killCount: 0,
    damageDealt: 0
  },

  // Member 4: Astrid (Light Priestess - Unlocked Wave 3)
  {
    id: 'astrid',
    typeId: 'astrid',
    name: 'Astrid la Iluminada',
    role: 'Sacerdotisa / Sanación y Rayos',
    roleEn: 'Storm Priestess / Healer',
    color: '#38bdf8',
    accentColor: '#0284c7',
    level: 1,
    isUnlocked: false,
    stats: {
      hp: 200,
      maxHp: 200,
      attack: 38,
      defense: 12,
      moveSpeed: 4.9,
      attackSpeed: 1.2,
      attackRange: 7.5,
      critChance: 0.15
    },
    skill: {
      id: 'divine_storm',
      name: 'Tormenta Sagrada y Bendición',
      nameEn: 'Divine Storm & Blessing',
      description: 'Emite una descarga de relámpagos en cadena a 6 enemigos y regenera 100 HP a todo el escuadrón y aldea.',
      descriptionEn: 'Chains lightning to 6 foes and restores 100 HP to squad and village core.',
      cooldown: 12,
      currentCooldown: 0,
      icon: 'Zap',
      color: '#38bdf8',
      keybind: '4',
      soundType: 'heal',
      range: 9,
      areaRadius: 8
    },
    position: { x: 3.5, z: -1 },
    targetPosition: { x: 3.5, z: -1 },
    targetEnemyId: null,
    state: 'idle',
    animTimer: 0,
    attackCooldown: 0,
    killCount: 0,
    damageDealt: 0
  },

  // Member 5: Krom (Dwarven Bombardier - Unlocked Wave 4)
  {
    id: 'krom',
    typeId: 'krom',
    name: 'Krom Rompeacero',
    role: 'Artillero / Mortero y Torretas',
    roleEn: 'Dwarven Bombardier / Artillery',
    color: '#eab308',
    accentColor: '#ca8a04',
    level: 1,
    isUnlocked: false,
    stats: {
      hp: 260,
      maxHp: 260,
      attack: 55,
      defense: 18,
      moveSpeed: 4.2,
      attackSpeed: 0.8,
      attackRange: 9.0,
      critChance: 0.3
    },
    skill: {
      id: 'mortar_barrage',
      name: 'Andanada de Granadas Pesadas',
      nameEn: 'Heavy Mortar Barrage',
      description: 'Lanza 5 bombas de fragmentación consecutivas que rebotan y aturden a todos los enemigos de asedio.',
      descriptionEn: 'Launches 5 heavy mortar shells that bounce and stagger siege monsters.',
      cooldown: 10,
      currentCooldown: 0,
      icon: 'Bomb',
      color: '#eab308',
      keybind: '5',
      soundType: 'grenade',
      range: 10,
      areaRadius: 5
    },
    position: { x: 0, z: -3.5 },
    targetPosition: { x: 0, z: -3.5 },
    targetEnemyId: null,
    state: 'idle',
    animTimer: 0,
    attackCooldown: 0,
    killCount: 0,
    damageDealt: 0
  },

  // Member 6: Zephyr (Shadow Assassin - Unlocked Wave 5)
  {
    id: 'zephyr',
    typeId: 'zephyr',
    name: 'Zephyr Hoja Sombría',
    role: 'Asesino / Ejecución Crítica',
    roleEn: 'Shadow Assassin / Boss Slayer',
    color: '#a855f7',
    accentColor: '#7e22ce',
    level: 1,
    isUnlocked: false,
    stats: {
      hp: 190,
      maxHp: 190,
      attack: 75,
      defense: 10,
      moveSpeed: 6.0,
      attackSpeed: 2.0,
      attackRange: 2.0,
      critChance: 0.45
    },
    skill: {
      id: 'shadow_flurry',
      name: 'Danza de las Mil Sombras',
      nameEn: 'Thousand Shadow Dance',
      description: 'Se teletransporta instantáneamente a través de 8 objetivos asestando golpes críticos con veneno letal.',
      descriptionEn: 'Blinks rapidly through 8 enemies dealing lethal critical poison damage.',
      cooldown: 8,
      currentCooldown: 0,
      icon: 'Crosshair',
      color: '#a855f7',
      keybind: '6',
      soundType: 'slash',
      range: 10,
      areaRadius: 6
    },
    position: { x: -4, z: 2.5 },
    targetPosition: { x: -4, z: 2.5 },
    targetEnemyId: null,
    state: 'idle',
    animTimer: 0,
    attackCooldown: 0,
    killCount: 0,
    damageDealt: 0
  }
];

export const WAVE_SCENARIOS: WaveScenario[] = [
  // WAVE 1
  {
    waveNumber: 1,
    biome: 'meadows',
    name: 'Oleada 1: Pradera Esmeralda',
    nameEn: 'Wave 1: Emerald Meadows Outskirts',
    subtitle: 'Comienzo de la invasión de duendes y exploradores orcos',
    subtitleEn: 'Invasion starts with goblin scouts and orc skirmishers',
    description: 'Los exploradores salvajes atacan la periferia de la aldea. ¡Lidera a tus 2 primeros compañeros: Sir Valerie y Lyra la Cazadora!',
    descriptionEn: 'Wild scouts attack the peaceful outskirts. Lead your first 2 squadmates: Sir Valerie and Lyra the Ranger!',
    ambientColor: 0x86efac,
    sunColor: 0xffedd5,
    fogColor: 0xdcfce7,
    groundColor: 0x22c55e,
    groundDetailColor: 0x16a34a,
    skyColor: 0xbae6fd,
    squadCountGoal: 2,
    enemies: [
      { type: 'goblin_runner', count: 12, delay: 2, interval: 1.5 },
      { type: 'orc_warrior', count: 6, delay: 10, interval: 2.5 },
      { type: 'skeleton_archer', count: 4, delay: 18, interval: 3.0 }
    ],
    boss: {
      type: 'ogre_boss',
      spawnDelay: 25
    },
    totalGoldReward: 250
  },

  // WAVE 2
  {
    waveNumber: 2,
    biome: 'autumn_forest',
    name: 'Oleada 2: Bosque Dorado de Otoño',
    nameEn: 'Wave 2: Whispering Autumn Grove',
    subtitle: '¡Se une Ignis el Piromante! Tu ejército crece a 3 guerreros',
    subtitleEn: 'Ignis the Pyromancer joins! Squad grows to 3 units',
    description: 'Entre las hojas doradas emergen tropas armadas y arqueros oscuros. ¡Utiliza los meteoritos de Ignis!',
    descriptionEn: 'Armored orcs and dark archers breach the golden forest. Use Ignis’s fiery meteors!',
    ambientColor: 0xfde047,
    sunColor: 0xfed7aa,
    fogColor: 0xfef3c7,
    groundColor: 0xb45309,
    groundDetailColor: 0x78350f,
    skyColor: 0xfde68a,
    squadCountGoal: 3,
    newSquadUnlockId: 'ignis',
    enemies: [
      { type: 'goblin_runner', count: 16, delay: 1, interval: 1.2 },
      { type: 'orc_warrior', count: 10, delay: 8, interval: 2.0 },
      { type: 'skeleton_archer', count: 8, delay: 15, interval: 2.2 },
      { type: 'dark_mage', count: 4, delay: 22, interval: 3.0 }
    ],
    boss: {
      type: 'treant_boss',
      spawnDelay: 32
    },
    totalGoldReward: 400
  },

  // WAVE 3
  {
    waveNumber: 3,
    biome: 'desert_ruins',
    name: 'Oleada 3: Ruinas del Oasis Solar',
    nameEn: 'Wave 3: Sunken Oasis Ruins',
    subtitle: '¡Se une Astrid la Sacerdotisa de la Luz! Ahora son 4 guerreros',
    subtitleEn: 'Astrid the Light Priestess joins! Squad grows to 4 units',
    description: 'Bajo el abrasador sol del desierto, criaturas aladas y nigromantes asedian los monolitos sagrados.',
    descriptionEn: 'Flying gargoyles and necromancers swarm under the desert sun. Protect the holy ruins with Astrid’s chain lightning!',
    ambientColor: 0xfcd34d,
    sunColor: 0xffedd5,
    fogColor: 0xfef08a,
    groundColor: 0xeab308,
    groundDetailColor: 0xca8a04,
    skyColor: 0xfed7aa,
    squadCountGoal: 4,
    newSquadUnlockId: 'astrid',
    enemies: [
      { type: 'flying_gargoyle', count: 10, delay: 2, interval: 1.8 },
      { type: 'orc_warrior', count: 12, delay: 8, interval: 1.8 },
      { type: 'dark_mage', count: 8, delay: 14, interval: 2.0 },
      { type: 'siege_troll', count: 3, delay: 22, interval: 5.0 }
    ],
    boss: {
      type: 'mummy_pharaoh_boss',
      spawnDelay: 35
    },
    totalGoldReward: 600
  },

  // WAVE 4
  {
    waveNumber: 4,
    biome: 'frozen_bastion',
    name: 'Oleada 4: Bastión de la Cumbre Helada',
    nameEn: 'Wave 4: Frozen Peak Bastion',
    subtitle: '¡Se une Krom el Artillero Enano! 5 guerreros en formación',
    subtitleEn: 'Krom the Dwarven Bombardier joins! 5 units in formation',
    description: 'Una ventisca gélida azota la fortaleza. Los trolls de asedio y reapers helados marchan a romper las puertas.',
    descriptionEn: 'A freezing blizzard batters the mountain stronghold. Heavy siege trolls march to crush the village gates.',
    ambientColor: 0x93c5fd,
    sunColor: 0xe0f2fe,
    fogColor: 0xbfdbfe,
    groundColor: 0xe2e8f0,
    groundDetailColor: 0x94a3b8,
    skyColor: 0x38bdf8,
    squadCountGoal: 5,
    newSquadUnlockId: 'krom',
    enemies: [
      { type: 'skeleton_archer', count: 14, delay: 1, interval: 1.2 },
      { type: 'siege_troll', count: 5, delay: 8, interval: 3.5 },
      { type: 'flying_gargoyle', count: 12, delay: 16, interval: 1.5 },
      { type: 'orc_warrior', count: 15, delay: 20, interval: 1.5 }
    ],
    boss: {
      type: 'frost_jotunn_boss',
      spawnDelay: 38
    },
    totalGoldReward: 850
  },

  // WAVE 5
  {
    waveNumber: 5,
    biome: 'volcano_abyss',
    name: 'Oleada 5: Caldera de Fuego y Magma',
    nameEn: 'Wave 5: Brimstone Magma Caldera',
    subtitle: '¡Se une Zephyr el Asesino Sombrío! 6 héroes legendarios',
    subtitleEn: 'Zephyr the Shadow Assassin joins! 6 legendary heroes',
    description: 'La tierra se abre con lava ardiente. Los demonios infernales intentan consumir el corazón de la aldea.',
    descriptionEn: 'The earth cracks with burning magma. Infernal demons emerge to annihilate the village heart.',
    ambientColor: 0xf87171,
    sunColor: 0xfecaca,
    fogColor: 0x450a0a,
    groundColor: 0x1c1917,
    groundDetailColor: 0x450a0a,
    skyColor: 0x7f1d1d,
    squadCountGoal: 6,
    newSquadUnlockId: 'zephyr',
    enemies: [
      { type: 'orc_warrior', count: 20, delay: 1, interval: 1.0 },
      { type: 'flying_gargoyle', count: 15, delay: 8, interval: 1.4 },
      { type: 'dark_mage', count: 12, delay: 14, interval: 1.5 },
      { type: 'siege_troll', count: 6, delay: 22, interval: 3.0 }
    ],
    boss: {
      type: 'dragon_fiend_boss',
      spawnDelay: 40
    },
    totalGoldReward: 1200
  },

  // WAVE 6
  {
    waveNumber: 6,
    biome: 'twilight_grove',
    name: 'Oleada 6: Arboleda Crepuscular Mística',
    nameEn: 'Wave 6: Twilight Mystic Glade',
    subtitle: '¡Tu ejército al completo desata combos devastadores!',
    subtitleEn: 'Full squad synergy unlocked with catastrophic combo bursts!',
    description: 'Bajo hongos bioluminiscentes y estrellas púrpuras, la horda espectral ataca sin tregua.',
    descriptionEn: 'Under bioluminescent mushrooms, spectral hordes and illusionists launch a relentless siege.',
    ambientColor: 0xc084fc,
    sunColor: 0xf3e8ff,
    fogColor: 0x3b0764,
    groundColor: 0x3b0764,
    groundDetailColor: 0x581c87,
    skyColor: 0x6b21a8,
    squadCountGoal: 6,
    enemies: [
      { type: 'goblin_runner', count: 25, delay: 1, interval: 0.8 },
      { type: 'skeleton_archer', count: 20, delay: 6, interval: 1.0 },
      { type: 'flying_gargoyle', count: 18, delay: 14, interval: 1.2 },
      { type: 'siege_troll', count: 8, delay: 20, interval: 2.5 }
    ],
    boss: {
      type: 'fey_queen_boss',
      spawnDelay: 42
    },
    totalGoldReward: 1600
  },

  // WAVE 7
  {
    waveNumber: 7,
    biome: 'shadow_citadel',
    name: 'Oleada 7: Asalto a la Ciudadela Maldita (Batalla Final)',
    nameEn: 'Wave 7: Shadow Citadel Final Showdown',
    subtitle: '¡Derrota a Malakor el Señor de la Devastación y salva el reino!',
    subtitleEn: 'Defeat Dark Overlord Malakor and protect the kingdom!',
    description: 'La luna de sangre asciende. El mismísimo Señor Oscuro y sus legiones de pesadilla atacan el núcleo de la aldea.',
    descriptionEn: 'The blood moon rises. Dark Overlord Malakor and elite legions unleash their ultimate apocalypse assault.',
    ambientColor: 0xa855f7,
    sunColor: 0xfecdd3,
    fogColor: 0x18181b,
    groundColor: 0x09090b,
    groundDetailColor: 0x18181b,
    skyColor: 0x2e1065,
    squadCountGoal: 6,
    enemies: [
      { type: 'orc_warrior', count: 30, delay: 1, interval: 0.7 },
      { type: 'dark_mage', count: 18, delay: 6, interval: 1.0 },
      { type: 'siege_troll', count: 10, delay: 12, interval: 2.0 },
      { type: 'flying_gargoyle', count: 22, delay: 18, interval: 1.0 }
    ],
    boss: {
      type: 'dark_overlord_boss',
      spawnDelay: 45
    },
    totalGoldReward: 3000
  }
];

export const SHOP_RELICS = [
  {
    id: 'relic_crown',
    name: 'Corona del Señor de la Guerra',
    nameEn: 'Warlord Crown',
    description: '+30% de Daño de Ataque y +20% Velocidad para TODO el escuadrón',
    descriptionEn: '+30% Attack Damage & +20% Move Speed to ALL squad members',
    icon: 'Crown',
    cost: 500,
    purchased: false,
    effectType: 'squad_damage' as const,
    value: 0.3
  },
  {
    id: 'relic_heart',
    name: 'Corazón de Yggdrasil',
    nameEn: 'Heart of Yggdrasil',
    description: 'Regenera 5% de HP del Núcleo de la Aldea cada 5 segundos',
    descriptionEn: 'Regenerates 5% Village Core HP every 5 seconds',
    icon: 'Heart',
    cost: 450,
    purchased: false,
    effectType: 'village_regen' as const,
    value: 5
  },
  {
    id: 'relic_hourglass',
    name: 'Reloj de Arena del Éter',
    nameEn: 'Aether Hourglass',
    description: '-35% en tiempo de recarga de habilidades de comandante y escuadrón',
    descriptionEn: '-35% Cooldown Reduction on all Hero and Squad skills',
    icon: 'Clock',
    cost: 600,
    purchased: false,
    effectType: 'cooldown_reduct' as const,
    value: 0.35
  },
  {
    id: 'relic_phoenix',
    name: 'Pluma de Fénix Sagrado',
    nameEn: 'Sacred Phoenix Feather',
    description: 'Revive automáticamente al Comandante con 100% HP al caer en combate (1 uso por oleada)',
    descriptionEn: 'Auto-revives the Commander to 100% HP upon fatal blow (1 per wave)',
    icon: 'Sparkles',
    cost: 700,
    purchased: false,
    effectType: 'revive_token' as const,
    value: 1
  },
  {
    id: 'relic_midas',
    name: 'Guantelete de Midas',
    nameEn: 'Midas Gauntlet',
    description: '+50% más de Oro por cada enemigo derrotado y al finalizar la oleada',
    descriptionEn: '+50% Gold gained from slain enemies and wave completions',
    icon: 'Coins',
    cost: 400,
    purchased: false,
    effectType: 'gold_multiplier' as const,
    value: 0.5
  }
];
