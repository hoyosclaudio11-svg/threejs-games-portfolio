import { 
  ScenarioBiome, 
  WeaponStats, 
  MonsterStats, 
  SoldierClass, 
  UpgradeItem, 
  RoguelitePerk, 
  Achievement 
} from '../types/game';

// 8 Unique Scenarios (Each wave is a completely different biome!)
export const SCENARIO_BIOMES: ScenarioBiome[] = [
  {
    id: 1,
    waveNumber: 1,
    name: "Sector Urbano 7 - Zona Cero",
    subtitle: "Invasión en los Callejones Neón",
    description: "Una metrópolis ciberpunk en ruinas invadida por enjambres mutantes iniciales.",
    fogColor: 0x07111e,
    fogDensity: 0.015,
    skyColorTop: "#020617",
    skyColorBottom: "#0f172a",
    ambientLightColor: 0x38bdf8,
    ambientIntensity: 0.7,
    directionalLightColor: 0x60a5fa,
    directionalIntensity: 1.2,
    groundColor: 0x1e293b,
    groundTextureType: 'urban_concrete',
    weatherEffect: 'rain',
    monstersAllowed: ['crawler', 'mutant_brute'],
    totalMonsterTarget: 22,
    spawnInterval: 1.6,
    concurrentMax: 8,
  },
  {
    id: 2,
    waveNumber: 2,
    name: "Cañón Carmesí - Marte Biolab",
    subtitle: "Alerta de Tormenta de Arena y Behemoth",
    description: "Tierras desérticas radioactivas donde los rastreros han mutado con caparazones feroces.",
    fogColor: 0x2a0f0a,
    fogDensity: 0.018,
    skyColorTop: "#450a0a",
    skyColorBottom: "#7f1d1d",
    ambientLightColor: 0xf87171,
    ambientIntensity: 0.75,
    directionalLightColor: 0xfca5a5,
    directionalIntensity: 1.4,
    groundColor: 0x451a03,
    groundTextureType: 'mars_sand',
    weatherEffect: 'sandstorm',
    bossType: 'boss_sand_behemoth',
    monstersAllowed: ['crawler', 'mutant_brute', 'cyber_hound'],
    totalMonsterTarget: 28,
    spawnInterval: 1.4,
    concurrentMax: 10,
  },
  {
    id: 3,
    waveNumber: 3,
    name: "Refinería Bio-Química Tóxica",
    subtitle: "Peligro de Ácido y Especímenes Voladores",
    description: "Tanques de desechos corrosivos rotos. Criaturas con glándulas ácidas y enjambres aéreos.",
    fogColor: 0x052e16,
    fogDensity: 0.02,
    skyColorTop: "#064e3b",
    skyColorBottom: "#022c22",
    ambientLightColor: 0x4ade80,
    ambientIntensity: 0.8,
    directionalLightColor: 0x86efac,
    directionalIntensity: 1.3,
    groundColor: 0x14532d,
    groundTextureType: 'toxic_metal',
    weatherEffect: 'toxic_gas',
    monstersAllowed: ['crawler', 'acid_spitter', 'flying_horror', 'bomb_bug'],
    totalMonsterTarget: 34,
    spawnInterval: 1.3,
    concurrentMax: 12,
  },
  {
    id: 4,
    waveNumber: 4,
    name: "Base Ártica Sub-Cero",
    subtitle: "Tempestad de Nieve y el Titán de Hielo",
    description: "Instalación congelada en el polo norte con ventiscas mortales y gólems acorazados de hielo.",
    fogColor: 0x0c2640,
    fogDensity: 0.018,
    skyColorTop: "#082f49",
    skyColorBottom: "#0e7490",
    ambientLightColor: 0x38bdf8,
    ambientIntensity: 0.85,
    directionalLightColor: 0xe0f2fe,
    directionalIntensity: 1.5,
    groundColor: 0x164e63,
    groundTextureType: 'arctic_ice',
    weatherEffect: 'blizzard',
    bossType: 'boss_frost_golem',
    monstersAllowed: ['mutant_brute', 'shield_golem', 'flying_horror', 'crawler'],
    totalMonsterTarget: 40,
    spawnInterval: 1.2,
    concurrentMax: 13,
  },
  {
    id: 5,
    waveNumber: 5,
    name: "Fundición Volcánica del Núcleo",
    subtitle: "Ríos de Magma y Sabuesos Ígneos",
    description: "Cámaras subterráneas de fundición industrial con lava hirviente y bombas vivientes.",
    fogColor: 0x3b0700,
    fogDensity: 0.02,
    skyColorTop: "#7c2d12",
    skyColorBottom: "#431407",
    ambientLightColor: 0xfb923c,
    ambientIntensity: 0.9,
    directionalLightColor: 0xfed7aa,
    directionalIntensity: 1.6,
    groundColor: 0x292524,
    groundTextureType: 'volcanic_rock',
    weatherEffect: 'lava_embers',
    monstersAllowed: ['bomb_bug', 'cyber_hound', 'acid_spitter', 'mutant_brute'],
    totalMonsterTarget: 46,
    spawnInterval: 1.1,
    concurrentMax: 15,
  },
  {
    id: 6,
    waveNumber: 6,
    name: "Nido Colmena Alienígena",
    subtitle: "Matriz Bio-Orgánica y Reina Aracna",
    description: "El corazón orgánico de la infestación alienígena con esporas bioluminiscentes y la Reina Madre.",
    fogColor: 0x2e0854,
    fogDensity: 0.02,
    skyColorTop: "#3b0764",
    skyColorBottom: "#581c87",
    ambientLightColor: 0xc084fc,
    ambientIntensity: 0.85,
    directionalLightColor: 0xe879f9,
    directionalIntensity: 1.4,
    groundColor: 0x3b0764,
    groundTextureType: 'alien_hive',
    weatherEffect: 'alien_spores',
    bossType: 'boss_hive_queen',
    monstersAllowed: ['crawler', 'flying_horror', 'phantom_stalker', 'shield_golem'],
    totalMonsterTarget: 52,
    spawnInterval: 1.0,
    concurrentMax: 16,
  },
  {
    id: 7,
    waveNumber: 7,
    name: "Estación Orbital A-09 en Ruinas",
    subtitle: "Combate Espacial a Gravedad Reducida",
    description: "Estación orbital destrozada al borde de la atmósfera terrestre con defensas automáticas corrompidas.",
    fogColor: 0x020617,
    fogDensity: 0.012,
    skyColorTop: "#000000",
    skyColorBottom: "#0f172a",
    ambientLightColor: 0x818cf8,
    ambientIntensity: 0.8,
    directionalLightColor: 0xa5b4fc,
    directionalIntensity: 1.5,
    groundColor: 0x1e1b4b,
    groundTextureType: 'orbital_metal',
    weatherEffect: 'plasma_dust',
    monstersAllowed: ['phantom_stalker', 'cyber_hound', 'shield_golem', 'bomb_bug', 'acid_spitter'],
    totalMonsterTarget: 58,
    spawnInterval: 0.95,
    concurrentMax: 18,
  },
  {
    id: 8,
    waveNumber: 8,
    name: "La Brecha del Vacío Cósmico",
    subtitle: "Duelo Final: Xul'Gor el Titán del Vacío",
    description: "Una falla espacio-temporal donde la realidad se distorsiona frente al dios devorador de mundos.",
    fogColor: 0x180026,
    fogDensity: 0.018,
    skyColorTop: "#1e1b4b",
    skyColorBottom: "#2e0854",
    ambientLightColor: 0xe879f9,
    ambientIntensity: 0.95,
    directionalLightColor: 0xf472b6,
    directionalIntensity: 1.7,
    groundColor: 0x110e1b,
    groundTextureType: 'void_crystal',
    weatherEffect: 'void_particles',
    bossType: 'boss_void_titan',
    monstersAllowed: ['crawler', 'mutant_brute', 'acid_spitter', 'flying_horror', 'phantom_stalker', 'shield_golem', 'bomb_bug'],
    totalMonsterTarget: 65,
    spawnInterval: 0.9,
    concurrentMax: 20,
  }
];

