import { UpgradeOption, WaveDefinition, PlayerStats, NestStats, GameSettings } from '../types/game';

export const ARENA_RADIUS = 36;
export const NEST_POSITION = { x: 0, y: 0, z: 0 };
export const NEST_RADIUS = 3.2;

export const INITIAL_PLAYER_STATS: PlayerStats = {
  health: 200,
  maxHealth: 200,
  stamina: 100,
  maxStamina: 100,
  biomass: 0,
  totalBiomassEarned: 0,
  score: 0,
  level: 1,
  
  // Melee Raptorial Scythes
  meleeDamage: 45,
  meleeRange: 4.8,
  attackSpeed: 2.2, // attacks/sec
  
  // Acid Spit
  acidDamage: 65,
  acidCooldown: 0.65,
  acidSplashRadius: 3.5,
  acidPoisonDps: 18,
  
  // Movement
  moveSpeed: 16.5,
  dashSpeed: 38.0,
  dashCooldown: 1.6,
  
  // Passives
  armor: 0.12, // 12% dmg reduction
  lifeLeech: 0.08, // 8% leech
  critChance: 0.15, // 15%
  critMultiplier: 2.0,
  
  // Abilities Cooldowns (secs)
  leapCooldown: 7.0,
  frenzyCooldown: 14.0,
  screechCooldown: 10.0,
  nestPulseCooldown: 12.0
};

export const INITIAL_NEST_STATS: NestStats = {
  health: 600,
  maxHealth: 600,
  shield: 200,
  maxShield: 200,
  shieldRegenRate: 12, // shield per sec out of combat
  pulseCooldown: 12.0,
  sentryCount: 0,
  radius: NEST_RADIUS,
  isUnderAttack: false,
  attackWarningTimer: 0,
  pulseTimer: 0
};

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.75,
  graphicsQuality: 'high',
  showDamageNumbers: true,
  screenShake: true,
  cameraSmoothing: 0.08,
  showFps: true
};

