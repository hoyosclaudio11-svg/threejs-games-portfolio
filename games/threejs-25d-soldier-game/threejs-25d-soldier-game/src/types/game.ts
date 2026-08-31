export type WeaponType = 
  | 'assault_rifle'
  | 'shotgun'
  | 'plasma_rifle'
  | 'minigun'
  | 'rocket_launcher'
  | 'flamethrower'
  | 'laser_beam'
  | 'sniper_railgun';

export type SpecialAbilityType =
  | 'frag_grenade'
  | 'cryo_grenade'
  | 'auto_turret'
  | 'orbital_strike'
  | 'adrenaline_rush'
  | 'shield_burst';

export interface WeaponStats {
  id: WeaponType;
  name: string;
  category: string;
  description: string;
  damage: number;
  fireRate: number; // shots per second
  magazineSize: number;
  currentAmmo: number;
  reserveAmmo: number;
  maxReserveAmmo: number;
  reloadTime: number; // in seconds
  range: number;
  spread: number;
  bulletSpeed: number;
  bulletCount: number; // for shotgun pellets
  piercing: number;
  explosiveRadius?: number;
  color: string;
  unlocked: boolean;
  level: number;
  upgradeCost: number;
}

export type MonsterType = 
  | 'crawler'
  | 'mutant_brute'
  | 'acid_spitter'
  | 'flying_horror'
  | 'cyber_hound'
  | 'shield_golem'
  | 'phantom_stalker'
  | 'bomb_bug'
  | 'boss_sand_behemoth'
  | 'boss_frost_golem'
  | 'boss_hive_queen'
  | 'boss_void_titan';

export interface MonsterStats {
  id: MonsterType;
  name: string;
  displayName: string;
  description: string;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  scoreValue: number;
  creditsValue: number;
  color: string;
  scale: number;
  isBoss?: boolean;
  flying?: boolean;
  hasShield?: boolean;
  shootProjectile?: boolean;
}

export interface ScenarioBiome {
  id: number;
  waveNumber: number;
  name: string;
  subtitle: string;
  description: string;
  fogColor: number;
  fogDensity: number;
  skyColorTop: string;
  skyColorBottom: string;
  ambientLightColor: number;
  ambientIntensity: number;
  directionalLightColor: number;
  directionalIntensity: number;
  groundColor: number;
  groundTextureType: 'urban_concrete' | 'mars_sand' | 'toxic_metal' | 'arctic_ice' | 'volcanic_rock' | 'alien_hive' | 'orbital_metal' | 'void_crystal';
  weatherEffect: 'rain' | 'sandstorm' | 'toxic_gas' | 'blizzard' | 'lava_embers' | 'alien_spores' | 'plasma_dust' | 'void_particles';
  bossType?: MonsterType;
  monstersAllowed: MonsterType[];
  totalMonsterTarget: number;
  spawnInterval: number; // seconds
  concurrentMax: number;
}

export interface SoldierClass {
  id: string;
  name: string;
  title: string;
  description: string;
  baseHp: number;
  baseShield: number;
  baseSpeed: number;
  defaultWeapon: WeaponType;
  specialAbility: SpecialAbilityType;
  primaryColor: string;
  glowColor: string;
  passiveDescription: string;
}

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  level: number;
  maxLevel: number;
  costMultiplier: number;
  apply: (stats: SoldierRuntimeStats) => void;
}

export interface RoguelitePerk {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'offense' | 'defense' | 'utility' | 'special';
  apply: (stats: SoldierRuntimeStats, game: any) => void;
}

export interface SoldierRuntimeStats {
  maxHp: number;
  hp: number;
  maxShield: number;
  shield: number;
  shieldRechargeRate: number;
  shieldRechargeDelay: number;
  moveSpeed: number;
  sprintMultiplier: number;
  jumpForce: number;
  jetpackMaxFuel: number;
  jetpackFuel: number;
  jetpackBurnRate: number;
  jetpackRechargeRate: number;
  dashCooldown: number;
  damageMultiplier: number;
  critChance: number;
  critMultiplier: number;
  lifeSteal: number;
  pickupRadius: number;
  creditBonus: number;
  specialAbilityCooldown: number;
  specialAbilityMaxCharges: number;
  specialAbilityCharges: number;
}

export type PowerupType = 
  | 'medkit'
  | 'shield_pack'
  | 'quad_damage'
  | 'nuke_bomb'
  | 'infinite_ammo'
  | 'time_warp'
  | 'invulnerability';

export interface DropItem {
  id: string;
  type: 'credit' | 'powerup';
  creditValue?: number;
  powerupType?: PowerupType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  lifeTime: number;
  maxLifeTime: number;
  mesh?: any;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
  vy: number;
}

export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  screenShake: boolean;
  bloodEffects: boolean;
  damageNumbers: boolean;
  language: 'es' | 'en';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rewardCredits: number;
}

export interface LeaderboardEntry {
  id: string;
  date: string;
  playerName: string;
  soldierClass: string;
  waveReached: number;
  score: number;
  kills: number;
  bossesDefeated: number;
  timeSurvivedSec: number;
}