// Soldier Classes
export const SOLDIER_CLASSES: SoldierClass[] = [
  {
    id: 'commando',
    name: 'Comando de Asalto',
    title: 'Equilibrado y Táctico',
    description: 'Especialista militar con rifle de asalto estándar, buena movilidad y granadas de fragmentación.',
    baseHp: 100,
    baseShield: 50,
    baseSpeed: 7.5,
    defaultWeapon: 'assault_rifle',
    specialAbility: 'frag_grenade',
    primaryColor: '#0284c7', // Sky blue
    glowColor: '#38bdf8',
    passiveDescription: '+15% daño en ráfagas continuas y recarga 20% más rápida.'
  },
  {
    id: 'cyber_samurai',
    name: 'Cyber Ninja / Spec-Ops',
    title: 'Velocidad y Filo Crítico',
    description: 'Guerrero cibernético ultrarrápido con esquivas dobles, katana de plasma y daño crítico letal.',
    baseHp: 80,
    baseShield: 40,
    baseSpeed: 9.0,
    defaultWeapon: 'plasma_rifle',
    specialAbility: 'cryo_grenade',
    primaryColor: '#10b981', // Emerald
    glowColor: '#34d399',
    passiveDescription: '+25% velocidad de movimiento y +15% probabilidad de impacto crítico.'
  },
  {
    id: 'juggernaut',
    name: 'Titán Acorazado',
    title: 'Tanque y Destrucción Masiva',
    description: 'Fortaleza andante con armadura pesada reforzada, minigun y escudo balístico de emergencia.',
    baseHp: 160,
    baseShield: 100,
    baseSpeed: 6.2,
    defaultWeapon: 'minigun',
    specialAbility: 'shield_burst',
    primaryColor: '#f97316', // Orange
    glowColor: '#fb923c',
    passiveDescription: '+60% vida y escudo, reduce daño recibido un 20%.'
  },
  {
    id: 'tech_sniper',
    name: 'Especialista de Plasma',
    title: 'Largo Alcance y Drones',
    description: 'Tirador táctico con cañón de riel perforante de alta potencia y torretas de apoyo automático.',
    baseHp: 90,
    baseShield: 60,
    baseSpeed: 7.0,
    defaultWeapon: 'sniper_railgun',
    specialAbility: 'auto_turret',
    primaryColor: '#a855f7', // Purple
    glowColor: '#c084fc',
    passiveDescription: 'Disparos perforan hasta 4 enemigos y +30% daño a distancia.'
  }
];