export const UPGRADES_LIST: UpgradeOption[] = [
  {
    id: 'razor_blades',
    title: 'Cuchillas de Quitina Afilada',
    category: 'melee',
    icon: 'Sword',
    description: 'Aumenta el daño de las garras raptoras (+25%) y la velocidad de ataque (+15%).',
    currentLevel: 0,
    maxLevel: 5,
    cost: 50,
    statBonus: (lvl) => ({
      meleeDamage: INITIAL_PLAYER_STATS.meleeDamage * (1 + (lvl + 1) * 0.25),
      attackSpeed: INITIAL_PLAYER_STATS.attackSpeed * (1 + (lvl + 1) * 0.15),
      critChance: INITIAL_PLAYER_STATS.critChance + (lvl + 1) * 0.04
    })
  },
  {
    id: 'toxic_bile',
    title: 'Bilis Cáustica Concentrada',
    category: 'acid',
    icon: 'FlaskConical',
    description: 'Incrementa el daño del escupitajo bio-ácido (+30%) y el radio de explosión (+20%).',
    currentLevel: 0,
    maxLevel: 5,
    cost: 55,
    statBonus: (lvl) => ({
      acidDamage: INITIAL_PLAYER_STATS.acidDamage * (1 + (lvl + 1) * 0.30),
      acidSplashRadius: INITIAL_PLAYER_STATS.acidSplashRadius + (lvl + 1) * 0.6,
      acidPoisonDps: INITIAL_PLAYER_STATS.acidPoisonDps * (1 + (lvl + 1) * 0.25)
    })
  },
  {
    id: 'wings_agility',
    title: 'Membranas Alares de Élite',
    category: 'mobility',
    icon: 'Wind',
    description: 'Aumenta la velocidad de movimiento (+15%) y reduce el enfriamiento del Dash (-20%).',
    currentLevel: 0,
    maxLevel: 4,
    cost: 45,
    statBonus: (lvl) => ({
      moveSpeed: INITIAL_PLAYER_STATS.moveSpeed * (1 + (lvl + 1) * 0.15),
      dashCooldown: Math.max(0.6, INITIAL_PLAYER_STATS.dashCooldown * (1 - (lvl + 1) * 0.18))
    })
  },
  {
    id: 'hardened_carapace',
    title: 'Carapacho Reforzado',
    category: 'survival',
    icon: 'Shield',
    description: 'Aumenta la Salud Máxima de la mantis (+50 HP) y la armadura (+8% reducción).',
    currentLevel: 0,
    maxLevel: 5,
    cost: 60,
    statBonus: (lvl) => ({
      maxHealth: INITIAL_PLAYER_STATS.maxHealth + (lvl + 1) * 50,
      armor: Math.min(0.60, INITIAL_PLAYER_STATS.armor + (lvl + 1) * 0.08)
    })
  },
  {
    id: 'vampiric_mandibles',
    title: 'Mandíbulas Depredadoras',
    category: 'survival',
    icon: 'HeartPulse',
    description: 'Aumenta el robo de vida en cuerpo a cuerpo (+6% por golpe) y probabilidad crítica (+6%).',
    currentLevel: 0,
    maxLevel: 4,
    cost: 70,
    statBonus: (lvl) => ({
      lifeLeech: INITIAL_PLAYER_STATS.lifeLeech + (lvl + 1) * 0.06,
      critChance: INITIAL_PLAYER_STATS.critChance + (lvl + 1) * 0.06,
      critMultiplier: INITIAL_PLAYER_STATS.critMultiplier + (lvl + 1) * 0.25
    })
  },
  {
    id: 'nest_biomembrane',
    title: 'Biomembrana Protectora del Nido',
    category: 'nest',
    icon: 'Egg',
    description: 'Aumenta la vida del Nido (+150 HP), su escudo (+100) y la velocidad de regeneración.',
    currentLevel: 0,
    maxLevel: 5,
    cost: 65,
    statBonus: (lvl) => ({
      nestShield: (lvl + 1) * 100
    })
  },
  {
    id: 'sentry_spore_pods',
    title: 'Esporóforos Centinelas',
    category: 'nest',
    icon: 'Zap',
    description: 'Genera plantas simbióticas alrededor del nido que disparan espinas ácidas a invasores.',
    currentLevel: 0,
    maxLevel: 4,
    cost: 85,
    statBonus: (lvl) => ({
      nestSentry: lvl + 1
    })
  },
  {
    id: 'alpha_predator_mastery',
    title: 'Furia de Mantis Titánica',
    category: 'ultimate',
    icon: 'Flame',
    description: 'Reduce drásticamente el enfriamiento de Salto Letal, Chirrido Sónico y Modo Depredador (-20%).',
    currentLevel: 0,
    maxLevel: 3,
    cost: 110,
    statBonus: (lvl) => ({
      leapCooldown: Math.max(3.5, INITIAL_PLAYER_STATS.leapCooldown * (1 - (lvl + 1) * 0.2)),
      frenzyCooldown: Math.max(7.0, INITIAL_PLAYER_STATS.frenzyCooldown * (1 - (lvl + 1) * 0.2)),
      screechCooldown: Math.max(5.0, INITIAL_PLAYER_STATS.screechCooldown * (1 - (lvl + 1) * 0.2))
    })
  }
];

