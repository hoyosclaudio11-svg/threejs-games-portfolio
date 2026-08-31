export type FormationMode = 'follow' | 'defend_village' | 'assault' | 'spread';

export type BiomeType = 
  | 'meadows' 
  | 'autumn_forest' 
  | 'desert_ruins' 
  | 'frozen_bastion' 
  | 'volcano_abyss' 
  | 'twilight_grove' 
  | 'shadow_citadel';

export interface Vector2D {
  x: number;
  z: number;
}

export interface UnitSkill {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  cooldown: number; // in seconds
  currentCooldown: number;
  icon: string;
  color: string;
  keybind?: string;
  soundType?: string;
  range?: number;
  areaRadius?: number;
}

export interface UnitStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  attackSpeed: number; // attacks per sec
  attackRange: number;
  critChance: number;
}

export interface SquadMember {
  id: string;
  typeId: string;
  name: string;
  role: string;
  roleEn: string;
  color: string;
  accentColor: string;
  level: number;
  stats: UnitStats;
  skill: UnitSkill;
  position: Vector2D;
  targetPosition: Vector2D;
  targetEnemyId: string | null;
  state: 'idle' | 'moving' | 'attacking' | 'casting' | 'dead';
  animTimer: number;
  attackCooldown: number;
  killCount: number;
  damageDealt: number;
  isUnlocked: boolean;
  modelMesh?: any;
}

export interface HeroCommander {
  name: string;
  level: number;
  stats: UnitStats;
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;
  isDashing: boolean;
  dashCooldown: number;
  dashTimer: number;
  skills: UnitSkill[];
  state: 'idle' | 'moving' | 'attacking' | 'casting' | 'dead';
  animTimer: number;
  attackCooldown: number;
  killCount: number;
  damageDealt: number;
  shield: number;
  maxShield: number;
}

export type EnemyType = 
  | 'goblin_runner'
  | 'orc_warrior'
  | 'skeleton_archer'
  | 'dark_mage'
  | 'siege_troll'
  | 'flying_gargoyle'
  | 'fire_elemental'
  | 'frost_reaper'
  | 'void_assassin'
  | 'ogre_boss'
  | 'treant_boss'
  | 'mummy_pharaoh_boss'
  | 'frost_jotunn_boss'
  | 'dragon_fiend_boss'
  | 'fey_queen_boss'
  | 'dark_overlord_boss';

export interface Enemy {
  id: string;
  type: EnemyType;
  name: string;
  nameEn: string;
  isBoss: boolean;
  isElite: boolean;
  position: Vector2D;
  stats: UnitStats;
  targetType: 'village' | 'hero' | 'squad';
  targetId?: string;
  state: 'moving' | 'attacking' | 'casting' | 'stunned' | 'dead';
  animTimer: number;
  attackCooldown: number;
  specialCooldown: number;
  goldReward: number;
  color: string;
  size: number;
  modelMesh?: any;
  statusEffects: StatusEffect[];
}

export interface StatusEffect {
  type: 'burn' | 'freeze' | 'stun' | 'poison' | 'buff_attack' | 'buff_speed' | 'shield';
  duration: number;
  tickRate?: number;
  tickTimer?: number;
  potency: number;
  color: string;
}

export interface VillageState {
  hp: number;
  maxHp: number;
  level: number;
  barricadeHp: number;
  maxBarricadeHp: number;
  turretLevel: number;
  turretCooldown: number;
  repairRate: number;
  citizenCount: number;
  isUnderAttack: boolean;
  damageFlashTimer: number;
}

export interface Projectile {
  id: string;
  sourceType: 'hero' | 'squad' | 'enemy' | 'turret';
  sourceId: string;
  position: Vector2D;
  height: number;
  velocity: Vector2D;
  vertVelocity: number;
  targetPos: Vector2D;
  damage: number;
  isCrit: boolean;
  splashRadius: number;
  piercing: boolean;
  pierceCount: number;
  color: string;
  type: 'arrow' | 'fireball' | 'lightning' | 'grenade' | 'meteor' | 'dark_orb' | 'ice_lance' | 'holy_beam' | 'turret_bolt';
  lifetime: number;
  maxLifetime: number;
  effectOnHit?: StatusEffect;
  modelMesh?: any;
}

export interface FloatingText {
  id: string;
  text: string;
  position: Vector2D;
  height: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
  fontSize: number;
  isCrit: boolean;
}

export interface WaveScenario {
  waveNumber: number;
  biome: BiomeType;
  name: string;
  nameEn: string;
  subtitle: string;
  subtitleEn: string;
  description: string;
  descriptionEn: string;
  ambientColor: number;
  sunColor: number;
  fogColor: number;
  groundColor: number;
  groundDetailColor: number;
  skyColor: number;
  squadCountGoal: number; // Squad size for this wave (e.g. 2 for wave 1, 3 for wave 2, etc.)
  newSquadUnlockId?: string;
  enemies: {
    type: EnemyType;
    count: number;
    delay: number; // seconds into wave
    interval: number;
  }[];
  boss?: {
    type: EnemyType;
    spawnDelay: number;
  };
  totalGoldReward: number;
  environmentalHazards?: string;
}

export interface RelicItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  cost: number;
  purchased: boolean;
  effectType: 'hero_damage' | 'hero_hp' | 'squad_damage' | 'squad_speed' | 'village_regen' | 'cooldown_reduct' | 'gold_multiplier' | 'revive_token';
  value: number;
}

export interface UpgradeOption {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  category: 'hero' | 'squad' | 'village' | 'relic';
  cost: number;
  level: number;
  maxLevel: number;
  icon: string;
  targetId?: string;
}

export interface GameStats {
  enemiesKilled: number;
  damageDealt: number;
  goldEarned: number;
  wavesCompleted: number;
  comboMax: number;
  timePlayed: number;
  villageDamagePrevented: number;
}