// Weapon Catalog
export const WEAPON_DEFINITIONS: Record<string, WeaponStats> = {
  assault_rifle: {
    id: 'assault_rifle',
    name: 'Rifle M-404 Cyber',
    category: 'Rifle de Asalto',
    description: 'Arma automática estándar de alta precisión y cadencia equilibrada.',
    damage: 24,
    fireRate: 8.5, // 8.5 shots/sec
    magazineSize: 32,
    currentAmmo: 32,
    reserveAmmo: 320,
    maxReserveAmmo: 320,
    reloadTime: 1.4,
    range: 28,
    spread: 0.03,
    bulletSpeed: 38,
    bulletCount: 1,
    piercing: 1,
    color: '#38bdf8',
    unlocked: true,
    level: 1,
    upgradeCost: 150
  },
  shotgun: {
    id: 'shotgun',
    name: 'Devastador Escopeta 12G',
    category: 'Escopeta Pesada',
    description: 'Dispara una lluvia de 8 perdigones que destrozan a corta distancia con empuje violento.',
    damage: 16, // per pellet * 8 = 128 total
    fireRate: 1.8,
    magazineSize: 8,
    currentAmmo: 8,
    reserveAmmo: 80,
    maxReserveAmmo: 80,
    reloadTime: 1.8,
    range: 18,
    spread: 0.16,
    bulletSpeed: 32,
    bulletCount: 8,
    piercing: 1,
    color: '#fb923c',
    unlocked: true,
    level: 1,
    upgradeCost: 200
  },
  plasma_rifle: {
    id: 'plasma_rifle',
    name: 'Fusil Némesis Plasma',
    category: 'Energía Térmica',
    description: 'Proyectiles de plasma sobrecalentado que atraviesan enemigos y queman con el tiempo.',
    damage: 38,
    fireRate: 4.8,
    magazineSize: 24,
    currentAmmo: 24,
    reserveAmmo: 240,
    maxReserveAmmo: 240,
    reloadTime: 1.6,
    range: 26,
    spread: 0.02,
    bulletSpeed: 34,
    bulletCount: 1,
    piercing: 2,
    color: '#34d399',
    unlocked: false,
    level: 1,
    upgradeCost: 300
  },
  minigun: {
    id: 'minigun',
    name: 'Vulcan Gatling X-9',
    category: 'Ametralladora Pesada',
    description: 'Cadencia de fuego brutal que desata una tormenta continua de plomo.',
    damage: 18,
    fireRate: 15.0,
    magazineSize: 120,
    currentAmmo: 120,
    reserveAmmo: 600,
    maxReserveAmmo: 600,
    reloadTime: 2.5,
    range: 24,
    spread: 0.08,
    bulletSpeed: 40,
    bulletCount: 1,
    piercing: 1,
    color: '#facc15',
    unlocked: false,
    level: 1,
    upgradeCost: 450
  },
  rocket_launcher: {
    id: 'rocket_launcher',
    name: 'Lanzacohetes Aniquilador',
    category: 'Armamento Explosivo',
    description: 'Misiles autopropulsados con enorme radio de explosión en área.',
    damage: 220,
    fireRate: 0.9,
    magazineSize: 4,
    currentAmmo: 4,
    reserveAmmo: 24,
    maxReserveAmmo: 24,
    reloadTime: 2.2,
    range: 35,
    spread: 0.01,
    bulletSpeed: 22,
    bulletCount: 1,
    piercing: 1,
    explosiveRadius: 5.5,
    color: '#ef4444',
    unlocked: false,
    level: 1,
    upgradeCost: 500
  },
  flamethrower: {
    id: 'flamethrower',
    name: 'Lanzallamas Infierno',
    category: 'Arma Elemental',
    description: 'Chorros continuos de fuego líquido que incineran hordas enteras en segundos.',
    damage: 12, // per tick (rapid)
    fireRate: 25.0,
    magazineSize: 150,
    currentAmmo: 150,
    reserveAmmo: 450,
    maxReserveAmmo: 450,
    reloadTime: 2.0,
    range: 12,
    spread: 0.22,
    bulletSpeed: 18,
    bulletCount: 1,
    piercing: 5,
    color: '#ea580c',
    unlocked: false,
    level: 1,
    upgradeCost: 400
  },
  laser_beam: {
    id: 'laser_beam',
    name: 'Rayo Cortante Hyperion',
    category: 'Láser Continuo',
    description: 'Haz coherente de fotones que perfora instantáneamente todo en línea recta.',
    damage: 15, // per continuous tick
    fireRate: 20.0,
    magazineSize: 100,
    currentAmmo: 100,
    reserveAmmo: 400,
    maxReserveAmmo: 400,
    reloadTime: 1.8,
    range: 30,
    spread: 0.0,
    bulletSpeed: 80,
    bulletCount: 1,
    piercing: 99,
    color: '#a855f7',
    unlocked: false,
    level: 1,
    upgradeCost: 600
  },
  sniper_railgun: {
    id: 'sniper_railgun',
    name: 'Cañón de Riel Orbital',
    category: 'Francotirador Electromagnético',
    description: 'Disparos hipersónicos que atraviesan blindajes pesados con daño devastador.',
    damage: 320,
    fireRate: 0.8,
    magazineSize: 5,
    currentAmmo: 5,
    reserveAmmo: 30,
    maxReserveAmmo: 30,
    reloadTime: 2.1,
    range: 45,
    spread: 0.005,
    bulletSpeed: 90,
    bulletCount: 1,
    piercing: 6,
    color: '#06b6d4',
    unlocked: false,
    level: 1,
    upgradeCost: 550
  }
};