export const WAVE_DEFINITIONS: WaveDefinition[] = [
  {
    waveNumber: 1,
    title: 'Despertar del Enjambre',
    totalEnemies: 18,
    spawnInterval: 1.4,
    composition: [
      { type: 'ant_worker', weight: 1.0 }
    ],
    rewardBiomass: 60,
    environmentMood: 'day'
  },
  {
    waveNumber: 2,
    title: 'Mandíbulas de Fuego',
    totalEnemies: 26,
    spawnInterval: 1.2,
    composition: [
      { type: 'ant_worker', weight: 0.65 },
      { type: 'ant_soldier', weight: 0.35 }
    ],
    rewardBiomass: 80,
    environmentMood: 'day'
  },
  {
    waveNumber: 3,
    title: 'Incursión Aérea',
    totalEnemies: 34,
    spawnInterval: 1.0,
    composition: [
      { type: 'ant_worker', weight: 0.45 },
      { type: 'ant_soldier', weight: 0.25 },
      { type: 'bee_drone', weight: 0.30 }
    ],
    rewardBiomass: 110,
    environmentMood: 'sunset'
  },
  {
    waveNumber: 4,
    title: 'Bombardeo Corrosivo',
    totalEnemies: 42,
    spawnInterval: 0.9,
    composition: [
      { type: 'ant_worker', weight: 0.30 },
      { type: 'ant_soldier', weight: 0.30 },
      { type: 'ant_acid', weight: 0.25 },
      { type: 'bee_drone', weight: 0.15 }
    ],
    rewardBiomass: 140,
    environmentMood: 'sunset'
  },
  {
    waveNumber: 5,
    title: '¡JEFE: La Reina Avispón Titán!',
    totalEnemies: 35,
    spawnInterval: 1.1,
    composition: [
      { type: 'wasp_hunter', weight: 0.45 },
      { type: 'ant_worker', weight: 0.35 },
      { type: 'ant_soldier', weight: 0.20 }
    ],
    bossType: 'boss_queen_hornet',
    rewardBiomass: 250,
    environmentMood: 'toxic_fog'
  },
  {
    waveNumber: 6,
    title: 'Blindaje de Quitina',
    totalEnemies: 48,
    spawnInterval: 0.85,
    composition: [
      { type: 'ant_worker', weight: 0.25 },
      { type: 'beetle_tank', weight: 0.25 },
      { type: 'ant_acid', weight: 0.30 },
      { type: 'wasp_hunter', weight: 0.20 }
    ],
    rewardBiomass: 180,
    environmentMood: 'toxic_fog'
  },
  {
    waveNumber: 7,
    title: 'Tramperos de Seda Sombría',
    totalEnemies: 54,
    spawnInterval: 0.8,
    composition: [
      { type: 'spider_stalker', weight: 0.35 },
      { type: 'beetle_tank', weight: 0.25 },
      { type: 'ant_soldier', weight: 0.20 },
      { type: 'bee_drone', weight: 0.20 }
    ],
    rewardBiomass: 220,
    environmentMood: 'night'
  },
  {
    waveNumber: 8,
    title: 'Tempestad de Alas y Aguijones',
    totalEnemies: 65,
    spawnInterval: 0.65,
    composition: [
      { type: 'wasp_hunter', weight: 0.40 },
      { type: 'bee_drone', weight: 0.30 },
      { type: 'ant_acid', weight: 0.20 },
      { type: 'beetle_tank', weight: 0.10 }
    ],
    rewardBiomass: 260,
    environmentMood: 'night'
  },
  {
    waveNumber: 9,
    title: 'El Asedio Total',
    totalEnemies: 78,
    spawnInterval: 0.55,
    composition: [
      { type: 'beetle_tank', weight: 0.30 },
      { type: 'spider_stalker', weight: 0.30 },
      { type: 'ant_soldier', weight: 0.25 },
      { type: 'ant_acid', weight: 0.15 }
    ],
    rewardBiomass: 300,
    environmentMood: 'blood_moon'
  },
  {
    waveNumber: 10,
    title: '¡JEFE FINAL: El Escarabajo Ciervo Goliat!',
    totalEnemies: 50,
    spawnInterval: 0.9,
    composition: [
      { type: 'beetle_tank', weight: 0.35 },
      { type: 'wasp_hunter', weight: 0.35 },
      { type: 'spider_stalker', weight: 0.30 }
    ],
    bossType: 'boss_goliath_beetle',
    rewardBiomass: 500,
    environmentMood: 'blood_moon'
  }
];

export function getWaveData(waveNumber: number): WaveDefinition {
  if (waveNumber <= WAVE_DEFINITIONS.length) {
    return WAVE_DEFINITIONS[waveNumber - 1];
  }
  
  // Procedural Endless scaling beyond wave 10
  const loop = waveNumber - 10;
  const isBossWave = waveNumber % 5 === 0;
  const bossType = isBossWave 
    ? (loop % 2 === 1 ? 'boss_queen_hornet' : 'boss_goliath_beetle') 
    : undefined;

  return {
    waveNumber,
    title: isBossWave ? `¡Furia Ancestral: OLEADA ${waveNumber}!` : `Supervivencia Élite - Oleada ${waveNumber}`,
    totalEnemies: Math.floor(60 + loop * 14),
    spawnInterval: Math.max(0.35, 0.7 - loop * 0.03),
    composition: [
      { type: 'beetle_tank', weight: 0.25 },
      { type: 'wasp_hunter', weight: 0.25 },
      { type: 'spider_stalker', weight: 0.20 },
      { type: 'ant_acid', weight: 0.15 },
      { type: 'ant_soldier', weight: 0.15 }
    ],
    bossType,
    rewardBiomass: 300 + loop * 75,
    environmentMood: (['night', 'toxic_fog', 'blood_moon'][loop % 3]) as any
  };
}