// Monster Bestiary Definitions
export const MONSTER_DEFINITIONS: Record<string, MonsterStats> = {
  crawler: {
    id: 'crawler',
    name: 'Rastrero Ágil',
    displayName: 'Rastrero Ágil',
    description: 'Mutante cuadrúpedo veloz que avanza en manada y salta sobre el soldado.',
    maxHp: 45,
    speed: 5.8,
    damage: 10,
    attackRange: 1.4,
    attackCooldown: 0.8,
    scoreValue: 50,
    creditsValue: 8,
    color: '#22c55e',
    scale: 0.85
  },
  mutant_brute: {
    id: 'mutant_brute',
    name: 'Bruto Mutante',
    displayName: 'Bruto Mutante',
    description: 'Monstruo enorme de musculatura hipertrofiada con un mazo de chatarra.',
    maxHp: 200,
    speed: 3.2,
    damage: 26,
    attackRange: 2.0,
    attackCooldown: 1.4,
    scoreValue: 160,
    creditsValue: 24,
    color: '#dc2626',
    scale: 1.5
  },
  acid_spitter: {
    id: 'acid_spitter',
    name: 'Escupidor Bio-Ácido',
    displayName: 'Escupidor Bio-Ácido',
    description: 'Criatura con abdomen brillante que dispara proyectiles de ácido a distancia.',
    maxHp: 90,
    speed: 3.8,
    damage: 16,
    attackRange: 14.0,
    attackCooldown: 2.2,
    scoreValue: 120,
    creditsValue: 18,
    color: '#84cc16',
    scale: 1.1,
    shootProjectile: true
  },
  flying_horror: {
    id: 'flying_horror',
    name: 'Parásito Alado',
    displayName: 'Parásito Alado',
    description: 'Bestia voladora ágil que sobrevuela esquivando disparos y pica desde las alturas.',
    maxHp: 75,
    speed: 6.2,
    damage: 14,
    attackRange: 1.8,
    attackCooldown: 1.0,
    scoreValue: 140,
    creditsValue: 20,
    color: '#06b6d4',
    scale: 1.0,
    flying: true
  },
  cyber_hound: {
    id: 'cyber_hound',
    name: 'Sabueso Cibernético',
    displayName: 'Sabueso Cibernético',
    description: 'Perro de ataque biomecánico con mandíbulas de titanio y embestida ultrarrápida.',
    maxHp: 110,
    speed: 7.2,
    damage: 18,
    attackRange: 1.6,
    attackCooldown: 0.9,
    scoreValue: 130,
    creditsValue: 16,
    color: '#f97316',
    scale: 1.1
  },
  shield_golem: {
    id: 'shield_golem',
    name: 'Gólem Escudo Blindado',
    displayName: 'Gólem Escudo Blindado',
    description: 'Porta una barrera de energía frontal impenetrable. Debe ser flanqueado o destruido con explosivos.',
    maxHp: 280,
    speed: 2.8,
    damage: 22,
    attackRange: 2.2,
    attackCooldown: 1.5,
    scoreValue: 220,
    creditsValue: 35,
    color: '#3b82f6',
    scale: 1.6,
    hasShield: true
  },
  phantom_stalker: {
    id: 'phantom_stalker',
    name: 'Acechador Fantasma',
    displayName: 'Acechador Fantasma',
    description: 'Entidad sombría que se teletransporta en nubes de niebla y ataca por la espalda.',
    maxHp: 140,
    speed: 6.5,
    damage: 30,
    attackRange: 1.6,
    attackCooldown: 1.8,
    scoreValue: 240,
    creditsValue: 40,
    color: '#9333ea',
    scale: 1.2
  },
  bomb_bug: {
    id: 'bomb_bug',
    name: 'Insecto Kamikaze',
    displayName: 'Insecto Kamikaze',
    description: 'Bicho explosivo que parpadea en rojo al aproximarse y se suicida causando daño masivo en área.',
    maxHp: 50,
    speed: 7.6,
    damage: 55,
    attackRange: 2.2,
    attackCooldown: 0.1,
    scoreValue: 110,
    creditsValue: 14,
    color: '#ef4444',
    scale: 0.9
  },

  // --- MEGA BOSSES ---
  boss_sand_behemoth: {
    id: 'boss_sand_behemoth',
    name: 'Gorgon el Behemoth de Arena',
    displayName: '👑 GORGON (Jefe Ola 2)',
    description: 'Gorgon es un titán subterráneo que sacude la tierra con terremotos y dispara ráfagas de espinas rocosas.',
    maxHp: 2200,
    speed: 3.5,
    damage: 38,
    attackRange: 4.5,
    attackCooldown: 1.6,
    scoreValue: 2000,
    creditsValue: 300,
    color: '#b45309',
    scale: 2.8,
    isBoss: true
  },
  boss_frost_golem: {
    id: 'boss_frost_golem',
    name: 'Frostbite el Titán de Hielo',
    displayName: '👑 FROSTBITE (Jefe Ola 4)',
    description: 'Monstruo colosal de hielo puro que lanza ventiscas congelantes, estalagmitas y embestidas demoledoras.',
    maxHp: 3800,
    speed: 3.2,
    damage: 48,
    attackRange: 4.8,
    attackCooldown: 1.5,
    scoreValue: 3500,
    creditsValue: 500,
    color: '#0284c7',
    scale: 3.2,
    isBoss: true
  },
  boss_hive_queen: {
    id: 'boss_hive_queen',
    name: 'Arachna la Reina Colmena',
    displayName: '👑 ARACHNA (Jefe Ola 6)',
    description: 'La madre de toda la horda biológica. Engendra crías durante la pelea, lanza redes de baba y lluvia de ácido.',
    maxHp: 5500,
    speed: 4.2,
    damage: 54,
    attackRange: 5.2,
    attackCooldown: 1.2,
    scoreValue: 5000,
    creditsValue: 750,
    color: '#7e22ce',
    scale: 3.4,
    isBoss: true
  },
  boss_void_titan: {
    id: 'boss_void_titan',
    name: "Xul'Gor el Devorador del Vacío",
    displayName: "👑 XUL'GOR (JEFE FINAL - Ola 8)",
    description: "Una deidad cósmica interdimensional armada con rayos de antimateria, esferas de gravedad y portales de distorsión.",
    maxHp: 9000,
    speed: 4.6,
    damage: 68,
    attackRange: 6.0,
    attackCooldown: 1.0,
    scoreValue: 10000,
    creditsValue: 1500,
    color: '#c026d3',
    scale: 4.0,
    isBoss: true
  }
};

// Armory Upgrades
export const ARMORY_UPGRADES: UpgradeItem[] = [
  {
    id: 'max_hp',
    name: 'Refuerzo Biológico (+HP)',
    description: 'Aumenta los puntos de vida máxima en +25.',
    icon: 'Heart',
    cost: 100,
    level: 1,
    maxLevel: 10,
    costMultiplier: 1.45,
    apply: (stats) => {
      stats.maxHp += 25;
      stats.hp += 25;
    }
  },
  {
    id: 'max_shield',
    name: 'Generador de Escudo (+Shield)',
    description: 'Aumenta la capacidad del escudo protector en +20.',
    icon: 'Shield',
    cost: 120,
    level: 1,
    maxLevel: 8,
    costMultiplier: 1.5,
    apply: (stats) => {
      stats.maxShield += 20;
      stats.shield += 20;
    }
  },
  {
    id: 'shield_regen',
    name: 'Sobrecarga de Recarga',
    description: 'El escudo comienza a recargarse un 20% más rápido tras recibir daño.',
    icon: 'Zap',
    cost: 140,
    level: 1,
    maxLevel: 5,
    costMultiplier: 1.6,
    apply: (stats) => {
      stats.shieldRechargeRate += 4;
      stats.shieldRechargeDelay = Math.max(1.2, stats.shieldRechargeDelay - 0.3);
    }
  },
  {
    id: 'move_speed',
    name: 'Servomotores de Botas',
    description: 'Aumenta la velocidad de movimiento y carrera en +8%.',
    icon: 'Wind',
    cost: 90,
    level: 1,
    maxLevel: 6,
    costMultiplier: 1.4,
    apply: (stats) => {
      stats.moveSpeed *= 1.08;
    }
  },
  {
    id: 'jetpack_capacity',
    name: 'Tanque Jetpack de Éter',
    description: 'Aumenta la duración del impulso de salto vertical un +25%.',
    icon: 'Rocket',
    cost: 110,
    level: 1,
    maxLevel: 6,
    costMultiplier: 1.45,
    apply: (stats) => {
      stats.jetpackMaxFuel += 25;
      stats.jetpackFuel += 25;
    }
  },
  {
    id: 'damage_boost',
    name: 'Munición de Alto Calibre',
    description: 'Incrementa el daño global de todas las armas en +12%.',
    icon: 'Crosshair',
    cost: 160,
    level: 1,
    maxLevel: 10,
    costMultiplier: 1.55,
    apply: (stats) => {
      stats.damageMultiplier += 0.12;
    }
  },
  {
    id: 'crit_chance',
    name: 'Miras Holográficas de Precisión',
    description: 'Aumenta la probabilidad de disparo crítico en +6%.',
    icon: 'Target',
    cost: 150,
    level: 1,
    maxLevel: 6,
    costMultiplier: 1.5,
    apply: (stats) => {
      stats.critChance += 0.06;
    }
  },
  {
    id: 'life_steal',
    name: 'Nanobots Vampíricos',
    description: 'Recupera un 3% del daño infligido como salud en cada baja enemiga.',
    icon: 'Activity',
    cost: 200,
    level: 1,
    maxLevel: 5,
    costMultiplier: 1.7,
    apply: (stats) => {
      stats.lifeSteal += 0.03;
    }
  },
  {
    id: 'magnet_radius',
    name: 'Imán Gravitacional',
    description: 'Atrae créditos y botiquines a mayor distancia (+3 metros).',
    icon: 'Magnet',
    cost: 80,
    level: 1,
    maxLevel: 5,
    costMultiplier: 1.35,
    apply: (stats) => {
      stats.pickupRadius += 3.0;
    }
  }
];

// Roguelite Wave Perks (Selected after surviving each wave)
export const ROGUELITE_PERKS: RoguelitePerk[] = [
  {
    id: 'perk_frenzy',
    name: 'Furia Berserker',
    description: 'Cada baja aumenta tu velocidad de disparo un 5% acumulable hasta 5 veces.',
    icon: 'Flame',
    rarity: 'rare',
    category: 'offense',
    apply: (stats) => {
      stats.damageMultiplier += 0.15;
    }
  },
  {
    id: 'perk_explosive_rounds',
    name: 'Balas Micro-Explosivas',
    description: 'Tus proyectiles provocan pequeñas detonaciones al impactar.',
    icon: 'Bomb',
    rarity: 'epic',
    category: 'offense',
    apply: (stats) => {
      stats.damageMultiplier += 0.20;
      stats.critChance += 0.05;
    }
  },
  {
    id: 'perk_nanite_armor',
    name: 'Placas Nanotecnológicas',
    description: '+40 Escudo Máximo y genera un pulso de choque al romperse.',
    icon: 'ShieldCheck',
    rarity: 'rare',
    category: 'defense',
    apply: (stats) => {
      stats.maxShield += 40;
      stats.shield += 40;
    }
  },
  {
    id: 'perk_dash_nova',
    name: 'Esquiva Electrostática',
    description: 'Hacer una voltereta/dash deja un rastro de relámpagos que daña a los monstruos.',
    icon: 'Zap',
    rarity: 'rare',
    category: 'utility',
    apply: (stats) => {
      stats.dashCooldown = Math.max(0.6, stats.dashCooldown * 0.8);
    }
  },
  {
    id: 'perk_credit_harvest',
    name: 'Sindicato de Cazarrecompensas',
    description: '+50% más créditos obtenidos al derrotar monstruos y jefes.',
    icon: 'Coins',
    rarity: 'common',
    category: 'utility',
    apply: (stats) => {
      stats.creditBonus += 0.50;
    }
  },
  {
    id: 'perk_godmode_core',
    name: 'Núcleo de Hiper-Potencia',
    description: '+30% Daño Total, +15% Crítico y +50 HP Máximo.',
    icon: 'Sparkles',
    rarity: 'legendary',
    category: 'special',
    apply: (stats) => {
      stats.damageMultiplier += 0.30;
      stats.critChance += 0.15;
      stats.maxHp += 50;
      stats.hp += 50;
    }
  }
];

// Achievements
export const GAME_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: 'Primera Sangre',
    description: 'Elimina a tu primer monstruo invasor.',
    icon: 'Skull',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardCredits: 50
  },
  {
    id: 'wave_3_clear',
    title: 'Superviviente Químico',
    description: 'Sobrevive a la Ola 3 en la refinería tóxica.',
    icon: 'Biohazard',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    rewardCredits: 150
  },
  {
    id: 'boss_slayer',
    title: 'Cazador de Titanes',
    description: 'Derrota a tu primer Mega Jefe de ola.',
    icon: 'Crown',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardCredits: 300
  },
  {
    id: 'monster_massacre',
    title: 'Aniquilación Total',
    description: 'Elimina a 250 monstruos en total.',
    icon: 'Swords',
    unlocked: false,
    progress: 0,
    maxProgress: 250,
    rewardCredits: 400
  },
  {
    id: 'weapon_collector',
    title: 'Arsenal Completo',
    description: 'Desbloquea al menos 4 armas diferentes en la armería.',
    icon: 'Crosshair',
    unlocked: false,
    progress: 0,
    maxProgress: 4,
    rewardCredits: 350
  },
  {
    id: 'void_conqueror',
    title: 'Conquistador del Vacío',
    description: "Derrota a Xul'Gor en la Ola 8 y salva la Tierra.",
    icon: 'Trophy',
    unlocked: false,
    progress: 0,
    maxProgress: 8,
    rewardCredits: 1000
  }
];
